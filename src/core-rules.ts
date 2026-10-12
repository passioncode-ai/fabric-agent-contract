import { type Finding, type JsonObject, isObject } from "./findings.js";
import { strictTime } from "./rfc3339.js";

// #region core-rules — docs: docs/specification/results-and-evidence.md, governance-and-roles.md, versioning.md
/**
 * The 0.1.0 core keeps its promises (DEC-0064): the claim/proof relation of a result (DEC-0011), approval separation for
 * learning and promotion (DEC-0004, DEC-0012), a version's rollback basis and parents (DEC-0007), and a standing grant's
 * window (DEC-0008). Every rule reads malformed input as findings or none, never by throwing.
 */

const list = (value: unknown): JsonObject[] => (Array.isArray(value) ? value.filter(isObject) : []);
const isString = (value: unknown): value is string => typeof value === "string";
const revisionOf = (ref: unknown): number | undefined => (isObject(ref) && Number.isSafeInteger(ref.revision) ? (ref.revision as number) : undefined);

/**
 * FAC-SEM-093: each done claim has its own id, every proof names done claims, and every done claim without proof is
 * listed in `notVerified` by its id. A finding names the done item's own index.
 */
function resultIntegrity(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const done = (Array.isArray(value.done) ? value.done : []).map((item: unknown, index: number) => ({ claimId: isObject(item) ? item.claimId : undefined, index })).filter((item): item is { claimId: string; index: number } => isString(item.claimId));
  const doneIds = new Set<string>();
  done.forEach(({ claimId, index }) => {
    if (doneIds.has(claimId)) findings.push({ code: "FAC-SEM-093", instancePath: `/done/${index}/claimId`, message: `claim id ${claimId} names two done claims; each done claim has its own id` });
    doneIds.add(claimId);
  });
  const proven = new Set<string>();
  list(value.proof).forEach((proof, p) => {
    (Array.isArray(proof.claimIds) ? proof.claimIds : []).forEach((claimId: unknown, c: number) => {
      if (!isString(claimId) || !doneIds.has(claimId)) {
        findings.push({ code: "FAC-SEM-093", instancePath: `/proof/${p}/claimIds/${c}`, message: "a proof names a claim this result does not report as done" });
      } else proven.add(claimId);
    });
  });
  const listed = new Set(list(value.notVerified).map((item) => item.claim).filter(isString));
  const reported = new Set<string>();
  done.forEach(({ claimId, index }) => {
    if (reported.has(claimId)) return;
    reported.add(claimId);
    if (!proven.has(claimId) && !listed.has(claimId)) {
      findings.push({ code: "FAC-SEM-093", instancePath: `/done/${index}`, message: `claim ${claimId} has no proof and is not listed in notVerified by its id` });
    }
  });
  return findings;
}

/** FAC-SEM-094: an approved learning proposal or promotion names its approver, who is not its author. */
function approvalSeparation(value: JsonObject): Finding[] {
  if (value.state !== "approved") return [];
  const author = isObject(value.meta) ? value.meta.createdBy : undefined;
  if (!isString(value.approvedBy)) return [{ code: "FAC-SEM-094", instancePath: "/approvedBy", message: "an approved record names who approved it" }];
  if (value.approvedBy === author) return [{ code: "FAC-SEM-094", instancePath: "/approvedBy", message: "the author of a learning proposal or a promotion never approves it" }];
  return [];
}

/** FAC-SEM-096: a rollback names an earlier revision of the same setting, and every parent is earlier. */
function rollback(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const meta = isObject(value.meta) ? value.meta : {};
  const own = Number.isSafeInteger(meta.revision) ? (meta.revision as number) : undefined;
  if (value.rollbackBasis !== undefined) {
    const basis = value.rollbackBasis;
    const basisRevision = revisionOf(basis);
    if (!isObject(basis) || basis.id !== meta.id) findings.push({ code: "FAC-SEM-096", instancePath: "/rollbackBasis/id", message: "a rollback returns to a revision of the same setting" });
    if (own === undefined || basisRevision === undefined || basisRevision >= own) findings.push({ code: "FAC-SEM-096", instancePath: "/rollbackBasis/revision", message: "a rollback returns to an earlier revision" });
  }
  list(value.parents).forEach((parent, index) => {
    const parentRevision = revisionOf(parent);
    if (own === undefined || parentRevision === undefined || parentRevision >= own) findings.push({ code: "FAC-SEM-096", instancePath: `/parents/${index}/revision`, message: "every parent is an earlier revision" });
  });
  return findings;
}

/**
 * FAC-SEM-097: a standing grant's window is positive (`expiresAt` after `startsAt`, both strict RFC 3339) and, given the
 * evaluation time `at`, an `active` grant is inside it. Input: a grant, or `{grant, at}`.
 */
function grantWindow(value: JsonObject): Finding[] {
  const grant = isObject(value.grant) ? value.grant : value;
  const prefix = isObject(value.grant) ? "/grant" : "";
  const startsAt = strictTime(grant.startsAt);
  const expiresAt = strictTime(grant.expiresAt);
  if (Number.isNaN(startsAt)) return [{ code: "FAC-SEM-097", instancePath: `${prefix}/startsAt`, message: "startsAt is an RFC 3339 date-time with an offset" }];
  if (Number.isNaN(expiresAt)) return [{ code: "FAC-SEM-097", instancePath: `${prefix}/expiresAt`, message: "expiresAt is an RFC 3339 date-time with an offset" }];
  if (expiresAt <= startsAt) return [{ code: "FAC-SEM-097", instancePath: `${prefix}/expiresAt`, message: "a grant expires after it starts" }];
  if (value.at !== undefined && grant.state === "active") {
    const at = strictTime(value.at);
    if (Number.isNaN(at)) return [{ code: "FAC-SEM-097", instancePath: "/at", message: "the evaluation time is an RFC 3339 date-time" }];
    if (at < startsAt || at >= expiresAt) return [{ code: "FAC-SEM-097", instancePath: `${prefix}/state`, message: "an active grant is inside its window at the evaluation time" }];
  }
  return [];
}

export function coreRules(kind: string, value: unknown): Finding[] | undefined {
  if (!isObject(value)) return undefined;
  if (kind === "result") return resultIntegrity(value);
  if (kind === "learning" || kind === "promotion") return approvalSeparation(value);
  if (kind === "versioned-setting") return rollback(value);
  if (kind === "grant-window") return grantWindow(value);
  return undefined;
}
// #endregion core-rules
