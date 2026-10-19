import { createHash, createPublicKey, verify as verifySignature } from "node:crypto";
import { isSmallOrderKey } from "./ed25519.js";
import { type Finding, type JsonObject, indexed, isObject, show } from "./findings.js";
import { CLOCK_SKEW_SECONDS, strictTime } from "./rfc3339.js";
import { ENTITLEMENT_KEY_SET_FIELDS, signingStatement } from "./signing-challenges.js";

// #region entitlement, docs: docs/specification/entitlement.md
/**
 * `entitlement/1` (DEC-0085): what one signed order entitles one subject to (an organization, `org:<orgId>`, or one
 * person's estate, `personal`) for at most 38 days: a member allowance, a hosting product, a support tier and the paid
 * agents. The issuer (the PassionCode platform) signs it with a key its offline root lists in an
 * `entitlement-key-set/1`; a verifier (the first organization server, a personal cloud) holds the root, the key set it
 * applied and, per subject, the entitlement it accepted last. No amount, price, currency or person appears anywhere.
 */
export const ENTITLEMENT_TYPE = "entitlement/1";
export const ENTITLEMENT_KEY_SET_TYPE = "entitlement-key-set/1";
/** Ed25519 only (DEC-0085 item 2); ES256 may join additively by a later decision, as for leases and hub keys. */
export const ENTITLEMENT_ALGORITHMS: readonly string[] = ["EdDSA"];
/**
 * The longest life, `expiresAt − issuedAt`: one billing month (at most 31 days) and the 7-day refresh lead, so a monthly
 * issuer re-issues by day 31 and `refreshDue` lights only when it missed that (DEC-0085, the owner's fix round).
 */
export const MAX_ENTITLEMENT_SECONDS = 38 * 24 * 60 * 60;
/** The issuer issues the next revision at least this long before `expiresAt`; the verifier reports `refreshDue` from then on. */
export const REFRESH_SECONDS = 7 * 24 * 60 * 60;
/** After `expiresAt`, an entitlement verifies in `grace` this long, then is refused `lapsed`. */
export const GRACE_SECONDS = 14 * 24 * 60 * 60;
/** The largest member allowance a licence line carries. */
export const MAX_MEMBERS = 1_000_000;
/** The most paid agents one entitlement lists. */
export const MAX_AGENTS = 256;
/** The most signing keys, and revoked kids, one key set lists. */
export const MAX_KEYS = 32;
export const MAX_REVOKED = 256;
export const HOSTING_PRODUCTS: readonly string[] = ["org-cloud", "enterprise-cloud", "personal-cloud"];
/** The hosting products an organization's entitlement may carry (DEC-0088: `enterprise-cloud`, a dedicated cloud). */
export const ORG_HOSTING_PRODUCTS: readonly string[] = ["org-cloud", "enterprise-cloud"];
export const SUPPORT_TIERS: readonly string[] = ["observe", "assist", "managed"];
export { CLOCK_SKEW_SECONDS };

