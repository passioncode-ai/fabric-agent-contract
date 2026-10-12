# Handoff — window leases and signing challenges (DEC-0062, DEC-0063, board run wave 4, P4-05)

## Objective

Close V4-WINDOW-LEASE and V4-SIGNING-CHALLENGE (node N18, packet
[P4-05](../evidence/specs/2026-10-11-board-waves/packets/wave-4/P4-05-leases-challenges.md)): `window-lease/1`, agreed
with Project Observatory's session as the meter's owner, and one register of passkey-signed statements with the
dedicated signing RP.

## Done

- **DEC-0062** (`window-lease/1`, [window lease](../specification/window-lease.md)): the document, the window instance as
  one `period` label, one lease per slot, the meter's smaller remainder and fail-closed expiry, `spent` in the check-in,
  `verifyWindowLease` (WL-1…WL-12), `windowRemainder`, `mayReserve`; rules `FAC-SEM-089`…`091`. The lease's hub-key check
  compares refs exactly and reads the revocation delta's applied entries (`estateRevocations`), as DL-14 does.
- **DEC-0063** ([signing](../specification/signing.md), the register in
  [conformance](../specification/conformance.md#signing-challenges)): `estate-revision/1` (unchanged), `org-countersign/1`,
  `share-grant/1`, `limits/1`; the signing RP `sign.<domain>`; `verifySigningAssertion`; rule `FAC-SEM-092`; an estate
  record's authority must be a signing credential (a tightening of DEC-0055; no record is deployed yet).
- Code `src/window-lease.ts`, `src/signing-challenges.ts`; schema `schemas/window-lease.schema.json`; vectors
  `fixtures/vectors/window-lease.json`, `fixtures/vectors/signing-challenges.json`; tests; README, CONTEXT, DOCMAP;
  board CT-04, CT-19, CT-20, CT-32.
- Ids by git CAS: DEC-0062, DEC-0063, `FAC-SEM-089`…`092` (keys in DEC-0062/0063 *Source*).

## How it was done

The developer agent wrote the specifications, schemas, code, fixtures and vectors and stopped at its weekly limit
before the decisions, registers and handoff. The owner session saved its work, merged `main` (the shared
`strictTime` replaced the agent's `rfc3339Time`; DEC-0060's exact matching and DEC-0054's delta revocations adopted in
the lease's hub-key check), wrote DEC-0062 and DEC-0063, the board rows and the indexes under its leases, and ran the
gate. Subagent readers were at their weekly limit: the owner's own review planted the delta-revocation check
(caught) and read the decisions against the specifications; no three-tier reading ran.

## Checks run

On the branch merged with `main` `335e736`: `tsc --noEmit` clean; `vitest run --coverage` 48 files, 2618 tests
passed, every floor met, whole set 4975 / 5133 branches (96.92 %); `python3 docs/ux/lint.py` passed; docs-check passed;
markdownlint 0 errors; privacy-check with `ORG_INDEX` 0 findings. Plant: removing the delta revocations from the lease's
hub-key check fails a test.

## Open

- A three-tier reading of DEC-0062 and DEC-0063 when subagent readers are available again (the wave-4 close records it).
- `org-authority/1` (administrators' signing credentials, organization windows); the shape of a limits document;
  `ES256` hub keys (D2).

## Next task

Close wave 4: closed.json receipts for N08, N09 and N18, the board's statuses, the canvas and the plan's close record,
then re-cut wave 5.
