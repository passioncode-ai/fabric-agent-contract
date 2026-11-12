# Handoff 2026-11-12: the estate's manager on the wire (CT-252, DEC-0167)

Entry point for the next agent on CT-252. Branch `agent/ct252-estate-manager-20261112`, from main.

## Objective

Turn [the estate manager design](../evidence/plans/2026-11-12-ct252-estate-manager.md) into DEC-0167 by the
organization slice of 2026-11-21: `scope` in bindings and execution contexts, and the role slot with its epoch.

## Done

- DEC-0167 proposed in `docs/DECISIONS.md`; [governance and roles](../specification/governance-and-roles.md#the-estates-manager)
  MG-1 to MG-6 and `FAC-SEM-174`.
- Schemas: `scope` in `binding.schema.json` and `execution-context.schema.json`'s context; `role-slot.schema.json` (new).
- Code: `src/role-slot.ts` (`slotWrite`, `roleSlotRules`), five kinds in `src/semantic-kinds.ts`, `role-slot/1` in
  `src/protocol-revisions.ts`. Vectors `fixtures/vectors/role-slot.json` (`tools/vectors/role-slot.ts`),
  `test/role-slot.test.ts`; positive, negative and semantic fixtures; conformance rows, module and register;
  CONTEXT.md (Role slot); backlog CT-252.

## Decisions

- The design's `FAC-SEM-006` twin is `FAC-SEM-005`, which already requires one active `ceo` per roles document.
- A write from the current epoch by another binding revision is `slot-not-holder`, a third refusal beside the design's two.

## Open

- MG-5 cites DEC-0162 on its branch; when DEC-0162 lands, the citation becomes a link (`git grep -c 'ct250-levels' --
  docs/specification/governance-and-roles.md` prints nothing after).
- The operator's two questions: post them with their defaults and 2026-11-21 on thread `8da128cf`.
- Tell Fabric (CO-522 wave D, ADR-0046) when DEC-0167 lands.

## Checks run

- `pnpm run check` exit 0 on the first cut (11226 tests passed, 3 skipped; coverage floors met; UX lint, docs check with 0 markdownlint errors, privacy check 0 findings).

## Next task

Round 1 of the blind readings (unit, seam, product) of branch `agent/ct252-estate-manager-20261112` (DEC-0167).
