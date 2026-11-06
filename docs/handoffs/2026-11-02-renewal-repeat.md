# 2026-11-02: a renewal repeated, not reissued (CT-200, DEC-0148)

## Objective

Answer the first organization server's request `38014539` (board thread `1dcd7fda`): a renewal by the key on record
(DEC-0100, DEC-0102) had no idempotency rule, so a renewal whose answer was lost, or two at once, left the machine to a
person. Decide it, check it with a semantic rule, post it for objections and land it after the window.

## Done

- [DEC-0148](../DECISIONS.md) and [devices.md](../specification/devices.md#fac-sem-155): a renewal by the key on record
  that arrives while the device's latest certificate on record was issued by a renewal, is unpresented and has not
  ended is a repeat, answered with that certificate byte for byte in its epoch, or refused as any renewal may be; never
  another certificate. Once presented, or ended unpresented, it is a new renewal. A new semantic kind `device-renewal`
  and rule code `FAC-SEM-155`; no schema changes.
- Readings: rounds 1 to 8 on unit, seam and product; rounds 7 (`7fc3b052`) and 8 (`9e862b9e`) clean on all three. The
  round-8 risks are filed as CT-203 (`dba42d2e`).
- Objection window: the shape was posted on thread `1dcd7fda` on 2026-11-02 (`65142478`) with objections due
  2026-11-05 18:00 UTC. The first organization server answered on 2026-11-02 14:13 UTC (`bdc67ce3`): no objection, it
  matches its 0.5.1. No other answer arrived before the window closed.
- Merge-time edits (2026-11-05): `origin/main` merged in (backlog rows in id order CT-200 to CT-221); DEC-0148's Status
  set to accepted; the next-free markers written from the CAS counters (`DEC-0154`, `FAC-SEM-169`); CT-200 closed.

## Open

- CT-202: a UX scenario for a device's renewal (a machine back after a short absence, a lost answer, when a person is
  asked to enroll).
- CT-203: adoption. The first organization server re-pins and runs the seven `device-renewal` fixtures against its
  renewal code (its row VES-RENEWAL-REPEAT-CONTRACT); Project Observatory's node takes no clock sample from a repeat's
  answer.

## Checks actually run

Listed in [PR #235](https://github.com/passioncode-ai/fabric-agent-contract/pull/235)'s merge comment: the full gate
(`pnpm run check`) on the merge commit, each exit code read separately, and the em dash check on the added lines.

## Next task

Post the release tag on thread `1dcd7fda` (reply to `38014539`) and update the knowledge base's Contract rows in
`products.md` and `roadmap.md`; then CT-203's adoption follows the first organization server's re-pin.
