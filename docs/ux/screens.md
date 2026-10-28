<!-- Managed with super-ux (ux-contract v4). The design map: every screen and state with its Figma frame, wireframe, code coverage, and resources. Update in the same change as any interface change; when Figma is enabled, update the frame too. -->

# Reading surfaces

## Index

| ID | Screen | Used by | Figma | Status | Coverage |
|---|---|---|---|---|---|
| SCR-01 | Profile chooser | FLW-01 | disabled | designed | none yet |
| SCR-02 | Profile contract | FLW-01 | disabled | designed | none yet |
| SCR-03 | Conformance report | FLW-01 | disabled | designed | none yet |
| SCR-04 | Admission record | FLW-01, FLW-02 | disabled | designed | none yet |
| SCR-05 | Binding contract | FLW-02, FLW-03, FLW-05 | disabled | designed | none yet |
| SCR-06 | Version history | FLW-02, FLW-03, FLW-04, FLW-05 | disabled | designed | none yet |
| SCR-07 | Result and evidence | FLW-03, FLW-04, FLW-05 | disabled | designed | none yet |
| SCR-08 | Retro record | FLW-04 | disabled | designed | none yet |
| SCR-09 | Access log | FLW-06 | disabled | proposed | none yet |
| SCR-10 | Device settings | FLW-07 | disabled | proposed | none yet |
| SCR-11 | Chat with the agent's bot | FLW-08, FLW-10 | disabled | proposed | none yet |
| SCR-12 | Fabric's button and menu | FLW-09 | disabled | proposed | none yet |
| SCR-13 | Spend policy choice | FLW-10 | disabled | proposed | none yet |
| SCR-14 | Fabric's approval prompt | FLW-11 | disabled | proposed | none yet |
| SCR-15 | Dashboard page after the session ended | FLW-12 | disabled | proposed | none yet |
| SCR-16 | Dashboard in a host pane | FLW-13 | disabled | proposed | `test/embedded-dashboard.test.ts` |
| SCR-17 | Usage by grant | FLW-14 | disabled | proposed | `test/spend-policy.test.ts` |
| SCR-18 | Restore preview and report | FLW-15 | disabled | proposed | `test/settings-backup.test.ts` |
| SCR-19 | Project board thread | FLW-16 | disabled | proposed | `test/comms-rules.test.ts` |
| SCR-20 | Service card with a second copy | FLW-17 | disabled | proposed | none yet |
| SCR-21 | Project listing setting | FLW-18 | disabled | proposed | `test/comms-tools.test.ts` |
| SCR-22 | Add a machine | FLW-19 | disabled | proposed | `test/pairing.test.ts` |
| SCR-23 | My network's machines | FLW-20, FLW-26, FLW-27 | disabled | proposed | `test/ceremonies.test.ts` |
| SCR-24 | An agent's connections | FLW-21 | disabled | proposed | `test/connections.test.ts` |
| SCR-25 | Agent directory | FLW-22 | disabled | proposed | `test/agent-network.test.ts` |
| SCR-26 | An agent's load | FLW-24 | disabled | proposed | `test/agent-network.test.ts` |
| SCR-27 | A job's status for its caller | FLW-23, FLW-25 | disabled | proposed | `test/agent-network.test.ts` |
| SCR-28 | Credentials issued into an organization | FLW-28 | disabled | proposed | `test/credential-envelope.test.ts` |
| SCR-29 | Calls between agents | FLW-28 | disabled | proposed | `test/credential-envelope.test.ts` |
| SCR-33 | Sharing a key with another person | FLW-33 | disabled | proposed | `test/peer-share.test.ts` |
| SCR-34 | An agent's secret request | FLW-34 | disabled | proposed | `test/local-channel.test.ts` |

## Design system

- **Style pack:** none — semantic Markdown and platform defaults
- **Figma library:** none
- **Tokens in code:** none
- **Component source:** none
- **Assets:** Mermaid diagrams embedded in canonical documents

## Web surfaces

- **Web surfaces:** no — the repository and its generated reports are private

## Screens

### SCR-01: Profile chooser

- **Used by:** FLW-01
- **Purpose:** distinguish MCP capability, A2A peer and local runner before configuration starts.
- **Elements:** comparison table; profile links (primary action: choose one profile).
- **States:** success — all profiles and boundary rules are visible.
- **Coverage:** none yet
- **Scenarios:** SCN-001
- **Resources:** profile overview and pinned protocol ledger
- **Status:** designed

