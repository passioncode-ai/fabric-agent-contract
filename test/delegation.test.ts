import { generateKeyPairSync, sign as cryptoSign, type KeyObject } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import {
  APPROVAL_TYP, DELEGATION_HEADER, DELEGATION_TYP, LEEWAY_SECONDS, MAX_CHAIN_DEPTH, REFUSAL_CODES,
  actionDigest, createMemoryJtiStore, effectWithin, jcs, readDelegationToken, verifyApproval, verifyDelegation,
  type Jwks, type RefusalCode
} from "../src/delegation.js";
import { OPERATOR_SESSION_IDLE_SECONDS, OPERATOR_SESSION_MAX_SECONDS, operatorSessionExpiresAt, operatorSessionLive } from "../src/operator-session.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";

// DEC-0039 (Fabric ADR-0144): the estate hub signs who is acting and for whom; the callee checks it offline.
type Json = Record<string, unknown>;
const root = projectRoot();
const load = (relative: string) => JSON.parse(readFileSync(path.join(root, "fixtures", relative), "utf8")) as Json;
const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");
const validator = await createValidator();
const valid = (schema: string, value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}`, value).valid;

const pair = () => generateKeyPairSync("ed25519");
const current = pair();
const previous = pair();
const stranger = pair();
const publicJwk = (key: KeyObject, kid: string) => ({ ...(key.export({ format: "jwk" }) as Json), kid, use: "sig", alg: "EdDSA" }) as Jwks["keys"][number];
const jwks: Jwks = { keys: [publicJwk(current.publicKey, "estate-new"), publicJwk(previous.publicKey, "estate-old")] };

const b64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
function sign(payload: Json, options: { header?: Json; key?: KeyObject; typ?: string } = {}): string {
  const header = b64({ alg: "EdDSA", typ: options.typ ?? DELEGATION_TYP, kid: "estate-new", ...options.header });
  const body = b64(payload);
  const signature = cryptoSign(null, Buffer.from(`${header}.${body}`), options.key ?? current.privateKey).toString("base64url");
  return `${header}.${body}.${signature}`;
}

const claims = load("positive/delegation-token-claims.json");
const IAT = claims.iat as number;
const EXP = claims.exp as number;
const NOW = IAT + 30;
const call = { audience: "example-writer", jwks, now: NOW, capability: "writer.write", effect: "draft" as const };
const token = (overrides: Json = {}, options: Parameters<typeof sign>[1] = {}) => sign({ ...claims, ...overrides }, options);
const code = (result: { ok: boolean; code?: RefusalCode }) => (result.ok ? "ok" : result.code);

describe("delegation token: the callee's offline check (DEC-0039, verifyDelegation)", () => {
  it("accepts a token from the estate, naming the person, the caller and the whole chain", () => {
    expect(valid("delegation-token.schema.json", claims)).toBe(true);
    const result = verifyDelegation(token(), { ...call, issuer: "urn:fabric:estate:example" });
    expect(result).toMatchObject({ ok: true, principal: "urn:person:operator", caller: "example-media", chain: ["example-media", "example-agent.default"], kid: "estate-new" });
  });

  it("keeps verifying the previous key while it is published, and stops once rotation removes it", () => {
    const old = token({}, { key: previous.privateKey, header: { kid: "estate-old" } });
    expect(code(verifyDelegation(old, call))).toBe("ok");
    const rotated: Jwks = { keys: [jwks.keys[0]!] };
    expect(verifyDelegation(old, { ...call, jwks: rotated })).toMatchObject({ ok: false, code: "unauthenticated", detail: "unknown-key" });
  });

  it("issuer-unavailable: no keys, an empty key set, or a published key it cannot use", () => {
    expect(code(verifyDelegation(token(), { ...call, jwks: undefined }))).toBe("issuer-unavailable");
    expect(code(verifyDelegation(token(), { ...call, jwks: { keys: [] } }))).toBe("issuer-unavailable");
    const broken: Jwks = { keys: [{ kty: "RSA", kid: "estate-new", n: "x", e: "AQAB" }] };
    expect(verifyDelegation(token(), { ...call, jwks: broken })).toMatchObject({ code: "issuer-unavailable", detail: "unusable-key" });
  });

  it("unauthenticated: anything not signed by a published key, or not of the profile", () => {
    const good = token();
    const [h, p] = good.split(".") as [string, string, string];
    const cases: Array<[string, string, Partial<typeof call> & { issuer?: string }]> = [
      ["malformed", "not-a-jwt", {}],
      ["malformed", `${h}.${p}`, {}],
      ["malformed", `${h}.%%%.${good.split(".")[2]}`, {}],
      ["alg-not-eddsa", token({}, { header: { alg: "HS256" } }), {}],
      ["alg-not-eddsa", token({}, { header: { alg: "none" } }), {}],
      ["wrong-typ", token({}, { typ: APPROVAL_TYP }), {}],
      ["no-kid", token({}, { header: { kid: undefined } }), {}],
      ["header-jku", token({}, { header: { jku: "https://attacker.example/jwks.json" } }), {}],
      ["header-jwk", token({}, { header: { jwk: publicJwk(stranger.publicKey, "estate-new") } }), {}],
      ["unknown-key", token({}, { header: { kid: "estate-other" } }), {}],
      ["bad-signature", token({}, { key: stranger.privateKey }), {}],
      ["bad-signature", `${h}.${b64({ ...claims, scope: "writer.write writer.send" })}.${good.split(".")[2]}`, {}],
      ["wrong-issuer", good, { issuer: "urn:fabric:estate:other" }],
      ["lifetime-above-profile", token({ exp: IAT + 601 }), {}],
      ["lifetime-above-profile", token({ exp: IAT }), {}],
      ["issued-in-future", token({ iat: NOW + LEEWAY_SECONDS + 1, exp: NOW + LEEWAY_SECONDS + 300 }), {}],
      ["malformed-claims", token({ grant: [] }), {}],
      ["malformed-claims", token({ aud: ["example-writer"] }), {}],
      ["malformed-claims", token({ effect: ["everything"] }), {}],
      ["malformed-chain", token({ act: { sub: "example-media", act: { session: "no-sub" } } }), {}]
    ];
    for (const [detail, presented, options] of cases) {
      expect(verifyDelegation(presented, { ...call, ...options }), detail).toMatchObject({ ok: false, code: "unauthenticated", detail });
    }
  });

  it("token-expired: past exp by more than the 60 s leeway; within it the token holds, both ways", () => {
    expect(code(verifyDelegation(token(), { ...call, now: EXP + LEEWAY_SECONDS }))).toBe("ok");
    expect(code(verifyDelegation(token(), { ...call, now: EXP + LEEWAY_SECONDS + 1 }))).toBe("token-expired");
    const early = token({ iat: NOW + LEEWAY_SECONDS, exp: NOW + LEEWAY_SECONDS + 300 });
    expect(code(verifyDelegation(early, call))).toBe("ok");
  });

  it("wrong-audience: a token for another callee is refused, however valid", () => {
    expect(code(verifyDelegation(token(), { ...call, audience: "example-reader" }))).toBe("wrong-audience");
    expect(code(verifyDelegation(token({ aud: "example-writer.preview" }), call))).toBe("wrong-audience");
  });

  it("chain-too-deep: more than four actors", () => {
    const four = { sub: "agent-d", act: { sub: "agent-c", act: { sub: "agent-b", act: { sub: "agent-a" } } } };
    expect(MAX_CHAIN_DEPTH).toBe(4);
    expect(code(verifyDelegation(token({ act: four }), call))).toBe("ok");
    expect(verifyDelegation(token({ act: { sub: "agent-e", act: four } }), call)).toMatchObject({ code: "chain-too-deep", detail: "depth-5" });
  });

  it("scope-not-granted: the called capability is a whole name in scope, never a prefix", () => {
    expect(code(verifyDelegation(token(), { ...call, capability: "writer.check" }))).toBe("ok");
    expect(code(verifyDelegation(token(), { ...call, capability: "writer.send" }))).toBe("scope-not-granted");
    expect(code(verifyDelegation(token(), { ...call, capability: "writer.writ" }))).toBe("scope-not-granted");
  });

  it("effect-above-ceiling: a read is below every class, a draft below every external one, and external classes are not ordered", () => {
    expect(code(verifyDelegation(token(), { ...call, effect: "none" }))).toBe("ok");
    expect(code(verifyDelegation(token(), { ...call, effect: "send" }))).toBe("effect-above-ceiling");
    expect(code(verifyDelegation(token({ effect: ["send"] }), { ...call, effect: "draft" }))).toBe("ok");
    expect(effectWithin("charge", ["delete"])).toBe(false);
    expect(effectWithin("draft", ["none"])).toBe(false);
    expect(effectWithin("none", ["none"])).toBe(true);
  });

  it("is not where attenuation is checked: a token wider than its parent verifies, and only the issuer's rule refuses it", () => {
    const mint = load("semantic/delegation-mint-wider-than-parent.json");
    const wider = mint.token as Json;
    const result = verifyDelegation(sign(wider), { ...call, now: (wider.iat as number) + 10, effect: "delete", capability: "writer.write" });
    expect(code(result)).toBe("ok");
    expect(verifyDelegation.length).toBe(2);
    expect(evaluateSemanticRules("delegation-mint", mint).map((f) => f.code)).toContain("FAC-SEM-050");
  });
});

describe("approval/1: one action, one callee, one use (DEC-0039, verifyApproval)", () => {
  const action = { capability: "publisher.push", input: { app: "example-app", hash: `sha256:${"ab".repeat(32)}`, store: "app-store" } };
  const approvalClaims = load("positive/approval-claims.json");
  const digest = approvalClaims.actionDigest as string;
  const options = { audience: "example-publisher", jwks, now: (approvalClaims.iat as number) + 60, actionDigest: digest };
  const approval = (overrides: Json = {}, signOptions: Parameters<typeof sign>[1] = {}) => sign({ ...approvalClaims, ...overrides }, { typ: APPROVAL_TYP, ...signOptions });

  it("binds the digest of the action's RFC 8785 form; the fixture's digest is this action's", () => {
    expect(valid("approval.schema.json", approvalClaims)).toBe(true);
    expect(actionDigest(action)).toBe(digest);
    expect(actionDigest({ input: { store: "app-store", hash: action.input.hash, app: "example-app" }, capability: "publisher.push" })).toBe(digest);
  });

  it("accepts an approval once and refuses it the second time (approval-reused)", () => {
    const store = createMemoryJtiStore();
    const doc = approval();
    expect(verifyApproval(doc, { ...options, jtiStore: store })).toMatchObject({ ok: true, approver: "urn:person:operator", method: "operator-channel" });
    expect(code(verifyApproval(doc, { ...options, jtiStore: store }))).toBe("approval-reused");
    // A replay later in the approval's life is refused too: the store keys on the jti alone.
    expect(code(verifyApproval(doc, { ...options, now: options.now + 3_600, jtiStore: store }))).toBe("approval-reused");
  });

  it("approval-required carries the action digest, so the caller can ask the hub for one", () => {
    expect(verifyApproval(undefined, options)).toEqual({ ok: false, code: "approval-required", detail: "no-approval", data: { actionDigest: digest } });
  });

  it("approval-invalid: another action, another callee, expired, too long-lived, unsigned, or a delegation token", () => {
    const cases: Array<[string, string, Partial<typeof options>]> = [
      ["digest-mismatch", approval(), { actionDigest: actionDigest({ ...action, input: { ...action.input, store: "google-play" } }) }],
      ["audience-mismatch", approval(), { audience: "example-writer" }],
      ["expired", approval(), { now: (approvalClaims.exp as number) + LEEWAY_SECONDS + 1 }],
      ["lifetime-above-profile", approval({ exp: (approvalClaims.iat as number) + 86_401 }), {}],
      ["bad-signature", approval({}, { key: stranger.privateKey }), {}],
      ["wrong-typ", sign(approvalClaims), {}],
      ["malformed-claims", approval({ method: "chat-message" }), {}]
    ];
    for (const [detail, doc, overrides] of cases) expect(verifyApproval(doc, { ...options, ...overrides }), detail).toMatchObject({ ok: false, code: "approval-invalid", detail });
    expect(code(verifyApproval(approval(), { ...options, jwks: undefined }))).toBe("issuer-unavailable");
  });

  it("a delegation verifier never reads an approval as a token", () => {
    expect(verifyDelegation(approval(), call)).toMatchObject({ code: "unauthenticated", detail: "wrong-typ" });
  });
});

describe("one refusal code set (DEC-0039)", () => {
  const schemaCodes = ((JSON.parse(read("schemas/delegation-refusal.schema.json")) as Json).$defs as Json).code as { enum: string[] };
  const spec = read("docs/specification/delegation.md");

  it("is the same seventeen codes in the verifier, the schema and the specification's table", () => {
    expect([...REFUSAL_CODES]).toEqual(schemaCodes.enum);
    expect(REFUSAL_CODES).toHaveLength(17);
    for (const refusal of REFUSAL_CODES) expect(spec, refusal).toMatch(new RegExp(`^\\| \`${refusal}\` \\|`, "m"));
  });

  it("keeps DEC-0037's grant-check codes as a subset with their meaning", () => {
    const grantCheck = ((JSON.parse(read("schemas/grant-check.schema.json")) as Json).$defs as Json).code as { enum: string[] };
    for (const refusal of grantCheck.enum) expect(REFUSAL_CODES as readonly string[]).toContain(refusal);
  });

  it("is a closed set on the wire: a product's own code is refused", () => {
    expect(valid("delegation-refusal.schema.json", load("negative/delegation-refusal-unknown-code.json"))).toBe(false);
  });
});

