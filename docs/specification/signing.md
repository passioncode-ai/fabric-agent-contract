# Signing — the signing RP, the ceremony and the challenge types

DEC-0063 · rule code `FAC-SEM-092` · the register of signed statements in
[conformance](conformance.md#signing-challenges) · code [`src/signing-challenges.ts`](../../src/signing-challenges.ts) ·
vectors [`fixtures/vectors/signing-challenges.json`](../../fixtures/vectors/signing-challenges.json)

A person's passkey signs the records that decide what runs on their machines and what money may be spent: an estate
revision, a share grant, limits, and in an organization an administrator's countersignature. This page makes two things
a contract: **what** a passkey signs — a challenge derived from a typed statement in one register — and **where** it
signs — under a dedicated signing RP, `sign.<domain>`, with a credential that is never the one the person signs in with.

Sources: the first organization server's target architecture v4 (commit `9c6a780`) — §3 (*Passkey*: "signing uses a
dedicated signing credential, never the sign-in one"), §6 Path 4 step 3 (the countersignature's challenge), Path 5
step 1 (finance approves limits with a passkey), Path 7 step 3 (the owner's passkey-signed binding of an outside
person's key), §7 *Signing surface* and §12's row "signing challenge types (`estate-revision/1`, `org-countersign/1`,
`share-grant/1`, `limits/1`) over JCS, and the dedicated signing RP"; W3C Web Authentication Level 3, RFC 8785,
RFC 7638 and RFC 9449, pinned in the [source ledger](../evidence/sources.md).

## The signing RP

- **The RP ID is `sign.<domain>`:** the first label `sign`, then the organization's domain or PassionCode's, at least
  two labels, in lower case (`isSigningRpId`; `sign.example.org`, never `example.org` or `sign.org`).
- **The signing credential is its own.** It is registered under the signing RP ID and used for nothing else. A
  product's sign-in never registers or asks for a credential under an RP ID whose first label is `sign`, and a signer
  never signs with the sign-in credential. WebAuthn scopes a credential to its RP ID (Level 3 §4, *RP ID*), and the
  authenticator data carries the RP ID's hash, so once a verifier pins the signing RP ID an assertion by the sign-in
  credential cannot pass.
- **Origins are on the RP ID.** Every origin pinned for a signing credential is `https://`, without a port or a path,
  on the RP ID or a host under it (`originWithin`) — the origins from which WebAuthn lets a page use that RP ID (Level 3
  §4). Related origins (Level 3 §5.11), which let other hosts use an RP ID, are never used for signing, so a sign-in
  page on another host cannot run a signing ceremony.
- `FAC-SEM-092` checks a signing credential (kind `signing-credential`) and every passkey an estate record lists (kind
  `estate-record`); the estate record's schema also refuses an authority whose `rpId` is not `sign.<domain>`.

## The ceremony

The ceremony runs only in the signer's own Fabric, or in a static, open-source, integrity-pinned page on the signing RP
ID, top-level (the verifier refuses `crossOrigin: true` and any `topOrigin`). That page computes the challenge itself,
from the bytes of the statement it fetched by digest, and shows what it signs; it never signs a challenge it was
handed. User verification is required (UV). An organization server and a relay never serve a signing page (v4 §7):
they carry statements, and a signer that took a challenge from them would sign what they chose.

## The types

The register, with each type's fields, is in [conformance](conformance.md#signing-challenges). The challenge is
SHA-256 of the UTF-8 RFC 8785 form of `{type, ...fields}` (`signingChallenge`). The passkey types:

- **`estate-revision/1`** `{digest}`: an estate revision, as DEC-0055 defined it — adopted unchanged, so no estate
  record signed before this decision changes.
- **`org-countersign/1`** `{organization, digest, audience, grant, revision}`: an administrator's countersignature of a
  package version (`digest`, DEC-0050) for one listing — its `audience`, its grant (`<id>#<revision>`) and the
  organization record's `revision`. v4 §6 Path 4 lists the last four; `organization` is added because hosted
  organizations may share PassionCode's signing RP, and one administrator's credential may be certified by two
  organizations: without it, a countersignature for one organization's listing would verify for another's with the same
  grant and revision.
- **`share-grant/1`** `{estate, grant, jkt, expiresAt}`: the owner's confirmation that an outside person's key may act
  under a share grant until `expiresAt` (v4 §6 Path 7 step 3). `jkt` is the base64url RFC 7638 SHA-256 thumbprint of
  that person's key, the value RFC 9449 §6.1 binds a DPoP token to. `estate` is added to v4's three for the same reason
  as `organization`: personal estates share PassionCode's signing RP, and grant ids are an estate's own.
- **`enroll-token/1`** `{scope, genesis, purpose, ceiling, notBefore, expiresAt, nonce, uses}`: Fabric's one-time token
  with which a machine without a screen joins an estate, for at most 900 s, purpose `agent-host`, one use (DEC-0084,
  [ceremonies](ceremonies.md#a-headless-machine)). `ceiling` is `null` for none, so the field list stays one list. The
  joining machine proves its `#sig` key with the key-signed `enroll-join/1` `{digest, nonce}` over that token.
- **`limits/1`** `{scope, digest}`: approval of a limits document, the estate's (`estate:<id>`) or an organization's
  (`organization:<id>`), by its `sha256:` digest over RFC 8785. The document's shape — an estate's windows, an
  organization's levels and allowances — is not decided here; the approval binds whatever document the digest names.

Each value is checked where the register defines it (`signingStatement` has no bytes otherwise): ids are opaque, a
digest is `sha256:` and 64 lower-case hex digits, a grant names its revision, a revision is a positive integer, `jkt` is
43 base64url characters with no padding, and `expiresAt` is a strict RFC 3339 date-time.

## What a verifier checks

`verifySigningAssertion(assertion, credential, type, fields)`, with no network:

1. it rebuilds the challenge from `type` and the fields it checks; a statement the register gives no bytes is
   `malformed`;
2. it refuses a credential whose RP ID is not a signing RP as `wrong-rp`, before it reads the assertion;
3. it keeps only the pinned origins on the RP ID, so a ceremony in any other origin is `wrong-origin`;
4. it runs WebAuthn Level 3 §7.2 as the estate record does (`verifyAssertion`): the client data's type, challenge and
   origin, a top-level ceremony, the RP ID's hash, UP and UV, and the signature.

The estate record's verifier is this one with `estate-revision/1` ([estate record](estate-record.md#the-verifier), ER-7
and ER-8). The vectors hold an assertion over a share grant, the same assertion presented as another type and for
another grant (`wrong-challenge`), one by a sign-in credential (`wrong-rp`) and one from an origin outside the RP ID
(`wrong-origin`).

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-092"></a>`FAC-SEM-092` | `estate-record`, `signing-credential` | a passkey that signs is a signing credential: its `rpId` is `sign.<domain>` (the first label `sign`, then at least two labels, lower case), and each origin it pins is `https://` on that RP ID or a host under it, with no port and no path |

## Who adopts it

- **Fabric** (backlog CT-19, CT-53) runs the estate ceremonies under the signing credential and issues `enroll-token/1`
  ([ceremonies](ceremonies.md), DEC-0084); it registers each person's signing credential under its signing RP ID, apart from the sign-in
  credential; runs every ceremony in the person's Fabric or the pinned static page; computes each challenge with the
  register's statement; and signs `share-grant/1` when an owner confirms an outside person, and `limits/1` when a person
  sets their estate's limits.
- **Project Observatory's node** (CT-20) verifies estate revisions under signing credentials only (`verifyEstateRecord`,
  which now refuses a sign-in credential); a node that later verifies a countersignature or a share-grant binding uses
  `verifySigningAssertion` with the register's type.
- **The first organization server** lists its administrators' signing credentials under its `sign.` RP ID in the
  `administrators` of its `org-key-set/1`, which the organization's root signs (DEC-0129), and never serves a signing
  page; where a finance approver's are pinned is not decided.

## Not decided here

- Where a finance approver's signing credentials are pinned and certified, and administrators' quorum, delay and
  device binding (DEC-0129 pins administrators' signing passkeys for the member list only). Until then
  `org-countersign/1` is registered but no verifier reads it, and the package's organization countersignature stays
  DEC-0051's detached signature; replacing it with the passkey assertion is a breaking change for organization
  countersignatures, stated by the decision that defines its verifier.
- The shape of a limits document and where approved limits are stored.
- How the outside person's key is first registered and shown to the owner (the relay's OAuth page and its 6-digit
  code, v4 Path 7), beyond the binding `share-grant/1` signs.
- Recovery by a printed code (v4 §7).
