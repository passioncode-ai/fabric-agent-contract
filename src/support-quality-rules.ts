import { type Finding, type JsonObject, isObject } from "./findings.js";

// #region support-quality, docs: docs/specification/support-quality.md
/**
 * FAC-SEM-126 (DEC-0095) on one `support-quality-daily/1` payload: a metric not computed is `null` and is named in
 * `notMeasured`, and a named one is `null` (never a `0` standing for it); the parts never exceed their whole: the
 * helped verdicts the sample, the fallback's recoveries the failures, the autonomy outcomes (resolvedWithoutPerson,
 * toPersonPolicy, toPersonInability) the turns; p50 is at most p90; a
 * judged sample names its rubric and its judge. `checks` is the fifth member a not-measured name may address: `checks`
 * when nothing was judged. A calibration (DEC-0144) is the judge's: it names the rubric and the judge, its `helped`
 * follows the not-measured rule as `calibration.helped`, its week is a real ISO week no later than the day, and
 * `calibrationChecks` stands only beside it. DEC-0151's ticket counts follow the not-measured rule: the top-level
 * `arrived`, `ended` and `notATicket` each under its own name, the `open` and `outcomes` objects as families, and
 * `autonomy.answeredTickets`, `stability.safeReplyTurns` and `stability.safeReplyTickets` as their families' members; an absent
 * one is not carried, so naming it is a finding, and naming a top-level member that is no metric (`project`, `day`) says
 * so. DEC-0151 adds no sum among them: the channel agent standard states none.
 */
const FAMILIES = ["nobodyDropped", "quality", "stability", "autonomy", "open", "outcomes"] as const;
/** DEC-0151: the ticket counts at the top level, each named in `notMeasured` by its own name. */
const TOP_COUNTS = ["arrived", "ended", "notATicket"] as const;
/** The payload's other top-level members: none is a metric, so naming one in `notMeasured` says so (DEC-0151). */
const NOT_METRICS: ReadonlySet<string> = new Set(["kind", "day", "channel", "project", "rubricVersion", "judgeModel", "notMeasured", ...FAMILIES, "calibration", "calibrationChecks"]);

/** The Monday of ISO week `YYYY-Www` as `YYYY-MM-DD`, or null when the year has no such week (W53 of a 52-week year). */
export function isoWeekMonday(week: string): string | null {
  const match = /^([0-9]{4})-W([0-9]{2})$/.exec(week);
  if (!match) return null;
  const year = Number(match[1]);
  const number = Number(match[2]);
  // setUTCFullYear, never Date.UTC: Date.UTC reads the years 0 to 99 as 1900 to 1999.
  const mondayOfWeekOne = (y: number): number => {
    const jan4 = new Date(0);
    jan4.setUTCFullYear(y, 0, 4);
    return jan4.getTime() - ((jan4.getUTCDay() + 6) % 7) * 86_400_000;
  };
  const firstMonday = mondayOfWeekOne(year);
  const nextFirstMonday = mondayOfWeekOne(year + 1);
  const weeks = (nextFirstMonday - firstMonday) / (7 * 86_400_000);
  if (number < 1 || number > weeks) return null;
  const monday = new Date(firstMonday + (number - 1) * 7 * 86_400_000);
  const pad = (n: number, width: number) => String(n).padStart(width, "0");
  return `${pad(monday.getUTCFullYear(), 4)}-${pad(monday.getUTCMonth() + 1, 2)}-${pad(monday.getUTCDate(), 2)}`;
}

// DEC-0151's interim: until every reader of the feed has adopted it, a producer leaves an unmeasured first-reply time
// null and unnamed, since an older copy refuses a metric name with a digit; the message points there.
const FIRST_REPLY = new Set(["nobodyDropped.firstReplyP50Ms", "nobodyDropped.firstReplyP90Ms"]);
const INTERIM = ", but until every reader of the feed has adopted DEC-0151, leave it null and unnamed: support quality, the interim";

