import { createHash } from "node:crypto";
import type { ValidateFunction } from "ajv/dist/2020.js";
import { rfc8785 } from "./canonical.js";
import { SCHEMA_PREFIX } from "./contract.js";
import { effectClosure } from "./delegation.js";
import { type Finding, type JsonObject, isObject } from "./findings.js";
import { type InsufficientDetail, type LevelContexts, type LevelDetail, type LevelRecord, levelContextsWellFormed, levelRules, levelShortOf, levelStanding } from "./levels.js";
import { CLOCK_SKEW_SECONDS, strictTime } from "./rfc3339.js";
import { createValidatorSync } from "./validator.js";

// #region mandate (docs: docs/specification/delegation.md#the-operators-mandate)
// DEC-0125: the operator's instruction for one task travels with the task. The agent leading it states a mandate from
// the operator's own words (MD-1); every call under it appends the agent it calls, with a scope never wider (MD-2); a
// callee that is the chain's last agent, called from T0 or T1 (by the agent before it, where it authenticated the
// caller's agent id), takes a call the mandate covers as
// the operator's decision (MD-3), and refuses only what it does not cover, so the operator is asked for that part alone
// (MD-4). A T2 caller's operator mandate changes nothing (MD-5); human steps and the money limits never travel (MD-6).
// DEC-0162 LV-6: a level mandate (`by: "level"`) is a level holder's words in an organization; a callee that reads
// levels takes it from any tier when the call's delegation token binds its attestation, within the holder's level.
// DEC-0166 AU-1 to AU-7: a place's autonomy profile is a standing mandate (`standing`), stated by the place's hub for
// each assignment at the profile's revision; a callee that declares `standing` reads it, from T2 only when the call's
// delegation token binds it by `prof`; it lives at most a day and never covers `autonomy.profile.set`.

/** The longest a mandate stands after the operator gave it. */
export const MANDATE_LIFETIME_SECONDS = 7 * 24 * 60 * 60;
/** The refusals a mandate meets, DL-19's codes with `data.detail` naming why. */
export const OUTSIDE_MANDATE = "operator-decision-required";
export const MANDATE_INVALID = "decision-invalid";
/** Effects past which a mandate must name the capabilities or actions it covers: every external effect. */
const READS_AND_DRAFTS = new Set(["none", "draft"]);
/** An effect no mandate covers: approving one's own promotion, grant, checker rule or policy change (AP-5). */
const NEVER_BY_MANDATE = "change-policy";
/** The longest a standing mandate stands: the hub restates it from the profile at least daily (DEC-0166 AU-3). */
export const STANDING_LIFETIME_SECONDS = 24 * 60 * 60;
/** The hub's action that sets a place's profile; no profile covers it, so no assignment raises its own autonomy (AU-5). */
export const PROFILE_SET_CAPABILITY = "autonomy.profile.set";

export interface MandateScope {
  capabilities?: string[];
  actions?: string[];
  effects: string[];
  perCallMaxUsd?: number;
  projects?: string[];
}
/** Where the operator said the words an agent relays (DEC-0126 OA-2): the project, and the session or the thread. */
export interface OperatorSource {
  project: string;
  session?: string;
  thread?: string;
}
/**
 * A place's standing mandate (DEC-0166 AU-1): the place, its kind and the profile's revision; in an organization's
 * context the level of the holder who set it (AU-2), which bounds what it covers at a service that declares levels.
 */
export interface Standing { place: string; placeKind: "headless" | "person"; revision: number; setLevel?: "owner" | "admin" | "architect" }
export interface Mandate {
  kind: "mandate/1";
  standing?: Standing;
  by: "operator" | "level";
  /** With `by: "level"` (DEC-0162 LV-6): the level, its organization and the holder's `org-membership/2` attestation. */
  level?: string;
  org?: string;
  membership?: JsonObject;
  task: string;
  instruction: string;
  at: string;
  source?: OperatorSource;
  expiresAt: string;
  scope: MandateScope;
  chain: Array<{ agent: string; at: string; scope?: MandateScope }>;
}

