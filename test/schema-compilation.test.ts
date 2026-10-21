import { describe, expect, it } from "vitest";
import { CONTRACT_VERSION, SCHEMA_PREFIX, loadSchemas } from "../src/contract.js";
import { createValidator } from "../src/validator.js";

describe("schema catalogue", () => {
  it("loads 109 unique Draft 2020-12 schemas under the contract prefix", async () => {
    const schemas = await loadSchemas();
    expect(schemas).toHaveLength(109);
    expect(new Set(schemas.map((schema) => schema.$id)).size).toBe(109);
    expect(schemas.every((schema) => schema.$schema === "https://json-schema.org/draft/2020-12/schema")).toBe(true);
    expect(schemas.every((schema) => schema.$id.startsWith(SCHEMA_PREFIX))).toBe(true);
    expect(CONTRACT_VERSION).toBe("0.1.0");
  });

  it("compiles every schema in one Ajv 2020 instance", async () => {
    const validator = await createValidator();
    for (const schema of await loadSchemas()) expect(validator.getSchema(schema.$id)).toBeTypeOf("function");
    // Compiling all 66 schemas takes ~4 s alone and over 6 s beside the rest of the suite on a loaded
    // machine (2026-10-11, load average ~560): the bound is the compiler's, not a hang.
  }, 30_000);
});

// REQ-13 (contract review 2026-10-21): digits are written `[0-9]`, never `\d`. Under the `u` flag Ajv sets, `\d` is
// ASCII too, but a reader porting a pattern to another engine (.NET, Python's `re` on str) gets every Unicode digit.
describe("schema patterns", () => {
  const patterns = (node: unknown, at: string, out: Array<[string, string]>): Array<[string, string]> => {
    if (Array.isArray(node)) node.forEach((item, index) => patterns(item, `${at}/${index}`, out));
    else if (node !== null && typeof node === "object") {
      for (const [key, value] of Object.entries(node)) {
        if (key === "pattern" && typeof value === "string") out.push([`${at}/pattern`, value]);
        if (key === "patternProperties" && value !== null && typeof value === "object") for (const name of Object.keys(value)) out.push([`${at}/patternProperties`, name]);
        patterns(value, `${at}/${key}`, out);
      }
    }
    return out;
  };

  it("never use \\d", async () => {
    const found: string[] = [];
    let total = 0;
    for (const schema of await loadSchemas()) {
      for (const [where, pattern] of patterns(schema, "", [])) {
        total += 1;
        if (pattern.includes("\\d")) found.push(`${schema.$id}#${where}`);
      }
    }
    expect(total).toBeGreaterThan(200);
    expect(found).toEqual([]);
  });

  it("finds a planted \\d", () => {
    expect(patterns({ properties: { day: { type: "string", pattern: "^\\d{4}$" } } }, "", [])).toEqual([["/properties/day/pattern", "^\\d{4}$"]]);
  });

  it("gives every common definition a description", async () => {
    const common = (await loadSchemas()).find((schema) => schema.$id.endsWith("/schemas/common.schema.json"))!;
    const missing = Object.entries(common.$defs as Record<string, Record<string, unknown>>).filter(([, def]) => typeof def.description !== "string").map(([name]) => name);
    expect(missing).toEqual([]);
  });
});
