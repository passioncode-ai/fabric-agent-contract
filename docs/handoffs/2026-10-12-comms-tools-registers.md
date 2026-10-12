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
- **Fixtures:** 21 positive and 23 negative `comms-*` fixtures, with catalogue entries. Every new schema is in
  `NOT_SWEPT` in `test/positive-sweep.test.ts`, because no rule reads one of their documents whole. The schema count
  in `test/schema-compilation.test.ts` goes from 81 to 96.
- **Test:** `test/comms-tools.test.ts`. It checks that the spec table names 17 tools, the same set as the
  capability groups, each with existing schemas. It checks that every argument schema is closed, that every tool
  which stores a receipt requires an idempotency key or a fence, and that every mutation answers the one receipt.
  It checks that the directory carries only ids, names, capabilities and responder state, and that the boundary is
  stated. Each of the 24 refusals is a mutant that its named negative fixture must kill.
- `CONTEXT.md` (**Project directory**, **Board receipt**), `docs/DOCMAP.md` (the project-communication row).

## Decisions taken here (for the owner's reading)

1. **`com.directory` is a tool of its own, not a `com.status` member.** `com.status` describes one Project and is read
   by viewer principals (a host showing communication health, COM-11) that must not see the estate's Project list.
   The directory is estate-wide, paged and read by senders. DEC-0022's tool list grows from 16 to 17.
2. **The directory boundary.** Only a principal verified for a Project of the same estate may read it: a managed,
   enrolled or board session. An `asserted` principal, a viewer principal and other estates are refused
   `not_authorized`. The answer holds no content, participant, count, generation, lease or holder; responder state
   is the only activity signal. The caller's own Project is not listed. The operator can unlist a Project in the
   host (in Fabric, per Project), and no tool does it. An unlisted Project stays addressable by id.
3. **Where the decision departs from Fabric's proposal** (Fabric's COM-02.3/03 spec §1.2):
   - `com.status` with a `project` other than the session's own is `not_authorized`. It is not silently ignored.
   - `com.progress` with a `note` is stored like a reply, so a retry never posts the note twice. Without a note it
     is naturally idempotent, as proposed.
   - `com.claim` with nothing claimable stores no receipt, so the same key may poll again.
   - `com.read_ack` takes no idempotency key and stores no receipt, because marking read twice is one mark.

## Checks run

- Plants: 24 mutants in `test/comms-tools.test.ts`, each killed. On disk, 23 plants were made in the schema files:
  each constraint was removed, `vitest run test/fixtures.test.ts -t <fixture>` went red (`1 failed`, exit 1), and
  the file was restored. The pull request body lists them.
- `pnpm run check` with `ORG_INDEX` set to the org-index checkout. The output summary is in the pull request.

## Open

- The owner applies the register text below under the owner's leases. This run edited none of `docs/DECISIONS.md`,
  `docs/specification/conformance.md` or `docs/backlog.md`.
- **Next task:** Fabric COM-02.3/03 Task 1. Repin the contract to this pull request's merge commit, add the new
  schemas to `COMMS_SURFACES` and their fixtures to the consumer test, and serve the tools whose schemas are now
  pinned.

---

## Register text to insert

### 1. `docs/DECISIONS.md` — append as the last decision section (after the highest-numbered DEC present at insert)

```markdown
### DEC-0073 — The board's tools: every argument and answer a closed schema, one receipt without a sequence number, slots that end with the session, and a project directory (`fabric-project-comms/0.1`, amended)

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: Fabric serves the tools
  against these schemas after repinning (COM-02.3/COM-03); the adapter's kits read receipts and the directory
  (FAA-12a/b). Board rows below.
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
     request?, slot?, attempt?}`. It never carries an estate-wide sequence number (C3); a reader refuses an unknown
     member. `com.claim` with nothing claimable answers `{ok: true, repeated: false}` and stores nothing.
     `com.renew` and `com.progress` without a note are naturally idempotent: the key's shape and epoch are checked
     and no receipt is stored. A note is stored like a reply.
  3. **Slots end with the session.** Leaving or ending the session releases its slots and live attempts; there is
     no release tool. `com.status` may report `idempotency.epoch`, and its `project` argument is the session's own
     or a viewer's granted Project.
  4. **Project directory.** `com.directory` (`comms-directory`) lists the caller's estate's addressable Projects:
     id, name, listed capabilities and each one's responder state, nothing else. Only principals verified for a
     Project of the same estate read it. It never crosses estates or lists the caller's own Project. The operator
     may unlist a Project in the host; an unlisted Project stays addressable by id. The tools number seventeen.
