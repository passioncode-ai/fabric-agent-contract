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

## Decisions taken here

- The request's states are not extended: a dead run's request keeps the state the extension gives it, and the next run
  or the owner settles it through existing operations (DEC-0158 Alternatives (a)).
- A run never waits at a human step, another job's `input_required`, or a source hand-over without an exact decision:
  it names the step in the thread and settles `failed_known` (`observed: false` before an effect began; after one,
  only once it observed no effect) or leaves the request `in_progress` for the next holder (OS-6).
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
  effect only once no effect is observed, at `references/on-demand-session.md:147` and `:191`); Observatory's kept
  reference form for an effect's key (its checkpoint redaction would destroy the key today).
- A landing step: fabric-workspace `knowledge/agents-first.md`, "When nobody answers" items 3 and 5 restated (a
  requester leaves a request to a host that dispatches; a session the host starts is built) and "One approval binds
  all" item 8's production stop kept with OS-6's settlement beside it. Its check: the knowledge base's own gate on that
  change, then a reading of the merged items against OS-1, OS-5 and OS-6.

## Checks run

- On the tree of the round-3 commit (parent `44feaab7`): `pnpm run docs:check` exit 0 ("Documentation checks passed",
  lint:md 271 files, 0 errors); `python3 docs/ux/lint.py` exit 0 (40 stories, 34 flows, 34 screens, 56 scenarios);
  `pnpm run privacy:check` exit 0; `pnpm vectors:check` exit 0 (32 vector files match their generators);
  `pnpm vitest run test/mandate.test.ts` exit 0 (81 tests); `git diff origin/main...HEAD | grep '^+' | grep -c` of
  U+2014 printed 0. The full `pnpm run check` was not run in this round.

- On `7bd5253d`: `pnpm run docs:check` exit 0 ("Documentation checks passed", lint:md 270 files, 0 errors);
  `python3 docs/ux/lint.py` exit 0 (40 stories, 34 flows, 34 screens, 56 scenarios); no U+2014 in the added lines
  (reproduced by round 1's readers).

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

## Next task

Round 4 of the blind readings of branch `agent/ct215-on-demand-20261108` (DEC-0158), all three tiers. At landing:
DEC-0158 Accepted with its rounds, the amendment line and DEC-0022's annotation without "proposed", CT-215 done, the
North Star plan's wave 0 row, fabric-workspace `knowledge/agents-first.md` items 3, 5 and 8, and a board post of the
consumer debts to Fabric, Switchboard, the adapter and Observatory.
