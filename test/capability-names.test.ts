import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadSchemas, projectRoot, SCHEMA_PREFIX } from "../src/contract.js";
import { createValidator, validateDocument } from "../src/validator.js";

const validator = await createValidator();
const fixture = async (name: string) => JSON.parse(await readFile(path.join(projectRoot(), "fixtures/positive", name), "utf8"));
const surfaces = [
  { schema: "interop-agent-call.schema.json", document: await fixture("interop-agent-call.json"), set: (value: any, name: unknown) => { value.capability = name; } },
  { schema: "manifest.schema.json", document: await fixture("manifest-mcp.json"), set: (value: any, name: unknown) => { value.capabilities[0].name = name; } },
  { schema: "service-well-known.schema.json", document: await fixture("service-well-known-capabilities.json"), set: (value: any, name: unknown) => { value.surfaces.mcp.capabilities = [name]; } },
  { schema: "pipeline.schema.json", document: await fixture("pipeline.json"), set: (value: any, name: unknown) => { value.stages[0].capability = name; } }
];

// #region capability-names — docs: docs/specification/interop.md#capability-names
describe.each(surfaces)("capability-name compatibility through $schema", (surface) => {
  const check = (name: unknown) => {
    const document = structuredClone(surface.document);
    surface.set(document, name);
    return validateDocument(validator, `${SCHEMA_PREFIX}schemas/${surface.schema}`, document);
  };

  it.each(["read_message", "list_messages", "a_", "a" + "_".repeat(127)])("accepts product tool name %s", (name) => {
    const result = check(name);
    expect(result.valid, JSON.stringify(result.errors)).toBe(true);
  });

  it.each(["a0", "copy.write", "site-publish", "a" + "z".repeat(127)])("keeps existing name %s valid", (name) => {
    const result = check(name);
    expect(result.valid, JSON.stringify(result.errors)).toBe(true);
  });

  it.each(["", "a", "_read_message", "Read_message", "1read_message", "read message", "read/message", "read:message", "read\nmessage", "a" + "_".repeat(128), 42])("refuses invalid name %j", (name) => {
    const result = check(name);
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.keyword === (typeof name === "string" ? "pattern" : "type"))).toBe(true);
  });
});

it("all four name-bearing schema surfaces reference the shared definition", async () => {
  const uses: string[] = [];
  const visit = (value: unknown, location: string): void => {
    if (Array.isArray(value)) value.forEach((entry, i) => visit(entry, `${location}/${i}`));
    else if (value && typeof value === "object") {
      const object = value as Record<string, unknown>;
      if (object.$ref === "common.schema.json#/$defs/capabilityName") uses.push(location);
      Object.entries(object).forEach(([key, entry]) => visit(entry, `${location}/${key}`));
    }
  };
  for (const schema of await loadSchemas()) visit(schema, schema.$id.split("/").at(-1)!);
  expect(uses.sort()).toEqual([
    "interop-agent-call.schema.json/properties/capability",
    "manifest.schema.json/properties/capabilities/items/properties/name",
    "pipeline.schema.json/$defs/stage/properties/capability",
    "service-well-known.schema.json/properties/surfaces/properties/mcp/properties/capabilities/items"
  ]);
});
// #endregion capability-names
