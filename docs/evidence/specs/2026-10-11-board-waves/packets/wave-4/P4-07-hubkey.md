# P4-07 — a delegation key the estate record certifies: the reference function, the refusals, the highest revision

- **Node:** N18 · **Wave:** 4 · **Closes:** DL-HUBKEY · **Order:** parallel with P4-02, P4-05 and P4-06 (it edits
  `delegation.md`, `estate-record.md`, `src/delegation.ts` and `src/estate-record-rules.ts`, which no other wave-4 packet
  owns).

## Sources

- DEC-0055 item 4 and [estate record](../../../../../specification/estate-record.md#machines) "Machines" → `hubKey`: a
  delegation verifier that reads the estate record trusts a token's `kid` only while a current revision certifies it.
  DL-14 in [delegation](../../../../../specification/delegation.md#keys-publication-and-rotation) repeats the sentence.
  The contract has no reference function, no vectors and no refusal codes for it.
- The adapter's report FAA-31 (2026-10-12; fabric-agent-adapter 0.21.0, its commit `0badd8f`, handoff
  `docs/handoffs/2026-10-12-faa-31-estate-record.md`): both kits implement the rule as `hubKeyCertified(record, kid, x,
  at)` and an `estate` option on the delegation and approval verifiers, checked after the signature (DL-13 row 4):
  - certified when exactly the `kid` and the published `x` are a machine's `hubKey`, the revision is inside its window,
    and neither `hub-key <kid>` nor `machine <id>` is revoked;
  - otherwise `unauthenticated` (`approval-invalid` for an approval), detail `kid-not-certified`;
  - an estate source that throws: `issuer-unavailable`, detail `estate-unreadable`.
  Its independent review warned of a rollback: the verifier must use a revision it verified and the highest it applied,
  because an older revision still inside its 30-day window would bring back a revoked key.
- DEC-0045's refusal wire (DL-19): `unauthenticated` is the token's fault (401), `issuer-unavailable` "no usable
  published keys" (503); `detail` is a short machine word in `error.data.detail`.

## What to build (one decision)

1. **The reference function** (landed in `src/hub-key-rules.ts`, DEC-0060 item 4) in `src/estate-record-rules.ts`: `hubKeyCertified(record, kid, x, at, applied?)`, a
   verdict that is either certified (the machine and the revision) or refused with a fault (the token's or the trust
   source's) and a detail. It never throws.
2. **The verifier's option:** `estate` (a revision, or a function returning it) and `estateApplied` on
   `verifyDelegation`, `verifyApproval` and `verifyMeterToken` in `src/delegation.ts`, checked right after the signature.
3. **DL-14** in `delegation.md`: the normative rule, its refusal codes and details (the adapter's, unless DEC-0045's wire
   says otherwise), and the highest-applied-revision rule; `estate-record.md` and DL-13's table point at it.
4. **Vectors** `fixtures/vectors/hub-key.json` that ports run: certified; another `x` under the same `kid`; the `kid`
   revoked; the machine revoked; the record before and after its window (exact boundaries); a lower revision after a
   higher one was applied; an unreadable record; the cases a lax port gets wrong (a missing `x` against a missing `x`, a
   `kid` in another case, a `kid` certified for two machines).
5. **A rule code** for a consumer's fixtures, tests, plants, floors, and the consumer rows CT-18 (the adapter repins and
   runs the vectors), CT-19 (Fabric's verifier) and CT-20 (Project Observatory as callee).

## Proof

The vectors generated from the reference function, a test per refusal that fails without it (plants listed in the
pull request), `test/rule-tolerance.test.ts` for the new kind, and `pnpm run check`.
