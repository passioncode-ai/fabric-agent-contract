import { existsSync, readdirSync } from "node:fs";
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
  it("resolves for every module to files that exist", () => {
    for (const file of readdirSync(src).filter((name) => name.endsWith(".ts"))) {
      for (const reached of sourceClosure(src, file)) expect(existsSync(path.join(src, reached)), `${file} → ${reached}`).toBe(true);
    }
  });
});
