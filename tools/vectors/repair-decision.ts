/**
 * The generator of the repair-decision vectors (DEC-0101, DEC-0102, DEC-0115; `FAC-SEM-129`):
 * `fixtures/vectors/repair-decision.json`, shared by every node that runs an organization's `repair-request/1`
 * (Project Observatory's node) and every port of `repairDecision`.
 *
 *   tsx tools/vectors/repair-decision.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/repair-decision.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/node-summary.test.ts` runs the check.
 * Each request is signed here by an Ed25519 test key whose seed is SHA-256 of a fixed label (Ed25519 is deterministic,
 * so the file is the same on every run), over the settings canonical form of the request without `signature`
 * (`policySigningInput`'s bytes, built here from `src/canonical.ts`). Every expected answer is written below by hand
 * from `docs/specification/node-summary.md#repairs`; nothing here imports `src/node-summary.ts` or `src/device-rules.ts`,
 * so the gate checks that the reference agrees.
 */
import { createHash, createPrivateKey, sign } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { settingsCanonicalJson } from "../../src/canonical.js";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/repair-decision.json";

const sha = (text: string) => createHash("sha256").update(text).digest();
/** DER prefix of an Ed25519 PKCS #8 private key (RFC 8410); the 32-byte seed follows it. */
const PKCS8_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");

/** An Ed25519 test key derived from `label`: anyone can derive it, and nothing trusts it. */
function edKey(label: string) {
  const seed = sha(`fabric-agent-contract repair-decision vectors ${label}`);
  const privateKey = createPrivateKey({ key: Buffer.concat([PKCS8_PREFIX, seed]), format: "der", type: "pkcs8" });
  const publicKey = Buffer.from((privateKey.export({ format: "jwk" }) as { x: string }).x, "base64url").toString("base64");
  return { seed: seed.toString("hex"), privateKey, publicKey };
}

const KEY_ID = "org-7f3a.policy-2026-10";
const policyKey = edKey("policy key");
const otherKey = edKey("another key");

/** The bytes a repair request is signed over: its settings canonical form without `signature`. */
const signingInput = (request: Json): string => {
  const { signature: _signature, ...signed } = request;
  return settingsCanonicalJson(signed);
};

/** The request signed by `key` under `KEY_ID`, its signature in standard base64. */
const signed = (request: Json, key = policyKey): Json => ({
  ...request,
  signature: { alg: "ed25519", keyId: KEY_ID, value: sign(null, Buffer.from(signingInput(request), "utf8"), key.privateKey).toString("base64") }
});

const DIGEST = `sha256:${"b2".repeat(32)}`;
const unsigned: Json = {
  type: "repair-request/1",
  org: { id: "org-7f3a" },
  id: "rep-0001",
  device: { id: "dev-01j9a" },
  package: { agentRef: "urn:fabric:agent:passioncode:observatory-repair", version: "1.2.0", digest: DIGEST },
  task: "Restart the Observatory node service and reinstall the Fabric MCP server entry",
  issuedAt: "2026-10-22T09:00:00Z",
  expiresAt: "2026-10-23T09:00:00Z"
};
const request = signed(unsigned);
const key: Json = { keyId: KEY_ID, alg: "ed25519", publicKey: policyKey.publicKey };
const allowlist = (digest = DIGEST): Json => ({ "repair.packages": { value: [{ agentRef: unsigned.package.agentRef, digest }] } });
const server: Json = { source: "server", revision: 7, expiresAt: "2026-10-30T00:00:00Z", keys: allowlist() };
const AT = "2026-10-22T10:00:00Z";
const base: Json = { request, keys: [key], device: { id: "dev-01j9a", org: "org-7f3a" }, layers: [server], at: AT, notifiedAt: "2026-10-22T09:59:00Z" };

const RUN = { decision: "run" };
const refuse = (reason: string) => ({ decision: "refuse", reason });
/** `base` with `change` applied; a member set to `undefined` is left out of the input. */
const input = (change: Json): Json => Object.fromEntries(Object.entries({ ...base, ...change }).filter(([, value]) => value !== undefined));

