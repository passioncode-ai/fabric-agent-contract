/**
 * The generator of the entitlement vectors (DEC-0085): `fixtures/vectors/entitlement.json`, shared by the issuer (the
 * PassionCode platform) and every verifier (the first organization server, a personal cloud).
 *
 *   tsx tools/vectors/entitlement.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/entitlement.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/entitlement.test.ts` runs the check.
 * The output is deterministic: each test key's 32-byte seed is the SHA-256 of a published label, and Ed25519 signatures
 * are deterministic, so a port's signer reproduces every `sig`. They are test keys: anyone can derive them, and nothing
 * trusts them. The expected outcome of every case is written here by hand from DEC-0085's items; nothing here imports
 * `src/entitlement.ts`, so the gate checks that the reference returns what this file expects.
 */
import { createHash, createPrivateKey, sign as nodeSign } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { rfc8785 } from "../../src/canonical.js";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/entitlement.json";

// ---- Keys ---------------------------------------------------------------------------------------------------------

const LABEL = "fabric-agent-contract/vectors/entitlement/";
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

const ROOT = testKey("root", "root-2026-1");
/** Another issuer's root, or a root key this verifier never pinned. */
const OTHER_ROOT = testKey("other-root", "root-other-1");
/** The signing key rotated out: listed until what it signed is past expiry and grace. */
const K1 = testKey("signing-2026-09", "ent-2026-09");
/** The signing key rotated in, its window overlapping K1's. */
const K2 = testKey("signing-2026-10", "ent-2026-10");
/** A signing key revoked before the vectors begin. */
const K0 = testKey("signing-2026-08", "ent-2026-08");
/** A key nobody lists: it signs under K2's kid (a forgery) and under a kid no key set names. */
const ROGUE = testKey("rogue", "ent-rogue");
/** The all-zero Ed25519 encoding, of order 4 (DEC-0045). */
const ZERO_X = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

const ISSUER = "https://platform.example";
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
  return signed({ type: "entitlement-key-set/1", issuer: ISSUER, revision, issuedAt, keys, revoked, alg: "EdDSA", kid: ROOT.kid, ...change }, signer);
}

const KEY_SETS: Record<string, Json> = {
  /** Revision 1: K1 alone. */
  r1: keySet(1, "2026-09-01T00:00:00Z", [K1_ENTRY], []),
  /** Revision 2, the one the entitlement cases apply: K2 rotated in beside K1; K0 revoked. */
  r2: keySet(2, "2026-10-15T00:00:00Z", [K1_ENTRY, K2_ENTRY], [K0.kid]),
  /** Revision 2 again with other bytes: a root that signed two different sets under one revision. */
  r2Other: keySet(2, "2026-10-15T00:00:01Z", [K1_ENTRY, K2_ENTRY], [K0.kid]),
  /** Revision 3: K1 revoked at once, before its window closes. */
  r3: keySet(3, "2026-10-28T00:00:00Z", [K2_ENTRY], [K0.kid, K1.kid])
};

/** Key sets an entitlement verifier is handed as applied, built by hand to reach its key checks (never root-signed). */
const HANDED: Record<string, Json> = {
  /** K2 listed under ES256 while entitlements say EdDSA. */
  algMismatch: { ...KEY_SETS.r2, keys: [K1_ENTRY, { ...K2_ENTRY, alg: "ES256" }] },
  /** A listed key of small order (the all-zero encoding). */
  smallOrder: { ...KEY_SETS.r2, keys: [K1_ENTRY, K2_ENTRY, { kid: "ent-zero", alg: "EdDSA", x: ZERO_X, notBefore: "2026-10-01T00:00:00Z", notAfter: "2027-01-01T00:00:00Z" }] },
  /** Not a set the root could have signed: its algorithm is not EdDSA. */
  es256: { ...KEY_SETS.r2, alg: "ES256" },
  /** Not a key set: the root's kid among the keys. */
  rootAmongKeys: { ...KEY_SETS.r2, keys: [K1_ENTRY, K2_ENTRY, { ...K2_ENTRY, kid: ROOT.kid }] },
  /** Not a key set: no key's window holds its issuedAt (devices.md *Key sets*, FAC-SEM-116). */
  noKeyAtIssue: { ...KEY_SETS.r2, issuedAt: "2027-06-01T00:00:00Z" }
};

// ---- Entitlements -------------------------------------------------------------------------------------------------

