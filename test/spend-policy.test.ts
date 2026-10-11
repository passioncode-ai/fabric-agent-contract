import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";

// DEC-0037: a project's spend policy, chosen from options computed for that project, and grants that carry
// an amount — so an agent checks a record instead of asking.
const load = (relative: string) => JSON.parse(readFileSync(path.join(projectRoot(), "fixtures", relative), "utf8")) as Record<string, unknown>;
const validator = await createValidator();
const valid = (schema: string, value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}`, value).valid;
const codes = (value: unknown) => evaluateSemanticRules("spend-policy", value).map((f) => f.code);

describe("spend policy (DEC-0037, FAC-SEM-047)", () => {
  it("accepts a limited policy and a recorded \"no project limit\", by schema and by FAC-SEM-047", () => {
    for (const f of ["positive/spend-policy-limited.json", "positive/spend-policy-no-project-limit.json"]) {
      expect(valid("spend-policy.schema.json", load(f))).toBe(true);
      expect(codes(load(f))).toEqual([]);
    }
  });

  it("refuses an auto-approve threshold above the limit, two preselected options, and an unoffered \"no project limit\"", () => {
    for (const f of ["semantic/spend-policy-auto-approve-above-limit.json", "semantic/spend-policy-two-preselected.json", "semantic/spend-policy-no-limit-not-offered.json"]) {
      const value = load(f);
      expect(valid("spend-policy.schema.json", value), f).toBe(true);
      expect(codes(value), f).toEqual(["FAC-SEM-047"]);
    }
  });

  it("never lets a policy name another agent's key: a credential source is the project's own key or another agent's capability", () => {
    expect(valid("spend-policy.schema.json", load("negative/spend-policy-borrowed-key.json"))).toBe(false);
    const share = load("positive/governance-grant-spend.json");
    expect(valid("governance.schema.json", share)).toBe(true);
    expect((share.spend as Record<string, unknown>).credentialSource).toMatchObject({ kind: "capability" });
  });

  it("lets a grant be unlimited, or limited by several windows at once, the owner paying (DEC-0038, FAC-SEM-048)", () => {
    const grantCodes = (value: unknown) => evaluateSemanticRules("grant-spend", value).map((f) => f.code);
    for (const f of ["positive/governance-grant-spend.json", "positive/governance-grant-unlimited.json"]) {
      expect(valid("governance.schema.json", load(f)), f).toBe(true);
      expect(grantCodes(load(f)), f).toEqual([]);
    }
    const windows = ((load("positive/governance-grant-spend.json").spend as Record<string, unknown>).limits as { window: string }[]).map((l) => l.window).sort();
    expect(windows).toEqual(["day", "month", "project", "task", "total", "week"]);
    for (const f of ["semantic/grant-spend-window-twice.json", "semantic/grant-spend-call-above-window.json"]) {
      expect(valid("governance.schema.json", load(f)), f).toBe(true);
      expect(grantCodes(load(f)), f).toEqual(["FAC-SEM-048"]);
    }
    expect(valid("governance.schema.json", load("negative/grant-spend-unknown-payer.json"))).toBe(false);
    expect(valid("governance.schema.json", load("negative/grant-spend-limited-without-limits.json"))).toBe(false);
  });
});
