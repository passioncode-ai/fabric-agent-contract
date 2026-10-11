import { chainDepth, effectClosure, MAX_APPROVAL_LIFETIME_SECONDS, MAX_DELEGATION_LIFETIME_SECONDS } from "./delegation.js";
import { type Finding, type JsonObject, isObject, jsonEqual } from "./findings.js";

// #region delegation-rules — docs: docs/specification/delegation.md#semantic-rules
const strings = (value: unknown): string[] => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);
const scopeNames = (value: unknown): string[] => (typeof value === "string" ? value.split(" ") : []);
const time = (value: unknown): number | undefined => (typeof value === "number" && Number.isFinite(value) ? value : undefined);

/** The remaining amount per window a token's `spend` claims; `undefined` for an unlimited or absent spend. */
function remaining(spend: unknown): Map<string, number> | undefined {
  if (!isObject(spend) || spend.mode !== "limited" || !Array.isArray(spend.remaining)) return undefined;
  const windows = new Map<string, number>();
  for (const entry of spend.remaining.filter(isObject)) if (typeof entry.window === "string" && typeof entry.remainingUsd === "number") windows.set(entry.window, entry.remainingUsd);
  return windows;
}

/**
 * FAC-SEM-049 (DEC-0039): a delegation token's claims are the profile's. It expires after it was issued and at
 * most 10 minutes after; its scope names each capability once; its spend names each window once.
 */
function delegationClaimsRules(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const iat = time(value.iat);
  const exp = time(value.exp);
  if (iat !== undefined && exp !== undefined && (exp <= iat || exp - iat > MAX_DELEGATION_LIFETIME_SECONDS)) {
    findings.push({ code: "FAC-SEM-049", instancePath: "/exp", message: `a delegation token lives more than 0 and at most ${MAX_DELEGATION_LIFETIME_SECONDS} seconds; this one ${exp - iat}` });
  }
  const names = scopeNames(value.scope);
  names.forEach((name, index) => {
    if (names.indexOf(name) !== index) findings.push({ code: "FAC-SEM-049", instancePath: "/scope", message: `the scope names ${name} twice` });
  });
  const spend = isObject(value.spend) ? value.spend : undefined;
  if (spend && Array.isArray(spend.remaining)) {
    const seen = new Set<unknown>();
    spend.remaining.filter(isObject).forEach((entry, index) => {
      if (seen.has(entry.window)) findings.push({ code: "FAC-SEM-049", instancePath: `/spend/remaining/${index}/window`, message: `the window ${String(entry.window)} is named twice` });
      seen.add(entry.window);
    });
  }
  return findings;
}

/**
 * FAC-SEM-050 (DEC-0039): the issuer minted the token within its grant and, for an onward call, narrower than
 * the token it was exchanged for. Input: `{ grant, token, parent? }` — the standing grant, the decoded claims
 * minted, and the decoded claims of the token the caller presented to call onward. A callee never runs this:
 * it never sees the parent.
 */
function delegationMintRules(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const push = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-050", instancePath, message });
  const grant = isObject(value.grant) ? value.grant : {};
  const token = isObject(value.token) ? value.token : {};
  const parent = isObject(value.parent) ? value.parent : undefined;

  if (typeof grant.audience !== "string") push("/grant/audience", "a token is minted only under a delegation grant, one that names its audience");
  else if (token.aud !== grant.audience) push("/token/aud", `the token is for ${String(token.aud)}, the grant for ${grant.audience}`);
  if (grant.state !== "active") push("/grant/state", `the grant is ${String(grant.state)}, not active`);
  const allowed = strings(grant.capabilities);
  for (const name of scopeNames(token.scope)) if (!allowed.includes(name)) push("/token/scope", `the grant does not name the capability ${name}`);
  const grantCeiling = effectClosure(strings(grant.effectCeiling));
  for (const effect of strings(token.effect)) if (!grantCeiling.has(effect)) push("/token/effect", `the effect ${effect} is above the grant's ceiling`);
  const external = new Set(strings(grant.effects));
  for (const effect of strings(grant.effectCeiling)) if (effect !== "none" && effect !== "draft" && !external.has(effect)) push("/grant/effectCeiling", `the ceiling's ${effect} is not among the grant's effects`);
  const expiresAt = typeof grant.expiresAt === "string" ? Date.parse(grant.expiresAt) / 1000 : Number.NaN;
  const exp = time(token.exp);
  if (exp !== undefined && Number.isFinite(expiresAt) && exp > expiresAt) push("/token/exp", "the token outlives its grant");
  if (typeof grant.project === "string" && token.project !== undefined && token.project !== grant.project) push("/token/project", `the token names project ${String(token.project)}, the grant ${grant.project}`);

  if (!parent) return findings;
  for (const claim of ["iss", "sub"] as const) if (token[claim] !== parent[claim]) push(`/token/${claim}`, `an onward token keeps the parent's ${claim}`);
  if (parent.project !== undefined && token.project !== parent.project) push("/token/project", "an onward token keeps the parent's project");
  const actor = isObject(token.act) ? token.act : {};
  if (actor.sub !== parent.aud) push("/token/act/sub", `the agent calling onward is ${String(parent.aud)}, the parent's audience, not ${String(actor.sub)}`);
  if (!jsonEqual(actor.act, parent.act)) push("/token/act/act", "an onward token's earlier actors are exactly the parent's chain");
  if (chainDepth(token.act) > chainDepth(parent.act) + 1) push("/token/act", "an onward token adds one actor");
  const parentCeiling = effectClosure(strings(parent.effect));
  for (const effect of strings(token.effect)) if (!parentCeiling.has(effect)) push("/token/effect", `the effect ${effect} is above the parent's ceiling`);
  const parentExp = time(parent.exp);
  if (exp !== undefined && parentExp !== undefined && exp > parentExp) push("/token/exp", "an onward token expires no later than its parent");
  const above = remaining(parent.spend);
  if (above) {
    const below = remaining(token.spend);
    if (!below) push("/token/spend", "an onward token of a limited parent is limited too");
    else for (const [window, amount] of above) {
      const left = below.get(window);
      if (left === undefined || left > amount) push("/token/spend", `the ${window} window may hold at most the parent's ${amount} remaining`);
    }
  }
  return findings;
}

/** FAC-SEM-051 (DEC-0039): an approval expires after it was issued and at most 24 hours after. */
function approvalClaimsRules(value: JsonObject): Finding[] {
  const iat = time(value.iat);
  const exp = time(value.exp);
  if (iat === undefined || exp === undefined || (exp > iat && exp - iat <= MAX_APPROVAL_LIFETIME_SECONDS)) return [];
  return [{ code: "FAC-SEM-051", instancePath: "/exp", message: `an approval lives more than 0 and at most ${MAX_APPROVAL_LIFETIME_SECONDS} seconds; this one ${exp - iat}` }];
}

export function delegationRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (kind === "delegation-claims") return delegationClaimsRules(value);
  if (kind === "delegation-mint") return delegationMintRules(value);
  if (kind === "approval-claims") return approvalClaimsRules(value);
  return undefined;
}
// #endregion delegation-rules
