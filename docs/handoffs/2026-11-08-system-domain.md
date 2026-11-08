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
- Round 1 of the blind readings (unit pass with 6 risks; seam fail, 1 break and 6 risks; product fail, 2 breaks and 5
  risks), folded on this branch:
  - Break (seam, product): DEC-0161's Compatibility and this handoff's Open line restated against the adapter's
    `rel-0.78.0` head `056e6bf4` (read-only, no fetch): items 2, 4 and 5 and the uid half of item 3 are taken
    (`7cabd731`, `5da30013`); the DEC's Source line names that head.
  - Break (product): the `foreign-user` entry in `CONTEXT.md` names the one exempt reader (RT-3a); `CONTEXT.md` is in
    DEC-0161's Consequences.
  - Risks folded: the conformance root-installer row says the `lsof` listen is used only under a restricted table and
    excludes a set-uid reader; DEC-0161's Context says root's table usually is not restricted; HA-2's MUST, the
    conformance client row and the glossary name the root installer under RT-3a as the exception, and CT-265 names
    RT-3a; the Install row has a root installer write the descriptor, token file and port claim as U, keeps the
    40-second bound, and refuses a system-domain label another account's plist holds before its `bootout`; DEC-0161
    item 8 and CT-284 name CT-234 as the owner of the host verbs, the domain field and host reporting for a system job,
    and CT-234 is annotated; Project Observatory's space-daemons installer (OBS-361) is named in the conformance row
    and DEC-0161's Context, the row binds any root installer that polls, and a root loader that leaves the poll to U's
    own process meets the Install row; SCN-056 says "a launch daemon that runs as root" and that a LaunchDaemon whose
    `UserName` is this account is this account's own listener; the author guide gains one sentence on the
    LaunchDaemon shape and RT-3a.
- No contract vector set covers listener ownership (searched `src/`, `tools/vectors/`, `test/`, `fixtures/`, `schemas/`
  for `foreign-user`, `table-restricted` and `RT-3`: only a schema description matches), so this change is text and a
  conformance row; no reference module was invented. The state-order vectors stay CT-229's.

## Open

- Blind readings (unit, seam, product) until two consecutive rounds are clean; then merge and a release tag.
- After merge, owed by the adapter at its `rel-0.78.0` head `056e6bf4`: the services-directory half of item 3 (U is a
  counted account whose services directory holds the descriptor; the kit checks only that `UserName` is a short name,
  an account of the Mac and not root), the set-uid exclusion (item 6; its Node kit tests only `euid === 0`, its Python
  kit only `os.geteuid() == 0`), and the removal of its departure note at its repin (FAA-258). Reply on thread
  `b986b9f7` once merged.
- The Off and Code rows still give launchd verbs without a domain; for a system job they are CT-234's (annotated).
- Register order: DEC-0156 to DEC-0160 sit on five unmerged sibling branches; the merge lands in DEC id order, so
  this branch merges after them (or the merge notes the order). Later runs name the branch after the request (for
  example FAA-288), not a CT number; this branch keeps `agent/ct288-system-domain-20261108`, while its row is CT-284.
- Not decided: the systemd `--system` unit with `User=` and Windows equivalents (DEC-0161 item 8).

## Decisions

- RT-3a, not a new sentence inside RT-3: RT-3 applies only under a restricted table and only to the caller's own uid,
  while root's table usually reads, so the root case needed its own scope ("with or without a restricted table").
- Under a restricted table, RT-3a accepts RT-3's weaker proof: it shows the job's pid listens on exactly
  `127.0.0.1:<port>`, not that the pid accepted this connection. The weakness is accepted for the same reason as
  RT-3's (DEC-0155, CT-261): the read sends no credential, and only root could bind that exact address over a wildcard
  the kit refuses. So the installer does not refuse on that path (the adapter's board question `b72a09f5`, answered
  in `567cc241`; DEC-0161 item 2).
- U is tied to the service's own account through its services directory, not through the HA-1 claim: a claim grants
  nothing (HA-1).
- The adapter's *The system domain* text is on its branch `rel-0.78.0`, not on its `main` (`2c0b1b18` carries only
  the FAA-278 row); the request was read at `33b8e5ad`, and round 1 restated what it owes against the head `056e6bf4`.
- Polling as `UserName` (`sudo -u`) is allowed but not required: HA-2 or RT-2 then proves the listener this account's
  without the exception.
- No new UX scenario: SCN-056 is a host's card on the service's own account, which reads the LaunchDaemon's listener
  as its own already; the root installer is not one of its actors. Round 1 only narrowed its "a launch daemon" to one
  that runs as root.
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

Round 1 fold, each once (the docs check was run again on the final tree, after the coordinator's mid-run addition to
item 2):

- `pnpm run docs:check`: "Documentation checks passed"; `lint:md` over 271 tracked Markdown files, 0 errors.
- `python3 docs/ux/lint.py`: "UX lint passed: 40 stories, 34 flows, 34 screens, 56 scenarios".
- `pnpm run privacy:check`: 0 findings.
- `pnpm vitest run test/consistency.test.ts`: 1 file, 23 tests passed.
- Em dashes in added lines (`git diff origin/main...HEAD | grep '^+' | grep -c` U+2014): 0.
- `git merge-tree --write-tree HEAD origin/main`: exit 0, tree `4e1bef66`, no conflicts.

## Next task

Round 2 of the blind readings (unit, seam, product) at this branch's head, `agent/ct288-system-domain-20261108`.
