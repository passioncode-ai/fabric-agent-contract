# Session handoff (`session-handoff/1`)

`covers:` Fabric 0.4.0 REQ-06 — DEC-0042 · Fabric ADR-0140, agreed with Fabric Dashboards (fabric-dashboards-76)

DEC-0042 is normative. It implements Fabric
[ADR-0140](https://github.com/passioncode-ai/fabric/blob/2242628117482e8b2b9d647bc56ae231781d62ba/docs/adr/0140-a-session-is-handed-its-context-in-one-format-session-handoff-1.md)
(Fabric 0.4.0 REQ-06, plan canvas C3), agreed between Fabric and Fabric Dashboards on 2026-10-11.

A **session handoff** is the folder a host writes for one coding-agent session before the session's first turn:
what the agent is working on (`context.md`), how it reaches the host's MCP server (`mcp.json`), optionally its
brief (`brief.md`) and its task (`task.md`), and a manifest (`handoff.json`) that says how all of it is carried
to the runtime. Fabric writes one for each session it launches; Fabric Dashboards writes one for each console it
opens on an agent; Switchboard carries the arguments in place. A Fabric agent opened in Dashboards' console and a
Dashboards agent opened from Fabric carry the same format.

The manifest's schema is
[`session-handoff.schema.json`](../../schemas/session-handoff.schema.json). The kit's checker is
`validateSessionHandoff(dir)` in [`src/session-handoff.ts`](../../src/session-handoff.ts).

## Relation to other documents

- **Not an execution context.** An [execution context](execution-context.md) is the host's policy for a run
  (environment allowlist, account pool, limits). A session handoff is what that run's agent is handed to read.
- **Above Fabric's `execution-packet/1`.** Fabric materialises the context it hands a session as a
  content-addressed packet (`executionPacket.ts`): its identity is the digest of the bytes, and a blob that does
  not verify blocks the start. That integrity layer stays underneath and is not replaced: a handoff names it in
  `integrity` (SH-12), and the packet's digest of `context.md` is the digest of the handoff's `context.md`.
- **Not task-pipeline's dispatch packet**, which the name `execution-packet/1` also means elsewhere; this is why
  the format has its own name (Fabric 0.4.0 plan, resolution R-01).

## The folder

**SH-1 — Where it lives.** The folder is in the writing host's user-data folder (Fabric:
`<userData>/sessions/<session id>`; Dashboards: `<userData>/consoles/<agent key>`), never in a repository: no
ancestor of the folder holds `.git`. The folder is a folder, not a link to one. It is the host's material, not
the project's, and a copy committed to a repository would be a stale copy of a moving store.

**SH-2 — Modes.** On a POSIX host the folder is `0700` and every file in it `0600`: the files may hold a
credential, and a listable folder still publishes the session ids. On Windows access is the profile's ACL and the
modes are not checked.

**SH-3 — The files, and nothing else.** The folder holds `handoff.json` and exactly the files its `files` lists:

| File | When | Holds |
|---|---|---|
| `handoff.json` | always | the manifest, [`session-handoff.schema.json`](../../schemas/session-handoff.schema.json) |
| `context.md` | always | what the agent is working on, in Markdown, readable by a person; Fabric: the compiled, cited context pack, or a short note saying it could not be compiled |
| `mcp.json` | always | the host's MCP server, in the `mcpServers` dialect (SH-9) |
| `brief.md` | when `brief.delivery` is `file` | the brief: the agent's own text, then the preamble |
| `task.md` | when the session is opened for a task | the task, in Markdown |

Each listed file is a regular file (not a link, not a folder) and not empty. A file the manifest does not list —
a temporary file left by an interrupted write, a stray credential — is refused. A writer writes each file whole
(a temporary file renamed over it) and removes a `task.md` left by an earlier start.

