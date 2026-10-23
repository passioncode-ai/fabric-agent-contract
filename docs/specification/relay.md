# Relay `fabric-relay/0.1`

A relay carries sessions, messages, sealed secret envelopes and package blobs between the machines it admits: one
owner's estate (an organization's members once `org-authority/1`, Fabric D8, gives them a record). **It holds no authority.** End-to-end signatures and seals carry every decision a machine relies on.
A compromised relay can delay, drop or count traffic. It cannot read a secret, forge a message, or replay one past
the recipient's checks. Decided in DEC-0047 and amended in place by DEC-0066 (nothing was deployed); the reference
server is [passioncode-ai/relay](https://github.com/passioncode-ai/relay).

The reference code is in four files:
- [`src/relay.ts`](../../src/relay.ts): admission, blob requests, message bodies and the close codes;
- [`src/secret-envelope.ts`](../../src/secret-envelope.ts): the envelope;
- [`src/p256.ts`](../../src/p256.ts): key validation and the low-S rule;
- [`src/relay-vectors.ts`](../../src/relay-vectors.ts): the runner of the shared vectors (see [Shared vectors](#shared-vectors)).

Shared vectors are in `fixtures/vectors/` (`relay.json`, `secret-envelope.json`, `p256.json`).

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
- **Identity is never the digest.** A message's identity is `(from, msgId)`; an envelope's, for deduplication and
  anti-rollback, is `(sender, agentRef, slot, envelopeSequence)`. `envelopeDigest` is the relay's storage name: ECDSA is
  randomised, so the legitimate signer can always make another valid envelope of the same content.
- **Times** are RFC 3339 UTC: `Z`, an upper-case `T`, at most nine fractional digits, on a day its month has (`instant`,
  through `strictTime`). `2026-02-30`, hour 24 and a leap second `:60` are refused, never rolled forward or compared. A
  time is read to the millisecond: fraction digits past the third are dropped, so `00:01:00.000999999Z` is the instant
  `00:01:00.000Z` (vectors `instant`, and `admit`'s "iat 60.000999999 s ahead"). A signed `iat` more than 60 s ahead of
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
  | the held estate record expired | `expired` | 4403 |
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

   Then it answers `welcome` with `{session, estateRevision, deltaHead: {sequence, sha256}, heartbeat, limits?}`.
   `deltaHead` has the shape of a device check-in's `records.revocationDelta` (DEC-0054's head), so a node passes it on
   unchanged; `heartbeat` is the latest `heartbeat/1` the relay holds, or `null`; `estateRevision` is the verified
   revision (1 or more) the relay admits from, always present; `limits` is what the relay enforces (see
   [Messages](#messages)). Otherwise it answers `error` with the refusal's code and closes 4401. The message is fixed per
   code; the reason (no record, expired, unverified, another estate) goes to the relay's log, never to the client.
4. The relay attributes every later frame on the connection to the admitted `kid`, and to nothing a frame claims.

**A reasonless 4401, seen from the client.** A node or a surface refused with `unauthenticated` and close 4401 learns
no reason, by design. It tells the person, in this order: check that this machine is in the estate's current revision
(not revoked, its device key the one the record lists) — the estate's owner sees that in the hub; then update the client,
since a client that signs high-S or an old protocol is refused the same way. It retries no more often than its backoff,
and never asks the person to re-enter a secret for it.

**The admission set** is the set of `#sig` keys of the machines in the estate record the relay holds, minus revoked
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
- **One context per origin.** A relay origin admits from one record: in this release, one estate. The estate is
  compared inside `admit` and nowhere else (`AuthContext.estate`, the held record's). **A relay MUST NOT use the estate
  id as an identifier or key a connection can see or that is shared across a person's contexts** — not for a session,
  a mailbox, presence, a blob, or in a log line that leaves the relay: one person's contexts (an estate, later an
  organization's enrollment) must not be linkable by the relay's operator. A relay keys its own state by its own
  per-context key; a relay that serves several contexts tells them apart by a pseudonymous per-context id (the
  enrollment key's thumbprint, or an id derived per context that the relay cannot invert), never by the estate (relay
  RLY-08).
- **No organization record yet.** An organization's relay has no admission source of its own until
  `org-authority/1` (Fabric D8) is decided.

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
  - The recipient answers `ack` with `{seq}`. Acknowledged and expired messages are deleted.
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
  - A payload that must stay secret from the relay carries a secret envelope, or, for a call between machines and its
    answer, a sealed `fabric-agent-call/1` ([machine calls](machine-calls.md#the-sealed-call), DEC-0106).
- **Presence**: `presence` frames `{kid, state: online | offline, lastSeen}` go only to machines of the same owner. An
  organization's relay sends no presence from one member to another. A node may ask with `presence-query` `{kids}`
  (at most 256). The relay answers with one `presence-result` `{replyTo, presences: [{kid, state, lastSeen}], unknown:
  [kid]}`: every asked kid appears exactly once, and `unknown` holds a kid outside the asker's owner and a kid never
  seen, alike, so nothing leaks across owners.
- **A relay never reports a command done.** A queued message stays queued with its `seq`. Only the recipient's own
  signed message back reports an outcome (Fabric ADR-0088's offline rule).

## Trust tiers

- **Relay traffic is never T0.** T0 is work on one machine (DL-25).
- **The tier is the recipient's decision**, taken from the body's verified `from`, never from the connection the
  frame arrived on.
  - **T1** is an enrolled machine of the recipient's **same owner** (DL-25), listed in the current record and not
    revoked: `relayCallerTier` places it, and `machineCallVerdict` judges its call by the two machines' profiles
    ([machine calls](machine-calls.md), DEC-0106). DL-26 applies.
  - **T2** is anything else. That includes a machine listed only in an organization record, to a recipient of another
    owner, and a body signed by an outsider and forwarded by a T1 machine's session. DL-8 applies; a `fabric-agent-call/1` from a T2 sender is refused and not answered, since calls over the
    relay from outside the estate are not decided ([machine calls](machine-calls.md#the-sealed-call), DEC-0106).

## The secret envelope

A secret moves to a machine only where a placed package declares it
([`secret-envelope.schema.json`](../../schemas/secret-envelope.schema.json), `fabric-secret-envelope/1`).

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
     placement is filled on its own machine and never admits an envelope, whatever its position among the machine's
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
  whoever holds it. Which kids are admitted (step 7) is told only to a proven machine of the same owner, which presence
  already tells. The relay's log keeps the real reason of every step-6 and step-10 refusal, never the header or a
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
  against DEC-0054's schemas). On `welcome` it sends its `deltaHead` and its latest heartbeat (or `null`), and it pushes
  each new one to every connected machine of the estate the object names.
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

## Not decided here

- The guest OAuth page and its binding ceremony.
- Hardware attestation formats (OQ-0010 a).
- Grants for the same bytes to a second recipient set: this release keeps 409 `recipients-mismatch`, never merged;
  grants (one record holding several `{recipients, fetched, expiresAt}`) are the next revision's question.
- How a relay serves several contexts (the pseudonymous per-context id of relay RLY-08, with Fabric D8).
- Whether a self-hosted relay federates with the hosted one.
- The frame types that open, join and close a pairing rendezvous (DEC-0084 fixes what it carries, how long it lives and
  when it burns).
