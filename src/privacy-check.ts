import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { projectRoot } from "./contract.js";
import { privacyPlan, privacyRunFailure } from "./privacy-plan.js";

// The organization's private-data check before this public repository's tracked files are pushed. Where it runs, and
// when a missing script is a failure rather than a skip, is `privacyPlan` (src/privacy-plan.ts); any finding fails the gate.
const root = projectRoot();
let commonDir: string | undefined;
try {
  commonDir = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || undefined;
} catch {
  commonDir = undefined;
}
const plan = privacyPlan({
  orgIndex: process.env.ORG_INDEX,
  root,
  commonDir,
  denylistPresent: existsSync(path.join(homedir(), ".config", "passioncode", "private-terms.txt")),
  exists: existsSync,
  home: homedir(),
});
if (plan.action === "skip") console.log(`privacy check skipped: ${plan.reason}`);
else if (plan.action === "fail") {
  console.error(`privacy check failed: ${plan.reason}`);
  process.exitCode = 1;
} else {
  try {
    const out = execFileSync("python3", ["-I", plan.script, root], { encoding: "utf8" });
    console.log(out.trim().split("\n").pop());
  } catch (error) {
    console.error(privacyRunFailure(error, plan.script, homedir()));
    process.exitCode = 1;
  }
}
