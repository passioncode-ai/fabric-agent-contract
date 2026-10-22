# 2026-10-22: the contract's plan for the iteration (no decision; CT-81 to CT-86)

## Objective

The operator asked to read what the previous sessions did and left, check the current state, record what is open in
the project's plan, and carry that plan into fabric-workspace, where every PassionCode agent now reports its status
(fabric-workspace `docs/reports/2026-10-22-passioncode-status/`, PR #347).

## What the previous sessions left

- **Merged and closed:** the contract review (#137 `ec21af7`, #138 `40eb352`), DEC-0096 (#135), DEC-0089 to DEC-0095;
  every handoff in the [index](README.md) names its merge.
- **Unanswered on the board:** four asks addressed to the contract (threads `a5969ac5`, `c430513b`, `348467e5`,
  `ba63565c`), the roll call of 2026-10-21 (`1316a045`) and the status of 2026-10-22. fabric-workspace's plan carried
  the contract's row 10 as "not named yet", and the first organization server reported itself blocked on the contract.
- **Stale branches:** `agent/ct57-after-merge-20261020`, `agent/ct57-folder-attribution-20261019` and
  `agent/ct63-resolve-pending-20261019` on `origin` hold work that landed by #124 (squash), #128 and #133; nothing in
  them is missing from `main` (the CT-66 row, CT-26's note and DEC-0092 are on `main`). Left in place.

## Done

- [The iteration's plan](../evidence/plans/2026-10-22-next-iteration.md): every open ask, the row that answers it, the
  order by who is blocked, and the day each decision is merged.
- Backlog rows CT-81 (board additions and the typed reaction), CT-82 (A-3, `org-cloud`), CT-83 (`node-summary/1`
  and the repair action), CT-84 (S4), CT-85 (`agent.call` over the relay, A-6, A-7), CT-86 (S5, S6).
- DOCMAP names the plan; the backlog header links it.

## Open

- Each of CT-81 to CT-86 is one decision, taken in the plan's order through the task pipeline.
- The answers on the board threads and the status file in fabric-workspace follow this merge (they cite its commit).

## Checks actually run

`pnpm run check` exit 0 on this branch: typecheck, 93 test files with 7 732 tests under coverage, UX lint, docs check
(0 errors), markdownlint, privacy check (0 findings). The first run found five privacy findings (a private product's
name in the new rows); the rows now say "the first organization server", as the older rows do.

## Next task

CT-81: the board additions Fabric 0.3.9 serves and the typed reaction on a reply, one DEC, by 2026-10-24. Read Fabric's
ADR-0149 amendment and its board audit (BD-1, BD-3, BD-4) on thread `a5969ac5` first.
