# P4-04 — device transport and keys: HTTP message signatures, key roles at enrollment, the revision's digest

- **Node:** N18 · **Wave:** 4 · **Closes:** DEV-HTTPSIG, DEV-KEY-ROLES, DEV-CHECKIN-DIGEST.

## Agreed with the first organization server (2026-10-12)

Its ADR-0007, amended 2026-10-12 (its commit `7a47447`), proposed and accepted by this repository's owner session:

- A TLS-terminating host never sees a client certificate, so a device proves its key by an **HTTP message signature**
  (RFC 9421 subset) on every batch, check-in and rotation request, beside mutual TLS, not instead of it.
- Label `fabric-device`; covered components `@method`, `@target-uri` (built from the server's public base URL, never the
  `Host` header a proxy may rewrite) and `content-digest` (RFC 9530, SHA-256 of the body); parameters in the order
  `created;nonce;keyid;alg`; `keyid` the certificate serial; `alg` `ecdsa-p256-sha256` or `ed25519` from the device's
  `#sig` key (DEC-0053).
- `created` within ±300 s; `nonce` 22–64 base64url characters, required. The server records (serial, nonce) only after
  the signature verifies and keeps it until `created + 300 s`; a repeat answers 401 `signature-replayed`, a missing
  signature or nonce 401 `signature-missing`. The nonce is needed because a check-in carries no sequence of its own, and
  a replayed check-in could bring back an old posture.
- Attribution is unchanged (device and organization from the certificate, each event's person from its epoch's binding,
  FAC-SEM-045); enrollment is unchanged; rotation (`certificate.action: "rotate"`, DEC-0031) is signed by the same key.

## What to build (one decision amending DEC-0031 and DEC-0053)

1. **The binding:** the text above in `devices.md` and `activity.md` (transport), a reference verifier
   `src/http-signature.ts` (signature base per RFC 9421 §2.5, the covered components, the window, the nonce store as an
   interface), vectors a server runs (good, altered body, altered target, stale `created`, missing nonce, repeated nonce,
   a foreign key, the wrong `alg` for the key). Pin RFC 9421 and RFC 9530 in the source ledger with hashes.
2. **Key roles at enrollment (DEV-KEY-ROLES):** FAC-SEM-044 counts roles — exactly one `#sig`, at most one `#kem` — as the
   estate record's FAC-SEM-073 does (DEC-0055); a fixture per count.
3. **The revision's digest (DEV-CHECKIN-DIGEST):** an optional `records.estateRecord.digest` beside `revision` in the
   check-in (additive), so a receiver tells two revisions with one number apart.

## Proof

Vectors the first organization server runs against its server (it will, on its VES-CT3 repin); fixtures per refusal;
plants; floors. Consumer rows: the first organization server (named only so), the collector and Project Observatory's
node (sign every request when the host terminates TLS).
