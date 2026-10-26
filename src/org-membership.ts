import { createHash, createPublicKey, verify as verifySignature } from "node:crypto";
import { isSmallOrderKey } from "./ed25519.js";
import { type Finding, type JsonObject, indexed, isObject, show } from "./findings.js";
import { CLOCK_SKEW_SECONDS, strictTime } from "./rfc3339.js";
import { ORG_KEY_SET_FIELDS, ORG_MEMBERSHIP_FIELDS, isSigningRpId, originWithin, signingStatement } from "./signing-challenges.js";
import { ASSERTION_ALGORITHMS, credentialKey } from "./webauthn.js";

// #region org-membership, docs: docs/specification/membership.md
/**
 * `org-membership/1` (DEC-0127): what an organization server states about one person's membership of one organization,
 * for one reader: the organization, the reader (`audience`), a subject pairwise to that pair, a role among `owner`,
 * `admin` and `member`, whether the membership is `active` or `ended`, and its revision, for at most 24 hours. Any
 * organization server issues it (MD-9 path (a)); the organization's root, which the person's estate pins (the estate
 * record's `organizations`), signs an `org-key-set/1` whose keys sign the attestations. No name, address or email of a
 * person appears anywhere. The set also certifies the administrators' signing passkeys, which sign the organization's
 * member list (`org-authority/1`, DEC-0129, `src/org-authority.ts`).
 */
export const ORG_MEMBERSHIP_TYPE = "org-membership/1";
export const ORG_KEY_SET_TYPE = "org-key-set/1";
/** Ed25519 only, as every signed record of the contract (DEC-0085 item 2); ES256 may join additively. */
export const ORG_MEMBERSHIP_ALGORITHMS: readonly string[] = ["EdDSA"];
/** The longest life, `expiresAt − issuedAt`: a day, so a membership ended at the server stops counting within one. */
export const MAX_ATTESTATION_SECONDS = 24 * 60 * 60;
/** The reader asks for the next revision this long before `expiresAt`; the verifier reports `refreshDue` from then on. */
export const REFRESH_SECONDS = 15 * 60;
/** The roles an attestation carries; an issuer maps its own onto these, and a finer one travels in an extension. */
export const ORG_ROLES: readonly string[] = ["owner", "admin", "member"];
export const MEMBERSHIP_STATUSES: readonly string[] = ["active", "ended"];
/** The most extensions one attestation carries. */
export const MAX_EXTENSIONS = 16;
/** The most signing keys, and revoked kids, one key set lists. */
export const MAX_KEYS = 32;
export const MAX_REVOKED = 256;
/** The most administrators' signing passkeys one key set certifies (DEC-0129). */
export const MAX_ADMINISTRATORS = 16;
export { CLOCK_SKEW_SECONDS };

