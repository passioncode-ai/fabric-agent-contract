import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { COMMS_TOOLS, HOLD_SCOPES, NEVER_HELD, PRIMARY_CAPABILITY, holdRefuses } from "../src/comms-hold.js";
import { projectRoot } from "../src/contract.js";
import { VECTOR_FILE, buildCommsHoldVectors } from "../tools/vectors/comms-hold.js";

// DEC-0079: the operator's hold on the Project board — the matrix of what a hold refuses (`held`, retryable) and what it
// never refuses, run from the shared vectors a port runs (fixtures/vectors/comms-hold.json).
type Json = Record<string, any>;
const root = projectRoot();
const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");
const vectors = JSON.parse(read("fixtures/vectors/comms-hold.json")) as { tools: string[]; scopes: string[]; cases: Json[] };
const spec = read("docs/specification/project-comms.md");
const common = JSON.parse(read("schemas/comms-common.schema.json")) as Json;
const ALL = { threads: ["thr-held-0001"], projects: ["proj-b"], slots: [{ project: "proj-b", capability: "publish" }] };
const FULL = { thread: "thr-held-0001", project: "proj-b", capability: "publish" };

/** The rows of the markdown table that follows `heading`, as cell arrays. */
function rows(heading: string): string[][] {
  const start = spec.indexOf(heading);
  expect(start, `section ${heading}`).toBeGreaterThanOrEqual(0);
  const lines = spec.slice(start).split("\n");
  const table = lines.slice(lines.findIndex((line) => line.startsWith("|")));
  const body = table.slice(0, table.findIndex((line) => !line.startsWith("|")));
  return body.slice(2).map((row) => row.split("|").slice(1, -1).map((cell) => cell.trim()));
}
const ticked = (cell: string) => [...cell.matchAll(/`([^`]+)`/g)].map((match) => match[1] as string);

describe("the vectors (fixtures/vectors/comms-hold.json)", () => {
  it.each(vectors.cases.map((entry) => [entry.name, entry] as const))("%s", (_name, entry) => {
    expect(holdRefuses(entry.tool, entry.target, entry.holds)).toBe(entry.refused);
  });

  it("are exactly what the generator writes from the decision's matrix (tools/vectors/comms-hold.ts)", () => {
    expect(buildCommsHoldVectors()).toBe(read(VECTOR_FILE));
  });

  it("cover every board tool with no hold, under each scope alone and under all three, each case holding what its name says", () => {
    expect([...vectors.tools].sort()).toEqual([...COMMS_TOOLS].sort());
    expect(vectors.scopes).toEqual(["thread", "project", "slot"]);
    const bySuffix: Array<[string, Json]> = [
      ["no hold", {}],
      ["thread held", { threads: ALL.threads }],
      ["project held", { projects: ALL.projects }],
      ["slot held", { slots: ALL.slots }],
      ["thread, Project and slot all held", ALL]
    ];
    for (const tool of COMMS_TOOLS) {
      const cases = vectors.cases.filter((entry) => entry.tool === tool);
      for (const [suffix, holds] of bySuffix) {
        const matching = cases.filter((entry) => (entry.name as string).endsWith(`, ${suffix}`));
        expect(matching.length, `${tool}: ${suffix}`).toBeGreaterThanOrEqual(1);
        for (const entry of matching) expect(entry.holds, entry.name).toEqual(holds);
      }
    }
  });

  it("never refuse a settling, reporting, renewing, cancelling or reading tool under any hold", () => {
    expect([...NEVER_HELD].sort()).toEqual(["com.cancel", "com.complete", "com.directory", "com.get", "com.list", "com.progress", "com.read_ack", "com.reconcile", "com.renew", "com.status"]);
    for (const tool of NEVER_HELD) {
      const cases = vectors.cases.filter((entry) => entry.tool === tool);
      expect(cases.length, tool).toBeGreaterThanOrEqual(5);
      for (const entry of cases) expect(entry.refused, entry.name).toBe(false);
    }
  });

  it("carry the case a lax port gets wrong: a responder's fenced reply into a held thread", () => {
    const fenced = vectors.cases.filter((entry) => entry.tool === "com.reply" && entry.target.fenced === true && entry.holds.threads?.length);
    expect(fenced.length).toBeGreaterThanOrEqual(2);
    for (const entry of fenced) expect(entry.refused, entry.name).toBe(false);
    expect(holdRefuses("com.reply", { thread: "thr-held-0001" }, ALL)).toBe(true);
  });
});

describe("the matrix (DEC-0079 items 3 and 4)", () => {
  it("refuses new work in each scope the decision names, and no other", () => {
    expect(Object.fromEntries(HOLD_SCOPES)).toEqual({
      "com.submit": ["thread"],
      "com.reply": ["thread"],
      "com.enroll": ["project", "slot"],
      "com.responder_replace": ["project", "slot"],
      "com.claim": ["thread", "project", "slot"],
      "com.accept": ["thread", "project", "slot"],
      "com.effect_begin": ["thread", "project", "slot"]
    });
  });

  it("matches the specification's hold table, row for row", () => {
    const table = rows("### What a hold refuses");
    const refusedBy = new Map<string, string>();
    for (const row of table) for (const tool of ticked(row[0] as string)) refusedBy.set(tool, row[1] as string);
    expect([...refusedBy.keys()].sort()).toEqual([...COMMS_TOOLS].sort());
    for (const tool of COMMS_TOOLS) {
      const cell = refusedBy.get(tool) as string;
      const scopes = HOLD_SCOPES.get(tool) ?? [];
      if (scopes.length === 0) expect(cell, tool).toMatch(/^never/);
      else expect(cell, tool).not.toMatch(/^never/);
      // "held work" is defined as a request whose thread, target Project or target slot is held: all three scopes.
      if (cell.includes("held work")) expect([...scopes].sort(), tool).toEqual(["project", "slot", "thread"]);
      else for (const scope of scopes) expect(cell, `${tool} ${scope}`).toContain(scope === "slot" ? "slot" : scope === "project" ? "Project" : "thread");
    }
  });

  it("lists held as a refusal code of the board", () => {
    expect(common.$defs.refusalCode.enum).toContain("held");
  });

  it("answers malformed input without throwing, and never refuses on it", () => {
    const shapes: unknown[] = [undefined, null, 7, "x", [], ["com.accept"], { constructor: 1 }, { __proto__: { threads: ["thr-held-0001"] } },
      JSON.parse('{"__proto__": {"threads": ["thr-held-0001"]}, "constructor": {"projects": ["proj-b"]}}')];
    for (const shape of shapes) {
      expect(() => holdRefuses(shape, shape, shape)).not.toThrow();
      expect(holdRefuses("com.accept", FULL, shape), String(shape)).toBe(false);
      expect(holdRefuses(shape, FULL, ALL), String(shape)).toBe(false);
      expect(holdRefuses("com.accept", shape, ALL), String(shape)).toBe(false);
    }
    expect(holdRefuses("constructor", FULL, ALL)).toBe(false);
    expect(holdRefuses("__proto__", FULL, ALL)).toBe(false);
    expect(holdRefuses("com.accept", FULL, { threads: "thr-held-0001", projects: 7, slots: [null, "proj-b", { project: "proj-b" }] })).toBe(false);
    expect(holdRefuses("com.accept", { thread: 1, project: ["proj-b"], capability: {} }, ALL)).toBe(false);
  });
});

describe("the primary responder (DEC-0140 PR-1)", () => {
  it("is a capability name the board takes, and no board tool", () => {
    const common = JSON.parse(readFileSync(new URL("../schemas/common.schema.json", import.meta.url), "utf8"));
    expect(PRIMARY_CAPABILITY).toBe("project.work");
    expect(new RegExp(common.$defs.capabilityName.pattern, "u").test(PRIMARY_CAPABILITY)).toBe(true);
    expect(COMMS_TOOLS).not.toContain(PRIMARY_CAPABILITY);
  });
});