function cases(): Json[] {
  const { expiresAt: _never, ...lasting } = server;
  const orgCloud = { id: "dev-01j9a", org: "org-7f3a", role: "org-cloud" };
  const list: Array<[string, Json | null, Json]> = [
    ["a signed, current, allowlisted repair the person was told of runs", input({}), RUN],

    // The order: an answered id first, then the signature, the device, the window, the policy, the allowlist, the person.
    ["an id already answered is refused before anything else, even with no key", input({ answered: true, keys: [] }), refuse("already-answered")],
    ["an id already answered, otherwise runnable", input({ answered: true }), refuse("already-answered")],
    ["the signature before the device", input({ keys: [], device: { id: "dev-other", org: "org-7f3a" } }), refuse("bad-signature")],
    ["the device before the window", input({ device: { id: "dev-other", org: "org-7f3a" }, at: "2026-10-24T10:00:00Z", notifiedAt: "2026-10-24T09:59:00Z" }), refuse("wrong-device")],
    ["the window before the policy", input({ at: "2026-10-23T10:00:00Z", notifiedAt: "2026-10-23T09:59:00Z", layers: [{ ...server, expiresAt: "2026-10-23T00:00:00Z" }] }), refuse("expired")],
    ["the policy before the allowlist", input({ layers: [{ ...server, expiresAt: "2026-10-22T09:00:00Z", keys: {} }] }), refuse("policy-expired")],
    ["the allowlist before the person", input({ layers: [{ ...server, keys: {} }], notifiedAt: undefined }), refuse("not-allowlisted")],

    // The signature.
    ["a changed task breaks the signature", input({ request: { ...request, task: "something else" } }), refuse("bad-signature")],
    ["no key in the current set", input({ keys: [] }), refuse("bad-signature")],
    ["a key under another keyId", input({ keys: [{ ...key, keyId: "org-7f3a.policy-2026-09" }] }), refuse("bad-signature")],
    ["a key of another algorithm under the same keyId", input({ keys: [{ ...key, alg: "es256" }] }), refuse("bad-signature")],
    ["a key without alg is ed25519", input({ keys: [{ keyId: KEY_ID, publicKey: policyKey.publicKey }] }), RUN],
    ["signed by another key", input({ request: signed(unsigned, otherKey) }), refuse("bad-signature")],
    ["a request with a fraction has no canonical form", input({ request: { ...request, attempt: 1.5 } }), refuse("bad-signature")],
    ["a request with a lone surrogate has no canonical form", input({ request: { ...request, task: "a \ud800 b" } }), refuse("bad-signature")],
    ["no input at all", null, refuse("bad-signature")],

    // The key window, judged at `at` (DEC-0102, DEC-0115), never at the request's issuedAt.
    ["a key whose notAfter passed before at", input({ keys: [{ ...key, notAfter: "2026-10-01T00:00:00Z" }] }), refuse("bad-signature")],
    ["a key whose notBefore is after at", input({ keys: [{ ...key, notBefore: "2026-10-23T00:00:00Z" }] }), refuse("bad-signature")],
    ["a key valid at issuedAt but not at at", input({ keys: [{ ...key, notAfter: "2026-10-22T09:30:00Z" }] }), refuse("bad-signature")],
    ["a key valid at at but not at issuedAt", input({ keys: [{ ...key, notBefore: "2026-10-22T09:30:00Z" }] }), RUN],
    ["a key whose notAfter is at itself", input({ keys: [{ ...key, notAfter: AT }] }), RUN],
    ["a key whose notBefore is at itself", input({ keys: [{ ...key, notBefore: AT }] }), RUN],
    ["a key bound that does not read closes the window", input({ keys: [{ ...key, notAfter: "next year" }] }), refuse("bad-signature")],
    ["a clock that does not read", input({ at: "not a time" }), refuse("bad-signature")],

    // The device.
    ["another device", input({ device: { id: "dev-other", org: "org-7f3a" } }), refuse("wrong-device")],
    ["another organization", input({ device: { id: "dev-01j9a", org: "org-other" } }), refuse("wrong-device")],

    // The request's own window: issuedAt <= at < expiresAt, at most 7 days.
    ["at the request's issuedAt", input({ at: "2026-10-22T09:00:00Z", notifiedAt: "2026-10-22T09:00:00Z" }), RUN],
    ["before the request's issuedAt", input({ at: "2026-10-22T08:59:59Z", notifiedAt: "2026-10-22T08:59:00Z" }), refuse("expired")],
    ["at the request's expiresAt", input({ at: "2026-10-23T09:00:00Z", notifiedAt: "2026-10-23T08:59:00Z" }), refuse("expired")],
    ["a window of exactly 7 days", input({ request: signed({ ...unsigned, expiresAt: "2026-10-29T09:00:00Z" }) }), RUN],
    ["a window a second longer than 7 days", input({ request: signed({ ...unsigned, expiresAt: "2026-10-29T09:00:01Z" }) }), refuse("expired")],

    // The policy: remote execution stops with it (FAC-SEM-068).
    ["a policy that expired", input({ layers: [{ ...server, expiresAt: "2026-10-22T09:00:00Z" }] }), refuse("policy-expired")],
    ["a policy that expires at at itself", input({ layers: [{ ...server, expiresAt: AT }] }), RUN],
    ["a policy with no expiresAt does not expire", input({ layers: [lasting] }), RUN],

    // The allowlist, read from the signed layers only.
    ["no policy layers", input({ layers: [] }), refuse("not-allowlisted")],
    ["no repair.packages", input({ layers: [{ ...server, keys: {} }] }), refuse("not-allowlisted")],
    ["the same agent at another digest", input({ layers: [{ ...server, keys: allowlist(`sha256:${"c".repeat(64)}`) }] }), refuse("not-allowlisted")],
    ["an allowlist set only in the person's user layer", input({ layers: [{ ...server, keys: {} }, { source: "user", keys: allowlist() }] }), refuse("not-allowlisted")],
    ["an allowlist set only in an mdm layer", input({ layers: [{ source: "mdm", revision: 1, expiresAt: "2026-10-30T00:00:00Z", keys: allowlist() }] }), RUN],

    // The person.
    ["the person was not told", input({ notifiedAt: undefined }), refuse("person-declined")],
    ["the person was told after it would start", input({ notifiedAt: "2026-10-22T10:00:01Z" }), refuse("person-declined")],
    ["the person was told at at itself", input({ notifiedAt: AT }), RUN],
    ["the person declined", input({ declined: true }), refuse("person-declined")],

    // The org-cloud exception (DEC-0102): such a machine binds no person; the signed request is its notice.
    ["an org-cloud machine runs without a notice", input({ notifiedAt: undefined, device: orgCloud }), RUN],
    ["an org-cloud machine runs even with declined set", input({ notifiedAt: undefined, declined: true, device: orgCloud }), RUN],
    ["an org-cloud machine still needs the allowlist", input({ notifiedAt: undefined, device: orgCloud, layers: [{ ...server, keys: {} }] }), refuse("not-allowlisted")],
    ["an org-cloud machine still needs the signature", input({ notifiedAt: undefined, device: orgCloud, keys: [] }), refuse("bad-signature")],
    ["another role is a person's machine", input({ notifiedAt: undefined, device: { ...orgCloud, role: "person" } }), refuse("person-declined")]
  ];
  return list.map(([name, value, expect]) => ({ name, input: value, expect }));
}

