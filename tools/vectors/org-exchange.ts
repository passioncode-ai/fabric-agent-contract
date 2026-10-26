/**
 * The generator of the draft-exchange vectors (DEC-0131, DEC-0133): `fixtures/vectors/org-exchange.json`, shared by
 * every organization server that drafts key sets and member lists and accepts them signed, and every Fabric that reads
 * a draft and registers a root.
 *
 *   tsx tools/vectors/org-exchange.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/org-exchange.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/org-exchange.test.ts` runs the check.
 * The signed documents are the membership vectors' key sets (`org-membership.json`, written by their own generator)
 * and the member list fixture; a draft is its signed document without the signature, and its digest is computed here
 * from the decision's own words (SHA-256 of the RFC 8785 bytes the signer signs). Each expected answer is written here
 * by hand from DEC-0131's items; nothing here imports `src/org-exchange.ts`.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { rfc8785 } from "../../src/canonical.js";
import { projectRoot } from "../../src/contract.js";
import { orgMembershipVectors } from "./org-membership.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/org-exchange.json";

const without = (doc: Json, ...names: string[]) => Object.fromEntries(Object.entries(doc).filter(([name]) => !names.includes(name)));
const digest = (doc: Json) => `sha256:${createHash("sha256").update(Buffer.from(rfc8785(doc), "utf8")).digest("hex")}`;
/** An issuer the pattern admits but 320 characters long, over the schema's 261. */
const LONG_ISSUER = `https://${["a", "b", "c", "d", "e"].map((c) => c.repeat(60)).join(".")}.example`;
const fixture = (name: string): Json => JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/positive", `${name}.json`), "utf8"));

