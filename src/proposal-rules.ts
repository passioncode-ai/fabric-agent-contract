import { type Finding, type JsonObject, isObject, show } from "./findings.js";
import { secretUrl, secretValue } from "./secret-shape.js";

// #region proposal-rules — docs: docs/specification/proposals.md
/**
 * Proposals and learning notes (DEC-0072, CON-OE-05; Fabric ADR-0029 and ADR-0109, with Fabric's corrections of
 * 2026-10-12). A rule is approved by a person; a proposal moves only along its decisions; a proposal about a private
 * agent never leaves; a personal or unknown learning note never feeds an organization rollout. Every rule answers
 * malformed input with findings or none, never by throwing.
 */

/** Each status and the statuses a decision may move it to. A terminal status moves nowhere. */
export const PROPOSAL_TRANSITIONS: ReadonlyMap<string, readonly string[]> = new Map([
  ["proposed", ["approved", "refused", "merged", "superseded"]],
  ["approved", ["applied", "superseded"]],
  ["applied", ["retired", "verified", "superseded"]],
  ["refused", []],
  ["merged", []],
  ["superseded", []],
  ["retired", []],
  ["verified", []],
]);

/** FAC-SEM-104 (kind `proposal`): a rule is approved by the operator on the Board — never a policy, never another role. */
function proposalFindings(value: JsonObject): Finding[] {
  if (value.type === "rule" && isObject(value.approvedBy) && value.approvedBy.role !== "operator") {
    return [{ code: "FAC-SEM-104", instancePath: "/approvedBy", message: "a rule for an agent is approved by the operator on the Board" }];
  }
  return [];
}

/** FAC-SEM-104 (kind `proposal-transition`, `{type, from, to}`): a decision moves a proposal along its graph; `verified` only for a fix. */
function transitionFindings(value: JsonObject): Finding[] {
  const next = typeof value.from === "string" ? PROPOSAL_TRANSITIONS.get(value.from) : undefined;
  if (!next || typeof value.to !== "string" || !next.includes(value.to)) {
    return [{ code: "FAC-SEM-104", instancePath: "/to", message: `a proposal does not move from ${show(value.from)} to ${show(value.to)}` }];
  }
  if (value.to === "verified" && value.type !== "fix") return [{ code: "FAC-SEM-104", instancePath: "/to", message: "only a fix is verified, when its source stops reporting the finding" }];
  return [];
}

/**
 * A path that names a home folder, which no proposal carries out of the estate: at the start, after `file://` (with or
 * without `localhost`), or after any character that cannot continue a path (a space, a quote, a backtick, a bracket, a
 * comma), so `docs/Users/x`, `src/home/page` and a folder in any script before `/home/` are not home folders.
 *
 * Scope (CT-109): FAC-SEM-103 only. Its boundary is the start of a path in slash form (`/Users/`, `/home/`, `~/`,
 * `C:\Users\`): a repository-relative path passes, and there is no dash form, so `-Users-<name>-` is not refused here.
 * It differs from `HOME_PATH` in `src/activity-rules.ts` (FAC-SEM-037, FAC-SEM-040, FAC-SEM-128 and FAC-SEM-138, which
 * also match relative slash forms and the dash form after a character that is not an ASCII letter or digit) and from
 * the device-common `detail` pattern (the dash form after any character). Changing any of the three is a decision.
 */
const HOME_PATH = new RegExp(String.raw`(?:^|file:\/\/(?:localhost)?|[^\p{L}\p{N}_.\-\/~@+])(?:\/Users\/|\/home\/|~\/|[A-Za-z]:\\Users\\)`, "u");

/**
 * Every string a proposal carries out: its URIs (`id`, `target.project`, `mergedInto`, `supersededBy`, `appliedIn`), its
 * goal, its change, its finding's id and text, its evidence references, the policy that approved it, the run that
 * verified it and its payload.
 */
