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

- `pnpm run check`: 106 files, 9 245 tests, UX lint, docs, markdownlint 0 errors, privacy 0; `pnpm vectors:check`: 24
  files match.
- Blind readings, round 1 (head `14d59122`): unit pass; seam and product fail on two shared blockers: MR-2 sent a
  machine left on its parent after a hub move to the old hub only, so the new hub never saw the report step 6 waits
  for; and the window lease still timed a final `spent` by receipt while MR-5 used the report's `at`. Product also
  found MR-5's 24-hour rule taking back a credited refund. Fixed: MR-2 reports to every hub machine of the applied
  revision and of a newer refused one; every text and `LeaseReport.receivedAt` take the report's `at`; the 24-hour
  rule is gone.

## Decisions

- **Sealed, not clear.** The relay's operator never reads what a machine spent.
- **Whole state, never deltas.** A lost or reordered report is harmless; `stale` refuses an older one.
- **Not a call.** A report has no answer, and a view machine reports too.

## Open

- Adoption by Fabric's nodes and hub and Project Observatory's node (CT-152).

## Next task

Merge after the readings, release, then the next row on the board.
