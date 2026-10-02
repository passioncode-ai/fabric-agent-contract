# Brief — online services in `fabric-service/0.1` (`placement: "remote"`), 2026-10-02

**Task.** The agent→Fabric conversion mechanism — the `fabric-service/0.1` extension
(this repository), the `building-fabric-services` skill (`passioncode-ai/fabric-agent-adapter`)
and the host (`passioncode-ai/fabric-dashboards`, its `packages/service-host`, and Fabric, which
reads the same package) — today makes only a **local** process a Fabric service: origin
`http://127.0.0.1:<port>`, supervised by launchd. This run adds the second kind: an **online**
agent or an **online dashboard** — an `https://` origin hosted elsewhere (e.g. a PaaS), no launchd — that a
host shows beside the local ones as a global service. The first online service is an existing
operator dashboard; it is the operator's own agent and stays out of every public artifact.

**Run:** task-pipeline, Proof of Done · model Opus 5.5 (1M), every stage · run mode off.

## Source ledger

| Source | What it says about this task | Read at |
|---|---|---|
| [service.md](../../specification/service.md) | `origin` MUST be `http://127.0.0.1:<port>`; well-known MUST answer without auth; a service MUST bind 127.0.0.1 and refuse non-loopback `Host`; launchd lifecycle; `lifecycle.manager: "none"` hosts show read-only | origin/main `540769b`, read 2026-10-02 |
| [DECISIONS.md](../../DECISIONS.md) DEC-0015, DEC-0016 | DEC-0015: local services found by descriptor, supervised by launchd. DEC-0016: a `0.x` minor may add optional fields and new schemas while every existing manifest stays valid; `contractVersion` stays `0.1.0` | 2026-10-02 |
| [retro.md](../retro.md) standing instructions | a protocol claim carries revision + retrieval date; a compatibility check counts only after it is seen rejecting a planted incompatible fixture; a learning needs a failed attempt beside a verified correction; a run may not mutate its own rules | 2026-10-02 |
| `AGENTS.md` | gate `pnpm run check`; registers append-only; branch per run, git lease, reserved ids before shared registers; an org change updates `org-index/repositories.json` in the same change | 2026-10-02 |
| fabric-agent-adapter `building-fabric-services/SKILL.md` @ origin/main `0ef633a` (0.5.7) | boundary excludes «a hosted SaaS — the protocol is loopback-only by design»; Step 1 already names «A remote agent → A2A over HTTPS, or MCP behind an authenticated gateway» | 2026-10-02 |
| fabric-dashboards `AGENTS.md`, retro standing instructions 1–7 | gate `npm run check`, e2e against a live sample service; vectors change in the same change (ADR-0006, Fabric runs them); a user-facing change updates `docs/ux/scenarios.md`; merge conditional on the gate's exit code in the same command; reproduce CI step by step; **classify ownership before visibility — public examples use `example-agent`**; lease before edit; builds in the scratchpad after a free-space check; read release rules and fetch before choosing a version | 2026-10-02 |
| fabric-dashboards `docs/ux/foundation.md:191-193` | Figma disabled; text-only design surface (brief D-7) | 2026-10-02 |
| fabric-dashboards `packages/service-host/test-vectors/state-precedence.json:70` | a non-loopback origin is `invalid` with reason `origin must be http://127.0.0.1:<port>` — today's hosts degrade safely on an https descriptor | 2026-10-02 |
| fabric-dashboards `src/core/deeplink.ts:97` | `open?url=` accepts only `127.0.0.1`/`localhost`/`[::1]` | 2026-10-02 |
| fabric `docs/evidence/retro.md` R-006, R-007, R-010 | a check counts after the mechanism is removed and it goes red; a check carrying its own copy of the mechanism proves the model; a surface is verified as its user meets it (MCP by a real client, a public repo on a fresh clone) | 2026-10-02 |
| fabric `docs/DOCMAP.md` | ADR register with lease; cross-repo programme briefs live in the owning repo | 2026-10-02 |
| the first online service (operator-owned, private repository) | already has a token → signed httpOnly cookie session and a constant-time Bearer check, so the login code mints the session it already uses | 2026-10-02 |
| obsidian-wiki | consulted through the projects vault; nothing on online Fabric services | 2026-10-02 |
| code graph | **none usable** — graphify cannot build on this machine (OpenRouter key posted to OpenAI → 401, exit 0); no reach queries this run, said out loud | — |

**Contradictions:** the skill's boundary (hosted SaaS excluded, «loopback-only by design») and
service.md's «`origin` MUST be `http://127.0.0.1:<port>`» contradict the operator's decision —
the operator outranks both, out loud (D-1); both texts are rewritten in this run. Local
checkouts of the contract (branch `agent/fabric-service-m1`, +10/−6), the adapter (main, −26,
two uncommitted files) and the dashboards (one untracked directory) belong to other sessions:
this run works in its own worktrees from `origin/main` and touches none of them.

## Decisions

