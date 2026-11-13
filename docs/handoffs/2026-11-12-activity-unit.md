# Handoff 2026-11-12: the unit of work as an activity event (CT-259, DEC-0164)

Branch `agent/ct259-activity-unit-20261112`, from main `d69dc363`. Entry point: [DEC-0164](../DECISIONS.md) and
[activity, `unit`](../specification/activity.md#kinds).

## Done

- `schemas/telemetry-event.schema.json`: `$defs/unit` and the kind (`run.root`, `project.id`, `source` `unit` and a
  `sourceKey` required; no `user`, no `session`; `outcome`, `acceptedBy`, `acceptedAt` and `taskClassMap` by transition
  and class).
- `src/activity-rules.ts`: `unitSourceKey` and `FAC-SEM-171` (receipt SEM-0171) on `telemetry-event` and `activity-batch`.
- `tools/vectors/activity-unit.ts`, `fixtures/vectors/activity-unit.json`, `test/activity-unit.test.ts`.
- Pages: activity (the envelope's kinds, `occurred` for a held unit, `unit` with AE-1 to AE-5, the rule),
  conformance (a writer, a reader and the batch receiver's rows, the code), contexts (routing's fourth way), membership
  (OM-7's units row and the enrollment's own events narrowed), CONTEXT.md, versioning and `src/protocol-revisions.ts`
  (`activity-unit/1`), the specification README, SCN-010 (a read of a unit the member accepted). DEC-0164; CT-259's and
  CT-297's rows; DOCMAP.

## Open

- Tell Project Observatory on thread `52aa2f93` when DEC-0164 lands (it codes `activity.unit.record` after it), with
  what its journal design (PR #511, `docs/design/ACTIVITY-JOURNAL.md`) diverges on: `acceptedAt` is the month key (J3
  files by the event's time); what a kit sends in the envelope when the capability is the collector (J2); a reopened
  unit's acceptance under a new `run.root` without a `started` before it (J2's accepted-twice); and its node's outbox,
  which mints a ULID and must derive a unit's id with `run` and `project`.
- Ask the assessment's owner on the board for the draft writer's mapping (`activity-event/0-draft`, in
  company-assessment-agent and the agents database's template): `urn:jira:KEY` evidence, `unit {system, key}`, no
  `org`, a named `agent`, and which writer holds `run.root` for an acceptance observed outside the run.
- The knowledge base's `knowledge/system/measure.md` still describes the draft (`org`, `accepted_by`, `cost_usd`, one
  record per unit): rewrite it to DEC-0164 in fabric-workspace when this lands (no `org`; `acceptedBy` pairwise;
  `cost` the spend since the previous transition, summed, an attribution never added to usage; `acceptedAt` the month
  key, a reopened unit accepted again counting in both months; the member-list threshold of 3 beside the data room's
  roster as the denominator; G1-e's per-role dashboards as views over the served cells, OQ-0018 asking only about a cell counting units by the members' own role; held transitions dropped by design; a month's number provisional until its count closes, at its end plus the server's `retention.raw_days` plus 60 s, with late gaps stated beside it; keeping the roster and the signed member list from the same members the measure owner's duty), then the
  workspace sync. Check: `git -C fabric-workspace grep -c 'accepted_by\|cost_usd' origin/main -- knowledge/system/measure.md` prints 0 and `git -C fabric-workspace grep -c 'DEC-0164' origin/main -- knowledge/system/measure.md` at least 1.
- Landing notices for Observatory and the assessment also carry: J3 deletes a person acceptance at the organization's `retention.raw_days` and keeps person-free monthly counts and `(unit, month)` keys only as `hmac-sha256` digests of `{key, month, system}` under a key it never exports, dropped once each month's count is closed, the sending device kept beside a raw event going with it (its design keeps every event 400 days); draft-shape records already written (`activity-event/0-draft`) are not counted toward M, or are re-derived to DEC-0164's id before the first monthly number; a jira key carries no `jira:` or `tracker:` prefix (`FAC-SEM-171` refuses one).
- Landing notices, round 8: the organization product's server owes the member count (conformance's new row; it keeps
  no member list yet, so no unit cell is served until it does), a dependency of measure.md's G1-d; Switchboard SB-295
  (shape, key forms, spend as usage lines, no person), Fabric Dashboards FD-170 and the organization product's role
  dashboards (views over served cells only, the OQ-0015 and OQ-0018 defaults); the workspace rewrite also covers
  north-star.md's G1 row (the schema is the contract's, DEC-0164) and templates.md A12 (the event as DEC-0164 defines
  it). Check after the sync: `git -C fabric-workspace grep -c 'DEC-0164' origin/main -- knowledge/north-star.md knowledge/system/templates.md` prints at least 1 for each.
- Landing notices beyond Observatory and the assessment: the PM agent's owner (its digest reads a colleague's person
  acceptance only under a purpose that colleague confirmed, without cost, logged per recipient); Fabric Dashboards
  (FD-165: it writes no unit without `run.root` and the key form, names no organization in the event, and sends spend
  as usage lines, never as unit cost); the adapter (FAA-269's wait re-pointed from OBS-378 to DEC-0164, and its hand-kept `PROTOCOL_REVISIONS` twins, `scripts/fabric-protocols.mjs` and `kit/fabric_protocols.py`, gain `activity-unit` ['1'] at the repin, or its feed-protocols test goes red); the assessment's
  two draft writers map one Jira issue to `{system: jira, key: <issue key>}` (company-assessment-agent writes `jira:`,
  the agents database's template `tracker:`, which would split one issue into two units); and the run of DEC-0157
  (`agent/ct216-usage-data-v2`), whose own handoff does not carry the UD-6 note below, so it is sent to that run on the
  board when this lands first.
- Landing note with DEC-0157 (`agent/ct216-usage-data-v2`): UD-6 describes activity telemetry as sessions sent by an
  enrolled device; whichever lands second restates it by kind and channel as activity's opening now does (check:
  `awk '/\*\*UD-6/,/\*\*UD-7/' docs/specification/usage-data.md | grep -c 'unit'` prints at least 1 on the merged tree).
- Operator questions, registered as OQ-0015 to OQ-0018 in `docs/OPEN_QUESTIONS.md` (stable ids: the register already skips `agent/ct216-usage-data-v2`'s OQ-0013 and OQ-0014) and to post on thread `52aa2f93` with the landing notice: whether a cell drawn
  from one member's work (a one-person project, an agent or task class only one member's work reaches) is served
  inside a larger organization (OQ-0015, default: folded into the total; a unit cell needs an organization whose member
  list names at least 3 members, AE-3), whether a cell may count units by the members' own role (OQ-0018, default: no;
  not G26's per-role dashboards), the
  access-log scope a read of a person acceptance is logged under (default `activity.raw`), (the notice purpose and the retention of a stored person subject are decided by the personal-data rules, not open: the notice's purpose for its agents' activity, `retention.raw_days`); and which audience's pairwise
  subject a kit writes when one unit reaches both the organization's journal and Observatory's local one.
- CT-297: the route function for a unit and its vectors.
- Tell Observatory with the landing notice: a unit's `cost` is the spend since its previous transition, summed by a
  reader (its J4 sums every event, which now matches); a re-acceptance under a new `run.root` needs no `started`, so its J2
  accepted-twice must key a repeated acceptance by unit and `run.root` and allow one with no `started` under the new
  `run.root` (today it refuses a second acceptance of the same unit and stream without a `started` between); a unit cell needs an organization whose member list names at least 3 members (its J4 count), and a unit's key takes one form per system (`github` `<owner>:<repo>#<number>` lower-cased, `jira` the issue key, `mail` a digest of the Message-ID).
- Landing with DEC-0162 and DEC-0166 (both add named protocols): `src/protocol-revisions.ts` keeps every entry and
  every `NAMED_ONLY` item (`activity-unit/1`, `levels/1`, `standing/1`), versioning.md every item, conformance every
  rule row (169 to 174) and the next free code from the CAS counter; `pnpm vitest run test/protocol-revisions.test.ts`
  and `pnpm run docs:check` on the merged tree.

## Checks run

- `pnpm run check` exit 0 on the first cut `79ed9a09` (11192 tests passed, 3 skipped; coverage floors, UX lint, docs check, privacy check) on the round-2 fold (11210 passed, 3 skipped) and on the round-3 fold (11212 passed, 3 skipped).

- Round 1, unit only (on `79ed9a09`): not clean. Breaks folded: the Event id rule kept one event per (`device.id`,
  `eventId`) against AE-2's one id from every writer; a `unit` event is now kept once per `eventId` within the
  organization's stream, and the `sourceKey` row names `unitSourceKey`'s form; DEC-0164's Alternatives name every
  departure from the design. Risks folded: four refused branches, an evidence URL with user information and the
  repeated write pinned in the vectors; the cost's `FAC-SEM-038` citations corrected; `acceptedAt` the month key; the
  kit's envelope (Observatory's capability is the collector); `unitEvent`'s place and the rule row's order.

