import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";

// fabric-operator-channel/0.1 (DEC-0034, group chats and liveness DEC-0035): the rules are prose, the status is a schema. These tests
// keep the two from drifting apart and keep credentials and private ids out of the published shapes.
const root = projectRoot();
const read = (file: string) => readFile(path.join(root, file), "utf8");
const spec = await read("docs/specification/operator-channel.md");
const schema = JSON.parse(await read("schemas/operator-channel-status.schema.json")) as {
  properties: Record<string, { enum?: string[]; properties?: Record<string, { enum?: string[] }> }>;
};

/** Rows of the markdown table that follows `heading`, first cell unquoted. */
function firstCells(heading: string): string[] {
  const start = spec.indexOf(heading);
  expect(start, `section ${heading}`).toBeGreaterThanOrEqual(0);
  const lines = spec.slice(start).split("\n");
  const table = lines.slice(lines.findIndex((line) => line.startsWith("|")));
  const rows = table.slice(0, table.findIndex((line) => !line.startsWith("|")));
  return rows.slice(2).map((row) => (row.split("|")[1] ?? "").trim().replace(/`/g, ""));
}

describe("fabric-operator-channel/0.1 (DEC-0034, DEC-0035)", () => {
  it("defines OC-1…OC-17 once each and no other rule", () => {
    const defined = [...spec.matchAll(/^\*\*(OC-\d+) — /gm)].map((match) => match[1]);
    expect(defined).toEqual(Array.from({ length: 17 }, (_, index) => `OC-${index + 1}`));
  });

  it("documents each known reason code once, in a state the schema has and a shape it accepts", () => {
    const codes = firstCells("| Code | State | Meaning |");
    expect(new Set(codes).size, "duplicate reason code").toBe(codes.length);
    const start = spec.indexOf("| Code | State | Meaning |");
    const rows = spec.slice(start).split("\n").filter((line) => line.startsWith("| `"));
    const reasonDef = (schema as unknown as { $defs: { reason: { properties: { code: { pattern: string } } } } }).$defs.reason;
    const pattern = new RegExp(reasonDef.properties.code.pattern);
    for (const row of rows) {
      const [code, state] = row.split("|").slice(1, 3).map((cell) => cell.trim().replace(/`/g, ""));
      expect(code, row).toMatch(pattern);
      expect(schema.properties.state?.enum, row).toContain(state);
    }
    // OC-17: a channel nobody receives on has a known code, and it is a degraded one.
    expect(rows.find((row) => row.startsWith("| `receiver-missing` |"))).toContain("| `degraded` |");
  });

  it("uses in every valid fixture only reason codes the spec documents", async () => {
    const codes = new Set(firstCells("| Code | State | Meaning |"));
    const positives = (await readdir(path.join(root, "fixtures/positive"))).filter((name) => name.startsWith("operator-channel-status"));
    const used = new Set<string>();
    for (const name of positives) {
      const document = JSON.parse(await read(`fixtures/positive/${name}`)) as { reason?: { code: string } };
      if (document.reason) {
        expect(codes, name).toContain(document.reason.code);
        used.add(document.reason.code);
      }
    }
    expect([...used]).toContain("receiver-missing");
  });

  it("documents exactly the states the status schema accepts", () => {
    expect(firstCells("| State | Meaning | Requires |")).toEqual(schema.properties.state?.enum);
  });

  it("documents receiver modes and leases the schema accepts", () => {
    const receiver = schema.properties.receiver?.properties ?? {};
    expect(receiver.mode?.enum).toEqual(["long-polling", "webhook"]);
    expect(receiver.lease?.enum).toEqual(["held", "elsewhere", "none"]);
    for (const lease of ["held", "elsewhere"]) expect(spec).toContain(`receiver.lease: ${lease}`);
  });

  it("has no field that could carry a credential value or a private id", () => {
    const text = JSON.stringify(schema);
    for (const field of ["token", "value", "secret", "chatId", "userId", "username"]) {
      expect(text, field).not.toMatch(new RegExp(`"${field}"\\s*:`));
    }
  });

  it("keeps token-shaped strings out of the spec, the schema and every valid fixture", async () => {
    // A Telegram bot token is <bot id>:<35 characters>. No fixture plants a real-looking one: the
    // negative fixture pastes an assignment into the name, which the name pattern refuses.
    const tokenShape = /\d{6,}:[A-Za-z0-9_-]{30,}/;
    const positives = (await readdir(path.join(root, "fixtures/positive"))).filter((name) => name.startsWith("operator-channel"));
    expect(positives.length).toBeGreaterThanOrEqual(5);
    for (const name of positives) expect(await read(`fixtures/positive/${name}`), name).not.toMatch(tokenShape);
    expect(spec).not.toMatch(tokenShape);
    expect(JSON.stringify(schema)).not.toMatch(tokenShape);
    expect(await read("fixtures/negative/operator-channel-status-token-as-name.json")).not.toMatch(tokenShape);
  });

  it("is recorded as DEC-0034 and linked from the decision", async () => {
    const decisions = await read("docs/DECISIONS.md");
    const entry = decisions.slice(decisions.indexOf("### DEC-0034"));
    expect(entry.startsWith("### DEC-0034")).toBe(true);
    expect(entry).toContain("specification/operator-channel.md");
    expect(entry).toContain("operator-channel-status.schema.json");
  });

  it("records the group-chat and liveness rules as DEC-0035 and links them", async () => {
    const decisions = await read("docs/DECISIONS.md");
    const start = decisions.indexOf("### DEC-0035");
    expect(start).toBeGreaterThanOrEqual(0);
    const next = decisions.indexOf("\n### DEC-", start + 1);
    const entry = decisions.slice(start, next === -1 ? undefined : next);
    expect(entry).toContain("specification/operator-channel.md");
    for (const rule of ["OC-14", "OC-15", "OC-16", "OC-17"]) expect(entry, rule).toContain(rule);
    expect(entry).toContain("receiver-missing");
    expect(spec).toContain("DEC-0035");
  });
});
