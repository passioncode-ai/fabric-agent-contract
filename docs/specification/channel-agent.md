# Channel agent: `extensions/channel-agent/0.1`

DEC-0150 (CT-209) · rule codes `FAC-SEM-162` to `FAC-SEM-165` · schema
[`service-channel-agent-extension.schema.json`](../../schemas/service-channel-agent-extension.schema.json) · code
[`src/channel-agent.ts`](../../src/channel-agent.ts) · vectors
[`fixtures/vectors/channel-agent.json`](../../fixtures/vectors/channel-agent.json), written by
[`tools/vectors/channel-agent.ts`](../../tools/vectors/channel-agent.ts) · tests
[`test/channel-agent.test.ts`](../../test/channel-agent.test.ts) · fixtures
`fixtures/positive/service-channel-agent-extension.json`, `fixtures/positive/manifest-channel-agent.json`,
`fixtures/positive/service-well-known-channel-agent.json`, `fixtures/negative/service-channel-agent-extension-*`,
`fixtures/semantic/manifest-channel-agent-*`, `fixtures/semantic/service-well-known-channel-agent-*` · source
[the standard, v1 release candidate](../evidence/specs/2026-11-04-channel-agent-standard-v1-rc.md)

An agent that answers people on a channel (mail, a Telegram chat or group, store reviews, public comments, a team's
chat, a person's own account) follows `channel-agent-standard/1`. The standard is owned outside this repository: it
defines tickets, their outcomes, the question ladder, the daily loop and report, and the wire contracts of a signal
server and the desks that ask people. This contract owns one part of it, the declaration the standard's section 11 asks
each agent to publish and the checks section 11 makes of it statically. What the signal server observes (the last
ticket write, the daily note, source ages, gap ages, the eval suite's last run) is not a document this contract checks.
The daily quality payload the standard's section 5.1 publishes is [support quality](support-quality.md)'s; see
[Compatibility](#compatibility).

## Where it is declared

The extension key is `https://fabric.passioncode.ai/agent-contract/extensions/channel-agent/0.1`
([`src/extensions.ts`](../../src/extensions.ts) `EXTENSION_KEYS.channelAgent`, G-08). A reader reads it in two places
and nowhere else (DEC-0150 CA-1):

- under `provider.extensions` of the agent's manifest, `fabric-agent.json` ([profiles](profiles.md)), beside the
  [service](service.md) extension; the key under the manifest's own `extensions` or a capability's `extensions` is not
  read, and a checker reports it (`FAC-SEM-162`);
- for a service with no manifest (a cloud bot), under `extensions` of its `/.well-known/fabric-service` answer
  ([service](service.md#well-known-document)), where the actions and load keys also sit.

A service with a manifest declares only in its manifest: a reader of such a service reads the manifest's declaration and
ignores one in its well-known answer. The checker still checks a well-known declaration beside a manifest, so its author
sees the findings and removes it. A well-known answer lists `channel-agent-standard/1` in its `protocols` only once
its readers have re-pinned to this revision of the contract.

The same rules run in both places: kind `manifest` reads the first, kind `service-well-known` the second. No other
kind runs them, a wrapper kind such as `service-observation` included. The manifest's and the well-known answer's
schemas leave the value open, as every vendor extension is ([overview](overview.md)); its shape is
[`service-channel-agent-extension.schema.json`](../../schemas/service-channel-agent-extension.schema.json), which refers
to no other file, so a kit vendors that one file. A reader treats an invalid value as not declared and reports it, as
with the [actions](service.md#actions) and [load](agent-network.md#load) keys. A bare declaration checked on its own
(`pnpm validate --schema service-channel-agent-extension.schema.json`) gets the generic schema check, whose lines may
name an undeclared member as written, and a hint, `hint/declaration-only`: `FAC-SEM-163` to `FAC-SEM-165` run only
inside a manifest or a well-known answer. Check the manifest or the well-known answer instead.

## The declaration

`{standard, projects}`: `standard` is `channel-agent-standard/1`, and `projects` holds one entry per project the agent
serves (at most 64), each project once (DEC-0150 CA-2, the standard's section 13.6):

| Member | What | Shape |
|---|---|---|
| `project`, `side`, `lead_agent`, `adopted_at` | the project, the side the agent expects, its lead agent, the day it adopted the standard | `project:<slug>`; `^[a-z0-9-]{1,32}$`; an id; `YYYY-MM-DD` |
| `taxonomy` | `{version, codes[]}`, each code `{code, label}`, a ticket's category | a version; `^[a-z0-9_.]{1,64}$`, each once |
| `tiers` (optional) | `{code, label, rule, escalate}` | `^[a-z0-9_]{1,32}$`, each once; `rule` is `<fact> > <integer>` or `<fact> >= <integer>` with one space each side and an integer of at most 15 digits; `escalate` is `at_once` or `ladder` |
| `question_route` | `{capability, target, daily_cap, days, tz, send_at, expires}` | `team.ask` or `operator.ask`; the desk's Fabric Project id as `com.submit` addresses it; 1 to 1000; days and ranges (`mon-fri`); `UTC` or an IANA name; `HH:MM`; a duration |
| `gap_registry` | `{owner, capability}` | an id; a capability name |
| `channels` | at least one `{id, kind, replies_enabled, decision, final_limit, first_reply_limit, holding_reply, clarifying_question, quiet_window?, late_answer_window?, items_seen_unit, texts}` | `^[a-z0-9][a-z0-9_-]{0,63}$`, each once; `telegram_dm`, `telegram_group`, `mail`, `store_review`, `public_comment`, `team_chat` or `account`; a decision id or `null`; durations; `mails`, `updates`, `messages` or `reviews`; `texts` is `{holding?, final?}`, each a map from a BCP 47 tag to a text of 1 to 4096 code points |
| `sources` | at least one `{id, owner, read, cadence, max_age}` | ids; `read` a word (`url`, `api`, `export`), not an address; durations |
| `declined_sources` (optional) | `{id, decision}` | ids; a source id is not both read and declined |
| `handoff_queues` | `{id, owner, limit, answered_signal, recommendation?}` | ids, each queue once; a duration; a signal name or `none`; the board thread of the recommendation |
| `evals` | `{suite, judge_budget_usd, replay_budget_usd, spend_record?}` | a path in the agent's repository or a name; numbers in USD as the usage report's limits, except that 0 is allowed here and means no budget; a budget above 0 is spent under the usage-report limit `spend_record` names (DEC-0027), its id or `null` |
| `tickets` | `{outbox, token_slot, pd_check}` | a table name or a path in the agent's repository; the slot `<project>/<env>/<NAME>`; `<name>@<version>` |
| `recorded_decisions` (optional) | `{id, date, effect}` | an id, each once; `YYYY-MM-DD`; a word (`replies_off`) |

### Grammar

Every member, with the schema's own limit on it: the pattern it matches, its length in code points, its count of items
or members, its bounds. `test/channel-agent.test.ts` walks the schema and holds each line to it, so this list and the
schema cannot drift apart.

- `standard`: exactly `channel-agent-standard/1`
- `projects`: an array of 1 to 64 items
- `projects[]`: an object with only the members listed under it; required: `project`, `side`, `lead_agent`, `adopted_at`, `taxonomy`, `question_route`, `gap_registry`, `channels`, `sources`, `handoff_queues`, `evals`, `tickets`
- `projects[].project`: a string matching `^project:[a-z0-9][a-z0-9._-]{0,127}$`
- `projects[].side`: a string matching `^(?![a-z0-9-]*[0-9]{7})[a-z0-9-]{1,32}$`
- `projects[].lead_agent`: a string matching `^(?![A-Za-z0-9._:-]*[0-9]{7})[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$`
- `projects[].adopted_at`: a string matching `^[0-9]{4}-[0-9]{2}-[0-9]{2}$`, a real calendar date (format `date`)
- `projects[].taxonomy`: an object with only the members listed under it; required: `version`, `codes`
- `projects[].taxonomy.version`: a string matching `^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$`
- `projects[].taxonomy.codes`: an array of 1 to 512 items
- `projects[].taxonomy.codes[]`: an object with only the members listed under it; required: `code`, `label`
- `projects[].taxonomy.codes[].code`: a string matching `^(?![a-z0-9_.]*[0-9]{7})[a-z0-9_.]{1,64}$`
- `projects[].taxonomy.codes[].label`: a string of 1 to 120 code points
- `projects[].tiers`: an array of 0 to 16 items
- `projects[].tiers[]`: an object with only the members listed under it; required: `code`, `label`, `rule`, `escalate`
- `projects[].tiers[].code`: a string matching `^(?![a-z0-9_]*[0-9]{7})[a-z0-9_]{1,32}$`
- `projects[].tiers[].label`: a string of 1 to 40 code points
- `projects[].tiers[].rule`: a string matching `^[a-z][a-z0-9_]{0,63} >=? (0|[1-9][0-9]{0,14})$`
- `projects[].tiers[].escalate`: one of `at_once`, `ladder`
- `projects[].question_route`: an object with only the members listed under it; required: `capability`, `target`, `daily_cap`, `days`, `tz`, `send_at`, `expires`
- `projects[].question_route.capability`: one of `team.ask`, `operator.ask`
- `projects[].question_route.target`: a string matching `^[A-Za-z0-9][A-Za-z0-9._:-]{0,191}$`
- `projects[].question_route.daily_cap`: an integer from 1 to 1000
- `projects[].question_route.days`: a string matching `^(mon|tue|wed|thu|fri|sat|sun)(-(mon|tue|wed|thu|fri|sat|sun))?(,(mon|tue|wed|thu|fri|sat|sun)(-(mon|tue|wed|thu|fri|sat|sun))?)*$`
- `projects[].question_route.tz`: a string matching `^[A-Za-z][A-Za-z0-9_+-]{0,30}(/[A-Za-z0-9_+-]{1,30}){0,2}$`
- `projects[].question_route.send_at`: a string matching `^([01][0-9]|2[0-3]):[0-5][0-9]$`
- `projects[].question_route.expires`: a string matching `^P(?=[0-9T])(?!(0+D)?(T(0+H)?(0+M)?(0+S)?)?$)([0-9]{1,5}D)?(T(?=[0-9])([0-9]{1,5}H)?([0-9]{1,5}M)?([0-9]{1,5}S)?)?$`
- `projects[].gap_registry`: an object with only the members listed under it; required: `owner`, `capability`
- `projects[].gap_registry.owner`: a string matching `^(?![A-Za-z0-9._:-]*[0-9]{7})[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$`
- `projects[].gap_registry.capability`: a string matching `^[a-z][a-z0-9._-]{1,127}$`
- `projects[].channels`: an array of 1 to 32 items
- `projects[].channels[]`: an object with only the members listed under it; required: `id`, `kind`, `replies_enabled`, `decision`, `final_limit`, `first_reply_limit`, `holding_reply`, `clarifying_question`, `items_seen_unit`, `texts`
- `projects[].channels[].id`: a string matching `^(?![a-z0-9_-]*[0-9]{7})[a-z0-9][a-z0-9_-]{0,63}$`
- `projects[].channels[].kind`: one of `telegram_dm`, `telegram_group`, `mail`, `store_review`, `public_comment`, `team_chat`, `account`
- `projects[].channels[].replies_enabled`: `true` or `false`
- `projects[].channels[].decision`: a string matching `^(?![A-Za-z0-9._:-]*[0-9]{7})[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$` or `null`
- `projects[].channels[].final_limit`: a string matching `^P(?=[0-9T])(?!(0+D)?(T(0+H)?(0+M)?(0+S)?)?$)([0-9]{1,5}D)?(T(?=[0-9])([0-9]{1,5}H)?([0-9]{1,5}M)?([0-9]{1,5}S)?)?$`
- `projects[].channels[].first_reply_limit`: a string matching `^P(?=[0-9T])(?!(0+D)?(T(0+H)?(0+M)?(0+S)?)?$)([0-9]{1,5}D)?(T(?=[0-9])([0-9]{1,5}H)?([0-9]{1,5}M)?([0-9]{1,5}S)?)?$`
- `projects[].channels[].holding_reply`: `true` or `false`
- `projects[].channels[].clarifying_question`: `true` or `false`
- `projects[].channels[].quiet_window`: a string matching `^P(?=[0-9T])(?!(0+D)?(T(0+H)?(0+M)?(0+S)?)?$)([0-9]{1,5}D)?(T(?=[0-9])([0-9]{1,5}H)?([0-9]{1,5}M)?([0-9]{1,5}S)?)?$` or `null`
- `projects[].channels[].late_answer_window`: a string matching `^P(?=[0-9T])(?!(0+D)?(T(0+H)?(0+M)?(0+S)?)?$)([0-9]{1,5}D)?(T(?=[0-9])([0-9]{1,5}H)?([0-9]{1,5}M)?([0-9]{1,5}S)?)?$` or `null`
- `projects[].channels[].items_seen_unit`: one of `mails`, `updates`, `messages`, `reviews`
- `projects[].channels[].texts`: an object with only the members listed under it
- `projects[].channels[].texts.holding`: a map of 1 to 64 members, each name a language tag of at most 35 characters matching `^[A-Za-z]{2,8}(-[A-Za-z0-9]{1,8})*$`, each value a text of 1 to 4096 code points
- `projects[].channels[].texts.final`: a map of 1 to 64 members, each name a language tag of at most 35 characters matching `^[A-Za-z]{2,8}(-[A-Za-z0-9]{1,8})*$`, each value a text of 1 to 4096 code points
- `projects[].sources`: an array of 1 to 64 items
- `projects[].sources[]`: an object with only the members listed under it; required: `id`, `owner`, `read`, `cadence`, `max_age`
- `projects[].sources[].id`: a string matching `^(?![A-Za-z0-9._:-]*[0-9]{7})[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$`
- `projects[].sources[].owner`: a string matching `^(?![A-Za-z0-9._:-]*[0-9]{7})[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$`
- `projects[].sources[].read`: a string matching `^[a-z][a-z0-9_-]{0,31}$`
- `projects[].sources[].cadence`: a string matching `^P(?=[0-9T])([0-9]{1,5}D)?(T(?=[0-9])([0-9]{1,5}H)?([0-9]{1,5}M)?([0-9]{1,5}S)?)?$`
- `projects[].sources[].max_age`: a string matching `^P(?=[0-9T])(?!(0+D)?(T(0+H)?(0+M)?(0+S)?)?$)([0-9]{1,5}D)?(T(?=[0-9])([0-9]{1,5}H)?([0-9]{1,5}M)?([0-9]{1,5}S)?)?$`
- `projects[].declined_sources`: an array of 0 to 64 items
- `projects[].declined_sources[]`: an object with only the members listed under it; required: `id`, `decision`
- `projects[].declined_sources[].id`: a string matching `^(?![A-Za-z0-9._:-]*[0-9]{7})[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$`
- `projects[].declined_sources[].decision`: a string matching `^(?![A-Za-z0-9._:-]*[0-9]{7})[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$`
- `projects[].handoff_queues`: an array of 0 to 32 items
- `projects[].handoff_queues[]`: an object with only the members listed under it; required: `id`, `owner`, `limit`, `answered_signal`
- `projects[].handoff_queues[].id`: a string matching `^(?![A-Za-z0-9._:-]*[0-9]{7})[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$`
- `projects[].handoff_queues[].owner`: a string matching `^(?![A-Za-z0-9._:-]*[0-9]{7})[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$`
- `projects[].handoff_queues[].limit`: a string matching `^P(?=[0-9T])(?!(0+D)?(T(0+H)?(0+M)?(0+S)?)?$)([0-9]{1,5}D)?(T(?=[0-9])([0-9]{1,5}H)?([0-9]{1,5}M)?([0-9]{1,5}S)?)?$`
- `projects[].handoff_queues[].answered_signal`: a string matching `^(?![A-Za-z0-9._:-]*[0-9]{7})[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$`
- `projects[].handoff_queues[].recommendation`: a string matching `^[A-Za-z0-9_-]{8,128}$`
- `projects[].evals`: an object with only the members listed under it; required: `suite`, `judge_budget_usd`, `replay_budget_usd`
- `projects[].evals.suite`: a string of 1 to 256 code points matching `^(?![/~])(?![A-Za-z]:)(?!(?:[^/]*/)*\.\.(?:/|$))[A-Za-z0-9._:/-]+$`
- `projects[].evals.judge_budget_usd`: a number of at least 0 (minimum 0)
- `projects[].evals.replay_budget_usd`: a number of at least 0 (minimum 0)
- `projects[].evals.spend_record`: a string matching `^[a-z0-9][a-z0-9._:-]{0,63}$` or `null`
- `projects[].tickets`: an object with only the members listed under it; required: `outbox`, `token_slot`, `pd_check`
- `projects[].tickets.outbox`: a string of 1 to 256 code points matching `^(?![/~])(?![A-Za-z]:)(?!(?:[^/]*/)*\.\.(?:/|$))[A-Za-z0-9._:/-]+$`
- `projects[].tickets.token_slot`: a string matching `^[a-z0-9][a-z0-9._-]{0,127}/[a-z][a-z0-9-]{0,31}/[A-Z][A-Z0-9_]{0,63}$`
- `projects[].tickets.pd_check`: a string matching `^[a-z0-9][a-z0-9._-]{0,63}@[0-9A-Za-z][0-9A-Za-z.+-]{0,31}$`
- `projects[].recorded_decisions`: an array of 0 to 64 items
- `projects[].recorded_decisions[]`: an object with only the members listed under it; required: `id`, `date`, `effect`
- `projects[].recorded_decisions[].id`: a string matching `^(?![A-Za-z0-9._:-]*[0-9]{7})[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$`
- `projects[].recorded_decisions[].date`: a string matching `^[0-9]{4}-[0-9]{2}-[0-9]{2}$`, a real calendar date (format `date`)
- `projects[].recorded_decisions[].effect`: a string matching `^[a-z][a-z0-9_]{0,63}$`

### What the members mean

`project` is the project's id in the project registry, `project:<slug>`, with the registry alias pattern unchanged,
`^project:[a-z0-9][a-z0-9._-]{0,127}$` (the memory capability's pattern; DEC-0151, in progress on CT-210, proposes the
same `projectAlias`): a registry
alias is the registry's name, not an id the agent invents, so the run-of-digits rule of an id does not bind it. It is an
alias of the Fabric Project, compared as written ([identifiers](identifiers.md)), while `question_route.target` is the canonical Fabric Project id the board
addresses. DEC-0151 (CT-210, in progress) proposes the same alias for `support-quality-daily` payloads; once it lands,
a reader joins a declaration to a project's payloads on `project:<slug>`. A project whose registry alias the detector
reads as a credential (`FAC-SEM-165`) cannot be declared until the registry changes the alias; meanwhile the agent
leaves that project's entry out. A queue's `recommendation` is the board thread's id, an opaque id as the board
writes it (`^[A-Za-z0-9_-]{8,128}$`, the board's `opaqueId`), which the run-of-digits rule of an id does not bind.

`token_slot` names the vault slot of the (agent, project) token: `<project>` is the vault project's name,
`^[a-z0-9][a-z0-9._-]{0,127}$` (not the declaration's `project:<slug>`, whose colon it refuses), `<env>` is
`^[a-z][a-z0-9-]{0,31}$` and `<NAME>` is `^[A-Z][A-Z0-9_]{0,63}$` (the code's `TOKEN_SLOT`, held equal by a test). The
token itself is never written.

An id is a letter or digit, then up to 127 of letters, digits and `. _ : -`, with no run of 7 or more digits (a phone
or an account number, as the standard's `id_looks_personal` refuses, its section 13.2); it holds no `@`, slash or
space, so no person's address and no path fits where the standard asks for ids only. The id grammar covers
`lead_agent`, every `owner` (the gap registry's, a source's and a queue's), the ids of sources, declined sources,
queues and recorded decisions, a declined source's and a channel's `decision`, and a queue's `answered_signal`. The same
run of digits is refused in the side and a category code, each otherwise the standard's own pattern, and in a channel's
id and a tier code, whose grammars are this contract's where the standard gives none: a channel's id
`^[a-z0-9][a-z0-9_-]{0,63}$`, a tier code `^[a-z0-9_]{1,32}$`. Three members keep another owner's grammar: `question_route.target` the board's project id
(`^[A-Za-z0-9][A-Za-z0-9._:-]{0,191}$`), `evals.spend_record` the usage report's limit id
(`^[a-z0-9][a-z0-9._:-]{0,63}$`) and a queue's `recommendation` the board's `opaqueId`. A path (`suite`, `outbox`) is relative to the agent's repository: never `/`, `~` or a drive letter first, and
no `..` segment. A duration is ISO 8601 in days, hours, minutes and seconds (`P7D`, `PT1H`, `P1DT12H`), above zero:
years, months and weeks, whose length depends on the calendar, are refused, and so is an all-zero duration (`P0D`,
`PT0S`), except a source's `cadence`, where zero means the source is read on every question. A source's `max_age`
stays above zero: the standard's signal server reports a source's age against it, so zero would read as always stale. A time zone
is an IANA name of one segment (`UTC`, `GMT`, `CET`) or of two or three (`Etc/UTC`, `Europe/Warsaw`,
`America/Argentina/Buenos_Aires`). A text's length is counted in Unicode code points, as JSON Schema's `maxLength`
counts it, and a text's language is at most 35 characters.

`question_route.daily_cap` is to be read as the agent's declared cap for this project's questions, with the desk's own
cap across its side (the standard's section 6.4) still binding, so a project's questions may wait for the desk's next
slot below it; this reading is to be confirmed with the standard's owner on thread `b6820b97` at merge.

## What is checked

Statically, on a manifest (kind `manifest`) or a well-known answer (kind `service-well-known`), as section 11 asks:

1. The value is the schema's, where a reader reads it (`FAC-SEM-162`, DEC-0150 CA-1, CA-2): present members,
   patterns, the side's and the codes' patterns, durations, the tier rule's grammar, the budgets' type, the slot's
   grammar; an empty text is refused here, and so is a `null` for the question route, the gap registry, a channel's
   texts, the personal-data check or a queue's recommendation (one finding,
   `fixtures/semantic/manifest-channel-agent-nulls.json`), while a channel's `decision`, `quiet_window` and
   `late_answer_window` and `evals.spend_record` take `null`. Refused before the schema runs, so the schema never runs on
   a huge value, each limit read from the schema itself: an array longer than its `maxItems` and a map wider than its
   `maxProperties`; any closed object (the declaration, a project, its taxonomy, a code, a tier, the question route,
   the gap registry, a source, a declined source, a queue, the evals, the tickets, a recorded decision, a channel and
   its texts) with more members than the schema declares (`maxProperties`, named "more members than the schema
   declares"); a string value or a member name longer than 4096 code points (`maxLength`). A value the schema still cannot run on is one finding, "the value is too
   large to check". The finding names at most ten failed keywords with their places and counts the rest; a missing
   member the schema declares is named beside its place (`required at /projects/0 (question_route)`); in a place, a
   member name the schema does not declare (an unknown member), a text's language and a number that is no index of an
   array the schema declares are written `*`, and so is a numeric key of an object. Beside each failed limit the place
   names what the schema allows, from the schema alone: for `enum` its values (at most 8, the rest counted), `const`
   its value, `pattern` its pattern (cut to 80 characters, each distinct pattern spelled once per message), `maxLength`
   and `minLength` the length, `maxItems`, `minItems`, `maxProperties` and `minProperties` the count, `minimum` and
   `maximum` the bound, `format` the format (`enum at /projects/0/question_route/capability (one of team.ask,
   operator.ask)`, `maximum at /projects/0/question_route/daily_cap (<= 1000)`). The message points to
   [the declaration's grammar](#grammar), which states every limit the schema enforces.
2. Every id once and every decision named (`FAC-SEM-163`, CA-3): a project, a category code, a tier code, a channel, a
   source (a declined one counted with the read ones), a hand-off queue and a recorded decision appear once; a channel
   with replies off names the decision that holds it, and a channel's decision is one `recorded_decisions` lists.
3. What a channel, a queue and the budgets owe (`FAC-SEM-164`, CA-4): a channel with `holding_reply` declares its
   holding text and one with replies on its final text; a store review asks no clarifying question; no declared text is
   blank or carries an em dash (U+2014), which the standard's send checks refuse (its section 2.4), and no tier's label
   either, since the customer may be told it; a queue whose
   answered signal is `none` names its recommendation; a budget above 0 names the usage report's limit it is spent
   under, since without one it reads 0.
4. No member name and no string of the value is shaped like a credential (`FAC-SEM-165`, CA-5), by shape, with the
   detector of `FAC-SEM-101`, on a valid or an invalid value and on a misplaced one where it stands. Three places read
   narrower, each only when the value matches its own grammar, and anything else is read whole: a project's
   `tickets.token_slot` of the slot's grammar is read segment by segment, so a provider key in any of its three segments
   is found; a project's `evals.suite` and `tickets.outbox` of the relative path grammar are read by the detector's
   path-aware reading (`secretArgument` and `secretUrl` on the whole path), so a long path of ordinary segments is not
   taken for one secret and a long base64 segment is; a queue's `recommendation` of the board's `opaqueId` grammar is
   read by a provider key's and a JWT's shapes only, since a long mixed run is its shape by design (a recommendation
   that is a URL with a password is read whole, and found). The detector reads the first 4097 code points of a string,
   and the rule reads at most 1 000 000 code points of names and values in all for one document, every copy of the
   declaration in it (read or misplaced) sharing them. The count, `detectorCost`, is a bound any port's detector may
   need, not a description of one detector, counted in code points (an astral character is one): each name or string
   costs 16 plus its code points, once (a name is not charged again when its member is entered or placed); after each
   `eyJ`, the rest of the base64url run it starts and, when that run ends at a `.`, the dot and the base64url run after
   it (the JWT shape's second segment); after each `sk-`, in any case, that follows a boundary, up to 255 code points to
   the end of the string. A boundary is the start, a character other than a letter or a digit, or an escape that ends
   right before the `sk-`: `%XX`, `%25XX`, `\xHH`, `\uHHHH`, a two- or three-digit octal escape, a backslash escape of
   one character, or a colour sequence `ESC[...m` with any number of parameter characters whose ESC is raw or escaped
   (`\x1b`, `\033`, `\u001b` in either case of the hex digits, or `\e`). For a string that parses as a URL, the URL
   terms are counted on the names and values a WHATWG URL parse yields (tab, line feed and carriage return removed,
   percent-decoded), not on the raw text: for every query or fragment piece, 128, its name's and its value's code
   points, the value's `eyJ` and `sk-` terms and, when the value is not empty and the name holds an upper-case letter,
   the square of the name's length over two. A member's name is read before its place is written; once the budget is spent nothing more is read and every further member collapses its place. Past the
   budget, one finding at the first copy walked says, once per document, that the rest was not read for credentials,
   and the 64 places are counted per document too. Being by shape, the detector also finds an ordinary hyphenated name
   that starts with `sk-`: today any `sk-` followed by 16 or more letters, digits, `_` or `-`, in any case, such as the
   valid channel id `sk-support-desk-faq-answers-2026-v2` (a test pins it). DEC-0151, in progress, proposes to narrow
   that to a digit with an upper-case letter and 16, or a digit and 32; either way, do not start an id with `sk-`.

No finding's message carries a declared value, and no rule's place echoes instance data: a place writes a member name
the schema declares and an index of an array the schema declares, and `*` for any other member name, for a numeric key
of an object and for a text's language, in `FAC-SEM-162`, `FAC-SEM-164` and `FAC-SEM-165` alike. A member whose name
is not plain (letters, digits, `_` and `-`, at most 64, with no run of 7 or more digits once `-` and `_` are left out)
or is itself shaped like a credential collapses its place: it and every member below it are placed at its nearest
plain ancestor (a text whose language is not plain is placed at its `texts/holding` or `texts/final` map), and so is a
member more than 64 levels below the declaration, at its ancestor 64 levels down. `FAC-SEM-165` names at most 64 places, then one more finding at the declaration counts the rest. The walk keeps
an explicit stack of one frame per container, not per member, and builds a member's place only when it reports one, so
no depth or size of a value throws and the time grows with the value's size, not its square. Memory grows linearly too:
measured on chains of 50 000 and 200 000 nested members, a run allocates about 2.5 to 3.6 times the input's own heap
before collection, and four times the input takes about four times the memory. A text counts as blank
when nothing is left after removing white space, format characters (`\p{Cf}`, such as U+200B), control characters
(`\p{Cc}`), separators (`\p{Z}`), default-ignorable code points (`\p{Default_Ignorable_Code_Point}`), the filler
characters U+115F, U+1160, U+3164, U+FFA0 and U+2800, and the object replacement character U+FFFC.

The vectors list each case with the findings a checker reports, `{code, instancePath}`, with its `site` (`manifest` or
`well-known`), in the reference's order: in a manifest `FAC-SEM-162` for a misplaced key, each followed by its own `FAC-SEM-165`
findings, then the read declaration's `FAC-SEM-165`, then
`FAC-SEM-162` for an invalid value (and nothing after it), then per project `FAC-SEM-163` and `FAC-SEM-164`. A port may
compare them as a set.

A reader acts on the findings as `channelAgentView` does (DEC-0150 CA-5): a declaration with `FAC-SEM-162`, with
`FAC-SEM-165` (a credential-shaped name or value, or a part left unread for credentials) or with `FAC-SEM-163` (a
repeated project or id, a channel with replies off and no decision, a decision not recorded) is not declared, as with
the [connections](connections.md) key; a declaration with only `FAC-SEM-164` stays declared, and the reader shows those
findings to its author. A reader never displays a credential-shaped value: its errors name the rule and the place only.

## Not checked here

Section 11 also asks for these; none can be decided from the declaration alone (DEC-0150 CA-6):

- that `side` is one of the standard's sides, and that the route is `team.ask` exactly for a product team's side and
  `operator.ask` for the operator's: side codes live only in the signal server's data, which also says which side is
  whose;
- that a tier's fact is a customer fact the project declares: the declaration lists no facts;
- that the lead agent, the owners, the gap registry's capability, the desk's target and the usage report's limit id
  exist: a checker that reads the estate, the board or the usage report checks them there;
- the reference values (a 7-day final limit, a 1-hour first reply, the operator desk's cap of 10 and a team desk's 15):
  the standard's references, which an agent may declare otherwise;
- the meaning of `daily_cap`: to be read as the agent's declared per-project cap, below the desk's side-wide cap of
  section 6.4, which still binds; this reading is to be confirmed with the standard's owner on thread `b6820b97` at
  merge;
- sides across projects: a declaration may hold projects on several sides, which the standard's rule that nothing is
  composed across sides may not intend; this is to be asked of the standard's owner on thread `b6820b97` at merge;
- a declaration in both places: a valid declaration in a service's manifest and another in its well-known answer draw
  no finding for being two; readers read the manifest's;
- working time: a limit the standard counts in working hours or days (a desk's 2 working days, a team chat's first reply
  in 1 working hour) is declared as a wall-clock duration, and its working calendar is not declared;
- everything the signal server observes, and the 30 days after `adopted_at` in which its checks report but do not
  fail.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-162"></a>`FAC-SEM-162` | `manifest`, `service-well-known` | a value under the channel-agent extension key sits under a manifest's `provider.extensions` (not its own `extensions` or a capability's) or a well-known answer's `extensions`, has no array, map or object longer than its schema allows nor a string or name over 4096 code points, and is valid against `service-channel-agent-extension.schema.json`; a reader treats an invalid one as not declared and reports it, naming failed keywords and places, never a declared value, with the schema's own limit beside each place, and pointing to the declaration's grammar (DEC-0150 CA-1, CA-2) |
| <a id="fac-sem-163"></a>`FAC-SEM-163` | `manifest`, `service-well-known` | in a valid channel-agent declaration a project, a category code, a tier code, a channel id, a source id (read or declined), a hand-off queue id and a recorded decision id appear once; a channel with replies off names a decision, and every channel's decision is one `recorded_decisions` lists (DEC-0150 CA-3) |
| <a id="fac-sem-164"></a>`FAC-SEM-164` | `manifest`, `service-well-known` | in a valid channel-agent declaration a channel with a holding reply declares its holding text and one that replies its final text; a store review asks no clarifying question; no text is blank or carries U+2014; no tier's label is blank or carries U+2014; a queue whose answered signal is `none` names its recommendation; a budget above 0 names its spend record (DEC-0150 CA-4) |
| <a id="fac-sem-165"></a>`FAC-SEM-165` | `manifest`, `service-well-known` | no member name and no string of a channel-agent declaration is shaped like a credential, by shape (`FAC-SEM-101`'s detector), a misplaced one included, a token slot of its grammar read segment by segment, a suite's and an outbox's relative path by the path-aware reading, a queue's opaque recommendation by key shapes only; at most 1 000 000 code points read per document and 64 places named, each once per document (DEC-0150 CA-5) |

## Compatibility

Additive: a new extension key, which a reader that does not know it ignores (the [extension rule](overview.md)), and
four rules that read only a manifest or a well-known answer that carries it. No existing schema changes, and every
existing fixture validates and checks as before. `contractVersion` stays `0.1.0`.

- **The key's version.** The key is `0.1`; the standard names version 1 once a consumer passes the vectors, which a
  later decision records (DEC-0150 CA-7). Until that decision, readers read `/0.1` only; the decision that moves the key
  names the window in which readers read both keys.
- **The standard's version.** `channel-agent-standard/1` is the only version a declaration names. A new version of the
  standard needs a contract revision before any agent declares it: until then `channel-agent-standard/2` is refused
  (`FAC-SEM-162` in a declaration, and `FAC-SEM-099` in a `protocols` list that names it).
- **The daily quality payload.** The standard's section 5.1 publishes [`support-quality-daily/1`](support-quality.md)
  per project, where `/1` keeps one channel of four per event, with members `/1` does not have (`arrived`, `ended`,
  `open.*`, the outcomes, `autonomy.answered`, `stability.fallbackTurns` and `stability.fallbackTickets`,
  `notATicket`). Section 5.1 defers only the fields it marks new: "publish them once every reader of the feed takes
  that schema"; `autonomy.answered` and `stability.fallbackTurns`, which it treats as present, are not in `/1`
  either, and it counts `toPersonPolicy` and `toPersonInability` in tickets where `/1` counts turns. That schema, the
  unit of those counts and how the seven channel kinds here map to `/1`'s four channels (`chat`, `mail`, `reviews`,
  `community`) are what DEC-0151, in progress on CT-210, proposes. Until it lands, an agent following section 5.1 emits
  payloads this contract refuses, and an agent declaring several projects publishes no per-project
  `support.quality_daily` on a channel they share, because a `/1` reader keeps one event per service, channel and day,
  so the standard's observed per-project quality check reads missing for a shared channel.
- **Declarations published before this revision.** A declaration an agent published before this revision is read under
  these grammars; `pnpm validate` on its manifest or well-known answer shows which members it fails.

### Narrowings against the standard

This is the one list of what this contract refuses that the standard's section 13.6 admits or leaves open, held to the
schema ([grammar](#grammar)); DEC-0150's Compatibility and the merge post point here.

- Durations: days, hours, minutes and seconds only, no weeks, months or years; whole numbers of at most 5 digits per
  component; above zero, except a source's `cadence`, which may be zero.
- Ids (`lead_agent`, every `owner`, the ids of sources, declined sources, queues and recorded decisions, a `decision`,
  `answered_signal`): a letter or a digit first, then letters, digits and `. _ : -` only, at most 128 characters, no run
  of 7 or more digits; so an owner holds no space, no `@` and no slash.
- A channel's id: this contract's `^[a-z0-9][a-z0-9_-]{0,63}$` (the standard gives none), lower case, no dot, at most
  64 characters, no run of 7 or more digits.
- A tier code: this contract's `^[a-z0-9_]{1,32}$` (the standard gives none), lower case, no dot, no hyphen, at most 32
  characters, no run of 7 or more digits.
- The side and a category code: the standard's patterns, with no run of 7 or more digits.
- A tier's label: 1 to 40 code points; a category's label: 1 to 120 code points.
- A source's `read`: one lower-case word with no dot (`^[a-z][a-z0-9_-]{0,31}$`), which narrows the standard's section
  7.1 ("how it is read").
- The time zone: an IANA name of one to three segments (`UTC`, `Europe/Warsaw`, `America/Argentina/Buenos_Aires`).
- `days`: lower-case day names and ranges.
- `daily_cap`: an integer from 1 to 1000.
- A queue's `recommendation`: the board's `opaqueId`, at least 8 characters, no colon.
- `spend_record`: a lower-case usage-report limit id.
- `token_slot`: `<project>/<env>/<NAME>` with a lower-case `<env>`.
- `pd_check`: a lower-case name, then `@` and a version.
- A text's language: a language tag (no tag of private use only) of at most 35 characters; a text: 1 to 4096 code
  points.
- Counts: at most 64 projects, 512 category codes, 16 tiers, 32 channels, 64 sources, 64 declined sources, 32
  hand-off queues and 64 recorded decisions; 1 to 64 texts per map.
- `null`: refused for the question route, the gap registry, a channel's texts, the personal-data check and a queue's
  recommendation; taken by a channel's `decision`, `quiet_window` and `late_answer_window` and by `spend_record`. A
  missing required member, or a refused `null`, makes the whole declaration not declared.

The first consumer is owed by the Fabric Agent Adapter: its service check validates the declaration against this schema
and these vectors. The adapter's row is to be filed (the coordinator files it on the board); CT-209 here.
