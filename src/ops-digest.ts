import type { ErrorObject, ValidateFunction } from "ajv/dist/2020.js";
import { type Finding, type JsonObject, indexed, isObject } from "./findings.js";
import { hasHomePath } from "./activity-rules.js";
import { SCHEMA_PREFIX } from "./contract.js";
import { EXTENSION_KEYS } from "./extensions.js";
import { secretValue } from "./secret-shape.js";
import { createValidatorSync } from "./validator.js";

// #region ops-digest, docs: docs/specification/ops-digest.md
/**
 * A product's operations digests (DEC-0153): every record of its operations log counted by operation and outcome in the
 * hour it happened, one `ops.digest.hourly@1` line for each hour it observed itself running in (an empty one included),
 * written when that hour closes, and one `ops.digest.daily@1` line for each closed UTC day that has hourly lines.
 * Counts only: no log line, no path, no identifier. A failure count that rose against the hour before is a rise (OD-4).
 * `foldHour` and `foldDay` are the reference folds; `opsDigestRules` is `FAC-SEM-166` (the window and the arithmetic) and
 * `FAC-SEM-167` (no credential and no home folder in an operation's name). `digestFoldersView` reads where a local
 * descriptor says its daily digests are (extensions/ops-digest/0.1, OD-9), and `digestFoldersRules` is `FAC-SEM-168`.
 */
export const OPS_DIGEST_HOURLY = "ops.digest.hourly@1";
export const OPS_DIGEST_DAILY = "ops.digest.daily@1";
/** A failure count is a rise when it is at least this many in the hour… */
export const RISE_MIN_FAILED = 10;
/** …and at least this many times the hour before's (an hour before with none, or none recorded, counts as one). */
export const RISE_FACTOR = 2;
/**
 * An operation's name (OD-2): segments of letters, digits and `_` joined by `.`, `:`, `/` or `-` (`mcp.tools/list`), so
 * no absolute path, URL, space, empty segment, `.` or `..` fits; `FAC-SEM-167` refuses a home folder the `/` would let in.
 */
export const OP_NAME = /^[a-z][A-Za-z0-9_]*(?:[.:/-][A-Za-z0-9_]+)*$/;
export const OP_NAME_MAX = 64;
/**
 * At most this many operations in a digest's `ops` (and so in `risen`). A product keeps at most 4095 named operations per
 * UTC day plus its one overflow name, so both its hourly and its daily lines validate (OD-3).
 */
export const OPS_MAX = 4096;

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
/** Whether `n` is a count: an integer from 0 to 2^53 - 1. */
const isCount = (n: unknown): boolean => Number.isSafeInteger(n) && (n as number) >= 0;
/** By name in code-unit order; both callers compare names that are already unique. */
const byName = (a: { op: string }, b: { op: string }): number => (a.op < b.op ? -1 : 1);
const sum = (ops: readonly Counters[]): Counters =>
  ops.reduce((t, c) => ({ ok: t.ok + c.ok, failed: t.failed + c.failed, unknown: t.unknown + c.unknown }), { ok: 0, failed: 0, unknown: 0 });
/**
 * A digest whose every count, an hourly rise's `previous` included, is still an integer from 0 to 2^53 - 1, or a throw.
 * Every input is checked before it is merged, so what fails here is a sum beyond 2^53 - 1.
 */
function safeCounts<T extends HourlyDigest | DailyDigest>(digest: T): T {
  const counts = [digest.total, ...digest.ops].flatMap((c) => [c.ok, c.failed, c.unknown])
    .concat(digest.risen.flatMap((r) => ("previous" in r ? [r.failed, r.previous] : [r.failed])));
  if (!counts.every(isCount)) throw new Error("a sum is beyond 2^53 - 1");
  return digest;
}
/**
 * A value as a message may show it: itself, or `instead` when it is shaped like a credential or holds a home folder, so
 * a finding or an error never copies such a value (as `src/descriptor-rules.ts` names only the place).
 */
