# What an agent uses: `extensions/connections/0.1`

DEC-0096 · rule code `FAC-SEM-127` · schema
[`service-connections-extension.schema.json`](../../schemas/service-connections-extension.schema.json) · code
[`src/connections.ts`](../../src/connections.ts) (`connectionsView`, `connectionsRules`) · vectors
[`fixtures/vectors/connections.json`](../../fixtures/vectors/connections.json), written by
[`tools/vectors/connections.ts`](../../tools/vectors/connections.ts) · tests
[`test/connections.test.ts`](../../test/connections.test.ts)

A service's [well-known document](service.md#well-known-document) says what it offers (its surfaces, its MCP
capabilities). This extension says what it uses: the other agents it calls, the models, connectors, stores and channels
it depends on, and whether each works now, so a host can draw the chain from one agent to the next. Fabric Dashboards
asked for it for its Connections tab (board thread `131648c0`, 2026-10-20).

## The declaration

A service MAY carry, under `extensions` in its well-known document, the key
`https://fabric.passioncode.ai/agent-contract/extensions/connections/0.1` with `{connections: [...]}`, at most 64
entries:

| Member | What |
|---|---|
| `id` | `^[a-z0-9][a-z0-9._-]{0,63}$`, once in the list; a `degraded[].source` equal to it is this connection failing |
| `kind` | `service` (another agent), `model`, `connector`, `store` or `channel` |
| `target` | what it reaches, 1 to 200 characters, no space: an `id.instance` key or a product id for a `service`, `provider/model` for a `model`, otherwise a name |
| `capability` | only on a `service`: the capability it calls |
| `state` | `ok`, `degraded`, `down` or `unknown` |
| `label`, `purpose`, `reason` | optional, one line of 1 to 300 characters each |
| `lastAt` | optional, when the service last used it or saw it work (RFC 3339) |

No other member: a call count belongs to the [usage report](service.md#usage-report), and the reverse view (which agents
use this one) is the host's, built from every agent's declaration. No member carries a credential or a URL with one
(the same detector as [local channel](local-channel.md) LC-21, `secretUrl`).

## Reading it

`connectionsView(wellKnown)` is the reference: it never throws. Without the key nothing is declared. A value that is
invalid against the schema, names an `id` twice or carries a credential is not declared and is reported; a host shows
the agent as having declared nothing and says why, and never trusts a connection as authority (it is data, as every
well-known member is). A valid list comes back with `failing` set on each connection a `degraded[].source` names. A
host resolves a `service` target to an installed agent to draw the chain.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| `FAC-SEM-127` | `service-well-known` | a value under the connections extension key is valid against `service-connections-extension.schema.json`, names each `id` once and carries no credential in `target`, `label`, `purpose` or `reason` (DEC-0096) |

## Compatibility

Additive: a new extension key, which a host that does not know it ignores ([service](service.md): a host MUST preserve
and ignore unknown `extensions`). `contractVersion` stays `0.1.0`.

## Who adopts it

- **Fabric Dashboards** reads it for its Connections tab (FD-78) and re-pins its reader (`connectionsOf`) to these
  vectors.
- **fabric-agent-adapter** lets both service kits emit it from a list the service declares, `state` from the kit's own
  health checks and a `degraded[].source` equal to the connection's `id` (FAA-62).
- **Fabric** MAY read it for its own map of the estate.

The board row is CT-70.

## Not decided here

- A `direction` (reads, writes): `purpose` says it in words until a reader needs it as data.
- How a host joins two agents' declarations into one chain beyond matching a `service` target to an installed agent.
