import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { GENERATORS } from "../tools/vectors/run.js";

// `pnpm vectors:check` runs every generator only if `tools/vectors/run.ts` lists every one; each generator's own test
// runs its check, so this test builds nothing and only keeps the list complete.
describe("the vectors runner", () => {
  it("lists every generator in tools/vectors/ once", () => {
    const sources = readdirSync(path.join(projectRoot(), "tools/vectors")).filter((name) => name.endsWith(".ts") && name !== "run.ts").sort();
    expect(GENERATORS.map((generator) => generator.source).sort()).toEqual(sources);
  });
});
