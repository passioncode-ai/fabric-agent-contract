/**
 * The generator of the relay family's shared vectors (DEC-0066): `fixtures/vectors/relay.json` and
 * `fixtures/vectors/secret-envelope.json`.
 *
 *   tsx tools/vectors/relay-crypto.ts --check   compare the committed files with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/relay-crypto.ts --write   write them
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/relay-vectors.test.ts` runs the check.
 * The output is deterministic, so the check is exact:
 * - each test key's private scalar is derived from a published label (`testKey`). They are test keys: anyone can
 *   derive them, and nothing trusts them;
 * - signatures are ECDSA with RFC 6979 deterministic nonces (HMAC-SHA-256), normalised to low-S;
 * - each envelope's HPKE ephemeral key is derived the same way, except the main vector's, which is RFC 9180 §A.3.1's skEm.
 *
 * The expected outcome of every case is written here by hand, never computed by the reference: the gate then checks
 * that the reference returns it.
 */
import { createECDH, createHash, createHmac, createPrivateKey, sign as nodeSign } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { rfc8785 } from "../../src/canonical.js";
import { projectRoot } from "../../src/contract.js";
import { P256_CURVE } from "../../src/p256.js";
import { RELAY_ALG, RELAY_PROTOCOL, relayAuthSigningInput, relayBlobSigningInput, relayRequestHeader } from "../../src/relay.js";
import { ENVELOPE_SUITE, ENVELOPE_TYPE, envelopeDigest, hpkeSealBase, type SecretEnvelope } from "../../src/secret-envelope.js";

export const VECTOR_FILES = ["fixtures/vectors/relay.json", "fixtures/vectors/secret-envelope.json"] as const;
type VectorFile = (typeof VECTOR_FILES)[number];
type Json = Record<string, unknown>;

// ---- Keys and deterministic ES256 ---------------------------------------------------------------------------------

const { n } = P256_CURVE;
const LABEL = "fabric-agent-contract/vectors/relay-crypto/";
const sha256 = (data: string | Buffer) => createHash("sha256").update(data).digest();
const toInt = (bytes: Buffer) => BigInt(`0x${bytes.toString("hex")}`);
const to32 = (value: bigint) => Buffer.from(value.toString(16).padStart(64, "0"), "hex");
const modPow = (base: bigint, exp: bigint, mod: bigint): bigint => {
  let result = 1n;
  for (let b = base % mod, e = exp; e > 0n; e >>= 1n, b = (b * b) % mod) if (e & 1n) result = (result * b) % mod;
  return result;
};

/** The uncompressed point k·G. */
function point(k: bigint): Buffer {
  const ecdh = createECDH("prime256v1");
  ecdh.setPrivateKey(to32(k));
  return ecdh.getPublicKey(null, "uncompressed");
}

export interface TestKey { d: bigint; jwk: { kty: "EC"; crv: "P-256"; x: string; y: string }; octets: string }

/** A P-256 test key whose private scalar is derived from `label`: anyone can derive it, and nothing trusts it. */
export function testKey(label: string): TestKey {
  const d = (toInt(sha256(`${LABEL}${label}`)) % (n - 1n)) + 1n;
  const pub = point(d);
  return {
    d,
    jwk: { kty: "EC", crv: "P-256", x: pub.subarray(1, 33).toString("base64url"), y: pub.subarray(33).toString("base64url") },
    octets: pub.toString("base64")
  };
}

const hmac = (key: Buffer, ...parts: Buffer[]) => createHmac("sha256", key).update(Buffer.concat(parts)).digest();

/** ES256 over `message` with an RFC 6979 nonce (SHA-256), as raw r ‖ s in base64url, normalised to low-S. */
export function signDeterministic(d: bigint, message: string | Buffer): string {
  const e = toInt(sha256(typeof message === "string" ? Buffer.from(message, "utf8") : message));
  const x = to32(d), h1 = to32(e % n);
  let v = Buffer.alloc(32, 1), k = Buffer.alloc(32, 0);
  k = hmac(k, v, Buffer.from([0]), x, h1); v = hmac(k, v);
  k = hmac(k, v, Buffer.from([1]), x, h1); v = hmac(k, v);
  for (;;) {
    v = hmac(k, v);
    const nonce = toInt(v);
    if (nonce >= 1n && nonce < n) {
      const r = toInt(point(nonce).subarray(1, 33)) % n;
      const s = (modPow(nonce, n - 2n, n) * ((e + r * d) % n)) % n;
      if (r !== 0n && s !== 0n) return Buffer.concat([to32(r), to32(s > n / 2n ? n - s : s)]).toString("base64url");
    }
    k = hmac(k, v, Buffer.from([0])); v = hmac(k, v);
  }
}

