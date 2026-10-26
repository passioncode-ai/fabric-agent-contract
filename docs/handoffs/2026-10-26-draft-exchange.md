# 2026-10-26: the draft exchange (DEC-0131), the next task CT-152

## Objective

Give the first organization server and Fabric one way for a server's draft key set or member list to reach the person
who signs it and come back signed (CT-156; request `1822d650`, thread `bd508780`), asked by 2026-10-31 for its N-3 (due 2026-11-04); promised on the board by 2026-10-30.

## Done

- DEC-0131: [membership](../specification/membership.md#the-draft-exchange), OX-1 to OX-6.
  - **Routes** under the issuer: `root`, `key-set`, `key-set/draft`, `authority`, `authority/draft`. The root and key
    sets are public reads; a member list and its draft go only to the organization's administrators and its relay.
  - **Documents.** `org-key-set-draft/1`, `org-authority-draft/1` (`FAC-SEM-151`), `org-root-registration/1`.
  - **Code.** `acceptSignedKeySet`, `acceptSignedAuthority`, `verifyRootRegistration` (`src/org-exchange.ts`).
- CT-156 filed and decided; adoption open. CT-158 filed with the readings' non-blocking findings.

## Checks actually run

- `pnpm run check` on the rebased branch: 105 files, 9 217 tests, UX lint, docs, markdownlint 0 errors, privacy 0;
  `pnpm vectors:check`: 23 files match.
- Blind readings, round 1 (head `f4c1806f`): unit fail (the registration schema did not pin revision 1), seam pass,
  product fail (the claim by an open link carries a secret DEC-0123 links never carry; the root and the owner's
  credential arrived after the draft that names them; OM-2 still left the root's serving to Fabric). Fixed: the root
  is registered first, the claim is a secret checked last, member lists are private, OM-2 names the route.
- Round 2 (head `d2165354`): seam fail (the registration admitted an administrator credential and a root kid the first
  set can never carry, after which the claim is spent), product fail (the glossary and the module header still called
  every draft public). Fixed: the registration checks the credential with `administratorOk` and the kid as an opaque
  id, and refuses a body or root with an extra member, as the schema does; both texts scope public reads to key sets.
  The unit tier of round 2 found the same registration gap.
- Round 3 (head `24052d56`): unit, seam and product pass. Their cheap non-blocking items were applied before round 4:
  the issuer's shape at registration, the claim-not-spent tests, the decision's wording on key-set drafts and OM-7.

## Decisions

- **Public key sets, private lists, signed writes.** Only a signature over the pending draft makes a POST pass.
- **The root first, by a claim.** The owner's Fabric registers the root and its administrator credential with a
  one-time claim the server showed its signed-in page (a bearer secret, never in a link); the server then drafts
  revision 1, and the root's signature over it proves the root.
- **A 7-day lead.** The server drafts the next key set a week before the newest key ends; Fabric reads daily.

## Open

- **Fabric's answer on D8-b** (thread `8d115bed`): a passkey root would change only the signature member.
- **A push of drafts** to the signer's Fabric: not decided.
- **CT-152**, **CT-153**, **CT-155**, **CT-157**, **CT-158** (the readings' non-blocking findings).

## Next task

Merge, answer `1822d650` in thread `bd508780`, then CT-152.
