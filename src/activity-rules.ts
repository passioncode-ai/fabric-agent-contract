import { createHash, createHmac } from "node:crypto";
import { type Finding, type JsonObject, isObject, jsonEqual } from "./findings.js";
import { canonicalJson } from "./settings-backup.js";
import { type SeqRange, contiguousFrom, mergeRanges, rangesOf, uncovered } from "./seq-ranges.js";

// #region activity-rules — docs: docs/specification/activity.md#semantic-rules
/**
 * Activity telemetry (`fabric-activity/0.1`, `activity-summary/1`; DEC-0030). The schemas close every
 * object the contract defines and bound extension data; these rules cover what a schema cannot: a key
 * that names content or a person in any spelling, a home path in a value, an unknown cost written as
 * zero, a stream that is not a contiguous slice, an acknowledgement that does not add up, and a
 * summary that grows a person dimension. The key filter is best-effort — a deny-list of names — and
 * not a proof that no content passes; the schema's bounds on extension data are the stronger guard.
 */

/** Words that name content. A key matches when one of its words (camelCase, `_`, `-`, `.` split) is here. */
export const CONTENT_WORDS: ReadonlySet<string> = new Set([
  "prompt", "prompts", "response", "responses", "completion", "completions", "content", "contents", "text", "body",
  "message", "messages", "transcript", "stdin", "stdout", "stderr", "argv", "args", "cmd", "command", "diff", "patch",
  "snippet", "note", "notes", "comment", "comments", "title", "cwd", "clipboard", "screenshot", "query", "queries",
  "search", "keystroke", "keystrokes", "url", "urls"
]);
/** Adjacent word pairs that name content. */
export const CONTENT_PAIRS: ReadonlySet<string> = new Set(["tool_input", "tool_output", "command_line", "file_content", "window_title"]);

/** Words that describe a person or rank one. `user` is handled apart: an event's own `/user` is the one opaque reference allowed. */
export const PERSON_WORDS: ReadonlySet<string> = new Set([
  "person", "persons", "people", "email", "mail", "phone", "team", "teams", "department", "dept", "manager", "author",
  "username", "login", "score", "scores", "rating", "ratings", "rank", "ranking", "reviewer", "reviewers", "salary", "hr",
  "fullname", "realname", "nickname", "surname", "displayname", "owner", "owners", "assignee", "assignees"
]);
/** Adjacent word pairs that describe a person. */
export const PERSON_PAIRS: ReadonlySet<string> = new Set(["display_name", "full_name", "first_name", "last_name", "given_name", "family_name", "nick_name", "job_title", "org_unit", "reports_to", "real_name"]);
/** Word prefixes that describe a person's standing or output: matched against the start of a word. A measurement such as
 *  `performanceMs` or a count such as `reviewCount` names no person and is not matched. */
export const PERSON_PREFIXES: readonly string[] = ["employ", "productiv", "assess", "apprais"];

/**
 * A home directory inside a value, in the user-name segment form: a home root (`Users`, `users`, `home`) between two
 * separators of the same kind, followed by a name. Matched forms:
 * - slash forms, absolute or relative, plain or URL-encoded once or twice: `/Users/<name>`, `users/<name>`,
 *   `home/<name>`, `C:\Users\<name>`, `%2FUsers%2F<name>`, `%252FUsers%252F<name>`;
 * - the dash forms runtimes write into file names: `-Users-<name>-`, `C--Users-<name>`, `-home-<name>-`;
 * - tilde forms: `~/`, `~<name>/`.
 * `Users-guide`, `/Users-guide`, `feature/home-page` and `homework` have no such segment and are not matched.
 *
 * This is defence in depth, not the control: a path wrapped in base64, hashed without a key, or encoded any other way
 * is undetectable by design. The control is the rule that a path-derived key is `hmac-sha256:` under the device's
 * telemetry key (`pathSourceKey`) and that no field carries a path (DEC-0030).
 */
