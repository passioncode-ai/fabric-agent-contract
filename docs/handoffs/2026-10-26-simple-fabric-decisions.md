# 2026-10-26: three decisions for the simple Fabric (CT-174, DEC-0140)

## Objective

Answer Fabric's request `23ba0e97` (thread `6a8d2f9c`, due 2026-11-05 for its 0.3.15) by 2026-10-30 with three
decisions: a reserved default capability for a Project's primary responder; the operator's move of a slot to another
session; an optional session `role` and `branch` with a privacy rule.

## Done

- DEC-0140, Proposed, on branch `agent/ct174-simple-fabric-20261026`: project-comms.md PR-1 (`project.work`), PR-2
  (the operator's move, from the generation seen, then the board's ordinary rules; the host keeps the operator's
  choice and offers the move again) and PR-3 (a session role is a claim;
  a reported branch stays in its Project, activity's `git.branch` under `telemetry.git_branch`).
- `PRIMARY_CAPABILITY` in `src/comms-hold.ts` with a test; a conformance row (the host); `interop.md`'s amendment (the
  reserved name, a narrowing);
  SCN-051, SCR-32, FLW-16 (the move's edges), JRN-08 stage 5 and an ST-020 criterion; CONTEXT (Primary responder,
  Session role, Board hold); README, DOCMAP; DEC-0020, DEC-0022 and DEC-0081 annotated; backlog CT-125 (the move's
  twin), CT-174, and CT-175, CT-176, CT-179 filed from the readings (rounds 1 to 10).
- The shape was posted on thread `6a8d2f9c` (`0b88a552`); round 1 of the readings failed on all three tiers, and the
  rewrite above answers its findings. Rounds 2 and 3 failed on how a move stays put: a host bar (a reconnect gets a
  new session id) and a client rule (released kits replace at the generation `com.status` shows, as the replace
  schema says, and re-enroll a slot whose holder's lease lapsed) both failed, so PR-2 now leaves the slot to the ordinary rules and the
  client improvement is CT-175 (probe on kit v0.51.2 in round 3). The thread's message said a transfer needs the leaving responder's checkpoint:
  wrong (the caller writes it), corrected on the thread with the rewrite.

## Open

- Readings until two clean rounds in a row.
- Objection window until 2026-10-28 18:00 UTC; then Status to Accepted in the merge commit, release, answer on the
  thread.
- After release, and only once the adapter enrolls sessions for `project.work` (until then a request naming it waits
  (with `noResponder` while no grant exists) and expires after 7 days): a line in fabric-workspace `knowledge/agents-first.md` (a requester that knows no capability names
  `project.work`) and the adapter's working-with-fabric skill, which enrolls a coding agent's session for
  `project.work` under the grant the operator gives in Fabric; until a session enrolls, Fabric shows no main session.
- CT-175 (the adapter's kits): whether a client leaves a slot moved off it, and an `outcome_unknown` a move produces
  when only the moved-off session observed the effect, and the receiving client's part. CT-125: the move's agent
  twin.
- A host or kit that starts recording a session's branch (PR-3) changes its own "no branch" promise in the same
  change: Fabric's `fabric_session_observe` description and the adapter's working-with-fabric `session-hooks.md`.
- Fabric's design marks the oldest live slot's holder as main until a session occupies `project.work`; PR-1 shows none, so the
  fallback goes when Fabric adopts (raised on thread `6a8d2f9c`).

## Checks actually run

On each head, the gate from the worktree, exit 0 at each head through round 10: `pnpm typecheck`; vitest with coverage written to the
session scratchpad (106 files, 9360 tests passed); `pnpm ux:lint` (38 stories, 32 flows, 32 screens, 50 scenarios);
`pnpm docs:check` (0 errors over 246 files); `pnpm privacy:check` (0 findings); `pnpm vectors:check` (25 files match);
no U+2014 in the added lines.

## Next task

Run the readings on the branch head; merge after 2026-10-28 18:00 UTC with Status Accepted; release; answer Fabric on
thread `6a8d2f9c` and the adapter on the board; close CT-174 and clear the spec README's "owed" text once Fabric and
the kits adopt.