/** The same signature as (r, n − s): it verifies under plain ECDSA, and is the high-S encoding low-S refuses. */
export function highS(sig: string): string {
  const raw = Buffer.from(sig, "base64url");
  return Buffer.concat([raw.subarray(0, 32), to32(n - toInt(raw.subarray(32)))]).toString("base64url");
}

/** The same 64 bytes in a non-canonical spelling: the 86th character carries four spare bits a lenient decoder drops. */
export function respell(sig: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const last = alphabet.indexOf(sig[sig.length - 1] as string);
  return sig.slice(0, -1) + (alphabet[(last & 0b110000) | ((last + 1) & 0b001111)] as string);
}

const ED25519_SEED = sha256(`${LABEL}ed25519`);
const ED25519 = createPrivateKey({ key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), ED25519_SEED]), format: "der", type: "pkcs8" });
const ED25519_JWK = { kty: "OKP", crv: "Ed25519", x: (ED25519.export({ format: "jwk" }) as { x: string }).x };

const MACHINE = testKey("machine example-laptop");
const GPU = testKey("machine example-gpu-box");
const STRANGER = testKey("stranger");
const offCurve = (jwk: TestKey["jwk"]) => ({ ...jwk, y: jwk.x });

// ---- relay.json ---------------------------------------------------------------------------------------------------

const RELAY = "https://relay.example";
const NONCE = "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8";
const OTHER_NONCE = "BBECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8";
const ESTATE = "urn:fabric:estate:example";
const LAPTOP = "urn:fabric:machine:example-laptop#sig";
const GPU_BOX = "urn:fabric:machine:example-gpu-box#sig";
const AUTH_IAT = "2026-10-12T00:00:00Z";
const AUTH_NOW = "2026-10-12T00:00:30Z";
const shift = (iso: string, ms: number) => new Date(Date.parse(iso) + ms).toISOString().replace(/\.000Z$/, "Z");

/** An `auth` frame signed by `key` over `relay-auth/1` with the given relay and nonce. */
function authFrame(over: Json = {}, key: TestKey = MACHINE, signed: { relay?: string; nonce?: string } = {}): Json {
  const fields = { estate: ESTATE, kid: LAPTOP, iat: AUTH_IAT, ...over } as { estate: string; kid: string; iat: string };
  const input = relayAuthSigningInput({ relay: signed.relay ?? RELAY, nonce: signed.nonce ?? NONCE, estate: fields.estate, kid: fields.kid, iat: fields.iat });
  return { v: 1, type: "auth", id: "a1", protocol: RELAY_PROTOCOL, alg: RELAY_ALG, ...fields, sig: signDeterministic(key.d, input) };
}

