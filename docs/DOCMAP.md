# Documentation map

## Regime

`governed` — established 2026-08-26 by run `2026-08-26-fabric-agent-contract`
and recorded as DEC-0001.

## Registers

| Register | File | ID scheme | Append-only | Guarded |
|---|---|---|---|---|
| Decisions | `docs/DECISIONS.md` | `DEC-####` | yes | lease before write when coordination is healthy |
| Open questions | `docs/OPEN_QUESTIONS.md` | `OQ-####` | yes | same |
| Requirements | `docs/evidence/specs/*-brief.md` | `REQ-###` | frozen per run | same |

## Single sources

| Fact | Canonical home |
|---|---|
| Settled architectural decision | `docs/DECISIONS.md` |
| Contract vocabulary | `CONTEXT.md` |
| Pinned external protocol facts | `docs/evidence/sources.md` |
| Normative profile behavior | `docs/specification/` |
| Provider author and operator onboarding | `docs/guides/connecting-compatible-agents.md` |
| Memory control-plane semantics | `docs/specification/memory-and-learning.md` |
| Concrete memory backend mapping | `docs/reference-architecture/mcp-memory-service-adapter.md` |
| Service extension (`fabric-service/0.1`), local and remote placement | `docs/specification/service.md` |
| Calling agents (`fabric-interop/0.1`) | `docs/specification/interop.md` |
| Project communication (`fabric-project-comms/0.1`) | `docs/specification/project-comms.md`, `schemas/comms-*.schema.json` (DEC-0022, OQ-0008) |
| Shared capability-name acceptance and underscore compatibility | `docs/specification/interop.md#capability-names`, `schemas/common.schema.json` (DEC-0020) |
| Provider entries (`fabric-provider/0.1`) | `docs/specification/provider.md` |
| Runner catalogue shape, runner routes and route events | `docs/specification/runners.md`, `schemas/runner-route.schema.json`, `schemas/runner-route-event.schema.json` (DEC-0026, DEC-0029) |
| Semantic rule codes: allocation and the next free code | `docs/specification/conformance.md#semantic-rule-codes`, `src/rule-codes.ts` (DEC-0029) |
| Pipelines and PL-1…PL-4 (`pipeline/0.1`) | `docs/specification/pipeline.md` |
| Extension key spellings | `src/extensions.ts` |
| A consumer's contract pin | `docs/specification/versioning.md#one-contract-pin` |
| Agent-registry run (AR-1) record and handoff | `docs/evidence/plans/2026-09-30-ar1-contract.md` |
| Licence and repository-standard handoff | `docs/handoffs/2026-09-30-repository-standard.md` |
| Licence text, commercial terms, contributor agreement | `LICENSE`, `COMMERCIAL-LICENSE.md`, `CLA.md` (knowledge base templates) |
| Machine-readable shapes | `schemas/` |
| User and integration behavior | `docs/ux/` |
| Reference estate scenario | `docs/reference-architecture/` |
| Work accepted for this run | `docs/evidence/specs/2026-08-26-fabric-agent-contract-brief.md` |
| Memory architecture run scope | `docs/evidence/specs/2026-08-26-memory-kernel-brief.md` |
| Acceptance receipts | `docs/evidence/acceptance.md` |
| Local service extension run scope | `docs/evidence/specs/2026-09-28-fabric-service-brief.md` |
| Remote placement run scope and design | `docs/evidence/specs/2026-10-02-remote-service-brief.md`, `docs/evidence/specs/2026-10-02-remote-service-design.md` |
| Memory architecture acceptance | `docs/evidence/specs/2026-08-27-memory-kernel-acceptance.md` |
| Provider guide acceptance | `docs/evidence/specs/2026-08-27-agent-provider-guide-acceptance.md` |
| Deferred or dropped work | adjacent carry-over ledger |
| What a run actually built | coordination as-built log, linked to a commit |

Git owns normative intent. Knowledge systems index committed documents and link
back to their exact revisions; they do not become a second editable source.

## Propagation matrix

| Change type | Update these | Checked by |
|---|---|---|
| New document or rule | `README.md`, this map, `AGENTS.md` when agents must discover it | `pnpm docs:check` |
| Decision | decision register plus every path in `Consequences / affects` | `pnpm docs:check` |
| Resolved question | open-question register plus owning topic document | `pnpm docs:check` |
| Contract object or field | owning specification, schema, fixtures, glossary if it is a domain term | `pnpm test` |
| Protocol profile | profile specification, manifest schema, compatibility fixtures | `pnpm test` |
| Provider onboarding workflow | provider guide, README and owning normative links | `pnpm docs:check` |
| User-facing integration behavior | `docs/ux/` scenario and flow documents | `pnpm docs:check` plus UX linter when present |
| Reference architecture | scenario document and every affected Mermaid diagram | review — semantic completeness is a judgment |
| Memory backend decision | memory specification, adapter reference, source ledger, glossary and estate path | `pnpm docs:check` plus adapter-boundary review |
| Versioned policy | versioning specification, schema, rollback example | `pnpm test` |

## Gates

| Gate | Command | Scope |
|---|---|---|
| Full | `pnpm run check` | types, schemas, fixtures, Markdown, links, Mermaid syntax |
| Documentation | `pnpm docs:check` | Markdown shape, links, versions, Mermaid parseability, extension-key spelling, glossary profile names; not semantic correctness |
| Consumer pin | `pnpm pin:check <repository>` | every contract revision a consumer names equals its `fabric-contract.lock.json` |
| Contract | `pnpm test` | schema compilation and positive/negative fixtures; not provider quality |

## Navigation

Indexes link to canonical definitions and never restate normative rules. References
to external protocols always include a pinned revision.