const hidden = (value: string): boolean => secretValue(value) || hasHomePath(value);
const shown = (value: string, instead: string): string => (hidden(value) ? instead : value);
/** What OD-2 refuses in an operation's name, its grammar or FAC-SEM-167, as a fold's error words it; null for a lawful name. */
const nameRefusal = (op: unknown): string | null => {
  if (typeof op !== "string" || op.length > OP_NAME_MAX || !OP_NAME.test(op)) return "fails OD-2's name grammar";
  return hidden(op) ? "is refused by FAC-SEM-167" : null;
};
/** Throws when `ops` names one operation twice; `where` says whose list it is. */
function once(ops: ReadonlyArray<{ op: string }>, where: string): void {
  const names = new Set<string>();
  ops.forEach((c, index) => {
    if (names.has(c.op)) throw new Error(`${shown(c.op, `the operation at ${index}`)} is named twice in ${where}`);
    names.add(c.op);
  });
}

/**
 * The digest of the hour starting at `from` (a whole UTC hour): `counts` summed by operation and sorted by name in
 * code-unit order, and each operation whose failures rose against `previous`, in the order of `ops`, which counts only
 * when it is the hour just before (a gap compares with none). `from` and `to` are written as
 * `Date.prototype.toISOString` writes them. `previous` must already pass FAC-SEM-166. It throws when an input count or
 * a previous digest's count is not an integer from 0 to 2^53 - 1 (each checked before it is used), when a sum is beyond
 * 2^53 - 1, when the previous digest, being the hour just before, names an operation twice, when the hour after `from`
 * is not a whole hour the schema writes (after 9999-12-31T23), and, as OD-3 asks, when an operation's name is a name
 * OD-2 refuses (its grammar, OP_NAME_MAX included, or FAC-SEM-167: `secretValue` or `hasHomePath`, as `opsDigestRules`
 * tests it) or the hour holds more than 4096 operations: no hourly digest, since a reference fold never writes a line every reader skips. An error
 * names a credential-shaped or home-folder value (`from` included) only by its place.
 */
export function foldHour(counts: readonly OpCount[], from: string, previous: HourlyDigest | null): HourlyDigest {
  const start = wholeHour(from);
  if (start === null) throw new Error(`${shown(from, "from")} is not a whole UTC hour`);
  if (wholeHour(iso(start + HOUR_MS)) === null) throw new Error(`the hour after ${shown(from, "from")} is not a whole UTC hour the schema writes`);
  const merged = new Map<string, OpCount>();
  counts.forEach((c, index) => {
    const refused = nameRefusal(c.op);
    if (refused !== null) throw new Error(`the operation at ${index} ${refused}: no hourly digest (OD-3)`);
    // The name passed nameRefusal, so shown() below returns it; it stays as defence in depth, never echoing a value.
    if (![c.ok, c.failed, c.unknown].every(isCount)) throw new Error(`a count of ${shown(c.op, `the operation at ${index}`)} is not an integer from 0 to 2^53 - 1`);
    const m = merged.get(c.op) ?? { op: c.op, ok: 0, failed: 0, unknown: 0 };
    m.ok += c.ok; m.failed += c.failed; m.unknown += c.unknown;
    merged.set(c.op, m);
  });
  if (merged.size > OPS_MAX) throw new Error(`the hour counts ${merged.size} operations, more than ${OPS_MAX}: no hourly digest (OD-3)`);
  const ops = [...merged.values()].sort(byName);
  const adjoining = previous !== null && wholeHour(previous.to) === start ? previous.ops : [];
  once(adjoining, "the previous hour's ops");
  const before = new Map(adjoining.map((c) => [c.op, c.failed]));
  // A previous count that is no count (NaN, 1e300, negative) would silently suppress or fake a rise: it throws.
  for (const c of ops) if (before.has(c.op) && !isCount(before.get(c.op))) throw new Error(`the previous hour's failures of ${shown(c.op, "an operation")} are not an integer from 0 to 2^53 - 1`);
  const risen = ops.filter((c) => isRise(c.failed, before.get(c.op) ?? 0)).map((c) => ({ op: c.op, failed: c.failed, previous: before.get(c.op) ?? 0 }));
  return safeCounts({ schema: OPS_DIGEST_HOURLY, from: iso(start), to: iso(start + HOUR_MS), ops, total: sum(ops), risen });
}

