# Branch-coverage baseline — the P1-04 ratchet (2026-10-11)

Measured on `main` with P1-01 and P1-03 (`vitest run --coverage`, v8 provider, 857 tests). Each file's floor in
`vitest.config.ts` is its percentage to two decimals, and the whole set has a floor too, so a new rule file is
measured from its first commit. The wave whose node closes the file's findings raises its
floor toward 100 %. A branch that only guards malformed input a schema already refuses may stay uncovered only with
a `/* v8 ignore next */` and the reason beside it, recorded in that wave's close record.

| File | Branches covered | Floor | Raised by wave |
|---|---|---|---|
| `src/activity-rules.ts` | 184 / 225 (81.77 %) | 81.77 % | 3 |
| `src/delegation-rules.ts` | 153 / 190 (80.52 %) | 100 % (P2-03: 232 / 232) | 2 |
| `src/delegation.ts` | 249 / 264 (94.31 %) | 100 % (P2-03: 295 / 295) | 2 |
| `src/device-rules.ts` | 257 / 322 (79.81 %) | 79.81 % | 3 |
| `src/fabric-links.ts` | 105 / 112 (93.75 %) | 97.61 % (P2-02: 82 / 84) | 2 |
| `src/grant-projection.ts` | 72 / 82 (87.8 %) | 87.8 % | 2 |
| `src/interop-rules.ts` | 92 / 104 (88.46 %) | 88.46 % | 5 |
| `src/operator-session.ts` | 10 / 11 (90.9 %) | 100 % (P2-03: 11 / 11) | 2 |
| `src/registry-rules.ts` | 67 / 74 (90.54 %) | 90.54 % | 5 |
| `src/route-rules.ts` | 116 / 125 (92.8 %) | 92.8 % | 5 |
| `src/secret-shape.ts` | new in P2-02: 47 / 47 (100 %) | 100 % | 2 |
| `src/semantic-rules.ts` | 258 / 301 (85.71 %) | 90.95 % (P2-02: 332 / 365) | 4 |
| `src/session-handoff.ts` | 393 / 442 (88.91 %) | 88.91 % | 4 |
| `src/spend-rules.ts` | 27 / 31 (87.09 %) | 87.09 % | 2 |

Total (also the floor of the whole set): 1983 / 2283 (86.85 %).

## Floors changed by wave 2

