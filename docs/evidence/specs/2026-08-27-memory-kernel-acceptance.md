# Acceptance — Fabric Memory Kernel architecture

Acceptance evidence captured on 2026-08-27 for the architecture commit
`0d1171f`. Runtime, database, MCP server, SDK, UI and production deployment remain
out of scope.

## Outcome

All seven frozen `MEM-REQ-*` requirements are represented in the normative
specification or the concrete adapter reference. Fabric owns the canonical
Memory Kernel, while `mcp-memory-service` is a pinned, private and replaceable
pilot backend. Contract `0.1.0` schemas and fixtures were not changed.

## Requirement matrix

| Requirement | Receipt |
|---|---|
| MEM-REQ-001 | DEC-0014; control/data-plane component diagram and ownership table in `docs/specification/memory-and-learning.md` |
| MEM-REQ-002 | function/scope tables, canonical record fields and lifecycle state diagram in the normative specification |
| MEM-REQ-003 | conceptual operation table, query example, `MemoryPack`, write sequence and retrieval diagram in the normative specification |
| MEM-REQ-004 | consistency matrix, trusted-identity rule, CAS writes, conflict visibility, retention, forgetting and degradation rules in the normative specification |
| MEM-REQ-005 | formation/evolution/retrieval/use cycle, use traces, memory audit, retrospective and loop guard in the normative specification |
| MEM-REQ-006 | deployment boundary, SPI mapping, multilingual projection version, protocol boundary, admission gates and pilot sequence in `docs/reference-architecture/mcp-memory-service-adapter.md` |
| MEM-REQ-007 | Graphiti, Mem0 and Postgres/pgvector alternatives plus export/rebuild migration seam in the adapter reference |

## Source and scope receipts

- `docs/evidence/sources.md` pins MCP `2026-07-28`,
  `mcp-memory-service` commit `f3c20d0`, Graphiti commit `683a853`, Mem0 commit
  `39bc023`, arXiv `2512.13564v2` and arXiv `2603.10062v2`.
- `CONTEXT.md` owns the new Memory Kernel vocabulary.
- README, DOCMAP and the estate scenario link to the canonical documents rather
  than restating their rules.
- `git show --stat 0d1171f` reports eight changed files, 495 insertions and 48
  deletions for the normative architecture commit.

## Verification

Commands run from the repository root:

```bash
pnpm docs:check
pnpm run check
git diff --check
```

Observed result: documentation and Markdown checks passed; strict TypeScript
passed; Vitest passed 4 files and 34 tests; UX lint passed 5 stories, 4 flows, 8
screens and 8 scenarios; Mermaid sources parsed through the repository document
gate; `git diff --check` returned no findings.

Requirement coverage review found every `MEM-REQ-001` through `MEM-REQ-007` in
the frozen brief, approved design, delivery plan and at least one owning output.

## Known boundary

This acceptance proves architecture completeness and repository integrity. It
does not prove live backend isolation, deletion, retrieval quality, restore or
MCP conformance. Those are explicit blocking admission gates for the future
pilot, so installation alone cannot be reported as production readiness.
