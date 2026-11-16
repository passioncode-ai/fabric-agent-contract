# 2026-11-16 DEC-0179, agent health

- **Objective:** answer fabric-switchboard's board request `3173118b` (SB-393, thread `d9622c6f`): a schema and a
  decision for `agent-health/1`, the one health reading every product and agent of the estate gives (CT-336).
- **Done:** DEC-0179 in [`docs/DECISIONS.md`](../DECISIONS.md); [agent health](../specification/agent-health.md)
  (HL-1 to HL-7); `schemas/agent-health.schema.json`; `FAC-SEM-181` over the kinds `agent-health` and
  `agent-health-service`; reference `src/agent-health.ts` (`worstState`, `readHealth`, `episodeKey`,
  `agentHealthRules`); vectors `fixtures/vectors/agent-health.json` from `tools/vectors/agent-health.ts`; fixtures;
  `test/agent-health.test.ts`; conformance rows (producer, watcher, reference module, register); `agent-health/1` in
  the protocol register.
- **Decisions:** a surface of its own (MCP `<product>_health`, CLI `<product> health --json`), not a member of the
  well-known answer; HL-7 binds the two for a service that answers both; `unknown` sits between `ok` and `warn`;
  episodes stay the watcher's, with the estate's key fixed (HL-6). The reasons are in DEC-0179.
- **Open:** CT-337 (the well-known declaration of a service's health path, as `load` is declared, which
  fabric-agent-adapter FAA-346's probe needs); CT-338 (further blind readings until two consecutive clean rounds).
- **Checks run:** `pnpm run check` on the branch; one round of blind readings on the unit, seam and product tiers,
  folded before the merge.
- **Consumers waiting:** passioncode PC-230, project-observatory OBS-577, fabric-agents-database B-75,
  fabric-agent-adapter FAA-346; Switchboard aligns its 0.7.102 report the same day.
- **Next task:** CT-337, then CT-338.
