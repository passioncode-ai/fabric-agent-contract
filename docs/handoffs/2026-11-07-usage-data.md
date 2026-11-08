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
  machine is not usage data, and a collector sends digests to anyone but the person only for a product whose switch
  is on and whose notice was shown), and the practice in the estate; hosted services that install nothing are outside the page.
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
  ids of Switchboard (`crates/switchboard-runtime/src/analytics.rs` lines 417 to 426, and its id creation at line 149,
  at `405b789`), Fabric Inbox (`desktop/analytics.cjs` lines 81 and 184 to 191, `desktop/main.cjs` line 662, and
  `docs/agents/mcp.md` line 278 for `get_ops_digest` at `1395416`), Fabric Dashboards (`src/core/analytics.ts` lines 62
  and 128 at `d43c94e`) and the launcher (`lib/analytics.js` lines 56 and 244 at `ad978a6`); Fabric's id creation
  (`apps/desktop/src/main/analytics.ts` line 70) and `en.ts` line 864 at `eafcf2e4`; the notices of Switchboard,
  Fabric Inbox, Fabric Dashboards and the launcher for a session id (none names one); the contract's AP-4
  (`service.md`) and DL-26 (`delegation.md`). Read in round 10: Fabric's `apps/desktop/src/main/analytics.ts` (lines 88
  to 96, 192 and 305 to 308) and `apps/desktop/src/main/index.ts` line 1311 at `eafcf2e4`; Fabric Inbox's
  `desktop/analytics.cjs` lines 96 to 103 and line 434 (its exports; no caller) at `1395416`; the estate's hosted
  workspace product's ADR-0014 (lines 24 and 37) at `43f04f15`; the knowledge base's plans.md launcher row (PC-137) at
  `c84c7a40`; the contract's AP-1 (`service.md`) and data classes (`governance-and-roles.md`). Read in round 11: the
  launcher's `lib/analytics.js` lines 192 and 244 (one session id per run's one send) and line 31 at `ad978a6`; Fabric
  Inbox's `desktop/fabric-descriptor.cjs` and `desktop/main.cjs` line 937 at `1395416`; Fabric's
  `apps/desktop/src/main/index.ts` line 4201 (`analyticsSetEnabled`) and `i18n/en.ts` lines 862 to 871 at `eafcf2e4`;
  Switchboard's `src/main.ts` line 109 at `b99a17b` (no manifest in its tree); Fabric Dashboards' `src/core/i18n.ts`
  lines 84 to 89 at `d43c94e`; the knowledge base's plans.md items C and D (lines 109 and 110) and roadmap RM-13 (lines
  563 to 575) at `c84c7a40`; the contract's interop C3.1, AP-1's actions extension (`service.md`) and the data
  classification table (`governance-and-roles.md`).
- OQ-0013 (the second purpose, and since round 11 the hosted services' scope, for the operator) taken under the lease on `docs/OPEN_QUESTIONS.md` (no `OQ` register in
  the coordination config); the file's next free id line reads `OQ-0014`.

## Open

