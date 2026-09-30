// #region pipeline-check — docs: docs/specification/pipeline.md#rules
import { type JsonObject, isObject } from "./findings.js";

/** What the checker needs to know about one capability: its effect and its two schemas (inline or by URI). */
export interface CapabilityInfo {
  effect: string;
  inputSchema: unknown;
  outputSchema: unknown;
}

export interface BindingInfo {
  capability: string;
  provider: string;
  admitted: boolean;
}

export interface PipelineInput {
  pipeline: unknown;
  capabilities: Record<string, CapabilityInfo>;
  /** Schema documents by absolute URI, for `$ref` and for schemas given by URI. Nothing is fetched. */
  schemas?: Record<string, unknown>;
  /** Bindings admitted in the project; read only at `phase: "run"` (PL-4). */
  bindings?: BindingInfo[];
  phase: "save" | "run";
}

export interface PipelineFinding {
  code: "PL-1" | "PL-2" | "PL-3" | "PL-4";
  stage: string;
  message: string;
}

interface Stage {
  id: string;
  capability?: string;
  checker: boolean;
  needs: string[];
  effect?: string;
}

const EFFECT_FREE = new Set(["none", "draft"]);

function stagesOf(pipeline: unknown): Stage[] {
  const raw = isObject(pipeline) && Array.isArray(pipeline.stages) ? pipeline.stages.filter(isObject) : [];
  return raw.map((stage) => ({
    id: String(stage.id),
    ...(typeof stage.capability === "string" ? { capability: stage.capability } : {}),
    checker: stage.checker === true,
    needs: Array.isArray(stage.needs) ? stage.needs.map(String) : [],
    ...(typeof stage.effect === "string" ? { effect: stage.effect } : {})
  }));
}

// ---- schema resolution ------------------------------------------------------

class Unresolvable extends Error {}

interface Resolved { schema: JsonObject; root: unknown }

