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

export const VECTOR_FILES = [
  "fixtures/vectors/relay.json", "fixtures/vectors/secret-envelope.json", "fixtures/vectors/estate-record.json", "fixtures/vectors/hub-key.json"
] as const;
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

/** A held estate record as a relay holds it after verifying it: only the members relayAdmissionSet reads. */
function heldRecord(over: Json = {}): Json {
  const key = (k: TestKey | string) => (typeof k === "string" ? k : Buffer.from(k.octets, "base64").toString("base64"));
  const machine = (id: string, sig: TestKey | string) => ({ id, deviceKeys: [{ kid: `${id}#sig`, use: "sig", publicKey: key(sig) }] });
  const edOctets = Buffer.from((ED25519_JWK.x), "base64url").toString("base64");
  const bad = Buffer.from(MACHINE.octets, "base64");
  bad[64] = (bad[64] as number) ^ 1;
  return {
    schema: "estate-record/1", estate: ESTATE, revision: 4, issuedAt: "2026-10-12T09:00:00Z", validUntil: "2026-11-11T09:00:00Z",
    machines: [machine("m-a", MACHINE), machine("m-b", GPU), machine("m-c", STRANGER), machine("m-ed", edOctets), machine("m-bad", bad.toString("base64"))],
    revocations: [], ...over
  };
}

function admissionSetCases(): Json[] {
  const c = (name: string, at: string, expect: Json, over: Json = {}) => ({ name, held: heldRecord(), at, extraRevocations: [], ...over, expect });
  const excluded = [{ kid: "m-ed#sig", reason: "unsupported-alg" }, { kid: "m-bad#sig", reason: "bad-key" }];
  const ok = (kids: string[]) => ({ ok: true, revision: 4, kids, excluded });
  const all = ["m-a#sig", "m-b#sig", "m-c#sig"];
  return [
    c("the held record's usable #sig keys, the unusable ones named", "2026-10-13T00:00:00Z", ok(all)),
    c("a machine the record revokes", "2026-10-13T00:00:00Z", ok(["m-b#sig", "m-c#sig"]), { held: heldRecord({ revocations: [{ kind: "machine", ref: "m-a", revokedAt: "2026-10-12T10:00:00Z" }] }) }),
    c("a key the record revokes", "2026-10-13T00:00:00Z", ok(["m-a#sig", "m-c#sig"]), { held: heldRecord({ revocations: [{ kind: "device-key", ref: "m-b#sig", revokedAt: "2026-10-12T10:00:00Z" }] }) }),
    c("a machine a verified delta revokes (extraRevocations)", "2026-10-13T00:00:00Z", ok(["m-b#sig", "m-c#sig"]), { extraRevocations: [{ kind: "machine", ref: "m-a" }] }),
    c("a key a verified delta revokes (extraRevocations)", "2026-10-13T00:00:00Z", ok(["m-a#sig", "m-b#sig"]), { extraRevocations: [{ kind: "device-key", ref: "m-c#sig" }] }),
    c("60 s before issuedAt, at the clock skew", "2026-10-12T08:59:00Z", ok(all)),
    c("61 s before issuedAt", "2026-10-12T08:58:59Z", { ok: false, refusal: "not-yet-valid" }),
    c("at validUntil", "2026-11-11T09:00:00Z", ok(all)),
    c("one ms after validUntil", "2026-11-11T09:00:00.001Z", { ok: false, refusal: "expired" }),
    c("a held window that is not a real date", "2026-10-13T00:00:00Z", { ok: false, refusal: "expired" }, { held: heldRecord({ validUntil: "2026-11-31T09:00:00Z" }) }),
    c("no record held", "2026-10-13T00:00:00Z", { ok: false, refusal: "no-record" }, { held: null })
  ];
}