const AGENTS = [{ agentRef: "urn:fabric:agent:example-publisher:notes" }, { agentRef: "urn:fabric:agent:example-publisher:triage" }];
const ORG_A = "org:org-a";
const ORG_B = "org:org-b";
const ESTATE = "estate-5d0f1a";

function entitlement(change: Json = {}, key: TestKey = K2): Json {
  return signed({
    type: "entitlement/1",
    issuer: ISSUER,
    subject: ORG_A,
    estate: null,
    order: { id: "ord-org-a-0001", revision: 3 },
    issuedAt: "2026-10-20T00:00:00Z",
    notBefore: "2026-10-20T00:00:00Z",
    expiresAt: "2026-11-24T00:00:00Z",
    licence: { members: 25 },
    hosting: { product: "org-cloud", size: "s-2" },
    support: { tier: "assist" },
    agents: AGENTS,
    alg: "EdDSA",
    kid: key.kid,
    ...change
  }, key);
}

const PERSONAL_LINES = { subject: "personal", estate: ESTATE, order: { id: "ord-p-0001", revision: 1 }, licence: null, hosting: { product: "personal-cloud", size: "p-1" }, support: null };
const BASE = entitlement();
const PERSONAL = entitlement(PERSONAL_LINES);
const ORG_B_DOC = entitlement({ subject: ORG_B, order: { id: "ord-org-b-0001", revision: 1 }, licence: { members: 400 }, support: { tier: "managed" } });

const held = (doc: Json) => ({ orderId: doc.order.id, revision: doc.order.revision, issuedAt: doc.issuedAt, digest: digest(doc) });
const accepted = (doc: Json, state: "active" | "grace", refreshDue: boolean, unchanged = false) => ({ ok: true, state, refreshDue, unchanged, digest: digest(doc), held: held(doc) });
const refused = (problem: string) => ({ ok: false, problem });
const NOW = "2026-10-25T12:00:00Z";
const orgTrust = (change: Json = {}) => ({ now: NOW, subject: ORG_A, keySet: "r2", ...change });

