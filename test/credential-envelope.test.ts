import { createHash, createPrivateKey, generateKeyPairSync, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import {
  CREDENTIAL_ENVELOPE_TYPE, ESTATE_AGENT_REF, ESTATE_DIGEST_SLOT, MAX_CREDENTIAL_DAYS, callRecordFindings, checkCredentialEnvelope, credentialEnvelopeShape,
  credentialRevocationStands, credentialRules, estateDigestKeyId, keyedDigest, openCredential, sealCredential, type CredentialCheckContext
} from "../src/credentials.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { VECTOR_FILE, buildCredentialVectors } from "../tools/vectors/credential-envelope.js";
import { testKey } from "../tools/vectors/relay-crypto.js";

type Json = Record<string, any>;
const root = projectRoot();
const vectors = JSON.parse(readFileSync(path.join(root, VECTOR_FILE), "utf8")) as Json;
const validator = await createValidator();
const valid = (schema: string) => (doc: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}`, doc).valid;
const envelopeValid = valid("credential-envelope.schema.json");
const ctxOf = (context: Json) => context as unknown as CredentialCheckContext;

describe("the credential vectors (DEC-0111)", () => {
  it("are the generator's output", () => {
    expect(readFileSync(path.join(root, VECTOR_FILE), "utf8")).toBe(buildCredentialVectors());
  });

  it.each(vectors.check as Json[])("check: $name", (c) => {
    expect(checkCredentialEnvelope(c.envelope, ctxOf(c.context))).toEqual(c.expect);
    // FAC-SEM-139 holds the target's answer to the reference.
    expect(evaluateSemanticRules("credential-envelope-check", { envelope: c.envelope, context: c.context, answer: c.expect })).toEqual([]);
    const wrong = c.expect.ok ? { ok: false, refusal: "expired" } : { ok: true };
    expect(evaluateSemanticRules("credential-envelope-check", { envelope: c.envelope, context: c.context, answer: wrong }).map((f) => f.code)).toEqual(["FAC-SEM-139"]);
  });

  it("the shape check agrees with the schema on every vector envelope", () => {
    for (const c of vectors.check as Json[]) expect(credentialEnvelopeShape(c.envelope), c.name).toBe(envelopeValid(c.envelope));
  });

  it.each(vectors.open as Json[])("open: $name", (c) => {
    const got = openCredential(c.envelope, ctxOf(c.context), Buffer.from(c.privateKey, "base64"));
    if (c.expect.ok) {
      expect(got.ok).toBe(true);
      const secret = got.ok ? got.secret : Buffer.alloc(0);
      expect(c.envelope.header.slot === ESTATE_DIGEST_SLOT ? secret.toString("base64") : secret.toString("utf8")).toBe(c.expect.secret);
    } else expect(got).toEqual(c.expect);
  });

  it.each(vectors.digest as Json[])("digest: $name", (c) => {
    expect(keyedDigest(Buffer.from(c.key, "hex"), c.value) ?? null).toBe(c.expect);
  });

  it.each(vectors.revocation as Json[])("revocation: $name", (c) => {
    expect(credentialRevocationStands(c.input)).toEqual(c.expect);
    expect(valid("credential-revocation.schema.json")(c.input.revocation)).toBe(c.expect.reason !== "malformed");
  });
});

describe("sealCredential and openCredential round trip (DEC-0111)", () => {
  const kem = testKey("credentials round trip kem");
  const policy = createPrivateKey({ key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.alloc(32, 7)]), format: "der", type: "pkcs8" });
  const policyPublic = Buffer.from((policy.export({ format: "jwk" }) as { x: string }).x, "base64url").toString("base64");
  const kemPrivate = Buffer.from(kem.d.toString(16).padStart(64, "0"), "hex");
  const iat = new Date("2026-10-23T10:00:00Z"), exp = new Date("2026-10-23T22:00:00Z");
  const base = { recipientKid: "m-a#kem", recipientKey: Buffer.from(kem.octets, "base64"), agentRef: "urn:fabric:agent:passioncode:dns-agent", slot: "CLOUDFLARE_API_TOKEN", provider: "cloudflare", sequence: 3, iat, exp, secret: Buffer.from("value") };

  it("an organization's credential: sealed by the policy key, opened by the requesting machine", () => {
    const env = sealCredential({ ...base, signer: { keyId: "k1", privateKey: policy }, context: "org:org-1", requestId: "5b1f0c4e-8a2d-4f3b-9c6e-1d7a2b3c4d5e", credentialExpiresAt: new Date("2026-10-30T10:00:00Z") });
    expect(env.header.type).toBe(CREDENTIAL_ENVELOPE_TYPE);
    expect(envelopeValid(env)).toBe(true);
    const ctx: CredentialCheckContext = { ownKemKid: "m-a#kem", at: "2026-10-23T10:00:30Z", org: { id: "org-1", keys: [{ keyId: "k1", publicKey: policyPublic }], requested: [{ requestId: "5b1f0c4e-8a2d-4f3b-9c6e-1d7a2b3c4d5e", agentRef: base.agentRef, slot: base.slot }] } };
    const opened = openCredential(env, ctx, kemPrivate);
    expect(opened.ok && opened.secret.toString()).toBe("value");
    expect(opened.ok && opened.mark).toMatchObject({ context: "org:org-1", sequence: 3 });
  });

  it("refuses to seal what no target opens, spending no sequence", () => {
    const org = { signer: { keyId: "k1", privateKey: policy }, context: "org:org-1", requestId: "5b1f0c4e-8a2d-4f3b-9c6e-1d7a2b3c4d5e", credentialExpiresAt: new Date("2026-10-30T10:00:00Z") };
    expect(() => sealCredential({ ...base, ...org, exp: new Date("2026-10-25T10:00:00Z") })).toThrow(/lifetime-too-long/);
    expect(() => sealCredential({ ...base, ...org, context: "personal", requestId: undefined, credentialExpiresAt: undefined } as never)).toThrow(/wrong-context/);
    expect(() => sealCredential({ ...base, ...org, requestId: undefined } as never)).toThrow(/malformed/);
    expect(() => sealCredential({ ...base, ...org, recipientKey: Buffer.alloc(65, 4) })).toThrow(/bad-key/);
    const personal = { signer: { kid: "m-b#sig", privateKey: generateKeyPairSync("ec", { namedCurve: "P-256" }).privateKey }, context: "org:org-1" };
    expect(() => sealCredential({ ...base, ...personal, requestId: "5b1f0c4e-8a2d-4f3b-9c6e-1d7a2b3c4d5e", credentialExpiresAt: new Date("2026-10-30T10:00:00Z") })).toThrow(/wrong-context/);
  });

  it("answers every input with a verdict, never throwing on a JSON value", () => {
    for (const value of [null, 7, "x", [], {}, { header: {}, ct: "", sig: "" }, { header: { toString: 1 }, ct: 1, sig: 1 }]) {
      for (const ctx of [null, {}, { ownKemKid: 7, at: 7 }, { ownKemKid: "m-a#kem", at: "2026-10-23T10:00:00Z", org: { id: { toString: 1 }, keys: "x", requested: 7 } }]) {
        expect(() => checkCredentialEnvelope(value, ctx as never)).not.toThrow();
        expect(checkCredentialEnvelope(value, ctx as never)).toEqual({ ok: false, refusal: "malformed" });
      }
    }
    for (const input of [null, 7, {}, { revocation: { type: "credential-revocation/1", signature: { keyId: { toString: 1 } } } }]) expect(() => credentialRevocationStands(input)).not.toThrow();
  });
});

describe("keyedDigest (DEC-0111)", () => {
  it("names its key without revealing it, and refuses a key that is not 32 bytes", () => {
    const key = randomBytes(32);
    expect(estateDigestKeyId(key)).toMatch(/^ekd-[0-9a-f]{16}$/);
    expect(keyedDigest(key, "a")).toBe(keyedDigest(key, Buffer.from("a")));
    expect(keyedDigest(key, "a")).not.toBe(keyedDigest(randomBytes(32), "a"));
    expect(keyedDigest(randomBytes(31), "a")).toBeUndefined();
    expect(keyedDigest("key" as never, "a")).toBeUndefined();
    expect(ESTATE_AGENT_REF).toMatch(/^urn:fabric:agent:fabric:estate$/);
  });
});

describe("FAC-SEM-138: a credential request and its decision", () => {
  const request = {
    type: "credential-request/1", requestId: "5b1f0c4e-8a2d-4f3b-9c6e-1d7a2b3c4d5e", agentRef: "urn:fabric:agent:passioncode:dns-agent", context: "org:org-7f3a",
    provider: "cloudflare", preset: "zone-dns-edit", scope: { zone: "example.com" }, expiresAt: "2026-10-30T09:00:00Z", reason: "rotate the DNS records of example.com", requestedAt: "2026-10-23T09:00:00Z"
  };
  const codes = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((f) => f.code);

  it("holds a request to its organization, its window and its words", () => {
    expect(valid("credential-request.schema.json")(request)).toBe(true);
    expect(codes("credential-request", { request, org: "org-7f3a" })).toEqual([]);
    expect(codes("credential-request", { request, org: "org-9c1d" })).toEqual(["FAC-SEM-138"]);
    expect(codes("credential-request-document", { ...request, expiresAt: "2026-11-23T09:00:01Z" })).toEqual(["FAC-SEM-138"]);
    expect(codes("credential-request-document", { ...request, expiresAt: request.requestedAt })).toEqual(["FAC-SEM-138"]);
    expect(codes("credential-request-document", { ...request, expiresAt: `2026-10-23T09:00:00Z`.replace("23T09", "23T08") })).toEqual(["FAC-SEM-138"]);
    expect(codes("credential-request-document", { ...request, reason: "copy it from /Users/example/keys" })).toEqual(["FAC-SEM-138"]);
    expect(codes("credential-request-document", { ...request, reason: "use ghp_abcdefghijklmnopqrstuvwxyz012345 please" })).toEqual(["FAC-SEM-138"]);
    expect(codes("credential-request-document", { ...request, scope: { zone: "/home/example/zone" } })).toEqual(["FAC-SEM-138"]);
    expect(MAX_CREDENTIAL_DAYS).toBe(30);
  });

  it("holds a decision to the request it answers", () => {
    const issued = { type: "credential-decision/1", requestId: request.requestId, outcome: "issued", by: "policy", decidedAt: "2026-10-23T09:01:00Z", credential: { slot: "CLOUDFLARE_API_TOKEN", provider: "cloudflare", preset: "zone-dns-edit", expiresAt: "2026-10-30T09:00:00Z" } };
    const refused = { type: "credential-decision/1", requestId: request.requestId, outcome: "refused", by: "administrator", reason: "scope-too-wide", decidedAt: "2026-10-23T09:01:00Z" };
    const pending = { type: "credential-decision/1", requestId: request.requestId, outcome: "pending", decidedAt: "2026-10-23T09:01:00Z" };
    for (const decision of [issued, refused, pending]) {
      expect(valid("credential-decision.schema.json")(decision)).toBe(true);
      expect(codes("credential-decision", { request, decision })).toEqual([]);
    }
    expect(valid("credential-decision.schema.json")({ ...pending, by: "policy" })).toBe(false);
    expect(valid("credential-decision.schema.json")({ ...issued, by: undefined })).toBe(false);
    expect(codes("credential-decision", { request, decision: { ...issued, requestId: "00000000-0000-4000-8000-000000000000" } })).toEqual(["FAC-SEM-138"]);
    expect(codes("credential-decision", { request, decision: { ...issued, credential: { ...issued.credential, expiresAt: "2026-10-31T00:00:00Z" } } })).toEqual(["FAC-SEM-138"]);
    expect(codes("credential-decision", { request, decision: { ...issued, credential: { ...issued.credential, provider: "openrouter" } } })).toEqual(["FAC-SEM-138"]);
    expect(codes("credential-decision", { request, decision: { ...issued, reason: "withdrawn" } })).toEqual(["FAC-SEM-138"]);
    expect(codes("credential-decision", { request, decision: { ...refused, reason: undefined } })).toEqual(["FAC-SEM-138"]);
    expect(codes("credential-decision", { request, decision: { ...pending, reason: "withdrawn" } })).toEqual(["FAC-SEM-138"]);
  });

  it("answers an unknown kind with nothing, and never throws", () => {
    expect(credentialRules("not-a-kind", {})).toBeUndefined();
    for (const value of [{}, { request: 7, org: 7 }, { request: { scope: 7, reason: 7 } }, { request: {}, decision: { credential: 7, outcome: "issued" } }]) {
      for (const kind of ["credential-request", "credential-decision", "credential-request-document", "credential-envelope-check", "call-record"]) expect(() => evaluateSemanticRules(kind, value)).not.toThrow();
    }
  });
});

describe("FAC-SEM-140: a call record", () => {
  const record = {
    type: "call-record/1", callId: "1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f", traceId: "4bf92f3577b34da6a3ce929d0e0e4736", caller: "urn:fabric:agent:passioncode:observatory",
    callee: "urn:fabric:agent:passioncode:dns-agent", context: "org:org-7f3a", capability: "dns.records.update", transport: "relay", startedAt: "2026-10-23T09:00:00Z",
    endedAt: "2026-10-23T09:00:02Z", outcome: "completed", cost: { usd: "0.0021", route: "key" }, recordedBy: "callee"
  };

  it("names agents, times and an outcome, and nothing of a person", () => {
    expect(valid("call-record.schema.json")(record)).toBe(true);
    expect(callRecordFindings(record)).toEqual([]);
    expect(valid("call-record.schema.json")({ ...record, cost: { usd: null } })).toBe(true);
    expect(valid("call-record.schema.json")({ ...record, person: "alice" })).toBe(false);
    expect(valid("call-record.schema.json")({ ...record, traceId: "0".repeat(32) })).toBe(false);
  });

  it("refuses an end before the start, a code on a completed call, none on a failure, one agent on both ends, a path", () => {
    const codes = (value: Json) => callRecordFindings(value).map((f) => f.instancePath);
    expect(codes({ ...record, endedAt: "2026-10-23T08:59:59Z" })).toEqual(["/endedAt"]);
    expect(codes({ ...record, code: "x-y" })).toEqual(["/code"]);
    expect(codes({ ...record, outcome: "failed" })).toEqual(["/code"]);
    expect(codes({ ...record, outcome: "refused", code: "profile-forbids" })).toEqual([]);
    expect(codes({ ...record, traceId: "0".repeat(32) })).toEqual(["/traceId"]);
    expect(codes({ ...record, callee: record.caller })).toEqual(["/callee"]);
    expect(codes({ ...record, outcome: "failed", code: "home-users-alice" })).toEqual([]);
    expect(codes({ ...record, capability: "read /Users/example/x" })).toEqual(["/capability"]);
    expect(callRecordFindings(7)).toEqual([]);
  });
});

describe("the reference seals what the vectors hold, byte for byte (DEC-0111)", () => {
  const LABEL = "fabric-agent-contract/vectors/credentials/";
  const sha = (text: string) => createHash("sha256").update(text).digest();
  const policy = createPrivateKey({ key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), sha(`${LABEL}org policy key 2026-10`)]), format: "der", type: "pkcs8" });

  it("an organization's envelope, from the vector's header and ephemeral scalar", () => {
    const want = (vectors.check as Json[])[0]!.envelope;
    const h = want.header;
    const got = sealCredential({
      recipientKid: h.recipient, recipientKey: Buffer.from(testKey("credentials m-a kem").octets, "base64"), signer: { keyId: h.signer, privateKey: policy },
      context: h.context, agentRef: h.agentRef, slot: h.slot, provider: h.provider, requestId: h.requestId, credentialExpiresAt: new Date(h.credentialExpiresAt),
      sequence: h.sequence, iat: new Date(h.iat), exp: new Date(h.exp), secret: Buffer.from("cf-token-for-zone-example-com"), ephemeralPrivateKey: sha(`${LABEL}ephemeral/org`)
    });
    expect(got).toEqual(want);
  });

  it("a personal envelope seals under ES256 and opens on the other machine", () => {
    const sender = testKey("credentials m-a sig"), recipient = testKey("credentials m-b kem");
    const senderKey = createPrivateKey({ key: { ...sender.jwk, d: Buffer.from(sender.d.toString(16).padStart(64, "0"), "hex").toString("base64url") }, format: "jwk" });
    const env = sealCredential({
      recipientKid: "m-b#kem", recipientKey: Buffer.from(recipient.octets, "base64"), signer: { kid: "m-a#sig", privateKey: senderKey }, context: "personal",
      agentRef: ESTATE_AGENT_REF, slot: ESTATE_DIGEST_SLOT, provider: "fabric", sequence: 2, iat: new Date("2026-10-23T09:59:00Z"), exp: new Date("2026-10-23T21:59:00Z"), secret: Buffer.alloc(32, 9)
    });
    const ctx = { ownKemKid: "m-b#kem", at: "2026-10-23T10:00:00Z", personal: { applied: vectors.record, self: "m-b" } };
    const opened = openCredential(env, ctxOf(ctx), Buffer.from(recipient.d.toString(16).padStart(64, "0"), "hex"));
    expect(opened.ok && opened.secret.equals(Buffer.alloc(32, 9))).toBe(true);
  });
});

describe("credentialRevocationStands: inputs it refuses without throwing", () => {
  const good = (vectors.revocation as Json[])[0]!.input;
  it("refuses a revocation with no canonical form, an unreadable time and no device", () => {
    expect(credentialRevocationStands({ ...good, revocation: { ...good.revocation, reason: "\ud800" } })).toEqual({ ok: false, reason: "bad-signature" });
    expect(credentialRevocationStands({ ...good, at: "soon" })).toEqual({ ok: false, reason: "bad-signature" });
    expect(credentialRevocationStands({ ...good, device: 7 })).toEqual({ ok: false, reason: "wrong-device" });
    expect(credentialRevocationStands({ ...good, keys: [{ ...good.keys[0], notAfter: "never" }] })).toEqual({ ok: false, reason: "bad-signature" });
  });
});

describe("the unit reading of PR #156: boundaries the vectors did not reach", () => {
  const kem = testKey("credentials boundary kem");
  const policy = createPrivateKey({ key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.alloc(32, 3)]), format: "der", type: "pkcs8" });
  const machine = generateKeyPairSync("ec", { namedCurve: "P-256" }).privateKey;
  const iat = new Date("2026-10-23T10:00:00Z"), exp = new Date("2026-10-23T22:00:00Z");
  const base = { recipientKid: "m-a#kem", recipientKey: Buffer.from(kem.octets, "base64"), agentRef: "urn:fabric:agent:passioncode:dns-agent", slot: "CLOUDFLARE_API_TOKEN", provider: "cloudflare", sequence: 1, iat, exp, secret: Buffer.from("v") };
  const org = { signer: { keyId: "k1", privateKey: policy }, context: "org:org-1", requestId: "5b1f0c4e-8a2d-4f3b-9c6e-1d7a2b3c4d5e" };

  it("holds the signer to the schema at both ends: a 128-character machine id seals, a bare #sig does not read", () => {
    const longId = `m${"x".repeat(127)}`;
    const env = sealCredential({ ...base, signer: { kid: `${longId}#sig`, privateKey: machine }, context: "personal" });
    expect(credentialEnvelopeShape(env)).toBe(true);
    expect(envelopeValid(env)).toBe(true);
    const bare = { ...env, header: { ...env.header, signer: "#sig" } };
    expect(credentialEnvelopeShape(bare)).toBe(envelopeValid(bare));
    expect(credentialEnvelopeShape(bare)).toBe(false);
  });

  it("refuses to seal a credential no target accepts", () => {
    expect(() => sealCredential({ ...base, ...org, credentialExpiresAt: new Date("2026-11-23T10:00:01Z") })).toThrow(/credential-expired/);
    expect(() => sealCredential({ ...base, ...org, credentialExpiresAt: new Date("2026-10-23T09:00:00Z") })).toThrow(/credential-expired/);
    expect(() => sealCredential({ ...base, signer: { kid: "m-b", privateKey: machine }, context: "personal" })).toThrow(/bad-key/);
    expect(() => sealCredential({ ...base, ...org, signer: { keyId: "m-b#sig", privateKey: policy }, credentialExpiresAt: new Date("2026-10-30T10:00:00Z") })).toThrow(/bad-key/);
  });

  it("reads a document's times with any offset, as the schemas admit, and an org id only as written", () => {
    const request = {
      type: "credential-request/1", requestId: "5b1f0c4e-8a2d-4f3b-9c6e-1d7a2b3c4d5e", agentRef: "urn:fabric:agent:passioncode:dns-agent", context: "org:org-1",
      provider: "cloudflare", preset: "zone-dns-edit", expiresAt: "2026-10-30T11:00:00+02:00", reason: "update records", requestedAt: "2026-10-23T11:00:00+02:00"
    };
    expect(evaluateSemanticRules("credential-request", { request, org: "org-1" })).toEqual([]);
    expect(callRecordFindings({ type: "call-record/1", callId: "1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f", traceId: "4bf92f3577b34da6a3ce929d0e0e4736", caller: "urn:fabric:agent:a:b", callee: "urn:fabric:agent:a:c", startedAt: "2026-10-23T11:00:00+02:00", endedAt: "2026-10-23T09:00:01Z", outcome: "completed" })).toEqual([]);
    const env = (vectors.check as Json[])[0]!;
    expect(checkCredentialEnvelope(env.envelope, ctxOf({ ...env.context, org: { ...env.context.org, id: ["org-7f3a"] } }))).toEqual({ ok: false, refusal: "wrong-context" });
  });
});
