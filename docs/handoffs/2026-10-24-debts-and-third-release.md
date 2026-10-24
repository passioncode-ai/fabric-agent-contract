# 2026-10-24: the contract's own debts, DEC-0120, and `v0.1.0+2026-10-24.2`

## Objective

Close the open backlog rows the contract owns that need neither another product's release nor an operator decision,
and release the result (DEC-0108: a second release the same day is `.2`).

## Done

- **CT-104**, closed by **DEC-0120**: the pin stays closed; `adapter` and `kit` are not pin members. The row's premise
  was wrong: the adapter's lock writer (`adapt_project.py`) emits only the pin's members, and one consumer wrote both
  members by hand on 2026-10-12. `pin:check` keeps printing them as a note; versioning.md and `src/pin-check.ts` say so.
- **CT-96**: `fixtures/vectors/repair-decision.json` (49 cases, Ed25519 from a fixed seed, answers written from
  node-summary.md) by `tools/vectors/repair-decision.ts`, checked against `repairDecision` in `test/node-summary.test.ts`.
- **CT-74**: connections vectors (tab and no-break space before a slashed secret, a 40-character `NAME=value` line, a
  bare Notion id), connections.md reads "space" as any whitespace, the mixed-actor delegation test asserts `ok` and the
  chain together. `pin:check`'s part was already in place.
- **CT-72**: the growth helper's slack scales with the small run; a planted quadratic copy fails three of three runs.
- **CT-100**: the test gaps pinned, each new test failing under its mutation; no defect found.
- **CT-101**: eight CONTEXT.md glossary entries for DEC-0098 to DEC-0102.
- **CT-109**: the three home-path rules' scopes stated in code and specification; a test pins the `sourceKey` pattern
  against `hasHomePath`. No rule's behaviour changed.
- **CT-123** filed: the trim-slashes test's "origins" half measures nothing.
- **The third release** `v0.1.0+2026-10-24.2`: annotated tag on `de8cec30` (merge of #180, the tree the gate passed
  on: 8 681 tests, 19 vector files), [GitHub release](https://github.com/passioncode-ai/fabric-agent-contract/releases/tag/v0.1.0%2B2026-10-24.2).
  Nothing narrows, so no consumer has to re-pin for it.

## Decisions taken here

- DEC-0120 (above): the reversible choice; admitting the members later is a widening.
- CT-109 changes no boundary: making FAC-SEM-103 reuse `hasHomePath` would narrow what a proposal may carry and needs a
  decision of its own.

## Open

- Adoption rows as in the [previous handoff](2026-10-24-audit-and-release.md#open) (CT-110, CT-113, CT-115 to CT-117).
- Contract: CT-122 (CX-CON-06, by 2026-11-06, scoped in #179), CT-92's second half, CT-120's rest, CT-75, CT-76 and
  CT-80's asymmetry (each needs a decision), CT-123.

## Checks actually run

`pnpm run check` and `pnpm vectors:check` on the branch of #180 (output in the pull request); each part's own gate run in its
worktree.

## Next task

CT-122: the contract's decision text for a `kid` and an `iss` per context (CX-CON-06), due 2026-11-06, from the brief
merged in #179.
