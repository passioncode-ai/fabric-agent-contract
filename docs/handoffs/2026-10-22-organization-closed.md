# 2026-10-22: a closed organization (DEC-0103, CT-105)

## Objective

The first organization server's ask 11 (board thread `ba63565c`): a transport refusal that tells a node its organization
ended, so the node stops at once instead of retrying after `certificate-revoked` and `certificate-unknown`.

## Done

- **DEC-0103**: HTTP 410 `organization-closed` with `closedAt` (schema `device-organization-closed`), answered at transport
  step 4 before revocation and after deletion from a termination record; final on one answer for the node (stop, drop
  what it buffered, end that enrollment); the share registration's gate answers `stop`.
- Code: `src/http-signature.ts` (`organizationClosedAt` on a certificate record), `src/share-registration.ts` (status 410,
  `stop`); vectors for both; docs `devices.md#organization-closed`, `share-registration.md`, `activity.md`, `conformance.md`.
- Row CT-105.

## Open

- Adoption (CT-105): the first organization server answers it; Project Observatory's node and collector stop on it.
- Blind readings (unit, seam, product) before the merge; two consecutive clean rounds.

## Checks actually run

`pnpm run check` exit 0: typecheck, 94 test files with 7 981 tests under coverage, UX lint, docs check (0 errors),
markdownlint, privacy check (0 findings); `pnpm vectors:check` exit 0, 14 vector files match their generators.

## Next task

CT-84 (S4) by 2026-10-31.
