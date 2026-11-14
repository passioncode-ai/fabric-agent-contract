/**
 * The generator of the instance-statement vectors (DEC-0170): `fixtures/vectors/org-instance.json`, shared by the
 * organization server that issues `org-instance/1`, the platform (`instance_put`, PLAT-146) and an instance's product.
 *
 *   tsx tools/vectors/org-instance.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/org-instance.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand. Each test key's 32-byte seed is the SHA-256
 * of a published label and Ed25519 is deterministic, so a port's signer reproduces every `sig`; anyone can derive the
 * keys, and nothing trusts them. The expected outcome of every case is written here by hand from DEC-0170's IS-2;
 * nothing here imports `src/org-instance.ts`, so the gate checks that the reference returns what this file expects.
 */
import { createHash, createPrivateKey, sign as nodeSign } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { rfc8785 } from "../../src/canonical.js";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/org-instance.json";

const LABEL = "fabric-agent-contract/vectors/org-instance/";
const PKCS8_ED25519 = Buffer.from("302e020100300506032b657004220420", "hex");
const sha256 = (data: string | Buffer) => createHash("sha256").update(data).digest();

interface TestKey { seed: string; kid: string; x: string; sign: (bytes: Buffer) => string }

function testKey(label: string, kid: string): TestKey {
  const seed = sha256(`${LABEL}${label}`);
  const key = createPrivateKey({ key: Buffer.concat([PKCS8_ED25519, seed]), format: "der", type: "pkcs8" });
  const x = (key.export({ format: "jwk" }) as { x: string }).x;
  return { seed: seed.toString("hex"), kid, x, sign: (bytes) => nodeSign(null, bytes, key).toString("base64url") };
}

/** Organization A's membership root: it signs the organization's key sets only (OM-3). */
const ROOT = testKey("root-org-a", "root-org-a-1");
/** The signing key rotated out. */
const K1 = testKey("signing-2026-09", "ins-2026-09");
/** The signing key in use. */
const K2 = testKey("signing-2026-10", "ins-2026-10");
/** A signing key revoked before the vectors begin. */
const K0 = testKey("signing-2026-08", "ins-2026-08");
/** A key nobody lists. */
const ROGUE = testKey("rogue", "ins-rogue");
/** The all-zero Ed25519 encoding, of order 4 (DEC-0045). */
const ZERO_X = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

/** The owner's signing passkey the set certifies (DEC-0129); an instance statement never uses it. */
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
const statement = (doc: Json) => {
  const { sig: _sig, ...fields } = doc;
  return Buffer.from(rfc8785(fields), "utf8");
};
const digest = (doc: Json) => `sha256:${sha256(statement(doc)).toString("hex")}`;
const signed = (doc: Json, key: TestKey) => ({ ...doc, sig: key.sign(statement(doc)) });

const keyEntry = (key: TestKey, notBefore: string, notAfter: string, alg = "EdDSA") => ({ kid: key.kid, alg, x: key.x, notBefore, notAfter });
const K1_ENTRY = keyEntry(K1, "2026-09-01T00:00:00Z", "2026-11-01T00:00:00Z");
const K2_ENTRY = keyEntry(K2, "2026-10-15T00:00:00Z", "2027-01-01T00:00:00Z");

const KEY_SET = signed({ type: "org-key-set/1", issuer: ISSUER, org: ORG_A, revision: 2, issuedAt: "2026-10-15T00:00:00Z", keys: [K1_ENTRY, K2_ENTRY], revoked: [K0.kid], administrators: [ADMIN_CREDENTIAL], alg: "EdDSA", kid: ROOT.kid }, ROOT);
/** Key sets a reader is handed as applied, built by hand to reach the statement verifier's key checks (never root-signed). */
const HANDED: Record<string, Json> = {
  algMismatch: { ...KEY_SET, keys: [K1_ENTRY, { ...K2_ENTRY, alg: "ES256" }] },
  smallOrder: { ...KEY_SET, keys: [K1_ENTRY, K2_ENTRY, { kid: "ins-zero", alg: "EdDSA", x: ZERO_X, notBefore: "2026-10-01T00:00:00Z", notAfter: "2027-01-01T00:00:00Z" }] },
  otherOrg: { ...KEY_SET, org: "org:org-b" }
};
const SETS: Record<string, Json> = { r2: KEY_SET, ...HANDED };

