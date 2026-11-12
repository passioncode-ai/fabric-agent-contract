# Handoff 2026-11-12: the context of a task (CT-292, DEC-0165)

Branch `agent/ct292-task-context-20261112`, from main `27085bc0`. Entry point: [DEC-0165](../DECISIONS.md) and
[contexts, the context of a task](../specification/contexts.md#the-context-of-a-task).

## Done

- `src/task-context.ts` (`resolveTaskContext`, `FAC-SEM-172`, receipt SEM-0172), kind `task-context`.
- `schemas/execution-context.schema.json` `context`; `schemas/session-handoff.schema.json` `taskContext`.
- `tools/vectors/task-context.ts`, `fixtures/vectors/task-context.json`, `test/task-context.test.ts`.
- Pages: contexts (TC-1 to TC-6, the rule), conformance (an agent row, a host row, the module, the code), CONTEXT.

## Open

- Landing note with DEC-0156 (`agent/ct220-operators-word-v2`), binding whichever lands second: OW-3 names TC-3 as a
  step that waits, and OW-3's no-person route is TC-4's. Check on the merged tree: `awk '/^- \*\*OW-3/,/^- \*\*OW-4/'
  docs/specification/governance-and-roles.md | grep -c 'TC-3'` prints at least 1.
- Tell the adapter (FAA-299) when DEC-0165 lands.

## Checks run

- `pnpm run check` exit 0 (11196 tests passed, 3 skipped; coverage floors, UX lint, docs check, privacy check).

## Next task

Round 1 of the blind readings (unit, seam, product) of branch `agent/ct292-task-context-20261112` (DEC-0165).