- The coordinator's blind readings until two consecutive clean rounds; the gate; the pull request, merge, tag and
  release; at merge DEC-0157 Accepted and CT-216 done, and the products told on the board what each owes, in one
  message on the plans thread `e1cb9f7e` (where each product reports plans.md items A to D) addressed to every product
  owner, with a general line first (any product that sends usage or error data checks itself against UD-1 to UD-6
  before its next release) and then a line per product, as DEC-0157's Compatibility lists it (Fabric, with the collector row's UD-6 condition as the digest collector, and
  UD-2's rule on writing at CO-496, since its switch writes the shared `analytics` field both ways,
  and, now and independently of CO-496, a string-only correction of its three strings that say its switch governs
  every app, `i18n/en.ts` lines 864, 869 and 870, and an agent twin for its switch (UD-4) at CO-496;
  Switchboard, with an action for its switch and a manifest capability for that tool (UD-4), and UD-1's purpose in its
  notice (its "to help PassionCode.ai improve its apps", `src/main.ts` line 109 at `f6f1dc1`, names every app); Fabric Inbox, its
  exported shared-field writer kept uncalled, an agent twin for its switch on its desktop copy (UD-4) and sending
  nothing in a run before its first send (or before its conforming version's stand-in run) in which the shared file
  cannot be read (UD-2, its baseline at `desktop/analytics.cjs` lines 307 to 310), and that its server is counted by
  each member's app under that member's switch, so an organization deploying it holds no switch over those counts (UD-1's
  scope); Fabric Dashboards, the same for its events sent without an id (`src/core/analytics.ts` lines 59 to 60 and 170
  to 171 at `d43c94e`), FD-175 and a manifest capability for that tool included, its switch's action refusing
  `operator-decision-required` without a decision rather than run as the caller's own act (`src/mcp/server.ts` lines
  332 to 333 at `d43c94e`); the launcher (PC-123, before 0.2.76 is tagged):
  UD-1's notice contents and a notice where the person reads it, its doc's agent-only path at
  `docs/analytics-events.md` line 50, and its setup skill UD-4's agent side (its `analytics on|off` is a command line,
  no agent surface, so it owes no action); every product but Fabric Inbox (whose notice names PassionCode.ai as its recipient), that its notice names where
  the data is sent or links its usage data page (UD-1); the analytics host's owner, PassionCode.ai Platform
  (`analytics.passioncode.ai`, PLAT-019): UD-3's join rule for any reader of the raw events it admits (PLAT-133), the
  retention the products state under UD-5 (events deleted after 730 days, installation ids removed after 400 days,
  backups beyond, PLAT-132, its `infra/analytics/README.md` lines 48 to 49 at `e4d1c0e`), with a question: how long
  the weekly droplet backups are kept, which its README does not say, so each UD-5 page can bound how long a deleted
  event survives; that it offers no erasure
  by installation id today, so each product's UD-5 page says sent data cannot be erased unless it files such a route,
  each product's UD-5 page naming that reader and its purpose, and the conforming versions marked where the counts are
  read there; events already received past an earlier no (Switchboard, Fabric Inbox and Fabric Dashboards before
  their conforming versions) cannot be told apart at the host and stay under its retention unless the operator has
  them dropped, his choice; and, through PassionCode.ai Platform, which holds PLAT-019, the second store: Fabric,
  Switchboard and Fabric Inbox's events also sit on the operator's earlier analytics instance in his own account
  (their history copied from it on 2026-10-17; installs older than Fabric 0.3.7, Switchboard 0.6.42 and Fabric Inbox
  0.19.0 sent there until they updated), which keeps events 2 years, removes installation ids after 400 days, has its
  own erasure of the ids the estate's growth and experiments service deleted and an off-host copy of 28 days, and
  which that service and the operator's own estate monitor (reading counts) read, so each of the three products' UD-5
  page states that store, its two readers included, until its apps there are retired (PLAT-019's remainder), and
  PLAT-019's retirement of those apps does not end the store, since Project Observatory sends every install's usage
  data there by default, with the same question, whether Observatory moves to PassionCode.ai's host, as PLAT-019's
  move (so that no PassionCode.ai data stays in a personal project) points to; the owner of PassionCode.ai's privacy page (the
  organization's site repository `passioncode-ai.github.io`, line 60 of `privacy/index.html` and of its nine locale
  copies, `de`, `es`, `fr`, `ja`, `ko`, `pl`, `pt-br`, `ru` and `zh-hans`, at `e7a2ed25`): UD-2's
  switch for each product alone in place of "the switch applies to every PassionCode.ai app", and UD-5's statements
  for every product that sends; the
  estate's hosted workspace product, whose self-hosted image owes UD-3's session id and UD-4's product side (a
  `relayed` action for its switch, which is today only on its Organization page and an admin route recorded as a
  person's act, its MCP server declaring no actions extension), and whose planned well-known declaration of its
  counting (its design doc, line 301) has nothing to declare, since CT-216 lands with no machine declaration (UD-5); the
  estate's growth and experiments service; the adapter; Okolos (which sends to `analytics.passioncode.ai`, so the
  host's reader reads it) to check itself; Project Observatory, which turned usage data on by default in its 0.33.0
  and first sent it from 0.33.1, the first release build carrying its key (OBS-324, OBS-329), and sends it to the
  operator's earlier analytics instance, not PassionCode.ai's host: its notice names no destination (UD-1's "where"),
  and neither its own, unshared installation id nor its session id, which it owes naming (UD-1,
  `observatory/engine/usage_analytics.py` lines 12, 99 to 102 and 288 to 300 at `2a11b3fd`); it owes UD-1's "nothing
  before the notice", since its `flush` checks only the switch and its app key (the same file, lines 558 to 580) and its
  maintenance pass flushes what was queued (`observatory/engine/maintenance.py` lines 1117 and 1125 to 1129 at
  `2a11b3fd`), whether or not its notice was shown at a terminal or on its dashboard; its session id is one per
  process (lines 401 to 409), so it owes UD-3's renewal after an idle hour where a process lives that long; its UD-5
  page states that store (retention, erasure, off-host copy, both readers) and that its OpenRouter attribution
  goes out whatever its usage data switch says (UD-6); that attribution also sends the legacy `X-Title` header
  (`observatory/engine/agent/providers.py` line 93 at `2a11b3fd`), where DEC-0065 has a product add exactly its headers
  and send the current name; it confirms that its encrypted snapshot's key is the person's; and a question for its
  owner and the operator: does Observatory move its usage data to PassionCode.ai's host (PLAT-019)? Until it moves,
  its notice and its UD-5 page name the party that receives the data as the product's maintainers, without naming a
  person; the hosted products of
  plans.md item D only where they ship an installed product, pending OQ-0013; the operator asked OQ-0013); the board message says each
  product's install and active counts move at the version that meets UD-1 and UD-2 (they drop where the product sent
  before its notice or past an earlier no, Switchboard, Fabric Inbox and Fabric Dashboards; they rise where it waited
  for an answer, Fabric at CO-496; an id a product owns, made anew at re-enable, counts that install again), and that
  version should be marked where counts are read; that the five creators of the shared file read (Fabric, Switchboard,
  Fabric Inbox, Fabric Dashboards, the launcher) meet UD-3's random id and a creator not read owes it; that every
  product but Fabric owes naming its session id in its notice (UD-1), and Fabric Dashboards and Fabric renewing it after
  an idle hour (UD-3, both one per process today); that where the list of the products sharing the id lives is their
  owners' choice, the estate's privacy page on passioncode.ai (PC-137) being one home; and, once DEC-0156 is on main
  too, that OW-5's limits name UD-4's switch (a mandate from the operator's words never turns a declined switch back
  on).
- Landing step, the knowledge base (AGENTS.md "After work"), in the same landing: plans.md's Contract row restates
  CT-216 as "what usage data every product shares: UD-1 to UD-6, no machine declaration" (today "what a service
  declares about analytics on by default", line 124 at `c84c7a40`), and roadmap RM-13 links
  `docs/specification/usage-data.md`, and RM-13's sentence placing the analytics backend beyond the organization
  (line 573 at `c84c7a40`, written 2026-10-05, before PLAT-019 went live on 2026-10-17) is restated to name both
  hosts: PassionCode.ai's own self-hosted analytics host, `analytics.passioncode.ai` (PLAT-019), for every product read
  but Project Observatory, and the operator's earlier analytics instance in his own account, outside the
  organization, for Project Observatory (which sends there by default from its 0.33.1) and for the older installs and
  history PLAT-019's remainder retires; RM-13's heading "Product analytics, private by default" (line 563), which
  reads as off by default, becomes "Product analytics, on by default with a per-product switch"; RM-08's "Measurement
  stays local and private by default" (`knowledge/roadmap.md` line 457 at `bdd35d57`), which reads the same way though
  RM-13 ties RM-08's funnel to its answer, is restated as: the funnel's counts are each product's usage data, on by
  default with a per-product switch (RM-13, `usage-data.md`); and plans.md's
  quality-table Contract row (line 146 at `bdd35d57`, "CT-216 by 2026-11-09") is restated as CT-216 done, linking
  `docs/specification/usage-data.md`; then the workspace sync, checked with
  `git -C fabric-workspace grep -n 'usage-data' origin/main -- knowledge/roadmap.md knowledge/plans.md` (non-empty),
  `git -C fabric-workspace grep -n 'backend is hosted outside the organization\|analytics, private by default'
  origin/main -- knowledge/roadmap.md` (empty), `git -C fabric-workspace grep -n 'CT-216 by 2026-11-09' origin/main --
  knowledge/plans.md` (empty), `git -C fabric-workspace grep -n 'Measurement stays local and private by default'
  origin/main -- knowledge/roadmap.md` (empty), and the restated RM-13 section read for both `analytics.passioncode.ai` and Project
  Observatory's own destination.
- A question for the operator, [OQ-0013](../OPEN_QUESTIONS.md): does "only for this" («Все, только для этого») admit
  the second purpose, counting one installation once across the products that share its id? DEC-0157 reads it so; the
  page marks that reading and the notice wording that follows from it as provisional until he answers. Its second
  part: does "every product" reach a service the estate hosts that installs nothing? DEC-0157 reads it as not, marked
  pending in the page's scope and DEC item 1.
- A question for the operator (round 16), carried in the board message's Observatory and Platform lines: does Project
  Observatory move its usage data from the operator's earlier analytics instance to PassionCode.ai's host (PLAT-019)?
  Until it moves, its notice and its UD-5 page name the receiving party as the product's maintainers, without naming
  a person, since the instance sits in a person's account and UD-1's "naming the organization that receives it" has
  no organization to name there. Not filed here as a contract question: the destination is the product's, and the
  contract's rule (UD-1's "where", UD-5) holds either way.
