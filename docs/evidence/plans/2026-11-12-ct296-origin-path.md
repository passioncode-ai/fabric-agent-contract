# Design 2026-11-12: an online service under a path on a shared door (CT-296)

**Status:** the design CT-296 owes by 2026-11-19, drafted for Fabric Dashboards (FD-213) to confirm; the decision
follows with the organization slice's next cut. Rules are proposals numbered `OP-*`.

**Asked by:** Fabric Dashboards' board request `34ee5797` (thread `ba099d8d`, 2026-11-12). An organization's agent
instance is reachable only under a path on a shared door (`https://<door>:8443/<prefix>`), because the door's tunnel
gives one name a node and only ports 443, 8443 and 10000. The host cannot register it: a remote descriptor's `origin`
is a bare origin (service *Remote placement*, `FAC-SEM-024`), the door's root answers `404` at
`/.well-known/fabric-service`, and the prefixed paths answer `401` to a person's client key.

## What the contract says today

| Where | What it says | Why it blocks a prefix |
| --- | --- | --- |
| [service](../../specification/service.md) *Remote placement*, the descriptor | `origin` is `https://` and a DNS name with an optional port, no path | a service under a path has no origin of its own |
| the same, the service | the well-known document at `/.well-known/fabric-service`; the session cookie named `__Host-`, `Path=/`, no `Domain` | `__Host-` requires `Path=/`, so two services on one origin cannot each keep their own cookie; the well-known path is at the origin's root |
| the same | the host reads the well-known document with the service token | a person who holds only a client key (DEC-0159 CF-3) holds no service token |
| [service](../../specification/service.md) the card's `endpoint` | `https://<dns-name>[:<port>][/<path>]` | a path is already admitted where others reach the service, not where its host reads it |

## The trust question first

Two services under one origin are one browser trust domain: a page of either can read and write the other's cookies
whatever their `Path`, and run script against the other's pages. A path is no security boundary. `__Host-` cookies,
the `Host` and `Origin` checks and the per-origin token all assume one service per origin. So a prefix is safe only when
every service under that origin is of one owner who trusts all of them alike.

## The design

**OP-1, a base path.** A remote descriptor MAY carry `basePath`: `/` and 1 to 4 segments of `[a-z0-9][a-z0-9-]{0,62}`,
no trailing slash. `origin` stays a bare origin. Every route of the service is under it: the well-known document at
`<origin><basePath>/.well-known/fabric-service`, the dashboard, the events feed, the login code and redirect, MCP and
the A2A card. A link a host builds is `origin` plus `basePath` plus the path (PL-4's `fabric-dashboards://` link is
unchanged: it names the service and the path, and the host joins them).

**OP-2, one owner per origin.** Two descriptors whose origins are equal and whose base paths overlap (one equal to or a
prefix of the other, a missing `basePath` counting as `/`) are one service or none: a host registers neither and says
why. Services under one origin with disjoint base paths are allowed only when their descriptors name one owner (the same
organization's context, or the same operator), stated in each descriptor's `owner`; a host refuses a second owner on
an origin. A service under a base path MUST NOT serve anything outside it.

**OP-3, the cookie.** Under a base path the session cookie's name starts with `__Secure-`, carries `Secure`, `HttpOnly`,
`SameSite=Strict`, `Path=<basePath>` and no `Domain`, and its name carries the service's id, so two services of one
owner keep distinct cookies. Without a base path it stays `__Host-` as today.

**OP-4, the request checks.** The `Host` and `Origin` checks stay the origin's; a request whose path is outside the base
path is refused `404` by the service (the door routes it elsewhere). A door in front MAY strip the prefix before the
process; the service then states its base path in its own configuration, and every link it emits carries the prefix.

**OP-5, who reads health.** The host reads the well-known document with the service token, as today. A person who holds
only a client key (a member of the organization, DEC-0159 CF-3) holds no service token: their host shows the service from
its public A2A card (identity and skills, no token) and its status as not read, and calls its capabilities with the
client key or a delegation token; the operator's host, which holds the token, reads health. No new credential reads a
service's health.

## What the DEC owes

- **Schemas:** `service-descriptor.schema.json`'s remote branch gains `basePath` and `owner`.
- **Rules:** `FAC-SEM-024` (or a new code) reads `basePath`'s form; a new code for OP-2 on a set of descriptors (a host's
  registry), equal origins with overlapping base paths, or two owners on one origin.
- **Vectors:** one service under a base path; two of one owner on disjoint paths; overlapping paths (refused); two owners
  on one origin (refused); a link joined from origin, base path and path.
- **Pages:** service's *Remote placement* and its cookie table, PL-4 (the joined link), conformance (a service row, a
  host row).

## Questions for Fabric Dashboards

1. Does OP-5 (a member's host shows a status not read, from the public card) meet FD-213, or does a member need health?
   Proposed: not read; health is the operator's host's.
2. Is OP-2's one-owner rule workable for the shared door (every agent behind it of one organization)? Proposed: yes; a
   second owner takes its own name or port.

## Not decided here

- The door itself (its tunnel, ports and routing): the door's owner's.
- A per-service token on a shared door handed to members: refused here (a token read by many is no token); a later
  decision may add a read-only status credential if OP-5's question is answered otherwise.
