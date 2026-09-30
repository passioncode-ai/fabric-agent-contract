// #region interop-rules — docs: docs/specification/interop.md#semantic-rules
import { type Finding, type JsonObject, isObject, jsonEqual } from "./findings.js";

/** C3.1: the tool annotations a capability's declared effect and idempotency imply. */
export function expectedAnnotations(effect: unknown, idempotency: unknown): Record<string, true> {
  const hints: Record<string, true> = {};
  if (effect === "none") hints.readOnlyHint = true;
  if (["delete", "merge", "deploy", "change-policy"].includes(String(effect))) hints.destructiveHint = true;
  if (idempotency === "required") hints.idempotentHint = true;
  return hints;
}

const INTEROP_KEY = "https://fabric.passioncode.ai/agent-contract/extensions/interop/0.1";
const ENVELOPE_REQUIRED = ["id", "contractVersion", "outcome", "done", "proof", "scope", "notVerified", "artifacts", "createdAt", "producer", "output", "usage"];

/** The job handle, inline, as a tool's outputSchema carries it (same shape as interop-job-handle.schema.json). */
export const JOB_HANDLE_SCHEMA = {
  type: "object", required: ["job"], additionalProperties: false,
  properties: { job: { type: "object", required: ["id", "status"], additionalProperties: false,
    properties: { id: { type: "string", minLength: 1, maxLength: 128, pattern: "^[A-Za-z0-9._:-]+$" }, status: { const: "working" } } } }
} as const;

/**
 * DEC-0017 (OQ-0006) as amended by DEC-0018: a job-backed tool's outputSchema is
 * {type: "object", oneOf: [result envelope, job handle]}, self-contained (no $ref, since an
 * MCP client does not fetch one), so structuredContent always conforms. The root `type`
 * is required: a client (Claude Code 2.1.285) rejects a whole tools/list whose outputSchema
 * has a bare oneOf root. The capability in the manifest keeps the pure `output` schema.
 */
export function jobToolOutputSchema(output: unknown): Record<string, unknown> {
  return { type: "object", oneOf: [{ type: "object", required: ENVELOPE_REQUIRED, properties: { output } }, JOB_HANDLE_SCHEMA] };
}

/** FAC-SEM-023 (DEC-0018): a tool's outputSchema, when it has one, is rooted at `type: "object"`. */
function objectRootFinding(tool: JsonObject, at: string): Finding | undefined {
  if (tool.outputSchema === undefined) return undefined;
  const schema = tool.outputSchema;
  if (isObject(schema) && schema.type === "object") return undefined;
  return { code: "FAC-SEM-023", instancePath: `${at}/outputSchema/type`, message: `tool ${String(tool.name)} declares an outputSchema whose root is not type "object"; MCP requires an object root and a client rejects the whole tool list otherwise` };
}

const isJobCapability = (capability: JsonObject): boolean => {
  const extensions = isObject(capability.extensions) ? capability.extensions : {};
  const block = extensions[INTEROP_KEY];
  return isObject(block) && block.job === true;
};

const TRACEPARENT = /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;

/** C3.4: a W3C Trace Context Level 1 `traceparent`, or null when it is not one. */
export function parseTraceparent(value: unknown): { version: string; traceId: string; parentId: string; flags: string } | null {
  if (typeof value !== "string") return null;
  const match = TRACEPARENT.exec(value);
  if (!match) return null;
  const [, version, traceId, parentId, flags] = match as unknown as [string, string, string, string, string];
  if (version === "ff" || /^0+$/.test(traceId) || /^0+$/.test(parentId)) return null;
  return { version, traceId, parentId, flags };
}

const envelopeTrace = (result: unknown): unknown => (isObject(result) && isObject(result.trace) ? result.trace.traceparent : undefined);

/** FAC-SEM-019 (DEC-0017): the envelope's `trace` is authoritative; without it the span is `incomplete`. */
export function spanCompleteness(value: { job?: unknown; result?: unknown; meta?: unknown }): "complete" | "incomplete" {
  const result = isObject(value.job) ? value.job.result : value.result;
  return parseTraceparent(envelopeTrace(result)) ? "complete" : "incomplete";
}

const SECRET_WORDS = /pass(word|phrase)|secret|api[\s_-]?key|access[\s_-]?key|private[\s_-]?key|(access|auth|bearer|refresh|session)[\s_-]?token|^token$|credential/i;