/** What a call asks the mandate to cover. */
export interface MandateCall {
  /** The tool (capability) called. */
  capability: string;
  /** The declared action's id, for a relayed action (extensions/actions/0.1). */
  action?: string;
  /** The call's effect class (governance's vocabulary). */
  effect: string;
  /** The callee's own estimate of what this call spends, USD; absent when it has none. */
  spendUsd?: number;
  /** The project the call acts in, when it acts in one. */
  project?: string;
  /** The lowest level that decides the call's action, as the callee declares it (DEC-0162 LV-7); read by a level mandate. */
  minLevel?: string;
}

export type OutsideDetail = "outside-mandate: capability" | "outside-mandate: action" | "outside-mandate: effect" | "outside-mandate: spend" | "outside-mandate: project";
export type InvalidDetail = "mandate-malformed" | "mandate-widened" | "mandate-expired" | "mandate-early" | "mandate-not-for-this-call" | "profile-unbound" | LevelDetail;
/** The profile a call was taken under (DEC-0166 AU-6): the place, the revision, the standing mandate's digest and, in an
 * organization's context, the setter's level. */
export interface ProfileRecord { place: string; revision: number; digest: string; setLevel?: "owner" | "admin" | "architect" }
export type MandateAnswer =
  | { ok: true; recordAs: { by: "operator"; via: "mandate" | "profile"; task: string; chain: string[]; source?: OperatorSource; profile?: ProfileRecord } }
  | { ok: true; recordAs: LevelRecord & { via: "mandate" | "profile"; task: string; chain: string[]; profile?: ProfileRecord } }
  | { ok: false; code: typeof OUTSIDE_MANDATE; data: { detail: OutsideDetail | InsufficientDetail; estimateUsd?: number; perCallMaxUsd?: number } }
  | { ok: false; code: typeof MANDATE_INVALID; data: { detail: InvalidDetail } }
  /** A T2 caller's operator mandate changes nothing: the callee applies the whole profile as if it were absent (MD-5).
   * A level mandate at a callee that reads no levels is ignored the same way, at every tier (LV-10). */
  | { ignored: "mandate-at-t2" | "levels-not-read" | "standing-not-read" }
  /** The callee's own fault, never sent: its clock does not read. */
  | { fault: "now-unreadable" | "levels-invalid" };

let shape: ValidateFunction | undefined;
const mandateShape = () => (shape ??= createValidatorSync().getSchema(`${SCHEMA_PREFIX}schemas/mandate.schema.json`) as ValidateFunction);

/** The scope in force: the last chain entry's that names one, or the mandate's own. */
export function effectiveScope(mandate: Mandate): MandateScope {
  for (let index = mandate.chain.length - 1; index >= 0; index -= 1) {
    const scope = mandate.chain[index]?.scope;
    if (scope) return scope;
  }
  return mandate.scope;
}

const listWithin = (child: string[] | undefined, parent: string[] | undefined) =>
  parent === undefined || (child !== undefined && child.every((item) => parent.includes(item)));
/** A per-call ceiling no higher: none in the child only when the parent names none. */
const ceilingWithin = (child: number | undefined, parent: number | undefined) => parent === undefined || (child !== undefined && child <= parent);

/**
 * A naming list (`capabilities`, `actions`) left out is "any" for a read or a draft but names no call for an external
 * effect or a relayed action (MD-3), so adding one where the scope in force has none could cover calls it did not
 * (DEC-0136 MD-2a). `actions` may be added where `capabilities` is listed: it then narrows the relayed actions those
 * name. The line is drawn at the list: `capabilities` added under `actions` alone is refused even within `draft`.
 */
const namingWithin = (child: MandateScope, parent: MandateScope) =>
  (parent.capabilities === undefined ? child.capabilities === undefined : listWithin(child.capabilities, parent.capabilities))
  && (parent.actions === undefined ? child.actions === undefined || parent.capabilities !== undefined : listWithin(child.actions, parent.actions));

/**
 * True when `child` asks for nothing `parent` does not give (MD-2): each list a subset, no naming list added where the
 * scope in force has none (MD-2a), the effects within, the ceiling no higher.
 */
export function scopeWithin(child: MandateScope, parent: MandateScope): boolean {
  const ceiling = effectClosure(parent.effects);
  return namingWithin(child, parent)
    && listWithin(child.projects, parent.projects)
    && child.effects.every((effect) => ceiling.has(effect))
    && ceilingWithin(child.perCallMaxUsd, parent.perCallMaxUsd);
}

