import { createHash, createPublicKey, verify as verifySignature, type KeyObject } from "node:crypto";
import { rfc8785 } from "./canonical.js";
import { isSmallOrderKey } from "./ed25519.js";
import { AGENT_ID } from "./fabric-links.js";
import { isObject, type JsonObject } from "./findings.js";

// #region delegation-verifier — docs: docs/specification/delegation.md#the-verifier
/**
 * The callee's side of `fabric-delegation/0.1` (DEC-0039, Fabric ADR-0144): check a delegation token or an
 * approval offline, against the estate's published keys, and answer `ok` or one refusal code. Node's own
 * crypto verifies Ed25519 (RFC 8037 `EdDSA`); no JOSE library is needed.
 *
 * Attenuation is the issuer's check, not the verifier's: a callee never sees the parent of the token it is
 * handed, so it checks only what it can — the signature, the claims' types, the times, that the token names it,
 * the chain's depth, and that the called capability and its effect are inside the token (DL-13, in that order).
 */

/** Every refusal code of the contract (DEC-0039 §Refusal codes). DEC-0037's grant-check codes are a subset. */
export const REFUSAL_CODES = [
  "unauthenticated",
  "token-expired",
  "wrong-audience",
  "scope-not-granted",
  "effect-above-ceiling",
  "no-grant",
  "grant-expired",
  "grant-revoked",
  "limit-reached",
  "approval-required",
  "approval-invalid",
  "approval-reused",
  "principal-unproven",
  "credential-source-refused",
  "chain-too-deep",
  "issuer-unavailable",
  "unknown-state"
] as const;
export type RefusalCode = (typeof REFUSAL_CODES)[number];

/** The governance effect classes (`common.schema.json#/$defs/effectClass`). */
export const EFFECT_CLASSES = ["none", "draft", "publish", "send", "reply", "charge", "delete", "merge", "deploy", "change-policy"] as const;
export type EffectClass = (typeof EFFECT_CLASSES)[number];

/** The HTTP header a hub that forwards a call puts the delegation token in. */
export const DELEGATION_HEADER = "Fabric-Delegation";
/** JWT `typ` of a delegation token and of an approval: one can never be read as the other (RFC 8725 §3.11). */
export const DELEGATION_TYP = "fabric-delegation+jwt";
export const APPROVAL_TYP = "fabric-approval+jwt";
/** A delegation token lives at most 10 minutes; an approval at most 24 hours. */
export const MAX_DELEGATION_LIFETIME_SECONDS = 600;
export const MAX_APPROVAL_LIFETIME_SECONDS = 86_400;
/** The actor chain is at most four deep, the agent now calling included; a token for the meter one deeper (DL-6). */
export const MAX_CHAIN_DEPTH = 4;
/** Clock skew tolerated between issuer and callee, both ways. */
export const LEEWAY_SECONDS = 60;

/** An Ed25519 public key as the estate publishes it (RFC 8037). */
export interface Jwk { kty: string; crv?: string; x?: string; kid?: string; use?: string; alg?: string; [member: string]: unknown }
export interface Jwks { keys: Jwk[] }

export interface Actor { sub: string; session?: string; act?: Actor }
export interface SpendRemaining { mode: "unlimited" | "limited"; remaining?: Array<{ window: string; remainingUsd: number }>; perCallMaxUsd?: number }
export interface DelegationClaims {
  iss: string;
  sub: string;
  act: Actor;
  aud: string;
  scope: string;
  effect: EffectClass[];
  grant: string[];
  spend?: SpendRemaining;
  project?: string;
  /** DEC-0041: the issuing host's task the work runs under; the meter keys the task window on it. */
  task?: string;
  iat: number;
  exp: number;
  jti: string;
}
export interface ApprovalClaims {
  iss: string;
  actionDigest: string;
  aud: string;
  approver: string;
  /** DEC-0045: `device` is removed until a decision defines it. */
  method: "prompt" | "operator-channel";
  iat: number;
  exp: number;
  jti: string;
}

/** A refusal: the code goes in `error.code`; `detail` and `data` go in `error.data` (never a token, never a key). */
export interface Refusal { ok: false; code: RefusalCode; detail: string; data?: { actionDigest?: string } }
export interface DelegationAccepted {
  ok: true;
  claims: DelegationClaims;
  /** The person the work is for (`sub`). */
  principal: string;
  /** The agent now calling: the outermost actor. */
  caller: string;
  /** Every actor, the caller first, the first agent of the chain last. */
  chain: string[];
  kid: string;
}
export interface ApprovalAccepted { ok: true; claims: ApprovalClaims; approver: string; method: ApprovalClaims["method"]; kid: string }

