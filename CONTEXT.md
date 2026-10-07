# Fabric Agent Contract language

The vocabulary used by the compatibility contract between Fabric hosts and
independently developed providers.

## Language

**Host**: The system that discovers, admits, binds, and runs providers; Fabric is
the first host. Fabric is PassionCode.ai's product, the CEO AI agent; in this contract
"Fabric" means its kernel acting as host, and this contract is what makes any agent
Fabric-compatible (names: Fabric ADR-0090).

**Provider**: An independently versioned implementation that offers one or more
capabilities through a declared protocol profile.

**Agent**: A provider that autonomously accepts an outcome and owns the internal
work needed to produce it.

**Capability provider**: A provider exposing bounded functions or data whose
input and output shapes are controlled by the host.

**Capability**: A host-owned, versioned semantic contract that may be served by
different providers.

**Binding**: The immutable capability-to-provider choice recorded for one run.

**Profile**: A normative compatibility mode, named as the manifest schema names it:
`mcp`, `a2a` or `local-runner`. An `mcp` capability is served by a capability
provider, an `a2a` one by a peer agent; those are kinds of provider, not profile
names.

**Execution context**: A versioned, secret-free description of the runtime,
account pool, shell, workspace, tools, filesystem, network, and limits made
available to an agent.

**Account pool**: The project-scoped set of runtime account profiles between
which an approved adapter may switch under a versioned fallback policy.

**Observation**: A measured fact carrying a source, time, and validity domain.

**Evidence**: A resolvable record supporting a claim within an explicit scope.

**Insight**: A derived conclusion that cites observations or evidence.

**Learning**: A versioned contrast between a failed attempt and a verified
correction, proposed by a retrospective.

**Memory Kernel**: The host control plane that authenticates memory scope,
governs canonical revisions and assembles bounded retrieval context.

**Memory ledger**: The append-only canonical store of memory revisions,
evidence links, conflicts and tombstones.

**Memory backend**: A replaceable data-plane adapter that stores rebuildable
search, embedding or graph projections and never decides access or truth.

**MemoryPack**: A bounded, cited retrieval result containing selected records,
supported conflicts, unknowns and a consistency cursor.

**Memory use trace**: An auditable record of which memory revisions influenced a
run and what feedback the consumer later supplied.

**Promotion**: The governed act that makes a project insight retrievable from
the global memory scope without copying its sources.

**Coordination lease**: A time-bounded, atomically acquired right to perform a
claimed piece of shared work.

**Write scope**: The paths or logical resources a node declares it may modify.

**Standing grant**: A named, scoped, expiring authorization for a class of
otherwise approval-bound external actions.

**Service**: A long-running agent process following the `fabric-service/0.1`
extension — on the operator's own computer, supervised by the operating system
(a **local placement**), or online at an `https` origin, supervised by its
platform (a **remote placement**, DEC-0019).

**Placement**: Where a service runs, as its descriptor declares it: `local`
(`http://127.0.0.1:<port>`, the default) or `remote` (`https://<dns-name>`). It
changes reachability, supervision and the trust anchor, never the objects a
host reads.

**Service descriptor**: The file an installer writes to announce one installed
service instance: identity, origin, token location, supervisor and paths. It
describes an installation, not a run.

**Well-known document**: The answer a running service gives about itself: build,
process, status, degraded sources and surfaces — unauthenticated for a local
placement, behind the service token for a remote one.

**Activity event**: One record in a service's events feed — when, what kind, which
level, one sentence a person can read, and optionally a subject, a link and a
request to notify the operator.

**Settings backup**: A checksummed snapshot (`fabric-settings-backup/1`) of a service's
operator decisions and bindings, kept outside its data directory. A restore only adds missing
rows. It names secrets and never holds them (DEC-0025).

**Provider entry**: The file an installer writes to announce an agent that is not
a service (`fabric-provider/0.1`): its id, its manifest and how to reach it over
MCP. Like a service descriptor, it describes an installation and grants nothing.

**Runner**: An installed coding-agent CLI a host can drive (Claude Code, Codex, …),
known from a catalogue entry that names its binaries, its version command and the
modes (drives) it can be run in. A binary no entry names is never executed.

**Runner route**: The project-pinned, ordered preference list of admitted runner
candidates for one capability served by the local-runner profile, with an
attach/spawn session policy per candidate and fallback semantics: attach to a
session the host already holds first, spawn the next available candidate
otherwise, and record every selection and switch as a **Runner route event**. It
selects which runner serves a request; it grants nothing.

**Runner route event**: The record of one walk of a runner route — a selection, a
switch of a conversation to another candidate, or an exhausted route — with the
probe result of every candidate the walk passed over.

**Interop**: The `fabric-interop/0.1` extension: how agents are called over MCP —
capabilities as tools, jobs, awaiting a choice, trace context and the hub.

**Job**: Work a capability call started that may outlive the request, reached by a
stable job id through an MCP Task or `fabric.job.get` / `fabric.job.cancel`.

**Trace context**: The W3C `traceparent` (and optional `tracestate`) every call
carries in `_meta`, so that all the calls made for one run form one trace.

**Hub**: The host's MCP surface through which one agent reaches another
(`agent.call`); it enforces access, mints the callee's credential and records one
span per hop.

**Pipeline**: A versioned graph of stages, each binding a capability or checking
the one before it (`pipeline/0.1`). A stage names a capability, never an agent.

**Checker stage**: A pipeline stage that judges its upstream output before any
effect; every effectful stage has one on every path from the start.

**Contract pin**: The one record (`fabric-contract.lock.json`) naming the contract
version and commit a consuming repository builds against.

## Relationships

- A **Host** registers many **Providers**.
- A **Provider** offers one or more **Capabilities**.
- A run pins one **Binding** per required **Capability**.
- An **Execution context** refers to an **Account pool** but never contains its credentials.
- An **Insight** cites **Observations** and **Evidence**.
- The **Memory Kernel** reads canonical revisions from the **Memory ledger** and
  rebuildable candidates from a **Memory backend**.
- A **MemoryPack** cites ledger revisions and produces a **Memory use trace**.
- A **Promotion** points to a project **Insight**; it does not copy the source record.
- A node holds a **Coordination lease** and a declared **Write scope** while it works.
- A **Service descriptor** names one **Service**; the **Service** answers a
  **Well-known document** and publishes **Activity events**. A **Service** may also be a
  **Provider**; being described grants it no project access.
- A **Provider entry** names one **Provider** that is not a **Service**; an id belongs
  to one of the two, never both.
- A **Runner route** orders admitted **Runner** candidates for one **Capability**;
  a run pins one route revision per local-runner binding, and every switch is recorded.
- A **Pipeline** stage binds a **Capability**; the **Provider** serving it is resolved
  to one admitted **Binding** when a run starts.
- Every call routed through the **Hub** carries **Trace context**; a **Job** keeps its
  id across restarts of the agent that owns it.

## Flagged ambiguities

- A2A `AgentSkill` is a remote capability advertisement, not an Agent Skills
  `SKILL.md` instruction package. Contract documents must qualify the term.
- `Product manager` replaces Fabric's earlier `project manager` term: exactly one
  product manager owns each project's backlog and execution graph.
- `Runtime` and `model` are separate concerns. Contract `0.1.0` selects a runtime;
  model selection remains internal to the agent.
