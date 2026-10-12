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
| SCN-014 | Several agents share one group: only the addressed bot answers | operator-channel | P-02 | ST-009, FLW-08 | draft | not audited |
| SCN-015 | Open Fabric from a product's dashboard | fabric-button | P-02 | ST-011, FLW-09 | draft | not audited |
| SCN-016 | Choose a project's spend policy at its first paid run | spend | P-02 | ST-012, FLW-10 | draft | not audited |
| SCN-017 | Answer a spend approval request | spend | P-02 | ST-013, FLW-10 | draft | not audited |
| SCN-018 | Approve one action for an outside caller | delegation | P-02 | ST-014, FLW-11 | draft | not audited |
| SCN-019 | A dashboard session ends and the host signs in again | service | P-02 | ST-015, FLW-12 | draft | not audited |
| SCN-020 | A launch the project's model classes leave without a model is refused, naming the policy | routing | P-02 | ST-006, FLW-05 | draft | not audited |
| SCN-021 | Widen the console beside a dashboard: navigation stays reachable, the page keeps its floor | embedded-dashboard | P-02 | ST-016, FLW-13 | draft | not audited |
| SCN-022 | Choose a theme in the host: each page applies the fields it declared | embedded-dashboard | P-02 | ST-017, FLW-13 | draft | not audited |
| SCN-023 | An agent finds a standing grant and proceeds without asking | spend | P-02 | ST-018, FLW-14 | draft | not audited |
| SCN-024 | Restore settings after the data directory was lost | settings | P-02 | ST-019, FLW-15 | draft | not audited |
| SCN-025 | Follow a request on the Project board to its result, or to outcome_unknown | project-board | P-02 | ST-020, FLW-16 | draft | not audited |
| SCN-026 | A second copy of a service starts, by hand or by its supervisor | service | P-02 | ST-021, FLW-17 | draft | not audited |

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
- **Errors & recovery:** a webhook already set on the bot -> the status is `degraded` (`webhook-set`) with the explanation, and the operator removes the webhook or switches the agent to it. The agent's receiver stops while it waits for the code -> the status is `degraded` (`receiver-missing`, `receiver.lease: none`), never `unlinked`, and the operator restarts the receiver before typing the code (OC-17, DEC-0058).
- **Status:** draft
- **Coverage:** `operator-channel-status.schema.json`, fixtures `operator-channel-status-*` (among them `operator-channel-status-unlinked-lease-none` and `operator-channel-status-degraded-receiver-missing-unlinked`), `test/operator-channel.test.ts`
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

### SCN-014: Several agents share one group: only the addressed bot answers