export interface VerifyDelegationOptions {
  /** This callee's own agent id: the token's `aud` must equal it. */
  audience: string;
  /** The estate's published keys; absent or empty means the issuer cannot be checked. */
  jwks: Jwks | undefined;
  /** Now, in seconds since the epoch (a JWT NumericDate) — not milliseconds. */
  now: number;
  /** The capability being called (its tool name). */
  capability: string;
  /** That capability's declared effect class (from its manifest entry). */
  effect: EffectClass;
  /** The issuer this callee trusts (`auth.delegation.issuer`): `iss` must equal it. Required (DL-13 row 1). */
  issuer: string;
  /** A read-only door (DL-3): it serves `effect: none` only and refuses any other capability, whatever the ceiling. */
  readOnly?: boolean;
}

/** Where a callee records consumed approval ids. It MUST survive a restart for the approval's lifetime. */
export interface JtiStore { consume(jti: string, expiresAt: number, now: number): boolean }

export interface VerifyApprovalOptions {
  audience: string;
  jwks: Jwks | undefined;
  now: number;
  /** `sha256:<hex>` of the RFC 8785 canonical JSON of the action the callee is about to take. */
  actionDigest: string;
  /** The issuer this callee trusts: `iss` must equal it. Required. */
  issuer: string;
  /** Where the approval's `jti` is consumed; a second use is `approval-reused`. Required: replay protection is
   * not optional, and a caller that truly needs none passes `UNSAFE_NO_JTI_STORE` by name. */
  jtiStore: JtiStore;
}

/** A store that consumes nothing: every approval may be replayed until it expires. Only on purpose, by name. */
export const UNSAFE_NO_JTI_STORE: JtiStore = Object.freeze({ consume: () => true });

const refuse = (code: RefusalCode, detail: string, data?: Refusal["data"]): Refusal => (data ? { ok: false, code, detail, data } : { ok: false, code, detail });

const B64URL = /^[A-Za-z0-9_-]+$/;
/** A session or task id (`delegation-token.schema.json#/$defs/session`, `#/$defs/task`): opaque, 1–128 characters. */
export const OPAQUE_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const isString = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const isTime = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0;

interface Compact { header: JsonObject; payload: JsonObject; signingInput: Buffer; signature: Buffer }

/**
 * Whether a JSON text (already known to parse) repeats a member name in one object. `JSON.parse` keeps the last
 * of two, so `{"aud":"a","aud":"b"}` would be read as one claim while another reader saw the other (RFC 7515
 * §5.2, RFC 8725 §3.2): a duplicate is refused, never resolved.
 */
export function hasDuplicateMembers(text: string): boolean {
  const stack: Array<{ keys?: Set<string>; expectKey: boolean }> = [];
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      let j = i + 1;
      while (j < text.length && text[j] !== '"') j += text[j] === "\\" ? 2 : 1;
      const top = stack[stack.length - 1];
      if (top?.keys && top.expectKey) {
        const key = JSON.parse(text.slice(i, j + 1)) as string;
        if (top.keys.has(key)) return true;
        top.keys.add(key);
        top.expectKey = false;
      }
      i = j;
    } else if (c === "{") stack.push({ keys: new Set(), expectKey: true });
    else if (c === "[") stack.push({ expectKey: false });
    else if (c === "}" || c === "]") stack.pop();
    else if (c === ",") { const top = stack[stack.length - 1]; if (top?.keys) top.expectKey = true; }
  }
  return false;
}

type Segment = { value: JsonObject } | { problem: "malformed" | "duplicate-member" };

function decodeSegment(segment: string): Segment {
  if (!B64URL.test(segment)) return { problem: "malformed" };
  try {
    const text = Buffer.from(segment, "base64url").toString("utf8");
    const value: unknown = JSON.parse(text);
    if (!isObject(value)) return { problem: "malformed" };
    return hasDuplicateMembers(text) ? { problem: "duplicate-member" } : { value };
  } catch {
    return { problem: "malformed" };
  }
}

