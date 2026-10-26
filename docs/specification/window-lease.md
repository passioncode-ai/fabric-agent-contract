# Window leases — `window-lease/1`

DEC-0062 · rule codes `FAC-SEM-089`…`FAC-SEM-091` · schema
[`window-lease`](../../schemas/window-lease.schema.json) and `records.leases` in the
[`device-check-in`](../../schemas/device-check-in.schema.json) · code
[`src/window-lease.ts`](../../src/window-lease.ts) · vectors
[`fixtures/vectors/window-lease.json`](../../fixtures/vectors/window-lease.json)

A **window lease** is a share of one spending window handed to one machine. The estate's hub signs, once per machine,
the most that machine's meter may spend in one instance of a window — October 2026 of the estate's monthly total, say —
for at most 24 hours. The meter on that machine spends against the lease with no network: it reserves only while the
lease is valid and only up to what the lease leaves, and when the lease expires it reserves nothing more in that window
until a new one arrives. A global limit then holds across machines that do not talk to each other, with a stated
overrun bound ([the bound](#the-overrun-bound)).

Sources: the first organization server's target architecture v4 (commit `9c6a780`) — §2 rule 5 (one authority for
money per machine: the meter, spending window leases), §3 (the noun *Lease*), §6 Path 5 step 1 (a lease lasts at most
24 hours; an expired, unreported lease counts as spent; a reservation above the lease asks through `limit-reached`;
the overrun bound), §7 *Meter and leases*, and §12's row "window lease (window, amount, expiry at most 24 hours,
issuer, return; expired unreported = spent)". The terms below were agreed with Project Observatory's session, the
meter's owner, on 2026-10-12 (its `docs/design/METER.md`, sections M3 and M4). The windows are the spend policy's
(DEC-0037, DEC-0038); the check-in's `records.leases` is DEC-0053's.

## Fields

