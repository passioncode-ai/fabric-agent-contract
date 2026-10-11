import { generateKeyPairSync, sign as cryptoSign, type KeyObject } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import * as delegation from "../src/delegation.js";
import { APPROVAL_TYP, DELEGATION_TYP, EFFECT_CLASSES, actionDigest, jcs, readDelegationToken, verifyApproval, verifyDelegation, type Jwks } from "../src/delegation.js";
import { AGENT_ID, PROJECT_REF, RUNNER_KIND, parseFabricLink } from "../src/fabric-links.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";

// The seam review of PR #30 (2026-10-11): each case here failed against b94100f before its fix.
type Json = Record<string, unknown>;
const root = projectRoot();
const load = (relative: string) => JSON.parse(readFileSync(path.join(root, "fixtures", relative), "utf8")) as Json;
const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");
const schema = (name: string) => JSON.parse(read(`schemas/${name}`)) as Json;
const validator = await createValidator();
const valid = (name: string, value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${name}`, value).valid;
const codes = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((f) => f.code);
const paths = (kind: string, value: unknown) => [...new Set(evaluateSemanticRules(kind, value).map((f) => f.instancePath))].sort();

const estate = generateKeyPairSync("ed25519");
const jwk = (key: KeyObject, extra: Json = {}) => ({ ...(key.export({ format: "jwk" }) as Json), kid: "estate-new", use: "sig", alg: "EdDSA", ...extra }) as Jwks["keys"][number];
const jwks: Jwks = { keys: [jwk(estate.publicKey)] };
const segment = (value: Json | string) => Buffer.from(typeof value === "string" ? value : JSON.stringify(value)).toString("base64url");
function sign(payload: Json | string, header: Json | string = { alg: "EdDSA", typ: DELEGATION_TYP, kid: "estate-new" }): string {
  const signing = `${segment(header)}.${segment(payload)}`;
  return `${signing}.${cryptoSign(null, Buffer.from(signing), estate.privateKey).toString("base64url")}`;
}

const claims = load("positive/delegation-token-claims.json");
const NOW = (claims.iat as number) + 30;
const call = { audience: "example-writer", jwks, now: NOW, capability: "writer.write", effect: "draft" as const };
const refusal = (result: { ok: boolean; code?: string; detail?: string }) => (result.ok ? "ok" : `${result.code}/${result.detail}`);

describe("1 — jcs takes JSON only", () => {
  it("refuses a Date, a Map and a class instance instead of reading them as {}", () => {
    expect(() => actionDigest({ at: new Date(0) })).toThrow(TypeError);
    expect(() => jcs(new Map([["a", 1]]))).toThrow(TypeError);
    class Order { amount = 1; }
    expect(() => jcs({ order: new Order() })).toThrow(TypeError);
    expect(() => jcs({ skipped: undefined })).toThrow(TypeError);
    expect(jcs(Object.assign(Object.create(null) as Json, { b: 1, a: [true] }))).toBe('{"a":[true],"b":1}');
    expect(read("docs/specification/delegation.md")).toMatch(/JSON values only/);
  });
});

describe("2 — the meter verifies an onward token minted for it", () => {
  const mint = load("semantic/delegation-mint-meter-ok.json");
  const meterToken = mint.token as Json;
  const meterCall = { meter: "example-meter", capability: "grant.check", jwks, now: (meterToken.iat as number) + 5 };

  it("has a grant-check request that carries the amount and the callee's own jti, never a token", () => {
    expect(valid("grant-check-request.schema.json", load("positive/grant-check-request.json"))).toBe(true);
    expect(valid("grant-check-request.schema.json", load("negative/grant-check-request-with-token.json"))).toBe(false);
  });

  it("FAC-SEM-050: the meter's token is minted under the parent's grant, adds the callee as actor, reads only", () => {
    expect(codes("delegation-mint", mint)).toEqual([]);
    expect(paths("delegation-mint", load("semantic/delegation-mint-meter-wide.json"))).toEqual(["/token/effect", "/token/scope"]);
  });

  it("accepts the onward token and maps every verifier refusal to principal-unproven", () => {
    const accepted = delegation.verifyMeterToken(sign(meterToken), meterCall);
    expect(accepted).toMatchObject({ ok: true, caller: "example-writer", principal: "urn:person:operator" });
    const callerOwn = delegation.verifyMeterToken(sign(claims), meterCall);
    expect(callerOwn).toMatchObject({ ok: false, denial: { decision: "denied", code: "principal-unproven", level: null } });
    if (!callerOwn.ok) {
      expect(valid("grant-check.schema.json", callerOwn.denial)).toBe(true);
      expect(callerOwn.denial.reason).toMatch(/wrong-audience/);
    }
    const late = delegation.verifyMeterToken(sign(meterToken), { ...meterCall, now: (meterToken.exp as number) + 61 });
    expect(late).toMatchObject({ ok: false, denial: { code: "principal-unproven" } });
  });

  it("states the flow in spend policy rule 2, without the per-session registry credential", () => {
    const text = read("docs/specification/spend-policy.md");
    expect(text).toMatch(/onward token/);
    expect(text).not.toMatch(/per-session token minted when the session starts/);
  });
});

describe("3 — FAC-SEM-050 checks every DL-4 claim", () => {
  const cases: Array<[string, string]> = [
    ["wrong-actor", "/token/act/sub"],
    ["before-start", "/token/iat"],
    ["other-grant", "/token/grant"],
    ["unlimited-under-limited", "/token/spend"],
    ["no-project", "/token/project"]
  ];
  it.each(cases)("delegation-mint-%s is refused at %s", (name, at) => {
    const value = load(`semantic/delegation-mint-${name}.json`);
    expect(valid("delegation-token.schema.json", value.token)).toBe(true);
    expect(codes("delegation-mint", value)).toEqual(["FAC-SEM-050"]);
    expect(paths("delegation-mint", value)).toEqual([at]);
  });

  it("defines how a grant's principal names an actor and how a token names a grant", () => {
    expect(read("CONTEXT.md")).toMatch(/urn:agent:<agent id>/);
    expect(read("docs/specification/delegation.md")).toMatch(/`<meta\.id>#<meta\.revision>`/);
  });
});

