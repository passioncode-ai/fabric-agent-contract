# Relay `fabric-relay/0.1`

A relay carries sessions, messages, sealed secret envelopes and package blobs between the machines it admits: one
owner's estate (an organization's members once `org-authority/1`, Fabric D8, gives them a record). **It holds no authority.** End-to-end signatures and seals carry every decision a machine relies on.
A compromised relay can delay, drop or count traffic. It cannot read a secret, forge a message, or replay one past
the recipient's checks. Decided in DEC-0047; the reference server is
[passioncode-ai/relay](https://github.com/passioncode-ai/relay).

The reference code is in three files:
- [`src/relay.ts`](../../src/relay.ts): admission, blob requests and message bodies;
- [`src/secret-envelope.ts`](../../src/secret-envelope.ts): the envelope;
- [`src/p256.ts`](../../src/p256.ts): key validation.

Shared vectors are in `fixtures/vectors/` (`relay.json`, `secret-envelope.json`, `p256.json`).

## Roles

| Role | May | May not |
|---|---|---|
| relay | admit a machine that proves its device key; queue and deliver opaque messages; store envelopes and blobs by digest; report when a machine was last seen to machines of the same owner; carry signed revocation deltas and heartbeats unchanged | read a body or a secret; decide a trust tier; sign anything a node relies on; report a queued command as done; serve a signing page; send presence across owners |
| node | connect out to a relay; send and receive messages; seal and open envelopes; apply deltas | trust the relay's word for anything a signature does not carry |
| surface | the same as a node, under its own device key | |

## Keys

- **A relay participant's keys are P-256, held in the platform keystore** ([devices](devices.md#device-keys),
  DEC-0053). Each machine has two non-exportable keys, never one key in both roles:
  - a **signing key** (ES256), under the key id `<machine>#sig`;
  - a **key-agreement key** (ECDH P-256), under the key id `<machine>#kem`.

  A secret is never sealed to a signing key, and nothing is signed with a key-agreement key (FAC-SEM-070).
