/**
 * The generator of the credential vectors (DEC-0111): `fixtures/vectors/credential-envelope.json`, shared by every node that
 * opens a credential envelope, every issuer that seals one, and every machine that computes a keyed digest.
 *
 *   tsx tools/vectors/credential-envelope.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/credential-envelope.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/credential-envelope.test.ts` runs the check.
 * Each expected answer is written below by hand from DEC-0111's text. The envelopes are built here, not by
 * `src/credentials.ts`: HPKE base mode (`hpkeSealBase`, checked against RFC 9180 by `secret-envelope.json`) with an
 * ephemeral scalar derived from a published label, an Ed25519 organization key and RFC 6979 ES256 machine keys, so a
 * port reproduces each byte and the gate checks that the reference returns what this file expects.
 */
import { createHash, createHmac, createPrivateKey, sign } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { rfc8785, settingsCanonicalJson } from "../../src/canonical.js";
import { projectRoot } from "../../src/contract.js";
import { hpkeSealBase } from "../../src/secret-envelope.js";
import { signDeterministic, testKey, type TestKey } from "./relay-crypto.js";

type Json = Record<string, unknown>;
export const VECTOR_FILE = "fixtures/vectors/credential-envelope.json";

const TYPE = "fabric-credential-envelope/1";
const LABEL = "fabric-agent-contract/vectors/credentials/";
const sha256 = (data: string | Buffer) => createHash("sha256").update(data).digest();
const scalar = (key: TestKey) => Buffer.from(key.d.toString(16).padStart(64, "0"), "hex").toString("base64");
const ed25519 = (label: string) => createPrivateKey({ key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), sha256(`${LABEL}${label}`)]), format: "der", type: "pkcs8" });
const edPublic = (key: ReturnType<typeof createPrivateKey>) => Buffer.from((key.export({ format: "jwk" }) as { x: string }).x, "base64url").toString("base64");

const ORG = "org-7f3a";
const ORG_CONTEXT = `org:${ORG}`;
const POLICY = ed25519("org policy key 2026-10");
const OTHER_POLICY = ed25519("another org's policy key");
const KEYS: Json[] = [{ keyId: "org-7f3a.policy-2026-10", publicKey: edPublic(POLICY), notBefore: "2026-10-01T00:00:00Z", notAfter: "2026-12-31T00:00:00Z" }];
const K = {
  aSig: testKey("credentials m-a sig"), aKem: testKey("credentials m-a kem"),
  bSig: testKey("credentials m-b sig"), bKem: testKey("credentials m-b kem"),
  vSig: testKey("credentials m-v sig"), vKem: testKey("credentials m-v kem")
};
const AGENT = "urn:fabric:agent:passioncode:dns-agent";
const ESTATE_AGENT = "urn:fabric:agent:fabric:estate";
const REQUEST = "5b1f0c4e-8a2d-4f3b-9c6e-1d7a2b3c4d5e";
const AT = "2026-10-23T10:00:00Z";
const IAT = "2026-10-23T09:59:00Z";
const EXP = "2026-10-23T21:59:00Z";
const UNTIL = "2026-10-30T09:59:00Z";
const SECRET = "cf-token-for-zone-example-com";

const record = (): Json => ({
  schema: "estate-record/1",
  estate: "urn:fabric:estate:example",
  revision: 3,
  issuedAt: "2026-10-22T09:00:00Z",
  validUntil: "2026-11-21T09:00:00Z",
  machines: [
    { id: "m-a", hubKey: { kid: "m-a#hub", alg: "EdDSA", publicKey: edPublic(ed25519("credentials m-a hub")) }, deviceKeys: [{ kid: "m-a#sig", use: "sig", alg: "es256", publicKey: K.aSig.octets }, { kid: "m-a#kem", use: "kem", alg: "ecdh-p256", publicKey: K.aKem.octets }] },
    { id: "m-b", profile: "member", deviceKeys: [{ kid: "m-b#sig", use: "sig", alg: "es256", publicKey: K.bSig.octets }, { kid: "m-b#kem", use: "kem", alg: "ecdh-p256", publicKey: K.bKem.octets }] },
    { id: "m-v", profile: "view", deviceKeys: [{ kid: "m-v#sig", use: "sig", alg: "es256", publicKey: K.vSig.octets }, { kid: "m-v#kem", use: "kem", alg: "ecdh-p256", publicKey: K.vKem.octets }] }
  ],
  revocations: []
});

