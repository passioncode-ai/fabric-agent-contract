import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { rfc8785 } from "../src/canonical.js";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { createValidator, validateDocument } from "../src/validator.js";
import {
  AUTH_WINDOW_SECONDS, CLOCK_SKEW_SECONDS, CLOSE_CODES, IDLE_CLOSE_SECONDS, MAX_BODY_BYTES, MAX_FRAME_BYTES, MAX_MESSAGE_TTL_SECONDS,
  RELAY_ERROR_CODES, admit, instant, relayAdmissionSet, relayAuthSigningInput, relayBlobSigningInput, verifyEs256, verifyMessageBody,
  type AuthContext, type AuthFrame
} from "../src/relay.js";

// DEC-0047 items 3–6: the relay admits a machine only on a fresh, single-use, relay-bound ES256 proof of an admitted
// device key; a recipient trusts a body only through its own signature and its own signed `exp`, never through the
// connection or the frame it came in.
type Vector = {
  machineKey: Record<string, string>;
  machineKeyOctets: string;
  auth: { context: { relay: string; nonce: string; now: string }; signingInput: string; sha256: string; frame: AuthFrame };
  message: { frame: { from: string; to: string; msgId: string; ttl: number }; now: string; body: string };
  ed25519: { key: Record<string, string>; frame: AuthFrame; expect: string };
};
const v = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures", "vectors", "relay.json"), "utf8")) as Vector;
const validator = await createValidator();
const octets = Buffer.from(v.machineKeyOctets, "base64");
const ctx = (over: Partial<AuthContext> = {}): AuthContext => ({
  relay: v.auth.context.relay, nonce: v.auth.context.nonce, nonceUsed: false,
  admittedKey: (kid) => (kid === v.auth.frame.kid ? v.machineKey : undefined), now: new Date(v.auth.context.now), ...over
});
const iatMs = Date.parse(v.auth.frame.iat);
const at = (offsetMs: number) => new Date(iatMs + offsetMs);

describe("relay-auth/1", () => {
  it("signs the RFC 8785 bytes the vector pins, naming ES256", () => {
    const { relay, nonce } = v.auth.context;
    const input = relayAuthSigningInput({ relay, nonce, estate: v.auth.frame.estate, kid: v.auth.frame.kid, iat: v.auth.frame.iat });
    expect(input).toBe(v.auth.signingInput);
    expect(JSON.parse(input).alg).toBe("ES256");
    expect(createHash("sha256").update(input).digest("hex")).toBe(v.auth.sha256);
  });

  it("admits the vector's machine as the kid it proved, with its key as a JWK or as DEC-0053's SEC 1 octets", () => {
    expect(admit(v.auth.frame, ctx())).toEqual({ ok: true, kid: v.auth.frame.kid });
    expect(admit(v.auth.frame, ctx({ admittedKey: () => octets }))).toEqual({ ok: true, kid: v.auth.frame.kid });
  });

  const cases: Array<[string, AuthFrame, Partial<AuthContext>, string]> = [
    ["another protocol", { ...v.auth.frame, protocol: "fabric-relay/9" }, {}, "protocol-unsupported"],
    ["an alg other than ES256", { ...v.auth.frame, alg: "EdDSA" }, {}, "unsupported-alg"],
    ["no alg at all", { ...v.auth.frame, alg: undefined as unknown as string }, {}, "unsupported-alg"],
    ["a signature made for another relay", v.auth.frame, { relay: "https://other-relay.example" }, "unauthenticated"],
    ["another connection's nonce", v.auth.frame, { nonce: "BBECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8" }, "unauthenticated"],
    ["the nonce used once already", v.auth.frame, { nonceUsed: true }, "replay"],
    ["iat 61 s in the past", v.auth.frame, { now: at(61_000) }, "unauthenticated"],
    ["iat 61 s ahead of the clock", v.auth.frame, { now: at(-61_000) }, "not-yet-valid"],
    ["iat not RFC 3339", { ...v.auth.frame, iat: "yesterday" }, {}, "unauthenticated"],
    ["iat that matches the pattern and is no date", { ...v.auth.frame, iat: "2026-13-45T25:61:61Z" }, {}, "unauthenticated"],
    ["a kid outside the admission set", v.auth.frame, { admittedKey: () => undefined }, "not-admitted"],
    ["an admitted key off the curve", v.auth.frame, { admittedKey: () => ({ ...v.machineKey, y: v.machineKey.x }) }, "bad-key"],
    ["an admitted Ed25519 #sig", v.auth.frame, { admittedKey: () => v.ed25519.key }, "unsupported-alg"],
    ["a claimed estate other than the signed one", { ...v.auth.frame, estate: "urn:fabric:estate:other" }, {}, "unauthenticated"],
    ["a signature that is not 64 bytes", { ...v.auth.frame, sig: "AAAA" }, {}, "unauthenticated"],
    ["a 64-byte signature in a non-canonical spelling", { ...v.auth.frame, sig: `${v.auth.frame.sig.slice(0, -1)}h` }, {}, "unauthenticated"]
  ];
  it.each(cases)("refuses %s, by code", (_name, frame, over, code) => {
    expect(admit(frame, ctx(over))).toEqual({ ok: false, code });
  });

  it("gives the same answer for every case whether the admitted key is a JWK or octets", () => {
    for (const [name, frame, over] of cases) {
      if (over.admittedKey) continue;
      expect(admit(frame, ctx({ ...over, admittedKey: () => octets })), name).toEqual(admit(frame, ctx(over)));
    }
  });

  it("admits an iat exactly 60 s off either way and names the window it uses", () => {
    expect(AUTH_WINDOW_SECONDS).toBe(60);
    expect(CLOCK_SKEW_SECONDS).toBe(60);
    expect(admit(v.auth.frame, ctx({ now: at(60_000) })).ok).toBe(true);
    expect(admit(v.auth.frame, ctx({ now: at(-60_000) })).ok).toBe(true);
  });

  it("refuses the vector's Ed25519 participant as unsupported-alg", () => {
    expect(admit(v.ed25519.frame, ctx({ admittedKey: () => v.ed25519.key }))).toEqual({ ok: false, code: v.ed25519.expect });
    expect(RELAY_ERROR_CODES).toContain(v.ed25519.expect);
  });
});

