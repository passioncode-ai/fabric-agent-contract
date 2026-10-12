# Handoff — the board's tool shapes and the project directory (DEC-0073)

## Objective

Fabric's project board (DEC-0022) names the tools a board serves, but argument or answer schemas existed only for
`com.submit`, the `com.list` page, a message, `com.status`, the fence, `com.complete` and the refusal. Fabric adds no
field the contract lacks, so it could not serve the reply, cancel and responder tools until the contract defined
them. An enrolled session also could not address another Project, because nothing listed the estate's Projects.
This run defines every tool's arguments and answer, one receipt, and a project directory.

## Done

- **DEC-0073**, reserved by git CAS (`agent_sync.py reserve --key board-tool-shapes-20261012 DEC`; counter commit
  `9944dc8` on `refs/agent-sync/ids/DEC`, `next: 74`). No semantic rule code was added, and none was reserved.
- **Schemas (15 new, 1 amended), all closed:** `comms-list`, `comms-message-ref`, `comms-status-args`, `comms-reply`
  (`oneOf` participant or responder), `comms-cancel`, `comms-enroll`, `comms-claim`, `comms-fenced`, `comms-progress`,
  `comms-effect-begin`, `comms-reconcile`, `comms-responder-replace`, `comms-receipt` (no `seq`, C3),
  `comms-directory-args` and `comms-directory`. `comms-status` gains an optional `idempotency: {epoch}`.
- **Spec:** [project communication](../specification/project-comms.md): the amendment line,
  [tools, arguments and answers](../specification/project-comms.md#tools-arguments-and-answers) (the per-tool table,
  receipts, slots that end with the session, `com.status` arguments), the
  [project directory](../specification/project-comms.md#project-directory) and its boundary, the participant group
  with `com.directory` (17 tools), and the limits.
- **Fixtures:** 21 positive and 31 negative `comms-*` fixtures, with catalogue entries. Every new schema is in
  `NOT_SWEPT` in `test/positive-sweep.test.ts`, because no rule reads one of their documents whole. The schema count
  in `test/schema-compilation.test.ts` goes from 81 to 96.
- **Test:** `test/comms-tools.test.ts`. It checks that the spec table names 17 tools, the same set as the
  capability groups, each with existing schemas. It checks that every argument schema is closed, that every tool
  mutation but a read mark (twelve tools) requires an idempotency key or a fence, and that every mutation answers the
  one receipt.
  It checks that the directory carries only ids, names, capabilities and responder state, and that the boundary is
  stated (readers, owners, discovery-only unlisting, page order, restore epoch). Each of the 32 planted refusals is a
  mutant that its named negative fixture must kill, the nested closures of the receipt and the directory included.
- `test/capability-names.test.ts`: the seven new places that name a capability use the shared definition.
- `CONTEXT.md` (**Project directory**, **Board receipt**), `docs/DOCMAP.md` (the project-communication row).
- `docs/ux/`: SCN-027 (the operator unlists a Project) with ST-022, JRN-08 stage 4, FLW-18 and SCR-21; SCN-025 gains
  the alternative path in which the responder's session ends after it accepted, and its coverage names the new schemas
  and `test/comms-tools.test.ts`.
- The gate (not part of the decision): `src/docs-check.ts` no longer resolves a link inside a fenced code block,
  because Markdown renders it as text. The register text below holds links relative to the files it goes into, and
  the check had reported them as broken links of this handoff. A fence never closed is a finding (and the text after
  it is still read), a backtick line whose info string holds a backtick opens no fence (CommonMark 0.31.2 §4.5), and a
  malformed percent escape in a link is a finding instead of an uncaught `URIError`. Tested in
  `test/docs-check.test.ts`, and noted in `README.md`.

## Decisions taken here (for the owner's reading)

1. **`com.directory` is a tool of its own, not a `com.status` member.** `com.status` describes one Project and is read
   by viewer principals (a host showing communication health, COM-11) that must not see the estate's Project list.
   The directory is estate-wide, paged and read by senders. DEC-0022's tool list grows from 16 to 17.
2. **The directory boundary.** Only a managed or an enrolled session of a Project of the same estate may read it, a
   T0 or T1 session of the estate's owner (DL-25). An `asserted` principal, a viewer principal, a share-grant
   principal (T2) and other estates are refused `not_authorized`. Within an organization it never lists another
   owner's Project or shows another member's responder state. The answer holds no content, participant, count,
   generation, lease or holder; responder state is the only activity signal. The caller's own Project is not listed.
   The operator can unlist a Project in the host (in Fabric, per Project), and no tool does it. An unlisted Project
   stays addressable by id.
3. **Where the decision departs from Fabric's proposal** (Fabric's COM-02.3/03 spec §1.2):
   - `com.status` with a `project` other than the session's own is `not_authorized`, the same answer as for an unknown
     Project. It is not silently ignored.
   - (Not a departure; how the proposal is kept.) `com.progress` stays naturally idempotent, as proposed, and stores
     no receipt. A `note` is posted as a message at most once per attempt and key: the note's own message is the record a repeat finds (`repeated: true`), so a
     retry never posts it twice, and a different note under the same attempt and key is `idempotency_conflict`.
   - `com.claim` with nothing claimable stores no receipt, so the same key may poll again.
   - `com.read_ack` takes no idempotency key and stores no receipt, because marking read twice is one mark. A second
     mark answers `repeated: true` with the first mark's `at`, as a repeated progress note answers its message.
