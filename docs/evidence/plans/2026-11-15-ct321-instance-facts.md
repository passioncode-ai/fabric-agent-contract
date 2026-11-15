# Design: where an agent runs and whose it is, three optional instance facts (CT-321)

**Status:** design, 2026-11-15; to be proposed as a DEC (the DEC is normative where the two differ). Row
[CT-321](../../backlog.md); the request: Fabric Dashboards' board message `5da92f65` (thread `589abe7e`, FD-273, answer
due 2026-11-22), relaying the operator's ask `d660cc30`; the contract's acceptance in principle `1fa97798`.

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
prefers well-known. Prowl Agent declares first.

## What the contract says today

- The descriptor ([service](../../specification/service.md#descriptor), `schemas/service-descriptor.schema.json`) and
  the well-known document (`schemas/service-well-known.schema.json`) are **closed** (`additionalProperties: false`). A
  new top-level member is refused by every host pinned before it, as `protocols` was ([versioning](../../specification/versioning.md#protocol-revisions):
  "the four carrying objects are closed, so an older pinned copy refuses the new member").
- Both carry `extensions`, keyed by URI; a host preserves and ignores an extension it does not know
  ([service](../../specification/service.md#descriptor)). The dashboard, connections, actions, authority, load,
  ops-digest and channel-agent declarations all ride there, each with its own schema
  (`schemas/service-*-extension.schema.json`).
- The dashboard's entry is already half declared: `surfaces.dashboard.login` is `true` when the dashboard requires an
  operator session begun with a host's login code ([operator login](../../specification/service.md#operator-login)).
  It says nothing of a dashboard with a sign-in of its own, nor of one with none.
- A local service's well-known document is served **unauthenticated** on `127.0.0.1`
  ([remote placement](../../specification/service.md#remote-placement) table), and on a computer with more than one
  counted OS account every account reaches every port (DEC-0154, [several OS accounts](../../specification/service.md#several-os-accounts-on-one-computer)).
  A remote service's requires the token. The descriptor lives in the account's own services directory.
- An organization is named in the contract only by its context id `org:<orgId>` (`common.schema.json#/$defs/orgContextId`,
  DEC-0082, DEC-0086); its name is Observatory's to show.

## The design

**IF-1, an extension, not three top-level members.** The three facts ride as one extension value under
the contract's extension key ending `extensions/instance-facts/0.1` (added to `EXTENSION_KEYS` with the DEC), in the descriptor's `extensions`, the
well-known document's `extensions`, or both, with its own schema `service-instance-facts-extension.schema.json`. A host
pinned before the DEC ignores it, so no descriptor or well-known document becomes invalid anywhere; the protocol name
`fabric-instance-facts/0.1` joins `NAMED_ONLY`. Every member is optional; an absent member, and an absent extension,
mean "not declared", never a default.

**IF-2, `access`.** `{audience?, entry?}`:

| Member | Values | Meaning |
|---|---|---|
| `audience` | `operator`, `organization`, `public` | who the instance serves: its operator alone, the members of the organization `tenancy` names (or of each organization a `shared` instance serves), or anyone who reaches its origin |
| `entry` | `host-signin`, `own-signin`, `none` | how its dashboard is entered: through a host's login code ([operator login](../../specification/service.md#operator-login)), through a sign-in of its own, or with none |

`entry` restates nothing a host can read elsewhere except one case: where the well-known document declares
`surfaces.dashboard`, `entry` is `host-signin` exactly when `login` is `true` (a rule, IF-6), so one fact has one
answer. Without `surfaces.dashboard` (a descriptor read before the service runs, a service with no dashboard), `entry`
is the only place it is said.

**IF-3, `tenancy`.** `{mode, organization?}`:

| `mode` | `organization` | Meaning |
|---|---|---|
| `single` | absent | the operator's own instance, one tenant, no organization's data |
| `per-organization` | required, `org:<orgId>` | one of a product's copies run one per organization; this copy holds that organization's data only |
| `shared` | absent | one instance holding several organizations' data, kept apart by the instance |

The organization is its context id, never its name (DEC-0082); a host shows the name Observatory's map gives it.

**IF-4, `space`.** `{kind, account?}`: `kind` `user` (a counted OS account, DEC-0154), `system` (a system service's
account), `container` or `vm`; `account` an opaque label of 1 to 64 characters of `[A-Za-z0-9._-]`, starting with a
letter or digit, that the installer or the operator assigns in the services directory, never the OS account's name, a
person's name or a path. A writer with no such label leaves `account` out.

**IF-5, where each fact is written, and privacy.** The descriptor carries what the installer knows; the well-known
document what the running instance knows; a host reads both and prefers the well-known document member by member.
`tenancy.organization` is written to a **local** service's well-known document never: that document is unauthenticated
and every counted OS account on the computer reaches it (DEC-0154), so the organization id stays in the descriptor, in
the account's own services directory, and in a remote service's token-guarded well-known document. `space.account` is
likewise the descriptor's only on a local placement.

**IF-6, `FAC-SEM`, one rule.** On the extension value (kind `instance-facts`, and inside `service-descriptor` and
`service-well-known` where they carry it): `per-organization` names an `organization`, `single` and `shared` name none;
in a well-known document that declares `surfaces.dashboard`, `entry` is `host-signin` exactly when `login` is `true`;
a local service's well-known document carries no `tenancy.organization` and no `space.account`.

**IF-7, vectors.** A descriptor and a well-known document with and without the extension; each `mode` with and without
`organization`; `entry` against `login`; a local well-known document carrying an organization; a label with `/`, `@`
or a space (schema). The host's reading (well-known first, member by member) as a small reference function
`instanceFacts(descriptor, wellKnown)` with its own vectors.

## Alternatives refused

- **Three top-level members** in the descriptor and the well-known document, as the request words it: refused, both
  objects are closed, so every host pinned before the DEC would refuse every service that declares them; the extension
  carries the same members with no break.
- **`tenancy.organization` as a name:** refused, the contract keeps identifiers only (DEC-0082); the name is Observatory's.
- **Dropping `entry`** because `surfaces.dashboard.login` exists: refused, `login: false` does not tell a dashboard with
  its own sign-in from one with none, and a descriptor has no `surfaces`.
- **A derived `space.account`** (an HMAC of the account, as the host label is, DEC-0154 HA-4): not needed for a label a
  host only shows; a later revision can add it if two hosts must compare accounts.

## Compatibility

Additive: an extension a host ignores until it reads it. Fabric Dashboards reads it first (FD-273); Prowl Agent declares
first, as the operator said. Fabric, Observatory and the adapter's descriptor writer owe nothing until they choose to
show or write the facts; the adapter kits' `PROTOCOL_REVISIONS` gain `fabric-instance-facts/0.1` at their next repin.

## Next

The DEC (after DEC-0172 lands): the extension's schema, `FAC-SEM-180` or the next free code, `instanceFacts`, the
vectors, the service specification's section, a conformance row (a service that declares the facts, a host that shows
them), and the answer on thread `589abe7e` with its number.
