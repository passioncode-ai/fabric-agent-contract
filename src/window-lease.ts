import { createPublicKey, verify as verifySignature } from "node:crypto";
import { isSmallOrderKey } from "./ed25519.js";
import { type Finding, type JsonObject, isObject } from "./findings.js";
import { rfc3339Time } from "./rfc3339.js";
import { WINDOW_LEASE_FIELDS, signingStatement } from "./signing-challenges.js";

// #region window-lease — docs: docs/specification/window-lease.md
/**
 * `window-lease/1` (DEC-0062): the estate's hub signs, once per machine, that machine's share of one instance of a
 * spending window — the most the machine's meter may spend in that window instance — valid for at most 24 hours. The
 * meter spends the smaller of its own remainder and the lease's, refuses beyond it, and at expiry reserves nothing more
 * in that window until a new lease arrives. It reports what it spent in its check-in; what it does not report counts
 * as spent until it does.
 */
export const WINDOW_LEASE_TYPE = "window-lease/1";
/** Hub keys are Ed25519 until Fabric records its decision D2 (DEC-0055 item 9); ES256 joins then, additively. */
export const LEASE_ALGORITHMS: readonly string[] = ["EdDSA"];
/** v4 Path 5: a lease lasts at most 24 hours. */
export const MAX_LEASE_SECONDS = 24 * 60 * 60;
/** The calendar windows of DEC-0038, in UTC, whose instances a lease divides; a week starts on Monday. */
export const LEASE_WINDOWS: readonly string[] = ["day", "week", "month"];

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const isString = (value: unknown): value is string => typeof value === "string";
const list = (value: unknown): JsonObject[] => (Array.isArray(value) ? value.filter(isObject) : []);
const OPAQUE = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,127}$/;
const SCOPE = /^(estate|project:[^\s#]{1,256}|grant:[^\s#]{1,200}#[1-9][0-9]{0,15})$/;
const B64URL = /^[A-Za-z0-9_-]+$/;

// ---- Decimal USD -------------------------------------------------------------------------------------------------

/** A decimal string of US dollars as the device policy's quota writes it: at most 9 integer and 6 fraction digits. */
const USD = /^(0|[1-9][0-9]{0,8})(?:\.([0-9]{1,6}))?$/;

/**
 * A decimal USD string as millionths of a dollar, or `undefined`: no sign, no exponent, no leading zero, no bare point,
 * at most six fraction digits. Amounts are compared as integers, so no port rounds through a binary float.
 */
export function usdMicros(value: unknown): bigint | undefined {
  const match = isString(value) ? USD.exec(value) : null;
  if (!match) return undefined;
  return BigInt(match[1] as string) * 1_000_000n + BigInt((match[2] ?? "").padEnd(6, "0"));
}

/** Millionths of a dollar as the shortest decimal string; a negative amount is written as `0`. */
export function formatUsd(micros: bigint): string {
  if (micros <= 0n) return "0";
  const whole = micros / 1_000_000n;
  const fraction = (micros % 1_000_000n).toString().padStart(6, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : `${whole}`;
}

const min = (a: bigint, b: bigint) => (a < b ? a : b);
const max = (a: bigint, b: bigint) => (a > b ? a : b);

// ---- Window instances --------------------------------------------------------------------------------------------

/** Midnight UTC of a calendar date, or NaN when the date does not exist. */
function utcDate(year: number, month: number, day: number): number {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date.getTime() : Number.NaN;
}

/** The Monday that starts ISO 8601 week 1 of `year`: the week holding 4 January. */
function weekOneMonday(year: number): number {
  const january4 = new Date(0);
  january4.setUTCFullYear(year, 0, 4);
  return january4.getTime() - ((january4.getUTCDay() + 6) % 7) * DAY_MS;
}

const pad = (value: number, width: number) => String(value).padStart(width, "0");

/**
 * The window instance a period names, as `[start, end)` in milliseconds, or `undefined` when `period` is not that
 * window's form: `day` `YYYY-MM-DD`, `week` the ISO 8601 week `YYYY-Www` (upper-case `W`, week 1 the week holding
 * 4 January, weeks starting on Monday), `month` `YYYY-MM`. A day, week or month that does not exist is refused.
 */
export function periodBounds(window: unknown, period: unknown): { start: number; end: number } | undefined {
  if (!isString(period)) return undefined;
  let match: RegExpExecArray | null;
  if (window === "day" && (match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(period))) {
    const start = utcDate(Number(match[1]), Number(match[2]), Number(match[3]));
    return Number.isNaN(start) || Number(match[1]) < 1 ? undefined : { start, end: start + DAY_MS };
  }
  if (window === "week" && (match = /^(\d{4})-W(\d{2})$/.exec(period))) {
    const year = Number(match[1]);
    const week = Number(match[2]);
    const weeks = (weekOneMonday(year + 1) - weekOneMonday(year)) / WEEK_MS;
    if (year < 1 || week < 1 || week > weeks) return undefined;
    const start = weekOneMonday(year) + (week - 1) * WEEK_MS;
    return { start, end: start + WEEK_MS };
  }
  if (window === "month" && (match = /^(\d{4})-(\d{2})$/.exec(period))) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (year < 1 || month < 1 || month > 12) return undefined;
    return { start: utcDate(year, month, 1), end: month === 12 ? utcDate(year + 1, 1, 1) : utcDate(year, month + 1, 1) };
  }
  return undefined;
}

/** The period of `window` that holds the instant `at` (milliseconds, UTC), or `undefined` for an unknown window or clock. */
export function periodOf(window: unknown, at: number): string | undefined {
  if (!Number.isFinite(at)) return undefined;
  const date = new Date(at);
  if (Number.isNaN(date.getTime()) || date.getUTCFullYear() < 1 || date.getUTCFullYear() > 9999) return undefined;
  const year = date.getUTCFullYear();
  if (window === "day") return `${pad(year, 4)}-${pad(date.getUTCMonth() + 1, 2)}-${pad(date.getUTCDate(), 2)}`;
  if (window === "month") return `${pad(year, 4)}-${pad(date.getUTCMonth() + 1, 2)}`;
  if (window === "week") {
    const midnight = utcDate(year, date.getUTCMonth() + 1, date.getUTCDate());
    const monday = midnight - ((date.getUTCDay() + 6) % 7) * DAY_MS;
    // The ISO week-numbering year is the year of the week's Thursday: 2027-01-01 is in 2026-W53, 2024-12-30 in 2025-W01.
    const isoYear = new Date(monday + 3 * DAY_MS).getUTCFullYear();
    return `${pad(isoYear, 4)}-W${pad((monday - weekOneMonday(isoYear)) / WEEK_MS + 1, 2)}`;
  }
  return undefined;
}

// ---- The document ------------------------------------------------------------------------------------------------

/**
 * The bytes the hub signs: the register's `window-lease/1` statement (DEC-0063) — the UTF-8 RFC 8785 form of the lease
 * without `sig`. `undefined` when the lease does not carry exactly the registered members or has no RFC 8785 form.
 */
export function windowLeaseSigningInput(lease: unknown): Buffer | undefined {
  if (!isObject(lease) || lease.type !== WINDOW_LEASE_TYPE) return undefined;
  const { type: _type, sig: _sig, ...fields } = lease;
  return signingStatement(WINDOW_LEASE_TYPE, fields);
}

/** The key a window instance is held under on one machine: one active lease per scope, window and period. */
export const leaseSlot = (lease: JsonObject) => `${String(lease.estate)} ${String(lease.machine)} ${String(lease.scope)} ${String(lease.window)} ${String(lease.period)}`;

/** Whether a lease's members have the shapes the verifier relies on (the schema's, without the signature's bytes). */
function wellFormed(lease: JsonObject): boolean {
  return (
    lease.type === WINDOW_LEASE_TYPE &&
    WINDOW_LEASE_FIELDS.every((name) => Object.hasOwn(lease, name)) &&
    [lease.leaseId, lease.estate, lease.machine].every((id) => isString(id) && OPAQUE.test(id)) &&
    [lease.sequence, lease.estateRevision].every((n) => Number.isSafeInteger(n) && (n as number) >= 1) &&
    isString(lease.scope) && SCOPE.test(lease.scope) &&
    periodBounds(lease.window, lease.period) !== undefined &&
    usdMicros(lease.amount) !== undefined &&
    lease.unit === "USD" &&
    Number.isFinite(rfc3339Time(lease.issuedAt)) && Number.isFinite(rfc3339Time(lease.expiresAt)) &&
    isString(lease.alg) && isString(lease.kid) && lease.kid.length > 0 &&
    isString(lease.sig) && B64URL.test(lease.sig)
  );
}

/**
 * The hub key the estate record certifies under `kid` (DEC-0055 item 4): the `hubKey` of one of its machines, when the
 * record revokes neither that hub key nor that machine. `undefined` otherwise. The window lease's own reading of the
 * certificate; when a shared reading of hub-key certification reaches `main`, this function adopts it.
 */
export function certifiedHubKey(record: unknown, kid: unknown): JsonObject | undefined {
  if (!isObject(record) || !isString(kid)) return undefined;
  const revoked = new Set(list(record.revocations).map((entry) => `${String(entry.kind)} ${String(entry.ref)}`));
  const holders = list(record.machines).filter((machine) => isObject(machine.hubKey) && machine.hubKey.kid === kid);
  // One kid is certified for one machine (FAC-SEM-073); a record that lists it twice certifies neither.
  if (holders.length !== 1) return undefined;
  const machine = holders[0] as JsonObject;
  if (revoked.has(`hub-key ${kid}`) || revoked.has(`machine ${String(machine.id)}`)) return undefined;
  return machine.hubKey as JsonObject;
}

export type LeaseProblem =
  | "context-invalid"
  | "no-clock"
  | "malformed"
  | "too-long-lived"
  | "past-window"
  | "unknown-algorithm"
  | "wrong-estate"
  | "hub-key-uncertified"
  | "unusable-key"
  | "small-order-key"
  | "bad-signature"
  | "wrong-machine"
  | "not-yet-valid"
  | "expired"
  | "not-current-period"
  | "superseded"
  | "over-remainder";

export type LeaseVerdict =
  | { ok: true; leaseId: string; slot: string; amount: string; expiresAt: string }
  | { ok: false; problem: LeaseProblem };

export interface LeaseTrust {
  /** The meter's clock. */
  at: Date;
  /** This machine's device id: a lease for any other machine is refused. */
  machine: string;
  /** The estate record this machine applies (verified by `verifyEstateRecord`): it certifies the hub's key. */
  estateRecord: JsonObject;
  /**
   * What the record that owns the window still allows this machine in this window instance, a decimal USD string: for
   * the hub, `windowRemainder`'s answer; for a meter, at most the window's limit it knows (the estate's L0 for the
   * month).
   */
  remainderUsd: string;
  /** The verified lease this machine holds for the same estate, machine, scope, window and period, if any. */
  held?: JsonObject;
}

/** Whether `value` is a usable trust context, the clock aside. */
function usableTrust(trust: LeaseTrust): boolean {
  return isString(trust.machine) && isObject(trust.estateRecord) && usdMicros(trust.remainderUsd) !== undefined && (trust.held === undefined || isObject(trust.held));
}

/**
 * The reference verifier (DEC-0062), in the order of window-lease.md's WL table: the context, the clock, the shape, the
 * lease's life and its window instance, the algorithm, the estate and the hub key its record certifies, the signature,
 * the machine, the clock against the lease and its period, the lease held, the remainder. It answers and never throws.
 */
export function verifyWindowLease(lease: unknown, trust: LeaseTrust): LeaseVerdict {
  if (!isObject(trust)) return { ok: false, problem: "context-invalid" };
  // An unreadable clock makes every comparison false and would accept any lease; it is refused before any.
  const at = trust.at instanceof Date ? trust.at.getTime() : Number.NaN;
  if (!Number.isFinite(at)) return { ok: false, problem: "no-clock" };
  if (!usableTrust(trust)) return { ok: false, problem: "context-invalid" };
  if (!isObject(lease) || !wellFormed(lease)) return { ok: false, problem: "malformed" };
  const input = windowLeaseSigningInput(lease);
  if (!input) return { ok: false, problem: "malformed" };

  const issuedAt = rfc3339Time(lease.issuedAt);
  const expiresAt = rfc3339Time(lease.expiresAt);
  if (expiresAt <= issuedAt || expiresAt - issuedAt > MAX_LEASE_SECONDS * 1000) return { ok: false, problem: "too-long-lived" };
  const bounds = periodBounds(lease.window, lease.period) as { start: number; end: number };
  // A lease never outlives its window instance: the next instance is a new lease.
  if (expiresAt > bounds.end) return { ok: false, problem: "past-window" };
  if (!LEASE_ALGORITHMS.includes(lease.alg as string)) return { ok: false, problem: "unknown-algorithm" };

  const record = trust.estateRecord;
  // The verifier judges the hub key under the revision it applied, never under one it has not seen.
  if (lease.estate !== record.estate || !Number.isSafeInteger(record.revision) || (lease.estateRevision as number) > (record.revision as number)) {
    return { ok: false, problem: "wrong-estate" };
  }
  const hubKey = certifiedHubKey(record, lease.kid);
  if (!hubKey || hubKey.alg !== lease.alg) return { ok: false, problem: "hub-key-uncertified" };
  const x = hubKey.x;
  const raw = isString(x) && B64URL.test(x) ? Buffer.from(x, "base64url") : Buffer.alloc(0);
  if (hubKey.kty !== "OKP" || hubKey.crv !== "Ed25519" || hubKey.d !== undefined || raw.length !== 32 || raw.toString("base64url") !== x) return { ok: false, problem: "unusable-key" };
  // DEC-0045: a small-order key verifies forged signatures on Node 20 and 22; it is refused before any verification.
  if (isSmallOrderKey(raw)) return { ok: false, problem: "small-order-key" };
  const sig = Buffer.from(lease.sig as string, "base64url");
  // The key and the signature are checked before use, as the package and delegation verifiers check theirs, so
  // `crypto.verify` answers false rather than throwing.
  const key = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: x as string }, format: "jwk" });
  if (sig.length !== 64 || sig.toString("base64url") !== lease.sig || !verifySignature(null, input, key, sig)) return { ok: false, problem: "bad-signature" };

  if (lease.machine !== trust.machine) return { ok: false, problem: "wrong-machine" };
  if (at < issuedAt) return { ok: false, problem: "not-yet-valid" };
  if (at >= expiresAt) return { ok: false, problem: "expired" };
  if (at < bounds.start || at >= bounds.end) return { ok: false, problem: "not-current-period" };

  const held = trust.held;
  if (held && leaseSlot(held) === leaseSlot(lease)) {
    const same = held.leaseId === lease.leaseId && windowLeaseSigningInput(held)?.equals(input) === true;
    // A newer lease supersedes the older; the same lease delivered again is the same lease.
    if (!same && (lease.sequence as number) <= Number(held.sequence)) return { ok: false, problem: "superseded" };
  }
  if ((usdMicros(lease.amount) as bigint) > (usdMicros(trust.remainderUsd) as bigint)) return { ok: false, problem: "over-remainder" };
  return { ok: true, leaseId: lease.leaseId as string, slot: leaseSlot(lease), amount: lease.amount as string, expiresAt: lease.expiresAt as string };
}