- **Persona:** P-02
- **Feature:** operator-channel
- **Traces:** ST-009, FLW-08 (JTBD-05, JRN-04/#2, JRN-04/#3)
- **Entry point:** a group in which the operator has bound the bots of several agents, each an administrator
- **Preconditions:** `example-agent`'s bot (`ExampleAgentBot`) and a second agent's bot are in the group; both receive every message there
- **Steps:**
  1. Operator writes a plain sentence to the group -> no bot answers and nothing happens.
  2. Operator sends a bare `/status` -> no bot answers; the operator is expected to name the bot.
  3. Operator sends `/status@ExampleAgentBot` -> only `example-agent` answers, once.
  4. The second agent shows a link code, and the operator sends a bare `/link CODE` in the group -> the second agent binds; `example-agent`, for which the code does not match, says nothing.
  5. Operator replies to a message from `example-agent` with an unknown word -> `example-agent` answers once, in one line, with what it accepts.
- **Expected result:** each bot answers only what is addressed to it, at most once per message; the operator never reads "unknown command" or "code did not match" for text meant for another bot.
- **Alt paths:** `/link@ExampleAgentBot` with a wrong code -> one short refusal from `example-agent` only. In a private chat with the bot, a bare `/status` is answered.
- **UI elements:** group chat, command naming the bot, reply to the bot, one-line answer, status tile.
- **States covered:** success, error, degraded
- **Errors & recovery:** the receiver of `example-agent` has stopped and its updates wait -> the status is `degraded` (`receiver-missing`) with the pending count, instead of a silent bot; the operator restarts the agent's receiver.
- **Status:** draft
- **Coverage:** DEC-0035 OC-14…OC-17, fixtures `operator-channel-status-degraded-receiver-missing` and `operator-channel-status-linked-without-receiver`, `test/operator-channel.test.ts`
- **Product:** unobserved

## Fabric's button

### SCN-015: Open Fabric from a product's dashboard

- **Persona:** P-02
- **Feature:** fabric-button
- **Traces:** ST-011, FLW-09 (JTBD-06, JRN-05/#1, JRN-05/#2, JRN-05/#4)
- **Entry point:** Fabric's button in the corner of `example-agent`'s dashboard
- **Preconditions:** the dashboard serves project `project-a`; Fabric is installed
- **Steps:**
  1. Operator presses the button -> a menu offers "Chat with Fabric about Example Agent" and "Open a coding session in project-a".
  2. Operator chooses the chat -> the page follows `fabric://chat?service=example-agent.default&project=project-a`; Fabric opens the manager conversation for that service and project, empty, and sends nothing.
  3. Back in the dashboard, the operator chooses the session -> Fabric shows `project-a`'s session view with the default runner chosen; nothing runs until the operator presses Start.
- **Expected result:** Fabric opens on the right service and project in one press; no message is sent, no runner starts and nothing is spent by the link.
- **Alt paths:** the link names a runner that is not installed -> Fabric uses the project's default runner and says so. The page is embedded in Fabric Dashboards, which draws its own button -> the page's button is hidden.
- **UI elements:** floating button, menu with two actions, the absent message.
- **States covered:** success, empty, error
- **Errors & recovery:** Fabric is not installed -> the menu says "Fabric is not installed — get it at passioncode.ai/fabric" with the link; a link carrying a token or a bad id -> Fabric refuses the whole link and says why.
- **Status:** draft
- **Coverage:** DEC-0040 FB-1…FB-8, FL-1…FL-7, `fabric-link.schema.json`, `test/fabric-button.test.ts`
- **Product:** unobserved

## Spend and delegation

### SCN-016: Choose a project's spend policy at its first paid run

- **Persona:** P-02
- **Feature:** spend
- **Traces:** ST-012, FLW-10 (JTBD-07, JRN-06/#1)
- **Entry point:** the first run of `project-a` that would spend money
- **Preconditions:** `project-a` has no spend policy; its agents declare cost presets; its usage reports show about 20 USD in the last month
- **Steps:**
  1. Operator starts the run -> the launcher stops before any spend and offers about 20, 40 and 80 USD a month and "no project limit", with 40 preselected, naming the presets, the recent spend and the kind of work it used.
  2. Operator confirms 40 USD with an auto-approve threshold of 2 USD -> the policy is recorded with its inputs and the run starts.
  3. A later run of the same project -> the launcher does not ask again.
- **Expected result:** one recorded choice per project, its reasons kept beside it; nothing spent before it.
- **Alt paths:** operator picks "no project limit" -> recorded as that choice; only the estate total (L0) stops spending.
- **UI elements:** options, preselected option, inputs, threshold, confirm.
- **States covered:** success, empty
- **Errors & recovery:** a threshold above the monthly limit -> refused (`FAC-SEM-047`) with the limit named; the operator lowers it.
- **Status:** draft
- **Coverage:** spend-policy specification, The spend policy; `spend-policy.schema.json`, `test/spend-policy.test.ts`
- **Product:** unobserved

### SCN-017: Answer a spend approval request

- **Persona:** P-02
- **Feature:** spend
- **Traces:** ST-013, FLW-10 (JTBD-07, JRN-06/#2)
- **Entry point:** a grant check above `project-a`'s auto-approve threshold
- **Preconditions:** the policy's threshold is 2 USD; the operator channel is `linked`; a render would cost 4.20 USD
- **Steps:**
  1. The agent asks the meter -> the meter denies it, `limit-reached` at L1 with window `task` (the auto-approve threshold is a per-task limit), with one filed approval request; the agent files no second one and goes on with other work.
  2. The request reaches the operator in the chat -> the confirmation shows 4.20 USD first.
  3. Operator confirms -> the agent asks the meter again and is allowed, with a receipt.
- **Expected result:** money above the threshold moves only after one answer that showed the amount; the agent was never blocked.
- **Alt paths:** a callee relays the denial to its own caller -> `limit-reached` with the window and level unchanged (DL-21 step 6).
- **UI elements:** amount, confirm button, expiry.
- **States covered:** success, error
- **Errors & recovery:** the confirm button expired -> nothing is spent; the request stays filed and the operator answers it again.
- **Status:** draft
- **Coverage:** spend-policy specification, rule 3; `grant-check.schema.json`; `refusalFromDenial`, `test/delegation-sealed.test.ts` (F-B-301)
- **Product:** unobserved

### SCN-018: Approve one action for an outside caller

- **Persona:** P-02
- **Feature:** delegation
- **Traces:** ST-014, FLW-11 (JTBD-07, JRN-06/#3)
- **Entry point:** Fabric's approval prompt
- **Preconditions:** a partner's agent calls `example-publisher` under a share grant (T2) with a delegation token; pushing a build is an effect that needs approval
- **Steps:**
  1. The partner's agent asks for the push -> `example-publisher` refuses `approval-required` with the action's digest.
  2. The caller asks the hub -> Fabric shows the operator the push, the callee and who asks.
  3. Operator approves -> Fabric signs one approval (`method: prompt`) for that digest and callee, valid at most 24 hours.
  4. The caller repeats the call with it -> the callee checks the token, the grant, then the approval, consumes its `jti` and pushes.
- **Expected result:** exactly that push happens once; the approval opens nothing else.
- **Alt paths:** the same push asked from the operator's own machine (T0) -> no approval is asked for; the operator's instruction stands (DL-26).
- **UI elements:** action, callee, caller, lifetime, approve, decline.
- **States covered:** success, error
- **Errors & recovery:** the approval presented a second time -> `approval-reused`; for another action or callee -> `approval-invalid`; the caller asks for a new one.
- **Status:** draft
- **Coverage:** delegation DL-17, DL-18, DL-25, DL-26; `approval.schema.json`; the refusal wire `delegation-refusal.schema.json` with fixtures `delegation-refusal-approval-required` and `delegation-refusal-*`; `test/delegation.test.ts`, `test/delegation-sealed.test.ts`
- **Product:** unobserved

### SCN-019: A dashboard session ends and the host signs in again

- **Persona:** P-02
- **Feature:** service
- **Traces:** ST-015, FLW-12 (JTBD-06, JRN-05/#3)
- **Entry point:** a dashboard page shown in Fabric Dashboards
- **Preconditions:** the operator session began 7 days ago and has been used every day
- **Steps:**
  1. The 7-day bound passes -> the next page request answers `401` with a page saying the session ended and why.
  2. The host sees the `401` -> it asks for a new login code and reopens the same page under a new session.
- **Expected result:** the operator sees the page again without signing in by hand, and never acts on a dead session.
- **Alt paths:** the service's descriptor token was rotated -> every session begun under the old token ends at once, the same way. The page's own API call answers `401` -> the host does not reload the page.
- **UI elements:** the ended-session message.
- **States covered:** error, success
- **Errors & recovery:** the service refuses every new code -> the host retries at most once a minute per page, and the page keeps explaining the state.
- **Status:** draft
- **Coverage:** service specification, Operator login and the session's lifetime; `src/operator-session.ts`; `test/delegation-sealed.test.ts` (F-B-311)
- **Product:** unobserved

## Runner and model profiles

### SCN-020: A launch the project's model classes leave without a model is refused, naming the policy

- **Persona:** P-02
- **Feature:** routing
- **Traces:** ST-006, FLW-05 (JTBD-02, JRN-02/#2)
- **Entry point:** an agent chat or a task of a project whose spend policy names model classes
- **Preconditions:** the agent resolves to the model profile `default` (DeepSeek V4 Pro, then Claude Sonnet 5.5); the project's spend policy allows only the class `strong`
- **Steps:**
  1. Operator starts a chat -> the host resolves the model profile: no request names one, the agent names `default`.
  2. The host keeps the profile's models every class of which the policy allows -> DeepSeek V4 Pro is also `cheap` and `chinese-vendor`, Claude Sonnet 5.5 also `code` and `vision`; none stays.
  3. The host refuses the launch with `model-classes-empty` -> it names the profile and the spend policy by id and revision, and starts no runner.
- **Expected result:** the operator sees which policy left the profile without a model and changes the policy or the profile in Fabric; nothing ran and nothing was spent.
- **Alt paths:** the policy also allows `code` and `vision` -> Claude Sonnet 5.5 stays and the chat starts on it; the policy names no classes -> the profile is used whole.
- **UI elements:** the refusal with the profile and the policy named, a link to the policy in Fabric.
- **States covered:** error, success
- **Errors & recovery:** the named profile does not exist -> the launch is refused as an unknown profile, never run on another one.
- **Status:** draft
- **Coverage:** runners specification, Resolution; `src/profile-rules.ts` `resolveModelProfile`; `test/runner-model-profiles.test.ts`, `fixtures/semantic/profile-resolution-refused.json`
- **Product:** unobserved

## Embedded dashboard

### SCN-021: Widen the console beside a dashboard: navigation stays reachable, the page keeps its floor

- **Persona:** P-02
- **Feature:** embedded-dashboard
- **Traces:** ST-016, FLW-13 (JTBD-08, JRN-07/#1, JRN-07/#2)
- **Entry point:** `example-agent`'s dashboard in Fabric Dashboards, the agent console open beside it
- **Preconditions:** the window is 1280 CSS pixels wide; the page declares `minWidth: 360` under the dashboard extension key; its navigation has 14 destinations
- **Steps:**
  1. Operator drags the console wider -> the page narrows, and its navigation wraps or moves the destinations that no longer fit into a visible *More* menu.
  2. The page reaches 480 CSS pixels -> the console stops growing; the document does not scroll sideways.
  3. Operator opens *More* -> every destination that left the bar is there.
- **Expected result:** at every console width the host allows, every primary destination is reachable without sideways scrolling, and the page never gets less than the host floor `max(480, minWidth)`.
- **Alt paths:** a page that declares `minWidth: 720` -> the console stops when the page has 720 CSS pixels. A window too narrow for the page's floor and the panes' minimums -> the host keeps the panes' minimums, the page keeps its floor layout and scrolls sideways; the host never zooms it.
- **UI elements:** pane divider, the page's navigation, *More* menu.
- **States covered:** success, narrow, below floor
- **Errors & recovery:** a page whose navigation scrolls sideways in a strip -> the adapter's layout check reports ED-3 at 480 CSS pixels; the agent's author moves the extra destinations into a menu.
- **Status:** draft
- **Coverage:** embedded-dashboard ED-1, ED-2, ED-3, ED-7; `service-dashboard-extension.schema.json` (`minWidth` 360…1280); `hostView` in `src/dashboard-declaration.ts` (the host floor); `test/embedded-dashboard.test.ts`. ED-1…ED-3 (the floor layout, reachable navigation) are prose rules a service proves on its rendered page with the adapter's layout check; no contract test measures them.
- **Product:** unobserved

### SCN-022: Choose a theme in the host: each page applies the fields it declared

- **Persona:** P-02
- **Feature:** embedded-dashboard
- **Traces:** ST-017, FLW-13 (JTBD-08, JRN-07/#3, JRN-07/#4)
- **Entry point:** the host's appearance picker
- **Preconditions:** `example-agent` declares `appearance: [scheme, theme]`; a second agent declares `appearance: [scheme]`; a third declares the dashboard key with `{minWidth: 99999}`
- **Steps:**
  1. Operator chooses dark and `ocean` -> the host writes `fabric_appearance=v=1&scheme=dark&theme=ocean` where each page reads it.
  2. `example-agent`'s page -> shows dark `ocean` and hides its own scheme and theme controls.
  3. The second agent's page -> turns dark and keeps its own theme control.
  4. The third agent's page -> the host finds the declaration invalid, treats it as not declared (host floor 480) and logs it once for this load; the page takes nothing from the host's cookie and follows the system colour scheme unless the operator set the page's own control.
- **Expected result:** each page applies exactly the carrier fields it declared, and an invalid declaration is a legacy dashboard, never a page given a floor no window can hold.
- **Alt paths:** a host that gives each service its own cookie store (Fabric Dashboards' partition per service) -> the cookie is per service. Pages on a shared cookie store under one host name -> one cookie serves them all, so a per-service choice is not available there.
- **UI elements:** scheme and theme picker, the pages' own appearance controls.
- **States covered:** success, legacy
- **Errors & recovery:** an unknown theme id in the cookie -> the page uses its default theme; the operator picks a theme the page lists in `themes`.
- **Status:** draft
- **Coverage:** embedded-dashboard ED-6, ED-8, ED-9 and DEC-0059; `FAC-SEM-080` and `hostView` in `src/dashboard-declaration.ts`; `fixtures/semantic/service-well-known-dashboard-invalid.json`, `fixtures/vectors/dashboard-declaration.json`; `test/embedded-dashboard.test.ts`
- **Product:** unobserved

## Standing grants

### SCN-023: An agent finds a standing grant and proceeds without asking

- **Persona:** P-02
- **Feature:** spend
- **Traces:** ST-018, FLW-14 (JTBD-07, JRN-06/#4)
- **Entry point:** an agent of `project-a` about to call a paid model for 1.80 USD
- **Preconditions:** `project-a` holds a standing grant with `spend.mode: limited` and a `month` limit of 40 USD with 12 USD spent; its spend policy's auto-approve threshold (L1) is 2 USD
- **Steps:**
  1. The agent asks the meter with the amount -> the meter answers `allowed` with a receipt and reserves 1.80 USD against the grant and every level above it.
  2. The agent makes the call -> no question reaches the operator.
  3. The agent's usage report settles the spend -> `byGrant` lists the receipt under the grant.
- **Expected result:** the operator sees the spend under its grant afterwards and was not asked: the record was the proof.
- **Alt paths:** the call would cost 2.40 USD, above the project policy's 2 USD threshold -> `denied` `limit-reached` at L1 with window `task` (the threshold is a per-task limit) and one filed approval request, as in SCN-017.
- **UI elements:** usage report by grant, receipt.
- **States covered:** success, error
- **Errors & recovery:** the grant expired -> `denied` `grant-expired`, `level: null`; the agent relays the code unchanged and goes on with other work.
- **Status:** draft
- **Coverage:** spend-policy Grants and Checking; `grant-check.schema.json` (fixtures `grant-check-allowed`, `grant-check-denied`), `service-usage.schema.json` (fixture `service-usage-by-grant`); `test/spend-policy.test.ts`, `test/meter-grant.test.ts`
- **Product:** unobserved

## Settings restore

### SCN-024: Restore settings after the data directory was lost

- **Persona:** P-02
- **Feature:** settings
- **Traces:** ST-019, FLW-15 (JTBD-03, JRN-02/#5)
- **Entry point:** `example-agent` starting after its data directory was purged
- **Preconditions:** 14 snapshots in the service's settings-backup folder; the newest is damaged; the one before it is intact and holds 3 project bindings
- **Steps:**
  1. The service starts on a fresh database that has never started -> it skips the damaged snapshot, names it in the report, and restores from the newest intact one.
  2. Operator reads the report -> 3 bindings inserted, the columns dropped and defaulted named, no row overwritten.
- **Expected result:** every decision the operator made is back, and nothing that existed was changed.
- **Alt paths:** the database already holds records -> no automatic restore; the operator opens a preview of a chosen snapshot and applies it.
- **UI elements:** restore report, preview, apply.
- **States covered:** preview, success, error
- **Errors & recovery:** a row needs a required column the snapshot lacks -> the row is refused with its key and reason and not counted as inserted; the operator re-enters that binding.
- **Status:** draft
- **Coverage:** service Settings backup and Restore; `settings-backup.schema.json`; `src/settings-backup.ts` (FAC-SEM-035, the snapshot file); `test/settings-backup.test.ts`. The Restore steps (add, never overwrite; automatic restore only on a fresh database; the preview and the report) are prose rules the service proves; no contract test runs a restore.
- **Product:** unobserved

## Project board

### SCN-025: Follow a request on the Project board to its result, or to outcome_unknown

- **Persona:** P-02
- **Feature:** project-board
- **Traces:** ST-020, FLW-16 (JTBD-09, JRN-08/#1, JRN-08/#2, JRN-08/#3)
- **Entry point:** a new thread on the board in which `project-a` asks `project-b`'s `publish` capability for a release
- **Preconditions:** both Projects take part in the thread, fixed at its creation
- **Steps:**
  1. A responder of `project-b` claims and accepts the request -> the thread shows `accepted`, effect `not_started`.
  2. The responder begins publishing -> `in_progress`, effect `started`.
  3. The responder completes with the observed release -> `completed`.
- **Expected result:** the operator reads the request state and the effect state as two facts, each set by its operation, never inferred from a delivery or a read mark.
- **Alt paths:** the deadline passes before anyone accepts -> `expired`. The request is cancelled before an effect began -> `cancelled`.
- **UI elements:** thread, participants, request state, effect state.
- **States covered:** success, unknown, expired
- **Errors & recovery:** the responder's result is lost after the effect began -> `outcome_unknown`; it stays until an observed reconciliation settles it `completed` or `failed_known`, and no expiry erases it.
- **Status:** draft
- **Coverage:** project-comms Request lifecycle; `comms-submit.schema.json`, `comms-message.schema.json`; `test/comms-rules.test.ts` (FAC-SEM-026, FAC-SEM-027)
- **Product:** unobserved

## Services

### SCN-026: A second copy of a service starts, by hand or by its supervisor

- **Persona:** P-02
- **Feature:** service
- **Traces:** ST-021, FLW-17 (JTBD-03, JRN-02/#3)
- **Entry point:** a terminal where the operator runs the service, or its supervisor restarting it
- **Preconditions:** the service runs under launchd and holds `service.lock`; Fabric Dashboards shows it `ready`
- **Steps:**
  1. Operator runs the service by hand -> the copy finds the lock held, tries once, prints "Example Agent is already running (pid 4242)." and exits 75; nothing else changes.
  2. launchd starts a second copy from a plist carrying `FABRIC_SERVICE_SUPERVISOR=launchd` -> the copy waits for the lock, touching nothing, for at most 300 s.
  3. Meanwhile the holder keeps answering -> the host lists the service as two copies (`duplicate`), never `down`.
  4. The wait runs out -> the copy exits 75 naming the holder; launchd starts it again later, a few starts an hour instead of one every 10 s.
- **Expected result:** the running copy is never disturbed and the operator sees two copies, not an outage, and removes the duplicate install.
- **Alt paths:** the holder leaves during the wait -> the waiting copy takes the lock and runs. Under the Task Scheduler (the marker in the task's arguments) -> the host shows the holder `ready` and nothing of the waiting copy. The lock records no pid yet -> the sentence says the holder is unknown.
- **UI elements:** the service card's `duplicate` mark with both pids; the copy's one sentence in its log.
- **States covered:** loading, error, success
- **Errors & recovery:** the plist says launchd and the arguments say task-scheduler -> the copy exits 75 at once naming both markers, without trying the lock; the operator fixes the supervisor file.
- **Status:** draft
- **Coverage:** service specification, One copy; `src/service-supervisor.ts`; `test/service-supervisor.test.ts`, `fixtures/semantic/service-lock-*.json`
- **Product:** unobserved
