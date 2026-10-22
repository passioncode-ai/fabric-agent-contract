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

## First round of readings

Unit: two breaks, fixed (the signed vector's signature did not verify under its certificate, so it carried two faults:
re-signed with a fresh P-256 key; `decideShareRegistration` read `closedAt` loosely: now strictly, with a vector). Seam:
two breaks, fixed (Project Observatory's node already ends an enrollment on `401 certificate-revoked`, so the 410 goes
only to a node pinned at or after DEC-0103; FAC-SEM-077 and its conformance row still said 401). Product: three breaks,
fixed (the SR table, FAC-SEM-077's input, a free-text body without the path bound: the body is now nested like every
device refusal with a path-free `message`). Their risks too: the verdict carries `status: 410`, the server keeps serials
after deletion, only once the closing can no longer be cancelled, `closedAt` is the start of closing, ending an
enrollment discards that organization's policy layer and key set, SCN-011 and the glossary, the node's resend rules.

## Open

- Adoption (CT-105): the first organization server answers it; Project Observatory's node and collector stop on it.
- Blind readings (unit, seam, product) before the merge; two consecutive clean rounds.

## Checks actually run

`pnpm run check` exit 0: typecheck, 94 test files with 7 987 tests under coverage, UX lint, docs check (0 errors),
markdownlint, privacy check (0 findings); `pnpm vectors:check` exit 0, 14 vector files match their generators.

## Next task

CT-84 (S4) by 2026-10-31.
