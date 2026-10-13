# Handoff — consumer receipts and the private server name (2026-10-13)

## Objective

Record what consumers shipped against the contract after DEC-0078. Close the board rows whose conditions have cleared.
Finish CT-49: the operator's decision that the first organization server's name is private across the organization.

## Done

- CT-49:
  - The name is gone from the default branch of fabric-inbox (#105 `05cddc9`), fabric-agent-adapter (#93 `79fc1af`),
    fabric-dashboards (#122 `d3d5fb6`) and Fabric (`a1de7f43`).
  - It joined the local private-terms denylist at 2026-10-13T06:12:47Z.
  - CT-49 was closed (#95), then reopened (#97). A sweep of all 14 public organization repositories found two that the
    watch had not covered: fabric-switchboard (#185, merged) and project-observatory-dashboard (#262).
- CT-18 and CT-42 (#96): adapter 0.28.0 (FAA-12b and FAA-40; PR #99 `96defa2`, release run 38345227934, npm 0.28.0,
  pinned to `f00a768`):
  - the board responder and hub client (DEC-0073);
  - work taken back only through `transferred` (DEC-0078);
  - the directory check `FAC-SEM-107` (DEC-0077).
- CT-42 stays open until the live Claude→Codex smoke runs. The adapter's handoff records it NOT_RUN.
- CT-41 (#96):
  - Fabric's COM-03 fix round landed its TypeScript half on main (`ac874946`).
  - Its SQL half (migration 88, the repin to `f00a768`, `transferred`) is held on `agent/com-w2-fixes-db` until its
    database tier runs (Fabric CO-287).
- CT-47 (#98): the workspace copy of this repository carries decisions through DEC-0078 (fabric-workspace `8cd81284`).
- fabric-workspace #197 (`65ceaa9b`, host run success): the roadmap's contract row reads through DEC-0078. The adapter
  row reads v0.29.0 and v0.28.0.

## Open

- CT-49: project-observatory-dashboard #262, which its owner merges. Then sweep every public organization repository
  (`gh repo list passioncode-ai --visibility public`; `git grep -iw` on each default branch). When the sweep reads 0,
  close the row.
- CT-44: agent-sync 1.22.2 still fetches every id register into one shared ref without `+`.
- CT-48: the projects vault is still diverged from its remote (51 ahead, 70 behind).
- Consumer rows (CT-03, CT-18, CT-19, CT-20, CT-21, CT-41, CT-42, CT-50) and the program (N13, N16, N20) wait on their
  owners or on outside events.

## Checks run

Before each merge, the gate ran at the branch head:

- `tsc --noEmit`: exit 0;
- vitest with coverage: 3534 tests passed;
- UX lint: passed;
- docs-check: passed;
- lint-md: 0 errors;
- privacy check: 0 findings, with the server's name on the denylist.

On fabric-workspace #197:

- `npm run check`: pass 159, fail 0;
- `check:backlog`: 0 errors;
- `check:releases`: 38 of 40 match. The two mismatches, Switchboard and Launcher, are their owners' rows.

## Next task

Close CT-49 once project-observatory-dashboard #262 merges and the full public sweep reads 0. After that, take the next
consumer row that an owner hands back.
