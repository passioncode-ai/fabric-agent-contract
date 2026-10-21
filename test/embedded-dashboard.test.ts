import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { EXTENSION_KEYS } from "../src/extensions.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { type HostView, dashboardDeclarationRules, hostView } from "../src/dashboard-declaration.js";
import { type Mutant, killers } from "./schema-mutants.js";

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
const vectors = JSON.parse(await read("fixtures/vectors/dashboard-declaration.json")) as {
  key: string; cases: { name: string; wellKnown?: unknown; wellKnownJson?: string; expect: Omit<HostView, "errors"> }[];
};
const semantic = (await readdir(path.join(root, "fixtures/semantic"))).filter((name) => name.startsWith("service-well-known-dashboard"));

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

  it("holds the floor's boundaries: 359 and 1281 refused, 360 and 1280 accepted", () => {
    for (const [minWidth, valid] of [[359, false], [360, true], [1280, true], [1281, false]] as const) {
      expect(validateDocument(validator, SCHEMA, { minWidth }).valid, String(minWidth)).toBe(valid);
    }
  });

  // F-B-217: each of these constraints of the declaration, removed one at a time, lets a negative fixture through.
  const MUTANTS: Mutant[] = [
    { name: "themes may be empty", mutate: (s) => { delete s.properties.themes.minItems; } },
    { name: "themes beyond 32", mutate: (s) => { delete s.properties.themes.maxItems; } },
    { name: "minWidth not required", mutate: (s) => { s.required = []; } },
    { name: "minWidth any number", mutate: (s) => { s.properties.minWidth.type = "number"; } },
    { name: "floor below 360", mutate: (s) => { s.properties.minWidth.minimum = 0; } },
    { name: "floor above 1280", mutate: (s) => { delete s.properties.minWidth.maximum; } },
    { name: "a theme twice", mutate: (s) => { s.properties.themes.uniqueItems = false; } },
    { name: "a carrier field twice", mutate: (s) => { s.properties.appearance.uniqueItems = false; s.properties.appearance.maxItems = 10; } },
    { name: "a theme id any string", mutate: (s) => { delete s.properties.themes.items.pattern; } },
    { name: "unknown fields", mutate: (s) => { s.additionalProperties = true; } }
  ];
  it.each(MUTANTS)("a fixture kills the mutant: $name", async (mutant) => {
    expect(await killers("service-dashboard-extension.schema.json", mutant)).not.toEqual([]);
  });

  it("the unchanged schema accepts no negative fixture (the identity mutant), so the filter reads negatives only", async () => {
    expect(await killers("service-dashboard-extension.schema.json", { name: "identity", mutate: () => {} })).toEqual([]);
  });
});

