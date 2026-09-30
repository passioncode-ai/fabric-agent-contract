import { describe, expect, it } from "vitest";
import { checkPipeline, type CapabilityInfo, type PipelineInput } from "../src/pipeline-check.js";

const topics = { type: "object", properties: { topics: { type: "array", items: { type: "string" } }, count: { type: "integer" } }, required: ["topics"] };
const draft = { type: "object", properties: { html: { type: "string" }, words: { type: "integer" } }, required: ["html"] };
const capabilities: Record<string, CapabilityInfo> = {
  "research.topics": { effect: "none", inputSchema: { type: "object" }, outputSchema: topics },
  "copy.write": { effect: "draft", inputSchema: { type: "object", properties: { topics: { type: "array", items: { type: "string" } } }, required: ["topics"] }, outputSchema: draft },
  "site.publish": { effect: "publish", inputSchema: { type: "object", properties: { html: { type: "string" } }, required: ["html"] }, outputSchema: { type: "object" } }
};
const pipeline = (): { id: string; version: number; scope: string; reason: string; stages: Array<Record<string, unknown>> } => ({
  id: "article-publish", version: 3, scope: "estate", reason: "checker before publish",
  stages: [
    { id: "research", capability: "research.topics", preferred: "claude-code", produces: "ranked-topics" },
    { id: "draft", capability: "copy.write", needs: ["research"], produces: "draft" },
    { id: "check", checker: true, needs: ["draft"], produces: "verdict" },
    { id: "publish", capability: "site.publish", needs: ["check"], effect: "publish" }
  ]
});
const run = (input: Partial<PipelineInput>) => checkPipeline({ pipeline: pipeline(), capabilities, phase: "save", ...input });
const codes = (input: Partial<PipelineInput>) => run(input).map((finding) => finding.code);

