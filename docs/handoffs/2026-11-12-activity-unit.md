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

- Tell Project Observatory on thread `52aa2f93` when DEC-0164 lands (it codes `activity.unit.record` after it), with
  what its journal design (PR #511, `docs/design/ACTIVITY-JOURNAL.md`) diverges on: `acceptedAt` is the month key (J3
  files by the event's time); what a kit sends in the envelope when the capability is the collector (J2); a reopened
  unit's acceptance under a new `run.root` without a `started` before it (J2's accepted-twice); and its node's outbox,
  which mints a ULID and must derive a unit's id with `run` and `project`.
- Ask the assessment's owner on the board for the draft writer's mapping (`activity-event/0-draft`, in
  company-assessment-agent and the agents database's template): `urn:jira:KEY` evidence, `unit {system, key}`, no
  `org`, a named `agent`, and which writer holds `run.root` for an acceptance observed outside the run.
- The knowledge base's `knowledge/system/measure.md` still describes the draft (`org`, `accepted_by`): rewrite it to
  DEC-0164 in fabric-workspace when this lands, then the workspace sync.
- Landing note with DEC-0157 (`agent/ct216-usage-data-v2`): UD-6 describes activity telemetry as sessions sent by an
  enrolled device; whichever lands second restates it by kind and channel as activity's opening now does (check:
  `awk '/\*\*UD-6/,/\*\*UD-7/' docs/specification/usage-data.md | grep -c 'unit'` prints at least 1 on the merged tree).
- Operator questions, not decided here (to post on thread `52aa2f93` with the landing notice): a minimum cell for units
  served per project (a one-person project's count is that person's agents' output), the access-log scope a read of
  units is logged under, and the retention of a stored `acceptedBy` person subject; and which audience's pairwise
  subject a kit writes when one unit reaches both the organization's journal and Observatory's local one.
- CT-297: the route function for a unit and its vectors.
- Tell Observatory with the landing notice: a unit's `cost` is the spend since its previous transition, summed by a
  reader (its J4 sums every event, which now matches); a re-acceptance under a new `run.root` needs no `started` (its
  J2 accepted-twice keys by unit and `run.root`); the minimum cell of 3 for units.
- Landing with DEC-0162 and DEC-0166 (both add named protocols): `src/protocol-revisions.ts` keeps every entry and
  every `NAMED_ONLY` item (`activity-unit/1`, `levels/1`, `standing/1`), versioning.md every item, conformance every
  rule row (169 to 174) and the next free code from the CAS counter; `pnpm vitest run test/protocol-revisions.test.ts`
  and `pnpm run docs:check` on the merged tree.

## Checks run

- `pnpm run check` exit 0 on the first cut `79ed9a09` (11192 tests passed, 3 skipped; coverage floors, UX lint, docs check, privacy check) on the round-2 fold (11210 passed, 3 skipped) and on the round-3 fold (11212 passed, 3 skipped).

- Round 1, unit only (on `79ed9a09`): not clean. Breaks folded: the Event id rule kept one event per (`device.id`,
  `eventId`) against AE-2's one id from every writer; a `unit` event is now kept once per `eventId` within the
  organization's stream, and the `sourceKey` row names `unitSourceKey`'s form; DEC-0164's Alternatives name every
  departure from the design. Risks folded: four refused branches, an evidence URL with user information and the
  repeated write pinned in the vectors; the cost's `FAC-SEM-038` citations corrected; `acceptedAt` the month key; the
  kit's envelope (Observatory's capability is the collector); `unitEvent`'s place and the rule row's order.

- Round 2 (on `715bf939`): none clean. Breaks folded: AE-5 restated (an older reader refuses a `unit` with
  `evidence`; a collector sends only to a receiver listing `activity-unit/1`, a new named protocol), pinned by a test
  against the unknown-kind branch; a unit's route (contexts' fourth way, CT-297 for the function); the OTLP intake and
  the Batch acknowledgement keep a unit once per `eventId` within the organization; the kit's binding cited to
  Observatory's own answer, not DEC-0153; activity telemetry restated by kind and channel (activity's opening,
  CONTEXT.md, the spec index; DEC-0157 UD-6 by a landing note); DEC-0164's credential sentence; the CT-259 row and the
  rule register's next code; activity's header, `source` values and tests line. Risks folded: a leap second reads as
  :59 in the `acceptedAt` bound, and the 60 s boundary pinned; the schema's `source` const named in the rule; the
  home-path clause on evidence; the reader's month count in activity; unit fixtures in the catalogue; DOCMAP; the
  journal, node, draft writer, measure.md and operator questions in Open. Declined: refusing `@` in evidence (a URN
  may hold one; the writer's duty stands, as for any reference).

- Round 3 (on `a5edcd68`): unit clean. Seam and product, breaks folded: units are served only in cells of at least 3,
  as `result` (AE-3, the reader row); a collector holds a unit's transitions outside its stream until the receiver
  lists `activity-unit/1`, so nothing stalls; an OM-7 row for units; the batch receiver's row (one per `eventId`, no
  user, list `activity-unit/1`); Observatory's answers cited by their own threads; the OTLP intake names
  `FAC-SEM-171`, refused as `schema`; `cost` is per transition, summed (the vectors 0.12, 0.30, 0, 0, a test sums
  0.42). Risks folded: Observatory's older server refusing by purpose named in AE-5; a re-acceptance needs no
  `started`; CT-297 names the Project-to-organization source, the two-organization case and the id form; the evidence
  row names a repository named `home` (no vector: the privacy check refuses a home path in a fixture); the reader row's 64 characters; the kits' register; the merge
  markers; DOCMAP "proposed"; the canonical-forms row for `unitSourceKey`; activity's routing paragraph (four routes);
  the CT-259 row; a leap second on `occurred` read as its last millisecond, with a vector; the distinct-id assertion.
  Declined: none; the access-log scope and the metric's late acceptances stay operator questions in Open.

## Next task

Round 4 of the blind readings (unit, seam, product) of branch `agent/ct259-activity-unit-20261112` (DEC-0164).
