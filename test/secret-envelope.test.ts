import { createECDH, generateKeyPairSync } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { envelopeDigest, hpkeOpenBase, hpkeSealBase, openEnvelope, sealEnvelope, type OpenContext, type SecretEnvelope } from "../src/secret-envelope.js";

// DEC-0047 item 7. The HPKE suite is checked against RFC 9180 §A.3.1 (text pinned in docs/evidence/sources.md); the
// envelope against the shared vector every consumer runs.
const hex = (s: string) => Buffer.from(s.replace(/\s+/g, ""), "hex");
const RFC9180_A31 = {
  info: hex("4f6465206f6e2061204772656369616e2055726e"),
  skEm: hex("4995788ef4b9d6132b249ce59a77281493eb39af373d236a1fe415cb0c2d7beb"),
  pkRm: hex(`04fe8c19ce0905191ebc298a9245792531f26f0cece2460639e8bc39cb7f70
             6a826a779b4cf969b8a0e539c7f62fb3d30ad6aa8f80e30f1d128aafd68a2ce72ea0`),
  skRm: hex("f3ce7fdae57e1a310d87f1ebbde6f328be0a99cdbcadf4d6589cf29de4b8ffd2"),
  enc: hex(`04a92719c6195d5085104f469a8b9814d5838ff72b60501e2c4466e5e67b325
            ac98536d7b61a1af4b78e5b7f951c0900be863c403ce65c9bfcb9382657222d18c4`),
  pt: hex("4265617574792069732074727574682c20747275746820626561757479"),
  aad: hex("436f756e742d30"),
  ct: hex(`5ad590bb8baa577f8619db35a36311226a896e7342a6d836d8b7bcd2f20b6c7f
           9076ac232e3ab2523f39513434`)
};

type Vector = {
  recipientKemPrivateKey: string; recipientKey: Record<string, string>; senderKey: Record<string, string>;
  recipientKeyOctets: string; senderKeyOctets: string;
  envelope: SecretEnvelope; digest: string; open: { ownKemKid: string; placement: number; now: string; secret: string };
};
const vector = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures", "vectors", "secret-envelope.json"), "utf8")) as Vector;
const SENDER = vector.envelope.header.sender;
const ctx = (over: Partial<OpenContext> = {}): OpenContext => ({
  ownKemKid: vector.open.ownKemKid,
  ownKemPrivateKey: Buffer.from(vector.recipientKemPrivateKey, "hex"),
  senderKey: (kid) => (kid === SENDER ? vector.senderKey : undefined),
  mayHold: (kid, slot) => kid === SENDER && slot === vector.envelope.header.slot,
  currentPlacement: () => vector.open.placement,
  now: new Date(vector.open.now),
  ...over
});
const clone = (): SecretEnvelope => JSON.parse(JSON.stringify(vector.envelope)) as SecretEnvelope;

describe("HPKE base mode, DHKEM(P-256, HKDF-SHA256) / HKDF-SHA256 / AES-128-GCM", () => {
  it("reproduces RFC 9180 §A.3.1's encapsulated key and first ciphertext", () => {
    const { enc, ct } = hpkeSealBase(RFC9180_A31.pkRm, RFC9180_A31.info, RFC9180_A31.aad, RFC9180_A31.pt, RFC9180_A31.skEm);
    expect(enc.toString("hex")).toBe(RFC9180_A31.enc.toString("hex"));
    expect(ct.toString("hex")).toBe(RFC9180_A31.ct.toString("hex"));
  });

  it("draws a fresh ephemeral key when none is fixed, and still opens", () => {
    const first = hpkeSealBase(RFC9180_A31.pkRm, RFC9180_A31.info, RFC9180_A31.aad, RFC9180_A31.pt);
    const second = hpkeSealBase(RFC9180_A31.pkRm, RFC9180_A31.info, RFC9180_A31.aad, RFC9180_A31.pt);
    expect(first.enc.equals(second.enc)).toBe(false);
    expect(hpkeOpenBase(RFC9180_A31.skRm, first.enc, RFC9180_A31.info, RFC9180_A31.aad, first.ct).toString("hex")).toBe(RFC9180_A31.pt.toString("hex"));
  });

  it("opens RFC 9180 §A.3.1's ciphertext and refuses it under other additional data", () => {
    expect(hpkeOpenBase(RFC9180_A31.skRm, RFC9180_A31.enc, RFC9180_A31.info, RFC9180_A31.aad, RFC9180_A31.ct).toString("hex"))
      .toBe(RFC9180_A31.pt.toString("hex"));
    expect(() => hpkeOpenBase(RFC9180_A31.skRm, RFC9180_A31.enc, RFC9180_A31.info, Buffer.from("Count-1"), RFC9180_A31.ct)).toThrow();
  });
});