function admitCases(): Json[] {
  const frame = authFrame();
  const context = (over: Json = {}) => ({ relay: RELAY, nonce: NONCE, nonceUsed: false, now: AUTH_NOW, admitted: { [LAPTOP]: MACHINE.jwk }, ...over });
  const c = (name: string, f: Json, ctx: Json, expect: Json) => ({ name, frame: f, context: context(ctx), expect });
  const ok = { ok: true, kid: LAPTOP };
  const no = (code: string) => ({ ok: false, code });
  const { alg: _alg, ...noAlg } = frame;
  return [
    c("the vector machine, key as a JWK", frame, {}, ok),
    c("the vector machine, key as SEC 1 octets", frame, { admitted: { [LAPTOP]: MACHINE.octets } }, ok),
    c("iat exactly 60 s old", frame, { now: shift(AUTH_IAT, 60_000) }, ok),
    c("iat exactly 60 s ahead", frame, { now: shift(AUTH_IAT, -60_000) }, ok),
    c("another protocol", { ...frame, protocol: "fabric-relay/9" }, {}, no("protocol-unsupported")),
    c("an alg other than ES256", { ...frame, alg: "EdDSA" }, {}, no("unsupported-alg")),
    c("no alg", noAlg, {}, no("unsupported-alg")),
    c("a signature made for another relay", authFrame({}, MACHINE, { relay: "https://other-relay.example" }), {}, no("unauthenticated")),
    c("another connection's nonce", authFrame({}, MACHINE, { nonce: OTHER_NONCE }), {}, no("unauthenticated")),
    c("the nonce used once already", frame, { nonceUsed: true }, no("replay")),
    c("iat 61 s in the past", frame, { now: shift(AUTH_IAT, 61_000) }, no("unauthenticated")),
    c("iat 61 s ahead", frame, { now: shift(AUTH_IAT, -61_000) }, no("not-yet-valid")),
    c("iat not RFC 3339", authFrame({ iat: "yesterday" }), {}, no("unauthenticated")),
    c("iat month 13", authFrame({ iat: "2026-13-45T25:61:61Z" }), {}, no("unauthenticated")),
    c("a kid outside the admission set", frame, { admitted: {} }, no("not-admitted")),
    c("an admitted key off the curve", frame, { admitted: { [LAPTOP]: offCurve(MACHINE.jwk) } }, no("bad-key")),
    c("an admitted Ed25519 #sig", frame, { admitted: { [LAPTOP]: ED25519_JWK } }, no("unsupported-alg")),
    c("a claimed estate other than the signed one", { ...frame, estate: "urn:fabric:estate:other" }, {}, no("unauthenticated")),
    c("a signature that is not 64 bytes", { ...frame, sig: "AAAA" }, {}, no("unauthenticated")),
    c("a 64-byte signature in a non-canonical spelling", { ...frame, sig: respell(frame.sig as string) }, {}, no("unauthenticated")),
    c("a signature by another key under the admitted kid", authFrame({}, STRANGER), {}, no("unauthenticated"))
  ];
}

const MSG_ID = "0b6f5f3e-6a51-4d6e-9d55-4b8f6a0d2c11";
const MSG_IAT = Date.parse("2026-10-12T00:00:05Z");
const MSG_NOW = "2026-10-12T00:10:00Z";
const iso = (ms: number) => new Date(ms).toISOString().replace(/\.000Z$/, "Z");
const b64 = (value: unknown) => Buffer.from(typeof value === "string" ? value : rfc8785(value)).toString("base64url");

/** A message body: a compact JWS over the RFC 8785 header and payload, signed by `key`. `header: null` drops a member. */
function jws(payload: Json = {}, header: Record<string, unknown> = {}, key: TestKey = MACHINE): string {
  const h = Object.fromEntries(Object.entries({ alg: RELAY_ALG, kid: LAPTOP, typ: "fabric-relay-message+jwt", ...header }).filter(([, v]) => v !== null));
  const signed = `${b64(h)}.${b64({
    type: "fabric-relay-message/1", from: LAPTOP, to: GPU_BOX, msgId: MSG_ID, iat: iso(MSG_IAT), exp: iso(MSG_IAT + 3_600_000),
    payload: { command: "run.start", run: "example" }, ...payload
  })}`;
  return `${signed}.${signDeterministic(key.d, signed)}`;
}
const payloadOf = (body: string) => JSON.parse(Buffer.from(body.split(".")[1] as string, "base64url").toString("utf8")) as Json;

