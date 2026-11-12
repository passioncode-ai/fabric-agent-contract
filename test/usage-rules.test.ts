import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { allowance, exceeds, ROW_ROUNDING_USD, usageRules, usageSpend, utcDate } from "../src/usage-rules.js";

// DEC-0065: FAC-SEM-025 reads the usage report's 31-day window (F-A-024) and its project attribution (CON-OE-13).
type Json = Record<string, any>;
const read = (name: string) => JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/positive", name), "utf8")) as Json;
const paths = (value: unknown) => evaluateSemanticRules("service-usage", value).map((finding) => `${finding.code} ${finding.instancePath}`);
const report = read("service-usage-by-project.json");
const emptyDay = (date: string) => ({ date, calls: 0, unpricedCalls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0, byModel: [] });
const window = (generatedAt: string, ...dates: string[]) => ({ ...report, byProject: undefined, generatedAt, days: dates.map(emptyDay) });

describe("FAC-SEM-025: the window of the last 31 UTC days", () => {
  it("passes the fixture and a report without days", () => {
    expect(paths(report)).toEqual([]);
    expect(paths({ ...report, days: [], byProject: undefined })).toEqual([]);
  });
  it("admits today and the day 30 days before it, and refuses tomorrow and the day 31 days before", () => {
    expect(paths(window("2026-10-31T23:59:59Z", "2026-10-01", "2026-10-31"))).toEqual([]);
    expect(paths(window("2026-10-31T00:00:00Z", "2026-09-30"))).toEqual(["FAC-SEM-025 /days/0/date"]);
    expect(paths(window("2026-10-31T23:59:59Z", "2026-11-01"))).toEqual(["FAC-SEM-025 /days/0/date"]);
  });
  it("reads generatedAt's offset: 00:30+02:00 is the previous UTC day", () => {
    expect(paths(window("2026-11-01T00:30:00+02:00", "2026-10-31"))).toEqual([]);
    expect(paths(window("2026-11-01T00:30:00+02:00", "2026-11-01"))).toEqual(["FAC-SEM-025 /days/0/date"]);
  });
  it("refuses a date that does not exist and an unreadable generatedAt", () => {
    expect(paths(window("2026-03-05T00:00:00Z", "2026-02-29"))).toEqual(["FAC-SEM-025 /days/0/date"]);
    expect(paths(window("2026-03-05 00:00:00Z", "2026-03-01"))).toEqual(["FAC-SEM-025 /generatedAt"]);
    expect(paths(window("2026-13-45T25:61:61Z", "2026-03-01"))).toEqual(["FAC-SEM-025 /generatedAt"]);
  });
  it("reads a leap day that exists", () => {
    expect(utcDate("2028-02-29")).toBe(Date.UTC(2028, 1, 29));
    expect(Number.isNaN(utcDate("2026-02-29"))).toBe(true);
    expect(Number.isNaN(utcDate(20261012))).toBe(true);
  });
});

