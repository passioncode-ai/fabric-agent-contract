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
  catalogue rows), six semantic. Tests: in `test/support-quality.test.ts`, DEC-0070's bounds (19 top-level members, 10
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
  lower-case alias never holds it), pinned by `project:sk-customer-support-team-europe-2026`. connections.md and CT-73
  now say what the shared detector has since DEC-0151 (CT-73's examples re-measured), DEC-0044 is annotated, and
  profiles.md and fabric-button.md take the exact strength wording and point to item 7's escapes. The coordinator's
  decisions applied: the boundary also takes `\x` with two hex digits, `\b`, `\f`, `\v`, `\0`, `\a`, `\e`, a raw ESC
  colour sequence and an escaped one; CT-210 (d) is a named prerequisite of producer adoption; a day without `project`
  from a several-project service is a merged day, never attributed to one project; the interim gate accepts exactly
  the one FAC-SEM-126 finding; the alias rule binds a producer that must carry `project`, and the registry's rule is
  the operator's; the ports' wording; how a reader combines per-project days is the reader's. A sweep of 300000
  generated values (escapes and ESC included) found 0 that the new pattern finds and origin/main's did not (40485
  both, 107147 only the earlier).

## Open

- Two clean rounds of blind readings, then merge (the branch is pushed, no pull request yet).
- On DEC-0151's merge: close CT-129 (fixed by item 3) with its receipt.
- The coordinator tells the channel agent standard's owner, on thread `b6820b97`, that its observed check must accept a
  channel a producer withholds during the wait (CT-210 step (d)); the coordinator files the adapter's row (step (e)).
- Fabric vendors `src/session-handoff.ts` alone: its copy of `SECRET_VALUE` changed with item 7, so Fabric re-vendors it.
- `fixtures/vectors/folder-attribution.json` changes with the detector: one AT-15 input (a strong `sk-` user) and three
  new AT-15 cases that tell DEC-0151's detector from the earlier one (a remote holding `-sk-` inside a word and one
  holding a weak `sk-` slug now record their origin; a strong key after a percent-escape records none). Every port
  re-syncs that vector file together with the detector, and checks the `sk-` strength outside its regex where the
  regex has no look-ahead.
- Adoption, CT-210, in its order: `support.tickets_daily` mapped into each reader's ticket view first, readers re-pin and
  key by project, producers re-vendor the schema and carry the members once every reader has adopted.

## When DEC-0150 and DEC-0151 meet on main

DEC-0150's current branch is `origin/agent/channel-agent-ext-v3-20261104` (`fcdb7ccb` when this was written; the
source-manifest branch was at `c68690c7`). DEC-0151 merges after DEC-0150, or rebases over it.

The files each open branch shares with this one, from `git merge-tree` against `6c8ec0d4` on 2026-11-04 (a textual
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
- **Against DEC-0149** (`origin/agent/ct194-source-manifest-20261103`): `docs/DECISIONS.md` and `docs/backlog.md` (tail
  appends; keep both, in order), `docs/handoffs/README.md` (keep both rows) and `src/secret-shape.ts` (the bullet
  below). Its `URL_SECRET_VALUE` in `src/source-rules.ts` deliberately stays the tree check's own earlier unbounded
  pattern, with the `i` flag, for parity with the adapter's source check: it is NOT changed at the merge.
- **Against PR #235** (`agent/ct200-renewal-repeat-20261102`, DEC-0148): `docs/DECISIONS.md` and `docs/backlog.md`
  (tail appends; keep both, in order).
- **Against PR #236** (`agent/template-parity-20261103`): `docs/backlog.md` (tail appends; keep both, in order).

The second of DEC-0150 and DEC-0151 to merge also rewrites these:

- `docs/specification/channel-agent.md`, the "daily quality payload" bullet: "That is DEC-0151 (CT-210), in progress:
  until DEC-0151 lands, an agent following section 5.1 emits payloads this contract refuses, and how the seven channel
  kinds here map to `/1`'s four channels ... is DEC-0151's to decide." It becomes a pointer to DEC-0151 and to
  [support quality](../specification/support-quality.md)'s channel kinds table.
- `docs/specification/support-quality.md`, DEC-0150's "Not decided here" bullet "The per-project payload ...:
  DEC-0151 (CT-210), in progress": removed, since DEC-0151's section answers it.
- DEC-0150's Compatibility sentence "that is DEC-0151 (CT-210), in progress: until it lands, ... the mapping of the
  seven channel kinds to `/1`'s four channels is DEC-0151's": left as written (the register is append-only) and
  annotated with DEC-0151's merge.
- The channel agent standard's copy, `docs/evidence/specs/2026-11-04-channel-agent-standard-v1-rc.md`, named as text
  in DEC-0151's Context and on the support quality page: made a link once both are on main.
- `docs/DECISIONS.md`'s next-free line: DEC-0152 here; at merge take the maximum of the branches' values and the CAS
  counter.
- The detector: DEC-0150's branch documents the earlier false positive as standing ("the shared detector stays as it
  is" in its CA-5, in `channel-agent.md`'s check of a declaration, and in its handoff's note on the detector). Whichever
  lands second keeps DEC-0151's boundary and drops that note; the advice to rename an id that starts with `sk-` stays
  true, since a prefix at the start of a value is still found.
- `src/secret-shape.ts` and the source-manifest branch (DEC-0149): that branch's rework keeps the tree check's own
  unbounded provider-key shapes, a fixed list held equal to a vectors constant for parity with the adapter's source
  check, no longer derived from `SECRET_VALUE`, so the earlier instruction that the second to merge gives its
  `KEY_SHAPES` DEC-0151's boundary, strength and case is withdrawn (the coordinator, from DEC-0149's seam reading).
  After that rework its tests no longer read `SECRET_VALUE.source`, and its
  `fixtures/semantic/source-manifest-secret-in-purpose.json` holds a key found under both patterns (at origin's
  `c68690c7`, read on 2026-11-04, the fixture still held `sk-example-not-a-key-0000`, which DEC-0151's pattern does
  not find: check it at merge). The only remaining conflict is the textual one in `src/secret-shape.ts`: its
  `jwtSpans` and `hasJwt` block (with `rawValues`) sits right above DEC-0151's rewritten comment; keep DEC-0149's JWT
  helpers, then DEC-0151's comment and `SECRET_VALUE` line.
