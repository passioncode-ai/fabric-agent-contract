import { isDeepStrictEqual } from "node:util";
import type { ErrorObject, ValidateFunction } from "ajv/dist/2020.js";
import { SCHEMA_PREFIX } from "./contract.js";
import { EXTENSION_KEYS } from "./extensions.js";
import { type Finding, type JsonObject, isObject } from "./findings.js";
import { CLOCK_SKEW_SECONDS, strictTime } from "./rfc3339.js";
import { type LevelContexts, type LevelRecord, levelContextsWellFormed, levelStanding, ACTION_LEVELS, CALL_CONTEXT } from "./levels.js";
import { EFFECT_CLASSES } from "./delegation.js";
import { type OperatorSource, type ProfileRecord, mandateCovers } from "./mandate.js";
import { createValidatorSync } from "./validator.js";

// #region actions (docs: docs/specification/service.md#actions)
// DEC-0121 (action parity): every action a service's dashboard, app or page lets a person take has a tool on its agent
// surface (AP-1), declared under extensions/actions/0.1; a `relayed` action from a T0 or T1 caller is taken as the
// operator's when the call carries the operator's decision in `_meta.decision` (AP-2); a `human` action answers
// `human-step-required` with its step (AP-4). `actionDecision` is the reference a service's tool runs before it acts.
// DEC-0162: a level holder's decision or mandate, bound to the call by its delegation token's `mem`, stands as the
// operator's at every tier inside the holder's level (LV-4 to LV-6), at a service that reads levels.

/** The three refusals DEC-0121 adds to DL-19's one code set, and DL-17's refusal a T2 caller still gets. */
export const OPERATOR_DECISION_REQUIRED = "operator-decision-required";
export const DECISION_INVALID = "decision-invalid";
export const HUMAN_STEP_REQUIRED = "human-step-required";
export const APPROVAL_REQUIRED = "approval-required";

export type ActionGate = "none" | "relayed" | "human";
export type HumanStep = "sign-in" | "consent" | "payment" | "secret" | "spend-above-limit" | "passkey" | "comparison";
/** The caller's trust tier (delegation DL-25). Anything a callee cannot place in T0 or T1 is T2. */
export type CallerTier = "T0" | "T1" | "T2";

/** One entry of `actions[]` (`service-actions-extension.schema.json#/$defs/action`). */
export interface DeclaredAction { id: string; title: string; tool: string; gate: ActionGate; humanStep?: HumanStep }
/** The levels an action may need, as the authority extension declares them (DEC-0162 LV-7). */
export { ACTION_LEVELS } from "./levels.js";

