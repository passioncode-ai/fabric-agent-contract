# 2026-10-26: the machines' report, its readings' loose ends settled

## Objective

Close CT-161, DEC-0132's non-blocking findings. Settle what text, code or a vector can settle. Move each design
question to CT-172.

## Done

- **DEC-0139** (this branch, `agent/ct161-dec0132-findings-20261026`).
  - `acceptMachineReport` is now the hub's reading in two cases: after `openMachineReport`, and of its own node's
    `machine.report`.
    - It answers `malformed` for a `FAC-SEM-152` finding or for an `at` that `strictTime` cannot read.
    - Otherwise it answers `wrong-machine` or `stale`.
    - `openMachineReport` refuses that unreadable `at` too.
  - Vectors: an off-curve `enc`, a leap second, an unreadable `at` from another machine, a space for `T`, and the
    `accept` group. No earlier vector's answer
    changes.
  - MR-2 to MR-4 and local-channel.md:
    - a send refused `unknown-recipient`, `mailbox-full` or `rate-limited` is dropped, and the next report replaces it;
    - a hub whose own `#kem` is unusable says so in its own health (its well-known `degraded` where it serves `fabric-service/0.1`);
    - any error answer to `machine.report`, or none before the hub's own deadline, means no report;
    - an unserved node method answers `unknown-method`;
    - `machine.report` stays inside the same-user trust boundary.
  - Smaller fixes:
    - the conformance rows;
    - CONTEXT;
    - three schema descriptions;
    - FLW-27 and SCN-038's wait for every machine's report;
    - devices.md;
    - the window-lease case names now say "written";
    - CT-122's stale name;
    - CT-152's adoption text.
  - CT-154 records the board answers: Fabric v0.3.13 (`7ef21793`) and the adapter's FAA-138 (`aa86a675`).
- **CT-161** is closed. **CT-172** holds the design questions, among them what a hub not yet on DEC-0132 does with a
  report (Fabric's answer is needed).

## Open

- Rounds 1 to 4 each failed on one tier; rounds 5 and 6 passed on all three (unit, seam, product), the finish line.
  Their non-blocking findings are CT-172 rows.

- Merged 2026-10-27 after DEC-0138 as #213 (`3830a335`), gate on the merged tree exit 0 (9676 tests); released
  `v0.1.0+2026-10-27.6`; Fabric's hub and Observatory's node told on thread `41a9b0cb` (CT-152). The merge with
  `origin/main` was resolved as planned below.
- Merge after DEC-0138 (PR #212). Merging `origin/main` in once #212 lands conflicts in `docs/DECISIONS.md` (DEC-0138
  before DEC-0139), `docs/backlog.md` (CT-169, CT-171, CT-172 in id order) and `docs/handoffs/README.md` (DEC-0139's row
  above DEC-0138's); then run the gate again.
- Ask Fabric on the board how its hub treats a verified relay body of an unknown payload type (CT-172).

## Checks actually run

- `pnpm typecheck`.
- vitest with coverage written to the session scratchpad.
- `pnpm ux:lint`, `pnpm docs:check`, `pnpm privacy:check`, `pnpm vectors:check`.
- No U+2014 in the added lines.

## Next task

Finish the readings, merge after #212, and release. Then tell CT-152's adopters on board thread `41a9b0cb`:
- Fabric's hub (CO-452) reads with `openMachineReport` then `acceptMachineReport`, its own node's `machine.report` with
  `acceptMachineReport`, and names an unusable `#kem` in its own health;
- every sender (Fabric's nodes, Project Observatory's OBS-253) drops a send refused `unknown-recipient`,
  `mailbox-full` or `rate-limited` for the next report (after `rate-limited`, not before its `retryAfter`), and may
  resend under the same `msgId` a send answered `internal` or never accepted;
- a local-channel node answers `unknown-method` for a `NODE_METHODS` method it does not serve.
- four window-lease vector cases were renamed from "received" to "written" (answers unchanged): a port that keys on
  case names must follow.
