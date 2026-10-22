# The agent network: directory, call queue and load

DEC-0104 (CT-84, S4 of the agent network) · rule codes `FAC-SEM-130` to `FAC-SEM-133` · schemas
[`agent-directory.schema.json`](../../schemas/agent-directory.schema.json),
[`interop-job-list-request.schema.json`](../../schemas/interop-job-list-request.schema.json),
[`interop-job-list.schema.json`](../../schemas/interop-job-list.schema.json),
[`interop-tool-error.schema.json`](../../schemas/interop-tool-error.schema.json),
[`service-load-extension.schema.json`](../../schemas/service-load-extension.schema.json),
[`service-load.schema.json`](../../schemas/service-load.schema.json), `queue-full`'s data in
[`interop-common.schema.json#/$defs/queueFullData`](../../schemas/interop-common.schema.json) · code
[`src/agent-network.ts`](../../src/agent-network.ts) · vectors
[`fixtures/vectors/agent-network.json`](../../fixtures/vectors/agent-network.json), written by
[`tools/vectors/agent-network.ts`](../../tools/vectors/agent-network.ts) · tests
[`test/agent-network.test.ts`](../../test/agent-network.test.ts)

S1 to S3 of the agent network put an agent on a machine ([package](package.md), [estate record](estate-record.md)),
in a context ([contexts](contexts.md)) and in another person's hands ([share registration](share-registration.md)).
S4 answers three questions the hub, the hosting node and the panels asked on the board (threads `ba63565c` items 1 to 3
and `b2511678`): which agents a viewer can find, what happens when more calls arrive than an agent can run, and how
busy an agent is. The contract writes the wire and the reference functions. S4 is Fabric's as a whole (the operator's
decision of 2026-10-22, fabric-workspace roadmap RM21-S4, Fabric CO-376): who serves each directory, the queue's
storage and the panels are Fabric's products' to build; the visibility the roadmap names is `listed` below, and
S4's per-agent token administration is not in this decision (CT-84 stays open for it).

## Directory

