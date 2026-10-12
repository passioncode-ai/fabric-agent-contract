import { type Finding, type JsonObject, isObject } from "./findings.js";
import { strictTime } from "./rfc3339.js";

// #region session-join — docs: docs/specification/activity.md#one-writer-per-session
/**
 * The session join key and one writer per fact (DEC-0068, CON-OE-08). The runtime's `session.id` joins every event about
 * a session. On one device the collector is the one writer of a session's `session.interval` and `usage.line` events;
 * what Fabric, Switchboard or another surface reports about the session is a `session.annotation`, which carries no
 * duration, tokens or cost and is never counted. Malformed input answers findings or nothing, never an exception.
 */

const COUNTED = new Set(["session.interval", "usage.line"]);
const sessionOf = (event: JsonObject): string | undefined => (isObject(event.session) && typeof event.session.id === "string" ? event.session.id : undefined);
const collectorOf = (event: JsonObject): string | undefined => (isObject(event.collector) && typeof event.collector.id === "string" ? event.collector.id : undefined);
const count = (value: unknown): number => (Number.isSafeInteger(value) && (value as number) >= 0 ? (value as number) : 0);

/**
 * FAC-SEM-100 (kind `session-join`, `{events}`: events of one device): every counted event of one `session.id` carries
 * one `collector.id`, and the intervals of one session do not overlap, since a session is in one state at a time.
 */
export function sessionJoinFindings(value: JsonObject): Finding[] {
  const events = Array.isArray(value.events) ? value.events : [];
  const findings: Finding[] = [];
  const writer = new Map<string, string>();
  const intervals = new Map<string, Array<{ start: number; end: number; index: number }>>();
  events.forEach((event: unknown, index: number) => {
    if (!isObject(event) || typeof event.kind !== "string" || !COUNTED.has(event.kind)) return;
    const session = sessionOf(event);
    const collector = collectorOf(event);
    if (session === undefined || collector === undefined) return;
    const first = writer.get(session);
    if (first === undefined) writer.set(session, collector);
    else if (first !== collector) findings.push({ code: "FAC-SEM-100", instancePath: `/events/${index}/collector/id`, message: `session ${session} is written by ${first}; one collector writes a session's intervals and usage lines` });
    if (event.kind === "session.interval" && isObject(event.data)) {
      const start = strictTime(event.data.start);
      const end = strictTime(event.data.end);
      if (Number.isNaN(start) || Number.isNaN(end) || end < start) return;
      const list = intervals.get(session) ?? [];
      list.push({ start, end, index });
      intervals.set(session, list);
    }
  });
  for (const [session, list] of intervals) {
    list.sort((a, b) => a.start - b.start || a.end - b.end || a.index - b.index);
    let reach = Number.NEGATIVE_INFINITY;
    for (const interval of list) {
      if (interval.start < reach) findings.push({ code: "FAC-SEM-100", instancePath: `/events/${interval.index}/data/start`, message: `session ${session} has overlapping intervals; a session is in one state at a time` });
      reach = Math.max(reach, interval.end);
    }
  }
  return findings;
}

export type SessionTotals = { seconds: Record<string, number>; calls: number; inputTokens: number; outputTokens: number };

/**
 * What a reader counts per session: interval seconds by state and usage lines, each call once by its `dedupeKey` across
 * all sessions (as the activity dedupe rule and the batch cost read it; a line without one counts by its `eventId`, and a line with
 * neither counts on its own). Annotations and every other kind count for nothing, so a session that three writers
 * reported totals as its collector wrote it.
 */
export function sessionTotals(events: unknown): Map<string, SessionTotals> {
  const totals = new Map<string, { seconds: Map<string, number>; calls: number; inputTokens: number; outputTokens: number }>();
  const seenCalls = new Set<string>();
  for (const event of Array.isArray(events) ? events : []) {
    if (!isObject(event) || !COUNTED.has(event.kind as string) || !isObject(event.data)) continue;
    const session = sessionOf(event);
    if (session === undefined) continue;
    const entry = totals.get(session) ?? { seconds: new Map<string, number>(), calls: 0, inputTokens: 0, outputTokens: 0 };
    totals.set(session, entry);
    const data = event.data;
    if (event.kind === "session.interval") {
      const start = strictTime(data.start);
      const end = strictTime(data.end);
      if (Number.isNaN(start) || Number.isNaN(end) || end < start || typeof data.state !== "string") continue;
      entry.seconds.set(data.state, (entry.seconds.get(data.state) ?? 0) + (end - start) / 1000);
    } else {
      const key = typeof data.dedupeKey === "string" ? `dedupe:${data.dedupeKey}` : typeof event.eventId === "string" ? `event:${event.eventId}` : undefined;
      if (key !== undefined && seenCalls.has(key)) continue;
      if (key !== undefined) seenCalls.add(key);
      const tokens = isObject(data.tokens) ? data.tokens : {};
      entry.calls += 1;
      entry.inputTokens += count(tokens.input);
      entry.outputTokens += count(tokens.output);
    }
  }
  return new Map([...totals].map(([session, entry]) => [session, { ...entry, seconds: Object.fromEntries(entry.seconds) }]));
}

export function sessionJoinRules(kind: string, value: JsonObject): Finding[] | undefined {
  return kind === "session-join" ? sessionJoinFindings(value) : undefined;
}
// #endregion session-join
