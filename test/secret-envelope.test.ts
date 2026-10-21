import { createECDH, createHash, generateKeyPairSync } from "node:crypto";
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
  appliedRevision: () => vector.open.placement,
  lastOpened: () => undefined,
  now: new Date(vector.open.now),
  ...over
});

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
    expect(result).toMatchObject({ ok: true, secret: Buffer.from(vector.open.secret) });
    // The mark the target writes with the secret: the run, the signed sequence and the envelope's digest.
    expect(result.ok && result.mark).toEqual({ agentRef: vector.envelope.header.agentRef, slot: vector.envelope.header.slot, since: vector.open.placement,
      sequence: vector.envelope.header.envelopeSequence, digest: vector.digest });
  });

  it("round-trips a fresh envelope and never seals to an invalid key", () => {
    const kem = createECDH("prime256v1");
    kem.generateKeys();
    const pk = kem.getPublicKey(null, "uncompressed");
    const recipientKey = { kty: "EC", crv: "P-256", x: pk.subarray(1, 33).toString("base64url"), y: pk.subarray(33).toString("base64url") };
    const sender = generateKeyPairSync("ec", { namedCurve: "P-256" });
    const base = { recipientKid: "m#kem", recipientKey, senderKid: "s#sig", senderKey: sender.privateKey, agentRef: "urn:fabric:agent:example:a", slot: "K", placement: 1, envelopeSequence: 1,
      iat: new Date("2026-10-12T00:00:00Z"), exp: new Date("2026-10-12T01:00:00Z"), secret: Buffer.from("v") };
    const envelope = sealEnvelope(base);
    const open = openEnvelope(envelope, {
      ownKemKid: "m#kem", ownKemPrivateKey: kem.getPrivateKey(), senderKey: () => sender.publicKey.export({ format: "jwk" }),
      mayHold: () => true, currentPlacement: () => 1, appliedRevision: () => 1, lastOpened: () => undefined, now: new Date("2026-10-12T00:30:00Z")
    });
    expect(open).toMatchObject({ ok: true, secret: Buffer.from("v") });
    expect(envelope.header.envelopeSequence).toBe(1);
    expect(() => sealEnvelope({ ...base, recipientKey: { ...recipientKey, y: recipientKey.x } })).toThrow(/bad-key/);
  });

  it("never seals one that lives longer than 24 hours, and refuses one that cannot be opened", () => {
    const sender = generateKeyPairSync("ec", { namedCurve: "P-256" });
    const senderKey = sender.publicKey.export({ format: "jwk" }) as Record<string, string>;
    const seal = (over: Record<string, unknown>) => sealEnvelope({ recipientKid: vector.open.ownKemKid, recipientKey: vector.recipientKey,
      senderKid: SENDER, senderKey: sender.privateKey, agentRef: vector.envelope.header.agentRef, slot: vector.envelope.header.slot, placement: vector.open.placement, envelopeSequence: 1,
      iat: new Date("2026-10-12T00:00:00Z"), exp: new Date("2026-10-13T00:00:01Z"), secret: Buffer.from("x"), ...over });
    // The opener's refusal of a long life is a shared vector; the sealer refuses to make one at all (DEC-0066).
    expect(() => seal({})).toThrow(/lifetime-too-long/);
    const otherKem = createECDH("prime256v1");
    otherKem.generateKeys();
    const sealed = seal({ exp: new Date("2026-10-12T12:00:00Z") });
    expect(openEnvelope(sealed, ctx({ senderKey: () => senderKey, ownKemPrivateKey: otherKem.getPrivateKey() })))
      .toEqual({ ok: false, refusal: "cannot-open" });
  });
});

