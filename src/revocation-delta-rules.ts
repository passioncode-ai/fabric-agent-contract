import { type Finding, type JsonObject, isObject } from "./findings.js";
import { DELTA_ALG, DELTA_KINDS, deltaEntryHash, deltaGenesis, deltaTime, freshnessAnswer, unreconciled } from "./revocation-delta.js";

// #region revocation-delta-rules — docs: docs/specification/revocation-delta.md#semantic-rules
/**
 * Document rules of the revocation delta and the heartbeat (DEC-0054) that a schema cannot say. Signatures and the
 * machine's state live in `revocation-delta.ts`; these rules check one document, or one answer, alone.
 *
 * - FAC-SEM-082 (`revocation-delta`, a page `{head, entries}`): every entry is `EdDSA`, carries an admitted kind, is not
 *   dated before its revocation, names one estate, and follows the one before it (the next sequence, `prev` its hash);
 *   a page's `head` is its last entry's head.
 * - FAC-SEM-083 (`heartbeat`): `EdDSA`, a readable `at`, and a head at sequence 0 that is the estate's genesis.
 *   (`delta-freshness`, `{at, applied: {sequence, revision}, heartbeat, broken, answer}`): the answer is the one the
 *   72-hour rule gives (`freshnessAnswer`).
 * - FAC-SEM-084 (`delta-reconciliation`, `{revision, entries}`): a revision issued at or after an entry lists its
 *   revocation.
 */
const hashOf = (entry: JsonObject): string | undefined => {
  try {
    return deltaEntryHash(entry);
  } catch {
    return undefined;
  }
};

function page(value: JsonObject): Finding[] {
  const out: Finding[] = [];
  const add = (instancePath: string, message: string) => out.push({ code: "FAC-SEM-082", instancePath, message });
  const entries = Array.isArray(value.entries) ? (value.entries as unknown[]) : [];
  let previous: JsonObject | undefined;
  entries.forEach((item, index) => {
    const at = `/entries/${index}`;
    if (!isObject(item)) {
      add(at, "an entry is an object");
      return;
    }
    const revocation = isObject(item.revocation) ? item.revocation : {};
    if (item.alg !== DELTA_ALG) add(`${at}/alg`, `an estate key signs with ${DELTA_ALG} until Fabric records D2 (unsupported-alg)`);
    if (!DELTA_KINDS.includes(revocation.kind as string)) add(`${at}/revocation/kind`, "the delta carries machine, device-key, hub-key, publisher-key, package and grant revocations; a passkey is revoked only by a revision (not-revocable)");
    const issued = deltaTime(item.at);
    const revoked = deltaTime(revocation.revokedAt);
    if (Number.isNaN(issued) || Number.isNaN(revoked)) add(Number.isNaN(issued) ? `${at}/at` : `${at}/revocation/revokedAt`, "at and revokedAt are RFC 3339 date-times with an offset, on days that exist");
    else if (revoked > issued) add(`${at}/revocation/revokedAt`, "a revocation is never dated after the entry that carries it");
    if (hashOf(item) === undefined) add(at, "the entry has no RFC 8785 form, so it has no hash");
    if (previous !== undefined) {
      if (item.estate !== previous.estate) add(`${at}/estate`, "one page carries one estate's chain");
      if (item.sequence !== Number(previous.sequence) + 1) add(`${at}/sequence`, `the entry after ${String(previous.sequence)} is ${Number(previous.sequence) + 1}: a page is consecutive`);
      if (item.prev !== hashOf(previous)) add(`${at}/prev`, "prev is the hash of the entry before it (RFC 8785, without sig)");
    } else if (item.sequence === 1 && typeof item.estate === "string" && item.prev !== deltaGenesis(item.estate)) {
      add(`${at}/prev`, "entry 1's prev is the estate's genesis, SHA-256 of {type, estate, sequence: 0}");
    }
    previous = item;
  });
  const head = isObject(value.head) ? value.head : {};
  if (previous !== undefined && (head.sequence !== previous.sequence || head.sha256 !== hashOf(previous))) add("/head", "a page's head is its last entry's sequence and hash");
  return out;
}

function heartbeat(value: JsonObject): Finding[] {
  const out: Finding[] = [];
  const add = (instancePath: string, message: string) => out.push({ code: "FAC-SEM-083", instancePath, message });
  if (value.alg !== DELTA_ALG) add("/alg", `an estate key signs with ${DELTA_ALG} until Fabric records D2 (unsupported-alg)`);
  if (Number.isNaN(deltaTime(value.at))) add("/at", "at is an RFC 3339 date-time with an offset, on a day that exists");
  const head = isObject(value.deltaHead) ? value.deltaHead : {};
  if (head.sequence === 0 && typeof value.estate === "string" && head.sha256 !== deltaGenesis(value.estate)) add("/deltaHead/sha256", "the head before any entry is the estate's genesis, SHA-256 of {type, estate, sequence: 0}");
  return out;
}

function freshness(value: JsonObject): Finding[] {
  const at = deltaTime(value.at);
  if (Number.isNaN(at)) return [{ code: "FAC-SEM-083", instancePath: "/at", message: "the input names the machine's clock as an RFC 3339 date-time with an offset; an unreadable clock decides nothing" }];
  const applied = isObject(value.applied) ? value.applied : {};
  const want = freshnessAnswer({ at, applied: { sequence: applied.sequence, revision: applied.revision }, heartbeat: value.heartbeat, broken: value.broken === true });
  if (value.answer === want.answer) return [];
  return [{ code: "FAC-SEM-083", instancePath: "/answer", message: `the machine is ${want.answer}: ${want.reason}${want.answer === "current" ? "" : "; it refuses what arrives from other machines"}` }];
}

function reconciliation(value: JsonObject): Finding[] {
  const result = unreconciled(value.revision, Array.isArray(value.entries) ? value.entries : []);
  if (result.unreadable) return [{ code: "FAC-SEM-084", instancePath: "", message: "the revision's issuedAt and every entry's at and revocation are readable; an unreadable time is never compared" }];
  return result.missing.map((entry) => ({ code: "FAC-SEM-084", instancePath: `/entries/${entry.index}`, message: `the revision was issued at or after this entry and does not list its ${entry.kind} revocation of ${entry.ref}: a machine refuses it` }));
}

export function revocationDeltaRules(kind: string, value: unknown): Finding[] | undefined {
  if (!isObject(value)) return undefined;
  if (kind === "revocation-delta") return page(value);
  if (kind === "heartbeat") return heartbeat(value);
  if (kind === "delta-freshness") return freshness(value);
  if (kind === "delta-reconciliation") return reconciliation(value);
  return undefined;
}
// #endregion revocation-delta-rules