/**
 * The digest a delegation token's `prof` claim carries for a standing mandate (DEC-0166 AU-3): sha256 of the RFC 8785
 * canonical JSON of the mandate without its `chain`, which grows at every hand-over while the profile does not. RFC 8785
 * has a form for a fractional ceiling (`perCallMaxUsd` 0.5); it throws on a lone surrogate, which `mandateProblem` refuses
 * as a malformed mandate first.
 */
export function profileDigest(mandate: Mandate): string {
  const { chain: _chain, ...stated } = mandate;
  return `sha256:${createHash("sha256").update(rfc8785(stated), "utf8").digest("hex")}`;
}

/** The first problem of a mandate as a document (FAC-SEM-144), or undefined. */
export function mandateProblem(mandate: unknown): "mandate-malformed" | "mandate-widened" | undefined {
  if (mandateShape()(mandate) !== true) return "mandate-malformed";
  const read = mandate as Mandate;
  const at = strictTime(read.at);
  const expires = strictTime(read.expiresAt);
  const lifetime = read.standing === undefined ? MANDATE_LIFETIME_SECONDS : STANDING_LIFETIME_SECONDS;
  if (Number.isNaN(at) || Number.isNaN(expires) || expires <= at || expires > at + lifetime * 1000) return "mandate-malformed";
  let held = read.scope;
  let last = at;
  for (const step of read.chain) {
    const stepAt = strictTime(step.at);
    if (Number.isNaN(stepAt) || stepAt < last || stepAt >= expires) return "mandate-malformed";
    last = stepAt;
    if (step.scope) {
      if (!scopeWithin(step.scope, held)) return "mandate-widened";
      held = step.scope;
    }
  }
  if (new Set(read.chain.map((step) => step.agent)).size !== read.chain.length) return "mandate-malformed";
  // A standing mandate whose profile has no canonical form (a lone surrogate) has no digest, so no token binds it.
  if (read.standing !== undefined) {
    try { profileDigest(read); } catch { return "mandate-malformed"; }
  }
  return undefined;
}

/**
 * Whether a callee takes one call as the operator's decision under a mandate (DEC-0125 MD-3 to MD-5), after it has
 * placed the caller's tier (DL-25). `self` is the callee's own agent id: the mandate is for this call only when the
 * chain ends in it. `callerAgent` is the caller's agent id when the callee authenticated one (a per-agent credential,
 * a delegation token's outermost actor, the hub's attested origin); it must then be the agent before `self`. Without
 * one (the shared descriptor token on loopback) the chain's end alone binds the mandate (MD-3). A T2 caller's operator
 * mandate is ignored; a level mandate is read at every tier by a callee given `levels` (DEC-0162 LV-6). An invalid, widened, expired, not yet given or misaddressed mandate is `decision-invalid`; a valid one that
 * does not cover the call is `operator-decision-required`, its detail naming the first part not covered (MD-4).
 */