const isString = (value: unknown): value is string => typeof value === "string";
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const positive = (value: unknown) => Number.isSafeInteger(value) && (value as number) >= 1;
/** `activity-common#/$defs/opaqueId`. */
const OPAQUE = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,127}$/;
/** An organization's context id (`common#/$defs/contextId` without `personal`, DEC-0082). */
const ORG = /^org:[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
/** `entitlement#/$defs/issuer`: an https origin in lower case, two labels or more, no port, path or trailing slash. */
const ISSUER = /^https:\/\/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
/** An extension's name: a domain the issuer controls, a slash, a name. */
const EXTENSION = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\/[a-z][a-z0-9._-]{0,63}$/;
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
 * The bytes the organization's key signs: the register's `org-membership/1` statement (DEC-0063): the UTF-8 RFC 8785
 * form of the document without `sig`. `undefined` when it does not carry exactly the registered members.
 */
export function orgMembershipSigningInput(attestation: unknown): Buffer | undefined {
  if (!isObject(attestation) || attestation.type !== ORG_MEMBERSHIP_TYPE) return undefined;
  const { type: _type, sig: _sig, ...fields } = attestation;
  return signingStatement(ORG_MEMBERSHIP_TYPE, fields);
}

/** The bytes the organization's root signs: the register's `org-key-set/1` statement, the set without `sig`. */
export function orgKeySetSigningInput(set: unknown): Buffer | undefined {
  if (!isObject(set) || set.type !== ORG_KEY_SET_TYPE) return undefined;
  const { type: _type, sig: _sig, ...fields } = set;
  return signingStatement(ORG_KEY_SET_TYPE, fields);
}

/** Whether `extensions` is an object of at most 16 issuer-named members, each a short string, a boolean or an integer. */
function extensionsOk(value: unknown): boolean {
  if (!isObject(value)) return false;
  const entries = Object.entries(value);
  return entries.length <= MAX_EXTENSIONS && entries.every(([name, item]) =>
    name.length <= 320 && EXTENSION.test(name) &&
    // The schema's maxLength counts code points, so a string of astral characters is measured the same way.
    ((isString(item) && [...item].length <= 256) || typeof item === "boolean" || Number.isSafeInteger(item)));
}

/**
 * Whether an attestation's members have the shapes the schema gives them, the algorithm's value aside. The type and the
 * exact member list are the register's to check: `orgMembershipSigningInput` has no bytes for another type, a missing
 * member or an extra one.
 */
export function orgMembershipWellFormed(doc: JsonObject): boolean {
  return (
    exactly(doc, [...ORG_MEMBERSHIP_FIELDS, "type", "sig"]) &&
    issuerOk(doc.issuer) && matches(ORG, doc.org) && opaque(doc.audience) && opaque(doc.subject) &&
    ORG_ROLES.includes(doc.role as string) && typeof doc.external === "boolean" &&
    MEMBERSHIP_STATUSES.includes(doc.status as string) && positive(doc.revision) &&
    (doc.membershipEndsAt === null || readable(doc.membershipEndsAt)) &&
    readable(doc.issuedAt) && readable(doc.notBefore) && readable(doc.expiresAt) &&
    extensionsOk(doc.extensions) &&
    isString(doc.alg) && opaque(doc.kid) && matches(SIG, doc.sig)
  );
}

/** Whether one of a key set's keys is valid at the set's own `issuedAt`: `notBefore` ≤ `issuedAt` < `notAfter`. */
function validAtIssue(set: JsonObject): boolean {
  const issuedAt = time(set.issuedAt);
  return indexed(set.keys).some(([key]) => time(key.notBefore) <= issuedAt && issuedAt < time(key.notAfter));
}

/**
 * The members of a passkey credential (the estate record's `authority`, DEC-0055), in shape. The key, the RP ID and the
 * origins are FAC-SEM-146's and the schema's, and a credential that fails them fails closed when it signs (`unusable-key`,
 * `wrong-rp`, `wrong-origin`).
 */
const AUTHORITY_FIELDS = ["credentialId", "alg", "publicKey", "rpId", "origins"];
const B64URL = /^[A-Za-z0-9_-]+$/;
function administratorOk(value: unknown): boolean {
  return (
    isObject(value) && exactly(value, AUTHORITY_FIELDS) && isString(value.credentialId) && value.credentialId.length <= 1366 && B64URL.test(value.credentialId) &&
    ASSERTION_ALGORITHMS.includes(value.alg as string) && isObject(value.publicKey) && isString(value.rpId) &&
    Array.isArray(value.origins) && value.origins.every(isString)
  );
}

/** Whether a key set's administrators are 0 to 16 credentials in shape, each credentialId once (DEC-0129). */
function administratorsOk(value: unknown): boolean {
  if (!Array.isArray(value) || value.length > MAX_ADMINISTRATORS || !value.every(administratorOk)) return false;
  return new Set(value.map((entry: JsonObject) => entry.credentialId)).size === value.length;
}

/**
 * Whether a key set's members have the schema's shapes and FAC-SEM-146's structure (each kid once, the root's kid not
 * among the keys, every window positive, a key valid at its `issuedAt`, no revoked kid among the keys, each
 * administrator's credentialId once); algorithms, small-order keys and signing RP IDs aside.
 */
export function orgKeySetWellFormed(set: JsonObject): boolean {
  const keys = set.keys;
  const revoked = set.revoked;
  if (
    !(set.type === ORG_KEY_SET_TYPE && exactly(set, [...ORG_KEY_SET_FIELDS, "type", "sig"]) &&
      issuerOk(set.issuer) && matches(ORG, set.org) && positive(set.revision) && readable(set.issuedAt) &&
      Array.isArray(keys) && keys.length >= 1 && keys.length <= MAX_KEYS &&
      Array.isArray(revoked) && revoked.length <= MAX_REVOKED && revoked.every(opaque) && new Set(revoked).size === revoked.length &&
      administratorsOk(set.administrators) && isString(set.alg) && opaque(set.kid) && matches(SIG, set.sig))
  ) return false;
  const kids = new Set<unknown>();
  for (const key of keys) {
    if (!isObject(key) || !exactly(key, ["kid", "alg", "x", "notBefore", "notAfter"]) || !opaque(key.kid) || !isString(key.alg) || !matches(X, key.x)) return false;
    if (kids.has(key.kid) || key.kid === set.kid || revoked.includes(key.kid)) return false;
    kids.add(key.kid);
    if (!(time(key.notBefore) < time(key.notAfter))) return false;
  }
  return validAtIssue(set);
}

/** An Ed25519 signature check over `input`, the key and the signature already shape-checked; it never throws. */
function signatureVerifies(x: string, input: Buffer, sig: string): boolean {
  const key = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x }, format: "jwk" });
  return verifySignature(null, input, key, Buffer.from(sig, "base64url"));
}

