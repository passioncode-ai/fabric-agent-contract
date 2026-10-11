# Branch-coverage baseline — the P1-04 ratchet (2026-10-11)

Measured on `main` with P1-01 and P1-03 (`vitest run --coverage`, v8 provider, 857 tests). Each file's floor in
`vitest.config.ts` is its percentage rounded down. The wave whose node closes the file's findings raises its
floor toward 100 %. A branch that only guards malformed input a schema already refuses may stay uncovered only with
a `/* v8 ignore next */` and the reason beside it, recorded in that wave's close record.

| File | Branches covered | Floor | Raised by wave |
|---|---|---|---|
| `src/activity-rules.ts` | 184 / 225 (81.77 %) | 81 % | 3 |
| `src/delegation-rules.ts` | 153 / 190 (80.52 %) | 80 % | 2 |
| `src/delegation.ts` | 249 / 264 (94.31 %) | 94 % | 2 |
| `src/device-rules.ts` | 257 / 322 (79.81 %) | 79 % | 3 |
| `src/fabric-links.ts` | 105 / 112 (93.75 %) | 93 % | 2 |
| `src/grant-projection.ts` | 72 / 82 (87.8 %) | 87 % | 2 |
| `src/interop-rules.ts` | 92 / 104 (88.46 %) | 88 % | 5 |
| `src/operator-session.ts` | 10 / 11 (90.9 %) | 90 % | 2 |
| `src/registry-rules.ts` | 67 / 74 (90.54 %) | 90 % | 5 |
| `src/route-rules.ts` | 116 / 125 (92.8 %) | 92 % | 5 |
| `src/semantic-rules.ts` | 258 / 301 (85.71 %) | 85 % | 4 |
| `src/session-handoff.ts` | 393 / 442 (88.91 %) | 88 % | 4 |
| `src/spend-rules.ts` | 27 / 31 (87.09 %) | 87 % | 2 |

Total: 1983 / 2283 (86.85 %).
