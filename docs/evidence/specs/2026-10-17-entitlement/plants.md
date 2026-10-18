# Plants: `src/entitlement.ts` and `FAC-SEM-115`, `FAC-SEM-116` (CT-54, DEC-0085, REQ-08)

Each refusal clause of `src/entitlement.ts` (the two verifiers, their shape checks and contexts) and of the two rules was
removed or loosened once, alone, then `node_modules/.bin/vitest run test/entitlement.test.ts` ran; every plant failed
at least one test, then the source was restored (the runner wrote the original back after each plant).

**Result:** 140 plants, 140 killed, 0 survivors.

**Survivors closed during the run.** An interrupted first pass left two survivors, the entitlement's `type` check and
its exact member list in `wellFormed`: both are decided by `entitlementSigningInput`, which has no bytes for another
type or member list, so they were removed with a comment saying so. The first full pass left nine. Three were removed as
decided elsewhere, each with a comment naming the check that holds the case: a line that is not an object (`exactly`
reads own keys only), the hosting product (`consistent` checks it per subject) and the separate revoked branch (folded
into the unknown-key answer). Six were closed with tests: an estate with a space or of 129 characters, 257 revoked
kids, a key kid with a space, a numeric key `alg`, a numeric set `alg`, and every signature mutation applied to a key
set. The refusal tests also name the expected problem (`malformed`, `unknown-algorithm`, `small-order-key`) rather than
`ok: false`. The second full pass, below, left none.

