# Handoff — delegation sealed (DEC-0045, board run wave 2, P2-03; CT-29)

## Objective

Close node N05 of the [board run](../evidence/specs/2026-10-11-board-waves/canvas.md), packet
[P2-03](../evidence/specs/2026-10-11-board-waves/packets/wave-2/P2-03-delegation-sealed.md): write down the six rulings
of Fabric ADR-0144 amendments 3 and 4 (at Fabric `19ad05ca`) and fix inventory F-B-301, F-B-305…F-B-314,
F-B-317…F-B-319, F-B-321, F-B-322 and TRUST-TIERS, each with a test that fails without its fix. Added mid-run at the
lead's request, first in priority: the security fix CT-29 (a small-order Ed25519 key forges signatures on Node 20
and 22).

## Done

- DEC-0045 in [`docs/DECISIONS.md`](../DECISIONS.md), reserved by git CAS (`agent_sync.py reserve --key
  delegation-sealed-20261012 DEC`); DEC-0039 annotated. Its ten items and *Compatibility* name what Fabric's issuer
  (CT-19), Observatory's meter (CT-20) and the adapter's ports (CT-18) do at their next pin.
- [Delegation](../specification/delegation.md): one grant per token (DL-2, DL-4, DL-5); the meter's five-actor hop
  (DL-6); DL-8 scoped to T2; DL-12 across the boundary; DL-13 rows 1, 3, 5 and 9 and the order; DL-16's
  `delegation` for T2; no `device` approval (DL-17); the meter's one refusal form (DL-19) and the callee's relay
  (DL-21 step 6); **Trust tiers** DL-25, DL-26; The boundary; small-order keys (DL-13 row 3, DL-14).
