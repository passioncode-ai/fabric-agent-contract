import { createHash, createHmac } from "node:crypto";
import { type ActionDecisionInput, actionDecision } from "./actions.js";
import { rfc8785 } from "./canonical.js";
import { type Finding, type JsonObject, isObject } from "./findings.js";
import { mandateCovers } from "./mandate.js";
import { strictTime } from "./rfc3339.js";
import { createValidatorSync } from "./validator.js";
import { SCHEMA_PREFIX } from "./contract.js";

// #region decision-verdict — docs: docs/specification/decision-verdict.md
/**
 * The decision verdict (DEC-0172, CT-302): `decision-verdict/1` records what a decision verifier concluded about one act,
 * and why. It is a receipt, never an authority (DV-1): a callee never takes a verdict as a decision, and an `allow` names
 * the route by which a form the callee already accepts reaches it, so a verifier that is wrong can only make the hub
 * withhold a form, never mint one the rules refuse. This module derives the verdict's digests, checks a verdict against
 * itself and against the reference (`actionDecision`, `mandateCovers`) as FAC-SEM-179, and is the hub's dispatch check
 * for a call that carries a verdict's receipt (DV-8). Malformed input answers findings or a refusal, never an exception.
 */

const sha256 = (text: string) => `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;

/** `askedDigest`: sha256 of the RFC 8785 canonical JSON of the verdict's `asked` (DV-2). */
export function askedDigest(asked: unknown): string {
  return sha256(rfc8785(asked));
}

/** The verdict's `id`: sha256 of the RFC 8785 canonical JSON of `{askedDigest, caller, policy, session}` (DV-2), so the
 *  same act asked again in one session under one policy has one id. */
export function verdictId(parts: { askedDigest: string; caller: string; policy: unknown; session: string }): string {
  return sha256(rfc8785({ askedDigest: parts.askedDigest, caller: parts.caller, policy: parts.policy, session: parts.session }));
}

/** `asked.argsDigest`: HMAC-SHA-256 under the host's own key of the RFC 8785 canonical JSON of the call's `input`, never
 *  a plain hash a reader could reverse by guessing (DV-2). */
export function argsDigest(hostKey: Uint8Array, input: unknown): string {
  return `hmac-sha256:${createHmac("sha256", hostKey).update(rfc8785(input), "utf8").digest("hex")}`;
}

/** The authority ground kinds each `allow` route stands on, and the grade the reference gives each from this caller. */
export const ROUTE_GROUNDS: Readonly<Record<string, { kinds: readonly string[]; grades: readonly string[] }>> = Object.freeze({
  operator: { kinds: ["decision"], grades: ["taken"] },
  forwarded: { kinds: ["relay", "decision"], grades: ["forwarded"] },
  level: { kinds: ["level-decision", "level-mandate"], grades: ["verified"] },
  profile: { kinds: ["standing"], grades: ["verified", "taken"] },
  mandate: { kinds: ["mandate"], grades: ["taken"] },
  approval: { kinds: ["approval"], grades: ["verified"] }
});

/** How long each verdict stands at most, in seconds (DV-2): an allow 15 minutes, a human 24 hours, a deny 1 hour, a
 *  person's denial 24 hours. */
const LIFETIME = { allow: 15 * 60, human: 24 * 60 * 60, deny: 60 * 60, personDenied: 24 * 60 * 60 } as const;

const own = (value: unknown, key: string): unknown => (isObject(value) && Object.hasOwn(value, key) ? value[key] : undefined);

/**
 * FAC-SEM-179 on one verdict document (DV-3, the document part): its digests derive; it expires after it starts and
 * within its verdict's bound; an `allow` stands on a ground of its route with the route's grade, carries no `data`
 * ground, and names the machine form its route goes by (`none` exactly with `own-act`, `caller-approval` exactly with
 * `approval`, `executed-by-holder` only with `level`); a `human` asks only when it names addressees, gives a step's link
 * only with the step, and names an AP-4 step for `body-gate` (any step) and only for it or `spend-limit`
 * (`spend-above-limit`); a person's denial names their answer and a self-approval AP-5.
 */
function verdictDocument(value: JsonObject, at = ""): Finding[] {
  const findings: Finding[] = [];
  const flag = (path: string, message: string) => findings.push({ code: "FAC-SEM-179", instancePath: `${at}${path}`, message });
  if (isObject(value.asked)) {
    let derived: string | null = null;
    try { derived = askedDigest(value.asked); } catch { flag("/asked", "asked has no canonical form, so no askedDigest derives from it"); }
    if (derived !== null && value.askedDigest !== derived) flag("/askedDigest", "askedDigest is sha256 of the RFC 8785 form of asked");
  }
  if (typeof value.askedDigest === "string" && typeof value.caller === "string" && typeof value.session === "string" && isObject(value.policy)) {
    let derived: string | null = null;
    try { derived = verdictId({ askedDigest: value.askedDigest, caller: value.caller, policy: value.policy, session: value.session }); } catch { flag("/id", "the verdict has no canonical form, so no id derives from it"); }
    if (derived !== null && value.id !== derived) flag("/id", "the id is sha256 of the RFC 8785 form of {askedDigest, caller, policy, session}");
  }
  const start = strictTime(value.at);
  const end = strictTime(value.expiresAt);
  if (!Number.isNaN(start) && !Number.isNaN(end)) {
    const bound = value.verdict === "allow" ? LIFETIME.allow : value.verdict === "human" ? LIFETIME.human : value.reason === "person-denied" ? LIFETIME.personDenied : LIFETIME.deny;
    if (end <= start) flag("/expiresAt", "a verdict expires after it is given");
    else if (end - start > bound * 1000) flag("/expiresAt", `a ${value.verdict === "deny" ? String(value.reason) : String(value.verdict)} verdict stands at most ${bound / 60} minutes`);
  }
  const grounds = Array.isArray(value.grounds) ? value.grounds.filter(isObject) : [];
  if (value.verdict === "allow") {
    const route = typeof value.route === "string" && Object.hasOwn(ROUTE_GROUNDS, value.route) ? ROUTE_GROUNDS[value.route] : undefined;
    if (route !== undefined && !grounds.some((g) => route.kinds.includes(g.kind as string) && route.grades.includes(g.grade as string))) {
      flag("/grounds", `an allow by route ${String(value.route)} stands on a ${route.kinds.join(" or ")} ground graded ${route.grades.join(" or ")}`);
    }
    grounds.forEach((g, i) => { if (g.grade === "data") flag(`/grounds/${i}/grade`, "a ground the reference does not take from this caller never stands beside an allow"); });
    const form = value.machineForm;
    if ((value.route === "own-act") !== (form === "none")) flag("/machineForm", "an own act reaches the callee by no form (none), and only an own act does");
    if ((value.route === "approval") !== (form === "caller-approval")) flag("/machineForm", "an approval reaches the callee as the caller's approval/1 (caller-approval), and only an approval does");
    if (form === "executed-by-holder" && value.route !== "level") flag("/machineForm", "only a level holder's own agent executes under its own level decision");
  }
  if (value.verdict === "human" && isObject(value.human)) {
    const human = value.human;
    const addressees = Array.isArray(human.addressees) ? human.addressees : [];
    if (human.questionId !== undefined && addressees.length === 0) flag("/human/questionId", "a question is put only to the addressees it names; advice asks no one");
    if (human.url !== undefined && human.humanStep === undefined) flag("/human/url", "a link goes only with a person's step (AP-4)");
    if (value.reason === "body-gate" && human.humanStep === undefined) flag("/human/humanStep", "a body gate names the person's step (AP-4)");
    if (human.humanStep !== undefined && value.reason !== "body-gate" && !(value.reason === "spend-limit" && human.humanStep === "spend-above-limit")) {
      flag("/human/humanStep", "a person's step goes with body-gate, or spend-above-limit with spend-limit (DV-7)");
    }
  }
  if (value.verdict === "deny") {
    if ((value.reason === "person-denied" || value.reason === "rejected") && !(typeof value.rule === "string" && value.rule.startsWith("answer:"))) flag("/rule", "a person's denial names their answer (answer:<questionId>)");
    if (value.reason === "self-approval" && value.rule !== "AP-5") flag("/rule", "a self-approval is refused by AP-5");
  }
  return findings;
}

/** The routes the reference's record maps to: who decided, and how (DV-1, DV-2). */
export function routesOf(recordAs: unknown): string[] {
  if (recordAs === "caller") return ["own-act"];
  if (!isObject(recordAs)) return [];
  const { by, via } = recordAs;
  if (via === "approval") return ["approval"];
  if (via === "elicitation") return ["operator"];
  if (via === "relayed-instruction") return isObject(recordAs.source) ? ["forwarded"] : ["operator"];
  if (via === "level-command") return ["level"];
  if (via === "profile") return ["profile"];
  if (via === "mandate") return by === "level" ? ["level"] : ["mandate"];
  return [];
}

/**
 * What the reference input says of the call a verdict asked about (DV-3): the tier, the capability, the action (the
 * decision's action where the call carries one, else the capability, DV-2), and the effect, context, project and spend
 * where the input carries them.
 */
function callOfReference(reference: JsonObject): JsonObject {
  const input = isObject(reference.input) ? reference.input : {};
  if (reference.check === "mandate") {
    const call = isObject(input.call) ? input.call : {};
    return { tier: input.tier, capability: call.capability, action: call.capability, effect: call.effect, context: call.context, project: call.project, spendUsd: call.spendUsd };
  }
  const declared = isObject(input.action) ? input.action : {};
  const decided = isObject(input.decision) && typeof input.decision.action === "string" ? input.decision.action : undefined;
  return { tier: input.tier, capability: declared.tool, action: decided ?? declared.tool, effect: input.effect, context: input.context, project: input.project, spendUsd: input.spendUsd };
}

/**
 * FAC-SEM-179 against the contract (DV-3, by construction): `{verdict, reference}`, `reference` being `{check: "action",
 * input}` (an `actionDecision` input) or `{check: "mandate", input}` (a `mandateCovers` input), the form the verdict's
 * route and grounds name with the call it asked about. The verdict's `asked` is that call (its tier, capability and
 * action, and its effect, context, project and spend where the input names them); an `allow` is consistent only when the
 * reference takes the call, and its route is how the reference took it; a `human` or a `deny` is the verifier's own and
 * checked as a document.
 */
function verdictAgainstReference(value: JsonObject): Finding[] {
  const verdict = isObject(value.verdict) ? value.verdict : {};
  const findings = verdictDocument(verdict, "/verdict");
  if (verdict.verdict !== "allow") return findings;
  const reference = isObject(value.reference) ? value.reference : {};
  const asked = isObject(verdict.asked) ? verdict.asked : {};
  const call = callOfReference(reference);
  // A job's input step reaches the hub as `fabric.job.get`, while `mandateCovers` reads the job's own capability (MJ-1),
  // so a step is checked only against `actionDecision`, whose `mandateCapability` carries the job's capability.
  if (reference.check === "mandate" && asked.capability === "fabric.job.get") {
    findings.push({ code: "FAC-SEM-179", instancePath: "/reference/check", message: "a job's input step is checked with check: action, which reads it as the hub sees it (fabric.job.get) and the job's capability as mandateCapability" });
  }
  for (const field of ["tier", "capability", "action", "effect", "context", "project", "spendUsd"]) {
    if (call[field] !== undefined && asked[field] !== call[field]) {
      findings.push({ code: "FAC-SEM-179", instancePath: `/verdict/asked/${field}`, message: `the verdict asked about another call than the reference reads: ${field} ${String(asked[field])}, not ${String(call[field])}` });
    }
  }
  const flag = (message: string) => findings.push({ code: "FAC-SEM-179", instancePath: "/verdict/verdict", message });
  let answer: unknown;
  try {
    answer = reference.check === "action" ? actionDecision((isObject(reference.input) ? reference.input : {}) as ActionDecisionInput)
      : reference.check === "mandate" ? mandateCovers((isObject(reference.input) ? reference.input : {}) as Parameters<typeof mandateCovers>[0])
      : undefined;
  } catch { answer = undefined; }
  if (!isObject(answer) || answer.ok !== true) {
    flag("an allow the reference refuses: the verifier never mints a form the rules refuse (DV-1, DV-3)");
    return findings;
  }
  const routes = routesOf(answer.recordAs);
  if (!routes.includes(verdict.route as string)) flag(`the reference took the call by route ${routes.join(" or ") || "none"}, not ${String(verdict.route)}`);
  return findings;
}

let verdictShape: ((value: unknown) => boolean) | undefined;

/** A hub's answer to a call that carries a verdict's receipt (DV-8). */
export type VerdictDispatch =
  | { dispatch: "forward" }
  | { dispatch: "verified" }
  | { ok: false; code: "decision-invalid"; data: { detail: "verdict-mismatch" } };

/**
 * The hub's check before it dispatches a call that carries `verdict` (DV-8, `interop-agent-call-2`): it reads the
 * verdict by `id` from its journal (`journal`, the document it holds, or undefined) and dispatches only while it is a
 * current `allow` whose `id` and `askedDigest` are the call's, whose own digests derive, and whose `asked` names the
 * call's `agentId`, `capability` and action (the call's `decision.action`, else its capability) and whose `argsDigest`
 * is the call's `input` under the host's key; otherwise `decision-invalid` with detail `verdict-mismatch`, the one
 * DL-19 detail the hub answers itself. A call without `verdict` is forwarded as C3.5 says.
 */
export function checkVerdictDispatch(input: { call: unknown; journal: unknown; now: unknown; hostKey: Uint8Array }): VerdictDispatch {
  const mismatch: VerdictDispatch = { ok: false, code: "decision-invalid", data: { detail: "verdict-mismatch" } };
  const receipt = own(input.call, "verdict");
  if (receipt === undefined) return { dispatch: "forward" };
  const verdict = input.journal;
  if (!isObject(receipt) || !isObject(verdict) || !isObject(verdict.asked)) return mismatch;
  // The journal is the hub's own store, but a record that is not a decision-verdict/1 never dispatches.
  verdictShape ??= createValidatorSync().getSchema(`${SCHEMA_PREFIX}schemas/decision-verdict.schema.json`) ?? undefined;
  if (verdictShape === undefined || verdictShape(verdict) !== true) return mismatch;
  if (verdict.verdict !== "allow" || verdict.id !== receipt.id || verdict.askedDigest !== receipt.askedDigest) return mismatch;
  if (verdictDocument(verdict).length > 0) return mismatch;
  const clock = strictTime(input.now);
  const start = strictTime(verdict.at);
  const end = strictTime(verdict.expiresAt);
  if ([clock, start, end].some(Number.isNaN) || clock < start || clock >= end) return mismatch;
  const call = input.call as JsonObject;
  const action = isObject(call.decision) && typeof call.decision.action === "string" ? call.decision.action : call.capability;
  const asked = verdict.asked;
  if (asked.callee !== call.agentId || asked.capability !== call.capability || asked.action !== action) return mismatch;
  let digest: string | null = null;
  try { digest = argsDigest(input.hostKey, call.input); } catch { return mismatch; }
  return digest === asked.argsDigest ? { dispatch: "verified" } : mismatch;
}

export function decisionVerdictRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (kind === "decision-verdict") return verdictDocument(value);
  if (kind === "decision-verdict-reference") return verdictAgainstReference(value);
  return undefined;
}
// #endregion decision-verdict