function messageBodyCases(): Json[] {
  const body = jws();
  const frame = { from: LAPTOP, to: GPU_BOX, msgId: MSG_ID };
  const c = (name: string, b: string, expect: Json, over: Json = {}) => ({ name, body: b, frame, senders: { [LAPTOP]: MACHINE.jwk }, now: MSG_NOW, expect, ...over });
  const ok = (b: string) => ({ ok: true, payload: payloadOf(b) });
  const no = (reason: string) => ({ ok: false, reason });
  const [h, p, s] = body.split(".") as [string, string, string];
  const reencoded = (over: Json) => `${h}.${b64({ ...payloadOf(body), ...over })}.${s}`;
  const exp = MSG_IAT + 3_600_000;
  return [
    c("the vector body, key as a JWK", body, ok(body)),
    c("the vector body, key as SEC 1 octets", body, ok(body), { senders: { [LAPTOP]: MACHINE.octets } }),
    c("one ms before the signed exp", body, ok(body), { now: new Date(exp - 1).toISOString() }),
    c("at the signed exp", body, no("expired"), { now: iso(exp) }),
    c("not a JWS (two parts)", "x.y", no("malformed")),
    c("a payload that is not JSON", `${h}.!!!.${s}`, no("malformed")),
    c("a header that is JSON null", `${b64("null")}.${b64("{}")}.AAAA`, no("malformed")),
    c("a payload that is an array", `${h}.${b64("[]")}.${s}`, no("malformed")),
    c("typ JWT", jws({}, { typ: "JWT" }), no("malformed")),
    c("payload type fabric-relay-message/2", jws({ type: "fabric-relay-message/2" }), no("malformed")),
    c("alg none", jws({}, { alg: "none" }), no("unsupported-alg")),
    c("alg EdDSA", jws({}, { alg: "EdDSA" }), no("unsupported-alg")),
    c("iat month 13", jws({ iat: "2026-13-45T25:61:61Z" }), no("malformed")),
    c("exp null", jws({ exp: null }), no("malformed")),
    c("from a number", jws({ from: 7 }), no("malformed")),
    c("a frame naming another sender", body, no("mismatch"), { frame: { ...frame, from: "urn:fabric:machine:stranger#sig" }, senders: { [LAPTOP]: MACHINE.jwk, "urn:fabric:machine:stranger#sig": STRANGER.jwk } }),
    c("a frame naming another recipient", body, no("mismatch"), { frame: { ...frame, to: "urn:fabric:machine:other#sig" } }),
    c("a frame naming another msgId", body, no("mismatch"), { frame: { ...frame, msgId: "another" } }),
    c("a payload changed in transit", reencoded({ payload: { command: "run.cancel" } }), no("bad-signature")),
    c("an exp moved in transit", reencoded({ exp: "2026-10-19T00:00:00Z" }), no("bad-signature")),
    c("an unknown sender", body, no("unknown-sender"), { senders: {} }),
    c("a sender key off the curve", body, no("bad-key"), { senders: { [LAPTOP]: offCurve(MACHINE.jwk) } }),
    c("an Ed25519 sender", body, no("unsupported-alg"), { senders: { [LAPTOP]: ED25519_JWK } }),
    c("iat 60 s ahead", body, ok(body), { now: iso(MSG_IAT - 60_000) }),
    c("iat 61 s ahead", body, no("not-yet-valid"), { now: iso(MSG_IAT - 61_000) }),
    c("exp equal to iat", jws({ exp: iso(MSG_IAT) }), no("lifetime-too-long"), { now: iso(MSG_IAT) }),
    ...[["exp at 7 days", 604_800_000, true], ["exp at 7 days and 1 s", 604_801_000, false]].map(([name, life, good]) => {
      const b = jws({ exp: iso(MSG_IAT + (life as number)) });
      return c(name as string, b, good ? ok(b) : no("lifetime-too-long"), { now: iso(MSG_IAT) });
    }),
    c("a 64-byte signature in a non-canonical spelling", `${h}.${p}.${respell(s)}`, no("bad-signature")),
    ((b) => c("a header without kid, validly signed", b, ok(b)))(jws({}, { kid: null }))
  ];
}

const BLOB_RELAY = RELAY;
const BLOB_DIGEST = `sha256:${"ab".repeat(32)}`;
const BLOB_NOW = "2026-10-12T12:00:30Z";
const BLOB_IAT = "2026-10-12T12:00:00Z";
const A = "urn:fabric:machine:a#sig", B = "urn:fabric:machine:b#sig";
const KEY_A = testKey("blob a"), KEY_B = testKey("blob b");

interface BlobFields { method: "PUT" | "GET"; kid: string; recipients: string[]; iat?: string; alg?: string; relay?: string; digest?: string; key?: TestKey }
function blobHeader(f: BlobFields): string {
  const iat = f.iat ?? BLOB_IAT;
  const key = f.key ?? (f.kid === B ? KEY_B : KEY_A);
  const sig = signDeterministic(key.d, relayBlobSigningInput({ relay: f.relay ?? BLOB_RELAY, method: f.method, digest: f.digest ?? BLOB_DIGEST, recipients: f.recipients, iat }));
  return relayRequestHeader({ alg: f.alg ?? RELAY_ALG, kid: f.kid, recipients: f.recipients, iat, sig });
}
/** A header re-spelled with the same bytes: its last base64url character carries spare bits a lenient decoder drops. */
function respelledHeader(header: string): string {
  const out = respell(header);
  if (out === header || Buffer.from(out, "base64url").toString("base64url") === out) throw new Error("the header has no spare bits to re-spell");
  return out;
}

