# 2026-11-08: a root installer vouches for its launchd system-domain job's listener (CT-284, DEC-0161)

## Objective

Answer the adapter's FAA-288 (board request `7eabdcee`, thread `b986b9f7`, due 2026-11-15; answered in principle in
message `ff108cd4`): let the root installer of a launchd system-domain job (a LaunchDaemon whose plist names
`UserName`, for a computer with no GUI login after FileVault) read its own job's token-free well-known document,
which HA-2 (DEC-0154) and RT-3 (DEC-0155) made unreadable to root. Needed before the adapter's next contract repin
(its FAA-258).

## Done

- [DEC-0161](../DECISIONS.md) (Proposed 2026-11-08): RT-3a in
  [service](../specification/service.md#a-restricted-socket-table), with or without a restricted table: launchd's pid
  for `system/<label>` holds the listener (the accepted connection preferred to the listen), that pid's uid equals the
  plist's `UserName` and the service's own account, an exact `127.0.0.1:<port>` bind, the token-free well-known
  document only and no credential ever. HA-2's list names the exception and says a LaunchDaemon with `UserName` runs as
  that account; the set-uid and scope paragraph covers RT-3a; the Lifecycle Install row polls a system-domain job this
  way and names `gui/<uid>` and `system` for `bootstrap`.
- [Conformance](../specification/conformance.md#clients-and-readers): the root installer's row.
- DEC-0154 and DEC-0155 annotated; backlog CT-284 (in progress).
- No contract vector set covers listener ownership (searched `src/`, `tools/vectors/`, `test/`, `fixtures/`, `schemas/`
  for `foreign-user`, `table-restricted` and `RT-3`: only a schema description matches), so this change is text and a
  conformance row; no reference module was invented. The state-order vectors stay CT-229's.

## Open

- Blind readings (unit, seam, product) until two consecutive rounds are clean; then merge and a release tag.
- After merge, owed by the adapter: item 3 of DEC-0161 (the job pid's uid checked against the plist's `UserName`;
  its `lifecycle.md` at `33b8e5ad` says the vouch rests on launchd's pid alone) and the removal of its departure note
  at its repin (FAA-258). Reply on thread `b986b9f7` once merged.
- Not decided: the systemd `--system` unit with `User=` and Windows equivalents (DEC-0161 item 8).

## Decisions

- RT-3a, not a new sentence inside RT-3: RT-3 applies only under a restricted table and only to the caller's own uid,
  while root's table usually reads, so the root case needed its own scope ("with or without a restricted table").
- U is tied to the service's own account through its services directory, not through the HA-1 claim: a claim grants
  nothing (HA-1).
- The adapter's *The system domain* text is on its branch `rel-0.78.0` at `33b8e5ad`, not on its `main` (`2c0b1b18`
  carries only the FAA-278 row); the decision cites that commit.
- Polling as `UserName` (`sudo -u`) is allowed but not required: HA-2 or RT-2 then proves the listener this account's
  without the exception.
- No UX change: SCN-056 is a host's card on the service's own account, which reads the LaunchDaemon's listener as its
  own already; the root installer is not one of its actors.
- CT ids have no counter: CT-284 is one above the highest id on `origin/main` (CT-268) and on every
  `origin/agent/ct2*` branch (CT-283 on `agent/ct218-local-cloud-v2`) when this was written.

## Checks actually run

Each once, on the change before its commit (no `src/` or `tools/` change, so no `pnpm typecheck` and no
`pnpm vectors:check`; no full gate):

- `pnpm vitest run test/consistency.test.ts test/docs-check.test.ts`: 2 files, 45 tests passed.
- `pnpm run docs:check`: "Documentation checks passed"; `lint:md` over 271 tracked Markdown files, 0 errors.
- `python3 docs/ux/lint.py`: "UX lint passed: 40 stories, 34 flows, 34 screens, 56 scenarios".
- `pnpm run privacy:check`: 0 findings.
- Em dashes in added lines (`git diff origin/main | grep '^+' | grep -c` U+2014): 0.
- `git merge-tree --write-tree HEAD origin/main` after the commit: exit 0, tree `d5860b04`, no conflicts; the em-dash count on `git diff origin/main...HEAD` was 0 there too.

## Next task

Round 1 of the blind readings (unit, seam, product) at this branch's head, `agent/ct288-system-domain-20261108`.