export function mandateCovers(input: {
  mandate: unknown;
  tier: unknown;
  now: unknown;
  self: unknown;
  callerAgent?: unknown;
  call: MandateCall;
  /** The organizations this callee reads levels in (DEC-0162); absent, it reads none and ignores a level mandate. */
  levels?: LevelContexts;
  /** The `mem` claim of the call's delegation token (LV-5). */
  tokenMem?: unknown;
  /** True when this callee declares `standing` (DEC-0166 AU-3); absent, it reads no standing mandate. */
  standing?: boolean;
  /** The `prof` claim of the call's delegation token (AU-3), absent when it presented none. */
  tokenProf?: unknown;
}): MandateAnswer {
  const { mandate, tier, now, self, callerAgent, call } = input;
  const clock = strictTime(now);
  if (Number.isNaN(clock)) return { fault: "now-unreadable" };
  const byLevel = typeof mandate === "object" && mandate !== null && (mandate as { by?: unknown }).by === "level";
  // Level contexts given but malformed are the callee's own fault, never "reads no levels" (actionDecision's levels-invalid).
  if (input.levels !== undefined && !levelContextsWellFormed(input.levels)) return { fault: "levels-invalid" };
  // A non-object `standing` is no standing mandate: the schema refuses it (mandate-malformed) wherever it arrives.
  const standing = isObject(mandate) && isObject(mandate.standing);
  if (standing && input.standing !== true) return { ignored: "standing-not-read" };
  if (byLevel && !isObject(input.levels)) return { ignored: "levels-not-read" };
  const inside = tier === "T0" || tier === "T1";
  // A standing mandate from T2 needs the token's `prof` (AU-3), whoever stated it; without one it changes nothing, as
  // MD-5 says. A task's operator mandate from T2 changes nothing either.
  if (!inside && (standing ? input.tokenProf === undefined : !byLevel)) return { ignored: "mandate-at-t2" };
  const problem = mandateProblem(mandate);
  if (problem) return { ok: false, code: MANDATE_INVALID, data: { detail: problem } };
  const read = mandate as Mandate;
  // mandateProblem refused a profile with no canonical form, so its digest is defined here.
  const digest = standing ? profileDigest(read) : undefined;
  if (standing && input.tokenProf !== undefined && input.tokenProf !== digest) return { ok: false, code: MANDATE_INVALID, data: { detail: "profile-unbound" } };
  const holders = read.chain.map((step) => step.agent);
  if (holders.length < 2 || holders[holders.length - 1] !== self || (callerAgent !== undefined && holders[holders.length - 2] !== callerAgent)) {
    return { ok: false, code: MANDATE_INVALID, data: { detail: "mandate-not-for-this-call" } };
  }
  if (strictTime(read.at) > clock + CLOCK_SKEW_SECONDS * 1000) return { ok: false, code: MANDATE_INVALID, data: { detail: "mandate-early" } };
  if (clock >= strictTime(read.expiresAt)) return { ok: false, code: MANDATE_INVALID, data: { detail: "mandate-expired" } };
  const scope = effectiveScope(read);
  const outside = (detail: OutsideDetail): MandateAnswer => ({ ok: false, code: OUTSIDE_MANDATE, data: { detail } });
  // AU-5: no mandate sets a place's profile, so no assignment raises its own autonomy.
  if (call.capability === PROFILE_SET_CAPABILITY || call.action === PROFILE_SET_CAPABILITY) return outside("outside-mandate: capability");
  if (call.action !== undefined && scope.actions !== undefined && !scope.actions.includes(call.action)) return outside("outside-mandate: action");
  if (call.action !== undefined && scope.actions === undefined && scope.capabilities === undefined) return outside("outside-mandate: action");
  if (scope.capabilities !== undefined && !scope.capabilities.includes(call.capability)) return outside("outside-mandate: capability");
  if (call.effect === NEVER_BY_MANDATE || !effectClosure(scope.effects).has(call.effect)) return outside("outside-mandate: effect");
  // An external effect needs the call named: a relayed action by `actions` or `capabilities`, any other call by
  // `capabilities`, since `actions` covers relayed actions only.
  if (!READS_AND_DRAFTS.has(call.effect) && scope.capabilities === undefined && (call.action === undefined || scope.actions === undefined)) return outside("outside-mandate: capability");
  if (scope.perCallMaxUsd !== undefined && (call.spendUsd === undefined || call.spendUsd > scope.perCallMaxUsd)) {
    return { ok: false, code: OUTSIDE_MANDATE, data: { detail: "outside-mandate: spend", ...(call.spendUsd === undefined ? {} : { estimateUsd: call.spendUsd }), perCallMaxUsd: scope.perCallMaxUsd } };
  }
  if (call.project !== undefined && scope.projects !== undefined && !scope.projects.includes(call.project)) return outside("outside-mandate: project");
  // AU-2: a profile an organization's level holder set covers no action its service declares above that level (LV-7).
  const setLevel = standing ? (read.standing as Standing).setLevel : undefined;
  // An architect's level stands only in its projects: a profile it set that names none covers no call in a project. The
  // stated profile's own scope decides (what `prof` binds), never a hand-over step's, which may add `projects` (MD-2).
  if (setLevel === "architect" && read.scope.projects === undefined && call.project !== undefined) return outside("outside-mandate: project");
  const short = setLevel === undefined ? undefined : levelShortOf(setLevel, call.minLevel, call.project !== undefined);
  if (short !== undefined) return { ok: false, code: OUTSIDE_MANDATE, data: { detail: short } };
  // AU-6: a call under a profile is recorded `via: profile` with the place, the revision and the digest.
  const profile = standing
    ? { via: "profile" as const, task: read.task, chain: holders, profile: { place: (read.standing as Standing).place, revision: (read.standing as Standing).revision, digest: digest as string, ...(setLevel === undefined ? {} : { setLevel }) } }
    : { via: "mandate" as const, task: read.task, chain: holders };
  if (byLevel) {
    // LV-6: the level stands as the operator's word only inside its scope, after every check of the mandate itself.
    const levelAnswer = levelStanding({
      membership: read.membership, org: read.org as string, level: read.level as string, at: read.at,
      ...(call.project === undefined ? {} : { project: call.project }), ...(call.minLevel === undefined ? {} : { minLevel: call.minLevel }),
      contexts: input.levels as LevelContexts, tokenMem: input.tokenMem, now: clock
    });
    if (!levelAnswer.ok) {
      return "invalid" in levelAnswer
        ? { ok: false, code: MANDATE_INVALID, data: { detail: levelAnswer.invalid } }
        : { ok: false, code: OUTSIDE_MANDATE, data: { detail: levelAnswer.insufficient } };
    }
    const { approver, membershipDigest, revision, level, org } = levelAnswer;
    return { ok: true, recordAs: { by: "level", level, org, ...(call.project === undefined ? {} : { project: call.project }), approver, membershipDigest, revision, ...profile } };
  }
  // Where the operator said it travels into the record, as the reason the callee acted (DEC-0126 OA-6).
  return { ok: true, recordAs: { by: "operator", ...profile, ...(read.source ? { source: { ...read.source } } : {}) } };
}

