# Handoff: the organization part of an adaptation plan (2026-10-26)

## Objective

Decide the form of an adaptation plan's organization part (CT-169, TP-03): what a person's Fabric sends an
organization when the person brings work into it, a reference that names nothing of the estate, and the person's
requests to the administrators. The first organization server needs it by 2026-10-30 for its release of 2026-11-03.

## Done

- DEC-0138, [membership](../specification/membership.md#the-adaptation-plan) AD-1 to AD-6:
  - `org-adaptation/1`: items by a random per-organization `ref`, requests `access`, `spend`, `role` (`admin` only);
    `FAC-SEM-153`;
  - sent whole by the person's Fabric with the credential the server issued it, route
    `PUT /fabric/adaptation/v1/{org}/plan`; refusals `not-a-member`, `schema-unsupported`, `malformed`,
    `wrong-organization`, `stale-revision`, `revision-conflict`;
  - the server keeps the newest revision (`decideAdaptation`); an empty revision withdraws;
  - each decision bound to its request's digest (`adaptationReceipt`, `org-adaptation-receipt/1`).
- `src/org-adaptation.ts`, two schemas, fixtures, vectors `fixtures/vectors/org-adaptation.json` with their generator,
  `test/org-adaptation.test.ts`; conformance rows, CONTEXT, DOCMAP; OM-7's row and Not decided here updated.
- The shape was posted to the first organization server and Fabric in thread `5d2ea917` (objections by 2026-10-27
  18:00 UTC) and answered in the server's thread `0fee99ae`.

## Checks actually run

- `pnpm typecheck`, vitest with coverage (107 files, 9 404 tests, `src/org-adaptation.ts` at 100 % branches), `pnpm ux:lint`,
  `pnpm docs:check` (0 errors), `pnpm privacy:check` (0 findings), `pnpm vectors:check` (26 files): exit 0.

- Readings: round 1 fail (a home path in a fixture tripped the privacy check; the device-request transport, which the
  plan's author does not hold; the role wording; `schema-unsupported`); the transport is now the person's Fabric's
  credential, as the first organization server proposed.
- Round 2 fail (an own leave left the plan with the server; the route's discovery against the first server's `401`;
  `decideAdaptation` on `held: null`; the vector text). Fixed: Fabric withdraws before unpinning (OM-5, AD-6), sends only
  after a `GET` answered a receipt or `no-plan`, the receipt gains `expired` (the first server's objection), typed text
  is named in OM-7, Privacy and the linkable lists.
- Round 3 fail (the conformance row still showed a lapsed decision `pending`; SCR-31 lacked `expired`; SCN-050's
  withdrawal on the server's page had no rule). Fixed: `expired` everywhere, a server-page withdrawal is held as the next
  empty revision, the withdrawal before unpinning waits no longer than the person agrees to, `not-a-member` refreshes the
  attestation, combined-refusal vectors.
- Round 4: unit pass, seam and product fail (AD-6 forbade a later membership; DEC-0128 and devices.md lacked the new
  links; the first server's record still planned the withdrawn device transport). Fixed, and the server told in
  `0fee99ae` (`6d41733c`, `24327dbf`) and its session.
- Round 5: unit and seam pass, product fail (the text said no control character while C1 passed; SCN-050 gave up on a
  transient `GET`). Fixed with the first server's U+0000 objection (`fcf8ee88`), Fabric's two points (`d71d8534`: no
  reopening without the person, the credential's place is Fabric's) and the readings' risks; the rest is CT-171.

## Open

- Readings (two clean rounds), then merge and release; adoption is CT-169.

## Next task

Read the objections in thread `5d2ea917` (by 2026-10-27 18:00 UTC), finish the readings, merge, release by 2026-10-29,
and post the tag in threads `5d2ea917` and `0fee99ae`, naming Fabric's TP-04 duties (GET-first, withdraw before
unpinning) for its CO-421 and ADR-0178 end flow; add a row to fabric-workspace `knowledge/integration.md`; then CT-161, CT-164, CT-165, CT-167, CT-170.
