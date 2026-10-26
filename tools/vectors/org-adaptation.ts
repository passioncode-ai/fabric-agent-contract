/**
 * The generator of the adaptation-plan vectors (DEC-0138): `fixtures/vectors/org-adaptation.json`, shared by every
 * organization server that accepts a plan and every Fabric that sends one.
 *
 *   tsx tools/vectors/org-adaptation.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/org-adaptation.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/org-adaptation.test.ts` runs the
 * check. Digests are computed here from the decision's own words (SHA-256 of the RFC 8785 bytes); each expected answer
 * is written here by hand from DEC-0138's items. Nothing here imports `src/org-adaptation.ts`.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { rfc8785 } from "../../src/canonical.js";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/org-adaptation.json";

const digest = (doc: unknown) => `sha256:${createHash("sha256").update(Buffer.from(rfc8785(doc), "utf8")).digest("hex")}`;
const fixture = (name: string): Json => JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/positive", `${name}.json`), "utf8"));

export function orgAdaptationVectors(): Json {
  const plan = fixture("org-adaptation");
  const withdrawn = fixture("org-adaptation-withdrawn");
  const org = plan.org as string;
  const held = { revision: plan.revision, digest: digest(plan) };
  const [access, spend, role] = plan.requests as [Json, Json, Json];
  const changedSpend = { ...spend, amountUsd: 300 };
  const next = { ...plan, revision: 3, requests: [access, changedSpend, role] };
  const decisions = [
    { id: access.id, digest: digest(access), state: "granted", at: "2026-10-27T10:00:00Z" },
    { id: spend.id, digest: digest(spend), state: "granted", at: "2026-10-27T10:01:00Z" },
    { id: role.id, digest: digest(role), state: "refused", at: "2026-10-27T10:05:00Z" }
  ];
  return {
    description: "DEC-0138: the organization part of an adaptation plan. `digests` are adaptationDigest and requestDigest (SHA-256 over RFC 8785). `decide` is the server's decision on a PUT plan whose credential (the one it issued the person's Fabric for the person) it authenticated: `member` says the credential's person holds a membership the server has not ended, `valid` that the plan passed its schema and FAC-SEM-153, `org` is the route's organization in its full `org:<orgId>` form, `held` the revision held. `receipts` binds each request's decision by its id and digest.",
    digests: [
      { name: "the plan", value: plan, digest: digest(plan) },
      ...(plan.requests as Json[]).map((request) => ({ name: `request ${request.id}`, value: request, digest: digest(request) })),
      { name: "a withdrawn plan", value: withdrawn, digest: digest(withdrawn) },
      { name: "a spend of 12.5", value: { ...spend, amountUsd: 12.5 }, digest: digest({ ...spend, amountUsd: 12.5 }) },
      { name: "a spend of 1234.07", value: { ...spend, amountUsd: 1234.07 }, digest: digest({ ...spend, amountUsd: 1234.07 }) },
      { name: "a spend of 99999.99", value: { ...spend, amountUsd: 99999.99 }, digest: digest({ ...spend, amountUsd: 99999.99 }) }
    ],
    decide: [
      { name: "the first plan", plan, context: { member: true, valid: true, org }, expected: { outcome: "accepted", held } },
      { name: "a higher revision", plan: next, context: { member: true, valid: true, org, held }, expected: { outcome: "accepted", held: { revision: 3, digest: digest(next) } } },
      { name: "the same revision and digest", plan, context: { member: true, valid: true, org, held }, expected: { outcome: "repeated", held } },
      { name: "the same revision, another digest", plan: { ...plan, items: (plan.items as Json[]).map((item, i) => (i === 0 ? { ...item, label: "Another label" } : item)) }, context: { member: true, valid: true, org, held }, expected: { outcome: "refused", refusal: "revision-conflict" } },
      { name: "a lower revision", plan: { ...plan, revision: 1 }, context: { member: true, valid: true, org, held }, expected: { outcome: "refused", refusal: "stale-revision" } },
      { name: "another organization", plan: { ...plan, org: "org:org-b" }, context: { member: true, valid: true, org }, expected: { outcome: "refused", refusal: "wrong-organization" } },
      { name: "a plan that failed its schema or FAC-SEM-153", plan, context: { member: true, valid: false, org }, expected: { outcome: "refused", refusal: "malformed" } },
      { name: "a person who is not a member", plan, context: { member: false, valid: true, org }, expected: { outcome: "refused", refusal: "not-a-member" } },
      { name: "another revision of the type", plan: { ...plan, type: "org-adaptation/2" }, context: { member: true, valid: false, org }, expected: { outcome: "refused", refusal: "schema-unsupported" } },
      { name: "a plan with no RFC 8785 form (a lone surrogate), whatever the schema check said", plan: { ...plan, items: [{ ...(plan.items as Json[])[0], label: "Billing \ud800 migration" }] }, context: { member: true, valid: true, org }, expected: { outcome: "refused", refusal: "malformed" } },
      { name: "a revision below 1", plan: { ...plan, revision: 0 }, context: { member: true, valid: true, org }, expected: { outcome: "refused", refusal: "malformed" } },
      { name: "not a member, and another type", plan: { ...plan, type: "org-adaptation/2" }, context: { member: false, valid: false, org }, expected: { outcome: "refused", refusal: "not-a-member" } },
      { name: "malformed, and another organization", plan: { ...plan, org: "org:org-b" }, context: { member: true, valid: false, org }, expected: { outcome: "refused", refusal: "malformed" } },
      { name: "another organization, at a lower revision", plan: { ...plan, org: "org:org-b", revision: 1 }, context: { member: true, valid: true, org, held }, expected: { outcome: "refused", refusal: "wrong-organization" } },
      { name: "a plan crossing a withdrawal made on the server's page", plan: next, context: { member: true, valid: true, org, held: { revision: 3, digest: digest({ ...withdrawn, revision: 3 }) } }, expected: { outcome: "refused", refusal: "revision-conflict" } },
      { name: "a withdrawal", plan: withdrawn, context: { member: true, valid: true, org, held }, expected: { outcome: "accepted", held: { revision: 3, digest: digest(withdrawn) } } }
    ],
    receipts: [
      {
        name: "every request decided",
        plan,
        decisions,
        expected: {
          type: "org-adaptation-receipt/1", org, revision: 2, digest: digest(plan),
          requests: decisions.map((d) => ({ id: d.id, digest: d.digest, state: d.state, at: d.at }))
        }
      },
      {
        name: "a changed request waits for a new decision; unchanged ones keep theirs",
        plan: next,
        decisions,
        expected: {
          type: "org-adaptation-receipt/1", org, revision: 3, digest: digest(next),
          requests: [
            { id: access.id, digest: digest(access), state: "granted", at: "2026-10-27T10:00:00Z" },
            { id: spend.id, digest: digest(changedSpend), state: "pending" },
            { id: role.id, digest: digest(role), state: "refused", at: "2026-10-27T10:05:00Z" }
          ]
        }
      },
      {
        name: "a request the server closed without a decision",
        plan,
        decisions: [decisions[0], { id: spend.id, digest: digest(spend), state: "expired", at: "2026-11-26T10:00:00Z" }],
        expected: {
          type: "org-adaptation-receipt/1", org, revision: 2, digest: digest(plan),
          requests: [
            { id: access.id, digest: digest(access), state: "granted", at: "2026-10-27T10:00:00Z" },
            { id: spend.id, digest: digest(spend), state: "expired", at: "2026-11-26T10:00:00Z" },
            { id: role.id, digest: digest(role), state: "pending" }
          ]
        }
      },
      {
        name: "an unchanged request stays expired under a new revision",
        plan: next,
        decisions: [{ id: role.id, digest: digest(role), state: "expired", at: "2026-11-26T10:00:00Z" }],
        expected: {
          type: "org-adaptation-receipt/1", org, revision: 3, digest: digest(next),
          requests: [
            { id: access.id, digest: digest(access), state: "pending" },
            { id: spend.id, digest: digest(changedSpend), state: "pending" },
            { id: role.id, digest: digest(role), state: "expired", at: "2026-11-26T10:00:00Z" }
          ]
        }
      },
      { name: "a withdrawn plan", plan: withdrawn, decisions, expected: { type: "org-adaptation-receipt/1", org, revision: 3, digest: digest(withdrawn), requests: [] } }
    ]
  };
}

/** What `--write` writes: the vector file's exact text. */
export function buildOrgAdaptationVectors(): string {
  return `${JSON.stringify(orgAdaptationVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildOrgAdaptationVectors();
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