- **ES256 only.** [devices](devices.md#device-keys) admits an Ed25519 `#sig` for a device; a relay participant's `#sig`
  is ES256. The platform keystore holds P-256, and the envelope's `#kem` is P-256 anyway, so one curve serves both
  roles. An Ed25519 `#sig`, or any `alg` other than `ES256`, is refused as `unsupported-alg` (DEC-0047 item 8).
- **The algorithm is named in a signed field.** `relay-auth/1`, `relay-blob/1` and the envelope header carry
  `alg: "ES256"`, and the message body is a JWS whose header says `alg: ES256`.
- **One key, two spellings.** DEC-0053 records a device's public key as base64 SEC 1 octets (65 bytes, `0x04 ‖ X ‖ Y`);
  the relay protocol names keys as JWKs (RFC 7518 §6.2.1). They are the same key: the JWK's `x` and `y` are the
  octets' `X` and `Y`, base64url. `p256Point` and `p256PublicKey` accept either form, and every check gives the same
  answer for both (`fixtures/vectors/relay.json` carries `machineKey` and `machineKeyOctets`).
- **Every public key is validated before use** by SEC 1 v2 §3.2.2 (`p256KeyRefusal`): not the point at infinity,
  coordinates in [0, p − 1], on the curve. The cofactor is 1, so the order check holds for every point on the curve.
  A key that fails is refused as `bad-key`, and nothing is verified or sealed under it.
- **All signatures are ES256**, raw `r ‖ s` (64 bytes), base64url, over RFC 8785 bytes ([canonical
  forms](conformance.md#canonical-forms)).
- **Times** are RFC 3339 UTC with at most nine fractional digits. One that matches the pattern and is not a date
  (`2026-13-45T25:61:61Z`) is refused, never compared. A signed `iat` more than 60 s ahead of the verifier's clock is
  `not-yet-valid`.

## Transport

- **One WebSocket per connection.**
  - It goes over TLS 1.2 or newer (TLS 1.3 SHOULD), to `wss://<relay>/v1/connect`, with the subprotocol
    `fabric-relay.v1`.
  - A relay that receives no matching subprotocol refuses the upgrade.
  - **No credential travels in the URL or in an HTTP header.**
- **Frames** are UTF-8 JSON text frames of at most 1 MiB, each with `{v: 1, type, id}`
  ([`relay-frame.schema.json`](../../schemas/relay-frame.schema.json)).
  - A larger frame is closed with code 1009, a binary frame with code 1003.
  - Unknown members are ignored. An unknown `type` is answered `error` `unknown-type`, and the connection stays
    open.
  - A connection silent for 90 s is closed; `ping` and `pong` keep it alive.
- **Blobs travel over HTTPS by digest**, never in frames (see [Blobs](#blobs)).

## Admission

1. The relay sends `hello` with `{protocol: "fabric-relay/0.1", relay: <its origin>, nonce: <32 random bytes,
   base64url>, time}`.
2. Within 10 s, the machine sends `auth` with `{protocol, alg, estate, kid, iat, sig}`. `sig` signs the RFC 8785 bytes
   of `{type: "relay-auth/1", alg: "ES256", relay, nonce, estate, kid, iat}` (`relayAuthSigningInput`).
3. The relay admits the machine (`admit`) only when all of these hold:
   - the protocol is this one, and `alg` is `ES256`;
   - `iat` is a real instant, at most 60 s old and at most 60 s ahead;
   - the nonce is the one it sent on this connection, and is used once;
   - `kid` is in the admission set;
   - the signature verifies under that key, which is a P-256 key and passes SEC 1.

   Then it answers `welcome` with `{session, estateRevision, deltaHead: {sequence, sha256}, heartbeat}`.
   `deltaHead` has the shape of a device check-in's `records.revocationDelta`, so a node passes it on unchanged;
   `estateRevision` is the verified revision (1 or more) the relay admits from, always present. Otherwise it answers
   `error`:
   - `protocol-unsupported`;
   - `unsupported-alg` (another `alg`, or an Ed25519 key);
   - `not-yet-valid` (`iat` more than 60 s ahead);
   - `unauthenticated`;
   - `replay`;
   - `not-admitted`;
   - `bad-key`.

   After the error it closes with code 4401 (unauthenticated) or 4403 (not admitted).
4. The relay attributes every later frame on the connection to the admitted `kid`, and to nothing a frame claims.

**The admission set** is the set of `#sig` keys of the machines in the estate record the relay holds, minus revoked
machines and keys (`relayAdmissionSet`). Being admitted by a relay makes no machine T1 to another owner's machine (see
[Trust tiers](#trust-tiers)). It keeps strangers out of
mailboxes. **It is not authorization**: a recipient checks the sender itself (see [Trust
tiers](#trust-tiers)).
- **Only from a verified revision** ([estate record](estate-record.md), DEC-0055). The relay pins the estate's first
  passkeys when it is set up for the estate, the same act as a machine's enrollment pin. It applies a revision only
  when it is valid against `estate-record.schema.json` and `verifyEstateRecord` accepts it against the revision it
  holds (revision 1: against the pinned passkeys). A refused revision changes nothing. A relay never starts with a
  configured set. The keys come from `machines[].deviceKeys`, as base64 SEC 1 octets.
- **Fails closed.** When the held revision's window ends, the relay admits no new `auth` until a newer verified
  revision arrives. Sessions already open end at their next re-authentication; queued mail stays until its `ttl`.
  Presence and `lastSeen` follow the same verified set.
- **No organization record yet.** An organization's relay has no admission source of its own until
  `org-authority/1` (Fabric D8) is decided.

## Messages

- **`send`**: `{to, msgId, body, ttl}`.
  - `to` is a recipient's `#sig` key id.
  - `body` is base64url, at most 765 KiB decoded (`MAX_BODY_BYTES`): its base64url and the largest rest of a frame,
    every string escaped, fit 1 MiB.
  - `ttl` is 1 s to 7 days (FAC-SEM-071). It bounds how long the relay keeps the message in a mailbox, and nothing
    else: a recipient judges a message's life by its signed `exp`.

  The relay appends the message to the recipient's mailbox and answers `accepted` with `{msgId, seq}`, where `seq` is
  monotonic per mailbox.

  It refuses with an `error`:
  - `unknown-recipient`;
  - `too-large`;
  - `rate-limited`;
  - `mailbox-full`.

  A repeat of the same `msgId` from the same sender within its `ttl` answers the first `seq`.
- **`deliver`**: `{from, msgId, seq, body, sentAt}`, in `seq` order, to every connection the recipient holds. `from`
  is the kid the relay admitted on the sender's connection.
  - The recipient answers `ack` with `{seq}`. Acknowledged and expired messages are deleted.
  - Delivery is at least once. A recipient deduplicates by `(from, msgId)`.
- **The body is end to end** (`fabric-relay-message/1`): a compact JWS with `alg: ES256` and
  `typ: fabric-relay-message+jwt`. Its payload is the RFC 8785 bytes of `{type, from, to, msgId, iat, exp, payload}`;
  `exp` is signed, so a relay that changes a frame's `ttl` changes nothing a recipient checks.
  - A recipient (`verifyMessageBody`) refuses, by name: a header or payload that is not an object, or of another
    `typ` (`malformed`); another `alg` or an Ed25519 sender (`unsupported-alg`); a body whose signed `from`, `to` or
    `msgId` differs from the frame's (`mismatch`); `iat` more than 60 s ahead (`not-yet-valid`); `exp` not after
    `iat`, or more than 7 days after it (`lifetime-too-long`); `now ≥ exp` (`expired`).
  - A payload that must stay secret from the relay carries a secret envelope.
- **Presence**: `presence` frames `{kid, state: online | offline, lastSeen}` go only to machines of the same owner. An
  organization's relay sends no presence from one member to another. A node may ask with `presence-query` `{kids}`,
  and is answered only for kids of its own owner.
- **A relay never reports a command done.** A queued message stays queued with its `seq`. Only the recipient's own
  signed message back reports an outcome (Fabric ADR-0088's offline rule).

## Trust tiers

- **Relay traffic is never T0.** T0 is work on one machine (DL-25).
- **The tier is the recipient's decision**, taken from the body's verified `from`, never from the connection the
  frame arrived on.
  - **T1** is an enrolled machine of the recipient's **same owner** (DL-25), listed in the current record and not
    revoked. DL-26 applies.
  - **T2** is anything else. That includes a machine listed only in an organization record, to a recipient of another
    owner, and a body signed by an outsider and forwarded by a T1 machine's session. DL-8 applies.

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
  - `iat`, `exp`, with a life of more than zero and at most 24 h;
  - `enc`: the encapsulated key, an uncompressed P-256 point.
- **The envelope** is `{header, ct, sig}`.
  - `sig` is the sender's ES256 signature over the RFC 8785 bytes of `{header, ct}`.
  - Its **digest**, the name a relay stores it under, is `sha256:` followed by the hex SHA-256 of the envelope's
    RFC 8785 bytes (`envelopeDigest`).
- **Seal** refuses a recipient kid that does not end `#kem` and a sender kid that does not end `#sig`.
- **Open** (`openEnvelope`). The target opens only when, in this order:
  1. the envelope is well formed, its `iat` and `exp` real instants;
  2. `alg` is `ES256`;
  3. `recipient` is its own `#kem` key;
  4. the sender's key is a P-256 key and it and the encapsulated key pass SEC 1;
  5. the signature is 64 bytes and verifies;
  6. the latest estate-record revision this machine verified and applied places `(agentRef, slot)` on it from the
     sender's machine ([estate record](estate-record.md), DEC-0055);
  7. `placement` is at least the revision from which that placement holds unchanged; an envelope sealed under a
     placement since replaced is `placement-stale` (`estateEnvelopeContext` derives 6 and 7, and the sender's key,
     from the applied revisions);
  8. `iat` is at most 60 s ahead;
  9. the life is more than zero and at most 24 h;
  10. `now < exp`;
  11. HPKE opens.

  A refusal names the first check that failed:
  - `malformed`;
  - `unsupported-alg`;
  - `wrong-recipient`;
  - `bad-key`;
  - `bad-signature`;
  - `sender-not-allowed`;
  - `placement-stale`;
  - `not-yet-valid`;
  - `lifetime-too-long`;
  - `expired`;
  - `cannot-open`.

  Nothing is stored after a refusal.

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
- **Digest check.** The relay recomputes the digest and refuses a mismatch with `digest-mismatch`.
- **Download.** A `GET` carries the same kind of signature by one of the `recipients`.
- **Retention.** A relay keeps a blob until every recipient fetched it, or until 7 days pass.

## Revocation and heartbeat

- **What the relay carries.** It carries the revocation delta and the timestamp heartbeat as signed objects, without
  rewriting them, in `delta` and `heartbeat` frames. On `welcome` it sends its `deltaHead` and its latest
  heartbeat, and it pushes each new one to every connected machine of the estate or organization the object names.
- **Catching up.** A node behind the head asks with `delta-query` `{fromSeq}`.
- **Delay is detected; forgery is impossible.** A relay that withholds a delta is detected by the heartbeat: its
  head is signed by a key the relay does not hold. A relay cannot invent an entry, because each entry is signed.
- **What DEC-0054 (reserved) owns:** the documents, their keys, the head hash, the 72-hour rule and their vectors.
  The window lease is not decided yet.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| `FAC-SEM-070` | `secret-envelope` | sealed to a `#kem` key by a `#sig` key under `alg` `ES256`, with the one admitted suite, a life of more than zero and at most 24 hours, and an encapsulated key that is a valid uncompressed P-256 point |
| `FAC-SEM-071` | `relay-frame` | `auth` names a `#sig` key, `alg` `ES256` and `fabric-relay/0.1`; `send` addresses a `#sig` key, with a `ttl` of 1 s to 7 days and a body of at most 765 KiB decoded |

## Not decided here

- The guest OAuth page and its binding ceremony.
- Hardware attestation formats (OQ-0010 a).
- Mailbox quotas.
- Whether a self-hosted relay federates with the hosted one.
