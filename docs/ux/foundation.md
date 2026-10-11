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

### P-03: Organization member with an enrolled device

Works with coding agents on a device the organization enrolled for activity telemetry (DEC-0030,
DEC-0031). Needs to know what the device reports, who read it, and which settings they may change.

- **Status:** proposed — added with DEC-0030/0031; not yet confirmed in an interview

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

### JTBD-04: Know and bound what my device reports

- **Statement:** When my device sends activity telemetry to my organization, I want to see who read my data and which settings are mine to change, so I can trust that it is used as the organization's notice says.
- **Personas:** P-03
- **Type:** functional, emotional
- **Forces:** push: telemetry nobody can see feels like surveillance; pull: a log of every read and visible locks; anxiety: data used beyond its stated purpose; habit: switch the collector off.
- **Success metric:** every read of the member's raw data or device state appears in their access log with a purpose, and a locked setting is shown as locked rather than silently ignored.

### JTBD-05: Answer my agents' stops from my phone

- **Statement:** When an agent I operate stops for my decision or has something I asked to hear about, I want it to reach me in my messenger and take my answer there, so I can keep its work moving without opening its dashboard.
- **Personas:** P-02
- **Type:** functional
- **Forces:** push: stops wait for hours unseen; pull: one press answers; anxiety: a button in a chat could spend money or let someone else decide; habit: poll each dashboard.
- **Success metric:** a stop sent to the channel is answered by one press (two for money), the same decision the dashboard would record, and nobody outside the allowlist causes an effect.

### JTBD-06: Bring Fabric to the product I am looking at

- **Statement:** When I am in one of my agents' dashboards and want to ask about it or change it, I want one press to open Fabric on that product and project, so I can continue there without finding the project again.
- **Personas:** P-02
- **Type:** functional
- **Forces:** push: switching windows and finding the project costs a minute each time; pull: a button in the corner of every product; anxiety: a link that starts work or spends money by itself; habit: copy the project name into Fabric.
- **Success metric:** from any dashboard that shows the button, Fabric opens on the right service and project in one press, starts nothing until I act, and says how to get Fabric when it is missing.

### JTBD-07: Bound what my agents spend and what outside callers do

- **Statement:** When my agents spend money or a person outside my machine calls one of them, I want to set the limits once and answer only what goes beyond them, so I can let work run without approving each step or finding a surprise on the bill.
- **Personas:** P-02
- **Type:** functional, emotional
- **Forces:** push: a fixed budget that is wrong for every project; pull: options computed from the project's own spend; anxiety: an agent that spends on one tap, or an outside caller who acts as me; habit: approve everything in chat.
- **Success metric:** a project's limit is chosen once with its reasons kept, a spend above the threshold waits for one answer that shows the amount, and an outside caller's effect happens only after an approval of that one action.

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

### JRN-03: Member — see and bound telemetry (JTBD-04)

| # | Stage | User action | Touchpoint | Emotion (1-5) | Pain | Opportunity |
|---|---|---|---|---|---|---|
| 1 | Enroll | signs in once on the device | enrollment | 3 | unclear what is collected | a notice that names purpose and retention (priority 9) |
| 2 | Adjust | changes a setting | device settings | 2 | a change silently does nothing | locked keys shown as locked, the change refused with a reason (priority 9) |
| 3 | Check | reads who read their data | access log | 3 | reads are invisible | every read with reader role and purpose (priority 9) |

### JRN-04: Operator — connect and answer an agent's channel (JTBD-05)

| # | Stage | User action | Touchpoint | Emotion (1-5) | Pain | Opportunity |
|---|---|---|---|---|---|---|
| 1 | Hear of it | reads the agent's one-time proposal | agent creation or first stop | 3 | unclear what the agent will do with a bot | four named steps, recorded answer (priority 9) |
| 2 | Link | creates a bot, stores its token by name, types the code | messenger and the agent's link command | 3 | a token pasted into a chat or a config | the token only in the secret store; a short-lived code (priority 9) |
| 3 | Decide | presses a button on a stop | messenger | 4 | a second press or a stale button doubles an action | idempotent tokens, "already decided" (priority 9) |
| 4 | Spend | confirms a paid action | messenger | 2 | money leaves on one tap | a second press showing the amount (priority 9) |