export interface ActionDecisionInput {
  /** The service's own declaration of the action being called. */
  action?: unknown;
  /** The caller's tier, as the callee placed it (DL-25). */
  tier?: unknown;
  /** The service's authenticated identity of the caller: what it records as the relaying caller, never a claim in the call. */
  caller?: unknown;
  /** The call's `_meta.decision` (or `agent.call`'s `decision`), as received. */
  decision?: unknown;
  /** The one object the call acts on, as the service identifies it, when the action acts on one. */
  target?: unknown;
  /** The service's own record that its elicitation for this call was shown and the person accepted it (C3.3). */
  elicited?: unknown;
  /** The outcome of `verifyApproval` for an `approval/1` the call presented (DL-18), when it accepted one. */
  approval?: unknown;
  /** The action's digest (DL-18), sent with `approval-required` to a T2 caller that presented no approval. */
  actionDigest?: unknown;
  /** The direct link to the person's step of a `human` action (AP-4). */
  humanStepUrl?: unknown;
  /** The service's clock, RFC 3339 (required for a `relayed` action). */
  now?: unknown;
  /** The call's `_meta.mandate` (or `call.mandate`), as received (DEC-0125); read only when the call carries no decision. */
  mandate?: unknown;
  /** The service's own agent id, which a mandate's chain must end in (DEC-0125 MD-3); required to read a mandate. */
  self?: unknown;
  /** The caller's agent id, when the service authenticated one (a per-agent credential, a delegation token's outermost
   * actor, the hub's attested origin); a mandate's chain must then name it before `self`. */
  callerAgent?: unknown;
  /** The action's effect class, the service's own knowledge, required to read a mandate or a level decision (DEC-0162
   * LV-7: a `change-policy` action is read as declared `admin` at least). */
  effect?: unknown;
  /** For a job's input request (an action whose `tool` is `fabric.job.get`), the capability of the job it belongs to:
   * the tool its start call named, never `fabric.job.get`. A mandate reads the step under it, as at the start
   * (DEC-0141 MJ-1); required when the step's call carries a mandate and no decision. */
  mandateCapability?: unknown;
  /** The service's own estimate of what this call spends, USD, to read a mandate's spend. */
  spendUsd?: unknown;
  /** The project the call acts in, to read a mandate's projects and an architect's level (DEC-0162 LV-4). */
  project?: unknown;
  /** The context the call acts in, the service's own knowledge as the project is: `org:<orgId>` or `personal`
   * (DEC-0082); required to read a level decision or a level mandate, which stands only in its own organization
   * (DEC-0162 LV-4), at a service given `levels` an act declared `owner` or `admin` (LV-7), and a place's standing
   * mandate, which stands only in its own context (DEC-0166 AU-1). */
  context?: unknown;
  /** The organizations this service reads levels in, by `org:<orgId>` (DEC-0162); absent, it reads none, and a level
   * decision or mandate is read as absent and any other form the call carries answers as AP-2 says (LV-10). */
  levels?: unknown;
  /** The `mem` claim of the call's verified delegation token, absent when it presented none (DEC-0162 LV-5). */
  tokenMem?: unknown;
  /** The level the service's authority extension declares for this action (`actionLevels`, DEC-0162 LV-7); absent: an
   * architect in the call's project, admin for a call in no project; an action whose effect is `change-policy` is read
   * as `admin` at least whatever this says. */
  actionLevel?: unknown;
  /** True when this service declares `standing` in its authority extension (DEC-0166 AU-3): it reads standing mandates. Never passed for a send to people outside the estate, which no profile covers (AU-2). */
  standing?: unknown;
  /** The `prof` claim of the call's verified delegation token, absent when it presented none (DEC-0166 AU-3). */
  tokenProf?: unknown;
}

export type DecisionVia = "relayed-instruction" | "elicitation" | "approval" | "mandate" | "profile" | "level-command";
export type DecisionRecord = {
  by: string;
  via: DecisionVia;
  caller: string;
  task?: string;
  chain?: string[];
  source?: OperatorSource;
  profile?: ProfileRecord;
} & Partial<Omit<LevelRecord, "by">>;
export type ActionDecisionAnswer =
  | { ok: true; recordAs: "caller" }
  | { ok: true; recordAs: DecisionRecord }
  | { ok: false; code: typeof HUMAN_STEP_REQUIRED; data: { humanStep: HumanStep; url: string } }
  | { ok: false; code: typeof APPROVAL_REQUIRED; data: { actionDigest: string } }
  | { ok: false; code: typeof OPERATOR_DECISION_REQUIRED | typeof DECISION_INVALID; data?: { detail?: string; estimateUsd?: number; perCallMaxUsd?: number; actionDigest?: string } }
  /** The service's own fault, never sent to a caller: an input it owes is missing or unreadable. */
  | { fault: "action-invalid" | "caller-missing" | "levels-invalid" | "action-level-invalid" | "now-unreadable" | "digest-missing" | "url-missing" | "effect-missing" | "self-missing" | "mandate-capability-missing" | "context-missing" };

/** How long after the operator decided a relayed decision still stands: approval/1's lifetime (DL-17, FAC-SEM-051). */
export const DECISION_LIFETIME_SECONDS = 24 * 60 * 60;

let actionShape: ValidateFunction | undefined;
let extensionShape: ValidateFunction | undefined;
let decisionShape: ValidateFunction | undefined;
const schema = (name: string) => createValidatorSync().getSchema(`${SCHEMA_PREFIX}schemas/${name}`) as ValidateFunction;
const SHA256 = /^sha256:[0-9a-f]{64}$/;
const STEP_URL = /^(https:\/\/|\/)/;
const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.length > 0;

