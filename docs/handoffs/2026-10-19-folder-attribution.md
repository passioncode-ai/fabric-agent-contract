# Handoff: DEC-0089, folder attribution (2026-10-19)

## Objective

Fabric asked (board thread `617c8cbe`, ask D1) for one rule set, with vectors, by which Fabric, Fabric Switchboard and
Project Observatory attribute a coding agent's folder to a Project. The run index, org-index
`docs/runs/2026-10-19-unified-attribution/README.md` at `5fb77fe`, holds the measured disagreements and D1 to D5. Row
CT-57, branch `agent/ct57-folder-attribution-20261019`.

## Done

- `src/folder-attribution.ts`: `attributeFolder` (AT-0 to AT-15), `explainFolder` (the answer, its row and the folder to record), `normalizeOrigin`, `ownerOf`, `isPath`, `under`, and
  `FAC-SEM-121` (kind `folder-attribution`), dispatched from `src/semantic-rules.ts`; total, never throws.
- `schemas/folder-attribution.schema.json`: the snapshot and the answer, for Fabric's session-start capability to refer to.
- `fixtures/vectors/folder-attribution.json` (`tools/vectors/folder-attribution.ts --write`, expected values by hand,
  nothing imported from the module): 28 origin, 130 attribution and 18 record cases covering every AT row, a repository, a
  worktree, a clone on another branch, a subfolder start, a plain folder, containers, a tool's folder, a temporary folder,
  an owner, work, a tie at each rank, tombstones and an explicit attach, nested Projects, bare repositories, declared
  containers, POSIX and Windows paths.
- Fixtures: positive `folder-attribution-snapshot`, negative `folder-attribution-relative-folder`, semantic
  `folder-attribution-ok`, `-new-for-worktree`, `-work-by-origin` and `-explicit-over-tombstone`.
