import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

// Every positive fixture a single-document rule applies to passes the semantic rules: a rule that refused the
// repository's own valid example would otherwise stay green (F-B-201, the 2026-10-11 board run).
const root = projectRoot();
interface Entry { name: string; schema: string; path: string; valid: boolean }
const catalogue = JSON.parse(readFileSync(path.join(root, "fixtures/catalogue.json"), "utf8")) as Entry[];

/**
 * The rule kind that reads one document of a schema whole. A schema missing here has no single-document rule; the
 * composite kinds — `device-enrollment` (a request with its response), `device-key-set` (a set with the root key it
 * is checked under) and the interop, route and delegation bundles — are exercised by their semantic fixtures.
 */
export const KIND_OF_SCHEMA: Readonly<Record<string, string>> = {
  "activity-batch.schema.json": "activity-batch",
  "activity-summary.schema.json": "activity-summary",
  "comms-submit.schema.json": "comms-submit",
  "coordination.schema.json": "coordination",
  "manifest.schema.json": "service-manifest",
  "provider.schema.json": "provider-entry",
  "result.schema.json": "result",
  "roles.schema.json": "roles",
  "runner-route.schema.json": "runner-route",
  "runners.schema.json": "runner-catalogue",
  "service-descriptor.schema.json": "service-descriptor",
  "service-usage.schema.json": "service-usage",
  "service-well-known.schema.json": "service-well-known",
  "session-handoff.schema.json": "session-handoff",
  "settings-backup.schema.json": "settings-backup",
  "spend-policy.schema.json": "spend-policy",
  "telemetry-event.schema.json": "telemetry-event"
};

describe("every positive fixture passes the semantic rules", () => {
  const swept = catalogue.filter((entry) => entry.valid && KIND_OF_SCHEMA[entry.schema]);

  it.each(swept)("$name", (entry) => {
    const value = JSON.parse(readFileSync(path.join(root, "fixtures", entry.path), "utf8")) as unknown;
    expect(evaluateSemanticRules(KIND_OF_SCHEMA[entry.schema] as string, value)).toEqual([]);
  });

  it("names only kinds a rule reads and schemas that exist, and sweeps a fixture of each", () => {
    const sources = ["semantic-rules", "registry-rules", "interop-rules", "route-rules", "activity-rules", "device-rules", "delegation-rules", "session-handoff"]
      .map((name) => readFileSync(path.join(root, "src", `${name}.ts`), "utf8"))
      .join("\n");
    for (const [schema, kind] of Object.entries(KIND_OF_SCHEMA)) {
      expect(sources, kind).toContain(`kind === "${kind}"`);
      expect(catalogue.some((entry) => entry.schema === schema && entry.valid), schema).toBe(true);
    }
    expect(swept.length).toBeGreaterThan(40);
  });
});