function blobRequestCases(): Json[] {
  const admitted = { [A]: KEY_A.jwk, [B]: KEY_B.jwk };
  const c = (name: string, method: "PUT" | "GET", header: string | null, expect: Json, over: Json = {}) => ({ name, method, header, admitted, ...over, expect });
  const no = (status: number, code: string) => ({ ok: false, status, code });
  const put = blobHeader({ method: "PUT", kid: A, recipients: [B] });
  const fields = { alg: RELAY_ALG, kid: A, recipients: [B], iat: BLOB_IAT, sig: JSON.parse(Buffer.from(put, "base64url").toString("utf8")).sig as string };
  const raw = (value: unknown) => Buffer.from(typeof value === "string" ? value : JSON.stringify(value)).toString("base64url");
  const longKid = (i: number) => `urn:fabric:machine:${String(i).padStart(4, "0")}${"x".repeat(220)}#sig`;
  return [
    c("a PUT by an admitted machine to admitted recipients", "PUT", put, { ok: true, kid: A, recipients: [B], repeat: false }),
    c("the same PUT again with the same recipients: no change", "PUT", put, { ok: true, kid: A, recipients: [B], repeat: true }, { stored: { recipients: [B] } }),
    c("a PUT of a held blob with another recipient list", "PUT", put, no(409, "recipients-mismatch"), { stored: { recipients: [A, B] } }),
    c("a GET by a stored recipient with the stored list", "GET", blobHeader({ method: "GET", kid: B, recipients: [B] }), { ok: true, kid: B, recipients: [B], repeat: false }, { stored: { recipients: [B] } }),
    c("a GET by a machine that is not a recipient", "GET", blobHeader({ method: "GET", kid: A, recipients: [B] }), no(403, "not-admitted"), { stored: { recipients: [B] } }),
    c("a GET whose signed list differs from the stored one", "GET", blobHeader({ method: "GET", kid: B, recipients: [A, B] }), no(403, "not-admitted"), { stored: { recipients: [B] } }),
    c("a GET by a recipient no longer admitted (revoked)", "GET", blobHeader({ method: "GET", kid: B, recipients: [B] }), no(403, "not-admitted"), { admitted: { [A]: KEY_A.jwk }, stored: { recipients: [B] } }),
    c("a GET of a blob the relay does not hold", "GET", blobHeader({ method: "GET", kid: B, recipients: [B] }), no(403, "not-admitted")),
    c("a PUT naming a recipient outside the admission set", "PUT", put, no(403, "unknown-recipient"), { admitted: { [A]: KEY_A.jwk } }),
    c("a PUT by a machine outside the admission set", "PUT", put, no(403, "not-admitted"), { admitted: { [B]: KEY_B.jwk } }),
    c("a signer whose admitted key is Ed25519", "PUT", put, no(401, "unsupported-alg"), { admitted: { [A]: ED25519_JWK, [B]: KEY_B.jwk } }),
    c("an admitted signer key off the curve", "PUT", put, no(403, "bad-key"), { admitted: { [A]: offCurve(KEY_A.jwk), [B]: KEY_B.jwk } }),
    c("alg other than ES256", "PUT", blobHeader({ method: "PUT", kid: A, recipients: [B], alg: "EdDSA" }), no(401, "unsupported-alg")),
    c("a signature made for another digest", "PUT", blobHeader({ method: "PUT", kid: A, recipients: [B], digest: `sha256:${"cd".repeat(32)}` }), no(401, "unauthenticated")),
    c("a signature made for another relay", "PUT", blobHeader({ method: "PUT", kid: A, recipients: [B], relay: "https://other-relay.example" }), no(401, "unauthenticated")),
    c("a GET signature used for a PUT", "PUT", blobHeader({ method: "GET", kid: A, recipients: [B] }), no(401, "unauthenticated")),
    c("a PUT signature used for a GET", "GET", blobHeader({ method: "PUT", kid: B, recipients: [B] }), no(401, "unauthenticated"), { stored: { recipients: [B] } }),
    c("iat 61 s old", "PUT", blobHeader({ method: "PUT", kid: A, recipients: [B], iat: shift(BLOB_NOW, -61_000) }), no(401, "unauthenticated")),
    c("iat 61 s ahead", "PUT", blobHeader({ method: "PUT", kid: A, recipients: [B], iat: shift(BLOB_NOW, 61_000) }), no(401, "not-yet-valid")),
    c("iat that matches the pattern and is no date", "PUT", blobHeader({ method: "PUT", kid: A, recipients: [B], iat: "2026-13-45T25:61:61Z" }), no(400, "malformed")),
    c("padding on the base64url", "PUT", `${put}=`, no(400, "malformed")),
    c("a non-canonical last base64url character", "PUT", respelledHeader(put), no(400, "malformed")),
    c("JSON that is not RFC 8785 (members out of order)", "PUT", raw({ sig: fields.sig, alg: fields.alg, kid: A, recipients: [B], iat: BLOB_IAT }), no(400, "malformed")),
    c("an extra member", "PUT", raw(rfc8785({ ...fields, extra: "x" })), no(400, "malformed")),
    c("no recipients", "PUT", blobHeader({ method: "PUT", kid: A, recipients: [] }), no(400, "malformed")),
    c("65 recipients", "PUT", blobHeader({ method: "PUT", kid: A, recipients: Array.from({ length: 65 }, (_, i) => `urn:fabric:machine:m${i}#sig`) }), no(400, "malformed")),
    c("the same recipient twice", "PUT", blobHeader({ method: "PUT", kid: A, recipients: [B, B] }), no(400, "malformed")),
    c("a recipient that is a #kem key", "PUT", blobHeader({ method: "PUT", kid: A, recipients: ["urn:fabric:machine:b#kem"] }), no(400, "malformed")),
    c("a header over 8192 bytes", "PUT", blobHeader({ method: "PUT", kid: A, recipients: Array.from({ length: 40 }, (_, i) => longKid(i)) }), no(431, "too-large")),
    c("no header at all", "PUT", null, no(400, "malformed"))
  ];
}

