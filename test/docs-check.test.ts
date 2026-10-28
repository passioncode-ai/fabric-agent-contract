import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { checkLinks, decisionPathFindings, headingSlug, markdownAnchors, mermaidBodies, outsideFences, scanFences } from "../src/docs-check.js";
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

  it("walks the directory tree when git is unavailable, skipping .git, .claude and node_modules, and says so once", () => {
    const repo = mkdtempSync(path.join(tmpdir(), "untracked-"));
    const savedPath = process.env.PATH;
    const warnings: string[] = [];
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation((chunk: string | Uint8Array) => {
      warnings.push(String(chunk));
      return true;
    });
    try {
      for (const dir of [".git", ".claude/worktrees/other", "node_modules/pkg", "docs/deep"]) mkdirSync(path.join(repo, dir), { recursive: true });
      for (const file of [".git/HEAD", ".claude/worktrees/other/b.md", "node_modules/pkg/c.md", "a.md", "docs/deep/d.md"]) writeFileSync(path.join(repo, file), "# x\n");
      // No git on PATH: execFileSync fails with ENOENT, as on a machine without git.
      process.env.PATH = "";
      const files = trackedFiles(repo).map((file) => path.relative(repo, file)).sort();
      expect(files).toEqual(["a.md", path.join("docs", "deep", "d.md")]);
      expect(warnings).toEqual(["tracked-files: git is unavailable; walking the directory tree instead\n"]);
    } finally {
      process.env.PATH = savedPath;
      stderr.mockRestore();
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

  // A handoff carries register text to paste into another file, its links relative to that file. Inside a fenced
  // block Markdown renders them as text, so they are not links of the handoff; outside one they still are.
  it("reads no link inside a fenced code block, and still reads one after it closes", async () => {
    const file = path.join(projectRoot(), "README.md");
    const text = "```markdown\n[elsewhere](specification/does-not-exist.md)\n```\n~~~\n[tilde](nope.md)\n~~~\n[after](docs/does-not-exist.md)\n";
    expect(await checkLinks(file, text)).toEqual(["README.md: broken link docs/does-not-exist.md"]);
  });

  it("closes a fence only with a bare line of its own character, at least as long", () => {
    expect(outsideFences("a\n````\n```\n~~~~\n```` x\nin\n````\nb")).toBe("a\nb");
  });

  // An unclosed fence is a finding, not a silent skip to the end of the file: a typo in one cannot hide a link.
  it("reports a fence never closed, and still reads the links after it", async () => {
    expect(scanFences("a\n```\nnever closed\n[x](y.md)")).toEqual({ outside: "a\nnever closed\n[x](y.md)", unclosed: 2 });
    expect(scanFences("a\n````\n```\nb\n```\nc")).toEqual({ outside: "a\nc", unclosed: 2 });
    expect(scanFences("a\n```\nb\n```").unclosed).toBeUndefined();
    const file = path.join(projectRoot(), "README.md");
    expect(await checkLinks(file, "a\n```\n[after](docs/does-not-exist.md)\n")).toEqual([
      "README.md:2: code fence never closed",
      "README.md: broken link docs/does-not-exist.md"
    ]);
  });

  // CommonMark 0.31.2 §4.5: the info string of a backtick fence may not hold a backtick, so the line is inline code.
  it("opens no fence on a backtick line whose info string holds a backtick", async () => {
    expect(scanFences("```code``` text\n[x](y.md)\n")).toEqual({ outside: "```code``` text\n[x](y.md)\n" });
    expect(outsideFences("~~~ a`b\nin\n~~~\nout")).toBe("out");
    const file = path.join(projectRoot(), "README.md");
    expect(await checkLinks(file, "```code``` text [gone](docs/does-not-exist.md)")).toEqual(["README.md: broken link docs/does-not-exist.md"]);
  });

  it("reports a link whose percent escape is malformed instead of throwing", async () => {
    const file = path.join(projectRoot(), "README.md");
    expect(await checkLinks(file, "[bad](docs/100%.md) [ok](README.md)")).toEqual(["README.md: malformed link docs/100%.md"]);
  });

  // CT-167: a renamed heading broke its inbound links silently, because the fragment was dropped.
  describe("a link's fragment (CT-167)", () => {
    it("slugs a heading as GitHub renders it", () => {
      expect(headingSlug("The verifier")).toBe("the-verifier");
      expect(headingSlug("Delegation (`fabric-delegation/0.1`)")).toBe("delegation-fabric-delegation01");
      expect(headingSlug("A [link](x.md) and **bold** text")).toBe("a-link-and-bold-text");
      expect(headingSlug("Keys: publication, rotation")).toBe("keys-publication-rotation");
      expect(headingSlug("snake_case _emphasis_")).toBe("snake_case-emphasis");
      expect(headingSlug("Контракт и Fabric")).toBe("контракт-и-fabric");
      expect(headingSlug("DL-26 \u2014 the rule")).toBe("dl-26--the-rule");
      // A code span keeps its `<…>` text; an entity renders as its character before the slug drops it.
      expect(headingSlug("The `<id>.<instance>.json` file")).toBe("the-idinstancejson-file");
      expect(headingSlug("Keys &amp; <em>locks</em>")).toBe("keys--locks");
    });

    it("answers each heading outside fences, numbers repeats, and reads explicit anchors", () => {
      const anchors = markdownAnchors('# Top\n## Notes\n## Notes #\n```\n## Fenced\n```\n<a id="Custom-Id"></a>\n<span name="n1">x</span>\n#Not a heading\n');
      expect([...anchors].sort()).toEqual(["custom-id", "n1", "notes", "notes-1", "top"]);
    });

    it("reports a fragment no heading or anchor of the target answers, and passes one that does", async () => {
      const file = path.join(projectRoot(), "README.md");
      expect(await checkLinks(file, "[a](docs/specification/delegation.md#the-verifier) [b](docs/specification/delegation.md#The-Verifier)")).toEqual([]);
      expect(await checkLinks(file, "[a](docs/specification/delegation.md#no-such-heading)")).toEqual([
        "README.md: broken anchor docs/specification/delegation.md#no-such-heading"
      ]);
    });

    it("checks a fragment of the file itself", async () => {
      const file = path.join(projectRoot(), "docs/specification/delegation.md");
      expect(await checkLinks(file, "[ok](#the-verifier) [gone](#nowhere)")).toEqual(["docs/specification/delegation.md: broken anchor #nowhere"]);
    });

    it("leaves line fragments, fragments on other files, titles and external links alone", async () => {
      const file = path.join(projectRoot(), "README.md");
      const text = '[l](docs/specification/delegation.md#L12-L20) [s](src/docs-check.ts#anything) [t](README.md "a title") [w](https://example.com/x#y) [d](docs/#x)';
      expect(await checkLinks(file, text)).toEqual([]);
    });

    it("reads an angle destination whole, and no link quoted in inline code", async () => {
      const file = path.join(projectRoot(), "README.md");
      expect(await checkLinks(file, "[a](<docs/no such file.md>)")).toEqual(["README.md: broken link <docs/no such file.md>"]);
      expect(await checkLinks(file, "[a](<docs/specification/delegation.md#the-verifier>)")).toEqual([]);
      expect(await checkLinks(file, "see `[x](#nope)` and ``[y](gone.md)``")).toEqual([]);
    });

    it("reads setext headings and skips front matter, and decodes every numeric and the common named references (CT-193)", () => {
      const anchors = markdownAnchors("---\ntitle: x\n---\nFirst title\n===\n\nSecond part\n---\n\n---\n- item\n---\n| a |\n---\n");
      // `| a |` over `---` is a paragraph, so a level-2 heading on GitHub; a table with its delimiter row is not.
      expect([...anchors].sort()).toEqual(["-a-", "first-title", "second-part"]);
      expect([...markdownAnchors("| a |\n|---|\n| 1 |\n---\n")]).toEqual([]);
      expect([...markdownAnchors("| a | b |\n===\n")]).toEqual(["-a--b-"]);
      expect([...markdownAnchors("Line one\nLine two\n===\n")]).toEqual(["line-oneline-two"]);
      // A leading `---` over no `key:` line is a thematic break: the headings after it count, a later `---` included.
      expect([...markdownAnchors("---\n\n# Intro\n\nText.\n\n## Usage\n\n---\n\n## End\n")]).toEqual(["intro", "usage", "end"]);
      // A `...` closer ends front matter; an opener with no closer hides nothing.
      expect([...markdownAnchors("---\ntitle: x\n...\n# A\n")]).toEqual(["a"]);
      expect([...markdownAnchors("---\ntitle: x\n# A\n")]).toEqual(["a"]);
      expect(headingSlug("Use &constructor; and &toString; here")).toBe("use-constructor-and-tostring-here");
      expect(headingSlug("A &#38; B &#x26; C")).toBe("a--b--c");
      // A known limit, not GitHub's answer (#cafés-here): named references outside the table stay as written (CT-198).
      expect(headingSlug("Caf&eacute;s &nbsp;here")).toBe("cafeacutes-here");
      expect(headingSlug("Wait&hellip; done")).toBe("wait-done");
      expect(headingSlug("Odd &#0; and &#xD800;")).toBe("odd--and-");
    });

    it("reads links after a backtick that never closes, and keeps a code span inside its paragraph (CT-193)", async () => {
      const file = path.join(projectRoot(), "README.md");
      expect(await checkLinks(file, "an ` unclosed tick, then [x](gone.md)")).toEqual(["README.md: broken link gone.md"]);
      expect(await checkLinks(file, "a ` tick\n\n[x](gone.md) and ` another")).toEqual(["README.md: broken link gone.md"]);
      expect(await checkLinks(file, "``a ` b`` and [x](gone.md)")).toEqual(["README.md: broken link gone.md"]);
    });

    it("reports a malformed escape in a fragment", async () => {
      const file = path.join(projectRoot(), "README.md");
      expect(await checkLinks(file, "[x](README.md#100%)")).toEqual(["README.md: malformed link README.md#100%"]);
    });
  });
});