export function supportQualityRules(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-126", instancePath, message });
  const named = new Set(Array.isArray(value.notMeasured) ? value.notMeasured.filter((name): name is string => typeof name === "string") : []);
  const seen = new Set<string>();
  // A metric not computed is null and named; a named one is null. Every name it reads is one the payload carries.
  const notMeasuredRule = (name: string, at: string, measured: unknown) => {
    seen.add(name);
    if (measured === null && !named.has(name)) flag(at, `${name} is null, so notMeasured names it${FIRST_REPLY.has(name) ? INTERIM : ""}`);
    if (measured !== null && named.has(name)) flag(at, `${name} is named not measured, so it is null, not a value`);
  };
  for (const family of [...FAMILIES, "checks"]) {
    if (family === "checks" && value.checks === null) {
      seen.add("checks");
      if (!named.has("checks")) flag("/checks", "checks is null, so notMeasured names it");
      continue;
    }
    if (family === "checks") {
      seen.add("checks");
      if (named.has("checks")) flag("/checks", "checks is named not measured, so it is null");
    }
    const members = isObject(value[family]) ? value[family] : {};
    for (const [metric, measured] of Object.entries(members)) notMeasuredRule(`${family}.${metric}`, `/${family}/${metric}`, measured);
  }
  for (const count of TOP_COUNTS) if (value[count] !== undefined) notMeasuredRule(count, `/${count}`, value[count]);
  if (isObject(value.calibration)) {
    notMeasuredRule("calibration.helped", "/calibration/helped", value.calibration.helped);
    const week = value.calibration.week;
    if (typeof week === "string") {
      const monday = isoWeekMonday(week);
      if (monday === null) flag("/calibration/week", `${week} is not an ISO week of its year`);
      else if (typeof value.day === "string" && monday > value.day) flag("/calibration/week", `the calibration week ${week} starts after the day it is reported on`);
    }
  } else if (value.calibrationChecks !== undefined) {
    flag("/calibrationChecks", "calibrationChecks stands only beside a calibration");
  }
  for (const name of named) {
    if (seen.has(name)) continue;
    flag("/notMeasured", NOT_METRICS.has(name) ? `notMeasured names ${name}, which is not a metric` : `notMeasured names ${name}, which the payload does not carry`);
  }
  const num = (family: string, metric: string): number | null => {
    const members = isObject(value[family]) ? value[family] : {};
    return typeof members[metric] === "number" ? (members[metric] as number) : null;
  };
  const atMost = (parts: Array<number | null>, whole: number | null, at: string, message: string) => {
    if (whole === null || parts.some((part) => part === null)) return;
    if ((parts as number[]).reduce((sum, part) => sum + part, 0) > whole) flag(at, message);
  };
  atMost([num("quality", "helpedYes"), num("quality", "helpedPartly"), num("quality", "helpedNo")], num("quality", "sampled"), "/quality", "the helped verdicts are more than the sample");
  atMost([num("stability", "recoveredByFallback")], num("stability", "modelCallFailures"), "/stability/recoveredByFallback", "more recoveries than model-call failures");
  atMost([num("autonomy", "resolvedWithoutPerson"), num("autonomy", "toPersonPolicy"), num("autonomy", "toPersonInability")], num("nobodyDropped", "turns"), "/autonomy", "the autonomy outcomes (resolvedWithoutPerson, toPersonPolicy, toPersonInability) are more than the turns");
  const p50 = num("nobodyDropped", "firstReplyP50Ms");
  const p90 = num("nobodyDropped", "firstReplyP90Ms");
  if (p50 !== null && p90 !== null && p50 > p90) flag("/nobodyDropped/firstReplyP50Ms", "the median first reply is slower than the 90th percentile");
  // Judged is any sign of a verdict: a sample, a helped verdict or a check's pass rate.
  const judged = ["sampled", "helpedYes", "helpedPartly", "helpedNo"].some((metric) => (num("quality", metric) ?? 0) > 0) || (isObject(value.checks) && Object.keys(value.checks).length > 0);
  // A calibration is the judge's too: one finding for a nameless judge, whichever of the two needs it.
  if ((judged || isObject(value.calibration)) && (value.rubricVersion === null || value.judgeModel === null)) {
    flag("/judgeModel", judged ? "a judged sample names its rubric version and its judge model" : "a calibration names the rubric version and the judge model it measured");
  }
  return findings;
}
// #endregion support-quality
