import { createHash } from "node:crypto";
import { rfc8785 } from "./canonical.js";
import { deviceKeyFingerprint, deviceKeyRef, validDeviceKey } from "./estate-record-rules.js";
import { type JsonObject, isObject, jsonEqual } from "./findings.js";
import { CLOCK_SKEW_SECONDS, strictTime } from "./rfc3339.js";

// #region pairing — docs: docs/specification/ceremonies.md#add-a-machine
/**
 * The estate ceremonies' pure parts (DEC-0084): the pairing of a new machine with a trusted one — a commit, a reveal and
 * a comparison code over both sides' keys and nonces, the hash commitment of ZRTP's short authentication string
 * (RFC 6189 §4.4.1.1, §7) — the one-time rendezvous that carries it, the estate's fingerprint a person compares,
 * and the checks a node runs on the revision that adds or re-keys it. Every function is total: malformed input answers a
 * refusal, never a throw. The shared vectors are `fixtures/vectors/pairing.json`, written by `tools/vectors/pairing.ts`.
 */

/** The message schema a rendezvous carries. */
export const PAIRING_SCHEMA = "pairing-message/1";
/** The type inside a commitment, so a commitment is no other hash over the same members. */
export const COMMIT_TYPE = "fabric-enroll-commit/1";
/** The type inside the comparison code's transcript: the domain label of DV-04, distinct from a share code's. */
export const CODE_TYPE = "fabric-enroll-code/1";
/** The type inside the estate fingerprint's input. */
export const FINGERPRINT_TYPE = "estate-fingerprint/1";
/** The comparison code's length: an attacker in the middle matches it with probability 10^-6 per rendezvous. */
export const CODE_DIGITS = 6;
/** The estate fingerprint: five groups of five digits, 10^25 values (about 83 bits). */
export const FINGERPRINT_GROUPS = 5;
export const FINGERPRINT_GROUP_DIGITS = 5;
/** A rendezvous lives at most 10 minutes from the moment the trusted machine opened it (DV-04). */
export const RENDEZVOUS_SECONDS = 600;

export type PairingRole = "new" | "trusted";
export const PAIRING_ROLES: readonly PairingRole[] = ["new", "trusted"];

export type PairingProblem = "malformed" | "bad-role" | "bad-nonce" | "bad-keys" | "bad-genesis" | "role-mismatch" | "commit-mismatch" | "same-machine";

/** 32 random bytes as unpadded base64url: 43 characters, the last one carrying 2 bits and 4 zero bits. */
const NONCE = /^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/;
/** `activity-common#/$defs/opaqueId`: the machine id a kid names. */
const MACHINE_ID = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,127}$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const KEY_MEMBERS = ["alg", "kid", "publicKey", "use"];
const ALGORITHMS = new Map<string, readonly string[]>([
  ["sig", ["es256", "ed25519"]],
  ["kem", ["ecdh-p256"]]
]);

const sha256 = (bytes: string) => createHash("sha256").update(Buffer.from(bytes, "utf8")).digest();
/** The first five bytes of a digest as a number: 40 bits, exact in a double, so every port computes the same digits. */
const uint40 = (digest: Buffer, offset: number) => digest.readUIntBE(offset, 5);
const isString = (value: unknown): value is string => typeof value === "string";
/** An object's own member, never an inherited one. */
const own = (value: unknown, key: string): unknown => (isObject(value) && Object.hasOwn(value, key) ? value[key] : undefined);
const isRole = (value: unknown): value is PairingRole => value === "new" || value === "trusted";

/**
 * The machine a key list belongs to, or `undefined` when the list is not one machine's device keys as an estate record
 * lists them (DEC-0053, FAC-SEM-073): one or two keys, each exactly `{kid, use, alg, publicKey}`, exactly one `sig`
 * (ES256 or Ed25519) and at most one `kem` (ECDH over P-256), each kid `<id>#<use>` for one machine id, each key valid for
 * its algorithm, in canonical padded base64, and no key in both roles.
 */
