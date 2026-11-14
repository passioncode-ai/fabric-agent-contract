# Handoff 2026-11-14 (part 3): unlimited entitlements, read parity, instance statements

**Objective:** continue the operator's «дальше» after part 2: the board's asks in order (CT-299 for the platform, CT-311
read parity, CT-314 for the platform and the first organization server), each a DEC read under the finish-line rule
(`~/DATA/_worktrees/_rounds/common.md`), and CT-302's design.

## Done

- **DEC-0168 (CT-299)**, branch `agent/ct299-unlimited-20261114` at `d9c0325a`: `entitlement/2`, `entitlement/1` with
  `allowances` (`limited` or `unlimited`); it lifts only the order's own allowances, never a spend limit, a key's
  ceiling, an emergency stop, a level, a profile or a human step; a personal one is `limited` (`FAC-SEM-175`). Design
  `docs/evidence/plans/2026-11-14-ct299-unlimited-entitlement.md` on the branch. Round 1: unit and seam clean, product
  one blocking finding (FAC-SEM-115's kinds), folded in `e3b9f304`; round 2 unit clean, seam and product stopped on the
  account's limit. `pnpm run check` exit 0 on `d9c0325a`.
- **DEC-0169 (CT-311)**, branch `agent/ct311-read-parity-20261114` at `92832142`: read parity (RP-1), the design order
  (RP-2), and `FAC-SEM-176` (a dashboard needs `surfaces.mcp` or `surfaces.a2a`; an MCP surface lists a tool).
  `pnpm run check` exit 0 on `92832142`. Not read yet.
- **DEC-0170 (CT-314)**, branch `agent/ct314-instance-statement-20261114` at `37c6b1ca`: `org-instance/1`, the
  organization server's signed statement that an instance runs for an organization, `verifyOrgInstance` with the
  platform's four checks, `FAC-SEM-177`, 38 vectors. Design on the branch. `pnpm run check` exit 0 on `37c6b1ca`. Not
  read yet.
- CT-302's branch: the CT-314 row records the platform's checks; the private name of the first organization server
  removed from it.
- Board: plan rows 2.11 to 2.13 answered (thread `16093ded`, `6c63bbe0`, corrected by `8bea3a22`); CT-314 accepted to the
  platform (`3bb1d765`, thread `fb41cd09`); 17 unread messages read.

## Open

- Merge order: DEC-0168, then DEC-0169, then DEC-0170. Each later branch merges main first: the DEC order in
  `docs/DECISIONS.md`, conformance's rule register rows and its next free code (`FAC-SEM-178` once all three land).
- CT-302's design: round 7 readings stopped on the account's limit; two clean rounds owed, then its board message.
- The paused DECs of part 2's Open list (DEC-0157 to DEC-0161, DEC-0165, DEC-0167) are unchanged.
- A timing test (`test/source-rules.test.ts`, "skip folders in time linear in the include paths") and the MD-2a property
  test time out at 5 s under a load average above 150; both pass on an idle machine. Not a defect of the code.

## Checks run

- `pnpm run check`: exit 0 on `d9c0325a` (DEC-0168), `92832142` (DEC-0169) and `37c6b1ca` (DEC-0170).
- `pnpm test:fast`, `docs:check` and `privacy:check` on each branch head before its push.

## Next task

Resume the readings when the account's limit resets: DEC-0168's round 2 seam and product, then round 3; DEC-0169's and
DEC-0170's round 1; CT-302's round 7. Land in the merge order above and answer each asker on the board.
