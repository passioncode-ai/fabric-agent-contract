import { createHash, createPublicKey, verify as verifySignature } from "node:crypto";
import { isSmallOrderKey } from "./ed25519.js";
import { type Finding, type JsonObject, isObject } from "./findings.js";
import { ORG, ORG_MEMBERSHIP_ALGORITHMS, orgKeySetWellFormed } from "./org-membership.js";
import { CLOCK_SKEW_SECONDS, strictTime } from "./rfc3339.js";
import { ORG_INSTANCE_FIELDS, signingStatement } from "./signing-challenges.js";

// #region org-instance, docs: docs/specification/membership.md#instances-dec-0170
/**
 * `org-instance/1` (DEC-0170): the organization server's signed statement that one instance runs for one organization:
 * the instance's id, its product, its origin, where it is placed, whether it is `active` or `retired`, and its revision,
 * for at most 7 days. A signing key of the organization's `org-key-set/1` signs it (OM-3), as it signs membership
 * attestations; the platform (`instance_put`, PLAT-146) and the instance's product verify it offline. No person appears.
 */
export const ORG_INSTANCE_TYPE = "org-instance/1";
/** The longest life, `expiresAt − issuedAt`: a week, re-issued daily, so a retirement counts within a day. */
export const MAX_INSTANCE_SECONDS = 7 * 24 * 60 * 60;
/** The reader asks for the next revision this long before `expiresAt`; the verifier reports `refreshDue` from then on. */
export const INSTANCE_REFRESH_SECONDS = 24 * 60 * 60;
/** Where an instance runs: the organization's cloud, a member's or the organization's machine, a PassionCode service. */
export const PLACEMENTS: readonly string[] = ["org-cloud", "machine", "service"];
export const INSTANCE_STATUSES: readonly string[] = ["active", "retired"];
export { CLOCK_SKEW_SECONDS };

const isString = (value: unknown): value is string => typeof value === "string";
const positive = (value: unknown) => Number.isSafeInteger(value) && (value as number) >= 1;
/** `activity-common#/$defs/opaqueId`. */
const OPAQUE = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,127}$/;
/** An https origin in lower case, two labels or more, no port, path or trailing slash (`entitlement#/$defs/issuer`). */
const ORIGIN = /^https:\/\/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const SIG = /^[A-Za-z0-9_-]{85}[AQgw]$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const MILLISECONDS = /:[0-9]{2}(?:\.[0-9]{1,3})?(?:[Zz]|[+-][0-9]{2}:[0-9]{2})$/;

const matches = (pattern: RegExp, value: unknown) => isString(value) && pattern.test(value);
const opaque = (value: unknown) => matches(OPAQUE, value);
const originOk = (value: unknown) => isString(value) && value.length <= 261 && ORIGIN.test(value);
/** A strict RFC 3339 instant with at most three fraction digits, in milliseconds, or NaN. */
const time = (value: unknown) => (isString(value) && MILLISECONDS.test(value) ? strictTime(value) : Number.NaN);
const readable = (value: unknown) => Number.isFinite(time(value));
const exactly = (value: JsonObject, names: readonly string[]) => Object.keys(value).length === names.length && names.every((name) => Object.hasOwn(value, name));

/**
 * The bytes the organization's key signs: the register's `org-instance/1` statement (DEC-0063): the UTF-8 RFC 8785 form
 * of the statement without `sig`. `undefined` when it does not carry exactly the registered members.
 */
export function orgInstanceSigningInput(statement: unknown): Buffer | undefined {
  if (!isObject(statement) || statement.type !== ORG_INSTANCE_TYPE) return undefined;
  const { type: _type, sig: _sig, ...fields } = statement;
  return signingStatement(ORG_INSTANCE_TYPE, fields);
}

/** Whether a statement's members have the schema's shapes, the algorithm's value aside (IS-1). */
export function orgInstanceWellFormed(doc: JsonObject): boolean {
  return (
    exactly(doc, [...ORG_INSTANCE_FIELDS, "type", "sig"]) &&
    originOk(doc.issuer) && matches(ORG, doc.org) && opaque(doc.instanceId) && opaque(doc.product) && originOk(doc.origin) &&
    PLACEMENTS.includes(doc.placement as string) && INSTANCE_STATUSES.includes(doc.status as string) && positive(doc.revision) &&
    readable(doc.issuedAt) && readable(doc.notBefore) && readable(doc.expiresAt) &&
    isString(doc.alg) && opaque(doc.kid) && matches(SIG, doc.sig)
  );
}

/** What a reader keeps, per (organization, instance), of the statement it accepted last (IS-2). */
export interface HeldInstance { revision: number; digest: string }

export type OrgInstanceProblem =
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
  | "wrong-instance"
  | "too-long-lived"
  | "not-yet-valid"
  | "expired"
  | "stale-revision"
  | "revision-conflict";

export type OrgInstanceVerdict =
  | { ok: true; status: "active" | "retired"; product: string; origin: string; placement: string; refreshDue: boolean; unchanged: boolean; digest: string; held: HeldInstance }
  | { ok: false; problem: OrgInstanceProblem };

export interface OrgInstanceTrust {
  /** The reader's clock. */
  now: Date;
  /** The organization the reader serves the instance for, `org:<orgId>` (the platform: the record's `subject`). */
  org: string;
  /** The instance the reader asks about (the platform: the path of `instance_put`). */
  instanceId: string;
  /** The organization's key set the reader applied (accepted by `verifyOrgKeySet` under the pinned root). */
  keySet: JsonObject;
  /** The statement held for this instance, if any. */
  held?: HeldInstance;
}