export function machineOfKeys(keys: unknown): string | undefined {
  if (!Array.isArray(keys) || keys.length < 1 || keys.length > 2) return undefined;
  const ids = new Set<string>();
  const uses = new Set<string>();
  const octets = new Set<string>();
  for (const key of keys) {
    if (!isObject(key) || Object.keys(key).sort().join() !== KEY_MEMBERS.join()) return undefined;
    const use = key.use;
    const kid = key.kid;
    if (!isString(use) || !isString(kid) || !isString(key.alg) || !ALGORITHMS.get(use)?.includes(key.alg)) return undefined;
    const id = kid.endsWith(`#${use}`) ? kid.slice(0, -(use.length + 1)) : "";
    if (!MACHINE_ID.test(id) || uses.has(use) || deviceKeyFingerprint(key) === undefined || !validDeviceKey(key) || octets.has(key.publicKey as string)) return undefined;
    ids.add(id);
    uses.add(use);
    octets.add(key.publicKey as string);
  }
  const [id] = [...ids];
  return ids.size === 1 && uses.has("sig") ? id : undefined;
}

/**
 * What one side commits to and reveals: its role, its device keys and its nonce, and for the trusted side the estate's
 * `genesis` — the digest of revision 1 — so the comparison code binds the network too.
 */
export interface PairingSide { role: PairingRole; keys: unknown[]; nonce: string; genesis?: string }

/** A side's members checked in the order a port reports them: the role, the nonce, the keys, the genesis. */
function sideProblem(side: unknown): PairingProblem | undefined {
  if (!isObject(side)) return "malformed";
  const role = own(side, "role");
  if (!isRole(role)) return "bad-role";
  if (!isString(own(side, "nonce")) || !NONCE.test(own(side, "nonce") as string)) return "bad-nonce";
  if (machineOfKeys(own(side, "keys")) === undefined) return "bad-keys";
  // The trusted side names its estate; the new side has none to name yet.
  const genesis = own(side, "genesis");
  if (role === "trusted" ? !isString(genesis) || !SHA256.test(genesis) : Object.hasOwn(side, "genesis")) return "bad-genesis";
  return undefined;
}

/** A side's members a commitment and the transcript cover: `{keys, nonce}`, and `genesis` for the trusted side. */
const covered = (side: JsonObject): JsonObject => (side.role === "trusted" ? { keys: side.keys, nonce: side.nonce, genesis: side.genesis } : { keys: side.keys, nonce: side.nonce });

/** The UTF-8 RFC 8785 text a commitment hashes: `{type: "fabric-enroll-commit/1", role, keys, nonce}`, and `genesis`. */
const commitInput = (side: JsonObject) => rfc8785({ type: COMMIT_TYPE, role: side.role, ...covered(side) });

/**
 * A side's commitment (DEC-0084 step 3): `sha256:` and the hex SHA-256 of the UTF-8 RFC 8785 form of `{type:
 * "fabric-enroll-commit/1", role, keys, nonce}`, with `genesis` beside them for the trusted side (`bad-genesis` when the
 * trusted side names no digest or the new side names one). The role is inside, so a commitment made as one side never
 * opens as the other; the keys are inside, so a side cannot swap its key after it saw the other's nonce.
 */
export function pairingCommit(side: unknown): { ok: true; commit: string } | { ok: false; problem: PairingProblem } {
  const problem = sideProblem(side);
  if (problem) return { ok: false, problem };
  return { ok: true, commit: `sha256:${sha256(commitInput(side as JsonObject)).toString("hex")}` };
}

/** A `pairing-message/1` of one step, or `undefined`: the schema's members with the values this module admits. */
function message(value: unknown, step: "commit" | "reveal"): JsonObject | undefined {
  if (!isObject(value) || own(value, "schema") !== PAIRING_SCHEMA || own(value, "step") !== step) return undefined;
  const members = Object.keys(value).sort().join();
  if (step === "commit") return members === "commit,role,schema,step" && isString(value.commit) && SHA256.test(value.commit) ? value : undefined;
  return members === "keys,nonce,role,schema,step" || members === "genesis,keys,nonce,role,schema,step" ? value : undefined;
}

/**
 * Check the other side's reveal against its commitment (step 3): both are `pairing-message/1` (else `malformed`); the
 * reveal's role is the commitment's and, when given, the role expected of the other side (else `role-mismatch`); the
 * reveal's role, nonce and keys are valid (`bad-role`, `bad-nonce`, `bad-keys`); and the commitment recomputed from the
 * reveal is the one received (else `commit-mismatch`, and the side aborts). Answers the revealing machine's id.
 */
