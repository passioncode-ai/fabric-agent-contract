# 2026-11-04: the channel agent standard's ticket counts (CT-210, DEC-0151)

## Objective

Answer the board request `74105ca1` (thread `b6820b97`): give the ticket counts of the channel agent standard's daily
loop (its v1 release candidate, section 5) a home in `support-quality-daily/1`, by the path DEC-0144 took, and let
`notMeasured` name `nobodyDropped.firstReplyP50Ms`, which FAC-SEM-126 asks for and the pattern refused (CT-129, X-4).

## Done

- DEC-0151 (proposed), [support quality](../specification/support-quality.md#the-ticket-counts-dec-0151): the optional
  `arrived`, `ended`, `notATicket`, `project` (`project:<slug>`), `open {handedOpen, questionOpen, awaitingCustomer,
  awaitingApproval}`, `outcomes {handoffsClosedByPerson, referred, answeredElsewhere, noReplyOwed, customerSilent,
  expiredByDecision, expired, unanswered, firstReplyLate, promotions}`, `autonomy.answered`, `stability.fallbackTurns`
  and `fallbackTickets`; the `notMeasured` pattern admits digits in the metric part only; the channel agent standard's
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
  "to a person" ticket share from the turn counts; `autonomy.answered` from the predecessor only when its `answered`
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

## Open

- Two clean rounds of blind readings, then merge (the branch is pushed, no pull request yet).
- On DEC-0151's merge: close CT-129 (fixed by item 3) with its receipt.
- The coordinator tells the channel agent standard's owner, on thread `b6820b97`, that its observed check (section 11)
  must accept, until the feed's readers adopt DEC-0151, a day published without `project` (never attributed, rule 3 of
  the project section), a withheld channel and a project withheld because its alias is read as a credential, and asks for the two prerequisites of section 5.1 (turns for the escalation counts, the ticket counts by
  the signal server) and the team-chat note (CT-210 step (d)); the coordinator files the adapter's row (step (e)). A
  project withheld for its alias keeps its days, and after the registry changes the alias the producer publishes the
  kept days under the new alias.
- The vendors re-sync with item 7, including: the Fabric Agent Adapter kit's detector ports (its Python and JS secrets
  modules, its dashboard-link checkers, its connection ports and its dashboard button), its vendored vector files that
  change answer (`connections-extra` and `feed-protocols`, and `estate-vectors.json` and `package-vectors.json`,
  re-vendored from the two changed semantic fixtures), Fabric Switchboard's folder-attribution port (it has neither
  look-ahead nor look-behind, so it checks the `sk-` strength outside its regex and re-syncs `folder-attribution.json`
  at the merge commit), Project Observatory's folder-attribution port (with its attribution-vectors pin) and its
  estate-record port (`FAC-SEM-075`), re-synced together with `folder-attribution.json`, and any template or agent that
  copies the kit, and the adapter's dashboard-link test sample, whose lower-case `sk-` sample stops being a key under DEC-0151 and at the re-sync becomes one DEC-0151 reads (a digit and an upper-case letter, built from pieces as the contract's SH-9 case is), and the adapter's profiles test case whose query holds `%zz`, a raw control character and `KIA` with 16 more characters stops being found under DEC-0151 (its `AKIA` borrowed the `A` of the encoded `%1A`) and is rebuilt at the re-sync with a boundary before `AKIA`, built from pieces; whole-file vendors that pin `src/secret-shape.ts` by hash take DEC-0151 at their next re-pin, with
  their vectors; any port that copies
  `fixtures/vectors/folder-attribution.json` re-syncs it only together with the detector, since two AT-15 cases fail
  otherwise. Fabric vendors `src/secret-shape.ts` twice, one copy under a sha256 `pin.json`
  together with `fixtures/vectors/folder-attribution.json`, so both are re-pinned together; Fabric Dashboards vendors
  `src/session-handoff.ts` and `src/fabric-links.ts`, and its service host's connections hold a port; Fabric
  Dashboards' sample-service kit copies hold the earlier pattern.
- The adapter's source check (`fabric_source_check.py`) derives its provider-key shapes from
  `fabric_secrets.SECRET_VALUE.pattern` and raises `ImportError` on DEC-0151's pattern: it keeps the earlier unbounded
  shapes as its own fixed list, for parity with DEC-0149's tree check, before or together with the detector's port, and
  is exempt from the instruction that every port takes the same boundary (CT-210 (e), CT-207).
