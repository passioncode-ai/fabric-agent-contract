import { createHash, generateKeyPairSync, type KeyObject } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { APPROVAL_TYP, createMemoryJtiStore, verifyApproval, verifyDelegation, type Jwks } from "../src/delegation.js";
import { policySigningInput, verifyPolicySignature } from "../src/device-rules.js";
import { SMALL_ORDER_ENCODINGS, isSmallOrderKey } from "../src/ed25519.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";

// DEC-0045, CT-29: Node 20 and 22 (OpenSSL 3.x) accept an Ed25519 signature under a small-order public key; Node 24
// and 26 refuse it. Nothing here depends on which Node runs it: the key is refused before any signature is verified.
type Json = Record<string, unknown>;
const root = projectRoot();
const load = (relative: string) => JSON.parse(readFileSync(path.join(root, "fixtures", relative), "utf8")) as Json;
const validator = await createValidator();
const valid = (schema: string, value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}`, value).valid;

// Edwards25519 (RFC 8032 §5.1), in BigInt, to prove each listed encoding is a point of order 1, 2, 4 or 8 without
// trusting the list it checks.
const p = 2n ** 255n - 19n;
const L = 2n ** 252n + 27742317777372353535851937790883648493n;
const mod = (a: bigint) => ((a % p) + p) % p;
const pow = (b: bigint, e: bigint) => { let r = 1n; b = mod(b); while (e > 0n) { if (e & 1n) r = mod(r * b); b = mod(b * b); e >>= 1n; } return r; };
const inv = (a: bigint) => pow(a, p - 2n);
const d = mod(-121665n * inv(121666n));
const sqrtM1 = pow(2n, (p - 1n) / 4n);
type Point = [bigint, bigint];
const add = ([x1, y1]: Point, [x2, y2]: Point): Point => {
  const t = mod(d * x1 * x2 * y1 * y2);
  return [mod((x1 * y2 + x2 * y1) * inv(1n + t)), mod((y1 * y2 + x1 * x2) * inv(1n - t))];
};
const times = (k: bigint, point: Point): Point => { let r: Point = [0n, 1n]; let q = point; while (k > 0n) { if (k & 1n) r = add(r, q); q = add(q, q); k >>= 1n; } return r; };
/** Decode as a lax verifier does: y reduced mod p, x recovered; `undefined` when y is on no point. */
function decode(bytes: Buffer): Point | undefined {
  const sign = bytes[31]! >> 7;
  const copy = Buffer.from(bytes);
  copy[31] = copy[31]! & 0x7f;
  const y = mod(BigInt(`0x${Buffer.from(copy).reverse().toString("hex")}`));
  const u = mod(y * y - 1n), v = mod(d * y * y + 1n);
  let x = pow(mod(u * inv(v)), (p + 3n) / 8n);
  if (mod(v * x * x) !== u) x = mod(x * sqrtM1);
  if (mod(v * x * x) !== u) return undefined;
  if (Number(x & 1n) !== sign) x = mod(-x);
  return [x, y];
}
const isIdentity = ([x, y]: Point) => x === 0n && y === 1n;
const raw = (key: KeyObject) => Buffer.from((key.export({ format: "jwk" }) as Json).x as string, "base64url");

describe("isSmallOrderKey (libsodium's has_small_order list)", () => {
  it("lists seven encodings, each a point of order dividing 8 under the lax decoding", () => {
    expect(SMALL_ORDER_ENCODINGS).toHaveLength(7);
    for (const hex of SMALL_ORDER_ENCODINGS) {
      const point = decode(Buffer.from(hex, "hex"));
      expect(point, hex).toBeDefined();
      expect(isIdentity(times(8n, point as Point)), hex).toBe(true);
    }
  });

  it("refuses every listed encoding, with the sign bit clear or set", () => {
    for (const hex of SMALL_ORDER_ENCODINGS) {
      const bytes = Buffer.from(hex, "hex");
      expect(isSmallOrderKey(bytes), hex).toBe(true);
      const signed = Buffer.from(bytes);
      signed[31] = signed[31]! | 0x80;
      expect(isSmallOrderKey(signed), `${hex} with the sign bit`).toBe(true);
    }
  });

  it("passes a real key, whose point has the large prime order, and refuses no length but 32", () => {
    const key = raw(generateKeyPairSync("ed25519").publicKey);
    expect(isSmallOrderKey(key)).toBe(false);
    const point = decode(key) as Point;
    expect(isIdentity(times(8n, point))).toBe(false);
    expect(isIdentity(times(L, point))).toBe(true);
    expect(isSmallOrderKey(Buffer.alloc(31))).toBe(true);
    expect(isSmallOrderKey(Buffer.alloc(33, 1))).toBe(true);
  });
});

describe("a token forged under a small-order key is refused before its signature is read (CT-29)", () => {
  const vector = load("vectors/delegation-small-order.json");
  const options = { audience: vector.audience as string, jwks: vector.jwks as Jwks, now: vector.now as number, capability: vector.capability as string, effect: vector.effect as "draft", issuer: vector.issuer as string };

  it("refuses the adapter's forged vector as the issuer's unusable key", () => {
    expect(verifyDelegation(vector.token as string, options)).toEqual(vector.expected);
  });

  it("refuses an approval under such a key, and the key set that publishes one", () => {
    const zero = (vector.jwks as Jwks).keys.find((key) => key.kid === "estate-zero")!;
    const approvalClaims = load("positive/approval-claims.json");
    const header = Buffer.from(JSON.stringify({ alg: "EdDSA", typ: APPROVAL_TYP, kid: "estate-zero" })).toString("base64url");
    const forged = `${header}.${Buffer.from(JSON.stringify(approvalClaims)).toString("base64url")}.${(vector.token as string).split(".")[2]}`;
    const result = verifyApproval(forged, { audience: "example-publisher", jwks: { keys: [zero] }, now: (approvalClaims.iat as number) + 60, actionDigest: approvalClaims.actionDigest as string, issuer: vector.issuer as string, jtiStore: createMemoryJtiStore() });
    expect(result).toMatchObject({ ok: false, code: "issuer-unavailable", detail: "small-order-key" });
    expect(valid("delegation-jwks.schema.json", load("negative/delegation-jwks-small-order-key.json"))).toBe(false);
    expect(verifyDelegation(vector.token as string, { ...options, jwks: { keys: [{ ...zero, x: "AAAA" }] } })).toMatchObject({ code: "issuer-unavailable", detail: "unusable-key" });
    for (const hex of SMALL_ORDER_ENCODINGS) expect(valid("delegation-jwks.schema.json", { keys: [{ ...zero, x: Buffer.from(hex, "hex").toString("base64url") }] }), hex).toBe(false);
    expect(valid("delegation-jwks.schema.json", { keys: [{ ...zero, x: raw(generateKeyPairSync("ed25519").publicKey).toString("base64url") }] })).toBe(true);
  });
});

describe("a device policy and key set under a small-order key (FAC-SEM-041, FAC-SEM-046)", () => {
  const ZERO = Buffer.alloc(32).toString("base64");
  const R = Buffer.from(`58${"66".repeat(31)}`, "hex");
  const S = Buffer.concat([Buffer.from([1]), Buffer.alloc(31)]);

  /** A policy whose R = B, S = 1 signature holds under the all-zero key (order 4): vary the revision until k ≡ 0 mod 4. */
  function forgedPolicy(): Json {
    const update = (load("semantic/device-policy-update-ok.json").input as Json).next as Json;
    for (let revision = 1; ; revision++) {
      const policy: Json = { ...update, revision, signature: { ...(update.signature as Json), value: Buffer.concat([R, S]).toString("base64") } };
      const input = policySigningInput(policy);
      const k = BigInt(`0x${Buffer.from(createHash("sha512").update(Buffer.concat([R, Buffer.alloc(32), input])).digest()).reverse().toString("hex")}`) % L;
      if (k % 4n === 0n) return policy;
    }
  }

  it("never verifies a policy signed under the all-zero key, although the signature equation holds", () => {
    expect(verifyPolicySignature(forgedPolicy(), ZERO)).toBe(false);
  });

  it("refuses a small-order key in a key set and in the trusted keys", () => {
    const set = load("semantic/device-key-set-ok.json").input as Json;
    const next = set.next as Json;
    const keys = (next.keys as Json[]).map((key, i) => (i === 0 ? { ...key, publicKey: ZERO } : key));
    const paths = evaluateSemanticRules("device-key-set", { ...set, next: { ...next, keys } }).map((f) => `${f.code} ${f.instancePath}`);
    expect(paths).toContain("FAC-SEM-046 /next/keys/0/publicKey");
    expect(valid("device-key-set.schema.json", load("negative/device-key-set-small-order-key.json"))).toBe(false);
    const update = load("semantic/device-policy-update-ok.json").input as Json;
    const trusted = (update.trustedKeys as Json[]).map((key) => ({ ...key, publicKey: ZERO }));
    expect(evaluateSemanticRules("device-policy-update", { ...update, trustedKeys: trusted }).map((f) => `${f.code} ${f.instancePath}`)).toContain("FAC-SEM-041 /next/signature/value");
  });
});
