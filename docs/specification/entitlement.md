# Entitlements: `entitlement/1` and `entitlement-key-set/1`

DEC-0085 · rule codes `FAC-SEM-115`, `FAC-SEM-116` · schemas
[`entitlement`](../../schemas/entitlement.schema.json) and
[`entitlement-key-set`](../../schemas/entitlement-key-set.schema.json) · code
[`src/entitlement.ts`](../../src/entitlement.ts) · vectors
[`fixtures/vectors/entitlement.json`](../../fixtures/vectors/entitlement.json), written by
[`tools/vectors/entitlement.ts`](../../tools/vectors/entitlement.ts)

An **entitlement** says what one signed order entitles one subject to: an organization (`org:<orgId>`) or one
person's estate (`personal`), for at most 35 days. It carries the order's lines (a member allowance, a hosting
product, a support tier and the paid agents) and nothing about money. The issuer, the PassionCode platform, signs it;
a verifier, the first organization server or a personal cloud, checks it offline against the issuer's keys and keeps
the last one it accepted for its subject. What a verified entitlement switches on, and what a lapsed one switches off,
is the verifying product's; this document states the record, its signature, its windows and its states.

Sources: the platform's request PLAT-020 on the project board (2026-10-17), which named the claims and left the
signature, the grace and the refresh to the contract; the platform's organization offer (its ADR-0005, accepted
2026-10-16: an entitlement derived from the `licence`, `hosting` and `agent` lines of an order, an `agent` line naming
the `agentRef` of its `fabric-package/1`, `hosting` either `org-cloud` or `personal-cloud`, a personal-cloud order with
no licence and no members, no amount in code or specifications); the contexts of DEC-0082; the package's `agentRef`
(DEC-0050); the signed-document pattern of `window-lease/1` (DEC-0062) and the register of DEC-0063; the small-order
refusal of DEC-0045; and the root-signs-key-sets pattern of devices.md *Key sets* (DEC-0031). RFC 8785 and RFC 8032 are
in the [source ledger](../evidence/sources.md).

## Fields

Every member is always present; a line the order does not have is `null`, so the signed statement keeps one field
list for good (DEC-0063: a changed list is a new type). The schema refuses any member it does not list.

| Field | Rule |
|---|---|
| `type` | `entitlement/1` |
| `issuer` | the issuer's `https://` origin in lower case: a host of two labels or more, no port, no path, no trailing slash; compared as written |
| `subject` | a context id (`common#/$defs/contextId`, DEC-0082): `org:<orgId>` or `personal`, never a person's id |
| `estate` | for `personal`, the person's estate id, which binds the entitlement to one person's network without a cross-organization person id; `null` for `org:<orgId>` |
| `order` | `{id, revision}`: the signed order's opaque id and its revision, a positive integer |
| `issuedAt`, `notBefore`, `expiresAt` | strict RFC 3339 instants, `issuedAt` ≤ `notBefore` < `expiresAt`, and `expiresAt` at most 35 days after `issuedAt` |
| `licence` | `{members}`, the member allowance from 1 to 1 000 000, or `null`; always `null` for `personal` |
| `hosting` | `{product, size}`: `product` `org-cloud` (only for `org:`) or `personal-cloud` (only for `personal`), `size` an opaque id; or `null` |
| `support` | `{tier}`: `observe`, `assist` or `managed`, what the organization's admin agents may do; or `null`; always `null` for `personal` |
| `agents` | 0 to 256 `{agentRef}`, one per paid agent, each `agentRef` once (`fabric-package#/$defs/agentRef`) |
| `alg`, `kid`, `sig` | `EdDSA`, the signing key's `kid`, and the signature ([the signature](#the-signature)) |

The support tier is in the signed record because an admin agent must read what it may do from a record it verified,
not from configuration an administrator can edit. No member carries an amount, a price, a currency or a person.

## The signature

The signature covers the UTF-8 RFC 8785 form of the entitlement without `sig` (`entitlementSigningInput`), the
register's `entitlement/1` statement ([signing challenges](conformance.md#signing-challenges), DEC-0063). The type is
inside the signed bytes, so no other statement the same key signs is an entitlement. It is one JSON document with its
signature inside, not a JWT: every signed record of the contract uses this one canonical form (DEC-0043, DEC-0062), and
a verifier needs no JOSE parser.

`alg` is `EdDSA` (Ed25519, RFC 8032) and nothing else: the verifiers already carry Ed25519 and its small-order check,
and one algorithm leaves no downgrade path. `ES256` may join additively by a later decision, as for leases and hub
keys. A key of small order is refused before anything is verified under it (DEC-0045). An entitlement's `digest` is
`sha256:` and the hex SHA-256 of the same signed bytes.

## Issuer keys

A verifier is installed with the issuer's **root key**, `{issuer, kid, x}` (Ed25519), pinned. The root signs only
`entitlement-key-set/1` documents; signing keys sign entitlements. The root can then live offline or in a hardware
module while the online keys rotate and are revoked without reinstalling any verifier: devices.md's key-set pattern
(DEC-0031), which the first organization server already runs for policies.

