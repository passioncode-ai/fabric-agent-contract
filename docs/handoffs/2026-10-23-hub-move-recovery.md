# 2026-10-23: moving the hub, recovering a lost passkey, and the delta anchor (DEC-0107)

## Objective

CT-89: the two estate ceremonies DEC-0084 left out, asked by the ecosystem readiness review (board thread `b2511678`,
message `c938af7d`).

## Done

- **DEC-0107** and [ceremonies](../specification/ceremonies.md): "Move the hub" (an alert past 24 hours with
  `hubSilence`, offered after reconnecting; a new hub key on an always-on `full` machine caught up with the relay; one
  revision for a lost hub, DL-15's two for a reachable one; the delta anchored behind the readers' pin; `hubMove` names a
  move) and "Recover a lost passkey" (revision 1 with two passkeys, `recoveryReady`; a passkey left signs the recovery).
- **The delta anchor**: `deltaAnchor` in `estate-record/1`, `anchorDelta` and the skip before the signer in
  `src/revocation-delta.ts`, `FAC-SEM-137`; a machine added after a move starts its chain at the anchor.
- `src/hub-move.ts`, vectors `fixtures/vectors/hub-move.json` by `tools/vectors/hub-move.ts`, `test/hub-move.test.ts`
  (100% branches).
- Docs: ceremonies, revocation delta, conformance (two rows, the module row), README, DOCMAP; UX JRN-09 #4, ST-032,
  FLW-27, SCN-038, SCN-039, SCR-23's alert state. Backlog: CT-89 done, CT-113 filed.

## Open

- Adoption (CT-113): Fabric's drafter and ceremonies; every machine's alert.
- Recovery from a fork after a move whose old hub kept signing stays the revocation delta's open item.

## Readings

Round 1: unit pass (its risks fixed: `hubMove` compares kid and key, a machine's first entry); seam one break (after a
move a machine without the old hub's entries could never verify them), fixed by the delta anchor, with its risks (the
heartbeat jump, `unreconciled`, DL-15 for a reachable hub, the tests the conformance row cites, `unknown` alerts);
product three breaks (machine-calls.md still listing CT-89, a move from a machine that was only asleep, what the move
ends), fixed with its risks.
Round 2: unit and seam one break each, the same (`anchorDelta` dropped held entries whose revocation the record did
not list), fixed: `unreconciled`; seam and product: the move's precondition (`current`) could never hold past 72 hours
nor offer the move before them, fixed: caught up with the relay, offered while still silent; product: the anchor's pin
gate, the UX layer, CT-89's receipt, fixed; risks: shared `anchorDelta` vectors, FAC-SEM-137 fixtures, the coverage
include list, the published key set, `unreconciled` after a move.

## Checks actually run

`pnpm run check` and `pnpm vectors:check` (output in the pull request).

## Next task

CT-86 (credentials on request, the call record), due 2026-11-07; then the contract's release.
