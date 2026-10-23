# The revocation delta and the timestamp heartbeat — `revocation-delta/1`, `heartbeat/1`

DEC-0054 · rule codes `FAC-SEM-082`…`FAC-SEM-084` · schemas
[`revocation-delta`](../../schemas/revocation-delta.schema.json), [`heartbeat`](../../schemas/heartbeat.schema.json) ·
code [`src/revocation-delta.ts`](../../src/revocation-delta.ts), [`src/revocation-delta-rules.ts`](../../src/revocation-delta-rules.ts) ·
vectors [`fixtures/vectors/revocation-delta.json`](../../fixtures/vectors/revocation-delta.json)

The [estate record](estate-record.md) keeps every revocation and is the durable state, but a revision is a whole record
signed by a passkey, and machines fetch it hourly. The **revocation delta** is its fast path: an append-only chain of
signed entries, one revocation each, that the relay pushes to every machine within seconds
([relay](relay.md#revocation-and-heartbeat), DEC-0047). The **timestamp heartbeat** is a signed commitment to the
delta's head and to the estate revision, so a relay that withholds an entry is caught: it can delay revocation, never
forge or hide it for long. A machine reports the head it applied and the heartbeat it holds in its check-in
(`records.revocationDelta`, `records.heartbeat`, [devices](devices.md#check-in), DEC-0053).

Sources: the first organization server's target architecture v4 (commit `9c6a780`), §7 *Freshness* (records valid 7
days and the estate record 30; a dedicated timestamp key, not the record key, signs the heartbeat; the delta rides the
relay and the check-in; the heartbeat signs the delta's head; 72 hours without one fail calls from other machines
closed while the person's own work continues) and §12's row "revocation delta and timestamp heartbeat"; RFC 8785 and
RFC 8032 in the [source ledger](../evidence/sources.md).

## Who signs: the estate key

Every entry and every heartbeat is signed by an **estate key**: the `hubKey` of a machine that the highest estate-record
revision the verifier verified and applied certifies (DEC-0055 item 4), compared by exact `kid`, certified for one
machine only, Ed25519 of full order (DEC-0045), and revoked neither by that revision (`hub-key` by its kid, `machine` by
its id) nor by an entry applied before (`estateSigner`). Any hub of the estate may sign; the estate has one chain.

- **Not the passkey.** The passkey requires a person present for every signature (UP and UV, DEC-0055 item 8), so it
  cannot sign a heartbeat every hour, and a passkey ceremony per revocation would make the fast path as slow as a
  revision. The passkey stays the authority: it certifies every hub key and can revoke any of them by a revision.
- **Not the relay.** A relay holds no authority (DEC-0047 item 1); a delta it could sign would let a compromised relay
  revoke anything.
- **A timestamp role apart from the record key** (v4 §7): the estate's record key is the passkey, and the hub key is
  not it.
- **What a compromised estate key can do:** revoke what the delta may carry, and stop signing heartbeats. Revocation only
  removes trust, so that is denial of service; it is also less than the same key can already do, since it signs
  delegation tokens (DEC-0039). It cannot revoke a passkey — the delta carries no `authority` revocation — so the person
  can always sign the revision that revokes the hub key. It cannot un-revoke: the chain is append-only, the record keeps
  every revocation (`FAC-SEM-072`), and a revision issued after an entry lists it ([reconciliation](#reconciliation)).
- **The hub's own key** (DEC-0084, the operator's NET-3): in a personal estate the hub runs on the always-on machine
  and holds a private key of its own, the Ed25519 key the record certifies as that machine's `hubKey`, never the
  machine's `#sig` key ([ceremonies](ceremonies.md#who-holds-which-key)); when it is away, heartbeats stop and the
  72-hour rule below applies; past 24 hours each machine tells its person, and the person moves the hub with a revision
  ([Move the hub](ceremonies.md#move-the-hub), `hubSilence`, DEC-0107). Whichever key the record certifies as `hubKey`
  is the one that signs here. Domain
  separation holds: a delta entry and a heartbeat sign RFC 8785 JSON, which starts with `{`; a delegation token signs a JWS signing
  input, which starts with `eyJ`; and every signed document here names its `type`.

## The delta

An **entry** (`$defs/entry` of [`revocation-delta`](../../schemas/revocation-delta.schema.json)):

| Field | Rule |
|---|---|
| `type` | `revocation-delta/1` |
| `alg` | `EdDSA`, signed; ES256 joins when Fabric records D2 (DEC-0055 item 9) |
| `estate` | the estate record's `estate` id |
| `sequence` | 1 for the estate's first entry, then the previous entry's plus one: never skipped, never repeated |
| `prev` | the head hash before this entry: the previous entry's hash, or for entry 1 the estate's **genesis** |
| `at` | when the hub issued it, RFC 3339 with an offset |
| `revocation` | `{kind, ref, revokedAt}` in the estate record's own shape; `kind` is `machine`, `device-key`, `hub-key`, `publisher-key`, `package` or `grant` (never `authority`); `revokedAt` never after `at`, and for a `grant` revocation of a share grant into an organization it SHOULD carry at most three fraction digits, since a share registration carries it floored to milliseconds (DEC-0086) |
| `kid` | the estate key's kid |
| `sig` | the Ed25519 signature (RFC 8032), 64 bytes in base64url, over the entry's signing input |

- **The signing input** is the UTF-8 RFC 8785 form of the entry without `sig` (`signingInput`).
- **The entry's hash**, which is the next head, is the hex SHA-256 of that same signing input (`deltaEntryHash`). The
  signature stays outside the hash, as an estate record's does.
- **The genesis** is the hex SHA-256 of the RFC 8785 form of `{type: "revocation-delta/1", estate, sequence: 0}`
  (`deltaGenesis`), so one estate's chain cannot be spliced onto another's.
- **The head** is `{sequence, sha256}`: the last entry's sequence and hash, or `{0, genesis}` before any (`deltaHead`).
  It is the shape of a check-in's `records.revocationDelta` (DEC-0053) and of a relay's `welcome.deltaHead` (DEC-0047),
  so a node reports what it holds, and passes on what it was handed, unchanged.
- **A page** is `{head, entries}` (the schema's root): consecutive entries, oldest first, at most 256, so a relay frame
  stays under 1 MiB. A relay's `delta` frame and a check-in response's `records.revocationDelta` carry one unchanged. The
  page's `head` is the carrier's hint and binds nothing; only a heartbeat's head binds.

**The hub's duties.** One chain per estate: a hub issues the next sequence after the head it holds and never two entries
for one sequence. It issues an entry for each revocation the estate decides, lists every entry in the next revision it
drafts, and SHOULD issue an entry for each revocation a revision adds, so it reaches machines within seconds too. How two
hubs of one estate agree on the next sequence is Fabric's.

## The heartbeat

A **heartbeat** ([`heartbeat`](../../schemas/heartbeat.schema.json)) is `{type: "heartbeat/1", alg: "EdDSA", estate,
sequence, at, deltaHead, estateRecord: {revision, digest}, kid, sig}`, signed like an entry. `sequence` is the estate's
heartbeat counter; `deltaHead` is the head of the delta when it was signed; `estateRecord` is the latest revision with
its `digest` (required here, so two revisions with one number are told apart, DEC-0056). A check-in reports the held
heartbeat's `sequence` and `at` (`records.heartbeat`, DEC-0053).

A running hub signs a heartbeat right after every entry and every revision, SHOULD sign one every 60 minutes
(`HEARTBEAT_INTERVAL_SECONDS`), and lets no more than 24 hours pass between two (v4 §7 "daily",
`HEARTBEAT_MAX_INTERVAL_SECONDS`). The 72-hour rule leaves room for three missed days.

## What a machine does

A machine holds, per estate, the entries it applied, the heartbeat it accepted, and whether it has seen two signed
histories (`DeltaState`). It applies only pages and heartbeats this section accepts, under the highest estate-record
revision it verified and applied (`trust.record`); an older revision still inside its 30-day window would bring back a
revoked hub key.

### Applying a page

`applyDelta(state, page, {record, at})` checks each entry in order, and refuses with the first problem; the entries
before a refused one stay applied, since each is a valid revocation:

| Row | Problem | When |
|---|---|---|
| RD-1 | `no-clock` | the verifier's clock is not a readable time (checked first: a comparison with NaN is always false) |
| RD-2 | `malformed` | the held state, the page or an entry is not of its shape: a `sequence` that is not an integer from 1 to 2^53 − 1 (a string `"1"` among them), `prev` that is not 64 lower-case hex, a `sig` that is not 86 base64url characters, a time that is not RFC 3339 with `T`, an offset and a day that exists, a `revokedAt` after `at`, a `device-key` `ref` that holds `@` but is no key reference `<kid>@sha256:<64 lower-case hex>` (DEC-0084: `FAC-SEM-076` refuses it in every revision, so the next revision could never list it), no RFC 8785 form |
| RD-3 | `wrong-estate` | the entry, or the trusted revision, is another estate's |
| RD-4 | `unsupported-alg` | `alg` is not `EdDSA` |
| RD-5 | `not-revocable` | the kind is `authority` or unknown: a passkey is revoked only by a revision a passkey signs |
| RD-6 | `not-yet-valid` | `at` is more than 60 s ahead of the verifier's clock (the relay's skew, DEC-0047); 60 s is accepted |
| RD-7 | `unknown-signer`, `revoked-signer`, `unusable-key`, `small-order-key` | no estate key: no machine of the revision certifies the kid (kids compare exactly), or two do; the record or an entry applied before revokes the hub key or its machine — including an earlier entry of the same page; the key is not a canonical Ed25519 JWK naming `EdDSA`; or it is of small order |
| RD-8 | `bad-signature` | the signature does not verify |
| RD-9 | `gap` | the sequence is past the next one: the machine asks from its head with `delta-query` |
| RD-10 | `broken-chain`, `fork` | a signed entry whose `prev` is not the head the machine holds, or that differs from the entry it holds at that sequence: a second signed history |

An entry the machine already holds (the same hash at its sequence) is skipped, so a repeated page changes nothing.
Signatures are checked before the chain, so only a validly signed entry can mark a machine `broken`: an unsigned or
altered entry is `bad-signature`, and a relay cannot break a machine by injecting one. On `broken-chain` and `fork` the
machine becomes `broken` and keeps that entry's revocation in force (`forked`): revocation outranks addition.

### Accepting a heartbeat

`acceptHeartbeat(state, heartbeat, {record, at})` checks RD-1…RD-4, RD-6…RD-8 for the heartbeat (`deltaHead.sha256`
in lower-case hex, `estateRecord.digest` as `sha256:` and 64 hex), then compares it with what the machine holds:

| Row | Problem | When |
|---|---|---|
| HB-0 | `malformed` | the heartbeat the machine holds is not one it could have accepted (a corrupt held state): refused, never read as "nothing held" (the owed reading of #64, 2026-10-12) |
| HB-1 | `not-newer` | its sequence is below the held heartbeat's: nothing changes |
| HB-2 | `fork` | the held sequence with other bytes; a head at a sequence the machine holds with another hash; or the applied revision's number with another digest. The machine becomes `broken` |
| HB-3 | `regressed` | a newer sequence that moves `at`, the head's sequence or the revision back; the held heartbeat stays |

The held heartbeat again is accepted and changes nothing. A heartbeat whose head or revision is ahead of the machine is
accepted: the machine is then `behind` until it catches up.

### The 72-hour rule

`deltaFreshness(state, {record, at})`, and `freshnessAnswer` over the same inputs for a port, answer:

| Answer | When | What arrives from other machines |
|---|---|---|
| `broken` | two signed histories were seen | refused |
| `stale` | no readable clock, no heartbeat held, or the held heartbeat is more than 72 hours old (`HEARTBEAT_STALE_SECONDS`; exactly 72 hours is still fresh) | refused |
| `behind` | the heartbeat's head is past the delta applied, or its revision past the revision applied | refused until the machine catches up |
| `current` | otherwise | accepted |

While a machine is not `current`, it cannot know that another machine is still unrevoked, so it **refuses what arrives
from other machines**: it places no caller in T1 (DL-25 places there an enrolled machine of the same owner that is
current and not revoked, DL-26) and accepts no T2 call — no delegated call or approval whose token another machine's hub
signed (DEC-0039), no command message from another machine over the relay (DEC-0047), no share-grant call from outside
the estate, and no new secret envelope. It **keeps** the person's own local work (T0, DL-25), every revocation in force,
and the way back: fetching and applying revisions, asking the relay with `delta-query`, applying pages and heartbeats. v4 §7 states the rule for an organization's calls; this
decision applies it to an estate's machines too, because without a fresh heartbeat a relay could withhold an entry
forever and a revoked machine would keep calling.

**Revocations in force** are the applied revision's, the applied entries' and those of forked entries
(`effectiveRevocations`). Every check that reads the estate record's revocations reads these instead: the relay's
admission set (DEC-0047; a relay subtracts the revocations in force from its admission set and closes the sessions they revoke, DEC-0066), an envelope's sender (DEC-0047 item 7),
the hub key a delegation verifier trusts (DL-14: the delta's part, `deltaRevocations`, goes to
`hubKeyCertified(..., {extraRevocations})` and to the verifiers' `estateRevocations`, DEC-0060), the package a node installs.

### The anchor

A revision may carry `deltaAnchor`, `{sequence, sha256}`: a head of the delta it vouches for (DEC-0107). Every revocation
of the entries up to it is in the revision, as [reconciliation](#reconciliation) requires of a revision issued after
them. When a machine applies such a revision it runs `anchorDelta(state, record)`:

- no anchor, an anchor below where its held chain starts, or one at a sequence it holds with the same hash: nothing
  changes;
- an anchor past the head it holds: the held chain starts there (`DeltaState.anchor`); the entries held before it are
  dropped, and the next entry is the anchor's sequence + 1. An entry is dropped only when the record lists its
  revocation, whatever the entry's time (reconciliation alone asks this only of entries dated by the revision's
  `issuedAt`), so an anchor never takes a revocation out of force: otherwise the answer is `unreconciled`, naming the
  entries, and nothing changes. The drafter lists every revocation up to the anchor whatever its time;
- an anchor whose hash differs from the entry held at its sequence: `fork`, and the machine is `broken`.

`applyDelta` then skips an entry below the anchor, one identical to the anchor, and one identical to an entry held,
before it looks up the signer (another entry at the anchor's sequence is a `fork`, as at any held sequence), so an entry an estate key signed that a later revision no longer certifies (the hub moved, its key revoked)
never refuses a page. `deltaHead` and `deltaFreshness` count from the anchor. A heartbeat whose head is below the
anchor is compared with nothing there. A revision keeps an anchor once one is set, never moves it back and never names
another hash at the same sequence (`FAC-SEM-137`). This is the checkpoint the earlier *Not decided* item named.

## Reconciliation

A revision issued at or after an entry's `at` lists that entry's revocation (the same `kind` and `ref`; a `grant` ref
matched by the normal form of the grant's URI id, every other kind exactly: `isRevoked`, DEC-0076). A machine
holding the entry refuses such a revision as `unreconciled` and keeps the one it holds (`reconcileRevision`,
`FAC-SEM-084`); a revision issued before the entry need not list it, and the entry stays in force. Times are compared as
instants, never as strings (an entry at `19:05:00+09:00` is `10:05:00Z`), and an unreadable time is `malformed`, never
compared. A machine applies a revision only when it is valid against the schema, `verifyEstateRecord` accepts it
(DEC-0055) and it is reconciled with the entries the machine holds; it then applies the revision's anchor
([the anchor](#the-anchor)), and a refusal by `anchorDelta` (`unreconciled`, `fork`, `malformed`) refuses the revision
too: the machine keeps the one it holds (DEC-0107). A missing entry's `index` from `reconcileRevision` is into the held
entries, so its sequence is the anchor's sequence (0 without one) plus the index plus one.

## The organization

v4 §7 also gives an organization a heartbeat signed by its own timestamp key, and records valid 7 days; DEC-0053's
check-in, which an organization server receives, carries it. Where an organization pins that key — `org-authority/1`
(Fabric D8) or a role in DEC-0031's key set — is not decided, so this version defines the estate's documents only: every
document names its `estate`. An organization's documents join additively, with their own scope member and key, once
that record exists; until then a device's `records.heartbeat` reports its estate's heartbeat.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-082"></a>`FAC-SEM-082` | `revocation-delta` | a page's entries are `EdDSA`, carry an admitted kind, name a `device-key` by a kid or a key reference `<kid>@sha256:<hex>` (DEC-0084; `applyDelta` refuses any other `@` form as `malformed`), are never dated before their revocation and have readable times; one estate; consecutive (the next sequence, `prev` the hash of the entry before, entry 1's `prev` the genesis); the page's `head` is its last entry's |
| <a id="fac-sem-083"></a>`FAC-SEM-083` | `heartbeat`, `delta-freshness` | a heartbeat is `EdDSA`, has a readable `at`, and a head at sequence 0 is the estate's genesis; `{at, applied: {sequence, revision}, heartbeat, broken, answer}`: the machine's answer is the one the 72-hour rule gives |
| <a id="fac-sem-084"></a>`FAC-SEM-084` | `delta-reconciliation` | `{revision, entries}`: a revision issued at or after an entry lists its revocation |
| <a id="fac-sem-137"></a>`FAC-SEM-137` | `estate-record-revision` | a revision whose parent carries `deltaAnchor` carries one too, at the parent's sequence or later, with the parent's hash at the same sequence (DEC-0107); `verifyEstateRecord` runs it whenever it has a parent |

## Who adopts it

- **Fabric's hub** issues entries and heartbeats under the estate key, keeps one chain, lists every entry in the next
  revision (every entry up to an anchor it sets, whatever its time, DEC-0107), and sends each page and heartbeat to the relay on its own admitted session (DEC-0066; backlog CT-19).
- **Project Observatory's node** applies pages and heartbeats under the highest revision it applied, reports the head and
  the heartbeat in its check-in, refuses what arrives from other machines unless `current`, refuses an unreconciled
  revision (CT-20, CT-34), and applies each revision's delta anchor with `anchorDelta` (DEC-0107, CT-113).
- **The relay** takes pages and heartbeats from an admitted hub machine's session and applies them under the record it
  holds (`applyDelta`, `acceptHeartbeat`), answering a refused one with their own problem code; it carries them
  unchanged in `delta`, `heartbeat` and `welcome` frames, answers `delta-query`, subtracts the revocations in force from
  its admission set and closes the sessions they revoke (DEC-0047, DEC-0066), applies a revision's delta anchor
  (`anchorDelta`, DEC-0107); it never signs one.

## Privacy

An entry names what is revoked — a machine id, a kid, a package digest or a grant id — and when. A heartbeat names a
counter, a time, a head and a revision. Neither names a person, a place or an activity (J10).

## Not decided here

- The organization's documents and the key that signs them (`org-authority/1`, Fabric D8), the 7-day validity of the
  organization's records, and the heartbeat extension of up to 7 days that v4 §7 lets the organization root or a quorum
  of administrators sign while the organization server is down.
- Recovery from a fork: a new chain anchored in a revision. Until it is decided, a `broken` machine stays broken and the
  person's own work continues.
- Compaction beyond the anchor: when the hub anchors a revision other than a move's ([the anchor](#the-anchor),
  DEC-0107 sets one at every hub move).
- How two hubs of one estate agree on the next sequence and the next heartbeat (Fabric's).
- Members, digests outside a placement, and `subject.erase` (v4 §7's list): kinds of the organization's delta.
- Fabric's D3 (which key is the hub key) and D2 (ES256 for it).