function verifyCases(): Json[] {
  const c = (name: string, doc: unknown, trust: Json | null, expected: Json) => ({ name, entitlement: doc, trust, expected });
  const lower = entitlement({ order: { id: "ord-org-a-0001", revision: 2 }, issuedAt: "2026-09-20T00:00:00Z", notBefore: "2026-09-20T00:00:00Z", expiresAt: "2026-10-25T00:00:00Z" }, K1);
  const higher = entitlement({ order: { id: "ord-org-a-0001", revision: 4 }, licence: { members: 30 }, issuedAt: "2026-10-24T00:00:00Z", notBefore: "2026-10-24T00:00:00Z", expiresAt: "2026-11-28T00:00:00Z" });
  const otherBytes = entitlement({ licence: { members: 30 } });
  const olderOrder = entitlement({ order: { id: "ord-org-a-0000", revision: 9 }, issuedAt: "2026-10-19T00:00:00Z", notBefore: "2026-10-19T00:00:00Z", expiresAt: "2026-11-23T00:00:00Z" });
  const sameInstantOrder = entitlement({ order: { id: "ord-org-a-0000", revision: 9 } });
  const newerOrder = entitlement({ order: { id: "ord-org-a-0002", revision: 1 }, issuedAt: "2026-10-22T00:00:00Z", notBefore: "2026-10-22T00:00:00Z", expiresAt: "2026-11-26T00:00:00Z" });
  const byK1 = entitlement({}, K1);
  const k1AtNotAfter = entitlement({ issuedAt: "2026-11-01T00:00:00Z", notBefore: "2026-11-01T00:00:00Z", expiresAt: "2026-12-01T00:00:00Z" }, K1);
  const k1BeforeWindow = entitlement({ issuedAt: "2026-08-31T23:59:59Z", notBefore: "2026-08-31T23:59:59Z", expiresAt: "2026-10-01T00:00:00Z" }, K1);
  const k2AtNotBefore = entitlement({ issuedAt: "2026-10-15T00:00:00Z", notBefore: "2026-10-15T00:00:00Z", expiresAt: "2026-11-19T00:00:00Z" });
  const k2JustBefore = entitlement({ issuedAt: "2026-10-14T23:59:59.999Z", notBefore: "2026-10-15T00:00:00Z", expiresAt: "2026-11-18T00:00:00Z" });
  const early = entitlement({ notBefore: "2026-11-01T00:00:00Z" });
  const day38 = entitlement({ expiresAt: "2026-11-27T00:00:00Z" });
  const day38Plus = entitlement({ expiresAt: "2026-11-27T00:00:00.001Z" });
  const millis = entitlement({ notBefore: "2026-10-20T00:00:00.001Z" });
  const notBeforeEarly = entitlement({ notBefore: "2026-10-19T23:59:59Z" });
  const empty = entitlement({ notBefore: "2026-11-24T00:00:00Z" });
  const forged = { ...entitlement({ kid: "ent-zero" }), sig: `${"A".repeat(85)}A` };
  return [
    c("valid: an organization's entitlement, active", BASE, orgTrust(), accepted(BASE, "active", false)),
    c("valid: a personal entitlement at its own estate", PERSONAL, { now: NOW, subject: "personal", estate: ESTATE, keySet: "r2" }, accepted(PERSONAL, "active", false)),
    c("valid: no agents, no licence, no hosting, no support", entitlement({ agents: [], licence: null, hosting: null, support: null }), orgTrust(), accepted(entitlement({ agents: [], licence: null, hosting: null, support: null }), "active", false)),
    c("wrong subject: organization A's entitlement at organization B", BASE, orgTrust({ subject: ORG_B }), refused("wrong-subject")),
    c("wrong subject: a personal entitlement at another person's estate", PERSONAL, { now: NOW, subject: "personal", estate: "estate-7b21c0", keySet: "r2" }, refused("wrong-subject")),
    c("wrong subject: a personal entitlement at an organization", PERSONAL, orgTrust(), refused("wrong-subject")),
    c("wrong subject: an organization's entitlement at a personal cloud", BASE, { now: NOW, subject: "personal", estate: ESTATE, keySet: "r2" }, refused("wrong-subject")),
    c("wrong subject: subjects compare as written, org:ORG-A is not org:org-a", BASE, orgTrust({ subject: "org:ORG-A" }), refused("wrong-subject")),
    c("one person in two organizations: A's entitlement verifies at A", BASE, orgTrust(), accepted(BASE, "active", false)),
    c("one person in two organizations: B's entitlement verifies at B", ORG_B_DOC, orgTrust({ subject: ORG_B }), accepted(ORG_B_DOC, "active", false)),
    c("one person in two organizations: B's entitlement is refused at A", ORG_B_DOC, orgTrust(), refused("wrong-subject")),
    c("wrong key: K2's kid, signed by a key nobody lists", signed(entitlement(), ROGUE), orgTrust(), refused("bad-signature")),
    c("bad signature: one byte of the signature changed", { ...BASE, sig: `${BASE.sig.slice(0, 10)}${BASE.sig[10] === "A" ? "B" : "A"}${BASE.sig.slice(11)}` }, orgTrust(), refused("bad-signature")),
    c("bad signature: a member changed after signing", { ...BASE, licence: { members: 2500 } }, orgTrust(), refused("bad-signature")),
    c("unknown kid: a kid the key set does not list", entitlement({}, ROGUE), orgTrust(), refused("unknown-key")),
    c("revoked key: signed by K0, which the key set revokes", entitlement({ issuedAt: "2026-10-20T00:00:00Z" }, K0), orgTrust(), refused("key-revoked")),
    c("revoked key: K1 revoked by revision 3, inside its window", byK1, orgTrust({ keySet: "r3" }), refused("key-revoked")),
    c("rotated key: K1, rotated out, issuedAt inside its window", byK1, orgTrust(), accepted(byK1, "active", false)),
    c("rotated key: K1 after its window, issuedAt at its notAfter", k1AtNotAfter, orgTrust({ now: "2026-11-02T00:00:00Z" }), refused("key-not-valid")),
    c("rotated key: K1 before its window", k1BeforeWindow, orgTrust({ now: "2026-09-02T00:00:00Z" }), refused("key-not-valid")),
    c("rotated key: K2 at the first instant of its window", k2AtNotBefore, orgTrust(), accepted(k2AtNotBefore, "active", false)),
    c("rotated key: K2 a millisecond before its window", k2JustBefore, orgTrust(), refused("key-not-valid")),
    c("small-order key: a listed key of order 4, refused before the signature is read", forged, orgTrust({ keySet: "smallOrder" }), refused("small-order-key")),
    c("unusable key: the listed key names another algorithm", BASE, orgTrust({ keySet: "algMismatch" }), refused("unusable-key")),
    c("wrong issuer: another origin's entitlement", entitlement({ issuer: "https://other.example" }), orgTrust(), refused("wrong-issuer")),
    c("wrong issuer: issuers compare as written, a longer host is another origin", { ...BASE, issuer: "https://platform.example.com" }, orgTrust(), refused("wrong-issuer")),
    c("unknown algorithm: ES256", entitlement({ alg: "ES256" }), orgTrust(), refused("unknown-algorithm")),
    c("grace: at expiresAt", BASE, orgTrust({ now: "2026-11-24T00:00:00Z" }), accepted(BASE, "grace", true)),
    c("grace: a day after expiresAt", BASE, orgTrust({ now: "2026-11-25T00:00:00Z" }), accepted(BASE, "grace", true)),
    c("grace: a millisecond before it ends", BASE, orgTrust({ now: "2026-12-07T23:59:59.999Z" }), accepted(BASE, "grace", true)),
    c("lapsed: 14 days after expiresAt", BASE, orgTrust({ now: "2026-12-08T00:00:00Z" }), refused("lapsed")),
    c("lapsed: long after", BASE, orgTrust({ now: "2027-03-01T00:00:00Z" }), refused("lapsed")),
    c("refresh due: 7 days before expiresAt", BASE, orgTrust({ now: "2026-11-17T00:00:00Z" }), accepted(BASE, "active", true)),
    c("refresh not due: a millisecond earlier", BASE, orgTrust({ now: "2026-11-16T23:59:59.999Z" }), accepted(BASE, "active", false)),
    c("not yet valid: before notBefore", early, orgTrust(), refused("not-yet-valid")),
    c("not yet valid: 60 s before notBefore is within the clock skew", early, orgTrust({ now: "2026-10-31T23:59:00Z" }), accepted(early, "active", false)),
    c("not yet valid: 60 s and a millisecond before notBefore", early, orgTrust({ now: "2026-10-31T23:58:59.999Z" }), refused("not-yet-valid")),
    c("too long: exactly 38 days", day38, orgTrust(), accepted(day38, "active", false)),
    c("too long: 38 days and a millisecond", day38Plus, orgTrust(), refused("too-long-lived")),
    c("precision: a time with three fraction digits", millis, orgTrust(), accepted(millis, "active", false)),
    c("precision: a time with four fraction digits is malformed", entitlement({ notBefore: "2026-10-20T00:00:00.0001Z" }), orgTrust(), refused("malformed")),
    c("malformed: no licence member", (({ licence: _l, ...rest }) => rest)(BASE), orgTrust(), refused("malformed")),
    c("too long: notBefore before issuedAt", notBeforeEarly, orgTrust(), refused("too-long-lived")),
    c("too long: expiresAt at notBefore, an empty life", empty, orgTrust(), refused("too-long-lived")),
    c("replay: a lower revision of the held order", lower, orgTrust({ now: "2026-10-24T12:00:00Z", held: held(BASE) }), refused("stale-revision")),
    c("replay: the held revision with other bytes", otherBytes, orgTrust({ held: held(BASE) }), refused("revision-conflict")),
    c("redelivery: the held entitlement again", BASE, orgTrust({ held: held(BASE) }), accepted(BASE, "active", false, true)),
    c("renewal: a higher revision of the held order", higher, orgTrust({ held: held(BASE) }), accepted(higher, "active", false)),
    c("replay: an older order issued before the held one", olderOrder, orgTrust({ held: held(BASE) }), refused("stale-revision")),
    c("replay: another order issued at the same instant as the held one", sameInstantOrder, orgTrust({ held: held(BASE) }), refused("stale-revision")),
    c("supersede: a newer order issued after the held one", newerOrder, orgTrust({ held: held(BASE) }), accepted(newerOrder, "active", false)),
    c("malformed: a personal entitlement with a licence", entitlement({ ...PERSONAL_LINES, licence: { members: 1 } }), { now: NOW, subject: "personal", estate: ESTATE, keySet: "r2" }, refused("malformed")),
    c("malformed: an organization's entitlement with an estate", entitlement({ estate: ESTATE }), orgTrust(), refused("malformed")),
    c("malformed: an organization with personal-cloud hosting", entitlement({ hosting: { product: "personal-cloud", size: "p-1" } }), orgTrust(), refused("malformed")),
    c("valid: an organization's enterprise-cloud, a dedicated cloud (DEC-0088)", entitlement({ hosting: { product: "enterprise-cloud", size: "e-1" } }), orgTrust(), accepted(entitlement({ hosting: { product: "enterprise-cloud", size: "e-1" } }), "active", false)),
    c("malformed: a personal entitlement with enterprise-cloud hosting", entitlement({ ...PERSONAL_LINES, hosting: { product: "enterprise-cloud", size: "e-1" } }), { now: NOW, subject: "personal", estate: ESTATE, keySet: "r2" }, refused("malformed")),
    c("malformed: an unknown hosting product", entitlement({ hosting: { product: "dedicated-cloud", size: "e-1" } }), orgTrust(), refused("malformed")),
    c("malformed: an amount", { ...BASE, amount: "120" }, orgTrust(), refused("malformed")),
    c("malformed: an agent listed twice", entitlement({ agents: [AGENTS[0], AGENTS[0]] }), orgTrust(), refused("malformed")),
    c("malformed: a time without an offset", entitlement({ expiresAt: "2026-11-24T00:00:00" }), orgTrust(), refused("malformed")),
    c("malformed: no signature", (({ sig: _sig, ...rest }) => rest)(BASE), orgTrust(), refused("malformed")),
    c("malformed: not an object", "entitlement", orgTrust(), refused("malformed")),
    c("context: no trust", BASE, null, refused("context-invalid")),
    c("context: a personal verifier without its estate", PERSONAL, { now: NOW, subject: "personal", keySet: "r2" }, refused("context-invalid")),
    c("context: an organization's verifier with an estate", BASE, orgTrust({ estate: ESTATE }), refused("context-invalid")),
    c("context: a subject that is not a context id", BASE, orgTrust({ subject: "person:p-1" }), refused("context-invalid")),
    c("context: a key set that is not one", BASE, orgTrust({ keySet: "rootAmongKeys" }), refused("context-invalid")),
    c("context: a key set with no key valid at its issuedAt", BASE, orgTrust({ keySet: "noKeyAtIssue" }), refused("context-invalid")),
    c("context: a key set signed under an algorithm the verifier does not know", BASE, orgTrust({ keySet: "es256" }), refused("context-invalid")),
    c("context: a held record without a digest", BASE, orgTrust({ held: { ...held(BASE), digest: "x" } }), refused("context-invalid")),
    c("no clock: an unreadable now", BASE, orgTrust({ now: "2026-10-25 12:00:00" }), refused("no-clock")),
    c("no clock: an unreadable now beside an invalid subject answers no-clock", BASE, orgTrust({ now: "2026-10-25 12:00:00", subject: "person:p-1" }), refused("no-clock"))
  ];
}

