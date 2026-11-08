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
- Round 9: the drafted knowledge base item 3 simplified (a change by the requester only for a request it cancelled at
  its revision while `queued` or `answered`, or one that expired; never for one a run has held; every state on one
  line; the hold's wait in the item itself) and "The project board" item 4 gains OS-7's one-request rule; SCN-025's
  release only under a covering mandate or relayed words, its human step listing the production stop; OS-5's
  launcher-refused start (no run) and the grant restarting the count; `noResponder`'s live grant defined; the opened
  session of the target Project given the request's id (CT-175 for its continuation); OS-6's question a notice;
  SCR-32's switch scope; Fabric's new debts and the open window in Compatibility.
- Round 10: OS-4 has a run accept immediately after its claim, before any change in the target's folder (item 4, the
  run's row, CONTEXT, Fabric's packet and `board.read-at-start` debts, Switchboard's `EXIT_CONTRACT` debt; the adapter
  already does it), so the drafted item 3 claims only what the board proves (no run accepted it); the window names the
  adapter's "do not cancel it", Fabric's `com.submit` description and the run's accept; OS-6, item 6, the run's row,
  SCR-19, SCN-025 and the drafted item 3 say who submits again a request a run left `in_progress` once the owner
  settles it `failed_known`; OS-1, item 1 and the host's row carry the grant condition `noResponder`'s paragraph
  defers to; the conformance rows reworded; Fabric's mandate, grace and `com.submit` debts; JRN-08 stage 6.
- Round 11: the drafted item 3 applies on every board (any host of the estate, another machine's included, may start a
  run, and the board does not say whether one will), the old order of the change first and the cancel after it
  dropped, a request left `queued` being one a run may take; the proof is a `cancelled` receipt answering a cancel
  sent with the read `expectedRevision`; "The project board" item 3 and "When nobody answers" item 4 drafted; OS-6
  names who submits a `failed_known` request again when no note stands (the requester) and has a later run write the
  same note; OS-5 and SCR-19 resubmit an `answered` request only while it still reads `answered`; OS-1, OS-5, item 1,
  item 5 and the host's row count runs and runs in flight across the host's machines; Fabric's `noResponder` sentence
  and cross-machine count debts.
- Round 12: the on-demand switch stops new starts on every machine the host dispatches from, one setting its machines
  share (OS-1, item 1, the host's row, SCR-32, SCN-025; Fabric's debt); an `answered` request is submitted again after
  a grant only on the submitter's own `cancelled` receipt for a cancel sent with the read `expectedRevision` (OS-5,
  item 5, SCR-19, SCN-025); CT-276 restated; the window's Switchboard wording corrected; a run observes, never redoes,
  a change the thread's *adapted by* line says was made (OS-4, item 4, the run's row; Fabric's and the adapter's
  debt); OS-4's reply fenced and a `lease_expired` settling call never retried; OS-6's hand-over wording; the drafted
  item 3 names the host that serves the board, drops the receipt's revision parenthesis and reads a cancel the
  requester did not send; Fabric's two tests pinning the old accept wording named.
- Round 13: the host's record of a request's runs (a begun effect's key, a settlement at a human step) is one across
  every machine it dispatches from, as the count is (OS-5, the host's row; Fabric's shared-record debt); the request
  lifecycle says every operation of its table advances the request's revision and a hold does not, which grounds the
  cancel proof; SA-6 and OS-4 call the host's next start the retry only where OS-5 allows one, and OS-5 says no start
  retries a refusal that is not `retryable`; SCR-19 and SCN-025 offer "Open a session of the target Project" first for
  an `accepted` request whose record holds a begun effect's key; the conformance rows cite *at once* and OS-3's
  object exactly; Fabric's missing owner "Settle" and its two texts named; Switchboard's exit text debt restated; the
  drafted item 3 says a hold stops board work and leaves the requester's own change to the operator's open question (then decided: held work waits for the lift, see Open);
  the drafted "The project board" item 3 and "When nobody answers" item 1.
- Round 14: OS-6 names an act a host's gate holds until a person agrees (on Fabric `floor.ask-first`, its ADR-0160
  section 4) as a stop; at it and at the estate's production stop the run settles and notes as at a human step but
  asks no question and nobody submits the request to the board again (only a session with a person can take the
  act), a request settled at a stop being submitted again only where what the person does lets a later run with no
  person take the step; OS-5, the host's row, CONTEXT and item 5 show such a request to the operator; SCN-025's
  release goes ahead only where the mandate or relayed words cover it and no host's gate holds it, a stop otherwise;
  the run's row and items 6 follow; the drafted "When nobody answers" item 3 reads the target in `com.directory`
  before any state line (`expired` included) and finds a thread hold by a `held` refusal of a one-line intent post
  before the change, its *adapted by* line posted once a later thread hold lifts, with the Compatibility restated;
  OS-4 exempts a refused stop note from its "ends it" clause; SCR-32 and SCN-051 say a moved-off run's `accepted`
  request waits for the receiving session's transfer (CT-175), not shown meanwhile; CONTEXT's "(`fenced` aside)";
  Fabric's "one run in flight" debt dropped (OS-1 leaves another machine's second run to the board's slot);
  `comms-enroll.schema.json`'s description applies the run's end to every refusal branch (description only);
  backlog CT-281 (a host test of the revision rule); CT-215 and the handoffs index current.
- Round 15: OS-6's never-resubmit is kept only for a host's gate, an act a host refuses to a session with no person
  whatever is agreed (on Fabric FA-09, checked before any grant, for a `floor.ask-first` act), grounded in that
  refusal and not in the gate's agreement; at the estate's production stop the note names the step and says the
  request is submitted again once it carries the operator's relayed words naming that step (agents-first item 8);
  OS-6, item 6, the run's row, CONTEXT, SCN-025 and the drafted item 8 changed together, OS-5, item 5 and the host's
  row naming the two stops; a refused stop note now has one directive (the run asks its notice question at every stop,
  and a requester who finds no note may submit again, a later run meeting the same stop and writing the note); OS-4's
  exemption covers the `in_progress` branch; the owner-settlement sentence names nobody at a host's gate; a side act
  left at a stop after the asked act was done and observed settles `completed`; the drafted item 1 drops "finds them"
  and names the effect-key window; the drafted item 3's intent line withdrawn; Fabric's W4-7, Switchboard's
  `EXIT_CONTRACT` and the adapter's `DISPATCH_CONTRACT` host-gate debts named in the Compatibility and the landing
  post; the DEC-0156 landing requirement states the resubmission alignment with OW-3 in words; SCN-025 and CT-276 say
  SA-6's generation-0 decline wins over a run; CT-215 and the handoffs index current.