4. **Session release names existing operations.** A release moves no request: a released `claimed` request is taken
   by the next `com.claim` as a lapsed claim (`claim`), an `accepted` one is held, and an `in_progress` one goes to
   `outcome_unknown` by `lost_result` when the next holder takes the slot. `COMMS_TRANSITIONS` is unchanged.
5. **`com.reply` is the reply path.** A `com.submit` of kind `reply` stays for DEC-0022 clients and must post to
   `replyTo`'s own thread.
6. **Unlisting is discovery only**, is not a hidden Project for refusal messages, and survives a restore. Fabric omits
   `idempotency` from `com.status` for viewer principals, which submit nothing, so Fabric Dashboards needs no repin
   for it.

## Checks run

- Plants, in memory: the 32 mutants in `test/comms-tools.test.ts`, each killed by its named negative fixture, and
  an identity run in which no schema accepts its own negatives.
- Plants, on disk: the same 32 constraints were removed one at a time from the schema files (24 in the first round,
  8 in the review round).
  `vitest run test/fixtures.test.ts -t "'<fixture>' has expected validity"` went red (`1 failed | 575 skipped`,
  exit 1) for each and green again (`1 passed`, exit 0) once the file was restored. Vitest shortens the title of
  `comms-responder-replace-duplicate-transfer`, so that run filtered on its first 37 characters. The pull request
  body lists the plants.
- `src/docs-check.ts` changes: the old `checkLinks` (at `46a775d`) gave no finding for the unclosed fence and hid the
  broken link after it, hid the link on the ```` ```code``` ```` line, and threw `URIError: URI malformed` on
  `docs/100%.md`; the new cases in `test/docs-check.test.ts` pass against the new code.
- `pnpm run check` with `ORG_INDEX` set to an org-index checkout. Exit 0; the summary is in the pull request.

## Merging with `main`

`main` moved on after this branch was cut. It gained DEC-0072, DEC-0074, DEC-0075, four schemas and the board run's closing handoffs. The
`agent-sync` guard refuses a merge commit here, because a merge stages `main`'s own changes to
`docs/DECISIONS.md`, `docs/specification/conformance.md` and `docs/backlog.md`, and the owner holds those leases.
So the branch is not merged with `main`, and the pull request shows two textual conflicts for the owner to resolve:

- `test/schema-compilation.test.ts`: the count becomes **100** (`main`'s 85 plus this branch's 15; the review round
  added no schema).
- `docs/handoffs/README.md`: the owner keeps only this branch's DEC-0073 row from this side.

A trial merge with those two resolutions passed `pnpm run check` (exit 0) in a scratch worktree before the pull
request was opened, and again in the review round: `60b121d` merged with `origin/main` `4781999`, 63 test files and
3380 tests passed, UX lint, docs, Markdown lint and privacy clean.

## Open

- The owner applies the register text below under the owner's leases: DEC-0073, an annotation line on DEC-0022,
  three conformance rows and CT-41 to CT-43. This run edited none of `docs/DECISIONS.md`,
  `docs/specification/conformance.md` or `docs/backlog.md`.