/**
 * The day's hourly digests (those whose hour starts on `day`, one per hour, the first of a repeated hour kept) folded
 * into one: the operations summed, the hours counted, and each operation that rose in some hour with the hours it rose
 * in and the failures of those hours, the most failures first, then by name. A day with no hour of its own has no
 * digest: null (OD-5). Its hourly digests must already pass FAC-SEM-166. It throws when an input count or an hour's rise
 * is not an integer from 0 to 2^53 - 1 (each checked before it is merged), when a sum is beyond 2^53 - 1, when an hour
 * names a rise twice or a rise of an operation its ops does not count, when a name in an hour's ops or risen is one
 * OD-2 refuses (its grammar, `OP_NAME_MAX` included, or FAC-SEM-167), and when the day folds more than 4096 operations:
 * it writes no daily digest then (OD-3),
 * since a reference fold never writes a line every reader skips.
 */
export function foldDay(day: string, hourly: readonly HourlyDigest[]): DailyDigest | null {
  const seen = new Set<number>();
  const mine = hourly.filter((h) => {
    const at = wholeHour(h.from);
    if (at === null || iso(at).slice(0, 10) !== day || seen.has(at)) return false;
    seen.add(at);
    return true;
  });
  if (mine.length === 0) return null;
  const merged = new Map<string, OpCount>();
  const rose = new Map<string, { hours: number; failed: number }>();
  for (const h of mine) {
    // OD-2 in full, its grammar and FAC-SEM-167: a name it refuses would make every reader skip the daily line. The
    // shown() calls below then return the name; they stay as defence in depth, never echoing a value.
    for (const [list, where] of [[h.ops, "ops"], [h.risen, "risen"]] as const) {
      list.forEach((c: { op: string }, index: number) => {
        const refused = nameRefusal(c.op);
        if (refused !== null) throw new Error(`the operation at ${index} of ${h.from}'s ${where} ${refused}: no daily digest (OD-3)`);
      });
    }
    for (const c of h.ops) {
      if (![c.ok, c.failed, c.unknown].every(isCount)) throw new Error(`a count of ${shown(c.op, "an operation")} in ${h.from} is not an integer from 0 to 2^53 - 1`);
      const m = merged.get(c.op) ?? { op: c.op, ok: 0, failed: 0, unknown: 0 };
      m.ok += c.ok; m.failed += c.failed; m.unknown += c.unknown;
      merged.set(c.op, m);
    }
    once(h.risen, `the risen of ${h.from}`);
    for (const r of h.risen) {
      if (!isCount(r.failed)) throw new Error(`the rise of ${shown(r.op, "an operation")} in ${h.from} is not an integer from 0 to 2^53 - 1`);
      if (!h.ops.some((c) => c.op === r.op)) throw new Error(`${shown(r.op, "an operation")} rose in ${h.from} but that hour's ops does not count it`);
      const x = rose.get(r.op) ?? { hours: 0, failed: 0 };
      x.hours += 1; x.failed += r.failed;
      rose.set(r.op, x);
    }
  }
  if (merged.size > OPS_MAX) throw new Error(`the day folds ${merged.size} operations, more than ${OPS_MAX}: no daily digest (OD-3)`);
  const ops = [...merged.values()].sort(byName);
  const risen = [...rose.entries()].map(([op, x]) => ({ op, ...x })).sort((a, b) => b.failed - a.failed || byName(a, b));
  return safeCounts({ schema: OPS_DIGEST_DAILY, day, hours: mine.length, ops, total: sum(ops), risen });
}

const count = (value: unknown): number | null => (typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null);
const COUNTERS = ["ok", "failed", "unknown"] as const;

