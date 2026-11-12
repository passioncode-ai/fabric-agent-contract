import { type Finding, type JsonObject, isObject, show } from "./findings.js";
import { type HeldMembership, ORG, ORG_MEMBERSHIP_2_TYPE, heldMembershipOk, orgKeySetWellFormed, verifyOrgMembership } from "./org-membership.js";
import { strictTime } from "./rfc3339.js";

/** The levels a service may declare an action needs (DEC-0162 LV-7), in its authority extension's `actionLevels`. */
export const ACTION_LEVELS = ["operator", "owner", "admin", "architect"] as const;

// #region levels (docs: docs/specification/membership.md#levels)
// DEC-0162: the role of an accepted `org-membership/2` attestation is its holder's level in that organization, for
// decisions only (LV-2). A level decision (decision.schema.json's level form, LV-3) or a level mandate (mandate/1 with
// `by: "level"`, LV-6) stands as the operator's word inside its scope when the attestation verifies for the reading
// service, is active, covers the level and, for an architect, the project, and when the call's delegation token binds
// it by `mem` (LV-4, LV-5). `levelStanding` is that check, shared by `actionDecision` and `mandateCovers`.

/** The levels a decision or a mandate may name, highest first; `member` decides nothing by its level (LV-2). */
export const DECIDING_LEVELS: readonly string[] = ["owner", "admin", "architect"];
const RANK: ReadonlyMap<string, number> = new Map([["owner", 3], ["admin", 2], ["architect", 1], ["member", 0]]);

/** What a service holds to read levels in one organization: who it is at that issuer, and the key set it applied. */
export interface LevelContext {
  /** The audience the organization's issuer names this service by. */
  audience: string;
  /** The organization's key set the service applied under the root its estate pins (`verifyOrgKeySet`). */
  keySet: JsonObject;
  /** The attestation it holds for each subject it has read, by subject (OM-4), so an older revision after a later
   * one (an `ended` one included) is refused `stale-revision`. */
  held?: Record<string, HeldMembership>;
}
/** The organizations a service reads levels in, by `org:<orgId>`. Absent: the service reads no level (LV-10). */
export type LevelContexts = Record<string, LevelContext>;

/**
 * Whether a service's level contexts are its own well-formed configuration: a map keyed by `org:<orgId>` whose every
 * entry names an audience, carries a well-formed key set of that organization, and holds attestations (if any) by
 * subject, each `{subject, revision, digest}` under its own subject. A malformed one is the service's fault
 * (`levels-invalid`), never a caller's `level-membership: context-invalid`, which stays the answer for an organization
 * absent from the map (LV-10).
 */
export function levelContextsWellFormed(levels: unknown): boolean {
  return isObject(levels) && Object.entries(levels).every(([org, entry]) =>
    ORG.test(org) && isObject(entry) && typeof entry.audience === "string" && entry.audience.length > 0 &&
    isObject(entry.keySet) && orgKeySetWellFormed(entry.keySet) && entry.keySet.org === org &&
    (entry.held === undefined || (isObject(entry.held) && Object.entries(entry.held).every(([subject, held]) => heldMembershipOk(held) && isObject(held) && held.subject === subject))));
}

/** Why a level does not stand, as `data.detail` names it (LV-10). */
export type LevelDetail =
  | `level-membership: ${string}`
  | "level-unbound"
  | "level-audience"
  | "level-expired"
  | "level-role";
/** The level a call needs and the holder does not have: `operator-decision-required` with this detail (LV-10). */
export type InsufficientDetail = "level-insufficient: admin" | "level-insufficient: owner" | "level-insufficient: operator";

export type LevelStanding =
  | { ok: true; level: string; org: string; approver: string; membershipDigest: string; revision: number; projects: string[] }
  | { ok: false; invalid: LevelDetail }
  | { ok: false; insufficient: InsufficientDetail };

/** The level's record (LV-9): who decided at what level, by the attestation's pairwise subject and digest. */
export interface LevelRecord {
  by: "level";
  level: string;
  org: string;
  project?: string;
  approver: string;
  membershipDigest: string;
  revision: number;
}

/**
 * Whether a level stands for one call (DEC-0162 LV-4, LV-5, LV-11), in this order: the attestation verifies under the
 * service's key set for that organization with this service as its audience (a reader of `/2`), and is `active`; the
 * call's delegation token binds it (`mem` is its digest); the decision was made before it expires; the level is at
 * most the attestation's role. Then the level covers the call: at least `minLevel` when the service's action declares
 * one (`owner` for a billing act, LV-7; `operator`, an act no level decides), at least `admin` for a call in no project, and for an `architect` attestation
 * the call's project among its projects (an owner or an admin deciding at the architect level is bounded by the call's
 * project alone). A level mandate's scope `projects` are checked against the attestation by `FAC-SEM-170`, each call's
 * project here. It answers and never throws.
 */
