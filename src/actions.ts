import { isDeepStrictEqual } from "node:util";
import type { ErrorObject, ValidateFunction } from "ajv/dist/2020.js";
import { SCHEMA_PREFIX } from "./contract.js";
import { EXTENSION_KEYS } from "./extensions.js";
import { type Finding, type JsonObject, isObject } from "./findings.js";
import { CLOCK_SKEW_SECONDS, strictTime } from "./rfc3339.js";
import { createValidatorSync } from "./validator.js";

// #region actions (docs: docs/specification/service.md#actions)
// DEC-0121 (action parity): every action a service's dashboard, app or page lets a person take has a tool on its agent
// surface (AP-1), declared under extensions/actions/0.1; a `relayed` action from a T0 or T1 caller is taken as the
// operator's when the call carries the operator's decision in `_meta.decision` (AP-2); a `human` action answers
// `human-step-required` with its step (AP-4). `actionDecision` is the reference a service's tool runs before it acts.

/** The three refusals DEC-0121 adds to the interop codes, and DL-17's refusal a T2 caller still gets. */
export const OPERATOR_DECISION_REQUIRED = "operator-decision-required";
export const DECISION_INVALID = "decision-invalid";
export const HUMAN_STEP_REQUIRED = "human-step-required";
export const APPROVAL_REQUIRED = "approval-required";

export type ActionGate = "none" | "relayed" | "human";
export type HumanStep = "sign-in" | "consent" | "payment" | "secret" | "spend-above-limit";
/** The caller's trust tier (delegation DL-25). Anything a callee cannot place in T0 or T1 is T2. */
export type CallerTier = "T0" | "T1" | "T2";

/** One entry of `actions[]` (`service-actions-extension.schema.json#/$defs/action`). */
export interface DeclaredAction { id: string; title: string; tool: string; gate: ActionGate; humanStep?: HumanStep }

export interface ActionDecisionInput {
  /** The service's own declaration of the action being called. */
  action?: unknown;
  /** The caller's tier, as the callee placed it (DL-25). */
  tier?: unknown;
  /** The call's `_meta.decision`, as received. */
  decision?: unknown;
  /** The service's clock, RFC 3339; with it, a decision dated more than CLOCK_SKEW_SECONDS later is invalid. */
  now?: unknown;
}

export type OperatorRecord = { by: "operator"; via: "relayed-instruction" | "elicitation"; relayedBy?: string };
export type ActionDecisionAnswer =
  | { ok: true; recordAs: "caller" }
  | { ok: true; recordAs: OperatorRecord }
  | { ok: false; code: typeof HUMAN_STEP_REQUIRED; humanStep: HumanStep }
  | { ok: false; code: typeof APPROVAL_REQUIRED | typeof OPERATOR_DECISION_REQUIRED | typeof DECISION_INVALID }
  /** The service's own fault, never sent to a caller: its declaration of the action, or its clock, is unreadable. */
  | { fault: "action-invalid" | "now-unreadable" };

let actionShape: ValidateFunction | undefined;
let extensionShape: ValidateFunction | undefined;
let decisionShape: ValidateFunction | undefined;
const schema = (name: string) => createValidatorSync().getSchema(`${SCHEMA_PREFIX}schemas/${name}`) as ValidateFunction;

/** True when `action` is one valid `actions[]` entry whose `humanStep` is present exactly when `gate` is `human`. */
function readableAction(action: unknown): action is DeclaredAction {
  actionShape ??= schema("service-actions-extension.schema.json#/$defs/action");
  return actionShape(action) === true && ((action as DeclaredAction).gate === "human") === ((action as DeclaredAction).humanStep !== undefined);
}

/**
 * Whether a service takes a call of one declared action, and as whose act it records it (DEC-0121 AP-2, AP-4; DL-17,
 * DL-25, DL-26). `none` is the caller's own act. `human` is refused `human-step-required` with its step at every tier.
 * `relayed` from a T2 caller is refused `approval-required` whatever its `_meta` carries (DL-17); from a T0 or T1 caller
 * it needs a decision valid against `decision.schema.json`, whose `at` reads strictly (`strictTime`) and, given `now`, is
 * no more than CLOCK_SKEW_SECONDS ahead of it: without one `operator-decision-required`, with an invalid one
 * `decision-invalid`, with a valid one the operator's act, recorded with `via` and the relaying agent.
 */
