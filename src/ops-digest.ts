import { type Finding, type JsonObject, indexed, isObject } from "./findings.js";
import { secretValue } from "./secret-shape.js";

// #region ops-digest, docs: docs/specification/ops-digest.md
/**
 * A product's operations digests (DEC-0153): every record of its operations log counted by operation and outcome in the
 * hour it happened, one `ops.digest.hourly@1` line per closed hour and one `ops.digest.daily@1` line per closed UTC day.
 * Counts only: no log line, no path, no identifier. A failure count that rose against the hour before is a rise (OD-4).
 * `foldHour` and `foldDay` are the reference folds; `opsDigestRules` is `FAC-SEM-166` (the window and the arithmetic) and
 * `FAC-SEM-167` (no credential shape in an operation's name).
 */
export const OPS_DIGEST_HOURLY = "ops.digest.hourly@1";
export const OPS_DIGEST_DAILY = "ops.digest.daily@1";
/** A failure count is a rise when it is at least this many in the hour… */
export const RISE_MIN_FAILED = 10;
/** …and at least this many times the hour before's (an hour before with none, or none recorded, counts as one). */
export const RISE_FACTOR = 2;
/** An operation's name (OD-2): a short dotted, colon or kebab identifier, so no path, URL, space or home folder fits. */
export const OP_NAME = /^[a-z][A-Za-z0-9_]*(?:[.:-][A-Za-z0-9_]+)*$/;
export const OP_NAME_MAX = 64;

const HOUR_MS = 3_600_000;
/** A whole UTC hour as the schema writes it: seconds and an optional all-zero fraction, then `Z`. */
const WHOLE_HOUR = /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):00:00(?:\.000)?Z$/;
const DAY = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/;

export interface Counters { ok: number; failed: number; unknown: number }
export interface OpCount extends Counters { op: string }
export interface HourlyDigest {
  schema: typeof OPS_DIGEST_HOURLY;
  from: string;
  to: string;
  ops: OpCount[];
  total: Counters;
  risen: Array<{ op: string; failed: number; previous: number }>;
}
export interface DailyDigest {
  schema: typeof OPS_DIGEST_DAILY;
  day: string;
  hours: number;
  ops: OpCount[];
  total: Counters;
  risen: Array<{ op: string; hours: number; failed: number }>;
}

/** Whether `failed` failures in an hour are a rise against `previous` in the hour before (OD-4). */
export const isRise = (failed: number, previous: number): boolean =>
  failed >= RISE_MIN_FAILED && failed >= RISE_FACTOR * Math.max(1, previous);

/** The instant of a whole UTC hour in the schema's form, or null for anything else (a 25th hour, a 30 February). */
export function wholeHour(value: unknown): number | null {
  const match = typeof value === "string" ? WHOLE_HOUR.exec(value) : null;
  if (!match) return null;
  const [year, month, day, hour] = match.slice(1).map(Number) as [number, number, number, number];
  const at = new Date(0);
  at.setUTCFullYear(year, month - 1, day);
  at.setUTCHours(hour);
  return at.getUTCFullYear() === year && at.getUTCMonth() === month - 1 && at.getUTCDate() === day && at.getUTCHours() === hour ? at.getTime() : null;
}

/** Whether `value` is a real `YYYY-MM-DD` day. */
export function realDay(value: unknown): boolean {
  const match = typeof value === "string" ? DAY.exec(value) : null;
  if (!match) return false;
  return wholeHour(`${value as string}T00:00:00Z`) !== null;
}

const iso = (at: number): string => new Date(at).toISOString();
/** By name in code-unit order; both callers compare names that are already unique. */
const byName = (a: { op: string }, b: { op: string }): number => (a.op < b.op ? -1 : 1);
const sum = (ops: readonly Counters[]): Counters =>
  ops.reduce((t, c) => ({ ok: t.ok + c.ok, failed: t.failed + c.failed, unknown: t.unknown + c.unknown }), { ok: 0, failed: 0, unknown: 0 });

/**
 * The digest of the hour starting at `from` (a whole UTC hour): `counts` summed by operation and sorted by name, and
 * each operation whose failures rose against `previous`, which counts only when it is the hour just before (a gap
 * compares with none). `from` and `to` are written as `Date.prototype.toISOString` writes them.
 */
export function foldHour(counts: readonly OpCount[], from: string, previous: HourlyDigest | null): HourlyDigest {
  const start = wholeHour(from);
  if (start === null) throw new Error(`${from} is not a whole UTC hour`);
  const merged = new Map<string, OpCount>();
  for (const c of counts) {
    const m = merged.get(c.op) ?? { op: c.op, ok: 0, failed: 0, unknown: 0 };
    m.ok += c.ok; m.failed += c.failed; m.unknown += c.unknown;
    merged.set(c.op, m);
  }
  const ops = [...merged.values()].sort(byName);
  const before = new Map((previous !== null && wholeHour(previous.to) === start ? previous.ops : []).map((c) => [c.op, c.failed]));
  const risen = ops.filter((c) => isRise(c.failed, before.get(c.op) ?? 0)).map((c) => ({ op: c.op, failed: c.failed, previous: before.get(c.op) ?? 0 }));
  return { schema: OPS_DIGEST_HOURLY, from: iso(start), to: iso(start + HOUR_MS), ops, total: sum(ops), risen };
}

/**
 * The day's hourly digests (those whose hour starts on `day`, one per hour, the first of a repeated hour kept) folded
 * into one: the operations summed, the hours counted, and each operation that rose in some hour with the hours it rose
 * in and the failures of those hours, the most failures first.
 */