| Packet | File | Branches covered | Floor | Why |
|---|---|---|---|---|
| P2-01 | `src/canonical.ts` (new) | 38 / 38 (100 %) | 100 % | the two canonical forms, run over `fixtures/vectors/canonical.json` |
| P2-01 | `src/comms-digest.ts` (new) | 14 / 14 (100 %) | 100 % | the board's idempotency digest (DEC-0043) |
| P2-01 | `src/delegation.ts` | 229 / 244 (93.85 %) | 93.85 % | RFC 8785's 20 covered branches moved to `src/canonical.ts`; the 15 uncovered are unchanged and left to P2-03, which owns the rest of the file |
| P2-03 | `src/delegation.ts` | 295 / 295 (100 %) | 100 % | DL-2's types at row 5, the meter's hop and strictness, the relay, the small-order key; every branch covered |
| P2-03 | `src/ed25519.ts` (new) | 2 / 2 (100 %) | 100 % | the small-order key predicate (CT-29) |
| P2-03 | `src/delegation-rules.ts` | 232 / 232 (100 %) | 100 % | FAC-SEM-050's one grant, depth, spend against grant and parent; one fixture per sub-check |
| P2-03 | `src/operator-session.ts` | 11 / 11 (100 %) | 100 % | the 7-day clamp under use, and a session live before its end |
| P2-04 | `src/profile-rules.ts` (new) | 64 / 64 (100 %) | 100 % | FAC-SEM-058…060 and `resolveModelProfile`; one fixture or case per sub-check, each planted |
| P3-01 | `src/package-rules.ts` (new) | 152 / 152 (100 %) | 100 % | FAC-SEM-064…066, the digest, the folder check and `verifyPackage`; one fixture or vector case per sub-check and problem, each planted |
| P3-02 | `src/device-rules.ts` | 500 / 515 (97.08 %) | 97.08 % | F-B-101, F-B-103…F-B-109; FAC-SEM-068, FAC-SEM-069, device keys by role; every check planted, and malformed input refused rather than thrown |
| P3-02 | `src/activity-rules.ts` | 260 / 284 (91.54 %) | 91.54 % | F-B-102, F-B-107, F-B-108, CT-25, CON-OE-01, FAC-SEM-067; every check planted |
| P3-03 | `src/estate-record-rules.ts` (new) | 190 / 190 (100 %) | 100 % | FAC-SEM-072…076, the digest, the challenge, `verifyEstateRecord` and `placementTrust`; one fixture or vector case per rule and problem, the chain checks planted |
| P3-03 | `src/webauthn.ts` (new) | 78 / 78 (100 %) | 100 % | the offline WebAuthn Level 3 §7.2 assertion checks, ER-4…ER-9 |
| P3-02 | `src/p256.ts` (new) | 8 / 8 (100 %) | 100 % | SEC 1 §3.2.2 P-256 key validation over `fixtures/vectors/p256.json` (DEC-0053) |
| DEC-0047 | `src/relay.ts` (new) | 103 / 103 (100 %) | 100 % | admission, relay-auth/1 and relay-blob/1, the message body with its signed `exp`, `relayAdmissionSet`; boundary tests for the review of #53 (its second reading caught 42 of 45 planted mutations) |
| DEC-0047 | `src/secret-envelope.ts` (new) | 90 / 90 (100 %) | 100 % | HPKE base mode against RFC 9180 §A.3.1 and the envelope's open checks over `fixtures/vectors/secret-envelope.json` |
| DEC-0047 | `src/relay-rules.ts` (new) | 51 / 51 (100 %) | 100 % | FAC-SEM-070 and FAC-SEM-071; one fixture per sub-check |
| DEC-0047 | `src/p256.ts` | 46 / 46 (100 %) | 100 % | DEC-0053's copy merged with DEC-0047's; one helper turns SEC 1 octets or a JWK into the key every verifier uses |
| P4-03 | `src/dashboard-declaration.ts` (new) | 20 / 20 (100 %) | 100 % | FAC-SEM-080 and `hostView` over `fixtures/vectors/dashboard-declaration.json` (DEC-0059); malformed input answered, never thrown |
| P4-01 | `src/service-supervisor.ts` (new) | 114 / 114 (100 %) | 100 % | the supervisor marker over `fixtures/vectors/service-supervisor.json` and FAC-SEM-078; one fixture or test per check, each planted (DEC-0057) |
| P4-01 | `src/windows-token.ts` (new) | 45 / 45 (100 %) | 100 % | the Windows token-file reader over `fixtures/vectors/windows-token.json` (FAC-SEM-079); every check planted (DEC-0057) |
| P4-04 | `src/http-signature.ts` (new) | 350 / 350 (100 %) | 100 % | the device transport binding (DEC-0056): RFC 8941 parsing with RFC 9651's Date and Display String, RFC 9421 §2.3 and §2.5, mutual TLS beside the signature, the receiver's steps and the nonce store, over `fixtures/vectors/http-signature.json`; every refusal planted |
| P4-04 | `src/device-transport-rules.ts` (new) | 40 / 40 (100 %) | 100 % | FAC-SEM-077, moved out of `device-rules.ts` so a consumer that vendors the device rules needs no HTTP layer |
| P4-04 | `src/device-rules.ts` | 515 / 529 (97.35 %) | 97.35 % | FAC-SEM-044's key-role counts, every new branch covered |
| P4-07 | `src/hub-key-rules.ts` (new) | 79 / 79 (100 %) | 100 % | `hubKeyCertified` and FAC-SEM-081 over `fixtures/vectors/hub-key.json` (DEC-0060); every check planted (39 plants with the verifier's, all killed) |
| P4-07 | `src/rfc3339.ts` (new) | 11 / 11 (100 %) | 100 % | the strict date reader moved out of `src/estate-record-rules.ts` (179 / 179 after the move), unchanged |
| P4-07 | `src/delegation.ts` | 324 / 324 (100 %) | 100 % | DL-13 row 4a (the `estate` option), the clock refused before row 1, the meter's `checkedAt` on an unreadable clock |
| P4-06 | `src/revocation-delta.ts` (new) | 262 / 262 (100 %) | 100 % | the revocation delta and the heartbeat (DEC-0054): `applyDelta` RD-1…RD-10, `acceptHeartbeat` HB-1…HB-3, the 72-hour rule and reconciliation over `fixtures/vectors/revocation-delta.json`; malformed input answered, never thrown; every refusal planted |
| P4-06 | `src/revocation-delta-rules.ts` (new) | 73 / 73 (100 %) | 100 % | FAC-SEM-082…084; one fixture per sub-check, each planted |

**Wave 2, P2-02 (DEC-0044).** The credential detector moved from `src/fabric-links.ts` into `src/secret-shape.ts`
with its branches, all covered, which alone lowered `fabric-links.ts` to 78 / 84 (92.85 %); tests of the link
builder's optional parameters and of a non-string `url` cover four of its six remaining branches (the two left are
`?? ""`/`?? []` fallbacks of `URLSearchParams`). `semantic-rules.ts` gains FAC-SEM-056 and FAC-SEM-057, every new
branch covered, including partial and malformed documents. Measured with `vitest run --coverage` on the P2-02 branch.

