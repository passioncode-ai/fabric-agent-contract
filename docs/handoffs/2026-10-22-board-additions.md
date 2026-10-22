# 2026-10-22: the board as Fabric 0.3.9 serves it, and a typed reaction (DEC-0098; CT-81)

## Objective

CT-81 of the [iteration's plan](../evidence/plans/2026-10-22-next-iteration.md): carry into the contract what Fabric
0.3.9 already serves on the board (thread `a5969ac5`), so a pinned reader stops misreading `answered` and
`noResponder`, and add the typed reaction on a reply to an announcement (thread `c430513b`).

## Done

- **DEC-0098** in `docs/specification/project-comms.md`: `answered` (from `queued`, left only by the requester's
  cancel), a seven-day default deadline, `noResponder` in the requester's receipt, `com.list` `unread` and `since` with
  `read`, bulk `com.read_ack` (`comms-read-ack.schema.json`), a host's 503 wait (`comms-host-wait.schema.json`), and
  `reaction` on a reply to an announcement.
- Every shape read from Fabric `origin/main` `297d95ba` (the zod schemas in `boardService.ts`, the migration
  `20261021000120_board_core_holds.sql`, `hubStandby.ts`), not from the announcement's prose.
- `FAC-SEM-027`'s table gains `answer` and `answered` → `cancelled`, with a test that `answered` leaves only by cancel.
- 22 fixtures, a mutant per new refusal killed by its fixture, the schema count 111.

## Open

- CT-81's adoption: Fabric serves `reaction` and repins; the adapter's kits read the new members.
- CT-82 next in the plan's order (`org-cloud`, by 2026-10-26).

## Checks actually run

`pnpm run check` exit 0: typecheck, 93 test files with 7 808 tests under coverage, UX lint, docs check (0 errors),
markdownlint, privacy check (0 findings). The first full run failed two tests by design: the capability-name surfaces
list gained `noResponder.capability` (it references the shared definition) and `comms-read-ack`'s one-message branch
must be closed in place, not by `$ref`; both fixed.

## Next task

CT-82: the `org-cloud` enrollment token role and `custody: processor-hosted` for `peer` (A-3, thread `348467e5`).
