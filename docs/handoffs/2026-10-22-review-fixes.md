# 2026-10-22: the readings of DEC-0098 to DEC-0101 and their corrections (DEC-0102; CT-91 to CT-99)

## Objective

Read the four decisions merged on 2026-10-22 (`bfa9a67..4a29fcb`) blind, as the iteration's plan promised and the
merges skipped, and fix what the readings found before any consumer pins them.

## The readings

Three blind readings, run as background subagents with no edits:

| Tier | Verdict | Breaks | Risks | Other |
|---|---|---|---|---|
| unit | fail | 2 (a repair under a policy without `expiresAt`; `repairDecision` throws on a schema-valid request) | 6 | 12 of 30 plants survived the suite |
| seam | fail | 4 (a repair under a key past its window; repair and `FAC-SEM-068` disagree; the renewal grace judged by the device's clock; SR-5a refuses a withdrawal) | 9 | each reproduced at `4a29fcb` |
| product | fail | 7 (a context the routing rule forbids; contradictory resend duties; the policy key table; the enrollment steps; who controls a cloud VM; the glossary; the board's UX contract) | 8 | no em dash added |

## Second round (on this branch, before merge)

| Tier | Verdict | Breaks | Fixed here |
|---|---|---|---|
| seam | fail | 1: the mode-C narrowing went against the operator's recorded ADR-0011 | withdrawn; the whole harness, the operator's question on other contexts' services is CT-92 |
| product | fail | 8: a check-in's context in devices.md and CONTEXT.md; the key table's user layer; renewal called a rotation; no annotations on DEC-0098 to DEC-0101; a weekly probe DEC-0100 had refused; the org-cloud exception missing in conformance; two em dashes; `already-answered` missing from the table | each fixed; CT-93 filed for an org-cloud machine's usage |
| unit | fail | 1: the baseline's names kept the old shape, so a valid policy left no valid summary | the baseline takes the summary's name shape and per-kind fields; the walk is iterative; tests pin the key window at `at`, its own instants, `already-answered` first, the context as written, an mdm-only allowlist, org-cloud with a declined notice, renewal before the end, a long `noResponder.message` |

## Third round

Product: five breaks (DEC-0102's compatibility and fixture list; the baseline's per-kind fields in the prose; a
`collectionStart` trigger that never fires under device management, dropped; the round counts; this handoff's
checks), fixed. Seam: one break, the resume trigger after `purpose` missed a person acknowledging the notice already in
force; the check-in response now names `acknowledgedNoticeVersion` and the collector resumes when it changes. Three
seam risks: the wording aligned; `harnessBaseline` tests for mdm over server added; `deriveShareRegistrations` has no
role input although the text says an `org-cloud` enrollment derives none (CT-94). Unit: one break, a baseline could
name a coding agent or a service in a shape no summary carries; the schema now narrows those two names. Its test
gaps are closed with fixtures (each name position, each per-kind field, `already-answered` in a result) and a
revision test; a backdated renewal is named as a limit in devices.md.

## Fourth round

Product: four breaks (the pin condition for `acknowledgedNoticeVersion` only in the decision; CT-88 stating the old
resume rule; the renewal's proof clause moved onto rotation; this handoff's counts), fixed; its risks too: an absent
value is no signal, the `org-cloud` derivation points to CT-94, and CT-95 holds the missing UX scenarios. Seam: one break, a buffered event from before the acknowledgement rejected
`purpose` held a kind for good; the receiver now answers `purpose` only for a purpose not collected now, and
`before-purpose` (new) for the buffered event, which holds nothing. Its risks: the member is on every response, the
context-route comment names the summary's exception, FAC-SEM-128 on a check-in stays CT-91, a repair vector is CT-96.

## Fifth round

Product: one break, the answer to a collector pinned before DEC-0102 for that buffered event was stated three ways;
the reason now goes to every collector (a rejection is consumed whatever its reason, DEC-0100), is named
`before-purpose` (GJ-4's `before-start` is a stored state) and covers only an event after `collectionStart`; CT-92
now also asks about harness item names installed for other contexts. Seam: one break, a hold taken with no
`acknowledgedNoticeVersion` held never resumed on the first acknowledgement (a managed machine collects from the
deadline); absence at the rejection is now a held value, and only a value becoming absent is no signal.

## Sixth round

Product: two breaks. CT-92's widening was not carried to node-summary.md, DEC-0102 item 2 and this handoff; it is now,
with what ships meanwhile. `before-purpose` covered a managed machine's deadline window; it now covers an event from
before its purpose was collected (the acknowledgement, or the mdm deadline where the organization collects under it),
and a receiver may keep it. Its risks: `collectionStart` is the first acknowledgement, never moved, in devices.md and
the glossary; a collector consumes every `rejected[]` entry whatever its reason. Seam: one break, an `org-cloud`
machine (no person) had no reason for its buffered event; the notice version's coming into force is its start. Its
risks: CT-97 (a reason for an event from before `collectionStart`), CT-98 (a resume reference with vectors), a late
server's one extra round written down, and the SR-5a message names both triggers and the weekly resend. Unit (fourth, at 531af5ea): one break, an
mcp-server `minVersion` and a service `digest` had no fixture; both added, the positive baseline names all five kinds,
the document kind's duplicate, credential and escaping branches are tested, and `resolvePolicy` (FAC-SEM-042) no
longer takes `harness.baseline` or `repair.packages` from a user layer.

## Seventh round

Product: three breaks (CT-88 kept the withdrawn scope; the start first chosen for a device with no person was defined
nowhere, so it is the mdm deadline and the rest joins CT-97; this section's round count), fixed; its risks too: the
collector row names consuming any reason, item 8's sentence, and the `machine.mode` row points to the whole harness.
Seam: pass at 5ceafc02, five risks: two already fixed by the product's corrections (the no-person start, CT-88), the
precedence list names the two signed-only keys, the other three are CT-99.

## Done

- **DEC-0102**: every break fixed and every decision the risks needed taken (its items 1 to 11); CT-91 filed for the
  check-in's own rule over a summary, CT-92 for the operator, CT-93 for an org-cloud machine's usage, CT-94 for
  derive's role input, CT-95 for the UX scenarios, CT-96 for a repair vector, CT-97 and CT-98.
- A test for each break and each surviving plant: repair boundaries (exactly 7 days, `notifiedAt` at the instant, the
  policy's own expiry instant), the allowlist's digest, a key outside its window, a lasting policy, a user layer, a
  repeat, a lone surrogate, the strict reason; drift per kind and state order; a duplicate plugin; the person
  fixture's path; the renewal on the server's clock; an SR-5a withdrawal vector; fixtures `comms-read-ack-empty`,
  `comms-host-wait-not-retryable` with their plants, `activity-batch-ack-purpose`.
- The UX contract (FLW-16, SCR-19, SCN-025) carries `answered`, the reaction and `noResponder`.

## Open

- CT-91; **CT-92 needs the operator** (other contexts' services and harness item names in a summary); CT-93; CT-94; CT-95; CT-96; CT-97; CT-98; CT-99; the adoption rows CT-81 to
  CT-83 and CT-88.
- CT-84 next in the plan's order (S4, by 2026-10-31), read blind before it merges.

## Checks actually run

`pnpm run check` exit 0: typecheck, 94 test files with 7 965 tests under coverage, UX lint, docs check (0 errors),
markdownlint, privacy check (0 findings). Earlier runs failed on two test-typing errors and the rule register's kind
list for `FAC-SEM-128`; both fixed. Six rounds of blind readings ran on this branch after the first on the merged range (second to seventh; the unit tier
in the second, third, sixth and seventh, seam and product in each); the PR merges after two consecutive clean rounds.

## Next task

CT-84 (thread `ba63565c` items 1 to 3; Fabric's CO-376).
