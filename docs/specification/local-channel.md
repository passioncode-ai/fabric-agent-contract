# The local channel to the node — `fabric-local-channel/0.1`

DEC-0075, DEC-0143 (secret requests) · rule code `FAC-SEM-106` · schema [`local-channel`](../../schemas/local-channel.schema.json) · code
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
| Windows | the named pipe `\\.\pipe\<node>-<user SID>`, created with `FILE_FLAG_FIRST_PIPE_INSTANCE` and `PIPE_REJECT_REMOTE_CLIENTS`, its DACL the grant set of service.md *Windows token files* rule 3 (DEC-0032, DEC-0033) | the server checks the client with `GetNamedPipeClientProcessId` and the client the server with `GetNamedPipeServerProcessId` and the owner SID; SYSTEM or an Administrators process may open the pipe (the DEC-0033 DACL) but is admitted only when its user SID is the node's |

- **The directory is the access control.** On POSIX the socket's directory is mode 0700 and owned by the user; the
  node refuses to start otherwise (a socket file's own mode is not honoured everywhere). A peer of another user is
  refused, `unauthenticated`, before anything is read ([`admitPeer`](../../src/local-channel.ts)).
- **The client checks the server too**: the directory's owner and mode and the server's uid (or, on Windows, the
  server process's owner) before it sends hello, so a squatted path is never trusted.
- **The path is short and absolute.** The node publishes an absolute socket path of at most 99 bytes, never under `~`
  (`sun_path` holds 104 on macOS and 108 on Linux; schema), and refuses to start otherwise; a client connects to that
  path as published.
- **A stale socket.** At start the node takes a lock on `run/node.lock`, then probe-connects; it removes the path only
  when the connect is refused. A live socket is never removed.
- **Discovery.** A client never computes the path: the node publishes it in its own service descriptor as
  `channels.local` `{protocol, path | pipe}` ([service](service.md#descriptor)); a remote placement carries none. A
  client reads it from the descriptor whose `id` it is configured to trust as the node's. A process of the same user is
  inside the trust boundary, as on any desktop: the server check stops another user, not another program of the same
  user. A published path says where the node listens, never that it runs: a client probes it.
- **A token** only where the operating system gives no peer credentials (none of the platforms above): read from the
  per-account token file (DEC-0033 ACLs) and passed in `channel.hello`, never in argv or the environment. A node that
  has peer credentials ignores a token; no side ever logs one.
- The channel is never reachable from a browser origin, and it carries no MCP: MCP stays on stdio.

## The session

JSON-RPC 2.0, one JSON object per line, at most 1 MiB a line (over that, `invalid-request` and the node closes;
`lineWithinLimit`). Every request carries an `id`; `consent.cancel` and `secret.cancel` (DEC-0143) are the notifications, and a
notification is never answered, before hello or after it. A message whose envelope the schema's `$defs/request` refuses is
`invalid-request`, answered with `id: null` when its id cannot be read (JSON-RPC 2.0 §5): not an object (an array, a batch, a string), `jsonrpc`
missing or not `"2.0"`, an `id` that is `null`, empty, longer than 128 code points or not a string or an integer, a
method that is not a method name, `params` that is not an object, or another member (`channelStep`). The params a method's own definition refuses are not an envelope fault: a hello's
are `invalid-params`, and a client's `consent.prompt` is `unknown-method` (`hello-first` before hello) whatever it carries. A message without
an `id` that is otherwise well formed is a notification and is not answered; a malformed one is `invalid-request`. The 5 s hello deadline (`HELLO_DEADLINE_MS`) is the node's timer.

1. **Hello first.** The first call is `channel.hello {protocols, client: {name, version}, capabilities?, token?}`,
   within 5 s of connecting; otherwise the node sends `{id: null, error: hello-first}` and closes. The node answers `{protocols}` — N and N−1 (DEC-0067) — or
   `schema-unsupported` and closes. No other method is answered before it (`hello-first`; `channelStep`;
   `FAC-SEM-106`, kind `local-channel-session`). A hello refuses a missing `client` or a capability other than
   `consent.ui` and `secret.ui` (`invalid-params`); a hello that declares `secret.ui` from a peer the node did not
   verify as its product's signed app is `forbidden` and agrees nothing (DEC-0143, [secret requests](#secret-requests)). A
   hello refused `invalid-params` or `forbidden` agrees nothing and leaves the session open, so the client may send
   another within the 5 s: a client refused for `secret.ui` says hello again without it and keeps `consent.ui`. A second hello after one that was accepted is `invalid-request` and
   changes nothing.
2. **The node's methods** (`NODE_METHODS`): `channel.hello`; `health` → `{status, version, protocols, degraded[]}` (an
   empty `degraded` asserts full health); `enroll.status` → `{enrolled, org?}`; `machine.report` (DEC-0132) →
   `{report}`: the node's whole state as `machine-report/1` written at the call, or `null` while it applies no estate
   records; the hub on the same machine reads it in place of a relayed report
   ([the machines' report](relay.md#the-machines-report), MR-2). The client's methods (`CLIENT_METHODS`) are
   `consent.prompt` and `secret.prompt` (DEC-0143), called by the node; a client that sends one to the node gets
   `unknown-method`. Other payload methods
   (`node.lifecycle.*`, `grant.check`, …) are added by their owners' decisions, in this envelope.
3. **Consent, the other way.** After hello the channel is bidirectional. A client that declares `capabilities:
   ["consent.ui"]` may receive the node's `consent.prompt {promptId, purposeId, noticeVersion, deadline}` and answers
   `{state: given | denied, at}` — `at` required for `given`, the receipt evidence (DEC-0052). The deadline is at most
   10 minutes after the prompt. The node prompts every client that declared `consent.ui` (`mayPrompt`); the first answer
   before the deadline wins and the others receive `consent.cancel {promptId}`; no answer by then is `denied`, and a late
   answer is ignored (`consentOutcome`, which reads the node's receipt time, never the client's own `at`, so an answer
   cannot be backdated). A `given` answer is recorded as DEC-0052's `consent {purposeId, state: given, at}`; a `denied`
   answer records nothing, as no answer does; neither is a `notice.acknowledgement`, which is its own message. With no
   `consent.ui` client connected, the prompt is denied at its deadline. The prompt's `purposeId` and `noticeVersion` are
   DEC-0052's own forms.
4. **Errors** use the JSON-RPC envelope with `error.data.code` and one integer per code (`ERROR_CODES`):

   | `data.code` | `code` |
   |---|---|
   | `invalid-request` | -32600 |
   | `unknown-method` | -32601 |
   | `invalid-params` | -32602 |
   | `unauthenticated` | -32001 |
   | `forbidden` | -32003 |
   | `schema-unsupported` | -32004 |
   | `hello-first` | -32005 |

   `forbidden` is for payload methods whose owners require a capability, and for a hello that declares `secret.ui`
   from a peer the node did not verify as its signed app (DEC-0143); no base method needs one.

## Secret requests

DEC-0143, asked by Project Observatory (board request `c50f590b`; its design `docs/design/PERSON-SURFACES.md` at
`b0bb0abd`, D4): an agent needs a value only a person can give (a token, a key) and must never see the person type it,
nor ask for it in a chat. The node asks the person through its product's own signed app, which writes the value into
the vault slot itself.

- **SP-1. A method of its own.** `consent.prompt` carries no request text, is answered `given` or `denied` and goes to
  every `consent.ui` client; a secret request is none of these. The node calls `secret.prompt {requestId, agent,
  project, slot: {env, name}, provider?, reason, replaces, deadline}` (`$defs/secretPrompt`) on one client, which
  answers `{outcome: stored | declined, at}` (`$defs/secretResult`). `secret.cancel {requestId}` withdraws it.
- **SP-2. Only the signed app.** A client declares `secret.ui` in its hello, and the node accepts it only when it has
  verified, by the operating system and before the hello, that the peer process is its product's signed app
  (`ChannelState.signedApp`); otherwise the hello is `forbidden` and agrees nothing (`channelStep`). The check is the
  node's, never the client's word:
  - **macOS:** the peer's audit token from the socket (`LOCAL_PEERTOKEN`), a guest code object from it
    (`SecCodeCopyGuestWithAttributes` with `kSecGuestAttributeAudit`) checked with `SecCodeCheckValidity` against the
    designated requirement the node is configured with (its Team ID and the app's bundle identifier); the app runs
    with the hardened runtime. A check by process id alone is no check: a process id is reused.
  - **Windows:** the client process from `GetNamedPipeClientProcessId`, opened and held while its image
    (`QueryFullProcessImageNameW`) is verified by Authenticode (`WinVerifyTrust`) for the publisher the node is
    configured with, and its creation time compared before and after, so a reused process id cannot pass. This proves the
    image, not the running process: another process of the same user at the same integrity level can still open and
    write into the app unless the app protects its own process, so on Windows the check is weaker than on macOS.
  - **Linux and any other platform:** the node has no signature of the client's image it can check, so it admits no
    `secret.ui` client and answers each request `no-client`, its reason `secret-ui-unavailable`, with the person's step:
    put the value into the vault in their own shell. Its `health` stays as it is: a feature it does not offer is no
    degradation (CT-184).
- **SP-3. One client.** The node sends a request to one session `maySecretPrompt` admits (a signed app that declared
  `secret.ui`), never to every one. With none connected the node may start its signed app through its lifecycle
  broker and prompt it once it is admitted, within the request's deadline; when none is admitted by then, or on a
  machine with no desktop session, the request is answered `no-client` and nothing is shown by anyone.
- **SP-4. No value on the channel.** The prompt and its result carry no value, in either direction. The app writes the
  value into the slot in its own process; the value never crosses the channel or another process boundary, and is in
  no argument, environment variable, log, notification or result. The node reads each answer against
  `$defs/secretResult` (the whole message's `result` is any object); an answer it refuses counts as no answer and is
  never recorded or logged. Typing and "Store" are the person's own acts: the product declares them with `gate: human`
  and `humanStep: secret` (DEC-0121 AP-4), so an agent's tool for them answers `human-step-required` and never stores a
  value.
- **SP-5. The outcome the agent sees** (`secretOutcome`): the first `stored` or `declined` the node received between the
  prompt and its deadline, at most 10 minutes after it (`MAX_SECRET_DEADLINE_MS`), by the node's receipt time; no answer
  by then is `no-answer`, a late answer is ignored. `stored` counts only when the node confirmed, in its own vault
  record, that the slot was written after the prompt; otherwise `unconfirmed`. The agent learns `stored`, `declined`,
  `no-answer`, `unconfirmed` or `no-client`, never a value.
- **SP-6. What the prompt shows.** The agent named by the node's own binding for its caller, never words the agent
  wrote (a binding is the node's, so a same-user agent that read another agent's token file can ask under that name;
  the slot, the reason and the person's own typing still stand); the project and the slot; `reason` quoted as the agent's own words; whether the slot already holds a value
  (`replaces`). A prompt any program of the user can draw (a scripted dialog) is not a secret prompt. The channel
  makes sure only the signed app receives the node's genuine requests; it cannot stop another program of the user from
  drawing a lookalike window outside the channel. What lets the person tell the two apart is the product's own mark
  (Project Observatory's design shows a phrase the person chose), and it is only as strong as the store that hides it:
  on macOS a data-protection keychain item of the app's own access group, which another program of the user cannot
  read; on Windows, and wherever another program of the user can read the app's store, the mark stops only an agent that
  does not look for it.
- **SP-7. Where the request comes from** is the node's: an agent asks through the node's own surface (a tool on its MCP
  server, a job), and the node keeps its own limits (one open request per slot, a rate per agent). The channel carries
  only the prompt and its outcome.

## Not decided here

The key helper's check that its peer is the signed Fabric binary (platform code signing; for `secret.ui` it is SP-2's);
a `secret.ui` client on Linux (SP-2, CT-184); payload methods' shapes
(their owners' decisions); which descriptor `id` a client trusts as the node's (its configuration, the node's product
id).

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-106"></a>`FAC-SEM-106` | `local-channel-session` | the first request on the local channel is `channel.hello` (DEC-0075) |