**SH-4 — The launch names this folder's own files.** Where the launch names a file by path (Claude Code's
`--mcp-config=` and `--append-system-prompt-file`), it names this folder's `mcp.json` and `brief.md` by their
absolute paths. A host compares the path (and SH-11's `mcp.json` name): byte for byte on POSIX, macOS included even on
a case-insensitive volume; on Windows with either separator and in any case (`samePath` in `src/session-handoff.ts`,
DEC-0145).

## The manifest

| Field | Meaning |
|---|---|
| `format` | `session-handoff/1` |
| `writer` | the writing product's id and version |
| `writtenAt` | when the folder was written |
| `lifetime` | `{kind: "session", session}` or `{kind: "agent-key", agentKey}` (SH-5) |
| `files` | the handoff's files besides `handoff.json` (SH-3) |
| `firstCall` | the one tool the session calls first (SH-7) |
| `preamble` | the host's text that ends the brief (SH-6) |
| `mcp` | `auth` (`bearer` or `none`) and `strict` (SH-9, SH-11) |
| `brief` | `{delivery: "inline", text}` or `{delivery: "file"}` (SH-8) |
| `launch` | `runtime`, the `args` the handoff adds to the runtime's own command, and the `env` it sets (SH-10, SH-11) |
| `integrity` | optional: the `execution-packet/1` digests of the files materialised underneath (SH-12) |

## Lifetime

**SH-5 — Declared, and a bearer lives for one session.** `lifetime` is declared, not forced: a folder per
session (Fabric: created immediately before the spawn and removed the moment that session is over, including a
session that never started) or a folder per agent key, kept and rewritten on each start (Dashboards). A one-shot
bearer (`mcp.auth: bearer`) is minted for one session and lives only in a per-session folder; a folder kept per
agent key holds no secret (`mcp.auth: none`).

## The first call and the preamble

**SH-6 — The preamble names one tool and holds no rule.** The preamble is one line of at most 600 characters
that names the first call's tool and no other tool, and tells the agent to call it before anything else and to
say so and stop if it fails. It holds no rule: the rules for the session are what the first call returns, so a
rule is never in two places, and the copy in a system prompt is never the one that went stale. The brief ends
with the preamble, so the last thing the session is told is where its rules live. Checked: the length, the one
line, the tool it names and the absence of any other snake_case tool name; that its sentences state no rule is
for review.

**SH-7 — The first live call.** For Fabric it is `fabric_whoami` on the server `fabric`; for a service console it
is `service_context` on the server `fabric-dashboards`, with the agent's key as `arguments.key`. No other first
call is a `session-handoff/1` first call (the schema's `firstCall`).

Fabric's preamble (`shared/preamble.ts#PREAMBLE`, unchanged by this decision):

> You are running inside Fabric, which is watching this session and holds the rules that apply to it. Call the
> fabric_whoami tool before you do anything else: it returns this project, what Fabric already remembers about
> it, the task you were opened for if there is one, and the rules for this session. Those rules are current and
> anything you recall about how Fabric works is not. If the call fails, say so and stop rather than guessing what
> it would have said.

## The brief

**SH-8 — Inline up to 1000 characters, or a file.** `brief.delivery` is declared:

- `inline`: the brief travels in one launch argument, at most 1000 characters and with no control character (a
  newline included), and the manifest repeats it in `brief.text`; there is no `brief.md`. One argument of that
  size passes every carrier, Switchboard's in-place launch included (at most 16 arguments after `--`, each at most
  1024 characters, no control characters — Switchboard `docs/CLI.md`, `docs/CONTRACTS.md` "Launch in place").
- `file`: the brief is `brief.md`, and the launch names its path (an argument, the runtime's own config document,
  or the host's launch document). A brief longer than 1000 characters, or with more than one line, is delivered as
  a file — never truncated.

## MCP

**SH-9 — `mcp.json` reaches the first call's server as `mcp.auth` declares.** `mcp.json` is
`{"mcpServers": {<name>: <server>}}` and names the first call's server. With `mcp.auth: bearer` that server is
`{type: "http", url, headers: {Authorization: "Bearer <token>"}}`. The token is the session bearer of
[delegation](delegation.md) (DEC-0039): minted for this session, the credential the session exchanges for
delegation tokens, revoked when the session ends (Fabric: the agent surface's one-shot bearer). With `mcp.auth: none` it is
`{type: "stdio", command, args, env?}` and no server in the file carries a header or a credential in its
environment (Dashboards' MCP launcher; Fabric's terminal path is `fabric-mcp`). Other servers may follow, in a bearer folder only (Fabric:
the project's granted gateway servers). Such a server carries no standing key: its credential, in a header or its
environment, is a delegation token minted for this session (DEC-0039) that expires no later than the session.
On such a server every header but `Accept`, `Content-Type`, `User-Agent` and `MCP-Protocol-Version` is taken for a
credential; the first call's server carries the session bearer in `Authorization` and no other credential. The kit
checks a delegation token's shape — a JWS whose header is `{"alg": "EdDSA", "typ": "fabric-delegation+jwt"}` and
whose payload has a numeric `exp` — and the server that receives it verifies the rest (DL-13: signature, audience,
expiry). A secret in this folder is materialised for the session from a reference and removed with it (DEC-0013). A runtime that does
not read this dialect is given the same servers in its own (SH-11); `mcp.json` stays the record.

`mcp.strict` is declared: whether the runtime is told to load only the handoff's servers. Fabric's launched
sessions keep it (`--strict-mcp-config`); Dashboards' console does not. Where a runtime offers no such switch,
`strict` is `false`.

## The launch

**SH-10 — What any carrier passes, and no credential on a command line.** `launch.args` are the arguments the
handoff adds to the runtime's own command, in order: at most 16, each at most 1024 characters, none with a
control character. No argument carries a credential, which a process listing shows. The kit looks for a JWT, a provider key's
shape, `Bearer <token>` with a digit in the token, and a long mixed-case run (40 or more base64 characters); in a
path or a URL it looks for the run between separators, so a session id in a folder path is not taken for a key.
A long base64 value that is not a secret (a public key) in an environment value is reported too: record it as
`null` or pass it by file. `launch.env` names each
variable the handoff sets; a value that carries a credential, or a document holding one, is recorded as `null`.

**SH-11 — The per-runtime table.** For each runtime the kit checks:

| Runtime | MCP | `strict` | Brief | Today |
|---|---|---|---|---|
| `claude-code` | exactly one `--mcp-config=<folder>/mcp.json`, joined: the spaced `--mcp-config <path>` is refused, because the option takes several values and the next bare value is read as one more config (measured by Switchboard, SB-94, Switchboard #141; Dashboards #68) | `--strict-mcp-config` exactly when `true` | inline: `--append-system-prompt <text>`; file: `--append-system-prompt-file <folder>/brief.md` | Fabric (`mcp-config-flag`), Dashboards |
| `codex` | `-c mcp_servers.<server>.command=…` (and `args`, `env`) for `none`; `-c mcp_servers.<server>.url=…` and `-c mcp_servers.<server>.bearer_token_env_var=<VAR>`, the variable set and recorded as `null`, for `bearer` | `false`: no switch measured | the first prompt, a positional argument | Dashboards (`none`); Fabric does not hand Codex a session yet (not connected) |
| `kilo` | `KILO_CONFIG_CONTENT`, recorded as `null`: Kilo's own config document with the server as `remote` and its header; no argument | `false`: no switch measured | file: the config's `instructions` names `brief.md` | Fabric (`config-content-env`, Kilo 7.4.17) |
| `hermes` | sent in ACP `session/new` by the host's ACP client (HTTP, or the host's stdio bridge); no argument | `HERMES_ACP_SKIP_CONFIGURED_MCP=1` exactly when `true` | the session's first ACP prompt | Fabric (`acp-session`, Hermes 0.21.4) |
| `kimi-code` | ACP, as `hermes` | `false`: no switch measured | the first ACP prompt | not connected yet |
| `cline` | ACP, as `hermes` | `false`: no switch measured | the first ACP prompt | not connected yet |
| `pi` | not measured: pi reads `mcp.json`, in the `mcpServers` dialect, from its agent directory (`PI_CODING_AGENT_DIR`), so a host points that at a directory of its own, never the user's (DEC-0046) | `false`: no switch measured | not measured | not connected yet |

Sources: Claude Code 2.1.296 `claude --help` (`--mcp-config <configs...>`, "Load MCP servers from JSON files or
strings (space-separated)"; `--append-system-prompt[-file]`); an interactive start with a missing brief file
stops with "Error: Append system prompt file not found: <path>" (measured 2026-10-11), so the file is read at an
interactive start, not only in print mode. Kilo and Hermes: Fabric `apps/desktop/src/shared/agents.ts` at `1634c82e` (the probes of ADR-0119: Kilo 7.4.17 `KILO_CONFIG_CONTENT`, Hermes 0.21.4
`HERMES_ACP_SKIP_CONFIGURED_MCP`). Codex's `-c` server keys: Dashboards `src/core/handoff.ts#handoffArgs` at
`7a2febf`. The `bearer_token_env_var` row is **provisional**: it has no writer yet; the kit checks the shape
written here, and the first writer measures it on the Codex release it targets before shipping, amending this row
if the release differs. Every source is in the [source ledger](../evidence/sources.md). A runtime not in the table is
held to SH-10 only, and its writer documents how the handoff is carried.

## Integrity

**SH-12 — The packet underneath.** `integrity`, when present, names `execution-packet/1` and the `sha256:`
digest of each handoff file materialised there; each digest is the digest of that file's bytes in the folder.
Fabric fills it for `context.md` when the pack was compiled. A host without a packet store omits it.

## Secrets

**SH-13 — A secret lives in `mcp.json` only.** A credential in `mcp.json` — a header value, a credential in a
server's environment — appears in no other file of the folder: not in `context.md`, `brief.md`, `task.md` or
`handoff.json` (whose `launch` withholds it as `null`).

## Symmetry

A host that opens an agent of another product hands it the same format. A Fabric agent opened in Dashboards'
console gets Dashboards' folder (`service_context`, `mcp.auth: none`, per agent key); a Dashboards agent opened
from Fabric gets Fabric's (`fabric_whoami`, `mcp.auth: bearer`, per session). Both are checked by the same
`validateSessionHandoff`.

## The kit's checker

```ts
validateSessionHandoff(dir, { schema? }): Promise<{ valid, schemaErrors, findings }>
readSessionHandoff(dir): HandoffSnapshot           // reads without following links
checkSessionHandoff(snapshot, schema)              // the same, on a snapshot
sessionHandoffManifestFindings(manifest)           // FAC-SEM-053 only, pure but for the host's path rules (SH-4)
```

`schema` is a compiled check of `session-handoff.schema.json`; omitted, the kit's own validator is loaded. The
module imports only Node's built-ins (its one kit import is a type), so a consumer can copy it byte for byte and
run it under `node --experimental-strip-types` against the folders it writes, passing its own compiled schema.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-053"></a>`FAC-SEM-053` | `session-handoff`, `session-handoff-folder` | The manifest's declarations agree: a bearer only per session (SH-5), the preamble (SH-6), the brief's delivery (SH-8), the launch's limits (SH-10) and the per-runtime table (SH-11) |
| <a id="fac-sem-054"></a>`FAC-SEM-054` | `session-handoff-folder` | The folder: where it lives, its modes, its files and nothing else, the launch naming its own files, the integrity digests (SH-1…SH-4, SH-12) |
| <a id="fac-sem-055"></a>`FAC-SEM-055` | `session-handoff-folder` | `mcp.json` reaches the first call's server as `mcp.auth` declares, and a secret lives in `mcp.json` only (SH-9, SH-13) |

Fixtures: `fixtures/positive/session-handoff-*.json`, `fixtures/negative/session-handoff-*.json` (the schema);
`fixtures/semantic/session-handoff-*.json` (manifests, kind `session-handoff`) and
`fixtures/semantic/session-handoff-folder-*.json` (folders, kind `session-handoff-folder`, a file given as
`text` or `json` with its octal `mode`). Tests: `test/session-handoff.test.ts`, `test/session-handoff-review.test.ts`.
