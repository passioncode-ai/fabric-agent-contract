# Handoff — review of the Kimi runner-route run, 2026-10-07 

Objective: review Kimi Code's 2026-10-07 work (DEC-0026, FD-30, CO-223, ADR-0125) and fix everything.
Plan and findings: [brief](../evidence/specs/2026-10-07-runner-route-review-brief.md).

## State

| Repo | Branch | State |
|---|---|---|
| fabric-agent-contract | `agent/kimi-review-20261007` | DEC-0029 complete with the Fabric-review and verifier fixes; `pnpm run check` exit 0 (377 tests) |
| fabric | `agent/runner-route-host-20261007` | WIP: `shared/runnerRoute.ts` (walk), `kimi-code` row, `--auto` bypass flag; no tests, not wired |
| fabric-dashboards | — | untouched; FD-33 (npm PATH) owned by run r-175c3c33c; full review in [fd30 review](2026-10-07-fd30-review-for-dashboards.md) |

## Next task (in order)

1. Contract: done (DEC-0029; findings R-01…R-20 in the brief).
2. Fabric: ADR-0125 from the draft (lease `docs/adr/**`, reservation paragraph in
   task-pipeline-persistence-contract.md), tests for runnerRoute.ts, settings `runnerFallback`, wiring in
   `terminalOpen` and `tasks.start`, additive `terminal.opened@1` fields, applied permission mode; close PR #18 as superseded.
3. Dashboards: findings #2–#17 after FD-33 lands. 4. Backlog rows in switchboard, adapter, inbox (CT-03).
