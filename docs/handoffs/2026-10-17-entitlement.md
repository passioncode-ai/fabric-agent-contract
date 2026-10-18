# Handoff: DEC-0085, entitlements for the organization offer (2026-10-17)

## Objective

The PassionCode platform asked the contract (its PLAT-020, on the project board, 2026-10-17) for a signed record of
what an order entitles an organization or a person's estate to, verified offline by the first organization server and
a personal cloud. The brief, [`brief.md`](../evidence/specs/2026-10-17-entitlement/brief.md), fixed the decisions and the
REQ table; this run implements it on branch `agent/ct54-entitlement-20261017`.

## Done

- DEC-0085 appended after DEC-0084; next free `DEC-0086`. CT-54 added after CT-53. `FAC-SEM-115` and `FAC-SEM-116`
  allocated after `FAC-SEM-114`; next free `FAC-SEM-117`.
- Schemas (REQ-01): `schemas/entitlement.schema.json` and `schemas/entitlement-key-set.schema.json`, closed, reusing
  `contextId`, `opaqueId` and `agentRef`; the subject's lines are enforced by the schema (`allOf` on `subject`).
- Code (REQ-02): `src/entitlement.ts`: `verifyEntitlementKeySet` (EK-1…EK-7), `verifyEntitlement` (EN-1…EN-13, the
  brief's refusal order), the two signing inputs, the constants (`MAX_ENTITLEMENT_SECONDS` 35 days, `REFRESH_SECONDS`
  7 days, `GRACE_SECONDS` 14 days, `CLOCK_SKEW_SECONDS` 60 s); both answer and never throw.
- Register (REQ-03): `entitlement/1` and `entitlement-key-set/1`, `signer: "key"`, after DEC-0084's `enroll-token/1` and
  `enroll-join/1`; the two statements in `fixtures/vectors/signing-challenges.json`.
- Rules (REQ-04): `FAC-SEM-115` (`entitlement`), `FAC-SEM-116` (`entitlement-key-set`), wired in
  `src/semantic-rules.ts`, 21 semantic fixtures, the tolerance kinds and members, the positive sweep.
- Vectors (REQ-05): `fixtures/vectors/entitlement.json`, written by `tools/vectors/entitlement.ts --write` from labelled
  test seeds (the expected values written by hand, nothing imported from `src/entitlement.ts`); 24 key-set cases and 64
  entitlement cases covering the brief's whole matrix; `test/entitlement.test.ts` checks the file equals the generator's
  output and runs every case, in three time zones.
- The standing instruction (REQ-06): every accepted vector validates against both schemas; 61 re-signed entitlement
  mutations, six signature mutations, 25 key-set mutations and every negative fixture are refused by the schema and by
  the verifier with the named problem.
- Docs (REQ-07): `docs/specification/entitlement.md`; conformance.md (register rows, canonical forms, the verifier's
  and the issuer's rows, the rule rows); CONTEXT (Entitlement, Entitlement key set), README, DOCMAP, the coverage
  baseline. No new external specification: RFC 8032 and RFC 8785 were already in the source ledger.
- Plants (REQ-08): 140, all killed; nine survivors of the first full pass were closed (three redundant clauses removed,
  six closed with tests): [`plants.md`](../evidence/specs/2026-10-17-entitlement/plants.md).
- Merged `origin/main` at `1531f21` (DEC-0084) and kept both sides of every list.
- The brief named the first organization server's private product name twice; both replaced (the privacy check
  refused them).

## Decisions

All in DEC-0085. Choices the brief left open, recorded there under *Choices made in implementation*: an inverted time
order is `too-long-lived`; a set signed under another root's kid is `wrong-issuer`; `issuedAt`'s skew is implied by
`issuedAt` ≤ `notBefore`; a verifier for an organization takes no `estate`, one for `personal` requires it; a key set
handed as applied must be well formed and under `EdDSA`; kids are opaque ids, 1 to 32 keys, up to 256 revoked kids.

## Open

- Consumers adopt at their next pin (CT-54): the PassionCode platform issues (root offline, signing keys online,
  issuance at least 7 days before expiry, never an amount); the first organization server verifies (pins the root,
  stores the key-set revision and digest and the `held` record per subject, runs `fixtures/vectors/entitlement.json`);
  a personal cloud verifies with the subject `personal` and its estate.
- Not decided: member-period metering, per-agent usage (stays `grant.usage`), order storage, the root's hardware
  ceremony, what a lapse disables.

## Checks run

The full gate, `pnpm run check`, on the branch head merged with `origin/main` `1531f21`; its output is in the run's
report and in the pull request.

## Next task

Open the pull request for `agent/ct54-entitlement-20261017` (the owner session pushes), have it read by an independent
verifier, merge it, then post the merge to the platform's PLAT-020 thread on the project board so the issuer and the
first organization server pin it.