/** FAC-SEM-166 and FAC-SEM-167 on one digest of either kind; any other kind is not this module's. */
export function opsDigestRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (!(kind === "ops-digest-hourly" || kind === "ops-digest-daily")) return undefined;
  const findings: Finding[] = [];
  const window = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-166", instancePath, message });
  const named = (instancePath: string, op: string) => {
    if (secretValue(op)) findings.push({ code: "FAC-SEM-167", instancePath, message: "an operation's name is shaped like a credential; it names an operation, never a value" });
    else if (hasHomePath(op)) findings.push({ code: "FAC-SEM-167", instancePath, message: "an operation's name holds a home folder; it names an operation, never a path" });
  };

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
      if (byOp.has(op)) window(`/ops/${index}/op`, `${shown(op, "this operation")} is counted once`);
      else byOp.set(op, entry);
      named(`/ops/${index}/op`, op);
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
    named(`${at}/op`, op);
    if (rose.has(op)) window(`${at}/op`, `${shown(op, "this operation")} is named once among the rises`);
    rose.add(op);
    const counted = byOp.get(op);
    if (counted === undefined) {
      window(`${at}/op`, `${shown(op, "this operation")} rose, so ops counts it`);
      continue;
    }
    const failed = count(entry.failed);
    const countedFailed = count(counted.failed);
    if (kind === "ops-digest-hourly") {
      const previous = count(entry.previous);
      if (failed !== null && countedFailed !== null && failed !== countedFailed) window(`${at}/failed`, `a rise names the hour's failures of ${shown(op, "this operation")}, ${countedFailed}`);
      if (failed !== null && previous !== null && !isRise(failed, previous)) window(at, `${failed} failures against ${previous} is no rise: at least ${RISE_MIN_FAILED} and ${RISE_FACTOR} times the hour before (none counts as one)`);
    } else {
      const risenHours = count(entry.hours);
      if (risenHours !== null && hours !== null && risenHours > hours) window(`${at}/hours`, `${shown(op, "this operation")} rose in at most the day's ${hours} hours`);
      if (failed !== null && risenHours !== null && failed < RISE_MIN_FAILED * risenHours) window(`${at}/failed`, `${risenHours} hours of rises hold at least ${RISE_MIN_FAILED * risenHours} failures`);
      if (failed !== null && countedFailed !== null && failed > countedFailed) window(`${at}/failed`, `the rises' failures are at most the day's failures of ${shown(op, "this operation")}, ${countedFailed}`);
    }
  }
  return findings;
}

// --- Where a collector reads the daily digests (DEC-0153 OD-9) ---

/** One folder of the ops-digest extension: `dir` inside the product's data folder, and the label sent with its lines. */
export interface DigestFolder { dir: string; source: string }

/**
 * What a collector reads of a descriptor's ops-digest declaration: the folders, or why it is not declared. `valid` is the
 * schema's answer; `usable` is whether `FAC-SEM-168` has no finding on the descriptor. A collector reads the folders only
 * when `usable` is true, and treats any other declaration as not declared and reports it.
 */
export type DigestFoldersView =
  | { declared: false }
  | { declared: true; valid: false; usable: false; errors: string[] }
  | { declared: true; valid: true; usable: boolean; folders: DigestFolder[] };

type DigestFoldersShape = { declared: false } | { declared: true; valid: false; errors: string[] } | { declared: true; valid: true; folders: DigestFolder[] };
let foldersShape: ValidateFunction | undefined;

/** The declaration's shape against its schema, as `actionsView` reads actions. */
function digestFoldersShape(descriptor: unknown): DigestFoldersShape {
  const extensions = isObject(descriptor) && isObject(descriptor.extensions) ? descriptor.extensions : undefined;
  if (extensions === undefined || !Object.hasOwn(extensions, EXTENSION_KEYS.opsDigest)) return { declared: false };
  foldersShape ??= createValidatorSync().getSchema(`${SCHEMA_PREFIX}schemas/service-ops-digest-extension.schema.json`) as ValidateFunction;
  const value = extensions[EXTENSION_KEYS.opsDigest];
  if (foldersShape(value) !== true) {
    return { declared: true, valid: false, errors: (foldersShape.errors as ErrorObject[]).map((error) => `${error.instancePath || "/"} ${error.keyword}`) };
  }
  return { declared: true, valid: true, folders: value as DigestFolder[] };
}

/**
 * The reader of extensions/ops-digest/0.1 in a service descriptor: the shape, and whether a collector may read it
 * (`usable`: `digestFoldersRules` returns no finding). Never `usable` for a declaration `FAC-SEM-168` refuses.
 */
export function digestFoldersView(descriptor: unknown): DigestFoldersView {
  const shape = digestFoldersShape(descriptor);
  if (!shape.declared) return shape;
  if (!shape.valid) return { ...shape, usable: false };
  return { ...shape, usable: digestFoldersRules(descriptor as JsonObject).length === 0 };
}