- Round 16: the resubmission rule's "submitted again only where what the person does lets a later run with no person
  take the step, never by one who reads a host's gate note" now applies only to a request whose stop note is in its
  thread, and a request with no such note is its stated sole exception, its requester deciding; the refused-note notice
  question names one actor and one directive ("the requester decides, finding no note") and never quotes a note's
  directive beside it, a request submitted again from a host's gate meeting the same refusal in a later run, which
  settles it and writes the note; OS-6, item 6 and the run's conformance row changed together, OS-4's refused-note
  sentence aligned, SCR-19 and the run's row say "a refused note" / "one whose note was refused"; SCN-025's
  `in_progress` hold says "do not submit it again"; FA-09 pinned in the Compatibility at Fabric's main `eafcf2e4`.

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
  key carried by the take-back, the 60-second skew; from round 9, its `board.read-at-start` saying OS-7's
  one-request rule, SCR-19's causes and actions, a `request-unmoved` next step that leaves a request to the run due to
  take it, and the grant starting OS-5's count again; from round 10, the accept immediately after the claim, before
  any change in the target's folder, in its packet (`boardDispatchRun.ts:281`) and its `board.read-at-start` rule, the
  mandate taken only when its last entry is the target's registry agent id with that id as a packet reference, its
  grace help saying the grace is the earliest a run starts, and its `com.submit` description naming a run that may
  take a `noResponder` request; from round 11, the `noResponder` receipt's sentence for a person
  (`boardService.ts:617-618`) saying the same, and one count of OS-5's two runs per request
  across every machine it dispatches from, under CO-409 (after round 14 one run in flight across machines is no debt:
  OS-1 leaves it to the board's slot); from round 12, the on-demand switch as one setting its
  machines share, stopping new starts on every machine it dispatches from, where each machine reads its own today
  (`index.ts:2996`), its tests `board-dispatch-run.test.mjs:566` and `protocolObligations.test.ts:91` changing with
  the `:281` and `:222` wording they pin, and its packet having a run observe, never redo, a change the thread's
  *adapted by* line says was made; from round 13, one record of a request's runs across those machines, a begun
  effect's key and a settlement at a human step among it, where the take-back reads `prior` from the local
  `board-dispatches.json` (`index.ts:2998`) and opens a fresh workflow with no earlier key on another machine
  (`boardDispatchRun.ts:302-309`), owner settlement's "Settle" on a shown `outcome_unknown` request (CT-41,
  DEC-0081, designed and not built) with its "nothing settles it until one does" string (`en.ts:2266`) and its sweep's
  "answer the requester" next step (`abandonedSweep.ts:248`) brought to owner settlement, and "Open a session of the
  target Project" offered before cancel and submit again for an `accepted` request whose record holds a begun
  effect's key); Switchboard's `EXIT_CONTRACT` (from round 10, the accept immediately after the
  claim; from round 13, on a refused `com.enroll`, where its text names no end for a refusal other than
  `not_authorized`, asking the operator even where SA-6 asks no one, the end for every refused code and the operator
  asked only where SA-6 asks); the adapter's FAA-201 (the three
  variables removed from what a run launches, no elicitation capability, OS-6's settlement, `failed_known` after an
  effect only once no effect is observed, at `references/on-demand-session.md:147` and `:191`; recording a begun
  effect's key in the host's record of the run, a debt new with DEC-0158 and not FAA-215's, which covers closing the
  workflow, `observed: true` and the open checkpoint's reason; taking a board request's mandate only when its last
  entry is the target's registry agent id; from round 12, a change the thread's *adapted by* line says was made
  observed and never made again); Observatory's kept
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
- Decided after round 13 (the product reading's question; taken by the coordinator under the operator's rule that an
  open question is decided by the safest reversible option and recorded): a hold of the target's Project or slot also
  stops the requester's own change under "When nobody answers" item 3. A request whose target Project or slot reads
  `held: true` waits for the lift and the requester makes no change for it (item 4). Reasons: it is what Fabric's pause
  label already tells the operator ("nothing new is taken until you resume"), it matches round 8's settlement that held
  work waits for the lift, and it is the reversible side: a change that waits can be made after the lift, a change made
  under a hold cannot be unmade by the lift. The cost, a small change waiting on a hold the operator set for another
  reason, is the operator's to lift. After round 14 the check comes first, before any cancel and before the `expired`
  line, as the adapter's `references/project-board.md:105-106` puts it in its step 1: the requester reads the target in
  `com.directory` (`com.status` reads only its own Project). Round 15 withdrew round 14's one-line intent post that
  found a thread hold before the change (the seam reading found no `held` refusal in Fabric's board migrations, so on
  Fabric it may be inert): a thread hold, which no page shows and which never refuses a cancel, is now met only by an
  *adapted by* line it refuses, posted once the hold lifts, so a requester's own change under a thread hold is not
  stopped. On Fabric the Project and slot check is a mixed state too until its W4-7 (`comms-directory-held`,
  DEC-0079) ships, its `com.directory` carrying no `held`. The operator may reverse the decision before the merge;
  the drafted item 3 and DEC-0158's Compatibility then change together.
- From round 15, not folded into the text (open): whether Fabric refuses `held` at all under a DEC-0079 thread hold
  (the seam found its responder pause label, `en.ts:2263`, and no held refusal in the board migrations it searched),
  a reading at Fabric's next pin; a requester's cancel-and-submit-again path for an `accepted` request whose run
  recorded an effect key the requester cannot see (the drafted item 1 names the window; the requester's side is
  CT-175's); SA-6's generation-0 decline taking a request from the dispatcher while on-demand is on (SCN-025 says the
  decline wins; the rule's choice is CT-276's).
- CT-276 (the operator's limits on where a run starts) and CT-277 (how a requester learns a target Project's registry
  agent id) are open; neither blocks the merge.
- Fabric's specification at its main `eafcf2e4` also tells the run to append itself
  (`docs/evidence/specs/2026-11-04-on-demand-sessions.md:139-140` and `:148-149`): part of Fabric's OS-7 debt, with its
  packet text. Fabric's CO-409 also answers whether its home count of requests no agent answers excludes a request a
  run is about to take or is working, and owes showing at once a request a run settled at a human step it could not put
  to its operator.
- A merge condition, landed with the merge and not after: fabric-workspace `knowledge/agents-first.md`, "The project
  board" items 3 and 4 gaining OS-7's one-request rule (item 3 also OS-4's end without a retry and its accept right
  after the claim), "When nobody answers" item 1's cancel carrying `expectedRevision` and naming a run's edits under an
  `accepted` request with effect `not_started`, items 3, 4 and 5 restated (on every
  board, a requester makes a change itself only for a request it cancelled while `queued` or `answered`, the
  `cancelled` receipt answering a cancel sent with the read `expectedRevision`, or one that expired, never for one a
  run has held; a request left `queued` may be taken by a run; a session the host starts is built) and "One approval binds all" item 8's production
  stop kept with OS-6's settlement beside it. Its check: the knowledge base's own gate on that change, then a reading
  of the merged items against OS-1, OS-5, OS-6 and OS-7. The contract's merge and that change land together. The draft
  below is the text to land.