describe("FAC-SEM-025: calls by project and task run", () => {
  const rows = (byProject: unknown) => ({ ...report, byProject });
  const project = report.byProject[0];
  it("refuses a project named twice and a task run named twice within its project", () => {
    expect(paths(rows([project, { ...project, calls: 0, costUsd: 0, taskRuns: [] }]))).toEqual(["FAC-SEM-025 /byProject/1/projectId"]);
    expect(paths(rows([{ ...project, taskRuns: [project.taskRuns[0], { ...project.taskRuns[1], taskRunId: project.taskRuns[0].taskRunId }] }]))).toEqual(["FAC-SEM-025 /byProject/0/taskRuns/1/taskRunId"]);
  });
  it("DEC-0076: refuses two spellings of one project, naming the second, and keeps significant differences apart", () => {
    const id = String(project.projectId);
    const spelled = id.replace(/^urn:/i, "URN:");
    expect(spelled).not.toBe(id);
    const second = { ...project, projectId: spelled, calls: 0, costUsd: 0, taskRuns: [] };
    const findings = evaluateSemanticRules("service-usage", rows([project, second]));
    expect(findings.map((finding) => `${finding.code} ${finding.instancePath}`)).toEqual(["FAC-SEM-025 /byProject/1/projectId"]);
    expect(findings[0]?.message).toBe(`each project is one row: ${spelled} names the project ${id} already names`);
    expect(paths(rows([project, { ...second, projectId: `${id}-other` }]))).toEqual([]);
    expect(paths(rows([{ ...project, projectId: 7 }, { ...second, projectId: 7 }]))).toEqual([]);
  });
  it("lets one task run id appear under two projects", () => {
    const other = { projectId: "urn:project:other", calls: 2, unpricedCalls: 0, costUsd: 0.1, taskRuns: [{ ...project.taskRuns[0], calls: 2, costUsd: 0.1 }] };
    expect(paths(rows([project, other]))).toEqual([]);
  });
  it("refuses task runs holding more calls than their project, at the boundary", () => {
    expect(paths(rows([{ ...project, calls: 12 }]))).toEqual([]);
    expect(paths(rows([{ ...project, calls: 11 }]))).toEqual(["FAC-SEM-025 /byProject/0/taskRuns"]);
  });
  it("refuses projects holding more calls than the days, at the boundary (the days hold 19)", () => {
    const filler = (calls: number) => ({ projectId: "urn:project:filler", calls, costUsd: 0 });
    expect(paths(rows([project, filler(7)]))).toEqual([]);
    expect(paths(rows([project, filler(8)]))).toEqual(["FAC-SEM-025 /byProject"]);
  });
  it("CT-40: refuses task runs costing more than their project, at the rounding boundary", () => {
    // The project costs 1.1 and its runs 0.8 + 0.3.
    expect(paths(rows([{ ...project, costUsd: 1.1 - 0.0000009 }]))).toEqual([]);
    expect(paths(rows([{ ...project, costUsd: 1.09 }]))).toEqual(["FAC-SEM-025 /byProject/0/taskRuns"]);
    expect(evaluateSemanticRules("service-usage", rows([{ ...project, costUsd: 1.09 }]))[0]?.message).toBe("a project's task runs cost more than the project (1.1 > 1.09)");
  });
  it("CT-40: refuses task runs holding more priced calls than their project, so a null project cannot hide priced runs", () => {
    const hidden = { projectId: "urn:project:h", calls: 3, unpricedCalls: 3, costUsd: null, taskRuns: [{ taskRunId: "r1", calls: 3, unpricedCalls: 0, costUsd: 0.5 }] };
    expect(paths(rows([hidden]))).toEqual(["FAC-SEM-025 /byProject/0/taskRuns"]);
    expect(evaluateSemanticRules("service-usage", rows([hidden]))[0]?.message).toBe("a project's task runs hold more priced calls than the project (3 > 0)");
    // The boundary: as many priced calls as the project's is allowed.
    expect(paths(rows([{ ...hidden, unpricedCalls: 0, costUsd: 0.5 }]))).toEqual([]);
    expect(paths(rows([{ ...hidden, unpricedCalls: 1, costUsd: 0.5 }]))).toEqual(["FAC-SEM-025 /byProject/0/taskRuns"]);
    // A cost the schema refuses (negative) is not compared again.
    expect(usageRules({ byProject: [{ projectId: "urn:project:n", calls: 1, unpricedCalls: 0, costUsd: -5, taskRuns: [{ taskRunId: "r", calls: 1, unpricedCalls: 0, costUsd: 0.2 }] }] }).map((f) => f.instancePath)).not.toContain("/byProject/0/taskRuns");
  });
  it("CT-40: refuses projects costing more than the days, at the boundary (the days cost 1.594)", () => {
    const filler = (costUsd: number | null, calls = 1) => ({ projectId: "urn:project:filler", calls, unpricedCalls: costUsd === null ? calls : 0, costUsd });
    expect(paths(rows([project, filler(0.494)]))).toEqual([]);
    expect(paths(rows([project, filler(0.495)]))).toEqual(["FAC-SEM-025 /byProject"]);
    expect(evaluateSemanticRules("service-usage", rows([project, filler(0.495)])).at(-1)?.message).toBe("the projects cost more than the days (1.595 > 1.594)");
    // An unknown cost counts as none, on either side.
    expect(paths(rows([project, filler(null)]))).toEqual([]);
    const unpricedDays = { ...rows([project]), days: report.days.map((day: Json) => ({ ...day, costUsd: null })) };
    expect(paths(unpricedDays)).toContain("FAC-SEM-025 /byProject");
  });
  it("CT-40 with DEC-0076: a project named under two spellings is refused, and both rows still count in the cost sum", () => {
    const spelled = String(project.projectId).replace(/^urn:/i, "URN:");
    const twice = rows([project, { ...project, projectId: spelled, calls: 0, taskRuns: [] }]);
    // The duplicate is refused, and the sum still counts both rows' costs (2.2) against the days (1.594).
    expect(paths(twice)).toEqual(["FAC-SEM-025 /byProject/1/projectId", "FAC-SEM-025 /byProject"]);
  });
  it("applies the unknown-cost rule to project and task-run rows", () => {
    expect(paths(rows([{ ...project, costUsd: null }]))).toEqual(["FAC-SEM-025 /byProject/0/costUsd"]);
    expect(paths(rows([{ projectId: "urn:project:x", calls: 2, unpricedCalls: 2, costUsd: 0 }]))).toEqual(["FAC-SEM-025 /byProject/0/costUsd"]);
    expect(paths(rows([{ projectId: "urn:project:x", calls: 1, unpricedCalls: 2, costUsd: null }]))).toEqual(["FAC-SEM-025 /byProject/0/unpricedCalls"]);
    expect(paths(rows([{ ...project, taskRuns: [{ ...project.taskRuns[0], costUsd: null }] }]))).toEqual(["FAC-SEM-025 /byProject/0/taskRuns/0/costUsd"]);
  });
  it("answers malformed attribution with findings or none, never by throwing", () => {
    expect(() => usageRules({ byProject: [null, 3, { projectId: 5, calls: -1, taskRuns: "x" }, { taskRuns: [null, { taskRunId: 7 }] }] })).not.toThrow();
    expect(usageRules({ byProject: "x", days: "y" })).toEqual([]);
    const negative = { ...report, byProject: [{ projectId: "urn:project:n", calls: -3, costUsd: 0, taskRuns: [{ taskRunId: "r", calls: 2, costUsd: 0 }] }] };
    expect(usageRules(negative).map((finding) => finding.instancePath)).toContain("/byProject/0/taskRuns");
  });
  it("reads a day with no date, no model list or a missing total as findings (the arithmetic moved here, DEC-0065)", () => {
    const found = usageRules({ generatedAt: "2026-10-04T00:00:00Z", days: [{ byModel: "x" }, { date: "2026-10-04", byModel: [{ costUsd: 1, calls: 1 }] }] });
    expect(found.map((finding) => finding.instancePath)).toEqual(["/days/0/date", "/days/1/calls", "/days/0/date"]);
  });
});

