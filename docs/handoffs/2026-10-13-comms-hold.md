# Handoff — DEC-0079: an operator's hold on the Project board (2026-10-13)

## Objective

Fabric's board wave 4 adds operator controls (its decision D9): the operator can hold a thread, a Project or a
(Project, capability) responder slot. Fabric asked the contract for the refusal, the visible state and the matrix of
what a hold refuses; the owner ruled to adopt the draft with refinements.

## Done

- DEC-0079, with one-line pointers on DEC-0022 and DEC-0073.
- Schemas:
  - `held` joins the refusal codes (`comms-common`);
  - `comms-refusal` refuses `held` with `retryable: false`;
  - `comms-status` responders and `comms-directory` capabilities gain an optional boolean `held`. It sits per
    capability, not on the directory entry, because a Project hold refuses only slot work.
- `src/comms-hold.ts`: `holdRefuses(tool, target, holds)`, the matrix. It never throws, reads own members only, and
  compares ids and capability names as written.
- `fixtures/vectors/comms-hold.json`, 114 cases:
  - all 17 tools with no hold, under each scope alone and under all three;
  - repeats;
  - the lax-port cases: a fenced reply into a held thread, case and prefix comparisons, a request to a held Project
    queuing.
  - The vectors were generated from the decision's matrix written as data, not from `src/comms-hold.ts`.
- `test/comms-hold.test.ts`: runs the vectors, checks their coverage and the spec's hold table row for row, and
  feeds malformed input. `test/comms-tools.test.ts`: the shape test and four schema plants.
- project-comms.md: the amendment line, the lifecycle note (and the C4 *held* that is not a hold), *Holds* with its
  table, `com.status`, the directory, *Refusals*.
- Also: conformance.md's board-hold obligation row; CONTEXT *Board hold*; DOCMAP row; SCN-025 alt path; CT-41 and
  CT-42 clauses.
- No `FAC-SEM` code: the matrix is decided on board state that no checked document carries. The registers
  (DECISIONS, conformance, backlog) were edited without a lease, by the owner's arrangement; the owner takes the
  leases at merge.

## Open

- Fabric serves `held` per the matrix and sends it only to readers pinned at or after DEC-0079 (CT-41); until then it
  answers a hold `not_authorized`.
- The adapter's kits retry `held` with backoff and never stop accepted work (CT-42).
- Not decided:
  - the operator control's tool shape;
  - the hold's audit record;
  - the Telegram mirror's text;
  - a member that shows a thread hold;
  - whether a hold survives a restore.

## Checks run

- Gate at the branch head: `tsc --noEmit`, vitest with coverage, UX lint, docs-check, lint-md and privacy, with the
  exact numbers in the pull request.
- Plants, each confirmed to fail a test and then restored, are listed in the pull request.

## Next task

Merge, set the next free markers, tell Fabric's builder the merge commit, and record its adoption on CT-41 when it
lands.