function relayOriginCases(): Json[] {
  const c = (name: string, value: string, expect: boolean) => ({ name, value, expect });
  return [
    c("an https origin", "https://relay.example", true),
    c("an https origin with a port", "https://relay.example:8443", true),
    c("an https origin with port 65535", "https://relay.example:65535", true),
    c("https with port 65536", "https://relay.example:65536", false),
    c("https with nothing after it", "https://", false),
    c("https with a path", "https://x/p", false),
    c("https with user information", "https://u@h", false),
    c("https followed by a newline", "https://relay.example\nX", false),
    c("https on an IPv6 literal", "https://[2001:db8::1]:8443", true),
    c("http on 127.0.0.1", "http://127.0.0.1", true),
    c("http on 127.0.0.1 with a port", "http://127.0.0.1:8787", true),
    c("http on another 127/8 address", "http://127.255.0.9:8787", true),
    c("http on [::1] with a port", "http://[::1]:8787", true),
    c("http on localhost (a name resolves somewhere a literal cannot)", "http://localhost:8787", false),
    c("http on a public name", "http://relay.example", false),
    c("http on 128.0.0.1", "http://128.0.0.1:8787", false),
    c("http on 127.0.0.256", "http://127.0.0.256", false),
    c("http on a name that starts with 127.0.0.1", "http://127.0.0.1.relay.example", false),
    c("http on [::2]", "http://[::2]:8787", false),
    c("http on 0.0.0.0", "http://0.0.0.0:8787", false),
    c("ws on 127.0.0.1", "ws://127.0.0.1:8787", false),
    c("http on 127.0.0.1 with a path", "http://127.0.0.1:8787/v1", false),
    c("http on 127.0.0.1 with port 99999", "http://127.0.0.1:99999", false),
    // R3: only a serialised origin — lowercase, no default port, no port 0, a real IP literal, a host of at most 253.
    c("https on [.]", "https://[.]", false),
    c("https on [:]", "https://[:]", false),
    c("https on [1]", "https://[1]", false),
    c("https on [::1]", "https://[::1]", true),
    c("https on an IPv6 literal without a port", "https://[2001:db8::1]", true),
    c("https on an upper-case IPv6 literal", "https://[2001:DB8::1]", false),
    c("https on an IPv6 group with a leading zero", "https://[2001:0db8::1]", false),
    c("https on 999.999.999.999", "https://999.999.999.999", false),
    c("https on 127.0.0.1", "https://127.0.0.1", true),
    c("https on 0x7f.1 (a number a URL parser reads as IPv4)", "https://0x7f.1", false),
    c("https on a name whose last label is a number", "https://relay.1", false),
    c("https on an upper-case host", "https://Relay.example", false),
    c("https with the default port 443", "https://relay.example:443", false),
    c("https with port 0", "https://relay.example:0", false),
    c("https with a port with a leading zero", "https://relay.example:08443", false),
    c("http on 127.0.0.1 with port 0", "http://127.0.0.1:0", false),
    c("http on 127.0.0.1 with the default port 80", "http://127.0.0.1:80", false),
    c("https on a host of 253 characters", `https://${"a".repeat(61)}.${"b".repeat(61)}.${"c".repeat(61)}.${"d".repeat(61)}.example`.slice(0, 8 + 253), true),
    c("https on a host of 254 characters", `https://${"a".repeat(62)}.${"b".repeat(62)}.${"c".repeat(62)}.${"d".repeat(62)}.ex`, false)
  ];
}

function instantCases(): Json[] {
  const c = (name: string, value: unknown, expect: string | null) => ({ name, value, expect });
  return [
    c("a real instant", "2026-10-12T00:00:00Z", "2026-10-12T00:00:00.000Z"),
    c("nine fraction digits", "2026-10-12T00:00:00.123456789Z", "2026-10-12T00:00:00.123Z"),
    c("ten fraction digits", "2026-10-12T00:00:00.1234567890Z", null),
    c("month 13", "2026-13-45T25:61:61Z", null),
    c("30 February", "2026-02-30T00:00:00Z", null),
    c("31 April", "2026-04-31T12:00:00Z", null),
    c("29 February in a common year", "2026-02-29T00:00:00Z", null),
    c("29 February in a leap year", "2028-02-29T00:00:00Z", "2028-02-29T00:00:00.000Z"),
    c("hour 24", "2026-10-12T24:00:00Z", null),
    c("a leap second", "2026-12-31T23:59:60Z", null),
    c("an offset", "2026-10-12T00:00:00+02:00", null),
    c("a lowercase z", "2026-10-12T00:00:00z", null),
    c("a lowercase t", "2026-10-12t00:00:00Z", null),
    c("a date only", "2026-10-12", null),
    c("not a string", 7, null),
    c("null", null, null)
  ];
}