describe("4 — a present Fabric-Delegation header is the token, even empty", () => {
  it("does not fall through to Authorization", () => {
    expect(readDelegationToken({ "Fabric-Delegation": "", authorization: `Bearer ${sign(claims)}` })).toEqual({ token: "", via: "fabric-delegation" });
    expect(readDelegationToken({ "fabric-delegation": [""] })).toEqual({ token: "", via: "fabric-delegation" });
    expect(refusal(verifyDelegation("", call))).toBe("unauthenticated/malformed");
  });
});

describe("5 — fabric:// links carry no prompt and no credential, anywhere", () => {
  it("refuses the three fixtures under FAC-SEM-052", () => {
    for (const name of ["deep-link-with-prompt", "deep-link-camel-token", "deep-link-fragment-jwt"]) expect(codes("deep-link", load(`semantic/${name}.json`)), name).toEqual(["FAC-SEM-052"]);
  });

  it("matches camelCase credential names and a credential in the fragment", () => {
    for (const name of ["clientSecret", "privateKey", "refreshToken", "sessionToken", "initialPrompt", "instruction", "text", "message"]) {
      expect(parseFabricLink(`fabric://chat?service=example-agent&${name}=x`).ok, name).toBe(false);
    }
    expect(parseFabricLink("fabric://chat?service=example-agent#access_token=abc").ok).toBe(false);
    expect(parseFabricLink("fabric://chat?service=example-agent#section-2").ok).toBe(true);
  });
});

describe("6 — an approval's jti store is required, and the order is stated", () => {
  const approvalClaims = load("positive/approval-claims.json");
  const doc = sign(approvalClaims, { alg: "EdDSA", typ: APPROVAL_TYP, kid: "estate-new" });
  const options = { audience: "example-publisher", jwks, now: (approvalClaims.iat as number) + 60, actionDigest: approvalClaims.actionDigest as string };

  it("refuses unknown-state without a store, and an explicit no-op store is a choice by name", () => {
    // @ts-expect-error jtiStore is required (finding 6)
    expect(refusal(verifyApproval(doc, options))).toBe("unknown-state/no-jti-store");
    expect(refusal(verifyApproval(doc, { ...options, jtiStore: delegation.UNSAFE_NO_JTI_STORE }))).toBe("ok");
    expect(read("docs/specification/delegation.md")).toMatch(/grant check, then `verifyApproval`, which consumes the `jti` last, then the action/);
  });
});

describe("7 — DL-19 is for authorisation refusals and maps the hub's codes", () => {
  it("names the mappings and leaves transport errors to interop", () => {
    const text = read("docs/specification/delegation.md");
    for (const mapping of ["`hub-unavailable` → `issuer-unavailable`", "`binding-revoked` → `grant-revoked`", "`access-required` and `needs-grant` → `no-grant`"]) expect(text).toContain(mapping);
    expect(text).toMatch(/authorisation refusals only/);
  });
});