// ---- Key-set cases ------------------------------------------------------------------------------------------------

const ROOT_PIN = { issuer: ISSUER, kid: ROOT.kid, x: ROOT.x };
const heldSet = (set: Json) => ({ revision: set.revision, digest: digest(set) });
const appliedSet = (set: Json, unchanged = false) => ({ ok: true, unchanged, digest: digest(set), held: heldSet(set) });

function keySetCases(): Json[] {
  const c = (name: string, set: unknown, trust: Json | null, expected: Json) => ({ name, keySet: set, trust, expected });
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
    c("wrong issuer: a root pinned for another origin", "r2", pin({ root: { ...ROOT_PIN, issuer: "https://other.example" } }), refused("wrong-issuer")),
    c("wrong issuer: a set signed under another root's kid", keySet(2, "2026-10-15T00:00:00Z", [K1_ENTRY, K2_ENTRY], [K0.kid], { kid: OTHER_ROOT.kid }, OTHER_ROOT), pin(), refused("wrong-issuer")),
    c("bad signature: the root's kid, signed by another key", keySet(2, "2026-10-15T00:00:00Z", [K1_ENTRY, K2_ENTRY], [K0.kid], {}, OTHER_ROOT), pin(), refused("bad-signature")),
    c("bad signature: a key added after signing", { ...r2, keys: [K1_ENTRY, K2_ENTRY, { ...keyEntry(ROGUE, "2026-10-15T00:00:00Z", "2027-01-01T00:00:00Z") }] }, pin(), refused("bad-signature")),
    c("unknown algorithm: a listed key under ES256", keySet(2, "2026-10-15T00:00:00Z", [K1_ENTRY, keyEntry(K2, "2026-10-15T00:00:00Z", "2027-01-01T00:00:00Z", "ES256")], [K0.kid]), pin(), refused("unknown-algorithm")),
    c("unknown algorithm: the set under ES256", keySet(2, "2026-10-15T00:00:00Z", [K1_ENTRY, K2_ENTRY], [K0.kid], { alg: "ES256" }), pin(), refused("unknown-algorithm")),
    c("unusable key: a pinned root that is not 32 canonical bytes", "r2", pin({ root: { ...ROOT_PIN, x: `${ROOT.x.slice(0, 42)}B` } }), refused("unusable-key")),
    c("small-order key: a pinned root of order 4", "r2", pin({ root: { ...ROOT_PIN, x: ZERO_X } }), refused("small-order-key")),
    c("small-order key: a listed signing key of order 4", keySet(2, "2026-10-15T00:00:00Z", [K1_ENTRY, { kid: "ent-zero", alg: "EdDSA", x: ZERO_X, notBefore: "2026-10-01T00:00:00Z", notAfter: "2027-01-01T00:00:00Z" }], [K0.kid]), pin(), refused("small-order-key")),
    c("malformed: a kid listed twice", keySet(2, "2026-10-15T00:00:00Z", [K1_ENTRY, { ...K2_ENTRY, kid: K1.kid }], [K0.kid]), pin(), refused("malformed")),
    c("malformed: the root's kid among the keys", keySet(2, "2026-10-15T00:00:00Z", [K1_ENTRY, { ...K2_ENTRY, kid: ROOT.kid }], [K0.kid]), pin(), refused("malformed")),
    c("malformed: a revoked kid among the keys", keySet(2, "2026-10-15T00:00:00Z", [K1_ENTRY, K2_ENTRY], [K1.kid]), pin(), refused("malformed")),
    c("malformed: a window that ends where it starts", keySet(2, "2026-10-15T00:00:00Z", [K1_ENTRY, { ...K2_ENTRY, notAfter: K2_ENTRY.notBefore }], [K0.kid]), pin(), refused("malformed")),
    c("malformed: no keys", keySet(2, "2026-10-15T00:00:00Z", [], [K0.kid]), pin(), refused("malformed")),
    c("malformed: no key valid at the set's issuedAt", keySet(4, "2027-02-01T00:00:00Z", [K2_ENTRY], [K0.kid, K1.kid]), pin(), refused("malformed")),
    c("malformed: a key window time with four fraction digits", keySet(2, "2026-10-15T00:00:00Z", [K1_ENTRY, { ...K2_ENTRY, notBefore: "2026-10-15T00:00:00.0000Z" }], [K0.kid]), pin(), refused("malformed")),
    c("malformed: an entitlement is not a key set", BASE, pin(), refused("malformed")),
    c("context: no root", "r2", {}, refused("context-invalid")),
    c("context: a held record with revision 0", "r2", pin({ held: { revision: 0, digest: digest(r2) } }), refused("context-invalid")),
    c("context: no trust", "r2", null, refused("context-invalid"))
  ];
}

