# Runner catalogue

`covers:` Fabric agent-registry REQ-01, REQ-02 — DEC-0016 · locked in Fabric's
[agent-registry contracts](https://github.com/passioncode-ai/fabric/blob/main/docs/evidence/specs/2026-09-29-agent-registry-contracts.md)
§C2 (2026-09-29)

A **runner** is an installed coding agent a host can drive. A host finds runners from a
catalogue it ships as data, never by running whatever it finds on `PATH`. The
catalogue's shape is part of this contract so that every host reads it the same way; the
catalogue's contents belong to the host that ships it (Fabric: `registry/runners.json`).

Schema: [`runners.schema.json`](../../schemas/runners.schema.json) — the catalogue is a
JSON array of entries.

## C2. Runner catalogue — installed coding agents

Shipped with Fabric as data (`registry/runners.json`, versioned with the app), schema in the
contract (`runners.schema.json`). One entry per runner kind:

```json
{
  "kind": "claude-code",
  "name": "Claude Code",
  "binaries": ["claude"],
  "version": {"argv": ["--version"], "pattern": "^(\\d+\\.\\d+\\.\\d+)", "timeoutMs": 5000},
  "drive": "claude-headless",
  "drives": {
    "claude-headless": {"argv": ["-p", "--output-format", "stream-json", "--verbose", "--strict-mcp-config", "--mcp-config", "{mcpConfig}"]}
  },
  "mcpConfig": {"file": "~/.claude.json", "format": "claude-json", "key": "mcpServers"},
  "skillsDir": "~/.claude/skills",
  "docs": "https://code.claude.com/docs/en/headless"
}
```

`drive` ∈ `claude-headless | codex-app-server | codex-exec | acp | tui`. `tui` (DEC-0029) is the
runner's own interactive terminal interface in a terminal the host holds — what a host opens when
the conversation is the runtime's console. Initial catalogue: `claude-code`
(claude-headless), `codex` (codex-app-server; ADR-0081), `gemini-cli`, `goose`, `opencode`,
`cursor-agent`, `kiro` (acp).

**Kind names are shared.** A host that catalogues one of these runners uses this kind, so a route,
an account chain and an event mean the same runner on every host: `claude-code`, `codex`,
`cursor-agent`, `gemini-cli`, `goose`, `hermes` (Hermes Agent), `kilo`, `kimi-code` (Kimi Code
CLI), `kiro`, `opencode`, `cline`. A runner that is not listed takes a new name here before a host
ships it. `mcpConfig.format` ∈ `claude-json | codex-toml | cursor-json |
gemini-json | opencode-json | kiro-json | none`. Detection runs **only** the catalogued version
argv, without a shell, with the timeout; a binary not in the catalogue is never executed.
**FAC-SEM-016** a runner entry names exactly one default `drive` present in `drives`.

## What the schema adds

- `binaries` are bare executable names, never paths, so detection looks them up on
  `PATH` and runs nothing else.
- `version.argv` and every `drives.*.argv` are argument arrays; a shell string is
  invalid. `version.pattern` is a regular expression whose first group is the version.
- `version.timeoutMs` is at most 5000 — the design's "version answered within 5 s".
- `auth` (optional, DEC-0029) is the runner's own signed-in check: an argument array run like the
  version probe, with the same bound, whose exit status 0 means signed in. It is the only way a
  host may report a runner `not-connected`; a runner without `auth` is judged by its version probe
  alone.
- `drives` keys are drive names; `{mcpConfig}` in an argv is the placeholder a host
  replaces with the MCP configuration it generates for that run.
- `mcpConfig.file` and `skillsDir` are absolute or `~/` paths; `docs` is an HTTPS URL.

## Runner routes

`covers:` operator preference for terminal agents — DEC-0026, refined by DEC-0029 · operator
behavior: SCN-009 (served by the next available runner) and SCN-006 (a recorded switch).

A **runner route** is the ordered preference list a project pins for one capability served by
the local-runner profile — an agent chat, a repository change, any task a terminal agent runs. It
answers three questions: which installed runner serves this request now; may a terminal session
the host already holds be attached; what happens when the preferred runner is unavailable.

Schemas: [`runner-route.schema.json`](../../schemas/runner-route.schema.json) — an immutable
revision (DEC-0007); `runner-route` is also a versioned-setting kind, whose `payload` is the
route's body (`$defs/body`: the same fields without `kind` and `meta`) and is validated as such. A
`route-bundle` and a `route-event` carry the route in its revision form, with `meta`.
[`runner-route-event.schema.json`](../../schemas/runner-route-event.schema.json) — the record of
every selection, switch and exhausted walk.

### The route

- `candidates` is the preference order, first to last, at most 16. Each candidate names a
  `runnerKind` (a kind of the host's runner catalogue, `FAC-SEM-033`), an admitted provider
  revision (`FAC-SEM-030`) and a `session` policy. A candidate MAY name the catalogue `drive` the
  host runs it through (absent: the entry's default `drive`) and an `accountPool` of the route's
  project (absent: the binding's pool, which the host uses only when it serves the candidate's
  provider family — otherwise the candidate is passed over as `refused`).
- `session.attach: preferred` lets the host reuse a session it already holds (below) before it
  starts anything; `never` never attaches. `session.spawn: allowed` lets the host start a new
  process when nothing was attached; `never` forbids it. A candidate that can do neither is
  refused (`FAC-SEM-029`).
- `exhausted` (default `capability-unavailable`) is the answer when every candidate is passed
  over: an explicit capability-unavailable that carries every probe result, or `hold` — wait for
  a candidate to recover, at most the pinned execution context's `limits.wallSeconds`, then answer
  capability-unavailable. A host that cannot wait answers capability-unavailable under `hold` too;
  it never pretends to hold.
- `recovery` (default `sticky`) decides what the next launch of a conversation does: `sticky`
  keeps the runner that served it while that runner can serve, `reprobe` walks the route from the
  top again and may move the conversation back to a higher-preference candidate.

So the operator's request — "when no Claude Code session is open, a started Hermes answers" — is
this route ([fixture](../../fixtures/positive/runner-route.json)): `claude-code` with
`{attach: preferred, spawn: never}`, then the other runners with `spawn: allowed`, Hermes last. A
`claude-code` candidate with `spawn: allowed` would start a new Claude Code instead, which is the
right route for an operator who wants Claude Code whenever it is installed.

### The walk

A host resolves the route at the launch, from the first candidate down; for each one:

1. **Admitted, catalogued, installed, responding, connected.** The candidate's provider revision is
   still admitted for the capability, its kind is in the catalogue, the catalogue's version probe
   answers, and the entry's `auth` probe, when it has one, exits 0 — the only commands a host runs
   to judge a runner, each with its 5-second bound. A runner that answers but is signed out is
   `not-connected`, never available. A host MAY cache a probe result for the length of one walk.
2. **Attach** when `attach` is `preferred` and the host holds a live, idle session of that
   candidate: same runner kind and provider revision, same project and capability, started by this
   host under an execution context equal to the derived one (below), and not bound to another run,
   task or lease. A launch that needs a new session identity — a managed task start — never
   attaches; it spawns or passes the candidate over. A host never attaches to a process it did
   not start and still holds — an operator's own terminal, a tmux pane, another application's
   session: injecting a request into a terminal the host does not own is outside this contract.
3. **Spawn** when nothing was attached and `spawn` is `allowed`.
4. Otherwise the candidate is **passed over** with one probe result — `not-catalogued`,
   `not-admitted`, `not-installed`, `not-responding`, `not-connected`, `no-held-session` (attach
   preferred, nothing held, spawn never), `quota-unknown`, `refused` or `spawn-failed` — and the
   walk tries the next.

An **unattended** launch (a routine, a chain, a schedule) passes over a candidate whose quota or
account basis is unknown (`quota-unknown`); an operator-started launch may use it under the usual
checks. A quota or account gate is the walk's step for each candidate, never a gate before the walk
that judges only the first one. Permissions, the permission mode and grants belong to the launch,
never to the route: a candidate that cannot run under the launch's permission mode is passed over
as `refused`, never run with a looser or unknown mode, and the event names the mode the selected
runner actually received (`selected.permissionMode`).

A failure passes a candidate over only when it says that candidate cannot serve. Three classes:

| Class | Examples | The walk |
|---|---|---|
| candidate unavailable | not catalogued, not installed, not responding, signed out, quota unknown, the mode refused, a spawn that started no process | records the probe result, tries the next candidate |
| request invalid | the launch's own authority changed, the binding or grant no longer admits the request | stops; no other candidate is tried, the launch reports its own refusal |
| outcome unknown | a process may have started — a failure after spawn, a lost answer | stops and never starts a second process for the same request; the host reconciles first |

A host walks only the candidates the route names. It never appends others — the remaining rows of
its catalogue, a plain shell, an agent that cannot reach the capability's surface. Before a host
adopts routes it MAY order runners by a setting of its own; that ordering is not a route, and what
it records names no route revision.

The **derived execution context** of a selected candidate is the binding's pinned execution
context with `provider` replaced by the candidate's provider and, when the candidate names one,
`accountPool` by the candidate's pool. Every scope, limit and the working directory stay as pinned,
and so do the environment entries with a literal `value`. Two things do not cross to another
provider: `selectedAccount`, which account selection chooses again from the candidate's pool
([execution-context.md](execution-context.md)), and environment entries with a `secretRef`, because a
credential pinned for one runner is not handed to another — a candidate's credentials come from its
own pool. The host pins the derived context as its own revision, with the binding's context as its
parent, and names it in the event; it is the one revision a run creates after it starts, and it is
fully determined by revisions the run pinned before its first node ([versioning.md](versioning.md)). So a
route never widens write scope, never changes the model requirement, and never moves the run to
another project: the provider still owns model choice, and admission (DEC-0010) is untouched.

A **conversation** is the host's one continuing exchange — a chat thread, a task's session — and
its events share one `conversation` id. A **conversation never switches runner mid-turn**, and no runner-private session state is carried
from one runner to another. A switch happens only at a launch: when the runner serving the
conversation failed (`runner-failed`), when it is unavailable at the next launch
(`runner-unavailable`), or — under `recovery: reprobe` only — when a higher-preference candidate
is available again (`preferred-available`). The host MAY hand the new runner the conversation's
visible transcript, which is the host's own record.

### Binding a route

A binding pins a route with `runnerRoute`, overriding the project default for that agent. The
binding then MUST use the local-runner profile (the schema refuses `runnerRoute` on another
profile), and agree with the route (`FAC-SEM-032`): same project and capability, its `provider`
one of the candidates, its `runnerRoute` this route's revision. A reader that does not know routes
still finds a valid single-provider binding; the convention is that `provider` names the first
candidate.

### Events

Every walk ends in one event ([schema](../../schemas/runner-route-event.schema.json)):
`runner-selected` (which candidate, attached or spawned — an attached one names its `sessionRef` —
its derived execution context and the permission mode it received; `sticky: true` when a conversation
kept its runner and nothing above it was walked),
`runner-switched` (the same, plus `from` and a closed `reason`, for a conversation that moved; a
switch for `runner-unavailable` carries the `from` runner's own probe result as `fromProbe`), or
`runner-exhausted` (the `answer` and no selection). Each carries the route revision, project,
capability and run, the node and conversation where the launch has them, whether the launch was
operator-started or unattended, and the probe result of every candidate the walk passed over — each candidate above the selected one
exactly once, in order, or every candidate for an exhausted walk (`FAC-SEM-034`). It is the runner
analogue of the account switch event ([execution-context.md](execution-context.md)), with the probe
results as its evidence. A host records one event per launch's walk, exhausted walks included, and
never a record per repeated probe of an unchanged state; how its journal names the events is the
host's own vocabulary (Fabric: ADR-0125).

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| `FAC-SEM-016` | `runner` (and each entry of `runner-catalogue`) | the default `drive` is present in `drives` |
| `FAC-SEM-021` | `runner-catalogue` | one entry per runner kind |
| `FAC-SEM-028` | `runner-route` | one candidate per runner kind |
| `FAC-SEM-029` | `runner-route` | a candidate must be able to run: attach or spawn |
| `FAC-SEM-030` | `route-bundle` | every candidate names a provider revision — id, revision and content hash — admitted for the route's capability |
| `FAC-SEM-032` | `route-bundle` | the binding that pins the route has its project, capability and the local-runner profile, a candidate as its provider, and this route as `runnerRoute` |
| `FAC-SEM-033` | `route-bundle` | every candidate's kind is in the host's runner catalogue, and a named drive is one its entry offers |
| `FAC-SEM-034` | `route-event` | the event names this route; every candidate it names is that position of the route, by an integer index; the probes cover every candidate above the selection, in order (all of them when exhausted, none for a sticky relaunch, which needs a conversation and sticky recovery); attach, spawn, `no-held-session` and `spawn-failed` obey the session policy; `held` only under `exhausted: hold`; `preferred-available` only under `recovery: reprobe`, moving up |

`FAC-SEM-021` states the locked "one entry per runner kind" as a rule; it is new in this
revision because JSON Schema cannot express uniqueness by a property. The same limit shapes
`FAC-SEM-028` and `FAC-SEM-029`. `FAC-SEM-030` keeps a route honest about admission without
making the route a grant (DEC-0010); a `route-bundle` is `{route, admissions, binding?,
catalogue?}`, and `FAC-SEM-032`/`FAC-SEM-033` run when the optional parts are present. A
`route-event` is `{route, event}`.

Fixtures: the `runners-*`, `runner-route*` and `binding-runner-route*` entries of
[`fixtures/catalogue.json`](../../fixtures/catalogue.json); rule tests:
[`test/registry-rules.test.ts`](../../test/registry-rules.test.ts) and
[`test/route-rules.test.ts`](../../test/route-rules.test.ts).
