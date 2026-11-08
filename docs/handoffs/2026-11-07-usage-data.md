# Handoff: anonymous usage and error data (DEC-0157, CT-216)

## Objective

Answer CT-216 (due as a first draft by 2026-11-09): whether a product declares its anonymous usage and error data,
what anonymous leaves out, that a switch is honoured, and how it relates to activity telemetry, on the operator's
decision of 2026-11-04.

## Done

- DEC-0157 reserved by git CAS on 2026-11-07 and drafted (Proposed); the register's next free id line reads `DEC-0160`
  after the merge of `origin/main` on 2026-11-08 (the CAS counter's next value then).
- [Usage data](../specification/usage-data.md): UD-1 (on by default, told once by a notice that is not a question, no
  answer meaning on, told again when the notice changes),
  UD-2 (the product's own switch), UD-3 (anonymous), UD-4 (the switch is the person's, a `relayed` action on the
  product's side), UD-5 (no machine declaration yet), UD-6 (not activity telemetry; an operations digest kept on its
  machine is not usage data, and a collector sends digests off it only for a product whose switch is on and whose
  notice was shown), and the practice in the estate; hosted services that install nothing are outside the page.
- Conformance: a product row, an agent row, the OD-9 declarer's row and the collector's row restated with UD-6.
- The pointers: [operations digests](../specification/ops-digest.md) OD-6 and its Not decided here point to UD-6;
  [activity telemetry](../specification/activity.md)'s purpose points to UD-6's channel separation.
- CONTEXT's "Usage data" entry; SCN-043's alt path for UD-4 and its Coverage in `docs/ux/scenarios.md`; DOCMAP and the
  spec README rows; CT-216 in progress.
- Practice read before drafting: the consent rules of the estate's growth and experiments service; Fabric
  ADR-0127 and `docs/ANALYTICS.md`; Fabric Switchboard `docs/ANALYTICS.md` (SB-246). Read in rounds 3 and 4: Fabric's
  `i18n/en.ts` notice and its on-demand sessions specification §8 (`7dce3758`); Switchboard's `src/main.ts`, SCN-073
  and SB-299; that service's revenue attribution; Fabric Inbox's B-200; Fabric Dashboards' FD-136;
  the adapter's FAA-202; the launcher's `docs/analytics-events.md` (PC-123). Read in round 6: Fabric's digest collector
  (`apps/desktop/src/shared/opsDigestCollect.ts`, `apps/desktop/src/main/opsDigestSend.ts` at `eafcf2e4`, CO-503);
  Fabric Dashboards' `src/mcp/actions.ts` and `src/core/settings.ts` at `d43c94e` (FD-175); that service's consent rules (they delete the installation id at off); the adapter's tags (v0.77.0) and FAA-202; Switchboard's
  `docs/ANALYTICS.md` (the operator's words). Read in round 7: the knowledge base's roadmap RM-13 and plans.md item D;
  Fabric's `i18n/en.ts` at `eafcf2e4` (lines 864 and 868 to 870); Fabric Dashboards' `src/core/i18n.ts` (lines 86 to
  88) and `src/core/analytics.ts` at `d43c94e`; Fabric Inbox's `desktop/main.cjs` line 937 at `1395416`; Switchboard's
  `src/main.ts` line 109 and `crates/switchboard-cli/src/mcp.rs` line 72 at `c762821`; Observatory's encrypted workspace snapshot. Read in round 8: Switchboard's `crates/switchboard-runtime/src/analytics.rs`
  (lines 315 to 322 and its test at line 1377) and `docs/ANALYTICS.md` lines 19 to 23 at `405b789`; Fabric Inbox's
  `desktop/analytics.cjs` line 295 at `1395416`; Fabric Dashboards' `src/core/analytics.ts` lines 9 to 11 and 49 to 62
  at `d43c94e`; the launcher's `lib/analytics.js` (lines 31 and 148 to 155) and `docs/analytics-events.md` (lines 50
  and 57 to 64) at `ad978a6`; Fabric's `apps/desktop/src/main/opsDigestSend.ts` lines 10 to 12 and 45 to 47 at
  `eafcf2e4`; Observatory's HTTP door for `ops.digest.record` and its compatibility record (OBS-330 the digest capability, OBS-331 the daily learning review);
  the knowledge base's RM-13 (Okolos's practice, the ePrivacy question) at `c84c7a40`. Read in round 9: the session
  ids of Switchboard (`crates/switchboard-runtime/src/analytics.rs` lines 415 to 424, and its id creation at line 149,
  at `405b789`), Fabric Inbox (`desktop/analytics.cjs` lines 81 and 184 to 191, `desktop/main.cjs` line 662, and
  `docs/agents/mcp.md` line 278 for `get_ops_digest` at `1395416`), Fabric Dashboards (`src/core/analytics.ts` lines 62
  and 128 at `d43c94e`) and the launcher (`lib/analytics.js` lines 56 and 244 at `ad978a6`); Fabric's id creation
  (`apps/desktop/src/main/analytics.ts` line 70) and `en.ts` line 864 at `eafcf2e4`; the notices of Switchboard,
  Fabric Inbox, Fabric Dashboards and the launcher for a session id (none names one); the contract's AP-4
  (`service.md`) and DL-26 (`delegation.md`). Read in round 10: Fabric's `apps/desktop/src/main/analytics.ts` (lines 88
  to 96, 192 and 305 to 308) and `apps/desktop/src/main/index.ts` line 1311 at `eafcf2e4`; Fabric Inbox's
  `desktop/analytics.cjs` lines 96 to 103 and line 434 (its exports; no caller) at `1395416`; the estate's hosted
  workspace product's ADR-0014 (lines 24 and 37) at `43f04f15`; the knowledge base's plans.md launcher row (PC-137) at
  `c84c7a40`; the contract's AP-1 (`service.md`) and data classes (`governance-and-roles.md`).
