/**
 * The generator of the door-context vectors (DEC-0185, CT-339): `fixtures/vectors/door-context.json`, shared by every
 * issuing agent that reads which context a key-issuing door proves (the agents database's `org-key-doors` `prove`
 * hook) and by every organization's door that checks the calling issue key (DC-7).
 *
 *   tsx tools/vectors/door-context.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/door-context.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand. Each test key's 32-byte seed is the SHA-256
 * of a published label and Ed25519 is deterministic, so a port's signer reproduces every `sig`; anyone can derive the
 * keys, and nothing trusts them. The expected outcome of every case is written here by hand from DEC-0185's DC-1 to
 * DC-3 and DC-7; nothing here imports `src/door-context.ts`, so the gate checks that the reference returns what this
 * file expects.
 */
import { createHash, createPrivateKey, sign as nodeSign } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { rfc8785 } from "../../src/canonical.js";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/door-context.json";

const LABEL = "fabric-agent-contract/vectors/door-context/";
const PKCS8_ED25519 = Buffer.from("302e020100300506032b657004220420", "hex");
const sha256 = (data: string | Buffer) => createHash("sha256").update(data).digest();

interface TestKey { seed: string; kid: string; x: string; sign: (bytes: Buffer) => string }

function testKey(label: string, kid: string): TestKey {
  const seed = sha256(`${LABEL}${label}`);
  const key = createPrivateKey({ key: Buffer.concat([PKCS8_ED25519, seed]), format: "der", type: "pkcs8" });
  const x = (key.export({ format: "jwk" }) as { x: string }).x;
  return { seed: seed.toString("hex"), kid, x, sign: (bytes) => nodeSign(null, bytes, key).toString("base64url") };
}

const ROOT_A = testKey("root-org-a", "root-org-a-1");
const ROOT_B = testKey("root-org-b", "root-org-b-1");
/** Organization A's signing key in use. */
const A1 = testKey("org-a-signing", "a-ins-1");
/** Organization A's signing key revoked before the vectors begin. */
const A0 = testKey("org-a-revoked", "a-ins-0");
/** Organization B's signing key in use. */
const B1 = testKey("org-b-signing", "b-ins-1");
/** A key nobody lists. */
const ROGUE = testKey("rogue", "a-ins-rogue");
const ADMIN = testKey("administrator-passkey", "admin-passkey");

const statementBytes = (doc: Json) => {
  const { sig: _sig, ...fields } = doc;
  return Buffer.from(rfc8785(fields), "utf8");
};
const signed = (doc: Json, key: TestKey) => ({ ...doc, sig: key.sign(statementBytes(doc)) });

const ORG_A = "org:org-a";
const ORG_B = "org:org-b";
const ISSUER_A = "https://orgs-a.example";
const ISSUER_B = "https://orgs-b.example";
const keyEntry = (key: TestKey) => ({ kid: key.kid, alg: "EdDSA", x: key.x, notBefore: "2026-10-01T00:00:00Z", notAfter: "2027-01-01T00:00:00Z" });
const admin = (rp: string) => ({
  credentialId: sha256(`${LABEL}administrator-passkey/${rp}`).subarray(0, 16).toString("base64url"),
  alg: "EdDSA",
  publicKey: { kty: "OKP", crv: "Ed25519", x: ADMIN.x },
  rpId: `sign.${rp}`,
  origins: [`https://sign.${rp}`]
});
const keySet = (org: string, issuer: string, keys: TestKey[], revoked: TestKey[], root: TestKey, rp: string) =>
  signed({ type: "org-key-set/1", issuer, org, revision: 1, issuedAt: "2026-10-01T00:00:00Z", keys: keys.map(keyEntry), revoked: revoked.map((key) => key.kid), administrators: [admin(rp)], alg: "EdDSA", kid: root.kid }, root);
const KEY_SETS: Record<string, Json> = {
  [ORG_A]: keySet(ORG_A, ISSUER_A, [A1], [A0], ROOT_A, "orgs-a.example"),
  [ORG_B]: keySet(ORG_B, ISSUER_B, [B1], [], ROOT_B, "orgs-b.example")
};