function admitCases(): Json[] {
  const frame = authFrame();
  // `estate` is the estate of the record this context admits from: admit compares the signed one with it, and with
  // nothing else; `null` is a context that holds no record.
  const context = (over: Json = {}) => ({ relay: RELAY, nonce: NONCE, nonceUsed: false, now: AUTH_NOW, estate: ESTATE, admitted: { [LAPTOP]: MACHINE.jwk }, ...over });
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
    c("a kid outside the admission set", frame, { admitted: {} }, no("unauthenticated")),
    c("an admitted key off the curve", frame, { admitted: { [LAPTOP]: offCurve(MACHINE.jwk) } }, no("unauthenticated")),
    c("an admitted Ed25519 #sig", frame, { admitted: { [LAPTOP]: ED25519_JWK } }, no("unauthenticated")),
    c("a claimed estate other than the signed one", { ...frame, estate: "urn:fabric:estate:other" }, {}, no("unauthenticated")),
    c("a signature that is not 64 bytes", { ...frame, sig: "AAAA" }, {}, no("unauthenticated")),
    c("a 64-byte signature in a non-canonical spelling", { ...frame, sig: respell(frame.sig as string) }, {}, no("unauthenticated")),
    c("a signature by another key under the admitted kid", authFrame({}, STRANGER), {}, no("unauthenticated")),
    // CON-015: the vector's own signature as (r, n − s) verifies under plain ECDSA; low-S refuses it.
    c("high-S: the vector signature as (r, n - s)", { ...frame, sig: highS(frame.sig as string) }, {}, no("unauthenticated")),
    // CON-004: a validly signed iat on a day that does not exist, checked inside the window Date.parse would roll it to.
    c("iat 30 February, validly signed", authFrame({ iat: "2026-02-30T00:00:00Z" }), { now: "2026-03-02T00:00:30Z" }, no("unauthenticated")),
    c("iat 31 April, validly signed", authFrame({ iat: "2026-04-31T12:00:00Z" }), { now: "2026-05-01T12:00:30Z" }, no("unauthenticated")),
    c("iat T24:00:00, validly signed", authFrame({ iat: "2026-10-12T24:00:00Z" }), { now: "2026-10-13T00:00:30Z" }, no("unauthenticated")),
    c("iat :60 (a leap second), validly signed", authFrame({ iat: "2026-12-31T23:59:60Z" }), { now: "2027-01-01T00:00:30Z" }, no("unauthenticated")),
    // F4: a time is read to the millisecond (relay.md, Times): 60.000999999 s ahead is 60.000 s ahead.
    c("iat 60.000999999 s ahead, read to the millisecond", authFrame({ iat: "2026-10-12T00:01:00.000999999Z" }), { now: "2026-10-12T00:00:00Z" }, ok),
    c("iat 60.001 s ahead", authFrame({ iat: "2026-10-12T00:01:00.001Z" }), { now: "2026-10-12T00:00:00Z" }, no("not-yet-valid")),
    // R1: a kid or an estate with a lone surrogate has no RFC 8785 form, so no signature can cover it: unauthenticated.
    c("a kid with a lone surrogate", { ...frame, kid: "\ud800#sig" }, {}, no("unauthenticated")),
    c("an estate with a lone surrogate", { ...frame, estate: "urn:fabric:estate:\ud800" }, {}, no("unauthenticated")),
    // CON-010 / CX-22: the signed estate is compared with the context's held record inside admit, and is one answer.
    c("a valid signature over another estate", authFrame({ estate: "urn:fabric:estate:other" }), {}, no("unauthenticated")),
    c("a context that holds no record", frame, { estate: null, admitted: {} }, no("unauthenticated"))
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
const DELIVER = { from: LAPTOP, msgId: MSG_ID, seq: 1, sentAt: "2026-10-12T00:00:06Z" };
/** A body over header and payload texts exactly as given (not RFC 8785), signed by `key`. */
function jwsRaw(header: string, payload: string, key: TestKey = MACHINE): string {
  const signed = `${b64(header)}.${b64(payload)}`;
  return `${signed}.${signDeterministic(key.d, signed)}`;
}
const payloadOf = (body: string) => JSON.parse(Buffer.from(body.split(".")[1] as string, "base64url").toString("utf8")) as Json;

function messageBodyCases(): Json[] {
  const body = jws();
  // The frame is the deliver frame the recipient got; `self` is the recipient's own #sig, the `to` it expects (CON-012).
  const frame = DELIVER;
  const c = (name: string, b: string, expect: Json, over: Json = {}) => ({ name, body: b, frame, self: GPU_BOX, senders: { [LAPTOP]: MACHINE.jwk }, now: MSG_NOW, expect, ...over });
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
    c("a recipient other than the signed to", body, no("mismatch"), { self: "urn:fabric:machine:other#sig" }),
    c("a body signed to another machine, delivered here", jws({ to: "urn:fabric:machine:other#sig" }), no("mismatch")),
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
    ((b) => c("a header without kid, validly signed", b, ok(b)))(jws({}, { kid: null })),
    c("high-S: the vector signature as (r, n - s)", `${h}.${p}.${highS(s)}`, no("bad-signature")),
    // CON-016: the header is exactly {alg, typ, kid}, kid optional and equal to the signed from (DEC-0066).
    c("a header with crit [\"exp\"], validly signed", jws({}, { crit: ["exp"] }), no("malformed")),
    c("a header kid that is not the signed from, validly signed", jws({}, { kid: "urn:fabric:machine:evil#sig" }), no("malformed")),
    c("a header with an embedded jwk, validly signed", jws({}, { jwk: MACHINE.jwk }), no("malformed")),
    c("a header with b64 false and crit [\"b64\"], validly signed", jws({}, { b64: false, crit: ["b64"] }), no("malformed")),
    c("a header with an unknown member, validly signed", jws({}, { cty: "json" }), no("malformed")),
    c("iat 30 February, validly signed", jws({ iat: "2026-02-30T00:00:05Z", exp: "2026-03-02T01:00:05Z" }), no("malformed"), { now: "2026-03-02T00:10:00Z" }),
    // F5: the signed bytes are RFC 8785 of exactly the members the format names, or the body is malformed.
    c("a payload that is not RFC 8785 (pretty-printed), validly signed", jwsRaw(rfc8785(JSON.parse(Buffer.from(h, "base64url").toString("utf8"))), JSON.stringify(payloadOf(body), null, 2)), no("malformed")),
    c("a payload with a duplicate to, validly signed", jwsRaw(rfc8785(JSON.parse(Buffer.from(h, "base64url").toString("utf8"))), rfc8785(payloadOf(body)).replace('"to":', '"to":"urn:fabric:machine:other#sig","to":')), no("malformed")),
    c("a payload with an unknown member, validly signed", jws({ note: "x" }), no("malformed")),
    c("a header with a duplicate alg (none, then ES256), validly signed", jwsRaw(`{"alg":"none","alg":"ES256","kid":"${LAPTOP}","typ":"fabric-relay-message+jwt"}`, rfc8785(payloadOf(body))), no("malformed")),
    // F6: malformed comes before unsupported-alg, as relay.md orders them.
    c("alg EdDSA and iat month 13 together", jws({ iat: "2026-13-45T25:61:61Z" }, { alg: "EdDSA" }), no("malformed"))
  ];
}

