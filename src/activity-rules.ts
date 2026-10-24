import { createHash, createHmac } from "node:crypto";
import { type Finding, type JsonObject, indexed, isObject, jsonEqual, show } from "./findings.js";
import { normalIdentifier } from "./identifiers.js";
import { rfc8785, settingsCanonicalJson } from "./canonical.js";
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
 * - the dash forms runtimes write into file names: `-Users-<name>-`, `C--Users-<name>`, `-home-<name>-`, after any
 *   character that is not an ASCII letter or digit (`x.-Users-<name>`, `p@-Users-<name>`, DEC-0105);
 * - tilde forms: `~/`, `~<name>/`.
 * `Users-guide`, `/Users-guide`, `feature/home-page` and `homework` have no such segment and are not matched.
 *
 * This is defence in depth, not the control: a path wrapped in base64, hashed without a key, or encoded any other way
 * is undetectable by design. The control is the rule that a path-derived key is `hmac-sha256:` under the device's
 * telemetry key (`pathSourceKey`) and that no field carries a path (DEC-0030).
 *
 * Scope (CT-109): the value scanner of FAC-SEM-037 and FAC-SEM-040 (`forbiddenKeys`), FAC-SEM-128 (`src/node-summary.ts`)
 * and FAC-SEM-138 (`src/credentials.ts`). It reads values that may hold ordinary words, so it matches only the user-name
 * segment form, and the dash form only after a character that is not an ASCII letter or digit: `my-users-list` passes.
 * The `sourceKey` schema pattern (`activity-common`) repeats its dash clause over the key's alphabet, and a test in
 * `test/activity-rules.test.ts` pins that the two refuse the same keys. Two other rules draw other boundaries: the
 * device-common `detail` pattern refuses the dash form after any character (one line of free text with no path at all),
 * and FAC-SEM-103's own pattern in `src/proposal-rules.ts` has no dash form. Changing any of the three is a decision.
 */
const SLASH = String.raw`(?:[\/\\]|%(?:25)?2[fF])`;
export const HOME_PATH: readonly RegExp[] = [
  new RegExp(String.raw`(?:^|[^A-Za-z0-9]|%(?:25)?2[fF])(?:[Uu]sers|home)${SLASH}[A-Za-z0-9_]`),
  // DEC-0105: any character that is not an ASCII letter or digit may precede the dashed form (`x.-Users-…`, `p@-Users-…`).
  /(?:^|[^A-Za-z0-9])-(?:[Uu]sers|home)-[A-Za-z0-9]/,
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
  return `sha256:${createHash("sha256").update(settingsCanonicalJson({ key: sourceKey, source }), "utf8").digest("hex")}`;
}

/**
 * The `sourceKey` of a record identified by its place in a file: `hmac-sha256:` of the canonical
 * `{offset, path}` (path relative to the runtime's own directory) under the device's telemetry key —
 * 32 random bytes the collector keeps and never sends. A plain path would carry the person's home
 * directory; the key keeps a dictionary of common paths from reversing it.
 */
export function pathSourceKey(telemetryKey: Uint8Array, relativePath: string, offset: number): string {
  return `hmac-sha256:${createHmac("sha256", telemetryKey).update(settingsCanonicalJson({ offset, path: relativePath }), "utf8").digest("hex")}`;
}

/** `git.branch` when the policy asks for a hash: `hmac-sha256:` of the name under the device's telemetry key. */
export function hashedBranch(telemetryKey: Uint8Array, branch: string): string {
  return `hmac-sha256:${createHmac("sha256", telemetryKey).update(branch, "utf8").digest("hex")}`;
}

/**
 * The `tenantRef` of one of an organization's provider tenants (DEC-0052, DEC-0053): `sha256:` and the hex SHA-256 of the
 * RFC 8785 form of `{provider, tenant}`. The policy lists the organization's tenants by it (`accounts.tenants`); a collector
 * computes it for a session's tenant and, when it matches, labels the event `account.class: organization`. It never sends
 * the reference of a tenant the policy does not list, so no hash of a person's own account leaves the device.
 */
export function tenantRef(provider: string, tenant: string): string {
  return `sha256:${createHash("sha256").update(rfc8785({ provider, tenant }), "utf8").digest("hex")}`;
}