export function foldDay(day: string, hourly: readonly HourlyDigest[]): DailyDigest {
  const seen = new Set<number>();
  const mine = hourly.filter((h) => {
    const at = wholeHour(h.from);
    if (at === null || iso(at).slice(0, 10) !== day || seen.has(at)) return false;
    seen.add(at);
    return true;
  });
  const merged = new Map<string, OpCount>();
  const rose = new Map<string, { hours: number; failed: number }>();
  for (const h of mine) {
    for (const c of h.ops) {
      const m = merged.get(c.op) ?? { op: c.op, ok: 0, failed: 0, unknown: 0 };
      m.ok += c.ok; m.failed += c.failed; m.unknown += c.unknown;
      merged.set(c.op, m);
    }
    for (const r of h.risen) {
      const x = rose.get(r.op) ?? { hours: 0, failed: 0 };
      x.hours += 1; x.failed += r.failed;
      rose.set(r.op, x);
    }
  }
  const ops = [...merged.values()].sort(byName);
  const risen = [...rose.entries()].map(([op, x]) => ({ op, ...x })).sort((a, b) => b.failed - a.failed || byName(a, b));
  return { schema: OPS_DIGEST_DAILY, day, hours: mine.length, ops, total: sum(ops), risen };
}

const count = (value: unknown): number | null => (typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null);
const COUNTERS = ["ok", "failed", "unknown"] as const;

/** FAC-SEM-166 and FAC-SEM-167 on one digest of either kind; any other kind is not this module's. */
export function opsDigestRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (!(kind === "ops-digest-hourly" || kind === "ops-digest-daily")) return undefined;
  const findings: Finding[] = [];
  const window = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-166", instancePath, message });
  const secret = (instancePath: string) => findings.push({ code: "FAC-SEM-167", instancePath, message: "an operation's name is shaped like a credential; it names an operation, never a value" });

  // The window: an hour of one hour, or a real day.
  if (kind === "ops-digest-hourly") {
    const from = wholeHour(value.from);
    const to = wholeHour(value.to);
    if (from === null) window("/from", "from is a whole UTC hour of a real day");
    if (to === null) window("/to", "to is a whole UTC hour of a real day");
    if (from !== null && to !== null && to - from !== HOUR_MS) window("/to", "to is exactly one hour after from");
  } else if (!realDay(value.day)) {
    window("/day", "day is a real UTC day, YYYY-MM-DD");
  }

  // Each operation once, its name no credential, and the total each counter's sum.
  const byOp = new Map<string, JsonObject>();
  const totals: Record<string, number | null> = { ok: 0, failed: 0, unknown: 0 };
  for (const [entry, index] of indexed(value.ops)) {
    const op = entry.op;
    if (typeof op === "string") {
      if (byOp.has(op)) window(`/ops/${index}/op`, `${op} is counted once`);
      else byOp.set(op, entry);
      if (secretValue(op)) secret(`/ops/${index}/op`);
    }
    for (const counter of COUNTERS) {
      const n = count(entry[counter]);
      totals[counter] = n === null || totals[counter] === null ? null : (totals[counter] as number) + n;
    }
  }
  const total = isObject(value.total) ? value.total : null;
  if (total !== null && Array.isArray(value.ops)) {
    for (const counter of COUNTERS) {
      const want = totals[counter];
      if (want !== null && count(total[counter]) !== null && total[counter] !== want) window(`/total/${counter}`, `total.${counter} is the sum of ops' ${counter}, ${want}`);
    }
  }

  // Each rise once, of a counted operation, and a rise by the rule where the digest carries what it needs.
  const rose = new Set<string>();
  const hours = count(value.hours);
  for (const [entry, index] of indexed(value.risen)) {
    const op = entry.op;
    if (typeof op !== "string") continue;
    const at = `/risen/${index}`;
    if (secretValue(op)) secret(`${at}/op`);
    if (rose.has(op)) window(`${at}/op`, `${op} is named once among the rises`);
    rose.add(op);
    const counted = byOp.get(op);
    if (counted === undefined) {
      window(`${at}/op`, `${op} rose, so ops counts it`);
      continue;
    }
    const failed = count(entry.failed);
    const countedFailed = count(counted.failed);
    if (kind === "ops-digest-hourly") {
      const previous = count(entry.previous);
      if (failed !== null && countedFailed !== null && failed !== countedFailed) window(`${at}/failed`, `a rise names the hour's failures of ${op}, ${countedFailed}`);
      if (failed !== null && previous !== null && !isRise(failed, previous)) window(at, `${failed} failures against ${previous} is no rise: at least ${RISE_MIN_FAILED} and ${RISE_FACTOR} times the hour before (none counts as one)`);
    } else {
      const risenHours = count(entry.hours);
      if (risenHours !== null && hours !== null && risenHours > hours) window(`${at}/hours`, `${op} rose in at most the day's ${hours} hours`);
      if (failed !== null && risenHours !== null && failed < RISE_MIN_FAILED * risenHours) window(`${at}/failed`, `${risenHours} hours of rises hold at least ${RISE_MIN_FAILED * risenHours} failures`);
      if (failed !== null && countedFailed !== null && failed > countedFailed) window(`${at}/failed`, `the rises' failures are at most the day's failures of ${op}, ${countedFailed}`);
    }
  }
  return findings;
}
// #endregion ops-digest