const isString = (value: unknown): value is string => typeof value === "string";
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const positive = (value: unknown) => Number.isSafeInteger(value) && (value as number) >= 1;
/** `activity-common#/$defs/opaqueId`. */
const OPAQUE = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,127}$/;
/** `common#/$defs/contextId` (DEC-0082). */
const CONTEXT = /^(?:personal|org:[A-Za-z0-9][A-Za-z0-9_-]{0,127})$/;
/** `entitlement#/$defs/issuer`: an https origin in lower case, two labels or more, no port, path or trailing slash. */
const ISSUER = /^https:\/\/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
/** `fabric-package#/$defs/agentRef`. */
const AGENT_REF = /^urn:fabric:agent:[a-z][a-z0-9]*(?:-[a-z0-9]+)*:[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
/** 64 bytes, base64url without padding, canonical. */
const SIG = /^[A-Za-z0-9_-]{85}[AQgw]$/;
/** 32 bytes, base64url without padding, canonical. */
const X = /^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;

const matches = (pattern: RegExp, value: unknown) => isString(value) && pattern.test(value);
const opaque = (value: unknown) => matches(OPAQUE, value);
const issuerOk = (value: unknown) => isString(value) && value.length <= 261 && ISSUER.test(value);
/** At most three fraction digits: every port compares the same instants, at millisecond precision (DEC-0085). */
const MILLISECONDS = /:[0-9]{2}(?:\.[0-9]{1,3})?(?:[Zz]|[+-][0-9]{2}:[0-9]{2})$/;
/** A strict RFC 3339 instant with at most three fraction digits, in milliseconds, or NaN. */
const time = (value: unknown) => (isString(value) && MILLISECONDS.test(value) ? strictTime(value) : Number.NaN);
const readable = (value: unknown) => Number.isFinite(time(value));
/** The members of `value` are exactly `names`. */
const exactly = (value: JsonObject, names: readonly string[]) => Object.keys(value).length === names.length && names.every((name) => Object.hasOwn(value, name));
const digestOf = (bytes: Buffer) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
const rawKey = (x: string) => Buffer.from(x, "base64url");

// ---- The documents -----------------------------------------------------------------------------------------------

/**
 * The bytes the issuer signs: the register's `entitlement/1` statement (DEC-0063): the UTF-8 RFC 8785 form of the
 * document without `sig`. `undefined` when it does not carry exactly the registered members or has no RFC 8785 form.
 */
export function entitlementSigningInput(entitlement: unknown): Buffer | undefined {
  if (!isObject(entitlement) || entitlement.type !== ENTITLEMENT_TYPE) return undefined;
  const { type: _type, sig: _sig, ...fields } = entitlement;
  return signingStatement(ENTITLEMENT_TYPE, fields);
}

/** The bytes the root signs: the register's `entitlement-key-set/1` statement, the set without `sig`. */
export function entitlementKeySetSigningInput(set: unknown): Buffer | undefined {
  if (!isObject(set) || set.type !== ENTITLEMENT_KEY_SET_TYPE) return undefined;
  const { type: _type, sig: _sig, ...fields } = set;
  return signingStatement(ENTITLEMENT_KEY_SET_TYPE, fields);
}

/** Whether a nullable line is `null` or an object of exactly `names` whose members pass `check`. */
const line = (value: unknown, names: readonly string[], check: (value: JsonObject) => boolean) =>
  // A missing member is `undefined`, never a line: only `null` or an object of exactly `names` is.
  value === null || (isObject(value) && exactly(value, names) && check(value));

/**
 * Whether the subject's lines agree (DEC-0085 item 3): `personal` carries an estate, no licence, no support and at most
 * a `personal-cloud`; `org:<orgId>` carries no estate and at most an `org-cloud` or an `enterprise-cloud` (DEC-0088).
 */
function consistent(doc: JsonObject): boolean {
  const product = isObject(doc.hosting) ? doc.hosting.product : undefined;
  if (doc.subject === "personal") return isString(doc.estate) && doc.licence === null && doc.support === null && (doc.hosting === null || product === "personal-cloud");
  return doc.estate === null && (doc.hosting === null || ORG_HOSTING_PRODUCTS.includes(product as string));
}

/**
 * Whether an entitlement's members have the shapes the schema gives them, the algorithm's value aside. The type and the
 * exact member list are the register's to check: `entitlementSigningInput` has no bytes for another type, a missing
 * member or an extra one, and the verifier refuses such a document `malformed` on that answer.
 */
export function entitlementWellFormed(doc: JsonObject): boolean {
  const order = doc.order;
  const agents = doc.agents;
  const refs = Array.isArray(agents) ? agents.map((agent) => (isObject(agent) ? agent.agentRef : undefined)) : [];
  return (
    issuerOk(doc.issuer) &&
    matches(CONTEXT, doc.subject) &&
    (doc.estate === null || opaque(doc.estate)) &&
    isObject(order) && exactly(order, ["id", "revision"]) && opaque(order.id) && positive(order.revision) &&
    readable(doc.issuedAt) && readable(doc.notBefore) && readable(doc.expiresAt) &&
    line(doc.licence, ["members"], (l) => Number.isSafeInteger(l.members) && (l.members as number) >= 1 && (l.members as number) <= MAX_MEMBERS) &&
    // The product's two values are `consistent`'s to check, each against its subject.
    line(doc.hosting, ["product", "size"], (h) => opaque(h.size)) &&
    line(doc.support, ["tier"], (s) => SUPPORT_TIERS.includes(s.tier as string)) &&
    Array.isArray(agents) && agents.length <= MAX_AGENTS &&
    agents.every((agent) => isObject(agent) && exactly(agent, ["agentRef"]) && isString(agent.agentRef) && agent.agentRef.length <= 146 && AGENT_REF.test(agent.agentRef)) &&
    new Set(refs).size === refs.length &&
    consistent(doc) &&
    isString(doc.alg) && opaque(doc.kid) && matches(SIG, doc.sig)
  );
}

/** Whether one of a key set's keys is valid at the set's own `issuedAt`: `notBefore` ≤ `issuedAt` < `notAfter`. */
function validAtIssue(set: JsonObject): boolean {
  const issuedAt = time(set.issuedAt);
  return indexed(set.keys).some(([key]) => time(key.notBefore) <= issuedAt && issuedAt < time(key.notAfter));
}

/**
 * Whether a key set's members have the schema's shapes and FAC-SEM-116's structure (each kid once, the root's kid
 * not among the keys, every window positive, a key valid at its `issuedAt`, no revoked kid among the keys); algorithms
 * and small-order keys aside.
 */
export function keySetWellFormed(set: JsonObject): boolean {
  const keys = set.keys;
  const revoked = set.revoked;
  if (
    !(set.type === ENTITLEMENT_KEY_SET_TYPE && exactly(set, [...ENTITLEMENT_KEY_SET_FIELDS, "type", "sig"]) &&
      issuerOk(set.issuer) && positive(set.revision) && readable(set.issuedAt) &&
      Array.isArray(keys) && keys.length >= 1 && keys.length <= MAX_KEYS &&
      Array.isArray(revoked) && revoked.length <= MAX_REVOKED && revoked.every(opaque) && new Set(revoked).size === revoked.length &&
      isString(set.alg) && opaque(set.kid) && matches(SIG, set.sig))
  ) return false;
  const kids = new Set<unknown>();
  for (const key of keys) {
    if (!isObject(key) || !exactly(key, ["kid", "alg", "x", "notBefore", "notAfter"]) || !opaque(key.kid) || !isString(key.alg) || !matches(X, key.x)) return false;
    if (kids.has(key.kid) || key.kid === set.kid || revoked.includes(key.kid)) return false;
    kids.add(key.kid);
    if (!(time(key.notBefore) < time(key.notAfter))) return false;
  }
  // devices.md *Key sets*: a set always holds a key valid at its issuedAt, so a verifier that applies it can verify.
  return validAtIssue(set);
}

// ---- The key set -------------------------------------------------------------------------------------------------

/** The issuer's root key a verifier pins at installation (Ed25519): it signs key sets only. */
export interface EntitlementRoot { issuer: string; kid: string; x: string }
/** What a verifier keeps of the key set it applied: its revision and the digest of its signed bytes. */
export interface HeldKeySet { revision: number; digest: string }

export type KeySetProblem =
  | "context-invalid"
  | "malformed"
  | "wrong-issuer"
  | "unknown-algorithm"
  | "unusable-key"
  | "small-order-key"
  | "bad-signature"
  | "stale-revision"
  | "revision-conflict";

export type KeySetVerdict = { ok: true; unchanged: boolean; digest: string; held: HeldKeySet } | { ok: false; problem: KeySetProblem };

export interface KeySetTrust {
  root: EntitlementRoot;
  /** The key set applied before, if any. */
  held?: HeldKeySet;
}

const heldKeySetOk = (held: unknown) => held === undefined || (isObject(held) && positive(held.revision) && matches(SHA256, held.digest));

/** An Ed25519 signature check over `input`, the key and the signature already shape-checked; it never throws. */
function signatureVerifies(x: string, input: Buffer, sig: string): boolean {
  // `x` is the canonical base64url of 32 bytes (checked by every caller), a key Node imports without throwing.
  const key = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x }, format: "jwk" });
  return verifySignature(null, input, key, Buffer.from(sig, "base64url"));
}

