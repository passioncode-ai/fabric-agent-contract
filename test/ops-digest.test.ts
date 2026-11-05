import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { type HourlyDigest, OP_NAME, OP_NAME_MAX, digestFoldersView, foldDay, foldDir, foldHour, isRise, opsDigestRules, realDay, wholeHour } from "../src/ops-digest.js";
import { EXTENSION_KEYS } from "../src/extensions.js";
import { hasHomePath } from "../src/activity-rules.js";
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
    const many = (n: number) => Array.from({ length: n }, (_, i) => ({ op: `op.n${String(i).padStart(4, "0")}`, ok: 1, failed: 0, unknown: 0 }));
    const digest = (n: number) => ({ ...foldHour(many(n), "2026-11-04T01:00:00Z", null) });
    expect(valid("ops-digest-hourly.schema.json", digest(4096))).toBe(true);
    expect(valid("ops-digest-hourly.schema.json", digest(4097))).toBe(false);
    const folded = foldHour([...many(4095), { op: "tool.other", ok: 2, failed: 0, unknown: 0 }], "2026-11-04T01:00:00Z", null);
    expect(valid("ops-digest-hourly.schema.json", folded)).toBe(true);
    expect(folded.total.ok).toBe(4097);
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

  it("compares dirs under Unicode case folding after NFC, trailing dots and spaces dropped", () => {
    const pairs: Array<[string, string]> = [["Straße", "STRASSE"], ["Stra\u1e9ee", "Straße"], ["σασ", "ΣΑΣ"], ["café", "café"], ["digests.", "digests"], ["digests ", "digests"], ["a/Digests./b", "A/digests/B"], ["\u1fbc\u0342", "\u1fb7"], ["\u0131", "i"], ["\u0131", "I"]];
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
        expect(result.out, name).toContain("FAC-SEM-168 runs only on the declaration inside a service descriptor");
      }
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
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
