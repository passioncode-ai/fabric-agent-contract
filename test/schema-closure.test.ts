import { existsSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { schemaClosure, sourceClosure } from "../src/schema-closure.js";

// What a consumer vendors: the $ref closure of a schema, never a list of name prefixes.
const dir = path.join(projectRoot(), "schemas");

describe("schemaClosure", () => {
  it("brings the device check-in's records along, which a device- prefix misses", () => {
    const closure = schemaClosure(dir, "device-check-in.schema.json");
    for (const needed of ["heartbeat.schema.json", "revocation-delta.schema.json", "window-lease.schema.json", "common.schema.json"]) expect(closure).toContain(needed);
    expect(closure.filter((file) => !file.startsWith("device-")).length).toBeGreaterThan(0);
  });
  it("resolves for every schema to files that exist, and terminates on cycles", () => {
    for (const file of readdirSync(dir).filter((name) => name.endsWith(".schema.json"))) {
      const closure = schemaClosure(dir, file);
      expect(closure).toContain(file);
      for (const reached of closure) expect(existsSync(path.join(dir, reached)), `${file} → ${reached}`).toBe(true);
    }
  });
});

describe("sourceClosure", () => {
  const src = path.join(projectRoot(), "src");
  it("brings device-rules' imports along, protocol-revisions among them", () => {
    const closure = sourceClosure(src, "device-rules.ts");
    expect(closure).toContain("protocol-revisions.ts");
    expect(closure).toContain("findings.ts");
  });
  it("follows re-exports and multi-line imports, not only one-line imports", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "closure-"));
    writeFileSync(path.join(dir, "a.ts"), 'export { x } from "./b.js";\nimport {\n  y,\n} from "./c.js";\nimport type { Z } from "./d.js";\n');
    for (const name of ["b.ts", "c.ts", "d.ts"]) writeFileSync(path.join(dir, name), "export const x = 1;\n");
    expect(sourceClosure(dir, "a.ts")).toEqual(["a.ts", "b.ts", "c.ts", "d.ts"]);
  });
  it("resolves for every module to files that exist", () => {
    for (const file of readdirSync(src).filter((name) => name.endsWith(".ts"))) {
      for (const reached of sourceClosure(src, file)) expect(existsSync(path.join(src, reached)), `${file} → ${reached}`).toBe(true);
    }
  });
});