export function repairDecisionVectors(): Json {
  return {
    about:
      "Vectors for repairDecision (FAC-SEM-129, docs/specification/node-summary.md#repairs; DEC-0101, DEC-0102, DEC-0115), written by tools/vectors/repair-decision.ts, never by hand. Each case is repairDecision(input) and its expected answer {decision, reason?}; absent values are absent members. Every request is signed with Ed25519 (its value standard base64) over the settings canonical form of the request without signature (policySigningInput), by the test key whose 32-byte seed is keys.policy.seed (SHA-256 of a fixed label); keys.other signs the request another key made. The order is already-answered, bad-signature, wrong-device, expired, policy-expired, not-allowlisted, person-declined; a key's window is judged at at (an absent bound open, one that does not read closing it); a request with no canonical form (a fraction, a lone surrogate) is refused as bad-signature; a machine with role org-cloud skips only the person step. Every case holds in every time zone.",
    keys: {
      policy: { keyId: KEY_ID, alg: "ed25519", seed: policyKey.seed, publicKey: policyKey.publicKey },
      other: { seed: otherKey.seed, publicKey: otherKey.publicKey }
    },
    signingInput: signingInput(request),
    cases: cases()
  };
}

/** What `--write` writes: the vector file's exact text. */
export function buildRepairDecisionVectors(): string {
  return `${JSON.stringify(repairDecisionVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildRepairDecisionVectors();
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
