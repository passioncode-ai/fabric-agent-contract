# The local channel to the node — `fabric-local-channel/0.1`

DEC-0075 · rule code `FAC-SEM-106` · schema [`local-channel`](../../schemas/local-channel.schema.json) · code
[`src/local-channel.ts`](../../src/local-channel.ts)

How Fabric, Fabric Switchboard and Fabric Dashboards talk to Project Observatory's node on the same machine: the
organization edition's CON-OE-10 in the edition its CROSSWALK-v4 gives (the first organization server's target
architecture v4 §5 at `9c6a780`: "local channel: Unix socket / named pipe with peer credentials, or per-account token
files"), agreed with Project Observatory's session on 2026-10-12. There is no `policy.decide`: v4 has no policy decision
point.

## Transport and who may connect

| Platform | Where | Who |
|---|---|---|
| macOS | `~/Library/Application Support/<node bundle id>/run/node.sock` — not `$TMPDIR`, which macOS cleans | the node checks the peer's uid with `getpeereid` |
| Linux | `$XDG_RUNTIME_DIR/<node>/node.sock`, or `${XDG_STATE_HOME:-~/.local/state}/<node>/run/node.sock` when that variable is unset | `SO_PEERCRED` |
| Windows | the named pipe `\\.\pipe\<node>-<user SID>`, created with `FILE_FLAG_FIRST_PIPE_INSTANCE` and `PIPE_REJECT_REMOTE_CLIENTS`, its DACL the DEC-0033 set | the server checks the client with `GetNamedPipeClientProcessId` and the client the server with `GetNamedPipeServerProcessId` and the owner SID; an elevated Administrators process can connect, as the DEC-0033 set allows |

- **The directory is the access control.** On POSIX the socket's directory is mode 0700 and owned by the user; the
  node refuses to start otherwise (a socket file's own mode is not honoured everywhere). A peer of another user is
  refused, `unauthenticated`, before anything is read ([`admitPeer`](../../src/local-channel.ts)).
- **The client checks the server too**: the directory's owner and mode and the server's uid (or, on Windows, the
  server process's owner) before it sends hello, so a squatted path is never trusted.
- **A path too long** for `sun_path` (104 bytes on macOS, 108 on Linux) is reached by connecting relative to its
  directory.
- **A stale socket.** At start the node takes a lock on `run/node.lock`, then probe-connects; it removes the path only
  when the connect is refused. A live socket is never removed.
- **Discovery.** A client never computes the path: the node publishes it in its service descriptor as
  `channels.local` `{protocol, path | pipe}` ([service](service.md#descriptor)).
- **A token** only where the operating system gives no peer credentials (none of the platforms above): read from the
  per-account token file (DEC-0033 ACLs) and passed in `channel.hello`, never in argv or the environment.
- The channel is never reachable from a browser origin, and it carries no MCP: MCP stays on stdio.

## The session

JSON-RPC 2.0, one JSON object per line, at most 1 MiB a line (over that, `invalid-request` and the node closes).
Every request carries an `id`; `consent.cancel` is the one notification.

1. **Hello first.** The first call is `channel.hello {protocols, client: {name, version}, capabilities?, token?}`,
   within 5 s of connecting or the node closes. The node answers `{protocols}` — N and N−1 (DEC-0067) — or
   `schema-unsupported` and closes. No other method is answered before it (`hello-first`; `channelStep`;
   `FAC-SEM-106`, kind `local-channel-session`).
2. **Base methods**: `health` → `{status, version, protocols, degraded[]}` (an empty `degraded` asserts full health);
   `enroll.status` → `{enrolled, org?}`. Payload methods (`node.lifecycle.*`, `grant.check`, …) are added by their
   owners' decisions, in this envelope.
3. **Consent, the other way.** After hello the channel is bidirectional. A client that declares `capabilities:
   ["consent.ui"]` may receive the node's `consent.prompt {promptId, purposeId, noticeVersion, deadline}` and answers
   `{state: given | denied, at}`; no answer by the deadline is `denied`; the node sends `consent.cancel {promptId}` when
   the prompt is no longer needed. The node prompts only a client that declared `consent.ui` (`mayPrompt`); a client
   that calls a method it lacks the capability for is `forbidden`.
4. **Errors** use the JSON-RPC envelope with `error.data.code`: `unauthenticated`, `forbidden`, `schema-unsupported`,
   `hello-first`, `unknown-method`, `invalid-request`, `invalid-params`.

## Not decided here

The key helper's check that its peer is the signed Fabric binary (platform code signing); payload methods' shapes
(their owners' decisions).

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| `FAC-SEM-106` | `local-channel-session` | the first request on the local channel is `channel.hello` (DEC-0075) |
