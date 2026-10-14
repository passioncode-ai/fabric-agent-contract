import { type Finding, type JsonObject, isObject, show, toNumber } from "./findings.js";
import { normalIdentifier } from "./identifiers.js";
import { strictTime } from "./rfc3339.js";

// #region usage-rules — docs: docs/specification/service.md#usage-report
/**
 * FAC-SEM-025, the usage report's whole rule: the arithmetic of days and models (DEC-0021) and what DEC-0065 adds:
 * - the window: every `days[].date` is a date that exists, not after the UTC date of `generatedAt` and at most 30 days
 *   before it, so `days` covers at most the last 31 UTC days with today last (F-A-024);
 * - the project attribution: `byProject[]` names each project once — two spellings of one project id are one project,
 *   compared by normal form (DEC-0076) — and each task run once within its project, a row's
 *   calls are at least its task runs' calls, all projects together hold no more calls than the days, and an unknown cost
 *   is null exactly as in a day's rows (CON-OE-13); the known costs add up the same way: a project costs at least its task
 *   runs (and holds at least their priced calls) and all projects no more than the days (CT-40), a null cost counting
 *   as none.
 * Malformed input answers findings or none, never an exception.
 */

const DAY_MS = 86_400_000;
const WINDOW_DAYS = 31;

const flag = (instancePath: string, message: string): Finding => ({ code: "FAC-SEM-025", instancePath, message });
const count = (value: unknown): number => (Number.isSafeInteger(value) && (value as number) >= 0 ? (value as number) : 0);
const list = (value: unknown): JsonObject[] => (Array.isArray(value) ? value.filter(isObject) : []);
/** A known, non-negative cost, or 0 for null, a negative or anything else (the schema refuses those; the sums ignore them). */
const cost = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0);
/** Whether `a` exceeds `b` by more than rounding (the tolerance the day's cost check uses). */
const exceeds = (a: number, b: number) => a - b > 0.000001 + 1e-9 * Math.max(Math.abs(a), Math.abs(b));
const usd = (value: number) => show(Math.round(value * 1e6) / 1e6);

/** Midnight UTC of a `YYYY-MM-DD` date that exists, or NaN. */
export function utcDate(value: unknown): number {
  const match = typeof value === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  if (!match) return Number.NaN;
  const [year, month, day] = match.slice(1).map(Number) as [number, number, number];
  const ms = Date.UTC(year, month - 1, day);
  const date = new Date(ms);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? ms : Number.NaN;
}

function usageWindow(value: JsonObject): Finding[] {
  const days = list(value.days);
  if (!days.length) return [];
  const generatedAt = strictTime(value.generatedAt);
  if (Number.isNaN(generatedAt)) return [flag("/generatedAt", "generatedAt is an RFC 3339 date-time with an offset, so the window can be read")];
  const today = Math.floor(generatedAt / DAY_MS) * DAY_MS;
  const oldest = today - (WINDOW_DAYS - 1) * DAY_MS;
  const findings: Finding[] = [];
  days.forEach((day, i) => {
    const date = utcDate(day.date);
    if (Number.isNaN(date)) findings.push(flag(`/days/${i}/date`, "a day's date exists in its month"));
    else if (date > today) findings.push(flag(`/days/${i}/date`, "a day is not after the UTC date of generatedAt"));
    else if (date < oldest) findings.push(flag(`/days/${i}/date`, `a day is within the last ${WINDOW_DAYS} UTC days of generatedAt`));
  });
  return findings;
}

function pricedRow(row: JsonObject, at: string): Finding[] {
  const calls = count(row.calls);
  const unpriced = count(row.unpricedCalls);
  if (unpriced > calls) return [flag(`${at}/unpricedCalls`, "more unpriced calls than calls")];
  if (calls > 0 && unpriced === calls && row.costUsd !== null) return [flag(`${at}/costUsd`, "every call is unpriced, so the cost is unknown (null), not a number")];
  if (unpriced < calls && row.costUsd === null) return [flag(`${at}/costUsd`, "priced calls carry a cost; null is only for a row with no priced call")];
  return [];
}

