# Handoff: the mandate's hand-over vectors and MD-2a (2026-10-26)

## Objective

Help the adapter and Fabric adopt the operator's mandate (CT-149) with vectors for the leading agent's side, MD-2's
hand-over; close the widening the readings found in it (DEC-0136).

## Done

- `fixtures/vectors/mandate.json` gains a `handOn` group (30 cases): the mandate a leading agent sends when it calls the
  next one, or `{refused: <problem>}`, with the order in which a document's problems are read. One more `cases` vector.
- DEC-0136, MD-2a: a hand-over never adds a `capabilities` or `actions` list the scope in force leaves out, except
  `actions` where it lists `capabilities`; `projects` may be added. Before it, a scope naming no call (reads and drafts
  only) could be widened by a hand-over that added a list. `scopeWithin` (`src/mandate.ts`, `namingWithin`).
- A property test in `test/mandate.test.ts`: no hand-over `scopeWithin` accepts covers a call the scope in force does
  not, over every list shape; it fails under the old rule and under weaker forms of MD-2a.
- MD-1, the `FAC-SEM-144` row (with the order of problems), the schema's descriptions of an absent `capabilities` and
  `actions`, the conformance row and DOCMAP say the same rule. DEC-0125 annotated.
- The adapter told on board thread `aa86a675` before its 0.51.0 ships: its `scope_within`/`scopeWithin` and its vector
  "a capability list under no list" take the old rule.

## Checks actually run

- `pnpm run check` after each round's fixes: exit 0 (106 files, up to 9 314 tests, UX lint, docs, markdownlint 0
  errors, privacy 0); `pnpm vectors:check`: 25 files match.
- Blind readings: round 1 unit fail (the about text taught a widening as a rule); round 2 unit pass, seam fail (the
  adapter's 0.51.0 port); round 3 pass; round 4 seam fail (the property test was vacuous for capabilities: its names
  failed the schema); round 5 pass; round 6 pass. Non-blocking findings: CT-165.

## Open

- Adoption (CT-149): the adapter's kits port MD-2a and vendor the `handOn` group (FAA-131); Fabric's hub forwards
  `call.mandate`; the callees read it.

## Next task

Merge, release, post the release on thread `aa86a675`; then DEC-0134's merge (CT-37) and DEC-0135 (CT-154).