export function checkReveal(commit: unknown, reveal: unknown, expected?: PairingRole): { ok: true; machine: string } | { ok: false; problem: PairingProblem } {
  const c = message(commit, "commit");
  const r = message(reveal, "reveal");
  if (!c || !r) return { ok: false, problem: "malformed" };
  if (r.role !== c.role || (expected !== undefined && r.role !== expected)) return { ok: false, problem: "role-mismatch" };
  const { schema: _schema, step: _step, ...side } = r;
  const made = pairingCommit(side);
  if (!made.ok) return made;
  if (made.commit !== c.commit) return { ok: false, problem: "commit-mismatch" };
  return { ok: true, machine: machineOfKeys(r.keys) as string };
}

/** The UTF-8 RFC 8785 text the comparison code hashes, from two reveals already checked. */
const transcript = (a: JsonObject, b: JsonObject) => rfc8785({ type: CODE_TYPE, new: covered(a), trusted: covered(b) });

/**
 * The comparison code both screens show (step 4): the new machine's reveal and the trusted machine's, each a
 * `pairing-message/1` reveal (else `malformed`) in its own role (else `role-mismatch`, so a call with the two swapped is
 * refused), with valid nonces, keys and genesis, of two different machines (else `same-machine`). The transcript is the
 * UTF-8 RFC 8785 form of `{type: "fabric-enroll-code/1", new: {keys, nonce}, trusted: {keys, nonce, genesis}}`; the code
 * is the first five bytes of its SHA-256, read as a big-endian integer, modulo 10^6, written as six decimal digits with
 * leading zeros. The code binds both keys, both nonces and the estate the trusted machine is in.
 */
export function comparisonCode(newReveal: unknown, trustedReveal: unknown): { ok: true; code: string } | { ok: false; problem: PairingProblem } {
  const a = message(newReveal, "reveal");
  const b = message(trustedReveal, "reveal");
  if (!a || !b) return { ok: false, problem: "malformed" };
  if (a.role !== "new" || b.role !== "trusted") return { ok: false, problem: isRole(a.role) && isRole(b.role) ? "role-mismatch" : "bad-role" };
  const problem = sideProblem(a) ?? sideProblem(b);
  if (problem) return { ok: false, problem };
  if (machineOfKeys(a.keys) === machineOfKeys(b.keys)) return { ok: false, problem: "same-machine" };
  const value = uint40(sha256(transcript(a, b)), 0) % 10 ** CODE_DIGITS;
  return { ok: true, code: String(value).padStart(CODE_DIGITS, "0") };
}

/**
 * The estate's fingerprint (DEC-0084): what a person compares to know two screens show one network. From revision 1's
 * `digest` (`sha256:` and 64 lower-case hex digits; else `malformed`): F = SHA-256 of the UTF-8 RFC 8785 form of
 * `{type: "estate-fingerprint/1", digest}`; group i (0…4) is bytes 5i…5i+4 of F as a big-endian integer modulo 10^5,
 * five digits with leading zeros; the groups are joined by one space. Revision 1 never changes, so neither does the
 * fingerprint. 10^25 values: grinding a revision 1 of another estate to the same fingerprint takes about 2^82 hashes.
 */
export function estateFingerprint(digest: unknown): { ok: true; fingerprint: string } | { ok: false; problem: "malformed" } {
  if (!isString(digest) || !SHA256.test(digest)) return { ok: false, problem: "malformed" };
  const f = sha256(rfc8785({ type: FINGERPRINT_TYPE, digest }));
  const groups = Array.from({ length: FINGERPRINT_GROUPS }, (_, index) => String(uint40(f, 5 * index) % 10 ** FINGERPRINT_GROUP_DIGITS).padStart(FINGERPRINT_GROUP_DIGITS, "0"));
  return { ok: true, fingerprint: groups.join(" ") };
}

/**
 * The comparison code as a port computes it (DEC-0084): only after each reveal opened its own commitment (`checkReveal`
 * with the role expected of it), then `comparisonCode`. A code computed from reveals no one checked against their
 * commitments loses the one-guess bound, since a side could pick its nonce after it saw the other's. Answers the first
 * refusal of the new side's check, then the trusted side's, then the code's.
 */
