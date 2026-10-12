import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { population } from "../src/activity-rules.js";
import { sessionJoinFindings, sessionTotals } from "../src/session-join.js";

// DEC-0068 (CON-OE-08): the session join key, one writer per session, annotations never counted (FAC-SEM-100).
type Case = { description: string; kind: string; expect: string[]; input: { events: Array<Record<string, any>> } };
const dir = path.join(projectRoot(), "fixtures/semantic");
const cases = readdirSync(dir).filter((name) => name.startsWith("session-join-")).map((name) => [name, JSON.parse(readFileSync(path.join(dir, name), "utf8")) as Case] as const);
const read = (name: string) => cases.find(([file]) => file === name)![1];

describe("session-join fixtures", () => {
  it("has the three cases", () => expect(cases.length).toBe(3));
  it.each(cases)("%s", (_name, c) => {
    expect([...new Set(evaluateSemanticRules(c.kind, c.input).map((f) => f.code))]).toEqual(c.expect);
  });
});

describe("three writers, one count", () => {
  const events = read("session-join-three-writers.json").input.events;
  it("totals the session as its collector wrote it, whatever the annotations say", () => {
    const counted = events.filter((e) => e.kind === "session.interval");
    expect(sessionTotals(events)).toEqual(sessionTotals(counted));
    expect(sessionTotals(events).get("cc-sess-5d1e")).toEqual({ seconds: { agent_working: 714, awaiting_input: 895 }, calls: 0, inputTokens: 0, outputTokens: 0 });
  });
  it("counts a model call once per dedupeKey, even when two sources read it", () => {
    const line = (eventId: string) => ({ kind: "usage.line", eventId, session: { id: "s" }, collector: { id: "c" }, data: { dedupeKey: "req_1", tokens: { input: 10, output: 3 } } });
    expect(sessionTotals([line("a"), line("b")]).get("s")).toEqual({ seconds: {}, calls: 1, inputTokens: 10, outputTokens: 3 });
    const noKey = (eventId: string) => ({ kind: "usage.line", eventId, session: { id: "s" }, data: { tokens: {} } });
    expect(sessionTotals([noKey("a"), noKey("b")]).get("s")?.calls).toBe(2);
  });
});

