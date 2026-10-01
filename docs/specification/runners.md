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

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| `FAC-SEM-016` | `runner` (and each entry of `runner-catalogue`) | the default `drive` is present in `drives` |
| `FAC-SEM-021` | `runner-catalogue` | one entry per runner kind |

`FAC-SEM-021` states the locked "one entry per runner kind" as a rule; it is new in this
revision because JSON Schema cannot express uniqueness by a property.

Fixtures: the `runners-*` entries of [`fixtures/catalogue.json`](../../fixtures/catalogue.json);
rule tests: [`test/registry-rules.test.ts`](../../test/registry-rules.test.ts).
