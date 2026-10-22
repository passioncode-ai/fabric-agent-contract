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
| SCN-027 | The operator unlists a Project: it leaves the directory, and a sender that knows its id still reaches it | project-board | P-02 | ST-022, FLW-18 | draft | not audited |
| SCN-028 | Add a second machine from afar: compare the code, sign with the passkey | network | P-02 | ST-023, FLW-19 | draft | not audited |
| SCN-029 | Create my network on the always-on machine | network | P-02 | ST-024, FLW-20 | draft | not audited |
| SCN-030 | Remove a lost machine, then replace another machine's key | network | P-02 | ST-025, FLW-20 | draft | not audited |
| SCN-031 | A job stops at a limit: the caller waits for the reset, resends under the same key, or hands it to a person | spend | P-02 | ST-013, FLW-10 | draft | not audited |
| SCN-032 | See what an agent uses, follow the failing connection, or learn why its declaration is not shown | connections | P-02 | ST-026, FLW-21 | draft | not audited |

## Personas

Canonical personas are defined in [foundation.md](foundation.md): P-01
independent agent author and P-02 project operator.

## Authoring

### SCN-001: Choose and validate a compatible profile

- **Persona:** P-01
- **Feature:** authoring
- **Traces:** ST-001, FLW-01 (JTBD-01, JRN-01/#2, JRN-01/#3)
- **Entry point:** the author guide's profile chooser ([connecting-compatible-agents.md](../guides/connecting-compatible-agents.md)), then `pnpm validate <file or folder>`
- **Preconditions:** provider has an MCP, A2A or local-runner interface
- **Steps:**
  1. Author identifies how the provider communicates -> the guide's chooser names the matching profile and the boundary it owns.
  2. Author fills the minimal manifest and runs `pnpm validate fabric-agent.json` -> the checker infers the manifest schema, checks the profile on the branch its `kind` selects (common and profile-specific fields separately) and runs the manifest's semantic rules.
  3. Author reads the result -> exit 0 with no line means shape and rules pass; it claims no protocol negotiation and no semantic admission, which the host still runs.
- **Expected result:** author has a valid declaration and knows the remaining admission gate.
- **Alt paths:** direct profile entry -> profile page links back to common objects and version policy; a folder with a service (descriptor, `<id>.<instance>.well-known.json`, manifest) and a provider entry with its own manifest under `<id>/` -> `pnpm validate <folder>` checks each file and the pairs, each document finding its own manifest, and a `note/pair` line names the file read when it is not the installed one at the named path.
- **UI elements:** profile table, schema link, example, `pnpm validate` output (one line per problem: path, rule, message, help link) and exit code.
- **States covered:** loading, error, success
- **Errors & recovery:** a schema the checker cannot infer -> exit 2 asks for `--schema <name>`; an unsupported protocol revision -> one line naming the member and the value it must be.
- **Status:** validated
- **Coverage:** `test/validate-cli.test.ts` (every positive fixture exits 0; schema inference; folder pairs; a service and a provider entry sharing one folder)
- **Product:** unobserved

### SCN-002: Correct an invalid or incompatible declaration

- **Persona:** P-01
- **Feature:** authoring
- **Traces:** ST-001, FLW-01 (JTBD-01, JRN-01/#3)
- **Entry point:** `pnpm validate` output with exit 1
- **Preconditions:** at least one problem was printed
- **Steps:**
  1. Author reads the first line -> it shows the file, the instance path (a pair's line starts at the document it is in: `/descriptor`, `/wellKnown`, `/entry` or `/manifest`), the rule (`schema/<keyword>`, `FAC-SEM-NNN` or `hint/...`), what to change (allowed values, the member to add or move, where vendor data goes, how to pass a credential) and a help link to the rule's row or the schema.
  2. Author corrects the declaration and reruns -> each line is reevaluated; exit 0 when none is left.
- **Expected result:** the problem is corrected or remains printed; nothing is granted by retrying.
- **Alt paths:** author keeps an older protocol revision -> the line names the revision the contract supports rather than translating it; a misspelt extension key, which the schema accepts -> a `hint/extension-key` line names the nearest key the contract defines (the same name and version under another host or path, or one within three edits), else points at the list of keys.
- **UI elements:** problem line, instance path, rule, recovery message, help link, `--json` report.
- **States covered:** error, success
- **Errors & recovery:** a file that is not JSON -> a `json` line with the parser's message; an unknown `--schema` or `--kind` -> exit 2 with the usage; an unreadable file -> exit 2 naming the file and the error.
- **Status:** validated
- **Coverage:** `test/validate-cli.test.ts` (negative fixtures exit 1 with their keyword; semantic fixtures report their codes; one line per planted mistake; usage errors exit 2), `test/schema-errors.test.ts`, `test/profile-branches.test.ts`
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
  4. A third entry is a partner organization's read of the usage of its agents the member used (`activity.usage`, service `org:<partnerOrgId>`, role `partner`, per day or period, no device; DEC-0090) -> the member sees which partner read sums that include them.
- **Expected result:** every read of the member's raw data and device state is listed with role, scope, range and purpose, and so is a partner's read of usage sums; other reads of summaries are not listed, because summaries carry no person.
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
- **Expected result:** the effective settings equal the resolution of the layers (lock, then the user's value, then the highest default; `harness.baseline` and `repair.packages` never from the user); no locked key changes locally.
- **Alt paths:** a new server policy whose signature does not verify -> the device keeps the held revision and reports `failed`; the member changes `harness.baseline` or `repair.packages` -> these are the organization's signed keys: shown with their signed layer when one sets them, and never taken from the member (DEC-0102; the device's answer to the change is CT-99).
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

### SCN-031: A job stops at a limit: the caller waits for the reset, resends under the same key, or hands it to a person

- **Persona:** P-02
- **Feature:** spend
- **Traces:** ST-013, FLW-10 (JTBD-07, JRN-06/#2)
- **Entry point:** an agent calls a job-capable capability (`agent.call` or a provider's tool) and polls `fabric.job.get`
- **Preconditions:** the provider serves DEC-0087; the caller derives its key with `intentIdempotencyKey`
- **Steps:**
  1. The subscription's window runs out mid-job and the provider will resume it -> the job stays `working`, its message `quota-exhausted until <UTC instant>`; the caller waits until then instead of polling every second.
  2. The window resets -> the provider resumes the same job -> `completed`; the operator sees one job and one charge.
- **Expected result:** a limit never turns into a second paid run: the caller waits, or resends under the key its intent derives, which the provider recognises.
- **Alt paths:** the provider will not resume -> the job ends `failed` with `quota-exhausted`, `retryable: true` and its `resetsAt`; the caller resends under the same key after the reset and the provider runs the intent again once. `retryable: false` (a plan or a provider budget must change) -> the caller stops (`person`) until the operator acts, then resends under the same key. A spend window of a grant is exhausted -> `limit-reached` (DL-19) with its approval request, which reaches the operator as SCN-017 says; once approved, the caller resends under the same key and the provider runs the intent once.
- **UI elements:** the job's status message; the operator's approval request.
- **States covered:** success, unknown, error
- **Errors & recovery:** the provider cannot tell whether an effect happened -> `outcome-unknown`; the caller reconciles (observes whether the order, message or payment exists) and never resends under a new key until it observed that the effect did not happen. Usage the provider did not measure reads unknown (`null`, `partial`) for a caller of `fabric-interop/0.2`, never 0; a caller of `fabric-interop/0.1` gets the measured lower bound, as before.
- **Status:** draft
- **Coverage:** interop Limits and uncertain effects (DEC-0087); `interop-common.schema.json` (`quotaExhaustedData`), `common.schema.json` (`usage`); `src/job-limits.ts`, `test/job-limits.test.ts` (FAC-SEM-119, FAC-SEM-120)
- **Product:** unobserved

### SCN-018: Approve one action for an outside caller

- **Persona:** P-02
- **Feature:** delegation
- **Traces:** ST-014, FLW-11 (JTBD-07, JRN-06/#3)
- **Entry point:** Fabric's approval prompt
- **Preconditions:** an outside person's agent calls `example-publisher` under a share grant (T2) with a delegation token; pushing a build is an effect that needs approval
- **Steps:**
  1. That agent asks for the push -> `example-publisher` refuses `approval-required` with the action's digest.
  2. The caller asks the hub -> Fabric shows the operator the push, the callee and who asks.
  3. Operator approves -> Fabric signs one approval (`method: prompt`) for that digest and callee, valid at most 24 hours.
  4. The caller repeats the call with it -> the callee checks the token, the grant, then the approval, consumes its `jti` and pushes.
- **Expected result:** exactly that push happens once; the approval opens nothing else.
- **Alt paths:** the same push asked from the operator's own machine (T0) -> no approval is asked for; the operator's instruction stands (DL-26).
- **UI elements:** action, callee, caller, lifetime, approve, decline.
- **States covered:** success, error
- **Errors & recovery:** the approval presented a second time -> `approval-reused`; for another action or callee -> `approval-invalid`; the caller asks for a new one. The callee's estate revision does not certify the issuer's key -> `approval-invalid` (`kid-not-certified`), or the revision is unreadable, outside its window, rolled back or forked -> `issuer-unavailable`; a new approval does not help until the callee's machine applies a revision that certifies the key (DL-14, DEC-0060).
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
- **Errors & recovery:** the named profile does not exist -> the launch is refused as an unknown profile, never run on another one; the profile's lane reads user content and its route has no open-vendor model -> the launch is refused naming the profile (`FAC-SEM-112`, DEC-0083), and the operator adds an open-vendor model to the profile.
- **Status:** draft
- **Coverage:** runners specification, Resolution and What a profile reads; `src/profile-rules.ts` `resolveModelProfile`, `closedUserContentRoute`; `test/runner-model-profiles.test.ts`, `test/open-vendor-user-content.test.ts`, `fixtures/semantic/profile-resolution-refused.json`, `fixtures/semantic/profile-resolution-user-content-*.json`
- **Product:** unobserved

## Connections

### SCN-032: See what an agent uses, follow the failing connection, or learn why its declaration is not shown

- **Persona:** P-02
- **Feature:** connections
- **Traces:** ST-026, FLW-21 (JTBD-11, JRN-10/#1, JRN-10/#2, JRN-10/#3)
- **Entry point:** `example-agent`'s Connections tab in the host
- **Preconditions:** `example-agent` declares a service connection to `example-notifier.default` for `notifier.send`, a connector `telegram` and a model; its well-known document has `degraded: [{source: "telegram"}]`
- **Steps:**
  1. Operator opens the tab -> three connections, each with its kind, target and state.
  2. The `telegram` connector -> marked failing, with its reason.
  3. Operator opens a second agent whose declaration has the id `notify` on two connections -> the tab shows none of it and says the id is named twice.
- **Expected result:** a valid declaration is shown whole with the failing connections marked; an invalid one shows nothing of itself and its reasons.
- **Alt paths:** an agent that declares nothing -> the tab says so. A `degraded[].source` equal to a connection's target but not its id -> that connection is not marked; a host may show the source as a failing part of its own (Fabric Dashboards' SCN-073).
- **UI elements:** the connections list, the failing mark, the reasons.
- **States covered:** success, failing, invalid, empty
- **Errors & recovery:** a declaration with a credential in a `reason` -> none of it is shown; the agent's author removes the credential from the text. A name that only looks like one (a long mixed model id in a purpose, a document link whose id is a long mixed run, a store target such as `sk-Prod-eu-west-1-db`) -> the same; the author removes the model id from the text or declares it as a model connection of its own whose `target` is the id, drops the link, or renames its own target.
- **Status:** draft
- **Coverage:** DEC-0096, `FAC-SEM-127`, `connectionsView` in `src/connections.ts`, `fixtures/vectors/connections.json`, `test/connections.test.ts`; Fabric Dashboards' SCN-073 is the host's own scenario
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
- **Alt paths:** the deadline passes before anyone accepts -> `expired` (with no deadline of its own, seven days after it was stored; a hold does not stop that clock). Nobody serves `project-b`'s `publish` capability when the request is submitted -> its receipt says so (`noResponder`) and it is stored. `project-b` replies to the request while it is queued -> `answered`: no responder claims it and it does not expire; `project-a` cancels it or leaves it answered. A reply to an announcement carries its reaction (`adapted`, `row`, `not-affected`) as a field once the board serves it. The request is cancelled before an effect began -> `cancelled`. The responder's session ends after it accepted -> its slot is released and the request is held `accepted`, not re-queued; a new responder continues it only by a checkpoint transfer. The operator holds the thread or `project-b`'s `publish` slot before the responder accepts -> the accept is refused `held` (retryable) and the request waits, its deadline running; a hold set after the effect began never refuses the current responder's calls on started work; if that responder's session ends under a slot or Project hold, enrollment and replacement wait for the lift, and its accepted work stays held as C4 says. So the current responder completes; a replacement waits for the lift.
- **UI elements:** thread, participants, request state, effect state.
- **States covered:** success, unknown, expired, answered
- **Errors & recovery:** the responder's result is lost after the effect began -> `outcome_unknown`; it stays until an observed reconciliation settles it `completed` or `failed_known`, and no expiry erases it. If no responder holds `project-b`'s `publish` slot any more (retired, or never re-enrolled after a restore), `project-b`'s operator, as the estate owner, checks the registry and settles it with a summary of what they observed -> the thread shows the request settled by the owner, not by a responder. Without that summary, or while a responder holds the slot, the board refuses and the request stays `outcome_unknown`; there is no way to close it as cancelled.
- **Status:** draft
- **Coverage:** project-comms Request lifecycle, Tools arguments and answers, Slots end with the session; `comms-submit.schema.json`, `comms-message.schema.json`, `comms-claim.schema.json`, `comms-fenced.schema.json`, `comms-effect-begin.schema.json`, `comms-complete.schema.json`, `comms-reconcile.schema.json`, `comms-cancel.schema.json`, `comms-responder-replace.schema.json`, `comms-receipt.schema.json`; project-comms Owner settlement (DEC-0081); `test/comms-rules.test.ts` (FAC-SEM-026, FAC-SEM-027, FAC-SEM-109), `test/comms-tools.test.ts`; project-comms Holds, `src/comms-hold.ts`, `test/comms-hold.test.ts` (DEC-0079)
- **Product:** unobserved

### SCN-027: The operator unlists a Project: it leaves the directory, and a sender that knows its id still reaches it

- **Persona:** P-02
- **Feature:** project-board
- **Traces:** ST-022, FLW-18 (JTBD-09, JRN-08/#4)
- **Entry point:** the host's Project settings, where `project-b`'s operator turns its listing off
- **Preconditions:** `project-b` is listed with its `publish` capability; `project-a` already holds `project-b`'s id from an earlier thread; `project-c` does not
- **Steps:**
  1. The operator unlists `project-b` -> the next `com.directory` page read by any session of the estate omits it, with or without a `publish` capability filter.
  2. `project-c`'s session pages through the directory -> `project-b` appears on no page.
  3. `project-a` submits a request to `project-b`'s `publish` capability by id -> the board queues it as before; unlisting refuses no message.
- **Expected result:** the Project is out of discovery and nothing else: no sender that knows it loses it, and the listing setting survives a restore.
- **Alt paths:** the operator lists it again -> it is back on the pages and filters it qualifies for.
- **UI elements:** the listing switch with its one-line explanation; the directory page an agent reads.
- **States covered:** success, error
- **Errors & recovery:** the host cannot save the setting -> it says the change was not saved, and the Project stays as it was.
- **Status:** draft
- **Coverage:** project-comms Project directory; `comms-directory.schema.json`, `comms-directory-args.schema.json`; `test/comms-tools.test.ts` (the directory's boundary)
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

## Network

### SCN-028: Add a second machine from afar: compare the code, sign with the passkey

- **Persona:** P-02
- **Feature:** network
- **Traces:** ST-023, FLW-19 (JTBD-10, JRN-09/#2)
- **Entry point:** Fabric's "Add a machine" on the operator's daily machine, which is in the network
- **Preconditions:** the network exists (revision 1 signed); the second machine runs the node and is in another place
- **Steps:**
  1. Operator opens "Add a machine" -> the trusted machine opens a one-time rendezvous and shows its link with 10 minutes to run.
  2. The second machine joins with the link -> both commit, then both reveal.
  3. Both screens show the same six digits and the network's fingerprint -> the operator confirms "The codes match".
  4. The passkey prompt opens on the trusted machine -> the operator signs; the revision lists the second machine with its keys.
  5. The second machine receives the chain -> it checks it starts at the network the code bound and lists its keys, applies it, and shows itself in the network.
- **Expected result:** the second machine is in the network; nothing was typed but the passkey, and no key was copied.
- **Alt paths:** nearby, the second machine shows a code instead of a link and the rest is the same. A server with no screen redeems Fabric's enroll token, read from stdin or a private file (mode 0600), binding its own key; it prints its key fingerprint, and before the operator signs, Fabric shows the fingerprint of the key it is about to list — they match, the operator signs; they differ, someone else redeemed the token first, so the operator signs nothing and revokes it. A second use of the token is refused and logged.
- **UI elements:** the code and the fingerprint on both screens, "The codes match" / "They differ", the passkey prompt.
- **States covered:** loading, error, success
- **Errors & recovery:** the codes differ -> "They differ" burns the rendezvous; nothing is signed; a new attempt uses new nonces. The link is older than 10 minutes -> the rendezvous has expired; the operator starts again. The chain starts at another network -> the second machine refuses it (`other-estate`) and pins nothing. Headless: the fingerprints differ -> the operator signs nothing and revokes the token.
- **Status:** draft
- **Coverage:** ceremonies specification, Add a machine; `src/pairing.ts`; `test/pairing.test.ts`, `fixtures/vectors/pairing.json`; headless: `src/enroll-token.ts`, `test/enroll-token.test.ts`, `fixtures/vectors/enroll-token.json`
- **Product:** unobserved

### SCN-029: Create my network on the always-on machine

- **Persona:** P-02
- **Feature:** network
- **Traces:** ST-024, FLW-20 (JTBD-10, JRN-09/#1)
- **Entry point:** Fabric's "Create my network" on the machine that stays on
- **Preconditions:** the node runs on this machine; no network exists
- **Steps:**
  1. Operator chooses "Create my network" -> the machine makes its device keys and the hub's own key.
  2. Fabric drafts revision 1 -> the passkey prompt opens; the operator signs.
  3. The machine verifies revision 1 under that passkey and pins it -> Fabric and the machine show the network's fingerprint.
- **Expected result:** the network exists with this machine and its hub key; later machines join it.
- **Alt paths:** created on another machine -> revision 1 lists that machine only, and the hub key comes with the revision that adds the always-on machine.
- **UI elements:** "Create my network", the passkey prompt, the fingerprint.
- **States covered:** empty, error, success
- **Errors & recovery:** the operator cancels the prompt -> nothing is signed and no machine pins anything; the operator starts again.
- **Status:** draft
- **Coverage:** ceremonies specification, Create my network; `src/estate-record-rules.ts`; `test/estate-record.test.ts`, `test/ceremonies.test.ts`
- **Product:** unobserved

### SCN-030: Remove a lost machine, then replace another machine's key

- **Persona:** P-02
- **Feature:** network
- **Traces:** ST-025, FLW-20 (JTBD-10, JRN-09/#3)
- **Entry point:** the network's machine list in Fabric
- **Preconditions:** the network has three machines; one was lost; another's keystore was reset
- **Steps:**
  1. Operator chooses "Remove" on the lost machine -> Fabric drafts a revision that revokes the machine and its hub key; the operator signs.
  2. The hub sends the revocations as delta entries -> within seconds the relay turns the lost machine away and ends its sessions.
  3. Operator chooses "Replace key" on the reset machine -> it pairs again under its id, the codes match, the operator signs a revision listing its new keys and revoking the old ones by reference.
  4. The machine holds the new keys -> it applies the revision; a session or envelope under the old key is refused.
- **Expected result:** the lost machine is out; the re-keyed machine keeps its id and its agents.
- **Alt paths:** the network has one machine -> re-keying needs no pairing: the operator signs on the machine itself.
- **UI elements:** "Remove", "Replace key", the comparison code, the passkey prompt.
- **States covered:** error, success
- **Errors & recovery:** a revision that drops a machine or key without revoking it is refused by every machine pinned at or after DEC-0084 (`FAC-SEM-114`; an older reader accepts it, ceremonies *Compatibility*); Fabric runs the rule before asking for the passkey. A stolen machine is removed, never re-keyed.
- **Status:** draft
- **Coverage:** ceremonies specification, Remove a machine, Replace a machine's key; `src/estate-record-rules.ts`, `src/relay.ts` `sessionStands`; `test/ceremonies.test.ts`, `fixtures/vectors/relay.json`
- **Product:** unobserved
