# Provider entries `fabric-provider/0.1`

`covers:` Fabric agent-registry REQ-01 — DEC-0016, rulings DEC-0017 · locked in Fabric's
[agent-registry contracts](https://github.com/passioncode-ai/fabric/blob/03311c856b7771e5e4cfff967b138e89e292c67f/docs/evidence/specs/2026-09-29-agent-registry-contracts.md)
§C1 (2026-09-29)

An agent that is not a service — a CLI or a stdio MCP server — is announced by a
**provider entry**, the way a service is announced by its
[descriptor](service.md#descriptor). A host reads the entries to list the agent in its
registry. An entry, like a descriptor, grants no Project access: admission and binding
stay separate ([registry](registry.md), DEC-0010).

Schema: [`provider.schema.json`](../../schemas/provider.schema.json).

## C1. `fabric-provider/0.1` — an agent that is not a service

File: `<fabric home>/providers/<id>.json` (same root as `services/`; `FABRIC_PROVIDERS_DIR`
overrides), mode 0600, written only by the agent's installer, removed by its uninstaller.

| Field | Type | Rule |
|---|---|---|
| `protocol` | const `"fabric-provider/0.1"` | required |
| `id` | `^[a-z][a-z0-9-]{1,62}$` | required; unique across `providers/` and `services/` |
| `name`, `summary` | string ≤ 80 / ≤ 200 | required / optional |
| `manifest` | absolute or `~/` path to `fabric-agent.json` | required; the manifest's `provider.id` names this entry |
| `run` | one of `{mcp: {stdio: {command: [argv…], env: {NAME: "secret-ref:…"}, scope}}}` or `{mcp: {url: "http://127.0.0.1:<port>/mcp"}}` | required; argv arrays only, never a shell string, and no argument carries a credential (`FAC-SEM-057`); env values are secret references, never values (DEC-0013); `scope` is `project` or `on-demand` (the default), never `session` (`FAC-SEM-056`, DEC-0044) |
| `source.repository` | URL | optional |
| `installedAt`, `installedBy` | RFC 3339, string | required |
| `extensions` | object of absolute-URI keys | optional; unknown keys preserved |

Rules: **FAC-SEM-013** an id appears in at most one of `services/` and `providers/`;
**FAC-SEM-014** and **FAC-SEM-015** are as ruled below (DEC-0017): the entry's `providerId` equals the resolved
manifest's `provider.id`, and an `env` value is checked by its form. The text locked on 2026-09-29 (`provider.id`
equal to the slug `id`; an `env` value refused by name patterns) is superseded.

## Rulings (DEC-0017)

- **FAC-SEM-014 compares like things (OQ-0001).** The entry's slug `id` equals the stem
  of its file name, `providers/<id>.json`. The entry names its provider by URI in a
  required field `providerId`, and that URI equals the manifest's `provider.id`, compared
  URI to URI by their normal forms ([identifiers](identifiers.md), DEC-0076); the slug and the file stem compare as
  written; the manifest must resolve. Both halves are enforced.
- **FAC-SEM-015 checks a value by its form (OQ-0004).** Name patterns — password, API
  key, access token, client secret, private key — apply to *names*, such as the fields
  of a manifest. An `env` *value* is checked by its form: `secret-ref:NAME`, whose NAME is
  not itself a credential's shape. `secret-ref:EXAMPLE_API_KEY` is correct.

## Where the directory is

"Same root as `services/`" gives, per platform:

| Platform | Providers directory |
|---|---|
| macOS | `~/Library/Application Support/ai.passioncode.fabric/providers/` |
| Linux | `${XDG_DATA_HOME:-~/.local/share}/passioncode-fabric/providers/` |
| any | the value of `FABRIC_PROVIDERS_DIR` when set |

The file is written atomically (temporary file, `fsync`, rename), as a descriptor is.

## What the schema adds to the table

These follow from the table and are enforced by the schema:

- `providerId` is an absolute URI (DEC-0017).
- `manifest` ends in `fabric-agent.json`.
- `run.mcp` is exactly one of `stdio` or `url`; `command` is an argument array of at
  most 32 items.
- An `env` name is an environment variable name (`^[A-Z_][A-Z0-9_]*$`) and every value
  is `secret-ref:<reference>` — a reference to a secret the host resolves at start
  (DEC-0013), such as `secret-ref:example-agent/EXAMPLE_API_KEY`.
- `url` is `http://127.0.0.1:<port>/mcp`: loopback only, the port in range, no query.
- `run.mcp.stdio.scope` is `project`, `on-demand` or `session`; the last is spelled so that `FAC-SEM-056` refuses it
  by name ([profiles](profiles.md#where-a-stdio-server-is-declared), DEC-0044). A writer does not emit
  `run.mcp.stdio.scope` until the readers accept it: Fabric's registry (`apps/desktop/src/main/agentRegistry.ts:236`
  at `487ef5b0`) and the adapter's (`fabric_provider.py:119`) admit only `command` and `env` today. An absent `scope`
  is `on-demand`.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-013"></a>`FAC-SEM-013` | `provider-directory` | no id is both a service and a provider, or two providers |
| <a id="fac-sem-014"></a>`FAC-SEM-014` | `provider-observation` | the entry's `id` is its file name's stem; its `providerId` equals the resolved manifest's `provider.id`, by normal form (DEC-0076) |
| <a id="fac-sem-015"></a>`FAC-SEM-015` | `provider-entry` | every `env` value has the form `secret-ref:NAME`, and NAME is not itself a credential |

A provider entry is also read by `FAC-SEM-056` (a stdio server's scope) and `FAC-SEM-057` (no credential in
`command` or `url`), defined in [profiles](profiles.md#semantic-rules) because they apply to every document that
declares a server or a command line.

The readings AR-1 left open (OQ-0001, OQ-0004) were ruled by DEC-0017, above.

Fixtures: the `provider-*` entries of [`fixtures/catalogue.json`](../../fixtures/catalogue.json);
rule tests: [`test/registry-rules.test.ts`](../../test/registry-rules.test.ts).
