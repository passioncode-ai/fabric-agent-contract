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
| P3-02 | `src/device-rules.ts` | 500 / 515 (97.08 %) | 97.08 % | F-B-101, F-B-103…F-B-109; FAC-SEM-068, FAC-SEM-069, device keys by role; every check planted, and malformed input refused rather than thrown |
| P3-02 | `src/activity-rules.ts` | 260 / 284 (91.54 %) | 91.54 % | F-B-102, F-B-107, F-B-108, CT-25, CON-OE-01, FAC-SEM-067; every check planted |
| P3-02 | `src/p256.ts` (new) | 8 / 8 (100 %) | 100 % | SEC 1 §3.2.2 P-256 key validation over `fixtures/vectors/p256.json` (DEC-0053) |

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

**Wave 3, P3-02 (DEC-0052, DEC-0053).** `device-rules.ts` rises from 80.36 % to 97.08 % and `activity-rules.ts` from
83.55 % to 91.54 %: tests that kill each audit branch (F-B-101, F-B-102), a test per new check with its defect planted
back, and `test/rule-tolerance.test.ts`, which feeds every activity and device rule kind members of the wrong type and
expects findings, never an exception. The uncovered branches left are `?? ""` and type-guard arms of nested members.
`src/p256.ts` is new, every branch covered. The whole-set floor stays at 86.85 %, since P3-01's new files land beside
these; measured whole set 2683 / 2844 (94.33 %). Measured with `vitest run --coverage` on the P3-02 branch after main's
`0cacd08`.