function relayVectors(): Json {
  const frame = authFrame();
  const input = relayAuthSigningInput({ relay: RELAY, nonce: NONCE, estate: ESTATE, kid: LAPTOP, iat: AUTH_IAT });
  const edInput = relayAuthSigningInput({ relay: RELAY, nonce: NONCE, estate: ESTATE, kid: LAPTOP, iat: AUTH_IAT });
  const body = jws();
  return {
    about: "fabric-relay/0.1 (DEC-0047, DEC-0066): written by tools/vectors/relay-crypto.ts, never by hand. Keys are test keys derived from published labels (anyone can derive them; nothing trusts them); signatures are deterministic ES256 (RFC 6979), low-S. The legacy members (machineKey, machineKeyOctets, auth, message, ed25519) keep their shapes; the case groups (admit, messageBody, blobRequest, ...) are data a port runs through src/relay-vectors.ts: one complete context per case, a key as a JWK or base64 SEC 1 octets, and `expect` exactly what the reference returns.",
    machineKey: MACHINE.jwk,
    machineKeyOctets: MACHINE.octets,
    auth: { context: { relay: RELAY, nonce: NONCE, now: AUTH_NOW }, signingInput: input, sha256: sha256(input).toString("hex"), frame },
    message: { frame: { from: LAPTOP, to: GPU_BOX, msgId: MSG_ID, ttl: 3600 }, now: MSG_NOW, body },
    ed25519: { key: ED25519_JWK, frame: { ...frame, alg: "EdDSA", sig: nodeSign(null, Buffer.from(edInput, "utf8"), ED25519).toString("base64url") }, expect: "unsupported-alg" },
    blobRequest: {
      about: "Fabric-Relay-Request (DEC-0047 item 8): base64url of RFC 8785 {alg, kid, recipients, iat, sig}; sig is ES256 over relayBlobSigningInput. `admitted` is the relay's current admission set by kid; `stored` the blob's recipients when the relay holds it.",
      relay: BLOB_RELAY, digest: BLOB_DIGEST, now: BLOB_NOW, cases: blobRequestCases()
    },
    admit: { about: "admit(frame, context) (DEC-0047 item 4).", cases: admitCases() },
    messageBody: { about: "verifyMessageBody(body, frame, senders, now) (DEC-0047 item 5).", cases: messageBodyCases() }
  };
}

// ---- secret-envelope.json -----------------------------------------------------------------------------------------

const RFC9180 = {
  skEm: "4995788ef4b9d6132b249ce59a77281493eb39af373d236a1fe415cb0c2d7beb",
  pkRm: "04fe8c19ce0905191ebc298a9245792531f26f0cece2460639e8bc39cb7f706a826a779b4cf969b8a0e539c7f62fb3d30ad6aa8f80e30f1d128aafd68a2ce72ea0",
  skRm: "f3ce7fdae57e1a310d87f1ebbde6f328be0a99cdbcadf4d6589cf29de4b8ffd2"
};
const PK_R = Buffer.from(RFC9180.pkRm, "hex");
const RECIPIENT_JWK = { kty: "EC", crv: "P-256", x: PK_R.subarray(1, 33).toString("base64url"), y: PK_R.subarray(33).toString("base64url") };
const GPU_KEM = "urn:fabric:machine:example-gpu-box#kem";
const AGENT = "urn:fabric:agent:example:inbox-digest";
const SLOT = "EXAMPLE_API_KEY";
const SECRET = "example-secret-value-not-real";
const ENV_IAT = "2026-10-12T00:00:00Z";
const ENV_NOW = "2026-10-12T06:00:00Z";
const INFO = Buffer.from(ENVELOPE_TYPE, "ascii");