| id | Decision | By |
|---|---|---|
| D-1 | An online service is a new **placement**, not a bridge: optional descriptor field `placement` = `"local"` (default, today's rules unchanged) or `"remote"` | operator, 2026-10-02 |
| D-2 | Additive in `0.1` under DEC-0016: `contractVersion` stays `0.1.0`, protocol id stays `fabric-service/0.1`; recorded as **DEC-0019** (id reserved under the lease) | operator, 2026-10-02 |
| D-3 | A remote service's well-known document **requires the service token**; without it the answer is `401` and discloses nothing (no build, pid, status or tiles). A host sends the token only to the descriptor's own `https` origin, verifies TLS, and follows no redirect | operator, 2026-10-02 |
| D-4 | Remote origin is `https://<host>[:<port>]` — no path, query, userinfo or loopback/private address; plain `http` is refused for a remote placement | run, from D-1/D-3 |
| D-5 | A remote descriptor carries `lifecycle.manager: "none"` and no launchd fields; a host offers no start/stop/restart. The port claim (FAC-SEM-010) applies to local placements only; `id.instance` uniqueness applies to both | run |
| D-6 | Network rules for remote: `Host` equals the origin's host, a foreign `Origin` and `Sec-Fetch-Site: cross-site` are refused on protocol routes; the session cookie adds `Secure`; the 100 ms well-known budget is a local rule — a host gives a remote probe a longer timeout and keeps ADR-0008 (a missed probe is not an outage) | run |
| D-7 | Token: minted by the installer on the operator's machine, kept there in `auth.tokenFile` (0600) and on the hosting platform as a secret; never in a URL, argv, log or page | run, from service.md |
| D-8 | Host UI: remote services appear in their own **global** group on the same card component; no lifecycle controls; states are the remote subset of the precedence (invalid, foreign, down, starting, stopping, degraded, ready) | run; UX track at stage 3 |
| D-9 | Public artifacts (contract fixtures, skill examples, dashboards tests) use neutral names (`example-agent`, `https://agent.example.com`); the operator's dashboard is registered only by a local descriptor on this machine | operator rule + dashboards retro 3 |
| D-10 | The first online service is the operator dashboard that already exists — its four protocol routes are added to it; nothing new is built beside it | operator, 2026-10-02 |
| D-11 | Design surface text-only (dashboards foundation D-7); no Figma file | recorded source |

## Autonomy sweep

| Item | Resolved |
|---|---|
| Branches / PRs / merges | own worktree per repo from `origin/main`, branch `agent/remote-service`, PR, merge only on the gate's exit code in the same command — **authorized** |
| Registers | DECISIONS.md / OPEN_QUESTIONS.md / backlogs edited under an agent-sync lease, ids reserved before writing |
| Gates | contract `pnpm run check`; adapter its validate workflow step by step; dashboards `npm run check` + `npm run test:e2e`; operator dashboard its five local gates |
| Releases | adapter to npm (+ local copies updated) — **authorized**; Fabric Dashboards signed, notarized DMG + feed via `fabric-notary`, built in the scratchpad after a free-space check — **authorized** |
| Deploy | the first online service by its own repository's deploy rules; its token through that repository's secret path — **authorized** |
| Logs | the hosting platform's logs for the online service; Fabric Dashboards `~/Library/Logs/Fabric Dashboards/`; services under `~/Library/Logs/<id>/` |
| Browser | Fabric Dashboards e2e (Playwright/Electron) and the managed Chrome at `127.0.0.1:9222` |

## Requirements

| REQ | Deliverable | Verified by |
|---|---|---|
| REQ-R01 | Normative text for `placement: "remote"` in service.md: descriptor, well-known with token, network, lifecycle, login, events; boundary of loopback rules made explicit | service.md diff, `pnpm run check` docs gate |
| REQ-R02 | Schemas: `placement` and the conditional origin; positive and negative fixtures; a planted incompatible fixture (remote with `http://`, with launchd) seen rejected | `test/fixtures.test.ts`, plant run recorded |
| REQ-R03 | Semantic rules: FAC-SEM-010 local-only; new rule for remote shape (https, manager none, no launchd/port fields) | `test/service-rules.test.ts`, a plant per rule |
| REQ-R04 | Every existing descriptor and fixture stays valid unchanged | the unchanged fixture set green |
| REQ-R05 | DEC-0019 under lease with reserved id; CONTEXT, DOCMAP, README, `docs/evidence/sources.md` updated | `pnpm run check`, lease journal |
| REQ-R06 | `service-host` reads remote descriptors: validation, probe over https with the token and a longer timeout, remote state precedence, test vectors | package tests + `state-precedence.json` cases |
| REQ-R07 | Fabric Dashboards shows remote services in a global group: card, tiles, open-dashboard through the login code, no lifecycle controls, honest states | unit + e2e against a live remote sample over TLS; a browser look |
| REQ-R08 | Fabric Dashboards MCP: `list_services` carries `placement`; `link`/`open` work for a remote service | a real MCP client call (R-010) |
| REQ-R09 | Fabric stays correct with a remote descriptor in the services directory | Fabric's own run of the vectors |
| REQ-R10 | Skill: the remote path (boundary, steps), kits (Python + Node) — remote request guard, token-gated well-known, `Secure` cookie, remote descriptor installer; probe checks a remote service | kit tests, probe against the remote sample |
| REQ-R11 | Skill passes the skill standard and validator; adapter released to npm; local copies updated | validator exit 0, `npm view`, family launcher |
| REQ-R12 | Fabric Dashboards released (signed, notarized, feed) and installed here | RUNBOOK checks, installed version |
| REQ-R13 | The first online service serves the four protocol routes under its existing panel; token on its hosting platform; deployed | its tests, the probe against production |
| REQ-R14 | The operator dashboard registered on this machine and visible in the global group, opening signed in | `list_services`, the app opened |
| REQ-R15 | No public artifact names an operator agent | grep gate over every public diff |
| REQ-R16 | Fabric Dashboards UX scenarios (+ copy) for the global group | its UX lint |

## Carry-over

| id | Item | Home |
|---|---|---|
| CO-R1 | The first online service's own UX/UI/MCP review and adaptive layout (the other half of the operator's 02.10 request) — a separate run after this one | the owning private repository's backlog (open row) |
