# Acceptance — Fabric Agent Contract 0.1.0

Acceptance evidence captured on 2026-08-26. This page records receipts; the
normative contract remains under `docs/specification/` and `schemas/`.

## Outcome

All 21 frozen requirements are verified. Contract 0.1.0 is privately published,
Fabric consumes it through a canonical external link, and the wiki contains only
navigation cards. No runtime, SDK, CLI, UI, marketplace or model router was built.

## Repository receipts

| Subject | Receipt |
|---|---|
| Contract visibility | GitHub reported `PRIVATE` for `passioncode-ai/fabric-agent-contract` |
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

Expected measured result: strict TypeScript success, 4 test files and 34 tests
passing, UX lint covering 5 stories / 4 flows / 8 screens / 8 scenarios, document
checks passing, and 0 Markdown lint errors.

## Known operational handoff

The committed coordination configuration contains no secret. A developer using
this checkout independently must provide `AGENT_SYNC_NOTION_TOKEN` through the
ignored `.env.agent-sync` file or an equivalent environment source. The live
acceptance check reused the operator's existing secret without printing or
committing it.
