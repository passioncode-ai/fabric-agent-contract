# The estate ceremonies — create a network, add, remove and re-key a machine

DEC-0084 · rule codes `FAC-SEM-113`, `FAC-SEM-114` · schemas
[`pairing-message`](../../schemas/pairing-message.schema.json), [`enroll-token`](../../schemas/enroll-token.schema.json)
· code [`src/pairing.ts`](../../src/pairing.ts), [`src/enroll-token.ts`](../../src/enroll-token.ts),
[`src/estate-record-rules.ts`](../../src/estate-record-rules.ts) (`deviceKeyRef`, `FAC-SEM-114`) · vectors
[`fixtures/vectors/pairing.json`](../../fixtures/vectors/pairing.json) (written by
[`tools/vectors/pairing.ts`](../../tools/vectors/pairing.ts)),
[`fixtures/vectors/enroll-token.json`](../../fixtures/vectors/enroll-token.json) (written by
[`tools/vectors/enroll-token.ts`](../../tools/vectors/enroll-token.ts)) · tests
[`test/pairing.test.ts`](../../test/pairing.test.ts), [`test/enroll-token.test.ts`](../../test/enroll-token.test.ts),
[`test/ceremonies.test.ts`](../../test/ceremonies.test.ts)

The [estate record](estate-record.md) says what a signed revision holds; this page says how a person gets one: the
ceremonies that create a person's network, add a machine to it nearby, remotely or without a screen, remove one, and
replace a machine's key. Each ceremony ends in a revision the person's passkey signs (DEC-0055, [signing](signing.md))
and each machine applies offline. The ceremonies have a page of their own because they cross four records — the estate
record, the signing register, the device keys ([devices](devices.md#device-keys-by-role)) and the relay's transport
([relay](relay.md#the-pairing-rendezvous)) — and one home keeps the four readers doing the same steps.

Sources: the operator's decisions NET-1…NET-4 of 2026-10-15, in fabric-workspace
`docs/reports/2026-10-15-agent-network-stage1/README.md` at commit `704daafe` (packet P3); the RM-28 devices design,
fabric-workspace `docs/reports/2026-10-12-org-contexts/devices.md` at commit `5ace0ff3` — §2 (the connection channel),
DV-04, DV-05, DV-REL-01 and the owners' answer to DV-CON-01 ("amend", board row CT-38); RFC 6189 (ZRTP) §4.4.1.1 and §7
for the hash commitment that leaves an attacker one guess, pinned in the [source ledger](../evidence/sources.md).

## A network is a context

A person's network is their personal estate, the context `personal` ([contexts](contexts.md)); any other network is an
organization, `org:<orgId>` (NET-1). Creating a network of one's own machines is the first ceremony below; creating an
organization's network, and sharing an agent into it, are DEC-0082's share grants and stage 2 (not decided here). No new
schema names a network.

## Who holds which key

The operator decided Fabric's D3 for the personal estate (NET-3, 2026-10-15):

- **The person's passkey signs every revision** of the estate record: which machines are in the network and what is
  placed where. It is a signing credential under `sign.<domain>` (DEC-0063), never the sign-in one.
- **The hub holds its own private key.** It runs on the machine that is always on, under an Ed25519 **hub key** of its
  own — not the machine's `#sig` key — which the passkey certifies in the record as that machine's `hubKey` (DEC-0055
  item 4). It mints delegation tokens (DEC-0039), signs revocation deltas and heartbeats (DEC-0054) and window leases
  (DEC-0062). The hub key stays Ed25519 until Fabric records D2 (ES256 beside EdDSA), when ES256 joins additively.
- **Every machine keeps its own device keys** (`#sig`, `#kem`; DEC-0053), in the platform keystore where it can.
- **When the hub is away,** the other machines keep working within the existing freshness windows: each applied
  revision until its `validUntil` (at most 30 days, DEC-0055), and calls between machines until the last heartbeat is
  72 hours old ([the 72-hour rule](revocation-delta.md#the-72-hour-rule), DEC-0054). After that a machine keeps the
  person's own local work and refuses what arrives from other machines, as DEC-0054 says.

This closes three of [estate record](estate-record.md#not-decided-here)'s open items for a personal estate: the hub key
is a key of its own; the hub holds a private key; and the enrollment ceremony is this page.

## The estate fingerprint

The **estate fingerprint** is what a person compares to know that two screens show one network.
`estateFingerprint(digest)` takes revision 1's `digest` (`sha256:` and 64 lower-case hex digits; anything else is
`malformed`):

1. F = SHA-256 of the UTF-8 RFC 8785 form of `{"type": "estate-fingerprint/1", "digest": <digest>}`;
2. for i = 0…4, group i is bytes 5i…5i+4 of F read as a big-endian integer, modulo 10^5, written as five digits with
   leading zeros;
3. the fingerprint is the five groups of five digits joined by one space, such as `82502 15204 30620 29998 70976`.

- **Why a function, not a registered statement.** The register (DEC-0063) holds what a passkey or a key signs; nothing
  signs a fingerprint. It is a rendering of a digest a machine already verified, so it is a pure function with vectors,
  like `deltaGenesis` (DEC-0054). The type inside keeps it from equalling any other hash over the same digest.
- **Why revision 1.** Revision 1 never changes and every later revision chains back to it (`FAC-SEM-072`), so the
  fingerprint is the estate's for its whole life, the same on every machine that holds the chain.
- **Why 25 digits.** An attacker who wants a person to accept another estate as theirs builds a revision 1 of their own
  and grinds it (its estate id, its timestamps) until the fingerprint matches, offline, as many times as they like:
  DV-REL-01's lesson about a code taken from one key. 10^25 values cost about 2^82 hashes to match. 40-bit chunks keep
  the arithmetic exact in every language, and a 40-bit value modulo 10^5 is biased by less than 10^-7.
- **Where it is shown.** Fabric, every node and the network view show it beside the network. In the add-a-machine
  ceremony the new machine shows it with the comparison code, so one confirmation covers both; a headless node prints it
  after it pinned the estate. What pins a passkey is never the fingerprint alone: it is the machine's own ceremony, the
  comparison code, which binds the trusted machine's `genesis`, or the enroll token's signed `genesis`, as each ceremony
  says.

## Create my network

Fabric runs it in the person's own Fabric, under the signing credential (DEC-0063), on a first machine:

1. The machine generates its device keys, `<id>#sig` and `<id>#kem` (DEC-0053). On the machine that will be always on
   it also generates the hub's Ed25519 key.
2. Fabric drafts **revision 1**: the signing passkey in `authorities`; the first machine with its `deviceKeys`; and, when
   the first machine is the hub's, its `hubKey`. A hub key is a member of the machine it runs on (DEC-0055), so when the
   network is created on another machine, the hub key is certified in the revision that adds the always-on machine.
   Revision 1 has no `parent` (the schema).
3. The person signs it: a passkey assertion over `signingChallenge("estate-revision/1", {digest})` (DEC-0055, DEC-0063).
4. The machine verifies it under the passkey it just used and **pins that passkey** for revision 1 (DEC-0055: "Revision
   1 is verified under a passkey the machine pinned when it was enrolled"); the relay pins it the same way when it is set
   up for the estate (DEC-0047). Fabric and the machine show the estate fingerprint.

| Failure | What happens |
|---|---|
| the ceremony runs in a frame, in an origin outside the signing RP, or with the sign-in credential | `verifyEstateRecord` refuses it (`cross-origin`, `wrong-origin`, `wrong-rp`; ER-7, ER-8) and no revision exists |
| the person cancels the passkey prompt | nothing is signed; no machine pins anything |
| revision 1 breaks a rule of the record (a key in both roles, a hub key of small order) | `rule-violation` (ER-11); Fabric runs the record's rules before it asks for the passkey |

## Add a machine

The person adds a machine nearby or remotely; the steps are the same, only the transport differs.

1. **The new machine generates its keys**, `<id>#sig` and `<id>#kem`, and a fresh 32-byte nonce.
2. **They meet.** Nearby, the new machine shows a QR code or a short code that names a local connection or a rendezvous;
   remotely, the trusted machine opens a **one-time relay rendezvous** that lives at most 600 s and shows its link, and
   the new machine joins it ([relay](relay.md#the-pairing-rendezvous)). Neither the QR code, the code nor the link is
   trusted for anything but reaching the other side: a code taken from one key's fingerprint is short enough to brute
   force offline (DV-REL-01), so the trust comes from step 4 on both transports.
3. **Both sides commit, then both reveal.** Each side sends `{schema: "pairing-message/1", step: "commit", role,
   commit}`, where `commit` is `pairingCommit({role, keys, nonce, genesis?})`: `sha256:` and the hex SHA-256 of the UTF-8
   RFC 8785 form of `{"type": "fabric-enroll-commit/1", role, keys, nonce}`, with the trusted side's `genesis` — the
   digest of its estate's revision 1 — beside them (the new side has no estate yet and names none; either mistake is
   `bad-genesis`). `role` is `new` or `trusted`; `keys` are the side's
   device keys exactly as the estate record lists them (DEC-0053, `FAC-SEM-073`: one `#sig`, at most one `#kem`, one
   machine id, valid keys in canonical padded base64); `nonce` is 32 random bytes in unpadded base64url. A side reveals —
   `{step: "reveal", role, keys, nonce}`, and `genesis` for the trusted side — only after it holds the other side's
   commitment. Each side checks the other's reveal with `checkReveal(commit, reveal, expectedRole)`.
   - **A departure from DV-04.** DV-04 has the new device commit, the trusted machine send its nonce in clear, and the
     new device reveal (ZRTP's and the share code's asymmetric exchange). Here both sides commit, then both reveal: one
     message order on both transports, each side's code fixed before it sees anything of the other's, and a `genesis`
     on the trusted side that is covered like its keys. The one-guess bound is the same.
4. **The comparison code.** A side computes it only through `checkedComparisonCode(newCommit, newReveal, trustedCommit,
   trustedReveal)`, which runs `checkReveal` on each reveal against its own commitment first; a port that codes reveals
   straight away lets a side pick its nonce after it saw the other's and loses the one-guess bound.
   `comparisonCode(newReveal, trustedReveal)`: the transcript is the UTF-8 RFC 8785 form of
   `{"type": "fabric-enroll-code/1", "new": {keys, nonce}, "trusted": {keys, nonce, genesis}}`; the code is the first
   five bytes of its SHA-256 read as a big-endian integer, modulo 10^6, written as six decimal digits with leading
   zeros. Both screens show it, and the estate fingerprint of the trusted side's `genesis`. The code binds both sides'
   keys, both nonces and the network the trusted machine is in.
5. **The person confirms and signs.** The person confirms on both screens that the codes match, and signs the next
   revision with the passkey on the trusted machine. That revision adds the new machine with exactly the keys it
   revealed. Fabric drafts it and runs the record's rules before it asks for the passkey.
6. **The new machine applies it offline.** The trusted machine sends the chain from revision 1 to the new one: over a
   local connection, as relay blobs by digest or any other way: the chain needs no trusted carrier. The new machine
   verifies revision 1 under its first passkey, verifies every later revision under its parent (DEC-0055), and pins
   revision 1's passkey
   and applies the newest revision only when `joinListed(record, newReveal, trustedReveal, genesis)` accepts it: the
   digest of the revision 1 it verified is the `genesis` the trusted machine revealed (else `other-estate`), the record
   lists the new machine with exactly its revealed keys and the trusted machine with the `#sig` key it revealed, and
   revokes neither. The pin rests on the comparison code, which bound that `genesis`: public keys can be copied, so a
   chain of another estate can list the trusted machine's key and a copy of the person's public passkey, but it cannot
   start at the person's revision 1.

| Step | Failure | What happens |
|---|---|---|
| 1 | the keystore refuses to make a key | the node says so; nothing is sent |
| 2 | the rendezvous is older than 600 s, or was used | `rendezvousVerdict` answers `expired` or `closed`; the person starts again |
| 3 | a reveal before both commitments; a second commit or reveal from one role | `out-of-order` or `repeated`: the rendezvous burns |
| 3 | a reveal whose role, keys or nonce do not open its commitment | `checkReveal` answers `commit-mismatch` (or `role-mismatch`); the side sends `abort` and the rendezvous burns |
| 3 | keys that are not one machine's device keys, a nonce that is not 32 bytes | `bad-keys`, `bad-nonce`: the side aborts |
| 4 | the two reveals in each other's role, or one machine paired with itself | `comparisonCode` answers `role-mismatch` or `same-machine`, and shows no code |
| 4 | a reveal that did not open its commitment | `checkedComparisonCode` answers `commit-mismatch` and shows no code |
| 5 | the person says the codes differ | the side that heard it sends one `abort`, which the rendezvous still carries after both reveals, so the other side learns it too; nothing is signed; a new attempt opens a new rendezvous with new nonces |
| 5 | the passkey ceremony fails | nothing is signed (ER-7, ER-8) |
| 3 | the trusted side names no `genesis`, or the new side names one | `bad-genesis`: the side aborts |
| 6 | the chain starts at another revision 1 than the revealed `genesis` | `joinListed` answers `other-estate`; the new machine pins nothing |
| 6 | the revision lists other keys, not the new machine, or not the trusted machine's key | `joinListed` answers `other-keys`, `not-listed` or `trusted-not-listed`; the new machine applies nothing and pins nothing |
| 6 | the chain does not verify | `verifyEstateRecord`'s refusal; the new machine pins nothing |

### Why six digits

An attacker in the middle runs one pairing with each side. Both sides commit before either reveals, so each of the
attacker's commitments is fixed before it learns the honest side's nonce, and each side's code is a fresh random value
the attacker cannot steer: it matches the other code with probability 10^-6 (RFC 6189 §4.4.1.1: the hash commitment
"constrains the attacker to only one guess"). A wrong guess shows two different codes, so the attack is detected, the
person declines, and the rendezvous burns: one rendezvous, one guess. Six digits are about 19.9 bits, above ZRTP's 16-bit
SAS, which RFC 6189 §7 says gives an attacker "only one chance out of 65536". The code covers both keys of each side and
both nonces, so a swapped `#kem` key changes it as surely as a swapped `#sig` key.

### The rendezvous

`rendezvousVerdict(openedAt, messages, at)` is the relay's and both sides' one reading of a rendezvous. It is `open`
until both reveals opened their commitments, then `complete`, and after that it carries exactly one more message, an
`abort`, so a side whose person said the codes differ tells the other side. It **burns** on the first of:
an unreadable `openedAt` or clock or a message that is not a `pairing-message/1` (`malformed`); a clock more than 600 s
after `openedAt` or more than 60 s before it (`expired`); a second commitment or reveal from one role (`repeated`); a
reveal before both commitments (`out-of-order`); a reveal that does not open its role's commitment
(`commit-mismatch`); an `abort`, before or after both reveals (`aborted`); any other message after both reveals
(`closed`). A burned or complete rendezvous
is never reopened: a new attempt opens a new one, with new nonces.

## A headless machine

A machine with no screen joins with an **`enroll-token/1`** instead of a comparison code (DV-05, as the owners amended
it in their answer to DV-CON-01 on CT-38): the token is a new statement of DEC-0063's register, its single use enforced
by the receiver's nonce store, as DEC-0056 does for request signatures.

- **Fabric issues it, and only Fabric.** The statement is the register's `enroll-token/1` with the fields `scope`
  (`estate:<id>`), `genesis` (revision 1's digest), `purpose` (`agent-host`, the one purpose this revision defines),
  `ceiling` (`null`, or the digest of a ceiling document whose shape is not decided here, as `limits/1` binds whatever
  document its digest names), `notBefore` and `expiresAt` (at most 900 s apart), `nonce` (32 random bytes) and `uses`
  (`1`). The signature is a passkey assertion by a signing credential of the estate over `signingChallenge("enroll-token/1",
  fields)`. `ceiling` is always present, `null` for none, because a register type names one field list for good. Fabric
  can revoke a token before its use; the hub records the revocation in its ledger (how Fabric's revocation reaches the
  hub is not decided here).
- **The node consumes it** from stdin or from a file only its own user can read (mode 0600 or narrower), **never** from
  argv, a URL, an environment variable or a log line. It presents the token with its `#sig` key and a **proof of that
  key**: its signature over the register's key-signed `enroll-join/1` statement, `{type: "enroll-join/1", digest,
  nonce}` — `digest` the `sha256:` of the token's statement bytes, `nonce` the token's (`enrollJoinInput`); ES256 as 64
  bytes r ‖ s in the low-S form `relay-auth/1` uses, Ed25519 as its 64 bytes. It **prints its own key's fingerprint**
  (`deviceKeyFingerprint` of its `#sig` key) to its console.
- **The hub verifies and binds it.** `verifyEnrollToken(token, {record, genesis, at})` checks, in order: a readable clock
  (`no-clock`); the token's shape and the register's values (`malformed`); the scope and `genesis` against the estate the
  hub holds (`wrong-estate`); the passkey among the current revision's authorities and not revoked
  (`no-trusted-authority`, `revoked-authority`, `duplicate-authority`, `unknown-authority`); the assertion
  (`verifySigningAssertion`, DEC-0063); then the window (`too-long-lived`, `not-yet-valid` with the 60 s skew, `expired`).
  `redeemEnrollToken(token, machineKey, proof, ledger)` then refuses a key that is not one valid `#sig` key (`bad-key`)
  and a proof that is not that key's signature over `enroll-join/1` (`bad-proof`), binds the token's nonce to the
  fingerprint of the machine's `#sig` key (`deviceKeyFingerprint`) on its first use, and refuses every later use — by
  another key or the same one — as `reused`, answering the line the hub logs (the nonce, the fingerprint presented, the
  one it is bound to); the joining machine learns only the refusal. The hub keeps each nonce at least until the token's
  `expiresAt` plus 60 s, after which the verifier refuses the token anyway.
- **The token is a bearer token.** The proof shows that the presenter holds the key it asks to bind, not that it is the
  machine the person meant: whoever presents the token first, with a key of its own, binds that key, and the honest
  node's later attempt is refused `reused` and logged. So before the person signs the revision that lists the machine,
  **Fabric shows the fingerprint of the key it is about to list**, and the person compares it with the one the node
  printed; a mismatch means someone else redeemed the token, and the person signs nothing and revokes it.
- **The token gives no trust.** It authenticates the join and nothing else: the machine is in the network only when the
  person signs a revision that lists it with the bound key, as in step 5 above, and the node applies it as in step 6.
- **The node pins the estate by the token's `genesis`.** It verifies the chain it receives from revision 1 and pins
  revision 1's passkey only when that revision's digest is the token's `genesis` and the token verifies under the
  current revision (`verifyEnrollToken` with the node's own `genesis`). The token reached the node by the person's own
  hand, so its signed `genesis` names the person's estate; without it, a chain whose revision 2 lists a copy of the
  person's public passkey would verify the token too. The node prints the estate fingerprint.

| Failure | What happens |
|---|---|
| the token is 901 s long, for two uses, for another purpose, without `ceiling`, or has an unknown member | `FAC-SEM-113` on the document; `malformed` or `too-long-lived` at the verifier |
| another estate, or a `genesis` that is not the revision 1 the verifier holds | `wrong-estate` |
| a statement changed after signing | `wrong-challenge`: the challenge is rebuilt from the statement, never taken from the token |
| the token was used | `reused`, recorded by the hub; the machine learns only the refusal |
| a key without its proof, or a proof made for another token or by another key | `bad-proof`: nothing is bound |
| someone redeemed it first with their own key | the honest node's join is `reused` and logged; the fingerprint Fabric shows differs from the node's, and the person signs nothing |
| Fabric revoked it | `revoked` |

## Remove a machine

The person signs a revision without the machine that lists `machine <id>` in `revocations`, and the hub key it
certified, if any, as `hub-key <kid>`, in the same revision (`FAC-SEM-114`); it may also list the machine's device keys.
The hub issues a revocation-delta entry for each revocation, so it reaches every machine within seconds
([revocation delta](revocation-delta.md#the-delta), DEC-0054). The revision lists each entry's revocation exactly as the
entry names it — the same `kind` and `ref` — or a machine holding the entry refuses the revision (`FAC-SEM-084`), so
Fabric's hub and its drafter write one form. The relay drops the machine from its admission set and
ends its open sessions (DEC-0047, DEC-0066); a node that applied the revision answers `ownKeysDecision(record, id,
held)` with `stop`, `removed`.

**Who revokes a solo estate's certificate.** A DEC-0031 device certificate exists only where an organization server
enrolled the machine. In a personal estate with no organization server there is no certificate to revoke, so the
record's revocation and its delta entry are the whole removal. Where an organization server issued a certificate, that
server revokes it (DEC-0031), when the organization removes the machine from its own enrollment — a decision of the
organization, never triggered by the estate's revision, since NET-2 gives each organization enrollment keys of its own.

## Replace a machine's key

A machine whose device key is lost, or is rotated, keeps its machine id:

1. The machine generates new keys and **pairs again** as in [add a machine](#add-a-machine), in the role `new`, under
   the **same machine id**.
2. One passkey-signed revision replaces the machine's `#sig` and `#kem` with the new keys and **revokes the old ones in
   that same revision** (`FAC-SEM-114`), each by its own **key reference** `deviceKeyRef(key)`: `<kid>@sha256:<hex>`, the
   kid and the SHA-256 of the key's octets (`deviceKeyFingerprint`). A kid outlives its keys — every `#sig` key of a
   machine is `<id>#sig` (DEC-0053) — so a `device-key` revocation by kid revokes every key under it, the new one too, and
   `FAC-SEM-076` refuses a record that lists a key it revokes; the key reference revokes the old key alone. `@` never
   occurs in a kid, so the two forms never collide.
3. If the hub key was on that machine, the same revision re-certifies it under a **new kid** and revokes the old kid
   (`hub-key`), or revokes it with no successor (`FAC-SEM-114`).
4. The machine applies the revision only if it holds every key the record lists for it: `ownKeysDecision(record, id,
   held)` answers `apply`, with `retire` naming the held keys the record no longer lists, which the node destroys.
   Otherwise it answers `stop`, `keys-replaced`, and the node stops using the keys it holds: it lost the new key, or
   another holder of its id carries it.

The hub issues a delta entry for each old key, naming it by its key reference, and the revision lists each entry's
revocation exactly as the entry names it (`FAC-SEM-084`); Fabric's hub and its drafter use that one form.

**A one-machine estate** has no second machine to pair with. Its machine re-keys as in [create my
network](#create-my-network): the person signs on the machine itself, with no pairing, a revision that lists the new
keys and revokes the old ones by their key references; the machine applies it under the passkey it pinned.

**What refuses the old key.** No rule compares a signature's time with the revision's `issuedAt`. From the moment a
verifier applies the revision — or a revocation-delta entry that revokes the old key — the existing rules refuse
anything the old key signs:

- **the relay:** the old `#sig` key leaves the admission set, so `auth` under it is `unauthenticated`. A session the old
  key proved is ended with `not-admitted` and close 4403, because a session stands only while its kid maps to the same
  key octets it was proven under (`sessionStands`, relay.md *Admission*, DEC-0084): the kid stays `<id>#sig`, so a check
  by kid alone would keep it open. A delta entry may revoke the key by its key reference; `relayAdmissionSet` subtracts
  a key whose kid or key reference is revoked;
- **a secret envelope:** its sender's key is the `#sig` key the newest applied revision lists, less the keys and
  machines the applied delta entries revoke by kid or key reference (`estateEnvelopeContext(applied, machine,
  extraRevocations)`, DEC-0047 item 7, DEC-0084), so an envelope signed by the old key is refused (`bad-key`);
- **delegation and window leases** are signed by the hub key, never a device key: a replaced hub key is untrusted once
  no applied revision certifies its kid (`hubKeyCertified`, DL-14, DEC-0060; `estateSigner`, DEC-0054).

Between `issuedAt` and that application a verifier still on the parent accepts the old key; the delta's seconds and the
72-hour rule (DEC-0054) bound that window, as they bound every revocation.

A **stolen** machine is removed, not re-keyed: re-keying keeps its id in the network, and a relay pinned before DEC-0084
does not read a key reference in a delta entry (see *Compatibility*). It joins again, if it comes back, under a new id.

## Linkability

NET-2 answers K-1: each organization enrollment of a machine gets its own keys, so organizations cannot link the
machine (CX-22). The contract's part — a `kid` and an `iss` per context, and what `FAC-SEM-044`, `FAC-SEM-073` and the
check-in carry for each (CX-CON-06) — is stage 2 and **not in this decision**; until it lands, the pilot's single key
stays linkable ([contexts](contexts.md#linkability)).

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| `FAC-SEM-113` | `enroll-token` | an `enroll-token/1`'s statement is the register's: `type` `enroll-token/1` and exactly its fields, `purpose` `agent-host`, `uses` 1, `scope` `estate:<id>`, `genesis` a digest, a 32-byte `nonce`, `ceiling` `null` or a digest; `notBefore` and `expiresAt` RFC 3339 read strictly, `expiresAt` after `notBefore` and at most 900 s after it |
| `FAC-SEM-114` | `estate-record-revision` | what a revision drops, it revokes in the same revision: a machine of the parent it no longer lists as `machine <id>`, with its hub key as `hub-key <kid>`; a device key of a machine both list that it no longer lists, by its key reference `<kid>@sha256:<hex>` or by its kid; a hub key of a machine both list that it no longer certifies with the same kid and key, as `hub-key <old kid>`. `verifyEstateRecord` runs it whenever it has a parent (`rule-violation`) |

DEC-0084 also extends two rules of the [estate record](estate-record.md#semantic-rules): `FAC-SEM-076` reads a
`device-key` revocation as a kid or a key reference, refuses a record that lists the key either names, and refuses a ref
that holds `@` but does not match `^[A-Za-z0-9][A-Za-z0-9._:~-]{0,127}#(sig|kem)@sha256:[a-f0-9]{64}$`;
`FAC-SEM-073` refuses a device key whose `publicKey` has no canonical fingerprint, so the rule layer alone refuses a
non-canonical key the schema would also refuse.

| Kind | Input |
|---|---|
| `enroll-token` | an `enroll-token/1` document |
| `estate-record-revision` | `{parent, next}`, two estate revisions ([estate record](estate-record.md#semantic-rules)) |

Fixtures: `fixtures/semantic/enroll-token-*`, `fixtures/semantic/estate-revision-key-*`,
`fixtures/semantic/estate-revision-kem-dropped-kid-revoked.json`, `fixtures/semantic/estate-revision-machine-id-changed.json`,
`fixtures/semantic/estate-revision-remove-*`, `fixtures/semantic/estate-revision-hub-key-*`,
`fixtures/semantic/estate-device-key-*`, `fixtures/semantic/estate-key-replaced-kid-other-machine.json`;
`fixtures/positive/estate-record-key-replaced.json`, `fixtures/positive/enroll-token*.json`,
`fixtures/positive/pairing-message-*.json` and their negatives.

## Who adopts it

- **Fabric** runs the ceremonies' signing in the person's own Fabric under the signing credential (DEC-0063): drafts
  revision 1 and every revision that adds, removes or re-keys a machine, runs the record's rules (`FAC-SEM-072`…`076`,
  `FAC-SEM-110`, `FAC-SEM-111`, `FAC-SEM-114`) before it asks for the passkey, shows the comparison code and the estate
  fingerprint, and before it signs a headless machine in shows the fingerprint of the key it is about to list; issues and
  revokes `enroll-token/1`; re-certifies a hub key under a new kid on a re-key; writes each delta entry's revocation
  into the next revision in the entry's form, never signing an entry `FAC-SEM-082` flags; and runs the hub on the always-on machine under its own certified hub key,
  binding each token once (`redeemEnrollToken`, with its proof).
- **Project Observatory's node** generates the device keys; pairs (`pairingCommit`, `checkReveal`, and the code only
  through `checkedComparisonCode`); joins a remote rendezvous; applies the chain and pins revision 1 only at the revealed
  `genesis`, or at an enroll token's `genesis` after verifying the token; shows the estate fingerprint; repins so that
  `verifyEstateRecord` runs `FAC-SEM-114` and the new `FAC-SEM-073` and `FAC-SEM-076` clauses; consumes a token from
  stdin or a 0600 file only, presents it with its `enroll-join/1` proof and prints its own key's fingerprint; decides on
  its own keys with `ownKeysDecision`; and opens envelopes with the applied delta entries (`estateEnvelopeContext`'s
  `extraRevocations`, checked by the `placement` vectors), and refuses a delta entry naming a malformed key reference.
- **The relay** opens one-time rendezvous and carries pairing messages only, as `rendezvousVerdict` reads them,
  forwarding one `abort` after both reveals; revalidates sessions by key, not by kid (`sessionStands`); subtracts a key
  revoked by its key reference and reports a malformed reference (`unread`); and admits a `#sig` key only under its own
  machine's kid, a kid listed twice for neither (F7) — its shared vectors are `fixtures/vectors/relay.json`'s
  `admissionSet` and `session` groups.
- **fabric-agent-adapter**'s kits run `FAC-SEM-113`, `FAC-SEM-114` and the new `FAC-SEM-073` and `FAC-SEM-076`
  clauses, and `fixtures/vectors/pairing.json`, `fixtures/vectors/enroll-token.json` and the relay vectors' new cases,
  at their next pin (as FAA-41 did for DEC-0082).

The board row is CT-53.

## Compatibility

`contractVersion` stays `0.1.0`.

1. **New schemas** (`pairing-message/1`, `enroll-token/1`), two new register types (`enroll-token/1`, `enroll-join/1`)
   and new functions are additive: nobody reads them before adopting this decision.
2. **`estate-record.schema.json` changes only in a description** (the revocation `ref` names the key-reference form);
   validation is unchanged, which is compatible both ways. A key reference is a `ref` string the schema already admits, so a
   reader pinned before DEC-0084 accepts every record this decision produces. It does not recognise a key reference:
   its `FAC-SEM-076` compares a `device-key` ref with kids only, and its relay subtracts kids only. A key reference
   revokes a key that the same revision no longer lists, so an older reader of that revision distrusts the key anyway.
   What an older relay misses is a delta entry that revokes a key by its reference ahead of the revision: it admits the
   old key until it applies the revision. Where that gap matters — a stolen machine, not a rotated key — the person
   removes the machine (`machine <id>`, which every reader honours) instead of re-keying it.
3. **`FAC-SEM-114` is a tightening.** A reader at or after DEC-0084 refuses a revision that drops a machine, a device key
   or a hub key without revoking it (`rule-violation` in `verifyEstateRecord`, a finding of kind
   `estate-record-revision`); an older reader accepts it. No estate record is deployed yet (CT-19, CT-20), and every
   revision in this repository's fixtures already revokes what it drops.
4. **`FAC-SEM-076`'s new clause** refuses only a record that revokes, by key reference, a key it still lists: a form no
   record used before this decision.
5. **`relayAdmissionSet` refuses more:** a key whose key reference is revoked (a relay pinned before DEC-0084 admits it
   until the revision that drops it, as item 2 says), and a `#sig` key listed under another machine's kid or a kid listed
   twice (F7), which `FAC-SEM-073` already refuses in any record `verifyEstateRecord` accepts, so only a held record that
   was never checked loses a key. It also reports a malformed key reference in a delta entry.
6. **`sessionStands`** ends a session whose kid now names other key octets; before DEC-0084 a relay that revalidated
   by kid kept it. **`estateEnvelopeContext`'s `extraRevocations`** is optional, so an existing caller is unchanged.
7. **`FAC-SEM-073` and `FAC-SEM-076` gain clauses** that refuse a non-canonical device key, which the schema already
   refuses for P-256, and a `device-key` ref with `@` that is no key reference, a form that did not exist.
8. **The rendezvous now carries one `abort` after both reveals**, where the first reading closed it: a relay or side
   that adopted the first reading of this pull request has not shipped (CT-53 is open).
9. **`redeemEnrollToken` takes the token and a proof** in place of the nonce: no hub has adopted it.
10. **The delta side tightens with the records.** A machine at or after DEC-0084 refuses a delta page whose `device-key`
   entry names a malformed key reference (`applyDelta` `malformed`, RD-2; `FAC-SEM-082`), where an older machine applies
   it; since `FAC-SEM-076` refuses that ref in every revision, a hub runs `FAC-SEM-082` before it signs an entry.
11. **The shared `placement` vectors carry `extraRevocations` and expect `senderKnown`.** A port that vendors
   `src/relay-vectors.ts` refreshes it with the vectors; an old runner fails every placement case, never silently.

## Not decided here

- CX-CON-06 (a `kid` and an `iss` per context) and how an organization enrollment's ceremony differs from these
  (stage 2, Fabric's D8).
- `node-summary/1`, DV-CON-01's other half: no step of these ceremonies needs it.
- The ceremonies' interface: screens, wording and the QR code's encoding of a local connection or a rendezvous.
- The relay's frame types for a rendezvous (the relay's RLY rows); this page fixes what a rendezvous carries and when it
  burns.
- A ceiling document's shape; until one is decided, Fabric issues tokens with `ceiling: null`.
- How Fabric's revocation of an unused token reaches the hub's ledger when the hub runs on another machine: the
  revocation delta carries no token kind and the relay's mail is not a channel this decision names.
- A token for an organization's machine (`scope: organization:<id>`), and purposes beyond `agent-host`: each is a new
  value of the register type's fields, so a new type (`enroll-token/2`).
- Recovery when every passkey is lost (a printed code, v4 §7), as DEC-0055 and DEC-0063 leave it.
