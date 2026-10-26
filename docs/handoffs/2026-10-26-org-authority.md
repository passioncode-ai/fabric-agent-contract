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
  - **Code.** `verifyOrgAuthority` (`src/org-authority.ts`), `orgRelayAdmissionSet` (also `src/org-authority.ts`, outside the relay's import closure), the admission
    set only: an organization relay's handshake waits on the organization's heartbeat and delta (CT-37 keeps it).
  - **The root's holder.** The organization owner's Fabric, never a server (A-3); OM-8 annotated.
  - **OM-7.** Rows for the member list's `iss` and for an adaptation plan's organization part (TP-03).
  - **UX.** SCN-047 takes ADR-0178's fingerprint check; SCN-049, the administrator signs the list.
- CT-37 stays open for the relay's handshake. CT-153 filed (member-list vectors, the D8 sweep).

## Checks actually run

- `pnpm run check`: 104 files, 9 184 tests, UX lint, docs, privacy 0. `pnpm vectors:check`: 23 files match.
- Blind readings, round 1: unit pass (five risks, fixed); seam fail (the relay's handshake, narrowed); product fail
  (the root's holder, the `iss` row, the passkey type list, DEC-0051 and DEC-0063, scenarios; fixed).
- Round 2: unit pass, seam pass (risks fixed: the admission set moved beside its verifier), product fail (package.md,
  CT-04; fixed). Round 3: unit pass, seam pass (DOCMAP's type list, the shared credential check, the held list's
  refusal; fixed), product fail (SCN-049 against OL-5; fixed with seven smaller lines). Round 4: unit pass,
  product fail (OM-7 lacked the owner's and administrators' outflows; the owner's Fabric had no review duty; fixed).
- Round 5: unit pass; seam pass (verifyOrgKeySet now refuses an unusable administrator, three vector cases); product
  fail (an administrator's credential could be an estate authority; fixed: one credential per organization).
- Round 6: unit pass; seam fail (the register's "one field list for good" rule, qualified by DEC-0119); product fail (a
  refused candidate in DEC-0129 item 4 and conformance; D8-b's estate passkeys as administrators; fixed). The
  administrator's shape now matches the schema.

## Decisions

- **No server signs the list.** ADR-0178 point 2 replaced the plan's signing keys with an administrator's passkey.
- **Administrators live in the key set.** The root already signs it and the person already pins the root, so no new pin.
- **The root stays Ed25519.** ADR-0178 D8-b's estate passkeys are not used: the owner registers a credential for the organization alone, the first set's administrator; a passkey root is
  a later pin form, named on the board.
- **`administrators` is required** in `org-key-set/1`, a narrowing before its first tag (DEC-0127's annotation). It
  `$ref`s the estate record's `authority`, so a consumer vendoring by `schemaClosure` copies 18 schemas for
  `org-key-set` instead of 9.

## Open

- **The release.** Tag DEC-0127 to DEC-0129 together; the notes list `organizationPin.iss` and
  `org-key-set/1.administrators` as narrowings (DEC-0119).
- **For the first organization server.** Its design describes a server-signed `org-authority/1` carrying levels,
  allowances, presets, approvers and listings; DEC-0129 makes it a member list only, signed by an administrator's
  passkey, with the root in the owner's Fabric. Told in the reply on thread `8d115bed`.
- **For Fabric (board thread `8d115bed`).** A passkey root; how a member's estate verifies an administrator's passkey
  over a project's leaving (MC-13, ADR-0178 point 7), since the estate record admits its own passkeys only.
- **CT-143** (the family, T0 over the operator's estate), due 2026-11-07. CT-150, CT-151, CT-152.

## Next task

Merge, update fabric-workspace `knowledge/integration.md` row X-6 (it says `org-authority/1` follows as DEC-0128; it is
DEC-0129) and publish, then tag `v0.1.0+2026-10-26.4` (or the next free suffix) carrying DEC-0127 to DEC-0129 (DEC-0108), answer `d5cbabfd` in
thread `8d115bed`, then CT-143.
