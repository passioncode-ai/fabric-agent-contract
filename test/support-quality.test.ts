import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
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
    value.quality = { sampled: 0, helpedYes: 0, helpedPartly: 0, helpedNo: 0, checks: null };
    value.notMeasured = [...value.notMeasured, "quality.checks"];
    expect(paths(value)).toEqual([]);
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
