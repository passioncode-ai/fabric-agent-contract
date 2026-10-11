import { createHash, createPublicKey, verify as verifySignature, type KeyObject } from "node:crypto";
import { isObject, type JsonObject } from "./findings.js";

// #region delegation-verifier — docs: docs/specification/delegation.md#the-verifier
/**
 * The callee's side of `fabric-delegation/0.1` (DEC-0039, Fabric ADR-0144): check a delegation token or an
 * approval offline, against the estate's published keys, and answer `ok` or one refusal code. Node's own
 * crypto verifies Ed25519 (RFC 8037 `EdDSA`); no JOSE library is needed.
 *
 * Attenuation is the issuer's check, not the verifier's: a callee never sees the parent of the token it is
 * handed, so it checks only what it can — the signature, the times, that the token names it, the chain's
 * depth, and that the called capability and its effect are inside the token.
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
/** The actor chain is at most four deep, the agent now calling included. */
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
  method: "prompt" | "operator-channel" | "device";
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
  /** The issuer this callee trusts (`auth.delegation.issuer`); when given, `iss` must equal it. */
  issuer?: string;
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
  issuer?: string;
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

type KeyLookup = { key: KeyObject } | { problem: "unknown-key" | "unusable-key" | "duplicate-kid" | "key-not-for-signing" };