- **Next task:** Fabric COM-02.3/03 Task 1. Repin the contract to this pull request's merge commit, add the new
  schemas to `COMMS_SURFACES` and their fixtures to the consumer test, and serve the tools whose schemas are now
  pinned.

---

## Register text to insert

### 1. `docs/DECISIONS.md`: insert between DEC-0072 and DEC-0074 (immediately before the line `### DEC-0074 — A required MCP role names the secret slots that configure it`)

```markdown
### DEC-0073 — The board's tools: every argument and answer a closed schema, one receipt without a sequence number, slots that end with the session, and a project directory (`fabric-project-comms/0.1`, amended)

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: Fabric serves the tools
  against these schemas after repinning (COM-02.3/COM-03); the adapter's kits read receipts and the directory
  (FAA-12a/b). Board rows CT-41 to CT-43.
- **Amends:** DEC-0022 (adds the shapes its tools lacked and one tool, `com.directory`; changes no existing field).
  Implements Fabric's COM-02.3/03 Task 0 and the rollout design's project-directory finding.
- **Decision:** in [project communication](specification/project-comms.md#tools-arguments-and-answers) —
  1. **Arguments.** Every tool's arguments are a closed schema: `comms-list`, `comms-message-ref` (`com.get`,
     `com.read_ack`), `comms-status-args`, `comms-reply` (exactly one of a participant's `{idempotency, replyTo}` or
     a responder's `{fence}`), `comms-cancel`, `comms-enroll`, `comms-claim`, `comms-fenced` (`com.accept`,
     `com.renew`), `comms-progress`, `comms-effect-begin`, `comms-reconcile` (`observed` is `true`),
     `comms-responder-replace`, `comms-directory-args`. No argument carries the estate, the caller's Project, a
     principal, a session or a slot's Project.
  2. **One receipt.** Every successful mutation answers `comms-receipt` `{ok, repeated, message?, thread?, at?,
     request?, slot?, attempt?}`. It never carries an estate-wide sequence number (C3), and it and its `request`,
     `slot` and `attempt` are closed: a reader refuses an unknown member.
  3. **Which calls store a receipt.**
     - `com.claim` with nothing claimable answers `{ok: true, repeated: false}` and stores nothing, so the same key
       may poll again.
     - `com.renew` and `com.progress` are naturally idempotent: the key's shape and epoch are checked and no receipt
       is stored. A progress note is posted at most once per attempt and key, and a repeat answers that message with
       `repeated: true`.
     - `com.read_ack` takes no idempotency key and stores no receipt, because marking read twice is one mark. The
       first mark answers `repeated: false` and its time as `at`; a second mark of the same message by the same
       reader changes nothing and answers `repeated: true` with the first mark's `at`.
  4. **Idempotency epochs.** An epoch is open, closed or retired. A closed epoch takes no new key
     (`idempotency_window_expired`) and still answers a repeat of a stored key and digest; a retired epoch is a closed
     one whose receipts were compacted, and refuses every key (C6). `com.status` may report the open epoch as
     `idempotency.epoch`.
  5. **Slots end with the session.** Leaving or ending the session releases its slots and live attempts; there is
     no release tool. A release is not a lifecycle operation and moves no request: a released `claimed` request is
     taken by the next `com.claim` as a lapsed claim (op `claim`, `claimed` → `claimed` with a new attempt), an
     `accepted` one is held (C4), and an `in_progress` one becomes `outcome_unknown` by op `lost_result` when the next
     holder takes the slot. `COMMS_TRANSITIONS` is unchanged.
  6. **Replies.** `com.reply` is the reply path and takes its thread from `replyTo`. A `com.submit` of kind `reply`
     stays for DEC-0022 clients; its `thread` must be `replyTo`'s own, or it is refused `invalid_arguments`.
  7. **`com.status` arguments.** A Project session omits `project` or names its own. Another Project is
     `not_authorized`, the same answer as for an unknown one, so the answer does not reveal which ids exist. A viewer
     principal names the Project it was granted.
  8. **Project directory.** `com.directory` (`comms-directory`) lists the caller's estate's addressable Projects:
     id, name, listed capabilities and each one's responder state, nothing else.
     - Readers: a managed or an enrolled session of a Project of the same estate, that is a T0 or T1 session of the
       estate's owner (DL-25). An asserted principal, a viewer principal, a share-grant principal (T2) and every
       other estate are refused `not_authorized`. The caller's own Project is never listed.
     - Within an organization the directory never lists another owner's Project and never shows another member's
       responder state (DEC-0047's presence rule; OD-1, the organization edition's rule 10).
     - A page holds at most 100 Projects in order of name, then id. Its cursor is bound to the reader, its grant
       revision, the filter and the restore epoch; a change of any of them is `cursor_reset_required`.
     - The operator may unlist a Project in the host; no tool does. Unlisting is discovery only: the Project leaves
       every page and capability filter, a sender that knows its id still reaches it, and unlisting refuses no
       message. An unlisted Project is not a hidden Project for refusal messages, and an unlisting survives a
       restore.
     - It is a tool of its own, not a `com.status` member, because viewer principals read `com.status` and must not
       see the estate's Project list. The tools number seventeen.
- **Why:** Fabric adds no field the contract lacks (its ADR-0117 §2), so it could not serve reply, cancel or any
  responder tool, and its submit receipt passed the estate sequence through, against C3. An enrolled session could
  not learn another Project's id, so no cross-project request could be addressed.
- **Compatibility:** Additive for the contract: fifteen new schemas and one optional `com.status` member;
  `contractVersion` stays `0.1.0`. One answer changes shape for a board already serving it, and the rollout runs in
  this order:
  1. Fabric's submit receipt today carries `seq`, and its `request` is a string or null (Fabric's migration 081). At
     this pin Fabric drops `seq` from the submit and read-ack receipts, sends `request` as the object, and
     translates every stored idempotency receipt it replays to the new shape, so a repeat never answers the old one
     (CT-41).
  2. The adapter's kits repin only after Fabric's receipts drop `seq`, because a kit at this pin refuses a receipt
     that carries it (CT-42).
  3. `comms-status` is closed. `idempotency` is the epoch the caller's Project submits under, and a viewer submits
     nothing, so Fabric omits it for viewer principals: Fabric Dashboards, a `com.status` reader, needs no repin for
     it. Fabric sends it to a Project session only once that session's kit is pinned at or after this decision.
- **Consequences / affects:**
  - spec: `docs/specification/project-comms.md`;
  - schemas: `schemas/comms-list.schema.json`, `schemas/comms-message-ref.schema.json`,
    `schemas/comms-status-args.schema.json`, `schemas/comms-reply.schema.json`, `schemas/comms-cancel.schema.json`,
    `schemas/comms-enroll.schema.json`, `schemas/comms-claim.schema.json`, `schemas/comms-fenced.schema.json`,
    `schemas/comms-progress.schema.json`, `schemas/comms-effect-begin.schema.json`,
    `schemas/comms-reconcile.schema.json`, `schemas/comms-responder-replace.schema.json`,
    `schemas/comms-receipt.schema.json`, `schemas/comms-directory-args.schema.json`,
    `schemas/comms-directory.schema.json` (new); `schemas/comms-status.schema.json` (`idempotency`);
  - fixtures: `fixtures/positive/comms-*`, `fixtures/negative/comms-*`, `fixtures/catalogue.json`;
  - tests: `test/comms-tools.test.ts` (new), `test/positive-sweep.test.ts`, `test/schema-compilation.test.ts`,
    `test/capability-names.test.ts`;
  - docs: `CONTEXT.md`, `docs/DOCMAP.md`, `docs/ux/scenarios.md` (SCN-025, SCN-027), `docs/ux/foundation.md`,
    `docs/ux/flows.md`, `docs/ux/screens.md`, `docs/handoffs/2026-10-12-comms-tools-registers.md`.
- **Not decided here:** a semantic rule that a directory lists a Project once and a capability once per Project
  (`uniqueItems` compares whole objects; CT-43); Fabric driving a service's capability as the responder
  (Fabric's C7 follow-on); the `project-history` grant's shape.
- **Source:** Fabric's COM-02.3/03 specification §0 findings 1–2, §1.1–§1.3, §2.1 (Fabric `origin/main` `bb0e6870`);
  the rollout design for every agent on the board, finding 2 and its contract deliverables; DEC-0022, OQ-0008. The
  directory's boundary (same estate only; names, ids, capabilities and responder state, never content, participants
  or activity counts; an operator opt-out that leaves a Project addressable by id) is the operator's, approved on
  2026-10-12 as the communication program's decision D6.
  DEC-0073 was reserved by git CAS (`--key board-tool-shapes-20261012 DEC`); no SEM code; the record plane is `fs`.
```