// ---- The key set -------------------------------------------------------------------------------------------------

/** The organization's root the person's estate pins (the estate record's `organizations` entry, OM-2): it signs key sets only. */
export interface OrgRoot { issuer: string; org: string; kid: string; x: string }
/** What a verifier keeps of the key set it applied: its revision and the digest of its signed bytes. */
export interface HeldOrgKeySet { revision: number; digest: string }

export type OrgKeySetProblem =
  | "context-invalid"
  | "malformed"
  | "wrong-issuer"
  | "wrong-org"
  | "unknown-algorithm"
  | "unusable-key"
  | "small-order-key"
  | "bad-signature"
  | "stale-revision"
  | "revision-conflict";

export type OrgKeySetVerdict = { ok: true; unchanged: boolean; digest: string; held: HeldOrgKeySet } | { ok: false; problem: OrgKeySetProblem };

const heldKeySetOk = (held: unknown) => held === undefined || (isObject(held) && positive(held.revision) && matches(SHA256, held.digest));

/**
 * The reference verifier of an organization's key set (DEC-0127 OM-3), in the order of membership.md's OK table: the
 * context, the shape, the issuer and the root's kid, the organization, the algorithms, the root key's own checks and
 * every listed key's order, the root's signature, then the revision against the one held. It answers and never throws.
 */
