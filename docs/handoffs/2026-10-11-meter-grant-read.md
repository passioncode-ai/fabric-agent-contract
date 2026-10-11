# Handoff — DEC-0041: the meter's grant read, the `call` window, the `task` claim; CO-260 (1)

## Objective

Fabric ADR-0144 amendment 1 in the contract (asked by project-observatory-3d while building the meter, OBS-55):
how the meter reads a grant the hub holds, the `call` window of a per-call refusal, and the `task` claim the
meter keys the `task` window on. With it, Fabric carry-over CO-260 (1): fabric:// credential names matched by
whole words. Written by a Fabric session on branch `agent/dec-0041-meter-20261011`; the contract's owner session
(fabric-agent-contract-75) reviews and merges. The review of PR #32 is folded in (§Review fixes): Fabric ADR-0144
amendment 2 (Fabric commit `217aff4d`) replaced the `task` window's `tokenJti` fallback with the grant.

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

## Review fixes (PR #32)

- The `task` window's last fallback is the grant, `grant:<ref>`, never a `jti` (Fabric ADR-0144 amendment 2, at
  Fabric `217aff4dfbd6`): `taskWindowKey(claims, grantRef)` takes the grant reference the meter checks and throws
  for one the token does not name. DL-24, the spend policy, `CONTEXT.md`, the conformance row and DEC-0041 say
  the same, in DL-24's words.
- Links (FL-4): the glued forms (`accesstoken`, `sessionid`, `privatekey`, …), `pass`, `passphrase`, `signature`,
  `sig` always; a plural counts as its singular (`apiKeys`, `secrets`); `key` beside `session`, `auth`, `signing`,
  `encryption`, `master`, `client`, `login`, `refresh`; `code` beside `access`, `session`. A long secret counts
  `-`, and each value is also checked as written with a raw `+` kept. Two defects found on the way, both on
  `main` too: a parameter named `constructor` (or any name an object inherits) made `parseFabricLink` throw, and
  a lone `constructor` counted as a pair word; both lookups are now own-property only.
- Projection: one `open` with `O_NOFOLLOW | O_NONBLOCK`, then `fstat` on what was opened (no swap between check
  and read; a FIFO cannot hang the meter); the file is checked against the standing-grant schema (the state left
  to its own rows) and its times must be RFC 3339 with a zone; Windows answers `unknown-state`
  (`unsupported-platform`) before reading (DL-23: POSIX-only in 0.1). DL-23 also states the `PROJECTED_GRANT_ID`
  rule and that two ids differing only in case are never both projected.
- DL-21's steps put the projection read before the reservation; the meter's token keeps `task` (step 1).
- ADR-0144 links are pinned to Fabric commits: amendment 1 at `92cb5124e4f9`, amendment 2 at `217aff4dfbd6`.
- DEC-0041's compatibility line states exactly which links FL-4 now admits (compared with `main`'s rule over
  3 552 generated names: only a name whose one credential word is `key`, `code` or `auth` with no partner, and a
  credential-named fragment piece with no value).

## Checks run

- Against `origin/main` (8e49fbd), before the change: 17 of the 18 new cases failed (the module absent was
  stubbed to throw so each case ran), and 5 of the 7 new catalogue rows; the remaining case and rows guard that
  `call` stays out of a grant's limits, which `main` already refuses.
- `pnpm run check` → exit 0: 23 test files, 723 tests (698 before), docs check 0 errors. After the review
  fixes: 23 test files, 729 tests, UX lint passed, docs check 0 errors.
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
  | P9 | the task key's walk starts at `act.act` (0ae95fe) | 1 |
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

  The review fixes' plants, each watched failing against the 386 tests of the same five files and restored:

  | # | Plant | Failed |
  |---|---|---|
  | R1 | task key falls back to `jti:<second argument>` (the old body) | 2 |
  | R2 | task key falls back to the meter token's own `jti` | 2 |
  | R3 | task key accepts a grant the token does not name | 1 |
  | R4 | links: none of the new always-words | 1 |
  | R5 | links: `key` partners as before | 1 |
  | R6 | links: no plural fold | 1 |
  | R7 | links: a long run without `-` | 1 |
  | R8 | links: query values checked only form-decoded | 1 |
  | R9 | links: fragment values checked only form-decoded | 1 |
  | R10 | projection: any `Date.parse` string is a time | 1 |
  | R11 | projection: no standing-grant schema check | 1 |
  | R12 | projection: the open follows a link | 1 |
  | R13 | projection: the open blocks on a FIFO (the read runs in a child killed at 2 s) | 1 |
  | R14 | projection: Windows reads like POSIX | 1 |
  | R15 | spend policy: the old task-key sentence | 1 |
  | R16 | `CONTEXT.md`: the old task-key sentence | 1 |
  | R17 | links: a lone inherited name counts as a pair word | 1 |
  | R18 | links: a parameter's grammar read through the prototype | 1 |

  R9 first survived: the raw fragment already keeps `+`; the test now has a value mixing an escape and a raw `+`.

  P17 and P24 first survived: a path guard after the grammar covered P17 (the guard was unreachable and is
  removed; the test now names a leading dot, a space, a backslash and 201 characters), and no anchor in the test
  was a credential word (the test now has `#token-usage` and `#session`).

## Open

- Any meter: pass the verified token's `grant` as `readProjectedGrant(…, {tokenGrants})`, so a request's
  `grantRef` the token does not name is `no-grant`/`not-named` before anything is read (DL-24's first row).
- fabric-agent-adapter's port of `readProjectedGrant` validates the file against the standing-grant schema
  (`additionalProperties: false`), so it needs the schema set and an Ajv-equivalent validator, and the hub and
  the meter must share one contract pin.
- Fabric (REQ-37): write the projection (`grantsDir` in `hub.json`, 0600 in 0700, atomic rename on every change)
  and set `task` when a session or run has one.
- Project Observatory (OBS-55, OBS-57): call `verifyMeterToken`, then `readProjectedGrant`; key the `task` window
  with `taskWindowKey`; answer `limit-reached` with window `call` at L3 above `perCallMaxUsd`. Its meter must
  change its last fallback from the request's `tokenJti` to the grant (`grant:<ref>`); Fabric's session tells it.
- fabric-agent-adapter: port `readProjectedGrant`, `taskWindowKey` and the whole-word link rule to its kits, then
  repin to this change's merge commit.
- Not decided: the projection on Windows (a Windows meter answers `unknown-state`); a meter not beside the hub.

## Next task

The owner session reviews and merges the pull request; then repin fabric-agent-adapter to the merge commit and
port the three helpers with this repository's tests as vectors.
