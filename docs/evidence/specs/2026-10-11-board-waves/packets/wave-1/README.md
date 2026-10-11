# Wave 1 packets — integrate and make the gate trustworthy

Wave 1 of the [plan](../../plan.md). Its nodes are N01 (incoming PRs, run by the owner session), N02 (gate),
N03 (board) and N04 (front-door docs) of the [canvas](../../canvas.md). Each packet below is self-contained.
Read this page, then your packet, then the files it names.

## Rules every packet follows

- **Where.** Each packet has its own worktree off `origin/main`, created by the owner session, on branch
  `agent/w1-<packet>-20261011`. Edit nothing outside it, and leave other sessions' worktrees alone.
- **Disk.** The machine's disk is nearly full and fluctuates to zero. Do not run `pnpm install` and do not
  copy the repository.
  - Link the main checkout's dependencies with
    `ln -sfn /Users/sshlg/DATA/fabric-agent-contract/node_modules node_modules`.
  - Run the gate's parts directly: `./node_modules/.bin/tsc --noEmit`, `./node_modules/.bin/vitest run`,
    `python3 docs/ux/lint.py`, `./node_modules/.bin/tsx src/docs-check.ts`,
    `./node_modules/.bin/markdownlint-cli2 $(git ls-files '*.md')`. pnpm's wrapper refuses a linked
    `node_modules`.
  - Remove the link before committing. On `ENOSPC`, wait and retry. Never delete outside your worktree.
- **Registers.** `docs/DECISIONS.md`, `docs/OPEN_QUESTIONS.md`, `docs/backlog.md`, `docs/backlog-sources.json`
  and `docs/specification/conformance.md` are guarded.
  - Take a lease before the first edit with
    `python3 /Users/sshlg/.claude/plugins/cache/agent-sync/agent-sync/1.21.7/skills/agent-sync/scripts/agent_sync.py acquire <path>`,
    and release it on every path.
  - Reserve ids with `… reserve DEC` / `… reserve SEM`; never by hand.
  - `DECISIONS.md` is append-only: a status annotation or an erratum line is allowed, never a rewrite of
    a decision's text.
- **Proof.** Write the test red first and watch it fail, then fix. For each check you add or fix, plant the
  defect back, watch a test fail, and restore. Record each plant as *plant → test → failed/total*. A claim in
  a document resolves to a schema, a test, a decision id or a pinned source.
- **Style.** Match the surrounding prose and code: terse, precise, the existing comment density.
- **Land.** One commit per packet with the subject `W1 <packet>: <what>`. The body lists the closed
  inventory ids, the plants and the gate counts, and ends with
  `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.
  Push the branch and open a PR titled like the commit. Do not merge: the owner session reviews and merges.
- **Report.** Give the PR URL, the head sha, the inventory ids closed (each with its receipt), the plant
  table, and anything not done with its reason.

## Packets and order

| Packet | Node | Touches (owned) | Order |
|---|---|---|---|
| [P1-01 gate scope](P1-01-gate-scope.md) | N02 | `package.json` scripts, `vitest.config.ts` (new), `.markdownlint-cli2.jsonc`, `src/docs-check.ts` walk | after PR #31 merges |
| [P1-02 positive sweep](P1-02-positive-sweep.md) | N02 | `src/semantic-rules.ts` (FAC-SEM-012), `test/positive-sweep.test.ts` (new) | after #31 |
| [P1-03 decision paths](P1-03-decision-paths.md) | N02 | `src/docs-check.ts` (decision paths), `test/docs-check.test.ts`, `docs/DECISIONS.md` (path errata only) | after P1-01 (shares `src/docs-check.ts`) |
| [P1-04 coverage ratchet](P1-04-coverage-ratchet.md) | N02 | `package.json` (devDependency, script), `vitest.config.ts` coverage block | after P1-01 (shares `vitest.config.ts`) |
| [P1-05 registers](P1-05-registers.md) | N03 | `docs/backlog.md`, `docs/DECISIONS.md` (annotations), `docs/evidence/retro.md`, `docs/handoffs/README.md` (new), `docs/evidence/plans/*` markers | after P1-03 (shares `DECISIONS.md`) |
| [P1-06 front door](P1-06-front-door.md) | N04 | `README.md`, `docs/evidence/acceptance.md`, `CONTEXT.md`, `docs/evidence/sources.md`, `docs/DOCMAP.md` | after #31 |
| P1-07 knowledge base and wiki | N03 | other repositories: fabric-workspace `knowledge/roadmap.md` (under its lease), org-index, the projects wiki | owner session, after the wave's PRs merge |

P1-01, P1-02 and P1-06 run in parallel. P1-03 and P1-04 follow P1-01, and P1-05 follows P1-03.