function keyFor(jwks: Jwks, kid: string): KeyLookup {
  const matches = jwks.keys.filter((candidate) => isObject(candidate) && candidate.kid === kid);
  if (matches.length > 1) return { problem: "duplicate-kid" };
  const jwk = matches[0];
  if (!jwk) return { problem: "unknown-key" };
  // A key published for another use or algorithm is never a candidate (RFC 7517 §4.2, §4.4).
  if ((jwk.use !== undefined && jwk.use !== "sig") || (jwk.alg !== undefined && jwk.alg !== "EdDSA")) return { problem: "key-not-for-signing" };
  if (jwk.kty !== "OKP" || jwk.crv !== "Ed25519" || !isString(jwk.x) || jwk.d !== undefined) return { problem: "unusable-key" };
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
  if ("problem" in found) return found.problem === "unusable-key" || found.problem === "duplicate-kid" ? { problem: found.problem, issuer: true } : { problem: found.problem };
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

function delegationShape(payload: JsonObject): DelegationClaims | undefined {
  const { iss, sub, act, aud, scope, effect, grant, iat, exp, jti } = payload;
  if (!isString(iss) || !isString(sub) || !isString(aud) || !isString(scope) || !isString(jti) || !isTime(iat) || !isTime(exp)) return undefined;
  if (!Array.isArray(effect) || effect.length === 0 || !effect.every((e) => (EFFECT_CLASSES as readonly unknown[]).includes(e))) return undefined;
  if (!Array.isArray(grant) || grant.length === 0 || !grant.every(isString)) return undefined;
  if (!isObject(act)) return undefined;
  // DEC-0041: an optional claim the meter keys a window on is typed like any other.
  if (payload.task !== undefined && !(typeof payload.task === "string" && OPAQUE_ID.test(payload.task))) return undefined;
  return payload as unknown as DelegationClaims;
}

function approvalShape(payload: JsonObject): ApprovalClaims | undefined {
  const { iss, actionDigest, aud, approver, method, iat, exp, jti } = payload;
  if (!isString(iss) || !isString(actionDigest) || !isString(aud) || !isString(approver) || !isString(jti) || !isTime(iat) || !isTime(exp)) return undefined;
  if (method !== "prompt" && method !== "operator-channel" && method !== "device") return undefined;
  return payload as unknown as ApprovalClaims;
}

/**
 * Check a delegation token for one call. The order is fixed: nothing about a token is believed before its
 * signature is, so an unsigned token learns only `unauthenticated`.
 */
export function verifyDelegation(token: string, options: VerifyDelegationOptions): DelegationAccepted | Refusal {
  const { audience, jwks, now, capability, effect, issuer, readOnly } = options;
  if (!hasKeys(jwks)) return refuse("issuer-unavailable", "no-published-keys");
  const checked = authentic(token, jwks, DELEGATION_TYP);
  if ("problem" in checked) return refuse(checked.issuer ? "issuer-unavailable" : "unauthenticated", checked.problem);
  const claims = delegationShape(checked.compact.payload);
  if (!claims) return refuse("unauthenticated", "malformed-claims");
  if (issuer !== undefined && claims.iss !== issuer) return refuse("unauthenticated", "wrong-issuer");
  if (claims.exp <= claims.iat || claims.exp - claims.iat > MAX_DELEGATION_LIFETIME_SECONDS) return refuse("unauthenticated", "lifetime-above-profile");
  if (claims.iat > now + LEEWAY_SECONDS) return refuse("unauthenticated", "issued-in-future");
  const nbf = (checked.compact.payload as JsonObject).nbf;
  if (nbf !== undefined && (!isTime(nbf) || nbf > now + LEEWAY_SECONDS)) return refuse("unauthenticated", "not-yet-valid");
  if (now > claims.exp + LEEWAY_SECONDS) return refuse("token-expired", "expired");
  if (claims.aud !== audience) return refuse("wrong-audience", "audience-mismatch");
  const depth = chainDepth(claims.act);
  if (!Number.isFinite(depth)) return refuse("unauthenticated", "malformed-chain");
  if (depth > MAX_CHAIN_DEPTH) return refuse("chain-too-deep", `depth-${depth}`);
  if (!claims.scope.split(" ").includes(capability)) return refuse("scope-not-granted", "capability-not-in-scope");
  if (readOnly && effect !== "none") return refuse("effect-above-ceiling", "read-only-door");
  if (!effectWithin(effect, claims.effect)) return refuse("effect-above-ceiling", `effect-${effect}`);
  return { ok: true, claims, principal: claims.sub, caller: claims.act.sub, chain: chainOf(claims.act), kid: checked.kid };
}

/**
 * Check an operator's approval for one action. A missing approval is `approval-required` carrying the action
 * digest, so the caller can ask the hub for one; every other fault of the document is `approval-invalid`.
 */
export function verifyApproval(approval: string | undefined, options: VerifyApprovalOptions): ApprovalAccepted | Refusal {
  const { audience, jwks, now, actionDigest: expected, issuer, jtiStore } = options;
  if (approval === undefined || approval === "") return refuse("approval-required", "no-approval", { actionDigest: expected });
  if (!isObject(jtiStore) || typeof jtiStore.consume !== "function") return refuse("unknown-state", "no-jti-store");
  if (!hasKeys(jwks)) return refuse("issuer-unavailable", "no-published-keys");
  const checked = authentic(approval, jwks, APPROVAL_TYP);
  if ("problem" in checked) return refuse(checked.issuer ? "issuer-unavailable" : "approval-invalid", checked.problem);
  const claims = approvalShape(checked.compact.payload);
  if (!claims) return refuse("approval-invalid", "malformed-claims");
  if (issuer !== undefined && claims.iss !== issuer) return refuse("approval-invalid", "wrong-issuer");
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
  issuer?: string;
}

/** A grant-check denial (`grant-check.schema.json#/$defs/denied`). */
export interface GrantCheckDenied { decision: "denied"; level: null; code: "principal-unproven"; reason: string; checkedAt: string }

/**
 * The meter's side (DL-21): the callee presents an onward token minted for the meter — `aud` the meter, the
 * callee added as outermost actor, `scope` the grant-check capability, `effect: none`, the grant of the call.
 * Any refusal of that token is the meter's `principal-unproven`, with the verifier's code in the reason.
 */
export function verifyMeterToken(token: string, options: VerifyMeterOptions): DelegationAccepted | { ok: false; denial: GrantCheckDenied } {
  const { meter, capability, jwks, now, issuer } = options;
  const result = verifyDelegation(token, { audience: meter, capability, effect: "none", jwks, now, readOnly: true, ...(issuer === undefined ? {} : { issuer }) });
  if (result.ok) return result;
  return { ok: false, denial: { decision: "denied", level: null, code: "principal-unproven", reason: `the meter's token was refused: ${result.code} (${result.detail})`, checkedAt: new Date(now * 1000).toISOString() } };
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

/**
 * RFC 8785 JSON Canonicalization Scheme: object members sorted by UTF-16 code units, numbers in ECMAScript
 * form, strings escaped as `JSON.stringify` escapes them. Refuses what has no canonical form: a non-finite
 * number, a lone surrogate, a value JSON cannot carry.
 */
export function jcs(value: unknown): string {
  if (value === null || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("a non-finite number has no canonical form");
    return JSON.stringify(value);
  }
  if (typeof value === "string") {
    if (/\p{Surrogate}/u.test(value)) throw new TypeError("a lone surrogate has no canonical form");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${Array.from(value, (item) => jcs(item)).join(",")}]`;
  if (isObject(value)) {
    // JSON values only: a Date, a Map or a class instance would otherwise read as {} and two different
    // actions would share a digest.
    const prototype: unknown = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw new TypeError("only plain JSON objects have a canonical form");
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${jcs(key)}:${jcs(value[key])}`).join(",")}}`;
  }
  throw new TypeError(`${typeof value} has no canonical form`);
}

/** The action digest an approval binds: `sha256:` and the hex SHA-256 of the action's RFC 8785 form. */
export function actionDigest(action: unknown): string {
  return `sha256:${createHash("sha256").update(jcs(action), "utf8").digest("hex")}`;
}
// #endregion delegation-verifier
