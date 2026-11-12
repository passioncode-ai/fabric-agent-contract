# Handoff: the operator's word, carried out the first time (DEC-0156, CT-220)

## Objective

State, for every agent, that the operator's word about a task is carried out the first time by the agent itself
(backlog CT-220, due as a draft branch by 2026-11-08), in a neutral form for any owner, keeping every gate and limit the
contract already has.

## Done

- DEC-0156 reserved by git CAS on 2026-11-07 and drafted (Proposed) in `docs/DECISIONS.md`; next free `DEC-0162` (the CAS counter on origin, `refs/agent-sync/ids/DEC` reading next 162 since 2026-11-08T11:39Z, DEC-0157 to DEC-0161 reserved by sibling branches).
- [Governance and roles](../specification/governance-and-roles.md#the-operators-word-carried-out-the-first-time): OW-1
  (the word is the task), OW-2 (no command handed over), OW-3 (a risk is a reason to adjust, not to stop), OW-4 (only
  what needs the person), OW-5 (what stays), OW-6 (whose word).
- [Conformance](../specification/conformance.md#clients-and-readers): one row for every agent that takes its
  operator's words.
- SCN-057 in `docs/ux/scenarios.md` and its index row, mapped to SCR-30 in `docs/ux/screens.md`; SCN-044's update
  alt path and Coverage; SCN-012's step 1, alt path and recovery and SCN-014's recovery (the link command the
  agent's; a stopped receiver restarted by OC-17's supervisor and, if the status stays, by the agent on the operator's
  word, given to it or the coding session it runs in, a waiting decision answered by telling the agent or on the dashboard, not in the bot's chat; spend
  above a project's `autoApproveUsd` only through spend policy rule 3's approval request, never a chat or session
  message (CT-291), and a paid action within a limit as AP-1's `relayed` class, on the dashboard or by telling the
  agent as AP-2 says, in the bot's chat only with OC-6's presses once the receiver is back; the
  webhook's removal waiting on OC-2's decision).
- [Operator channel](../specification/operator-channel.md) OC-11's step 2 (the typed token handed over as AP-4's `secret` step or the host's secret prompt, SCN-053, never a command) and step 3 (the agent enables and links on AP-2's
  relayed decision, the code shown to the person only (an agent with a dashboard has its link command print to its output only that a code was issued), the store read for the token at the agent's next start and when the person says it is stored, a new code issued on the person's ask when one expires unused and never because of a chat message; an old `accepted` renewed by one question, MD-1), DEC-0034's Annotated line and DEC-0150's (OW-6 keeps CA-8's bound); six status
  fixtures (`fixtures/positive/operator-channel-status-degraded*.json` three,
  `fixtures/negative/operator-channel-status-degraded-without-credential.json`,
  `-receiver-missing-lease-held.json`, `-receiver-missing-without-receiver.json`) whose `detail`, one sentence each as the schema describes it and within about 280 characters, says what happens for
  a stopped receiver and the person's step if it stays (asked of the agent; in the unlinked example, or the coding session it runs in), where decisions
  other than a spend approval are answered (on the dashboard or by telling the agent, never in the bot's chat; a spend approval offered no chat or
  session route, spend policy rule 3) and, for a set webhook, that its removal is the operator's decision, told to the agent
  or the coding session it runs in, never in the bot's chat, or taken in the channel settings.
- `docs/ux/foundation.md` (JRN-04/#2's touchpoint, ST-035), `docs/ux/flows.md` (FLW-29), `CONTEXT.md` (the operator's
  word), `docs/DOCMAP.md`, `docs/specification/README.md`, `docs/specification/channel-agent.md` (CA-8's pointer).
- Backlog CT-220 in progress; CT-266, CT-291, CT-271, CT-273, CT-278 and CT-282 filed. The operator channel's Status table:
  its `off` row names an `accepted` answer waiting for the token (`credential.present: false` or no `credential`
  member), and the tile names that step (or, with no `credential` member, the step without a name, which the agent
  states) and says to tell the agent, or the coding session it runs in, once it is stored; with the token present no
  person step is left, the agent enabling the channel on its own status read (OC-11 step 3); pinned by the positive fixture
  `fixtures/positive/operator-channel-status-off-awaiting-token.json` and its catalogue row; OC-17 says a product's own
  `reason.detail` stays within 300 characters in every locale it ships.
- Consumers read before drafting: the adapter ships the rule (FAA-207, `v0.63.0`, citing CT-220); fabric-workspace
  `knowledge/agents-first.md` states it (`956afadf`); Fabric's session rules do not.

## Open

- The coordinator's blind readings (unit, seam, product) until two consecutive clean rounds; then the gate
  (`pnpm run check`), the pull request, the merge, the tag `v0.1.0+<date>.<n>` and a release.
- At merge also (round 25, seam and product): CT-287's DEC-0156 clause restated as landed (the PR and merge commit, no
  longer `bb5b79ab`); the Annotated lines on DEC-0034, DEC-0035, DEC-0126 and DEC-0150 restated without "(proposed)" and
  with the merge date; CT-220's row states the operator's decision of 2026-11-09 (headless places) beside question
  `46167c9f`'s answer.
- At merge: DEC-0156 Accepted, CT-220 done with the tag; tell the consumers on the board what each owes
  (DEC-0156's Compatibility): Fabric's session rules (OW-1 to OW-6) and its three FA-09 changes (the refusal's next line
  naming the remedy, a receipt for an act agreed in the chat, and an FA-09 refusal no longer offered as a grantable
  card in its attention queue or the OS notification that announces it, issuing no grant (nothing a later session
  could spend), its status line never reading "Allowed" for it, resolved when the agent records the act agreed in the
  chat, never showing the grant note Fabric `5676cd88` added to a grantable refusal), with `floor.ask-first`'s text for a
  session with no runner gate; the adapter's owed list (its citation, OW-3's waits and message form, the no-person
  question route in working-with-fabric `references/on-demand-session.md`, OW-4's list, the
  floor line, its operator-channel references and evals, both skills' `references/source-and-instance.md` line 7);
  fabric-workspace's link and rewrite (the landing step below).
- Landing step for fabric-workspace (owner: its knowledge base; DEC-0156's Compatibility): in the same run as the
  merge, land the change to `knowledge/agents-first.md` (merged in fabric-workspace, not only opened) that links the OW
  rules, rewrites its stale CT-220 paragraph to
  them (OW-3's waits, its message form, its FA-09 reading, OW-4's list with a refusal never routed around), fixes
  its refusals section's item 4, and makes its "One approval binds all" items 1 and 5 call the host's gate's one ask (Fabric's
  `floor.ask-first`, quoting the relayed words as its reason) Fabric's current behaviour pending CT-250's decision and
  Fabric's answer to question `add1df7c`, citing the operator's decision of 2026-11-06, not a rule (round 24, product; OA-4 carries the same pointer to OW-3 and OW-5 here).
- Landing step for Fabric question `add1df7c` (round 14): add to it the case of a board request whose relay names a
  floored act; DEC-0156 reads it as the reason the one ask quotes, not the agreement, so the act still goes to a session
  the person is in (OW-3, the Compatibility); and add the operator's word of 2026-11-07 that they press nothing
  (announcement `e6385b29`), set against the one press DEC-0156 keeps, a host gate's agreement (Fabric's "Allow once"
  under `floor.ask-first`, OW-2 and OW-3), so the answer says whether that press stays. Add the operator's decisions of 2026-10-26
  (no second approval) and 2026-11-06 (a level holder's command runs without a host's prompt, `knowledge/authority.md`,
  *Access levels*) and of 2026-11-07 (agents run without permission prompts, questions and bounds settled when the
  task is set, the same page, round 28, product): the question is how Fabric's floor carries them, not whether the
  operator wants a second ask, and whether the FA-09 chat question stays under the 2026-11-07 decision. Add the
  operator's word of 2026-11-12, which Fabric carries as `QUESTIONS_RULE` (`9420da79`): OW-3 now asks its three
  waits that way in a session with no person, and the question is whether a floored act's agreement may come the same
  way (round 29, seam), and that §3.10's sentence "the answer lands in the asking project's thread ... which starts
  its next run" holds for the `people.ask` route only (Fabric is asked for the correction or the wake), and that a run on
  another machine posts only an answered result, so a blocked one's open step is lost (round 31, product and seam). Add that Fabric's `answer_question` wakes nobody and an ended session's continuation reads
  `needs_restart`, so an answer through `fabric_question_ask` from a board-started run starts no run; OW-3 has the
  request submitted again on it only on the operator's word relayed to the requester (or by the owner's own session), that a run on another machine writes `answered` with
  the open step and its resubmission because a `blocked` result posts nothing and counts as an empty run, the third of which hands the request to the operator (round 32, seam; three runs in all, round 33, seam), and that the next run after a PM agent's non-operator answer asks the operator directly, not again through `people.ask` (round 32). Ask Fabric to start the asking project's next run on an answered question (round 30, seam and product), and to show a `failed_known` request whose reply names an open step as waiting on the operator and keep it in «Ждут ответа» (round 33, product), and add that no project offers `people.ask` yet (CO-569).
- DEC-0158's re-cut (its round 20, 2026-11-12): that branch's OS-6 and this branch's OW-3 state opposite rules for a
  no-person run's notice question at a refused note and for the no-note resubmission at a host's gate (DEC-0158 round
  20, seam). DEC-0158's OS-6 and OS-7 are to be re-cut as one table of stops; the two are reconciled (round 26, seam): OW-3's session holds
  the request (SA-6's `com.accept`), so its `com.reply` carries the fence, which no hold refuses, and it never meets a
  refused note; the refused-note notice question and the no-note `failed_known` exception at a host's gate are DEC-0158's
  dispatched run's alone. If this branch lands first, OW-3 stands as written until DEC-0158's re-cut lands; that DEC
  then makes OW-3's no-person case cite the table, keeping the settlement and the resubmitter split the DEC-0158 note
  below names. The note's OW-3-range and OS-6-range greps apply while OS-6 is a bullet; once the table lands, its checks
  are: the OW-3 range with `grep -c OS-6` prints at least 1, the table's host's-gate and production-stop rows name
  `failed_known` with `observed: false` and the resubmitter split, the table's rows for a decision outside the mandate
  and a source hand-over name OW-3's question route (the DEC-0158 note's table-form checks), and DEC-0158's DEC amends
  OW-3 to cite the table, saying which of OW-3's text stays (the settlement, the resubmitter split, the question route)
  and which moves; every bullet-form grep of the DEC-0158 note has a table-form counterpart (judgement, round 32, seam).
- Landing note for CT-285's decision (round 25, product and seam): binding on whichever of DEC-0156 and CT-285's DEC
  lands second: CT-285's DEC amends OW-3's no-person case and OW-3's own stop for a headless place (the operator's
  decision of 2026-11-09, fabric-workspace `knowledge/authority.md`, *Autonomy by place*), and OW-3 cites it, with the three places that restate OW-3's no-person case: the OW conformance row
  (`docs/specification/conformance.md`), SCN-057's no-person alt path and FLW-29; and wherever a profile covers the
  effect (the headless default or a person place's recorded profile, AU-4), OW-2's kept press and OW-3's host's-gate
  and FA-09 branches, with the four statements of the amended OA-4 that a host's gate still asks once
  (`docs/specification/delegation.md` OA-4, CONTEXT's *Relayed approval*, SCN-046, the relay receiver's conformance
  row). Main's CT-285 row reads DEC-0158's OS-6 as "never resubmitted" at the production stop; the split both branches
  agreed resubmits there once the relayed words name the step, and CT-285's DEC restates it so (round 27, seam); after
  that DEC, `grep '^| CT-285 ' docs/backlog.md | grep -c 'production stop and a host.s gate, never resubmitted'`
  prints 0 (round 33, seam). Checks,
  on the merged tree after CT-285's DEC (each fails today, round 30, seam): `awk '/^- \*\*OW-3/,/^- \*\*OW-4/'
  docs/specification/governance-and-roles.md | grep -c 'until it lands they hold as written'` prints 0;
  `awk '/^### SCN-057/,/^### SCN-058/' docs/ux/scenarios.md | grep -c 'until it lands, as here'` prints 0;
  `grep "^| an agent that takes its operator" docs/specification/conformance.md | grep -c CT-285` and
  `awk '/^### FLW-29/,/^### FLW-30/' docs/ux/flows.md | grep -c CT-285` each print at least 1, as do
  `awk '/^- \*\*OW-2/,/^- \*\*OW-3/' docs/specification/governance-and-roles.md | grep -c CT-285` and
  `awk '/^- \*\*OA-4/,/^- \*\*OA-5/' docs/specification/delegation.md | grep -c CT-285` (round 31, seam), and
  `awk '/^\*\*Relayed approval\*\*/,/^$/' CONTEXT.md | grep -c CT-285`, `awk '/^### SCN-046/,/^### SCN-047/'
  docs/ux/scenarios.md | grep -c CT-285` and `grep '^| an agent receiving a relay' docs/specification/conformance.md |
  grep -c CT-285` (round 32, seam); until that DEC lands,
  `grep '^| CT-285' docs/backlog.md | grep -c 'OW-3'` prints 1 (main's CT-285 row carries it since 2026-11-12).
- Landing note for CT-292's decision (rounds 28 and 29, seam and product): binding on whichever of DEC-0156 and
  CT-292's DEC lands second. TC-3 calls an unsettled task context a step that waits (OW-3), and TC-4 has a session with
  no person ask it through the host's question surface (`fabric_question_ask`); since round 29 OW-3's no-person case
  asks its three waits by the operator's word of 2026-11-12, which Fabric carries as `QUESTIONS_RULE` (`9420da79`), through the
  organization's PM agent (`people.ask`) or the host's question surface, so the two agree on the route. One difference
  stays: the `people.ask` route is a board request, and TC-6 keeps the candidate organizations out of every board
  thread, so CT-292's DEC makes OW-3 send the context question only through the host's question surface (the board
  reply naming the open step, never the candidates), and says how the answer reaches the run that acts (TC-5's record
  and the run that acts: through the host's question surface the answer starts no run today, round 30); OW-3 cites CT-292; FLW-29 and the OW conformance row follow. Checks: `grep '^| CT-292' docs/backlog.md | grep -c
  'OW-3'` prints 1 on the merged tree (main's row carries it since 2026-11-12); after that DEC,
  `awk '/^- \*\*OW-3/,/^- \*\*OW-4/' docs/specification/governance-and-roles.md | grep -c 'CT-292'` prints at least 1,
  and `grep '^| an agent that takes its operator' docs/specification/conformance.md | grep -c CT-292` and
  `awk '/^### FLW-29/,/^### FLW-30/' docs/ux/flows.md | grep -c CT-292` each print at least 1 (round 31, seam).
- Landing note for CT-293's decision (round 28, seam and product): binding on whichever of DEC-0156 and CT-293's DEC
  lands second. CT-293 (an order carries the access it needs, the operator's standing rule of 2026-11-10) has the
  decision for an act also cover issuing a grant narrowed to that act; CT-293's DEC amends OW-3's second wait (a step
  "an effect outside a grant" gates) and OW-5's kept "effect outside a grant" to except that narrow grant, while a wider
  grant still waits, and OW-1's "within the grants ... that already apply" cites it. Checks, on the merged tree:
  `grep '^| CT-293' docs/backlog.md | grep -c 'OW-5'` prints 1 (main's row carries it since 2026-11-12); after that DEC,
  `awk '/^- \*\*OW-5/,/^- \*\*OW-6/' docs/specification/governance-and-roles.md | grep -c 'CT-293'` prints at least 1,
  as do the OW-3 and OW-1 ranges with `grep -c 'CT-293'` (`awk '/^- \*\*OW-3/,/^- \*\*OW-4/'` and
  `awk '/^- \*\*OW-1/,/^- \*\*OW-2/'`, round 32, seam).
- Landing note for CT-250's decision (round 26, seam and product): binding on whichever of DEC-0156 and CT-250's DEC
  lands second: CT-250's DEC states how a level holder's words read under OW-1 and OW-6 (the operator's decision of
  2026-11-06, fabric-workspace `knowledge/authority.md`, *Access levels*: an administrator's command binds every agent),
  CT-266 is decided with it, and OW-6 cites it; CT-250's DEC also states whether a level holder's command or relay
  passes a host's gate's ask, amending OW-2's kept press, OW-3, OW-5 and OA-4's pointer (round 27, product). Checks, on the merged tree: `grep '^| CT-250' docs/backlog.md | grep -c
  'OW-6'` prints 1 until that DEC lands (main's row carries it since 2026-11-12); `grep '^| CT-266' docs/backlog.md |
  grep -c CT-250` prints 1; after that DEC (each prints 0 today, round 30, seam): `awk '/^- \*\*OW-6/,/^## Semantic
  rules/' docs/specification/governance-and-roles.md | grep -c CT-250` and `awk '/^- \*\*OA-4/,/^- \*\*OA-5/'
  docs/specification/delegation.md | grep -c CT-250` each print at least 1, as does `awk '/^- \*\*OW-2/,/^- \*\*OW-3/'
  docs/specification/governance-and-roles.md | grep -c CT-250` (round 31, seam); and, since OW-3 already cites CT-250
  as pending, `awk '/^- \*\*OW-3/,/^- \*\*OW-4/' docs/specification/governance-and-roles.md | grep -c "until CT-250's
  decision and Fabric"` prints 0 after that DEC, and `awk '/^- \*\*OW-5/,/^- \*\*OW-6/'
  docs/specification/governance-and-roles.md | grep -c CT-250` prints at least 1 (round 32, seam).
- Landing notes for the sibling decisions. Each states what the merged text must say once both branches are on `main`
  and a check run on the merged tree at landing; none states what a sibling branch says now, since the siblings move
  every round. Whichever of the two branches lands second makes the merged text say it. The branches: DEC-0157 on
  `agent/ct216-usage-data-v2`, DEC-0158 on `agent/ct215-on-demand-20261108`, DEC-0159 on `agent/ct218-local-cloud-v2`
  (re-read with `git ls-remote origin 'refs/heads/agent/ct2*'` at landing).
  - DEC-0157 (UD-4, a usage switch a person turned off): binding on whichever of DEC-0156 and DEC-0157 lands second,
    whatever either branch's handoff said before: OW-1's exception covers UD-4's switch (its open list "an act no
    mandate covers" does) and names UD-4 there as an example of a change-policy effect, whose word is renewed by one
    short question; OW-5's limits name UD-4's switch (a mandate from the operator's words never turns a declined switch
    back on); UD-4 cites OW-1. Checks, on the merged tree, all three required:
    `awk '/^- \*\*OW-1/,/^- \*\*OW-2/' docs/specification/governance-and-roles.md | grep -c UD-4` prints at least 1,
    `awk '/^- \*\*OW-5/,/^- \*\*OW-6/' docs/specification/governance-and-roles.md | grep -c UD-4` prints at least 1,
    and `grep -c OW-1 docs/specification/usage-data.md` prints at least 1. DEC-0157's round 25 adds that an agent does
    not delete or rewrite a shared file it cannot read to end a hold and points the person to the product's own switch;
    the merged text reads it with UD-4 and OW-2: on the operator's word naming the switch, the agent sets the product's
    own switch on through its relayed action, and only anyone else is pointed to the switch (round 29, seam). Check:
    `awk '/\*\*UD-4/,/\*\*UD-5/' docs/specification/usage-data.md | tr '\n' ' ' | grep -o 'shared file it cannot read[^;]*;[^;]*' | grep -c 'OW-2'` prints at least 1 on the merged tree (scoped to the sentence, as DEC-0157's note checks it, round 28 there).
  - DEC-0158 (OS-6, no person in a dispatched run): OS-6's notice question that "the run never reads" meets Fabric's
    `9420da79` (the operator's word of 2026-11-12 as Fabric's `QUESTIONS_RULE` carries it: a run's question goes to the
    organization's PM agent, whose reply starts the next run, or through `fabric_question_ask`, whose answer starts no run
    and is a decision the request is submitted again on only on the operator's word relayed to the requester (or by the owner's own session), rounds 30 to 32). At the
    stop for a decision outside the mandate and at the source hand-over stop, which are OW-3's first two waits, a
    dispatched run asks once per task by OW-3's route, its notice question at a human step and after a refused note
    unchanged (round 32, seam: OS-6 at `cb7009d7` asks nothing at those two stops). Checks on the merged tree: in bullet
    form, `awk '/^- \*\*OS-6/,/^- \*\*OS-7/' docs/specification/project-comms.md | grep -c 'people.ask'` and the same range
    with `grep -c 'starts no run'` each print at least 1 (round 33, seam);
    in table form, `grep -c 'people.ask' docs/specification/project-comms.md` and `grep -c 'starts no run'
    docs/specification/project-comms.md` each print at least 1, and (judgement) the table's rows for those two stops
    name the question. The table also has a row for OW-3's third wait (an effect outside a grant, CT-293's narrow
    grant applying where it lands) and for OW-3's own stop (no corrected way that both undoes cleanly and still meets
    the word), each naming OW-3's question route, and the OW-3 text that stays says so; and the re-cut says what a
    dispatched run without the board's tools (Fabric's run on another machine) settles: OW-3's `answered` with the
    open step, its question and its resubmission as Fabric's current behaviour, or a row of its own (round 33, seam).
    Checks on the merged tree: `grep -c 'undoes cleanly' docs/specification/project-comms.md`, `grep -c 'outside a
    grant' docs/specification/project-comms.md` and `grep -c "board's tools" docs/specification/project-comms.md` each
    print at least 1 (0 on a simulated merge today). The re-cut table of stops takes OW-3's no-person route for its waits (round 29, seam; relayed
    to DEC-0158's handoff in round 32, not there at `cb7009d7`). Also: this requirement is written here and binds whichever of DEC-0156
    and DEC-0158 lands second, whether or not the other branch's handoff repeats it (the coordinator relays it to that
    branch's owner). `docs/specification/conformance.md` keeps the board-client row in DEC-0158's form (with "a
    dispatched run follows its own row below (OS-4, OS-7)"), then the OW row, then DEC-0158's rows; OW-3 and OS-6 cite
    each other; and OW-3's no-person case and OS-6 name the same settlement, so one situation reads one way on the
    board: before any effect, `failed_known` with `observed: false` and a `com.reply` naming the open act. Who submits
    it again (round 23, seam): OS-6's never-resubmit covers only the act that only a session with a person can take
    (OW-3's FA-09 case), which is never submitted again, its reply says so, and the person's session that performs it
    records that in the request's thread; a request stopped at the estate's production stop or at a host's gate that a
    relay naming the step or a grant can lift is submitted again as OW-3 says, as is one whose human step was cleared or
    whose step a decision names. The resubmitter follows OS-6's split: the operator when they own the requesting
    Project, otherwise the requester. A request whose asked act was done, with only a side act left open, settles
    `completed` with the open act named in its result, in OW-3 and OS-6 alike. OS-6 asks its notice question (`fabric_question_ask` or the host's equal) only at a human step and where its participant stop note was refused (OS-6's own case; OW-3's session replies as the request's holder with its fence, which no hold refuses); at the
    estate's production stop or a step a host's gate holds, a dispatched run asks no question and names the step in
    its thread note and its report, as OW-3 has a session with no person do. Checks, on the merged tree:
    `grep -c 'a dispatched run follows its own row below (OS-4, OS-7)' docs/specification/conformance.md` prints 1,
    `grep -c "^| an agent that takes its operator's words" docs/specification/conformance.md` prints 1,
    `awk '/^- \*\*OW-3/,/^- \*\*OW-4/' docs/specification/governance-and-roles.md | grep -c OS-6` prints at least 1,
    `awk '/^- \*\*OW-3/,/^- \*\*OW-4/' docs/specification/governance-and-roles.md | grep -c 'observed: false'`
    prints at least 1, the same range with `grep -c 'left in progress'` prints 0, the same range with
    `grep -c 'requester submits it again'` prints 0, with `grep -c 'nobody submits the request to the board again'`
    prints at least 1 and with `grep -c 'when they own the requesting Project'` prints at least 1, and OS-6's paragraph
    names OW-3, settles a stop before an effect as `failed_known` with `observed: false`, names the same resubmitter
    split, has no FA-09 act submitted again by a reader of a host's-gate note (OS-6's no-note `failed_known` exception
    being DEC-0158's run's alone) and asks its notice question at a human step and where its stop note was refused
    (judgement, where OS-6 is defined). On the resubmission wording, on the merged tree: the OS-6 range
    (`awk '/^- \*\*OS-6/,/^- \*\*OS-7/' docs/specification/project-comms.md`) with `grep -c 'FA-09'` prints at
    least 1, with `grep -c 'a grant'` prints at least 1 and with `grep -c 'side act'` prints at least 1, and the OW-3
    range with `grep -c 'side act'` prints at least 1 (judgement: OS-6's never-resubmit names only OW-3's FA-09 case, a
    production stop or a host's gate that a relay naming the step or a grant lifts is resubmitted, and both ranges name
    the same `completed` case).
    The split governs DEC-0158's own text beyond OS-6 as well (round 24, seam): its dispatched-run conformance row,
    its decision item 6 and the item its handoff has Fabric's `board.read-at-start` owe each keep never-resubmit for
    a host's gate alone (OW-3's FA-09 case), and each has a request settled at the estate's production stop submitted
    again once it carries the operator's relayed words naming the step; none of them says nobody submits the request
    again at the production stop. Checks, on the merged tree:
    `grep '^| a dispatched run' docs/specification/conformance.md | grep -c 'production stop or a host.s gate asks no question, names the step in its note and its report, and says that it waits'`
    prints 0 and the same row with `grep -c 'at the production stop says the request is submitted again'` prints 1;
    `awk '/^### DEC-0158/,/^### DEC-0159/' docs/DECISIONS.md | awk '/^  6\. /,/^  7\. /'` (item 6) with
    `grep -c 'request is submitted again once it carries'` prints at least 1 and with `grep -c FA-09` prints at least
    1; `grep -c 'at the production stop its note says the request is submitted again' docs/handoffs/2026-11-08-on-demand-sessions.md`
    prints at least 1 (judgement, for each of the three: never-resubmit names only a host's gate, and the production
    stop is lifted by the relayed words naming the step).
  - DEC-0159 (CT-218, members' client keys): this requirement is written here and binds whichever of DEC-0156 and
    DEC-0159 lands second, whether or not the other branch's handoff repeats it (the coordinator relays it to that
    branch's owner). In `conformance.md` the merge leaves one hunk over two adjacent rows, each changed on one side
    only: the lander keeps DEC-0159's "a callee that serves the family" row and DEC-0156's "an agent receiving a relay"
    row, never one side of the hunk (round 29, seam); checks on the merged tree: `grep '^| a callee that serves the
    family' docs/specification/conformance.md | grep -c 'save the one exception'` and `grep '^| an agent receiving a
    relay' docs/specification/conformance.md | grep -c "a host's gate on a floored act still asking once"` each print 1.
    OW-5 says that a relayed decision naming a change to a service's own budget or a per-key cap (AP-2, AP-5; DEC-0159
    CF-3, CF-4, round 18) is that change, not a widening by OW-1, and never moves L0 or L1 (DEC-0159 round 19, seam);
    check on the merged tree: `awk '/^- \*\*OW-5/,/^- \*\*OW-6/' docs/specification/governance-and-roles.md | grep -c
    'CF-4'` prints at least 1. SCN-059 states the key split. Issuing and rotating a member's key are
    OW-4's secret step, from the operator's terminal or the page, so the value never enters an agent's transcript (CF-3);
    revoking is the agent's step on the operator's decision (OW-2), through the `relayed` twin where the instance checks
    `approval/1`, else by the agent running the agent's own CLI on the operator's computer (CF-4). OW-4 says that an
    answer whose `data.detail` or job `statusMessage` starts with `operator-step` is handed to the person as "the
    operator was asked", with no link and no retry under a wider key, and that `operator-step: choice` is not repeated
    (CF-4, DL-19; DEC-0159 round 17, `d179d6ee`); check on the merged tree:
    `awk '/^- \*\*OW-4/,/^- \*\*OW-5/' docs/specification/governance-and-roles.md | grep -c 'operator-step'` prints at
    least 1 (round 28, seam). SCN-059's sentence
    for a host that cannot show the page leaves revoking with the agent, and SCR-30's Scenarios do not list SCN-059. In
    SCN-044 the merged text keeps OW-3's "asks once whether to update" for `incompatible` and CT-218's cloud-instance alt
    path, with both Coverage citations; that alt path's sentence takes SCN-059's split (issuing and rotating a
    member's key are the operator's, from their own terminal; revoking is the agent's, on the operator's word, through
    the agent's CLI on the operator's computer), so no SCN-044 line has the operator manage client keys. Checks:
    `awk '/^### SCN-044/,/^### SCN-058/' docs/ux/scenarios.md | grep -c 'operator manages client keys'` prints 0, and
    the same range with `grep -c 'revok'` prints at least 1 (judgement: revoking named as the agent's); the same range
    with `grep -c 'asks once whether to update'` prints 1 and with `grep -c 'how to update'` prints 0; `awk '/^### SCN-044/,/^### SCN-058/'
    docs/ux/scenarios.md | grep '^- \*\*Coverage' | grep 'DEC-0156 OW-1 to OW-4' | grep -c 'DEC-0159 CF-1'` prints 1;
    and the second lander writes OW-4 into SCN-059, `awk '/^### SCN-059/,/^### SCN-045/' docs/ux/scenarios.md | grep -v
    'the update alt path' | grep -c 'OW-4'` printing at least 1 (round 33, seam). The SCN-044
    Coverage conflict hunk carries SCN-058 and the scenarios after it on DEC-0159's side, which the lander keeps whole,
    never resolving that hunk by taking one side. Check, on the resolved tree:
    `grep -c '^### SCN-05[89]' docs/ux/scenarios.md` prints 2 and `python3 docs/ux/lint.py` exits 0. OW-4 names, as a human step's exact step, a command the person runs in their own
    terminal where an agent's run would put a secret in its transcript (CF-3), and CONTEXT's "hands the operator no
    command" takes that exception. That clause goes into OW-4 and into CONTEXT's entry whichever branch lands second;
    CF-4's *Where the operator is* may carry it as well, but never instead, and the clause in CF-4 alone meets none of
    the checks below. Checks: judgement, each SCN-059 line naming the operator's terminal or CLI names
    issuing, rotating or the entry point, never revoking;
    `awk '/^### SCR-30/,/^### SCR-31/' docs/ux/screens.md | grep -c SCN-059` prints 0; `python3 docs/ux/lint.py` exits 0;
    `awk '/^- \*\*OW-4/,/^- \*\*OW-5/' docs/specification/governance-and-roles.md | grep -c 'own terminal'` prints at
    least 1 and the same over the same range for `CF-3` prints at least 1;
    `awk '/^\*\*Operator.s word, carried out the first time\*\*/,/^$/' CONTEXT.md | grep -c 'own terminal'` prints at
    least 1 (judgement: the entry's "no command" reads with that exception). OW-4 also names CF-4's raised operator
    step (the page's event and its ask) as the hand-over when the agent called with a client key, and names spend under
    a client key as outside rule 3's approval request. Checks:
    `awk '/^- \*\*OW-4/,/^- \*\*OW-5/' docs/specification/governance-and-roles.md | grep -c CF-4` prints at least 1
    and the same range with `grep -c 'client key'` prints at least 1 (judgement: read with CF-4 for the operator's own
    agent holding a client key).
    `docs/ux/foundation.md` conflicts too, in ST-035's criteria: the merged text keeps DEC-0159's human-step line (its
    CF-4 case, which hands the agent no link), then this branch's task line with DEC-0156 OW-3, in that order, and
    ST-035's list of exact steps ("a link, the command and the setting, ...") reads with CF-4's no-link case: where the
    agent holds a client key at a cloud instance, the exact step is the raised operator step, not a link (judgement).
    Checks, on the merged tree: `grep -c '^<<<<<<<' docs/ux/foundation.md` prints 0, and
    `grep -c 'DEC-0156 OW-3' docs/ux/foundation.md` and `grep -c 'DEC-0159 CF-4' docs/ux/foundation.md` each print at
    least 1.
  - Register conflicts with any sibling (`docs/DECISIONS.md`, `docs/backlog.md`, `docs/handoffs/README.md`) are
    adjacent appends: the lander keeps both sides, in id order. Check: no conflict marker is left (`git grep -n '^<<<<<<<'`
    prints nothing), no backlog id appears twice (`grep -o '^| CT-[0-9]*' docs/backlog.md | sort | uniq -d` prints
    nothing on the merged tree; this branch adds CT-266, CT-291, CT-271, CT-273, CT-278 and CT-282) and
    `pnpm run check` exits 0 on the merged tree. CT ids have no reservation counter on origin (only `DEC` and `SEM` do,
    under `refs/agent-sync/ids/`), so two branches can file the same CT id; round 24's seam found CT-282 taken twice,
    renumbered to CT-283 on DEC-0159's branch (commit `cbe9fe94`), this branch keeping CT-282. A duplicate found at landing is renumbered on the
    branch that lands second, with every reference to it.
    Main merged into this branch on 2026-11-12: main had filed CT-269 (a remote placement's update path) meanwhile, so
    this branch's CT-269 (the spend hand-over's two forms) is renumbered CT-291 with every reference.
- Owed at the operator-channel status schema's next change (round 20, product; backlog CT-282 since round 23): its
  `state` description still reads `off` as "the operator has not enabled the channel"; it takes the Status table's
  `off` row (an `accepted` answer with `credential.present: false` or no `credential` member waits for the token, the
  tile saying to tell the agent once it is stored, and with the token present the agent enables the channel on its own
  status read, leaving no person step). Not changed here, so the schema and its
  vendored copies stay byte for byte. That change also decides whether `off` with an `accepted` answer requires
  `credential` (round 21, seam); until then the row says what the tile shows without it.
- At Fabric's next pin of this contract (round 24, seam): Fabric vendors the fixture catalogue
  (`apps/desktop/test/fixtures/fabric-agent-contract/current/catalogue.json` at `eafcf2e4`), which gains
  `operator-channel-status-off-awaiting-token` and six changed details; nothing on the wire or in the schema moves, and
  `pnpm pin:check <Fabric checkout>` runs on the landed contract commit then.
- Named risk carried to the closing verdict (round 15, product): in the no-person FA-09 case only Fabric's refused card
  and its OS notification reach the person, and the card's "Allow once" leaves the act undone; the person learns what
  is open only from the board reply and the report until Fabric ships the card change DEC-0156's Compatibility owes. The
  run continues around it (round 14 declined a further surface); at landing CT-220's row states `add1df7c`'s answer, or
  that it is still open.

## Decisions taken here

- OW-3's waits: the coordinator's reading of the operator's «если есть риски уточнить и корректировать и выполнить»
  against AP-2 and AP-3. The one message never stops the task; only a step whose corrected way is a `relayed` act the
  words do not name and the mandate does not cover, a step a limit of OW-5 gates other than a human step, a reserved control or a host's gate, or a step with no corrected way that
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
  is in, rather than `fabric_question_ask` (dropped in round 13 because a yes there reached no live session). Round 20
  replaced its settlement: OW-3 adds to SA-6's `com.accept`, then `com.complete`, that no `com.effect_begin` is called
  for an act not begun, and that a request whose asked act is the open step settles `failed_known` with
  `observed: false` before any effect, with a `com.reply` naming the open act; a request whose asked act was done,
  with only a side act left open, settles `completed` with that act named. Round 21 replaced its resubmission: an act
  only a session the person is in can take (the FA-09 case) is never submitted again, the reply says so and the
  person's session records the act in the request's thread; a request is submitted again only where what the person
  does lets a session with no person take the step, by the operator when they own the requesting Project and the
  requester otherwise, the split DEC-0158's OS-6 states for a dispatched run (the DEC-0158 landing note above).
- Rounds 29 and 30 restored a question for OW-3's three waits in a session with no person, by the operator's word of
  2026-11-12 as Fabric's `QUESTIONS_RULE` carries it (`9420da79`), which rounds 13 and 19 had dropped because a yes
  reached no live session: on `people.ask` the PM agent's reply is a board message that starts the asking project's
  next run (§3.8), which takes the step only on the operator's word; through `fabric_question_ask` the answer still
  starts no run, so it is a decision on which the request is submitted again only on the operator's word relayed to the requester (or by the owner's own session), the
  reason of rounds 13 and 19 kept for that route. A host's gate and the FA-09 case still ask nothing from that session.
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
  spend hand-over's two forms filed as CT-291.
- On `3e5154b2` (round 7's readers): `pnpm run docs:check` exit 0, `python3 docs/ux/lint.py` exit 0 (57 scenarios), no
  U+2014 in the added lines.

- Round 8 (on `c6003c0f`): unit clean; seam not clean (DEC-0156's Source named a personal agent in this public
  repository, which `pnpm privacy:check` refuses: now the relay alone is cited); product not clean (SCN-012's alt path
  and SCN-014's recovery still gave the operator the link code and the receiver: now the agent's; CT-291 missing from
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
  ask, and CT-291's row adds that the floor reads that approval; the conformance row's OW-2 clause names a twin the
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
  session message (the surface is CT-291's); SCN-012's recovery and DEC-0156's Consequences and Done match. The CT-218
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
  the host-gate case (product); CT-291 now asks whether the agent's dashboard takes a rule-3 approval, with the
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
  owed, no edit: the spend approval while the receiver is missing stays with CT-291 (the tile says "answer decisions on
  its dashboard" and promises no spend approval there); fabric-workspace's `knowledge/agents-first.md` and the
  consumers' mixed state are the landing steps and the Compatibility already owe (product). Declined: none.
- On the round-19 fold (working tree over `0f0a3f5f`): `pnpm run docs:check` exit 0 (271 Markdown files, 0
  markdownlint errors); `python3 docs/ux/lint.py` exit 0 (57 scenarios); `pnpm run privacy:check` 0 findings;
  `pnpm --silent validate` exits 0 on the three changed positive fixtures and 1 on the three negatives, each for its
  original single reason; `pnpm vitest run test/operator-channel.test.ts test/fixtures.test.ts
  test/consistency.test.ts`, 3 files, 1195 passed; no U+2014 in the added lines; `git merge-tree --write-tree HEAD
  origin/main` clean. The full gate (`pnpm run check`) was not run.

- Round 20 (on `ee1ff512`): unit clean of breaks; seam and product not clean. Breaks folded: SCN-014's recovery
  (product) made every paid action answerable only through OC-6 and rule 3; it is now split, in SCN-014, DEC-0156's
  Consequences and Done: spend above a project's `autoApproveUsd` only through rule 3's approval request, never a chat
  or session message (the surface is CT-291's), and a paid action within a limit as AP-1's `relayed` class, on the
  dashboard or by telling the agent as AP-2 says, in the bot's chat only with OC-6's presses once the receiver is back.
  OW-3's no-person settlement (product; unit and seam as a risk) said "left in progress", which collides with the
  board's `in_progress` (reached only through `com.effect_begin`), and credited the split to SA-6, which does not state
  it: OW-3 now settles under SA-6's `com.accept`, then `com.complete`, and adds its own rule: no `com.effect_begin` for
  an act not begun (the request stays `accepted`, effect `not_started`, until it settles); a request whose asked act is
  the open one settles `failed_known` with `observed: false` before any effect, a `com.reply` naming the open act and
  what it waits for, the requester submitting it again once the person has acted, as DEC-0158's OS-6 settles a stop
  before an effect, so the board reads one way; one whose asked act was done, with only a side act left open, settles
  `completed` with that act named; mirrored in DEC-0156 item 3, the conformance row, SCN-057's alt path, FLW-29's FA
  node and Decisions taken here, and the DEC-0158 landing note now requires the same settlement with merged-tree greps.
  The DEC-0157 landing notes on the two branches disagreed (seam): this note keeps OW-1 naming UD-4 as an example of a
  change-policy effect, now stated as binding on whichever branch lands second, with the OW-1 grep among three required
  checks. Risks folded: OW-1 limits "renewed by one short question as AP-2 says" to a change-policy effect and a source
  hand-over, and sends the move of a board slot and MD-6's human steps to the person as OW-4 says (unit), mirrored in
  DEC-0156 item 1; OW-1 and DEC-0156 item 1 take AP-3's direction, "a subagent receiving them verbatim from the session
  that started it" (unit); the DEC-0159 landing note requires OW-4 to name CF-4's raised operator step as the hand-over
  for an agent calling with a client key and client-key spend as outside rule 3's request, with merged-tree greps
  (product); the DEC-0158 note says it binds whichever branch lands second, whether or not the other handoff repeats it
  (seam); the operator channel's Status table's `off` row names an `accepted` answer with `credential.present: false`
  as waiting for the token, the tile naming that step, and the schema's `state` description is owed at its next change
  (Open) (product); SCN-012's dashboard link code has no screen: filed as CT-278 (product); CT-220's backlog row
  restates its round count (product); the six fixture details and their mirrors (OC-11 step 3, SCN-012, SCN-014,
  DEC-0156's Consequences, Done) say "the coding session it runs in" instead of "the session that runs it", each one
  sentence of at most 291 characters (product). Left as owed, no edit: the adapter's owed list and its released
  versions since (seam, product) and the spend approval while nobody receives (CT-291) stay as DEC-0156's
  Compatibility and CT-291 already name them. Declined: none.
- On the round-20 fold (working tree over `ee1ff512`): `pnpm run docs:check` exit 0 (271 Markdown files, 0
  markdownlint errors); `python3 docs/ux/lint.py` exit 0 (57 scenarios); `pnpm run privacy:check` 0 findings;
  `pnpm --silent validate` exits 0 on the three changed positive fixtures and 1 on the three negatives, each for its
  original single reason (missing "credential"; `/receiver/lease` must be "none"; missing "receiver");
  `pnpm vitest run test/operator-channel.test.ts test/fixtures.test.ts test/consistency.test.ts`, 3 files, 1195
  passed; `awk` over OW-3, over SCN-057 and over the conformance row, each with `grep -c 'left in progress'`, prints 0;
  no U+2014 in the added lines; `git merge-tree --write-tree HEAD origin/main` exit 0. The full gate
  (`pnpm run check`) was not run.

- Round 21 (on `b1676b13`): unit clean of breaks; seam and product not clean. Breaks folded: OW-3's no-person
  settlement (product) had the requester submit a request again "once the person has acted", which under FA-09 asks
  for the act a second time or sends it to another no-person session refused the same way: now the `com.reply` says
  the act waits for a session the person is in and that nobody submits the request to the board again, the person's
  session records the act in the request's thread when it performs it and the requester submits nothing; a request is
  submitted again only where what the person does lets a session with no person take the step, by the operator when
  they own the requesting Project and the requester otherwise (DEC-0158's OS-6 split), in OW-3, DEC-0156 item 3, the
  conformance row, SCN-057's board alt path and FLW-29's FA node; the DEC-0158 landing note now requires that split,
  scopes OS-6's notice question to a human step (a production stop or a host gate's step in a dispatched run asks no
  question and names the step) and adds merged-tree greps for the wording, and Decisions taken here no longer says
  OW-3 settles "as DEC-0158's OS-6 does". The DEC-0159 landing note (seam) left SCN-044's cloud-instance sentence
  ("the operator manages client keys with the agent's own CLI") against SCN-059's split: it now requires the same
  split there (issuing and rotating the operator's, from their own terminal; revoking the agent's, on the operator's
  word, through the agent's CLI on the operator's computer) with two merged-tree checks over SCN-044. Risks folded: the
  "own terminal" clause goes into OW-4 and CONTEXT whichever branch lands second, CF-4 in addition (seam); OW-2,
  DEC-0156 item 2 and its Source name the one press DEC-0156 keeps, a host gate's agreement (Fabric's "Allow once"
  under `floor.ask-first`), pending `add1df7c`, and that question's landing step adds the 2026-11-07 word
  (announcement `e6385b29`) (product); OW-3's exclusion reads "a human step, a reserved control (OW-4) or a host's
  gate", mirrored in DEC-0156 item 3 and the conformance row (unit); OC-11 step 3 reads "on the dashboard when the
  agent has one" (unit); the FA-09 card's "leaves only when" now reads as Fabric's `shared/attention.ts`
  `openRefusals` (main `0e7a8a00`, from line 222; its comment from line 170) does: it leaves when newer policy
  decisions push it out, or a later grant or a later decision allowing the same floor class and target, in the project
  or estate-wide, resolves it, in OW-3 and DEC-0156's Compatibility (unit); the Status table's `off` row has the
  positive fixture `operator-channel-status-off-awaiting-token.json` (`proposal.answer` `accepted`,
  `credential.present` false) with its catalogue row, and says what the tile shows with no `credential` (unit, seam,
  product); OC-17 says a product's own `reason.detail` stays within 300 characters in every locale it ships
  (product). Left as owed, no edit: the schema's `off` description and whether it requires `credential` (Open); the
  adapter's and fabric-workspace's mixed state until landing (DEC-0156's Compatibility, the landing step); the spend
  approval while nobody receives (CT-291). Declined: shortening the 291-character example `detail` (optional; the
  OC-17 sentence carries the locale bound).
- On the round-21 fold (working tree over `b1676b13`): `pnpm run docs:check` exit 0 (271 Markdown files, 0
  markdownlint errors); `python3 docs/ux/lint.py` exit 0 (57 scenarios); `pnpm run privacy:check` 0 findings;
  `pnpm --silent validate` exits 0 on the new `fixtures/positive/operator-channel-status-off-awaiting-token.json` (no
  other fixture changed); `pnpm vitest run test/operator-channel.test.ts test/fixtures.test.ts test/consistency.test.ts
  test/positive-sweep.test.ts`, 4 files, 1390 passed; no U+2014 in the added lines; `git merge-tree --write-tree HEAD
  origin/main` clean. The full gate (`pnpm run check`) was not run.
- Round 22 (on `721acaf7`): unit and product clean of breaks; seam not clean. Break folded: the DEC-0159 landing note
  lacked the binding sentence the DEC-0158 note has, and its "in addition where DEC-0159's own note puts it there"
  could be read as letting the "own terminal" clause go into CF-4 instead of OW-4 and CONTEXT (seam). The note now
  binds whichever of DEC-0156 and DEC-0159 lands second, whether or not the other branch's handoff repeats it, and says
  the clause goes into OW-4 and CONTEXT's entry whichever lands second, CF-4 carrying it as well but never instead.
  Risks folded: the DEC-0159 note names the `docs/ux/foundation.md` conflict in ST-035's criteria (DEC-0159's
  human-step line, then this branch's task line, in that order; ST-035's exact steps read with CF-4's no-link case),
  with three merged-tree greps (seam); OW-2 says "the one press this rule itself keeps, beside the steps OW-4 hands the
  person", mirrored in DEC-0156 item 2, its Source and CT-220's row (unit); OW-3's first wait sentence attaches "(a
  source hand-over, an effect outside a grant)" to "a limit of OW-5", not to "a host's gate", mirrored in DEC-0156
  item 3 (unit); the three receiver-missing details (one positive, two negatives) name both ways to answer a decision,
  by telling the agent or on its dashboard, not in the bot's chat, each one sentence of 300 characters, mirrored in
  SCN-014's recovery, DEC-0156's Consequences and Done (product); SCN-012 has an alt path for an `accepted` given
  before the token is stored (the status stays `off`, the tile names the token under `credential.name`, the agent
  enables and links once told it is stored, renewing an `accepted` past its window by one question first), its
  Coverage names `operator-channel-status-off-awaiting-token`, DEC-0156's Consequences says so, and CT-278's row now
  also owes the status tile's screen states (product); SCN-044's `incompatible` sentence updates the host app through
  its own update route, or its supervisor where it publishes a descriptor, mirrored in DEC-0156's Consequences
  (product). Left as owed, no edit: the schema's `off` description (Open); the adapter's and fabric-workspace's mixed
  state until landing (DEC-0156's Compatibility, the landing step); the sibling reconciliation, carried by the landing
  notes the coordinator relays (product). Declined: none.
- On the round-22 fold (working tree over `721acaf7`): `pnpm run docs:check` exit 0 (271 Markdown files, 0
  markdownlint errors); `python3 docs/ux/lint.py` exit 0 (57 scenarios); `pnpm run privacy:check` 0 findings;
  `pnpm --silent validate` exits 0 on `fixtures/positive/operator-channel-status-degraded-receiver-missing.json` and 1
  on the two changed negatives, each for its original single reason (`/receiver/lease` must be "none"; missing
  "receiver"); every operator-channel-status `detail` is at most 300 characters; `pnpm vitest run
  test/operator-channel.test.ts test/fixtures.test.ts test/consistency.test.ts test/positive-sweep.test.ts`, 4 files,
  1390 passed; no U+2014 in the added lines; `git merge-tree --write-tree HEAD origin/main` clean. The full gate
  (`pnpm run check`) was not run.
- Round 23 (on `7f1b8e92`): unit and seam clean of breaks; product not clean. Break folded: the three receiver-missing
  details (one positive, two negatives) told the person to answer decisions by telling the agent, a route spend
  policy rule 3 never accepts for spend above `autoApproveUsd` (product). Each now reads "answer decisions, a spend
  approval excepted, on its dashboard or by telling the agent, not in the bot's chat", one sentence of 274 characters
  (headroom under the schema's 300, unit, seam, product), each negative failing for its original single reason;
  mirrored in DEC-0156's Consequences and Done. Risks folded: the Status table's `off` row reads "`proposal.answer:
  accepted` and either `credential.present: false` or no `credential` member" (unit), and says that with `accepted`
  and `credential.present: true` the tile names a person step, as OC-11 step 3 read the store only at the agent's next
  start and when told (product; replaced in round 24, where the agent enables on its own status read); OC-11 step 2
  names its hand-over, AP-4's `secret` step with its link or the host's secret prompt (SCN-053), never a command
  (product); DEC-0034's Annotated line adds "and the token is stored" (unit); OW-3's no-person FA-09 case says a reader
  takes the thread record, not the request's `failed_known` state, as the act's outcome (product); the DEC-0158
  landing note states who resubmits on the merged text (OS-6's never-resubmit only for OW-3's FA-09 case; a production
  stop or a host's gate that a relay naming the step or a grant can lift resubmitted as OW-3 says; the resubmitter by
  OS-6's split; an asked act done with only a side act open settling `completed` in both) with merged-tree greps over
  OS-6 and OW-3, binding whichever lands second (seam); the schema's `off` description and whether `off` with
  `accepted` requires `credential` are backlog CT-282 (unit, seam, product), mirrored in DEC-0156's Consequences and
  Open. Left as owed, no edit: the adapter's, Fabric's and fabric-workspace's mixed state until landing (DEC-0156's
  Compatibility, the landing step) (seam, product); the sibling reconciliation, carried by the landing notes (product).
  Declined: none.
- On the round-23 fold (working tree over `7f1b8e92`): `pnpm run docs:check` exit 0 (271 Markdown files, 0
  markdownlint errors); `python3 docs/ux/lint.py` exit 0 (57 scenarios); `pnpm run privacy:check` 0 findings;
  `pnpm --silent validate` exits 0 on `fixtures/positive/operator-channel-status-degraded-receiver-missing.json` and 1
  on the two changed negatives, each for its original single reason (`/receiver/lease` must be "none"; missing
  "receiver"); the three changed details are 274 characters each; `pnpm vitest run test/operator-channel.test.ts
  test/fixtures.test.ts test/consistency.test.ts test/positive-sweep.test.ts`, 4 files, 1390 passed; no U+2014 in the
  added lines; `git merge-tree --write-tree HEAD origin/main` clean. The full gate (`pnpm run check`) was not run.

- Round 24 (on `1c24ef7f`): unit clean of breaks; seam and product not clean. Breaks folded: the Status table's `off`
  row with `accepted` and `credential.present: true` handed the person a step the agent's own status shows it can
  take; now the agent reads the store whenever it builds its status and enables the channel on the read that finds
  the token (OC-11 step 3), no person step is left but OC-11's one renewal question for an old `accepted`, and with
  `credential.present: false` the tile names the token to store and says to tell the agent, or the coding session it
  runs in, once it is stored; mirrored in CT-282, DEC-0156's Consequences, SCN-012's alt path and Done (product); the
  DEC-0158 landing note now has the split govern DEC-0158's dispatched-run conformance row, its decision item 6 and
  its owed `board.read-at-start` item, with merged-tree greps over each (seam); CT-282 was filed twice, renumbered to
  CT-283 on DEC-0159's branch (`cbe9fe94`), and the register-conflict note lists CT-282 and says CT ids have no
  reservation counter on origin (seam, unit). Risks folded: the conformance row reads "unpressed, stays refused" and
  the row and OW-3's report clause say "the act stays refused" (unit); the next free id reads `DEC-0161`, `DEC-0160`
  reserved by a sibling (unit); the DEC-0159 note keeps SCN-044's Coverage hunk whole, carrying SCN-058 onward (seam);
  OA-4 points to OW-3 and OW-5, DEC-0126 carries an Annotated line, and the fabric-workspace landing step adds "One
  approval binds all" items 1 and 5 (product); Fabric's vendored catalogue gets `pnpm pin:check` at its next pin, in
  Open (seam). Declined: none.
- On the round-24 fold (working tree over `1c24ef7f`): `pnpm run docs:check` exit 0 (271 Markdown files, 0
  markdownlint errors); `python3 docs/ux/lint.py` exit 0 (57 scenarios); `pnpm run privacy:check` 0 findings;
  `pnpm --silent validate fixtures/positive/operator-channel-status-off-awaiting-token.json` exit 0 (no fixture
  changed); `pnpm vitest run test/operator-channel.test.ts test/consistency.test.ts`, 2 files, 58 passed;
  a `git grep` over `docs` and `fixtures` for the two retired `off`-row phrases (the product reading's check) prints
  nothing; no U+2014
  in the added lines; `git merge-tree --write-tree HEAD origin/main` clean; on the merged tree with DEC-0158's branch
  (`755023cf`) the new greps print 0, 1, 1, 1 and 1, and with DEC-0159's branch (`cbe9fe94`) the CT duplicate check
  prints nothing and `grep -c '^### SCN-05[89]'` prints 2. The full gate (`pnpm run check`) was not run.
- Round 25 (on `25a285f5`, main merged in on 2026-11-12, the branch's CT-269 renumbered CT-291): none clean. Breaks
  folded: OW-3's no-person case and its own stop met the operator's decision of 2026-11-09 for headless places, now on
  main as CT-285's design, without naming it; OW-3, DEC-0156's Why and Compatibility and a landing note
  now name it, CT-285's decision to amend OW-3, and main's CT-285 row names OW-3 (product). A channel the operator turned off was enabled again by the
  next status read; OC-11 step 3, the Status table's `off` row, DEC-0156's Consequences and SCN-012 now keep it off,
  the word recorded as `declined` (unit). Amended OA-4 was still stated the old way in SCN-046, CONTEXT's *Relayed
  approval* and the relay receiver's conformance row; each now says a host's gate on a floored act asks once, quoting
  the words (seam). Risks folded: SCN-057 and FLW-29 name "a reserved control" with OW-3's second wait; this Done's next
  free id is `DEC-0162`; DEC-0034's Annotated line names the `off` row and DEC-0035 carries one for OC-17 (unit); the
  owed lists name fabric-workspace's "One approval binds all" items and Fabric's `operator.told-one-is-told-all`; At
  merge restates CT-287 and the annotations (seam). Declined: none.

- Round 26 (on `7a925f19`, origin/main `b8a6af95` merged): unit clean; seam and product not clean. Breaks folded: the
  handoff's two notes on DEC-0158 bound the second lander to opposite things; they are reconciled (OW-3's session holds
  the request, so its fenced reply is never refused, and the refused-note question and the no-note exception are
  DEC-0158's run's alone), the DEC-0158 note's two wording lines restated and its greps scoped to OS-6 as a bullet with
  the table's checks beside them (seam, product); CT-220's row and the handoffs index were a round behind and now say
  rounds 25 and 26 folded, round 27 next (product). Risks folded: a new word after a turn-off is recorded as `accepted`
  (OC-11); DEC-0035's annotations in date order (unit); OW-3 names the operator's session in the requesting Project, its
  agent on their word, as the resubmitter, not the person; CT-266 and a CT-250 landing note tie OW-1 and OW-6 to the
  levels of 2026-11-06 (main's CT-250 row names them since #275); SCN-057's no-person alt path names CT-285 (product);
  the CT-285 note lists the conformance row, SCN-057 and FLW-29 (seam). Declined: none.
- On the round-25 fold and the 2026-11-12 merges: `pnpm run check` exit 0 on `25a285f5` (merge of main `d40ae936`,
  11175 tests), on `d451a9ab` (round 25), and on `7a925f19`; the merge `25144f99` was committed with conflict markers in
  `docs/backlog.md` (the gate failed, 7 markdownlint errors) and fixed by `7a925f19` four minutes later, so CT-287's
  "gate exit 0 on each" holds for each branch head, not for that commit. Main `2b0bcd55` merged as `0850d78a` with the
  conflict resolved before the commit (no markers, checked).

- Round 27 (on `3e3f8628`, main `2b0bcd55` merged): seam clean; unit and product not clean. Breaks folded: SCN-046's
  Fabric alt path gave a session whose runner gate is removed the no-person outcome with the person in its chat; it now
  asks once in the chat and publishes on the yes (unit); the floor's kept ask cited only the instruction of 2026-10-15,
  not the operator's decisions of 2026-10-26 and 2026-11-06; OW-3, the Compatibility (no longer "the operator's
  decision, not this one's"), the `add1df7c` and fabric-workspace landing steps, the CT-250 note and SCN-046's Expected
  result now name them (product). Risks folded: DEC-0156 item 3 and the OW conformance row name the operator's session
  as the resubmitter; FLW-29's F1 branches for a session with no person (unit); the CT-285 note covers a person place's
  profile, OW-2's kept press and the four OA-4 statements, and records the CT-285 row's OS-6 misreading; CT-282 owes
  `proposal`'s description and the Status table says it now (product, seam); the Compatibility cites Fabric `5676cd88`'s
  grant note, false under FA-09 (seam).
- On the round-26 fold (`3e3f8628`): `pnpm run check` exit 0 (11175 tests) before round 27 was read.
- On the round-27 fold (`9b35a554`): `pnpm run check` exit 0 (11175 tests) before round 28 was read.
- On the round-28 fold (`04707957`): `pnpm run check` exit 0 (11175 tests) before round 29 was read.
- On the round-29 fold (`14659956`): `pnpm run check` exit 0 (11175 tests) before round 30 was read.
- On the round-30 fold (`455296c3`, then main `e9bb7ac7` merged as `1f6929db`): `pnpm run check` exit 0 (11175 tests).
- On the round-31 fold (`c6bfe82e`, then `5c72505e`): `pnpm run check` exit 0 (11175 tests).

- Round 28 (on `9b35a554`, main `2b0bcd55` merged): product clean; unit and seam not clean. Breaks folded: the handoffs
  index called round 26's seam clean, which the round record says was not (unit); main's CT-292 (TC-4, a no-person
  session asks the context question through the host's question surface) and OW-3's no-person case (no question from
  that session) disagree, now a CT-292 landing note binding the second lander (seam). Risks folded: a CT-293 landing
  note for OW-1, OW-3 and OW-5 (seam, product); DEC-0159's round-17 `operator-step` requirement for OW-4 added to the
  DEC-0159 note with its merged-tree check (seam); OW-3 and the `add1df7c` step name the operator's decision of
  2026-11-07, agents run without permission prompts (product); the Compatibility and the OW conformance row frame the
  fabric-workspace "One approval binds all" item as Fabric's current behaviour pending CT-250 and `add1df7c`; SCN-046's
  Expected result names the decisions its pending vehicles carry; the round-27 fold's checks recorded (unit). Main
  `53835d18` merged as `cc5885a5` (the backlog's adjacent CT-291 and CT-292 to CT-294 appends resolved, no markers,
  checked). Declined: none.

- Round 29 (on `04707957`, main `53835d18` merged): unit and product clean; seam not clean. Break folded: Fabric
  `9420da79` (after round 28) ships the operator's decision of 2026-11-12 for a run with no person (on-demand spec
  §3.10, `QUESTIONS_RULE`: decide first, then ask a person through the organization's PM agent or `fabric_question_ask`,
  the answer starting the next run), which OW-3's no-person case contradicted; OW-3 now asks its three waits that way
  (the answer the operator's word only from their own surface or as an accepted relay; an act a host's gate holds and
  the FA-09 case still ask nothing from that session), with DEC-0156 item 3, the Why, the OW conformance row, SCN-057
  and FLW-29's Q1 following, the CT-292 note restated, the `add1df7c` step and the DEC-0158 note naming it (seam).
  Risks folded: the 2026-11-07 decision named in the Compatibility, the Why, the owed item's framing and SCN-046; the
  card labels given by Fabric version (0.3.19 «Отказано», `5676cd88` «Ждёт разрешения»); `intake.spec-first`'s
  questions with no person take the same route (SCN-057); the index's clean list scoped to rounds 25 to 29; two
  backlog full stops; the DEC-0159 conformance hunk and DEC-0157's hold bullet read with OW-2 added to their notes
  (unit, product, seam). Declined: none.

- Round 30 (on `14659956`): none clean. Breaks folded: OW-3 and its restatements said every answer starts the
  asking project's next run, but only a PM agent's `people.ask` reply is a board message that does; Fabric's
  `answer_question` wakes nobody, and no project offers `people.ask` yet (CO-569), so the routes are split: a
  `fabric_question_ask` answer starts no run and is a decision on which the request is submitted again (seam, product);
  the next run took the step on any answer, though each of the three waits needs the operator's word; it now takes it
  only on the operator's word or an accepted relay, and on another person's answer leaves the step open and asks the
  operator once (unit, product, seam); SCN-057's alt path said the message goes "on the operator's word" for any
  answer (product). Risks folded: the decision is attributed as the operator's word of 2026-11-12 carried by
  `QUESTIONS_RULE` with its fallback; the reply names where the question went in place of a session the person is in;
  a later wait is named, never a second question; `intake.spec-first` with no person sends a part the filing agent
  can answer on the request's thread (no `replyTo`) and a part needing a person by OW-3's route, in OW-3 and SCN-057;
  the CT-285 and CT-250 landing notes gained checks that fail until their DECs amend the text; the handoff's decisions
  record rounds 29 and 30; CT-220's row names the route (unit, product, seam). Declined: none.

- Round 31 (on `1f6929db`): none clean. Breaks folded: the `fabric_question_ask` route promised a resubmission nobody
  could trigger (the answer wakes nobody and `fabric_question_check` reads only the asking project's questions); the
  question now names the request, its thread, the step and who resubmits, and the reply tells the requester the
  request is submitted again only on the operator's word relayed to it, the unacted answer a named risk (product); the
  DEC-0158 note still said every answer starts the next run (unit, seam); the adapter's dispatched-run reference allows
  only its gate question, now owed the no-person route (seam). Risks folded: the second question to the operator
  named beside "once per task"; Fabric's wake "asked of", not "owed"; FLW-29 Q1 takes the step only on the operator's
  word; the attribution in two notes; §3.10's overclaim and a run on another machine in the `add1df7c` step and OW-3;
  checks added to the CT-292, CT-285 and CT-250 notes (unit, product, seam). Kept open: the 2026-11-07 decision's
  reach under `46167c9f` and `add1df7c` (product, risk). Declined: none.

- Round 32 (on `5c72505e`): product clean; unit and seam not clean. Breaks folded: round 31's reply rule kept only
  "the operator's word relayed to it" in four restatements, against the same sentences' owner case; DEC-0156 item 3,
  the OW row, FLW-29 Q1 and SCN-057 now add "or by the operator's own session when they own the requesting Project"
  (unit); the DEC-0158 note's only question-route check passed with OS-6's contradiction in place (OS-6 at `cb7009d7`
  asks nothing at OW-3's first two waits); it now states the question at those two stops, ends its range at OS-7, and
  checks both the bullet and the table form, and the relay is made to DEC-0158's handoff (seam). Risks folded: the
  `add1df7c` step says "asked", not "owes"; four summaries carry the relayed-word condition; the next run after a PM
  agent's non-operator answer asks directly, names the request and posts the reply's notice in its thread; a run on
  another machine writes `answered` with the open step (a `blocked` result posts nothing and counts as an empty run, three runs in all);
  the CT-285, CT-250 and CT-293 notes check every place they name; the table-form checks cover each bullet-form one;
  CT-220's range reads 25 to 32; the round-31 fold's checks recorded (unit, product, seam). Declined: none.

- On the round-32 fold (`cc9bf40d`): `pnpm run check` exit 0 (11175 tests, read by round 33's unit reading).
- On the round-33 fold: `pnpm run check` failed only on `test/validate-cli.test.ts`'s afterAll hook timing out at 10 s under a parallel test run; that file alone then passed (1956 tests), and `docs:check`, `ux/lint.py` and `privacy:check` exit 0 (the fold changed only Markdown).
- Round 33 (on `cc9bf40d`): seam and product clean; unit not clean. Break folded: a run without the board's tools
  settles `answered`, which OW-3's "save for two things" and its resubmission rule (`failed_known` only) did not cover,
  so an FA-09 act there could be resubmitted at once; OW-3 now names that settlement, has such a run write each open
  step's resubmission, and extends the rule to a request so `answered`; DEC-0156 item 3 and the OW row read it as
  `failed_known` is (unit, seam). Risks folded: Fabric runs a blocked remote result three times in all, two of them
  reruns (seam); item 3 lists an answered question among what lets a no-person session take the step (unit); the
  `add1df7c` step's two asks split (unit); Fabric's board shows such a request as failed (known) outside «Ждут ответа»,
  owed in the Compatibility and the `add1df7c` step (product); CT-220's row names the operator's session as the one
  who resubmits (product); CT-250, CT-285, CT-292 and CT-293 rows link this handoff's notes, the CT-285 note checks
  its row's correction, the DEC-0159 note checks SCN-044's update question, Coverage and SCN-059's OW-4, the DEC-0158
  note requires rows for OW-3's third wait and own stop and a no-board-tools run, and checks "starts no run" in
  bullet form (seam). Declined: none.

## Next task

Round 34 blind readings of branch `agent/ct220-operators-word-v2` (DEC-0156), all three tiers.