function replayCases(): Json[] {
  const body = jws();
  const exp = MSG_IAT + 3_600_000;
  const step = (b: string, now: string, expect: Json) => ({ body: b, now, expect });
  const ok = { ok: true };
  const stranger = "urn:fabric:machine:stranger#sig";
  return [
    { name: "a body accepted, then the same body again, then after its exp", steps: [
      step(body, MSG_NOW, ok), step(body, shift(MSG_NOW, 1_000), { ok: false, reason: "replay" }), step(body, iso(exp), { ok: false, reason: "expired" })
    ] },
    { name: "two msgIds from one sender", steps: [step(body, MSG_NOW, ok), step(jws({ msgId: "another" }), MSG_NOW, ok)] },
    { name: "one msgId from two senders", steps: [step(body, MSG_NOW, ok), step(jws({ from: stranger }, { kid: stranger }, STRANGER), MSG_NOW, ok)] },
    { name: "an exp that is not an instant fails closed as expired", steps: [step(jws({ exp: "2026-02-30T00:00:00Z" }), MSG_NOW, { ok: false, reason: "expired" })] }
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
    c("a GET by a recipient no longer admitted (revoked)", "GET", blobHeader({ method: "GET", kid: B, recipients: [B] }), no(401, "unauthenticated"), { admitted: { [A]: KEY_A.jwk }, stored: { recipients: [B] } }),
    c("a GET of a blob the relay does not hold", "GET", blobHeader({ method: "GET", kid: B, recipients: [B] }), no(403, "not-admitted")),
    c("a PUT naming a recipient outside the admission set", "PUT", put, no(403, "unknown-recipient"), { admitted: { [A]: KEY_A.jwk } }),
    c("a PUT by a machine outside the admission set", "PUT", put, no(401, "unauthenticated"), { admitted: { [B]: KEY_B.jwk } }),
    c("a signer whose admitted key is Ed25519", "PUT", put, no(401, "unauthenticated"), { admitted: { [A]: ED25519_JWK, [B]: KEY_B.jwk } }),
    c("an admitted signer key off the curve", "PUT", put, no(401, "unauthenticated"), { admitted: { [A]: offCurve(KEY_A.jwk), [B]: KEY_B.jwk } }),
    // CON-001: until the signer is proven, nothing the relay holds changes the answer — one 401 for a forged signer.
    c("a forged PUT of a held blob with another list", "PUT", blobHeader({ method: "PUT", kid: A, recipients: [B], key: STRANGER }), no(401, "unauthenticated"), { stored: { recipients: [A, B] } }),
    c("a forged PUT of a blob the relay does not hold", "PUT", blobHeader({ method: "PUT", kid: A, recipients: [B], key: STRANGER }), no(401, "unauthenticated")),
    c("a forged GET of a held blob", "GET", blobHeader({ method: "GET", kid: B, recipients: [B], key: STRANGER }), no(401, "unauthenticated"), { stored: { recipients: [B] } }),
    c("a forged GET of a blob the relay does not hold", "GET", blobHeader({ method: "GET", kid: B, recipients: [B], key: STRANGER }), no(401, "unauthenticated")),
    c("a forged GET by a kid outside the admission set", "GET", blobHeader({ method: "GET", kid: "urn:fabric:machine:c#sig", recipients: [B], key: STRANGER }), no(401, "unauthenticated"), { stored: { recipients: [B] } }),
    // The owner's mutant M19: the recipients are checked only after the signer is proven.
    c("a forged PUT naming a recipient outside the admission set", "PUT", blobHeader({ method: "PUT", kid: A, recipients: ["urn:fabric:machine:c#sig"], key: STRANGER }), no(401, "unauthenticated")),
    // F3: a lone surrogate has no RFC 8785 form; the header is malformed, never a throw.
    c("a kid with a lone surrogate", "PUT", raw(`{"alg":"ES256","iat":"${BLOB_IAT}","kid":"\\ud800#sig","recipients":["${B}"],"sig":"${fields.sig}"}`), no(400, "malformed")),
    c("alg other than ES256", "PUT", blobHeader({ method: "PUT", kid: A, recipients: [B], alg: "EdDSA" }), no(401, "unsupported-alg")),
    c("a signature made for another digest", "PUT", blobHeader({ method: "PUT", kid: A, recipients: [B], digest: `sha256:${"cd".repeat(32)}` }), no(401, "unauthenticated")),
    c("a signature made for another relay", "PUT", blobHeader({ method: "PUT", kid: A, recipients: [B], relay: "https://other-relay.example" }), no(401, "unauthenticated")),
    c("a GET signature used for a PUT", "PUT", blobHeader({ method: "GET", kid: A, recipients: [B] }), no(401, "unauthenticated")),
    c("a PUT signature used for a GET", "GET", blobHeader({ method: "PUT", kid: B, recipients: [B] }), no(401, "unauthenticated"), { stored: { recipients: [B] } }),
    c("iat 61 s old", "PUT", blobHeader({ method: "PUT", kid: A, recipients: [B], iat: shift(BLOB_NOW, -61_000) }), no(401, "unauthenticated")),
    c("iat 61 s ahead", "PUT", blobHeader({ method: "PUT", kid: A, recipients: [B], iat: shift(BLOB_NOW, 61_000) }), no(401, "not-yet-valid")),
    c("high-S: a valid PUT's signature as (r, n - s)", "PUT", relayRequestHeader({ ...fields, sig: highS(fields.sig) }), no(401, "unauthenticated")),
    c("iat 30 February, validly signed", "PUT", blobHeader({ method: "PUT", kid: A, recipients: [B], iat: "2026-02-30T12:00:00Z" }), no(400, "malformed"), { now: "2026-03-02T12:00:30Z" }),
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
    // The legacy frame keeps its members (a consumer pinned before DEC-0066 reads frame.to); `self` is the recipient's
    // own kid, the `to` it now expects.
    message: { frame: { from: LAPTOP, to: GPU_BOX, msgId: MSG_ID, ttl: 3600 }, self: GPU_BOX, now: MSG_NOW, body },
    ed25519: { key: ED25519_JWK, frame: { ...frame, alg: "EdDSA", sig: nodeSign(null, Buffer.from(edInput, "utf8"), ED25519).toString("base64url") }, expect: "unsupported-alg" },
    blobRequest: {
      about: "Fabric-Relay-Request (DEC-0047 item 8): base64url of RFC 8785 {alg, kid, recipients, iat, sig}; sig is ES256 over relayBlobSigningInput. `admitted` is the relay's current admission set by kid; `stored` the blob's recipients when the relay holds it.",
      relay: BLOB_RELAY, digest: BLOB_DIGEST, now: BLOB_NOW, cases: blobRequestCases()
    },
    instant: { about: "instant(value): RFC 3339 UTC (Z only, at most nine fraction digits) on a day that exists, as an ISO string with milliseconds, or null (DEC-0066).", cases: instantCases() },
    relayOrigin: { about: "isRelayOrigin(value): what hello.relay may be (DEC-0066): https, or http on a loopback literal (127.0.0.0/8, [::1]) for a relay on this machine; never a name such as localhost.", cases: relayOriginCases() },
    admissionSet: { about: "relayAdmissionSet({held, at, extraRevocations}) over a record the relay already verified and holds (no candidate, so no schema check runs): kids is the set's keys, sorted (DEC-0047 item 4, DEC-0066).", cases: admissionSetCases() },
    admit: { about: "admit(frame, context) (DEC-0047 item 4, DEC-0066): context.estate is the estate of the record the context admits from.", cases: admitCases() },
    messageBody: { about: "verifyMessageBody(body, {from: frame.from, msgId: frame.msgId, to: self}, senders, now) (DEC-0047 item 5, DEC-0066): `frame` is the deliver frame, `self` the recipient's own #sig.", cases: messageBodyCases() },
    replay: { about: "checkReplay(seen, payload, now) after verifyMessageBody (DEC-0066): steps run in order against one recipient's store of accepted (from, msgId), which an accepted step adds to.", cases: replayCases() }
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
  placement: 7, envelopeSequence: 3, iat: ENV_IAT, exp: "2026-10-12T12:00:00Z"
});

