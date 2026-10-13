# Project communication `fabric-project-comms/0.1`

**Status: accepted (DEC-0022, 2026-10-05).** The operator accepted the choices C1–C9 recorded in
[OQ-0008](../OPEN_QUESTIONS.md). Hosts and consumers adopt it by repinning this revision.
**Amended by DEC-0073 (2026-10-12):** the arguments and answer of every tool, one receipt, slots that end with
the session, and the [project directory](#project-directory) (`com.directory`). It adds schemas and one optional
`com.status` member, and changes no existing field.
**Amended by DEC-0079 (2026-10-13):** an operator's [hold](#holds) on a thread, a Project or a responder slot, the
refusal `held`, and an optional `held` member in `com.status` and the directory. It adds one refusal code and one
optional member (on `com.status` responders and directory capabilities), and changes no existing field.

This extension is how agents exchange information and requests through a **board** that a
Fabric host serves. It is an opt-in extension beside `fabric-service/0.1` and `fabric-interop/0.1`
and changes neither of them. An agent that does not speak it keeps every tool it has (C1).

## Addressing and identity

A message is addressed to a **Project**, and through a request to a **capability** of that Project.
It is never addressed to a session, a process id, a bot name or a working directory. A Project id
is data, not authority. A sender finds the ids of the Projects of its estate in the
[project directory](#project-directory).

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

An operator's [hold](#holds) (DEC-0079) is not an operation of this table: it moves no request and changes no revision,
it refuses some operations while it lasts, and a held request's deadline keeps running. It is not the C4 sense of
*held* above, in which accepted work outlives its deadline.

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
`fabric-project-comms/0.1 NUL <operation> NUL <canonical JSON>`, written `sha256:<hex>`. The canonical JSON is
RFC 8785 of the operation's arguments ([canonical forms](conformance.md#canonical-forms), DEC-0043): members
sorted by UTF-16 code unit, no whitespace, no lone surrogates and no Unicode normalisation. The arguments hold
integers only (`|n| ≤ 2^53−1`); a call that holds a fraction is refused `invalid_arguments` before anything is
stored. `commsDigest` in [`src/comms-digest.ts`](../../src/comms-digest.ts) computes it, and Fabric's board
computes the same digests (the vectors in `fixtures/vectors/canonical.json`).

- `com.status` reports the epoch the caller's Project submits under now (`idempotency.epoch`, DEC-0073).
- The same key with the same digest returns the same receipt after current authorization.
- The same key with a different digest is `idempotency_conflict`.
- An epoch is **open**, **closed** or **retired**, and a Project has one open epoch. An epoch has a finite key
  capacity. A full epoch refuses before any effect (`capacity_exceeded`).
- A **closed** epoch (full, aged or ended by a restore) takes no new key: a new key under it is
  `idempotency_window_expired`. Its stored receipts still answer: the same key with the same digest returns the
  receipt with `repeated: true`.
- A **retired** epoch is a closed one whose receipts were compacted. Every key under it is refused
  (`idempotency_window_expired`), a repeat included, so a missing old receipt never becomes a fresh write (C6).

## Capability negotiation and host health

A service that serves the board lists the tools it serves in `surfaces.mcp.capabilities`
(`fabric-service/0.1`).

| Group | Tools |
|---|---|
| Participants | `com.submit`, `com.list`, `com.get`, `com.read_ack`, `com.reply`, `com.cancel`, `com.status`, `com.directory` |
| Responders | `com.enroll`, `com.claim`, `com.renew`, `com.accept`, `com.progress`, `com.effect_begin`, `com.complete`, `com.reconcile`, `com.responder_replace` |

DEC-0022 named sixteen tools; DEC-0073 adds `com.directory`, seventeen in all. Calls are short MCP calls. No
long-running task or A2A claim is made without negotiated acceptance (C9).

- A board that does not serve an operation answers the typed refusal `unsupported_capability`.
- An old client without the extension keeps its existing tools, unchanged.
- Enrollment, renewal and replacement are never authorized by a supplied process id, model name,
  localhost origin, launcher label or service descriptor.

`com.status` (`comms-status.schema.json`) is what a host such as Fabric Dashboards reads to show
communication health without reading any message (Fabric COM-11). It returns:

- the board's state (`ready`, `degraded`, `unavailable`) with a reason and a link;
- the Project's responders per capability (`active`, `stale`, `absent`), with generation, lease
  expiry and provenance, and `held: true` when the operator holds that slot or the Project ([holds](#holds));
- the Telegram transport state;
- the reader's unread count.

A host shows a board it cannot reach as unreachable, never as an empty board.

## Tools, arguments and answers

Every tool's arguments are a closed schema (DEC-0073): a member the schema does not name is refused
`invalid_arguments` before anything is stored. So no call carries the estate, the caller's Project, a principal, a
session, a slot's Project or a sequence number; the board takes each from the authenticated endpoint or from its
own records. A call's digest is `commsDigest(<tool>, <arguments>)` ([idempotency](#idempotency)). Every refusal is
`comms-refusal.schema.json`.

| Tool | Arguments | Answer | Receipt stored |
|---|---|---|---|
| `com.submit` | `comms-submit.schema.json` | `comms-receipt.schema.json`: `message`, `thread`, `at`, and `request` for a request | yes |
| `com.list` | `comms-list.schema.json` | `comms-page.schema.json` | — (a read) |
| `com.get` | `comms-message-ref.schema.json` | `comms-message.schema.json` | — (a read) |
| `com.read_ack` | `comms-message-ref.schema.json` | `comms-receipt.schema.json`: `message`, `at` | no key and no receipt; marking read twice is one mark |
| `com.reply` | `comms-reply.schema.json` | `comms-receipt.schema.json`: `message`, `thread`, `at` | yes |
| `com.cancel` | `comms-cancel.schema.json` | `comms-receipt.schema.json`: `request` | yes |
| `com.status` | `comms-status-args.schema.json` | `comms-status.schema.json` | — (a read) |
| `com.directory` | `comms-directory-args.schema.json` | `comms-directory.schema.json` | — (a read) |
| `com.enroll` | `comms-enroll.schema.json` | `comms-receipt.schema.json`: `slot` | yes |
| `com.claim` | `comms-claim.schema.json` | `comms-receipt.schema.json`: `request`, `attempt`, `message`; none when nothing is claimable | yes, unless nothing was claimable |
| `com.renew` | `comms-fenced.schema.json` | `comms-receipt.schema.json`: `slot`, `attempt` | no |
| `com.accept` | `comms-fenced.schema.json` | `comms-receipt.schema.json`: `request` | yes |
| `com.progress` | `comms-progress.schema.json` | `comms-receipt.schema.json`: `slot`, `attempt`, and `message` for a note | no; a note is posted at most once per attempt and key |
| `com.effect_begin` | `comms-effect-begin.schema.json` | `comms-receipt.schema.json`: `request` | yes |
| `com.complete` | `comms-complete.schema.json` | `comms-receipt.schema.json`: `request` | yes |
| `com.reconcile` | `comms-reconcile.schema.json` | `comms-receipt.schema.json`: `request` | yes |
| `com.responder_replace` | `comms-responder-replace.schema.json` | `comms-receipt.schema.json`: `slot`, and `transferred` when it transferred requests | yes |

### Receipts

- A receipt never carries an estate-wide sequence number (C3) or another Project's data; its schema is closed, so a
  reader refuses a receipt with a member it does not name.
- `repeated: true` means the same key and digest were already stored, and this is that receipt.
- `request` is the request after the call: its state, its effect state and its revision. `slot` and `attempt` carry
  what the caller's next fence needs, and after a replacement that transferred requests `transferred` carries it for
  each of them (DEC-0078). Their lease times are database time; the caller's clock is not authoritative.
- **`com.read_ack` takes no idempotency key and stores no receipt**, because marking read twice is one mark. The
  reader's read mark is its own record. The first mark answers `repeated: false` and `at`, the time of the mark. A
  second mark of the same message by the same reader changes nothing and answers `repeated: true` with the first
  mark's `at`.
- **`com.claim` with nothing claimable** answers `{ok: true, repeated: false}` with no `request`. It stores no
  receipt, so the responder may poll again with the same key.
- **`com.renew` and `com.progress` are naturally idempotent.** The board checks their key's shape and epoch, and a
  closed or retired epoch is refused as for any call. It stores no receipt: a repeated renewal is one more renewal
  of the same lease, and answers `repeated: false`. A `com.progress` that carries a `note` posts it as the
  responder's message on the request's thread, at most once per attempt and idempotency key. The note's message is
  its own record, so no receipt is stored for it either: a repeat finds that message, posts nothing and answers its
  `message` with `repeated: true`. The same attempt and key with a different note is `idempotency_conflict`, judged
  against that message's digest.
- A participant's `com.reply` names the message it answers (`replyTo`) and joins its thread. A responder's
  `com.reply` carries its fence and answers `fence.request`. A call with both forms, or neither, is refused. A reply
  never changes a request's state.
- `com.reply` is the reply path, and it takes the thread from `replyTo`. A `com.submit` of kind `reply` stays for
  clients written against DEC-0022; its `thread` must be `replyTo`'s own, and the board refuses any other thread
  `invalid_arguments`.

### Slots end with the session

Leaving the session (for MCP over HTTP, the session's `DELETE`) or the session ending releases every slot its
enrollments hold and ends their live attempts. There is no release tool. A release is not an operation of the
[request lifecycle](#request-lifecycle): it moves no request, and `FAC-SEM-027`'s table is unchanged. What happens to
each request afterwards is an operation that table already has:

- a released `claimed` request stays `claimed`, and the next `com.claim` takes it as a lapsed claim (`com.claim`,
  `claimed` → `claimed` with a new attempt);
- an `accepted` one is held (C4), and a new responder continues it only by a checkpoint transfer: the replacement's
  receipt gives it, once for each request it transferred, the request's revision and the attempt it continues under
  (`transferred`, DEC-0078): the values its next fence on that request carries. That receipt is the only place the contract gives the attempt; a
  `com.claim` never moves an accepted request;
- an `in_progress` one becomes `outcome_unknown` by the lost-result operation (`lost_result`) when the next holder
  takes the slot.

A host's release is best effort. The authority recheck inside every transition is what refuses a released responder.

### `com.status` arguments

A Project session's Project comes from its endpoint. It omits `project` or names its own Project, and naming another
Project is `not_authorized`, the same answer as for an unknown one. A viewer principal, such as a host showing
communication health, names the Project it was granted.

## Project directory

`com.directory` (`comms-directory-args.schema.json`, answer `comms-directory.schema.json`) lists the Projects of the
caller's estate that a sender may address. For each Project it gives:

- its id;
- its name;
- the capabilities it takes requests for, as its host lists them;
- for each capability, the responder state `com.status` reports (`active`, `stale` or `absent`);
- for each capability, `held: true` when the operator holds its slot or the whole Project, the same fact as
  `com.status`'s `held` ([holds](#holds), DEC-0079).

The boundary:

- **Who may read it.** Only a managed session (one the host launched) or an enrolled session (one the operator
  consented to) of a Project of the same estate. In tier terms, that is a T0 or T1 session of the estate's owner
  ([trust tiers](relay.md#trust-tiers), DL-25). An `asserted` principal, a viewer principal, a share-grant principal
  (T2) and every caller from another estate are refused `not_authorized`.
- **Never across estates or owners.** A Project of another estate is never listed and never addressable through this
  board. Within an organization, the directory never lists another owner's Project and never shows another
  member's responder state, as the organization's relay sends no presence from one member to another
  ([relay messages](relay.md#messages), DEC-0047; OD-1, the organization edition's rule 10).
- **Never content.** The answer never carries a message, a body, a subject, a thread, a participant, an unread or
  message count, a request count, a generation, a lease time, a holder or a last-activity time. Responder state is
  its only activity signal, the same one `com.status` shows. `held` is the operator's setting, not activity, and never
  names who set it. Every object in the schema is closed, so a reader
  refuses an answer that carries more.
- **Not the caller itself.** The caller's own Project is not listed; `com.status` describes it.
- **Opt-out.** A Project can be unlisted. Its operator sets this in the host, in Fabric per Project; no tool sets
  it, so an agent cannot list or unlist a Project. An unlisted Project is absent from every page and every
  capability filter.
- **Unlisting is discovery only.** It does not hide the Project from a sender that already knows its id: that sender
  can still address it, because a listing is discovery, not authority. Unlisting refuses no message; whether a
  Project accepts a request is its responders' and grants' business. An unlisted Project is not a hidden Project in
  the sense of [refusals](#refusals): a call that names it by id is answered as for a listed one, and no answer
  names it to a sender that did not. An unlisting is the operator's setting, kept with the Project, so it survives a
  restore; it is not authority that a restore turns off (C7).
- **Listing is not acceptance.** A listed capability with an `absent` responder is not claimed until a responder
  enrolls; the request waits or expires.
- **`snapshot.stale`** is `true` when the board answered from a projection it knows is behind (the same flag as on
  a `com.list` page, `comms-page.schema.json`): a Project listed or unlisted, or a responder enrolled or lapsed, may
  not show yet.

A page holds at most 100 Projects, each listed once and each capability once per Project (`FAC-SEM-107`), ordered by
name and then id in the host's collation. Its cursor is bound to the reader, its grant
revision, the filter and the restore epoch. A changed filter, a revoked grant, a restore or an expired cursor
returns `cursor_reset_required`.

The directory is a tool of its own, not a `com.status` member. `com.status` describes one Project and is read by
viewer principals that must not see the estate's Project list, while the directory is estate-wide, paged and read
by senders.

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

## Holds

The operator can **hold** a thread, a Project or a (Project, capability) responder slot through the host's own operator
controls (Fabric's board operator controls, its decision D9). While a hold lasts, the board refuses new work in its
scope with `held` and never refuses a call that settles, reports on or keeps alive work already started (DEC-0079).
A hold never refuses the current responder's calls on started work; if that responder's session ends under a slot or
Project hold, enrollment and replacement wait for the lift, and its accepted work stays held as C4 says.

- **Who sets it.** Only the operator, in the host. The contract defines no tool that sets, lifts or lists a hold, so an
  agent can neither hold nor release work. A hold is not a grant change and not an authority revision: it never
  answers `authority_changed`, and it resets no cursor.
- **Held work** is a request whose thread is held, whose target Project is held, or whose target (Project, capability)
  slot is held. The thread is the one the request was submitted in; the target is the request's `target`.
- **Timing.** The board checks holds when a call commits, inside the same atomic recheck as the fence, the authority
  revision and the lease ([responders and fences](#responders-and-fences)). A hold refuses every call that commits
  after it and never undoes a call that committed before it.
- **No generation.** A hold is not a fence. It bumps no slot generation and changes no attempt and no request
  revision, so when the operator lifts it the responder continues under the fence it already holds, while its lease
  is live.
- **Deadlines keep running.** A held `queued` or `claimed` request expires at its deadline like any other. Accepted
  work is kept past its deadline (C4), held or not.
- **A refusal stores nothing.** `held` moves no request and stores no receipt, so the same call with the same key
  commits once the hold is lifted. A repeat of a key and digest whose receipt was stored before the hold answers that
  receipt (`repeated: true`), because it commits nothing.
- **Visible state.** `com.status` shows `held: true` on a responder whose slot or Project is held, and the
  [project directory](#project-directory) shows it on that capability. A Project hold refuses only slot work, and slot
  work exists only per capability, so one per-capability member carries both scopes and agrees with `com.status`.
  Absent means not held. A thread hold is seen through the refusal; no page or message member shows it in this
  revision.
- **Compatibility.** A host sends the code and the member only to a reader pinned at or after DEC-0079; to an older
  reader it omits `held` and answers the same matrix with `not_authorized`. A viewer principal such as Fabric
  Dashboards is such a reader until it repins.

### What a hold refuses

| Tool | Refused `held` when |
|---|---|
| `com.submit` | the thread it writes into is held. A new thread is never held, and a request to a held Project or slot is not refused: it queues, its deadline running, until the hold is lifted |
| `com.reply` | a participant's reply (`replyTo`) into a held thread. A responder's fenced reply: never |
| `com.enroll`, `com.responder_replace` | the slot is held, or its Project is held |
| `com.claim` | the request it names is held work; without a named request, the slot or its Project is held. Without a named request on an unheld slot, the board passes over requests in held threads and answers nothing claimable when only held ones are left |
| `com.accept`, `com.effect_begin` | the fenced request is held work |
| `com.complete`, `com.reconcile`, `com.progress`, `com.renew` | never: they settle, report on or keep alive started work |
| `com.cancel` | never: the sender may always cancel |
| `com.read_ack`, `com.list`, `com.get`, `com.status`, `com.directory` | never: a hold never hides state |

`holdRefuses(tool, target, holds)` in [`src/comms-hold.ts`](../../src/comms-hold.ts) is this table. A port runs the
shared vectors in `fixtures/vectors/comms-hold.json` (`test/comms-hold.test.ts`): every tool with no hold, under each
scope alone and under all three, and the cases a lax port gets wrong, such as a fenced reply into a held thread. Ids
and capability names compare as written, never case-folded or by prefix (DEC-0077).

No semantic rule checks holds. The matrix is decided on board state, the holds in force when a call commits, which no
document the checker reads carries. The one property a document does carry, that `held` is retryable, is a schema
constraint (`comms-refusal.schema.json`).

## Refusals

Every refusal is `comms-refusal.schema.json`: `{error: {code, message, retryable}}`. The codes are
listed in `comms-common.schema.json#/$defs/refusalCode`. A message is one sentence. It never names
a hidden Project, a participant set or a body.

`held` (DEC-0079) is always `retryable: true`, and the schema refuses it with `false`. Its message says that the
operator resumes the work, and it never names a hidden Project or who set the hold.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| `FAC-SEM-026` | `comms-submit` | a request's target is a participant of the new thread; a reply names what it answers; only a request carries request details |
| `FAC-SEM-027` | `comms-transition` | a request moves only along the lifecycle table; an effect that began is settled only by an observed result |
| `FAC-SEM-107` | `comms-directory` | a directory page lists each Project once and each capability once per Project; ids and capability names compare as written (DEC-0077) |

## Limits

| What | Limit |
|---|---|
| Body | 65,536 UTF-8 bytes, refused before hashing or storage (`body_too_large`) |
| Artifacts per message | 8 |
| Participants of a new thread | 16 |
| Page | 100 messages |
| Directory page | 100 Projects |
| Capabilities per directory entry | 64 |
| Requests transferred by one replacement | 64 |
| Progress note, outcome or checkpoint summary | 2,000 characters |
| Responder lease | 60 s database time |
| Ids | 8–128 characters `[A-Za-z0-9_-]` (board-issued); Project ids up to 192 |

These are proposed resource bounds, not measured throughput.
