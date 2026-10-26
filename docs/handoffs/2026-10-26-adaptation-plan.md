# Handoff: the organization part of an adaptation plan (2026-10-26)

## Objective

Decide the form of an adaptation plan's organization part (CT-169, TP-03): what a person's Fabric sends an
organization when the person brings work into it, a reference that names nothing of the estate, and the person's
requests to the administrators. The first organization server needs it by 2026-10-30 for its release of 2026-11-03.

## Done

- DEC-0138, [membership](../specification/membership.md#the-adaptation-plan) AD-1 to AD-6:
  - `org-adaptation/1`: items by a random per-organization `ref`, requests `access`, `spend`, `role` (`admin` only);
    `FAC-SEM-153`;
  - sent whole as a device request by the member's node (DEC-0056), route `PUT /fabric/adaptation/v1/{org}/plan`;
  - the server keeps the newest revision (`decideAdaptation`); an empty revision withdraws;
  - each decision bound to its request's digest (`adaptationReceipt`, `org-adaptation-receipt/1`).
- `src/org-adaptation.ts`, two schemas, fixtures, vectors `fixtures/vectors/org-adaptation.json` with their generator,
  `test/org-adaptation.test.ts`; conformance rows, CONTEXT, DOCMAP; OM-7's row and Not decided here updated.
- The shape was posted to the first organization server and Fabric in thread `5d2ea917` (objections by 2026-10-27
  18:00 UTC) and answered in the server's thread `0fee99ae`.

## Checks actually run

- `pnpm typecheck`, vitest with coverage (106 + 1 files, 9 400 tests, `src/org-adaptation.ts` at 100 % branches), `pnpm ux:lint`,
  `pnpm docs:check` (0 errors), `pnpm privacy:check` (0 findings), `pnpm vectors:check` (26 files): exit 0.

## Open

- Readings (two clean rounds), then merge and release; adoption is CT-169.

## Next task

Read the objections in thread `5d2ea917` (by 2026-10-27 18:00 UTC), finish the readings, merge, release by 2026-10-29,
and post the tag in threads `5d2ea917` and `0fee99ae`; then CT-161, CT-164, CT-165, CT-167, CT-170.
