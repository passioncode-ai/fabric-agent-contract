# Module map — Fabric Agent Contract 0.1.0

Build order is top to bottom. Status: `planned` → `in progress` → `done` |
`deferred`. The rows partition the frozen REQ list.

| # | Module | Delivers | Owns (entities) | Depends on | Contracts exposed | UI? | REQs | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | walking skeleton | governed private contract package, common manifest and CI path | ContractVersion, Manifest, Provider, Capability, Profile | — | canonical schemas, `pnpm run check` | yes | REQ-001, REQ-002, REQ-017 | done |
| 2 | interoperability | MCP, A2A and local profiles plus admission lifecycle | Admission, Probe, CompatibilityProfile | walking skeleton | profile schemas, admission report | yes | REQ-003, REQ-004 | done |
| 3 | results and graph | typed result/evidence envelope and logical work relationships | Result, Artifact, Project, Run, Node, Observation, Evidence | walking skeleton | result and object-model schemas | no | REQ-005, REQ-006 | done |
| 4 | memory and learning | project memory, promotion, retrospectives and loop guards | MemoryRecord, Insight, Promotion, Retro, LearningProposal | results and graph | memory and learning schemas | no | REQ-007, REQ-008 | done |
| 5 | versioned execution | immutable settings, coordination, Git integration and runtime contexts | Revision, Binding, Claim, CoordinationEvent, ExecutionContext, AccountPool | interoperability, results and graph | coordination and context schemas | yes | REQ-009, REQ-010, REQ-011, REQ-012 | done |
| 6 | roles and governance | base role cardinalities, optional roles, grants, data and provenance | RoleAssignment, StandingGrant, DataPolicy | versioned execution, memory and learning | governance schemas | yes | REQ-013, REQ-014 | done |
| 7 | operator experience | authored UX journeys and complete estate reference architecture | Scenario, Trace, ReferencePayload | all prior modules | scenario traces and diagrams | yes | REQ-015, REQ-016 | done |
| 8 | adoption and closeout | agent-sync wiring, Fabric and wiki consumers, merged acceptance | CoordinationSetup, ConsumerLink, AcceptanceReceipt | all prior modules | generated sync snapshot, repository links | yes | REQ-018, REQ-019, REQ-020, REQ-021 | done |

## Cut rationale

The cut follows independently testable capabilities rather than storage or code
layers. The walking skeleton proves one end-to-end path: a manifest validates,
its docs and diagrams parse, and the same command runs in CI. Protocol admission
then provides the provider identity needed by every later binding. Results and
logical work objects precede memory because memory stores verified observations,
not arbitrary provider output. Governance lands after execution objects so its
constraints have concrete targets.

No module writes another module's entities. Later modules reference earlier
objects by canonical URI and immutable revision. This makes the dependency graph
acyclic.

## Cross-module contracts

| Contract | Owner | Consumers | Failure behavior |
|---|---|---|---|
| canonical schema ID and version | walking skeleton | every module | unknown major or unresolved `$ref` is incompatible |
| admission report | interoperability | versioned execution, operator experience | a non-admitted provider cannot be bound |
| typed result and evidence URI | results and graph | memory, coordination, conformance | unverifiable claims remain `NOT VERIFIED` |
| approved promotion | memory and learning | roles and governance, reference architecture | raw or sensitive content remains project-local |
| immutable revision reference | versioned execution | every mutable policy surface | missing revision pin rejects run creation |
| grant and data policy | roles and governance | execution, memory, reference scenario | external effect or retention is denied by default |
| scenario trace | operator experience | conformance, adoption | an untraced normative behavior blocks acceptance |

Exact shapes are owned by the corresponding schema and specification documents.

## Deferred beyond 0.1.0

Runtime services, SDKs, CLIs, UIs, deployment, provider hosting, model routing,
billing, public registries and marketplace behavior are out of scope and have no
module in this map.