/** An envelope over `header` (without `enc`), sealed to RFC 9180's pkRm and signed by `key`, deterministically. */
function seal(header: Json, ephemeral: string, key: TestKey = MACHINE, secret = SECRET): SecretEnvelope {
  const skE = ephemeral.length === 64 ? Buffer.from(ephemeral, "hex") : sha256(`${LABEL}ephemeral/${ephemeral}`);
  const ecdh = createECDH("prime256v1");
  ecdh.setPrivateKey(skE);
  const full = { ...header, enc: ecdh.getPublicKey(null, "uncompressed").toString("base64url") };
  const { ct } = hpkeSealBase(PK_R, INFO, Buffer.from(rfc8785(full), "utf8"), Buffer.from(secret, "utf8"), skE);
  const unsigned = { header: full, ct: ct.toString("base64url") };
  return { ...unsigned, sig: signDeterministic(key.d, rfc8785(unsigned)) } as unknown as SecretEnvelope;
}
const baseHeader = (): Json => ({
  type: ENVELOPE_TYPE, alg: RELAY_ALG, suite: [...ENVELOPE_SUITE], recipient: GPU_KEM, sender: LAPTOP, agentRef: AGENT, slot: SLOT,
  placement: 7, iat: ENV_IAT, exp: "2026-10-12T12:00:00Z"
});

function envelopeCases(vector: SecretEnvelope): Json[] {
  const context = (over: Json = {}) => ({
    ownKemKid: GPU_KEM, ownKemPrivateKey: RFC9180.skRm, senders: { [LAPTOP]: MACHINE.jwk },
    holders: [{ sender: LAPTOP, agentRef: AGENT, slot: SLOT }], placements: [{ agentRef: AGENT, slot: SLOT, since: 7 }],
    appliedRevision: 7, now: ENV_NOW, ...over
  });
  const c = (name: string, envelope: unknown, expect: Json, over: Json = {}) => ({ name, envelope, context: context(over), expect });
  const ok = { ok: true, secret: SECRET };
  const no = (refusal: string) => ({ ok: false, refusal });
  const edit = (mutate: (e: Json) => void) => {
    const e = JSON.parse(JSON.stringify(vector)) as Json;
    mutate(e);
    return e;
  };
  const header = (e: Json) => e.header as Json;
  const life = (name: string, exp: string, expect: Json) => c(name, seal({ ...baseHeader(), exp }, name), expect, { now: ENV_IAT });
  const otherKem = sha256(`${LABEL}another machine's #kem`).toString("hex");
  return [
    c("the vector envelope, sender key as a JWK", vector, ok),
    c("the vector envelope, sender key as SEC 1 octets", vector, ok, { senders: { [LAPTOP]: MACHINE.octets } }),
    c("not an envelope", { header: {} }, no("malformed")),
    c("a header that is null", { header: null, ct: "AA", sig: "AA" }, no("malformed")),
    c("a header that is an array", { header: [], ct: "AA", sig: "AA" }, no("malformed")),
    c("iat month 13", edit((e) => { header(e).iat = "2026-13-45T25:61:61Z"; }), no("malformed")),
    c("alg EdDSA", edit((e) => { header(e).alg = "EdDSA"; }), no("unsupported-alg")),
    c("another machine's #kem", vector, no("wrong-recipient"), { ownKemKid: "urn:fabric:machine:other#kem" }),
    c("a sender the record does not list", vector, no("bad-key"), { senders: {} }),
    c("a sender key off the curve", vector, no("bad-key"), { senders: { [LAPTOP]: offCurve(MACHINE.jwk) } }),
    c("an Ed25519 sender key", vector, no("unsupported-alg"), { senders: { [LAPTOP]: ED25519_JWK } }),
    c("an encapsulated key off the curve", edit((e) => {
      const enc = Buffer.from(header(e).enc as string, "base64url");
      enc[64] = (enc[64] as number) ^ 1;
      header(e).enc = enc.toString("base64url");
    }), no("bad-key")),
    c("a signature cut to 80 characters", edit((e) => { e.sig = (e.sig as string).slice(0, 80); }), no("bad-signature")),
    c("a 64-byte signature in a non-canonical spelling", edit((e) => { e.sig = respell(e.sig as string); }), no("bad-signature")),
    c("the slot changed after signing", edit((e) => { header(e).slot = "OTHER_KEY"; }), no("bad-signature")),
    c("a ciphertext bit flipped", edit((e) => {
      const ct = Buffer.from(e.ct as string, "base64url");
      ct[0] = (ct[0] as number) ^ 1;
      e.ct = ct.toString("base64url");
    }), no("bad-signature")),
    c("exp changed after signing", edit((e) => { header(e).exp = "2026-10-12T23:00:00Z"; }), no("bad-signature")),
    c("a signature by another key", seal(baseHeader(), "another signer", STRANGER), no("bad-signature")),
    c("a sender that may not hold the slot", vector, no("sender-not-allowed"), { holders: [] }),
    c("a placement older than the current one", vector, no("placement-stale"), { placements: [{ agentRef: AGENT, slot: SLOT, since: 8 }], appliedRevision: 8 }),
    c("a slot not placed here", vector, no("placement-stale"), { placements: [] }),
    c("a placement newer than the applied revision", vector, no("placement-stale"), { placements: [{ agentRef: AGENT, slot: SLOT, since: 5 }], appliedRevision: 6 }),
    c("no applied revision", vector, no("placement-stale"), { appliedRevision: null }),
    c("iat 60 s ahead", vector, ok, { now: shift(ENV_IAT, -60_000) }),
    c("iat 61 s ahead", vector, no("not-yet-valid"), { now: shift(ENV_IAT, -61_000) }),
    life("a life of exactly 24 h", "2026-10-13T00:00:00Z", ok),
    life("a life of 24 h and 1 s", "2026-10-13T00:00:01Z", no("lifetime-too-long")),
    life("exp equal to iat", ENV_IAT, no("lifetime-too-long")),
    c("now equal to exp", vector, no("expired"), { now: "2026-10-12T12:00:00Z" }),
    c("another machine's #kem private key", vector, no("cannot-open"), { ownKemPrivateKey: otherKem })
  ];
}

