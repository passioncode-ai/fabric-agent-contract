# 2026-10-22: a node's summary and repairs (DEC-0101; CT-83, CT-90)

## Objective

CT-83 of the [iteration's plan](../evidence/plans/2026-10-22-next-iteration.md): `node-summary/1` with the harness
and its drift, and the repair action (thread `ba63565c` items 7 and 8; the operator's S7, S8, S10).

## Done

- **DEC-0101** and [node summary](../specification/node-summary.md): `node-summary/1` as a check-in record, the policy
  keys `harness.baseline` and `repair.packages`, `repair-request/1` in a check-in response, `repair-result/1`.
- `src/node-summary.ts`: `harnessDrift`, `versionBelow`, `repairDecision`; rules `FAC-SEM-128` (no person, path or
  credential; no duplicate; drift equals `harnessDrift` under the baseline's revision) and `FAC-SEM-129` (the node's
  repair decision).
- Fixtures: five semantic, four positive and six negative; `test/node-summary.test.ts` signs repair requests with a
  key it generates.
- CT-90 filed: the summary's own signature over the relay.

## Open

- CT-83's adoption (Project Observatory's node; the first organization server).
- CT-84 next in the plan's order (S4: directory, queue, load; by 2026-10-31).

## Checks actually run

`pnpm run check` exit 0: typecheck, 94 test files with 7 905 tests under coverage, UX lint, docs check (0 errors),
markdownlint, privacy check (0 findings). Earlier runs failed on a test helper's types, on the protocol register (the
three new types are revisions of their own, DEC-0067) and on two example home paths the privacy gate refuses; each was
fixed. Plants: the allowlist check and the `changed` state removed fail two tests; restored before the commit.

## Next task

CT-84 (thread `ba63565c` items 1 to 3; Fabric's CO-376).
