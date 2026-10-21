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

## Decisions

No call count, no `usedBy`, no `direction` (see the page's Alternatives and Not decided here).

## Checks

`pnpm run check` before the push.

## Next task

Readings, merge, then post the merge commit on thread `131648c0` for Fabric Dashboards (FD-78) and
fabric-agent-adapter (FAA-62).