const SLASH = String.raw`(?:[\/\\]|%(?:25)?2[fF])`;
export const HOME_PATH: readonly RegExp[] = [
  new RegExp(String.raw`(?:^|[^A-Za-z0-9]|%(?:25)?2[fF])(?:[Uu]sers|home)${SLASH}[A-Za-z0-9_]`),
  /(?:^|[\/\\:-])-(?:[Uu]sers|home)-[A-Za-z0-9]/,
  /(?:^|[\s"'=\/\\])~(?:[A-Za-z_][A-Za-z0-9_.-]*)?(?:[\/\\]|$)/
];
export const hasHomePath = (value: string) => HOME_PATH.some((pattern) => pattern.test(value));

/** The words of a key: split at `.`, `_`, `-`, whitespace and camelCase boundaries, lower-cased. */
export function keyWords(key: string): string[] {
  return key.split(/[._\-\s]+|(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/).filter(Boolean).map((word) => word.toLowerCase());
}

export interface Forbidden { path: string; kind: "content" | "person" | "path"; key: string }

function classify(key: string): "content" | "person" | "user" | null {
  const words = keyWords(key);
  const pairs = words.slice(1).map((word, i) => `${words[i]}_${word}`);
  if (words.some((w) => CONTENT_WORDS.has(w)) || pairs.some((p) => CONTENT_PAIRS.has(p))) return "content";
  if (words.some((w) => PERSON_WORDS.has(w) || PERSON_PREFIXES.some((prefix) => w.startsWith(prefix))) || pairs.some((p) => PERSON_PAIRS.has(p))) return "person";
  if (words.includes("user")) return "user";
  return null;
}

/** Every content key, person key and home-path value under `value`. `userAllowedAt` lists the paths whose `user` property is the allowed opaque reference. */
export function forbiddenKeys(value: unknown, at: string, userAllowedAt: ReadonlySet<string>): Forbidden[] {
  const found: Forbidden[] = [];
  const walk = (node: unknown, path: string, key: string) => {
    if (typeof node === "string") { if (hasHomePath(node)) found.push({ path, kind: "path", key }); return; }
    if (Array.isArray(node)) { node.forEach((item, i) => walk(item, `${path}/${i}`, key)); return; }
    if (!isObject(node)) return;
    for (const [child, inner] of Object.entries(node)) {
      const here = `${path}/${child}`;
      const verdict = classify(child);
      if (verdict === "content" || verdict === "person") found.push({ path: here, kind: verdict, key: child });
      else if (verdict === "user" && !(child === "user" && userAllowedAt.has(path))) found.push({ path: here, kind: "person", key: child });
      walk(inner, here, child);
    }
  };
  walk(value, at, "");
  return found;
}

/** The `eventId` of an event read from a source that can be read again: `sha256:` of the canonical `{source, key}`. */
export function activityEventId(source: string, sourceKey: string): string {
  return `sha256:${createHash("sha256").update(canonicalJson({ key: sourceKey, source }), "utf8").digest("hex")}`;
}

/**
 * The `sourceKey` of a record identified by its place in a file: `hmac-sha256:` of the canonical
 * `{offset, path}` (path relative to the runtime's own directory) under the device's telemetry key —
 * 32 random bytes the collector keeps and never sends. A plain path would carry the person's home
 * directory; the key keeps a dictionary of common paths from reversing it.
 */
export function pathSourceKey(telemetryKey: Uint8Array, relativePath: string, offset: number): string {
  return `hmac-sha256:${createHmac("sha256", telemetryKey).update(canonicalJson({ offset, path: relativePath }), "utf8").digest("hex")}`;
}

/** `git.branch` when the policy asks for a hash: `hmac-sha256:` of the name under the device's telemetry key. */
export function hashedBranch(telemetryKey: Uint8Array, branch: string): string {
  return `hmac-sha256:${createHmac("sha256", telemetryKey).update(branch, "utf8").digest("hex")}`;
}

const events = (value: JsonObject) => (Array.isArray(value.events) ? value.events.filter(isObject) : []);
const collectorOf = (event: JsonObject) => (isObject(event.collector) ? event.collector : {});
const deviceId = (value: JsonObject) => (isObject(value.device) ? String(value.device.id) : "");
/** A stream is (device.id, collector.id, collector.epoch): collector ids are unique only within their device. */
export const streamKey = (device: string, collector: JsonObject) => `${device}/${String(collector.id)}#${String(collector.epoch)}`;
const num = (x: unknown) => (typeof x === "number" ? x : 0);
const data = (event: JsonObject) => (isObject(event.data) ? event.data : {});
const MAX_U64 = (1n << 64n) - 1n;

/** FAC-SEM-037: no content key, no person key and no home path at any depth, extension data included. */
function noContentOrPerson(value: JsonObject, roots: string[]): Finding[] {
  return forbiddenKeys(value, "", new Set(roots)).map(({ path, kind, key }) => ({
    code: "FAC-SEM-037",
    instancePath: path,
    message: kind === "content"
      ? `${key} names content; activity telemetry records when and how much, never what was said or shown`
      : kind === "person"
        ? `${key} describes a person; activity telemetry names a person only by the opaque /user reference`
        : "a value carries a home directory, plain or encoded, which names the person whose home it is: hash a path-derived key under the device's telemetry key"
  }));
}

/** FAC-SEM-038 for one event: a zero estimate for a call that used tokens is an unknown cost. */
function eventCost(event: JsonObject, at: string): Finding[] {
  if (event.kind !== "usage.line") return [];
  const line = data(event);
  const cost = isObject(line.cost) ? line.cost : {};
  const tokens = isObject(line.tokens) ? line.tokens : {};
  const used = ["input", "output", "cacheRead", "cacheWrite"].some((f) => num(tokens[f]) > 0);
  if (cost.usd === 0 && used && cost.basis === "client-estimate") {
    return [{ code: "FAC-SEM-038", instancePath: `${at}/data/cost/usd`, message: "a zero client estimate for a call that used tokens is an unknown cost: report null" }];
  }
  return [];
}

/** FAC-SEM-038 across a batch: one dedupeKey is one call, so every line that names it agrees. */
function batchCost(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const seen = new Map<string, JsonObject>();
  events(value).forEach((event, i) => {
    findings.push(...eventCost(event, `/events/${i}`));
    if (event.kind !== "usage.line") return;
    const line = data(event);
    const key = String(line.dedupeKey ?? "");
    const first = seen.get(key);
    if (!first) { seen.set(key, line); return; }
    if (first.model !== line.model || !jsonEqual(first.tokens, line.tokens) || !jsonEqual(first.cost, line.cost)) {
      findings.push({ code: "FAC-SEM-038", instancePath: `/events/${i}/data/dedupeKey`, message: `two lines name the call ${key} with different model, tokens or cost` });
    }
  });
  return findings;
}

/** FAC-SEM-038 for a summary: unpriced lines make the cost unknown or a lower bound, never zero. */
function summaryCost(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const cells = Array.isArray(value.cells) ? value.cells.filter(isObject) : [];
  cells.forEach((cell, i) => {
    const at = `/cells/${i}`;
    const counts = isObject(cell.counts) ? cell.counts : {};
    const usage = isObject(cell.usage) ? cell.usage : {};
    const cost = isObject(usage.cost) ? usage.cost : {};
    const lines = num(counts.usageLines), unpriced = num(counts.unpricedLines);
    if (unpriced > lines) findings.push({ code: "FAC-SEM-038", instancePath: `${at}/counts/unpricedLines`, message: "more unpriced lines than lines" });
    if (lines > 0 && unpriced === lines && cost.usd !== null) findings.push({ code: "FAC-SEM-038", instancePath: `${at}/usage/cost/usd`, message: "every line is unpriced, so the cost is unknown (null), not a number" });
    if (unpriced < lines && cost.usd === null) findings.push({ code: "FAC-SEM-038", instancePath: `${at}/usage/cost/usd`, message: "priced lines carry a cost; null is only for a cell with no priced line" });
  });
  return findings;
}

/** The dropped ranges an overflow event names. */
export function overflowRanges(event: JsonObject): SeqRange[] {
  if (event.kind !== "buffer.overflow") return [];
  const dropped = isObject(data(event).dropped) ? data(event).dropped as JsonObject : {};
  return rangesOf(dropped.ranges);
}

/** FAC-SEM-039 for one event: clocks in range, an interval that ends after it starts, an overflow that accounts for earlier seqs, a derived id that is the derivation. */
function eventIntegrity(event: JsonObject, at: string): Finding[] {
  const findings: Finding[] = [];
  const flag = (path: string, message: string) => findings.push({ code: "FAC-SEM-039", instancePath: `${at}${path}`, message });
  const d = data(event);
  if (typeof event.monotonicNs === "string" && /^\d+$/.test(event.monotonicNs) && BigInt(event.monotonicNs) > MAX_U64) flag("/monotonicNs", "a monotonic reading fits in 64 bits");
  if (event.kind === "session.interval" && typeof d.start === "string" && typeof d.end === "string" && Date.parse(d.end) < Date.parse(d.start)) {
    flag("/data/end", "an interval ends at or after its start");
  }
  if (event.kind === "buffer.overflow" && isObject(d.dropped)) {
    const raw = rangesOf(d.dropped.ranges);
    const merged = mergeRanges(raw);
    if (raw.some(([from, to]) => to < from)) flag("/data/dropped/ranges", "a dropped range runs forward");
    else if (merged.length !== raw.length) flag("/data/dropped/ranges", "dropped ranges do not overlap or touch; merge them");
    const size = merged.reduce((n, [from, to]) => n + (to - from + 1), 0);
    if (num(d.dropped.events) !== size) flag("/data/dropped/events", `${String(d.dropped.events)} dropped events for ranges that hold ${size}`);
    if (merged.some(([, to]) => to >= num(event.seq))) flag("/data/dropped/ranges", "an overflow names only seqs assigned before its own");
  }
  if (typeof event.sourceKey === "string" && typeof event.source === "string" && event.eventId !== activityEventId(event.source, event.sourceKey)) {
    flag("/eventId", "an event that names its sourceKey carries the derived id, so a re-read of the source yields the same eventId");
  }
  return findings;
}

/** FAC-SEM-039 for a batch: each stream is a contiguous slice of the collector's buffer (consecutive seqs), and no event is sent twice. */
function batchIntegrity(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const last = new Map<string, number>();
  const ids = new Set<string>();
  const device = deviceId(value);
  events(value).forEach((event, i) => {
    const at = `/events/${i}`;
    findings.push(...eventIntegrity(event, at));
    const id = String(event.eventId ?? "");
    if (ids.has(id)) findings.push({ code: "FAC-SEM-039", instancePath: `${at}/eventId`, message: `${id} appears twice in one batch` });
    ids.add(id);
    const key = streamKey(device, collectorOf(event));
    const seq = num(event.seq);
    const before = last.get(key);
    if (before !== undefined && seq !== before + 1) {
      findings.push({ code: "FAC-SEM-039", instancePath: `${at}/seq`, message: `seq ${seq} after ${before} in ${key}: a batch carries a contiguous slice of each stream, oldest first` });
    }
    last.set(key, seq);
  });
  return findings;
}

/** What a receiver holds about one stream of one device, across batches: seqs held (received, accepted or rejected), seqs
 *  accounted for by overflows or a check-in's `dropped`, and the last `bufferedFrom` the device reported. */
export interface StreamState { collector: { id: string; epoch: number }; held: SeqRange[]; accounted: SeqRange[]; bufferedFrom?: number }

const stateKey = (collector: JsonObject) => `${String(collector.id)}#${String(collector.epoch)}`;

/** The streams of one device after `batch` and `checkIn`, merged into what the receiver already holds. Ranges stay merged. */
export function mergeStreams(known: readonly StreamState[], batch: JsonObject | null, checkIn: JsonObject | null): StreamState[] {
  const streams = new Map<string, StreamState>();
  for (const s of known) streams.set(stateKey(s.collector as unknown as JsonObject), { ...s, held: [...s.held], accounted: [...s.accounted] });
  const stream = (collector: JsonObject) => {
    const key = stateKey(collector);
    let s = streams.get(key);
    if (!s) { s = { collector: { id: String(collector.id), epoch: num(collector.epoch) }, held: [], accounted: [] }; streams.set(key, s); }
    return s;
  };
  for (const event of batch ? events(batch) : []) {
    const s = stream(collectorOf(event));
    s.held.push([num(event.seq), num(event.seq)]);
    s.accounted.push(...overflowRanges(event));
  }
  for (const c of checkIn && Array.isArray(checkIn.collectors) ? checkIn.collectors.filter(isObject) : []) {
    const s = stream(isObject(c.collector) ? c.collector : {});
    s.accounted.push(...rangesOf(c.dropped));
    if (typeof c.bufferedFrom === "number") s.bufferedFrom = Math.max(s.bufferedFrom ?? 0, c.bufferedFrom);
  }
  return [...streams.values()].map((s) => ({ ...s, held: mergeRanges(s.held), accounted: mergeRanges(s.accounted) }));
}

export interface StreamAck { collector: { id: string; epoch: number }; seq: number; held: SeqRange[] }

/**
 * The ack of each stream after `batch`, over everything the receiver holds for it across batches: `seq` is the highest
 * seq up to which every seq is consumed — held, rejected (consumed with a rejection, never resent) or accounted for by an
 * overflow — and `held` the consumed ranges above it, which the device may drop as well.
 */
export function contiguousAcks(known: readonly StreamState[], batch: JsonObject): StreamAck[] {
  return mergeStreams(known, batch, null).map((s) => {
    const covered = mergeRanges([...s.held, ...s.accounted]);
    const seq = contiguousFrom(covered, 0);
    return { collector: s.collector, seq, held: covered.filter(([from]) => from > seq + 1) };
  });
}

const asStreams = (value: unknown): StreamState[] => (Array.isArray(value) ? value.filter(isObject) : []).map((s) => ({
  collector: (isObject(s.collector) ? s.collector : {}) as StreamState["collector"],
  held: rangesOf(s.held),
  accounted: rangesOf(s.accounted),
  ...(typeof s.bufferedFrom === "number" ? { bufferedFrom: s.bufferedFrom } : {})
}));

/** FAC-SEM-039 for an acknowledgement: `{known?, batch, ack}` — `known` is the receiver's stream state before the batch;
 *  the counts add up, each ack is the stream's consumed position over all batches, and `held` claims only consumed seqs. */
function ackIntegrity(value: JsonObject): Finding[] {
  const known = asStreams(value.known);
  const batch = isObject(value.batch) ? value.batch : {};
  const ack = isObject(value.ack) ? value.ack : {};
  const acks = Array.isArray(ack.acks) ? ack.acks.filter(isObject) : [];
  const rejected = Array.isArray(ack.rejected) ? ack.rejected.filter(isObject) : [];
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-039", instancePath, message });
  const list = events(batch);
  if (deviceId(ack) !== deviceId(batch)) flag("/ack/device/id", "the ack names another device than the batch");
  const total = num(ack.accepted) + num(ack.duplicates) + rejected.length;
  if (total !== list.length) flag("/ack", `accepted + duplicates + rejected is ${total} for ${list.length} events`);
  const ids = new Set(list.map((event) => String(event.eventId)));
  rejected.forEach((entry, i) => { if (!ids.has(String(entry.eventId))) flag(`/ack/rejected/${i}/eventId`, "a rejection names an event the batch did not carry"); });
  const device = deviceId(batch);
  const expected = new Map(contiguousAcks(known, batch).map((p) => [streamKey(device, p.collector as unknown as JsonObject), p]));
  acks.forEach((entry, i) => {
    const key = streamKey(device, isObject(entry.collector) ? entry.collector : {});
    const want = expected.get(key);
    if (want === undefined) { flag(`/ack/acks/${i}`, `the ack names ${key}, a stream the receiver never saw`); return; }
    if (num(entry.seq) !== want.seq) flag(`/ack/acks/${i}/seq`, `every seq of ${key} up to ${want.seq} is consumed, so the ack is ${want.seq}, not ${String(entry.seq)}`);
    const claimed = rangesOf(entry.held);
    if (claimed.some(([from, to]) => from <= want.seq || uncovered(want.held, from, to).length > 0)) {
      flag(`/ack/acks/${i}/held`, `held names seqs of ${key} the receiver has not consumed, or seqs at or below the ack`);
    }
  });
  const named = new Set(acks.map((entry) => streamKey(device, isObject(entry.collector) ? entry.collector : {})));
  for (const event of list) {
    const key = streamKey(device, collectorOf(event));
    if (!named.has(key)) { flag("/ack/acks", `the ack omits ${key}, a stream the batch carried`); named.add(key); }
  }
  return findings;
}

/** FAC-SEM-040: a summary has no person dimension, one cell per dimension tuple, and its days inside its range. */
function summaryShape(value: JsonObject): Finding[] {
  const findings: Finding[] = forbiddenKeys(value, "", new Set()).map(({ path, key, kind }) => ({
    code: "FAC-SEM-040", instancePath: path, message: kind === "path" ? "a summary carries no path" : `${key}: a summary has no person dimension and no content`
  }));
  if (isObject(value.producer) && value.producer.kind !== undefined) findings.push({ code: "FAC-SEM-040", instancePath: "/producer/kind", message: "a summary is built by a receiver from many devices; a device never produces one" });
  const from = String(value.from ?? ""), to = String(value.to ?? "");
  if (from > to) findings.push({ code: "FAC-SEM-040", instancePath: "/to", message: `the range ends (${to}) before it starts (${from})` });
  const cells = Array.isArray(value.cells) ? value.cells.filter(isObject) : [];
  const tuples = new Set<string>();
  cells.forEach((cell, i) => {
    const tuple = JSON.stringify([cell.agent, cell.skill ?? null, cell.project, cell.day, cell.outcome]);
    if (tuples.has(tuple)) findings.push({ code: "FAC-SEM-040", instancePath: `/cells/${i}`, message: "two cells share agent, skill, project, day and outcome" });
    tuples.add(tuple);
    const day = String(cell.day ?? "");
    if (day < from || day > to) findings.push({ code: "FAC-SEM-040", instancePath: `/cells/${i}/day`, message: `${day} is outside ${from}…${to}` });
  });
  return findings;
}

export function activityRules(kind: string, value: unknown): Finding[] | undefined {
  if (!isObject(value)) return undefined;
  if (kind === "telemetry-event") return [...noContentOrPerson(value, [""]), ...eventCost(value, ""), ...eventIntegrity(value, "")];
  if (kind === "activity-batch") return [...noContentOrPerson(value, events(value).map((_, i) => `/events/${i}`)), ...batchCost(value), ...batchIntegrity(value)];
  if (kind === "activity-ack") return ackIntegrity(value);
  if (kind === "activity-summary") return [...summaryCost(value), ...summaryShape(value)];
  return undefined;
}
// #endregion activity-rules