- Round 2 (on `715bf939`): none clean. Breaks folded: AE-5 restated (an older reader refuses a `unit` with
  `evidence`; a collector sends only to a receiver listing `activity-unit/1`, a new named protocol), pinned by a test
  against the unknown-kind branch; a unit's route (contexts' fourth way, CT-297 for the function); the OTLP intake and
  the Batch acknowledgement keep a unit once per `eventId` within the organization; the kit's binding cited to
  Observatory's own answer, not DEC-0153; activity telemetry restated by kind and channel (activity's opening,
  CONTEXT.md, the spec index; DEC-0157 UD-6 by a landing note); DEC-0164's credential sentence; the CT-259 row and the
  rule register's next code; activity's header, `source` values and tests line. Risks folded: a leap second reads as
  :59 in the `acceptedAt` bound, and the 60 s boundary pinned; the schema's `source` const named in the rule; the
  home-path clause on evidence; the reader's month count in activity; unit fixtures in the catalogue; DOCMAP; the
  journal, node, draft writer, measure.md and operator questions in Open. Declined: refusing `@` in evidence (a URN
  may hold one; the writer's duty stands, as for any reference).

- Round 3 (on `a5edcd68`): unit clean. Seam and product, breaks folded: units are served only in cells of at least 3,
  as `result` (AE-3, the reader row); a collector holds a unit's transitions outside its stream until the receiver
  lists `activity-unit/1`, so nothing stalls; an OM-7 row for units; the batch receiver's row (one per `eventId`, no
  user, list `activity-unit/1`); Observatory's answers cited by their own threads; the OTLP intake names
  `FAC-SEM-171`, refused as `schema`; `cost` is per transition, summed (the vectors 0.12, 0.30, 0, 0, a test sums
  0.42). Risks folded: Observatory's older server refusing by purpose named in AE-5; a re-acceptance needs no
  `started`; CT-297 names the Project-to-organization source, the two-organization case and the id form; the evidence
  row names a repository named `home` (no vector: the privacy check refuses a home path in a fixture); the reader row's 64 characters; the kits' register; the merge
  markers; DOCMAP "proposed"; the canonical-forms row for `unitSourceKey`; activity's routing paragraph (four routes);
  the CT-259 row; a leap second on `occurred` read as its last millisecond, with a vector; the distinct-id assertion.
  Declined: none; the access-log scope and the metric's late acceptances stay operator questions in Open.

