# Task brief — Fabric Agent Contract 0.1.0

- **Date:** 2026-08-26
- **Task:** Create a private standalone architecture-and-schema contract that lets independently developed agents and capability providers participate safely in Fabric projects.
- **UI verdict:** yes — the specification includes the author and operator integration journey, but v0.1 ships no executable UI or CLI.
- **Operator confirmation:** confirmed through the stage-0 interview ending 2026-08-26; authorized to continue through private repository creation, PRs, green CI, merge, Fabric synchronization, and final acceptance.

## Knowledge sources

| Source | What it says | Fresh | Authority | Owed after run |
|---|---|---|---|---|
| Fabric `CONTEXT.md` | goals, projects, nodes, evidence, autonomy, CEO and manager terms | amended 2026-08-26 | glossary | yes — manager term changes |
| Fabric ADR-0010 | one project manager owns each project graph | 2026-08-25 | decision | yes — partially supersede with product-manager term |
| Fabric ADR-0011 | one operator, one estate; no marketplace or customer tenancy | 2026-08-26 | decision | link only |
| Fabric `agent-composition.md` | capability bindings, per-node bundles, profiles, trust tiers, transports | proposal 2026-08-25 | design | yes — point to owning contract |
| Fabric `work-producing-agents.md` | specialist agents emit observations and proposals; one decomposition authority survives | design 2026-08-26 | design | yes — align terms |
| Fabric `agent-family.md` | candidate roles and the growth loop | proposal 2026-08-24 | design | yes — mark example, not core registry |
| MCP specification | current revision resolves to `2026-07-28`; stateless requests and opt-in extensions | retrieved 2026-08-26 | external normative | no |
| A2A specification | v1.0 Agent Card, task lifecycle, bindings, artifacts, streaming and push | retrieved 2026-08-26 | external normative | no |
| `agent-sync` 1.18.0 doctrine | Git record plane, expiring coordination plane, atomic leases, branches and reconciliation | installed 2026-08-26 | adopted mechanism | yes — configure new repo |
| Obsidian wiki | connected but not yet queried for this new project | current | cross-project context | yes — add navigation after merge |

**Contradictions:** Fabric's accepted role name `project manager` conflicts with the operator-confirmed `product manager`; this run follows the operator and owes a new Fabric ADR. No other unresolved source contradiction was found.

## Documentation

| Question | Answer |
|---|---|
| Regime | governed, seeded by DEC-0001 |
| Decision home | `docs/DECISIONS.md`, `DEC-####` |
| Questions | `docs/OPEN_QUESTIONS.md`, `OQ-####` |
| Doc map | `docs/DOCMAP.md` |
| Gate | `pnpm run check`; exact scripts arrive with the build |
| Shared state | gated by a dedicated Notion record plane and Git-ref leases; live check passed 2026-08-26 |
| Intent vs as-built | no implementation existed before this run |
| Wiki | navigation-only cards for Fabric and the contract written 2026-08-26; normative content remains in Git |
| Code graph | graphify installed; build and refresh authorized |
| Retro | four standing instructions in `docs/evidence/retro.md` bind this run |

## Scope

### In scope

- Private repository `passioncode-ai/fabric-agent-contract` (a local clone).
- Normative Markdown specification and Mermaid diagrams.
- JSON Schema Draft 2020-12 schemas with canonical IDs.
- Positive and negative fixtures plus validation tests.
- Profiles for MCP capability providers, A2A peer agents, and local terminal runners.
- Provider discovery, admission, capability bindings, execution contexts, project account pools, coordination, memory, evidence, governance, versioning, retrospectives, and loop guards.
- Base CEO/product-manager/developer roles and a non-normative estate reference scenario with optional specialist agents.
- Private GitHub CI, PR, merge, Fabric consumer-doc synchronization, and wiki navigation sync.

### Out of scope

- Runtime, orchestrator, SDK, CLI, UI, deployment, marketplace, billing, public package, real agent, connector, or provider implementation.
- Model selection and model routing; the agent owns model choice in contract 0.1.0.
- Automatic installation or hosting of third-party code.
- A new wire protocol; MCP and A2A remain normative beneath Fabric profiles.

## Requirements

