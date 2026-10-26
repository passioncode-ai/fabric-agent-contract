import { createHash } from "node:crypto";
import { isSmallOrderKey } from "./ed25519.js";
import { type Finding, type JsonObject, isObject } from "./findings.js";
import { orgAuthorityDigest, verifyOrgAuthority, type OrgAuthorityProblem } from "./org-authority.js";
import { administratorOk, orgKeySetSigningInput, verifyOrgKeySet, type HeldOrgKeySet, type OrgKeySetProblem, type OrgRoot } from "./org-membership.js";
import { signingCredentialFindings } from "./signing-challenges.js";
import { credentialKey } from "./webauthn.js";

// #region org-exchange, docs: docs/specification/membership.md#the-draft-exchange
/**
 * The draft exchange (DEC-0131): an organization server drafts each `org-key-set/1` and each `org-authority/1`, the
 * owner's Fabric (for a key set) or an administrator's (for a member list) reads the pending draft, shows its changes,
 * signs it, and returns it; the server accepts a signed document only when its signed bytes are the pending draft's.
 * A key-set draft holds public material only and is read without a credential; a member-list draft names every member,
 * so the server serves it only to the organization's administrators and its relay (OX-6). Either is authentic only by
 * the signature over it.
 * Before the first key set the owner's Fabric registers the root and its administrator credential, authorised by a
 * one-time claim the server showed the owner's signed-in account.
 */
export const KEY_SET_DRAFT_TYPE = "org-key-set-draft/1";
export const AUTHORITY_DRAFT_TYPE = "org-authority-draft/1";
export const ROOT_REGISTRATION_TYPE = "org-root-registration/1";
/** The routes, under the issuer's origin, `{org}` being the organization's opaque id (the part after `org:`). */
export const ORG_EXCHANGE_PATHS = {
  root: "/fabric/membership/v1/{org}/root",
  keySet: "/fabric/membership/v1/{org}/key-set",
  keySetDraft: "/fabric/membership/v1/{org}/key-set/draft",
  authority: "/fabric/membership/v1/{org}/authority",
  authorityDraft: "/fabric/membership/v1/{org}/authority/draft"
} as const;
/** The exchange's own refusals, beside the verifiers' problems. */
export const ORG_EXCHANGE_ERRORS = ["no-root", "no-signed-key-set", "no-draft", "draft-mismatch", "claim-invalid", "root-registered"] as const;
/** A root claim lives at most this long after the server issues it. */
export const MAX_CLAIM_SECONDS = 15 * 60;
/** The server drafts the next key set at least this long before the newest signing key's `notAfter`. */
export const ROTATION_LEAD_SECONDS = 7 * 24 * 60 * 60;

