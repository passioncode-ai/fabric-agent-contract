import { createHash } from "node:crypto";
import { rfc8785 } from "./canonical.js";
import { type Finding, type JsonObject, isObject } from "./findings.js";

// #region org-adaptation, docs: docs/specification/membership.md#the-adaptation-plan
/**
 * The organization part of an adaptation plan (DEC-0138, OM-7's adaptation row): what a person chose to bring into an
 * organization, each item by an opaque reference, and the person's requests to its administrators. The person's Fabric
 * sends the whole plan to the organization's server with the credential the server issued it for that person; each
 * revision replaces the last, and a revision with no items and no requests withdraws it. The server keeps the newest
 * revision it accepted and binds each administrator's decision to the request's digest, so a changed request waits for
 * a new decision and an unchanged one keeps its decision. Every function here answers and never throws.
 */
export const ORG_ADAPTATION_TYPE = "org-adaptation/1";
export const ORG_ADAPTATION_RECEIPT_TYPE = "org-adaptation-receipt/1";
/** The route, under the issuer's origin, `{org}` being the organization's opaque id (the part after `org:`): PUT a plan, GET the receipt. */
export const ORG_ADAPTATION_PATH = "/fabric/adaptation/v1/{org}/plan";
export const MAX_ITEMS = 200;
export const MAX_REQUESTS = 50;
/** The server's refusals of a plan, in the order `decideAdaptation` reads them. */
export const ORG_ADAPTATION_REFUSALS = ["not-a-member", "schema-unsupported", "malformed", "wrong-organization", "stale-revision", "revision-conflict"] as const;
export type OrgAdaptationRefusal = (typeof ORG_ADAPTATION_REFUSALS)[number];
export type RequestState = "pending" | "granted" | "refused" | "expired";
const DECIDED: readonly string[] = ["granted", "refused", "expired"];

const digestOf = (value: unknown): string | undefined => {
  try {
    return `sha256:${createHash("sha256").update(rfc8785(value)).digest("hex")}`;
  } catch {
    return undefined;
  }
};

/** The plan's digest: SHA-256 over its RFC 8785 form, as the receipt carries it. */
export function adaptationDigest(plan: unknown): string | undefined {
  return isObject(plan) ? digestOf(plan) : undefined;
}

/** A request's digest: SHA-256 over its RFC 8785 form. An administrator's decision is bound to it. */
export function requestDigest(request: unknown): string | undefined {
  return isObject(request) ? digestOf(request) : undefined;
}

const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

/**
 * FAC-SEM-153 on a plan: each item's `ref` is named once, each request's `id` once, and a request's `itemRef` names one
 * of the plan's items.
 */
export function adaptationFindings(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  if (!isObject(value)) return findings;
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-153", instancePath, message });
  const refs = new Set<unknown>();
  list(value.items).forEach((item, index) => {
    if (!isObject(item)) return;
    if (refs.has(item.ref)) flag(`/items/${index}/ref`, "an item's ref is named once in a plan");
    refs.add(item.ref);
  });
  const ids = new Set<unknown>();
  list(value.requests).forEach((request, index) => {
    if (!isObject(request)) return;
    if (ids.has(request.id)) flag(`/requests/${index}/id`, "a request's id is named once in a plan");
    ids.add(request.id);
    if (Object.hasOwn(request, "itemRef") && !refs.has(request.itemRef)) flag(`/requests/${index}/itemRef`, "a request's itemRef names one of the plan's items");
  });
  return findings;
}

export function orgAdaptationRules(kind: string, value: JsonObject): Finding[] | undefined {
  return kind === "org-adaptation" ? adaptationFindings(value) : undefined;
}

/** What the server holds for an organization's member: the newest accepted revision and its digest. */
export interface HeldAdaptation {
  revision: number;
  digest: string;
}

/** An administrator's decision, or the server's closing of a request without one (`expired`), bound to the request by id and digest. */
export interface RequestDecision {
  id: string;
  digest: string;
  state: "granted" | "refused" | "expired";
  at: string;
}

