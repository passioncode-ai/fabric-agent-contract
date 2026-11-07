# 2026-11-04: the channel agent standard's ticket counts (CT-210, DEC-0151)

## Objective

Answer the board request `74105ca1` (thread `b6820b97`): give the ticket counts of the channel agent standard's daily
loop (its v1 release candidate, section 5) a home in `support-quality-daily/1`, by the path DEC-0144 took, and let
`notMeasured` name `nobodyDropped.firstReplyP50Ms`, which FAC-SEM-126 asks for and the pattern refused (CT-129, X-4).

## Done

- DEC-0151 (proposed), [support quality](../specification/support-quality.md#the-ticket-counts-dec-0151): the optional
  `arrived`, `ended`, `notATicket`, `project` (`project:<slug>`), `open {handedOpen, questionOpen, awaitingCustomer,
  awaitingApproval}`, `outcomes {handoffsClosedByPerson, referred, answeredElsewhere, noReplyOwed, customerSilent,
  expiredByDecision, expired, unanswered, firstReplyLate, promotions}`, `autonomy.answeredTickets`, `stability.safeReplyTurns`
  and `safeReplyTickets`; the `notMeasured` pattern admits digits after the first letter of either part; the channel agent standard's
  seven channel kinds mapped onto `/1`'s four channels.
- `src/support-quality-rules.ts`: FAC-SEM-126's not-measured rule over the new members (one helper serves the families,
  the top-level counts and `calibration.helped`, with the same messages); a top-level name that is no metric (`project`,
  `day`, `kind`, a family) named in `notMeasured` is reported as "not a metric" instead of "not carried"; no sum rule,
  since the channel agent standard's section 5 states none (`fixtures/semantic/support-quality-daily-tickets-no-sum.json`).
- The schema's `calibration` description corrected ("an ISO week that starts no later than day"), as CT-188 noted.
- Fixtures: five positive (`support-quality-daily-tickets`, `-first-reply-unmeasured` and `-project`, and two events
  pages, `service-events-page-support-quality-projects` with two projects' days and `-sk-slug`), six negative (with
  catalogue rows), seven semantic. Tests: in `test/support-quality.test.ts`, DEC-0070's bounds (19 top-level members, 10
  in `outcomes`, 28 had the outcomes stood at the top level), the top-level partition, two projects' days on one
  channel, a 40-character mixed-case id refused as a project and the interim first-reply day; in
  `test/secret-shape.test.ts`, the detector's boundary, escapes, `sk-` strength, canonical case, the residual aliases,
  the differential against origin/main's pattern and the linear-time budget.
- `pnpm validate --schema support-quality-daily --kind support-quality-daily` prints the same for every support-quality
  fixture of origin/main before and after the change (19 files compared).
- conformance.md's producer and reader rows, DOCMAP, CONTEXT, DEC-0095 and DEC-0144 annotated; CT-210 filed; CT-129 and
  CT-103 annotated.
- Round 1 of the readings (on `67c4c082`): two breaks fixed (one keying clause in the reader row; the alternatives'
  member counts), and the coordinator's decisions D1 to D13 applied: `project` is the registry alias `project:<slug>`;
  `project` sits inside the producer row's DEC-0151 clause; no event for a several-project channel before every reader
  adopted, never a merged one; a day's project form never changes on rerun; parse-only readers wait too; the
  escalation counts stay in turns; `community` mixes three kinds and `team_chat` MAY stay out; the "not a metric"
  message; "the channel agent standard" named in full and the checker glossed; the v2 names mapped explicitly; CT-129,
  CT-103 and CT-210's adoption steps. The coordinator's count of the alternative's members (27) is 28 by the schema
  (19 top-level members, `outcomes` replaced by its 10); DEC-0151 says 28 and a test holds it.

- Round 2 of the readings (on `03c0328f`): three breaks fixed. The shared credential detector's provider prefixes now
  need a boundary (no letter or digit right before them), so `project:helpdesk-customer-support` no longer fails
  `FAC-SEM-101` (DEC-0151 item 7; `src/secret-shape.ts`, its copy in `src/session-handoff.ts`, `test/secret-shape.test.ts`,
  `fixtures/positive/service-events-page-support-quality-sk-slug.json`); "no ids" names the registry alias as its one
  exception in the schema, the producer row and DEC-0095's annotation (which also says DEC-0151 narrows its items 1 and
  2); FAC-SEM-126's autonomy message names the three members. The coordinator's risk decisions R1 to R10 applied: no
  "to a person" ticket share from the turn counts; `autonomy.answeredTickets` from the predecessor only when its `answered`
  already holds the answered-after-question tickets; the interim first-reply day (`null`, unnamed,
  `fixtures/semantic/support-quality-daily-first-reply-interim.json`); a single-project producer omits `project`, a
  merged day reruns as first published; a day's calibration identical per project, never summed; identifiers.md's
  compared-as-written bullet; CT-210's steps (d) and (e); the top-level partition test.
- Round 3 of the readings (on `e1191560`): two breaks fixed. An alias whose slug holds a provider prefix at a word
  start is read as a credential; the detector stays strict (a lower-case `sk-or-v1-` hex key fits the alias grammar),
  and the page and DEC-0151 item 7 say the registry issues no such alias and a producer whose alias is read so
  publishes nothing for that channel until it changes; a test pins `FAC-SEM-101` for two such aliases. A day's
  calibration is carried, unchanged, only on the project events judged by the calibrated judge and rubric. The
  coordinator's decisions applied: the boundary also lets a prefix follow a percent-escape or a backslash escape (a key
  glued after an ASCII letter or digit is knowingly not found); an absent `project` names the service's only project
  at the time of the day, never re-attributed; CT-210 (d) asks the channel agent standard's owner to write the turn unit
  and the signal server's ticket counts into section 5.1. The seam reading of round 3 then replaced the boundary: a
  consuming group instead of a look-behind (portable to a port without look-behind), and an `sk-` key needs a digit
  and an upper-case letter or 32 characters, as `src/connections.ts` asks, so a weak `sk-` slug word passes (round 4
  states the residual: a slug word that starts with a provider prefix and holds enough key characters). The
  coordinator then took KEY_SHAPE's exact semantics: the pattern drops its `i` flag, spells `Bearer` in any case by
  hand and reads the prefixes in their canonical case only (`SK-`, `GHP_` are no longer found), so the upper-case test
  means what it says (`sk-learn-experiments-2026` is no key; `sk-or-v1-` with 64 lower-case hex digits still is). A
  port without look-ahead, such as Rust's `regex` crate, checks the `sk-` strength outside the regex. The SH-9 case
  of `test/session-handoff-review.test.ts` used a digit-free `sk-` value as its credential; it now holds a digit and
  an upper-case letter; the package and estate-record fixtures whose credential-shaped slot name was an upper-case
  `GHP_` value now hold an `AKIA` value, digests recomputed. A sweep of 200000 generated values against origin/main's pattern (upper- and lower-case
  prefixes, mixed, lower-case, hex and upper-case tails) found 0 that the new pattern finds and the earlier did not
  (15886 both, 82543 only the earlier).
- Round 4 of the readings (on `8660ae24`): four breaks fixed. The `sk-` look-aheads were quadratic (`-sk` repeated to
  320000 characters took 17 s); both are bounded to 255 characters, read lazily, in both copies, and a CPU-time test
  holds `SECRET_VALUE.test`, `secretValue`, `secretArgument` and `secretUrl` under 150 ms on `-sk` repeated 100000
  times, with and without an `-a` tail (about 45 to 55 ms each when measured here); the same construct in
  `src/connections.ts` `KEY_SHAPE` is CT-213. The residual is stated right everywhere: a slug word that starts with a
  provider prefix and holds enough key characters (for `sk-`, a run of 32 or more holding a digit; `AKIA` dropped, a
  lower-case alias never holds it), pinned by a test alias of `sk-` and 32 such characters. connections.md and CT-73
  now say what the shared detector has since DEC-0151 (CT-73's examples re-measured), DEC-0044 is annotated, and
  profiles.md and fabric-button.md take the exact strength wording and point to item 7's escapes. The coordinator's
  decisions applied: the boundary also takes `\x` with two hex digits, `\b`, `\f`, `\v`, `\0`, `\a`, `\e`, a raw ESC
  colour sequence and an escaped one; CT-210 (d) is a named prerequisite of producer adoption; a day without `project`
  from a several-project service is a merged day, never attributed to one project; the interim gate accepts exactly
  the one FAC-SEM-126 finding; the alias rule binds a producer that must carry `project`, and the registry's rule is
  the operator's; the ports' wording; how a reader combines per-project days is the reader's. A sweep of 300000
  generated values (escapes and ESC included) found 0 that the new pattern finds and origin/main's did not (40485
  both, 107147 only the earlier).