function envelopeCases(vector: SecretEnvelope): Json[] {
  const context = (over: Json = {}) => ({
    ownKemKid: GPU_KEM, ownKemPrivateKey: RFC9180.skRm, senders: { [LAPTOP]: MACHINE.jwk },
    holders: [{ sender: LAPTOP, agentRef: AGENT, slot: SLOT }], placements: [{ agentRef: AGENT, slot: SLOT, since: 7 }],
    appliedRevision: 7, marks: [], now: ENV_NOW, ...over
  });
  const c = (name: string, envelope: unknown, expect: Json, over: Json = {}) => ({ name, envelope, context: context(over), expect });
  // The mark the target writes with the secret, in one transaction: the run it belongs to, the sequence and the digest.
  const markOf = (e: SecretEnvelope, since = 7) => ({ agentRef: AGENT, slot: SLOT, since, sequence: (e.header as unknown as Json).envelopeSequence, digest: envelopeDigest(e) });
  const ok = { ok: true, secret: SECRET, mark: markOf(vector) };
  const okFor = (e: SecretEnvelope) => ({ ok: true, secret: SECRET, mark: markOf(e) });
  const mark = (since: number, sequence: number, digest = `sha256:${"0".repeat(64)}`) => [{ agentRef: AGENT, slot: SLOT, since, sequence, digest }];
  const another = seal(baseHeader(), "the same sequence, another envelope", MACHINE, "another-secret-value-not-real");
  const signedWith = (header: Json, name: string) => seal(header, name);
  const no = (refusal: string) => ({ ok: false, refusal });
  const edit = (mutate: (e: Json) => void) => {
    const e = JSON.parse(JSON.stringify(vector)) as Json;
    mutate(e);
    return e;
  };
  const header = (e: Json) => e.header as Json;
  const life = (name: string, exp: string, good: boolean) => {
    const e = seal({ ...baseHeader(), exp }, name);
    return c(name, e, good ? okFor(e) : no("lifetime-too-long"), { now: ENV_IAT });
  };
  const { envelopeSequence: _seq, ...noSequence } = baseHeader();
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
    // CON-005: the schema's shape, refused as malformed before anything else, validly signed or not.
    c("a signature cut to 80 characters", edit((e) => { e.sig = (e.sig as string).slice(0, 80); }), no("malformed")),
    c("an extra header member, validly signed", signedWith({ ...baseHeader(), note: "x" }, "an extra header member"), no("malformed")),
    c("an extra top-level member", edit((e) => { e.note = "x"; }), no("malformed")),
    c("a slot outside its pattern, validly signed", signedWith({ ...baseHeader(), slot: "lower" }, "a slot outside its pattern"), no("malformed"), { holders: [{ sender: LAPTOP, agentRef: AGENT, slot: "lower" }], placements: [{ agentRef: AGENT, slot: "lower", since: 7 }] }),
    c("placement 0, validly signed", signedWith({ ...baseHeader(), placement: 0 }, "placement 0"), no("malformed"), { placements: [{ agentRef: AGENT, slot: SLOT, since: 0 }], appliedRevision: 0 }),
    c("an agentRef outside its pattern, validly signed", signedWith({ ...baseHeader(), agentRef: "agent:Inbox" }, "an agentRef outside its pattern"), no("malformed"), { holders: [{ sender: LAPTOP, agentRef: "agent:Inbox", slot: SLOT }], placements: [{ agentRef: "agent:Inbox", slot: SLOT, since: 7 }] }),
    c("envelopeSequence missing, validly signed", signedWith(noSequence, "envelopeSequence missing"), no("malformed")),
    c("envelopeSequence 0, validly signed", signedWith({ ...baseHeader(), envelopeSequence: 0 }, "envelopeSequence 0"), no("malformed")),
    c("envelopeSequence 1.5, validly signed", signedWith({ ...baseHeader(), envelopeSequence: 1.5 }, "envelopeSequence 1.5"), no("malformed")),
    c("iat 30 February, validly signed", signedWith({ ...baseHeader(), iat: "2026-02-30T00:00:00Z", exp: "2026-03-02T12:00:00Z" }, "iat 30 February"), no("malformed"), { now: "2026-03-02T06:00:00Z" }),
    c("high-S: the vector signature as (r, n - s)", edit((e) => { e.sig = highS(e.sig as string); }), no("bad-signature")),
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
    // CON-003 and the owner's condition: anti-rollback by a signed envelopeSequence and the target's mark of the run.
    c("the same sequence and the same envelope as the mark (a repeat delivery)", vector, ok, { marks: mark(7, 3, envelopeDigest(vector)) }),
    c("the same sequence as the mark, another envelope", another, no("sequence-reused"), { marks: mark(7, 3, envelopeDigest(vector)) }),
    c("a sequence above the mark", vector, ok, { marks: mark(7, 2) }),
    c("a sequence below the mark, same placement run", vector, no("replayed"), { marks: mark(7, 4) }),
    c("a sequence below a mark from an earlier run", vector, ok, { marks: mark(5, 9) }),
    c("a mark ahead of the current run", vector, no("replayed"), { marks: mark(8, 1) }),
    c("a mark for another slot", vector, ok, { marks: [{ agentRef: AGENT, slot: "OTHER_KEY", since: 7, sequence: 9, digest: `sha256:${"0".repeat(64)}` }] }),
    c("iat 60 s ahead", vector, ok, { now: shift(ENV_IAT, -60_000) }),
    c("iat 61 s ahead", vector, no("not-yet-valid"), { now: shift(ENV_IAT, -61_000) }),
    life("a life of exactly 24 h", "2026-10-13T00:00:00Z", true),
    life("a life of 24 h and 1 s", "2026-10-13T00:00:01Z", false),
    life("exp equal to iat", ENV_IAT, false),
    c("now equal to exp", vector, no("expired"), { now: "2026-10-12T12:00:00Z" }),
    c("a mark ahead of the run, and expired: the earlier check names it", vector, no("replayed"), { marks: mark(8, 1), now: "2026-10-12T12:00:00Z" }),
    c("another machine's #kem private key", vector, no("cannot-open"), { ownKemPrivateKey: otherKem })
  ];
}