/** True when `action` is one valid `actions[]` entry whose `humanStep` is present exactly when `gate` is `human`. */
function readableAction(action: unknown): action is DeclaredAction {
  actionShape ??= schema("service-actions-extension.schema.json#/$defs/action");
  return actionShape(action) === true && ((action as DeclaredAction).gate === "human") === ((action as DeclaredAction).humanStep !== undefined);
}

/** An accepted `approval/1` outcome: `{ok: true, approver}` with a non-empty approver. */
function acceptedApproval(approval: unknown): approval is { ok: true; approver: string } {
  return isObject(approval) && approval.ok === true && nonEmpty(approval.approver);
}

/**
 * Whether a service takes a call of one declared action, and as whose act it records it (DEC-0121 AP-2, AP-4; DL-17,
 * DL-18, DL-25, DL-26). It runs after DL-13 and DL-21 and after `verifyApproval` when the call presented an approval.
 *
 * - `none`: the caller's own act.
 * - `human`: refused `human-step-required` with the step and its direct link, at every tier.
 * - `relayed`, in this order: an accepted approval (any tier) is the approver's decision; a T2 caller without one is
 *   refused `approval-required` with the action's digest, whatever operator form its call carries; the service's own
 *   record of an accepted elicitation is the operator's decision at T0 or T1; at a service given `levels`, a level
 *   decision or level mandate is read at every tier (DEC-0162 LV-6), a T2 refusal on it carrying the digest too; at a
 *   service that declares `standing`, a place's standing mandate is read at every tier, from T2 only under a matching
 *   `prof` (`profile-unbound` otherwise, DEC-0166 AU-3); without a decision `operator-decision-required`; a decision not
 *   valid against `decision.schema.json`, for another action, naming a `target` the call does not act on, or whose
 *   `at` does not read strictly, lies more than
 *   CLOCK_SKEW_SECONDS after `now` or more than DECISION_LIFETIME_SECONDS before it, `decision-invalid`; otherwise the
 *   operator's act. Every operator or approver record names `caller`, the service's own identity of who relayed it.
 */
