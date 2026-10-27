import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import {
  MAX_PEER_ENVELOPE_DAYS,
  PEER_CODE_DIGITS,
  checkPeerReport,
  checkPeerShareEnvelope,
  checkedPeerCode,
  claimHolds,
  claimMac,
  openPeerReport,
  openPeerShare,
  parseShareLink,
  peerCommit,
  peerExchangeVerdict,
  peerFrame,
  peerJwk,
  peerKeys,
  peerRecordStands,
  peerThumbprint,
  pinHolds,
  sealPeerReport,
  sealPeerShare,
  shareLink,
  signPeerRecord
} from "../src/peer-share.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { VECTOR_FILE, buildPeerShareVectors } from "../tools/vectors/peer-share.js";

// DEC-0142: a credential shared from one person's estate with another person's, with no organization on either side,
// from the shared vectors a port runs.
type Json = Record<string, any>;
const root = projectRoot();
const vectors = JSON.parse(readFileSync(path.join(root, VECTOR_FILE), "utf8")) as Json;
const validator = await createValidator();
const valid = (schema: string, value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}`, value).valid;
const key = (name: string) => (vectors.keys as Json[]).find((k) => k.name === name) as Json;
const scalar = (name: string) => Buffer.from(key(name).d, "base64url");

describe("the vector file", () => {
  it("is what its generator writes", () => {
    expect(readFileSync(path.join(root, VECTOR_FILE), "utf8")).toBe(buildPeerShareVectors());
  });
});

describe("keys and thumbprints (RFC 7638)", () => {
  it.each(vectors.keys as Json[])("$name", (k) => {
    expect(peerJwk(k.jwk)).toBe(true);
    expect(peerThumbprint(k.jwk)).toBe(k.thumbprint);
  });
  it("refuses a key with a member more, off the curve, or one key in both roles", () => {
    const jwk = key("sSig").jwk;
    expect(peerJwk({ ...jwk, kid: "x" })).toBe(false);
    expect(peerJwk({ ...jwk, y: jwk.x })).toBe(false);
    expect(peerThumbprint("x")).toBeUndefined();
    expect(peerKeys({ sig: jwk, kem: jwk })).toBe(false);
    expect(peerKeys({ sig: jwk, kem: key("sKem").jwk })).toBe(true);
  });
});

describe("the link", () => {
  it.each(vectors.links as Json[])("$name", (c) => {
    expect(parseShareLink(c.link)).toEqual(c.expect);
    if (c.expect.ok === true) expect(parseShareLink(shareLink(c.expect.link))).toEqual(c.expect);
  });
});

describe("the claim and the pin", () => {
  it.each(vectors.claims as Json[])("$name", (c) => {
    expect(claimHolds(c.link, c.frame)).toBe(c.holds);
    expect(valid("peer-share-frame.schema.json", c.frame)).toBe(true);
  });
  it("computes the claim's MAC as the vectors do, and none for a bad input", () => {
    const c = (vectors.claims as Json[])[0] as Json;
    expect(claimMac(c.link.code, c.link.shareId, c.frame.keys, c.link.fpr)).toBe(c.mac);
    expect(claimMac("short", c.link.shareId, c.frame.keys, c.link.fpr)).toBeUndefined();
    expect(claimHolds(null, c.frame)).toBe(false);
  });
  it.each(vectors.pins as Json[])("$name", (c) => expect(pinHolds(c.link, c.frame)).toBe(c.holds));
});

describe("commit, reveal and the comparison code", () => {
  it.each(vectors.codes as Json[])("$name", (c) => {
    expect(checkedPeerCode(c.senderCommit, c.sender, c.recipientCommit, c.recipient)).toEqual(c.expect);
    if (c.expect.ok === true) {
      expect(c.expect.code).toHaveLength(PEER_CODE_DIGITS);
      expect(peerCommit(c.sender)).toEqual({ ok: true, commit: c.senderCommit });
    }
  });
});

describe("one attempt per link", () => {
  it.each(vectors.exchanges as Json[])("$name", (c) => {
    expect(peerExchangeVerdict(c.shareId, c.claimDeadline, c.frames, c.at)).toEqual(c.expect);
  });
  it("reads every frame the schema reads, and refuses what it refuses", () => {
    for (const c of vectors.exchanges as Json[]) for (const frame of c.frames) expect(peerFrame(frame) !== undefined, JSON.stringify(frame)).toBe(valid("peer-share-frame.schema.json", frame));
    expect(peerExchangeVerdict("not-an-id", "2026-11-03T00:00:00Z", [], "2026-10-27T00:00:00Z")).toEqual({ state: "burnt", reason: "malformed", index: -1 });
  });
});

describe("the envelope", () => {
  it.each(vectors.envelopes as Json[])("$name", (c) => {
    expect(checkPeerShareEnvelope(c.envelope, c.context)).toEqual(c.expect);
    // The schema refuses exactly the envelopes whose own shape is wrong; a context that does not read is the node's.
    const shapeWrong = c.name === "a member more" || c.name === "a header that carries the value" || c.name === "a time with an offset, not UTC";
    expect(valid("peer-share-envelope.schema.json", c.envelope)).toBe(!shapeWrong);
    if (c.expect.ok === true) expect(openPeerShare(c.envelope, c.context, scalar("rKem"))).toEqual({ ok: true, secret: Buffer.from(vectors.secret, "utf8"), mark: c.expect.mark });
  });
  it("seals what it checks, and refuses an envelope no recipient would open", async () => {
    const { createPrivateKey } = await import("node:crypto");
    const priv = (name: string) => createPrivateKey({ key: { ...key(name).jwk, d: key(name).d }, format: "jwk" });
    const shareId = (vectors.envelopes as Json[])[0]!.envelope.header.shareId as string;
    const iat = new Date("2026-10-27T09:59:00Z");
    const env = sealPeerShare({ recipientKem: key("rKem").jwk, signer: { sig: key("sSig").jwk, privateKey: priv("sSig") }, shareId, sequence: 4, iat, exp: new Date(iat.getTime() + 86_400_000), plaintext: Buffer.from("v"), slot: "OPENROUTER_API_KEY", provider: "openrouter" });
    const ctx = { at: "2026-10-27T10:00:00Z", shareId, ownKem: key("rKem").jwk, senderSig: key("sSig").jwk };
    expect(valid("peer-share-envelope.schema.json", env)).toBe(true);
    expect(openPeerShare(env, ctx, scalar("rKem"))).toMatchObject({ ok: true, secret: Buffer.from("v") });
    expect(openPeerShare(env, ctx, scalar("xKem"))).toEqual({ ok: false, refusal: "cannot-open" });
    expect(() => sealPeerShare({ recipientKem: key("rKem").jwk, signer: { sig: key("sSig").jwk, privateKey: priv("sSig") }, shareId, sequence: 1, iat, exp: new Date(iat.getTime() + (MAX_PEER_ENVELOPE_DAYS * 86_400_000) + 1000), plaintext: Buffer.from("v"), slot: "OPENROUTER_API_KEY", provider: "openrouter" })).toThrow(/lifetime-too-long/);
    expect(() => sealPeerShare({ recipientKem: key("rKem").jwk, signer: { sig: key("sSig").jwk, privateKey: priv("sSig") }, shareId, sequence: 1, iat, exp: new Date(iat.getTime() + 1000), plaintext: Buffer.from("v"), slot: "lower", provider: "openrouter" })).toThrow(/malformed/);
    // A life inside one second is no life once the header carries whole seconds.
    const within = new Date("2026-10-27T09:59:00.100Z");
    expect(() => sealPeerShare({ recipientKem: key("rKem").jwk, signer: { sig: key("sSig").jwk, privateKey: priv("sSig") }, shareId, sequence: 1, iat: within, exp: new Date(within.getTime() + 800), plaintext: Buffer.from("v"), slot: "OPENROUTER_API_KEY", provider: "openrouter" })).toThrow(/lifetime-too-long/);
  });
});

describe("usage reports", () => {
  it.each(vectors.reports as Json[])("$name", (c) => {
    const opened = openPeerReport(c.report, c.context, scalar("sKem"));
    expect(opened).toEqual(c.expect);
    if (c.expect.ok === true) expect(checkPeerReport(c.report, c.context)).toEqual({ ok: true, sequence: c.expect.sequence });
    // The schema refuses a report whose own shape is wrong, and only that.
    expect(valid("peer-share-report.schema.json", c.report)).toBe(!["a member more", "a time with an offset, not UTC"].includes(c.name));
  });
  it("seals a report the sender opens, and refuses a body that carries more than counts", async () => {
    const { createPrivateKey } = await import("node:crypto");
    const priv = (name: string) => createPrivateKey({ key: { ...key(name).jwk, d: key(name).d }, format: "jwk" });
    const shareId = (vectors.reports as Json[])[0]!.report.header.shareId as string;
    const body = (vectors.reports as Json[])[0]!.expect.body;
    const rep = sealPeerReport({ recipientKem: key("sKem").jwk, signer: { sig: key("rSig").jwk, privateKey: priv("rSig") }, shareId, sequence: 7, iat: new Date("2026-10-27T09:59:00Z"), body });
    expect(valid("peer-share-report.schema.json", rep)).toBe(true);
    expect(validateDocument(validator, `${SCHEMA_PREFIX}schemas/peer-share-report.schema.json#/$defs/body`, body).valid).toBe(true);
    expect(openPeerReport(rep, { at: "2026-10-27T10:00:00Z", shareId, ownKem: key("sKem").jwk, recipientSig: key("rSig").jwk, lastSequence: 6 }, scalar("sKem"))).toEqual({ ok: true, sequence: 7, body });
    expect(() => sealPeerReport({ recipientKem: key("sKem").jwk, signer: { sig: key("rSig").jwk, privateKey: priv("rSig") }, shareId, sequence: 8, iat: new Date(), body: { ...body, value: "sk" } })).toThrow(/bad-body/);
  });
});

describe("taking a share back", () => {
  it.each(vectors.records as Json[])("$name", (c) => {
    expect(peerRecordStands(c.record, c.type, c.shareId, c.signerSig)).toEqual(c.expect);
    // The schema and the check agree on a record's shape: the offset time is refused by both.
    if (c.expect.ok === true || c.name.includes("offset")) expect(valid("peer-share-record.schema.json", c.record)).toBe(c.expect.ok === true);
  });
  it("signs a record that stands", async () => {
    const { createPrivateKey } = await import("node:crypto");
    const shareId = (vectors.records as Json[])[0]!.record.shareId as string;
    const record = signPeerRecord({ type: "peer-share-revocation/1", shareId, at: "2026-10-28T10:00:00Z" }, { sig: key("sSig").jwk, privateKey: createPrivateKey({ key: { ...key("sSig").jwk, d: key("sSig").d }, format: "jwk" }) });
    expect(peerRecordStands(record, "peer-share-revocation/1", shareId, key("sSig").jwk)).toEqual({ ok: true });
    expect(valid("peer-share-record.schema.json", record)).toBe(true);
  });
});