/**
 * The mandate an agent sends with a call (MD-2): the chain gains the agent it calls, with `narrower` when it hands on
 * less. Throws when the result would not be a valid mandate: a wider scope, a fifth agent, an agent already in it.
 */
export function handOn(mandate: Mandate, callee: string, at: string, narrower?: MandateScope): Mandate {
  const next: Mandate = { ...mandate, chain: [...mandate.chain, narrower ? { agent: callee, at, scope: narrower } : { agent: callee, at }] };
  const problem = mandateProblem(next);
  if (problem) throw new Error(`the mandate cannot be handed on: ${problem}`);
  return next;
}

/**
 * FAC-SEM-173 (DEC-0166 AU-5): a standing mandate whose scope, or a chain step's, names `autonomy.profile.set` among
 * its capabilities or actions, or `change-policy` among its effects: a profile never sets a profile.
 */
function standingFindings(mandate: Mandate): Finding[] {
  if (mandate.standing === undefined) return [];
  const scopes: Array<[string, MandateScope]> = [["/scope", mandate.scope], ...mandate.chain.flatMap((step, i): Array<[string, MandateScope]> => (step.scope ? [[`/chain/${i}/scope`, step.scope]] : []))];
  const architect: Finding[] = mandate.standing.setLevel === "architect" && mandate.scope.projects === undefined
    ? [{ code: "FAC-SEM-173", instancePath: "/scope", message: "a profile an architect set names its projects in the scope: an architect's level stands only for them (DEC-0166 AU-2, DEC-0162 LV-2)" }]
    : [];
  return [...architect, ...scopes.flatMap(([path, scope]) =>
    scope.capabilities?.includes(PROFILE_SET_CAPABILITY) || scope.actions?.includes(PROFILE_SET_CAPABILITY) || scope.effects.includes(NEVER_BY_MANDATE)
      ? [{ code: "FAC-SEM-173", instancePath: path, message: `a standing mandate never covers ${PROFILE_SET_CAPABILITY} or ${NEVER_BY_MANDATE}: no profile sets a profile (DEC-0166 AU-5)` }]
      : [])];
}

/** FAC-SEM-144 on kind `mandate` (the document itself); FAC-SEM-170 and FAC-SEM-173 on a valid one. */
export function mandateRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (kind === "mandate") {
    const problem = mandateProblem(value);
    // DEC-0162: a level mandate's attestation, checked without a key (FAC-SEM-170, src/levels.ts).
    const level = problem === "mandate-malformed" ? [] : (levelRules(kind, value) as Finding[]);
    const standing = problem === "mandate-malformed" ? [] : standingFindings(value as unknown as Mandate);
    return [...(problem ? [{ code: "FAC-SEM-144", instancePath: "", message: `the mandate is not valid: ${problem} (DEC-0125 MD-1, MD-2; DEC-0136 MD-2a)` }] : []), ...level, ...standing];
  }
  return undefined;
}
// #endregion mandate