function parseCompact(token: unknown): Compact | { problem: "malformed" | "duplicate-member" } {
  if (typeof token !== "string" || token.length > 8192) return { problem: "malformed" };
  const parts = token.split(".");
  if (parts.length !== 3) return { problem: "malformed" };
  const [h, p, s] = parts as [string, string, string];
  const header = decodeSegment(h);
  const payload = decodeSegment(p);
  if (!B64URL.test(s)) return { problem: "malformed" };
  for (const part of [header, payload]) if ("problem" in part) return { problem: part.problem };
  return { header: (header as { value: JsonObject }).value, payload: (payload as { value: JsonObject }).value, signingInput: Buffer.from(`${h}.${p}`, "ascii"), signature: Buffer.from(s, "base64url") };
}

/** Header rules shared by both documents: EdDSA, the expected `typ`, a `kid`, and nothing that points at a key elsewhere. */
function headerProblem(header: JsonObject, typ: string): string | undefined {
  if (header.alg !== "EdDSA") return "alg-not-eddsa";
  if (header.typ !== typ) return "wrong-typ";
  if (!isString(header.kid)) return "no-kid";
  for (const member of ["crit", "jku", "jwk", "x5u", "x5c"]) if (header[member] !== undefined) return `header-${member}`;
  return undefined;
}

type KeyLookup = { key: KeyObject } | { problem: "unknown-key" | "unusable-key" | "small-order-key" | "duplicate-kid" | "key-not-for-signing" };

function keyFor(jwks: Jwks, kid: string): KeyLookup {
  const matches = jwks.keys.filter((candidate) => isObject(candidate) && candidate.kid === kid);
  if (matches.length > 1) return { problem: "duplicate-kid" };
  const jwk = matches[0];
  if (!jwk) return { problem: "unknown-key" };
  // A key published for another use or algorithm is never a candidate (RFC 7517 §4.2, §4.4); the published set is
  // then outside delegation-jwks.schema.json, which is the issuer's fault (DL-13 row 3, F-B-319).
  if ((jwk.use !== undefined && jwk.use !== "sig") || (jwk.alg !== undefined && jwk.alg !== "EdDSA")) return { problem: "key-not-for-signing" };
  if (jwk.kty !== "OKP" || jwk.crv !== "Ed25519" || !isString(jwk.x) || jwk.d !== undefined) return { problem: "unusable-key" };
  // CT-29: a small-order key verifies forged signatures on Node 20 and 22; it is refused before any verification.
  const raw = Buffer.from(jwk.x, "base64url");
  if (raw.length !== 32) return { problem: "unusable-key" };
  if (isSmallOrderKey(raw)) return { problem: "small-order-key" };
  try {
    return { key: createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: jwk.x }, format: "jwk" }) };
  } catch {
    return { problem: "unusable-key" };
  }
}

const hasKeys = (jwks: Jwks | undefined): jwks is Jwks => isObject(jwks) && Array.isArray(jwks.keys) && jwks.keys.length > 0;

type Checked = { compact: Compact; kid: string } | { problem: string; issuer?: true };

/** Parse, check the header, find the key, verify the signature. A problem with the published keys themselves is the issuer's. */
function authentic(token: unknown, jwks: Jwks, typ: string): Checked {
  const compact = parseCompact(token);
  if ("problem" in compact) return { problem: compact.problem };
  const header = headerProblem(compact.header, typ);
  if (header) return { problem: header };
  const kid = compact.header.kid as string;
  const found = keyFor(jwks, kid);
  if ("problem" in found) return found.problem === "unknown-key" ? { problem: found.problem } : { problem: found.problem, issuer: true };
  // RFC 8032 §5.1.7: an Ed25519 signature is 64 bytes. Node's verify already answers false for any other length,
  // so on Node no test can tell this check is there (P2-03 plant M25); it stays for a port whose library is laxer.
  if (compact.signature.length !== 64 || !verifySignature(null, compact.signingInput, found.key, compact.signature)) return { problem: "bad-signature" };
  return { compact, kid };
}

/** Depth of an actor chain; `Infinity` for a chain that is not one (a missing or non-string `sub` at any level). */
export function chainDepth(act: unknown): number {
  let depth = 0;
  let node: unknown = act;
  while (node !== undefined) {
    if (!isObject(node) || !isString(node.sub)) return Number.POSITIVE_INFINITY;
    depth += 1;
    if (depth > 64) return depth;
    node = node.act;
  }
  return depth;
}