describe("the declaration as a host reads it (DEC-0059, ED-6, ED-8, ED-9, FAC-SEM-080)", () => {
  it("states the agreed carrier scope, the fields a page applies and the invalid declaration's handling", () => {
    expect(spec).toContain("**per\nhost in a shared cookie store; per service where the host gives each service its own store**");
    expect(spec).toMatch(/cookies do not provide\s+isolation by port" \(RFC 6265 §8\.5/);
    expect(spec).toMatch(/its declaration lists in `appearance` \(ED-9\), and only those/);
    expect(spec).toMatch(/takes nothing from the cookie: from the host it\s+follows `prefers-color-scheme` only/);
    expect(spec).toMatch(/treats an invalid\s+value as not declared/);
    expect(spec).not.toContain("on the service origin");
    expect(spec).toMatch(/^\| <a id="fac-sem-080"><\/a>`FAC-SEM-080` \| `service-well-known` \|/m);
  });

  it("names the dashboard key the code reads", () => {
    expect(vectors.key).toBe(EXTENSION_KEYS.dashboard);
    expect(vectors.cases.length).toBeGreaterThanOrEqual(21);
    expect(vectors.cases.filter((item) => item.wellKnownJson !== undefined).map((item) => item.wellKnownJson)).toEqual([expect.stringContaining('"minWidth":360.0')]);
  });

  it.each(vectors.cases)("vector $name", ({ wellKnown: given, wellKnownJson, expect: expected }) => {
    // A raw-text case is parsed as a host would parse the document it fetched.
    const wellKnown = wellKnownJson === undefined ? given : (JSON.parse(wellKnownJson) as unknown);
    const { errors, ...view } = hostView(wellKnown);
    expect(view).toEqual(expected);
    expect(errors.length > 0).toBe(expected.reported);
    // A declaration the host uses is one the schema accepts, and FAC-SEM-080 reports exactly the ones it does not.
    expect(dashboardDeclarationRules(wellKnown as Record<string, unknown>).length > 0).toBe(expected.reported);
  });

  it("reads only the document's own key, never one inherited from Object.prototype", () => {
    const proto = Object.prototype as Record<string, unknown>;
    try {
      // Not enumerable: the test's own object literals would otherwise inherit an enumerable member, and assigning to
      // it can throw (a read-only inherited property), so the test would fail for that reason, not the reader's.
      Object.defineProperty(proto, EXTENSION_KEYS.dashboard, { value: { minWidth: 1280 }, configurable: true, enumerable: false });
      expect(hostView({ extensions: {} }).declared).toBe(false);
      expect(hostView({ extensions: {} }).hostFloor).toBe(480);
    } finally {
      delete proto[EXTENSION_KEYS.dashboard];
    }
  });

  it("never throws on a malformed document", () => {
    for (const value of [null, 7, "x", [], { extensions: null }, { extensions: "x" }, { extensions: { [EXTENSION_KEYS.dashboard]: [1, 2] } }]) {
      expect(() => hostView(value)).not.toThrow();
      expect(hostView(value).declared).toBe(false);
    }
  });

  it("has a failing and two passing semantic fixtures", () => {
    expect(semantic.sort()).toEqual(["service-well-known-dashboard-absent.json", "service-well-known-dashboard-invalid.json", "service-well-known-dashboard-ok.json"]);
  });

  it.each(semantic)("%s yields exactly its expected codes, and the well-known schema accepts its input", async (name) => {
    const fixture = JSON.parse(await read(`fixtures/semantic/${name}`)) as { kind: string; expect: string[]; input: unknown };
    expect(evaluateSemanticRules(fixture.kind, fixture.input).map((finding) => finding.code)).toEqual(fixture.expect);
    // The point of FAC-SEM-080: the open `extensions` let the invalid declaration through the document's own schema.
    expect(validateDocument(validator, `${SCHEMA_PREFIX}schemas/service-well-known.schema.json`, fixture.input).valid).toBe(true);
  });

  it("points each finding at the key, escaped as RFC 6901 asks, and names the error", async () => {
    const fixture = JSON.parse(await read("fixtures/semantic/service-well-known-dashboard-invalid.json")) as { input: Record<string, unknown> };
    const findings = dashboardDeclarationRules(fixture.input);
    expect(findings.map((finding) => finding.instancePath)).toEqual(Array(2).fill("/extensions/https:~1~1fabric.passioncode.ai~1agent-contract~1extensions~1dashboard~10.1"));
    expect(findings.map((finding) => finding.message).join(" ")).toMatch(/maximum[^]*additionalProperties|additionalProperties[^]*maximum/);
  });

  it("is recorded as DEC-0059 with its rule code", async () => {
    const decisions = await read("docs/DECISIONS.md");
    const start = decisions.indexOf("### DEC-0059");
    expect(start).toBeGreaterThanOrEqual(0);
    const next = decisions.indexOf("\n### DEC-", start + 1);
    const entry = decisions.slice(start, next === -1 ? undefined : next);
    for (const text of ["DEC-0036", "FAC-SEM-080", "F-B-214", "F-B-215", "F-B-216", "F-B-217", "e1fdd64"]) expect(entry, text).toContain(text);
  });
});

