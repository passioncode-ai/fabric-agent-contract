import type { ErrorObject } from "ajv";
import { describe, expect, it } from "vitest";
import { INSTANCE_FREE, createValidatorSync, formatSchemaErrors, validateDocument } from "../src/validator.js";

// DEC-0149: an instance-free reading of schema errors carries nothing of the document, whatever Ajv's own message says.
const MARK = "instance-text-jdoe";
const error = (keyword: string, params: Record<string, unknown>, extra: Partial<ErrorObject> = {}): ErrorObject =>
  ({ keyword, instancePath: "/a", schemaPath: `#/${keyword}`, params, message: `quotes ${MARK}`, ...extra }) as ErrorObject;
const schemaSide: Record<string, Record<string, unknown>> = {
  type: { type: "string" }, pattern: { pattern: "^[a-z]+$" }, format: { format: "uri" }, minLength: { limit: 1 }, maxLength: { limit: 200 },
  minItems: { limit: 1 }, maxItems: { limit: 64 }, minProperties: { limit: 1 }, maxProperties: { limit: 3 }, minimum: { limit: 0 },
  maximum: { limit: 9 }, uniqueItems: { i: 1, j: 0 }, not: {}, propertyNames: { propertyName: MARK }, unevaluatedProperties: { unevaluatedProperty: MARK },
  oneOf: { passingSchema: null }, anyOf: {}, if: { failingKeyword: "then" }
};

describe("formatSchemaErrors with instanceFree (DEC-0149)", () => {
  it.each(Object.keys(INSTANCE_FREE))("builds the %s message from the schema's side only", (keyword) => {
    const [problem] = formatSchemaErrors([error(keyword, schemaSide[keyword] ?? {})], { instanceFree: true });
    expect(problem?.message).toBe(INSTANCE_FREE[keyword]?.(schemaSide[keyword] ?? {}));
    expect(JSON.stringify(problem)).not.toContain(MARK);
  });

  it("covers every keyword the table names", () => {
    expect(Object.keys(INSTANCE_FREE).sort()).toEqual(Object.keys(schemaSide).sort());
  });

  it("falls back to the keyword alone, and names no extra member or bad member name", () => {
    expect(formatSchemaErrors([error("multipleOf", { multipleOf: 2 })], { instanceFree: true })[0]?.message).toBe("is not valid (multipleOf)");
    const extra = formatSchemaErrors([error("additionalProperties", { additionalProperty: MARK })], { instanceFree: true });
    expect(extra).toEqual([{ instancePath: "/a", keyword: "additionalProperties", message: "has a member the schema does not define" }]);
    const badName = formatSchemaErrors([error("pattern", { pattern: "^[A-Z]+$" }, { propertyName: MARK })], { instanceFree: true });
    expect(badName).toEqual([{ instancePath: "/a", keyword: "pattern", message: 'a member name must match pattern "^[A-Z]+$"' }]);
    for (const [keyword, params] of [["enum", { allowedValues: ["a", "b"] }], ["const", { allowedValue: "x" }], ["required", { missingProperty: "format" }]] as const) {
      expect(JSON.stringify(formatSchemaErrors([error(keyword, params)], { instanceFree: true }))).not.toContain(MARK);
    }
    // Without the option Ajv's own message stays, as an ordinary check reads it.
    expect(formatSchemaErrors([error("type", { type: "string" })])[0]?.message).toBe(`quotes ${MARK}`);
  });

  it("quotes a value JSON cannot write as String writes it, and refuses a schema it does not hold", () => {
    expect(formatSchemaErrors([error("const", { allowedValue: undefined })])[0]?.message).toBe("must be undefined");
    const silent = error("type", { type: "string" });
    delete silent.message;
    expect(formatSchemaErrors([silent])[0]?.message).toBe("is not valid (type)");
    expect(() => validateDocument(createValidatorSync(), "no-such-schema", {})).toThrow("Unknown schema: no-such-schema");
  });
});
