import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { type HourlyDigest, OP_NAME, OP_NAME_MAX, foldDay, foldHour, isRise, opsDigestRules, realDay, wholeHour } from "../src/ops-digest.js";
import { VECTOR_FILE, buildOpsDigestVectors } from "../tools/vectors/ops-digest.js";
import { main as runCli } from "../src/validate-cli.js";

// DEC-0153: ops.digest.hourly@1 and ops.digest.daily@1, FAC-SEM-166 and FAC-SEM-167, the reference folds and vectors.
type Json = Record<string, any>;
const root = projectRoot();
const dir = path.join(root, "fixtures/semantic");
const load = (name: string) => JSON.parse(readFileSync(path.join(dir, name), "utf8")) as Json;
const hourlyOk = () => structuredClone(load("ops-digest-hourly-ok.json").input) as Json;
const dailyOk = () => structuredClone(load("ops-digest-daily-ok.json").input) as Json;
const found = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((f) => `${f.code} ${f.instancePath}`);
const vectors = JSON.parse(readFileSync(path.join(root, VECTOR_FILE), "utf8")) as { hour: Json[]; day: Json[] };
const validator = await createValidator();
const valid = (schema: string, value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}`, value).valid;

describe("FAC-SEM-166 and FAC-SEM-167: the operations digests", () => {
  it.each(readdirSync(dir).filter((name) => name.startsWith("ops-digest-")))("%s yields exactly its expected codes", (name) => {
    const fixture = load(name);
    expect([...new Set(evaluateSemanticRules(fixture.kind, fixture.input).map((f) => f.code))]).toEqual(fixture.expect);
  });

  it("checks the hour's window: whole hours of real days, one hour apart", () => {
    const value = hourlyOk();
    value.from = "2026-11-04T24:00:00Z";
    value.to = "not an hour";
    expect(found("ops-digest-hourly", value)).toEqual(["FAC-SEM-166 /from", "FAC-SEM-166 /to"]);
    value.from = "2026-11-04T18:00:00Z";
    value.to = "2026-11-04T18:00:00.000Z";
    expect(found("ops-digest-hourly", value)).toEqual(["FAC-SEM-166 /to"]);
    value.to = "2026-11-04T19:00:00Z";
    expect(found("ops-digest-hourly", value)).toEqual([]);
  });

  it("checks each total counter against the sum, and skips a sum it cannot read", () => {
    const value = hourlyOk();
    value.total = { ok: 1, failed: 1, unknown: 9 };
    expect(found("ops-digest-hourly", value)).toEqual(["FAC-SEM-166 /total/ok", "FAC-SEM-166 /total/failed", "FAC-SEM-166 /total/unknown"]);
    value.ops.push({ op: 7, ok: 0, failed: 0, unknown: 0 });
    value.ops[0].ok = "three";
    value.total.failed = "x";
    expect(found("ops-digest-hourly", value)).toEqual(["FAC-SEM-166 /total/unknown"]);
    value.ops = "none";
    expect(found("ops-digest-hourly", value)).toEqual(["FAC-SEM-166 /risen/0/op"]);
  });

  it("checks an hour's rise against its own counts and OD-4", () => {
    const value = hourlyOk();
    value.risen = [{ op: "cycle.receipt", failed: 13, previous: 5 }, { op: "cycle.receipt", failed: 12, previous: 5 }, { op: 7 }];
    expect(found("ops-digest-hourly", value)).toEqual(["FAC-SEM-166 /risen/0/failed", "FAC-SEM-166 /risen/1/op"]);
    value.risen = [{ op: "board.tick", failed: 2, previous: 0 }];
    expect(found("ops-digest-hourly", value)).toEqual(["FAC-SEM-166 /risen/0"]);
    value.risen = [{ op: "board.tick", failed: "2", previous: null }];
    expect(found("ops-digest-hourly", value)).toEqual([]);
  });

  it("checks a day's rises against its hours and its counts", () => {
    const value = dailyOk();
    value.risen = [{ op: "x", hours: 2, failed: 43 }];
    expect(found("ops-digest-daily", value)).toEqual(["FAC-SEM-166 /risen/0/failed"]);
    value.risen = [{ op: "y", hours: 1, failed: 10 }];
    expect(found("ops-digest-daily", value)).toEqual(["FAC-SEM-166 /risen/0/failed"]);
    value.risen = [{ op: "x", hours: "two", failed: 42 }];
    value.hours = null;
    expect(found("ops-digest-daily", value)).toEqual([]);
    value.day = 20261104;
    expect(found("ops-digest-daily", value)).toEqual(["FAC-SEM-166 /day"]);
  });

  it("refuses a credential as an operation's name, in ops and in risen", () => {
    const value = dailyOk();
    const key = "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123";
    value.ops.push({ op: key, ok: 0, failed: 10, unknown: 0 });
    value.total.failed = 52;
    value.risen.push({ op: key, hours: 1, failed: 10 });
    expect(found("ops-digest-daily", value)).toEqual(["FAC-SEM-167 /ops/3/op", "FAC-SEM-167 /risen/1/op"]);
  });

  it("is not the rule of any other kind", () => {
    expect(opsDigestRules("support-quality-daily", {})).toBeUndefined();
    expect(found("ops-digest-hourly", {})).toEqual(["FAC-SEM-166 /from", "FAC-SEM-166 /to"]);
  });
});

describe("OD-2: an operation's name", () => {
  it("takes the names a product's log writes and refuses a path, a URL, a space or a home folder", () => {
    for (const op of ["board.tick", "ipc.work:home", "agentSurface.budgetExhausted", "work.sweep-done-review", "retro-after-work", "x", "mcp.tool_call"]) expect(OP_NAME.test(op), op).toBe(true);
    for (const op of ["logs/ops.jsonl", "https://example.com/a", "~/x", "a b", "C:\\x", "Board.tick", "board..tick", ".tick", "tick.", "1st"]) expect(OP_NAME.test(op), op).toBe(false);
    expect(valid("ops-digest-hourly.schema.json", { ...hourlyOk(), ops: [{ op: "a".repeat(OP_NAME_MAX + 1), ok: 0, failed: 0, unknown: 0 }], total: { ok: 0, failed: 0, unknown: 0 }, risen: [] })).toBe(false);
  });
});

describe("the reference folds", () => {
  it.each(vectors.hour.map((c) => [c.name, c] as const))("hour: %s", (_name, c) => {
    const digest = foldHour(c.input.counts, c.input.from, c.input.previous);
    expect(digest).toEqual(c.expected);
    expect(valid("ops-digest-hourly.schema.json", digest)).toBe(true);
    expect(evaluateSemanticRules("ops-digest-hourly", digest)).toEqual([]);
  });
  it.each(vectors.day.map((c) => [c.name, c] as const))("day: %s", (_name, c) => {
    const digest = foldDay(c.input.day, c.input.hourly);
    expect(digest).toEqual(c.expected);
    expect(valid("ops-digest-daily.schema.json", digest)).toBe(true);
    expect(evaluateSemanticRules("ops-digest-daily", digest)).toEqual([]);
  });
  it("refuses an hour that is not whole and skips an hour it cannot read", () => {
    expect(() => foldHour([], "2026-11-04T17:30:00Z", null)).toThrow(/whole UTC hour/);
    const broken = { ...foldHour([], "2026-11-04T01:00:00Z", null), from: "soon" } as unknown as HourlyDigest;
    expect(foldDay("2026-11-04", [broken]).hours).toBe(0);
  });
  it("keeps the committed vector file equal to its generator", () => {
    expect(readFileSync(path.join(root, VECTOR_FILE), "utf8")).toBe(buildOpsDigestVectors());
  });
  it("reads the rise rule and the calendar as OD-4 and OD-1 say", () => {
    expect([isRise(10, 0), isRise(10, 1), isRise(10, 5), isRise(10, 6), isRise(9, 0), isRise(40, 20)]).toEqual([true, true, true, false, false, true]);
    expect([realDay("2024-02-29"), realDay("2026-02-29"), realDay("2026-11-04"), realDay(7)]).toEqual([true, false, true, false]);
    expect(wholeHour("2026-11-04T23:00:00Z")).toBe(Date.parse("2026-11-04T23:00:00Z"));
    expect(wholeHour("2026-11-04T23:00:00.001Z")).toBeNull();
  });
});

describe("pnpm validate reads a digest by its schema member", () => {
  it.each(["positive/ops-digest-hourly.json", "positive/ops-digest-daily.json"])("%s", (file) => {
    const result = runCli([path.join(root, "fixtures", file), "--json"]);
    expect(result.code, result.out).toBe(0);
  });
  it("names a FAC-SEM-166 finding in a digest that breaks it", () => {
    const scratch = mkdtempSync(path.join(tmpdir(), "fac-ops-digest-"));
    try {
      const file = path.join(scratch, "hour.json");
      writeFileSync(file, JSON.stringify(load("ops-digest-hourly-total-not-sum.json").input));
      const result = runCli([file]);
      expect(result.code).toBe(1);
      expect(result.out).toContain("FAC-SEM-166");
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  });
});
