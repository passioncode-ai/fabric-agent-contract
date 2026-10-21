import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { EXTENSION_KEYS } from "../src/extensions.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidatorSync, validateDocument } from "../src/validator.js";

// REQ-10 and REQ-11 of the contract review of 2026-10-21: every example an author copies from the guide or a
// specification page is a document the contract accepts. An example is a ```json block whose line before it (blank
// lines aside) is `<!-- example: <schema file> [kind=<semantic kind>] [pair=<name>] -->`; with a kind, the semantic
// rules for that kind find nothing in it; examples sharing a pair name are read together, as a host reads them.

const root = projectRoot();
const validator = createValidatorSync();

interface Example { file: string; line: number; schema: string; kind?: string; pair?: string; document: Record<string, unknown> }

function examplesIn(text: string, file: string): Example[] {
  const found: Example[] = [];
  const lines = text.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const marker = /^<!-- example: (\S+\.schema\.json)((?: [a-z]+=\S+)*) -->$/.exec(lines[index] ?? "");
    if (!marker) continue;
    let open = index + 1;
    while ((lines[open] ?? "").trim() === "") open += 1;
    if (lines[open] !== "```json") throw new Error(`${file}:${index + 1}: an example marker is not followed by a json block`);
    const close = lines.findIndex((line, at) => at > open && line === "```");
    if (close < 0) throw new Error(`${file}:${open + 1}: the example's block is never closed`);
    const options = Object.fromEntries([...(marker[2] ?? "").matchAll(/ ([a-z]+)=(\S+)/g)].map((match) => [match[1], match[2]]));
    found.push({
      file,
      line: open + 1,
      schema: marker[1] as string,
      kind: options.kind,
      pair: options.pair,
      document: JSON.parse(lines.slice(open + 1, close).join("\n")) as Record<string, unknown>
    });
  }
  return found;
}

