import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

// DEC-0095: support-quality-daily/1, FAC-SEM-126.
type Json = Record<string, any>;
const dir = path.join(projectRoot(), "fixtures/semantic");
const load = (name: string) => JSON.parse(readFileSync(path.join(dir, name), "utf8")) as Json;
const paths = (value: unknown) => evaluateSemanticRules("support-quality-daily", value).map((f) => `${f.code} ${f.instancePath}`);
const ok = () => structuredClone(load("support-quality-daily-ok.json").input) as Json;

describe("FAC-SEM-126: support-quality-daily/1", () => {
  it.each(readdirSync(dir).filter((name) => name.startsWith("support-quality-daily-")))("%s yields exactly its expected codes", (name) => {
    const fixture = load(name);
    expect([...new Set(evaluateSemanticRules(fixture.kind, fixture.input).map((f) => f.code))]).toEqual(fixture.expect);
  });
  it("names an unmeasured metric and never stands a 0 or a value for it", () => {
    const missing = ok();
    missing.stability.restarts = null;
    expect(paths(missing)).toEqual(["FAC-SEM-126 /stability/restarts"]);
    const stray = ok();
    stray.notMeasured = [...stray.notMeasured, "quality.unknownMetric"];
    expect(paths(stray)).toEqual(["FAC-SEM-126 /notMeasured"]);
  });
  it("keeps the parts within their whole and p50 within p90", () => {
    const value = ok();
    value.stability.recoveredByFallback = 4;
    value.autonomy.toPersonInability = 30;
    value.nobodyDropped.firstReplyP50Ms = 20000;
    expect(paths(value).sort()).toEqual(["FAC-SEM-126 /autonomy", "FAC-SEM-126 /nobodyDropped/firstReplyP50Ms", "FAC-SEM-126 /stability/recoveredByFallback"]);
  });
  it("names the rubric and the judge of a judged sample", () => {
    const value = ok();
    value.judgeModel = null;
    expect(paths(value)).toEqual(["FAC-SEM-126 /judgeModel"]);
    value.quality = { sampled: 0, helpedYes: 0, helpedPartly: 0, helpedNo: 0 };
    value.checks = null;
    value.notMeasured = [...value.notMeasured, "checks"];
    expect(paths(value)).toEqual([]);
  });
  it("names the judge when a verdict shows, even with no sample count, and the rubric too", () => {
    const value = ok();
    value.rubricVersion = null;
    expect(paths(value)).toEqual(["FAC-SEM-126 /judgeModel"]);
    const unsampled = ok();
    unsampled.quality.sampled = null;
    unsampled.notMeasured = [...unsampled.notMeasured, "quality.sampled"];
    unsampled.judgeModel = null;
    expect(paths(unsampled)).toEqual(["FAC-SEM-126 /judgeModel"]);
  });
  it("names checks when nothing was judged, and only then", () => {
    const unnamed = ok();
    unnamed.checks = null;
    expect(paths(unnamed)).toContain("FAC-SEM-126 /checks");
    const named = ok();
    named.notMeasured = [...named.notMeasured, "checks"];
    expect(paths(named)).toEqual(["FAC-SEM-126 /checks"]);
  });
  it("counts a check's pass rate as judged: it names the judge", () => {
    const value = ok();
    value.quality = { sampled: 0, helpedYes: 0, helpedPartly: 0, helpedNo: 0 };
    value.judgeModel = null;
    expect(paths(value)).toEqual(["FAC-SEM-126 /judgeModel"]);
  });
  it("reads a calibration as the judge's (DEC-0144): its helped follows the not-measured rule, its checks stand only beside it", () => {
    const calibrated = (): Json => Object.assign(ok(), { calibration: { week: "2026-W43", labelled: 40, helped: 0.85 as number | null }, calibrationChecks: { addressed: 0.9, policy_safe: 1 } });
    expect(paths(calibrated())).toEqual([]);
    const unlabelled = calibrated();
    unlabelled.calibration.helped = null;
    expect(paths(unlabelled)).toEqual(["FAC-SEM-126 /calibration/helped"]);
    unlabelled.notMeasured = [...unlabelled.notMeasured, "calibration.helped"];
    expect(paths(unlabelled)).toEqual([]);
    const named = calibrated();
    named.notMeasured = [...named.notMeasured, "calibration.helped"];
    expect(paths(named)).toEqual(["FAC-SEM-126 /calibration/helped"]);
    const nameless = ok();
    nameless.notMeasured = [...nameless.notMeasured, "calibration.helped"];
    expect(paths(nameless)).toEqual(["FAC-SEM-126 /notMeasured"]);
    const judgeless = calibrated();
    judgeless.quality = { sampled: 0, helpedYes: 0, helpedPartly: 0, helpedNo: 0 };
    judgeless.checks = null;
    judgeless.notMeasured = [...judgeless.notMeasured, "checks"];
    judgeless.judgeModel = null;
    expect(paths(judgeless)).toEqual(["FAC-SEM-126 /judgeModel"]);
    const alone = Object.assign(ok(), { calibrationChecks: { addressed: 0.9 } });
    expect(paths(alone)).toEqual(["FAC-SEM-126 /calibrationChecks"]);
  });
  it("travels with a calibration as an event's data.value (DEC-0070's two levels)", async () => {
    const ajv = await createValidator();
    const page = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/positive/service-events-page-data.json"), "utf8")) as Json;
    const payload = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/positive/support-quality-daily-calibrated.json"), "utf8")) as Json;
    const event = (page.events as Json[]).find((entry) => entry.data) as Json;
    event.data = { schema: "https://support.example.com/schemas/support-quality-daily.schema.json", value: payload };
    const result = validateDocument(ajv, `${SCHEMA_PREFIX}schemas/service-events-page.schema.json`, page);
    expect(result.valid, JSON.stringify(result.errors)).toBe(true);
  });
  it("lets the median equal the 90th percentile", () => {
    const value = ok();
    value.nobodyDropped.firstReplyP50Ms = value.nobodyDropped.firstReplyP90Ms;
    expect(paths(value)).toEqual([]);
  });
  it("travels as an event's data.value: the events page accepts it (DEC-0070's two levels)", async () => {
    const ajv = await createValidator();
    const page = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/positive/service-events-page-data.json"), "utf8")) as Json;
    const payload = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/positive/support-quality-daily.json"), "utf8")) as Json;
    const event = (page.events as Json[]).find((entry) => entry.data) as Json;
    event.data = { schema: "https://support.example.com/schemas/support-quality-daily.schema.json", value: payload };
    const result = validateDocument(ajv, `${SCHEMA_PREFIX}schemas/service-events-page.schema.json`, page);
    expect(result.valid, JSON.stringify(result.errors)).toBe(true);
  });
  it("reads a malformed payload without throwing and skips sums it cannot make", () => {
    expect(paths({ notMeasured: 7, nobodyDropped: "x", quality: [1], stability: null, autonomy: 3 })).toEqual([]);
    const partial = ok();
    partial.quality.helpedNo = null;
    partial.quality.helpedYes = 99;
    partial.notMeasured = [...partial.notMeasured, "quality.helpedNo"];
    partial.nobodyDropped.turns = "142";
    // A sum with an unknown part, or a whole that is not a number, is not checked: nothing is claimed about it.
    expect(paths(partial)).toEqual([]);
  });
});
