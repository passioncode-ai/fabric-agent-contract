import { createECDH, generateKeyPairSync } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { envelopeDigest, estateEnvelopeContext, hpkeOpenBase, hpkeSealBase, openEnvelope, sealEnvelope, type OpenContext, type SecretEnvelope } from "../src/secret-envelope.js";

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
  mayHold: (kid, agentRef, slot) => kid === SENDER && agentRef === vector.envelope.header.agentRef && slot === vector.envelope.header.slot,
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
    const base = { recipientKid: "m#kem", recipientKey, senderKid: "s#sig", senderKey: sender.privateKey, agentRef: "urn:fabric:agent:example:a", slot: "K", placement: 1,
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
      senderKid: SENDER, senderKey: sender.privateKey, agentRef: vector.envelope.header.agentRef, slot: vector.envelope.header.slot, placement: vector.open.placement,
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
    senderKid: SENDER, senderKey: sender.privateKey, agentRef: vector.envelope.header.agentRef, slot: vector.envelope.header.slot, placement: vector.open.placement,
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

  it("refuses the same 64 signature bytes spelled non-canonically (the last character's spare bits)", () => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    const last = alphabet.indexOf(vector.envelope.sig.slice(-1));
    const respelled = clone();
    respelled.sig = vector.envelope.sig.slice(0, -1) + alphabet[(last & 0b110000) | ((last + 1) & 0b001111)];
    expect(Buffer.from(respelled.sig, "base64url").equals(Buffer.from(vector.envelope.sig, "base64url"))).toBe(true);
    expect(openEnvelope(respelled, ctx())).toEqual({ ok: false, refusal: "bad-signature" });
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

describe("the open context from the estate record (DEC-0055; review of #53, B)", () => {
  // A revision as the target applies it after verifyEstateRecord: m-4c1e's #sig is replaced with a key this test holds,
  // so the holder the record names really signs; everything else is the record fixture's.
  type Json = Record<string, any>;
  const base = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures", "positive", "estate-record-first.json"), "utf8")) as Json;
  const holderKey = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const octets = (pub: ReturnType<typeof generateKeyPairSync>["publicKey"]) => {
    const jwk = pub.export({ format: "jwk" }) as Record<string, string>;
    return Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x!, "base64url"), Buffer.from(jwk.y!, "base64url")]).toString("base64");
  };
  const withHolder = (record: Json, revision: number, mutate: (r: Json) => void = () => {}): Json => {
    const r = JSON.parse(JSON.stringify(record)) as Json;
    r.revision = revision;
    for (const m of r.machines) for (const k of m.deviceKeys) if (k.kid === "m-4c1e#sig") k.publicKey = octets(holderKey.publicKey);
    mutate(r);
    return r;
  };
  const target = base.machines[0].id as string; // m-4c1e: the machine the secret is placed on, and its holder
  const kem = Buffer.from(base.machines[0].deviceKeys.find((k: Json) => k.use === "kem").publicKey, "base64");
  const kemKid = base.machines[0].deviceKeys.find((k: Json) => k.use === "kem").kid as string;
  const { agentRef, slot, from } = base.machines[0].secrets[0] as { agentRef: string; slot: string; from: string };
  const seal = (over: Record<string, unknown> = {}) => sealEnvelope({ recipientKid: kemKid, recipientKey: kem, senderKid: `${from}#sig`,
    senderKey: holderKey.privateKey, agentRef, slot, placement: 1, iat: new Date("2026-10-12T00:00:00Z"), exp: new Date("2026-10-12T01:00:00Z"),
    secret: Buffer.from("x"), ...over });
  const otherKem = createECDH("prime256v1");
  otherKem.generateKeys();
  const open = (envelope: unknown, applied: Json[]) => openEnvelope(envelope, {
    ownKemKid: kemKid, ownKemPrivateKey: otherKem.getPrivateKey(), now: new Date("2026-10-12T00:30:00Z"), ...estateEnvelopeContext(applied, target)
  });

  it("seals to the record's #kem key as base64 SEC 1, and opens up to HPKE on the record's holder, key and revision", () => {
    expect(seal().header).toMatchObject({ recipient: kemKid, agentRef, slot, placement: 1, alg: "ES256" });
    // Every check passes on the record's data; HPKE refuses only because no fixture holds the target's private half.
    expect(open(seal(), [withHolder(base, 1)])).toEqual({ ok: false, refusal: "cannot-open" });
  });

  it("refuses a sender the record does not name for that agent's slot, even with the same slot name", () => {
    const twoAgents = withHolder(base, 1, (r) => {
      r.machines[0].secrets.push({ agentRef: "urn:fabric:agent:example:other", slot, from: r.machines[1].id });
    });
    const forOther = seal({ agentRef: "urn:fabric:agent:example:other" });
    expect(open(forOther, [twoAgents])).toEqual({ ok: false, refusal: "sender-not-allowed" });
    expect(open(seal(), [twoAgents])).toEqual({ ok: false, refusal: "cannot-open" });
  });

  it("keeps a placement current while it is unchanged, and makes an envelope under a replaced one stale", () => {
    const r1 = withHolder(base, 1), r2 = withHolder(base, 2);
    const moved = withHolder(base, 3, (r) => { r.machines[0].secrets[0].from = r.machines[1].id; });
    const back = withHolder(base, 4);
    const ctx = estateEnvelopeContext([r1, r2], target);
    expect(ctx.currentPlacement(agentRef, slot)).toBe(1); // unchanged since revision 1
    expect(open(seal({ placement: 1 }), [r1, r2])).toEqual({ ok: false, refusal: "cannot-open" });
    expect(estateEnvelopeContext([r1, r2, moved, back], target).currentPlacement(agentRef, slot)).toBe(4);
    expect(open(seal({ placement: 2 }), [r1, r2, moved, back])).toEqual({ ok: false, refusal: "placement-stale" });
    expect(estateEnvelopeContext([r1], target).currentPlacement("urn:fabric:agent:example:none", slot)).toBeUndefined();
  });

  it("takes the sender's key from the record, and none for a revoked machine or key", () => {
    const r = withHolder(base, 1);
    const ctx = estateEnvelopeContext([r], target);
    expect(ctx.senderKey(`${from}#sig`)).toEqual(Buffer.from(octets(holderKey.publicKey), "base64"));
    expect(ctx.senderKey("nobody#sig")).toBeUndefined();
    const revokedKey = withHolder(base, 1, (x) => { x.revocations = [{ kind: "device-key", ref: `${from}#sig`, revokedAt: "2026-10-12T00:00:00Z" }]; });
    expect(estateEnvelopeContext([revokedKey], target).mayHold(`${from}#sig`, agentRef, slot)).toBe(false);
    const revokedMachine = withHolder(base, 1, (x) => { x.revocations = [{ kind: "machine", ref: from, revokedAt: "2026-10-12T00:00:00Z" }]; });
    expect(estateEnvelopeContext([revokedMachine], target).senderKey(`${from}#sig`)).toBeUndefined();
    const bare = withHolder(base, 1, (x) => { delete x.machines[0].secrets; });
    expect(estateEnvelopeContext([bare], target).mayHold(`${from}#sig`, agentRef, slot)).toBe(false);
    const none = estateEnvelopeContext([], target);
    expect([none.mayHold(`${from}#sig`, agentRef, slot), none.currentPlacement(agentRef, slot), none.senderKey(`${from}#sig`)]).toEqual([false, undefined, undefined]);
  });
});
