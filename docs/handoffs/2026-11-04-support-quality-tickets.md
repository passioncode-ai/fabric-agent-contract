# 2026-11-04: the channel agent standard's ticket counts (CT-210, DEC-0151)

## Objective

Answer the board request `74105ca1` (thread `b6820b97`): give the ticket counts of the channel agent standard's daily
loop (its v1 release candidate, section 5) a home in `support-quality-daily/1`, by the path DEC-0144 took, and let
`notMeasured` name `nobodyDropped.firstReplyP50Ms`, which FAC-SEM-126 asks for and the pattern refused (X-4).

## Done

- DEC-0151 (proposed), [support quality](../specification/support-quality.md#the-ticket-counts-dec-0151): the optional
  `arrived`, `ended`, `notATicket`, `open {handedOpen, questionOpen, awaitingCustomer, awaitingApproval}`, `outcomes
  {handoffsClosedByPerson, referred, answeredElsewhere, noReplyOwed, customerSilent, expiredByDecision, expired,
  unanswered, firstReplyLate, promotions}`, `autonomy.answered`, `stability.fallbackTurns` and `fallbackTickets`; the
  `notMeasured` pattern admits digits in the metric part only.
- `src/support-quality-rules.ts`: FAC-SEM-126's not-measured rule over the new members (one helper now serves the
  families, the top-level counts and `calibration.helped`, with the same messages); no sum rule, since section 5 states
  none (`fixtures/semantic/support-quality-daily-tickets-no-sum.json` pins that).
- The schema's `calibration` description corrected ("an ISO week that starts no later than day"), as CT-188 noted.
- Fixtures: two positive, five negative (with catalogue rows), four semantic; eight tests in
  `test/support-quality.test.ts`, among them DEC-0070's bounds (18 top-level members, 10 in `outcomes`).
- `pnpm validate --schema support-quality-daily --kind support-quality-daily` prints the same for every support-quality
  fixture on origin/main before and after the change (19 files compared).
- conformance.md's producer and reader rows, DOCMAP, CONTEXT, DEC-0095 and DEC-0144 annotated, CT-210 filed.

## Open

- Two clean rounds of blind readings, then merge (the branch is pushed, no pull request yet).
- The citation of the standard's copy, `docs/evidence/specs/2026-11-04-channel-agent-standard-v1-rc.md`, is added by
  DEC-0150 on its own branch; DEC-0151 names it as text, not a link, until both are on main.
- Adoption, CT-210: readers re-pin and read an absent count as unknown; producers carry the counts once every reader
  they know of has adopted.

## Decisions taken here

- New members are optional one by one (a producer from before DEC-0151 carries none of them); `open` and `outcomes`
  are never empty objects, as `checks` and `calibrationChecks` are not.
- The outcome counts sit in one `outcomes` object, not at the top level the standard's table suggests (DEC-0151's
  alternatives).
- The standard's seven channel kinds map onto `/1`'s four channels, no new enum value (DEC-0151 item 5,
  support-quality.md "The standard's channel kinds"); a test holds the table to the schema's enum.
- The standard publishes per project, a `/1` reader keys by service, channel and day: an agent serving two projects
  on one channel would lose one; recorded under "Not decided here", for the coordinator to decide (a `project` member
  or the event's `subject`).
- `promotions` counts the promotions made on the day; whether a promotion also restates the day the ticket ended is
  left to the standard (support-quality.md, "Not decided here").

## Checks actually run

On the branch, each exit code read separately: `pnpm exec tsc --noEmit -p .` 0; `pnpm vitest run --coverage` 0 (108
files, 9784 tests passed, 1 skipped; `src/support-quality-rules.ts` at 100 % of its branches); `python3 docs/ux/lint.py`
0; `pnpm run docs:check` 0; `pnpm privacy:check` with the organization's index 0 (0 findings);
`pnpm exec tsx tools/vectors/run.ts` 0 (28 vector files match; support quality has no vector generator). No U+2014 in
the added lines.

## Next task

Readings of branch `agent/sqd-fields-20261104` (DEC-0151) by two blind readers; fix, re-read until two rounds are
clean; open the pull request, merge after DEC-0150's branch or rebase over it, mark DEC-0151 accepted and CT-210's
first step done, release, and answer thread `b6820b97` with the tag.