function instance(change: Json = {}, key: TestKey = K2): Json {
  return signed({
    type: "org-instance/1",
    issuer: ISSUER,
    org: ORG_A,
    instanceId: "inst-7f3a",
    product: "notes",
    origin: "https://notes.org-a.example",
    placement: "org-cloud",
    status: "active",
    revision: 3,
    issuedAt: "2026-10-20T00:00:00Z",
    notBefore: "2026-10-20T00:00:00Z",
    expiresAt: "2026-10-27T00:00:00Z",
    alg: "EdDSA",
    kid: key.kid,
    ...change
  }, key);
}

const BASE = instance();
const NOW = "2026-10-22T12:00:00Z";
const held = (doc: Json) => ({ revision: doc.revision, digest: digest(doc) });
const accepted = (doc: Json, refreshDue = false, unchanged = false) => ({
  ok: true, status: doc.status, product: doc.product, origin: doc.origin, placement: doc.placement, refreshDue, unchanged, digest: digest(doc), held: held(doc)
});
const refused = (problem: string) => ({ ok: false, problem });
const trust = (change: Json = {}) => ({ now: NOW, org: ORG_A, instanceId: "inst-7f3a", keySet: "r2", ...change });

function verifyCases(): Json[] {
  const c = (name: string, doc: unknown, context: Json | null, expected: Json) => ({ name, instance: doc, trust: context, expected });
  const retired = instance({ status: "retired", revision: 4, issuedAt: "2026-10-21T00:00:00Z", notBefore: "2026-10-21T00:00:00Z", expiresAt: "2026-10-28T00:00:00Z" });
  const machine = instance({ placement: "machine", origin: "https://notes.member.example" });
  const service = instance({ placement: "service" });
  const lower = instance({ revision: 2 });
  const otherBytes = instance({ product: "notes-pro" });
  const day7 = instance({ expiresAt: "2026-10-27T00:00:00Z" });
  const day7Plus = instance({ expiresAt: "2026-10-27T00:00:00.001Z" });
  const early = instance({ notBefore: "2026-10-25T00:00:00Z" });
  return [
    c("valid: an active instance on the organization's cloud", BASE, trust(), accepted(BASE)),
    c("valid: an instance on a member's machine", machine, trust(), accepted(machine)),
    c("valid: an instance on a PassionCode service", service, trust(), accepted(service)),
    c("retired: a retirement at a higher revision verifies and reads retired", retired, trust({ held: held(BASE) }), accepted(retired)),
    c("retired: the active statement after the retirement is stale", BASE, trust({ held: held(retired) }), refused("stale-revision")),
    c("redelivery: the held statement again", BASE, trust({ held: held(BASE) }), accepted(BASE, false, true)),
    c("replay: a lower revision", lower, trust({ held: held(BASE) }), refused("stale-revision")),
    c("replay: the held revision with other bytes", otherBytes, trust({ held: held(BASE) }), refused("revision-conflict")),
    c("wrong org: another organization's reader", BASE, trust({ org: "org:org-b", keySet: "otherOrg" }), refused("wrong-org")),
    c("wrong instance: the path names another instance", BASE, trust({ instanceId: "inst-0000" }), refused("wrong-instance")),
    c("wrong issuer: another origin", instance({ issuer: "https://other.example" }), trust(), refused("wrong-issuer")),
    c("unknown algorithm: ES256", instance({ alg: "ES256" }), trust(), refused("unknown-algorithm")),
    c("unknown kid: a kid the key set does not list", instance({}, ROGUE), trust(), refused("unknown-key")),
    c("revoked key: signed by a revoked kid", instance({}, K0), trust(), refused("key-revoked")),
    c("unusable key: the listed key names another algorithm", BASE, trust({ keySet: "algMismatch" }), refused("unusable-key")),
    c("small-order key: a listed key of order 4", { ...instance({ kid: "ins-zero" }), sig: `${"A".repeat(85)}A` }, trust({ keySet: "smallOrder" }), refused("small-order-key")),
    c("key not valid: K1 after its window", instance({ issuedAt: "2026-11-01T00:00:00Z", notBefore: "2026-11-01T00:00:00Z", expiresAt: "2026-11-02T00:00:00Z" }, K1), trust({ now: "2026-11-01T12:00:00Z" }), refused("key-not-valid")),
    c("bad signature: K2's kid, signed by a key nobody lists", signed(instance(), ROGUE), trust(), refused("bad-signature")),
    c("bad signature: a member changed after signing", { ...BASE, origin: "https://evil.example" }, trust(), refused("bad-signature")),
    c("too long: exactly 7 days", day7, trust(), accepted(day7)),
    c("too long: 7 days and a millisecond", day7Plus, trust(), refused("too-long-lived")),
    c("too long: notBefore before issuedAt", instance({ notBefore: "2026-10-19T23:59:59Z" }), trust(), refused("too-long-lived")),
    c("not yet valid: before notBefore", early, trust(), refused("not-yet-valid")),
    c("not yet valid: 60 s before notBefore is within the clock skew", early, trust({ now: "2026-10-24T23:59:00Z" }), accepted(early)),
    c("expired: at expiresAt, no grace", BASE, trust({ now: "2026-10-27T00:00:00Z" }), refused("expired")),
    c("refresh due: a day before expiresAt", BASE, trust({ now: "2026-10-26T00:00:00Z" }), accepted(BASE, true)),
    c("refresh not due: a millisecond earlier", BASE, trust({ now: "2026-10-25T23:59:59.999Z" }), accepted(BASE)),
    c("malformed: an unknown placement", instance({ placement: "laptop" }), trust(), refused("malformed")),
    c("malformed: an unknown status", instance({ status: "paused" }), trust(), refused("malformed")),
    c("malformed: an origin with a path", instance({ origin: "https://notes.org-a.example/app" }), trust(), refused("malformed")),
    c("malformed: a person named in an extra member", { ...BASE, owner: "alice" }, trust(), refused("malformed")),
    c("malformed: no kid", (({ kid: _kid, ...rest }) => rest)(BASE), trust(), refused("malformed")),
    c("malformed: a membership attestation is not a statement", { ...BASE, type: "org-membership/1" }, trust(), refused("malformed")),
    c("context: no trust", BASE, null, refused("context-invalid")),
    c("context: a key set of another organization", BASE, trust({ keySet: "otherOrg" }), refused("context-invalid")),
    c("context: an instance id that is not an opaque id", BASE, trust({ instanceId: "inst 7f3a" }), refused("context-invalid")),
    c("context: a held record without a digest", BASE, trust({ held: { revision: 3, digest: "x" } }), refused("context-invalid")),
    c("no clock: an unreadable now", BASE, trust({ now: "2026-10-22 12:00:00" }), refused("no-clock"))
  ];
}