- OQ-0013 (the second purpose, for the operator) taken under the lease on `docs/OPEN_QUESTIONS.md` (no `OQ` register in
  the coordination config); the file's next free id line reads `OQ-0014`.

## Open

- The coordinator's blind readings until two consecutive clean rounds; the gate; the pull request, merge, tag and
  release; at merge DEC-0157 Accepted and CT-216 done, and the products told on the board what each owes, as
  DEC-0157's Compatibility lists it (Fabric, with the collector row's UD-6 condition as the digest collector, and
  UD-2's rule on writing at CO-496, since its switch writes the shared `analytics` field both ways;
  Switchboard; Fabric Inbox, its exported shared-field writer kept uncalled; Fabric Dashboards, FD-175 included; the
  estate's hosted workspace product, whose self-hosted image owes UD-3's session id; the estate's growth and experiments service; the adapter; Okolos and Observatory to
  check themselves, Observatory also that its encrypted snapshot's key is the person's; the hosted products of
  plans.md item D only where they ship an installed product; the operator asked OQ-0013); the board message says each
  product's install and active counts move at the version that meets UD-1 and UD-2 (they drop where the product sent
  before its notice or past an earlier no, Switchboard, Fabric Inbox and Fabric Dashboards; they rise where it waited
  for an answer, Fabric at CO-496; an id a product owns, made anew at re-enable, counts that install again), and that
  version should be marked where counts are read; that the five creators of the shared file read (Fabric, Switchboard,
  Fabric Inbox, Fabric Dashboards, the launcher) meet UD-3's random id and a creator not read owes it; that every
  product but Fabric owes naming its session id in its notice (UD-1), and Fabric Dashboards and Fabric renewing it after
  an idle hour (UD-3, both one per process today); that where the list of the products sharing the id lives is their
  owners' choice, the estate's privacy page on passioncode.ai (PC-137) being one home; and, for the DEC-0156 branch,
  the sentence naming UD-4's switch beside OW-5's limits (a mandate from the operator's words never turns a declined
  switch back on); the knowledge base's RM-13 and plans.md item D pointed at `usage-data.md`.
- A question for the operator, [OQ-0013](../OPEN_QUESTIONS.md): does "only for this" («Все, только для этого») admit
  the second purpose, counting one installation once across the products that share its id? DEC-0157 reads it so; the
  page marks that reading and the notice wording that follows from it as provisional until he answers.
- The operator's ePrivacy answer (the knowledge base's RM-13, okolos B-216): until it, UD-1 lets a product ask first
  where the platform's own consent or a market's privacy review needs it.
- Parallel branches: DEC-0156, DEC-0158 and DEC-0159 are open on their own branches. Whichever of them and DEC-0157
  lands second resolves `docs/DECISIONS.md`, `docs/handoffs/README.md` and `docs/backlog.md` keeping both sides, and,
  for DEC-0156, adds the sentence naming UD-4's switch beside OW-5's limits (a mandate from the operator's words never
  turns a declined switch back on).