- Round 4 (on `68df1910`): unit passed with three risks, seam passed with six risks, product failed. Product, breaks
  folded: a unit's `occurred` is when its writer recorded the transition and holding never restamps it (the envelope
  row, the `acceptedAt` row, the decision); the batch receiver's unit sentence moved into the Requirement column; OM-7's
  enrollment row narrowed to events with no route of their own; a unit cell's 3 counts distinct roster members of its
  projects, the one-person project's case an operator question (AE-3, Why); a read of a person acceptance is logged in
  that person's access log, with SCN-010's fourth entry. Product risks folded: a held transition lives no longer than
  `retention.raw_days` and is dropped on 410; purpose and retention by the personal-data rules, the purpose an operator
  question; a unit's cost is an attribution never added to usage totals (page and schema); Consequences and Done
  completed, AE-2a cited by its page; the Next free ID line; the repeated-write test renamed to the shared-id case
  and a repeated-write test added. Seam risks folded: the cell's measure; a stream holds one event per `eventId` (a
  batch test pins FAC-SEM-039); cost twice; purpose; `occurred`; the draft writers stay in Open. Unit risks folded: the
  schema's cost description; the event carries no envelope `task` (schema, a vector); `unit.key` as the tracker's API
  returns it. Declined: none.

- Landing against main: the branch is based on `d69dc363`, and main rewrote the CT-295 and CT-296 backlog rows, so a
  line union keeps both versions and the gate does not catch it. Take main's CT-295 and CT-296 rows, add CT-297, keep
  DEC-0163 before DEC-0164 and refresh the index row, keeping both handoff index rows; check: `for id in CT-295 CT-296 CT-297; do grep -c "^| $id "
  docs/backlog.md; done` prints 1 1 1, `for d in DEC-0163 DEC-0164; do grep -c "^### $d:" docs/DECISIONS.md; done` prints 1 1 (round 14, seam), then `pnpm run check` exit 0 on the merged head.