export function actionDecision(input: ActionDecisionInput): ActionDecisionAnswer {
  const { action, tier, caller, decision, target, elicited, approval, actionDigest, humanStepUrl, now } = input;
  if (!readableAction(action)) return { fault: "action-invalid" };
  if (action.gate === "none") return { ok: true, recordAs: "caller" };
  if (action.gate === "human") {
    if (!nonEmpty(humanStepUrl) || !STEP_URL.test(humanStepUrl)) return { fault: "url-missing" };
    return { ok: false, code: HUMAN_STEP_REQUIRED, data: { humanStep: action.humanStep as HumanStep, url: humanStepUrl } };
  }
  if (!nonEmpty(caller)) return { fault: "caller-missing" };
  // The service's level contexts are a map by organization; an array (the authority declaration itself) is its fault.
  if (input.levels !== undefined && !levelContextsWellFormed(input.levels)) return { fault: "levels-invalid" };
  // A level the service declares for the action that is not one of ACTION_LEVELS is its fault, never "none declared".
  if (input.actionLevel !== undefined && !(ACTION_LEVELS as readonly unknown[]).includes(input.actionLevel)) return { fault: "action-level-invalid" };
  // DEC-0162: a level decision, or a level mandate on a call without a decision, is read at every tier by a service
  // that reads levels (LV-6); one that reads none reads the level form as absent and answers the rest (LV-10).
  const levelDecision = isObject(decision) && decision.by === "level";
  const inside = tier === "T0" || tier === "T1";
  // LV-7, the operator's answers to questions 4 and 8: in an organization's context, at a service that reads levels, an
  // act declared `owner` or `admin` is decided only at that level, never by the instance operator's word (its
  // descriptor's holder, a member on a member's machine): no approval/1, elicitation, operator decision or operator
  // mandate is taken for it, at any tier (DL-18's approval is that person's too).
  // LV-7: at a service that reads levels the action's effect decides whether `change-policy` raises it to `admin`, so
  // the service owes the effect on every relayed call there, not only on a level form.
  if (isObject(input.levels) && !(EFFECT_CLASSES as readonly unknown[]).includes(input.effect)) return { fault: "effect-missing" };
  const min = minLevelOf(input);
  const levelAct = isObject(input.levels) && (min === "owner" || min === "admin");
  if (levelAct && (typeof input.context !== "string" || !CALL_CONTEXT.test(input.context))) return { fault: "context-missing" };
  const levelOnly = levelAct && (input.context as string).startsWith("org:");
  // From T2 an operator decision counts for nothing (DL-17), nor does one for an act only a level decides (LV-7), so a
  // level mandate beside one is still read (LV-6).
  const levelMandate = (decision === undefined || ((!inside || levelOnly) && !levelDecision)) && isObject(input.mandate) && input.mandate.by === "level";
  if (acceptedApproval(approval) && !levelOnly) return { ok: true, recordAs: { by: approval.approver, via: "approval", caller } };
  // The service's own accepted elicitation is the operator's word at T0 or T1 and is read before a level form (LV-4).
  if (inside && elicited === true && !levelOnly) return { ok: true, recordAs: { by: "operator", via: "elicitation", caller } };
  // DEC-0166 AU-3: a standing mandate (a place's autonomy profile) is read at every tier by a service that declares
  // `standing`; from T2 it stands only when the call's token binds it by `prof`.
  // As a level mandate: from T2 an operator decision, or a level decision where no levels are read, counts for nothing.
  // An act only a level decides (LV-7) takes no standing mandate either: its `setLevel` is the hub's statement, not an
  // attestation, so it falls to the level-insufficient refusal below like any operator form (DEC-0166 AU-2).
  const levelRead = levelDecision && isObject(input.levels);
  const standingMandate = !levelOnly && (decision === undefined || (!inside && !levelRead)) && input.standing === true && isObject(input.mandate) && isObject(input.mandate.standing);
  if ((isObject(input.levels) && (levelDecision || levelMandate)) || standingMandate) {
    const clock = strictTime(now);
    if (Number.isNaN(clock)) return { fault: "now-unreadable" };
    // LV-4: a level stands only in the organization the call acts in, so the service owes that context.
    if (((isObject(input.levels) && (levelDecision || levelMandate)) || standingMandate) && (typeof input.context !== "string" || !CALL_CONTEXT.test(input.context))) return { fault: "context-missing" };
    // At T2 every refusal on this branch keeps DL-18's route open, so the service owes the action's digest here too.
    if (!inside && (typeof actionDigest !== "string" || !SHA256.test(actionDigest))) return { fault: "digest-missing" };
    const read = levelRead ? byLevel(input, action, caller, clock) : byMandate(input, action, caller);
    // Ignored (an unbound standing mandate from T2, a standing level mandate where no levels are read): as if absent.
    if ("ignored" in read) return inside ? { ok: false, code: OPERATOR_DECISION_REQUIRED } : { ok: false, code: APPROVAL_REQUIRED, data: { actionDigest: actionDigest as string } };
    const answer = read;
    if (!inside && "ok" in answer && !answer.ok && (answer.code === OPERATOR_DECISION_REQUIRED || answer.code === DECISION_INVALID)) {
      return { ...answer, data: { ...(answer.data ?? {}), actionDigest } } as ActionDecisionAnswer;
    }
    return answer;
  }
  if (tier !== "T0" && tier !== "T1") {
    if (typeof actionDigest !== "string" || !SHA256.test(actionDigest)) return { fault: "digest-missing" };
    // No approval decides an act only a level decides (LV-7), so a T2 caller is told the level, with the digest.
    if (levelOnly) return { ok: false, code: OPERATOR_DECISION_REQUIRED, data: { detail: `level-insufficient: ${min as "owner" | "admin"}`, actionDigest } };
    return { ok: false, code: APPROVAL_REQUIRED, data: { actionDigest } };
  }
  const clock = strictTime(now);
  if (Number.isNaN(clock)) return { fault: "now-unreadable" };
  if (levelOnly) return { ok: false, code: OPERATOR_DECISION_REQUIRED, data: { detail: `level-insufficient: ${min as "owner" | "admin"}` } };
  // A level decision at a service that reads no levels is as if absent (LV-10), so a mandate the call carries is read.
  if ((decision === undefined || levelDecision) && input.mandate !== undefined) {
    const answer = byMandate(input, action, caller);
    return "ignored" in answer ? { ok: false, code: OPERATOR_DECISION_REQUIRED } : answer;
  }
  if (decision === undefined || levelDecision) return { ok: false, code: OPERATOR_DECISION_REQUIRED };
  decisionShape ??= schema("decision.schema.json");
  if (decisionShape(decision) !== true) return { ok: false, code: DECISION_INVALID };
  const read = decision as { action: string; target?: string; at: string; source?: OperatorSource };
  if (read.action !== action.id || (read.target !== undefined && read.target !== target)) return { ok: false, code: DECISION_INVALID };
  const at = strictTime(read.at);
  if (Number.isNaN(at) || at > clock + CLOCK_SKEW_SECONDS * 1000 || at < clock - DECISION_LIFETIME_SECONDS * 1000) {
    return { ok: false, code: DECISION_INVALID };
  }
  // A decision relayed from another of the operator's agents keeps where the operator said it (DEC-0126 OA-6).
  return { ok: true, recordAs: { by: "operator", via: "relayed-instruction", caller, ...(read.source ? { source: { ...read.source } } : {}) } };
}