- DEC-0150's branch at `bba0209d` with DEC-0151's final line and DEC-0151's changed tests, fixtures and vector file, on
  a scratch copy: its 29 vector files match their generators, and of its whole suite (9930 tests) two fail, owed by the
  second to merge: the channel-agent vectors "a token slot whose project segment is shaped like a provider key" and "a
  texts key shaped like a credential: placed at its map" use `sk-` with `a1` or `b2` repeated (a digit, no upper-case
  letter, 24 characters), which is no longer a key; their inputs in `tools/vectors/channel-agent.ts` take a digit and an
  upper-case letter, and `fixtures/vectors/channel-agent.json` is written again. DEC-0150's `FAC-SEM-165` reads with
  the same detector, so its declarations accept strictly more.
- DEC-0150's join sentence in `channel-agent.md` ("so a reader joins a declaration to a project's payloads on
  `project:<slug>`"): once both land it reads "on `project:<slug>`, or, for a payload with no project, on the
  declaration's one project".
- DEC-0150's handoff Open bullet on section 5.1 ("until DEC-0151 ... lands, an agent following it emits
  `support-quality-daily/1` payloads this contract refuses"): dropped once DEC-0151 is on main.
- The organization's roadmap row AS-01 ("one event per channel and closed day", fabric-workspace
  `knowledge/roadmap.md`): owed at merge, to say one event per channel, project and closed day.
- The schema count: 148 after the source-manifest branch and DEC-0150's land (146 on origin/main today); a test or
  document that counts the schemas follows that number.

## Decisions taken here

- New members are optional one by one (a producer from before DEC-0151 carries none of them); `open` and `outcomes`
  are never empty objects, as `checks` and `calibrationChecks` are not; `project` is never `null` (absent is the
  service's one project).
- The outcome counts sit in one `outcomes` object, not at the top level the channel agent standard's table suggests.
- `promotions` counts the promotions made on the day; whether a promotion also restates the day the ticket ended is
  left to the channel agent standard (support-quality.md, "Not decided here").

## Checks actually run

On `03c0328f` the coordinator ran `pnpm vitest run --coverage`: exit 0, 108 files, 9799 tests passed, 1 skipped. On
the round-4 head, each exit code read separately: `pnpm exec tsc --noEmit -p .` 0; `pnpm vitest run --coverage`
0 (109 files, 9823 tests passed, 1 skipped; 9816 on `e1191560`, 9819 on `82aa26eb`, 9820 on `706075de`, 9821 on
`8660ae24`); `python3 docs/ux/lint.py` 0;
`pnpm run docs:check` 0; `pnpm privacy:check` with the organization's index 0 (0 findings);
`pnpm exec tsx tools/vectors/run.ts` 0 (28 vector files match; support quality has no vector generator). No U+2014 in
the added lines.

## Next task

Round 4 of the readings of branch `agent/sqd-fields-20261104` (DEC-0151) by two blind readers; fix, re-read until two
rounds are clean; open the pull request, merge after DEC-0150's branch or rebase over it (the list above), mark DEC-0151
accepted, close CT-129, mark CT-210's first step done, release, and answer thread `b6820b97` with the tag.
