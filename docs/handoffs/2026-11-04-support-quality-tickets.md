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
- Fixtures: four positive (one an events page with two projects' days, one with `project:alpha`), six negative (with
  catalogue rows), five semantic; the DEC-0151 tests in `test/support-quality.test.ts`, among them DEC-0070's bounds (19
  top-level members, 10 in `outcomes`, 28 had the outcomes stood at the top level), two projects' days on one channel,
  and a 40-character mixed-case id refused as a project.
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

## Open

- Two clean rounds of blind readings, then merge (the branch is pushed, no pull request yet).
- On DEC-0151's merge: close CT-129 (fixed by item 3) with its receipt.
- Adoption, CT-210, in its order: `support.tickets_daily` mapped into each reader's ticket view first, readers re-pin and
  key by project, producers re-vendor the schema and carry the members once every reader has adopted.

## When DEC-0150 and DEC-0151 meet on main

The second of the two to merge rewrites these (DEC-0150's text as of `016a77e8`):

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

On the branch, each exit code read separately: `pnpm exec tsc --noEmit -p .` 0; the full `pnpm vitest run --coverage` not
run on these bytes (the 15-minute load stayed at 46.77, above 45); `pnpm vitest run test/support-quality.test.ts
test/fixtures.test.ts test/positive-sweep.test.ts` 0 (1286 tests); `python3 docs/ux/lint.py` 0;
`pnpm run docs:check` 0; `pnpm privacy:check` with the organization's index 0 (0 findings);
`pnpm exec tsx tools/vectors/run.ts` 0 (28 vector files match; support quality has no vector generator). No U+2014 in
the added lines.

## Next task

Round 2 of the readings of branch `agent/sqd-fields-20261104` (DEC-0151) by two blind readers; fix, re-read until two
rounds are clean; open the pull request, merge after DEC-0150's branch or rebase over it (the list above), mark DEC-0151
accepted, close CT-129, mark CT-210's first step done, release, and answer thread `b6820b97` with the tag.