type Signer = { org: ReturnType<typeof createPrivateKey>; keyId: string } | { machine: TestKey; kid: string };

/** An envelope sealed to `recipient` under `header`, signed by `signer` over the RFC 8785 bytes of {header, ct}. */
function envelope(over: Json, signer: Signer, recipient: TestKey, label: string, secret: string | Buffer = SECRET): Json {
  const ephemeral = sha256(`${LABEL}ephemeral/${label}`);
  // The encapsulated key belongs to the header the AEAD authenticates, so it is derived first from the ephemeral scalar.
  const enc = hpkeSealBase(Buffer.from(recipient.octets, "base64"), Buffer.from(TYPE, "ascii"), Buffer.alloc(0), Buffer.alloc(0), ephemeral).enc;
  const header: Json = { type: TYPE, suite: [16, 1, 1], sequence: 1, iat: IAT, exp: EXP, provider: "cloudflare", slot: "CLOUDFLARE_API_TOKEN", agentRef: AGENT, ...over, enc: enc.toString("base64url") };
  for (const key of Object.keys(header)) if (header[key] === undefined) delete header[key];
  const { ct } = hpkeSealBase(Buffer.from(recipient.octets, "base64"), Buffer.from(TYPE, "ascii"), Buffer.from(rfc8785(header), "utf8"), (Buffer.isBuffer(secret) ? secret : Buffer.from(secret, "utf8")), ephemeral);
  const unsigned = { header, ct: ct.toString("base64url") };
  const bytes = rfc8785(unsigned);
  const sig = "org" in signer ? sign(null, Buffer.from(bytes, "utf8"), signer.org).toString("base64url") : signDeterministic(signer.machine.d, bytes);
  return { ...unsigned, sig };
}

const orgSigner: Signer = { org: POLICY, keyId: "org-7f3a.policy-2026-10" };
const orgHeader = (over: Json = {}): Json => ({ alg: "EdDSA", recipient: "m-a#kem", signer: "org-7f3a.policy-2026-10", context: ORG_CONTEXT, requestId: REQUEST, credentialExpiresAt: UNTIL, ...over });
const personalHeader = (over: Json = {}): Json => ({ alg: "ES256", recipient: "m-b#kem", signer: "m-a#sig", context: "personal", agentRef: ESTATE_AGENT, slot: "ESTATE_DIGEST_KEY", provider: "fabric", ...over });
const orgCtx = (over: Json = {}): Json => ({ ownKemKid: "m-a#kem", at: AT, org: { id: ORG, keys: KEYS, requested: [{ requestId: REQUEST, agentRef: AGENT, slot: "CLOUDFLARE_API_TOKEN" }] }, ...over });
const personalCtx = (over: Json = {}, self = "m-b"): Json => ({ ownKemKid: `${self}#kem`, at: AT, personal: { applied: record(), self }, ...over });
const digestOf = (env: Json) => `sha256:${sha256(rfc8785(env)).toString("hex")}`;

