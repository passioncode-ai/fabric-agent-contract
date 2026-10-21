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

## Decisions

No call count, no `usedBy`, no `direction` (see the page's Alternatives and Not decided here).

## Checks

`pnpm run check` before the push.

## Next task

Readings, merge, then post the merge commit on thread `131648c0` for Fabric Dashboards (FD-78) and
fabric-agent-adapter (FAA-62).
