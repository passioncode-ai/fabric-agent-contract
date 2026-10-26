# 2026-10-26: the operator's mandate and one approval for all their agents

## Objective

Carry the operator's instruction across a chain of agents (CT-142), and make one approval bind all the operator's
agents (request `519d7b21`). Release both.

## Done

- **DEC-0125, the operator's mandate** (`mandate/1`, `FAC-SEM-144`, `src/mandate.ts`): PR #191, merged at `e6c4fc16`.
  Released as `v0.1.0+2026-10-26.2` at the adapter's request (thread `3e8f706c`).
- **DEC-0126, one approval binds all the operator's agents**: PR #192, merged at `39c89773`, released as
  `v0.1.0+2026-10-26.3`.
  - OA-1 to OA-7 in [delegation](../specification/delegation.md#one-approval-binds-all-the-operators-agents).
  - An optional `source` in `mandate/1` and the decision, carried by `mandateCovers` and `actionDecision` into `recordAs`.
  - The named revision `operator-source/1` gates `source` on the wire.
- **Backlog.** CT-150 is filed: waits that outlive a session, from finding `6fa891b2`. CT-149 now covers the adoption of
  both decisions.
- **Board replies:** `a297d9f8`, `109b0cee`, `a7175b41`, `7117c465` (request `519d7b21`), `630483ad` (finding `6fa891b2`).

## Checks actually run

- `pnpm run check`, exit 0:
  - on the DEC-0125 tree: 8 971 tests;
  - on DEC-0126's `30837fc4`: 101 files, 8 989 tests, UX lint, docs, privacy 0.
- `docs:check` and `ux:lint` on the later Markdown-only commits.
- Blind readings of DEC-0126: four rounds. Rounds 3 and 4 found nothing blocking.

## Decisions

- **Spend above a money limit.** The operator's point 4 lists "money above the limit" as a question. DEC-0126 keeps
  spend above a money limit (L0, L1, a key's ceiling) as the person's step, as AP-4 and MD-6 already say. Money above
  the relayed amount is asked once.
- **The proposed `approval` block.** It is `mandate/1` or the decision with `source`, not a third format.

## Open

- **CT-149: adoption.**
  - The adapter repins to `v0.1.0+2026-10-26.3` (FAA-131).
  - Fabric's hub forwards `call.mandate`.
  - The research service and research agent read the mandate.
  - Services list `operator-source/1` where they read `source`.
- **fabric-workspace `knowledge/agents-first.md`.** Items 2 and 4 to align with DEC-0126; asked in reply `7117c465`.
- **CT-150.** A DEC on the wait record, agreed with Fabric on the board.
- **Waits:** CT-128 after 2026-10-30; CT-42 on thread `c06f2991`; CT-145, CT-147 and CT-149 on consumers.

## Next task

CT-122 and CT-137 (unlinkable memberships, membership attestation with MD-9 path (a)), due 2026-11-06. Then CT-143
(the family) by 2026-11-07, then CT-150.
