# 2026-10-22: a schema pattern never uses a bare `.` (DEC-0097; CT-87 to CT-89)

## Objective

Close the open security hole fabric-agent-adapter found on 2026-10-22 (board thread `de8834d8`, finding 40): the
`fabric-package/1` path pattern accepted a traversal after U+2028 or U+2029. Then record the asks the board's last page
carried that the [iteration's plan](2026-10-22-iteration-plan.md) had not seen.

## Done

- **DEC-0097.** Every schema pattern writes any character as `[\s\S]`; the package path and the device `detail` now
  refuse what follows a line or paragraph separator; five other patterns are rewritten with an unchanged accept set.
- **Proof.** Six negative fixtures (four package paths, two device details), each accepted by the patterns of `main`
  `66520f0` compiled under `u` and refused after; a test that refuses a bare `.` in any schema pattern, with its own
  plant; a test of every separator plant against both guards. The two real package manifests on this machine (10
  paths) keep every verdict; no stored device check-in exists here to measure.
- **Rows.** CT-87 (adoption of DEC-0097), CT-88 (a `purpose` rejection reason, a share-registration refusal the node
  retries, certificate renewal; thread `ba63565c` items 9, 10), CT-89 (the hub moved, passkey recovery; `b2511678`);
  CT-86 now also covers the envelope between one person's own machines and the estate key (`21684886`). The plan's
  tables carry them.
- The retro's entry for the day and its lesson.

## Open

- CT-81 to CT-89 in the plan's order. CT-87 is the consumers'.

## Checks actually run

`pnpm run check` exit 0: typecheck, 93 test files with 7 747 tests under coverage, UX lint, docs check (0 errors),
markdownlint, privacy check (0 findings). Plants: `main`'s `fabric-package` schema put back fails six tests (the
bare-dot rule, the separator test, the four package fixtures); `main`'s `device-common` schema put back fails four
(the two rules, the two device fixtures). Both schemas restored before the commit.

## Next task

CT-81, as the [iteration's plan](2026-10-22-iteration-plan.md) says.
