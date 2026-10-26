import type { ValidateFunction } from "ajv/dist/2020.js";
import { SCHEMA_PREFIX } from "./contract.js";
import { effectClosure } from "./delegation.js";
import type { Finding, JsonObject } from "./findings.js";
import { CLOCK_SKEW_SECONDS, strictTime } from "./rfc3339.js";
import { createValidatorSync } from "./validator.js";

// #region mandate (docs: docs/specification/delegation.md#the-operators-mandate)
// DEC-0125: the operator's instruction for one task travels with the task. The agent leading it states a mandate from
// the operator's own words (MD-1); every call under it appends the agent it calls, with a scope never wider (MD-2); a
// callee that is the chain's last agent, called from T0 or T1 (by the agent before it, where it authenticated the
// caller's agent id), takes a call the mandate covers as
// the operator's decision (MD-3), and refuses only what it does not cover, so the operator is asked for that part alone
// (MD-4). A T2 caller's mandate changes nothing (MD-5); human steps and the money limits never travel (MD-6).

/** The longest a mandate stands after the operator gave it. */
export const MANDATE_LIFETIME_SECONDS = 7 * 24 * 60 * 60;
/** The refusals a mandate meets, DL-19's codes with `data.detail` naming why. */
export const OUTSIDE_MANDATE = "operator-decision-required";
export const MANDATE_INVALID = "decision-invalid";
/** Effects past which a mandate must name the capabilities or actions it covers: every external effect. */
const READS_AND_DRAFTS = new Set(["none", "draft"]);
/** An effect no mandate covers: approving one's own promotion, grant, checker rule or policy change (AP-5). */
const NEVER_BY_MANDATE = "change-policy";

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
export interface Mandate {
  kind: "mandate/1";
  by: "operator";
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
}

export type OutsideDetail = "outside-mandate: capability" | "outside-mandate: action" | "outside-mandate: effect" | "outside-mandate: spend" | "outside-mandate: project";
export type InvalidDetail = "mandate-malformed" | "mandate-widened" | "mandate-expired" | "mandate-early" | "mandate-not-for-this-call";
export type MandateAnswer =
  | { ok: true; recordAs: { by: "operator"; via: "mandate"; task: string; chain: string[]; source?: OperatorSource } }
  | { ok: false; code: typeof OUTSIDE_MANDATE; data: { detail: OutsideDetail; estimateUsd?: number; perCallMaxUsd?: number } }
  | { ok: false; code: typeof MANDATE_INVALID; data: { detail: InvalidDetail } }
  /** A T2 caller's mandate changes nothing: the callee applies the whole profile as if it were absent (MD-5). */
  | { ignored: "mandate-at-t2" }
  /** The callee's own fault, never sent: its clock does not read. */
  | { fault: "now-unreadable" };

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
 * effect or a relayed action (MD-3), so adding one where the scope in force has none would cover calls it did not
 * (DEC-0136 MD-2a). `actions` may be added where `capabilities` is listed: it then narrows the relayed actions those
 * name.
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

/** The first problem of a mandate as a document (FAC-SEM-144), or undefined. */
export function mandateProblem(mandate: unknown): "mandate-malformed" | "mandate-widened" | undefined {
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
 * placed the caller's tier (DL-25). `self` is the callee's own agent id: the mandate is for this call only when the
 * chain ends in it. `callerAgent` is the caller's agent id when the callee authenticated one (a per-agent credential,
 * a delegation token's outermost actor, the hub's attested origin); it must then be the agent before `self`. Without
 * one (the shared descriptor token on loopback) the chain's end alone binds the mandate (MD-3). A T2 caller's mandate is
 * ignored. An invalid, widened, expired, not yet given or misaddressed mandate is `decision-invalid`; a valid one that
 * does not cover the call is `operator-decision-required`, its detail naming the first part not covered (MD-4).
 */
export function mandateCovers(input: { mandate: unknown; tier: unknown; now: unknown; self: unknown; callerAgent?: unknown; call: MandateCall }): MandateAnswer {
  const { mandate, tier, now, self, callerAgent, call } = input;
  const clock = strictTime(now);
  if (Number.isNaN(clock)) return { fault: "now-unreadable" };
  if (tier !== "T0" && tier !== "T1") return { ignored: "mandate-at-t2" };
  const problem = mandateProblem(mandate);
  if (problem) return { ok: false, code: MANDATE_INVALID, data: { detail: problem } };
  const read = mandate as Mandate;
  const holders = read.chain.map((step) => step.agent);
  if (holders.length < 2 || holders[holders.length - 1] !== self || (callerAgent !== undefined && holders[holders.length - 2] !== callerAgent)) {
    return { ok: false, code: MANDATE_INVALID, data: { detail: "mandate-not-for-this-call" } };
  }
  if (strictTime(read.at) > clock + CLOCK_SKEW_SECONDS * 1000) return { ok: false, code: MANDATE_INVALID, data: { detail: "mandate-early" } };
  if (clock >= strictTime(read.expiresAt)) return { ok: false, code: MANDATE_INVALID, data: { detail: "mandate-expired" } };
  const scope = effectiveScope(read);
  const outside = (detail: OutsideDetail): MandateAnswer => ({ ok: false, code: OUTSIDE_MANDATE, data: { detail } });
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
  // Where the operator said it travels into the record, as the reason the callee acted (DEC-0126 OA-6).
  return { ok: true, recordAs: { by: "operator", via: "mandate", task: read.task, chain: holders, ...(read.source ? { source: { ...read.source } } : {}) } };
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

/** FAC-SEM-144 on kind `mandate` (the document itself). */
export function mandateRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (kind === "mandate") {
    const problem = mandateProblem(value);
    return problem ? [{ code: "FAC-SEM-144", instancePath: "", message: `the mandate is not valid: ${problem} (DEC-0125 MD-1, MD-2)` }] : [];
  }
  return undefined;
}
// #endregion mandate
