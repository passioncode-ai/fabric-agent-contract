# 2026-11-04: an agent that answers people on a channel (DEC-0150, CT-209)

## Objective

The board request `437c404b` (thread `b6820b97`): an extension key under which an agent that answers people on a
channel (mail, Telegram, store reviews) declares what `channel-agent-standard/1` asks, with the schema in this contract
and the checks the standard's section 11 makes statically, for the Fabric Agent Adapter's service check (its row to be
filed; the coordinator files it on the board).

## Done

- The key `https://fabric.passioncode.ai/agent-contract/extensions/channel-agent/0.1` (`EXTENSION_KEYS.channelAgent`),
  read under a manifest's `provider.extensions` or, for a service with no manifest, a well-known answer's `extensions`.
- [`schemas/service-channel-agent-extension.schema.json`](../../schemas/service-channel-agent-extension.schema.json):
  section 13.6's members, one file with no reference to another.
- [`src/channel-agent.ts`](../../src/channel-agent.ts) (`channelAgentView`, `channelAgentRules`, kinds `manifest` and
  `service-well-known`): `FAC-SEM-162` (misplaced, oversize or invalid), `FAC-SEM-163` (ids once, decisions named),
  `FAC-SEM-164` (a channel's, a queue's and the budgets' obligations), `FAC-SEM-165` (no credential-shaped name or
  value, a token slot read segment by segment). No message carries a declared value; the walk keeps an explicit stack;
  an oversize array or map is refused before the schema runs; at most ten failed keywords are named.
- Vectors [`fixtures/vectors/channel-agent.json`](../../fixtures/vectors/channel-agent.json), each case with its
  `site`, written by [`tools/vectors/channel-agent.ts`](../../tools/vectors/channel-agent.ts) and registered in
  `tools/vectors/run.ts`; positive, negative and semantic fixtures with their catalogue rows;
  [`test/channel-agent.test.ts`](../../test/channel-agent.test.ts).
