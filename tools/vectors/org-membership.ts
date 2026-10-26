/**
 * The generator of the membership vectors (DEC-0127): `fixtures/vectors/org-membership.json`, shared by every
 * organization server that issues `org-membership/1` (MD-9 path (a): any server) and every reader that verifies it
 * (a person's Fabric, a product's client).
 *
 *   tsx tools/vectors/org-membership.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/org-membership.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/org-membership.test.ts` runs the
 * check. Each test key's 32-byte seed is the SHA-256 of a published label, and Ed25519 signatures are deterministic, so
 * a port's signer reproduces every `sig`. They are test keys: anyone can derive them, and nothing trusts them. The
 * expected outcome of every case is written here by hand from DEC-0127; nothing here imports `src/org-membership.ts`.
 */
import { createHash, createPrivateKey, sign as nodeSign } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { rfc8785 } from "../../src/canonical.js";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/org-membership.json";

// ---- Keys ---------------------------------------------------------------------------------------------------------

const LABEL = "fabric-agent-contract/vectors/org-membership/";
const PKCS8_ED25519 = Buffer.from("302e020100300506032b657004220420", "hex");
const sha256 = (data: string | Buffer) => createHash("sha256").update(data).digest();

interface TestKey { seed: string; kid: string; x: string; sign: (bytes: Buffer) => string }

/** An Ed25519 test key whose seed is SHA-256 of `LABEL + label`. */
function testKey(label: string, kid: string): TestKey {
  const seed = sha256(`${LABEL}${label}`);
  const key = createPrivateKey({ key: Buffer.concat([PKCS8_ED25519, seed]), format: "der", type: "pkcs8" });
  const x = (key.export({ format: "jwk" }) as { x: string }).x;
  return { seed: seed.toString("hex"), kid, x, sign: (bytes) => nodeSign(null, bytes, key).toString("base64url") };
}

/** Organization A's root, which the person's estate pins. */
const ROOT = testKey("root-org-a", "root-org-a-1");
/** Organization B's root on the same server: one root per organization (MD-9 path (a)). */
const ROOT_B = testKey("root-org-b", "root-org-b-1");
/** The signing key rotated out, listed until what it signed is past expiry. */
const K1 = testKey("signing-2026-09", "mem-2026-09");
/** The signing key rotated in. */
const K2 = testKey("signing-2026-10", "mem-2026-10");
/** A signing key revoked before the vectors begin. */
const K0 = testKey("signing-2026-08", "mem-2026-08");
/** A key nobody lists. */
const ROGUE = testKey("rogue", "mem-rogue");
/** The all-zero Ed25519 encoding, of order 4 (DEC-0045). */
const ZERO_X = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

/** An administrator's signing passkey (EdDSA, COSE -8), certified by the root in `administrators` (DEC-0129). */
const ADMIN = testKey("administrator-passkey", "admin-passkey");
const ADMIN_CREDENTIAL = {
  credentialId: sha256(`${LABEL}administrator-passkey/credential`).subarray(0, 16).toString("base64url"),
  alg: "EdDSA",
  publicKey: { kty: "OKP", crv: "Ed25519", x: ADMIN.x },
  rpId: "sign.orgs.example",
  origins: ["https://sign.orgs.example"]
};

const ISSUER = "https://orgs.example";
const ORG_A = "org:org-a";
const ORG_B = "org:org-b";
const AUDIENCE = "fabric-estate-5d0f1a";
const statement = (doc: Json) => {
  const { sig: _sig, ...fields } = doc;
  return Buffer.from(rfc8785(fields), "utf8");
};
const digest = (doc: Json) => `sha256:${sha256(statement(doc)).toString("hex")}`;
const signed = (doc: Json, key: TestKey) => ({ ...doc, sig: key.sign(statement(doc)) });

// ---- Key sets -----------------------------------------------------------------------------------------------------

const keyEntry = (key: TestKey, notBefore: string, notAfter: string, alg = "EdDSA") => ({ kid: key.kid, alg, x: key.x, notBefore, notAfter });
const K1_ENTRY = keyEntry(K1, "2026-09-01T00:00:00Z", "2026-11-01T00:00:00Z");
const K2_ENTRY = keyEntry(K2, "2026-10-15T00:00:00Z", "2027-01-01T00:00:00Z");