describe("relay-blob/1", () => {
  it("binds the method, the digest, the recipients and the algorithm", () => {
    const fields = { relay: "https://relay.example", method: "PUT" as const, digest: `sha256:${"0".repeat(64)}`, recipients: ["m#sig"], iat: "2026-10-12T00:00:00Z" };
    const key = generateKeyPairSync("ec", { namedCurve: "P-256" });
    const input = relayBlobSigningInput(fields);
    expect(JSON.parse(input)).toMatchObject({ type: "relay-blob/1", alg: "ES256" });
    const sig = sign("sha256", Buffer.from(input), { key: key.privateKey, dsaEncoding: "ieee-p1363" }).toString("base64url");
    const pub = key.publicKey.export({ format: "jwk" });
    expect(verifyEs256(pub, input, sig)).toBe(true);
    expect(verifyEs256(pub, relayBlobSigningInput({ ...fields, method: "GET" }), sig)).toBe(false);
    expect(verifyEs256(pub, relayBlobSigningInput({ ...fields, recipients: ["other#sig"] }), sig)).toBe(false);
  });
});

describe("fabric-relay-message/1", () => {
  const frame = { from: v.message.frame.from, to: v.message.frame.to, msgId: v.message.frame.msgId };
  const senderKey = (kid: string) => (kid === frame.from ? v.machineKey : undefined);
  const now = new Date(v.message.now);
  const b64 = (value: unknown) => Buffer.from(typeof value === "string" ? value : rfc8785(value)).toString("base64url");
  // A one-off sender for the boundary cases: the vector pins the format, these pin each line of the check.
  const own = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const ownKey = () => own.publicKey.export({ format: "jwk" });
  const T0 = Date.parse("2026-10-12T00:00:00Z");
  const iso = (ms: number) => new Date(ms).toISOString().replace(/\.000Z$/, "Z");
  const jws = (over: Record<string, unknown> = {}, header: Record<string, unknown> = {}) => {
    const signed = `${b64({ alg: "ES256", typ: "fabric-relay-message+jwt", ...header })}.${b64({
      type: "fabric-relay-message/1", ...frame, iat: iso(T0), exp: iso(T0 + 3_600_000), payload: {}, ...over
    })}`;
    return `${signed}.${sign("sha256", Buffer.from(signed), { key: own.privateKey, dsaEncoding: "ieee-p1363" }).toString("base64url")}`;
  };
  const check = (body: string, nowMs: number) => verifyMessageBody(body, frame, () => ownKey(), new Date(nowMs));

  it("verifies the vector's body against its frame, with the sender's key as a JWK or as octets", () => {
    expect(verifyMessageBody(v.message.body, frame, senderKey, now).ok).toBe(true);
    expect(verifyMessageBody(v.message.body, frame, () => Buffer.from(v.machineKeyOctets, "base64"), now).ok).toBe(true);
  });

  it("judges the life by the signed exp, never by the frame's ttl", () => {
    const payload = JSON.parse(Buffer.from(v.message.body.split(".")[1] as string, "base64url").toString("utf8")) as { exp: string };
    const exp = Date.parse(payload.exp);
    expect(verifyMessageBody(v.message.body, frame, senderKey, new Date(exp - 1)).ok).toBe(true);
    expect(verifyMessageBody(v.message.body, frame, senderKey, new Date(exp))).toEqual({ ok: false, reason: "expired" });
  });

  it("refuses a body that does not match its frame, or that a relay could have altered", () => {
    const [h, p, s] = v.message.body.split(".") as [string, string, string];
    const payload = JSON.parse(Buffer.from(p, "base64url").toString("utf8")) as Record<string, unknown>;
    const reencoded = (over: Record<string, unknown>) => `${h}.${b64({ ...payload, ...over })}.${s}`;
    const cases: Array<[string, string, Partial<typeof frame>, string]> = [
      ["not a JWS", "x.y", {}, "malformed"],
      ["a payload that is not JSON", `${h}.!!!.${s}`, {}, "malformed"],
      ["a header that is JSON null", `${b64("null")}.${b64("{}")}.AAAA`, {}, "malformed"],
      ["a payload that is an array", `${h}.${b64("[]")}.${s}`, {}, "malformed"],
      ["a frame naming another sender", v.message.body, { from: "urn:fabric:machine:stranger#sig" }, "mismatch"],
      ["a frame naming another recipient", v.message.body, { to: "urn:fabric:machine:other#sig" }, "mismatch"],
      ["a frame with another msgId", v.message.body, { msgId: "another" }, "mismatch"],
      ["a payload changed in transit", reencoded({ payload: { command: "run.cancel" } }), {}, "bad-signature"],
      ["an exp moved in transit", reencoded({ exp: "2026-10-19T00:00:00Z" }), {}, "bad-signature"]
    ];
    for (const [name, body, frameOver, reason] of cases) {
      expect(verifyMessageBody(body, { ...frame, ...frameOver }, senderKey, now), name).toEqual({ ok: false, reason });
    }
    expect(verifyMessageBody(v.message.body, frame, () => undefined, now)).toEqual({ ok: false, reason: "unknown-sender" });
    expect(verifyMessageBody(v.message.body, frame, () => ({ ...v.machineKey, y: v.machineKey.x }), now)).toEqual({ ok: false, reason: "bad-key" });
    expect(verifyMessageBody(v.message.body, frame, () => v.ed25519.key, now)).toEqual({ ok: false, reason: "unsupported-alg" });
  });

  it("names the algorithm and the type it refuses", () => {
    expect(check(jws({}, { alg: "none" }), T0)).toEqual({ ok: false, reason: "unsupported-alg" });
    expect(check(jws({}, { alg: "EdDSA" }), T0)).toEqual({ ok: false, reason: "unsupported-alg" });
    expect(check(jws({}, { typ: "JWT" }), T0)).toEqual({ ok: false, reason: "malformed" });
    expect(check(jws({ type: "fabric-relay-message/2" }), T0)).toEqual({ ok: false, reason: "malformed" });
  });

  it("refuses an iat or an exp that does not parse to an instant", () => {
    expect(check(jws({ iat: "2026-13-45T25:61:61Z" }), T0)).toEqual({ ok: false, reason: "malformed" });
    expect(check(jws({ exp: null }), T0)).toEqual({ ok: false, reason: "malformed" });
    expect(check(jws({ from: 7 }), T0)).toEqual({ ok: false, reason: "malformed" });
  });

  it("holds each time boundary: not-before skew, the 7-day life and the expiry", () => {
    expect(check(jws(), T0 - 60_000).ok).toBe(true);
    expect(check(jws(), T0 - 61_000)).toEqual({ ok: false, reason: "not-yet-valid" });
    expect(check(jws({ exp: iso(T0) }), T0)).toEqual({ ok: false, reason: "lifetime-too-long" });
    expect(check(jws({ exp: iso(T0 + MAX_MESSAGE_TTL_SECONDS * 1000) }), T0).ok).toBe(true);
    expect(check(jws({ exp: iso(T0 + MAX_MESSAGE_TTL_SECONDS * 1000 + 1000) }), T0)).toEqual({ ok: false, reason: "lifetime-too-long" });
    expect(check(jws(), T0 + 3_600_000 - 1).ok).toBe(true);
    expect(check(jws(), T0 + 3_600_000)).toEqual({ ok: false, reason: "expired" });
  });
});

