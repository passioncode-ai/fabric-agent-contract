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
| `target` | what it reaches, 1 to 200 characters, no space: for a `service` an `id.instance` key or a product id (lower case, `^[a-z0-9][a-z0-9-]{0,63}(\.[a-z0-9][a-z0-9-]{0,63})?$`), `provider/model` for a `model`, otherwise a name |
| `capability` | only on a `service`: the capability it calls, a [capability name](interop.md#capability-names) (DEC-0020) |
| `state` | `ok`, `degraded`, `down` or `unknown` |
| `label`, `purpose`, `reason` | optional, one line of 1 to 300 characters each |
| `lastAt` | optional, when the service last used it or saw it work, an RFC 3339 date-time (a date alone is refused) |

No other member: a call count belongs to the [usage report](service.md#usage-report), and the reverse view (which agents
use this one) is the host's, built from every agent's declaration.

No string member carries a credential or a URL with one:

- a JWT anywhere in the member;
- a provider key's shape where it starts a word: `sk-` and then 16 or more characters holding a digit and an
  upper-case letter, or 32 or more holding a digit (an OpenRouter key is lower-case hex); `ghp_` and its kin, `xoxb-`
  and its kin, `AKIA`, `glpat-`; a Telegram bot token, a bot id and a secret of exactly 35 characters that mixes cases.
  So `flask-server`, `sk-learn-classifier-v2`, `sk-prod-eu-west-1-db`, `20261021:connections-reader-v2` and a ticket
  `123456789:Implement-the-Connections-tab-reader` are names, not keys;
- `Bearer` and a token holding a digit ("bearer authentication" is prose);
- any URL in the member, at its start or inside prose, that carries one (`secretUrl`: a password, or a parameter such
  as `api_key` with a value). A URL runs from each scheme in a piece to the next space; it is read without the
  brackets, quotes and punctuation that close a sentence, and with one of them put back, since `]` closes an IPv6
  host.

A URL written without a scheme (`api.example.com/?api_key=…`) is not read as one. A URL whose path holds 40 or more
mixed letters and digits is taken for a key (`secretArgument`), and so is a store named, say, `sk-Prod-eu-west-1-db`
(an upper-case letter and a digit in 16 or more characters after `sk-`); either hides the whole declaration. These
shapes are a variant of the shared detector in `src/secret-shape.ts` (DEC-0044): narrower by the word start and the
`sk-` rules, wider by the Telegram bot token. Whether the shared detector adopts them is CT-73.

## Reading it

`connectionsView(wellKnown)` is the reference: it never throws. Without the key nothing is declared. A value that is
invalid against the schema, names an `id` twice or carries a credential is not declared and is reported; a host shows
the agent as having declared nothing and says why, and never trusts a connection as authority (it is data, as every
well-known member is). A valid list comes back with `failing` set on each connection a `degraded[].source` names. A
host resolves a `service` target to an installed agent to draw the chain.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| `FAC-SEM-127` | `service-well-known` | a value under the connections extension key is valid against `service-connections-extension.schema.json`, names each `id` once and carries no credential in any string member (`id`, `target`, `capability`, `label`, `purpose`, `reason`) (DEC-0096) |

## Compatibility

Additive: a new extension key, which a host that does not know it ignores ([service](service.md): a host MUST preserve
and ignore unknown `extensions`). `contractVersion` stays `0.1.0`.

## Who adopts it

- **Fabric Dashboards** reads it for its Connections tab (FD-78) and owes the re-pin of its reader (`connectionsOf`)
  to these vectors (CT-70), before any kit emits the key.
- **fabric-agent-adapter** owes the emission in both service kits (FAA-62), after Dashboards' re-pin: from a list
  the service declares, `state` from the kit's own health checks and a `degraded[].source` equal to the connection's
  `id`.
- **Fabric** MAY read it for its own map of the estate.

The board row is CT-70.

## Not decided here

- A `direction` (reads, writes): `purpose` says it in words until a reader needs it as data.
- How a host joins two agents' declarations into one chain beyond matching a `service` target to an installed agent.
