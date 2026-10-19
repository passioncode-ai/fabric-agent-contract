# Support quality: `support-quality-daily/1`

DEC-0095 · rule code `FAC-SEM-126` · schema [`support-quality-daily.schema.json`](../../schemas/support-quality-daily.schema.json) ·
code [`src/support-quality-rules.ts`](../../src/support-quality-rules.ts) · tests
[`test/support-quality.test.ts`](../../test/support-quality.test.ts) · fixtures `fixtures/positive/support-quality-daily.json`,
`fixtures/semantic/support-quality-daily-*`

An agent that answers people (chat, mail, reviews, community) publishes, on its events feed, one event per closed UTC
day and channel whose `data` ([service](service.md#event-data), DEC-0070) is this payload: `data.schema` is this
schema's `$id`, `data.value` the payload. A voice-of-the-customer reader then reads every agent the same way. The
standard behind it (what is measured, the rubric, the judge) is the asker's, issue #125; the contract owns the shape.

## The payload

| Member | What |
|---|---|
| `kind` | `support-quality-daily/1` |
| `day`, `channel` | the closed UTC day, and `chat`, `mail`, `reviews` or `community` |
| `rubricVersion`, `judgeModel` | the rubric's version and the judge's `<vendor>/<model>`, or `null` when nothing was judged |
| `notMeasured` | each metric not computed that day, as `family.metric` |
| `nobodyDropped` | `turns`, `replyCoverage` (0 to 1), `firstReplyP50Ms`, `firstReplyP90Ms`, `repeatAskRate`, `agentRepeats`, `answeredLater` |
| `quality` | the judged `sampled` turns, `helpedYes`, `helpedPartly`, `helpedNo`, and `checks`: each rubric check's pass rate |
| `stability` | `turnErrors`, `modelCallFailures`, `recoveredByFallback`, `processErrors`, `restarts`, `knowledgeAgeHours` |
| `autonomy` | `resolvedWithoutPerson`, `toPersonPolicy`, `toPersonInability`, `queueOldestMinutes`, `queueSlaMinutes` |

Counts and rates only: no person's words, no ids and no judge notes, so `FAC-SEM-101`'s detector has nothing to find.
It fits `data.value`'s two levels.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| `FAC-SEM-126` | `support-quality-daily` | a metric not computed is `null` and named in `notMeasured`, and a named one is `null`, never a `0` standing for it; the helped verdicts are at most the sample, the fallback's recoveries at most the failures, the outcomes at most the turns; p50 is at most p90; a judged sample names its rubric version and its judge |

## Not decided here

- The thresholds (reply coverage 100 %, helped yes at least 60 %, each check at least 90 %): the standard's, not the shape's.
- How a reader aggregates channels or alerts: the voice-of-the-customer agent's.