describe("limits and constants", () => {
  it("parses only real instants", () => {
    expect(instant("2026-10-12T00:00:00Z")).toBe(Date.parse("2026-10-12T00:00:00Z"));
    expect(instant("2026-10-12T00:00:00.123456789Z")).toBeTypeOf("number");
    for (const bad of ["2026-13-45T25:61:61Z", "2026-10-12T00:00:00.1234567890Z", "2026-10-12", 7, null]) expect(instant(bad), String(bad)).toBeUndefined();
  });

  it("fits the largest send and deliver frames, every string member escaped to six bytes, within MAX_FRAME_BYTES", () => {
    const worst = (n: number) => "\u0001".repeat(n); // JSON-escapes to \u0001, six bytes a character
    const body = Buffer.alloc(MAX_BODY_BYTES, 0xff).toString("base64url");
    const send = { v: 1, type: "send", id: worst(128), to: worst(256), msgId: worst(128), body, ttl: MAX_MESSAGE_TTL_SECONDS };
    const deliver = { v: 1, type: "deliver", id: worst(128), from: worst(256), msgId: worst(128), seq: Number.MAX_SAFE_INTEGER, body,
      sentAt: "2026-10-12T00:00:00.123456789Z" };
    for (const frame of [send, deliver]) expect(Buffer.byteLength(JSON.stringify(frame), "utf8")).toBeLessThanOrEqual(MAX_FRAME_BYTES);
    expect(MAX_FRAME_BYTES).toBe(1_048_576);
  });

  it("closes with the codes and the idle time DEC-0047 item 3 names", () => {
    expect(CLOSE_CODES).toEqual({ unauthenticated: 4401, notAdmitted: 4403, tooLarge: 1009, binary: 1003, idle: 1001 });
    expect(IDLE_CLOSE_SECONDS).toBe(90);
  });
});

