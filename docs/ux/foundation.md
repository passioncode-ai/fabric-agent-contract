<!-- Managed with super-ux (ux-contract v4). The WHY layer: update when the understanding of users changes. -->

# UX foundation

The evidence source is the operator design interview completed 2026-08-26.
Personas are confirmed for the private v0.1 contract; outcome signals remain
unobserved until an external author integrates a provider.

## 1. Personas

### P-01: Independent agent author

Builds an agent or capability provider outside Fabric. Understands the chosen
transport but should not need Fabric's runtime internals to discover whether the
provider is compatible.

- **Status:** confirmed

### P-02: Project operator

Owns a private Fabric estate and configures projects, providers, execution
contexts, account pools and authorization. Needs reproducible changes and safe
delegation across several agents and developers.

- **Status:** confirmed

## 2. Jobs to Be Done

### JTBD-01: Prove provider compatibility

- **Statement:** When I want my independently developed agent to work in Fabric, I want a finite, machine-checkable compatibility path, so I can integrate it without depending on undocumented host internals.
- **Personas:** P-01
- **Type:** functional
- **Forces:** push: bespoke integrations drift; pull: one reusable contract; anxiety: passing schema validation may still hide semantic failure; habit: copy a host-specific adapter and debug it live.
- **Success metric:** a zero-context author can produce a manifest and receives a gate-by-gate admission report with no secret disclosure.

### JTBD-02: Bind the right provider safely

- **Statement:** When a project needs a capability, I want to choose an admitted provider with explicit context and authority, so I can change implementations without changing the project's intent or exposing unrelated credentials.
- **Personas:** P-02
- **Type:** functional
- **Forces:** push: implicit defaults leak across projects; pull: versioned project binding; anxiety: a provider may overclaim or act externally; habit: rely on ambient shell state.
- **Success metric:** every run resolves to immutable provider, context, policy and grant revisions, and denied actions carry a recoverable reason.

### JTBD-03: Recover without losing provenance

- **Statement:** When a provider, account or configuration fails, I want to replace or roll back it without rewriting history, so I can restore work and still explain every result.
- **Personas:** P-02
- **Type:** functional
- **Forces:** push: mutable settings make failures irreproducible; pull: content-addressed revisions and evidence; anxiety: automatic fallback may silently change identity; habit: edit the current config in place.
- **Success metric:** recovery creates an observable new revision or approved pool switch while prior runs remain reproducible.

## 3. Customer journeys

### JRN-01: Author — prove provider compatibility (JTBD-01)

| # | Stage | User action | Touchpoint | Emotion (1-5) | Pain | Opportunity |
|---|---|---|---|---|---|---|
| 1 | Discover | finds the contract from Fabric | README and profile index | 3 | unclear starting point | profile choice table (priority 9) |
| 2 | Describe | writes manifest and capability claims | schemas and examples | 3 | transport fields can be confused with Fabric fields | one canonical example per profile (priority 9) |
| 3 | Validate | runs conformance checks | `pnpm run check` and fixtures | 4 | a generic validation error is not actionable | JSON Pointer plus failed gate (priority 9) |
| 4 | Admit | exposes discovery and receives probes | admission lifecycle | 3 | schema success can create false confidence | separate shape, protocol and semantic verdicts (priority 9) |
| 5 | Maintain | publishes a replacement revision | versioning guide | 4 | consumers may silently drift | immutable versions and compatibility declaration (priority 6) |

### JRN-02: Operator — bind and recover (JTBD-02, JTBD-03)

| # | Stage | User action | Touchpoint | Emotion (1-5) | Pain | Opportunity |
|---|---|---|---|---|---|---|
| 1 | Inspect | compares admitted providers | admission reports | 3 | claims lack comparable proof | common trust and evidence fields (priority 9) |
| 2 | Configure | selects project defaults and agent overrides | binding/context examples | 3 | project and account boundaries are easy to blur | explicit project pool membership (priority 9) |
| 3 | Run | lets agents claim and execute work | coordination/result records | 4 | parallel writes can collide | scoped leases plus branch/worktree isolation (priority 9) |
| 4 | Diagnose | reads a failed or partial result | result and evidence envelope | 2 | success language can hide unknowns | mandatory `NOT VERIFIED` list (priority 9) |
| 5 | Recover | replaces provider, falls back account or rolls back config | version and recovery examples | 4 | recovery can erase causal history | new revisions and observable switches (priority 9) |
| 6 | Learn | approves project or global improvement | retro and promotion records | 4 | agents can reinforce their own mistake | contrast-based learning plus independent approval (priority 9) |

