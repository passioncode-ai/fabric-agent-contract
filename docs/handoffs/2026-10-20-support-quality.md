# 2026-10-20: support quality per closed day (DEC-0095, CT-61)

## Objective

Issue #125: one payload for a support agent's daily quality, so any voice-of-the-customer reader reads any agent's feed.

## Done

- `schemas/support-quality-daily.schema.json` (`support-quality-daily/1`, in the revision register).
- `src/support-quality-rules.ts` (`FAC-SEM-126`), wired in `src/semantic-rules.ts`, at 100 % branches; one positive and
  three semantic and nine negative fixtures; `test/support-quality.test.ts`, which also carries the payload inside an
  events page.
- `docs/specification/support-quality.md`, two conformance rows and the register row, DEC-0095, DOCMAP, README,
  CONTEXT, backlog CT-61.

## Decisions

- The contract owns the shape; the thresholds, the rubric and the judge stay the standard's (the asker's).

## Checks

`pnpm run check` before the push, each step exiting 0.

## Next task

Readings, merge, then comment on issue #125 with the merge commit.
