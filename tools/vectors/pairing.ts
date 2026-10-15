/**
 * The generator of the pairing vectors (DEC-0084): `fixtures/vectors/pairing.json`.
 *
 *   tsx tools/vectors/pairing.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/pairing.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/pairing.test.ts` runs the check. The
 * commitments, transcripts, codes and fingerprints are computed below from the decision's text (ceremonies.md), with
 * RFC 8785 from `src/canonical.ts` (which has its own vectors) and SHA-256; every refusal and every verdict is written by
 * hand. Nothing here imports `src/pairing.ts`: the gate then checks that the reference returns what this file expects.
 */
import { createECDH, createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { rfc8785 } from "../../src/canonical.js";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/pairing.json";

const sha = (text: string) => createHash("sha256").update(Buffer.from(text, "utf8")).digest();
/** A P-256 public key, as base64 SEC 1 octets, from a private scalar derived from a label: fixed for every run. */
const p256 = (label: string) => {
  const ecdh = createECDH("prime256v1");
  ecdh.setPrivateKey(sha(`fabric-agent-contract pairing vectors ${label}`));
  return ecdh.getPublicKey().toString("base64");
};
/** 32 bytes from a label, as unpadded base64url: a nonce that is the same on every run. */
const nonce = (label: string) => sha(`nonce ${label}`).toString("base64url");
const key = (id: string, use: "sig" | "kem", alg: string, publicKey: string) => ({ kid: `${id}#${use}`, use, alg, publicKey });
const commitOf = (role: string, keys: unknown, n: string) => `sha256:${sha(rfc8785({ type: "fabric-enroll-commit/1", role, keys, nonce: n })).toString("hex")}`;
/** The comparison code as ceremonies.md defines it: the transcript's SHA-256, its first 5 bytes big-endian, mod 10^6. */
const codeOf = (text: string) => String(sha(text).readUIntBE(0, 5) % 1_000_000).padStart(6, "0");
const transcriptOf = (a: Json, b: Json) => rfc8785({ type: "fabric-enroll-code/1", new: { keys: a.keys, nonce: a.nonce }, trusted: { keys: b.keys, nonce: b.nonce } });
const commitMsg = (role: string, commit: string) => ({ schema: "pairing-message/1", step: "commit", role, commit });
const revealMsg = (role: string, keys: unknown, n: string) => ({ schema: "pairing-message/1", step: "reveal", role, keys, nonce: n });
const fingerprintOf = (digest: string) => {
  const f = sha(rfc8785({ type: "estate-fingerprint/1", digest }));
  return [0, 1, 2, 3, 4].map((i) => String(f.readUIntBE(5 * i, 5) % 100_000).padStart(5, "0")).join(" ");
};

/** The vectors as an object. */
export function pairingVectors(): Json {
  // The trusted machine is the estate record fixtures' m-4c1e (fixtures/positive/estate-record-first.json).
  const trustedKeys = [
    key("m-4c1e", "sig", "es256", "BAlY11RNjwoIwuAd0QrNCoeddZRpr5ueLSdxBla8GxLcqF9603uYlmbl9TlA4ulvzPYY3j7bw2jc5g9cpOER6ZE="),
    key("m-4c1e", "kem", "ecdh-p256", "BD59C6uiK3pDkKuvL3NZabarYa2kIth3/4BntlQ7yIaYxRSQ0rFfFRHAaM98zOVbXziRb7SILbvpEF91YC574J8=")
  ];
  const newKeys = [key("m-7b2d", "sig", "es256", p256("new sig")), key("m-7b2d", "kem", "ecdh-p256", p256("new kem"))];
  // The same machine id after its key was replaced (DEC-0084 item 5b), and an attacker's machine in the middle.
  const replacedKeys = [key("m-7b2d", "sig", "es256", p256("new sig 2")), key("m-7b2d", "kem", "ecdh-p256", p256("new kem 2"))];
  const otherKeys = [key("m-e5f0", "sig", "es256", p256("other sig"))];
  const nNew = nonce("new"), nTrusted = nonce("trusted"), nOther = nonce("other");

  const newSide = { role: "new", keys: newKeys, nonce: nNew };
  const trustedSide = { role: "trusted", keys: trustedKeys, nonce: nTrusted };
  const newCommit = commitOf("new", newKeys, nNew);
  const trustedCommit = commitOf("trusted", trustedKeys, nTrusted);
  const newReveal = revealMsg("new", newKeys, nNew);
  const trustedReveal = revealMsg("trusted", trustedKeys, nTrusted);
  const theTranscript = transcriptOf(newReveal, trustedReveal);
  const theCode = codeOf(theTranscript);

  const refused = (problem: string) => ({ ok: false, problem });
  const committed = (commit: string) => ({ ok: true, commit });

  // A non-canonical serialisation of the same commitment input: JSON.stringify keeps insertion order and the members
  // were inserted out of order, so a port that hashes it gets another commitment.
  const laxText = JSON.stringify({ nonce: nNew, keys: newKeys, role: "new", type: "fabric-enroll-commit/1" });

  const commits: Json[] = [
    { name: "the new machine's commitment", side: newSide, answer: committed(newCommit), input: rfc8785({ type: "fabric-enroll-commit/1", role: "new", keys: newKeys, nonce: nNew }) },
    { name: "the trusted machine's commitment", side: trustedSide, answer: committed(trustedCommit) },
    { name: "the same keys and nonce committed as the other role give another commitment", side: { ...newSide, role: "trusted" }, answer: committed(commitOf("trusted", newKeys, nNew)) },
    { name: "a machine with only a #sig key commits", side: { role: "new", keys: otherKeys, nonce: nOther }, answer: committed(commitOf("new", otherKeys, nOther)) },
    { name: "an Ed25519 #sig key commits like an ES256 one", side: { role: "trusted", keys: [key("m-9a07", "sig", "ed25519", "E5DhHVXK3sLz51FwFvVW6t3f/e6J7K32OScferYvVjc=")], nonce: nTrusted }, answer: committed(commitOf("trusted", [key("m-9a07", "sig", "ed25519", "E5DhHVXK3sLz51FwFvVW6t3f/e6J7K32OScferYvVjc=")], nTrusted)) },
    { name: "lax: the keys listed in another order are another commitment (RFC 8785 sorts members, never array items)", side: { ...newSide, keys: [newKeys[1], newKeys[0]] }, answer: committed(commitOf("new", [newKeys[1], newKeys[0]], nNew)) },
    { name: "a role that is neither new nor trusted", side: { ...newSide, role: "joiner" }, answer: refused("bad-role") },
    { name: "a nonce of 31 bytes", side: { ...newSide, nonce: nNew.slice(0, 42) }, answer: refused("bad-nonce") },
    { name: "a nonce whose last character cannot end 32 bytes", side: { ...newSide, nonce: `${nNew.slice(0, 42)}B` }, answer: refused("bad-nonce") },
    { name: "a padded nonce", side: { ...newSide, nonce: `${nNew}=` }, answer: refused("bad-nonce") },
    { name: "no key", side: { ...newSide, keys: [] }, answer: refused("bad-keys") },
    { name: "a #kem key alone", side: { ...newSide, keys: [newKeys[1]] }, answer: refused("bad-keys") },
    { name: "two #sig keys", side: { ...newSide, keys: [newKeys[0], key("m-7b2d", "sig", "es256", p256("third"))] }, answer: refused("bad-keys") },
    { name: "keys of two machines", side: { ...newSide, keys: [newKeys[0], key("m-other", "kem", "ecdh-p256", p256("new kem"))] }, answer: refused("bad-keys") },
    { name: "one key in both roles", side: { ...newSide, keys: [newKeys[0], key("m-7b2d", "kem", "ecdh-p256", newKeys[0].publicKey)] }, answer: refused("bad-keys") },
    { name: "a #sig key under an ECDH algorithm", side: { ...newSide, keys: [key("m-7b2d", "sig", "ecdh-p256", newKeys[0].publicKey)] }, answer: refused("bad-keys") },
    { name: "a kid that names the other role", side: { ...newSide, keys: [{ ...newKeys[0], kid: "m-7b2d#kem" }] }, answer: refused("bad-keys") },
    { name: "a P-256 key that is not on the curve", side: { ...newSide, keys: [{ ...newKeys[0], publicKey: Buffer.concat([Buffer.from([4]), Buffer.alloc(64, 1)]).toString("base64") }] }, answer: refused("bad-keys") },
    { name: "an Ed25519 key of small order", side: { ...newSide, keys: [key("m-7b2d", "sig", "ed25519", Buffer.alloc(32).toString("base64"))] }, answer: refused("bad-keys") },
    { name: "lax: a key in unpadded base64", side: { ...newSide, keys: [{ ...newKeys[0], publicKey: newKeys[0].publicKey.replace(/=+$/, "") }] }, answer: refused("bad-keys") },
    { name: "a key with a member the record does not list", side: { ...newSide, keys: [{ ...newKeys[0], x: "1" }] }, answer: refused("bad-keys") },
    { name: "not an object", side: [newSide], answer: refused("malformed") }
  ];

  const reveals: Json[] = [
    { name: "the new machine's reveal opens its commitment", commit: commitMsg("new", newCommit), reveal: newReveal, expected: "new", answer: { ok: true, machine: "m-7b2d" } },
    { name: "the trusted machine's reveal opens its commitment", commit: commitMsg("trusted", trustedCommit), reveal: trustedReveal, expected: "trusted", answer: { ok: true, machine: "m-4c1e" } },
    { name: "without an expected role, the reveal is checked against its commitment's", commit: commitMsg("new", newCommit), reveal: newReveal, answer: { ok: true, machine: "m-7b2d" } },
    { name: "a reveal with another nonce than committed", commit: commitMsg("new", newCommit), reveal: revealMsg("new", newKeys, nOther), expected: "new", answer: refused("commit-mismatch") },
    { name: "a reveal with another key than committed (a key swapped after the other's nonce was seen)", commit: commitMsg("new", newCommit), reveal: revealMsg("new", replacedKeys, nNew), expected: "new", answer: refused("commit-mismatch") },
    { name: "a reveal of an attacker's keys and nonce against the new machine's commitment", commit: commitMsg("new", newCommit), reveal: revealMsg("new", otherKeys, nOther), expected: "new", answer: refused("commit-mismatch") },
    { name: "lax: a commitment over non-canonical JSON does not open", commit: commitMsg("new", `sha256:${sha(laxText).toString("hex")}`), reveal: newReveal, expected: "new", answer: refused("commit-mismatch"), laxInput: laxText },
    { name: "lax: a swapped role — the new machine's commitment and reveal presented as the trusted side's", commit: commitMsg("trusted", newCommit), reveal: revealMsg("trusted", newKeys, nNew), expected: "trusted", answer: refused("commit-mismatch") },
    { name: "lax: a reveal in another role than its commitment's", commit: commitMsg("new", newCommit), reveal: revealMsg("trusted", newKeys, nNew), answer: refused("role-mismatch") },
    { name: "lax: a reveal in its commitment's role, but not the role expected of the other side", commit: commitMsg("new", newCommit), reveal: newReveal, expected: "trusted", answer: refused("role-mismatch") },
    { name: "a reveal whose nonce is not 32 bytes", commit: commitMsg("new", newCommit), reveal: revealMsg("new", newKeys, "short"), expected: "new", answer: refused("bad-nonce") },
    { name: "a reveal whose keys are not one machine's", commit: commitMsg("new", newCommit), reveal: revealMsg("new", [newKeys[1]], nNew), expected: "new", answer: refused("bad-keys") },
    { name: "a commit message where a reveal belongs", commit: commitMsg("new", newCommit), reveal: commitMsg("new", newCommit), answer: refused("malformed") },
    { name: "a commit message with an extra member", commit: { ...commitMsg("new", newCommit), keys: newKeys }, reveal: newReveal, answer: refused("malformed") },
    { name: "a commitment in upper-case hex", commit: commitMsg("new", newCommit.toUpperCase().replace("SHA256:", "sha256:")), reveal: newReveal, answer: refused("malformed") },
    { name: "another schema", commit: commitMsg("new", newCommit), reveal: { ...newReveal, schema: "pairing-message/2" }, answer: refused("malformed") }
  ];

  const changed = (name: string, a: Json, b: Json) => ({ name, new: a, trusted: b, answer: { ok: true, code: codeOf(transcriptOf(a, b)) } });
  const codes: Json[] = [
    { name: "the code both screens show", new: newReveal, trusted: trustedReveal, answer: { ok: true, code: theCode }, transcript: theTranscript },
    changed("another nonce of the new machine changes the code", revealMsg("new", newKeys, nonce("new 2")), trustedReveal),
    changed("another nonce of the trusted machine changes the code", newReveal, revealMsg("trusted", trustedKeys, nonce("trusted 2"))),
    changed("another key of the new machine changes the code (an attacker in the middle)", revealMsg("new", otherKeys, nNew), trustedReveal),
    changed("another key of the trusted machine changes the code (an attacker in the middle)", newReveal, revealMsg("trusted", [key("m-e5f0", "sig", "es256", p256("other sig"))], nTrusted)),
    changed("the new machine without its #kem key gives another code: the #kem key is bound too", revealMsg("new", [newKeys[0]], nNew), trustedReveal),
    changed("the replaced keys of the same machine id give another code", revealMsg("new", replacedKeys, nNew), trustedReveal),
    { name: "lax: a port that writes the transcript with the two sides swapped gets another code", new: newReveal, trusted: trustedReveal, answer: { ok: true, code: theCode }, laxCode: codeOf(rfc8785({ type: "fabric-enroll-code/1", new: { keys: trustedKeys, nonce: nTrusted }, trusted: { keys: newKeys, nonce: nNew } })) },
    { name: "lax: the two reveals passed in swapped order are refused, not coded", new: trustedReveal, trusted: newReveal, answer: refused("role-mismatch") },
    { name: "two reveals in the same role", new: newReveal, trusted: revealMsg("new", trustedKeys, nTrusted), answer: refused("role-mismatch") },
    { name: "a reveal in no known role", new: { ...newReveal, role: "joiner" }, trusted: trustedReveal, answer: refused("bad-role") },
    { name: "a machine paired with itself", new: newReveal, trusted: revealMsg("trusted", newKeys, nTrusted), answer: refused("same-machine") },
    { name: "a reveal with a bad nonce", new: revealMsg("new", newKeys, "AAAA"), trusted: trustedReveal, answer: refused("bad-nonce") },
    { name: "a reveal with bad keys", new: newReveal, trusted: revealMsg("trusted", [trustedKeys[1]], nTrusted), answer: refused("bad-keys") },
    { name: "not a reveal", new: commitMsg("new", newCommit), trusted: trustedReveal, answer: refused("malformed") }
  ];

  const digest1 = "sha256:7d1c1f5a3b0e29c4a6f8d2b1e0c9a7f6e5d4c3b2a1908f7e6d5c4b3a29180706";
  const fingerprints: Json[] = [
    { name: "the fingerprint of a revision 1", digest: digest1, answer: { ok: true, fingerprint: fingerprintOf(digest1) }, input: rfc8785({ type: "estate-fingerprint/1", digest: digest1 }) },
    { name: "the fingerprint of the all-zero digest", digest: `sha256:${"0".repeat(64)}`, answer: { ok: true, fingerprint: fingerprintOf(`sha256:${"0".repeat(64)}`) } },
    { name: "one changed digit of the digest changes the fingerprint", digest: `${digest1.slice(0, -1)}7`, answer: { ok: true, fingerprint: fingerprintOf(`${digest1.slice(0, -1)}7`) } },
    { name: "lax: a digest in upper-case hex is refused, never folded", digest: digest1.toUpperCase().replace("SHA256:", "sha256:"), answer: refused("malformed") },
    { name: "a digest without its prefix", digest: digest1.slice(7), answer: refused("malformed") },
    { name: "a digest of 63 hex digits", digest: digest1.slice(0, -1), answer: refused("malformed") },
    { name: "not a string", digest: 7, answer: refused("malformed") }
  ];

  const opened = "2026-10-15T09:00:00Z";
  const at = (seconds: number) => new Date(Date.parse(opened) + seconds * 1000).toISOString();
  const full = [commitMsg("new", newCommit), commitMsg("trusted", trustedCommit), newReveal, trustedReveal];
  const abort = (role: string) => ({ schema: "pairing-message/1", step: "abort", role });
  const burned = (reason: string, index: number) => ({ state: "burned", reason, index });
  const rendezvous: Json[] = [
    { name: "both commitments, then both reveals: complete", openedAt: opened, at: at(120), messages: full, answer: { state: "complete" } },
    { name: "the trusted machine may commit first, and the trusted reveal may come first", openedAt: opened, at: at(120), messages: [full[1], full[0], full[3], full[2]], answer: { state: "complete" } },
    { name: "complete at exactly 600 s", openedAt: opened, at: at(600), messages: full, answer: { state: "complete" } },
    { name: "expired at 601 s, whatever it carried", openedAt: opened, at: at(601), messages: full, answer: burned("expired", -1) },
    { name: "open with nothing yet", openedAt: opened, at: at(1), messages: [], answer: { state: "open" } },
    { name: "open after both commitments", openedAt: opened, at: at(30), messages: full.slice(0, 2), answer: { state: "open" } },
    { name: "open after both commitments and one reveal", openedAt: opened, at: at(30), messages: full.slice(0, 3), answer: { state: "open" } },
    { name: "a clock 60 s before the opening is within the skew", openedAt: opened, at: at(-60), messages: [], answer: { state: "open" } },
    { name: "a clock 61 s before the opening is refused", openedAt: opened, at: at(-61), messages: [], answer: burned("expired", -1) },
    { name: "a reveal before the other side committed burns it", openedAt: opened, at: at(30), messages: [full[0], full[2]], answer: burned("out-of-order", 1) },
    { name: "a second commitment from one role burns it", openedAt: opened, at: at(30), messages: [full[0], commitMsg("new", commitOf("new", otherKeys, nOther))], answer: burned("repeated", 1) },
    { name: "a second reveal from one role burns it", openedAt: opened, at: at(30), messages: [full[0], full[1], full[2], full[2]], answer: burned("repeated", 3) },
    { name: "a reveal that does not open its commitment burns it", openedAt: opened, at: at(30), messages: [full[0], full[1], revealMsg("new", newKeys, nOther)], answer: burned("commit-mismatch", 2) },
    { name: "an abort burns it: the person said the codes differ", openedAt: opened, at: at(30), messages: [...full.slice(0, 3), abort("trusted")], answer: burned("aborted", 3) },
    { name: "an abort as the first message burns it", openedAt: opened, at: at(30), messages: [abort("new")], answer: burned("aborted", 0) },
    { name: "anything after both reveals is refused: one rendezvous, one pairing", openedAt: opened, at: at(30), messages: [...full, commitMsg("new", newCommit)], answer: burned("closed", 4) },
    { name: "an abort after both reveals is refused too", openedAt: opened, at: at(30), messages: [...full, abort("new")], answer: burned("closed", 4) },
    { name: "a message that is not a pairing message burns it", openedAt: opened, at: at(30), messages: [full[0], { type: "hello" }], answer: burned("malformed", 1) },
    { name: "a reveal with bad keys burns it as malformed", openedAt: opened, at: at(30), messages: [full[0], full[1], revealMsg("new", [newKeys[1]], nNew)], answer: burned("malformed", 2) },
    { name: "an abort with an extra member is no abort", openedAt: opened, at: at(30), messages: [{ ...abort("new"), reason: "codes differ" }], answer: burned("malformed", 0) },
    { name: "an opening that is not an RFC 3339 instant", openedAt: "2026-10-15 09:00:00", at: at(30), messages: [], answer: burned("malformed", -1) },
    { name: "an opening on a day that does not exist", openedAt: "2026-02-30T09:00:00Z", at: at(30), messages: [], answer: burned("malformed", -1) },
    { name: "messages that are not a list", openedAt: opened, at: at(30), messages: { 0: full[0] }, answer: burned("malformed", -1) }
  ];

  // The revision that adds the new machine (step 6), and what a node does with its own keys (item 5b).
  const base = { schema: "estate-record/1", estate: "estate-5d0f1a", revision: 2 };
  const joined = { ...base, machines: [{ id: "m-4c1e", deviceKeys: trustedKeys }, { id: "m-7b2d", deviceKeys: newKeys }], revocations: [] };
  const join: Json[] = [
    { name: "the revision lists the new machine with its revealed keys and the trusted machine with its #sig key", record: joined, new: newReveal, trusted: trustedReveal, answer: { ok: true } },
    { name: "the keys may be listed in another order", record: { ...joined, machines: [joined.machines[0], { id: "m-7b2d", deviceKeys: [newKeys[1], newKeys[0]] }] }, new: newReveal, trusted: trustedReveal, answer: { ok: true } },
    { name: "the revision does not list the new machine", record: { ...joined, machines: [joined.machines[0]] }, new: newReveal, trusted: trustedReveal, answer: refused("not-listed") },
    { name: "the revision lists and revokes the new machine", record: { ...joined, revocations: [{ kind: "machine", ref: "m-7b2d", revokedAt: opened }] }, new: newReveal, trusted: trustedReveal, answer: refused("not-listed") },
    { name: "the revision lists the new machine with another key than it revealed", record: { ...joined, machines: [joined.machines[0], { id: "m-7b2d", deviceKeys: replacedKeys }] }, new: newReveal, trusted: trustedReveal, answer: refused("other-keys") },
    { name: "the revision lists the new machine without its #kem key", record: { ...joined, machines: [joined.machines[0], { id: "m-7b2d", deviceKeys: [newKeys[0]] }] }, new: newReveal, trusted: trustedReveal, answer: refused("other-keys") },
    { name: "the revision does not list the trusted machine's revealed #sig key", record: { ...joined, machines: [{ id: "m-4c1e", deviceKeys: [key("m-4c1e", "sig", "es256", p256("other sig"))] }, joined.machines[1]] }, new: newReveal, trusted: trustedReveal, answer: refused("trusted-not-listed") },
    { name: "the trusted machine is not in the revision", record: { ...joined, machines: [joined.machines[1]] }, new: newReveal, trusted: trustedReveal, answer: refused("trusted-not-listed") },
    { name: "the reveals swapped", record: joined, new: trustedReveal, trusted: newReveal, answer: refused("malformed") },
    { name: "no record", record: null, new: newReveal, trusted: trustedReveal, answer: refused("malformed") }
  ];
  const replaced = { ...base, revision: 3, machines: [{ id: "m-4c1e", deviceKeys: trustedKeys }, { id: "m-7b2d", deviceKeys: replacedKeys }], revocations: [] };
  const sigRef = (k: Json) => `${k.kid}@sha256:${createHash("sha256").update(Buffer.from(k.publicKey, "base64")).digest("hex")}`;
  const ownKeys: Json[] = [
    { name: "the node holds every listed key: apply", record: joined, machine: "m-7b2d", held: newKeys, answer: { action: "apply", retire: [] } },
    { name: "the node re-paired and holds old and new keys: apply, and destroy the old ones", record: replaced, machine: "m-7b2d", held: [...newKeys, ...replacedKeys], answer: { action: "apply", retire: newKeys.map(sigRef) } },
    { name: "the record replaced a key the node does not hold: stop using the old ones", record: replaced, machine: "m-7b2d", held: newKeys, answer: { action: "stop", reason: "keys-replaced" } },
    { name: "only the #kem key was replaced and the node holds the old one: stop", record: { ...replaced, machines: [replaced.machines[0], { id: "m-7b2d", deviceKeys: [newKeys[0], replacedKeys[1]] }] }, machine: "m-7b2d", held: newKeys, answer: { action: "stop", reason: "keys-replaced" } },
    { name: "the record does not list the machine: removed", record: { ...joined, machines: [joined.machines[0]] }, machine: "m-7b2d", held: newKeys, answer: { action: "stop", reason: "removed" } },
    { name: "the record revokes the machine: removed", record: { ...joined, revocations: [{ kind: "machine", ref: "m-7b2d", revokedAt: opened }] }, machine: "m-7b2d", held: newKeys, answer: { action: "stop", reason: "removed" } },
    { name: "a machine listed with no key is never applied", record: { ...joined, machines: [joined.machines[0], { id: "m-7b2d", deviceKeys: [] }] }, machine: "m-7b2d", held: newKeys, answer: { action: "stop", reason: "keys-replaced" } },
    { name: "no machine id", record: joined, machine: 7, held: newKeys, answer: { action: "malformed" } },
    { name: "held keys that are not a list", record: joined, machine: "m-7b2d", held: newKeys[0], answer: { action: "malformed" } }
  ];

  return {
    about: "Vectors for the estate ceremonies' pairing (DEC-0084, docs/specification/ceremonies.md). A side commits to sha256: + hex SHA-256 of the UTF-8 RFC 8785 form of {type: fabric-enroll-commit/1, role, keys, nonce} (commits: pairingCommit), both commit before either reveals, and each checks the other's reveal against its commitment (reveals: checkReveal(commit, reveal, expected?)). The comparison code is the first 5 bytes, big-endian, of SHA-256 over the RFC 8785 transcript {type: fabric-enroll-code/1, new: {keys, nonce}, trusted: {keys, nonce}}, modulo 10^6, as six digits (codes: comparisonCode(new, trusted)). The estate fingerprint is five groups of five digits from SHA-256 over {type: estate-fingerprint/1, digest} of revision 1 (fingerprints: estateFingerprint). rendezvous: rendezvousVerdict(openedAt, messages, at) — one exchange within 600 s, burned by any failure. join: joinListed(record, new, trusted) on the revision that adds the machine. ownKeys: ownKeysDecision(record, machine, held). Every refusal answers {ok: false, problem} and nothing throws. The lax cases are what a careless port gets wrong: non-canonical JSON, a swapped role, folded hex.",
    keys: { new: newKeys, trusted: trustedKeys, replaced: replacedKeys, other: otherKeys },
    commits,
    reveals,
    codes,
    fingerprints,
    rendezvous,
    join,
    ownKeys
  };
}

/** What `--write` writes: the vector file's exact text. */
export function buildPairingVectors(): string {
  return `${JSON.stringify(pairingVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildPairingVectors();
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
