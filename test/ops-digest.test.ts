import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { type HourlyDigest, OP_NAME, OP_NAME_MAX, digestFoldersView, foldDay, foldDir, foldHour, isRise, opsDigestRules, realDay, wholeHour } from "../src/ops-digest.js";
import { EXTENSION_KEYS } from "../src/extensions.js";
import { hasHomePath } from "../src/activity-rules.js";
import { secretValue } from "../src/secret-shape.js";
import { VECTOR_FILE, buildOpsDigestVectors } from "../tools/vectors/ops-digest.js";
import { main as runCli } from "../src/validate-cli.js";

// DEC-0153: ops.digest.hourly@1 and ops.digest.daily@1, FAC-SEM-166 and FAC-SEM-167, the reference folds and vectors;
// extensions/ops-digest/0.1 in a local descriptor and FAC-SEM-168 (OD-9).
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

describe("FAC-SEM-166, FAC-SEM-167 and FAC-SEM-168: the operations digests and where they are", () => {
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

  it("refuses a home folder the slash would let into an operation's name, in ops and in risen", () => {
    const value = hourlyOk();
    const op = "home/jdoe/x";
    expect(OP_NAME.test(op)).toBe(true);
    value.ops.push({ op, ok: 0, failed: 10, unknown: 0 }, { op: "mcp.tools/list", ok: 1, failed: 0, unknown: 0 });
    value.total = { ok: 49, failed: 24, unknown: 1 };
    value.risen.push({ op, failed: 10, previous: 0 });
    expect(found("ops-digest-hourly", value)).toEqual(["FAC-SEM-167 /ops/4/op", "FAC-SEM-167 /risen/1/op"]);
  });

  // The examples OD-2, OD-9, the rule rows and DEC-0153 give of the home-folder detector's boundary: each one documented
  // on the page and answered by hasHomePath as documented, so the text and the detector cannot drift apart.
  const REFUSED = ["api.users/list", "api.get_users/list", "api.my_users/list", "ui.home/open", "users/digests", "my_users/digests", "my-users/digests", "a/~b"];
  const PASSES = ["api.user/list", "api.get_user/list", "user-digests", "a/~1/x"];
  it("refuses every documented example of the home-folder boundary and passes every documented rename (OD-2, OD-9)", () => {
    const page = readFileSync(path.join(root, "docs/specification/ops-digest.md"), "utf8");
    const decision = readFileSync(path.join(root, "docs/DECISIONS.md"), "utf8");
    const dec = decision.slice(decision.indexOf("### DEC-0153:"));
    for (const example of [...REFUSED, ...PASSES]) {
      expect(page, example).toContain(`\`${example}\``);
      expect(dec, example).toContain(`\`${example}\``);
    }
    for (const example of REFUSED) expect(hasHomePath(example), example).toBe(true);
    for (const example of PASSES) expect(hasHomePath(example), example).toBe(false);
    // As an operation's name, where the grammar takes it: FAC-SEM-167 for the refused, nothing for the renames.
    for (const op of [...REFUSED, ...PASSES].filter((name) => OP_NAME.test(name))) {
      const value = hourlyOk();
      value.ops.push({ op, ok: 1, failed: 0, unknown: 0 });
      value.total.ok += 1;
      expect(found("ops-digest-hourly", value), op).toEqual(REFUSED.includes(op) ? ["FAC-SEM-167 /ops/4/op"] : []);
    }
    // As a dir, where the package-path grammar takes it: FAC-SEM-168 for the refused, nothing for the renames.
    const key = EXTENSION_KEYS.opsDigest;
    for (const dir of [...REFUSED, ...PASSES]) {
      const value = { ...structuredClone(load("ops-digest-folders-ok.json").input), extensions: { [key]: [{ dir, source: "app" }] } };
      const view = digestFoldersView(value);
      if (!(view.declared && view.valid)) continue;
      expect(view.usable, dir).toBe(!REFUSED.includes(dir));
    }
  });

  it("keeps the schema's operation name equal to OP_NAME and OP_NAME_MAX, with one copy of the grammar", () => {
    const hourly = JSON.parse(readFileSync(path.join(root, "schemas/ops-digest-hourly.schema.json"), "utf8")) as Json;
    expect(new RegExp(hourly.$defs.op.pattern).source).toBe(OP_NAME.source);
    expect(hourly.$defs.op.maxLength).toBe(OP_NAME_MAX);
    expect(hourly.$defs.opCount.properties.op).toEqual({ $ref: "#/$defs/op" });
    expect(hourly.properties.risen.items.properties.op).toEqual({ $ref: "#/$defs/op" });
  });

  it("is not the rule of any other kind", () => {
    expect(opsDigestRules("support-quality-daily", {})).toBeUndefined();
    expect(found("ops-digest-hourly", {})).toEqual(["FAC-SEM-166 /from", "FAC-SEM-166 /to"]);
  });
});