- Round 5 (on `617e7104`): unit passed with two risks, seam failed, product failed. Product, breaks folded: the
  access log covers a unit the member accepted, found by the pairwise subject resolved to the `user.id` (activity's
  Access log, CONTEXT.md, the access-log schema, FLW-06's success exit and task analysis, SCR-09, SCN-010 steps 1 and
  5); a unit whose `acceptedBy` is a person is personal data whatever channel wrote it, and the monthly counts that
  outlive retention carry no person. Seam, break folded: one key form per system (`github` lower-cased
  `<owner>:<repo>#<number>`, `jira` the issue key, `mail` a 40-digit digest of the Message-ID, any other its own id
  or a digest), with a mail vector. Product and seam risks folded: a unit cell counts the organization's signed
  member list (as Observatory's J4), the organization's total served, no role or person cut, not an
  `activity-summary/1` cell; another member's read needs the acceptor's confirmed purpose and serves no cost (SCN-010
  step 5, `FAC-SEM-067`); a dropped held transition is an accepted, unreported loss, and the journal keeps a
  person-free `(unit, month)` key; the decision's departures list completed; the J2 accepted-twice line in Open made
  consistent; the landing step against main with its uniqueness check. Unit risks folded: the `acceptedAt` bound is
  measured to the millisecond; the repeated-write test puts the two copies in one batch (`FAC-SEM-039`). Declined:
  rebasing on main now (the branch is pushed and is never force-pushed; the lander merges main as the step above says).

- Round 6 (on `a7e12111`): unit failed, seam failed, product failed, on the same key-form break. Breaks folded: the
  page cites `taskRef.key`'s pattern (an underscore included) and a form that does not fit it, a github key over 64
  characters included, takes the 40-digit digest (two vectors); the reader's conformance row restated from the page;
  the personal-data section and `retention.raw_days` name a unit with a person acceptance on any channel, the server
  layer governing a unit no device wrote, and the person-free counts that outlive retention; the role cut is OQ-0018
  (default none) in the page and AE-3, with G1-e in the measure.md note; the person acceptance's subject is one phrase
  everywhere (OQ-0017's audience, any audience resolved), SCN-010 and FLW-06 in the plural. Risks folded: `FAC-SEM-171`
  refuses a github key outside lower-case `<owner>:<repo>#<number>` or its digest, and a mail key not a digest (two
  vectors); the OTLP export gives a unit's cost its own attribute and does not export a person acceptance; the PM
  agent's digest is logged per recipient, so `FAC-SEM-067` holds; the member count is the organization server's,
  DEC-0129 cited, the list in force on the period's last day; OQ-0015 to OQ-0018 registered; landing notices for the
  PM agent's owner, FD-165, FAA-269, the jira/tracker split and DEC-0157's run. Declined: none.

- Round 7 (on `cae628c6`): unit failed, seam failed, product failed. Breaks folded: a github owner may hold `_` (a
  managed user's), with a vector; the OTLP intake maps a unit's `acceptedBy` and the "not exported" row is for other
  backends; OQ-0018 asks only about a cell counting units by the members' role, G26's per-role dashboards being views
  over the served cells (OQ register, page, AE-3, Why, measure.md note); the personal-data bullet and the reader row
  name the `(unit, month)` keys; the rule row, AE-2 and the writer row name the key forms. Risks folded: a github
  number has no leading zero and a jira key no prefix (`FAC-SEM-171`, three vectors), the digest only for a form that
  does not fit; OQ-0015 widened to any cell drawn from one member's work, its default now folding into the total; the
  member count the organization server gives the journal (OX-6) beside the metric's roster; a project with no
  membership records no person acceptance; the purpose and retention question marked decided; landing notices for
  J3's retention, draft-shape records and the jira prefix; the renumbering clause dropped; Consequences completed;
  SCN-010's preconditions. Declined: none.

- Round 14 (on `5a0a9be4`): unit, seam and product clean (the first clean round). Risks folded for round 15: a month's count closes at its end plus the server's `retention.raw_days` plus 60 s (page, AE-3, devices row); the server's value bounds a held transition; the counted acceptance's `acceptedAt` kept beside its digest, the latest one counting; the UTC month; the counts outlive the close, the digests do not; an evidence link may name a tracker account; the roster's alignment the measure owner's duty; measure.md's provisional months; DEC-0163 and DEC-0164 once each at landing.
- Round 13 (on `1e9b7067`): unit clean, seam and product failed on the month close. Folded: an acceptance for a month whose count is closed is a person-free late gap of that month, never added to it; each digest keeps the person-free cell it was counted in, so a later acceptance moves the unit; the journal's HMAC key outlives the open month; the writer row and AE-3 carry the `retention.raw_days` bound on held transitions; the re-enrollment drop reads 'a binding to a different person, or from a person to none' and links devices' attribution; CONTEXT's activity entry and the telemetry-event schema's description name units and tracker accounts. Owed at landing besides those listed: Observatory's journal counts a reopened unit in each month of an acceptance (its design counts only the last month), and states late gaps. Risks kept: a stream event in an offline device's buffer can still reach a closed month (counted as a late gap); a unit refused for the device's own person holds as any kind, under the same bound; the round-11 and round-12 risks.
- Round 12 (on `bd0b18d5`): unit clean, seam and product failed. Folded: the retained `(unit, month)` key is an `hmac-sha256` digest under a key the journal never exports, the month `YYYY-MM` in UTC, dropped once its month's count is closed (activity.md, devices.md, the reader row, AE-3); activity.md's opening says a unit's tracker key may name a tracker account, read raw only as the unit section says; a collector drops held transitions when its device is enrolled again to another person or to none (activity.md, the writer row, AE-3); DEC-0100's Status names DEC-0164's narrowing; the Observatory notice keeps keyed digests. Owed at landing besides those listed: the organization product's receiver reads a held unit's late `occurred` (its day-fold duplicate rule would swallow late units), answers `purpose` by the acceptor and keeps the sending device; Observatory's node does not hold units on a person acceptance's `purpose` answer. Risks kept: before-purpose's time for a person acceptance; the round-11 risks.
- Round 11 (on `05db85f3`): unit clean (risks folded: the code comment names any form that does not fit, the jira-digest vector renamed), seam and product failed. Folded: the batch receiver's row answers `purpose` for a person acceptance by the accepting member's purpose and keeps the sending device for the person bound to the event's epoch (conformance 141; AE-3 now states the narrowed carve-out, the device logging and the retention); past raw retention the `(unit, month)` key is kept only as a digest of `{key, month, system}`, since a GitHub owner can be a user account (activity.md, devices.md, the reader row), the sending device going with the raw event. Landing notices owed beyond those listed: the organization product's receiver (the acceptor's purpose, the sending device) and Observatory's node (`org.py` holds by kind: a person acceptance's `purpose` answer must not hold units). Risks kept: the device person's own purpose for a read of a unit their device sent is implied by FAC-SEM-067, not restated in the reader row; a writer has no documented route from a tracker user to a member's pairwise subject; unit cells at 3 members against the North Star's cells of five (the operator's); folder-attribution's moving counts omit unit cells; SCN-010's device-sent read has no producing step; OQ-0017's premise; stale descriptions in telemetry-event and access-log schemas.
- Round 10 (on `f7bf2441`): unit clean (three risks: a garbled code comment, fixed; the valid jira-digest vector; the vector built by mutation), seam and product failed. Folded: the `purpose` carve-out narrowed to a `unit` whose `acceptedBy` is a person (a unit refused for the device's own person holds as any kind), in activity.md, conformance's node row and `activity-batch-ack.schema.json`'s description, which DEC-0164's Consequences now list; the batch receiver's row keeps a unit's sending device beside the event for the access log; FAC-SEM-171's row says lower-case. Risks kept: one device's person logged when two devices send one unit (the copy is not kept); `run.root` shared across writers; mail Message-ID folding; `sourceKey` hex case stated only by its pattern; DEC-0100 and DEC-0102 not annotated; the round-9 risks.
- Round 9 (on `df3fdf1c`): unit clean, seam clean (three risks: the adapter's `PROTOCOL_REVISIONS` twins, now in the adapter notice; FAC-SEM-171's inputs only in the vectors file, named by the conformance rows; GitHub's `/users/<name>/projects` evidence URL refused as a home path, a writer surprise), product failed. Folded: a `purpose` answer to a `unit` is consumed and holds nothing at the collector (activity.md batch and acknowledgement, the unit section, conformance's node row), since the refused person is the acceptor, not the device's; a raw read of a unit a person's device sent is logged in that person's access log, the receiver keeping the sending device beside the event (access log, the unit section, the reader row, SCN-010, FLW-06); the digest fallback is the first 40 lower-case hex digits of the SHA-256 of the UTF-8 bytes (AE-2, the unit row, FAC-SEM-171's message, the schema), with a vector refusing an upper-case mail digest. Kept as risks: a cell from two members (OQ-0015 covers one; the operator's), the valid jira-digest vector, fabric-workspace `measure.md` still in the draft shape until landing, the notice's purpose id, the two member counts.
- Round 8 (on `ecf8bff1`): unit passed with three risks, product failed, seam cut off by the session limit (resume it
  or rerun it in round 9). Product, break folded: counts and single records separated (the 3-member gate for counts; a
  single unit read raw only by a member under `activity.raw`, a person acceptance under its member's confirmed purpose,
  without cost, logged), in the page, AE-3 and the reader row. Product risks folded: the organization server's
  member-count duty as a conformance row, with the landing notice; a cell drawn from one member's work known only by
  registered project members or the agent's registration; OQ-0018 names the role source and the product's cell of five;
  a person acceptance by a member whose notice lacks the purpose is not kept (`purpose`); a person's acceptance in a
  project with no membership is not recorded; landing notices for SB-295, FD-170, the role dashboards, north-star G1
  and templates A12; the em dashes on the lines this change rewrote. Unit risks folded: the key finding names each system's
  form; three jira vectors (lower case, a leading zero, a digest); the schema's key description matches the unit row.

## Next task

Round 14 of the blind readings (unit, seam, product) of branch `agent/ct259-activity-unit-20261112` (DEC-0164), once
the subagent session limit resets (03:20 Europe/Warsaw).