- Round 5 of the readings (on `97632bed`): two breaks fixed. With no first-reply time measured, both percentiles are
  `null` and unnamed in the interim: one FAC-SEM-126 finding per unmeasured first-reply metric, the producer's gate
  accepting exactly those (`fixtures/semantic/support-quality-daily-first-reply-interim-both.json`). connections.md,
  CT-73 and the `src/connections.ts` comment name two more differences: a connection reads no escape before a prefix,
  and its `sk-` look-aheads are unbounded (CT-213); `KEY_SHAPE` is not changed here. The coordinator's decisions
  applied: an absent `project` is the service's one project except a merged day, told apart by the first event that
  names a project (the residual is the reader's); an alias read as a credential stops only its own project, on every
  channel, until the registry changes it, and the other projects' events go on; a producer that merged projects under
  DEC-0095 stops that channel until every reader adopts; item 7 says "at the start of a value, after a boundary
  character or after a listed escape"; a reader combines only projects of one side; the boundary also takes an octal
  escape, a double percent-escape and the escaped ESC forms (`\u001B[`, `\x1b[`, `\e[`, `\033[`); CT-213 and the
  connections comment say "the same strength within 256 characters". The round-5 seam additions applied: the vendors
  named (below and in DEC-0151's Compatibility and the `src/secret-shape.ts` comment); the adapter's source check is
  exempt from the ports' instruction; the merge list re-measured against the current heads.
- Round 6 of the readings (on `87771d82`): three breaks fixed. Everything about `project` is per channel: an absent
  `project` names that channel's only project, a merged day is one from a service that served several projects on that
  channel that day, a single-project producer has one project on that channel, and the alias rule binds a producer
  that carries `project` on a channel (a service with project A on `telegram_dm` and B on `mail` publishes `chat` days
  naming A). A day merged across projects before DEC-0151 is never rerun; a single-project day is rerun as first
  published. The semantic fixture count is seven. The coordinator's decisions applied: the residual alias wording (32
  or more characters after `sk-`, word starts after `-`, `_`, `.` or `:`, each prefix's minimum) with tests for 31 and 32
  characters and a Slack-prefixed alias; a producer carrying `project` checks its alias against the shared detector
  before publishing; the conformance module row names DEC-0151, `test/secret-shape.test.ts` and the AT-15 vectors; CT-210
  (b) asks multi-project producers whether they ever published merged days; "a backslash escape other than an escaped
  quote" in the connections comment, connections.md and CT-73; the timing test asserts both a growth ratio (4 times
  the input, under 8 times the time, best of three, with a 40 ms floor for timer granularity) and a 500 ms ceiling.
- Round 7 of the readings (on `41345f96`): the unit, product and seam readings' breaks fixed. Item 7 states the timing
  test as it is (4 times the input under 8 times the time, best of three, 40 ms floor, 500 ms ceiling) and names the
  triple percent-escape (`%252522`) and the eight-digit `\U00000022` escape as knowingly not found; the detector's
  comment says a match includes its boundary character, so callers use `.test` only. The kinds of one project that
  meet in one `/1` channel make one event per day, channel and project, and kinds of different projects never merge; a
  producer whose declaration maps two projects to one `/1` channel names `project` on every event of that channel even
  when one project's kind is left out; the residual alias examples sit after their own prefix, and a `glpat-` alias is
  pinned (19 characters pass, 20 are read). An alias read as a credential stops all of that project's events,
  including its days without `project`, and CT-210 (d) asks the channel agent standard's owner for an observed check
  that accepts such a withheld project. The producer row carries the calibration and alias clauses. The merge list
  cites DEC-0150's sentences by text at `0bda2352`, annotates CA-2, the Compatibility sentence and the Source counter
  instead of rewriting them, adds CT-209 and the `shaped` comment, replaces any budget wording with DEC-0150's own
  budget test, and closes with a two-part check. The timing test has an explicit 30000 ms timeout. The vendor lists
  name `estate-vectors.json`, `package-vectors.json` and Fabric Switchboard's folder-attribution port.
- Round 8 of the readings (on `34fe67e1`): the product and seam readings' breaks fixed. An absent `project` names the
  channel's only project on that day, so the declaration that counts is that day's; a reader that did not read it
  keeps the day unattributed, as a merged day, and a producer whose channel moves to another project names `project`
  from that day on. The rule to name `project` on every event of a channel mapped to two projects applies from the
  first day of that mapping, and a rerun of an earlier single-project day keeps no `project`. With `team_chat` left
  out, the feed's `community` counts differ from the signal server's by the team-chat tickets, and a `team_chat`-only
  project has no daily. A project withheld for its alias keeps its days and publishes them under the new alias. The
  residual names each prefix's characters, and prose writes no complete key shape. Non-colour CSI sequences are
  knowingly not found. The sk-slug fixture's text names its project. The merge list adds channel-agent.md's "Being by
  shape" sentence and CA-5, states what DEC-0150's `keyRereads` counts at `3c1ba539` and the forms it still misses,
  and the vendor lists add Project Observatory's two ports and whole-file vendors that pin by hash.
- Round 9 of the readings (on `31d04acd`): the inference of a project for a day without `project` kept producing cases
  with no single behaviour, so the coordinator replaced it with one rule, written once under support quality's "The
  project" section: before every reader has adopted DEC-0151, no `project` and no event for a channel the declaration
  maps to two projects; after, `project` on every event; a day without `project` is never attributed, so per-project
  history starts at adoption; a rerun republishes a day as first published. The conformance rows now list obligations
  only and point to the rules; item 6, CT-210 (b) and the schema's description say the same, short. A calibration
  comes from labelled answers of its project's side only. SH-10 and folder-attribution.md name DEC-0151. Tests pin the
  `sk-` strength at the 256th character and the non-colour CSI sequences before each key kind.
- Round 9's seam addendum: the vendor lists name the adapter's dashboard-link test sample; CT-210 (e) says Fabric
  re-pins its two `src/secret-shape.ts` copies with the folder-attribution vectors and Fabric Dashboards re-vendors
  `src/session-handoff.ts`, `src/fabric-links.ts` and its connections port; the parity test is retitled "its vendors
  take this file alone"; the second-lander list adds DEC-0150's `sk-` test title and says its annotate-not-rewrite
  instruction governs; DEC-0150's `keyRereads` at `cd350f47` reads every boundary form, so that item owes nothing.
- Round 10 of the readings (on `628877b5`): the observed-check prerequisite also accepts a day published without
  `project` until the readers adopt (page, item 4, CT-210 (d), this Open list); rule 1's trigger is the day's tickets of
  two projects, by the declaration or the producer's own mapping, the switch day of a moving channel included, and a
  withheld day is dropped (the row, the schema, the Compatibility sentence, CT-210 (c)); an alias-withheld project's
  kept days are post-adoption days; the declaration of an alias read as a credential is refused under DEC-0150's rule
  and its channels still count for rule 1; calibration is per side; rule 2 names `project` on every day first
  published; the rerun key adds `project` once adopted; joining a renamed alias is the reader's; the escalation counts
  are in turns, bounded by `nobodyDropped.turns`; the `AKIA` body is read in upper case only.
- Round 10's seam addendum (on `628877b5`, the detector unchanged at `c3b900b8`): the vendor lists name the adapter's
  profiles test case whose `AKIA` borrowed the `A` of an encoded `%1A`; the closing check's second part leaves out the
  annotation line; other handoffs, DEC-0150's included, stay as history; the daily-payload pointer says the escalation
  counts stay in turns; the merge list is re-measured at DEC-0150 `5978ebec`, DEC-0149 `44e2296a` (its new branch) and
  main `7f6bc647`.
- Round 11 of the readings (on `6df48a24`): the observed check is split by period and written once (before adoption a
  day without `project` and a withheld channel; from adoption on an alias-withheld project and its kept days published
  late); a merged legacy day is never rerun before adoption and only unchanged after; the conformance row and CT-210
  (d) say the observed check accepts what the wait withholds; the lead sentence and producer row say one event per
  day, channel and, once adopted, project, and DEC-0095's annotation adds that a channel holding two projects' tickets
  publishes nothing before adoption; rule 1 counts only projects whose tickets enter `/1` (reversing round 10's
  choice for a left-out kind); adoption is one-way, and a producer with no registry alias never names `project`;
  CT-210 (d) asks the owner to mark `autonomy.answeredTickets` and `stability.safeReplyTurns` deferred and says the withholding
  starts at the merge; CT-210 (f) gives the DEC-0095 confirmation an owner; a day without `project` stays out of side
  summaries; the example aliases use neutral slugs; an alias read as a credential leaves its entry out of the
  declaration until the registry changes it (the agent never invents an alias).
- Round 11's seam reading (on `6df48a24`): the vendor lists name the adapter files whose answers change, found by
  patching `SECRET_VALUE` in a scratch clone of the adapter and running its suites (every failure is named in the Open
  list), and say a port derives its list that way, never by scanning literals; `repositoryName` and `repository_name`
  must not compose DEC-0151's source after a separator look-behind with `i`, and `test/secret-shape.test.ts` shows why;
  DEC-0149 is cited as its landing head; DEC-0150's `sk-` test needs nothing; the merged gate runs at low load. The
  meeting list names DEC-0150's sentences by subject (DEC-0150's own list locates them at its landing head) and adds
  CA-5's annotation and `channel-agent.md` item 4's `sk-` sentence.
- Round 12 of the readings (on `8125adf2`): the reader row carries the side-rule qualifier; the meeting list adds
  DEC-0150's budget wording and a third closing check; the owner's post marks a producer's adoption by its first day
  naming `project`, asks section 5.1 to carry `project` with rules 1 and 2, the `team_chat` MAY and the deferred
  questions; the observed check is named as the standard's section 11; rule 6 defines a side by the standard's section 1
  and covers a producer with no declaration; rule 9 is per project; CT-210 (f) tells a producer answering yes to stop
  its merged days at the merge; rule 4 defines "unchanged" as the same form; the producer row cites rules 1, 2, 4 and 6
  to 9; CONTEXT.md and the specification README name DEC-0144 and DEC-0151; the FAC-SEM-126 row points to the interim
  paragraph. The colour boundary takes `:` (ITU T.416) and `\33`; the 8-bit CSI, brace escapes, `\E` and `^[` are
  knowingly not found; the composition test shows the `i` flag finding what `SECRET_VALUE` does not.
- Round 13 of the readings (on `e85bd11b`): a weak `sk-` slug alias passes FAC-SEM-101 and FAC-SEM-165 but is still a
  FAC-SEM-158 credential in a DEC-0149 source tree (checked with `checkSourceTree` at `e1262368`), stated on the page,
  in item 7, identifiers.md and the DEC-0149 merge bullet; rule 6 keeps DEC-0144's carry-forward per project, the same
  sentence in the calibration and rubric rows, the producer row, item 6, CT-210 (b) and the schema; the page says where
  rules are repeated and holds them, and every copy of rules 1 and 6 reads the same; rule 1 counts every project by the
  declaration where it names it, by the producer's mapping otherwise; the standard's acceptance is worded as owed; the
  post asks about the interim day and the kinds grouping; CT-210 (f) records answers as they arrive; the round history
  reads in one order; the connections wording names a backslash escape ending in a letter or digit; a worst-case test
  validates 24 names in `notMeasured` with no finding.
