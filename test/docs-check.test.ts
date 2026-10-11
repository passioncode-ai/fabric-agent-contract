import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkLinks, mermaidBodies } from "../src/docs-check.js";
import { projectRoot } from "../src/contract.js";
import { trackedFiles } from "../src/tracked-files.js";

describe("the gate's scope", () => {
  it("measures this repository's files, never another session's worktree under .claude/worktrees/", () => {
    const repo = mkdtempSync(path.join(tmpdir(), "tracked-"));
    try {
      execFileSync("git", ["init", "-q"], { cwd: repo });
      writeFileSync(path.join(repo, "a.md"), "# a\n");
      writeFileSync(path.join(repo, "draft.md"), "# draft\n");
      execFileSync("git", ["add", "a.md"], { cwd: repo });
      mkdirSync(path.join(repo, ".claude/worktrees/other/test"), { recursive: true });
      writeFileSync(path.join(repo, ".claude/worktrees/other/b.md"), "#  b\n");
      writeFileSync(path.join(repo, ".claude/worktrees/other/test/x.test.ts"), "throw 1\n");
      writeFileSync(path.join(repo, ".gitignore"), "coverage/\n");
      mkdirSync(path.join(repo, "coverage"));
      writeFileSync(path.join(repo, "coverage/report.md"), "#  ignored\n");
      const files = trackedFiles(repo).map((file) => path.relative(repo, file)).sort();
      // Tracked and untracked-but-not-ignored files only: no ignored file, no other session's worktree.
      expect(files).toEqual([".gitignore", "a.md", "draft.md"]);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });
});

describe("documentation helpers", () => {
  it("extracts Mermaid bodies", () => {
    expect(mermaidBodies("```mermaid\nflowchart LR\nA-->B\n```\n")).toEqual(["flowchart LR\nA-->B\n"]);
  });

  it("reports a broken relative link", async () => {
    const file = path.join(projectRoot(), "README.md");
    expect(await checkLinks(file, "[missing](docs/does-not-exist.md)")).toEqual(["README.md: broken link docs/does-not-exist.md"]);
  });
});
