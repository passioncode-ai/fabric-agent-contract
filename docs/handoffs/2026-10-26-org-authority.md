# 2026-10-26: the organization's member list (DEC-0129), the next task the release of DEC-0127 to DEC-0129

## Objective

Give an organization's relay a signed admission source (CT-37, the last open part of TP-00) that no server signs, as
Fabric ADR-0178 (D8, fabric `cf99c32f`) requires, and answer the board's request `d5cbabfd` (TP-03's organization part).

## Done

- DEC-0129: [membership](../specification/membership.md#the-organizations-member-list), OL-1 to OL-5.
  - **Document.** `org-authority/1`: members by pairwise subject, role, context issuer and enrollment `#sig` keys, at
    most 7 days, `FAC-SEM-150`.
  - **Signer.** An administrator's signing passkey that the root lists in `org-key-set/1`'s new `administrators`
    (`FAC-SEM-146` widened); the register's `org-authority/1` challenge.
  - **Code.** `verifyOrgAuthority` (`src/org-authority.ts`), `orgRelayAdmissionSet` (`src/relay.ts`).
  - **OM-7.** A row for an adaptation plan's organization part (TP-03).
- CT-37: adoption only.

## Checks actually run

- `pnpm run check`: 104 files, 9 180 tests, UX lint, docs, privacy 0. `pnpm vectors:check`: 23 files match.

## Decisions

- **No server signs the list.** ADR-0178 point 2 replaced the plan's signing keys with an administrator's passkey.
- **Administrators live in the key set.** The root already signs it and the person already pins the root, so no new pin.
- **The root stays Ed25519.** ADR-0178 D8-b's passkey root enters as the first set's administrators; a passkey root is
  a later pin form, named on the board.
- **`administrators` is required** in `org-key-set/1`, a narrowing before its first tag (DEC-0127's annotation).

## Open

- **The release.** Tag DEC-0127 to DEC-0129 together; the notes list `organizationPin.iss` and
  `org-key-set/1.administrators` as narrowings (DEC-0119).
- **For Fabric (board thread `8d115bed`).** A passkey root; how a member's estate verifies an administrator's passkey
  over a project's leaving (MC-13, ADR-0178 point 7), since the estate record admits its own passkeys only.
- **CT-143** (the family, T0 over the operator's estate), due 2026-11-07. CT-150, CT-151, CT-152.

## Next task

Merge, tag `v0.1.0+2026-10-26.4` (or the next free suffix) carrying DEC-0127 to DEC-0129 (DEC-0108), answer `d5cbabfd` in
thread `8d115bed`, then CT-143.
