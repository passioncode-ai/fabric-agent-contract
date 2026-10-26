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
const SIG_KID = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,127}#sig$/;
/** At most three fraction digits, as every signed record's times (DEC-0085): every port compares the same instants. */
const MILLISECONDS = /:[0-9]{2}(?:\.[0-9]{1,3})?(?:[Zz]|[+-][0-9]{2}:[0-9]{2})$/;
const time = (value: unknown) => (isString(value) && MILLISECONDS.test(value) ? strictTime(value) : Number.NaN);
/** Whether a kid is a `#sig` kid (DEC-0053): the only keys a relay session authenticates with. */
export const isSigKid = (value: unknown): value is string => isString(value) && SIG_KID.test(value);
const ASSERTION_MEMBERS = ["credentialId", "alg", "authenticatorData", "clientDataJSON", "sig"];

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
 * FAC-SEM-150 on one list: the window is two strict instants with at most three fraction digits, `expiresAt` after
 * `issuedAt` and at most 7 days after it; at most 1024 members of 1 to 8 keys; each subject, each `iss` and each kid
 * once across the list; every kid a `#sig` kid and every key a P-256 point SEC 1 accepts.
 */
export function orgAuthorityFindings(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-150", instancePath, message });
  const issuedAt = time(value.issuedAt);
  const expiresAt = time(value.expiresAt);
  if (!Number.isFinite(issuedAt)) flag("/issuedAt", "issuedAt is an RFC 3339 date-time with an offset, on a day that exists, with at most three fraction digits");
  if (!Number.isFinite(expiresAt)) flag("/expiresAt", "expiresAt is an RFC 3339 date-time with an offset, on a day that exists, with at most three fraction digits");
  else if (Number.isFinite(issuedAt) && (expiresAt <= issuedAt || expiresAt - issuedAt > MAX_AUTHORITY_SECONDS * 1000)) {
    flag("/expiresAt", "a member list expires after it is issued and at most 7 days after (v4 §7)");
  }
  if (Array.isArray(value.members) && value.members.length > MAX_MEMBERS) flag("/members", `a member list holds at most ${MAX_MEMBERS} members`);
  const subjects = new Set<string>(), issuers = new Set<string>(), kids = new Set<string>();
  (Array.isArray(value.members) ? value.members : []).forEach((member, index) => {
    if (!isObject(member)) flag(`/members/${index}`, "a member is an object {subject, role, iss, keys}");
  });
  for (const [member, index] of indexed(value.members)) {
    const at = `/members/${index}`;
    const subject = show(member.subject), iss = show(member.iss);
    if (subjects.has(subject)) flag(`${at}/subject`, `subject ${subject} is listed twice`);
    subjects.add(subject);
    if (issuers.has(iss)) flag(`${at}/iss`, "a context issuer is one member's: two members never share an iss (DEC-0128)");
    issuers.add(iss);
    const count = Array.isArray(member.keys) ? member.keys.length : 0;
    if (count < 1 || count > MAX_MEMBER_KEYS) flag(`${at}/keys`, `a member has 1 to ${MAX_MEMBER_KEYS} keys`);
    (Array.isArray(member.keys) ? member.keys : []).forEach((key, n) => {
      if (!isObject(key)) flag(`${at}/keys/${n}`, "a member's key is an object {kid, publicKey}");
    });
    for (const [key, n] of indexed(member.keys)) {
      const kid = show(key.kid);
      if (!isSigKid(key.kid)) flag(`${at}/keys/${n}/kid`, "a member's kid is <enrollment id>#sig (DEC-0053)");
      if (kids.has(kid)) flag(`${at}/keys/${n}/kid`, `kid ${kid} is listed twice: a relay session names one key by it`);
      kids.add(kid);
      if (memberKeyOctets(key.publicKey) === undefined) flag(`${at}/keys/${n}/publicKey`, "a member's key is a P-256 point SEC 1 accepts (DEC-0047)");
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
  if (signature.format !== "webauthn-assertion" || !ASSERTION_MEMBERS.every((name) => isString(signature[name]))) return { ok: false, problem: "malformed" };
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
// ---- The relay's admission set ---------------------------------------------------------------------------------

/**
 * What an organization's relay admits from (DEC-0129, CT-37): the organization's member list (`org-authority/1`) it
 * holds, under the organization's key set it applied (`verifyOrgKeySet` under the root it pinned when it was set up for
 * the organization, as an estate's relay pins the estate's first passkeys).
 */
export interface OrgAdmissionInput {
  held?: JsonObject; // the list the relay verified and applied last, if any
  candidate?: unknown; // a newer list offered to it
  org: string; // the organization the relay serves, `org:<orgId>`
  keySet: JsonObject; // the organization's key set the relay applied
  at: Date;
  schemaValid: (doc: unknown) => boolean;
}

export type OrgAdmissionResult =
  | { ok: true; held: JsonObject; revision: number; set: Map<string, Uint8Array> }
  | { ok: false; refusal: "no-record" | "invalid" | "unverified" | "not-yet-valid" | "expired"; problem?: OrgAuthorityProblem };

/**
 * An organization relay's admission set, kid → `#sig` key as SEC 1 octets, from its member list; or why there is none,
 * and then the relay admits nobody (DEC-0047, fail closed). A candidate must be schema-valid and verify against the held
 * list's revision; without one, the held list is verified again under the key set applied now, so a list whose window
 * ended, or whose signer the root no longer certifies, admits nobody until a newer list verifies. A refused candidate
 * changes nothing: the caller keeps `held`. FAC-SEM-150 holds for every verified list, so every listed key is a P-256
 * point, each kid once.
 */
export function orgRelayAdmissionSet(input: OrgAdmissionInput): OrgAdmissionResult {
  const offered = input.candidate !== undefined;
  if (offered && !input.schemaValid(input.candidate)) return { ok: false, refusal: "invalid" };
  const doc = offered ? input.candidate : input.held;
  if (doc === undefined) return { ok: false, refusal: "no-record" };
  // A held list that cannot be read back (no positive revision, no RFC 8785 form) is refused, never treated as none:
  // dropping it would drop the rollback guard (as `relayAdmissionSet` in `src/relay.ts` refuses such a record, CT-111).
  let held: { revision: number; digest: string } | undefined;
  if (input.held !== undefined) {
    const revision = isObject(input.held) ? input.held.revision : undefined;
    if (typeof revision !== "number" || !Number.isSafeInteger(revision) || revision < 1) return { ok: false, refusal: "invalid" };
    try {
      const digest = orgAuthorityDigest(input.held as JsonObject);
      if (offered) held = { revision, digest };
    } catch {
      return { ok: false, refusal: "invalid" };
    }
  }
  const verdict = verifyOrgAuthority(doc, { now: input.at, org: input.org, keySet: input.keySet, ...(held ? { held } : {}) });
  if (!verdict.ok) {
    // `expired` and `not-yet-valid` name the held list's own window, on which the relay ends its sessions; a refused
    // candidate is `unverified` with its problem, as relayAdmissionSet answers, and the held list stands.
    if (!offered && (verdict.problem === "expired" || verdict.problem === "not-yet-valid")) return { ok: false, refusal: verdict.problem };
    return { ok: false, refusal: "unverified", problem: verdict.problem };
  }
  // FAC-SEM-150 held for the verified list: every member's keys are 1 to 8 objects, each a #sig kid with a P-256 key.
  const set = new Map<string, Uint8Array>();
  for (const member of verdict.members) {
    for (const key of member.keys as JsonObject[]) set.set(key.kid as string, memberKeyOctets(key.publicKey) as Uint8Array);
  }
  return { ok: true, held: doc as JsonObject, revision: verdict.revision, set };
}
// #endregion org-authority