const ORIGIN_A = "https://keys.org-a.example";
const ORIGIN_B = "https://keys.org-b.example";
function instance(change: Json = {}, key: TestKey = A1): Json {
  return signed({
    type: "org-instance/1",
    issuer: ISSUER_A,
    org: ORG_A,
    instanceId: "keys-a",
    product: "key-door",
    origin: ORIGIN_A,
    placement: "org-cloud",
    status: "active",
    revision: 1,
    issuedAt: "2026-11-18T00:00:00Z",
    notBefore: "2026-11-18T00:00:00Z",
    expiresAt: "2026-11-25T00:00:00Z",
    alg: "EdDSA",
    kid: key.kid,
    ...change
  }, key);
}
const A_DOOR = instance();
const B_DOOR = instance({ issuer: ISSUER_B, org: ORG_B, instanceId: "keys-b", origin: ORIGIN_B, kid: B1.kid }, B1);
const NOW = "2026-11-19T12:00:00Z";

/** A machine of the estate with three slots: one personal, one of organization A, one placed in both. */
const RECORD = {
  digest: `sha256:${sha256("door-context/estate-record").toString("hex")}`,
  machines: [{
    id: "mac-1",
    secrets: [
      { agentRef: "observatory", slot: "OPENROUTER_MANAGEMENT_KEY", from: "mac-1" },
      { agentRef: "org-admin", slot: "OPENROUTER_MANAGEMENT_KEY", from: "mac-1", context: ORG_A },
      { agentRef: "shared-door", slot: "ISSUER_KEY", from: "mac-1" },
      { agentRef: "shared-door", slot: "ISSUER_KEY", from: "mac-1", context: ORG_A }
    ]
  }]
};
const ESTATES: Record<string, Json> = {
  verified: { record: RECORD, verdict: { ok: true, digest: RECORD.digest } },
  refused: { record: RECORD, verdict: { ok: false, problem: "expired" } },
  otherDigest: { record: RECORD, verdict: { ok: true, digest: `sha256:${"0".repeat(64)}` } }
};

const remote = (statement?: Json, origin = ORIGIN_A) => (statement === undefined ? { kind: "remote", origin } : { kind: "remote", origin, statement });
const local = (agentRef: string, slot = "OPENROUTER_MANAGEMENT_KEY", machineId = "mac-1") => ({ kind: "local", machineId, agentRef, slot });
const trust = (change: Json = {}) => ({ now: NOW, keySets: [ORG_A, ORG_B], estate: "verified", ...change });
const proven = (context: string, source: string) => ({ ok: true, context, source });
const refusal = (refusal: string, more: Json = {}) => ({ ok: false, refusal, ...more });