export function levelStanding(input: {
  membership: unknown;
  org: string;
  level: string;
  /** When the holder decided or gave the mandate, RFC 3339. */
  at: string;
  /** The project the call acts in, the service's own knowledge; absent for a call in no project. */
  project?: string;
  contexts: LevelContexts;
  /** The `mem` claim of the call's delegation token, absent when the call presented none. */
  tokenMem?: unknown;
  /** The lowest level that decides this action, as the service declares it (`owner` for a billing act, `operator` for
   * an act no level decides); absent: the project rule alone. */
  minLevel?: string;
  now: number;
}): LevelStanding {
  const { membership, org, level, at, project, contexts, tokenMem, now } = input;
  const context = isObject(contexts) && Object.hasOwn(contexts, org) ? contexts[org] : undefined;
  const subject = isObject(membership) && typeof membership.subject === "string" ? membership.subject : undefined;
  const heldBySubject = isObject(context) && isObject(context.held) && subject !== undefined && Object.hasOwn(context.held, subject) ? (context.held as Record<string, HeldMembership>)[subject] : undefined;
  const verdict = verifyOrgMembership(membership, {
    now: new Date(now),
    org,
    audience: isObject(context) ? (context.audience as string) : "",
    keySet: isObject(context) ? context.keySet : ({} as JsonObject),
    ...(heldBySubject !== undefined ? { held: heldBySubject } : {}),
    levels: true
  });
  if (!verdict.ok) {
    if (verdict.problem === "wrong-audience") return { ok: false, invalid: "level-audience" };
    if (verdict.problem === "expired") return { ok: false, invalid: "level-expired" };
    return { ok: false, invalid: `level-membership: ${verdict.problem}` };
  }
  if (verdict.type !== ORG_MEMBERSHIP_2_TYPE) return { ok: false, invalid: "level-membership: malformed" };
  // LV-11: an ended membership ends its level at once, even inside the decision's window.
  if (verdict.status !== "active") return { ok: false, invalid: "level-membership: ended" };
  if (tokenMem !== verdict.digest) return { ok: false, invalid: "level-unbound" };
  if (!(strictTime(at) < strictTime(verdict.expiresAt as string))) return { ok: false, invalid: "level-expired" };
  // A verified role is one of LEVEL_ROLES, so it has a rank; a level that is not a deciding one has none here.
  const rank = DECIDING_LEVELS.includes(level) ? (RANK.get(level) as number) : Number.POSITIVE_INFINITY;
  if (rank > (RANK.get(verdict.role) as number)) return { ok: false, invalid: "level-role" };
  // A verified `/2` always carries `projects` (empty but for an architect, LV-1).
  const projects = verdict.projects as string[];
  // LV-7: an act the service keeps for the operator alone is decided by no level (a client key, DEC-0159 CF-3). A level
  // that is not one of ACTION_LEVELS is read as the strictest, so a mistyped declaration never opens an act.
  if (input.minLevel === "operator" || (input.minLevel !== undefined && !(ACTION_LEVELS as readonly string[]).includes(input.minLevel))) return { ok: false, insufficient: "level-insufficient: operator" };
  // LV-7: a billing act is the owner's; LV-4: a call in no project is decided at owner or admin.
  if (input.minLevel === "owner" && rank < (RANK.get("owner") as number)) return { ok: false, insufficient: "level-insufficient: owner" };
  if ((input.minLevel === "admin" || project === undefined) && rank < (RANK.get("admin") as number)) return { ok: false, insufficient: "level-insufficient: admin" };
  if (verdict.role === "architect" && project !== undefined && !projects.includes(project)) return { ok: false, insufficient: "level-insufficient: admin" };
  return { ok: true, level, org, approver: verdict.held.subject, membershipDigest: verdict.digest, revision: verdict.held.revision, projects };
}

// ---- FAC-SEM-170 -------------------------------------------------------------------------------------------------

type Flag = (instancePath: string, message: string) => void;

/**
 * The parts of a level decision or mandate a document shows without a key (DEC-0162 LV-3, LV-6): the attestation is
 * `org-membership/2` of the same organization, its role covers the level, it was valid when the holder decided, and an
 * architect decides only in its projects (`projects`: the decision's project, or the projects a mandate's scope lists).
 */
function levelDocument(value: JsonObject, projects: unknown[] | undefined, at: string, flag: Flag): void {
  const membership = value.membership;
  if (!isObject(membership) || membership.type !== ORG_MEMBERSHIP_2_TYPE) {
    flag("/membership", "a level decision carries the holder's org-membership/2 attestation");
    return;
  }
  if (membership.org !== value.org) flag("/org", `the level is in ${show(membership.org)}, the attestation's organization, not ${show(value.org)}`);
  const level = RANK.get(value.level as string) ?? 4;
  const role = RANK.get(membership.role as string) ?? -1;
  if (level > role) flag("/level", `the attestation's role ${show(membership.role)} does not cover the level ${show(value.level)}`);
  const decided = strictTime(at);
  if (!(decided < strictTime(membership.expiresAt))) flag("/at", "the holder decides before the attestation's expiresAt");
  if (value.level === "architect") {
    // An owner or an admin deciding at the architect level is bounded by the call's project alone (LV-2).
    const own = membership.role === "architect" ? (Array.isArray(membership.projects) ? membership.projects : []) : undefined;
    // An architect attestation decides only in its projects, so it names them; an owner or an admin need not (LV-2).
    if (own !== undefined) {
      if (projects === undefined || projects.length === 0) flag("/level", "an architect decides only in its projects: the decision names one, a mandate's scope lists them");
      else for (const project of projects) if (!own.includes(project)) flag("/membership/projects", `the project ${show(project)} is not among the architect's projects`);
    }
  }
}

/** FAC-SEM-170 on kind `decision` (a level decision) and on kind `mandate` (a level mandate); undefined for any other kind. */
export function levelRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (kind !== "decision" && kind !== "mandate") return undefined;
  const findings: Finding[] = [];
  if (value.by !== "level") return findings;
  const flag: Flag = (instancePath, message) => findings.push({ code: "FAC-SEM-170", instancePath, message });
  if (kind === "decision") levelDocument(value, value.project === undefined ? undefined : [value.project], value.at as string, flag);
  else {
    const scope = isObject(value.scope) ? value.scope : {};
    levelDocument(value, Array.isArray(scope.projects) ? scope.projects : undefined, value.at as string, flag);
  }
  return findings;
}
// #endregion levels
