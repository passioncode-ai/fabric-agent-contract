# What an agent uses: `fabric-connections/0.1`

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

The protocol is named `fabric-connections/0.1` in the revision register
([`src/protocol-revisions.ts`](../../src/protocol-revisions.ts) `NAMED_ONLY`, [versioning](versioning.md#protocol-revisions));
DEC-0096 recorded it as `extensions/connections/0.1`, and the extension key below keeps that path unchanged.

A service MAY carry, under `extensions` in its well-known document, the key
`https://fabric.passioncode.ai/agent-contract/extensions/connections/0.1` with `{connections: [...]}`, at most 64
entries:

| Member | What |
|---|---|
| `id` | `^[a-z0-9][a-z0-9._-]{0,63}$`, once in the list; a `degraded[].source` equal to it is this connection failing. A slot's setup entry and the overflow entry never read as a failing connection: a slot's name (`^[A-Z][A-Z0-9_]{0,63}$`) and the overflow source `fabric.source.json#slots` fall outside this grammar ([source](source.md#starting-without-the-instance)), and a change to the grammar must keep that |
| `kind` | `service` (another agent), `model`, `connector`, `store` or `channel` |
| `target` | what it reaches, 1 to 200 characters, no space: for a `service` an `id.instance` key or a product id (lower case, `^[a-z0-9][a-z0-9-]{0,63}(\.[a-z0-9][a-z0-9-]{0,63})?$`), `provider/model` for a `model`, otherwise a name |
| `capability` | only on a `service`: the capability it calls, a [capability name](interop.md#capability-names) (DEC-0020) |
| `state` | `ok`, `degraded`, `down` or `unknown` |
| `label`, `purpose`, `reason` | optional, one line of 1 to 300 characters each |
| `lastAt` | optional, when the service last used it or saw it work, an RFC 3339 date-time (a date alone is refused) |

No other member: a call count belongs to the [usage report](service.md#usage-report), and the reverse view (which agents
use this one) is the host's, built from every agent's declaration.

No string member carries a credential or a URL with one. What counts is defined by the reference, `credential` in
`src/connections.ts`, and the vectors `fixtures/vectors/connections.json` that every port runs; in summary:

- a JWT anywhere in the member;
- a provider key where it starts a word, with case-sensitive prefixes (`sk-`, `ghp_`, `xoxb-`, `glpat-` in lower case,
  `AKIA` in upper case, so `SK-Telecom-…` is a name): `sk-` and then 16 or
  more characters holding a digit and an upper-case letter, or 32 or more holding a digit (an OpenRouter key is
  lower-case hex); `ghp_` and its kin, `xoxb-` and its kin, `AKIA`, `glpat-`; a Telegram bot token, a bot id of 6 to 12
  digits, `:` and a secret of 34 or 35 characters mixing cases. `flask-server`, `sk-learn-classifier-v2`,
  `sk-prod-eu-west-1-db`, `20261021:connections-reader-v2` and a ticket `123456789:Implement-the-Connections-tab-reader`
  are names;
- `Bearer` and a token of 12 or more characters holding a digit ("bearer authentication" is prose);
- in `label`, `purpose`, `reason` and the `target` of any kind but `model`: a run of 40 or more characters of
  `A-Z a-z 0-9 + / = _ -` that holds upper case, lower case and a digit, in a piece split at spaces and read whole
  (the shared `longSecret`). An AWS secret access key that holds all three (all but about one in a thousand)
  is one, with or without `/`, and so are a slug such as `Prod-Analytics-Warehouse-EU-West-1-Replica`, a long ticket
  title holding a digit, a long mixed model id written in a purpose and a config line `NAME=value` of 40 or more such
  characters; a hex digest, and a bare Notion id, are lower case and are not. A
  model's `target` is not checked for a long run outside a URL, and `id` and `capability` are lower case. In a piece
  that holds a URL, the text before its first scheme's `://` is read for a long run (whatever is glued to the scheme), and the URL
  as below;
- any URL in the member, at its start or inside prose, that carries a credential as the shared `secretUrl` reads it
  (DEC-0044's detector: a password, a parameter such as `api_key` with a value, and its own shapes, which since
  DEC-0151 take a word start with escapes, canonical-case prefixes and the `sk-` strength), plus the Telegram shape, which keeps its word start there. A URL runs from each scheme in a
  piece to the next space (any whitespace: a tab or a no-break space ends it too); it is read without the brackets, quotes and punctuation that close a sentence, and with
  one of them put back, since `]` closes an IPv6 host. Inside a URL nothing is promised beyond what `secretUrl`
  finds: it reads a path between its separators, so a secret a `/` splits into short pieces can pass, and its gaps
  are CT-73's.

A URL written without a scheme (`api.example.com/?api_key=…`) is not read as one. A name that matches a shape, such as
a store `sk-Prod-eu-west-1-db` or a URL path segment of 40 or more mixed
characters (a Google Docs document id, or a Notion link whose segment joins the page title and its id; a bare Notion
id is lower-case hex), hides the whole declaration; its author removes a model id from the text or declares it as a
model connection of its own whose `target` is the id, drops the link, or renames a target that is the author's own
name. These shapes are a variant of the shared detector in `src/secret-shape.ts` (DEC-0044). Since DEC-0151 the shared
detector has a word-start boundary too (with escapes), canonical-case prefixes and the `sk-` strength, so a URL path
holding a weak `sk-` name, such as `sk-learn-classifier-v2`, no longer hides a declaration. The remaining differences:
the Bearer rule (a token's length and digit; the shared `secretValue` reads a value that starts with `Bearer` and a
space as a credential whatever follows), the per-member long run (none in a model's `target` outside a URL), the Telegram bot
token, which only a connection reads, the escapes (a connection reads none before a provider prefix, so a key after a
percent-escape, a backslash escape whose last character is a letter or digit (`\n`, `\042`, `\u0022` and the like) or an ESC colour sequence passes a connection while the shared detector finds it),
and the bound (a connection's `sk-` look-aheads are unbounded, CT-213, so a digit beyond 256 characters still counts
there). Whether the shared detector adopts the first three, and the connection the last two, is CT-73.

## Reading it

`connectionsView(wellKnown)` is the reference: it never throws. Without the key nothing is declared. A value that is
invalid against the schema, names an `id` twice or carries a credential is not declared and is reported; a host shows
the agent as having declared nothing and says why, and never trusts a connection as authority (it is data, as every
well-known member is). A valid list comes back with `failing` set on each connection a `degraded[].source` names. A
service that names a failing connection in `degraded[]` reports a status other than `ready` (`FAC-SEM-011`); a
connection that is down while the service stays ready is shown by its `state` alone. A `service` connection whose
listener the host reads as `foreign` or `foreign-user` is `down`, as a node summary reports it
([service](service.md#ha-2) HA-2, DEC-0154). A host resolves a `service`
target to an installed agent to draw the chain.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-127"></a>`FAC-SEM-127` | `service-well-known` | a value under the connections extension key is valid against `service-connections-extension.schema.json`, names each `id` once and carries no credential in any string member (`id`, `target`, `capability`, `label`, `purpose`, `reason`) (DEC-0096) |

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
