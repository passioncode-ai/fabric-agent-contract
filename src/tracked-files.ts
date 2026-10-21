import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * The files the gate measures: this repository's files as `git ls-files` lists them — tracked ones, and untracked ones
 * that `.gitignore` does not exclude, so a new document is checked before its first commit — and never another
 * session's worktree under `.claude/worktrees/`, an ignored file or `.git/`. Without git the
 * directory tree is walked instead (skipping `.git`, `.claude` and `node_modules`), and one line on stderr says so.
 */
export function trackedFiles(root: string): string[] {
  try {
    const out = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return out
      .split("\0")
      .filter(Boolean)
      .filter((file) => !file.startsWith(".claude/worktrees/"))
      .map((file) => path.join(root, file))
      // A tracked file deleted but not yet staged is listed by git and absent on disk; it is not measured.
      .filter((file) => existsSync(file));
  } catch {
    process.stderr.write("tracked-files: git is unavailable; walking the directory tree instead\n");
    return walk(root);
  }
}

function walk(directory: string): string[] {
  const output: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if ([".git", ".claude", "node_modules"].includes(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...walk(target));
    else output.push(target);
  }
  return output;
}

