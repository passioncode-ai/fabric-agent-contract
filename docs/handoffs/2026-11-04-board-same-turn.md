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

- Blind readings until two consecutive rounds are clean, then merge and a release tag.
- After merge: each consumer re-reads its text against SA-1 to SA-6 at its next pin, under CT-217. Read on 2026-11-07,
  Fabric (`db3fbe0f`) already hands SA-2 and SA-3 to every session and keeps SA-6's slot condition (no reply while the
  slot is active, stale, or absent at a later generation); the adapter (`a248613e`, FAA-205, FAA-231, FAA-241) and the
  knowledge base's agents-first page (`7937722a`, items 3 to 5) say the same.

## Decisions

- No semantic rule code and no new schema member: the rule is a participant's behaviour, which no document the
  checker reads carries, so it is prose (SA-1 to SA-6) plus a conformance row checked by the agent's own test.
- A request whose capability's slot is `active`, `stale`, or `absent` at a generation of 1 or more is left to that
  service (SA-6), so a participant's state reply does not move it to `answered` and out of the responder's queue; only
  at `absent` generation 0 does a session answer, once. Round 1 of the readings (2026-11-07) moved SA-6 from "answers
  while `stale` or `absent`" to this, the rule Fabric and the adapter already ship.
- A message is marked read only after its answer is stored (SA-4), so an unanswered message stays unread to its
  Project.

## Checks actually run

- 2026-11-04, the draft head `d760f756`: `pnpm typecheck`, `pnpm docs:check`, `pnpm ux:lint`, `pnpm privacy:check`; no
  exit codes were recorded.
- 2026-11-07, merged with main at `41784daf`: `pnpm run check` 116 of 117 test files passed, one test timed out at
  5000 ms under machine load (CT-204), `pnpm vectors:check` 32 files match; round 1 of the blind readings (unit, seam,
  product) failed on SA-6, Compatibility, SA-5's mandate exception and SA-3's wording, all folded in the next commit.
- No U+2014 in the added lines (`git diff origin/main | grep '^+' | grep -c` on U+2014 prints 0).

## Next task

Round 2 of the blind readings (unit, seam, product) on the head after round 1's fixes; once two consecutive rounds are
clean and `pnpm run check` exits 0, open the pull request, merge it, tag the release, and tell Fabric, the adapter and
the knowledge base on board thread `eefa7959`.
