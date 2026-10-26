import { createHash } from "node:crypto";
import { rfc8785 } from "./canonical.js";
import { type Finding, type JsonObject, indexed, isObject, show } from "./findings.js";
import { orgKeySetWellFormed } from "./org-membership.js";
import { p256KeyRefusal } from "./p256.js";
import { CLOCK_SKEW_SECONDS, strictTime } from "./rfc3339.js";
import { verifySigningAssertion } from "./signing-challenges.js";
import type { AssertionProblem, PasskeyCredential } from "./webauthn.js";

// #region org-authority, docs: docs/specification/membership.md#the-organizations-member-list
/**
 * `org-authority/1` (DEC-0129): an organization's signed list of admitted members, the source of its relay's admission
 * set (DEC-0047, CT-37). Each member is named by the subject pairwise to the relay's audience (DEC-0127), with a role,
 * the issuer of its context's tokens (DEC-0128) and the `#sig` keys of its enrollments in the organization. An
 * organization server drafts it; an administrator's signing passkey signs it, one the organization's root certifies in
 * the applied `org-key-set/1` (`administrators`), so no server signs an organization's members (Fabric ADR-0178 points 2
 * and 3). The digest and the passkey's challenge follow the estate record's (DEC-0055, DEC-0063).
 */
export const ORG_AUTHORITY_TYPE = "org-authority/1";
/** The longest life, `expiresAt − issuedAt`: 7 days, v4 §7's validity of an organization's records. */
export const MAX_AUTHORITY_SECONDS = 7 * 24 * 60 * 60;
export const MAX_MEMBERS = 1024;
export const MAX_MEMBER_KEYS = 8;
export { CLOCK_SKEW_SECONDS };

