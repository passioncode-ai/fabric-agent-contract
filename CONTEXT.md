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

**Delegation grant**: A **Standing grant** that names an `audience` — the one agent its principal may
call — with that agent's `capabilities` and an `effectCeiling`. The hub mints **Delegation tokens**
only under one (DEC-0039).

**Delegation token**: A JWT of at most ten minutes, signed by the estate hub (Ed25519), that names the
**Principal**, the **Actor chain**, exactly one callee, the capabilities and effect ceiling, and the
grant a call is under (`fabric-delegation/0.1`, DEC-0039). The callee checks it offline against the
estate's published keys. Not the service's descriptor token, which stays the host's.

**Principal**: In delegation, the person on whose behalf the work runs: the operator, or an external
person under a share grant (a token's `sub`). A grant's `principal` field names who the grant is
given to; for an agent or session grant that is the actor: `urn:agent:<agent id>` names the agent whose id is
the token's outermost `act.sub`, and `urn:session:<agent id>:<session id>` names that agent in that session
(its `act.session`).

**Actor chain**: The agents acting for the **Principal**, the one calling now outermost and each
earlier one nested inside (a token's `act`, RFC 8693), at most four deep.

**Approval document**: `approval/1`, a JWS by the estate key that one person approved one action — bound
by the SHA-256 of its RFC 8785 canonical form — for one callee, used once, within 24 hours (DEC-0039).

**Grant projection**: The hub's copy of each grant it holds, one `<meta.id>.json` file in the standing-grant
shape at its latest revision, in the directory its hub document names `grantsDir` (0600 in 0700, written
atomically). The meter beside the hub reads the grant a verified token names from it; the file authorises
nothing alone (DL-23, DL-24, DEC-0041).

**Task claim**: A **Delegation token**'s optional `task`, the issuing host's task the work runs under. The meter
keys a grant's `task` window on it; else on the first `session` met walking the meter token's actor chain from
its outermost actor; else on the grant itself (`grant:<ref>`), never on a `jti`. An onward token keeps it or
drops it, never replaces it (DEC-0041).

**Refusal code**: One of the contract's seventeen kebab-case reasons a callee, the hub or the meter
refuses (`error.code`, DEC-0039); a product's own words go in `error.data`.

**Session handoff**: The folder a host writes for one coding-agent session before its first turn —
`handoff.json`, `context.md`, `mcp.json`, optionally `brief.md` and `task.md` — in its user data, never in a
repository; format `session-handoff/1` (DEC-0042). Not Fabric's `execution-packet/1`, the integrity layer under it.

**Fabric's button**: The floating button a dashboard MAY show that opens Fabric on that product through
a **Fabric link**, and says how to get Fabric when it is not installed (DEC-0040).

**Fabric link**: A `fabric://chat` or `fabric://session/new` URL naming a service, a project or a
runner by id. Following one opens a view in Fabric and nothing else; it never carries a secret
(DEC-0040).

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

**Dashboard floor**: The narrowest viewport, in CSS pixels, at which a dashboard page is fully
usable without document-level horizontal scrolling: 360, or the larger `minWidth` it declares
(`fabric-dashboard/0.1`, DEC-0036). The *host floor*, `max(480, minWidth)`, is the width a host
keeps for the page when its own panes grow.

**Appearance carrier**: The cookie `fabric_appearance` (`v=1&scheme=…&theme=…`) a host sets on a
dashboard's origin so the page shows the operator's colour scheme and theme (DEC-0036, ED-8).
It carries no secret and no identity.

**Operator channel**: An agent's own messenger channel to its operator
(`fabric-operator-channel/0.1`, DEC-0034), first over the Telegram Bot API: it sends the events
the feed asks to notify and the stops awaiting a person, whose buttons run the agent's own
operations. Off until the operator enables it; it names its bot token and never holds it. Not the
Project board's mirror.

**Link code**: The one-time code an agent issues locally and the operator types in the chat, which
binds the chat and the operator's numeric user id to an operator channel (OC-3).

**Addressed message**: In a group, a message meant for one bot: `/command@ThatBot`, a reply to
that bot's own message, or a press of its own button. A bare `/command` in a group is not
addressed. An operator channel answers nothing else in a group (OC-14, OC-15, DEC-0035).

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

**Activity telemetry**: The `fabric-activity/0.1` protocol (DEC-0030): records of when an
agent session worked, waited or idled and what each model call used, sent by a collector on a
device in batches. It carries no content and no person attribute; a person appears only as an
opaque `user.id`.

**Telemetry event**: One record of activity telemetry (`telemetry-event.schema.json`) — a
`session.interval`, a `usage.line`, a `buffer.overflow`, or a kind the reader does not know — positioned
in a stream by `(device.id, collector.id, collector.epoch, seq)`.

**Collector node**: One sequence-emitting collector instance on a device. With the device it names a
stream; its epoch is issued by the organization server at enrollment, so a reinstall starts a new
stream rather than rewinding the old one.

**Activity summary**: An `activity-summary/1` document a receiver builds from many devices' events:
cells of agent × skill × project × UTC day × outcome, with no person dimension.

**Access log**: An `access-log/1` document: who read which scope of one subject's data — keyed by
their user id or by a device bound to them — when and why, readable by that subject.

**Device**: A computer enrolled with an organization server under `fabric-device/0.1` (DEC-0031):
a hardware-bound short-lived certificate that also attributes everything it sends, a server-issued
stream epoch, signed policy layers and periodic check-ins.

**Policy layer**: One `device-policy` document from `mdm`, `server` or `user`; precedence is in that
order, and a locked key is never overridden by a lower layer.

**Interop**: The `fabric-interop/0.1` extension: how agents are called over MCP —
capabilities as tools, jobs, awaiting a choice, trace context and the hub.

**Job**: Work a capability call started that may outlive the request, reached by a
stable job id through an MCP Task or `fabric.job.get` / `fabric.job.cancel`.

**Trace context**: The W3C `traceparent` (and optional `tracestate`) every call
carries in `_meta`, so that all the calls made for one run form one trace.

**Hub**: The host's MCP surface through which one agent reaches another
(`agent.call`); it enforces access, mints the callee's credential and records one
span per hop. Since DEC-0039 it is the estate's only issuer of **Delegation tokens**, not the only
route: a call carrying a token goes direct, and a call the hub forwards carries the token in
`Fabric-Delegation`.

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
- A **Device** hosts one or more **Collector nodes**; each emits **Telemetry events** in its own
  stream, and a receiver aggregates many devices' events into an **Activity summary** without a
  person dimension.
- Every read of a subject's raw telemetry is an entry in that subject's **Access log**.
- A **Pipeline** stage binds a **Capability**; the **Provider** serving it is resolved
  to one admitted **Binding** when a run starts.
- Every call routed through the **Hub** carries **Trace context**; a **Job** keeps its
  id across restarts of the agent that owns it.
- The hub issues a **Delegation token** under a **Delegation grant**; the call goes direct to the
  callee, which acts for the token's **Principal** and names the outermost actor of its **Actor
  chain** as its caller. An onward call's token adds one actor and narrows, never widens.

## Flagged ambiguities

- A2A `AgentSkill` is a remote capability advertisement, not an Agent Skills
  `SKILL.md` instruction package. Contract documents must qualify the term.
- `Product manager` replaces Fabric's earlier `project manager` term: exactly one
  product manager owns each project's backlog and execution graph.
- `Runtime` and `model` are separate concerns. Contract `0.1.0` selects a runtime;
  model selection remains internal to the agent.
- `Activity event` (a service's events feed, `fabric-service/0.1`) and **Telemetry event**
  (`fabric-activity/0.1`, schema `telemetry-event`) are different records: the first is one sentence
  a service tells its operator, the second a measured interval or call. Specifications qualify which
  one they mean.
- A **Collector node** is not a work-graph node: `run.task` names the latter.