describe("FAC-SEM-025: calls whose tokens are unknown (DEC-0091)", () => {
  const unmeasured = read("service-usage-unmeasured.json");
  const day = (over: Json, row: Json) => ({ ...unmeasured, days: [unmeasured.days[0], { ...unmeasured.days[1], ...over, byModel: [unmeasured.days[1].byModel[0], { ...unmeasured.days[1].byModel[1], ...row }] }] });
  it("passes a day whose unmeasuredCalls is the sum of its models', and a report that names none", () => {
    expect(paths(unmeasured)).toEqual([]);
    expect(paths(read("service-usage.json"))).toEqual([]);
  });
  it("refuses more calls with unknown tokens than calls, on a row and on the day", () => {
    expect(paths(day({ unmeasuredCalls: 3 }, { unmeasuredCalls: 3 }))).toEqual(["FAC-SEM-025 /days/1/byModel/1/unmeasuredCalls"]);
    expect(paths(day({ unmeasuredCalls: 6 }, { unmeasuredCalls: 2 }))).toContain("FAC-SEM-025 /days/1/unmeasuredCalls");
    const empty = { ...unmeasured, days: [unmeasured.days[0], { ...unmeasured.days[1], calls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0, unpricedCalls: 0, unmeasuredCalls: 1, byModel: [] }] };
    expect(paths(empty).filter((p) => p.endsWith("/days/1/unmeasuredCalls"))).toEqual(["FAC-SEM-025 /days/1/unmeasuredCalls"]);
  });
  it("refuses a day's unmeasuredCalls that is not the sum of its models', an absent one counting 0", () => {
    expect(paths(day({ unmeasuredCalls: 2 }, {}))).toEqual(["FAC-SEM-025 /days/1/unmeasuredCalls"]);
    expect(paths(day({ unmeasuredCalls: undefined }, {}))).toEqual(["FAC-SEM-025 /days/1/unmeasuredCalls"]);
  });
});

