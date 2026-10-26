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

### JTBD-08: Use an agent's dashboard beside my console, whatever room it gets

- **Statement:** When I open an agent's dashboard inside my host with the agent console beside it, I want the page to stay usable however wide I drag the console, and to look the way I chose in the host, so I can work in both without hunting for a lost menu or a clashing theme.
- **Personas:** P-02
- **Type:** functional, emotional
- **Forces:** push: the page narrows until its navigation disappears; pull: one floor every page keeps and one appearance choice for every page; anxiety: a page that breaks silently, or a theme that half applies; habit: open the dashboard in a separate browser window.
- **Success metric:** at every console width the host allows, every primary destination of the page stays reachable without sideways scrolling, and a page applies exactly the appearance fields it declared.

### JTBD-09: Follow what my agents ask of each Project

- **Statement:** When one of my agents asks another Project for something, I want to read the request and its state on the Project board, so I can see what is waiting, what happened and what is unknown without asking each agent.
- **Personas:** P-02
- **Type:** functional
- **Forces:** push: requests buried in chats and logs; pull: one board with each request's state; anxiety: a request reported done that never happened; habit: ask each agent in its own session.
- **Success metric:** every request between Projects shows its request state and effect state separately, and a lost result shows as `outcome_unknown`, never as done.

### JTBD-10: Bring my own machines into one network

- **Statement:** When I get another machine, I want to add it to my network with a code and my passkey, so my agents can run and move between my machines without hand-made files or copied keys.
- **Personas:** P-02
- **Type:** functional
- **Forces:** push: keys copied by hand and machines that trust whoever reaches them first; pull: one confirmation on two screens and one passkey; anxiety: a stranger's machine joining in the middle, or a lost machine staying in; habit: SSH keys and shared secrets pasted between machines.
- **Success metric:** a machine joins only after the person confirmed a code shown on both screens and signed with the passkey, and a removed machine is turned away within one revision.

### JTBD-11: See what each of my agents uses, and where a chain breaks

