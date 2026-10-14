import { type Finding, type JsonObject, isObject, show } from "./findings.js";

// #region spend-policy — docs: docs/specification/spend-policy.md#semantic-rules
/**
 * FAC-SEM-047 (DEC-0037): a project's spend policy is one the person could have chosen from what was
 * offered. The auto-approve threshold never exceeds the monthly limit; at most one offered option was
 * preselected; "no project limit" was chosen only where it was offered.
 */
export function spendPolicyRules(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const proposal = isObject(value.proposal) ? value.proposal : {};
  const options = Array.isArray(proposal.options) ? proposal.options.filter(isObject) : [];
  if (value.mode === "limited" && typeof value.limitUsd === "number" && typeof value.autoApproveUsd === "number" && value.autoApproveUsd > value.limitUsd) {
    findings.push({ code: "FAC-SEM-047", instancePath: "/autoApproveUsd", message: `the auto-approve threshold ${value.autoApproveUsd} exceeds the monthly limit ${value.limitUsd}` });
  }
  if (options.filter((o) => o.preselected === true).length > 1) {
    findings.push({ code: "FAC-SEM-047", instancePath: "/proposal/options", message: "more than one offered option is preselected" });
  }
  if (value.mode === "no-project-limit" && !options.some((o) => o.limitUsd === null)) {
    findings.push({ code: "FAC-SEM-047", instancePath: "/mode", message: "no project limit was chosen, but it was not among the offered options" });
  }
  return findings;
}

/**
 * FAC-SEM-048 (DEC-0038): a limited grant names each window once (total, task, project, day, week, month),
 * and neither its per-call maximum nor its auto-approve threshold exceeds its smallest window.
 */
export function grantSpendRules(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const spend = isObject(value.spend) ? value.spend : null;
  if (!spend || spend.mode !== "limited" || !Array.isArray(spend.limits)) return findings;
  const limits = spend.limits.filter(isObject);
  const seen = new Set<unknown>();
  limits.forEach((l, i) => {
    if (seen.has(l.window)) findings.push({ code: "FAC-SEM-048", instancePath: `/spend/limits/${i}/window`, message: `the window ${show(l.window)} is limited twice` });
    seen.add(l.window);
  });
  const amounts = limits.map((l) => l.limitUsd).filter((n): n is number => typeof n === "number");
  if (amounts.length) {
    const smallest = Math.min(...amounts);
    for (const key of ["perCallMaxUsd", "autoApproveUsd"] as const) {
      const v = spend[key];
      if (typeof v === "number" && v > smallest) findings.push({ code: "FAC-SEM-048", instancePath: `/spend/${key}`, message: `${key} ${v} exceeds the smallest window's limit ${smallest}` });
    }
  }
  return findings;
}
// #endregion spend-policy
