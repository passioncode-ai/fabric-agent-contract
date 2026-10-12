import { type Finding, type JsonObject, isObject } from "./findings.js";

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

/** FAC-SEM-104 (kind `proposal`): a rule is approved by a person's role, never by a policy. */
function proposalFindings(value: JsonObject): Finding[] {
  if (value.type === "rule" && isObject(value.approvedBy) && value.approvedBy.policy !== undefined) {
    return [{ code: "FAC-SEM-104", instancePath: "/approvedBy", message: "a rule for an agent is approved by a person on the Board, never by a policy" }];
  }
  return [];
}

/** FAC-SEM-104 (kind `proposal-transition`, `{type, from, to}`): a decision moves a proposal along its graph; `verified` only for a fix. */
function transitionFindings(value: JsonObject): Finding[] {
  const next = typeof value.from === "string" ? PROPOSAL_TRANSITIONS.get(value.from) : undefined;
  if (!next || typeof value.to !== "string" || !next.includes(value.to)) {
    return [{ code: "FAC-SEM-104", instancePath: "/to", message: `a proposal does not move from ${String(value.from)} to ${String(value.to)}` }];
  }
  if (value.to === "verified" && value.type !== "fix") return [{ code: "FAC-SEM-104", instancePath: "/to", message: "only a fix is verified, when its source stops reporting the finding" }];
  return [];
}

/**
 * FAC-SEM-103 (kind `proposal-submit`, `{proposal, to}`, `to` `organization` or `export`): a proposal about a private agent
 * is never submitted or exported; to an organization server goes only an approved (or applied) rule, or a listing.
 */
function submitFindings(value: JsonObject): Finding[] {
  const proposal = isObject(value.proposal) ? value.proposal : {};
  if (proposal.private === true) return [{ code: "FAC-SEM-103", instancePath: "/proposal/private", message: "a proposal about a private agent never leaves this estate" }];
  if (value.to === "organization") {
    const rule = proposal.type === "rule" && (proposal.status === "approved" || proposal.status === "applied");
    if (!rule && proposal.type !== "listing") return [{ code: "FAC-SEM-103", instancePath: "/proposal", message: "an organization server receives an approved rule or a listing, nothing else" }];
  }
  return [];
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