function checkCases(): Json[] {
  const ok = (env: Json): Json => ({ ok: true, mark: { context: (env.header as Json).context, agentRef: (env.header as Json).agentRef, slot: (env.header as Json).slot, sequence: (env.header as Json).sequence, digest: digestOf(env) } });
  const no = (refusal: string): Json => ({ ok: false, refusal });
  const org = envelope(orgHeader(), orgSigner, K.aKem, "org");
  const personal = envelope(personalHeader(), { machine: K.aSig, kid: "m-a#sig" }, K.bKem, "personal");
  const tampered = { ...org, ct: `${String(org.ct).slice(0, 8)}${String(org.ct)[8] === "A" ? "B" : "A"}${String(org.ct).slice(9)}` };
  const cases: Array<[string, unknown, Json, Json]> = [
    ["an organization's credential, requested, in window", org, orgCtx(), ok(org)],
    ["a credential between one person's machines: the estate's digest key", personal, personalCtx(), ok(personal)],
    ["the same envelope again (a repeat delivery) passes at its mark", org, orgCtx({ marks: [{ context: ORG_CONTEXT, agentRef: AGENT, slot: "CLOUDFLARE_API_TOKEN", sequence: 1, digest: digestOf(org) }] }), ok(org)],
    ["a member more", { ...org, note: "x" }, orgCtx(), no("malformed")],
    ["an organization's envelope without its request", envelope(orgHeader({ requestId: undefined }), orgSigner, K.aKem, "no-request"), orgCtx(), no("malformed")],
    ["a personal envelope that names a request", envelope(personalHeader({ requestId: REQUEST }), { machine: K.aSig, kid: "m-a#sig" }, K.bKem, "personal-request"), personalCtx(), no("malformed")],
    ["a clock that does not read", org, orgCtx({ at: "2026-10-23 10:00:00" }), no("malformed")],
    ["an organization's envelope signed ES256", envelope(orgHeader({ alg: "ES256" }), orgSigner, K.aKem, "org-es256"), orgCtx(), no("unsupported-alg")],
    ["a personal envelope signed EdDSA", envelope(personalHeader({ alg: "EdDSA" }), { machine: K.aSig, kid: "m-a#sig" }, K.bKem, "personal-eddsa"), personalCtx(), no("unsupported-alg")],
    ["another machine's kem", org, orgCtx({ ownKemKid: "m-b#kem" }), no("wrong-recipient")],
    ["another organization's context", envelope(orgHeader({ context: "org:org-9c1d" }), orgSigner, K.aKem, "other-org"), orgCtx(), no("wrong-context")],
    ["an organization's envelope on a machine with no enrollment there", org, orgCtx({ org: undefined }), no("wrong-context")],
    ["a personal envelope on a machine that holds no estate record", personal, { ownKemKid: "m-b#kem", at: AT }, no("wrong-context")],
    ["a key the policy key set does not list", envelope(orgHeader({ signer: "org-7f3a.policy-old" }), { org: POLICY, keyId: "org-7f3a.policy-old" }, K.aKem, "unlisted"), orgCtx(), no("bad-key")],
    ["a policy key not yet valid on the target's clock", org, orgCtx({ org: { id: ORG, keys: [{ ...KEYS[0], notBefore: "2026-10-24T00:00:00Z" }], requested: (orgCtx().org as Json).requested } }), no("bad-key")],
    ["a policy key that ended before the target's clock, though valid at the iat the signer chose", org, orgCtx({ org: { id: ORG, keys: [{ ...KEYS[0], notAfter: "2026-10-23T09:59:30Z" }], requested: (orgCtx().org as Json).requested } }), no("bad-key")],
    ["the envelope delivered with its issued decision: the slot comes from the decision", org, orgCtx({ org: { id: ORG, keys: KEYS, requested: [{ requestId: REQUEST, agentRef: AGENT, slot: "CLOUDFLARE_API_TOKEN" }] } }), ok(org)],
    ["a signer that is no machine of the record", envelope(personalHeader({ signer: "m-z#sig" }), { machine: K.aSig, kid: "m-z#sig" }, K.bKem, "stranger"), personalCtx(), no("bad-key")],
    ["an enc that is no point of the curve", { ...org, header: { ...(org.header as Json), enc: Buffer.alloc(65, 4).toString("base64url") } }, orgCtx(), no("bad-key")],
    ["a policy key whose window does not read", org, orgCtx({ org: { id: ORG, keys: [{ ...KEYS[0], notBefore: "the first of October" }], requested: (orgCtx().org as Json).requested } }), no("bad-key")],
    ["a personal context with no estate record applied", personal, personalCtx({ personal: { self: "m-b" } }), no("wrong-context")],
    ["marks that do not read open nothing", org, orgCtx({ marks: "x" }), no("malformed")],
    ["a personal envelope whose signer is no #sig kid", envelope(personalHeader({ signer: "m-a.key" }), { machine: K.aSig, kid: "m-a.key" }, K.bKem, "not-sig"), personalCtx(), no("bad-key")],
    ["a signer the delta revoked", personal, personalCtx({ personal: { applied: record(), self: "m-b", revocations: [{ kind: "machine", ref: "m-a", revokedAt: "2026-10-23T08:00:00Z" }] } }), no("bad-key")],
    ["signed by another organization's key under this one's keyId", envelope(orgHeader(), { org: OTHER_POLICY, keyId: "org-7f3a.policy-2026-10" }, K.aKem, "forged"), orgCtx(), no("bad-signature")],
    ["one character of the ciphertext changed", tampered, orgCtx(), no("bad-signature")],
    ["signed by another machine's key under m-a's kid", envelope(personalHeader(), { machine: K.bSig, kid: "m-a#sig" }, K.bKem, "forged-personal"), personalCtx(), no("bad-signature")],
    ["a view machine sends", envelope(personalHeader({ signer: "m-v#sig" }), { machine: K.vSig, kid: "m-v#sig" }, K.bKem, "from-view"), personalCtx(), no("sender-not-allowed")],
    ["a view machine receives", envelope(personalHeader({ recipient: "m-v#kem" }), { machine: K.aSig, kid: "m-a#sig" }, K.vKem, "to-view"), personalCtx({}, "m-v"), no("sender-not-allowed")],
    ["the estate's digest key from a machine that holds no hub key", envelope(personalHeader({ signer: "m-b#sig", recipient: "m-a#kem" }), { machine: K.bSig, kid: "m-b#sig" }, K.aKem, "digest-from-member"), personalCtx({}, "m-a"), no("sender-not-allowed")],
    ["a slot a placed package declares is not filled by this envelope", envelope(personalHeader({ agentRef: AGENT, slot: "PLACED_TOKEN" }), { machine: K.aSig, kid: "m-a#sig" }, K.bKem, "placed"), personalCtx({ personal: { applied: { ...record(), machines: (record().machines as Json[]).map((m) => (m.id === "m-b" ? { ...m, secrets: [{ agentRef: AGENT, slot: "PLACED_TOKEN", from: "m-a" }] } : m)) }, self: "m-b" } }), no("sender-not-allowed")],
    ["a machine sends to itself", envelope(personalHeader({ recipient: "m-a#kem" }), { machine: K.aSig, kid: "m-a#sig" }, K.aKem, "to-self"), personalCtx({}, "m-a"), no("sender-not-allowed")],
    ["a credential nobody asked for", org, orgCtx({ org: { id: ORG, keys: KEYS, requested: [] } }), no("not-requested")],
    ["a request of another slot", org, orgCtx({ org: { id: ORG, keys: KEYS, requested: [{ requestId: REQUEST, agentRef: AGENT, slot: "OTHER_TOKEN" }] } }), no("not-requested")],
    ["a sequence below the mark", org, orgCtx({ marks: [{ context: ORG_CONTEXT, agentRef: AGENT, slot: "CLOUDFLARE_API_TOKEN", sequence: 2, digest: "sha256:00" }] }), no("replayed")],
    ["another envelope at the mark's sequence", org, orgCtx({ marks: [{ context: ORG_CONTEXT, agentRef: AGENT, slot: "CLOUDFLARE_API_TOKEN", sequence: 1, digest: "sha256:00" }] }), no("sequence-reused")],
    ["a mark of another context does not apply", org, orgCtx({ marks: [{ context: "personal", agentRef: AGENT, slot: "CLOUDFLARE_API_TOKEN", sequence: 9, digest: "sha256:00" }] }), ok(org)],
    ["issued more than 60 s ahead of the clock", org, orgCtx({ at: "2026-10-23T09:57:59Z" }), no("not-yet-valid")],
    ["an envelope that lives more than 24 hours", envelope(orgHeader({ exp: "2026-10-24T10:00:00Z" }), orgSigner, K.aKem, "long"), orgCtx(), no("lifetime-too-long")],
    ["an envelope past its exp", org, orgCtx({ at: "2026-10-23T21:59:00Z" }), no("expired")],
    ["a credential that ends before it arrives", envelope(orgHeader({ credentialExpiresAt: "2026-10-23T09:59:30Z" }), orgSigner, K.aKem, "ended"), orgCtx(), no("credential-expired")],
    ["a credential that outlives the end its decision issued", envelope(orgHeader({ credentialExpiresAt: "2026-10-29T09:59:00Z" }), orgSigner, K.aKem, "past-decision"), orgCtx({ org: { id: ORG, keys: KEYS, requested: [{ requestId: REQUEST, agentRef: AGENT, slot: "CLOUDFLARE_API_TOKEN", expiresAt: "2026-10-28T09:59:00Z" }] } }), no("credential-expired")],
    ["an end its decision named that does not read", org, orgCtx({ org: { id: ORG, keys: KEYS, requested: [{ requestId: REQUEST, agentRef: AGENT, slot: "CLOUDFLARE_API_TOKEN", expiresAt: "next week" }] } }), no("credential-expired")],
    ["a credential issued for more than 30 days", envelope(orgHeader({ credentialExpiresAt: "2026-11-23T09:59:00Z" }), orgSigner, K.aKem, "too-long"), orgCtx(), no("credential-expired")]
  ];
  return cases.map(([name, env, context, expect]) => ({ name, envelope: env, context, expect }));
}

