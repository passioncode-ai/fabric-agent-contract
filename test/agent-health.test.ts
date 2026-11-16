import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { AREAS, STATE_ORDER, agentHealthRules, episodeKey, readHealth, worstState } from "../src/agent-health.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { VECTOR_FILE, buildAgentHealthVectors } from "../tools/vectors/agent-health.js";

type Json = Record<string, any>;
const root = projectRoot();
const vectors = JSON.parse(readFileSync(path.join(root, VECTOR_FILE), "utf8")) as Json;
const schema = JSON.parse(readFileSync(path.join(root, "schemas/agent-health.schema.json"), "utf8")) as Json;
const fixture = (name: string): Json => JSON.parse(readFileSync(path.join(root, "fixtures", name), "utf8")) as Json;

describe("agent-health/1 (DEC-0179)", () => {
  it("the vectors are the generator's output", () => {
    expect(buildAgentHealthVectors()).toBe(readFileSync(path.join(root, VECTOR_FILE), "utf8"));
  });
  it.each(vectors.worst as Json[])("worst: $name", (entry) => {
    expect(worstState(entry.input)).toBe(entry.expected);
  });
  it.each(vectors.read as Json[])("read: $name", (entry) => {
    expect(readHealth(entry.input)).toEqual(entry.expected);
  });
  it.each(vectors.episodes as Json[])("episode: $name", (entry) => {
    const [product, id, at] = entry.input as [string, string, number];
    expect(episodeKey(product, id, at)).toBe(entry.expected);
  });
  it("the schema's states and areas are the reference's (HL-2, HL-3)", () => {
    expect([...schema.$defs.state.enum].sort()).toEqual([...STATE_ORDER].sort());
    expect(schema.$defs.check.properties.area.enum).toEqual([...AREAS]);
  });
  it("answers no other kind", () => {
    expect(agentHealthRules("ops-digest-hourly", {})).toBeUndefined();
  });
  it("a finding never copies a credential-shaped name", () => {
    const input = fixture("semantic/agent-health-fix-credential.json").input as Json;
    const tool = input.checks[1].fix.tool as string;
    const findings = evaluateSemanticRules("agent-health", input);
    expect(findings.map((f) => f.code)).toEqual(["FAC-SEM-181"]);
    expect(findings[0]?.instancePath).toBe("/checks/1/fix/tool");
    for (const f of findings) expect(f.message).not.toContain(tool);
  });
  it("names the place of a check named twice and the worst state it expected", () => {
    const twice = evaluateSemanticRules("agent-health", fixture("semantic/agent-health-id-twice.json").input);
    expect(twice).toEqual([expect.objectContaining({ code: "FAC-SEM-181", instancePath: "/checks/4/id" })]);
    const notWorst = evaluateSemanticRules("agent-health", fixture("semantic/agent-health-not-worst.json").input);
    expect(notWorst).toEqual([expect.objectContaining({ instancePath: "/state", message: expect.stringContaining("here fail") })]);
  });
  it("a check id the schema refuses is named only by its place, in the pair the schema does not check", () => {
    const health = { ...fixture("positive/agent-health.json"), state: "ok", checks: [{ id: "john.smith", area: "accounts", state: "ok", count: 0 }, { id: "john.smith", area: "accounts", state: "ok", count: 0 }] };
    const findings = evaluateSemanticRules("agent-health-service", { wellKnown: { status: "ready", degraded: [] }, health });
    expect(findings.map((f) => f.instancePath)).toEqual(["/health/checks/1/id"]);
    for (const f of findings) expect(f.message).not.toContain("john.smith");
  });
  it("a well-known answer that is ready with no degraded source puts no bound on the health report (HL-7)", () => {
    const health = fixture("positive/agent-health.json");
    expect(evaluateSemanticRules("agent-health-service", { wellKnown: { status: "ready", degraded: [] }, health })).toEqual([]);
    const ok = { ...health, state: "ok", checks: [] };
    expect(evaluateSemanticRules("agent-health-service", { wellKnown: { status: "degraded", degraded: [] }, health: ok }).map((f) => f.instancePath))
      .toEqual(["/health/state", "/health/state"]);
    expect(evaluateSemanticRules("agent-health-service", { wellKnown: { status: "ready", degraded: [] }, health: "nope" })).toEqual([]);
  });
});
