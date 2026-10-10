<!-- Managed with super-ux (ux-contract v4). Update in the same change as any user-facing behavior change. -->

# UX scenarios

## Index

| ID | Title | Feature | Persona | Traces | Status | Last audit |
|---|---|---|---|---|---|---|
| SCN-001 | Choose and validate a compatible profile | authoring | P-01 | ST-001, FLW-01 | validated | not audited |
| SCN-002 | Correct an invalid or incompatible declaration | authoring | P-01 | ST-001, FLW-01 | validated | not audited |
| SCN-003 | Admit before binding | admission | P-02 | ST-002, FLW-02 | validated | not audited |
| SCN-004 | Reject an unsafe project context | binding | P-02 | ST-003, FLW-02 | validated | not audited |
| SCN-005 | Bind an admitted capability | binding | P-02 | ST-002, ST-003, FLW-02 | validated | not audited |
| SCN-006 | Recover through a new revision | recovery | P-02 | ST-004, FLW-03 | validated | not audited |
| SCN-007 | Produce a governed learning proposal | learning | P-02 | ST-005, FLW-04 | validated | not audited |
| SCN-008 | Deny unsafe global promotion | learning | P-02 | ST-005, FLW-04 | validated | not audited |
| SCN-009 | Serve a request through the next available runner | routing | P-02 | ST-006, FLW-05 | validated | not audited |
| SCN-010 | Read who read my data | telemetry | P-03 | ST-007, FLW-06 | draft | not audited |
| SCN-011 | A locked setting is refused and shown | telemetry | P-03 | ST-008, FLW-07 | draft | not audited |
| SCN-012 | Link the channel and answer a stop with a button | operator-channel | P-02 | ST-009, FLW-08 | draft | not audited |
| SCN-013 | Confirm a paid action, or find it already decided | operator-channel | P-02 | ST-009, ST-010, FLW-08 | draft | not audited |

## Personas

Canonical personas are defined in [foundation.md](foundation.md): P-01
independent agent author and P-02 project operator.

## Authoring

### SCN-001: Choose and validate a compatible profile