- Until then a mixed state is open: Fabric's dispatcher is on by default since 0.3.16, while item 3 at `c84c7a40` has a
  requester make a small change and cancel afterwards, the adapter's requester rule has it make the change and leave
  the request `queued` ("do not cancel it", `references/project-board.md:134-136` at `2c0b1b18`), so a run takes the
  request after the change, Fabric's `com.submit` description (`boardTools.ts:94-96`) and its `noResponder` sentence
  (`boardService.ts:617-618`) say nothing of a run, and
  Fabric's packet has a run accept only before its effect begins while Switchboard's exit text names no claim or accept
  (do the request, then complete it), so a run may change the folder while the request is still `claimed`. The landing
  board post names that window (from Fabric 0.3.16 until the knowledge change lands and each consumer meets its debt
  by its date) beside the consumer debts (DEC-0158 Compatibility).
- The landing board post of the consumer debts names, for each consumer (Fabric, Fabric Switchboard, the adapter,
  Project Observatory, the third host), its debts (the adapter's among them: dropping "do not cancel it" from its
  requester rule; Fabric's: its `com.submit` description, its `noResponder` sentence, one count per request across
  its machines, one record of a request's runs across them (a begun effect's key, a
  settlement at a human step), the on-demand switch as one setting its machines share, the accept immediately after
  the claim, owner settlement's "Settle" on a shown `outcome_unknown` request (CT-41, DEC-0081) with its "nothing
  settles it" string and its "answer the requester" next step brought to owner settlement, OS-6's stops in its packet
  and `board.read-at-start`, and `held` in `com.directory`, its W4-7 (`comms-directory-held`, DEC-0079), until which a
  held target reads on Fabric as not held and a requester under item 3 may cancel or change under a hold; Switchboard's:
  the end of every refused enrollment, the operator asked only where SA-6 asks, and OS-6's host-gate stop in its
  `EXIT_CONTRACT`; the adapter's: OS-6's host-gate stop in its `DISPATCH_CONTRACT`) and a date: 2026-11-22 (two weeks after landing) unless the consumer's
  reply carries a `row` reaction with its own `due` (DEC-0098), which then replaces it. Until each date, a consumer
  still at the old reading is the mixed state the post names.

- From round 14, restated in round 15: Fabric's packet and `board.read-at-start` text, Switchboard's `EXIT_CONTRACT`
  and the adapter's `DISPATCH_CONTRACT` owe OS-6's two stops: at a host's gate (on Fabric, a `floor.ask-first` act
  refused to a run by FA-09) a run settles, asks no question unless its note was refused, and its note says nobody
  submits the request to the board again; at the production stop its note says the request is submitted again once it
  carries the operator's relayed words naming the step; the dispatcher shows such a request to the operator by the
  run's record (OS-5).