export function checkedComparisonCode(newCommit: unknown, newReveal: unknown, trustedCommit: unknown, trustedReveal: unknown): { ok: true; code: string } | { ok: false; problem: PairingProblem } {
  const a = checkReveal(newCommit, newReveal, "new");
  if (!a.ok) return a;
  const b = checkReveal(trustedCommit, trustedReveal, "trusted");
  if (!b.ok) return b;
  return comparisonCode(newReveal, trustedReveal);
}

/** Why a rendezvous ended without a pairing. */
export type BurnReason = "malformed" | "expired" | "repeated" | "out-of-order" | "commit-mismatch" | "aborted" | "closed";

export type RendezvousVerdict =
  | { state: "open" }
  | { state: "complete" }
  | { state: "burned"; reason: BurnReason; index: number };

/**
 * A rendezvous after the messages it carried, oldest first, at the time `at` (step 2): the relay's and both sides' one
 * reading of DV-04's one-time link. It burns — carries nothing more, and a new attempt opens a new one with new nonces —
 * on the first of:
 * - `malformed`: a message that is not a `pairing-message/1`, or an unreadable `openedAt` or clock (`index` -1);
 * - `expired`: `at` more than 600 s after `openedAt`, or more than 60 s before it (`index` -1);
 * - `repeated`: a second commit or a second reveal from one role;
 * - `out-of-order`: a reveal before both commitments arrived;
 * - `commit-mismatch`: a reveal that does not open its role's commitment (`checkReveal`);
 * - `aborted`: an `abort`, which either side sends when a check fails or the person says the codes differ — also once
 *   after both reveals, so the relay forwards it and the other side learns the codes differed;
 * - `closed`: any message after both reveals other than that one `abort`.
 * It is `complete` once both reveals opened their commitments — the pairing is done and the rendezvous carries nothing
 * more but one `abort` — and `open` before.
 */
export function rendezvousVerdict(openedAt: unknown, messages: unknown, at: unknown): RendezvousVerdict {
  const opened = strictTime(openedAt);
  const now = at instanceof Date ? at.getTime() : Number.NaN;
  if (!Number.isFinite(opened) || !Number.isFinite(now) || !Array.isArray(messages)) return { state: "burned", reason: "malformed", index: -1 };
  if (now > opened + RENDEZVOUS_SECONDS * 1000 || now < opened - CLOCK_SKEW_SECONDS * 1000) return { state: "burned", reason: "expired", index: -1 };
  const commits = new Map<PairingRole, unknown>();
  const revealed = new Set<PairingRole>();
  for (const [index, item] of messages.entries()) {
    const burn = (reason: BurnReason): RendezvousVerdict => ({ state: "burned", reason, index });
    // An abort burns at any point, after both reveals too (the person said the codes differ); nothing else follows them.
    if (isObject(item) && own(item, "schema") === PAIRING_SCHEMA && own(item, "step") === "abort" && Object.keys(item).sort().join() === "role,schema,step" && isRole(item.role)) return burn("aborted");
    if (revealed.size === 2) return burn("closed");
    const commit = message(item, "commit");
    const reveal = message(item, "reveal");
    const role = (commit ?? reveal)?.role;
    if (!isRole(role)) return burn("malformed");
    if (commit) {
      if (commits.has(role)) return burn("repeated");
      commits.set(role, commit);
      continue;
    }
    if (revealed.has(role)) return burn("repeated");
    if (commits.size < 2) return burn("out-of-order");
    const opened = checkReveal(commits.get(role), reveal, role);
    if (!opened.ok) return burn(opened.problem === "commit-mismatch" ? "commit-mismatch" : "malformed");
    revealed.add(role);
  }
  return revealed.size === 2 ? { state: "complete" } : { state: "open" };
}

/** A machine of a record by id: the first listed, and `undefined` for none or a malformed list. */
const machineOf = (record: JsonObject, id: unknown) => (Array.isArray(record.machines) ? record.machines.find((machine) => isObject(machine) && machine.id === id) : undefined) as JsonObject | undefined;
/** Two key lists hold the same keys, in any order. */
const sameKeys = (a: unknown[], b: unknown[]) => a.length === b.length && a.every((key) => b.some((other) => jsonEqual(key, other)));