## Decisions taken here

- No UX scenario in this contract: the notice and the switch are each product's screens (Fabric's SCR-52 and SCN-134,
  which owe UD-1 and UD-2 under its CO-496 rewrite); the
  contract's UX documents describe contract surfaces, and none carries this. UD-4 is an agent's refusal with no surface
  of its own: it is an alt path of SCN-043 (the agent answers in its chat that the switch is the person's), with no new
  screen or flow.
- A shared installation id is not rotated at off (UD-2): rotating it would split one person's installs across every
  product that reads the file; the product only stops sending it.
- No machine declaration (UD-5): no host reads one; the safer reversible choice is to add it when a host asks.
- UD-6 against OD-9 (round 6): a digest kept on its machine is counts a product keeps about itself, not usage data, so
  the declaration a local collector reads stands whatever the switch says; the condition sits where data leaves the
  machine. The other reading (a declaration kept only while the switch is on) would stop a product that collects no
  usage data from declaring its digests to a local collector at all.

## Rounds

- Round 1 (on `f73791f4`, product tier only), not clean: the Compatibility said Fabric and Switchboard met UD-2, which
  they cannot on a shared id (now: only an owned id is deleted and rotated); Fabric's practice was described from
  ADR-0127, which its CO-496 replaces; UD-2 allowed one switch for several products against the operator's "per
  product"; UD-4 contradicted itself and named no word for a person who is not the operator; growth's no-switch
  exception was not named; UD-6 described activity telemetry as the operator's own; no CONTEXT entry. Risks folded:
  UD-3's path limited to the person's machine and its own code allowed, the kept decline sourced to `cbea0b76`, Fabric
  Inbox and the launcher named, UD-4's surface reasoned.

- Round 2 (on `04bedf9c`, product tier only), not clean: UD-2 dropped a decline given under Fabric's shared switch
  ("one switch for every PassionCode app"), which Switchboard then overrides (now a decline under a prompt that said it
  governed this product counts, and Switchboard owes it); growth's practice was overstated (now: what it meets and what
  it owes, the switch in the notice, paths and received content, the re-enable of a shared id). Risks folded: UD-4's
  switch is a `relayed` action, not AP-4's consent; UD-1's notice at the first start that opens a window, and for an
  existing install after the version that turns it on, naming the installation id; MUST in UD-1 and UD-5; "anonymous"
  defined as no person named, not unlinkable; Switchboard's stale line named; the README maturity cell; SCN-043's alt
  path for UD-4; a product may collect nothing.

- Round 3 (on `4a619691`, all three tiers), not clean: unit, UD-1's notice never fired for a product with no window
  (now its first output to the person, and no collection before a notice where it has no such place), and DEC-0157's
  Context said Switchboard reads only the shared id (now: and the shared field to carry over an answer given under
  its earlier rule); product, "anonymous" understated how a shared id links every product that sends it (now UD-1's
  notice says whether the id is shared and with which products, and UD-3 says it ties them), and UD-3 ruled only on
  what the data carries while growth's revenue attribution links an install's id to a purchase (now: the product and
  every service it sends to MUST NOT join the id with an account, purchase, billing or advertising record; joined data
  is `personal`, needs its own consent and is never called anonymous); seam clean. Risks folded: UD-4 names which AP-2
  forms carry the operator's word and never refuses a person who asks for off; AP-4 glossed as a human gate; UD-6 places
  operations digests; UD-2 says off removes nothing already sent and UD-5 that each product documents retention and
  erasure; every id, owned or shared, is a random UUID; Compatibility names Switchboard's SB-299 door, Fabric Inbox's
  kept decline, the adapter's FAA-202, growth's and Fabric's notice debts, and Fabric's on-demand specification §8 for
  CO-496; growth's re-enable is a debt (never rotating an id it does not own); DOCMAP, the conformance rows and the
  CONTEXT entry restate the rules; scenarios.md is in Consequences and SCN-043's Coverage cites UD-4.

