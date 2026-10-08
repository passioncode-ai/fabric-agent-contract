# Handoff — review of the Kimi runner-route run, 2026-10-07

Objective: review Kimi Code's 2026-10-07 work (contract DEC-0026, Dashboards FD-30, Fabric CO-223 and
ADR-0125), fix every defect found, and finish what was asked: every agent chat prefers the operator's
coding agents, with fallback ("no Claude Code session, Hermes answers"), at the contract level and in
the host. Plan and findings: [brief](../evidence/specs/2026-10-07-runner-route-review-brief.md).

## State — all merged

| Repo | PR | Commit on `main` | What |
|---|---|---|---|
| fabric-agent-contract | #19 | `058fb789` | DEC-0029: attach boundary, derived execution context, `runner-route-event.schema.json`, FAC-SEM-030 tightened, FAC-SEM-032…034, `tui` drive and `auth` probe, shared kind names, rule-code register (G-13), SCN-009 |
| fabric-dashboards | #45 | `9862e53d` | FD-33: the estate updater's 17 review findings — login-shell PATH (the field's `spawn npm ENOENT`), pinned `npx`, publisher check over `--json`, short pins, honest states, docs |
| fabric | #19 (#18 closed as superseded) | `277add0c` | ADR-0125 rewritten and implemented: Settings → Fallback order, the fallback choice in both launchers, the walk with contract probe results, failure types, `terminal.opened@1` `route`, `kimi-code` row, SCN-135 |
| fabric-switchboard | #113 | merged | SB-82: adopt runner routes and the shared kind names |
| fabric-agent-adapter | #40, #41 | merged | FAA-11 (renumbered from FAA-10 by #41): probe results, FAC-SEM-028…034, repin to `058fb789` |
| fabric-inbox | #39 | merged | B-61: decide how cloud chats take part |

Checks actually run: contract `pnpm run check` (377 tests); Dashboards `FD_SKIP_LAUNCHD=1 npm run check`
(320 tests, 319 pass, 1 launchd skip); Fabric `scripts/ci.sh fast` green with
`apps/desktop/test/quit.test.mjs` run apart — its real-Electron SIGTERM test fails 1 of 2 on the branch and
on `a655b068` alike under load averages 70–285 (the fixture imports only `quit.ts`). Not run: Fabric
`ci.sh full` (disposable stack), browser and e2e suites. Each change had an independent read-only review;
all findings were fixed before merge.

## Open, with owners

- **CT-02** (here): DEC-0025's branch (PR #16) must renumber its `FAC-SEM-028`/`029` with
  `agent_sync.py reserve SEM` when rebased; G-13 refuses it until then.
- **CT-03** (here): consumers adopt the pinned contract route — Fabric's CO-223 remainder (repin, journal
  events with a migration and an ingress owner), SB-82, FAA-11, B-61.
- **FD-34** (Dashboards, operator decision): whether the estate watch stays on by default in a public
  product, and where the installed skills version is read from.
- The Dashboards main checkout still holds another session's uncommitted FD-33 row on branch
  `agent/fd33-estate-npm-path`; it is superseded by PR #45 and can be dropped by its owner.

**Next task:** Fabric CO-223's contract repin to `058fb789` and the pinned route at the launch seam
(ADR-0125 "Not decided here").