/**
 * The lowest level that decides the action: the service's declaration, raised to `admin` for an action whose effect is
 * `change-policy`, which an `owner` or an `admin` decides and never an `architect` (DEC-0162 LV-7, the operator's
 * answer to its question 4), so a declaration left out or `architect` cannot open it to an architect.
 */
const minLevelOf = (input: ActionDecisionInput): string | undefined => {
  const declared = input.actionLevel as string | undefined;
  return input.effect === "change-policy" && (declared === undefined || declared === "architect") ? "admin" : declared;
};

/** The tool of a job's input request (C3.3, AP-2): the call that answers it is `fabric.job.get`. */
export const JOB_STEP_TOOL = "fabric.job.get" as const;
/** `common.schema.json#/$defs/capabilityName`: the form a job's capability must have to be read (MJ-1). */
const CAPABILITY_NAME = /^[a-z][a-z0-9._-]{1,127}$/;

/**
 * A relayed action's call that carries a mandate and no decision (DEC-0125 MD-3): the mandate decides. A job's input
 * request is read under the job's own capability, never under `fabric.job.get` (DEC-0141 MJ-1), its action the request
 * key: a mandate listing capabilities covers a job's start and its steps alike, and one that also lists actions covers
 * a step only when it names the step's key.
 */
function byMandate(input: ActionDecisionInput, action: DeclaredAction, caller: string): ActionDecisionAnswer | { ignored: string } {
  const { effect, spendUsd, project } = input;
  if (typeof effect !== "string") return { fault: "effect-missing" };
  if (typeof input.self !== "string") return { fault: "self-missing" };
  const capability = action.tool === JOB_STEP_TOOL ? input.mandateCapability : action.tool;
  // MJ-1: never the transport itself, so a lazily passed `fabric.job.get` cannot bring the old reading back.
  if (typeof capability !== "string" || !CAPABILITY_NAME.test(capability) || capability === JOB_STEP_TOOL) return { fault: "mandate-capability-missing" };
  const answer = mandateCovers({
    mandate: input.mandate, tier: input.tier, now: input.now, self: input.self,
    ...(input.callerAgent === undefined ? {} : { callerAgent: input.callerAgent }),
    ...(isObject(input.levels) ? { levels: input.levels as LevelContexts, tokenMem: input.tokenMem } : {}),
    ...(input.standing === true ? { standing: true, ...(input.tokenProf === undefined ? {} : { tokenProf: input.tokenProf }) } : {}),
    call: { capability, action: action.id, effect, ...(typeof spendUsd === "number" ? { spendUsd } : {}), ...(typeof project === "string" ? { project } : {}), ...(typeof input.context === "string" ? { context: input.context } : {}), ...(minLevelOf(input) === undefined ? {} : { minLevel: minLevelOf(input) as string }) }
  });
  if ("recordAs" in answer) return { ok: true, recordAs: { ...answer.recordAs, caller } };
  // `ignored`: a T2 operator mandate (MD-5), or a level mandate at a service that reads no levels (LV-10); the caller
  // answers as if the call carried no mandate.
  return answer;
}

