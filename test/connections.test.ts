import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { connectionsRules, connectionsView } from "../src/connections.js";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { buildConnectionsVectors } from "../tools/vectors/connections.js";

// DEC-0096: extensions/connections/0.1, FAC-SEM-127.
type Json = Record<string, any>;
const read = (file: string) => readFileSync(path.join(projectRoot(), file), "utf8");
const vectors = JSON.parse(read("fixtures/vectors/connections.json")) as { cases: Array<{ name: string; input: unknown; expected: Json }> };
const ajv = await createValidator();
const KEY = "https://fabric.passioncode.ai/agent-contract/extensions/connections/0.1";

describe("extensions/connections/0.1 (DEC-0096)", () => {
  it("the vector file is the generator's output", () => {
    expect(read("fixtures/vectors/connections.json")).toBe(buildConnectionsVectors());
  });
  it.each(vectors.cases)("$name", ({ input, expected }) => {
    const view = connectionsView(input);
    expect({ declared: view.declared, reported: view.reported, ...(expected.connections ? { connections: view.connections } : {}) }).toEqual(expected);
    if (view.reported) expect(view.errors.length).toBeGreaterThan(0);
  });
  it("never throws on any shape", () => {
    for (const input of [undefined, 1, "x", [], { extensions: null }, { extensions: { [KEY]: undefined } }, { extensions: { [KEY]: { connections: [null] } } }, { extensions: { constructor: 1 } }]) expect(() => connectionsView(input)).not.toThrow();
    expect(connectionsView({ extensions: { constructor: 1 } }).reported).toBe(false);
  });
  it("answers a fresh object each time, so a caller that changes one answer never changes the next", () => {
    const first = connectionsView({});
    first.connections.push({ id: "x", kind: "model", target: "x", state: "ok", failing: false });
    first.errors.push("x");
    expect(connectionsView({})).toEqual({ declared: false, reported: false, connections: [], errors: [] });
    const reported = connectionsView({ extensions: { [KEY]: [] } });
    expect(reported.connections).toEqual([]);
  });
  it("is reported as FAC-SEM-127 on a well-known document, at the extension key", () => {
    const dup = JSON.parse(read("fixtures/semantic/service-well-known-connections-duplicate.json")) as Json;
    const findings = connectionsRules(dup.input);
    expect(findings.map((f) => f.code)).toEqual(["FAC-SEM-127"]);
    expect(findings[0]?.instancePath).toBe("/extensions/https:~1~1fabric.passioncode.ai~1agent-contract~1extensions~1connections~10.1");
    expect(evaluateSemanticRules("service-well-known", dup.input).map((f) => f.code)).toContain("FAC-SEM-127");
  });
  it("travels in a valid well-known document, and every declared vector value validates against its schema", () => {
    const positive = JSON.parse(read("fixtures/positive/service-well-known-connections.json")) as Json;
    expect(validateDocument(ajv, `${SCHEMA_PREFIX}schemas/service-well-known.schema.json`, positive).valid).toBe(true);
    for (const entry of vectors.cases.filter((c) => c.expected.declared)) {
      const value = (entry.input as Json).extensions[KEY];
      expect(validateDocument(ajv, `${SCHEMA_PREFIX}schemas/service-connections-extension.schema.json`, value).valid, entry.name).toBe(true);
    }
  });
  it("keeps label, purpose and reason to one line each", () => {
    const base = { id: "telegram", kind: "connector", target: "telegram", state: "ok" };
    for (const member of ["label", "purpose", "reason"]) {
      expect(connectionsView({ extensions: { [KEY]: { connections: [{ ...base, [member]: "one line" }] } } }).declared, member).toBe(true);
      expect(connectionsView({ extensions: { [KEY]: { connections: [{ ...base, [member]: "two\nlines" }] } } }).reported, member).toBe(true);
    }
  });
});
