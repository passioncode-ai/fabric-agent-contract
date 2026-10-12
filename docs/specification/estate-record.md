# The estate record — `estate-record/1`

DEC-0055 · rule codes `FAC-SEM-072`…`FAC-SEM-076` · schema
[`estate-record`](../../schemas/estate-record.schema.json) · code
[`src/estate-record-rules.ts`](../../src/estate-record-rules.ts), [`src/webauthn.ts`](../../src/webauthn.ts) · vectors
[`fixtures/vectors/estate-record.json`](../../fixtures/vectors/estate-record.json)

An **estate** is one person's authority: their passkeys, their machines, the hubs on them, their grants. The **estate
record** is its signed state, one revision at a time. It lists the passkeys that sign the next revision, the machines
with their device keys and a certificate of each machine's hub key, the packages placed on each machine, where each
secret slot is filled from, the share grants and every revocation. Fabric's hub drafts a revision; the person's passkey
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
| `machines[]` | each machine: `id`, `deviceKeys`, `hubKey`, `packages[]`, `secrets[]` ([machines](#machines)) |
| `publisherKeys[]` | the publisher keys the estate's machines pin, as public Ed25519 JWKs naming their `alg` |
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
(v4 §6, §7); moving an agent keeps its `agentRef` (DEC-0050).

### The digest

`digest` is `sha256:` and the hex SHA-256 of the UTF-8 RFC 8785 form ([canonical forms](conformance.md#canonical-forms),
DEC-0043) of the record without `digest` and `signature` (`estateRecordDigest`). The signature stays outside, so the
digest is what the passkey signs.

### Freshness

A record is valid from `issuedAt` to `validUntil`, at most 30 days later (v4 §7, Freshness: "the estate record 30"); a
verifier refuses it before or after, and the hub drafts a fresh revision before the window ends. The relay serves the
latest revision and online machines fetch it hourly (v4 §7); how a revision travels is the relay protocol's ([DEC-0047](relay.md)).

## Authorities

Each authority is a passkey: its WebAuthn `credentialId`, its `alg` (`ES256`, COSE −7, or `EdDSA`, COSE −8 with
Ed25519), its public key as a public JWK, the `rpId` of the dedicated signing credential (v4 §7: `sign.<domain>`, never
the sign-in credential) and the pinned `origins` a ceremony may run in. Revision 1 is verified under a passkey the
machine pinned when it was enrolled (v4 Path 2 step 1: the person confirms the estate's fingerprint on the machine);
every later revision under a passkey its parent lists, so a new passkey is added by a revision an existing one signs.
A P-256 key is valid by SEC 1 §3.2.2 (`isValidP256Key`), an Ed25519 key is not of small order (`isSmallOrderKey`,
DEC-0045), and each passkey is listed once (`FAC-SEM-073`). No user handle is recorded.

## Machines

A machine is a device enrolled in the estate, by its device `id` (DEC-0031) and never by a human name. This departs from
v4 §3, whose *Machine* has a human name ("GPU box"): the name a person sees is the node's and Project Observatory's,
kept outside the signed record, so the record carries no label a person chose:

- **`deviceKeys`** — DEC-0053's device keys by role: exactly one `<id>#sig` (ES256 or Ed25519) and at most one
  `<id>#kem` (ECDH over P-256), each named for this machine, valid for its algorithm and never one key in both roles
  (`FAC-SEM-073`), the counts `FAC-SEM-044` also checks at enrollment (DEC-0056). The sending machine seals a secret to
  the `#kem` key and the relay carries it ([DEC-0047](relay.md#the-secret-envelope)).
- **`hubKey`** — the certificate of the hub's `kid` on this machine: the passkey-signed record binds this `kid` and
  public key to this machine. It has the shape of a key in the estate's key set (`delegation-jwks`, DEC-0039) and names
  its `alg`; one `kid` per machine (v4 §3), never certified for two machines, never of small order (`FAC-SEM-073`). A
  delegation verifier that reads the estate record trusts a token's `kid` only while the revision it reads certifies
  it — a revision it verified and the highest its machine applied — and refuses otherwise with the codes of
  [DL-14](delegation.md#keys-publication-and-rotation) (`hubKeyCertified`, `FAC-SEM-081`, DEC-0060).
- **`packages[]`** — the agents placed on this machine: `agentRef` (DEC-0050), the placed version's package `digest`
  and the `publisherKid` of the key in `publisherKeys` its publisher signature verifies under. An agent is placed once
  per machine under a pinned key (`FAC-SEM-074`). `placementTrust(record, machine, agentRef)` is the `trust` the node
  hands `verifyPackage` (DEC-0051); `FAC-SEM-074`'s kind `estate-placement` (`{record, machine, package}`) checks that
  the package is the one placed — its own digest, the placement's `agentRef` and digest.
- **`secrets[]`** — secret placements, by reference only: `{agentRef, slot, from}` names a slot of a package placed on
  this machine and the machine of this estate whose vault holds it. No member can hold a value (schema, DEC-0013); none
  of the three is shaped like a credential (`src/secret-shape.ts`); the agent is placed here; `from` is a machine of the
  record; a slot is placed once per agent (`FAC-SEM-075`); and the package declares the slot (`FAC-SEM-075`, kind
  `estate-placement`). The value travels sealed to this machine's `#kem` key (v4 Path 2 step 3), never in the record.

## Share grants

A share grant is DEC-0039's standing grant (`governance.schema.json#/$defs/grant`) with `principalKind: external` and
an `audience`: a person or organization outside the estate may call one agent, the owner paying (DEC-0037, DEC-0038).
Signed once into the record, it does not depend on the owner's laptop being awake (v4 Path 7). Each grant's id is listed
once (`FAC-SEM-076`).

## Revocations

Each revocation names its `kind` — `authority`, `machine`, `device-key`, `hub-key`, `publisher-key`, `package` (a
digest) or `grant` (a grant's `meta.id`) — its `ref` in that kind's own form and `revokedAt`. A revision keeps every
revocation before it (`FAC-SEM-072`), lists each once, and lists nothing it revokes: revocation outranks addition (v4 §7;
`FAC-SEM-076`). Removing a machine also revokes its DEC-0031 certificate where an organization server issued one; who revokes for a
solo estate, with no organization server, belongs to the enrollment ceremony (not decided here). The fast
revocation delta that reaches machines within seconds is DEC-0054's (reserved), carried by the relay (v4 §7, [DEC-0047](relay.md#revocation-and-heartbeat)); the record is its
durable state.

## The signature

The signature is a passkey assertion: a WebAuthn assertion response (W3C Web Authentication Level 3, Recommendation of
25 August 2026, <https://www.w3.org/TR/2026/REC-webauthn-3-20260825/>) recorded as `format: "webauthn-assertion"`,
`credentialId`, `alg`, `authenticatorData`, `clientDataJSON` and `sig`, each base64url, without the user handle.

**The challenge** the signer passes to `navigator.credentials.get()` is SHA-256 of the UTF-8 RFC 8785 form of
`{"type": "estate-revision/1", "digest": <digest>}` (`estateChallenge`, v4 §7's signing challenge type
`estate-revision/1`). The type is inside, so an assertion over an estate revision is no other passkey signature over
the same 32 bytes. The signing-challenge decision of a later wave owns the challenge types; it adopts these fields or
replaces them, a change it states.

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
- the record keeps its own rules, `FAC-SEM-072`…`FAC-SEM-076`. The schema is not checked here: a machine applies a
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
- **The pinning itself:** the verifier trusts the authorities it is given; enrollment's confirmation of the estate's
  fingerprint is v4 Path 2's ceremony, outside this record.
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
| ER-7 | `wrong-type`, `wrong-challenge`, `wrong-origin`, `cross-origin` | the client data's `type`, `challenge` or `origin`, or a cross-origin frame |
| ER-8 | `wrong-rp`, `bad-flags`, `no-user-presence`, `no-user-verification` | the `rpIdHash`, AT set or BS without BE, UP clear, UV clear |
| ER-9 | `bad-signature` | the signature does not verify |
| ER-10 | `no-clock`, `too-long-lived`, `not-yet-valid`, `expired` | the verifier's clock is not a readable time (checked first, so no window comparison runs on NaN); `issuedAt` or `validUntil` is not an RFC 3339 date-time with `T`, an offset and a day that exists (stricter than the schema's `date-time`: a leap second `:60` and a space separator are refused too), or the window is not positive or exceeds 30 days; or the clock is before `issuedAt` or after `validUntil` (both instants are inside the window) |
| ER-11 | `rule-violation` | the record breaks `FAC-SEM-072`…`FAC-SEM-076`; the verdict names the codes |

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
| `FAC-SEM-072` | `estate-record`, `estate-record-revision` | a revision is whole and follows its parent: its `digest` is its own, its window is positive and at most 30 days; across `{parent, next}`, the same estate, the next number, the parent's digest, not issued before the parent, every parent revocation kept |
| `FAC-SEM-073` | `estate-record` | every key is usable: exactly one `<id>#sig` and at most one `#kem` per machine, each named for its machine, valid for its algorithm and in one role; machine ids and hub kids once; no hub key of small order; each passkey's key valid and listed once |
| `FAC-SEM-074` | `estate-record`, `estate-placement` | an agent is placed once per machine under a publisher key the record pins, each pinned once; an installed package is the one placed — its own digest, the placement's `agentRef` and digest, on a machine of the record |
| `FAC-SEM-075` | `estate-record`, `estate-placement` | a secret placement is a reference: nothing shaped like a credential, an agent placed on that machine, a source machine of the record, a slot once per agent, and a slot the placed package declares |
| `FAC-SEM-076` | `estate-record` | share grants are to external principals, each listed once; each revocation once; nothing listed that the record revokes |

## Who adopts it

- **Fabric** drafts revisions in the hub, renders the card, runs the signing ceremony in the person's Fabric or a
  pinned static page (v4 §7), and certifies each machine's hub key before the hub signs with it; its delegation verifier
  trusts a `kid` only as [DL-14](delegation.md#keys-publication-and-rotation) says (DEC-0060).
- **Project Observatory's node** applies a revision only when it is schema-valid and `verifyEstateRecord` accepts it
  (the chain, a passkey the parent lists and does not revoke, the window and `FAC-SEM-072`…`FAC-SEM-076`); installs a
  package only when `verifyPackage` accepts it under `placementTrust`'s key and the `estate-placement` rule finds it
  is the one placed (its digest and `agentRef`: `verifyPackage` alone accepts any version signed under that key); fills
  only placed slots; and reports the applied revision in its check-in's
  `records.estateRecord.revision` (DEC-0053) with its `digest` beside it (DEC-0056). As a delegation callee it reads the
  revision it applied, never an older one, and trusts a token's `kid` as DL-14 says (DEC-0060).
- **The relay** serves the latest revision by digest ([DEC-0047](relay.md#blobs)); it never decides trust.

## Privacy

The record describes an estate's keys, machines, placements and grants. It has no field that assesses a person (J10,
the organization edition's open/private split): machines are named by device id, not by a human name (the schema
refuses `name`); no WebAuthn user handle is recorded; a share grant names its principal because it authorizes them, and
records no use. A credential's id is an opaque handle.

## Not decided here

- Fabric's decision D3 (keys: the passkey as the estate authority, platform-keystore device keys, certified hub keys)
  is not recorded on Fabric's `main` (`5bf15e5c`). This record leaves open whether the hub key is the machine's `#sig`
  key or a key of its own, but only partly: `hubKey` is Ed25519 until Fabric's D2 admits ES256, so until then v4's own
  proposal — the hub signing with the machine's ES256 platform-keystore `#sig` key — cannot be certified, and a
  machine with an ES256 `#sig` key certifies a separate Ed25519 hub key (as the positive fixture does). D2 and D3 are
  coupled here. Also open: whether the hub holds a private key at all (Fabric's 0.5.0 decision, v4 §19), the estate's
  fingerprint and the enrollment ceremony.
- A fork: two revisions with one number from one parent, signed by two listed passkeys. A machine accepts only the one
  whose `parent` is the digest it holds, and its check-in may report that revision's `digest` beside the number
  (`records.estateRecord.digest`, DEC-0056), so a receiver tells the two apart; what a receiver does on seeing a fork is
  not decided here.
- The ceiling within which a later version of a placed agent installs without a new revision (v4 Path 2 places an agent
  by its `agentRef`, publisher key and ceiling): until Fabric's ADR-0138 amendment (D2b) and the listing contract
  define a ceiling, every new version is a new revision.
- The signing-challenge types and the dedicated signing RP as a contract (v4 §12; a later wave), recovery by a printed
  code, the revocation delta and heartbeat (DEC-0054, reserved), the estate's windows and their split per machine
  (window leases, a later wave), and `ES256` for hub and publisher keys (Fabric's D2).
