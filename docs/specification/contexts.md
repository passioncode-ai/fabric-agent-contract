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
organization it is shared into, and where a collector sends an event or a check-in. It is the pilot slice of N20 (board row CT-38): CX-CON-01 for grants and placements only, and
CX-CON-02 whole. The rest of N20 waits on Fabric's organization decision (D8).

The context id has a page of its own because four readers compare it — the grant ([governance](governance-and-roles.md)),
the [estate record](estate-record.md)'s placements, the collector's routing ([activity](activity.md),
[devices](devices.md)) and consumers such as Fabric Switchboard's session pool — and one home keeps them comparing it
alike.

## The context id

`common.schema.json#/$defs/contextId` is one of:

- `personal` — the person's own work;
- `org:<orgId>` — an organization, where `orgId` is the organization server's opaque id of it: 1–128 characters of
  `[A-Za-z0-9_-]`. The first organization server issues ids of the form `org_<base32>`.

Context ids compare **as written**: never case-folded, never trimmed, never by prefix, as DEC-0077 compares board ids.
`Personal`, `ORG:x`, `org:` with an empty or a 129-character id, a surrounding space and a trailing newline are not
context ids (the schema, `parseContext`, and the vectors' `contexts`, which `test/context-route.test.ts` runs through
both). `org:personal` is an organization whose id is the word `personal`, not the personal context. A context id is not
an identifier under DEC-0076: its pattern admits no upper-case prefix and no `%`, so every valid value is already its
normal form and the two comparisons agree ([identifiers](identifiers.md#where-identifiers-are-compared)).

A device's enrollment names its organization by `org.id`, an opaque id (`activity-common.schema.json#/$defs/opaqueId`,
DEC-0031), whose set differs from `orgId`'s: an organization whose id holds `.`, `:` or `~`, or starts with `_` or `-`,
cannot be both enrolled and a context, so nothing is routed to it. The first organization server's ids are in both sets.

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
- `FAC-SEM-075`: a slot is placed once per (`agentRef`, slot, context), for an instance placed in that context;
- `FAC-SEM-111`: an instance in `org:<orgId>` names its share grant — one of the record's, matched by normal form
  (DEC-0076), whose `context` is the placement's as written, and which the record does not revoke; a personal instance
  names none.

`placementTrust(record, machine, agentRef, context)` and kind `estate-placement` (`{record, machine, package, context?}`)
take the context, `personal` when it is not given, so a caller written before DEC-0082 is unchanged.

## Routing

**No document on the telemetry or check-in wire carries a context.** An organization server already knows the
organization from the device certificate: the certificate binds `org.id`, and a receiver attributes by it, never by the
body (DEC-0031, `FAC-SEM-045`). A context field would add nothing it does not know, and it could leak `personal` or
another organization's id to a receiver, which unlinkable memberships forbid (the RM-28 report's CX-22).

Instead the collector routes. `routeTarget(sessionContext, enrollments)` in `src/context-route.ts` answers where a
collector may send an event or a check-in of a session in a given context; `enrollments` lists the `org.id` of each of
the device's enrollments (DEC-0031). The session's context is the collector's own record of the session, never a field
of the event.

| Session context | Answer |
|---|---|
| `org:<orgId>`, with exactly one enrollment whose `org` is `orgId` as written | `{route: "enrollment", org, index}`: that enrollment's organization server |
| `org:<orgId>`, with no such enrollment | `{route: "none", reason: "not-enrolled"}` |
| `org:<orgId>`, with two such enrollments | `{route: "none", reason: "ambiguous"}`: a re-enrollment replaces the earlier one, so a device holds one per organization; it sends to neither |
| `personal` | `{route: "none", reason: "personal"}`, always: personal work never goes to an organization server |
| anything that is not a context id (`Personal`, `org:`, a non-string) | `{route: "none", reason: "not-a-context"}`: the collector sends nothing |

