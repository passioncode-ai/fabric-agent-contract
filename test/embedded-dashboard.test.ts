import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { EXTENSION_KEYS } from "../src/extensions.js";
import { createValidator, validateDocument } from "../src/validator.js";

// fabric-dashboard/0.1 (DEC-0036): the rules are prose, the declaration is a schema. These tests keep
// the numbers, the theme ids and the extension key the same in the spec, the schema and the fixtures.
const root = projectRoot();
const read = (file: string) => readFile(path.join(root, file), "utf8");
const spec = await read("docs/specification/embedded-dashboard.md");
const schema = JSON.parse(await read("schemas/service-dashboard-extension.schema.json")) as {
  properties: { minWidth: { minimum: number; maximum: number }; appearance: { items: { enum: string[] } }; themes: { description: string } };
};
const validator = await createValidator();
const SCHEMA = `${SCHEMA_PREFIX}schemas/service-dashboard-extension.schema.json`;
const REFERENCE_THEMES = ["graphite", "fabric", "paper", "forest", "ocean", "ember", "contrast"];

describe("fabric-dashboard/0.1 (DEC-0036)", () => {
  it("defines ED-1…ED-10 once each and no other rule", () => {
    const defined = [...spec.matchAll(/^\*\*(ED-\d+) — /gm)].map((match) => match[1]);
    expect(defined).toEqual(Array.from({ length: 10 }, (_, index) => `ED-${index + 1}`));
  });

  it("states the page floor the schema enforces and the host floor above it", () => {
    expect(schema.properties.minWidth.minimum).toBe(360);
    expect(spec).toMatch(/\*\*ED-1 — The floor\.\*\*[^]*?from its \*floor\* up: 360\s+CSS pixels/);
    expect(spec).toMatch(/at\s+least `max\(480, minWidth\)` CSS pixels/);
    expect(spec).toMatch(/`minWidth` \| yes \| the page's floor in CSS pixels, 360…1280/);
    expect(schema.properties.minWidth.maximum).toBe(1280);
  });

  it("names the one extension key spelling", () => {
    expect(spec).toContain(`\`${EXTENSION_KEYS.dashboard}\``);
  });

  it("lists the same reference themes in ED-10 and the schema", () => {
    const ed10 = spec.slice(spec.indexOf("**ED-10 — "), spec.indexOf("## How a page shows"));
    const ids = [...ed10.matchAll(/`([a-z][a-z0-9-]*)`/g)].map((match) => match[1]);
    expect(ids.slice(0, REFERENCE_THEMES.length)).toEqual(REFERENCE_THEMES);
    for (const id of REFERENCE_THEMES) expect(schema.properties.themes.description).toContain(id);
  });

  it("documents every carrier field the declaration can name", () => {
    for (const field of schema.properties.appearance.items.enum) expect(spec).toMatch(new RegExp(`^\\| \`${field}\` \\|`, "m"));
    expect(spec).toMatch(/^\| `v` \| `1` \|/m);
  });

  it("carries the declaration inside a well-known document that stays valid", async () => {
    const wellKnown = JSON.parse(await read("fixtures/positive/service-well-known-dashboard.json")) as { extensions: Record<string, unknown> };
    const value = wellKnown.extensions[EXTENSION_KEYS.dashboard];
    expect(value).toBeDefined();
    expect(validateDocument(validator, SCHEMA, value).valid).toBe(true);
  });

  it("refuses a floor below 360, a theme id that is not a slug and an unknown field", () => {
    expect(validateDocument(validator, SCHEMA, { minWidth: 359 }).valid).toBe(false);
    expect(validateDocument(validator, SCHEMA, { minWidth: 360, themes: ["Ocean"] }).valid).toBe(false);
    expect(validateDocument(validator, SCHEMA, { minWidth: 360, zoom: 1.2 }).valid).toBe(false);
    expect(validateDocument(validator, SCHEMA, { minWidth: 360, kit: "fabric-dashboard-kit@1" }).valid).toBe(false);
    expect(validateDocument(validator, SCHEMA, { minWidth: 360, kit: "fabric-dashboard-kit@1.0.0" }).valid).toBe(true);
  });
});