### 2. `docs/DECISIONS.md`: an annotation on DEC-0022, inside its section, immediately after its line `- **Annotated (2026-10-12):** adoption measured (DEC-0065, …` and before its `- **Decision:**` line

```markdown
- **Annotated (2026-10-12):** the tool list amended by DEC-0073 (`com.directory`, seventeen tools; every tool's arguments and answer a closed schema, one receipt).
```

### 3. `docs/specification/conformance.md` — rows in **Clients and readers**, appended to the table (before the paragraph "A client that fails `FAC-SEM-036`…")

No semantic rule code is added, so **Semantic rule codes** and its "Next free rule code" line do not change.

```markdown
| a board serving `fabric-project-comms/0.1` (Fabric) | validates every tool's arguments against the schema the tool table names before anything is stored, refusing an unknown member `invalid_arguments`; takes the estate, the caller's Project, the principal and the session from the endpoint; releases a session's slots and live attempts when it leaves or ends, moving no request by the release itself | schemas `comms-*` (DEC-0073) | the host's own test; `test/comms-tools.test.ts`, fixtures `comms-*-forged-*` ([project comms](project-comms.md#tools-arguments-and-answers)) |
| a reader of a board receipt (Fabric's board service, the adapter's kits) | passes a receipt on only when it is valid against `comms-receipt.schema.json`; a receipt, or its `request`, `slot` or `attempt`, with an unknown member, a sequence number first, is the board's fault and is never shown | `comms-receipt.schema.json` (DEC-0073, C3) | `test/comms-tools.test.ts`, fixtures `comms-receipt*` ([project comms](project-comms.md#receipts)) |
| a board answering `com.directory` (Fabric) | answers only a managed or an enrolled session of a Project of its own estate (T0 or T1 of the estate's owner, DL-25); refuses an asserted, a viewer or a share-grant (T2) principal and every other estate `not_authorized`; never lists another estate's Project, another owner's Project within an organization, an unlisted Project or the caller's own; never shows another member's responder state; adds no member beyond `comms-directory.schema.json` | `comms-directory.schema.json` (DEC-0073) | the host's own test; `test/comms-tools.test.ts`, fixtures `comms-directory*` ([project comms](project-comms.md#project-directory)) |
```

