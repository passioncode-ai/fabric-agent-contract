# Task brief — Fabric Memory Kernel architecture

- **Date:** 2026-08-26
- **Task:** Formalize the approved Fabric memory architecture, including the
  Memory Kernel, provider-neutral API, project/global scopes, consistency,
  evidence, retrospectives, and an `mcp-memory-service` pilot adapter.
- **UI verdict:** no — this run changes architecture and contract documentation
  only; it ships no executable interface.
- **Operator confirmation:** the operator approved the recommended architecture
  in chat and approved recording it as a specification and decision.

## Knowledge sources

| Source | What it says about this task | Fresh | Authority | Owed after run |
|---|---|---|---|---|
| `CONTEXT.md` | Memory already distinguishes observations, evidence, learnings and governed promotion | current at `0819649` | glossary | yes — add the Kernel vocabulary |
| `docs/DECISIONS.md` | DEC-0003 keeps persistence replaceable; DEC-0004 is project-first; DEC-0012 requires failure/correction contrast | current at `0819649` | decision | yes — add one refining decision |
| `docs/specification/memory-and-learning.md` | Three scopes and a basic record lifecycle exist, but no control/data-plane split, API, consistency matrix or backend contract exists | current at `0819649` | normative contract | yes — canonical architecture update |
| `schemas/memory.schema.json` | Contract 0.1.0 already shapes memory records, promotions, retros and learning proposals | current at `0819649` | machine-readable contract | no — this run does not revise wire schemas |
| `docs/reference-architecture/estate-loop.md` | Project agents write evidence-bearing reports and global insight proposals | current at `0819649` | reference architecture | yes — link the detailed memory flow |
| `docs/evidence/retro.md` | Protocol claims need pins; checks need negative controls; learnings require contrast and cannot self-apply | current at `0819649` | standing instruction | yes — stamp this run and record only divergence |
| Obsidian graph index | Existing examples converge on separate working/private/shared memory, pinned embeddings and a project-wide retrieval API; no page owns this Fabric decision | queried 2026-08-26, index-only over 736 pages | cross-project context | no — navigation remains canonical-link only |
| `mcp-memory-service` | Self-hosted REST/MCP service with SQLite-vec, local embeddings, hybrid retrieval, graph and consolidation; direct governance and current-wire conformance remain outside its guarantee | main `f3c20d00201a4eac112a5d29772327fc973606f0`, retrieved 2026-08-26 | candidate backend source | yes — pin in source ledger and adapter doc |
| MCP specification | Current revision is stateless and negotiates capabilities per request | `2026-07-28`, retrieved 2026-08-26 | external normative | yes — reuse existing pin and record adapter boundary |
| arXiv `2603.10062v2` | Multi-agent memory needs explicit access scope, update visibility/order and read-time conflict resolution | updated 2026-03-30, retrieved 2026-08-26 | research | yes — pin in source ledger |
| arXiv `2512.13564v2` | Memory lifecycle separates formation, evolution and retrieval; working memory is an active bounded state carrier | updated 2026-01-13, retrieved 2026-08-26 | research survey | yes — pin in source ledger |
| Graphiti main | Temporal facts, validity windows, episode provenance and hybrid graph retrieval are available behind a heavier graph stack | `683a8539c8925de69071a1305dc8bf0e52e17c65`, retrieved 2026-08-26 | alternative backend source | yes — compare in adapter doc |
| Mem0 main | Provides a self-hosted/managed memory API and multi-signal retrieval; managed benchmark features are not identical to the OSS path | `39bc02330563764e7d4465f1ecff5f002d94da1a`, retrieved 2026-08-26 | alternative backend source | yes — compare in adapter doc |

**Contradictions:** none. The concrete pilot backend refines, but does not replace,
DEC-0003: the contract remains storage-agnostic while the Fabric reference
implementation selects one replaceable adapter. The current `mcp-memory-service`
tests an older MCP handshake, so this run does not claim direct conformance to the
pinned Fabric MCP profile.

## Scope

### In scope

- A normative Memory Kernel architecture and bounded Memory API semantics.
- Orthogonal memory type and visibility/scope models.
- Canonical ledger, evidence store, derived search/graph indexes and rebuild path.
- Concurrent-write consistency, revisions, conflicts, deletion and usage traces.
- Project-first retrieval and governed global promotion.
- Retrospective, correction and memory-quality feedback cycles.
- A pinned `mcp-memory-service` pilot adapter, security posture and rollout gates.
- Markdown, Mermaid, ADR, source ledger, documentation navigation and acceptance evidence.

