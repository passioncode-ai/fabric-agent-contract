# Support quality: `support-quality-daily/1`

DEC-0095, DEC-0144, DEC-0151 · rule code `FAC-SEM-126` · schema [`support-quality-daily.schema.json`](../../schemas/support-quality-daily.schema.json) ·
code [`src/support-quality-rules.ts`](../../src/support-quality-rules.ts) · tests
[`test/support-quality.test.ts`](../../test/support-quality.test.ts) · fixtures `fixtures/positive/support-quality-daily.json`,
`fixtures/positive/support-quality-daily-calibrated.json`, `fixtures/positive/support-quality-daily-tickets.json`,
`fixtures/positive/support-quality-daily-first-reply-unmeasured.json`, `fixtures/positive/support-quality-daily-project.json`,
`fixtures/positive/service-events-page-support-quality-projects.json`, `fixtures/semantic/support-quality-daily-*`

An agent that answers people (chat, mail, reviews, community) MAY publish its support quality; one that does publishes,
on its events feed, one event of kind
`support.quality_daily` per closed UTC day and channel whose `data` ([service](service.md#event-data), DEC-0070) is
this payload: `data.value` the payload, and `data.schema` the URI of the copy of this schema the service publishes, as
service.md asks. A reader recognises the payload by `data.value.kind` (`support-quality-daily/1`), never by
`data.schema`. A rerun for a day replaces that day's event for the channel: a reader keeps, per service, channel and day, the
latest event (the greatest id in that service's feed). A reader that adopted DEC-0151 keeps, per service, channel, day
and project (an absent `project` being the service's one project), the latest event; an agent that serves several
projects on one channel publishes one event per project and day, each naming its `project`, under DEC-0151's producer
rule below (`fixtures/positive/service-events-page-support-quality-projects.json`). A producer never changes the project
form of a day it has already published: a day first published without `project` is rerun without it, and a day a
producer merged across projects before DEC-0151 is rerun as first published, or not rerun. A single-project producer
keeps leaving `project` out, and names it only once it serves a second project. A day's calibration (DEC-0144) is the
judge's, so it is identical on each project's event of that day, and a reader never sums it across projects. An agent with two
surfaces of one channel merges them into one event per day. A voice-of-the-customer reader then reads every agent the same way. The
standard behind it (what is measured, the rubric, the judge) is the asker's, issue #125; the contract owns the shape.

## The payload

| Member | What |
|---|---|
| `kind` | `support-quality-daily/1` |
| `day`, `channel` | the closed UTC day, and `chat` (one person's chat), `mail`, `reviews` (store review replies) or `community` (group chats and forums) |
| `project` | optional (DEC-0151): the project whose tickets these are, as the project registry's alias `project:<slug>` (`^project:[a-z0-9][a-z0-9._-]{0,127}$`), compared as written ([identifiers](identifiers.md)), the form the channel agent declaration of DEC-0150 names a project in; absent, the service's one project |
| `rubricVersion`, `judgeModel` | the rubric's version and the judge's `<vendor>/<model>`, or `null` when nothing was judged and no calibration is carried |
| `notMeasured` | each metric not computed that day, as `family.metric` (a metric name may carry digits: `nobodyDropped.firstReplyP50Ms`, DEC-0151), a top-level count by its own name (`arrived`, `ended`, `notATicket`), or `checks` when nothing was judged; at most 32 names (DEC-0070's list), so a producer that would name more leaves out the optional members it did not measure |
| `arrived`, `ended`, `notATicket` | optional (DEC-0151): the tickets that arrived on the day; the tickets that ended on the day, whatever day they arrived (the **ending cohort**, which every outcome count below is of); the day's automated notices, which are not tickets |
| `open` | optional (DEC-0151): the open tickets at the day's cutoff by open outcome: `handedOpen` (handed to a person through a queue, not answered yet), `questionOpen` (held while the agent climbs the question ladder), `awaitingCustomer` (the agent asked the customer one question and waits), `awaitingApproval` (a draft waits for a person's or a transport's approval) |
| `outcomes` | optional (DEC-0151): the ending cohort by outcome: `handoffsClosedByPerson` (hand-offs that ended closed by a person), `referred`, `answeredElsewhere`, `noReplyOwed`, `customerSilent`, `expiredByDecision`, `expired`, `unanswered`; and two marks that are not outcomes: `firstReplyLate` (tickets whose first reply missed the channel's first-reply limit) and `promotions` (the day's promotions: a `referred` or `expired` ticket of the last 30 days turned closed by a person on a late signal from a hand-off queue) |
| `nobodyDropped` | `turns`, `replyCoverage` (0 to 1), `firstReplyP50Ms`, `firstReplyP90Ms`, `repeatAskRate`, `agentRepeats`, `answeredLater` |
| `quality` | the judged `sampled` turns, `helpedYes`, `helpedPartly`, `helpedNo` |
| `checks` | each rubric check's pass rate among its non-NA verdicts, a check with no verdict left out; `null` when nothing was judged, never an empty object. A member of its own, so the payload stays two levels deep |
| `stability` | `turnErrors`, `modelCallFailures`, `recoveredByFallback`, `processErrors`, `restarts`, `knowledgeAgeHours`; optional (DEC-0151): `fallbackTurns` (the day's turns the checker, the model that gates an answer before it is sent, refused twice in a row) and `fallbackTickets` (the ending cohort's tickets with at least one); neither is `recoveredByFallback`, which counts the model-call fallback |
| `autonomy` | `resolvedWithoutPerson`, `toPersonPolicy`, `toPersonInability`, `queueOldestMinutes`, `queueSlaMinutes`; optional (DEC-0151): `answered` (the ending cohort's tickets that ended answered, or answered after a question) |
| `calibration` | optional (DEC-0144): how well the day's judge, under the day's rubric, agreed with people: `week` (the latest ISO week a person labelled answers, `YYYY-Www`, starting no later than `day`), `labelled` (how many, at least 1) and `helped` (the share of those whose helped verdict the judge matched, `null` when helped was not labelled); absent means no calibration, and a reader never carries one forward, so a producer carries its latest calibration on every day it still holds for. A producer whose judge or rubric changed after the labelled week leaves it out |
| `calibrationChecks` | optional, only beside `calibration`: each rubric check's share of the labelled verdicts the judge matched, named as in `checks`; a check a person did not label is left out, and with none labelled the member is absent. A member of its own, so the payload stays two levels deep |

Counts and rates only: no person's words, no ids (the project's registry alias excepted) and no judge notes, so `FAC-SEM-101` (a credential detector) finds nothing in it; keeping a
person's words out is the producer's duty (service.md).
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
refuses that day's `value` whole. A reader that only parses and keys by channel and day keeps one project's day and
drops the other's, so per-project publishing waits for every reader, parse-only ones included: before then, a producer
serving several projects on one channel publishes no event for that channel, keeps each project's days, publishes them
one event per project and day once every reader has adopted DEC-0151, and never merges projects into one event. DEC-0151 also lets a metric name in `notMeasured` carry digits, which FAC-SEM-126 needed for
`nobodyDropped.firstReplyP50Ms` and `firstReplyP90Ms` (the earlier pattern refused them, so a producer could not name
an unmeasured first-reply time and stay valid); an older copy refuses such a name too, so a producer writes one under
the same rule. In the meantime a producer with an unmeasured first-reply time leaves it `null` and unnamed, so a reader
on an older copy still accepts the day: it gives up FAC-SEM-126 for that metric only
(`fixtures/semantic/support-quality-daily-first-reply-interim.json`), and names it once every reader of its feed has
adopted DEC-0151.

### The channel agent standard's channel kinds (DEC-0151)

The channel agent standard's declaration (DEC-0150's `extensions/channel-agent/0.1`) names seven channel kinds; `/1`
keeps its four channels and adds none. An agent on the channel agent standard publishes each kind under the `/1` channel it is closest to, and
merges the kinds that meet in one channel into one event per day and channel, as it merges two surfaces of one channel:

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
customer support. A new enum value was refused: a reader on an older copy would refuse every day of that channel, where
a mapping costs nothing.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-126"></a>`FAC-SEM-126` | `support-quality-daily` | a metric not computed is `null` and named in `notMeasured`, and a named one is `null`, never a `0` standing for it; the helped verdicts are at most the sample, the fallback's recoveries at most the failures, the autonomy outcomes (`resolvedWithoutPerson`, `toPersonPolicy`, `toPersonInability`) at most the turns; p50 is at most p90; a judged sample (any sample, helped verdict or check rate) names its rubric version and its judge; a calibration names them too, its `helped` follows the not-measured rule as `calibration.helped`, its week is a real ISO week that starts no later than `day`, and `calibrationChecks` stands only beside a `calibration` (DEC-0144); the ticket counts follow the not-measured rule, each top-level one by its own name and the rest as `open.<metric>`, `outcomes.<metric>`, `autonomy.answered`, `stability.fallbackTurns` and `stability.fallbackTickets`; naming one the payload does not carry is a finding, and naming a top-level member that is no metric (`project`, `day`, a family) is a finding that says so (DEC-0151) |

## Not decided here

- The thresholds (reply coverage 100 %, helped yes at least 60 %, each check at least 90 %): issue #125's standard's, not the shape's.
- How a reader aggregates channels or alerts: the voice-of-the-customer agent's.
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
- The four summary numbers the channel agent standard derives (answered, to a person, fallback, unanswered), as
  shares of `ended`: the reader's.
- The move from the asker's first implementation (its v2 shape, under its own URN): its producers move to
  `support-quality-daily/1`, and until then a `/1` reader reads none of their events (board row CT-61). v2's
  `stability.fallbackTurns` and `autonomy.answered` mean something else than `/1`'s members of the same name, so a
  reader maps them explicitly, never by name.
