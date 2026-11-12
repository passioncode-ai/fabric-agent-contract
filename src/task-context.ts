import { isDeepStrictEqual } from "node:util";
import { type Finding, type JsonObject, isObject } from "./findings.js";

// #region task-context (docs: docs/specification/contexts.md#the-context-of-a-task)
// DEC-0165: before an agent acts on a resource that belongs to a context, the task it serves has exactly one context
// (TC-1). The agent reads the sources that may claim one (TC-2); when they agree the context is settled, and when none
// claims while the agent reaches more than one context, or two claims differ, the agent asks the operator once (TC-3).
// `resolveTaskContext` is that reading; it never guesses and never picks a candidate.

/** The sources a task's context is read from (TC-2), in the order the page lists them. */
export const CLAIM_SOURCES = ["operator", "board", "folder", "grant", "place"] as const;
export type ClaimSource = (typeof CLAIM_SOURCES)[number];
/** One source's claim: the contexts it names; a Project listed for two organizations names both (TC-2). */
export interface ContextClaim { source: ClaimSource; contexts: string[] }

export type TaskContextAnswer =
  | { settled: string; by: ClaimSource[] }
  | { ask: string[] }
  | { conflict: Array<{ source: ClaimSource; context: string }> }
  /** The caller's own fault, never an answer: an input that is not a list of claims or of reachable contexts. */
  | { fault: "claims-invalid" | "reachable-invalid" };

/** `common.schema.json#/$defs/contextId`, compared as written (DEC-0082). */
const CONTEXT_ID = /^(?:personal|org:[A-Za-z0-9][A-Za-z0-9_-]{0,127})$/;
const MAX_CONTEXTS = 64;
const isContext = (value: unknown): value is string => typeof value === "string" && CONTEXT_ID.test(value);
const unique = <T>(values: T[]) => values.filter((value, index) => values.indexOf(value) === index);

function claimsOk(claims: unknown): claims is ContextClaim[] {
  return Array.isArray(claims) && claims.length <= CLAIM_SOURCES.length * 4 && claims.every((claim) =>
    isObject(claim) && (CLAIM_SOURCES as readonly unknown[]).includes(claim.source) &&
    Array.isArray(claim.contexts) && claim.contexts.length >= 1 && claim.contexts.length <= 16 && claim.contexts.every(isContext));
}

/**
 * The context of a task (DEC-0165 TC-2, TC-3). `claims` are what the sources name; `reachable` the contexts whose
 * resources the agent can reach. With claims: one context named by all of them is settled, by the sources that named it
 * in their order; more than one context named (two claims that differ, or one claim naming two) is a conflict, every
 * named context listed with its source. With no claim: a single reachable context, or none (`personal`), is settled by
 * no source; more than one reachable is asked, the candidates in the order given. Ids compare as written. It answers and
 * never throws.
 */
export function resolveTaskContext(claims: unknown, reachable: unknown): TaskContextAnswer {
  if (!claimsOk(claims)) return { fault: "claims-invalid" };
  if (!Array.isArray(reachable) || reachable.length > MAX_CONTEXTS || !reachable.every(isContext)) return { fault: "reachable-invalid" };
  if (claims.length > 0) {
    const named = unique(claims.flatMap((claim) => claim.contexts));
    if (named.length === 1) return { settled: named[0] as string, by: unique(claims.map((claim) => claim.source)) };
    return { conflict: claims.flatMap((claim) => unique(claim.contexts).map((context) => ({ source: claim.source, context }))) };
  }
  const candidates = unique(reachable as string[]);
  if (candidates.length > 1) return { ask: candidates };
  return { settled: candidates[0] ?? "personal", by: [] };
}

/** FAC-SEM-172 on kind `task-context` (`{claims, reachable, answer}`): the answer is the one `resolveTaskContext` gives. */
export function taskContextRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (kind !== "task-context") return undefined;
  const want = resolveTaskContext(value.claims, value.reachable);
  if (isDeepStrictEqual(value.answer, want)) return [];
  return [{ code: "FAC-SEM-172", instancePath: "/answer", message: `the task's context reads ${JSON.stringify(want)} (DEC-0165 TC-2, TC-3)` }];
}
// #endregion task-context