function chainOf(act: Actor): string[] {
  const chain: string[] = [];
  for (let node: Actor | undefined = act; node; node = node.act) chain.push(node.sub);
  return chain;
}

/**
 * The effect classes a ceiling admits. `none` (a read) is below every class and `draft` below every external
 * effect; the external classes are not ordered against each other, so a ceiling of `delete` admits no `charge`.
 */
export function effectClosure(ceiling: readonly string[]): Set<string> {
  const admitted = new Set<string>(ceiling);
  if (ceiling.length > 0) admitted.add("none");
  if (ceiling.some((effect) => effect !== "none")) admitted.add("draft");
  return admitted;
}

export const effectWithin = (effect: string, ceiling: readonly string[]): boolean => effectClosure(ceiling).has(effect);

/** A URI as DL-2 types one: a scheme, a colon and no white space (`urn:person:operator`, `https://…`). */
const URI = /^[A-Za-z][A-Za-z0-9+.-]*:\S+$/;
/** `delegation-token.schema.json` `jti` and `scope`: the claims' grammar, so a port reading the schema agrees. */
const JTI = /^[A-Za-z0-9._~-]{16,128}$/;
const SCOPE = /^[a-z][a-z0-9._-]{1,127}( [a-z][a-z0-9._-]{1,127})*$/;
const SPEND_WINDOWS: readonly unknown[] = ["total", "task", "project", "day", "week", "month"];
const isUri = (value: unknown): value is string => typeof value === "string" && URI.test(value);
const isAmount = (value: unknown): boolean => typeof value === "number" && Number.isFinite(value) && value >= 0;

/** The actor chain's depth when every actor is DL-2's — an agent id `sub`, an optional session id — else `undefined`. */
function actorChainDepth(act: unknown): number | undefined {
  // DL-2: a token always names at least one actor, the agent that holds it; no `act` is a malformed chain (CT-31).
  if (act === undefined) return undefined;
  let depth = 0;
  for (let node: unknown = act; node !== undefined; node = (node as JsonObject).act) {
    if (!isObject(node) || typeof node.sub !== "string" || !AGENT_ID.test(node.sub)) return undefined;
    if (node.session !== undefined && !(typeof node.session === "string" && OPAQUE_ID.test(node.session))) return undefined;
    depth += 1;
  }
  return depth;
}

/** `spend` as DL-2 types it: unlimited, or limited with one to six windows' remaining amounts and an optional per-call cap. */
function spendShaped(spend: unknown): boolean {
  if (!isObject(spend)) return false;
  if (spend.mode === "unlimited") return true;
  if (spend.mode !== "limited" || !Array.isArray(spend.remaining) || spend.remaining.length === 0 || spend.remaining.length > 6) return false;
  if (!spend.remaining.every((entry) => isObject(entry) && SPEND_WINDOWS.includes(entry.window) && isAmount(entry.remainingUsd))) return false;
  return spend.perCallMaxUsd === undefined || isAmount(spend.perCallMaxUsd);
}

type Shaped<T> = { claims: T } | { problem: string };

/**
 * DL-13 row 5: the claims have DL-2's types. A claim the profile does not know is ignored (RFC 7519 §4); every
 * claim it knows is checked for its type (F-B-307). Members the schema forbids inside `act` and inside `spend`
 * entries (`additionalProperties: false`) are not refused here, so a port that also applies the schema may refuse a
 * token this verifier accepts; both refuse every token with a wrong type.
 */
function delegationShape(payload: JsonObject): Shaped<DelegationClaims> & { depth?: number } {
  const { iss, sub, act, aud, scope, effect, grant, spend, project, task, iat, exp, nbf, jti } = payload;
  const depth = actorChainDepth(act);
  if (depth === undefined) return { problem: "malformed-chain" };
  const typed = isUri(iss) && isUri(sub) && typeof aud === "string" && AGENT_ID.test(aud)
    && typeof scope === "string" && scope.length <= 4096 && SCOPE.test(scope)
    && Array.isArray(effect) && effect.length > 0 && new Set(effect).size === effect.length && effect.every((e) => (EFFECT_CLASSES as readonly unknown[]).includes(e))
    // DEC-0045: exactly one grant (F-B-305).
    && Array.isArray(grant) && grant.length === 1 && typeof grant[0] === "string" && grant[0].length >= 1 && grant[0].length <= 256
    && (spend === undefined || spendShaped(spend)) && (project === undefined || isUri(project))
    // DEC-0041: an optional claim the meter keys a window on is typed like any other.
    && (task === undefined || (typeof task === "string" && OPAQUE_ID.test(task)))
    && isTime(iat) && isTime(exp) && (nbf === undefined || isTime(nbf)) && typeof jti === "string" && JTI.test(jti);
  return typed ? { claims: payload as unknown as DelegationClaims, depth } : { problem: "malformed-claims" };
}