- **Statement:** When one of my agents fails because something it calls is down, I want to see what it uses (other agents' capabilities, models, connectors, stores, channels) and which of those is failing, so I can find the broken link without reading every agent's logs.
- **Personas:** P-02
- **Type:** functional
- **Forces:** push: an agent reports "degraded" with no word on what it depends on; pull: one map built from every agent's own declaration; anxiety: a map that shows a key or a password, or one built from a declaration that is wrong; habit: reading each agent's README and logs.
- **Success metric:** every agent that declares its connections shows each one with its state, a connection whose id a `degraded[].source` names is marked failing, and an invalid declaration shows nothing of itself and says why.

### JTBD-12: Find an agent I may call, and know when it is busy

- **Statement:** When I or an agent of mine needs another agent, on my machines or in my organization, I want to find it and, once I call, to know whether my call waits and for how long, so I can find it without asking around and without a burst of calls failing for nothing.
- **Personas:** P-02
- **Type:** functional
- **Forces:** push: agents spread over machines and organizations nobody can list; one caller's batch blocks everyone; pull: one list derived from what already grants access, a queue that tells each caller roughly where it stands; anxiety: a list that shows another organization's or another person's agents, a queue that drops work; habit: asking on the board which agent does what.
- **Success metric:** the owner's directory lists every agent once per context with unlisted ones marked, a member sees only the organization's listed agents, a waiting job reads its place, a full queue says when to start again, and a load panel shows waiting and running jobs per context.

### JTBD-13: Call an agent on another of my machines, within what each machine may do

- **Statement:** When an agent on one of my machines needs an agent on another of my machines, I want the call to go through without a token or an approval, and a machine I keep only for reading to hold no agent placement, no secret and no hub key, and to send or take no call over the relay that changes anything, so I can spread work over my machines without opening them to each other.
- **Personas:** P-02
- **Type:** functional
- **Forces:** push: a call between my own machines needs the same tokens as a stranger's; a spare laptop holds secrets it never uses; pull: one signed record that says what each machine may do; anxiety: a relay or an outsider reading my calls, a revoked machine still calling; habit: copying files and keys by hand.
- **Success metric:** a call from a machine my current record lists runs with no token; a call that changes something to or from a `view` machine is refused `profile-forbids`; the relay reads no call; a machine my delta revoked is not T1.

### JTBD-14: Give my organization's agents narrow credentials, and see every call between them

- **Statement:** When an agent that works for my organization needs a credential (a token for one DNS zone, a model key with a ceiling), I want it to ask, me or my policy to decide, and the value to arrive sealed into my organization's context on that machine only, every request and issue recorded by name, and every call between agents recorded without anyone's prompts or outputs, so I can hand out access without pasting keys and still know who called whom.
- **Personas:** P-02
- **Type:** functional
- **Forces:** push: keys pasted into chats and `.env` files, one shared key for every agent, no record of which agent called which; pull: one request, one decision, one sealed value that ends by itself; anxiety: a value landing in a person's own context, a relay or a server reading it, a leaver keeping access; habit: creating keys by hand at each provider.
- **Success metric:** a requested credential reaches only the requesting agent's organization instance, sealed, and ends at most 30 days after it was issued; the server's ledger lists it by name and never by value; every call between agents in the organization's context leaves one record with no person, argument or output.

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
| 4 | Proceed | sees an agent spend within a standing grant without asking | the usage report by grant | 4 | an agent asks again for what a grant already allows | the agent checks the record and cites the receipt (priority 9) |

### JRN-07: Operator — a dashboard beside the console (JTBD-08)

| # | Stage | User action | Touchpoint | Emotion (1-5) | Pain | Opportunity |
|---|---|---|---|---|---|---|
| 1 | Open | opens an agent's dashboard in the host's pane | Fabric Dashboards | 4 | the page assumes a full window | a 360 px page floor and reachable navigation (priority 9) |
| 2 | Widen | drags the console wider | the host's pane divider | 2 | the page shrinks until its menu disappears | a host floor of `max(480, minWidth)` the console stops at (priority 9) |
| 3 | Choose | picks a colour scheme and a theme in the host | the host's appearance picker | 4 | each page keeps its own look | one carrier the declaring pages apply (priority 7) |
| 4 | Mismatch | opens a page that declares less, or declares wrongly | the host's pane | 3 | a theme half applied, or a page squeezed by a bad declaration | the page applies only what it declared; an invalid declaration counts as none (priority 8) |

### JRN-08: Operator — a request on the Project board (JTBD-09)

| # | Stage | User action | Touchpoint | Emotion (1-5) | Pain | Opportunity |
|---|---|---|---|---|---|---|
| 1 | Notice | sees a new request to one of the Projects | the Project board | 3 | a request lost in a chat | one thread per request, fixed participants (priority 8) |
| 2 | Follow | reads its request state and effect state | the board thread | 4 | "done" inferred from a delivery or a read mark | two separate facts, each set only by its operation (priority 9) |
| 3 | Lost result | finds a request whose result was lost | the board thread | 2 | an effect reported as done or silently retried, or a request stuck forever because its responder is gone | `outcome_unknown`, left only by an observed reconciliation, which the operator gives as the estate owner when no responder holds the slot, shown as the owner's (priority 9) |
| 4 | Unlist | keeps a Project out of other agents' lookups | the host's Project settings | 3 | every agent of the estate can find a Project the operator keeps to itself | an unlisting that hides it from discovery only, never from a sender that knows its id (priority 6) |

### JRN-09: Operator — my machines as one network (JTBD-10)

| # | Stage | User action | Touchpoint | Emotion (1-5) | Pain | Opportunity |
|---|---|---|---|---|---|---|
| 1 | Create | creates the network on a first machine | Fabric, "Create my network" | 3 | no record says which machines are mine | revision 1 signed by the passkey, the network's fingerprint shown (priority 7) |
| 2 | Add | adds a second machine, nearby or from afar | Fabric on the trusted machine, the new machine's node | 2 | a code from one key's fingerprint can be brute-forced; a stranger slips in | commit before reveal and a six-digit code over both sides' keys, nonces and the network (priority 9) |
| 3 | Remove or re-key | removes a lost machine, or replaces a machine's key | Fabric | 2 | a removed machine keeps being admitted | one revision that revokes what it drops, carried within seconds by the delta (priority 8) |
| 4 | Recover | the hub's machine goes quiet, or a passkey is lost | every machine's alert, Fabric | 1 | calls between machines stop at 72 hours with no warning; one lost passkey loses the network | an alert after 24 hours, a hub moved by one revision when lost or two when reachable, a second passkey from the start (priority 9) |

### JRN-10: Operator, what my agents use (JTBD-11)

| # | Stage | User action | Touchpoint | Emotion (1-5) | Pain | Opportunity |
|---|---|---|---|---|---|---|
| 1 | Look | opens an agent's connections in the host | Fabric Dashboards, the Connections tab | 3 | nothing says what an agent calls | one declaration per agent, read from its well-known document (priority 8) |
| 2 | Trace | follows a failing connection to the agent or connector behind it | the Connections tab | 2 | a failure reported without its source | a `degraded[].source` equal to a connection's id marks it failing (priority 9) |
| 3 | Distrust | opens an agent whose declaration is wrong | the Connections tab | 3 | half a map, or a key shown on screen | an invalid declaration shows none of itself, with its reasons; no member carries a credential (priority 8) |

### JRN-11: Operator, finding and calling agents across machines and organizations (JTBD-12)

| # | Stage | User action | Touchpoint | Emotion (1-5) | Pain | Opportunity |
|---|---|---|---|---|---|---|
| 1 | Find | looks for an agent in their estate or their organization | the hub's or the organization's directory | 3 | nobody can say which agents exist where | one directory per source, derived from placements and share registrations (priority 8) |
| 2 | Wait | calls a busy agent | the job's status message | 2 | a call fails or hangs with no word on why | `queued <position> of <length>`, and `queue-full` with when to start again (priority 9) |
| 3 | Watch | opens an agent's load | Fabric Dashboards' load panel | 3 | no sign that an agent is saturated | waiting, running, completed and failed jobs and their wait and run time per window and context (priority 7) |

### JRN-12: Operator, calling agents between their own machines (JTBD-13)

| # | Stage | User action | Touchpoint | Emotion (1-5) | Pain | Opportunity |
|---|---|---|---|---|---|---|
| 1 | Call | an agent on the laptop calls an agent on the always-on machine | the caller's job status | 3 | a token asked of a call between one person's machines | T1 from the applied record, no token, the call sealed end to end (priority 9) |
| 2 | Limit | keeps a machine for reading only | My network's machines | 3 | every machine can do everything | a `view` profile in the signed record, refused calls named `profile-forbids` (priority 8) |

### JRN-13: Administrator, credentials for agents and the record of their calls (JTBD-14)

| # | Stage | User action | Touchpoint | Emotion (1-5) | Pain | Opportunity |
|---|---|---|---|---|---|---|
| 1 | Ask | an agent asks for a token for one zone | the organization's credential queue | 3 | the agent waits for someone to paste a key | a typed request in the check-in, decided by the policy or the administrator (priority 9) |
| 2 | Deliver | the token reaches the agent's machine | the agent's vault slot | 4 | the value crosses chats and servers | sealed to the machine's key under the organization's policy key, opened only in its context (priority 9) |
| 3 | Revoke | a member leaves | the credentials issued into the organization | 2 | keys outlive the people who held them | a signed revocation per credential, deleted at once on the machine (priority 8) |
| 4 | Trace | the administrator reads who called whom | the calls between agents | 3 | no record, or one full of prompts | one call record per call, agents and outcome only (priority 7) |

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
  - Given Fabric is not installed, then the menu says "Fabric is not installed. Get it at passioncode.ai/fabric", in the page's language.
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

### ST-016: Operator keeps a dashboard usable beside a wide console

- **Story:** As P-02, I want the host to stop the console before the dashboard page gets narrower than its floor, and the page to keep every destination reachable at that width, so that widening the console never hides the page's navigation.
- **Traces:** JTBD-08, JRN-07/#1, JRN-07/#2
- **Acceptance criteria:**
  - Given a dashboard that declares `minWidth: 360`, when I drag the console wider, then the console stops growing when the page has 480 CSS pixels left.
  - Given the page at 480 CSS pixels, then every primary destination is visible or inside a visible *More* menu, and the document does not scroll sideways.
  - Given a window too narrow for both the page's floor and the panes' minimums, then the page keeps its floor layout and scrolls sideways; the host never zooms it.
- **Priority:** must
- **Status:** draft
- **Product:** unobserved

### ST-017: Operator's appearance choice reaches the pages that declare it

- **Story:** As P-02, I want a scheme and theme I choose in the host to apply to each page for exactly the fields it declared, so that no page half follows my choice.
- **Traces:** JTBD-08, JRN-07/#3, JRN-07/#4
- **Acceptance criteria:**
  - Given a page that declares `appearance: [scheme, theme]`, when I choose dark and `ocean`, then the page shows dark `ocean` and hides its own scheme and theme controls.
  - Given a page that declares only `scheme`, then it follows my scheme and keeps its own theme control.
  - Given a page that declares no `appearance`, or whose declaration is invalid, then it takes nothing from the host's cookie and follows the system colour scheme unless I set the page's own control, and the host treats an invalid declaration as not declared and reports it.
- **Priority:** should
- **Status:** draft
- **Product:** unobserved

### ST-018: An agent finds a standing grant and proceeds without asking

- **Story:** As P-02, I want an agent whose spend a standing grant already allows to check the record and go on, so that I am asked only about what no record allows.
- **Traces:** JTBD-07, JRN-06/#4
- **Acceptance criteria:**
  - Given a standing grant with a limit the spend fits, when the agent checks, then the registry answers `allowed` with a receipt and reserves the amount, and the agent proceeds without a question.
  - Given the usage report, then the spend appears under the grant with the receipt it settles.
  - Given a check that is denied, then the agent relays the refusal code unchanged and files at most one approval request.
- **Priority:** must
- **Status:** draft
- **Product:** unobserved

### ST-019: Operator restores settings after the data directory was lost

- **Story:** As P-02, I want a service whose data directory was lost to restore what I decided from its settings backup, adding and never overwriting, so that a purge or a bad migration costs me none of my decisions.
- **Traces:** JTBD-03, JRN-02/#5
- **Acceptance criteria:**
  - Given a fresh database and an intact snapshot with content, when the service starts, then it restores from the newest such snapshot and names any damaged one it skipped.
  - Given a database that already holds records, when I choose a snapshot, then a preview shows what each table would gain and what would be dropped, defaulted or refused, and nothing is applied until I apply it.
  - Given a row the database refuses, then the report names it with its key and reason and does not count it as inserted.
- **Priority:** should
- **Status:** draft
- **Product:** unobserved

### ST-020: Operator follows a request on the Project board

- **Story:** As P-02, I want each request between Projects to show its request state and its effect state, so that I know what happened and what is unknown.
- **Traces:** JTBD-09, JRN-08/#1, JRN-08/#2, JRN-08/#3
- **Acceptance criteria:**
  - Given a request sent to a Project's capability, when the responder accepts and completes it, then the thread shows `accepted`, then `completed` with an observed result.
  - Given a request whose result was lost after its effect began, then the thread shows `outcome_unknown`, and only an observed reconciliation settles it.
  - Given such a request whose slot no responder holds, when the operator settles it with a summary of what they observed, then the thread shows it `completed` or `failed_known`, settled by the owner; without a summary it stays `outcome_unknown`, and it can never be closed as cancelled.
  - Given a deadline that passes before anyone accepts, then the request shows `expired`; accepted work is held, not expired.
- **Priority:** should
- **Status:** draft
- **Product:** unobserved

### ST-021: Operator sees what a second copy of a service did

- **Story:** As P-02, I want a second copy of a running service to leave the first one alone and to say what it did, so that a duplicate start never costs me an outage or a restart loop.
- **Traces:** JTBD-03, JRN-02/#3
- **Acceptance criteria:**
  - Given a service running, when I start a second copy by hand, then it exits at once with one sentence naming the running copy's pid (or saying it is unknown) and changes nothing.
  - Given a service running, when its supervisor starts a second copy marked as supervised, then that copy waits up to 300 s touching nothing, the running copy keeps answering, and the host never shows an outage.
  - Given launchd supervises it, then the host lists the waiting copy as two copies (`duplicate`); given the Task Scheduler, then the host shows the running copy as ready and nothing of the waiting one.
- **Priority:** should
- **Status:** draft
- **Product:** unobserved

### ST-022: Operator unlists a Project from the project directory

- **Story:** As P-02, I want to keep a Project out of the project directory, so that the agents of my estate do not discover it, while a sender that already works with it still reaches it.
- **Traces:** JTBD-09, JRN-08/#4
- **Acceptance criteria:**
  - Given a Project I unlisted, when any session of the estate reads `com.directory`, then no page and no capability filter lists it.
  - Given a sender that already knows the Project's id, when it submits a request to it, then the board takes the request as for a listed Project; unlisting refuses no message.
  - Given a restore of the estate, then the Project is still unlisted.
- **Priority:** could
- **Status:** draft
- **Product:** unobserved

### ST-023: Operator adds a machine to their network

- **Story:** As P-02, I want to add a machine to my network by confirming a code on both screens and signing with my passkey, so that only the machine in front of me joins.
- **Traces:** JTBD-10, JRN-09/#2
- **Acceptance criteria:**
  - Given a new machine and a trusted one, when both show the same six-digit code and I sign, then the next revision lists the new machine with exactly the keys it revealed.
  - Given codes that differ, when I say so, then nothing is signed and the attempt cannot be resumed; a new attempt starts with new nonces.
  - Given a server with no screen, when I give it Fabric's enroll token through stdin or a private file, then it binds its key once and a second use of the token is refused and logged; it joins only when I sign the revision, after Fabric shows the fingerprint of the key it is about to list and I compare it with the one the server printed (a mismatch: I sign nothing and revoke the token).
- **Priority:** must
- **Status:** draft
- **Product:** unobserved

### ST-024: Operator creates their network

- **Story:** As P-02, I want to create my network on a first machine with my passkey, so that later machines can join it and every screen names it the same way.
- **Traces:** JTBD-10, JRN-09/#1
- **Acceptance criteria:**
  - Given a first machine, when I create my network and sign with my passkey, then revision 1 lists my passkeys (a second one on another authenticator, or one after Fabric tells me that losing it loses the network) and this machine, and the machine shows the network's fingerprint.
  - Given the always-on machine, when I create the network on it, then revision 1 also certifies its hub key; on another machine, the hub key comes with the revision that adds the always-on one.
  - Given a cancelled passkey prompt, then nothing is signed and no machine pins anything.
- **Priority:** must
- **Status:** draft
- **Product:** unobserved

### ST-025: Operator removes a machine or replaces its key

- **Story:** As P-02, I want to remove a machine I lost, or replace a machine's key, with one signed revision, so that the old machine or key is turned away everywhere within seconds.
- **Traces:** JTBD-10, JRN-09/#3
- **Acceptance criteria:**
  - Given a machine I remove, when I sign, then the revision revokes the machine and the relay turns it away; given the hub's machine, "Remove" moves the hub first (ST-032).
  - Given a machine whose key I replace, when it pairs again under its id and I sign, then the revision lists the new keys and revokes the old ones by their key references, and a session or envelope under the old key is refused.
  - Given a network of one machine, when I replace its key, then I sign on the machine itself, with no pairing.
- **Priority:** should
- **Status:** draft
- **Product:** unobserved

### ST-032: Operator moves the hub, or recovers from a lost passkey

- **Story:** As P-02, I want to hear when my machine has not heard from the hub for a day and move the hub, and to keep my network when I lose a passkey, so that no single machine or authenticator holds my network hostage.
- **Traces:** JTBD-10, JRN-09/#4
- **Acceptance criteria:**
  - Given a record that certifies a hub key and a machine whose last heartbeat is more than 24 hours old, then it tells me at once the hours since, and past 72 hours that calls between machines have stopped; given no readable heartbeat, it tells me that it has none and that calls between machines have stopped; given a clock it cannot read, it says so and offers no move.
  - Given that alert, when the machine reconnects to the estate's relay and the latest heartbeat it then holds is still more than 24 hours old (or none), then it offers to move the hub; given a hub machine I retire or replace, "Move the hub" on its row starts a planned move by DL-15; given a hub machine I declare lost, "Remove" on its row moves the hub in one revision even while it still sends heartbeats.
  - Given a lost hub and an always-on `full` machine caught up with the relay, when I sign, then one revision certifies its new hub key, revokes the old one and the lost machine, and anchors the delta once every reader of the record is pinned at or after DEC-0107; given a reachable hub, two revisions follow DL-15.
  - Given two passkeys in my network and one lost, when I sign with the other, then the lost one is removed and revoked and a new one added; given one passkey, Fabric tells me before I create the network that losing it loses the network.
- **Priority:** must
- **Status:** draft
- **Product:** unobserved

### ST-026: Operator sees what an agent uses and which connection fails

- **Story:** As P-02, I want each agent's declared connections, with the failing ones marked, so that I can find where a chain of agents breaks.
- **Traces:** JTBD-11, JRN-10/#1, JRN-10/#2, JRN-10/#3
- **Acceptance criteria:**
  - Given an agent whose well-known document declares its connections, when the host reads it, then each connection is shown with its kind, target and state.
  - Given a `degraded[]` entry whose `source` equals a connection's id, when the host reads the document, then that connection is marked failing; a source equal only to a target marks no connection (a host may show it as a failing part of its own).
  - Given a declaration that is invalid against its schema, names an id twice or carries a credential of a shape the connections page lists in any member, when the host reads it, then none of it is shown and the reasons are.
- **Priority:** should
- **Status:** draft
- **Product:** unobserved


### ST-027: Operator finds the agents of their estate and their organization

- **Story:** As P-02, I want one list of the agents I may find, so that I find the right one without asking where it runs.
- **Traces:** JTBD-12, JRN-11/#1
- **Acceptance criteria:**
  - Given an estate record with placements on two machines, when the hub derives the owner's directory, then each agent appears once per context and an agent the owner unlisted appears marked as unlisted.
  - Given an organization with an active share registration and an agent on its own machine, when a member reads its directory, then both appear unless the organization unlisted one; an administrator sees the unlisted one marked.
  - Given a registration that was withdrawn or whose window has not started or has ended, when the directory is derived, then that agent is absent.
- **Priority:** should
- **Status:** draft
- **Product:** unobserved

### ST-028: A caller learns its place in a busy agent's queue, or when to start again

- **Story:** As P-02, I want a call to a busy agent to wait in line with an estimate of its place shown, or to be refused with a time to start again, so that a burst of calls neither fails for nothing nor runs twice.
- **Traces:** JTBD-12, JRN-11/#2
- **Acceptance criteria:**
  - Given an agent at its concurrency limit, when a call starts, then the job is `working` with `queued <position> of <length>` and the caller polls it as any working job.
  - Given two callers, one with several jobs running, when a slot frees, then the job of the caller running fewer starts.
  - Given a queue at `queueMax` and no slot this job could take, when a call starts, then it is refused with `queue-full` and `retryAfterSeconds`, nothing stored, and a start under the same key after that time is admitted again by the same rule (on a direct call; through Fabric's hub before CO-376 the caller sees `product-error`).
- **Priority:** should
- **Status:** draft
- **Product:** unobserved

### ST-029: Operator sees how busy an agent is

- **Story:** As P-02, I want each agent's waiting and running jobs and their wait and run time per context, so that I see an agent that is saturated before its callers complain.
- **Traces:** JTBD-12, JRN-11/#3
- **Acceptance criteria:**
  - Given a service that declares the load extension, when the host reads its report, then each window shows queued, running, completed and failed jobs per context with p50 and p95 times.
  - Given a declaration that is not its schema's, when the host reads the well-known document, then it treats the load as not declared and says why.
  - Given a report, then no person, caller, prompt, output or job id is in it.
- **Priority:** should
- **Status:** draft
- **Product:** unobserved

### ST-030: An agent calls an agent on another of the owner's machines

- **Story:** As P-02, I want an agent on one of my machines to call an agent on another over the relay with no token, so that my machines work together and nothing between them reads the call.
- **Traces:** JTBD-13, JRN-12/#1
- **Acceptance criteria:**
  - Given a current delta and a record that lists both machines, when a sealed call arrives, then the node places its sender in T1, opens the call and runs it without a token.
  - Given a delta that is not current, or a sender the record or the delta revokes, when a call arrives, then it is refused (`unknown-state` or `unauthenticated`), not answered, and nothing runs.
  - Given a sealed call copied into another relay message, when the node opens it, then it does not open (`cannot-open`) and is not answered.
- **Priority:** must
- **Status:** draft
- **Product:** unobserved

### ST-031: Operator keeps a machine for reading only

- **Story:** As P-02, I want to mark a machine `view` in my network, so that it holds no agent placement, no secret and no hub key, and sends or takes no call over the relay that changes anything.
- **Traces:** JTBD-13, JRN-12/#2
- **Acceptance criteria:**
  - Given a revision that marks a machine `view`, when it carries a placement, a secret or the hub key for that machine, then the revision is refused (`FAC-SEM-134`).
  - Given a `view` machine, when a full machine calls it with a capability whose effect is not `none`, then the call is refused `profile-forbids`; a read and the job tools pass.
  - Given a record written before profiles, when a node reads it, then every machine reads as `full`.
- **Priority:** should
- **Status:** draft
- **Product:** unobserved

### ST-033: An agent asks for a narrow credential and gets it in its organization's context

- **Story:** As P-02 administering an organization, I want an agent in it to ask for a narrow credential and receive it sealed into the organization's context on its machine, so that no key is pasted by hand and none lands in a person's own context.
- **Traces:** JTBD-14, JRN-13/#1, JRN-13/#2, JRN-13/#3
- **Acceptance criteria:**
  - Given an agent in `org:<id>`, when its node sends `credential-request/1`, then the request names that context, at most 30 days, and a reason with no path or credential (`FAC-SEM-138`).
  - Given an issued decision, when the envelope arrives, then the node opens it only when it answers a request it sent, under a key of the organization's current policy key set, into that context's vault slot, and deletes it at `credentialExpiresAt` (`FAC-SEM-139`).
  - Given a revocation signed by the organization, when the node applies it, then the value of the request it names is deleted and its mark kept as revoked, so the envelope never opens again.
  - Given two of my own machines, when one sends the estate's digest key to the other, then it travels in the personal profile, refused from or to a `view` machine.
- **Priority:** must
- **Status:** draft
- **Product:** unobserved

### ST-034: Administrator sees every call between agents in the organization

- **Story:** As P-02, I want one record per call between agents in my organization's context, so that I know who called whom, when, how it ended and what it cost, without seeing anyone's prompts or outputs.
- **Traces:** JTBD-14, JRN-13/#4
- **Acceptance criteria:**
  - Given a call answered or refused, when the callee's node records it, then `call-record/1` names the two agents, the context, the capability, the times, the outcome and the cost, and no person, argument or output (`FAC-SEM-140`).
  - Given a call the callee queued as a job, when the job reaches a final state, then the callee writes one `call-record/1` for it, and none for the caller's `fabric.job.get` polls.
  - Given a member whose acknowledged notice does not name agent calls, when the server answers a check-in with `callRecordsAccepted: false`, then their node sends no call record to the organization.
- **Priority:** should
- **Status:** draft
- **Product:** unobserved

### ST-035: Operator tells their agent to take a step the dashboard offers

- **Story:** As P-02, I want to tell my own agent "approve that" and have the service take it as my decision, so that I never have to open a dashboard for a step my agent can take for me.
- **Traces:** JTBD-07, JRN-06/#3
- **Acceptance criteria:**
  - Given a service that declares an action `relayed`, when my agent calls its tool from my machine with my decision naming the action and quoting me, then the service takes it as my decision and its audit names the agent it authenticated (`actionDecision`, DEC-0121).
  - Given my agent calls without my decision, when the service answers `operator-decision-required`, then the agent asks me and calls again with my answer quoted.
  - Given a step only I can take (a sign-in, a consent, a payment, a secret, a passkey signature, spend above a limit), when my agent calls it, then the service answers `human-step-required` with the link to that step.
- **Priority:** must
- **Status:** draft
- **Product:** unobserved

### ST-036: Operator opens a service's page from an agent, a notification or Fabric

- **Story:** As P-02, I want every link to one of my services' pages to open inside Fabric Dashboards, signed in, so that I never land on a browser page that asks me to sign in or shows the service outside my host.
- **Traces:** JTBD-06, JRN-05/#3
- **Acceptance criteria:**
  - Given Fabric Dashboards is installed, when an agent, a tool answer or a completion message hands me a service's page, then it hands me the `open_link` and the page opens in Fabric Dashboards (PL-1, DEC-0123).
  - Given Fabric Dashboards is installed but did not open the page, then I am told it failed and no browser opens in its place (PL-3).
  - Given Fabric Dashboards is not installed, or cannot run on my system, then the page opens at the service's own address, read from its descriptor (PL-3).
- **Priority:** must
- **Status:** draft
- **Product:** unobserved

### ST-037: Operator gives a task once, and the agents it reaches do not ask again

- **Story:** As P-02, I want a task I give one agent to carry my instruction to every agent it engages, so that I am not asked again for what I already decided and am asked only for what my words did not cover.
- **Traces:** JTBD-07, JRN-06/#3
- **Acceptance criteria:**
  - Given I tell my developer agent "run the research on competitors' prices", when it engages the research agent, then the research agent runs the paid research within my project's money limits without asking me and records my words, the task and the chain (`mandateCovers`, DEC-0125).
  - Given the research would cost more than an amount I named, or reach a capability, an effect or a project my words do not name, when the research agent is called, then it refuses with the part not covered and only that part is put to me.
  - Given I approve a change in one agent's chat and another of my agents holds the key, when the first relays my words verbatim with when and where I said them and the scope, from one of my own projects or sessions, then the second acts without asking me again and records my words and where I said them (DEC-0126 OA-1 to OA-7).
  - Given a sign-in, a consent, a payment, a typed secret or spend above a limit, then my mandate never covers it and the step comes to me.
- **Priority:** must
- **Status:** draft
- **Product:** unobserved


### ST-038: Member joins an organization by their own act, and their Fabric trusts only what the organization signed

- **Story:** As P-03, I want to join an organization by my own passkey and have my Fabric trust my membership only from what the organization signed, so that no administrator admits me behind my back, any organization server works, and nothing of mine leaves for the organization beyond what is listed.
- **Traces:** JTBD-04, JRN-03/#1
- **Acceptance criteria:**
  - Given I join an organization, when my Fabric shows me its server and root key, the fingerprint matches the one in the administrator's invitation and I confirm with my passkey, then the organization is pinned in my estate record and no administrator's acceptance is asked; a mismatch or an invitation without a fingerprint pins nothing and says why (Fabric ADR-0178 point 6) (`FAC-SEM-147`, DEC-0127 OM-2).
  - Given the organization's server sends my Fabric a membership attestation, when it verifies under the pinned root's key set, for my organization and my audience, then my Fabric trusts the role it states; a forged, revoked-key, other-organization or expired one is refused with the reason (`verifyOrgMembership`, OM-4).
  - Given my membership ends, then my Fabric drafts the revision that revokes the share grants of that organization's context and drops its pin, and once my passkey signs it my device's enrollment ends, the organization's locks lift and nothing more is sent; given only the attestation expired, it authorises nothing new until a fresh one arrives (OM-5, OM-6).
  - Given any of my work, then only what OM-7 lists ever leaves my Fabric for the organization.
- **Priority:** must
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
| Distribution | public Git repository, pinned by release tag or commit |
| Purchase surface | none |
| Acquisition | none |
| Forms present | no executable forms in v0.1 |
| Analytics present | no |
| Personalization | none |
| Engagement mechanics | none |
