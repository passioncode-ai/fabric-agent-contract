import { type JsonObject, isObject } from "./findings.js";
import { HEARTBEAT_MAX_INTERVAL_SECONDS, HEARTBEAT_STALE_SECONDS } from "./revocation-delta.js";
import { strictTime } from "./rfc3339.js";

// #region hub-move — docs: docs/specification/ceremonies.md#move-the-hub
/**
 * DEC-0107 (CT-89): what a machine and the person's network view read to keep an estate recoverable. `hubSilence` says
 * when the hub has broken its own daily heartbeat, so the person moves it before calls between machines stop at 72
 * hours; `recoveryReady` says whether a lost passkey would lose the estate; `hubMove` names what a revision did to the
 * hub keys, so the ceremony shows a move and whether the old key was revoked. Every function answers and never throws.
 */

const isString = (value: unknown): value is string => typeof value === "string";
const list = (value: unknown): JsonObject[] => (Array.isArray(value) ? value.filter(isObject) : []);

/** When a machine alerts the person: the hub let more than its daily interval pass (`HEARTBEAT_MAX_INTERVAL_SECONDS`). */
export const HUB_SILENT_SECONDS = HEARTBEAT_MAX_INTERVAL_SECONDS;

export type HubSilence =
  | { answer: "speaking"; sinceSeconds: number }
  | { answer: "silent"; sinceSeconds: number }
  | { answer: "stale"; sinceSeconds: number }
  | { answer: "unknown"; reason: "no-clock" | "no-heartbeat" };

/**
 * How long the hub has been silent, from the `at` of the heartbeat a machine holds (DEC-0107): `speaking` up to 24 hours
 * (24 hours exactly included), `silent` past it and up to 72 hours (the person is told to move the hub), `stale` past 72
 * hours (calls from other machines are refused, `deltaFreshness`). `sinceSeconds` is whole seconds, floored, never below
 * zero; a heartbeat ahead of the clock reads as just signed. `unknown` when the clock does not read or no heartbeat is held.
 */
export function hubSilence(heartbeatAt: unknown, at: unknown): HubSilence {
  const now = isString(at) ? strictTime(at) : Number.NaN;
  if (!Number.isFinite(now)) return { answer: "unknown", reason: "no-clock" };
  const signed = isString(heartbeatAt) ? strictTime(heartbeatAt) : Number.NaN;
  if (!Number.isFinite(signed)) return { answer: "unknown", reason: "no-heartbeat" };
  const age = now - signed;
  const sinceSeconds = Math.max(0, Math.floor(age / 1000));
  if (age <= HUB_SILENT_SECONDS * 1000) return { answer: "speaking", sinceSeconds };
  if (age <= HEARTBEAT_STALE_SECONDS * 1000) return { answer: "silent", sinceSeconds };
  return { answer: "stale", sinceSeconds };
}

/** Revocations of one kind in a record, by `ref`. */
const revoked = (record: JsonObject, kind: string): Set<unknown> => new Set(list(record.revocations).filter((entry) => entry.kind === kind).map((entry) => entry.ref));

/**
 * Whether the estate survives a lost passkey (DEC-0107): `ready` when the record lists at least two passkeys, by
 * distinct `credentialId`, that it does not revoke. `authorities` is that count; a record that is no object counts none.
 */
export function recoveryReady(record: unknown): { ready: boolean; authorities: number } {
  if (!isObject(record)) return { ready: false, authorities: 0 };
  const gone = revoked(record, "authority");
  const ids = new Set(list(record.authorities).map((authority) => authority.credentialId).filter((id) => isString(id) && !gone.has(id)));
  return { ready: ids.size >= 2, authorities: ids.size };
}

/** One machine's certified hub key, by machine id and kid. */
export interface HubHolder { machine: string; kid: string }

const holders = (record: JsonObject): HubHolder[] =>
  list(record.machines).flatMap((machine) => (isString(machine.id) && isObject(machine.hubKey) && isString(machine.hubKey.kid) ? [{ machine: machine.id, kid: machine.hubKey.kid }] : []));

/**
 * What a revision did to the hub keys (DEC-0107): `added`, the keys `next` certifies that `parent` did not (by machine
 * and kid); `removed`, those `parent` certified that `next` does not, each with `revoked`, whether `next` lists it as a
 * `hub-key` revocation. `moved` when a key was added and one removed. A side that is no object reads as no hub.
 */
export function hubMove(parent: unknown, next: unknown): { moved: boolean; added: HubHolder[]; removed: Array<HubHolder & { revoked: boolean }> } {
  const before = isObject(parent) ? holders(parent) : [];
  const after = isObject(next) ? holders(next) : [];
  const same = (a: HubHolder) => (b: HubHolder) => a.machine === b.machine && a.kid === b.kid;
  const gone = isObject(next) ? revoked(next, "hub-key") : new Set<unknown>();
  const added = after.filter((holder) => !before.some(same(holder)));
  const removed = before.filter((holder) => !after.some(same(holder))).map((holder) => ({ ...holder, revoked: gone.has(holder.kid) }));
  return { moved: added.length > 0 && removed.length > 0, added, removed };
}
// #endregion hub-move
