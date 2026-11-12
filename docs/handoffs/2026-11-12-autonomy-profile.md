# Handoff 2026-11-12: a place's autonomy profile (CT-285, DEC-0166)

Entry point for the next agent on CT-285. Branch `agent/ct285-autonomy-profile-20261112`, stacked on DEC-0162's branch
`agent/ct250-levels-20261112` (it reads DEC-0162's levels and lands after it).

## Objective

Turn [the autonomy profile design](../evidence/plans/2026-11-12-ct285-autonomy-profile.md) into DEC-0166 by the
organization slice of 2026-11-21: a place's profile as a standing `mandate/1` its hub states for each assignment.

## Done

- DEC-0166 proposed in `docs/DECISIONS.md`; [delegation](../specification/delegation.md#a-places-standing-mandate-dec-0166)
  AU-1 to AU-7, MD-5 amended, the `prof` claim row, `FAC-SEM-050`, `FAC-SEM-144`, `FAC-SEM-173`.
- Schemas: `mandate.schema.json` `standing`, `delegation-token.schema.json` `prof`, `service-actions-extension.schema.json`
  `standing`. Code: `mandateCovers` and `profileDigest` (`src/mandate.ts`), `actionDecision`'s `standing` and
  `tokenProf` (`src/actions.ts`), `prof` in `src/delegation.ts` and `src/delegation-rules.ts`, `standing/1` in
  `src/protocol-revisions.ts`.
- Vectors `fixtures/vectors/profile.json` (`tools/vectors/profile.ts`), `test/profile.test.ts`, the `prof` test in
  `test/meter-grant.test.ts`; conformance rows (a service reading a standing mandate, a hub holding a profile), the
  module row and the register; `service.md`'s `actionDecision` table; interop C3.5; `versioning.md`; CONTEXT.md
  (Autonomy profile); backlog CT-285.

## Decisions

- The design's `profile-stale` and `profile-unwatched` are the hub's states, not callee refusals: a callee cannot know
  the hub's latest revision or its watcher (DEC-0166 Alternatives).
- `prof` is the digest of the mandate without its chain; it covers `standing.revision`, so no separate revision claim.
- Operator question 4 added: an organization's headless place takes the default only once its owner or an
  administrator records it.

## Open

- Rebase on DEC-0162's branch after each of its folds (round 3 runs now); land after DEC-0162.
- The operator's four questions: post them with their defaults and 2026-11-21 on thread `8da128cf` (beside DEC-0162's).
- Tell Fabric (CO-547) and the adapter (FAA-249) when DEC-0166 lands.

## Checks run

- `pnpm run check` exit 0 on the first cut (11294 tests passed, 3 skipped; coverage floors met; UX lint, docs check with 0 markdownlint errors, privacy check 0 findings).

## Next task

Round 1 of the blind readings (unit, seam, product) of branch `agent/ct285-autonomy-profile-20261112` (DEC-0166).