function keySet(revision: number, issuedAt: string, keys: Json[], revoked: string[], change: Json = {}, signer: TestKey = ROOT): Json {
  return signed({ type: "org-key-set/1", issuer: ISSUER, org: ORG_A, revision, issuedAt, keys, revoked, administrators: [ADMIN_CREDENTIAL], alg: "EdDSA", kid: ROOT.kid, ...change }, signer);
}

const KEY_SETS: Record<string, Json> = {
  /** Revision 1: K1 alone. */
  r1: keySet(1, "2026-09-01T00:00:00Z", [K1_ENTRY], []),
  /** Revision 2, the one the attestation cases apply: K2 beside K1; K0 revoked. */
  r2: keySet(2, "2026-10-15T00:00:00Z", [K1_ENTRY, K2_ENTRY], [K0.kid]),
  /** Revision 2 again with other bytes. */
  r2Other: keySet(2, "2026-10-15T00:00:01Z", [K1_ENTRY, K2_ENTRY], [K0.kid]),
  /** Revision 3: K1 revoked inside its window. */
  r3: keySet(3, "2026-10-28T00:00:00Z", [K2_ENTRY], [K0.kid, K1.kid]),
  /** Organization B's set, signed by B's root, listing the same keys. */
  orgB: keySet(1, "2026-10-15T00:00:00Z", [K1_ENTRY, K2_ENTRY], [], { org: ORG_B, kid: ROOT_B.kid }, ROOT_B)
};

/** Key sets an attestation verifier is handed as applied, built by hand to reach its key checks (never root-signed). */
const HANDED: Record<string, Json> = {
  algMismatch: { ...KEY_SETS.r2, keys: [K1_ENTRY, { ...K2_ENTRY, alg: "ES256" }] },
  smallOrder: { ...KEY_SETS.r2, keys: [K1_ENTRY, K2_ENTRY, { kid: "mem-zero", alg: "EdDSA", x: ZERO_X, notBefore: "2026-10-01T00:00:00Z", notAfter: "2027-01-01T00:00:00Z" }] },
  es256: { ...KEY_SETS.r2, alg: "ES256" },
  rootAmongKeys: { ...KEY_SETS.r2, keys: [K1_ENTRY, K2_ENTRY, { ...K2_ENTRY, kid: ROOT.kid }] }
};

// ---- Attestations -------------------------------------------------------------------------------------------------

function attestation(change: Json = {}, key: TestKey = K2): Json {
  return signed({
    type: "org-membership/1",
    issuer: ISSUER,
    org: ORG_A,
    audience: AUDIENCE,
    subject: "m-7f3a91c2",
    role: "member",
    external: false,
    status: "active",
    revision: 4,
    membershipEndsAt: null,
    issuedAt: "2026-10-25T11:00:00Z",
    notBefore: "2026-10-25T11:00:00Z",
    expiresAt: "2026-10-25T12:00:00Z",
    extensions: {},
    alg: "EdDSA",
    kid: key.kid,
    ...change
  }, key);
}

const BASE = attestation();
const held = (doc: Json) => ({ subject: doc.subject, revision: doc.revision, digest: digest(doc) });
const accepted = (doc: Json, status: "active" | "ended", refreshDue: boolean, unchanged = false) => ({ ok: true, status, role: doc.role, refreshDue, unchanged, digest: digest(doc), held: held(doc) });
const refused = (problem: string) => ({ ok: false, problem });
const NOW = "2026-10-25T11:30:00Z";
const trust = (change: Json = {}) => ({ now: NOW, org: ORG_A, audience: AUDIENCE, keySet: "r2", ...change });

