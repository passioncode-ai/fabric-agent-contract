# Brief — runner routes for agent chats, 2026-10-07

**Task.** Everywhere Fabric agents hold a chat with an agent, the host should
prefer terminal agents — Claude Code, Codex, Kimi, Hermes and the others the
operator actually runs — under an operator setting: an ordered preference list
with availability fallback. The operator's example: no Claude Code session is
open, so the route answers from the next available candidate — Hermes starts
and replies. The mechanism is defined here, at the contract level, and broadcast
to all Fabric agents through the decision register and the coordination plane.

**Run:** task-pipeline, Proof of Done · model: the session's current model
(single model for the whole run, no per-stage overrides) · run mode off.

## Source ledger

| Source | What it says about this task | Read at |
|---|---|---|
| [runners.md](../../specification/runners.md) | the runner catalogue: installed coding agents, version probes ≤ 5 s, drives; a binary no entry names is never executed | worktree `origin/main` `b300f24`, 2026-10-07 |
| [profiles.md](../../specification/profiles.md) | local-runner profile: project default runner, binding override with an admitted provider, provider owns model choice | 2026-10-07 |
| [execution-context.md](../../specification/execution-context.md) | account fallback is versioned and every switch is recorded; capability-unavailable is the exhausted answer | 2026-10-07 |
| DEC-0010, DEC-0016, DEC-0007 | admission and binding are separate lifecycles; a `0.x` minor adds optional fields and new schemas, `contractVersion` stays `0.1.0`; configuration history is immutable | 2026-10-07 |
| [DECISIONS.md](../../DECISIONS.md) | register ends at DEC-0024; DEC-0025 reserved by another run; this run reserved DEC-0026 | 2026-10-07 |
| [CONTEXT.md](../../../CONTEXT.md) | vocabulary owns **Runner**; no route term yet | 2026-10-07 |
| `docs/ux/scenarios.md` | SCN-004/SCN-006 already cover operator-facing versioned fallback with a recorded switch — the route reuses that behavior for runners | 2026-10-07 |
| `AGENTS.md` | gate `pnpm run check`; append-only registers; branch per run, git lease, reserved ids; coordination reported as degraded when the record plane is down | 2026-10-07 |
| the operator's request | «везде, где есть чаты с агентом — терминальные агенты по настройке с fallback; нет сессии Claude Code — отвечает запущенный Hermes» | 2026-10-07 |

**Contradictions:** none. The catalogue doc says a host finds runners "from a
catalogue it ships as data, never by running whatever it finds on `PATH`" — a
route never widens that; detection stays inside the catalogue probes.

## Decisions

| id | Decision | By |
|---|---|---|
| D-1 | The setting is an immutable **runner route** per capability: ordered candidates of (catalogue runner kind, admitted provider revision, session policy) | run, from the request |
| D-2 | Session policy is two switches: `attach: preferred\|never` and `spawn: allowed\|never`; selection walks candidates in order (attach, spawn, next) | operator's example |
| D-3 | All-candidates-failed is explicit: `exhausted: capability-unavailable` (default) or `hold`, bounded by execution-context limits; `recovery: sticky` (default) or `reprobe` | run |
| D-4 | Every selection/switch records from/to candidate, runner kind, reason, route revision, run/node, time — the runner analogue of the account switch event | run, from DEC-0013's pattern |
| D-5 | Additive in `0.1.0` under DEC-0016: new schema, `runner-route` versioned-setting kind, optional `binding.runnerRoute`, rules FAC-SEM-028…030; recorded as **DEC-0026** | operator |

## REQ spine

| REQ | Deliverable | Verified by |
|---|---|---|
| REQ-001 | `runner-route.schema.json` + fixtures (positive route with the operator's scenario, versioned-setting wrapper, 4 negatives) | `pnpm test` fixture cases |
| REQ-002 | Selection/fallback semantics normative in `runners.md`, referenced from profiles/execution-context/versioning | `pnpm docs:check` |
| REQ-003 | FAC-SEM-028 (one candidate per kind), FAC-SEM-029 (candidate can run), FAC-SEM-030 (admitted providers only) with rule tests | `pnpm test` route-rules cases |
| REQ-004 | Vocabulary (`CONTEXT.md`), DOCMAP home, DEC-0026 in the register | `pnpm docs:check` |
| REQ-005 | The full gate green on the branch | `pnpm run check` exit 0 |

## Autonomy sweep

| Item | Resolved |
|---|---|
| Branches / worktrees | own worktree `../fabric-agent-contract-runner-route`, branch `agent/runner-route-20261007` from `origin/main`; other local checkouts belong to other sessions and are untouched |
| Coordination | git lease on `docs/DECISIONS.md` acquired (run `r-f0052c6f2`); DEC-0026 reserved by git CAS; record plane degraded to `fs` (no Notion token) — reported, work proceeds |
| Consumer repos | not touched; adoption is each consumer's repin per DEC-0016 (Fabric host, fabric-agent-adapter, Fabric Dashboards) |
| Merge | PR to `main`; merge conditional on `pnpm run check` exit 0 in the same command |

## Errata (DEC-0029, 2026-10-07)

A review of this run, recorded as DEC-0029 and its
[brief](2026-10-07-runner-route-review-brief.md), corrected four things this brief states:

- The source ledger cites SCN-004 and SCN-006 as the operator's fallback behaviour. SCN-004 is
  "Reject an unsafe project context"; the route's scenario is SCN-009, added by DEC-0029.
- The positive route let `claude-code` spawn, so "no Claude Code session → Hermes answers" could
  not happen as written; the fixture now gives `claude-code` `{attach: preferred, spawn: never}`.
- D-5 numbered rules `FAC-SEM-028`…`030` by hand; the open DEC-0025 branch already used `028` and
  `029`. Rule codes now have a register (conformance.md, `reserve SEM`).
- "Contradictions: none" missed that `recovery: reprobe` moved a running conversation, which the
  host design (Fabric ADR-0125) forbids; DEC-0029 moves switches to launches only.
