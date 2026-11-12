# Handoff 2026-11-12: authority levels (CT-250, DEC-0162)

Branch `agent/ct250-levels-20261112`, from main `e9bb7ac7`. Entry point: [DEC-0162](../DECISIONS.md) and
[membership, Levels](../specification/membership.md#levels).

## Objective

Turn the authority levels design ([2026-11-12-ct250-authority-levels.md](../evidence/plans/2026-11-12-ct250-authority-levels.md))
into one decision with its schemas, reference code, vectors and pages, by the organization slice of 2026-11-21
(fabric-workspace board request `4a1bf8d6`, thread `8da128cf`).

## Done

- `schemas/org-membership-2.schema.json` (new); `decision.schema.json` takes the level form (`oneOf` operator or level);
  `mandate.schema.json` takes `by: "level"` with `level`, `org`, `membership`; `delegation-token.schema.json` takes `mem`.
- `src/org-membership.ts` reads `/2` for a reader with `levels: true` (a `/1` verdict keeps its shape);
  `src/signing-challenges.ts` registers `org-membership/2`; `src/levels.ts` (new): `levelStanding` and `FAC-SEM-170`;
  `src/actions.ts` and `src/mandate.ts` read level decisions and level mandates at every tier when bound;
  `src/delegation.ts` and `src/delegation-rules.ts` parse `mem` and keep it onward (`FAC-SEM-050`).
- `fixtures/vectors/levels.json` from `tools/vectors/levels.ts` (expected answers by hand), `test/levels.test.ts`;
  positive, negative and semantic fixtures; registers (rule codes `FAC-SEM-169`, `FAC-SEM-170`, receipts SEM-0169 and
  SEM-0170; the signing register; protocol revisions `org-membership` 1 and 2; schema count 152).
- Pages: membership (`/2`, OL-6 amended, *Levels* LV-1 to LV-11, rules, adopters, not decided), service AP-2 to AP-5
  and the `actionDecision` table, delegation (`mem`, DL-18, DL-26, MD-3, MD-5, MD-6), governance's approval
  separation, source's hand-over word (design question 1's default), conformance (rows, modules, codes, register).
- Deviations from the design, recorded in DEC-0162's Alternatives: `projects` is always present (empty unless
  architect), since OM-1 and the signing register keep every member present; a level mandate names no `project` of its
  own (its scope's `projects` does); `level-role` is a `decision-invalid` detail for a level above the role.

## Open

- The operator's questions take the design's defaults; an answer otherwise before 2026-11-21 changes DEC-0162.
- Landing notes, whichever lands second: DEC-0156 (`agent/ct220-operators-word-v2`) OW-1 and OW-6 and its CT-250
  note (its handoff `2026-11-07-operators-word.md`) state that a level decision carries a task's word for an
  organization's agents; DEC-0159 (`agent/ct218-local-cloud-v2`) CF-3's key twin and CF-4's page twins say whether a
  bound level decision stands there (main's CT-250 row, DEC-0156 round 26, DEC-0159 round 16).
- With DEC-0157 (`agent/ct216-usage-data-v2`, its round 30 seam): UD-4 admits only the operator's own decision for a
  declined usage switch; LV-7 says a level decision is not that word unless the holder is that person's operator.
  Whichever lands second makes UD-4 say so and cite DEC-0162, and LV-7 cite UD-4 by its landed link. Checks on the
  merged tree: `awk '/\*\*UD-4/,/\*\*UD-5/' docs/specification/usage-data.md | grep -c 'level'` and `git grep -n 'UD-4'
  -- docs/specification/membership.md docs/DECISIONS.md | grep -c 'DEC-0162\|LV-'` each print at least 1.
- Adopters owe the reading (DEC-0162 Compatibility): the organization product, Fabric CO-523, the adapter FAA-249,
  Observatory OBS-377, Switchboard SB-291, Fabric Inbox B-232, Fabric Dashboards FD-164, the launcher PC-162, the copy
  service AUTH-01, the platform PLAT-141 and PLAT-146.

## Checks run

- `pnpm run check` exit 0 on the round-1 head (11250 tests passed, 3 skipped; coverage floors met; UX lint, docs
  check with 0 markdownlint errors, privacy check).

## Next task

Round 1 of the blind readings (unit, seam, product) of branch `agent/ct250-levels-20261112` (DEC-0162).