const isString = (value: unknown): value is string => typeof value === "string";
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const ORG = /^org:[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const time = strictTime;

/** SHA-256 over the RFC 8785 form of the list without `digest` and `signature`, as an estate record's (DEC-0043). */
export function orgAuthorityDigest(doc: JsonObject): string {
  const { digest: _digest, signature: _signature, ...covered } = doc;
  return `sha256:${createHash("sha256").update(Buffer.from(rfc8785(covered), "utf8")).digest("hex")}`;
}

/** The P-256 point of a `#sig` key as SEC 1 octets, or why it is none: the relay verifies ES256 only (DEC-0047). */
export function memberKeyOctets(publicKey: unknown): Uint8Array | undefined {
  if (!isString(publicKey) || !/^B[A-Za-z0-9+/]{85}[AEIMQUYcgkosw048]=$/.test(publicKey)) return undefined;
  const octets = new Uint8Array(Buffer.from(publicKey, "base64"));
  return p256KeyRefusal(octets) === null ? octets : undefined;
}

// ---- Rules -------------------------------------------------------------------------------------------------------

/**
 * FAC-SEM-150 on one list: the window is two strict instants, `expiresAt` after `issuedAt` and at most 7 days after
 * it; each subject, each `iss` and each kid once across the list; every key a P-256 point SEC 1 accepts.
 */
export function orgAuthorityFindings(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-150", instancePath, message });
  const issuedAt = time(value.issuedAt);
  const expiresAt = time(value.expiresAt);
  if (!Number.isFinite(issuedAt)) flag("/issuedAt", "issuedAt is an RFC 3339 date-time with an offset, on a day that exists");
  if (!Number.isFinite(expiresAt)) flag("/expiresAt", "expiresAt is an RFC 3339 date-time with an offset, on a day that exists");
  else if (Number.isFinite(issuedAt) && (expiresAt <= issuedAt || expiresAt - issuedAt > MAX_AUTHORITY_SECONDS * 1000)) {
    flag("/expiresAt", "a member list expires after it is issued and at most 7 days after (v4 §7)");
  }
  const subjects = new Set<string>(), issuers = new Set<string>(), kids = new Set<string>();
  for (const [member, index] of indexed(value.members)) {
    const at = `/members/${index}`;
    const subject = show(member.subject), iss = show(member.iss);
    if (subjects.has(subject)) flag(`${at}/subject`, `subject ${subject} is listed twice`);
    subjects.add(subject);
    if (issuers.has(iss)) flag(`${at}/iss`, "a context issuer is one member's: two members never share an iss (DEC-0128)");
    issuers.add(iss);
    for (const [key, n] of indexed(member.keys)) {
      const kid = show(key.kid);
      if (kids.has(kid)) flag(`${at}/keys/${n}/kid`, `kid ${kid} is listed twice: a relay session names one key by it`);
      kids.add(kid);
      if (isString(key.publicKey) && memberKeyOctets(key.publicKey) === undefined) flag(`${at}/keys/${n}/publicKey`, "a member's key is a P-256 point SEC 1 accepts (DEC-0047)");
    }
  }
  return findings;
}

export function orgAuthorityRules(kind: string, value: JsonObject): Finding[] | undefined {
  return kind === "org-authority" ? orgAuthorityFindings(value) : undefined;
}

// ---- The verifier ------------------------------------------------------------------------------------------------

/** What a reader keeps of the list it applied: its revision and digest. */
export interface HeldOrgAuthority { revision: number; digest: string }

export type OrgAuthorityProblem =
  | "context-invalid"
  | "no-clock"
  | "malformed"
  | "digest-mismatch"
  | "wrong-issuer"
  | "wrong-org"
  | "unknown-administrator"
  | AssertionProblem
  | "too-long-lived"
  | "not-yet-valid"
  | "expired"
  | "rule-violation"
  | "stale-revision"
  | "revision-conflict";

export type OrgAuthorityVerdict =
  | { ok: true; digest: string; revision: number; signedBy: string; unchanged: boolean; held: HeldOrgAuthority; members: JsonObject[] }
  | { ok: false; problem: OrgAuthorityProblem; codes?: string[] };

export interface OrgAuthorityTrust {
  /** The verifier's clock. */
  now: Date;
  /** The organization this reader admits members of, `org:<orgId>`. */
  org: string;
  /** The organization's key set this reader applied (`verifyOrgKeySet` under the pinned root). */
  keySet: JsonObject;
  /** The list held, if any. */
  held?: HeldOrgAuthority;
}

const heldOk = (held: unknown) => held === undefined || (isObject(held) && Number.isSafeInteger(held.revision) && (held.revision as number) >= 1 && isString(held.digest) && SHA256.test(held.digest));

/**
 * The reference verifier (DEC-0129), in the order of membership.md's OL table: the context and the clock, the shape and
 * the digest, the issuer and the organization, the signer among the key set's administrators, the assertion over the
 * register's `org-authority/1` challenge (`verifySigningAssertion`: a signing RP, WebAuthn Level 3 §7.2), the window,
 * the list's own rules (FAC-SEM-150), then the revision against the one held. It answers and never throws.
 */
export function verifyOrgAuthority(value: unknown, trust: OrgAuthorityTrust): OrgAuthorityVerdict {
  if (!isObject(trust)) return { ok: false, problem: "context-invalid" };
  const now = trust.now instanceof Date ? trust.now.getTime() : Number.NaN;
  if (!Number.isFinite(now)) return { ok: false, problem: "no-clock" };
  const keySet = trust.keySet;
  if (!isString(trust.org) || !ORG.test(trust.org) || !isObject(keySet) || !orgKeySetWellFormed(keySet) || keySet.org !== trust.org || !heldOk(trust.held)) {
    return { ok: false, problem: "context-invalid" };
  }
  if (!isObject(value) || value.type !== ORG_AUTHORITY_TYPE || !isString(value.digest) || !Number.isSafeInteger(value.revision) || (value.revision as number) < 1 || !Array.isArray(value.members) || !isObject(value.signature)) {
    return { ok: false, problem: "malformed" };
  }
  const signature = value.signature;
  if (signature.format !== "webauthn-assertion" || !isString(signature.credentialId)) return { ok: false, problem: "malformed" };
  let digest: string;
  try {
    digest = orgAuthorityDigest(value);
  } catch {
    return { ok: false, problem: "malformed" };
  }
  if (digest !== value.digest) return { ok: false, problem: "digest-mismatch" };
  if (value.issuer !== keySet.issuer) return { ok: false, problem: "wrong-issuer" };
  if (value.org !== trust.org) return { ok: false, problem: "wrong-org" };
  // Only a credential the root certified in the applied set signs; one a later set dropped signs nothing from it on.
  const admin = (keySet.administrators as JsonObject[]).find((entry) => entry.credentialId === signature.credentialId);
  if (!admin) return { ok: false, problem: "unknown-administrator" };
  const credential: PasskeyCredential = {
    credentialId: admin.credentialId as string,
    alg: admin.alg as string,
    publicKey: admin.publicKey as JsonObject,
    rpId: admin.rpId as string,
    origins: (admin.origins as unknown[]).filter(isString)
  };
  const assertion = verifySigningAssertion(signature, credential, ORG_AUTHORITY_TYPE, { digest });
  if (!assertion.ok) return { ok: false, problem: assertion.problem };

  const issuedAt = time(value.issuedAt);
  const expiresAt = time(value.expiresAt);
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || expiresAt <= issuedAt || expiresAt - issuedAt > MAX_AUTHORITY_SECONDS * 1000) return { ok: false, problem: "too-long-lived" };
  if (now < issuedAt - CLOCK_SKEW_SECONDS * 1000) return { ok: false, problem: "not-yet-valid" };
  // No grace, as an attestation's: past its expiry a list admits nobody (DEC-0047, fail closed).
  if (now >= expiresAt) return { ok: false, problem: "expired" };
  const codes = [...new Set(orgAuthorityFindings(value).map((finding) => finding.code))];
  if (codes.length > 0) return { ok: false, problem: "rule-violation", codes };

  const held = trust.held;
  const revision = value.revision as number;
  if (held && revision < held.revision) return { ok: false, problem: "stale-revision" };
  if (held && revision === held.revision && digest !== held.digest) return { ok: false, problem: "revision-conflict" };
  return {
    ok: true,
    digest,
    revision,
    signedBy: credential.credentialId,
    unchanged: held !== undefined && revision === held.revision,
    held: { revision, digest },
    members: (value.members as unknown[]).filter(isObject)
  };
}
// #endregion org-authority