## 4. User stories

### ST-001: Author validates a provider

- **Story:** As P-01, I want to validate a profile manifest and examples, so that I know which compatibility gate still fails.
- **Traces:** JTBD-01, JRN-01/#2, JRN-01/#3
- **Acceptance criteria:**
  - Given a valid profile fixture, when conformance runs, then every declared schema and profile gate reports pass.
  - Given an invalid fixture, when conformance runs, then the report names the gate, instance path and recovery action.
- **Priority:** must
- **Status:** validated
- **Product:** unobserved

### ST-002: Operator admits and binds a provider

- **Story:** As P-02, I want admission and project binding to be separate, so that discovery alone grants no project access.
- **Traces:** JTBD-02, JRN-02/#1, JRN-02/#2
- **Acceptance criteria:**
  - Given a discovered provider, when identity or semantic probing has not passed, then a binding is rejected with the missing admission gate.
  - Given an admitted provider, when a binding is created, then it pins provider, capability, policy and execution-context revisions.
- **Priority:** must
- **Status:** validated
- **Product:** unobserved

### ST-003: Operator isolates project execution

- **Story:** As P-02, I want each project to have an allowed account pool and secret references only, so that agents cannot inherit unrelated accounts or ambient environment.
- **Traces:** JTBD-02, JRN-02/#2, JRN-02/#3
- **Acceptance criteria:**
  - Given an agent override, when its account is outside the project pool, then validation rejects it.
  - Given a permitted fallback, when the selected account is unavailable, then the next approved account is selected and the switch is recorded without exposing credentials.
- **Priority:** must
- **Status:** validated
- **Product:** unobserved

### ST-004: Operator recovers through immutable history

- **Story:** As P-02, I want replacement and rollback to create new revisions, so that prior runs stay reproducible.
- **Traces:** JTBD-03, JRN-02/#4, JRN-02/#5
- **Acceptance criteria:**
  - Given an older known-good revision, when rollback is approved, then a new revision cites it as its basis and the old history remains unchanged.
  - Given an unavailable provider, when replacement is selected, then new work uses a new binding revision and existing runs remain pinned.
- **Priority:** must
- **Status:** validated
- **Product:** unobserved

### ST-005: Operator governs learning

- **Story:** As P-02, I want retrospectives to propose rather than self-apply changes, so that a failed agent cannot rewrite its own rules or evaluator.
- **Traces:** JTBD-03, JRN-02/#6
- **Acceptance criteria:**
  - Given a failed attempt and verified correction, when a retro completes, then it may create a contrast-based learning proposal but cannot mutate an active revision.
  - Given a global promotion request, when independent evidence or CEO approval is absent, then the insight remains project-scoped.
- **Priority:** must
- **Status:** validated
- **Product:** unobserved

### ST-006: Operator routes terminal work through preferred runners

- **Story:** As P-02, I want each project to pin an ordered list of the terminal agents I run, so that a request is served by the first one that can serve it and I can see why the others were passed over.
- **Traces:** JTBD-02, JTBD-03, JRN-02/#2, JRN-02/#5
- **Acceptance criteria:**
  - Given a route whose first candidate only attaches, when the host holds no session of it, then the next available candidate starts and the event names why the first was passed over.
  - Given an unattended launch, when a candidate's quota basis is unknown, then it is passed over as `quota-unknown` and never runs unattended.
  - Given every candidate unavailable, when the route is walked, then the request is answered capability-unavailable with every probe result attached.
- **Priority:** must
- **Status:** validated
- **Product:** unobserved

## Design tooling

- **Figma:** disabled
- **Figma file:** none — v0.1 is Markdown and machine-readable schemas only

## Product mechanics

- **Personalization:** none
- **Engagement mechanics:** none
- **Accessibility regime:** none stated — semantic Markdown and readable Mermaid remain required

## Product profile

| Dimension | Value |
|---|---|
| Platform | web reading surface, local developer tooling |
| Money model | none |
| Distribution | private Git repository |
| Purchase surface | none |
| Acquisition | none |
| Forms present | no executable forms in v0.1 |
| Analytics present | no |
| Personalization | none |
| Engagement mechanics | none |
