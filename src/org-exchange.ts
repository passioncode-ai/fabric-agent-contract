import { createHash } from "node:crypto";
import { type Finding, type JsonObject, isObject } from "./findings.js";
import { orgAuthorityDigest, verifyOrgAuthority, type OrgAuthorityProblem } from "./org-authority.js";
import { orgKeySetSigningInput, verifyOrgKeySet, type HeldOrgKeySet, type OrgKeySetProblem, type OrgRoot } from "./org-membership.js";

// #region org-exchange, docs: docs/specification/membership.md#the-draft-exchange
/**
 * The draft exchange (DEC-0131): an organization server drafts each `org-key-set/1` and each `org-authority/1`, the
 * owner's Fabric (for a key set) or an administrator's (for a member list) reads the pending draft, shows its changes,
 * signs it, and returns it; the server accepts a signed document only when its signed bytes are the pending draft's.
 * A draft holds public material only, so it is read without a credential; its authenticity is the signature over it.
 * The first key set also registers the root, authorised by a one-time claim the server gave the owner's account.
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
const ORG = /^org:[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const digestOf = (bytes: Buffer) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
const baseOk = (base: unknown) => base === null || (isObject(base) && Number.isSafeInteger(base.revision) && (base.revision as number) >= 1 && isString(base.digest) && SHA256.test(base.digest));

/** The digest a key-set draft is matched by: SHA-256 of the root's signing input over it (`orgKeySetSigningInput`). */
export function keySetDraftDigest(draft: unknown): string | undefined {
  if (!isObject(draft) || Object.hasOwn(draft, "sig")) return undefined;
  const input = orgKeySetSigningInput(draft);
  return input ? digestOf(input) : undefined;
}

/** The digest a member-list draft is matched by: the list's own `orgAuthorityDigest` over it. */
export function authorityDraftDigest(draft: unknown): string | undefined {
  if (!isObject(draft) || Object.hasOwn(draft, "digest") || Object.hasOwn(draft, "signature")) return undefined;
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

export type RootRegistrationProblem = "malformed" | "wrong-org" | "root-registered" | "claim-invalid" | OrgKeySetProblem | DraftMatchProblem;

/**
 * The server's check of an `org-root-registration/1` (OX-2), in order: the shape, the organization and issuer, no root
 * registered yet, the claim (one-time, issued to the owner's account, at most 15 minutes old: `claimValid` is the
 * server's own store), then the first key set: revision 1, verified under the root it registers (the proof the sender
 * holds the root) and equal to the pending draft. It answers and never throws.
 */
export function verifyRootRegistration(
  body: unknown,
  ctx: { org: string; issuer: string; registered: boolean; claimValid: (claim: string) => boolean; draftDigest?: string }
): { ok: true; root: OrgRoot; held: HeldOrgKeySet } | { ok: false; problem: RootRegistrationProblem } {
  if (!isObject(body) || body.type !== ROOT_REGISTRATION_TYPE || !isString(body.org) || !ORG.test(body.org) || !isString(body.issuer) || !isObject(body.root) ||
    !isString(body.root.kid) || !isString(body.root.x) || !isString(body.claim) || !NONCE.test(body.claim) || !isObject(body.keySet)) {
    return { ok: false, problem: "malformed" };
  }
  if (body.org !== ctx.org || body.issuer !== ctx.issuer) return { ok: false, problem: "wrong-org" };
  if (ctx.registered) return { ok: false, problem: "root-registered" };
  if (!ctx.claimValid(body.claim)) return { ok: false, problem: "claim-invalid" };
  if (body.keySet.revision !== 1) return { ok: false, problem: "malformed" };
  const root: OrgRoot = { issuer: ctx.issuer, org: ctx.org, kid: body.root.kid, x: body.root.x };
  const accepted = acceptSignedKeySet(body.keySet, { root, ...(ctx.draftDigest !== undefined ? { draftDigest: ctx.draftDigest } : {}) });
  if (!accepted.ok) return accepted;
  return { ok: true, root, held: accepted.held };
}
// #endregion org-exchange
