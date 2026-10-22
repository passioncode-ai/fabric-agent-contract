# Share registrations: `share-registration/1` and its receipt

DEC-0086, amended by DEC-0094 (the latest `protocols` list, the check-in trigger) · rule codes `FAC-SEM-117`, `FAC-SEM-118` (here) and `FAC-SEM-045` amended ([devices](devices.md#semantic-rules)) ·
schema [`share-registration.schema.json`](../../schemas/share-registration.schema.json), with
[`common.schema.json#/$defs/shareGrantId`](../../schemas/common.schema.json) and `#/$defs/orgContextId` · code
[`src/share-registration.ts`](../../src/share-registration.ts) · vectors
[`fixtures/vectors/share-registration.json`](../../fixtures/vectors/share-registration.json), written by
[`tools/vectors/share-registration.ts`](../../tools/vectors/share-registration.ts) · tests
[`test/share-registration.test.ts`](../../test/share-registration.test.ts)

A person shares one of their agents into an organization with a share grant (DEC-0082, [contexts](contexts.md)). The
organization server receives that agent's daily usage as `grant.usage`, one row per grant and UTC day, and wants to
bill and show it per agent. A `grant.usage` names the grant, not the agent, and the server never reads the person's
estate record, where the grant meets the agent's placement. A **share registration** closes that gap: the sharer's
enrolled node tells the organization server which `agentRef` each share grant into that organization runs, over the
device transport, signed by the enrolled device's key, and withdraws it when the share ends. The server keys what it
holds by the member the certificate binds, so no member can register, overwrite or withdraw another member's grant.

Sources: the first organization server's request VES-GRANT-CONTEXT on the project board (thread `cc944654`,
2026-10-17), its three items (a) where the server receives each share grant's id, context and `agentRef`, (b) a
`context` on `grant.usage`, (c) a grant id that holds no person's name, address or estate id; the contract's answer
DEC-0086, "(a) plus the context from (b)"; the contexts of DEC-0082; the device transport and attribution of DEC-0031,
DEC-0056 and `FAC-SEM-045`; the activity ack's closed rejection reasons (DEC-0030); OD-1 (DEC-0052, `FAC-SEM-067`);
`<name>/<revision>` and `schema-unsupported` (DEC-0067); identifier equality (DEC-0076); the held-record pattern of
DEC-0085. The brief is [`docs/evidence/specs/2026-10-18-share-registration/brief.md`](../evidence/specs/2026-10-18-share-registration/brief.md).

## The share grant id

A share grant into an organization (a grant whose `context` is `org:<orgId>`) has the `meta.id`
**`urn:fabric:share:<32 lower-case hex>`** (`common.schema.json#/$defs/shareGrantId`): 128 bits from a CSPRNG, never
derived from a name, an address, an estate id, an `agentRef` or the organization, and never all zeros. So the id an
organization server receives in a registration or a `grant.usage` holds nothing about the person, as a workflow id
cannot (`memory-capability.schema.json` pins `workflowId` to `^wf_[0-9a-f]{16}$`). A delegation token's grant claim
carries the same id only when `FAC-SEM-117` ran before the revision was signed; a grant written without it can carry
another `meta.id` there.

The pattern admits only its own normal form (DEC-0076: `urn` and the NID lower-cased, the NSS kept), so the id is
**compared as written** ([identifiers](identifiers.md#where-identifiers-are-compared)): `URN:fabric:share:...`, upper-case
hex, 31 or 33 digits, a `#1`, a surrounding space and a trailing newline are not share grant ids. The pattern has no `m`
flag; a port whose `$` matches before a final newline (Python's `re`, PCRE) anchors with `\Z` or compares the whole
string, which the vectors' "a trailing newline" case checks.

`FAC-SEM-117` checks the form where a grant is written, and two more writer's duties on a share grant into an
organization: its `startsAt` and `expiresAt` carry at most three fraction digits, and it **keeps its `agentRef` across
revisions**. Moving a share to another agent revokes the grant and mints a new id. Kind `org-share-grants` takes
`parent`, the latest earlier revision that placed the grant in its context (the immediate parent when it did), and refuses a revision whose placements run the grant under another `agentRef` than that
revision's did. The writer passes that revision, not only the immediate parent: a move in two steps (a revision with no
placement under the grant, then one placing it under another agent) is caught only so. A grant the given revision does
not place is not compared, so when the record's grants were last placed in different revisions the writer runs the kind
once with each of them. The rule
runs where a grant is written: Fabric and the adapter's kits run it before a passkey signs a
revision. It is not part of `governance.schema.json` nor of `verifyEstateRecord`, on purpose: a naming fault must not
lock an estate out of its own record. It fails closed for billing only: a grant of another form registers nothing
(the derivation's `share-grant-id`), the schema refuses its `grant.usage`, and the organization sees no usage for it.

## The registration

`share-registration/1` ([schema](../../schemas/share-registration.schema.json), closed) is one of two states:

| Member | Active | Withdrawn | Rule |
|---|---|---|---|
| `type` | yes | yes | `share-registration/1` |
| `grantId` | yes | yes | the share grant's `meta.id`, a share grant id |
| `context` | yes | yes | the grant's own context, `org:<orgId>` (`orgContextId`: a context id other than `personal`) |
| `state` | `active` | `withdrawn` | |
| `grantRevision` | yes | no | the grant's `meta.revision` in the revision the node applied, 1 to 2^53 − 1 |
| `agentRef` | yes | no | the one `agentRef` the revision's placements in this context run under the grant (`fabric-package#/$defs/agentRef`) |
| `startsAt`, `expiresAt` | yes | no | the grant's window at millisecond precision (see *Times* below); strict RFC 3339 instants, seconds 00 to 59, at most three fraction digits, `startsAt` < `expiresAt` (`FAC-SEM-118`) |
| `withdrawnAt` | no | yes | when the share ended, at millisecond precision; a strict instant, seconds 00 to 59, at most three fraction digits |

Nothing else: no estate id or revision, machine id, principal, issuer, `createdBy`, project, audience, capabilities,
effect ceiling, data classes, spend, content hash or free text. `shareRegistrationDigest(registration)` is `sha256:` and
the hex SHA-256 of the UTF-8 RFC 8785 form of the registration; it is how the receiver tells two registrations of one
revision apart.

The receiver answers `share-registration-receipt/1` `{type, grantId, state, digest}`: `registered` (an active
registration taken), `withdrawn` (a withdrawal taken) or `unchanged` (the same bytes again, or a second withdrawal);
`digest` is the digest of the registration it holds after the request. Or it refuses with `{error: {code, message}}`,
`message` at most 200 characters, `code` one of the SR table's.

## Transport

A registration is a device request (DEC-0086 item 1): the node sends it to the organization server of one of its own
enrollments, under mutual TLS and the DEC-0056 `fabric-device` signature by that enrollment's `#sig` key, `keyid` the
certificate's serial ([devices → transport](devices.md#transport): "every batch, check-in, rotation and
share-registration request"). The path is the receiver's; the contract names none. `share-registration/1` and
`share-registration-receipt/1` are protocol revisions of their own (DEC-0067): the receiver lists `share-registration/1`
in its `protocols`, and a node sends registrations only to a receiver whose latest `protocols` list (from its enrollment response, or a check-in response that carries one, DEC-0094) names it.

Only the enrolled node holds the device's certificate and key, so only it can make the request the receiver attributes.
It registers only what a passkey signed: it builds registrations from the estate revision and the revocation-delta
entries it applied, never from a draft. Fabric's share flow (CX-FAB-04) causes a registration by drafting the revision
the passkey signs, and never sends one itself. A withdrawal follows the record and the delta, with no second path.

## Derivation (the node)

`deriveShareRegistrations(record, appliedEntries, orgId, previouslyRegistered)` answers `{registrations, degraded}`
for one enrollment, `orgId` its `org.id`. It is total: malformed input answers no registration. For each share grant
of the applied revision whose `context` is `org:<orgId>` as written, in the record's order, each id once:

1. a `meta.id` that is no share grant id registers nothing: degraded `share-grant-id`;
2. a grant revoked by the record or by an applied delta entry (a `grant` revocation whose `ref` names it by normal form,
   DEC-0076) is withdrawn at the earliest `revokedAt` among them;
3. otherwise the placements of the revision (`machines[].packages[]`) in that context that name the grant by normal form
   decide: none, nothing yet; two `agentRef`s, or one that is no agentRef, nothing (degraded `share-grant-agents`); one,
   an active registration with the grant's `meta.revision`, `startsAt` and `expiresAt` (see *Times*).

Then each grant id in `previouslyRegistered` (the ids the node registered active toward this enrollment) that the
revision no longer lists in that context is withdrawn: at the earliest `revokedAt` when a revocation names it, else at
the revision's `issuedAt`. A revision, window or time that the registration cannot carry (a revision below 1, a time
`strictTime` cannot read, a window that is empty once carried) registers nothing: degraded `share-grant-unreadable`.
Personal grants, grants that state no context and other organizations' grants never register.

**Times.** A registration carries every time at millisecond precision, so every port compares the same instants
(DEC-0085's rule). A grant's or revocation's time with at most three fraction digits is carried as written, its offset
kept. One with more is rounded to milliseconds: a withdrawal time is **floored** (a withdrawal may end a share up to a
millisecond early, never late), a window is **rounded inward** (`startsAt` up, `expiresAt` down), so a registered
window is never wider than the grant's. Flooring cuts the fraction to three digits and keeps the offset, so every
readable time can be carried, a year 9999 one at an offset included; a start rounded up by a millisecond is written as
`Date#toISOString` writes it, in UTC. The earliest of several revocations is chosen at millisecond precision after the
floor, the first listed among equals: the record's revocations in their order, then the applied delta entries in theirs. So a revoked share is withdrawn whatever the number of fraction digits its
revocation carries. A start rounded up can move to the next UTC day (`23:59:59.9995Z` is carried as the next day's
`00:00:00.000Z`), so that day's usage is `before-start`; a grant that passed `FAC-SEM-117` never has such a start. `FAC-SEM-117` makes the writer's side the simple one: a share grant into an organization
carries its window with at most three fraction digits, Fabric writes its revocations' `revokedAt` so, and the hub
SHOULD (revocation-delta.md); the derivation floors whatever they write.

A machine enrolled with role `org-cloud` (DEC-0099) derives no registration (`deriveShareRegistrations` takes no role
yet, CT-94: until it does, the node skips derivation on such an enrollment itself): share grants are a person's and such a
machine binds none, so its SR-5 is final, not a wait (DEC-0102). A node sends on change: after it applies a revision or a delta entry, after an enrollment, and after a check-in
response's `protocols` first lists `share-registration/1` (DEC-0094). It SHOULD send each
active registration again at least every 7 days (`RESEND_SECONDS`), so a receiver that lost one learns it again; a
redelivery answers `unchanged`. That resend skips a registration the receiver refused with a typed refusal, which waits
for the record to change as below, except SR-5a's `purpose-not-collected`, which it sends again at the resend and when
its policy names a later `noticeVersion`, or a check-in response whose `acknowledgedNoticeVersion` differs from the one it held at the rejection (DEC-0100, DEC-0102; a present value that differs from the one held at the rejection resumes, absence at the rejection included (a first acknowledgement is a change, as on a managed machine whose collection started at the deadline); a value that becomes absent is no signal). It keeps each receipt. It sends nothing again that the receiver
answered with a typed refusal of the SR table (SR-2 to SR-9) until the record changes, and reports the grant degraded
meanwhile, SR-5a again excepted: that grant is held, not degraded; after no
answer, a transport refusal (401) or a receiver's fault it sends again with backoff; after 410 `organization-closed`
(DEC-0103) it sends that organization nothing again. The sender gate below reads the same split.

## The receiver

The receiver takes the organization from the certificate's `org.id` and the registrant from the `user.id` bound to the
certificate's epoch ([attribution](devices.md#attribution)), never from the body. It keeps **one held list per
organization**: a held entry carries no organization, because the user id and the grant id are keys inside the
organization whose certificate bound the user, and a user id of one organization says nothing in another. The functions
below are given the list of the organization the certificate binds. It keys what it holds by (registrant
`user.id`, `grantId`), so one member cannot overwrite, squat on or attach usage to another member's grant: two members
who register one grant id hold two registrations. It keeps the request's body bytes and its `Signature-Input` and
`Signature` fields as evidence.

`decideShareRegistration(held, registration, binding)` answers in this order and never throws. `held` is the
receiver's list of held entries; `binding` is `{transport, org: {id}, device?, user?: {id}}`, the certificate's binding
for its epoch with `transport` the verdict of devices.md's transport steps (`{ok: true}` or `{ok: false, code}`) and,
optionally, `purposeAdmitted`, the receiver's own answer to whether that user's acknowledged notice names a share
registration's purposes (a value that is not a boolean is SR-0):

| Row | Answer | When |
|---|---|---|
| SR-0 | `{fault: "context-invalid"}`, or the transport's own step-0 fault (`clock-unreadable`, `base-url-invalid`) | an `organization-closed` verdict without a readable `closedAt`; the receiver's own context is unusable: `held` is not a list of well-formed entries, one per (user, `grantId`); the binding is not `{transport, org: {id}}` with a string `org.id`, or its `user` is not `{id}` with a non-empty string; the transport verdict names no step's code. The fault is the receiver's; nothing is accepted |
| SR-1 | 401 and the step's code; 410 `organization-closed` with `closedAt` (DEC-0103) | DEC-0056 steps 1 to 8 refused the request (`signature-missing` to `signature-replayed`); a closed organization's certificate at step 4 |
| SR-2 | 400 `schema-unsupported` (DEC-0067's body) | the body is an object whose `type` is a string other than `share-registration/1` |
| SR-3 | 400 `malformed` | the body is not the schema's registration (a missing or extra member, a value outside its rule, a state's members wrong) or breaks `FAC-SEM-118`'s document clauses (an instant on a day that does not exist, a window that does not end after it starts) |
| SR-4 | 403 `wrong-organization` | `context` is not `org:` followed by the certificate's `org.id` as written (never case-folded, never by prefix) |
| SR-5 | 403 `unassigned-device` | no user is bound to the certificate's epoch |
| SR-5a | 403 `purpose-not-collected` | an active registration while `binding.purposeAdmitted` is `false` (a withdrawal passes to SR-10 and SR-11: it reduces processing, DEC-0102): the notice the bound user acknowledged does not name the purposes a share registration serves (agent calls, usage and cost). The receiver states it from its own records; absent, nothing is checked here (DEC-0100) |
| SR-6 | 409 `already-withdrawn` | an active registration while a withdrawal is held for (user, `grantId`), a tombstone included |
| SR-7 | 409 `agent-mismatch` | an active registration naming another `agentRef` than the active one held, whatever its revision. A grant keeps its `agentRef` (`FAC-SEM-117`); the recovery is to revoke the grant, mint a new id and register that |
| SR-8 | 409 `stale-revision` | an active registration with a lower `grantRevision` than held |
| SR-9 | 409 `revision-conflict` | an active registration with the held `grantRevision` and another digest |
| SR-10 | 200 `unchanged` | the digest held, or a second withdrawal: of two withdrawals the earliest `withdrawnAt` is kept, with its digest |
| SR-11 | 200 `registered` or `withdrawn` | otherwise: the first registration, a higher revision (which replaces what is held and may extend `expiresAt`), or a withdrawal |

The answer is `{status: 200, receipt, held}` with the entry to hold, `{status, body}` for a refusal, `{status: 401,
code}` or `{status: 410, code: "organization-closed", closedAt}` for SR-1, or `{fault}` for SR-0.

### What the receiver holds

Per (user, `grantId`): `{user, grantId, state, grantRevision?, agentRef?, startsAt?, expiresAt?, withdrawnAt?, digest}`
(DEC-0086 item 5).

- **A withdrawal is final.** It keeps the active registration's members, so usage before it still joins; a later active
  registration is `already-withdrawn`.
- **A tombstone** is a withdrawal that arrived with nothing held: it holds no `agentRef`, so it joins nothing, and the
  active registration that arrives after it is refused. Registrations arrive in any order; the tombstone keeps a late
  active registration from bringing a withdrawn share back.
- **Of two withdrawals** the earliest `withdrawnAt` is kept.
- **A registration ends** at the earlier of `expiresAt` and `withdrawnAt`. Only a higher `grantRevision` extends
  `expiresAt`.
- The receiver keeps held entries, body bytes, signature fields and tombstones at least as long as its raw retention.

## The join

`grant.usage` carries **`context`** (DEC-0086 item 6), the grant's own `org:<orgId>`, the value the collector passed to
`routeGrantUsage`; `context` is required (`orgContextId`) and `grantId` is a share grant id
([activity → kinds](activity.md#kinds)). `FAC-SEM-045` is amended: a `grant.usage` whose `data.context` is not `org:`
followed by the certificate's `org.id` as written is rejected with the existing reason `attribution`; the ack gains no
value. `FAC-SEM-039`'s key (stream, day, `grantId`) is unchanged, and so is `routeGrantUsage`.

`joinGrantUsage(event, binding, registrations)` answers in this order and never throws. `binding` is the one recorded
for the event's epoch (`{org: {id}, user?: {id}}`, as `FAC-SEM-045` reads it); `registrations` is the held list:

| Row | Answer | When |
|---|---|---|
| GJ-0 | `{fault: "context-invalid"}`; rejected `schema` | the receiver's own context is unusable (the held list or the binding); the event is not a `grant.usage` whose `data` has a day that exists, a share grant id and an organization's context, which a schema-validating receiver refused before |
| GJ-1 | rejected `attribution` | `data.context` is not `org:` followed by the certificate's `org.id` as written |
| GJ-2 | stored, not joined, `unassigned-device` | no user is bound to the event's epoch |
| GJ-3 | stored, not joined, `unregistered` | no registration with an `agentRef` is held for (bound user, `grantId`): none at all, another member's only, or a tombstone. The receiver joins it again when a registration arrives |
| GJ-4 | stored, not joined, `before-start` | `day` is before the UTC day of `startsAt` |
| GJ-5 | stored, not joined, `after-end` | `day` is after the UTC day of the end, the earlier of `expiresAt` and `withdrawnAt`; the end's own day joins |
| GJ-6 | stored, joined to the registration's `agentRef` | otherwise |

A rejected event is consumed, as every rejection (DEC-0030). A stored event that is not joined keeps its sums and is
shown under its grant without an agent. Days compare as UTC days: a `startsAt` of `2026-10-12T22:00:00-05:00` starts on
13 October, which the vectors check in three time zones. A port compares days as numbers (midnight UTC), not as
`YYYY-MM-DD` text of the end: an `expiresAt` of `9999-12-31T23:00:00-05:00` falls in year 10000 in UTC, and day
`2026-10-15` still joins.

**The sender gate.** A collector emits `grant.usage` for grant G toward enrollment E only as
`gateGrantUsage(answer)` allows, `answer` being E's latest answer to G's registration in the shape
`decideShareRegistration` answers, or none yet. It never throws:

| Gate | Answer |
|---|---|
| `send` | a status 200 receipt, whatever its state (usage before a withdrawal still joins); a 409 `stale-revision` or `already-withdrawn` (the receiver holds a registration or a final withdrawal) |
| `hold-degraded` | a typed refusal of the SR table that sending the same registration again does not clear: 409 `revision-conflict` or `agent-mismatch`, 403 `wrong-organization` or `unassigned-device`, 400 `malformed` or `schema-unsupported`. The node keeps the sums, reports itself degraded and sends again only when the record changes |
| `hold-notice` | 403 `purpose-not-collected` (DEC-0100): the node keeps the sums, is not degraded, and sends the registration again when its policy names a later `noticeVersion`, or a check-in response whose `acknowledgedNoticeVersion` differs from the one it held at the rejection ([devices](devices.md#policy), DEC-0102), and at the seven-day resend |
| `stop` | 410 `organization-closed` (DEC-0103): the organization ended; the node keeps nothing for it and sends it nothing again ([devices](devices.md#organization-closed)) |
| `hold` | no answer yet, a transport refusal (401), a receiver's fault, a code under a status that is not its own, or anything else: the node keeps the sums and sends the registration again with backoff |

So no `grant.usage` reaches a receiver that has no way to read it. After `agent-mismatch` the usage of the old grant
stays held; the share continues under the new grant id (SR-7's recovery).

Joined usage is per person. Another person sees it only as sums per UTC day or billing period, each read logged
(OD-1, `FAC-SEM-067`).

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-117"></a>`FAC-SEM-117` | `grant`, `org-share-grants` | a grant whose `context` is an organization's has a share grant id as its `meta.id` (`urn:fabric:share:` and 32 lower-case hex digits, not all zeros, as written) and a `startsAt` and `expiresAt` with at most three fraction digits; on a record (`{record, parent?}`), each such share grant does, the placements in its context that name it by normal form run one `agentRef`, and, given `parent` (the latest earlier revision that placed the grant in its context (the immediate parent when it did)), the same `agentRef` as that revision's placements ran under the same grant |
| <a id="fac-sem-118"></a>`FAC-SEM-118` | `share-registration`, `share-registration-derive`, `share-registration-intake`, `grant-usage-join` | a registration's instants are on days that exist and an active one's window ends after it starts; an implementation's derivation, decision and join answer as `deriveShareRegistrations`, `decideShareRegistration` and `joinGrantUsage` do, row for row of the SR and GJ tables |

| Kind | Input |
|---|---|
| `org-share-grants` | `{record, parent?}`, an estate record and, optionally, the latest earlier revision that placed the grant in its context (the immediate parent when it did) |
| `share-registration` | a document of `share-registration.schema.json`; a receipt or a refusal has no clause |
| `share-registration-derive` | `{record, entries, orgId, previouslyRegistered, answer}`; `answer` is `{registrations, degraded}` |
| `share-registration-intake` | `{held, registration, binding, answer}` |
| `grant-usage-join` | `{event, binding, registrations, answer}` |

Fixtures: `fixtures/positive/share-registration-*`, `fixtures/negative/share-registration-*`,
`fixtures/negative/telemetry-event-grant-usage-no-context.json` and `-personal-context.json`;
`fixtures/semantic/share-*` (one intake fixture per SR row), `fixtures/semantic/grant-usage-join-*` (one per GJ row),
`fixtures/semantic/device-attribution-grant-usage-*`.

## Compatibility

Additive, except `grantUsage`. A DEC-0086 collector's `grant.usage` carries `context` and a share grant id, which a
receiver pinned at DEC-0082 refuses as the event's `schema` rejection (its `grantUsage` is closed); the sender gate
keeps it from being sent there, since such a receiver lists no `share-registration/1`. A DEC-0082 collector's event,
with no `context`, is refused by a DEC-0086 receiver; so a collector implements `grant.usage` at DEC-0086 directly.
Checked before merge on the project board (2026-10-17 and 2026-10-18): no collector emits `grant.usage` (CT-51:
Project Observatory's row was only requested); the first organization server's per-agent part waits on this decision
(thread `b68f4399`); no signed revision holds an `org:` share grant (the RM-28 pilot is not linkable yet, K-1). The
contract's fixtures with an `org:` share grant or a `grant.usage` moved to the new id form and gained `context`, each
keeping its verdict. `contractVersion` stays `0.1.0`.

## Who adopts it

- **Fabric** (CX-FAB-04) mints `urn:fabric:share:<32 hex>` from a CSPRNG for each share grant into an organization, runs
  `FAC-SEM-117` with `parent` the latest earlier revision that placed each grant before the passkey signs, writes the window and every `revokedAt` with at most
  three fraction digits, drafts one `agentRef` per organization grant and never re-points it (a move revokes and mints a
  new id), shows the `agentRef` and the window on the share card, and never sends a registration. The hub SHOULD write the
  revocation delta's `revokedAt` with at most three fraction digits.
- **Project Observatory's node and collector** derive registrations per enrollment and send them signed (DEC-0056), keep
  the receipts, withdraw on revocation or drop, send again after an enrollment, after a check-in response's `protocols` first lists `share-registration/1`
  (DEC-0094) and weekly (never what a typed refusal
  answered until the record changes, except SR-5a's `purpose-not-collected`, sent again weekly, on a later
  `noticeVersion` and on a new `acknowledgedNoticeVersion`, DEC-0100, DEC-0102; with backoff after no answer, a 401 or a receiver's fault; nothing
  after 410 `organization-closed`, DEC-0103), emit `grant.usage` with
  `context` only as `gateGrantUsage` allows, and run `fixtures/vectors/share-registration.json` (its `gate` cases too).
- **The first organization server** adds a device route for `share-registration/1` after DEC-0056's steps and
  DEC-0067's check, answers the SR rows and joins by the GJ rows, keys by (bound user, `grantId`) in one held list per
  organization, keeps held entries,
  body bytes, signature fields and tombstones, refuses a mismatched `grant.usage` context as `attribution`, shows
  per-agent usage to others only as sums with each read logged, lists `share-registration/1` in every `protocols`
  list it sends (its enrollment response, and its check-in response when it carries one, DEC-0094), and runs the vectors.
- **fabric-agent-adapter** vendors the schema and the two common defs; its kits run `FAC-SEM-117`, `FAC-SEM-118` and the
  amended `FAC-SEM-045`.

The board row is CT-56.

## Privacy

The receiver sees a random grant id, the grant's revision, its own context, the `agentRef`, the window and a withdrawal
time, beside its member's `user.id`, the device's id and the certificate serial it already holds: the fact the share
creates. It never sees the estate id, other machines or placements, personal grants, grants into other organizations,
principals, issuers, projects, capabilities or spend. Fabric shows the `agentRef` and the window before the passkey
signs.

## Alternatives refused

- **`proposal.submit`** (DEC-0072): an approval lifecycle for rules and listings on Fabric's board transport, with no
  device attribution and no withdrawal tied to revocation.
- **`agentRef` on `grant.usage`:** unverifiable per event, nothing held before the first use, no withdrawal or expiry.
- **`agentRef` on the grant:** a closed schema every meter would repin, while a placement already binds it.
- **A passkey statement or `share-grant/1`:** they carry `estate` (DEC-0063), checkable only with the estate's
  credentials, which item (c) keeps from the organization.
- **The server reads the estate record, or Fabric calls it under an SSO session:** excluded by the request; neither is a
  device proof.

## Not decided here

- The access level shown to the organization.
- Refusing an `agentRef` absent from the entitlement's `agents` (DEC-0085): the receiver's policy.
- Private-agent marks on sharing.
- A local-channel method for Fabric to read registration state.
- How long a node keeps unsent sums.
- Registrations from unassigned devices (refused for now, SR-5).
- Refusing a share grant that is dropped from placements but not revoked (an extension of `FAC-SEM-114`).
- Carried from DEC-0082: corrections of a day's `grant.usage` after it was emitted, two collectors of one device,
  mapping `audience` to `agentRef`, CX-CON-06.
- A signature on the receipt.
