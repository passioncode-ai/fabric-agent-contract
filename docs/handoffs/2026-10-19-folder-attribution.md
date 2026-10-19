# Handoff: DEC-0089, folder attribution (2026-10-19)

## Objective

Fabric asked (board thread `617c8cbe`, ask D1) for one rule set, with vectors, by which Fabric, Fabric Switchboard and
Project Observatory attribute a coding agent's folder to a Project. The run index, org-index
`docs/runs/2026-10-19-unified-attribution/README.md` at `5fb77fe`, holds the measured disagreements and D1 to D5. Row
CT-57, branch `agent/ct57-folder-attribution-20261019`.

## Done

- `src/folder-attribution.ts`: `attributeFolder` (AT-0 to AT-11), `normalizeOrigin`, `ownerOf`, `isPath`, `under`, and
  `FAC-SEM-121` (kind `folder-attribution`), dispatched from `src/semantic-rules.ts`; total, never throws.
- `schemas/folder-attribution.schema.json`: the snapshot and the answer, for project-observatory-contract to refer to.
- `fixtures/vectors/folder-attribution.json` (`tools/vectors/folder-attribution.ts --write`, expected values by hand,
  nothing imported from the module): 20 origin and 53 attribution cases covering every AT row, a repository, a
  worktree, a clone on another branch, a subfolder start, a plain folder, containers, a tool's folder, a temporary folder,
  an owner, work, a tie at each rank, tombstones and an explicit attach, POSIX and Windows paths.
- Fixtures: positive `folder-attribution-snapshot`, negative `folder-attribution-relative-folder`, semantic
  `folder-attribution-ok` and `-new-for-worktree`.
- Docs: `docs/specification/attribution.md` (new); identifiers.md (the repository identity is not DEC-0076's form);
  conformance (the attributing product's row, `FAC-SEM-121`, next free `FAC-SEM-122`); CONTEXT, DOCMAP, README; DEC-0089;
  CT-57 with each product's duty.

## Decisions

DEC-0089 and its *Choices made in implementation*: segment-by-segment paths on the real path; a tombstone covers its
folder and subfolders and is read at the folder and at the root; the repository identity folds case and keeps group
paths; a tool's folder is refused after the worktree and repository rows (as Switchboard's SB-131); a temporary folder
is refused before every row.

## Plants

Each clause and row was removed or loosened once and the focused tests (`test/folder-attribution.test.ts`,
`test/fixtures.test.ts`) were run: 30 plants, 28 killed on the first pass; the two survivors were closed with vectors (a
removed worktree whose main checkout is a Project's, A-06; a worktree whose main checkout is in a tool folder, A-13),
then killed.

## Checks

`pnpm run check`, each step exiting 0: typecheck; 76 files, 5861 tests, branches 7616 / 7689 with
`src/folder-attribution.ts` at 169 / 169; UX lint passed; documentation checks passed, lint-md 0 errors; privacy-check 0
findings, run again after the commit.

The first push (`7146c7c`) carried 439 privacy findings: P3, the shape of a home path (`/home/<name>`, `/Users/<name>`) in
the vectors' fictional home, and P2, the e-mail shape of two remote examples with userinfo. No real name or address was
in them, but the rule binds shapes. The gate before the commit had not read the new files (`check_private.py` reads
tracked files only), and the push command tested `grep`'s exit, not the check's. The vectors now use `/u/ana` and
`C:/Profiles/ana` and userinfo `git@`; the check exits 0; the pushes since are gated on the check's own exit code.

## Next task

Open the pull request, run the blind readings, merge, then post the merge commit on thread `617c8cbe` for Fabric,
Switchboard (SB-141: within a working day of the merge) and Observatory, and a request to project-observatory-contract
for `project.attribute` (D4) referring to `folder-attribution.schema.json`.
