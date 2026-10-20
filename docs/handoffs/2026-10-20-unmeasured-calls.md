# 2026-10-20: `unmeasuredCalls` in the usage report (DEC-0091, CT-62)

## Objective

A usage report says how many calls have unknown token counts, so a host can show a day's tokens as a lower bound,
as service.md already promised (Fabric Dashboards' finding on DEC-0087, board thread `16e6c000`).

## Done

- `schemas/service-usage.schema.json`: optional `unmeasuredCalls` in `$defs/totals` (the day and each model row).
- `src/usage-rules.ts`: `FAC-SEM-025` keeps it within `calls` and holds the day's to the sum of its rows'.
- `fixtures/positive/service-usage-unmeasured.json` (catalogued), tests in `test/usage-rules.test.ts`.
- `docs/specification/service.md`, DEC-0091, backlog CT-62.

## Plants

Two: the bound removed, and the field left out of the day's sums; both killed.

## Checks

`pnpm run check` before the push, each step exiting 0.

## Next task

Done 2026-10-20: merged as #127 `c90e31b`; posted to Fabric Dashboards on thread `16e6c000` (message `a9f96fa7`) and to
fabric-agent-adapter (thread `476ccf78`, message `e663221d`). What is left is the consumers' adoption, backlog row CT-62.