const events = (value: JsonObject) => (Array.isArray(value.events) ? value.events.filter(isObject) : []);
const collectorOf = (event: JsonObject) => (isObject(event.collector) ? event.collector : {});
const deviceId = (value: JsonObject) => (isObject(value.device) ? show(value.device.id) : "");
/** A stream is (device.id, collector.id, collector.epoch): collector ids are unique only within their device. */
export const streamKey = (device: string, collector: JsonObject) => `${device}/${show(collector.id)}#${show(collector.epoch)}`;
const num = (x: unknown) => (typeof x === "number" ? x : 0);
const data = (event: JsonObject) => (isObject(event.data) ? event.data : {});
const MAX_U64 = (1n << 64n) - 1n;
/** The smallest population a published summary cell may cover (operator decision 2026-10-08, DEC-0030). */
export const MIN_POPULATION = 3;

/**
 * The population of a set of events: distinct subjects, where an event's subject is its `user.id` when it carries one
 * and its `session.id` otherwise. A summary cell is published only when its population is at least MIN_POPULATION.
 * A `session.annotation` adds no subject (DEC-0068): it never counts, so it cannot pad a cell to the minimum.
 */
export function population(list: readonly JsonObject[]): number {
  const subjects = new Set<string>();
  for (const event of list) {
    if (event.kind === "session.annotation") continue;
    if (isObject(event.user) && typeof event.user.id === "string") subjects.add(`user:${event.user.id}`);
    else if (isObject(event.session) && typeof event.session.id === "string") subjects.add(`session:${event.session.id}`);
  }
  return subjects.size;
}

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

/**
 * FAC-SEM-038 for a grant's daily usage (DEC-0082), as for a summary cell: no more unpriced calls than calls, and the cost
 * is `null` exactly when every call is unpriced — an unknown cost is never `0`, and priced calls carry their cost.
 */
function grantUsageCost(event: JsonObject, at: string): Finding[] {
  const d = data(event);
  if (typeof d.calls !== "number" || typeof d.unpricedCalls !== "number") return [];
  const flag = (path: string, message: string): Finding => ({ code: "FAC-SEM-038", instancePath: `${at}/data${path}`, message });
  if (d.unpricedCalls > d.calls) return [flag("/unpricedCalls", "more unpriced calls than calls")];
  if (d.unpricedCalls === d.calls && d.costUsd !== null) return [flag("/costUsd", "every call is unpriced, so the cost is unknown (null), not a number")];
  if (d.unpricedCalls < d.calls && d.costUsd === null) return [flag("/costUsd", "priced calls carry a cost; null is only for a day with no priced call")];
  return [];
}

