import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { EXTENSION_KEYS } from "../src/extensions.js";
import { instanceFacts, instanceFactsRules } from "../src/instance-facts.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { buildInstanceFactsVectors, VECTOR_FILE } from "../tools/vectors/instance-facts.js";

// DEC-0173: extensions/instance-facts/0.1, the reading (IF-5) and FAC-SEM-180 (IF-6).
type Json = Record<string, any>;
const committed = readFileSync(path.join(projectRoot(), VECTOR_FILE), "utf8");
const vectors = JSON.parse(committed) as { cases: Json[] };
const KEY = EXTENSION_KEYS.instanceFacts;

describe("extensions/instance-facts/0.1 (DEC-0173)", () => {
  it("the vector file is the generator's output", () => expect(committed).toBe(buildInstanceFactsVectors()));
  it.each(vectors.cases.map((c) => [c.name, c] as const))("%s", (_name, c) => {
    expect(instanceFacts(c.descriptor ?? undefined, c.wellKnown ?? undefined)).toEqual(c.read);
    const codes = (kind: string, input: unknown) => evaluateSemanticRules(kind, input).filter((f) => f.code === "FAC-SEM-180").map((f) => `${f.code} ${f.instancePath}`);
    if (c.descriptor !== null) expect(codes("service-descriptor", c.descriptor)).toEqual(c.findings.descriptor);
    if (c.wellKnown !== null) expect(codes("service-well-known", c.wellKnown)).toEqual(c.findings.wellKnown);
    if (c.descriptor !== null && c.wellKnown !== null) expect(codes("service-observation", { descriptor: c.descriptor, wellKnown: c.wellKnown })).toEqual(c.findings.pair);
  });
  it("reports nothing for a kind it does not read", () => expect(instanceFactsRules("result", {})).toEqual([]));
  it("never throws on any shape, a member that cannot be printed included", () => {
    const odd = { toString: 1 };
    for (const value of [undefined, null, 1, "x", [], { extensions: null }, { extensions: { [KEY]: odd } }, { extensions: { [KEY]: { access: odd } } }, { placement: odd, peer: odd, runner: odd, extensions: { [KEY]: { access: { audience: "public" } } } }, { surfaces: { dashboard: { login: odd } } }]) {
      expect(() => instanceFacts(value, value)).not.toThrow();
      for (const kind of ["service-descriptor", "service-well-known", "service-observation"]) expect(() => instanceFactsRules(kind, { descriptor: value, wellKnown: value, ...(typeof value === "object" && value !== null ? value : {}) })).not.toThrow();
    }
  });
  it("reads a pair as foreign exactly when FAC-SEM-009 does, the one serviceKey (IF-5)", () => {
    const pairs: Array<[Record<string, unknown>, Record<string, unknown>]> = [
      [{ id: "a.b", instance: "c" }, { id: "a", instance: "b.c" }],
      [{ id: 1 }, { id: "1" }],
      [{ id: {} }, { id: {} }],
      [{ id: "notes" }, { id: "notes", instance: "default" }],
      [{ id: "notes", instance: "x" }, { id: "notes" }],
      [{ id: "notes" }, {}]
    ];
    for (const [descriptor, service] of pairs) {
      const identity = evaluateSemanticRules("service-observation", { descriptor, wellKnown: { service } }).some((f) => f.code === "FAC-SEM-009");
      expect(instanceFacts(descriptor, { service }).foreign, JSON.stringify([descriptor, service])).toBe(identity);
    }
  });
  it("answers a fresh object each time", () => {
    const one = instanceFacts(undefined, undefined);
    one.facts.audience = "public";
    expect(instanceFacts(undefined, undefined).facts).toEqual({});
  });
});