- Round 13's seam reading (on `e85bd11b`): the merge list adds `docs/specification/README.md` against DEC-0150 (one
  support-quality row, one channel-agent row) and the `keyRereads` confirmation for every boundary form; the
  look-ahead-free port's instruction says to retry at every inner `-` or `_` boundary of a rejected run, with the
  strength checked within 256 characters from that `sk-`; three AT-15 vectors and three detector tests pin it; DEC-0149
  is cited as its landing head, `82bed5bd`.
- Round 14 of the readings (on `82020222`): three AT-15 vectors pin the canonical case (an upper-case `SK-` user with a
  digit and a capital records its origin), the `sk-` strength (a lower-case `sk-` slug of 16 to 31 characters with a
  digit records it) and the word start (a strong `sk-` run glued after a letter records it; on a scratch copy with the
  boundary group removed from `SECRET_VALUE`, that case alone fails, 1 of 230); the earlier detector fails six AT-15
  cases (three before this round), and the percent-escape case tells DEC-0151 from a port that takes the boundary
  without its escapes; the vendor lists say every port drops its case-insensitive flag and reads digits as ASCII, and
  name the ports that compile it case-insensitively today; `%u0022` is knowingly not found (a test pins it); the
  FAC-SEM-158 sentences say DEC-0149 (in progress), checked at `8dd4d04f`; every copy of rule 2 excepts a project with
  no registry alias (rule 9), and rule 9 says what "unnamed" means beside an alias-withheld project; FAC-SEM-126's
  message at a `null`, unnamed first-reply metric points to the interim (a test pins it); the registry's alias rule is
  the operator's open question (CT-210 (g)); rule 6's no-declaration clause is in the producer row and CT-210 (b);
  DEC-0144 is annotated with rule 6; the reader's side rule moves from "Not decided here" into rule 5; the DOCMAP row
  names the project.

- Before round 15 (the coordinator's decision on a producer's board message `5a1334d1`, thread `b6820b97`): the
  optional ticket count `autonomy.answered` is renamed `autonomy.answeredTickets` in the schema (its member and the
  `outcomes` description), the support quality page, DEC-0151 (item 1, Alternatives, Compatibility, Source), the
  conformance producer row, `src/support-quality-rules.ts`'s comment, the tests, the fixtures that carry it (two
  positive, five negative, four semantic, two events pages) and CT-210, because the asker's v2 shape already has
  `autonomy.answered` counting turns. DEC-0151's Compatibility states: `/1` never reuses a v2 field name with another
  meaning or unit; a ticket count is named for tickets. The v2-move bullet of "Not decided here" says v2's
  `autonomy.answered` has no `/1` member of that name.
- Before round 15, second (the coordinator's decision on the producer's answer, board message `24cf4f25`, thread
  `b6820b97`): `stability.fallbackTurns` and `stability.fallbackTickets` are renamed `stability.safeReplyTurns` and
  `stability.safeReplyTickets` everywhere the first rename reached (schema members and descriptions, the page, DEC-0151
  items 1 and 2, Alternatives, Compatibility and Source, the DEC-0095 annotation, the conformance producer row, the
  rules' comment, the tests, the same thirteen fixtures, CT-210 with step (d)). The producer's evidence: Fabric Inbox's
  v2 quality worker, at commit `99d71f3`, counts in `stability.fallbackTurns` the turns whose run had
  `modelCalls.recovered > 0` (a fallback model answered; the same unit and window), while `/1`'s count is the channel
  agent standard's section 5.1 row, a safe reply after the checker refused twice in a row. Same unit, another meaning,
  so `/1` renames; Compatibility's rule reads "`/1` never reuses a v2 field name with another meaning or unit".
- Before round 15, third (the coordinator's decision on the producer's X-4, board message `6a4e3757`): the
  `notMeasured` item pattern becomes `^[a-z][A-Za-z0-9]{0,63}(\.[a-z][A-Za-z0-9_]{0,63})?$`, a digit after the first
  letter of either part, so a no-reply day naming both `nobodyDropped.firstReplyP50Ms` and `firstReplyP90Ms` passes
  the schema and FAC-SEM-126 (`fixtures/positive/support-quality-daily-no-reply.json` and its test); a part that
  starts with a digit is refused (the existing `negative/support-quality-daily-not-measured-digit-first.json` and a new
  `-family-digit-first.json`, both in the catalogue). DEC-0151 item 3, Compatibility (a widening: every earlier valid
  document stays valid), Source, the page and CT-210 say so.
- The channel agent standard's owner applied more than CT-210 (d)'s renames at the standard's commit `86c49ec` (board
  message `b840a16b`): section 5.1 names `autonomy.answeredTickets` (marked "(new)"), `stability.safeReplyTurns` and
  `stability.safeReplyTickets` (the copy received on 2026-11-04 named them `autonomy.answered` and
  `stability.fallbackTurns`; the standard renamed them at the owner's commit `86c49ec`), carries the turns sentence
  ("/1 takes toPersonPolicy and toPersonInability in turns until it names a ticket unit") and the signal-server
  sentence (the ticket counts travel by the signal server), and renames the summary number "fallback" to "safe reply".
  So the page's first prerequisite (section 5.1 says turns) holds in the standard's master; what the owner still owes,
  after 2026-11-06, is section 11's observed-check acceptances and the deferred questions (CT-210 (d)).
- Round 15 of the readings (on `a0f8c160`), not clean: the product tier found one break,
  `fixtures/positive/support-quality-daily-no-reply.json` showing check pass rates, `rubricVersion` and `judgeModel` on a
  day where nothing was judged (`quality.sampled` 0). Fixed: `checks`, `rubricVersion` and `judgeModel` are `null` and
  `notMeasured` names `checks` beside the three `nobodyDropped` names, as the payload table says; the fixture is in the
  page's header list; its test asserts `checks` null and named, the rubric and judge `null`, and that a valid payload
  whose `notMeasured` is `["family2.metric"]` gives exactly the `/notMeasured` finding "which the payload does not
  carry". The notes and risks applied: DEC-0151's Compatibility rule is scoped to "no member DEC-0151 adds reuses a v2
  field name with another meaning or unit", naming `/1`'s older `channel` (DEC-0095) as the member that shares v2's
  name with another value space (the page and both schema descriptions likewise); CT-210 (d), this handoff's Done and
  Open lists and the merge-list bullet record what `86c49ec` applied; the four summary numbers read "safe reply
  (fallback in the received copy)"; CT-129's note says either part admits digits after its first letter; FAC-SEM-126's
  interim message reads "names it, but until every reader of the feed has adopted DEC-0151, leave it null and unnamed"
  (the rule and its test changed together; DEC-0151's Compatibility quote still holds as a substring); the merge list
  names `source.md`'s two "(DEC-0151, in progress)" sentences at DEC-0149's `47d66a15`, adds DEC-0153 and DEC-0152, and
  refreshes its figures; the closing check spans lines.
- Before round 16 (2026-11-07): main `8791cce0` (DEC-0148 to DEC-0155 merged and released, DEC-0150 among them, so
  the merge gate holds) merged into this branch. Conflicts resolved: DEC-0151 placed between DEC-0150 and DEC-0152,
  the next-free line `DEC-0156`; `src/secret-shape.ts` keeps DEC-0149's JWT scanner (`jwtSpans`, `hasJwt`) and this
  branch's comment and `SECRET_VALUE`; `test/secret-shape.test.ts` holds both sides' tests; support quality's "Not
  decided here" drops main's in-progress bullet on section 5.1; the row files keep both sides in id order. Then the
  list in "When DEC-0150 and DEC-0151 meet on main" and DEC-0150's own list (its handoff, "When DEC-0150 and DEC-0151
  (in progress) land") were applied: `channel-agent.md` (the alias parenthetical, the join sentence with "a payload
  with no project is not attributed to any project", item 4's `sk-` sentence, the language-tag sentence, the daily
  payload bullet as a pointer naming the three renamed members and the turns unit), `identifiers.md` (the two
  `project:<slug>` bullets merged into one, DEC-0149 as landed), `source.md` (both in-progress sentences stated as
  current, and the weak `sk-` slug alias sentence), the support quality page (DEC-0149 as landed, the standard's copy
  linked twice), `docs/evidence/sources.md`, CT-209, the `shaped` comment and `flag`'s `/^sk-/` without `i` in
  `src/channel-agent.ts`, DEC-0151's Context link, and one Annotated line under DEC-0150 for CA-2, CA-5, the
  Compatibility and the Source counter. Tests: `test/channel-agent.test.ts` reads the `sk-` floor from DEC-0151's
  branch (the smaller of 16 and 32), restates the language-tag test (`sk-Latn-SK-u-ca-gregory` passes,
  `sk-Latn-150-u-ca-gregory` stays a key), extends `BOUNDARY_FORMS` with every boundary form the detector's comment
  lists (`%22`, `%2522`, the backslash, octal, `\x` and `\u` escapes), and asserts the declaration's `project` pattern
  equals `$defs/projectAlias`; `test/support-quality.test.ts` reads the seven kinds from the declaration schema's enum.
  DEC-0153's own list for DEC-0151's lander (its handoff, "DEC-0151's lander") was applied too: OD-2 and the
  `FAC-SEM-167` row restated as DEC-0151 reads the shapes, an Annotated line under DEC-0153, and
  `test/ops-digest.test.ts` re-pinned (an `sk-` key built from pieces replaces `queue.task-assigned-to-worker` among
  the refused names; `ops.risk-assessment-completed`, `queue.task-assigned-to-worker`, `work.desk-booking-confirmed`,
  `ui.disk-usage-refreshed-hourly` and a lower-case `akia` pass, an upper-case `AKIA` from pieces is refused). The
  closing checks: the in-progress reading over `docs`, `src` and `test` prints nothing; inside DEC-0150 it prints only
  CA-2, CA-5, the Compatibility and the Source line, with the Annotated line beside them; the third and fourth checks
  print nothing; `grep -c "^| a .*| DEC-0153" docs/specification/conformance.md` prints 5.
- Round 16 of the readings (on `8b442779`): unit clean (two risks: `KEY_REREAD` 255 against about 259 units read per
  boundary `sk-`, a constant factor; the interim finding is a `FAC-SEM-126` a producer's gate keeps on purpose); the
  product tier found two breaks, fixed: the daily payload bullet and CT-210 (d) named two of the three received names
  (now `autonomy.answered`, `stability.fallbackTurns` and `stability.fallbackTickets`), and the landing step left CT-73,
  CT-103, CT-188 and the handoffs README row saying proposed (now in Next task, with a closing grep). Its risks folded:
  the two Annotated dates set at merge, the roadmap's Agent assessment sentence beside AS-01, an SCN-002 alt path for
  the interim finding, CT-129's line citations addressed to `cd3af646`.
- Round 16's seam tier (on `8b442779`) was clean: the two copies of the pattern match byte for byte, the new detector
  accepts a subset of the old, DEC-0150's cost model bounds it after every boundary form (a 400 000-case fuzz, 0 misses,
  linear time), and DEC-0153's page and tests agree. Its three risks are filed: the port vectors (connections URL cases,
  AT-15 boundary forms and canonical case) as CT-267, and FAC-SEM-015's own reading in CT-73.
