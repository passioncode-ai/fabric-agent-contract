# Handoff — DEC-0041: the meter's grant read, the `call` window, the `task` claim; CO-260 (1)

## Objective

Fabric ADR-0144 amendment 1 in the contract (asked by project-observatory-3d while building the meter, OBS-55):
how the meter reads a grant the hub holds, the `call` window of a per-call refusal, and the `task` claim the
meter keys the `task` window on. With it, Fabric carry-over CO-260 (1): fabric:// credential names matched by
whole words. Written by a Fabric session on branch `agent/dec-0041-meter-20261011`; the contract's owner session
(fabric-agent-contract-75) reviews and merges.

## Done

- DEC-0041 in `docs/DECISIONS.md` (next free `DEC-0042`); no new rule code (`FAC-SEM-050` and `FAC-SEM-052`
  extended).
- `call` window: `schemas/grant-check.schema.json` and `schemas/delegation-refusal.schema.json` (enum value and
  the `call` → `L3` binding); `docs/specification/spend-policy.md` (L3, Grants, Checking),
  `docs/specification/delegation.md` DL-19.
- `task` claim: `schemas/delegation-token.schema.json` (`task`, `$defs/task`); `src/delegation.ts` (`task` typed by
  the verifier, `OPAQUE_ID`, `taskWindowKey`); `src/delegation-rules.ts` (`FAC-SEM-050`: keep the parent's task or
  none, the meter's token keeps it); DL-2, DL-5, DL-24.
- Grant projection: `docs/specification/delegation.md` §The hub's grant projection (DL-23, DL-24), DL-21 step 4;
  `src/grant-projection.ts` (`readProjectedGrant`, `parseGrantRef`, `projectedGrantFile`, `projectionDenial`);
  a reader row in `docs/specification/conformance.md`.
- CO-260 (1): `src/fabric-links.ts` (`nameWords`, `credentialName`, `CREDENTIAL_WORDS`, `CREDENTIAL_PAIRS`,
  `PROMPT_WORDS`, `JWT_SHAPE`, `SECRET_VALUE`, `secretValue`); FL-4 in `docs/specification/fabric-button.md`.
- Glossary (`CONTEXT.md`: Grant projection, Task claim), `docs/DOCMAP.md`.
- Tests `test/meter-grant.test.ts` (18 cases); fixtures 3 positive, 4 negative, 6 semantic, 7 catalogue rows.

## Checks run

- Against `origin/main` (8e49fbd), before the change: 17 of the 18 new cases failed (the module absent was
  stubbed to throw so each case ran), and 5 of the 7 new catalogue rows; the remaining case and rows guard that
  `call` stays out of a grant's limits, which `main` already refuses.
- `pnpm run check` → exit 0: 23 test files, 723 tests (698 before), docs check 0 errors.
- 24 planted defects, each valid code behaving like the missing check, each watched failing and restored
  (failures of the 380 tests in `meter-grant`, `fixtures`, `fabric-button`, `delegation-seams`, `delegation`):

  | # | Plant | Failed |
  |---|---|---|
  | P1 | grant-check `window` without `call` | 2 |
  | P2 | grant-check `call` not bound to L3 | 2 |
  | P3 | refusal `window` without `call` | 2 |
  | P4 | refusal `call` not bound to L3 | 2 |
  | P5 | token schema without `task` | 4 |
  | P6 | verifier does not type `task` | 1 |
  | P7 | onward token may replace the task | 1 |
  | P8 | meter token may drop the task | 1 |
  | P9 | task key read from the callee's session | 1 |
  | P10 | projection behind the token accepted | 1 |
  | P11 | later revision accepted | 1 |
  | P12 | `revoked` not checked | 1 |
  | P13 | `expiresAt` not checked | 1 |
  | P14 | missing file answered `unknown-state` | 2 |
  | P15 | permissions not checked | 1 |
  | P16 | file for another grant accepted | 1 |
  | P17 | grant id grammar admits a path | 1 |
  | P18 | `startsAt` not checked | 1 |
  | P19 | links: substring match (the old rule) | 4 |
  | P20 | links: no pair rule | 3 |
  | P21 | links: a lone pair word passes | 3 |
  | P22 | links: JWT only as a whole value | 1 |
  | P23 | links: no long-secret check | 1 |
  | P24 | links: fragment anchors refused by name | 1 |

  P17 and P24 first survived: a path guard after the grammar covered P17 (the guard was unreachable and is
  removed; the test now names a leading dot, a space, a backslash and 201 characters), and no anchor in the test
  was a credential word (the test now has `#token-usage` and `#session`).

## Open

- Fabric (REQ-37): write the projection (`grantsDir` in `hub.json`, 0600 in 0700, atomic rename on every change)
  and set `task` when a session or run has one.
- Project Observatory (OBS-55): call `verifyMeterToken`, then `readProjectedGrant`; key the `task` window with
  `taskWindowKey`; answer `limit-reached` with window `call` at L3 above `perCallMaxUsd`.
- fabric-agent-adapter: port `readProjectedGrant`, `taskWindowKey` and the whole-word link rule to its kits, then
  repin to this change's merge commit.
- Not decided: the projection on Windows; a meter not beside the hub.

## Next task

The owner session reviews and merges the pull request; then repin fabric-agent-adapter to the merge commit and
port the three helpers with this repository's tests as vectors.