**Wave 2, P2-03 (DEC-0045).** `delegation.ts`, `delegation-rules.ts` and `operator-session.ts` reach every branch, with
no `v8 ignore`: one semantic fixture per FAC-SEM-050 sub-check (F-B-308), a test per verifier MUST (F-B-309), and
input of the wrong shape that must refuse rather than throw. Two branches no earlier test reached were checks, not
guards: FAC-SEM-049's window named twice and FAC-SEM-050's token for another audience or project. `fabric-links.ts`
stays at P2-02's 97.61 %: its two uncovered arms are the `?? ""`/`?? []` fallbacks P2-02 names. Measured with
`vitest run --coverage` on the P2-03 branch after P2-02's merge. The CT-29 fix adds `src/ed25519.ts`, every branch
covered; `device-rules.ts` gains one covered branch (80.36 %, floor unchanged at 79.81 % for wave 3).

**Wave 2, P2-04 (DEC-0046).** `src/profile-rules.ts` is new and reaches every branch, with no `v8 ignore`; input of
the wrong shape is refused without throwing. `src/session-handoff.ts` gains the `pi` arm of SH-11 (395 / 443,
89.16 %, floor unchanged at 88.91 %); `semantic-rules.ts` only dispatches to the new module (91.38 %, floor unchanged).
The whole set: 2353 / 2580 (91.2 %). Measured with `vitest run --coverage` on the P2-04 branch after P2-03's merge.

**Wave 3, P3-01 (DEC-0050, DEC-0051).** `src/package-rules.ts` is new and reaches every branch, with no `v8 ignore`;
input of the wrong shape is refused without throwing. `semantic-rules.ts` only dispatches to it (91.42 %, floor unchanged).
The whole set: 2513 / 2740 (91.71 %). Measured with `vitest run --coverage` on the P3-01 branch at `bcada4a`.
**Wave 3, P3-02 (DEC-0052, DEC-0053).** `device-rules.ts` rises from 80.36 % to 97.08 % and `activity-rules.ts` from
83.55 % to 91.54 %: tests that kill each audit branch (F-B-101, F-B-102), a test per new check with its defect planted
back, and `test/rule-tolerance.test.ts`, which feeds every activity and device rule kind members of the wrong type and
expects findings, never an exception. The uncovered branches left are `?? ""` and type-guard arms of nested members.
`src/p256.ts` is new, every branch covered. The whole-set floor stays at 86.85 %, since P3-01's new files land beside
these; measured whole set 2683 / 2844 (94.33 %). Measured with `vitest run --coverage` on the P3-02 branch after main's
`0cacd08`.

