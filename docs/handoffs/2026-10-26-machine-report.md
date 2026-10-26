# 2026-10-26: the machines' report (DEC-0132), the next task after CT-152

## Objective

Give the estate's records a carrier to the hub now that DEC-0128 UE-2 keeps them off organization check-ins (CT-152):
the applied revision, the heartbeat, the delta head and the leases with `spent`, for DL-15's key rotation, the hub
move's step 6 and the window lease's reporting.

## Done

- DEC-0132: [relay](../specification/relay.md#the-machines-report), MR-1 to MR-5.
  - **Document.** `machine-report/1` `{type, machine, at, records}`, the check-in's `records` names; each lease once
    (`FAC-SEM-152`).
  - **Carrier.** Sealed `fabric-machine-report/1` to the hub machine's `#kem` inside a relay message body; the relay
    reads none of it.
  - **Code.** `sealMachineReport`, `openMachineReport` (`src/machine-report.ts`); vectors
    `fixtures/vectors/machine-report.json` from `tools/vectors/machine-report.ts`.
- Every text that named CT-152 as the open carrier now names DEC-0132.
- CT-152 decided; adoption open.

## Checks actually run

- `pnpm run check` on the head after each round's fixes: 106 files, 9 282 tests (9 245 before DEC-0133's merge), UX lint, docs, markdownlint 0 errors, privacy 0; `pnpm vectors:check`: 24
  files match before DEC-0133's merge, 25 after.
- Blind readings, round 1 (head `14d59122`): unit pass; seam and product fail on two shared blockers: MR-2 sent a
  machine left on its parent after a hub move to the old hub only, so the new hub never saw the report step 6 waits
  for; and the window lease still timed a final `spent` by receipt while MR-5 used the report's `at`. Product also
  found MR-5's 24-hour rule taking back a credited refund. Fixed: MR-2 reports to every hub machine of the applied
  revision and of a newer refused one; every text and `LeaseReport.receivedAt` take the report's `at`; the 24-hour
  rule is gone.
- Round 2 (head `925587c4`): unit pass; product fail (a report named an expired lease once while the hub keeps only
  the newest report, so a final `spent` could be lost); seam fail (a report "after the revocation" judged by time,
  while a machine that refused the move's revision still reports to the new hub). Fixed: a report names every held
  lease and the newest expired lease of each slot until its window instance ends (whole state); "after the
  revocation" is the newest report's `estateRecord.revision` at or above the revoking revision, everywhere.
- Round 3 (head `7f0a4661`): unit and seam pass; product fail ("a machine that refused it never qualifies" against
  step 6's catch-up revision; FAC-SEM-090's row still said "received"; the spec index called the report adopted).
  Fixed: such a machine qualifies once it applies a later revision; the row says written; the index says owed.
- Round 4 (head `956ce65a`): unit and seam pass; product fail (the hub machine's own leases had no way to reach its
  hub, so step 7 could not finish). Fixed: the hub's own node gives the same report locally. Non-blocking findings of
  every round are CT-161.
- Round 5 (head `bdcb3111`): unit pass; seam and product fail (the local channel had no method for the hub's own
  report; CT-152's status read `unknown` in the workspace collector; window-lease.md still listed the report as not
  decided). Fixed: `machine.report` on the local channel, read with the same checks; CT-152 "open, adoption"; the
  window-lease bullet narrowed.
- Round 6 (head `26119b4e`): unit and seam pass; product fail (`machine.report` named as owed nowhere). Fixed: the
  spec index, CT-152 and DEC-0132's adoption line name it and its two adopters.
- Round 7 (head `c6573bec`): unit and seam fail (the owed note landed on the Fabric's button row of the spec index,
  not the local channel's). Fixed: only the local channel row carries it.

## Decisions

- **Sealed, not clear.** The relay's operator never reads what a machine spent.
- **Whole state, never deltas.** A lost or reordered report is harmless; `stale` refuses an older one.
- **Not a call.** A report has no answer, and a view machine reports too.

## Open

- Adoption by Fabric's nodes and hub and Project Observatory's node, `machine.report` included (CT-152).

## Next task

Merge after the readings, release, then the next row on the board.
