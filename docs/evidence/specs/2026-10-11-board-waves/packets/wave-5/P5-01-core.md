# P5-01 — the 0.1.0 core

- **Node:** N10 · **Wave:** 5 · **Closes:** F-A-002, F-A-003, F-A-004, F-A-014, F-A-015, F-A-016, F-A-017, F-A-018,
  F-A-019 · **Decision:** DEC-0064 · **Rules:** `FAC-SEM-093`, `094`, `096`, `097` (`095` reserved, unused).

## Sources

The inventory items above (each with its source and proposed fix in
[inventory.json](../../inventory.json)); DEC-0004…DEC-0009, DEC-0011, DEC-0012, DEC-0013.

## What to build

1. A rule for the claim/proof relation of a result (F-A-002) and `FAC-SEM-001`'s text matched to its code.
2. A rule for approval separation over learning proposals and promotions (F-A-003); the active-revision, own-checker
   and role clauses worded as host-side checks.
3. `FAC-SEM-006` finds a project with assignments and no product manager (F-A-004).
4. Namespaced residue extensions in the coordination schema (F-A-014).
5. Retention worded as per classification (F-A-015); a grant's window rule and the safe reading of absent channels and
   recipient constraints (F-A-016).
6. Execution-context and profile promises worded to what the schemas carry (F-A-017, F-A-018).
7. A rollback rule and the rollback example DOCMAP asks for (F-A-019).

## Proof

`test/core-rules.test.ts` and the fixtures named in DEC-0064; each rule planted out and caught; `src/core-rules.ts` at a
100 % branch floor; CT-14 on the board. Handoff: [2026-10-12-w5-p5-01-core](../../../../../handoffs/2026-10-12-w5-p5-01-core.md).
