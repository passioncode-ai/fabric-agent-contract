# P2-01 — one register of canonical forms

- **Node:** N06 · **Wave:** 2 · **Closes:** F-A-006, F-B-112, F-B-315 (receipts in
  [inventory.json](../../inventory.json)).

## Why

Three "canonical JSON" uses produce different bytes and no page tells them apart:

- the settings-backup form, `canonicalJson` in `src/settings-backup.ts` (DEC-0025). It is used for backup
  checksums, device-policy signatures (DEC-0031: "its canonical JSON") and activity ids (`src/activity-rules.ts:96`,
  `:106`);
- RFC 8785 (JCS), `jcs` in `src/delegation.ts:424`, used for approvals and the action digest (DEC-0039);
- DEC-0022's board idempotency digest, "canonical JSON" with the sorting order undefined, no reference function
  and no vector (F-A-006).

Two implementations of the same document can therefore disagree on a digest or a signature.

## What to build

1. **`src/canonical.ts`** (new): both reference functions, exported under unambiguous names.
   - `settingsCanonicalJson` is the settings-backup form, moved from `settings-backup.ts`. Keep a re-export there
     so existing imports keep working.
   - `rfc8785` is moved from `delegation.ts`, with the old export kept.

   Each function's comment states exactly what it does (key order, number form, string escaping, what it
   refuses). The register's table carries the same statement.
2. **A section in `docs/specification/conformance.md`, *Canonical forms***, under the lease. A table lists every
   signed or hashed document in the contract and the form that covers it:
   - settings backups, device policies and key sets, activity `eventId`/`sourceKey` → settings form;
   - approvals and the action digest → RFC 8785;
   - DEC-0022's idempotency digest → the form your decision picks (below);
   - anything else you find with `grep -rn "canonical" docs/specification src`.

   Close with a rule: a new document picks one of these two forms, never a third.
3. **One decision** (reserve a DEC id):
   - pin DEC-0022's digest to one named form;
   - state DEC-0031's "its canonical JSON" as the settings form;
   - state the two-form register.

   Pick the DEC-0022 form by reading `project-comms.md` and its consumers' code (Fabric's board, read-only via
   `git -C /Users/sshlg/DATA/fabric grep -n -i "idempotency" origin/main -- '*.ts'`). If a consumer already
   computes it, the decision follows the consumer and says so. *Compatibility*: additive if nobody computed it
   differently; otherwise name who must change.
4. **Shared vectors, `fixtures/vectors/canonical.json`.** For each form: inputs and expected outputs — RFC 8785's
   own examples (its Appendix B, with the RFC text pinned in the ledger), Unicode ordering and number cases, and
   one input where the two forms differ. A test runs both functions over them. These are the vectors the adapter's
   kit ports test against (ask (c), CT-18): say so in the handoff.

## Proof

- A test that the two forms give different bytes on the "differ" vector, and that each matches its own vectors.
- Plants: swap a key-ordering rule in each function and a vector fails; remove the DEC-0022 digest's use of the
  named form and its test fails.
- Raise the floors of the touched files in `vitest.config.ts` and `coverage-baseline.md`.

## Files you own

`src/canonical.ts`, `src/settings-backup.ts` and `src/delegation.ts` (the moved function plus a re-export only —
P2-03 owns the rest of `delegation.ts` after you), the DEC-0022 digest's code (find it), `fixtures/vectors/`,
`test/canonical.test.ts`, `docs/specification/conformance.md` (the new section; lease), `docs/DECISIONS.md` (your
decision; lease), `docs/evidence/sources.md` (an RFC 8785 Appendix B note if needed), one handoff
`docs/handoffs/2026-10-1x-canonical-forms.md`.