describe("OD-2: an operation's name", () => {
  it("takes the names a product's log writes and refuses a path, a URL, a space or a home folder", () => {
    for (const op of ["board.tick", "ipc.work:home", "agentSurface.budgetExhausted", "work.sweep-done-review", "retro-after-work", "x", "mcp.tool_call", "mcp.tools/list", "mcp.notifications/initialized"]) expect(OP_NAME.test(op), op).toBe(true);
    for (const op of ["/logs/ops.jsonl", "https://example.com/a", "~/x", "a b", "C:\\x", "Board.tick", "board..tick", ".tick", "tick.", "1st", "a//b", "a/./b", "a/../b", "a/"]) expect(OP_NAME.test(op), op).toBe(false);
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
    if (digest === null) return;
    expect(valid("ops-digest-daily.schema.json", digest)).toBe(true);
    expect(evaluateSemanticRules("ops-digest-daily", digest)).toEqual([]);
  });
  it("throws when a count or a sum is not an integer from 0 to 2^53 - 1", () => {
    const max = Number.MAX_SAFE_INTEGER;
    const H = "2026-11-04T01:00:00Z";
    expect(() => foldHour([{ op: "a", ok: max, failed: 0, unknown: 0 }, { op: "a", ok: 1, failed: 0, unknown: 0 }], H, null)).toThrow(/2\^53/);
    expect(() => foldHour([{ op: "a", ok: max, failed: 0, unknown: 0 }, { op: "b", ok: 1, failed: 0, unknown: 0 }], H, null)).toThrow(/2\^53/);
    expect(() => foldHour([{ op: "a", ok: -1, failed: 0, unknown: 0 }], H, null)).toThrow(/2\^53/);
    const full = foldHour([{ op: "a", ok: max, failed: 0, unknown: 0 }], H, null);
    expect(full.total.ok).toBe(max);
    expect(() => foldDay("2026-11-04", [full, foldHour([{ op: "a", ok: 1, failed: 0, unknown: 0 }], "2026-11-04T02:00:00Z", null)])).toThrow(/2\^53/);
  });
  it("checks each input count before it is merged, and the hour after the last one the schema writes", () => {
    const H = "2026-11-04T01:00:00Z";
    expect(() => foldHour([{ op: "a", ok: -1, failed: 0, unknown: 0 }, { op: "a", ok: 1, failed: 0, unknown: 0 }], H, null)).toThrow(/2\^53/);
    expect(() => foldHour([{ op: "a", ok: 0.5, failed: 0, unknown: 0 }, { op: "a", ok: 0.5, failed: 0, unknown: 0 }], H, null)).toThrow(/2\^53/);
    expect(() => foldHour([{ op: "a", ok: 0, failed: 0, unknown: Number.NaN }], H, null)).toThrow(/2\^53/);
    expect(() => foldHour([], "9999-12-31T23:00:00Z", null)).toThrow(/whole UTC hour the schema writes/);
    expect(foldHour([], "9999-12-31T22:00:00Z", null).to).toBe("9999-12-31T23:00:00.000Z");
  });

  it("bounds ops and risen at 4096 operations, so a product counts the rest under one name of its own (OD-3)", () => {
    const H = "2026-11-04T01:00:00Z";
    const many = (n: number) => Array.from({ length: n }, (_, i) => ({ op: `op.n${String(i).padStart(4, "0")}`, ok: 1, failed: 0, unknown: 0 }));
    expect(valid("ops-digest-hourly.schema.json", foldHour(many(4096), H, null))).toBe(true);
    // A reference fold never writes a line every reader skips: 4097 operations, no hourly digest.
    expect(() => foldHour(many(4097), H, null)).toThrow(/4097 operations, more than 4096: no hourly digest \(OD-3\)/);
    expect(() => foldHour(many(4097), H, null)).toThrow(/4096/);
    const folded = foldHour([...many(4095), { op: "tool.other", ok: 2, failed: 0, unknown: 0 }], "2026-11-04T01:00:00Z", null);
    expect(valid("ops-digest-hourly.schema.json", folded)).toBe(true);
    expect(folded.total.ok).toBe(4097);
  });

  it("writes no hourly digest for an operation's name that fails OD-2's grammar (OD-3)", () => {
    const H = "2026-11-04T01:00:00Z";
    for (const op of ["/logs/ops.jsonl", "Board.tick", "a b", "a".repeat(65), 7 as unknown as string]) {
      expect(() => foldHour([{ op: "board.tick", ok: 1, failed: 0, unknown: 0 }, { op, ok: 1, failed: 0, unknown: 0 }], H, null), String(op)).toThrow(/the operation at 1 fails OD-2's name grammar: no hourly digest \(OD-3\)/);
    }
    expect(foldHour([{ op: "a".repeat(64), ok: 1, failed: 0, unknown: 0 }], H, null).ops).toHaveLength(1);
  });

  it("never copies a credential-shaped or home-folder value into a finding or an error (FAC-SEM-166, FAC-SEM-168)", () => {
    const slack = ["xo", "xb-", "notareal-0123"].join("");
    const home = ["home", "jdoe", "x"].join("/");
    for (const op of [slack, home]) {
      const value = hourlyOk();
      value.ops.push({ op, ok: 0, failed: 10, unknown: 0 }, { op, ok: 0, failed: 10, unknown: 0 });
      value.total.failed += 20;
      value.risen.push({ op, failed: 20, previous: 0 }, { op, failed: 20, previous: 0 });
      const findings = evaluateSemanticRules("ops-digest-hourly", value);
      expect(findings.some((f) => f.code === "FAC-SEM-166" && f.message.includes("this operation is counted once")), op).toBe(true);
      expect(findings.some((f) => f.code === "FAC-SEM-166" && f.message.includes("this operation is named once among the rises")), op).toBe(true);
      for (const f of findings) expect(f.message, op).not.toContain(op);
      const previous = { ...foldHour([], "2026-11-04T00:00:00Z", null), ops: [{ op: "a", ok: 0, failed: 0, unknown: 0 }, { op: "a", ok: 0, failed: 0, unknown: 0 }] } as HourlyDigest;
      expect(() => foldHour([{ op: "a", ok: 1, failed: 0, unknown: 0 }], "2026-11-04T01:00:00Z", previous)).toThrow(/^a is named twice/);
      const secretTwice = { ...previous, ops: [{ op, ok: 0, failed: 0, unknown: 0 }, { op, ok: 0, failed: 0, unknown: 0 }] } as HourlyDigest;
      expect(() => foldHour([], "2026-11-04T01:00:00Z", secretTwice)).toThrow(/^the operation at 1 is named twice/);
      if (op === slack) expect(() => foldHour([{ op, ok: -1, failed: 0, unknown: 0 }], "2026-11-04T01:00:00Z", null)).toThrow(/^the operation at 0 is refused by FAC-SEM-167/);
    }
    const key = EXTENSION_KEYS.opsDigest;
    const descriptor = { ...structuredClone(load("ops-digest-folders-ok.json").input), extensions: { [key]: [{ dir: slack, source: "one" }, { dir: slack, source: "two" }, { dir: "digests", source: slack }, { dir: "other", source: slack }] } };
    const findings = evaluateSemanticRules("service-descriptor", descriptor).filter((f) => f.code === "FAC-SEM-168");
    expect(findings.some((f) => f.message.includes("this dir is named twice as a dir"))).toBe(true);
    expect(findings.some((f) => f.message.includes("this source is named twice as a source"))).toBe(true);
    for (const f of findings) expect(f.message).not.toContain(slack);
    // A dir that collides with a hidden first-seen dir is hidden too, and the other way round.
    const fake = ["Ex4mpleN0tARealKey", "ButShapedLikeOne", "AbCdEf012345"].join("");
    for (const pair of [[fake, fake.toLowerCase()], [fake.toLowerCase(), fake]]) {
      const collide = { ...descriptor, extensions: { [key]: [{ dir: pair[0], source: "one" }, { dir: pair[1], source: "two" }] } };
      const messages = evaluateSemanticRules("service-descriptor", collide).filter((f) => f.code === "FAC-SEM-168").map((f) => f.message);
      expect(messages.some((m) => m.startsWith("this dir is named twice as a dir")), pair[1]).toBe(true);
      for (const m of messages) expect(m.toLowerCase()).not.toContain(fake.toLowerCase());
    }
    expect(found("service-descriptor", { ...descriptor, extensions: { [key]: [{ dir: "digests", source: "app" }, { dir: "Digests", source: "app" }] } }).length).toBe(2);
    expect(evaluateSemanticRules("service-descriptor", { ...descriptor, extensions: { [key]: [{ dir: "digests", source: "app" }, { dir: "Digests", source: "app" }] } }).map((f) => f.message).join(" ")).toContain("\"Digests\" is named twice as a dir");
  });

  it("applies OD-2 in full: a name FAC-SEM-167 refuses makes no hourly and no daily digest, and is never echoed", () => {
    const slack = ["xo", "xb-", "notareal-0123"].join("");
    const H = "2026-11-04T01:00:00Z";
    for (const op of ["ui.home/open", "queue.task-assigned-to-worker", slack]) {
      expect(OP_NAME.test(op), op).toBe(true);
      let message = "";
      try { foldHour([{ op: "board.tick", ok: 1, failed: 0, unknown: 0 }, { op, ok: 0, failed: 12, unknown: 0 }], H, null); } catch (e) { message = (e as Error).message; }
      expect(message, op).toBe("the operation at 1 is refused by FAC-SEM-167: no hourly digest (OD-3)");
      // A digest written elsewhere with that name: the day refuses it in ops and in risen.
      const hour = { schema: "ops.digest.hourly@1", from: "2026-11-04T01:00:00.000Z", to: "2026-11-04T02:00:00.000Z", ops: [{ op, ok: 0, failed: 12, unknown: 0 }], total: { ok: 0, failed: 12, unknown: 0 }, risen: [{ op, failed: 12, previous: 0 }] } as HourlyDigest;
      for (const input of [hour, { ...hour, ops: [{ op: "board.tick", ok: 0, failed: 12, unknown: 0 }] } as HourlyDigest]) {
        let daily = "";
        try { foldDay("2026-11-04", [input]); } catch (e) { daily = (e as Error).message; }
        expect(daily, op).toMatch(/^the operation at 0 of 2026-11-04T01:00:00.000Z's (ops|risen) is refused by FAC-SEM-167: no daily digest \(OD-3\)$/);
        expect(daily).not.toContain(op);
      }
    }
  });

  it("applies OD-2's grammar to every name a day folds, in ops and in risen, naming the place only", () => {
    for (const op of ["Bad Name", "a".repeat(70)]) {
      const hour = { schema: "ops.digest.hourly@1", from: "2026-11-04T01:00:00.000Z", to: "2026-11-04T02:00:00.000Z", ops: [{ op, ok: 0, failed: 12, unknown: 0 }], total: { ok: 0, failed: 12, unknown: 0 }, risen: [{ op, failed: 12, previous: 0 }] } as HourlyDigest;
      for (const input of [hour, { ...hour, ops: [{ op: "board.tick", ok: 0, failed: 12, unknown: 0 }] } as HourlyDigest]) {
        let daily = "";
        try { foldDay("2026-11-04", [input]); } catch (e) { daily = (e as Error).message; }
        expect(daily, op).toMatch(/^the operation at 0 of 2026-11-04T01:00:00.000Z's (ops|risen) fails OD-2's name grammar: no daily digest \(OD-3\)$/);
      }
    }
  });

  it("pins the shared detector's shapes the page states: sk- inside a word ending in sk (until DEC-0151), the JWT, akia", () => {
    const jwt = (a: string, b: string) => ["a.", "ey", "J", a, ".", b, ".c"].join("");
    const akia = ["ops.", "ak", "ia", "abcdefghijklmnop"].join("");
    for (const [op, refused] of [
      ["ops.risk-assessment-completed", true], ["work.session-end-task-back", false],
      [jwt("a", "bb"), false], [jwt("ab", "b"), false], [jwt("ab", "bb"), true], [akia, true]
    ] as const) {
      const value = hourlyOk();
      value.ops.push({ op, ok: 1, failed: 0, unknown: 0 });
      value.total.ok += 1;
      expect(found("ops-digest-hourly", value), op).toEqual(refused ? ["FAC-SEM-167 /ops/4/op"] : []);
    }
  });

  it("never echoes a credential-shaped or home-folder from", () => {
    for (const from of [["home", "jdoe", "x"].join("/"), ["xo", "xb-", "notareal-0123"].join("")]) {
      let message = "";
      try { foldHour([], from, null); } catch (e) { message = (e as Error).message; }
      expect(message).toBe("from is not a whole UTC hour");
    }
    expect(() => foldHour([], "soon", null)).toThrow(/^soon is not a whole UTC hour/);
  });

  it("throws when a previous digest's failures give a rise a previous that is no count", () => {
    const H = "2026-11-04T02:00:00Z";
    for (const failed of [-40, 2.5, Number.NaN, 1e300]) {
      const previous = { ...foldHour([], "2026-11-04T01:00:00Z", null), ops: [{ op: "x", ok: 0, failed, unknown: 0 }] } as HourlyDigest;
      expect(() => foldHour([{ op: "x", ok: 0, failed: 12, unknown: 0 }], H, previous), String(failed)).toThrow(/2\^53/);
    }
    const clean = foldHour([{ op: "x", ok: 0, failed: 5, unknown: 0 }], "2026-11-04T01:00:00Z", null);
    expect(foldHour([{ op: "x", ok: 0, failed: 12, unknown: 0 }], H, clean).risen).toEqual([{ op: "x", failed: 12, previous: 5 }]);
    // An unmatched previous operation is not read, so its count does not matter.
    const other = { ...clean, ops: [{ op: "y", ok: 0, failed: Number.NaN, unknown: 0 }] } as HourlyDigest;
    expect(foldHour([{ op: "x", ok: 0, failed: 12, unknown: 0 }], H, other).risen).toEqual([{ op: "x", failed: 12, previous: 0 }]);
  });

  it("checks each hourly digest's counts before the day folds them", () => {
    const a = foldHour([{ op: "x", ok: 5, failed: 0, unknown: 0 }], "2026-11-04T01:00:00Z", null);
    const b = foldHour([{ op: "x", ok: 5, failed: 0, unknown: 0 }], "2026-11-04T02:00:00Z", null);
    const negative = { ...a, ops: [{ op: "x", ok: -5, failed: 0, unknown: 0 }] } as HourlyDigest;
    expect(() => foldDay("2026-11-04", [negative, b])).toThrow(/2\^53/);
    expect(foldDay("2026-11-04", [a, b])?.total.ok).toBe(10);
  });

  it("refuses fold inputs FAC-SEM-166 refuses: an operation twice in the previous hour's ops or in one hour's risen", () => {
    const one = foldHour([{ op: "x", ok: 0, failed: 5, unknown: 0 }], "2026-11-04T01:00:00Z", null);
    const twice = { ...one, ops: [...one.ops, ...one.ops] } as HourlyDigest;
    expect(() => foldHour([{ op: "x", ok: 0, failed: 12, unknown: 0 }], "2026-11-04T02:00:00Z", twice)).toThrow(/x is named twice in the previous hour's ops/);
    // A previous digest that is not the hour just before is not read.
    expect(foldHour([{ op: "x", ok: 0, failed: 12, unknown: 0 }], "2026-11-04T05:00:00Z", twice).risen).toEqual([{ op: "x", failed: 12, previous: 0 }]);
    const rose = foldHour([{ op: "x", ok: 0, failed: 12, unknown: 0 }], "2026-11-04T01:00:00Z", null);
    const risenTwice = { ...rose, risen: [...rose.risen, ...rose.risen] } as HourlyDigest;
    expect(() => foldDay("2026-11-04", [risenTwice])).toThrow(/x is named twice in the risen of 2026-11-04T01:00:00.000Z/);
  });

  it("writes no daily digest for a day of more than 4096 operations (OD-3)", () => {
    const many = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => ({ op: `${prefix}.n${String(i).padStart(4, "0")}`, ok: 1, failed: 0, unknown: 0 }));
    const a = foldHour(many("a", 4096), "2026-11-04T01:00:00Z", null);
    const b = foldHour(many("b", 4096), "2026-11-04T02:00:00Z", null);
    expect(valid("ops-digest-hourly.schema.json", a)).toBe(true);
    expect(() => foldDay("2026-11-04", [a, b])).toThrow(/8192 operations, more than 4096: no daily digest/);
    const same = foldHour(many("a", 4096), "2026-11-04T02:00:00Z", null);
    const day = foldDay("2026-11-04", [a, same]);
    expect(day?.ops).toHaveLength(4096);
    expect(valid("ops-digest-daily.schema.json", day)).toBe(true);
  });

  it("checks each hour's rises before the day sums them, and refuses a rise its hour does not count", () => {
    const hour = (from: string, failed: number) => ({ ...foldHour([{ op: "x", ok: 0, failed: 30, unknown: 0 }], from, null), risen: [{ op: "x", failed, previous: 0 }] }) as HourlyDigest;
    for (const [one, two] of [[-5, 30], [2.5, 7.5], [Number.NaN, 30]] as Array<[number, number]>) {
      expect(() => foldDay("2026-11-04", [hour("2026-11-04T01:00:00Z", one), hour("2026-11-04T02:00:00Z", two)]), `${one} ${two}`).toThrow(/rise of x in 2026-11-04T0\d:00:00.000Z/);
    }
    const stray = { ...hour("2026-11-04T01:00:00Z", 30), risen: [{ op: "y", failed: 30, previous: 0 }] } as HourlyDigest;
    expect(() => foldDay("2026-11-04", [stray])).toThrow(/y rose in 2026-11-04T01:00:00.000Z but that hour's ops does not count it/);
    expect(foldDay("2026-11-04", [hour("2026-11-04T01:00:00Z", 30), hour("2026-11-04T02:00:00Z", 30)])?.risen).toEqual([{ op: "x", hours: 2, failed: 60 }]);
  });
  it("refuses an hour that is not whole and skips an hour it cannot read", () => {
    expect(() => foldHour([], "2026-11-04T17:30:00Z", null)).toThrow(/whole UTC hour/);
    const broken = { ...foldHour([], "2026-11-04T01:00:00Z", null), from: "soon" } as unknown as HourlyDigest;
    expect(foldDay("2026-11-04", [broken])).toBeNull();
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

describe("FAC-SEM-168: where a collector reads the daily digests (OD-9)", () => {
  const key = EXTENSION_KEYS.opsDigest;
  const at = `/extensions/${key.replace(/~/g, "~0").replace(/\//g, "~1")}`;
  const descriptor = () => structuredClone(load("ops-digest-folders-ok.json").input) as Json;
  const withFolders = (folders: unknown, placement?: string): Json => ({ ...descriptor(), ...(placement ? { placement } : {}), extensions: { [key]: folders } });
  // A long mixed-case run that secretValue reads as a credential, as test/descriptor-rules.test.ts builds one.
  const fake = ["Ex4mpleN0tARealKey", "ButShapedLikeOne", "AbCdEf012345"].join("");

  it("spells the key once, under the contract's host and path", () => {
    expect(key).toBe("https://fabric.passioncode.ai/agent-contract/extensions/ops-digest/0.1");
  });

  it("reads a declaration, an invalid one and none", () => {
    for (const none of [null, "x", { extensions: [] }, { extensions: {} }, { extensions: { [`${key}x`]: [] } }]) expect(digestFoldersView(none)).toEqual({ declared: false });
    expect(digestFoldersView(descriptor())).toEqual({ declared: true, valid: true, usable: true, folders: descriptor().extensions[key] });
    expect(digestFoldersView({ extensions: { [key]: {} } })).toEqual({ declared: true, valid: false, usable: false, errors: ["/ type"] });
    expect(digestFoldersView({ extensions: { [key]: [{ dir: "../x", source: "app" }] } })).toEqual({ declared: true, valid: false, usable: false, errors: ["/0/dir pattern"] });
  });

  it("never answers usable for a declaration FAC-SEM-168 refuses", () => {
    for (const name of ["ops-digest-folders-home-dir.json", "ops-digest-folders-source-twice.json", "ops-digest-folders-dir-twice.json", "ops-digest-folders-remote.json"]) {
      const view = digestFoldersView(load(name).input);
      expect(view, name).toMatchObject({ declared: true, valid: true, usable: false });
    }
  });

  it("refuses the key on a remote placement or with no data folder, beside an invalid value too", () => {
    expect(found("service-descriptor", withFolders([{ dir: "digests", source: "app" }], "local"))).toEqual([]);
    expect(found("service-descriptor", withFolders([{ dir: "digests", source: "app" }], "remote")).filter((f) => f.startsWith("FAC-SEM-168"))).toEqual([`FAC-SEM-168 ${at}`]);
    expect(found("service-descriptor", withFolders([], "remote")).filter((f) => f.startsWith("FAC-SEM-168"))).toEqual([`FAC-SEM-168 ${at}`, `FAC-SEM-168 ${at}`]);
    expect(found("service-descriptor", withFolders("digests"))).toEqual([`FAC-SEM-168 ${at}`]);
    const { paths: _paths, ...pathless } = withFolders([{ dir: "digests", source: "app" }]);
    expect(found("service-descriptor", pathless)).toEqual([`FAC-SEM-168 ${at}`]);
    expect(found("service-descriptor", { ...pathless, paths: { data: 7, logs: [] } }).filter((f) => f.startsWith("FAC-SEM-168"))).toEqual([`FAC-SEM-168 ${at}`]);
  });

  it("names each source and each dir once and refuses a dir holding a home folder, and a dir or source shaped like a credential", () => {
    // A Slack-shaped label, lower case so the source grammar takes it, built from pieces; secretValue finds it before
    // and after DEC-0151 narrows the sk- shape.
    const slack = ["xo", "xb-", "notareal-0123"].join("");
    const value = withFolders([
      { dir: "digests", source: "app" },
      { dir: "workers/digests", source: "app" },
      { dir: "Users/jdoe/digests", source: "home" },
      { dir: fake, source: "secret" },
      { dir: `Users/jdoe/${fake}`, source: "both" },
      { dir: "other", source: slack },
      { dir: "Workers/Digests", source: "again" },
      { dir: "users/digests", source: "users" }
    ]);
    expect(found("service-descriptor", value)).toEqual([
      `FAC-SEM-168 ${at}/1/source`,
      `FAC-SEM-168 ${at}/2/dir`,
      `FAC-SEM-168 ${at}/3/dir`,
      `FAC-SEM-168 ${at}/4/dir`,
      `FAC-SEM-168 ${at}/5/source`,
      `FAC-SEM-168 ${at}/6/dir`,
      `FAC-SEM-168 ${at}/7/dir`
    ]);
    expect(found("service-descriptor", withFolders([{ dir: "user-digests", source: "app" }]))).toEqual([]);
    expect(evaluateSemanticRules("service-descriptor", value).find((f) => f.instancePath === `${at}/4/dir`)?.message).toContain("credential");
  });

  it("compares dirs under canonical caseless matching (the code points HFS+ ignores removed, NFD, lower, upper and lower case, NFC, Georgian Nuskhuri onto Mkhedruli), trailing dots and spaces dropped", () => {
    const pairs: Array<[string, string]> = [["Straße", "STRASSE"], ["Stra\u1e9ee", "Straße"], ["σασ", "ΣΑΣ"], ["café", "café"], ["digests.", "digests"], ["digests ", "digests"], ["a/Digests./b", "A/digests/B"], ["\u1fbc\u0342", "\u1fb7"], ["\u0131", "i"], ["\u0131", "I"], ["dig\u200cests", "digests"], ["digests\ufeff", "digests"], ["a/\u202adigests", "a/digests"], ["\u10a0\u10c5", "\u10d0\u10f5"], ["\u2d00", "\u10d0"]];
    for (const [a, b] of pairs) {
      expect(foldDir(a), `${a} ${b}`).toBe(foldDir(b));
      expect(found("service-descriptor", withFolders([{ dir: a, source: "one" }, { dir: b, source: "two" }])), `${a} ${b}`).toEqual([`FAC-SEM-168 ${at}/1/dir`]);
    }
    expect(foldDir("digests/a")).not.toBe(foldDir("digests/b"));
    expect(found("service-descriptor", withFolders([{ dir: "digests", source: "one" }, { dir: "digests/more", source: "two" }]))).toEqual([]);
  });

  it("hints that a bare declaration checks its shape only, refused dir or not (FAC-SEM-168 runs inside a descriptor)", () => {
    const scratch = mkdtempSync(path.join(tmpdir(), "fac-ops-digest-"));
    try {
      for (const [name, value] of [["ok.json", [{ dir: "digests", source: "app" }]], ["refused.json", [{ dir: "users/digests", source: "app" }]]] as const) {
        const file = path.join(scratch, name);
        writeFileSync(file, JSON.stringify(value));
        const result = runCli([file, "--schema", "service-ops-digest-extension.schema.json"]);
        expect(result.code, name).toBe(0);
        expect(result.out, name).toContain("hint/declaration-only");
        expect(result.out, name).toContain("FAC-SEM-168 runs only on the declaration inside a service descriptor's extensions (the placement and paths.data, a source or a dir named twice, a dir with a segment of only dots, spaces or ignorable code points, a dir holding a lone surrogate, a home folder in a dir, a dir or source shaped like a credential); check the descriptor to run it");
        const json = JSON.parse(runCli([file, "--schema", "service-ops-digest-extension.schema.json", "--json"]).out) as { notes?: Array<{ rule: string; help: string }>; problems: Array<{ rule: string; help: string }> };
        const hint = [...(json.notes ?? []), ...json.problems].find((note) => note.rule === "hint/declaration-only");
        expect(hint?.help, name).toBe("docs/specification/ops-digest.md#where-a-collector-reads-the-daily-digests");
      }
      // DEC-0150 is on main: on the merged tree its bare declaration prints its own page's link (DEC-0150 asserts the same),
      // each readerHints line carrying its link as the Hint's fourth element.
      const channel = path.join(root, "schemas/service-channel-agent-extension.schema.json");
      const sample = path.join(root, "fixtures/positive/service-channel-agent-extension.json");
      if (existsSync(channel) && existsSync(sample)) {
        const json = JSON.parse(runCli([sample, "--schema", "service-channel-agent-extension.schema.json", "--json"]).out) as { notes?: Array<{ rule: string; help: string }> };
        expect(json.notes?.find((note) => note.rule === "hint/declaration-only")?.help).toBe("docs/specification/channel-agent.md#what-is-checked");
      }
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  });

  // Parity with DEC-0149's fold until the merged tree makes foldDir call its foldPath (one implementation): its
  // FOLD_PAIRS (fixtures/vectors/source-tree.json on its branch at d4cc1e16, Unicode 17.0), copied as written, and the
  // HFS+ samples its next step adds (U+200C, U+FEFF, U+202A removed; Asomtavruli, Nuskhuri and Mkhedruli joined).
  const DEC_0149_FOLD_PAIRS: Array<[string, string]> = [
    ["PA\u1e9eWORDS", "passwords"], ["pa\u00dfwords", "passwords"], ["PASSWORDS", "passwords"], ["\u017fecrets", "secrets"],
    ["\u212aeys", "keys"], ["\u212b", "\u00e5"], ["\u00c5", "\u00e5"], ["\u03a3x", "\u03c3x"], ["\u03c2x", "\u03c3x"],
    ["x\u03a3", "x\u03c2"], ["\u0130d", "i\u0307d"], ["\u0131d", "id"], ["\ufb00ile", "ffile"], ["cafe\u0301", "caf\u00e9"],
    ["CAF\u00c9", "caf\u00e9"], ["pri\u200cvate", "private"], ["private. .", "private"], ["PRIVAT~1.MD", "privat~1.md"],
    ["\u1fbc\u0342", "\u1fb6\u03b9"], ["\u1fb7", "\u1fb6\u03b9"], ["\u0391\u0342\u0345", "\u1fb6\u03b9"],
    ["\u1fcc\u0342", "\u1fc6\u03b9"], ["\u1fc7", "\u1fc6\u03b9"], ["\u1ffc\u0342", "\u1ff6\u03b9"], ["\u1ff7", "\u1ff6\u03b9"],
    ["cafe\u200c\u0301", "caf\u00e9"],
    ["x\ufeff", "x"], ["\u202ax", "x"], ["\u10a0", "\u10d0"], ["\u2d00", "\u10d0"], ["\u10d0", "\u10d0"]
  ];
  it.each(DEC_0149_FOLD_PAIRS)("folds %j as DEC-0149's fold does", (input, folded) => {
    expect(foldDir(input)).toBe(folded);
  });

  it("hides a whole collision class when any of its dirs is hidden, in every order", () => {
    const fake = ["Ex4mpleN0tARealKey", "ButShapedLikeOne", "AbCdEf012345"].join("");
    const home = ["home", "jdoe"].join("/");
    const permutations = <T,>(items: T[]): T[][] => (items.length <= 1 ? [items] : items.flatMap((item, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest])));
    for (const [members, hiddenValue] of [[[fake.toLowerCase(), fake, fake.toUpperCase()], fake], [[home.toUpperCase(), home, "Home/jdoe"], home]] as const) {
      for (const order of permutations([...members])) {
        const value = withFolders(order.map((dir, i) => ({ dir, source: `s${i}` })));
        const messages = evaluateSemanticRules("service-descriptor", value).filter((f) => f.code === "FAC-SEM-168").map((f) => f.message);
        expect(messages.filter((m) => m.startsWith("this dir is named twice as a dir")), order.join(" ")).toHaveLength(2);
        for (const m of messages) expect(m.toLowerCase(), order.join(" ")).not.toContain(hiddenValue.toLowerCase());
      }
    }
  });

  it("reads a dir also with the code points HFS+ ignores removed, for its findings and for hiding a class", () => {
    const run = ["Ex4mpleN0tARealKey", "ButShapedLike", "\u200c", "OneAbCdEf012345"].join("");
    const bare = run.replace("\u200c", "");
    const twice = evaluateSemanticRules("service-descriptor", withFolders([{ dir: run, source: "one" }, { dir: run, source: "two" }])).filter((f) => f.code === "FAC-SEM-168");
    expect(twice.some((f) => f.message.startsWith("this dir is named twice as a dir"))).toBe(true);
    for (const f of twice) {
      expect(f.message).not.toContain(bare);
      expect(f.message).not.toContain(run);
    }
    expect(found("service-descriptor", withFolders([{ dir: run, source: "app" }]))).toEqual([`FAC-SEM-168 ${at}/0/dir`]);
    // The bearer shape as the detector reads it: bearer in either case, whitespace and one more character (a dir, since an
    // operation's name holds no whitespace).
    expect(found("service-descriptor", withFolders([{ dir: ["bear", "er x"].join(""), source: "app" }]))).toEqual([`FAC-SEM-168 ${at}/0/dir`]);
    expect(found("service-descriptor", withFolders([{ dir: ["Bear", "er "].join(""), source: "app" }]))).toEqual([]);
    // "One more character other than a line break": a space after the whitespace is one, a line break is not.
    expect(found("service-descriptor", withFolders([{ dir: ["bearer ", " "].join(""), source: "app" }]))).toEqual([`FAC-SEM-168 ${at}/0/dir`]);
    expect(secretValue(["bearer ", "\n"].join(""))).toBe(false);
    const home = ["us", "\u200c", "ers/jdoe/digests"].join("");
    expect(found("service-descriptor", withFolders([{ dir: home, source: "app" }]))).toEqual([`FAC-SEM-168 ${at}/0/dir`]);
  });

  it("refuses a dir segment made only of dots, spaces and code points HFS+ ignores, naming the place only", () => {
    for (const dir of [[".", "\u200c", "."].join(""), ". ", ["..", "\u200d"].join(""), ["a/", ".", "\u200c", ".", "/b"].join("")]) {
      const findings = evaluateSemanticRules("service-descriptor", withFolders([{ dir, source: "app" }])).filter((f) => f.code === "FAC-SEM-168");
      expect(findings.map((f) => f.instancePath), JSON.stringify(dir)).toEqual([`${at}/0/dir`]);
      expect(findings[0]?.message).toBe("a dir segment is empty once its dots, spaces and code points a file system may ignore are dropped; a tool may read it as empty, '.' or '..', another folder than the one declared, possibly outside paths.data");
    }
    expect(found("service-descriptor", withFolders([{ dir: "a.", source: "app" }]))).toEqual([]);
  });

  it("refuses a dir segment empty once every default-ignorable code point and trailing dots and spaces are dropped", () => {
    for (const dir of [["..", "\u2060"].join(""), ["a/..", "\u200b", "/b"].join(""), "\u2060", ["x/", "\u2060", "/y"].join("")]) {
      const findings = evaluateSemanticRules("service-descriptor", withFolders([{ dir, source: "app" }])).filter((f) => f.code === "FAC-SEM-168");
      expect(findings.map((f) => f.instancePath), JSON.stringify(dir)).toEqual([`${at}/0/dir`]);
      expect(digestFoldersView(withFolders([{ dir, source: "app" }])).declared && (digestFoldersView(withFolders([{ dir, source: "app" }])) as { usable: boolean }).usable).toBe(false);
    }
    // A segment with something left after the drop stays lawful.
    expect(found("service-descriptor", withFolders([{ dir: ["a", "\u2060", "."].join(""), source: "app" }]))).toEqual([]);
  });

  it("refuses a dir holding a lone surrogate, which no file system can name", () => {
    for (const dir of [["a", "\ud800"].join(""), ["\udc00", "/b"].join("")]) {
      expect((dir as unknown as { isWellFormed(): boolean }).isWellFormed()).toBe(false);
      const messages = evaluateSemanticRules("service-descriptor", withFolders([{ dir, source: "app" }])).filter((f) => f.code === "FAC-SEM-168").map((f) => f.message);
      expect(messages, JSON.stringify(dir)).toContain("a dir holds a lone surrogate, which no file system can name; write it as well-formed Unicode");
      expect(digestFoldersView(withFolders([{ dir, source: "app" }]))).toMatchObject({ usable: false });
    }
    const pair = ["a", "\ud83d\ude00"].join("");
    expect((pair as unknown as { isWellFormed(): boolean }).isWellFormed()).toBe(true);
    expect(found("service-descriptor", withFolders([{ dir: pair, source: "app" }]))).toEqual([]);
  });

  it("refuses a dir that only the long run makes a key, with its alphabet, the reason and the remedy", () => {
    const dir = ["Application", "+Support", "/MyProduct", "/Digests2026x"].join("");
    const view = digestFoldersView(withFolders([{ dir, source: "app" }]));
    expect(view).toMatchObject({ declared: true, valid: true, usable: false });
    const messages = evaluateSemanticRules("service-descriptor", withFolders([{ dir, source: "app" }])).filter((f) => f.code === "FAC-SEM-168").map((f) => f.message);
    expect(messages).toEqual(["a dir is shaped like a credential: a run of 40 or more letters, digits, +, /, =, _ or - (across segments too) that mixes upper case, lower case and a digit reads as a key; a space or a dot inside a segment (not at its end) breaks it. It names a folder, never a value"]);
    // A dot or a space breaks the run.
    for (const broken of [["Application", ".Support", "/MyProduct", "/Digests2026x"].join(""), ["Application", " Support", "/MyProduct", "/Digests2026x"].join("")]) {
      expect(found("service-descriptor", withFolders([{ dir: broken, source: "app" }])), broken).toEqual([]);
    }
    // A dot at a segment's end does not break it: the trimmed reading drops it, and the long-run message stays.
    const trailing = ["ApplicationSupport", "./MyProduct", "/Digests2026"].join("");
    expect(evaluateSemanticRules("service-descriptor", withFolders([{ dir: trailing, source: "app" }])).filter((f) => f.code === "FAC-SEM-168").map((f) => f.message)).toEqual(messages);
    // A provider key keeps the short message.
    const key2 = ["gh", "p_", "ABCDEFGHIJKLMNOPQRSTUV"].join("");
    expect(evaluateSemanticRules("service-descriptor", withFolders([{ dir: key2, source: "app" }])).filter((f) => f.code === "FAC-SEM-168").map((f) => f.message)).toEqual(["a dir is shaped like a credential; it names a folder, never a value"]);
  });

  it("names a duplicate dir only when it is printable ASCII", () => {
    for (const code of [0x2066, 0x2067, 0x2068, 0x2069, 0x061c, 0x0085, 0x009b, 0x007f]) {
      const mark = String.fromCodePoint(code);
      const findings = evaluateSemanticRules("service-descriptor", withFolders([{ dir: `a${mark}digests`, source: "one" }, { dir: `A${mark}DIGESTS`, source: "two" }])).filter((f) => f.code === "FAC-SEM-168");
      for (const f of findings) expect(f.message, code.toString(16)).not.toContain(mark);
      if (findings.some((f) => f.message.includes("named twice"))) expect(findings.some((f) => f.message.startsWith("this dir is named twice")), code.toString(16)).toBe(true);
    }
    expect(evaluateSemanticRules("service-descriptor", withFolders([{ dir: "digests", source: "one" }, { dir: "Digests", source: "two" }])).map((f) => f.message).join(" ")).toContain("\"Digests\" is named twice as a dir");
  });

  it("never prints a dir holding a code point HFS+ ignores in a duplicate message", () => {
    const rlo = "\u202e";
    const findings = evaluateSemanticRules("service-descriptor", withFolders([{ dir: `a${rlo}digests`, source: "one" }, { dir: `A${rlo}DIGESTS`, source: "two" }])).filter((f) => f.code === "FAC-SEM-168");
    expect(findings.map((f) => f.message.slice(0, 31))).toEqual(["this dir is named twice as a di"]);
    for (const f of findings) expect(f.message).not.toContain(rlo);
  });

  it("reads a dir with each segment's trailing dots and spaces dropped for the home-folder test, and quotes a named dir", () => {
    for (const dir of ["users./alice", "Users /Alice"]) expect(found("service-descriptor", withFolders([{ dir, source: "app" }])), dir).toEqual([`FAC-SEM-168 ${at}/0/dir`]);
    const messages = evaluateSemanticRules("service-descriptor", withFolders([{ dir: "digests", source: "one" }, { dir: "Digests ", source: "two" }])).map((f) => f.message);
    expect(messages.join(" ")).toContain('"Digests " is named twice as a dir');
  });

  it("never prints an operation's name that OD-2's grammar refuses or that is not printable ASCII (FAC-SEM-166)", () => {
    for (const code of [0x001b, 0x202e, 0x0085]) {
      const mark = String.fromCodePoint(code);
      const op = `x${mark}y`;
      const hourly = { schema: "ops.digest.hourly@1", from: "2026-11-04T01:00:00.000Z", to: "2026-11-04T02:00:00.000Z", ops: [{ op, ok: 0, failed: 12, unknown: 0 }, { op, ok: 0, failed: 12, unknown: 0 }], total: { ok: 0, failed: 24, unknown: 0 }, risen: [{ op, failed: 13, previous: 0 }, { op, failed: 13, previous: 0 }, { op: `z${mark}`, failed: 12, previous: 0 }] };
      const daily = { schema: "ops.digest.daily@1", day: "2026-11-04", hours: 1, ops: [{ op, ok: 0, failed: 12, unknown: 0 }, { op, ok: 0, failed: 12, unknown: 0 }], total: { ok: 0, failed: 24, unknown: 0 }, risen: [{ op, hours: 2, failed: 30 }, { op, hours: 1, failed: 5 }] };
      const findings = [...evaluateSemanticRules("ops-digest-hourly", hourly), ...evaluateSemanticRules("ops-digest-daily", daily)].filter((f) => f.code === "FAC-SEM-166");
      expect(findings.length, code.toString(16)).toBeGreaterThan(5);
      for (const f of findings) expect(f.message, code.toString(16)).not.toContain(mark);
    }
    let message = "";
    try { foldHour([], "\u001b", null); } catch (e) { message = (e as Error).message; }
    expect(message).toBe("from is not a whole UTC hour");
  });

  it("reads a dir four ways for its detectors, default-ignorables removed, and hides a class its fold makes a home folder", () => {
    const refused = (dir: string) => expect(found("service-descriptor", withFolders([{ dir, source: "app" }])), JSON.stringify(dir)).toEqual([`FAC-SEM-168 ${at}/0/dir`]);
    refused(["x", "\u200e", "users./alice"].join(""));
    refused(["users", "\u2060", "/alice"].join(""));
    for (const mark of ["\u200b", "\u2060"]) refused(["gh", "p_", "ABCDEFGHIJ", mark, "KLMNOPQRSTUV"].join(""));
    // A credential reached only through the trimmed reading: a 40-character mixed run once the segment's dot is dropped.
    const run = ["Ex4mpleN0tARealKey", ".", "/ButShapedLikeOneAbCdEf012345"].join("");
    refused(run);
    // A 40-character run across segments joined by '/' is refused on purpose (LONG_RUN includes '/').
    refused(["ApplicationSupport", "/MyProduct", "/Digests2026"].join(""));
    // A hidden class reached only through the trimmed reading, and one reached only through the fold.
    for (const pair of [[run, run.toLowerCase()], ["USERS/alice", "USERS/Alice"]]) {
      const messages = evaluateSemanticRules("service-descriptor", withFolders([{ dir: pair[0], source: "one" }, { dir: pair[1], source: "two" }])).filter((f) => f.code === "FAC-SEM-168").map((f) => f.message);
      expect(messages.some((m) => m.startsWith("this dir is named twice as a dir")), pair[1]).toBe(true);
    }
    expect(found("service-descriptor", withFolders([{ dir: "USERS/alice", source: "app" }]))).toEqual([]);
  });

  it("passes a dir of 256 precomposed code points that NFD doubles (not decided: the page's 'Not decided here')", () => {
    const dir = "\u00e4".repeat(256);
    expect(dir.normalize("NFD").length).toBe(512);
    expect(found("service-descriptor", withFolders([{ dir, source: "app" }]))).toEqual([]);
  });

  it("names a non-string from and a null item in a fold's input with a worded error, never a TypeError", () => {
    expect(() => foldHour([], 7 as unknown as string, null)).toThrow(/^from is not a whole UTC hour$/);
    expect(() => foldHour([null as unknown as HourlyDigest["ops"][number]], "2026-11-04T01:00:00Z", null)).toThrow(/^the item at 0 of counts is not an object$/);
    const one = foldHour([{ op: "x", ok: 0, failed: 5, unknown: 0 }], "2026-11-04T01:00:00Z", null);
    expect(() => foldHour([], "2026-11-04T02:00:00Z", { ...one, ops: [null as unknown as HourlyDigest["ops"][number]] })).toThrow(/^the item at 0 of the previous hour's ops is not an object$/);
    expect(() => foldDay("2026-11-04", [null as unknown as HourlyDigest])).toThrow(/^the item at 0 of hourly is not an object$/);
    expect(() => foldDay("2026-11-04", [{ ...one, ops: [null as unknown as HourlyDigest["ops"][number]] }])).toThrow(/^the item at 0 of 2026-11-04T01:00:00.000Z's ops is not an object$/);
    expect(() => foldDay("2026-11-04", [{ ...one, risen: [null as unknown as HourlyDigest["risen"][number]] }])).toThrow(/^the item at 0 of 2026-11-04T01:00:00.000Z's risen is not an object$/);
    // A list that is no array, and an absent previous read like null.
    expect(() => foldHour(null as unknown as HourlyDigest["ops"], "2026-11-04T01:00:00Z", null)).toThrow(/^counts is not an array$/);
    expect(() => foldDay("2026-11-04", null as unknown as HourlyDigest[])).toThrow(/^hourly is not an array$/);
    for (const none of [null, undefined]) {
      expect(() => foldDay("2026-11-04", [{ ...one, ops: none as unknown as HourlyDigest["ops"] }])).toThrow(/^2026-11-04T01:00:00.000Z's ops is not an array$/);
      expect(() => foldDay("2026-11-04", [{ ...one, risen: none as unknown as HourlyDigest["risen"] }])).toThrow(/^2026-11-04T01:00:00.000Z's risen is not an array$/);
      expect(() => foldHour([], "2026-11-04T02:00:00Z", { ...one, ops: none as unknown as HourlyDigest["ops"] })).toThrow(/^the previous hour's ops is not an array$/);
    }
    expect(foldHour([], "2026-11-04T02:00:00Z", undefined)).toEqual(foldHour([], "2026-11-04T02:00:00Z", null));
    // A hole in a sparse array is an item that is not an object, named by its place.
    const holed = <T,>(item: T): T[] => {
      const list: T[] = [];
      list[1] = item;
      return list;
    };
    const op = { op: "x", ok: 0, failed: 0, unknown: 0 };
    expect(() => foldHour(holed(op), "2026-11-04T01:00:00Z", null)).toThrow(/^the item at 0 of counts is not an object$/);
    expect(() => foldHour([], "2026-11-04T02:00:00Z", { ...one, ops: holed(op) })).toThrow(/^the item at 0 of the previous hour's ops is not an object$/);
    expect(() => foldDay("2026-11-04", [{ ...one, ops: holed(op) }])).toThrow(/^the item at 0 of 2026-11-04T01:00:00.000Z's ops is not an object$/);
    expect(() => foldDay("2026-11-04", [{ ...one, risen: holed({ op: "x", failed: 10, previous: 0 }) }])).toThrow(/^the item at 0 of 2026-11-04T01:00:00.000Z's risen is not an object$/);
  });

  it("names a non-string operation in a fold's input with an error, never a TypeError", () => {
    const one = foldHour([{ op: "x", ok: 0, failed: 5, unknown: 0 }], "2026-11-04T01:00:00Z", null);
    const odd = { ...one, ops: [{ op: 7 as unknown as string, ok: 0, failed: 0, unknown: 0 }] } as HourlyDigest;
    expect(() => foldHour([], "2026-11-04T02:00:00Z", odd)).toThrow(/^the operation at 0 of the previous hour's ops has no string name$/);
  });

  it("is a descriptor's rule only, and a declaration's absence is no finding", () => {
    expect(found("service-well-known", { extensions: { [key]: "digests" } }).filter((f) => f.startsWith("FAC-SEM-168"))).toEqual([]);
    const { extensions: _dropped, ...bare } = descriptor();
    expect(found("service-descriptor", bare)).toEqual([]);
  });

  it("pnpm validate passes the descriptor that says where its digests are, and names FAC-SEM-168 in one that breaks it", () => {
    expect(runCli([path.join(root, "fixtures/positive/service-descriptor-ops-digest.json"), "--json"]).code).toBe(0);
    const scratch = mkdtempSync(path.join(tmpdir(), "fac-ops-digest-"));
    try {
      const file = path.join(scratch, "descriptor.json");
      writeFileSync(file, JSON.stringify(load("ops-digest-folders-source-twice.json").input));
      const result = runCli([file]);
      expect(result.code).toBe(1);
      expect(result.out).toContain("FAC-SEM-168");
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  });
});
