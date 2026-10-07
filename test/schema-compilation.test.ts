import { describe, expect, it } from "vitest";
import { CONTRACT_VERSION, SCHEMA_PREFIX, loadSchemas } from "../src/contract.js";
import { createValidator } from "../src/validator.js";

describe("schema catalogue", () => {
  it("loads 44 unique Draft 2020-12 schemas under the contract prefix", async () => {
    const schemas = await loadSchemas();
    expect(schemas).toHaveLength(44);
    expect(new Set(schemas.map((schema) => schema.$id)).size).toBe(44);
    expect(schemas.every((schema) => schema.$schema === "https://json-schema.org/draft/2020-12/schema")).toBe(true);
    expect(schemas.every((schema) => schema.$id.startsWith(SCHEMA_PREFIX))).toBe(true);
    expect(CONTRACT_VERSION).toBe("0.1.0");
  });

  it("compiles every schema in one Ajv 2020 instance", async () => {
    const validator = await createValidator();
    for (const schema of await loadSchemas()) expect(validator.getSchema(schema.$id)).toBeTypeOf("function");
  });
});