function readCases(): Json[] {
  const c = (name: string, door: unknown, asked: unknown, context: Json, expected: Json) => ({ name, door, asked, trust: context, expected });
  return [
    c("remote: a door of the same organization", remote(A_DOOR), ORG_A, trust(), proven(ORG_A, "org-instance")),
    c("remote: a door of another organization", remote(B_DOOR, ORIGIN_B), ORG_A, trust(), refusal("door-organization-mismatch", { context: ORG_B })),
    c("remote: an organization's door asked for the personal context", remote(A_DOOR), "personal", trust(), refusal("door-organization-mismatch", { context: ORG_A })),
    c("remote: no statement handed over", remote(), ORG_A, trust(), refusal("door-claim-absent")),
    c("remote: a forged statement (the listed kid, a key nobody lists)", remote(signed(instance(), ROGUE)), ORG_A, trust(), refusal("door-claim-invalid", { detail: "bad-signature" })),
    c("remote: a member changed after signing", remote({ ...A_DOOR, product: "other" }), ORG_A, trust(), refusal("door-claim-invalid", { detail: "bad-signature" })),
    c("remote: signed by a revoked key", remote(instance({}, A0)), ORG_A, trust(), refusal("door-claim-invalid", { detail: "key-revoked" })),
    c("remote: an expired statement", remote(A_DOOR), ORG_A, trust({ now: "2026-11-25T00:00:00Z" }), refusal("door-claim-invalid", { detail: "expired" })),
    c("remote: a retired instance", remote(instance({ status: "retired", revision: 2 })), ORG_A, trust(), refusal("door-claim-invalid", { detail: "retired" })),
    c("remote: a statement for another origin than the one called", remote(A_DOOR, "https://keys.elsewhere.example"), ORG_A, trust(), refusal("door-claim-invalid", { detail: "wrong-origin" })),
    c("remote: no key set applied for the statement's organization", remote(B_DOOR, ORIGIN_B), ORG_A, trust({ keySets: [ORG_A] }), refusal("door-claim-invalid", { detail: "no-key-set" })),
    c("remote: a statement with no organization", remote("not a statement" as unknown as Json), ORG_A, trust(), refusal("door-claim-invalid", { detail: "malformed" })),
    c("remote: a statement held at a higher revision", { ...remote(A_DOOR), held: { revision: 2, digest: `sha256:${"1".repeat(64)}` } }, ORG_A, trust(), refusal("door-claim-invalid", { detail: "stale-revision" })),
    c("local: an organization's slot", local("org-admin"), ORG_A, trust(), proven(ORG_A, "estate-record")),
    c("local: a personal slot", local("observatory"), "personal", trust(), proven("personal", "estate-record")),
    c("local: a personal slot asked for an organization", local("observatory"), ORG_A, trust(), refusal("door-organization-mismatch", { context: "personal" })),
    c("local: an organization's slot asked for the personal context", local("org-admin"), "personal", trust(), refusal("door-organization-mismatch", { context: ORG_A })),
    c("local: an organization's slot asked for another organization", local("org-admin"), ORG_B, trust(), refusal("door-organization-mismatch", { context: ORG_A })),
    c("local: a slot placed in two contexts, read for the personal one", local("shared-door", "ISSUER_KEY"), "personal", trust(), proven("personal", "estate-record")),
    c("local: a slot placed in two contexts, read for the organization", local("shared-door", "ISSUER_KEY"), ORG_A, trust(), proven(ORG_A, "estate-record")),
    c("local: a slot no placement names", local("org-admin", "OTHER_KEY"), ORG_A, trust(), refusal("door-claim-absent")),
    c("local: a machine the record does not hold", local("org-admin", "OPENROUTER_MANAGEMENT_KEY", "mac-2"), ORG_A, trust(), refusal("door-claim-absent")),
    c("local: no estate record", local("org-admin"), ORG_A, trust({ estate: null }), refusal("door-claim-absent")),
    c("local: a record its verifier refused", local("org-admin"), ORG_A, trust({ estate: "refused" }), refusal("door-claim-invalid", { detail: "record-expired" })),
    c("local: a verdict over another record", local("org-admin"), ORG_A, trust({ estate: "otherDigest" }), refusal("door-claim-invalid", { detail: "record-unverified" })),
    c("input: a context written in another case", remote(A_DOOR), "Personal", trust(), refusal("context-invalid")),
    c("input: an organization context with no id", remote(A_DOOR), "org:", trust(), refusal("context-invalid")),
    c("input: a door of no known kind", { kind: "port", port: 8080 }, ORG_A, trust(), refusal("context-invalid")),
    c("input: no door", null, ORG_A, trust(), refusal("context-invalid")),
    c("input: an unreadable clock", remote(A_DOOR), ORG_A, trust({ now: "2026-11-19 12:00:00" }), refusal("context-invalid"))
  ];
}

function issueCases(): Json[] {
  const c = (name: string, doorOwn: unknown, keyContext: unknown, expected: Json) => ({ name, doorOwn, keyContext, expected });
  return [
    c("an issue key of the door's own organization", ORG_A, ORG_A, { ok: true }),
    c("an issue key of another organization", ORG_A, ORG_B, refusal("issuer-organization-mismatch")),
    c("an issue key of the personal context", ORG_A, "personal", refusal("issuer-organization-mismatch")),
    c("an issue key bound to no context (issued before DEC-0185)", ORG_A, null, refusal("issuer-organization-mismatch")),
    c("a door whose own context is personal checks nothing here", "personal", "personal", refusal("context-invalid"))
  ];
}

export function doorContextVectors(): Json {
  const keys = Object.fromEntries([["rootA", ROOT_A], ["rootB", ROOT_B], ["a1", A1], ["a0", A0], ["b1", B1], ["rogue", ROGUE]].map(([name, key]) => {
    const { seed, kid, x } = key as TestKey;
    return [name, { seed, kid, x }];
  }));
  return {
    about: "Vectors for the context a key-issuing door proves (DEC-0185), written by tools/vectors/door-context.ts, never by hand. keys: Ed25519 test keys, each seed the SHA-256 of a published label (anyone can derive them; nothing trusts them). keySets: the org-key-set/1 each organization's root signed, keyed by context; read cases name the ones the caller applied (trust.keySets). estates: the estate record a caller holds with the verdict verifyEstateRecord gave it (the record here is cut to what the reading looks at: its digest and its machines' secret placements); trust.estate names one, or null for none. read cases: doorContext(door, asked, trust), trust.now an RFC 3339 string a port parses strictly. issue cases: issueKeyAdmitted(doorOwn, keyContext), null a key bound to no context. expected is exactly what the reference returns.",
    keys,
    keySets: KEY_SETS,
    estates: ESTATES,
    read: readCases(),
    issue: issueCases()
  };
}

export function buildDoorContextVectors(): string {
  return `${JSON.stringify(doorContextVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildDoorContextVectors();
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
