# 2026-10-26: the draft exchange (DEC-0131), the next task CT-152

## Objective

Give the first organization server and Fabric one way for a server's draft key set or member list to reach the person
who signs it and come back signed (CT-156; request `1822d650`, thread `bd508780`), due 2026-10-30 for its N-3.

## Done

- DEC-0131: [membership](../specification/membership.md#the-draft-exchange), OX-1 to OX-6.
  - **Routes** under the issuer: `root`, `key-set`, `key-set/draft`, `authority`, `authority/draft`, all public reads.
  - **Documents.** `org-key-set-draft/1`, `org-authority-draft/1` (`FAC-SEM-151`), `org-root-registration/1`.
  - **Code.** `acceptSignedKeySet`, `acceptSignedAuthority`, `verifyRootRegistration` (`src/org-exchange.ts`).
- CT-156 filed and decided; adoption open.

## Checks actually run

- See the pull request for the gate and the blind readings on its head.

## Decisions

- **Public reads, signed writes.** A draft holds public material; only a signature over the pending draft passes.
- **The root by a claim.** The server's own sign-in issues a one-time claim; the first signed set proves the root.
- **A 7-day lead.** The server drafts the next key set a week before the newest key ends; Fabric reads daily.

## Open

- **Fabric's answer on D8-b** (thread `8d115bed`): a passkey root would change only the signature member.
- **A push of drafts** to the signer's Fabric: not decided.
- **CT-152**, **CT-153**, **CT-155**, **CT-157**.

## Next task

Merge, answer `1822d650` in thread `bd508780`, then CT-152.