- [Service](../specification/service.md#operator-session-lifetime): what a descriptor-token rotation is.
  [Spend policy](../specification/spend-policy.md) rule 2: the tiers and the meter's exact scope.
  [Fabric's button](../specification/fabric-button.md) FB-6: the page's partition, a session cookie.
  [Devices](../specification/devices.md#key-sets): no key of small order. [Conformance](../specification/conformance.md):
  three reader rows.
- Code: `src/delegation.ts` (row 5's types and the table's order, a mandatory issuer, the meter's exact scope and
  effect and fifth actor, `refusalFromDenial`, an unusable key as the issuer's fault), `src/delegation-rules.ts`
  (`FAC-SEM-050`: one grant, depth, spend against grant and parent), `src/ed25519.ts` (new, `isSmallOrderKey`, used
  by `keyFor` and `verifyPolicySignature`), `src/device-rules.ts` (`FAC-SEM-046`).
- Schemas: `delegation-token` (`grant` one item, `actor5` for the meter's read-only token), `approval` (no
  `device`), `grant-check-request` (`grantRef`'s description), `delegation-jwks` and `device-key-set` (canonical,
  never small-order).
- Fixtures: 1 positive and 8 negative in [`catalogue.json`](../../fixtures/catalogue.json), 19 semantic
  `fixtures/semantic/delegation-mint-*.json`, the adapter's forged token
  [`fixtures/vectors/delegation-small-order.json`](../../fixtures/vectors/delegation-small-order.json).
- Tests: [`test/delegation-sealed.test.ts`](../../test/delegation-sealed.test.ts) (new, one block per inventory id),
  [`test/ed25519.test.ts`](../../test/ed25519.test.ts) (new: each of libsodium's seven encodings proved a point of
  order dividing 8 in BigInt, the predicate with and without the sign bit, the forged vector, a forged device
  policy). Floors: `delegation.ts`, `delegation-rules.ts`, `operator-session.ts` and `ed25519.ts` at 100 %
  ([coverage baseline](../evidence/specs/2026-10-11-board-waves/coverage-baseline.md)).
- UX (F-B-321): JTBD-07, JRN-06, ST-012…ST-015, FLW-10…FLW-12, SCR-13…SCR-15, SCN-016…SCN-019 in
  [`docs/ux/`](../ux/scenarios.md).
- F-B-317, re-checked after DEC-0041: `country_code` and `sort_key` pass; `pass` stays refused, as FL-4 lists it by
  name (DEC-0041). Closed with the test receipt, no code change.
- Board: CT-09 and CT-29 *in review*; CT-18…CT-20 name DEC-0045's next-pin work; CT-30 filed (a T0/T1 grant check
  without a token).

## Checks run

The gate's parts with the main checkout's `node_modules` linked, read after the run: `tsc --noEmit` clean;
`vitest run --coverage` 31 files, 1088 tests passed, branches 90.92 % (2285 / 2513), every floor held;
`docs/ux/lint.py` 15 stories, 12 flows, 15 screens, 19 scenarios; `src/docs-check.ts` passed; `src/lint-md.ts`
0 errors. The suite also passes whole under Node v22.23.1 (1088 / 1088). On Node v22.23.1 `main`'s
`verifyDelegation` answered `ok` for the forged vector; v24.19.0 and v26.10.0 answered `bad-signature`.

### Planted defects

Each plant was applied alone, the whole suite run, the file restored (Node v26.10.0 unless named). The packet's
plants ran at 1079 tests, before the CT-29 fix added nine; the CT-29 plants ran at 1088.

| Id | Plant | Failed / total |
|---|---|---|
| F-B-305 | verifier takes two grants | 1 / 1079 |
| F-B-305 | schema `grant` maxItems 8 | 2 / 1079 |
| F-B-305 | `FAC-SEM-050` lets an extra reference through | 1 / 1079 |
| F-B-305 | `FAC-SEM-050` no longer holds the meter's token to the parent's reference | 2 / 1079 |
| F-B-306 | `verifyMeterToken` allows four actors only | 1 / 1079 |
| F-B-306 | `FAC-SEM-050` depth unchecked | 1 / 1079 |
| F-B-306 | schema without `actor5` | 2 / 1079 |
| F-B-306 | schema's fifth actor not read-only | 2 / 1079 |
| F-B-314 | verifier takes `device` | 1 / 1079 |
| F-B-314 | schema enum takes `device` | 2 / 1079 |
| F-B-301 | relay drops `level` | 1 / 1079 |
| F-B-301 | relay rewrites the code | 2 / 1079 |
| F-B-307 | row 5: an actor's `sub` not an agent id | 2 / 1079 |
| F-B-307 | row 5: `session` untyped | 1 / 1079 |
| F-B-307 | row 5: `jti` grammar | 2 / 1079 |
| F-B-307 | row 5: `scope` grammar | 1 / 1079 |
| F-B-307 | row 5: `spend` untyped | 1 / 1079 |
| F-B-307 | row 5: `project` untyped | 1 / 1079 |
| F-B-307 | expiry checked before the claims | 1 / 1079 |
| F-B-313 | issuer optional again | 1 / 1079 |
| F-B-313 | `iss` never compared (also the meter's, M18) | 3 / 1079 |
| F-B-312 | meter scope not exact | 1 / 1079 |
| F-B-312 | meter effect not exactly `none` | 1 / 1079 |
| F-B-319 | a key of another `use`/`alg` back to `unauthenticated` | 2 / 1079 |
| F-B-309 | header list `[jku, jwk]` (M24) | 1 / 1079 |
| F-B-309 | a private member accepted (M23) | 1 / 1079 |
| F-B-309 | approval wrong issuer (M14) | 1 / 1079 |
| F-B-309 | approval issued in the future (M15) | 1 / 1079 |
| F-B-309 | `typ` gate in `readDelegationToken` (M16) | 1 / 1079 |
| F-B-309 | signature length (M25) | **0 / 1079**: equivalent on Node, whose `verify` answers false for any other length; kept for ports, said in the code |
| F-B-308 | M3, M4, M5, M6, M7, M8, M9, M10, M11, M32, M36 (each its own run) | 1, 1, 2, 1, 2, 2, 1, 1, 1, 1, 3 / 1079 |
| F-B-322 | window the grant does not limit; above the grant's limit; per-call above the grant's; per-call above the parent's | 1, 3, 2, 3 / 1079 |
| F-B-310 | `level` may be null with `limit-reached` (M22); audience without `principalKind` (M30); without `effectCeiling` (M37) | 1, 1, 1 / 1079 |
| F-B-311 | the 7-day clamp removed (M1) | 1 / 1079 |
| F-B-318 | FB-6 without the session lifetime | 1 / 1079 |
| TRUST-TIERS | DL-26's MUST NOT made MAY | 1 / 1079 |
| ratchet | `FAC-SEM-049` window twice; `FAC-SEM-050` audience mismatch (checks no test reached before) | 1, 1 / 1079 |
| CT-29 | predicate removed from `keyFor` (the forged vector) | 2 / 1088 on v26 and on v22 |
| CT-29 | predicate always false | 4 / 1088 on v26, 5 on v22 |
| CT-29 | sign bit not cleared; an order-8 encoding dropped | 1, 1 / 1088 on both |
| CT-29 | predicate removed from `verifyPolicySignature` | **0 / 1088 on v26** (its `verify` refuses the forgery anyway), **1 / 1088 on v22** |
| CT-29 | `FAC-SEM-046` lets a small-order key into a set | 1 / 1088 |
| CT-29 | JWKS schema, key-set schema without the small-order enum | 2, 2 / 1088 |

## Decisions and readings

- Ruling 1's "an onward token keeps the same reference" is read as the meter's token, the only onward token minted
  under its parent's grant; for every onward token it would contradict DL-4/DL-5 (DEC-0045 item 1).
- A small-order key is `issuer-unavailable` (`small-order-key`), the issuer's unusable key (DL-13 row 3), not the
  adapter vector's `unauthenticated` (`bad-signature`): the adapter's port and vector move (CT-18).

## Open

- Receipts: the owner session marks CT-09 and CT-29 done with the merge commit, and records the inventory ids in
  `findings/closed.json` as in wave 1.
- Not done, with reasons: shared verifier vectors for the kits' ports (they need a published test key; the ports
  read `test/delegation-sealed.test.ts` and `fixtures/vectors/delegation-small-order.json` until then, DEC-0045 *Not
  decided here*); the token-less grant check of a T0/T1 callee (CT-30); the T1 binding (RM-21).
- Adjacent, not this packet's: `docs/evidence/acceptance.md` still says "next free DEC-0043, FAC-SEM-056".
- Cross-repository: fabric-workspace `knowledge/` rows for DEC-0045's consumer pins (products/plans) are left to the
  owner session's P1-07-style knowledge step after merge.

## Next task

The owner session reviews the pull request of branch `agent/w2-p2-03-delegation-20261012`, re-runs the gate,
merges, and records CT-09 and CT-29 done with the merge commit; then P2-04 starts from that `main`
(it shares `spend-policy.md`, whose `modelClasses` this packet left untouched).