export function actionDecision(input: ActionDecisionInput): ActionDecisionAnswer {
  const { action, tier, decision, now } = input;
  if (!readableAction(action)) return { fault: "action-invalid" };
  if (action.gate === "none") return { ok: true, recordAs: "caller" };
  if (action.gate === "human") return { ok: false, code: HUMAN_STEP_REQUIRED, humanStep: action.humanStep as HumanStep };
  if (tier !== "T0" && tier !== "T1") return { ok: false, code: APPROVAL_REQUIRED };
  if (decision === undefined) return { ok: false, code: OPERATOR_DECISION_REQUIRED };
  const clock = now === undefined ? undefined : strictTime(now);
  if (Number.isNaN(clock)) return { fault: "now-unreadable" };
  decisionShape ??= schema("decision.schema.json");
  if (decisionShape(decision) !== true) return { ok: false, code: DECISION_INVALID };
  const read = decision as { via: OperatorRecord["via"]; at: string; relayedBy?: string };
  const at = strictTime(read.at);
  if (Number.isNaN(at) || (clock !== undefined && at > clock + CLOCK_SKEW_SECONDS * 1000)) return { ok: false, code: DECISION_INVALID };
  return { ok: true, recordAs: { by: "operator", via: read.via, ...(read.relayedBy === undefined ? {} : { relayedBy: read.relayedBy }) } };
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
  const extensions = isObject(wellKnown.extensions) ? wellKnown.extensions : undefined;
  if (extensions === undefined || !Object.hasOwn(extensions, EXTENSION_KEYS.actions)) return [];
  extensionShape ??= schema("service-actions-extension.schema.json");
  const value = extensions[EXTENSION_KEYS.actions];
  if (extensionShape(value) !== true) {
    const why = (extensionShape.errors as ErrorObject[]).map((error) => `${error.instancePath || "/"} ${error.keyword}`).join("; ");
    return [flag(KEY_PATH, `the actions declaration is invalid (${why}); a reader treats it as not declared and reports it (DEC-0121)`)];
  }
  const surfaces = isObject(wellKnown.surfaces) ? wellKnown.surfaces : {};
  const mcp = isObject(surfaces.mcp) ? surfaces.mcp : {};
  const capabilities = Array.isArray(mcp.capabilities) ? (mcp.capabilities as unknown[]) : undefined;
  const findings: Finding[] = [];
  const seen = new Set<string>();
  (value as { actions: DeclaredAction[] }).actions.forEach((action, i) => {
    const at = `${KEY_PATH}/actions/${i}`;
    if (seen.has(action.id)) findings.push(flag(`${at}/id`, `action ${action.id} is declared twice`));
    seen.add(action.id);
    if ((action.gate === "human") !== (action.humanStep !== undefined)) findings.push(flag(`${at}/humanStep`, "humanStep is present exactly when gate is human (DEC-0121 AP-4)"));
    if (capabilities !== undefined && !capabilities.includes(action.tool)) findings.push(flag(`${at}/tool`, `the MCP surface does not serve ${action.tool}: a button without an agent twin (DEC-0121 AP-1)`));
  });
  return findings;
}

/**
 * FAC-SEM-142 on a service's answer to one action call (kind `action-call`, `{action, tier, decision?, now?, answer}`):
 * the answer is the one `actionDecision` gives for that action, tier, decision and clock.
 */
function actionCallRule(value: JsonObject): Finding[] {
  const want = actionDecision({ action: value.action, tier: value.tier, decision: value.decision, now: value.now });
  if (isDeepStrictEqual(value.answer, want)) return [];
  return [flag("/answer", `the service answers this call ${JSON.stringify(want)} (DEC-0121 AP-2, AP-4)`)];
}

export function actionRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (kind === "action-call") return actionCallRule(value);
  return undefined;
}
// #endregion actions