// Every refusal and boundary of the open checks is a shared vector (fixtures/vectors/secret-envelope.json `cases`,
// run by test/relay-vectors.test.ts).
describe("the review's boundaries (DEC-0047 items 3, 7 and 8)", () => {
  const sender = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const senderKey = sender.publicKey.export({ format: "jwk" }) as Record<string, string>;
  const T0 = Date.parse("2026-10-12T00:00:00Z");
  const seal = (over: Record<string, unknown> = {}) => sealEnvelope({ recipientKid: vector.open.ownKemKid, recipientKey: vector.recipientKey,
    senderKid: SENDER, senderKey: sender.privateKey, agentRef: vector.envelope.header.agentRef, slot: vector.envelope.header.slot, placement: vector.open.placement, envelopeSequence: 1,
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
    expect(open(sealed)).toMatchObject({ ok: true, secret: Buffer.from("x") });
  });

  it("seals only under a sequence from 1 to 2^53 - 1 (owner's item 11)", () => {
    for (const envelopeSequence of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, Number.NaN]) {
      expect(() => seal({ envelopeSequence }), String(envelopeSequence)).toThrow(/envelopeSequence/);
    }
    expect(seal({ envelopeSequence: Number.MAX_SAFE_INTEGER }).header.envelopeSequence).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("never consumes a sequence on an envelope every target refuses: the shape and the life are checked before signing (R4)", () => {
    const refused = (over: Record<string, unknown>) => expect(() => seal(over), JSON.stringify(over)).toThrow(/malformed|lifetime/);
    for (const placement of [0, -1, 1.5, 2 ** 53]) refused({ placement });
    refused({ slot: "lower" });
    refused({ agentRef: "agent:Inbox" });
    refused({ recipientKid: `${"m".repeat(296)}#kem` });
    refused({ exp: new Date(T0) });
    refused({ exp: new Date(T0 - 1000) });
    refused({ exp: new Date(T0 + 86_401_000) });
    refused({ exp: new Date(T0 + 300) }); // 0.3 s: both read to the whole second, so exp is iat
    expect(seal({ exp: new Date(T0 + 86_400_000) }).header.exp).toBe("2026-10-13T00:00:00Z");
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
    senderKey: holderKey.privateKey, agentRef, slot, placement: 1, envelopeSequence: 1, iat: new Date("2026-10-12T00:00:00Z"), exp: new Date("2026-10-12T01:00:00Z"),
    secret: Buffer.from("x"), ...over });
  const otherKem = createECDH("prime256v1");
  otherKem.generateKeys();
  const open = (envelope: unknown, applied: Json[]) => openEnvelope(envelope, {
    ownKemKid: kemKid, ownKemPrivateKey: otherKem.getPrivateKey(), now: new Date("2026-10-12T00:30:00Z"), lastOpened: () => undefined, ...estateEnvelopeContext(applied, target)
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

  it("refuses a sender whose key or machine a delta entry revoked, by kid or by key reference, before the next revision (DEC-0084)", () => {
    const r1 = withHolder(base, 1);
    const sender = `${from}#sig`;
    const keyRef = `${sender}@sha256:${createHash("sha256").update(Buffer.from(octets(holderKey.publicKey), "base64")).digest("hex")}`;
    const withExtra = (extra: unknown[]) => openEnvelope(seal(), {
      ownKemKid: kemKid, ownKemPrivateKey: otherKem.getPrivateKey(), now: new Date("2026-10-12T00:30:00Z"), lastOpened: () => undefined, ...estateEnvelopeContext([r1], target, extra)
    });
    expect(withExtra([])).toEqual({ ok: false, refusal: "cannot-open" });
    for (const extra of [[{ kind: "device-key", ref: keyRef }], [{ kind: "device-key", ref: sender }], [{ kind: "machine", ref: from }]]) {
      // No sender key is left for the kid, so the envelope is refused before its signature is read.
      expect(withExtra(extra), JSON.stringify(extra)).toEqual({ ok: false, refusal: "bad-key" });
      expect(estateEnvelopeContext([r1], target, extra).mayHold(sender, agentRef, slot)).toBe(false);
      expect(estateEnvelopeContext([r1], target, extra).senderKey(sender)).toBeUndefined();
    }
    // An older key under the same kid, revoked by its reference, leaves the listed key the sender.
    const older = `${sender}@sha256:${"0".repeat(64)}`;
    expect(withExtra([{ kind: "device-key", ref: older }])).toEqual({ ok: false, refusal: "cannot-open" });
    expect(estateEnvelopeContext([r1], target, [{ kind: "device-key", ref: older }]).senderKey(sender)).toBeDefined();
    // A key with no canonical fingerprint is matched by its kid alone (FAC-SEM-073 refuses such a record anyway).
    const unpadded = withHolder(base, 1, (r) => { for (const k of r.machines[0].deviceKeys) if (k.kid === sender) k.publicKey = k.publicKey.replace(/=+$/, ""); });
    expect(estateEnvelopeContext([unpadded], target, [{ kind: "device-key", ref: older }]).senderKey(sender)).toBeDefined();
    expect(estateEnvelopeContext([unpadded], target, [{ kind: "device-key", ref: sender }]).senderKey(sender)).toBeUndefined();
  });

  it("refuses a holder the latest applied revision replaced, though an earlier one named it (review of #53, third reading 1)", () => {
    const r1 = withHolder(base, 1);
    const moved = withHolder(base, 2, (r) => { r.machines[0].secrets[0].from = r.machines[1].id; });
    expect(estateEnvelopeContext([r1, moved], target).mayHold(`${from}#sig`, agentRef, slot)).toBe(false);
    expect(open(seal({ placement: 2 }), [r1, moved])).toEqual({ ok: false, refusal: "sender-not-allowed" });
  });

  it("refuses an envelope placed by a revision newer than the target has applied (third reading 5)", () => {
    const r1 = withHolder(base, 1), r2 = withHolder(base, 2);
    expect(estateEnvelopeContext([r1, r2], target).appliedRevision()).toBe(2);
    expect(open(seal({ placement: 2 }), [r1, r2])).toEqual({ ok: false, refusal: "cannot-open" });
    expect(open(seal({ placement: 3 }), [r1, r2])).toEqual({ ok: false, refusal: "placement-stale" });
    expect(estateEnvelopeContext([], target).appliedRevision()).toBeUndefined();
    expect(openEnvelope(vector.envelope, ctx({ appliedRevision: () => undefined }))).toEqual({ ok: false, refusal: "placement-stale" });
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

// DEC-0066 (CON-005): openEnvelope's first step is envelopeShape, a hand-written check that is exactly
// secret-envelope.schema.json plus real instants (a schema cannot say that a day exists). The parity is measured, so a
// schema edit the code misses fails here: over every secret-envelope fixture of the catalogue and every vector case.
describe("envelopeShape is the schema (parity)", async () => {
  const { createValidator, validateDocument } = await import("../src/validator.js");
  const { SCHEMA_PREFIX } = await import("../src/contract.js");
  const { instant } = await import("../src/relay.js");
  const { envelopeShape } = await import("../src/secret-envelope.js");
  const validator = await createValidator();
  const schemaValid = (value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/secret-envelope.schema.json`, value).valid;
  const realInstants = (value: unknown) => {
    const header = (value as { header?: { iat?: unknown; exp?: unknown } }).header;
    return instant(header?.iat) !== undefined && instant(header?.exp) !== undefined;
  };
  const read = (relative: string) => JSON.parse(readFileSync(path.join(projectRoot(), relative), "utf8"));
  const catalogue = (read("fixtures/catalogue.json") as Array<{ schema: string; path: string; name: string }>).filter((entry) => entry.schema === "secret-envelope.schema.json");
  const cases = (read("fixtures/vectors/secret-envelope.json").cases as Array<{ name: string; envelope: unknown }>);
  const inputs: Array<[string, unknown]> = [
    ...catalogue.map((entry) => [`catalogue ${entry.name}`, read(`fixtures/${entry.path}`)] as [string, unknown]),
    ...cases.map((c) => [`vector ${c.name}`, c.envelope] as [string, unknown])
  ];

  it("has fixtures on both sides", () => {
    expect(inputs.some(([, x]) => schemaValid(x))).toBe(true);
    expect(inputs.some(([, x]) => !schemaValid(x))).toBe(true);
    expect(catalogue.map((entry) => entry.name)).toEqual(expect.arrayContaining(["secret-envelope-without-sequence", "secret-envelope-sequence-zero"]));
  });

  it.each(inputs)("%s", (_name, input) => {
    expect(envelopeShape(input)).toBe(schemaValid(input) && realInstants(input));
  });
});

// DEC-0082: an envelope names no context, so a target reads only its personal secret placements, and an organization's
// instance fills its slot on its own machine (FAC-SEM-075), never by an envelope.
describe("the open context with per-context secret placements (DEC-0082)", () => {
  type Rec = Record<string, any>;
  const contexts = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures", "positive", "estate-record-contexts.json"), "utf8")) as Rec;
  const placement = contexts.machines[0].packages[1] as Rec; // the first organization's instance and its share grant
  const { agentRef, slot } = contexts.machines[1].secrets[0] as { agentRef: string; slot: string };
  /** m-9a07 also runs the organization's instance, its slot filled locally, listed before or after the personal one. */
  const record = (orgFirst: boolean): Rec => {
    const r = JSON.parse(JSON.stringify(contexts)) as Rec;
    const machine = r.machines[1];
    machine.packages.push({ ...placement });
    const org = { agentRef, slot, from: machine.id, context: placement.context };
    machine.secrets = orgFirst ? [org, ...machine.secrets] : [...machine.secrets, org];
    return r;
  };

  it("decides the personal sealer whatever the order of the record's secret placements", () => {
    for (const orgFirst of [true, false]) {
      const ctx = estateEnvelopeContext([record(orgFirst)], "m-9a07");
      expect(ctx.mayHold("m-4c1e#sig", agentRef, slot), `org first: ${orgFirst}`).toBe(true);
      expect(ctx.currentPlacement(agentRef, slot), `org first: ${orgFirst}`).toBe(Number(contexts.revision));
    }
  });

  it("never admits an envelope for the organization's slot, not even from the machine that holds it", () => {
    for (const orgFirst of [true, false]) {
      const ctx = estateEnvelopeContext([record(orgFirst)], "m-9a07");
      expect(ctx.mayHold("m-9a07#sig", agentRef, slot), `org first: ${orgFirst}`).toBe(false);
    }
    // With only the organization's slot on the machine, nothing admits an envelope for it at all.
    const orgOnly = record(true);
    orgOnly.machines[1].secrets = orgOnly.machines[1].secrets.slice(0, 1);
    const ctx = estateEnvelopeContext([orgOnly], "m-9a07");
    expect(ctx.mayHold("m-9a07#sig", agentRef, slot)).toBe(false);
    expect(ctx.mayHold("m-4c1e#sig", agentRef, slot)).toBe(false);
    expect(ctx.currentPlacement(agentRef, slot)).toBeUndefined();
  });

  it("reads context personal spelled out as the personal placement", () => {
    const r = record(true);
    r.machines[1].secrets[1].context = "personal";
    expect(estateEnvelopeContext([r], "m-9a07").mayHold("m-4c1e#sig", agentRef, slot)).toBe(true);
  });
});