| ID | Requirement | Verification | Status |
|---|---|---|---|
| REQ-001 | Standalone private repository with governed documentation and contract version 0.1.0 | repository visibility, `pnpm run check`, decision/doc registers | verified |
| REQ-002 | Define common manifest, provider, capability, profile, binding, and artifact objects | schemas compile; positive and negative fixtures | verified |
| REQ-003 | Define MCP, A2A, and local-runner compatibility profiles without inventing a wire protocol | profile docs cite pinned specs; profile fixtures validate | verified |
| REQ-004 | Define provider discovery, identity, admission, semantic probe, trust, and binding lifecycle | lifecycle diagram plus schema tests | verified |
| REQ-005 | Define typed result envelope with DONE, PROOF, SCOPE, NOT VERIFIED and artifacts | result fixtures and rejection probes | verified |
| REQ-006 | Define storage-agnostic project/run/node/observation/evidence object relationships | object-model schema and diagram checks | verified |
| REQ-007 | Define project-first memory, global promotions, retrieval, decay, conflicts, and sensitive-data boundaries | memory spec, schemas, scenario trace | verified |
| REQ-008 | Define retrospectives, contrast-based learnings, versioned improvement proposals, and loop guards | lifecycle fixtures reject self-mutation and unbounded loops | verified |
| REQ-009 | Define immutable versioned settings, diffs, hashes, run pins, and rollback-as-new-revision | versioning schema and rollback fixture | verified |
| REQ-010 | Define multi-agent coordination semantics: claim, renew, release, ID reservation, write scopes, as-built, reconciliation, residue | coordination state-machine fixtures and diagrams | verified |
| REQ-011 | Define branch/worktree/PR/checker integration for multiple developers | Git-flow reference diagram and policy schema | verified |
| REQ-012 | Define ExecutionContext and per-project account pools with per-agent override and approved fallback | schema tests reject secret values and out-of-pool accounts | verified |
| REQ-013 | Define CEO, one product manager per project, selectable developers, and dynamic optional roles | role cardinality fixtures | verified |
| REQ-014 | Define grants, external-action approval, data classification, retention, secret references, and provenance | governance fixtures reject unsafe combinations | verified |
| REQ-015 | Document author/operator UX scenarios for creating, registering, validating, selecting, and replacing a provider | scenario IDs traced to contract components | verified |
| REQ-016 | Document the full estate reference scenario across development, SEO, research, content, QA, analytics, product management, and support | named-payload Mermaid graph plus component map | verified |
| REQ-017 | CI validates TypeScript, all schemas, fixtures, Markdown, links, Mermaid syntax, and version consistency | GitHub Actions green after planted-failure probes | verified |
| REQ-018 | Initialize Notion coordination with Git-ref leases and a generated wiring snapshot | `agent_sync.py check` green | verified |
| REQ-019 | Synchronize Fabric decisions and consumer architecture to the new canonical contract | Fabric PR green and merged under lease | verified |
| REQ-020 | Add navigation-only Obsidian wiki entry linking both repositories | wiki update receipt and resolving links | verified |
| REQ-021 | Finish with every repository clean, pushed, merged, reconciled, and carrying a retrospective | acceptance commands and final audit | verified |

The REQ list is frozen. Removing or narrowing a row requires explicit operator agreement and a carry-over entry.

## Users and context

- Agent author: builds an independent provider and needs a machine-checkable route to compatibility.
- Project operator: selects project defaults, execution contexts, account pools, providers, grants, and integration policy.
- Product manager agent: owns one project's backlog and execution graph.
- Developer agent: runs in a selected terminal provider and project-scoped context.
- Fabric host: discovers, validates, admits, binds, coordinates, observes, and records providers without knowing their internal implementation.

## Decisions locked

The decision register is canonical. Stage 0 locked private scope, Markdown/Mermaid, Draft 2020-12 schemas, pnpm/TypeScript/AJV/Vitest, existing protocols, storage agnosticism, project-first memory, governed global promotion, immutable revisions, multi-agent coordination, project account pools, PR/checker integration, scoped external grants, mandatory data classification, and the base role cardinalities.

## Autonomy

| Stage | Decision |
|---|---|
| Run-wide model | Keep the current top-tier model for the full run |
| Escalation | Continue autonomously for reversible repository work; external publication is authorized only for the two named private GitHub repositories and wiki navigation sync; stop on credentials, legal posture, money, public visibility, or destructive ambiguity |
| Pacing | Continue through the full pipeline without item-level check-ins; manual acceptance remains at the end |
| Sources | Fabric, official MCP/A2A/JSON Schema/GitHub docs, installed doctrine, and the connected wiki; cross-repo updates go through branches and PRs |
| Fixtures | No persistent application state; `pnpm install --frozen-lockfile && pnpm run check` recreates validation from a clean checkout |
| Source freshness | New repo has no upstream until GitHub creation; Fabric was measured at `main...origin/main` before edits |
| Work list | This brief and its work graph; no external tracker |
| Setup audit | New repository: seed governed docs rather than audit nonexistent history |
| Docs | Decision register plus doc map; initialize `agent-sync` before parallel shared edits |
| External specs | Fetch live official specifications and pin revisions before normative wire claims |
| Decomposition | Platform specification split into modules; no deploy cadence because v0.1 has no runtime |
| UI/design | Text-only developer journey; no Figma or visual design |
| Branches | `main` is integration-only; feature branches use `codex/` prefix |
| Integration | Private PRs; independent checks; automatically merge after green; Fabric updated only after contract merge |
| Tests/lint | `pnpm run check`; no known-red baseline |
| Deploy | None; repository publication is private and authorized |
| Post-deploy | Verify merged GitHub state and CI, not an application endpoint |
| Docs/wiki | Update Fabric consumer docs, build/refresh graph if useful, add wiki navigation entry |
| Acceptance | Operator signs off in chat; unresolved items must have a named carry-over home; retrospective required |

## Done criteria

- All REQs are `verified` or explicitly settled in carry-over.
- Negative probes have been observed failing before restored green results count.
- Contract and Fabric PRs are merged privately with green CI.
- Coordination is healthy or honestly reported with a named blocker.
- Every repository is clean, pushed, and reconciled.
- The wiki links to canonical sources without duplicating the specification.

## Risks

- MCP and A2A revisions can move; normative claims must stay pinned and version mismatches must be handled.
- JSON Schema can validate shape but not provider quality; protocol conformance and semantic probes remain separate.
- Account pools and execution contexts can leak credentials if a host copies ambient environment; schemas must contain references only.
- A knowledge index can accidentally ingest unmerged branches; acceptance must state committed revisions are the only canonical ingest source.
- GitHub authentication was restored; both authorized repositories remained private throughout publication.