const heldOk = (held: unknown) => held === undefined || (isObject(held) && positive(held.revision) && matches(SHA256, held.digest));

function usableTrust(trust: OrgInstanceTrust): boolean {
  const keySet = trust.keySet;
  return (
    matches(ORG, trust.org) && opaque(trust.instanceId) && isObject(keySet) && orgKeySetWellFormed(keySet) &&
    ORG_MEMBERSHIP_ALGORITHMS.includes(keySet.alg as string) && keySet.org === trust.org && heldOk(trust.held)
  );
}

/** An Ed25519 signature check over `input`, the key and the signature already shape-checked; it never throws. */
function signatureVerifies(x: string, input: Buffer, sig: string): boolean {
  const key = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x }, format: "jwk" });
  return verifySignature(null, input, key, Buffer.from(sig, "base64url"));
}

/**
 * The reference verifier (DEC-0170 IS-2), in `verifyOrgMembership`'s order: the context and the clock, the shape, the
 * issuer, the algorithm, the key (listed, not revoked, usable, of full order, its window holding `issuedAt`), the
 * signature, the organization and the instance, the life, the clock against `notBefore` and `expiresAt`, then the
 * statement held for the instance. A `retired` statement verifies and reads `status: "retired"`. It never throws.
 */
export function verifyOrgInstance(value: unknown, trust: OrgInstanceTrust): OrgInstanceVerdict {
  if (!isObject(trust)) return { ok: false, problem: "context-invalid" };
  const now = trust.now instanceof Date ? trust.now.getTime() : Number.NaN;
  if (!Number.isFinite(now)) return { ok: false, problem: "no-clock" };
  if (!usableTrust(trust)) return { ok: false, problem: "context-invalid" };
  const input = isObject(value) && orgInstanceWellFormed(value) ? orgInstanceSigningInput(value) : undefined;
  if (!input) return { ok: false, problem: "malformed" };
  const statement = value as JsonObject;

  const keySet = trust.keySet;
  if (statement.issuer !== keySet.issuer) return { ok: false, problem: "wrong-issuer" };
  if (!ORG_MEMBERSHIP_ALGORITHMS.includes(statement.alg as string)) return { ok: false, problem: "unknown-algorithm" };
  const key = (keySet.keys as JsonObject[]).find((entry) => entry.kid === statement.kid);
  if (!key) return { ok: false, problem: (keySet.revoked as unknown[]).includes(statement.kid) ? "key-revoked" : "unknown-key" };
  if (key.alg !== statement.alg) return { ok: false, problem: "unusable-key" };
  if (isSmallOrderKey(Buffer.from(key.x as string, "base64url"))) return { ok: false, problem: "small-order-key" };
  const issuedAt = time(statement.issuedAt);
  if (issuedAt < time(key.notBefore) || issuedAt >= time(key.notAfter)) return { ok: false, problem: "key-not-valid" };
  if (!signatureVerifies(key.x as string, input, statement.sig as string)) return { ok: false, problem: "bad-signature" };

  if (statement.org !== trust.org) return { ok: false, problem: "wrong-org" };
  if (statement.instanceId !== trust.instanceId) return { ok: false, problem: "wrong-instance" };
  const notBefore = time(statement.notBefore);
  const expiresAt = time(statement.expiresAt);
  if (issuedAt > notBefore || notBefore >= expiresAt || expiresAt - issuedAt > MAX_INSTANCE_SECONDS * 1000) return { ok: false, problem: "too-long-lived" };
  if (now < notBefore - CLOCK_SKEW_SECONDS * 1000) return { ok: false, problem: "not-yet-valid" };
  // No grace: an expired statement proves nothing about now.
  if (now >= expiresAt) return { ok: false, problem: "expired" };

  const digest = `sha256:${createHash("sha256").update(input).digest("hex")}`;
  const held = trust.held;
  if (held && (statement.revision as number) < held.revision) return { ok: false, problem: "stale-revision" };
  if (held && statement.revision === held.revision && digest !== held.digest) return { ok: false, problem: "revision-conflict" };
  return {
    ok: true,
    status: statement.status as "active" | "retired",
    product: statement.product as string,
    origin: statement.origin as string,
    placement: statement.placement as string,
    refreshDue: now >= expiresAt - INSTANCE_REFRESH_SECONDS * 1000,
    unchanged: held !== undefined && statement.revision === held.revision,
    digest,
    held: { revision: statement.revision as number, digest }
  };
}

/** FAC-SEM-177 on one statement (IS-5): the times strict and in order, and the life at most 7 days. */
export function orgInstanceRules(kind: string, value: JsonObject): Finding[] | undefined {
  return kind === "org-instance" ? instanceDocument(value) : undefined;
}

function instanceDocument(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-177", instancePath, message });
  const unreadable = (["issuedAt", "notBefore", "expiresAt"] as const).filter((name) => !readable(value[name]));
  for (const name of unreadable) flag(`/${name}`, "a time is an RFC 3339 date-time with an offset, on a day that exists, with at most three fraction digits");
  if (unreadable.length) return findings;
  const issuedAt = time(value.issuedAt);
  const notBefore = time(value.notBefore);
  const expiresAt = time(value.expiresAt);
  if (issuedAt > notBefore) flag("/notBefore", "notBefore is at or after issuedAt");
  if (notBefore >= expiresAt) flag("/expiresAt", "expiresAt is after notBefore");
  if (expiresAt - issuedAt > MAX_INSTANCE_SECONDS * 1000) flag("/expiresAt", "a statement expires at most 7 days after it is issued");
  return findings;
}
// #endregion org-instance