### SCR-02: Profile contract

- **Used by:** FLW-01
- **Purpose:** give one exact manifest shape, discovery rule and probe set.
- **Elements:** requirements, example, schema link, recovery notes (primary action: validate fixture).
- **States:** success — exact profile is readable; error — unsupported protocol revision names compatible alternatives.
- **Coverage:** none yet
- **Scenarios:** SCN-001, SCN-002
- **Resources:** profile schema and fixtures
- **Status:** designed

### SCR-03: Conformance report

- **Used by:** FLW-01
- **Purpose:** show independent shape, protocol and semantic verdicts.
- **Elements:** gate list, instance path, evidence URI, recovery action (primary action: address first failure).
- **States:** loading — current gate named; error — failed gate and recovery shown; success — all local gates and report hash shown.
- **Coverage:** none yet
- **Scenarios:** SCN-001, SCN-002
- **Resources:** conformance-report schema
- **Status:** designed

### SCR-04: Admission record

- **Used by:** FLW-01, FLW-02
- **Purpose:** make provider identity, trust and semantic-probe outcome inspectable.
- **Elements:** provider revision, decisions, proof, expiry/suspension reason (primary action: proceed to binding when admitted).
- **States:** error — rejected/suspended with recovery; success — immutable accepted decision.
- **Coverage:** none yet
- **Scenarios:** SCN-003
- **Resources:** admission schema
- **Status:** designed

### SCR-05: Binding contract

- **Used by:** FLW-02, FLW-03, FLW-05
- **Purpose:** pin an admitted capability to project scope, context, grant and checker — and, for the local-runner profile, a runner route.
- **Elements:** revision references, allowlist, validation findings (primary action: validate new revision).
- **States:** error — each invalid reference named; success — content hash and activation boundary shown.
- **Coverage:** none yet
- **Scenarios:** SCN-003, SCN-004, SCN-005, SCN-009, SCN-020
- **Resources:** binding, execution-context and runner-route schemas; the model and runner profile schemas and the
  spend policy's model classes (SCN-020)
- **Status:** designed

### SCR-06: Version history

- **Used by:** FLW-02, FLW-03, FLW-04, FLW-05
- **Purpose:** compare immutable revisions and create a rollback-as-new-revision; list route events.
- **Elements:** hash, parents, diff summary, run pins (primary action: create proposed revision).
- **States:** empty — no prior revision and a creation link; success — history and provenance visible.
- **Coverage:** none yet
- **Scenarios:** SCN-005, SCN-006, SCN-009
- **Resources:** versioned-setting and runner-route-event schemas
- **Status:** designed

### SCR-07: Result and evidence

- **Used by:** FLW-03, FLW-04, FLW-05
- **Purpose:** separate claimed completion, proof, scope and unknowns.
- **Elements:** DONE, PROOF, SCOPE, NOT VERIFIED, artifacts, checker outcome (primary action: inspect failed or unverified claim).
- **States:** partial — known and unknown items separated; error — checker failure and retry boundary; success — verified claims linked to evidence.
- **Coverage:** none yet
- **Scenarios:** SCN-006, SCN-007, SCN-009
- **Resources:** result schema
- **Status:** designed

### SCR-08: Retro record

- **Used by:** FLW-04
- **Purpose:** compare failed attempt with verified correction and route approval.
- **Elements:** contrast, causal evidence, proposal, scope, approver, loop count (primary action: submit proposal).
- **States:** empty — correction missing and next evidence required; error — self-mutation or insufficient promotion evidence denied; success — approved new revision linked.
- **Coverage:** none yet
- **Scenarios:** SCN-007, SCN-008
- **Resources:** learning and promotion schemas
- **Status:** designed

### SCR-09: Access log

- **Used by:** FLW-06
- **Purpose:** show a member every read of their raw telemetry and of devices bound to them, and each partner
  organization's read of usage sums that include them.