### JRN-05: Operator — from a product to Fabric and back (JTBD-06)

| # | Stage | User action | Touchpoint | Emotion (1-5) | Pain | Opportunity |
|---|---|---|---|---|---|---|
| 1 | Notice | sees Fabric's button in the corner of a dashboard | dashboard | 3 | the button hides the last row | the page leaves room at the end of its scroll (priority 7) |
| 2 | Open | chooses chat or a coding session | the button's menu | 4 | the wrong project opens | ids carried by the link, validated (priority 9) |
| 3 | Continue | works in Fabric, then opens the product page again | Fabric, Fabric Dashboards | 4 | a sign-in again | the host signs in, the link carries no secret (priority 8) |
| 4 | Missing | presses it on a computer without Fabric | the button's menu | 2 | nothing happens | one sentence with where to get Fabric (priority 8) |

### JRN-06: Operator — set limits, then answer only what exceeds them (JTBD-07)

| # | Stage | User action | Touchpoint | Emotion (1-5) | Pain | Opportunity |
|---|---|---|---|---|---|---|
| 1 | Set | chooses the project's spend policy at its first paid run | the launcher's policy choice | 3 | a number with no reason behind it | options computed from presets and recent spend, one preselected, inputs kept (priority 9) |
| 2 | Answer | answers one request for a spend above the threshold | the operator channel | 3 | the agent waits, or spends anyway | one durable request with the amount; the agent works on meanwhile (priority 9) |
| 3 | Approve | approves one action an outside caller asked for | Fabric's approval prompt | 2 | an approval that could be reused for something else | an approval bound to one action, one callee, one use (priority 9) |

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

### ST-007: Member reads who read their data

- **Story:** As P-03, I want to read every access to my raw telemetry and my device's state, so that I can see who looked and why.
- **Traces:** JTBD-04, JRN-03/#3
- **Acceptance criteria:**
  - Given an administrator read my raw events, when I open my access log, then the entry names the reader's role, the scope, the range and the purpose.
  - Given an administrator read my device's health, when I open my access log, then the entry names the device.
  - Given only summaries were read, when I open my access log, then no entry appears, because a summary carries no person.
- **Priority:** must
- **Status:** draft
- **Product:** unobserved

### ST-008: Member sees which settings are locked

- **Story:** As P-03, I want a setting the organization locked to show as locked and refuse my change, so that I know where my choice applies.
- **Traces:** JTBD-04, JRN-03/#2
- **Acceptance criteria:**
  - Given `logging.required` is locked by the server, when I try to switch logging off, then the device refuses and shows the key as locked by the server.
  - Given `x-example.banner` is an unlocked default, when I change it, then my value is the effective one.
  - Given a policy whose signature does not verify, when it arrives, then the device keeps the revision it holds.
- **Priority:** must
- **Status:** draft
- **Product:** unobserved

### ST-009: Operator links the channel and answers a stop with a button

- **Story:** As P-02, I want to bind my chat with a one-time code and answer an agent's stop with a button, so that the decision is recorded as if I made it in the dashboard.
- **Traces:** JTBD-05, JRN-04/#2, JRN-04/#3
- **Acceptance criteria:**
  - Given the channel is off, when nobody enabled it, then the agent sends nothing and its status says `off`.
  - Given a link code issued locally, when I type it in the chat within 10 minutes, then my chat and numeric user id are bound and the status says `linked`.
  - Given a stop sent with buttons, when I press one, then the agent runs the same operation its dashboard runs and removes the keyboard.
  - Given the stop was already answered in the dashboard, when I press a button, then the agent answers "already decided" and changes nothing.
  - Given someone else in the group presses, then nothing happens.
- **Priority:** must
- **Status:** draft
- **Product:** unobserved

### ST-010: Operator confirms a paid action with a second press