/**
 * The reference verifier of a key set (DEC-0085 item 4), in the order of entitlement.md's EK table: the context, the
 * shape, the issuer and the root's kid, the algorithms, the root key's own checks and every listed key's order, the
 * root's signature, then the revision against the one held. It answers and never throws.
 */
export function verifyEntitlementKeySet(value: unknown, trust: KeySetTrust): KeySetVerdict {
  if (!isObject(trust) || !isObject(trust.root) || !issuerOk(trust.root.issuer) || !opaque(trust.root.kid) || !isString(trust.root.x) || !heldKeySetOk(trust.held)) {
    return { ok: false, problem: "context-invalid" };
  }
  // A well-formed set always has its statement (its members are exact, its values finite); one test, one answer.
  const input = isObject(value) && keySetWellFormed(value) ? entitlementKeySetSigningInput(value) : undefined;
  if (!input) return { ok: false, problem: "malformed" };
  const set = value as JsonObject;
  const root = trust.root;
  // The root is one key of one issuer: a set naming another issuer, or another signer, is not this root's.
  if (set.issuer !== root.issuer || set.kid !== root.kid) return { ok: false, problem: "wrong-issuer" };
  const keys = set.keys as JsonObject[];
  if (!ENTITLEMENT_ALGORITHMS.includes(set.alg as string) || !keys.every((key) => ENTITLEMENT_ALGORITHMS.includes(key.alg as string))) return { ok: false, problem: "unknown-algorithm" };
  if (!X.test(root.x)) return { ok: false, problem: "unusable-key" };
  // DEC-0045: a small-order key verifies forged signatures on Node 20 and 22; none is used, nor listed for later use.
  if (isSmallOrderKey(rawKey(root.x)) || keys.some((key) => isSmallOrderKey(rawKey(key.x as string)))) return { ok: false, problem: "small-order-key" };
  if (!signatureVerifies(root.x, input, set.sig as string)) return { ok: false, problem: "bad-signature" };

  const digest = digestOf(input);
  const held = trust.held;
  if (held && (set.revision as number) < held.revision) return { ok: false, problem: "stale-revision" };
  if (held && set.revision === held.revision && digest !== held.digest) return { ok: false, problem: "revision-conflict" };
  return { ok: true, unchanged: held !== undefined && set.revision === held.revision, digest, held: { revision: set.revision as number, digest } };
}