/**
 * A relayed action's call that carries a level decision, at a service that reads levels (DEC-0162 LV-3 to LV-6, LV-10,
 * LV-11), at any tier: the decision has its schema's level form and is for this action and target; it was made within
 * AP-2's window; it names the project the call acts in, when it names one; the level stands (`levelStanding`). A failed
 * check is `decision-invalid`, with the level's detail where the level fails; a level below what the call needs is
 * `operator-decision-required` with `level-insufficient: owner`, `admin` or `operator`.
 */
function byLevel(input: ActionDecisionInput, action: DeclaredAction, caller: string, clock: number): ActionDecisionAnswer {
  decisionShape ??= schema("decision.schema.json");
  if (decisionShape(input.decision) !== true) return { ok: false, code: DECISION_INVALID };
  const read = input.decision as { level: string; org: string; project?: string; action: string; target?: string; at: string; membership: unknown };
  if (read.action !== action.id || (read.target !== undefined && read.target !== input.target)) return { ok: false, code: DECISION_INVALID };
  const at = strictTime(read.at);
  if (Number.isNaN(at) || at > clock + CLOCK_SKEW_SECONDS * 1000 || at < clock - DECISION_LIFETIME_SECONDS * 1000) return { ok: false, code: DECISION_INVALID };
  const project = typeof input.project === "string" ? input.project : undefined;
  // A decision for one project decides nothing in another, or in none.
  if (read.project !== undefined && read.project !== project) return { ok: false, code: DECISION_INVALID };
  const standing = levelStanding({
    membership: read.membership, org: read.org, level: read.level, at: read.at,
    ...(project === undefined ? {} : { project }), ...(minLevelOf(input) === undefined ? {} : { minLevel: minLevelOf(input) as string }),
    context: input.context as string, contexts: input.levels as LevelContexts, tokenMem: input.tokenMem, now: clock
  });
  if (!standing.ok) {
    return "invalid" in standing
      ? { ok: false, code: DECISION_INVALID, data: { detail: standing.invalid } }
      : { ok: false, code: OPERATOR_DECISION_REQUIRED, data: { detail: standing.insufficient } };
  }
  const { level, org, approver, membershipDigest, revision } = standing;
  return { ok: true, recordAs: { by: "level", via: "level-command", level, org, ...(project === undefined ? {} : { project }), approver, membershipDigest, revision, caller } };
}

/** What a host reads of a well-known document's actions declaration: the actions, or why it is not declared. */
export type ActionsView =
  | { declared: false }
  | { declared: true; valid: false; errors: string[] }
  | { declared: true; valid: true; actions: DeclaredAction[] };

/** The host reader of extensions/actions/0.1 (DEC-0121 AP-1), as `connectionsView` is for connections. */
export function actionsView(wellKnown: unknown): ActionsView {
  const extensions = isObject(wellKnown) && isObject(wellKnown.extensions) ? wellKnown.extensions : undefined;
  if (extensions === undefined || !Object.hasOwn(extensions, EXTENSION_KEYS.actions)) return { declared: false };
  extensionShape ??= schema("service-actions-extension.schema.json");
  const value = extensions[EXTENSION_KEYS.actions];
  if (extensionShape(value) !== true) {
    return { declared: true, valid: false, errors: (extensionShape.errors as ErrorObject[]).map((error) => `${error.instancePath || "/"} ${error.keyword}`) };
  }
  return { declared: true, valid: true, actions: (value as { actions: DeclaredAction[] }).actions };
}

