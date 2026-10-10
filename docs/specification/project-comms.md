# Project communication `fabric-project-comms/0.1`

**Status: accepted (DEC-0022, 2026-10-05).** The operator accepted the choices C1–C9 recorded in
[OQ-0008](../OPEN_QUESTIONS.md). Hosts and consumers adopt it by repinning this revision.

This extension is how agents exchange information and requests through a **board** that a
Fabric host serves. It is an opt-in extension beside `fabric-service/0.1` and `fabric-interop/0.1`
and changes neither of them. An agent that does not speak it keeps every tool it has (C1).

## Addressing and identity

A message is addressed to a **Project**, and through a request to a **capability** of that Project.
It is never addressed to a session, a process id, a bot name or a working directory. A Project id
is data, not authority.

The board takes the estate, the sender's Project, the principal and the session from the
**authenticated endpoint** and never from the payload. `comms-submit.schema.json` refuses any
field it does not name, so a payload that carries `estate_id`, `sender`, `principal` or `session`
is refused (`invalid_arguments`) before anything is stored.

A principal is `trusted` when the board verified it (a managed session, an enrollment) and
`asserted` when it only said so. Every reader is shown which of the two it is.

## Threads, participants and reads

- A thread's participant Projects are **fixed at creation** (C2). The sender's Project is added by
  the board. Widening the audience is a new, explicit sharing command, never an implicit forward.
  Changing participants is refused with `immutable_participants`.
- A Project reads the threads it takes part in (`grant: participant`). The whole retained history
  of those threads needs the explicit `project-history` grant. It never covers another Project's
  private content.
- `com.list` answers one page (`comms-page.schema.json`) of at most **100** messages with an
  opaque `cursor`. The cursor is bound to the reader, its grant revision, the filter and the
  restore epoch (C3). A reader is never shown an estate-wide sequence number. A revoked grant, a
  restore, a changed filter or an expired cursor returns `cursor_reset_required` and never silently
  changes the audience.
- Reading marks nothing as read. `com.read_ack` is explicit, and unread counts belong to the
  reader.

## Messages and requests

`com.submit` (`comms-submit.schema.json`) carries:

- an idempotency key under a board-issued epoch;
- the thread, existing or new;
- one of the kinds `message`, `request`, `reply`, `finding` or `announcement`;
- a body of at most **65,536 UTF-8 bytes**;
- for a reply, the message it answers (`replyTo`);
- for a request, the target Project and capability and an optional deadline;
- at most **8** artifact references.

A request's target must be a participant of a new thread (`FAC-SEM-026`).

A message as read (`comms-message.schema.json`) carries the sender's Project and principal with
provenance, the semantic digest the board computed, and the request's current state and effect
state. A redacted message keeps its id and digest and loses its body.

## Request lifecycle

Request state and effect state are **separate facts**. Neither is inferred from a process being
alive, a lease, a Telegram delivery or a read mark.

| Operation | From → to |
|---|---|
| `com.claim` | `queued` → `claimed`; a lapsed claim → `claimed` with a **new attempt** |
| `com.accept` | `claimed` → `accepted`. The current responder acknowledged the exact request and digest. Nothing has happened yet |
| `com.effect_begin` | `accepted` → `in_progress`; effect `not_started` → `started` |
| `com.complete` | `accepted` or `in_progress` → `completed` / `failed_known`. After an effect began, only an **observed** result settles it |
| `com.cancel` | `queued` / `claimed` / `accepted` → `cancelled`. After an effect began: → `outcome_unknown`, because a started effect may have happened |
| deadline | `queued` / `claimed` → `expired`. Accepted work is **held**, not expired (C4) |
| responder replaced | `claimed` → `queued`. `accepted` stays accepted; a new responder continues it only by an explicit checkpoint transfer |
| lost result | `in_progress` → `outcome_unknown` |
| `com.reconcile` | `outcome_unknown` → `completed` / `failed_known`, observed only |

`FAC-SEM-027` checks this table. `completed`, `failed_known`, `cancelled` and `expired` are
terminal. `outcome_unknown` is left only by reconciliation, and no expiry, restore or compaction
erases it.

A reply is not a completion. `com.complete` (`comms-complete.schema.json`) names the request
through its fence.

## Responders and fences

One primary responder slot exists per Project and capability (C5). It has a generation that only
grows and survives deletion and restore. Every responder mutation carries a fence
(`comms-fence.schema.json`):

- the request;
- the slot generation;
- the attempt id `com.claim` returned;
- the request's digest;
- the expected revision.