export function verifyOrgKeySet(value: unknown, trust: { root: OrgRoot; held?: HeldOrgKeySet }): OrgKeySetVerdict {
  if (!isObject(trust) || !isObject(trust.root) || !issuerOk(trust.root.issuer) || !matches(ORG, trust.root.org) || !opaque(trust.root.kid) || !isString(trust.root.x) || !heldKeySetOk(trust.held)) {
    return { ok: false, problem: "context-invalid" };
  }
  const input = isObject(value) && orgKeySetWellFormed(value) ? orgKeySetSigningInput(value) : undefined;
  if (!input) return { ok: false, problem: "malformed" };
  const set = value as JsonObject;
  const root = trust.root;
  if (set.issuer !== root.issuer || set.kid !== root.kid) return { ok: false, problem: "wrong-issuer" };
  // One root signs for one organization: a server hosting many organizations holds a root per organization (MD-9 (a)).
  if (set.org !== root.org) return { ok: false, problem: "wrong-org" };
  const keys = set.keys as JsonObject[];
  if (!ORG_MEMBERSHIP_ALGORITHMS.includes(set.alg as string) || !keys.every((key) => ORG_MEMBERSHIP_ALGORITHMS.includes(key.alg as string))) return { ok: false, problem: "unknown-algorithm" };
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

// ---- The attestation ---------------------------------------------------------------------------------------------

/** What a verifier keeps, per (org, audience, subject), of the attestation it accepted last (OM-4). */
export interface HeldMembership { subject: string; revision: number; digest: string }

export type OrgMembershipProblem =
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
  | "wrong-org"
  | "wrong-audience"
  | "wrong-subject"
  | "too-long-lived"
  | "not-yet-valid"
  | "expired"
  | "stale-revision"
  | "revision-conflict";

export type OrgMembershipVerdict =
  | { ok: true; status: "active" | "ended"; role: string; refreshDue: boolean; unchanged: boolean; digest: string; held: HeldMembership }
  | { ok: false; problem: OrgMembershipProblem };

export interface OrgMembershipTrust {
  /** The verifier's clock. */
  now: Date;
  /** The organization this verifier reads a membership of, `org:<orgId>`. */
  org: string;
  /** Who this verifier is at the issuer: the audience the issuer names it by. */
  audience: string;
  /** The member this verifier asks about, when it knows the subject: a reader whose audience many members share binds the presenter to it. */
  subject?: string;
  /** The organization's key set this verifier applied (accepted by `verifyOrgKeySet` under the pinned root). */
  keySet: JsonObject;
  /** The attestation held for this organization, audience and subject, if any. */
  held?: HeldMembership;
}

const heldMembershipOk = (held: unknown) => held === undefined || (isObject(held) && opaque(held.subject) && positive(held.revision) && matches(SHA256, held.digest));

/** Whether `trust` is a usable context, the clock aside. */
function usableTrust(trust: OrgMembershipTrust): boolean {
  const keySetOk = isObject(trust.keySet) && orgKeySetWellFormed(trust.keySet) && ORG_MEMBERSHIP_ALGORITHMS.includes(trust.keySet.alg as string);
  return matches(ORG, trust.org) && opaque(trust.audience) && (trust.subject === undefined || opaque(trust.subject)) && keySetOk && trust.keySet.org === trust.org && heldMembershipOk(trust.held);
}

/**
 * The reference verifier (DEC-0127 OM-4), in the order of membership.md's OM table: the context and the clock, the
 * shape, the issuer, the algorithm, the key (listed, not revoked, usable, of full order, its window holding
 * `issuedAt`), the signature, the organization and the audience, the life, the clock against `notBefore` and
 * `expiresAt`, then the attestation held for the subject. An attestation past its `membershipEndsAt` reads `ended`.
 * It answers and never throws.
 */
export function verifyOrgMembership(value: unknown, trust: OrgMembershipTrust): OrgMembershipVerdict {
  if (!isObject(trust)) return { ok: false, problem: "context-invalid" };
  // An unreadable clock makes every comparison false and would accept any attestation; it is refused before any.
  const now = trust.now instanceof Date ? trust.now.getTime() : Number.NaN;
  if (!Number.isFinite(now)) return { ok: false, problem: "no-clock" };
  if (!usableTrust(trust)) return { ok: false, problem: "context-invalid" };
  const input = isObject(value) && orgMembershipWellFormed(value) ? orgMembershipSigningInput(value) : undefined;
  if (!input) return { ok: false, problem: "malformed" };
  const attestation = value as JsonObject;

  const keySet = trust.keySet;
  if (attestation.issuer !== keySet.issuer) return { ok: false, problem: "wrong-issuer" };
  if (!ORG_MEMBERSHIP_ALGORITHMS.includes(attestation.alg as string)) return { ok: false, problem: "unknown-algorithm" };
  const key = (keySet.keys as JsonObject[]).find((entry) => entry.kid === attestation.kid);
  if (!key) return { ok: false, problem: list(keySet.revoked).includes(attestation.kid) ? "key-revoked" : "unknown-key" };
  if (key.alg !== attestation.alg) return { ok: false, problem: "unusable-key" };
  if (isSmallOrderKey(rawKey(key.x as string))) return { ok: false, problem: "small-order-key" };
  const issuedAt = time(attestation.issuedAt);
  if (issuedAt < time(key.notBefore) || issuedAt >= time(key.notAfter)) return { ok: false, problem: "key-not-valid" };
  if (!signatureVerifies(key.x as string, input, attestation.sig as string)) return { ok: false, problem: "bad-signature" };

  if (attestation.org !== trust.org) return { ok: false, problem: "wrong-org" };
  if (attestation.audience !== trust.audience) return { ok: false, problem: "wrong-audience" };
  if (trust.subject !== undefined && attestation.subject !== trust.subject) return { ok: false, problem: "wrong-subject" };
  const notBefore = time(attestation.notBefore);
  const expiresAt = time(attestation.expiresAt);
  if (issuedAt > notBefore || notBefore >= expiresAt || expiresAt - issuedAt > MAX_ATTESTATION_SECONDS * 1000) return { ok: false, problem: "too-long-lived" };
  if (now < notBefore - CLOCK_SKEW_SECONDS * 1000) return { ok: false, problem: "not-yet-valid" };
  // No grace: an attestation past its expiry proves nothing about now. What the reader suspends is OM-6's.
  if (now >= expiresAt) return { ok: false, problem: "expired" };

  const digest = digestOf(input);
  const held = trust.held;
  let unchanged = false;
  if (held && held.subject === attestation.subject) {
    if ((attestation.revision as number) < held.revision) return { ok: false, problem: "stale-revision" };
    if (attestation.revision === held.revision && digest !== held.digest) return { ok: false, problem: "revision-conflict" };
    unchanged = attestation.revision === held.revision;
  }
  const endsAt = attestation.membershipEndsAt === null ? Number.POSITIVE_INFINITY : time(attestation.membershipEndsAt);
  return {
    ok: true,
    status: attestation.status === "ended" || now >= endsAt ? "ended" : "active",
    role: attestation.role as string,
    refreshDue: now >= expiresAt - REFRESH_SECONDS * 1000,
    unchanged,
    digest,
    held: { subject: attestation.subject as string, revision: attestation.revision as number, digest }
  };
}

// ---- Rules -------------------------------------------------------------------------------------------------------

type Flag = (instancePath: string, message: string) => void;

/** FAC-SEM-145 on one attestation: the times are strict and in order, and the life is at most 24 hours. */
function membershipDocument(value: JsonObject, flag: Flag): void {
  const unreadable = (["issuedAt", "notBefore", "expiresAt"] as const).filter((name) => !readable(value[name]));
  for (const name of unreadable) flag(`/${name}`, "a time is an RFC 3339 date-time with an offset, on a day that exists, with at most three fraction digits");
  if (value.membershipEndsAt !== null && !readable(value.membershipEndsAt)) flag("/membershipEndsAt", "membershipEndsAt is null or an RFC 3339 date-time with at most three fraction digits");
  if (unreadable.length) return;
  const issuedAt = time(value.issuedAt);
  const notBefore = time(value.notBefore);
  const expiresAt = time(value.expiresAt);
  if (issuedAt > notBefore) flag("/notBefore", "notBefore is at or after issuedAt");
  if (notBefore >= expiresAt) flag("/expiresAt", "expiresAt is after notBefore");
  if (expiresAt - issuedAt > MAX_ATTESTATION_SECONDS * 1000) flag("/expiresAt", `an attestation expires at most ${MAX_ATTESTATION_SECONDS / 3600} hours after it is issued`);
}

/**
 * FAC-SEM-146 on one key set: each kid once, never the root's kid, every window positive, a key valid at the set's
 * `issuedAt`, no revoked kid among the keys, no key of small order, and each administrator's credential once, with a
 * usable key, under a signing RP with every origin within it (DEC-0129, as FAC-SEM-073 and FAC-SEM-092 say of an
 * estate's authority).
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
  const credentials = new Set<string>();
  for (const [admin, index] of indexed(value.administrators)) {
    const at = `/administrators/${index}`;
    const id = show(admin.credentialId);
    if (credentials.has(id)) flag(`${at}/credentialId`, `credential ${id} is listed twice`);
    credentials.add(id);
    // As FAC-SEM-073 flags an estate's authority: a key no verifier can use certifies an administrator who can never sign.
    if (ASSERTION_ALGORITHMS.includes(admin.alg as string) && "problem" in credentialKey(admin.publicKey, admin.alg as string)) flag(`${at}/publicKey`, "an administrator's key is a usable key of its algorithm, never of small order");
    if (!isSigningRpId(admin.rpId)) flag(`${at}/rpId`, "an administrator signs only under a dedicated signing RP, sign.<domain> (DEC-0063)");
    else list(admin.origins).forEach((origin, n) => {
      if (!originWithin(origin, admin.rpId as string)) flag(`${at}/origins/${n}`, `a signing ceremony runs only on ${show(admin.rpId)} or a host under it, over https without a port`);
    });
  }
}

export function orgMembershipRules(kind: string, value: JsonObject): Finding[] | undefined {
  const findings: Finding[] = [];
  if (kind === "org-membership") {
    membershipDocument(value, (instancePath, message) => findings.push({ code: "FAC-SEM-145", instancePath, message }));
    return findings;
  }
  if (kind === "org-key-set") {
    keySetDocument(value, (instancePath, message) => findings.push({ code: "FAC-SEM-146", instancePath, message }));
    return findings;
  }
  return undefined;
}
// #endregion org-membership