// ---- The meter ---------------------------------------------------------------------------------------------------

export type ReserveProblem = "no-clock" | "malformed" | "not-yet-valid" | "expired" | "not-current-period" | "exhausted";
export type ReserveVerdict = { ok: true; remainingUsd: string } | { ok: false; problem: ReserveProblem };

export interface ReserveRequest {
  /** The amount to reserve, a decimal USD string. */
  amountUsd: string;
  /** The meter's clock. */
  at: Date;
  /**
   * What this machine has spent in the lease's window instance, under this lease and every earlier one of the same
   * slot: settled receipts plus open reservations, a decimal USD string.
   */
  spentUsd: string;
  /** The meter's own remainder for the window (its local limits), when it has one. */
  localRemainderUsd?: string;
}

/**
 * The meter's decision (DEC-0062): may it reserve `amountUsd` under the verified lease `lease` at `at`, having spent
 * `spentUsd` in the window instance? Only while the lease is valid and its period is current, and only up to the smaller
 * of the lease's remainder (`amount − spent`) and the meter's own. At or after `expiresAt` the answer is `expired`: the
 * meter reserves nothing more in that window until a newer lease arrives. Above the lease, the run asks for an approval
 * (`limit-reached`, DEC-0034 OC-6); a lease has no escalation field.
 */
