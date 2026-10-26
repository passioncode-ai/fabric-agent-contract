# 2026-10-26: membership attestation (TP-00), the next task CT-122

## Objective

Give Fabric a document it verifies before it trusts an organization's membership (CT-137, the organization train's
TP-00, row N-1), open to any organization server (MD-9 path (a)).

## Done

- DEC-0127 merged (PR #194, `b79bd14c`): [membership](../specification/membership.md), OM-1 to OM-8.
  - **Documents and keys.** `org-membership/1` and `org-key-set/1`. Each organization has its membership root, pinned
    by the person's passkey in the estate record's `organizations` (no administrator's acceptance, R1-D12).
  - **Checks.** `verifyOrgKeySet`, `verifyOrgMembership`, `FAC-SEM-145` to `FAC-SEM-147`.
  - **Ending, suspension, allowlist.** The end of a membership, with DEC-0103 item 4 annotated; suspension; the
    allowlist of what leaves a person's Fabric.
- CT-137 closed. CT-37 is narrowed to `org-authority/1`, which now sits on CT-122's row. CT-151 is filed: the
  estate-record verifier vectors lack every code but `FAC-SEM-076`.
- Board: reply `9451e10d` on request `8e2d5099` (thread `8d115bed`).
- Not released yet: the next tag carries DEC-0127 with DEC-0128.

## Checks actually run

- `pnpm run check` on `0e659f62`: 102 files, 9 106 tests, UX lint, docs, privacy 0.
- `docs:check` and `ux:lint` on the last commit, `72422e72`, which changed Markdown only.
- Blind readings: five rounds. Rounds 4 and 5 found nothing blocking.

## Decisions

- **The signature form.** The contract's RFC 8785 form, not the server's compact JWS.
- **Life.** 24 hours at most, with no grace; an expiry only suspends.
- **Subject and roles.** A pairwise subject; three roles.
- **Keys.** One membership root per organization, distinct from `policyRootKey`.
- **How the node learns of an end.** From the unpinning revision, which Fabric drafts on every end and the passkey
  signs; a revoked certificate alone keeps DEC-0103's meaning.
- **When Fabric writes `organizations`.** Only once every reader is pinned and the node's OM-5 behaviour is measured.

## Open

- **CT-122 (unlinkable memberships, CX-CON-06), due 2026-11-06.** It takes `org-authority/1`, the organization's signed
  list of admitted members (per-context keys), as the relay's admission source (CT-37).
  - Brief: [`docs/evidence/specs/2026-10-24-ct122-unlinkable/brief.md`](../evidence/specs/2026-10-24-ct122-unlinkable/brief.md),
    with twelve shared values and seven operator questions, each with a default.
- **CT-143 (the family), due 2026-11-07.** The proposal is T0 over the operator's estate.
- **CT-150 and CT-151.**
- **Waits:**
  - CT-149: adoption of DEC-0125 and DEC-0126;
  - CT-128: after 2026-10-30;
  - CT-42: thread `c06f2991`.

## Update: DEC-0128 merged

- DEC-0128 (unlinkable memberships, CT-122) merged in PR #196 (`6f3abaa5`):
  - [devices](../specification/devices.md#unlinkable-enrollments) UE-1 to UE-3, `FAC-SEM-148` and `FAC-SEM-149`;
  - [delegation](../specification/delegation.md#keys-publication-and-rotation) DL-14a, context issuers and context hub
    keys.
- Checks: `pnpm run check` gave 9 146 tests. Six blind readings; rounds 5 and 6 found nothing blocking.
- Board reply `41181c8d` on request `a90c37b2` (thread `305f39c3`).
- Filed: CT-152, the machines' report to their hub over the relay. A node adopts UE-2 only after it.
- DEC-0129 is reserved for `org-authority/1`.

## Next task

DEC-0129, `org-authority/1`, the organization's member list only (CT-37), as
[the plan](../evidence/plans/2026-10-26-ct122-org-authority.md) maps it:

- one schema and one register type;
- OM-3 widened so the membership key set's signing keys also sign the list;
- `verifyOrgAuthority` in `src/org-authority.ts`;
- an organization admission source in `relayAdmissionSet` that fails closed (DEC-0047).

Then tag DEC-0127, DEC-0128 and DEC-0129 together (DEC-0108). The release notes list `organizationPin.iss` as a
narrowing (DEC-0119).
