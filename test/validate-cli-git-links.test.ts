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
});
