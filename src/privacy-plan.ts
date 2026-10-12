import path from "node:path";

// #region privacy-plan — docs: AGENTS.md (Commands, the privacy check)
/**
 * Where the organization's private-data check runs (org-index scripts/check_private.py; knowledge/rules.md §9), decided
 * without touching the file system so it can be tested. The denylist lives only on the operator's machine:
 * - no denylist → a contributor's machine or CI: the step says so and passes (`skip`);
 * - `ORG_INDEX` set → that checkout's script, and a missing one fails: an explicit setting that points nowhere is a fault;
 * - otherwise the first script found beside this checkout or beside the main checkout of a linked worktree (its git common
 *   directory's parent) runs; with the denylist present and no script found the step fails, because a skip there would
 *   be a green gate that checked nothing (CT-40).
 */
export type PrivacyPlan = { action: "run"; script: string } | { action: "skip"; reason: string } | { action: "fail"; reason: string };

export type PrivacyInputs = {
  /** `process.env.ORG_INDEX`. */
  orgIndex: string | undefined;
  /** This checkout's root (a linked worktree's own root when run there). */
  root: string;
  /** `git rev-parse --path-format=absolute --git-common-dir`, or undefined when git cannot say. */
  commonDir: string | undefined;
  denylistPresent: boolean;
  exists: (file: string) => boolean;
};

const scriptIn = (orgIndex: string) => path.join(orgIndex, "scripts", "check_private.py");

export function privacyPlan(inputs: PrivacyInputs): PrivacyPlan {
  if (!inputs.denylistPresent) return { action: "skip", reason: "no local denylist (it runs on the operator's machine)" };
  if (inputs.orgIndex !== undefined && inputs.orgIndex !== "") {
    const script = scriptIn(inputs.orgIndex);
    return inputs.exists(script) ? { action: "run", script } : { action: "fail", reason: `ORG_INDEX is set, but ${script} does not exist` };
  }
  const candidates = [scriptIn(path.join(inputs.root, "..", "org-index"))];
  if (inputs.commonDir !== undefined) candidates.push(scriptIn(path.join(path.dirname(inputs.commonDir), "..", "org-index")));
  const script = candidates.find((candidate) => inputs.exists(candidate));
  if (script !== undefined) return { action: "run", script };
  return { action: "fail", reason: `the denylist is present but org-index's check_private.py is not at ${[...new Set(candidates)].join(" or ")}; set ORG_INDEX to the org-index checkout` };
}
// #endregion privacy-plan