function outgoingStrings(proposal: JsonObject): Array<[string, string]> {
  const strings: Array<[string, string]> = [];
  const add = (path: string, value: unknown) => {
    if (typeof value === "string") strings.push([path, value]);
    else if (Array.isArray(value)) value.forEach((item, i) => add(`${path}/${i}`, item));
    else if (isObject(value)) for (const [key, item] of Object.entries(value)) add(`${path}/${key.replace(/~/g, "~0").replace(/\//g, "~1")}`, item);
  };
  for (const key of ["id", "target", "mergedInto", "supersededBy", "appliedIn", "approvedBy"]) add(`/proposal/${key}`, proposal[key]);
  if (isObject(proposal.goal)) for (const key of ["id", "text"]) add(`/proposal/goal/${key}`, proposal.goal[key]);
  add("/proposal/change", proposal.change);
  if (isObject(proposal.finding)) for (const key of ["id", "text"]) add(`/proposal/finding/${key}`, proposal.finding[key]);
  (Array.isArray(proposal.evidence) ? proposal.evidence : []).forEach((item: unknown, i: number) => add(`/proposal/evidence/${i}/ref`, isObject(item) ? item.ref : undefined));
  add("/proposal/verifiedRun", proposal.verifiedRun);
  add("/proposal/payload", proposal.payload);
  return strings;
}

/**
 * FAC-SEM-103 (kind `proposal-submit`, `{proposal, to}`): a proposal leaves the estate only `to` an organization server or
 * an `export`; one about a private agent never leaves; an organization server receives an organization proposal that is
 * an approved or applied rule, or a live listing; and nothing leaving carries a secret or a home path. Filing a proposal
 * to its own project on the Board is not a submit.
 */
function submitFindings(value: JsonObject): Finding[] {
  const proposal = isObject(value.proposal) ? value.proposal : {};
  if (value.to !== "organization" && value.to !== "export") return [{ code: "FAC-SEM-103", instancePath: "/to", message: "a proposal leaves the estate only to an organization server or as an export" }];
  if (proposal.private === true) return [{ code: "FAC-SEM-103", instancePath: "/proposal/private", message: "a proposal about a private agent never leaves this estate" }];
  const findings: Finding[] = [];
  if (value.to === "organization") {
    const rule = proposal.type === "rule" && (proposal.status === "approved" || proposal.status === "applied");
    const listing = proposal.type === "listing" && (proposal.status === "proposed" || proposal.status === "approved" || proposal.status === "applied");
    if (!rule && !listing) findings.push({ code: "FAC-SEM-103", instancePath: "/proposal", message: "an organization server receives an approved rule or a live listing, nothing else" });
    else if (proposal.sourceClass !== "organization") findings.push({ code: "FAC-SEM-103", instancePath: "/proposal/sourceClass", message: "only a proposal from the organization's work goes to an organization server" });
  }
  for (const [path, text] of outgoingStrings(proposal)) {
    if (secretValue(text) || secretUrl(text)) findings.push({ code: "FAC-SEM-103", instancePath: path, message: "nothing leaving the estate carries a value shaped like a credential" });
    else if (HOME_PATH.test(text)) findings.push({ code: "FAC-SEM-103", instancePath: path, message: "nothing leaving the estate carries a home-folder path" });
  }
  return findings;
}

/** FAC-SEM-105 (kind `learning-rollout`, `{note, rollout}`): a personal or unknown note never feeds an organization rollout. */
function rolloutFindings(value: JsonObject): Finding[] {
  const note = isObject(value.note) ? value.note : {};
  if (value.rollout === "organization" && note.sourceClass !== "organization") {
    return [{ code: "FAC-SEM-105", instancePath: "/note/sourceClass", message: "only a note whose source is the organization's work feeds an organization rollout" }];
  }
  return [];
}

export function proposalRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (kind === "proposal") return proposalFindings(value);
  if (kind === "proposal-transition") return transitionFindings(value);
  if (kind === "proposal-submit") return submitFindings(value);
  if (kind === "learning-rollout") return rolloutFindings(value);
  return undefined;
}
// #endregion proposal-rules