describe("fabric-secret-envelope/1", () => {
  it("opens the shared vector and names it by its digest", () => {
    expect(envelopeDigest(vector.envelope)).toBe(vector.digest);
    const result = openEnvelope(vector.envelope, ctx());
    expect(result).toEqual({ ok: true, secret: Buffer.from(vector.open.secret) });
  });

  it("round-trips a fresh envelope and never seals to an invalid key", () => {
    const kem = createECDH("prime256v1");
    kem.generateKeys();
    const pk = kem.getPublicKey(null, "uncompressed");
    const recipientKey = { kty: "EC", crv: "P-256", x: pk.subarray(1, 33).toString("base64url"), y: pk.subarray(33).toString("base64url") };
    const sender = generateKeyPairSync("ec", { namedCurve: "P-256" });
    const base = { recipientKid: "m#kem", recipientKey, senderKid: "s#sig", senderKey: sender.privateKey, slot: "K", placement: 1,
      iat: new Date("2026-10-12T00:00:00Z"), exp: new Date("2026-10-12T01:00:00Z"), secret: Buffer.from("v") };
    const envelope = sealEnvelope(base);
    const open = openEnvelope(envelope, {
      ownKemKid: "m#kem", ownKemPrivateKey: kem.getPrivateKey(), senderKey: () => sender.publicKey.export({ format: "jwk" }),
      mayHold: () => true, currentPlacement: () => 1, now: new Date("2026-10-12T00:30:00Z")
    });
    expect(open).toEqual({ ok: true, secret: Buffer.from("v") });
    expect(() => sealEnvelope({ ...base, recipientKey: { ...recipientKey, y: recipientKey.x } })).toThrow(/bad-key/);
  });

  it("refuses each failed check by name, before opening anything", () => {
    const cases: Array<[string, unknown, Partial<OpenContext>, string]> = [
      ["not an envelope", { header: {} }, {}, "malformed"],
      ["another machine's envelope", vector.envelope, { ownKemKid: "urn:fabric:machine:other#kem" }, "wrong-recipient"],
      ["a sender the record does not list", vector.envelope, { senderKey: () => undefined }, "bad-key"],
      ["a sender key off the curve", vector.envelope, { senderKey: () => ({ ...vector.senderKey, y: vector.senderKey.x }) }, "bad-key"],
      ["a sender that may not hold the slot", vector.envelope, { mayHold: () => false }, "sender-not-allowed"],
      ["a placement older than the current one", vector.envelope, { currentPlacement: () => vector.open.placement + 1 }, "placement-stale"],
      ["a slot not placed here", vector.envelope, { currentPlacement: () => undefined }, "placement-stale"],
      ["after exp", vector.envelope, { now: new Date("2026-10-12T12:00:00Z") }, "expired"]
    ];
    for (const [name, envelope, over, refusal] of cases) expect(openEnvelope(envelope, ctx(over)), name).toEqual({ ok: false, refusal });
  });

  it("refuses an envelope whose header, ciphertext or signature was changed", () => {
    const slot = clone();
    slot.header.slot = "OTHER_KEY";
    expect(openEnvelope(slot, ctx({ mayHold: () => true }))).toEqual({ ok: false, refusal: "bad-signature" });
    const ct = clone();
    ct.ct = Buffer.from(Buffer.from(ct.ct, "base64url").map((b, i) => (i === 0 ? b ^ 1 : b))).toString("base64url");
    expect(openEnvelope(ct, ctx())).toEqual({ ok: false, refusal: "bad-signature" });
    const longLived = clone();
    longLived.header.exp = "2026-10-14T00:00:00Z";
    expect(openEnvelope(longLived, ctx())).toEqual({ ok: false, refusal: "bad-signature" });
  });

  it("refuses a validly signed envelope that lives longer than 24 hours or cannot be opened", () => {
    const sender = generateKeyPairSync("ec", { namedCurve: "P-256" });
    const senderKey = sender.publicKey.export({ format: "jwk" }) as Record<string, string>;
    const seal = (over: Record<string, unknown>) => sealEnvelope({ recipientKid: vector.open.ownKemKid, recipientKey: vector.recipientKey,
      senderKid: SENDER, senderKey: sender.privateKey, slot: vector.envelope.header.slot, placement: vector.open.placement,
      iat: new Date("2026-10-12T00:00:00Z"), exp: new Date("2026-10-13T00:00:01Z"), secret: Buffer.from("x"), ...over });
    expect(openEnvelope(seal({}), ctx({ senderKey: () => senderKey }))).toEqual({ ok: false, refusal: "lifetime-too-long" });
    const otherKem = createECDH("prime256v1");
    otherKem.generateKeys();
    const sealed = seal({ exp: new Date("2026-10-12T12:00:00Z") });
    expect(openEnvelope(sealed, ctx({ senderKey: () => senderKey, ownKemPrivateKey: otherKem.getPrivateKey() })))
      .toEqual({ ok: false, refusal: "cannot-open" });
  });
});