describe("how a token travels (DEC-0039)", () => {
  it("reads the hub's Fabric-Delegation header first, then a delegation JWT in Authorization: Bearer", () => {
    const jwt = token();
    expect(DELEGATION_HEADER).toBe("Fabric-Delegation");
    expect(readDelegationToken({ authorization: "Bearer product-key", "fabric-delegation": jwt })).toEqual({ token: jwt, via: "fabric-delegation" });
    expect(readDelegationToken({ Authorization: `Bearer ${jwt}` })).toEqual({ token: jwt, via: "authorization" });
    expect(readDelegationToken({ Authorization: "Bearer opaque-descriptor-token" })).toBeUndefined();
    expect(readDelegationToken({})).toBeUndefined();
  });
});

describe("RFC 8785 canonical JSON", () => {
  it("matches the RFC's own example (§3.2.2 input, §3.2.3 output)", () => {
    const input = { numbers: [333333333.33333329, 1e30, 4.5, 2e-3, 0.000000000000000000000000001], string: "€$\u000f\nA'B\"\\\\\"/", literals: [null, true, false] };
    expect(jcs(input)).toBe('{"literals":[null,true,false],"numbers":[333333333.3333333,1e+30,4.5,0.002,1e-27],"string":"€$\\u000f\\nA\'B\\"\\\\\\\\\\"/"}');
  });

  it("refuses what has no canonical form", () => {
    expect(() => jcs(Number.NaN)).toThrow();
    expect(() => jcs("\ud800")).toThrow();
    expect(jcs("😀")).toBe('"😀"');
  });
});