- **Story:** As P-02, I want an action that spends money to ask me again with the amount, so that one tap never spends.
- **Traces:** JTBD-05, JRN-04/#4
- **Acceptance criteria:**
  - Given a stop whose action spends money, when I press it, then the agent shows the amount (or "cost unknown") with a confirm button that expires within 5 minutes.
  - Given the confirm button expired, when I press it, then nothing is spent and the agent says how to ask again.
  - Given a safety stop the agent excluded, then the channel names where it is lifted instead.
- **Priority:** must
- **Status:** draft
- **Product:** unobserved

### ST-011: Operator opens Fabric from a product's dashboard

- **Story:** As P-02, I want a button in every product's dashboard that opens Fabric on that service and project, so that I can ask or start work there in one press.
- **Traces:** JTBD-06, JRN-05/#1, JRN-05/#2, JRN-05/#4
- **Acceptance criteria:**
  - Given a dashboard that knows its project, when I press the button, then a menu offers a chat with Fabric about the service and a coding session in the project.
  - Given I choose the chat, then Fabric opens the manager conversation scoped to that service and project and sends nothing.
  - Given I choose the session, then Fabric shows the project's session view and starts the runner only when I press Start.
  - Given Fabric is not installed, then the menu says "Fabric is not installed — get it at passioncode.ai/fabric".
  - Given a link with a token or a bad id, then Fabric refuses the whole link and says why.
- **Priority:** should
- **Status:** draft
- **Product:** unobserved

### ST-012: Operator chooses a project's spend policy at its first paid run

- **Story:** As P-02, I want to choose a project's spend limit once, from options computed for that project, so that its agents spend within a limit I understood.
- **Traces:** JTBD-07, JRN-06/#1
- **Acceptance criteria:**
  - Given a project with no policy, when a run would first spend money, then the launcher offers options computed from the agents' presets, the recent spend and the kind of work, names those inputs, and preselects one.
  - Given I choose "no project limit", then it is recorded as my choice and only the estate total (L0) stops spending.
  - Given a policy is recorded, then the launcher never asks again for that project.
- **Priority:** must
- **Status:** draft
- **Product:** unobserved

### ST-013: Operator answers a spend approval request

- **Story:** As P-02, I want a spend above the project's threshold to reach me once with its amount, so that I decide it while the agent goes on with other work.
- **Traces:** JTBD-07, JRN-06/#2
- **Acceptance criteria:**
  - Given a check above the auto-approve threshold, then the meter denies it with the request it filed, and the agent files no second one.
  - Given the request in the operator channel, when I confirm, then the confirmation shows the amount first (OC-6).
  - Given I do not answer, then nothing is spent on that request and the agent's other work continues.
- **Priority:** must
- **Status:** draft
- **Product:** unobserved

### ST-014: Operator approves one action for an outside caller

- **Story:** As P-02, I want an outside caller's effect to wait for my approval of that exact action, so that a share grant never lets anyone act as me beyond it.
- **Traces:** JTBD-07, JRN-06/#3
- **Acceptance criteria:**
  - Given a T2 caller whose action needs approval, then the callee refuses `approval-required` with the action's digest, and Fabric asks me with the action shown.
  - Given I approve, then Fabric signs one approval for that action and that callee, valid at most 24 hours, and the callee accepts it once.
  - Given the same approval presented again, then the callee refuses `approval-reused`.
  - Given a call from my own machine, then no approval is asked for: my instruction stands (DL-26).
- **Priority:** must
- **Status:** draft
- **Product:** unobserved

### ST-015: Operator finds a dashboard whose session ended

- **Story:** As P-02, I want a dashboard whose sign-in ended to say so and to be signed in again by its host, so that I never act on a page that silently stopped working.
- **Traces:** JTBD-06, JRN-05/#3
- **Acceptance criteria:**
  - Given 12 hours without use, or 7 days since sign-in, or a rotated descriptor token, when I open a dashboard page, then the service answers `401` with a page that explains the state.
  - Given a host showing that page, then it signs in again with a new login code and reopens the same page, at most once a minute per page.
  - Given the page's own API call answers `401`, then the host does not reload the page.
- **Priority:** should
- **Status:** draft
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
