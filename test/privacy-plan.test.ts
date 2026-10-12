import path from "node:path";
import { describe, expect, it } from "vitest";
import { privacyPlan, type PrivacyInputs } from "../src/privacy-plan.js";

// CT-40: the privacy check never passes on the operator's machine without having run.
// Paths are built at run time from neutral segments, so no machine path sits in the repository's text.
const base = path.join(path.sep, "work");
const main = path.join(base, "contract");
const worktree = path.join(base, "worktrees", "contract-x");
const sibling = path.join(base, "org-index", "scripts", "check_private.py");
const worktreeSibling = path.join(base, "worktrees", "org-index", "scripts", "check_private.py");
const inputs = (over: Partial<PrivacyInputs>, present: string[] = []): PrivacyInputs => ({
  orgIndex: undefined,
  root: main,
  commonDir: path.join(main, ".git"),
  denylistPresent: true,
  exists: (file) => present.includes(file),
  ...over,
});

describe("privacyPlan", () => {
  it("skips where there is no denylist, whatever else is there", () => {
    expect(privacyPlan(inputs({ denylistPresent: false }, [sibling]))).toMatchObject({ action: "skip" });
    expect(privacyPlan(inputs({ denylistPresent: false, orgIndex: path.join(base, "nowhere") }))).toMatchObject({ action: "skip" });
  });
  it("runs the sibling org-index of the main checkout", () => {
    expect(privacyPlan(inputs({}, [sibling]))).toEqual({ action: "run", script: sibling });
  });
  it("finds the main checkout's sibling from a linked worktree through the git common directory", () => {
    expect(privacyPlan(inputs({ root: worktree, commonDir: path.join(main, ".git") }, [sibling]))).toEqual({ action: "run", script: sibling });
    // The worktree's own sibling wins when it exists.
    expect(privacyPlan(inputs({ root: worktree, commonDir: path.join(main, ".git") }, [sibling, worktreeSibling]))).toEqual({ action: "run", script: worktreeSibling });
  });
  it("fails, never skips, when the denylist is present and no script is found", () => {
    const plan = privacyPlan(inputs({ root: worktree, commonDir: path.join(main, ".git") }));
    expect(plan.action).toBe("fail");
    expect(plan.action === "fail" && plan.reason).toContain(sibling);
    expect(plan.action === "fail" && plan.reason).toContain(worktreeSibling);
    expect(privacyPlan(inputs({ commonDir: undefined }))).toMatchObject({ action: "fail" });
  });
  it("names each place once when the worktree is the main checkout", () => {
    const plan = privacyPlan(inputs({}));
    expect(plan.action === "fail" && plan.reason.split(sibling).length - 1).toBe(1);
  });
  it("uses ORG_INDEX when it is set, and fails when it points nowhere", () => {
    const explicit = path.join(base, "elsewhere", "org-index");
    const script = path.join(explicit, "scripts", "check_private.py");
    expect(privacyPlan(inputs({ orgIndex: explicit }, [script, sibling]))).toEqual({ action: "run", script });
    expect(privacyPlan(inputs({ orgIndex: explicit }, [sibling]))).toMatchObject({ action: "fail" });
    // An empty ORG_INDEX is unset.
    expect(privacyPlan(inputs({ orgIndex: "" }, [sibling]))).toEqual({ action: "run", script: sibling });
  });
});
