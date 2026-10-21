# The estate record — `estate-record/1`

DEC-0055, amended by DEC-0082 ([contexts](contexts.md)), DEC-0084 ([ceremonies](ceremonies.md)) and DEC-0090
([the partner channel](partner-channel.md)) · rule codes `FAC-SEM-072`…`FAC-SEM-076`, `FAC-SEM-111`, `FAC-SEM-122` (and `FAC-SEM-110`, [contexts](contexts.md#semantic-rules); `FAC-SEM-114`,
[ceremonies](ceremonies.md#semantic-rules)) · schema
[`estate-record`](../../schemas/estate-record.schema.json) · code
[`src/estate-record-rules.ts`](../../src/estate-record-rules.ts), [`src/webauthn.ts`](../../src/webauthn.ts) · vectors
[`fixtures/vectors/estate-record.json`](../../fixtures/vectors/estate-record.json)

An **estate** is one person's authority: their passkeys, their machines, the hubs on them, their grants. The **estate
record** is its signed state, one revision at a time. It lists the passkeys that sign the next revision, the machines
with their device keys and a certificate of each machine's hub key, the packages placed on each machine in each context
(DEC-0082), where each secret slot is filled from, the share grants and every revocation. Fabric's hub drafts a revision; the person's passkey
signs it; every machine of the estate applies the latest revision it can verify and reports its number, and optionally
its digest, in its check-in (`records.estateRecord`, [devices](devices.md#check-in), DEC-0053, DEC-0056).

Sources: the first organization server's target architecture v4 (commit `9c6a780`) — §2 rule 6 (three signed records)
and rule 12 (algorithms by role), §3 (the nouns *Passkey*, *Estate*, *Machine*, *Device key*, *Signing key*, *Estate
record*), §6 Path 2 (my machines), Path 6 (change and move are new revisions) and Path 7 (a share grant signed into the
record), §7 (keys, the signing surface, the estate authority, freshness), §12's row, §15 D3, D4 and §19 (Fabric's
answer on the hub's key); WebAuthn Level 3 and
the RFCs named below, pinned in the [source ledger](../evidence/sources.md). Each module's part of v4 is a proposal to its
owner; this repository's owner accepted §12's contract set into the board run's wave 3.

## Fields

| Field | Rule |
|---|---|
| `schema` | `estate-record/1` |
| `estate` | the estate's opaque id, the same in every revision; never a person's name or address |
| `revision` | 1, then the parent's plus one ([revisions](#revisions)) |
| `parent` | the parent revision's `digest`; absent exactly in revision 1 (schema) |
| `issuedAt`, `validUntil` | the validity window: positive and at most 30 days ([freshness](#freshness)) |
| `authorities[]` | the passkeys that may sign the next revision ([authorities](#authorities)) |
| `machines[]` | each machine: `id`, `deviceKeys`, `hubKey`, `packages[]` (each in a context), `secrets[]` ([machines](#machines)) |
| `publisherKeys[]` | the publisher keys the estate's machines pin, as public Ed25519 JWKs naming their `alg` |
| `publisherScopes[]` | optional: a partner's publisher key scoped to the organization contexts it is trusted in, `{kid, partner, contexts}` ([the partner channel](partner-channel.md#a-partners-publisher-key-trusted-per-context-fac-sem-122), DEC-0090) |
| `shareGrants[]` | standing grants to principals outside the estate ([share grants](#share-grants)) |
| `revocations[]` | every revocation of the estate so far ([revocations](#revocations)) |
| `digest` | the [digest](#the-digest) |
| `signature` | the passkey assertion ([the signature](#the-signature)) |
| `extensions` | namespaced extensions, inside the digest |

## Revisions

A revision is a whole record, not a delta. Revision 1 has no `parent`; every later revision names its parent's digest
and has the parent's number plus one, so a machine that holds revision *n* accepts only *n* + 1 as the next and can tell
a skipped or replayed revision (`FAC-SEM-072`, kind `estate-record-revision`, `{parent, next}`). A revision continues its
parent's `estate`, is never issued before it, and keeps every revocation the parent carries. Adding or removing a
machine, placing or moving an agent, placing a secret, granting a share and revoking anything is each a new revision
(v4 §6, §7); moving an agent keeps its `agentRef` (DEC-0050). What a revision drops it revokes in the same revision: a
removed machine, a replaced device key, a hub key no longer certified as it was (`FAC-SEM-114`, DEC-0084); the
ceremonies that make these revisions are [ceremonies](ceremonies.md)'s.

### The digest

`digest` is `sha256:` and the hex SHA-256 of the UTF-8 RFC 8785 form ([canonical forms](conformance.md#canonical-forms),
DEC-0043) of the record without `digest` and `signature` (`estateRecordDigest`). The signature stays outside, so the
digest is what the passkey signs.

### Freshness

A record is valid from `issuedAt` to `validUntil`, at most 30 days later (v4 §7, Freshness: "the estate record 30"); a
verifier admits it from 60 s before `issuedAt` — the clock skew every relay time allows (`CLOCK_SKEW_SECONDS`,
DEC-0066), so a revision issued a moment ahead of the verifier's clock is not refused — and refuses it before that or
after `validUntil`, and the hub drafts a fresh revision before the window ends. The relay serves the
latest revision and online machines fetch it hourly (v4 §7); how a revision travels is the relay protocol's ([DEC-0047](relay.md)).

## Authorities

Each authority is a passkey: its WebAuthn `credentialId`, its `alg` (`ES256`, COSE −7, or `EdDSA`, COSE −8 with
Ed25519), its public key as a public JWK, the `rpId` of the dedicated signing credential (v4 §7: `sign.<domain>`, never
the sign-in credential) and the pinned `origins` a ceremony may run in. Revision 1 is verified under a passkey the
machine pinned when it was enrolled (v4 Path 2 step 1; how a machine pins it, and the estate fingerprint a person
compares, are [ceremonies](ceremonies.md)'s, DEC-0084);
every later revision under a passkey its parent lists, so a new passkey is added by a revision an existing one signs.
A P-256 key is valid by SEC 1 §3.2.2 (`isValidP256Key`), an Ed25519 key is not of small order (`isSmallOrderKey`,
DEC-0045), and each passkey is listed once (`FAC-SEM-073`). Each is a signing credential: its `rpId` is `sign.<domain>`
(the schema) and each pinned origin is on that RP ID or a host under it (`FAC-SEM-092`, [signing](signing.md),
DEC-0063). No user handle is recorded.

## Machines

A machine is a device enrolled in the estate, by its device `id` (DEC-0031) and never by a human name. This departs from
v4 §3, whose *Machine* has a human name ("GPU box"): the name a person sees is the node's and Project Observatory's,
kept outside the signed record, so the record carries no label a person chose:

- **`deviceKeys`** — DEC-0053's device keys by role: exactly one `<id>#sig` (ES256 or Ed25519) and at most one
  `<id>#kem` (ECDH over P-256), each named for this machine, valid for its algorithm and never one key in both roles
  (`FAC-SEM-073`), the counts `FAC-SEM-044` also checks at enrollment (DEC-0056). The sending machine seals a secret to
  the `#kem` key and the relay carries it ([DEC-0047](relay.md#the-secret-envelope)).
- **`hubKey`** — the certificate of the hub's `kid` on this machine: the passkey-signed record binds this `kid` and
  public key to this machine. In a personal estate the hub runs on the always-on machine under an Ed25519 key of its
  own, never the machine's `#sig` key (the operator's NET-3, DEC-0084, [ceremonies](ceremonies.md#who-holds-which-key)). It has the shape of a key in the estate's key set (`delegation-jwks`, DEC-0039) and names
  its `alg`; one `kid` per machine (v4 §3), never certified for two machines, never of small order (`FAC-SEM-073`). A
  delegation verifier that reads the estate record trusts a token's `kid` only while the revision it reads certifies
  it — a revision `verifyEstateRecord` accepted, not lower than the highest its machine applied (DL-14) — and refuses otherwise with the codes of
  [DL-14](delegation.md#keys-publication-and-rotation) (`hubKeyCertified`, `FAC-SEM-081`, DEC-0060).
- **`packages[]`** — the agent instances placed on this machine: `agentRef` (DEC-0050), the placed version's package
  `digest`, the `publisherKid` of the key in `publisherKeys` its publisher signature verifies under, and the instance's
  [context](contexts.md) (DEC-0082): `context`, absent meaning `personal`, and for an organization's instance the
  `grant` it runs under. An agent is placed once per machine and context under a pinned key (`FAC-SEM-074`), so one agent
  runs on one machine as the person's own instance and as a separate instance in each organization it is shared into. An
  instance in `org:<orgId>` names in `grant` the id of a share grant of this record, matched by normal form (DEC-0076),
  whose `context` is the placement's as written, and which the record does not revoke; a personal instance names no
  grant (`FAC-SEM-111`). `placementTrust(record, machine, agentRef, context)` is the `trust` the node hands
  `verifyPackage` (DEC-0051), `context` defaulting to `personal`; a partner's key scoped away from `context` gives no
  publisher key (DEC-0090); kind `estate-placement`
  (`{record, machine, package, context?}`, `context` defaulting to `personal`) checks that the package is the one placed
  in that context — its own digest, the placement's `agentRef` and digest (`FAC-SEM-074`) — and that an organization's
  instance names its grant (`FAC-SEM-111`).
- **`secrets[]`** — secret placements, by reference only: `{agentRef, slot, from, context?}` names a slot of the
  instance of a package placed on this machine in `context` (absent meaning `personal`, DEC-0082) and the machine of this
  estate whose vault holds it. No member can hold a value (schema, DEC-0013); none of the four is shaped like a credential
  (`src/secret-shape.ts`); the agent is placed here in that context; `from` is a machine of the record, and for an
  organization's instance this machine itself, since a secret envelope names no context and fills only a personal slot
  ([contexts](contexts.md#one-instance-per-context-on-a-machine)); a slot is placed once per (machine, agent, slot,
  context) (`FAC-SEM-075`); and the package declares the slot (`FAC-SEM-075`, kind
  `estate-placement`). The value travels sealed to this machine's `#kem` key (v4 Path 2 step 3), never in the record.

## Share grants

A share grant is DEC-0039's standing grant (`governance.schema.json#/$defs/grant`) with `principalKind: external` and
an `audience`: a person or organization outside the estate may call one agent, the owner paying (DEC-0037, DEC-0038).
Signed once into the record, it does not depend on the owner's laptop being awake (v4 Path 7). Each grant's id is listed
once (`FAC-SEM-076`); a grant's id is a URI, so two spellings with one normal form are one grant
([identifiers](identifiers.md), DEC-0076). A share grant into an organization carries that organization's
[context](contexts.md#the-grants-context), `org:<orgId>`, and is never `personal` (`FAC-SEM-110`, DEC-0082); the
organization's instance of the agent names it (`FAC-SEM-111`). Its `meta.id` is a **share grant id**,
`urn:fabric:share:` and 32 lower-case hex digits from a CSPRNG, never derived from a name, an address, an estate id, an
`agentRef` or the organization; its window carries at most three fraction digits; and it keeps its `agentRef` across
revisions, even after a revision that placed it nowhere, so moving the share revokes the grant and mints a new id
(`FAC-SEM-117` given the latest earlier revision that placed it, DEC-0086,
[share registration](share-registration.md#the-share-grant-id)). Fabric runs `FAC-SEM-117` before the passkey signs; it is
not part of `verifyEstateRecord`, so a naming fault never locks an estate out of its record. Its access level is its own `capabilities`,
`effectCeiling`, `dataClasses`, `spend` and `expiresAt`: two share grants of one agent into two organizations with
different values are two access levels ([access levels](contexts.md#access-levels)).

## Revocations

Each revocation names its `kind` — `authority`, `machine`, `device-key`, `hub-key`, `publisher-key`, `package` (a
digest) or `grant` (a grant's `meta.id`) — its `ref` in that kind's own form and `revokedAt`. A revision keeps every
revocation before it (`FAC-SEM-072`), lists each once, and lists nothing it revokes: revocation outranks addition (v4 §7;
`FAC-SEM-076`). A `grant` revocation matches the grant by the normal form of its id, in the record and in `isRevoked`
(`src/revocation-delta.ts`), so another spelling of a revoked grant is revoked; every other kind's `ref` matches exactly
(DEC-0076). A `device-key` revocation's `ref` is a kid, which revokes every key ever listed under it, or one key's own
reference `<kid>@sha256:<hex>` (`deviceKeyRef`, DEC-0084), which revokes that key alone: the form a key replacement
revokes the old key by, since a kid outlives its keys ([ceremonies](ceremonies.md#replace-a-machines-key)). A solo
estate has no DEC-0031 certificate to revoke, so the record's revocation and its delta entry are the whole removal of a
machine; where an organization server issued one, that server revokes it when the organization removes the machine
(DEC-0084, [ceremonies](ceremonies.md#remove-a-machine)). The fast
revocation delta that reaches machines within seconds is DEC-0054's ([revocation delta](revocation-delta.md)), carried by the relay (v4 §7, [DEC-0047](relay.md#revocation-and-heartbeat)); the record is its
durable state: a revision issued at or after a delta entry lists its revocation, or a machine holding the entry refuses
it (`FAC-SEM-084`), and every check that reads the record's revocations reads the applied entries' too.

## The signature

The signature is a passkey assertion: a WebAuthn assertion response (W3C Web Authentication Level 3, Recommendation of
25 August 2026, <https://www.w3.org/TR/2026/REC-webauthn-3-20260825/>) recorded as `format: "webauthn-assertion"`,
`credentialId`, `alg`, `authenticatorData`, `clientDataJSON` and `sig`, each base64url, without the user handle.

**The challenge** the signer passes to `navigator.credentials.get()` is SHA-256 of the UTF-8 RFC 8785 form of
`{"type": "estate-revision/1", "digest": <digest>}` (`estateChallenge`, v4 §7's signing challenge type
`estate-revision/1`). The type is inside, so an assertion over an estate revision is no other passkey signature over
the same 32 bytes. The register of signed statements owns the type and adopts these fields unchanged
([signing challenges](conformance.md#signing-challenges), DEC-0063).

### What is verified offline

`verifyEstateRecord(record, {parent | authorities, at})` checks, with no network, in the order of the table below, the
steps of WebAuthn Level 3 §7.2 that bind an assertion to this record:

- `clientDataJSON` is UTF-8 JSON (a byte order mark stripped) whose `type` is `webauthn.get`, whose `challenge` is the
  base64url of `estateChallenge(digest)`, whose `origin` is one the authority pins, with no `crossOrigin: true` and no
  `topOrigin` — the ceremony runs top-level (v4 §7);
- `authenticatorData` is at least 37 bytes, its `rpIdHash` is SHA-256 of the authority's `rpId`, the UP and UV flags are
  set (v4 §3: user verification required), AT is not set (§6.1) and BS is not set without BE (§7.2);
- `sig` verifies over `authenticatorData ‖ SHA-256(clientDataJSON)` under the authority's public key in its `alg`: an
  ASN.1 DER `Ecdsa-Sig-Value` for ES256 (§6.5.5, RFC 3279 §2.2.3), the 64-byte Ed25519 signature for EdDSA (RFC 8032);
- the revision follows its parent: the same estate, the next number, the parent's digest, not issued before it, every
  revocation of the parent kept (`FAC-SEM-072` holds here too, so a passkey cannot quietly un-revoke a machine);
- the authority is one the verifier trusts: its parent's and not revoked by the parent, or for revision 1 the one it
  pinned. A revision may revoke its own signer when it removes it (a passkey rotated out signs its own removal);
- the record keeps its own rules, `FAC-SEM-072`…`FAC-SEM-076`, `FAC-SEM-110`, `FAC-SEM-111` (DEC-0082) and `FAC-SEM-122`
  (DEC-0090), and with a
  parent `FAC-SEM-114`: what it drops from the parent it revokes (DEC-0084). The schema is not checked here: a machine applies a
  revision only when it is valid against [`estate-record`](../../schemas/estate-record.schema.json) and
  `verifyEstateRecord` accepts it — a signed record of the wrong shape (say `authorities: null`) would otherwise lock
  the estate out at the next revision.

### What is not verified

- **Attestation:** an assertion carries none; how the passkey was created is not checked.
- **The authenticator's provenance:** no AAGUID allow-list and no device binding. A personal estate may use a synced
  passkey (v4 §7), so BE and BS are read only for consistency. Device-bound credentials for administrators are
  `org-authority/1`'s.
- **The signature counter:** `verifyEstateRecord` returns `signCount` but checks no monotonicity, since a synced
  passkey's counter is often 0 and machines share no counter.
- **Extension outputs** are ignored.
- **The pinning itself:** the verifier trusts the authorities it is given; how a machine comes to pin revision 1's
  passkey — its own ceremony, a comparison code that binds the estate's `genesis`, or an enroll token's — is
  [ceremonies](ceremonies.md)'s (DEC-0084).
- **Recovery:** a printed code whose revision takes effect after 72 hours (v4 §7) is not decided here.

### The verifier

| Row | Problem | When |
|---|---|---|
| ER-1 | `malformed` | the record is not an object, its `digest` is not a string, its `revision` is not an integer, it has no RFC 8785 form, the signature is not a `webauthn-assertion` with string base64url fields under the authority's credential id, `clientDataJSON` is not UTF-8 JSON naming an object, or `authenticatorData` is shorter than 37 bytes |
| ER-2 | `digest-mismatch` | the recomputed digest is not `digest` |
| ER-3 | `broken-chain` | with a parent: another estate, not the parent's revision plus one, `parent` not the parent's digest, issued before the parent, or a revocation of the parent's left out; without one: a revision other than 1, or revision 1 naming a parent |
| ER-4 | `no-trusted-authority`, `unknown-authority`, `duplicate-authority`, `revoked-authority` | the verifier trusts no passkey, not the signing one, lists it twice, or the parent revokes it |
| ER-5 | `unknown-algorithm`, `key-algorithm-mismatch` | `alg` is not ES256 or EdDSA, or not the passkey's `alg` |
| ER-6 | `unusable-key`, `small-order-key` | the passkey's key is not a public P-256 point valid by SEC 1 §3.2.2 or a public Ed25519 key, or is of small order (DEC-0045) |
| ER-7 | `wrong-type`, `wrong-challenge`, `wrong-origin`, `cross-origin` | the client data's `type`, `challenge` or `origin` — an origin the authority does not pin, or one it pins outside its RP ID (DEC-0063) — or a cross-origin frame |
| ER-8 | `wrong-rp`, `bad-flags`, `no-user-presence`, `no-user-verification` | the authority's RP ID is not a signing RP, `sign.<domain>` (DEC-0063: checked as soon as ER-4 has chosen the authority, before any check of the assertion); the `rpIdHash`; AT set or BS without BE; UP clear; UV clear |
| ER-9 | `bad-signature` | the signature does not verify |
| ER-10 | `no-clock`, `too-long-lived`, `not-yet-valid`, `expired` | the verifier's clock is not a readable time (checked first, so no window comparison runs on NaN); `issuedAt` or `validUntil` is not an RFC 3339 date-time with `T`, an offset and a day that exists (stricter than the schema's `date-time`: a leap second `:60` and a space separator are refused too), or the window is not positive or exceeds 30 days; or the clock is more than 60 s before `issuedAt` (`CLOCK_SKEW_SECONDS`, DEC-0066) or after `validUntil` (both instants are inside the window) |
| ER-11 | `rule-violation` | the record breaks `FAC-SEM-072`…`FAC-SEM-076`, `FAC-SEM-110`, `FAC-SEM-111` or `FAC-SEM-122` (DEC-0090), or, with a parent, `FAC-SEM-114` (DEC-0084); the verdict names the codes |

The vectors hold one case or more per problem, the EdDSA test passkey's seed (Ed25519 is deterministic, so a port's
signer reproduces its signatures), the ES256 test passkey (ECDSA signatures are randomized, so a port verifies rather
than reproduces them), the digest's canonical form, the challenge's input, and an assertion forged under the all-zero
Ed25519 key with no private key, refused as `small-order-key` before any verification.

## Algorithms

Passkeys are P-256 (v4 rule 12), and WebAuthn Level 3 recommends ES256 and EdDSA; this version admits both, each named
in a field, and refuses any other (RS256 among them). The hub key and the publisher keys are Ed25519 (`EdDSA`) until
Fabric records its decision D2 (ES256 beside EdDSA, ADR-0144), when ES256 joins them as an additive change. The device
keys are DEC-0053's.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-072"></a>`FAC-SEM-072` | `estate-record`, `estate-record-revision` | a revision is whole and follows its parent: its `digest` is its own, its window is positive and at most 30 days; across `{parent, next}`, the same estate, the next number, the parent's digest, not issued before the parent, every parent revocation kept |
| <a id="fac-sem-073"></a>`FAC-SEM-073` | `estate-record` | every key is usable: exactly one `<id>#sig` and at most one `#kem` per machine, each named for its machine, its `publicKey` in canonical padded base64 (a key with no `deviceKeyFingerprint`, DEC-0084), valid for its algorithm and in one role; machine ids and hub kids once; no hub key of small order; each passkey's key valid and listed once |
| <a id="fac-sem-074"></a>`FAC-SEM-074` | `estate-record`, `estate-placement` | an agent is placed once per machine and context (absent: `personal`, DEC-0082) under a publisher key the record pins, each pinned once; an installed package is the one placed in its context — its own digest, the placement's `agentRef` and digest, on a machine of the record |
| <a id="fac-sem-075"></a>`FAC-SEM-075` | `estate-record`, `estate-placement` | a secret placement is a reference: nothing shaped like a credential, an agent placed on that machine in the secret's context, a source machine of the record — its own machine for an organization's instance — a slot once per (machine, agent, slot, context) (DEC-0082), and a slot the placed package declares |
| <a id="fac-sem-076"></a>`FAC-SEM-076` | `estate-record` | share grants are to external principals, each listed once; each revocation once; nothing listed that the record revokes — a grant's id and a `grant` revocation's ref compared by normal form (DEC-0076), a `device-key` revocation's ref as a kid or a key reference `<kid>@sha256:<hex>`, and a ref that holds `@` refused unless it is a key reference (DEC-0084) |
| <a id="fac-sem-122"></a>`FAC-SEM-122` | `estate-record`, `estate-placement` | a partner's publisher key is scoped once, to a key the record pins, and a placement under it is in one of the organization contexts its scope names, never `personal` or another; a placement out of scope trusts no publisher key ([the partner channel](partner-channel.md), DEC-0090) |
| <a id="fac-sem-111"></a>`FAC-SEM-111` | `estate-record`, `estate-placement` | a placement whose context is not `personal` names in `grant` a share grant of the same record, matched by normal form (DEC-0076), whose `context` equals the placement's as written and is an `org:<orgId>` (a malformed context fails closed), and which the record does not revoke; a personal placement (no context, or `personal`) names no grant (DEC-0082). It reads revisions only: a revocation delta stops the grant's calls at the hub and the meter at once, and this rule refuses the instance from the next revision |

## Who adopts it

- **Fabric** drafts revisions in the hub, renders the card, runs the signing ceremony in the person's Fabric or a
  pinned static page (v4 §7), and certifies each machine's hub key before the hub signs with it; its delegation verifier
  trusts a `kid` only as [DL-14](delegation.md#keys-publication-and-rotation) says (DEC-0060).
- **Project Observatory's node** applies a revision only when it is schema-valid and `verifyEstateRecord` accepts it
  (the chain, a passkey the parent lists and does not revoke, the window and `FAC-SEM-072`…`FAC-SEM-076`, `FAC-SEM-110`, `FAC-SEM-111` and `FAC-SEM-122`) and it is
  reconciled with the revocation-delta entries the node holds (`reconcileRevision`, DEC-0054); installs a
  package only when `verifyPackage` accepts it under `placementTrust`'s key and the `estate-placement` rule finds it
  is the one placed (its digest and `agentRef`: `verifyPackage` alone accepts any version signed under that key), each
  instance in its own context and an organization's under its grant (DEC-0082); fills only placed slots; and reports the applied revision in its check-in's
  `records.estateRecord.revision` (DEC-0053) with its `digest` beside it (DEC-0056). As a delegation callee it reads the
  revision it applied, never an older one, and trusts a token's `kid` as DL-14 says (DEC-0060).
- **The relay** serves the latest revision by digest ([DEC-0047](relay.md#blobs)); it never decides trust.

## Privacy

The record describes an estate's keys, machines, placements and grants. It has no field that assesses a person (J10,
the organization edition's open/private split): machines are named by device id, not by a human name (the schema
refuses `name`); no WebAuthn user handle is recorded; a share grant names its principal because it authorizes them, and
records no use. A credential's id is an opaque handle.

## Not decided here

- Fabric's decision D3 is settled for the personal estate by the operator's NET-3 (2026-10-15, DEC-0084): the passkey
  signs every revision, the hub holds a private key of its own — an Ed25519 hub key certified as `hubKey`, not the
  machine's `#sig` key — and every machine keeps its own device keys. The hub key stays Ed25519 until Fabric's D2. The
  estate's fingerprint and the enrollment ceremonies are [ceremonies](ceremonies.md)'s. An organization's keys (Fabric
  D8, CX-CON-06) stay open.
- A fork: two revisions with one number from one parent, signed by two listed passkeys. A machine accepts only the one
  whose `parent` is the digest it holds, and its check-in may report that revision's `digest` beside the number
  (`records.estateRecord.digest`, DEC-0056), so a receiver tells the two apart; what a receiver does on seeing a fork is
  not decided here.
- The ceiling within which a later version of a placed agent installs without a new revision (v4 Path 2 places an agent
  by its `agentRef`, publisher key and ceiling): until Fabric's ADR-0138 amendment (D2b) and the listing contract
  define a ceiling, every new version is a new revision.
- Recovery by a printed code, and `ES256` for hub and publisher keys (Fabric's D2). The signing-challenge types and the
  signing RP are DEC-0063's ([signing](signing.md)); the estate's windows are divided by window leases signed by a
  certified hub key (DEC-0062, [window lease](window-lease.md)), and no field of this record carries a static split
  per machine.
