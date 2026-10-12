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
| SCR-16 | Service card with a second copy | FLW-13 | disabled | proposed | none yet |

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
- **Purpose:** show a member every read of their raw telemetry and of devices bound to them.
- **Elements:** time, reader role, scope, device, range, purpose (primary action: open the organization's notice).
- **States:** empty — no read in the range; success — entries newest first.
- **Coverage:** `access-log.schema.json`, fixture `positive/access-log.json`
- **Scenarios:** SCN-010
- **Resources:** access-log schema; activity specification, Access log
- **Status:** proposed

### SCR-10: Device settings

- **Used by:** FLW-07
- **Purpose:** show each effective policy key, the layer it came from and whether it is locked.
- **Elements:** key, value, source layer, lock, held revision per layer (primary action: change an unlocked key).
- **States:** success — effective settings; error — a change to a locked key refused, or a policy that failed to verify.
- **Coverage:** `test/device-rules.test.ts` (FAC-SEM-041, FAC-SEM-042)
- **Scenarios:** SCN-011
- **Resources:** device-policy schema; devices specification, Policy
- **Status:** proposed

### SCR-11: Chat with the agent's bot

- **Used by:** FLW-08, FLW-10
- **Purpose:** the operator reads an agent's notifications and answers its stops in a messenger.
- **Elements:** notification text with a link, stop message with action buttons, confirmation with amount and expiry, reply prompt for free text (primary action: the stop's recommended button).
- **States:** empty — not linked yet, the chat waits for the link code; success — a stop answered, keyboard removed; error — already decided, expired confirmation, or no effect for a sender outside the allowlist. silent — in a group shared with other bots, a message not addressed to this bot gets no answer (OC-14, OC-15); degraded — nobody receives, shown as `receiver-missing` (OC-17).
- **Coverage:** `operator-channel-status.schema.json`, `test/operator-channel.test.ts`
- **Scenarios:** SCN-012, SCN-013, SCN-014, SCN-017
- **Resources:** operator-channel specification, Rules
- **Status:** proposed

### SCR-12: Fabric's button and menu

- **Used by:** FLW-09
- **Purpose:** the operator opens Fabric on the product and project they are looking at.
- **Elements:** a floating button bottom-right with the Fabric mark and the word Fabric (accessible name "Open Fabric"); its menu with "Chat with Fabric about …" and "Open a coding session in …" (primary action: the chat).
- **States:** success — the menu shows both actions and a choice opens Fabric; empty — the page knows no project, so only the chat is offered; error — Fabric is not installed, and the menu says "Fabric is not installed — get it at passioncode.ai/fabric"; hidden — the host draws its own button (`fabric_button` with `owner=host`).
- **Coverage:** `fabric-link.schema.json`, `test/fabric-button.test.ts` (FAC-SEM-052)
- **Scenarios:** SCN-015
- **Resources:** fabric-button specification, The button, Deep links
- **Status:** proposed

### SCR-13: Spend policy choice

- **Used by:** FLW-10
- **Purpose:** the operator chooses a project's spend limit once, at its first paid run.
- **Elements:** the computed options (about the expected month, twice and four times it, "no project limit") with one preselected, the inputs they were computed from, the auto-approve threshold (primary action: confirm the preselected option).
- **States:** success — the choice recorded with its inputs; empty — no usage history yet, so the options come from the agents' presets alone and say so.
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

### SCR-16: Service card with a second copy

- **Used by:** FLW-13
- **Purpose:** a host's card for a service shows a second copy honestly: never as an outage, and as two copies where the supervisor's pid shows one.
- **Elements:** the service's state from its well-known document; under launchd a "two copies" (`duplicate`) mark with both pids; the second copy's one sentence in its log (primary action: none; the operator removes the duplicate install).
- **States:** loading — a supervised copy waits for the lock (launchd: `duplicate`; Task Scheduler: the holder `ready`, the wait not visible); error — the second copy exited 75 naming the holder, the holder unknown, or the markers; success — one copy runs and answers.
- **Coverage:** `src/service-supervisor.ts`, `test/service-supervisor.test.ts`, `fixtures/semantic/service-lock-*.json`
- **Scenarios:** SCN-021
- **Resources:** service specification, One copy
- **Status:** proposed