function orgExchangeVectors(): Json {
  const membership = orgMembershipVectors();
  const root = membership.root as Json;
  const r1 = membership.keySets.r1 as Json;
  const r2 = membership.keySets.r2 as Json;
  const r2Other = membership.keySets.r2Other as Json;
  // A key set's signer signs the RFC 8785 bytes of the set without `sig`; a list's, the list without `digest` and `signature`.
  const d1 = digest(without(r1, "sig"));
  const d2 = digest(without(r2, "sig"));
  const authority = fixture("org-authority");
  const keySet = fixture("org-key-set");
  const authorityDraft = without(authority, "digest", "signature");
  const da = digest(authorityDraft);
  const envelope = (draft: Json, base: Json | null, over: Json = {}): Json => ({ type: "org-key-set-draft/1", org: draft.org, base, draft, digest: digest(draft), ...over });
  const registration = fixture("org-root-registration");
  const claim = registration.claim as string;
  const server = { org: root.org, issuer: root.issuer, registered: false, validClaims: [claim] };
  return {
    about:
      "Vectors for the draft exchange (DEC-0131, DEC-0133), written by tools/vectors/org-exchange.ts, never by hand. root: organization A's root as members pin it, and as GET .../root answers it nested ({org, issuer, root: {kid, x}}). digest cases: keySetDraftDigest(draft) or authorityDraftDigest(draft), null for none; a key set's digest is sha256: of the RFC 8785 bytes of the set without sig, a list's of the list without digest and signature. rules cases: the FAC-SEM-151 codes and paths an org-key-set-draft or org-authority-draft envelope gives. keySet cases: acceptSignedKeySet(signed, {root, held?, draftDigest?}). authority cases: acceptSignedAuthority(signed, {now, org, keySet, held?, draftDigest?}), keySet the fixture key set. registration cases: verifyRootRegistration(body, {org, issuer, registered, claimValid}) where claimValid(claim) is true exactly for a claim in validClaims; claimChecked says whether claimValid may be called at all (a refused body never reaches it). expected is exactly what the reference returns.",
    root,
    rootAnswer: { org: root.org, issuer: root.issuer, root: { kid: root.kid, x: root.x } },
    digest: [
      { name: "a key set's draft: the set without sig", kind: "key-set", draft: without(r2, "sig"), expected: d2 },
      { name: "a signed key set is no draft", kind: "key-set", draft: r2, expected: null },
      { name: "a key set without revoked has no signing input", kind: "key-set", draft: without(r2, "sig", "revoked"), expected: null },
      { name: "a list's draft: the list without digest and signature", kind: "authority", draft: authorityDraft, expected: da },
      { name: "a signed list is no draft", kind: "authority", draft: authority, expected: null },
      { name: "a list with a member of its own is no draft", kind: "authority", draft: { ...authorityDraft, note: "x" }, expected: null }
    ],
    rules: [
      { name: "the first draft: no base, revision 1", kind: "org-key-set-draft", envelope: envelope(without(r1, "sig"), null), expected: [] },
      { name: "the next draft: revision one above the base", kind: "org-key-set-draft", envelope: envelope(without(r2, "sig"), { revision: 1, digest: d1 }), expected: [] },
      { name: "a digest that is not the draft's", kind: "org-key-set-draft", envelope: envelope(without(r2, "sig"), { revision: 1, digest: d1 }, { digest: d1 }), expected: [["FAC-SEM-151", "/digest"]] },
      { name: "a draft naming another organization", kind: "org-key-set-draft", envelope: envelope(without(r2, "sig"), { revision: 1, digest: d1 }, { org: "org:org-b" }), expected: [["FAC-SEM-151", "/draft/org"]] },
      { name: "a revision that skips one", kind: "org-key-set-draft", envelope: envelope(without(r2, "sig"), null), expected: [["FAC-SEM-151", "/draft/revision"]] },
      { name: "a list's draft", kind: "org-authority-draft", envelope: { type: "org-authority-draft/1", org: authority.org, base: { revision: authority.revision - 1, digest: d1 }, draft: authorityDraft, digest: da }, expected: [] }
    ],
    keySet: [
      { name: "the first set, signed as drafted", signed: r1, context: { root, draftDigest: d1 }, expected: { ok: true, unchanged: false, digest: d1, held: { revision: 1, digest: d1 } } },
      { name: "the next set over the held one, signed as drafted", signed: r2, context: { root, held: { revision: 1, digest: d1 }, draftDigest: d2 }, expected: { ok: true, unchanged: false, digest: d2, held: { revision: 2, digest: d2 } } },
      { name: "the held set again: unchanged, no draft needed", signed: r1, context: { root, held: { revision: 1, digest: d1 } }, expected: { ok: true, unchanged: true, digest: d1, held: { revision: 1, digest: d1 } } },
      { name: "a valid set with no draft waiting", signed: r2, context: { root, held: { revision: 1, digest: d1 } }, expected: { ok: false, problem: "no-draft" } },
      { name: "a valid set that is not the draft", signed: r2Other, context: { root, held: { revision: 1, digest: d1 }, draftDigest: d2 }, expected: { ok: false, problem: "draft-mismatch" } },
      { name: "the verifier's refusal comes first: a set the root did not sign", signed: { ...r2, revision: 3 }, context: { root, held: { revision: 1, digest: d1 }, draftDigest: d2 }, expected: { ok: false, problem: "bad-signature" } }
    ],
    authority: [
      { name: "the pending list, signed by an administrator", signed: authority, context: { now: "2026-10-27T00:00:00Z", org: authority.org, keySet, draftDigest: da }, expected: { ok: true, unchanged: false, digest: authority.digest, revision: authority.revision } },
      { name: "the held list again", signed: authority, context: { now: "2026-10-27T00:00:00Z", org: authority.org, keySet, held: { revision: authority.revision, digest: authority.digest } }, expected: { ok: true, unchanged: true, digest: authority.digest, revision: authority.revision } },
      { name: "a list with no draft waiting", signed: authority, context: { now: "2026-10-27T00:00:00Z", org: authority.org, keySet }, expected: { ok: false, problem: "no-draft" } },
      { name: "a list that is not the draft", signed: authority, context: { now: "2026-10-27T00:00:00Z", org: authority.org, keySet, draftDigest: d1 }, expected: { ok: false, problem: "draft-mismatch" } }
    ],
    registration: [
      { name: "the root and the owner's credential, on the claim the server showed", body: registration, context: server, claimChecked: true, expected: { ok: true, root, administrator: registration.administrator } },
      { name: "a claim the server did not show, checked last", body: { ...registration, claim: "A".repeat(43) }, context: server, claimChecked: true, expected: { ok: false, problem: "claim-invalid" } },
      { name: "another organization", body: { ...registration, org: "org:org-b" }, context: server, claimChecked: false, expected: { ok: false, problem: "wrong-org" } },
      { name: "a first set already accepted", body: registration, context: { ...server, registered: true }, claimChecked: false, expected: { ok: false, problem: "root-registered" } },
      { name: "an issuer the first set's root could never carry", body: { ...registration, issuer: "https://orgs.example/" }, context: { ...server, issuer: "https://orgs.example/" }, claimChecked: false, expected: { ok: false, problem: "malformed" } },
      { name: "an issuer over 261 characters", body: { ...registration, issuer: LONG_ISSUER }, context: { ...server, issuer: LONG_ISSUER }, claimChecked: false, expected: { ok: false, problem: "malformed" } },
      { name: "a root kid the first set could never carry", body: { ...registration, root: { ...registration.root, kid: "bad kid" } }, context: server, claimChecked: false, expected: { ok: false, problem: "malformed" } },
      { name: "an administrator without a credential id", body: { ...registration, administrator: without(registration.administrator, "credentialId") }, context: server, claimChecked: false, expected: { ok: false, problem: "malformed" } },
      { name: "an administrator under a sign-in RP", body: { ...registration, administrator: { ...registration.administrator, rpId: "orgs.example", origins: ["https://orgs.example"] } }, context: server, claimChecked: false, expected: { ok: false, problem: "unusable-key" } },
      { name: "a root of small order", body: { ...registration, root: { ...registration.root, x: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } }, context: server, claimChecked: false, expected: { ok: false, problem: "small-order-key" } }
    ]
  };
}

/** What `--write` writes: the vector file's exact text. */
export function buildOrgExchangeVectors(): string {
  return `${JSON.stringify(orgExchangeVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildOrgExchangeVectors();
  if (process.argv.includes("--write")) {
    writeFileSync(target, built);
    console.log(`wrote ${VECTOR_FILE}`);
  } else if (readFileSync(target, "utf8") !== built) {
    console.error(`stale vector file (run with --write): ${VECTOR_FILE}`);
    process.exitCode = 1;
  } else {
    console.log("vector file matches the generator");
  }
}
