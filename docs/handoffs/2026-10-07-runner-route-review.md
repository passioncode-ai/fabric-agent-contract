# Handoff — review of the Kimi runner-route run, 2026-10-07 (work in progress)

Objective: review Kimi Code's 2026-10-07 work (DEC-0026, FD-30, CO-223, ADR-0125) and fix everything.
Plan and findings: [brief](../evidence/specs/2026-10-07-runner-route-review-brief.md).

## State

| Repo | Branch | State |
|---|---|---|
| fabric-agent-contract | `agent/kimi-review-20261007` | commit e7238a4 = DEC-0029 (gate green); a WIP commit on top carries the fabric-review and verifier fixes, gate NOT re-run green |
| fabric | `agent/runner-route-host-20261007` | WIP: `shared/runnerRoute.ts` (walk), `kimi-code` row, `--auto` bypass flag; no tests, not wired |
| fabric-dashboards | — | untouched; FD-33 (npm PATH) owned by run r-175c3c33c; full review in [fd30 review](2026-10-07-fd30-review-for-dashboards.md) |

## Next task (in order)

1. Contract: finish the verifier's findings — register gets a Receipt column (`reserve SEM` prints `SEM-0NNN`);
   fixture `binding-runner-route.json` → capability agent-chat, provider claude-code-local, plus a whole-bundle
   test (route + binding + catalogue + admissions); derived context: candidate without pool only if the
   binding's pool serves its family, drop `selectedAccount` and secretRef env entries; FAC-SEM-034: `spawn-failed`
   only where spawn is allowed, `sessionRef` required when attached, `Number.isInteger` on raw indexes,
   `Object.hasOwn` for drives, `fromProbe` for runner-unavailable, `sticky: true` selection with no probes;
   DEC-0029 compatibility paragraph made exact (tightenings listed, exception justified by zero adoption);
   spec: node/conversation optional, exhausted journalled in host vocabulary, derived context pin rule in
   versioning.md, FLW-05 quota before attach, bundles carry the revision form. Then `pnpm run check`, push, PR, merge.
2. Fabric: ADR-0125 from the draft (lease `docs/adr/**`, reservation paragraph in
   task-pipeline-persistence-contract.md), tests for runnerRoute.ts, settings `runnerFallback`, wiring in
   `terminalOpen` and `tasks.start`, additive `terminal.opened@1` fields, applied permission mode; close PR #18 as superseded.
3. Dashboards: findings #2–#17 after FD-33 lands. 4. Backlog rows in switchboard, adapter, inbox (CT-03).
