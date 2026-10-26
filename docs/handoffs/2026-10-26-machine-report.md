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

- See the pull request for the gate and the blind readings on its head.

## Decisions

- **Sealed, not clear.** The relay's operator never reads what a machine spent.
- **Whole state, never deltas.** A lost or reordered report is harmless; `stale` refuses an older one.
- **Not a call.** A report has no answer, and a view machine reports too.

## Open

- Adoption by Fabric's nodes and hub and Project Observatory's node (CT-152).

## Next task

Merge after the readings, release, then the next row on the board.