/**
 * DEC-0082: a target reads only its personal secret placements, so an organization's secret placement listed before the
 * personal one decides nothing. Each case is the applied revisions (minimal records: the fields estateEnvelopeContext
 * reads), the target machine, and for each sender kid whether it may hold the slot, with the current placement run.
 */
function placementCases(): Json[] {
  const target = "m-target", laptop = "m-laptop", org = "org:org_7kq2m4xw";
  const keys = (id: string) => [{ kid: `${id}#sig`, use: "sig", alg: "es256", publicKey: MACHINE.octets }];
  const record = (revision: number, secrets: Json[]) => ({
    revision, revocations: [],
    machines: [{ id: target, deviceKeys: keys(target), secrets }, { id: laptop, deviceKeys: keys(laptop), secrets: [] }]
  });
  const personal = { agentRef: AGENT, slot: SLOT, from: laptop };
  const orgSlot = { agentRef: AGENT, slot: SLOT, from: target, context: org };
  const query = (expectLaptop: boolean, expectTarget: boolean, currentPlacement: number | null) => ({
    holds: [{ sender: `${laptop}#sig`, mayHold: expectLaptop }, { sender: `${target}#sig`, mayHold: expectTarget }], currentPlacement
  });
  return [
    { name: "an organization's secret placement listed before the personal one: the personal one decides (a port that reads the first match fails)", machine: target, agentRef: AGENT, slot: SLOT, applied: [record(4, [orgSlot, personal])], expect: query(true, false, 4) },
    { name: "the personal secret placement listed first: the same answer", machine: target, agentRef: AGENT, slot: SLOT, applied: [record(4, [personal, orgSlot])], expect: query(true, false, 4) },
    { name: "context personal spelled out, after the organization's: it is the personal placement", machine: target, agentRef: AGENT, slot: SLOT, applied: [record(4, [orgSlot, { ...personal, context: "personal" }])], expect: query(true, false, 4) },
    { name: "only an organization's secret placement: no sender may hold the slot, and it has no current placement", machine: target, agentRef: AGENT, slot: SLOT, applied: [record(4, [orgSlot])], expect: query(false, false, null) },
    { name: "the run of the personal placement is unbroken when an organization's placement is added before it", machine: target, agentRef: AGENT, slot: SLOT, applied: [record(3, [personal]), record(4, [orgSlot, personal])], expect: query(true, false, 3) }
  ];
}