function usageProjects(value: JsonObject): Finding[] {
  if (!Array.isArray(value.byProject)) return [];
  const findings: Finding[] = [];
  const projects = new Map<string, string>();
  let projectCalls = 0;
  let projectCost = 0;
  value.byProject.forEach((project: unknown, p: number) => {
    if (!isObject(project)) return;
    const at = `/byProject/${p}`;
    const projectId = normalIdentifier(project.projectId);
    if (projectId !== undefined) {
      const first = projects.get(projectId);
      if (first !== undefined) findings.push(flag(`${at}/projectId`, `each project is one row: ${show(project.projectId)} names the project ${first} already names`));
      else projects.set(projectId, show(project.projectId));
    }
    projectCalls += count(project.calls);
    projectCost += cost(project.costUsd);
    findings.push(...pricedRow(project, at));
    const runs = new Set<string>();
    let runCalls = 0;
    let runCost = 0;
    let runPriced = 0;
    list(project.taskRuns).forEach((run, r) => {
      if (typeof run.taskRunId === "string") {
        if (runs.has(run.taskRunId)) findings.push(flag(`${at}/taskRuns/${r}/taskRunId`, "each task run is one row within its project"));
        runs.add(run.taskRunId);
      }
      runCalls += count(run.calls);
      runCost += cost(run.costUsd);
      runPriced += Math.max(0, count(run.calls) - count(run.unpricedCalls));
      findings.push(...pricedRow(run, `${at}/taskRuns/${r}`));
    });
    // One finding per project for its runs: the first bound they break, calls, then priced calls, then known cost. A
    // project whose cost is unknown (null) has no cost to compare: its priced calls are bounded here, and pricedRow
    // judges its null against its own unpricedCalls. A value the schema refuses is not compared again.
    const projectPriced = Math.max(0, count(project.calls) - count(project.unpricedCalls));
    if (runCalls > count(project.calls)) findings.push(flag(`${at}/taskRuns`, `a project's task runs hold more calls than the project (${runCalls} > ${count(project.calls)})`));
    else if (runPriced > projectPriced) findings.push(flag(`${at}/taskRuns`, `a project's task runs hold more priced calls than the project (${runPriced} > ${projectPriced})`));
    else if (cost(project.costUsd) === project.costUsd && exceeds(runCost, cost(project.costUsd))) findings.push(flag(`${at}/taskRuns`, `a project's task runs cost more than the project (${usd(runCost)} > ${usd(cost(project.costUsd))})`));
  });
  const dayCalls = list(value.days).reduce((n, day) => n + count(day.calls), 0);
  if (projectCalls > dayCalls) findings.push(flag("/byProject", `the projects hold more calls than the days (${projectCalls} > ${dayCalls})`));
  const dayCost = list(value.days).reduce((n, day) => n + cost(day.costUsd), 0);
  if (exceeds(projectCost, dayCost)) findings.push(flag("/byProject", `the projects cost more than the days (${usd(projectCost)} > ${usd(dayCost)})`));
  return findings;
}

/** FAC-SEM-025 (DEC-0021): a usage report adds up, an unknown cost is null rather than 0, and the
 *  days run forward without a repeat — so a host may sum days without double-counting. */
function usageArithmetic(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const days = Array.isArray(value.days) ? value.days.filter(isObject) : [];
  const money = (x: unknown) => (typeof x === "number" ? x : null);
  const close = (a: number, b: number) => Math.abs(a - b) <= 0.000001 + 1e-9 * Math.max(Math.abs(a), Math.abs(b));
  const priced = (row: JsonObject, at: string) => findings.push(...pricedRow(row, at));
  let previous = "";
  days.forEach((day, i) => {
    const at = `/days/${i}`;
    const date = show(day.date ?? "");
    if (date <= previous) findings.push({ code: "FAC-SEM-025", instancePath: `${at}/date`, message: `days must run forward without a repeat (${date} after ${previous})` });
    previous = date;
    priced(day, at);
    const models = Array.isArray(day.byModel) ? day.byModel.filter(isObject) : [];
    models.forEach((m, j) => priced(m, `${at}/byModel/${j}`));
    if (!models.length) {
      // No rows means nothing to sum: such a day can only be empty.
      const spent = ["calls", "inputTokens", "outputTokens", "cacheReadTokens", "cacheWriteTokens"].some((f) => toNumber(day[f] ?? 0) > 0) || toNumber(day.costUsd ?? 0) > 0;
      if (spent) findings.push({ code: "FAC-SEM-025", instancePath: `${at}/byModel`, message: "a day with calls, tokens or cost names the models they belong to" });
      return;
    }
    for (const field of ["calls", "unpricedCalls", "inputTokens", "outputTokens", "cacheReadTokens", "cacheWriteTokens"]) {
      const sum = models.reduce((n, m) => n + toNumber(m[field] ?? 0), 0);
      if (toNumber(day[field] ?? 0) !== sum) findings.push({ code: "FAC-SEM-025", instancePath: `${at}/${field}`, message: `the day's ${field} is not the sum of its models (${show(day[field] ?? 0)} ≠ ${sum})` });
    }
    const known = models.map((m) => money(m.costUsd)).filter((x): x is number => x !== null);
    const dayCost = money(day.costUsd);
    if (dayCost !== null && !close(dayCost, known.reduce((n, x) => n + x, 0))) findings.push({ code: "FAC-SEM-025", instancePath: `${at}/costUsd`, message: "the day's cost is not the sum of its models' known costs" });
  });
  return findings;
}

export function usageRules(value: JsonObject): Finding[] {
  return [...usageArithmetic(value), ...usageWindow(value), ...usageProjects(value)];
}
// #endregion usage-rules