The reasons are `personal`, `not-a-context`, `not-enrolled`, `ambiguous`, and for a grant's usage `no-context`
(below). The function is total: malformed input answers `none` and never throws, an enrollment that is not an object with an own
string `org` is skipped, and nothing is read from an object's prototype. The shared vectors
`fixtures/vectors/context-route.json` hold every answer and the cases a lax port gets wrong: a case-folded id, a prefix
of an enrolled id, an enrolled id that is a prefix, `org:` with an empty or a 129-character id, `Personal`, a trailing
newline, a bare organization id, non-string input, and an `org` only inherited through `__proto__`. The conformance row
is [a collector that sends events or check-ins to an organization server](conformance.md#clients-and-readers).

<a id="usage-per-grant"></a>

## Usage per grant — `grant.usage`

An organization's administrator sees a shared agent's usage per grant as sums and states (CX-VES-08). The
organization server ingests only activity batches (DEC-0030) over the device transport (DEC-0056), and before DEC-0082
no activity event kind carried a grant reference: a usage report's `byGrant` and a grant check's receipt (DEC-0037,
DEC-0045) stay on the device, with its meter. So the activity protocol gains the kind **`grant.usage`**: one grant's
metered usage for one UTC day ([activity → kinds](activity.md#kinds), `telemetry-event.schema.json#/$defs/grantUsage`).

- **Its data**: `day`; `grantRef`, the opaque grant reference of DEC-0045 (1–256 characters, as in a grant check's
  request); `calls` (at least 1: a day with no call emits nothing); `unpricedCalls`, never more than `calls`; and
  `costUsd`, a number of at least 0, or `null` when no call was priced — never `0` for an unknown cost, as DEC-0021 and
  `FAC-SEM-025` say (`FAC-SEM-038` checks the three together).
- **A day and no finer time**, like `policy.violation`: `occurred` is that day's midnight UTC (`FAC-SEM-039`),
  `monotonicNs` is `"0"`, and it carries no `session`, `user`, `run`, `task`, `git`, `skill` or `launch` (schema).
- **Its source** is what the device's meter settled under that grant (grant-check receipts, DEC-0037) and services'
  `byGrant` rows. It holds only sums and states, never a per-call line: usage under a share grant is data about a person
  (CX-VES-08, the operator's OD-1).
- **Once**: a collector emits it after the day ends, one per (day, `grantRef`) per stream; a batch that carries two for
  one (day, `grantRef`) of one stream is refused (`FAC-SEM-039`).
- **Routing**: a `grant.usage` event goes only to the organization server of the grant's own `context`, `org:<orgId>`
  (`routeGrantUsage(grantContext, enrollments)` in `src/context-route.ts`, the vectors' `grantUsage`). A grant that
  states no context answers `none` with reason `no-context`, and a personal one `personal`: neither produces a
  `grant.usage` toward any organization.

A grant reference is not put on `usage.line`: a reference on each call would let the organization join every model call
to the grant, finer than CX-VES-08's sums, and a shared agent's spend is metered by grant check and often has no session
at all. A purpose mark (CX-CON-10) is not in this slice.

## Membership and its expiry

A person's membership in an organization, and its `external` and `expiresAt` attributes (CX-VES-03), are the
organization server's record, not the contract's. Its expiry acts through revocations that exist: the device
certificate (DEC-0031), and the share grant's own `expiresAt` and its `grant` revocation in the estate record
(`FAC-SEM-076`, carried fast by the revocation delta, DEC-0054). An instance whose share grant is revoked fails
`FAC-SEM-111`, and its usage stops when no call is metered under it.

## Linkability

Until CX-CON-06 lands (a `kid` and an `iss` per context; it waits on Fabric's D3), the pilot is **linkable**. One
machine shows both organizations the same device key and hub key, and its check-in reports the same estate-record
revision and digest to each (DEC-0053, DEC-0056), so the two organization servers can tell that one person's machine is
enrolled in both. That is acceptable only while both organizations belong to one person, as in the pilot. A membership
in an organization another person controls does not run on this slice.

## Compatibility

The schemas are closed (`additionalProperties: false`). A reader pinned before DEC-0082 refuses a grant that carries
`context`, and an estate record whose placement carries `context` or `grant` or whose secret placement carries
`context`. A `grant.usage` event is a kind such a receiver does not know: it validates the event's `data` as an unknown
kind's (`activity-common.schema.json#/$defs/extData`: at most two levels, scalars, strings of at most 64 characters with
no whitespace), and when that holds it MUST accept, store and count the event without interpreting it ([activity →
extension and unknown kinds](activity.md#kinds)). `day`, the counts and `costUsd` (a number or `null`) are such scalars,
so an older receiver accepts a `grant.usage` whose `grantRef` is at most 64 characters with no whitespace. A longer one
it rejects as that event's `schema` rejection, which consumes the event and leaves the batch standing
([batch and acknowledgement](activity.md#batch-and-acknowledgement)), and the usage is lost to it; so a writer sends a
longer reference only to a receiver pinned at or after DEC-0082. `FAC-SEM-074` and `FAC-SEM-075` are relaxed: a record that places one agent on one machine in two contexts
fails an older node's `FAC-SEM-074`. So a writer publishes such documents only once every reader is pinned at or after
DEC-0082; for the estate record, that is every machine of the person. `FAC-SEM-110` and `FAC-SEM-111` refuse only
documents that carry the new members. A record or grant without them reads as before.

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

- **Fabric** writes a share grant's `context` when it shares an agent into an organization (its CX-FAB-04), drafts
  placements by context with their grants, and runs `FAC-SEM-110` and `FAC-SEM-111` before the passkey signs a revision.
- **Project Observatory** enrolls the machine in each organization separately (DEC-0031), routes each event and
  check-in as `routeTarget` answers (the vectors), ships `grant.usage` from what its meter settled, routed as
  `routeGrantUsage` answers (its OE-05), and installs and fills an organization's instance only as kind
  `estate-placement` with its context finds it placed.
- **The organization server** reads a share grant's `context`, and ingests `grant.usage` to show a shared agent's usage
  per grant as sums and states, every read in the access log (CX-VES-08).
- **Fabric Switchboard** uses the context-id form for its pool's context attribute.

The board row is CT-51.

## Not decided here

- The rest of N20 (CT-38): CX-CON-04 (`person` and `organization` in place of `external`), CX-CON-03, CX-CON-05 and
  CX-CON-07…10; CX-CON-06 (a `kid` and an `iss` per context) waits on Fabric's D3.
- A context on a project, a session or an event (the rest of CX-CON-01). Who fixes a session to a context is the host's
  (Fabric's CX-FAB-08).
- Whether a share grant's `audience` names the placed agent: `audience` is an agent id and a placement names an
  `agentRef`, and the contract does not map one to the other.
- Fabric confirms the context form and the placement key in its organization decision (D8). If D8 decides otherwise, a
  later decision changes them with a compatibility note.