/** FAC-SEM-038 for one event: a zero estimate for a call that used tokens is an unknown cost; a grant's daily usage as `grantUsageCost` says. */
function eventCost(event: JsonObject, at: string): Finding[] {
  if (event.kind === "grant.usage") return grantUsageCost(event, at);
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
  indexed(value.events).forEach(([event, i]) => {
    findings.push(...eventCost(event, `/events/${i}`));
    if (event.kind !== "usage.line") return;
    const line = data(event);
    const key = show(line.dedupeKey ?? "");
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
  indexed(value.cells).forEach(([cell, i]) => {
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
    if (num(d.dropped.events) !== size) flag("/data/dropped/events", `${show(d.dropped.events)} dropped events for ranges that hold ${size}`);
    if (merged.some(([, to]) => to >= num(event.seq))) flag("/data/dropped/ranges", "an overflow names only seqs assigned before its own");
  }
  if (event.kind === "policy.violation" && typeof d.day === "string" && typeof event.occurred === "string" && !event.occurred.startsWith(`${d.day}T`)) {
    flag("/occurred", "a policy violation carries its UTC day and no finer time: occurred is that day's midnight (DEC-0052)");
  }
  if (event.kind === "grant.usage" && typeof d.day === "string" && typeof event.occurred === "string" && !event.occurred.startsWith(`${d.day}T`)) {
    flag("/occurred", "a grant's daily usage carries its UTC day and no finer time: occurred is that day's midnight (DEC-0082)");
  }
  if (typeof event.sourceKey === "string" && typeof event.source === "string") {
    // CT-25 (DEC-0052): the settings form refuses a lone surrogate, so the derivation is refused, never thrown.
    let derived: string | null = null;
    try { derived = activityEventId(event.source, event.sourceKey); } catch { flag("/sourceKey", "a source or sourceKey with a lone surrogate has no canonical form, so no eventId derives from it"); }
    if (derived !== null && event.eventId !== derived) flag("/eventId", "an event that names its sourceKey carries the derived id, so a re-read of the source yields the same eventId");
  }
  return findings;
}

/**
 * FAC-SEM-039 for a batch: each stream is a contiguous slice of the collector's buffer (consecutive seqs), and no event is
 * sent twice — neither under one id nor, for a grant's daily usage, one (day, grantId) of one stream twice, the grant's id
 * compared by normal form (DEC-0082, DEC-0076).
 */
function batchIntegrity(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const last = new Map<string, number>();
  const ids = new Set<string>();
  const grantDays = new Set<string>();
  const device = deviceId(value);
  indexed(value.events).forEach(([event, i]) => {
    const at = `/events/${i}`;
    findings.push(...eventIntegrity(event, at));
    const id = show(event.eventId ?? "");
    if (ids.has(id)) findings.push({ code: "FAC-SEM-039", instancePath: `${at}/eventId`, message: `${id} appears twice in one batch` });
    ids.add(id);
    const key = streamKey(device, collectorOf(event));
    if (event.kind === "grant.usage") {
      const d = data(event);
      // One grant is one row whatever its revision, and two spellings of its id are one grant (DEC-0076).
      const day = JSON.stringify([key, d.day, normalIdentifier(d.grantId) ?? d.grantId]);
      if (grantDays.has(day)) findings.push({ code: "FAC-SEM-039", instancePath: `${at}/data/grantId`, message: `the usage of grant ${show(d.grantId)} on ${show(d.day)} is sent twice in one stream: one event per day and grant` });
      grantDays.add(day);
    }
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
 *  accounted for by overflow events, seqs a check-in reports `dropped` whose overflow has not arrived (`pending`), and the
 *  last `bufferedFrom` the device reported. Only held and accounted seqs are consumed, so only they move an ack; a pending
 *  range is the device's word until its overflow event arrives, and counts for tamper evidence only (F-B-108, DEC-0052). */
export interface StreamState { collector: { id: string; epoch: number }; held: SeqRange[]; accounted: SeqRange[]; pending?: SeqRange[]; bufferedFrom?: number }

const stateKey = (collector: JsonObject) => `${show(collector.id)}#${show(collector.epoch)}`;

/** The streams of one device after `batch` and `checkIn`, merged into what the receiver already holds. Ranges stay merged. */
export function mergeStreams(known: readonly StreamState[], batch: JsonObject | null, checkIn: JsonObject | null): StreamState[] {
  const streams = new Map<string, StreamState>();
  for (const s of known) streams.set(stateKey(s.collector as unknown as JsonObject), { ...s, held: [...s.held], accounted: [...s.accounted], pending: [...(s.pending ?? [])] });
  const stream = (collector: JsonObject) => {
    const key = stateKey(collector);
    let s = streams.get(key);
    if (!s) { s = { collector: { id: show(collector.id), epoch: num(collector.epoch) }, held: [], accounted: [], pending: [] }; streams.set(key, s); }
    return s;
  };
  for (const event of batch ? events(batch) : []) {
    const s = stream(collectorOf(event));
    s.held.push([num(event.seq), num(event.seq)]);
    s.accounted.push(...overflowRanges(event));
  }
  for (const c of checkIn && Array.isArray(checkIn.collectors) ? checkIn.collectors.filter(isObject) : []) {
    const s = stream(isObject(c.collector) ? c.collector : {});
    s.pending!.push(...rangesOf(c.dropped));
    if (typeof c.bufferedFrom === "number") s.bufferedFrom = Math.max(s.bufferedFrom ?? 0, c.bufferedFrom);
  }
  return [...streams.values()].map((s) => ({ ...s, held: mergeRanges(s.held), accounted: mergeRanges(s.accounted), pending: mergeRanges(s.pending ?? []) }));
}

export interface StreamAck { collector: { id: string; epoch: number }; seq: number; held: SeqRange[] }

/**
 * The ack of each stream after `batch`, over everything the receiver holds for it across batches: `seq` is the highest
 * seq up to which every seq is consumed — held, rejected (consumed with a rejection, never resent) or accounted for by an
 * overflow event — and `held` the consumed ranges above it, which the device may drop as well. A check-in's `dropped`
 * ranges (`pending`) are not consumed and never move an ack.
 */
export function contiguousAcks(known: readonly StreamState[], batch: JsonObject): StreamAck[] {
  return mergeStreams(known, batch, null).map((s) => {
    const covered = mergeRanges([...s.held, ...s.accounted]);
    const seq = contiguousFrom(covered, 0);
    return { collector: s.collector, seq, held: covered.filter(([from]) => from > seq + 1) };
  });
}

/** Stream states as a receiver stores them (`[{collector, held, accounted, pending?, bufferedFrom?}]`). */
export const asStreams = (value: unknown): StreamState[] => (Array.isArray(value) ? value.filter(isObject) : []).map((s) => ({
  collector: (isObject(s.collector) ? s.collector : {}) as StreamState["collector"],
  held: rangesOf(s.held),
  accounted: rangesOf(s.accounted),
  pending: rangesOf(s.pending),
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
  const ids = new Set(list.map((event) => show(event.eventId)));
  rejected.forEach((entry, i) => { if (!ids.has(show(entry.eventId))) flag(`/ack/rejected/${i}/eventId`, "a rejection names an event the batch did not carry"); });
  const device = deviceId(batch);
  const expected = new Map(contiguousAcks(known, batch).map((p) => [streamKey(device, p.collector as unknown as JsonObject), p]));
  acks.forEach((entry, i) => {
    const key = streamKey(device, isObject(entry.collector) ? entry.collector : {});
    const want = expected.get(key);
    if (want === undefined) { flag(`/ack/acks/${i}`, `the ack names ${key}, a stream the receiver never saw`); return; }
    if (num(entry.seq) !== want.seq) flag(`/ack/acks/${i}/seq`, `every seq of ${key} up to ${want.seq} is consumed, so the ack is ${want.seq}, not ${show(entry.seq)}`);
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

/** FAC-SEM-040: a summary has no person dimension, publishes no cell below its minimum population, has one cell per
 *  dimension tuple and at most one other cell per day, and keeps its days inside its range. */
function summaryShape(value: JsonObject): Finding[] {
  const findings: Finding[] = forbiddenKeys(value, "", new Set()).map(({ path, key, kind }) => ({
    code: "FAC-SEM-040", instancePath: path, message: kind === "path" ? "a summary carries no path" : `${key}: a summary has no person dimension and no content`
  }));
  if (isObject(value.producer) && value.producer.kind !== undefined) findings.push({ code: "FAC-SEM-040", instancePath: "/producer/kind", message: "a summary is built by a receiver from many devices; a device never produces one" });
  const from = show(value.from ?? ""), to = show(value.to ?? "");
  if (from > to) findings.push({ code: "FAC-SEM-040", instancePath: "/to", message: `the range ends (${to}) before it starts (${from})` });
  const tuples = new Set<string>();
  const k = Math.max(MIN_POPULATION, num(value.minPopulation));
  indexed(value.cells).forEach(([cell, i]) => {
    const counts = isObject(cell.counts) ? cell.counts : {};
    if (num(counts.population) < k) findings.push({ code: "FAC-SEM-040", instancePath: `/cells/${i}/counts/population`, message: `a cell covering ${num(counts.population)} subjects is below the minimum of ${k}: fold it into the day's other cell or suppress it` });
    if (num(counts.population) > num(counts.sessions)) findings.push({ code: "FAC-SEM-040", instancePath: `/cells/${i}/counts/population`, message: "a cell covers no more subjects than sessions" });
    const tuple = cell.other === true ? JSON.stringify(["other", cell.day]) : JSON.stringify([cell.agent, cell.skill ?? null, cell.project, cell.day, cell.outcome]);
    if (tuples.has(tuple)) findings.push({ code: "FAC-SEM-040", instancePath: `/cells/${i}`, message: cell.other === true ? "a day has one other cell" : "two cells share agent, skill, project, day and outcome" });
    tuples.add(tuple);
    const day = show(cell.day ?? "");
    if (day < from || day > to) findings.push({ code: "FAC-SEM-040", instancePath: `/cells/${i}/day`, message: `${day} is outside ${from}…${to}` });
  });
  return findings;
}

/** Scopes whose rows carry a person's time or presence: served to another person only under a purpose the subject confirmed. */
export const PRESENCE_SCOPES: ReadonlySet<string> = new Set(["activity.raw", "activity.presence"]);
/** The scope of a person's usage and cost: served to another person only as sums per UTC day or billing period. */
export const USAGE_SCOPE = "activity.usage";
/** The scope of runs' results: never read as one person's data, only as project or agent cells (k ≥ 3, DEC-0030). */
export const RESULTS_SCOPE = "activity.results";
/** Every `activity.*` scope this profile names; another is refused when it is served to a person other than the subject. */
export const ACTIVITY_SCOPES: ReadonlySet<string> = new Set([...PRESENCE_SCOPES, USAGE_SCOPE, RESULTS_SCOPE]);

/**
 * The purposes a subject has confirmed at `at`: those whose latest `consent` message at or before `at` says `given`.
 * A consent message is neutral (DEC-0052); where a receiver keeps the record is its own business.
 */
export function confirmedPurposes(consents: readonly JsonObject[], at: string): Set<string> {
  const latest = new Map<string, { when: number; consent: JsonObject }>();
  const until = Date.parse(at);
  for (const consent of consents) {
    const when = Date.parse(show(consent.at ?? ""));
    if (consent.kind !== "consent" || typeof consent.purposeId !== "string" || !(when <= until)) continue;
    const before = latest.get(consent.purposeId);
    if (!before || when >= before.when) latest.set(consent.purposeId, { when, consent });
  }
  return new Set([...latest].filter(([, { consent }]) => consent.state === "given").map(([purpose]) => purpose));
}

/** The reader role of a partner organization's read (DEC-0090): its agents' usage, never a person's own data. */
export const PARTNER_ROLE = "partner";

/**
 * FAC-SEM-123 (DEC-0090 item 2): a partner organization reads a member's data only as its agents' usage sums: an access
 * log entry whose reader's role is `partner` is a service's read (no `user`), of `activity.usage`, per UTC day or billing
 * period, keyed by no device.
 */
function partnerRead(entry: JsonObject, i: number): Finding[] {
  const findings: Finding[] = [];
  const flag = (suffix: string, message: string) => findings.push({ code: "FAC-SEM-123", instancePath: `/log/entries/${i}${suffix}`, message });
  if (!isObject(entry.reader) || entry.reader.user !== undefined || typeof entry.reader.service !== "string") flag("/reader", "a partner reads as its organization's service, never as a person of the organization");
  if (entry.scope !== USAGE_SCOPE) flag("/scope", "a partner reads only its agents' usage sums (activity.usage)");
  if (entry.step !== "day" && entry.step !== "period") flag("/step", "a partner reads usage only as sums per UTC day or billing period");
  if (entry.device !== undefined) flag("/device", "a partner's read is keyed by no device");
  return findings;
}

/**
 * FAC-SEM-067 (OD-1 in neutral form, DEC-0052): `{log, consents?}` — of the reads an access log records, those served to
 * a person other than the subject show the subject's time or presence only under a purpose the subject confirmed, and
 * the subject's usage and cost only as sums per UTC day or billing period. `consents` are the subject's consent messages.
 * The subject reading their own data, and a service that serves no person (a summary build), are not narrowed.
 */
function accessLogDisclosure(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-067", instancePath, message });
  const log = isObject(value.log) ? value.log : {};
  const subject = isObject(log.subject) && isObject(log.subject.user) ? log.subject.user.id : undefined;
  const consents = Array.isArray(value.consents) ? value.consents.filter(isObject) : [];
  indexed(log.entries).forEach(([entry, i]) => {
    if (isObject(entry.reader) && entry.reader.role === PARTNER_ROLE) {
      findings.push(...partnerRead(entry, i));
      return;
    }
    const reader = isObject(entry.reader) && isObject(entry.reader.user) ? entry.reader.user.id : undefined;
    if (reader === undefined || reader === subject) return;
    const scope = show(entry.scope ?? "");
    if (scope.startsWith("activity.") && !ACTIVITY_SCOPES.has(scope)) {
      flag(`/log/entries/${i}/scope`, `${scope} is not a scope this profile names; a person's activity reaches another person only through the named scopes`);
    }
    if (scope === RESULTS_SCOPE) {
      flag(`/log/entries/${i}/scope`, "results never reach another person keyed by one person: only as project or agent cells of at least 3");
    }
    if (scope === USAGE_SCOPE && entry.step !== "day" && entry.step !== "period") {
      flag(`/log/entries/${i}/step`, "a person's usage and cost reach another person only as sums per UTC day or billing period");
    }
    if (PRESENCE_SCOPES.has(scope) && !(typeof entry.purposeId === "string" && confirmedPurposes(consents, show(entry.at ?? "")).has(entry.purposeId))) {
      flag(`/log/entries/${i}/purposeId`, "a person's time and presence reach another person only under a purpose the subject confirmed");
    }
  });
  return findings;
}

export function activityRules(kind: string, value: unknown): Finding[] | undefined {
  if (!isObject(value)) return undefined;
  if (kind === "telemetry-event") return [...noContentOrPerson(value, [""]), ...eventCost(value, ""), ...eventIntegrity(value, "")];
  if (kind === "activity-batch") return [...noContentOrPerson(value, indexed(value.events).map(([, i]) => `/events/${i}`)), ...batchCost(value), ...batchIntegrity(value)];
  if (kind === "activity-ack") return ackIntegrity(value);
  if (kind === "activity-summary") return [...summaryCost(value), ...summaryShape(value)];
  if (kind === "access-log-disclosure") return accessLogDisclosure(value);
  return undefined;
}
// #endregion activity-rules