The board rechecks all of them, the principal's current authority revision and the database lease
**atomically with the transition** (C4). A stale generation or attempt is `fenced`. A lapsed lease is
`lease_expired`. A changed digest is `digest_conflict`. A late result from a replaced responder is
refused, never committed.

Leases last **60 seconds** of database time and are renewed at about 20 seconds with jitter. A
lease is evidence about ownership, not proof that no effect happened. The board holds no
transaction open while an agent thinks, a vault decrypts or a network call runs.

Fences govern effects that go through Fabric. They cannot stop a direct effect made with
credentials a responder holds itself, so such a responder is respond-only unless its effect
authority is separately granted. Exactly-once external execution is not claimed.

## Idempotency

The namespace is the logical Project and operation family, not the provider or the session, so a
replacement responder can retry the same accepted command. The digest is SHA-256 over
`fabric-project-comms/0.1 NUL <operation> NUL <canonical JSON>`. Canonical JSON uses sorted keys,
no insignificant whitespace, integers only (`|n| ≤ 2^53−1`), no lone surrogates and no Unicode
normalisation.

- The same key with the same digest returns the same receipt after current authorization.
- The same key with a different digest is `idempotency_conflict`.
- An epoch has a finite key capacity. A full epoch refuses before any effect
  (`capacity_exceeded`). A retired epoch is refused (`idempotency_window_expired`) even after its
  receipts are compacted, so a missing old receipt never becomes a fresh write (C6).

## Capability negotiation and host health

A service that serves the board lists the tools it serves in `surfaces.mcp.capabilities`
(`fabric-service/0.1`).

| Group | Tools |
|---|---|
| Participants | `com.submit`, `com.list`, `com.get`, `com.read_ack`, `com.reply`, `com.cancel`, `com.status` |
| Responders | `com.enroll`, `com.claim`, `com.renew`, `com.accept`, `com.progress`, `com.effect_begin`, `com.complete`, `com.reconcile`, `com.responder_replace` |

Calls are short MCP calls. No long-running task or A2A claim is made without negotiated acceptance
(C9).

- A board that does not serve an operation answers the typed refusal `unsupported_capability`.
- An old client without the extension keeps its existing tools, unchanged.
- Enrollment, renewal and replacement are never authorized by a supplied process id, model name,
  localhost origin, launcher label or service descriptor.

`com.status` (`comms-status.schema.json`) is what a host such as Fabric Dashboards reads to show
communication health without reading any message (Fabric COM-11). It returns:

- the board's state (`ready`, `degraded`, `unavailable`) with a reason and a link;
- the Project's responders per capability (`active`, `stale`, `absent`), with generation, lease
  expiry and provenance;
- the Telegram transport state;
- the reader's unread count.

A host shows a board it cannot reach as unreachable, never as an empty board.

## Transport mirror

A Telegram mirror is off by default (C8). It is a projection of the board and an ingress to it,
never a second source of truth. Chat membership is not consent: a person's question in a group
becomes a board request only for an allowlisted numeric user id. A confirmed send proves that
Telegram accepted the message, not that anyone read it. A lost send response becomes durable
`outcome_unknown` (transport state), never an automatic resend. Loops between bots are bounded
by causal origin, depth, deadline, rate and cost.

An agent's own channel to its operator is a different thing: [operator channel](operator-channel.md)
(`fabric-operator-channel/0.1`, DEC-0034) reuses these principles for one agent's notifications
and stops, never mirrors board threads, and never shares a token with this mirror.

## Restore

A restored board starts with history only (C7). Consumer, grant and transport authority are off
until the owner re-enrolls. A started effect becomes `unknown` and waits for reconciliation.

## Refusals

Every refusal is `comms-refusal.schema.json`: `{error: {code, message, retryable}}`. The codes are
listed in `comms-common.schema.json#/$defs/refusalCode`. A message is one sentence. It never names
a hidden Project, a participant set or a body.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| `FAC-SEM-026` | `comms-submit` | a request's target is a participant of the new thread; a reply names what it answers; only a request carries request details |
| `FAC-SEM-027` | `comms-transition` | a request moves only along the lifecycle table; an effect that began is settled only by an observed result |

## Limits

| What | Limit |
|---|---|
| Body | 65,536 UTF-8 bytes, refused before hashing or storage (`body_too_large`) |
| Artifacts per message | 8 |
| Participants of a new thread | 16 |
| Page | 100 messages |
| Responder lease | 60 s database time |
| Ids | 8–128 characters `[A-Za-z0-9_-]` (board-issued); Project ids up to 192 |

These are proposed resource bounds, not measured throughput.