- `fixtures/vectors/folder-attribution.json` changes with the detector: one AT-15 input (a strong `sk-` user) and three
  new AT-15 cases that tell DEC-0151's detector from the earlier one (a remote holding `-sk-` inside a word and one
  holding a weak `sk-` slug now record their origin; a strong key after a percent-escape records none). Every port
  re-syncs that vector file together with the detector, and checks the `sk-` strength outside its regex where the
  regex has no look-ahead.
- Adoption, CT-210, in its order: `support.tickets_daily` mapped into each reader's ticket view first, readers re-pin and
  key by project, producers re-vendor the schema and carry the members once every reader has adopted.

## When DEC-0150 and DEC-0151 meet on main

DEC-0150's current branch is `origin/agent/channel-agent-ext-v3-20261104` (`3c1ba539` when this was written; the
source-manifest branch was at `725b67cd`). The scratch measurements below are of those heads; they are measured again
at merge, against the heads then current. **Merge gate:** DEC-0150 must be on main before DEC-0151 merges. At
DEC-0151's merge, `git ls-tree origin/main docs/evidence/specs/2026-11-04-channel-agent-standard-v1-rc.md` prints the
file and `grep '^### DEC-0150' docs/DECISIONS.md` prints one line; if either prints nothing, DEC-0151 waits (or rebases
over DEC-0150 once it lands).

The files each open branch shares with this one, from `git merge-tree` against `f7c866d1` on 2026-11-04 (a textual
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
  - `src/secret-shape.ts` (auto-merges): DEC-0150's `rawValues` change and DEC-0151's `SECRET_VALUE` touch different
    lines; keep both.
- **Against DEC-0149** (`origin/agent/ct194-source-manifest-20261103`, `725b67cd`): `docs/DECISIONS.md` and
  `docs/backlog.md` (tail appends; keep both, in order), `docs/handoffs/README.md` (keep both rows) and
  `src/secret-shape.ts` (the bullet below). Its `URL_SECRET_VALUE` in `src/source-rules.ts` deliberately stays the tree
  check's own earlier unbounded pattern, with the `i` flag, for parity with the adapter's source check: it is NOT
  changed at the merge. Decision for its lander: after the merge, DEC-0149's path and word reads (`credentialShaped`,
  `pathHoldsFinding`) use the tree check's own unbounded key shapes, not the narrowed shared detector, so a key glued
  into a path is still held; the DEC-0149 branch makes that change itself.
- **Against PR #235** (`agent/ct200-renewal-repeat-20261102`, DEC-0148): `docs/DECISIONS.md` and `docs/backlog.md`
  (tail appends; keep both, in order).
- **Against PR #236** (`agent/template-parity-20261103`): `docs/backlog.md` (tail appends; keep both, in order).

The second of DEC-0150 and DEC-0151 to merge also rewrites these (DEC-0150's sentences quoted from its branch at
`3c1ba539`, cited by their text, since its lines move):

- `docs/specification/channel-agent.md`, the daily-payload bullet that begins "**The daily quality payload.**" and says
  "That schema is what DEC-0151, in progress on CT-210, proposes. Until it lands, an agent following section 5.1 emits
  payloads this contract refuses, and how the seven channel kinds here map to `/1`'s four channels ... is what
  DEC-0151, in progress, proposes to decide": it becomes a pointer to DEC-0151 and to
  [support quality](../specification/support-quality.md)'s channel kinds table and project rules, and says that the
  escalation counts (`autonomy.toPersonPolicy`, `toPersonInability`) stay in turns.
- `docs/specification/channel-agent.md`, the parenthetical "the memory capability's pattern; DEC-0151, in progress on
  CT-210, proposes the same `projectAlias`" after the alias pattern: it says that `support-quality-daily/1` uses the same
  `projectAlias`.
- DEC-0150's CA-2 in `docs/DECISIONS.md`, which carries the same parenthetical: left as written (the register is
  append-only) and annotated with DEC-0151's merge.
- DEC-0150's join sentence in `channel-agent.md` ("DEC-0151 (CT-210, in progress) gives `support-quality-daily` payloads
  the same alias; once it lands, a reader joins a declaration to a project's payloads on `project:<slug>`"): once both
  land it reads "DEC-0151 gives `support-quality-daily` payloads the same alias, and a reader joins a declaration to a
  project's payloads on `project`, and a payload with no project is not attributed to any project".
