# 2026-11-08: on-demand sessions (CT-215, DEC-0158)

## Objective

Give the contract's part of on-demand sessions: a board request no responder takes is answered by a session the host
starts for it, which takes the request, does it, reports, settles it and ends (the operator's word of 2026-11-04,
relayed by the Fabric project on thread `b2e5df1f`, announcement `42a41db8`). Backlog CT-215 lists what is owed: (a) the
package the run is handed, (b) its lifecycle and a dead run's request, (c) how it fits CT-175 and CT-205.

## Done

- DEC-0158 (Proposed) in `docs/DECISIONS.md`, reserved with `agent_sync.py reserve DEC` (origin counter next 159);
  `Next free ID` set to `DEC-0159`.
- `docs/specification/project-comms.md`: the amendment line and the section *On-demand sessions*, OS-1 to OS-7.
- DEC-0022 annotated: C5 amended for the host alone.
- `docs/specification/conformance.md`: rows for the host that starts runs and for the dispatched run.
- `CONTEXT.md`: *On-demand session*.
- `docs/ux/scenarios.md`: SCN-025's alt paths (a started run that completes, a hold, a run that dies, a human step),
  States and Coverage; SCN-051's alt path (a run as the main session). `docs/ux/screens.md`: SCR-19's `failed_known`.
