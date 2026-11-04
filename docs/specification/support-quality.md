# Support quality: `support-quality-daily/1`

DEC-0095, DEC-0144, DEC-0151 · rule code `FAC-SEM-126` · schema [`support-quality-daily.schema.json`](../../schemas/support-quality-daily.schema.json) ·
code [`src/support-quality-rules.ts`](../../src/support-quality-rules.ts) · tests
[`test/support-quality.test.ts`](../../test/support-quality.test.ts) · fixtures `fixtures/positive/support-quality-daily.json`,
`fixtures/positive/support-quality-daily-calibrated.json`, `fixtures/positive/support-quality-daily-tickets.json`,
`fixtures/positive/support-quality-daily-first-reply-unmeasured.json`, `fixtures/positive/support-quality-daily-project.json`,
`fixtures/positive/service-events-page-support-quality-projects.json`,
`fixtures/positive/service-events-page-support-quality-sk-slug.json`, `fixtures/semantic/support-quality-daily-*`

An agent that answers people (chat, mail, reviews, community) MAY publish its support quality; one that does publishes,
on its events feed, one event of kind
`support.quality_daily` per closed UTC day, channel and, once adopted, project (DEC-0151), whose `data` ([service](service.md#event-data), DEC-0070) is
this payload: `data.value` the payload, and `data.schema` the URI of the copy of this schema the service publishes, as
service.md asks. A reader recognises the payload by `data.value.kind` (`support-quality-daily/1`), never by
`data.schema`. A rerun for a day replaces that day's event for the channel and republishes it as first published: a
reader keeps, per service, channel, day and, once adopted, project, the latest event (the greatest id in that service's
feed). An agent
with two surfaces of one channel for one project merges them into one event per day; surfaces of different projects
never merge. The optional `project` (DEC-0151) and its rules are under [the project](#the-project-dec-0151). A voice-of-the-customer reader then reads every agent the same way. The
standard behind it (what is measured, the rubric, the judge) is the asker's, issue #125; the contract owns the shape.

## The payload

| Member | What |
|---|---|
| `kind` | `support-quality-daily/1` |
| `day`, `channel` | the closed UTC day, and `chat` (one person's chat), `mail`, `reviews` (store review replies) or `community` (group chats and forums) |
| `project` | optional (DEC-0151): the project whose tickets these are, as the project registry's alias `project:<slug>` (`^project:[a-z0-9][a-z0-9._-]{0,127}$`), compared as written ([identifiers](identifiers.md)), the form the channel agent declaration of DEC-0150 names a project in; absent before every reader of the feed has adopted DEC-0151, named on every day first published after, except a project with no registry alias (rule 9); a day without it is never attributed to a project ([the project](#the-project-dec-0151)) |
| `rubricVersion`, `judgeModel` | the rubric's version and the judge's `<vendor>/<model>`, or `null` when nothing was judged and no calibration is carried; a day that carries a calibration names them though nothing was judged. With `project` (DEC-0151), a project's event carries the latest calibration of the side whose judge and rubric judge its tickets, on every day it still holds for (DEC-0144's carry-forward), whether or not anything was judged that day; a project of a side with no calibration carries none, and a producer with no declaration carries its calibration likewise on each project's event. |
| `notMeasured` | each metric not computed that day, as `family.metric` (a metric name may carry digits: `nobodyDropped.firstReplyP50Ms`, DEC-0151), a top-level count by its own name (`arrived`, `ended`, `notATicket`), or `checks` when nothing was judged; at most 32 names (DEC-0070's list), so a producer that would name more leaves out the optional members it did not measure |
| `arrived`, `ended`, `notATicket` | optional (DEC-0151): the tickets that arrived on the day; the tickets that ended on the day, whatever day they arrived (the **ending cohort**, which every outcome count below is of); the day's automated notices, which are not tickets |
| `open` | optional (DEC-0151): the open tickets at the day's cutoff by open outcome: `handedOpen` (handed to a person through a queue, not answered yet), `questionOpen` (held while the agent climbs the question ladder), `awaitingCustomer` (the agent asked the customer one question and waits), `awaitingApproval` (a draft waits for a person's or a transport's approval) |
| `outcomes` | optional (DEC-0151): the ending cohort by outcome: `handoffsClosedByPerson` (hand-offs that ended closed by a person), `referred`, `answeredElsewhere`, `noReplyOwed`, `customerSilent`, `expiredByDecision`, `expired`, `unanswered`; and two marks that are not outcomes: `firstReplyLate` (tickets whose first reply missed the channel's first-reply limit) and `promotions` (the day's promotions: a `referred` or `expired` ticket of the last 30 days turned closed by a person on a late signal from a hand-off queue) |
| `nobodyDropped` | `turns`, `replyCoverage` (0 to 1), `firstReplyP50Ms`, `firstReplyP90Ms`, `repeatAskRate`, `agentRepeats`, `answeredLater` |
| `quality` | the judged `sampled` turns, `helpedYes`, `helpedPartly`, `helpedNo` |
| `checks` | each rubric check's pass rate among its non-NA verdicts, a check with no verdict left out; `null` when nothing was judged, never an empty object. A member of its own, so the payload stays two levels deep |
| `stability` | `turnErrors`, `modelCallFailures`, `recoveredByFallback`, `processErrors`, `restarts`, `knowledgeAgeHours`; optional (DEC-0151): `fallbackTurns` (the day's turns the checker, the model that gates an answer before it is sent, refused twice in a row) and `fallbackTickets` (the ending cohort's tickets with at least one); neither is `recoveredByFallback`, which counts the model-call fallback |
| `autonomy` | `resolvedWithoutPerson`, `toPersonPolicy` and `toPersonInability` (in turns, bounded by `nobodyDropped.turns` (not tickets, DEC-0151)), `queueOldestMinutes`, `queueSlaMinutes`; optional (DEC-0151): `answered` (the ending cohort's tickets that ended answered, or answered after a question) |
| `calibration` | optional (DEC-0144): how well the day's judge, under the day's rubric, agreed with people: `week` (the latest ISO week a person labelled answers, `YYYY-Www`, starting no later than `day`), `labelled` (how many, at least 1) and `helped` (the share of those whose helped verdict the judge matched, `null` when helped was not labelled); absent means no calibration, and a reader never carries one forward, so a producer carries its latest calibration on every day it still holds for. A producer whose judge or rubric changed after the labelled week leaves it out. With `project` (DEC-0151), a project's event carries the latest calibration of the side whose judge and rubric judge its tickets, on every day it still holds for (DEC-0144's carry-forward), whether or not anything was judged that day; a project of a side with no calibration carries none, and a producer with no declaration carries its calibration likewise on each project's event. |
| `calibrationChecks` | optional, only beside `calibration`: each rubric check's share of the labelled verdicts the judge matched, named as in `checks`; a check a person did not label is left out, and with none labelled the member is absent. A member of its own, so the payload stays two levels deep |

Counts and rates only: no person's words, no ids (the project's registry alias excepted) and no judge notes, so `FAC-SEM-101` (a credential detector) finds nothing in it; keeping a
person's words out is the producer's duty (service.md). An alias with a weak `sk-` slug word passes
(`project:sk-learn-experiments`, `project:acme-sk-customer-support-eu`): the detector takes an `sk-` key only with a
digit and an upper-case letter with 16 or more characters, or a digit with 32 or more, and reads every provider prefix
in its canonical case only (DEC-0151). The residual exception is a slug word (a word starts after `-`, `_`, `.` or `:`) that starts with a
provider prefix and holds enough key characters: for `sk-`, 32 or more letters, digits, `-` and `_` after it,
holding a digit, as a lower-case `sk-or-v1-` key does; for `ghp_` and its kin, 20 or more letters and digits; for
`xoxb-` and its kin, 10 or more letters, digits and `-`; for `glpat-`, 20 or more letters, digits, `-` and `_` (19
pass). This page writes such an alias as a prefix and a count of characters, never whole; the tests build them.
Knowingly not found: a key after a triple percent-escape (`%252522`), after an eight-digit `\U00000022` escape or a `%u0022` escape, or
after a CSI sequence that is not a colour sequence (`ESC[K`, `ESC[2J`), or after a colour sequence opened by the 8-bit CSI (U+009B), brace escapes (`\x{1b}`, `\u{1b}`), `\E` and the caret `^[` form. The detector reads such an alias as a credential and
the events page fails `FAC-SEM-101`; it stays strict there (`test/secret-shape.test.ts`). Whether the registry issues
no such alias is the operator's open question until the registry's owner records the rule (CT-210 (g)), and this
contract does not prove it; the rule here binds a producer that names `project`: one whose alias is read so publishes no event for that project, on any channel, until the
registry changes its alias, and the other projects' events are unaffected. Under DEC-0150's rule (`FAC-SEM-165`) the
agent's channel agent declaration is refused while it holds that entry, so the agent leaves the entry out until the
registry changes the alias (the agent never invents one), and that project's channels
still count for rule 1 of [the project](#the-project-dec-0151), which also says what becomes of its kept days. Such a producer checks its alias
against the shared detector (or validates its events page) before publishing, because the payload's own check
(FAC-SEM-126) does not run `FAC-SEM-101`. A weak `sk-` slug alias (`project:sk-learn-experiments`, `project:acme-sk-customer-support-eu`, `project:sk-harbor-customer-care`) passes `FAC-SEM-101` and `FAC-SEM-165`, but DEC-0149 (in progress) reads it as a `FAC-SEM-158` credential in a source tree, its tree check keeping its own unbounded, case-insensitive key shapes: once DEC-0149 lands, a channel agent declaring such a project in `fabric-agent.json` cannot export its source (checked with DEC-0149's `checkSourceTree` at `8dd4d04f`: one FAC-SEM-158 finding at `fabric-agent.json` for each such alias, none for `project:helpdesk-customer-support`). Whether the registry issues an alias with a provider prefix at a word start is the operator's open question until the registry's owner records a rule (CT-210 (g)); the agent never renames an alias.
The feed is pulled, so a producer cannot know its readers' pins (DEC-0070): it carries `calibration` and
`calibrationChecks` once every reader of its feed it knows of has adopted DEC-0144. A reader that validates against an
older copy of the schema (closed) refuses that day's `value` whole and keeps the event's `text`, so the day's numbers
are lost to it, not only the calibration; a reader that reads the members takes their absence as no calibration, never
as a judge that disagreed. A reader validates against its own pinned copy, never one fetched by `$id` alone: DEC-0144
widened the bytes under the unchanged `$id`.
It fits `data.value`'s two levels (`test/support-quality.test.ts` carries it inside an events page).

### The ticket counts (DEC-0151)

The channel agent standard's daily loop (its release candidate received on the board, thread `b6820b97`, section 5;
the copy DEC-0150 adds, `docs/evidence/specs/2026-11-04-channel-agent-standard-v1-rc.md`) counts **tickets**, a
customer's request from arrival to its one outcome, beside the turns the families above count. DEC-0151 gives those
counts a `/1` home: `arrived`, `ended`, `notATicket` and the `project` they are of at the top level, `open` and `outcomes` as members of their
own, and `autonomy.answered`, `stability.fallbackTurns` and `stability.fallbackTickets` in the families they belong to.
Each count is a count or `null` (`project` is an id, not a metric, and is never named in `notMeasured`), and FAC-SEM-126 reads it as it reads every metric: `null` and named in `notMeasured` when
not measured, never `0`. A member absent is one the producer does not carry: a reader reads it as unknown, as it
reads `null`, never as `0`. `open` and `outcomes` are never empty objects: with none of their members carried they
are absent. The payload's top level has 19 members, its largest family object 10 (`outcomes`) and `checks` and
`calibrationChecks` at most 16, inside DEC-0070's 32 (`test/support-quality.test.ts`).

`/1` takes `autonomy.toPersonPolicy` and `toPersonInability` in turns, as FAC-SEM-126 bounds them within
`nobodyDropped.turns`; the channel agent standard counts them in tickets, so a producer on it writes them in turns, or
`null` and named in `notMeasured`, until `/1` names a ticket unit. Until then a reader computes no "to a person" share
of the tickets from `autonomy.toPersonPolicy` and `toPersonInability`: it takes that share from the channel agent
standard's signal server or leaves it out, and never maps those turn counts into a ticket share.

The schema is closed, so a producer carries these members, `project` among them, only once every reader of its feed it
knows of has adopted DEC-0151, as it does the calibration (DEC-0144): a reader validating against an older copy
refuses that day's `value` whole. A reader that only parses and keys by channel and day would keep one project's day
and drop the other's, so `project` waits for every reader, parse-only ones included (rule 1 under [the project](#the-project-dec-0151)). DEC-0151 also lets a metric name in `notMeasured` carry digits, which FAC-SEM-126 needed for
`nobodyDropped.firstReplyP50Ms` and `firstReplyP90Ms` (the earlier pattern refused them, so a producer could not name
an unmeasured first-reply time and stay valid); an older copy refuses such a name too, so a producer writes one under
the same rule. In the meantime a producer leaves each unmeasured first-reply metric (`firstReplyP50Ms`, `firstReplyP90Ms`
or both) `null` and unnamed, so a reader on an older copy still accepts the day: the validator then reports one
FAC-SEM-126 finding per unmeasured first-reply metric, at that metric
(`fixtures/semantic/support-quality-daily-first-reply-interim.json`, and `-interim-both.json` with two), and a
producer's gate accepts exactly those findings at those metrics and no other; the producer names the metrics once every
reader of its feed has adopted DEC-0151. The finding's message at such a metric says so ("until every reader of the
feed has adopted DEC-0151, leave it null and unnamed"; `test/support-quality.test.ts`).

No producer carries the ticket counts until two prerequisites outside this contract hold (CT-210 step (d)): the
channel agent standard's section 5.1 says that `/1` takes `autonomy.toPersonPolicy` and `toPersonInability` in turns,
and the observed check below holds.

The channel agent standard's observed check (its section 11) is to accept (CT-210 (d), owed by its owner until its text lands) what the wait withholds (support quality, the
ticket counts), by period, the period being the event's day: a producer's adoption is marked by its first published day
that names `project` (a project under rule 9 never names one and stays in the pre-adoption form). Until that day, a day without `project`, a withheld channel, and a producer whose only named project is
alias-withheld at adoption (it has no first named day); from adoption on, a project withheld because its alias is read as a credential, until the registry renames it, and then that project's kept days, published late under the new alias. Rule 3 of [the project](#the-project-dec-0151) says how a reader keeps a
day without `project`.

### The project (DEC-0151)

`project` names the project whose tickets a day counts, as the registry alias `project:<slug>`. The conformance rows,
DEC-0151 item 6, its Compatibility and CT-210 point here; where they repeat a rule, this page holds it.

1. **Before adoption.** Until every reader of its feed it knows of has adopted DEC-0151, a producer publishes no `project` and withholds every channel whose day holds tickets of two projects that enter `/1`, counting every project whose tickets the channel holds: by its channel agent declaration where the declaration names the project, by its own project mapping otherwise (no declaration, no alias, or an alias read as a credential); a project whose kind there is left out of `/1`, such as `team_chat`, does not count. The switch day of a channel moving from one project to another is one of them, and a withheld day is dropped, never published later.
2. **After adoption.** Once every reader of its feed it knows of has adopted DEC-0151, a producer names `project` on
   every day it first publishes, whatever the number of projects on the channel, except a project with no registry alias
   (rule 9): one event per project, channel and day
   (`fixtures/positive/service-events-page-support-quality-projects.json`).
3. **A day without `project`** (published before adoption, a day merged across projects under DEC-0095, or a rerun of
   either) is never attributed to a project: a reader keeps it per service, channel and day, unattributed. Per-project
   history starts at adoption, the same for every reader. The channel agent standard's observed check is to accept (CT-210 (d), owed by its owner until its text lands), by period, what the wait withholds (the observed-check paragraph under [the ticket counts](#the-ticket-counts-dec-0151) of support quality).
4. **A rerun** republishes a day as first published, with the `project` it had or without one. A day merged across
   projects under DEC-0095 is never rerun while rule 1 holds (before adoption); after adoption it may be rerun only
   unchanged, and it stays unattributed (rule 3). Unchanged is the same form, members and values, not the same bytes.
5. **A reader that adopted DEC-0151** keeps, per service, channel, day and `project`, the latest event, and keeps a day
   without `project` as rule 3 says. A reader on the channel agent standard combines only projects of one side, the side
   taken from the channel agent declaration or from the signal server; it never combines a day without `project` with
   other days across services or channels under the standard's side rule, and keeps such a day out of side summaries.
6. **Calibration** (DEC-0144), per side (a side as the channel agent standard's section 1 defines it,
   `docs/evidence/specs/2026-11-04-channel-agent-standard-v1-rc.md` (added by DEC-0150)): With `project` (DEC-0151), a project's event carries the latest calibration of the side whose judge and rubric judge its tickets, on every day it still holds for (DEC-0144's carry-forward), whether or not anything was judged that day; a project of a side with no calibration carries none, and a producer with no declaration carries its calibration likewise on each project's event. A reader reads calibration per project's event, never summing or copying it across projects.
7. **An alias read as a credential**: the paragraph on credentials under [the payload](#the-payload) holds the rule.
8. **Adoption is one-way** per producer: once every reader of its feed it knows of has adopted, it names `project`
   from then on; a reader that appears later on an older copy is that reader's to update, and the producer does not
   fall back.
9. **A project with no registry alias** is never named, rule 2 aside: its days stay unattributed (rule 3), and a
   channel holding its tickets beside another unnamed project's tickets that enter `/1` stays withheld (rule 1).
   Unnamed here means a project with no registry alias, never one whose alias is withheld as a credential (rule 7): such
   a project publishes nothing, so a channel holding a no-alias project's tickets beside an alias-withheld project's
   publishes the no-alias project's day, unattributed, the only unattributed event of that channel and day.

Days withheld under rule 1 are dropped, never published later, so per-project history starts at adoption. A project
withheld for its alias is withheld after adoption: its kept days are post-adoption days, published naming the new
alias once the registry changes it.

### The channel agent standard's channel kinds (DEC-0151)

The channel agent standard's declaration (DEC-0150's `extensions/channel-agent/0.1`) names seven channel kinds; `/1`
keeps its four channels and adds none. An agent on the channel agent standard publishes each kind under the `/1` channel
it is closest to. The kinds of one project that meet in one `/1` channel make one event per day, channel and project,
as two surfaces of one channel do; kinds of different projects never merge (the per-project rule above governs them):

| Channel kind | `/1` channel | Why |
|---|---|---|
| `telegram_dm` | `chat` | one person's chat with a bot |
| `account` | `chat` | a person's own account answering customers in their private chats |
| `mail` | `mail` | the same channel |
| `store_review` | `reviews` | a store review and its one public reply |
| `telegram_group` | `community` | a group chat |
| `public_comment` | `community` | a public thread under a post, read by many, as a forum is |
| `team_chat` | `community` | a team's group chat |

The counts stay true under the merge: each ticket's first-reply and final limits are its own channel's, so
`outcomes.firstReplyLate` and the outcomes count each ticket by its own limit; only the per-channel targets a reader
applies are `/1`'s four. `community`'s latency and coverage figures therefore mix `telegram_group`, `public_comment`
and `team_chat`, whose limits differ (the channel agent standard's section 10: a group 6 hours, a public comment 7
days, a team's chat 2 working days). A producer MAY leave `team_chat` out of `/1`: a team's internal chat is not
customer support. When it does, the feed's `community` counts differ from the signal server's by the team-chat
tickets, and a project whose only kind is `team_chat` has no daily. A project whose kind is left out of `/1` does not
make a channel withheld before adoption (rule 1 under [the project](#the-project-dec-0151)). A new enum value was refused: a reader on an older copy would refuse every day of that channel, where
a mapping costs nothing.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-126"></a>`FAC-SEM-126` | `support-quality-daily` | a metric not computed is `null` and named in `notMeasured`, and a named one is `null`, never a `0` standing for it; the helped verdicts are at most the sample, the fallback's recoveries at most the failures, the autonomy outcomes (`resolvedWithoutPerson`, `toPersonPolicy`, `toPersonInability`) at most the turns; p50 is at most p90; a judged sample (any sample, helped verdict or check rate) names its rubric version and its judge; a calibration names them too, its `helped` follows the not-measured rule as `calibration.helped`, its week is a real ISO week that starts no later than `day`, and `calibrationChecks` stands only beside a `calibration` (DEC-0144); during DEC-0151's interim a producer's gate accepts the first-reply findings the interim paragraph under [the ticket counts](#the-ticket-counts-dec-0151) names; the ticket counts follow the not-measured rule, each top-level one by its own name and the rest as `open.<metric>`, `outcomes.<metric>`, `autonomy.answered`, `stability.fallbackTurns` and `stability.fallbackTickets`; naming one the payload does not carry is a finding, and naming a top-level member that is no metric (`project`, `day`, a family) is a finding that says so (DEC-0151) |

## Not decided here

- The thresholds (reply coverage 100 %, helped yes at least 60 %, each check at least 90 %): issue #125's standard's, not the shape's.
- How a reader aggregates channels or alerts: the voice-of-the-customer agent's.
- Joining a project's days across a renamed alias: the reader's, from the registry.
- Model-call failures per lane: one count and its recoveries here; a split per lane is a later revision.
- The first implementation's other members have no `/1` home (the schema is closed): `coverageBasis`, `modelCalls`,
  `undelivered`, `followupsPending`, `limitReplies`, `smalltalk`, `personQueueWaiting`, `noSafeDefault` and `questions`
  (the calibration members found a home in DEC-0144).
- The agreement threshold a reader asks of a calibrated judge (the asker's 80 %) and how it ranks or alerts on a judge
  below it: the reader's.
- `replyCoverage` is over inbound messages for `chat` and `mail` and over owed questions for `community` and
  `reviews`, as issue #125's standard measures it; a later revision may name the basis.
- A sum among the ticket counts (an outcome count at most `ended`, the exclusive outcomes together at most `ended`):
  the channel agent standard's section 5 states none, and two of the counts are not of the ending cohort
  (`promotions` falls on the day of the promotion; `open` holds tickets of earlier days), so DEC-0151 checks no sum
  (`fixtures/semantic/support-quality-daily-tickets-no-sum.json`); a later revision may, once the channel agent
  standard states one.
- `received` (a ticket that arrived and that the agent has not acted on yet) has no `open` member: the channel agent
  standard's section 5 counts only the four open outcomes. Whether a promotion also restates the day the ticket ended
  is the channel agent standard's.
- A ticket unit for `autonomy.toPersonPolicy` and `toPersonInability`: the channel agent standard counts tickets ever
  handed to a person (`referred` included, approval-held sends excluded), `/1` takes turns, as FAC-SEM-126 bounds them;
  until `/1` names a ticket unit, a producer on the channel agent standard writes them in turns, or `null` and named in
  `notMeasured`, and a reader computes no "to a person" ticket share from them: it takes it from the channel agent
  standard's signal server or leaves it out.
- How a reader combines one channel's per-project days: the reader's choice; rates and percentiles are never summed.
  Which projects a reader on the channel agent standard may combine, and how it keeps a day without `project`, is
  decided: rule 5 of [the project](#the-project-dec-0151).
- The four summary numbers the channel agent standard derives (answered, to a person, fallback, unanswered), as
  shares of `ended`: the reader's.
- The move from the asker's first implementation (its v2 shape, under its own URN): its producers move to
  `support-quality-daily/1`, and until then a `/1` reader reads none of their events (board row CT-61). v2's
  `stability.fallbackTurns` and `autonomy.answered` mean something else than `/1`'s members of the same name, so a
  reader maps them explicitly, never by name.
