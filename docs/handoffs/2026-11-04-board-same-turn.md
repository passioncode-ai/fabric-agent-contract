# 2026-11-04: a board message that waits for an answer is answered in the same turn (CT-217, DEC-0152)

## Objective

Put the operator's word of 2026-11-04 (relayed on board thread `11646774`, message `ea99d1dd`) into the contract: a
participant that reads a request, an announcement or a question addressed to its Project answers it in the same turn
with the result or the current state (what is done, where it lies by branch or commit, when it will be ready, what
blocks it); the finished result follows as a second message; a state answer with its nearest date is an answer.

## Done

- [DEC-0152](../DECISIONS.md) (Proposed): the participant rules SA-1 to SA-6 in
  [project communication](../specification/project-comms.md#answering-in-the-same-turn), with an amendment line at the
  top of that page.
- The descriptions of `com.reply` and `com.enroll`: two paragraphs in *Receipts* of
  [project communication](../specification/project-comms.md#receipts), and the `description` of
  `schemas/comms-reply.schema.json` and `schemas/comms-enroll.schema.json`. No schema constraint changes.
- A board client's row in [conformance](../specification/conformance.md#clients-and-readers), checked by the agent's
  own test.
- [DOCMAP](../DOCMAP.md) row; backlog CT-217 marked in progress.

## Open

- Blind readings of the draft (unit, seam, product), then the operator's acceptance of DEC-0152 on merge.
- After merge: Fabric adopts SA-1 to SA-6 in its served `com.enroll` description, its session prompts
  (`fabric_whoami`) and its sweep reminder; the adapter's working-with-fabric skill and kits adopt the board client's
  row; the knowledge base's agents-first page states the rule for the estate. Each at its next pin, under CT-217.

## Decisions

- No semantic rule code and no new schema member: the rule is a participant's behaviour, which no document the
  checker reads carries, so it is prose (SA-1 to SA-6) plus a conformance row checked by the agent's own test.
- A request whose slot has an `active` responder is left to that responder (SA-6), so a participant's state reply does
  not move it to `answered` and out of the responder's queue.
- A message is marked read only after its answer is stored (SA-4), so an unanswered message stays unread to its
  Project.

## Checks actually run

From the worktree on the draft head: `pnpm typecheck`, `pnpm docs:check`, `pnpm ux:lint`, `pnpm privacy:check`, and
the test run named in the pull request or the coordinator's report (exit codes there); no U+2014 in the added lines
(`git diff origin/main | grep` on U+2014 printed nothing).

## Next task

The coordinator runs blind readings of branch `agent/ct217-board-same-turn-20261104` (unit, seam and product tiers)
against CT-217 and DEC-0152, answers any finding on the branch, and opens the pull request once two consecutive rounds
are clean.
