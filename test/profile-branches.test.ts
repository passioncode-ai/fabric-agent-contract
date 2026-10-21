import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { createValidatorSync, formatSchemaErrors, validateDocument } from "../src/validator.js";

// REQ-03 (contract review 2026-10-21): a mistake in one capability profile, or in a provider's run.mcp, reports
// that branch's errors only. Before, an undiscriminated oneOf tried every branch and a wrong protocolRevision printed
// 22 errors (the review's count: about 20 lines); the branch is now selected on `kind` (profile) or on the presence
// of `stdio` (run.mcp).
const root = projectRoot();
const load = (file: string) => JSON.parse(readFileSync(path.join(root, "fixtures/positive", file), "utf8")) as Record<string, any>;
const validator = createValidatorSync({ verbose: true });
const check = (schema: string, value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}`, value);
const lines = (schema: string, value: unknown) => formatSchemaErrors(check(schema, value).errors).map((line) => `${line.instancePath} ${line.message}`);

describe("a capability profile is checked on its own kind's branch (REQ-03)", () => {
  it("a wrong mcp protocolRevision is one const error and one if wrapper, nothing from a2a or local-runner", () => {
    const manifest = load("manifest-mcp.json");
    manifest.capabilities[0].profile.protocolRevision = "2025-06-18";
    const { errors } = check("manifest.schema.json", manifest);
    expect(errors.length).toBeLessThanOrEqual(2);
    expect(errors.map((error) => error.schemaPath).join(" ")).not.toMatch(/a2a|local-runner|localRunner/);
    expect(lines("manifest.schema.json", manifest)).toEqual(['/capabilities/0/profile/protocolRevision must be "2026-07-28"']);
  });

  it("a wrong a2a protocolVersion and a wrong local-runner profileVersion name only their own member", () => {
    const a2a = load("manifest-a2a.json");
    a2a.capabilities[0].profile.protocolVersion = "0.3";
    expect(lines("manifest.schema.json", a2a)).toEqual(['/capabilities/0/profile/protocolVersion must be "1.0"']);
    const local = load("manifest-local.json");
    local.capabilities[0].profile.profileVersion = "fabric-local-runner/0.2";
    expect(lines("manifest.schema.json", local)).toEqual(['/capabilities/0/profile/profileVersion must be "fabric-local-runner/0.1"']);
  });

  it("an mcp profile carrying a2a's version member names that member", () => {
    const manifest = load("manifest-mcp.json");
    manifest.capabilities[0].profile.protocolVersion = "1.0";
    expect(lines("manifest.schema.json", manifest)).toEqual(['/capabilities/0/profile has the member "protocolVersion", which the schema does not define']);
  });

  it("an unknown kind, a missing kind and a profile that is not an object are one error each", () => {
    const unknown = load("manifest-mcp.json");
    unknown.capabilities[0].profile.kind = "grpc";
    expect(lines("manifest.schema.json", unknown)).toEqual(['/capabilities/0/profile/kind must be one of "mcp", "a2a", "local-runner"']);
    const missing = load("manifest-mcp.json");
    delete missing.capabilities[0].profile.kind;
    expect(lines("manifest.schema.json", missing)).toEqual(['/capabilities/0/profile is missing the required member "kind"']);
    const scalar = load("manifest-mcp.json");
    scalar.capabilities[0].profile = "mcp";
    expect(lines("manifest.schema.json", scalar)).toEqual(["/capabilities/0/profile must be object"]);
  });
});

describe("a provider's run.mcp is checked on the branch its members name (REQ-03)", () => {
  const entry = () => load("provider-entry-stdio.json");

  it("a stdio mistake reports stdio only", () => {
    const value = entry();
    value.run.mcp.stdio.command = "node server.js";
    expect(check("provider.schema.json", value).errors.length).toBeLessThanOrEqual(2);
    expect(lines("provider.schema.json", value)).toEqual(["/run/mcp/stdio/command must be array"]);
  });

  it("a url mistake reports url only, and both forms or neither are refused", () => {
    const value = entry();
    value.run.mcp = { url: "http://192.168.1.2:8080/mcp" };
    expect(lines("provider.schema.json", value)).toEqual(['/run/mcp/url must match pattern "^http://127\\.0\\.0\\.1:([1-9][0-9]{2,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])/mcp$"']);
    const both = entry();
    both.run.mcp.url = "http://127.0.0.1:8080/mcp";
    expect(lines("provider.schema.json", both)).toEqual(['/run/mcp has the member "url", which the schema does not define']);
    const neither = entry();
    neither.run.mcp = {};
    expect(lines("provider.schema.json", neither)).toEqual(['/run/mcp is missing the required member "url"']);
  });
});

describe("the author's first documents describe every member (REQ-03)", () => {
  const schema = (name: string) => JSON.parse(readFileSync(path.join(root, "schemas", name), "utf8")) as Record<string, unknown>;
  /** Every member under a `properties` map that has no description, outside an `if` (a selector, not a member). */
  const undescribed = (node: unknown, at: string, out: string[] = []): string[] => {
    if (Array.isArray(node)) node.forEach((item, index) => undescribed(item, `${at}/${index}`, out));
    else if (node !== null && typeof node === "object") {
      for (const [key, value] of Object.entries(node)) {
        if (key === "properties" && !at.endsWith("/if")) {
          for (const [member, sub] of Object.entries(value as Record<string, unknown>)) if (typeof sub === "object" && sub !== null && !("description" in sub)) out.push(`${at}/properties/${member}`);
        }
        undescribed(value, `${at}/${key}`, out);
      }
    }
    return out;
  };

  it.each(["manifest.schema.json", "provider.schema.json"])("%s", (name) => {
    expect(undescribed(schema(name), "#")).toEqual([]);
  });

  it("the walker finds a planted member without a description", () => {
    expect(undescribed({ properties: { a: { type: "string" }, b: { description: "x" } }, if: { properties: { c: {} } } }, "#")).toEqual(["#/properties/a"]);
  });

  it("the profile's kind enum is exactly the kinds it has branches for", () => {
    const profile = (schema("manifest.schema.json").$defs as Record<string, any>).profile;
    expect(profile.properties.kind.enum).toEqual(profile.allOf.map((branch: any) => branch.if.properties.kind.const));
  });
});
