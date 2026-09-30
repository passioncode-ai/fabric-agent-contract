import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { createValidator, validateDocument } from "../src/validator.js";

interface Entry { name: string; schema: string; path: string; valid: boolean; keyword?: string }
const fixturesRoot = path.join(projectRoot(), "fixtures");
const catalogue = JSON.parse(await readFile(path.join(fixturesRoot, "catalogue.json"), "utf8")) as Entry[];
const validator = await createValidator();

describe("conformance fixtures", () => {
  it.each(catalogue)("$name has expected validity", async (entry) => {
    const value = JSON.parse(await readFile(path.join(fixturesRoot, entry.path), "utf8")) as unknown;
    const result = validateDocument(validator, `${SCHEMA_PREFIX}schemas/${entry.schema}`, value);
    expect(result.valid, JSON.stringify(result.errors, null, 2)).toBe(entry.valid);
    if (!entry.valid && entry.keyword) expect(result.errors.some((error) => error.keyword === entry.keyword), JSON.stringify(result.errors, null, 2)).toBe(true);
  });
});
