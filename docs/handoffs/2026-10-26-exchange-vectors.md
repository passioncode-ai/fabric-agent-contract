# 2026-10-26: the draft exchange's vectors, a role is no authority (DEC-0133)

## Objective

Give the first organization server and Fabric bytes to test the draft exchange against before N-3 (2026-11-04), and
take in Fabric ADR-0180's answers to DEC-0129's open questions (thread `115ef7fb`, message `664b69ad`).

## Done

- DEC-0133 ([membership](../specification/membership.md#the-draft-exchange)):
  - **Vectors.** `fixtures/vectors/org-exchange.json` from `tools/vectors/org-exchange.ts`: digests, `FAC-SEM-151`,
    accepting signed sets and lists, the root's registration and whether its claim may be checked.
  - **The root's answer.** `schemas/org-root.schema.json`.
  - **The issuer's cap.** `verifyRootRegistration` refuses an issuer over 261 characters.
  - **OX-1's wording** and **OL-6**: an attestation's role never proves an administrator.
- CT-158 in part; CT-159 (a project's release) and CT-160 (a root's successor and recovery key) filed from ADR-0180.

## Checks actually run

- See the pull request for the gate and the blind readings on its head.

## Decisions

- **A role is no authority.** The applied key set's `administrators` prove an administrator; no reader checks a role
  against the list.
- **No `type` on the root's answer.** DEC-0131 fixed its shape.

## Open

- CT-158's remaining items, CT-159, CT-160.

## Next task

Merge after the readings, release, tell the first organization server and Fabric; then the next row on the board.
