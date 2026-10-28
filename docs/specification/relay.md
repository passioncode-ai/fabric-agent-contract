# Relay `fabric-relay/0.1`

A relay carries sessions, messages, sealed secret envelopes, personal credential envelopes and package blobs between the machines it admits: one
owner's estate (what an organization's relay carries between its members is not decided, CT-163; its members have an admission set from its signed member list, `org-authority/1`, DEC-0129;
its handshake is [the organization's relay](#the-organizations-relay), DEC-0134). **It holds no authority.** End-to-end signatures and seals carry every decision a machine relies on.
A compromised relay can delay, drop or count traffic. It cannot read a secret, forge a message, or replay one past
the recipient's checks. Decided in DEC-0047 and amended in place by DEC-0066 (nothing was deployed); the reference
server is [passioncode-ai/relay](https://github.com/passioncode-ai/relay).

The reference code is in six files:
- [`src/relay.ts`](../../src/relay.ts): admission, blob requests, message bodies and the close codes;
- [`src/secret-envelope.ts`](../../src/secret-envelope.ts): the envelope;
- [`src/p256.ts`](../../src/p256.ts): key validation and the low-S rule;
- [`src/relay-vectors.ts`](../../src/relay-vectors.ts): the runner of the shared vectors (see [Shared vectors](#shared-vectors));
- [`src/machine-report.ts`](../../src/machine-report.ts): the machines' report to their hub (DEC-0132);
- [`src/org-authority.ts`](../../src/org-authority.ts): an organization's relay's admission set from its member list
  (`orgRelayAdmissionSet`, DEC-0129, DEC-0134).

Shared vectors are in `fixtures/vectors/` (`relay.json`, `secret-envelope.json`, `p256.json`, `machine-report.json`).

## Roles

| Role | May | May not |
|---|---|---|
| relay | admit a machine that proves its device key; queue and deliver opaque messages; store envelopes and blobs by digest; report when a machine was last seen to machines of the same owner; carry signed revocation deltas and heartbeats unchanged | read a body or a secret; decide a trust tier; sign anything a node relies on; report a queued command as done; serve a signing page; send presence across owners; tell an unproven caller anything it holds |
| node | connect out to a relay; send and receive messages; seal and open envelopes; apply deltas | trust the relay's word for anything a signature does not carry |
| surface | the same as a node, under its own device key | |

## Keys

- **A relay participant's keys are P-256, held in the platform keystore** ([devices](devices.md#device-keys),
  DEC-0053), or, on a machine without a store, where it can ([ceremonies](ceremonies.md); for a machine enrolled with an
  organization, `key.storage: file`, DEC-0094). Each machine has two keys, never one key in both roles:
  - a **signing key** (ES256), under the key id `<machine>#sig`;
  - a **key-agreement key** (ECDH P-256), under the key id `<machine>#kem`.

  A secret is never sealed to a signing key, and nothing is signed with a key-agreement key (FAC-SEM-070).
- **ES256 only.** [devices](devices.md#device-keys) admits an Ed25519 `#sig` for a device; a relay participant's `#sig`
  is ES256. The platform keystore holds P-256, and the envelope's `#kem` is P-256 anyway, so one curve serves both
  roles. An Ed25519 `#sig`, or any `alg` other than `ES256`, is refused as `unsupported-alg` where the request names
  it, and an Ed25519 `#sig` is left out of the admission set (see [Admission](#admission)).
- **The algorithm is named in a signed field.** `relay-auth/1`, `relay-blob/1` and the envelope header carry
  `alg: "ES256"`, and the message body is a JWS whose header says `alg: ES256`.
- **One key, two spellings.** DEC-0053 records a device's public key as base64 SEC 1 octets (65 bytes, `0x04 ‖ X ‖ Y`);
  the relay protocol names keys as JWKs (RFC 7518 §6.2.1). They are the same key: the JWK's `x` and `y` are the
  octets' `X` and `Y`, base64url. `p256Point`, `p256Jwk` and `p256PublicKey` accept either form, and every check gives the
  same answer for both (`fixtures/vectors/relay.json` carries `machineKey` and `machineKeyOctets`). The reference
  verifiers hand `node:crypto` the key as a JWK with `format: "jwk"`, the form a Cloudflare Worker (`nodejs_compat`)
  accepts as well as Node (`test/worker-key-form.test.ts` holds it).
- **Every public key is validated before use** by SEC 1 v2 §3.2.2 (`p256KeyRefusal`): not the point at infinity,
  coordinates in [0, p − 1], on the curve. The cofactor is 1, so the order check holds for every point on the curve.
  A key that fails is refused as `bad-key` by a recipient (a message body, an envelope), and nothing is verified or
  sealed under it. Admission and blob requests answer `unauthenticated` instead: before the signer is proven they say
  nothing about a key, and `bad-key` is reserved there (DEC-0066).
- **All signatures are ES256**, raw `r ‖ s` (64 bytes), base64url, over RFC 8785 bytes ([canonical
  forms](conformance.md#canonical-forms)).
- **Low-S** (DEC-0066). A relay-family signature — `relay-auth/1`, `relay-blob/1`, a message body, an envelope — has
  `s ≤ n/2`; `(r, n − s)` verifies under plain ECDSA and is refused (`verifyEs256`). A signer signs with `signEs256`, or
  normalises its signature with `toLowS`, which needs no key: a Secure Enclave, a TPM or Python's `cryptography` signs as
  it does and normalises after. Passkey assertions (WebAuthn) are exempt: the authenticator makes them, and nothing keys
  on them. So nobody but the signer can make a second valid encoding of a signature.
- **Identity is never the digest.** A message's identity is `(from, msgId)`; a secret envelope's, for deduplication and
  anti-rollback, is `(sender, agentRef, slot, envelopeSequence)`; a credential envelope's mark is per
  `(context, agentRef, slot)`, whoever sent it ([credentials](credentials.md#the-envelope)). `envelopeDigest` is the relay's storage name: ECDSA is
  randomised, so the legitimate signer can always make another valid envelope of the same content.
- **Times** are RFC 3339 UTC: `Z`, an upper-case `T`, at most nine fractional digits, on a day its month has (`instant`,
  through `strictTime`). `2026-02-30`, hour 24 and a leap second `:60` are refused, never rolled forward or compared. A
  time is read to the millisecond: fraction digits past the third are dropped, so `00:01:00.000999999Z` is the instant
  `00:01:00.000Z` (vectors `instant`, and `admit`'s "iat 60.000999999 s ahead"); the machines' report orders its `at`
  to the nanosecond against the report held instead, and reads it against the body's `iat` to the millisecond (MR-4, DEC-0146). A signed `iat` more than 60 s ahead of
  the verifier's clock is `not-yet-valid` (`CLOCK_SKEW_SECONDS`, the same skew the estate record's `issuedAt`, a hub
  key's window and a delta entry have, DEC-0066).

## Transport

- **One WebSocket per connection.**
  - It goes over TLS 1.2 or newer (TLS 1.3 SHOULD), to `wss://<relay>/v1/connect`, with the subprotocol
    `fabric-relay.v1`.
  - A relay that receives no matching subprotocol refuses the upgrade.
  - **No credential travels in the URL or in an HTTP header.**
- **The relay's origin** (`hello.relay`, `isRelayOrigin`, the schema's pattern `RELAY_ORIGIN_PATTERN`) is an origin and
  nothing more: `https://` and a host name or a bracketed IP literal, or — for a relay on the same machine — `http://`
  on a loopback literal, 127.0.0.0/8 or `[::1]`; either with an optional port up to 65535, and no path, user information
  or anything after it. A name such as `localhost` is refused over http: a name resolves somewhere a literal cannot
  (DEC-0066; vectors `relayOrigin`).
- **Frames** are UTF-8 JSON text frames of at most 1 MiB, each with `{v: 1, type, id}`
  ([`relay-frame.schema.json`](../../schemas/relay-frame.schema.json)).
  - Unknown members are ignored.
  - An unknown `type`, or a type a node never sends (`hello`, `welcome`, `accepted`, `deliver`, `presence`,
    `presence-result`, `error`), is answered `error` `unknown-type`. A known type that fails the schema or FAC-SEM-071,
    and text after `auth` that is not a `{v: 1, type, id}` frame, is answered `malformed`. The connection stays open
    for both. Before `auth`, anything but `auth` is `unauthenticated` and closes 4401.
  - **`replyTo`.** Every frame the relay sends in answer to a node's frame carries `replyTo`, that frame's `id`: an
    `error` answering a frame, `accepted`, `pong`, `presence-result`, and `delta` pages answering `delta-query`. Each
    keeps its own fresh `id`. Unsolicited frames (`hello`, `welcome`, `deliver`, pushed `presence`, `delta` and
    `heartbeat`, a closing `error`) carry none.
  - A connection silent for 90 s is closed; `ping` and `pong` keep it alive.
- **Close codes** (`CLOSE_CODES`, `closeCodeFor`):

  | Situation | `error` frame | close |
  |---|---|---|
  | any refusal of `auth` (`unauthenticated`, `replay`, `not-yet-valid`, `unsupported-alg`, `protocol-unsupported`) | yes | 4401 |
  | no `auth` within 10 s | `unauthenticated` | 4401 |
  | a proven session whose kid left the admission set, or now names another key than the one it was proven under (`sessionStands`, DEC-0084; see [Admission](#admission)) | `not-admitted` | 4403 |
  | the held estate record expired, or on an organization's relay the held member list's window ended (DEC-0134) | `expired` | 4403 |
  | a frame over 1 MiB | `too-large` | 1009 |
  | a binary frame | none | 1003 |
  | 90 s of silence; the relay shutting down | none | 1001 |
  | a node that keeps sending after `rate-limited` | `rate-limited` | 1008 |
  | a relay fault | `internal`, where the socket still allows it | 1011 |

  4403 is only ever sent to a session whose signer was proven. Every other error leaves the connection open. The code
  `bad-key` is reserved: since DEC-0066 no relay sends it (an unusable admitted key is left out of the admission set,
  and its request is `unauthenticated`), and it stays in the error codes only so a frame from an older relay validates.
- **Blobs travel over HTTPS by digest**, never in frames (see [Blobs](#blobs)).

## Admission

1. The relay sends `hello` with `{protocol: "fabric-relay/0.1", relay: <its origin>, nonce: <32 random bytes,
   base64url>, time}`.
2. Within 10 s, the machine sends `auth` with `{protocol, alg, estate, kid, iat, sig}`. `sig` signs the RFC 8785 bytes
   of `{type: "relay-auth/1", alg: "ES256", relay, nonce, estate, kid, iat}` (`relayAuthSigningInput`).
3. The relay admits the machine (`admit`) in this order; a refusal is the first that fails:
   - the protocol is this one (`protocol-unsupported`), and `alg` is `ES256` (`unsupported-alg`);
   - `iat` is a real instant (`unauthenticated`), at most 60 s ahead (`not-yet-valid`) and at most 60 s old
     (`unauthenticated`);
   - the nonce is the one it sent on this connection, used once (`replay`);
   - **one step, one answer:** the signed `estate` is the estate of the record the relay admits from, `kid` is in the
     admission set, and the signature verifies under that key. Any failure here — an unknown kid, a revoked one, a relay
     that holds no record, another estate, a bad or high-S signature — is `unauthenticated`. Until the signer is proven,
     nothing the relay holds changes the answer (DEC-0066), **nor the work**: the relay MUST verify exactly one signature
     of equal cost on every path past the frame's own bytes, under a fixed valid dummy key when it has no usable key for
     the kid or the estate differs, and apply the low-S rule after that verification (`admit` and `verifyBlobRequest`
     do; `test/relay-constant-work.test.ts` counts the verifications).

   Then an estate's relay answers `welcome` with `{session, estateRevision, deltaHead: {sequence, sha256}, heartbeat,
   limits?}`, and an organization's relay with `{session, list, limits?}` and none of the other three (OR-2).
   `deltaHead` has the shape of a device check-in's `records.revocationDelta` (DEC-0054's head), so a node passes it on
   unchanged; `heartbeat` is the latest `heartbeat/1` the relay holds, or `null`; `estateRevision` is the verified
   revision (1 or more) the relay admits from, always present on an estate's relay; `limits` is what the relay enforces (see
   [Messages](#messages)). Otherwise it answers `error` with the refusal's code and closes 4401. The message is fixed per
   code; the reason (no record, expired, unverified, another estate) goes to the relay's log, never to the client.
4. The relay attributes every later frame on the connection to the admitted `kid`, and to nothing a frame claims.

**A reasonless 4401, seen from the client.** A node or a surface refused with `unauthenticated` and close 4401 learns
no reason, by design. It tells the person, in this order: check that this machine is in the estate's current revision
(not revoked, its device key the one the record lists), which the estate's owner sees in the hub; then check the clock
(an `iat` more than 60 s old is refused the same way) and update the client, since a client that signs high-S or an
old protocol is refused the same way too. On an organization's relay (DEC-0134) it
says instead to check that this machine's enrollment is on the organization's current signed member list (a new join
waits for an administrator's signature, a list expires, and a list whose signer the key set no longer lists admits
nobody until another administrator signs one, OR-4), which one of the organization's administrators sees by the
enrollment's kid, which the node shows (a list entry names a pairwise subject, never who it is, OL-2); then check the
clock and update the client. It retries no more often than its backoff, and never asks the person to re-enter a secret for
it.

**The admission set** of an estate's relay (an organization's is its member list's, below and OR-3) is the set of
`#sig` keys of the machines in the estate record the relay holds, minus revoked
machines and keys — a `device-key` revocation names a kid or a key reference `<kid>@sha256:<hex>` (DEC-0084); the set
subtracts a key either names, and reports in `unread` a delta revocation whose ref holds `@` but is no key reference —
minus a `#sig` key listed under a kid other than its own machine's `<id>#sig`, and every key of a kid listed twice (F7,
DEC-0084: `bad-key` in `excluded`, as `FAC-SEM-073` refuses such a record), minus the revocations of verified delta entries it applied (`extraRevocations`, see [Revocation and
heartbeat](#revocation-and-heartbeat)), and minus every key that could never verify a relay signature: an Ed25519 key
or one SEC 1 refuses, which `relayAdmissionSet` names in `excluded` for the log (`relayAdmissionSet`). Being admitted
by a relay makes no machine T1 to another owner's machine (see [Trust tiers](#trust-tiers)). It keeps strangers out of
mailboxes. **It is not authorization**: a recipient checks the sender itself (see [Trust tiers](#trust-tiers)).
- **Only from a verified revision** ([estate record](estate-record.md), DEC-0055). The relay pins the estate's first
  passkeys when it is set up for the estate, the same act as a machine's enrollment pin. It applies a revision only
  when it is valid against `estate-record.schema.json` and `verifyEstateRecord` accepts it against the revision it
  holds (revision 1: against the pinned passkeys). A refused revision changes nothing. A relay never starts with a
  configured set. The keys come from `machines[].deviceKeys`, as base64 SEC 1 octets. A held revision is read without
  the schema, so `relayAdmissionSet` refuses it `invalid` when its `revision` is no positive integer and admits no key
  of a machine whose `id` is no string (naming its `#sig` keys in `excluded`); it answers every JSON record with a typed
  result and never throws (CT-111).
- **The schema check is the caller's to supply, and it MUST be the validator of
  [`estate-record.schema.json`](../../schemas/estate-record.schema.json).** `relayAdmissionSet` takes it as
  `schemaValid`; a relay that passes `() => true` is not conformant.
- **The window.** The held revision admits from 60 s before its `issuedAt` (the clock skew) to its `validUntil`
  inclusive, read by `strictTime` as `verifyEstateRecord` reads them. Before that it is `not-yet-valid`; after it, the
  relay fails closed (`expired`): it admits no new `auth` until a newer verified revision arrives, and it ends every
  open session (below). Queued mail stays until its `ttl`. Presence and `lastSeen` follow the same verified set.
- **Open sessions are revalidated** (DEC-0066, replacing "at their next re-authentication"; by key since DEC-0084). An
  open session stands only while its `kid` is in the relay's current admission set **and maps to the same key octets
  the session was proven under** (`sessionStands`, vectors `session`): a key replacement keeps the kid `<id>#sig`, so a
  session proven under the old key ends when the set maps that kid to the new key. When the relay applies a newer revision, or a delta
  entry that revokes the machine or its `#sig`, it ends every session whose `kid` left the set or now names another key with `error not-admitted`
  and close 4403, and checks that before any frame it sends or accepts for the session, so a frame already in flight
  is not delivered. When the held revision's window ends it ends every session with `error expired` and close 4403. A
  machine so closed is refused on its next `auth` by the ordinary check. No new frame and no client re-authentication
  are needed.
- **One context per origin.** A relay origin admits from one record: one estate, or on an organization's relay one organization's member list (DEC-0134). The estate is
  compared inside `admit` and nowhere else (`AuthContext.estate`, the held record's; on an organization's relay the
  organization's context id, which every member signs and its `welcome` names, so the rule below is about a person's
  estate id). **A relay MUST NOT use the estate
  id as an identifier or key a connection can see or that is shared across a person's contexts** — not for a session,
  a mailbox, presence, a blob, or in a log line that leaves the relay: one person's contexts (an estate, an
  organization's enrollment) must not be linkable by any identifier the relay chooses, shows or logs. The link that
  stays is the connection itself: an operator running two of a machine's relays sees its two connections (OR-5,
  [devices](devices.md#unlinkable-enrollments), What stays linkable). A relay keys its own state by its own
  per-context key; a relay that serves several contexts tells them apart by a pseudonymous per-context id (the
  enrollment key's thumbprint, or an id derived per context that the relay cannot invert), never by the estate (relay
  RLY-08).
- **An organization's member list.** An organization's admission set comes from its member list
  (`orgRelayAdmissionSet`, [membership](membership.md#the-organizations-member-list) OL-4, DEC-0129), under the
  organization's root the relay pins at setup and the key set it applied. A refused candidate leaves the held list, which
  the relay re-reads under the key set it applied now (OR-3, OR-4); a refused held list, or none, admits nobody. Its handshake is
  [the organization's relay](#the-organizations-relay) (DEC-0134).

## The organization's relay

DEC-0134 (CT-37) · code [`src/org-authority.ts`](../../src/org-authority.ts) (`orgRelayAdmissionSet`) and the reference
[`src/relay.ts`](../../src/relay.ts) (`admit`, `sessionStands`) · schema [`relay-frame`](../../schemas/relay-frame.schema.json) (the organization's
`welcome`)

An organization's relay admits the enrollments its signed member list names (OL-4) by the same handshake as an
estate's, with the list in place of the estate record. The list's window (at most 7 days) and the server's duty to draft
a new list when a membership ends (OL-5) bound how long an ended member stays admitted, so the handshake needs no
organization heartbeat or delta.

**OR-1, auth.** A member's node sends the same `auth` frame, signed by an enrollment's `#sig` key the list names, with
`estate` the organization's context id `org:<orgId>`, never the member's estate id (DEC-0128). The relay admits it as
`admit` does, with the organization as the record it admits from (`AuthContext.estate`) and the list's admission set:
the same order, the same one `unauthenticated` answer for every unproven caller, the same one signature's work.

**OR-2, welcome.** The relay answers `welcome` with `{session, list: {org, revision, digest}, limits?}`: the member list
it admits from. It carries no `estateRevision`, `deltaHead` or `heartbeat`, which an organization does not have in this
release; a member's node reads no estate record from an organization's relay. A client tells the two welcomes apart by
`estateRevision` (present on an estate's, forbidden on an organization's), never by `list`: an estate's welcome ignores
any `list`, and an organization's ignores a `deltaHead` or `heartbeat` it should not carry.

**OR-3, open sessions.** An open session stands only while `sessionStands` answers `ok` under the list's admission set.
When the relay applies a newer list (or a key set that changes which administrators the root certifies), it ends every
session whose kid left the set or now names another key (`not-admitted`, close 4403); when the held list's window ends
it ends every session (`expired`, close 4403) and admits nobody until a newer list verifies. A candidate it refuses
leaves the held list: it reads the held list again, without the candidate, for its sessions.

**OR-4, where the relay reads the list.** The relay pins the organization's root when it is set up for it (OM-2's
root route, its fingerprint compared out of band), and reads the key set (`GET .../key-set`) and the member list
(`GET .../authority`, OX-6) from the organization's server at least every hour and when the server tells it of a new
one; it authenticates to the server with a credential the server issues when it sets the relay up (the server's).
Every document it applies is one `verifyOrgKeySet` and `orgRelayAdmissionSet` accept: the server's word adds nothing.
A key set and a list it reads together it applies in one step: `orgRelayAdmissionSet` with the new key set, the held list
and the new list as the candidate, so a set that drops the held list's signer meets the list another administrator
signed (OL-5) and the admission set does not empty between the two. A key set the root signed is applied even when
the list read with it is refused: the relay then re-reads the held list under the new set (OR-3), so when the root
removed the held list's signer and no other administrator's list verifies yet, it admits nobody until one does (OL-5)
and fails closed rather than keep a removed administrator's list. It never checks a list under a key set older than the
newest it verified, and it reads the key set with every list it reads: it passes the key set it holds (its
`{revision, digest}`) to `verifyOrgKeySet` as `held`, and keeps it across a restart, so an older set the root signed is
`stale-revision`.

**OR-5, between members.** On an organization's relay every member is T2 to every other, two enrollments of one owner
included: an enrollment's kid is never in an estate record (UE-1), so no recipient can place it in T1, and no text may
link it to an estate to try. The relay sends no presence from one member to another (DEC-0047). One relay origin serves
one organization (one context per origin, above). A member's node holds no member list (OX-6 serves it to
administrators and the relay only), so it has no key to verify another member's message body under: what an
organization's relay carries between members, and where a recipient gets a member's enrollment key, is not decided
(CT-163). An operator that runs both a person's estate relay and an organization's relay sees one machine's two
connections; that link stays ([devices](devices.md#unlinkable-enrollments), What stays linkable). One disclosure is
named, not closed: `unknown-recipient` (a `send`, and a blob PUT's step 7) tells a member whether an enrollment kid it
holds, for instance from a `deliver` frame's `from`, is on the current list, which OX-6 otherwise keeps from members;
whether an organization's relay answers it differently is part of CT-163.

## Messages

- **`send`**: `{to, msgId, body, ttl}`.
  - `to` is a recipient's `#sig` key id.
  - `body` is base64url, at most 765 KiB decoded (`MAX_BODY_BYTES`): its base64url and the largest rest of a frame,
    every string escaped, fit 1 MiB.
  - `ttl` is 1 s to 7 days (FAC-SEM-071). It bounds how long the relay keeps the message in a mailbox, and nothing
    else: a recipient judges a message's life by its signed `exp`.

  The relay appends the message to the recipient's mailbox and answers `accepted` with `{replyTo, msgId, seq}`, where
  `seq` is monotonic per mailbox.

  It refuses with an `error` (with `replyTo`), and the connection stays open:
  - `unknown-recipient`;
  - `too-large`;
  - `rate-limited`: the node went over a limit the relay advertises; it carries `retryAfter` (seconds) and the frame
    is dropped;
  - `mailbox-full`: the recipient's mailbox holds the relay's advertised `mailboxMessages` or `mailboxBytes`.

  A repeat of the same `msgId` from the same sender within its `ttl` answers the first `seq`, also after the message
  was acknowledged: the relay keeps a tombstone of `(from, msgId)` until the `ttl`.
- **Limits.** Each relay chooses its own numbers and advertises them in `welcome.limits`, every member optional:
  `sendPerMinute`, `presenceQueryPerMinute`, `deltaQueryPerMinute`, `mailboxMessages`, `mailboxBytes` (omitted while the
  relay has no byte quota) and `blobBytes` (at most `MAX_BLOB_BYTES`).
- **`deliver`**: `{from, msgId, seq, body, sentAt}`, in `seq` order, to every connection the recipient holds. `from`
  is the kid the relay admitted on the sender's connection. `deliver` has no `to`.
  - The recipient answers `ack` with `{seq}`. A body it verified whose payload type it does not know is acknowledged
    and dropped, so such messages never fill its mailbox (DEC-0146); a payload type added later must therefore tolerate
    being dropped by a recipient that predates it, or be sent only once the recipient's pin admits it. DEC-0146 keeps a body the recipient
    cannot verify under its refusal's handling: `unknown-sender` and `not-yet-valid` may pass once it applies a revision or the sender's clock is
    behind it, and what a member does with another member's body on an organization's relay is CT-163's. Acknowledged and expired messages are deleted.
  - Delivery is at least once.
- **The body is end to end** (`fabric-relay-message/1`): a compact JWS with `alg: ES256` and
  `typ: fabric-relay-message+jwt`. Its payload is the RFC 8785 bytes of `{type, from, to, msgId, iat, exp, payload}`;
  `exp` is signed, so a relay that changes a frame's `ttl` changes nothing a recipient checks. The JWS header is exactly
  `{alg, typ, kid}`: `kid` is optional and, when present, the signed `from`.
  - A recipient (`verifyMessageBody`) checks the body against what it expects: `from` and `msgId` from the `deliver`
    frame, and `to` **its own `#sig` kid**, never a value a relay asserts. It refuses, by name and in this order:
    `malformed` (not a three-part JWS; a header or payload that is not an object; a header or payload whose bytes are not
    its own RFC 8785 form, so pretty-printing and a duplicate member included; another `typ` or payload `type`; a header
    member other than `alg`, `typ` and `kid`, so `crit`, `b64`, `jwk`, `jku`, `x5u` and `x5c` included; a payload whose
    members are not exactly `type`, `from`, `to`, `msgId`, `iat`, `exp` and `payload`; a time that is not an instant; a
    `from` that is not a string; a header `kid` that is not the signed `from`) — every `malformed` before anything else;
    `unsupported-alg` (another `alg`, or an Ed25519 sender); `unknown-sender`; `bad-key`; `bad-signature` (including
    high-S); `mismatch` (the signed `from`, `to` or `msgId` differs from what it expects); `not-yet-valid` (`iat` more
    than 60 s ahead); `lifetime-too-long` (`exp` not after `iat`, or more than 7 days after it); `expired`
    (`now ≥ exp`).
  - **The replay window** (`checkReplay`). A recipient keeps each accepted `(from, msgId)` until that body's signed
    `exp` and refuses a second delivery as `replay`; it acks the duplicate without acting on it, or the relay redelivers
    it until its `ttl`. After `exp` the body is `expired` whatever the store holds, so the window is the message's signed
    life (at most 7 days) and a relay cannot push a replay past it.
  - A payload that must stay secret from the relay carries a secret envelope, a personal `fabric-credential-envelope/1`
    ([credentials](credentials.md#the-envelope), DEC-0111), or, for a call between machines and its answer, a sealed
    `fabric-agent-call/1` ([machine calls](machine-calls.md#the-sealed-call), DEC-0106), or, for a machine's report to
    its hub, a sealed `fabric-machine-report/1` ([the machines' report](#the-machines-report), DEC-0132).
- **Presence**: `presence` frames `{kid, state: online | offline, lastSeen}` go only to machines of the same owner. An
  organization's relay sends no presence from one member to another. A node may ask with `presence-query` `{kids}`
  (at most 256). The relay answers with one `presence-result` `{replyTo, presences: [{kid, state, lastSeen}], unknown:
  [kid]}`: every asked kid appears exactly once, and `unknown` holds a kid outside the asker's owner and a kid never
  seen, alike, so nothing leaks across owners. On an organization's relay every other member's kid is `unknown` (OR-5).
- **A relay never reports a command done.** A queued message stays queued with its `seq`. Only the recipient's own
  signed message back reports an outcome (Fabric ADR-0088's offline rule).

## Trust tiers

- **Relay traffic is never T0.** T0 is work on one machine (DL-25).
- **The tier is the recipient's decision**, taken from the body's verified `from`, never from the connection the
  frame arrived on.
  - **T1** is an enrolled machine of the recipient's **same owner** (DL-25), listed in the current record and not
    revoked: `relayCallerTier` places it, and `machineCallVerdict` judges its call by the two machines' profiles
    ([machine calls](machine-calls.md), DEC-0106). DL-26 applies.
  - **T2** is anything else, including every member of an organization to every other, on its relay (OR-5), and a
    body signed by an outsider and forwarded by a T1 machine's session; the one exception is that on the estate's
    relay `relayCallerTier`'s `unknown-state` is a denial, not T2, and its call is refused (DL-28, DEC-0106). DL-8 applies; a `fabric-agent-call/1` from a T2 sender is refused and not answered, since calls over the
    relay from outside the estate are not decided ([machine calls](machine-calls.md#the-sealed-call), DEC-0106).

## The secret envelope

A placed package's secret moves to a machine only where the package declares it
([`secret-envelope.schema.json`](../../schemas/secret-envelope.schema.json), `fabric-secret-envelope/1`); a credential
an agent asks for, and one moved between one person's machines outside a placement, travel in
`fabric-credential-envelope/1` ([credentials](credentials.md#the-envelope), DEC-0111).

- **Seal.**
  - HPKE (RFC 9180), base mode;
  - suite DHKEM(P-256, HKDF-SHA256) / HKDF-SHA256 / AES-128-GCM, `[16, 1, 1]`;
  - recipient: the target's `#kem` key;
  - `info`: the ASCII bytes `fabric-secret-envelope/1`;
  - the AEAD's additional data: the RFC 8785 bytes of the header;
  - checked against RFC 9180 §A.3.1.
- **Header:**
  - `type`;
  - `alg`: `ES256`, signed with the rest;
  - `agentRef`: the placed agent the slot belongs to — one slot name can belong to two agents;
  - `suite`;
  - `recipient` (`#kem`);
  - `sender` (`#sig`);
  - `slot`: the credential's name, never its value, at most 64 characters like a package's secret names;
  - `placement`: the estate revision that placed the secret here;
  - `envelopeSequence`: the sealer's sequence for `(agentRef, slot)`, an integer from 1 to 2^53 − 1 (DEC-0066);
  - `iat`, `exp`, with a life of more than zero and at most 24 h;
  - `enc`: the encapsulated key, an uncompressed P-256 point.
- **The envelope** is `{header, ct, sig}`.
  - `sig` is the sender's ES256 signature, low-S, over the RFC 8785 bytes of `{header, ct}`.
  - Its **digest**, the name a relay stores it under, is `sha256:` followed by the hex SHA-256 of the envelope's
    RFC 8785 bytes (`envelopeDigest`).
- **Seal** refuses a recipient kid that does not end `#kem` and a sender kid that does not end `#sig`.
- **The sealer's sequence.** The sender keeps, per `(agentRef, slot)` and durably beside its vault slot, the last
  sequence it sealed, and seals a new value under `last + 1`. A sealer that lost that record starts at
  `max(last + 1, now)`, now in milliseconds since the epoch. **A sealer never seals under a sequence it used**: a re-send
  sends the stored envelope's bytes, or seals again under the next sequence.
- **Open** (`openEnvelope`). The target opens only when, in this order:
  1. the envelope has exactly the schema's shape and its `iat` and `exp` are real instants (`envelopeShape`, held equal
     to the schema by a parity test);
  2. `alg` is `ES256`;
  3. `recipient` is its own `#kem` key;
  4. the sender's key is usable: an Ed25519 key is `unsupported-alg`; a key the record does not list, any other key that
     is not a valid P-256 key, and an encapsulated key that fails SEC 1 are `bad-key`;
  5. the signature is 64 canonical bytes, low-S, and verifies;
  6. the latest estate-record revision this machine verified and applied places `(agentRef, slot)` on it from the
     sender's machine in a personal secret placement — one with no `context`, or `context: "personal"`
     ([estate record](estate-record.md), DEC-0055, DEC-0082). An envelope names no context: an organization's secret
     placement is filled on its own machine and never admits a secret envelope (a credential its organization issues to it
     arrives in a `fabric-credential-envelope/1`, which names the context, DEC-0111), whatever its position among the machine's
     secret placements ([contexts](contexts.md#one-instance-per-context-on-a-machine));
  7. `placement` is at least the revision from which that placement holds unchanged (the current placement run), and at
     most the latest revision this machine has applied. An envelope sealed under a placement since replaced, or placed
     by a revision the target has not yet fetched and verified, is `placement-stale` (`estateEnvelopeContext` derives 6
     and 7, the sender's key and the applied revision from the applied revisions);
  8. **its mark of the run** (`lastOpened`) allows it: a mark of an earlier run does not apply; a sequence below the
     mark, or a mark claiming a run that has not started, is `replayed`; the mark's own sequence passes only for the same
     envelope (the same `envelopeDigest`, a repeat delivery), and another envelope at it is `sequence-reused`;
  9. `iat` is at most 60 s ahead;
  10. the life is more than zero and at most 24 h;
  11. `now < exp`;
  12. HPKE opens.

  A refusal names the first check that failed:
  - `malformed`;
  - `unsupported-alg`;
  - `wrong-recipient`;
  - `bad-key`;
  - `bad-signature`;
  - `sender-not-allowed`;
  - `placement-stale`;
  - `replayed`;
  - `sequence-reused`;
  - `not-yet-valid`;
  - `lifetime-too-long`;
  - `expired`;
  - `cannot-open`.

  `replayed` and `sequence-reused` are envelope refusals; the relay error `replay` (a used nonce) is another thing.
- **The mark.** A successful open returns the mark `{agentRef, slot, since, sequence, digest}`; the target writes the
  secret and the mark **in one transaction**. Nothing is stored after a refusal. A crash between the two writes is safe,
  because the same envelope passes again. When a revision removes the placement, the target deletes the secret and its
  mark together; a later placement starts a new run.
- **Residual risk.** A target that loses its marks together with its vault accepts any valid, unexpired envelope of the
  current run; the 24-hour life bounds that.
- **Logs.** An opener SHOULD log `envelope.open` with `{outcome, refusal?, sender, agentRef, slot, placement,
  envelopeSequence, heldSequence?, since?, digest}`, and never `ct`, `enc`, `sig` or the secret. `replayed` and
  `sequence-reused` are logged at warning level: a rollback attempt, a late delivery after a rotation, or a sealer bug.

## Blobs

- **A blob's name is always `sha256:` and the hex SHA-256 of its bytes.** An envelope's name is its `envelopeDigest`.
  A package travels as the bytes of its archive and is named by their SHA-256; its DEC-0050 content digest is a
  different number and is not its blob name.
- **Upload.** A sender uploads a blob with `PUT /v1/blobs/<digest>`, carrying `Fabric-Relay-Request`. That is an ES256
  signature over the RFC 8785 bytes of `{type: "relay-blob/1", alg: "ES256", relay, method, digest, recipients,
  iat}` (`relayBlobSigningInput`).
  - The signature is accepted within 60 s of `iat`.
  - It is bound to the method, the digest and the recipients, so replaying it only re-uploads the same bytes. It is
    not a bearer credential.
  - A device's requests to its organization server carry a different signature under the same `#sig` key: an RFC 9421
    HTTP message signature with a nonce ([devices](devices.md#transport), DEC-0056). The two never sign the same
    bytes: RFC 8785 JSON starts with `{`, an RFC 9421 signature base with `"@method"`.
- **The header's wire form** (annotated 2026-10-12; `parseRelayRequest`, `relayRequestHeader`):
  - `Fabric-Relay-Request` is base64url without padding of the RFC 8785 bytes of `{alg, kid, recipients, iat, sig}`:
    `kid` the signer's `#sig`, `sig` the signature above.
  - At most 8192 bytes; a longer value is refused 431 `too-large` before it is decoded.
  - Parsed strictly, else 400 `malformed`: canonical base64url (re-encoding gives the same string), bytes that are
    their own RFC 8785 form, exactly those five members, `recipients` 1–64 distinct `#sig` kids of at most 256 characters,
    `iat` a real instant.
- **The order of checks** (DEC-0066). Authenticate, then authorize, then touch state, then answer:

  | # | Check | Answer on failure | Who |
  |---|---|---|---|
  | 1 | the header's form | 400 `malformed`, 431 `too-large` | `verifyBlobRequest` |
  | 2 | `alg` is `ES256` | 401 `unsupported-alg` | `verifyBlobRequest` |
  | 3 | the recipients and the signer's kid; `iat` a real instant | 400 `malformed` | `verifyBlobRequest` |
  | 4 | `iat` within 60 s either way | 401 `unauthenticated`, 401 `not-yet-valid` | `verifyBlobRequest` |
  | 5 | a PUT: `Content-Length` present and at most `MAX_BLOB_BYTES` (32 MiB) | 411 `malformed`, 413 `too-large` | the relay |
  | 6 | **the signer's key is in the current admission set and the signature verifies under it** | **401 `unauthenticated`**, one answer for an unknown kid, a revoked one, a relay that holds no record and a bad or high-S signature | `verifyBlobRequest` |
  | — | *the signer is now proven* | | |
  | 7 | a PUT: every recipient is in the admission set | 403 `unknown-recipient` | `verifyBlobRequest` |
  | 8 | a PUT: the body, read through a counting, hashing reader, is at most the declared length and `MAX_BLOB_BYTES` | 413 `too-large` (the connection is closed) | the relay |
  | 9 | a PUT: the bytes hash to the path's digest | 422 `digest-mismatch` | the relay |
  | 10 | a PUT: the state. Not held, expired or done: stored, 201. The same recipient list: 200, and an object found lost is restored. Another list: 409 `recipients-mismatch`, never merged | as shown | `decideBlobAccess` |
  | 10 | a GET: a live record, the object present, the signer among its recipients, the signed list equal to the stored one letter for letter: 200 `application/octet-stream`. Anything else — not held, expired, not a recipient, another list, an object lost — is one 403 `not-admitted`, never 404 | as shown | `decideBlobAccess` |

  Every refusal carries the body `{"error": {"code", "message"}}`, `content-type: application/json` and
  `cache-control: no-store`, the shape of the WebSocket `error` frame.
- **What each party learns.** A forged or unknown signer learns nothing about blobs or admission: its answer depends
  only on its own request's bytes. An admitted, proven non-recipient learns nothing by a GET, and nothing by a PUT
  without the bytes (422 whatever the state). A PUT with the exact bytes learns whether a blob of those bytes is held
  under another list (409): holding the bytes is holding the content, and a content-addressed store reveals this to
  whoever holds it. On an estate's relay, which kids are admitted (step 7) is told only to a proven machine of the same
  owner, which presence already tells; on an organization's relay it is told to any member (OR-5). The relay's log keeps the real reason of every step-6 and step-10 refusal, never the header or a
  signature. A GET signature reused within its 60 s fetches the same blob for the same machine again, which reveals
  nothing new.
- **Retention.** A relay keeps a blob until every stored recipient fetched it (counted per kid), or until 7 days pass,
  whichever comes first; a blob nobody fetched in 7 days is deleted without notice.

## Revocation and heartbeat

The documents are DEC-0054's ([revocation delta](revocation-delta.md)): `revocation-delta/1` entries, each one
revocation signed by an estate key (a hub key the estate record certifies) and chained by RFC 8785 hash, and
`heartbeat/1`, the signed commitment to the delta's head and the estate revision.

- **What the relay carries.** It carries them unchanged: a page of entries (`{head, entries}`, at most 256) in a `delta`
  frame, a heartbeat in a `heartbeat` frame (both typed by [`relay-frame.schema.json`](../../schemas/relay-frame.schema.json)
  against DEC-0054's schemas). On an estate's relay `welcome` sends its `deltaHead` and its latest heartbeat (or
  `null`), and the relay pushes each new one to every connected machine of the estate the object names; an
  organization's relay sends neither (OR-2).
- **Where the relay gets them** (DEC-0066). An admitted hub machine sends `delta` and `heartbeat` frames on its own
  session. The relay accepts one only when it verifies under the record it holds, by DEC-0054's own rules: an entry or
  heartbeat signed by an estate key — the `hubKey` the held revision certifies for exactly one machine, as DL-14's
  `hubKeyCertified` and DEC-0060 certify it, revoked neither by the record nor by an entry applied before
  (`estateSigner`) — applied through `applyDelta` and `acceptHeartbeat`, with the delta's sequence and `sha256` chain
  unchanged (the next sequence, `prev` its head). The relay never stores what does not verify and never rewrites a
  page. A page `applyDelta` refuses is answered `error` with `applyDelta`'s own problem code in its message — `gap`
  included, so the hub resends from the relay's head — and the relay applies exactly what DEC-0054 applies: a page that
  forks the chain (`fork`) or breaks it (`broken-chain`) with correctly signed entries is not carried as the chain, but
  the revocations of its correctly signed entries — forked and broken-chain alike — stay in force (RD-10,
  `effectiveRevocations`) and leave the admission set like any other.
- **Catching up.** A node behind the head asks with `delta-query` `{fromSeq}`, its applied head's sequence plus one, and
  is answered with `delta` pages carrying `replyTo`, and an empty page at the head.
- **The anchor** (DEC-0107). When the revision the relay holds carries a `deltaAnchor`, the relay applies it with
  `anchorDelta` after it applies the revision (admission stays the revision's alone, `relayAdmissionSet`, so a machine
  the revision removes leaves at once), so a relay deployed or restored after a hub move carries the chain from the anchor
  instead of refusing the old hub's entries as `revoked-signer` and the new hub's as `gap`. It answers a `delta-query`
  whose `fromSeq` is at or below its anchor from the anchor's next entry; a machine that needs no entry below the anchor
  holds a revision that carries it, and one that does not applies that revision first. When `anchorDelta` refuses
  (`unreconciled`, `fork`, `malformed`), the relay keeps its delta as it was, logs the answer and carries the chain again
  once a revision that reconciles arrives; unlike a machine, it does not refuse the revision.
- **Delay is detected; forgery is impossible.** A relay that withholds an entry is detected by the heartbeat: its head
  is signed by a key the relay does not hold, and a node that has not applied up to it, or whose heartbeat is more than
  72 hours old, refuses what arrives from other machines ([the 72-hour rule](revocation-delta.md#the-72-hour-rule)). A
  relay cannot invent an entry, because each entry is signed, and an unsigned or altered one it injects is refused
  without marking the node broken.
- **The admission set.** A relay that applies the delta subtracts its revocations from the admission set too
  (`relayAdmissionSet`'s `extraRevocations`, from `deltaRevocations`), so a revoked machine is turned away, and its open
  sessions closed 4403 (see [Admission](#admission)), within one push rather than at the next revision.
- The window lease is DEC-0062's.

## The machines' report

DEC-0132 (CT-152), DEC-0139 (CT-161), DEC-0146 (CT-172) · schemas [`machine-report`](../../schemas/machine-report.schema.json),
[`machine-report-sealed`](../../schemas/machine-report-sealed.schema.json) · code
[`src/machine-report.ts`](../../src/machine-report.ts) · vectors
[`fixtures/vectors/machine-report.json`](../../fixtures/vectors/machine-report.json), written by
[`tools/vectors/machine-report.ts`](../../tools/vectors/machine-report.ts) · rules `FAC-SEM-152`, `FAC-SEM-154`

Each machine tells its estate's hub what it applied and what it spent. A check-in to an organization server carries
none of it (DEC-0128 UE-2), so the report goes over the relay, sealed so the relay reads none of it. Three readers
depend on it: the hub's key rotation (DL-15), the hub move's step 6 ([ceremonies](ceremonies.md#move-the-hub)) and the
window lease's [reporting](window-lease.md#reporting).

**MR-1, the report.** `machine-report/1` is `{type, machine, at, records}`: `machine` the reporting machine's id in the
estate record, `at` when it wrote the report, and `records` the check-in's members by the same names and shapes
(DEC-0053, DEC-0056, DEC-0062): `estateRecord` (`revision`, optionally `digest`), `heartbeat` (`sequence`, `at`),
`revocationDelta` (`sequence`, `sha256`) and `leases` (`[{leaseId, expiresAt, spent}]`): every lease the machine holds,
and the newest expired lease of each slot whose window instance has not ended, each with its latest `spent` (optional
as in the check-in, except on a lease a hub key revoked by the revision the report names signed, which always carries
it, MR-5, DEC-0146; a `spent` covers the whole instance, so the newest lease of a slot speaks for its earlier ones,
[reporting](window-lease.md#reporting)). The newest lease of a slot is the one with the highest `sequence` among the
slot's leases one hub key signed (WL-11 orders them so); after a hub move a machine names the newest of each hub key it
held a lease of in that instance, the old hub's too, so the new hub reads what the old hub's leases spent (DEC-0146). A
lease of a hub key a revision the machine applied revokes is ended there, though its `expiresAt` is later: the meter
spends nothing more under it (WL-6), and later reports keep naming it, with its `expiresAt` unchanged, until its window
instance ends. `estateRecord` is required; each lease is named once (`FAC-SEM-152`); `at` is a relay time
([Times](#keys): `Z`, an upper-case `T`, at most nine fraction digits; `FAC-SEM-154`, DEC-0146). A report therefore
holds the machine's whole state, and the newest report alone tells the hub everything. A report names at most 64
leases (the check-in's `leases`): while leases name only the `estate` scope, a machine names at most six per hub key
whose leases it holds (one instance of each of the three windows, a held and a newest-expired lease each), so 64
holds ten hub keys; a hub signs no `project:` or `grant:` lease until
the revision that admits them decides the report's cap with them, and a machine never drops a lease to fit (DEC-0146).

**MR-2, to whom and when.** Every machine of the estate sends a report to each **hub machine**, a machine other than
itself whose `hubKey` one of these revisions certifies:
- the revision it applied (during a planned move its first revision certifies two machines, the old hub and the new
  one: both get the report);
- and a newer revision it verified but refused (`unreconciled`, or a delta anchor it could not apply), so a machine
  left on its parent after a move still reaches the new hub that drafts the revision it needs (the hub move's
  [step 6](ceremonies.md#move-the-hub)). A send the relay refuses is dropped, never resent as such: `unknown-recipient`
  (a removed machine), `mailbox-full` and `rate-limited` alike, the next report carrying the whole state in its place
  (after `rate-limited`, not before its `retryAfter`; DEC-0139). A send answered `internal`, or whose `accepted` never
  came, may go again under the same `msgId`, which the relay's tombstone keeps one message.

It sends one:
- after it applies a revision, accepts a heartbeat or applies a delta page, at most once a minute (later changes wait
  for the next report);
- once at or after each of its leases' `expiresAt`, so the lease's final `spent` reaches the hub soon (later reports
  keep naming it until its window instance ends, MR-1);
- and at least every 24 hours (`MACHINE_REPORT_INTERVAL_SECONDS`) while it holds a lease or applies the estate's
  records.

Each send is sealed to the `#kem` the newest of those revisions lists for that hub machine: when the revision it
applied and a newer one it refused list one hub machine with two keys, the newer one's, since the hub that drafted
it holds that key (DEC-0146). On the hub's own machine the node that applies the estate's records serves
`machine.report`, Fabric's own node included (DEC-0146).

A report is never answered. A lost one is replaced by the next, since each report carries the whole state, never a
change. On the hub machine itself the hub reads its own node's report over the [local channel](local-channel.md),
never the relay: it calls the node's `machine.report` (no params), which answers `{report}`, the node's whole state as
a `machine-report/1` written at the call (its own `at`), or `null` while the node applies no estate records: no report, so the hub keeps what it holds for its machine (DEC-0146). The hub
calls it when it connects, before each division and at least every 24 hours, and reads the answer as MR-4 reads an
opened report (`acceptMachineReport`, DEC-0139): the schema, `FAC-SEM-152` and an `at` that is a relay time
(`FAC-SEM-154`) and not after the moment the answer arrived (`malformed` otherwise, DEC-0146), `machine` equal to its own machine id (`wrong-machine` otherwise) and `at` after the report it
holds (`stale` otherwise); it holds it as that machine's newest report, so the hub machine's own
leases and revision count under MR-5 like any machine's. A node that answers `unknown-method` (pinned before
DEC-0132) has reported nothing: its leases count at their whole amounts, and it has applied no revision the hub can
count, so the hub waits for it as for any machine that has not reported. Any other error answer, or none before a deadline the hub
sets itself (the local channel sets none on a method), reads the same (DEC-0139): no new report, so the hub keeps the
report it holds for its own machine, if any, and reads MR-5 from it; nothing is erased (DEC-0146). The hub passes the
moment the answer arrived, by its own clock, as `notAfter`: a report whose `at` is later is `malformed`.

**MR-3, how it travels.** The report is the inner `payload` of a relay message body (`fabric-relay-message/1`), sealed
to the hub machine's `#kem`, as the newest revision MR-2 names lists it, as `fabric-machine-report/1` `{type, kem, enc, ct}`: HPKE base mode, suite `[16, 1, 1]`
(the [secret envelope](#the-secret-envelope)'s), `info` the ASCII `fabric-machine-report/1`, the additional data the
RFC 8785 bytes of `{type, from, to, msgId, kem}` (the body's own `from`, `to` and `msgId`, so a sealed report copied
into another body does not open), the plaintext the report's RFC 8785 form, at most 65 536 bytes
(`MAX_MACHINE_REPORT_BYTES`). `sealMachineReport` seals it and refuses `malformed`, `bad-key` and `too-large`. The
machine `send`s each new report to the hub machine's `#sig` with a new `msgId` (a resend of the same body after
`internal`, or after no `accepted`, keeps the first `msgId`, MR-2); a body whose signed `exp` is up to 7 days later
reaches a hub that was asleep. A hub machine with no usable `#kem` gets no report; a hub whose own `#kem` the revision
it applied does not list, or whose private half it cannot read or does not match the listed key, names that in its own health: the `degraded` of its
[well-known document](service.md#well-known-document) where it serves `fabric-service/0.1`, otherwise the surface on
which it shows the operator its state, so DL-15's switch, a move's step 6 and its division do not wait on reports in silence (DEC-0139). The entry's
`source` is `machine-report`; it is a setup state (`setup: true`, its reason "sign the revision that lists this
machine's key") while the hub's new `#kem` waits only for a revision the hub drafted and the person has not signed, and
a failure otherwise (a private half it cannot read, or one that does not match the listed key: "replace this
machine's key"), which a watcher reports after 5 minutes (DEC-0146). Fabric's hub, which serves no well-known document
today, shows it on its own machine's row in My network's machines (SCR-23, a setup note while only the person's signature is missing, its error state otherwise). A recipient acknowledges
(`ack`) and drops a body it verified whose payload type it does not know ([Messages](#messages), DEC-0146), so a hub
not yet on DEC-0132 that does so drops a report and its mailbox does not fill with them (whether Fabric's deployed hub does is asked in thread
`5d2ea917`); the machine hears nothing back either way, since a report is never answered.

**MR-4, the hub's reading.** After the body is verified (`verifyMessageBody`) and is not a replay (`checkReplay`), the
hub places the sender with `relayCallerTier`; a sender that is not T1 is ignored, its delivery acknowledged. Then
`readMachineReport` reads it, with the body's `from`, `to` and `msgId`, the sender `relayCallerTier` named, the report
held for that machine and the body's signed `iat` as `notAfter` (DEC-0146): `openMachineReport` refuses, in this order: `malformed` (the sealed object is not the schema's), `wrong-recipient`
(another `kem`), `cannot-open` (HPKE fails, another body's `from`, `to` or `msgId` included), `malformed` (a plaintext
that is not a report in its own RFC 8785 form, that the schema refuses, whose `at` is no relay time (a leap second, a
space for `T`, an offset, a lower-case `t`, ten fraction digits; DEC-0139, DEC-0146), or whose `at` is after the
body's `iat`, read to the millisecond as a clock writing `iat` reads (truncated, never rounded: `.0009996Z` is in the millisecond `.000`), so a report cannot claim to be written later than
it was sent, DEC-0146), `wrong-machine` (the report names another machine than the one
`relayCallerTier` named) and `stale` (its `at` is not after the report the hub holds for that machine, compared to the nanosecond, so two
times less than a millisecond apart still order; a held report whose `at` is no relay time (an offset, a lower-case `t`, ten or more fraction digits, accepted before
DEC-0146) is read as the last nanosecond of its millisecond, its fraction truncated to three digits, so a report within that millisecond is not after it, DEC-0146; the reference reads ten or more digits late today, CT-197). It then reads
the opened report as `acceptMachineReport` does, so a `FAC-SEM-152` finding (a lease named twice) drops it as
`malformed`, as the local read does (DEC-0139); a relayed report that also names another machine, or is not after the
one held, keeps `openMachineReport`'s answer (`wrong-machine`, `stale`), and is dropped either way, and every dropped report's delivery is acknowledged, so a report refused (one sealed to an
old `#kem` during a key change among them) never fills the hub's mailbox. The hub keeps, per machine, the newest report
it accepted. A machine writes `at` from its clock at the moment
it seals the report, never after the body's signed `iat`, which the hub checks, so the body's 60-second bound on `iat`
bounds `at` too.

**MR-5, what the hub reads in it.** The hub reads everything from the newest report it holds per machine. A machine has applied a revision when its newest report's `estateRecord.revision` is
that revision's or above (and, when the report carries `digest` for that same revision, the digest is that revision's).
A lease's final `spent` is the one in a report whose own `at` is at or after the lease's `expiresAt`, or, for a lease of
a hub key a revision revokes, whose `estateRecord.revision` is at or above that revision (the meter spends nothing
under it once it applied that revision, MR-1), never one judged by its delivery: a relay may deliver a report written
before the expiry days later, while the meter could still spend.
The time the [window lease's reporting](window-lease.md#reporting) and `windowRemainder` take for a report is its `at`;
a holder has reported "after the revocation" of a hub move when its newest report's `estateRecord.revision` is at or
above the revision that revokes the old hub's key (never by time: a machine that refused that revision still reports
to the new hub, MR-2, and still spends under the old hub's leases). "Every holder" of the old hub's leases is, for the
new hub, every machine an estate record listed since the window instance began, since only the old hub knew which held
one: a machine whose report at or above that revision names no old-hub lease held none, and a machine removed before
such a report never sends one (DEC-0146). The gate binds the new hub from its first signature, the switch of a planned
move (before the revoking revision), at once after a lost hub; the revoking revision is the one that adds the
`hub-key` revocation to its parent ([Move the hub](ceremonies.md#move-the-hub) step 7). The new hub's division of such an instance then counts
each old-hub lease at the final `spent` reported for it, as an ended lease of that amount, never at nothing (a report's lease entry names no window instance, so the new hub counts each one against every instance the old hub divided for that machine whose bounds hold its `expiresAt` (after its start, at or before its end) (day, week and month alike: never less than its own instance's spend, and in an estate with several windows more than it in the smaller ones, which may then reopen with less or nothing left until they end))
([window lease](window-lease.md#reporting); how the reference orders leases across hub keys is CT-113's). A report entry carries no amount, so a report that
names an old-hub lease without `spent` counts as no report for the gate (the new hub has nothing to count instead), and
the instance stays closed until a report names it or the instance ends (DEC-0146); once the new hub has counted a
lease's final `spent` in a division, a later report naming it without `spent` changes nothing counted. The gate is a move's to another machine, never a
re-key's on the hub's own machine ([Move the hub](ceremonies.md#move-the-hub) step 7). It
opens this way only after a planned move, where the old hub's machine stays and reports its own leases. After a lost hub, the lost machine is removed in the move's own revision and never reports, and its own meter may have held the old hub's leases, so every window instance the old hub divided stays closed to new leases until it ends (a day, a week or a month), whatever the other machines report (DEC-0146).

**MR-6, a machine that does not report** (DEC-0146). DL-15's switch, a planned move's step 6 and the gate of step 7 wait
for every machine the revision lists (step 7's gate for every machine an estate record listed since the window instance
began, MR-5; it ends at the latest when the window instance ends: a day, a week or
a month). A machine that
is off, lost or pinned before DEC-0132 (its node answers `unknown-method`, or it sends no report) keeps them waiting,
with no timeout of their own: signing ahead of it would leave it
refusing the new key's tokens, and an unreported lease counts at its whole amount, which is safe. Fabric shows the wait
(SCR-23, its waiting state, for a key switch, a planned move and the window leases paused after a move): each machine
waited on, since when, and why when known ("its software is too old to
report"), and the person's ways out: bring the machine back, update it, or remove it
([Remove a machine](ceremonies.md#remove-a-machine)), after which DL-15's switch and step 6 no longer wait on it.
Step 7's gate still does: what a machine spent under the old hub's leases is known only from its reports, so a machine
removed since a window instance began, before it reported at or above the revoking revision (before the move, between
its revisions or after), keeps that instance closed to new leases until it ends; the wait says so, and Fabric says so
before the person removes a machine during a move or starts a move while such an instance runs (SCR-23). After a lost hub none of these opens it (MR-5). When the machine waited on is the
hub's own, the way out is to update it: removing it as retired means a planned move ([Move the hub](ceremonies.md#move-the-hub)),
whose step 6 waits on the same machine's report, and declaring it lost removes it in one revision and pauses the windows
it divided until they end (DEC-0146).

## The pairing rendezvous

When a machine joins an estate from afar, the trusted machine opens a **one-time rendezvous** on its relay session and
shows its link; the new machine, not yet admitted, joins it with that link. The link's secret part travels after `#` (a
fragment, never sent in an HTTP request) and the new machine presents it inside the WebSocket, so no credential is in a
URL the relay sees. The rendezvous lives at most 600 s from its opening, carries `pairing-message/1` frames between its
two sides and nothing else — never a mailbox message, a blob or presence — and is burned at the first failure or the first
`abort`. Once both reveals were delivered it is complete and carries exactly one more frame, an `abort`, so a side whose
person said the codes differ tells the other side; any other frame then burns it (`closed`), as `rendezvousVerdict`
reads it ([ceremonies](ceremonies.md#the-rendezvous), DEC-0084). It admits the new machine to nothing: the machine is admitted only once a revision lists it. The rendezvous
frame types are the relay's to add (not decided here).

## Shared vectors

Every refusal of the relay family is data a port runs, not only a test in this repository (DEC-0066).

- **Files.** `fixtures/vectors/relay.json` keeps its legacy members (`machineKey`, `machineKeyOctets`, `auth`,
  `message`, `ed25519`) and carries the case groups `instant`, `relayOrigin`, `admissionSet`, `session`, `admit`,
  `messageBody`, `replay` and `blobRequest`. `fixtures/vectors/secret-envelope.json` keeps its legacy members and carries `cases` and `placement` (the open context
  `estateEnvelopeContext` derives, with a case's `extraRevocations` from applied delta entries, DEC-0082, DEC-0084). A port
  that vendors `src/relay-vectors.ts` refreshes it with the vectors: the runner reads only the groups it knows.
  Each case is one complete context, the input, and `expect`, exactly what the reference returns; a key is a JWK or a
  string of base64 SEC 1 octets; a time is RFC 3339.
- **The runner.** [`src/relay-vectors.ts`](../../src/relay-vectors.ts) (`relayVectorResults`, `envelopeVectorResults`,
  `placementVectorResults`)
  turns the data into the reference's contexts and returns `{group, name, actual, expected}` per case, with no test
  framework, so a port vendors it and runs every case the contract runs. `test/relay-vectors.test.ts` runs it here and
  asserts that every refusal code of `admit`, `verifyMessageBody` with `checkReplay`, `verifyBlobRequest` with
  `decideBlobAccess`, and `openEnvelope` appears in at least one case.
- **The generator.** [`tools/vectors/relay-crypto.ts`](../../tools/vectors/relay-crypto.ts) writes the files
  (`--write`) and checks them (`--check`); a test holds the committed files equal to its output. Its keys are test
  keys derived from published labels, its signatures deterministic (RFC 6979) and low-S, so the check is exact. A vector
  is changed there, never by hand. It also owns the estate-record cases at the `issuedAt` skew boundary.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-070"></a>`FAC-SEM-070` | `secret-envelope` | sealed to a `#kem` key by a `#sig` key under `alg` `ES256`, with the one admitted suite, a life of more than zero and at most 24 hours between real instants, and an encapsulated key that is a valid uncompressed P-256 point |
| <a id="fac-sem-071"></a>`FAC-SEM-071` | `relay-frame` | `auth` names a `#sig` key, `alg` `ES256` and `fabric-relay/0.1`; `send` addresses a `#sig` key, with a `ttl` of 1 s to 7 days and a body of at most 765 KiB decoded |
| <a id="fac-sem-152"></a>`FAC-SEM-152` | `machine-report` | a machine's report names each lease once (DEC-0132) |
| <a id="fac-sem-154"></a>`FAC-SEM-154` | `machine-report` | a report's `at` is a relay time: `Z`, an upper-case `T`, at most nine fraction digits, a day that exists (DEC-0146) |

## Not decided here

- The guest OAuth page and its binding ceremony.
- Hardware attestation formats (OQ-0010 a).
- Grants for the same bytes to a second recipient set: this release keeps 409 `recipients-mismatch`, never merged;
  grants (one record holding several `{recipients, fetched, expiresAt}`) are the next revision's question.
- What an organization's relay answers to a member's `delta-query`, `delta` or `heartbeat` frame: it holds no estate record to verify them under, and an organization has no delta or heartbeat in this release (DEC-0134).
- How a relay serves several contexts (the pseudonymous per-context id of relay RLY-08, with Fabric D8).
- What an organization's relay carries between members, where a recipient gets a member's enrollment key, and whether
  `unknown-recipient` keeps telling a member which kids are listed (CT-163).
- Whether a self-hosted relay federates with the hosted one.
- The frame types that open, join and close a pairing rendezvous (DEC-0084 fixes what it carries, how long it lives and
  when it burns).
