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
| SCN-033 | Find an agent in my estate or my organization; an unlisted one is marked for its publisher and absent for a member | agent-network | P-02 | ST-027, FLW-22 | draft | not audited |
| SCN-034 | A call to a busy agent waits with its place shown, or is refused with a time to start again | agent-network | P-02 | ST-028, FLW-23 | draft | not audited |
| SCN-035 | See how busy an agent is, or learn why its load is not shown | agent-network | P-02 | ST-029, FLW-24 | draft | not audited |
| SCN-036 | An agent calls an agent on another of the owner's machines, or is refused by a machine's profile | machine-calls | P-02 | ST-030, FLW-25 | draft | not audited |
| SCN-037 | Keep a machine for reading only | machine-calls | P-02 | ST-031, FLW-26 | draft | not audited |
| SCN-038 | The hub goes quiet: hear of it after a day and move it to another machine | network | P-02 | ST-032, FLW-27 | draft | not audited |
| SCN-039 | Lose a passkey and keep the network | network | P-02 | ST-032, FLW-27 | draft | not audited |
| SCN-040 | An agent asks for a token for one zone and gets it in its organization's context | credentials | P-02 | ST-033, FLW-28 | draft | not audited |
| SCN-041 | A member leaves and the credentials of their agents end | credentials | P-02 | ST-033, FLW-28 | draft | not audited |
| SCN-042 | See every call between agents, and nobody's prompts | credentials | P-02 | ST-034, FLW-28 | draft | not audited |
| SCN-043 | Tell my agent to approve: the service takes it as my decision | delegation | P-02 | ST-035, FLW-29 | draft | not audited |
| SCN-044 | Open a service's page from my agent: in Fabric Dashboards, never a raw address | service | P-02 | ST-036, FLW-30 | draft | not audited |
| SCN-045 | Give a task once: the research agent my developer agent engages runs it without asking me again | delegation | P-02 | ST-037, FLW-31 | draft | not audited |
| SCN-046 | Approve once in one agent's chat: the agent that holds the key acts without asking me again | delegation | P-02 | ST-037, FLW-31 | draft | not audited |
| SCN-047 | Join an organization by my own passkey: my Fabric trusts the membership only from what the organization signed | membership | P-03 | ST-038, FLW-32 | draft | not audited |
| SCN-048 | Enrolled in two organizations, my machine looks like two strangers to them | membership | P-03 | ST-038, FLW-32 | draft | not audited |
| SCN-049 | As an administrator, I sign who my organization's relay admits; no server signs it | membership | P-03 | ST-038, FLW-32 | draft | not audited |
| SCN-052 | Share a model key with a colleague's machine, compare six digits, take it back | peer share | P-02 | ST-039, FLW-33 | draft | not audited |
| SCN-053 | An agent needs a token; I type it into my app's own window | secret prompt | P-02 | ST-040, FLW-34 | draft | not audited |

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
- **Alt paths:** a new server policy whose signature does not verify -> the device keeps the held revision and reports `failed`; the member changes `harness.baseline` or `repair.packages` -> these are the organization's signed keys: shown with their signed layer when one sets them, and never taken from the member (DEC-0102; the device's answer to the change is CT-99). The organization closed -> its server answers `organization-closed` (DEC-0103): the device shows the server's sentence and the date, stops reporting to it, and lifts that organization's server locks with its enrollment.
- **UI elements:** key, value, source layer, lock, held revision, the closed organization's sentence and date.
- **States covered:** success, error, closed
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
- **Preconditions:** the dashboard serves project `project-a`; its `lang` is `en` or absent; Fabric is installed
- **Steps:**
  1. Operator presses the button -> a menu offers "Chat with Fabric about Example Agent" and "Open a coding session in project-a".
  2. Operator chooses the chat -> the page follows `fabric://chat?service=example-agent.default&project=project-a`; Fabric opens the manager conversation for that service and project, empty, and sends nothing.
  3. Back in the dashboard, the operator chooses the session -> Fabric shows `project-a`'s session view with the default runner chosen; nothing runs until the operator presses Start.
