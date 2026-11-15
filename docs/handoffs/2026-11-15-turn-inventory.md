# Handoff 2026-11-15 (part 5): DEC-0171, an agent turn's time and a machine's organization accounts

**Objective.** Answer the first organization server's request `356b6aae` (thread `1efdc2e1`, due 2026-11-22): response
time per agent, workflow and project (CT-318) and an organization's subscription inventory (CT-319), with no person
timed and the personal context never sent.

**Done.**
- DEC-0171 accepted and merged: the kinds `turn` and `account.inventory` inside `fabric-activity/0.1`,
  `activity-summary/2` (turn and inventory cells counted in people), the protocols `activity-turn/1` and
  `activity-inventory/1`, the rule `FAC-SEM-178`, `FAC-SEM-040`, `FAC-SEM-045` (`tenants`) and `FAC-SEM-100` widened,
  `routeInventory`, membership OM-7's inventory row, vectors [`activity-turn.json`](../../fixtures/vectors/activity-turn.json).
- Blind readings: rounds 1 and 2 folded, rounds 3 and 4 clean on all three tiers.
- The organization answered (board `c040fbef`): no new `noticeVersion`; `turn` under `activity-logs`,
  `account.inventory` under `usage-and-cost`, `minPopulation` 5.
- Filed: CT-321 (Fabric Dashboards' FD-273, three optional descriptor fields), CT-322 (DEC-0171's risks).

**Checks run.** `pnpm run check` exit 0 on the landing commit (see the PR).

**Open.**
- DEC-0172 (CT-302, the decision verdict) on `agent/ct302-decision-verdict-20261115`: round 2 folded, round 3 next.
- CT-317 (2), the root pin rule: the platform's form accepted on the board (`5131b047`), DEC after DEC-0172.
- CT-321 design; DEC-0158's OS-6 and OS-7 re-cut.

**Owed elsewhere.** Observatory's collector (both kinds, the gates, RT-6), Switchboard's account record by tenant, the
first organization server's receiver (the restraint, `/2` cells, `tenants`), the adapter kits' `PROTOCOL_REVISIONS`.

**Next task.** Read DEC-0172 round 3 on all three tiers at the branch head; land it after two clean rounds.
