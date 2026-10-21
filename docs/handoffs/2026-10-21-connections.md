# 2026-10-21: what an agent uses (DEC-0096, CT-70)

## Objective

Fabric Dashboards' proposal (thread `131648c0`): let an agent declare what it uses, so a host draws the chain.

## Done

- `schemas/service-connections-extension.schema.json`, the key in `src/extensions.ts`, `src/connections.ts`
  (`connectionsView`, `FAC-SEM-127`) wired for `service-well-known`.
- Vectors `fixtures/vectors/connections.json` from `tools/vectors/connections.ts`; one positive and two semantic fixtures;
  `test/connections.test.ts`.
- The page `docs/specification/connections.md`, a line in `service.md`, two conformance rows and the register row,
  DEC-0096, DOCMAP, README, CONTEXT, backlog CT-70.

## Also in this change (the post-merge audit of 2026-10-21)

- Documentation fixes from a blind read of `main` `c55f2d5`: stale handoff and backlog states, a duplicated DOCMAP
  row, one Next free ID marker instead of two, worded as when it was written; the access-log scenario, flow and screen
  name a partner's reads (DEC-0090); SCN-018 no longer calls an outside person a partner; a reader row for the usage
  report's lower bounds; CT-44's SEM evidence; MERGES.md marked as not written since 2026-10-11.
- `pin:check` fails a pin that is not a commit of the contract's history (`pinHistory`), which passed an unreachable
  pin before; the folder-attribution growth tests retry up to three times on a loaded machine.
- From the code audit: `partnerUsage` summed a cell's costs by copying its list per row, quadratic in one cell (16 s on
  100 000 rows); now it appends, and a test of one cell with 100 000 rows guards it. The delegation chain and the meter's
  window read a partner actor only as `isPartnerActor` does. `support-quality-daily/1`'s `checks` is never `{}`, and a
  check's pass rate counts as judged under a test. The catalogue's revision test compares with the merge base.
- New rows CT-71; CT-68 widened.
- From the second readings: a credential URL inside prose is found (every URL in a member is read by `secretUrl`), a
  bearer word without a token is prose, every answer is a fresh object, vectors for each detector branch and for
  `failing` by id rather than target; the growth tests time CPU, not the wall clock; the connections user path is
  JTBD-11, JRN-10, ST-026, FLW-21, SCR-24 and SCN-032.
- From the third readings: a neutral example service in the vectors and fixtures (no private agent's name); every
  string member is checked, an `sk-` key holds a digit, a Telegram bot token is a key, and a URL is the whole piece to
  the next space, so a password holding a bracket or a quote is found; the hosted CI checks out the whole history
  (`fetch-depth: 0`), because `pin:check`'s test asks whether a commit is on it; CT-72 records the folder-attribution
  growth tests' slack.

## Decisions

No call count, no `usedBy`, no `direction` (see DEC-0096's Alternatives refused and the page's Not decided here).

## Checks

`pnpm run check` on each pushed head: exit 0 at `c8d37b4` (82 test files, 6173 tests, privacy check 0 findings);
the final head's run is in the PR's gate comment.

## Next task

Readings, merge, then post the merge commit on thread `131648c0` for Fabric Dashboards (FD-78) and
fabric-agent-adapter (FAA-62), with CT-70's measured list of where Dashboards' reader differs; set CT-70 and this handoff's
row in `README.md` to merged with #135 and the merge commit; update the Contract row of fabric-workspace
`knowledge/roadmap.md` with DEC-0096 and the merge commit, then sync. Dashboards' re-pin (FD-78) lands before any
kit emits the key (FAA-62).
