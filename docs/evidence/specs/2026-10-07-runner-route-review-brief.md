# Brief — review of the runner-route and estate-updater run, 2026-10-07

**Task.** The operator asked to review what the Kimi Code session did on 2026-10-07 across
`fabric-agent-contract`, `fabric-dashboards` and `fabric`, check the documentation against the code,
collect every defect and gap into one plan, and work the plan to the end with the documentation
updated after each fix.

**What that session delivered** (session `session_a28335d4`, five operator turns, 00:25–05:00):

| Repository | Change | State on 2026-10-07 |
|---|---|---|
| fabric-agent-contract | DEC-0026 runner routes (PR #17, `6e3c3f7`) | merged |
| fabric-dashboards | FD-30 estate updater (PR #38) and its bootstrap fix (PR #39) | merged, shipped in 0.6.3/0.6.4 |
| fabric | CO-223 route-aware host epic (PR #17) | merged |
| fabric | ADR-0125 host route resolution (PR #18) | open |

The host implementation — the part the operator asked for in "давай мы её реализуем" — was not
started: CO-223 is an epic and ADR-0125 a proposal.

## Findings in this repository

| id | Finding | Severity | Fixed by |
|---|---|---|---|
| R-01 | DEC-0026's own scenario cannot happen: the positive route let `claude-code` spawn, so "no Claude Code session → Hermes answers" starts a new Claude Code instead | major | fixture and runners.md: `claude-code {attach: preferred, spawn: never}` |
| R-02 | "Attach to a live terminal session" names no owner, which lets a host inject a request into a terminal it does not hold (security) | major | attach boundary in runners.md, DEC-0029 §1 |
| R-03 | "Every selection and switch is recorded" has no wire shape; consumers (Dashboards, adapter) cannot read it | major | `runner-route-event.schema.json`, `FAC-SEM-034` |
| R-04 | `FAC-SEM-028`/`029` collide with the open DEC-0025 branch: rule codes had no allocator | major | register in conformance.md, `reserve SEM`, G-13 test |
| R-05 | `recovery: reprobe` moves a running conversation; the host design forbids switching mid-conversation | major | switches at launches only, closed reasons |
| R-06 | `FAC-SEM-030` matches `id@revision` and ignores the content hash and the admission's capability | major | whole-reference match plus capability |
| R-07 | `binding.provider` and `executionContext` pin one provider; with a route the selected candidate's context was undefined | major | derived execution context; `FAC-SEM-032` |
| R-08 | `runnerRoute` allowed on the `mcp` and `a2a` profiles; the `runner-route` payload was never validated; unknown route fields were not refused | minor | binding `if/then`, versioned-setting `if/then`, `unevaluatedProperties` |
| R-09 | A route may name kinds no catalogue holds (the example's `kimi`, `hermes` are not in the initial catalogue list) | minor | `FAC-SEM-033` with the host's catalogue |
| R-10 | `exhausted: hold` unbounded in practice; defaults stated in prose only | minor | bound by `limits.wallSeconds`; schema `default` |
| R-11 | The run brief cites SCN-004 for fallback (it is "Reject an unsafe project context"); no scenario covers routes | doc | ST-006, FLW-05, SCN-009; errata in the run brief |
| R-12 | `FAC-SEM-000`…`008` are defined nowhere but in code | doc | the register defines them |
| R-13 | The catalogue has no drive for the interactive terminal a host actually opens, and no way to tell a signed-out runner (found by the Fabric review) | major | drive `tui`, optional `auth` probe |
| R-14 | Failures had no classes: an authority refusal or a possibly-live process could move to the next runner | major | three classes in the walk |
| R-15 | A host could append "the remaining catalogue rows" or a plain shell to the walk, and record its own ordering as a route | major | walk only named candidates; `host-order` names no route |
| R-16 | Kind names differ across hosts (`kimi` vs Switchboard's `kimi-code`) | minor | shared kind names in runners.md |
| R-17 | The derived context carried the binding's pool, `selectedAccount` and secret refs to another provider (found by the verifier) | major | re-selected account, no `secretRef` across providers, pool by family |
| R-18 | G-13 could be passed by deleting the other branch's rows; one code could be checked by two modules | major | definitions anywhere, one checker per code, kinds compared |
| R-19 | FAC-SEM-034 accepted `spawn-failed` on `spawn: never`, string indexes, an unprovable `runner-unavailable`, `attached` without a session; a sticky relaunch could not be recorded | minor | rule and schema fixes, `sticky`, `fromProbe` |
| R-20 | DEC-0029's compatibility sentence claimed no document changes validity | doc | the exception is stated with its reason |

## Findings in the other repositories

`fabric-dashboards` (FD-30, read at `origin/main` `d8c6d67`): a read-only review found 17 defects,
among them a blocker already visible in the field — the installed app's `PATH` has no `npm`, so
every skills check fails with `spawn npm ENOENT` (`~/Library/Logs/Fabric Dashboards/main.log`,
02:35, 03:20 and 08:34 on 2026-10-07). The full list and its fixes live with that repository's
change (its `docs/backlog.md` row FD-30).

`fabric` (CO-223, ADR-0125 at `a655b068`): 15 findings. The proposed seam sat below the routine's
Claude quota gate, the synthesis order made the Settings list unreachable and overrode the person's
pick, the fallback reached `shell`, managed launches cannot attach, failure classes were undefined, the
planned journal events had no migration or ingress owner, and Fabric has no Kimi row. ADR-0125 is
rewritten in the implementation branch.

## Plan

| Step | Repository | Work | Gate |
|---|---|---|---|
| P-1 | fabric-agent-contract | R-01…R-20 as DEC-0029 — done, PR #19 `058fb789` | `pnpm run check` |
| P-2 | fabric-dashboards | FD-30 defects (17) — done, PR #45 `9862e53d`; FD-34 left to the operator | that repository's `npm run check` |
| P-3 | fabric | ADR-0125 rewritten and implemented — done, PR #19 `277add0c`; pinned route remains (CO-223) | that repository's `scripts/ci.sh fast` |
| P-4 | all | handoff with remotes, commits and the next task — done; backlog rows SB-82, FAA-10, B-61 | merged |

## Coordination

`agent_sync.py reserve DEC --key runner-route-amendment-20261007` returned DEC-0029 (git CAS); the
git leases of run `r-c6109cd37` covered `docs/DECISIONS.md`, `docs/backlog.md` and
`docs/specification/conformance.md`. The record plane is `fs` — no Notion token is configured — so
coordination beyond leases and reservations is local, as `AGENTS.md` describes.
