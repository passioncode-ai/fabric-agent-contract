import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

// A folder holding a name that is not UTF-8, planted: APFS refuses such names, so the walk's read of a folder named
// `odd` answers one more entry whose name is the bytes `0xff .txt` (DEC-0149).
vi.mock("node:fs", async (original) => {
  const actual = await original<typeof import("node:fs")>();
  return {
    ...actual,
    readdirSync: ((dir: string, options?: { withFileTypes?: boolean; encoding?: string }) => {
      const entries = actual.readdirSync(dir, options as never) as unknown[];
      if (options?.withFileTypes === true && options.encoding === "buffer" && path.basename(dir) === "odd") {
        const odd = Buffer.from([0xff, 0x2e, 0x74, 0x78, 0x74]);
        return [...entries, { name: odd, isDirectory: () => false, isFile: () => true }];
      }
      return entries;
    }) as typeof actual.readdirSync
  };
});

const { main } = await import("../src/validate-cli.js");

describe("a walked name that is not UTF-8 (DEC-0149)", () => {
  const make = (include: string[]) => {
    const dir = mkdtempSync(path.join(tmpdir(), "fac-walk-names-"));
    writeFileSync(path.join(dir, "fabric.source.json"), JSON.stringify({ format: "fabric-source/1", include }));
    writeFileSync(path.join(dir, "LICENSE"), "x");
    mkdirSync(path.join(dir, "src/odd"), { recursive: true });
    writeFileSync(path.join(dir, "src/odd/a.ts"), "x");
    return dir;
  };

  it("is a usage error naming its folder, and no part of the name, when the folder lies in the source", () => {
    const result = main([make(["src/", "LICENSE"]), "--kind", "source-tree", "--json"]);
    expect(result.code).toBe(2);
    const report = JSON.parse(result.out) as { usage: string[] };
    expect(report.usage).toEqual(["cannot read a name in src/odd/: it is not UTF-8"]);
    expect(result.out).not.toContain("�");
  });

  it("is skipped when its folder lies outside the source", () => {
    const result = main([make(["src/odd/a.ts", "LICENSE"]), "--kind", "source-tree", "--json"]);
    expect(result.code).toBe(0);
    expect((JSON.parse(result.out) as { usage: string[] }).usage).toEqual([]);
  });
});
