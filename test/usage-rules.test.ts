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
  it("applies the unknown-cost rule to project and task-run rows", () => {
    expect(paths(rows([{ ...project, costUsd: null }]))).toEqual(["FAC-SEM-025 /byProject/0/costUsd"]);
    expect(paths(rows([{ projectId: "urn:project:x", calls: 2, unpricedCalls: 2, costUsd: 0 }]))).toEqual(["FAC-SEM-025 /byProject/0/costUsd"]);
    expect(paths(rows([{ projectId: "urn:project:x", calls: 1, unpricedCalls: 2, costUsd: null }]))).toEqual(["FAC-SEM-025 /byProject/0/unpricedCalls"]);
    expect(paths(rows([{ ...project, taskRuns: [{ ...project.taskRuns[0], costUsd: null }] }]))).toEqual(["FAC-SEM-025 /byProject/0/taskRuns/0/costUsd"]);
  });
  it("answers malformed attribution with findings or none, never by throwing", () => {
    expect(() => usageRules({ byProject: [null, 3, { projectId: 5, calls: -1, taskRuns: "x" }, { taskRuns: [null, { taskRunId: 7 }] }] })).not.toThrow();
    expect(usageRules({ byProject: "x", days: "y" })).toEqual([]);
  });
  it("reads a day with no date, no model list or a missing total as findings (the arithmetic moved here, DEC-0065)", () => {
    const found = usageRules({ generatedAt: "2026-10-04T00:00:00Z", days: [{ byModel: "x" }, { date: "2026-10-04", byModel: [{ costUsd: 1, calls: 1 }] }] });
    expect(found.map((finding) => finding.instancePath)).toEqual(["/days/0/date", "/days/1/calls", "/days/0/date"]);
  });
});