export function mayReserve(lease: unknown, request: ReserveRequest): ReserveVerdict {
  const at = isObject(request) && request.at instanceof Date ? request.at.getTime() : Number.NaN;
  if (!Number.isFinite(at)) return { ok: false, problem: "no-clock" };
  if (!isObject(lease) || !wellFormed(lease)) return { ok: false, problem: "malformed" };
  const amount = usdMicros(request.amountUsd);
  const spent = usdMicros(request.spentUsd);
  const local = request.localRemainderUsd === undefined ? undefined : usdMicros(request.localRemainderUsd);
  if (amount === undefined || spent === undefined || (request.localRemainderUsd !== undefined && local === undefined)) return { ok: false, problem: "malformed" };
  const bounds = periodBounds(lease.window, lease.period) as { start: number; end: number };
  if (at < rfc3339Time(lease.issuedAt)) return { ok: false, problem: "not-yet-valid" };
  if (at >= rfc3339Time(lease.expiresAt)) return { ok: false, problem: "expired" };
  if (at < bounds.start || at >= bounds.end) return { ok: false, problem: "not-current-period" };
  const leaseRemainder = max(0n, (usdMicros(lease.amount) as bigint) - spent);
  const remainder = local === undefined ? leaseRemainder : min(leaseRemainder, local);
  if (amount > remainder) return { ok: false, problem: "exhausted" };
  return { ok: true, remainingUsd: formatUsd(remainder - amount) };
}

