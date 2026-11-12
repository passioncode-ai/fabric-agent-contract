import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { activityEventId, unitSourceKey } from "../src/activity-rules.js";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { buildActivityUnitVectors, VECTOR_FILE } from "../tools/vectors/activity-unit.js";

// DEC-0164: the unit-of-work event (kind `unit`). The vectors carry hand-written schema answers and rule codes.
type Json = Record<string, any>;
const committed = readFileSync(path.join(projectRoot(), VECTOR_FILE), "utf8");
const vectors = JSON.parse(committed) as { cases: Json[] };
const validator = await createValidator();
const valid = (value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/telemetry-event.schema.json`, value).valid;
const findings = (value: unknown) => evaluateSemanticRules("telemetry-event", value).map((f) => `${f.code} ${f.instancePath}`);

describe("unit events (DEC-0164)", () => {
  it("is the file the generator writes", () => expect(committed).toBe(buildActivityUnitVectors()));
  it.each(vectors.cases.map((c) => [c.name, c] as const))("%s", (_name, c) => {
    expect(valid(c.event)).toBe(c.schemaValid);
    if (c.schemaValid) expect(findings(c.event)).toEqual(c.findings);
  });
  it("derives one id for one transition and run.root, and another for a reopened unit (AE-2)", () => {
    const accepted = vectors.cases.filter((c) => c.event.data.transition === "accepted" && c.schemaValid && c.findings.length === 0);
    const ids = new Set(accepted.map((c) => `${c.event.run.root} ${c.event.eventId}`));
    expect(new Set(accepted.map((c) => c.event.run.root)).size).toBe(ids.size);
    for (const c of accepted) {
      const d = c.event.data;
      expect(c.event.sourceKey).toBe(unitSourceKey(d.agent, d.unit, d.transition, c.event.run.root));
      expect(c.event.eventId).toBe(activityEventId("unit", c.event.sourceKey));
    }
  });
  it("refuses another source, refuses in a batch too, and reads only unit events", () => {
    const started = (vectors.cases[0] as Json).event as Json;
    expect(findings({ ...started, source: "kit" })).toEqual(["FAC-SEM-039 /eventId", "FAC-SEM-171 /source"]);
    const batch = { protocol: "fabric-activity/0.1", device: { id: "device-1" }, events: [{ ...started, source: "kit" }] };
    expect(evaluateSemanticRules("activity-batch", batch).map((f) => f.code)).toContain("FAC-SEM-171");
    expect(findings({ ...started, kind: "result", data: { signal: "done", outcome: "met" } }).filter((f) => f.startsWith("FAC-SEM-171"))).toEqual([]);
    expect(findings({ ...started, data: { ...started.data, unit: { system: "github", key: "a\uD800" } } })).toContain("FAC-SEM-171 /sourceKey");
  });
  it("reads only what an incomplete unit event carries, never throwing", () => {
    const started = (vectors.cases[0] as Json).event as Json;
    const unitOf = (patch: Json) => findings({ ...started, ...patch }).filter((f) => f.startsWith("FAC-SEM-171"));
    expect(unitOf({ data: "none", run: "none" })).toEqual([]);
    expect(unitOf({ data: { ...started.data, unit: "none" } })).toEqual([]);
    expect(unitOf({ data: { ...started.data, agent: 7 } })).toEqual([]);
    expect(unitOf({ data: { ...started.data, transition: 7 } })).toEqual([]);
    expect(unitOf({ data: { ...started.data, unit: { system: 7, key: "k" } } })).toEqual([]);
    expect(unitOf({ data: { ...started.data, unit: { system: "github", key: 7 } } })).toEqual([]);
    expect(unitOf({ run: { root: 7 } })).toEqual([]);
    expect(unitOf({ data: { ...started.data, acceptedAt: "2026-11-12T11:00:00Z" }, occurred: 7 })).toEqual([]);
    expect(unitOf({ data: { ...started.data, acceptedAt: 7 } })).toEqual([]);
  });
});
