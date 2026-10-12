import { type Finding, type JsonObject, isObject } from "./findings.js";
import { strictTime } from "./rfc3339.js";

// #region hub-key-rules — docs: docs/specification/delegation.md#keys-publication-and-rotation
/**
 * DL-14 with DEC-0055 and DEC-0060: a delegation verifier that reads the estate record trusts a token's `kid` only while
 * the revision it reads certifies it. Kept apart from `src/estate-record-rules.ts`, so a callee that vendors the
 * delegation verifier needs no WebAuthn, package or canonical-form code: this module reads a revision the node already
 * verified (`verifyEstateRecord`) and applied, and decides one question.
 */

/** v4 §7, Freshness: an estate revision is valid for at most 30 days (DEC-0055 item 2). */
const MAX_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/** The highest revision this verifier's machine has applied: its number and, when known, its digest. */
export interface AppliedRevision { revision: number; digest?: string }

/**
 * Why a `kid` is not trusted, as `error.data.detail`:
 * - `kid-not-certified` — the token's fault: no machine's `hubKey` of the revision has this `kid` and this public key, or
 *   the revision revokes the hub key or its machine;
 * - `estate-unreadable`, `estate-outside-window`, `estate-rolled-back`, `estate-forked` — the trust source's fault: the
 *   revision cannot be read, its window does not hold the clock, it is lower than the one applied, or it is another
 *   revision with the applied number;
 * - `no-clock` — the verifier's clock is not a time.
 */
export type HubKeyDetail = "kid-not-certified" | "estate-unreadable" | "estate-outside-window" | "estate-rolled-back" | "estate-forked" | "no-clock";
export type HubKeyFault = "token" | "estate" | "clock";
export type HubKeyVerdict =
  | { certified: true; machine: string; revision: number }
  | { certified: false; fault: HubKeyFault; detail: HubKeyDetail };

const isString = (value: unknown): value is string => typeof value === "string";
const isRevision = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 1;
const refused = (fault: HubKeyFault, detail: HubKeyDetail): HubKeyVerdict => ({ certified: false, fault, detail });

/** The clock as milliseconds: a `Date`, or a JWT NumericDate (seconds since the epoch, RFC 7519 §2). NaN otherwise. */
const clock = (at: unknown): number => (at instanceof Date ? at.getTime() : typeof at === "number" && Number.isFinite(at) ? at * 1000 : Number.NaN);

/**
 * Whether `record` certifies the delegation key `kid` with the public key `x` (the published key's `x`, base64url) at
 * `at`, for a verifier whose machine has applied `applied`. In this order, the first that applies answering:
 *
 * 1. `at` is not a `Date` with a time, nor a finite number of seconds → `no-clock`;
 * 2. the record is not an object with a revision (an integer from 1), a string `digest`, `issuedAt` and `validUntil` read
 *    strictly as RFC 3339 with a window more than 0 and at most 30 days, an array `machines`, and `revocations` absent or
 *    an array; or `applied` is given without a revision → `estate-unreadable`;
 * 3. its revision is lower than `applied`'s → `estate-rolled-back`; the same number with another digest than `applied`'s
 *    → `estate-forked`;
 * 4. `at` is before `issuedAt` or after `validUntil` (both instants inside) → `estate-outside-window`;
 * 5. the revision revokes `hub-key <kid>`; no machine's `hubKey.kid` is `kid`, or two are; that machine's `hubKey.x` is
 *    not the string `x`; or the revision revokes `machine <id>` of that machine → `kid-not-certified`.
 *
 * Otherwise the key is certified, for that machine, by that revision. Never throws.
 */
export function hubKeyCertified(record: unknown, kid: unknown, x: unknown, at: Date | number, applied?: AppliedRevision): HubKeyVerdict {
  const now = clock(at);
  if (Number.isNaN(now)) return refused("clock", "no-clock");
  if (!isObject(record) || !isRevision(record.revision) || !isString(record.digest) || !Array.isArray(record.machines)) return refused("estate", "estate-unreadable");
  if (record.revocations !== undefined && !Array.isArray(record.revocations)) return refused("estate", "estate-unreadable");
  const issuedAt = strictTime(record.issuedAt);
  const validUntil = strictTime(record.validUntil);
  // A window that is not a time, not positive or longer than 30 days is no window: NaN would fail every comparison below.
  if (Number.isNaN(issuedAt) || Number.isNaN(validUntil) || validUntil <= issuedAt || validUntil - issuedAt > MAX_WINDOW_MS) return refused("estate", "estate-unreadable");
  if (applied !== undefined) {
    if (!isObject(applied) || !isRevision(applied.revision) || (applied.digest !== undefined && !isString(applied.digest))) return refused("estate", "estate-unreadable");
    // An older revision may still be inside its window and list a key the applied one revokes (a rollback).
    if (record.revision < applied.revision) return refused("estate", "estate-rolled-back");
    if (record.revision === applied.revision && applied.digest !== undefined && record.digest !== applied.digest) return refused("estate", "estate-forked");
  }
  if (now < issuedAt || now > validUntil) return refused("estate", "estate-outside-window");

  const revocations = (record.revocations ?? []) as unknown[];
  const revokes = (kind: string, ref: unknown) => revocations.some((entry) => isObject(entry) && entry.kind === kind && entry.ref === ref);
  if (!isString(kid) || revokes("hub-key", kid)) return refused("token", "kid-not-certified");
  const holders = (record.machines as unknown[]).filter((machine): machine is JsonObject => isObject(machine) && isObject(machine.hubKey) && machine.hubKey.kid === kid);
  // Two machines under one kid break FAC-SEM-073; such a revision certifies neither.
  if (holders.length !== 1) return refused("token", "kid-not-certified");
  const machine = holders[0] as JsonObject;
  // A missing x never equals a missing x: the published key must be the certified one.
  if (!isString(x) || (machine.hubKey as JsonObject).x !== x) return refused("token", "kid-not-certified");
  if (revokes("machine", machine.id)) return refused("token", "kid-not-certified");
  return { certified: true, machine: String(machine.id), revision: record.revision };
}

/**
 * FAC-SEM-081: `{record, kid, x, at, applied?, answer}` — the answer of a delegation verifier that reads the estate record
 * is the one DL-14 gives: `certified`, or `hubKeyCertified`'s detail. `at` is the verifier's clock, an RFC 3339 date-time
 * read strictly (an unreadable one answers `no-clock`).
 */
function hubKeyAnswer(value: JsonObject): Finding[] {
  const verdict = hubKeyCertified(value.record, value.kid, value.x, new Date(strictTime(value.at)), value.applied as AppliedRevision | undefined);
  const want = verdict.certified ? "certified" : verdict.detail;
  if (value.answer === want) return [];
  return [{
    code: "FAC-SEM-081",
    instancePath: "/answer",
    message: verdict.certified
      ? `revision ${verdict.revision} certifies this kid for machine ${verdict.machine}; the verifier trusts it, not ${String(value.answer)}`
      : `the verifier answers ${want} (${verdict.fault === "token" ? "the token's fault: unauthenticated, approval-invalid for an approval" : verdict.fault === "estate" ? "the trust source's fault: issuer-unavailable" : "its own clock: unknown-state"}), not ${String(value.answer)}`
  }];
}

export function hubKeyRules(kind: string, value: unknown): Finding[] | undefined {
  if (kind !== "delegation-hub-key" || !isObject(value)) return undefined;
  return hubKeyAnswer(value);
}
// #endregion hub-key-rules