const isString = (value: unknown): value is string => typeof value === "string";
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const NONCE = /^[A-Za-z0-9_-]{43}$/;
/** 32 bytes, base64url without padding, canonical. */
const X = /^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/;
/** `activity-common#/$defs/opaqueId`, as `verifyOrgKeySet` reads the root's kid. */
const OPAQUE = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,127}$/;
const ORG = /^org:[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const digestOf = (bytes: Buffer) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
const baseOk = (base: unknown) => base === null || (isObject(base) && Number.isSafeInteger(base.revision) && (base.revision as number) >= 1 && isString(base.digest) && SHA256.test(base.digest));

/** The digest a key-set draft is matched by: SHA-256 of the root's signing input over it (`orgKeySetSigningInput`). */
export function keySetDraftDigest(draft: unknown): string | undefined {
  if (!isObject(draft) || Object.hasOwn(draft, "sig")) return undefined;
  const input = orgKeySetSigningInput(draft);
  return input ? digestOf(input) : undefined;
}

/** The members of an `org-authority/1` an administrator signs over: every member but `digest` and `signature`. */
const AUTHORITY_DRAFT_FIELDS = ["type", "issuer", "org", "revision", "issuedAt", "expiresAt", "members"];

/** The digest a member-list draft is matched by: the list's own `orgAuthorityDigest` over it, for an `org-authority/1`'s exact members. */
export function authorityDraftDigest(draft: unknown): string | undefined {
  if (!isObject(draft) || draft.type !== "org-authority/1" || Object.keys(draft).length !== AUTHORITY_DRAFT_FIELDS.length || !AUTHORITY_DRAFT_FIELDS.every((name) => Object.hasOwn(draft, name))) return undefined;
  try {
    return orgAuthorityDigest(draft);
  } catch {
    return undefined;
  }
}

/**
 * FAC-SEM-151 on a draft envelope: its `digest` is its draft's, its draft names the envelope's organization, and its
 * revision is one above the base it was drafted from (1 with no base).
 */
export function draftFindings(kind: string, value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-151", instancePath, message });
  const draft = isObject(value.draft) ? value.draft : {};
  const digest = kind === "org-key-set-draft" ? keySetDraftDigest(draft) : authorityDraftDigest(draft);
  if (digest === undefined) flag("/draft", "the draft has no signing input: a member is missing, extra, or has no RFC 8785 form");
  else if (value.digest !== digest) flag("/digest", "digest is the draft's own (SHA-256 of what its signer signs)");
  if (draft.org !== value.org) flag("/draft/org", "the draft names the envelope's organization");
  if (baseOk(value.base)) {
    const want = value.base === null ? 1 : ((value.base as JsonObject).revision as number) + 1;
    if (draft.revision !== want) flag("/draft/revision", `a draft's revision is one above its base's (${want})`);
  }
  return findings;
}

export function orgExchangeRules(kind: string, value: JsonObject): Finding[] | undefined {
  return kind === "org-key-set-draft" || kind === "org-authority-draft" ? draftFindings(kind, value) : undefined;
}

// ---- Accepting a signed document ---------------------------------------------------------------------------------

export type DraftMatchProblem = "no-draft" | "draft-mismatch";

/**
 * Whether a signed key set is the pending draft, signed (OX-3): it verifies under the registered root against the set
 * held (`verifyOrgKeySet`), and the bytes its root signed are the draft's. Same revision and bytes as the held set is
 * `unchanged` (a repeated POST), never a second acceptance.
 */
export function acceptSignedKeySet(
  signed: unknown,
  ctx: { root: OrgRoot; held?: HeldOrgKeySet; draftDigest?: string }
): { ok: true; unchanged: boolean; digest: string; held: HeldOrgKeySet } | { ok: false; problem: OrgKeySetProblem | DraftMatchProblem } {
  const verdict = verifyOrgKeySet(signed, ctx.held ? { root: ctx.root, held: ctx.held } : { root: ctx.root });
  if (!verdict.ok) return verdict;
  if (verdict.unchanged) return verdict;
  if (ctx.draftDigest === undefined) return { ok: false, problem: "no-draft" };
  if (verdict.digest !== ctx.draftDigest) return { ok: false, problem: "draft-mismatch" };
  return verdict;
}

/** The same for a member list (OX-6): it verifies under the applied key set (`verifyOrgAuthority`) and is the draft. */
export function acceptSignedAuthority(
  signed: unknown,
  ctx: { now: Date; org: string; keySet: JsonObject; held?: { revision: number; digest: string }; draftDigest?: string }
): { ok: true; unchanged: boolean; digest: string; revision: number } | { ok: false; problem: OrgAuthorityProblem | DraftMatchProblem } {
  const verdict = verifyOrgAuthority(signed, ctx);
  if (!verdict.ok) return { ok: false, problem: verdict.problem };
  if (verdict.unchanged) return { ok: true, unchanged: true, digest: verdict.digest, revision: verdict.revision };
  if (ctx.draftDigest === undefined) return { ok: false, problem: "no-draft" };
  if (verdict.digest !== ctx.draftDigest) return { ok: false, problem: "draft-mismatch" };
  return { ok: true, unchanged: false, digest: verdict.digest, revision: verdict.revision };
}

// ---- Registering the root ----------------------------------------------------------------------------------------

export type RootRegistrationProblem = "malformed" | "wrong-org" | "root-registered" | "claim-invalid" | "unusable-key" | "small-order-key";

/**
 * The server's check of an `org-root-registration/1` (OX-2), in order: the shape, the organization and issuer, no first
 * key set accepted yet (`root-registered`; before it a newer registration replaces an older one), the shape including
 * the root's kid and the administrator credential exactly as the first set must carry them, the root not of small
 * order and the administrator's credential a usable signing credential (FAC-SEM-092's rule), and last the claim
 * (one-time, shown to the owner's signed-in account, at most 15 minutes old). `claimValid` only checks the server's
 * store and never consumes: on `ok` the server uses the claim up and records the registration in one transaction. The
 * registration proves no possession; the root's signature over the first set does (OX-3). It answers and never throws.
 */
export function verifyRootRegistration(
  body: unknown,
  /** `registered`: a first key set under a root of this organization was accepted (OX-3), not merely a registration recorded. */
  ctx: { org: string; issuer: string; registered: boolean; claimValid: (claim: string) => boolean }
): { ok: true; root: OrgRoot; administrator: JsonObject } | { ok: false; problem: RootRegistrationProblem } {
  if (!isObject(body) || Object.keys(body).sort().join(",") !== "administrator,claim,issuer,org,root,type" || body.type !== ROOT_REGISTRATION_TYPE || !isString(body.org) || !ORG.test(body.org) || !isString(body.issuer) || !isObject(body.root) || Object.keys(body.root).sort().join(",") !== "kid,x" ||
    !isString(body.root.kid) || !OPAQUE.test(body.root.kid) || !isString(body.root.x) || !X.test(body.root.x) || !administratorOk(body.administrator) || !isString(body.claim) || !NONCE.test(body.claim)) {
    return { ok: false, problem: "malformed" };
  }
  if (body.org !== ctx.org || body.issuer !== ctx.issuer) return { ok: false, problem: "wrong-org" };
  if (ctx.registered) return { ok: false, problem: "root-registered" };
  if (isSmallOrderKey(Buffer.from(body.root.x, "base64url"))) return { ok: false, problem: "small-order-key" };
  // administratorOk holds the credential's shape, its algorithm among them.
  const admin = body.administrator as JsonObject;
  if (signingCredentialFindings(admin, "").length > 0) return { ok: false, problem: "unusable-key" };
  const usable = credentialKey(admin.publicKey, admin.alg as string);
  if ("problem" in usable) return { ok: false, problem: usable.problem };
  if (!ctx.claimValid(body.claim)) return { ok: false, problem: "claim-invalid" };
  return { ok: true, root: { issuer: ctx.issuer, org: ctx.org, kid: body.root.kid, x: body.root.x }, administrator: admin };
}
// #endregion org-exchange
