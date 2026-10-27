# 2026-10-27: a judge's calibration (CT-188, DEC-0144)

## Objective

Answer the board request `b05d8bc9` (thread `afd3dc71`): let a `support-quality-daily/1` producer say how well its
judge agreed with people, so a reader can tell a calibrated judge from an uncalibrated one.

## Done

- DEC-0144, [support quality](../specification/support-quality.md): the optional `calibration {week, labelled,
  helped}` and `calibrationChecks` members; `FAC-SEM-126` widened (the rubric and judge named once, the week a real ISO
  week that starts no later than `day`, `calibrationChecks` only beside `calibration`).
- `src/support-quality-rules.ts` (`isoWeekMonday`), `test/support-quality.test.ts`, one positive, two negative and two
  semantic fixtures; conformance's producer and reader rows; DEC-0095 annotated; CT-188 filed for adoption.
- Merged in #219 (`854fd71f`) after five rounds of blind readings, the last two clean; released
  `v0.1.0+2026-10-27.2`; the knowledge base's roadmap and products rows (fabric-workspace #505); the asker answered on
  thread `afd3dc71` with the tag and its two remaining steps.

## Open

- CT-188: the asker's reader reads a day without a block as uncalibrated, and the flat form only for days before the
  merge; each calibrating producer re-publishes its schema copy, then carries the members once every reader it knows
  of has adopted; a v2 producer maps as CT-188 says (CT-61).
- The schema's `calibration` description says "a week no later than day"; the rule means a week that starts no later
  than `day`. To correct at the schema's next change (noted in CT-188).

## Checks actually run

On the merged tree: `pnpm typecheck`, vitest with coverage (9393 tests), `pnpm ux:lint`, `pnpm docs:check`,
`pnpm privacy:check`, `pnpm vectors:check`, all exit 0; no U+2014 in the added lines.

## Next task

CT-178 (PR #218): readings until two clean rounds; merge; release; answer Observatory on thread `faa32585`.
