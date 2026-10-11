import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";

/**
 * The files the gate measures: this repository's tracked files, as `git ls-files` lists them, so a session's
 * worktree under `.claude/worktrees/`, an untracked scratch file or `.git/` is never read. Without git the
 * directory tree is walked instead (skipping `.git`, `.claude` and `node_modules`), and one line on stderr says so.
 */
export function trackedFiles(root: string): string[] {
  try {
    const out = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return out
      .split("\0")
      .filter(Boolean)
      .filter((file) => !file.startsWith(".claude/worktrees/"))
      .map((file) => path.join(root, file));
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

// `tsx src/tracked-files.ts '*.md'` prints the tracked Markdown files, one per line, for markdownlint.
if (process.argv[1] && import.meta.url === new URL(`file://${path.resolve(process.argv[1])}`).href) {
  const suffix = (process.argv[2] ?? "").replace(/^\*/, "");
  for (const file of trackedFiles(process.cwd())) if (file.endsWith(suffix)) process.stdout.write(`${path.relative(process.cwd(), file)}\n`);
}
