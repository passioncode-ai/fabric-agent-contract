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
ignores one in its well-known answer. A well-known answer lists `channel-agent-standard/1` in its `protocols` only once
its readers have re-pinned to this revision of the contract.

The same rules run in both places: kind `manifest` reads the first, kind `service-well-known` the second. No other
kind runs them, a wrapper kind such as `service-observation` included. The manifest's and the well-known answer's
schemas leave the value open, as every vendor extension is ([overview](overview.md)); its shape is
[`service-channel-agent-extension.schema.json`](../../schemas/service-channel-agent-extension.schema.json), which refers
to no other file, so a kit vendors that one file. A reader treats an invalid value as not declared and reports it, as
with the [actions](service.md#actions) and [load](agent-network.md#load) keys. A bare declaration checked on its own
(`pnpm validate --schema service-channel-agent-extension.schema.json`) gets its shape checked and a hint,
`hint/declaration-only`: `FAC-SEM-163` to `FAC-SEM-165` run only inside a manifest or a well-known answer.

## The declaration

`{standard, projects}`: `standard` is `channel-agent-standard/1`, and `projects` holds one entry per project the agent
serves (at most 64), each project once (DEC-0150 CA-2, the standard's section 13.6):

| Member | What | Shape |
|---|---|---|
| `project`, `side`, `lead_agent`, `adopted_at` | the project, the side the agent expects, its lead agent, the day it adopted the standard | `project:<slug>`; `^[a-z0-9-]{1,32}$`; an id; `YYYY-MM-DD` |
| `taxonomy` | `{version, codes[]}`, each code `{code, label}`, a ticket's category | a version id; `^[a-z0-9_.]{1,64}$`, each once |
| `tiers` (optional) | `{code, label, rule, escalate}` | `^[a-z0-9_]{1,32}$`, each once; `rule` is `<fact> > <integer>` or `<fact> >= <integer>` with one space each side and an integer of at most 15 digits; `escalate` is `at_once` or `ladder` |
| `question_route` | `{capability, target, daily_cap, days, tz, send_at, expires}` | `team.ask` or `operator.ask`; the desk's Fabric Project id as `com.submit` addresses it; 1 to 1000; days and ranges (`mon-fri`); `UTC` or an IANA name; `HH:MM`; a duration |
| `gap_registry` | `{owner, capability}` | an id; a capability name |
| `channels` | at least one `{id, kind, replies_enabled, decision, final_limit, first_reply_limit, holding_reply, clarifying_question, quiet_window?, late_answer_window?, items_seen_unit, texts}` | `^[a-z0-9][a-z0-9_-]{0,63}$`, each once; `telegram_dm`, `telegram_group`, `mail`, `store_review`, `public_comment`, `team_chat` or `account`; a decision id or `null`; durations; `mails`, `updates`, `messages` or `reviews`; `texts` is `{holding?, final?}`, each a map from a BCP 47 tag to a text of 1 to 4096 characters |
| `sources` | at least one `{id, owner, read, cadence, max_age}` | ids; `read` a word (`url`, `api`, `export`), not an address; durations |
| `declined_sources` (optional) | `{id, decision}` | ids; a source id is not both read and declined |
| `handoff_queues` | `{id, owner, limit, answered_signal, recommendation?}` | ids, each queue once; a duration; a signal name or `none`; the board thread of the recommendation |
| `evals` | `{suite, judge_budget_usd, replay_budget_usd, spend_record?}` | a path in the agent's repository or a name; numbers in USD as the usage report's limits, except that 0 is allowed here and means no budget; a budget above 0 is spent under the usage-report limit `spend_record` names (DEC-0027), its id or `null` |
| `tickets` | `{outbox, token_slot, pd_check}` | a table name or a path in the agent's repository; the slot `<project>/<env>/<NAME>`; `<name>@<version>` |
| `recorded_decisions` (optional) | `{id, date, effect}` | an id, each once; `YYYY-MM-DD`; a word (`replies_off`) |

`project` is the project's id in the project registry, `project:<slug>`, with the registry alias pattern unchanged,
`^project:[a-z0-9][a-z0-9._-]{0,127}$` (the same as DEC-0151's `projectAlias` and the memory capability's): a registry
alias is the registry's name, not an id the agent invents, so the run-of-digits rule of an id does not bind it. It is an
alias of the Fabric Project, compared as written ([identifiers](identifiers.md)), while `question_route.target` is the canonical Fabric Project id the board
addresses. DEC-0151 (CT-210, in progress) gives `support-quality-daily` payloads the same alias; once it lands, a reader
joins a declaration to a project's payloads on `project:<slug>`. A queue's `recommendation` is the board thread's id, an opaque id as the board
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
run of digits is refused in a channel's id, the side, a category code and a tier code, each otherwise the standard's
own pattern. Three members keep another owner's grammar: `question_route.target` the board's project id
(`^[A-Za-z0-9][A-Za-z0-9._:-]{0,191}$`), `evals.spend_record` the usage report's limit id
(`^[a-z0-9][a-z0-9._:-]{0,63}$`) and a queue's `recommendation` the board's `opaqueId`. A path (`suite`, `outbox`) is relative to the agent's repository: never `/`, `~` or a drive letter first, and
no `..` segment. A duration is ISO 8601 in days, hours, minutes and seconds (`P7D`, `PT1H`, `P1DT12H`), above zero:
years, months and weeks, whose length depends on the calendar, are refused, and so is an all-zero duration (`P0D`,
`PT0S`), except a source's `cadence` and `max_age`, where zero means the source is read on every question. A time zone
is an IANA name of one segment (`UTC`, `GMT`, `CET`) or of two or three (`Etc/UTC`, `Europe/Warsaw`,
`America/Argentina/Buenos_Aires`). A text's length is counted in Unicode code points, as JSON Schema's `maxLength`
counts it, and a text's language is at most 35 characters.

## What is checked

Statically, on a manifest (kind `manifest`) or a well-known answer (kind `service-well-known`), as section 11 asks:

1. The value is the schema's, where a reader reads it (`FAC-SEM-162`, DEC-0150 CA-1, CA-2): present members,
   patterns, the side's and the codes' patterns, durations, the tier rule's grammar, the budgets' type, the slot's
   grammar; an empty text is refused here, and so is a `null` where section 13.6 says a member is present (a question
   route, a gap registry, a channel's texts, a personal-data check or a queue's recommendation of `null` is one finding,
   `fixtures/semantic/manifest-channel-agent-nulls.json`). Refused before the schema runs, so the schema never runs on
   a huge value, each limit read from the schema itself: an array longer than its `maxItems` and a map wider than its
   `maxProperties`; any closed object (the declaration, a project, its taxonomy, a code, a tier, the question route,
   the gap registry, a source, a declined source, a queue, the evals, the tickets, a recorded decision, a channel and
   its texts) with more members than the schema declares (`maxProperties`); a string value or a member name longer
   than 4096 code points (`maxLength`). A value the schema still cannot run on is one finding, "the value is too
   large to check". The finding names at most ten failed keywords with their places and counts the rest; a missing
   member the schema declares is named beside its place (`required at /projects/0 (question_route)`); in a place, a
   member name the schema does not declare (an unknown member), a text's language and a number that is no index of an
   array the schema declares are written `*`, and so is a numeric key of an object. The message points to the
   grammars in [the declaration](#the-declaration), and `pnpm validate --schema
   service-channel-agent-extension.schema.json` on the value alone lists the allowed values of each failed member.
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
   detector of `FAC-SEM-101`, on a valid or an invalid value and on a misplaced one where it stands; a token slot of the
   slot's grammar is read segment by segment, so a provider key in any of its three segments is found; the eval
   suite's and the outbox's paths are read by the detector's path-aware reading (`secretArgument` and `secretUrl` on
   the whole path), so a long path of ordinary segments is not taken for one secret and a long base64 segment is; a
   queue's
   `recommendation`, a board thread's id, is read by a provider key's and a JWT's shapes only, since a long mixed run is
   its shape by design. The detector reads the first 4097 code points of a string. Being by shape, it also finds an
   ordinary hyphenated name that starts with `sk-` and runs 16 more letters, digits, `_` or `-`
   (`sk-support-desk-faq-v2`): do not start an id with `sk-`.

No finding's message carries a declared value: its `instancePath` places it. A member whose name is not plain (letters,
digits, `_` and `-`, at most 64, with no run of 7 or more digits once `-` and `_` are left out) or is itself shaped like a
credential is placed at its
nearest plain ancestor, by `FAC-SEM-165` and `FAC-SEM-164` alike (a text whose language is not plain is placed at its
`texts/holding` or `texts/final` map), and a member more than 64 levels below the declaration at its ancestor 64 levels
down. `FAC-SEM-165` names at most 64 places, then one more finding at the declaration counts the rest. The walk keeps
an explicit stack of one frame per container, not per member, and builds a member's place only when it reports one, so
no depth or size of a value throws and the time grows with the value's size, not its square. A text counts as blank
when nothing is left after removing white space, format characters (`\p{Cf}`, such as U+200B), control characters
(`\p{Cc}`), separators (`\p{Z}`), default-ignorable code points (`\p{Default_Ignorable_Code_Point}`), the filler
characters U+115F, U+1160, U+3164, U+FFA0 and U+2800, and the object replacement character U+FFFC.

The vectors list each case with the findings a checker reports, `{code, instancePath}`, with its `site` (`manifest` or
`well-known`), in the reference's order: in a manifest `FAC-SEM-162` for a misplaced key, each followed by its own `FAC-SEM-165`
findings, then the read declaration's `FAC-SEM-165`, then
`FAC-SEM-162` for an invalid value (and nothing after it), then per project `FAC-SEM-163` and `FAC-SEM-164`. A port may
compare them as a set.

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
- sides across projects: a declaration may hold projects on several sides, which the standard's rule that nothing is
  composed across sides may not intend; its owner is asked on the board thread;
- working time: a limit the standard counts in working hours or days (a desk's 2 working days, a team chat's first reply
  in 1 working hour) is declared as a wall-clock duration, and its working calendar is not declared;
- everything the signal server observes, and the 30 days after `adopted_at` in which its checks report but do not
  fail.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-162"></a>`FAC-SEM-162` | `manifest`, `service-well-known` | a value under the channel-agent extension key sits under a manifest's `provider.extensions` (not its own `extensions` or a capability's) or a well-known answer's `extensions`, has no array, map or object longer than its schema allows nor a string or name over 4096 code points, and is valid against `service-channel-agent-extension.schema.json`; a reader treats an invalid one as not declared and reports it, naming failed keywords and places, never a declared value, and pointing to the declaration's grammars and to `pnpm validate --schema service-channel-agent-extension.schema.json` on the value alone (DEC-0150 CA-1, CA-2) |
| <a id="fac-sem-163"></a>`FAC-SEM-163` | `manifest`, `service-well-known` | in a valid channel-agent declaration a project, a category code, a tier code, a channel id, a source id (read or declined), a hand-off queue id and a recorded decision id appear once; a channel with replies off names a decision, and every channel's decision is one `recorded_decisions` lists (DEC-0150 CA-3) |
| <a id="fac-sem-164"></a>`FAC-SEM-164` | `manifest`, `service-well-known` | in a valid channel-agent declaration a channel with a holding reply declares its holding text and one that replies its final text; a store review asks no clarifying question; no text is blank or carries U+2014; no tier's label is blank or carries U+2014; a queue whose answered signal is `none` names its recommendation; a budget above 0 names its spend record (DEC-0150 CA-4) |
| <a id="fac-sem-165"></a>`FAC-SEM-165` | `manifest`, `service-well-known` | no member name and no string of a channel-agent declaration is shaped like a credential, by shape (`FAC-SEM-101`'s detector), a misplaced one included, a token slot of its grammar and the suite's and outbox's paths read segment by segment and a queue's recommendation by key shapes only; at most 64 places and a count (DEC-0150 CA-5) |

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
  `notATicket`). Section 5.1 defers its new
  fields itself: "publish them once every reader of the feed takes that schema". That schema is DEC-0151 (CT-210), in
  progress: until DEC-0151 lands, an agent following section 5.1 emits payloads this contract refuses, and how the seven
  channel kinds here map to `/1`'s four channels (`chat`, `mail`, `reviews`, `community`) is DEC-0151's to decide. Until
  then, an agent declaring several projects publishes no per-project `support.quality_daily` on a channel they share,
  because a `/1` reader keeps one event per service, channel and day.

The first consumer is owed by the Fabric Agent Adapter: its service check validates the declaration against this schema
and these vectors. The adapter's row is to be filed (the coordinator files it on the board); CT-209 here.