- Sibling landing requirements on DEC-0158's own text, binding on whichever of the two branches lands second. They
  are stated here as requirements on the merged text with merged-tree checks; what each sibling's own text says is
  read on its branch at landing, never assumed here.
  - DEC-0156 (the operator's word): OW-3 and OS-6 cite each other; OW-3's no-person case and OS-6 name one
    settlement (before an effect, `failed_known` with `observed: false` and a reply naming the open act; an asked act
    done with only a side act left open, `completed` with the open act named); one resubmission rule for the
    production stop in both (submitted again once the request carries the operator's relayed words naming the step),
    and never-resubmit only for the act a host refuses to a session with no person whatever is agreed (on Fabric
    FA-09), OS-6's host's gate and OW-3's FA-09 case being that one act; OS-6's notice question only at a human step
    and where a stop note was refused; the conformance rows keep their order (the board-client row with "a dispatched run follows its own
    row below (OS-4, OS-7)" first). Checks on the merged tree: `awk '/^- \*\*OS-6/,/^- \*\*OS-7/'
    docs/specification/project-comms.md | grep -c OW-3` prints at least 1; `awk '/^- \*\*OW-3/,/^- \*\*OW-4/'
    docs/specification/governance-and-roles.md | grep -c OS-6` prints at least 1; `grep -c 'a dispatched run follows
    its own row below (OS-4, OS-7)' docs/specification/conformance.md` prints 1; then a reading of OS-6 as merged.
  - DEC-0159 (the local and cloud form): OS-6 and the dispatched-run row count a `scope-not-granted` refusal with an
    `operator-step:` detail, and a job whose `statusMessage` starts `operator-step`, as a human-step stop. Checks on
    the merged tree: `awk '/^- \*\*OS-6/,/^- \*\*OS-7/' docs/specification/project-comms.md | grep -c operator-step`
    prints at least 1, and `grep '^| a dispatched run' docs/specification/conformance.md | grep -c operator-step`
    prints 1.
  - DEC-0157 (usage data): UD-4 re-read against the host's and the dispatched run's rows and OS-7 (a change-policy
    act such as the usage switch stays outside any mandate). Check: a reading on the merged tree, recorded in the
    lander's handoff.
- Round 16, DEC-0156's own landing requirement read (its handoff's DEC-0158 note on
  `origin/agent/ct220-operators-word-v2`, read only), its greps run on `git merge-tree --write-tree` of this round's
  tree and that branch (conflicts in `docs/DECISIONS.md`, `docs/backlog.md`, `docs/handoffs/README.md`,
  `docs/specification/conformance.md`, the greps counting the conflicted text): every count this round's edit can
  move still prints what it requires (the board-client row 1, the OW row 1, OS-6 with FA-09 2, with `a grant` 1, with
  `side act` 1, the run's row with the old "asks no question ... says that it waits" 0 and with "at the production
  stop says the request is submitted again" 1, item 6 with "request is submitted again once it carries" 1 and with
  FA-09 at least 1, this handoff's production-stop line 1). Two counts print 0 where 1 is required, as before this
  round (neither branch has made the edit; it is the second lander's): the OW-3 range with `OS-6` and the OS-6 range
  with `OW-3`. For the coordinator to relay to DEC-0156's owner: its judgement items read "OS-6 ... scopes its notice
  question to a human step" and "has no FA-09 act submitted again", while OS-6 since round 15 also asks the notice
  question where its stop note was refused, and since round 16 states the no-note path as the sole exception, under
  which a requester who finds no note may submit a host's-gate request again (a later run meets the same refusal and
  writes the note); this branch's own DEC-0156 requirement above already names the refused-note question.

## Draft of the knowledge base change (a merge condition)

The text to land in fabric-workspace `knowledge/agents-first.md` with this decision's merge (read at its main
`c84c7a40`). Items not named keep their text.

"The project board", item 3, one sentence added after its first ("... claim it and start (principle 10, item 2)."):

> A session a host started for one board request claims no other (item 4, contract DEC-0158 OS-7), does not retry a
> refused enrollment and ends (the host's next start, where it starts one, is the retry; OS-4, OS-5), and accepts the
> request immediately after its claim, before any change in the target's folder (OS-4).

"The project board", item 4 ("Answer at once"), one sentence added at its end:

> A session a host started for one board request answers only that request: every other message waiting for the
> Project stays unread for the Project's next session (contract DEC-0158 OS-7).

"When nobody answers", item 1, its cancel of a request still `accepted` with effect `not_started` restated (from "If
nobody answers and its `effect` is still `not_started`"):

> If nobody answers and its `effect` is still `not_started`, cancel it (`com.cancel`, `expectedRevision` set to the
> revision `com.get` returned; on `revision_conflict`, read it again and go by its new state), and only once the
> receipt shows it `cancelled` submit it again. A request a run took (contract DEC-0158 OS-4) may be `accepted` with
> `effect` `not_started` and already carry the run's edits in the target's folder: the run accepts before any change
> there, and `not_started` says only that it has done nothing outward yet. Those edits may sit uncommitted in a folder
> of the target Project on the machine where the run ran; the run of the request you submit again is not told of
> them, and the operator or the owner's next session reconciles them. A run may also have recorded the effect's key
> in the host's record, which you cannot see: where the operator owns your Project, leave such a request to the
> operator, whom the host shows it to with that key (OS-5); otherwise know that a request you submit again gets no
> earlier key.

"When nobody answers", item 3, its first sentence restated and one paragraph added after it (the rest of the item
unchanged but its last paragraph, below):

> 3\. **Nobody is live, the machine is the operator's, and the change is small: make it yourself, in the owner's
> repository, only as the lines below allow.** The host that serves the board may start a session from any machine
> of the operator's it runs on for a request no responder holds (Fabric's dispatcher, on by default; contract DEC-0158
> OS-1), and the board does not say whether one will. Such a run accepts the request immediately after its claim, before any
> change in the target's folder (OS-4), and an accepted request never returns to `queued` and never expires. Your
> reply as the asker does not answer your own request, and a request left `queued` may be taken by a run (item 5).
> First read the target in `com.directory` (your source for another Project; `com.status` reads only your own): if
> the target Project or the request's capability reads `held: true`, cancel nothing, make no change, and go to item 4.
> This comes before every line below, `expired` included, so a request that expires under a hold waits for the lift
> before any change: a hold stops board work on the held thread, Project or slot (no run starts under it, contract
> OS-1) and your own change for that request too. A thread hold shows in neither, only as a `held` refusal of a post
> into the thread (never of a cancel): an **adapted by** line (below) it refuses after your change is posted once the
> hold lifts. Then read the
> request (`com.get` gives its `state` and `revision`) and go by its state:
>
> - `queued`, or `answered` (the target's decline; no run takes it): cancel it (`com.cancel`, `expectedRevision` set
>   to that revision, the reason "the asker makes this change itself"), then make the change. Only a `cancelled`
>   receipt answering a cancel sent with that `expectedRevision` proves no run accepted it (every operation of the
>   request's lifecycle advances its revision, so the board refuses `revision_conflict` when the request moved). On `revision_conflict`, read it again.
> - `expired`: no run accepted it; make the change.
> - `claimed`, `accepted`, `in_progress` or `outcome_unknown`: a run or another holder has it; never make the change.
>   Wait on a watcher (item 2) and act on it only as item 1 says.
> - `completed` or `cancelled`: settled; make no change for it, except one you cancelled under the first line. A
>   cancel you did not send means another session of your Project acted on it: submit nothing for it.
> - `failed_known`: settled as not done; make no change for it. Once the step is taken, the one the run's note in the
>   thread names submits it again; after the owner's settlement (`settledBy: "owner"`), the operator when they own
>   your Project, otherwise you; with no such note, you decide (OS-6).
>
> If your change does not land, submit the request again.

and the item's last paragraph, from "Then post on the request's thread", reads:

> Then post on the request's thread (`com.submit`, kind message, the thread's id), one line: **adapted by** your
> Project, the merge commit, and what the owner should look at. The owner's next session reads the thread and may
> revert it. One such change per target repository at a time.

"When nobody answers", item 4, "the request stays queued for its owner" reads "the request stays for its owner, or for
a run a host starts (item 5)".

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
> (contract DEC-0158 OS-6). At this item's production step it asks no question, and its note names the step and says
> the request is submitted again once it carries the operator's verbatim relayed words naming that step (date,
> source, scope), which lift this stop as above. At an act a host refuses to a session with no person whatever is
> agreed (Fabric's FA-09 refusal of a `floor.ask-first` act, which no relay, mandate or grant passes) it asks no
> question, and its note says the act waits for a session the person is in and that nobody submits the request to the
> board again. Where its note is refused, it asks the operator through the host's question surface instead.

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

## Checks run on the round-9 commit

- On the tree of the round-9 commit (parent `65fe1f57`): `pnpm run docs:check` exit 0 ("Documentation checks passed",
  lint:md 271 files, 0 errors); `python3 docs/ux/lint.py` exit 0 (40 stories, 34 flows, 34 screens, 56 scenarios);
  `pnpm run privacy:check` exit 0 (0 findings); `pnpm vectors:check` exit 0 (32 vector files match their generators);
  `pnpm vitest run test/mandate.test.ts test/consistency.test.ts test/comms-tools.test.ts` exit 0 (3 files, 231
  tests); `git diff origin/main...HEAD | grep '^+' | grep -c` of U+2014 printed 0; `git merge-tree --write-tree HEAD
  origin/main` exit 0. The full `pnpm run check` was not run in this round.

## Checks run on the round-8 commit

- On the tree of the round-8 commit (parent `f0457843`): `pnpm run docs:check` exit 0 ("Documentation checks passed",
  lint:md 271 files, 0 errors); `python3 docs/ux/lint.py` exit 0 (40 stories, 34 flows, 34 screens, 56 scenarios);
  `pnpm run privacy:check` exit 0 (0 findings); `pnpm vectors:check` exit 0 (32 vector files match their generators);
  `pnpm vitest run test/mandate.test.ts test/consistency.test.ts test/comms-tools.test.ts` exit 0 (3 files, 231
  tests); `git diff origin/main...HEAD | grep '^+' | grep -c` of U+2014 printed 0; `git merge-tree --write-tree HEAD
  origin/main` exit 0. The full `pnpm run check` was not run in this round.

## Checks run on the round-10 commit

- On the tree of the round-10 commit (parent `da4b3a90`): `pnpm run docs:check` exit 0 ("Documentation checks
  passed", lint:md 271 files, 0 errors); `python3 docs/ux/lint.py` exit 0 (40 stories, 34 flows, 34 screens, 56
  scenarios); `pnpm run privacy:check` exit 0 (0 findings); `pnpm vectors:check` exit 0 (32 vector files match their
  generators); `pnpm vitest run test/mandate.test.ts test/consistency.test.ts test/comms-tools.test.ts
  test/comms-hold.test.ts` exit 0 (4 files, 355 tests); `git diff origin/main...HEAD | grep '^+' | grep -c` of U+2014
  printed 0; `git merge-tree --write-tree HEAD origin/main` exit 0. The full `pnpm run check` was not run in this
  round.

## Checks run on the round-11 commit

- On the tree of the round-11 commit (parent `d54bd9de`): `pnpm run docs:check` exit 0 ("Documentation checks
  passed", lint:md 271 files, 0 errors); `python3 docs/ux/lint.py` exit 0 (40 stories, 34 flows, 34 screens, 56
  scenarios); `pnpm run privacy:check` exit 0 (0 findings); `pnpm vectors:check` exit 0 (32 vector files match their
  generators); `pnpm vitest run test/mandate.test.ts test/consistency.test.ts test/comms-tools.test.ts
  test/comms-hold.test.ts` exit 0 (4 files, 355 tests); `git diff origin/main...HEAD | grep '^+' | grep -c` of U+2014
  printed 0; `git merge-tree --write-tree HEAD origin/main` exit 0. The full `pnpm run check` was not run in this
  round.

## Checks run on the round-12 commit

- On the tree of the round-12 commit (parent `d3aac7c2`): `pnpm run docs:check` exit 0 ("Documentation checks
  passed", lint:md 271 files, 0 errors); `python3 docs/ux/lint.py` exit 0 (40 stories, 34 flows, 34 screens, 56
  scenarios); `pnpm run privacy:check` exit 0 (0 findings); `pnpm vectors:check` exit 0 (32 vector files match their
  generators); `pnpm vitest run test/mandate.test.ts test/consistency.test.ts test/comms-tools.test.ts
  test/comms-hold.test.ts` exit 0 (4 files, 355 tests); `git diff origin/main...HEAD | grep '^+' | grep -c` of U+2014
  printed 0; `git merge-tree --write-tree HEAD origin/main` exit 0. The full `pnpm run check` was not run in this
  round.

## Checks run on the round-13 commit

- On the tree of the round-13 commit (parent `0dd3e829`): `pnpm run docs:check` exit 0 ("Documentation checks
  passed", lint:md 271 files, 0 errors); `python3 docs/ux/lint.py` exit 0 (40 stories, 34 flows, 34 screens, 56
  scenarios); `pnpm run privacy:check` exit 0 (0 findings); `pnpm vectors:check` exit 0 (32 vector files match their
  generators); `pnpm vitest run test/mandate.test.ts test/comms-hold.test.ts test/consistency.test.ts
  test/comms-tools.test.ts` exit 0 (4 files, 355 tests); `git diff origin/main...HEAD | grep '^+' | grep -c` of U+2014
  printed 0; `git merge-tree --write-tree HEAD origin/main` exit 0. The full `pnpm run check` was not run in this
  round.

## Checks run on the round-14 commit

- On the tree of the round-14 commit (parent `231b1a92`): `pnpm run docs:check` exit 0 (lint:md 271 files, 0
  errors); `python3 docs/ux/lint.py` exit 0 (40 stories, 34 flows, 34 screens, 56 scenarios); `pnpm run
  privacy:check` 0 findings; `pnpm vectors:check` 32 vector files match their generators; `pnpm typecheck` exit 0;
  `pnpm vitest run test/mandate.test.ts test/comms-hold.test.ts test/consistency.test.ts test/comms-tools.test.ts
  test/fixtures.test.ts` exit 0 (5 files, 1492 tests); `git diff origin/main...HEAD | grep '^+' | grep -c` of U+2014
  printed 0; `git merge-tree --write-tree HEAD origin/main` exit 0. The full `pnpm run check` was not run in this
  round.

## Checks run on the round-15 commit

- On the tree of the round-15 commit (parent `b31b6889`): `pnpm run docs:check` exit 0 (lint:md 271 files, 0
  errors); `python3 docs/ux/lint.py` exit 0 (40 stories, 34 flows, 34 screens, 56 scenarios); `pnpm run
  privacy:check` exit 0 (0 findings); `pnpm vectors:check` exit 0 (32 vector files match their generators); `pnpm
  vitest run test/mandate.test.ts test/consistency.test.ts` exit 0 (2 files, 108 tests); `git diff origin/main...HEAD
  | grep '^+' | grep -c` of U+2014 printed 0; `git merge-tree --write-tree HEAD origin/main` exit 0; `awk
  '/^- \*\*OS-6/,/^- \*\*OS-7/' docs/specification/project-comms.md | grep -c "every stop but the estate's production
  stop and a host's gate"` printed 0; `awk '/^### DEC-0158/,0' docs/DECISIONS.md | grep -c 'W4-7\|comms-directory-held'`
  printed 1. The full `pnpm run check` was not run in this round.

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

- Round 9 (on `65fe1f57`), not clean: seam, the drafted item 3's `queued` line cancelled with no `expectedRevision`
  and read any `cancelled` receipt as proof no run took it, though `com.cancel` moves `claimed` and `accepted` to
  `cancelled` too, so a run could claim, accept and edit between the requester's `com.get` and its cancel (now the
  cancel carries `expectedRevision` set to the revision `com.get` returned, only `cancelled` at that revision proves
  no run took it, and `revision_conflict` sends the requester to read it again); product, the early cancel kept the
  reason "done by the asker", false when written and losing the request if the change did not land (now "the asker
  makes this change itself", and a change that does not land is submitted again), the draft's lines left
  `completed`, `failed_known`, `expired` and `cancelled` unrouted (now every lifecycle state is on exactly one line),
  and SCN-025's on-demand happy path had an unattended run do a release for `publish` (now only when the request
  carries the operator's mandate or relayed words that cover it, OS-6, and the human-step path lists the estate's
  production stop). The draft is simplified rather than extended: a requester makes the change itself only for a
  request it cancelled at its revision while `queued` or `answered`, or one that expired; for any request a run has
  held (`claimed`, `accepted`, `in_progress`, `outcome_unknown`) never, item 1's resubmission going back to the
  target. `answered` sits on the `queued` line because no operation but `com.cancel` moves it and no run takes it
  (OS-1), so a `cancelled` receipt at its revision proves as much as for `queued`. Risks folded: the hold's wait
  stated in item 3 itself, the reference to item 4 dropped (seam); Fabric's `board.read-at-start` and the knowledge
  base's "Answer at once" against OS-7, a Fabric debt in the Compatibility and a drafted sentence for "The project
  board" item 4 (seam); a start the launcher refused or could not make is no run, bounded by the host's back-off, in
  OS-5, item 5, the host's row and CONTEXT, and the Compatibility's counting sentence restated as Fabric counts (every
  run that leaves the request in a state a run can take; `refused` and `failed-to-start` uncounted) (seam); the
  operator's grant after `not_authorized` starts OS-5's count of two again, in OS-5, item 5, the host's row and
  Fabric's debt (unit); `noResponder`'s live `board.respond` grant defined as one the board holds now for the Project
  and capability, a grant a host gives only at a session's own `com.enroll` not being one until then, so a standing
  grant would have kept `noResponder` off (unit); "Open a session of the target Project" is opened with the request's
  id and the earlier runs' record, and the session is an ordinary client whose continuation is CT-175's receiving
  part, open, in OS-5, item 5, the host's row, SCR-19 and SCN-025 (product); OS-6's human-step question is a notice
  that blocks nothing and whose answer the ended run never reads, in OS-6, item 6, the run's row and SCN-025
  (product); the on-demand switch on SCR-32 and in SCN-025's UI elements covers every Project of the board, or links
  to the host's settings (product); the window between Fabric 0.3.16 and the knowledge change named in the
  Compatibility, the handoff and the landing post (product); Fabric's debts gain SCR-19's causes and actions and a
  `request-unmoved` next step that leaves a request to the run due to take it (product). Declined: the seam's
  suggestion that OS-4 require `com.effect_begin` before a run's first write to the target repository, since item 3
  no longer lets a requester change the repository for any request a run has held, which closes the race from the
  requester's side; an effect is what a run does outward (OS-4), a run's edits in its own Project's folder are its
  work and not yet outward, and beginning an effect at the first edit would turn every dead run's request into
  `outcome_unknown`, losing OS-5's continuation of an `accepted` request by a transfer. Declined: landing the
  knowledge change now, apart from the merge (product), since the draft changed again in this round and cites
  DEC-0158's OS rules, still Proposed on an unmerged branch; the window is named instead, the finding's second
  option.

- Round 10 (on `da4b3a90`), not clean: seam, the drafted item 3 read a `cancelled` receipt at the request's revision,
  or `expired`, as proof that no run had changed the repository, but a run told to accept only "before its effect
  begins" (Fabric's packet, `boardDispatchRun.ts:281`) may edit the target's folder while the request is `claimed`, and
  a replacement (the next `com.enroll` on a lapsed slot, the `stale` cause) returns `claimed` to `queued` and a
  deadline expires it, so a requester and a run could both change the repository (now OS-4 has a run accept
  immediately after its claim, before any change in the target's folder, so a request a run has worked on is at least
  `accepted`, which no replacement returns to `queued` and no deadline expires; item 4, the run's row and CONTEXT say
  so, Fabric's packet and `board.read-at-start` and Switchboard's `EXIT_CONTRACT` owe it, the adapter already does it at
  `references/on-demand-session.md:77-78`; the draft's proof sentence and `expired` line claim only that no run accepted
  it, so none changed anything). This is not round 9's declined suggestion: an accept is not an effect, so a dead run's
  request stays `accepted` and continues by a transfer (OS-5), never becoming `outcome_unknown` for an edit in the
  run's own folder. Seam, the named window said the adapter's requester rule makes the change and cancels afterwards,
  but it says "do not cancel it" (`references/project-board.md:134-136` at `2c0b1b18`), so the request stays `queued`
  and a run takes it after the change (now the window in the Compatibility and here says so, and the adapter's debt
  and the landing post name dropping "do not cancel it"). Product, a request a run left `in_progress` and the owner
  later settled `failed_known` had no one to submit it again (now OS-6, item 6, the run's row, SCR-19, SCN-025 and the
  drafted item 3's `failed_known` line, which reads `settledBy` before the run's note: settled `failed_known` by the
  owner, the one a run's `failed_known` note would name submits it again; settled `completed`, nothing is). Risks
  folded: Fabric's mandate debt gains the last-entry condition and the target's registry agent id as a packet
  reference (OS-2, OS-7; seam); the draft's `claimed`/`in_progress` line says the requester waits on a watcher (a
  lapsed claim is retaken by a run, a dead run's `in_progress` reaches the owner as `outcome_unknown`), which corrects
  round 8's note that item 1's cancel serves a `claimed` request: item 1's cancel serves only an `accepted` one (seam);
  Fabric's grace debt restated as met but stated as a promise in its setting help (`en.ts:985`, `ru.ts:297`), which
  owes saying the grace is the earliest a run starts and that caps or a live session may defer it (product); Fabric's
  `com.submit` description (`boardTools.ts:94-96`) a debt and part of the window (product); JRN-08 stage 6 reads
  "completed", not "answered" (product); the run's row lists the by-state takes before the refused-enrollment clause,
  the host's row has "(`fenced` aside)" after "not `retryable`" and the launcher clause as its own item (unit); the
  grant condition `noResponder`'s paragraph stated is now in OS-1, item 1 and the host's row, the paragraph deferring
  to OS-1 (unit). Declined: none.

- Round 11 (on `d54bd9de`), not clean: unit passed with two risks, seam and product failed; seam and product, the drafted item 3 applied its
  state lines only "where the host dispatches", but a requester cannot observe whether a host dispatches, and Fabric's
  dispatcher may run on another of the operator's machines (its spec `:124`, "another machine may take it"; its switch
  a per-machine setting), so a requester on the old path (the change first, the cancel after it) and a run on another
  machine could both change the owner's repository (now the lines apply on every board: any host of the estate,
  another machine's included, may start a run and the board does not say whether one will; the old path and "without
  the cancel it stays queued and expires" are dropped, replaced by "a request left `queued` may be taken by a run
  (item 5)"; the item is shortened; the Compatibility's summary of item 3 restated). Seam, the proof read "a receipt
  that reads `cancelled` at that revision", but a receipt carries the request after the call
  (project-comms.md *Receipts*) and the board's transition returns the next revision, so no successful cancel reads the
  revision sent (now "only a `cancelled` receipt answering a cancel sent with that `expectedRevision` (the board
  refuses `revision_conflict` when the request moved; the receipt's own revision is the next one) proves no run
  accepted it", in the draft and the Compatibility). Risks folded: Fabric's `noResponder` receipt sentence
  (`boardService.ts:617-618`) a debt beside its `com.submit` description, in the window and the landing post
  (product); after the operator's grant an `answered` request is submitted again only while it still reads
  `answered`, in OS-5, item 5, SCR-19 and SCN-025 (product); a `failed_known` request with no note naming who submits
  it again (a responder's own reason, a run's time limit, a note a thread hold refused) leaves it to the requester, a
  run whose note was refused names the requester in its question, and a run or opened session that settles
  `failed_known` a request an earlier run left `in_progress` at a stop writes the same note, in OS-4, OS-6, item 6, the
  run's row, SCR-19 and the drafted item 3 (product, seam, unit); "The project board" item 3 (a session a host started
  for one request claims no other) and "When nobody answers" item 4 (the request stays for its owner, or for a run a
  host starts) drafted (product); one run in flight and OS-5's count of two are per request across every machine the
  host dispatches from, the board's slot keeping a second run from working (its `com.enroll` refused `fenced`), in
  OS-1, OS-5, items 1 and 5 and the host's row, the Compatibility saying Fabric meets them per machine today and
  owing a shared record under CO-409 (seam); OS-6's "only the first two have an exception" reads "only the first two
  are answered under a mandate or a relayed decision", the estate's production stop being lifted by its own rule
  (unit). Declined: carrying the who-submits-again sentence in `com.complete`'s `failed_known` summary (seam's first
  option), since the message view a requester reads (`schemas/comms-message.schema.json`, its `request` object) carries
  no outcome summary and Fabric shows it only in the operator's reads, so the default (the requester decides) is the
  rule instead; one dispatching host per estate (seam's other option), since Fabric's specification lets another
  machine take a request one machine skipped; excluding from OS-1's candidates a request a run left at a human step
  (unit's first option), since the next run or opened session is what settles it, now writing the same note.

- Round 12 (on `d3aac7c2`), not clean: unit passed with three risks, seam and product failed. Product, the on-demand
  switch was promised as one switch for the board, but OS-5's count spans the host's machines while Fabric reads the
  switch per machine (`index.ts:2996`, `switchOn: () => readSettings().dispatchBoardRequests`), so turning it off on one
  machine left the others starting runs (now OS-1, item 1, the host's row, SCR-32 and SCN-025 say it stops new starts
  on every machine the host dispatches from, one setting its machines share, and Fabric owes it under CO-409 in the
  Compatibility). Product, after the operator's grant an `answered` request was submitted again "only while it still
  reads `answered`", a read, not a cancel, so the operator's session and the requester's own cancel-and-change under
  the drafted item 3 could both act and a run change the repository a second time (now OS-5, item 5, SCR-19 and
  SCN-025: whoever submits it again first cancels it with `expectedRevision` set to the revision it read, and submits
  again only on its own `cancelled` receipt; on `revision_conflict` or another state it reads again and submits
  nothing). Product, CT-276 restated OS-1 as "on the machine that serves the board" (now "on any machine of the
  operator's that the host dispatches from"). Seam, the mixed-state paragraph said Switchboard's exit text has a run
  accept before its effect begins, but its `EXIT_CONTRACT` (`dispatch.rs:266`) names no claim or accept (now: Fabric's
  packet says accept before the effect begins, and Switchboard's exit text names no claim or accept, do the request
  then complete it, so a run may change the folder while the request is still `claimed`, in the Compatibility and
  here). Risks folded: the drafted item 3 and the Compatibility say "the host that serves the board may start a run
  from any machine of the operator's it runs on", not "any host of the estate", which OS-1 forbids (product); a run
  whose request's thread carries the asker's *adapted by* line observes that change and never makes it again,
  settling from what it observed, in OS-4, item 4 and the run's row, owed by Fabric's packet and the adapter, so the
  window narrows once they meet it, and the window is named until each consumer meets its debt by its date, not only
  the knowledge change's landing (product); the drafted item 3's `cancelled` line says a cancel the requester did not
  send means another session of its Project acted, so it submits nothing (product); Fabric's tests pinning the old
  accept wording, `board-dispatch-run.test.mjs:566` and `protocolObligations.test.ts:91`, named beside the `:281` and
  `:222` debts (seam); "(the receipt's own revision is the next one)" dropped from the draft and the Compatibility,
  since the contract does not define how a revision moves and the proof rests on `revision_conflict` alone (seam);
  OS-4's reply is a fenced `com.reply` (never refused `held`), in OS-4, item 4 and the run's row (unit); a settling
  call refused `lease_expired` is never retried, a lapsed lease not coming back, in OS-4, item 4 and the run's row
  (unit); OS-6 reads "only the first two are answered by what covers that exact choice", a source hand-over going
  ahead only on a decision, relayed or not, naming its exact target, never on a mandate (MD-6), in OS-6, item 6 and
  the run's row (unit). Declined: the shown-request cancel's reason naming the new request (product's first half),
  since a cancel comes before the new request exists and no reader sees a cancel's reason (`comms-cancel.schema.json`
  takes one; `comms-message.schema.json`'s request carries none), so the drafted line alone carries it; Fabric's home
  count (product) needs Fabric's CO-409 answer, already planned for SCN-025's Coverage.

- Round 13 (on `0dd3e829`), not clean: unit and product passed with risks, seam failed with one break. Seam, OS-5 had
  the host carry an earlier run's record of a begun effect's key to the next run while OS-1 lets that run start on any
  machine the host dispatches from, and only the count was one across machines; Fabric reads `prior` from a local
  `board-dispatches.json` (`index.ts:2998`) and on another machine opens a fresh workflow with no earlier key
  (`boardDispatchRun.ts:302-309`), so a run there for an `accepted` request would begin the effect under a new key
  (now OS-5 makes the host's record of the request's runs, the effect key and a human-step settlement among it, one
  across every machine it dispatches from, as the count is; the host's row says so; Fabric's shared-record debt, the
  Open list and the landing post name it). Chosen over restricting OS-1 to the machine holding the record, since OS-1
  and OS-5 already make the count, the run in flight and the switch one across machines. Risks folded: the request
  lifecycle says every operation of its table advances the request's revision and a hold does not, which grounds the
  drafted cancel proof, now cited in the draft and the Compatibility (seam); the drafted "When nobody answers" item 1
  gives its cancel `expectedRevision` and says an `accepted` request with effect `not_started` may carry a run's edits
  (seam); the drafted "The project board" item 3 says a session a host started does not retry a refused enrollment and
  ends, and accepts right after its claim (seam); Switchboard's `EXIT_CONTRACT` names no end for a refusal other than
  `not_authorized` and asks the operator even where SA-6 asks no one, not "never ends" (seam); the host's row cites
  *at once* as defined for OS-1 to OS-7 (unit); the run's row reads "writes nothing on the request's thread", as OS-3
  (unit); SA-6 and OS-4 call the host's next start the retry only where OS-5 allows one, and OS-5 says no start retries
  a refusal that is not `retryable`, the request waiting for the operator's act (unit); SCR-19 and SCN-025 offer "Open
  a session of the target Project" before cancel and submit again for an `accepted` request whose record holds a begun
  effect's key (product); Fabric's missing owner "Settle" (CT-41, DEC-0081) and its "nothing settles it" string and
  "answer the requester" next step named in its debts and the landing post (product). To the operator (Open): whether
  a hold of the target's Project or slot also stops the requester's own change (product); the draft says a hold stops
  board work and claims neither answer. Kept as is: the mixed-state window (product), already a merge condition with a
  dated post.
- Round 14 (on `231b1a92`), not clean: unit passed with risks, seam failed with one break, product failed with three.
  Breaks folded: OS-6 named no stop for an act a host's gate holds until a person agrees, so SCN-025's release under a
  mandate completed where Fabric's `floor.ask-first` (ADR-0160 section 4) holds a release to users (product); now OS-6
  names it, settles and notes it as a human step with no question and no resubmission (only a session with a person
  can take it, as at the production stop), OS-5 shows it, and SCN-025 and the run's row follow. The drafted "When
  nobody answers" item 3 put the hold check after the state list, so a requester cancelled a held `queued` request
  before reading that it waits, and an `expired` one under a hold fell to "make the change" (seam); a thread hold never
  shows as `held: true`, so the change landed under it (product); now the target is read in `com.directory` before
  every state line, a thread hold is found by a `held` refusal of a one-line intent post before the change, and the
  *adapted by* line a later thread hold refuses is posted once it lifts; the Compatibility restated. The CT-215 row and
  the handoffs index said "round 13 next" (product); now current. Risks folded: the siblings' DEC-0158 requirements and
  checks in Open, binding on the second lander (seam, product); a moved-off run's `accepted` request waits for the
  receiving session's transfer and is not shown meanwhile, said in SCR-32's confirmation and SCN-051 (product);
  CONTEXT's "(`fenced` aside)" (product); OS-4 exempts a refused stop note (unit); Fabric's "one run in flight" debt
  dropped to match OS-1 (unit); `comms-enroll.schema.json`'s run ending on every refusal branch (unit). Filed: the
  revision rule's host test, CT-281 (unit).
- Round 15 (on `b31b6889`), not clean: unit, seam and product each failed. Breaks folded: OS-6's never-resubmit
  covered the estate's production stop, which the operator's relayed words naming the step lift (agents-first item 8,
  Fabric's `board.read-at-start`, the adapter's `DISPATCH_CONTRACT`), against DEC-0156's OW-3 (seam, product); now
  never-resubmit holds only at a host's gate, an act a host refuses to a session with no person whatever is agreed
  (FA-09), and the production stop's note says the request is submitted again once it carries those words, in OS-6,
  item 6, the run's row, CONTEXT, SCN-025 and the drafted item 8, with the DEC-0156 landing requirement aligned in
  words. A production-stop or gate note refused under a thread hold gave two resubmit directives (unit); now the run
  asks its notice question at every stop once its note was refused, and a requester who finds no note may submit
  again, a later run meeting the same stop and writing the note. The drafted item 1 and the Compatibility promised
  that a resubmitted request's run "observes the folder first and finds them" (product); dropped, the edits named as
  possibly on another machine or folder and reconciled by the operator or the owner's next session. Risks folded:
  OS-4's exemption covers the `in_progress` branch (unit); the owner-settlement sentence and the run's row name nobody
  at a host's gate (unit); the gate grounded in FA-09's refusal, not the gate's agreement (seam, unit); a side act left
  at a stop after the asked act settles `completed` (product); the effect-key window in the drafted item 1 (product);
  SA-6's generation-0 decline winning over a run in SCN-025 and CT-276 (product); the drafted item 3's intent line
  withdrawn (seam: maybe inert on Fabric; product: never withdrawn); Fabric's W4-7 and the mixed state until it ships,
  and the host-gate stop as a debt of Switchboard's `EXIT_CONTRACT` and the adapter's `DISPATCH_CONTRACT`, in the
  Compatibility and the landing post (seam). To Open: whether Fabric refuses `held` under a thread hold at all, the
  requester's effect-key window under CT-175, SA-6's pre-emption under CT-276. Kept as is: the named mixed state and
  DEC-0159's operator-step greps (product).
- Round 16 (on `755023cf`), not clean: the unit reading failed with one break and three risks; the seam and product
  readings were deliberately not run on this head, since the break is a self-contradiction in the text they would
  read. Break folded: the resubmission rule contradicted itself on the refused-note path (unit): OS-6's unqualified
  "submitted again only where what the person does lets a later run with no person take the step, never by one who
  reads a host's gate note" forbade what its no-note sentence allowed (a requester resubmitting from a host's gate),
  and the refused-note question named the requester while carrying the gate note's "nobody submits the request to
  the board again". Now the "only where" sentence binds a request whose stop note is in its thread, the no-note path
  is its stated sole exception, and the refused-note question names one actor and one directive ("the requester
  decides, finding no note"), never a note's directive beside it; a request submitted again from a host's gate meets
  the same refusal in a later run, which settles it and writes the note; in OS-6
  (`docs/specification/project-comms.md`), DEC-0158 item 6 and the run's row in `docs/specification/conformance.md`,
  with OS-4's refused-note sentence aligned. Risks folded: FA-09 pinned in the Compatibility at Fabric's main
  `eafcf2e4` (`apps/desktop/src/main/policy.ts:324-347`, `apps/desktop/src/shared/containment.ts:1-22`, ADR-0160
  `:36-38`, the finding's row `docs/audit/2026-09-09-final/core-tasks.json:321`) (unit); SCN-025's `in_progress`
  hold uses OS-6's "do not submit it again" (unit); the run's row and SCR-19 say "one whose note was refused" and
  "a refused note", not a thread hold alone (unit).

## Next task

Round 17 blind readings (unit, seam, product) of branch `agent/ct215-on-demand-20261108` (DEC-0158), all three
tiers, read hardest at OS-6's resubmission rule (the "only where" sentence binding a request whose stop note is in its
thread, the no-note path its sole exception), the refused-note notice question's one actor and one directive, the
production stop (submitted again once the relayed words naming the step are carried) and a host's gate (FA-09, never
submitted again by a reader of the note), and the drafted items 1, 3 and 8 against agents-first.md and, on the merged
tree, DEC-0156's OW-3 (see Open on its notice-question and no-note judgements). At landing, also the sibling
requirements in Open (DEC-0156, DEC-0159, DEC-0157), whichever branch lands second. At landing:
DEC-0158 Accepted with its rounds, the amendment line and DEC-0022's annotation without "proposed", CT-215 done, the
North Star plan's wave 0 row, fabric-workspace `knowledge/agents-first.md` ("The project board" items 3 and 4, "When
nobody answers" items 1, 3, 4 and 5, "One approval binds all" item 8) landed with the merge as drafted above (a merge condition, not
a step after it), and a board post of the consumer debts to Fabric, Switchboard, the adapter, Observatory and the third
host, a date for each, naming the window from Fabric 0.3.16 until the knowledge change lands and each consumer meets its debt by its date.