| Field | Rule |
|---|---|
| `type` | `entitlement-key-set/1` |
| `issuer` | the root's issuer, as an entitlement names it |
| `revision` | rises with every set the root signs |
| `issuedAt` | a strict RFC 3339 instant |
| `keys` | 1 to 32 `{kid, alg, x, notBefore, notAfter}`: each `kid` once, never the root's `kid`, `alg` `EdDSA`, `x` the canonical base64url of 32 bytes and never of small order, `notBefore` < `notAfter` |
| `revoked` | 0 to 256 kids, each once, none of them among `keys` |
| `alg`, `kid`, `sig` | the root's algorithm and `kid`, and its signature over the UTF-8 RFC 8785 form of the set without `sig` (`entitlementKeySetSigningInput`) |

- **Rotation.** A new key is added with a window that overlaps the old one. The old key stays listed after its
  `notAfter` until every entitlement it signed is past `expiresAt` and the grace (at most 35 + 14 = 49 days), and then
  may be dropped. An entitlement verifies only under a listed key whose window holds its `issuedAt`
  (`notBefore` ≤ `issuedAt` < `notAfter`).
- **Revocation.** A kid in `revoked`, and so absent from `keys`, refuses every entitlement it signed at once, whatever
  its window (`key-revoked`).
- **Replay of a key set.** The verifier keeps the highest revision it applied and the digest of its signed bytes. A
  lower revision is `stale-revision`; the same revision with other bytes is `revision-conflict`; the same bytes are
  accepted unchanged.
- **Replacing the root** is a reinstall, out of band, as replacing a device's root key is a re-enrollment.

## Windows

| Constant | Value | Why |
|---|---|---|
| `MAX_ENTITLEMENT_SECONDS` | 35 days | one billing month (at most 31 days) and 4 days for the next revision to arrive before the month turns |
| `REFRESH_SECONDS` | 7 days | the issuer issues the next revision at least this long before `expiresAt`; the verifier reports `refreshDue: true` from then on, so an administrator sees a stalled issuer a week ahead |
| `GRACE_SECONDS` | 14 days | after `expiresAt` the entitlement still verifies, with `state: "grace"`; two weeks cover a platform outage or a late payment reconciliation without an organization losing its paid functions over the issuer's failure; after that it is `lapsed` |
| `CLOCK_SKEW_SECONDS` | 60 s | how far before `notBefore` the verifier's clock may be (`src/rfc3339.ts`); since `issuedAt` ≤ `notBefore`, it also bounds an `issuedAt` in the future |

`state` is `active` while the clock is before `expiresAt` and `grace` from `expiresAt` until 14 days after it.

## One entitlement per subject

The verifier holds, per subject, the record of the last entitlement it accepted, `held`:
`{orderId, revision, issuedAt, digest}`. A new entitlement for that subject is:

- the same order with a higher revision: accepted, a renewal;
- the same order and revision with the same digest: accepted, `unchanged: true`, a redelivery;
- the same order and revision with another digest: `revision-conflict`;
- the same order with a lower revision: `stale-revision`;
- another order: accepted only when its `issuedAt` is later than the held one's, else `stale-revision`. A renewal into
  a new order supersedes; an old order's entitlement cannot be replayed over a newer one.

The verdict returns the new `held` record; the verifier stores it, one per subject. One person who is a member of two
organizations is two subjects: each organization holds its own entitlement, and an entitlement verifies only at its
own subject.

## The verifier

`verifyEntitlement(entitlement, {now, subject, estate, keySet, held})` checks, with no network, in this order, and
answers without throwing. `keySet` is the key set the verifier applied, which `verifyEntitlementKeySet` accepted under
its pinned root; `estate` is required for the subject `personal` and absent for an organization. It answers
`{ok: true, state, refreshDue, unchanged, digest, held}` or one problem:

