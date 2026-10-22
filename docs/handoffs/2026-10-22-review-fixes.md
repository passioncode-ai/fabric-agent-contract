# 2026-10-22: the readings of DEC-0098 to DEC-0101 and their corrections (DEC-0102; CT-91 to CT-93)

## Objective

Read the four decisions merged on 2026-10-22 (`bfa9a67..4a29fcb`) blind, as the iteration's plan promised and the
merges skipped, and fix what the readings found before any consumer pins them.

## The readings

Three blind readings, run as background subagents with no edits:

| Tier | Verdict | Breaks | Risks | Other |
|---|---|---|---|---|
| unit | fail | 2 (a repair under a policy without `expiresAt`; `repairDecision` throws on a schema-valid request) | 6 | 12 of 30 plants survived the suite |
| seam | fail | 4 (a repair under a key past its window; repair and `FAC-SEM-068` disagree; the renewal grace judged by the device's clock; SR-5a refuses a withdrawal) | 9 | each reproduced at `4a29fcb` |
| product | fail | 7 (a context the routing rule forbids; contradictory resend duties; the policy key table; the enrollment steps; who controls a cloud VM; the glossary; the board's UX contract) | 8 | no em dash added |

## Second round (on this branch, before merge)

| Tier | Verdict | Breaks | Fixed here |
|---|---|---|---|
| seam | fail | 1: the mode-C narrowing went against the operator's recorded ADR-0011 | withdrawn; the whole harness, the operator's question on other contexts' services is CT-92 |
| product | fail | 8: a check-in's context in devices.md and CONTEXT.md; the key table's user layer; renewal called a rotation; no annotations on DEC-0098 to DEC-0101; a weekly probe DEC-0100 had refused; the org-cloud exception missing in conformance; two em dashes; `already-answered` missing from the table | each fixed; CT-93 filed for an org-cloud machine's usage |
| unit | fail | 1: the baseline's names kept the old shape, so a valid policy left no valid summary | the baseline takes the summary's name shape and per-kind fields; the walk is iterative; tests pin the key window at `at`, its own instants, `already-answered` first, the context as written, an mdm-only allowlist, org-cloud with a declined notice, renewal before the end, a long `noResponder.message` |

## Third round

Product: five breaks (DEC-0102's compatibility and fixture list; the baseline's per-kind fields in the prose; a
`collectionStart` trigger that never fires under device management, dropped; the round counts; this handoff's
checks), fixed. Unit and seam: see the pull request.

## Done

- **DEC-0102**: every break fixed and every decision the risks needed taken (its items 1 to 11); CT-91 filed for the
  check-in's own rule over a summary, CT-92 for the operator, CT-93 for an org-cloud machine's usage.
- A test for each break and each surviving plant: repair boundaries (exactly 7 days, `notifiedAt` at the instant, the
  policy's own expiry instant), the allowlist's digest, a key outside its window, a lasting policy, a user layer, a
  repeat, a lone surrogate, the strict reason; drift per kind and state order; a duplicate plugin; the person
  fixture's path; the renewal on the server's clock; an SR-5a withdrawal vector; fixtures `comms-read-ack-empty`,
  `comms-host-wait-not-retryable` with their plants, `activity-batch-ack-purpose`.
- The UX contract (FLW-16, SCR-19, SCN-025) carries `answered`, the reaction and `noResponder`.

## Open

- CT-91; **CT-92 needs the operator** (other contexts' services in a summary); CT-93; the adoption rows CT-81 to
  CT-83 and CT-88.
- CT-84 next in the plan's order (S4, by 2026-10-31), read blind before it merges.

## Checks actually run

`pnpm run check` exit 0: typecheck, 94 test files with 7 928 tests under coverage, UX lint, docs check (0 errors),
markdownlint, privacy check (0 findings). Earlier runs failed on two test-typing errors and the rule register's kind
list for `FAC-SEM-128`; both fixed. A second round of three blind readings runs on this branch before it merges.

## Next task

CT-84 (thread `ba63565c` items 1 to 3; Fabric's CO-376).