- **Persona:** P-01
- **Feature:** authoring
- **Traces:** ST-001, FLW-01 (JTBD-01, JRN-01/#2, JRN-01/#3)
- **Entry point:** README profile chooser or direct profile link
- **Preconditions:** provider has an MCP, A2A or local-runner interface
- **Steps:**
  1. Author identifies how the provider communicates -> contract names the matching profile and the boundary it owns.
  2. Author fills the minimal manifest -> validator evaluates common and profile-specific fields separately.
  3. Author runs conformance -> report shows shape and protocol verdicts without claiming semantic admission.
- **Expected result:** author has a valid declaration and knows the remaining semantic admission gate.
- **Alt paths:** direct profile entry -> profile page links back to common objects and version policy.
- **UI elements:** profile table, schema link, example, conformance gate list.
- **States covered:** loading, error, success
- **Errors & recovery:** unresolved schema or unsupported protocol revision -> report names the exact reference or revision and supported alternatives.
- **Status:** validated
- **Coverage:** none yet
- **Product:** unobserved

### SCN-002: Correct an invalid or incompatible declaration

- **Persona:** P-01
- **Feature:** authoring
- **Traces:** ST-001, FLW-01 (JTBD-01, JRN-01/#3)
- **Entry point:** failed conformance report
- **Preconditions:** at least one gate failed
- **Steps:**
  1. Author reads the first failing gate -> report shows instance path, rule and safe recovery action.
  2. Author corrects the declaration and reruns -> unchanged gates remain comparable and corrected gate is reevaluated.
- **Expected result:** failure is corrected or remains explicitly scoped; no provider access is granted by retrying.
- **Alt paths:** author keeps an older protocol revision -> host reports incompatibility rather than silently translating it.
- **UI elements:** failed gate, instance path, recovery action, evidence link.
- **States covered:** error, success
- **Errors & recovery:** malformed evidence URI -> report rejects the report itself and points to the conformance schema.
- **Status:** validated
- **Coverage:** none yet
- **Product:** unobserved

## Admission and binding

### SCN-003: Admit before binding

- **Persona:** P-02
- **Feature:** admission
- **Traces:** ST-002, FLW-02 (JTBD-02, JRN-02/#1)
- **Entry point:** discovered provider record
- **Preconditions:** provider declaration is shape-valid
- **Steps:**
  1. Operator inspects identity and protocol negotiation -> admission record shows each independent verdict.
  2. Host runs semantic probes -> record links probe inputs, scoped outputs and evidence.
  3. Operator attempts binding -> host permits it only when admission is accepted and current.
- **Expected result:** only an admitted provider revision can become a project binding.
- **Alt paths:** admission expired or provider suspended -> existing run pins remain readable but new bindings are denied.
- **UI elements:** identity verdict, protocol verdict, probe verdict, admission status, expiry.
- **States covered:** loading, error, success
- **Errors & recovery:** identity or probe failure -> rejection names the failed gate and a new provider revision may be submitted.
- **Status:** validated
- **Coverage:** none yet
- **Product:** unobserved

### SCN-004: Reject an unsafe project context

- **Persona:** P-02
- **Feature:** binding
- **Traces:** ST-003, FLW-02 (JTBD-02, JRN-02/#2)
- **Entry point:** proposed project binding
- **Preconditions:** provider is admitted
- **Steps:**
  1. Operator selects an execution context and optional per-agent account -> validator resolves references without reading secret values.
  2. Validator compares account to the pinned project pool -> out-of-pool account is denied.
  3. Validator inspects environment declaration -> embedded credential or unrestricted ambient environment is denied.
- **Expected result:** unsafe context never becomes an active binding and the valid input remains available for correction.
- **Alt paths:** selected account is unavailable -> only a versioned fallback entry from the same project pool may be used and the switch is recorded.
- **UI elements:** context revision, pool revision, account reference, denial reason.
- **States covered:** error, success
- **Errors & recovery:** pool depleted -> run pauses with an explicit capability-unavailable result; operator may approve a new pool revision.
- **Status:** validated
- **Coverage:** none yet
- **Product:** unobserved

### SCN-005: Bind an admitted capability

- **Persona:** P-02
- **Feature:** binding
- **Traces:** ST-002, ST-003, FLW-02 (JTBD-02, JRN-02/#2)
- **Entry point:** accepted admission record
- **Preconditions:** provider, context, policy, checker and grants validate
- **Steps:**
  1. Operator selects capability and project role or node scope -> binding shows every immutable revision reference.
  2. Operator validates the proposal -> host verifies admission, allowlist, context, grant and checker.
  3. Operator records the binding -> new runs may pin it while existing runs remain unchanged.
- **Expected result:** a content-addressed binding can be reproduced without ambient state.
- **Alt paths:** optional specialist is absent -> project shows a capability gap; CEO, product manager and developer cardinalities remain valid.
- **UI elements:** capability, scope, revision references, content hash, validation result.
- **States covered:** empty, error, success
- **Errors & recovery:** any stale reference -> binding rejected with the replacement revision expected.
- **Status:** validated
- **Coverage:** none yet
- **Product:** unobserved

## Recovery

### SCN-006: Recover through a new revision

- **Persona:** P-02
- **Feature:** recovery
- **Traces:** ST-004, FLW-03 (JTBD-03, JRN-02/#4, JRN-02/#5)
- **Entry point:** failed result, suspended provider or version history
- **Preconditions:** a prior run or configuration revision exists
- **Steps:**
  1. Operator inspects DONE, PROOF, SCOPE and NOT VERIFIED -> result separates verified facts from unknowns.
  2. Operator selects replacement, rollback basis or permitted pool fallback -> policy validates the choice.
  3. Host creates a new revision or switch event -> prior revisions and run pins remain unchanged.
- **Expected result:** future work uses the recovered configuration and prior work remains reproducible.
- **Alt paths:** no known-good revision exists -> operator creates a fresh proposal rather than a false rollback.
- **UI elements:** result envelope, evidence links, revision diff, basis, switch event.
- **States covered:** empty, partial, error, success
- **Errors & recovery:** recovery candidate fails validation -> proposal remains inactive with its findings preserved.
- **Status:** validated
- **Coverage:** none yet
- **Product:** unobserved

## Learning

### SCN-007: Produce a governed learning proposal

- **Persona:** P-02
- **Feature:** learning
- **Traces:** ST-005, FLW-04 (JTBD-03, JRN-02/#6)
- **Entry point:** failed checker or repeated-stage loop guard
- **Preconditions:** failed attempt is recorded
- **Steps:**
  1. Agent records failed attempt and hypothesized cause -> retro preserves evidence and scope.
  2. Independent checker verifies a correction -> retro links the contrasting result.
  3. Agent proposes a new setting revision -> active prompt, policy, pipeline and checker remain unchanged.
  4. Product manager approves a project-scoped proposal -> host creates a new revision for future runs.
- **Expected result:** learning is contrast-based, approved and applied only through a new revision.
- **Alt paths:** same stage entered a third time without changed hypothesis -> loop guard pauses the node and asks for a new plan or decision.
- **UI elements:** failed attempt, correction, causal claim, scope, approver, proposed revision.
- **States covered:** empty, error, success
- **Errors & recovery:** missing verified correction or self-mutation target -> proposal denied with required evidence named.
- **Status:** validated
- **Coverage:** none yet
- **Product:** unobserved

### SCN-008: Deny unsafe global promotion

- **Persona:** P-02
- **Feature:** learning
- **Traces:** ST-005, FLW-04 (JTBD-03, JRN-02/#6)
- **Entry point:** proposed cross-project insight
- **Preconditions:** a project-scoped learning exists
- **Steps:**
  1. Agent proposes promotion -> policy evaluates classification, anonymization, provenance and conflicts.
  2. CEO reviews independent evidence -> missing independence or unresolved conflict keeps the insight project-local.
  3. CEO approves a safe proposal -> global insight links source project evidence without copying raw sensitive content.
- **Expected result:** only anonymized, independently supported insights become global memory.
- **Alt paths:** CEO rejects the promotion -> project learning remains valid and rejection rationale is preserved.
- **UI elements:** classification, provenance, conflicts, independent evidence, approval decision.
- **States covered:** error, success
- **Errors & recovery:** personal, credential or regulated raw content -> promotion denied; author may propose a new anonymized insight revision.
- **Status:** validated
- **Coverage:** none yet
- **Product:** unobserved

## Routing

### SCN-009: Serve a request through the next available runner

- **Persona:** P-02
- **Feature:** routing
- **Traces:** ST-006, FLW-05 (JTBD-02, JTBD-03, JRN-02/#2, JRN-02/#5)
- **Entry point:** an agent chat or a task bound to a capability of the local-runner profile
- **Preconditions:** the project pins a runner route whose candidates are admitted and catalogued
- **Steps:**
  1. Operator starts a chat -> the host walks the route from the first candidate.
  2. The first candidate is `claude-code` with `{attach: preferred, spawn: never}` and the host holds no session of it -> it is passed over as `no-held-session`.
  3. The next candidates are probed with the catalogue's version argv -> a signed-out runner is `not-connected`, a missing one `not-installed`.
  4. Hermes answers its probe and `spawn` is `allowed` -> the host spawns it under the derived execution context and records `runner-selected`.
- **Expected result:** the chat is answered by Hermes; the event names the route revision, the selection and why each candidate above it was passed over; scopes, limits and permissions are those of the binding.
- **Alt paths:** a held Claude Code session of this project exists -> it is attached and no process starts; the running runner fails later -> the next launch walks again and records `runner-switched` with `runner-failed`.
- **UI elements:** route revision, candidate list with session policy, selection, probe results, switch event.
- **States covered:** empty, partial, error, success
- **Errors & recovery:** every candidate passed over -> capability-unavailable with every probe result, under `exhausted: hold` after waiting at most `limits.wallSeconds`; the operator signs a runner in or edits the route as a new revision.
- **Status:** validated
- **Coverage:** `test/route-rules.test.ts` (FAC-SEM-028…034), fixtures `runner-route*`
- **Product:** unobserved

## Telemetry

### SCN-010: Read who read my data

- **Persona:** P-03
- **Feature:** telemetry
- **Traces:** ST-007, FLW-06 (JTBD-04, JRN-03/#3)
- **Entry point:** the organization's member page
- **Preconditions:** the member's device is enrolled; an administrator read the member's raw events and their device's health this week
- **Steps:**
  1. Member opens the access log -> the receiver lists `access-log/1` entries for the member's `user.id` and bound devices.
  2. The first entry is `activity.raw` by role `org.admin` with a purpose sentence -> the member sees who read and why.
  3. The second entry is `device.health` with the device id -> the member sees the read of their device's state.
- **Expected result:** every read of the member's raw data and device state is listed with role, scope, range and purpose; reads of summaries are not listed, because summaries carry no person.
- **Alt paths:** no read in the range -> the empty state says so.
- **UI elements:** entry list, reader role, scope, device, purpose.
- **States covered:** empty, success
- **Errors & recovery:** a read without a logged entry is a receiver defect against DEC-0030; the member raises it with the organization under its notice.
- **Status:** draft
- **Coverage:** `access-log.schema.json`, fixtures `access-log*`
- **Product:** unobserved

### SCN-011: A locked setting is refused and shown

- **Persona:** P-03
- **Feature:** telemetry
- **Traces:** ST-008, FLW-07 (JTBD-04, JRN-03/#2)
- **Entry point:** the device's settings
- **Preconditions:** the server layer locks `logging.required: true`; MDM locks `retention.raw_days: 14`; the server sets an unlocked default `x-example.banner`
- **Steps:**
  1. Member opens device settings -> each key shows its effective value, its source layer and its lock.
  2. Member switches logging off -> the device refuses: locked by the server.
  3. Member sets `x-example.banner` to `quiet` -> the user value becomes effective.
- **Expected result:** the effective settings equal the resolution of the layers (lock, then the user's value, then the highest default); no locked key changes locally.
- **Alt paths:** a new server policy whose signature does not verify -> the device keeps the held revision and reports `failed`.
- **UI elements:** key, value, source layer, lock, held revision.
- **States covered:** success, error
- **Errors & recovery:** a refused change names the locking layer; the member asks the organization to change the policy.
- **Status:** draft
- **Coverage:** `test/device-rules.test.ts` (FAC-SEM-041, FAC-SEM-042), fixtures `device-policy*`
- **Product:** unobserved

## Operator channel

### SCN-012: Link the channel and answer a stop with a button

- **Persona:** P-02
- **Feature:** operator-channel
- **Traces:** ST-009, FLW-08 (JTBD-05, JRN-04/#2, JRN-04/#3)
- **Entry point:** the agent's one-time proposal of the channel
- **Preconditions:** `example-agent` has human stops; its channel is `off`; the operator created a bot and stored its token under `EXAMPLE_AGENT_TELEGRAM_BOT_TOKEN`
- **Steps:**
  1. Operator answers the proposal `accepted` and runs the agent's link command -> the agent shows a code valid for 10 minutes and its status turns `unlinked`.
  2. Operator types the code in the chat with the bot -> the agent binds the chat and the operator's numeric user id; the status turns `linked`.
  3. The agent stops for a choice between two variants -> the chat shows the stop with one button per action.
  4. Operator presses "Variant B" -> the agent runs its own choose operation, answers the callback, and removes the keyboard.
- **Expected result:** the decision is recorded exactly as the dashboard would record it, audited with the channel and the operator's numeric user id; the token appears nowhere but the secret store.
- **Alt paths:** a code typed after 10 minutes -> refused, the operator issues a new one; a press by another group member -> no effect.
- **UI elements:** proposal with four steps, link code, stop message, action buttons, status tile.
- **States covered:** empty, success, error
- **Errors & recovery:** a webhook already set on the bot -> the status is `degraded` (`webhook-set`) with the explanation, and the operator removes the webhook or switches the agent to it.
- **Status:** draft
- **Coverage:** `operator-channel-status.schema.json`, fixtures `operator-channel-status-*`, `test/operator-channel.test.ts`
- **Product:** unobserved

### SCN-013: Confirm a paid action, or find it already decided

- **Persona:** P-02
- **Feature:** operator-channel
- **Traces:** ST-009, ST-010, FLW-08 (JTBD-05, JRN-04/#3, JRN-04/#4)
- **Entry point:** a stop in the chat whose action spends money
- **Preconditions:** the channel is `linked`; the stop "Render at the high tier" costs an estimated 4.20 USD
- **Steps:**
  1. Operator presses "Render" -> the agent sends a confirmation showing 4.20 USD and a confirm button valid for 5 minutes.
  2. Operator presses "Confirm" within 5 minutes -> the agent runs its own operation and the spend is audited.
  3. Later the operator presses an older button for a stop already answered in the dashboard -> the agent answers "already decided in the dashboard" and removes the keyboard.
- **Expected result:** no money is spent on one press; no stop is decided twice.
- **Alt paths:** the confirm button expired -> nothing is spent; the agent says to press the action again. The emergency spending stop is excluded -> the chat names the dashboard page where it is lifted.
- **UI elements:** amount, confirm button, expiry, "already decided" answer.
- **States covered:** success, error
- **Errors & recovery:** the send of the confirmation lost its response -> counted as `outcome_unknown`, not resent; the operator sees the count in the status and resends from the agent.
- **Status:** draft
- **Coverage:** `operator-channel-status.schema.json` (`excluded`, `outcomeUnknown`), DEC-0034 OC-5, OC-6
- **Product:** unobserved