describe("FAC-SEM-100 boundaries", () => {
  const iv = (start: string, end: string, collector = "c", session = "s") => ({ kind: "session.interval", session: { id: session }, collector: { id: collector }, data: { start, end, state: "idle" } });
  const paths = (events: unknown[]) => sessionJoinFindings({ events }).map((f) => f.instancePath);
  it("lets an interval start exactly where the last ended, and refuses one a second earlier", () => {
    expect(paths([iv("2026-10-07T09:00:00Z", "2026-10-07T09:10:00Z"), iv("2026-10-07T09:10:00Z", "2026-10-07T09:20:00Z")])).toEqual([]);
    expect(paths([iv("2026-10-07T09:00:00Z", "2026-10-07T09:10:00Z"), iv("2026-10-07T09:09:59Z", "2026-10-07T09:20:00Z")])).toEqual(["/events/1/data/start"]);
  });
  it("finds an interval inside a longer one that is not its neighbour", () => {
    expect(paths([iv("2026-10-07T09:00:00Z", "2026-10-07T10:00:00Z"), iv("2026-10-07T09:10:00Z", "2026-10-07T09:20:00Z"), iv("2026-10-07T09:30:00Z", "2026-10-07T09:40:00Z")])).toEqual(["/events/1/data/start", "/events/2/data/start"]);
  });
  it("refuses two intervals that start at the same instant", () => {
    expect(paths([iv("2026-10-07T09:00:00Z", "2026-10-07T09:05:00Z"), iv("2026-10-07T09:00:00Z", "2026-10-07T09:10:00Z")])).toEqual(["/events/1/data/start"]);
  });
  it("totals nothing for an event without a session, and a usage line without tokens as a call", () => {
    expect(sessionTotals([{ kind: "usage.line", data: {} }]).size).toBe(0);
    expect(sessionTotals([{ kind: "usage.line", session: { id: "s" }, data: { dedupeKey: "k" } }]).get("s")).toEqual({ seconds: {}, calls: 1, inputTokens: 0, outputTokens: 0 });
  });
  it("orders intervals by start, whatever order the events arrive in", () => {
    expect(paths([iv("2026-10-07T09:10:00Z", "2026-10-07T09:20:00Z"), iv("2026-10-07T09:00:00Z", "2026-10-07T09:05:00Z")])).toEqual([]);
    expect(paths([iv("2026-10-07T09:10:00Z", "2026-10-07T09:20:00Z"), iv("2026-10-07T09:00:00Z", "2026-10-07T09:15:00Z")])).toEqual(["/events/0/data/start"]);
  });
  it("leaves an unreadable interval out, so it cannot hide an overlap", () => {
    expect(paths([iv("2026-02-30T09:00:00Z", "2026-10-07T09:30:00Z"), iv("2026-10-07T09:00:00Z", "2026-10-07T09:10:00Z"), iv("2026-10-07T09:05:00Z", "2026-10-07T09:20:00Z")])).toEqual(["/events/2/data/start"]);
    expect(paths([iv("2026-10-07T09:00:00Z", "2026-10-07T09:10:00Z"), iv("2026-10-07T09:05:00Z", "not a time"), iv("2026-10-07T09:05:00Z", "2026-10-07T09:20:00Z")])).toEqual(["/events/2/data/start"]);
  });
  it("reports the later of two identical intervals", () => {
    expect(paths([iv("2026-10-07T09:00:00Z", "2026-10-07T09:10:00Z"), iv("2026-10-07T09:00:00Z", "2026-10-07T09:10:00Z")])).toEqual(["/events/1/data/start"]);
  });
  it("gives the same answer for zero-length intervals at one instant, whatever their order", () => {
    const zero = iv("2026-10-07T09:00:00Z", "2026-10-07T09:00:00Z");
    const ten = iv("2026-10-07T09:00:00Z", "2026-10-07T09:10:00Z");
    expect(paths([zero, ten])).toEqual([]);
    expect(paths([ten, zero])).toEqual([]);
  });
  it("totals only readable intervals and counts tokens only as whole non-negative numbers", () => {
    const at = (start: string, end: string) => ({ kind: "session.interval", session: { id: "s" }, data: { start, end, state: "idle" } });
    expect(sessionTotals([at("2026-10-07T09:10:00Z", "2026-10-07T09:00:00Z"), at("2026-02-30T09:00:00Z", "2026-10-07T09:00:00Z"), at("2026-10-07T09:00:00", "2026-10-07T09:10:00")]).get("s")?.seconds).toEqual({});
    const line = (dedupeKey: string, input: unknown) => ({ kind: "usage.line", session: { id: "s" }, data: { dedupeKey, tokens: { input, output: 1 } } });
    expect(sessionTotals([line("a", -5), line("b", 1.5), line("c", 4)]).get("s")).toEqual({ seconds: {}, calls: 3, inputTokens: 4, outputTokens: 3 });
  });
  it("counts one call once across sessions, and lines with no key each on their own", () => {
    const line = (session: string, extra: Record<string, unknown>) => ({ kind: "usage.line", session: { id: session }, data: { tokens: { input: 1 }, ...extra } });
    const totals = sessionTotals([line("s1", { dedupeKey: "req" }), line("s2", { dedupeKey: "req" })]);
    expect([totals.get("s1")?.calls, totals.get("s2")?.calls]).toEqual([1, 0]);
    expect(sessionTotals([line("s", {}), line("s", {})]).get("s")?.calls).toBe(2);
  });
  it("keeps a state named like an object's own member as a state", () => {
    const odd = (state: string) => ({ kind: "session.interval", session: { id: "s" }, data: { start: "2026-10-07T09:00:00Z", end: "2026-10-07T09:10:00Z", state } });
    expect(sessionTotals([odd("constructor"), odd("__proto__")]).get("s")?.seconds).toEqual(Object.fromEntries([["constructor", 600], ["__proto__", 600]]));
  });
  it("keeps sessions apart: two sessions may overlap and have different collectors", () => {
    expect(paths([iv("2026-10-07T09:00:00Z", "2026-10-07T10:00:00Z", "a", "s1"), iv("2026-10-07T09:10:00Z", "2026-10-07T09:20:00Z", "b", "s2")])).toEqual([]);
  });
  it("reads the offset: 11:05+02:00 is before 09:10Z", () => {
    expect(paths([iv("2026-10-07T09:00:00Z", "2026-10-07T09:10:00Z"), iv("2026-10-07T11:05:00+02:00", "2026-10-07T11:20:00+02:00")])).toEqual(["/events/1/data/start"]);
  });
  it("counts a usage line's collector too, and ignores annotations and other kinds", () => {
    const usage = { kind: "usage.line", session: { id: "s" }, collector: { id: "other" }, data: {} };
    const note = { kind: "session.annotation", session: { id: "s" }, collector: { id: "third" }, data: { by: "fabric", label: "session.ended", at: "2026-10-07T09:30:00Z" } };
    expect(paths([iv("2026-10-07T09:00:00Z", "2026-10-07T09:10:00Z"), note, usage])).toEqual(["/events/2/collector/id"]);
  });
  it("answers malformed events with findings or nothing, never by throwing", () => {
    const junk = [null, 3, { kind: 5 }, { kind: "session.interval" }, { kind: "session.interval", session: { id: "s" }, collector: { id: "c" } }, iv("2026-02-30T00:00:00Z", "2026-03-01T00:00:00Z"), iv("2026-10-07T09:10:00Z", "2026-10-07T09:00:00Z"), { kind: "usage.line", session: { id: 1 }, collector: { id: "c" } }];
    expect(() => sessionJoinFindings({ events: junk })).not.toThrow();
    expect(sessionJoinFindings({ events: "x" })).toEqual([]);
    expect(() => sessionTotals(junk)).not.toThrow();
    expect(sessionTotals("x").size).toBe(0);
    expect(sessionTotals([{ kind: "session.interval", session: { id: "s" }, data: { start: "2026-10-07T09:00:00Z", end: "2026-10-07T09:10:00Z" } }]).get("s")?.seconds).toEqual({});
  });
});

describe("annotations add nothing to a summary cell", () => {
  it("adds no subject to a population", () => {
    const note = (id: string) => ({ kind: "session.annotation", session: { id }, data: { by: "fabric", label: "session.ended", at: "2026-10-07T09:30:00Z" } });
    const interval = (id: string) => ({ kind: "session.interval", session: { id }, data: {} });
    expect(population([interval("a"), note("b"), note("c")])).toBe(1);
  });
});