// ---- The entitlement ---------------------------------------------------------------------------------------------

/** What a verifier keeps, per subject, of the entitlement it accepted last (DEC-0085 item 6). */
export interface HeldEntitlement { orderId: string; revision: number; issuedAt: string; digest: string }

export type EntitlementProblem =
  | "context-invalid"
  | "no-clock"
  | "malformed"
  | "wrong-issuer"
  | "unknown-algorithm"
  | "unknown-key"
  | "key-revoked"
  | "unusable-key"
  | "small-order-key"
  | "key-not-valid"
  | "bad-signature"
  | "wrong-subject"
  | "too-long-lived"
  | "not-yet-valid"
  | "lapsed"
  | "stale-revision"
  | "revision-conflict";

export type EntitlementVerdict =
  | { ok: true; state: "active" | "grace"; refreshDue: boolean; unchanged: boolean; digest: string; held: HeldEntitlement }
  | { ok: false; problem: EntitlementProblem };

export interface EntitlementTrust {
  /** The verifier's clock. */
  now: Date;
  /** Whom this verifier serves: `org:<orgId>` or `personal`. */
  subject: string;
  /** For `personal`, this verifier's estate; absent for an organization. */
  estate?: string;
  /** The issuer's key set this verifier applied (accepted by `verifyEntitlementKeySet` under its pinned root). */
  keySet: JsonObject;
  /** The entitlement held for this subject, if any. */
  held?: HeldEntitlement;
}

const heldEntitlementOk = (held: unknown) =>
  held === undefined || (isObject(held) && opaque(held.orderId) && positive(held.revision) && readable(held.issuedAt) && matches(SHA256, held.digest));

/** Whether `trust` is a usable context, the clock aside. */
function usableTrust(trust: EntitlementTrust): boolean {
  const estateOk = trust.subject === "personal" ? opaque(trust.estate) : trust.estate === undefined;
  // A key set the root did not sign under an algorithm this verifier knows is not one it could have applied.
  const keySetOk = isObject(trust.keySet) && keySetWellFormed(trust.keySet) && ENTITLEMENT_ALGORITHMS.includes(trust.keySet.alg as string);
  return matches(CONTEXT, trust.subject) && estateOk && keySetOk && heldEntitlementOk(trust.held);
}