function openCases(): Json[] {
  const org = envelope(orgHeader(), orgSigner, K.aKem, "org");
  const personal = envelope(personalHeader(), { machine: K.aSig, kid: "m-a#sig" }, K.bKem, "personal", sha256(`${LABEL}estate digest key`));
  return [
    { name: "an organization's credential opens to its value", envelope: org, context: orgCtx(), privateKey: scalar(K.aKem), expect: { ok: true, secret: SECRET } },
    { name: "the estate's digest key opens on the other machine", envelope: personal, context: personalCtx(), privateKey: scalar(K.bKem), expect: { ok: true, secret: Buffer.from(sha256(`${LABEL}estate digest key`)).toString("base64") } },
    { name: "a refused envelope is not opened", envelope: org, context: orgCtx({ ownKemKid: "m-b#kem" }), privateKey: scalar(K.aKem), expect: { ok: false, refusal: "wrong-recipient" } },
    { name: "the right kid, another key: it does not open", envelope: org, context: orgCtx(), privateKey: scalar(K.bKem), expect: { ok: false, refusal: "cannot-open" } }
  ];
}

const DIGEST_LABEL = Buffer.concat([Buffer.from("fabric-keyed-digest/1", "ascii"), Buffer.from([0])]);
function digestCases(): Json[] {
  const key = sha256(`${LABEL}estate digest key`);
  const other = sha256(`${LABEL}another estate's key`);
  const id = (k: Buffer) => `ekd-${sha256(k).toString("hex").slice(0, 16)}`;
  const kd = (k: Buffer, value: string) => `kd1:${id(k)}:${createHmac("sha256", k).update(DIGEST_LABEL).update(Buffer.from(value, "utf8")).digest("hex")}`;
  return [
    { name: "a value under the estate's key", key: key.toString("hex"), value: SECRET, expect: kd(key, SECRET) },
    { name: "the same value under another key never compares equal", key: other.toString("hex"), value: SECRET, expect: kd(other, SECRET) },
    { name: "an empty value", key: key.toString("hex"), value: "", expect: kd(key, "") },
    { name: "a key that is not 32 bytes", key: key.subarray(0, 16).toString("hex"), value: SECRET, expect: null }
  ];
}

