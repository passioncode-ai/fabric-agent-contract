# Acceptance — compatible agent provider guide

Acceptance evidence captured on 2026-08-27 for guide commit `cb638b1`.

## Outcome

The repository now has one practical author/operator entry point for mapping an
existing agent to MCP, A2A or local runner and preparing a new compatible provider.
The guide links the normative specifications, schemas and positive fixtures and
does not present the proposed Fabric CLI/SDK as implemented.

## Requirement receipts

| Requirement | Receipt |
|---|---|
| REQ-001 | profile decision tree and exact-revision table in `docs/guides/connecting-compatible-agents.md` |
| REQ-002 | provider layout, manifest responsibility table, author checklist and links to all three positive manifest fixtures |
| REQ-003 | admission/binding sequence, ordered lifecycle, project binding controls and replacement/rollback flow |
| REQ-004 | existing-system matrix for native A2A, native MCP, CLI, bounded HTTP, autonomous HTTP and web-only surfaces |
| REQ-005 | separate `What exists now` and `Proposed authoring automation` sections; repository README still states that no runtime, CLI or SDK ships in contract `0.1.0` |

## Verification

Commands run from the repository root:

```bash
pnpm docs:check
pnpm run check
git diff --check
```

Observed result: strict TypeScript passed; Vitest passed 4 files and 34 tests; UX
lint passed 5 stories, 4 flows, 8 screens and 8 scenarios; links, Mermaid and
Markdown checks passed with 0 errors; `git diff --check` returned no findings.

No new executable checker was introduced, so this run did not plant a new failure.
The existing contract validator's observed negative control is recorded in
`docs/evidence/acceptance.md`; the guide does not widen what that check proves.

## Not verified

- No third-party provider was connected or admitted.
- No live MCP/A2A negotiation or local-runner launch was performed.
- No registry, CLI, SDK, host runtime, UI or deployment was created.

Those items are explicitly outside the frozen brief and remain implementation
work rather than documentation claims.