describe("8 — a denied grant check names its window", () => {
  it("requires window with limit-reached and describes L0 as both limits", () => {
    expect(valid("grant-check.schema.json", load("negative/grant-check-limit-without-window.json"))).toBe(false);
    expect(valid("grant-check.schema.json", load("positive/grant-check-denied.json"))).toBe(true);
    const level = ((schema("grant-check.schema.json").$defs as Json).level as Json).description as string;
    expect(level).toMatch(/provider key's own ceiling/);
  });
});

describe("9 — one definition of an agent id; code constants equal the schemas", () => {
  const common = schema("common.schema.json").$defs as Record<string, Json>;
  it("lives in common.schema.json and is referenced, not copied", () => {
    expect(common.agentId?.pattern).toBe(AGENT_ID.source);
    expect(((schema("interop-agent-call.schema.json").properties as Json).agentId as Json).$ref).toBe("common.schema.json#/$defs/agentId");
    expect(((schema("delegation-token.schema.json").properties as Json).aud as Json).$ref).toBe("common.schema.json#/$defs/agentId");
    expect((((schema("fabric-link.schema.json").oneOf as Json[])[0]!.properties as Json).service as Json).$ref).toBe("common.schema.json#/$defs/agentId");
  });

  it("matches EFFECT_CLASSES, the runner kind and the project ref", () => {
    expect([...EFFECT_CLASSES]).toEqual(common.effectClass?.enum);
    const runners = read("schemas/runners.schema.json");
    expect(runners).toContain(JSON.stringify(RUNNER_KIND.source));
    const link = schema("fabric-link.schema.json");
    expect(((link.$defs as Json).projectRef as Json).pattern).toBe(PROJECT_REF.source);
    expect((((link.oneOf as Json[])[1]!.properties as Json).runner as Json).pattern).toBe(RUNNER_KIND.source);
  });
});

describe("10 — a read-only delegation grant", () => {
  it("omits effects, and mints reads only", () => {
    const grant = load("positive/governance-grant-delegation-read-only.json");
    expect(valid("governance.schema.json", grant)).toBe(true);
    const token = { ...load("positive/delegation-token-claims-minimal.json"), aud: "example-reader", grant: ["urn:grant:project-a:example-agent-reader#1"], project: "urn:project:a", iat: 1_791_720_000, exp: 1_791_720_300 };
    expect(codes("delegation-mint", { grant, token })).toEqual([]);
    expect(paths("delegation-mint", { grant, token: { ...token, effect: ["draft"] } })).toEqual(["/token/effect"]);
  });
});

describe("11 — verifier leniencies closed", () => {
  it("refuses a key not for signing, a future nbf, duplicate members and duplicate kids", () => {
    expect(refusal(verifyDelegation(sign(claims), { ...call, jwks: { keys: [jwk(estate.publicKey, { use: "enc" })] } }))).toBe("unauthenticated/key-not-for-signing");
    expect(refusal(verifyDelegation(sign(claims), { ...call, jwks: { keys: [jwk(estate.publicKey, { alg: "ES256" })] } }))).toBe("unauthenticated/key-not-for-signing");
    expect(refusal(verifyDelegation(sign({ ...claims, nbf: NOW + 61 }), call))).toBe("unauthenticated/not-yet-valid");
    expect(refusal(verifyDelegation(sign({ ...claims, nbf: NOW + 60 }), call))).toBe("ok");
    const duplicated = JSON.stringify(claims).replace(/^\{/, '{"aud":"example-reader",');
    expect(refusal(verifyDelegation(sign(duplicated), call))).toBe("unauthenticated/duplicate-member");
    expect(refusal(verifyDelegation(sign(claims, `{"alg":"EdDSA","typ":"${DELEGATION_TYP}","kid":"estate-old","kid":"estate-new"}`), call))).toBe("unauthenticated/duplicate-member");
    const twice: Jwks = { keys: [jwk(estate.publicKey), jwk(generateKeyPairSync("ed25519").publicKey)] };
    expect(refusal(verifyDelegation(sign(claims), { ...call, jwks: twice }))).toBe("issuer-unavailable/duplicate-kid");
  });
});

describe("12 — a read-only door", () => {
  it("refuses a capability that is not read-only, whatever the ceiling", () => {
    expect(refusal(verifyDelegation(sign({ ...claims, effect: ["draft"] }), { ...call, effect: "draft", readOnly: true }))).toBe("effect-above-ceiling/read-only-door");
    expect(refusal(verifyDelegation(sign(claims), { ...call, effect: "none", readOnly: true }))).toBe("ok");
    expect(read("docs/specification/delegation.md")).toMatch(/read-only door/);
  });
});