function approvalShape(payload: JsonObject): ApprovalClaims | undefined {
  const { iss, actionDigest, aud, approver, method, iat, exp, jti } = payload;
  if (!isString(iss) || !isString(actionDigest) || !isString(aud) || !isString(approver) || !isString(jti) || !isTime(iat) || !isTime(exp)) return undefined;
  // DEC-0045: `device` is not a method until a decision defines it (F-B-314).
  if (method !== "prompt" && method !== "operator-channel") return undefined;
  return payload as unknown as ApprovalClaims;
}

/** DL-13 for one call, the chain allowed `maxDepth` actors: four for a callee, five for the meter's own token (DL-6). */
function verifyAt(token: string, options: VerifyDelegationOptions, maxDepth: number): DelegationAccepted | Refusal {
  const { audience, jwks, now, capability, effect, issuer, readOnly } = options;
  // Row 1: whom the callee trusts, and that issuer's keys.
  if (!isString(issuer)) return refuse("issuer-unavailable", "no-trusted-issuer");
  if (!hasKeys(jwks)) return refuse("issuer-unavailable", "no-published-keys");
  // Rows 2–4: form, header, key, signature.
  const checked = authentic(token, jwks, DELEGATION_TYP);
  if ("problem" in checked) return refuse(checked.issuer ? "issuer-unavailable" : "unauthenticated", checked.problem);
  // Row 5: DL-2's types, then the issuer.
  const shaped = delegationShape(checked.compact.payload);
  if ("problem" in shaped) return refuse("unauthenticated", shaped.problem);
  const { claims } = shaped;
  if (claims.iss !== issuer) return refuse("unauthenticated", "wrong-issuer");
  // Row 6: the lifetime and the times a token can hold before it is used.
  if (claims.exp <= claims.iat || claims.exp - claims.iat > MAX_DELEGATION_LIFETIME_SECONDS) return refuse("unauthenticated", "lifetime-above-profile");
  if (claims.iat > now + LEEWAY_SECONDS) return refuse("unauthenticated", "issued-in-future");
  const nbf = checked.compact.payload.nbf as number | undefined;
  if (nbf !== undefined && nbf > now + LEEWAY_SECONDS) return refuse("unauthenticated", "not-yet-valid");
  // Rows 7–11.
  if (now > claims.exp + LEEWAY_SECONDS) return refuse("token-expired", "expired");
  if (claims.aud !== audience) return refuse("wrong-audience", "audience-mismatch");
  if ((shaped.depth as number) > maxDepth) return refuse("chain-too-deep", `depth-${shaped.depth}`);
  if (!claims.scope.split(" ").includes(capability)) return refuse("scope-not-granted", "capability-not-in-scope");
  if (readOnly && effect !== "none") return refuse("effect-above-ceiling", "read-only-door");
  if (!effectWithin(effect, claims.effect)) return refuse("effect-above-ceiling", `effect-${effect}`);
  return { ok: true, claims, principal: claims.sub, caller: claims.act.sub, chain: chainOf(claims.act), kid: checked.kid };
}

/**
 * Check a delegation token for one call, in DL-13's order: nothing about a token is believed before its
 * signature is, so an unsigned token learns only `unauthenticated`.
 */
export function verifyDelegation(token: string, options: VerifyDelegationOptions): DelegationAccepted | Refusal {
  return verifyAt(token, options, MAX_CHAIN_DEPTH);
}

/**
 * Check an operator's approval for one action. A missing approval is `approval-required` carrying the action
 * digest, so the caller can ask the hub for one; every other fault of the document is `approval-invalid`.
 */