const sources = ["docs/guides/connecting-compatible-agents.md", "docs/specification/service.md"];
const examples = sources.flatMap((file) => examplesIn(readFileSync(path.join(root, file), "utf8"), file));
const schemaOf = (name: string) => JSON.parse(readFileSync(path.join(root, "schemas", name), "utf8")) as { required?: string[] };
const valid = (example: Pick<Example, "schema" | "document">) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${example.schema}`, example.document);

describe("the examples an author copies (REQ-10, REQ-11)", () => {
  it("are found: every kind of agent the guide covers has its documents", () => {
    const guide = examples.filter((example) => example.file.startsWith("docs/guides/"));
    expect(new Set(guide.map((example) => example.schema))).toEqual(new Set(["service-descriptor.schema.json", "service-well-known.schema.json", "manifest.schema.json", "provider.schema.json"]));
    const profiles = guide.filter((example) => example.schema === "manifest.schema.json").map((example) => ((example.document.capabilities as Array<{ profile: { kind: string } }>)[0] as { profile: { kind: string } }).profile.kind);
    expect(profiles.sort()).toEqual(["local-runner", "mcp", "mcp"]);
    expect(examples.filter((example) => example.file.endsWith("service.md"))).toHaveLength(2);
  });

  it.each(examples.map((example) => [`${example.file}:${example.line}`, example] as const))("%s validates against its schema", (_where, example) => {
    const result = valid(example);
    expect(result.valid, JSON.stringify(result.errors, null, 2)).toBe(true);
  });

  it.each(examples.filter((example) => example.kind).map((example) => [`${example.file}:${example.line}`, example] as const))("%s passes the semantic rules of its kind", (_where, example) => {
    expect(evaluateSemanticRules(example.kind as string, example.document)).toEqual([]);
  });

  it.each(examples.map((example) => [`${example.file}:${example.line}`, example] as const))("%s fails when a required member is removed or misspelt", (_where, example) => {
    const required = schemaOf(example.schema).required ?? [];
    expect(required.length).toBeGreaterThan(0);
    for (const member of required) {
      const { [member]: value, ...rest } = example.document;
      expect(valid({ schema: example.schema, document: rest }).valid, `without ${member}`).toBe(false);
      expect(valid({ schema: example.schema, document: { ...rest, [`${member}s`]: value } }).valid, `${member} misspelt`).toBe(false);
    }
  });

  it("a planted credential in an example is a semantic finding", () => {
    const entry = examples.find((example) => example.schema === "provider.schema.json") as Example;
    const planted = structuredClone(entry.document) as { run: { mcp: { stdio: { command: string[] } } } };
    planted.run.mcp.stdio.command.push("--token=abcdef0123456789");
    expect(valid({ schema: entry.schema, document: planted }).valid).toBe(true);
    expect(evaluateSemanticRules("provider-entry", planted).map((finding) => finding.code)).toContain("FAC-SEM-057");
  });

  it("a marker with no json block after it is an error, not a skipped example", () => {
    expect(() => examplesIn("<!-- example: manifest.schema.json -->\n\ntext\n", "x.md")).toThrow(/not followed by a json block/);
    expect(examplesIn("<!-- example: manifest.schema.json kind=manifest pair=a -->\n\n```json\n{}\n```\n", "x.md")).toEqual([
      { file: "x.md", line: 3, schema: "manifest.schema.json", kind: "manifest", pair: "a", document: {} }
    ]);
  });
});

describe("examples read together (pair=…)", () => {
  const pairs = new Map<string, Example[]>();
  for (const example of examples.filter((candidate) => candidate.pair)) {
    const key = `${example.file}#${example.pair}`;
    pairs.set(key, [...(pairs.get(key) ?? []), example]);
  }
  const one = (group: Example[], schema: string) => group.find((example) => example.schema === schema)?.document;

  it("are present", () => {
    expect([...pairs.keys()].sort()).toEqual(["docs/guides/connecting-compatible-agents.md#service", "docs/guides/connecting-compatible-agents.md#stdio"]);
  });

  it("a service's well-known document and manifest name its descriptor (FAC-SEM-009, FAC-SEM-020)", () => {
    const group = pairs.get("docs/guides/connecting-compatible-agents.md#service") as Example[];
    const descriptor = one(group, "service-descriptor.schema.json") as { id: string; instance: string };
    const wellKnown = one(group, "service-well-known.schema.json") as { service: { id: string; instance: string } };
    const manifest = one(group, "manifest.schema.json") as { provider: { extensions: Record<string, { descriptor: string }> }; capabilities: Array<{ name: string; profile: { requiredFeatures: string[] } }> };
    expect([wellKnown.service.id, wellKnown.service.instance]).toEqual([descriptor.id, descriptor.instance]);
    expect(manifest.provider.extensions[EXTENSION_KEYS.service]?.descriptor).toBe(`${descriptor.id}.${descriptor.instance}`);
    // Interop C3.1: the MCP tool a capability is served as has the capability's name.
    for (const capability of manifest.capabilities) expect(capability.profile.requiredFeatures).toContain(`tool:${capability.name}`);
  });

  it("a provider entry's providerId is its manifest's provider.id (FAC-SEM-014)", () => {
    const group = pairs.get("docs/guides/connecting-compatible-agents.md#stdio") as Example[];
    const entry = one(group, "provider.schema.json") as { providerId: string };
    const manifest = one(group, "manifest.schema.json") as { provider: { id: string } };
    expect(entry.providerId).toBe(manifest.provider.id);
  });
});

describe("the guide's profile table names each profile's version member (REQ-10)", () => {
  const guide = readFileSync(path.join(root, "docs/guides/connecting-compatible-agents.md"), "utf8");
  // The profile selects its branch on `kind` (allOf of if/then), each branch a `$defs` profile (REQ-03).
  type Branch = { properties: Record<string, { const?: string }> };
  const manifest = JSON.parse(readFileSync(path.join(root, "schemas/manifest.schema.json"), "utf8")) as {
    $defs: Record<string, Branch> & { profile: { allOf: Array<{ if: Branch; then: { $ref: string } }> } };
  };
  const branches = manifest.$defs.profile.allOf.map((arm) => {
    const kind = arm.if.properties.kind?.const as string;
    const branch = manifest.$defs[arm.then.$ref.replace("#/$defs/", "")] as Branch;
    const [member, schema] = Object.entries(branch.properties).find(([name, value]) => /(Revision|Version)$/.test(name) && value.const !== undefined) as [string, { const: string }];
    return { kind, member, value: schema.const };
  });

  it("reads three profiles from the schema", () => {
    expect(branches.map((branch) => branch.kind).sort()).toEqual(["a2a", "local-runner", "mcp"]);
  });

  it.each(branches.map((branch) => [branch.kind, branch] as const))("%s", (_kind, branch) => {
    const row = guide.split("\n").find((line) => line.startsWith(`| \`${branch.kind}\` |`));
    expect(row, `no row for ${branch.kind}`).toBeDefined();
    expect(row).toContain(`\`${branch.member}\`: \`${branch.value}\``);
  });
});
