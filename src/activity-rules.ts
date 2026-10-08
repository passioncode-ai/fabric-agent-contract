import { createHash } from "node:crypto";
import { type Finding, type JsonObject, isObject, jsonEqual } from "./findings.js";
import { canonicalJson } from "./settings-backup.js";

// #region activity-rules — docs: docs/specification/activity.md#semantic-rules
/**
 * Activity telemetry (`fabric-activity/0.1`, `activity-summary/1`; DEC-0030). The schemas close every
 * object the contract defines; these rules cover what a schema cannot: extension data (`x-*` kinds and
 * their `data`) that smuggles content or a person in, an unknown cost written as zero, a stream that
 * runs backwards, an acknowledgement that claims more than was received, and a summary that grows a
 * person dimension.
 */

/** Keys that carry what was said or typed. Matched against a whole key and each of its dotted segments. */
export const CONTENT_KEYS: ReadonlySet<string> = new Set([
  "prompt", "prompts", "prompt_text", "response", "responses", "completion", "completions", "content", "contents",
  "text", "body", "message", "messages", "transcript", "stdin", "stdout", "stderr", "argv", "args", "command_line",
  "diff", "patch", "code_snippet", "tool_input", "tool_output"
]);

/** Keys that describe a person or rank one. `user` is handled apart: an event's own `/user` is the one opaque reference allowed. */
export const PERSON_KEYS: ReadonlySet<string> = new Set([
  "person", "persons", "people", "email", "user_email", "full_name", "display_name", "first_name", "last_name", "username",
  "user_name", "login", "phone", "team", "teams", "team_id", "department", "manager", "reports_to", "org_unit", "job_title",
  "score", "rating", "rank", "performance", "review"
]);

const segments = (key: string) => {
  const lower = key.toLowerCase();
  return [lower, ...lower.split(".")];
};

/** Every content or person key under `value`. `userAllowedAt` lists the paths whose `user` property is the allowed opaque reference. */
export function forbiddenKeys(value: unknown, at: string, userAllowedAt: ReadonlySet<string>): Array<{ path: string; kind: "content" | "person"; key: string }> {
  const found: Array<{ path: string; kind: "content" | "person"; key: string }> = [];
  const walk = (node: unknown, path: string) => {
    if (Array.isArray(node)) { node.forEach((item, i) => walk(item, `${path}/${i}`)); return; }
    if (!isObject(node)) return;
    for (const [key, child] of Object.entries(node)) {
      const here = `${path}/${key}`;
      const parts = segments(key);
      if (parts.some((part) => CONTENT_KEYS.has(part))) found.push({ path: here, kind: "content", key });
      else if (parts.some((part) => PERSON_KEYS.has(part))) found.push({ path: here, kind: "person", key });
      else if (parts.includes("user") && !(key === "user" && userAllowedAt.has(path))) found.push({ path: here, kind: "person", key });
      walk(child, here);
    }
  };
  walk(value, at);
  return found;
}

/** The `event_id` of an event read from a source that can be read again: `sha256:` of the canonical `{source, key}`. */
export function activityEventId(source: string, sourceKey: string): string {
  return `sha256:${createHash("sha256").update(canonicalJson({ key: sourceKey, source }), "utf8").digest("hex")}`;
}

const events = (value: JsonObject) => (Array.isArray(value.events) ? value.events.filter(isObject) : []);
const nodeOf = (event: JsonObject) => (isObject(event.node) ? event.node : {});
const streamKey = (node: JsonObject) => `${String(node.id)}#${String(node.epoch)}`;
const num = (x: unknown) => (typeof x === "number" ? x : 0);
const data = (event: JsonObject) => (isObject(event.data) ? event.data : {});

/** FAC-SEM-037: no content and no person field at any depth, extension data included. */
function noContentOrPerson(value: JsonObject, roots: string[]): Finding[] {
  return forbiddenKeys(value, "", new Set(roots)).map(({ path, kind, key }) => ({
    code: "FAC-SEM-037",
    instancePath: path,
    message: kind === "content"
      ? `${key} carries content; activity telemetry records when and how much, never what was said`
      : `${key} describes a person; activity telemetry names a person only by the opaque /user reference`
  }));
}