// ---- The hub -----------------------------------------------------------------------------------------------------

/** A meter's report of one lease, as the hub received it: the check-in's `records.leases[]` entry and its time. */
export interface LeaseReport {
  leaseId: string;
  /** Settled receipts plus open reservations in the window instance, an upper bound; absent, the lease is unreported. */
  spent?: string;
  /** When the hub received the report. */
  receivedAt: string;
}

export interface WindowLedger {
  /** The window instance's limit, a decimal USD string. */
  limitUsd: string;
  /** The hub's clock. */
  at: Date;
  /** The machine a new lease would go to: its own leases are what that lease replaces, so they are not subtracted. */
  machine: string;
  /** Every lease the hub issued for this window instance (one estate, scope, window and period). */
  leases: readonly unknown[];
  /** The reports received. */
  reports: readonly LeaseReport[];
}

export type RemainderVerdict = { ok: true; remainderUsd: string; heldUsd: string } | { ok: false; problem: "no-clock" | "malformed" };

/**
 * What one machine holds of a window instance, at `at`: the most it may have spent. For each of its leases, the amount
 * while the lease is valid (it may still spend it); after expiry, the `spent` of a report received at or after that
 * expiry under this lease or a later one of the machine (spent counts the whole window instance), else the amount —
 * an expired lease nobody reported counts as spent. A late report lowers the claim at the next division: that is its
 * refund.
 */