function toolFindings(value: JsonObject): Finding[] {
  const capability = isObject(value.capability) ? value.capability : {};
  const schemas = isObject(value.schemas) ? value.schemas : {};
  const name = String(capability.name);
  const tool = value.tool;
  const out = (instancePath: string, message: string): Finding => ({ code: "FAC-SEM-017", instancePath, message });
  if (!isObject(tool) || tool.name !== name) return [out("/tool", `capability ${name} is not served as an MCP tool named ${name}`)];
  const findings: Finding[] = [];
  if (!jsonEqual(tool.inputSchema, schemas.input)) findings.push(out("/tool/inputSchema", `tool ${name} serves an inputSchema that differs from the manifest's`));
  const expectedOutput = isJobCapability(capability) ? jobToolOutputSchema(schemas.output) : schemas.output;
  if (!jsonEqual(tool.outputSchema, expectedOutput)) findings.push(out("/tool/outputSchema", isJobCapability(capability) ? `job tool ${name} must serve oneOf[result envelope, job handle] around the manifest's outputSchema` : `tool ${name} serves an outputSchema that differs from the manifest's`));
  const root = objectRootFinding(tool, "/tool");
  if (root) findings.push(root);
  const annotations = isObject(tool.annotations) ? tool.annotations : {};
  for (const [hint, expected] of Object.entries(expectedAnnotations(capability.effect, capability.idempotency))) {
    if (annotations[hint] !== expected) findings.push(out(`/tool/annotations/${hint}`, `effect ${String(capability.effect)} / idempotency ${String(capability.idempotency)} requires ${hint}: true`));
  }
  return findings;
}

function formSecretFindings(value: JsonObject): Finding[] {
  const requests = isObject(value.inputRequests) ? value.inputRequests : {};
  const findings: Finding[] = [];
  for (const [key, request] of Object.entries(requests)) {
    const params = isObject(request) && isObject(request.params) ? request.params : {};
    if ((params.mode ?? "form") !== "form") continue;
    const schema = isObject(params.requestedSchema) ? params.requestedSchema : {};
    const properties = isObject(schema.properties) ? schema.properties : {};
    for (const [field, fieldSchema] of Object.entries(properties)) {
      const words = [field, ...(isObject(fieldSchema) ? [fieldSchema.title, fieldSchema.description, fieldSchema.format] : [])].filter((item) => typeof item === "string").join(" ");
      if (SECRET_WORDS.test(field) || SECRET_WORDS.test(words)) {
        findings.push({ code: "FAC-SEM-018", instancePath: `/inputRequests/${key}/params/requestedSchema/properties/${field}`, message: `form-mode request ${key} asks for a secret (${field}); use URL mode` });
      }
    }
  }
  return findings;
}

/** FAC-SEM-019 and FAC-SEM-022 for one result envelope and the `_meta` of the answer that carried it. */
function resultTraceFindings(result: unknown, metaValue: unknown, label: string, at: string): Finding[] {
  const envelope = parseTraceparent(envelopeTrace(result));
  if (!envelope) return [{ code: "FAC-SEM-019", instancePath: `${at}/trace`, severity: "accepted", message: `${label} carries no trace in its envelope; accepted, span recorded incomplete` }];
  const meta = parseTraceparent(isObject(metaValue) ? metaValue.traceparent : undefined);
  if (meta && (meta.traceId !== envelope.traceId || meta.parentId !== envelope.parentId)) {
    return [{ code: "FAC-SEM-022", instancePath: "/meta/traceparent", message: `${label}: the answer's _meta.traceparent disagrees with the envelope's trace, which is authoritative` }];
  }
  return [];
}

function traceFindings(value: JsonObject): Finding[] {
  const job = isObject(value.job) ? value.job : {};
  if (job.status !== "completed" && job.result === undefined) return [];
  return resultTraceFindings(job.result, value.meta, `job ${String(job.id)}`, "/job/result");
}

export function interopRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (kind === "interop-tool") return toolFindings(value);
  if (kind === "interop-tool-list") {
    const tools = Array.isArray(value.tools) ? value.tools.filter(isObject) : [];
    return tools.flatMap((served, index) => objectRootFinding(served, `/tools/${index}`) ?? []);
  }
  if (kind === "interop-input-requests") return formSecretFindings(value);
  if (kind === "interop-job-trace") return traceFindings(value);
  if (kind === "interop-result-trace") return resultTraceFindings(value.result, value.meta, "the result", "/result");
  return undefined;
}
// #endregion interop-rules