/** FAC-SEM-038 for one event: a zero estimate for a call that used tokens is an unknown cost. */
function eventCost(event: JsonObject, at: string): Finding[] {
  if (event.kind !== "usage.line") return [];
  const line = data(event);
  const cost = isObject(line.cost) ? line.cost : {};
  const tokens = isObject(line.tokens) ? line.tokens : {};
  const used = ["input", "output", "cache_read", "cache_write"].some((f) => num(tokens[f]) > 0);
  if (cost.usd === 0 && used && cost.basis === "client-estimate") {
    return [{ code: "FAC-SEM-038", instancePath: `${at}/data/cost/usd`, message: "a zero client estimate for a call that used tokens is an unknown cost: report null" }];
  }
  return [];
}

/** FAC-SEM-038 across a batch: one dedupe_key is one call, so every line that names it agrees. */
function batchCost(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const seen = new Map<string, JsonObject>();
  events(value).forEach((event, i) => {
    findings.push(...eventCost(event, `/events/${i}`));
    if (event.kind !== "usage.line") return;
    const line = data(event);
    const key = String(line.dedupe_key ?? "");
    const first = seen.get(key);
    if (!first) { seen.set(key, line); return; }
    if (first.model !== line.model || !jsonEqual(first.tokens, line.tokens) || !jsonEqual(first.cost, line.cost)) {
      findings.push({ code: "FAC-SEM-038", instancePath: `/events/${i}/data/dedupe_key`, message: `two lines name the call ${key} with different model, tokens or cost` });
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
    const lines = num(counts.usage_lines), unpriced = num(counts.unpriced_lines);
    if (unpriced > lines) findings.push({ code: "FAC-SEM-038", instancePath: `${at}/counts/unpriced_lines`, message: "more unpriced lines than lines" });
    if (lines > 0 && unpriced === lines && cost.usd !== null) findings.push({ code: "FAC-SEM-038", instancePath: `${at}/usage/cost/usd`, message: "every line is unpriced, so the cost is unknown (null), not a number" });
    if (unpriced < lines && cost.usd === null) findings.push({ code: "FAC-SEM-038", instancePath: `${at}/usage/cost/usd`, message: "priced lines carry a cost; null is only for a cell with no priced line" });
    if (typeof cost.usd === "number" && cost.basis === undefined) findings.push({ code: "FAC-SEM-038", instancePath: `${at}/usage/cost/basis`, message: "a known cost names its basis" });
    if (cost.usd === null && cost.basis !== undefined) findings.push({ code: "FAC-SEM-038", instancePath: `${at}/usage/cost/basis`, message: "an unknown cost has no basis" });
  });
  return findings;
}

/** FAC-SEM-039 for one event: an interval ends after it starts, an overflow accounts for a range before it, a derived id is the derivation. */
function eventIntegrity(event: JsonObject, at: string): Finding[] {
  const findings: Finding[] = [];
  const flag = (path: string, message: string) => findings.push({ code: "FAC-SEM-039", instancePath: `${at}${path}`, message });
  const d = data(event);
  if (event.kind === "session.interval" && typeof d.start === "string" && typeof d.end === "string" && Date.parse(d.end) < Date.parse(d.start)) {
    flag("/data/end", "an interval ends at or after its start");
  }
  if (event.kind === "buffer_overflow" && isObject(d.dropped)) {
    const { events: count, from_seq: from, to_seq: to } = d.dropped;
    if (num(to) < num(from)) flag("/data/dropped/to_seq", "a dropped range runs forward");
    else if (num(count) !== num(to) - num(from) + 1) flag("/data/dropped/events", `${String(count)} dropped events for the range ${String(from)}…${String(to)}`);
    if (num(to) >= num(event.seq)) flag("/data/dropped/to_seq", "an overflow event reports seqs that were assigned before its own");
  }
  if (typeof event.source_key === "string" && typeof event.source === "string" && event.event_id !== activityEventId(event.source, event.source_key)) {
    flag("/event_id", "an event that names its source_key carries the derived id, so a re-read of the source yields the same event_id");
  }
  return findings;
}

/** FAC-SEM-039 for a batch: each (node.id, node.epoch) stream runs forward and no event is sent twice in one batch. */
function batchIntegrity(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const last = new Map<string, number>();
  const ids = new Set<string>();
  events(value).forEach((event, i) => {
    const at = `/events/${i}`;
    findings.push(...eventIntegrity(event, at));
    const id = String(event.event_id ?? "");
    if (ids.has(id)) findings.push({ code: "FAC-SEM-039", instancePath: `${at}/event_id`, message: `${id} appears twice in one batch` });
    ids.add(id);
    const key = streamKey(nodeOf(event));
    const seq = num(event.seq);
    const before = last.get(key);
    if (before !== undefined && seq <= before) findings.push({ code: "FAC-SEM-039", instancePath: `${at}/seq`, message: `seq ${seq} after ${before} in the stream ${key}: a stream runs forward` });
    last.set(key, seq);
  });
  return findings;
}

export interface StreamPosition { node: { id: string; epoch: number }; seq: number }

/** The highest contiguous seq per stream after `batch`, from the receiver's `known` positions; an overflow's dropped range counts as delivered. */
export function contiguousAcks(known: readonly StreamPosition[], batch: JsonObject): StreamPosition[] {
  const held = new Map<string, Set<number>>();
  const start = new Map<string, StreamPosition>();
  for (const position of known) start.set(streamKey(position.node as unknown as JsonObject), { node: position.node, seq: position.seq });
  for (const event of events(batch)) {
    const node = nodeOf(event);
    const key = streamKey(node);
    if (!start.has(key)) start.set(key, { node: { id: String(node.id), epoch: num(node.epoch) }, seq: 0 });
    const set = held.get(key) ?? new Set<number>();
    set.add(num(event.seq));
    const dropped = event.kind === "buffer_overflow" && isObject(data(event).dropped) ? data(event).dropped as JsonObject : null;
    if (dropped) for (let s = num(dropped.from_seq); s <= num(dropped.to_seq) && s - num(dropped.from_seq) < 1_000_000; s += 1) set.add(s);
    held.set(key, set);
  }
  return [...start.entries()].map(([key, position]) => {
    let seq = position.seq;
    const set = held.get(key) ?? new Set<number>();
    while (set.has(seq + 1)) seq += 1;
    return { node: position.node, seq };
  });
}

/** FAC-SEM-039 for an acknowledgement: `{known?, batch, ack}` — the ack names the highest contiguous seq of each stream, no more and no less. */
function ackIntegrity(value: JsonObject): Finding[] {
  const known = Array.isArray(value.known) ? value.known.filter(isObject) as unknown as StreamPosition[] : [];
  const batch = isObject(value.batch) ? value.batch : {};
  const ack = isObject(value.ack) ? value.ack : {};
  const acks = Array.isArray(ack.acks) ? ack.acks.filter(isObject) : [];
  const findings: Finding[] = [];
  const expected = new Map(contiguousAcks(known, batch).map((p) => [streamKey(p.node as unknown as JsonObject), p.seq]));
  acks.forEach((entry, i) => {
    const key = streamKey(isObject(entry.node) ? entry.node : {});
    const want = expected.get(key);
    if (want === undefined) findings.push({ code: "FAC-SEM-039", instancePath: `/ack/acks/${i}`, message: `the ack names ${key}, a stream the receiver never saw` });
    else if (num(entry.seq) !== want) findings.push({ code: "FAC-SEM-039", instancePath: `/ack/acks/${i}/seq`, message: `the highest contiguous seq of ${key} is ${want}, not ${String(entry.seq)}` });
  });
  const named = new Set(acks.map((entry) => streamKey(isObject(entry.node) ? entry.node : {})));
  for (const event of events(batch)) {
    const key = streamKey(nodeOf(event));
    if (!named.has(key)) { findings.push({ code: "FAC-SEM-039", instancePath: "/ack/acks", message: `the ack omits ${key}, a stream the batch carried` }); named.add(key); }
  }
  return findings;
}

/** FAC-SEM-040: a summary has no person dimension, one cell per dimension tuple, and its days inside its range. */
function summaryShape(value: JsonObject): Finding[] {
  const findings: Finding[] = forbiddenKeys(value, "", new Set()).map(({ path, key }) => ({
    code: "FAC-SEM-040", instancePath: path, message: `${key}: a summary has no person dimension and no content`
  }));
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
  if (kind === "activity-event") return [...noContentOrPerson(value, [""]), ...eventCost(value, ""), ...eventIntegrity(value, "")];
  if (kind === "activity-batch") return [...noContentOrPerson(value, events(value).map((_, i) => `/events/${i}`)), ...batchCost(value), ...batchIntegrity(value)];
  if (kind === "activity-ack") return ackIntegrity(value);
  if (kind === "activity-summary") return [...summaryCost(value), ...summaryShape(value)];
  return undefined;
}
// #endregion activity-rules
