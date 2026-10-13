# Handoff — DEC-0080: a structured finding on the project board (2026-10-13)

## Objective

Fabric's board wave 4 adds work awareness (Fabric COM-05) and drafted a structured finding: what it affects, how much
it matters, evidence, and no duplicate when two agents report one thing. The owner ruled to adopt it with refinements:
a backlog row linked by `{repository, path, id}`, a semantic dedupe distinct from idempotency, redaction that keeps the
count, and subscriptions left undecided.

## Done

- DEC-0080. `comms-common.schema.json` gains `finding` (severity, consequence, affects, `dedupeKey`, closed) with
  `findingSeverity`, `repositoryName`, `repositoryPath`, `backlogRowId`, `dedupeKey`, `affectedRow`, `affectedTask` and
  `affectedRedacted`. `comms-submit` and `comms-message` take it only with kind `finding`; the submit adds
  `uniqueItems` and refuses a redacted item (`not`). `finding` was already a kind (DEC-0022), so no kind was added.
- `repeated` was already a required receipt member (DEC-0073), so no receipt member was added; its description gains
  the dedupe cause. The packet asked to add an optional `repeated: true` the way DEC-0078 added `transferred`; that
  member exists, and leaving the receipt's shape alone means no reader refuses a dedupe receipt.
- `FAC-SEM-108` (new code, kinds `comms-submit` and `comms-message`): `finding` only on kind `finding`; no two
  unredacted items the same, compared as written; a redacted item only in a message.
- project-comms.md: Findings, Dedupe, Redacted items, the Receipts bullet, the semantic-rules row, three limits rows.
  conformance.md register row; identifiers.md (compared as written); CONTEXT (Board finding); DOCMAP; DEC-0022 and
  DEC-0073 annotated; CT-41 and CT-42 clauses.
- Fixtures: three positives, thirty-three negatives (each with a plant), seven rule fixtures, and
  `fixtures/vectors/comms-finding.json` (54 schema cases with each bound and one past it; 500 astral-plane characters
  for a port that counts UTF-16 units).
- `test/schema-mutants.ts` `killers` takes the schema whose fixtures prove a mutant of a shared definition.

## Open

- Fabric stores, dedupes and redacts findings and repins (CT-41); the adapter's kits send and read them (CT-42).
- Not decided: subscriptions (an explicit, grant-bound sharing command, never implicit); severity's effect on
  notifications or Telegram; a blocking finding and holds; which grants cover a row or a task.
- **The registers are in [`2026-10-13-comms-finding.registers.patch`](2026-10-13-comms-finding.registers.patch),
  not in this branch's commits.** DEC-0080 itself with the annotations on DEC-0022 and DEC-0073 (`docs/DECISIONS.md`),
  the `FAC-SEM-108` row (`docs/specification/conformance.md`) and the CT-41 and CT-42 clauses (`docs/backlog.md`) are
  guarded files: agent-sync's commit guard refuses them without a lease, and this run was told to take none. The owner
  applies the patch under the leases at merge (`git apply`, checked clean against `1166127`). The patch sets the
  `FAC-SEM` next-free marker to `FAC-SEM-109`, because the consistency test (G-13) fails while the marker equals an
  allocated code; the `DEC` marker is left as on main. Without the patch the branch fails G-13 alone: `FAC-SEM-108` is
  named by `src/semantic-rules.ts` and project-comms.md and has no register row.

## Checks run

- Gate with the registers patch applied: `tsc --noEmit`, vitest with coverage, UX lint, docs-check, lint-md, privacy.
  At the branch head without it, only G-13 fails (one test, and docs-check's two `FAC-SEM-108` lines). The exact
  numbers are in the pull request.
- Thirty-three schema plants in `test/comms-tools.test.ts`, each killed by its named negative fixture.
- Four rule plants, each made by hand in `commsFinding` with a test failing, then restored: the kind check removed, the
  duplicate check removed, the redacted-in-submit check removed, and rows compared case-folded instead of as written.
  The failing tests are listed in the pull request.

## Next task

Merge, set the markers, tell Fabric's builder the merge commit for COM-05, and record adoption on CT-41 and CT-42.
