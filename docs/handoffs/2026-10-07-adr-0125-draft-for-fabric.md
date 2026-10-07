# ADR-0125 — An agent launch may follow the operator's fallback order, resolved before the session opens

**Status:** accepted · 2026-10-07 · operator request («везде, где есть чаты с агентом — терминальные
агенты по настройке с выбором и fallback; нет сессии Claude Code — отвечает запущенный Hermes») · plan
CO-223 · contract DEC-0026 as refined by DEC-0029 (`fabric-agent-contract`, 2026-10-07). This record
replaces the proposal of the same number in PR #18, which a review against the host code at `a655b068`
found unworkable in seven places (listed under *What the first proposal got wrong*).

## Context

The contract now defines a **runner route**: an ordered list of admitted candidates, each with a session
policy, walked from the top at a launch, every candidate passed over with a closed probe result, a
selected candidate run under the *derived execution context* — the pinned one with only the provider
replaced (DEC-0029). It also says what a host may do before it adopts routes: order runners by a setting
of its own, as long as what it records names no route revision.

What the host has (read at `a655b068`):

- **Two entry points reach every session today.** The ad-hoc terminal (`IPC.terminalOpen`,
  `index.ts:4149`) and the managed launch's `prepare` (`index.ts:2768`), which serves `tasks.start`,
  `tasks.startExisting`, `tasks.research`, chain advance and routine tick through `startTask`. Both end in
  `PtyManager.open` (`pty.ts:276`), which validates and spawns one runner and throws when it is not
  available (`pty.ts:302-304`). The owned-backend path (ADR-0081, AS-13) and the CEO session (ADR-0123
  §2) are not wired yet.
- **A launch names one runner and gets that runner or an error.** `prepare` substitutes `'claude-code'`
  for an empty option (`index.ts:2771`), chain advance does the same (`chainAdvance.ts:448`), and the
  pickers silently pick the first available runner when the default is missing (`Tasks.tsx:158-167`,
  `ProjectHome.tsx:1462-1477`).
- **Availability is `which`** (`launchOptions`, `pty.ts:130-152`); the first run's detection
  (`executorDetect.ts`) knows found/unresponsive/missing and a bounded sign-in observation
  (`executorAuth.ts`).
- **Quota has one basis, Claude's** (`quota.ts:1`); routine tick claims it before it starts a task
  (`routineTick.ts:206-207`), and ADR-0119 forbids running unattended on an unknown quota.
- **Sessions are Fabric-spawned PTYs** (`PtyManager.sessions`); a managed launch requires the session id
  its admission minted (`managedLaunch.ts:72-82`), so it can never reuse another session.
- **App settings are device-local** (`settings.ts:1-5`) and installed runners are a fact about the device.

## Decision

1. **The fallback order is an installation setting, and it is not a route.** Settings → Agents carries
   an ordered list of runners, each with a session policy: *open a new session*, *use an open session,
   otherwise open a new one*, or *use an open session only*. It lives in the device-local settings file,
   next to theme and locale, because which runners exist is a fact about this computer. Following
   DEC-0029, what Fabric records of it names the basis `host-order`, never a route revision. When the
   project-pinned contract route lands (the contract repin, CO-223's later step), it takes precedence
   over this list and its records name its revision; the list then remains the installation's default.
2. **"Fallback order" is a launch choice, never a silent substitution.** Every picker that offers a
   runner offers *Fallback order* as one more choice when the list is not empty, and shows the runner it
   resolves to right now. Choosing a runner by name launches that runner or fails, as today. Only the
   *Fallback order* choice walks the list, so the picker and the launch can never disagree, and a person
   who asked for Codex never gets Claude.
3. **The walk runs in the main process, before the session exists, at both entry points** — the ad-hoc
   terminal and the managed launch (`tasks.start` with the fallback choice). `PtyManager.open` stays the
   final validator and refuses exactly what it refuses now. The walk is a pure function
   (`shared/runnerRoute.ts`) over the list and a probe; for each candidate, in order:
   - **catalogued** — a row of `shared/agents.ts` (the catalogue until AS-03), never `shell`;
   - **installed and responding** — the detection's found state;
   - **signed in** where the detection can tell (`executorAuth.ts`), otherwise judged by the version
     answer alone, as the contract allows;
   - **the launch's permission mode** — the candidate accepts the mode (`mayLaunch`) and its containment
     for it is not weaker than the containment the first candidate would have had (`containmentFor`), so
     a fallback never trades *ask before each tool* for *no gate*;
   - **the result channel** — for a managed task, not weaker than the first candidate's, so a task that
     would report on the surface is not handed to a runner that cannot;
   - **the surface**, for `acp-session` and `config-content-env` runners, which cannot start without it;
   - **attach** (ad-hoc terminal only), when the entry allows it: a live, idle Fabric-held session of
     that runner in the same project, not bound to a task (`taskBySession`) and not opening. Attaching
     hands it the instruction through the same delivery as a new session. A managed launch never
     attaches: its admission minted a new session identity;
   - **spawn**, when the entry allows it.

   A candidate that fails a step is passed over with the contract's probe result (`not-catalogued`,
   `not-installed`, `not-responding`, `not-connected`, `no-held-session`, `refused`). The walk walks
   only the list: never the rest of the catalogue, never a plain shell.