function verifyCases(): Json[] {
  const c = (name: string, doc: unknown, context: Json | null, expected: Json) => ({ name, attestation: doc, trust: context, expected });
  const admin = attestation({ role: "admin", external: false });
  const guest = attestation({ external: true, membershipEndsAt: "2026-12-31T00:00:00Z" });
  const ended = attestation({ status: "ended", revision: 5 });
  const termOver = attestation({ membershipEndsAt: "2026-10-25T11:15:00Z" });
  const higher = attestation({ revision: 5, role: "admin" });
  const lower = attestation({ revision: 3 });
  const otherBytes = attestation({ role: "owner" });
  const otherSubject = attestation({ subject: "m-00c4e1aa", revision: 1 });
  const withExtension = attestation({ extensions: { "orgs.example/role": "finance", "orgs.example/seat": true } });
  const day = attestation({ expiresAt: "2026-10-26T11:00:00Z" });
  const dayPlus = attestation({ expiresAt: "2026-10-26T11:00:00.001Z" });
  const early = attestation({ notBefore: "2026-10-25T11:45:00Z" });
  const byK1 = attestation({}, K1);
  const forged = { ...attestation({ kid: "mem-zero" }), sig: `${"A".repeat(85)}A` };
  return [
    c("valid: an active member", BASE, trust(), accepted(BASE, "active", false)),
    c("valid: an administrator", admin, trust(), accepted(admin, "active", false)),
    c("valid: a guest with a fixed term", guest, trust(), accepted(guest, "active", false)),
    c("valid: an issuer's extension rides along and grants nothing", withExtension, trust(), accepted(withExtension, "active", false)),
    c("ended: the issuer states the end with a higher revision", ended, trust({ held: held(BASE) }), accepted(ended, "ended", false)),
    c("ended: past membershipEndsAt the attestation reads ended", termOver, trust(), accepted(termOver, "ended", false)),
    c("ended: a millisecond before membershipEndsAt it is still active", termOver, trust({ now: "2026-10-25T11:14:59.999Z" }), accepted(termOver, "active", false)),
    c("wrong organization: a server listing one key in two organizations' sets (against OM-3), A's attestation read for B", BASE, trust({ org: ORG_B, keySet: "orgB" }), refused("wrong-org")),
    c("wrong organization: orgs compare as written", BASE, trust({ org: "org:ORG-A" }), refused("context-invalid")),
    c("wrong audience: an attestation for another reader", BASE, trust({ audience: "product-client-9" }), refused("wrong-audience")),
    c("wrong subject: a reader that knows its member gets another member's attestation", BASE, trust({ subject: "m-00c4e1aa" }), refused("wrong-subject")),
    c("subject: a reader that knows its member gets that member's attestation", BASE, trust({ subject: "m-7f3a91c2" }), accepted(BASE, "active", false)),
    c("extension: 256 astral characters, counted as code points as the schema counts them", attestation({ extensions: { "orgs.example/note": "\u{1F600}".repeat(256) } }), trust(), accepted(attestation({ extensions: { "orgs.example/note": "\u{1F600}".repeat(256) } }), "active", false)),
    c("extension: 257 astral characters is malformed", attestation({ extensions: { "orgs.example/note": "\u{1F600}".repeat(257) } }), trust(), refused("malformed")),
    c("too long: expiresAt at notBefore, an empty life", attestation({ expiresAt: "2026-10-25T11:00:00Z" }), trust(), refused("too-long-lived")),
    c("wrong key: K2's kid, signed by a key nobody lists", signed(attestation(), ROGUE), trust(), refused("bad-signature")),
    c("bad signature: the role raised after signing", { ...BASE, role: "owner" }, trust(), refused("bad-signature")),
    c("unknown kid: a kid the key set does not list", attestation({}, ROGUE), trust(), refused("unknown-key")),
    c("revoked key: signed by K0, which the key set revokes", attestation({}, K0), trust(), refused("key-revoked")),
    c("revoked key: K1 revoked by revision 3, inside its window", byK1, trust({ keySet: "r3" }), refused("key-revoked")),
    c("rotated key: K1, rotated out, issuedAt inside its window", byK1, trust(), accepted(byK1, "active", false)),
    c("key window: K1 after its window, issuedAt at its notAfter", attestation({ issuedAt: "2026-11-01T00:00:00Z", notBefore: "2026-11-01T00:00:00Z", expiresAt: "2026-11-01T01:00:00Z" }, K1), trust({ now: "2026-11-01T00:30:00Z" }), refused("key-not-valid")),
    c("key window: K2 a millisecond before its window", attestation({ issuedAt: "2026-10-14T23:59:59.999Z", notBefore: "2026-10-15T00:00:00Z", expiresAt: "2026-10-15T01:00:00Z" }), trust({ now: "2026-10-15T00:30:00Z" }), refused("key-not-valid")),
    c("small-order key: a listed key of order 4, refused before the signature is read", forged, trust({ keySet: "smallOrder" }), refused("small-order-key")),
    c("unusable key: the listed key names another algorithm", BASE, trust({ keySet: "algMismatch" }), refused("unusable-key")),
    c("wrong issuer: another server's attestation", attestation({ issuer: "https://other.example" }), trust(), refused("wrong-issuer")),
    c("unknown algorithm: ES256", attestation({ alg: "ES256" }), trust(), refused("unknown-algorithm")),
    c("expired: at expiresAt, no grace", BASE, trust({ now: "2026-10-25T12:00:00Z" }), refused("expired")),
    c("expired: a millisecond before expiresAt it still verifies, refresh due", BASE, trust({ now: "2026-10-25T11:59:59.999Z" }), accepted(BASE, "active", true)),
    c("refresh due: 15 minutes before expiresAt", BASE, trust({ now: "2026-10-25T11:45:00Z" }), accepted(BASE, "active", true)),
    c("refresh not due: a millisecond earlier", BASE, trust({ now: "2026-10-25T11:44:59.999Z" }), accepted(BASE, "active", false)),
    c("not yet valid: before notBefore", early, trust(), refused("not-yet-valid")),
    c("not yet valid: 60 s before notBefore is within the clock skew", early, trust({ now: "2026-10-25T11:44:00Z" }), accepted(early, "active", false)),
    c("too long: exactly 24 hours", day, trust(), accepted(day, "active", false)),
    c("too long: 24 hours and a millisecond", dayPlus, trust(), refused("too-long-lived")),
    c("too long: notBefore before issuedAt", attestation({ notBefore: "2026-10-25T10:59:59Z" }), trust(), refused("too-long-lived")),
    c("replay: a lower revision for the held subject", lower, trust({ held: held(BASE) }), refused("stale-revision")),
    c("replay: the held revision with other bytes", otherBytes, trust({ held: held(BASE) }), refused("revision-conflict")),
    c("redelivery: the held attestation again", BASE, trust({ held: held(BASE) }), accepted(BASE, "active", false, true)),
    c("renewal: a higher revision, the role changed", higher, trust({ held: held(BASE) }), accepted(higher, "active", false)),
    c("another subject: held records are per subject", otherSubject, trust({ held: held(BASE) }), accepted(otherSubject, "active", false)),
    c("malformed: an unknown role", attestation({ role: "finance" }), trust(), refused("malformed")),
    c("malformed: an email as a member", { ...BASE, email: "a@b.example" }, trust(), refused("malformed")),
    c("malformed: an extension not named by a domain", attestation({ extensions: { role: "finance" } }), trust(), refused("malformed")),
    c("malformed: an extension holding an object", attestation({ extensions: { "orgs.example/x": { a: 1 } } }), trust(), refused("malformed")),
    c("malformed: a personal context as the organization", attestation({ org: "personal" }), trust(), refused("malformed")),
    c("malformed: a time with four fraction digits", attestation({ notBefore: "2026-10-25T11:00:00.0001Z" }), trust(), refused("malformed")),
    c("malformed: no signature", (({ sig: _sig, ...rest }) => rest)(BASE), trust(), refused("malformed")),
    c("malformed: not an object", "org-membership", trust(), refused("malformed")),
    c("context: no trust", BASE, null, refused("context-invalid")),
    c("context: a key set of another organization", BASE, trust({ keySet: "orgB" }), refused("context-invalid")),
    c("context: a key set that is not one", BASE, trust({ keySet: "rootAmongKeys" }), refused("context-invalid")),
    c("context: a key set under an algorithm the verifier does not know", BASE, trust({ keySet: "es256" }), refused("context-invalid")),
    c("context: an audience that is not an opaque id", BASE, trust({ audience: "" }), refused("context-invalid")),
    c("context: a subject that is not an opaque id", BASE, trust({ subject: "" }), refused("context-invalid")),
    c("context: a held record without a subject", BASE, trust({ held: { revision: 4, digest: digest(BASE) } }), refused("context-invalid")),
    c("no clock: an unreadable now", BASE, trust({ now: "2026-10-25 11:30:00" }), refused("no-clock"))
  ];
}

