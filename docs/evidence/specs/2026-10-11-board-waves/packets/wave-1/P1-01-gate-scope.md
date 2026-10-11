# P1-01 — the gate measures only this repository

- **Node:** N02 gate · **REQ:** REQ-07 · **Wave:** 1
- **Closes:** F-A-001, F-D-026 (agent-sync residue). The receipts are in [inventory.json](../../inventory.json),
  under `evidence` and `proposed_fix` for each id.

## Why

`pnpm run check` sweeps everything under the working directory. On 2026-10-11 it failed with other sessions'
worktrees in `.claude/worktrees/`: 4 of 2158 tests from a foreign `test/meter-grant.test.ts`, and 20 614
markdownlint errors from foreign `node_modules` and `.git/logs/refs/remotes/agent-sync-leases/…`. The gate's
verdict must depend on this repository's tracked files only.

## What to build

1. `vitest.config.ts` (new): `test.include: ["test/**/*.test.ts"]` and `test.exclude` covering `.claude/**`,
   `**/node_modules/**` and `**/.git/**`. Keep the current behaviour: no other config is needed today, so
   nothing else may change.
2. Markdown lint over tracked files. Change the `docs:check` script so markdownlint receives
   `git ls-files '*.md'` (through a small `src/tracked-files.ts` helper used by both `docs-check.ts` and a
   new `lint:md` script). If the shell form is simpler and portable on Linux CI, use
   `markdownlint-cli2 $(git ls-files '*.md')`. Add `.claude/**` to `.markdownlint-cli2.jsonc` `ignores` as
   a second guard.
3. `src/docs-check.ts` `walk()` (lines 19-28) reads `git ls-files` instead of the directory tree, so
   `.claude/`, untracked files and `.git/` are never read. Fall back to the walk only when git is absent,
   and say so in one line on stderr.
4. `.gitignore`: add `.claude/worktrees/`.
5. agent-sync residue (F-D-026):
   - regenerate `docs/AGENT_SYNC.md` with `agent_sync.py setup`;
   - `docs/MERGES.md`, the configured merge log: create it with its header, as `agent_sync.py merge` expects
     (read the tool's `merge` help), rather than removing the config;
   - delete the remote branches whose PRs are merged: `agent/dec-delegation-20261011`,
     `agent/dec-embedded-dashboard-20261011`, `agent/dec-operator-channel-20261010`,
     `agent/dec-operator-channel-group-chat-20261010` and `agent/dec-0041-meter-20261011`. Run
     `git merge-base --is-ancestor origin/<b> origin/main` for each first and delete only those that exit 0.

## Proof

- Planted, to be seen failing before the fix and passing after it: create
  `.claude/worktrees/plant/test/x.test.ts` holding `it("fails", () => { throw 1 })` and
  `.claude/worktrees/plant/x.md` with a lint error. Before the fix the gate parts fail. After it they pass.
  Delete the plant.
- A test in `test/docs-check.test.ts` asserts that the tracked-file list excludes a file under
  `.claude/worktrees/`. Plant: make the helper return the directory walk, and the test fails.
- Gate: all five parts green. Record the test counts.

## Files you own

`vitest.config.ts`, `package.json` (`scripts` only), `.markdownlint-cli2.jsonc`, `.gitignore`,
`src/docs-check.ts` (the walk only), `src/tracked-files.ts`, `test/docs-check.test.ts` (one new case),
`docs/AGENT_SYNC.md`, `docs/MERGES.md`.
