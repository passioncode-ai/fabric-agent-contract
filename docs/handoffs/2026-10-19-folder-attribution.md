# Handoff: DEC-0089, folder attribution (2026-10-19)

## Objective

Fabric asked (board thread `617c8cbe`, ask D1) for one rule set, with vectors, by which Fabric, Fabric Switchboard and
Project Observatory attribute a coding agent's folder to a Project. The run index, org-index
`docs/runs/2026-10-19-unified-attribution/README.md` at `5fb77fe`, holds the measured disagreements and D1 to D5. Row
CT-57, branch `agent/ct57-folder-attribution-20261019`.

## Done

- `src/folder-attribution.ts`: `attributeFolder` (AT-0 to AT-13), `normalizeOrigin`, `ownerOf`, `isPath`, `under`, and
  `FAC-SEM-121` (kind `folder-attribution`), dispatched from `src/semantic-rules.ts`; total, never throws.
- `schemas/folder-attribution.schema.json`: the snapshot and the answer, for project-observatory-contract to refer to.
- `fixtures/vectors/folder-attribution.json` (`tools/vectors/folder-attribution.ts --write`, expected values by hand,
  nothing imported from the module): 24 origin and 90 attribution cases covering every AT row, a repository, a
  worktree, a clone on another branch, a subfolder start, a plain folder, containers, a tool's folder, a temporary folder,
  an owner, work, a tie at each rank, tombstones and an explicit attach, POSIX and Windows paths.
- Fixtures: positive `folder-attribution-snapshot`, negative `folder-attribution-relative-folder`, semantic
  `folder-attribution-ok` and `-new-for-worktree`.
- Docs: `docs/specification/attribution.md` (new); identifiers.md (the repository identity is not DEC-0076's form);
  conformance (the attributing product's row, `FAC-SEM-121`, next free `FAC-SEM-122`); CONTEXT, DOCMAP, README; DEC-0089;
  CT-57 with each product's duty.

## Decisions

DEC-0089 and its *Choices made in implementation*: segment-by-segment paths on the real path; a tombstone covers its
folder and subfolders, refuses the folder (AT-2) and a new Project at a tombstoned root (AT-11), and does not refuse a
worktree of a repository another Project keeps; a listed folder is attached before the temporary refusal; a root,
home and its ancestors are never a Project and never listed; a folder right under home is a container unless listed;
broad containers are refused before every Git row and the holder of another Project's folder only before creation; a
worktree or clone joins the nearest place in its repository (each folder's `toplevel`); the repository identity folds
case and keeps group paths; a tool's folder is refused after the owner row (as Switchboard's SB-131); work
records match by common dir or by identity; a failed Git probe is not `git: null`.

For `project.attribute` (D4), a proposal to project-observatory-contract, which owns the names: the answer's refusal
reasons `transient`, `tombstoned`, `container` and `tool` (the run index planned `refused-container`), a tie as
`ambiguous` with its Projects, a bad snapshot as `input-invalid`, all from `folder-attribution.schema.json#/$defs/answer`;
and one state the function never answers, "not attributable yet" while the product's Git probe fails.

## Readings

The first unit and product readings of `bfca2a6` failed it. The order was AT-0 to AT-11 with the temporary refusal
first, containers last and a tombstone read at the root before every attach row: a Project kept under a temporary root
was refused, a home that is a clone of a Project's repository was attached to it, a worktree of a Project whose main
checkout another Project tombstoned was refused, the outer of two nested Projects lost its folders to the root rule,
an identity without work records' origin could not join a second clone, bounds were unchecked against the schema and a
deep path could overflow the stack. The first fix round (`0f45218`) reordered to AT-0 to AT-12, added bounds in code
points, the work record's origin, the ancestors of home as containers and a loop instead of a spread.

The second readings of `0f45218`: the seam reading passed with five risks; the unit and product readings failed it. A
folder right under home that a Project lists was refused, though the table excluded such folders only as ancestors;
and with two nested Projects (`mono` listing the repository, `pkg` its subfolder) a worktree of `mono` was refused as a
container and a clone of it tied. The second fix round: a Project folder carries its Git `toplevel`, and AT-6 and AT-7
pick the nearest place in the repository, so a worktree or clone is read as the same tree; the holder of another
Project's folder is refused only before creation (AT-12, `new` is AT-13); a folder right under home a Project lists is
its folder. Also: slashes trimmed in linear time (10,000 sources of 4,096 slashes took 72 s), vectors for bare
repositories, the scp leading `/`, a trimmed origin, an SSH alias and an underscore host, a sweep that replaces every
node of every vector's snapshot with a hostile value, two semantic fixtures carrying `work`, `tombstones`, `explicit`
and `toplevel`, and each product's measured change written out.

## Plants

Each clause and row was removed or loosened once and the focused tests (`test/folder-attribution.test.ts`,
`test/fixtures.test.ts`) were run: 30 plants, 28 killed on the first pass; the two survivors were closed with vectors ("AT-6: a worktree whose
main checkout a Project lists" and "AT-9: a worktree of an unknown repository whose main checkout is in a tool folder"),
then killed.

The fix round planted 18 more, one per new clause (the listed ancestor skipping containers, the ancestors of home, a
folder right under home, the nearest strictly, the temporary root, a container's own root, the main checkout row, work
by identity, the tool root, the tombstoned root, a tombstone read early at the root, the order of the folder and
temporary rows, containers before the Git rows, the tool row after the owner row, the scp query, the work record's
origin): 16 killed on the first pass; the two survivors (an id counted in UTF-16 units, an unbounded work origin) were
closed with vectors, then killed (the commit message's "20 plants" counts those two reruns).

The second fix round planted 12 more (an empty place holding every place, the nearest place strictly, the place
ignored, a `toplevel` that does not hold its folder, the place read from `toplevel`, a listed folder right under home,
the holder refused only before creation, a repository at the filesystem root, the repository row by place, sources
trimmed, an origin path's leading `/`, a listed folder right under home in AT-3): 11 killed on the first pass; the
survivor (the leading `/` of an scp path) was closed with an origin vector, then killed. 60 plants in all, every one
killed.

## Checks

`pnpm run check` at the second fix round, each step exiting 0: typecheck; 77 files, 5911 tests, branches 7666 / 7739
with `src/folder-attribution.ts` at 219 / 219; UX lint passed; documentation checks passed, lint-md 0 errors; privacy-check 0
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
