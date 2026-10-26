# Project communication `fabric-project-comms/0.1`

**Status: accepted (DEC-0022, 2026-10-05).** The operator accepted the choices C1–C9 recorded in
[OQ-0008](../OPEN_QUESTIONS.md). Hosts and consumers adopt it by repinning this revision.
**Amended by DEC-0073 (2026-10-12):** the arguments and answer of every tool, one receipt, slots that end with
the session, and the [project directory](#project-directory) (`com.directory`). It adds schemas and one optional
`com.status` member, and changes no existing field.
**Amended by DEC-0079 (2026-10-13):** an operator's [hold](#holds) on a thread, a Project or a responder slot, the
refusal `held`, and an optional `held` member in `com.status` and the directory. It adds one refusal code and one
optional member (on `com.status` responders and directory capabilities), and changes no existing field.
**Amended by DEC-0081 (2026-10-13):** the estate owner settles an `outcome_unknown` request no responder holds
([owner settlement](#owner-settlement)) through `com.reconcile`, observed only, and every reader sees who settled a
request (`settledBy: "owner"`, sent only on an owner settlement). It adds one optional member to the message view's
and the receipt's `request`, and changes no existing field, tool or argument.
**Amended by DEC-0080 (2026-10-13):** a message of kind `finding` may carry a structured [finding](#findings), deduped by
the sender's Project and `dedupeKey`, whose `affects` items a reader outside its grants sees redacted. It adds one
optional member to `com.submit` and to a message, and changes no existing field.

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
- `com.list` MAY narrow the page (DEC-0098): `unread: true` keeps the messages the reader's Project has not marked
  read, and `since` keeps those stored at or after a time. A page asked with either carries `read` on every message;
  a page asked with neither carries none and is the page above, byte for byte. The filter is part of what the cursor
  is bound to. A host SHOULD keep the key that binds its cursors across its own restart, so a reader is not sent back
  to the oldest message by a restart it did not see; a cursor the host cannot verify is still
  `cursor_reset_required`.
- Reading marks nothing as read. `com.read_ack` is explicit, and unread counts belong to the
  reader. It marks one message, up to 100 named messages, or one thread up to a named message of it, the oldest
  1000 at most (`comms-read-ack.schema.json`, DEC-0098). A bulk mark is all or nothing: a message the reader cannot
  read refuses the call `not_authorized`. Its receipt counts what it `marked` and what was `alreadyRead`, and says
  `more: true` when a thread held more than 1000 such messages; the reader calls again.

## Messages and requests

`com.submit` (`comms-submit.schema.json`) carries:

- an idempotency key under a board-issued epoch;
- the thread, existing or new;
- one of the kinds `message`, `request`, `reply`, `finding` or `announcement`;
- a body of at most **65,536 UTF-8 bytes**;
- for a reply, the message it answers (`replyTo`);
- for a request, the target Project and capability and an optional deadline;
- at most **8** artifact references;
- for a finding, an optional structured `finding` ([findings](#findings), DEC-0080).

A request one of the operator's own projects (`provenance: trusted`) sends for a task the operator gave MAY carry the
operator's mandate as a JSON code block in its body; a target that takes the task reads it as
[delegation](delegation.md#the-operators-mandate) MD-3 says (DEC-0125). A board message is otherwise data, never a
decision.

A request's target must be a participant of a new thread (`FAC-SEM-026`).

**A request never waits for ever** (DEC-0098). A request submitted without a `deadline` gets one seven days after it
is stored; the board writes it into the request, so the message as read carries it. A request stored before this
decision carries none: its default is read from the time it was stored, never written into its event. On every pass a
board first answers each `queued` request its target Project had already answered with a participant's reply (never a responder's fenced message or progress note) (one that came
while the request was claimed, or before the board took this decision), then expires each `queued` or `claimed` request
whose deadline, its own or that default, has passed (DEC-0102). A responder's own messages never answer a request: after
a responder is replaced, the request is the new responder's to claim. A [hold](#holds) does not stop that clock: a
queued or claimed request held longer than its deadline expires (accepted work is kept, C4). A request whose target Project
nobody can answer now (no slot of that capability has a holder and no live `board.respond` grant exists) is still
stored, and the requester's own `com.submit` receipt carries `noResponder` with the target, the capability and one
sentence for a person: the target can still answer it with a reply, and a responder may come later. No other
participant sees `noResponder`. What the requester does then is the estate's rule, not the board's: in PassionCode,
fabric-workspace `knowledge/agents-first.md`, *When nobody answers*.

**A reply to an announcement says its type** (DEC-0098). A participant's reply whose `replyTo` is an announcement MAY
carry `reaction` (`comms-common.schema.json#/$defs/reaction`): `adapted` with `ref` (the commit or release),
`row` with `ref` (the row id) and `due` (the day it is expected to close), or `not-affected` (the body says why).
The board stores it with the message and every participant reads it. A `reaction` on any other message is refused
`invalid_arguments`. A reader that meets a reply to an announcement without one reads the body's first word, as
before (the estate's rule: fabric-workspace `knowledge/agents-first.md`, *Announcing a finished unit of work*).

A message as read (`comms-message.schema.json`) carries the sender's Project and principal with
provenance, the semantic digest the board computed, and the request's current state and effect
state; a request the estate owner settled says so (`settledBy: "owner"`, DEC-0081).
A redacted message keeps its id and digest and loses its body and, for a finding, its
`finding` too (DEC-0080): `consequence` is the sender's text, a second body. The board keeps the finding's `dedupeKey`
internally, so [dedupe](#dedupe) still answers for it.

## Findings

A message of kind `finding`, a kind since DEC-0022, may carry a structured `finding`
(`comms-common.schema.json#/$defs/finding`, DEC-0080). It is optional, so a finding without it stays what it was under
DEC-0022. Any other kind that carries it is refused `invalid_arguments` (the schemas; `FAC-SEM-108`).

| Member | What it is |
|---|---|
| `severity` | `info`, `warning` or `blocking`: how much it matters to what it affects, as the sender judges it |
| `consequence` | what happens to what it affects if nobody acts, 1–500 characters |
| `affects` | 1–16 items, each a backlog row `{repository, path, id}` or a task `{task}` |
| `dedupeKey` | the sender's name for what the finding is about, 8–128 characters `[A-Za-z0-9._:-]` |

- **Evidence is the message's `artifacts`**, at most 8 as for every message. The finding has no evidence member, and
  its schema is closed (`comms-submit-finding-with-evidence`).
- **A backlog row is linked, never copied.** `{repository, path, id}` is the row's identity in the common backlog,
  "repository + path + ID" (the knowledge base's backlog contract, fabric-workspace `knowledge/backlog.md` at
  `2d490612`):
  - `repository` is `<owner>/<name>`, the path of the canonical GitHub URL the repository's
    `docs/backlog-sources.json` names;
  - `path` is the source file relative to the repository's root, with no leading or trailing slash, no empty segment
    and no segment that starts with a dot, so no `..` and no hidden path;
  - `id` is the row's stable id. The backlog contract asks only for a nonempty string id; `backlogRowId` deliberately
    narrows it to 1–64 of `[A-Za-z0-9._-]` starting with a letter or digit, so no id holds a space, a colon or a slash.

  The item carries no title, status or text of the row: it is closed (`comms-submit-finding-row-copied`), and a reader
  follows it to the row's canonical source.
- **A task is `{task}`:** a task of the host that serves the board, named as a delegation token names the issuing
  host's task (DEC-0041; `hostTaskId`, 1–128 of `[A-Za-z0-9._:-]`). The host issues it, not the board, and it is
  opaque. It is not a service's own task run (`taskRunId` in a usage report, DEC-0065), which only that service names.
- **Each item once.** Two rows are the same when `repository`, `path` and `id` are each equal as written, two tasks when
  their ids are, and a row is never a task. They compare as written. A row's fields are no URI (no row pattern admits
  `:`), and a task id is an opaque id, which [identifier equality](identifiers.md) (DEC-0076) leaves as written, so
  its normal form and comparison as written agree.
  A submit's schema refuses a repeat (`uniqueItems`); in a message `FAC-SEM-108` does, because redacted items are
  alike and the schema cannot.
- **Severity is descriptive.** What it changes in notifications, the Telegram mirror or a hold is not decided
  (DEC-0080).

### Dedupe

A second report of the same thing is not a second finding (Fabric COM-05: "duplicate notification does not duplicate
finding"). The board dedupes by **the sender's Project and `dedupeKey`**: the Project from the authenticated endpoint,
the key compared as written. Dedupe is **never across Projects**: two Projects that name one `dedupeKey` make two
findings, because a hit across Projects would hand one Project the other's message and thread ids.

1. The board authorizes and validates the call and checks its idempotency key first. A stored key answers as
   [idempotency](#idempotency) says, whatever the dedupe key: the same digest its receipt with `repeated: true`, another
   digest `idempotency_conflict`.
2. A [hold](#holds) on the thread the call writes into answers `held` next, before dedupe, and stores nothing: a dedupe
   hit into a held thread is refused like any other submit into it.
3. A fresh key whose `finding` names the `dedupeKey` of a finding its Project sent, and the board still retains, answers
   that finding's receipt: its `message`, `thread` and `at`, with `repeated: true`. No message is stored. The board
   stores this receipt under the fresh key, so a retry of that key and digest answers it again, and the key counts
   toward its epoch's capacity like any other.
4. Otherwise the finding is stored as a new message.

The dedupe check and the store are one atomic step; of concurrent submits with one (Project, `dedupeKey`), exactly one
stores a message, the rest answer its receipt with `repeated: true`. `findingSubmitAnswer` in
[`src/comms-finding.ts`](../../src/comms-finding.ts) is a reference model of this order (`test/comms-rules.test.ts`).

**A repeat updates nothing.** The standing finding keeps its body, severity, consequence, affects, artifacts and `at`.
No read mark, unread count or notification moves, and the transport mirror sends nothing. The repeat's own thread is
not used: a repeat that names another thread, or a new one, creates no thread and reaches no new reader, because
widening the audience is a new, explicit sharing command ([threads](#threads-participants-and-reads)). So a repeat's
`receipt.thread` may differ from the thread the call named. Until a sharing command exists, a finding reaches another
audience only under another `dedupeKey`. A sender whose finding changed, such as a higher severity or another
consequence, sends it under a new `dedupeKey`.

**Dedupe is not idempotency:**

| | Idempotency | Dedupe |
|---|---|---|
| Keyed by | the Project's epoch and key, with the call's digest | the sender's Project and `dedupeKey` |
| The same key with other content | `idempotency_conflict` | `repeated: true` and the standing finding |
| Remembered | while its epoch's receipts are kept (open, closed, then retired) | while the finding is retained |
| Makes | a retry of one call one call | a second report of one thing one finding |

**A `dedupeKey` is remembered exactly as long as its finding is retained.** While the board retains the finding's
message, a redacted one included (redaction keeps the id and digest; the board keeps the `dedupeKey` internally,
although a reader of the redacted message no longer sees the finding), its key answers a repeat. When the finding leaves
retention, the key is forgotten and the next finding that names it is a new message. That retention is the host's; the
contract sets no other bound. Epochs do not move it: a closed or retired epoch neither forgets a `dedupeKey` nor keeps
one longer. A restored board keeps the findings its history holds, and their keys with them ([restore](#restore)).

`repeated` is the receipt's existing member (DEC-0073), so no receipt member is added. A receipt does not say which of
the two answered it; both mean that this call stored no message and `message` names the one that stands.

### Redacted items

The board shows a reader the `affects` items its grants cover. Each item outside them is replaced, in its place, by
`{redacted: true}` (Fabric COM-05: "unauthorized task/file references are redacted"). Which grants cover a row or a task
is the host's decision; the contract fixes the answer's form.

- **The count stays visible.** The array keeps its length and order, so a reader learns that the finding affects that
  many things it may not see, and the message names none of them: no repository, path, id or task. A reader shown
  fewer items would take a partial finding for a whole one. A finding whose every item is redacted still lists them all.
- **Only `affects` is redacted.** `severity`, `consequence`, the body, the artifacts and `dedupeKey` are the sender's
  text, read by every participant of the thread; a sender keeps out of them what it would not show every participant.
- **Only a reader's copy.** `{redacted: true}` is valid in a message as read (`comms-message.schema.json`) and refused in
  `com.submit` (the submit schema's `not`; `FAC-SEM-108`).
- **The digest and the key.** The message's `digest` stays the one the board computed at submit, as for a redacted
  body. It is an unkeyed SHA-256 over the whole submit, hidden items and idempotency key included
  ([idempotency](#idempotency)), so a reader who guessed every hidden item and the key could confirm the guess. A
  submit that carries `finding` MUST therefore use an idempotency key with at least 128 bits from a cryptographically
  secure random generator. The submit schema checks the length that can hold them, at least 22 characters of the
  key's 66-character alphabet (`comms-submit-finding-key-short`); the general key keeps its 8. The residual: the digest
  remains an oracle only against that key's entropy, so confirming a guessed item costs about 2^128 guesses of the key.
  A reader never sees the key: no message member carries it.

Who else hears of a finding is not decided here: sharing findings that affect X with Project Y would be an explicit,
grant-bound sharing command, never implicit. How the Telegram mirror redacts a finding's `affects` for a chat is not
decided either (DEC-0080, *Not decided here*).

## Request lifecycle

Request state and effect state are **separate facts**. Neither is inferred from a process being
alive, a lease, a Telegram delivery or a read mark.

| Operation | From → to |
|---|---|
| `com.claim` | `queued` → `claimed`; a lapsed claim → `claimed` with a **new attempt** |
| `com.accept` | `claimed` → `accepted`. The current responder acknowledged the exact request and digest. Nothing has happened yet |
| `com.effect_begin` | `accepted` → `in_progress`; effect `not_started` → `started` |
| `com.complete` | `accepted` or `in_progress` → `completed` / `failed_known`. After an effect began, only an **observed** result settles it |
| `com.cancel` | `queued` / `claimed` / `accepted` / `answered` → `cancelled`. After an effect began: → `outcome_unknown`, because a started effect may have happened |
| deadline | `queued` / `claimed` → `expired`. Accepted work is **held**, not expired (C4) |
| responder replaced | `claimed` → `queued`. `accepted` stays accepted; a new responder continues it only by an explicit checkpoint transfer |
| lost result | `in_progress` → `outcome_unknown` |
| `com.reconcile` | `outcome_unknown` → `completed` / `failed_known`, observed only, by the current responder, or the estate owner when no responder holds the slot (DEC-0081) |
| answer | `queued` → `answered`: a participant's message of any kind but `request` (never a responder's fenced message or progress note) from the request's target Project whose `replyTo` is the request, in the same transaction as that message, or on a board's pass for a `queued` request such a message already answered (DEC-0098, DEC-0102) |

An operator's [hold](#holds) (DEC-0079) is not an operation of this table: it moves no request and changes no revision,
it refuses some operations while it lasts, and a held request's deadline keeps running. It is not the C4 sense of
*held* above, in which accepted work outlives its deadline.

`FAC-SEM-027` checks this table. `completed`, `failed_known`, `cancelled` and `expired` are
terminal. `answered` is not open: no responder claims it, its deadline no longer expires it, and only the requester's
`com.cancel` moves it. It says the target answered, never that the asked work was done; a request a responder already
holds is not answered by a reply while the responder holds it; if it returns to `queued`, the board's pass answers it
for a participant reply that came meanwhile. `outcome_unknown` is left only by reconciliation (`com.reconcile`, by the current responder or, while no
responder holds the slot, the [estate owner](#owner-settlement)), and no expiry, restore, compaction or cancellation
erases it.

A reply is not a completion. `com.complete` (`comms-complete.schema.json`) names the request
through its fence. The target's participant reply to a `queued` request answers it, at once or on the board's pass for
one that came while it was claimed (above), and nothing else does.

### Owner settlement

A request in `outcome_unknown` waits for an observed reconciliation by the current responder. When no responder holds
its slot any more, because the agent was retired or never re-enrolled, the estate owner may settle it (DEC-0081). The
owner attests what it observed, and the board never fakes knowledge.

A request reaches `outcome_unknown` by three paths only, and the owner settles it after any of them:

- the sender's `com.cancel` after the effect began;
- a [restore](#restore), after which a started effect is `unknown`;
- the lost-result operation, when a holder took the slot and then left.

The lost-result operation runs only when the next holder takes the slot ([slots end with the
session](#slots-end-with-the-session)). An `in_progress` request whose responder retired with no successor therefore
stays `in_progress`. It reaches the owner through the sender's `com.cancel`, which moves it to `outcome_unknown`. This
decision adds no transition.

- **Who.** The settler is the operator principal that owns the request's target Project, `trusted` and verified by
  the host. In an organization estate that is that member only, as the directory never lists another owner's Project
  ([project directory](#project-directory)). No Project grant makes a principal the owner, and an `asserted` operator
  principal is not one. Every other caller, another member's operator included, is refused `not_authorized`. Who owns
  the target Project is the host's record when the call commits, not part of the transition record, so it is stated
  here and checked by the board, not by a rule on the record.
- **When.** The request is in `outcome_unknown`, and no responder holds the request's (Project, capability) slot:
  the slot is absent, or its holder's lease has lapsed with no current enrollment. The board checks this atomically
  with the transition, as it rechecks a fence (C4). While a responder holds the slot, the owner is refused
  `not_authorized`, and the message says the current responder settles it.
- **How.** The owner calls `com.reconcile` with a responder's arguments (`comms-reconcile.schema.json`). The board
  takes the caller's role from the authenticated endpoint, as it takes every identity, so there is one wire and one
  receipt. The idempotency namespace is the request's Project and the `com.reconcile` family, as for any call
  ([idempotency](#idempotency)).
- **Observed only.** The target is `completed` or `failed_known` with `observed: true`. A summary of what the owner
  observed is required, 1–2,000 characters; for a responder it stays optional. `evidence` artifacts are optional. A
  settlement without the summary is refused `observation_required`, and the request stays `outcome_unknown`.
- **No abandon path.** The owner cannot move the request to `cancelled`, and no operation moves `outcome_unknown` to
  `cancelled` (`FAC-SEM-027`). Closing such a request as cancelled would tell every reader that the effect did not
  happen, which nobody knows; a request whose outcome nobody observed stays `outcome_unknown`.
- **Who settled it is shown.** A board sends `settledBy: "owner"` on every owner settlement and on nothing else, in
  the receipt and in the message view (`com.get`, a `com.list` page), so every reader is told that the owner, not the
  responder, attested the outcome. Its absence means the responder settled the request. A request that is not
  `completed` or `failed_known` carries no `settledBy`, and the schemas refuse one, and `"responder"` too. The board's
  record of the transition carries the owner principal with its provenance, `trusted`. `com.status` shows no request,
  so it carries no `settledBy`.
- **A late responder.** A responder that enrolls afterwards finds the request terminal. A late `com.complete` or
  `com.reconcile` is refused (`invalid_transition`, or `fenced` / `revision_conflict` when its fence or revision is
  stale), never committed, never reopened.
- **The transition record.** The transition record is a host journal document, not a receipt:
  `{op, from, to, observed?, settledBy?, summary?, principal?}`, checked by kind `comms-transition`. Every `complete`
  and `reconcile` record carries `settledBy`, `"responder"` or `"owner"` (a value only the record uses; the wire sends
  `owner` alone), so a record cannot pass as the responder's by leaving it out. `FAC-SEM-027` checks the table and the
  observation. `FAC-SEM-109` checks that `settledBy` is on every settling record and on no other, and that an owner
  settlement is a `reconcile`, carries the summary and names a `trusted` `operator` principal (vectors:
  `fixtures/vectors/comms-settlement.json`). Whether a responder held the slot, and whether that operator owns the
  target Project, are the host's state at that moment, not in the record, so no rule on the record can check them.

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
- A submit that carries a `finding` uses a key with at least 128 random bits, because the digest covers what a reader
  may not see ([redacted items](#redacted-items), DEC-0080).
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

DEC-0022 named sixteen tools; DEC-0073 adds `com.directory`, seventeen in all. `com.reconcile` stays a responder
tool, and a board that serves it also answers the estate owner while no responder holds the slot
([owner settlement](#owner-settlement), DEC-0081). Calls are short MCP calls. No
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

**A host that cannot serve yet** (DEC-0098) answers every call with HTTP 503, a `Retry-After` header and the body
`comms-host-wait.schema.json`: `code` `stack-starting` while its store starts, `stack-unavailable` after it was lost,
`retryable: true` and one sentence. It answers before reading the call, the same for every caller, and stores
nothing, so the caller waits and calls again with the same arguments. It is not a refusal of the call
(`comms-refusal.schema.json`), and a client shows it as the host starting, not as the board being empty.

## Tools, arguments and answers

Every tool's arguments are a closed schema (DEC-0073): a member the schema does not name is refused
`invalid_arguments` before anything is stored. So no call carries the estate, the caller's Project, a principal, a
session, a slot's Project or a sequence number; the board takes each from the authenticated endpoint or from its
own records. A call's digest is `commsDigest(<tool>, <arguments>)` ([idempotency](#idempotency)). Every refusal is
`comms-refusal.schema.json`.

| Tool | Arguments | Answer | Receipt stored |
|---|---|---|---|
| `com.submit` | `comms-submit.schema.json` | `comms-receipt.schema.json`: `message`, `thread`, `at`, and `request` for a request, with `noResponder` when nobody can answer it now | yes |
| `com.list` | `comms-list.schema.json` | `comms-page.schema.json` | — (a read) |
| `com.get` | `comms-message-ref.schema.json` | `comms-message.schema.json` | — (a read) |
| `com.read_ack` | `comms-read-ack.schema.json` | `comms-receipt.schema.json`: `message`, `at` for one message; `marked`, `alreadyRead`, `at` and `more` for a bulk mark | no key and no receipt; marking read twice is one mark |
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
| `com.reconcile` | `comms-reconcile.schema.json` | `comms-receipt.schema.json`: `request`, with `settledBy` after an owner settlement | yes |
| `com.responder_replace` | `comms-responder-replace.schema.json` | `comms-receipt.schema.json`: `slot`, and `transferred` when it transferred requests | yes |

### Receipts

- A receipt never carries an estate-wide sequence number (C3) or another Project's data; its schema is closed, so a
  reader refuses a receipt with a member it does not name.
- `repeated: true` means the same key and digest were already stored, and this is that receipt. For a finding it may
  instead mean that the sender's retained finding with the same `dedupeKey` stands, and this is its receipt
  ([dedupe](#dedupe), DEC-0080).
- `request` is the request after the call: its state, its effect state and its revision. After the estate owner's
  settlement it carries `settledBy: "owner"`, and after a responder's it carries no `settledBy` (DEC-0081). `slot`
  and `attempt` carry what the caller's next fence needs, and after a replacement that transferred requests
  `transferred` carries it for each of them (DEC-0078). Their lease times are database time; the caller's clock is not authoritative.
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
  changes no request's state but one: the target Project's participant reply to a `queued` request answers it
  ([request lifecycle](#request-lifecycle), DEC-0098, DEC-0102); a responder's fenced reply never does.
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
- **Opt-out.** A Project can be unlisted. Its operator decides it, in the host (in Fabric per Project) or through their
  agent, which relays the decision to the host's list and unlist actions (`gate: relayed`, [service](service.md#actions)
  AP-2, DEC-0121; the host's tools are CT-125); an agent never lists or unlists a Project on its own account. An unlisted Project is absent from every page and every
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
until the owner re-enrolls. A started effect becomes `unknown` and waits for reconciliation: by a responder that
enrolls again, or by the estate owner while none holds the slot ([owner settlement](#owner-settlement), DEC-0081).

## Holds

The operator can **hold** a thread, a Project or a (Project, capability) responder slot through the host's own operator
controls (Fabric's board operator controls, its decision D9). While a hold lasts, the board refuses new work in its
scope with `held` and never refuses a call that settles, reports on or keeps alive work already started (DEC-0079).
A hold never refuses the current responder's calls on started work; if that responder's session ends under a slot or
Project hold, enrollment and replacement wait for the lift, and its accepted work stays held as C4 says.

- **Who sets it.** Only the operator decides a hold: in the host, or through their agent, which relays the decision to
  the host's set, lift and list actions (`gate: relayed`, [service](service.md#actions) AP-1 and AP-2, DEC-0121; the
  host's tools are CT-125). An agent never holds or releases work on its own account. A hold is not a grant change and not an authority revision: it never
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
  commits once the hold is lifted. For a finding the hold check comes before [dedupe](#dedupe): a dedupe hit into a held
  thread answers `held` and stores nothing (DEC-0080). A repeat of a key and digest whose receipt was stored before the hold answers that
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
| <a id="fac-sem-026"></a>`FAC-SEM-026` | `comms-submit` | a request's target is a participant of the new thread; a reply names what it answers; only a request carries request details |
| <a id="fac-sem-027"></a>`FAC-SEM-027` | `comms-transition` | a request moves only along the lifecycle table; an effect that began is settled only by an observed result |
| <a id="fac-sem-107"></a>`FAC-SEM-107` | `comms-directory` | a directory page lists each Project once and each capability once per Project; ids and capability names compare as written (DEC-0077) |
| <a id="fac-sem-108"></a>`FAC-SEM-108` | `comms-submit`, `comms-message` | only a message of kind `finding` carries `finding`; no two unredacted `affects` items are the same, compared as written; a redacted item only in a message, never in a submit (DEC-0080) |
| <a id="fac-sem-109"></a>`FAC-SEM-109` | `comms-transition` | every `complete` and `reconcile` record names who settled the request, `responder` or `owner`, and no other record does; the estate owner settles only by `reconcile`, with a summary of 1–2000 characters, as a `trusted` `operator` principal (DEC-0081) |

## Limits

| What | Limit |
|---|---|
| Body | 65,536 UTF-8 bytes, refused before hashing or storage (`body_too_large`) |
| Artifacts per message | 8 |
| Items a finding affects | 16 |
| A finding's consequence | 500 characters (code points) |
| A finding's `dedupeKey` | 8–128 characters `[A-Za-z0-9._:-]` |
| A finding's idempotency key | at least 128 random bits; the schema checks at least 22 characters |
| Participants of a new thread | 16 |
| Page | 100 messages |
| Directory page | 100 Projects |
| Capabilities per directory entry | 64 |
| Requests transferred by one replacement | 64 |
| Progress note, outcome or checkpoint summary | 2,000 characters (the estate owner's outcome summary is required, at least 1) |
| Responder lease | 60 s database time |
| Ids | 8–128 characters `[A-Za-z0-9_-]` (board-issued); Project ids up to 192 |

These are proposed resource bounds, not measured throughput.
