# 2026-10-23: moving the hub, and recovering a lost passkey (DEC-0107)

## Objective

CT-89: the two estate ceremonies DEC-0084 left out, asked by the ecosystem readiness review (board thread `b2511678`,
message `c938af7d`).

## Done

- **DEC-0107** and [ceremonies](../specification/ceremonies.md): "Move the hub" (an alert past 24 hours with
  `hubSilence`; a new hub key on a `full` machine, the old one revoked; `hubMove` names a move) and "Recover a lost
  passkey" (revision 1 with two passkeys, `recoveryReady`; a passkey left signs the recovery).
- `src/hub-move.ts`, vectors `fixtures/vectors/hub-move.json` by `tools/vectors/hub-move.ts`, `test/hub-move.test.ts`
  (100% branches).
- Docs: ceremonies, revocation delta, conformance (two rows, the module row), README, DOCMAP; UX JRN-09 #4, ST-032,
  FLW-27, SCN-038, SCN-039, SCR-23's alert state. Backlog: CT-89 done, CT-113 filed.

## Open

- Adoption (CT-113): Fabric's drafter and ceremonies; every machine's alert.
- Recovery from a fork after a move whose old hub kept signing stays the revocation delta's open item.

## Checks actually run

`pnpm run check` and `pnpm vectors:check` (output in the pull request).

## Next task

CT-86 (credentials on request, the call record), due 2026-11-07; then the contract's release.
