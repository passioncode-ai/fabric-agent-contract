import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { actionDecision, actionRules, actionsExtensionRules, actionsView } from "../src/actions.js";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { EXTENSION_KEYS } from "../src/extensions.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { buildActionsVectors } from "../tools/vectors/actions.js";

// DEC-0121: extensions/actions/0.1, the operator's decision in _meta.decision, FAC-SEM-142.
type Json = Record<string, any>;
const read = (file: string) => readFileSync(path.join(projectRoot(), file), "utf8");
const vectors = JSON.parse(read("fixtures/vectors/actions.json")) as {
  cases: Array<{ name: string; input: Json; expected: Json }>;
  declarations: Array<{ name: string; input: Json; findings: string[] }>;
};
const ajv = await createValidator();
const valid = (schema: string, value: unknown) => validateDocument(ajv, `${SCHEMA_PREFIX}schemas/${schema}`, value).valid;

describe("actionDecision (DEC-0121 AP-2, AP-4)", () => {
  it("the vector file is the generator's output", () => {
    expect(read("fixtures/vectors/actions.json")).toBe(buildActionsVectors());
  });
  it.each(vectors.cases)("$name", ({ input, expected }) => {
    expect(actionDecision(input)).toEqual(expected);
  });
  it("covers every answer the reference gives", () => {
    const answers = new Set(vectors.cases.map(({ expected }) => expected.code ?? expected.fault ?? (expected.recordAs === "caller" ? "caller" : expected.recordAs.via)));
    expect([...answers].sort()).toEqual(["action-invalid", "approval", "approval-required", "caller", "caller-missing", "decision-invalid", "digest-missing", "elicitation", "human-step-required", "now-unreadable", "operator-decision-required", "relayed-instruction", "url-missing"]);
  });
  it("every decision a vector takes as the operator's travels in a request's _meta, a sealed call and the hub's agent.call", () => {
    for (const { name, input, expected } of vectors.cases.filter((c) => c.expected.recordAs?.via === "relayed-instruction")) {
      expect(valid("decision.schema.json", input.decision), name).toBe(true);
      expect(valid("interop-request-meta.schema.json", { traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01", decision: input.decision }), name).toBe(true);
      const call = { agentId: "reviews", capability: "reviews.approve", input: {}, decision: input.decision };
      expect(valid("interop-agent-call.schema.json", call), name).toBe(true);
      expect(valid("agent-call-message.schema.json", { type: "fabric-agent-call/1", kind: "call", call }), name).toBe(true);
      expect(valid("agent-call-message.schema.json", { type: "fabric-agent-call/1", kind: "call", call, decision: input.decision }), name).toBe(false);
      expect(expected.recordAs.caller).toBe(input.caller);
    }
  });
  it("records the service's own identity of the caller, never one the decision names", () => {
    const decision = { by: "operator", via: "relayed-instruction", action: "approve-reply", instruction: "approve it", at: "2026-10-24T09:30:00Z" };
    const action = { id: "approve-reply", title: "Approve", tool: "reviews.approve", gate: "relayed" };
    expect(actionDecision({ action, tier: "T0", caller: "agent:codex", decision, now: "2026-10-24T09:30:00Z" })).toEqual({ ok: true, recordAs: { by: "operator", via: "relayed-instruction", caller: "agent:codex" } });
  });
  it("every refusal a vector answers is a valid DL-19 refusal", () => {
    for (const { name, expected } of vectors.cases.filter((c) => c.expected.ok === false)) {
      const error = { code: expected.code, message: "refused", ...(expected.data ? { data: expected.data } : {}) };
      expect(valid("delegation-refusal.schema.json", { error }), name).toBe(true);
    }
    expect(valid("delegation-refusal.schema.json", { error: { code: "human-step-required", message: "pay first" } })).toBe(false);
    expect(valid("delegation-refusal.schema.json", { error: { code: "human-step-required", message: "pay first", data: { humanStep: "payment", url: "http://x.example" } } })).toBe(false);
  });
  it("every declared action a vector reads validates against the extension's schema", () => {
    for (const { name, input } of vectors.cases.filter((c) => c.expected.fault !== "action-invalid")) {
      expect(valid("service-actions-extension.schema.json", { actions: [input.action] }), name).toBe(true);
    }
  });
});

describe("FAC-SEM-142 on a well-known document (DEC-0121 AP-1)", () => {
  it.each(vectors.declarations)("$name", ({ input, findings }) => {
    const found = actionsExtensionRules(input);
    expect(found.map((finding) => finding.instancePath)).toEqual(findings);
    expect(found.every((finding) => finding.code === "FAC-SEM-142")).toBe(true);
  });
  it("names the actions key with the contract's other extension keys", () => {
    expect(EXTENSION_KEYS.actions).toBe("https://fabric.passioncode.ai/agent-contract/extensions/actions/0.1");
  });
  it("reports an invalid declaration once, at the key, naming why", () => {
    const [root] = actionsExtensionRules({ extensions: { [EXTENSION_KEYS.actions]: {} } });
    expect(root?.message).toContain("/ required");
    const [nested] = actionsExtensionRules({ extensions: { [EXTENSION_KEYS.actions]: { actions: [{ id: "x1", title: "X", tool: "x.y", gate: "maybe" }] } } });
    expect(nested?.message).toContain("/actions/0/gate enum");
  });
  it("travels in a valid well-known document, and the positive one passes the rules", () => {
    const positive = JSON.parse(read("fixtures/positive/service-well-known-actions.json")) as Json;
    expect(valid("service-well-known.schema.json", positive)).toBe(true);
    expect(evaluateSemanticRules("service-well-known", positive)).toEqual([]);
  });
  it("actionsView answers what a host reads", () => {
    const value = { actions: [{ id: "approve-reply", title: "Approve", tool: "reviews.approve", gate: "relayed" }] };
    expect(actionsView({})).toEqual({ declared: false });
    expect(actionsView(null)).toEqual({ declared: false });
    expect(actionsView({ extensions: { [EXTENSION_KEYS.actions]: value } })).toEqual({ declared: true, valid: true, actions: value.actions });
    expect(actionsView({ extensions: { [EXTENSION_KEYS.actions]: {} } })).toEqual({ declared: true, valid: false, errors: ["/ required"] });
  });
  it("reads surfaces that are not objects as no capability list", () => {
    const value = { actions: [{ id: "approve-reply", title: "Approve", tool: "reviews.approve", gate: "relayed" }] };
    expect(actionsExtensionRules({ surfaces: "x", extensions: { [EXTENSION_KEYS.actions]: value } })).toEqual([]);
    expect(actionsExtensionRules({ surfaces: { mcp: [] }, extensions: { [EXTENSION_KEYS.actions]: value } })).toEqual([]);
    expect(actionsExtensionRules({ extensions: null })).toEqual([]);
  });
});

describe("kind action-call (FAC-SEM-142)", () => {
  const dir = path.join(projectRoot(), "fixtures/semantic");
  const fixtures = readdirSync(dir).filter((name) => /^(action-call|service-well-known-actions)-/.test(name)).map((name) => ({ name, ...(JSON.parse(readFileSync(path.join(dir, name), "utf8")) as { kind: string; expect: string[]; input: Json }) }));
  it("has fixtures for both kinds, and each finds what it expects", () => {
    expect(fixtures.filter((f) => f.kind === "action-call").length).toBeGreaterThan(5);
    expect(fixtures.filter((f) => f.kind === "service-well-known").length).toBeGreaterThan(5);
    for (const fixture of fixtures) expect(evaluateSemanticRules(fixture.kind, fixture.input).map((f) => f.code), fixture.name).toEqual(fixture.expect);
  });
  it("names the answer the service owes", () => {
    const [finding] = actionRules("action-call", { action: { id: "retry-job", title: "Retry", tool: "jobs.retry", gate: "none" }, tier: "T0", answer: { ok: false, code: "operator-decision-required" } }) ?? [];
    expect(finding).toEqual({ code: "FAC-SEM-142", instancePath: "/answer", message: 'the service answers this call {"ok":true,"recordAs":"caller"} (DEC-0121 AP-2, AP-4)' });
  });
  it("answers nothing for another kind", () => {
    expect(actionRules("service-well-known", {})).toBeUndefined();
  });
});

describe("delegation-refusal keeps DL-19's open data for every other code (DEC-0121)", () => {
  it("admits any data.url on a refusal other than human-step-required", async () => {
    const ajv2 = await createValidator();
    const check = (error: unknown) => validateDocument(ajv2, `${SCHEMA_PREFIX}schemas/delegation-refusal.schema.json`, { error }).valid;
    expect(check({ code: "no-grant", message: "no grant", data: { url: "http://127.0.0.1:8123/grant", humanStep: "approve" } })).toBe(true);
    expect(check({ code: "human-step-required", message: "pay", data: { humanStep: "approve", url: "https://x.example" } })).toBe(false);
  });
});