export function verifyApproval(approval: string | undefined, options: VerifyApprovalOptions): ApprovalAccepted | Refusal {
  const { audience, jwks, now, actionDigest: expected, issuer, jtiStore } = options;
  if (approval === undefined || approval === "") return refuse("approval-required", "no-approval", { actionDigest: expected });
  if (!isObject(jtiStore) || typeof jtiStore.consume !== "function") return refuse("unknown-state", "no-jti-store");
  if (!isString(issuer)) return refuse("issuer-unavailable", "no-trusted-issuer");
  if (!hasKeys(jwks)) return refuse("issuer-unavailable", "no-published-keys");
  const checked = authentic(approval, jwks, APPROVAL_TYP);
  if ("problem" in checked) return refuse(checked.issuer ? "issuer-unavailable" : "approval-invalid", checked.problem);
  const claims = approvalShape(checked.compact.payload);
  if (!claims) return refuse("approval-invalid", "malformed-claims");
  if (claims.iss !== issuer) return refuse("approval-invalid", "wrong-issuer");
  if (claims.exp <= claims.iat || claims.exp - claims.iat > MAX_APPROVAL_LIFETIME_SECONDS) return refuse("approval-invalid", "lifetime-above-profile");
  if (claims.iat > now + LEEWAY_SECONDS) return refuse("approval-invalid", "issued-in-future");
  if (now > claims.exp + LEEWAY_SECONDS) return refuse("approval-invalid", "expired");
  if (claims.aud !== audience) return refuse("approval-invalid", "audience-mismatch");
  if (claims.actionDigest !== expected) return refuse("approval-invalid", "digest-mismatch", { actionDigest: expected });
  if (!jtiStore.consume(claims.jti, claims.exp, now)) return refuse("approval-reused", "jti-consumed");
  return { ok: true, claims, approver: claims.approver, method: claims.method, kid: checked.kid };
}

export interface VerifyMeterOptions {
  /** The meter's own agent id: the onward token's `aud`. */
  meter: string;
  /** The meter's grant-check capability, as its manifest names it. */
  capability: string;
  jwks: Jwks | undefined;
  now: number;
  /** The issuer the meter trusts: `iss` must equal it. Required. */
  issuer: string;
}

/** The meter's refusal of its own token (`grant-check.schema.json#/$defs/denied` with `principal-unproven`). */
export interface GrantCheckDenied { decision: "denied"; level: null; code: "principal-unproven"; reason: string; checkedAt: string }

/** Any grant-check denial (`grant-check.schema.json#/$defs/denied`): its `code` is one of the one set's (DL-19). */
export interface GrantCheckDenial {
  decision: "denied";
  level: "L0" | "L1" | "L2" | "L3" | null;
  code: "limit-reached" | "no-grant" | "grant-expired" | "grant-revoked" | "principal-unproven" | "credential-source-refused" | "unknown-state";
  reason: string;
  checkedAt: string;
  window?: "total" | "task" | "project" | "day" | "week" | "month" | "call";
  approvalRequest?: string;
}

/** A refusal on the wire (`delegation-refusal.schema.json`). */
export interface DelegationRefusalDocument {
  error: { code: RefusalCode; message: string; data?: { detail?: string; window?: string; level?: string; actionDigest?: string; approvalRequest?: string } };
}

/**
 * The meter's side (DL-21): the callee presents an onward token minted for the meter — `aud` the meter, the
 * callee added as outermost actor, `scope` exactly the grant-check capability, `effect` exactly `["none"]`, the
 * grant of the call. Only such a token may hold a fifth actor (DL-6). Any refusal of it is the meter's
 * `principal-unproven`, with the verifier's code in the reason.
 */
export function verifyMeterToken(token: string, options: VerifyMeterOptions): DelegationAccepted | { ok: false; denial: GrantCheckDenied } {
  const { meter, capability, jwks, now, issuer } = options;
  const verified = verifyAt(token, { audience: meter, capability, effect: "none", jwks, now, issuer }, MAX_CHAIN_DEPTH + 1);
  // DL-21 step 3: the meter reads its one capability; a wider token was not minted for it (F-B-312).
  const result: DelegationAccepted | Refusal = !verified.ok ? verified
    : verified.claims.scope !== capability ? refuse("scope-not-granted", "meter-scope-not-exact")
    : verified.claims.effect.length !== 1 || verified.claims.effect[0] !== "none" ? refuse("effect-above-ceiling", "meter-effect-not-none")
    : verified;
  if (result.ok) return result;
  return { ok: false, denial: { decision: "denied", level: null, code: "principal-unproven", reason: `the meter's token was refused: ${result.code} (${result.detail})`, checkedAt: new Date(now * 1000).toISOString() } };
}