function envelopeVectors(): Json {
  const envelope = seal(baseHeader(), RFC9180.skEm);
  return {
    about: "fabric-secret-envelope/1 (DEC-0047 item 7, DEC-0066): written by tools/vectors/relay-crypto.ts, never by hand. The envelope is sealed to RFC 9180 §A.3.1's recipient key pkRm with its ephemeral key skEm (both public test data) and signed, deterministically and low-S, by a test key derived from a published label. `open` holds what a recipient must hold to open it: its #kem private key (RFC 9180's skRm), the sender's #sig public key, the slot's placement and a time inside the envelope's life. `cases` is data a port runs through src/relay-vectors.ts. The secret is a placeholder.",
    recipientKemPrivateKey: RFC9180.skRm,
    recipientKey: RECIPIENT_JWK,
    senderKey: MACHINE.jwk,
    envelope,
    digest: envelopeDigest(envelope),
    open: { ownKemKid: GPU_KEM, placement: 7, now: ENV_NOW, secret: SECRET },
    recipientKeyOctets: PK_R.toString("base64"),
    senderKeyOctets: MACHINE.octets,
    cases: envelopeCases(envelope)
  };
}

// ---- Output -------------------------------------------------------------------------------------------------------

const text = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

/** What `--write` writes: each vector file's exact text, by its path in the repository. */
export function buildVectorFiles(): Record<VectorFile, string> {
  return { "fixtures/vectors/relay.json": text(relayVectors()), "fixtures/vectors/secret-envelope.json": text(envelopeVectors()) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const write = process.argv.includes("--write");
  const built = buildVectorFiles();
  const stale: string[] = [];
  for (const file of VECTOR_FILES) {
    const target = path.join(projectRoot(), file);
    if (write) writeFileSync(target, built[file]);
    else if (readFileSync(target, "utf8") !== built[file]) stale.push(file);
  }
  if (stale.length) {
    console.error(`stale vector files (run with --write): ${stale.join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log(write ? `wrote ${VECTOR_FILES.join(", ")}` : "vector files match the generator");
  }
}
