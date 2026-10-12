import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { attributionHeaders, attributionSettingFindings, MAX_CATEGORIES, OPENROUTER_CATEGORIES } from "../src/openrouter-attribution.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

// DEC-0065 (RM-16): OpenRouter app attribution — the setting (FAC-SEM-098) and the headers, from vectors a port can run.
type Case = { name: string; setting: unknown; request: { url: string; originated: boolean; headers?: Record<string, string> }; expect: unknown };
const vectors = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/vectors/openrouter-attribution.json"), "utf8")) as { cases: Case[] };
const schema = JSON.parse(readFileSync(path.join(projectRoot(), "schemas/openrouter-attribution.schema.json"), "utf8"));

describe("openrouter-attribution vectors", () => {
  it.each(vectors.cases.map((c) => [c.name, c] as const))("%s", (_name, c) => {
    expect(attributionHeaders(c.setting, c.request)).toEqual(c.expect);
  });
  it("never returns a header other than the three attribution headers", () => {
    for (const c of vectors.cases) {
      const names = Object.keys(attributionHeaders(c.setting, c.request).headers);
      expect(names.every((name) => ["HTTP-Referer", "X-OpenRouter-Title", "X-OpenRouter-Categories"].includes(name))).toBe(true);
    }
  });
});

describe("FAC-SEM-098: the attribution setting", () => {
  const codes = (value: unknown) => evaluateSemanticRules("openrouter-attribution", value).map((finding) => `${finding.code} ${finding.instancePath}`);
  it("passes a valid setting and refuses each problem at its path", () => {
    expect(codes({ product: "observatory", title: "Project Observatory", categories: ["programming-app", "cli-agent"] })).toEqual([]);
    expect(codes({ product: "a", title: "A" })).toEqual([]);
    expect(codes({ product: "1fabric", title: "" })).toEqual(["FAC-SEM-098 /product", "FAC-SEM-098 /title"]);
    expect(codes({ product: "fabric", title: "Fabric", categories: "cli-agent" })).toEqual(["FAC-SEM-098 /categories"]);
    expect(codes({ product: "fabric", title: "Fabric", categories: ["cli-agent", 3] })).toEqual(["FAC-SEM-098 /categories/1"]);
    expect(codes({ product: "fabric", title: "Fabric", categories: ["cli-agent", "game", "legal"] })).toEqual(["FAC-SEM-098 /categories"]);
    expect(codes({ product: "fabric", title: "Fabric", categories: ["game", "game"] })).toEqual(["FAC-SEM-098 /categories/1"]);
    expect(attributionSettingFindings("fabric")).toEqual([{ code: "FAC-SEM-098", instancePath: "", message: "an attribution setting is an object" }]);
  });
  it("matches the schema's category list and limit, so the schema and the rule never disagree", () => {
    expect(new Set(schema.properties.categories.items.enum)).toEqual(OPENROUTER_CATEGORIES);
    expect(schema.properties.categories.maxItems).toBe(MAX_CATEGORIES);
  });
  it("reads a request whose url or headers are malformed as no attribution, never by throwing", () => {
    const setting = { product: "fabric", title: "Fabric" };
    expect(attributionHeaders(setting, { url: 7 as unknown as string, originated: true })).toEqual({ headers: {}, none: "not-openrouter" });
    expect(attributionHeaders(setting, { url: "https://openrouter.ai/api/v1", originated: "yes" as unknown as boolean })).toEqual({ headers: {}, none: "forwarded" });
    expect(attributionHeaders(setting, { url: "https://openrouter.ai/api/v1", originated: true, headers: "x" as unknown as Record<string, string> }).headers).toHaveProperty("HTTP-Referer");
  });
});