- The page [channel agent](../specification/channel-agent.md); rows in the specification index, the extension keys
  (interop.md), support-quality.md's pointer, conformance.md (register, reference modules, the channel agent's row),
  DOCMAP, CONTEXT (Channel agent); DEC-0150 (Proposed); CT-209; the standard's copy
  [`docs/evidence/specs/2026-11-04-channel-agent-standard-v1-rc.md`](../evidence/specs/2026-11-04-channel-agent-standard-v1-rc.md)
  (its owner's neutral copy, with the examples that described one product made neutral) and its row in
  `docs/evidence/sources.md`.
- Round 1 of the readings: four unit breaks (the slot exception, values in messages, recursion depth, the schema on huge
  arrays), one product break (section 5.1's payload) and the seam's and product's risks, all fixed.
- Round 2 of the readings: three unit breaks (a text's language in a path, a number that is no index in FAC-SEM-162's
  places, FAC-SEM-165's quadratic walk), the seam break (null members: the contract stays as written, a fixture
  documents the boundary) and the product break (the history below), all fixed; FAC-SEM-165 now names at most 64
  places and a path at most 64 levels deep, the detector reads 4097 code points, a blank text strips `\p{Cf}` and
  `\p{Z}`, a misplaced declaration is read for credentials, and `rawValues` appends in place (CT-194's lines).
- Round 5 of the readings: one unit break (a finding below a member that is not plain placed at an innocent declared
  member) and one product break (DEC-0151, in progress, presented as fact), fixed: a member that is not plain, or past
  64 levels, collapses its place for every member below it; every place writes `*` for an undeclared name, a numeric
  object key and a text's language, in all three rules; the narrow readings apply only at their place and only to a
  value of their own grammar; FAC-SEM-165 reads at most 1 000 000 code points, counting the JWT shape's rereads after
  each `eyJ`; a source's `max_age` is above zero again; `daily_cap`'s meaning, the reading of earlier declarations and
  the shared-channel quality check are stated. `src/secret-shape.ts` keeps only CT-194's `rawValues` lines.
- Round 4 of the readings: two unit breaks (a numeric object key echoed in a place, the width guard on three objects
  only) and two product breaks (the project grammar, the history), fixed: a numeric key of an object is `*`; every
  closed object's width, every array's `maxItems` and every map's `maxProperties` are read from the schema before it
  runs; `project` keeps the registry alias pattern; the suite's and outbox's paths are read by the path-aware detector;
  a blank text also strips default-ignorable code points and U+FFFC; FAC-SEM-162 points to the grammars and to
  `pnpm validate --schema`; service.md, identifiers.md and SCN-002 name the declaration; the branch is one commit.
- Round 3 of the readings: one unit break (Ajv's patterns throwing on strings of several megabytes) and two product
  breaks (a present-tense claim about DEC-0151, in progress, and a withdrawn commit named here), all fixed. Before the schema runs, a
  string or a name over 4096 code points (`maxLength`) and a declaration, project or channel with more members than
  the schema declares (`maxProperties`) are refused, and a schema that still throws is one fixed finding; the walk keeps
  one frame per container and builds a place only for a finding; the suite's and outbox's paths are read segment by
  segment and a recommendation by key shapes only; a plain name counts digits without `-` and `_`; ids, the side, the
  project's slug and the codes refuse a run of 7 digits; a blank text also strips `\p{Cc}` and the fillers; tier labels
  are read like texts; a source's durations may be zero; the time zone takes one-segment IANA names; FAC-SEM-162 names a
  missing member; a bare declaration gets `hint/declaration-only`.

## The branch and its history

The work is on `agent/channel-agent-ext-v3-20261104`, one commit on `origin/main` that holds the whole change after
four rounds of readings; the earlier branches were deleted, and the pull request comes from the v3 branch only.

## Decisions taken in this run beyond the request

- The declaration is reported, never refused with the manifest or the well-known answer: their schemas keep the key
  open, and an invalid value is a finding a reader treats as not declared (as the actions and load keys are).
- The patterns of the usage report's limit id, the board's project id and a capability name are repeated, not
  referenced, so a kit vendors one schema file; a test holds them equal.
- Grammars the standard leaves open: a tier code `^[a-z0-9_]{1,32}$`; a channel id `^[a-z0-9][a-z0-9_-]{0,63}$`; an id
  admits no `@`, slash, space or run of 7 digits; `suite` and `outbox` are paths relative to the agent's repository;
  durations in days, hours, minutes and seconds only, above zero; `days` as days and ranges; `tz` as `UTC` or an IANA
  name; texts 1 to 4096 code points, keyed by BCP 47 tags; `read` a word. `tiers`, `declined_sources` and
  `recorded_decisions` are optional; `handoff_queues` is required and may be empty; `spend_record` optional and
  nullable.
- A final text is owed by a channel that replies, and an em dash or a blank text in a declared text is a finding, from
  section 2.4's send checks.
- FAC-SEM-162 names failed keywords with their places (member names the schema does not declare written `*`), not
  Ajv's schema paths, which are relative to a `$ref`'s target.
- `channel-agent-standard/1` joins the protocol register (`src/protocol-revisions.ts`), since the schema pins it.
- Credential shapes for the slot cases a provider might scan for (an AWS or Slack key) are built at run time in
  `test/channel-agent.test.ts`; the vector file carries only `sk-` shapes of repeated or made-up characters.
- The detector stays shared and by shape: an ordinary hyphenated id that starts with `sk-` and runs 16 more name
  characters is a `FAC-SEM-165` finding; the page says to rename such an id.

## Open

- Section 5.1's daily payload: until DEC-0151 (in progress on CT-210, branch `agent/sqd-fields-20261104`) lands, an
  agent following it emits `support-quality-daily/1` payloads this contract refuses; DEC-0151, in progress, proposes
  how the seven channel kinds map to `/1`'s four.
- What section 11 asks and no declaration can show (DEC-0150 CA-6): the side among the standard's sides, the route's
  capability for the side's kind, a tier's fact among the customer facts, the existence of the named agents,
  capabilities, desk and limit, a working-time limit's calendar, and everything the signal server observes.
- The adoption, owed by the Fabric Agent Adapter, its row to be filed (the coordinator files it on the board): its
  `check_service.py` vendors the schema and the vectors; at its
  re-pin both `PROTOCOL_REVISIONS` twins (`fabric_protocols.py`, `fabric-protocols.mjs`) gain `channel-agent-standard`
  `['1']` and the feed-protocols vectors are vendored again. Then a later decision moves the key to version 1 (CA-7).

## Merging beside the branch of CT-194 and the other open branches

With `origin/agent/ct194-source-manifest-20261103`, whichever lands second:

- sets the schema count in `test/schema-compilation.test.ts` to 148: the count merges silently at 147 and must be set
  by hand;
- puts the register in code order: `FAC-SEM-155`, `156` to `160`, then `162` to `165`;
- reads the next-free markers (DEC and SEM) from the CAS refs at the merge, not from either branch;
- adds the comma at the end of the catalogue's last row before the other branch's rows;
- takes the union of the two `vitest.config.ts` include lines, and keeps `src/channel-agent.ts`, `src/source-rules.ts`
  and `src/validator.ts` at a branch floor of 100;
- on conformance.md's clients table keeps CT-194's text for the actions row and appends this branch's row;
- finds `rawValues` in `src/secret-shape.ts` already the same lines on both branches, and on the merged tree runs
  `pnpm vectors:check` and `test/channel-agent.test.ts` against CT-194's `secret-shape.ts`;
- keeps both branches' rows in `docs/backlog.md` and in `docs/handoffs/README.md`.

The conformance.md sentence "`FAC-SEM-155` to `FAC-SEM-161` are reserved by open branches (CT-194 and PR #235)" merges
silently. Whichever of PR #235 and CT-194 lands before this branch, the lander of this branch rewrites it to name only
the codes still held by an open branch (none once both are on main), and keeps CT-194's own sentence that
`FAC-SEM-161` is unused.

The conflict between CT-194 and DEC-0151 (in progress) in `src/secret-shape.ts`, and the source-rules tests, are those
two branches' to settle; DEC-0150 is not party to them: this branch changes only `rawValues` there, in CT-194's lines.

One line per sibling and per file it shares with this branch:

- DEC-0151 (in progress, branch `agent/sqd-fields-20261104`): `docs/DECISIONS.md`; `docs/DOCMAP.md`, where DEC-0151's support quality
  row comes first and this branch's channel agent row after it; `docs/backlog.md`; `docs/handoffs/README.md`;
  `docs/specification/support-quality.md`; `docs/specification/identifiers.md`, where both add a bullet under "Compared
  as written" for `project:<slug>` and the second lander merges them into one. On the merged tree, run
  `pnpm vectors:check` and `test/channel-agent.test.ts` against the in-progress DEC-0151's final `src/secret-shape.ts` (no `/i`,
  provider prefixes in their canonical case, a strength rule for `sk-`).
- PR #235: `docs/DECISIONS.md`; `docs/backlog.md`; conformance.md's next-free line; conformance.md's register, the
  `FAC-SEM-155` row before `156`.
- PR #236: `docs/backlog.md`.
- `docs/DECISIONS.md` keeps one "Next free ID" line, equal to the CAS counter at the merge, and each DEC body in id
  order after the bodies already on main: `grep -c '^\*\*Next free ID' docs/DECISIONS.md` prints 1. (On main, the
  heading order already holds one exception, DEC-0047 after DEC-0055; a merge adds none.)

## When DEC-0150 and DEC-0151 (in progress) land

DEC-0151 is in progress. The second of the two to land rewrites, in its own change:

- "DEC-0151 (CT-210), in progress" in `docs/specification/support-quality.md` (Not decided here) and in
  `channel-agent.md#compatibility` (the daily quality payload, with the shared-channel quality check), and DEC-0150's
  Compatibility sentence on section 5.1;
- "(the memory capability's pattern; DEC-0151, in progress on CT-210, proposes the same `projectAlias`)" in
  `channel-agent.md` (the declaration) and DEC-0150 CA-2, which becomes a statement that the two patterns are one;
- "DEC-0151 (CT-210, in progress) gives `support-quality-daily` payloads the same alias; once it lands, a reader joins
  a declaration to a project's payloads on `project:<slug>`" in `channel-agent.md` (the declaration), which becomes a
  statement that the reader joins them;
- the note in `channel-agent.md` (What is checked, item 4) and DEC-0150 CA-5 that the shared detector finds an ordinary
  hyphenated name starting with `sk-`: the in-progress DEC-0151 anchors the detector with a boundary before provider prefixes, so the
  note becomes stale; the advice not to start an id with `sk-` stays;
- the two "Compared as written" bullets for `project:<slug>` in `docs/specification/identifiers.md`, merged into one;
- an assertion in `test/channel-agent.test.ts` that the declaration's `project` pattern equals
  `support-quality-daily.schema.json` `$defs/projectAlias` (S3);
- the standard copy's path in the sources ledger, which becomes a link.

## Checks actually run

On the change after round 5's fixes, each exit code read separately, the 15-minute load average below 45 at each test
run: `pnpm exec tsc --noEmit -p .` 0; `pnpm vitest run --coverage` 0 (109 files, 9944 tests passed and 1 skipped,
branches 98.86 %, 11959 of 12096; `src/channel-agent.ts` 248 of 248, `src/secret-shape.ts` 47 of 47);
`python3 docs/ux/lint.py` 0; `pnpm run docs:check` 0 (markdownlint 0 errors); `pnpm privacy:check` with the
organization index 0 (0 findings); `pnpm exec tsx tools/vectors/run.ts` 0 (29 vector files match their generators).

FAC-SEM-165's growth on the thread's processor time, depth 8000 to 32000: 3.87 for a chain of credential-shaped values
and 4.16 for a chain of credential-shaped names (the test asserts below 6). The probe of 488 strings of 4096 characters
of `eyJ` runs in under 500 ms (the test's bound), the budget stopping the reading. Under
`NODE_OPTIONS=--max-old-space-size=256`: a question route with 800 000 members gives `FAC-SEM-162` (`maxProperties at
/projects/0/question_route`) and one `FAC-SEM-165` saying the rest was not read, in 720 ms; 1 000 000 unknown root
members give the same pair in 791 ms; `extra: Array(2_000_000).fill(1)` gives one `FAC-SEM-162` in 159 ms; chains of
depth 20000 finish with 66 findings each; heap at most 202 MB, the inputs included. The organization's privacy check
over the standard's copy alone: 0 findings. A `git grep` of the change for the three terms of the product described
before neutralisation prints nothing. No U+2014 in the added text.

## Next task

Two consecutive clean rounds of the blind readings of branch `agent/channel-agent-ext-v3-20261104` (unit, seam,
product), as DEC-0150's Status asks; fix what blocks, as ordinary commits on that branch. Then open the pull request and merge it, which accepts DEC-0150, and post the merge on
thread `b6820b97` (the coordinator posts it), listing the narrowings versus the standard and each live producer's
`FAC-SEM-162` members:

- durations in days, hours, minutes and seconds only: no weeks, months or years;
- a zero duration only for a source's `cadence`; its `max_age` is above zero;
- the time zone's grammar: an IANA name of one to three segments;
- no run of 7 or more digits in an id, a channel's id, the side, a category code or a tier code (the project's
  `project:<slug>` keeps the registry alias pattern unchanged);
- an owner is an id, so it holds no space; a recommendation is the board's opaque id, so it holds no colon;
  `spend_record` is a lower-case usage-report limit id;
- a missing required member makes the whole declaration invalid, so a reader treats it as not declared, and a `null`
  is refused wherever section 13.6 lists a member;
- the coordinator asks the standard's owner to hold the observed per-project quality check for shared channels until
  DEC-0151 (in progress) lands, since it reads missing there;
- for each live producer, the members its current declaration fails (`FAC-SEM-162`'s places), read with
  `pnpm validate` on its manifest or well-known answer, and one adoption row per live producer, in its own backlog,
  listing those places; the coordinator files them on the board at merge.