A directory is a **derived view, never authority**: who may call an agent stays its grant
([contexts](contexts.md#the-grants-context), [delegation](delegation.md)). It is `agent-directory/1`
([`agent-directory.schema.json`](../../schemas/agent-directory.schema.json)): `source`, `viewer`, `generatedAt` and at
most 1024 `entries` of `{agentRef, context, listed}`, sorted by `context`, then `agentRef`, as UTF-16 code units. No
person, machine, grant, capability or digest is in it; an `agentRef` names its publisher (`urn:fabric:agent:<publisher>:<id>`),
which a person who publishes their own agent chooses. A source that derives more than 1024 entries is served as the
first 1024 in that order (`DIRECTORY_MAX`; both reference functions cut there, so `FAC-SEM-130` compares the same
1024); paging a directory is not decided in this revision.

| Source | Derived from | Who reads it | What `estateDirectory` / `organizationDirectory` answer |
|---|---|---|---|
| `estate` | the owner's [estate record](estate-record.md): every placement of every machine, a placement without `context` in `personal` | the owner's own sessions only (T0, T1); the hub refuses any other reader; `viewer` is `owner` | one entry per (`agentRef`, `context`), every one, unlisted ones `listed: false` |
| `organization` | the share registrations the organization server holds and keeps active (`decideShareRegistration`, DEC-0086) whose window holds the instant (`startsAt` ≤ instant < `expiresAt`), and `own`: the agents the organization server records as running on its own `org-cloud` machines (DEC-0099), all in `org:<orgId>` | the organization's administrator (`admin`: every entry, unlisted ones marked) and members (`member`: listed entries only) | one entry per `agentRef`; an `orgId` that is not an organization id (`common.schema.json#/$defs/contextId`), an unreadable instant, an unknown viewer or `owner` answers none |

**`listed`** is a discovery flag the publisher of the directory sets: the owner for an estate, the organization's
administrator for an organization. An unlisted agent is still called by whoever holds its grant; unlisting it hides it
from discovery only. No `visible` flag exists: an entry a viewer may not read is absent, never present and hidden.

**What `own` is read from.** No contract document lists an organization's own machines' agents yet: an `org-cloud`
machine is in no estate record and `node-summary/1` names services, not agents. `own` is the organization server's
own record of them; which document carries it is not decided here.

**Listed as signed, not as callable.** An estate's directory lists the record's placements as the revision signed
them. A share grant that expired or a revocation delta applied since stops the call at once
([contexts](contexts.md)); the entry stays until the next revision, so it is never a promise that a
call will run. An organization's directory drops a registration as soon as it is withdrawn or outside its window.

**Two members, one agent.** Two people who share the same agent into one organization are one entry: the directory
names agents, not who shared them, and does not choose between their instances.

**Finding is not calling.** An entry names an agent by `agentRef`; `agent.call` names a registry `agentId`, and the
contract does not map one to the other ([contexts](contexts.md), Not decided). An entry also carries no machine or
endpoint. A reader finds an agent here; the call goes through the hub, which resolves it in its own registry and
under the reader's grant (Fabric, CO-376), until a revision maps the two.

`FAC-SEM-130` (kind `agent-directory-view`) compares an implementation's directory with the one its source derives,
its `source` with the source it came from and its `viewer` with its reader (`owner` for an estate):
`{source: "estate", record, unlisted?, directory}` or `{source: "organization", orgId, held, own?, unlisted?, viewer, at,
directory}`. An estate's `unlisted` is a list of `{agentRef, context}`; an organization's, a list of `agentRef`s.

## Call queue

A call to a job-backed capability ([C3.2](interop.md#c32-jobs)) is admitted, queued or refused at the node that hosts
the agent, per (`agentRef`, context). The job's schema stays closed and its states stay the MCP Task states, so the
queue adds no state and no member and needs no new revision of `fabric-interop`.

**The caller.** A node that queues keys every per-caller rule here (`perCaller`, fairness, `fabric.job.list`,
another caller's id) and its repeated keys ([the provider's answer to a repeated key](interop.md#limits-and-uncertain-effects))
with `jobCallerKey(accepted, credential)`: for a call whose delegation token it accepted (DL-9, or
`Fabric-Delegation` on a call the hub forwards, DL-10), what `verifyDelegation` names, `principal` (the token's
`sub`) and `caller` (the outermost actor), and the partner organization when the chain ends in one (DEC-0090); for a
call that presented no token, the credential it knows the caller by (T0 or T1, DL-26; a stdio caller is its
connection). A call whose token it refused is refused, never keyed. So an owner's agent and a partner's agent are two
callers even under one `sub` and one agent id, and neither reads the other's jobs; two people the hub forwards under
one credential are two callers once it attaches their tokens; an agent's sessions share its jobs. A provider that
does not queue keeps its repeated keys as DEC-0087 left them. Fabric's hub
attaches no `Fabric-Delegation` today, so until it does every call it forwards is one caller at the node, its
credential. The same holds for local callers that present one credential, the descriptor token under the default
MCP auth among them: they are one caller. A caller polls the way it started: a start with a token and a poll without one are two callers.

**Limits.** A node that queues declares its limits in the [load extension](#load), which it therefore carries: `concurrency` (jobs run at once), `perCaller`
(jobs of one authenticated caller run at once) and `queueMax` (jobs that may wait), each per (`agentRef`, context).

**A waiting job** is `working` and its `statusMessage` is `queued <position> of <length>`, its rank in the order
`nextQueuedJob` would start the waiting jobs if slots freed one at a time with no new arrival, position 1 next, both
decimal integers of one to six digits with no leading zero, 1 ≤ position ≤ length, nothing before or after
(`queueStatusMessage` writes nothing outside it, `readQueuePosition`).
`pollIntervalMs` SHOULD match the expected wait. A caller reads it as any `working` job (`jobCallerAction` answers
`poll`); `readQueuePosition` answers no place for any other message, a `quota-exhausted` pause among them.

**What holds a slot.** A job the node started and that has not ended holds a slot, whatever its state: `working`, a
`quota-exhausted` pause, or `input_required` waiting on a person (C3.3). `running` in `nextQueuedJob` and in the load
report is that set.

**Which job starts.** `nextQueuedJob(queue, running, limits)`: nothing starts while `concurrency` jobs run (every
running job holds a slot, whether or not its caller is known); of the
waiting jobs whose caller runs fewer than `perCaller`, the one whose caller runs the fewest wins, so a caller with many
jobs never starves one with few; between those callers, the one whose oldest waiting job arrived first; within a
caller, its oldest; an arrival tie breaks by id. A job's arrival `at` is a UTC instant with at most three fraction
digits (`interop-common.schema.json#/$defs/utcInstant`), compared to the millisecond; one that is not (lower case, an
offset, four fraction digits) never starts. `FAC-SEM-131` (kind `job-queue`, `{queue, running, limits, started}`,
`started` the id the node started or `null`) compares a node's choice with it.

**A full queue.** `admitJob(queue, running, job, limits, retryAfterSeconds)` admits a start whose job would start at
once (`nextQueuedJob` over the queue with it added answers its id), or one that finds fewer than `queueMax` jobs
waiting; so `queueMax: 0` refuses every wait and never a start into a free slot. Any other start is refused, nothing
started and nothing stored: the tool result is `isError: true` with `structuredContent.error` `{code: "queue-full", message, data:
{retryable: true, retryAfterSeconds}}`, `retryAfterSeconds` from 1 to 3600
([`#/$defs/queueFullData`](../../schemas/interop-common.schema.json), closed; `admitJob` answers it, 60 when the node's
own value is not readable). Its shape is [`interop-tool-error.schema.json`](../../schemas/interop-tool-error.schema.json),
the `structuredContent` of a `queue-full` refusal at start and of the `unknown-job` a node that queues answers, and of
nothing else: a provider that does not queue keeps C3.2's rule for `unknown-job` (its text or
`structuredContent.error.code` carries it), and every provider's other refusals keep their own shapes. A validating client that listed the job tool may refuse a
`structuredContent` outside the tool's `outputSchema` (`interop-job-tool-output`); the node therefore also writes
the same JSON as the result's text content, which every client reads. The caller starts again after
`retryAfterSeconds` under the same idempotency key ([the intent's key](interop.md#limits-and-uncertain-effects)); the
key holds no job, so the start is admitted or refused as any new start. `queue-full` never ends a job: `interop-job.schema.json` refuses a job's `error`
with that code, and `jobCallerAction` answers `invalid` for one. It is a job tool's code, outside the delegation
refusals' set ([delegation](delegation.md)), as `unknown-job` is.

**Through the hub.** A hub that relays the queue (Fabric, CO-376) passes `queue-full` and its data unchanged to the
caller it forwarded for, keeps no `agent.call` key for the refused start (nothing started), and lets the caller start
again; it does not start again on its own. Fabric's hub today answers every product `isError` as `product-error` and
keeps that answer under the key for 24 hours, so until CO-376 ships a caller through the hub sees `product-error`
and a resend under the same key replays it. A node reached through that hub queues all the same; the hub's fix is
CO-376's. Relaying `fabric.job.list` through the hub is not decided here.

**The caller's own log.** A node that queues serves `fabric.job.list {cursor?, limit?}`
([`interop-job-list-request.schema.json`](../../schemas/interop-job-list-request.schema.json)) → `{jobs, nextCursor?}`
([`interop-job-list.schema.json`](../../schemas/interop-job-list.schema.json)): the authenticated caller's own jobs on
this callee, newest first, at most 100 a page, each `{id, status, createdAt, updatedAt}`, no input, result or output.
It never lists another caller's job, and `fabric.job.get` or `fabric.job.cancel` for another caller's job id answers
`unknown-job`, as for an id the node never issued.

## Load

The extension key `https://fabric.passioncode.ai/agent-contract/extensions/load/0.1` (protocol `fabric-load/0.1`,
[`src/protocol-revisions.ts`](../../src/protocol-revisions.ts) `NAMED_ONLY`) in a service's
[well-known document](service.md#well-known-document) carries `{path, windowSeconds, limits}`
([`service-load-extension.schema.json`](../../schemas/service-load-extension.schema.json)): where the load report is
served, the length of one window (60 to 86 400 seconds) and the queue's limits above.

The report at `path` is `service-load/1` ([`service-load.schema.json`](../../schemas/service-load.schema.json)), served
under the descriptor's `auth.tokenFile` like the [usage report](service.md): `generatedAt`, `windowSeconds` and at most
168 `windows`, each `{start, byContext}` with at most 64 rows of `{context, queued, running, completed, failed,
waitMs?, runMs?}`. `queued` and `running` are counts at the window's end (the last window may still be open: its counts are then at
`generatedAt`); `completed` and `failed` count jobs that ended
in the window (a cancelled job is not counted); `waitMs` is the `{p50, p95}` queue wait of the jobs that started in the
window and `runMs` the run time of those that ended, each absent when there were none. Counts and durations only: no
person, caller, prompt, output or job id. Reading it takes the descriptor token ([service](service.md#mcp-credentials),
DL-12): the host holds it, and so does every MCP client configured with it under the default `surfaces.mcp.auth`. It
is never sent to an organization server, and an organization's own view of an agent's load is not decided here.

The extension describes one service: its `limits` apply to every agent it hosts alike, and its report sums them per
context. A node that hosts several agents with their own limits serves one well-known document per agent service.
A refused start (`queue-full`) and a cancelled job are counted in no row in this revision.

`FAC-SEM-133` (kind `service-well-known`) checks the declaration: a value under the load key is valid against
`service-load-extension.schema.json`. A reader treats an invalid one as not declared and reports it, as with the
[connections](connections.md) key.

`FAC-SEM-132` (kind `service-load`) checks a report: windows in order, one `windowSeconds` apart, none starting after
`generatedAt`, each context once per window, `p50` at most `p95`, and no `runMs` in a window where no job ended.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-130"></a>`FAC-SEM-130` | `agent-directory-view` | a directory names the source it came from and its reader (`owner` for an estate), and its entries are exactly what its source derives: `estateDirectory(record, unlisted)` for an estate, `organizationDirectory(orgId, held, own, unlisted, viewer, at)` for an organization; a source that is neither is refused (DEC-0104) |
| <a id="fac-sem-131"></a>`FAC-SEM-131` | `job-queue` | the job a node starts is `nextQueuedJob(queue, running, limits)`'s, or none when it answers none (DEC-0104) |
| <a id="fac-sem-132"></a>`FAC-SEM-132` | `service-load` | a load report's windows are in order one `windowSeconds` apart and none starts after `generatedAt`; each context appears once per window; `p50` is at most `p95`; `runMs` only in a window where a job ended (DEC-0104) |
| <a id="fac-sem-133"></a>`FAC-SEM-133` | `service-well-known` | a value under the load extension key is valid against `service-load-extension.schema.json`; a reader treats an invalid one as not declared and reports it (DEC-0104) |

## Compatibility

Additive, with two narrowings. A node that queues is one that declares the load extension; a provider that does not
declare it serves no `fabric.job.list`, keeps its repeated keys and its `unknown-job` as before, and its callers see
what they see today, whatever it does inside. A node that starts to queue adopts `jobCallerKey` with it and keeps the
answers of keys it stored before under their old caller, so an intent whose job ended `outcome-unknown` never runs a
second time. `queue-full`
is a new error code: a caller that does not know it treats it as any failed start. The narrowings: `queue-full` is
reserved, so a job error with that code, valid before, is refused and `jobCallerAction` answers `invalid`; and its
`data` is required. One personal provider of the estate already queues the starts of its job tools by caller and
refuses past its queue with `queue-full` and no `data`; it declares no load extension, so it is not yet a node that
queues in this page's sense, and its refusal is its own until it declares the extension and adopts the wire (CT-84).
No other provider sends `queue-full` as a job tool's code. `agent-directory/1`,
`fabric-load/0.1` and `service-load/1` are new revisions in the register; `contractVersion` stays `0.1.0`.

## Who adopts it

| Party | What it does |
|---|---|
| Fabric, the hub (CO-376) | owns S4 as a whole; derives a person's estate directory with `estateDirectory` and serves it only to that person's sessions; attaches `Fabric-Delegation` so a node tells the callers it forwards apart (DL-10); relays `queue-full` with its data and keeps no key for it (today it answers `product-error` and keeps it under the key) |
| the first organization server | keeps the registrations and its own machines' agents an organization's directory is derived from with `organizationDirectory`; which of it and the hub serves that directory is Fabric's to settle with it in CO-376; a member reads listed entries only |
| a node hosting an agent | keys callers with `jobCallerKey`, keeping the answers of keys it stored before under their old caller; answers `queue-full` and `unknown-job` with `{error}` alone (the closed `interop-tool-error`); queues per (`agentRef`, context) as `nextQueuedJob` and `admitJob` answer, writes `queued <position> of <length>`, serves `fabric.job.list` per caller and the load extension and report |
| a caller (the one that started the call, not the hub that forwarded it) | waits on a queued job like any `working` job, and starts again after `queue-full`'s `retryAfterSeconds` under the same key |
| Fabric Dashboards | draws the load panels from `service-load/1` |
| fabric-agent-adapter's kits | at the re-pin: a kit-built node that queues ports `jobCallerKey` (the caller vectors) and keys a call with no token by its credential; `jobCallerAction` answers `invalid` for a job `queue-full` ended (the job-limit vectors), the protocol register gains `agent-directory/1`, `fabric-load/0.1` and `service-load/1`, and a kit-built node that queues answers another caller's job id `unknown-job` (not `scope-not-granted`); a kit-built service that vendors the kit moves when it re-vendors |

Each runs [`fixtures/vectors/agent-network.json`](../../fixtures/vectors/agent-network.json) in its gate.

## Not decided here

- Whether the operator credential of a node that queues reads every caller's jobs (a provider whose operator key sees
  every job keeps that view only while it does not queue).
- What `usage.wallMs` of a job that waited measures (its run alone, or the wait too).
- How the queue's message, `queue-full` and `fabric.job.list` travel on the MCP Task route (C3.2); the rules here bind
  the `fabric.job.*` route.

- Partner scopes (DEC-0090) in a directory: a partner's own view of the agents it may call is the partner channel's,
  not a third source here; a later revision may add one.
- A directory shared between two organizations, and a public directory; paging a directory past 1024 entries.
- Whether a session running in an organization's context on the owner's machine reads the estate directory's other
  contexts (Fabric, CO-376).
- Which document carries an organization's own machines' agents (`own`).
- Whether a closed organization's share grants stop calls (DEC-0103 covers device requests only).
- A sign in a directory that it was cut at `DIRECTORY_MAX`.
- A node keeps its queued jobs across its restarts (a job id is stable across restarts, C3.2). How a node that lost
  one ends it, and whether its key then admits the intent again, is not decided here: `failed` with another code
  would leave the intent to a person under today's caller table.
- Mapping an entry's `agentRef` to the `agentId` a call names, and which instance a call reaches when two members
  share one agent.
- What a node that queues does with keys stored under the hub's credential once the hub attaches tokens.
- How a hub span and a meter receipt count a `queue-full` refusal.
- A per-caller limit on the hub before the call reaches the node; relaying `fabric.job.list` through the hub.
- An organization's view of an agent's load; per-agent rows and limits inside one service; counting refused starts.
- A `visible` flag (dropped: an entry a reader may not see is absent) and per-agent token administration, both asked
  in RM21-S4: tokens stay the delegation and grant pages' (a later decision).
