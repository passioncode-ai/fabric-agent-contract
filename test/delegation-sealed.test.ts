import { generateKeyPairSync, sign as cryptoSign, type KeyObject } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import {
  APPROVAL_TYP, DELEGATION_TYP, MAX_CHAIN_DEPTH, createMemoryJtiStore, readDelegationToken, refusalFromDenial, verifyApproval,
  verifyDelegation, verifyMeterToken, type GrantCheckDenial, type Jwks, type VerifyApprovalOptions, type VerifyDelegationOptions,
  type VerifyMeterOptions
} from "../src/delegation.js";
import { parseFabricLink } from "../src/fabric-links.js";
import { operatorSessionExpiresAt, operatorSessionLive } from "../src/operator-session.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";

// Board run 2026-10-11, packet P2-03 (DEC-0045): delegation and spend sealed. Each block names the inventory id it
// closes; each case failed before its fix, or kills a check that a planted defect showed untested.
type Json = Record<string, unknown>;
const root = projectRoot();
const load = (relative: string) => JSON.parse(readFileSync(path.join(root, "fixtures", relative), "utf8")) as Json;
const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");
const validator = await createValidator();
const valid = (schema: string, value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}`, value).valid;
const paths = (kind: string, value: unknown) => [...new Set(evaluateSemanticRules(kind, value).map((f) => f.instancePath))].sort();
const codes = (kind: string, value: unknown) => [...new Set(evaluateSemanticRules(kind, value).map((f) => f.code))];

const estate = generateKeyPairSync("ed25519");
const stranger = generateKeyPairSync("ed25519");
const jwk = (key: KeyObject, extra: Json = {}) => ({ ...(key.export({ format: "jwk" }) as Json), kid: "estate-new", use: "sig", alg: "EdDSA", ...extra }) as Jwks["keys"][number];
const jwks: Jwks = { keys: [jwk(estate.publicKey)] };
const segment = (value: Json) => Buffer.from(JSON.stringify(value)).toString("base64url");
function sign(payload: Json, header: Json = {}, typ = DELEGATION_TYP): string {
  const signing = `${segment({ alg: "EdDSA", typ, kid: "estate-new", ...header })}.${segment(payload)}`;
  return `${signing}.${cryptoSign(null, Buffer.from(signing), estate.privateKey).toString("base64url")}`;
}
const refusal = (result: { ok: boolean; code?: string; detail?: string }) => (result.ok ? "ok" : `${result.code}/${result.detail}`);

const ISSUER = "urn:fabric:estate:example";
const claims = load("positive/delegation-token-claims.json");
const IAT = claims.iat as number;
const EXP = claims.exp as number;
const NOW = IAT + 30;
const call: VerifyDelegationOptions = { audience: "example-writer", jwks, now: NOW, capability: "writer.write", effect: "draft", issuer: ISSUER };
const token = (overrides: Json = {}) => sign({ ...claims, ...overrides });

const meterMint = load("semantic/delegation-mint-meter-ok.json");
const meterClaims = meterMint.token as Json;
const meterCall: VerifyMeterOptions = { meter: "example-meter", capability: "grant.check", jwks, now: (meterClaims.iat as number) + 5, issuer: ISSUER };
const meterRefusal = (result: ReturnType<typeof verifyMeterToken>) => (result.ok ? "ok" : result.denial.reason);

describe("F-B-305 — one grant per token", () => {
  it("the schema holds one reference, and the verifier refuses two as a claim of the wrong type", () => {
    expect(valid("delegation-token.schema.json", claims)).toBe(true);
    expect(valid("delegation-token.schema.json", load("negative/delegation-token-two-grants.json"))).toBe(false);
    expect(refusal(verifyDelegation(sign(load("negative/delegation-token-two-grants.json")), call))).toBe("unauthenticated/malformed-claims");
  });

  it("FAC-SEM-050 refuses a token that names a grant beside the one it was minted under (the audit's probe)", () => {
    expect(paths("delegation-mint", load("semantic/delegation-mint-extra-grant.json"))).toEqual(["/token/grant"]);
  });

  it("the meter's token keeps exactly the parent's reference", () => {
    expect(paths("delegation-mint", load("semantic/delegation-mint-meter-foreign-grant.json"))).toEqual(["/token/grant"]);
    expect(paths("delegation-mint", meterMint)).toEqual([]);
  });
});

describe("F-B-306 — the meter's hop is outside the depth limit, and only it", () => {
  const five = load("semantic/delegation-mint-meter-depth-five.json");
  const parent = five.parent as Json;
  const fiveToken = five.token as Json;

  it("a callee at the fourth hop can be called and can be metered", () => {
    expect(MAX_CHAIN_DEPTH).toBe(4);
    expect(valid("delegation-token.schema.json", parent)).toBe(true);
    expect(refusal(verifyDelegation(sign(parent), { ...call, now: (parent.iat as number) + 5 }))).toBe("ok");
    expect(valid("delegation-token.schema.json", fiveToken)).toBe(true);
    expect(paths("delegation-mint", five)).toEqual([]);
    expect(verifyMeterToken(sign(fiveToken), meterCall)).toMatchObject({ ok: true, caller: "example-writer", chain: ["example-writer", "example-media", "example-agent.default", "example-planner", "example-host"] });
  });

  it("no other token has five actors, and the meter's has no sixth", () => {
    expect(valid("delegation-token.schema.json", load("negative/delegation-token-chain-too-deep.json"))).toBe(false);
    expect(valid("delegation-token.schema.json", load("negative/delegation-token-chain-six.json"))).toBe(false);
    expect(refusal(verifyDelegation(sign({ ...fiveToken, aud: "example-writer", scope: "writer.write", effect: ["draft"] }), { ...call, now: meterCall.now }))).toBe("chain-too-deep/depth-5");
    expect(meterRefusal(verifyMeterToken(sign({ ...fiveToken, act: { sub: "example-proxy", act: fiveToken.act } }), meterCall))).toMatch(/chain-too-deep \(depth-6\)/);
    expect(paths("delegation-mint", load("semantic/delegation-mint-too-deep.json"))).toEqual(["/token/act"]);
  });
});

describe("F-B-314 — no device approval until a decision defines one", () => {
  const approvalClaims = load("positive/approval-claims.json");
  it("the schema and the verifier know prompt and operator-channel only", () => {
    expect(valid("approval.schema.json", load("negative/approval-device-method.json"))).toBe(false);
    const options: VerifyApprovalOptions = { audience: "example-publisher", jwks, now: (approvalClaims.iat as number) + 60, actionDigest: approvalClaims.actionDigest as string, issuer: ISSUER, jtiStore: createMemoryJtiStore() };
    expect(refusal(verifyApproval(sign({ ...approvalClaims, method: "device" }, {}, APPROVAL_TYP), options))).toBe("approval-invalid/malformed-claims");
    expect(refusal(verifyApproval(sign({ ...approvalClaims, method: "prompt" }, {}, APPROVAL_TYP), options))).toBe("ok");
    expect(read("docs/specification/delegation.md")).not.toMatch(/device check/);
  });
});

describe("F-B-301 — one refusal wire: a callee relays the meter's code unchanged", () => {
  it("turns a denied grant check into a refusal of the one set, window and level in error.data", () => {
    for (const name of ["grant-check-denied", "grant-check-denied-call", "grant-check-no-grant"]) {
      const denial = load(`positive/${name}.json`) as unknown as GrantCheckDenial;
      expect(valid("grant-check.schema.json", denial), name).toBe(true);
      const relayed = refusalFromDenial(denial);
      expect(valid("delegation-refusal.schema.json", relayed), name).toBe(true);
      expect(relayed.error.code, name).toBe(denial.code);
      if (denial.window !== undefined) expect(relayed.error.data?.window, name).toBe(denial.window);
      if (denial.level !== null) expect(relayed.error.data?.level, name).toBe(denial.level);
      else expect(relayed.error.data?.level, name).toBeUndefined();
    }
    const filed = refusalFromDenial(load("positive/grant-check-denied.json") as unknown as GrantCheckDenial);
    expect(filed.error.data?.approvalRequest).toBe("urn:approval:project-a:42");
  });

  it("relays the meter's own principal-unproven, and keeps a long reason within the message's bound", () => {
    const refused = verifyMeterToken(sign(claims), meterCall);
    expect(refused.ok).toBe(false);
    if (!refused.ok) expect(refusalFromDenial({ ...refused.denial, reason: "x".repeat(900) })).toMatchObject({ error: { code: "principal-unproven" } });
    if (!refused.ok) expect(valid("delegation-refusal.schema.json", refusalFromDenial({ ...refused.denial, reason: "x".repeat(900) }))).toBe(true);
  });

  it("is stated in DL-19 and DL-21", () => {
    const text = read("docs/specification/delegation.md");
    expect(text).toMatch(/a `denied` is a normal result,\s+not `isError`/);
    expect(text).toMatch(/copies\s+the `code` unchanged into `error\.code`/);
  });
});

describe("F-B-307 — the verifier checks DL-2's types at row 5 and refuses in DL-13's order", () => {
  it("refuses claims of the wrong type as unauthenticated", () => {
    const cases: Array<[string, Json]> = [
      ["actor not an agent id", { act: { sub: "Not An Agent Id!" } }],
      ["nested actor not an agent id", { act: { sub: "example-media", act: { sub: "Nope Nope" } } }],
      ["session not an id", { act: { sub: "example-media", session: 42 } }],
      ["session with a space", { act: { sub: "example-media", session: "two words" } }],
      ["short jti", { jti: "x" }],
      ["numeric jti", { jti: 42 }],
      ["project not a uri", { project: 7 }],
      ["spend not an object", { spend: "lots" }],
      ["spend mode unknown", { spend: { mode: "some" } }],
      ["limited spend without remaining", { spend: { mode: "limited" } }],
      ["spend window unknown", { spend: { mode: "limited", remaining: [{ window: "year", remainingUsd: 1 }] } }],
      ["spend amount negative", { spend: { mode: "limited", remaining: [{ window: "day", remainingUsd: -1 }] } }],
      ["per-call not a number", { spend: { mode: "limited", remaining: [{ window: "day", remainingUsd: 1 }], perCallMaxUsd: "1" } }],
      ["scope double-spaced", { scope: "writer.write  writer.check" }],
      ["scope upper case", { scope: "Writer.write" }],
      ["effect twice", { effect: ["draft", "draft"] }],
      ["iss not a uri", { iss: "estate" }],
      ["sub not a uri", { sub: "operator" }],
      ["aud not an agent id", { aud: "Example Writer" }],
      ["nbf not a time", { nbf: "soon" }]
    ];
    for (const [name, overrides] of cases) expect(refusal(verifyDelegation(token(overrides), call)), name).toMatch(/^unauthenticated\/malformed-(claims|chain)$/);
    expect(refusal(verifyDelegation(token({ act: { sub: "Not An Agent Id!" } }), call))).toBe("unauthenticated/malformed-chain");
    expect(refusal(verifyDelegation(token({ spend: { mode: "unlimited" }, project: "urn:project:b", nbf: IAT }), call))).toBe("ok");
  });

  it("answers the first row that applies, as a port following the table would", () => {
    const late = EXP + 61;
    const order: Array<[string, string, Partial<VerifyDelegationOptions>]> = [
      ["unauthenticated/malformed-chain", token({ act: { sub: "x" }, aud: "example-reader" }), {}],
      ["unauthenticated/malformed-chain", token({ act: { sub: "x" } }), { now: late }],
      ["unauthenticated/malformed-claims", token({ jti: "x" }), { now: late }],
      ["unauthenticated/wrong-issuer", token({ iss: "urn:fabric:estate:other" }), { now: late }],
      ["unauthenticated/lifetime-above-profile", token({ exp: IAT + 601, aud: "example-reader" }), {}],
      ["token-expired/expired", token({ aud: "example-reader" }), { now: late }],
      ["wrong-audience/audience-mismatch", token({ act: load("negative/delegation-token-chain-too-deep.json").act }), { audience: "example-reader" }],
      ["chain-too-deep/depth-5", token({ act: load("negative/delegation-token-chain-too-deep.json").act }), { capability: "writer.send" }],
      ["scope-not-granted/capability-not-in-scope", token(), { capability: "writer.send", effect: "send" }]
    ];
    for (const [expected, presented, options] of order) expect(refusal(verifyDelegation(presented, { ...call, ...options })), expected).toBe(expected);
  });
});

describe("F-B-313 — the issuer check is mandatory", () => {
  const approvalClaims = load("positive/approval-claims.json");
  const approvalOptions = { audience: "example-publisher", jwks, now: (approvalClaims.iat as number) + 60, actionDigest: approvalClaims.actionDigest as string, jtiStore: createMemoryJtiStore() };

  it("refuses issuer-unavailable when the callee names no issuer it trusts", () => {
    // @ts-expect-error issuer is required (F-B-313)
    expect(refusal(verifyDelegation(token(), { ...call, issuer: undefined }))).toBe("issuer-unavailable/no-trusted-issuer");
    // @ts-expect-error issuer is required (F-B-313)
    expect(refusal(verifyApproval(sign(approvalClaims, {}, APPROVAL_TYP), approvalOptions))).toBe("issuer-unavailable/no-trusted-issuer");
    const meter = verifyMeterToken(sign(meterClaims), { ...meterCall, issuer: "" });
    expect(meterRefusal(meter)).toMatch(/issuer-unavailable \(no-trusted-issuer\)/);
  });

  it("refuses another issuer's token at the meter (the issuer reaches the verifier)", () => {
    expect(meterRefusal(verifyMeterToken(sign({ ...meterClaims, iss: "urn:fabric:estate:other" }), meterCall))).toMatch(/unauthenticated \(wrong-issuer\)/);
    expect(meterRefusal(verifyMeterToken(sign(meterClaims), { ...meterCall, issuer: "urn:fabric:estate:other" }))).toMatch(/wrong-issuer/);
  });
});

describe("F-B-312 — the meter reads one capability and nothing else", () => {
  it("refuses an onward token wider than the grant check, whatever its ceiling", () => {
    expect(meterRefusal(verifyMeterToken(sign(meterClaims), meterCall))).toBe("ok");
    expect(meterRefusal(verifyMeterToken(sign({ ...meterClaims, effect: ["send", "charge"] }), meterCall))).toMatch(/effect-above-ceiling \(meter-effect-not-none\)/);
    expect(meterRefusal(verifyMeterToken(sign({ ...meterClaims, effect: ["none", "draft"] }), meterCall))).toMatch(/meter-effect-not-none/);
    expect(meterRefusal(verifyMeterToken(sign({ ...meterClaims, scope: "grant.check writer.write" }), meterCall))).toMatch(/scope-not-granted \(meter-scope-not-exact\)/);
  });
});

describe("F-B-319 — a published key that cannot be used is the issuer's fault", () => {
  it("answers issuer-unavailable for a key of another use or algorithm, as for any unusable key", () => {
    for (const extra of [{ use: "enc" }, { alg: "ES256" }]) {
      expect(refusal(verifyDelegation(token(), { ...call, jwks: { keys: [jwk(estate.publicKey, extra)] } })), JSON.stringify(extra)).toBe("issuer-unavailable/key-not-for-signing");
    }
  });
});

describe("F-B-309 — every security MUST of the verifier has a failing test", () => {
  it("refuses crit, x5u and x5c headers", () => {
    for (const member of ["crit", "x5u", "x5c"]) expect(refusal(verifyDelegation(sign(claims, { [member]: member === "crit" ? ["exp"] : "https://attacker.example/x" }), call)), member).toBe(`unauthenticated/header-${member}`);
  });

  it("never takes a published key that carries a private member", () => {
    const withPrivate = jwk(estate.publicKey, { d: (estate.privateKey.export({ format: "jwk" }) as Json).d });
    expect(refusal(verifyDelegation(token(), { ...call, jwks: { keys: [withPrivate] } }))).toBe("issuer-unavailable/unusable-key");
  });

  it("refuses a signature of the wrong length before verifying it", () => {
    const [h, p, s] = token().split(".") as [string, string, string];
    const longer = Buffer.concat([Buffer.from(s, "base64url"), Buffer.from([0])]).toString("base64url");
    expect(refusal(verifyDelegation(`${h}.${p}.${longer}`, call))).toBe("unauthenticated/bad-signature");
  });

  it("checks an approval's issuer and a future iat", () => {
    const approvalClaims = load("positive/approval-claims.json");
    const options: VerifyApprovalOptions = { audience: "example-publisher", jwks, now: (approvalClaims.iat as number) + 60, actionDigest: approvalClaims.actionDigest as string, issuer: ISSUER, jtiStore: createMemoryJtiStore() };
    expect(refusal(verifyApproval(sign({ ...approvalClaims, iss: "urn:fabric:estate:other" }, {}, APPROVAL_TYP), options))).toBe("approval-invalid/wrong-issuer");
    const future = (approvalClaims.iat as number) + 60 + 61;
    expect(refusal(verifyApproval(sign({ ...approvalClaims, iat: future, exp: future + 3_600 }, {}, APPROVAL_TYP), options))).toBe("approval-invalid/issued-in-future");
  });

  it("takes a bearer as a delegation token only when its typ says so (DL-16)", () => {
    const approval = sign(load("positive/approval-claims.json"), {}, APPROVAL_TYP);
    expect(readDelegationToken({ Authorization: `Bearer ${approval}` })).toBeUndefined();
    expect(readDelegationToken({ Authorization: `Bearer ${sign(claims, { typ: "JWT" })}` })).toBeUndefined();
  });

  it("refuses a token signed by a key the estate never published", () => {
    const signing = `${segment({ alg: "EdDSA", typ: DELEGATION_TYP, kid: "estate-new" })}.${segment(claims)}`;
    const forged = `${signing}.${cryptoSign(null, Buffer.from(signing), stranger.privateKey).toString("base64url")}`;
    expect(refusal(verifyDelegation(forged, call))).toBe("unauthenticated/bad-signature");
  });
});

describe("F-B-308, F-B-322 — every FAC-SEM-050 sub-check has a fixture that only it refuses", () => {
  const cases: Array<[string, string]> = [
    ["meter-without-parent", "/parent"],
    ["session-mismatch", "/token/act/session"],
    ["external-sub", "/token/sub"],
    ["sub-not-issuer", "/token/sub"],
    ["outlives-grant", "/token/exp"],
    ["onward-project", "/token/project"],
    ["onward-chain", "/token/act/act"],
    ["limited-parent-unlimited-child", "/token/spend"],
    ["onward-iss", "/token/iss"],
    ["meter-foreign-grant", "/token/grant"],
    ["meter-effect", "/token/effect"],
    ["bad-principal", "/grant/principal"],
    ["spend-window-not-in-grant", "/token/spend/remaining/3/window"],
    ["spend-above-grant", "/token/spend/remaining/0/remainingUsd"],
    ["per-call-above-grant", "/token/spend/perCallMaxUsd"],
    ["per-call-above-parent", "/token/spend/perCallMaxUsd"]
  ];
  it.each(cases)("delegation-mint-%s is refused at %s only", (name, at) => {
    const value = load(`semantic/delegation-mint-${name}.json`);
    expect(codes("delegation-mint", value)).toEqual(["FAC-SEM-050"]);
    expect(paths("delegation-mint", value)).toEqual([at]);
  });

  it("an onward token of a parent limited per call states a per-call limit too", () => {
    const value = load("semantic/delegation-mint-per-call-above-parent.json");
    const token = { ...(value.token as Json), spend: { ...((value.token as Json).spend as Json) } };
    delete (token.spend as Json).perCallMaxUsd;
    expect(paths("delegation-mint", { ...value, token })).toEqual(["/token/spend/perCallMaxUsd"]);
  });
});

describe("F-B-311 — the session's 7-day bound holds, and a rotation is defined", () => {
  const session = { signedInAt: 1_000_000, lastUsedAt: 1_000_000 + 604_000, tokenRevision: "r1" };

  it("clamps a longer maximum to 7 days after sign-in while the session is in use", () => {
    expect(operatorSessionExpiresAt(session, "r1", { maxSeconds: 30 * 86_400 })).toBe(1_000_000 + 604_800);
    expect(operatorSessionExpiresAt(session, "r1", { idleSeconds: 86_400, maxSeconds: 30 * 86_400 })).toBe(1_000_000 + 604_800);
  });

  it("is live before its end and not at it", () => {
    expect(operatorSessionLive(session, 1_000_000 + 604_799, "r1")).toBe(true);
    expect(operatorSessionLive(session, 1_000_000 + 604_800, "r1")).toBe(false);
  });

  it("defines a rotation in service.md", () => {
    expect(read("docs/specification/service.md")).toMatch(/The descriptor token \*\*rotates\*\* when the value in `auth\.tokenFile` changes/);
  });
});

describe("F-B-317 — ordinary parameter names pass (re-checked after DEC-0041)", () => {
  it("accepts the audit's probes country_code and sort_key, and refuses pass, which FL-4 lists by name", () => {
    expect(parseFabricLink("fabric://chat?service=example-agent&country_code=PL").ok).toBe(true);
    expect(parseFabricLink("fabric://chat?service=example-agent&sort_key=name").ok).toBe(true);
    expect(parseFabricLink("fabric://chat?service=example-agent&pass=1").ok).toBe(false);
  });
});

describe("F-B-318 — the button cookie lives in the page's partition for the session only", () => {
  it("states the partition and the lifetime in FB-6", () => {
    const fb6 = /\*\*FB-6 — [\s\S]*?(?=\*\*FB-7)/.exec(read("docs/specification/fabric-button.md"))?.[0] ?? "";
    expect(fb6).toMatch(/page's own storage\s+partition on the service origin/);
    expect(fb6).toMatch(/session cookie/);
  });
});

describe("TRUST-TIERS — proof starts at the machine boundary (Fabric ADR-0144 amendment 4)", () => {
  const text = read("docs/specification/delegation.md");
  it("defines T0, T1 and T2 and pins the amendment", () => {
    for (const rule of ["DL-25", "DL-26"]) expect(text.match(new RegExp(`\\*\\*${rule} — `, "g")), rule).toHaveLength(1);
    expect(text).toMatch(/\*\*T0\*\*/);
    expect(text).toMatch(/\*\*T1\*\*/);
    expect(text).toMatch(/\*\*T2\*\*/);
    expect(text).toContain("blob/19ad05ca2cf9e830d396a8fca3273b7d5e9c3bc7/docs/adr/0144-");
  });

  it("scopes DL-8 to T2 and keeps the boundary statement about hostile local processes", () => {
    expect(text).toMatch(/\*\*DL-8 — No hub, no token, across the boundary\.\*\*/);
    expect(text).toMatch(/MUST NOT require a\s+delegation token/);
    expect(text).toMatch(/Loopback reachability is not authorization/);
  });
});

describe("the ratchet — checks no earlier test reached, and malformed input that never throws", () => {
  const mint = load("semantic/delegation-mint-ok.json");
  const grant = mint.grant as Json;
  const tokenClaims = mint.token as Json;

  it("FAC-SEM-049 refuses a spend that names a window twice", () => {
    const twice = { ...claims, spend: { mode: "limited", remaining: [{ window: "day", remainingUsd: 1 }, { window: "day", remainingUsd: 2 }] } };
    expect(evaluateSemanticRules("delegation-claims", twice).map((f) => f.instancePath)).toEqual(["/spend/remaining/1/window"]);
  });

  it("FAC-SEM-050 refuses a token for another audience or project than its grant's, and a grant with no per-call maximum to carry", () => {
    expect(paths("delegation-mint", { grant, token: { ...tokenClaims, aud: "example-reader" } })).toEqual(["/token/aud"]);
    expect(paths("delegation-mint", { grant, token: { ...tokenClaims, project: "urn:project:b" } })).toEqual(["/token/project"]);
    const noPerCall = { ...grant, spend: { ...(grant.spend as Json) } };
    delete (noPerCall.spend as Json).perCallMaxUsd;
    expect(evaluateSemanticRules("delegation-mint", { grant: noPerCall, token: { ...tokenClaims, spend: { ...(tokenClaims.spend as Json), perCallMaxUsd: 0.1 } } }).map((f) => f.message)).toEqual(["the grant states no per-call maximum for the token to carry"]);
    const session = { ...grant, principalKind: "session", principal: { ...(grant.principal as Json), id: "urn:session:example-media" } };
    expect(paths("delegation-mint", { grant: session, token: tokenClaims })).toEqual(["/grant/principal"]);
  });

  it("FAC-SEM-050 passes an onward token under an unlimited parent, and refuses a chain grown by more than one", () => {
    const parent = { ...(mint.parent as Json), spend: { mode: "unlimited" } };
    expect(paths("delegation-mint", { ...mint, parent })).toEqual([]);
    const grown = { ...tokenClaims, act: { sub: "example-media", act: { sub: "example-extra", act: (mint.parent as Json).act } } };
    expect(paths("delegation-mint", { ...mint, token: grown })).toEqual(["/token/act", "/token/act/act"]);
  });

  it("FAC-SEM-050 reads input of the wrong shape as findings, never as an exception", () => {
    expect(codes("delegation-mint", {})).toEqual(["FAC-SEM-050"]);
    const wrong = { grant: { ...grant, meta: "x", principal: 1, startsAt: 1, expiresAt: 1, spend: { mode: "limited", limits: "x" } }, token: { ...tokenClaims, act: 1, scope: 1, iat: "x", exp: "x", spend: { mode: "limited", remaining: [1, { window: "day", remainingUsd: "x" }], perCallMaxUsd: "x" } }, parent: { ...(mint.parent as Json), spend: "x" } };
    expect(() => evaluateSemanticRules("delegation-mint", wrong)).not.toThrow();
    expect(codes("delegation-mint", wrong)).toEqual(["FAC-SEM-050"]);
    const limits = { ...grant, spend: { ...(grant.spend as Json), limits: [{ window: "day", limitUsd: "x" }] } };
    expect(paths("delegation-mint", { grant: limits, token: { ...tokenClaims, spend: { mode: "limited", remaining: [{ window: "day", remainingUsd: 1 }] } } })).toEqual(["/token/spend/remaining/0/remainingUsd"]);
    expect(codes("delegation-claims", { ...claims, scope: 7, iat: "x", spend: { mode: "limited", remaining: [{ window: 1, remainingUsd: "x" }] } })).toEqual([]);
    expect(paths("delegation-mint", { grant, token: { ...tokenClaims, spend: { mode: "limited", remaining: "x" } } })).toEqual([]);
    expect(paths("delegation-mint", { grant, token: { ...tokenClaims, spend: { mode: "limited", remaining: [{ window: "day", remainingUsd: "x" }] } } })).toEqual([]);
    expect(paths("delegation-mint", { grant: { ...grant, principalKind: "external", principal: 1 }, token: tokenClaims })).toEqual(["/token/sub"]);
    const share = load("semantic/delegation-mint-external-sub.json");
    expect(paths("delegation-mint", { ...share, token: { ...(share.token as Json), sub: "urn:person:guest" } })).toEqual([]);
    const perCallParent = { ...(mint.parent as Json), spend: { mode: "limited", remaining: [{ window: 1, remainingUsd: 1 }, { window: "day", remainingUsd: 9 }], perCallMaxUsd: 1 } };
    const { spend: _spend, ...noSpend } = tokenClaims;
    expect(paths("delegation-mint", { grant: { ...grant, spend: undefined }, parent: perCallParent, token: noSpend })).toEqual(["/token/spend", "/token/spend/perCallMaxUsd"]);
  });

  it("the verifier refuses a non-object segment, an overlong or non-string token and a bad signature segment, and reads escapes", () => {
    const [h, p, s] = token().split(".") as [string, string, string];
    expect(refusal(verifyDelegation(`${Buffer.from("[1]").toString("base64url")}.${p}.${s}`, call))).toBe("unauthenticated/malformed");
    expect(refusal(verifyDelegation(`${h}.${p}.%%%`, call))).toBe("unauthenticated/malformed");
    expect(refusal(verifyDelegation("a".repeat(8193), call))).toBe("unauthenticated/malformed");
    expect(refusal(verifyDelegation(42 as unknown as string, call))).toBe("unauthenticated/malformed");
    expect(refusal(verifyDelegation(token({ note: 'a "quoted" \\ word' }), call))).toBe("ok");
  });

  it("chainDepth and effectClosure answer the edge cases the rule relies on", async () => {
    const { chainDepth, effectClosure } = await import("../src/delegation.js");
    expect(chainDepth({ sub: 1 })).toBe(Number.POSITIVE_INFINITY);
    let deep: Json = { sub: "a0" };
    for (let i = 1; i < 70; i++) deep = { sub: `a${i}`, act: deep };
    expect(chainDepth(deep)).toBe(65);
    expect([...effectClosure([])]).toEqual([]);
  });

  it("an approval of the wrong shape, or under an unusable key set, is refused with its own code", () => {
    const approvalClaims = load("positive/approval-claims.json");
    const options: VerifyApprovalOptions = { audience: "example-publisher", jwks, now: (approvalClaims.iat as number) + 60, actionDigest: approvalClaims.actionDigest as string, issuer: ISSUER, jtiStore: createMemoryJtiStore() };
    const { jti: _jti, ...noJti } = approvalClaims;
    expect(refusal(verifyApproval(sign(noJti, {}, APPROVAL_TYP), options))).toBe("approval-invalid/malformed-claims");
    const twice: Jwks = { keys: [jwk(estate.publicKey), jwk(stranger.publicKey)] };
    expect(refusal(verifyApproval(sign(approvalClaims, {}, APPROVAL_TYP), { ...options, jwks: twice }))).toBe("issuer-unavailable/duplicate-kid");
  });

  it("the memory jti store forgets an id once its approval and the leeway are over", () => {
    const store = createMemoryJtiStore();
    expect(store.consume("approval-0000000001", 1_000, 900)).toBe(true);
    expect(store.consume("approval-0000000001", 1_000, 950)).toBe(false);
    expect(store.consume("approval-0000000002", 2_000, 1_061)).toBe(true);
    expect(store.consume("approval-0000000001", 2_000, 1_062)).toBe(true);
  });

  it("an empty Fabric-Delegation list is a present, empty header", () => {
    expect(readDelegationToken({ "Fabric-Delegation": [] })).toEqual({ token: "", via: "fabric-delegation" });
  });
});
