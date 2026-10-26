# Membership: `org-membership/1`, `org-key-set/1` and `org-authority/1`

DEC-0127, DEC-0129, DEC-0131 · rule codes `FAC-SEM-145`, `FAC-SEM-146`, `FAC-SEM-147`, `FAC-SEM-150`, `FAC-SEM-151` · schemas
[`org-membership`](../../schemas/org-membership.schema.json), [`org-key-set`](../../schemas/org-key-set.schema.json),
[`org-authority`](../../schemas/org-authority.schema.json) and the estate record's `organizations`
([`estate-record`](../../schemas/estate-record.schema.json)) · code [`src/org-membership.ts`](../../src/org-membership.ts),
[`src/org-authority.ts`](../../src/org-authority.ts) (with `orgRelayAdmissionSet`) · vectors
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
reader's; what ends with it is [OM-5](#ending). The organization's own list of admitted members for its relay is
`org-authority/1` ([its section](#the-organizations-member-list), DEC-0129), signed by an administrator's passkey the
organization's root certifies.

Sources: the organization train's packet TP-00, row N-1 and step 1.1 (fabric-workspace
`docs/reports/2026-10-25-organization-r1/README.md` at `d438e3dc`); MD-9 (`knowledge/integration.md` at `4c38d0b7`); the
operator's R1-D12 (a project enters an organization by the person's own passkey, no administrator's acceptance; MC-13
kept); the contexts of DEC-0082; the signed-document pattern of `entitlement/1` (DEC-0085) and the register of DEC-0063;
the root-signs-key-sets pattern of devices.md *Key sets* (DEC-0031); the small-order refusal of DEC-0045;
`organization-closed` (DEC-0103); for DEC-0129, Fabric ADR-0178 (fabric `cf99c32f`: an administrator's passkey signs the
organization's record, a server drafts it and signs nothing of it, each member mints its own organization tokens).

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
`organizations`: `{org, issuer, iss, root: {kid, x}, pinnedAt}`, `iss` being the opaque issuer of that context's tokens
Fabric generates at the join (DEC-0128). The passkey's signature over that estate revision is the
person's admission (R1-D12); no administrator signs it, and no admission receipt exists. Fabric reads the root from the
issuer's root route ([the draft exchange](#the-draft-exchange), DEC-0131) at the moment the person joins and shows it
to them before the passkey signs; what the person compares the fingerprint with is Fabric's: ADR-0178 point 6 shows the root's `kid` and a fingerprint of
its `x`, which the person compares with the one in the administrator's invitation, reached by a second channel, and
pins nothing on a mismatch. Unpinning an organization in a later
revision ends every membership of it ([OM-5](#ending)). `FAC-SEM-147` refuses an organization pinned twice and a root of
small order, and each context issuer once (`FAC-SEM-147`). A reader pinned before DEC-0128 refuses the member as
DEC-0128 shapes it, so Fabric writes it only once every reader of the record is pinned at or after DEC-0128: every machine of the person and the relay that holds the record (as DEC-0106 and DEC-0107
gated theirs).

**OM-3, the key set.** The membership root signs only `org-key-set/1` documents; signing keys sign attestations. It is
a key of its own, never the same key as the organization's `policyRootKey` (DEC-0031), which signs device policy key
sets only. One membership root signs for one organization, even on a server that hosts many: an issuer key belongs to
the organization, so another server can take the organization over under the same `org:<orgId>` by the person's new
pin (a new id is a new organization and context). An organization deleted at one server leaves its root in the owner's
Fabric (DEC-0129), and a key set naming that server still needs each member's pin, which names the issuer. A signing key is listed in one organization's set only; the verifier still checks the attestation's `org`, so
a server that lists one key for two organizations is refused `wrong-org` rather than trusted.

| Field | Rule |
|---|---|
| `type` | `org-key-set/1` |
| `issuer`, `org` | the root's issuer and organization, as the pin names them |
| `revision` | rises with every set the root signs |
| `issuedAt` | a strict RFC 3339 instant |
| `keys` | 1 to 32 `{kid, alg, x, notBefore, notAfter}`: at least one valid at `issuedAt`, each `kid` once, never the root's `kid`, `alg` `EdDSA`, `x` the canonical base64url of 32 bytes and never of small order, `notBefore` < `notAfter` |
| `revoked` | 0 to 256 kids, each once, none of them among `keys` |
| `administrators` | 0 to 16 signing passkeys `{credentialId, alg, publicKey, rpId, origins}` (DEC-0129): each `credentialId` once, `alg` `ES256` or `EdDSA`, `rpId` a signing RP and every origin within it |
| `alg`, `kid`, `sig` | the root's algorithm and `kid`, and its signature over the UTF-8 RFC 8785 form of the set without `sig` (`orgKeySetSigningInput`) |

**The administrators** (DEC-0129). The set also lists `administrators`: 0 to 16 signing passkeys, each in the estate
record's `authority` shape `{credentialId, alg, publicKey, rpId, origins}`, which the root certifies by signing the set.
Only they sign the organization's member list ([OL-2](#the-organizations-member-list)), in Fabric or a pinned page, never
on a server (Fabric ADR-0178 point 2); a signing key of `keys` never signs it, and an administrator's passkey never
signs an attestation. Each credential is listed once, under a signing RP (`sign.<domain>`, DEC-0063) with every origin
within it (`FAC-SEM-146`). An administrator's credential is registered for that organization alone: never one of the
administrator's estate record `authorities`, which OM-7 keeps from every organization, and never listed in another
organization's set, so two organizations cannot link one administrator by it. The administrator's Fabric enforces this
when it registers the credential; no server can check it. A credential a later set drops signs nothing from that set on. Who holds the root (DEC-0129): the organization owner's Fabric, never a
server (A-3: the platform never holds an organization root); the server generates the signing keys, drafts each key set
and serves the sets and the attestations, and the owner's Fabric signs each set it drafted. It first shows the owner
the draft's changes to `keys`, `revoked` and `administrators` against the set it signed last, and signs only once the
owner confirms them in a ceremony their passkey authorises (user verification), never on the server's word; that
confirmation is a local gate in the owner's Fabric, which no one verifies later (a register statement for it is not
decided): so no
server can certify an administrator. A reader pinned at a main commit of DEC-0127 or DEC-0128 refuses a set carrying
`administrators`, and a reader at or after DEC-0129 refuses one without it; no tag carried the type before (DEC-0119). ADR-0178 takes the owner's two passkeys as the organization's root in R1 (its D8-b); here the root that
signs key sets stays DEC-0127's Ed25519 key, and D8-b's estate passkeys are not used: the owner registers a signing
credential for this organization alone, which enters as the first set's administrator (both departures from D8-b). A passkey
that signs key sets itself would be a new pin form, and an administrator's device binding (ADR-0178 point 2) is not
checked: both later decisions.

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
| OK-2 | `malformed` | not an object, another `type`, a member missing or unlisted, a value outside its field's rule, no key valid at `issuedAt`, a kid listed twice, the root's kid or a revoked kid among the keys, a key window that does not end after it starts, an administrator's credential not in its shape or listed twice |
| OK-3 | `wrong-issuer` | the set's `issuer` or `kid` is not the pinned root's |
| OK-4 | `wrong-org` | the set's `org` is not the pinned root's |
| OK-5 | `unknown-algorithm` | the set's `alg` or a key's `alg` is not `EdDSA` |
| OK-6 | `unusable-key`, `small-order-key` | the pinned root's `x` is not the canonical base64url of 32 bytes; the root or a listed key is of small order; an administrator's credential is not a signing credential (its RP ID or an origin) or its key is unusable or of small order (DEC-0129) |
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
  placement in that context, and drops the organization's pin and every machine's hub key of that context (each revoked
  as `hub-key`, DEC-0128), so the revision passes `FAC-SEM-075`, `FAC-SEM-076` and
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
  enrollment's keys (the context's hub keys go with the pin, DEC-0128); an `mdm` layer stays the
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
for that organization's server, and nothing else ([contexts](contexts.md#routing)). The owner's and an administrator's
rows also hold for an organization being created, before any membership is active, since its first key set and first
list come from them (DEC-0129):

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
| for the organization's owner | the membership root's public key, the owner's signing credential for this organization (as its first administrator), the root's signatures over the key sets the server drafted (OM-3), and the claim the server showed the owner (OX-2) | DEC-0129, DEC-0131 |
| for an administrator | the public part of their signing passkey (an `administrators` entry) and their signatures over member lists (OL-2) | DEC-0129 |
| the member list's own entry | the context's `iss` (DEC-0128), so the server can draft `org-authority/1`; the enrollment's `#sig` key it already holds from the enrollment | DEC-0129 |
| an adaptation plan's organization part (TP-03) | what the person chose to bring into that organization (projects, history, results, schedules), by reference, and the person's requests to its administrators; never the plan's draft, its inventory or anything the person did not choose | DEC-0129 |
| a membership refresh | the audience and the subject the issuer gave | DEC-0127 |

Personal work beyond the references the person chose in an adaptation plan (never their content), another
organization's work, the estate record and its members, the estate's passkeys, secrets, the person's other
memberships and anything a row does not name never leave for an organization. The adaptation row carries no project's
entry: a project enters by the estate revision its person's passkey signs (R1-D12, Fabric ADR-0178 point 7), which never
leaves. A new row needs a decision. The estate's own
records a check-in could carry (the estate record's revision and digest, the heartbeat, the revocation delta's head, the
leases, DEC-0053, DEC-0054, DEC-0056, DEC-0062) and the estate documents an answer could carry are not on the list:
DEC-0128 makes leaving them out the sender's duty ([devices](devices.md#unlinkable-enrollments) UE-2, `FAC-SEM-149`),
and until a node adopts it they still link one machine across organizations ([contexts](contexts.md#linkability)).

## The issuer's duties

**OM-8.**

- It raises `revision` with every attestation for an (organization, audience, subject) and never signs one revision
  with other bytes.
- It states an end: an `ended` attestation with a higher revision when the membership ends, a refused refresh after
  it, never silence alone, and it revokes every device certificate of the person's enrollments in that organization (DEC-0031).
- It keeps the subject pairwise and opaque, and puts no person's name, address or email in any member.
- It maps its own roles onto `owner`, `admin` and `member`; a finer role goes in `extensions`, which grant nothing.
- It uses one membership root per organization, which signs only `org-key-set/1` and is never the `policyRootKey`;
  since DEC-0129 the membership root is held by the organization owner's Fabric, never by the server, which drafts
  each set for it to sign ([the draft exchange](#the-draft-exchange), DEC-0131). It lists each signing key in one organization's set, rotates signing keys with overlapping windows, and
  re-issues under a listed key before it revokes one.
- It issues attestations with a life of at most 24 hours; a short life (an hour) bounds how long an end it could not
  deliver still reads active.

## The organization's member list

`org-authority/1` (DEC-0129, CT-37) is an organization's signed list of admitted members: the source of its relay's
admission set (DEC-0047), as the estate record is the source of an estate's. An organization server drafts it; an
administrator signs it (Fabric ADR-0178 points 2 and 3).

**OL-1, the fields.** Every member is always present.

| Field | Rule |
|---|---|
| `type` | `org-authority/1` |
| `issuer`, `org` | the organization server that drafted it and the organization, as the organization's key set names them |
| `revision` | rises with every list an administrator signs |
| `issuedAt`, `expiresAt` | strict RFC 3339 instants with at most three fraction digits, `expiresAt` after `issuedAt` and at most 7 days after it (v4 §7, an organization's records) |
| `members` | 0 to 1024 `{subject, role, iss, keys}`: `subject` the member as `org-membership/1` names it to the relay's audience, pairwise and opaque; `role` `owner`, `admin` or `member`; `iss` the issuer of the member's tokens in this organization's context, as the member's estate pins it (DEC-0128); `keys` 1 to 8 `{kid, publicKey}`, the `<enrollment id>#sig` P-256 keys of the member's enrollments in the organization (UE-1). Each subject, each `iss` and each kid once across the list |
| `digest` | `sha256:` and the hex SHA-256 of the RFC 8785 form of the list without `digest` and `signature` (`orgAuthorityDigest`) |
| `signature` | a WebAuthn assertion, the estate record's shape, by an administrator's passkey |

No member names a person: the subject is pairwise, the issuer opaque, the keys an enrollment's. A role grants nothing
at the relay, which admits every listed member alike.

**OL-2, the signature.** An administrator's passkey that the applied key set lists in `administrators` signs the
register's `org-authority/1` challenge, `{type, digest}` ([signing challenges](conformance.md#signing-challenges),
DEC-0063), as a passkey signs an estate revision (DEC-0055). No server signs a list, the drafting server included. The administrator's Fabric shows the draft's changes against
the last signed list, whoever signed it: entries added and dropped, and their count. An entry is a pairwise subject, an
opaque issuer and an enrollment key, so an administrator can check that the changes match the joins and ends they
expect, not who each entry is; what OL-2 guarantees is that no server signs. Two admissions stay apart. The person's admission is the pin
their passkey signs (OM-2, R1-D12); no administrator takes part in it, and it decides the membership. The relay's
admission is this list: an administrator signs who the organization's relay delivers to (ADR-0178 point 2). A join an
administrator has not yet signed, or declines, leaves the membership as the attestation states it and only keeps the
member's enrollments off the organization's relay until a list names them.

**OL-3, the verifier.** `verifyOrgAuthority(list, {now, org, keySet, held})` answers `{ok: true, digest, revision,
signedBy, unchanged, held, members}` or one problem, in this order. `keySet` is the organization's set the reader applied
(`verifyOrgKeySet` under the root it pinned); `held` is `{revision, digest}` of the list it applied last. The caller
checks the list against the schema first, as a relay does an estate record:

| Row | Problem | When |
|---|---|---|
| OL-a | `context-invalid`, `no-clock` | the context is not an object; then `now` is not a readable time; then `org` is not an organization's context id, `keySet` not a well-formed set of `org`, or `held` not `{revision, digest}` |
| OL-b | `malformed`, `digest-mismatch` | not an object, another `type`, no `digest`, a revision that is no positive integer, `members` no array, a `signature` that is not a WebAuthn assertion with its five string members, or a value with no RFC 8785 form; then `digest` is not the list's |
| OL-c | `wrong-issuer`, `wrong-org` | `issuer` is not the key set's; `org` is not the reader's |
| OL-d | `unknown-administrator` | the signing credential is not among the key set's `administrators` |
| OL-e | the assertion's problem | `verifySigningAssertion` refuses it: `wrong-rp` under an RP ID that is not a signing RP, `wrong-origin`, `bad-signature` and the rest of WebAuthn Level 3 §7.2 |
| OL-f | `too-long-lived`, `not-yet-valid`, `expired` | the window is unreadable, empty or above 7 days; the clock is more than 60 s before `issuedAt`; the clock is at or after `expiresAt`, with no grace |
| OL-g | `rule-violation` | `FAC-SEM-150` holds a finding, named in `codes` |
| OL-h | `stale-revision`, `revision-conflict` | a revision below the held one; the held revision with another digest |

**OL-4, the relay.** An organization's relay pins the organization's root when it is set up for the organization, as an
estate's relay pins the estate's first passkeys, applies key sets under it, and admits from the list it holds:
`orgRelayAdmissionSet({held, candidate, org, keySet, at, schemaValid})` answers the set of listed `#sig` keys, kid to
SEC 1 octets, or a refusal. A refused candidate leaves the held list's set in force: a candidate that fails the schema
answers `invalid`, one that fails verification `unverified` with its problem, its window included. A refused held
list, or none, admits nobody (DEC-0047, fail closed): `expired` and `not-yet-valid` name only the held list's own
window, and a held list that cannot be read back (no positive revision, no RFC 8785 form) is refused
`held-invalid`, with or without a candidate, so a caller tells it from a refused candidate; without one the held list is verified again under the key set applied now, so a list past its
window, or one whose signer a later set dropped, admits nobody until a newer list verifies. Only the admission set is decided: what a member's `auth` signs in `estate` (never the member's estate id,
DEC-0128) and what an organization relay's `welcome` carries in place of the estate's revision, delta head and
heartbeat wait on the organization's own heartbeat and delta ([revocation delta](revocation-delta.md#not-decided-here)),
so no organization relay runs on this release (CT-37).

**OL-5, the duties.** The server drafts a new revision whenever a member joins, ends (OM-5) or changes an enrollment's
key, and well before `expiresAt`; an administrator signs it. Before it asks the root to sign a key set that drops an
administrator, it has another administrator sign a fresh list, so the relay's admission set does not empty. Ending a membership drops the member from the next list, so
the relay stops admitting their enrollments once that list is signed and applied, and within 7 days at the latest.

## The draft exchange

DEC-0131 (CT-156; the first organization server's request `1822d650`, thread `bd508780`) · schemas
[`org-key-set-draft`](../../schemas/org-key-set-draft.schema.json),
[`org-authority-draft`](../../schemas/org-authority-draft.schema.json),
[`org-root-registration`](../../schemas/org-root-registration.schema.json) · code
[`src/org-exchange.ts`](../../src/org-exchange.ts) · rule `FAC-SEM-151`

A server drafts each key set and each member list; the owner's Fabric signs a key set with the root (OM-3), an
administrator's Fabric signs a list with their passkey (OL-2). This is how a draft reaches the signer and the signature
comes back. Every route is under the issuer's origin, `{org}` being the organization's opaque id, the part of
`org:<orgId>` after `org:` (`ORG_EXCHANGE_PATHS`):

| Route | Answers |
|---|---|
| `GET /fabric/membership/v1/{org}/root` | `{org, issuer, root: {kid, x}}`, the root members pin (OM-2), once its first key set is accepted; `404 no-root` before |
| `POST /fabric/membership/v1/{org}/root` | registers the root and the owner's administrator credential before the first key set (OX-2) |
| `GET /fabric/membership/v1/{org}/key-set` | the last signed `org-key-set/1`; `404 no-signed-key-set` before the first |
| `GET /fabric/membership/v1/{org}/key-set/draft` | the pending `org-key-set-draft/1`; `404 no-draft` when none waits |
| `POST /fabric/membership/v1/{org}/key-set` | accepts a signed set as OX-3 says; `409 no-root` before a root is registered |
| `GET`, `POST /fabric/membership/v1/{org}/authority`, `GET .../authority/draft` | the same for `org-authority/1` and `org-authority-draft/1`, read only by the organization's administrators and its relay (OX-6) |

**OX-1, the draft.** `org-key-set-draft/1` is `{type, org, base, draft, digest}`: `draft` is the next `org-key-set/1`
without `sig`, every member the root signs, exactly; `base` is the last signed set's `{revision, digest}`, or `null`
before the first; `draft.revision` is one above `base` (1 with none); `digest` is SHA-256 of the root's signing input
over `draft` (`keySetDraftDigest`). `FAC-SEM-151` holds the envelope to that. A key-set draft holds public material only (the
signing keys' public halves, the administrators' public credentials, OM-7's owner and administrator rows), so the
key-set and root routes are read without a credential, and a draft is never served as a signed set. One draft waits at a time; a newer
draft replaces it before it is signed.

**OX-2, the root and the first key set.** The owner signs in to the server in a browser and creates the organization;
the server shows that signed-in page a **claim**: 32 random bytes, bound to that organization and that account, used
once, for at most 15 minutes (`MAX_CLAIM_SECONDS`). The claim is a bearer secret: the owner gives it to their Fabric
(a copy from that page is enough), and it never travels in a URL or a link, so never by an open link (DEC-0123 links
carry none). The owner's Fabric creates the root and a signing credential for this organization alone (OM-3) and
POSTs `org-root-registration/1` `{type, org, issuer, root: {kid, x}, administrator, claim}` to `.../root`. The server
checks it as `verifyRootRegistration` does: the shape, its organization and issuer (`422`), no first set accepted yet
(`409 root-registered`), a root not of small order and a usable administrator credential (`422`), and last the claim
(`403 claim-invalid`). The check never uses the claim up; on success the server uses it up and records the
registration in one transaction, and until the first set is accepted a newer registration replaces an older one. The
registration proves nothing about the root: the server then drafts revision 1 with its signing keys and that
administrator (OX-1), the owner's Fabric reads the draft, shows it (OM-3) and, once the owner confirms, POSTs the set
signed by the root to `.../key-set`, and the server accepts it as OX-3 says under the registered root. That signature is
the proof the sender holds the root; only then does the server serve the root and the set. A root whose first set is
accepted is registered for good; replacing it is a new organization root and every member's new pin (OM-3).

**OX-3, accepting a signed set.** The server accepts a POSTed `org-key-set/1` only when `acceptSignedKeySet` does: it
verifies under the registered root against the set held (`verifyOrgKeySet`), and the bytes the root signed have the
pending draft's `digest`; otherwise it answers `409 draft-mismatch`, or `409 no-draft`, or the verifier's problem
(`422`). The same revision and bytes as the set held answer `200` unchanged, never a second acceptance. A POST needs
no credential: only the root can make a set that passes.

**OX-4, readers meanwhile.** A server with no signed set answers the key-set route `404 no-signed-key-set` and issues no
attestation; a reader's membership stays unverifiable and so suspended (OM-6). While a newer draft waits, the server
keeps serving the last signed set and signing attestations only with keys it lists. It never signs an attestation
with a key no signed set lists.

**OX-5, rotation and a late signature.** The server drafts the next set at least 7 days before the newest signing
key's `notAfter` (`ROTATION_LEAD_SECONDS`), with the new key's window starting at once, so the overlap OM-8 asks for is
there when the owner signs. The owner's Fabric reads the draft route when it starts and at least daily, and shows a
pending draft to the owner. If no set is signed before the newest key's `notAfter`, the server can sign no attestation:
readers suspend (OM-6) until the owner's Fabric signs one; the server keeps serving the last signed set and never
extends a key's window itself.

**OX-6, member lists.** The same for `org-authority/1` (OL-5): `org-authority-draft/1` is `{type, org, base, draft,
digest}` with `draft` the list without `digest` and `signature` and `digest` its `orgAuthorityDigest`; an
administrator's Fabric reads `GET .../authority/draft`, shows the changes against the last signed list (OL-2) and
POSTs the signed list; the server accepts it only as `acceptSignedAuthority` does (it verifies under the applied key
set and is the draft). A relay reads the signed list from `GET .../authority`. A list names every member's pairwise
subject, role, `iss` and keys, so unlike a key set it is not public: the server answers the two authority GETs only to
a caller it authenticates as one of the organization's administrators or its relay, and `404` to anyone else; how it
authenticates them is the server's until CT-37 names the relay's registration. A POST still needs no credential: only
an administrator's passkey makes a list that passes.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-145"></a>`FAC-SEM-145` | `org-membership` | the times are strict RFC 3339 with at most three fraction digits and `issuedAt` ≤ `notBefore` < `expiresAt`, the life is at most 24 hours, and `membershipEndsAt` is `null` or such a time |
| <a id="fac-sem-146"></a>`FAC-SEM-146` | `org-key-set` | each kid once, the root's kid not among the keys, every key window strict and positive, no revoked kid among the keys, no key of small order, and at least one key valid at the set's `issuedAt`; each administrator's credential once, with a usable key of its algorithm (never of small order), under a signing RP with every origin within it (DEC-0129) |
| <a id="fac-sem-150"></a>`FAC-SEM-150` | `org-authority` | the window is two strict instants with at most three fraction digits, `expiresAt` after `issuedAt` and at most 7 days after it; at most 1024 members, each an object of 1 to 8 keys, each key an object; each subject, each `iss` and each kid once across the list; every kid a `#sig` kid and every key a P-256 point SEC 1 accepts (DEC-0129) |
| <a id="fac-sem-151"></a>`FAC-SEM-151` | `org-key-set-draft`, `org-authority-draft` | a draft envelope's `digest` is its draft's (what its signer signs), its draft names the envelope's organization, and its revision is one above its base's (1 with none) (DEC-0131) |
| <a id="fac-sem-147"></a>`FAC-SEM-147` | `estate-record` | each organization pinned once by its context, and no pinned root of small order; each context issuer once and its opaque part never containing an estate id of eight characters or more (DEC-0128) |

## Who adopts it

- **Every organization server** (MD-9 path (a)) issues attestations: a root per organization that signs key sets only
  (held by the owner's Fabric since DEC-0129), signing keys online, a life of at most 24 hours, every duty of OM-8, and runs `fixtures/vectors/org-membership.json`.
  The first organization server is one of them; its own extensions go under its own domain.
- **Fabric** pins an organization's root in the estate record at the person's join (OM-2), applies key sets with
  `verifyOrgKeySet`, verifies attestations with `verifyOrgMembership` before it trusts a membership, keeps the held
  record per subject, and acts on OM-5, OM-6 and OM-7. It writes `organizations` only once every reader is pinned at or
  after DEC-0128 and the node is measured ending an enrollment on the unpinning revision (CT-137).
- **Project Observatory's node** ends an enrollment on a membership's end as on `organization-closed` (OM-5): it learns
  of the end from an estate revision that no longer pins the organization, which Fabric writes on every end (OM-5),
  and from `organization-closed`; a revoked certificate alone keeps its DEC-0103 meaning. Until every reader is pinned
  at or after DEC-0128 no revision carries `organizations`, so a node ends an enrollment as DEC-0103 and its own
  adoption already do.
- **Every organization server** also drafts the organization's member list (OL-5) and lists the administrators'
  passkeys in its key sets, which the root signs; it signs no list itself.
- **The organization owner's Fabric** holds the membership root and signs each key set the server drafts, only after
  the owner confirms its changes (OM-3, DEC-0129).
- **An administrator's Fabric** (or a pinned page) registers a signing credential for that organization alone (never
  an estate authority, never another organization's), shows a drafted list's changes against the last signed list, and
  signs it with that passkey (OM-3, OL-2). The owner's Fabric registers such a credential for the first key set.
- **An organization's relay** admits only from a list `orgRelayAdmissionSet` accepts (OL-4).
- **A product** that reads membership (an open product of the organization train) verifies the same way under the same
  pin, with its own audience.

## Privacy

An attestation names an organization's opaque id, a reader, an opaque subject pairwise to that reader, a role and
times. Two readers of one person's membership see two subjects, and an attestation adds no link between organizations:
each is one organization's, for one audience. What still links one machine across organizations until CT-122 is in
[contexts](contexts.md#linkability). The estate record's `organizations` lists the person's
organizations to the person's own machines; the relay operator reads it today as it reads `org:<orgId>` in share
grants, until per-context relay sessions (CT-122's question 3).

The draft exchange (DEC-0131) serves an organization's root, key sets and key-set drafts to anyone: they name the
organization's opaque id, its signing keys and its administrators' public credentials, one credential per
organization, so they add no link between organizations, but anyone can count the administrators and see when a set
changes. The member list and its draft name every member and are served only to the organization's administrators and
its relay (OX-6).

## Not decided here

- Losing the root: the owner's Fabric holds it, so its loss means a new pin by every member (OM-3), and every key set
  waits on that Fabric being reachable; a recovery of the root, as DEC-0107 recovers a passkey, is not decided.
- How the person's Fabric sends the context's `iss` to the server for its entry (OM-7's row allows it; no message
  carries it yet), and how a relay is registered as an attestation audience for the subject OL-1 names (CT-37).
- What a "reference" in the adaptation plan's OM-7 row is: its form must name nothing of the person's estate (DEC-0128);
  TP-03 defines it with Fabric.
- The organization relay's handshake (OL-4): `auth.estate` and the `welcome` frame on an organization's relay (CT-37).
- Whether a reader checks an attestation's `role` or `status` against the latest signed member list; until then the
  list's role grants nothing anywhere but its own document.
- Beyond the member list (DEC-0129): a quorum or a delay of administrators' signatures (Fabric ADR-0178 D8-c, R2); the
  `org-countersign/1` verifier; the organization's heartbeat and revocation delta; organization windows; members'
  allowances; a passkey root that signs key sets itself.
- A push of a pending draft to the owner's or an administrator's Fabric (beside OX-5's reading of the route).
- What the hub answers a caller it refuses to mint for in a suspended or ended organization's context (OM-5, OM-6):
  the hub's refusal code, Fabric's to state beside DL-4.
- How attestations reach a reader (a push, a fetch) and how a reader authenticates to the issuer to fetch one: the
  issuer's and the reader's, beside OM-7's refresh row, which bounds what that exchange carries about the person.
- A faster end than expiry (an organization's revocation delta with a `member` kind): additive, when a reader needs it.
- What each role may do in a reader: the reader's. An administrator's signature to release a project from an
  organization (MC-13) is not an attestation: Fabric ADR-0178 point 7 places it in Fabric, and how a member's estate
  verifies an administrator's passkey over its revision, which today admits its own passkeys only, is not decided here.
- Attestation formats that carry a hardware identifier (OQ-0010).