- Docs: `docs/specification/folder-attribution.md` (new); identifiers.md (the repository identity is not DEC-0076's form);
  conformance (the attributing product's row, `FAC-SEM-121`, next free `FAC-SEM-122`); CONTEXT, DOCMAP, README; DEC-0089;
  CT-57 with each product's duty.

## Decisions

DEC-0089 and its *Choices made in implementation*: segment-by-segment paths on the real path, Project ids as written; a
tombstone covers its folder and subfolders, refuses the folder (AT-2) and a new Project at a tombstoned root (AT-13),
and does not refuse a worktree of a repository another Project keeps; a listed folder is attached before the temporary
refusal; a broad folder (a root, home, an ancestor of home, a declared container) is never a Project, never listed and
refused for the folder and its root alike; a folder right under home is a container unless listed; a worktree or clone
is the same tree (the nearest place by each folder's `toplevel`, else the main checkout's Project, else a container of
the repository's deeper Projects); a root holding a Project's folder is never made a Project; the repository identity
folds case and keeps group paths; a tool's folder is refused after the owner row (as Switchboard's SB-131); work
records match by common dir or identity; each product records `explainFolder`'s `record` (the matched place in this
checkout, the root for `new`), so later answers stay; a folder a Project lists below a tombstone gets through it; a failed Git probe is not
`git: null`, and a home kept under Git is.

For the session-start capability (D4), which the operator moved to Fabric's hub later on 2026-10-19 (Fabric ADR-0166,
amendment "Fabric is the core"; the canonical Project id is Fabric's too, D3), a proposal to Fabric, which owns its
names (it replaces the planned `project.attribute` in project-observatory-contract): the answer's refusal
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
Project's folder is refused only before creation (then AT-12, `new` AT-13); a folder right under home a Project lists is
its folder. Also: slashes trimmed in linear time (10,000 sources of 4,096 slashes took 72 s), vectors for bare
repositories, the scp leading `/`, a trimmed origin, an SSH alias and an underscore host, a sweep that replaces every
node of every vector's snapshot with a hostile value, two semantic fixtures carrying `work`, `tombstones`, `explicit`
and `toplevel`, and each product's measured change written out.

The third readings of `af9eff9`: the seam reading passed; the unit and product readings failed it. A worktree whose
main checkout lies in a plain Project folder made a second Project and took that folder away; a second clone of a
repository whose only Project is a subfolder became a second Project; home as a worktree, and a worktree right under
home, were attached while a clone there was refused; the work row was quadratic (10,000 by 10,000 in 1.3 s); the
Observatory duty could not be met, nothing said what a product records after an answer, and Project ids were compared
without saying so. The third fix round rebuilt the order as AT-0 to AT-15 on one model (a worktree or clone is the same
tree): broad folders (with declared `containers`) refused for the folder and the root alike, the main checkout's
Project (AT-8), a repository whose Projects all sit deeper refused (AT-9), the work row in one pass, *Recording the
answer*, Project ids compared as written (identifiers.md), the main checkout from `git worktree list --porcelain`, and
CO-330 corrected to `8bdad97c` and `f7c71cba` (CO-331).

The fourth readings of `75dc421`: both failed it on recording. Recording a Git attach at the bare top level let a
recorded worktree take a nested Project's place by path; a `new` root recorded with the snapshot's top level faulted
every later snapshot; an explicit attach below a tombstoned parent could not last; a worktree whose main checkout is
right under home was refused while its clone joined; and two clauses (a broad root, AT-6's main checkout) had no
vector. The fourth fix round: `explainFolder` answers the row and the record, recorded at the matched place (the
record vectors and a sequence test apply each record and ask again); AT-3 decides by place when a folder of the
folder's own repository holds it; AT-2 lets a folder a Project lists below the tombstone through; AT-5 reads a root
right under home only when no Project folder is in its repository; drive letters upper case, ASCII lower-casing,
origins normalized on first read, the dead AT-14 clause removed; each vector's name checked against the row that
decides it; the products' owed changes (Fabric's worktree before its breadth check, Switchboard's `record_worked`,
scenarios) and the cases that go against the operator's literal words written out.

The fifth readings of `2c1a426` (the unit and product readings; the seam reading had passed twice): both failed it,
narrowly. AT-2 was quadratic in the tombstones (10,000 identical tombstones against 10,000 folders took 33.6 s);
sources were folded with full Unicode lower-casing while the identity folds `A` to `Z` only, so an owner with an
upper-case non-ASCII letter never matched; the list of results against the operator's literal words named three and
missed AT-5 (a worktree or clone right under home) and AT-9 (one at the root of a repository whose Projects sit deeper);
`CONTEXT.md` and identifiers.md said "in lower case". The fifth fix round: AT-2 in one pass (the deepest listed holder
decides), sources and the host folded `A` to `Z` only (a host with the Kelvin sign has no identity), the six results
listed (AT-3, AT-4, AT-5, AT-9, AT-11, AT-14) in the page and DEC-0089, AT-0's cross-member conditions named apart from
the schema's shape, Compatibility naming the sessions refused after adoption and the per-Project totals that move, the
page renamed `folder-attribution.md` (the word "attribution" also names devices.md's and OpenRouter's), and
`explainFolder` in the conformance row's evidence.

The sixth readings of `c4bdbfd` and `27ab6f2` (the operator's D3/D4 correction landed between them): the seam reading
passed with risks; the unit and product readings failed it. A recorded outer clone took a nested Project's place by
identity (AT-3 decided by common dir first); a declared container inside a Project's folder was attached by AT-3 while
DEC-0089 item 3 said a broad folder is attached only explicitly; the list of results against the operator's words
missed a worktree or clone inside another Project's folder; a record kept the remote URL with any token in it; the Done
counts were stale. The sixth fix round: `recordOrigin` (a record keeps the remote without credentials, `null` when a
secret's shape is left); AT-3 by the nearest place across common dir and identity, the same common dir at equal depth;
a declared container ends a listed folder's reach (AT-3), and AT-2 skips broad holders; a path ending in `/.git` has no
identity; the widened results list and the undeclared worktrees folder written out; the record round trip over every
attached, new and explicit vector; Switchboard's duty to ask Fabric's capability; the code-point bounds counted only
between `max` and `2 * max` units (10,000 sources of 4,096 characters had cost a third of a second).

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
survivor (the leading `/` of an scp path) was closed with an origin vector, then killed.

The third fix round planted 13 (a declared container as broad, a broad folder and a loose folder or root right under
home at AT-5, AT-6 and AT-7 skipping broad folders, AT-8 and AT-9 removed, AT-9 reading common dirs only, work by
identity, containers validated, AT-9 before AT-8, a root guard in the loose test): 10 killed on the first pass; two
were closed with vectors (a worktree of a repository only a home-listing Project keeps; a worktree whose main checkout
lies in a plain Project folder while the repository keeps a deeper Project), then killed; one was equivalent (a root
is broad, so the loose test never sees one) and its guard was removed.

The fourth fix round planted 15 (the tombstone exemption, and it covering the tombstoned folder itself, AT-3 by
place removed, in one pass and without its physical holder, a root right under home whose repository has Projects, the
recorded place, its join below a root top level, a bare root's top level, an explicit broad folder recorded, ASCII
lower-casing, the upper-case drive letter, the owner and AT-8 records, a new root's origin): all 15 killed on the first
pass.

The fifth fix round planted 5 (the host and the sources folded by full Unicode, the quadratic AT-2 restored, the
deepest holder equal to the tombstone, the shallowest holder instead of the deepest): 4 killed on the first pass; the
survivor was closed with a vector ("AT-3: a folder listed below a tombstone gets through it though another Project
lists the tombstone's parent"), then killed. 93 plants in all (30, 18, 12, 13, 15, 5), one equivalent, every other one
killed.

The sixth fix round planted 11 (the record's raw origin, an http user kept, a query kept, an scp password kept, a
secret-shaped leftover kept, identity winning at equal depth, common dir always first, no container cut, the
shallowest cut, AT-2 counting broad holders, AT-3's repository holder ignoring the cut): 7 killed on the first pass;
the 4 survivors were closed with two vectors and two tests, then killed. 104 plants in all.

## Checks

`pnpm run check` at the sixth fix round, each step exiting 0: typecheck; 77 files, 5983 tests, branches 7778 / 7851
with `src/folder-attribution.ts` at 331 / 331 (vectors: 28 origin, 130 attribution, 18 record); UX lint passed; documentation checks passed, lint-md 0 errors; privacy-check 0
findings, run again after the commit.

The first push (`7146c7c`) carried 439 privacy findings: P3, the shape of a home path (`/home/<name>`, `/Users/<name>`) in
the vectors' fictional home, and P2, the e-mail shape of two remote examples with userinfo. No real name or address was
in them, but the rule binds shapes. The gate before the commit had not read the new files (`check_private.py` reads
tracked files only), and the push command tested `grep`'s exit, not the check's. The vectors now use `/u/ana` and
`C:/Profiles/ana` and userinfo `git@`; the check exits 0; the pushes since are gated on the check's own exit code.

## Status report (2026-10-19, the operator's instruction on board thread `bd1c9611`)

The same report was posted on that thread (message `95a49696`).

- **Status:** DEC-0086 to DEC-0088 merged today; DEC-0089 (this row) in PR #124, gate green, its blind readings owed.
- **Worked on:** CT-56 (DEC-0086), CT-55 (DEC-0087), CT-59 (DEC-0088), CT-57 (DEC-0089), CT-58 (brief drafted).
- **Done:** #117 `b89cb94`; #120 `027a01c` and #121 `ceb5985`; #122 `0752e03` and #123 `0704218`. The contract
  publishes no package: consumers pin a commit, so a merge is the release.
- **Left:** this PR, then its board messages (thread `617c8cbe`; D4 then sat with project-observatory-contract, and the
  operator moved it to Fabric later that day); CT-58 by
  2026-10-27 (thread `6e66a023`).
- **Blocked by:** no other project; the fifth reading stopped on the model session limit (resets 14:10 Europe/Warsaw).
- **When it can ship:** this PR when two consecutive readings find nothing that blocks it, targeted 2026-10-22.
- **Next action:** CT-58's design until the readings run again.

## Registers and ids

DEC-0089 and FAC-SEM-121 were reserved by git CAS under the key `ct57-folder-attribution`. The register markers in
this tree (next free DEC-0090, FAC-SEM-122) are floors read from the tree; CT-58 already holds DEC-0090 and
FAC-SEM-122 to FAC-SEM-124 on `origin`. The fifth product reading found the SEM reservation's CAS commit (`78c96d9`,
recorded in `.agent-sync/40-reservations-r-158228f530c9.md`) no longer reachable from `refs/agent-sync/ids/SEM`, whose
chain runs from CT-55's commit to CT-58's: the id was taken and is not reused, but the remote chain does not show the
receipt. Recorded for agent-sync's owner; nothing in this repository depends on it.

## Next task

PR #124: run the blind readings until two consecutive rounds find nothing that blocks it, merge, then post the merge
commit on thread `617c8cbe` for Fabric, Switchboard (SB-141: within a working day of the merge) and Observatory, with
the proposal above for Fabric's session-start capability (D4 as corrected) referring to `folder-attribution.schema.json`
(no request to project-observatory-contract: the capability moved to Fabric), and add DEC-0089 to the contract's row
of the knowledge base roadmap (`fabric-workspace/knowledge/roadmap.md`).