function pointer(root: unknown, fragment: string): unknown {
  if (fragment === "" || fragment === "/") return root;
  let node: unknown = root;
  for (const raw of fragment.replace(/^\//, "").split("/")) {
    const key = decodeURIComponent(raw).replace(/~1/g, "/").replace(/~0/g, "~");
    if (!isObject(node) && !Array.isArray(node)) return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  return node;
}

function resolve(schema: unknown, root: unknown, documents: Record<string, unknown>, depth = 0): Resolved {
  if (depth > 32) throw new Unresolvable("reference chain is too deep");
  if (typeof schema === "string") {
    const [uri, fragment = ""] = schema.split("#");
    const document = documents[uri ?? ""];
    if (document === undefined) throw new Unresolvable(`schema ${schema} is not available`);
    return resolve(pointer(document, fragment), document, documents, depth + 1);
  }
  if (schema === true || schema === undefined) return { schema: {}, root };
  if (!isObject(schema)) throw new Unresolvable("schema is not an object");
  if (typeof schema.$ref === "string") {
    const ref = schema.$ref;
    const target = ref.startsWith("#") ? pointer(root, ref.slice(1)) : ref;
    if (target === undefined) throw new Unresolvable(`$ref ${ref} does not resolve`);
    return ref.startsWith("#") ? resolve(target, root, documents, depth + 1) : resolve(target, root, documents, depth + 1);
  }
  return { schema, root };
}

const typesOf = (schema: JsonObject): Set<string> | undefined =>
  schema.type === undefined ? undefined : new Set(Array.isArray(schema.type) ? schema.type.map(String) : [String(schema.type)]);

/**
 * PL-1: can a value produced under `producer` always stand where `consumer` is required?
 * Types: equal, or integer where number is required; objects recurse on the consumer's
 * required properties; arrays recurse on items. Returns the first reason it cannot.
 */
function incompatibility(producer: Resolved, consumer: Resolved, documents: Record<string, unknown>, at: string): string | undefined {
  const wanted = typesOf(consumer.schema);
  const offered = typesOf(producer.schema);
  if (wanted) {
    if (!offered) return `${at || "value"}: the producer declares no type, the consumer requires ${[...wanted].join("|")}`;
    for (const type of offered) {
      if (!wanted.has(type) && !(type === "integer" && wanted.has("number"))) return `${at || "value"}: ${type} cannot stand where ${[...wanted].join("|")} is required`;
    }
  }
  if (wanted?.has("object") || (!wanted && Array.isArray(consumer.schema.required))) {
    const required = Array.isArray(consumer.schema.required) ? consumer.schema.required.map(String) : [];
    const wantedProps = isObject(consumer.schema.properties) ? consumer.schema.properties : {};
    const offeredProps = isObject(producer.schema.properties) ? producer.schema.properties : {};
    for (const name of required) {
      if (!Object.hasOwn(offeredProps, name)) return `${at ? `${at}.` : ""}${name} is required but the producer's outputSchema does not have it`;
      const reason = incompatibility(resolve(offeredProps[name], producer.root, documents), resolve(wantedProps[name], consumer.root, documents), documents, `${at ? `${at}.` : ""}${name}`);
      if (reason) return reason;
    }
  }
  if (wanted?.has("array") && consumer.schema.items !== undefined) {
    if (producer.schema.items === undefined) return `${at}[]: the producer's items are undeclared`;
    return incompatibility(resolve(producer.schema.items, producer.root, documents), resolve(consumer.schema.items, consumer.root, documents), documents, `${at}[]`);
  }
  return undefined;
}

// ---- rules ---------------------------------------------------------------------

function cycleFindings(stages: Stage[]): PipelineFinding[] {
  const byId = new Map(stages.map((stage) => [stage.id, stage]));
  const findings: PipelineFinding[] = [];
  for (const stage of stages) {
    for (const need of stage.needs) if (!byId.has(need)) findings.push({ code: "PL-3", stage: stage.id, message: `${stage.id} needs ${need}, which is not a stage` });
  }
  const state = new Map<string, "open" | "done">();
  const visit = (id: string, trail: string[]): void => {
    if (state.get(id) === "done") return;
    if (state.get(id) === "open") {
      findings.push({ code: "PL-3", stage: id, message: `needs form a cycle: ${[...trail.slice(trail.indexOf(id)), id].join(" → ")}` });
      return;
    }
    state.set(id, "open");
    for (const need of byId.get(id)?.needs ?? []) if (byId.has(need)) visit(need, [...trail, id]);
    state.set(id, "done");
  };
  for (const stage of stages) visit(stage.id, []);
  return findings;
}

/** The stages whose outputs flow into `stage`: a checker without a capability passes its inputs through. */
function producersOf(stage: Stage, byId: Map<string, Stage>, seen = new Set<string>()): Stage[] {
  const out: Stage[] = [];
  for (const need of stage.needs) {
    const upstream = byId.get(need);
    if (!upstream || seen.has(need)) continue;
    seen.add(need);
    if (upstream.checker && upstream.capability === undefined) out.push(...producersOf(upstream, byId, seen));
    else out.push(upstream);
  }
  return out;
}

function compatibilityFindings(stages: Stage[], input: PipelineInput): PipelineFinding[] {
  const documents = input.schemas ?? {};
  const byId = new Map(stages.map((stage) => [stage.id, stage]));
  const findings: PipelineFinding[] = [];
  for (const stage of stages) {
    if (stage.capability === undefined) continue;
    const consumerInfo = input.capabilities[stage.capability];
    if (!consumerInfo) {
      findings.push({ code: "PL-1", stage: stage.id, message: `capability ${stage.capability} is not declared, so its schemas cannot be checked` });
      continue;
    }
    for (const producer of producersOf(stage, byId)) {
      const producerInfo = producer.capability === undefined ? undefined : input.capabilities[producer.capability];
      if (!producerInfo) continue; // reported on the producer's own stage
      try {
        const reason = incompatibility(resolve(producerInfo.outputSchema, producerInfo.outputSchema, documents), resolve(consumerInfo.inputSchema, consumerInfo.inputSchema, documents), documents, "");
        if (reason) findings.push({ code: "PL-1", stage: stage.id, message: `${producer.id} → ${stage.id}: ${reason}` });
      } catch (error) {
        if (!(error instanceof Unresolvable)) throw error;
        findings.push({ code: "PL-1", stage: stage.id, message: `${producer.id} → ${stage.id}: ${error.message}` });
      }
    }
  }
  return findings;
}

function checkerFindings(stages: Stage[], input: PipelineInput): PipelineFinding[] {
  const byId = new Map(stages.map((stage) => [stage.id, stage]));
  const effectOf = (stage: Stage) => (stage.capability ? input.capabilities[stage.capability]?.effect : undefined) ?? stage.effect;
  // A stage is reached unchecked when some path from a start stage arrives without passing a checker.
  const unchecked = new Map<string, boolean>();
  const reachedUnchecked = (stage: Stage, trail: Set<string>): boolean => {
    const known = unchecked.get(stage.id);
    if (known !== undefined) return known;
    if (trail.has(stage.id)) return false; // a cycle is PL-3's to report
    trail.add(stage.id);
    const parents = stage.needs.map((need) => byId.get(need)).filter((parent): parent is Stage => parent !== undefined);
    const result = parents.length === 0 || parents.some((parent) => !parent.checker && reachedUnchecked(parent, trail));
    trail.delete(stage.id);
    unchecked.set(stage.id, result);
    return result;
  };
  return stages
    .filter((stage) => !stage.checker && !EFFECT_FREE.has(String(effectOf(stage) ?? "none")))
    .filter((stage) => reachedUnchecked(stage, new Set()))
    .map((stage) => ({ code: "PL-2" as const, stage: stage.id, message: `${stage.id} has effect ${String(effectOf(stage))} and a path from the start that passes no checker stage` }));
}

function bindingFindings(stages: Stage[], input: PipelineInput): PipelineFinding[] {
  const findings: PipelineFinding[] = [];
  const bindings = input.bindings ?? [];
  for (const stage of stages) {
    if (stage.capability === undefined) continue;
    const admitted = bindings.filter((binding) => binding.capability === stage.capability && binding.admitted);
    if (admitted.length !== 1) findings.push({ code: "PL-4", stage: stage.id, message: `${stage.capability} resolves to ${admitted.length} admitted bindings in the project; exactly one is required` });
  }
  return findings;
}

/** PL-1…PL-3 before save and before run; PL-4 at run start. */
export function checkPipeline(input: PipelineInput): PipelineFinding[] {
  const stages = stagesOf(input.pipeline);
  const findings = [...cycleFindings(stages), ...compatibilityFindings(stages, input), ...checkerFindings(stages, input)];
  if (input.phase === "run") findings.push(...bindingFindings(stages, input));
  return findings;
}
// #endregion pipeline-check
