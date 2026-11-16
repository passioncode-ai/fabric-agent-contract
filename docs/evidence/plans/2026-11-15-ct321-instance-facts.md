# Design: where an agent runs and whose it is, three optional instance facts (CT-321)

**Status:** design, 2026-11-15, rounds 5 and 6 of the blind readings (seam and product) clean at `f75e1a14`; to be
proposed as a DEC (the DEC is normative where the two differ). Row
[CT-321](../../backlog.md); the request: Fabric Dashboards' board message `5da92f65` (thread `589abe7e`, FD-273, answer
due 2026-11-22), relaying the operator's ask `d660cc30`; the contract's acceptance in principle `1fa97798`.
Decided by DEC-0173, which reads the facts field by field (a refused value costs only its field, the other document's
value read where it stands) where this design said member by member, and checks the three service kinds rather than a
kind of its own, lets a remote service reached only by an organization's members declare `organization` without `peer`,
and lets a service with `peer` before any grant declare `organization` or leave `audience` out; the DEC is normative.

## What is asked

The operator asked that pointing at an agent, and its details above its page, show where it runs, its organization,
whose instance it is, who has access and how its data is kept apart. Fabric Dashboards 0.8.120 shows what a host can
read today (placement and origin, the placement record's machine, the organization from Observatory's map, the
dashboard's sign-in, repository, version, `installedBy`, `installedAt`, copies of one product). Three facts have no
field, so a host guesses them or leaves them out. The request proposes three optional members, absent meaning "not
declared":

1. `access`: `{audience: operator | organization | public, entry: host-signin | own-signin | none}`;
2. `tenancy`: `{mode: single | per-organization | shared, organization?}`;
3. `space`: `{kind: user | system | container | vm, account?}`, `account` an opaque label, never a person's name.

Where: the descriptor (install-time facts), or the well-known document when the running instance knows better; a host
prefers well-known. Prowl Agent declares first. Of the request's facts, whose instance it is already has a field, the placement's `context` (below),
so this design keeps `tenancy` to how data is kept apart. A remote instance has no estate-record placement (placements
live under a machine's packages), so its organization comes from `org-instance/1` where a host holds one, else from
Observatory's map; that stays so until such an instance is stated. "Placement" below is the estate record's placement
or the descriptor's `local` or `remote`, never `org-instance/1`'s own `placement` member.

## What the contract says today

- The descriptor ([service](../../specification/service.md#descriptor), `schemas/service-descriptor.schema.json`) and
  the well-known document (`schemas/service-well-known.schema.json`) are **closed** (`additionalProperties: false`). A
  new top-level member is refused by every host pinned before it, by the schema's own closedness (the same reason
  [versioning](../../specification/versioning.md#protocol-revisions) gives for `protocols` on the four objects that
  carry it, the well-known document among them).
- Both carry `extensions`, keyed by URI; a host preserves and ignores an extension it does not know
  ([service](../../specification/service.md#descriptor)). The dashboard, connections, actions, authority, load,
  ops-digest and channel-agent declarations ride there or in the manifest's `provider.extensions`, each with its own
  schema (`schemas/service-*-extension.schema.json`); the known keys are `EXTENSION_KEYS` (`src/extensions.ts`), and a
  near miss of a contract key, or an unknown key under the contract's own extension path, is a `hint/extension-key` of
  `pnpm validate`, and no unknown key is refused.
- The dashboard's entry is already half declared: `surfaces.dashboard.login` is `true` when the dashboard requires an
  operator session begun with a host's login code ([operator login](../../specification/service.md#operator-login)).
  It says nothing of a dashboard with a sign-in of its own, nor of one with none.
- A local service's well-known document is served **unauthenticated** on `127.0.0.1`
  ([remote placement](../../specification/service.md#remote-placement) table), and on a computer with more than one
  counted OS account every account reaches every port (DEC-0154, [several OS accounts](../../specification/service.md#several-os-accounts-on-one-computer)).
  A remote service's requires the token. The descriptor lives in the account's own services directory.
- An organization is named in the contract only by its context id `org:<orgId>` (`common.schema.json#/$defs/orgContextId`,
  DEC-0082, DEC-0086); its name is Observatory's to show.
- **Whose instance is already stated by the placement.** An estate record's placement carries an optional `context`
  (absent: `personal`) and a share grant's id (DEC-0082 item 4, one instance per context on a machine), and Fabric
  Dashboards groups instances by it; a service descriptor carries none
  ([contexts](../../specification/contexts.md), Fabric Dashboards' FD-52). DEC-0170's `org-instance/1` is the
  organization's signed statement that one instance runs for it ([membership](../../specification/membership.md#instances-dec-0170)).
- **Who reaches it is already bounded by `peer`.** A host routes a request from anyone but the operator only to a
  service whose descriptor declares `peer` (DEC-0061, [offered to others](../../specification/service.md#offered-to-others));
  `peer` grants nothing by itself, a share grant or an organization's listing does, and its `custody` and `residency`
  are shown beside the service.
- **An organization id already reaches a local well-known document** through DEC-0162's authority extension
  (`levels[].org`), readable by every counted account on the computer; that is filed as CT-324, outside this design.
- **Every local service runs under a counted OS account.** DEC-0154 counts any account that runs Fabric or an agent
  service, whatever its shell, uid or name, and a listener of an uncounted account is `foreign-user`
  ([several OS accounts](../../specification/service.md#several-os-accounts-on-one-computer)).

## The design

**IF-1, an extension, not three top-level members.** (Inside a present object, `mode` and `kind` are required; the
objects themselves are optional.) The three facts ride as one extension value under
the contract's extension key ending `extensions/instance-facts/0.1` (added to `EXTENSION_KEYS` in `src/extensions.ts` and to [interop](../../specification/interop.md#extension-key) with
the DEC), in the descriptor's `extensions`, the
well-known document's `extensions`, or both, with its own schema `service-instance-facts-extension.schema.json`. A host
pinned before the DEC ignores it, so no descriptor or well-known document becomes invalid anywhere; the protocol name
`fabric-instance-facts/0.1` joins `NAMED_ONLY` and the register `PROTOCOL_REVISIONS`. Every member is optional; an absent member, and an absent extension,
mean "not declared", never a default.

**IF-2, `access`.** `{audience?, entry?}`:

| Member | Values | Meaning |
|---|---|---|
| `audience` | `operator`, `organization`, `public` | who the instance serves: its operator alone; others it is offered to, the members of the organization its placement's `context` names and anyone a share grant or an organization's listing offers it to (DEC-0082 item 4, DEC-0086), among them a colleague or a guest a share grant reaches (DEC-0039's standing grant to an external principal, [offered to others](../../specification/service.md#offered-to-others)); a peer share (DEC-0142) passes a credential's value and gives no audience to an instance; or, on a remote placement, anyone who reaches its origin's own surface |
| `entry` | `host-signin`, `own-signin`, `none` | how its dashboard is entered: through a host's login code ([operator login](../../specification/service.md#operator-login)), through a sign-in of its own, or with none |

`audience` never widens what `peer` allows through a hub: a host routes others only to a service that declares `peer`,
so `organization` needs `peer` (IF-6), and `operator` beside `peer` is a contradiction the rule refuses. `public` is a
remote placement's only and needs no `peer`: it describes an `https` origin whose own surface anyone reaches with
credentials of their own (a remote agent other agents call with their own keys, as Prowl Agent is), outside any hub's
routing; a local placement is never `public`. A remote service only its organization's members reach with their own
keys has no exact value without `peer`; it writes `public` for its origin's reach, or leaves `audience` out. `audience` describes; access still
comes only from a share grant or an organization's listing, and `public` grants nothing through a hub. An empty
`access` object, like an absent one, declares nothing. A service that declares `peer` before any grant or share
reaches it leaves `audience` out rather than writing `operator`. The word is the instance's own: it is not the authority
extension's `levels[].audience` (a membership reader id) nor a grant's audience.

`entry` restates nothing a host can read elsewhere except one case: where the well-known document declares
`surfaces.dashboard`, its `login` decides `host-signin` (true) against the other two (false), whichever document's
`entry` a host would otherwise read; a declared `entry` that disagrees with that `login`, in either document, is refused
(IF-6), so one fact has one answer. Without `surfaces.dashboard` (a descriptor read before the service runs, a service with no dashboard), `entry`
is the only place it is said.

**IF-3, `tenancy`.** `{mode}`, how the instance keeps data apart; whose instance it is stays the placement's
`context` (DEC-0082 item 4), never a second field here:

| `mode` | Meaning |
|---|---|
| `single` | one tenant: the context its placement names (`personal`, or one organization's), and no other's data |
| `per-organization` | one of a product's copies the product itself runs one per organization (an organization's hosted copy), this copy holding the data of the organization its placement's `context` names; an agent the operator shares into organizations as separate instances is `single` in each (below) |
| `shared` | one instance holding several tenants' data, kept apart by the instance: many users each signed in on its own sign-in, or several organizations whose listings name it (a remote service; a local placement names one context and at most one grant, DEC-0082 item 4, so an agent shared into several organizations runs one `single` instance in each) |

A host shows the organization from the placement, and prefers DEC-0170's signed `org-instance/1` statement where it holds
one; the extension is declared, never verified. An agent shared into an organization runs as a separate instance whose placement's
`context` is that `org:<orgId>` and which names its share grant (DEC-0082 item 4, DEC-0086 item 3); a personal instance
names no grant (`FAC-SEM-111`). That organization instance is `single`: it holds the organization's data only, as the
row says for the context its placement names.

**IF-4, `space`.** `{kind, account?}`: on a local placement `kind` is `user` (the counted OS account whose services
directory declares it, DEC-0154), `container` or `vm` (a guest on the computer, its traffic relayed through a forwarder its own account owns, since a
listener HA-2 reads as `foreign-user`, a rootful proxy's, is never read, and then only the descriptor's copy shows); `system` (a
platform's service account) is a remote placement's only (IF-6). `account` is an opaque label of 1 to 64 characters of
`[A-Za-z0-9._-]`, starting with a letter or digit, that the installer or the operator assigns in the services
directory, never the OS account's name, a person's name or a path; the pattern cannot tell a given name from a label, so
the rule is the writer's, as for a host label's input. A writer with no such label leaves `account` out.

**IF-5, where each fact is written, and privacy.** The descriptor carries what the installer knows; the well-known
document what the running instance knows; a host reads both and prefers the well-known document member by member.
The extension names no organization (IF-3), so nothing identifying an organization reaches a local service's
unauthenticated well-known document through it; `space.account` is the descriptor's only on a local placement, since
that document is reached by every counted OS account on the computer and by a relayed guest (DEC-0154). `audience` and
`tenancy.mode` in a local well-known document tell those accounts that an organization's instance runs here and
nothing more; a service that must not say so declares them in its descriptor only. A host prefers the well-known
document member by member, a member being `access`, `tenancy` or `space` as a whole.

**IF-6, `FAC-SEM`, one rule.** On the extension value (kind `instance-facts`), and on the descriptor and the well-known
document as a pair (as `FAC-SEM-009` reads them): `audience` `organization` only beside `peer`, `operator`
never beside it, `public` only on a remote placement and never beside a `subscription` runner (DEC-0061 item 3, which
the schema enforces only beside `peer`); where the well-known document declares `surfaces.dashboard`, an
`entry` in either document is `host-signin` exactly when `login` is `true`; `space.kind` `system` never on a local
placement; a local service's well-known document carries no `space.account`. A well-known document read alone is
checked for what it carries; the clauses on `peer`, on a placement and on `space.account` need the pair, since the
well-known schema has neither `peer` nor `placement`, so a document read alone is never refused under them. A refusal under this rule declares the member it refuses not declared (the other members stand), and
`entry` is still read from `login` where a dashboard is declared, which needs no extension; it never changes the service's
state, unlike `FAC-SEM-009`'s `foreign`.

**IF-7, vectors.** A descriptor and a well-known document with and without the extension; `audience` against `peer`
and placement; each `mode`; `entry` against `login`; `system` on a local placement; a local well-known document
carrying `space.account`; an `org:` placement that names its share grant, with `audience: organization` beside
`peer` and `mode: single` (accepted); a label with `/`, `@` or a space (schema). The host's reading (well-known first, member by member, `entry` from `login` where a dashboard is
declared) as a small reference function `instanceFacts(descriptor, wellKnown)` with its own vectors, among them a
descriptor's `own-signin` beside a well-known `login: true` with no extension there (refused, and read `host-signin`).
A host reads only its own account's answer: HA-2 discards a `foreign-user` listener's, so a well-known-first reading
never takes another account's facts.

## Alternatives refused

- **Three top-level members** in the descriptor and the well-known document, as the request words it: refused, both
  objects are closed, so every host pinned before the DEC would refuse every service that declares them; the extension
  carries the same members with no break.
- **`tenancy.organization`** (the request's, as a name or as `org:<orgId>`): refused, the placement's `context` already
  says whose instance it is (DEC-0082 item 4) and a second field could disagree with it; a name is Observatory's
  (DEC-0082).
- **Dropping `entry`** because `surfaces.dashboard.login` exists: refused, `login: false` does not tell a dashboard with
  its own sign-in from one with none, and a descriptor has no `surfaces`.
- **A derived `space.account`** (an HMAC over the account, as the host label is one over the computer's secret and
  `org.id`, DEC-0154 HA-4): not needed for a label a
  host only shows; a later revision can add it if two hosts must compare accounts.

## Compatibility

Additive: an extension a host ignores until it reads it. Fabric Dashboards reads it first (FD-273); Prowl Agent declares
first, as the operator said. Fabric, Observatory and the adapter's descriptor writer owe nothing until they choose to
show or write the facts; the adapter kits' `PROTOCOL_REVISIONS` gain `fabric-instance-facts/0.1` at their next repin.

## Next

The DEC: the extension's schema, a Fabric Dashboards scenario for the details panel (super-ux) shipped with it,
CONTEXT.md entries that keep `access.audience` apart from `levels[].audience` and `tenancy` apart from
`accounts.tenants`, `FAC-SEM-180` or the next free code, `instanceFacts`, the
vectors, the service specification's section, a conformance row (a service that declares the facts, a host that shows
them), and the answer on thread `589abe7e` with its number.

## Risks the DEC decides (rounds 5 and 6)

- `single` and `per-organization` for a remote copy, which has no placement `context`: the organization from
  `org-instance/1` or Observatory's map; a local service no estate record places (read as `personal` today).
- A remote service only one organization's members reach: `organization` without `peer` on a remote placement, or
  `audience` left out, never `public`.
- The unit a refusal or the well-known-first reading drops: a member (`access`) or a field (`entry`); a descriptor's
  `entry` kept when the well-known `access` carries only `audience`; why this differs from ED-9's whole-extension rule.
- Whose `entry` is shown when the operator enters by the host's code and others by the service's own sign-in.
- The clauses that need the pair: also the `subscription` runner and a descriptor's `entry`.
- `space.account`'s source in the services directory, and the shared detector applied to it (as `FAC-SEM-086` does).
- `single` for a personal instance with `peer` that a colleague's grant reaches; `shared` refused on a local placement.
- A vector where `org-instance/1` and the estate placement's `context` disagree; drop the IF-7 vector no rule reads.
- The label a host shows for `audience: organization` when it reaches a colleague or guest outside any organization
  (the details panel's scenario and CONTEXT.md); an organization named "by an id, never a name" (a device enrollment
  carries a bare `org.id`); `public` is no offer in `service.md`'s "offered to others" sense.
