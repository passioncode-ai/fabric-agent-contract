import { isDeepStrictEqual } from "node:util";
import type { ErrorObject, ValidateFunction } from "ajv/dist/2020.js";
import { SCHEMA_PREFIX } from "./contract.js";
import { EXTENSION_KEYS } from "./extensions.js";
import { type Finding, type JsonObject, isObject } from "./findings.js";
import { CLOCK_SKEW_SECONDS, strictTime } from "./rfc3339.js";
import { mandateCovers } from "./mandate.js";
import { createValidatorSync } from "./validator.js";

// #region actions (docs: docs/specification/service.md#actions)
// DEC-0121 (action parity): every action a service's dashboard, app or page lets a person take has a tool on its agent
// surface (AP-1), declared under extensions/actions/0.1; a `relayed` action from a T0 or T1 caller is taken as the
// operator's when the call carries the operator's decision in `_meta.decision` (AP-2); a `human` action answers
// `human-step-required` with its step (AP-4). `actionDecision` is the reference a service's tool runs before it acts.

/** The three refusals DEC-0121 adds to DL-19's one code set, and DL-17's refusal a T2 caller still gets. */
export const OPERATOR_DECISION_REQUIRED = "operator-decision-required";
export const DECISION_INVALID = "decision-invalid";
export const HUMAN_STEP_REQUIRED = "human-step-required";
export const APPROVAL_REQUIRED = "approval-required";

export type ActionGate = "none" | "relayed" | "human";
export type HumanStep = "sign-in" | "consent" | "payment" | "secret" | "spend-above-limit" | "passkey";
/** The caller's trust tier (delegation DL-25). Anything a callee cannot place in T0 or T1 is T2. */
export type CallerTier = "T0" | "T1" | "T2";

/** One entry of `actions[]` (`service-actions-extension.schema.json#/$defs/action`). */
export interface DeclaredAction { id: string; title: string; tool: string; gate: ActionGate; humanStep?: HumanStep }

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
  /** The service's own agent id, which a mandate's chain must end in (DEC-0125 MD-3). */
  self?: unknown;
  /** The action's effect class, the service's own knowledge, required to read a mandate. */
  effect?: unknown;
  /** The service's own estimate of what this call spends, USD, to read a mandate's spend. */
  spendUsd?: unknown;
  /** The project the call acts in, to read a mandate's projects. */
  project?: unknown;
}

export type DecisionVia = "relayed-instruction" | "elicitation" | "approval" | "mandate";
export type DecisionRecord = { by: string; via: DecisionVia; caller: string; task?: string; chain?: string[] };
export type ActionDecisionAnswer =
  | { ok: true; recordAs: "caller" }
  | { ok: true; recordAs: DecisionRecord }
  | { ok: false; code: typeof HUMAN_STEP_REQUIRED; data: { humanStep: HumanStep; url: string } }
  | { ok: false; code: typeof APPROVAL_REQUIRED; data: { actionDigest: string } }
  | { ok: false; code: typeof OPERATOR_DECISION_REQUIRED | typeof DECISION_INVALID; data?: { detail: string; estimateUsd?: number; perCallMaxUsd?: number } }
  /** The service's own fault, never sent to a caller: an input it owes is missing or unreadable. */
  | { fault: "action-invalid" | "caller-missing" | "now-unreadable" | "digest-missing" | "url-missing" | "effect-missing" };

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
 *   refused `approval-required` with the action's digest, whatever its call carries; the service's own record of an
 *   accepted elicitation is the operator's decision; without a decision `operator-decision-required`; a decision not
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
  if (acceptedApproval(approval)) return { ok: true, recordAs: { by: approval.approver, via: "approval", caller } };
  if (tier !== "T0" && tier !== "T1") {
    if (typeof actionDigest !== "string" || !SHA256.test(actionDigest)) return { fault: "digest-missing" };
    return { ok: false, code: APPROVAL_REQUIRED, data: { actionDigest } };
  }
  if (elicited === true) return { ok: true, recordAs: { by: "operator", via: "elicitation", caller } };
  const clock = strictTime(now);
  if (Number.isNaN(clock)) return { fault: "now-unreadable" };
  if (decision === undefined && input.mandate !== undefined) return byMandate(input, action, caller);
  if (decision === undefined) return { ok: false, code: OPERATOR_DECISION_REQUIRED };
  decisionShape ??= schema("decision.schema.json");
  if (decisionShape(decision) !== true) return { ok: false, code: DECISION_INVALID };
  const read = decision as { action: string; target?: string; at: string };
  if (read.action !== action.id || (read.target !== undefined && read.target !== target)) return { ok: false, code: DECISION_INVALID };
  const at = strictTime(read.at);
  if (Number.isNaN(at) || at > clock + CLOCK_SKEW_SECONDS * 1000 || at < clock - DECISION_LIFETIME_SECONDS * 1000) {
    return { ok: false, code: DECISION_INVALID };
  }
  return { ok: true, recordAs: { by: "operator", via: "relayed-instruction", caller } };
}

/** A relayed action's call that carries a mandate and no decision (DEC-0125 MD-3): the mandate decides. */
function byMandate(input: ActionDecisionInput, action: DeclaredAction, caller: string): ActionDecisionAnswer {
  const { effect, spendUsd, project } = input;
  if (typeof effect !== "string") return { fault: "effect-missing" };
  const answer = mandateCovers({
    mandate: input.mandate, tier: input.tier, now: input.now, self: input.self, caller,
    call: { capability: action.tool, action: action.id, effect, ...(typeof spendUsd === "number" ? { spendUsd } : {}), ...(typeof project === "string" ? { project } : {}) }
  });
  if ("recordAs" in answer) return { ok: true, recordAs: { ...answer.recordAs, caller } };
  // Never `ignored`: actionDecision reads the tier first, so a T2 call answered approval-required before (MD-5).
  return answer as Exclude<typeof answer, { ignored: string }>;
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

const pointerToken = (token: string) => token.replace(/~/g, "~0").replace(/\//g, "~1");
const KEY_PATH = `/extensions/${pointerToken(EXTENSION_KEYS.actions)}`;
const flag = (instancePath: string, message: string): Finding => ({ code: "FAC-SEM-142", instancePath, message });

/**
 * FAC-SEM-142 on a well-known document (kind `service-well-known`) that carries the actions key: a value that is not
 * its schema's (a reader treats it as not declared and reports it, as FAC-SEM-133 does for load); an `id` named twice; a
 * `humanStep` present without `gate: human` or absent with it; a `tool` that a present `surfaces.mcp.capabilities` does
 * not list: a button without an agent twin (DEC-0121 AP-1).
 */
export function actionsExtensionRules(wellKnown: JsonObject): Finding[] {
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