| Clause | Failing tests |
|---|---|
| wellFormed: issuer | 2 |
| issuerOk: length ≤ 261 | 1 |
| ISSUER: lower case only | 2 |
| ISSUER: no trailing slash | 2 |
| wellFormed: subject | 2 |
| wellFormed: estate opaque | 1 |
| wellFormed: order object exact | 1 |
| wellFormed: order id | 1 |
| wellFormed: order revision | 2 |
| positive: safe integer | 2 |
| positive: ≥ 1 | 4 |
| wellFormed: issuedAt | 1 |
| wellFormed: notBefore | 1 |
| wellFormed: expiresAt | 3 |
| licence: safe integer | 1 |
| licence: ≥ 1 | 2 |
| licence: ≤ MAX_MEMBERS | 1 |
| support: tier | 2 |
| agents: an array | 1 |
| agents: object items | 1 |
| agents: agentRef pattern | 1 |
| agents: agentRef length | 1 |
| agents: unique | 4 |
| wellFormed: consistent | 7 |
| consistent: personal estate | 1 |
| consistent: personal licence | 4 |
| consistent: personal support | 1 |
| consistent: personal hosting | 1 |
| consistent: org estate | 4 |
| consistent: org hosting | 4 |
| wellFormed: alg a string | 1 |
| wellFormed: kid | 1 |
| wellFormed: sig | 2 |
| SIG: canonical last character | 2 |
| OPAQUE: no @ or space | 4 |
| OPAQUE: 128 at most | 2 |
| CONTEXT: org id | 1 |
| strict time | 9 |
| keySet: type | 1 |
| keySet: exact members | 1 |
| keySet: issuer | 1 |
| keySet: revision | 2 |
| keySet: issuedAt | 1 |
| keySet: at least one key | 3 |
| keySet: at most MAX_KEYS | 1 |
| keySet: revoked an array | 1 |
| keySet: revoked ≤ MAX_REVOKED | 1 |
| keySet: revoked opaque | 1 |
| keySet: revoked unique | 2 |
| keySet: alg a string | 1 |
| keySet: kid | 1 |
| keySet: sig | 1 |
| key: object exact | 2 |
| key: kid | 1 |
| key: alg a string | 1 |
| key: x canonical | 1 |
| key: kid once | 1 |
| key: not the root's kid | 4 |
| key: not revoked | 2 |
| key: window order | 1 |
| EK context: root object | 3 |
| EK context: root issuer | 1 |
| EK context: root kid | 1 |
| EK context: root x | 1 |
| EK context: held | 2 |
| heldKeySet: revision | 1 |
| heldKeySet: digest | 1 |
| EK malformed | 8 |
| EK wrong issuer: issuer | 1 |
| EK wrong issuer: kid | 1 |
| EK algorithm: set | 2 |
| EK algorithm: keys | 2 |
| EK unusable root | 1 |
| EK small-order root | 1 |
| EK small-order keys | 3 |
| EK signature | 2 |
| EK stale | 1 |
| EK conflict | 1 |
| EK unchanged | 2 |
| EN context: object | 3 |
| EN no-clock | 3 |
| EN context: subject | 3 |
| EN context: personal estate | 3 |
| EN context: org without estate | 3 |
| EN context: key set object | 5 |
| EN context: key set alg | 3 |
| EN context: held | 3 |
| heldEntitlement: orderId | 1 |
| heldEntitlement: revision | 1 |
| heldEntitlement: issuedAt | 1 |
| heldEntitlement: digest | 2 |
| EN malformed | 10 |
| EN wrong issuer | 3 |
| EN algorithm | 4 |
| EN unusable key | 2 |
| EN small-order key | 2 |
| EN key window: notBefore | 3 |
| EN key window: notAfter | 3 |
| EN signature | 4 |
| EN wrong subject: subject | 5 |
| EN wrong subject: estate | 2 |
| EN life: issuedAt ≤ notBefore | 2 |
| EN life: notBefore < expiresAt | 2 |
| EN life: 35 days | 2 |
| EN not yet valid | 2 |
| EN not yet valid: removed | 3 |
| EN lapsed | 2 |
| EN lapsed: removed | 3 |
| EN stale: same order | 2 |
| EN conflict | 2 |
| EN other order: later only | 2 |
| EN other order: removed | 3 |
| EN held matches order | 4 |
| EN state | 2 |
| EN refreshDue | 2 |
| EN unchanged | 3 |
| line: exact members | 1 |
| EN unknown key | 2 |
| EN revoked | 3 |
| EN key listed | 5 |
| SEM-115: personal estate | 2 |
| SEM-115: personal licence | 2 |
| SEM-115: personal support | 2 |
| SEM-115: personal hosting | 2 |
| SEM-115: org estate | 2 |
| SEM-115: org hosting | 2 |
| SEM-115: subject | 2 |
| SEM-115: unreadable times | 2 |
| SEM-115: issuedAt ≤ notBefore | 2 |
| SEM-115: notBefore < expiresAt | 2 |
| SEM-115: 35 days | 2 |
| SEM-115: agents once | 2 |
| SEM-116: kid once | 2 |
| SEM-116: root kid | 2 |
| SEM-116: revoked | 2 |
| SEM-116: unreadable window | 2 |
| SEM-116: window order | 1 |
| SEM-116: small order | 2 |
| rules: not registered | 13 |
| hosting: size | 1 |

## Fix round (2026-10-18)

Each new or changed refusal clause of the fix round, planted once alone against `test/entitlement.test.ts`, then
restored. 9 plants, 9 killed. A first plant of the `line` guard (the object test replaced by `Object(value)`) did not
throw and refused the same inputs, so it was replaced by the defect the unit reading found: the guard removed, which
throws on a missing member.

| Clause | Failing tests |
|---|---|
| line: the object test removed (a missing `licence`, `hosting` or `support` threw) | 4 |
| time: at most three fraction digits | 9 |
| the millisecond pattern: three digits, not four | 9 |
| a key set holds a key valid at its issuedAt (shape check) | 3 |
| that key's window: notBefore ≤ issuedAt | 1 |
| that key's window: issuedAt < notAfter | 1 |
| `FAC-SEM-116`: a key valid at issuedAt | 2 |
| the 38-day life, one second longer | 5 |
| `no-clock` before the rest of the context | 2 |