4. **Three failure classes, as the contract states them.** Candidate-unavailable moves to the next.
   Request-invalid — the launch authority changed (`beforeSpawn`), the identity guard refused — stops the
   walk with the launch's own error. Outcome-unknown — `PtyLaunchFailure`, a process may be alive — stops
   and is never retried on another runner. In this decision a spawn that throws (`SpawnFailure`) on the
   ad-hoc path moves to the next candidate; on the managed path it fails the launch, because the task
   was created with the selected runner and a second runner under one admission is a second claim on it.
5. **Unattended launches stay where ADR-0119 put them.** A routine or chain uses the runner it names. Only
   Claude Code has a quota basis today, so a fallback order for an unattended launch would pass over every
   other runner as `quota-unknown`; the routine's Claude gate therefore stays before the start, and the
   walk is not offered to routines and chains until AS-09 gives another runner a quota basis.
6. **What is recorded.** A launch that walked the list records the walk in `terminal.opened@1`, additively:
   `route: { basis: 'host-order', requested: 'fallback-order', selected_index, session: 'spawned' |
   'attached', probes: [{ index, runner, result, detail? }] }` — every candidate above the selected one,
   in order, as DEC-0029's event does. An attach records no new `terminal.opened@1`; it records nothing
   in the journal, and the person sees which session answered. An exhausted walk opens nothing and so
   records no estate fact: the person is answered with every candidate and the reason it was passed over,
   and the ops log keeps the same. `permission_mode` in `terminal.opened@1` becomes the mode the runner
   actually received — `null` for a runner without modes — instead of the mode that was asked for
   (the A6-006 class this review found again).
7. **Kimi Code becomes a catalogue row, unconnected until probed.** `kimi-code` (the contract's shared
   kind name), program `kimi`, run as itself in the project directory — its TUI — with modes *plan*
   (`--plan`), *ask* (no flag) and *bypass* (`--auto`, which never asks; `--auto` joins the named
   `BYPASS_FLAGS`). It does not connect to the surface until its ACP session (`kimi acp`) is probed
   through Fabric's ACP shell, the way ADR-0119 brought Hermes in. Its result channel is `none`, so it is
   not a fallback for a task that reports on the surface.
8. **Sticky by construction.** A walk happens at a launch; a running session never changes runner.

## What the first proposal got wrong

The proposal of 2026-10-07 resolved inside `PtyManager.open`, below the routine's quota gate, so a
Claude quota pause could never reach Hermes; it put `projects.default_agent` (never empty, default
`claude-code`) first, which made the Settings list unreachable and overrode the person's own pick; it
appended "the remaining available catalogue rows", which reaches `shell` and runners without the
surface; it attached managed launches to existing sessions, which their admission forbids; it left the
failure classes undefined; it planned journal events with no migration or ingress owner and without the
contract's reason and run fields; and it named AS-09 for probes (AS-06 is probes; AS-09 is quota-less
routines). DEC-0029 in the contract closed the matching gaps on the contract side.

## Not decided here

The project-pinned contract route and its `runner.selected@1` / `runner.switched@1` journal events (they
need the contract repin, a migration and an ingress owner); foreign-session attach (tmux, Terminal.app);
the owned-backend and CEO-session entry points, which call the same walk when they are wired; the other
hard-coded `'claude-code'` defaults (`runtimeObserver.ts:34`, `index.ts:1267,1536,3402`,
`workspace.ts:328`, `onboardingDraft.ts:52`, the `default_agent` column default); Fabric Dashboards'
console and Fabric Switchboard's chains, which keep their own lists until each adopts the contract
route (their backlogs carry the rows).

## Consequences

- **Modules:** `shared/runnerRoute.ts` (the walk), `main/runnerFallback.ts` (probes, attach lookup, the
  record), `shared/appSettings.ts` and `shared/types.ts` (the setting), `main/index.ts` (`terminalOpen`,
  `tasks.start`), `main/pty.ts` (`runnerKind` on a live session, the attachable lookup, the additive
  `terminal.opened@1` fields, the applied mode), `shared/agents.ts` and `shared/containment.ts`
  (`kimi-code`, `--auto`), the Settings page and the two pickers.
- **Registers:** CO-223 stays open for the contract route; this decision is its first shipped step.
  ADR-0119 stays the runner-row authority, ADR-0123 the conversation authority.
- **Vision check** (`docs/ux/vision.md` §9): principle 2 — the agent serving a conversation may change
  without the Project losing its purpose, history or evidence; the console stays the runtime's own.