- **Expected result:** Fabric opens on the right service and project in one press; no message is sent, no runner starts and nothing is spent by the link.
- **Alt paths:** the link names a runner that is not installed -> Fabric uses the project's default runner and says so. The page is embedded in Fabric Dashboards, which draws its own button -> the page's button is hidden. The page's `lang` is `ru` -> the name and the items are in Russian («Открыть Fabric»), *Fabric* and the names unchanged; a language the button has no words for -> English.
- **UI elements:** floating button, menu with two actions, the absent message.
- **States covered:** success, empty, error
- **Errors & recovery:** Fabric is not installed -> the menu says "Fabric is not installed. Get it at passioncode.ai/fabric" (in the page's language) with the link; a link carrying a token or a bad id -> Fabric refuses the whole link and says why.
- **Status:** draft
- **Coverage:** DEC-0040 FB-1…FB-8, FL-1…FL-7, DEC-0124 (the page's language; proven in fabric-agent-adapter `test/fabric-button.test.mjs`), `fabric-link.schema.json`, `test/fabric-button.test.ts`
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
- **Alt paths:** operator picks "no project limit" -> recorded as that choice; only the estate total (L0) stops spending. A service in the window ran calls on a subscription -> the project's recent spend is unknown (`recentSpendUsd: null`), and while none of its calls is unpriced the offer's wording may name its cost including estimates as an upper bound, labelled so (DEC-0110).
- **UI elements:** options, preselected option, inputs, threshold, confirm.
- **States covered:** success, empty, unknown
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
- **Alt paths:** the same push asked from the operator's own machine (T0) -> no approval is asked for; the operator's instruction stands (DL-26), carried in `_meta.decision` when the push is a `relayed` action (SCN-043, DEC-0121).
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

## Agent network

### SCN-033: Find an agent in my estate or my organization; an unlisted one is marked for its publisher and absent for a member

- **Persona:** P-02
- **Feature:** agent-network
- **Traces:** ST-027, FLW-22 (JTBD-12, JRN-11/#1)
- **Entry point:** the hub's directory in the owner's session; the organization's directory for a member or an administrator
- **Preconditions:** `example-agent` runs on two of the owner's machines in `personal`, and is shared into `org:org_7kq2m4xw` by an active registration; `example-writer` runs on one of the owner's machines in `personal` and the owner unlisted it; the organization unlisted its own machine's `example-indexer`
- **Steps:**
  1. Owner opens the hub's directory -> `example-agent` once in `personal`, once in the organization, and `example-writer` marked unlisted.
  2. A member opens the organization's directory -> `example-agent` only.
  3. The organization's administrator opens it -> `example-agent` and `example-indexer` marked unlisted.
- **Expected result:** each reader sees exactly what the directory's source derives for them; the list grants nothing, and a call still goes through the grant.
- **Alt paths:** the owner's unlisting hides an agent from nobody in this revision (only the owner reads an estate's directory) and marks it in their own list; unlike an unlisted Project (SCN-027), it stays in the owner's view. A registration withdrawn, or outside its window -> absent.
- **UI elements:** the directory rows, the unlisted mark.
- **States covered:** success, empty
- **Errors & recovery:** a directory that shows a member an unlisted agent, or drops one the owner should see -> `FAC-SEM-130` names it; the hub or the organization server derives it again with the reference.
- **Status:** draft
- **Coverage:** DEC-0104, `FAC-SEM-130`, `estateDirectory` and `organizationDirectory` in `src/agent-network.ts`, `fixtures/vectors/agent-network.json`, `test/agent-network.test.ts`
- **Product:** unobserved

### SCN-034: A call to a busy agent waits with its place shown, or is refused with a time to start again

- **Persona:** P-02
- **Feature:** agent-network
- **Traces:** ST-028, FLW-23 (JTBD-12, JRN-11/#2)
- **Entry point:** an agent calls `example-agent`'s job-backed capability and polls `fabric.job.get`
- **Preconditions:** `example-agent` declares `concurrency: 2`, `perCaller: 2`, `queueMax: 3`; both slots run jobs of caller A
- **Steps:**
  1. Caller A starts a third job -> `working`, `queued 1 of 1`; it polls.
  2. Caller B, with nothing running, starts a job -> it waits too, and since B will start first, A's job now reads `queued 2 of 2`.
  3. One of A's jobs ends -> B's job starts first, though A's arrived earlier: B runs none, A still runs one.
  4. The next slot frees -> A's third job starts and completes once.
- **Expected result:** a burst of calls waits in line, each caller sees its place, and no caller holds the agent alone.
- **Alt paths:** the queue already holds three -> the start is refused with `queue-full` and `retryAfterSeconds: 30`, nothing stored; the caller starts again after 30 seconds under the same key and, with room in the queue or a free slot, that start runs once. Through Fabric's hub before CO-376 the caller sees `product-error` instead, and the hub replays it under the key for 24 hours; and every caller the hub forwards counts as one caller under `perCaller`.
- **UI elements:** the job's status message; the refusal's time to start again.
- **States covered:** success, error
- **Errors & recovery:** a job that `queue-full` ended -> malformed (`jobCallerAction` answers `invalid`); the caller reports it and starts nothing new under another key.
- **Status:** draft
- **Coverage:** DEC-0104, `FAC-SEM-131`, `nextQueuedJob`, `admitJob`, `readQueuePosition` in `src/agent-network.ts`; `interop-tool-error.schema.json`; `test/agent-network.test.ts`, `test/job-limits.test.ts`
- **Product:** unobserved

### SCN-035: See how busy an agent is, or learn why its load is not shown

- **Persona:** P-02
- **Feature:** agent-network
- **Traces:** ST-029, FLW-24 (JTBD-12, JRN-11/#3)
- **Entry point:** `example-agent`'s load panel in the host
- **Preconditions:** `example-agent` declares the load extension with `windowSeconds: 3600`
- **Steps:**
  1. Operator opens the panel -> the last windows, per context: queued, running, completed, failed, wait and run time.
  2. A window with jobs waiting in the organization's context -> it stands out, with its queued count and the p95 wait of the jobs that started in it.
- **Expected result:** the operator sees the queued and running jobs at each window's end and the wait and run times, per context, with no person, caller or prompt shown; refused starts are not shown in this revision.
- **Alt paths:** an agent that declares no load -> the panel says so. A declaration that is not its schema's -> the panel shows nothing of it and says why (`FAC-SEM-133`).
- **UI elements:** the windows, the per-context rows, the limits.
- **States covered:** success, empty, invalid
- **Errors & recovery:** a report whose windows are out of order or a p50 above its p95 -> `FAC-SEM-132`; the service's author fixes the writer.
- **Status:** draft
- **Coverage:** DEC-0104, `FAC-SEM-132`, `FAC-SEM-133` in `src/agent-network.ts`, `service-load.schema.json`, `service-load-extension.schema.json`, `test/agent-network.test.ts`
- **Product:** unobserved

### SCN-036: An agent calls an agent on another of the owner's machines, or is refused by a machine's profile

- **Persona:** P-02
- **Feature:** machine-calls
- **Traces:** ST-030, FLW-25 (JTBD-13, JRN-12/#1)
- **Entry point:** an agent on machine `m-a` calls `example-agent` on machine `m-b` over the relay
- **Preconditions:** the record both nodes applied lists `m-a` (full) and `m-b` (full, then `view` in step 3), each with a `#sig` and a `#kem`; `m-b`'s revocation delta is current
- **Steps:**
  1. `m-a`'s node seals the call to `m-b#kem` and sends it -> `m-b`'s node places `m-a#sig` in T1, opens the call and runs it with no token.
  2. The answer is sealed to `m-a#kem` -> `m-a`'s node opens it and the caller reads the result.
  3. The person marks `m-b` as `view` (its `example-agent` placement removed in the same revision), and an agent on `m-b` started by hand calls `m-a`'s capability whose effect is `draft` -> refused `profile-forbids` with a sealed answer; a read (effect `none`) and the job tools still run.
- **Expected result:** a call between one person's machines runs with no token, the relay reads none of it, and a machine kept for reading takes no call that changes anything.
- **Alt paths:** the target's delta is not current -> refused `unknown-state`, logged and not answered; no fallback to T2. The sender's machine was revoked -> not T1, refused and not answered. A sealed call copied into another body -> `cannot-open`, logged and not answered. In each, the caller has no answer by the body's `exp` and treats the call as failed. A machine with no `#kem` -> neither called nor answered, so it does not call.
- **UI elements:** the caller's job status; the refusal's code and reason.
- **States covered:** success, error
- **Errors & recovery:** an answered refusal names its code (`profile-forbids`, or the token's); the caller calls from a `full` or `member` machine. An unanswered call reads as failed at its `exp`; the caller retries it under the same idempotency key, or asks the person to look at the target machine.
- **Status:** draft
- **Coverage:** DEC-0106, `FAC-SEM-135`, `FAC-SEM-136`, `relayCallerTier`, `machineCallVerdict`, `sealAgentCall`, `openAgentCall` in `src/machine-call.ts`, `fixtures/vectors/machine-call.json`, `test/machine-call.test.ts`
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
- **Alt paths:** the deadline passes before anyone accepts -> `expired` (with no deadline of its own, seven days after it was stored; a hold does not stop that clock). Nobody serves `project-b`'s `publish` capability when the request is submitted -> its receipt says so (`noResponder`) and it is stored. `project-b` replies to the request as a participant while it is queued, or while it is claimed and the request returns to queued -> `answered` (a responder's own fenced reply or progress note never answers it): no responder claims it and it does not expire; `project-a` cancels it or leaves it answered. A reply to an announcement carries its reaction (`adapted`, `row`, `not-affected`) as a field once the board serves it. The request is cancelled before an effect began -> `cancelled`. The responder's session ends after it accepted -> its slot is released and the request is held `accepted`, not re-queued; a new responder continues it only by a checkpoint transfer. The operator holds the thread or `project-b`'s `publish` slot before the responder accepts -> the accept is refused `held` (retryable) and the request waits, its deadline running; a hold set after the effect began never refuses the current responder's calls on started work; if that responder's session ends under a slot or Project hold, enrollment and replacement wait for the lift, and its accepted work stays held as C4 says. So the current responder completes; a replacement waits for the lift.
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
  2. Fabric asks for a second passkey on another authenticator (a phone, a security key) -> the operator registers it; Fabric drafts revision 1 -> the passkey prompt opens; the operator signs.
  3. The machine verifies revision 1 under that passkey and pins it -> Fabric and the machine show the network's fingerprint.
- **Expected result:** the network exists with this machine and its hub key; later machines join it.
- **Alt paths:** created on another machine -> revision 1 lists that machine only, and the hub key comes with the revision that adds the always-on machine; until then no machine shows a hub alert, and the network asks for the always-on machine. The operator goes on with one passkey -> Fabric tells them that losing it loses the network, and "Add a passkey" stays offered.
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
  1. Operator chooses "Remove" on the lost machine -> Fabric drafts a revision that revokes the machine (and its device keys); the operator signs.
  2. The hub sends the revocations as delta entries -> within seconds the relay turns the lost machine away and ends its sessions.
  3. Operator chooses "Replace key" on the reset machine -> it pairs again under its id, the codes match, the operator signs a revision listing its new keys and revoking the old ones by reference.
  4. The machine holds the new keys -> it applies the revision; a session or envelope under the old key is refused.
- **Expected result:** the lost machine is out; the re-keyed machine keeps its id and its agents.
- **Alt paths:** the network has one machine -> re-keying needs no pairing: the operator signs on the machine itself. The lost machine holds the hub key -> "Remove" opens "Move the hub" (SCN-038): one revision with a new hub key on a `full` machine, the lost one removed and revoked, so the network keeps a hub.
- **UI elements:** "Remove", "Replace key", the comparison code, the passkey prompt.
- **States covered:** error, success
- **Errors & recovery:** a revision that drops a machine or key without revoking it is refused by every machine pinned at or after DEC-0084 (`FAC-SEM-114`; an older reader accepts it, ceremonies *Compatibility*); Fabric runs the rule before asking for the passkey. A stolen machine is removed, never re-keyed.
- **Status:** draft
- **Coverage:** ceremonies specification, Remove a machine, Replace a machine's key; `src/estate-record-rules.ts`, `src/relay.ts` `sessionStands`; `test/ceremonies.test.ts`, `fixtures/vectors/relay.json`
- **Product:** unobserved

### SCN-037: Keep a machine for reading only

- **Persona:** P-02
- **Feature:** machine-calls
- **Traces:** ST-031, FLW-26 (JTBD-13, JRN-12/#2)
- **Entry point:** My network's machines
- **Preconditions:** a network of two machines, `m-a` holding the hub key and `m-b` with one placement and one secret placement
- **Steps:**
  1. The person picks "Change profile" on `m-b` and chooses `view` -> the drafter removes `m-b`'s placement and secret placement in the same revision.
  2. The person signs it with a passkey -> the list shows `m-b` as `view`; every node applies the revision.
  3. An agent on `m-a` calls `m-b` with a capability that changes something -> refused `profile-forbids`.
- **Expected result:** by the signed record alone, the machine holds no placement, no secret and no hub key, and sends or takes no call over the relay that changes anything.
- **Alt paths:** the person marks `m-a`, which holds the hub key, as `member` -> `FAC-SEM-134` refuses a member with a hub key, so the hub moves first ("Move the hub" on `m-a`'s row, a planned move: ceremonies "Move the hub", DEC-0107). A record written before profiles -> every machine reads as `full`. Until every reader of the record is pinned at or after DEC-0106, "Change profile" is unavailable and says why. Between the signature and each node applying the revision, a node still on the parent judges calls by the old profile.
- **UI elements:** the profile in each machine's row; "Change profile" in the overflow menu.
- **States covered:** success, error
- **Errors & recovery:** the passkey ceremony fails -> nothing changed, the person signs again; a revision that keeps a placement on a `view` machine -> `FAC-SEM-134` names it and the drafter removes it.
- **Status:** draft
- **Coverage:** DEC-0106, `FAC-SEM-134` in `src/estate-record-rules.ts` (`machineProfile`), fixtures `fixtures/semantic/estate-profile-*`, `test/estate-record.test.ts`, `test/machine-call.test.ts`
- **Product:** unobserved

### SCN-038: The hub goes quiet: hear of it after a day and move it to another machine

- **Persona:** P-02
- **Feature:** network
- **Traces:** ST-032, FLW-27 (JTBD-10, JRN-09/#4)
- **Entry point:** a machine's alert in My network's machines
- **Preconditions:** a network of `m-a` (the hub's machine, `full`) and `m-b` (`full`); `m-a` is lost (dead or stolen) and its last heartbeat is 30 hours old
- **Steps:**
  1. The person opens Fabric on `m-b` -> it reconnects to the estate's relay, the latest heartbeat it then holds is still 30 hours old, and it says "This machine has not heard from the hub for 30 hours", with "Move the hub".
  2. They pick `m-b`, which is always on -> its node makes a new hub key; Fabric fetches the delta from the relay and drafts one revision: `m-b`'s `hubKey`, `m-a`'s old key revoked as `hub-key`, `m-a` removed and revoked as `machine m-a`, the delta anchored at the head (once every reader of the record is pinned at or after DEC-0107).
  3. They sign with a passkey -> `m-b`'s hub signs a heartbeat; the alert clears on each machine once it holds that heartbeat.
- **Expected result:** the network has a hub again before calls between machines stop at 72 hours, under a key that never left `m-b`.
- **Alt paths:** `m-b` was only asleep and the hub is running -> after reconnecting it holds a fresh heartbeat, the alert clears and no move is offered. `m-a` is only switched off and can be turned on -> the person turns it on, the alert clears, and they choose "Move the hub" on `m-a`'s row (a planned move); it takes two revisions (DL-15): the new key certified and published, the switch, then the old key revoked and the delta anchored; `m-a` stays in the network. Before every reader is pinned at or after DEC-0107 (today) -> the move carries no anchor, and a machine added after it refuses calls from other machines (`behind`) until Fabric's first revision after the gate anchors the delta; Fabric says so on that machine. A machine added after an anchored move -> it starts its chain at the anchor and never needs the old hub's entries; before the readers' pin gate opens the move carries no anchor, and Fabric anchors its first revision after the gate. `m-a` turns up after it was removed -> the relay turns it away (`unauthenticated`, 4401, with no reason) and Fabric on `m-a` shows the guidance for a machine the relay no longer admits; anything its old key signs is refused (`revoked-signer`), and it joins again under a new id (Add a machine). No other `full` machine -> the person brings `m-a` back or adds a machine first. Past 72 hours -> the alert says calls between machines have stopped until the new heartbeat.
- **UI elements:** the alert with the hours since; "Move the hub"; the machine picker.
- **States covered:** alert, success, error
- **Errors & recovery:** the passkey ceremony fails -> nothing changed, the alert stays; the old hub signed an entry at a sequence the new one also used -> a machine that saw both is `broken` (recovery from a fork is the revocation delta's open item).
- **Status:** draft
- **Coverage:** DEC-0107, `hubSilence`, `hubMove` in `src/hub-move.ts`, `fixtures/vectors/hub-move.json`, `test/hub-move.test.ts`; `anchorDelta`, `FAC-SEM-137`, `test/revocation-delta.test.ts`; `FAC-SEM-114`
- **Product:** unobserved

### SCN-039: Lose a passkey and keep the network

- **Persona:** P-02
- **Feature:** network
- **Traces:** ST-032, FLW-27 (JTBD-10, JRN-09/#4)
- **Entry point:** the network's passkeys in My network's machines
- **Preconditions:** revision 1 listed two passkeys, `cred-a` on the person's laptop and `cred-b` on a security key; the laptop is lost
- **Steps:**
  1. The person signs with `cred-b` a revision that removes `cred-a`, lists it as `authority cred-a` in `revocations` and adds `cred-c` on a new phone.
  2. Every machine applies it -> the network shows two passkeys again (`recoveryReady`: ready).
- **Expected result:** the network survives the lost passkey; the lost one can sign no later revision.
- **Alt paths:** the network was created with one passkey -> Fabric warned at creation and shows "Add a passkey" until a second is listed. Every passkey is lost -> no revision can be signed; the network expires with its applied revision (at most 30 days) and the person creates a new one and adds each machine again.
- **UI elements:** the passkeys list; "Add a passkey"; the one-passkey warning.
- **States covered:** alert, success, error
- **Errors & recovery:** the passkey ceremony fails -> nothing changed, the person signs again with the passkey left. Whoever holds the lost passkey signs a competing revision first -> two revisions of one number exist; what a machine does with such a fork is open in the estate record (Not decided here), so the person acts at once.
- **Status:** draft
- **Coverage:** DEC-0107, `recoveryReady` in `src/hub-move.ts`, `fixtures/vectors/hub-move.json`, `test/hub-move.test.ts`; `verifyEstateRecord` (a parent's authority signs the next revision)
- **Product:** unobserved

## Credentials

### SCN-040: An agent asks for a token for one zone and gets it in its organization's context

- **Persona:** P-02
- **Feature:** credentials
- **Traces:** ST-033, FLW-28 (JTBD-14, JRN-13/#1, JRN-13/#2)
- **Entry point:** the organization's credential queue
- **Preconditions:** a DNS agent runs as an instance of `org:acme` on a member's machine; the issuer's door holds a Cloudflare account; the organization's policy allows the preset `zone-dns-edit` for at most 7 days
- **Steps:**
  1. The agent needs to update `example.com` -> its node sends `credential-request/1` (provider `cloudflare`, preset `zone-dns-edit`, scope `zone: example.com`, 7 days, a one-line reason) at check-in.
  2. The policy issues it -> the issuer mints the token with a 7-day expiry and seals it to the machine's `#kem` under the organization's policy key.
  3. The next check-in response carries the decision and the envelope -> the node reads the decision first (its slot `CLOUDFLARE_API_TOKEN`), then opens the envelope into the organization instance's slot; the ledger lists it by name.
- **Expected result:** the agent holds a token for one zone for 7 days, in its organization's context only; nobody pasted a key.
- **Alt paths:** the request asks for 60 days -> `FAC-SEM-138` refuses it before it is sent. The preset is not allowed -> the administrator decides, or the decision is `refused` with `not-allowed`. The envelope names another request, or comes signed by a key outside the policy key set -> the node refuses it (`not-requested`, `bad-key`) and stores nothing. The same OpenRouter key is asked for a project of `org:acme` the person also runs in Switchboard -> Switchboard reads the delivered slot by name into that project's key slot instead of issuing another; a personal project never receives it.
- **UI elements:** the queue's row with "Issue" and "Refuse"; the issued credential's row with its end.
- **States covered:** queue, issued, refused
- **Errors & recovery:** the provider is down -> `refused` with `provider-unavailable`, and the agent asks again later; the envelope expired in transit (the machine was offline for a day) -> refused `expired`; the node keeps sending the request, and the issuer, seeing it again, seals again under its next sequence.
- **Status:** draft
- **Coverage:** DEC-0111, `src/credentials.ts` (`checkCredentialEnvelope`, `FAC-SEM-138`, `FAC-SEM-139`), `fixtures/vectors/credential-envelope.json`, `test/credential-envelope.test.ts`
- **Product:** unobserved

### SCN-041: A member leaves and the credentials of their agents end

- **Persona:** P-02
- **Feature:** credentials
- **Traces:** ST-033, FLW-28 (JTBD-14, JRN-13/#3)
- **Entry point:** the credentials issued into the organization
- **Preconditions:** two credentials were issued to agents of one member's enrollment
- **Steps:**
  1. The administrator removes the member -> the server sends a signed `credential-revocation/1` for each, and the issuer revokes each at its provider.
  2. The member's node applies each revocation that stands -> it deletes the value whose request the revocation names, and keeps its mark as revoked, so the envelope never opens again.
- **Expected result:** neither credential works at its provider nor stays on the machine.
- **Alt paths:** the machine is offline -> the provider's revocation stops the credential at once, and the node deletes it at its next check-in or at `credentialExpiresAt`, whichever comes first. The member's certificate is revoked or the organization closed before a revocation arrives -> at its first contact the node is answered `certificate-revoked` or `organization-closed` and deletes every credential of that organization's context. A revocation signed by a key outside the set -> refused, and the credential still ends at its expiry.
- **UI elements:** "Revoke" on each row; the revoked state with its time and reason.
- **States covered:** revoked
- **Errors & recovery:** the provider cannot revoke a key -> it ends at its `credentialExpiresAt`, and the ledger says so.
- **Status:** draft
- **Coverage:** DEC-0111, DEC-0113, `credentialRevocationStands` in `src/credentials.ts`, `fixtures/vectors/credential-envelope.json` (`revocation`), `test/credential-envelope.test.ts`
- **Product:** unobserved

### SCN-042: See every call between agents, and nobody's prompts

- **Persona:** P-02
- **Feature:** credentials
- **Traces:** ST-034, FLW-28 (JTBD-14, JRN-13/#4)
- **Entry point:** the calls between agents
- **Preconditions:** members' notices name agent calls; an observatory agent calls the DNS agent in `org:acme`
- **Steps:**
  1. The DNS agent answers -> its node writes `call-record/1` (the two agents, `dns.records.update`, the times, `completed`, its cost) and sends it at check-in.
  2. The administrator opens the calls -> the record is listed under its trace id.
- **Expected result:** the administrator knows who called whom, how it ended and what it cost; no prompt, argument or output is in the record.
- **Alt paths:** the call was refused by the callee (its queue full, `queue-full`) -> the record says `refused` with that code. The callee queued the call as a job -> one record when the job ends, from its start to its final state, and none for the caller's `fabric.job.get` polls (DEC-0116). The caller got no answer -> the caller's node records `timeout` under the same `callId`. A member's notice does not name agent calls -> the server's check-in responses say `callRecordsAccepted: false`, and their node sends none.
- **UI elements:** one row per call, grouped by trace.
- **States covered:** success, empty
- **Errors & recovery:** a record that ends before it starts, or a completed call with a code -> `FAC-SEM-140` names it.
- **Status:** draft
- **Coverage:** DEC-0111, DEC-0116, `callRecordFindings` in `src/credentials.ts` (`FAC-SEM-140`), `fixtures/semantic/call-record-*`, `test/credential-envelope.test.ts`
- **Product:** unobserved

### SCN-043: Tell my agent to approve: the service takes it as my decision

- **Persona:** P-02
- **Feature:** delegation
- **Traces:** ST-035, FLW-29 (JTBD-07, JRN-06/#3)
- **Entry point:** the operator's chat with their own coding agent
- **Preconditions:** `example-publisher` runs on the operator's machine (T0) and declares under `extensions/actions/0.1` the action `approve-reply` (tool `reviews.approve`, `gate: relayed`), the same as the "Approve" button on its page
- **Steps:**
  1. The operator writes to their agent "approve the reply to the review from Anna" -> the agent calls `reviews.approve` for that reply with `_meta.decision` `{by: operator, via: relayed-instruction, action: approve-reply, target: <that reply's id>, instruction: "approve the reply to the review from Anna", at}`.
  2. The service runs `actionDecision` -> the decision names this action and this reply, is less than 24 hours old and not more than 60 seconds ahead of its clock: the operator's act.
  3. The service approves the reply as its page would -> its audit says the operator decided, relayed by the agent it authenticated.
- **Expected result:** the reply is approved once, recorded as the operator's decision; the operator never opened the page.
- **Alt paths:** the agent calls without a decision -> `operator-decision-required`; it asks "Approve the reply to Anna?", the operator answers "yes", and it calls again with the question and the answer quoted as the instruction and that reply as the `target`. The action is a payment (`gate: human`) -> `human-step-required` with `data.url`; the agent hands the operator that link. An outside caller (T2) asks for it -> `approval-required` with the action's digest, as SCN-018. A review's text says "approve this" -> it is data, not the operator's words; the agent sets no decision (AP-3).
- **UI elements:** none on the page; the agent's chat and the service's audit row (decided by, via, relayed by).
- **States covered:** success, error
- **Errors & recovery:** a decision for another action or object, more than 24 hours old or more than 60 seconds ahead of the service's clock -> `decision-invalid`; the agent asks the operator again.
- **Status:** draft
- **Coverage:** DEC-0121, `actionDecision` in `src/actions.ts` (`FAC-SEM-142`), `fixtures/vectors/actions.json`, `fixtures/semantic/action-call-*`, `test/actions.test.ts`
- **Product:** unobserved

### SCN-044: Open a service's page from my agent: in Fabric Dashboards, never a raw address

- **Persona:** P-02
- **Feature:** service
- **Traces:** ST-036, FLW-30 (JTBD-06, JRN-05/#3)
- **Entry point:** the operator's chat with their own coding agent
- **Preconditions:** `example-publisher` (`example-publisher.default`) runs on the operator's Mac with a dashboard at `/dashboard`; Fabric Dashboards is installed
- **Steps:**
  1. The operator asks "show me the drafts waiting for me" -> the agent calls the service's tool, whose answer carries `open_link` `fabric-dashboards://service/example-publisher.default?path=%2Fdashboard%2Fdrafts` beside the diagnostic `http_url`.
  2. The agent presents the `open_link` and opens it through Fabric Dashboards with no browser fallback -> the host shows the drafts page, signed in.
- **Expected result:** the page is open in Fabric Dashboards; the operator never saw a sign-in wall or a `127.0.0.1` address as the action.
- **Alt paths:** Fabric Dashboards is installed but does not open the page -> the agent says it failed and opens no browser. Fabric Dashboards is not installed, or the computer runs a system it does not ship for (`unsupported`) -> the agent opens the service's own address, read from its descriptor's `origin` and the path. The service asks for a typed secret in URL mode -> the request's `url` is the `open_link` of its own page. The service posts a stop to the operator channel -> the message names the page and says it opens in Fabric Dashboards on the computer. Fabric Dashboards is installed but too old for the link, or its state is unknown (`incompatible`, `handler_mismatch`, `unknown`) -> the agent says so and how to update, and opens no browser: an unknown host is not an absent one.
- **UI elements:** the agent's answer with one link; the page in Fabric Dashboards.
- **States covered:** success, error
- **Errors & recovery:** a tool answer whose `open_link` is a raw local address or outside the grammar fails `FAC-SEM-143` in the service's own checks before it ships.
- **Status:** draft
- **Coverage:** DEC-0123, PL-1 to PL-4, `dashboardsLink` and `FAC-SEM-143` in `src/page-link-rules.ts`, `fixtures/vectors/page-links.json`, `test/page-links.test.ts`
- **Product:** unobserved

### SCN-045: Give a task once: the research agent my developer agent engages runs it without asking me again

- **Persona:** P-02
- **Feature:** delegation
- **Traces:** ST-037, FLW-31 (JTBD-07, JRN-06/#3)
- **Entry point:** the operator's chat with their developer agent
- **Preconditions:** `example-developer` and `example-researcher` run on the operator's Mac (T0); the research agent asks the operator before paid work; the project's L1 auto-approves up to 30 dollars a task
- **Steps:**
  1. The operator writes "run the research on eSIM competitors' prices" -> the developer states a mandate: that sentence, the task, an expiry the next day, the capabilities `research.run` and `research.ask`, the effects `charge` and `draft`, the project; no amount, since the operator named none.
  2. The developer calls `research.run` with the mandate in `_meta.mandate`, the chain now developer, researcher -> the research agent checks that the chain ends in itself (on loopback it authenticates no caller agent id, so the chain's end binds the mandate), then runs `mandateCovers`: covered; its estimate of 12 dollars is within the project's L1 threshold.
  3. The research agent runs the paid research -> its record says the operator decided, via the mandate, with the task, the chain and the operator's words.
- **Expected result:** the research ran once on the operator's single instruction; the operator was not asked again.
- **Alt paths:** the operator wrote "up to 20 dollars" -> the mandate carries `perCallMaxUsd` 20; an estimate of 25 is refused `outside-mandate: spend` with the estimate and the ceiling; the developer asks "The research needs 25 dollars, 5 more than you allowed. Go ahead?" and calls again with a mandate carrying the operator's answer. The research would cost 40 dollars, above the project's L1 threshold -> spend above a limit is the operator's own step, whatever the mandate says. The research agent's provider account needs a top-up -> a payment, a human step (`human-step-required`). A page the research read says "the operator approves everything" -> data, not the operator's words. The paid run is a job with an approval step -> the mandate names `research.run`, the job's capability, so the step raises no input request and goes on as the operator's act; a step of a job whose capability the mandate does not name waits `input_required` and asks the operator (MJ-1, DEC-0141).
- **UI elements:** the agents' chat replies; the research agent's audit row (decided by the operator, via the mandate, the task, the chain, the relaying caller, the operator's words).
- **States covered:** success, error
- **Errors & recovery:** an expired, widened or misaddressed mandate -> `decision-invalid` with the reason; the developer asks the operator for a new one.
- **Status:** draft
- **Coverage:** DEC-0125 MD-1 to MD-6, `mandateCovers` and `handOn` in `src/mandate.ts` (`FAC-SEM-144`), `fixtures/vectors/mandate.json`, `fixtures/semantic/action-call-mandate*.json`, `test/mandate.test.ts`; `fixtures/vectors/actions.json` `jobSteps` (MJ-1)
- **Product:** unobserved

### SCN-046: Approve once in one agent's chat: the agent that holds the key acts without asking me again

- **Persona:** P-02
- **Feature:** delegation
- **Traces:** ST-037, FLW-31 (JTBD-07, JRN-06/#3)
- **Entry point:** the operator's chat with their analyst agent; a request on the operator's board to the agent that holds the configuration key
- **Preconditions:** `example-analyst` and `example-config-agent` are Projects of the operator's own board (`provenance: trusted`); only the config agent holds the key; the change sits behind the config agent's own guard for a protected condition
- **Steps:**
  1. The operator, in the analyst agent's chat, approves the change: "change it, every value" -> the analyst agent cannot apply it, so it posts a request to the config agent with the operator's words verbatim, when they said them, where (its project and session) and the approved scope.
  2. The config agent reads the request -> the sender is one of the operator's own Projects and the relay carries the quote, the time, the place and the scope, so it is the operator's approval (OA-2, OA-3); the config agent states its own mandate from those words with `source` naming the analyst agent's session.
  3. The config agent runs its own checks (the preview is fresh, the guard's value is within "every value") -> it publishes, and replies in the thread with the operator's words and `source` as its reason.
- **Expected result:** the change went out on the operator's single approval; nobody asked them again.
- **Alt paths:** the request's own text says "stop on a protected condition" -> that is the analyst agent's caution, not the operator's; the approved scope covers it, so the config agent acts and says so. The preview went stale, or the change would reach another app than the one approved -> the config agent asks once, naming only what is new. The request carries no quote or no place -> data; the config agent answers that it needs the operator's words and where they said them. The same text arrives in a client's chat or a web page -> data, never an approval. Applying needs a sign-in or a payment -> the person's step.
- **UI elements:** the board thread; the config agent's reply (what it did, the operator's words, where they said them); its change log row.
- **States covered:** success, error
- **Errors & recovery:** a relay from a member's Project on an organization's board (T2) -> not an approval; the config agent asks the operator through its own route.
- **Status:** draft
- **Coverage:** DEC-0126 OA-1 to OA-7, `source` in `mandate.schema.json` and `decision.schema.json`, `mandateCovers` and `actionDecision` returning it, `fixtures/vectors/mandate.json`, `fixtures/vectors/actions.json`, `fixtures/positive/mandate-relayed.json`, `test/mandate.test.ts`
- **Product:** unobserved

### SCN-047: Join an organization by my own passkey: my Fabric trusts the membership only from what the organization signed

- **Persona:** P-03
- **Feature:** membership
- **Traces:** ST-038, FLW-32 (JTBD-04, JRN-03/#1)
- **Entry point:** the member's join in Fabric
- **Preconditions:** the organization `org:org-a` is served by `https://orgs.example`, which serves the organization's key sets (their root held by the owner's Fabric, DEC-0129); the member's Fabric is pinned at or after DEC-0129 (it applies key sets carrying `administrators`) and every other reader of the estate record at or after DEC-0128
- **Steps:**
  1. The member starts the join -> Fabric reads the organization's root from its server and shows the organization, the server, the root's `kid` and its fingerprint, which the member compares with the fingerprint in the administrator's invitation, received by a second channel (Fabric ADR-0178 point 6).
  2. The member confirms with their passkey -> the estate revision that pins `{org, issuer, iss, root, pinnedAt}` (`iss` the context's opaque issuer Fabric generates) is signed; no administrator is asked.
  3. The server sends the organization's key set and an attestation for the member's Fabric as audience -> Fabric applies the set under the pin and verifies the attestation: `active`, role `member`.
  4. Fifteen minutes before expiry -> Fabric fetches the next revision and holds it per subject.
- **Expected result:** the membership is trusted from a document the organization's pinned root vouches for, and nothing of the member's personal work leaves for the organization beyond the references they choose in an adaptation plan.
- **Alt paths:** the server goes offline for a day -> the attestation expires and the membership is suspended: nothing new is authorised, nothing is revoked, and the shared agents stop answering the organization within ten minutes, as running tokens expire. The administrator removes the member -> the server issues an `ended` attestation; Fabric drafts the next revision, which revokes the context's share grants and drops the organization's pin, and the member's passkey signs it; the device's enrollment then ends and the organization's locks lift, nothing more is sent, and rejoining takes a new pin. The member has not signed that revision yet -> the server already refuses the device's revoked certificate and the hub mints nothing in the context, while the contract lifts the organization's locks only on the signed revision (a node's own end on `certificate-revoked` is not decided); Fabric shows the signature as pending. An attestation signed for another organization on the same server -> refused (`unknown-key` under that organization's own keys, or `wrong-org` where a server lists one key for both). The fingerprint does not match the invitation's, or the invitation carries none -> nothing is pinned and Fabric says why. A server that changes its root silently -> attestations under the new key set do not verify until the member pins the new root.
- **UI elements:** SCR-31: the organization, the server, the root's fingerprint, the passkey prompt; each membership's role and state.
- **States covered:** success, error
- **Errors & recovery:** a refused attestation -> its reason is shown; the member can retry or leave the organization.
- **Status:** draft
- **Coverage:** DEC-0127 OM-1 to OM-8, `verifyOrgMembership` and `verifyOrgKeySet` in `src/org-membership.ts`, `FAC-SEM-145` to `FAC-SEM-147`, `fixtures/vectors/org-membership.json`, `test/org-membership.test.ts`
- **Product:** unobserved

### SCN-048: Enrolled in two organizations, my machine looks like two strangers to them

- **Persona:** P-03
- **Feature:** membership
- **Traces:** ST-038, FLW-32 (JTBD-04, JRN-03/#1)
- **Entry point:** the member enrolls the same machine in a second organization
- **Preconditions:** the machine is enrolled in `org:org-a`; the node and both organization servers are pinned at or after DEC-0128
- **Steps:**
  1. The member enrolls in `org:org-b` -> the node gives the enrollment a fresh device id, its own keys, telemetry key and collector, and records the pair in its local registry, which it never sends.
  2. The node checks in to each organization -> each check-in carries only that enrollment's identity and streams, and no estate record (`FAC-SEM-149`).
  3. An agent shared into `org:org-b` gets a delegation token -> it names `org:org-b`'s own context issuer and subject and is signed by that context's hub key (DL-14a).
- **Expected result:** neither organization finds a value the other sees: device ids, keys, hashes, collectors, check-in records and token issuers all differ.
- **Alt paths:** the member shares the same agent into both -> its `agentRef` is the same, the member's own choice. The machine is stolen -> Fabric offers to ask each organization to revoke, from the local registry; nothing is sent automatically.
- **UI elements:** SCR-31: each membership's state; nothing that shows one organization the other.
- **States covered:** success
- **Errors & recovery:** a node that would send an estate record -> its own check (`FAC-SEM-149`) refuses before sending.
- **Status:** draft
- **Coverage:** DEC-0128 UE-1 to UE-3 and DL-14a, `src/node-enrollments.ts`, `hubKeyCertified` with a context, `test/context-keys.test.ts`, `fixtures/semantic/node-enrollments-*`, `check-in-*-outbound-*`
- **Product:** unobserved

### SCN-049: As an administrator, I sign who my organization's relay admits; no server signs it

- **Persona:** P-03
- **Feature:** membership
- **Traces:** ST-038, FLW-32 (JTBD-04, JRN-03/#1)
- **Entry point:** the administrator's Fabric shows a member list the organization server drafted
- **Preconditions:** the organization's key set, signed by the root the owner's Fabric holds, lists the administrator's signing passkey in `administrators`; the relay serving the organization pinned the root at setup
- **Steps:**
  1. A member joins, or an enrollment's key changes -> the server drafts the next `org-authority/1` revision: each member's pairwise subject, role, context issuer and enrollment `#sig` keys, valid at most 7 days.
  2. The administrator's Fabric shows the change against the last signed list, whoever signed it: entries added and dropped and their count, which the administrator matches against the joins and ends they expect -> the administrator confirms with their passkey over the register's `org-authority/1` challenge.
  3. The relay applies the signed list -> its admission set holds exactly the listed keys (`orgRelayAdmissionSet`).
- **Expected result:** who the organization's relay admits is signed by an administrator's passkey, which the organization's root certified; the server only drafts and signs nothing.
- **Alt paths:** nobody signs before `expiresAt` -> the relay's admission set is empty and nobody is admitted until a newer list verifies. A membership ends -> the next list drops the member. An administrator leaves -> before the root drops their passkey, the server has another administrator sign a fresh list, so admission never empties (OL-5). A passkey is lost and the set drops it first -> the list it signed stops verifying at once, open member sessions end (4403 `not-admitted`) and the relay admits nobody until another administrator signs. The server drafts a key set that adds an administrator -> the owner's Fabric shows the change against the set it signed last and signs it only once the owner confirms with their passkey; a draft the owner did not expect is refused and nobody is added. A list signed by a passkey the set does not list, or under a sign-in RP -> refused (`unknown-administrator`, `wrong-rp`). A member's node refused by the organization's relay (4401, no reason) -> it shows the enrollment's kid and asks the person to check with an administrator that it is on the current signed list (one whose signer the key set dropped admits nobody until another administrator signs), then the clock and the client; a list that expires ends the member's session (4403) until a newer list is signed.
- **UI elements:** SCR-31: the drafted list's changes, the passkey prompt, the list's expiry.
- **States covered:** success, error
- **Errors & recovery:** a refused list -> its reason is shown to the administrator; the relay keeps the list it held until it expires or its signer leaves the key set.
- **Status:** draft
- **Coverage:** DEC-0129 OL-1 to OL-5, `verifyOrgAuthority` in `src/org-authority.ts`, `orgRelayAdmissionSet` in `src/org-authority.ts`, `FAC-SEM-146`, `FAC-SEM-150`, `test/org-authority.test.ts`; the relay's handshake for an organization is DEC-0134 (relay.md OR-1 to OR-5, `sessionStands`)
- **Product:** unobserved

### SCN-052: Share a model key with a colleague's machine, compare six digits, take it back

- **Persona:** P-02
- **Feature:** peer share
- **Traces:** ST-039, FLW-33 (JTBD-15, JRN-14/#1, JRN-14/#2, JRN-14/#3)
- **Entry point:** "Share" on a vault slot
- **Preconditions:** a key minted for the share; the colleague has their own estate and the product's app; no organization between us; the colleague's agents are not under a spend meter (CT-187)
- **Steps:**
  1. I share the slot -> my node makes the share's key pair and writes a link with a one-time code and my share key's fingerprint; I send it by a message.
  2. The colleague pastes the link into their app and accepts -> their node makes its own key pair and claims with a MAC under the code and its commitment.
  3. My node checks the MAC and commits, both reveal -> both apps show six digits, and we read them to each other on a call.
  4. I confirm they match -> my node seals the key to their share key; their node opens it at each use while its lease lasts.
  5. A day later I read uses per day and the agents that used it -> reported by their machine, beside the mailbox's count and the provider's spend.
  6. I press "Take back" -> the mailbox refuses from now on, their node deletes it and sends a receipt, and I revoke the key at the provider; the share reads taken back.
- **Expected result:** the key opened only on the colleague's machine, for that share's key; I saw its use; it no longer works anywhere.
- **Alt paths:** the link went through the mailbox's page -> no fingerprint is pinned and the six digits are the only check. The codes differ before my share is stored at the mailbox -> either of us says so, the link burns and nothing is sealed; I make a new share. My colleague says they differ after a share stored without comparing -> their node deletes it and my screen warns me to take it back. Someone read the link first and claimed -> the MAC holds, and the colleague's claim then burns the link if my share is not yet stored at the mailbox; even a party in the middle matches our codes only one time in a million, so I refuse and nothing is sealed, and I make a new share. Someone who saw only the share id claims first -> the MAC does not hold, my node refuses it and the link is spent; I make a new share. A second claim arrives before my share is stored at the mailbox -> the link burns, and a share I sealed in that moment is refused and reads burnt; after a share stored without comparing -> my screen warns me to take it back. I choose "Share without comparing" -> the share is sealed but recorded as `confirmed: false`, and my screen says that whoever claimed first may hold the key and, if the link went through the mailbox's page, that nothing checked the recipient.
- **UI elements:** "Share", the link, the six digits on both screens, "The codes match", "They differ", "Share without comparing", the recipient's "Accept" (with what I will see of its use and of their machine through my mailbox) and "Decline", the uses per day, "Take back" with its three steps.
- **States covered:** waiting for the claim, comparing, burnt, active, taken back
- **Errors & recovery:** the colleague's machine is offline when I take it back -> the mailbox refuses at once and the provider's revocation ends the key; the deletion receipt arrives at its next contact. A copy made on their machine -> only the provider's revocation ends it, which the screen says.
- **Status:** draft
- **Coverage:** DEC-0142 PS-1 to PS-10, `src/peer-share.ts`, `fixtures/vectors/peer-share.json`, `test/peer-share.test.ts`
- **Product:** unobserved

### SCN-053: An agent needs a token; I type it into my app's own window

- **Persona:** P-02
- **Feature:** secret prompt
- **Traces:** ST-040, FLW-34 (JTBD-15, JRN-14/#4)
- **Entry point:** an agent's request for a slot it lacks
- **Preconditions:** the product's signed app is on my desktop; the node starts it through its lifecycle broker if it is not running, and it connects with `secret.ui`
- **Steps:**
  1. The agent asks the node for the slot -> the node names the agent from its own binding and sends `secret.prompt` to the signed app only.
  2. The app shows its window: the agent, the project, the slot and the agent's reason in quotes -> I type the token and press "Store".
  3. The app writes the slot itself -> the node sees the slot written after the prompt and tells the agent `stored`.
- **Expected result:** the token is in the slot; the agent never saw it through the prompt, and it is in no chat, log or argument (a command the agent runs with it could still print it) (on macOS; on Windows another program of mine could reach into the app).
- **Alt paths:** I press "Decline" -> the agent is told `declined`. I do not answer in 10 minutes -> `no-answer`. The app says stored but the node sees no write -> `unconfirmed`. Another program connects declaring `secret.ui` -> its hello is `forbidden` and it is never prompted. A program holds my screen-recording or Accessibility permission -> while it does, my mark does not tell the two windows apart; I remove that permission, then change my phrase. Checking the agent and the reason guards against a fake request through the node, not against a lookalike window. A window without my mark -> not my app's; I close it. On Windows -> another program of mine can reach into the app, so I run agents as another user or in a container. On Linux, or with no desktop -> `no-client`, and the agent tells me to put the value in with the vault command in my own shell.
- **UI elements:** the window with my mark, the agent's name, the slot, the quoted reason and a secure field; "Store", "Decline".
- **States covered:** asking, stored, declined, unconfirmed, no answer, unavailable
- **Errors & recovery:** the node is not running -> the request fails and no window is shown by anyone; the agent asks again once the node is up.
- **Status:** draft
- **Coverage:** DEC-0143 SP-1 to SP-7, `channelStep`, `maySecretPrompt` and `secretOutcome` in `src/local-channel.ts`, `test/local-channel.test.ts`
- **Product:** unobserved