describe("semantic rules FAC-SEM-049, FAC-SEM-050, FAC-SEM-051", () => {
  const codes = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((f) => f.code);

  it("FAC-SEM-049: a token lives at most 10 minutes and names a capability once", () => {
    expect(codes("delegation-claims", claims)).toEqual([]);
    expect(codes("delegation-claims", load("positive/delegation-token-claims-minimal.json"))).toEqual([]);
    for (const f of ["semantic/delegation-token-long-lifetime.json", "semantic/delegation-token-scope-twice.json"]) {
      expect(valid("delegation-token.schema.json", load(f)), f).toBe(true);
      expect(codes("delegation-claims", load(f)), f).toEqual(["FAC-SEM-049"]);
    }
  });

  it("FAC-SEM-050: the issuer mints within the grant and narrower than the parent", () => {
    const ok = load("semantic/delegation-mint-ok.json");
    expect(valid("governance.schema.json", ok.grant)).toBe(true);
    for (const part of ["parent", "token"]) expect(valid("delegation-token.schema.json", ok[part]), part).toBe(true);
    expect(codes("delegation-mint", ok)).toEqual([]);
    const outside = evaluateSemanticRules("delegation-mint", load("semantic/delegation-mint-outside-grant.json"));
    expect(outside.map((f) => f.instancePath).sort()).toEqual(["/token/effect", "/token/scope"]);
    const wider = evaluateSemanticRules("delegation-mint", load("semantic/delegation-mint-wider-than-parent.json"));
    expect(new Set(wider.map((f) => f.instancePath))).toEqual(new Set(["/token/effect", "/token/exp", "/token/sub", "/token/act/sub"]));
    const spend = evaluateSemanticRules("delegation-mint", load("semantic/delegation-mint-spend-above-parent.json"));
    expect(spend.map((f) => f.message)).toEqual(["the task window may hold at most the parent's 3 remaining", "the day window may hold at most the parent's 6 remaining"]);
    expect(new Set([...outside, ...wider, ...spend].map((f) => f.code))).toEqual(new Set(["FAC-SEM-050"]));
  });

  it("FAC-SEM-050: a grant without an audience mints nothing, and a ceiling stays within the grant's effects", () => {
    const ok = load("semantic/delegation-mint-ok.json");
    const plain = { ...(ok.grant as Json) };
    delete plain.audience;
    expect(codes("delegation-mint", { ...ok, grant: plain })).toContain("FAC-SEM-050");
    expect(codes("delegation-mint", { ...ok, grant: { ...(ok.grant as Json), effectCeiling: ["draft", "charge"] } })).toEqual(["FAC-SEM-050"]);
    expect(codes("delegation-mint", { ...ok, grant: { ...(ok.grant as Json), state: "revoked" } })).toEqual(["FAC-SEM-050"]);
  });

  it("FAC-SEM-051: an approval lives at most 24 hours", () => {
    expect(codes("approval-claims", load("positive/approval-claims.json"))).toEqual([]);
    const long = load("semantic/approval-long-lifetime.json");
    expect(valid("approval.schema.json", long)).toBe(true);
    expect(codes("approval-claims", long)).toEqual(["FAC-SEM-051"]);
  });
});

