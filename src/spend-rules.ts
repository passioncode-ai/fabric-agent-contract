import { type Finding, type JsonObject, isObject } from "./findings.js";

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
// #endregion spend-policy