- `test/channel-agent.test.ts`: an assertion that the declaration's `project` pattern equals
  `support-quality-daily.schema.json`'s `$defs/projectAlias.pattern` (none at `3c1ba539`; the second to land adds
  it if it is still absent).
- `docs/evidence/sources.md`, DEC-0150's row for the channel agent standard: "section 5.1 the daily
  `support-quality-daily/1` per project (DEC-0151, in progress)" names DEC-0151 as decided and links it.
- `docs/backlog.md`, row CT-209: its "Until DEC-0151 (CT-210, in progress) lands ..." and "DEC-0151, in progress,
  proposes how the seven channel kinds map ..." and its Source cell "DEC-0151 (in progress), CT-210" say DEC-0151 is
  merged.
- `src/channel-agent.ts`, the comment on `shaped` ("Whether a string is shaped like a credential, by FAC-SEM-101's
  detector ..."): DEC-0150 is rewording it for the present rule now; the second to land checks it states DEC-0151's
  detector (a word-start boundary, the `sk-` strength) and no longer says an ordinary `sk-` name is found.
- `docs/specification/support-quality.md`, DEC-0150's "Not decided here" bullet on the per-project payload ("...:
  DEC-0151 (CT-210), in progress"): removed, since DEC-0151's section answers it.
- DEC-0150's Compatibility sentence ("that is DEC-0151 (CT-210), in progress: until it lands, an agent following section
  5.1 emits payloads this contract refuses, and the mapping of the seven channel kinds to `/1`'s four channels is what
  the in-progress DEC-0151 proposes"): left as written and annotated with DEC-0151's merge.
- DEC-0150's counter sentence in its Source ("That chain moves from next 149 (`d3da4336`) to next 152 in one commit,
  `ee67e35e` (key `support-quality-v2-dec`), the reservation of DEC-0151 (in progress) ..."): left as written and
  annotated so that it agrees with DEC-0151's Source and with DEC-0149's reservation `e27a5441` (key
  `ct194-source-manifest`, `"next": 150` by `git cat-file -p e27a5441`).
- The channel agent standard's copy, `docs/evidence/specs/2026-11-04-channel-agent-standard-v1-rc.md`, named as text
  in DEC-0151's Context and on the support quality page: made a link once both are on main.
- `docs/DECISIONS.md`'s next-free line: DEC-0152 here; at merge take the maximum of the branches' values and the CAS
  counter.
- `docs/specification/channel-agent.md`, the sentence that begins "Being by shape, the detector also finds an ordinary
  hyphenated name that starts with `sk-`: today any `sk-` followed by 16 or more letters, digits, `_` or `-`, in any
  case ...": it states DEC-0151's rule (a word-start boundary, the `sk-` strength, canonical case) and drops "in any
  case"; the advice not to start an id with `sk-` stays.
- The detector, as DEC-0150's CA-5 states it ("the shared detector stays as it is", and an ordinary name such as `sk-`
  and 16 more name characters is found too): whichever lands second keeps DEC-0151's boundary and annotates CA-5 with
  it, left as written in the register; the advice to rename an id that starts with `sk-` stays true, since a strong
  `sk-` run at the start of a value is still found.
- DEC-0150's `FAC-SEM-165` budget (its `keyRereads`, `ESCAPE_BEFORE`, `ESC_BEFORE` and `colourBefore`, read at
  `cd350f47`): it charges, after every `sk-` (in any case) at a boundary, up to 255 code points, where a boundary is the
  start, a character other than a letter or a digit, `%XX`, `%25XX`, `\xHH`, `\uHHHH`, a two- or three-digit octal
  escape, any one-character backslash escape (which covers a one-digit octal), or a colour sequence with any number of
  parameter characters whose ESC is raw or written `\x1b`, `\x1B`, `\033`, `\u001b`, `\u001B` or `\e`. That covers
  every boundary form of DEC-0151's `SECRET_VALUE`, so no `keyRereads` change is owed at `cd350f47`; if the head that
  lands differs, the second to land compares again. No wording change is owed by DEC-0151; on the merged tree,
  DEC-0150's budget test with digit-free `-sk` strings passes.
- `test/channel-agent.test.ts`, DEC-0150's test titled "finds a valid channel id of sk- and 16 or more name characters,
  today's rule, as the page warns": its title and case state DEC-0151's rule (32 name characters holding a digit, or 16
  with a digit and an upper-case letter).
