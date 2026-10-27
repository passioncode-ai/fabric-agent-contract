# 2026-10-26: three decisions for the simple Fabric (CT-174, DEC-0140)

## Objective

Answer Fabric's request `23ba0e97` (thread `6a8d2f9c`, due 2026-11-05 for its 0.3.15) by 2026-10-30 with three
decisions: a reserved default capability for a Project's primary responder; the operator's move of a slot to another
session; an optional session `role` and `branch` with a privacy rule.

## Done

- DEC-0140, Proposed, on branch `agent/ct174-simple-fabric-20261026` (PR #217): project-comms.md PR-1
  (`project.work`), PR-2 (the operator who owns a Project moves an occupied slot in the host's controls, as one
  fenced transition with a stated refusal order; then the board's ordinary rules govern it and the host keeps the
  operator's choice) and PR-3 (a session role is a claim; a reported branch stays in its Project and does not feed an
  activity event's `git.branch` until CT-176 decides).
- AP-1's exception for the move, until a host ships its agent twin (CT-181 the contract half, then CT-125), written
  into AP-1, the Actions lead, both conformance rows, CONTEXT, the spec README, DOCMAP and FLW-29; Compatibility
  names it a relaxation confined to an action this decision creates.
- `PRIMARY_CAPABILITY` in `src/comms-hold.ts` with two tests (the name, and the move's hold-table row); a conformance
  row for the host; `interop.md`'s amendment (the reserved name, a narrowing); SCN-051, SCR-32, FLW-16, JRN-08 stage
  5 and an ST-020 criterion; CONTEXT (Primary responder, Session role, Board hold); README, DOCMAP; DEC-0020,
  DEC-0022, DEC-0079, DEC-0081 and DEC-0121 annotated; backlog CT-125, CT-174, and CT-175, CT-176, CT-179, CT-181,
  CT-182 and CT-183 filed from the readings.
- Readings: rounds 1 to 14 failed and were answered in turn (the move's stickiness, the vocabulary of hold and
  holder, the relayed move and AP-1); round 15 passed on all three tiers at `f91bdcb1`; round 16 passed unit and seam
  at `04da414b`, and its product tier found the double-press case and this stale handoff, both answered here.
- The board: Fabric agreed on 2026-10-27 (`94a41d8c`: the 'oldest live slot is main' fallback dropped, no relayed
  move in 0.3.15, the slot's accepted request ids handed on its session surface); the adapter took the moved-off client part as
  FAA-155 (0.53.0, due 2026-11-12, `27df7ae1`).

## Open

- Readings until two clean rounds in a row on the head.
- Objection window until 2026-10-28 18:00 UTC; then Status to Accepted in the merge commit, release, answer on thread
  `6a8d2f9c`.
- In the same run as the merge: fabric-workspace `knowledge/agents-first.md`'s 'Every button has an agent twin'
  paragraph gains the exception (the operator's move of a board slot, a host control until a host ships its twin,
  DEC-0140, CT-181 then CT-125).
- After release, and only once the adapter enrolls sessions for `project.work` (until then a request naming it waits,
  with `noResponder` while no grant exists, and expires after 7 days unless the target's reply answers it): a line in
  fabric-workspace `knowledge/agents-first.md` (a requester that knows no capability names `project.work`) and the
  adapter's working-with-fabric skill.
- CT-175: the receiving client's part (hear the move, take the handed ids, replace itself with a transfer), which no
  row dates yet; an `outcome_unknown` only the moved-off session could observe. CT-181 then CT-125 for the twin.
- A host or kit that starts recording a session's branch (PR-3) changes its own "no branch" promise in the same
  change. CT-183 holds the round-15 and round-16 wording points for a pass after the merge.

## Checks actually run

The gate from the worktree, exit 0 on each head through round 17's fixes: `pnpm typecheck`; vitest with
coverage outside the worktree (106 files, 9360 tests passed); `pnpm ux:lint` (38 stories, 32 flows, 32 screens, 50
scenarios); `pnpm docs:check` (0 errors over 246 files); `pnpm privacy:check` (0 findings); `pnpm vectors:check` (25
files match); no U+2014 in the added lines.

## Next task

Run the readings on the branch head; merge after 2026-10-28 18:00 UTC with Status Accepted; release; answer Fabric on
thread `6a8d2f9c` and the adapter on the board; close CT-174 and clear the spec README's "owed" text once Fabric and
the kits adopt.
