# Handoff — CT-40, part two: a usage report's costs by project add up (2026-10-13)

## Objective

`FAC-SEM-025` checked that `byProject`'s calls fit inside the days' calls and a project's task runs inside the
project, but not the costs: a report could attribute more money to its projects than it spent (CT-40).

## Done

- `src/usage-rules.ts` `usageProjects`: the known costs add up as the calls do. A project costs at least its task runs
  when its own cost is known (a `null` project cost is judged by the unknown-cost rule, not compared). All projects
  together cost no more than the days. A `null` cost counts as none on either side, within the rounding the day's
  cost check allows, so rows are written unrounded. A project also holds at least its task runs' priced calls, so a
  `null` project cannot hide priced runs. Every row counts in the sum; a project named twice is refused by the normal
  form of `projectId` (DEC-0076).
- Tests in `test/usage-rules.test.ts`:
  - the rounding boundary on both sums, with exact messages;
  - an unknown cost on either side;
  - two spellings of one project in the cost sum;
  - priced calls of the runs against the project, and a negative cost not compared twice.
- service.md (the `byProject` paragraph and the `FAC-SEM-025` row) updated, DEC-0065 annotated, and CT-40 marked done.

## Open

Nothing for CT-40. The program items (N13, N16, N20) wait on their outside events; consumer rows track adoption.

## Checks run

See the pull request: the full gate and the plants.

## Next task

The board's open rows by priority: the consumer adoption rows (CT-03, CT-18, CT-20, CT-21, CT-41, CT-42, CT-50) are
each their owner's; the contract's own next item is CT-43 (a semantic rule for a `com.directory` page), then the
program as its blockers clear.
