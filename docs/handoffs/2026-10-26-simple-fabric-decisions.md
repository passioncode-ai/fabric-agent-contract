# 2026-10-26: three decisions for the simple Fabric (CT-174, DEC-0140)

## Objective

Answer Fabric's request `23ba0e97` (thread `6a8d2f9c`, due 2026-11-05 for its 0.3.15) by 2026-10-30 with three
decisions: a reserved default capability for a Project's primary responder; the operator's move of a slot to another
session; an optional session `role` and `branch` with a privacy rule.

## Done

- DEC-0140, Proposed, on branch `agent/ct174-simple-fabric-20261026`: project-comms.md PR-1 (`project.work`), PR-2
  (the operator's move, from the generation seen, the moved-off session refused) and PR-3 (a session role is a claim;
  a reported branch stays in its Project, activity's `git.branch` under `telemetry.git_branch`).
- `PRIMARY_CAPABILITY` in `src/comms-hold.ts` with a test; two conformance rows (the host, the adapter's kits);
  SCN-051; CONTEXT (Primary responder, Session role); README, DOCMAP, backlog CT-174.
- The shape was posted on thread `6a8d2f9c` (`0b88a552`); round 1 of the readings failed on all three tiers, and the
  rewrite above answers its findings. The thread's message said a transfer needs the leaving responder's checkpoint:
  wrong (the caller writes it), corrected on the thread with the rewrite.

## Open

- Readings until two clean rounds in a row.
- Objection window until 2026-10-28 18:00 UTC; then Status to Accepted in the merge commit, release, answer on the
  thread.
- After release: a line in fabric-workspace `knowledge/agents-first.md` (a requester that knows no capability names
  `project.work`) and the adapter's working-with-fabric skill, which enrolls a coding agent's session for
  `project.work` under the grant the operator gives in Fabric; until a session enrolls, Fabric shows no main session.
- The adapter's kits: recover by replacement only at the generation the checkpoint held (conformance row), before
  Fabric ships the move in 0.3.15.
- Not settled here: an `outcome_unknown` a move produces waits for the new holder's observation (the owner may settle
  it only once no responder holds the slot); a CT row if Fabric asks for more.

## Checks actually run

`pnpm typecheck`, vitest with coverage written to the session scratchpad, `pnpm ux:lint`, `pnpm docs:check`,
`pnpm privacy:check`, `pnpm vectors:check`, no U+2014 in the added lines.

## Next task

Run the readings on the branch head; merge after 2026-10-28 18:00 UTC with Status Accepted; release; answer Fabric on
thread `6a8d2f9c` and the adapter on the board; close CT-174 and clear the spec README's "owed" text once Fabric and
the kits adopt.