/**
 * What the new machine checks before it pins and applies (step 6), after `verifyEstateRecord` accepted the chain from
 * revision 1 to `record`: `genesis`, the digest of the revision 1 it verified, is the one the trusted machine revealed and
 * the comparison code bound (else `other-estate`: a chain of another estate, however well signed); the record lists the
 * new machine with exactly the keys it revealed (else `not-listed` or `other-keys`) and the trusted machine with the
 * `#sig` key it revealed (else `trusted-not-listed`), and revokes neither. Two valid reveals in their roles are needed
 * (else `malformed`). The same check runs when a machine re-pairs under its id to replace its key (DEC-0084 item 5b).
 */
export function joinListed(record: unknown, newReveal: unknown, trustedReveal: unknown, genesis: unknown): { ok: true } | { ok: false; problem: "malformed" | "other-estate" | "not-listed" | "other-keys" | "trusted-not-listed" } {
  const a = message(newReveal, "reveal");
  const b = message(trustedReveal, "reveal");
  if (!isObject(record) || !a || !b || a.role !== "new" || b.role !== "trusted" || sideProblem(a) || sideProblem(b)) return { ok: false, problem: "malformed" };
  if (b.genesis !== genesis) return { ok: false, problem: "other-estate" };
  const newId = machineOfKeys(a.keys) as string;
  const trustedId = machineOfKeys(b.keys) as string;
  const revoked = (id: string) => Array.isArray(record.revocations) && record.revocations.some((entry) => isObject(entry) && entry.kind === "machine" && entry.ref === id);
  const machine = machineOf(record, newId);
  if (!machine || revoked(newId)) return { ok: false, problem: "not-listed" };
  if (!Array.isArray(machine.deviceKeys) || !sameKeys(machine.deviceKeys, a.keys as unknown[])) return { ok: false, problem: "other-keys" };
  const trusted = machineOf(record, trustedId);
  const sig = (b.keys as JsonObject[]).find((key) => key.use === "sig");
  if (!trusted || revoked(trustedId) || !Array.isArray(trusted.deviceKeys) || !trusted.deviceKeys.some((key) => jsonEqual(key, sig))) return { ok: false, problem: "trusted-not-listed" };
  return { ok: true };
}

export type OwnKeysDecision =
  | { action: "apply"; retire: string[] }
  | { action: "stop"; reason: "removed" | "keys-replaced" }
  | { action: "malformed" };

/**
 * What a node does with a verified revision when its own keys are in question (DEC-0084 item 5b). `held` lists the
 * public device keys whose private keys the node holds.
 * - `apply`, when the record lists the node's machine and the node holds every key listed for it; `retire` names, by
 *   `deviceKeyRef`, the held keys the record no longer lists, which the node destroys.
 * - `stop`, `removed`: the record does not list the machine, or revokes it. The node stops using every key it holds.
 * - `stop`, `keys-replaced`: the record lists the machine with a key the node does not hold. The node does not apply the
 *   revision and stops using the keys it holds: another holder of its id carries the new key, or the node lost it.
 * - `malformed`: no record object, no machine id, or `held` is not a list. The node keeps its state.
 */
export function ownKeysDecision(record: unknown, machineId: unknown, held: unknown): OwnKeysDecision {
  if (!isObject(record) || !isString(machineId) || !Array.isArray(held)) return { action: "malformed" };
  const machine = machineOf(record, machineId);
  const revoked = Array.isArray(record.revocations) && record.revocations.some((entry) => isObject(entry) && entry.kind === "machine" && entry.ref === machineId);
  if (!machine || revoked) return { action: "stop", reason: "removed" };
  const listed = Array.isArray(machine.deviceKeys) ? machine.deviceKeys : [];
  if (listed.length === 0 || !listed.every((key) => held.some((mine) => jsonEqual(key, mine)))) return { action: "stop", reason: "keys-replaced" };
  const retire = held.filter((key) => !listed.some((other) => jsonEqual(key, other))).map(deviceKeyRef).filter(isString);
  return { action: "apply", retire };
}
// #endregion pairing
