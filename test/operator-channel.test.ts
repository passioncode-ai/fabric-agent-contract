import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { type Mutant, killers } from "./schema-mutants.js";

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

  it("records DEC-0058: a channel nobody receives on is representable only as degraded, receiver-missing, lease none", async () => {
    const decisions = await read("docs/DECISIONS.md");
    const start = decisions.indexOf("### DEC-0058");
    expect(start).toBeGreaterThanOrEqual(0);
    const next = decisions.indexOf("\n### DEC-", start + 1);
    const entry = decisions.slice(start, next === -1 ? undefined : next);
    for (const text of ["DEC-0035", "operator-channel-status.schema.json", "receiver-missing", "F-B-204", "F-B-205", "F-B-219"]) expect(entry, text).toContain(text);
    // OC-17's closing list names every state but degraded, and the status table says what unlinked's lease is.
    expect(spec).toMatch(/never reported as `unlinked`, `linked`, `standby` or `off`/);
    expect(spec).toMatch(/^\| `unlinked` \|[^\n]*`receiver\.lease: held` or `elsewhere`/m);
    const glossary = await read("CONTEXT.md");
    expect(glossary).toMatch(/\*\*Addressed message\*\*[^]*?except a bare\s+`\/link CODE` that matches its own pending code \(OC-15\)/);
  });

  it("accepts a waiting channel nobody receives on only as degraded with lease none", async () => {
    const validator = await createValidator();
    const id = `${SCHEMA_PREFIX}schemas/operator-channel-status.schema.json`;
    const waiting = JSON.parse(await read("fixtures/positive/operator-channel-status-degraded-receiver-missing-unlinked.json")) as Record<string, unknown>;
    expect(validateDocument(validator, id, waiting).valid).toBe(true);
    for (const state of ["off", "unlinked", "linked", "standby"]) expect(validateDocument(validator, id, { ...waiting, state }).valid, state).toBe(false);
    const unlinked = JSON.parse(await read("fixtures/positive/operator-channel-status-unlinked.json")) as Record<string, unknown>;
    for (const lease of ["held", "elsewhere"]) expect(validateDocument(validator, id, { ...unlinked, receiver: { mode: "long-polling", lease } }).valid, lease).toBe(true);
    // binding.chats: 16 is the limit, 17 one over it.
    const linked = JSON.parse(await read("fixtures/positive/operator-channel-status-linked.json")) as Record<string, unknown>;
    expect(validateDocument(validator, id, { ...linked, binding: { chats: 16, allowedUsers: 1, linkedAt: "2026-10-09T18:02:11Z" } }).valid).toBe(true);
    expect(validateDocument(validator, id, { ...linked, binding: { chats: 17, allowedUsers: 1, linkedAt: "2026-10-09T18:02:11Z" } }).valid).toBe(false);
  });

  // F-B-205: every state invariant of the status schema, removed one at a time, lets a negative fixture through.
  const branch = (schema: Record<string, any>, test: (cond: Record<string, any>) => boolean) => {
    const found = (schema.allOf as Record<string, any>[]).find((item) => test(item.if));
    if (!found) throw new Error("no such branch");
    return found.then as Record<string, any>;
  };
  const state = (value: string) => (cond: Record<string, any>) => cond.properties?.state?.const === value;
  const dropRequired = (schema: Record<string, any>, which: string, member: string) => {
    const then = branch(schema, state(which));
    then.required = (then.required as string[]).filter((name) => name !== member);
  };
  const MUTANTS: Mutant[] = [
    { name: "standby and degraded need no reason", mutate: (s) => { s.allOf[0].if.properties.state.enum = ["degraded"]; } },
    { name: "degraded needs no reason", mutate: (s) => { s.allOf[0].if.properties.state.enum = ["standby"]; } },
    { name: "linked lease any", mutate: (s) => { delete branch(s, state("linked")).properties.receiver.properties.lease; } },
    { name: "linked credential may be absent", mutate: (s) => { branch(s, state("linked")).properties.credential = true; } },
    { name: "linked may carry a reason", mutate: (s) => { delete branch(s, state("linked")).not; } },
    ...["credential", "receiver", "binding"].map((member) => ({ name: `linked without ${member}`, mutate: (s: Record<string, any>) => dropRequired(s, "linked", member) })),
    { name: "standby lease any", mutate: (s) => { delete branch(s, state("standby")).properties.receiver.properties.lease; } },
    ...["credential", "receiver", "binding"].map((member) => ({ name: `standby without ${member}`, mutate: (s: Record<string, any>) => dropRequired(s, "standby", member) })),
    ...["credential", "receiver"].map((member) => ({ name: `unlinked without ${member}`, mutate: (s: Record<string, any>) => dropRequired(s, "unlinked", member) })),
    { name: "unlinked may carry a binding", mutate: (s) => { delete branch(s, state("unlinked")).not; } },
    { name: "unlinked with nobody receiving", mutate: (s) => { branch(s, state("unlinked")).properties.receiver = true; } },
    { name: "degraded without credential", mutate: (s) => dropRequired(s, "degraded", "credential") },
    { name: "receiver-missing in any state", mutate: (s) => { delete branch(s, (c) => c.properties?.reason?.properties?.code?.const === "receiver-missing").properties.state; } },
    { name: "receiver-missing with any lease", mutate: (s) => { branch(s, (c) => c.properties?.reason?.properties?.code?.const === "receiver-missing").properties.receiver = true; } },
    { name: "receiver-missing without receiver", mutate: (s) => { branch(s, (c) => c.properties?.reason?.properties?.code?.const === "receiver-missing").required = []; } },
    { name: "binding.chats up to 1000", mutate: (s) => { s.properties.binding.properties.chats.maximum = 1000; } },
    { name: "excluded.liftedAt any string", mutate: (s) => { s.properties.excluded.items.properties.liftedAt = { type: "string" }; } }
  ];
  it.each(MUTANTS)("a fixture kills the mutant: $name", async (mutant) => {
    expect(await killers("operator-channel-status.schema.json", mutant)).not.toEqual([]);
  });
});
