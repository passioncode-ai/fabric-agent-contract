import { describe, expect, it } from "vitest";
import { CONTRACT_VERSION, SCHEMA_PREFIX, loadSchemas } from "../src/contract.js";
import { createValidator } from "../src/validator.js";

describe("schema catalogue", () => {
  it("loads 137 unique Draft 2020-12 schemas under the contract prefix", async () => {
    const schemas = await loadSchemas();
    expect(schemas).toHaveLength(137);
    expect(new Set(schemas.map((schema) => schema.$id)).size).toBe(137);
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

  // DEC-0097: ECMAScript's `.` stops at U+2028 and U+2029 (Python's `re` does not), so a guard written `(?!.*\.\.)`
  // let `a\u2028/../x` through `fabric-package/1`'s path. Any character is `[\s\S]`; a `.` outside a class is refused.
  const bareDots = (pattern: string): number => {
    let count = 0;
    let inClass = false;
    for (let index = 0; index < pattern.length; index += 1) {
      const char = pattern[index];
      if (char === "\\") index += 1;
      else if (inClass) inClass = char !== "]";
      else if (char === "[") inClass = true;
      else if (char === ".") count += 1;
    }
    return count;
  };

  it("never use a bare . (it stops at U+2028 and U+2029)", async () => {
    const found: string[] = [];
    for (const schema of await loadSchemas()) {
      for (const [where, pattern] of patterns(schema, "", [])) if (bareDots(pattern) > 0) found.push(`${schema.$id}#${where}`);
    }
    expect(found).toEqual([]);
  });

  it("counts a bare . and leaves an escaped or classed one", () => {
    expect(bareDots("^(?!.*//)a.b$")).toBe(2);
    expect(bareDots("^a\\.b[.]c[\\]]d$")).toBe(0);
    expect(bareDots("^[^\\]]x.$")).toBe(1);
  });

  it("refuses every line-separator plant in a package path and a device detail", async () => {
    const validator = await createValidator();
    const base = `${SCHEMA_PREFIX}schemas/`;
    const path = validator.getSchema(`${base}fabric-package.schema.json#/$defs/path`);
    const detail = validator.getSchema(`${base}device-common.schema.json#/$defs/detail`);
    for (const separator of ["\u2028", "\u2029"]) {
      for (const tail of ["/../../etc/passwd", "\\..\\etc", "//etc/passwd", "/./x"]) expect(path?.(`skills${separator}${tail}`)).toBe(false);
      for (const tail of ["C:\\Users\\bob", "%2Fhome", "x-Users-bob", "/Users/bob", "~/notes"]) expect(detail?.(`cannot read${separator}${tail}`)).toBe(false);
    }
    expect(path?.("skills/plain-words/SKILL.md")).toBe(true);
    expect(detail?.("cannot read the journal")).toBe(true);
  });

  it("gives every common definition a description", async () => {
    const common = (await loadSchemas()).find((schema) => schema.$id.endsWith("/schemas/common.schema.json"))!;
    const missing = Object.entries(common.$defs as Record<string, Record<string, unknown>>).filter(([, def]) => typeof def.description !== "string").map(([name]) => name);
    expect(missing).toEqual([]);
  });
});