- Round 4 (on `a71a91f1`), not clean on any tier: unit and seam, the spec README's cell said Fabric Inbox was not read
  while the Compatibility read it (now restated from the Compatibility); product, a product could send before anyone
  was told (now nothing is sent before the notice, for a windowless product or one that starts without its window too),
  and an erasure route by id stopped working once off deleted the id (now UD-5 keeps it working or says sent data cannot
  be erased); the README cell as above. Risks folded: one name, the installation id, owned or shared; the purpose
  "counting one installation once"; the notice says turning back on resumes a shared id, whose writer can reset it;
  UD-3's id a MUST, not a user identifier, unjoined data `project-internal`; UD-4 never takes a mandate (the switch is
  `change-policy`, MD-3) and points anyone but the operator to the setting for off; UD-5 names the id, its sharing, the
  version that turned collection on and erasure "and how"; UD-6 covers digests the collector sends off the machine;
  the Compatibility adds Fabric Dashboards (FD-136), the launcher (read, PC-123), Okolos, Observatory and the hosted products (not
  read), qualifies the kept decline by the prompt, FAA-202 as open, Switchboard's UD-1 as partial; `cbea0b76` cited
  neutrally (the products attribute it differently); RM-13 named; the handoff's Open lists the board, the knowledge
  base and the DEC-0156 cross-reference.