/**
 * Georgian Nuskhuri (U+2D00 to U+2D25), where the case mappings leave Asomtavruli (U+10A0 to U+10C5), mapped onto
 * Mkhedruli (U+10D0 to U+10F5), since HFS+ joins Asomtavruli with Mkhedruli; as DEC-0149's `foldSegment` maps it.
 */
const NUSKHURI = /[\u2d00-\u2d25]/gu;
const toMkhedruli = (letter: string): string => String.fromCodePoint((letter.codePointAt(0) as number) - 0x2d00 + 0x10d0);
/** Code points HFS+ ignores in a name, stripped before the fold exactly as DEC-0149's `foldSegment` strips them. */
const HFS_IGNORABLE = /[\u200c-\u200f\u202a-\u202e\u206a-\u206f\ufeff]/gu;
/** The same class without the global flag, for a stateless test. */
const HFS_IGNORABLE_ONE = /[\u200c-\u200f\u202a-\u202e\u206a-\u206f\ufeff]/u;
/**
 * A `dir` as a file system that folds case compares it, canonical caseless as DEC-0149's fold: each segment with the
 * code points HFS+ ignores removed (U+200C to U+200F, U+202A to U+202E, U+206A to U+206F, U+FEFF), then as NFD,
 * then lower, upper and lower case, then NFC, then Georgian Nuskhuri mapped onto Mkhedruli (so Asomtavruli meets
 * Mkhedruli, as HFS+ joins them), trailing dots and spaces dropped. So `Straße` meets `STRASSE` and
 * `Straẞe`, `σασ` meets `ΣΑΣ`, and a letter with U+0345 and another accent meets its precomposed form, which an
 * NFC-first fold splits. It also joins the dotless `ı` with `i` (and `I`): two dirs a file system may keep apart are
 * read as one, the safe direction, since the worst it does is a `FAC-SEM-168` finding on two folders.
 */
export const foldDir = (dir: string): string =>
  dir.split("/").map((segment) => segment.replace(HFS_IGNORABLE, "").normalize("NFD").toLowerCase().toUpperCase().toLowerCase().normalize("NFC").replace(NUSKHURI, toMkhedruli).replace(/[. ]+$/, "")).join("/");

const FOLDERS_PATH = `/extensions/${EXTENSION_KEYS.opsDigest.replace(/~/g, "~0").replace(/\//g, "~1")}`;
const folderFinding = (instancePath: string, message: string): Finding => ({ code: "FAC-SEM-168", instancePath, message });

/** A dir is hidden when it, or it with the code points HFS+ ignores removed, is credential-shaped or a home folder. */
const hiddenDir = (dir: string): boolean => hidden(dir) || hidden(dir.replace(HFS_IGNORABLE, ""));
/**
 * FAC-SEM-168 on a service descriptor (kind `service-descriptor`) that carries the ops-digest key: a remote placement
 * (no folder on this machine), or a local one that names no `paths.data` for `dir` to be relative to; a value that is
 * not its schema's (a reader treats it as not declared and reports it, as FAC-SEM-133 does for load); a `source` named
 * twice; a `dir` named twice, compared under canonical caseless matching (the code points HFS+ ignores removed, NFD, lower, upper and lower case, NFC, Georgian Nuskhuri onto Mkhedruli), trailing dots and spaces dropped, segment
 * by segment (one folder under two labels would be sent twice); a `dir` that holds a home folder (`hasHomePath`), the
 * `dir` read both as written and with the code points HFS+ ignores removed, for these findings and for hiding a class; a
 * `dir` with a segment made only of dots, spaces and code points HFS+ ignores (it folds to nothing; a tool that trims or
 * folds names may read it as empty, `.` or `..`); a
 * `dir` or a `source` shaped like a credential (`secretValue`). `hasHomePath` refuses a value in which `home`, `users`
 * or `Users` stands at the start, right after any character that is not an ASCII letter or digit (`_`, `-`, `.`, `:`
 * and `/` included) or right after `%2F` or `%252F`, and is followed by `/`, `\`, `%2F` or `%252F` (`F` in either case,
 * here and in the `%2F` or `%252F` before) and then an ASCII letter, digit or `_`; in which `-home-`, `-users-` or
 * `-Users-` stands at the start or after such a non-alphanumeric character and is followed by an ASCII letter or digit;
 * or in which `~` stands at the start or after whitespace as JavaScript's `\s` reads it, a double or single quote, `=`, `/` or `\`, followed by an
 * optional name (an ASCII letter or `_`, then ASCII letters, digits, `_`, `.` or `-`) and then `/`, `\` or the end. So
 * `users/digests`, `my_users/digests`, `my-users/digests` and `a/~b` are refused, and `user-digests` and `a/~1/x` pass.
 * A collector reads the folders only when this returns no finding (`digestFoldersView`'s `usable`), and treats any
 * other declaration as not declared.
 */
