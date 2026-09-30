import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { Ajv2020 } from "ajv/dist/2020.js";
import { JOB_HANDLE_SCHEMA, expectedAnnotations, jobToolOutputSchema, parseTraceparent, spanCompleteness } from "../src/interop-rules.js";

const codes = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((finding) => finding.code);
const TRACEPARENT = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";
const input = { type: "object", properties: { topic: { type: "string" } }, required: ["topic"] };
const output = { type: "object", properties: { title: { type: "string" }, body: { type: "string" } }, required: ["title"] };
const capability = (effect = "draft", idempotency = "supported") => ({ name: "copy.write", effect, idempotency, inputSchema: "https://agents.example/in", outputSchema: "https://agents.example/out" });
const tool = (extra: Record<string, unknown> = {}) => ({ name: "copy.write", inputSchema: input, outputSchema: output, annotations: {}, ...extra });
const served = (cap: Record<string, unknown>, served: Record<string, unknown> | undefined) => ({ capability: cap, schemas: { input, output }, tool: served });

describe("C3.1 capabilities are served as MCP tools (FAC-SEM-017)", () => {
  it("accepts a tool whose name, schemas and annotations match the manifest", () => {
    const reordered = { required: ["title"], properties: { body: { type: "string" }, title: { type: "string" } }, type: "object" };
    expect(codes("interop-tool", served(capability(), tool({ outputSchema: reordered })))).toEqual([]);
  });

  it("flags a capability that is not served as a tool of the same name", () => {
    expect(codes("interop-tool", served(capability(), undefined))).toContain("FAC-SEM-017");
    expect(codes("interop-tool", served(capability(), tool({ name: "copy_write" })))).toContain("FAC-SEM-017");
  });

  it("flags a served schema that differs from the manifest's", () => {
    const widened = { ...output, required: [] };
    expect(codes("interop-tool", served(capability(), tool({ outputSchema: widened })))).toContain("FAC-SEM-017");
    expect(codes("interop-tool", served(capability(), tool({ inputSchema: { type: "object" } })))).toContain("FAC-SEM-017");
  });

  it("flags annotations that contradict the declared effect", () => {
    expect(codes("interop-tool", served(capability("none"), tool({ annotations: {} })))).toContain("FAC-SEM-017");
    expect(codes("interop-tool", served(capability("delete"), tool({ annotations: { destructiveHint: false } })))).toContain("FAC-SEM-017");
    expect(codes("interop-tool", served(capability("draft", "required"), tool({ annotations: {} })))).toContain("FAC-SEM-017");
    expect(codes("interop-tool", served(capability("none", "required"), tool({ annotations: { readOnlyHint: true, idempotentHint: true } })))).toEqual([]);
  });

  it("derives annotations from effect and idempotency", () => {
    expect(expectedAnnotations("none", "none")).toEqual({ readOnlyHint: true });
    for (const effect of ["delete", "merge", "deploy", "change-policy"]) expect(expectedAnnotations(effect, "none")).toEqual({ destructiveHint: true });
    expect(expectedAnnotations("publish", "required")).toEqual({ idempotentHint: true });
  });
});

describe("DEC-0017: a job-backed tool declares oneOf[result envelope, job handle] (FAC-SEM-017)", () => {
  const INTEROP = "https://fabric.passioncode.ai/agent-contract/extensions/interop/0.1";
  const jobCap = { ...capability(), extensions: { [INTEROP]: { job: true } } };

  it("accepts the union and refuses the bare output schema on a job tool", () => {
    expect(codes("interop-tool", served(jobCap, tool({ outputSchema: jobToolOutputSchema(output) })))).toEqual([]);
    expect(codes("interop-tool", served(jobCap, tool()))).toContain("FAC-SEM-017");
    expect(codes("interop-tool", served(capability(), tool({ outputSchema: jobToolOutputSchema(output) })))).toContain("FAC-SEM-017");
  });

  it("the union is self-contained: a handle and an envelope conform, a malformed handle does not", () => {
    const validate = new Ajv2020({ strict: false }).compile(jobToolOutputSchema(output));
    const envelope = { id: "urn:r", contractVersion: "0.1.0", outcome: "partial", done: [], proof: [], scope: {}, notVerified: [], artifacts: [], createdAt: "2026-09-30T08:00:00Z", producer: {}, output: { title: "a" }, usage: { inputTokens: 0, outputTokens: 0, wallMs: 1 } };
    expect(validate({ job: { id: "job_1", status: "working" } })).toBe(true);
    expect(validate(envelope)).toBe(true);
    expect(validate({ job: { id: "job_1", status: "completed" } })).toBe(false);
    expect(validate({ ...envelope, output: { body: "no title" } })).toBe(false);
    expect(JSON.stringify(jobToolOutputSchema(output))).not.toContain("$ref");
    expect(jobToolOutputSchema(output).type).toBe("object");
    expect(JOB_HANDLE_SCHEMA.properties.job.properties.status).toEqual({ const: "working" });
  });
});

