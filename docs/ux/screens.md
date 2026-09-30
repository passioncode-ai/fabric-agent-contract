<!-- Managed with super-ux (ux-contract v4). The design map: every screen and state with its Figma frame, wireframe, code coverage, and resources. Update in the same change as any interface change; when Figma is enabled, update the frame too. -->

# Reading surfaces

## Index

| ID | Screen | Used by | Figma | Status | Coverage |
|---|---|---|---|---|---|
| SCR-01 | Profile chooser | FLW-01 | disabled | designed | none yet |
| SCR-02 | Profile contract | FLW-01 | disabled | designed | none yet |
| SCR-03 | Conformance report | FLW-01 | disabled | designed | none yet |
| SCR-04 | Admission record | FLW-01, FLW-02 | disabled | designed | none yet |
| SCR-05 | Binding contract | FLW-02, FLW-03 | disabled | designed | none yet |
| SCR-06 | Version history | FLW-02, FLW-03, FLW-04 | disabled | designed | none yet |
| SCR-07 | Result and evidence | FLW-03, FLW-04 | disabled | designed | none yet |
| SCR-08 | Retro record | FLW-04 | disabled | designed | none yet |

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

- **Used by:** FLW-02, FLW-03
- **Purpose:** pin an admitted capability to project scope, context, grant and checker.
- **Elements:** revision references, allowlist, validation findings (primary action: validate new revision).
- **States:** error — each invalid reference named; success — content hash and activation boundary shown.
- **Coverage:** none yet
- **Scenarios:** SCN-003, SCN-004, SCN-005
- **Resources:** binding and execution-context schemas
- **Status:** designed

### SCR-06: Version history

- **Used by:** FLW-02, FLW-03, FLW-04
- **Purpose:** compare immutable revisions and create a rollback-as-new-revision.
- **Elements:** hash, parents, diff summary, run pins (primary action: create proposed revision).
- **States:** empty — no prior revision and a creation link; success — history and provenance visible.
- **Coverage:** none yet
- **Scenarios:** SCN-005, SCN-006
- **Resources:** versioned-setting schema
- **Status:** designed

### SCR-07: Result and evidence

- **Used by:** FLW-03, FLW-04
- **Purpose:** separate claimed completion, proof, scope and unknowns.
- **Elements:** DONE, PROOF, SCOPE, NOT VERIFIED, artifacts, checker outcome (primary action: inspect failed or unverified claim).
- **States:** partial — known and unknown items separated; error — checker failure and retry boundary; success — verified claims linked to evidence.
- **Coverage:** none yet
- **Scenarios:** SCN-006, SCN-007
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
