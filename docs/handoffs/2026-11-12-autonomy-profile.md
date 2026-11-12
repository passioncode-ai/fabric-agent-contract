# Handoff 2026-11-12: a place's autonomy profile (CT-285, DEC-0166)

Entry point for the next agent on CT-285. Branch `agent/ct285-autonomy-profile-20261112`, stacked on DEC-0162's branch
`agent/ct250-levels-20261112` (it reads DEC-0162's levels and lands after it).

## Objective

Turn [the autonomy profile design](../evidence/plans/2026-11-12-ct285-autonomy-profile.md) into DEC-0166 by the
organization slice of 2026-11-21: a place's profile as a standing `mandate/1` its hub states for each assignment.

## Done

- DEC-0166 proposed in `docs/DECISIONS.md`; [delegation](../specification/delegation.md#a-places-standing-mandate-dec-0166)
  AU-1 to AU-7, MD-5 amended, the `prof` claim row, `FAC-SEM-050`, `FAC-SEM-144`, `FAC-SEM-173`.
- Schemas: `mandate.schema.json` `standing`, `delegation-token.schema.json` `prof`, `service-authority-extension.schema.json`
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

- Merge DEC-0162's head after each of its folds (round 6 merged at `30fe601c`; round 8 next on its branch), never a
  rebase; land after DEC-0162. At that merge `schemas/mandate.schema.json`'s description keeps both clauses: `grep -c
  'never travels over the board' schemas/mandate.schema.json` prints 1 and `grep -c 'standing mandate its token binds
  by prof' schemas/mandate.schema.json` prints 1.
- The operator's five questions: post them with their defaults and 2026-11-21 on thread `8da128cf` (beside DEC-0162's);
  the board answered HTTP 503 through 2026-11-12.
- Restatements owed by whichever lands second (the CT-285 row names them): DEC-0156 OW-3 (a profile is a standing
  mandate the hub states, not a session's own rule), DEC-0158 OS-2, OS-6 and OS-7 (a dispatched run on a headless place
  carries the place's standing mandate), DEC-0159 CF-3 and CF-4 (a client key carries no profile), and DEC-0157 UD-4
  (a profile is not a person's word for a usage switch that person turned off; the standing conformance row gains that
  bar once UD-4 lands).
- The rule register lists `FAC-SEM-173` while 171 and 172 belong to DEC-0164 and DEC-0165 on their branches; the
  last lander writes the next free code from the CAS counter.
- Tell Fabric (CO-547) and the adapter (FAA-249) when DEC-0166 lands.

## Checks run

- `pnpm run check` exit 0 on the first cut (11294 tests passed, 3 skipped), and after the merge of DEC-0162 round 3 with `standing` moved to the authority extension (11301 passed, 3 skipped; coverage floors met; UX lint, docs check with 0 markdownlint errors, privacy check 0 findings).
- Merged DEC-0162's round-6 head `30fe601c` (conflicts in the authority schema's title and description, `src/actions.ts`'s
  imports, `src/mandate.ts`'s `levels-invalid` fault beside `standing-not-read`, conformance's actions and mandate rows,
  the handoffs index; each resolved keeping both sides): `pnpm run check` exit 0 (11305 passed, 3 skipped), 34 vector
  files match their generators.
- Round 1 (on `9e56bbd2`): none clean. Unit and seam, breaks folded: `profileDigest` is RFC 8785 (a fractional ceiling
  threw in the settings form), a lone surrogate answered `mandate-malformed`; from T2 every standing mandate needs
  `prof`, a level holder's included; the hub forwards a standing mandate from any origin with the origin's token (C3.5
  and both interop schemas). Product, breaks folded: CONTEXT's Mandate, the conformance callee row and the mandate
  schema name the standing exception at T2; AU-3 and C3.5 gate an origin by `standing/1`; AP-3 names the hub-stated
  profile and AP-2 its inputs; an organization's profile is stated `by: "operator"` (the schema refuses `by: "level"`
  with `standing`), the setter's level checked at the set; question 4's default in AU-4 and the hub row; the backlog,
  this handoff and the generator header; ST-043, SCN-061 and FLW-31's T2 branch. Risks folded: AU-5 for every mandate,
  with a task-mandate vector; a bound profile beside an operator decision from T2 is read; FAC-SEM-173 on a widened
  mandate; `standing` and `tokenProf` in the action-call kind with a fixture pair; the kits' `standing/1`; question 5
  (credential requests); the window after a narrowing; the default's instruction the operator's recorded words; CONTEXT
  tells the autonomy profile from the other profiles; the restatement pairs and the register gap in Open. Declined: an
  architect's `autonomy.profile.set` outside its projects as a profile vector (the rule is DEC-0162's for any relayed
  action, pinned by `levels.json` "an architect outside its projects"). `pnpm run check` exit 0 on the fold (11315 passed, 3 skipped).

## Next task

Round 2 of the blind readings (unit, seam, product) of branch `agent/ct285-autonomy-profile-20261112` (DEC-0166).
