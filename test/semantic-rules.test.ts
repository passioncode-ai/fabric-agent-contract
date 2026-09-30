import { describe, expect, it } from "vitest";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

describe("cross-object semantic rules", () => {
  it.each([
    ["result", { outcome: "succeeded", notVerified: [{ claim: "deploy", reason: "not checked" }] }, "FAC-SEM-001"],
    ["execution-bundle", { context: { selectedAccount: "urn:account:b" }, pool: { accounts: [{ accountRef: "urn:account:a" }] } }, "FAC-SEM-002"],
    ["learning", { selfApply: true }, "FAC-SEM-003"],
    ["promotion", { classification: "personal" }, "FAC-SEM-004"],
    ["roles", { assignments: [] }, "FAC-SEM-005"],
    ["coordination", { kind: "renew" }, "FAC-SEM-007"],
    ["binding-bundle", { admission: { state: "probe-failed" } }, "FAC-SEM-008"]
  ])("%s rejects unsafe combination", (kind, value, code) => {
    expect(evaluateSemanticRules(kind as string, value).map((finding) => finding.code)).toContain(code);
  });

  it("accepts safe combinations", () => {
    expect(evaluateSemanticRules("result", { outcome: "succeeded", notVerified: [] })).toEqual([]);
    expect(evaluateSemanticRules("learning", { selfApply: false })).toEqual([]);
    expect(evaluateSemanticRules("promotion", { classification: "project-internal" })).toEqual([]);
  });
});