/**
 * The reference verifier (DEC-0085 item 7), in the order of entitlement.md's EN table: the context and the clock, the
 * shape, the issuer, the algorithm, the key (listed, not revoked, usable, of full order, its window holding `issuedAt`),
 * the signature, the subject, the life, the clock against `notBefore` and the grace, then the entitlement held for
 * the subject. It answers and never throws.
 */
export function verifyEntitlement(value: unknown, trust: EntitlementTrust): EntitlementVerdict {
  if (!isObject(trust)) return { ok: false, problem: "context-invalid" };
  // An unreadable clock makes every comparison false and would accept any entitlement; it is refused before any.
  const now = trust.now instanceof Date ? trust.now.getTime() : Number.NaN;
  if (!Number.isFinite(now)) return { ok: false, problem: "no-clock" };
  if (!usableTrust(trust)) return { ok: false, problem: "context-invalid" };
  const input = isObject(value) && entitlementWellFormed(value) ? entitlementSigningInput(value) : undefined;
  if (!input) return { ok: false, problem: "malformed" };
  const entitlement = value as JsonObject;

  const keySet = trust.keySet;
  if (entitlement.issuer !== keySet.issuer) return { ok: false, problem: "wrong-issuer" };
  if (!ENTITLEMENT_ALGORITHMS.includes(entitlement.alg as string)) return { ok: false, problem: "unknown-algorithm" };
  const key = (keySet.keys as JsonObject[]).find((entry) => entry.kid === entitlement.kid);
  // A revoked kid refuses every entitlement it signed, at once, whatever its window; a usable key set never also lists it.
  if (!key) return { ok: false, problem: list(keySet.revoked).includes(entitlement.kid) ? "key-revoked" : "unknown-key" };
  // The key set's shape makes `x` the canonical base64url of 32 bytes; what is left is its algorithm.
  if (key.alg !== entitlement.alg) return { ok: false, problem: "unusable-key" };
  if (isSmallOrderKey(rawKey(key.x as string))) return { ok: false, problem: "small-order-key" };
  const issuedAt = time(entitlement.issuedAt);
  // A key signs only inside its window: rotation keeps an old key listed so what it signed in time still verifies.
  if (issuedAt < time(key.notBefore) || issuedAt >= time(key.notAfter)) return { ok: false, problem: "key-not-valid" };
  if (!signatureVerifies(key.x as string, input, entitlement.sig as string)) return { ok: false, problem: "bad-signature" };

  if (entitlement.subject !== trust.subject || (trust.subject === "personal" && entitlement.estate !== trust.estate)) return { ok: false, problem: "wrong-subject" };
  const notBefore = time(entitlement.notBefore);
  const expiresAt = time(entitlement.expiresAt);
  if (issuedAt > notBefore || notBefore >= expiresAt || expiresAt - issuedAt > MAX_ENTITLEMENT_SECONDS * 1000) return { ok: false, problem: "too-long-lived" };
  // issuedAt ≤ notBefore, so the skew on notBefore also bounds an issuedAt in the future.
  if (now < notBefore - CLOCK_SKEW_SECONDS * 1000) return { ok: false, problem: "not-yet-valid" };
  if (now >= expiresAt + GRACE_SECONDS * 1000) return { ok: false, problem: "lapsed" };

  const order = entitlement.order as JsonObject;
  const digest = digestOf(input);
  const held = trust.held;
  let unchanged = false;
  if (held && held.orderId === order.id) {
    if ((order.revision as number) < held.revision) return { ok: false, problem: "stale-revision" };
    if (order.revision === held.revision && digest !== held.digest) return { ok: false, problem: "revision-conflict" };
    unchanged = order.revision === held.revision;
  } else if (held && issuedAt <= time(held.issuedAt)) {
    // Another order supersedes only when issued later: an old order's entitlement is never replayed over a newer one.
    return { ok: false, problem: "stale-revision" };
  }
  return {
    ok: true,
    state: now < expiresAt ? "active" : "grace",
    refreshDue: now >= expiresAt - REFRESH_SECONDS * 1000,
    unchanged,
    digest,
    held: { orderId: order.id as string, revision: order.revision as number, issuedAt: entitlement.issuedAt as string, digest }
  };
}

// ---- Rules -------------------------------------------------------------------------------------------------------

type Flag = (instancePath: string, message: string) => void;

/**
 * FAC-SEM-115 on one entitlement: the subject's lines agree, the times are strict and in order, the life is at most 38
 * days, and each agent is listed once.
 */