function heldBy(leases: JsonObject[], reports: readonly LeaseReport[], at: number): bigint {
  let held = 0n;
  for (const lease of leases) {
    const amount = usdMicros(lease.amount) as bigint;
    const expiresAt = rfc3339Time(lease.expiresAt);
    let claim = amount;
    if (at >= expiresAt) {
      const covering = new Set(leases.filter((other) => (other.sequence as number) >= (lease.sequence as number)).map((other) => other.leaseId));
      const final = reports
        .filter((report) => covering.has(report.leaseId) && usdMicros(report.spent) !== undefined && rfc3339Time(report.receivedAt) >= expiresAt && rfc3339Time(report.receivedAt) <= at)
        .sort((a, b) => rfc3339Time(a.receivedAt) - rfc3339Time(b.receivedAt))
        .at(-1);
      if (final) claim = usdMicros(final.spent) as bigint;
    }
    held = max(held, claim);
  }
  return held;
}

/**
 * The hub's division (DEC-0062): the most it may lease `machine` in a window instance at `at` — the limit less what
 * every other machine holds (`heldBy`), never below zero — and what those machines hold. The amount of a new lease for
 * `machine` is its whole share of the instance, so its own earlier leases are not subtracted; an earlier lease that is
 * still valid stays counted for the others until it expires or is reported.
 */
