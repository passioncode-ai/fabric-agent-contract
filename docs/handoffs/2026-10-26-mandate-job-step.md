# 2026-10-26: a job's step under a mandate (CT-177, DEC-0141)

## Objective

Answer the adapter's question (`46433e3a`, thread `aa86a675`): under which capability a mandate is read when it
answers a job's input request, and add a vector for it.

## Done

- DEC-0141, [delegation](../specification/delegation.md#the-operators-mandate) MJ-1: the job's own capability, the
  request key as the action, the job's effect; `fabric.job.get` in a mandate covers no other job's step.
- `actionDecision` takes `mandateCapability` for a job's input request; without it the service's fault
  `mandate-capability-missing` (`src/actions.ts`).
- `fixtures/vectors/actions.json` gains `jobSteps` (12 cases, written by `tools/vectors/actions.ts`), run by
  `test/actions.test.ts`.
- AP-2 (`service.md`), C3.3 (`interop.md`) and the callee row in `conformance.md` name it; DEC-0125 annotated.
- CT-178 filed for Project Observatory's three asks (request `c50f590b`), acknowledged on the board.

## Open

- Reply on thread `aa86a675` with the DEC id and the release tag once merged. At its repin the adapter adopts two
  deltas the readings measured on kit 0.52.0 (the fault without `mandateCapability`; an ordinary action reads its own
  tool) and vendors the `jobSteps` group.
- CT-178: answer Observatory by 2026-11-04.

## Checks actually run

`pnpm typecheck`, vitest with coverage written to the session scratchpad, `pnpm ux:lint`, `pnpm docs:check`,
`pnpm privacy:check`, `pnpm vectors:check`, no U+2014 in the added lines.

## Next task

Readings until two clean rounds; merge; release; answer the adapter on thread `aa86a675`.
