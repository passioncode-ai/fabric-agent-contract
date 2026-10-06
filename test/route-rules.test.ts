import { describe, expect, it } from "vitest";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

const codes = (kind: string, value: unknown) => evaluateSemanticRules(kind as string, value).map((finding) => finding.code);
const provider = (id: string, revision = 1) => ({ id, revision, contentHash: `sha256:${revision.toString(16).padStart(64, "0")}` });
const candidate = (runnerKind: string, session: Record<string, string> = { attach: "preferred", spawn: "allowed" }, id = `urn:fabric:provider:${runnerKind}-local`) =>
  ({ runnerKind, provider: provider(id), session });
const route = (candidates: unknown[]) => ({ kind: "runner-route", project: "urn:project:a", capability: "urn:fabric:capability:agent-chat", candidates });

describe("runner-route semantic rules (DEC-0026)", () => {
  it("FAC-SEM-028 flags a runner kind that appears twice", () => {
    expect(codes("runner-route", route([candidate("claude-code"), candidate("codex"), candidate("claude-code")]))).toContain("FAC-SEM-028");
  });

  it("FAC-SEM-028 accepts distinct kinds in preference order", () => {
    expect(codes("runner-route", route([candidate("claude-code"), candidate("codex"), candidate("hermes")]))).toEqual([]);
  });

  it("FAC-SEM-029 flags a candidate that can neither attach nor spawn", () => {
    expect(codes("runner-route", route([candidate("claude-code", { attach: "never", spawn: "never" })]))).toContain("FAC-SEM-029");
    expect(codes("runner-route", route([candidate("claude-code", { attach: "never", spawn: "allowed" })]))).toEqual([]);
  });

  it("FAC-SEM-030 flags a candidate whose provider revision is not admitted", () => {
    const admissions = [{ provider: provider("urn:fabric:provider:claude-code-local"), state: "admitted" }];
    const bundle = (candidates: unknown[]) => ({ route: route(candidates), admissions });
    expect(codes("route-bundle", bundle([candidate("claude-code"), candidate("hermes")]))).toContain("FAC-SEM-030");
    expect(codes("route-bundle", bundle([candidate("claude-code")]))).toEqual([]);
  });

  it("FAC-SEM-030 matches the admitted revision, not just the provider id", () => {
    const admissions = [{ provider: provider("urn:fabric:provider:claude-code-local", 2), state: "admitted" }];
    expect(codes("route-bundle", { route: route([candidate("claude-code")]), admissions })).toContain("FAC-SEM-030");
  });
});