// ---- Output -------------------------------------------------------------------------------------------------------

/** The vectors as an object. */
export function entitlementVectors(): Json {
  const keys = Object.fromEntries([["root", ROOT], ["otherRoot", OTHER_ROOT], ["k0", K0], ["k1", K1], ["k2", K2], ["rogue", ROGUE]].map(([name, key]) => {
    const { seed, kid, x } = key as TestKey;
    return [name, { seed, kid, x }];
  }));
  return {
    about: "Vectors for entitlement/1 and entitlement-key-set/1 (DEC-0085), written by tools/vectors/entitlement.ts, never by hand. keys: Ed25519 test keys, each seed the SHA-256 of a published label (anyone can derive them; nothing trusts them); Ed25519 is deterministic, so a port's signer reproduces every sig. root: the issuer's root key a verifier pins. keySets: documents the root signed; handedKeySets: key sets built by hand to reach the entitlement verifier's key checks, never root-signed. keySet cases: verifyEntitlementKeySet(keySet, trust), keySet a document or the name of one in keySets, trust.root the pinned {issuer, kid, x}. verify cases: verifyEntitlement(entitlement, trust), trust.now an RFC 3339 string a port parses strictly (an unparseable one is an unreadable clock), trust.keySet the name of a key set in keySets or handedKeySets, trust.held the record held for the subject. expected is exactly what the reference returns; digest is sha256: of the signed bytes.",
    keys,
    root: ROOT_PIN,
    signingInput: {
      entitlement: { document: BASE, input: statement(BASE).toString("utf8") },
      keySet: { document: KEY_SETS.r2, input: statement(KEY_SETS.r2 as Json).toString("utf8") }
    },
    keySets: KEY_SETS,
    handedKeySets: HANDED,
    keySetCases: keySetCases(),
    verify: verifyCases()
  };
}

/** What `--write` writes: the vector file's exact text. */
export function buildEntitlementVectors(): string {
  return `${JSON.stringify(entitlementVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildEntitlementVectors();
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