describe("the review's boundaries (DEC-0047 items 3, 7 and 8)", () => {
  const sender = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const senderKey = sender.publicKey.export({ format: "jwk" }) as Record<string, string>;
  const T0 = Date.parse("2026-10-12T00:00:00Z");
  const seal = (over: Record<string, unknown> = {}) => sealEnvelope({ recipientKid: vector.open.ownKemKid, recipientKey: vector.recipientKey,
    senderKid: SENDER, senderKey: sender.privateKey, slot: vector.envelope.header.slot, placement: vector.open.placement,
    iat: new Date(T0), exp: new Date(T0 + 3_600_000), secret: Buffer.from("x"), ...over });
  const open = (envelope: unknown, over: Partial<OpenContext> = {}) =>
    openEnvelope(envelope, ctx({ senderKey: () => senderKey, now: new Date(T0 + 1_000), ...over }));

  it("gives the same answers for keys as DEC-0053's SEC 1 octets as for JWKs, sealing and opening", () => {
    const octetSender = Buffer.from(vector.senderKeyOctets, "base64");
    expect(openEnvelope(vector.envelope, ctx({ senderKey: () => octetSender }))).toEqual(openEnvelope(vector.envelope, ctx()));
    const sealed = seal({ recipientKey: Buffer.from(vector.recipientKeyOctets, "base64"), ephemeralPrivateKey: Buffer.alloc(32, 7) });
    const again = seal({ ephemeralPrivateKey: Buffer.alloc(32, 7) });
    expect(sealed.header).toEqual(again.header);
    expect(sealed.ct).toBe(again.ct);
    expect(open(sealed)).toEqual({ ok: true, secret: Buffer.from("x") });
  });

  it("signs the algorithm in the header and refuses another, or an Ed25519 sender, as unsupported-alg", () => {
    expect(vector.envelope.header.alg).toBe("ES256");
    const other = clone();
    (other.header as { alg: string }).alg = "EdDSA";
    expect(openEnvelope(other, ctx())).toEqual({ ok: false, refusal: "unsupported-alg" });
    const ed = generateKeyPairSync("ed25519").publicKey.export({ format: "jwk" });
    expect(openEnvelope(vector.envelope, ctx({ senderKey: () => ed }))).toEqual({ ok: false, refusal: "unsupported-alg" });
  });

  it("refuses a time that matches the pattern and is no date, and a time ahead of the clock", () => {
    const bad = clone();
    bad.header.iat = "2026-13-45T25:61:61Z";
    expect(openEnvelope(bad, ctx())).toEqual({ ok: false, refusal: "malformed" });
    expect(open(seal(), { now: new Date(T0 - 60_000) }).ok).toBe(true);
    expect(open(seal(), { now: new Date(T0 - 61_000) })).toEqual({ ok: false, refusal: "not-yet-valid" });
  });

  it("holds the life at exactly 24 hours and refuses exp equal to iat", () => {
    expect(open(seal({ exp: new Date(T0 + 86_400_000) })).ok).toBe(true);
    expect(open(seal({ exp: new Date(T0 + 86_401_000) }))).toEqual({ ok: false, refusal: "lifetime-too-long" });
    expect(open(seal({ exp: new Date(T0) }))).toEqual({ ok: false, refusal: "lifetime-too-long" });
    expect(open(seal(), { now: new Date(T0 + 3_600_000) })).toEqual({ ok: false, refusal: "expired" });
  });

  it("refuses an encapsulated key off the curve and a signature that is not 64 canonical bytes", () => {
    const offCurve = clone();
    const enc = Buffer.from(offCurve.header.enc, "base64url");
    enc[64] = (enc[64] as number) ^ 1;
    offCurve.header.enc = enc.toString("base64url");
    expect(openEnvelope(offCurve, ctx())).toEqual({ ok: false, refusal: "bad-key" });
    const short = clone();
    short.sig = short.sig.slice(0, 80);
    expect(openEnvelope(short, ctx())).toEqual({ ok: false, refusal: "bad-signature" });
  });

  it("seals only to a #kem key, signed by a #sig key", () => {
    expect(() => seal({ recipientKid: "urn:fabric:machine:example-gpu-box#sig" })).toThrow(/wrong-recipient/);
    expect(() => seal({ senderKid: "urn:fabric:machine:example-laptop#kem" })).toThrow(/bad-key/);
  });
});