- Round 17 (on `75919870`): the unit and seam readings stopped at the session limit before reporting; the product tier
  found two breaks, fixed: accepted DEC-0096's item 3 now false (annotated, and DEC-0096 added to the Consequences), and
  the landing step missing DEC-0151's Source and CT-210's round record (added to Next task). Its risks folded: the
  at-landing board post, vendor rows and plan marks named in Next task; the reader row reads a missing day before
  adoption as possibly withheld; SCN-002's Coverage names the interim test; the Consequences list completed. Left as a
  risk: the interim message's wording (DEC-0151's Compatibility quotes it as written).
- The collision check, by name, of every other new DEC-0151 member against the v2 fields: the evidence is the
  channel agent standard's section 5.1 table (DEC-0150's copy, `docs/evidence/specs/2026-11-04-channel-agent-standard-v1-rc.md`
  at `388f2b42`), which marks every member new except `autonomy.answered` and
  `stability.fallbackTurns`, the two it treats as present in the producer's v2 shape (both now renamed in `/1`). Checked: `arrived`, `ended`,
  `notATicket`, `open` (`handedOpen`, `questionOpen`, `awaitingCustomer`, `awaitingApproval`), `outcomes`
  (`handoffsClosedByPerson`, `referred`, `answeredElsewhere`, `noReplyOwed`, `customerSilent`, `expiredByDecision`,
  `expired`, `unanswered`, `firstReplyLate`, `promotions`) and the table's `stability.fallbackTickets` (now
  `safeReplyTickets`): all marked new, no v2 name. `stability.fallbackTurns` was a v2 name with another meaning (the
  producer's evidence above): renamed `stability.safeReplyTurns`, and the item that was open on it is closed.
  `project` is not in the table (v2 is under its own URN; CT-103 names no v2
  `project`). `/1`'s existing `autonomy` and `stability` members were not renamed.

## Open

- Two clean rounds of blind readings, then merge (the branch is pushed, no pull request yet).
- On DEC-0151's merge: close CT-129 (fixed by item 3) with its receipt.
- The coordinator tells the channel agent standard's owner, on thread `b6820b97` (CT-210 step (d)), what is still owed
  after `86c49ec` (which already carries section 5.1's renames, the turns sentence and the signal-server sentence): its
  observed check (section 11) accepts, by period, what support quality's observed-check paragraph lists (before
  adoption a day without `project` and a withheld channel; from adoption on a project withheld for its alias until the
  registry renames it, and then its kept days published late under the new alias); the withholding starts at
  DEC-0151's merge whatever the counts, so that acceptance is owed before any producer on the standard has a shared
  channel; the period is the event's day, and a producer's adoption is marked by its first published day that names
  `project` (a rule-9 project never names one), so the check accepts both lists by that marker; section 11's observed
  check accepts the `team_chat` MAY (a `team_chat`-only project has no daily) and, as asked, an interim day whose
  unmeasured first-reply metric is `null` and unnamed. And the deferred questions: whether a promotion restates the
  ticket's end day, `received`, a sum rule, whether section 5.1 carries `project` with rules 1 and 2, and whether the
  signal server groups the seven kinds into `/1`'s four channels as support quality's kinds table does. The
  acceptances are owed by the owner until its text lands; a producer whose only named project is alias-withheld at
  adoption is in the pre-adoption list. The coordinator files the adapter's row (step (e)).
- At landing, the coordinator posts the question to each multi-project `/1` producer on the board, whether it merges
  projects into one event (DEC-0095), with the answers recorded in CT-210 as they arrive (step (f)); the merge does not
  wait.
- The vendors re-sync with item 7, including: the Fabric Agent Adapter kit's detector ports (its Python and JS secrets
  modules, its dashboard-link checkers, its connection ports and its dashboard button), its vendored vector files that
  change answer (`connections-extra` and `feed-protocols`, and `estate-vectors.json` and `package-vectors.json`,
  re-vendored from the two changed semantic fixtures), Fabric Switchboard's folder-attribution port (it has neither
  look-ahead nor look-behind, so it checks the `sk-` strength outside its regex, and on a rejected run it retries at every inner `-` or `_` boundary inside it, the strength checked within 256 characters from that `sk-`, and
  re-syncs `folder-attribution.json` at the merge commit), Project Observatory's folder-attribution port (with its attribution-vectors pin) and its
  estate-record port (`FAC-SEM-075`), re-synced together with `folder-attribution.json`, and any template or agent that
  copies the kit, and the adapter's dashboard-link test sample, whose lower-case `sk-` sample stops being a key under DEC-0151 and at the re-sync becomes one DEC-0151 reads (a digit and an upper-case letter, built from pieces as the contract's SH-9 case is), and the adapter's profiles test case whose query holds `%zz`, a raw control character and `KIA` with 16 more characters stops being found under DEC-0151 (its `AKIA` borrowed the `A` of the encoded `%1A`) and is rebuilt at the re-sync with a boundary before `AKIA`, built from pieces; whole-file vendors that pin `src/secret-shape.ts` by hash take DEC-0151 at their next re-pin, with
  their vectors; any port that copies
  `fixtures/vectors/folder-attribution.json` re-syncs it only together with the detector, since six of its nine new
  AT-15 cases fail under the earlier detector (three did before round 14), and the percent-escape case under a port that
  takes the boundary without its escapes. Every port drops its case-insensitive flag (`re.I`, `(?i)`) and reads digits as ASCII (`re.ASCII`, `[0-9]` or `(?-u:\d)`): Project Observatory's folder-attribution and estate-record ports and Fabric Switchboard's folder-attribution port compile it case-insensitively today. Fabric vendors `src/secret-shape.ts` twice, one copy under a sha256 `pin.json`
  together with `fixtures/vectors/folder-attribution.json`, so both are re-pinned together; Fabric Dashboards vendors
  `src/session-handoff.ts` and `src/fabric-links.ts`, and its service host's connections hold a port; Fabric
  Dashboards' sample-service kit copies hold the earlier pattern. The adapter's files whose answers change (adapter 0.62.0) also include: `test/fixtures/contract/profile-vectors.json`, regenerated at the merge commit, with `test_fabric_profiles.py` `SecretShapeTests` and `fabric-profiles.test.mjs`; the upper-case `SK-` case in `test_whitespace_dot_and_case_read_as_ecmascript` (both modules), beside the `%zz` and `KIA` case; `test/test_provider.py` "a key in an argument (LC-21)", rebuilt from pieces as a key DEC-0151 reads; the repository-credential rule's `test/repository_vectors.json` (its three credential vectors), `test_repository_credential.py` and `repository-credential.test.mjs`; and `test_check_service_dashboard_open.py` `test_a_repository_in_the_evidence_carries_no_key`. A port derives this list by patching `SECRET_VALUE` in its twins and running its suite, never by scanning literals (its samples are hex-encoded or built from pieces). `repositoryName` and `repository_name` (the adapter's `fabric-secrets.mjs` and both `fabric_secrets.py`, and Fabric Dashboards' sample-service copy of `fabric_secrets.py`) must not compose DEC-0151's source after a separator look-behind with the `i` flag: the consuming boundary would need a second separator, so a key after `-`, `.` or `_` goes unfound, and `i` undoes the canonical case and the `sk-` strength. They keep their own boundary-free key shapes (as the source check keeps its own), with case-sensitive prefixes and no `i` flag, and the adapter pins a key after `-`, `.` and `_` in its repository vectors (`test/secret-shape.test.ts` shows why such a composition misses one).
