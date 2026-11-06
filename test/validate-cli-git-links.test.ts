import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

// Every existsSync the checker asks, recorded (DEC-0149): a link at a listed path that is no source path is caught by
// lstat before anything under it is stated.
const asked = vi.hoisted(() => [] as string[]);
vi.mock("node:fs", async (original) => {
  const actual = await original<typeof import("node:fs")>();
  return { ...actual, existsSync: ((file: string) => { asked.push(String(file)); return actual.existsSync(file); }) as typeof actual.existsSync };
});

const { main } = await import("../src/validate-cli.js");

describe.skipIf(process.platform === "win32")("a link at a listed path that may be nested (DEC-0149)", () => {
  it("is never followed: <path>/.git is not asked through it", () => {
    const outside = mkdtempSync(path.join(tmpdir(), "fac-git-links-outside-"));
    mkdirSync(path.join(outside, ".git"));
    const dir = mkdtempSync(path.join(tmpdir(), "fac-git-links-"));
    writeFileSync(path.join(dir, "fabric.source.json"), JSON.stringify({ format: "fabric-source/1", include: ["src/", "LICENSE", "vendor/lib/"] }));
    writeFileSync(path.join(dir, "LICENSE"), "x");
    mkdirSync(path.join(dir, "src"));
    writeFileSync(path.join(dir, "src/a.ts"), "x");
    mkdirSync(path.join(dir, "vendor"));
    symlinkSync(outside, path.join(dir, "vendor/lib"));
    expect(spawnSync("git", ["init", "-q"], { cwd: dir }).status).toBe(0);
    asked.length = 0;
    const result = main([dir, "--kind", "source-tree"]);
    expect(result.out).not.toContain("nested-repository");
    expect(result.out).not.toContain("note/walk");
    expect(asked.filter((file) => file.includes(`${path.sep}vendor${path.sep}lib${path.sep}`))).toEqual([]);
  });

  it("stops with not a file where a folder holding its own .git sits at the manifest's path, tracked or untracked", () => {
    for (const tracked of [false, true]) {
      const dir = mkdtempSync(path.join(tmpdir(), "fac-git-links-manifest-folder-"));
      writeFileSync(path.join(dir, "LICENSE"), "x");
      mkdirSync(path.join(dir, "fabric.source.json"));
      writeFileSync(path.join(dir, "fabric.source.json", "a.txt"), "x");
      expect(spawnSync("git", ["init", "-q"], { cwd: path.join(dir, "fabric.source.json") }).status).toBe(0);
      expect(spawnSync("git", ["add", "a.txt"], { cwd: path.join(dir, "fabric.source.json") }).status).toBe(0);
      expect(spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", "commit", "-qm", "a"], { cwd: path.join(dir, "fabric.source.json") }).status).toBe(0);
      expect(spawnSync("git", ["init", "-q"], { cwd: dir }).status).toBe(0);
      expect(spawnSync("git", ["add", "LICENSE"], { cwd: dir }).status).toBe(0);
      if (tracked) expect(spawnSync("git", ["add", "fabric.source.json"], { cwd: dir }).status).toBe(0);
      const result = main([dir, "--kind", "source-tree"]);
      expect(result.code, String(tracked)).toBe(2);
      expect(result.out, String(tracked)).toContain("cannot read fabric.source.json: not a file");
    }
  });

  it("lists a gitlink as its name and its folder, so a folder exclude entry over it is used with no work-tree folder", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "fac-git-links-vendor-"));
    writeFileSync(path.join(dir, "fabric.source.json"), JSON.stringify({ format: "fabric-source/1", include: ["src/", "LICENSE"], exclude: ["src/vendor/"] }));
    writeFileSync(path.join(dir, "LICENSE"), "x");
    mkdirSync(path.join(dir, "src"));
    writeFileSync(path.join(dir, "src/a.ts"), "x");
    expect(spawnSync("git", ["init", "-q"], { cwd: dir }).status).toBe(0);
    expect(spawnSync("git", ["add", "LICENSE", "src/a.ts"], { cwd: dir }).status).toBe(0);
    expect(spawnSync("git", ["update-index", "--add", "--cacheinfo", `160000,${"4".repeat(40)},src/vendor`], { cwd: dir }).status).toBe(0);
    const result = main([dir, "--kind", "source-tree"]);
    expect(result.out).not.toContain("unused-exclude");
    expect(result.out).not.toContain("nested-repository");
    expect(result.out).not.toContain("note/walk");
  });
});