export function windowRemainder(ledger: WindowLedger): RemainderVerdict {
  const at = isObject(ledger) && ledger.at instanceof Date ? ledger.at.getTime() : Number.NaN;
  if (!Number.isFinite(at)) return { ok: false, problem: "no-clock" };
  const limit = usdMicros(ledger.limitUsd);
  if (limit === undefined || !isString(ledger.machine) || !Array.isArray(ledger.leases) || !Array.isArray(ledger.reports)) return { ok: false, problem: "malformed" };
  const leases = ledger.leases.filter(isObject);
  if (leases.length !== ledger.leases.length || !leases.every(wellFormed)) return { ok: false, problem: "malformed" };
  const reports = ledger.reports.filter((report): report is LeaseReport => isObject(report) && isString(report.leaseId) && Number.isFinite(rfc3339Time(report.receivedAt)));
  const byMachine = new Map<string, JsonObject[]>();
  for (const lease of leases) byMachine.set(lease.machine as string, [...(byMachine.get(lease.machine as string) ?? []), lease]);
  let others = 0n;
  for (const [machine, own] of byMachine) if (machine !== ledger.machine) others += heldBy(own, reports, at);
  return { ok: true, remainderUsd: formatUsd(limit - others), heldUsd: formatUsd(others) };
}

// ---- Rules -------------------------------------------------------------------------------------------------------

type Flag = (instancePath: string, message: string) => void;

/** FAC-SEM-089 on one lease: its period is its window's form, its life is positive and at most 24 hours, inside the instance. */
function leaseDocument(value: JsonObject, flag: Flag): void {
  const bounds = periodBounds(value.window, value.period);
  if (!bounds) flag("/period", `a ${String(value.window)} window's period is ${value.window === "week" ? "an ISO 8601 week, YYYY-Www" : value.window === "day" ? "a date, YYYY-MM-DD" : "a month, YYYY-MM"}, and one that exists`);
  const issuedAt = rfc3339Time(value.issuedAt);
  const expiresAt = rfc3339Time(value.expiresAt);
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt)) {
    flag(Number.isFinite(issuedAt) ? "/expiresAt" : "/issuedAt", "issuedAt and expiresAt are RFC 3339 date-times with an offset, on days that exist");
    return;
  }
  if (expiresAt <= issuedAt || expiresAt - issuedAt > MAX_LEASE_SECONDS * 1000) flag("/expiresAt", "a lease expires after it is issued and at most 24 hours later");
  if (bounds && expiresAt > bounds.end) flag("/expiresAt", `a lease never outlives its window instance, which ends at ${new Date(bounds.end).toISOString()}`);
  if (usdMicros(value.amount) === undefined) flag("/amount", "the amount is a decimal string of at most 9 integer and 6 fraction digits");
}

/**
 * FAC-SEM-090: the hub's division of one window instance (`{limitUsd, leases, reports}`) — every lease is of that one
 * instance, each `leaseId` once, a machine's sequences rise with its leases' issue times, and no lease exceeded what
 * `windowRemainder` allowed its machine when it was issued, counting the leases issued before it (at one instant, the
 * ones listed before it) and the reports received before it.
 */
