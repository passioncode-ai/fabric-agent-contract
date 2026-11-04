import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

// A fault inside a rule, planted: a source check ends in one usage error naming the error only; any other check
// throws as before (DEC-0149).
vi.mock("../src/semantic-rules.js", async (original) => {
  const actual = await original<typeof import("../src/semantic-rules.js")>();
  return {
    ...actual,
    evaluateSemanticRules: (kind: string, value: unknown) => {
      if (kind === "source-manifest") throw new RangeError("planted: quotes the input");
      if (kind === "source-package") throw "planted, not an Error";
      if (kind === "manifest") throw new TypeError("planted");
      return actual.evaluateSemanticRules(kind as never, value);
    }
  };
});

const { main } = await import("../src/validate-cli.js");

describe("a check that throws (DEC-0149)", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "fac-faults-"));
  const file = path.join(dir, "fabric.source.json");
  writeFileSync(file, JSON.stringify({ format: "fabric-source/1", include: ["LICENSE"] }));

  it("ends a source check in one usage error naming the file and the error's name only", () => {
    const result = main([file, "--json"]);
    expect(result.code).toBe(2);
    expect(JSON.parse(result.out)).toMatchObject({ usage: ["cannot check fabric.source.json: RangeError"] });
    expect(result.out).not.toContain("planted");
    expect(result.out).not.toContain(dir);
    expect(JSON.parse(main([file, "--kind", "source-package", "--json"]).out).usage).toEqual(["cannot check fabric.source.json: Error"]);
  });

  it("decides a source check by the schema it settled on, inferred from the content too", () => {
    const other = path.join(dir, "other.json");
    writeFileSync(other, JSON.stringify({ format: "fabric-source/1", include: ["LICENSE"] }));
    const result = main([other, "--json"]);
    expect(result.code).toBe(2);
    expect(JSON.parse(result.out).usage).toEqual(["cannot check other.json: RangeError"]);
    expect(result.out).not.toContain(dir);
  });

  it("names the file by its path in the folder when a folder run's source check throws", () => {
    const result = main([dir, "--json"]);
    expect(result.code).toBe(2);
    expect(JSON.parse(result.out).usage).toContain("cannot check fabric.source.json: RangeError");
  });

  it("lets any other check throw as before", () => {
    const manifest = path.join(dir, "fabric-agent.json");
    writeFileSync(manifest, JSON.stringify({ protocolVersion: "x" }));
    expect(() => main([manifest, "--kind", "manifest"])).toThrow(TypeError);
  });
});