/** What a host reads of a well-known document's authority declaration (DEC-0162): the organizations whose levels the
 * service reads and the level each action needs, or why it is not declared. */
export type AuthorityView =
  | { declared: false }
  | { declared: true; valid: false; errors: string[] }
  | { declared: true; valid: true; levels?: Array<{ org: string; audience: string }>; actionLevels?: Record<string, (typeof ACTION_LEVELS)[number]>; standing?: true };

let authorityShape: ValidateFunction | undefined;
/** The host reader of extensions/authority/0.1 (DEC-0162 LV-5, LV-7), beside `actionsView`, which it never changes. */
export function authorityView(wellKnown: unknown): AuthorityView {
  const extensions = isObject(wellKnown) && isObject(wellKnown.extensions) ? wellKnown.extensions : undefined;
  if (extensions === undefined || !Object.hasOwn(extensions, EXTENSION_KEYS.authority)) return { declared: false };
  authorityShape ??= schema("service-authority-extension.schema.json");
  const value = extensions[EXTENSION_KEYS.authority];
  if (authorityShape(value) !== true) {
    return { declared: true, valid: false, errors: (authorityShape.errors as ErrorObject[]).map((error) => `${error.instancePath || "/"} ${error.keyword}`) };
  }
  const { levels, actionLevels, standing } = value as { levels?: Array<{ org: string; audience: string }>; actionLevels?: Record<string, (typeof ACTION_LEVELS)[number]>; standing?: true };
  return { declared: true, valid: true, ...(levels === undefined ? {} : { levels }), ...(actionLevels === undefined ? {} : { actionLevels }), ...(standing === undefined ? {} : { standing }) };
}