function division(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag: Flag = (instancePath, message) => findings.push({ code: "FAC-SEM-090", instancePath, message });
  if (usdMicros(value.limitUsd) === undefined) {
    flag("/limitUsd", "the window instance's limit is a decimal USD string");
    return findings;
  }
  const leases = Array.isArray(value.leases) ? value.leases : [];
  const reports = list(value.reports) as unknown as LeaseReport[];
  const instance = (lease: JsonObject) => `${String(lease.estate)} ${String(lease.scope)} ${String(lease.window)} ${String(lease.period)}`;
  const first = isObject(leases[0]) ? instance(leases[0]) : undefined;
  const ids = new Set<unknown>();
  const usable: Array<{ lease: JsonObject; index: number }> = [];
  leases.forEach((lease, index) => {
    if (!isObject(lease) || !wellFormed(lease)) {
      flag(`/leases/${index}`, "every lease of the division is a well-formed window-lease/1");
      return;
    }
    if (instance(lease) !== first) flag(`/leases/${index}`, "a division covers one window instance: one estate, scope, window and period");
    if (ids.has(lease.leaseId)) flag(`/leases/${index}/leaseId`, `lease ${String(lease.leaseId)} is listed twice`);
    ids.add(lease.leaseId);
    usable.push({ lease, index });
  });
  const ordered = [...usable].sort((a, b) => rfc3339Time(a.lease.issuedAt) - rfc3339Time(b.lease.issuedAt) || a.index - b.index);
  const lastSequence = new Map<string, number>();
  ordered.forEach(({ lease, index }, position) => {
    const issuedAt = rfc3339Time(lease.issuedAt);
    const machine = lease.machine as string;
    const previous = lastSequence.get(machine);
    if (previous !== undefined && (lease.sequence as number) <= previous) flag(`/leases/${index}/sequence`, `machine ${machine}'s leases rise in sequence as they are issued: ${String(lease.sequence)} follows ${previous}`);
    lastSequence.set(machine, Math.max(previous ?? 0, lease.sequence as number));
    // Every lease issued before it, and one issued at the same instant but listed earlier: two leases signed together
    // still share one window.
    const before = ordered.slice(0, position).map((other) => other.lease);
    const allowed = windowRemainder({
      limitUsd: value.limitUsd as string,
      at: new Date(issuedAt),
      machine,
      leases: before,
      reports: reports.filter((report) => rfc3339Time(report.receivedAt) < issuedAt)
    });
    if (allowed.ok && (usdMicros(lease.amount) as bigint) > (usdMicros(allowed.remainderUsd) as bigint)) {
      flag(`/leases/${index}/amount`, `the hub could lease machine ${machine} at most ${allowed.remainderUsd} USD of this window instance when it issued this lease: the others held ${allowed.heldUsd}`);
    }
  });
  return findings;
}

/**
 * FAC-SEM-091: a meter's decision (`{lease, request, decision}`, `decision` `reserve` or `refuse`) is the one
 * `mayReserve` gives for that lease and request.
 */
function reservation(value: JsonObject): Finding[] {
  const request = isObject(value.request) ? value.request : {};
  const verdict = mayReserve(value.lease, { ...request, at: new Date(rfc3339Time(request.at)) } as unknown as ReserveRequest);
  const expected = verdict.ok ? "reserve" : "refuse";
  if (value.decision === expected) return [];
  const why = verdict.ok ? `the lease leaves ${verdict.remainingUsd} USD after it` : `the lease answers ${verdict.problem}`;
  return [{ code: "FAC-SEM-091", instancePath: "/decision", message: `the meter must ${expected}: ${why}` }];
}

export function windowLeaseRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (kind === "window-lease") {
    const findings: Finding[] = [];
    leaseDocument(value, (instancePath, message) => findings.push({ code: "FAC-SEM-089", instancePath, message }));
    return findings;
  }
  if (kind === "window-lease-division") return division(value);
  if (kind === "lease-reservation") return reservation(value);
  return undefined;
}
// #endregion window-lease
