import type { ValidateFunction } from "ajv/dist/2020.js";
import { SCHEMA_PREFIX } from "./contract.js";
import { effectClosure } from "./delegation.js";
import type { Finding, JsonObject } from "./findings.js";
import { CLOCK_SKEW_SECONDS, strictTime } from "./rfc3339.js";
import { createValidatorSync } from "./validator.js";

// #region mandate (docs: docs/specification/delegation.md#the-operators-mandate)
// DEC-0125: the operator's instruction for one task travels with the task. The agent leading it states a mandate from
// the operator's own words (MD-1); each agent it engages hands it on narrowed, never wider (MD-2); a callee takes a call
// the mandate covers, from a T0 or T1 caller, as the operator's decision (MD-3), and refuses only what it does not cover,
// so the operator is asked again for that and nothing else (MD-4). Across the machine boundary it grants nothing (MD-5).

/** The longest a mandate stands after the operator gave it. */
export const MANDATE_LIFETIME_SECONDS = 7 * 24 * 60 * 60;
/** The refusals a mandate meets, DL-19's codes with `data.detail` naming why. */
export const OUTSIDE_MANDATE = "operator-decision-required";
export const MANDATE_INVALID = "decision-invalid";

export interface MandateScope {
  capabilities?: string[];
  actions?: string[];
  effects: string[];
  spendUsd?: number;
  projects?: string[];
}
export interface Mandate {
  kind: "mandate/1";
  by: "operator";
  task: string;
  instruction: string;
  at: string;
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
  /** The callee's own estimate of what this call spends, USD; absent or 0, nothing. */
  spendUsd?: number;
  /** The project the call acts in, when it acts in one. */
  project?: string;
}

export type OutsideDetail = "outside-mandate: capability" | "outside-mandate: action" | "outside-mandate: effect" | "outside-mandate: spend" | "outside-mandate: project";
export type InvalidDetail = "mandate-malformed" | "mandate-widened" | "mandate-expired" | "mandate-early" | "mandate-at-t2";
export type MandateAnswer =
  | { ok: true; recordAs: { by: "operator"; via: "mandate"; task: string; chain: string[] } }
  | { ok: false; code: typeof OUTSIDE_MANDATE; data: { detail: OutsideDetail } }
  | { ok: false; code: typeof MANDATE_INVALID; data: { detail: InvalidDetail } }
  /** The callee's own fault, never sent: its clock does not read. */
  | { fault: "now-unreadable" };

let shape: ValidateFunction | undefined;
const mandateShape = () => (shape ??= createValidatorSync().getSchema(`${SCHEMA_PREFIX}schemas/mandate.schema.json`) as ValidateFunction);

/** The scope a hand-over leaves in force: the last chain entry's, or the mandate's own. */
export function effectiveScope(mandate: Mandate): MandateScope {
  for (let index = mandate.chain.length - 1; index >= 0; index -= 1) {
    const scope = mandate.chain[index]?.scope;
    if (scope) return scope;
  }
  return mandate.scope;
}

const listWithin = (child: string[] | undefined, parent: string[] | undefined) =>
  parent === undefined || (child !== undefined && child.every((item) => parent.includes(item)));

/** True when `child` asks for nothing `parent` does not give (MD-2): each list a subset, the effects within, the spend no more. */
export function scopeWithin(child: MandateScope, parent: MandateScope): boolean {
  const ceiling = effectClosure(parent.effects);
  return listWithin(child.capabilities, parent.capabilities)
    && listWithin(child.actions, parent.actions)
    && listWithin(child.projects, parent.projects)
    && child.effects.every((effect) => ceiling.has(effect))
    && (child.spendUsd ?? 0) <= (parent.spendUsd ?? 0);
}