- **Elements:** time, reader role (a person's role, or `partner` with the partner organization), scope, device, range,
  purpose (primary action: open the organization's notice).
- **States:** empty — no read in the range; success — entries newest first.
- **Coverage:** `access-log.schema.json`, fixture `positive/access-log.json`
- **Scenarios:** SCN-010
- **Resources:** access-log schema; activity specification, Access log
- **Status:** proposed

### SCR-10: Device settings

- **Used by:** FLW-07
- **Purpose:** show each effective policy key, the layer it came from and whether it is locked.
- **Elements:** key, value, source layer, lock, held revision per layer (primary action: change an unlocked key; `harness.baseline` and `repair.packages` are the organization's signed keys, not the person's to change, DEC-0102; the device's answer to such a change is CT-99); the closed organization's sentence and date (DEC-0103).
- **States:** success: effective settings; error: a change to a locked key refused, or a policy that failed to verify; closed: the organization ended, the device no longer reports to it and its server locks are lifted (DEC-0103).
- **Coverage:** `test/device-rules.test.ts` (FAC-SEM-041, FAC-SEM-042), `test/node-summary.test.ts` (the two signed-only keys)
- **Scenarios:** SCN-011
- **Resources:** device-policy schema; devices specification, Policy
- **Status:** proposed

### SCR-11: Chat with the agent's bot

- **Used by:** FLW-08, FLW-10
- **Purpose:** the operator reads an agent's notifications and answers its stops in a messenger.
- **Elements:** notification text with a link, stop message with action buttons, confirmation with amount and expiry, reply prompt for free text (primary action: the stop's recommended button).
- **States:** empty — not linked yet, the chat waits for the link code; success — a stop answered, keyboard removed; error — already decided, expired confirmation, or no effect for a sender outside the allowlist. silent — in a group shared with other bots, a message not addressed to this bot gets no answer (OC-14, OC-15); degraded — nobody receives, shown as `receiver-missing` (OC-17).
- **Coverage:** `operator-channel-status.schema.json`, `test/operator-channel.test.ts`
- **Scenarios:** SCN-012, SCN-013, SCN-014, SCN-017, SCN-031
- **Resources:** operator-channel specification, Rules
- **Status:** proposed

### SCR-12: Fabric's button and menu

- **Used by:** FLW-09
- **Purpose:** the operator opens Fabric on the product and project they are looking at.
- **Elements:** a floating button bottom-right with the Fabric mark and the word Fabric (accessible name "Open Fabric" in the page's language, *Fabric* never translated); its menu, in the page's language, with "Chat with Fabric about …" and "Open a coding session in …" (primary action: the chat).
- **States:** success: the menu shows both actions and a choice opens Fabric; empty: the page knows no project, so only the chat is offered; error: Fabric is not installed, and the menu says "Fabric is not installed. Get it at passioncode.ai/fabric" in the page's language; hidden: the host draws its own button (`fabric_button` with `owner=host`).
- **Coverage:** `fabric-link.schema.json`, `test/fabric-button.test.ts` (FAC-SEM-052)
- **Scenarios:** SCN-015
- **Resources:** fabric-button specification, The button, Deep links
- **Status:** proposed

### SCR-13: Spend policy choice

- **Used by:** FLW-10
- **Purpose:** the operator chooses a project's spend limit once, at its first paid run.
- **Elements:** the computed options (about the expected month, twice and four times it, "no project limit") with one preselected, the inputs they were computed from, the auto-approve threshold (primary action: confirm the preselected option).
- **States:** success — the choice recorded with its inputs; empty — no usage history yet, so the options come from the agents' presets alone and say so; unknown — a service in the window ran calls on a subscription, so the project's recent spend is unknown (`recentSpendUsd: null`): the options come from the presets and the kind of work, and while none of its calls is unpriced the wording may name its cost including estimates as an upper bound, labelled as an estimate (DEC-0110).
- **Coverage:** `spend-policy.schema.json`, `test/spend-policy.test.ts` (FAC-SEM-047)
- **Scenarios:** SCN-016
- **Resources:** spend-policy specification, The spend policy
- **Status:** proposed

### SCR-14: Fabric's approval prompt

- **Used by:** FLW-11
- **Purpose:** the operator approves or declines one action an outside caller asked a callee to take.
- **Elements:** the callee, the action as the callee will take it, who asks (the caller and the person under the share grant), the approval's lifetime (primary action: approve this action once).
- **States:** success — approved, and the approval returned to the caller; error — declined, or the callee later refuses the approval as invalid or reused.
- **Coverage:** `approval.schema.json`, `test/delegation.test.ts`, `test/delegation-sealed.test.ts` (DL-17, DL-18)
- **Scenarios:** SCN-018
- **Resources:** delegation specification, Approval, Trust tiers
- **Status:** proposed

### SCR-15: Dashboard page after the session ended

- **Used by:** FLW-12
- **Purpose:** a dashboard page says its operator session has ended instead of failing silently.
- **Elements:** the state in one sentence and why it can end (idle 12 hours, 7 days, logout, a rotated token); no form (primary action: none; the host signs in again).
- **States:** error — `401` with the explanation; success — the host's new session reopens the same page.
- **Coverage:** `src/operator-session.ts`, `test/delegation.test.ts`, `test/delegation-sealed.test.ts`
- **Scenarios:** SCN-019
- **Resources:** service specification, Operator login
- **Status:** proposed

### SCR-16: Dashboard in a host pane

- **Used by:** FLW-13
- **Purpose:** an agent's dashboard page shown inside a host beside the agent console, usable at every width the host keeps for it.
- **Elements:** the page's navigation (wrapping, a visible *More* menu or one labelled control), its content, its own scheme and theme controls when it applies no host field (primary action: the page's own).
- **States:** success — the page at or above its floor, every destination reachable; narrow — the console stopped at the host floor `max(480, minWidth)`; legacy — the page declares nothing valid, so the host keeps 480 and the page takes nothing from the host's cookie, following the system colour scheme unless the operator set its own control; below floor — a window too small for both, so the page keeps its floor layout and scrolls sideways.
- **Coverage:** `service-dashboard-extension.schema.json`, `test/embedded-dashboard.test.ts` (ED-1…ED-10, FAC-SEM-080), `src/dashboard-declaration.ts`
- **Scenarios:** SCN-021, SCN-022
- **Resources:** embedded-dashboard specification, The page, The host, The declaration
- **Status:** proposed

### SCR-17: Usage by grant

- **Used by:** FLW-14
- **Purpose:** the operator sees what an agent spent under which standing grant, without having been asked.
- **Elements:** each grant with its receipts settled, the amounts, the level that would have refused (primary action: none; the report is read-only).
- **States:** success — the spend listed under its grant with the receipt; error — a denied check, its code and level shown as the agent relayed them.
- **Coverage:** `grant-check.schema.json`, `service-usage.schema.json` (`byGrant`), `test/spend-policy.test.ts`, `test/meter-grant.test.ts`
- **Scenarios:** SCN-023
- **Resources:** spend-policy specification, Grants, Checking
- **Status:** proposed

### SCR-18: Restore preview and report

- **Used by:** FLW-15
- **Purpose:** the operator sees what a restore would add and what it would drop, default or refuse, before and after applying it.
- **Elements:** per table, rows to insert; snapshot columns dropped, current columns defaulted, required columns missing; refused rows with key and reason; skipped damaged snapshots (primary action: apply).
- **States:** preview — nothing applied yet; success — rows inserted, none overwritten; error — rows refused with their reasons, or no intact snapshot with content.
- **Coverage:** `settings-backup.schema.json`, `src/settings-backup.ts` (FAC-SEM-035), `test/settings-backup.test.ts`
- **Scenarios:** SCN-024
- **Resources:** service specification, Settings backup, Restore
- **Status:** proposed

### SCR-19: Project board thread

- **Used by:** FLW-16
- **Purpose:** the operator reads one thread between Projects and the state of each request in it.
- **Elements:** participants fixed at creation, messages with sender Project and principal provenance, whom a reply was addressed to (`deliverTo`: the sender it answers, the whole thread or named participants; a reply to a request also reached its requester, and a reply without `deliverTo` shows the sender it answers (or the whole thread where DR-2 falls back to it: the answered message was the replier's own Project's, or is no longer held) only where the host tells it apart from one stored before the board adopted DEC-0135, which it does by its own adoption time; a reader with only the message shows "addressee not recorded"), each request's state and effect state, a reply's reaction to an announcement (`adapted`, `row` with its id and day, `not-affected`), the requester's own notice, from its submit receipt and shown to the requester only, that nobody answers its request's capability now (`noResponder`), and a mark on a request the owner settled (primary action, conditional: on an `outcome_unknown` request of a Project the operator owns whose slot no responder holds, "Settle" with a summary of what they observed; otherwise none, and responders act through the board's operations).
- **States:** success: a request completed with an observed result; unknown: `outcome_unknown` after a lost result; expired: a deadline passed before anyone accepted (a request without its own deadline gets one seven days out); answered: the target's participant replied while it was queued, or while it was claimed and it returned to queued (never a responder's own fenced reply or progress note): not open, never expired, left only by the requester's cancel, and never read as the work done.
- **Coverage:** `comms-submit.schema.json`, `comms-message.schema.json`, `comms-receipt.schema.json`, `comms-reply.schema.json` and fixtures `comms-*-deliver*`, `test/comms-rules.test.ts` (FAC-SEM-026, FAC-SEM-027, FAC-SEM-109)
- **Scenarios:** SCN-025
- **Resources:** project-comms specification, Request lifecycle
- **Status:** proposed

### SCR-20: Service card with a second copy

- **Used by:** FLW-17
- **Purpose:** a host's card for a service shows a second copy honestly: never as an outage, and as two copies where the supervisor's pid shows one.
- **Elements:** the service's state from its well-known document; under launchd a "two copies" (`duplicate`) mark with both pids; the second copy's one sentence in its log (primary action: none; the operator removes the duplicate install).
- **States:** loading — a supervised copy waits for the lock (launchd: `duplicate`; Task Scheduler: the holder `ready`, the wait not visible); error — the second copy exited 75 naming the holder, the holder unknown, or the markers; success — one copy runs and answers.
- **Coverage:** `src/service-supervisor.ts`, `test/service-supervisor.test.ts`, `fixtures/semantic/service-lock-*.json`
- **Scenarios:** SCN-026
- **Resources:** service specification, One copy
- **Status:** proposed

### SCR-21: Project listing setting

- **Used by:** FLW-18
- **Purpose:** the operator chooses whether a Project appears in the project directory the agents of the estate read.
- **Elements:** a per-Project "Listed in the project directory" switch with one line saying that a sender that knows the id still reaches the Project (primary action: the switch).
- **States:** success — listed, or unlisted and absent from every directory page; error — the host could not save the change, and the switch says so and shows the setting as it was.
- **Coverage:** `comms-directory.schema.json`, `test/comms-tools.test.ts` (the directory's boundary)
- **Scenarios:** SCN-027
- **Resources:** project-comms specification, Project directory
- **Status:** proposed

### SCR-22: Add a machine

- **Used by:** FLW-19
- **Purpose:** the person pairs a new machine with a trusted one and signs the revision that adds it.
- **Elements:** the six-digit comparison code and the network's fingerprint, shown on both machines; "The codes match" (primary action, which opens the passkey prompt) and "They differ"; nearby, a QR code or short code on the new machine; from afar, the rendezvous link and its remaining time; for a headless server joined by an enroll token, the fingerprint of the key about to be listed, beside the instruction to compare it with the one the server printed, and "Revoke the token" when they differ.
- **States:** loading — waiting for the other side's commitment or reveal; error — the codes differ, a reveal did not open its commitment, or the rendezvous expired, each saying a new attempt starts over; success — the machine is listed in the signed revision.
- **Coverage:** `src/pairing.ts`, `test/pairing.test.ts`, `fixtures/vectors/pairing.json`; headless: `src/enroll-token.ts`, `test/enroll-token.test.ts`, `fixtures/vectors/enroll-token.json`
- **Scenarios:** SCN-028
- **Resources:** ceremonies specification, Add a machine
- **Status:** proposed

### SCR-23: My network's machines

- **Used by:** FLW-20, FLW-26, FLW-27
- **Purpose:** the person creates the network, and removes a machine, replaces its key or changes its profile, moves the hub, and adds or replaces a passkey, each by a signed revision.
- **Elements:** the network's fingerprint; one row per machine with its id, key fingerprint and profile (full, member, view), "Replace key" (primary action; on the machine that holds the hub key it says first that running approvals and tokens the old hub kid signed must be issued again), and "Change profile" and "Remove" in an overflow menu ("Remove", from a move's first revision until every paused instance has opened or ended, for a machine that has not reported the revoking revision, says first that the old hub's windows will stay paused until they end, with the date); "Create my network" when there is none; "Move the hub" on the hub machine's own row (a planned move); "Remove" on the hub's machine asks whether it is lost (one revision, which first says that every window the hub divided stays paused until it ends, with the dates) or retired (the planned move; the old machine stays in the network, and removing it later is an ordinary "Remove", which pauses the old hub's windows until they end if made before its report shows the revoking revision; the retired path shows the same notice as "Move the hub"); the hub alert with the hours since and "Move the hub" (an unplanned move; for a lost hub it says first, as "Remove" does, that every window the hub divided stays paused until it ends, with the dates), each opening a picker of the `full` machines with a note to choose one that stays on; the passkeys list with "Add a passkey" and the one-passkey warning; while a key switch, a move or paused leases wait, the list of machines waited on; on the hub machine's own row, while it cannot read reports, "Sign the revision that lists this machine's key" or "Replace key".
- **States:** success: the revision is signed and the list shows the change; error: the passkey ceremony failed and nothing changed; empty: no network yet, with "Create my network"; unavailable: "Change profile" is disabled, with the reason, until every reader of the record is pinned at or after DEC-0106; alert: while the record certifies a hub key, this machine has not heard from the hub for more than 24 hours, or holds no heartbeat, shown at once with the hours since, whether calls between machines have stopped (past 72 hours, or no readable heartbeat) and "Move the hub", offered only after reconnecting to the relay and reading `hubSilence` again; or one passkey only, with "Add a passkey" (`recoveryReady`); waiting: after a planned move's switch, while its second revision is unsigned, the old hub's windows paused with their end dates and "Finish the move" (signing its second revision) as the way out; a key switch, a planned move or the window leases paused after a move wait on machines' reports (after a lost hub the leases are paused until each window instance ends, with the date and the reason: the lost machine's spend cannot be known), each machine waited on named with since when and why when known ("its software is too old to report"), with the ways out: bring it back, update it, or "Remove" (for the hub's own machine only updating it: its "Remove" opens Move the hub, retired a planned move that waits on the same report, lost one revision that pauses every window it divided until they end, except during a planned move, which CT-152 leaves undecided) (which ends a key switch's or a move's wait, never the paused leases'; chosen during a move for a machine that has not reported at or above the revoking revision, it first says that the old hub's window instances will stay paused until each ends, with the date, relay.md MR-6, DEC-0146); "Move the hub", while a window instance runs that began before a machine was removed (removed since it began, so it can never report at or above the move's revoking revision), first says that instance will stay paused until it ends, with the date; once a waited-on machine is removed, the paused-leases wait shows the instance's end date and the reason, with no way out; on the hub machine's own row, while this hub cannot read its machines' reports: a setup note "Sign the revision that lists this machine's key" while only the signature is missing, or an error with "Replace key" otherwise, which on the hub's machine also re-certifies the hub key under a new kid and says first that running approvals and tokens the old kid signed must be issued again (ceremonies, Replace a machine's key, step 3, and Move the hub step 7; DL-14; MR-3, DEC-0146).
- **Coverage:** `src/estate-record-rules.ts` (`FAC-SEM-114`; `machineProfile`, `FAC-SEM-134`), `fixtures/semantic/estate-profile-*`, `test/ceremonies.test.ts`, `test/estate-record.test.ts`, `src/hub-move.ts`, `test/hub-move.test.ts`
- **Scenarios:** SCN-029, SCN-030, SCN-037, SCN-038, SCN-039
- **Resources:** ceremonies specification, Create my network, Remove a machine, Replace a machine's key, Move the hub, Recover a lost passkey
- **Status:** proposed

### SCR-24: An agent's connections

- **Used by:** FLW-21
- **Purpose:** the person sees what an agent uses and which connection fails.
- **Elements:** one row per connection with its kind, target, state, purpose and last time; a failing mark on a connection whose id a `degraded[].source` names; the reasons when the declaration is invalid.
- **States:** success, the connections listed; failing, one or more marked; invalid, none shown and the reasons are; empty, the agent declares nothing.
- **Coverage:** `src/connections.ts` (`connectionsView`, `FAC-SEM-127`), `fixtures/vectors/connections.json`, `test/connections.test.ts`
- **Scenarios:** SCN-032
- **Resources:** connections specification; Fabric Dashboards' Connections tab (its SCN-073)
- **Status:** proposed

### SCR-25: Agent directory

- **Used by:** FLW-22
- **Purpose:** the reader finds an agent they may call in their estate or their organization.
- **Elements:** one row per agent and context; an unlisted mark for the owner and an administrator.
- **States:** success, entries listed; empty, nothing the reader may see.
- **Coverage:** `src/agent-network.ts` (`estateDirectory`, `organizationDirectory`, `FAC-SEM-130`), `fixtures/vectors/agent-network.json`, `test/agent-network.test.ts`
- **Scenarios:** SCN-033
- **Resources:** agent network specification, Directory; Fabric's hub (CO-376)
- **Status:** proposed

### SCR-26: An agent's load

- **Used by:** FLW-24
- **Purpose:** the person sees how busy an agent is.
- **Elements:** per window and context: queued, running (jobs waiting on a person or paused at a limit included), completed, failed; p50 and p95 wait and run time; the queue's limits, which apply to each agent the service hosts while the rows sum them.
- **States:** success, windows drawn; empty, the service declares no load; invalid, the declaration is not its schema's and the reasons are shown.
- **Coverage:** `src/agent-network.ts` (`FAC-SEM-132`, `FAC-SEM-133`), `test/agent-network.test.ts`
- **Scenarios:** SCN-035
- **Resources:** agent network specification, Load; Fabric Dashboards' load panel
- **Status:** proposed

### SCR-27: A job's status for its caller

- **Used by:** FLW-23, FLW-25
- **Purpose:** the caller, an agent or the person behind it, sees where its call stands: waiting in line, refused for now, or done; for a call to another of the owner's machines, the sealed answer or its refusal.
- **Elements:** the job's status and status message (`queued <position> of <length>`); on a refusal, the time to start again; the result once completed.
- **States:** queued, the estimated place and the queue's length shown; refused, `queue-full` with its time and nothing started, or a call between machines refused `profile-forbids` (or its token refused) with its reason; unanswered, a call between machines with no answer by its body's `exp`, shown as failed with no reason, since the target answers no refusal it cannot seal; success, the job completed once.
- **Coverage:** `src/agent-network.ts` (`admitJob`, `readQueuePosition`), `src/job-limits.ts` (`jobCallerAction`), `src/machine-call.ts` (`relayCallerTier`, `machineCallVerdict`, `openAgentCall`), `test/agent-network.test.ts`, `test/machine-call.test.ts`
- **Scenarios:** SCN-034, SCN-036
- **Resources:** agent network specification, Call queue; interop C3.2; the caller's own console (an agent's log)
- **Status:** proposed

### SCR-28: Credentials issued into an organization

- **Used by:** FLW-28
- **Purpose:** the administrator decides on agents' requests and sees every credential issued into the organization, by name; a person sees those of the agents in their own enrollment.
- **Elements:** the queue of requests (agent, provider, preset, scope, end asked, reason) with "Issue" and "Refuse"; one row per issued credential (agent, provider, preset, slot, end, state) with "Revoke"; never a value.
- **States:** queue, requests waiting; issued, the credential's end shown; refused, the reason; revoked, when and why; empty, nothing asked yet.
- **Coverage:** `src/credentials.ts` (`FAC-SEM-138`, `credentialRevocationStands`), `test/credential-envelope.test.ts`
- **Scenarios:** SCN-040, SCN-041
- **Resources:** credentials specification, The request, The decision, Revocation
- **Status:** proposed

### SCR-29: Calls between agents

- **Used by:** FLW-28
- **Purpose:** the administrator, in the organization's context, and the person, in their own network view, see who called whom.
- **Elements:** one row per call: caller and callee agents, capability, transport, start and end, outcome and code, cost (an estimate on a subscription, shown apart); grouped by trace id.
- **States:** success, the calls listed; empty, none recorded; withheld, a member whose notice does not name agent calls sends none (`callRecordsAccepted: false`); one call, its caller's and callee's records joined by `callId` and shown with the callee's outcome.
- **Coverage:** `src/credentials.ts` (`callRecordFindings`, `FAC-SEM-140`), `test/credential-envelope.test.ts`
- **Scenarios:** SCN-042
- **Resources:** credentials specification, The call record
- **Status:** proposed

### SCR-30: The operator's agent and the service's audit row

- **Used by:** FLW-29, FLW-30, FLW-31
- **Purpose:** the operator sees their instruction taken: the agent's reply in their chat and the service's audit row.
- **Elements:** the agent's reply (what it called, the service's answer, a link to hand over for a human step, a service's page as its `open_link`); the audit row (decided by, via, relayed by the authenticated caller, when; under a mandate also the task, the chain and the operator's words, for the operator's own view; for a relayed approval also where the operator said it, `source`, DEC-0126).
- **States:** success, the action taken as the operator's; error, `operator-decision-required`, `decision-invalid` or `human-step-required` with its link.
- **Coverage:** `src/actions.ts` (`actionDecision`, `FAC-SEM-142`), `test/actions.test.ts`
- **Scenarios:** SCN-043, SCN-044, SCN-045, SCN-046
- **Resources:** service specification, Actions
- **Status:** proposed


### SCR-31: Joining an organization

- **Used by:** FLW-32
- **Purpose:** the member sees which organization, which server and which root key they admit before their passkey signs, and later the state of each membership.
- **Elements:** the organization's id and server origin; the root key's fingerprint; "Join" (the passkey prompt); per membership: role, `active`, `suspended` or `ended`, and what leaves for the organization (OM-7's rows), with a note that an instance of the organization placed on this machine can read this machine's estate records (DEC-0146); the adaptation plan: the chosen items and their labels, the requests and each one's state (`pending`, `granted`, `refused`, `expired`) and when it was decided or closed (DEC-0138).
- **States:** joining, the root shown; joined, the role; suspended, the attestation expired and when it was last verified; ended, when and why; ended, the passkey's signature pending; refused, the verifier's reason; no plan yet; a plan sent, a request decided or expired, a plan refused with its code, a plan withdrawn; the server takes no plans from Fabric; a plan held while the membership is suspended; a typed text at its limit, the limit shown (label 80, resource 120, note and purpose 200); leaving: the plan withdrawn first within the wait the person agrees to, and when no receipt confirmed the withdrawal, that the plan may remain with the server and, where the server offers a page for it, can be withdrawn there.
- **Coverage:** `src/org-membership.ts` (`verifyOrgMembership`, `verifyOrgKeySet`, `FAC-SEM-145` to `FAC-SEM-147`), `test/org-membership.test.ts`, `src/org-adaptation.ts` (`decideAdaptation`, `adaptationReceipt`, `FAC-SEM-153`), `test/org-adaptation.test.ts`
- **Scenarios:** SCN-047, SCN-048, SCN-049, SCN-050
- **Resources:** membership specification, The organization's keys, Ending, What leaves a person's Fabric, The adaptation plan
- **Status:** proposed

### SCR-33: Sharing a key with another person

- **Used by:** FLW-33
- **Purpose:** the sender makes a share, compares the code, reads its use and takes it back; the recipient opens a share and compares the code.
- **Elements:** "Share" on a vault slot, the link to send and its claim deadline; the six-digit code on both screens and "The codes match" / "They differ" / "Share without comparing"; for the recipient, "Open a share", "Accept" with what the sender will see (agent names, uses per day, the time of each day's last use and of each export, and, through the mailbox the sender runs, the recipient machine's IP address and when it claims, renews and reports) and "Decline" beside it, before any claim, the name the recipient gives the share at "Accept", the code with "They differ", and a note that its own comparison is its only check (nothing it receives says whether the sender compared); per share: the recipient's label, confirmed or not, uses per day and consumer labels (reported by their machine), the mailbox's delivery count, the provider's spend, exports with the button; "Take back", with each of its three steps and what confirmed it.
- **States:** waiting for the claim; comparing, the code shown; burnt, a second claim, a code that differs, an abort or the deadline, each with its reason as the mailbox carries it; for the recipient, a claim made after the share was stored, which the mailbox carries only to the sender, so the claimant learns nothing before its deadline until the mailbox's routes say so (CT-185); a "They differ" after storage, the share deleted on the recipient's side; received, on the recipient's side, under the name the recipient gave it at "Accept"; active, confirmed or `confirmed: false`; a later claim on a share sealed without comparing, or the recipient's abort on any stored share, a warning to take it back; for the recipient, an envelope past its `exp` waiting for the sender to seal it again; taken back, the mailbox's refusal observed and the provider's revocation or rotation confirmed; reported deleted.
- **Coverage:** `src/peer-share.ts`, `fixtures/vectors/peer-share.json`, `test/peer-share.test.ts`
- **Scenarios:** SCN-052
- **Resources:** peer share specification
- **Status:** proposed

### SCR-34: An agent's secret request

- **Used by:** FLW-34
- **Purpose:** the person types a value an agent asked for into a window only the product's signed app can show.
- **Elements:** the person's own mark (hidden from other programs on macOS; on Windows another program of the user can read it; a program with the person's screen-recording or Accessibility permission can read it on any genuine prompt, and with Accessibility press its buttons; while either is held the mark does not tell the windows apart: remove the permission, then change the mark; on Windows, run agents as another user or in a container); the agent's name from the node's binding; the project and the slot; the agent's reason, quoted as its own words; whether the slot already holds a value; a secure field; "Store" and "Decline".
- **States:** asking; stored; declined; stored but not seen by the node (`unconfirmed`); no answer by the deadline; withdrawn (`secret.cancel`, which the agent then learns as `no-answer`); unavailable, no signed app or no desktop, with the person's step.
- **Coverage:** `src/local-channel.ts` (`channelStep`, `maySecretPrompt`, `secretOutcome`), `test/local-channel.test.ts`
- **Scenarios:** SCN-053
- **Resources:** local channel specification, Secret requests
- **Status:** proposed
