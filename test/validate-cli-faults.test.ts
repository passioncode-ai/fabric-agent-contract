import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { projectRoot } from "../src/contract.js";

// A fault inside a rule, planted: a source check ends in one usage error naming the error only; any other check
// throws as before (DEC-0149).
// The manifest's own rule throws unless a test turns that off to reach the pair.
const plant = vi.hoisted(() => ({ manifest: true }));
vi.mock("../src/semantic-rules.js", async (original) => {
  const actual = await original<typeof import("../src/semantic-rules.js")>();
  return {
    ...actual,
    evaluateSemanticRules: (kind: string, value: unknown) => {
      if (kind === "source-manifest" && plant.manifest) throw new RangeError("planted: quotes the input");
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

  it("ends a folder's pair check that throws in one usage error, adding nothing, in one JSON document", () => {
    const pair = mkdtempSync(path.join(tmpdir(), "fac-faults-pair-"));
    writeFileSync(path.join(pair, "fabric.source.json"), JSON.stringify({ format: "fabric-source/1", include: ["LICENSE"] }));
    writeFileSync(path.join(pair, "fabric.package.json"), readFileSync(path.join(projectRoot(), "fixtures/positive/fabric-package-agent.json"), "utf8"));
    plant.manifest = false;
    try {
      const result = main([pair, "--json"]);
      expect(result.code).toBe(2);
      const report = JSON.parse(result.out) as { usage: string[]; problems: Array<{ rule: string }> };
      expect(report.usage).toEqual(["cannot check fabric.source.json: Error"]);
      expect(report.problems.filter((problem) => problem.rule === "FAC-SEM-160")).toEqual([]);
    } finally {
      plant.manifest = true;
    }
  });

  it("lets any other check throw as before", () => {
    const manifest = path.join(dir, "fabric-agent.json");
    writeFileSync(manifest, JSON.stringify({ protocolVersion: "x" }));
    expect(() => main([manifest, "--kind", "manifest"])).toThrow(TypeError);
  });
});