/** The same 64 bytes in a non-canonical spelling: the 86th character carries four spare bits a lenient decoder drops. */
const respell = (sig: string): string => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const last = alphabet.indexOf(sig[sig.length - 1] as string);
  const other = alphabet[(last & 0b110000) | ((last + 1) & 0b001111)] as string;
  return sig.slice(0, -1) + other;
};

describe("a signature's spelling (review of #53, non-blocking 1)", () => {
  it("refuses the same bytes spelled non-canonically, in admit and in verifyEs256", () => {
    const sig = respell(v.auth.frame.sig);
    expect(sig).not.toBe(v.auth.frame.sig);
    expect(Buffer.from(sig, "base64url").equals(Buffer.from(v.auth.frame.sig, "base64url"))).toBe(true);
    expect(admit({ ...v.auth.frame, sig }, ctx())).toEqual({ ok: false, code: "unauthenticated" });
    expect(verifyEs256(v.machineKey, v.auth.signingInput, sig)).toBe(false);
  });
});

describe("relayAdmissionSet: admission only from a verified estate record (DEC-0055; review of #53, A)", () => {
  const schemaValid = (record: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/estate-record.schema.json`, record).valid;
  type Case = { name: string; record: Record<string, any>; trust: { at: string; parent?: Record<string, any> } };
  const estate = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures", "vectors", "estate-record.json"), "utf8")) as {
    keys: { passkeyEs256: { authority: unknown } }; cases: Case[];
  };
  const [rev1, rev2] = [estate.cases[0]!.record, estate.cases[1]!.record];
  const pinned = [estate.keys.passkeyEs256.authority];
  const at1 = new Date(estate.cases[0]!.trust.at), at2 = new Date(estate.cases[1]!.trust.at);

  it("admits from revision 1 verified against the passkeys pinned at setup", () => {
    const result = relayAdmissionSet({ candidate: rev1, pinned, at: at1, schemaValid });
    expect(result.ok && [...result.set.keys()].sort()).toEqual(["m-4c1e#sig", "m-9a07#sig"]);
    expect(result.ok && result.revision).toBe(1);
  });

  it("applies revision 2 only against the revision held, and drops the machine it revokes", () => {
    const result = relayAdmissionSet({ held: rev1, candidate: rev2, pinned, at: at2, schemaValid });
    expect(result.ok && [...result.set.keys()]).toEqual(["m-4c1e#sig"]);
    expect(result.ok && result.held).toBe(rev2);
  });

  it("refuses an unverified candidate, a forged higher revision and a schema-invalid one, changing nothing", () => {
    const tampered = { ...rev1, machines: [...rev1.machines, { ...rev1.machines[0], id: "m-intruder" }] };
    expect(relayAdmissionSet({ candidate: tampered, pinned, at: at1, schemaValid })).toEqual({ ok: false, refusal: "unverified", problem: "digest-mismatch" });
    expect(relayAdmissionSet({ held: rev1, candidate: { ...rev2, revision: 3 }, pinned, at: at2, schemaValid }))
      .toMatchObject({ ok: false, refusal: "unverified" });
    expect(relayAdmissionSet({ candidate: rev1, pinned: [], at: at1, schemaValid })).toEqual({ ok: false, refusal: "unverified", problem: "no-trusted-authority" });
    expect(relayAdmissionSet({ held: rev1, candidate: rev1, pinned, at: at1, schemaValid })).toMatchObject({ ok: false, refusal: "unverified", problem: "broken-chain" });
    expect(relayAdmissionSet({ candidate: { ...rev1, schema: "estate-record/9" }, pinned, at: at1, schemaValid })).toEqual({ ok: false, refusal: "invalid" });
    // The held revision still admits after every refusal above: a refused candidate changes nothing.
    expect(relayAdmissionSet({ held: rev1, pinned, at: at1, schemaValid }).ok).toBe(true);
  });

  it("fails closed when the held revision's window has ended, and admits nobody without a record", () => {
    const after = new Date(Date.parse(rev1.validUntil) + 1000);
    expect(relayAdmissionSet({ held: rev1, pinned, at: after, schemaValid })).toEqual({ ok: false, refusal: "expired" });
    expect(relayAdmissionSet({ held: rev1, pinned, at: new Date(Date.parse(rev1.issuedAt) - 1000), schemaValid })).toEqual({ ok: false, refusal: "expired" });
    expect(relayAdmissionSet({ pinned, at: at1, schemaValid })).toEqual({ ok: false, refusal: "no-record" });
  });

  it("drops a machine revoked while still listed, and reads a record without revocations", () => {
    const held = { ...rev1, revocations: [{ kind: "machine", ref: "m-9a07", revokedAt: "2026-10-12T10:00:00Z" }] };
    const result = relayAdmissionSet({ held, pinned, at: at1, schemaValid });
    expect(result.ok && [...result.set.keys()]).toEqual(["m-4c1e#sig"]);
    const { revocations: _none, ...bare } = rev1;
    const all = relayAdmissionSet({ held: bare, pinned, at: at1, schemaValid });
    expect(all.ok && all.set.size).toBe(2);
  });

  it("drops a revoked device key, and admits exactly what the set holds", () => {
    const held = { ...rev1, revocations: [{ kind: "device-key", ref: "m-9a07#sig", revokedAt: "2026-10-12T10:00:00Z" }] };
    const result = relayAdmissionSet({ held, pinned, at: at1, schemaValid });
    expect(result.ok && [...result.set.keys()]).toEqual(["m-4c1e#sig"]);
  });
});