- The operator's ePrivacy answer (the knowledge base's RM-13, okolos B-216): until it, UD-1 lets a product ask first
  where the platform's own consent or a market's privacy review needs it.
- Named residual risks, carried to the closing verdict: senders under the page that no reading here checked against
  it, each a dependant of UD-1 to UD-5 with no test: Project Observatory's own usage data, on by default since its
  0.33.0 and first sent by 0.33.1 (OBS-324, OBS-329), read in rounds 15 to 17 only for its destination (the
  operator's earlier analytics instance), its notice, its installation and session ids, its OpenRouter attribution and,
  in round 17, whether it sends before its notice (it does: its maintenance pass flushes the queue whether or not the
  notice was shown, now a UD-1 debt in the page, the Compatibility, the README cell and the board message), not
  whether its MCP surface offers its switch, Okolos beyond its default
  and its destination (`analytics.passioncode.ai`, read in round 15), and the adapter's kits (FAA-202, planned). The board message's general line asks each owner to check its product before its next release; no row is
  filed here, since each check is its owner's backlog, not this repository's.
- Whether a person needs a switch of their own for OpenRouter attribution that a product sends whatever its usage data
  switch says (Project Observatory, on every request it makes to OpenRouter, `observatory/engine/agent/providers.py`
  lines 76 to 94 at `2a11b3fd`): UD-6 leaves it undecided and asks such a product to say so on its usage data page; a
  question for the operator through Observatory's owner, carried in the board message's Observatory line, not filed
  here as a contract question since DEC-0065 leaves the setting to the product's operator.
- Parallel branches: DEC-0156, DEC-0158 and DEC-0159 are open on their own branches. What this decision requires of
  the merged text binds whichever branch lands second, this one or the sibling: the session that lands it makes each
  edit below in that landing and runs each check on the merged tree, and copies this list with its checks into its
  pull request body (or merge message). If a sibling lands second, this list is on main in this handoff and is
  pointed to from CT-216's backlog row, so its landing session finds it. Every check below is the check of an edit
  named beside it:
  - Registers. The second lander keeps both sides of a conflict in `docs/DECISIONS.md` and `docs/handoffs/README.md`
    (adjacent appends) in id order. A conflict in `docs/backlog.md` is not an append: each branch may rewrite its own
    existing row in place, and two such rows can fall in one hunk, so the second lander takes each row from the branch
    that owns it (CT-216 from this branch, every other row from its own branch), one of each. Checks:
    `grep -c '^| CT-215 ' docs/backlog.md` and `grep -c '^| CT-216 ' docs/backlog.md` each print 1;
    `grep -o '^| [A-Z]*-[0-9]* ' docs/backlog.md | sort | uniq -d` prints nothing. OQ ids have no compare-and-swap
    counter (only `DEC` and `SEM` do), so the second lander also keeps them unique: an `OQ` id taken on both branches
    stays with the branch that landed first, and the other branch's question is renumbered to the next free id, with
    every reference to it and the file's next free id line. Check: `grep -o '^### OQ-[0-9]*' docs/OPEN_QUESTIONS.md |
    sort | uniq -d` prints nothing.
  - With DEC-0156. The second lander writes into the merged OW-1 UD-4's switch as an example of a `change-policy`
    effect its exception covers, whatever form OW-1's list takes; writes into OW-5's limits UD-4's switch (a mandate
    from the operator's words never turns a declined switch back on); and makes UD-4 cite OW-1. Checks, each printing
    at least 1:
    `awk '/^- \*\*OW-1/,/^- \*\*OW-2/' docs/specification/governance-and-roles.md | grep -c UD-4`;
    `awk '/^- \*\*OW-5/,/^- \*\*OW-6/' docs/specification/governance-and-roles.md | grep -c UD-4`;
    `grep -c 'OW-1' docs/specification/usage-data.md`.
  - With DEC-0159. The second lander restates UD-4's ask-first sentence, DEC-0157 item 4 and the conformance agent row
    so that a client-key caller of a cloud instance, on a call the instance refuses for want of the operator, reads that
    refusal in both forms the merged CF-4 gives it, and tells the person the operator was asked: a tool that is not
    job-backed answers `scope-not-granted` with `operator-step: consent`; a job-backed tool answers a job reading
    `working` whose `statusMessage` is `operator-step consent`. It restates UD-4's "the contract adds no product-side
    refusal" (page, item 4) so that it allows CF-4's refusal of a member key's call on a `relayed` action and of an
    approval such an instance cannot check, and adds to UD-4's elicitation clause, on a line that names CF-4, AP-2's
    rule that a cloud instance sends no elicitation to a client-key caller. It also places a cloud instance served to a
    team in UD-1's scope paragraph: an instance on a placement the estate hosts, which installs nothing on a member's
    machine or in an account or server of theirs, is outside the page as a hosted service; an instance an organization
    runs in its own cloud account for its team is under it as a component the organization deploys for its members,
    with that organization's switch, and, until a page for members exists, it sends no usage data about its members'
    calls (in those words), since a member who reaches it only through a client key reads no product output where
    UD-1's notice could be shown first, and UD-1 sends nothing before the notice; a later decision that adds a page for
    members places the notice there. The merged text promises members no notice at a page or in the hand-over of a
    client key. Checks on the merged tree, each printing at least 1:
    `grep -c 'CF-4' docs/specification/usage-data.md`;
    `grep -c 'cloud instance' docs/specification/usage-data.md`;
    `grep -c 'sends no usage data about its members' docs/specification/usage-data.md`;
    `awk '/\*\*UD-4/,/\*\*UD-5/' docs/specification/usage-data.md | grep -c 'operator-step: consent'`;
    `awk '/\*\*UD-4/,/\*\*UD-5/' docs/specification/usage-data.md | grep 'elicitation' | grep -c 'CF-4'` (the
    elicitation line names CF-4);
    `awk '/^### DEC-0157/{f=1;print;next} /^### DEC-/{f=0} f' docs/DECISIONS.md | grep -c 'operator-step: consent'`
    (in the DEC-0157 section);
    and printing 0: `grep -c 'receives the client key' docs/specification/usage-data.md`; then the merged AP-2 and
    CF-2 to CF-4 read against UD-4 and the scope paragraph.
  - With DEC-0158. The second lander re-reads UD-4 against AP-2, AP-3, MD-3 (no mandate covers `change-policy`) and
    DL-26 as merged, and restates any conformance row for a dispatched run, or for a host that starts one, that would
    let a mandate cover the switch, so it agrees with UD-4's agent row (a dispatched run is an agent session, and a
    mandate it carries never covers the switch). Checks, with `<merge>` the second landing's merge commit and `<base>`
    its first parent (`git rev-parse <merge>^1`): `git diff --name-only <base> <merge> -- docs/specification` names
    every specification file that landing brought in; each conformance row the merge brought in for a session started
    on a request, or for its host, is read beside the agent row that cites UD-4, whatever words it uses;
    `grep -n 'UD-4' docs/specification/conformance.md` finds that agent row; and
    `git grep -n -E 'mandate[^|]*covers[^|]*change-policy' -- docs/specification/conformance.md | grep -v -E
    'never[^|]*change-policy'` prints nothing (no row lets a mandate cover `change-policy`; the filter keeps out the
    callee row that never lets one cover it, which the bare grep matches).

## Decisions taken here

- No UX scenario in this contract: the notice and the switch are each product's screens (Fabric's SCR-52 and SCN-134,
  which owe UD-1 and UD-2 under its CO-496 rewrite); the
  contract's UX documents describe contract surfaces, and none carries this. UD-4 is an agent's refusal with no surface
  of its own: it is an alt path of SCN-043 (the agent answers in its chat that the switch is the person's), with no new
  screen or flow.
- A shared installation id is not rotated at off (UD-2): rotating it would split one person's installs across every
  product that reads the file; the product only stops sending it.
- No machine declaration (UD-5): no host reads one; the safer reversible choice is to add it when a host asks.
- A device policy may lock a product's switch off and never locks it on (UD-2, round 15): locking off only protects
  the person, while a lock on would override a person's decline, which UD-2 keeps, and the switch is the person's
  (UD-4). The other choice, leaving device policy unaddressed, let an organization's server or MDM layer, which can
  lock extension keys ([devices](../specification/devices.md#policy)), hold a declined switch on. A product that
  receives a lock that would hold its switch on ignores it, resolving the key as if unlocked (round 16), rather than
  refusing the whole policy, since devices keep and ignore keys they do not take, or showing the switch as locked on.
  Round 17 narrowed it to "as if that layer's lock were absent": treating the whole key as unlocked would also drop a
  lower layer's lock off, which UD-2 lets a layer set. `resolvePolicy` does not apply the limit; the product applies it
  after resolution, and a reference helper with its vector is CT-280 rather than a change to the reference here, since
  no usage switch key is defined and no product reads one from a device policy today.
- An organization-run cloud instance sends no usage data about its members' calls until a page for members exists
  (round 17, a merged-text requirement in the DEC-0159 landing item): a member who works only through a client key
  reads no product output where UD-1's notice could be shown first, and a hand-over of the key by the operator is no
  product output. The other choice, carrying the notice in the answer that issues a member key and in the operator's
  hand-over note, needs a restatement of CF-3 on another branch and a notice the product does not control; sending
  nothing is the safer reversible choice, and a later decision that adds a member page places the notice there.
- A new product sharing the installation id is named on the maintained list (or each product's own copy) before it
  first sends (UD-1, round 16), and the other products' notices name it from their next version: the list is a page
  its owners update at once, while a notice changes only with a release, so requiring every sharing product to ship
  first would let one product's release hold up another's; the notice's link covers the window, which UD-1 states.
- The earlier-no read of the shared file binds only a product that can read it where it runs (UD-2, round 16): a
  browser build or a component on a server has no such file to read, and its own switch's off is its decline.
- UD-6 against OD-9 (round 6): a digest kept on its machine is counts a product keeps about itself, not usage data, so
  the declaration a local collector reads stands whatever the switch says; the condition sits where data is sent to
  anyone but the person. The other reading (a declaration kept only while the switch is on) would stop a product that collects no
  usage data from declaring its digests to a local collector at all.

## Rounds

The commits named in rounds 1 to 10 are on the earlier line `agent/ct216-usage-data-20261107` (historical), squashed on
2026-11-08 into `agent/ct216-usage-data-v2` because its commits carried private names into this public repository.
That line is kept only in a local archive ref, `refs/archive/2026-11-08/agent/ct216-usage-data-20261107`, which is
not pushed for the same reason; the round entries' commits resolve only there.

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
  renewed after an idle hour; Switchboard's `analytics.rs` lines 417 to 426 at `405b789`, Fabric Inbox's
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

- Round 11 (on `0c88f719`, all three tiers), not clean: all three tiers, the handoffs index row, this handoff's next
  task and CT-216 named `agent/ct216-usage-data-20261107`, which no longer exists (now `agent/ct216-usage-data-v2` in
  every live pointer, the earlier name kept only as historical in CT-216, OQ-0013 and the note above); seam, Fabric
  Inbox's desktop copy (a `fabric-service/0.1` service by its descriptor, `desktop/fabric-descriptor.cjs` at
  `1395416`, its switch in its menu with no agent twin) and Fabric (its switch only on its own window,
  `analyticsSetEnabled`, `apps/desktop/src/main/index.ts` line 4201 at `eafcf2e4`) owed UD-4's product side unstated
  (now in the practice paragraph, the Compatibility, the README cell and the board message, Fabric's at CO-496);
  product, the board message left out the launcher (now: UD-1's notice contents and a notice where the person reads
  it, its doc's agent-only path at `docs/analytics-events.md` line 50, before 0.2.76 is tagged, PC-123). Risks folded:
  UD-3's class read against the data classification table (now `confidential`, the table's "private metrics", with
  the reason, in the page, DEC item 3 and Why, the product row and CONTEXT; data joined or bound to an account
  `personal`, or `regulated` where the privacy review finds it legally controlled, replacing "at least `personal`");
  UD-4's effect given a home (the action in the actions extension, AP-1, the effect on its tool's manifest capability,
  C3.1, a service with no manifest owing one; Switchboard owes an action and a manifest capability, Fabric Dashboards a
  manifest capability; page, DEC item 4, the product row, the Compatibility, the README cell); UD-1's notice says
  where the data is sent or links the UD-5 page (RM-13, "where it is sent"; every notice read owes it) in the page,
  DEC item 1, the product row, the Compatibility and the README cell; the board message asks Fabric to correct its
  three strings now, independently of CO-496; OQ-0013 quotes the two live notices that already state the second
  purpose (Switchboard's `src/main.ts` line 109 at `b99a17b`, Fabric Inbox's `desktop/main.cjs` line 937) and plans.md
  item C, and asks as its second part whether "every product" reaches a hosted service that installs nothing, the
  page's scope, DEC item 1 and Why, the product row and the README cell marking the exclusion pending it; CONTEXT and
  the Why say "renewed no later than after an idle hour"; the launcher's session id meets UD-3 (made at each run's one
  send, `lib/analytics.js` lines 192 and 244 at `ad978a6`), in the practice paragraph, the Compatibility and the
  README cell; the parallel-branches item adds the re-read of UD-4 against AP-2, AP-3, MD-3 and DL-26 as merged and a
  check for the OW-5 sentence; the knowledge base's edit (plans.md's CT-216 row, RM-13's link) is a landing step.
  Declined: pushing the earlier line's archive ref (product), because its commits carry private names into a public
  repository; the note above says once that the round entries' commits resolve only in the local archive. Recording
  the OW-5 sentence in DEC-0156's handoff too (product): that handoff is another session's branch, which already names
  this branch in its landing notes (`docs/handoffs/2026-11-07-operators-word.md`, its heading "Landing note,
  DEC-0157", on `origin/agent/ct220-operators-word-v2`); this handoff's item binds whichever lands second and carries the check.
  Applying UD-3 and UD-5 to hosted services now (product's other option): put to the operator as OQ-0013's second part
  instead, the safer reversible choice.
- On the round 11 fold (this commit's tree): `pnpm run docs:check` exit 0 (272 Markdown files, 0 errors), `python3
  docs/ux/lint.py` exit 0 (40 stories, 34 flows, 34 screens, 56 scenarios), `pnpm run privacy:check` exit 0 (0
  findings), `pnpm vitest run test/consistency.test.ts test/docs-check.test.ts` 45 tests passed, `git merge-tree
  --write-tree HEAD origin/main` exit 0, no U+2014 in the lines the branch adds against `origin/main`, no name of a
  private personal repository in the branch's diff, and the branch-name check printing, for this branch's names, only
  the historical `agent/ct216-usage-data-20261107`. Not the full gate.

- Round 12 (on `39d37010`, all three tiers), not clean: unit clean with risks; seam and product, the page and
  DEC-0157's Compatibility placed the estate's analytics host beyond the organization, from RM-13's paragraph of
  2026-10-05, while every product read sends to PassionCode.ai's own self-hosted host,
  `analytics.passioncode.ai` (passioncode-platform PLAT-019, live 2026-10-17; Switchboard's
  `crates/switchboard-runtime/src/analytics.rs` line 30 at `b99a17b`) (now named so in the practice paragraph and the
  Compatibility; UD-1 decides that naming the organization that receives the data meets "where the data is sent",
  its usage data page naming the host, and UD-5 names both, in the page, DEC items 1 and 5, the product row and the
  README cell; Fabric Inbox's notice, "Fabric Inbox sends PassionCode.ai", meets it, so its "where" debt is dropped in
  the practice paragraph, the Compatibility, the README cell and the board message; the knowledge base's landing step
  restates RM-13's sentence, with a check); seam, this handoff cited plans.md items C and D at lines 97 and 108 (now
  109 and 110 at `c84c7a40`). Risks folded: UD-3's join bar binds every service that reads the data where it was sent
  (page, DEC item 3, the product row), and the host's owner (PassionCode.ai Platform: 730 days' retention, PLAT-132;
  a reader of raw events with the shared id, PLAT-133; any erasure route by id, not read) is in the practice
  paragraph, the Compatibility, the README cell and the board message, with the conforming versions marked where its
  counts are read; PassionCode.ai's public privacy page (`privacy/index.html` line 60 at `8c517867`, "the switch
  applies to every PassionCode.ai app") owes UD-2's per-product switch and UD-5's statements, in the same places;
  Fabric Dashboards' switch action refuses `operator-decision-required` without a decision rather than take its
  dispatcher's caller's-own-act path (`src/mcp/server.ts` lines 332 to 333 at `d43c94e`), in the practice paragraph,
  the Compatibility, the README cell and the board message; UD-2: a shared file that exists but cannot be read before
  the first send (or at the conforming version's first run) is no answer and the product sends nothing in that run,
  in the page, DEC item 2, the product row, CONTEXT and DOCMAP, Fabric Inbox's baseline without an id
  (`desktop/analytics.cjs` lines 307 to 310 at `1395416`) owing it; the Why and this handoff's Done and Decisions say
  "where data is sent to anyone but the person" instead of "where data leaves the machine"; the DOCMAP row carries the
  conforming version's first run; UD-4 says "a T2 caller (any caller the callee cannot place in T0 or T1)", DL-25's
  words. Declined in part: mirroring the widened join bar in CONTEXT (product), since its entry names no one who may
  not join, only what joined data becomes, which is unchanged.
- On the round 12 fold (this commit's tree): `pnpm run docs:check` exit 0 (272 Markdown files, 0 errors), `python3
  docs/ux/lint.py` exit 0 (40 stories, 34 flows, 34 screens, 56 scenarios), `pnpm run privacy:check` exit 0 (0
  findings), `pnpm vitest run test/consistency.test.ts test/docs-check.test.ts` 45 tests passed, `git merge-tree
  --write-tree HEAD origin/main` exit 0, no U+2014 in the lines the branch adds against `origin/main`, and no name of a
  private personal repository in the branch's diff. Not the full gate.

- Round 13 (on `7d7c9b89`, all three tiers), not clean: unit passed with risks, product passed with risks, seam
  failed. Seam, Fabric Dashboards sends its events without an id when the shared file cannot be read
  (`src/core/analytics.ts` lines 59 to 60 and 170 to 171 at `d43c94e`), the UD-2 debt named for Fabric Inbox alone
  (now beside it in the practice paragraph, DEC-0157's Compatibility, the spec README cell and the board message);
  seam, this handoff said no sibling branch moves AP-2, AP-3, MD-3 or DL-26, false for DEC-0159, whose DL-26 has a
  client key take the token's and the grant's place and whose CF-4 hands a client-key caller of a cloud instance no
  person's step (now the parallel-branches item names it, and a landing note binds whichever of DEC-0157 and DEC-0159
  lands second to qualify UD-4's ask-first sentence, item 4 and the agent row with CF-4's `scope-not-granted` and
  `operator-step: consent`, and to restate "no product-side refusal" for CF-4's member-key refusal, with a check).
  Risks folded: UD-2's stand-in for an install that already sent is the first run of the conforming version at which
  the shared file is read or found absent, a run that sent nothing because it could not be read being none (page, DEC
  item 2, the product row, CONTEXT, DOCMAP, the Compatibility, the README cell); UD-3's session id authorizes nothing
  and is not the data classification table's `credential` session (page, DEC item 3); UD-4's elicitation: one the
  product itself sends decides, once the operator accepts it, on the product's own record (AP-2), and the agent relays
  no decision for it (page, DEC item 4, the agent row); the DEC-0156 note aligned with that branch's own (its heading
  "Landing note, DEC-0157"): UD-4's switch named in OW-1's exception and OW-5's list, OW-1 cited from UD-4, both
  checked; the host's retention stated as events 730 days, installation ids removed after 400 days, backups beyond
  (passioncode-platform `infra/analytics/README.md` lines 48 to 49 and `deploy/config.env` lines 39 to 40 at
  `e4d1c0e`); the host offers no erasure by installation id, so each product's UD-5 page says sent data cannot be
  erased unless a route is filed; UD-5's page names every service that reads the data at the host, with its purpose,
  described without naming a person (page, DEC item 5, the product row), chosen over a third part of OQ-0013 because
  it tells the person without waiting and names no private service; events already received past an earlier no stay
  under the host's retention unless the operator has them dropped (the Compatibility, the board message); the board
  message goes on the plans thread `e1cb9f7e` to every product owner with a general line; RM-13's heading "Product
  analytics, private by default" restated at landing, its check widened; the README cell's privacy-page debt adds
  UD-5's statements; the privacy page's nine locale copies named (line 60 of each at `e7a2ed25`); Switchboard's
  `fn session` cited at lines 417 to 426 at `405b789`; Fabric's planned delegated digest path owes UD-6's condition only
  if it ever sends to a store or party other than the person's (it ends at Observatory on the same machine); the
  sibling handoff's note cited by its heading, not line 57. Carried, not filed: the unread senders (Observatory's
  OBS-324, Okolos, the adapter's kits) as named residual risks in Open, since each check is its owner's backlog.
- On the round 13 fold (this commit's tree): `pnpm run docs:check` exit 0 (272 Markdown files, 0 errors), `python3
  docs/ux/lint.py` exit 0 (40 stories, 34 flows, 34 screens, 56 scenarios), `pnpm run privacy:check` exit 0 (0
  findings), `pnpm vitest run test/consistency.test.ts test/docs-check.test.ts` 45 tests passed, `git merge-tree
  --write-tree HEAD origin/main` exit 0, no U+2014 in the lines the branch adds against `origin/main`, and no name of
  a private personal repository in the branch's diff. Not the full gate.

- Round 14 (on `ccace251`, all three tiers), not clean: unit passed with risks, seam failed, product failed. Seam,
  the DEC-0156 note claimed to follow that branch's own, which had since changed (now the parallel-branches item no
  longer describes any sibling branch or its handoff: it states what this decision requires of the merged text and a
  check run on the merged tree at the second landing, and keeps register conflicts as adjacent appends in id order);
  seam, the handoff said DEC-0158 edits `service.md`, false (it edits `project-comms.md` and MD-2 in `delegation.md`
  only; now so stated). Product, the products' events also sit in a second store, the operator's earlier analytics
  instance in his own account (history copied from it on 2026-10-17; installs older than Fabric 0.3.7, Switchboard
  0.6.42 and Fabric Inbox 0.19.0 sent there until they updated; its own retention, erasure, off-host copy and reader),
  which a UD-5 page written from the board message would leave out (now in the practice paragraph, DEC-0157's
  Compatibility, the README cell and the board message, routed through PassionCode.ai Platform, PLAT-019, each of the
  three products' UD-5 page stating it until those apps are retired, the instance unnamed). Risks folded: CONTEXT,
  DOCMAP and the README cell carry "on an install whose own switch the person never set" (unit); Fabric Dashboards'
  parenthetical phrased as owed (unit); DEC-0157's Consequences names both parts of OQ-0013 (unit); the board message
  asks the host's owner how long the weekly droplet backups are kept (product); UD-6 and DEC item 6 say OpenRouter
  attribution (DEC-0065) is not usage data and stays off by default under its own setting (product); the launcher's
  `analytics on|off` is a command line an agent runs in the person's shell, the person's own surface and no agent
  surface under UD-4, so it owes no action, while its setup skill, which points agents at it, owes UD-4's agent side
  (page, DEC item 4 and the Compatibility, the product row, the README cell, the board message), chosen because a
  shell command carries no tool declaration a caller or host reads and the agent-side rule already binds whoever runs
  it (seam); Project Observatory already sends usage data on by default since its 0.33.0 (OBS-324, its
  `CHANGELOG.md` and `docs/COMPATIBILITY.md` at `2a11b3fd`), now in the practice paragraph, the Compatibility, the
  README cell, the residual risks and the board message (seam; product read Observatory's private repository, where
  the sender does not live). Declined: carrying the CF-4 note into DEC-0159's handoff (seam, product), since that is
  another session's branch; the merged-text requirement and its check in this handoff bind whichever lands second, as
  the simplified parallel-branches item says.
- On the round 14 fold (this commit's tree): `pnpm run docs:check` exit 0 (272 Markdown files, 0 errors), `python3
  docs/ux/lint.py` exit 0 (40 stories, 34 flows, 34 screens, 56 scenarios), `pnpm run privacy:check` exit 0 (0
  findings), `pnpm vitest run test/consistency.test.ts test/docs-check.test.ts` 45 tests passed, `git merge-tree
  --write-tree HEAD origin/main` exit 0, no U+2014 in the lines the branch adds against `origin/main`, and no name of
  a private personal repository in the branch's diff. Not the full gate.

- Round 15 (on `0c28b42e`, all three tiers), not clean: unit passed with risks, seam failed, product failed. Seam,
  Project Observatory was said to send usage data on by default since its 0.33.0, while its `CHANGELOG.md` (at
  `2a11b3fd`) says 0.33.0 had no key and sent nothing and 0.33.1 is the first release build that sends (now "on by
  default in its 0.33.0, first sent from 0.33.1, the first release build carrying its key, OBS-324, OBS-329" in the
  page, the Compatibility, the README cell and this handoff's Open); seam, the parallel-branches item called every
  register conflict an adjacent append, false for `docs/backlog.md`, where each branch may rewrite its own row inside
  one hunk (now: adjacent appends for `docs/DECISIONS.md` and `docs/handoffs/README.md` only, and for the backlog one
  row of each from its owning branch, checked by `grep -c '^| CT-215 '` and `grep -c '^| CT-216 '` each printing 1
  and no row id twice); seam, the item said what DEC-0158 edits and that it edits nothing else, a claim about a
  sibling (now dropped: a requirement that every conformance row for a session started on a request, or for its host,
  is re-read against UD-4's agent row, with a check on the merged tree). Product, Observatory sends its usage data to
  the second store, the operator's earlier analytics instance, not to PassionCode.ai's host
  (`observatory/engine/usage_analytics.py` line 61 at `2a11b3fd`), so that store is not closing while Observatory
  sends there (now in the practice paragraph, the Compatibility, the README cell and the board message: Observatory's
  notice owes UD-1's "where", its UD-5 page states that store, PassionCode.ai Platform is told PLAT-019's retirement
  does not end the store; the knowledge-base landing step restates RM-13 naming both hosts, with its check). Risks
  folded: the second store's second reader, the operator's own estate monitor reading counts (page, Compatibility,
  README cell, board message); Okolos's destination, `analytics.passioncode.ai` (the host's `infra/analytics/README.md`
  line 18 at `e4d1c0e`), so the host's reader reads it (page, Compatibility, README cell, residual risks, board
  message); UD-6's OpenRouter sentence from the person's side: off until the product's operator sets it, a product that
  sets it sends it whatever the usage data switch and should say so on its usage data page, Observatory doing so
  (page, DEC item 6, the Compatibility, Open); a device policy may lock a product's switch off, never on (page UD-2,
  DEC item 2, Decisions taken here); the hosted workspace product's self-hosted image owes UD-4's product side and
  its planned well-known declaration has no UD-5 member (page, Compatibility, README cell, board message); Fabric
  Inbox's server under UD-1's organization clause: it sends none of its own counts, each member's app sends them under
  its own switch, so the organization holds no switch over them (page scope, DEC item 1, Compatibility, README cell,
  board message); plans.md line 146 ("CT-216 by 2026-11-09") joins the landing step (seam); UD-2's "sending nothing"
  debt of Fabric Inbox and Fabric Dashboards limited to a run before the first send or the stand-in run (unit; page,
  Compatibility, README cell, board message); Fabric Dashboards' gate placed on its `change-settings` action, whose
  tool is `settings` (unit; page, README cell). Carried to Open: whether a person needs a switch of their own for
  OpenRouter attribution (for the operator through Observatory's owner).
- On the round 15 fold (this commit's tree): `pnpm run docs:check` exit 0 (272 Markdown files, 0 errors), `python3
  docs/ux/lint.py` exit 0 (40 stories, 34 flows, 34 screens, 56 scenarios), `pnpm run privacy:check` exit 0 (0
  findings), `git merge-tree --write-tree HEAD origin/main` exit 0, no U+2014 in the lines the branch adds against
  `origin/main`, no name of a private personal repository in the branch's diff, and the unit tier's gate-wording grep
  printing nothing. Not the full gate.

- Round 16 (on `4533809d`, all three tiers), not clean: unit passed with risks, seam passed with risks, product
  failed. Product, the DEC-0156 landing item made UD-4's place in OW-1 depend on the form of OW-1's list, which leaves
  OW-1 without UD-4 when it is an open list (now the merged OW-1 names UD-4's switch as an example of a
  `change-policy` effect whatever the list's form, checked by the OW-1 `awk` beside the OW-5 and OW-1-citation checks;
  the whole Parallel branches list binds whichever branch lands second, its session making each edit and copying the
  list into its pull request body, every check stated beside the edit it checks, and CT-216's backlog row points to
  the list). Risks folded: a pointer from `openrouter-attribution.md` to UD-6, listed in DOCMAP and DEC-0157's
  Consequences (unit); a pointer from `devices.md`'s "Precedence and locks" to UD-2's limit, a product ignoring a lock
  that would hold its switch on as if the key were unlocked (page UD-2, DEC item 2, the product row, DOCMAP,
  Consequences; seam, product); UD-6 and DEC item 6 say a service's usage report (DEC-0021, `GET /fabric/v1/usage`),
  read by its host with the service token, is not usage data (seam); the product row restores "where the component
  sends its own" and adds the app-sent case, and UD-4 and DEC item 4 say a deployed component's switch, where it sends
  its own counts, is the deploying organization's (unit); UD-1's window: the maintained list and every product's own
  copy name a new sharer before it first sends, the notices naming it from their next version, the link covering the
  window (page, DEC item 1, the product row, Decisions taken here; unit); UD-2's earlier-no read binds only a product
  that can read the shared file where it runs (page, DEC item 2, the product row, Decisions taken here; unit);
  DEC-0157's Why on the session id ("beside an installation id it ties no more than that id; without one it ties one
  session's events, which the notice names", unit); the hosted workspace product's `routes.ts` line 36 and design doc
  line 301 pinned at `855f7a37`, both read there (page, Compatibility; seam); Observatory's notice cited at lines 99 to
  102 (it read 98 to 101), and its notice owing its own installation id and its session id (UD-1), its per-process
  session id owing renewal after an idle hour (UD-3) and its attribution's legacy `X-Title` header against DEC-0065
  (`providers.py` line 93 at `2a11b3fd`) in the page, the Compatibility, the README cell and the board message
  (product, seam); the board message's Observatory and Platform lines ask whether Observatory moves to PassionCode.ai's
  host, its notice naming the receiving party without naming a person until it does, put to the operator in Open
  (product); the DEC-0159 landing item places a cloud instance served to a team in UD-1's scope (outside on a
  placement the estate hosts; under it on an organization's own cloud account, its members told at the instance's
  page or with their client key), with a check (product). Carried as named: the sibling checks stay owed work until
  the second landing (seam), now bound to that landing's session.
- On the round 16 fold (this commit's tree): `pnpm run docs:check` exit 0 (272 Markdown files, 0 errors), `python3
  docs/ux/lint.py` exit 0 (40 stories, 34 flows, 34 screens, 56 scenarios), `pnpm run privacy:check` exit 0 (0
  findings), `pnpm vitest run test/consistency.test.ts test/docs-check.test.ts` 45 tests passed, `git merge-tree
  --write-tree HEAD origin/main` exit 0, no U+2014 in the lines the branch adds against `origin/main`, no name of a
  private personal repository in the branch's diff, and the product tier's two greps on this handoff (`only if the
  merged OW-1` printing 0, the OW-1 `awk` listed). Not the full gate.

- Round 17 (on `b9184846`, all three tiers), not clean: unit passed with risks, seam passed with risks, product
  failed. Product, the DEC-0159 landing item promised members of an organization-run cloud instance a notice at the
  instance's page or in the text with which they receive the client key, places that are not product output a member
  reads on the merged text (now: until a page for members exists, such an instance sends no usage data about its
  members' calls, with a grep for that sentence and one printing 0 for the key's hand-over; Decisions taken here);
  product, the knowledge-base landing step left RM-08's "Measurement stays local and private by default"
  (`knowledge/roadmap.md` line 457 at `bdd35d57`), which reads as off by default (now restated as the funnel's counts
  being each product's usage data, on by default with a per-product switch, with a grep printing nothing after the
  landing). Risks folded: UD-2's lock limit reads "as if that layer's lock were absent", a lower layer's lock off still
  holding (page, DEC item 2, the product row, devices.md; unit), and devices.md says `resolvePolicy` does not apply it
  and the product applies it after resolution, a reference helper and vector filed as CT-280 (seam); UD-1's privacy
  page parenthetical says the list of sharing products on that page (PC-137) is unpublished, not the page (page, DEC
  item 1; unit); "is to be marked" for the conforming version in both places in the page and the DEC (unit); the
  Switchboard door pinned (`mcp.rs` line 72 at `c762821`) and Fabric Dashboards' `AGENT_SETTINGS` pinned (`settings.ts`
  line 248 at `d43c94e`), both read there (unit); Project Observatory owes UD-1's "nothing before the notice" (its
  `record` at `usage_analytics.py` lines 437 to 442, `flush` at lines 558 to 580, and `maintenance.py` lines 1117 and
  1125 to 1129, all read at `2a11b3fd`) in the page, the Compatibility, the README cell and the board message, the
  residual-risk sentence narrowed to its MCP surface's switch (product); Switchboard's notice purpose, "to help
  PassionCode.ai improve its apps" (`src/main.ts` line 109, read at `c762821` and `f6f1dc1`), added to its UD-1 debts
  (page, Compatibility, README cell, board message) and named in OQ-0013's list of shipped strings (product); the
  DEC-0159 item names both refusal forms (a tool that is not job-backed: `scope-not-granted` with `operator-step:
  consent`; a job-backed tool: a job reading `working` with `statusMessage` `operator-step consent`) and adds three
  checks (`operator-step: consent` in the UD-4 range, the elicitation line naming CF-4, `operator-step: consent` in the
  DEC-0157 section; seam); the DEC-0158 item names its base, the first parent of the second landing's merge commit,
  and adds a grep for a row letting a mandate cover `change-policy` (seam), filtered with `grep -v -E
  'never[^|]*change-policy'` because the bare grep matches the existing callee row that never lets a mandate cover it
  (`conformance.md` line 253 on this head, and on the tree merged with DEC-0158's branch), so it printed one line where
  the check asks for none; the filtered grep prints nothing on both and catches a row that lets one cover it; the
  Registers item keeps OQ ids unique at the second landing, with a `uniq -d` check (seam). Filed: CT-280. Renumbered from CT-279 after the fold, since DEC-0159's branch filed CT-279 first.
- On the round 17 fold (this commit's tree): `pnpm run docs:check` passed (272 Markdown files, 0 errors), `python3
  docs/ux/lint.py` exit 0 (40 stories, 34 flows, 34 screens, 56 scenarios), `pnpm run privacy:check` 0 findings, `pnpm
  vitest run test/consistency.test.ts test/docs-check.test.ts test/device-rules.test.ts` 215 tests passed, `git
  merge-tree --write-tree HEAD origin/main` exit 0, no U+2014 in the lines the branch adds against `origin/main`, no
  name of a private personal repository in the branch's diff, and the filtered DEC-0158 grep printing nothing on this
  head and on the tree merged with DEC-0158's branch. Not the full gate.

## Next task

Round 18 of the blind readings of branch `agent/ct216-usage-data-v2` (DEC-0157), all three tiers.
