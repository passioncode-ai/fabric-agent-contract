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
- After merge: each consumer re-reads its text against SA-1 to SA-6 at its next pin, under CT-217. Owed differences,
  named in DEC-0152's Compatibility: Fabric's "on a request too" state reply, its board's `not_authorized` message ("reply with the answer itself")
  and its `com.accept`; the adapter's
  FAA-205 state reply without the slot; agents-first item 4. Read on 2026-11-07,
  Fabric (`db3fbe0f`) already hands SA-2 and SA-3 to every session and keeps SA-6's slot condition (no reply while the
  slot is active, stale, or absent at a later generation); the adapter (`a248613e`, FAA-205, FAA-231, FAA-241) and the
  knowledge base's agents-first page (`7937722a`, items 3 to 5) say the same.

## Decisions

- No semantic rule code and no new schema member: the rule is a participant's behaviour, which no document the
  checker reads carries, so it is prose (SA-1 to SA-6) plus a conformance row checked by the agent's own test.
- SA-6 as it stands after seven rounds of readings: a session reads the request's capability slot in `com.status`
  first and leaves an `active` holder's request alone, asking no one; otherwise it calls `com.enroll`. Taken, it holds;
  `fenced`, as `active`; `not_authorized`, no reply and a question to the operator, and only at `absent` generation 0
  with no hold one decline that says why and what would lift it; any other refusal, no reply and no decline, retried
  when `retryable`, else the operator asked. Fabric and the adapter ship most of this; Compatibility lists what each
  still owes.
- A request is answered only through SA-6 (its holder's progress and completion, or the generation-0 decline); the
  state answer and the second-reply result of SA-2 and SA-3 are for announcements and questions.
- A message is marked read only after its answer is stored (SA-4), so an unanswered message stays unread to its
  Project.

## Checks actually run

- 2026-11-04, the draft head `d760f756`: `pnpm typecheck`, `pnpm docs:check`, `pnpm ux:lint`, `pnpm privacy:check`; no
  exit codes were recorded.
- 2026-11-07, merged with main at `41784daf`: `pnpm run check` 116 of 117 test files passed, one test timed out at
  5000 ms under machine load (CT-204), `pnpm vectors:check` 32 files match; round 1 of the blind readings (unit, seam,
  product) failed on SA-6, Compatibility, SA-5's mandate exception and SA-3's wording, folded in `1a1a1512`.
- Round 2 at `1a1a1512`: product passed, seam and unit failed (generation 0 wider than Fabric ships; the enroll text
  read as a board rule), folded in `0d3e572c`. Round 3 at `0d3e572c`: seam passed, unit and product failed (SA-2, SA-3,
  the `com.reply` text and schema still sent a request a state answer), folded in `bc604e47`. Round 4 at `bc604e47`:
  seam and product failed (Compatibility said the consumers already match; a session that can enroll asked the operator
  about an active holder's request; the Alternatives), folded in `111c8aaf` and `06a62a8e`. Round 5 at `06a62a8e`: all three
  failed (SA-6 branched on refusal codes the contract does not define and dropped `active` from the
  `not_authorized` branch; Compatibility missed Fabric's `not_authorized` message), folded in the next commit: SA-6
  reads the slot in `com.status` after any refusal, folded in `60858a23`. Round 6 at `60858a23`: all three failed
  (a decline after any refusal, Fabric's question at an active slot, `held`), folded in the next commit: SA-6 reads
  the slot first, enrolls only when it is not `active`, and declines only after `not_authorized`. Round 7 at
  `451d72c4`: all three passed; its risks folded in the next commit.
- No U+2014 in the added lines (`git diff origin/main | grep '^+' | grep -c` on U+2014 prints 0).

## Next task

Round 8 of the blind readings (unit, seam, product), the second clean round after round 7; once two consecutive rounds are
clean and `pnpm run check` exits 0, open the pull request, merge it, tag the release, and tell Fabric, the adapter and
the knowledge base on board thread `eefa7959`.
