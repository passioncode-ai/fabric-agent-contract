import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { EXTENSION_KEYS } from "../src/extensions.js";

// REQ-06 (contract review 2026-10-21): interop C3.1 serves an MCP capability as a tool whose name equals the capability
// name (docs/specification/interop.md#c31-capabilities). Authors copy the positive manifests, so each one names, in
// its requiredFeatures, the tool C3.1 makes it serve. This holds the fixtures only; it is not a semantic rule.
interface Entry { name: string; schema: string; path: string; valid: boolean }
type Capability = { name?: unknown; extensions?: Record<string, unknown>; profile?: { kind?: unknown; requiredFeatures?: unknown } };
type Manifest = { extensions?: Record<string, unknown>; capabilities?: Capability[] };

const fixturesRoot = path.join(projectRoot(), "fixtures");
const catalogue = JSON.parse(await readFile(path.join(fixturesRoot, "catalogue.json"), "utf8")) as Entry[];
const positives = await Promise.all(catalogue.filter((entry) => entry.valid && entry.schema === "manifest.schema.json").map(async (entry) => ({ path: entry.path, manifest: JSON.parse(await readFile(path.join(fixturesRoot, entry.path), "utf8")) as Manifest })));
const mcpCapabilities = positives.flatMap(({ path: where, manifest }) => (manifest.capabilities ?? []).flatMap((capability, index) => (capability.profile?.kind === "mcp" ? [{ where: `${where} /capabilities/${index}`, manifest, capability }] : [])));
const carriesInterop = (manifest: Manifest, capability: Capability) => EXTENSION_KEYS.interop in (capability.extensions ?? {}) || EXTENSION_KEYS.interop in (manifest.extensions ?? {});

/** The C3.1 problem of one capability, or undefined: its requiredFeatures must list `tool:<its name>`. */
function c31Problem(capability: Capability): string | undefined {
  const features = Array.isArray(capability.profile?.requiredFeatures) ? capability.profile.requiredFeatures : [];
  const tool = `tool:${String(capability.name)}`;
  return features.includes(tool) ? undefined : `requiredFeatures ${JSON.stringify(features)} does not list ${tool}`;
}

describe("interop C3.1 in the positive MCP manifests", () => {
  it("has positive MCP manifests that carry the interop extension, so the check below is not empty", () => {
    expect(mcpCapabilities.filter(({ manifest, capability }) => carriesInterop(manifest, capability)).length).toBeGreaterThan(0);
  });

  it("names, in every interop manifest's requiredFeatures, the tool whose name is the capability's", () => {
    const problems = mcpCapabilities.filter(({ manifest, capability }) => carriesInterop(manifest, capability)).flatMap(({ where, capability }) => {
      const problem = c31Problem(capability);
      return problem ? [`${where}: ${problem}`] : [];
    });
    expect(problems).toEqual([]);
  });

  it("does the same in every other positive MCP manifest, the ones the author guide points at", () => {
    expect(mcpCapabilities.length).toBeGreaterThanOrEqual(4);
    expect(mcpCapabilities.flatMap(({ where, capability }) => (c31Problem(capability) ? [where] : []))).toEqual([]);
  });

  it("refuses a capability whose required tool has another name", () => {
    expect(c31Problem({ name: "seo.keyword-analysis", profile: { kind: "mcp", requiredFeatures: ["tool:analyze_keywords"] } })).toBe('requiredFeatures ["tool:analyze_keywords"] does not list tool:seo.keyword-analysis');
    expect(c31Problem({ name: "analyze_keywords", profile: { kind: "mcp" } })).toBe("requiredFeatures [] does not list tool:analyze_keywords");
    expect(c31Problem({ name: "analyze_keywords", profile: { kind: "mcp", requiredFeatures: ["resources", "tool:analyze_keywords"] } })).toBeUndefined();
  });
});