- The adapter's derivation, run on a read-only scratch clone of the Fabric Agent Adapter at its `origin/main`, `aabe21d`
  (0.62.0), with only `SECRET_VALUE` patched to DEC-0151's pattern in `fabric-secrets.mjs` and both `fabric_secrets.py`.
  Unpatched: `python3 -m unittest discover -s test -q` OK (1636 tests; the skips, 32 here, depend on the environment) and `node --test 'test/*.test.mjs'`
  536 tests, 0 failed. Patched: Python 1510 tests run (30 skipped here), 47 failures and 1 error; JS 536 tests, 10 failed. Every failure:
  - Python, the import: `test_source_check` does not import (its guard raises "fabric_secrets.SECRET_VALUE changed its
    first branch", so its 126 tests do not run); `fabric_source_check.py` keeps its own shapes first (CT-207).
  - Python: `test_check_service_dashboard_open` `test_a_repository_in_the_evidence_carries_no_key`; `test_adapt_project`
    `LifecycleRuleTests.test_check_refuses_a_credential_in_an_argument_or_a_url`; `test_repository_credential`
    `test_each_copy_reads_the_vectors_alike`, eleven vectors in each of the two copies (22 subtests) (the composed `KEY_AT_A_WORD`);
    `test_provider` `ValidationTests.test_each_rule_is_enforced` (its LC-21 key); `test_fabric_profiles`
    `SecretShapeTests.test_every_case_answers_as_the_contract_does` (four digit-free `sk-` cases of
    `profile-vectors.json`) and `test_whitespace_dot_and_case_read_as_ecmascript` (the `%zz` and `KIA` case and the
    upper-case `SK-` case, in both modules); `test_kit_hostile_core` `test_every_case_answers_as_the_fixture_says`, five
    cases (a launchd, systemd or task argument or environment value carrying a key); `test_fabric_connections`
    `Vectors.test_every_kit_input_answers_as_the_contract_does` (index 987); `test_fabric_estate`
    `ContractVectors.test_every_rule_case_answers_as_the_contract_does` (`estate-secret-value-as-slot.json`);
    `test_fabric_package` `VectorTests.test_the_rules_answer_every_semantic_fixture` (`package-secret-shaped-name`);
    `test_fabric_service_feed_protocols` `FeedData.test_fac_sem_101_at_the_contracts_places`;
    `test_fabric_service_supervisors` `SystemdUnitTests.test_refusals` and `TaskSchedulerTests.test_refusals`;
    `test_fabric_kit` `Manifest.test_kit_json_is_what_the_sources_say` and `Install.test_the_python_closure_runs_alone`
    (the kit's file hashes); `test_validate` `PluginLifecycleGateTests.test_the_plugin_declares_no_mcp_server_and_no_credential_in_a_hook`.
  - JS: `kit-hostile-core.test.mjs` "every hostile core case answers as the fixture says"; `fabric-connections.test.mjs`
    "every kit input answers as the contract does"; `fabric-estate.test.mjs` "every rule case answers as the contract
    does (FAC-SEM-072…076)"; `repository-credential.test.mjs` "repositoryCredential reads the shared vectors as Python
    does"; `fabric-profiles.test.mjs` "the credential detector answers as the contract does";
    `fabric-service-launchd.test.mjs` "the plist refuses what it cannot carry"; `fabric-package.test.mjs` "the rules
    answer every semantic fixture, and no positive one"; `fabric-service-supervisors.test.mjs` "the systemd unit refuses
    what it cannot carry" and "the task refuses what it cannot carry"; `fabric-service-feed-protocols.test.mjs` "an
    event's data within its bounds and free of credentials".
  The digit-free or lower-case `sk-` samples among these are rebuilt from pieces as keys DEC-0151 reads; the vector and
  fixture files are regenerated or re-vendored at the merge commit; the kit manifest is re-hashed.
- The adapter's source check (`fabric_source_check.py`) derives its provider-key shapes from
  `fabric_secrets.SECRET_VALUE.pattern` and raises `ImportError` on DEC-0151's pattern: it keeps the earlier unbounded
  shapes as its own fixed list, for parity with DEC-0149's tree check, before or together with the detector's port, and
  is exempt from the instruction that every port takes the same boundary (CT-210 (e), CT-207).
- `fixtures/vectors/folder-attribution.json` changes with the detector: one AT-15 input (a strong `sk-` user) and nine
  new AT-15 cases. Six fail under the earlier detector (a remote holding `-sk-` inside a word, a weak `sk-` slug, a
  lower-case `sk-` slug of 16 to 31 characters with a digit, a strong `sk-` run glued after a letter, an upper-case `SK-`
  user, and an `sk-` run whose only digit lies past 256 characters, each recording its origin); before round 14 it
  failed three (the `-sk-` word, the weak slug, the digit past 256). The percent-escape case (a strong key after `%22`
  records none) tells DEC-0151 from a port that takes the boundary without its escapes, not from the earlier pattern;
  two more pin a look-ahead-free port's reading. Every port re-syncs that vector file together with the detector, and
  checks the `sk-` strength outside its regex where the regex has no look-ahead.
- The registry's alias rule (CT-210 (g)): whether the project registry issues no alias whose slug word starts with a
  provider prefix and holds enough key characters, and none with a weak `sk-` slug word (a FAC-SEM-158 credential under
  DEC-0149), is the operator's open question until the registry's owner records a rule; the contract words it so.
- Adoption, CT-210, in its order: `support.tickets_daily` mapped into each reader's ticket view first, readers re-pin and
  key by project, producers re-vendor the schema and carry the members once every reader has adopted.

## When DEC-0150 and DEC-0151 meet on main

DEC-0150's current branch is `origin/agent/channel-agent-ext-v3-20261104` (cited at `7a0b05b6` on 2026-11-05;
`388f2b42` when the measurements below were taken); DEC-0149 lives on `origin/agent/ct194-source-manifest-v2-20261104`
(cited at `47d66a15` on 2026-11-05; the measurements below were taken at `8dd4d04f`; the old branch name is deleted);
main is at `ed4d6aa7` on 2026-11-05, its backlog tail through CT-220 (the scratch merge below was at `7213463f`).
DEC-0152 (`d760f756`, branch `agent/ct217-board-same-turn-20261104`) and DEC-0153 (`ff00a448`, branch
`agent/ct219-ops-digest-20261104`) are open beside them. The scratch measurements below are of the heads they name;
they are measured again at merge, against the heads then current. **Merge gate:** DEC-0150 must be on main before DEC-0151 merges. At
DEC-0151's merge, `git ls-tree origin/main docs/evidence/specs/2026-11-04-channel-agent-standard-v1-rc.md` prints the
file and `grep '^### DEC-0150' docs/DECISIONS.md` prints one line; if either prints nothing, DEC-0151 waits (or rebases
over DEC-0150 once it lands).

The files each open branch shares with this one, from `git merge-tree` against the round-14 head on 2026-11-04 (a textual
conflict unless the line says it auto-merges), with the resolution:

- **Against DEC-0150** (`origin/agent/channel-agent-ext-v3-20261104`):
  - `docs/DECISIONS.md`: both append a decision at the end (DEC-0150, DEC-0151) and both change the next-free line; keep
    both decisions in number order and the larger next-free value.
  - `docs/DOCMAP.md`: keep DEC-0151's rewritten support-quality row and DEC-0150's new channel-agent row; never both
    support-quality rows.
  - `docs/backlog.md`: both append rows at the tail (CT-209; CT-210, CT-213); keep every row in id order.
  - `docs/handoffs/README.md`: both add a row at the top; keep both, newest first.
  - `docs/specification/support-quality.md`: the thresholds line and DEC-0150's "Not decided here" bullet on the
    per-project payload; drop that bullet (DEC-0151 answers it) and keep the thresholds line as this branch writes it.
  - `docs/specification/identifiers.md` (auto-merges, but says one thing twice): merge DEC-0150's channel-agent
    `project` bullet and DEC-0151's registry-alias bullet into one compared-as-written bullet.
  - `docs/specification/README.md`: keep this branch's support-quality row (DEC-0095, DEC-0144, DEC-0151) and
    DEC-0150's channel-agent row, one of each. `git merge-tree --write-tree --name-only` of this head with
    `origin/agent/channel-agent-ext-v3-20261104` prints only the files this list names.
  - `src/secret-shape.ts` (auto-merges): DEC-0150's `rawValues` change and DEC-0151's `SECRET_VALUE` touch different
    lines; keep both.
- **Against DEC-0149** (`origin/agent/ct194-source-manifest-v2-20261104`, cited at `47d66a15`, measured at `8dd4d04f`;
  `docs/specification/identifiers.md` auto-merges): `source.md` at `47d66a15` holds two sentences that call DEC-0151 in
  progress, both written "(DEC-0151, in progress)": the one at its line 95 (once the shared detector's key shapes are
  bounded, `FAC-SEM-156` is stricter than `FAC-SEM-065`) and the one wrapped across its lines 147 and 148 (an identifier
  the tree check reads as a key that is a registry alias is renamed only by the registry's owner); the second of
  DEC-0149 and DEC-0151 to land states both as current. The other files: `docs/DECISIONS.md` and
  `docs/backlog.md` (tail appends; keep both, in order), `docs/handoffs/README.md` (keep both rows) and
  `src/secret-shape.ts` (the bullet below). Its `URL_SECRET_VALUE` in `src/source-rules.ts` deliberately stays the tree
  check's own earlier unbounded pattern, with the `i` flag, for parity with the adapter's source check: it is NOT
  changed at the merge. Decision for its lander: after the merge, DEC-0149's path and word reads (`credentialShaped`,
  `pathHoldsFinding`) use the tree check's own unbounded key shapes, not the narrowed shared detector, so a key glued
  into a path is still held; the DEC-0149 branch makes that change itself.
- **Against DEC-0153** (`ff00a448`, branch `agent/ct219-ops-digest-20261104`; `git merge-tree` with this head
  conflicts in `docs/DECISIONS.md`, `docs/DOCMAP.md`, `docs/backlog.md`, `docs/handoffs/README.md`,
  `docs/specification/README.md` and `docs/specification/conformance.md`; `CONTEXT.md` auto-merges): in
  `conformance.md` keep DEC-0151's two support-quality rows (producer, reader) and DEC-0153's three new rows, never
  main's older producer and reader rows; in `docs/DOCMAP.md` and `docs/specification/README.md` keep DEC-0151's
  support-quality row and DEC-0153's operations-digest row, never both support-quality rows; `DECISIONS.md`, the
  backlog and the handoffs README as tail or top appends, in order. Check on the merged tree:
  `grep -c '^| an agent that answers people, publishing its support quality' docs/specification/conformance.md` and
  `grep -c '^| a reader of support quality' docs/specification/conformance.md` each print 1, and
  `grep -c 'support-quality-daily/1' docs/DOCMAP.md docs/specification/README.md` prints 1 per file.
- **Against DEC-0152** (`d760f756`, branch `agent/ct217-board-same-turn-20261104`): `docs/DECISIONS.md`,
  `docs/backlog.md` and `docs/handoffs/README.md` only, tail (or top) appends; keep both, in order.
- **Against PR #235** (`agent/ct200-renewal-repeat-20261102`, DEC-0148): `docs/DECISIONS.md` and `docs/backlog.md`
  (tail appends; keep both, in order).
- **Against main** (`ed4d6aa7` on 2026-11-05; measured at `7213463f`): `docs/backlog.md`, the tail; keep every row, in
  id order through CT-220 (CT-210, CT-213, CT-215 to CT-220). The scratch merge with the round-14 head, so resolved: `tsc` exit 0, 28 vector files match, the whole suite passes (109 files, 9844 tests, 1 skipped).

The second of DEC-0150 and DEC-0151 to merge also rewrites these, at the DEC-0150 landing head. DEC-0150's sentences
move and are reworded between its rounds, so this list names each by its subject and place, and DEC-0150's own list
(its handoff's section on meeting DEC-0151) locates the exact sentence at that head; last read at `388f2b42`:

- `docs/specification/channel-agent.md`, the daily-payload bullet's member list (it names `autonomy.answered` among the
  members `/1` lacks, and `stability.fallbackTurns` and `stability.fallbackTickets`): the rewritten bullet names
  `autonomy.answeredTickets`, `stability.safeReplyTurns` and `stability.safeReplyTickets`, and says: the copy received
  on 2026-11-04 named them `autonomy.answered` and `stability.fallbackTurns`; the standard renamed them at the owner's
  commit `86c49ec`.
- `docs/specification/channel-agent.md`, the daily-payload bullet ("**The daily quality payload.**", in the compatibility
  section): it becomes a pointer to DEC-0151 and to [support quality](../specification/support-quality.md)'s channel
  kinds table and project rules, and says that the escalation counts (`autonomy.toPersonPolicy`, `toPersonInability`)
  stay in turns.
- `docs/specification/channel-agent.md`, the parenthetical after the alias pattern (the memory capability's pattern, and
  what DEC-0151 in progress proposes): it says that `support-quality-daily/1` uses the same `projectAlias`.
- `docs/specification/channel-agent.md`, the join sentence after it (what DEC-0151 in progress proposes for
  `support-quality-daily` payloads): once both land it reads, as DEC-0150's list has it: "once DEC-0151 has landed and a
  feed's readers have adopted it, a reader joins a declaration to the payloads that carry `project:<slug>`; a payload
  with no project is not attributed to any project".
- `docs/specification/channel-agent.md`, item 4's sentence on the `sk-` rule (the "Being by shape" sentence: today any
  `sk-` and 16 or more name characters in any case, and what DEC-0151 in progress proposes to narrow it to): it states
  DEC-0151's rule (a word-start boundary, the `sk-` strength, canonical case) and drops "in any case" from the shared
  detector's clause only; the second reason (DEC-0149's tree check reads any `sk-` and 16 or more name characters in any
  case, `FAC-SEM-158`) is kept, and the advice not to start an id with `sk-` stays.