| Field | Rule |
|---|---|
| `type` | `window-lease/1` |
| `leaseId` | the lease's opaque id; the machine reports it to its hub over the relay (DEC-0132; never in a check-in to an organization server, DEC-0128 UE-2) |
| `sequence` | rises with every lease the hub issues one machine for one scope, window and period ([one lease per slot](#one-lease-per-slot)) |
| `estate` | the estate whose record certifies the signing hub key |
| `estateRevision` | the estate-record revision the hub followed; a machine that applies an earlier one refuses the lease until it has caught up |
| `machine` | the estate id of the one machine whose meter holds the lease (`machines[].id` in the estate record; never an organization enrollment's `device.id`, DEC-0128) |
| `scope` | whose window: `estate` (L0), `project:<id>` (L1) or `grant:<id>#<revision>`; v4 leases only `estate`, and the field is kept so a later version needs no new type |
| `window` | `day`, `week` or `month`: the spend policy's calendar windows in UTC, a week starting on Monday (DEC-0038) |
| `period` | the window instance ([the window instance](#the-window-instance)) |
| `amount` | the machine's whole share of the window instance, a decimal string of at most 9 integer and 6 fraction digits — the form of the device policy's quota |
| `unit` | `USD` |
| `issuedAt`, `expiresAt` | `expiresAt` after `issuedAt`, at most 24 hours later (v4 Path 5), and never after the window instance ends |
| `alg`, `kid`, `sig` | the hub key's algorithm and `kid`, and the signature ([who signs](#who-signs)) |

v4's *issuer* is `estate` with `kid`; its *return* is the meter's report ([reporting](#reporting)). There is no
escalation field: a reservation above the lease is an approval (`limit-reached`, answered through the operator
channel's confirm token, [DEC-0034](operator-channel.md) OC-6), never something a lease grants. The schema refuses any
member it does not list.

## The window instance

`period` names one instance of `window` in UTC: `YYYY-MM-DD` for `day`, the ISO 8601 week `YYYY-Www` for `week`
(upper-case `W`; week 1 is the week that holds 4 January, so a week's year is the year of its Thursday, and
2027-01-01 falls in `2026-W53`), `YYYY-MM` for `month`. A day, week or month that does not exist is refused: 2026 has
53 ISO weeks and 2025 has 52 (`periodBounds`, `periodOf`; RFC 3339 Appendix A collects ISO 8601's week form).

One label per instance was chosen over a pair of instants (`windowStart`, `windowEnd`). A pair carries the same
instance twice: a verifier would have to check that both are midnights of the window's own boundaries and agree with
`window`, and two ports that round differently would disagree about a lease both accept. A label is derived from the
clock in one way, compared by equality, and cannot name half a month. The meter's own windows already count by these
calendar labels (DEC-0038; the meter's `METER.md` M3: calendar windows in UTC, a week starting on Monday).

## Who signs

The estate's hub signs with a hub key the estate record certifies: a `kid` that exactly one machine's `hubKey` names
in the record the meter applies, where the record revokes neither that hub key nor that machine
(`certifiedHubKey`, [estate record](estate-record.md#machines), DEC-0055). The key is Ed25519 (`alg` `EdDSA`) until
Fabric records its decision D2 (ES256 beside EdDSA, ADR-0144), when `ES256` joins additively; it passes the
small-order check before anything is verified under it (DEC-0045).

The signature covers the UTF-8 RFC 8785 form of the lease without `sig` (`windowLeaseSigningInput`), the register's
`window-lease/1` statement ([signing challenges](conformance.md#signing-challenges), DEC-0063). The type is inside the
signed bytes, so a lease is no other statement the same key signs.

## One lease per slot

A machine holds one active lease per scope, window and period — its **slot**. A newer lease supersedes the older:
the verifier refuses a lease whose `sequence` is at or below the one held, unless it is the held lease itself
delivered again. A sequence, not a pointer to the lease replaced, decides: a meter that missed a lease still accepts
the next, and two leases cannot both claim to replace a third.

`amount` is the machine's whole share of the instance. A newer lease restates it, larger or smaller, and never adds to
it, so the meter's spend is counted once per window instance across every lease of the slot.

## The meter

`mayReserve(lease, {amountUsd, at, spentUsd, localRemainderUsd})` is the meter's decision under a lease it verified:
may it reserve `amountUsd` at `at`, having spent `spentUsd` in the window instance? It answers `ok` with what remains
after the reservation, or one problem:

- `expired` at or after `expiresAt`: the meter **fails closed** and reserves nothing more in that window, not even
  zero, until a newer lease arrives;
- `not-yet-valid` before `issuedAt`, `not-current-period` outside the window instance;
- `exhausted` when the amount is above the smaller of the lease's remainder (`amount − spent`, never below zero) and
  the meter's own remainder for the window (`localRemainderUsd`: its grant, project and key limits, DEC-0037);
- `malformed` and `no-clock` for input it cannot read.

The meter keeps its ledger as before (its `METER.md` M3); a lease adds a ceiling, not a second ledger. A run whose
reservation is refused as `exhausted` asks for more through the `limit-reached` approval, naming the window (v4 Path 5
step 4), and the meter's other work continues.

### The overrun bound

A reservation is checked before the call and settled after it. A call that costs more than it reserved (the price
error of a call in flight) can take `spent` above `amount`; the next reservation is then refused, and the window's
overrun is at most one call's error per meter (v4 Path 5 step 1).

## Reporting

A meter reports each lease it holds to its hub, `records.leases[]` (in the [machines' report](relay.md#the-machines-report) over the
relay, DEC-0132, never in a check-in to an organization server, DEC-0128 UE-2): `{leaseId, expiresAt, spent}` (DEC-0053's
names; `spent` is this decision's, optional and additive). `spent` is an upper bound on what the meter spent in the
lease's window instance: settled receipts plus open reservations, a decimal string.

What a meter has not reported counts as spent. After a hub move the new hub holds none of the old hub's division, so it
issues no lease of a window instance the old hub divided until that instance ends or every machine holding one of the
old hub's leases has reported it after the revocation (DEC-0107, [ceremonies](ceremonies.md#move-the-hub); a report
whose `estateRecord.revision` is at or above the revoking revision, DEC-0132 MR-5). The hub
counts, for each machine, the most it may have spent (`windowRemainder`):

- a lease still valid counts its whole `amount`, since the meter may still spend it;
- an expired lease counts the `spent` of a report written at or after its expiry (the report's own `at`, never its
  delivery, which a relay may delay by days: DEC-0132 MR-5), under it or a later lease of the same slot (`spent`
  covers the whole instance); without such a report it counts its whole `amount`.

A late report is credited at the hub's next division, as a refund: the expired lease stops counting its amount and
counts what was spent. A machine's own earlier leases are what its new lease replaces, so the remainder the hub may
lease a machine is the window's limit less what every **other** machine holds; a shrunk share frees its difference only
once the larger lease expires or is reported.

A lease reaches its machine unchanged: the relay carries it from the hub's machine as a message (DEC-0047). An estate's
lease never travels through an organization server once UE-2 is adopted (DEC-0128; the node adopts it after DEC-0132); a check-in response's `records.leases`, whose items
are this schema, carries an organization's own leases once organization windows exist. The transport adds
nothing and decides nothing.

## The verifier

`verifyWindowLease(lease, {at, machine, estateRecord, remainderUsd, held, estateRevocations})` checks (`estateRevocations`: the
revocation delta's entries in force, DEC-0062 item 3), with no network, in this order,
and answers without throwing. `estateRecord` is the record the machine applies, which `verifyEstateRecord` accepted;
`remainderUsd` is what the record that owns the window still allows this machine — the hub's own `windowRemainder`
when it checks before signing, and for a meter at most the window's limit it knows (the estate's L0 for the month);
`held` is the verified lease the machine holds for the same slot, if any (a lease held for another slot supersedes
nothing).

| Row | Problem | When |
|---|---|---|
| WL-1 | `context-invalid`, `no-clock` | the context is not an object (first), then the clock is not a readable time (before any comparison, so none runs on NaN), then `machine` is not a string, `estateRecord` not an object, `remainderUsd` not a decimal string, or `held` not an object with a whole `sequence` of 1 or more and a `leaseId` (a corrupt held state never reads as nothing held) |
| WL-2 | `malformed` | the lease is not an object, its `type` is not `window-lease/1`, a member is missing or one the register does not list is present, an id is not opaque, `sequence` or `estateRevision` is not a positive integer, `scope` is not one of its three forms, `period` is not an instance of `window` that exists, `amount` is not a decimal string, `unit` is not `USD`, a time is not a strict RFC 3339 date-time (`T` or `t`, an offset, a day that exists), `kid` is empty or `sig` is not base64url |
| WL-3 | `too-long-lived`, `past-window` | `expiresAt` is not after `issuedAt` or is more than 24 hours later; `expiresAt` is after the window instance ends |
| WL-4 | `unknown-algorithm` | `alg` is not `EdDSA` |
| WL-5 | `wrong-estate` | another estate than the record's, a record without an integer revision, or an `estateRevision` above the revision the machine applies |
| WL-6 | `hub-key-uncertified` | no single machine of the record certifies `kid`, the record revokes that hub key or that machine, or the hub key names another `alg` |
| WL-7 | `unusable-key`, `small-order-key` | the hub key is not a public Ed25519 JWK whose `x` is the canonical base64url of 32 bytes; it is of small order (DEC-0045) |
| WL-8 | `bad-signature` | `sig` is not the canonical base64url of 64 bytes, or does not verify over `windowLeaseSigningInput` |
| WL-9 | `wrong-machine` | `machine` is not this machine |
| WL-10 | `not-yet-valid`, `expired`, `not-current-period` | the clock is before `issuedAt`; at or after `expiresAt`; outside the window instance |
| WL-11 | `superseded` | the lease held for the same slot has a higher sequence, or the same sequence and is another document |
| WL-12 | `over-remainder` | `amount` is above `remainderUsd` |

The vectors hold one case or more per problem and the boundaries: a life of exactly 24 hours and one of 24 hours and a
second, a lease ending exactly when its month ends and one a second later, the instant of issue and the instant of
expiry, the amount equal to the remainder and one millionth above it, lower-case `t` and `z`, an offset of `+09:00`,
ISO week 53 of 2026 and of 2025, decimals a lax parser accepts (`1e3`, `01`, `.5`, seven fraction digits), and a
signature forged under the all-zero hub key. The hub key's seed is the estate record's test key, so a port's signer
reproduces every `sig`. `test/window-lease.test.ts` runs them in UTC, Asia/Tokyo and America/St_Johns.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-089"></a>`FAC-SEM-089` | `window-lease` | a lease's period is an instance of its window that exists, its times are strict RFC 3339, its life is positive and at most 24 hours and ends no later than its window instance, and its amount is a decimal string |
| <a id="fac-sem-090"></a>`FAC-SEM-090` | `window-lease-division` | the hub's division of one window instance (`{limitUsd, leases, reports}`): every lease of one estate, scope, window and period, each `leaseId` once, a machine's sequences rising with issue time, and no lease above what `windowRemainder` left its machine when it was issued, counting the leases issued and the reports written before it (their `at`, DEC-0132 MR-5) |
| <a id="fac-sem-091"></a>`FAC-SEM-091` | `lease-reservation` | a meter's decision (`{lease, request, decision}`, `reserve` or `refuse`) is the one `mayReserve` gives |

## Who adopts it

- **Fabric's hub** (backlog CT-19) issues leases: for each machine of the estate, one lease per slot under a hub key
  the current estate record certifies, its amount at most `windowRemainder`'s answer, its life at most 24 hours and
  inside the window instance, sequences rising per slot; it counts an expired, unreported lease as spent and credits
  a late report at its next division. After a hub move it issues no lease of a window instance the old hub divided
  until that instance ends or every machine holding one of the old hub's leases has reported it after the revocation
  (its newest report's `estateRecord.revision` at or above the revoking revision, DEC-0132 MR-5; a machine that refused it qualifies only once it applies a later revision, such as the one step 6 drafts for it) (DEC-0107, [Reporting](#reporting)). v4 sizes a lease at min(remainder ÷ active meters, two days at the recent rate);
  how the hub sizes it within the remainder is its own.
- **Project Observatory's meter** (CT-20) verifies each lease with `verifyWindowLease` before it spends against it,
  holds one per slot, reserves only as `mayReserve` answers (the smaller of its own remainder and the lease's, and
  nothing after expiry), and reports `records.leases[]` with `spent` (to its hub over the relay, DEC-0132; never in a check-in to an organization server, DEC-0128 UE-2).
- **An organization server** hands leases of organization windows in the check-in response (v4 Path 5); the scope
  `estate` is the only one v4 uses, and organization windows wait on a decision beyond the member list `org-authority/1` (DEC-0129).

## Privacy

A lease names an estate, a machine by its estate id, a window and an amount. It carries no person and no caller
identity (J10; v4 Path 5 step 3: per-member period totals come from lease returns inside the organization's own
server, and the public contract stays without a person dimension). `spent` is a sum over a window instance on one
machine.

## Not decided here

- v4's static split of each estate window per machine in the estate record (§6 Path 5): no field of `estate-record/1`
  carries it. The hub's leases are the split; past a lease's expiry with the hub asleep, a meter reserves nothing in
  that window, as the meter's owner agreed, instead of falling back to a passkey-signed share.
- How a lease reaches a machine from an estate's hub, and how the hub receives a meter's report, beyond the check-in's
  fields and the relay's message carriage (DEC-0047).
- Where an estate's window limits are signed (`limits/1`, [signing challenges](conformance.md#signing-challenges)):
  until a document carries them, a meter's `remainderUsd` is its configured limit.
- Organization windows, member allowances and their leases (beyond DEC-0129's member list); `ES256` hub keys (Fabric's D2).