- `docs/DOCMAP.md`: a row.
- Backlog CT-215 in progress.
- Round 3: `docs/specification/delegation.md` MD-2 names how a board request's chain is handed on (the target's
  registry agent id, the run appending only onward callees); `tools/vectors/mandate.ts` gains a covered call at the
  run's onward callee and a hand-on by the run, `fixtures/vectors/mandate.json` rewritten by `--write`;
  `docs/ux/flows.md` FLW-16 gains `failed_known` (an edge and SCR-19's state); `docs/ux/screens.md` SCR-32 gains the
  on-demand run as main session; backlog CT-175's requester side names a dead dispatched run.
- The merge of `origin/main` (50 commits) at `44feaab7`; `Next free ID` set to `DEC-0160` (the CAS counter's next 160).
- Round 4: OS-5 shows at once a request a run settled at a human step it could not put to its operator, and says what
  follows a grant after `not_authorized`; `noResponder`'s paragraph names a host that dispatches; OS-3's mismatch is a
  `com.submit` of kind `message` with no `replyTo`; OS-6 names the operator as the default resubmitter (CT-150 for the
  requester's wake); OS-7 and MD-2 cover a target with no registry agent id and the caller id a run's onward calls
  present (MD-3); DEC-0152 annotated; DEC-0158 items 2, 3, 5, 6 and 7, Compatibility (Fabric's specification lines and
  the CO-409 count question) and Consequences restated; the conformance rows (the board client points a run to its own
  row); `CONTEXT.md` lists OS-5's cases; SCN-025 gains the switch, the request shown to the operator and the grant's
  path, SCN-025 and SCN-051 the Settle wait for a run; SCR-19 gains "shown to you", SCR-32 the on-demand switch, FLW-16
  both; two mandate vectors (a hand-on of the target again, refused `mandate-malformed`; a call whose chain carries the
  run's runner kind, refused `mandate-not-for-this-call`), both what `src/mandate.ts` answers (`pnpm vitest run
  test/mandate.test.ts`, 83 tests).
- Round 5: the dispatched run's conformance row names OS-6's stops in OS-6's order and the two that a mandate or a
  relayed decision may answer; SCR-19's and SCN-025's actions for a request shown to the operator go by its effect
  state (cancel and only then submit again while the effect is `not_started`; never submit again once it is `started`)
  and name who acts (the requester's `com.cancel` and `com.submit`); the switch's semantics (on by default, a working
  run not stopped by it, starts at once where the grace has passed) in OS-1, DEC-0158 item 1, the host's row, SCR-32 and
  SCN-025; settling while runs keep taking the slot (hold it, settle, lift) in SCR-19, SCN-025 and SCN-051; OS-6's thread
  note names the resubmitter; the section's opening sentence says a run serves a request only; OS-5 ends the starts on
  any non-retryable refusal of a run's enrollment; `noResponder`'s sentence limited to a host that can grant the run the
  slot; OS-2 hands the target's registry agent id when the host has it, and OS-7 and MD-2 take the mandate only when
  its last entry is that id; one more mandate vector (a chain ending in the requester, refused
  `mandate-not-for-this-call`, what `src/mandate.ts` answers, 84 tests); `comms-enroll.schema.json`'s description (a
  dispatched run ends instead of retrying; description only); DOCMAP's count of the board-request vectors; CONTEXT's
  counting; the adapter's effect-key debt named as new, not FAA-215's; backlog CT-215 and the handoffs index.
- Round 6: OS-6 settles first and then writes the thread note (a participant's reply) and the operator's question by
  the outcome (after `failed_known`, the operator submits it again; after a request left `in_progress`, nobody does and
  it reaches the owner as `outcome_unknown`), in DEC-0158 item 6, SCN-025's human step and the dispatched run's
  conformance row; SCR-19, SCN-025, OS-5, DEC-0158 item 5 and CT-175 name one actor for a shown request (the operator
  through a session of the requesting Project they own, otherwise the requester on its own reading of the state, the
  estate's rule, `agents-first.md` *When nobody answers* item 1), and "the host asks the requester on the thread" is
  gone; "no time left" is limited to an `accepted` or `in_progress` request with no live holder in SCN-025, SCR-19 and
  CONTEXT, a `queued` or `claimed` one with too short a deadline expiring; SCR-19 and SCN-025 tell a timed-out run
  from one that ended empty and offer a session of the target Project after a timed-out one; `noResponder`'s paragraph
  says a requester cannot observe whether a host can grant a run the slot and cites the receipts' `com.enroll` bullet;
  OS-4 allows one immediate retry of a settling call refused `retryable` (not `held`), with the same idempotency key (item 4, the
  run's row); OS-7 and item 7 name the onward caller id as the target's registry agent id; one more mandate vector (a
  chain ending in the target, the run taking it with no authenticated caller id, what `src/mandate.ts` answers, 85
  tests); DEC-0152 annotated with the wait of a question or an announcement to a Project only runs serve, filed as
  CT-272; Compatibility gains the adapter's requester rule and mandate guidance, Switchboard's scrub limited to sessions
  launched through it, and Fabric's delegation token's outermost actor; `comms-enroll.schema.json`'s description
  reworded (description only); DOCMAP's and Consequences' vector counts.
- Round 7: SA-6's closing sentence keeps OS-4's one immediate retry of a settling call (a refused enrollment is not
  retried, nothing else is); OS-1, DEC-0158 item 1, SCR-32 and SCN-025 say a hold stops a working run only before its
  effect begins (a hold refuses `com.accept` and `com.effect_begin`, never `com.complete`, `com.reconcile`,
  `com.progress` or `com.renew`) and a move fences it at its next board call, its `in_progress` request turning
  `outcome_unknown`; OS-6's note for a request left `in_progress` reaches the owner "once a session of the target
  Project takes the slot", and SCR-19 and SCN-025 offer "Open a session of the target Project" for every shown
  `in_progress` request with no live holder; OS-6's note names the operator as resubmitter only when the operator owns
  the requesting Project (a Project the run's own `com.directory` lists), otherwise the requester (item 6, SCN-025,
  SCR-19, the run's row); SCR-19's Elements list a shown request with its cause and actions. Risks folded: OS-5 counts
  a run refused `retryable` for another cause (item 5, the host's row, CONTEXT); OS-6's human step points to AP-4's
  full list; SCN-025's wait of a question or an announcement (CT-272); OS-1's grace stated among the host's settings;
  the host shows an opened session of the target Project the earlier runs' effect key (OS-5, SCR-19, SCN-025); the
  host withholds the move of a slot to a run (OS-7, SCR-32, SCN-051, item 7); JRN-08 stage 6 and an ST-020 criterion
  (FLW-16 and SCN-025 trace it); Compatibility gains the adapter's `DISPATCH_CONTRACT` lines and its vector-count tests,
  Fabric's new debts, the `hand_on` read as the service case, and the knowledge base's items 3 and 8 as drafted below;
  backlog CT-276 (the operator's limits on where a run starts) and CT-277 (how a requester learns a target Project's
  registry agent id).
- Round 8: one counting rule for OS-5's two runs in OS-5, the host's conformance row, CONTEXT, DEC-0158 item 5 and
  its Compatibility (a run counts for nothing only when it found a live holder, its enrollment was refused `held` or
  `fenced`, a hold refused its work or the operator's move fenced it; every other unsettled run counts, one that ended
  before `com.enroll` included), so Fabric's counting of every unsettled end is met; the drafted knowledge base item 3
  cancels a still-`queued` request first and acts only on `cancelled`, reads `answered` as a decline, sends a request a
  run holds to item 1 and held work to item 4; item 5's requester branch; item 8's production step. OS-1 defines *at
  once* as the host's next pass, the grace as the earliest a run starts, a move's fence at the next fenced call and the
  run no move can stop; OS-4 ends a run on any other refusal of its work; OS-6 names the estate's production stop;
  the run's conformance row gains OS-3's quotation and OS-6's job cancel; SCR-32 and SCN-025 follow; Switchboard's
  refused-enrollment debt and Fabric's state for *at once* in Compatibility.

## Decisions taken here

- The request's states are not extended: a dead run's request keeps the state the extension gives it, and the next run
  or the owner settles it through existing operations (DEC-0158 Alternatives (a)).
- A run never waits at a human step, another job's `input_required`, or a source hand-over without an exact decision:
  it settles `failed_known` (`observed: false` before an effect began; after one, only once it observed no effect) or
  leaves the request `in_progress` for the next holder, then names the step in the thread by that outcome (OS-6).
- A board request's mandate chain ends in the target's registry agent id; the run acts as that entry and appends only
  its onward callees, so no Project id or runner kind enters a chain (OS-7, MD-2).
- A begun effect's idempotency key is kept in the host's record of the run and carried to the next run, which observes
  the effect before an observed reconcile, or reuses the key after its own `com.effect_begin` on a transferred request
  (CT-215's open point under (b)); exactly-once is not claimed.
- How the host decides (grace, caps, time limit, agent and account) stays the host's; the contract binds what the run is
  handed, what done means and what a dead run leaves.

## Open

- The coordinator's blind readings (unit, seam, product) until two consecutive clean rounds.
- Consumer debts, named in DEC-0158's Compatibility: Fabric's CO-409 items (held work no candidate, the counting, the
  packet's OS-4 and OS-6 text beside the production stop, its mandate text appending each callee and never the run, the
  key carried by the take-back, the 60-second skew); Switchboard's `EXIT_CONTRACT`; the adapter's FAA-201 (the three
  variables removed from what a run launches, no elicitation capability, OS-6's settlement, `failed_known` after an
  effect only once no effect is observed, at `references/on-demand-session.md:147` and `:191`; recording a begun
  effect's key in the host's record of the run, a debt new with DEC-0158 and not FAA-215's, which covers closing the
  workflow, `observed: true` and the open checkpoint's reason; taking a board request's mandate only when its last
  entry is the target's registry agent id); Observatory's kept
  reference form for an effect's key (its checkpoint redaction would destroy the key today). From round 6: the
  adapter's requester rule (`references/project-board.md:123-136`, `SKILL.md:128-131`, a small change made by the
  requester itself) restated beside the knowledge base's item 3, and its mandate guidance (`SKILL.md:250-254`) handing
  a board request's mandate on only to the target's registry agent id; Switchboard's scrub covers sessions launched
  through it, a shell-launched one being the adapter's; Fabric's delegation token for a run's onward call, once its hub
  forwards one, carries the target's registry agent id as its outermost actor or is not sent.
- The adapter's vector-count literals move at its next pin, with `mandate-vectors.json` re-vendored:
  `test/fabric-mandate.test.mjs:26` and `test/test_fabric_mandate.py:35` assert 40 cases, and
  `test/fabric-mandate.test.mjs:40` and `test/test_fabric_mandate.py:51` assert 30 hand-overs at its main `2c0b1b18`;
  this branch's `fixtures/vectors/mandate.json` holds 44 and 32. Its `scripts/fabric_session_cli.py`
  `DISPATCH_CONTRACT` (`:159`, `:165`) completes `failed_known` with `observed: true` after an effect began, the same
  debt as `references/on-demand-session.md:147` and `:191`.
- Fabric's CO-409 answer on whether its home count of requests no agent answers excludes a request a run holds: name
  the answer in SCN-025 (its Coverage) when Fabric gives it.
- CT-276 (the operator's limits on where a run starts) and CT-277 (how a requester learns a target Project's registry
  agent id) are open; neither blocks the merge.
- Fabric's specification at its main `eafcf2e4` also tells the run to append itself
  (`docs/evidence/specs/2026-11-04-on-demand-sessions.md:139-140` and `:148-149`): part of Fabric's OS-7 debt, with its
  packet text. Fabric's CO-409 also answers whether its home count of requests no agent answers excludes a request a
  run is about to take or is working, and owes showing at once a request a run settled at a human step it could not put
  to its operator.
- A merge condition, landed with the merge and not after: fabric-workspace `knowledge/agents-first.md`, "When nobody
  answers" items 3 and 5 restated (a requester leaves a request to a host that dispatches; a session the host starts
  is built) and "One approval binds all" item 8's production stop kept with OS-6's settlement beside it. Its check:
  the knowledge base's own gate on that change, then a reading of the merged items against OS-1, OS-5 and OS-6. The
  contract's merge and that change land together. The draft below is the text to land.
- The landing board post of the consumer debts names, for each consumer (Fabric, Fabric Switchboard, the adapter,
  Project Observatory, the third host), its debts and a date: 2026-11-22 (two weeks after landing) unless the consumer's
  reply carries a `row` reaction with its own `due` (DEC-0098), which then replaces it. Until each date, a consumer
  still at the old reading is the mixed state the post names.

## Draft of the knowledge base change (a merge condition)

The text to land in fabric-workspace `knowledge/agents-first.md` with this decision's merge (read at its main
`c84c7a40`). Items not named keep their text.

"When nobody answers", item 3, its first sentence restated and one paragraph added after it (the rest of the item
unchanged but its last paragraph's cancel, below):

> 3\. **Nobody is live, the machine is the operator's, and the change is small: make it yourself, in the owner's
> repository; where the host dispatches, cancel the request first.** Where the machine's host starts on-demand
> sessions (Fabric's dispatcher, on by default; contract DEC-0158 OS-1), a run may take a request no responder holds
> at any time: the host's grace is the earliest a run starts, never a promise that none starts later, and its caps
> and limits may defer a start. So, whatever the receipt's `noResponder` says, read the request (`com.get`) before you
> change anything:
>
> - `queued`: cancel it (`com.cancel`, the reason "done by the asker") and start the change only once the receipt
>   reads `cancelled`; then no run can take it. A receipt that reads anything else, or a refusal, means a run took
>   it meanwhile: read it again and go by the lines below.
> - `answered`: the target declined it (a run's decline, OS-5), and no run will take it; go on with this item, or
>   submit it again once what the decline names is done.
> - `claimed`, `accepted` or `in_progress`: a run has it. Leave it and put the wait on a watcher (item 2); if the date
>   its state note named passes with no result, follow item 1, whose cancel while the effect is `not_started` serves a
>   `claimed` request too.
> - `outcome_unknown`: the work began; follow item 1.
>
> The slot, the Project or the thread being held is never a reason to make the change: held work waits for the lift,
> as item 4 says (`held: true` on the target's slot in `com.directory` or `com.status`).

and in the item's last paragraph, "and cancel your own request (`com.cancel`, the reason "done by the asker")" reads
"and cancel your own request (`com.cancel`, the reason "done by the asker") unless you already cancelled it as above".

"When nobody answers", item 5, restated:

> 5\. **Waking the owner.** A host that dispatches starts a session in the target Project for a request no responder
> takes, after its grace, with that request as its only task; the session takes it by its state, settles it and
> ends (contract DEC-0158 OS-1 to OS-7; Fabric's dispatcher since 0.3.16). A request the host starts no more runs
> for is shown to the operator with its cause (OS-5), and the operator acts through a session of the requesting
> Project they own; otherwise the requester acts on its own reading of the request's state (item 1 and item 3's
> lines). A question or an announcement waits for the Project's next session (OS-7, contract CT-272).
> Fabric's home ("requests no agent answers now") and the thread remain how the owner's next session, or the
> operator, finds a request no run holds; the asker does not wait on either.

"One approval binds all", item 8, two additions (its production stop kept):

> A session started for a request settles it before it stops at a step that needs a person, this item's production
> step included: `failed_known` with
> `observed: false` before an effect began; after one, `failed_known` only once it observed that no effect happened,
> and otherwise it leaves the request `in_progress` for the next holder; then it names the stop once in the thread
> (contract DEC-0158 OS-6).

and its close rule's parenthesis, aligned with OS-5's terminal states:

> The same close rule (close the workflow only once the request has left the run: `answered`, terminal or
> `outcome_unknown`; of these only a terminal state settles the request, as the contract's OS-5 counts runs) ...

Its check: the knowledge base's own gate on the change, then a reading of the merged items against OS-1, OS-5 and OS-6.

## Checks run

- On the tree of the round-3 commit (parent `44feaab7`): `pnpm run docs:check` exit 0 ("Documentation checks passed",
  lint:md 271 files, 0 errors); `python3 docs/ux/lint.py` exit 0 (40 stories, 34 flows, 34 screens, 56 scenarios);
  `pnpm run privacy:check` exit 0; `pnpm vectors:check` exit 0 (32 vector files match their generators);
  `pnpm vitest run test/mandate.test.ts` exit 0 (81 tests); `git diff origin/main...HEAD | grep '^+' | grep -c` of
  U+2014 printed 0. The full `pnpm run check` was not run in this round.

- On `7bd5253d`: `pnpm run docs:check` exit 0 ("Documentation checks passed", lint:md 270 files, 0 errors);
  `python3 docs/ux/lint.py` exit 0 (40 stories, 34 flows, 34 screens, 56 scenarios); no U+2014 in the added lines
  (reproduced by round 1's readers).

## Checks run on the round-4 commit

- On the tree of the round-4 commit (parent `33f611d9`): `pnpm run docs:check` exit 0 (lint:md 271 files, 0 errors);
  `python3 docs/ux/lint.py` exit 0 (40 stories, 34 flows, 34 screens, 56 scenarios); `pnpm run privacy:check` exit 0
  (0 findings); `pnpm vectors:check` exit 0 (32 vector files match their generators); `pnpm vitest run
  test/mandate.test.ts test/comms-tools.test.ts test/consistency.test.ts` exit 0 (3 files, 229 tests);
  `git diff origin/main...HEAD | grep '^+' | grep -c` of U+2014 printed 0. The full `pnpm run check` was not run in
  this round.

## Checks run on the round-5 commit

- On the tree of the round-5 commit (parent `bf1acbde`): `pnpm run docs:check` exit 0 ("Documentation checks passed",
  lint:md 271 files, 0 errors); `python3 docs/ux/lint.py` exit 0 (40 stories, 34 flows, 34 screens, 56 scenarios);
  `pnpm run privacy:check` exit 0 (0 findings); `pnpm vectors:check` exit 0 (32 vector files match their generators);
  `pnpm vitest run test/mandate.test.ts test/comms-tools.test.ts test/comms-hold.test.ts test/consistency.test.ts`
  exit 0 (4 files, 354 tests; `test/mandate.test.ts` alone 84); `git diff origin/main...HEAD | grep '^+' | grep -c` of
  U+2014 printed 0. The full `pnpm run check` was not run in this round.

## Checks run on the round-6 commit

- On the tree of the round-6 commit (parent `a2d386d5`): `pnpm run docs:check` exit 0 ("Documentation checks passed",
  lint:md 271 files, 0 errors); `python3 docs/ux/lint.py` exit 0 (40 stories, 34 flows, 34 screens, 56 scenarios);
  `pnpm run privacy:check` exit 0 (0 findings); `pnpm vectors:check` exit 0 (32 vector files match their generators);
  `pnpm vitest run test/mandate.test.ts test/comms-tools.test.ts test/comms-hold.test.ts test/consistency.test.ts`
  exit 0 (4 files, 355 tests; `test/mandate.test.ts` alone 85); `pnpm typecheck` exit 0;
  `git diff origin/main...HEAD | grep '^+' | grep -c` of U+2014 printed 0. The full `pnpm run check` was not run in
  this round.

## Checks run on the round-7 commit

- On the tree of the round-7 commit (parent `eabacf59`): `pnpm run docs:check` exit 0 ("Documentation checks passed",
  lint:md 271 files, 0 errors); `python3 docs/ux/lint.py` exit 0 (40 stories, 34 flows, 34 screens, 56 scenarios);
  `pnpm run privacy:check` exit 0 (0 findings); `pnpm vectors:check` exit 0 (32 vector files match their generators);
  `pnpm vitest run test/mandate.test.ts test/comms-tools.test.ts test/comms-hold.test.ts test/consistency.test.ts`
  exit 0 (4 files, 355 tests); `git diff origin/main...HEAD | grep '^+' | grep -c` of U+2014 printed 0. The full
  `pnpm run check` was not run in this round.

## Checks run on the round-8 commit

- On the tree of the round-8 commit (parent `f0457843`): `pnpm run docs:check` exit 0 ("Documentation checks passed",
  lint:md 271 files, 0 errors); `python3 docs/ux/lint.py` exit 0 (40 stories, 34 flows, 34 screens, 56 scenarios);
  `pnpm run privacy:check` exit 0 (0 findings); `pnpm vectors:check` exit 0 (32 vector files match their generators);
  `pnpm vitest run test/mandate.test.ts test/consistency.test.ts test/comms-tools.test.ts` exit 0 (3 files, 231
  tests); `git diff origin/main...HEAD | grep '^+' | grep -c` of U+2014 printed 0; `git merge-tree --write-tree HEAD
  origin/main` exit 0. The full `pnpm run check` was not run in this round.

## Rounds

- Round 1 (on `7bd5253d`), not clean on any tier: unit, OS-4 gave every run claim, accept and complete, which an
  `accepted` request (continued only by a transfer) and an `in_progress` one (made `outcome_unknown` by the run's own
  enrollment, settled only by an observed reconcile) cannot take (now OS-4 goes by the state found); seam, OS-6 and
  Alternative (d) contradicted C3.3, which reads a cancel of an ordinary input request as the person's no (now a run
  declares no elicitation capability), nothing carried OS-5's effect key from run to run (now the checkpoint's body,
  carried by the host's take-back, owed by Fabric and the adapter), and five Fabric debts were already built (now
  restated from its CO-409 row); product, the operator's hold ended a request's runs before its lift (now held work is
  no candidate and a run that never held the slot counts for nothing), the C3.3 contradiction, and the handoff's checks
  "in the commit" (now written here). Risks folded: the exit contract is OS-4's; an `outcome_unknown` a run leaves is
  shown at once; OS-3's mismatch covers one or both ids missing and is a `message` in the line's request's thread; the
  claim names the request; the state note at a claim or transfer; settled means terminal; the human step's resubmission;
  the mandate taken as callee and handed on by MD-2; the grace named as the host's; SCN-025's accept, release,
  generation and `failed_known`; SCN-051's run as main session; OS-6 links AP-4, not the unmerged OW section; the
  conformance rows' rule ranges and test files; a DOCMAP row; Consequences complete, the knowledge page at landing.

- Round 2 (on `57588aaf`), not clean: unit, SCN-051 counted a moved-off run for nothing while OS-5 counted it (now OS-5
  exempts a run the operator's move fenced, or whose work a hold refused) and OS-6 settled `failed_known` after an
  effect began without an observation (now `observed: false` only before an effect, after one only once no effect is
  observed, else the request stays `in_progress` for the next holder); seam, the SCN-051 point, and Fabric's packet and
  Switchboard's exit text did not carry OS-4 (now owed); product, the SCN-051 point and SA-6's closing sentence (now
  points to OS-4). Risks folded: a `not_authorized` refusal ends the starts; OS-2 hands OS-3's line and environment and
  the earlier run's record; a run strips the variables from what it launches; the transfer's checkpoint is the run's
  own, the host's record is not the board's; reuse only after the run's own effect begin; settled counts runs only;
  the elicitation lever is the launcher's or host's; an `operator-decision-required` outside the mandate is named and
  settled; the chain ends in the target Project and the run appends itself once; the requester sees only the state;
  a third implementing host named; the knowledge page's sections named; CONTEXT tells the stdio scope apart; SCR-19's `failed_known`.

- Round 3 (on `ad910afa`), not clean: seam, OS-7's chain ended in the target Project (a `projectId`, not an
  `agentId`) and the run appended itself, while a requester's `hand_on` already ends it in the target's registry agent
  id (now the run acts as that entry and appends only onward callees, MD-2 says so, two vectors); Compatibility called
  Fabric's packet text "append yourself" OS-7's rule (now a Fabric debt), listed Fabric's at-once display of
  `outcome_unknown` as owed though `09ddb2fc` built it (now met), said Observatory keeps a checkpoint body as written
  though it redacts key-like strings (now its debt: a kept `effect-key:` form), and missed the adapter's `failed_known`
  with `observed: true` after an effect (now its debt and Switchboard's); product, SCN-025's human step settled
  `failed_known` unconditionally (now by effect state) and SCR-19's `failed_known` was only an on-demand state (now
  general, FLW-16 too). Risks folded: OS-6's exception limited to a job's question and the outside-mandate refusal; the
  human step's `humanStep`, `url` and the operator asked; the production stop kept beside OS-6; OS-5 shows at once a
  request with no time left and every request a run's enrollment made `outcome_unknown`; the key recorded before acting
  outward, reused on `accepted`; a refused enrollment not retried; the hold parenthetical; the conformance row's host
  record; the adapter's variable removal owed; a run answers only its own request; the owner settles once the run ends;
  CT-175's dead run; SCR-32's state; SA-6's closing sentence in Consequences; the knowledge base's landing step with its
  check; CONTEXT's counting; DOCMAP's rows.

- Round 4 (on `33f611d9`), not clean: unit, OS-6 left a run with no question surface to OS-5, whose list had no such
  case (now OS-5, DEC-0158 item 5 and the host's row show at once a request a run settled at a human step it could not
  put to its operator, by the run's record); product, OS-1's switch and OS-5's showing had no UX home (now SCN-025's
  UI elements and States, SCR-19's "shown to you" with each cause's action, SCR-32's on-demand switch, FLW-16). Risks
  folded: the grant after `not_authorized` (OS-5, SCN-025); `noResponder` and a dispatching host, and the knowledge
  base change a merge condition; DEC-0152 annotated; CONTEXT's list; DEC-0158 item 2's handed references; the
  operator as default resubmitter and CT-150; CO-409's count question; SCN-051's and SCN-025's Settle wait; OS-3's
  `message` with no `replyTo`; a target with no registry agent id and the onward caller id (OS-7, MD-2); Fabric's
  specification lines; two vectors, both what the code answers; the board client's row; the debts' dates;
  Consequences lists every file.

- Round 5 (on `bf1acbde`), not clean: unit, the dispatched run's conformance row listed the human step first and then
  let "the first two" be answered by a mandate, against OS-6 (now OS-6's order, the two named); product, SCR-19's
  "cancel it or submit it again" could begin an effect twice, since a resubmitted request's run gets no earlier effect
  key (now split by effect state, SCN-025's no-time-left path in the same words); seam, DOCMAP counted two
  board-request vectors where there were four (now five, with the new one). Risks folded: the actor of each action; the
  human step's resubmitter in OS-6's thread note and SCN-025; settling while runs take the slot; the switch's
  semantics; the section's purpose sentence; CONTEXT's counting; OS-5's starts ended by any non-retryable refusal;
  `noResponder` limited to a host that can grant the run the slot; the vector comment narrowed to an authenticated
  caller; OS-7 and MD-2 take the mandate only when its last entry is the target's registry agent id as the run knows it,
  OS-2 handing that id, one more vector; the enroll schema's description; the adapter's key debt not FAA-215's; Fabric
  meets the held path from its next pin (CO-409, SCN-025).

- Round 6 (on `a2d386d5`), not clean: product, OS-6 wrote the thread note and the operator's question ("the operator
  submits it again once the step is taken") before it settled, so they asked for a resubmission even when the run then
  left the request `in_progress`, which is not submitted again (now the run settles first and writes both by the
  outcome, item 6, SCN-025 and the run's row); SCR-19 and SCN-025 offered "the host asks the requester on the thread"
  while OS-5 and CT-175 have the host show the request only to its operator (now one actor everywhere: the operator
  through a session of the requesting Project they own, otherwise the requester on its own reading of the state); "no
  time left" listed `queued` and `claimed`, which OS-5, the host's row and CONTEXT never show for it (now `accepted`
  and `in_progress` only, a `queued` or `claimed` request with too short a deadline expiring). Risks folded:
  `noResponder`'s requester sentence (what a requester cannot observe; the receipts' `com.enroll` bullet); the wait of
  a question or an announcement to a Project only runs serve (DEC-0152's annotation, CT-272); SCR-19's timed-out run
  and the session of the target Project; the enroll schema's description; OS-4's one immediate retry of a settling
  call; one positive mandate vector; OS-7's onward caller id; the adapter's requester rule and mandate guidance,
  Switchboard's scrub scope and Fabric's delegation token in Compatibility; the adapter's count literals at its next
  pin.

- Round 7 (on `eabacf59`), not clean: unit (and a seam risk), SA-6's closing sentence said a run never retries a
  refusal, against OS-4's one immediate retry of a settling call (now SA-6 says a refused enrollment is not retried and
  nothing else is but that one retry); product, the switch's text said holding a run's slot stops it, though a hold
  refuses only `com.accept` and `com.effect_begin` (now a hold stops a run only before its effect begins, and a move
  fences it at its next board call, its `in_progress` request turning `outcome_unknown`, in OS-1, item 1, SCR-32 and
  SCN-025); OS-6's note "it reaches the owner as `outcome_unknown`" held only once a session takes the slot (now said
  so, and SCR-19 and SCN-025 offer "Open a session of the target Project" for every shown `in_progress` request with no
  live holder); OS-6's note always named the operator as resubmitter, who acts only through a session of the requesting
  Project they own (now only then, otherwise the requester); SCR-19's Elements said "otherwise none" while its States
  offered actions (now its Elements list a shown request's actions). Risks folded: a run refused `retryable` for
  another cause counts toward OS-5's two; OS-6's human step points to AP-4's full list; SCN-025's question or
  announcement waits (CT-272); the CO-409 count kept as named, its answer to be named in SCN-025; CT-276 for the
  operator's limits; JRN-08 stage 6 and an ST-020 criterion; the host shows an opened session the earlier runs' effect
  key; the host withholds the move to a run; the knowledge base's items 3, 5 and 8 drafted here; the adapter's
  `DISPATCH_CONTRACT` and vector-count tests; CT-277 for a target Project's registry agent id, `hand_on` read as the
  service case.

- Round 8 (on `f0457843`), not clean: unit and seam, which runs count toward OS-5's two was stated three ways: the
  host's conformance row said "two runs that held the slot" and then counted a run whose enrollment was refused
  `retryable`, which never held it, and the row, CONTEXT, DEC-0158 item 5 and the Compatibility's Fabric debt said,
  unqualified, that a run that never held the slot counts for nothing, which would leave uncounted a run that died
  before `com.enroll`, a run Fabric counts on purpose (now one rule everywhere: a run counts for nothing only when it
  found the slot `active` with another live holder, its enrollment was refused `held` or `fenced`, a hold refused its
  work or the operator's move fenced it, and every other run that ends without settling counts, one that ended before
  `com.enroll` included; Fabric's counting at `eafcf2e4` is then met and its debt is only not counting those four);
  product, the drafted knowledge base item 3 let a requester change the owner's repository while a later run took the
  same still-`queued` request, since a host defers starts past its grace for its own caps, and read a hold as a reason
  to make the change (now, where the host dispatches, the requester cancels a still-`queued` request first and starts
  only once the receipt reads `cancelled`, whatever `noResponder` says; `answered` is the target's decline; a request
  a run holds goes to item 1 once its state note's date passes; held work waits for the lift, item 4; OS-1 says the
  grace is the earliest a run starts, never a promise that none starts later). Risks folded: a move fences a run at its
  next fenced call, its renewal at the latest (OS-1, item 1, SCR-32, SCN-025); OS-4 ends a run on any other refusal of
  a board call on its work, `com.reconcile`'s refusal once the run no longer holds the slot among them, leaving the
  request as OS-5 says (item 4, the run's row); the run's row gains OS-3's quotation (with no
  `FABRIC_DISPATCH_WORKFLOW` the line is quoted and nothing is written) and OS-6's cancel of a waiting job by its own
  cancel; *at once* is the host's next pass (OS-1's preamble, item 1, the host's row, SCR-32, SCN-025), and the
  Compatibility names Fabric's state for it (the switch read on each dispatcher pass, `index.ts:2996`; the abandoned
  sweep every third cycle, `AGENTS.md:148`); Switchboard's `EXIT_CONTRACT` debt gains the refused-enrollment end (SA-6
  for that code without its retry, then the end, the operator asked only for a refusal that is not `retryable`); a run
  no move can stop (no other live authorized session) finishes, and a host's stop of its process leaves the request as
  a run that dies does (OS-1, item 1, SCR-32, SCN-025); OS-6 and item 6 name the estate's production stop (agents-first
  item 8), lifted only as that rule says and otherwise settled as a human step, and the draft's item 8 addition names
  it; the draft's item 5 gains "otherwise the requester acts on its own reading". Declined in part: the product risk
  that an asker cannot read the host's grace is folded by making the asker's safety independent of the grace (cancel
  first), not by naming a route that exposes the grace to another Project's agent, which would add a tool or a field
  this decision says it does not add; the product risk's suggested restatement of item 1 for `claimed` and `queued`
  requests is folded by item 3's lines (a `claimed` request goes to item 1, whose cancel while `not_started` serves it;
  a `queued` one is cancelled first), not by rewriting item 1, which keeps the merge condition's text small.

## Next task

Round 9 of the blind readings of branch `agent/ct215-on-demand-20261108` (DEC-0158), all three tiers. At landing:
DEC-0158 Accepted with its rounds, the amendment line and DEC-0022's annotation without "proposed", CT-215 done, the
North Star plan's wave 0 row, fabric-workspace `knowledge/agents-first.md` items 3, 5 and 8 landed with the merge as drafted above (a
merge condition, not a step after it), and a board post of the consumer debts to Fabric, Switchboard, the adapter,
Observatory and the third host, a date for each.
