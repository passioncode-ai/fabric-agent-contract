# Handoff: DEC-0085, entitlements for the organization offer (2026-10-17)

## Objective

The PassionCode platform asked the contract (its PLAT-020, on the project board, 2026-10-17) for a signed record of
what an order entitles an organization or a person's estate to, verified offline by the first organization server and
a personal cloud. The brief, [`brief.md`](../evidence/specs/2026-10-17-entitlement/brief.md), fixed the decisions and the
REQ table; this run implements it on branch `agent/ct54-entitlement-20261017`.

## Done

- DEC-0085 appended after DEC-0084. DEC-0086 is reserved (agent-sync key `ves-grant-context-20261017`) for CT-56,
  the grant-context decision, so the next free id is `DEC-0087`. CT-54 added after CT-53. `FAC-SEM-115` and `FAC-SEM-116`
  allocated after `FAC-SEM-114`; next free `FAC-SEM-117`.
- Schemas (REQ-01): `schemas/entitlement.schema.json` and `schemas/entitlement-key-set.schema.json`, closed, reusing
  `contextId`, `opaqueId` and `agentRef`; the subject's lines are enforced by the schema (`allOf` on `subject`).
- Code (REQ-02): `src/entitlement.ts`: `verifyEntitlementKeySet` (EK-1…EK-7), `verifyEntitlement` (EN-1…EN-13, the
  brief's refusal order), the two signing inputs, the constants (`MAX_ENTITLEMENT_SECONDS` 38 days, `REFRESH_SECONDS`
  7 days, `GRACE_SECONDS` 14 days, `CLOCK_SKEW_SECONDS` 60 s); both answer and never throw.
- Register (REQ-03): `entitlement/1` and `entitlement-key-set/1`, `signer: "key"`, after DEC-0084's `enroll-token/1` and
  `enroll-join/1`; the two statements in `fixtures/vectors/signing-challenges.json`.
- Rules (REQ-04): `FAC-SEM-115` (`entitlement`), `FAC-SEM-116` (`entitlement-key-set`), wired in
  `src/semantic-rules.ts`, 23 semantic fixtures, the tolerance kinds and members, the positive sweep.
- Vectors (REQ-05): `fixtures/vectors/entitlement.json`, written by `tools/vectors/entitlement.ts --write` from labelled
  test seeds (the expected values written by hand, nothing imported from `src/entitlement.ts`); 26 key-set cases and 69
  entitlement cases covering the brief's whole matrix; `test/entitlement.test.ts` checks the file equals the generator's
  output and runs every case, in three time zones.
- The standing instruction (REQ-06): every accepted vector validates against both schemas; 66 re-signed entitlement
  mutations, six signature mutations, 27 key-set mutations and every negative fixture are refused by the schema and by
  the verifier with the named problem.
- Docs (REQ-07): `docs/specification/entitlement.md`; conformance.md (register rows, canonical forms, the verifier's
  and the issuer's rows, the rule rows); CONTEXT (Entitlement, Entitlement key set), README, DOCMAP, the coverage
  baseline. No new external specification: RFC 8032 and RFC 8785 were already in the source ledger.
- Plants (REQ-08): 140, all killed; nine survivors of the first full pass were closed (three redundant clauses removed,
  six closed with tests); the fix round added 9 more, all killed:
  [`plants.md`](../evidence/specs/2026-10-17-entitlement/plants.md).
- The fix round of 2026-10-18 (three blind readings: unit, seam, product): a missing `licence`, `hosting` or
  `support` no longer throws; the life is 38 days (the owner's decision); times carry at most three fraction digits;
  a key set holds a key valid at its `issuedAt`; `no-clock` comes before the rest of the context; the issuer's and the
  verifier's duties are stated (entitlement.md, conformance.md, CT-54, the schema); `licence.members` is the allowance,
  not the billable count; tests prove the shape checks agree with the schemas and loop the 14 small-order encodings.
- OQ-0012 and CT-55 (jobs and capabilities under limits and uncertain effects, from an agent retrospective of
  2026-10-17), recorded by the owner session on this branch; OQ-0012 now names no private agent.
- Merged `origin/main` at `1531f21` (DEC-0084) and kept both sides of every list.
- The brief named the first organization server's private product name twice; both replaced (the privacy check
  refused them).

## Decisions

All in DEC-0085. Choices the brief left open, recorded there under *Choices made in implementation*: an inverted time
order is `too-long-lived`; a set signed under another root's kid is `wrong-issuer`; `issuedAt`'s skew is implied by
`issuedAt` ≤ `notBefore`; a verifier for an organization takes no `estate`, one for `personal` requires it; a key set
handed as applied must be well formed and under `EdDSA`; kids are opaque ids, 1 to 32 keys, up to 256 revoked kids;
an unreadable clock is `no-clock` even beside an invalid context; more than three fraction digits is malformed; a key
set with no key valid at its `issuedAt` is `malformed` (EK-2) and `context-invalid` when handed as applied (EN-1). The
owner's fix-round decisions are in item 5 (38 days) and item 6 (the issuer's and the verifier's duties).

## Open

- Consumers adopt at their next pin (CT-54): the PassionCode platform issues (root offline, signing keys online,
  issuance at least 7 days before expiry, a new revision per entitlement, re-issue after a revocation, one order per
  subject, never an amount); the first organization server verifies (pins the root, stores the key-set revision and
  digest, the `held` record and the document per subject, re-verifies after every key set and daily, runs
  `fixtures/vectors/entitlement.json`); a personal cloud verifies with the subject `personal` and its estate.
- CT-56, the grant-context decision, under the reserved DEC-0086.
- Not decided: member-period metering, per-agent usage (stays `grant.usage`), order storage and how the root stays
  offline, the transport and delivery order of entitlements and key sets, what a lapse disables.

## Checks run

The full gate, `pnpm run check`, exit 0, on commit `b2a9131` (the fix round; the commit after it changes only this
handoff and the coverage baseline's text, and the gate ran again on it, exit 0):

- `tsc --noEmit` exit 0;
- `vitest run --coverage` exit 0: 74 files, 5195 tests passed; statements 99.51 % (6934/6968), branches 98.97 %
  (7025/7098); every per-file floor met, `src/entitlement.ts` at 100 (286/286);
- `docs/ux/lint.py` exit 0: 25 stories, 20 flows, 23 screens, 30 scenarios;
- `src/docs-check.ts` exit 0; `src/lint-md.ts` exit 0, 0 errors; `src/privacy-check.ts` exit 0, 0 findings;
- plants: 149 in all against `test/entitlement.test.ts`, each failing at least one test.

## Next task

Open the pull request for `agent/ct54-entitlement-20261017` (the owner session pushes), have it read by an independent
verifier, merge it, then post the merge to the platform's PLAT-020 thread on the project board so the issuer and the
first organization server pin it.
