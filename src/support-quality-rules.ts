import { type Finding, type JsonObject, isObject } from "./findings.js";

// #region support-quality, docs: docs/specification/support-quality.md
/**
 * FAC-SEM-126 (DEC-0095) on one `support-quality-daily/1` payload: a metric not computed is `null` and is named in
 * `notMeasured`, and a named one is `null` (never a `0` standing for it); the parts never exceed their whole: the
 * helped verdicts the sample, the fallback's recoveries the failures, the outcomes the turns; p50 is at most p90; a
 * judged sample names its rubric and its judge. `checks` is the fifth member a not-measured name may address: `checks`
 * when nothing was judged. A calibration (DEC-0144) is the judge's: it names the rubric and the judge, its `helped`
 * follows the not-measured rule as `calibration.helped`, and `calibrationChecks` stands only beside it.
 */
const FAMILIES = ["nobodyDropped", "quality", "stability", "autonomy"] as const;

export function supportQualityRules(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-126", instancePath, message });
  const named = new Set(Array.isArray(value.notMeasured) ? value.notMeasured.filter((name): name is string => typeof name === "string") : []);
  const seen = new Set<string>();
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
    for (const [metric, measured] of Object.entries(members)) {
      const name = `${family}.${metric}`;
      seen.add(name);
      if (measured === null && !named.has(name)) flag(`/${family}/${metric}`, `${name} is null, so notMeasured names it`);
      if (measured !== null && named.has(name)) flag(`/${family}/${metric}`, `${name} is named not measured, so it is null, not a value`);
    }
  }
  if (isObject(value.calibration)) {
    const helped = value.calibration.helped;
    seen.add("calibration.helped");
    if (helped === null && !named.has("calibration.helped")) flag("/calibration/helped", "calibration.helped is null, so notMeasured names it");
    if (helped !== null && named.has("calibration.helped")) flag("/calibration/helped", "calibration.helped is named not measured, so it is null, not a value");
    if (value.rubricVersion === null || value.judgeModel === null) flag("/judgeModel", "a calibration names the rubric version and the judge model it measured");
  } else if (value.calibrationChecks !== undefined) {
    flag("/calibrationChecks", "calibrationChecks stands only beside a calibration");
  }
  for (const name of named) if (!seen.has(name)) flag("/notMeasured", `notMeasured names ${name}, which the payload does not carry`);
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
  atMost([num("autonomy", "resolvedWithoutPerson"), num("autonomy", "toPersonPolicy"), num("autonomy", "toPersonInability")], num("nobodyDropped", "turns"), "/autonomy", "the outcomes are more than the turns");
  const p50 = num("nobodyDropped", "firstReplyP50Ms");
  const p90 = num("nobodyDropped", "firstReplyP90Ms");
  if (p50 !== null && p90 !== null && p50 > p90) flag("/nobodyDropped/firstReplyP50Ms", "the median first reply is slower than the 90th percentile");
  // Judged is any sign of a verdict: a sample, a helped verdict or a check's pass rate.
  const judged = ["sampled", "helpedYes", "helpedPartly", "helpedNo"].some((metric) => (num("quality", metric) ?? 0) > 0) || (isObject(value.checks) && Object.keys(value.checks).length > 0);
  if (judged && (value.rubricVersion === null || value.judgeModel === null)) flag("/judgeModel", "a judged sample names its rubric version and its judge model");
  return findings;
}
// #endregion support-quality