- DEC-0150's CA-2 in `docs/DECISIONS.md` (the same parenthetical as the alias sentence above): left as written (the
  register is append-only) and annotated with DEC-0151's merge.
- DEC-0150's CA-5 in `docs/DECISIONS.md` (the detector as it stood, and what DEC-0151 in progress proposes for `sk-`):
  left as written and annotated with DEC-0151's merge and its boundary; the advice to rename an id that starts with
  `sk-` stays true, since a strong `sk-` run at the start of a value is still found.
- DEC-0150's Compatibility (the sentence on what DEC-0151 in progress proposes for the payload, the unit of the
  escalation counts and the channel mapping): left as written and annotated with DEC-0151's merge.
- DEC-0150's Source counter sentence (the DEC chain from next 149, `d3da4336`, to next 152, `ee67e35e`, key
  `support-quality-v2-dec`): left as written and annotated so that it agrees with DEC-0151's Source and with DEC-0149's
  reservation `e27a5441` (key `ct194-source-manifest`, `"next": 150` by `git cat-file -p e27a5441`).
- This list's instruction to annotate, not rewrite, DEC-0150's CA-2, CA-5, Compatibility and Source counter sentence in
  `docs/DECISIONS.md` governs; DEC-0150's branch is aligned to it.
- `docs/specification/support-quality.md`, DEC-0150's "Not decided here" bullet on the per-project payload: removed,
  since DEC-0151's section answers it.
- `docs/evidence/sources.md`, DEC-0150's row for the channel agent standard (section 5.1, per project, DEC-0151 in
  progress): names DEC-0151 as decided and links it.
- `docs/backlog.md`, row CT-209 (its sentences and Source cell that call DEC-0151 in progress): say DEC-0151 is merged.
- `src/channel-agent.ts`, the comment on `shaped`: the second to land checks that it states DEC-0151's detector (a
  word-start boundary, the `sk-` strength) and no longer says an ordinary `sk-` name is found.
- `test/channel-agent.test.ts`: an assertion that the declaration's `project` pattern equals
  `support-quality-daily.schema.json`'s `$defs/projectAlias.pattern` (the second to land adds it if it is still absent at
  the DEC-0150 landing head). DEC-0150's two tests that build `sk-` keys, "finds a channel id the shared detector reads
  as a credential" and "asks for a rename only at a member name or an id, never at a text", both build
  `sk-support-desk-faq-answers-2026-v2` at `388f2b42`, a key DEC-0151 reads (32 characters with a digit); a scratch
  merge with this branch passes `test/channel-agent.test.ts` whole (334 tests).
- DEC-0150's budget sentences in `channel-agent.md` ("SECRET_VALUE's sk- run has no boundary today, so it is tried there
  too", "anywhere and in any case as the shared detector reads it") and its `keyRereads` comments in `src/channel-agent.ts`
  ("SECRET_VALUE's 16"): DEC-0150 is rewording them as a bound any detector may need, not as how `SECRET_VALUE`
  reads; the second to land confirms it.
- DEC-0150's `keyRereads` against this detector's boundary: the second to land confirms that it counts `KEY_REREAD`
  after every boundary form `SECRET_VALUE` lists, the `:` colour parameters and `\33` included (DEC-0150 is fixing
  `colourBefore` and `ESC_BEFORE` now), by DEC-0150's boundary-forms test extended with this detector's forms (its
  `BOUNDARY_FORMS` list in `test/channel-agent.test.ts`; the extension is the second lander's item).
- `vitest.config.ts`: DEC-0150 and DEC-0149 each widen the coverage `include` line (DEC-0151 does not touch it); the
  merge step is one coverage include line holding both lists.
- DEC-0150's `FAC-SEM-165` budget: its `keyRereads` has changed (`fc78b510`, `c201208a`, a floor `SK_FLOOR` for an
  `sk-` that follows no boundary), and DEC-0150 now words its budget terms as a bound any detector may need, not as how
  `SECRET_VALUE` reads. The second to land confirms that the three closing greps below print nothing; on the merged tree,
  DEC-0150's budget test with digit-free `-sk` strings passes.
- The merged-tree gate: DEC-0150's channel-agent timing tests timed out twice under load spikes on a scratch merge; the
  lander runs the merged gate at low load (no change owed by DEC-0151).
- The channel agent standard's copy, `docs/evidence/specs/2026-11-04-channel-agent-standard-v1-rc.md`, named as text
  in DEC-0151's Context and on the support quality page (its section 1 in rule 6): made a link once both are on main.
- `docs/DECISIONS.md`'s next-free line: DEC-0152 here; at merge take the maximum of the branches' values and the CAS
  counters, read at landing (`refs/agent-sync/ids/DEC` and `refs/agent-sync/ids/SEM` on `origin`, each by
  `git cat-file -p`): on 2026-11-05 they read next DEC-0154 and next FAC-SEM-168.
- `src/secret-shape.ts` and the source-manifest branch (DEC-0149) at `8dd4d04f`: that head keeps the tree check's own
  unbounded provider-key shapes (a fixed list held equal to a vectors constant, for parity with the adapter's source
  check), its tests no longer read `SECRET_VALUE.source`, and its
  `fixtures/semantic/source-manifest-secret-in-purpose.json` holds a key both patterns find. The only conflict is the
  textual one in `src/secret-shape.ts`: keep DEC-0149's JWT helpers (`isUrlBase64`, `runEnd`, `jwtSpans`, `hasJwt`),
  then DEC-0151's comment and `SECRET_VALUE` line. The second of DEC-0149 and DEC-0151 to land owns `source.md`'s
  sentence that a weak `sk-` slug alias in `fabric-agent.json` (`project:sk-learn-experiments` and the like) is a
  `FAC-SEM-158` credential in a source tree, since its tree check keeps its own unbounded, case-insensitive key shapes,
  so such an agent cannot export its source until the registry issues another alias (checked with `checkSourceTree` at
  `8dd4d04f`: each such alias gives one FAC-SEM-158 finding at `fabric-agent.json`, and
  `project:helpdesk-customer-support` none), and states as current the sentences that say "DEC-0149 (in progress)":
  support quality's credential paragraph, DEC-0151 item 7 and `identifiers.md`'s registry-alias bullet. Measured on a
  scratch merge of `8dd4d04f` with the round-14 head, resolved so: `tsc` exit 0; 29 vector files match their generators; the whole suite passes (114 files, 10240 tests, 3 skipped).
  No test fails.
