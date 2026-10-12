# Handoff — the board run closes (waves 1–6, 2026-10-11/12)

## Objective

Close everything unfinished or wrong in this repository — documentation, the board, the plan, the registers and the
cross-repository asks — in its final form, wave by wave, each change read by three independent readers before merge
([plan](../evidence/specs/2026-10-11-board-waves/plan.md), [canvas](../evidence/specs/2026-10-11-board-waves/canvas.md)).

## Done

- Six waves closed: DEC-0041…DEC-0075 (DEC-0048, DEC-0049 and DEC-0073 not used here), rule codes up to `FAC-SEM-106`,
  each wave's close record in the plan.
- Inventory: 193 items, 151 closed (`node docs/evidence/specs/2026-10-11-board-waves/assign.mjs`); every closed item
  carries its receipt in `findings/closed.json`.
- Consumers pinned their merge commits as they landed: Fabric (CO-263 `fee53a2`, CON-OE-05 `fc4dda0`), Project
  Observatory (the relay audit, CON-OE-08, CON-OE-10 `b4f0344`), the first organization server (DEC-0071 `9c0032a`,
  DEC-0074 `146240a`), a consumer service (DEC-0070 `b9453a0`), the relay, the adapter and Fabric Dashboards (their
  board rows).

## Open — 42 items: 37 in the program, 5 left from wave 1

Corrected by the [w7 close](2026-10-12-w7-final.md): this section first said "42 items in the program, each with a board
row". The program held 37 (N13 14, N16 12, N20 11); five wave-1 board items (F-D-010, F-A-028, F-D-019, F-D-021,
F-D-022) were open without a row. The w7 close receipts F-D-010 and F-A-028 (fabric-workspace #138 `7c9f134`) and
gives the other three rows CT-47 and CT-48.

- N13: CON-OE-02 and CON-OE-09 (wait on Fabric's ADR FAB-OE-14), RM-01, the RM-03 residue, an organization layer,
  `org-authority/1` and the v4 decisions that wait on Fabric's D2/D3/D8, CON-OE-06 (`surfaces.a2a`, v4 *Later*),
  AGENT-SYNC-IDS (a defect of the agent-sync tool: CAS receipts fall off the id registers).
- N16: consumer adoption rows (CT-*), each owned by its consumer.
- N20: the organization-contexts model's contract part (RM-28, CX-CON-01…10 and workflow cells), waiting on Fabric's D8
  and CX-FAB-05.
- CT-39 (identifier equality, needs a decision) and CT-40 (the privacy check's silent skip without `ORG_INDEX`; usage
  costs by project).

## Checks run

On main `d54b69a`: vitest 62 files, 3278 tests, every floor met; docs-check passed; markdownlint 0 errors; privacy 0
findings with `ORG_INDEX`.

## Next task

The final independent verification against the run's goal; then the program as its blockers clear — first CT-39 (a
decision on identifier equality, no external dependency).
