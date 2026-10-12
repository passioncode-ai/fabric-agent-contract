# Handoff — the session join key (DEC-0068, board run wave 6, P6-02; CON-OE-08)

## Objective

Close CON-OE-08 of node N12 ([packets](../evidence/specs/2026-10-11-board-waves/packets/wave-6/README.md)): one
session seen by several writers counts once.

## Done

- **DEC-0068**, reserved by git CAS; rule code **FAC-SEM-100** (receipt SEM-0100). Agreed with Project Observatory's
  session on 2026-10-12 (its node is the single writer; the collector side is in its program for CT-20).
- `src/session-join.ts`: `sessionJoinFindings` (kind `session-join`: one `collector.id` per session's counted events;
  no overlapping intervals) and `sessionTotals` (interval seconds by state, one usage line per `dedupeKey`).
- Schema: core kind `session.annotation` `{by, label, at}` in `telemetry-event.schema.json`, refusing start, end,
  tokens and cost.
- Spec: [activity → One writer per session](../specification/activity.md#one-writer-per-session); fixtures
  `fixtures/semantic/session-join-*` (three writers, an overlap, a second writer).

## Checks run

On the branch stacked on P6-01 (`384e386`): `tsc --noEmit` exit 0; full vitest and coverage, `session-join.ts` at
100 % branches; docs-check passed; markdownlint 0 errors; privacy 0 findings with `ORG_INDEX`. Plants: 10, each caught
(two survived first and got their own tests: start order and an unreadable interval).

## Open

- Merges after #70 and #71 (P6-01); registers rebased then, under this run's leases.
- **Next task:** P6-06, an app's own descriptor (Fabric CO-263): `lifecycle.manager: "person"`.
