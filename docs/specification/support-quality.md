# Support quality: `support-quality-daily/1`

DEC-0095, DEC-0144 · rule code `FAC-SEM-126` · schema [`support-quality-daily.schema.json`](../../schemas/support-quality-daily.schema.json) ·
code [`src/support-quality-rules.ts`](../../src/support-quality-rules.ts) · tests
[`test/support-quality.test.ts`](../../test/support-quality.test.ts) · fixtures `fixtures/positive/support-quality-daily.json`,
`fixtures/positive/support-quality-daily-calibrated.json`, `fixtures/semantic/support-quality-daily-*`

An agent that answers people (chat, mail, reviews, community) MAY publish its support quality; one that does publishes,
on its events feed, one event of kind
`support.quality_daily` per closed UTC day and channel whose `data` ([service](service.md#event-data), DEC-0070) is
this payload: `data.value` the payload, and `data.schema` the URI of the copy of this schema the service publishes, as
service.md asks. A reader recognises the payload by `data.value.kind` (`support-quality-daily/1`), never by
`data.schema`. A rerun for a day replaces that day's event for the channel: a reader keeps, per service, channel and day, the
latest event (the greatest id in that service's feed). An agent with two surfaces of one channel merges them into one
event per day. A voice-of-the-customer reader then reads every agent the same way. The
standard behind it (what is measured, the rubric, the judge) is the asker's, issue #125; the contract owns the shape.

## The payload

| Member | What |
|---|---|
| `kind` | `support-quality-daily/1` |
| `day`, `channel` | the closed UTC day, and `chat` (one person's chat), `mail`, `reviews` (store review replies) or `community` (group chats and forums) |
| `rubricVersion`, `judgeModel` | the rubric's version and the judge's `<vendor>/<model>`, or `null` when nothing was judged and no calibration is carried |
| `notMeasured` | each metric not computed that day, as `family.metric`, or `checks` when nothing was judged |
| `nobodyDropped` | `turns`, `replyCoverage` (0 to 1), `firstReplyP50Ms`, `firstReplyP90Ms`, `repeatAskRate`, `agentRepeats`, `answeredLater` |
| `quality` | the judged `sampled` turns, `helpedYes`, `helpedPartly`, `helpedNo` |
| `checks` | each rubric check's pass rate among its non-NA verdicts, a check with no verdict left out; `null` when nothing was judged, never an empty object. A member of its own, so the payload stays two levels deep |
| `stability` | `turnErrors`, `modelCallFailures`, `recoveredByFallback`, `processErrors`, `restarts`, `knowledgeAgeHours` |
| `autonomy` | `resolvedWithoutPerson`, `toPersonPolicy`, `toPersonInability`, `queueOldestMinutes`, `queueSlaMinutes` |
| `calibration` | optional (DEC-0144): how well the day's judge, under the day's rubric, agreed with people: `week` (the latest ISO week a person labelled answers, `YYYY-Www`, starting no later than `day`), `labelled` (how many, at least 1) and `helped` (the share of those whose helped verdict the judge matched, `null` when helped was not labelled); absent means no calibration, and a reader never carries one forward, so a producer carries its latest calibration on every day it still holds for. A producer whose judge or rubric changed after the labelled week leaves it out |
| `calibrationChecks` | optional, only beside `calibration`: each rubric check's share of the labelled verdicts the judge matched, named as in `checks`; a check a person did not label is left out, and with none labelled the member is absent. A member of its own, so the payload stays two levels deep |

Counts and rates only: no person's words, no ids and no judge notes, so `FAC-SEM-101` (a credential detector) finds nothing in it; keeping a
person's words out is the producer's duty (service.md).
The feed is pulled, so a producer cannot know its readers' pins (DEC-0070): it carries `calibration` and
`calibrationChecks` once every reader of its feed it knows of has adopted DEC-0144. A reader that validates against an
older copy of the schema (closed) refuses that day's `value` whole and keeps the event's `text`, so the day's numbers
are lost to it, not only the calibration; a reader that reads the members takes their absence as no calibration, never
as a judge that disagreed. A reader validates against its own pinned copy, never one fetched by `$id` alone: DEC-0144
widened the bytes under the unchanged `$id`.
It fits `data.value`'s two levels (`test/support-quality.test.ts` carries it inside an events page).

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-126"></a>`FAC-SEM-126` | `support-quality-daily` | a metric not computed is `null` and named in `notMeasured`, and a named one is `null`, never a `0` standing for it; the helped verdicts are at most the sample, the fallback's recoveries at most the failures, the outcomes at most the turns; p50 is at most p90; a judged sample (any sample, helped verdict or check rate) names its rubric version and its judge; a calibration names them too, its `helped` follows the not-measured rule as `calibration.helped`, its week is a real ISO week that starts no later than `day`, and `calibrationChecks` stands only beside a `calibration` (DEC-0144) |

## Not decided here

- The thresholds (reply coverage 100 %, helped yes at least 60 %, each check at least 90 %): the standard's, not the shape's.
- How a reader aggregates channels or alerts: the voice-of-the-customer agent's.
- Model-call failures per lane: one count and its recoveries here; a split per lane is a later revision.
- The first implementation's other members have no `/1` home (the schema is closed): `coverageBasis`, `modelCalls`,
  `undelivered`, `followupsPending`, `limitReplies`, `smalltalk`, `personQueueWaiting`, `noSafeDefault` and `questions`
  (the calibration members found a home in DEC-0144).
- The agreement threshold a reader asks of a calibrated judge (the asker's 80 %) and how it ranks or alerts on a judge
  below it: the reader's.
- `replyCoverage` is over inbound messages for `chat` and `mail` and over owed questions for `community` and
  `reviews`, as the standard measures it; a later revision may name the basis.
- The move from the asker's first implementation (its v2 shape, under its own URN): its producers move to
  `support-quality-daily/1`, and until then a `/1` reader reads none of their events (board row CT-61).