### Out of scope

- Runtime, database migration, service deployment, MCP server implementation,
  SDK, UI, CLI, live provider admission or production data ingestion.
- Changing contract version `0.1.0` or its JSON schemas and fixtures.
- Selecting a final graph database or managed memory vendor.
- Cloudflare hybrid synchronization in the pilot.

## Requirements

| ID | Requirement | Verification | Status |
|---|---|---|---|
| MEM-REQ-001 | Separate Fabric-owned memory control semantics from replaceable storage/search backends | DEC-0014 and component diagram | open |
| MEM-REQ-002 | Define working, episodic, semantic, experiential and promoted memory across run, agent, project and global scopes | normative layer/type tables and lifecycle diagram | open |
| MEM-REQ-003 | Define transport-neutral Memory API operations and bounded `MemoryPack` retrieval | operation table, request/response shapes and sequence diagram | open |
| MEM-REQ-004 | Define identity-derived authorization, revisions, concurrent writes, read visibility, conflicts, retention and verifiable forgetting | consistency and failure matrices | open |
| MEM-REQ-005 | Define formation, evolution, retrieval, usage tracing, retrospectives and error/correction feedback without self-mutation | lifecycle flows and learning rules | open |
| MEM-REQ-006 | Specify the pinned `mcp-memory-service` pilot adapter, isolation, embeddings, protocol boundary, degradation and replacement seam | reference adapter document and deployment diagram | open |
| MEM-REQ-007 | Compare credible alternatives and preserve a migration path to a temporal graph or a different retrieval backend | alternatives table and backend SPI | open |

The MEM-REQ list is frozen for this run. Narrowing it requires an explicit
operator decision and a carry-over entry.

## Decisions locked

- Fabric owns authorization, revisions, consistency, provenance, promotion,
  retention and context assembly.
- A backend owns storage/index mechanics only and is rebuildable from canonical records.
- Agents propose memory changes; they never write a backend directly.
- Project and global indexes are physically or cryptographically isolated; the
  global store accepts promotion events only.
- MCP is the agent-facing capability protocol, internal REST is the pilot adapter
  transport, and A2A carries agent tasks rather than persistence calls.
- The pilot uses bounded hybrid retrieval and a multilingual embedding model.
- Derived graphs and autonomous consolidation are non-authoritative.

## Autonomy

| Stage | Decision |
|---|---|
| Run-wide model | Keep the current top-tier model |
| Pacing | Continue autonomously through the private documentation PR and merge; final chat hand-back remains the manual acceptance |
| UI/design | No UI, Figma, copy or visual track |
| Sources | Repository sources, pinned upstream repositories/specifications, the two supplied papers and index-only wiki context |
| Coordination | Git lease is exclusive across machines; shared ID allocation is degraded without the local Notion token, so allocate DEC-0014 manually from committed Git under the lease |
| Branch | `codex/memory-kernel-architecture`; `main` remains integration-only |
| Tests | `pnpm docs:check` and `pnpm run check`; no new checker is introduced |
| Deploy | No runtime deploy; private repository publication only |
| Wiki | Do not duplicate the specification; existing navigation card remains sufficient |
| Graph | Graphify is installed but no graph exists for this repository; record the absence, do not block |
| Acceptance | Every MEM-REQ must carry a file/command receipt and no coordination lease may remain held |

## Done criteria

- DEC-0014 is committed under the active Git lease.
- The canonical memory specification owns the architecture, API, consistency and lifecycle.
- The reference adapter pins upstream sources and states every degraded guarantee.
- All Mermaid diagrams parse and the full repository gate is green.
- The private branch is merged, the as-built record is updated as far as the
  available coordination plane permits, and the lease is released.

## Risks

- Treating similarity search as truth would erase exact revisions and conflicts.
- Logical project tags are not a security boundary unless the Kernel enforces them.
- Direct MCP binding could silently couple Fabric to an older protocol revision.
- Automatic consolidation could promote hallucinated or sensitive conclusions.
- Changing embedding models without a versioned re-index can make old and new
  vectors incomparable.