/**
 * DL-21 step 6: the refusal a callee answers its caller with after the meter denied a grant check. The meter's
 * `code` goes unchanged into `error.code`, its `window`, `level` (when set) and `approvalRequest` into `error.data`,
 * and its reason into the message (DEC-0045, F-B-301).
 */
export function refusalFromDenial(denial: GrantCheckDenial): DelegationRefusalDocument {
  const data = {
    ...(denial.window === undefined ? {} : { window: denial.window }),
    ...(denial.level === null ? {} : { level: denial.level }),
    ...(denial.approvalRequest === undefined ? {} : { approvalRequest: denial.approvalRequest })
  };
  const message = `the meter denied the spend: ${denial.reason}`.slice(0, 500);
  return { error: { code: denial.code, message, ...(Object.keys(data).length > 0 ? { data } : {}) } };
}

/**
 * The key the meter holds a grant's `task` window under (DEC-0041, Fabric ADR-0144 amendment 2), from the onward
 * token it verified and the grant reference it is checking, one the token names: the token's `task`; else the first
 * `session` met walking the token's actor chain from its outermost actor (`act`, then `act.act`, …) — the callee's
 * own session when it has one, else the session of the agent that called it, and so on; else the grant itself, one
 * window for all its spend. Never a `jti`: the request's `tokenJti` is unsigned and every onward token has a fresh
 * one, so either would open a new window with each check. The prefixes keep the three namespaces apart, and the
 * session key names the actor that holds it. A reference the token does not name throws: there is no window to key.
 */
export function taskWindowKey(meterClaims: Pick<DelegationClaims, "task" | "act" | "grant">, grantRef: string): string {
  if (!meterClaims.grant.includes(grantRef)) throw new RangeError("the meter checks only a grant its verified token names");
  if (meterClaims.task !== undefined) return `task:${meterClaims.task}`;
  for (let actor: Actor | undefined = meterClaims.act; actor !== undefined; actor = actor.act) {
    if (actor.session !== undefined) return `session:${actor.sub}:${actor.session}`;
  }
  return `grant:${grantRef}`;
}

/** An in-memory `JtiStore` for tests and single-process callees; a service that restarts needs a durable one. */
export function createMemoryJtiStore(): JtiStore {
  const seen = new Map<string, number>();
  return {
    consume(jti, expiresAt, now) {
      for (const [id, until] of seen) if (until + LEEWAY_SECONDS < now) seen.delete(id);
      if (seen.has(jti)) return false;
      seen.set(jti, expiresAt);
      return true;
    }
  };
}

/**
 * The delegation token a request carries, and how: the hub's `Fabric-Delegation` header on a forwarded call
 * (its `Authorization` then holds the product's own credential), or `Authorization: Bearer` on a direct call
 * when the bearer is a JWT of the delegation `typ`. Header names are read case-insensitively.
 */
export function readDelegationToken(headers: Record<string, string | string[] | undefined>): { token: string; via: "fabric-delegation" | "authorization" } | undefined {
  const get = (name: string) => {
    const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];
    return Array.isArray(entry) ? (entry[0] ?? "") : entry;
  };
  // A present header is the token, even empty: DL-10 refuses a present but invalid one, never falls through.
  const forwarded = get(DELEGATION_HEADER);
  if (forwarded !== undefined) return { token: forwarded.trim(), via: "fabric-delegation" };
  const bearer = /^Bearer\s+(\S+)$/i.exec(get("Authorization") ?? "")?.[1];
  const parsed = bearer ? parseCompact(bearer) : undefined;
  if (bearer && parsed && !("problem" in parsed) && parsed.header.typ === DELEGATION_TYP) return { token: bearer, via: "authorization" };
  return undefined;
}

/** RFC 8785 now lives in `src/canonical.ts` with the settings form beside it (DEC-0043); the old name stays so
 *  existing imports keep working. */
export { rfc8785 as jcs } from "./canonical.js";

/** The action digest an approval binds: `sha256:` and the hex SHA-256 of the action's RFC 8785 form. */
export function actionDigest(action: unknown): string {
  return `sha256:${createHash("sha256").update(rfc8785(action), "utf8").digest("hex")}`;
}
// #endregion delegation-verifier
