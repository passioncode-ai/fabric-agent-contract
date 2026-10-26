import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import {
  MAX_CLAIM_SECONDS,
  ORG_EXCHANGE_ERRORS,
  ORG_EXCHANGE_PATHS,
  ROTATION_LEAD_SECONDS,
  acceptSignedAuthority,
  acceptSignedKeySet,
  authorityDraftDigest,
  draftFindings,
  keySetDraftDigest,
  orgExchangeRules,
  verifyRootRegistration
} from "../src/org-exchange.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";

// DEC-0131: the draft exchange. A server drafts a key set or a member list, the owner's (or an administrator's)
// Fabric signs it, and the server accepts only the pending draft, signed; the first key set registers the root.
const root = projectRoot();
type Json = Record<string, any>;
const read = (relative: string) => JSON.parse(readFileSync(path.join(root, relative), "utf8")) as Json;
const validator = await createValidator();
const valid = (value: unknown, schema: string) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}.schema.json`, value).valid;
const vectors = read("fixtures/vectors/org-membership.json");
const ROOT = vectors.root;
const R1 = vectors.keySets.r1, R2 = vectors.keySets.r2;
const KS_DRAFT = read("fixtures/positive/org-key-set-draft.json");
const AU_DRAFT = read("fixtures/positive/org-authority-draft.json");
const REG = read("fixtures/positive/org-root-registration.json");
const AUTHORITY = read("fixtures/positive/org-authority.json");
const KEY_SET = read("fixtures/positive/org-key-set.json");
const strip = (doc: Json, ...names: string[]) => Object.fromEntries(Object.entries(doc).filter(([name]) => !names.includes(name)));
const held1 = { revision: 1, digest: keySetDraftDigest(strip(R1, "sig")) as string };

describe("the routes and the documents (DEC-0131)", () => {
  it("names five routes under the issuer, the exchange's refusals, a 15-minute claim and a 7-day rotation lead", () => {
    expect(Object.values(ORG_EXCHANGE_PATHS).every((route) => route.startsWith("/fabric/membership/v1/{org}/"))).toBe(true);
    expect(ORG_EXCHANGE_ERRORS).toEqual(["no-root", "no-signed-key-set", "no-draft", "draft-mismatch", "claim-invalid", "root-registered"]);
    expect([MAX_CLAIM_SECONDS, ROTATION_LEAD_SECONDS]).toEqual([900, 604800]);
  });

  it("accepts the fixtures, and each passes FAC-SEM-151", () => {
    expect(valid(KS_DRAFT, "org-key-set-draft")).toBe(true);
    expect(valid(AU_DRAFT, "org-authority-draft")).toBe(true);
    expect(valid(REG, "org-root-registration")).toBe(true);
    expect(valid({ ...REG, keySet: R2 }, "org-root-registration")).toBe(false);
    const { administrator: _a, ...noAdministrator } = REG;
    expect(valid(noAdministrator, "org-root-registration")).toBe(false);
    expect(evaluateSemanticRules("org-key-set-draft", KS_DRAFT)).toEqual([]);
    expect(evaluateSemanticRules("org-authority-draft", AU_DRAFT)).toEqual([]);
    // The public entry reaches FAC-SEM-151, so an empty answer above is the rule's, not a missing dispatch.
    expect(evaluateSemanticRules("org-key-set-draft", { ...KS_DRAFT, org: "org:org-b" }).map((finding) => finding.code)).toEqual(["FAC-SEM-151"]);
    expect(evaluateSemanticRules("org-authority-draft", { ...AU_DRAFT, digest: `sha256:${"1".repeat(64)}` }).map((finding) => finding.code)).toEqual(["FAC-SEM-151"]);
  });
});

describe("the draft's digest", () => {
  it("is the signer's input digest, and none for what a signer could not sign", () => {
    expect(keySetDraftDigest(strip(R2, "sig"))).toBe(KS_DRAFT.digest);
    expect(keySetDraftDigest(R2)).toBeUndefined();
    expect(keySetDraftDigest(1)).toBeUndefined();
    expect(keySetDraftDigest(strip(R2, "sig", "revoked"))).toBeUndefined();
    expect(authorityDraftDigest(strip(AUTHORITY, "digest", "signature"))).toBe(AUTHORITY.digest);
    expect(authorityDraftDigest(AUTHORITY)).toBeUndefined();
    expect(authorityDraftDigest(strip(AUTHORITY, "digest"))).toBeUndefined();
    expect(authorityDraftDigest({ ...strip(AUTHORITY, "digest", "signature"), type: "org-key-set/1" })).toBeUndefined();
    expect(authorityDraftDigest({ ...strip(AUTHORITY, "digest", "signature"), extra: 1 })).toBeUndefined();
    expect(authorityDraftDigest(null)).toBeUndefined();
    expect(authorityDraftDigest({ ...strip(AUTHORITY, "digest", "signature"), revision: Number.NaN })).toBeUndefined();
  });
});

describe("FAC-SEM-151", () => {
  const paths = (kind: string, value: Json) => draftFindings(kind, value).map((finding) => [finding.code, finding.instancePath]);
  it("refuses another digest, another organization, and a revision not one above the base", () => {
    expect(paths("org-key-set-draft", { ...KS_DRAFT, digest: `sha256:${"0".repeat(64)}` })).toEqual([["FAC-SEM-151", "/digest"]]);
    expect(paths("org-key-set-draft", { ...KS_DRAFT, org: "org:org-b" })).toEqual([["FAC-SEM-151", "/draft/org"]]);
    expect(paths("org-key-set-draft", { ...KS_DRAFT, base: null })).toEqual([["FAC-SEM-151", "/draft/revision"]]);
    expect(paths("org-key-set-draft", { ...KS_DRAFT, base: { ...KS_DRAFT.base, revision: 5 } })).toEqual([["FAC-SEM-151", "/draft/revision"]]);
    expect(paths("org-authority-draft", { ...AU_DRAFT, base: { revision: 1, digest: AU_DRAFT.base.digest } })).toEqual([["FAC-SEM-151", "/draft/revision"]]);
  });

  it("names a draft it cannot read, and leaves the revision to the schema when the base is not one", () => {
    expect(paths("org-key-set-draft", { ...KS_DRAFT, draft: R2 })).toEqual([["FAC-SEM-151", "/draft"]]);
    expect(paths("org-key-set-draft", { ...KS_DRAFT, draft: "x" })).toEqual([["FAC-SEM-151", "/draft"], ["FAC-SEM-151", "/draft/org"], ["FAC-SEM-151", "/draft/revision"]]);
    expect(paths("org-key-set-draft", { ...KS_DRAFT, base: { revision: "1" } })).toEqual([]);
    expect(orgExchangeRules("org-key-set", KS_DRAFT)).toBeUndefined();
    expect(orgExchangeRules("org-authority-draft", AU_DRAFT)).toEqual([]);
  });
});

describe("acceptSignedKeySet (OX-3)", () => {
  it("accepts the pending draft signed by the root, once", () => {
    const accepted = acceptSignedKeySet(R2, { root: ROOT, held: held1, draftDigest: KS_DRAFT.digest });
    expect(accepted.ok && { unchanged: accepted.unchanged, revision: accepted.held.revision }).toEqual({ unchanged: false, revision: 2 });
    const again = acceptSignedKeySet(R2, { root: ROOT, held: { revision: 2, digest: KS_DRAFT.digest } });
    expect(again.ok && again.unchanged).toBe(true);
  });

  it("refuses a set that is not the draft, with no draft, or that the root did not sign", () => {
    expect(acceptSignedKeySet(R2, { root: ROOT, held: held1 })).toEqual({ ok: false, problem: "no-draft" });
    expect(acceptSignedKeySet(R2, { root: ROOT, held: held1, draftDigest: `sha256:${"1".repeat(64)}` })).toEqual({ ok: false, problem: "draft-mismatch" });
    expect(acceptSignedKeySet({ ...R2, revision: 3 }, { root: ROOT, draftDigest: KS_DRAFT.digest })).toEqual({ ok: false, problem: "bad-signature" });
  });
});

describe("acceptSignedAuthority (OX-6)", () => {
  const ctx = { now: new Date("2026-10-27T00:00:00Z"), org: "org:org-a", keySet: KEY_SET };
  it("accepts the pending list signed by an administrator, once", () => {
    const accepted = acceptSignedAuthority(AUTHORITY, { ...ctx, draftDigest: AU_DRAFT.digest });
    expect(accepted).toEqual({ ok: true, unchanged: false, digest: AUTHORITY.digest, revision: 3 });
    expect(acceptSignedAuthority(AUTHORITY, { ...ctx, held: { revision: 3, digest: AUTHORITY.digest } })).toEqual({ ok: true, unchanged: true, digest: AUTHORITY.digest, revision: 3 });
  });

  it("refuses a list that is not the draft, with no draft, or that does not verify", () => {
    expect(acceptSignedAuthority(AUTHORITY, ctx)).toEqual({ ok: false, problem: "no-draft" });
    expect(acceptSignedAuthority(AUTHORITY, { ...ctx, draftDigest: `sha256:${"1".repeat(64)}` })).toEqual({ ok: false, problem: "draft-mismatch" });
    expect(acceptSignedAuthority({ ...AUTHORITY, revision: 4 }, { ...ctx, draftDigest: AU_DRAFT.digest })).toEqual({ ok: false, problem: "digest-mismatch" });
  });
});

describe("verifyRootRegistration (OX-2)", () => {
  const ctx = { org: "org:org-a", issuer: "https://orgs.example", registered: false, claimValid: (claim: string) => claim === REG.claim };
  it("registers the root and the owner's administrator credential before the first set, on the claim the server showed", () => {
    const registered = verifyRootRegistration(REG, ctx);
    expect(registered).toEqual({ ok: true, root: { issuer: ctx.issuer, org: ctx.org, kid: ROOT.kid, x: ROOT.x }, administrator: REG.administrator });
    // The first set then verifies under the root just registered, as any set does (OX-3).
    expect(acceptSignedKeySet(R1, { root: (registered as { root: typeof ROOT }).root, draftDigest: held1.digest })).toMatchObject({ ok: true, unchanged: false, digest: held1.digest });
  });

  it("refuses a malformed body before anything else", () => {
    for (const body of [null, { ...REG, type: "x" }, { ...REG, org: 1 }, { ...REG, org: "org-a" }, { ...REG, issuer: 1 }, { ...REG, issuer: "https://orgs.example/" }, { ...REG, root: "r" }, { ...REG, root: { ...REG.root, kid: 1 } }, { ...REG, root: { ...REG.root, x: 1 } }, { ...REG, root: { ...REG.root, x: "short" } }, { ...REG, root: { ...REG.root, kid: "bad kid!" } }, { ...REG, extra: 1 }, { ...REG, root: { ...REG.root, extra: 1 } }, { ...REG, root: { ...REG.root, kid: "" } }, { ...REG, administrator: "a" },
      // The administrator exactly as the first set's administrators must carry it, or the claim would buy a set that never verifies.
      strip(REG, "administrator"), { ...REG, administrator: strip(REG.administrator, "credentialId") }, { ...REG, administrator: { ...REG.administrator, origins: [] } },
      { ...REG, administrator: { ...REG.administrator, extra: 1 } }, { ...REG, administrator: { ...REG.administrator, publicKey: { ...REG.administrator.publicKey, d: "x" } } },
      { ...REG, administrator: { ...REG.administrator, origins: ["https://sign.orgs.example", "https://sign.orgs.example"] } }, { ...REG, claim: 1 }, { ...REG, claim: "short" }]) {
      expect(verifyRootRegistration(body, ctx), JSON.stringify(body)?.slice(0, 50)).toEqual({ ok: false, problem: "malformed" });
    }
  });

  it("refuses another organization, a root already registered, an unusable key, and last a claim the server did not show", () => {
    expect(verifyRootRegistration({ ...REG, org: "org:org-b" }, ctx)).toEqual({ ok: false, problem: "wrong-org" });
    expect(verifyRootRegistration({ ...REG, issuer: "https://other.example" }, ctx)).toEqual({ ok: false, problem: "wrong-org" });
    expect(verifyRootRegistration(REG, { ...ctx, registered: true })).toEqual({ ok: false, problem: "root-registered" });
    expect(verifyRootRegistration({ ...REG, root: { ...REG.root, x: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } }, ctx)).toEqual({ ok: false, problem: "small-order-key" });
    expect(verifyRootRegistration({ ...REG, administrator: { ...REG.administrator, rpId: "orgs.example" } }, ctx)).toEqual({ ok: false, problem: "unusable-key" });
    expect(verifyRootRegistration({ ...REG, administrator: { ...REG.administrator, publicKey: { ...REG.administrator.publicKey, x: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } } }, ctx)).toEqual({ ok: false, problem: "small-order-key" });
    expect(verifyRootRegistration({ ...REG, administrator: { ...REG.administrator, alg: 7 } }, ctx)).toEqual({ ok: false, problem: "malformed" });
    // The claim is checked last and never consumed on a refusal: a body refused for its keys leaves the claim usable.
    let checked = 0;
    const counting = { ...ctx, claimValid: () => { checked += 1; return true; } };
    for (const body of [{ ...REG, root: { ...REG.root, x: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } }, { ...REG, administrator: { ...REG.administrator, rpId: "orgs.example" } }, { ...REG, extra: 1 }, { ...REG, issuer: "https://orgs.example/" }]) {
      verifyRootRegistration(body, { ...counting, issuer: (body as Json).issuer });
    }
    verifyRootRegistration(REG, { ...counting, registered: true });
    expect(checked).toBe(0);
    expect(verifyRootRegistration(REG, { ...ctx, claimValid: () => false })).toEqual({ ok: false, problem: "claim-invalid" });
  });
});
