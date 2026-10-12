import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { usageRules, utcDate } from "../src/usage-rules.js";

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