function revocationCases(): Json[] {
  const unsigned = (over: Json = {}): Json => ({ type: "credential-revocation/1", org: { id: ORG }, device: { id: "dev-01j9a" }, context: ORG_CONTEXT, agentRef: AGENT, slot: "CLOUDFLARE_API_TOKEN", revokedAt: "2026-10-24T09:00:00Z", reason: "administrator", ...over });
  const signed = (doc: Json, key = POLICY): Json => ({ ...doc, signature: { alg: "ed25519", keyId: "org-7f3a.policy-2026-10", value: sign(null, Buffer.from(settingsCanonicalJson(doc), "utf8"), key).toString("base64") } });
  const device = { id: "dev-01j9a", org: ORG };
  const at = "2026-10-24T09:00:00Z";
  return [
    { name: "a revocation for this device stands", input: { revocation: signed(unsigned()), keys: KEYS, device, at }, expect: { ok: true } },
    { name: "signed by another key", input: { revocation: signed(unsigned(), OTHER_POLICY), keys: KEYS, device, at }, expect: { ok: false, reason: "bad-signature" } },
    { name: "after the key's window on the device's clock", input: { revocation: signed(unsigned()), keys: KEYS, device, at: "2027-01-01T00:00:00Z" }, expect: { ok: false, reason: "bad-signature" } },
    { name: "a revokedAt the signer chose inside the window does not save a key ended on the device's clock", input: { revocation: signed(unsigned({ revokedAt: "2026-10-24T09:00:00Z" })), keys: KEYS, device, at: "2027-01-02T00:00:00Z" }, expect: { ok: false, reason: "bad-signature" } },
    { name: "another device's", input: { revocation: signed(unsigned({ device: { id: "dev-other" } })), keys: KEYS, device, at }, expect: { ok: false, reason: "wrong-device" } },
    { name: "another organization's context", input: { revocation: signed(unsigned({ context: "org:org-9c1d" })), keys: KEYS, device, at }, expect: { ok: false, reason: "wrong-device" } },
    { name: "not a revocation", input: { revocation: { type: "credential-request/1" }, keys: KEYS, device, at }, expect: { ok: false, reason: "malformed" } }
  ];
}

