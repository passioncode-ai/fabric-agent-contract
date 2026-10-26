import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { actionDecision } from "../src/actions.js";
import { projectRoot } from "../src/contract.js";
import { MAX_CHAIN_DEPTH } from "../src/delegation.js";
import { handOn, type Mandate, mandateCovers, mandateProblem } from "../src/mandate.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { buildMandateVectors } from "../tools/vectors/mandate.js";

// DEC-0125: the operator's mandate travels with the task; every call under it appends the agent it calls.
type Json = Record<string, any>;
const root = projectRoot();
const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");
const vectors = JSON.parse(read("fixtures/vectors/mandate.json")) as { cases: Array<{ name: string; input: Json; expected: Json }> };
const base = vectors.cases[0]?.input.mandate as Mandate;
const leading: Mandate = { ...base, chain: [base.chain[0] as Mandate["chain"][number]] };

describe("the mandate vectors (DEC-0125)", () => {
  it("are what the generator writes", () => {
    expect(read("fixtures/vectors/mandate.json")).toBe(buildMandateVectors());
  });

  it.each(vectors.cases.map((vector) => [vector.name, vector] as const))("mandateCovers: %s", (_name, vector) => {
    expect(mandateCovers(vector.input as Parameters<typeof mandateCovers>[0])).toEqual(vector.expected);
  });
});

describe("handing a mandate on (MD-2)", () => {
  it("appends the callee, narrows, and refuses to widen or to add a fifth agent", () => {
    const narrow = { capabilities: ["research.run"], effects: ["charge"], perCallMaxUsd: 5, projects: ["example-site"] };
    const next = handOn(leading, "example-researcher", "2026-10-26T10:05:00Z", narrow);
    expect(next.chain.map((step) => step.agent)).toEqual(["example-developer", "example-researcher"]);
    expect(mandateProblem(next)).toBeUndefined();
    expect(handOn(leading, "example-researcher", "2026-10-26T10:05:00Z").chain[1]).toEqual({ agent: "example-researcher", at: "2026-10-26T10:05:00Z" });
    expect(() => handOn(next, "example-third", "2026-10-26T10:06:00Z", { ...narrow, perCallMaxUsd: 6 })).toThrow("mandate-widened");
    expect(() => handOn(next, "example-third", "2026-10-26T10:06:00Z", { capabilities: ["research.run"], effects: ["charge"], projects: ["example-site"] })).toThrow("mandate-widened");
    expect(() => handOn(next, "example-developer", "2026-10-26T10:06:00Z")).toThrow("mandate-malformed");
    let long = next;
    for (const agent of ["example-third", "example-fourth"]) long = handOn(long, agent, "2026-10-26T10:07:00Z");
    expect(() => handOn(long, "example-fifth", "2026-10-26T10:08:00Z")).toThrow("mandate-malformed");
  });

  it("holds the chain to a delegation chain's depth (DL-6)", () => {
    const schema = JSON.parse(read("schemas/mandate.schema.json")) as Json;
    expect(schema.properties.chain.maxItems).toBe(MAX_CHAIN_DEPTH);
  });

  it("checks the document as kind mandate (FAC-SEM-144)", () => {
    expect(evaluateSemanticRules("mandate", base as unknown as Json)).toEqual([]);
    expect(evaluateSemanticRules("mandate", { ...base, expiresAt: base.at } as Json).map((finding) => finding.code)).toEqual(["FAC-SEM-144"]);
    expect(mandateProblem({ ...base, at: "26 Oct" })).toBe("mandate-malformed");
    expect(mandateProblem({ ...base, chain: [{ agent: "example-developer", at: "not a time" }] })).toBe("mandate-malformed");
  });
});

describe("a relayed action under a mandate (MD-3, DEC-0121 AP-2)", () => {
  const action = { id: "approve-draft", title: "Approve the draft", tool: "page.update", gate: "relayed" };
  const mandate = { ...base, scope: { ...base.scope, actions: ["approve-draft"] } };
  const call = { action, tier: "T0", caller: "agent:claude-code", callerAgent: "example-developer", self: "example-researcher", now: "2026-10-26T12:00:00Z", mandate, effect: "draft", project: "example-site" };

  it("takes the action as the operator's, recorded with the task, the chain and the caller", () => {
    expect(actionDecision(call)).toEqual({ ok: true, recordAs: { by: "operator", via: "mandate", task: base.task, chain: ["example-developer", "example-researcher"], caller: "agent:claude-code" } });
    expect(actionDecision({ ...call, spendUsd: 3 })).toEqual(actionDecision(call));
    expect(actionDecision({ ...call, project: undefined, spendUsd: "3" })).toEqual(actionDecision(call));
    // The shared descriptor token on loopback names no agent: the chain's end binds the mandate.
    expect(actionDecision({ ...call, callerAgent: undefined })).toEqual(actionDecision(call));
  });

  it("refuses what the mandate does not cover, names an invalid one, and owes the action's effect", () => {
    expect(actionDecision({ ...call, action: { ...action, id: "publish-page" } })).toEqual({ ok: false, code: "operator-decision-required", data: { detail: "outside-mandate: action" } });
    expect(actionDecision({ ...call, now: "2026-10-28T12:00:00Z" })).toEqual({ ok: false, code: "decision-invalid", data: { detail: "mandate-expired" } });
    expect(actionDecision({ ...call, self: "example-other" })).toEqual({ ok: false, code: "decision-invalid", data: { detail: "mandate-not-for-this-call" } });
    expect(actionDecision({ ...call, callerAgent: "example-other" })).toEqual({ ok: false, code: "decision-invalid", data: { detail: "mandate-not-for-this-call" } });
    expect(actionDecision({ ...call, effect: undefined })).toEqual({ fault: "effect-missing" });
    expect(actionDecision({ ...call, self: undefined })).toEqual({ fault: "self-missing" });
    expect(actionDecision({ ...call, now: "later" })).toEqual({ fault: "now-unreadable" });
  });

  it("lets a decision in the same call take precedence, and a T2 caller still needs an approval", () => {
    const decision = { by: "operator", via: "relayed-instruction", action: "approve-draft", instruction: "approve the draft", at: "2026-10-26T11:59:00Z" };
    expect(actionDecision({ ...call, decision })).toEqual({ ok: true, recordAs: { by: "operator", via: "relayed-instruction", caller: "agent:claude-code" } });
    expect(actionDecision({ ...call, tier: "T2", actionDigest: `sha256:${"a".repeat(64)}` })).toEqual({ ok: false, code: "approval-required", data: { actionDigest: `sha256:${"a".repeat(64)}` } });
  });
});