describe("pipeline/0.1 reference checker", () => {
  it("accepts the locked example", () => {
    expect(run({})).toEqual([]);
  });

  it("PL-1 flags an edge whose producer lacks a required property", () => {
    const narrow = { ...capabilities, "research.topics": { ...capabilities["research.topics"]!, outputSchema: { type: "object", properties: { count: { type: "integer" } } } } };
    const findings = run({ capabilities: narrow });
    expect(findings.map((f) => f.code)).toContain("PL-1");
    expect(findings.find((f) => f.code === "PL-1")?.message).toContain("topics");
  });

  it("PL-1 flags an incompatible type and follows arrays and nested objects", () => {
    const asNumber = { ...capabilities, "copy.write": { ...capabilities["copy.write"]!, outputSchema: { type: "object", properties: { html: { type: "number" } }, required: ["html"] } } };
    expect(codes({ capabilities: asNumber })).toContain("PL-1");
    const itemsDiffer = { ...capabilities, "research.topics": { ...capabilities["research.topics"]!, outputSchema: { type: "object", properties: { topics: { type: "array", items: { type: "integer" } } } } } };
    expect(codes({ capabilities: itemsDiffer })).toContain("PL-1");
    const nested = (inner: unknown) => ({ ...capabilities,
      "research.topics": { ...capabilities["research.topics"]!, outputSchema: { type: "object", properties: { topics: { type: "array", items: { type: "string" } }, meta: inner } } },
      "copy.write": { ...capabilities["copy.write"]!, inputSchema: { type: "object", properties: { topics: { type: "array", items: { type: "string" } }, meta: { type: "object", properties: { lang: { type: "string" } }, required: ["lang"] } }, required: ["topics", "meta"] } } });
    expect(codes({ capabilities: nested({ type: "object", properties: { lang: { type: "string" } } }) })).not.toContain("PL-1");
    expect(codes({ capabilities: nested({ type: "object", properties: { region: { type: "string" } } }) })).toContain("PL-1");
  });

  it("PL-1 treats integer as a subset of number, never the reverse", () => {
    const consumerNumber = { ...capabilities, "site.publish": { ...capabilities["site.publish"]!, inputSchema: { type: "object", properties: { words: { type: "number" } }, required: ["words"] } } };
    expect(codes({ capabilities: consumerNumber })).not.toContain("PL-1");
    const producerNumber = { ...consumerNumber, "copy.write": { ...capabilities["copy.write"]!, outputSchema: { type: "object", properties: { html: { type: "string" }, words: { type: "number" } } } },
      "site.publish": { ...capabilities["site.publish"]!, inputSchema: { type: "object", properties: { words: { type: "integer" } }, required: ["words"] } } };
    expect(codes({ capabilities: producerNumber })).toContain("PL-1");
  });

  it("PL-1 resolves $ref and fails an unresolvable one", () => {
    const viaRef = { ...capabilities, "copy.write": { ...capabilities["copy.write"]!, outputSchema: "https://agents.example/schemas/draft.json" } };
    expect(codes({ capabilities: viaRef, schemas: { "https://agents.example/schemas/draft.json": draft } })).not.toContain("PL-1");
    expect(codes({ capabilities: viaRef })).toContain("PL-1");
    const localRef = { ...capabilities, "copy.write": { ...capabilities["copy.write"]!, outputSchema: { $defs: { h: { type: "string" } }, type: "object", properties: { html: { $ref: "#/$defs/h" } } } } };
    expect(codes({ capabilities: localRef })).not.toContain("PL-1");
    const brokenRef = { ...capabilities, "copy.write": { ...capabilities["copy.write"]!, outputSchema: { type: "object", properties: { html: { $ref: "#/$defs/missing" } } } } };
    expect(codes({ capabilities: brokenRef })).toContain("PL-1");
  });

  it("PL-2 flags an effectful stage with a path from the start that skips the checker", () => {
    const p = pipeline();
    p.stages[3] = { id: "publish", capability: "site.publish", needs: ["draft"], effect: "publish" };
    expect(checkPipeline({ pipeline: p, capabilities, phase: "save" }).map((f) => f.code)).toContain("PL-2");
    const both = pipeline();
    both.stages[3] = { id: "publish", capability: "site.publish", needs: ["check", "draft"], effect: "publish" };
    expect(checkPipeline({ pipeline: both, capabilities, phase: "save" }).map((f) => f.code)).toContain("PL-2");
  });

  it("PL-2 takes the effect from the capability, not only from the stage", () => {
    const p = pipeline();
    p.stages[3] = { id: "publish", capability: "site.publish", needs: ["draft"] };
    expect(checkPipeline({ pipeline: p, capabilities, phase: "save" }).map((f) => f.code)).toContain("PL-2");
  });

  it("PL-3 flags a cycle and a need on an unknown stage", () => {
    const cyclic = pipeline();
    cyclic.stages[0] = { ...cyclic.stages[0]!, needs: ["publish"] };
    expect(checkPipeline({ pipeline: cyclic, capabilities, phase: "save" }).map((f) => f.code)).toContain("PL-3");
    const dangling = pipeline();
    dangling.stages[1] = { ...dangling.stages[1]!, needs: ["nowhere"] };
    expect(checkPipeline({ pipeline: dangling, capabilities, phase: "save" }).map((f) => f.code)).toContain("PL-3");
  });

  it("PL-4 runs at run start only and wants exactly one admitted binding per capability", () => {
    const bound = [
      { capability: "research.topics", provider: "claude-code", admitted: true },
      { capability: "copy.write", provider: "example-writer", admitted: true },
      { capability: "site.publish", provider: "example-publisher", admitted: true }
    ];
    expect(codes({ phase: "save" })).not.toContain("PL-4");
    expect(codes({ phase: "run", bindings: bound })).toEqual([]);
    expect(codes({ phase: "run", bindings: bound.slice(0, 2) })).toContain("PL-4");
    expect(codes({ phase: "run", bindings: [...bound.slice(0, 2), { ...bound[2]!, admitted: false }] })).toContain("PL-4");
    expect(codes({ phase: "run", bindings: [...bound, { capability: "copy.write", provider: "another", admitted: true }] })).toContain("PL-4");
  });

  it("PL-4 treats preferred as a hint, not a binding", () => {
    const bound = [
      { capability: "research.topics", provider: "some-other-runner", admitted: true },
      { capability: "copy.write", provider: "example-writer", admitted: true },
      { capability: "site.publish", provider: "example-publisher", admitted: true }
    ];
    expect(codes({ phase: "run", bindings: bound })).toEqual([]);
  });

  it("flags a stage whose capability is not declared", () => {
    const { "copy.write": _dropped, ...rest } = capabilities;
    expect(codes({ capabilities: rest })).toContain("PL-1");
  });
});
