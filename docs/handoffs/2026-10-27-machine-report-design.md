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
  Replace a machine's key step 3 (a re-keyed hub keeps dividing; a re-key without the division is CT-199's), Remove a
  machine and Move the hub steps 3 and 4 (the person's notices, DEC-0146 item 6), contexts.md's linkability, SCN-030,
  SCN-048, ST-032, CONTEXT.md's "Revoking revision", the meter's duty on CT-20; `hub-move.json` gains three `move`
  cases by its generator.
- **An old-hub lease without `spent`:** a report at or above the revoking revision names `spent` on every lease a
  revoked hub key signed (MR-1, the schema description); one naming such a lease without it counts as no report for
  step 7's gate (DEC-0146 item 4, MR-5, ceremonies, window-lease Reporting, the conformance rows, CT-113); the
  reporter row says a whole-second `iat` with a millisecond `at` in that second is after it, and `machine-report.json` gains the `read` case of a
  whole-second `iat` with a millisecond `at`.
- **Round 14 (product):** CONTEXT.md's Local channel and the local-channel schema name the hub's `machine.report`;
  ST-032's wait and its notices match MR-6; MR-3 and item 9 show a pending signature as SCR-23's setup note; DEC-0107's
  annotation closes only the instances a removed machine left; OM-7 and SCR-31 say a placed instance can read the
  machine's estate records; SCR-23's "Remove" warning only for a machine that has not reported.
- **Round 15 (product):** ST-032, DEC-0146 item 6 and the drafter row warn before "Remove" only for a machine that
  has not reported the revoking revision, as SCR-23 does; FLW-27 gains revision 2's own failure exit and says a
  retired hub machine stays; FLW-20 says the same; SCN-030's one-machine re-key carries the re-issue notice.
- **Round 16 (product):** SCR-23's waiting state gains revision 2 unsigned after the switch with "Sign revision 2";
  FLW-27 returns from X2 to T2; ceremonies step 3 keeps asking; the spec index names Fabric's node for `machine.report`;
  the Consequences name FLW-20; SCR-23's notices carry the date; FLW-20 points to the during-move warning.
- **Round 16 (seam):** CT-113 names an old-hub lease ending at an instance's end (`periodOf` reads `[start, end)`);
  CT-152 names the whole-second `iat` pairing and leaves open which of two nodes on a hub machine answers
  `machine.report`; `acceptMachineReport`'s comment says a null answer keeps what the hub holds.
- **Round 17 (product):** the Consequences name relay Times and Messages, the `leaseId` row and the module and
  network-view rows; one condition for the re-issue notice (the machine holding the hub key) in SCR-23, SCN-030 and
  FLW-20; the revision-2 prompt in item 6, the drafter row and CT-113; FLW-20 traverses the setup note; CT-152 holds
  the waits before reporting nodes ship and the digest key's resend.
- **Round 17 (seam) and 18 (product):** Fabric's PL-12 cited for item 8; CT-152 owes Fabric's own node serving the
  local channel (asked in thread `5d2ea917`); SCN-038's way out names the hub's own machine; MR-6's reason qualified;
  ST-025 carries the re-issue notice; CT-152 holds Remove on a move's destination or on the old hub mid-move.
- **Round 18 (seam) and 19 (product):** Compatibility names `FAC-SEM-090`'s narrowing; FLW-27's revision 1 regains
  its "Nothing changed" exit; SCN-038 walks revision 2 unsigned; ceremonies' re-key step 3 and CT-113 carry the
  re-issue notice; CT-152 names payloads sent once to a node that drops unknown types.
- **Round 19 (seam):** Compatibility and Status name the hub's `project:`/`grant:` restriction, the meter's
  re-verification (with its first verification's context, so a spent-down remainder never ends a lease) and why no held
  pre-DEC-0146 report needs an `iat` guard.
- **Round 20 (product):** the action reads "Finish the move"; MR-6 and SCR-23 leave "lost" mid-move to CT-152; OM-7
  links devices' unlinkable enrollments; FLW-20's diagram gains its failure exit and both notices; FLW-26 moves the hub
  first.
- **Round 20 (seam):** Compatibility names the sub-millisecond stale change and Fabric's ceremony duties (CO-412).

## Checks run

The gate on the branch: `pnpm typecheck`, `pnpm vitest run --coverage`, `pnpm ux:lint`, `pnpm docs:check`,
`pnpm privacy:check`, `pnpm vectors:check` (results in the pull request).

## Open

- Project Observatory's confirmation that its node acknowledges a delivered message whose payload type it does not know
  (DEC-0146 item 8), asked in thread `41a9b0cb` (Fabric answered in its PL-12: no reader today, its 0.4.0 reader
  acknowledges and drops, CO-452).
- Fabric's row for its own node serving the local channel (`channel.hello`, `machine.report`) on a hub machine running
  only Fabric, asked in thread `5d2ea917` (Fabric's contract-delta record says it serves no node; CO-452 covers only the
  hub's reading).
- CT-152's open design items (super-ux and ceremonies): "Remove" on a planned move's destination machine, "lost" on the
  old hub's machine mid-move, whether MR-6's waits turn on only once the estate's node versions report, which of two
  nodes on a hub machine answers `machine.report`, the resend of payloads sent once.
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
