# Handoff — CT-40, part one: the privacy check never passes unchecked (2026-10-13)

## Objective

The gate's privacy step skipped itself and exited 0 whenever org-index was not this checkout's sibling — always the case
from a linked worktree — so a gate run there could be green without the check having run (CT-40).

## Done

- `src/privacy-plan.ts` decides where the check runs, without touching the file system:
  - no denylist → skip (a contributor's machine, CI), as before;
  - `ORG_INDEX` set → that checkout's script, and a missing one fails;
  - otherwise the first script found beside this checkout or beside the main checkout of a linked worktree (the git common
    directory's parent);
  - with the denylist present and no script found → fail.
- `src/privacy-check.ts` reads the git common directory and runs the plan. AGENTS.md's command table says so.
- Tests: `test/privacy-plan.test.ts` (6), branch floor 100 in vitest.config.ts; 7 plants, each caught.
- Run from this worktree without `ORG_INDEX`: the check ran and reported 0 findings, where before it skipped. With
  `ORG_INDEX` pointing nowhere it exits 1.

## Open

- CT-40's second part: a usage report's `byProject` costs summed against the days. It edits `src/usage-rules.ts`, which
  CT-39 (identifier equality, in its own pull request) also edits, so it follows that merge.

## Checks run

See the pull request: the full gate with its numbers.

## Next task

After CT-39 merges: CT-40's `byProject` cost sum in `src/usage-rules.ts`, with vectors at the exact boundary.