function envelopeVectors(): Json {
  const envelope = seal(baseHeader(), RFC9180.skEm);
  return {
    about: "fabric-secret-envelope/1 (DEC-0047 item 7, DEC-0066): written by tools/vectors/relay-crypto.ts, never by hand. The envelope is sealed to RFC 9180 §A.3.1's recipient key pkRm with its ephemeral key skEm (both public test data) and signed, deterministically and low-S, by a test key derived from a published label. `open` holds what a recipient must hold to open it: its #kem private key (RFC 9180's skRm), the sender's #sig public key, the slot's placement and a time inside the envelope's life. A case's context.marks are the target's marks {agentRef, slot, since, sequence, digest}; an opened case expects the mark it writes with the secret. `cases` is data a port runs through src/relay-vectors.ts. The secret is a placeholder.",
    recipientKemPrivateKey: RFC9180.skRm,
    recipientKey: RECIPIENT_JWK,
    senderKey: MACHINE.jwk,
    envelope,
    digest: envelopeDigest(envelope),
    open: { ownKemKid: GPU_KEM, placement: 7, now: ENV_NOW, secret: SECRET },
    recipientKeyOctets: PK_R.toString("base64"),
    senderKeyOctets: MACHINE.octets,
    cases: envelopeCases(envelope),
    placement: {
      about: "DEC-0082: the open context a target derives from its applied estate-record revisions (estateEnvelopeContext, relay.md open steps 6 and 7) reads only personal secret placements (no context, or personal). Each case: the applied revisions, oldest first, the target machine, the agentRef and slot; expect.holds says whether each sender kid may hold the slot, expect.currentPlacement the revision the placement's run starts at, or null.",
      cases: placementCases()
    }
  };
}

