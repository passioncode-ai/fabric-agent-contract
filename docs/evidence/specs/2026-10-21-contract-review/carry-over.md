# Carry-over: findings of the 2026-10-21 review outside this run's REQs

Each row names the review finding (A author path, B cut and merge, C schemas, D tooling, E consumers), why it is not
done in this run, and where it goes. Every row leaves this run with a backlog row or a board message (REQ-18).

| Finding | What | Why not now | Goes to |
|---|---|---|---|
| A11 | The manifest's `contentHash`: which object it covers, a reference function, real hashes in fixtures | a normative definition every host reads; needs a decision | backlog row |
| A16 | The local-runner argument placeholders (`{inputFile}`, `{worktree}`) and `executableRef` forms | defining them is normative; hosts substitute them today without a shared table | backlog row |
| A17 | One stdio MCP server declared in the manifest and in the provider entry, with no rule which one a host launches | needs Fabric's answer on which it launches | backlog row |
| A8 | A misspelt extension key validates silently | a rule would refuse documents in the field; this run's checker warns instead (REQ-01) | the checker's hint; a rule is a backlog row |
| A3 (rule) | A rule tying an MCP capability's name to its tool | could refuse providers' published manifests; this run fixes the fixtures (REQ-06) | backlog row |
| C2, C4, C5, C7, C17, C18 | Agent references, instants, USD, days, idempotency keys and session ids in several grammars | moving them to one grammar tightens or widens what pinned readers accept | backlog row (each with its grammars) |
| C11 | An extension point on the wire documents that evolve | adding the member is refused by today's pins; it belongs to a revision bump | backlog row |
| C12 | One `$id` names many contents across commits | documented in this run (REQ-11); a revision in the `$id` is breaking | backlog row |
| C13 | Seven names for the member that says which document type an instance is | a table is documentation; renaming is breaking | backlog row |
| C9 (rest) | Descriptions beyond the author documents and common | large; this run covers what an author meets first | backlog row |
| C10 | `examples` in schemas | follows C9 | backlog row |
| C19 | Bounds a schema could state and a rule states instead (relay `ttl` and others) | each tightening needs the relay's reading | backlog row |
| C23 | Open objects in folder attribution | closing them is breaking for products that add members | backlog row |
| D4 | Four credential detectors that disagree | widening the shared one refuses more documents; CT-73 owns the decision | CT-73 (evidence added) |
| D11, D19 | The privacy scan reads the tree twice and covers tracked files only | the script lives in org-index | board message to org-index |
| D12 | The gate's steps in parallel | a runner change; the gain is under load only | backlog row |
| D13 | One envelope for every semantic fixture | large; the checker of REQ-01 reads today's shapes | backlog row |
| D14 | Four refusal shapes across verifiers | the shapes are pinned by vectors; a decision first | backlog row |
| D17 (lint) | A TypeScript linter in the gate | a new dependency and a gate step | backlog row |
| D21 | Protocol constants no test ties to the spec | a test per constant | backlog row |
| B1 | DOCMAP's single-sources table restates rules | large rewrite of a map other tools read | backlog row |
| B3, B5 | The readers table and signing.md repeat rule text | after the readers table has anchors | backlog row |
| B11 | Backlog rows grown into dated logs | needs the workspace sync's agreement on the layout | backlog row |
| B12 | "Who adopts it" sections copy backlog status | follows B11 | backlog row |
| B13 | A decisions index | a generator and a test | backlog row |
| B18 | Rules with no fixture, which ports cannot run | follows D13 | backlog row |
| B20, B21 | Surfaces no consumer reads; organisation data in the contract | the maturity column of REQ-09 records the first; the second is a decision | the index; a backlog row |
| B22 | Exports used only in their own file | a ported file may import one by name | backlog row |
| E (forks) | Three emitters each ship their own `support-quality-daily` schema | their repositories | board messages to each owner |
| E (pins) | Consumers several to over a hundred merged changes behind, one pin off the contract's history | their repositories | the pin announcement; board messages |
| E (rows) | Backlog rows the consumer review found done (CT-28, CT-42, CT-54, CT-56, CT-59) | receipts belong in the rows | backlog rows updated in this run (REQ-17) |