export function credentialVectors(): Json {
  return {
    about:
      "Vectors for credentials on request (DEC-0111), written by tools/vectors/credential-envelope.ts, never by hand. check: checkCredentialEnvelope(envelope, context); an absent member is absent. open: openCredential(envelope, context, privateKey), privateKey the base64 P-256 scalar, secret the UTF-8 value (the digest key as base64 of its 32 bytes). digest: keyedDigest(key, value), key hex, null for undefined. revocation: credentialRevocationStands(input), input.at the device's clock. An envelope is HPKE base mode, suite [16, 1, 1], info the ASCII fabric-credential-envelope/1, the additional data the RFC 8785 UTF-8 bytes of the header, signed over the RFC 8785 bytes of {header, ct}: EdDSA by an organization's policy key (Ed25519), ES256 low-S as r ‖ s by a machine's #sig; enc, ct and sig are unpadded base64url. The organization's policy key set is keys; the estate record is record.",
    keys: KEYS,
    record: record(),
    check: checkCases(),
    open: openCases(),
    digest: digestCases(),
    revocation: revocationCases()
  };
}

/** What `--write` writes: the vector file's exact text. */
export function buildCredentialVectors(): string {
  return `${JSON.stringify(credentialVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildCredentialVectors();
  if (process.argv.includes("--write")) {
    writeFileSync(target, built);
    console.log(`wrote ${VECTOR_FILE}`);
  } else if (readFileSync(target, "utf8") !== built) {
    console.error(`stale vector file (run with --write): ${VECTOR_FILE}`);
    process.exitCode = 1;
  } else {
    console.log("vector file matches the generator");
  }
}