describe("keys as the estate record stores them (DEC-0055, DEC-0053's base64 SEC 1)", () => {
  // The record's machine keys are public halves only (their private halves were never kept), so the test seals to the
  // record's #kem key and runs every open check up to HPKE on the record's own data: who may hold the slot, the
  // revision as the placement. Opening itself needs the target's private key, which no fixture holds.
  type Record_ = { revision: number; machines: Array<{ id: string; deviceKeys: Array<{ kid: string; use: string; publicKey: string }>;
    secrets: Array<{ slot: string; from: string }> }> };
  const record = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures", "positive", "estate-record-first.json"), "utf8")) as Record_;
  const machine = record.machines[0]!;
  const keyOf = (use: string) => Buffer.from(machine.deviceKeys.find((k) => k.use === use)!.publicKey, "base64");
  const kemKid = machine.deviceKeys.find((k) => k.use === "kem")!.kid;
  const sigKid = machine.deviceKeys.find((k) => k.use === "sig")!.kid;
  const slot = machine.secrets[0]!.slot;
  const sender = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const senderKid = `${machine.secrets[0]!.from}-peer#sig`;
  const sealed = sealEnvelope({ recipientKid: kemKid, recipientKey: keyOf("kem"), senderKid, senderKey: sender.privateKey, slot,
    placement: record.revision, iat: new Date("2026-10-12T00:00:00Z"), exp: new Date("2026-10-12T01:00:00Z"), secret: Buffer.from("x") });
  const other = createECDH("prime256v1");
  other.generateKeys();
  const recordCtx = (over: Partial<OpenContext> = {}): OpenContext => ({
    ownKemKid: kemKid, ownKemPrivateKey: other.getPrivateKey(), senderKey: (kid) => (kid === senderKid ? sender.publicKey.export({ format: "jwk" }) : undefined),
    mayHold: (kid, name) => kid === senderKid && machine.secrets.some((s) => s.slot === name),
    currentPlacement: () => record.revision, now: new Date("2026-10-12T00:30:00Z"), ...over
  });

  it("seals to the record's #kem key, given as base64 SEC 1 octets", () => {
    expect(sealed.header).toMatchObject({ recipient: kemKid, slot, placement: record.revision, alg: "ES256" });
    expect(record.revision).toBeGreaterThanOrEqual(1);
  });

  it("passes every open check on the record's data, and stops only at HPKE without the target's private key", () => {
    expect(openEnvelope(sealed, recordCtx())).toEqual({ ok: false, refusal: "cannot-open" });
    expect(openEnvelope(sealed, recordCtx({ currentPlacement: () => record.revision + 1 }))).toEqual({ ok: false, refusal: "placement-stale" });
  });

  it("reads the record's #sig key as a valid P-256 key: a wrong signer is bad-signature, never bad-key", () => {
    expect(openEnvelope(sealed, recordCtx({ senderKey: () => keyOf("sig") }))).toEqual({ ok: false, refusal: "bad-signature" });
    expect(sigKid.endsWith("#sig")).toBe(true);
  });
});

