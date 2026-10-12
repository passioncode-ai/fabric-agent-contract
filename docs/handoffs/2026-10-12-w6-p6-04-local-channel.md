# Handoff — the local channel to the node (DEC-0075, board run wave 6, P6-04; CON-OE-10)

## Objective

Close CON-OE-10 in its v4 edition: how Fabric, Switchboard and Dashboards reach Project Observatory's node on the same
machine, with no network port, no browser origin and no `policy.decide`.

## Done

- **DEC-0075**, reserved by git CAS; rule code **FAC-SEM-106** (receipt SEM-0106). Agreed with Project Observatory's
  session, its changes taken whole (socket locations, the 0700 directory as access control, Windows pipe checks,
  hello within 5 s, 1 MiB lines, consent prompted only to `consent.ui` clients with a deadline and a cancel).
- Schema `local-channel.schema.json` (params bound by method, each error code tied to its integer); the descriptor's
  `channels.local` (an absolute path of at most 99 bytes or a per-user pipe; none on a remote placement);
  `src/local-channel.ts` (`admitPeer`, `channelStep`, `mayPrompt`, `consentOutcome`, `lineWithinLimit`, `NODE_METHODS`,
  `CLIENT_METHODS`, `ERROR_CODES`, `FAC-SEM-106`); the revision registered (DEC-0067, named-only).
- Two readings before merge: Project Observatory's session (node side) and an independent three-tier reading; both
  fix rounds are in.
- Spec [local channel](../specification/local-channel.md); service.md; CT-03, CT-16, CT-19, CT-20, CT-21.

## Checks run

On main `146240a` (merged): `tsc --noEmit` exit 0; vitest 61 files, 3234 tests, every floor met (`local-channel.ts` 100 %);
docs-check passed; markdownlint 0 errors; privacy 0 findings with `ORG_INDEX`.

## Open

- Readings before merge; send Project Observatory's session the PR link.
- **Next task:** close wave 6 (CON-OE-03 measured against DEC-0050/0051/0055/0061; CON-OE-06 to the program; N19 and
  N20 recorded).
