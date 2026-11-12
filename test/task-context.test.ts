import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { resolveTaskContext } from "../src/task-context.js";
import { buildTaskContextVectors, VECTOR_FILE } from "../tools/vectors/task-context.js";

// DEC-0165: the context of a task. Hand-written expectations in the vectors; the reference must give exactly those.
type Json = Record<string, any>;
const committed = readFileSync(path.join(projectRoot(), VECTOR_FILE), "utf8");
const vectors = JSON.parse(committed) as { cases: Json[] };

describe("task context (DEC-0165)", () => {
  it("is the file the generator writes", () => expect(committed).toBe(buildTaskContextVectors()));
  it.each(vectors.cases.map((c) => [c.name, c] as const))("%s", (_name, c) => expect(resolveTaskContext(c.claims, c.reachable)).toEqual(c.expected));
  it("refuses claims that are not a list, too many claims, a claim not an object, and too many reachable contexts", () => {
    expect(resolveTaskContext("folder", [])).toEqual({ fault: "claims-invalid" });
    expect(resolveTaskContext(Array.from({ length: 21 }, () => ({ source: "folder", contexts: ["personal"] })), [])).toEqual({ fault: "claims-invalid" });
    expect(resolveTaskContext([7], [])).toEqual({ fault: "claims-invalid" });
    expect(resolveTaskContext([{ source: "folder", contexts: "personal" }], [])).toEqual({ fault: "claims-invalid" });
    expect(resolveTaskContext([{ source: "folder", contexts: Array.from({ length: 17 }, () => "personal") }], [])).toEqual({ fault: "claims-invalid" });
    expect(resolveTaskContext([], Array.from({ length: 65 }, () => "personal"))).toEqual({ fault: "reachable-invalid" });
    expect(resolveTaskContext([], [7])).toEqual({ fault: "reachable-invalid" });
  });
  it("FAC-SEM-172: a recorded answer is the one the reference gives", () => {
    const c = vectors.cases[3] as Json;
    const codes = (answer: unknown) => evaluateSemanticRules("task-context", { claims: c.claims, reachable: c.reachable, answer }).map((f) => `${f.code} ${f.instancePath}`);
    expect(codes(c.expected)).toEqual([]);
    expect(codes({ settled: "org:org-b", by: ["folder"] })).toEqual(["FAC-SEM-172 /answer"]);
  });
});