- This list's instruction to annotate, not rewrite, DEC-0150's CA-2, CA-5, Compatibility and Source counter sentence in
  `docs/DECISIONS.md` governs; DEC-0150's branch is being aligned to it.
- `src/secret-shape.ts` and the source-manifest branch (DEC-0149) at `725b67cd`: that head keeps the tree check's own
  unbounded provider-key shapes (a fixed list held equal to a vectors constant, for parity with the adapter's source
  check), its tests no longer read `SECRET_VALUE.source`, and its
  `fixtures/semantic/source-manifest-secret-in-purpose.json` holds a key both patterns find. The only conflict is the
  textual one in `src/secret-shape.ts`: keep DEC-0149's JWT helpers (`isUrlBase64`, `runEnd`, `jwtSpans`, `hasJwt`),
  then DEC-0151's comment and `SECRET_VALUE` line. Measured on a scratch merge of `725b67cd` with `f7c866d1` (round 8's fixes), resolved
  so: `tsc` exit 0; 29 vector files match their generators; the whole suite passes (112 files, 10193 tests, 3 skipped).
  No test fails.
- DEC-0150's branch at `3c1ba539`, on a scratch merge with `f7c866d1` (the five conflicting documents taken from this
  branch for the measurement only): `tsc` exit 0, 29 vector files match their generators, and the whole suite passes
  (110 files, 10042 tests, 1 skipped), DEC-0150's `FAC-SEM-165` budget test with digit-free `-sk` strings among them. No test fails. DEC-0150's `FAC-SEM-165` reads with the same detector, so its
  declarations accept strictly more.
- When one project's alias is read as a credential, DEC-0150's `FAC-SEM-165` also flags that project's entry in the
  declaration; the lander states in `channel-agent.md` that the agent removes or renames that project's entry.
- The Source lines of DEC-0150 and DEC-0151 must agree after the merge; whichever lands second annotates its own:
  `ee67e35e` (key `support-quality-v2-dec`, `"next": 152`) is DEC-0151's reservation, and `d3da4336` (`"next": 149`) the
  value before it, as DEC-0150's Source cites; DEC-0149's own reservation is `e27a5441` (key `ct194-source-manifest`,
  `"next": 150`), each read with `git cat-file -p`.
- The organization's roadmap row AS-01 ("one event per channel and closed day", fabric-workspace
  `knowledge/roadmap.md`): owed at merge, to say one event per channel, project and closed day.
- The schema count: 148 after the source-manifest branch and DEC-0150's land (146 on origin/main today); a test or
  document that counts the schemas follows that number.

The check that closes this list, after both land, in two parts:
`git grep -n -E 'DEC-0151[^.]*in progress|in-progress DEC-0151' -- docs src test ':!docs/handoffs' ':!docs/DECISIONS.md'`
prints nothing; and in `docs/DECISIONS.md`, `awk '/^### DEC-0150/,/^### DEC-0151/' docs/DECISIONS.md | grep -n -E
'DEC-0151[^.]*in progress|in-progress DEC-0151' | grep -v 'Annotated'` prints only the lines of DEC-0150's CA-2, its
CA-5, its Compatibility and its Source counter sentence, which stay as written, while `awk '/^### DEC-0150/,/^### DEC-0151/' docs/DECISIONS.md | grep -c
'^- \*\*Annotated'` prints at least 1, an annotation naming DEC-0151's merge for all four. The handoffs are left out
because they quote the earlier wording as history (this one does above); other handoffs, DEC-0150's included, are left
as history and are not edited.

## Decisions taken here

- New members are optional one by one (a producer from before DEC-0151 carries none of them); `open` and `outcomes`
  are never empty objects, as `checks` and `calibrationChecks` are not; `project` is never `null` (absent before every
  reader has adopted DEC-0151, named on every event after; a day without it is never attributed to a project).
- The outcome counts sit in one `outcomes` object, not at the top level the channel agent standard's table suggests.
- `promotions` counts the promotions made on the day; whether a promotion also restates the day the ticket ended is
  left to the channel agent standard (support-quality.md, "Not decided here").

## Checks actually run

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

Round 11 of the readings of branch `agent/sqd-fields-20261104` (DEC-0151) by blind readers, until two consecutive rounds
are clean; open the pull request; merge only once DEC-0150 is on main (the merge gate above), applying the merge list;
mark DEC-0151 accepted, close CT-129, mark CT-210's first step done, release, and answer thread `b6820b97` with the tag.
