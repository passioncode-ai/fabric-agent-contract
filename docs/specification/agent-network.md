# The agent network: directory, call queue and load

DEC-0104 (CT-84, S4 of the agent network) · rule codes `FAC-SEM-130`, `FAC-SEM-131`, `FAC-SEM-132` · schemas
[`agent-directory.schema.json`](../../schemas/agent-directory.schema.json),
[`interop-job-list-request.schema.json`](../../schemas/interop-job-list-request.schema.json),
[`interop-job-list.schema.json`](../../schemas/interop-job-list.schema.json),
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
busy an agent is. The contract writes the wire and the reference functions; the hub, the node, the queue's storage
and the panels are their products'.

## Directory

A directory is a **derived view, never authority**: who may call an agent stays its grant
([contexts](contexts.md#the-grants-context), [delegation](delegation.md)). It is `agent-directory/1`
([`agent-directory.schema.json`](../../schemas/agent-directory.schema.json)): `source`, `viewer`, `generatedAt` and at
most 1024 `entries` of `{agentRef, context, listed}`, sorted by `context`, then `agentRef`, as UTF-16 code units. No
person, machine, grant, capability or digest is in it.

| Source | Derived from | Who reads it | What `estateDirectory` / `organizationDirectory` answer |
|---|---|---|---|
| `estate` | the owner's [estate record](estate-record.md): every placement of every machine, a placement without `context` in `personal` | the owner's own sessions only (T0, T1); `viewer` is `owner` | one entry per (`agentRef`, `context`), every one, unlisted ones `listed: false` |
| `organization` | the share registrations the organization server holds and keeps active (`decideShareRegistration`, DEC-0086) whose window holds the instant (`startsAt` ≤ instant < `expiresAt`), and the agents its own machines run there (`org-cloud` placements, DEC-0099), all in `org:<orgId>` | the organization's administrator (`admin`: every entry, unlisted ones marked) and members (`member`: listed entries only) | one entry per `agentRef`; an unreadable instant, an unknown viewer or `owner` answers none |

**`listed`** is a discovery flag the publisher of the directory sets: the owner for an estate, the organization's
administrator for an organization. An unlisted agent is still called by whoever holds its grant; unlisting it hides it
from discovery only. No `visible` flag exists: an entry a viewer may not read is absent, never present and hidden.

**Two members, one agent.** Two people who share the same agent into one organization are one entry: the directory
names agents, not who shared them.

`FAC-SEM-130` (kind `agent-directory-view`) compares an implementation's directory with the one its source derives:
`{source: "estate", record, unlisted?, directory}` or `{source: "organization", orgId, held, own?, unlisted?, viewer, at,
directory}`. An estate's `unlisted` is a list of `{agentRef, context}`; an organization's, a list of `agentRef`s.

## Call queue

A call to a job-backed capability ([C3.2](interop.md#c32-jobs)) is admitted, queued or refused at the node that hosts
the agent, per (`agentRef`, context). The job's schema stays closed and its states stay the MCP Task states, so the
queue adds no state and no member and needs no new revision of `fabric-interop`.

**Limits.** A node declares its limits in the [load extension](#load): `concurrency` (jobs run at once), `perCaller`
(jobs of one authenticated caller run at once) and `queueMax` (jobs that may wait), each per (`agentRef`, context).

**A waiting job** is `working` and its `statusMessage` is `queued <position> of <length>`, position 1 next, both
decimal integers of at most six digits, nothing before or after (`queueStatusMessage`, `readQueuePosition`).
`pollIntervalMs` SHOULD match the expected wait. A caller reads it as any `working` job (`jobCallerAction` answers
`poll`); `readQueuePosition` answers no place for any other message, a `quota-exhausted` pause among them.

**Which job starts.** `nextQueuedJob(queue, running, limits)`: nothing starts while `concurrency` jobs run; of the
waiting jobs whose caller runs fewer than `perCaller`, the one whose caller runs the fewest wins, so a caller with many
jobs never starves one with few; between those callers, the one whose oldest waiting job arrived first; within a
caller, its oldest; an arrival tie breaks by id. `FAC-SEM-131` (kind `job-queue`, `{queue, running, limits, started}`,
`started` the id the node started or `null`) compares a node's choice with it.

**A full queue.** A start that would make more than `queueMax` jobs wait is refused, nothing started and nothing
stored: the tool result is `isError: true` with `structuredContent.error` `{code: "queue-full", message, data:
{retryable: true, retryAfterSeconds}}`, `retryAfterSeconds` from 1 to 3600
([`#/$defs/queueFullData`](../../schemas/interop-common.schema.json), closed; `admitJob` answers it, 60 when the node's
own value is not readable). The caller starts again after `retryAfterSeconds` under the same idempotency key
([the intent's key](interop.md#limits-and-uncertain-effects)); the key holds no job, so the start runs. `queue-full`
never ends a job; the schema binds its data wherever the code appears.

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
waitMs?, runMs?}`. `queued` and `running` are counts at the window's end; `completed` and `failed` count jobs that ended
in the window (a cancelled job is not counted); `waitMs` is the `{p50, p95}` queue wait of the jobs that started in the
window and `runMs` the run time of those that ended, each absent when there were none. Counts and durations only: no
person, caller, prompt, output or job id. A service shows an organization only its own context's rows.

`FAC-SEM-132` (kind `service-load`) checks a report: windows in order, one `windowSeconds` apart, none starting after
`generatedAt`, each context once per window, `p50` at most `p95`, and no `runMs` in a window where no job ended.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-130"></a>`FAC-SEM-130` | `agent-directory-view` | a directory's entries are exactly what its source derives: `estateDirectory(record, unlisted)` for an estate, `organizationDirectory(orgId, held, own, unlisted, viewer, at)` for an organization; a source that is neither is refused (DEC-0104) |
| <a id="fac-sem-131"></a>`FAC-SEM-131` | `job-queue` | the job a node starts is `nextQueuedJob(queue, running, limits)`'s, or none when it answers none (DEC-0104) |
| <a id="fac-sem-132"></a>`FAC-SEM-132` | `service-load` | a load report's windows are in order one `windowSeconds` apart and none starts after `generatedAt`; each context appears once per window; `p50` is at most `p95`; `runMs` only in a window where a job ended (DEC-0104) |

## Compatibility

Everything here is additive. A node that does not queue serves no load extension and no `fabric.job.list`, and its
callers see what they see today. `queue-full` is a new error code: a caller that does not know it treats it as any
failed start, and the data constraint binds only that code, which no node sent before. `agent-directory/1`,
`fabric-load/0.1` and `service-load/1` are new revisions in the register; `contractVersion` stays `0.1.0`.

## Who adopts it

| Party | What it does |
|---|---|
| the hub (Fabric, CO-376) | derives a person's estate directory with `estateDirectory` and serves it only to that person's sessions |
| the first organization server | derives its directory with `organizationDirectory` from the registrations it keeps and its own machines; a member reads listed entries only |
| a node hosting an agent | queues per (`agentRef`, context) as `nextQueuedJob` and `admitJob` answer, writes `queued <position> of <length>`, serves `fabric.job.list` per caller and the load extension and report |
| a caller | waits on a queued job like any `working` job, and starts again after `queue-full`'s `retryAfterSeconds` under the same key |
| Fabric Dashboards | draws the load panels from `service-load/1` |

Each runs [`fixtures/vectors/agent-network.json`](../../fixtures/vectors/agent-network.json) in its gate.

## Not decided here

- Partner scopes (DEC-0090) in a directory: a partner's own view of the agents it may call is the partner channel's,
  not a third source here; a later revision may add one.
- A directory shared between two organizations, and a public directory.
- How a node persists its queue across restarts, and whether a queued job survives one (a job id is stable across
  restarts, C3.2, so a node that drops a queued job ends it `failed`, never forgets it).
- A per-caller limit on the hub before the call reaches the node.