| Row | Problem | When |
|---|---|---|
| EN-1 | `context-invalid`, `no-clock` | the context is not an object (first), then `now` is not a readable time (before any comparison), then `subject` is not a context id, `estate` is not an opaque id for `personal` or is present for an organization, `keySet` is not a well-formed key set under `EdDSA`, or `held` is not `{orderId, revision, issuedAt, digest}` |
| EN-2 | `malformed` | not an object, another `type`, a member missing or one the schema does not list, an issuer that is not a lower-case https origin, a value outside its field's rule, the subject's lines in disagreement (`personal` with a licence, a support tier, no estate or an `org-cloud`; an organization with an estate or a `personal-cloud`), an agent listed twice, a time that is not strict RFC 3339 (`T` or `t`, an offset, a day that exists), or `sig` not the canonical base64url of 64 bytes |
| EN-3 | `wrong-issuer` | `issuer` is not the key set's |
| EN-4 | `unknown-algorithm` | `alg` is not `EdDSA` |
| EN-5 | `unknown-key`, `key-revoked` | `kid` is neither listed nor revoked; `kid` is revoked |
| EN-6 | `unusable-key`, `small-order-key` | the listed key names another `alg`; the listed key is of small order (DEC-0045) |
| EN-7 | `key-not-valid` | `issuedAt` is before the key's `notBefore` or at or after its `notAfter` |
| EN-8 | `bad-signature` | the signature does not verify over `entitlementSigningInput` |
| EN-9 | `wrong-subject` | `subject` is not the verifier's, or, for `personal`, `estate` is not the verifier's |
| EN-10 | `too-long-lived` | the times are not `issuedAt` ≤ `notBefore` < `expiresAt`, or the life is above 35 days |
| EN-11 | `not-yet-valid` | the clock is more than 60 s before `notBefore` |
| EN-12 | `lapsed` | the clock is 14 days or more after `expiresAt` |
| EN-13 | `stale-revision`, `revision-conflict` | against the held record, as [one entitlement per subject](#one-entitlement-per-subject) states |

`verifyEntitlementKeySet(keySet, {root, held})` applies a key set: `root` is the pinned `{issuer, kid, x}`, `held` the
`{revision, digest}` of the set applied before. It answers `{ok: true, unchanged, digest, held}` or one problem:

| Row | Problem | When |
|---|---|---|
| EK-1 | `context-invalid` | the context is not an object, `root` is not `{issuer, kid, x}` with a lower-case https origin and an opaque kid, or `held` is not `{revision, digest}` |
| EK-2 | `malformed` | not an object, another `type`, a member missing or unlisted, a value outside its field's rule, no key, a kid listed twice, the root's kid among the keys, a revoked kid among the keys, a key window that does not end after it starts |
| EK-3 | `wrong-issuer` | the set's `issuer` or `kid` is not the pinned root's |
| EK-4 | `unknown-algorithm` | the set's `alg` or a key's `alg` is not `EdDSA` |
| EK-5 | `unusable-key`, `small-order-key` | the pinned root's `x` is not the canonical base64url of 32 bytes; the root or a listed key is of small order |
| EK-6 | `bad-signature` | the root's signature does not verify over `entitlementKeySetSigningInput` |
| EK-7 | `stale-revision`, `revision-conflict` | a revision below the held one; the held revision with another digest |

The vectors hold one case or more per problem and the boundaries: a life of exactly 35 days and one of 35 days and a
second, the clock 60 s before `notBefore` and a millisecond more, `refreshDue` at exactly 7 days before `expiresAt`
and a millisecond earlier, the grace at `expiresAt`, a day after it and a millisecond before it ends, `lapsed` at
exactly 14 days, a key's window at its first instant and a millisecond before it, `issuedAt` at the key's
`notAfter`, a key rotated out that still verifies what it signed in time, a key revoked inside its window, a forged
signature under the all-zero key, subjects and issuers that differ only in case or length, and one person's two
organizations. `test/entitlement.test.ts` runs every case; it also checks the committed file equals the generator's
output.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| `FAC-SEM-115` | `entitlement` | the subject's lines agree (`personal`: an estate, no licence, no support, at most a `personal-cloud`; `org:<orgId>`: no estate, at most an `org-cloud`), the subject is a context id, the times are strict RFC 3339 with `issuedAt` ≤ `notBefore` < `expiresAt`, the life is at most 35 days, and each agent is listed once by `agentRef` |
| `FAC-SEM-116` | `entitlement-key-set` | each kid once, the root's kid (the set's own `kid`) not among the keys, every key window strict RFC 3339 with `notBefore` < `notAfter`, no revoked kid among the keys, and no key of small order |

## Who adopts it

- **The PassionCode platform** issues entitlements: the root key offline, signing key sets only; signing keys online,
  each entitlement signed by a key the current set lists, with a life of at most 35 days, the next revision issued at
  least 7 days before `expiresAt`; rotation with overlapping windows, an old key kept listed for 49 days after its
  window; never an amount in a record.
- **The first organization server** verifies: it pins the root, applies key sets with `verifyEntitlementKeySet` and
  keeps the applied revision and digest, verifies each entitlement with `verifyEntitlement` for its subject
  `org:<orgId>`, stores the `held` record per subject, surfaces `refreshDue` and the `grace` state to its administrator,
  and runs `fixtures/vectors/entitlement.json`.
- **A personal cloud** verifies the same way with the subject `personal` and its own estate.

## Privacy

An entitlement names a subject (an organization's opaque id, or `personal` with an estate id), an order's opaque id,
counts and products. It carries no person, no member list and no amount; a member allowance is a number. One person in
two organizations appears in neither organization's entitlement, and the estate id of a personal entitlement is not a
cross-organization person id (the platform's program packet §2).

## Not decided here

- Member-period metering and what makes a member billable (the first organization server's Stage 5).
- Per-agent usage: it stays `grant.usage` (DEC-0082), joined by the organization server through the share grant.
- How the platform stores orders, and the hardware module ceremony for the root key.
- Which functions a lapse disables: the verifying product's (the platform's packet keeps ingest and security through
  the grace).
