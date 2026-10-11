# Acceptance — Fabric Agent Contract 0.1.0

This page records receipts; the normative contract remains under `docs/specification/` and `schemas/`.
The first section is today's measured state. Everything after it is the acceptance record of
2026-08-26, kept as history: its counts and its visibility line describe that day, not now.

## Current state (measured 2026-10-11, `main` at `2afbe60`)

| Subject | Receipt |
|---|---|
| Visibility | `gh repo view passioncode-ai/fabric-agent-contract --json visibility` → `PUBLIC` |
| Schemas | `ls schemas \| wc -l` → 67 |
| Fixtures | 129 positive, 190 negative (`fixtures/catalogue.json`), 102 semantic |
| Gate | `pnpm run check`: 25 test files, 852 tests; UX lint 11 stories, 9 flows, 12 screens, 15 scenarios; docs check and markdownlint clean. Two tests, FIFO probes with a 2 s child limit (`meter-grant`, `session-handoff-review`), fail under machine load without a defect; wave 1 of the board run raises the limit (packet P1-01) |
| Decisions | DEC-0001…DEC-0042 (DEC-0028 unwritten: its reservation was returned); next free DEC-0043, FAC-SEM-056 |
| Open work | the [board run](specs/2026-10-11-board-waves/brief.md): inventory, canvas and six waves |

## The 2026-08-26 acceptance record

## Outcome

All 21 frozen requirements are verified. Contract 0.1.0 is privately published,
Fabric consumes it through a canonical external link, and the wiki contains only
navigation cards. No runtime, SDK, CLI, UI, marketplace or model router was built.

## Repository receipts

| Subject | Receipt |
|---|---|
| Contract visibility | GitHub reported `PRIVATE` for `passioncode-ai/fabric-agent-contract` on 2026-08-26 (public since; see *Current state*) |
| Contract publication | PR #1 merged at `489737051828fafec92463df04b6a6fd3280c7b7` |
| Contract CI | GitHub Actions job `contract` completed `SUCCESS` |
| Fabric adoption | Fabric PR #1 merged at `5bb98740c84b006e0ef4f1509ec66018623d75cd` |
| Fabric checks | repository reported no configured PR checks; local evidence and docs checks were used |
| Coordination | dedicated Notion record plane resolved; Git-ref lease check passed 11 checks |
| Wiki | `projects/fabric/fabric.md` and `projects/fabric-agent-contract/fabric-agent-contract.md` resolve and contain canonical links only |

Canonical remote receipts:

- <https://github.com/passioncode-ai/fabric-agent-contract/pull/1>
- <https://github.com/passioncode-ai/fabric-agent-contract/actions/runs/33010669878/job/98315785478>
- <https://github.com/passioncode-ai/fabric/pull/1>

## Verification matrix

| REQs | Evidence |
|---|---|
| REQ-001–004 | private governed repository; 13 compiled schemas; three protocol profiles; admission lifecycle and fixtures |
| REQ-005–008 | typed results, logical work graph, project-first memory, promotion, retrospectives and loop guards validated by fixtures and semantic rules |
| REQ-009–014 | immutable settings, coordination, Git flow, execution contexts, account pools, roles and governance validated in schemas and negative cases |
| REQ-015–017 | 5 stories, 4 flows, 8 screens and 8 scenarios linted; full estate diagrams parsed; local and GitHub gates green |
| REQ-018–020 | live coordination check, merged Fabric ADR adoption and resolving navigation-only wiki cards |
| REQ-021 | merged canonical repos, retrospective, planted failure and final clean-state audit |

## Negative control

The negative result fixture was deliberately relabelled as valid. The focused
Vitest run exited 1 and reported missing required property `notVerified`. The
fixture catalogue was restored and the full gate returned green. This proves the
validator detects the failure that REQ-005 names.

## Final local gate

The acceptance command is:

```bash
CI=true pnpm install --frozen-lockfile
CI=true pnpm run check
```

Measured on 2026-08-26: strict TypeScript success, 4 test files and 34 tests
passing, UX lint covering 5 stories / 4 flows / 8 screens / 8 scenarios, document
checks passing, and 0 Markdown lint errors. Today's counts are in *Current state* above.

## Known operational handoff

The committed coordination configuration contains no secret. A developer using
this checkout independently must provide `AGENT_SYNC_NOTION_TOKEN` through the
ignored `.env.agent-sync` file or an equivalent environment source. The live
acceptance check reused the operator's existing secret without printing or
committing it.