describe("DEC-0018: every tool's outputSchema has root type object (FAC-SEM-023)", () => {
  const fixture = async (name: string) => JSON.parse(await readFile(path.join(projectRoot(), "fixtures/semantic", name), "utf8"));

  it("accepts a tools/list whose output schemas are object-rooted, and a tool with none", async () => {
    expect(codes("interop-tool-list", await fixture("interop-tool-list.json"))).toEqual([]);
  });

  it("refuses a union without root type — the shape Claude Code 2.1.285 rejects the whole list for", async () => {
    const findings = evaluateSemanticRules("interop-tool-list", await fixture("interop-tool-list-untyped-union.json"));
    expect(findings.map((f) => f.code)).toEqual(["FAC-SEM-023"]);
    expect(findings[0]?.message).toContain("example.draft");
  });

  it("refuses any other root type, and a capability whose output schema is not an object", () => {
    expect(codes("interop-tool-list", { tools: [{ name: "x", outputSchema: { type: "array" } }] })).toEqual(["FAC-SEM-023"]);
    const arrayOut = { type: "array", items: { type: "string" } };
    expect(codes("interop-tool", { capability: capability(), schemas: { input, output: arrayOut }, tool: tool({ outputSchema: arrayOut }) })).toContain("FAC-SEM-023");
  });
});

describe("C3.3 form mode never asks for a secret (FAC-SEM-018)", () => {
  const form = (properties: Record<string, unknown>) => ({ inputRequests: { ask: { method: "elicitation/create", params: { mode: "form", message: "Answer.", requestedSchema: { type: "object", properties } } } } });

  it("flags a form field that requests a credential", () => {
    for (const [name, schema] of [["apiKey", { type: "string" }], ["password", { type: "string" }], ["value", { type: "string", title: "Access token" }], ["x", { type: "string", description: "Paste your secret key" }]] as const) {
      expect(codes("interop-input-requests", form({ [name]: schema })), name).toContain("FAC-SEM-018");
    }
  });

  it("flags a form request whose mode is omitted (it defaults to form)", () => {
    expect(codes("interop-input-requests", { inputRequests: { ask: { method: "elicitation/create", params: { message: "Key?", requestedSchema: { type: "object", properties: { api_key: { type: "string" } } } } } } })).toContain("FAC-SEM-018");
  });

  it("accepts a titled single-select choice and a URL-mode secret request", () => {
    const choice = form({ title: { type: "string", oneOf: [{ const: "a", title: "Choosing a title" }, { const: "b", title: "How titles work" }] } });
    expect(codes("interop-input-requests", choice)).toEqual([]);
    expect(codes("interop-input-requests", { inputRequests: { key: { method: "elicitation/create", params: { mode: "url", message: "Connect your API key.", url: "https://publish.example/connect" } } } })).toEqual([]);
  });
});

describe("C3.4 trace context (FAC-SEM-019, FAC-SEM-022)", () => {
  const traced = { trace: { traceparent: TRACEPARENT } };
  const completed = { id: "job_1", status: "completed", updatedAt: "2026-09-30T08:10:02Z", result: traced };
  const untraced = { ...completed, result: {} };

  it("parses a W3C traceparent and refuses malformed ones", () => {
    expect(parseTraceparent(TRACEPARENT)).toEqual({ version: "00", traceId: "4bf92f3577b34da6a3ce929d0e0e4736", parentId: "00f067aa0ba902b7", flags: "01" });
    for (const bad of [TRACEPARENT.toUpperCase(), "00-" + "0".repeat(32) + "-00f067aa0ba902b7-01", "00-4bf92f3577b34da6a3ce929d0e0e4736-" + "0".repeat(16) + "-01", "ff-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01", "00-4bf92f35", undefined]) {
      expect(parseTraceparent(bad as string), String(bad)).toBeNull();
    }
  });

  it("records a result whose envelope carries no trace as an incomplete span, never a rejection", () => {
    const findings = evaluateSemanticRules("interop-job-trace", { job: untraced, meta: {} });
    expect(findings.map((f) => f.code)).toEqual(["FAC-SEM-019"]);
    expect(findings[0]?.severity).toBe("accepted");
    expect(spanCompleteness({ job: untraced, meta: {} })).toBe("incomplete");
    expect(spanCompleteness({ job: { ...completed, result: { trace: { traceparent: "not-a-trace" } } }, meta: {} })).toBe("incomplete");
  });

  it("reads the envelope, not the response: the envelope's trace is authoritative", () => {
    expect(codes("interop-job-trace", { job: completed, meta: {} })).toEqual([]);
    expect(spanCompleteness({ job: completed, meta: {} })).toBe("complete");
    expect(spanCompleteness({ job: untraced, meta: { traceparent: TRACEPARENT } })).toBe("incomplete");
  });

  it("FAC-SEM-022 refuses a response whose _meta.traceparent disagrees with the envelope", () => {
    const other = "00-4bf92f3577b34da6a3ce929d0e0e4736-b7ad6b7169203331-01";
    const findings = evaluateSemanticRules("interop-job-trace", { job: completed, meta: { traceparent: other } });
    expect(findings.map((f) => f.code)).toEqual(["FAC-SEM-022"]);
    expect(findings[0]?.severity).toBeUndefined();
    expect(codes("interop-job-trace", { job: completed, meta: { traceparent: TRACEPARENT } })).toEqual([]);
    expect(codes("interop-result-trace", { result: traced, meta: { traceparent: other } })).toEqual(["FAC-SEM-022"]);
    expect(codes("interop-result-trace", { result: {}, meta: { traceparent: TRACEPARENT } })).toEqual(["FAC-SEM-019"]);
  });

  it("does not judge a job that has not produced its result yet", () => {
    expect(codes("interop-job-trace", { job: { id: "job_1", status: "working", updatedAt: "2026-09-30T08:10:02Z" }, meta: {} })).toEqual([]);
  });
});
