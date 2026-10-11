import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkLinks, decisionPathFindings, mermaidBodies } from "../src/docs-check.js";
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

describe("a decision's named paths (DOCMAP: Consequences / affects is checked)", () => {
  const files = ["docs/specification/service.md", "schemas/comms-common.schema.json", "fixtures/semantic/a-ok.json", "src/x.ts"];
  const section = (affects: string, extra = "") => `### DEC-0099 — t\n\n- **Status:** Accepted\n${extra}- **Consequences / affects:** ${affects}\n- **Source:** Fabric \`docs/elsewhere.md\`\n`;

  it("reports a path no tracked file has, with its line", () => {
    expect(decisionPathFindings(section("`docs/specification/memory.md`, `src/x.ts`"), files)).toEqual(["docs/DECISIONS.md:4: DEC-0099: missing path docs/specification/memory.md"]);
  });

  it("accepts a file, a glob, a folder, a schema's short name, an anchor and a line number", () => {
    expect(decisionPathFindings(section("`docs/specification/service.md#lifecycle`, `fixtures/semantic/*-ok.json`, `fixtures/`, `schemas/comms-common`, `src/x.ts:12`, `docs/<name>.md`"), files)).toEqual([]);
  });

  it("reads only Consequences / affects: another repository's paths live in Source", () => {
    expect(decisionPathFindings(section("`src/x.ts`"), files)).toEqual([]);
  });

  it("follows an erratum line, the append-only register's correction", () => {
    const erratum = "- **Erratum (2026-10-11):** the affected path `docs/specification/memory.md` is `docs/specification/service.md`; old.\n";
    expect(decisionPathFindings(section("`docs/specification/memory.md`", erratum), files)).toEqual([]);
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
