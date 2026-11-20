# Handoff: the agent and project manifest, and self-healing (CT-353, CT-354), paused for the strategic plan

- **Date:** 2026-11-21
- **Branch:** `agent/ct353-manifest-20261120` (pushed, not merged; no tag; no rollout)
- **Entry point:** [`docs/reports/2026-11-20-manifest-research/README.md`](../reports/2026-11-20-manifest-research/README.md)

## Objective

The owner's order in the CEO window of Fabric (2026-11-20, session `53895bdc`, packages 5 and 6; addenda of 23:40,
00:25 and 00:50): a universal "agent manifest" and "project manifest" of fundamental rules independent of technology,
kept in this contract, rendered by the Fabric Agent Adapter into every project, checked in the agents base's templates
and at creation in Fabric; self-healing written into the protocol; then an AI-native run over every agent and project.

## Done

- Research and a proposal: the report above (what exists: A2A Agent Card, MCP server card, `AGENTS.md`, this contract's
  documents, the base's R33; the finding; two layers, article and binding; twelve articles; where each is checked).
- Drafts under [`draft/`](../reports/2026-11-20-manifest-research/draft/): the spec `manifest.md`, `self-healing.md`
  (HEAL-0 to HEAL-7, with the owner's 00:50 requirement: starts by itself, detect, diagnose, repair, retry or roll back,
  report, a person only at a human gate), the schemas `fabric-manifest.schema.json` and `heal-attempt.schema.json`, the
  rule `src/manifest-rules.ts` (`FAC-SEM-187` as proposed), the templates `MANIFEST.agent.md` and `MANIFEST.project.md`.
- The AI-native sweep, read only; no board request sent: the passioncode-ai part in
  [`sweep.md`](../reports/2026-11-20-manifest-research/sweep.md) (37 repositories); the whole estate (198: missing 22,
  partial 104, ai-native 1, n/a 71) in the operator's private repository, branch `agent/ai-native-sweep-20261121`,
  commit `35d62b91`, because it names personal projects and other organizations.
- Backlog rows CT-353 and CT-354 (`docs/backlog.md`), status open, paused.
- Reserved by git CAS on origin: DEC-0190, DEC-0191, `FAC-SEM-187`, `FAC-SEM-188` (keys in the report, section 7).

## Decisions taken here, with reasons

- The drafts live inside the report, not in `schemas/`, `src/` or `docs/specification/`, and `docs/DECISIONS.md` and
  `conformance.md` were not touched: the owner's pause («без релиза контракта и раскатки») means nothing becomes a norm
  before the plan; the gate of `main` stays as it was.
- Two layers (article, binding), so the articles do not change when a technology does, which is what the owner asked.
- `owed` with a row and a date is a status of its own, so a first manifest is honest on its first day.

## Checks actually run

- The draft schema and rule on the draft spec's example (valid, no finding), on a broken copy (four findings), the
  folder form on the agent template (twelve headings found), and a `heal-attempt/1` example (valid): a smoke run with
  `tsx` from this session, not a test in the gate.
- The gate's steps on the branch, run one by one with the main checkout's dependencies (the disk was under the
  install line, so no dependency install ran): `tsc --noEmit`, `vitest run --coverage` (lines 99.48 %),
  `docs/ux/lint.py`, `src/docs-check.ts`, `src/lint-md.ts` (0 errors), `src/privacy-check.ts` (0 findings after one
  private name was dropped from the sweep page): all green. The drafts are outside the gate's code paths by design.

## Open, and prerequisites

- The strategic plan (Fabric session `2d03ce15`) decides scope and order: the report's section 5 lists the questions.
- Then: the DEC (DEC-0190, DEC-0191), the schemas and rule into the gate with fixtures and tests, the folder route in
  `src/validate-cli.ts`, the release tag; board requests to fabric-agent-adapter (render and probe; its session
  `6a78ed83`), fabric-agents-database (templates and `tools/check.py`; its session `4deaa22b`, which holds the update
  policy for our own and clients' projects), Fabric (creation), and every project the sweep found with a gap.
- The four board requests waiting on this project that the manifest touches (`4e931220`, `7041380c`, `b5162cd8`,
  `41d6e251`) are not answered by this run; the report's section 4 says how each relates.

## Exact next task

When the plan names this work: reserve-check the four ids (same keys), move the drafts into `docs/specification/`,
`schemas/` and `src/`, register the kinds and rule codes, write fixtures and tests, run `pnpm run check`, open the PR.

## Update of 2026-11-21: the system plan named this work

The system plan's spec for this project ([fabric-workspace `docs/plans/2026-11-21-system-design/specs/fabric-agent-contract.md`](https://github.com/passioncode-ai/fabric-workspace/blob/main/docs/plans/2026-11-21-system-design/specs/fabric-agent-contract.md),
board request `d99e709d`, thread `5bbb6b96`) lifts the pause for SD-CON-01 to SD-CON-05 and orders seven features. Each
has its row in [`docs/backlog.md`](../backlog.md):

| SD id | Row | Due |
|---|---|---|
| SD-CON-01 `incident/1` | CT-355 | 2026-11-28 |
| SD-CON-02 dispatch acknowledgement, `estate-notice/1` | CT-356 | 2026-12-01 |
| SD-CON-03 `self-heal/1` | CT-354 (this branch) | 2026-12-03 |
| SD-CON-04 `agent-manifest/1`, `project-manifest/1` | CT-353 (this branch) | 2026-12-05 |
| SD-CON-05 `model-policy/1` | CT-357 | 2026-12-05 |
| SD-CON-06 `update-graph/1` | CT-358 | 2026-12-19, starts 2026-12-08 |
| SD-CON-07 Memory profiles | CT-359 | 2026-12-19, starts 2026-12-08, waits on SD-FAB-07 |

DEC-0190 and DEC-0191 stay reserved for CT-353 and CT-354 (the spec's "next free decision: DEC-0190" predates that
reservation); CT-355 takes the next free id when it lands.

**Exact next task:** CT-355 (SD-CON-01, `incident/1`): reserve a DEC, write the schema beside `agent-health/1` with its
examples, a mapping test from an `agent-health/1` episode and a refusal test for free text in a code field, run
`pnpm run check`, open the PR. Then CT-356, CT-354, CT-353, CT-357 in the spec's order.
