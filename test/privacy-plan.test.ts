import path from "node:path";
import { describe, expect, it } from "vitest";
import { privacyPlan, privacyRunFailure, type PrivacyInputs } from "../src/privacy-plan.js";

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
  home: path.join(path.sep, "nohome"),
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
  it("leaves out the main-checkout guess for a bare repository, a separate git dir or a submodule", () => {
    for (const commonDir of [path.join(base, "contract.git"), path.join(base, "super", ".git", "modules", "contract")]) {
      const plan = privacyPlan(inputs({ root: worktree, commonDir }, [path.join(base, "org-index", "scripts", "check_private.py"), path.join(path.dirname(commonDir), "..", "org-index", "scripts", "check_private.py")]));
      expect(plan, commonDir).toMatchObject({ action: "fail" });
    }
  });
  it("shows the home directory as ~ in a failure message", () => {
    const home = path.join(base, "home-of-someone");
    const plan = privacyPlan(inputs({ home, root: path.join(home, "contract"), commonDir: path.join(home, "contract", ".git") }));
    expect(plan.action === "fail" && plan.reason).toContain(path.join("~", "org-index", "scripts", "check_private.py"));
    expect(plan.action === "fail" && plan.reason).not.toContain(home);
    const explicit = privacyPlan(inputs({ home, orgIndex: path.join(home, "x") }));
    expect(explicit.action === "fail" && explicit.reason).not.toContain(home);
    // A sibling folder whose name only starts like the home directory is not inside it.
    const near = privacyPlan(inputs({ home, orgIndex: `${home}-other` }));
    expect(near.action === "fail" && near.reason).toContain(`${home}-other`);
    // An unknown home directory replaces nothing.
    const unknown = privacyPlan(inputs({ home: "", orgIndex: path.join(home, "x") }));
    expect(unknown.action === "fail" && unknown.reason).toContain(`but ${path.join(home, "x", "scripts", "check_private.py")}`);
  });
});

// CT-191: a failed run names its cause; a contributor without python3 is told so rather than shown an empty line.
describe("privacyRunFailure", () => {
  const home = path.join(path.sep, "home", "someone");
  const script = path.join(home, "org-index", "scripts", "check_private.py");
  it("names a missing interpreter, with the script under ~", () => {
    const message = privacyRunFailure(Object.assign(new Error("spawn python3 ENOENT"), { code: "ENOENT" }), script, home);
    expect(message).toContain("python3 is not on PATH");
    expect(message).toContain(path.join("~", "org-index", "scripts", "check_private.py"));
    expect(message).not.toContain(home);
  });
  it("prints the script's findings when it printed some", () => {
    expect(privacyRunFailure({ status: 1, stdout: "  finding: a name\n" }, script, home)).toBe("finding: a name");
  });
  it("names the exit status when the script printed nothing", () => {
    expect(privacyRunFailure({ status: 2, stdout: "  " }, script, home)).toContain("exited with status 2 and printed nothing on stdout");
    expect(privacyRunFailure({ status: 3 }, script, home)).toContain("exited with status 3");
  });
  it("names the signal that stopped the script", () => {
    expect(privacyRunFailure({ status: null, signal: "SIGKILL", stdout: "" }, script, home)).toContain("was stopped by SIGKILL");
  });
  it("says the script did not run when the error carries no status", () => {
    expect(privacyRunFailure(new Error("killed"), script, home)).toContain("did not run");
    expect(privacyRunFailure(undefined, script, home)).toContain("did not run");
    expect(privacyRunFailure("odd", script, home)).toContain("did not run");
  });
});
