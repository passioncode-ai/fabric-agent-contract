# Handoff: the machines' report, its open design questions decided (DEC-0146)

- **Date:** 2026-10-27
- **Branch:** `agent/ct172-dec0146-20261027`
- **Decision:** [DEC-0146](../DECISIONS.md) (CT-172)
- **Merge:** pending; objection window until 2026-10-29 18:00 UTC in threads `5d2ea917` (Fabric) and `41a9b0cb`
  (Project Observatory)

## Objective

Decide CT-172: the design questions DEC-0132's and DEC-0139's blind readings left open on the machines' report, and
fix the text and test items filed with them.

## Done

- **Decisions** ([relay](../specification/relay.md#the-machines-report) MR-1 to MR-6): the 64-lease cap while leases are
  `estate` only; the `#kem` of the newest revision a machine verified; newest per hub key; a lease of a revoked hub key
  ends at the revoking revision; from its first signature (the switch of a planned move) the new hub waits for every machine an
  estate record listed since the window instance began and counts old-hub leases at their final `spent`; a machine
  removed since the instance began that never reported keeps it closed until it ends; after a lost hub every instance the old hub divided stays closed until it ends; machines that do not report keep the waits, shown with the person's ways out (MR-6,
  SCR-23 waiting); the hub machine's node serves `machine.report`, Fabric's included; a recipient acknowledges a payload
  type it does not know; the unusable-`#kem` entry's form and its surface without a well-known.
- **Code:** `instantKey` (`src/rfc3339.ts`); in `src/machine-report.ts` the relay time for `at`, the nanosecond order,
  `notAfter`, `readMachineReport`, `FAC-SEM-154`; `nodeMethodAnswer` (`src/local-channel.ts`).
- **Vectors:** `machine-report.json` (more `open` and `accept` cases, a new group `read`; no earlier case changed), `window-lease.json` (`remainder`:
  reports in one millisecond, ties, a held legacy time, truncation), `local-channel.json` (new group `dispatch`); `machine-report.json` and `local-channel.json` are written by
  their generators, `window-lease.json`'s `remainder` cases by hand (no generator; `test/window-lease.test.ts` checks them).
- **Text:** the relay-only wording (revocation-delta.md, estate-record.md, devices.md, window-lease.md, the check-in
  schema, conformance rows, the source comments), MR-2's no-erase, MR-3's `msgId` exception, the schema description,
  `FAC-SEM-090`'s limit, devices.md's "what stays linkable", DEC-0139's consequences, SCR-23, SCN-038 and FLW-27,
  Replace a machine's key step 3 (a re-keyed hub keeps dividing).

## Checks run

The gate on the branch: `pnpm typecheck`, `pnpm vitest run --coverage`, `pnpm ux:lint`, `pnpm docs:check`,
`pnpm privacy:check`, `pnpm vectors:check` (results in the pull request).

## Open

- Fabric's confirmation that its hub acknowledges a delivered message whose payload type it does not know (DEC-0146
  item 8), asked in thread `5d2ea917`, and Project Observatory's for its node, asked in thread `41a9b0cb`.
- CT-195: whether the person may reopen a lost hub's windows before they end (the operator's decision).
- CT-196: where a run stopped for lack of a lease after a move tells the person why (super-ux).
- CT-197: `strictTime` and the raw `Date.parse` readers read a fraction of ten or more digits late.
- CT-199: a hub that re-keys without its lease division, and a hub certified after a period with none (undecided).
- CT-113 keeps the reference's order of leases across hub keys in `windowRemainder`.
- Adoption is CT-152's: Fabric's hub and nodes, Project Observatory's node.

## Next task

After the objection window (2026-10-29 18:00 UTC): read threads `5d2ea917` and `41a9b0cb` for objections; if none blocks, merge
`origin/main` into the branch, write the merge date into DEC-0146's Status, run the gate, merge the pull request with
`gh pr merge 230 --merge`, release the next free `v0.1.0+2026-10-29.N` on the merge commit, close CT-172 and post the tag
in `5d2ea917` and `41a9b0cb` (CT-152's adopters).