export function digestFoldersRules(descriptor: JsonObject): Finding[] {
  const view = digestFoldersShape(descriptor);
  if (!view.declared) return [];
  const findings: Finding[] = [];
  if (descriptor.placement === "remote") findings.push(folderFinding(FOLDERS_PATH, "a remote placement has no folder on this machine; the ops-digest key is a local descriptor's (DEC-0153 OD-9)"));
  else if (!(isObject(descriptor.paths) && typeof descriptor.paths.data === "string")) findings.push(folderFinding(FOLDERS_PATH, "a dir is relative to paths.data, which this descriptor does not name (DEC-0153 OD-9)"));
  if (!view.valid) {
    findings.push(folderFinding(FOLDERS_PATH, `the ops-digest declaration is invalid (${view.errors.join("; ")}); a reader treats it as not declared and reports it (DEC-0153 OD-9)`));
    return findings;
  }
  const seen = new Set<string>();
  // Two passes: each class of dirs that fold alike (foldDir) is hidden as a whole when any member is credential-shaped
  // or a home folder, so no duplicate message of that class names a value the class hides; the second pass only marks
  // which entries are duplicates (the first of a class is not).
  const hiddenClass = new Set<string>();
  for (const folder of view.folders) if (hiddenDir(folder.dir)) hiddenClass.add(foldDir(folder.dir));
  const dirs = new Set<string>();
  view.folders.forEach((folder, index) => {
    const at = `${FOLDERS_PATH}/${index}`;
    if (seen.has(folder.source)) findings.push(folderFinding(`${at}/source`, `${shown(folder.source, "this source")} is named twice as a source; each folder sends its own label`));
    seen.add(folder.source);
    const folded = foldDir(folder.dir);
    // "this dir" also when the dir holds a code point HFS+ ignores (a bidirectional control among them), so no invisible
    // control reaches a reader's output.
    if (dirs.has(folded)) findings.push(folderFinding(`${at}/dir`, `${hiddenClass.has(folded) || HFS_IGNORABLE_ONE.test(folder.dir) ? "this dir" : folder.dir} is named twice as a dir (compared under canonical caseless matching (the code points HFS+ ignores removed, NFD, lower, upper and lower case, NFC, Georgian Nuskhuri onto Mkhedruli), trailing dots and spaces dropped); its lines would be sent twice`));
    dirs.add(folded);
    if (secretValue(folder.source)) findings.push(folderFinding(`${at}/source`, "a source is shaped like a credential; it is a label, never a value"));
    // A segment made only of dots, spaces and code points HFS+ ignores folds to nothing; a tool that trims or folds names
    // as the fold does (Win32 path handling drops trailing dots and spaces; a reader that strips those code points
    // before joining) may read it as empty, '.' or '..', outside paths.data. Refused, the safe direction.
    if (folder.dir.split("/").some((segment) => foldDir(segment) === "")) findings.push(folderFinding(`${at}/dir`, "a dir segment folds to nothing (only dots, spaces or code points a file system may ignore); a tool may read it as '.' or '..', outside the product's data folder"));
    const bare = folder.dir.replace(HFS_IGNORABLE, "");
    if (secretValue(folder.dir) || secretValue(bare)) findings.push(folderFinding(`${at}/dir`, "a dir is shaped like a credential; it names a folder, never a value"));
    else if (hasHomePath(folder.dir) || hasHomePath(bare)) findings.push(folderFinding(`${at}/dir`, "a dir holds a home folder; it is relative to the product's data folder"));
  });
  return findings;
}
// #endregion ops-digest