/** The first problem of a mandate as a document (FAC-SEM-144), or undefined. */
export function mandateProblem(mandate: unknown): InvalidDetail | undefined {
  if (mandateShape()(mandate) !== true) return "mandate-malformed";
  const read = mandate as Mandate;
  const at = strictTime(read.at);
  const expires = strictTime(read.expiresAt);
  if (Number.isNaN(at) || Number.isNaN(expires) || expires <= at || expires > at + MANDATE_LIFETIME_SECONDS * 1000) return "mandate-malformed";
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
  return undefined;
}

/**
 * Whether a callee takes one call as the operator's decision under a mandate (DEC-0125 MD-3 to MD-5), after it has
 * placed the caller's tier (DL-25). A T2 caller's mandate grants nothing: across the boundary the operator's
 * authority travels only as a delegation token (DL-13). An invalid, widened, expired or not yet given mandate is
 * `decision-invalid`; a valid one that does not cover the call is `operator-decision-required`, its detail naming the
 * first part not covered, so the agent asks the operator for that part only (MD-4).
 */
export function mandateCovers(input: { mandate: unknown; tier: unknown; now: unknown; call: MandateCall }): MandateAnswer {
  const { mandate, tier, now, call } = input;
  const clock = strictTime(now);
  if (Number.isNaN(clock)) return { fault: "now-unreadable" };
  if (tier !== "T0" && tier !== "T1") return { ok: false, code: MANDATE_INVALID, data: { detail: "mandate-at-t2" } };
  const problem = mandateProblem(mandate);
  if (problem) return { ok: false, code: MANDATE_INVALID, data: { detail: problem } };
  const read = mandate as Mandate;
  if (strictTime(read.at) > clock + CLOCK_SKEW_SECONDS * 1000) return { ok: false, code: MANDATE_INVALID, data: { detail: "mandate-early" } };
  if (clock >= strictTime(read.expiresAt)) return { ok: false, code: MANDATE_INVALID, data: { detail: "mandate-expired" } };
  const scope = effectiveScope(read);
  const outside = (detail: OutsideDetail): MandateAnswer => ({ ok: false, code: OUTSIDE_MANDATE, data: { detail } });
  if (call.action !== undefined && scope.actions !== undefined && !scope.actions.includes(call.action)) return outside("outside-mandate: action");
  if (call.action !== undefined && scope.actions === undefined && scope.capabilities === undefined) return outside("outside-mandate: action");
  if (scope.capabilities !== undefined && !scope.capabilities.includes(call.capability)) return outside("outside-mandate: capability");
  if (!effectClosure(scope.effects).has(call.effect)) return outside("outside-mandate: effect");
  if ((call.spendUsd ?? 0) > (scope.spendUsd ?? 0)) return outside("outside-mandate: spend");
  if (call.project !== undefined && scope.projects !== undefined && !scope.projects.includes(call.project)) return outside("outside-mandate: project");
  return { ok: true, recordAs: { by: "operator", via: "mandate", task: read.task, chain: read.chain.map((step) => step.agent) } };
}

/**
 * The mandate an agent hands on (MD-2): the chain gains the agent handing on, with `narrower` when it narrows. Throws
 * when the result would not be a valid mandate: a wider scope, a fifth agent, an agent already in the chain.
 */
export function handOn(mandate: Mandate, agent: string, at: string, narrower?: MandateScope): Mandate {
  const next: Mandate = { ...mandate, chain: [...mandate.chain, narrower ? { agent, at, scope: narrower } : { agent, at }] };
  const problem = mandateProblem(next);
  if (problem) throw new Error(`the mandate cannot be handed on: ${problem}`);
  return next;
}

/** FAC-SEM-144 on kind `mandate` (the document itself). */
export function mandateRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (kind === "mandate") {
    const problem = mandateProblem(value);
    return problem ? [{ code: "FAC-SEM-144", instancePath: "", message: `the mandate is not valid: ${problem} (DEC-0125 MD-1, MD-2)` }] : [];
  }
  return undefined;
}

// #endregion mandate
