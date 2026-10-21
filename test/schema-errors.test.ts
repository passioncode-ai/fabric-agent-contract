import { readFileSync } from "node:fs";
import path from "node:path";
import type { ErrorObject } from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidatorSync, formatSchemaErrors, validateDocument } from "../src/validator.js";

// REQ-04 (contract review 2026-10-21): a schema error reads as the mistake it is. Wrappers collapse onto the leaf
// error inside them, allowed values are named, the unknown member is named, and an unknown member where the
// document has an `extensions` member says where vendor data goes.
const root = projectRoot();
const load = (file: string) => JSON.parse(readFileSync(path.join(root, "fixtures", file), "utf8")) as Record<string, any>;
const verbose = createValidatorSync({ verbose: true });
const plain = createValidatorSync();
const errors = (schema: string, value: unknown, validator = verbose) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}`, value).errors;

const error = (fields: Partial<ErrorObject>): ErrorObject => ({ instancePath: "", schemaPath: "#", keyword: "type", params: {}, message: "must be object", ...fields }) as ErrorObject;

describe("formatSchemaErrors (REQ-04)", () => {
  it("drops an anyOf, oneOf or if wrapper when a leaf error sits at or under its path", () => {
    const formatted = formatSchemaErrors([
      error({ instancePath: "/a", keyword: "oneOf", params: { passingSchemas: null }, message: "must match exactly one schema in oneOf" }),
      error({ instancePath: "/a/b", keyword: "type", message: "must be string" }),
      error({ instancePath: "/c", keyword: "anyOf", message: "must match a schema in anyOf" }),
      error({ instancePath: "/c", keyword: "const", params: { allowedValue: "x" }, message: "must be equal to constant" }),
      error({ instancePath: "/d", keyword: "if", params: { failingKeyword: "then" }, message: 'must match "then" schema' }),
      error({ instancePath: "/d/e", keyword: "required", params: { missingProperty: "f" }, message: "must have required property 'f'" })
    ]);
    expect(formatted.map((line) => `${line.instancePath} ${line.keyword}`)).toEqual(["/a/b type", "/c const", "/d/e required"]);
  });

  it("keeps a wrapper with no leaf under it, and a oneOf that matched more than one branch", () => {
    const formatted = formatSchemaErrors([
      error({ instancePath: "/a", keyword: "anyOf", message: "must match a schema in anyOf" }),
      error({ instancePath: "/b", keyword: "oneOf", params: { passingSchemas: [0, 1] }, message: "must match exactly one schema in oneOf" }),
      error({ instancePath: "/b/c", keyword: "type", message: "must be string" }),
      error({ instancePath: "/ab", keyword: "type", message: "must be string" })
    ]);
    expect(formatted.map((line) => `${line.instancePath} ${line.keyword}`)).toEqual(["/a anyOf", "/b oneOf", "/b/c type", "/ab type"]);
    expect(formatted[1]?.message).toContain("branches 0 and 1");
  });

  it("names allowed values, the missing member and the extra member", () => {
    const formatted = formatSchemaErrors([
      error({ keyword: "enum", params: { allowedValues: ["tls", "oauth2"] }, message: "must be equal to one of the allowed values" }),
      error({ keyword: "const", params: { allowedValue: "0.1.0" }, message: "must be equal to constant" }),
      error({ keyword: "required", params: { missingProperty: "name" }, message: "must have required property 'name'" }),
      error({ keyword: "additionalProperties", params: { additionalProperty: "colour" }, message: "must NOT have additional properties" }),
      error({ keyword: "pattern", params: { pattern: "^a" }, message: 'must match pattern "^a"' }),
      { instancePath: "", schemaPath: "#", keyword: "type", params: {} }
    ]);
    expect(formatted.map((line) => line.message)).toEqual([
      'must be one of "tls", "oauth2"',
      'must be "0.1.0"',
      'is missing the required member "name"',
      'has the member "colour", which the schema does not define',
      'must match pattern "^a"',
      "is not valid (type)"
    ]);
  });

  it("says vendor data goes under extensions where the object's schema has an extensions member", () => {
    const manifest = load("positive/manifest-mcp.json");
    manifest.provider.colour = "blue";
    manifest.capabilities[0].vendorNote = "x";
    const lines = formatSchemaErrors(errors("manifest.schema.json", manifest));
    expect(lines.map((line) => `${line.instancePath} ${line.message}`)).toEqual([
      '/provider has the member "colour", which the schema does not define; vendor data goes under "extensions", keyed by an absolute URI',
      '/capabilities/0 has the member "vendorNote", which the schema does not define; vendor data goes under "extensions", keyed by an absolute URI'
    ]);
  });

  it("does not offer extensions where the object's schema has none, nor without the parent schema", () => {
    const manifest = load("positive/manifest-mcp.json");
    manifest.provider.identity.colour = "blue";
    expect(formatSchemaErrors(errors("manifest.schema.json", manifest)).map((line) => line.message)).toEqual(['has the member "colour", which the schema does not define']);
    const top = load("positive/manifest-mcp.json");
    top.provider.colour = "blue";
    expect(formatSchemaErrors(errors("manifest.schema.json", top, plain)).map((line) => line.message)).toEqual(['has the member "colour", which the schema does not define']);
  });

  it("names the allowed values of a real enum error", () => {
    const manifest = load("positive/manifest-mcp.json");
    manifest.provider.identity.method = "password";
    expect(formatSchemaErrors(errors("manifest.schema.json", manifest)).map((line) => `${line.instancePath} ${line.message}`)).toEqual([
      '/provider/identity/method must be one of "tls", "oauth2", "signed-manifest", "local-install"'
    ]);
  });
});

describe("secret rules say how to fix (REQ-04)", () => {
  it("FAC-SEM-057 points a launch argument to an env entry with a secret reference, or a file", () => {
    const findings = evaluateSemanticRules("provider-entry", {
      run: { mcp: { stdio: { command: ["/usr/local/bin/agent", "--token", "ghp_abcdefghijklmnopqrstuvwxyz0123456789"] } } }
    });
    expect(findings).toEqual([expect.objectContaining({ code: "FAC-SEM-057", instancePath: "/run/mcp/stdio/command/2" })]);
    expect(findings[0]?.message).toMatch(/move the value to an env entry with a secret reference \(secret-ref:NAME\), or to a file the program reads/);
  });

  it("FAC-SEM-057 points a URL credential to a header from a secret reference", () => {
    const findings = evaluateSemanticRules("provider-entry", { run: { mcp: { url: "http://127.0.0.1:8080/mcp?api_key=ghp_abcdefghijklmnopqrstuvwxyz0123456789" } } });
    expect(findings.map((finding) => finding.code)).toEqual(["FAC-SEM-057"]);
    expect(findings[0]?.message).toMatch(/header from a secret reference/);
  });

  it("FAC-SEM-015 says to write the value as a secret reference", () => {
    const findings = evaluateSemanticRules("provider-entry", { run: { mcp: { stdio: { command: ["/bin/a"], env: { API_KEY: "plain-value" } } } } });
    expect(findings).toEqual([expect.objectContaining({ code: "FAC-SEM-015", instancePath: "/run/mcp/stdio/env/API_KEY" })]);
    expect(findings[0]?.message).toMatch(/write it as a secret reference, secret-ref:NAME/);
  });
});