describe("usageSpend: money apart from a subscription's estimate (DEC-0110)", () => {
  const row = (route: string | undefined, calls: number, costUsd: number | null, unpricedCalls = 0) => ({ provider: "p", model: "m", ...(route ? { route } : {}), calls, unpricedCalls, costUsd });

  it("sums money over key, platform-metered and unstated rows, and the subscription's list price apart", () => {
    // The finding of 2026-10-22 (thread ea2e4f3d): $140.47 on the subscription, $6.80 spent.
    expect(usageSpend([row("subscription", 300, 140.47), row("key", 40, 4.8), row("platform-metered", 2, 1), row(undefined, 1, 1)])).toEqual({
      calls: 343, moneyUsd: 6.8, moneyLowerBound: false, estimateUsd: 140.47, estimateLowerBound: false, subscriptionCalls: 300
    });
  });

  it("answers 0 for a window spent only on a subscription, and null money only when no call off it is priced", () => {
    expect(usageSpend([row("subscription", 5, 2)])).toMatchObject({ moneyUsd: 0, moneyLowerBound: false, estimateUsd: 2 });
    expect(usageSpend([])).toMatchObject({ calls: 0, moneyUsd: 0, estimateUsd: 0, subscriptionCalls: 0 });
    expect(usageSpend([row("key", 3, null, 3), row("subscription", 1, 0.5)])).toMatchObject({ moneyUsd: null, moneyLowerBound: false, estimateUsd: 0.5 });
    expect(usageSpend([row("key", 3, null, 3), row("key", 2, 1.25, 1)])).toMatchObject({ moneyUsd: 1.25, moneyLowerBound: true });
    expect(usageSpend([row("subscription", 3, null, 3)])).toMatchObject({ moneyUsd: 0, estimateUsd: null, estimateLowerBound: false });
    expect(usageSpend([row("subscription", 3, 1, 1)])).toMatchObject({ estimateUsd: 1, estimateLowerBound: true });
  });

  it("refuses an unknown route and every row FAC-SEM-025 or the schema refuses, and never throws", () => {
    for (const bad of [
      [row("free", 1, 1)], [{ ...row("key", 1, 1), route: null }], [row("key", -1, 1)], [row("key", 1.5, 1)], [row("key", 1, -1)], [row("key", 1, Number.NaN)],
      [row("key", 2, 1, 3)], [row("key", 2, null, 1)], [row("key", 2, 1, 2)], [null], [7], ["row"], [{ ...row("key", 1, 1), calls: { toString: 1 } }]
    ]) expect(usageSpend(bad), JSON.stringify(bad)).toBeUndefined();
    for (const bad of [undefined, null, {}, "rows", { length: 1 }]) expect(usageSpend(bad)).toBeUndefined();
    expect(usageSpend([row("key", 0, null)])).toMatchObject({ calls: 0, moneyUsd: 0 });
    // A row without calls prices no call: money stays unknown beside unpriced calls, and its cost still counts alone.
    expect(usageSpend([row("key", 0, 0), row("key", 3, null, 3)])).toMatchObject({ moneyUsd: null, moneyLowerBound: false });
    expect(usageSpend([row("subscription", 0, 0), row("subscription", 3, null, 3)])).toMatchObject({ estimateUsd: null, estimateLowerBound: false });
    expect(usageSpend([row("key", 0, 5)])).toMatchObject({ moneyUsd: 5, moneyLowerBound: false });
    expect(usageSpend([row("key", 0, 5), row("key", 1, 1)])).toMatchObject({ moneyUsd: 6 });
    expect(usageSpend([{ ...row("key", 1, 1), unpricedCalls: null }])).toBeUndefined();
    // A row without `unpricedCalls` has every call priced.
    expect(usageSpend([{ provider: "p", model: "m", route: "key", calls: 2, costUsd: 0.5 }])).toMatchObject({ moneyUsd: 0.5, moneyLowerBound: false });
  });

  it("adds in a fixed order, so the same rows give the same sum in any order", () => {
    const rows = [row("key", 1, 0.1), row("key", 1, 0.2), row("key", 1, 1e-7), row("key", 1, 3)];
    expect(usageSpend([...rows].reverse())?.moneyUsd).toBe(usageSpend(rows)?.moneyUsd);
  });
});