const pointerToken = (token: string) => token.replace(/~/g, "~0").replace(/\//g, "~1");
const KEY_PATH = `/extensions/${pointerToken(EXTENSION_KEYS.actions)}`;
const flag = (instancePath: string, message: string): Finding => ({ code: "FAC-SEM-142", instancePath, message });

/**
 * FAC-SEM-142 on a well-known document (kind `service-well-known`) that carries the actions key: a value that is not
 * its schema's (a reader treats it as not declared and reports it, as FAC-SEM-133 does for load); an `id` named twice; a
 * `humanStep` present without `gate: human` or absent with it; a `tool` that a present `surfaces.mcp.capabilities` does
 * not list: a button without an agent twin (DEC-0121 AP-1). The authority key is `authorityExtensionRules`'s.
 */
export function actionsExtensionRules(wellKnown: JsonObject): Finding[] {
  return actionsKeyFindings(wellKnown);
}

/**
 * FAC-SEM-142 on the authority key of a well-known document (kind `service-well-known`, DEC-0162 LV-5, LV-7): a value
 * that is not its schema's, an organization named twice in `levels`, and a level for an id that is not a relayed action
 * of the actions declaration. Its own function, so a port of `actionsExtensionRules` keeps reading the actions key alone.
 */
export function authorityExtensionRules(wellKnown: JsonObject): Finding[] {
  return authorityKeyFindings(wellKnown);
}

/**
 * FAC-SEM-176 on a well-known document (kind `service-well-known`, DEC-0169 RP-3): a service that serves a dashboard
 * serves an agent surface beside it (`surfaces.mcp`, or `surfaces.a2a` for a remote one), and an MCP surface that lists
 * its capabilities lists at least one. A page with no agent surface is a function only a person reaches (RP-1, RP-2).
 */
export function agentSurfaceRules(wellKnown: JsonObject): Finding[] {
  const surfaces = isObject(wellKnown.surfaces) ? wellKnown.surfaces : {};
  const findings: Finding[] = [];
  if (surfaces.dashboard !== undefined && surfaces.mcp === undefined && surfaces.a2a === undefined) {
    findings.push({ code: "FAC-SEM-176", instancePath: "/surfaces", message: "a service that serves a dashboard serves an agent surface beside it: surfaces.mcp, or surfaces.a2a (DEC-0169 RP-3)" });
  }
  const mcp = isObject(surfaces.mcp) ? surfaces.mcp : {};
  if (Array.isArray(mcp.capabilities) && mcp.capabilities.length === 0) {
    findings.push({ code: "FAC-SEM-176", instancePath: "/surfaces/mcp/capabilities", message: "an MCP surface serves at least one tool: an empty list is an agent surface an agent cannot use (DEC-0169 RP-3)" });
  }
  return findings;
}

const AUTHORITY_PATH = `/extensions/${pointerToken(EXTENSION_KEYS.authority)}`;

/** The authority key's findings (DEC-0162 LV-5, LV-7), read against the actions declaration when it is valid. */
function authorityKeyFindings(wellKnown: JsonObject): Finding[] {
  const view = authorityView(wellKnown);
  if (!view.declared) return [];
  if (!view.valid) return [flag(AUTHORITY_PATH, `the authority declaration is invalid (${view.errors.join("; ")}); a reader treats it as not declared and reports it (DEC-0162)`)];
  const findings: Finding[] = [];
  const orgs = new Set<string>();
  (view.levels ?? []).forEach((entry, i) => {
    if (orgs.has(entry.org)) findings.push(flag(`${AUTHORITY_PATH}/levels/${i}/org`, `organization ${entry.org} is named twice (DEC-0162 LV-5)`));
    orgs.add(entry.org);
  });
  const actions = actionsView(wellKnown);
  const relayed = new Set(actions.declared && actions.valid ? actions.actions.filter((action) => action.gate === "relayed").map((action) => action.id) : []);
  for (const id of Object.keys(view.actionLevels ?? {})) {
    if (!relayed.has(id)) findings.push(flag(`${AUTHORITY_PATH}/actionLevels/${pointerToken(id)}`, `${id} is not a relayed action of the actions declaration: a level is declared only for one (DEC-0162 LV-7)`));
  }
  return findings;
}

function actionsKeyFindings(wellKnown: JsonObject): Finding[] {
  const view = actionsView(wellKnown);
  if (!view.declared) return [];
  if (!view.valid) return [flag(KEY_PATH, `the actions declaration is invalid (${view.errors.join("; ")}); a reader treats it as not declared and reports it (DEC-0121)`)];
  const surfaces = isObject(wellKnown.surfaces) ? wellKnown.surfaces : {};
  const mcp = isObject(surfaces.mcp) ? surfaces.mcp : {};
  const capabilities = Array.isArray(mcp.capabilities) ? (mcp.capabilities as unknown[]) : undefined;
  const findings: Finding[] = [];
  const seen = new Set<string>();
  view.actions.forEach((action, i) => {
    const at = `${KEY_PATH}/actions/${i}`;
    if (seen.has(action.id)) findings.push(flag(`${at}/id`, `action ${action.id} is declared twice`));
    seen.add(action.id);
    if ((action.gate === "human") !== (action.humanStep !== undefined)) findings.push(flag(`${at}/humanStep`, "humanStep is present exactly when gate is human (DEC-0121 AP-4)"));
    if (capabilities !== undefined && !capabilities.includes(action.tool)) findings.push(flag(`${at}/tool`, `the MCP surface does not serve ${action.tool}: a button without an agent twin (DEC-0121 AP-1)`));
  });
  return findings;
}

/**
 * FAC-SEM-142 on a service's answer to one action call (kind `action-call`: the inputs of `actionDecision` and the
 * service's `answer`): the answer is the one `actionDecision` gives for those inputs.
 */
function actionCallRule(value: JsonObject): Finding[] {
  const { answer, ...inputs } = value;
  const want = actionDecision(inputs);
  if (isDeepStrictEqual(answer, want)) return [];
  return [flag("/answer", `the service answers this call ${JSON.stringify(want)} (DEC-0121 AP-2, AP-4)`)];
}

export function actionRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (kind === "action-call") return actionCallRule(value);
  return undefined;
}
// #endregion actions