function entitlementDocument(value: JsonObject, flag: Flag): void {
  const hosting = isObject(value.hosting) ? value.hosting : undefined;
  if (value.subject === "personal") {
    if (!opaque(value.estate)) flag("/estate", "a personal entitlement names the person's estate, which binds it to one network");
    if (value.licence !== null) flag("/licence", "a personal entitlement has no licence: a personal-cloud order has no members");
    if (value.support !== null) flag("/support", "a personal entitlement has no support tier");
    if (hosting && hosting.product !== "personal-cloud") flag("/hosting/product", "a personal entitlement's hosting is personal-cloud");
  } else if (matches(CONTEXT, value.subject)) {
    if (value.estate !== null) flag("/estate", "an organization's entitlement names no estate");
    if (hosting && !ORG_HOSTING_PRODUCTS.includes(hosting.product as string)) flag("/hosting/product", "an organization's hosting is org-cloud or enterprise-cloud");
  } else {
    flag("/subject", "the subject is personal or org:<orgId>, never a person");
  }
  const issuedAt = time(value.issuedAt);
  const notBefore = time(value.notBefore);
  const expiresAt = time(value.expiresAt);
  const unreadable = (["issuedAt", "notBefore", "expiresAt"] as const).filter((name) => !readable(value[name]));
  for (const name of unreadable) flag(`/${name}`, "a time is an RFC 3339 date-time with an offset, on a day that exists, with at most three fraction digits");
  if (!unreadable.length) {
    if (issuedAt > notBefore) flag("/notBefore", "notBefore is at or after issuedAt");
    if (notBefore >= expiresAt) flag("/expiresAt", "expiresAt is after notBefore");
    if (expiresAt - issuedAt > MAX_ENTITLEMENT_SECONDS * 1000) flag("/expiresAt", `an entitlement expires at most ${MAX_ENTITLEMENT_SECONDS / 86_400} days after it is issued`);
  }
  const seen = new Set<string>();
  for (const [agent, index] of indexed(value.agents)) {
    const ref = show(agent.agentRef);
    if (seen.has(ref)) flag(`/agents/${index}/agentRef`, `agent ${ref} is listed twice`);
    seen.add(ref);
  }
}

/**
 * FAC-SEM-116 on one key set: each kid once, never the root's kid, every window positive, a key valid at the set's
 * `issuedAt`, no revoked kid among the keys, and no key of small order.
 */
function keySetDocument(value: JsonObject, flag: Flag): void {
  const revoked = list(value.revoked);
  const seen = new Set<string>();
  for (const [key, index] of indexed(value.keys)) {
    const at = `/keys/${index}`;
    const kid = show(key.kid);
    if (seen.has(kid)) flag(`${at}/kid`, `kid ${kid} is listed twice`);
    seen.add(kid);
    if (key.kid === value.kid) flag(`${at}/kid`, "the root's kid signs key sets only and is never a signing key");
    if (revoked.includes(key.kid)) flag(`${at}/kid`, `kid ${kid} is revoked, so it is not listed among the keys`);
    if (!readable(key.notBefore) || !readable(key.notAfter)) flag(`${at}/${readable(key.notBefore) ? "notAfter" : "notBefore"}`, "a key's window is two RFC 3339 date-times with an offset");
    else if (time(key.notBefore) >= time(key.notAfter)) flag(`${at}/notAfter`, "a key's window ends after it starts");
    if (matches(X, key.x) && isSmallOrderKey(rawKey(key.x as string))) flag(`${at}/x`, "a key of small order lets anyone forge a signature (DEC-0045)");
  }
  if (readable(value.issuedAt) && !validAtIssue(value)) flag("/keys", "a key set holds at least one key valid at its issuedAt");
}

export function entitlementRules(kind: string, value: JsonObject): Finding[] | undefined {
  const findings: Finding[] = [];
  if (kind === "entitlement") {
    entitlementDocument(value, (instancePath, message) => findings.push({ code: "FAC-SEM-115", instancePath, message }));
    return findings;
  }
  if (kind === "entitlement-key-set") {
    keySetDocument(value, (instancePath, message) => findings.push({ code: "FAC-SEM-116", instancePath, message }));
    return findings;
  }
  return undefined;
}
// #endregion entitlement
