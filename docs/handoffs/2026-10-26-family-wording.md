# Handoff: the family's wording settled (2026-10-26)

## Objective

Settle the non-blocking findings DEC-0130's blind readings filed as CT-157, so DL-25 to DL-29 read exactly as the
rules they rest on (DEC-0045, DEC-0099, DEC-0106, DEC-0125, DL-26, MD-6).

## Done

- DEC-0137, text only, in [delegation](../specification/delegation.md#the-family-and-the-agent-network):
  - a call without a token runs in the context of the callee instance it reaches;
  - T0 is every process of the owner's account, one the owner did not install included; the money limits, the human
    gates and a product's own approval against a hostile local process (The boundary) hold against it;
  - over the estate's relay `relayCallerTier` decides: `unknown-state` never falls back to T2, a sender that is not T1
    is `unauthenticated`, a call from outside the estate is not decided there;
  - what binds the family adds the credential source and reads the machine profiles as `machineCallVerdict` judges a
    call over the relay;
  - the agent network links its directory (DEC-0104) and includes the family; DL-25's T1 row says "enrolment in the
    owner's estate";
  - a service off the estate: the operator's agents are T2 there, its own owner's processes its own T0; the token is
    issued for `personal` by `urn:fabric:estate:<id>`, once Fabric's issuer serves (MD-5).
- The conformance row, the spec README's delegation row, CONTEXT's Family, delegation.md's header; the heading form of
  DL-27 to DL-29 guarded in `test/delegation-sealed.test.ts`; DEC-0130 annotated; CT-143's earlier status kept.
- Board: the operator's request thread (`198866e6`, reply `a29ffd5e`) told that DEC-0130 answers item 1, the
  platform's reply `550ebf96` included.
- CT-157 closed; CT-167 filed (`docs:check` does not check a link's `#fragment`), CT-168 filed (a mandate against a
  product's protective approval); CT-149 carries the family's scenario and "issued for `personal`".
- Readings: round 1 fail (DL-27's profiles read wider than DEC-0106; CT-167's link count); fixed with the round's risks.
- Round 2 clean (unit, seam, product pass); its risks fixed: the conformance row and CONTEXT's Family carry the
  credential source and the relay-only profiles, CT-168 named in Not decided here, relay.md's T2 bullet, CT-30's T1
  wording.
- Round 3 clean (unit, seam, product pass): two clean rounds; its risks filed as CT-170 and in CT-168 (DL-26's
  MUST NOT against a protective approval).

## Checks actually run

- `pnpm typecheck`, vitest with coverage (106 files, 9 318 tests), `pnpm ux:lint`, `pnpm docs:check` (0 errors),
  `pnpm privacy:check` (0 findings), `pnpm vectors:check` (25 files): exit 0.

## Open

- Blind readings of DEC-0137; then merge and release with the next tag.
- A UX scenario for the family and the off-estate service stays a debt for CT-149's first consumer.

## Next task

Merge and release DEC-0137; then DEC-0138 (CT-169, the first organization server's N-4, due 2026-10-29), then CT-161, CT-164, CT-165,
CT-167, CT-170 by priority.