**Wave 3, P3-03 (DEC-0055).** `src/estate-record-rules.ts` and `src/webauthn.ts` are new and reach every branch, with
no `v8 ignore`; the estate rule kinds join `test/rule-tolerance.test.ts`, so input of the wrong shape is refused without
throwing; the verifier's checks added in review (issued before the parent, a dropped revocation, a revoked signer, the record's
rules, an unreadable clock, the day of the month, one hub key under two kids, a canonical JWK, an unadmitted algorithm,
a revocation kind read from a `Map`) were each removed and a test failed. `semantic-rules.ts` only dispatches to the new module. The whole-set floor stays at 86.85 %; measured whole set
3131 / 3290 (95.16 %). Measured with `vitest run --coverage` on the P3-03 branch off main's `92de756`.
**Wave 3, DEC-0047 (#53).** `src/relay.ts`, `src/secret-envelope.ts` and `src/relay-rules.ts` are new and reach every
branch, with no `v8 ignore`; `src/p256.ts` keeps every branch after the merge with DEC-0053's copy and the key helper.
The whole set: 3415 / 3574 (95.55 %). Measured with `vitest run --coverage` on the DEC-0047 branch rebased onto main's `b291bf0`, after the second reading.

**Wave 4, P4-03 (DEC-0058, DEC-0059).** `src/dashboard-declaration.ts` is new and reaches every branch, with no
`v8 ignore`; `service-well-known` joins `test/rule-tolerance.test.ts`. `semantic-rules.ts` only dispatches to it
(91.51 %, floor unchanged). The schema invariants this packet proves are not branches: `test/schema-mutants.ts` removes
each one from a copy of its schema and requires a negative fixture the copy accepts (22 mutants of
`operator-channel-status`, 10 of `service-dashboard-extension`, and an identity mutant for each). The whole set: 3153 / 3312 (95.19 %). Measured with
`vitest run --coverage` on the P4-03 branch off `main` `31ed9f0`. On its merge with `main` `8060254` (the relay, DEC-0047): 39 files, 1689 tests,
whole set 3441 / 3600 (95.58 %).

**Wave 4, P4-01 (DEC-0057).** `src/service-supervisor.ts` and `src/windows-token.ts` are new and reach every branch,
with no `v8 ignore`; both rule kinds join `test/rule-tolerance.test.ts`. 44 plants (each check removed or loosened
once, the descriptor's DEC-0032 rules and the review round's checks among them) each failed at least one test. `semantic-rules.ts` gains two
dispatches and `FAC-SEM-012`'s path (358 / 391, 91.56 %, floor unchanged). The whole-set floor stays at 86.85 %;
measured whole set 3294 / 3453 (95.39 %), after the review round. Measured with `vitest run --coverage` on the P4-01 branch off main's `31ed9f0`.

**Wave 4, P4-01 merged with main `c00a0c3`** (the relay DEC-0047, P4-03 DEC-0058/0059, #59): 41 files, 1777 tests,
whole set 3604 / 3763 (95.77 %), every floor met.

**Wave 4, P4-04 (DEC-0056).** `src/http-signature.ts` is new and reaches every branch, with no `v8 ignore`: the RFC 8941
parser's refusals case by case, RFC 9421 Appendix B.2.6 and RFC 9530 Appendix D as vectors, and one binding vector per
receiver step. `device-rules.ts` gains FAC-SEM-044's counts, every new branch covered (97.35 %, its floor raised from
97.08 %); FAC-SEM-077 is `src/device-transport-rules.ts`, every branch covered, and its kind joins
`test/rule-tolerance.test.ts`. The whole-set floor stays at 86.85 %. Measured with `vitest run --coverage` on the P4-04
branch off main's `31ed9f0`, after the review round: whole set 3528 / 3688 (95.66 %).

**Wave 4, P4-04 merged with main `8c6211e`** (P4-01, P4-03, the relay and #59): 42 files, 1991 tests, whole set
4001 / 4161 (96.15 %), every floor met.

**Wave 4, P4-06 (DEC-0054).** `src/revocation-delta.ts` and `src/revocation-delta-rules.ts` are new and reach every
branch, with no `v8 ignore`; the four kinds join `test/rule-tolerance.test.ts`, and 50 planted defects (35 in the
verifier, 15 in the rules) each failed a test. The whole-set floor stays at 86.85 %. Measured with `vitest run
--coverage` on the P4-06 branch merged with main's `51719e4`: 44 files, 2173 tests, whole set 4407 / 4567 (96.49 %),
every floor met.
**Wave 4, P4-02 (DEC-0061).** `src/descriptor-rules.ts` is new and reaches every branch (95 / 95), with no `v8 ignore`;
its floor is 100. `service-descriptor`, `service-runner` and `service-peer-request` are in `test/rule-tolerance.test.ts`.
26 plants (each check of the module or its dispatch removed or loosened once) each failed at least one test, and the
schema's refusals are proved by 26 mutants in `test/descriptor-rules.test.ts`, each killed by a named negative fixture,
with an identity mutant for each schema. `semantic-rules.ts` gains two dispatches (366 / 399, 91.72 %, floor
unchanged). The whole-set floor stays at 86.85 %. Measured with `vitest run --coverage` on the P4-02 branch off main's
`204f189`: 43 files, 2114 tests, whole set 4098 / 4258 (96.24 %).

**Wave 4, P4-02 merged with main `5967bb1`** (P4-06, P4-07): 46 files, 2402 tests, whole set 4611 / 4769 (96.68 %),
every floor met.

**DEC-0083 (2026-10-15).** The raw-index helper `indexed` moves from `src/activity-rules.ts` and
`src/estate-record-rules.ts` to `src/findings.ts`, which joins the measured set with a floor of 100 (`test/findings.test.ts`).
`activity-rules.ts`'s floor moves from 97.16 to 97.13: the helper's two covered branches left it, and the same nine
branches stay uncovered, out of 314 in place of 316. `src/profile-rules.ts` keeps 100.

**DEC-0084 (2026-10-15).** `src/pairing.ts` (199 / 199) and `src/enroll-token.ts` (106 / 106) are new, join the
measured set and reach every branch, so each floor is 100. `src/estate-record-rules.ts` (274 / 274), `src/relay.ts`
(208 / 208) and `src/signing-challenges.ts` (65 / 65) keep 100. 77 plants (each refusal clause removed or loosened
once) each failed at least one test: 42 in `src/pairing.ts` (`test/pairing.test.ts`), 21 in `src/enroll-token.ts` and
4 in `src/signing-challenges.ts` (`test/enroll-token.test.ts`), 9 in `src/estate-record-rules.ts` and 1 in
`src/relay.ts` (`test/ceremonies.test.ts`). Measured with `vitest run --coverage` on the branch off main's `d8146cf`:
73 files, 4945 tests, whole set 6652 / 6727 (98.88 %).

**DEC-0084 fix round (2026-10-16).** `src/pairing.ts` 203 / 203, `src/enroll-token.ts` 123 / 123,
`src/estate-record-rules.ts` 280 / 280, `src/relay.ts` 235 / 235, `src/relay-vectors.ts` 57 / 57,
`src/secret-envelope.ts` 134 / 134 and `src/signing-challenges.ts` 67 / 67 keep 100. `src/route-rules.ts`'s floor moves
from 96.85 to 98.44 (127 / 129) with the `FAC-SEM-034` totality fix. 22 more plants, each killed. Measured on the
branch: 73 files, 4986 tests, whole set 6724 / 6797 (98.92 %).


**DEC-0085 (2026-10-17).** `src/entitlement.ts` (275 / 275) is new, joins the measured set and reaches every branch,
so its floor is 100. `src/signing-challenges.ts` (67 / 67) and `src/protocol-revisions.ts` (65 / 65) keep 100;
`src/semantic-rules.ts` reads 98.51 (463 / 470) against its floor of 98.49. 140 plants (each refusal clause of
`src/entitlement.ts` and of `FAC-SEM-115` and `FAC-SEM-116` removed or loosened once) each failed at least one test
(`docs/evidence/specs/2026-10-17-entitlement/plants.md`). Measured with `vitest run --coverage` on the branch merged
with main's `1531f21`: 74 files, 5179 tests, whole set 7014 / 7087 (98.96 %).

**DEC-0085 fix round (2026-10-18).** `src/entitlement.ts` 286 / 286 keeps 100. 9 more plants, each killed. Measured
on `b2a9131`: 74 files, 5195 tests, whole set 7025 / 7098 (98.97 %).

**DEC-0086 (2026-10-18).** `src/share-registration.ts` (230 / 230) is new, joins the measured set and reaches every
branch, so its floor is 100. `src/context-rules.ts` (7 / 7) keeps 100; `src/device-rules.ts` reads 98.89 (537 / 543)
against its floor of 98.87 and `src/semantic-rules.ts` 98.51 (465 / 472) against 98.49. 94 plants (each refusal clause,
SR and GJ row of `src/share-registration.ts`, `FAC-SEM-117`, `FAC-SEM-118`, the amended `FAC-SEM-045` and the schema
clauses removed or loosened once) each failed at least one test after two survivors were closed
(`docs/evidence/specs/2026-10-18-share-registration/plants.md`). Measured with `vitest run --coverage` on `5fb0a5a`:
75 files, 5545 tests, whole set 7267 / 7340 (99.00 %).

**DEC-0086 fix round (2026-10-19).** `src/share-registration.ts` 271 / 271 keeps 100 with `carried`, `gateGrantUsage`
and `FAC-SEM-117`'s window and parent clauses. 26 more plants: 21 killed, one closed with a test, one a redundant
guard removed, three equivalent (`docs/evidence/specs/2026-10-18-share-registration/plants.md`, *The fix round*).
Measured with `vitest run --coverage` on `f628f0d`: 75 files, 5585 tests, whole set 7308 / 7381 (99.01 %).

**DEC-0087 (2026-10-19).** `src/job-limits.ts` (133 / 133 after the readings' fix round) is new, joins the measured
set and reaches every branch, so its floor is 100. 56 plants, one equivalent
(`docs/evidence/specs/2026-10-19-job-limits/plants.md`). Measured with `vitest run --coverage`: 76 files, 5759 tests,
whole set 7445 / 7518 (99.02 %).

**DEC-0089 (2026-10-19).** `src/folder-attribution.ts` (284 / 284 after the readings' fifth fix round) is new, joins
the measured set and reaches every branch, so its floor is 100. 93 plants, one equivalent, each other killed after its
survivors were closed (`docs/handoffs/2026-10-19-folder-attribution.md`). Measured with `vitest run --coverage`: 77
files, 5968 tests, whole set 7731 / 7804 (99.06 %).