// ---- estate-record.json: the issuedAt skew (DEC-0066) -------------------------------------------------------------

/**
 * The estate-record vectors are passkey-signed elsewhere; this generator owns only the cases at the issuedAt boundary,
 * which reuse already-signed records at other verifier times. It replaces those cases in the committed file and keeps
 * every other case as it is.
 */
const SKEW_ANCHOR = "checked at the instant it was issued (EdDSA, re-signed revision 1)";
function estateRecordVectors(committed: Json): Json {
  const cases = committed.cases as Json[];
  const find = (name: string) => {
    const found = cases.find((entry) => entry.name === name);
    if (!found) throw new Error(`estate-record.json has no case ${name}`);
    return found;
  };
  const es = find("revision 1, signed by the passkey the machine pinned at enrollment (ES256)");
  const ed = find(SKEW_ANCHOR);
  const before = (entry: Json, ms: number) => ({ ...(entry.trust as Json), at: new Date(Date.parse((entry.record as Json).issuedAt as string) - ms).toISOString() });
  const notYet = { ok: false, problem: "not-yet-valid" };
  const managed = [
    { name: "checked one millisecond before it was issued", record: ed.record, trust: before(ed, 1), expected: ed.expected },
    { name: "checked 60 s before it was issued, at the clock skew", record: ed.record, trust: before(ed, 60_000), expected: ed.expected },
    { name: "checked 60 s and one millisecond before it was issued", record: ed.record, trust: before(ed, 60_001), expected: notYet },
    { name: "checked before it was issued", record: es.record, trust: before(es, 61_000), expected: notYet }
  ];
  const names = new Set(managed.map((entry) => entry.name));
  const kept = cases.filter((entry) => !names.has(entry.name as string));
  const at = kept.findIndex((entry) => entry.name === SKEW_ANCHOR) + 1;
  return { ...committed, cases: [...kept.slice(0, at), ...managed, ...kept.slice(at)] };
}

// ---- hub-key.json: the same window (DEC-0066, DL-14) --------------------------------------------------------------

/**
 * DL-14's hub-key vectors reuse revision 2's record at other clocks; this generator owns only the cases at the issuedAt
 * skew boundary (`at` is a JWT NumericDate in seconds) and keeps every other case as it is.
 */
const HUB_ANCHOR = "certified at issuedAt exactly (the window holds both instants)";
function hubKeyVectors(committed: Json): Json {
  const cases = committed.cases as Json[];
  const anchor = cases.find((entry) => entry.name === HUB_ANCHOR);
  if (!anchor) throw new Error(`hub-key.json has no case ${HUB_ANCHOR}`);
  const issued = Date.parse((anchor.record as Json).issuedAt as string) / 1000;
  const outside = { certified: false, fault: "estate", detail: "estate-outside-window" };
  const managed = [
    { name: "one second before issuedAt: inside the 60 s skew, as verifyEstateRecord admits it", record: anchor.record, kid: anchor.kid, x: anchor.x, at: issued - 1, expected: anchor.expected },
    { name: "60 s before issuedAt, at the clock skew", record: anchor.record, kid: anchor.kid, x: anchor.x, at: issued - 60, expected: anchor.expected },
    { name: "60 s and one millisecond before issuedAt: the revision's window does not hold the clock", record: anchor.record, kid: anchor.kid, x: anchor.x, at: issued - 60.001, expected: outside }
  ];
  const legacy = "one second before issuedAt: the revision's window does not hold the clock";
  const names = new Set([legacy, ...managed.map((entry) => entry.name)]);
  const kept = cases.filter((entry) => !names.has(entry.name as string));
  const at = kept.findIndex((entry) => entry.name === HUB_ANCHOR) + 1;
  return { ...committed, cases: [...kept.slice(0, at), ...managed, ...kept.slice(at)] };
}

// ---- Output -------------------------------------------------------------------------------------------------------

const text = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

/** What `--write` writes: each vector file's exact text, by its path in the repository. */
export function buildVectorFiles(): Record<VectorFile, string> {
  const estate = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/vectors/estate-record.json"), "utf8")) as Json;
  return {
    "fixtures/vectors/relay.json": text(relayVectors()),
    "fixtures/vectors/secret-envelope.json": text(envelopeVectors()),
    "fixtures/vectors/estate-record.json": text(estateRecordVectors(estate)),
    "fixtures/vectors/hub-key.json": text(hubKeyVectors(JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/vectors/hub-key.json"), "utf8")) as Json))
  };
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
