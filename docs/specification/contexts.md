# Contexts — `personal` and `org:<orgId>`

DEC-0082 · rule codes `FAC-SEM-110` (here) and `FAC-SEM-111` ([estate record](estate-record.md#semantic-rules)) ·
schema [`common.schema.json#/$defs/contextId`](../../schemas/common.schema.json) · code
[`src/context-route.ts`](../../src/context-route.ts), [`src/context-rules.ts`](../../src/context-rules.ts) · vectors
[`fixtures/vectors/context-route.json`](../../fixtures/vectors/context-route.json), written by
[`tools/vectors/context-route.ts`](../../tools/vectors/context-route.ts) · tests
[`test/contexts.test.ts`](../../test/contexts.test.ts), [`test/context-route.test.ts`](../../test/context-route.test.ts)

A person works in their own **personal** context and in each organization they belong to. RM-28's pilot puts one
person, their personal context and two organizations on one machine, and shares the person's own agents into both
organizations as separate instances with different access levels. This page is the contract's slice of that pilot:
the context id, a grant's context, one placement per context in the estate record, a grant's daily usage for the
organization it is shared into, and where a collector sends what it sends. It is the pilot slice of N20 (board row
CT-38): CX-CON-01 for grants and placements only, and CX-CON-02 whole. The rest of N20 waits on Fabric's organization decision (D8).

The context id has a page of its own because four readers compare it — the grant ([governance](governance-and-roles.md)),
the [estate record](estate-record.md)'s placements, the collector's routing ([activity](activity.md),
[devices](devices.md)) and consumers such as Fabric Switchboard's session pool — and one home keeps them comparing it
alike.

## The context id

`common.schema.json#/$defs/contextId` is one of:

- `personal` — the person's own work;
- `org:<orgId>` — an organization, where `orgId` is the organization server's opaque id of it: a letter or digit, then
  up to 127 of `[A-Za-z0-9_-]` (1–128 characters). (Informative: the first organization server, at its commit `03d454b`, issues ids of the form
  `org_<base32>`.)

Context ids compare **as written**: never case-folded, never trimmed, never by prefix, as DEC-0077 compares board ids.
`Personal`, `ORG:x`, `org:` with an empty or a 129-character id, a surrounding space and a trailing newline are not
context ids (the schema, `parseContext`, and the vectors' `contexts`, which `test/context-route.test.ts` runs through
both). `org:personal` is an organization whose id is the word `personal`, not the personal context. A context id is not
an identifier under DEC-0076: its pattern admits no upper-case prefix and no `%`, so every valid value is already its
normal form and the two comparisons agree ([identifiers](identifiers.md#where-identifiers-are-compared)).

A device's enrollment names its organization by `org.id`, an opaque id (`activity-common.schema.json#/$defs/opaqueId`,
DEC-0031). `orgId`'s pattern is the part of that set a context can name, so every valid organization context can name an
enrollment; an `org.id` that holds `.`, `:` or `~` can be enrolled but is no context, so nothing of a context is routed to
it (the vectors carry `org.example`). So **an organization server that takes part in contexts MUST issue its `org.id`
within `[A-Za-z0-9][A-Za-z0-9_-]{0,127}`** (DEC-0082; [devices](devices.md#enrollment)).

Fabric Switchboard uses the same form for its pool's context attribute (its SB-109, the pilot's answer of 2026-10-13).

## The grant's context

A standing grant (`governance.schema.json#/$defs/grant`, DEC-0039) gains an optional `context`: the context in which the
grant's principal uses it. A share grant into an organization carries that organization's `org:<orgId>`.

- **`FAC-SEM-110`**: a grant with `principalKind: external` never has `context: "personal"`. A principal outside the
  estate uses the grant in its own organization, never in the owner's personal work. The rule runs on a grant (kind
  `grant`) and on every share grant of an estate record (kind `estate-record`).
- An absent `context` is allowed and means *not stated*, so every grant written before DEC-0082 stays valid. A share
  grant that an organization's instance runs under states its context (`FAC-SEM-111`).

## Access levels

There is no access-level field. A grant's access level is its own `capabilities`, `effectCeiling`, `dataClasses`,
`spend` (its windows, `payer: owner`) and `expiresAt` (DEC-0037, DEC-0038, DEC-0039). Two share grants into two
organizations with different values of those fields are two access levels. A named level ("read only", "full") is a
host's preset in its interface that fills those fields. An `accessLevel` field would be a second source of truth: it
would need a rule reconciling it with the fields, and a checker would have to choose between them (DEC-0082 item 3).

## One instance per context on a machine

An agent runs on one machine once per context. In the estate record, a placement (`machines[].packages[]`) gains an
optional `context` (absent means `personal`) and an optional `grant`, the id of the share grant it runs under; a secret
placement (`machines[].secrets[]`) gains `context` too, so a slot fills one instance. The rules are the estate
record's ([machines](estate-record.md#machines), [semantic rules](estate-record.md#semantic-rules)):

- `FAC-SEM-074`: an agent is placed once per (machine, `agentRef`, context);
- `FAC-SEM-075`: a slot is placed once per (machine, `agentRef`, slot, context), for an instance placed in that
  context; an organization's instance fills its slot from its own machine (`from` is that machine);
- `FAC-SEM-111`: an instance in `org:<orgId>` names its share grant — one of the record's, matched by normal form
  (DEC-0076), whose `context` is the placement's as written, and which the record does not revoke; a personal instance
  names none, and a context that is not `personal` and not an `org:<orgId>` (such as `Personal`) matches no grant, so it
  fails closed.

**Secrets of an organization's instance stay on its machine.** A secret envelope (`fabric-secret-envelope/1`, DEC-0047)
names an `agentRef` and a slot, never a context, so the target's open context (`estateEnvelopeContext`, relay.md's
[open step 6](relay.md#the-secret-envelope)) reads only its personal secret placements: the personal instance's slot alone
is filled by an envelope, and the answer does not depend on the order of the record's secret placements (the `placement`
group of `fixtures/vectors/secret-envelope.json` lists an organization's placement first). An organization's instance fills its slot from its own machine's vault
and never admits an envelope for it (`FAC-SEM-075`). An envelope that names a context is not decided here.

`FAC-SEM-111` reads record revisions only. A revoked share grant stops calls at once where it is checked — the hub
mints no token under it and the meter denies it (`grant-revoked`, DL-24), both reading the revocation delta (DEC-0054) —
and `FAC-SEM-111` refuses the instance from the next revision, which lists the revocation (`FAC-SEM-084`).

`placementTrust(record, machine, agentRef, context)` and kind `estate-placement` (`{record, machine, package, context?}`)
take the context, `personal` when it is not given, so a caller written before DEC-0082 is unchanged.

<a id="routing"></a>

## Routing

**No event carries its session's context, and no check-in carries a context.** An organization server already knows the
organization from the device certificate: the certificate binds `org.id`, and a receiver attributes by it, never by the
body (DEC-0031, `FAC-SEM-045`). A context field would add nothing it does not know, and it could leak `personal` or
another organization's id to a receiver, which unlinkable memberships forbid (the RM-28 report's CX-22). A `grant.usage`
and a share registration carry their grant's own `org:<orgId>` (DEC-0086, amending DEC-0082 item 5): the receiver
compares it with its certificate's `org.id` and refuses it when they differ, so the field adds a check and tells the
receiver nothing it does not know ([share registration](share-registration.md#the-join)). What a device
sends, and to which organization server, is decided three ways:

- **Check-ins** are the device's, not a session's. A device enrolled in several organizations holds one enrollment per
  organization and sends each enrollment's check-ins to that enrollment's own server, on that enrollment's interval,
  reporting only that enrollment's streams ([devices → check-in](devices.md#check-in), DEC-0031).
- **A session's events** go where `routeTarget(sessionContext, enrollments)` in `src/context-route.ts` answers;
  `enrollments` lists the `org.id` of each of the device's enrollments, and the session's context is the collector's own
  record of the session, never a field of the event.
- **A grant's usage** (`grant.usage`, [below](#usage-per-grant)) goes where `routeGrantUsage(grantContext, enrollments)`
  answers: by the grant's own `context`, not by any session.

`routeTarget` answers:

| Session context | Answer |
|---|---|
| `org:<orgId>`, with exactly one enrollment whose `org` is `orgId` as written | `{route: "enrollment", org, index}`: that enrollment's organization server |
| `org:<orgId>`, with no such enrollment | `{route: "none", reason: "not-enrolled"}` |
| `org:<orgId>`, with two such enrollments | `{route: "none", reason: "ambiguous"}`: a re-enrollment replaces the earlier one, so a device holds one per organization; it sends to neither |
| `personal` | `{route: "none", reason: "personal"}`, always: personal work never goes to an organization server |
| anything that is not a context id (`Personal`, `org:`, a non-string) | `{route: "none", reason: "not-a-context"}`: the collector sends nothing |

`routeGrantUsage` answers as `routeTarget` with the grant's context, and `{route: "none", reason: "no-context"}` for a
grant that states none. The reasons are `personal`, `not-a-context`, `not-enrolled`, `ambiguous` and `no-context`. Both
functions are total: malformed input answers `none` and never throws, an enrollment that is not an object with an own
string `org` is skipped, and nothing is read from an object's prototype. The shared vectors
`fixtures/vectors/context-route.json` hold every answer and the cases a lax port gets wrong: a case-folded id, a prefix
of an enrolled id, an enrolled id that is a prefix, `org:` with an empty or a 129-character id, `Personal`, a trailing
newline, a bare organization id, an enrolled `org.example` no context names, non-string input, and an `org` only
inherited through `__proto__`. The conformance row is
[a collector that sends events or check-ins to an organization server](conformance.md#clients-and-readers).

<a id="usage-per-grant"></a>

## Usage per grant — `grant.usage`

An organization's administrator sees a shared agent's usage per grant as sums and states (CX-VES-08). The
organization server ingests only activity batches (DEC-0030) over the device transport (DEC-0056), and before DEC-0082
no activity event kind carried a grant reference: a usage report's `byGrant` and a grant check's receipt (DEC-0037,
DEC-0045) stay on the device, with its meter. So the activity protocol gains the kind **`grant.usage`**: one grant's
metered usage for one UTC day ([activity → kinds](activity.md#kinds), `telemetry-event.schema.json#/$defs/grantUsage`).

- **Its data**: `day`; `grantId`, the share grant's `meta.id`, `urn:fabric:share:` and 32 lower-case hex digits,
  compared as written (DEC-0086, `FAC-SEM-117`), so one grant revised during the day is one row and the organization
  server joins it to the agent its share registration names; `context`, the grant's own `org:<orgId>` (DEC-0086);
  `calls` (at least 1: a day with no call emits nothing); `unpricedCalls`, never more than `calls`; and `costUsd`, a number of at least 0, or `null` when no call was priced, never `0` for an unknown cost, as DEC-0021 and
  `FAC-SEM-025` say (`FAC-SEM-038` checks the three together).
- **A day and no finer time**, like `policy.violation`: `occurred` is that day's midnight UTC (`FAC-SEM-039`),
  `monotonicNs` is `"0"`, and it carries no `session`, `user`, `run`, `task`, `git`, `skill` or `launch` (schema).
- **Its source** is the meter's settled grant-check receipts (DEC-0037), each counted once and assigned to the UTC day
  of the receipt's own timestamp: the `checkedAt` of the `allowed` answer that issued it
  (`grant-check.schema.json#/$defs/allowed`). `calls` and `unpricedCalls` count calls, not receipts: `calls` is the calls
  the day's receipts settle, and `unpricedCalls` the calls of those receipts whose cost is unknown. A service's
  `byGrant` row (`service-usage.schema.json`) is used only when it lists `receipts`, the meter holds none of them, and the
  report's window lies within one UTC day (its `days` hold one date); it then adds its `calls` and `costUsd` to that day.
  Any other `byGrant` row is not used, and the collector reports what the meter holds. It holds only sums and states,
  never a per-call line: usage under a share grant is data about a person (CX-VES-08, the operator's OD-1).
- **Who derives the id**: the collector on the issuer's own device, from the receipts its meter settled, where the
  grant's id is known. A grant reference may end in `#<revision>` (`<id>#<revision>`, as the register's `share-grant/1`
  names a grant); the collector drops it by taking the receipt's grant `meta.id`, which carries no revision, so the
  schema refuses a `#`. A grant whose `meta.id` is no share grant id reports no `grant.usage` (DEC-0086). DL-22's opacity binds callees (a service names a grant only by the token's `grant` claim), and
  this is the issuer's side, so it is not broken.
- **Once**: a collector emits it after the day ends, one per (day, `grantId`) per stream; a batch that carries two for
  one (day, `grantId`) of one stream, the ids compared by normal form (a share grant id is its own normal form, so the
  two comparisons agree), is refused (`FAC-SEM-039`). A receiver counts the
  first `grant.usage` per (stream, day, `grantId`) it holds and ignores later ones
  ([conformance](conformance.md#clients-and-readers)).
- **Routing**: a `grant.usage` event goes only to the organization server of the grant's own `context`, `org:<orgId>`
  (`routeGrantUsage(grantContext, enrollments)` in `src/context-route.ts`, the vectors' `grantUsage`). A grant that
  states no context answers `none` with reason `no-context`, and a personal one `personal`: neither produces a
  `grant.usage` toward any organization. The event carries that context, and a collector sends it only after the
  enrollment answered the grant's share registration (the sender gate, [share registration](share-registration.md#the-join)).

A grant's id is not put on `usage.line`: a reference on each call would let the organization join every model call
to the grant, finer than CX-VES-08's sums, and a shared agent's spend is metered by grant check and often has no session
at all. A purpose mark (CX-CON-10) is not in this slice.

## Membership and its expiry

A person's membership in an organization, and its `external` and `expiresAt` attributes (CX-VES-03), are the
organization server's record, not the contract's. Only the device certificate (DEC-0031) follows the membership by
itself: the organization server stops renewing or revokes it. The share grant does not: it runs to its own `expiresAt`
or to its `grant` revocation in the estate record (`FAC-SEM-076`, carried fast by the revocation delta, DEC-0054). So
Fabric's share flow (CX-FAB-04) sets a share grant's `expiresAt` no later than the membership's expiry the organization
server shows. An instance whose share grant is revoked fails `FAC-SEM-111` from the next revision, and its usage stops
when no call is metered under it.

## Linkability

The operator decided K-1 on 2026-10-15 (NET-2, recorded by DEC-0084): each organization enrollment of a machine gets
keys of its own, so organizations cannot link the machine (CX-22). The contract's part — a `kid` and an `iss` per context,
with what `FAC-SEM-044`, `FAC-SEM-073` and the check-in carry for each (CX-CON-06) — is stage 2 and not yet decided. Until
it lands, this slice still does **not** meet CX-22, and a machine shows both organizations:

- the same device key and hub key;
- in every check-in, the same `records`: the estate record's `revision` and `digest`, the `heartbeat`, the
  `revocationDelta` head and the `leases` (DEC-0053, DEC-0054, DEC-0056, DEC-0062).

So the two organization servers can tell that one person's machine is enrolled in both: the pilot's single key stays
linkable until CX-CON-06. Project Observatory's plan for a device identity per organization is the direction NET-2
confirms. A membership in an organization another person controls does not run on this slice.

## Compatibility

1. **Closed schemas.** The grant and estate-record schemas are closed (`additionalProperties: false`). A reader pinned
   before DEC-0082 refuses a grant that carries `context`, and an estate record whose share grant carries `context`
   (`shareGrants[].context`), whose placement carries `context` or `grant`, or whose secret placement carries `context`.
   So sharing alone, a share grant with its context, triggers item 3's gate.
2. **Relaxed rules.** `FAC-SEM-074` and `FAC-SEM-075` are relaxed: a record that places one agent on one machine in two
   contexts fails an older node's `FAC-SEM-074`.
3. **The gate.** A writer publishes such documents only once every reader is pinned at or after DEC-0082: for the
   estate record, every machine of the person; for a grant, also the meter that reads the hub's projection of it, since
   `src/grant-projection.ts` validates a projected grant against its pinned `governance.schema.json#/$defs/grant`. So a hub
   writes `context` on a grant only once that meter is pinned at or after DEC-0082.
4. **New refusals.** `FAC-SEM-110` and `FAC-SEM-111` refuse only documents that carry the new members, and the new
   clauses of `FAC-SEM-038`, `FAC-SEM-039` and `FAC-SEM-075` concern only the new kind and the new member. A record or
   grant without them reads as before.
5. **`grant.usage` at an older receiver.** The event's `kind` is open, and a receiver that does not know a kind
   validates its `data` only as an unknown kind's (`activity-common.schema.json#/$defs/extData`), then MUST accept, store
   and count it without interpreting it ([activity → extension and unknown kinds](activity.md#kinds)). `day`, the counts
   and `costUsd` (a number or `null`) always pass. A receiver pinned before DEC-0082 therefore accepts a `grant.usage`
   whose `grantId` satisfies `activity-common.schema.json#/$defs/extScalar`'s string branch: at most 64 characters, no
   whitespace, no leading `/`, `~` or `\` or drive prefix (`C:\`, `C:/`), and no `/Users/`, `/home/` or `\Users\`
   anywhere. Any other it rejects as that event's `schema` rejection, which consumes the event and leaves the batch
   standing ([batch and acknowledgement](activity.md#batch-and-acknowledgement)), and the usage is lost to it; so a writer
   sends such an id only to a receiver pinned at or after DEC-0082. `FAC-SEM-037`'s home-path check applies to every
   event on every receiver, so a `grantId` that names a home directory is refused at any pin. DEC-0086 makes `context`
   required and `grantId` a share grant id, which a receiver pinned at DEC-0082 refuses. A receiver pinned before
   DEC-0082 refuses such an event too when its `context` is longer than 64 characters (`org:` and an `orgId` of more than
   60), by the same `extScalar` rule. Its compatibility and the sender gate are in
   [share registration](share-registration.md#compatibility).

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| `FAC-SEM-110` | `grant`, `estate-record` | a grant whose `principalKind` is `external` never has `context` `personal`; on an estate record, each of its `shareGrants[]` (DEC-0082) |

| Kind | Input |
|---|---|
| `grant` | a standing grant (`governance.schema.json#/$defs/grant`) |

Fixtures: `fixtures/semantic/grant-context-*`, `fixtures/semantic/estate-share-grant-personal.json`,
`fixtures/positive/governance-grant-share-context.json`, `fixtures/negative/governance-grant-context-*`.

## Who adopts it

- **Fabric** writes a share grant's `context` when it shares an agent into an organization (its CX-FAB-04), sets that
  grant's `expiresAt` no later than the membership's expiry the organization server shows, drafts placements by context
  with their grants and an organization's slots filled locally, runs `FAC-SEM-110` and `FAC-SEM-111` before the passkey
  signs a revision, and writes `context` on a grant only once the meter reading its projection is pinned at or after
  DEC-0082.
- **Project Observatory**:
  - enrolls the machine in each organization separately and sends each enrollment's check-ins to its own server
    (DEC-0031; its OE-05, the enrollment client);
  - routes a session's events as `routeTarget` answers (the vectors), and installs and fills an organization's instance
    only as kind `estate-placement` with its context finds it placed;
  - its meter reads the hub's projection of a grant that carries `context` (it repins before the hub writes one);
  - shipping `grant.usage` from the meter's settled receipts, routed as `routeGrantUsage` answers, needs a new
    Observatory row, requested through the pilot's §4 table or the board (`com.submit`).
- **The first organization server** issues `org.id` within `[A-Za-z0-9][A-Za-z0-9_-]{0,127}`, reads a share grant's `context`, and
  ingests `grant.usage` to show a shared agent's usage per grant as sums and states, counting the first per (stream,
  day, `grantId`), every read in the access log (CX-VES-08); per agent, through share registrations (DEC-0086,
  [who adopts it](share-registration.md#who-adopts-it)).
- **fabric-agent-adapter** (its FAA-41): the kits run `FAC-SEM-110` and `FAC-SEM-111` and accept per-context
  placements at their next pin.
- **Fabric Dashboards** (its FD-52) groups instances by the placement's context; a service descriptor carries none.
- **Fabric Switchboard** uses the context-id form for its pool's context attribute.

The board rows are CT-51 and, for share registrations, CT-56.

## Not decided here

- The rest of N20 (CT-38): CX-CON-04 (`person` and `organization` in place of `external`), CX-CON-03, CX-CON-05 and
  CX-CON-07…10; CX-CON-06 (a `kid` and an `iss` per context), unblocked by the operator's NET-2 (DEC-0084) and stage 2
  of RM-21.
- A context on a project, a session or an event (the rest of CX-CON-01). Who fixes a session to a context is the host's
  (Fabric's CX-FAB-08).
- Whether a share grant's `audience` names the placed agent: `audience` is an agent id and a placement names an
  `agentRef`, and the contract does not map one to the other.
- A context on a secret envelope: until one is decided, an organization's slot is filled on its own machine only.
- Fabric confirms the context form and the placement key in its organization decision (D8). If D8 decides otherwise, a
  later decision changes them with a compatibility note.