export function orgInstanceVectors(): Json {
  const keys = Object.fromEntries([["root", ROOT], ["k0", K0], ["k1", K1], ["k2", K2], ["rogue", ROGUE]].map(([name, key]) => {
    const { seed, kid, x } = key as TestKey;
    return [name, { seed, kid, x }];
  }));
  return {
    about: "Vectors for org-instance/1 (DEC-0170), written by tools/vectors/org-instance.ts, never by hand. keys: Ed25519 test keys, each seed the SHA-256 of a published label (anyone can derive them; nothing trusts them); Ed25519 is deterministic, so a port's signer reproduces every sig. keySets: r2 is organization A's org-key-set/1 its root signed (OM-3); the others are built by hand to reach the statement verifier's key checks, never root-signed. verify cases: verifyOrgInstance(instance, trust), trust.now an RFC 3339 string a port parses strictly (an unparseable one is an unreadable clock), trust.keySet the name of a key set in keySets, trust.held the record held for the instance. expected is exactly what the reference returns; digest is sha256: of the signed bytes.",
    keys,
    signingInput: { document: BASE, input: statement(BASE).toString("utf8") },
    keySets: SETS,
    verify: verifyCases()
  };
}

export function buildOrgInstanceVectors(): string {
  return `${JSON.stringify(orgInstanceVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildOrgInstanceVectors();
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
