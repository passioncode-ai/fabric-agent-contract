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
- The registers (DEC-0080 after DEC-0079 with the annotations on DEC-0022 and DEC-0073, the `FAC-SEM-108` row, and the
  CT-41 and CT-42 clauses after DEC-0079's) were first kept as a patch, because agent-sync's commit guard refuses those
  files without a lease and this run took none. After DEC-0079 merged (`d194dd9`, #101), the branch was rebased onto
  it and the registers committed under the owner session's leases, at the owner's request; main's markers
  (`DEC-0082`, `FAC-SEM-110`) are kept.

## Checks run

- Gate at the rebased branch head: `tsc --noEmit`, vitest with coverage, UX lint, docs-check, lint-md, privacy. The
  exact numbers are in the pull request.
- Thirty-three schema plants in `test/comms-tools.test.ts`, each killed by its named negative fixture.
- Four rule plants, each made by hand in `commsFinding` with a test failing, then restored: the kind check removed, the
  duplicate check removed, the redacted-in-submit check removed, and rows compared case-folded instead of as written.
  The failing tests are listed in the pull request.

## Next task

Merge, tell Fabric's builder the merge commit for COM-05, and record adoption on CT-41 and CT-42.