- On `a71a91f1` (round 4's readers): `pnpm run docs:check` exit 0, `python3 docs/ux/lint.py` exit 0, privacy check 0
  findings, no U+2014 in the added lines.

- Round 5 (on `d0c0880d`), not clean on any tier: unit, UD-5's erasure sentence contradicted itself and its
  restatements (now one rule in all three: the id shown beside the switch and the route kept, or the end of erasure said
  there); product and seam, Switchboard, Fabric Inbox and Fabric Dashboards send before their notice (now their debt,
  "most of UD-1" dropped), the launcher's notice lacks UD-1's contents (now its debt), an off set in a shared setting was
  no decline (now a prompt or a setting counts), "only to improve" understated the shared id's purpose (now both
  purposes in the page's opening, UD-1 and CONTEXT), the notice did not have to say the data is linkable (now it does),
  and the digest collector's row did not follow UD-6 (now a product keeps its OD-9 declaration only while its switch is
  on and its notice shown, and the collector sends off the machine only a standing declaration's digests). Risks folded:
  the shared id has no one owner (a reset is the sharing products' joint decision); a product that creates an id makes
  it random; RM-13's ePrivacy question cited; a line only an agent's tool reads is no notice; data sent at once after the
  notice is said; SCN-043 in the third person; Fabric's misleading strings named; DEC item 1's conjunction; `cbea0b76`
  cited neutrally in the DEC; UD-3's exclusion phrase alike in the row and CONTEXT; a hosted product of the estate no
  longer named (privacy check).
- On `d0c0880d` (round 5's readers): `pnpm run docs:check` exit 0, `python3 docs/ux/lint.py` exit 0; privacy check
  found the hosted product's name, now removed.

- Round 6 (on `23e3470b`, all three tiers), not clean: all three tiers found UD-6 contradicting OD-9 (a product's
  declaration kept only while its switch was on, beside "UD-1 to UD-5 do not govern it while it stays on that
  machine"; now a declaration stands whatever the switch says, a digest kept on the machine is not usage data, and the
  condition sits on sending: a collector sends a product's digests off the machine only for a product whose switch is
  on and whose notice was shown, never for one with no switch, stated alike in UD-6, DEC item 6, the product, declarer
  and collector rows, DOCMAP and the Compatibility, with pointers from OD-6, ops-digest.md's Not decided here and
  activity.md's purpose); the product row's UD-3 clause was narrower than UD-3 (now UD-3's words); the Compatibility
  named Project Observatory the digest collector (now Fabric, CO-503, which sends only its own lines to the local
  Observatory over stdio; Observatory is the store, OBS-330, OBS-331); Fabric Dashboards' MCP `settings` tool lets any
  agent turn the switch on (FD-175, gate `none`; now its UD-4 debt, and UD-4's product side: a switch offered to
  agents is a `relayed` action whose tool's effect is `change-policy`); Fabric Inbox's OD-9 declaration (B-210) now
  conforms; the README cell named the launcher's notice place, Observatory as the digest store and FD-175. Risks
  folded: the second purpose recorded in Why as the coordinator's reading of the operator's words, and "when its id is
  shared" in DEC item 1; "when it sends one" for the installation id in UD-1 and UD-5; UD-3 tells the installation id
  from activity telemetry's `user.id`, RM-13 kept; the notice shown again when what it states changes (`noticeVersion`
  as the model); erasure at uninstall and under a shared id (UD-5); UD-4's "never refused" now "does not decline", the
  product's own checks applying; hosted services that install nothing are outside the page; the growth service's deletion of its id at off and FAA-202's passed target in the Compatibility; the merge of `origin/main` (DOCMAP, the handoffs
  index and the spec README resolved keeping both sides).
- On the round 6 fold (this commit's tree): `pnpm run docs:check` exit 0, `python3 docs/ux/lint.py` exit 0,
  `pnpm run privacy:check` exit 0, no U+2014 in the lines the branch adds against `origin/main`.

- Round 7 (on `31769213`, all three tiers), not clean: product, UD-1 let a product hold its first send until the
  notice was answered and called Fabric's answer-first question conforming, against the operator's decision as the
  knowledge base records it (roadmap RM-13 "replaces the earlier answer-first rule", plans.md item D "a notice at first
  start (not a question)"; now the notice is not a question, a product may hold its first send until it was shown,
  never until answered, no answer means on, and Fabric's question, ADR-0127, SCN-134, `en.ts` lines 868 to 870, is a
  UD-1 debt in the practice paragraph, the Compatibility and the README cell); seam, the Compatibility missed notice
  contents owed by shipped notices (now Fabric Dashboards owes the id, its sharing, the tying of events, the resume and
  the purpose; Fabric Inbox the named products and the resume; Fabric the named products, the tying and the resume;
  Switchboard the resume). Risks folded: `noticeVersion` "marks a new notice"; UD-6's "digests sent off the machine, by
  whoever sends them", a store that later sends them is a collector, a collector that cannot read a product's switch
  and notice state sends none off the machine, an encrypted backup to the person's own storage under the person's key
  is no sending (Observatory's to confirm for its snapshot); UD-4's product side keeps an accepted `approval/1` deciding
  the action under AP-2, with the reason no product-side refusal is added; CONTEXT's UD-3 words; `cbea0b76` cited
  neutrally in the DEC's Context, `docs/handoffs/README.md` in Consequences; the second purpose marked provisional on
  the page, in DEC item 1, the Why, the product row and CONTEXT, and listed as a question for the operator; UD-2's
  shared-file off a decline only where its words governed every reader, Fabric's window closing at CO-496; counts drop
  at the conforming version, said in the Compatibility, the practice paragraph and the Open board message;
  Switchboard's UD-4 (SB-299, `mcp.rs` line 72) and the adapter's UD-2 and UD-4 (FAA-202) in the practice paragraph;
  the parallel branches' merge order in Open.
- On the round 7 fold (this commit's tree): `pnpm run docs:check` exit 0, `python3 docs/ux/lint.py` exit 0,
  `pnpm run privacy:check` exit 0 (0 findings), `pnpm vitest run test/consistency.test.ts test/docs-check.test.ts` 45
  tests passed, `git merge-tree --write-tree HEAD origin/main` exit 0, no U+2014 in the lines the branch adds against
  `origin/main`. Not the full gate.

- Round 8 (on `8e2a10de`, all three tiers), not clean: product, UD-1 forbade asking first while UD-3 left consent to
  each product's privacy review and RM-13 records Okolos's Firefox build following Firefox's built-in data consent
  (now UD-1: where the platform's own consent or a market's privacy review needs an answer first, the product asks
  there, sends nothing until answered and treats no answer as off there, no UD-1 debt pending the operator's ePrivacy
  answer, RM-13, okolos B-216; Okolos's practice stated from RM-13 in the practice paragraph, the Compatibility and the
  README cell); product and seam, the launcher was said to meet UD-2's kept decline while UD-2 let later shared offs
  bind other products until CO-496 (now UD-2 follows RM-13, "an explicit earlier «no» stays off", and plans.md item D,
  "one product's switch never turns another off": a shared off written under words that governed every reader is a
  decline for a product only when given before that product first sends, and after its first send its own switch alone
  governs it; the "window until CO-496" removed; the launcher meets UD-2's kept decline and owes UD-1's notice contents
  and a notice where the person reads it, cited at `ad978a6`; Switchboard, Fabric Inbox and Fabric Dashboards owe
  reading an earlier shared no before their first send, each cited from its code; Fabric's line 864 named a false
  promise for a product that has already sent, read until CO-496 ships). Risks folded: the operator's whole first
  sentence quoted in Why, and an acknowledgement (an OK) may be offered with nothing waiting on it; the notice names the
  sharing products as of its version with a link to one maintained list, the re-show due at the product's next version
  that ships the updated list; OQ-0013 for the second purpose, cited from the page, DEC item 1, CONTEXT and Open; the
  scope covers an account or server of the person's and a component shipped to run on their own server (Fabric Inbox's
  server); the product row's UD-5 clause keeps the erasure route working; UD-1's "MAY hold" now "holds ... and MUST NOT
  hold it until answered" in the page, DEC item 1 and the row; UD-4's forms add an `approval/1` the operator gave for a
  T2 or untiered caller (DL-18) in the page, DEC item 4 and the agent row; the Compatibility says UD-6 is met on
  Fabric's stdio path only, CO-503's planned delegated path owing UD-6's condition and a test, and cites OBS-330 for the
  store, not OBS-331 (Observatory's daily learning review).
- On the round 8 fold (this commit's tree): `pnpm run docs:check` exit 0, `python3 docs/ux/lint.py` exit 0,
  `pnpm run privacy:check` exit 0 (0 findings), `pnpm vitest run test/consistency.test.ts test/docs-check.test.ts` 45
  tests passed, `git merge-tree --write-tree HEAD origin/main` exit 0, no U+2014 in the lines the branch adds against
  `origin/main`. Not the full gate.

- Round 9 (on `1d3c5f2e`, all three tiers), not clean: product, UD-3 let a product send only a UUID while every
  shipped Aptabase product sends a per-session id of the SDKs' form (Unix seconds times 10^8 plus 8 random digits,
  renewed after an idle hour; Switchboard's `analytics.rs` lines 415 to 424 at `405b789`, Fabric Inbox's
  `desktop/analytics.cjs` lines 184 to 191 at `1395416`; Fabric's notice names "a session id", `en.ts` line 864; now
  the installation id a product sends is a random UUID, and a session id, random, kept only in memory and renewed no
  later than after an idle hour, MAY be sent, being no installation id and tying one session's events; UD-1's notice
  names a session id when one is sent; Switchboard, Fabric Inbox, Fabric Dashboards and the launcher owe naming theirs,
  and Fabric Dashboards, one per process at `src/core/analytics.ts` line 128, owes renewing it after an idle hour);
  product, "counts drop at the conforming version" was wrong for Fabric, whose never-answered installs send nothing
  today (now counts move: they drop where a product sent before its notice or past an earlier no, rise where it waited
  for an answer, Fabric at CO-496, and an owned id made anew at re-enable counts that install again); product, UD-6
  had no place for Fabric Inbox's server digest read (`get_ops_digest`, `GET /api/ops-digest`, its
  `docs/agents/mcp.md` line 278, B-205; now a read of a product's or a component's digests by the person, or by an agent
  acting for them, on machines or accounts of theirs, where no product owner receives the data, is not sending off the
  machine, the encrypted backup being such a case, and the Compatibility names Inbox's read as allowed); seam, UD-4
  called the switch relayed in UD-1's ask-first places too, against AP-4 and DL-26 (now turning it on there is AP-4's
  consent, `gate: human` with `humanStep` `consent`, the agent handing the person the link, and turning it off stays
  relayed, in UD-4, DEC item 4 and the product and agent rows). Risks folded: UD-2 states what the conforming version
  does for an install that sent before it (a shared off present at that version's first run, on an install whose own
  switch was never set, is the earlier no; named in Switchboard's, Fabric Inbox's and Fabric Dashboards' debts) and,
  since the shared file records neither writer nor words, treats any shared off present before the first send as that
  earlier no; the tying of events added to Switchboard's and Fabric Inbox's notice debts; the Compatibility says the
  five creators read meet UD-3's random id, each cited, a creator not read owing it, and the board message in Open
  matches; the Why gives the reason hosted services are out, and the switch of a component an organization deploys on
  its own server is that organization's, its members told by the notice (page, DEC item 1, product row); DEC item 1's
  re-show clause "where the person reads it, before data is sent under the change"; UD-4's T2 qualifier dropped from
  the operator's `approval/1` (UD-4, DEC item 4, agent row) and the elicitation named as the operator's answer to the
  product's own elicitation (AP-2); the DOCMAP cell says usage data is not activity telemetry; SCN-043's alt path hands
  the `consent` link where an answer is asked first. Privacy (the coordinator's item): the estate's growth and
  experiments service, a private repository, is now named only by that description, with no path, line, commit or
  internal id, and Project Observatory only by product name and OBS ids, with no repository paths.
- On the round 9 fold (this commit's tree): `pnpm run docs:check` exit 0, `python3 docs/ux/lint.py` exit 0 (40 stories, 34
  flows, 34 screens, 56 scenarios), `pnpm run privacy:check` exit 0 (0 findings), `pnpm vitest run
  test/consistency.test.ts test/docs-check.test.ts` 45 tests passed, `git merge-tree --write-tree HEAD origin/main` exit
  0, no U+2014 in the lines the branch adds against `origin/main`, and no name of the private growth service in the
  branch's diff. Not the full gate.

- Round 10 (on `014fc3fc`, all three tiers), not clean: product, UD-2 had no rule on writing the shared file's
  `analytics` field while Fabric's switch writes it both ways (`writeAnalyticsSwitch`, `apps/desktop/src/main/analytics.ts`
  lines 88 to 96, `setEnabled` lines 305 to 308 at `eafcf2e4`), so its off decided for every product not yet sent and
  its on erased an earlier no (now a product's own switch MUST NOT write the field, and one whose switch wrote it under
  words that governed every reader stops from the version whose switch governs it alone and leaves an off already
  written, in UD-2, DEC item 2, the product row, CONTEXT and DOCMAP; CO-496 owes it, and Fabric Inbox's exported
  `writeSwitch`, `desktop/analytics.cjs` lines 96 to 103 at `1395416`, is uncalled and stays so, in the practice
  paragraph, the Compatibility and the README cell); seam, Fabric's session id is one per process and never renewed
  (`analytics.ts` line 192, `createAnalytics` once at `index.ts` line 1311, at `eafcf2e4`; now Fabric is in the
  session-id list and owes UD-3's renewal beside Fabric Dashboards, in the practice paragraph, the Compatibility, the
  README cell and the board message above). Risks folded: the session ids' form "whose form UD-3 admits", Switchboard
  and Fabric Inbox meeting UD-3's session-id rule and Fabric Dashboards and Fabric owing its renewal, "so their meets
  UD-3 stands" dropped; UD-4's ask-first off a separate `relayed` action (a combined one would be `human` both ways),
  in UD-4, DEC item 4, the product and agent rows and DOCMAP; UD-3's "Neither id", and an id bound to an account or
  joined leaves UD-3, its data at least `personal` (a stricter class the privacy review's); UD-6's sending defined as
  to anyone but the person (a product owner or another party, the operator reading his own machines counting as the
  person), the condition binding the products under the page, a hosted service's digests on its own server its own, in
  UD-6, DEC item 6, the product and collector rows, OD-6 and ops-digest.md's Not decided here, CONTEXT, DOCMAP and the
  README cell; UD-4's product side: a service whose app or page offers its switch offers it on its agent surface as
  AP-1 requires, a product outside `fabric-service/0.1` (the launcher) declaring it the same way; the list of sharing
  products' home the owners' choice, the estate's privacy page on passioncode.ai (PC-137) one home, each product's own
  copy until then (UD-1, DEC item 1, product row, board message); the estate's hosted workspace product (a private
  repository, named by that description): its hosted service outside the page, its self-hosted image under it with the
  organization's switch and owing UD-3's session id (per server process per UTC day, its ADR-0014 line 24 at
  `43f04f15`), no self-hosted instance yet (line 37), in the practice paragraph, the Compatibility and the README cell;
  the DEC-0156 sentence repeated in the board message; "sends none of them outward" and "sends no digest outward".
- On the round 10 fold (this commit's tree): `pnpm run docs:check` exit 0, `python3 docs/ux/lint.py` exit 0 (40 stories, 34
  flows, 34 screens, 56 scenarios), `pnpm run privacy:check` exit 0 (0 findings), `pnpm vitest run
  test/consistency.test.ts test/docs-check.test.ts` 45 tests passed, `git merge-tree --write-tree HEAD origin/main` exit
  0, no U+2014 in the lines the branch adds against `origin/main`, and no name of a private personal repository in the
  branch's diff. Not the full gate.

## Next task

Round 11 of the blind readings of branch `agent/ct216-usage-data-20261107` (DEC-0157), all three tiers.
