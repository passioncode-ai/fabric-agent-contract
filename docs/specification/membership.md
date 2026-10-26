# Membership: `org-membership/1` and `org-key-set/1`

DEC-0127 · rule codes `FAC-SEM-145`, `FAC-SEM-146`, `FAC-SEM-147` · schemas
[`org-membership`](../../schemas/org-membership.schema.json), [`org-key-set`](../../schemas/org-key-set.schema.json) and
the estate record's `organizations` ([`estate-record`](../../schemas/estate-record.schema.json)) · code
[`src/org-membership.ts`](../../src/org-membership.ts) · vectors
[`fixtures/vectors/org-membership.json`](../../fixtures/vectors/org-membership.json), written by
[`tools/vectors/org-membership.ts`](../../tools/vectors/org-membership.ts)

A **membership attestation** says, for one reader, that one person is a member of one organization: the
organization, a subject pairwise to that reader, a role, whether the membership is `active` or `ended`, and its
revision, for at most a day. An organization server issues it; a person's Fabric verifies it before it trusts the
membership, and so may any product the person connects. The contract owns the document, the keys and the verifier, so
an open product reads membership and roles from **any** organization server that speaks it, and works without the
first organization server, which is the source of truth only for an organization that connected it (fabric-workspace
MD-9, path (a)).

What a membership switches on in a reader (the organization's context in Fabric, a product's organization view) is the
reader's; what ends with it is [OM-5](#ending). The organization's own list of admitted members for its relay
(`org-authority/1`, CT-37) is decided with unlinkable memberships (CT-122), because its entries are the members' keys
per context.

Sources: the organization train's packet TP-00, row N-1 and step 1.1 (fabric-workspace
`docs/reports/2026-10-25-organization-r1/README.md` at `d438e3dc`); MD-9 (`knowledge/integration.md` at `4c38d0b7`); the
operator's R1-D12 (a project enters an organization by the person's own passkey, no administrator's acceptance; MC-13
kept); the contexts of DEC-0082; the signed-document pattern of `entitlement/1` (DEC-0085) and the register of DEC-0063;
the root-signs-key-sets pattern of devices.md *Key sets* (DEC-0031); the small-order refusal of DEC-0045;
`organization-closed` (DEC-0103).

## Fields

**OM-1.** Every member is always present (DEC-0063: a changed list is a new type). The schema refuses any member it does not list.

