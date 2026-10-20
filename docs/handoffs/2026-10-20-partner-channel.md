# 2026-10-20: the partner channel (DEC-0090, CT-58)

## Objective

PA-06 of the operator's standing decision SD-1 (board thread `6e66a023`): what a partner's signed package may be
trusted for, what a partner may read of its agents' usage, and how a company's owner lets a partner act on its agents.
Brief: `docs/evidence/specs/2026-10-19-partner-channel/brief.md`.

## Done

- `publisherScopes` in `estate-record/1`, `placementTrust` and `FAC-SEM-122`, five semantic fixtures.
- `partnerUsage` (`src/partner-usage.ts`) with vectors, and `FAC-SEM-123` on a partner's access-log reads.
- The `partner` principal kind, the partner actor in `act` and `FAC-SEM-124` at mint and at verification.
- The page `docs/specification/partner-channel.md`, the neighbour pages, the register rows, three duty rows,
  DEC-0090, DOCMAP, README, CONTEXT, backlog CT-58.
- Plants: 32 planted across the three parts, all killed (`b2fbb93`).

## Decisions

PA-01 is taken as decided: a partner organization's id is an ordinary organization id, named by `org:<partnerOrgId>`.

## Checks

`pnpm run check` before the push, each step exiting 0.

## Next task

Readings, merge, then answer on board thread `6e66a023` with the merge commit, and update RM-31 in fabric-workspace
`knowledge/roadmap.md`.
