import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { activityEventId, boundPopulation, inventorySourceKey, population, turnBucket, turnSourceKey } from "../src/activity-rules.js";
import { routeInventory } from "../src/context-route.js";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { buildActivityTurnVectors, VECTOR_FILE } from "../tools/vectors/activity-turn.js";

// DEC-0171: the agent turn (kind `turn`), the account inventory (kind `account.inventory`) and `activity-summary/2`.
type Json = Record<string, any>;
const committed = readFileSync(path.join(projectRoot(), VECTOR_FILE), "utf8");
const vectors = JSON.parse(committed) as { events: Json[]; routes: Json[]; populations: Json[]; buckets: Json[]; summaries: Json[] };
const validator = await createValidator();
const valid = (schema: string, value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}.schema.json`, value).valid;
const codes = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((f) => `${f.code} ${f.instancePath}`);
const event = (name: string) => (vectors.events.find((c) => c.name === name) as Json).event as Json;

describe("turn and account.inventory events (DEC-0171)", () => {
  it("is the file the generator writes", () => expect(committed).toBe(buildActivityTurnVectors()));
  it.each(vectors.events.map((c) => [c.name, c] as const))("%s", (_name, c) => {
    expect(valid("telemetry-event", c.event)).toBe(c.schemaValid);
    if (c.schemaValid) expect(codes("telemetry-event", c.event)).toEqual(c.findings);
  });
  it("derives every valid event's id as the reference does (RT-2, SI-4)", () => {
    for (const c of vectors.events.filter((e) => e.schemaValid && e.findings.length === 0)) {
      const { data: d, session } = c.event;
      const key = c.event.kind === "turn" ? turnSourceKey(session.id, d.ordinal) : inventorySourceKey({ billing: d.billing, day: d.day, holder: d.holder, plan: d.plan ?? null, provider: d.provider, tenantRef: d.tenantRef });
      expect([c.name, c.event.sourceKey]).toEqual([c.name, key]);
      expect(c.event.eventId).toBe(activityEventId(c.event.source, key));
    }
  });
  it("reads a session again as the same turn: a stream holds it once", () => {
    const first = event("a turn read from the runtime's OpenTelemetry export");
    const batch = { protocol: "fabric-activity/0.1", device: { id: "device-1" }, events: [first, { ...clone(first), seq: 2 }] };
    expect(codes("activity-batch", batch)).toEqual(["FAC-SEM-039 /events/1/eventId"]);
  });
  it("writes one inventory per key: a second is a repeated id", () => {
    const seats = event("Switchboard's two subscription seats of one plan");
    const batch = { protocol: "fabric-activity/0.1", device: { id: "device-1" }, events: [seats, { ...clone(seats), seq: 2, data: { ...seats.data, accounts: 3 } }] };
    expect(codes("activity-batch", batch)).toEqual(["FAC-SEM-039 /events/1/eventId"]);
  });
  it("runs FAC-SEM-178 in a batch as on one event", () => {
    const late = vectors.events.find((c) => c.name === "a turn whose midnight is not its day") as Json;
    expect(codes("activity-batch", { protocol: "fabric-activity/0.1", device: { id: "device-1" }, events: [late.event] })).toContain("FAC-SEM-178 /events/0/occurred");
  });
  it("is gated: at an older pin a turn with tool kinds and every inventory are refused, a turn without tool kinds stored and counted for nothing (RT-5, SI-6)", () => {
    // A receiver pinned before DEC-0171 validates an unknown kind's data as extension data: no array, no string over 64
    // characters (a tenantRef has 71).
    const older = (e: Json) => valid("telemetry-event", { ...e, kind: "later.kind" });
    expect(older(event("a turn read from the runtime's OpenTelemetry export"))).toBe(false);
    expect(older(event("a turn with no tool call and no tool kinds, read from a hook"))).toBe(true);
    expect(older(event("Switchboard's two subscription seats of one plan"))).toBe(false);
  });
  it("keeps one collector per session's turns (FAC-SEM-100)", () => {
    const first = event("a turn read from the runtime's OpenTelemetry export");
    const other = { ...clone(first), collector: { id: "second-collector", epoch: 4 } };
    expect(codes("session-join", { events: [first, other] })).toEqual(["FAC-SEM-100 /events/1/collector/id"]);
  });
  it("refuses an inventory for a tenant its receiver does not list (FAC-SEM-045, SI-3)", () => {
    const seats = event("Switchboard's two subscription seats of one plan");
    const input = (tenants?: string[]) => ({ binding: { org: { id: "org_a" }, device: { id: "device-1" }, user: { id: "m-1" } }, epochs: [{ epoch: 4, binding: { org: { id: "org_a" }, device: { id: "device-1" }, user: { id: "m-1" } } }], batch: { protocol: "fabric-activity/0.1", device: { id: "device-1" }, events: [seats] }, ...(tenants ? { tenants } : {}) });
    expect(codes("device-attribution", input([seats.data.tenantRef]))).toEqual([]);
    expect(codes("device-attribution", input([`sha256:${"00".repeat(32)}`]))).toEqual(["FAC-SEM-045 /batch/events/0/data/tenantRef"]);
    expect(codes("device-attribution", input())).toEqual(["FAC-SEM-045 /batch/events/0/data/tenantRef"]);
  });
  it.each(vectors.routes.map((c) => [c.name, c] as const))("routes: %s", (_name, c) => expect(routeInventory(c.tenantRef, c.enrollments)).toEqual(c.answer));
  it("routes nothing on malformed input", () => {
    expect(routeInventory(7, [{ org: "org_a", tenants: [7] }])).toEqual({ route: "none", reason: "unlisted" });
    expect(routeInventory("t", "none")).toEqual({ route: "none", reason: "unlisted" });
    expect(routeInventory("t", [{ org: 7, tenants: ["t"] }, null])).toEqual({ route: "none", reason: "unlisted" });
  });
  it.each(vectors.populations.map((c) => [c.name, c] as const))("population: %s", (_name, c) => expect(boundPopulation(c.rows)).toBe(c.population));
  it("puts each turn in its bucket, and no value that is not a duration", () => {
    for (const c of vectors.buckets) expect([c.turnMs, turnBucket(c.turnMs)]).toEqual([c.turnMs, c.bucket]);
    expect(turnBucket(Number.NaN)).toBeUndefined();
    expect(turnBucket(-1)).toBeUndefined();
  });
  it("adds no subject to an activity-summary/1 cell for a turn: one person's turns never pad a cell to the minimum (RT-4)", () => {
    const base = event("a turn read from the runtime's OpenTelemetry export");
    const line = { kind: "usage.line", user: { id: "m-7f3a91c2" }, session: { id: "s-1" } };
    const turns = [1, 2, 3].map((n) => ({ ...clone(base), session: { id: `s-${n + 10}` } }));
    expect(population([line, ...turns])).toBe(1);
  });
  it.each(vectors.summaries.map((c) => [c.name, c] as const))("summary: %s", (_name, c) => {
    expect(valid("activity-summary-2", c.summary)).toBe(c.schemaValid);
    if (c.schemaValid) expect(codes("activity-summary-2", c.summary)).toEqual(c.findings);
  });
  it("keeps an activity-summary/1 reader's cells: /2's cells are /1's", () => {
    const summary = clone((vectors.summaries[0] as Json).summary);
    const one: Json = { ...summary, format: "activity-summary/1" };
    delete one.turnCells;
    delete one.inventoryCells;
    expect(valid("activity-summary", one)).toBe(true);
  });
  it("reads a cell with no skill or plan as its own tuple, and an incomplete cell without throwing", () => {
    const summary = clone((vectors.summaries[0] as Json).summary);
    const noSkill: Json = { ...clone(summary.turnCells[0]) };
    delete noSkill.skill;
    const noPlan: Json = { ...clone(summary.inventoryCells[0]), billing: "api" };
    delete noPlan.plan;
    summary.turnCells.push(noSkill);
    summary.inventoryCells.push(noPlan);
    expect(codes("activity-summary-2", summary)).toEqual([]);
    summary.turnCells.push(clone(noSkill));
    expect(codes("activity-summary-2", summary)).toEqual(["FAC-SEM-040 /turnCells/3"]);
    const bare = { ...clone((vectors.summaries[0] as Json).summary), turnCells: [{ population: 5, turns: 5 }], inventoryCells: [{ population: 5, machines: 5, accounts: 5 }] };
    expect(codes("activity-summary-2", bare)).toEqual(["FAC-SEM-040 /turnCells/0/turnBuckets", "FAC-SEM-040 /turnCells/0/day", "FAC-SEM-040 /inventoryCells/0/day"]);
  });
  it("reads only what an incomplete event carries, never throwing", () => {
    const base = event("a turn read from the runtime's OpenTelemetry export");
    const own = (patch: Json) => codes("telemetry-event", { ...base, ...patch }).filter((f) => f.startsWith("FAC-SEM-178"));
    expect(own({ data: "none" })).toEqual([]);
    expect(own({ session: "none" })).toEqual([]);
    expect(own({ data: { ...base.data, ordinal: "3", toolKinds: [7] } })).toContain("FAC-SEM-178 /data/toolKinds");
    expect(own({ session: { id: "a\uD800" } })).toEqual(["FAC-SEM-178 /sourceKey"]);
    const seats = event("Switchboard's two subscription seats of one plan");
    const inv = (patch: Json) => codes("telemetry-event", { ...seats, ...patch }).filter((f) => f.startsWith("FAC-SEM-178"));
    expect(inv({ data: { ...seats.data, plan: 7 } })).toEqual([]);
    expect(inv({ data: { ...seats.data, provider: 7 } })).toEqual([]);
    expect(inv({ data: { ...seats.data, plan: "pro", provider: "constructor" } })).toEqual(["FAC-SEM-178 /sourceKey", "FAC-SEM-178 /data/plan"]);
  });
});

function clone(value: Json): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}