| Field | Rule |
|---|---|
| `type` | `org-membership/1` |
| `issuer` | the organization server's `https://` origin in lower case, as `entitlement/1` states an issuer; compared as written |
| `org` | the organization's context id `org:<orgId>` (DEC-0082) |
| `audience` | the reader the attestation is for, as the issuer registered it: a person's Fabric, a product's client. A verifier refuses one for another audience |
| `subject` | the member, **pairwise**: one opaque id per (organization, audience, person), so two readers cannot join their records by it. Never an email, a name, the estate id or a device id |
| `role` | `owner`, `admin` or `member`. An issuer maps its own roles onto these three; a finer role travels in `extensions` and grants nothing by itself |
| `external` | `true` for a guest: a person whose own estate is not the organization's (a contractor, a partner's person) |
| `status` | `active`, or `ended`: the issuer states an end with a higher revision rather than going silent |
| `revision` | a positive integer that rises with every attestation for this (organization, audience, subject) |
| `membershipEndsAt` | when the membership itself ends (a fixed term, a guest's end), or `null` |
| `issuedAt`, `notBefore`, `expiresAt` | strict RFC 3339 instants with at most three fraction digits, `issuedAt` ≤ `notBefore` < `expiresAt`, and `expiresAt` at most 24 hours after `issuedAt` |
| `extensions` | at most 16 of the issuer's own statements, each named by a domain it controls, a slash and a name (`orgs.example/seat`), each a string of at most 256 characters, a boolean or an integer; `{}` when none. A reader ignores one it does not know |
| `alg`, `kid`, `sig` | `EdDSA`, the signing key's `kid`, and the signature |

No member names a person: the subject is opaque and pairwise, and an organization's name is the reader's to fetch from
the issuer, not a signed fact.

## The signature

The signature covers the UTF-8 RFC 8785 form of the attestation without `sig` (`orgMembershipSigningInput`), the
register's `org-membership/1` statement ([signing challenges](conformance.md#signing-challenges), DEC-0063). It is one
JSON document with its signature inside, not a JWT, as every signed record of the contract (DEC-0043, DEC-0085): a
verifier needs no JOSE parser, and an issuer that signs JOSE elsewhere signs this form here. `alg` is `EdDSA` and
nothing else; a key of small order is refused before anything is verified under it (DEC-0045). The `digest` is
`sha256:` and the hex SHA-256 of the same signed bytes.

## The organization's keys

**OM-2, the pin.** The person admits an organization into their estate by pinning its root in the estate record's
`organizations`: `{org, issuer, root: {kid, x}, pinnedAt}`. The passkey's signature over that estate revision is the
person's admission (R1-D12); no administrator signs it, and no admission receipt exists. Fabric reads the root from the
issuer at the moment the person joins and shows it to them before the passkey signs; how the issuer serves it, and
what the person compares the fingerprint with (an administrator's invitation, a second channel) is Fabric's
organization decision (D8). Unpinning an organization in a later
revision ends every membership of it ([OM-5](#ending)). `FAC-SEM-147` refuses an organization pinned twice and a root of
small order. A reader pinned before DEC-0127 refuses the member, so Fabric writes it only once every reader of the
record is pinned at or after: every machine of the person and the relay that holds the record (as DEC-0106 and DEC-0107
gated theirs).

**OM-3, the key set.** The membership root signs only `org-key-set/1` documents; signing keys sign attestations. It is
a key of its own, never the same key as the organization's `policyRootKey` (DEC-0031), which signs device policy key
sets only. One membership root signs for one organization, even on a server that hosts many: an issuer key belongs to
the organization, so another server can take the organization over under the same `org:<orgId>` by the person's new
pin (a new id is a new organization and context), and an organization deleted at one server leaves nothing that signs
for it. A signing key is listed in one organization's set only; the verifier still checks the attestation's `org`, so
a server that lists one key for two organizations is refused `wrong-org` rather than trusted.

| Field | Rule |
|---|---|
| `type` | `org-key-set/1` |
| `issuer`, `org` | the root's issuer and organization, as the pin names them |
| `revision` | rises with every set the root signs |
| `issuedAt` | a strict RFC 3339 instant |
| `keys` | 1 to 32 `{kid, alg, x, notBefore, notAfter}`: at least one valid at `issuedAt`, each `kid` once, never the root's `kid`, `alg` `EdDSA`, `x` the canonical base64url of 32 bytes and never of small order, `notBefore` < `notAfter` |
| `revoked` | 0 to 256 kids, each once, none of them among `keys` |
| `alg`, `kid`, `sig` | the root's algorithm and `kid`, and its signature over the UTF-8 RFC 8785 form of the set without `sig` (`orgKeySetSigningInput`) |

Rotation, revocation and replay are `entitlement-key-set/1`'s ([entitlement](entitlement.md#issuer-keys)): a new key
overlaps the old one, an old key stays listed until what it signed is past `expiresAt` (here a day), a revoked kid
refuses at once what it signed, a lower revision is `stale-revision` and the same revision with other bytes
`revision-conflict`. Replacing the root is a new pin by the person.

## The verifiers

**OM-4.** `verifyOrgKeySet(keySet, {root, held})` applies a key set under the pinned root and answers
`{ok: true, unchanged, digest, held}` or one problem:

| Row | Problem | When |
|---|---|---|
| OK-1 | `context-invalid` | the context is not an object, `root` is not `{issuer, org, kid, x}`, or `held` is not `{revision, digest}` |
| OK-2 | `malformed` | not an object, another `type`, a member missing or unlisted, a value outside its field's rule, no key valid at `issuedAt`, a kid listed twice, the root's kid or a revoked kid among the keys, a key window that does not end after it starts |
| OK-3 | `wrong-issuer` | the set's `issuer` or `kid` is not the pinned root's |
| OK-4 | `wrong-org` | the set's `org` is not the pinned root's |
| OK-5 | `unknown-algorithm` | the set's `alg` or a key's `alg` is not `EdDSA` |
| OK-6 | `unusable-key`, `small-order-key` | the pinned root's `x` is not the canonical base64url of 32 bytes; the root or a listed key is of small order |
| OK-7 | `bad-signature` | the root's signature does not verify over `orgKeySetSigningInput` |
| OK-8 | `stale-revision`, `revision-conflict` | a revision below the held one; the held revision with another digest |

`verifyOrgMembership(attestation, {now, org, audience, subject?, keySet, held})` checks an attestation with no network, in this
order, and answers `{ok: true, status, role, refreshDue, unchanged, digest, held}` or one problem. `keySet` is the set
the reader applied under the pin of `org`; `held` is `{subject, revision, digest}`, the record the reader keeps per
(organization, audience, subject); `subject` is the member the reader asks about, which a reader whose audience many
members share (a product's client) passes, so a member presenting another member's attestation is refused:

| Row | Problem | When |
|---|---|---|
| OM-a | `no-clock`, `context-invalid` | the context is not an object (first), then `now` is not a readable time, then `org` is not an organization's context id, `audience` or a given `subject` not an opaque id, `keySet` not a well-formed `EdDSA` key set of `org`, or `held` not `{subject, revision, digest}` |
| OM-b | `malformed` | not an object, another `type`, a member missing or unlisted, a value outside its field's rule (an unknown role or status, an extension not named by a domain, holding an object or a string of more than 256 code points, a time with more than three fraction digits) |
| OM-c | `wrong-issuer` | `issuer` is not the key set's |
| OM-d | `unknown-algorithm` | `alg` is not `EdDSA` |
| OM-e | `unknown-key`, `key-revoked` | `kid` is neither listed nor revoked; `kid` is revoked |
| OM-f | `unusable-key`, `small-order-key` | the listed key names another `alg`; the listed key is of small order |
| OM-g | `key-not-valid` | `issuedAt` is outside the key's window |
| OM-h | `bad-signature` | the signature does not verify over `orgMembershipSigningInput` |
| OM-i | `wrong-org`, `wrong-audience`, `wrong-subject` | `org` is not the reader's; `audience` is not the reader's; `subject` is not the one the reader passed |
| OM-j | `too-long-lived` | the times are not `issuedAt` ≤ `notBefore` < `expiresAt`, or the life is above 24 hours |
| OM-k | `not-yet-valid` | the clock is more than 60 s before `notBefore` |
| OM-l | `expired` | the clock is at or after `expiresAt`: there is no grace, an expired attestation proves nothing about now |
| OM-m | `stale-revision`, `revision-conflict` | for the held subject: a lower revision; the held revision with other bytes |

An accepted attestation reads `status: "ended"` when it says so or when the clock is at or after `membershipEndsAt`;
`refreshDue` is true from 15 minutes before `expiresAt`. A held record for another subject does not apply: the reader
keeps one per subject.

## Ending

**OM-5, what ends with a membership.** A membership ends when an accepted attestation reads `ended`, when the
organization answers `organization-closed` (DEC-0103), or when the person unpins the organization from their estate.
Everything the membership carried ends with it, as one rule:

- Fabric revokes every share grant whose context is that `org:<orgId>`: the next estate revision lists a `grant`
  revocation for each, and in the same revision removes the grant from `shareGrants` and every placement and secret
  placement in that context, and drops the organization's pin, so the revision passes `FAC-SEM-075`, `FAC-SEM-076` and
  `FAC-SEM-111` and every machine of the person reads the end from it once the person's passkey signs it (Fabric
  drafts it at the end and asks for the signature; until then the server already refuses the revoked certificate, and
  the hub mints nothing in the context); the revocation delta carries the revocation fast (DEC-0054), so the
  agents the person shared stop running for it;
- the hub mints no delegation token in that context, and no relayed decision or mandate of the organization's context
  is taken;
- the device enrollment ends: the organization server revokes the device certificate (DEC-0031), and the node, when it
  applies an estate revision that no longer pins the organization or meets `organization-closed`, ends that enrollment
  as on `organization-closed` ([devices](devices.md#organization-closed), DEC-0103); a revoked certificate alone keeps
  DEC-0103's meaning and is not read as a membership's end. Ending it, the node stops every
  request to that organization, drops what it buffered for it, discards that organization's `server` policy layer and
  its locks, key set, collection start and streams, deletes every credential of the context (DEC-0111) and drops the
  enrollment's keys (CT-122 adds the context's own `iss` and hub key, dropped the same way); an `mdm` layer stays the
  operating system's;
- nothing of the organization's leaves the person's machine from then on ([OM-7](#what-leaves-a-persons-fabric)).

**OM-6, suspended is not ended.** An attestation that expired, could not be refreshed or no longer verifies under the
applied key set **suspends** the membership: nothing new is authorised for the organization (no share grant created or
widened, no delegation token minted in its context), while what already runs keeps its own expiry. Since a delegation
token lives at most 600 s (`FAC-SEM-049`), calls in the organization's context stop within ten minutes of a suspension,
so an issuer sizes the attestation's life against its own outage budget. A refresh the issuer
refuses for the membership (it answers that the person is not a member) is an end, as an `ended` attestation is. The
reader asks for the next revision once `refreshDue` is true, and at least whenever it would act in the organization's
context.

## What leaves a person's Fabric

**OM-7, the allowlist.** For an organization whose membership is active or suspended, these leave the person's Fabric
for that organization's server, and nothing else ([contexts](contexts.md#routing)):

| What | Which | Rule |
|---|---|---|
| the enrollment's own requests | enrollment (its `org.id`, `device.id`, platform, key description, CSR, an optional platform attestation and its proof), certificate rotation, renewal | [devices](devices.md), DEC-0031, DEC-0094, DEC-0100 |
| check-ins | the enrollment of that organization, its streams only | [devices](devices.md#check-in), DEC-0031 |
| a session's events | sessions whose context is that `org:<orgId>`, as `routeTarget` answers | DEC-0082 |
| the enrollment's own activity events | events that carry no session, such as `policy.violation` | [activity](activity.md), DEC-0052 |
| proposals | proposals submitted to that organization's server | [proposals](proposals.md), DEC-0072 |
| `grant.usage` and share registrations | grants whose context is that `org:<orgId>` | DEC-0086 |
| `node-summary/1` | the enrollment's own record: what DEC-0118 lists for the machine's mode (under `C` this context only, under `A` the whole harness) | DEC-0102, DEC-0118 |
| `credentialRequests`, `callRecords` | the enrollment's own | DEC-0111 |
| a membership refresh | the audience and the subject the issuer gave | this decision |

Personal work, another organization's work, the estate record and its members, passkeys, secrets, the person's other
memberships and anything a row does not name never leave for an organization. A new row needs a decision. One gap is
recorded, not allowed: until CT-122 every check-in also carries the estate's own records (the estate record's revision
and digest, the heartbeat, the revocation delta's head, the leases, DEC-0053, DEC-0054, DEC-0056, DEC-0062), which link
one machine across organizations ([contexts](contexts.md#linkability)); CT-122 removes them from what goes to an
organization.

## The issuer's duties

**OM-8.**

- It raises `revision` with every attestation for an (organization, audience, subject) and never signs one revision
  with other bytes.
- It states an end: an `ended` attestation with a higher revision when the membership ends, and a refused refresh after
  it, never silence alone.
- It keeps the subject pairwise and opaque, and puts no person's name, address or email in any member.
- It maps its own roles onto `owner`, `admin` and `member`; a finer role goes in `extensions`, which grant nothing.
- It holds one membership root per organization, distinct from the `policyRootKey`, signs only `org-key-set/1` with
  it, lists each signing key in one organization's set, rotates signing keys with overlapping windows, and re-issues
  under a listed key before it revokes one.
- It issues attestations with a life of at most 24 hours; a short life (an hour) bounds how long an end it could not
  deliver still reads active.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-145"></a>`FAC-SEM-145` | `org-membership` | the times are strict RFC 3339 with at most three fraction digits and `issuedAt` ≤ `notBefore` < `expiresAt`, the life is at most 24 hours, and `membershipEndsAt` is `null` or such a time |
| <a id="fac-sem-146"></a>`FAC-SEM-146` | `org-key-set` | each kid once, the root's kid not among the keys, every key window strict and positive, no revoked kid among the keys, no key of small order, and at least one key valid at the set's `issuedAt` |
| <a id="fac-sem-147"></a>`FAC-SEM-147` | `estate-record` | each organization pinned once by its context, and no pinned root of small order |

## Who adopts it

- **Every organization server** (MD-9 path (a)) issues attestations: a root per organization that signs key sets only,
  signing keys online, a life of at most 24 hours, every duty of OM-8, and runs `fixtures/vectors/org-membership.json`.
  The first organization server is one of them; its own extensions go under its own domain.
- **Fabric** pins an organization's root in the estate record at the person's join (OM-2), applies key sets with
  `verifyOrgKeySet`, verifies attestations with `verifyOrgMembership` before it trusts a membership, keeps the held
  record per subject, and acts on OM-5, OM-6 and OM-7.
- **Project Observatory's node** ends an enrollment on a membership's end as on `organization-closed` (OM-5): it learns
  of the end from an estate revision that no longer pins the organization, which Fabric writes on every end (OM-5),
  and from `organization-closed`; a revoked certificate alone keeps its DEC-0103 meaning. Until every reader is pinned
  at or after DEC-0127 no revision carries `organizations`, so a node ends an enrollment as DEC-0103 and its own
  adoption already do.
- **A product** that reads membership (an open product of the organization train) verifies the same way under the same
  pin, with its own audience.

## Privacy

An attestation names an organization's opaque id, a reader, an opaque subject pairwise to that reader, a role and
times. Two readers of one person's membership see two subjects, and an attestation adds no link between organizations:
each is one organization's, for one audience. What still links one machine across organizations until CT-122 is in
[contexts](contexts.md#linkability). The estate record's `organizations` lists the person's
organizations to the person's own machines; the relay operator reads it today as it reads `org:<orgId>` in share
grants, until per-context relay sessions (CT-122's question 3).

## Not decided here

- `org-authority/1`, the organization's list of admitted members for its relay's admission set (CT-37): its entries
  are the members' per-context keys, decided with CT-122.
- How an issuer serves its root and key sets (a URL, a push), and how Fabric shows the root before the passkey signs:
  the issuer's and Fabric's (D8).
- What the hub answers a caller it refuses to mint for in a suspended or ended organization's context (OM-5, OM-6):
  the hub's refusal code, Fabric's to state beside DL-4.
- How attestations reach a reader (a push, a fetch) and how a reader authenticates to the issuer to fetch one: the
  issuer's and the reader's, beside OM-7's refresh row, which bounds what that exchange carries about the person.
- A faster end than expiry (an organization's revocation delta with a `member` kind): additive, when a reader needs it.
- What each role may do in a reader: the reader's. An administrator's signature to release a project created in an
  organization (MC-13) is not an attestation and is not decided here.
- Attestation formats that carry a hardware identifier (OQ-0010).
