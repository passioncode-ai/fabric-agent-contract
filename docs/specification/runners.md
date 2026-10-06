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

`drive` ∈ `claude-headless | codex-app-server | codex-exec | acp`. Initial catalogue: `claude-code`
(claude-headless), `codex` (codex-app-server; ADR-0081), `gemini-cli`, `goose`, `opencode`,
`cursor-agent`, `kiro` (acp). `mcpConfig.format` ∈ `claude-json | codex-toml | cursor-json |
gemini-json | opencode-json | kiro-json | none`. Detection runs **only** the catalogued version
argv, without a shell, with the timeout; a binary not in the catalogue is never executed.
**FAC-SEM-016** a runner entry names exactly one default `drive` present in `drives`.

## What the schema adds

- `binaries` are bare executable names, never paths, so detection looks them up on
  `PATH` and runs nothing else.
- `version.argv` and every `drives.*.argv` are argument arrays; a shell string is
  invalid. `version.pattern` is a regular expression whose first group is the version.
- `version.timeoutMs` is at most 5000 — the design's "version answered within 5 s".
- `drives` keys are drive names; `{mcpConfig}` in an argv is the placeholder a host
  replaces with the MCP configuration it generates for that run.
- `mcpConfig.file` and `skillsDir` are absolute or `~/` paths; `docs` is an HTTPS URL.

## Runner routes

`covers:` operator preference for terminal agents — DEC-0026 · operator behavior
follows SCN-004 and SCN-006 (versioned fallback, recorded switch).

A **runner route** is the ordered preference list a project pins for one
capability served by the local-runner profile — an agent chat, a repository
change, any task a terminal agent runs. It answers three questions: which
installed runner serves this request now; may an existing terminal session be
attached; what happens when the preferred runner is unavailable.

Schema: [`runner-route.schema.json`](../../schemas/runner-route.schema.json) —
an immutable revision (DEC-0007); `runner-route` is a versioned-setting kind
whose `payload` carries the same shape, and a binding MAY pin one revision as
`runnerRoute` to override the project default for one agent.

- `candidates` is the preference order, first to last. Each candidate names a
  `runnerKind` (a catalogue kind) and an admitted provider revision.
- `session.attach` `preferred` asks the host to reuse a live terminal session
  of that runner before starting anything new; `never` always starts a fresh
  process.
- `session.spawn` `allowed` permits the host to start a new terminal process
  when no session is attached or attach is `never`; `never` forbids it.
- Detection and availability use only the catalogue's version probe — a host
  never runs anything the catalogue does not name (see above).
- `exhausted` (default `capability-unavailable`) says what happens when every
  candidate fails: return an explicit capability-unavailable result with every
  probe result attached, or `hold` the request until a candidate recovers,
  bounded by the execution context's limits.
- `recovery` (default `sticky`) says whether a running conversation stays on
  the runner it fell back to until that runner fails (`sticky`), or is
  re-probed and moved back to the highest-preference available candidate
  (`reprobe`).

Selection walks the candidates in order: attach to a live session when
`attach` is `preferred` and one exists; otherwise spawn when `spawn` is
`allowed` and the catalogue probe passes; otherwise record the probe result
and reason, and try the next candidate. When no Claude Code session is open,
the route answers from the next available candidate — Hermes starts and
replies — instead of failing the chat.

Every selection and every switch records from/to candidate, runner kind,
reason, route revision, run/node and time — the runner analogue of the account
switch event ([execution-context.md](execution-context.md)). A route never
changes the capability's semantics, profile, model requirement or write scope;
the provider owns model choice, and admission (DEC-0010) is untouched —
candidates must be admitted providers (FAC-SEM-030).

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| `FAC-SEM-016` | `runner` (and each entry of `runner-catalogue`) | the default `drive` is present in `drives` |
| `FAC-SEM-021` | `runner-catalogue` | one entry per runner kind |
| `FAC-SEM-028` | `runner-route` | one candidate per runner kind |
| `FAC-SEM-029` | `runner-route` | a candidate must be able to run: attach or spawn |
| `FAC-SEM-030` | `route-bundle` | every candidate names an admitted provider revision |

`FAC-SEM-021` states the locked "one entry per runner kind" as a rule; it is new in this
revision because JSON Schema cannot express uniqueness by a property. The same limit shapes
`FAC-SEM-028` and `FAC-SEM-029`; `FAC-SEM-030` keeps a route honest about admission without
making the route a grant (DEC-0010).

Fixtures: the `runners-*` and `runner-route*` entries of [`fixtures/catalogue.json`](../../fixtures/catalogue.json);
rule tests: [`test/registry-rules.test.ts`](../../test/registry-rules.test.ts) and
[`test/route-rules.test.ts`](../../test/route-rules.test.ts).
