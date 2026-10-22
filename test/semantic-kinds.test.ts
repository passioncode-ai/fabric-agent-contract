import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { KIND_OF_SCHEMA, SEMANTIC_KINDS, documentKindsOf, isSemanticKind, schemaOfKind } from "../src/semantic-kinds.js";
import { createValidatorSync } from "../src/validator.js";

// REQ-02 (contract review 2026-10-21): the kinds evaluateSemanticRules dispatches are a registry. The registry is
// held to the dispatch by reading it: every `kind === "…"` (or `!==`) inside a function whose parameters are
// `(kind: string, value…)` is a kind a rule owns, and the set of them equals SEMANTIC_KINDS' keys.
const root = projectRoot();
const sources = readdirSync(path.join(root, "src")).filter((name) => name.endsWith(".ts"));

/** The kinds the dispatch compares `kind` against, with the module that names each. */
export function dispatchedKinds(files: Array<{ name: string; text: string }>): Map<string, string> {
  const kinds = new Map<string, string>();
  for (const { name, text } of files) {
    const signature = /function (\w+)\(kind: string, value[^)]*\)[^{]*\{/g;
    for (let match = signature.exec(text); match; match = signature.exec(text)) {
      let depth = 1;
      let end = signature.lastIndex;
      while (depth > 0 && end < text.length) {
        if (text[end] === "{") depth += 1;
        else if (text[end] === "}") depth -= 1;
        end += 1;
      }
      for (const literal of text.slice(signature.lastIndex, end).matchAll(/(?<![.\w])kind [!=]== "([a-z0-9-]+)"/g)) kinds.set(literal[1] as string, name);
    }
  }
  return kinds;
}

const files = sources.map((name) => ({ name, text: readFileSync(path.join(root, "src", name), "utf8") }));
interface SemanticFixture { kind?: string; input?: unknown; expect?: unknown }
const fixtures = readdirSync(path.join(root, "fixtures/semantic"))
  .filter((name) => name.endsWith(".json"))
  .map((name) => ({ name, value: JSON.parse(readFileSync(path.join(root, "fixtures/semantic", name), "utf8")) as SemanticFixture }))
  .filter(({ value }) => typeof value.kind === "string" && "input" in value);

describe("SEMANTIC_KINDS (REQ-02)", () => {
  it("equals the kinds the dispatch names, no more and no fewer", () => {
    expect(Object.keys(SEMANTIC_KINDS).sort()).toEqual([...dispatchedKinds(files).keys()].sort());
  });

  it("the scanner sees a planted dispatch kind and ignores a member named kind", () => {
    const planted = dispatchedKinds([{ name: "planted.ts", text: 'export function planted(kind: string, value: unknown) { if (kind === "planted-kind") return []; if (value.kind === "not-a-kind") return []; }' }]);
    expect([...planted.keys()]).toEqual(["planted-kind"]);
  });

  it("registers every kind a semantic fixture names", () => {
    expect(fixtures.length).toBeGreaterThan(300);
    const unknown = [...new Set(fixtures.map(({ value }) => value.kind as string))].filter((kind) => !isSemanticKind(kind));
    expect(unknown).toEqual([]);
  });

  it("every registered kind is reached by a semantic fixture or a test", () => {
    const named = new Set(fixtures.map(({ value }) => value.kind as string));
    const tests = readdirSync(path.join(root, "test"))
      .filter((name) => name.endsWith(".ts") && name !== "semantic-kinds.test.ts")
      .map((name) => readFileSync(path.join(root, "test", name), "utf8"))
      .join("\n");
    const unreached = Object.keys(SEMANTIC_KINDS).filter((kind) => !named.has(kind) && !tests.includes(`"${kind}"`));
    expect(unreached).toEqual([]);
  });

  it("a wrapper kind's fixtures use only its declared members", () => {
    const strays: string[] = [];
    for (const { name, value } of fixtures) {
      const entry = SEMANTIC_KINDS[value.kind as string];
      if (entry?.input !== "wrapper" || typeof value.input !== "object" || value.input === null || Array.isArray(value.input)) continue;
      for (const key of Object.keys(value.input)) if (!entry.members.includes(key)) strays.push(`${name}: ${key}`);
    }
    expect(strays).toEqual([]);
  });

  it("every schema a kind names compiles", () => {
    const validator = createValidatorSync();
    const missing = Object.keys(SEMANTIC_KINDS).flatMap((kind) => {
      const schema = schemaOfKind(kind);
      return schema === undefined || validator.getSchema(`${SCHEMA_PREFIX}schemas/${schema}`) ? [] : [`${kind}: ${schema}`];
    });
    expect(missing).toEqual([]);
  });

  it("reads each published schema with at most one whole-document kind, which the positive sweep runs", () => {
    const documents = Object.keys(SEMANTIC_KINDS).flatMap((kind) => {
      const schema = schemaOfKind(kind);
      return schema !== undefined && !schema.includes("#") ? [[kind, schema] as const] : [];
    });
    for (const [kind, schema] of documents) {
      expect(documentKindsOf(schema), kind).toEqual([kind]);
      expect(KIND_OF_SCHEMA[schema], kind).toBe(kind);
    }
    expect(Object.keys(KIND_OF_SCHEMA)).toHaveLength(documents.length);
    // The table the positive sweep held before REQ-02 had 43 rows; a kind removed from the registry shows here.
    expect(documents.length).toBeGreaterThanOrEqual(43);
  });

  it("an unknown kind is not registered, and evaluateSemanticRules still answers it as before", () => {
    expect(isSemanticKind("planted-unknown-kind")).toBe(false);
    expect(isSemanticKind("toString")).toBe(false);
    expect(schemaOfKind("planted-unknown-kind")).toBeUndefined();
    expect(documentKindsOf("no-such.schema.json")).toEqual([]);
    expect(evaluateSemanticRules("planted-unknown-kind", {})).toEqual([]);
  });
});