// ---- Key-set cases ------------------------------------------------------------------------------------------------

const ROOT_PIN = { issuer: ISSUER, org: ORG_A, kid: ROOT.kid, x: ROOT.x };
const heldSet = (set: Json) => ({ revision: set.revision, digest: digest(set) });
const appliedSet = (set: Json, unchanged = false) => ({ ok: true, unchanged, digest: digest(set), held: heldSet(set) });

function keySetCases(): Json[] {
  const c = (name: string, set: unknown, context: Json | null, expected: Json) => ({ name, keySet: set, trust: context, expected });
  const pin = (change: Json = {}) => ({ root: ROOT_PIN, ...change });
  const r1 = KEY_SETS.r1 as Json;
  const r2 = KEY_SETS.r2 as Json;
  return [
    c("first: revision 1 with nothing held", "r1", pin(), appliedSet(r1)),
    c("rotation: revision 2 over revision 1", "r2", pin({ held: heldSet(r1) }), appliedSet(r2)),
    c("revocation: revision 3 over revision 2", "r3", pin({ held: heldSet(r2) }), appliedSet(KEY_SETS.r3 as Json)),
    c("redelivery: revision 2 again, the same bytes", "r2", pin({ held: heldSet(r2) }), appliedSet(r2, true)),
    c("stale: revision 1 after revision 2", "r1", pin({ held: heldSet(r2) }), refused("stale-revision")),
    c("conflict: revision 2 with other bytes", "r2Other", pin({ held: heldSet(r2) }), refused("revision-conflict")),
    c("organization B's set under B's pinned root", "orgB", { root: { issuer: ISSUER, org: ORG_B, kid: ROOT_B.kid, x: ROOT_B.x } }, appliedSet(KEY_SETS.orgB as Json)),
    c("wrong issuer: B's set read under A's pin", "orgB", pin(), refused("wrong-issuer")),
    c("wrong organization: A's root signing a set that names B", keySet(2, "2026-10-15T00:00:00Z", [K1_ENTRY, K2_ENTRY], [K0.kid], { org: ORG_B }), pin(), refused("wrong-org")),
    c("wrong issuer: a root pinned for another origin", "r2", pin({ root: { ...ROOT_PIN, issuer: "https://other.example" } }), refused("wrong-issuer")),
    c("bad signature: the root's kid, signed by another key", keySet(2, "2026-10-15T00:00:00Z", [K1_ENTRY, K2_ENTRY], [K0.kid], {}, ROOT_B), pin(), refused("bad-signature")),
    c("unknown algorithm: a listed key under ES256", keySet(2, "2026-10-15T00:00:00Z", [K1_ENTRY, keyEntry(K2, "2026-10-15T00:00:00Z", "2027-01-01T00:00:00Z", "ES256")], [K0.kid]), pin(), refused("unknown-algorithm")),
    c("unusable key: a pinned root that is not 32 canonical bytes", "r2", pin({ root: { ...ROOT_PIN, x: `${ROOT.x.slice(0, 42)}B` } }), refused("unusable-key")),
    c("small-order key: a pinned root of order 4", "r2", pin({ root: { ...ROOT_PIN, x: ZERO_X } }), refused("small-order-key")),
    c("small-order key: a root-signed set listing a key of order 4", keySet(2, "2026-10-15T00:00:00Z", [K1_ENTRY, { kid: "mem-zero", alg: "EdDSA", x: ZERO_X, notBefore: "2026-10-01T00:00:00Z", notAfter: "2027-01-01T00:00:00Z" }], [K0.kid]), pin(), refused("small-order-key")),
    c("unusable key: an administrator under a sign-in RP (DEC-0129)", keySet(2, "2026-10-15T00:00:00Z", [K1_ENTRY, K2_ENTRY], [K0.kid], { administrators: [{ ...ADMIN_CREDENTIAL, rpId: "orgs.example", origins: ["https://orgs.example"] }] }), pin(), refused("unusable-key")),
    c("unusable key: an administrator's origin outside its RP (DEC-0129)", keySet(2, "2026-10-15T00:00:00Z", [K1_ENTRY, K2_ENTRY], [K0.kid], { administrators: [{ ...ADMIN_CREDENTIAL, origins: ["https://evil.example"] }] }), pin(), refused("unusable-key")),
    c("small-order key: an administrator's key of order 4 (DEC-0129)", keySet(2, "2026-10-15T00:00:00Z", [K1_ENTRY, K2_ENTRY], [K0.kid], { administrators: [{ ...ADMIN_CREDENTIAL, publicKey: { kty: "OKP", crv: "Ed25519", x: ZERO_X } }] }), pin(), refused("small-order-key")),
    c("unknown algorithm: the set under ES256", keySet(2, "2026-10-15T00:00:00Z", [K1_ENTRY, K2_ENTRY], [K0.kid], { alg: "ES256" }), pin(), refused("unknown-algorithm")),
    c("malformed: a kid listed twice", keySet(2, "2026-10-15T00:00:00Z", [K1_ENTRY, { ...K2_ENTRY, kid: K1.kid }], [K0.kid]), pin(), refused("malformed")),
    c("malformed: an administrator's credential listed twice (DEC-0129)", keySet(2, "2026-10-15T00:00:00Z", [K1_ENTRY, K2_ENTRY], [K0.kid], { administrators: [ADMIN_CREDENTIAL, ADMIN_CREDENTIAL] }), pin(), refused("malformed")),
    c("malformed: an administrator with no origin (DEC-0129)", keySet(2, "2026-10-15T00:00:00Z", [K1_ENTRY, K2_ENTRY], [K0.kid], { administrators: [{ ...ADMIN_CREDENTIAL, origins: [] }] }), pin(), refused("malformed")),
    c("malformed: an administrator's origin listed twice (DEC-0129)", keySet(2, "2026-10-15T00:00:00Z", [K1_ENTRY, K2_ENTRY], [K0.kid], { administrators: [{ ...ADMIN_CREDENTIAL, origins: [ADMIN_CREDENTIAL.origins[0], ADMIN_CREDENTIAL.origins[0]] }] }), pin(), refused("malformed")),
    c("malformed: no organization", (({ org: _org, ...rest }) => rest)(r2), pin(), refused("malformed")),
    c("malformed: an attestation is not a key set", BASE, pin(), refused("malformed")),
    c("context: a pin without its organization", "r2", { root: { issuer: ISSUER, kid: ROOT.kid, x: ROOT.x } }, refused("context-invalid")),
    c("context: no trust", "r2", null, refused("context-invalid"))
  ];
}