- DEC-0150's branch at `388f2b42`, on a scratch merge with the round-14 head (the conflicting documents taken from this
  branch for the measurement only): `tsc` exit 0, 29 vector files match, and the whole suite passes (110 files, 10264 tests, 1 skipped); at `1ccfbf87` the whole suite had one failure, the rename test's 29-character sample, which DEC-0150 has since lengthened. DEC-0150's `FAC-SEM-165`
  reads with the same detector, so its declarations accept strictly more.
- When one project's alias is read as a credential, DEC-0150's `FAC-SEM-165` also flags that project's entry in the
  declaration; the lander states in `channel-agent.md` that the agent leaves that project's entry out until the registry changes the
  alias (the alias is the registry's name; the agent never invents one).
- The Source lines of DEC-0150 and DEC-0151 must agree after the merge; whichever lands second annotates its own:
  `ee67e35e` (key `support-quality-v2-dec`, `"next": 152`) is DEC-0151's reservation, and `d3da4336` (`"next": 149`) the
  value before it, as DEC-0150's Source cites; DEC-0149's own reservation is `e27a5441` (key `ct194-source-manifest`,
  `"next": 150`), each read with `git cat-file -p`.
- The organization's roadmap row AS-01 ("one event per channel and closed day", fabric-workspace
  `knowledge/roadmap.md`): owed at merge, to say one event per channel, project and closed day.
- The schema count: 150 after DEC-0149, DEC-0150 and DEC-0153 land (146 on origin/main at `ed4d6aa7`); a test or
  document that counts the schemas follows that number.

