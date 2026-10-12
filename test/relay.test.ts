import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
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

  // The refusals are shared vectors (fixtures/vectors/relay.json `admit`), run by test/relay-vectors.test.ts.
  it("names the window it uses", () => {
    expect(AUTH_WINDOW_SECONDS).toBe(60);
    expect(CLOCK_SKEW_SECONDS).toBe(60);
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

  // Every refusal and time boundary is a shared vector (fixtures/vectors/relay.json `messageBody`).
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
    // m-9a07's #sig is Ed25519, which devices.md admits and a relay participant may not use: it is left out, and named.
    expect(result.ok && [...result.set.keys()].sort()).toEqual(["m-4c1e#sig"]);
    expect(result.ok && result.excluded).toEqual([{ kid: "m-9a07#sig", reason: "unsupported-alg" }]);
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
    // At validUntil exactly the revision still admits, as verifyEstateRecord's `at > validUntil` reads it.
    expect(relayAdmissionSet({ held: rev1, pinned, at: new Date(rev1.validUntil), schemaValid }).ok).toBe(true);
    expect(relayAdmissionSet({ candidate: rev1, pinned, at: new Date(rev1.validUntil), schemaValid }).ok).toBe(true);
    const after = new Date(Date.parse(rev1.validUntil) + 1000);
    expect(relayAdmissionSet({ held: rev1, pinned, at: after, schemaValid })).toEqual({ ok: false, refusal: "expired" });
    expect(relayAdmissionSet({ held: rev1, pinned, at: new Date(Date.parse(rev1.issuedAt) - 1000), schemaValid })).toEqual({ ok: false, refusal: "expired" });
    expect(relayAdmissionSet({ pinned, at: at1, schemaValid })).toEqual({ ok: false, refusal: "no-record" });
  });

  it("drops a machine revoked while still listed, and reads a record without revocations", () => {
    const held = { ...rev1, revocations: [{ kind: "machine", ref: "m-4c1e", revokedAt: "2026-10-12T10:00:00Z" }] };
    const result = relayAdmissionSet({ held, pinned, at: at1, schemaValid });
    expect(result.ok && [...result.set.keys()]).toEqual([]);
    const { revocations: _none, ...bare } = rev1;
    const all = relayAdmissionSet({ held: bare, pinned, at: at1, schemaValid });
    expect(all.ok && all.set.size + all.excluded.length).toBe(2);
  });

  it("leaves out a #sig key SEC 1 refuses, naming it bad-key, so admit and a blob request never meet it", () => {
    const offCurve = Buffer.from(rev1.machines[0].deviceKeys[0].publicKey, "base64");
    offCurve[64] = offCurve[64]! ^ 1;
    const machines = rev1.machines.map((m: any, i: number) => (i === 0 ? { ...m, deviceKeys: m.deviceKeys.map((k: any) => (k.use === "sig" ? { ...k, publicKey: offCurve.toString("base64") } : k)) } : m));
    const result = relayAdmissionSet({ held: { ...rev1, machines }, pinned, at: at1, schemaValid });
    expect(result.ok && result.set.size).toBe(0);
    expect(result.ok && result.excluded).toEqual([{ kid: "m-4c1e#sig", reason: "bad-key" }, { kid: "m-9a07#sig", reason: "unsupported-alg" }]);
  });

  it("drops a revoked device key, and admits exactly what the set holds", () => {
    const held = { ...rev1, revocations: [{ kind: "device-key", ref: "m-9a07#sig", revokedAt: "2026-10-12T10:00:00Z" }] };
    const result = relayAdmissionSet({ held, pinned, at: at1, schemaValid });
    expect(result.ok && [...result.set.keys()]).toEqual(["m-4c1e#sig"]);
  });
});

