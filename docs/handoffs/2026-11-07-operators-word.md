# Handoff: the operator's word, carried out the first time (DEC-0156, CT-220)

## Objective

State, for every agent, that the operator's word about a task is carried out the first time by the agent itself
(backlog CT-220, due as a draft branch by 2026-11-08), in a neutral form for any owner, keeping every gate and limit the
contract already has.

## Done

- DEC-0156 reserved by git CAS on 2026-11-07 and drafted (Proposed) in `docs/DECISIONS.md`; next free `DEC-0160` at this writing (the CAS counter on origin after `origin/main` was merged in on 2026-11-08).
- [Governance and roles](../specification/governance-and-roles.md#the-operators-word-carried-out-the-first-time): OW-1
  (the word is the task), OW-2 (no command handed over), OW-3 (a risk is a reason to adjust, not to stop), OW-4 (only
  what needs the person), OW-5 (what stays), OW-6 (whose word).
- [Conformance](../specification/conformance.md#clients-and-readers): one row for every agent that takes its
  operator's words.
- SCN-057 in `docs/ux/scenarios.md` and its index row, mapped to SCR-30 in `docs/ux/screens.md`; SCN-044's update
  alt path and Coverage; SCN-012's step 1, alt path and recovery and SCN-014's recovery (the link command the
  agent's; a stopped receiver restarted by OC-17's supervisor and, if the status stays, by the agent on the operator's
  word, given to it or the session that runs it, a waiting decision answered on the dashboard, not in the bot's chat, a paid action or a
  spend approval only as OC-6 and spend policy rule 3 say; the
  webhook's removal waiting on OC-2's decision).
- [Operator channel](../specification/operator-channel.md) OC-11's step 3 (the agent enables and links on AP-2's
  relayed decision, the code shown to the person only (an agent with a dashboard has its link command print to its output only that a code was issued), the store read for the token at the agent's next start and when the person says it is stored, a new code issued on the person's ask when one expires unused and never because of a chat message; an old `accepted` renewed by one question, MD-1), DEC-0034's Annotated line and DEC-0150's (OW-6 keeps CA-8's bound); six status
  fixtures (`fixtures/positive/operator-channel-status-degraded*.json` three,
  `fixtures/negative/operator-channel-status-degraded-without-credential.json`,
  `-receiver-missing-lease-held.json`, `-receiver-missing-without-receiver.json`) whose `detail`, one sentence each as the schema describes it, says what happens for
  a stopped receiver and the person's step if it stays (asked of the agent or the session that runs it) and, for a set webhook, that its removal is the operator's decision, told to the agent
  or the session that runs it, never in the bot's chat, or taken in the channel settings.
- `docs/ux/foundation.md` (JRN-04/#2's touchpoint, ST-035), `docs/ux/flows.md` (FLW-29), `CONTEXT.md` (the operator's
  word), `docs/DOCMAP.md`, `docs/specification/README.md`, `docs/specification/channel-agent.md` (CA-8's pointer).
- Backlog CT-220 in progress; CT-266, CT-269, CT-271 and CT-273 filed.
- Consumers read before drafting: the adapter ships the rule (FAA-207, `v0.63.0`, citing CT-220); fabric-workspace
  `knowledge/agents-first.md` states it (`956afadf`); Fabric's session rules do not.

## Open

- The coordinator's blind readings (unit, seam, product) until two consecutive clean rounds; then the gate
  (`pnpm run check`), the pull request, the merge, the tag `v0.1.0+<date>.<n>` and a release.
- At merge: DEC-0156 Accepted, CT-220 done with the tag; tell the consumers on the board what each owes
  (DEC-0156's Compatibility): Fabric's session rules (OW-1 to OW-6) and its three FA-09 changes (the refusal's next line
  naming the remedy, a receipt for an act agreed in the chat, and an FA-09 refusal no longer offered as a grantable
  card in its attention queue or the OS notification that announces it, issuing no grant (nothing a later session
  could spend), its status line never reading "Allowed" for it, resolved when the agent records the act agreed in the
  chat), with `floor.ask-first`'s text for a
  session with no runner gate; the adapter's owed list (its citation, OW-3's waits and message form, OW-4's list, the
  floor line, its operator-channel references and evals, both skills' `references/source-and-instance.md` line 7);
  fabric-workspace's link and rewrite (the landing step below).
- Landing step for fabric-workspace (owner: its knowledge base; DEC-0156's Compatibility): in the same run as the
  merge, land the change to `knowledge/agents-first.md` (merged in fabric-workspace, not only opened) that links the OW
  rules, rewrites its stale CT-220 paragraph to
  them (OW-3's waits, its message form, its FA-09 reading, OW-4's list with a refusal never routed around) and fixes
  its refusals section's item 4.
- Landing step for Fabric question `add1df7c` (round 14): add to it the case of a board request whose relay names a
  floored act; DEC-0156 reads it as the reason the one ask quotes, not the agreement, so the act still goes to a session
  the person is in (OW-3, the Compatibility).
- Landing notes for the sibling decisions. Each states what the merged text must say once both branches are on `main`
  and a check run on the merged tree at landing; none states what a sibling branch says now, since the siblings move
  every round. Whichever of the two branches lands second makes the merged text say it. The branches: DEC-0157 on
  `agent/ct216-usage-data-v2`, DEC-0158 on `agent/ct215-on-demand-20261108`, DEC-0159 on `agent/ct218-local-cloud-v2`
  (re-read with `git ls-remote origin 'refs/heads/agent/ct2*'` at landing).
  - DEC-0157 (UD-4, a usage switch a person turned off): OW-1's exception covers UD-4's switch (its open list "an act
    no mandate covers" does) and names UD-4 there as an example of a change-policy effect; OW-5's limits name UD-4's
    switch (a mandate from the operator's words never turns a declined switch back on); UD-4 cites OW-1. Checks:
    `awk '/^- \*\*OW-1/,/^- \*\*OW-2/' docs/specification/governance-and-roles.md | grep -c UD-4` prints at least 1,
    `awk '/^- \*\*OW-5/,/^- \*\*OW-6/' docs/specification/governance-and-roles.md | grep -c UD-4` prints at least 1,
    and `grep -c OW-1 docs/specification/usage-data.md` prints at least 1.
  - DEC-0158 (OS-6, no person in a dispatched run): `docs/specification/conformance.md` keeps the board-client row in
    DEC-0158's form (with "a dispatched run follows its own row below (OS-4, OS-7)"), then the OW row, then DEC-0158's
    rows; OW-3's sentence for a session with no person in its chat and OS-6 cite each other, and the two name one
    settlement for a dispatched run: in a dispatched run, OW-3's no-person case is one of OS-6's stops and settles as
    OS-6 says. Checks:
    `grep -c 'a dispatched run follows its own row below (OS-4, OS-7)' docs/specification/conformance.md` prints 1,
    `grep -c "^| an agent that takes its operator's words" docs/specification/conformance.md` prints 1,
    `awk '/^- \*\*OW-3/,/^- \*\*OW-4/' docs/specification/governance-and-roles.md | grep -c OS-6` prints at least 1,
    `awk '/^- \*\*OW-3/,/^- \*\*OW-4/' docs/specification/governance-and-roles.md | grep -c 'settles as OS-6 says'`
    prints at least 1, and OS-6's paragraph names OW-3 and reads OW-3's no-person case as one of its stops (judgement,
    where OS-6 is defined).
  - DEC-0159 (CT-218, members' client keys): SCN-059 states the key split. Issuing and rotating a member's key are
    OW-4's secret step, from the operator's terminal or the page, so the value never enters an agent's transcript (CF-3);
    revoking is the agent's step on the operator's decision (OW-2), through the `relayed` twin where the instance checks
    `approval/1`, else by the agent running the agent's own CLI on the operator's computer (CF-4). SCN-059's sentence
    for a host that cannot show the page leaves revoking with the agent, and SCR-30's Scenarios do not list SCN-059. In
    SCN-044 the merged text keeps OW-3's "asks once whether to update" for `incompatible` and CT-218's cloud-instance alt
    path, with both Coverage citations. OW-4 names, as a human step's exact step, a command the person runs in their own
    terminal where an agent's run would put a secret in its transcript (CF-3), and CONTEXT's "hands the operator no
    command" takes that exception. Checks: judgement, each SCN-059 line naming the operator's terminal or CLI names
    issuing, rotating or the entry point, never revoking;
    `awk '/^### SCR-30/,/^### SCR-31/' docs/ux/screens.md | grep -c SCN-059` prints 0; `python3 docs/ux/lint.py` exits 0;
    `awk '/^- \*\*OW-4/,/^- \*\*OW-5/' docs/specification/governance-and-roles.md | grep -c 'own terminal'` prints at
    least 1 and the same over the same range for `CF-3` prints at least 1;
    `awk '/^\*\*Operator.s word, carried out the first time\*\*/,/^$/' CONTEXT.md | grep -c 'own terminal'` prints at
    least 1 (judgement: the entry's "no command" reads with that exception).
  - Register conflicts with any sibling (`docs/DECISIONS.md`, `docs/backlog.md`, `docs/handoffs/README.md`) are
    adjacent appends: the lander keeps both sides, in id order. Check: no conflict marker is left (`git grep -n '^<<<<<<<'`
    prints nothing) and `pnpm run check` exits 0 on the merged tree.
- Named risk carried to the closing verdict (round 15, product): in the no-person FA-09 case only Fabric's refused card
  and its OS notification reach the person, and the card's "Allow once" leaves the act undone; the person learns what
  is open only from the board reply and the report until Fabric ships the card change DEC-0156's Compatibility owes. The
  run continues around it (round 14 declined a further surface); at landing CT-220's row states `add1df7c`'s answer, or
  that it is still open.

## Decisions taken here

- OW-3's waits: the coordinator's reading of the operator's «если есть риски уточнить и корректировать и выполнить»
  against AP-2 and AP-3. The one message never stops the task; only a step whose corrected way is a `relayed` act the
  words do not name and the mandate does not cover, a step a limit of OW-5 gates other than a human step or a host's gate, or a step with no corrected way that
  both undoes cleanly and still meets the word waits for the answer. The third is the one stop the rule adds itself,
  grounded in AP-3 (an agent not sure the operator decided asks); the operator may overrule it.
- Fabric's `intake.spec-first` stands: it is the operator's own recorded decision (Fabric ADR-0176), and OW-3 lets such a
  decision govern (Fabric question `46167c9f` asked whether OW-3's added wait and this precedence stand). Fabric's
  `floor.ask-first` stays as the host's gate (the operator's instruction of 2026-10-15, its ADR-0160): the agent asks it
  once with the words as its reason; whether the words should pass it, and whether OW-3's statement form is the right
  reading of «уточнить», is Fabric question `add1df7c`.
- Round 13 simplified OW-3 instead of adding mechanics. The universal "exactly one question" claim is gone: the agent
  adds no question of its own about an act a host's gate already asks about (a risk on that step travels as that
  gate's one ask), and the asks other rules require for the same act stay and are named (spend policy rule 3's
  approval request, DEC-0149's stated word for a source hand-over, the host's own gate), so a source hand-over that is
  also floored takes two named asks. Under an FA-09 refusal in a session with no person in its chat, the agent asks
  nothing from that session and does not perform the act: it leaves the act open and names it, in its board reply and
  its report, as a step for a session the person is in, as Fabric's `board.read-at-start` already does for a
  production step; the `fabric_question_ask` route and the operator channel route are dropped, since a yes to either
  reached no live session.
- Round 19 gave every step that waits in a session with no person in its chat one place, the FA-09 case's: no
  question from that session, the step left open and named in the board reply and the report for a session the person
  is in, rather than `fabric_question_ask` (dropped in round 13 because a yes there reached no live session). A board
  request whose asked act is that open step is left in progress, never completed (SA-6), so its state does not read as
  done.
- OW-5 names the separation the operator keeps between unrelated businesses as recorded in the operator's own
  instructions, outside this contract: the contract has no specification of it (contexts, DEC-0082, are personal and
  organization contexts, not businesses).

## Checks actually run

- On `406489db`: `pnpm run docs:check` exit 0 (270 Markdown files, 0 markdownlint errors); `python3 docs/ux/lint.py`
  exit 0 (57 scenarios); no U+2014 in the added lines.
- Round 1 of the blind readings (on `406489db`), not clean on any tier: OW-6 read every board request, call and channel
  request as data (now scoped to OW-1's task, with SA-5, SA-6, MD-3, CA-8 and AP-3's exception); OW-1 left out the
  mandate handed on (MD-2) and the verbatim condition; OW-3 had no rule when no corrected way undoes cleanly, and no
  rule for an unanswered question or a rejecting answer; OW-4's "only" read as a limit on questions other rules require
  and left out a control with no agent twin, the choice to share without a comparison and the source hand-over's word;
  the conformance row called the adapter conformant; SCN-057 had no index row, no Coverage or Product line, and an
  example that deleted what Git cannot restore; DOCMAP had no row. Risks folded: the relation of the words to an effect
  outside a grant (OW-1), a step outside the mandate (OW-3), Fabric's `floor.ask-first` and `intake.spec-first` named in
  the Compatibility, `channel-agent.md`'s pointer to CT-220 now at OW-6. Left as risks for CT-266: whom "the operator"
  names for an organization's agent on its own placement (no glossary entry).

- Round 2 (on `2046eaa3`), not clean: unit (Decision item 4 lacked the hand-over word and the questions clause; OW-3's
  unanswered sentence read on taken steps too), seam (the Compatibility let Fabric's floor take words for spend above
  a limit and a hand-over; `intake.spec-first` contradicted; the adapter's owed list too short), product (SCN-057 and
  the row dropped "still meets the word"; ST-035, FLW-29 and SCR-30 not updated). All folded with the risks: OW-2's twin
  limited to gates `none` and `relayed`, OW-3's mandate cover, spend above a limit sent to OW-4, the bare refusal, the
  message stated as under way, OW-1's mandate past 24 hours, the harness refusal's person step, SCN-057's hand-over
  precondition and alt path, a CONTEXT entry, the README adoption cell, the Consequences list.

- Round 3 (on `96444327`): unit clean (seven risks); seam not clean (OW-3's clause on a decision that holds work also
  kept Fabric's `floor.ask-first`, against the Compatibility's debt: now limited to a decision recorded as the
  operator's own whose question the words do not answer, the floor's question being AP-2's; the adapter's behaviour
  eval was missing from its debts); product not clean (SCN-057's message gave no way to stop the corrected way, and its
  answers did not follow from it; FLW-29's goal and exit, and ST-035's story, covered one action only). All folded with
  the risks: spend above a limit kept out of OW-3's waits, spend with no policy yet (rule 3), the harness allow lifting
  only its stop, OW-1's mandate expiry, the private home's word stated by the agent, the spec-first alt path, the row's
  message form and open step, the exact step in CONTEXT and ST-035, the next free id. The operator was asked, without
  blocking, whether OW-3's added wait and the spec-first precedence stand (question `46167c9f`).

- Round 4 (on `d5422d6d`): unit clean (seven risks); seam not clean (the harness refusal's "own routes" read as a
  licence to route around it, against fabric-workspace's no-laundering rule: now never routed around; the floor reading
  conflicted with a mandate past 24 hours and rested on a question the operator was not asked: the floor now stays as
  the host's gate, asked once, and the question is put as `add1df7c`); product not clean (FLW-29 sent a bare "no" back
  to work and bypassed the service's gate: now split, with the gate edge, the spec-first node, the whole-task task
  analysis and rejected shape). Risks folded: the elicitation form of the hand-over word, "the agent hands each over",
  "other than a human step" in SCN-057, the question form in CONTEXT and ST-035, SCR-30's coverage, the trace to
  JRN-06/#4, SCN-044's update step as OW-4's, DOCMAP's wording, CT-220's row, the index row.

- Round 5 (on `62b2f71f`): unit not clean (Decision item 4 and OW-4 disagreed on a tool's refusal: now both say a
  refusal by the agent's own tool or harness is never routed around, with the person's step for each; SCN-044 called an
  update outside the task an OW-4 step: now asked once under AP-3 and done by the agent on a yes); seam not clean
  (Fabric's floor refuses every floored act for a session whose runner gate is removed, its FA-09, whatever is agreed:
  OW-3 now reads that refusal as no person's step, the agent doing the act itself on the words, as Fabric's own remedy
  says; the adapter's practices and eval and fabric-workspace's CT-220 bullet owe the never-routed-around exception;
  one owed list for the adapter, its service-action carve-out kept); product not clean (the floor not carried through
  OW-5, SCN-057's "only", FLW-29: now OW-5 names a host's gate, the gate is called again after the agreement, an
  unanswered gate step stays open, FLW-29 has the floor, done and return edges). Risks folded: the waits scoped to the
  step the message concerns, ST-035's trace, FLW-29's title, labels and punctuation, the handoff's paraphrase.


- Round 6 (on `30ebf5ae`): unit and seam clean, product not clean (DEC-0156's Consequences left out SCN-044's alt path
  this branch changes: now named, and SCN-044's Coverage cites OW-1 to OW-4). Risks folded: OW-4's "the agent's own tool
  or harness" is the runner's permission system or a tool that refuses the act itself, a host's gate being OW-3's, and
  taking the remedy FA-09's refusal names is not routing around it; "after its own routes" now applies only to a control
  with no twin and a step a route reaches, a human step and a refusal going over at once; OW-3's host gate is for an act
  the agent performs itself or through that host, a service's relayed action meeting that service's gate (the adapter's
  carve-out), and SCN-057 says the release is the agent's own act; Alternatives counts OW-3's waits beside the other
  rules'; SCN-044's update alt path covers no lifecycle owner and cites OW-3; FLW-29 has the floor's agreed and FA-09
  edges and the return edges, R1 excludes a human step; ST-035's JRN-06/#4 trace is its standing-grant part; CT-220's
  row names OW-4's at-once hand-over of a refusal and the questions at landing. OW-2 now states the operator's word of
  2026-11-07 that he presses nothing (board announcement `e6385b29`): no page to confirm, no card to choose, where a twin
  or a route of the agent's own reaches the step. The "Next free ID" line is rewritten from the counter at landing.

- Round 7 (on `3e5154b2`): unit clean; seam not clean (Fabric's FA-09 refusal also carries the fixed next line "The
  operator has been asked. Do the act only after asking again and being allowed.", which waits for an allowance that
  cannot come, so "Fabric owes nothing" was false: now Fabric owes that line for an FA-09 refusal, and OW-3 and SCN-057
  quote the remedy's two options, FLW-29 names the second, the agent taking the second because the mode is the operator's choice);
  product not clean (OC-11, SCN-012 and JRN-04 still had the operator run the agent's link command against OW-2: now the
  agent runs it once the operator answers `accepted`, restarts its receiver and handles the webhook on his word, with an
  Annotated line on DEC-0034). Risks folded: Decision item 5 lists the host's gate; OW-4 and item 4 name spend above
  `autoApproveUsd`; a host gate's one ask is the step's question; the conformance row's parenthetical sits by the
  harness refusal; FLW-29's relayed act and human gate return to the task; SCN-044's update question is for
  `incompatible` only; fabric-workspace owes OW-3's message form too; ADR-0160 section 4 cited for what it says; the
  spend hand-over's two forms filed as CT-269.
- On `3e5154b2` (round 7's readers): `pnpm run docs:check` exit 0, `python3 docs/ux/lint.py` exit 0 (57 scenarios), no
  U+2014 in the added lines.

- Round 8 (on `c6003c0f`): unit clean; seam not clean (DEC-0156's Source named a personal agent in this public
  repository, which `pnpm privacy:check` refuses: now the relay alone is cited); product not clean (SCN-012's alt path
  and SCN-014's recovery still gave the operator the link code and the receiver: now the agent's; CT-269 missing from
  Consequences: now named). Risks folded: OC-11's step 3 waits for the stored token and enables on the `accepted`
  answer as OC-1 allows; steps 1 and 4 are a binding only the person's own act proves, now in OW-4's list; OW-2's twin
  is one the agent may take under the words, a decision or a mandate in force, so OC-5's buttons for a question stay;
  OW-1's operator channel is a press or a reply (OC-5, OC-7); OW-4 names the exact step for a recorded decision, a
  source hand-over and a binding; "calls again" for the host gate in item 3, the row and FLW-29; the row drops "only";
  SCN-012's webhook is asked once (OC-2, OW-3); SCN-044's update always waits; the DEC-0034 annotation in date order;
  the adapter owes both references, both "Propose the operator channel" lines (creating-fabric-agents' Step 6,
  adapting-projects-to-fabric's section 8; named so since round 11) and both evals; Fabric owes `floor.ask-first`'s text for a
  session with no runner gate, and the default-mode case is named under `add1df7c`; fabric-workspace owes item 4 of its
  refusals section.

- Round 9 (on `43970fa6`, folded after `origin/main` was merged in): unit, seam and product not clean. Folded: six
  status fixtures still told the person to restart the receiver or remove the webhook (now each `detail` says what the
  agent does; each negative stays negative for its schema reason); SCN-012 and SCN-014 name one actor for the receiver
  (OC-17's supervisor, then the agent through its lifecycle owner), and SCN-012's webhook step waits on OC-2's decision
  (AP-2, AP-3); DEC-0140 PR-2's move of a slot is a control the contract reserves to the person's own act, handed over
  at once and kept by OW-5, and a route is one with the twin's checks and audit, never a write that skips the control;
  OW-3's FA-09 reading is replaced: the agent asks once in the chat and acts itself on the yes, recording the act and
  the words in its own report, so a floored act gets exactly one question in either mode (the operator's instruction
  of 2026-10-15, ADR-0160 section 4), the contract's reading until Fabric answers `add1df7c`, with Fabric owing a way
  to record such an act. Risks folded: OC-11's step 3 cites AP-2's relayed decision and renews an old `accepted` by one
  question (MD-1); ST-035, SCR-30 and FLW-29 name the exact step OW-4 names; FLW-29's risk edge is labelled and a
  declined floor leaves the step open; SCN-057's alt paths one per line; DEC-0156's Consequences name the fixtures and
  `docs/ux/foundation.md` once; CT-271 filed for the other scenarios' recoveries (SCN-009 and SCN-020 first);
  fabric-workspace's `knowledge/agents-first.md` an owed item with its owner and a landing step; providers of
  `fabric-operator-channel/0.1` adopt OC-11's step 3 through the adapter's kits.
- On the round-9 fold (working tree over the merge `bddb0005`): `pnpm run docs:check` exit 0 (271 Markdown files, 0
  markdownlint errors); `python3 docs/ux/lint.py` exit 0 (57 scenarios); `pnpm run privacy:check` 0 findings;
  `pnpm vitest run` over the twelve test files that read the operator channel's fixtures or the catalogue, 4610
  passed, 2 skipped; `pnpm run vectors:check`, 32 vector files match; no U+2014 in the added lines. The full gate
  (`pnpm run check`) was not run (machine load).

- Round 10 (on `e2808d2b`): product not clean (in Fabric's default mode its attention queue turns every FA-09 refusal
  into a red "refused" card with a grant button that changes nothing, FA-09 being checked before any grant, and nothing
  resolves it after the agent acts on the chat yes, so "exactly one question" was false: now Fabric owes a third FA-09
  change, the refusal no longer offered as a grantable card and resolved by the act agreed in the chat, and until then
  OW-3, Decision item 3, SCN-057's FA-09 alt path, FLW-29, SCR-30, CONTEXT and the conformance row say Fabric also shows
  that card, its grant does not change the refusal, and the agent's chat question is the one the operator answers, "one
  question from the agent"). Risks folded: SCN-057's step 2 offers "I will ask to delete it" and its recovery sends the
  deletion through the gate; CT-220's row states `add1df7c`'s answer or that it is open at landing; CT-271 scoped to
  where an agent carries the operator's task to that recovery; SCN-012's recovery cites OW-3 (a relayed act the words do
  not name, so that step waits) beside OC-2 and AP-2; OW-2 and the Source say "they press nothing"; the Compatibility
  names `board.read-at-start`'s production stop and `ladder.no-self-close` (Fabric main `eafcf2e4`) as host gates OW-3
  and OW-5 keep, OW-5 lists them, and notes beside `add1df7c` that Fabric's relay test (a scope naming the step) is
  narrower than a mandate handed on as MD-2 says; the conformance row's fabric-workspace clause carries the whole owed
  list and points at the landing step; the adapter owes both skills' `references/source-and-instance.md` line 7 read
  under OW-4.
- On the round-10 fold (working tree over `e2808d2b`): `pnpm run docs:check` exit 0 (271 Markdown files, 0
  markdownlint errors); `python3 docs/ux/lint.py` exit 0 (57 scenarios); `pnpm run privacy:check` 0 findings;
  `pnpm vitest run test/fixtures.test.ts test/operator-channel.test.ts test/consistency.test.ts`, 3 files, 1195 passed;
  no U+2014 in the added lines. The full gate (`pnpm run check`) was not run.

- Round 11 (on `d0eba655`): product not clean (Fabric's refused card button "Allow once", main `eafcf2e4`
  `renderer/src/launch/ObligationActs.tsx` lines 125 to 150 and `renderer/src/i18n/en.ts` lines 731 and 732, issues a
  one-hour grant that does not lift the FA-09 refusal, `main/policy.ts` lines 324 to 346, yet the card then reads
  "Allowed once, until {time}" and leaves the queue, a later grant of the same floor class and target resolving it,
  `shared/attention.ts` lines 184 and 222 to 240 and `main/index.ts` line 3582, while the act stays undone: now OW-3,
  Decision item 3, SCN-057's FA-09 alt path, SCR-30, FLW-29's FA node, CONTEXT and the conformance row say what pressing
  it does until Fabric's third change, the agent's chat question says the card does not allow the act ("Fabric refused
  publishing this project's release in this session; its "Allow once" card does not allow it here. You said "release
  it"; shall I publish it myself?"), the Compatibility reads "does not lift the refusal, yet shows Allowed once and
  removes the card" instead of "changes nothing", and Fabric's third owed change adds that the card's status line never
  reads "Allowed" for an FA-09 refusal); seam not clean (the Compatibility, the conformance row and this handoff's
  round-8 entry named "the step-6 lines" of both adapter skills, but adapting-projects-to-fabric's line is under its
  section 8, its step 6 being "Run independent checks", adapter main `2c0b1b18`: now both name creating-fabric-agents'
  Step 6 and adapting-projects-to-fabric's section 8, both "Propose the operator channel"). Risks folded: an FA-09
  refusal with no person in the session's chat (a board request session in the default mode) sends the one question to
  the operator channel's stop with buttons (OC-5) where linked, else leaves the step open and named (OW-3, Decision item
  3, the Compatibility, SCN-057's new alt path, SCR-30, FLW-29, the conformance row); "exactly one question" is scoped to
  acts other than spend above a limit, floored spend above `autoApproveUsd` having rule 3's approval request as its one
  ask, and CT-269's row adds that the floor reads that approval; the conformance row's OW-2 clause names a twin the
  agent may take itself under the words, a decision or a mandate in force; the handoffs README row reads rounds 1 to 11
  not clean, matching CT-220's row (round 11 folded, round 12 next); the Compatibility notes that `board.read-at-start`
  is advice the session keeps (mode `ADVICE`, `protocolObligations.ts` from line 197), not a refusal Fabric enforces.
  Kept: CT-220's row states `add1df7c`'s answer or that it is open at landing.
- On the round-11 fold (working tree over `d0eba655`): `pnpm run docs:check` exit 0 (271 Markdown files, 0
  markdownlint errors); `python3 docs/ux/lint.py` exit 0 (57 scenarios); `pnpm run privacy:check` 0 findings;
  `pnpm vitest run test/fixtures.test.ts test/operator-channel.test.ts test/consistency.test.ts`, 3 files, 1195 passed;
  no U+2014 in the added lines. The full gate (`pnpm run check`) was not run.

- Round 12 (on `71e7381a`): unit not clean (a risk on a step a host's gate holds was a question under OW-3's second
  wait case and then the gate asked again, two questions against "exactly one": now a host's gate is excluded from that
  case, and the risk message on such a step is carried as the gate's one ask, its reason naming the risk, the corrected
  way and the words, in OW-3, Decision item 3, the conformance row, SCR-30, a new SCN-057 alt path and FLW-29's new
  `R1 -> F1` edge); seam not clean (with no person in the session's chat the one question under an FA-09 refusal went
  to an operator channel Fabric does not implement: now it goes through the host's own question to the operator, on
  Fabric `fabric_question_ask` with a stable `about` and `commandId` as SA-6 and `board.read-at-start` already have a
  session ask, `main/agentSurface.ts` line 2641, falling back to the agent's operator channel stop only where linked
  and receiving, OC-5 and OC-17, OC-6's confirming press part of that one question); product not clean twice (an answer
  to that question does not lift `board.read-at-start`'s production stop, `protocolObligations.ts` from line 197: now
  OW-3, SCN-057, FLW-29 and a note beside question `add1df7c` say the FA-09 answer settles FA-09 only; and after the yes
  the refused card stays refused until 50 newer policy decisions push it out, `main/index.ts` line 3429, while a press
  of "Allow once" issues a single-use one-hour grant scoped to project, floor class and target with no action class,
  `main/index.ts` line 4192, which `main/policy.ts` `findGrantFor` lines 208 to 237 hands to any session of the project
  that keeps its runner gate: now OW-3, SCN-057, SCR-30, FLW-29's FA node and CONTEXT say both, the agent's report says
  so, and Fabric's third owed change adds that an FA-09 refusal issues no grant and that the card resolves when the
  agent records the act). Risks folded: "exactly one question" scoped to `floor.ask-first`'s acts, the other host gates
  met as their own text says; the notifier named as an OS notification announcing the card once when Fabric is not in
  front, with no button (`shared/notify.ts` `decideNotification`); the agent's question names the card by its label in
  the operator's interface language (Russian «Разрешить один раз», «Разрешено один раз, до {time}», under
  «заблокировано» or «Отказано», `renderer/src/i18n/ru.ts` lines 2419, 2423 to 2424 and 476); the six status fixtures'
  `detail` addresses the reader ("the agent asks you once, in its chat, ...", "nothing is asked of you"); the
  Compatibility cites `attention.ts` lines 257 to 274 and quotes the FA-09 packet's acceptance in Russian with its path
  and line (`docs/audit/2026-09-09-final/packets/FA-09.md` line 44). Kept: the mixed-state window as named; CT-220's row
  states `add1df7c`'s answer or that it is open at landing.
- On the round-12 fold (working tree over `71e7381a`): `pnpm run docs:check` exit 0 (271 Markdown files, 0
  markdownlint errors); `python3 docs/ux/lint.py` exit 0 (57 scenarios); `pnpm run privacy:check` 0 findings;
  `pnpm vitest run test/fixtures.test.ts test/operator-channel.test.ts test/consistency.test.ts
  test/positive-sweep.test.ts test/rule-tolerance.test.ts`, 5 files, 2413 passed; no U+2014 in the added lines. The
  full gate (`pnpm run check`) was not run.

- Round 13 (on `7f613eaa`): unit not clean (the universal "exactly one question" broke for a source hand-over that is
  also floored, which takes DEC-0149's word and the floor's ask: now OW-3, Decision item 3, the Compatibility, the
  conformance row, CONTEXT, SCN-057 and SCR-30 say the agent adds no question of its own about an act a host's gate
  already asks about, a risk on that step travelling as that gate's one ask, while the asks other rules require for
  the same act stay and are named (spend policy rule 3's approval request, DEC-0149's stated word, the host's own
  gate); SCN-057's private-home alt path shows the hand-over word and then the gate's ask as two named asks); product
  not clean (a yes to a `fabric_question_ask` or to an operator channel stop reached no live session: both routes are
  dropped, and under an FA-09 refusal in a session with no person in its chat the agent asks nothing from that session,
  does not perform the act and names it, in its board reply and its report, as a step for a session the person is in,
  as `board.read-at-start` already hands a production step to such a session, in OW-3, Decision item 3, the
  Compatibility, the row, SCN-057's no-person alt path, SCR-30 and FLW-29's FA node, the `about` and `commandId`
  wording, the SA-6 citation and the "settles FA-09 only" sentences removed as moot). Risks folded: SCN-057 step 2's
  message holds on any host ("say delete and I will delete it, asking first where the host requires it"); ST-035's
  acceptance criterion adds that an act a host's gate holds gets that gate's ask, quoting the words; the webhook-set
  fixtures' `detail` and SCN-012's recovery name a place that can receive (the session the operator gave the task in,
  not the bot's chat); the receiver-missing fixtures' `detail` reads "you hear from the agent only if it cannot bring
  it back", the unlinked one keeping the code step ("type the code once it is back; the agent shows a new one if it
  expires"); CONTEXT's scope matches; landing notes for DEC-0158's OS-6 and for SCN-044's overlap with CT-218 added
  under Open.
- On the round-13 fold (working tree over `7f613eaa`): `pnpm run docs:check` exit 0 (271 Markdown files, 0
  markdownlint errors); `python3 docs/ux/lint.py` exit 0 (57 scenarios); `pnpm run privacy:check` 0 findings;
  `pnpm vitest run test/fixtures.test.ts test/operator-channel.test.ts test/consistency.test.ts
  test/positive-sweep.test.ts test/rule-tolerance.test.ts`, 5 files, 2413 passed; no U+2014 in the added lines. The
  full gate (`pnpm run check`) was not run.

- Round 14 (on `7ac92ae8`, the same tree as `4a4d836e` after the squash onto `agent/ct220-operators-word-v2`): unit
  clean of breaks; product not clean (the webhook-set fixtures' `detail` sent the person to wait for a question "in
  the session you gave it the task in", which a channel linked the day before, with no task running, does not have,
  and dropped OC-2's own option of removing it: now the `detail` says removing it or switching the agent to it is the
  person's decision, taken in the agent's channel settings or told to the agent in any session with it, never in the
  bot's chat; each negative still fails for its original reason, `pnpm --silent validate` against the `origin/main`
  copy); seam not clean (the handoff and its README row named branches gone from origin: now
  `agent/ct220-operators-word-v2`, and `agent/ct218-local-cloud-v2` for CT-218 and DEC-0159, with DEC-0157's
  `agent/ct216-usage-data-v2` named). Risks folded: the receiver-missing `detail` names no route and implied the
  supervisor acts on a stuck but renewing loop (product, unit): now "the agent restarts its receiver through its
  supervisor or lifecycle owner", and where a decision waits it is answered on the agent's dashboard, since an answer
  sent to the bot may be lost after 24 hours (OC-17), the promise of contact dropped; SCN-012 and SCN-014 say the
  same. The no-person FA-09 case (product): OW-3, the row, Decision item 3, the Compatibility, SCN-057, FLW-29 and SCR-30
  say the board reply too says the card does not allow the act and what a press leaves, and "stays refused after the
  act" reads "stays refused, the act done or not". A relay naming a floored act on a board request (product): it lifts
  `board.read-at-start`'s production stop, not the floor; like the words in a session the person is in, it is the
  reason the one ask quotes, so the act still goes to a session the person is in, stated in OW-3, the row, Decision
  item 3, the Compatibility, SCN-057 and FLW-29, and added to `add1df7c`'s landing step. The conformance row's adapter
  owed list was shorter than the DEC's (seam): the row now points to the one list in DEC-0156's Compatibility instead
  of repeating it. OC-11 step 3 put the binding code in the session (seam): the code is shown to the person only, on
  the dashboard OC-3 names as its `open_link`, else only in the reply in the operator's session, never in a tool
  argument, a message, a file or an outward act, added to the adapter's owed list. SCN-044's update wait is grounded in
  OW-1's task scope and AP-3, and SCN-012's recovery quotes OW-3's first case in full (unit). Declined (product): a
  further surface for the no-person open step (a notice, or the operator as `board.read-at-start` allows); the
  decision already taken has the agent ask nothing from that session and name the act in its board reply and report
  for a session the person is in, a notice would be one more mechanic, and the card's press leaves the act undone, its
  grant risk owed to Fabric's third change.
- On the round-14 fold (working tree over `4a4d836e`): `pnpm run docs:check` exit 0 ("Documentation checks passed",
  271 Markdown files, 0 markdownlint errors); `python3 docs/ux/lint.py` exit 0 (57 scenarios); `pnpm run privacy:check`
  0 findings; `pnpm vitest run test/operator-channel.test.ts test/consistency.test.ts test/positive-sweep.test.ts
  test/channel-agent.test.ts test/fixtures.test.ts`, 5 files, 1780 passed; no U+2014 in the added lines; every
  `agent/ct2*` branch the handoff and its README row name resolves on origin. The full gate (`pnpm run check`) was not
  run.

At landing: DEC-0156 Accepted, CT-220 done with the tag and the answers to Fabric questions `46167c9f` and `add1df7c`
(or that they are open), the North Star plan's wave 0 item 4 marked done, the `Next free ID` line rewritten from the
counter, and the board told what each consumer owes (DEC-0156's Compatibility).

- Round 15 (on `33343a29`): unit and seam clean of breaks; product not clean. Breaks folded (product): the
  receiver-missing `detail` said "an answer sent here may be lost", read on the status tile or a doctor line (OC-9),
  never in the bot's chat: it now names the place ("not in the bot's chat, where it may be lost after 24 hours") and
  says "a waiting decision", so it holds when `pendingDecisions` is 0; and it promised without condition that "the
  agent restarts its receiver through its supervisor or lifecycle owner", a term no specification page defines, in a
  state that exists because no restart happened: the three fixtures and the unlinked one now read "A supervisor restarts
  a stopped receiver; if this stays, ask the agent in any session with it to restart it", then where to answer (299
  and 270 characters, the schema's bound 300); SCN-012, SCN-014, DEC-0156's Consequences and this handoff say the same,
  and "lifecycle owner" is gone from them. Each negative still fails for its original reason (`pnpm --silent validate`
  against the `origin/main` copy). Risks folded: the conformance row's "until Fabric's third owed change" (unit), which
  counted against the row's own owed list, now names the change by its content ("until Fabric stops offering an FA-09
  refusal as a grantable card"); OC-11 step 3 (unit) reads "past the `expiresAt` of the mandate" and "an outward
  message"; the link code in the session transcript (unit, seam): the dashboard's `open_link` is the path, the reply
  only for an agent without a dashboard, and the residual is stated as DEC-0147 states its share code's (one use, at
  most 10 minutes, the operator's own send of a spent code binding nothing, and the status's `binding.linkedAt` and
  `binding.allowedUsers` showing a binding the operator did not make; the schema carries counts only, never the bound
  user, so the text names those fields rather than "the bound user"); DEC-0034's Annotated line names both acts,
  enabling the channel and running the link command (product); DEC-0150 has an Annotated line that OW-6 now keeps
  CA-8's bound (seam); DEC-0158's landing note names the `conformance.md` row conflict (seam); the SCN-044 landing note
  says the key-issuing step must be named as the relayed twin or OW-4's secret step (product); a DEC-0157 UD-4 landing
  note for OW-1's 24-hour sentence (product); the fabric-workspace landing step and DEC-0156's Compatibility say "land"
  (merged in the same run), not "open" (product); the no-person FA-09 residual is a named risk above and in CT-220's
  row, with `add1df7c`'s answer stated there at landing (product). Declined: none.
- On the round-15 fold (working tree over `33343a29`): `pnpm run docs:check` exit 0 (271 Markdown files, 0
  markdownlint errors); `python3 docs/ux/lint.py` exit 0 (57 scenarios); `pnpm run privacy:check` 0 findings;
  `pnpm vitest run test/operator-channel.test.ts test/consistency.test.ts test/positive-sweep.test.ts
  test/channel-agent.test.ts test/fixtures.test.ts`, 5 files, 1780 passed; `pnpm --silent validate` on the four
  changed fixtures: the positives exit 0, the negatives exit 1 with the same reason as their `origin/main` copies
  (`/receiver/lease` must be "none"; missing "receiver"); no U+2014 in the added lines; `git merge-tree --write-tree
  HEAD origin/main` exit 0. The full gate (`pnpm run check`) was not run.
- Round 16 (on `1c9b90f6`): unit, seam and product not clean. Breaks folded: the four receiver-missing status
  fixtures (two positive, two negative) carried a three-sentence `reason.detail`, while the schema describes the field
  as "One sentence a person can read" (unit, seam); each `detail` is now one sentence joined by semicolons (299 and
  280 characters), the webhook ones stay one sentence (261), and a check over every
  `fixtures/*/operator-channel-status-*.json` finds no `detail` with more than one sentence or over 300 characters;
  each negative still fails for its original reason (`pnpm --silent validate` against the `origin/main` copy).
  OW-1's promise that a task outliving 24 hours is not asked again (product) was false for an act no mandate covers:
  OW-1 and DEC-0156 item 1 now except a change-policy effect (AP-5) and the move of a board slot (PR-2), whose word is
  renewed by one short question as AP-2 says; the conformance row does not restate the promise and is unchanged; the
  DEC-0157 landing note now adds only UD-4's switch as one more instance of that exception, carries DEC-0157's OW-5
  sentence too, and checks that both the OW-1 and the OW-5 bullet name UD-4. Risks folded: the link code's re-issue
  (product): OC-11 step 3 now says when a new code is issued (on expiry while the `accepted` holds, shown the same
  way, on the dashboard first, never because of a chat message), and the unlinked tile and SCN-012's alt path and
  recovery use that one trigger; the CT-218 landing note (seam, product) quotes CT-218 verbatim, homes the question in
  SCN-059 step 1 and its recovery and SCN-058 step 1's hand-over (issuing a member's key is OW-4's secret step, its
  value kept out of the agent's transcript; revoking or rotating one on the operator's word is the agent's step through
  DEC-0159's relayed twin), names the SCR-30 conflict with its resolution, and says the register conflicts are adjacent
  appends; OW-4's harness-refusal hand-over (product) now lets the person's step be a yes to a host tool the agent runs
  that installs the named rule, and SCN-057's alt path names a launcher that installs a rule the agent declares as the
  example; SCN-044's "lifecycle owner" (product) is now the supervisor the descriptor's `lifecycle.manager` names,
  with the agent's own tools where that is `person` or `none`; DEC-0150's Annotated line (unit, seam) is named in
  DEC-0156's Consequences and in Done; the webhook `detail` (unit) and SCN-012's tile sentence put the agent route
  first. Declined: posting the CT-218 item to that branch's handoff through the board (product); this fold edits only
  this branch, and the landing note binds whichever branch lands second, so the coordinator may relay it.
- On the round-16 fold (working tree over `1c9b90f6`): `pnpm run docs:check` exit 0 (271 Markdown files, 0
  markdownlint errors); `python3 docs/ux/lint.py` exit 0 (57 scenarios); `pnpm run privacy:check` 0 findings;
  `pnpm vitest run test/operator-channel.test.ts test/consistency.test.ts test/positive-sweep.test.ts
  test/channel-agent.test.ts test/fixtures.test.ts`, 5 files, 1780 passed; `pnpm --silent validate` on the six
  changed fixtures: the positives exit 0, the negatives exit 1 with the same reason as their `origin/main` copies
  (missing "credential"; `/receiver/lease` must be "none"; missing "receiver"); the one-sentence check over every
  operator-channel status fixture prints nothing; no U+2014 in the added lines; `git merge-tree --write-tree HEAD
  origin/main` exit 0. The full gate (`pnpm run check`) was not run.

- Round 17 (on `c9122a22`): unit, seam and product not clean. Breaks folded: OW-1's exception (unit) left out the
  source hand-over, one of the acts no mandate covers; rather than add a fourth item, OW-1 and DEC-0156 item 1 now
  word the exception as an open list ("except for an act no mandate covers (MD-3, MD-6 and PR-2: among them a
  change-policy effect, a source hand-over and the move of a board slot), whose word is renewed by one short question
  as AP-2 says"), so a later instance such as DEC-0157's UD-4 needs no edit to OW-1. The receiver-missing details
  (product) told the person to answer a waiting decision "in any session", which spend policy rule 3 and OC-6 never
  accept for a spend approval or a paid confirmation: the three details now say "answer decisions on its dashboard,
  not in the bot's chat" (OC-5: a press and the dashboard perform the same operation), each one sentence of at most
  270 characters (268) for headroom against the schema's 300; the unlinked detail (257) says "or ask it for a new one
  once this one expires", true with or without a dashboard and after the `accepted` lapses; SCN-014's recovery says
  the same and that a paid action or a spend approval is answered only as OC-6 and rule 3 say, never by a chat or
  session message (the surface is CT-269's); SCN-012's recovery and DEC-0156's Consequences and Done match. The CT-218
  landing note (seam) was stale: re-read at `05dc64ec`, `screens.md` auto-merges with SCR-30's Scenarios line "SCN-043,
  SCN-044, SCN-045, SCN-046, SCN-057" (SCN-059 is SCR-36's), and the note now says so and that the second lander maps
  SCN-059 to no other screen. The key split (seam) is now CT-218's, which CF-3 reads and the DEC-0159 fold states:
  issuing and rotating a member's key are OW-4's secret step from the operator's terminal or the page, the value never
  in an agent's transcript; revoking is the agent's step, through DEC-0159's `relayed` twin where the instance checks
  `approval/1`, else by the agent running the agent's own CLI on the operator's computer (CF-4's `issuer-unavailable`);
  its check now greps revoking lines for "own terminal" and "operator runs". Risks folded: OC-11 step 3 (unit) now
  states its two cases (a decision older than 24 hours, an answer under a mandate past its `expiresAt`); the
  conformance row (unit) carries the `add1df7c` parenthetical on its FA-09 clause and cites DEC-0156's Compatibility
  for the other host gates; OW-3's `floor.ask-first` branch (product) has the report, and a statement (not a question)
  in the chat when the person is in it, name where the gate asks (on Fabric the refused card, whose "Allow once" is the
  agreement there, unlike under FA-09), mirrored in DEC-0156 item 3, the conformance row, SCN-057's alt path and
  FLW-29's F1; the DEC-0158 landing note (seam) names its four `merge-tree` conflicts, the three register files as
  adjacent appends, re-read at `d54bd9de`; the DEC-0157 landing note (seam) names its two register conflicts and, since
  OW-1's list is now open, asks only for DEC-0157's OW-5 sentence and the OW-1 citation from UD-4, as CT-216's own note
  does (the request to change CT-216's note is no longer needed); fixture headroom (seam, product) as above. Declined:
  the unit tier's alternative of keeping the unlinked tile as a dashboard-only example (the softer wording holds in
  both cases at no cost); a new fixtures test that a negative carries only its catalogued keyword (seam's alternative):
  the 270-character headroom removes the near-limit cause, and the per-fixture `validate` run below is the check; the
  product tier's mixed-state risk (adapter `v0.63.0`, fabric-workspace `knowledge/agents-first.md`) stays the landing
  step already written in Open; relaying the CT-218 note to that branch's owner (product) is the coordinator's, and the
  DEC-0159 fold states the same split.

- On the round-17 fold (working tree over `c9122a22`): `pnpm run docs:check` exit 0 (271 Markdown files, 0
  markdownlint errors); `python3 docs/ux/lint.py` exit 0 (57 scenarios); `pnpm run privacy:check` 0 findings;
  `pnpm vitest run test/operator-channel.test.ts test/consistency.test.ts test/positive-sweep.test.ts
  test/channel-agent.test.ts test/fixtures.test.ts`, 5 files, 1780 passed; `pnpm --silent validate` on the four
  changed fixtures and the two webhook ones: the positives exit 0, each negative prints one error, the same as its
  `origin/main` copy (missing "credential"; `/receiver/lease` must be "none"; missing "receiver"); every operator-channel
  status fixture `detail` is one sentence of at most 270 characters (longest 268); no U+2014 in the added lines;
  `git merge-tree --write-tree HEAD origin/main` exit 0. The full gate (`pnpm run check`) was not run.

- Round 18 (on `2ee57c36`): unit clean of breaks; seam and product not clean. Both breaks were in the landing notes
  about sibling branches, which drifted because the siblings move every round: the DEC-0157 note (seam) said OW-1 needs
  no change while DEC-0157's own note had come to ask OW-1 to name UD-4, and the DEC-0159 note's grep (product) flagged
  correct lines and missed the no-page sentence that leaves revoking with the operator. Rather than re-read the
  siblings again, the notes were simplified: they no longer state what a sibling branch or its handoff says, nor any
  sibling line number or head hash; each states what the merged text must say once both branches are on `main` and a
  check run on the merged tree at landing (OW-1 names UD-4 as an example and OW-5 names its switch, UD-4 cites OW-1;
  `conformance.md` keeps the board-client row in DEC-0158's form, then the OW row and DEC-0158's rows, OW-3 and OS-6
  cite each other; SCN-059 states the key split, its no-page sentence leaves revoking with the agent, SCR-30 does not
  list SCN-059; register conflicts are adjacent appends kept in id order). Risks folded: OW-4 no longer calls a control
  with no twin "AP-1's exception" (only PR-2's move is), now "a service that has not shipped its twin, which AP-1 makes
  nonconformant" (unit); OW-1 and DEC-0156 item 1 cite source's Handing over for a source hand-over's word, consumed
  once by its act (unit); OC-11 step 3 says the link command prints to the agent's own output only that a code was
  issued, never the code, so "shown to the person only" holds on the dashboard path (unit), that the agent reads the
  store at its next start and when told the token is stored (product), and that a new code is issued on the person's
  ask (unit, product), mirrored in DEC-0156's Consequences and Done; SCN-057's Preconditions and Expected result name
  the host-gate case (product); CT-269 now asks whether the agent's dashboard takes a rule-3 approval, with the
  `receiver-missing` tile following the answer (product); OW-3's no-person sentence, DEC-0156 item 3, the conformance
  row, FLW-29's F1 and SCN-057's alt path say how such a session settles the board request (a `com.progress` note naming
  the open act and its blocker, SA-5; completed with the act named in its result, or left in progress, as the rest of
  the work allows, SA-6) (product); the six status details name "the agent, or the session that runs it" for a service
  agent with no chat of its own, each one sentence of at most 270 characters, mirrored in SCN-012, SCN-014 and
  DEC-0156's Consequences (product); the restatement of OW-3's waits under Decisions taken here keeps "or a host's
  gate" (seam). Declined: none.

- Round 19 (on `0f0a3f5f`): unit and seam clean of breaks; product not clean. Break folded (product): SCN-012's alt
  path had the agent issue a new link code unasked when one expires; it now says the operator asks the agent, or the
  session that runs it, for one, and the agent shows it on its dashboard (in its reply when it has none), never because
  of a chat message (OC-3, OC-11 step 3; OW-2), as its recovery and OC-11 say. Risks folded: OW-3 named a place only for
  the FA-09 wait in a session with no person (product): its last sentence now gives every step that waits there (the
  three waits, a host's gate, the FA-09 case) the FA-09 case's one place, and a request whose asked act is the open one
  is left in progress, never completed (SA-6), in OW-3, DEC-0156 item 3, the conformance row and SCN-057 (product);
  the DEC-0158 landing note requires that OW-3 and OS-6 name one settlement for a dispatched run (OW-3's no-person case
  is one of OS-6's stops and settles as OS-6 says), with a merged-tree grep for 'settles as OS-6 says' (seam); the
  DEC-0159 landing note requires that OW-4 name, as a human step's exact step, a command the person runs in their own
  terminal where an agent's run would put a secret in its transcript (CF-3), and that CONTEXT's "hands the operator no
  command" take that exception, with merged-tree greps over OW-4 and the CONTEXT entry (product); OC-11 step 3 scopes
  "prints only that a code was issued" to an agent with a dashboard, mirrored in DEC-0156's Consequences and Done
  (unit); the transcript code is "a residual like DEC-0147's share code, without its comparison code", and the route to
  remove a binding the operator did not make, which no OC rule names, is CT-273 (unit); the three receiver-missing
  details read "14 updates wait" and "an answer sent in the bot's chat may be lost after 24 hours" (286 characters,
  one sentence each), mirrored in DEC-0156's Consequences (unit, product); CT-271's row adds the trace gap (ST-035
  traces to JTBD-07 and JRN-06/#4; no stage or job covers giving a task and reading its report) (product). Left as
  owed, no edit: the spend approval while the receiver is missing stays with CT-269 (the tile says "answer decisions on
  its dashboard" and promises no spend approval there); fabric-workspace's `knowledge/agents-first.md` and the
  consumers' mixed state are the landing steps and the Compatibility already owe (product). Declined: none.
- On the round-19 fold (working tree over `0f0a3f5f`): `pnpm run docs:check` exit 0 (271 Markdown files, 0
  markdownlint errors); `python3 docs/ux/lint.py` exit 0 (57 scenarios); `pnpm run privacy:check` 0 findings;
  `pnpm --silent validate` exits 0 on the three changed positive fixtures and 1 on the three negatives, each for its
  original single reason; `pnpm vitest run test/operator-channel.test.ts test/fixtures.test.ts
  test/consistency.test.ts`, 3 files, 1195 passed; no U+2014 in the added lines; `git merge-tree --write-tree HEAD
  origin/main` clean. The full gate (`pnpm run check`) was not run.

## Next task

Round 20 of the blind readings of branch `agent/ct220-operators-word-v2` (DEC-0156), all three tiers.