describe("FAC-SEM-025: sums of rows rounded to 6 places one by one (DEC-0163, CT-295)", () => {
  // Runs and models written rounded to 6 places one by one: ten runs of 0.2926 against a project of 2.925996, models of
  // 0.100001 against a day of their exact total, and an excess beyond the rounding refused on each comparison.
  const run = (i: number, costUsd: number) => ({ taskRunId: `run-${i}`, calls: 1, unpricedCalls: 0, costUsd });
  const day = (costUsd: number, models: number[]) => ({
    date: "2026-10-04", calls: models.length, unpricedCalls: 0, inputTokens: 0, outputTokens: 0, costUsd,
    byModel: models.map((c, i) => ({ provider: "local", model: `m-${i}`, costBasis: "provider", calls: 1, unpricedCalls: 0, inputTokens: 0, outputTokens: 0, costUsd: c }))
  });
  const tenRuns = (runCost: number, projectCost: number, dayCost: number) => ({
    ...report,
    days: [day(dayCost, Array.from({ length: 10 }, () => dayCost / 10))],
    byProject: [{ projectId: "urn:project:film", calls: 10, unpricedCalls: 0, costUsd: projectCost, taskRuns: Array.from({ length: 10 }, (_, i) => run(i, runCost)) }]
  });
  it("passes ten runs each rounded up by 4e-7, which the fixed 0.000001 refused", () => {
    // Exact runs 0.2925996 each round to 0.2926; the project's exact 2.925996 rounds to 2.925996.
    expect(paths(tenRuns(0.2926, 2.925996, 2.926))).toEqual([]);
  });
  it("still refuses runs that cost more than rounding allows", () => {
    // Eleven rows on the two sides allow 0.0000055 + 0.000001; 0.00001 over is beyond it.
    expect(paths(tenRuns(0.2926, 2.92599, 2.926))).toEqual(["FAC-SEM-025 /byProject/0/taskRuns"]);
  });
  it("passes a day whose ten models are each rounded up, and refuses one off by more", () => {
    const models = Array.from({ length: 10 }, () => 0.100001);
    expect(paths({ ...report, byProject: undefined, days: [day(1.000005, models)] })).toEqual([]);
    expect(paths({ ...report, byProject: undefined, days: [day(1.00002, models)] })).toEqual(["FAC-SEM-025 /days/0/costUsd"]);
  });
  it("passes projects summed against days within a row's rounding each", () => {
    const projects = Array.from({ length: 10 }, (_, i) => ({ projectId: `urn:project:p${i}`, calls: 1, unpricedCalls: 0, costUsd: 0.100001, taskRuns: [] }));
    expect(paths({ ...report, days: [day(1.000005, Array.from({ length: 10 }, () => 0.1000005))], byProject: projects })).toEqual([]);
  });
  it("pins each count at its boundary: the project, the day and the days each add a row", () => {
    const at = (value: unknown, path: string) => paths(value).includes(`FAC-SEM-025 ${path}`);
    const one = (projectCost: number, runCost: number) => ({ ...report, days: [day(2, [2])], byProject: [{ projectId: "urn:project:p", calls: 1, unpricedCalls: 0, costUsd: projectCost, taskRuns: [run(0, runCost)] }] });
    // A project and its one run: two rows, 0.000002.
    expect(at(one(1, 1.0000019), "/byProject/0/taskRuns")).toBe(false);
    expect(at(one(1, 1.0000021), "/byProject/0/taskRuns")).toBe(true);
    // A day and its one model: two rows.
    expect(at({ ...report, byProject: undefined, days: [day(1, [1.0000019])] }, "/days/0/costUsd")).toBe(false);
    expect(at({ ...report, byProject: undefined, days: [day(1, [1.0000021])] }, "/days/0/costUsd")).toBe(true);
    // One project against one day: two rows, the day's among them.
    const projectDay = (projectCost: number) => ({ ...report, days: [day(1, [1])], byProject: [{ projectId: "urn:project:p", calls: 1, unpricedCalls: 0, costUsd: projectCost, taskRuns: [] }] });
    expect(at(projectDay(1.0000019), "/byProject")).toBe(false);
    expect(at(projectDay(1.0000021), "/byProject")).toBe(true);
    // Twenty null-cost runs add nothing to a project and its one priced run.
    const nullRun = (i: number) => ({ taskRunId: `null-${i}`, calls: 1, unpricedCalls: 1, costUsd: null });
    const withNulls = { ...report, days: [{ ...day(2, [2]), calls: 21, byModel: [{ ...day(2, [2]).byModel[0], calls: 21, unpricedCalls: 20 }], unpricedCalls: 20 }], byProject: [{ projectId: "urn:project:p", calls: 21, unpricedCalls: 20, costUsd: 1, taskRuns: [run(0, 1.0000021), ...Array.from({ length: 20 }, (_, i) => nullRun(i))] }] };
    expect(at(withNulls, "/byProject/0/taskRuns")).toBe(true);
    // Twenty null-cost models add nothing to a day and its one priced model.
    const priced = day(1, [1.0000021]);
    const nullModels = Array.from({ length: 20 }, (_, i) => ({ provider: "local", model: `null-${i}`, costBasis: "provider", calls: 1, unpricedCalls: 1, inputTokens: 0, outputTokens: 0, costUsd: null }));
    expect(at({ ...report, byProject: undefined, days: [{ ...priced, calls: 21, unpricedCalls: 20, byModel: [...priced.byModel, ...nullModels] }] }, "/days/0/costUsd")).toBe(true);
    // A negative model cost is summed but widens nothing; Infinity is never close.
    expect(at({ ...report, byProject: undefined, days: [day(1, [1.0000024, -0.0000001])] }, "/days/0/costUsd")).toBe(true);
    expect(usageRules({ ...report, byProject: undefined, days: [day(Number.POSITIVE_INFINITY, [1])] }).map((f) => f.instancePath)).toContain("/days/0/costUsd");
    expect(usageRules({ ...report, byProject: undefined, days: [day(1, [Number.POSITIVE_INFINITY])] }).map((f) => f.instancePath)).toContain("/days/0/costUsd");
  });
  it("allows 0.000001, half a millionth per row and 1e-9 of the larger side, and an overflowing sum exceeds a finite one", () => {
    expect(ROW_ROUNDING_USD).toBe(0.0000005);
    expect(allowance(0, 0, 0)).toBe(0.000001);
    expect(allowance(1, 0, 1)).toBeCloseTo(0.000001 + 0.0000005 + 1e-9, 15);
    expect(allowance(0, 2, 10)).toBeCloseTo(0.000006 + 2e-9, 15);
    expect(exceeds(1.0000016, 1, 1)).toBe(true);
    expect(exceeds(1.0000014, 1, 1)).toBe(false);
    expect(exceeds(Number.POSITIVE_INFINITY, 1, 0)).toBe(true);
    expect(exceeds(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, 0)).toBe(false);
    expect(exceeds(1, Number.POSITIVE_INFINITY, 0)).toBe(false);
    // Two projects of 1e308 overflow their sum; the days are finite, so the projects exceed them.
    const projects = [0, 1].map((i) => ({ projectId: `urn:project:big${i}`, calls: 0, unpricedCalls: 0, costUsd: 1e308, taskRuns: [] }));
    expect(paths({ ...report, byProject: projects })).toContain("FAC-SEM-025 /byProject");
    // A finite cost too large to scale reads as itself, never as Infinity.
    const big = { ...report, byProject: [{ projectId: "urn:project:big", calls: 2, unpricedCalls: 0, costUsd: 1e308, taskRuns: [run(0, 1e308), run(1, 1e308)] }] };
    expect(usageRules(big).find((f) => f.instancePath === "/byProject/0/taskRuns")?.message).toMatch(/> 1e\+308\)$/);
  });
  it("passes the rounded-rows fixture, which the fixed tolerance refused", () => {
    expect(paths(JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/positive/service-usage-rounded-rows.json"), "utf8")))).toEqual([]);
  });
  it("counts only rows with a known cost, and never finds NaN close (DEC-0163)", () => {
    const project = (i: number, costUsd: number | null) => ({ projectId: `urn:project:p${i}`, calls: 1, unpricedCalls: costUsd === null ? 1 : 0, costUsd, taskRuns: [] });
    const nulls = Array.from({ length: 20 }, (_, i) => project(i + 1, null));
    // One known project and one known day allow 0.000002; twenty null-cost projects add nothing to it.
    const costMessages = (value: unknown) => evaluateSemanticRules("service-usage", value).map((f) => f.message).filter((m) => m.includes("cost more than the days"));
    expect(costMessages({ ...report, days: [day(1, [1])], byProject: [project(0, 1.0000025), ...nulls] })).toHaveLength(1);
    expect(costMessages({ ...report, days: [day(1, [1])], byProject: [project(0, 1.0000015), ...nulls] })).toHaveLength(0);
    expect(usageRules({ ...report, byProject: undefined, days: [day(Number.NaN, [1])] }).map((f) => f.instancePath)).toContain("/days/0/costUsd");
  });
});