describe("the operator's dashboard session (DEC-0039, service.md)", () => {
  const session = { signedInAt: 1_000_000, lastUsedAt: 1_000_000, tokenRevision: "r1" };

  it("ends 12 hours after its last use, and 7 days after sign-in whatever the use", () => {
    expect(OPERATOR_SESSION_IDLE_SECONDS).toBe(43_200);
    expect(OPERATOR_SESSION_MAX_SECONDS).toBe(604_800);
    expect(operatorSessionExpiresAt(session, "r1")).toBe(1_000_000 + 43_200);
    const busy = { ...session, lastUsedAt: 1_000_000 + 604_000 };
    expect(operatorSessionExpiresAt(busy, "r1")).toBe(1_000_000 + 604_800);
  });

  it("ends on logout and on the descriptor token's rotation; a service may shorten, never lengthen", () => {
    expect(operatorSessionLive({ ...session, loggedOutAt: 1_000_010 }, 1_000_020, "r1")).toBe(false);
    expect(operatorSessionLive(session, 1_000_020, "r2")).toBe(false);
    expect(operatorSessionExpiresAt(session, "r1", { idleSeconds: 3_600 })).toBe(1_003_600);
    expect(operatorSessionExpiresAt(session, "r1", { idleSeconds: 86_400, maxSeconds: 30 * 86_400 })).toBe(1_043_200);
  });

  it("is stated in service.md with the same numbers", () => {
    const text = read("docs/specification/service.md");
    expect(text).toMatch(/12 hours after it was last used/);
    expect(text).toMatch(/7 days after the login code was redeemed/);
  });
});