- **Why:** Fabric adds no field the contract lacks (its ADR-0117 §2), so it could not serve reply, cancel or any
  responder tool, and its submit receipt passed the estate sequence through, against C3. An enrolled session could
  not learn another Project's id, so no cross-project request could be addressed.
- **Compatibility:** Additive. There are fifteen new schemas and one optional `com.status` member. `comms-status`
  is closed, so a host sends `idempotency` only to a reader pinned at or after this decision. A board whose receipts
  carry `seq` today must drop it before a reader at this pin accepts them. `contractVersion` stays `0.1.0`.
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
  - tests: `test/comms-tools.test.ts` (new), `test/positive-sweep.test.ts`, `test/schema-compilation.test.ts`;
  - docs: `CONTEXT.md`, `docs/DOCMAP.md`, `docs/handoffs/2026-10-12-comms-tools-registers.md`.
- **Not decided here:** a semantic rule that a directory lists a Project once and a capability once per Project
  (`uniqueItems` compares whole objects; board row below); Fabric driving a service's capability as the responder
  (Fabric's C7 follow-on); the `project-history` grant's shape.
- **Source:** Fabric's COM-02.3/03 specification §0 findings 1–2, §1.1–§1.3 (Fabric `origin/main` `bb0e6870`);
  the rollout design for every agent on the board, finding 2 and its contract deliverables; DEC-0022, OQ-0008.
  DEC-0073 was reserved by git CAS (`--key board-tool-shapes-20261012 DEC`); no SEM code; the record plane is `fs`.
```

### 2. `docs/specification/conformance.md` — rows in **Clients and readers**, appended to the table (before the paragraph "A client that fails `FAC-SEM-036`…")

No semantic rule code is added, so **Semantic rule codes** and its "Next free rule code" line do not change.

```markdown
| a board serving `fabric-project-comms/0.1` (Fabric) | validates every tool's arguments against the schema the tool table names before anything is stored, refusing an unknown member `invalid_arguments`; takes the estate, the caller's Project, the principal and the session from the endpoint; releases a session's slots and live attempts when it leaves or ends | schemas `comms-*` (DEC-0073) | the host's own test; `test/comms-tools.test.ts`, fixtures `comms-*-forged-*` ([project comms](project-comms.md#tools-arguments-and-answers)) |
| a reader of a board receipt (Fabric's board service, the adapter's kits) | passes a receipt on only when it is valid against `comms-receipt.schema.json`; a receipt with an unknown member, a sequence number first, is the board's fault and is never shown | `comms-receipt.schema.json` (DEC-0073, C3) | `test/comms-tools.test.ts`, fixtures `comms-receipt*` ([project comms](project-comms.md#receipts)) |
| a board answering `com.directory` (Fabric) | answers only a principal verified for a Project of its own estate; never lists another estate's Project, an unlisted Project or the caller's own; adds no member beyond `comms-directory.schema.json` | `comms-directory.schema.json` (DEC-0073) | the host's own test; fixtures `comms-directory*` ([project comms](project-comms.md#project-directory)) |
```

### 3. `docs/backlog.md` — rows appended to the table, with the next free CT ids at insert (at `origin/main` `3cb040c` the last row is CT-40; the open pull requests #73, #74 and #76 add no new CT id)

```markdown
| CT-41 | Fabric adopts DEC-0073: repins to its merge commit; serves the seventeen `com.*` tools against the tool table's schemas (`unsupported_capability` for any whose schema is not pinned); drops `seq` from the submit and read-ack receipts (C3) and refuses an unknown receipt member; implements `com.directory` with its boundary and an operator setting that unlists a Project; maps `idempotency.epoch` in `com.status` | open — Fabric COM-02.3/03 Task 1 onward | DEC-0073; [project comms → tools](specification/project-comms.md#tools-arguments-and-answers) |
| CT-42 | fabric-agent-adapter adopts DEC-0073 (FAA-12a/b): the kits validate receipts against `comms-receipt`, look up Projects with `com.directory`, and build the responder state machine on the new argument schemas | open | DEC-0073 |
| CT-43 | Decide whether a semantic rule should check a `com.directory` page: each Project listed once, each capability once per Project. JSON Schema cannot say it, because `uniqueItems` compares whole objects. Today it is host prose only | open — owner's decision; a rule needs a reserved FAC-SEM code | DEC-0073 "Not decided here" |
```