### 4. `docs/backlog.md` — rows inserted after CT-40 and before CT-44 (at `origin/main` `4781999` CT-44 to CT-49 are taken; CT-41 to CT-43 are reserved for these rows)

```markdown
| CT-41 | Fabric adopts DEC-0073: repins to its merge commit; serves the seventeen `com.*` tools against the tool table's schemas (`unsupported_capability` for any whose schema is not pinned); drops `seq` from the submit and read-ack receipts (C3), sends the submit receipt's `request` as the object instead of a string or null, translates every stored idempotency receipt it replays to the new shape, and refuses an unknown receipt member; answers a second read mark `repeated: true` with the first mark's `at`; implements `com.directory` with its boundary and an operator setting that unlists a Project and survives a restore; maps `idempotency.epoch` in `com.status` and omits it for viewer principals, so Fabric Dashboards (a `com.status` reader) needs no repin for it | open — Fabric COM-02.3/03 Task 1 onward | DEC-0073; [project comms → tools](specification/project-comms.md#tools-arguments-and-answers) |
| CT-42 | fabric-agent-adapter adopts DEC-0073 (FAA-12a/b): the kits validate receipts against `comms-receipt`, look up Projects with `com.directory`, and build the responder state machine on the new argument schemas. The kits repin only after Fabric's receipts drop `seq` (CT-41), because a kit at this pin refuses a receipt that carries it | open — after CT-41 | DEC-0073 |
| CT-43 | Decide whether a semantic rule should check a `com.directory` page: each Project listed once, each capability once per Project. JSON Schema cannot say it, because `uniqueItems` compares whole objects. Today it is host prose only | open — owner's decision; a rule needs a reserved FAC-SEM code | DEC-0073 "Not decided here" |
```
