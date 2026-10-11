# P3-03 — the estate record, `estate-record/1`

- **Node:** N17 · **Wave:** 3, last · **After:** P3-01 (packages) and P3-02 (device keys) · **Closes:** V4-ESTATE-RECORD

## Sources

- The first organization server's target architecture v4:
  - §12's row lists machines (the device key and a certificate of the hub's `kid`), packages per machine, secret
    placements, share grants, revocations and a revision; the record is passkey-signed;
  - §3's noun: "each revision signed by the passkey; Fabric hub drafts, passkey signs";
  - §6: placement and move are new revisions;
  - §7: the estate authority is the person's passkey.
- Fabric decision D3 (keys: passkey as estate authority, platform-keystore device keys, certified hub keys), owned by
  Fabric with Project Observatory and this repository. Read Fabric's ADRs read-only for any recorded text, and if D3 is
  not yet recorded, write the record's shape so that it does not prejudge it, and name what is open.

## What to build (one decision)

- The schema and a spec section: revisions monotonic, each referencing its parent's digest (RFC 8785, DEC-0043).
- Machines with device keys (small-order check, DEC-0045) and hub `kid` certificates; packages per machine by
  `agentRef` and digest (P3-01); secret placements as references, never values; share grants (DEC-0039's grant
  shape, `principalKind: external`); revocations.
- The signature: a passkey assertion (WebAuthn). Pin the WebAuthn level in the source ledger and state what is
  verified offline and what is not.
- Rules for a revision that skips its parent, a machine without a valid device key, a package not in its digest, and
  a secret value in place of a reference. Fixtures and vectors.

## Proof

A fixture per refusal, plants, raised floors. The handoff names Fabric (drafts revisions), the hub and Observatory
(reads them) and the check-in fields P3-02 added.