// ---- Output -------------------------------------------------------------------------------------------------------

/** The vectors as an object. */
export function orgMembershipVectors(): Json {
  const keys = Object.fromEntries([["root", ROOT], ["rootB", ROOT_B], ["k0", K0], ["k1", K1], ["k2", K2], ["rogue", ROGUE]].map(([name, key]) => {
    const { seed, kid, x } = key as TestKey;
    return [name, { seed, kid, x }];
  }));
  return {
    about: "Vectors for org-membership/1 and org-key-set/1 (DEC-0127), written by tools/vectors/org-membership.ts, never by hand. keys: Ed25519 test keys, each seed the SHA-256 of a published label (anyone can derive them; nothing trusts them). root: organization A's root as the person's estate pins it ({issuer, org, kid, x}). keySets: documents a root signed; handedKeySets: key sets built by hand to reach the attestation verifier's key checks, never root-signed. keySet cases: verifyOrgKeySet(keySet, trust), keySet a document or the name of one in keySets. verify cases: verifyOrgMembership(attestation, trust), trust.now an RFC 3339 string a port parses strictly, trust.keySet the name of a key set in keySets or handedKeySets, trust.held the record held for the subject. expected is exactly what the reference returns; digest is sha256: of the signed bytes.",
    keys,
    root: ROOT_PIN,
    signingInput: {
      attestation: { document: BASE, input: statement(BASE).toString("utf8") },
      keySet: { document: KEY_SETS.r2, input: statement(KEY_SETS.r2 as Json).toString("utf8") }
    },
    keySets: KEY_SETS,
    handedKeySets: HANDED,
    keySetCases: keySetCases(),
    verify: verifyCases()
  };
}

/** What `--write` writes: the vector file's exact text. */
export function buildOrgMembershipVectors(): string {
  return `${JSON.stringify(orgMembershipVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildOrgMembershipVectors();
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