export interface AdaptationReceipt {
  type: typeof ORG_ADAPTATION_RECEIPT_TYPE;
  org: string;
  revision: number;
  digest: string;
  requests: { id: string; digest: string; state: RequestState; at?: string }[];
}

/**
 * The receipt for a plan the server holds: each request with its digest and the decision bound to that id and digest
 * (`granted`, `refused`, or `expired` when the server closed it without one), or `pending` when none is (a request
 * whose digest changed keeps no earlier decision). A decision that is not one of those, or has no `at`, is not bound.
 * `decisions` holds one entry per id and digest, its `at` an RFC 3339 time; the first that matches is the one shown.
 */
export function adaptationReceipt(plan: JsonObject, decisions: readonly RequestDecision[]): AdaptationReceipt | undefined {
  const digest = adaptationDigest(plan);
  if (digest === undefined || typeof plan.org !== "string" || !Number.isSafeInteger(plan.revision) || (plan.revision as number) < 1 || !Array.isArray(decisions)) return undefined;
  const requests: AdaptationReceipt["requests"] = [];
  for (const request of list(plan.requests)) {
    const requestId = isObject(request) ? request.id : undefined;
    const bound = requestDigest(request);
    if (typeof requestId !== "string" || bound === undefined) return undefined;
    const decision = decisions.find((entry) => isObject(entry) && entry.id === requestId && entry.digest === bound && typeof entry.state === "string" && DECIDED.includes(entry.state) && typeof entry.at === "string");
    requests.push(decision ? { id: requestId, digest: bound, state: decision.state, at: decision.at } : { id: requestId, digest: bound, state: "pending" });
  }
  return { type: ORG_ADAPTATION_RECEIPT_TYPE, org: plan.org, revision: plan.revision as number, digest, requests };
}

/**
 * The server's decision on a PUT plan, after it authenticated the person's credential, in this order: `not-a-member`
 * (the credential's person holds no active or suspended membership of the route's organization, `member` false);
 * `schema-unsupported` (the body names another `type` than `org-adaptation/1`, DEC-0067); `malformed` (the plan failed
 * its schema or FAC-SEM-153, `valid` false); `wrong-organization` (the plan names another organization than `org`, the
 * route's in its full `org:<orgId>` form); then against the held revision: a lower revision is `stale-revision`; the
 * same revision with another digest is `revision-conflict`; the same revision and digest is `repeated` (answered with
 * the same receipt, nothing stored); a higher revision is `accepted` and replaces the held one. A plan with no items
 * and no requests is accepted the same way, and withdraws what the member brought. A `held` that is not a revision
 * (`null` for no plan yet) holds none.
 */
export function decideAdaptation(
  plan: unknown,
  ctx: { member: boolean; valid: boolean; org: string; held?: HeldAdaptation }
): { outcome: "accepted" | "repeated"; held: HeldAdaptation } | { outcome: "refused"; refusal: OrgAdaptationRefusal } {
  if (!isObject(ctx) || ctx.member !== true) return { outcome: "refused", refusal: "not-a-member" };
  if (isObject(plan) && typeof plan.type === "string" && plan.type !== ORG_ADAPTATION_TYPE) return { outcome: "refused", refusal: "schema-unsupported" };
  if (!ctx.valid || !isObject(plan) || !Number.isSafeInteger(plan.revision)) return { outcome: "refused", refusal: "malformed" };
  const digest = adaptationDigest(plan);
  if (digest === undefined) return { outcome: "refused", refusal: "malformed" };
  if (plan.org !== ctx.org) return { outcome: "refused", refusal: "wrong-organization" };
  const revision = plan.revision as number;
  const held = ctx.held;
  if (isObject(held) && Number.isSafeInteger(held.revision)) {
    if (revision < held.revision) return { outcome: "refused", refusal: "stale-revision" };
    if (revision === held.revision) return digest === held.digest ? { outcome: "repeated", held } : { outcome: "refused", refusal: "revision-conflict" };
  }
  return { outcome: "accepted", held: { revision, digest } };
}
// #endregion org-adaptation
