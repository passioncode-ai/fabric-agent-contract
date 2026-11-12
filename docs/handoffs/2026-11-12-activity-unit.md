# Handoff 2026-11-12: the unit of work as an activity event (CT-259, DEC-0164)

Branch `agent/ct259-activity-unit-20261112`, from main `d69dc363`. Entry point: [DEC-0164](../DECISIONS.md) and
[activity, `unit`](../specification/activity.md#kinds).

## Done

- `schemas/telemetry-event.schema.json`: `$defs/unit` and the kind (`run.root`, `project.id`, `source` `unit` and a
  `sourceKey` required; no `user`, no `session`; `outcome`, `acceptedBy`, `acceptedAt` and `taskClassMap` by transition
  and class).
- `src/activity-rules.ts`: `unitSourceKey` and `FAC-SEM-171` (receipt SEM-0171) on `telemetry-event` and `activity-batch`.
- `tools/vectors/activity-unit.ts`, `fixtures/vectors/activity-unit.json`, `test/activity-unit.test.ts`.
- Pages: activity (the envelope's kinds, `unit` with AE-1 to AE-5, the rule), conformance (a writer and a reader row,
  the code). DEC-0164; CT-259's row.

## Open

- Tell Project Observatory on thread `52aa2f93` when DEC-0164 lands (it codes `activity.unit.record` after it).

## Checks run

- `pnpm run check` exit 0 (11192 tests passed, 3 skipped; coverage floors, UX lint, docs check, privacy check).

- Round 1, unit only (on `79ed9a09`): not clean. Breaks folded: the Event id rule kept one event per (`device.id`,
  `eventId`) against AE-2's one id from every writer; a `unit` event is now kept once per `eventId` within the
  organization's stream, and the `sourceKey` row names `unitSourceKey`'s form; DEC-0164's Alternatives name every
  departure from the design. Risks folded: four refused branches, an evidence URL with user information and the
  repeated write pinned in the vectors; the cost's `FAC-SEM-038` citations corrected; `acceptedAt` the month key; the
  kit's envelope (Observatory's capability is the collector); `unitEvent`'s place and the rule row's order.

## Next task

Round 2 of the blind readings (unit, seam, product) of branch `agent/ct259-activity-unit-20261112` (DEC-0164).
