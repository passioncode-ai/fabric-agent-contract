import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { projectRoot } from "./contract.js";

// The organization's private-data check (org-index scripts/check_private.py; knowledge/rules.md §9) before this public
// repository's tracked files are pushed. Its denylist lives only on the operator's machine, so where the script or the
// denylist is absent — a contributor's machine, CI — the step says so and passes; where both are present, any finding
// fails the gate. Set ORG_INDEX to the org-index checkout when it is not this repository's sibling.
const root = projectRoot();
const script = path.join(process.env.ORG_INDEX ?? path.join(root, "..", "org-index"), "scripts", "check_private.py");
const denylist = path.join(homedir(), ".config", "passioncode", "private-terms.txt");
if (!existsSync(script) || !existsSync(denylist)) {
  console.log(`privacy check skipped: ${existsSync(script) ? "no local denylist" : "org-index's check_private.py not found"} (it runs on the operator's machine)`);
} else {
  try {
    const out = execFileSync("python3", ["-I", script, root], { encoding: "utf8" });
    console.log(out.trim().split("\n").pop());
  } catch (error) {
    const out = (error as { stdout?: string }).stdout ?? "";
    console.error(out.trim());
    process.exitCode = 1;
  }
}