The check that closes this list, after both land, in two parts. The first spans lines, since a sentence may wrap
between "DEC-0151," and "in progress" (as `source.md` does at DEC-0149's `47d66a15`, lines 147 and 148), so it reads
each file whole rather than line by line:
`python3 -c "import re,subprocess;fs=subprocess.run(['git','ls-files','--','docs','src','test',':!docs/handoffs',':!docs/DECISIONS.md'],capture_output=True,text=True).stdout.split();[print(f) for f in fs if re.search(r'DEC-0151[^.]*in\s+progress|in-progress\s+DEC-0151',open(f,encoding='utf-8',errors='replace').read(),re.S)]"`
prints nothing (on this branch today it prints `docs/specification/identifiers.md`, whose sentence runs from DEC-0151
to "DEC-0149 (in progress)", the fourth check's subject); and in `docs/DECISIONS.md`, `awk '/^### DEC-0150/,/^### DEC-0151/' docs/DECISIONS.md | grep -n -E
'DEC-0151[^.]*in progress|in-progress DEC-0151' | grep -v 'Annotated'` prints only the lines of DEC-0150's CA-2, its
CA-5, its Compatibility and its Source counter sentence, which stay as written, while `awk '/^### DEC-0150/,/^### DEC-0151/' docs/DECISIONS.md | grep -c
'^- \*\*Annotated'` prints at least 1, an annotation naming DEC-0151's merge for all four. A third check: `git grep -n -E 'no boundary today|in any case as the shared detector reads|SECRET_VALUE.s 16' --
docs/specification src` prints nothing after both land. A fourth, after DEC-0149 and DEC-0151 both land:
the same reading with the pattern `DEC-0149\s+\(in\s+progress\)` over `docs` and `src` (handoffs and `DECISIONS.md`
left out) prints nothing, and in
`docs/DECISIONS.md` DEC-0151 item 7's sentence that says it is annotated with DEC-0149's merge; the second of the two
to land does both. The handoffs are left out
because they quote the earlier wording as history (this one does above); other handoffs, DEC-0150's included, are left
as history and are not edited.

## Decisions taken here

- The ticket count of answered tickets is `autonomy.answeredTickets`, not `autonomy.answered` (the coordinator's
  decision before round 15): no member DEC-0151 adds reuses a v2 field name with another meaning or unit (`/1`'s
  older `channel`, DEC-0095, shares v2's name with another value space; scoped so in round 15).
- The checker's counts are `stability.safeReplyTurns` and `stability.safeReplyTickets`, not `stability.fallbackTurns`
  and `fallbackTickets` (the coordinator's decision before round 15, on the producer's evidence, `24cf4f25`).

- New members are optional one by one (a producer from before DEC-0151 carries none of them); `open` and `outcomes`
  are never empty objects, as `checks` and `calibrationChecks` are not; `project` is never `null` (absent before every
  reader has adopted DEC-0151, named on every event after; a day without it is never attributed to a project).
- The outcome counts sit in one `outcomes` object, not at the top level the channel agent standard's table suggests.
- `promotions` counts the promotions made on the day; whether a promotion also restates the day the ticket ended is
  left to the channel agent standard (support-quality.md, "Not decided here").

## Checks actually run

After round 15's fixes (the commit that carries this entry), each exit code read separately: `pnpm typecheck` 0;
`pnpm vitest run test/support-quality.test.ts test/fixtures.test.ts test/consistency.test.ts test/secret-shape.test.ts`
0 (4 files, 1156 tests passed); `pnpm exec tsx tools/vectors/run.ts` 0 (28 vector files match); `pnpm run docs:check` 0
(0 markdownlint errors); `python3 docs/ux/lint.py` 0; `pnpm run privacy:check` with the organization's index 0 (0
findings); `pnpm validate fixtures/positive/support-quality-daily-no-reply.json --schema support-quality-daily --kind
support-quality-daily` 0. The full run with coverage is owed: the 1-minute load was 74.91 and under 6 GB were free,
above and below what the heavy-run rule allows. The closing check's first part, run as written on this branch, prints
only `docs/specification/identifiers.md` (the DEC-0149 sentence it names). No U+2014 in the lines this commit adds.

After the `notMeasured` pattern change (the commit that carries this entry), each exit code read separately: `pnpm
exec tsc --noEmit -p .` 0; `python3 docs/ux/lint.py` 0; `pnpm run docs:check` 0; `pnpm privacy:check` with the
organization's index 0; `pnpm exec tsx tools/vectors/run.ts` 0 (28 vector files match); `vitest run` on the same 16
touched or dependent test files 0 (3308 passed, 1 skipped). The full run with coverage is owed: the 15-minute load was
45.37, at the 45 the heavy-run rule allows (9 GB free). No U+2014 in the lines added since `d1b905ee`.

After the `stability.safeReplyTurns` rename (the commit that carries this entry), each exit code read separately:
`pnpm exec tsc --noEmit -p .` 0; `python3 docs/ux/lint.py` 0; `pnpm run docs:check` 0; `pnpm privacy:check` with the
organization's index 0; `pnpm exec tsx tools/vectors/run.ts` 0 (28 vector files match); `vitest run` on the same 16
touched or dependent test files 0 (3303 passed, 1 skipped). The full run with coverage is owed: 6 GB were free, below
the 8 GB the heavy-run rule asks (the 15-minute load was 35.50). No U+2014 in the lines added since `d1b905ee`, and no
look-behind in either copy.

After the `autonomy.answeredTickets` rename (the commit that carries this entry), each exit code read separately:
`pnpm exec tsc --noEmit -p .` 0; `python3 docs/ux/lint.py` 0; `pnpm run docs:check` 0; `pnpm privacy:check` with the
organization's index 0; `pnpm exec tsx tools/vectors/run.ts` 0 (28 vector files match); `vitest run` on the 16 touched
or dependent test files (support quality, fixtures, semantic rules and kinds, validate CLI, the service and events
tests, the session-handoff and secret-shape tests, folder attribution, the docs check) 0 (3303 passed, 1 skipped).
The full run with coverage is owed: the 15-minute load was 90.89, above the 45 the heavy-run rule allows (18 GB free).
No U+2014 in the lines added since `d1b905ee`, and no look-behind in either copy.

On the round-14 head (the commit that carries this entry), each exit code read separately: `pnpm exec tsc --noEmit -p .`
0; `pnpm vitest run --coverage` 0 (109 files, 9844 tests passed, 1 skipped, 24.91 s; under the shared heavy-run lock,
started at a 15-minute load of 43.30, 12 GB free); `python3 docs/ux/lint.py` 0; `pnpm run docs:check` 0; `pnpm
privacy:check` with the organization's index 0 (0 findings); `pnpm exec tsx tools/vectors/run.ts` 0 (28 vector files match). The scratch merges with
DEC-0150 at `388f2b42`, DEC-0149 at `8dd4d04f` and main at `7213463f` are measured in the merge list above. No U+2014 in
the lines added since `d1b905ee`, and no look-behind in either copy.

On the round-13 seam head (`f7e38dfa` and the handoff commit after it), each exit code read separately: `pnpm exec tsc
--noEmit -p .` 0; `pnpm vitest run --coverage` 0 (109 files, 9840 tests passed, 1 skipped, 33.52 s; under the shared
heavy-run lock, started at a 15-minute load of 39.88); `python3 docs/ux/lint.py` 0; `pnpm run docs:check` 0; `pnpm
privacy:check` with the organization's index 0 (0 findings); `pnpm exec tsx tools/vectors/run.ts` 0 (28 vector files
match). No U+2014 in the lines added since `d1b905ee`, and no look-behind in either copy. Main was not merged again:
it is unchanged at `bf50c9fc` since the round-13 measurement.

On the round-13 head (`60a22ba1` and the handoff commit after it), each exit code read separately: `pnpm exec tsc
--noEmit -p .` 0; `pnpm vitest run --coverage` 0 (109 files, 9836 tests passed, 1 skipped, 36.49 s), run under the
shared heavy-run lock after the scratch merges; its wait began at a 15-minute load of 44.87, which rose to 47.99 by the
coverage run itself; `python3 docs/ux/lint.py` 0; `pnpm run docs:check` 0; `pnpm privacy:check` with the
organization's index 0 (0 findings); `pnpm exec tsx tools/vectors/run.ts` 0 (28 vector files match). No U+2014 in the
lines added since `d1b905ee`, no look-behind in either copy, and every copy of rules 1 and 6 reads the same
(`git grep -c -F` on each rule's key clause).

On the round-12 head (`6027e1e2` and the handoff commit after it), each exit code read separately: `pnpm exec tsc
--noEmit -p .` 0; `pnpm vitest run --coverage` 0 (109 files, 9835 tests passed, 1 skipped, 29.81 s; started at a
15-minute load of 21.99); `python3 docs/ux/lint.py` 0; `pnpm run docs:check` 0; `pnpm privacy:check` with the
organization's index 0 (0 findings); `pnpm exec tsx tools/vectors/run.ts` 0 (28 vector files match). No U+2014 in the
lines added since `d1b905ee`, no look-behind in either copy, the reader row's side-rule check prints one line, the
differential is 0 new-only (34527 both, 113105 only the earlier, over an alphabet with `:`, U+009B, braces, `^` and
`E`), and the detector reads `-sk` repeated 100000 times in 46 to 53 ms of CPU per check.

On the round-11 head (`70f3e958` and the handoff commit after it), each exit code read separately: `pnpm exec tsc
--noEmit -p .` 0; `pnpm vitest run --coverage` 0 (109 files, 9834 tests passed, 1 skipped, 22.48 s; started at a
15-minute load of 37.59); `python3 docs/ux/lint.py` 0; `pnpm run docs:check` 0; `pnpm privacy:check` with the
organization's index 0 (0 findings); `pnpm exec tsx tools/vectors/run.ts` 0 (28 vector files match). No U+2014 in the
lines added since `d1b905ee`, no look-behind in either copy, the differential is unchanged (0 new-only), no line says
"observed check accepts a withheld channel", and no example uses the earlier company name.

On the round-10 seam addendum's head (`707d3301` and the handoff commit after it), each exit code read separately:
`pnpm exec tsc --noEmit -p .` 0; `pnpm vitest run --coverage` 0 (109 files, 9833 tests passed, 1 skipped, 32.25 s,
started at a 15-minute load of 44.91 after a wait); `python3 docs/ux/lint.py` 0; `pnpm run docs:check` 0; `pnpm
privacy:check` with the organization's index 0 (0 findings); `pnpm exec tsx tools/vectors/run.ts` 0 (28 vector files
match). No U+2014 in the lines added since the merge base `d1b905ee`, no look-behind in either copy, and the
differential is unchanged (0 new-only).

On the round-10 head, each exit code read separately: `pnpm exec tsc --noEmit -p .` 0; `python3 docs/ux/lint.py` 0;
`pnpm run docs:check` 0; `pnpm privacy:check` with the organization's index 0 (0 findings); `pnpm exec tsx
tools/vectors/run.ts` 0 (28 vector files match). `pnpm vitest run --coverage` ran twice: the first, started at a 15-minute
load of 44.90 that rose during the run (57.07 s), exited 1 on one timeout in `test/mandate.test.ts` ("a scope
scopeWithin accepts covers no call its parent does not", 5259 ms against vitest's 5000 ms default; a file this branch does
not change, which passes alone, 79 tests); the second, started at a 15-minute load of 48.02, exited 0 (109 files, 9833
tests passed, 1 skipped, 22.97 s). No U+2014 in the added lines, no look-behind in either copy, the differential is
unchanged (0 new-only), and the D2 checks print nothing.

On the round-9 head and its seam addendum (each run on its head), each exit code read separately: `pnpm exec tsc --noEmit -p .` 0; `pnpm vitest run --coverage` 0
(109 files, 9832 tests passed, 1 skipped, 23.90 s); `python3 docs/ux/lint.py` 0; `pnpm run docs:check` 0; `pnpm
privacy:check` with the organization's index 0 (0 findings); `pnpm exec tsx tools/vectors/run.ts` 0 (28 vector files
match). The coordinator's two D2 checks (a `git grep -c -F` for the removed per-day phrase over docs and schemas, and a
`grep -n -E` for an orphan fragment in conformance.md) print nothing. No U+2014 in the added lines, no look-behind in either copy, and
the differential is unchanged (0 new-only).

On the round-8 head (`f7c866d1` and the handoff commit after it), each exit code read separately: `pnpm exec tsc
--noEmit -p .` 0; `pnpm vitest run --coverage` 0 (109 files, 9831 tests passed, 1 skipped, 19.77 s); `python3
docs/ux/lint.py` 0; `pnpm run docs:check` 0; `pnpm privacy:check` with the organization's index 0 (0 findings); `pnpm
exec tsx tools/vectors/run.ts` 0 (28 vector files match). No U+2014 in the added lines, no look-behind in either copy,
the differential is unchanged (0 new-only), and no line of the support quality page, identifiers.md, DECISIONS.md,
the backlog, this handoff or `src/secret-shape.ts` holds a piece the shared detector reads as a key.

On the round-7 head (`285fbf8a` and the handoff commit after it), each exit code read separately: `pnpm exec tsc
--noEmit -p .` 0; `pnpm vitest run --coverage` 0 (109 files, 9831 tests passed, 1 skipped, 19.65 s); `python3
docs/ux/lint.py` 0; `pnpm run docs:check` 0; `pnpm privacy:check` with the organization's index 0 (0 findings); `pnpm
exec tsx tools/vectors/run.ts` 0 (28 vector files match). The whole suite ran three more times (16.69 s, 18.12 s and
16.91 s, all exit 0); in the last, run verbose, the timing test took 3019 ms. No U+2014 in the added lines, no
look-behind in either copy, and the differential is unchanged (0 new-only).

On the round-6 head, each exit code read separately: `pnpm exec tsc --noEmit -p .` 0; `pnpm vitest run --coverage` 0
(109 files, 9830 tests passed, 1 skipped); `python3 docs/ux/lint.py` 0; `pnpm run docs:check` 0; `pnpm privacy:check`
with the organization's index 0 (0 findings); `pnpm exec tsx tools/vectors/run.ts` 0 (28 vector files match). No
U+2014 in the added lines, no look-behind in either copy of `SECRET_VALUE`, and the differential against origin/main's
pattern still finds 0 new-only matches (32147 both, 115485 only the earlier).

On the round-5 head (`19ab1f56` and the handoff commit after it, which changes only this file), each exit code read
separately: `pnpm exec tsc --noEmit -p .` 0; `pnpm vitest run --coverage` 0 (109 files, 9830 tests passed, 1 skipped);
`python3 docs/ux/lint.py` 0; `pnpm run docs:check` 0; `pnpm privacy:check` with the organization's index 0 (0
findings); `pnpm exec tsx tools/vectors/run.ts` 0 (28 vector files match). No U+2014 in the added lines, and no
look-behind in either copy of `SECRET_VALUE`. The detector's timing on `-sk` repeated 100000 times: 41 to 47 ms of CPU
per check; a sweep of 300000 generated values (octal, double percent and the escaped ESC forms included) found 0 that
the new pattern finds and origin/main's did not (32147 both, 115485 only the earlier).

On `03c0328f` the coordinator ran `pnpm vitest run --coverage`: exit 0, 108 files, 9799 tests passed, 1 skipped. On
the round-4 head (`6c8ec0d4`), each exit code read separately: `pnpm exec tsc --noEmit -p .` 0; `pnpm vitest run --coverage`
0 (109 files, 9823 tests passed, 1 skipped; 9816 on `e1191560`, 9819 on `82aa26eb`, 9820 on `706075de`, 9821 on
`8660ae24`); `python3 docs/ux/lint.py` 0;
`pnpm run docs:check` 0; `pnpm privacy:check` with the organization's index 0 (0 findings);
`pnpm exec tsx tools/vectors/run.ts` 0 (28 vector files match; support quality has no vector generator). No U+2014 in
the added lines.

## Next task

Round 18 of the readings of branch `agent/sqd-fields-20261104` (DEC-0151) by blind readers (round 17 was not clean on
the product tier), until two consecutive rounds are clean, with the full coverage run at low load; open the pull
request (DEC-0150 is on main, so the merge gate holds) and merge. The landing commit, before the merge:

- DEC-0151's Status Accepted with its clean rounds; CT-129 closed with its receipt; CT-210's first step done; and every
  other row that calls DEC-0151 proposed or on a branch restated as merged: CT-73, CT-103, CT-188 and this handoff's row
  in `docs/handoffs/README.md`.
- DEC-0151's Source and CT-210's status record the rounds from 16 on and the two clean ones, and "two consecutive clean
  rounds are still owed" goes; the Consequences list stays complete.
- The dates of the three Annotated lines this branch adds under DEC-0096, DEC-0150 and DEC-0153 ("DEC-0151 has merged", "has
  landed") set to the merge date, so the append-only register keeps a true date.
- The knowledge base (fabric-workspace `knowledge/roadmap.md`): AS-01 and the Agent assessment sentence ("publishes one
  `support.quality_daily` per channel and closed day") both say per channel, project once adopted, and closed day.
- Closing check on the landing commit: `grep -nE 'DEC-0151 \(proposed|DEC-0151, proposed|branch \`agent/sqd-fields-20261104\`'
  docs/backlog.md docs/handoffs/README.md docs/specification CONTEXT.md` prints nothing, and `grep -n -A2 '^### DEC-0151'
  docs/DECISIONS.md` shows the Status Accepted, and `awk '/^### DEC-0151/,/^### DEC-0152/' docs/DECISIONS.md | grep -c
  'still owed'` prints 0.

Then release, and answer thread `b6820b97` with the tag. At landing also: CT-210 (f), the post to each multi-project
`/1` producer on the board (rule 1's withholding starts at the merge); CT-210 (e), the vendor rows (the adapter, Fabric's
re-pin, Dashboards' re-vendor, the Switchboard and Observatory ports); the North Star plan's wave 0 item 3 and its row on
DEC-0151 marked done, and CT-210 (g), the operator's question on registry aliases, carried to its operator decisions
table.
