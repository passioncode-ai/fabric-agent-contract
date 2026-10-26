# Decisions

Append-only decision home for this repository. Reversals add a new decision and
annotate only the old status; decision bodies are never rewritten.

**Next free ID:** `DEC-0141` (the CAS counter's next value when this line was last written; read
`refs/agent-sync/ids/DEC` on origin for the current one)


`DEC-0028` is not used: two runs reserved under one key (`usage-budgets-20261007`); the first wrote DEC-0027 and
the second's DEC-0028 was returned with `release-id` and never written (DEC-0027 *Source*; origin counter
commits `2d385e0`, `25c07ce`). The `SEM-0035` and `SEM-0036` receipts DEC-0025 cites were taken before the
origin `SEM` counter existed; its first record on origin is `SEM-0037` (`38c432b`).

### DEC-0001 — Documentation is governed in Git

- **Date:** 2026-08-26
- **Status:** Accepted
- **Decision:** Decisions live in this register, questions in `docs/OPEN_QUESTIONS.md`, and `docs/DOCMAP.md` names every canonical home and propagation obligation.
- **Consequences / affects:** `AGENTS.md`, `docs/DOCMAP.md`, `docs/OPEN_QUESTIONS.md`
- **Source:** run `2026-08-26-fabric-agent-contract`; stage-0 commit

### DEC-0002 — The contract profiles existing protocols instead of inventing a wire protocol

- **Date:** 2026-08-26
- **Status:** Accepted
- **Decision:** MCP carries host-shaped capabilities, A2A carries opaque autonomous peers, and local adapters carry terminal agents. Fabric-specific semantics sit above these protocols as profiles, schemas, and conformance requirements.
- **Consequences / affects:** `CONTEXT.md`, `docs/specification/`, `schemas/`
- **Source:** run `2026-08-26-fabric-agent-contract`; stage-0 commit

### DEC-0003 — The contract is storage-agnostic

- **Date:** 2026-08-26
- **Status:** Accepted
- **Decision:** The contract defines logical objects, URIs, state transitions, and interfaces. It does not mandate Supabase, Postgres, pgvector, Notion, or another backend.
- **Consequences / affects:** `docs/specification/`, `schemas/`
- **Source:** run `2026-08-26-fabric-agent-contract`; stage-0 commit

### DEC-0004 — Memory is project-first and globally promoted

- **Date:** 2026-08-26
- **Status:** Accepted
- **Erratum (2026-10-11):** the affected path `docs/specification/memory.md` is `docs/specification/memory-and-learning.md`; the name in *Consequences / affects* below predates the file's title (found by `docs:check`'s decision-path check).
- **Decision:** Raw knowledge and evidence remain project-scoped. Any agent may propose a cross-project insight; the CEO accepts it only after independent evidence and conflict checks. Global memory is retrieved on demand and links to project sources.
- **Consequences / affects:** `docs/specification/memory.md`, `schemas/`
- **Source:** run `2026-08-26-fabric-agent-contract`; stage-0 commit

### DEC-0005 — Coordination semantics are part of compatibility

- **Date:** 2026-08-26
- **Status:** Accepted
- **Decision:** A compatible runtime participating in shared project work supports storage-agnostic claim, renew, release, ID reservation, as-built recording, reconciliation, and declared write scopes. Atomic exclusion belongs to a lease backend, never to the knowledge base.
- **Consequences / affects:** `docs/specification/coordination.md`, `schemas/`
- **Source:** run `2026-08-26-fabric-agent-contract`; stage-0 commit

### DEC-0006 — CEO, product manager, and developer are the base roles

- **Date:** 2026-08-26
- **Status:** Accepted
- **Erratum (2026-10-11):** the affected path `docs/specification/roles.md` is `docs/specification/governance-and-roles.md`; the name in *Consequences / affects* below predates the file's title (found by `docs:check`'s decision-path check).
- **Decision:** One CEO governs the estate; exactly one product manager owns each project's backlog and execution graph; projects may instantiate multiple selectable developer runtimes. Every other business role is registered dynamically.
- **Consequences / affects:** `CONTEXT.md`, `docs/specification/roles.md`, `docs/reference-architecture/`
- **Source:** run `2026-08-26-fabric-agent-contract`; stage-0 commit

### DEC-0007 — Configuration history is immutable

- **Date:** 2026-08-26
- **Status:** Accepted
- **Decision:** Runs pin content-addressed versions of prompts, pipelines, policies, bindings, execution contexts, account pools, schedules, and checker rules. Rollback creates a new revision based on an earlier revision; it never rewrites history.
- **Consequences / affects:** `docs/specification/versioning.md`, `schemas/`
- **Source:** run `2026-08-26-fabric-agent-contract`; stage-0 commit

### DEC-0008 — External effects require scoped authorization

- **Date:** 2026-08-26
- **Status:** Accepted
- **Erratum (2026-10-11):** the affected path `docs/specification/governance.md` is `docs/specification/governance-and-roles.md`; the name in *Consequences / affects* below predates the file's title (found by `docs:check`'s decision-path check).
- **Decision:** Publishing and support replies default to draft-only. Automation requires a named, scoped, expiring standing grant. Data carries a mandatory classification and retention policy; sensitive project records never promote globally as raw content.
- **Consequences / affects:** `docs/specification/governance.md`, `schemas/`
- **Source:** run `2026-08-26-fabric-agent-contract`; stage-0 commit

### DEC-0009 — Protocol revisions are explicit compatibility inputs

- **Date:** 2026-08-26
- **Status:** Accepted
- **Decision:** Every provider declaration names an exact MCP date, A2A semantic version, or local profile version. Hosts reject unsupported revisions before semantic probes and never silently translate them.
- **Consequences / affects:** `docs/evidence/sources.md`, `docs/specification/profiles.md`, `schemas/manifest.schema.json`
- **Source:** official source ledger retrieved 2026-08-26

### DEC-0010 — Admission and project binding are separate lifecycles

- **Date:** 2026-08-26
- **Status:** Accepted
- **Decision:** Discovery and admission establish provider compatibility; a separately authorized, versioned binding grants a capability project scope. Neither discovery nor schema validity grants access.
- **Consequences / affects:** `docs/specification/registry.md`, `schemas/admission.schema.json`, `schemas/binding.schema.json`
- **Source:** approved design; SCN-003 and SCN-005

### DEC-0011 — Results make unknowns first-class

- **Date:** 2026-08-26
- **Status:** Accepted
- **Decision:** A completed invocation returns DONE, PROOF, SCOPE and NOT VERIFIED as separate required collections, plus artifacts and an outcome. An empty NOT VERIFIED collection is an explicit claim subject to checking, not an omitted field.
- **Consequences / affects:** `docs/specification/results-and-evidence.md`, `schemas/result.schema.json`
- **Source:** approved design; REQ-005

### DEC-0012 — Learnings require contrast and cannot self-apply

- **Date:** 2026-08-26
- **Status:** Accepted
- **Decision:** A learning proposal cites a failed attempt and a separately verified correction, targets a future versioned setting, and requires the scope owner. It cannot target an active revision or its own checker.
- **Consequences / affects:** `docs/specification/memory-and-learning.md`, `schemas/memory.schema.json`
- **Source:** approved design; SCN-007

### DEC-0013 — Execution contexts contain references, never secrets

- **Date:** 2026-08-26
- **Status:** Accepted
- **Decision:** Execution contexts declare allowlisted environment keys and secret references. Hosts materialize them ephemerally and do not pass the ambient process environment. Account override and fallback stay within a pinned project pool and emit switch events.
- **Consequences / affects:** `docs/specification/execution-context.md`, `schemas/execution-context.schema.json`
- **Source:** approved design; SCN-004

### DEC-0014 — Fabric owns the Memory Kernel; retrieval backends are replaceable

- **Date:** 2026-08-27
- **Status:** Accepted · **superseded for agent memory by DEC-0023** (its `mcp-memory-service` pilot is replaced; Fabric's own domain memory is unchanged)
- **Refines:** DEC-0003, DEC-0004, DEC-0012
- **Decision:** Fabric owns authenticated memory scope, canonical revisions,
  evidence links, conflicts, retention, promotion and context assembly. Agents
  propose changes through a host-shaped Memory API. Storage, vector search and
  graph providers are replaceable adapters holding rebuildable projections. The
  first recommended pilot uses a pinned private `mcp-memory-service` deployment
  behind an internal adapter, with isolated project stores and a promotion-only
  global store. MCP carries the agent-facing capability; A2A does not become a
  memory persistence protocol.
- **Consequences / affects:** `CONTEXT.md`,
  `docs/specification/memory-and-learning.md`,
  `docs/reference-architecture/mcp-memory-service-adapter.md`,
  `docs/reference-architecture/estate-loop.md`, `docs/evidence/sources.md`
- **Source:** approved memory design at commit `bb53669`; pinned upstream
  receipts retrieved 2026-08-26

### DEC-0015 — Local services are an extension, found by descriptor, supervised by launchd

- **Date:** 2026-09-28
- **Status:** Accepted
- **Annotated (2026-10-11):** supervisor part amended by DEC-0032 (one supervisor per operating system: launchd, systemd, the Task Scheduler).
- **Annotated (2026-10-12):** one copy amended by DEC-0057 (a copy its supervisor started and marked may wait for the lock, at most 300 s, before exit 75; the node supervises too).
- **Decision:** A long-running local agent process follows the `fabric-service/0.1`
  extension, keyed `https://fabric.passioncode.ai/agent-contract/extensions/service/0.1`.
  Its installer writes a descriptor into one per-user services directory; the running
  process answers an unauthenticated well-known document with build identity, pid,
  status and degraded sources, an authenticated cursor-paged events feed, and a
  one-time operator login code. A port is a machine-wide claim. One copy is guaranteed
  by a lock taken before any side effect, and launchd is the only supervisor: a host
  stops a service with `bootout` plus `disable` and never spawns one. Discovery grants
  no Project access.
- **Consequences / affects:** `docs/specification/service.md`,
  `schemas/service-common.schema.json`, `schemas/service-descriptor.schema.json`,
  `schemas/service-well-known.schema.json`, `schemas/service-events-page.schema.json`,
  `schemas/service-login-code.schema.json`, `src/semantic-rules.ts`, `CONTEXT.md`,
  `README.md`, `docs/DOCMAP.md`
- **Source:** operator-approved Fabric Dashboards design (passioncode-ai/fabric-dashboards
  `docs/design/2026-09-28-fabric-dashboards-design.md` at `8f0863e`); harvest of nine
  local agents, 2026-09-28. Id taken under the git lease on this file; id reservation was
  `ungated` because the Notion record plane was unreachable.

### DEC-0016 — The agent-registry contracts land as versioned extensions of contract 0.1.0; a consumer pins one commit

- **Date:** 2026-09-30
- **Status:** Accepted
- **Annotated (2026-10-11):** extended under its versioning policy by every later additive decision; each one's *Compatibility* line says it is additive under `0.1.0`, so that line, not this note, is the list.
- **Decision:** The contracts Fabric locked for its agent registry on 2026-09-29 — the
  provider entry `fabric-provider/0.1`, the runner catalogue, the interop extension
  `fabric-interop/0.1` (keyed `https://fabric.passioncode.ai/agent-contract/extensions/interop/0.1`)
  and `pipeline/0.1` — are added to contract `0.1.0` as new schemas, optional fields and
  semantic rules, as `fabric-service/0.1` was (DEC-0015). The conformance policy lets a
  `0.x` minor add optional fields and new schemas; nothing required changes, so
  `contractVersion` and the schema `$id` prefix stay `0.1.0` and every existing manifest
  stays valid. Each extension carries its own protocol id and version. Extension keys have
  one spelling, the constants in `src/extensions.ts`, and the documentation gate refuses
  any other (G-08). A consuming repository pins the contract once, by full commit, in
  `fabric-contract.lock.json`, and every other mention of the revision equals it (G-11).
  New rule codes FAC-SEM-013…019 are the locked ones; FAC-SEM-020 (G-07: a descriptor and
  its manifest name each other) and FAC-SEM-021 (one runner entry per kind) are added.
  Readings the locked text leaves open are recorded as OQ-0001…OQ-0007 rather than
  decided here.
- **Consequences / affects:** `docs/specification/interop.md`, `provider.md`, `runners.md`,
  `pipeline.md`, `service.md`, `versioning.md`, `conformance.md`,
  `results-and-evidence.md`, `schemas/`, `src/`, `fixtures/`, `CONTEXT.md`, `README.md`,
  `docs/DOCMAP.md`, `docs/evidence/sources.md`
- **Source:** Fabric `docs/evidence/specs/2026-09-29-agent-registry-contracts.md` (C1–C4)
  and the brief's gaps G-07, G-08, G-11, G-12, at Fabric `062895d`; plan module AR-1.
  Id reserved through `agent_sync.py reserve DEC` under the git lease on this file.

### DEC-0017 — Rulings on the agent-registry open questions (OQ-0001…OQ-0007)

- **Date:** 2026-09-30
- **Status:** Accepted
- **Annotated (2026-10-13):** amended by DEC-0076: `FAC-SEM-014` compares the entry's `providerId` with the manifest's `provider.id` by normal form; the slug and the file stem compare as written (`docs/specification/identifiers.md`).
- **Annotated (2026-10-11):** item 6 amended by DEC-0018 (every tool's `outputSchema` is rooted at `type: object`).
- **Refines:** DEC-0016
- **Decision:** The operator, who owns the contract design, ruled on the seven questions
  AR-1 raised:
  1. *OQ-0001* — equality is between like things. A provider entry's slug `id` equals its
     file name (`providers/<id>.json`); the entry names its provider by URI in a required
     `providerId`, compared URI to URI with the manifest's `provider.id`. FAC-SEM-014
     enforces both halves.
  2. *OQ-0002* — a job's result is the full result envelope, exactly what a synchronous
     call of the same capability returns (`result.schema.json` with `output` and `usage`
     required). One shape, no subset.
  3. *OQ-0003* — the envelope carries its trace (`trace: {traceparent, tracestate?}`) and it
     is authoritative for a stored result, because a job outlives the response; where the
     response's `_meta.traceparent` also exists it must agree (new FAC-SEM-022).
     FAC-SEM-019 reads the envelope.
  4. *OQ-0004* — name patterns apply to names; an env value is checked by its form,
     `secret-ref:NAME` (FAC-SEM-015 unchanged in behaviour, reworded).
  5. *OQ-0005* — a checker stage without a capability is identity-typed; a join is checked
     per incoming edge against the joined input (PL-1 unchanged in behaviour, written into C4).
  6. *OQ-0006* — a job-backed tool declares `outputSchema` as the self-contained union
     `oneOf[result envelope, job handle]`, so `structuredContent` always conforms; the
     capability keeps the pure result schema (FAC-SEM-017; `interop-job-tool-output.schema.json`).
  7. *OQ-0007* — only an event about traced work carries trace context; an event about
     untraced work must not invent one.
- **Version:** the contract stays `0.1.0`. Every change is additive or clarifying: new
  optional result fields (`output`, `trace`), a new schema, a new rule code, rewording. The
  one tightened shape is `providerId`, now required in `fabric-provider/0.1` entries and the
  full envelope for a job result; both extensions landed on 2026-09-30 (DEC-0016) and no
  host reads them yet (Fabric's registry is AR-2), so their protocol ids stay
  `fabric-provider/0.1` and `fabric-interop/0.1`. The only producer of either, the Fabric
  Agent Adapter 0.5.0, is aligned in its 0.5.1.
- **Consequences / affects:** `docs/specification/interop.md`, `provider.md`, `pipeline.md`,
  `service.md`, `results-and-evidence.md`, `docs/OPEN_QUESTIONS.md`,
  `schemas/result.schema.json`, `interop-result.schema.json`,
  `interop-job-tool-output.schema.json`, `interop-common.schema.json`,
  `provider.schema.json`, `src/interop-rules.ts`, `src/registry-rules.ts`, `fixtures/`, `test/`
- **Source:** the operator's rulings, relayed by the coordinator of the AR-1 run on
  2026-09-30. Id reserved through `agent_sync.py reserve DEC`; both registers edited under
  the git lease.

### DEC-0018 — Every tool's outputSchema is rooted at type object; the job-tool union gains its root type

- **Date:** 2026-09-30
- **Status:** Accepted
- **Amends:** DEC-0017 (item 6, OQ-0006)
- **Decision:** A job-backed tool's `outputSchema` is
  `{"type": "object", "oneOf": [result envelope, job handle]}`, and every served tool's
  `outputSchema`, when it has one, has root `"type": "object"` (new rule FAC-SEM-023). MCP
  requires an object root anyway. The canonical `jobToolOutputSchema` and
  `interop-job-tool-output.schema.json` carry the root type.
- **Why:** measured by the Project Observatory agent on Claude Code 2.1.285: when any tool's
  `outputSchema` has `oneOf` at its root without `"type": "object"`, Claude Code rejects the
  whole `tools/list` ("tools fetch failed — Handler returned an invalid result"); the Python
  MCP SDK accepts it, which is why the SDK-level tests of DEC-0017 passed.
- **Version:** the contract stays `0.1.0`: the change narrows only the job-tool union landed
  the same day (DEC-0017) and states an existing MCP requirement as a rule.
- **Consequences / affects:** `docs/specification/interop.md`, `src/interop-rules.ts`,
  `schemas/interop-job-tool-output.schema.json`, `fixtures/semantic/`, `fixtures/negative/`,
  `test/interop-rules.test.ts`
- **Source:** the operator's follow-up ruling of 2026-09-30, relayed by the coordinator, with
  the Observatory agent's measurement (its fix: Observatory v0.9.1). Id reserved through
  `agent_sync.py reserve DEC`; register edited under the git lease.

### DEC-0019 — A service may be online: `placement: "remote"` in `fabric-service/0.1`

- **Date:** 2026-10-02
- **Status:** Accepted
- **Annotated (2026-10-23):** the no-token `401` on the well-known route carries none of the service's data, and an identity proxy MAY answer it with its own page; the body is no longer required empty (DEC-0109).
- **Decision:** A descriptor gains the optional field `placement`, `local` by default. A
  `remote` placement is an online agent or dashboard at an `https://<dns-name>[:<port>]` origin,
  supervised by its platform (`lifecycle.manager: "none"`, no launchd fields, `doctor` only). It
  speaks the same well-known document, events feed and login code, with three changes: the
  well-known document requires the service token and answers `401` with an empty body
  otherwise; the session cookie is `__Host-`-prefixed and `Secure`; the port claim
  (`FAC-SEM-010`) covers local placements only. A host sends the token only to the descriptor's
  own `https` origin with the certificate verified, follows no redirect, offers no lifecycle
  control, and gives a remote probe a longer budget. New rule `FAC-SEM-024` refuses a remote
  placement on a reserved name or with a launchd field. Under the DEC-0016 policy nothing
  required changes: `contractVersion` stays `0.1.0`, the protocol id stays `fabric-service/0.1`,
  every existing descriptor stays valid, and a host written against the local text treats a
  remote descriptor as invalid instead of contacting it.
- **Consequences / affects:** `docs/specification/service.md` (*Remote placement*),
  `schemas/service-descriptor.schema.json`, `src/semantic-rules.ts`, `fixtures/` (one positive,
  eight negative), `test/service-rules.test.ts`, `CONTEXT.md`, `README.md`, `docs/DOCMAP.md`,
  `docs/evidence/sources.md`; consumers — the `building-fabric-services` skill and its kits,
  `@passioncode-ai/fabric-service-host`, Fabric Dashboards, Fabric.
- **Source:** operator decision 2026-10-02 (a remote service kind, not a local bridge; optional
  field in `0.1`; the well-known document behind the token), run brief
  `docs/evidence/specs/2026-10-02-remote-service-brief.md`, design
  `docs/evidence/specs/2026-10-02-remote-service-design.md`. Id reserved through
  `agent_sync.py reserve DEC` under the git lease on this file (run `r-12c7d2e0b`, backend
  `fs` — the record plane is degraded as `AGENTS.md` describes).

### DEC-0020 — Capability names admit product tool underscores through one shared definition

- **Date:** 2026-10-04
- **Status:** Accepted source change; consumer adoption pending
- **Annotated (2026-10-12):** adoption measured (DEC-0065, [adoption](evidence/adoption.md)): the adapter (`b291bf0`) and the relay (`51719e4`) pin a commit that contains this decision; Project Observatory's node pins `20a818e` (2026-08-27), which does not. A pin that contains a decision is not proof the consumer implements it.
- **Amends:** DEC-0016; C3.1/C3.6 naming in the interop specification
- **Decision:** `common.schema.json#/$defs/capabilityName` admits
  `^[a-z][a-z0-9._-]{1,127}$`. The manifest capability name, hub argument,
  service MCP advertisement and pipeline stage reference that definition.
  Names remain 2–128 characters with a leading lowercase ASCII letter;
  existing dotted and hyphenated names remain valid. Product tools such as
  `read_message` are called by their own names without a required new field.
- **Compatibility:** This widens accepted names without changing required fields,
  authority, URI identities, protocol ids or immutable past commits/tags.
  `contractVersion` remains `0.1.0` under DEC-0016's additive extension policy;
  consumers must review and repin the exact source commit before they accept
  underscores. A source PR is not consumer adoption or a release receipt.
- **Consequences / affects:** `schemas/common.schema.json`,
  `schemas/manifest.schema.json`, existing references in
  `interop-agent-call.schema.json`, `service-well-known.schema.json` and
  `pipeline.schema.json`; `docs/specification/interop.md`, `README.md`,
  `docs/DOCMAP.md`, `fixtures/`, `test/capability-names.test.ts`;
  Fabric CO-193 and consumers with a contract pin.
- **Evidence:** The compiled-schema regression on unchanged `71cdd6e` failed
  17 of 77 cases: 16 underscore acceptances across four surfaces and the
  missing manifest shared reference. Existing-name and negative cases passed.
  [Baseline receipt](handoffs/co193-receipts/baseline-red.txt).
- **Source:** [owner issue #8](https://github.com/passioncode-ai/fabric-agent-contract/issues/8),
  [Fabric CO-193 at published main](https://github.com/passioncode-ai/fabric/blob/8ff1450ba3b2845a9162cc2fb183a04b895ad363/docs/evidence/specs/2026-08-16-software-fabric-carryover.md).
  DEC-0020 reserved by git CAS under key `capability-underscore-co193-20261004`;
  decision file edited under the git lease (`r-codexco19320`), record plane
  degraded to local `fs` because no Notion environment is configured here.

### DEC-0021 — A service reports its own spend in a usage report

- **Date:** 2026-10-04
- **Status:** Accepted source change; consumer adoption pending
- **Annotated (2026-10-12):** adoption measured (DEC-0065, [adoption](evidence/adoption.md)): the adapter (`b291bf0`) and the relay (`51719e4`) pin a commit that contains this decision; Project Observatory's node pins `20a818e` (2026-08-27), which does not. A pin that contains a decision is not proof the consumer implements it.
- **Annotated (2026-10-12):** the usage report amended by DEC-0065 (its 31-day window checked; `byProject` attribution by project and task run, never by caller).
- **Annotated (2026-10-11):** `budget` amended by DEC-0027 (a usage report lists every spending limit the service applies).
- **Annotated (2026-10-23):** a host sums money over the rows not on a subscription; a `subscription` row's `costUsd` is an estimate, never money (DEC-0110).
- **Amends:** the `fabric-service/0.1` extension (additive, DEC-0016 extension policy)
- **Decision:** A service MAY declare `surfaces.usage.path` in its well-known document and
  answer there, behind the service token, a `service-usage.schema.json` report. The report gives
  up to 31 UTC days of calls, tokens and USD cost, per day and per provider/model. A cost the
  service could not establish is `null` with `unpricedCalls` counting the calls, never `0`. An
  optional `budget` states the service's own day or month limit. `FAC-SEM-025` checks that the
  report adds up.
- **Why:** The operator asked on 2026-10-04 for one place to see which agents exist and what
  each one spent, collected by the agents themselves at the protocol level. Usage existed only
  per job (`common.schema.json#/$defs/usage` on interop results). Agents put spend into ad-hoc
  summary tiles («Spend today, $»), which a host cannot add up or compare.
- **Compatibility:** It is an optional surface and a new schema. Required fields, authority and
  `contractVersion` `0.1.0` are unchanged. A host that does not know `surfaces.usage` ignores it.
  A consumer must review and repin the exact source commit before relying on it.
- **Consequences / affects:** `schemas/service-usage.schema.json`,
  `schemas/service-well-known.schema.json` (`surfaces.usage`), `docs/specification/service.md`
  (Usage report, `FAC-SEM-025`), `src/semantic-rules.ts`, `fixtures/` (`service-usage*`,
  `service-well-known-usage`), `test/service-rules.test.ts`,
  `test/schema-compilation.test.ts`. Consumers: `@passioncode-ai/fabric-service-host` and
  Fabric Dashboards (reader and spend view), the `building-fabric-services` kits, and Fabric's
  estate rollups (they sum receipts and keep unknown as unknown).
- **Not decided here:** the customer-facing commerce ledger (fabric-workspace draft
  `fabric-commerce/0.1-draft`, PR #34), and organization-wide aggregation across machines
  (Fabric hub).
- **Source:** operator request 2026-10-04 in the fabric-dashboards session. DEC-0021 reserved by
  git CAS (`agent_sync.py reserve DEC`); decision file edited under the git lease, record plane
  `fs`.

### DEC-0022 — Agents exchange information and requests through a Project board (`fabric-project-comms/0.1`)

- **Date:** 2026-10-04
- **Status:** Accepted 2026-10-05 — the operator accepted C1–C9 as written (OQ-0008); consumer adoption pending
- **Annotated (2026-10-12):** adoption measured (DEC-0065, [adoption](evidence/adoption.md)): the adapter (`b291bf0`) and the relay (`51719e4`) pin a commit that contains this decision; Project Observatory's node pins `20a818e` (2026-08-27), which does not. A pin that contains a decision is not proof the consumer implements it.
- **Annotated (2026-10-12):** the tool list amended by DEC-0073 (`com.directory`, seventeen tools; every tool's arguments and answer a closed schema, one receipt).
- **Annotated (2026-10-13):** amended by DEC-0079: an operator's hold on a thread, a Project or a responder slot refuses new work `held` (retryable) and never refuses started work, a cancel or a read.
- **Annotated (2026-10-13):** amended by DEC-0081: `outcome_unknown` is still left only by `com.reconcile`, and its caller widens to the estate owner while no responder holds the slot, observed only and with a required summary; a request the owner settled says so (`settledBy: "owner"`, sent only then).
- **Annotated (2026-10-13):** amended by DEC-0080: a message of kind `finding` may carry a structured `finding` (severity, consequence, affects, `dedupeKey`), deduped by the sender's Project and `dedupeKey`, its `affects` items redacted outside a reader's grants (`FAC-SEM-108`).
- **Annotated (2026-10-26):** amended by DEC-0135: who a message is delivered to (what counts as unread and what a
  mirror sends) is decided apart from who reads it; a reply goes to the sender it answers unless its `deliverTo` names
  the thread or a list of participants.
- **Decision:** An opt-in extension `fabric-project-comms/0.1`. A Fabric host serves a
  board on which messages are addressed to a Project, and through a request to a capability of
  that Project. Identity comes from the authenticated endpoint and never from the payload. A
  thread's participants are fixed at creation, and reads go through a private cursor. A request
  keeps its state and its effect state apart. Responders are fenced by slot generation, attempt,
  digest and database lease, atomically with each transition. Idempotency uses a board-issued
  epoch and key with a SHA-256 digest over canonical JSON. Every refusal is typed. The tools are
  `com.submit`, `com.list`, `com.get`, `com.read_ack`, `com.reply`, `com.cancel` and `com.status`
  for participants, and `com.enroll`, `com.claim`, `com.renew`, `com.accept`, `com.progress`,
  `com.effect_begin`, `com.complete`, `com.reconcile` and `com.responder_replace` for responders.
  A service advertises them in `surfaces.mcp.capabilities`. `com.status` is what a host reads for
  communication health.
- **Why:** Fabric COM-01 (the project-communications plan, fabric `3b2878fc`) needs versioned
  message, query, claim, ack and reply schemas and capability negotiation before the board
  (COM-02), consumer identity (COM-03), the adapters (COM-04), the Telegram mirror (COM-08/09)
  and service monitoring (COM-11) can start. The operator asked on 2026-10-04 for the place where
  agents exchange information and requests to be worked out.
- **Compatibility:** It is additive: eight new schemas and no change to an existing one.
  `contractVersion` stays `0.1.0`. Clients without the extension keep every tool.
- **Consequences / affects:** `docs/specification/project-comms.md`; `schemas/comms-common`,
  `comms-submit`, `comms-message`, `comms-page`, `comms-fence`, `comms-complete`, `comms-status`
  and `comms-refusal`; `src/semantic-rules.ts` (`FAC-SEM-026`, `FAC-SEM-027`,
  `COMMS_TRANSITIONS`); `fixtures/` (`comms-*`); `test/comms-rules.test.ts`,
  `test/schema-compilation.test.ts`. Consumers once accepted: Fabric (board, COM-02/03),
  fabric-agent-adapter (COM-04, COM-08), Fabric Dashboards (COM-11 reads `com.status`), Fabric
  Switchboard.
- **Source:** the Codex coordinator's draft, preserved unchanged at fabric
  `codex/com01-contract-candidate-20261004` `ac230309` (README and reference model; the files
  it names were never written); the architecture proposal on fabric
  `codex/project-comms-architecture-20261004`. DEC-0022 was reserved by git CAS, and the decision
  file was edited under the git lease.

### DEC-0023 — Agent memory is served as `memory/0.1`, first by Project Observatory

- **Date:** 2026-10-04
- **Status:** Accepted source change; provider and consumer adoption pending
- **Annotated (2026-10-12):** the reserved name `memory.learning.propose` is withdrawn by DEC-0072: learning lives in Fabric (Fabric ADR-0109) and a learning note is `learning-note/1`.
- **Annotated (2026-10-12):** adoption measured (DEC-0065, [adoption](evidence/adoption.md)): the adapter (`b291bf0`) and the relay (`51719e4`) pin a commit that contains this decision; Project Observatory's node pins `20a818e` (2026-08-27), which does not. A pin that contains a decision is not proof the consumer implements it.
- **Supersedes:** DEC-0014's pilot, for agent memory only (Fabric ADR-0105). DEC-0014 still
  governs Fabric's own domain memory.
- **Decision:** `memory/0.1` is the capability family for agent memory, with extension key
  `https://fabric.passioncode.ai/agent-contract/extensions/memory/0.1` and schema
  `schemas/memory-capability.schema.json`.
  - **Capabilities.** It has nine, and all nine are required of a provider:
    - `memory.checkpoint.write` and `memory.checkpoint.latest`;
    - `memory.handoff.create`, `memory.handoff.accept` and `memory.handoff.get`;
    - `memory.workflow.list`;
    - `memory.record`;
    - `memory.search` and `memory.recall`.
  - **Reserved names.** `memory.learning.propose`, `memory.explain` and `memory.forget` are
    reserved. They are not served under these names until a later revision gives them a schema.
  - **Strictness.** Inputs refuse unknown fields. Outputs require their core fields and may
    carry more. A refusal is a typed answer (`error`, `detail`, optional `code`, `hint`,
    `remedy`, `keptAs`, `degraded`). A wire write is a proposal (`memory.record` answers
    `state: proposed`).
  - **Provider declaration.** A provider declares the family, all nine capabilities and a
    `compatibility` map to its existing tool names. Project Observatory maps them to
    `observatory_*`.
- **Identity:** `owner` is a writer label, never authority. Who the caller is comes from the
  transport: stdio is the operator's local agent, and an HTTP call carries a bearer that the
  provider resolves to a binding (Observatory `access-bindings/1`). On Fabric's hub hop
  (ADR-0115), the provider intersects an `X-Fabric-Projects` narrowing header with the
  binding's projects. The header is a comma list that never widens. When it is absent, the
  call is workspace-level and runs only when the grant names the capability itself.
- **Why:** Fabric ADR-0105 (operator, 2026-10-03) moved agent memory into Project
  Observatory and made Fabric its client. `docs/specification/memory-and-learning.md` said
  wire activation needed a versioned change, and this is that change.
- **Compatibility:** It is an additive extension, as DEC-0016 allows. `contractVersion`
  `0.1.0` is unchanged. A consumer must review and repin the exact source commit before
  relying on it.
- **Consequences / affects:**
  - `schemas/memory-capability.schema.json`;
  - `src/extensions.ts` (`memory` key);
  - `fixtures/` (`memory-*`, built from the outputs Observatory actually served on
    2026-10-04);
  - `test/schema-compilation.test.ts`;
  - `docs/specification/memory-and-learning.md` (Wire: `memory/0.1`).
  - **Consumers:**
    - the Observatory engine's `memory.*` entry points and repin (PB-137 N-025);
    - Fabric's local memory client (N-023);
    - the task-pipeline stage writer (N-024);
    - transport conformance over stdio and HTTP (N-021).
- **Not decided here:** `memory.forget`, `memory.explain` and `memory.learning.propose`
  schemas; the HTTP endpoint itself (Observatory N-016); the Fabric hub's Observatory
  connector (ADR-0105 M8).
- **Source:**
  - Fabric ADR-0105 and ADR-0115 at fabric `9e7f54e6`;
  - the Fabric session's reading of the hub hop, 2026-10-04: standing product connection,
    `X-Fabric-Projects`;
  - PB-137 N-017.

  DEC-0023 was reserved by git CAS (`agent_sync.py reserve DEC`); DEC-0022 is held by
  PR #11. This file was edited under the git lease.

### DEC-0024 — A service may keep its MCP credential apart from the host's token

- **Date:** 2026-10-05
- **Status:** Accepted source change; consumer adoption pending
- **Annotated (2026-10-12):** adoption measured (DEC-0065, [adoption](evidence/adoption.md)): the adapter (`b291bf0`) and the relay (`51719e4`) pin a commit that contains this decision; Project Observatory's node pins `20a818e` (2026-08-27), which does not. A pin that contains a decision is not proof the consumer implements it.
- **Amends:** the `fabric-service/0.1` Surfaces table (additive, DEC-0016 extension policy)
- **Decision:** `surfaces.mcp.auth` is optional, with the values `descriptor` (default) and `own`.
  With `descriptor`, the MCP surface takes the descriptor's token in its header, as before. With
  `own`, the MCP surface authenticates its callers with credentials of its own (a token per
  agent, or a gateway's caller identity) and refuses the descriptor's token. A host or a probe
  then neither calls MCP with the descriptor's token nor reports the refusal as nonconformance.
  The descriptor's token stays the host's credential for the well-known document of a remote
  placement, the events feed, the usage report and the operator login code.
- **Why:** An MCP credential sits in every client's configuration (`~/.claude.json`), and
  minting an operator login code with it is an escalation. Two installed services already keep
  the roles apart on purpose. One has a host token named by the descriptor and a separate token
  for agents. The other is a lifecycle broker that takes callers through its gateway only.
  Against them the probe reported `interop.tools-match` FAIL (401 and 403 on 2026-10-05), which
  flags a safer design as broken. (Corrected 2026-10-05: the services are described, not named;
  they are private.)
- **Compatibility:** It is additive: an optional field with a default that means today's
  behaviour. `contractVersion` stays `0.1.0`.
- **Consequences / affects:** `schemas/service-well-known.schema.json`,
  `docs/specification/service.md` (Surfaces, *MCP credentials*), and the fixtures
  `service-well-known-mcp-own-auth` and `service-well-known-mcp-bad-auth`. Consumers: the
  fabric-agent-adapter probe (`check_service.py` leaves the MCP rules NOT_RUN for `own`),
  the two services above (declare `own`, done 2026-10-05), and hosts that call MCP.
- **Source:** the probe sweep of the 16 installed services on 2026-10-05, run by the
  fabric-dashboards session. DEC-0024 was reserved by git CAS. DEC-0022 is the proposed COM-01
  (PR #11) and DEC-0023 is memory/0.1.

### DEC-0025 — A service keeps settings backups (`fabric-settings-backup/1`), and a feed client sends the token where the descriptor says

- **Date:** 2026-10-05
- **Status:** Accepted source change; consumer adoption pending
- **Annotated (2026-10-12):** adoption measured (DEC-0065, [adoption](evidence/adoption.md)): the adapter (`b291bf0`) and the relay (`51719e4`) pin a commit that contains this decision; Project Observatory's node pins `20a818e` (2026-08-27), which does not. A pin that contains a decision is not proof the consumer implements it.
- **Amends:** the `fabric-service/0.1` extension (additive, DEC-0016 extension policy)
- **Decision:**
  - **Settings backup.** A service whose store holds operator decisions SHOULD keep snapshots of
    them in `fabric-settings-backup/1` files at
    `<root>/settings-backups/<service-id>/<instance>/settings-<UTC stamp>.json`, outside its data
    directory. `<root>` is `~/Library/Application Support/PassionCode` on macOS,
    `%APPDATA%\PassionCode` on Windows, and `$XDG_CONFIG_HOME/PassionCode` (default
    `~/.config/PassionCode`) on Linux. Directories are `0700`, files `0600`, and writes are
    atomic. A file carries `format`, `service`, `created_at`, `reason`, `sha256`, `counts` and
    `tables`. `sha256` is the SHA-256 of the canonical JSON of `tables`, and a reader MUST refuse
    a file it does not match (`FAC-SEM-035`). Values are JSON scalars, with fractions as strings.
    A backup holds decisions and bindings only, and names secrets without holding them. Snapshots
    are taken daily, at a start when the newest is older than 24 hours, and read-only on
    uninstall. An unchanged snapshot is not rewritten, and at least 14 are kept. Restore only adds
    rows missing by primary key and names everything it dropped, defaulted or was refused.
    Automatic restore runs only on a fresh database, from the newest intact snapshot that has
    content. Applying a manual restore is the operator's act.
  - **Feed client.** A client of `GET /fabric/v1/events` (and of every token-protected route)
    MUST send the token in the header named by the descriptor's `auth.header`, in the form named
    by `auth.scheme`: the raw token for `none`, `Bearer <token>` for `Bearer`. It MUST NOT assume
    `Authorization: Bearer` (`FAC-SEM-036`).
- **Why:** A service's data directory can be lost, purged or migrated wrongly. What the operator
  decided — which projects it serves, how each is bound, which secret slot each binding uses —
  then has to be decided again, and nothing in the contract said where a copy could live or how a
  restore may treat it. One service built backups first. This decision makes its rules the
  shared format, so every service and host reads the same files. The feed rule comes from a
  failure: a feed client that ignored a custom header was refused on every poll and silently
  dropped every notify event. The descriptor schema already said which header and scheme to use
  (`auth.header`, `auth.scheme`); nothing said the client must honour them.
- **Compatibility:** It is additive: a new optional practice with a new schema, and a client rule
  that the descriptor schema already implied. Required fields and `contractVersion` `0.1.0` are
  unchanged. The canonical JSON equals Python's `json.dumps(sort_keys=True, ensure_ascii=False)`,
  so a writer that already computes the checksum that way keeps its files valid, provided it
  stores no fractions. A consumer must review and repin the exact source commit before relying
  on it.
- **Consequences / affects:** `schemas/settings-backup.schema.json`;
  `docs/specification/service.md` (Events feed *feed client*, Lifecycle, Settings backup,
  Semantic rules); `docs/specification/conformance.md` (Clients and readers);
  `src/settings-backup.ts` (`canonicalJson`, `settingsBackupDigest`, `FAC-SEM-035`),
  `src/service-feed.ts` (`tokenHeader`, `FAC-SEM-036`), `src/semantic-rules.ts`; `fixtures/`
  (`settings-backup*`, `semantic/service-feed-request-*`); `test/settings-backup.test.ts`,
  `test/service-feed.test.ts`, `test/schema-compilation.test.ts`; `CONTEXT.md`
  (**Settings backup**); `docs/DOCMAP.md`. Consumers: services that keep operator settings,
  the `building-fabric-services` kits, and every feed client (Fabric Dashboards and the service
  host).
- **Not decided here:** an organisation-wide lifecycle pointer (fabric-workspace, LC-16), backups
  for a remote placement, and encrypting backups at rest.
- **Source:** the first service implementation of settings backups and its review on
  2026-10-05; the feed failure observed the same day. DEC-0025 was reserved by
  git CAS (`agent_sync.py reserve DEC`, key `settings-backup-standard`). The decision file was
  edited under the git lease, record plane `fs`.
- **Renumbered at merge (2026-10-08):** this branch numbered its rules `FAC-SEM-028` and `FAC-SEM-029` by
  hand; main had given both codes to runner routes (DEC-0026). Under DEC-0029 §9 they are `FAC-SEM-035`
  (settings-backup integrity) and `FAC-SEM-036` (feed-client token header), reserved with
  `agent_sync.py reserve SEM` (receipts SEM-0035, SEM-0036); the meaning of each rule is unchanged.

### DEC-0026 — Agent chats route through an ordered runner route with recorded fallback

- **Date:** 2026-10-07
- **Status:** Accepted source change; refined by DEC-0029 (attach boundary, derived context, route
  event, rule-code register); consumer adoption pending
- **Annotated (2026-10-12):** adoption measured (DEC-0065, [adoption](evidence/adoption.md)): the adapter (`b291bf0`) and the relay (`51719e4`) pin a commit that contains this decision; Project Observatory's node pins `20a818e` (2026-08-27), which does not. A pin that contains a decision is not proof the consumer implements it.
- **Refines:** DEC-0016 (additive extension policy); DEC-0010 (admission lifecycle unchanged)
- **Decision:** A project pins, per capability served by the local-runner profile,
  an immutable **runner route**: an ordered list of candidates, each naming a
  catalogue runner kind, an admitted provider revision, and a session policy —
  `attach: preferred|never` (reuse a live terminal session first) and
  `spawn: allowed|never` (start a new terminal process otherwise). The host walks
  the candidates in order: attach to a live session when preferred and present;
  spawn when allowed and the catalogue probe passes; otherwise record the probe
  result and reason and move to the next candidate. So when no Claude Code session
  exists, the next available candidate answers — Hermes starts and replies —
  instead of failing the chat. `exhausted` (default `capability-unavailable`)
  declares the all-candidates-failed behavior, with `hold` as the bounded
  alternative; `recovery` (default `sticky`) declares whether a conversation
  returns to the higher-preference candidate when one becomes available again.
  Every selection and switch records from/to candidate, runner kind, reason, route
  revision, run/node and time — the runner analogue of the account switch event.
  `runner-route` is a versioned-setting kind, and a binding MAY pin a route
  revision as `runnerRoute`, overriding the project default for one agent. A route
  changes which runner serves a request, never the capability semantics, profile,
  model requirement or write scope; it grants nothing — candidates must be admitted
  providers (FAC-SEM-030).
- **Compatibility:** Additive under DEC-0016: one new schema, one new
  versioned-setting kind value, one optional binding field, three new rule codes
  (FAC-SEM-028…030). `contractVersion` stays `0.1.0`; every existing manifest and
  binding stays valid.
- **Consequences / affects:** `schemas/runner-route.schema.json` (new),
  `schemas/versioned-setting.schema.json` (kind), `schemas/binding.schema.json`
  (`runnerRoute`), `docs/specification/runners.md` (Runner routes),
  `docs/specification/profiles.md`, `docs/specification/execution-context.md`,
  `docs/specification/versioning.md`, `CONTEXT.md`, `docs/DOCMAP.md`,
  `src/route-rules.ts`, `src/semantic-rules.ts`, `fixtures/` (`runner-route*`,
  `versioned-setting-runner-route`), `test/route-rules.test.ts`,
  `test/schema-compilation.test.ts`; run brief
  `docs/evidence/specs/2026-10-07-runner-route-brief.md`. Consumers: Fabric (host
  route resolution for agent chats; `registry/runners.json` catalogue data),
  fabric-agent-adapter (route-aware probes), Fabric Dashboards (route state and
  switch events).
- **Source:** operator request 2026-10-07 — everywhere an agent chat exists,
  prefer terminal agents under an operator setting with availability fallback
  (no Claude Code session → a started Hermes answers). DEC-0026 reserved by git
  CAS (`agent_sync.py reserve DEC --key runner-route-20261007`); DEC-0025 is held
  by another run. The decision file was edited under the git lease (run
  `r-f0052c6f2`); the record plane is degraded to `fs` because no Notion token is
  configured, as `AGENTS.md` describes.

### DEC-0027 — A usage report lists every spending limit the service applies

- **Date:** 2026-10-07
- **Status:** Accepted source change; consumer adoption pending
- **Annotated (2026-10-12):** adoption measured (DEC-0065, [adoption](evidence/adoption.md)): the adapter (`b291bf0`) and the relay (`51719e4`) pin a commit that contains this decision; Project Observatory's node pins `20a818e` (2026-08-27), which does not. A pin that contains a decision is not proof the consumer implements it.
- **Annotated (2026-10-23):** a host counts only money against a budget or a limit, never a subscription's estimate (DEC-0110).
- **Amends:** the `fabric-service/0.1` usage report of DEC-0021 (additive, DEC-0016 extension
  policy)
- **Decision:** `service-usage.schema.json` gains an optional `budgets` array, at most 64
  entries: `{id, scope, subject?, kind, period? | windowSeconds? | since?, limitUsd, spentUsd,
  enforced, tripped?}`. `scope` is closed (`machine`, `project`, `pool`, `job`); `kind` is an
  open string whose known values are `per_job`, `approval`, `daily`, `monthly`, `velocity`,
  `pool`, `emergency`, and a host shows an unknown kind generically, never rejecting it. A limit
  has at most one window — a calendar UTC `period`, a rolling `windowSeconds`, or a cumulative
  `since` — and the window agrees with the kind. Per-order limits (`per_job`, `approval`) carry
  no window and `spentUsd: null`. `approval` is a threshold, not a ceiling, and is never a
  breach. `enforced: false` is shown as "not enforced"; `tripped: true` (work stopped by this
  limit now) requires `enforced: true`. Only spend-triggered stops belong in `budgets`. When
  `budget` and `budgets` are both present, `budget` repeats one enforced machine `daily` or
  `monthly` entry with the same calendar `period`, so old and new readers never disagree.
  `FAC-SEM-031` checks all of this; a breach is shown first, not refused.
- **Why:** The operator asked on 2026-10-07 that every limit an agent applies is always visible
  in the agents' spend view, including limits the operator chose to skip. DEC-0021's single
  `budget` can state one day or month line; a service that enforces per-order, daily, monthly,
  rate, pool and emergency limits could show only one, and a rolling-window limit could not be
  stated truthfully at all.
- **Compatibility:** Optional field. Required fields, authority and `contractVersion` `0.1.0`
  are unchanged; a report without `budgets` is unchanged, and a reader that does not know
  `budgets` ignores it. A service whose machine limit counts a rolling window omits `budget`
  rather than restating a rolling sum as a calendar period.
- **Consequences / affects:** `schemas/service-usage.schema.json` (`budgets`, `$defs/limit`),
  `docs/specification/service.md` (Limits, `FAC-SEM-031`), `src/semantic-rules.ts`,
  `fixtures/` (`service-usage-budgets*`), `test/service-rules.test.ts`. Consumers:
  `@passioncode-ai/fabric-service-host` and Fabric Dashboards (reader; Spend lists each agent's
  limits, breaches and the closest to their line first, and its summary shows the tightest
  enforced limit), and services that already enforce several limits.
- **Not decided here:** limits on things other than money (call counts, concurrent jobs), and
  aggregation across machines (Fabric hub).
- **Source:** operator request 2026-10-07, carried by the Fabric Dashboards session and the
  session of a media-generation service; shape proposed by the Dashboards session, review points
  by the fabric-workspace session. DEC-0027 reserved by git CAS (`agent_sync.py reserve DEC --key
  usage-budgets-20261007`, run `r-c2ef61050`). A second reserve under the same key from another
  run allocated DEC-0028, which was returned with `release-id` and is not written; the next free
  id is therefore DEC-0029. The decision file was edited under the git lease (run
  `r-8afd2c0d4`); the record plane is `fs`, as `AGENTS.md` describes.

### DEC-0029 — Runner routes: the attach boundary, the derived context, the route event, and one register for rule codes

- **Date:** 2026-10-07
- **Status:** Accepted source change; consumer adoption pending
- **Annotated (2026-10-13):** amended by DEC-0076: `FAC-SEM-030`, `FAC-SEM-032` and `FAC-SEM-034` compare a revision reference's id, a project and a capability by their normal forms (`docs/specification/identifiers.md`).
- **Annotated (2026-10-12):** adoption measured (DEC-0065, [adoption](evidence/adoption.md)): the adapter (`b291bf0`) and the relay (`51719e4`) pin a commit that contains this decision; Project Observatory's node pins `20a818e` (2026-08-27), which does not. A pin that contains a decision is not proof the consumer implements it.
- **Refines:** DEC-0026 (runner routes — additive, under the DEC-0016 extension policy); DEC-0010
  (admission unchanged); DEC-0013 (execution contexts unchanged)
- **Decision:** A review of DEC-0026 against the operator's request and Fabric's host design
  (ADR-0125) found the route under-specified where a host must decide, and states it:
  1. **Attach is bounded.** A host attaches only to a session it started and still holds, of the
     same runner kind and provider revision, project and capability, under an equal derived
     execution context. It never attaches to a process it did not start — an operator's own
     terminal, a tmux pane, another application. Foreign attach needs its own later decision.
  2. **The walk is defined, step by step,** with closed probe results (`not-catalogued`,
     `not-admitted`, `not-installed`, `not-responding`, `not-connected`, `no-held-session`,
     `quota-unknown`, `refused`, `spawn-failed`). Signed out is `not-connected`, judged only by the
     catalogue entry's new optional `auth` probe (argv, at most 5 s, exit 0 = signed in). A quota
     gate is a per-candidate step of the walk, and an unattended launch passes over a candidate
     whose quota basis is unknown. Permissions belong to the launch: a candidate that cannot run
     under its mode is `refused`, and the event names the mode actually received. Failures fall in
     three classes — candidate unavailable (try the next), request invalid (stop), outcome unknown
     (stop; never a second process for one request). A host walks only the candidates the route
     names, never the rest of its catalogue or a plain shell; a host-side ordering used before
     routes are adopted is not a route and names no route revision. An attached session is idle
     and bound to no other run, task or lease; a managed start that needs a new session identity
     never attaches.
  3. **The derived execution context:** the selected candidate runs under the binding's pinned
     context with `provider` (and, when the candidate names one, `accountPool`) replaced — every
     scope, limit, literal environment value and the working directory unchanged; `selectedAccount`
     is chosen again from the candidate's pool, and `secretRef` entries never cross to another
     provider. It is pinned as its own revision with the binding's context as parent — the one
     revision a run creates after it starts (`versioning.md`). A candidate MAY name a catalogue
     `drive` and an `accountPool` of the route's project; without one, the binding's pool serves it
     only when it serves its provider family.
  4. **No switch mid-turn,** and no runner-private state crosses runners. A switch happens at a
     launch only, for a closed reason: `runner-failed`, `runner-unavailable`, or — under
     `recovery: reprobe` only — `preferred-available`. `exhausted: hold` waits at most the context's
     `limits.wallSeconds`; a host that cannot wait answers capability-unavailable.
  5. **Every walk is recorded on the wire, once per launch:** `runner-route-event.schema.json` —
     `runner-selected` (an attached session names its `sessionRef`; `sticky: true` for a
     conversation that kept its runner, with nothing walked), `runner-switched` (a
     `runner-unavailable` switch carries the `from` runner's own `fromProbe`), `runner-exhausted` —
     with every passed-over candidate's probe result as the evidence.
  6. **A binding that pins a route agrees with it:** the schema allows `runnerRoute` only on the
     local-runner profile, and the binding's own `provider` is one of the candidates, so a reader
     that ignores routes still binds an admitted candidate. The `versioned-setting` payload of kind
     `runner-route` is validated as the route body.
  7. **Rules:** `FAC-SEM-030` compares the whole revision reference (id, revision, content hash) and
     needs the admission for the route's capability; new `FAC-SEM-032` (binding agreement),
     `FAC-SEM-033` (kinds and drives are catalogued), `FAC-SEM-034` (an event tells the truth about
     its route).
  8. **The catalogue gains the `tui` drive** — the runner's own interactive interface in a terminal
     the host holds — **and shared kind names**: `hermes`, `kilo`, `kimi-code` and `cline` join the
     listed kinds, so a route, an account chain and an event name the same runner on every host.
  9. **Rule codes get one register.** `FAC-SEM` codes had no allocator, and DEC-0025 (open
     branch `agent/settings-backup-standard`) and DEC-0026 (main) each defined their own
     `FAC-SEM-028` and `FAC-SEM-029`. The register in `docs/specification/conformance.md` allocates
     every code, with a **Next free rule code** marker that `agent_sync.py reserve SEM` reads;
     `test/consistency.test.ts` (G-13) refuses a code allocated twice, defined in two tables,
     emitted without a row or listed without a checker. Main keeps `FAC-SEM-028`…`030` for routes;
     DEC-0025's rules take reserved codes when that branch is rebased.
- **Why:** The operator asked that every agent chat prefer the terminal agents they run, with
  fallback — "no Claude Code session, Hermes starts and answers". DEC-0026's own example could not
  produce that: its fixture let `claude-code` spawn, so a missing session started a new Claude Code
  instead of falling to Hermes. Its "live terminal session" named no owner, which would let a host
  type into a terminal it does not own; its `reprobe` contradicted the host's "never mid-
  conversation"; its "every switch is recorded" had no shape a consumer could read; and its
  admission rule matched an id and a number, not the revision's bytes.
- **Compatibility:** Additive under DEC-0016 for everything that existed before 2026-10-07: new are
  one schema, the optional candidate fields `drive` and `accountPool`, the optional catalogue `auth`
  probe, the drive value `tui` and three rule codes, and no document that was valid at `94b1829`
  outside DEC-0026's surfaces changes validity. Three documents that DEC-0026 (`6e3c3f7`, the same
  day) made valid become invalid: a binding with `runnerRoute` on the `mcp` or `a2a` profile, a
  `runner-route` versioned setting whose payload is not a route body, and a route with more than 16
  candidates. That is a change of semantics `conformance.md`'s compatibility policy would put in a
  new major version; it is made in `0.1.0` as a recorded exception, because no consumer had adopted
  DEC-0026 (Fabric's pin `d4c88315` predates it; the adapter and Fabric Dashboards carry no route
  code) and a route without those limits would be the version every later consumer has to accept.
  `contractVersion` stays `0.1.0`.
- **Consequences / affects:** `schemas/runner-route.schema.json` (`$defs/body`,
  `$defs/candidate`, defaults), `schemas/runner-route-event.schema.json` (new),
  `schemas/versioned-setting.schema.json`, `schemas/binding.schema.json`,
  `schemas/runners.schema.json` (`tui`, `auth`), `docs/specification/runners.md` (catalogue kinds, Runner
  routes), `profiles.md`, `execution-context.md`,
  `conformance.md` (Semantic rule codes, gate 13), `CONTEXT.md`, `docs/DOCMAP.md`, `docs/ux/`
  (ST-006, FLW-05, SCN-009), `.claude/agent-sync.json` (register `SEM`; `conformance.md`
  guarded), `src/route-rules.ts`, `src/rule-codes.ts`, `src/docs-check.ts`, `fixtures/`
  (`runner-route*`, `binding-runner-route*`), `test/route-rules.test.ts`,
  `test/consistency.test.ts`. Run brief: `docs/evidence/specs/2026-10-07-runner-route-review-brief.md`.
  Consumers: Fabric (ADR-0125 adopts the event and the attach boundary as written), the adapter
  (probe results), Fabric Dashboards (route events, when the host emits them).
- **Source:** operator request 2026-10-07 to review the Kimi Code session's runner-route work and
  finish it. DEC-0029 reserved by git CAS (`agent_sync.py reserve DEC --key
  runner-route-amendment-20261007`, run `r-c6109cd37`); this file, `docs/backlog.md` and
  `conformance.md` were edited under the git lease of that run; the record plane is `fs`, as
  `AGENTS.md` describes.

### DEC-0030 — Activity telemetry: events, batches, a receiver-built summary without a person dimension, and an access log (`fabric-activity/0.1`)

- **Date:** 2026-10-08
- **Status:** Accepted source change (on merge of its pull request); consumer adoption pending.
  Revised before merge by the contract owner's review of PR #22 (head `0994981`) and re-review
  (head `19e2b58`).
- **Annotated (2026-10-12):** item 10 (presence) is **narrowed by OD-1 for owner and administrator views** by DEC-0052 item 4: the schema keeps the per-person estimates; what a receiver serves another person of them needs a purpose the subject confirmed. DEC-0052 also amends items 1, 4 (an ack never moves over check-in drops), 6 and 7.
- **Annotated (2026-10-12):** amended by DEC-0068 (the core kind `session.annotation`; one writer per session, `FAC-SEM-100`).
- **Annotated (2026-10-13):** amended by DEC-0082: the core kind `grant.usage` (one grant's metered usage for one UTC day, sums only, no session or user), `FAC-SEM-038` and `FAC-SEM-039` extended to it, and no event carries its session's context: a collector routes by it (`docs/specification/contexts.md`).
- **Amends:** nothing — a new protocol beside `fabric-service/0.1`, added under the DEC-0016
  extension policy
- **Decision:** The contract defines activity telemetry for debugging, work memory and spend
  reconciliation ([activity](specification/activity.md)):
  1. **A telemetry event** (`telemetry-event.schema.json`) has two core kinds.
     - `session.interval` records when a coding-agent session worked, waited or idled: `start`,
       `end`, `state` (`agent_working` / `awaiting_input` / `idle`), `method`,
       `idleThresholdSeconds`, an `attended` estimate, and the session's `outcome` on its last
       interval.
     - `usage.line` records what one model call used: `model`, `tokens.input` / `output` /
       `cacheRead` / `cacheWrite`, `cost.usd` with `cost.basis` (`provider` / `price-list` /
       `client-estimate`), and `dedupeKey`.

     Both kinds require `runtime`. The envelope carries:
     - an open-vocabulary `source`, a `skill`, `launch.via`, `session.parent`, `git.branch`
       (bounded, hashable by policy), `task.ref`, and an opaque `user.id`;
     - the stream position (`collector.id`, `collector.epoch`, `seq`);
     - three clocks: `occurred` (device wall clock), `bootId` with `monotonicNs` (a sleep-counting
       monotonic clock as a decimal string of at most 2^64 − 1), and `received` (set by the
       receiver only).

     Fields are `camelCase` like the rest of the contract. Dots appear only in identifiers (`kind`,
     `source`, policy keys). A table maps every field onto OpenTelemetry log records.
  2. **Forward compatibility:** a receiver accepts, stores and counts an event of any kind it does
     not know — an extension `x-<namespace>.<kind>`, or a core kind a later revision adds — and never
     interprets its `data`, which the schema bounds to two levels of short scalar tokens. A new core
     kind is therefore additive within `0.1`.
  3. **`eventId`** has two forms:
     - a ULID, for an event the collector originates;
     - `sha256:` of the canonical `{source, key}`, for an event read from a source that can be read
       again. Such an event carries its `sourceKey`: the source's own record id, or — for a key
       derived from a file — `hmac-sha256:` of `{offset, path}` under the device's telemetry key, a
       secret the collector never sends. Never a path: a relative path still carries the home
       directory in the encoded form runtimes write (`-Users-<name>-`).

     `git.branch`, when hashed by policy, uses the same telemetry key.

     Delivery is idempotent on (`device.id`, `eventId`).
  4. **Streams** are (`device.id`, `collector.id`, `collector.epoch`).
     - **The epoch is issued by the server at enrollment.** A collector that loses its counter
       re-enrolls and starts at seq 1 under the new epoch.
     - A batch (`activity-batch.schema.json`, at most 1000 events, no `received`) carries a
       contiguous slice of each stream, oldest first.
     - The ack (`activity-batch-ack.schema.json`) gives `accepted + duplicates + rejected` equal to
       the batch. For each stream it gives, over everything the receiver holds across batches — the
       same state tamper evidence is judged from — the highest seq up to which every seq is consumed
       (held, rejected and never resent, or accounted for by a `buffer.overflow`), and the consumed
       ranges above it (`held`).
     - The device keeps every event above the ack that is not in a held range, and sends forward
       from its oldest kept event not yet in flight. So a head gap whose overflow is still buffered
       does not stall delivery.
     - The receiver attributes a batch to its client certificate's device, and each event to the user
       bound to its epoch (DEC-0031).
  5. **`activity-summary/1`** is built by a receiver only, never a device. It has cells of agent ×
     skill × project × UTC day × outcome with counts, durations (`agentSeconds`,
     `waitHumanSeconds`, `waitAgentSeconds`, `attendedSeconds`, estimates under `method` and
     `idleThresholdSeconds`) and usage — and **no person dimension**.
  6. **`access-log/1`** lists every read of a subject's data, keyed by their `user.id` or by a device
     bound to them. Each entry records who read it (an opaque `user.id` or a service, and a role),
     the scope, the device, the range, the time and the purpose. A receiver records those reads and
     lets the subject read them.
  7. **Personal data and purpose:** events and check-ins that carry a `user.id` are personal data.
     - A receiver processes them only for the purposes, and keeps them only for the retention, that
       the organization's notice or policy states.
     - It records every read of a person's data in that person's access log.
     - The contract defines no scoring of persons.
     - Presence-derived values are estimates labelled by `method`.
  8. **No content and no person attribute** is the collector's duty. `FAC-SEM-037` is a
     **best-effort key filter**, not a proof: it splits every key into words (camelCase, `_`, `-`,
     `.`), refuses words, pairs and prefixes that name content or a person, refuses `user` anywhere
     but the event's own `/user`, and refuses home directories in values in the user-name segment
     form, plain or encoded. A measurement such as `performanceMs`, a count such as `reviewCount`,
     or a name such as `Users-guide` is not refused. The home-directory check is defence in depth:
     a base64-wrapped or otherwise encoded path is undetectable by design, and the control is that
     no field carries a path and a path-derived key is `hmac-sha256:` under the device's telemetry
     key. The schema's bounds on
     extension data are the stronger guard.
  9. **Rules:**
     - `FAC-SEM-037`: no content or person key, and no home path;
     - `FAC-SEM-038`: an unknown cost is `null`, never `0`;
     - `FAC-SEM-039`: event ids, clocks, streams, overflows and acks;
     - `FAC-SEM-040`: a summary has no person dimension and no device producer, and publishes no
       cell below its minimum population.

     The codes were reserved through `agent_sync.py reserve SEM` (receipts SEM-0037…SEM-0040).
  10. **Operator rulings, 2026-10-08** (relayed by the contract owner session; they close OQ-0009):
      - **Presence: confirmed as written.** Per-person presence estimates, labelled by `method`; every
        read in the person's access log; no scoring of persons.
      - **Minimum cell, k = 3 (OQ-0009 a).** A summary cell is published only when its population —
        distinct subjects, where an event's subject is its `user.id` when present and its
        `session.id` otherwise — is at least `minPopulation`, which is at least 3. A day's smaller
        cells fold into one other cell (`other: true`, without agent, skill, project or outcome). An
        other cell that is still too small is suppressed and counted in `suppressedCells`.
        `FAC-SEM-040` checks this.
      - **Retention (OQ-0009 b).** When `retention.raw_days` expires, the receiver deletes raw
        events; only summaries already built from them remain.
      - **OTLP (OQ-0009 c).** A receiver MAY accept OTLP logs as a second intake beside HTTPS
        batches, through the JSON → OpenTelemetry mapping table. The same attribution, schema,
        `FAC-SEM-037`…`039` rules and deduplication apply.
- **Why:** This implements the operator decision of 2026-10-08 (organization edition). Agent
  activity across an organization's devices is collected as neutral telemetry: when sessions worked
  or waited, and what they spent. Content is never collected, and a person can see who read their
  data.

  Runtimes already export most of this. Claude Code's OpenTelemetry export carries per-request
  `cost_usd`, token counts and a `request_id`
  ([monitoring](https://code.claude.com/docs/en/monitoring-usage)). It can also carry `user.email`,
  prompt text and raw API bodies when configured to. So the contract names its fields, bounds what
  it cannot name, and filters what slips through.

  The usage report (DEC-0021) already set "unknown is `null`, never `0`" for spend; the same rule
  holds here.

  The contract owner's review of PR #22 found five problems, fixed before merge:
  - a legitimate overflow and a reinstall were judged `tampered`;
  - the key filter could be passed with other spellings;
  - a device-produced summary was a per-person summary;
  - attribution came from the body.

  The re-review of `19e2b58` found four more, also fixed before merge:
  - any member could enroll as another person's device;
  - acks were computed per batch;
  - a relative path in `sourceKey` still carried the username;
  - after re-enrollment to another person, earlier events lost their owner.
- **Compatibility:** Additive under DEC-0016. It adds six new schemas (`activity-common`,
  `telemetry-event`, `activity-batch`, `activity-batch-ack`, `activity-summary`, `access-log`) and
  four rule codes; no existing schema, field or rule changes. `contractVersion` stays `0.1.0`. A
  manifest declares nothing for the protocol, so no extension key is added (G-08 is unchanged).
- **Consequences / affects:**
  - spec: `docs/specification/activity.md` (new);
  - schemas: `schemas/activity-*.schema.json`, `schemas/telemetry-event.schema.json`,
    `schemas/access-log.schema.json`;
  - source: `src/activity-rules.ts`, `src/seq-ranges.ts`, `src/semantic-rules.ts`;
  - `docs/specification/conformance.md` (register, clients and readers);
  - fixtures: `fixtures/` (`telemetry-event-*`, `activity-*`, `access-log*`) and
    `fixtures/catalogue.json`;
  - tests: `test/activity-rules.test.ts`, `test/schema-compilation.test.ts`;
  - docs: `CONTEXT.md`, `docs/DOCMAP.md`, `README.md`, `docs/evidence/sources.md`, `docs/ux/`
    (ST-007, FLW-06, SCN-010).

  Consumers are a collector on the device and an organization server, both outside this repository.
- **Not decided here:** nothing from OQ-0009 remains; the operator answered all three parts on
  2026-10-08 (item 10).
- **Source:** operator decision 2026-10-08 (organization edition); review of PR #22 by the contract
  owner, same day. DEC-0030 was reserved by git CAS (`agent_sync.py reserve DEC --key
  activity-contracts-20261008-a`, run `r-5fe268ae4`). This file and `conformance.md` were edited
  under the git leases of that run; the record plane is `fs`, as `AGENTS.md` describes.

### DEC-0031 — Devices: enrollment with a server-issued stream epoch, signed policy with locks, OpAMP-shaped check-in and health, attribution by certificate (`fabric-device/0.1`)

- **Date:** 2026-10-08
- **Status:** Accepted source change (on merge of its pull request); consumer adoption pending.
  Revised before merge by the contract owner's review of PR #22 and its re-review.
- **Annotated (2026-10-12):** item 7's "valid at the policy's `issuedAt`" is replaced by DEC-0053 item 1 — a key is judged when the device verifies — and item 9 records the posture reason `re_enrolled` (CON-OE-01); DEC-0053 amends items 1, 3 and 4 (bound users, organization policy keys, expiry, collection start, a certified root, ES256, device keys by role).
- **Annotated (2026-10-12):** items 1 and 2 extended by DEC-0056 — every request after enrollment carries an HTTP message signature beside mutual TLS, and a receiver behind a TLS-terminating host attributes by the certificate the verified signature names.
- **Annotated (2026-10-13):** DEC-0082: a device enrolled in several organizations holds one enrollment per organization and sends each enrollment's check-ins to that enrollment's own server, on its interval, reporting only its streams, with no context; a session's events go where `routeTarget` answers and `grant.usage` where `routeGrantUsage` answers (`fixtures/vectors/context-route.json`); an organization server that takes part in contexts issues `org.id` within `[A-Za-z0-9][A-Za-z0-9_-]{0,127}`.
- **Amends:** nothing — a new protocol, added under the DEC-0016 extension policy
- **Annotated (2026-10-20):** DEC-0094: a device without a hardware or platform store MAY hold its key in a file
  (`storage: file`, `exportable: true`, no `attestation`), its `deviceKeys` in the same store; rotation is idempotent
  (`FAC-SEM-125`).
- **Decision:** A device that sends activity telemetry (DEC-0030) is managed as
  [devices](specification/devices.md) says:
  1. **Enrollment** (`device-enrollment.schema.json`):
     - The device generates a non-exportable hardware key (`secure-enclave`, `tpm`,
       `platform-keystore`; `exportable: false`) and a PKCS#10 request.
     - The request is authenticated by an SSO sign-in or, for unattended creation by device
       management, an enrollment token. The proof always travels in the `Authorization` header,
       never in the body.
     - The server issues a client certificate of at most 30 days (SHOULD be 7), bound to `org.id`,
       `device.id` and, for SSO, the signed-in `user.id`.
     - It also issues a **`streamEpoch`** above every epoch issued to the device before, and records the
       binding of that epoch.
     - **A device id on record is proven, not claimed:** re-enrolling it needs a CSR from the key on
       record (`publicKeySha256`) or a device-management enrollment token issued for that device id.
       An SSO sign-in alone is not proof.
     - Check-ins ask for rotation before expiry. A device re-enrolls when its certificate expired,
       when told to, or when a collector lost its counter. **Re-enrollment resets the
       policy-revision baseline.**
  2. **Attribution:** a receiver takes the device of a batch or check-in from the client certificate,
     and each event's user from the binding recorded for the event's epoch — never from the body —
     and refuses a mismatch. Events buffered before a re-enrollment to another person stay with the
     person they belong to, and events of an unassigned epoch carry no user.
  3. **Policy** (`device-policy.schema.json`): one document per layer — `mdm`, `server`, `user`.
     - Each has a monotonic `revision` and keys `{value, locked?}`: `logging.required`,
       `build_channel.allowed` (`any` / `official` / `attested`), `telemetry.endpoint`
       (`https://`), `telemetry.git_branch` (`omit` / `hash` / `plain`) and `retention.raw_days`.
     - Unknown keys are kept and ignored. Values carry no fraction.
     - A server policy is signed with Ed25519 over its canonical JSON. A user layer is never signed,
       never delivered and cannot lock.
     - Trusted keys reach the device out of band until OQ-0010.
     - Precedence is `mdm` > `server` > `user`. A locked key takes the value of the highest layer
       that locks it; otherwise the user's own value applies; otherwise the highest default.
  4. **Check-in** (`device-check-in.schema.json`), shaped after OpAMP's `AgentToServer` and
     `ServerToAgent`. It carries:
     - `sequenceNum` (a gap is answered with `report_full_state`);
     - the agent version and build channel, health, and logging state;
     - each collector's `lastSeq`, `bufferedFrom` and still-unacknowledged `dropped` ranges;
     - per delivered layer, the policy revision held and its status, always including the server
       layer;
     - the certificate.

     The response carries a newer policy (never a user layer), a certificate action and the next
     interval. Detail and error strings are one bounded line without paths.
  5. **Health** (`device-health.schema.json`) is an open vocabulary. Its known states are
     `healthy`, `degraded`, `offline`, `inactive` (the collectors are quiet — a statement about the
     collector, not a person), `logging_disabled`, `tampered`, `never_installed` and `outdated`.

     The server keeps held and accounted ranges per stream across batches. Any of the following is
     tamper evidence and makes the state `tampered`:
     - a hole inside one batch;
     - a gap below a check-in's `bufferedFrom` that nothing accounts for;
     - an epoch never issued to the device;
     - a counter below a held seq;
     - a `bufferedFrom` below one reported before;
     - a policy revision below the current enrollment's baseline.

     A reinstall produces none of these.
  6. **Rules:**
     - `FAC-SEM-041`: a delivered policy verifies and moves forward;
     - `FAC-SEM-042`: precedence and locks;
     - `FAC-SEM-043`: health does not hide tampering or disabled required logging;
     - `FAC-SEM-044`: re-enrollment is proven; the certificate is short-lived and bound to what
       enrolled; and the epoch is new;
     - `FAC-SEM-045`: attribution by certificate and by epoch binding;
     - `FAC-SEM-046`: policy key sets.

     The codes were reserved through `agent_sync.py reserve SEM` (receipts SEM-0041…SEM-0046).
  7. **Operator rulings, 2026-10-08** (relayed by the contract owner session; they narrow OQ-0010):
     - **Signed key set (OQ-0010 b).** The enrollment response carries the organization's root key
       (`policyRootKey`), which signs policy key sets only. A key set
       (`device-key-set.schema.json`), signed by the root key, arrives in an enrollment or check-in
       response. It lists the policy signing keys with their validity windows, under a monotonic
       revision.
       - A rotation overlaps: a key still valid stays until its `notAfter` unless it is revoked by
         name.
       - A policy verifies only under a key of the current set that is valid at the policy's
         `issuedAt`, never under the root key.
       - `FAC-SEM-046` checks key sets, and `FAC-SEM-041` checks the key that signed a policy.
     - **Attestation formats (OQ-0010 a): deferred.** `attestation` stays opaque until the first real
       organization server adopts DEC-0031.
     - **`inactive` (OQ-0010 c):** the recommended default is 7 days without events; a server MAY
       change it.
- **Why:** This implements the operator decision of 2026-10-08 (organization edition). An
  organization must know that the telemetry of each device is on and complete. A person must not be
  able to quietly switch off what the organization requires, nor the organization claim more than
  the device reports.

  The design borrows four known patterns:
  - Enrollment with a hardware-bound, short-lived certificate follows the agent-enrollment pattern
    of fleet managers (Fleet, Elastic Fleet): a token for unattended enrollment, then a per-device
    credential.
  - The check-in follows OpenTelemetry's agent-management protocol
    ([OpAMP](https://opentelemetry.io/docs/specs/opamp/)): sequence numbers with a full-state
    request on a gap, a remote configuration acknowledged by status, and certificate offers through
    a CSR.
  - Locked keys follow the mandatory-versus-recommended split of managed browser policy.
  - A server-issued epoch is how a reinstall stays distinguishable from tampering: a collector that
    lost its state cannot know its previous epoch. The same epoch is the unit of attribution, so a
    re-assigned device never moves one person's events to another.
- **Compatibility:** Additive under DEC-0016. It adds six new schemas (`device-common`,
  `device-enrollment`, `device-policy`, `device-key-set`, `device-check-in`, `device-health`) and six
  rule codes;
  nothing existing changes. `contractVersion` stays `0.1.0`, and no extension key is added.
- **Consequences / affects:**
  - spec: `docs/specification/devices.md` (new);
  - schemas: `schemas/device-*.schema.json`;
  - source: `src/device-rules.ts`, `src/seq-ranges.ts`, `src/semantic-rules.ts`;
  - `docs/specification/conformance.md` (register, clients and readers);
  - fixtures: `fixtures/` (`device-*`) and `fixtures/catalogue.json`;
  - tests: `test/device-rules.test.ts`, `test/schema-compilation.test.ts`;
  - docs: `CONTEXT.md`, `docs/DOCMAP.md`, `README.md`, `docs/evidence/sources.md`, `docs/ux/`
    (ST-008, FLW-07, SCN-011).

  Consumers are the collector on the device and the organization server.
- **Not decided here (OQ-0010, narrowed 2026-10-08):** which attestation formats prove `attested` —
  deferred until the first real organization server adopts DEC-0031.
- **Source:** operator decision 2026-10-08 (organization edition); review of PR #22 by the contract
  owner. DEC-0031 was reserved by git CAS (`agent_sync.py reserve DEC --key
  activity-contracts-20261008-b`, run `r-5fe268ae4`), and `FAC-SEM-045` by `agent_sync.py reserve
  SEM --key activity-contracts-20261008-sem-9`. This file and `conformance.md` were edited under the
  git leases of that run; the record plane is `fs`.

### DEC-0032 — Services on Windows and Linux: the services folder, a supervisor per system, Windows paths and token files

- **Date:** 2026-10-10
- **Status:** Accepted source change; consumer adoption in progress (Fabric 0.3.4 CO-238, Fabric
  Dashboards FD-37)
- **Annotated (2026-10-11):** rule 2 of Windows token files amended by DEC-0033 (the owner may be the user, SYSTEM or Administrators).
- **Annotated (2026-10-12):** amended by DEC-0057 (the supervisor marker, the lifecycle and directories per system, one supervisor per descriptor, a forward-slash share refused, the token reader as a function with vectors).
- **Amends:** the `fabric-service/0.1` descriptor and service rules of DEC-0015 (launchd as the only
  supervisor), additively under the DEC-0016 extension policy.
- **Decision:**
  - **Services folder on Windows:** `%LOCALAPPDATA%\passioncode-fabric\services\` — LOCALAPPDATA,
    not APPDATA, so token files never roam with the profile. Linux keeps
    `${XDG_DATA_HOME:-~/.local/share}/passioncode-fabric/services/`; `FABRIC_SERVICES_DIR` still wins.
  - **A supervisor per system**, named by `lifecycle.manager`: `launchd` (macOS, `label` + `plist`),
    `systemd` (Linux, `unit`: a `systemctl --user` unit), `task-scheduler` (Windows, `task`: a per-user
    Scheduled Task with a logon trigger and restart on failure, created without administrator
    rights), or `none`. `unit` and `task` are required with their manager and refused with any other;
    a remote placement carries none of them (`FAC-SEM-024`). Start, stop, restart and state per
    system are in service.md *Lifecycle* (Off).
  - **Windows paths:** `localPath` accepts drive-absolute (`C:\…`, `C:/…`) and `~\` paths beside the
    POSIX ones; a network share is never a local path. A host validates the grammar of its own system.
  - **Windows token files:** the reader rule of service.md *Windows token files* — regular file, real
    path in the profile, owner the current user, every granting ACE on the allow-list (current user,
    SYSTEM, Administrators), deny ACEs ignored, refusal by SID; the writer sets a protected ACL.
- **Why:** The operator decided on 2026-10-09 that every PassionCode.ai product runs on macOS, Windows
  and Linux (fabric-workspace `knowledge/platforms.md`). launchd exists only on macOS, the contract
  named no Windows services folder, and its path grammar refused every Windows path, so no service
  could be described, and no host could supervise or read one, off macOS.
- **Compatibility:** Every existing descriptor stays valid: new enum values, new optional fields that
  are refused only beside another manager, and a wider path pattern. `contractVersion` stays `0.1.0`.
  A reader that knows only `launchd` and `none` sees a `systemd` or `task-scheduler` descriptor as
  invalid and shows it as such — never as running or controllable.
- **Consequences / affects:** `schemas/service-common.schema.json` (`localPath`),
  `schemas/service-descriptor.schema.json` (`lifecycle`), `src/semantic-rules.ts` (`FAC-SEM-024`),
  `fixtures/` (`service-descriptor-systemd`, `-task-scheduler`, and four refusals),
  `test/service-rules.test.ts`, `docs/specification/service.md` (services folder, transport,
  Lifecycle, Windows token files). Consumers: Fabric (`agentRegistry.ts` registry dirs and readers,
  CO-238), `@passioncode-ai/fabric-service-host` and Fabric Dashboards (FD-37: reader, the supervisor
  per system, the Windows token rule), the adapter kit and `building-fabric-services` (writers: the
  unit, the task and the protected ACL).
- **Not decided here:** a Windows service (needs administrator rights) as a supervisor; supervision of
  a remote placement (its platform's).
- **Source:** proposed by the Fabric Dashboards session (FD-37), agreed by the Fabric session (CO-238,
  fabric-90) including the exact Windows token-file rule, 2026-10-10; the open question in
  fabric-workspace `knowledge/platforms.md` (PR #86). DEC-0032 reserved by git CAS (`agent_sync.py
  reserve DEC --key windows-linux-supervision-20261010`); this file edited under the git lease.

### DEC-0033 — Windows token files: the owner may be the user, SYSTEM or Administrators

- **Date:** 2026-10-10
- **Status:** Accepted source change; consumers: Fabric Dashboards FD-37 (implemented), Fabric CO-238
- **Amends:** DEC-0032, rule 2 of service.md *Windows token files*.
- **Decision:** A Windows token file's owner SID MUST be the current user, `S-1-5-18` (SYSTEM) or
  `S-1-5-32-544` (BUILTIN\Administrators) — the same set an ACE may grant to (rule 3). Any other owner
  is a refusal that names the SID. Readers SHOULD read the ACL without loading a PowerShell module
  (`[System.IO.File]::GetAccessControl`), with `PSModulePath` removed from a Windows PowerShell 5.1
  child's environment, and never synchronously on a UI or main thread.
- **Why:** Windows makes BUILTIN\Administrators the owner of a file created by an elevated member of
  that group (the default owner of an elevated token). Fabric Dashboards' Windows CI (FD-37, runner
  `windows-latest`) refused every token file its own tests wrote for that reason. An owner can always
  rewrite the DACL, so the owner set must not be wider than the grant set; Administrators and SYSTEM
  already hold any file on the machine, so trusting them as owners adds no reader. The same CI showed a
  PowerShell 5.1 started under PowerShell 7 failing to load `Get-Acl` (pwsh's module path), and a cold
  PowerShell on `windows-11-arm` taking more than 15 s.
- **Compatibility:** Wider acceptance only: every token file valid under DEC-0032 stays valid; no schema,
  fixture or `contractVersion` change.
- **Consequences / affects:** `docs/specification/service.md` *Windows token files*. Consumers:
  `@passioncode-ai/fabric-service-host` `windowsAclProblem` and `readTokenAsync` (Fabric Dashboards
  FD-37), Fabric's Windows reader (CO-238), fabric-workspace `knowledge/platforms.md` PL-09.
- **Source:** measured in Fabric Dashboards CI on 2026-10-10, agreed by the Fabric session (fabric-90)
  the same day. DEC-0033 reserved by git CAS (`agent_sync.py reserve DEC --key
  windows-token-owner-20261010`); this file edited under the git lease.

### DEC-0034 — An agent's own operator channel: notifications and decisions in a messenger (`fabric-operator-channel/0.1`)

- **Date:** 2026-10-10
- **Status:** Accepted source change (on merge of its pull request); provider adoption pending.
- **Annotated (2026-10-11):** extended by DEC-0035 (a shared group: OC-14…OC-17).
- **Annotated (2026-10-12):** the status table's `unlinked` row amended by DEC-0058 (`receiver.lease` `held` or `elsewhere`; a channel nobody receives on is only `degraded` with `receiver-missing`).
- **Amends:** nothing — a new profile beside `fabric-service/0.1` and `fabric-project-comms/0.1`,
  added under the DEC-0016 extension policy; one optional well-known surface.
- **Decision:** An agent MAY have an **operator channel** — its own messenger channel to its
  operator, first over the Telegram Bot API ([operator channel](specification/operator-channel.md)).
  It sends what the agent's events feed marks `notify: true`, and asks for the decisions the agent
  stops for with buttons that run the agent's own operations. Thirteen rules, OC-1…OC-13:
  - **OC-1** off by default, enabled only by the operator; the bot token is named in the
    operator's secret store, never stored as a value;
  - **OC-2** one bot per agent and one receiver per token (polling or webhook, never both, never
    two processes) under an exclusive receiving lease; a webhook found set is a degraded channel,
    never silently deleted;
  - **OC-3** binding by a local one-time code (at least 40 bits, at most 10 minutes, hashed); only
    allowlisted numeric user ids cause effects — chat membership is not consent;
  - **OC-4** messages come from the events feed under a durable cursor, at most one per event id;
    a lost send response is `outcome_unknown` and is not resent automatically;
  - **OC-5** decision buttons carry opaque tokens mapped to subject, round and action; a press runs
    the same operation as the agent's UI and API, idempotently on the update id and the token; a
    stop already decided answers so and removes the keyboard; every callback query is answered;
  - **OC-6** money or irreversible actions need a second press on a confirm token that expires
    within 5 minutes and shows the amount; safety stops MAY be excluded, with where they are lifted;
  - **OC-7** free text only as a reply to the request, bounded, from allowlisted ids;
  - **OC-8** every effect audited with the channel and the numeric user id;
  - **OC-9** a status document (`off | unlinked | linked | standby | degraded`) at
    `surfaces.operatorChannel.path`; a transport failure degrades the channel, never the service;
    a 429 waits exactly `retry_after`;
  - **OC-10** results as media within the transport's ceilings (Telegram: photo 10 MB, file 50 MB,
    albums of 2–10 with no buttons), larger ones named with size and place; no machine-local URL
    offered to a phone;
  - **OC-11** the proposal duty: an agent with human stops or notify events proposes the channel
    once — at creation or adaptation, or at its first human stop while it is off — with the four
    operator steps, and records the answer; it never creates a bot, stores a token or enables
    itself;
  - **OC-12** messages from bots are ignored, and the channel never commands other bots;
  - **OC-13** a group migrated to a supergroup moves its binding.
- **Why:** The operator asked on 2026-10-10 for agents to reach them in a messenger: notifications
  from the events feed, and human-in-the-loop decisions answered with buttons, without opening a
  dashboard. The Project board's Telegram mirror (DEC-0022, C8) projects a board, not one agent's
  own stops, and an agent without a board had no contract for this at all. Two failures a
  messenger invites are named by rule: a second path to a decision that skips the agent's own
  authorization (OC-5), and a resend after a lost response that doubles a spend (OC-4, OC-6). The
  Telegram facts are pinned to Bot API 10.3 in `docs/evidence/sources.md`.
- **Relation to DEC-0022:** It complements the board and its mirror and contradicts neither: the
  same off-by-default, allowlist, `outcome_unknown` and bounded-loop principles (project-comms
  *Transport mirror*); board threads are never mirrored into an operator channel, and a board
  mirror and an operator channel never share a token.
- **Compatibility:** Additive under DEC-0016. One new schema (`operator-channel-status`) and one
  optional property in `service-well-known` (`surfaces.operatorChannel`); no existing field or rule
  changes and no semantic rule code is allocated. `contractVersion` stays `0.1.0`. A manifest
  declares nothing for the profile, so no extension key is added (G-08 is unchanged).
- **Consequences / affects:**
  - spec: `docs/specification/operator-channel.md` (new), `docs/specification/service.md`
    (well-known `surfaces.operatorChannel`), `docs/specification/project-comms.md` (a pointer from
    *Transport mirror*);
  - schemas: `schemas/operator-channel-status.schema.json` (new),
    `schemas/service-well-known.schema.json`;
  - fixtures: `fixtures/` (`operator-channel-status-*`, `service-well-known-operator-channel*`) and
    `fixtures/catalogue.json`;
  - tests: `test/operator-channel.test.ts`, `test/schema-compilation.test.ts`;
  - docs: `CONTEXT.md`, `docs/DOCMAP.md`, `README.md`, `docs/evidence/sources.md`, `docs/ux/`
    (JTBD-05, JRN-04, ST-009, ST-010, FLW-08, SCR-11, SCN-012, SCN-013), the handoff
    `docs/handoffs/2026-10-10-operator-channel.md`.

  Consumers: agents that serve `fabric-service/0.1` (providers), the fabric-agent-adapter skills
  `creating-fabric-agents` and `adapting-projects-to-fabric` (OC-11's proposal), and hosts that
  show the status (Fabric Dashboards).
- **Not decided here:** other transports; a host relaying a channel for several agents; semantic
  rules over a send ledger or callback log.
- **Source:** operator request 2026-10-10 (task-pipeline run, module T6). DEC-0034 was reserved by
  git CAS (`agent_sync.py reserve DEC --key t6-operator-channel-dec`, run `r-t6operatorch`;
  DEC-0033 is held by another open branch). This file was edited under the git lease
  `operator-channel`; the record plane is `fs`, as `AGENTS.md` describes.

### DEC-0035 — Operator channel in a shared group: silent unless addressed, and a channel nobody receives on is degraded (`fabric-operator-channel/0.1`, OC-14…OC-17)

- **Date:** 2026-10-10
- **Status:** Accepted source change (on merge of its pull request); provider adoption pending.
- **Annotated (2026-10-12):** its *Compatibility* line ("schema is unchanged") is superseded by DEC-0058, which makes a channel nobody receives on representable only as `degraded` with `receiver-missing` and `receiver.lease: none`.
- **Amends:** DEC-0034 additively: four rules appended to the
  [operator channel](specification/operator-channel.md) profile and one known reason code. OC-1…
  OC-13 are unchanged; OC-14 narrows the optional refusals of OC-3 and OC-7 to addressed input.
- **Decision:** In a group or supergroup, an agent's channel answers only what is addressed to its
  own bot, and a bound channel always has someone receiving:
  - **OC-14** silent by default in a group: a message not addressed to the bot gets no answer of
    any kind (no "unknown command", help, echo or refusal) and causes no effect;
  - **OC-15** addressed means `/command@ThisBot`, a reply to the bot's own message, or a press of
    the bot's own inline button. A bare `/command` in a group is not addressed; bare commands are
    honoured only in a private chat. A bare `/link CODE` in a group is accepted only if it matches
    this agent's pending code; one that does not match gets no answer, is not counted as a failed
    attempt and is not kept;
  - **OC-16** addressed but unknown or wrong input gets at most one short answer per message. An
    agent whose bot may be an administrator MUST be built to receive every group message: an
    unaddressed update is discarded once its offset advances — not stored, logged, sent to a model
    or charged. No rule needs administrator rights, and the agent does not ask for them for the
    channel's sake;
  - **OC-17** a bound or waiting channel has a supervised receiver. If nobody holds the receiving
    lease for more than 120 seconds, or the transport's pending update count (Telegram
    `getWebhookInfo.pending_update_count`) is above zero and not lower over two checks at least
    60 seconds apart, the channel is `degraded` with reason `receiver-missing` and
    `receiver.lease: none`. The check never calls `getUpdates` and never drops pending updates.
- **Why:** On 2026-10-10 the operator measured a shared agents chat with six agent bots, all
  administrators. Telegram delivers every group message to an administrator bot whatever its
  privacy mode (Telegram *Bots — features*, Privacy mode, in `docs/evidence/sources.md`), so each
  bot sees the operator's text, the other bots' commands and the link codes meant for other bots.
  Three defects were observed. One bot answered "unknown command" to every text. Another answered
  a bare `/link CODE` meant for a different bot with "code did not match". Two bots had nobody
  receiving, so their pending updates piled up while the status said nothing. DEC-0034 bounded
  bot-to-bot loops (OC-12) but did not say what a bot does with the human traffic it was never
  meant to read, and its status had no state for a bound channel with no receiver. Telegram keeps
  an undelivered update for at most 24 hours, so a silent missing receiver loses the operator's
  presses.
- **Compatibility:** Additive under DEC-0016. `operator-channel-status.schema.json` is unchanged:
  `reason.code` is an open vocabulary, and `degraded` with `receiver.lease: none` was already
  valid. `receiver-missing` is added to the known codes table. `contractVersion` stays `0.1.0`; no
  semantic rule code or extension key is allocated. An agent that followed DEC-0034 and answered
  unaddressed group text now falls short of OC-14. No existing document or fixture becomes invalid.
- **Consequences / affects:**
  - spec: `docs/specification/operator-channel.md` (*Group chats and liveness*, OC-14…OC-17, the
    `degraded` row, the `receiver-missing` code, *Not decided here*);
  - fixtures: `fixtures/positive/operator-channel-status-degraded-receiver-missing.json`,
    `fixtures/negative/operator-channel-status-linked-without-receiver.json`,
    `fixtures/catalogue.json`;
  - tests: `test/operator-channel.test.ts` (OC-1…OC-17; reason codes against the schema and the
    fixtures; this entry);
  - docs: `CONTEXT.md` (addressed message), `docs/DOCMAP.md`, `docs/evidence/sources.md`,
    `docs/ux/scenarios.md` (SCN-014), the handoff
    `docs/handoffs/2026-10-10-operator-channel-group-chat.md`.

  Consumers: every agent that implements the channel. The fabric-agent-adapter pin follows the
  merge commit of this change.
- **Not decided here:** several agents sharing one bot (OC-2 still gives each its own); a host
  that relays one group for several agents.
- **Source:** operator request and measurement, 2026-10-10. DEC-0035 was reserved by git CAS
  (`agent_sync.py reserve --key oc-group-chat-20261010 DEC`); this file was edited under the git
  lease `docs/DECISIONS.md`; the record plane is `fs`, as `AGENTS.md` describes.

### DEC-0036 — Embedded dashboard: a 360 px floor, reachable navigation, one scroller, a 480 px host floor and the appearance carrier (`fabric-dashboard/0.1`)

- **Date:** 2026-10-11
- **Status:** Accepted source change (on merge of its pull request); host and adapter adoption pending.
- **Annotated (2026-10-12):** ED-6, ED-8 and ED-9, and its *Not decided here*, amended by DEC-0059 (the cookie per host or per store, a page applies only the fields it declares, an invalid declaration is not declared, `FAC-SEM-080`).
- **Amends:** DEC-0015 additively: a new profile, [embedded dashboard](specification/embedded-dashboard.md),
  beside `surfaces.dashboard`. No existing field, schema or rule changes.
- **Decision:** A dashboard page and the host that shows it make each other promises about width,
  navigation, scrolling and appearance (ED-1…ED-10):
  - the page is fully usable from **360 CSS pixels** (or the larger floor it declares) with no
    document-level horizontal scroll, keeps its floor layout and scrolls sideways below it, keeps
    every primary destination reachable without sideways scrolling, scrolls wide content in its own
    marked box, has one vertical scroller and sticky chrome of at most 120 px or a quarter of the
    viewport (ED-1…ED-5);
  - the page follows `prefers-color-scheme`, and the host's cookie `fabric_appearance`
    (`v=1&scheme=…&theme=…`) when present, hiding its own appearance controls then (ED-6, ED-8);
  - a host gives every dashboard at least **`max(480, minWidth)`** CSS pixels when its window allows,
    shrinking its own panes first, and never zooms a page to fit (ED-7);
  - a service declares conformance in its well-known `extensions` under the new key
    `https://fabric.passioncode.ai/agent-contract/extensions/dashboard/0.1`, with `minWidth` and
    optionally `appearance`, `themes` and `kit` (ED-9, `service-dashboard-extension.schema.json`);
  - the reference themes are `graphite` (default), `fabric`, `paper`, `forest`, `ocean`, `ember`
    and `contrast`, each light and dark, each WCAG 2.2 AA (ED-10).
- **Why:** On 2026-10-11 the operator showed an agent dashboard inside Fabric Dashboards with the
  agent console open beside it: the page narrowed until its navigation disappeared. Measured: the
  host's console may take half the window and nothing protects the page (Fabric Dashboards
  `src/renderer/App.tsx` clamps the console to `floor(innerWidth/2)`, `src/core/types.ts`
  `CONSOLE_WIDTH`), so at the 960 px minimum window with the sidebar open the page gets 240 px. The
  sample agent's board, measured in WebKit, showed 4 of its 14 navigation links at 380 px, the rest
  behind a sideways scroll with no visible scrollbar, and a document 410 px wide in a 380 px view.
  `fabric-service/0.1` named the dashboard surface but said nothing about how a page behaves inside
  a host, so every agent solved it differently or not at all. The colour scheme already reached
  pages through `prefers-color-scheme`; a theme had no carrier, and the operator asked for themes
  to choose from.
- **Compatibility:** Additive under DEC-0016. `contractVersion` stays `0.1.0`. The declaration lives
  in `extensions`, which every reader already preserves and ignores, so a host or a service built
  before this decision is unaffected; `service-well-known.schema.json` is unchanged. A dashboard that
  does not declare the key is a legacy dashboard: the host floor still protects it. No semantic rule
  code is allocated; the rules are measured on a rendered page by the adapter's tools.
- **Consequences / affects:**
  - spec: `docs/specification/embedded-dashboard.md` (new), `docs/specification/service.md`
    (*Well-known document*, *Surfaces*);
  - schema: `schemas/service-dashboard-extension.schema.json` (new);
  - code: `src/extensions.ts` (the `dashboard` key, G-08);
  - fixtures: `fixtures/positive/service-dashboard-extension.json`,
    `fixtures/positive/service-dashboard-extension-minimal.json`,
    `fixtures/positive/service-well-known-dashboard.json`,
    `fixtures/negative/service-dashboard-extension-{below-floor,bad-theme,unknown-field}.json`,
    `fixtures/catalogue.json`;
  - tests: `test/embedded-dashboard.test.ts`, `test/consistency.test.ts` (G-08);
  - docs: `CONTEXT.md` (dashboard floor, appearance carrier), `docs/DOCMAP.md`, `README.md`, the
    handoff `docs/handoffs/2026-10-11-embedded-dashboard.md`.

  Consumers: Fabric Dashboards (ED-7 host floor, ED-8 carrier and its picker), the
  fabric-agent-adapter (the dashboard kit, its layout check and the upgrade notice), and every
  service with a dashboard. The adapter pin follows the merge commit of this change.
- **Not decided here:** the host's picker screen and per-service choices; operator-defined colours
  beyond a theme id; dashboards with a fixed width or several panes of their own; zoom.
- **Source:** operator request, 2026-10-11, and the measurements above. DEC-0036 was reserved by git
  CAS (`agent_sync.py reserve DEC --key embedded-dashboard`); this file was edited under the git
  lease `docs/DECISIONS.md`; the record plane is `fs`, as `AGENTS.md` describes.

### DEC-0037 — Spend policy and grants with amounts: agents check a record instead of asking

- **Date:** 2026-10-11
- **Status:** Accepted source change. Consumer adoption: the registry and `grant check` (Project
  Observatory), the project policy and presets at launch (Fabric), project pool ceilings and grant ids in
  usage (Switchboard), and showing policies, grants and requests (Fabric Dashboards).
- **Annotated (2026-10-12):** `modelClasses` closed to a vocabulary, and how a policy's classes restrict a launch, by
  DEC-0046.
- **Annotated (2026-10-13):** DEC-0082: a share grant into an organization carries that organization's `context`, never `personal` (`FAC-SEM-110`); its usage reaches the organization as a daily `grant.usage` activity event keyed by the grant's id and built from the meter's settled receipts (a service's `byGrant` row only when it lists receipts the meter holds none of and covers one UTC day) (`docs/specification/contexts.md#usage-per-grant`).
- **Decision:**
  - **Four levels, the most specific deciding:**
    - L0 estate total across all provider keys;
    - L1 project policy;
    - L2 task presets;
    - L3 per call.
  - **A project's policy is chosen once, at its first paid run, from options computed for that project.**
    The inputs are the agents' `costPresets`, the recent spend from usage reports, and the kind of work.
    They are kept beside the choice. "No project limit" is a recorded `mode`, never a missing value.
  - **Grants carry an amount.** A standing grant's optional `spend` block holds `limitUsd`, `period`,
    `perCallMaxUsd`, `autoApproveUsd`, `payer` and `credentialSource`. A new `principalKind: external`
    marks a share grant to a person or organization outside the estate.
  - **The proof is a check, not a question.** The registry answers a `grant-check` document:
    - `allowed` comes with a receipt, the grant, and a **reservation** (`reservedUsd` until `expiresAt`), so
      that concurrent checks cannot together overrun a limit. Spend settles against the receipt (`byGrant`
      lists the receipts), and an unsettled reservation lapses.
    - `denied` comes with a `code` (why) and a `level` (where; `null` when no level was reached) and, where
      allowed, the durable approval request it filed.

    An unknown state is a denial.
  - **Three rules:**
    - a credential source is the project's own key or another agent's capability, never another agent's
      key;
    - a principal is proven by a credential the registry issued (a per-session token minted at session
      start, owner-only, revoked at session end, with a maximum age), never by a label the caller supplies.
      It stops accidental and confused borrowing, not a hostile process of the same OS account;
    - an approval is a durable request answered through the operator channel's confirm token and never
      blocks the agent; a chat or cross-session message is not an approval.
  - **Usage reports may attribute spend per grant** (`byGrant`). `FAC-SEM-047` keeps a policy consistent with
    what was offered.
- **Why:** Agents kept asking the person to approve spend or to prove an earlier approval. The limits
  were scattered:
  - each upstream key had its own ceiling, and nothing totalled them;
  - each service reported its own budgets (DEC-0021, DEC-0027);
  - standing grants had no amount field, although governance-and-roles required amount limits.

  Nothing said whether one agent may spend another agent's key. Approvals sent as messages could expire
  undelivered while the sender waited.
- **Compatibility:** The change is additive. Two new schemas (`spend-policy`, `grant-check`) and optional
  fields (`spend`, `principalKind`, `costPresets`, `byGrant`); every existing document stays valid.
  `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - `schemas/spend-policy.schema.json` and `schemas/grant-check.schema.json` are new;
  - `governance`, `manifest` and `service-usage` schemas gain the optional fields;
  - `src/spend-rules.ts` (`FAC-SEM-047`), `docs/specification/spend-policy.md`, and the
    governance-and-roles amount line;
  - fixtures: 7 positive, 6 negative, 3 semantic.
- **Not decided here:**
  - the estate total's value and the price of any upstream call: the operator's configuration, not the
    contract;
  - who pays by default for a share grant;
  - settlement between estates (the commerce draft).
- **Source:** proposed by the Fabric Dashboards session (FD-40 brief) after the operator's request of
  2026-10-11. The registry side is reviewed by the Project Observatory session. DEC-0037 and FAC-SEM-047 are
  reserved by git CAS (`agent_sync.py reserve DEC|SEM --key spend-policy-20261011`), and this file was
  edited under the git lease. The Project Observatory session's review (2026-10-11) added the denial `code`,
  the reservation and the token's boundary.

### DEC-0038 — Grant limits: unlimited, or several windows at once (total, task, project, day, week, month); the owner pays

- **Date:** 2026-10-11
- **Status:** Accepted source change, amending DEC-0037 before any consumer adopted it.
- **Amends:** DEC-0037. The standing grant's `spend` block.
- **Decision:**
  - A grant's `spend` is `mode: unlimited` or `mode: limited`. A limited grant carries one or more `limits`,
    each `{window, limitUsd}`.
    - The windows are `total` (the grant's life), `task`, `project`, `day`, `week` and `month` (calendar
      windows in UTC).
    - Several windows apply together, and the first one reached stops the spend.
  - An unlimited grant is still stopped by the estate total (L0).
  - `payer` is `owner`: the agent's owner pays, also for a share grant to someone outside the estate.
  - `FAC-SEM-048`: each window appears once, and neither `perCallMaxUsd` nor `autoApproveUsd` exceeds the
    smallest window.
- **Why:** The operator decided on 2026-10-11 that the owner pays and that access is given with a limit or
  without one. A limit can be on the total, a task, a project, a month, a day or a week. DEC-0037's single
  `limitUsd` with one `period` could not express a weekly window, a project window, several windows at once,
  or an unlimited grant.
- **Compatibility:** It replaces DEC-0037's `limitUsd`/`period` in the grant's `spend` with `mode`/`limits`
  the same day. No producer or reader of DEC-0037 existed yet. `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - `schemas/governance.schema.json` (`spend`);
  - `src/spend-rules.ts` (`grantSpendRules`) and `src/semantic-rules.ts` (kind `grant-spend`);
  - `docs/specification/spend-policy.md` §Grants;
  - fixtures: an unlimited grant, a limited grant with all six windows, a missing `limits`, a `guest`
    payer, and two semantic refusals.
- **Source:** the operator, 2026-10-11, in their words: «да платит владелец, доступ выдается по лимиту
  либо анлим, лимит тотал, на задачу, на проект, в месяц, в день, в неделю». Drafted by the Fabric
  Dashboards session. DEC-0038 and FAC-SEM-048 are reserved by git CAS (`--key grant-windows-20261011`).

### DEC-0039 — Delegation: the estate hub signs who acts for whom, the callee checks it offline, one approval document and one set of refusal codes (`fabric-delegation/0.1`)

- **Date:** 2026-10-11
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: the issuer (Fabric 0.4.0
  REQ-37), the meter (Project Observatory), then each callee and caller in the order of Fabric's
  [adoption plan](https://github.com/passioncode-ai/fabric/blob/agent/release-040-wave1/docs/evidence/plans/2026-10-11-delegation-model/README.md).
- **Annotated (2026-10-11):** tightens the service's operator-session lifetime (12 hours after last use, 7 days after sign-in): not additive for that rule, so a kit's longer cookie stops conforming at its next pin (ruled with Fabric's session, ADR-0144's owner, 2026-10-11).
- **Annotated (2026-10-12):** amended by DEC-0045 (one grant per token, the meter's hop, no `device` approval, the meter's refusal wire, a mandatory issuer, a strict verifier, trust tiers T0/T1/T2).
- **Annotated (2026-10-13):** amended by DEC-0082: a standing grant gains an optional `context` (`personal` or `org:<orgId>`), never `personal` for `principalKind: external` (`FAC-SEM-110`); a grant's access level stays its own fields (`docs/specification/contexts.md`).
- **Amends:** interop C3.5 (the hub is the only issuer, not the only route); DEC-0024 additively
  (`surfaces.mcp.auth: "delegation"`); DEC-0037 (the registry's per-session token is the hub's delegation
  token; its grant-check codes become a subset of one code set); DEC-0037's L0 wording; DEC-0038's grant gains
  three optional fields. Implements Fabric
  [ADR-0144](https://github.com/passioncode-ai/fabric/blob/agent/release-040-wave1/docs/adr/0144-one-delegation-model-fabric-issues-the-chain-the-callee-checks-it-observatory-meters-it.md).
- **Decision:** the profile [delegation](specification/delegation.md), DL-1…DL-22:
  - **The delegation token** is a JWT (RFC 7519) signed by the estate hub with Ed25519 (`alg: EdDSA`, RFC 8037),
    header `typ: fabric-delegation+jwt` and a `kid`, in the shape of RFC 8693: `iss` the hub, `sub` the person,
    `act` the actor chain (outermost the agent calling now, at most four deep), `aud` exactly one callee as a
    string, `scope` the callee's capability names space-delimited, `effect` the ceiling, `grant` the grant
    references, optional `spend` (remaining per window at mint) and `project`, `exp` at most 600 s after `iat`,
    `jti` (DL-1, DL-2; `delegation-token.schema.json`).
  - **The effect ceiling** is a set of governance effect classes: `none` is below every class, `draft` below
    every external one, and the external classes are not ordered against each other (DL-3).
  - **Attenuation is the issuer's**: a token is minted within a delegation grant — its `grant` claim names it as
    `<meta.id>#<meta.revision>`; it is minted no earlier than the grant starts; it carries the grant's project;
    it is limited under a limited grant; and its outermost actor is the agent the grant's principal names
    (`urn:agent:<agent id>`, or `urn:session:<agent id>:<session id>`), for the person who issued the grant
    (the outside person under a share grant). An onward token keeps the parent's issuer, principal and project,
    adds the parent's audience as its outermost actor to the parent's chain, and carries no wider effect, no
    later expiry and no more remaining spend (DL-4…DL-8, `FAC-SEM-050`).
  - **Carrying it**: `Authorization: Bearer` on a direct call; `Fabric-Delegation` on a call the hub forwards
    with the product's own credential; never in a URL, argv, arguments, log or usage report. The descriptor
    token is the host's and is not presented to call a capability (DL-9…DL-12).
  - **The verifier** checks, offline and in a fixed order, the key set, the header, the key, the signature, the
    claims, the lifetime, the 60 s leeway, the audience, the depth, the scope and the effect (DL-13). It refuses
    a JSON member named twice, a key published for another `use` or `alg`, an `nbf` in the future, and a `kid`
    published twice (the issuer's fault: `issuer-unavailable`). A read-only door refuses any capability that is
    not `effect: none` (DL-3). The kit ships `verifyDelegation` and `verifyApproval` in `src/delegation.ts`, on
    Node's built-in Ed25519.
  - **Keys**: a JWK Set of Ed25519 public keys (`delegation-jwks.schema.json`); the previous key stays published
    one token lifetime plus the leeway after its last token, and 24 hours plus the leeway after its last
    approval (DL-14, DL-15). A service declares acceptance with well-known `auth.delegation: {issuer, jwks}`
    (DL-16).
  - **`approval/1`**: a JWS by the estate key (`typ: fabric-approval+jwt`) over `iss`, `actionDigest` (SHA-256
    of the RFC 8785 canonical action), `aud`, `approver`, `method` (`prompt`, `operator-channel`, `device`),
    `iat`, `exp` at most 24 h after, and a `jti` consumed once; `approval-required` carries the digest (DL-17,
    DL-18; `approval.schema.json`, `FAC-SEM-051`). The action is JSON values only: `jcs` refuses a date, a map
    or a class instance. The jti store is required; the order is the token, the grant check, then the approval
    (consuming its `jti`), then the action.
  - **One refusal-code set** of seventeen codes in `error.code`, detail in `error.data`
    (`delegation-refusal.schema.json`), for authorisation refusals only: `limit-reached` carries its window
    (also in a denied grant check), `approval-required` its digest. Fabric's hub maps `hub-unavailable`,
    `binding-revoked`, `access-required` and `needs-grant`; transport and product errors keep the interop error
    shape (DL-19).
  - **The grant** gains `audience`, `capabilities` and `effectCeiling`; a grant with `audience` is a delegation
    grant and then requires the other two and `principalKind`, and may omit `effects` (reads and drafts only;
    a read-only grant has `effectCeiling: ["none"]`) (DL-20).
  - **The meter** is proven to by an onward token the callee obtains from the hub: `aud` the meter, the callee
    added to the chain, `scope` the grant-check capability, `effect: none`, the same grant, presented in
    `Authorization: Bearer`; the request (`grant-check-request.schema.json`) carries the amount and the callee's
    own `jti`. The meter verifies the token and answers any refusal as `principal-unproven` (DL-21,
    `verifyMeterToken`). This replaces DEC-0037's per-session registry credential.
  - **L0** is the estate total and each provider key's own ceiling; usage `byGrant` stays opaque and no caller
    identity enters a usage report (DL-21, DL-22).
  - **The operator's dashboard session** ends 12 h after its last use, 7 days after sign-in, on logout and on
    the descriptor token's rotation; a service may shorten, never lengthen (`service.md`,
    `src/operator-session.ts`).
- **Why:** Fabric's roll call of 25 sessions on 2026-10-11 measured fifteen ways a caller obtains a credential,
  thirteen grant stores, ten approval formats and about eighteen refusal-code sets with no two overlapping
  (ADR-0144 §Context). No contract schema carried a caller, a chain or a grant toward a callee, so a callee
  could not tell callers apart and a limit could not hold per calling agent. Three agents called a service with
  that service's own descriptor token, which can also mint operator login codes.
- **Choices ADR-0144 left open, made here:** `scope` is the RFC 8693 space-delimited string, not an array; the
  effect ceiling is a set with a `none`/`draft` floor rather than a total order, so `delete` never implies
  `charge`; the chain's members are agent ids with an optional `session`; the child's scope is checked against
  its own grant, because the parent's scope names another callee's capabilities; `typ` values separate a token
  from an approval; an approval carries `iss`; key rotation covers the approval's 24 hours, not only a token's
  10 minutes; unknown claims are refused by the schema (the issuer's conformance) and ignored by the verifier
  (RFC 7519 §4).
- **Compatibility:** Additive under DEC-0016; `contractVersion` stays `0.1.0`. Six new schemas (with
  DEC-0040's `fabric-link`, 66 in all); a denied grant check with `limit-reached` now names its `window`, a
  same-day change to DEC-0037's shape that no consumer had adopted; `audience`, `capabilities`, `effectCeiling` optional on a grant, so
  every existing grant stays valid; `auth` optional in the well-known document; `delegation` a new value of
  `surfaces.mcp.auth`. A caller using `agent.call` is unaffected. Nothing changes on the wire before Fabric's
  issuer exists.
- **Consequences / affects:**
  - spec: `docs/specification/delegation.md` (new), `docs/specification/interop.md` (C3.5 amendment),
    `docs/specification/service.md` (well-known `auth.delegation`, usage `byGrant`, the session's lifetime,
    MCP delegation tokens), `docs/specification/spend-policy.md` (L0, the principal's credential, the code set),
    `docs/specification/governance-and-roles.md`, `docs/specification/conformance.md` (`FAC-SEM-049`…`051`, a
    reader row);
  - schemas: `delegation-token`, `delegation-jwks`, `approval`, `delegation-refusal`, `grant-check-request`
    (new); `common.schema.json` (`agentId`, now referenced by `interop-agent-call`, `delegation-token`,
    `approval`, `governance` and `fabric-link`), `governance.schema.json`, `grant-check.schema.json` (`window`,
    the L0 description), `service-well-known.schema.json`;
  - code: `src/delegation.ts`, `src/delegation-rules.ts`, `src/operator-session.ts`, `src/semantic-rules.ts`;
  - fixtures: 11 positive, 14 negative, 14 semantic, `fixtures/catalogue.json`; `grant-check-denied.json` gains
    its `window`;
  - tests: `test/delegation.test.ts`, `test/delegation-seams.test.ts`, `test/capability-names.test.ts`,
    `test/schema-compilation.test.ts` (66 schemas);
  - docs: `CONTEXT.md`, `docs/DOCMAP.md`, `README.md`, `docs/evidence/sources.md` (RFC 3986, 6750, 7515, 7517,
    7519, 7662, 8037, 8693, 8725, 8785), the handoff `docs/handoffs/2026-10-11-delegation-and-fabric-button.md`.

  Consumers: Fabric (the issuer), Project Observatory (the meter), Fabric Dashboards, and every agent named in
  the adoption plan; the fabric-agent-adapter ports the verifier to its kits and repins to this change's merge
  commit.
- **Not decided here:** the hub's mint, introspection and approval-request tools; how the hub proves a caller;
  delegation across estates; proof of possession.
- **Source:** Fabric ADR-0144 (CO-258, release 0.4.0 REQ-37), the operator's instruction of 2026-10-11 relayed to
  Fabric. DEC-0039 and `FAC-SEM-049`…`051` were reserved by git CAS (`agent_sync.py reserve --key
  delegation-20261011 DEC`, `--key delegation-claims-20261011 SEM` and its siblings); this file and
  `conformance.md` were edited under git leases; the record plane is `fs`, as `AGENTS.md` describes. Written by
  Fabric's session; the contract has no live owner session. A blind seam review of the pull request
  (2026-10-11) added the meter's onward token and the grant-check request, the full DL-4 check, JSON-only
  `jcs`, the present-but-empty `Fabric-Delegation` refusal, the required jti store, the verifier's closed
  leniencies, the read-only door and grant, and one `agentId` definition.

### DEC-0040 — Fabric's button in every product and `fabric://` links

- **Date:** 2026-10-11
- **Status:** Accepted source change (on merge of its pull request). FB-3's name, FB-4's items and FB-5's sentence amended by DEC-0124 (2026-10-26): in the page's language, the sentence without a dash. Consumer adoption: Fabric (the link
  handler), Fabric Dashboards (the first host, FD-45), the fabric-agent-adapter's dashboard kit (the component).
- **Annotated (2026-10-12):** FB-6's cookie scope amended by DEC-0059 (per host in a shared cookie store, per service
  where the host gives each service its own store).
- **Decision:** the profile [Fabric's button](specification/fabric-button.md):
  - a dashboard MAY show one floating button, bottom-right, labelled with the Fabric mark and **Fabric**,
    accessible name **Open Fabric**, at least 44 × 44 CSS px, opening a menu of a chat and, when the page knows
    its project, a coding session (FB-1…FB-4);
  - when Fabric is absent the menu says exactly "Fabric is not installed — get it at passioncode.ai/fabric",
    known from the host's `fabric_button` cookie (`v=1&owner=host|page&fabric=present|absent`), a local
    service's own check, or a 1 500 ms test (FB-5, FB-6);
  - the dashboard kit ships the component (FB-7); a press opens a view and never sends, starts or spends (FB-8);
  - `fabric://chat?service=<agent id>&project=<id or slug>` and
    `fabric://session/new?project=<id or slug>[&runner=<runner kind>]`; unknown parameters ignored, known ones
    validated, a repeated or invalid one, a missing required one or an unknown action refuses the whole link;
    a parameter that could carry a credential (in any case style) or words to act on (`prompt`, `message`,
    `text`, `instruction`), or a credential in the fragment, refuses it too (FL-1…FL-6, `FAC-SEM-052`);
  - Fabric opens a product back through `fabric-dashboards://service/<id>.<instance>?path=…` or the service's
    own address, never with a token or a login code (FL-7).
- **Why:** The operator asked on 2026-10-11 for Fabric's button in every product (Fabric 0.4.0 REQ-42), so a
  person in any agent's dashboard reaches Fabric — the manager conversation or a coding session — on that
  product in one press. The kit already ships UI (the dashboard kit of DEC-0036), so the contract states the
  element and the link grammar and the kit ships one component.
- **Compatibility:** Additive; `contractVersion` stays `0.1.0`. One new schema (`fabric-link`), one rule
  (`FAC-SEM-052`). No existing document changes; `fabric_appearance` is unchanged.
- **Consequences / affects:**
  - spec: `docs/specification/fabric-button.md` (new), `docs/specification/conformance.md` (`FAC-SEM-052`, a
    reader row);
  - schema: `schemas/fabric-link.schema.json`; code: `src/fabric-links.ts`, `src/semantic-rules.ts`;
  - fixtures: `fixtures/positive/fabric-link-{chat,session}.json`,
    `fixtures/negative/fabric-link-{session-without-project,chat-with-token}.json`,
    `fixtures/semantic/deep-link-*.json` (with a prompt, a camelCase token and a credential in the fragment),
    `fixtures/catalogue.json`;
  - tests: `test/fabric-button.test.ts`;
  - docs: `CONTEXT.md` (Fabric's button, Fabric link), `docs/DOCMAP.md`, `README.md`, `docs/ux/` (JTBD-06,
    JRN-05, ST-011, FLW-09, SCR-12, SCN-015), the handoff `docs/handoffs/2026-10-11-delegation-and-fabric-button.md`.
- **Not decided here:** a prefilled message; links to other Fabric views; a per-service choice to hide the
  button; links followed on a phone.
- **Source:** the operator, 2026-10-11 (Fabric 0.4.0 REQ-42); Fabric Dashboards session fabric-dashboards-76,
  row FD-45. DEC-0040 and `FAC-SEM-052` were reserved by git CAS (`--key fabric-button-20261011`,
  `--key deep-link-20261011`); edited under the same leases as DEC-0039.

### DEC-0041 — The meter reads the hub's grant projection; the `call` window; an optional `task` claim; fabric:// credential names by whole word

- **Date:** 2026-10-11
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: the hub's projection and
  the `task` claim (Fabric 0.4.0 REQ-37), the meter's read and its task key (Project Observatory, OBS-55), the
  link reader (Fabric, Fabric Dashboards FD-45, the fabric-agent-adapter's dashboard kit).
- **Amends:** DEC-0039 additively (DL-23, DL-24; the token's `task`; `window: call`); DEC-0040's FL-4 (how a
  credential name is matched). Implements Fabric
  [ADR-0144 amendment 1](https://github.com/passioncode-ai/fabric/blob/92cb5124e4f9e8db2314acf439e4a1f903541cc2/docs/adr/0144-one-delegation-model-fabric-issues-the-chain-the-callee-checks-it-observatory-meters-it.md#amendment-1--2026-10-11-how-the-meter-reads-a-grant-the-call-and-task-windows)
  and, for the `task` window's key, [amendment 2](https://github.com/passioncode-ai/fabric/blob/217aff4dfbd6989122fc9135cc362d904d1ec838/docs/adr/0144-one-delegation-model-fabric-issues-the-chain-the-callee-checks-it-observatory-meters-it.md#amendment-2--2026-10-11-the-task-windows-key-a-vault-slot-released-under-a-grant),
  which replaces amendment 1's sentence on that key.
- **Decision:**
  - **The `call` window.** Exceeding a grant's `perCallMaxUsd` is `limit-reached` with window `call`, always at
    level L3, in a denied grant check (`grant-check.schema.json`) and in a refusal
    (`delegation-refusal.schema.json`); the schemas bind `call` to `L3`. It is a refusal window, not a grant limit
    window: a grant's `limits` and a token's remaining `spend` stay `total`, `task`, `project`, `day`, `week` and
    `month` ([spend policy](specification/spend-policy.md#grants), [delegation](specification/delegation.md#refusal-codes) DL-19).
  - **The `task` claim.** A delegation token MAY carry `task`, the issuing host's task the work runs under, set by
    the hub when the session or run has one: an opaque id in the session id's grammar (`^[A-Za-z0-9._:-]{1,128}$`).
    The verifier types it like any claim (`malformed-claims`). An onward token keeps the parent's `task` or none,
    never another, and a token for the meter keeps it (`FAC-SEM-050`, DL-5). The meter keys a grant's `task`
    window on the onward token's `task`; else on the first `session` met walking the meter token's actor chain
    from its outermost actor (`act`, then `act.act`, …: the callee's own session, else its caller's, and so on);
    else on the grant itself (`grant:<ref>`), one window for all the grant's spend. Never on a `jti`: the
    request's `tokenJti` is unsigned and only attributes the spend, and every onward token has a fresh `jti`, so
    either would let a callee open a new window with each check and pass the L2 limit. This is ADR-0144
    amendment 2, which makes the chain walk canonical and the grant the fallback (`taskWindowKey(claims,
    grantRef)` in `src/delegation.ts`, which throws for a reference the token does not name).
  - **The hub's grant projection** — the contract's local-placement profile of the meter's read (DL-23, DL-24): a
    hub MAY project each grant it holds, in the standing-grant shape at its latest revision with its state, to
    `<grantsDir>/<meta.id>.json`, the directory named `grantsDir` in its hub document, 0600 in 0700, written
    atomically on every issue, revision, revocation and expiry. After verifying the onward token the meter reads
    the grant each `grant` reference `<meta.id>#<meta.revision>` names and MUST deny, with `level: null`: a missing
    file or a later revision `no-grant`; `revoked` `grant-revoked`; `expired`, or past `expiresAt`, `grant-expired`;
    no directory, an unreadable, malformed, loosely permitted or misnamed file, an earlier revision or an unknown
    state `unknown-state`. Malformed is checked against the standing-grant schema (the state left to its own
    rows), and `startsAt`/`expiresAt` must be RFC 3339 with `Z` or a numeric offset. The meter opens the file once
    (`O_NOFOLLOW | O_NONBLOCK`) and checks what it opened, so a link or a FIFO swapped in is refused and never
    blocks. The hub projects only ids matching `PROJECTED_GRANT_ID`, never two that differ only in case; the meter
    answers `no-grant` for any other id. The profile is POSIX-only in 0.1: on Windows the meter answers
    `unknown-state` (`unsupported-platform`) before reading. The file authorises nothing without the verified
    onward token. The kit ships `readProjectedGrant(grantsDir, ref, {now, platform})` and `projectionDenial` in
    `src/grant-projection.ts`, on Node's built-in `fs`.
  - **fabric:// credential names (Fabric CO-260 (1)).** A parameter name is split into words (at `.`, `_`, `-`
    and camelCase humps; a word ending in `s` also counts as its singular) and a credential word must be a whole
    word: `token`, `secret`, `password`, `passwd`, `pass`, `passphrase`, `credential(s)`, `cookie`,
    `authorization`, `bearer`, `jwt`, `otp`, `apikey`, `signature`, `sig` and the glued forms (`accesstoken`,
    `idtoken`, `authtoken`, `refreshtoken`, `sessionid`, `sessiontoken`, `logincode`, `authcode`, `privatekey`,
    `clientsecret`, `secretkey`, `accesskey`) always; `key` with `private`, `api`, `access`, `secret`, `session`,
    `auth`, `signing`, `encryption`, `master`, `client`, `login` or `refresh`; `auth` with `token`, `code` or
    `header`; `session` with `token` or `id`; `code` with `login`, `auth`, `access` or `session`; and each of these
    four alone. So `themeCode`, `sortKey`, `passage`, `signal` and a `#auth-settings` anchor pass, and
    `authToken`, `refreshToken`, `clientSecret`, `privateKey`, `apiKeys`, `X-Amz-Signature`, `token`, `key`,
    `secret` and `password` are refused. A JWT anywhere in a value or the fragment is refused, as is a provider
    key's shape and a long secret (40 or more base64 or base64url characters mixing upper case, lower case and
    digits), checked on each value as decoded and as written with a raw `+` kept. A fragment piece is refused by
    its name only when it carries a value (FL-4, `FAC-SEM-052`).
- **Why:** Project Observatory's session asked, while building the meter (OBS-55), how it reads a grant the hub
  holds, what a per-call refusal names as its window, and what the `task` window counts. Fabric decided all three
  in ADR-0144 amendment 1; a hub read capability was rejected because the meter would then deny every check while
  Fabric is closed, even within a token's lifetime. The review of this decision (PR #32) found amendment 1's
  fallback to the request's `tokenJti` let a callee pass the L2 limit; Fabric replaced it in amendment 2. CO-260 (1), Fabric's carry-over from the DEC-0040 review: the
  link rule refused harmless names that merely contain a credential word (`themeCode`, `sortKey`,
  `#auth-settings`).
- **Compatibility:** Additive; `contractVersion` stays `0.1.0`. `call` is a new value of two `window` enums, `task`
  a new optional claim, the projection a MAY of the hub. Every existing document stays valid. FL-4 now admits
  exactly two kinds of link it refused before: a name whose only credential word is `key`, `code` or `auth` with
  no partner beside it (`themeCode`, `sortKey`, `countryCode`, `authSettings`, `authId`, `userKey`), and a
  credential-named fragment piece with no value (`#token`, `#auth-settings`). Every other link refused on `main`
  is still refused (compared over 3 552 generated names, with the review's list: `accesstoken`, `idtoken`,
  `sessionid`, `logincode`, `sig`, `signature`, `X-Amz-Signature`, `pass`, `sessionKey`, `authKey` and
  `signingKey` stay refused), and 383 names `main` admitted are now refused (`authtoken`, `privatekey`,
  `clientsecret`, `apiKeys`, `secrets`, `APIKey`). Values are refused more often too: a long run now counts `-`
  and a raw `+`, so a mixed-case value of 40 or more characters with digits and hyphens (a long `project` slug
  such as `Q2-Launch-Plan-For-Team-Alpha-Version-3-Draft`) is refused where `main` admitted it.
- **Consequences / affects:**
  - spec: `docs/specification/delegation.md` (DL-2 `task`, DL-5, DL-19, DL-21 step 4, DL-23, DL-24, `FAC-SEM-050`),
    `docs/specification/spend-policy.md` (L3, the `task` and `call` windows, the projection),
    `docs/specification/fabric-button.md` (FL-4), `docs/specification/conformance.md` (a reader row);
  - schemas: `grant-check`, `delegation-refusal`, `delegation-token`;
  - code: `src/grant-projection.ts` (new), `src/delegation.ts` (`task`, `OPAQUE_ID`, `taskWindowKey`),
    `src/contract.ts` (`loadSchemasSync`), `src/validator.ts` (`createValidatorSync`),
    `src/delegation-rules.ts` (`FAC-SEM-050`), `src/fabric-links.ts` (`nameWords`, `credentialName`,
    `CREDENTIAL_WORDS`, `CREDENTIAL_PAIRS`, `PROMPT_WORDS`, `JWT_SHAPE`, `SECRET_VALUE`, `secretValue`);
  - fixtures: 3 positive, 4 negative, 6 semantic, `fixtures/catalogue.json`;
  - tests: `test/meter-grant.test.ts`;
  - docs: `CONTEXT.md` (Grant projection, Task claim), `docs/DOCMAP.md`, the handoff
    `docs/handoffs/2026-10-11-meter-grant-read.md`.
- **Not decided here:** the projection on Windows; a meter that does not run beside the hub; the format of the hub
  document beyond `grantsDir` (Fabric's); how the meter stores reservations per window.
- **Source:** Fabric ADR-0144 amendment 1 (2026-10-11), asked by project-observatory-3d, and amendment 2
  (2026-10-11), asked by this decision's review and by project-observatory-3d (OBS-57); CO-260 (1). DEC-0041 was
  reserved by git CAS (`--key meter-grant-read-20261011`); this file and `conformance.md` were edited under git
  leases; no new rule code (`FAC-SEM-050` and `FAC-SEM-052` are extended). Written by a Fabric session.

### DEC-0042 — `session-handoff/1`: the folder a host hands a coding-agent session

- **Date:** 2026-10-11
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: Fabric (the reference
  writer, `sessionBundle.ts`, release 0.4.0 REQ-06), Fabric Dashboards (its console pack, `src/core/handoff.ts`),
  Switchboard (carries the arguments in place).
- **Decision:** the profile [session handoff](specification/session-handoff.md), one format for every product:
  - a folder in the writing host's user data, never in a repository, `0700` with every file `0600`, holding
    `handoff.json` (the manifest, `schemas/session-handoff.schema.json`), `context.md`, `mcp.json` and, as
    declared, `brief.md` and `task.md` — nothing else (SH-1…SH-4);
  - fixed: the preamble names exactly one first tool and holds no rule — `fabric_whoami` on `fabric`,
    `service_context` on `fabric-dashboards` (SH-6, SH-7); Claude Code gets the joined
    `--mcp-config=<folder>/mcp.json`, which closes its variadic list (SH-11);
  - declared, not forced: `lifetime` (per session or per agent key; a bearer only per session, SH-5),
    `mcp.auth` (`bearer`, a one-shot token over HTTP, or `none`, a stdio command with no secret, SH-9),
    `mcp.strict` (SH-11), `brief.delivery` (inline in one argument of at most 1000 characters and no control
    character, or `brief.md`, SH-8);
  - the launch's limits (at most 16 arguments of at most 1024 characters, no control character, no credential;
    a credential-carrying variable recorded as `null`, SH-10) and the per-runtime table for `claude-code`,
    `codex`, `kilo`, `hermes`, `kimi-code` and `cline` (SH-11);
  - Fabric's `execution-packet/1` stays underneath: `integrity` names it and the digest of each file materialised
    there (SH-12); a secret lives in `mcp.json` only (SH-13);
  - the kit's checker `validateSessionHandoff(dir)` (`src/session-handoff.ts`), dependency-free so a consumer can
    copy it and run it on its own folders; `FAC-SEM-053`…`055`.
- **Why:** Fabric hands a session a per-session bundle; Dashboards' consoles hand a pack of their own, persistent
  per agent key, with a stdio `mcp.json`, its own brief and no `--strict-mcp-config`. The knowledge base asks for
  one format across products (principle 8), and a Fabric agent opened in Dashboards' console and a Dashboards
  agent opened from Fabric should carry the same pack. The name `execution-packet/1` already meant Fabric's
  integrity manifest and task-pipeline's dispatch packet, so the format has its own (Fabric 0.4.0 resolution R-01).
- **Compatibility:** Additive; `contractVersion` stays `0.1.0`. One new schema (67), three rules. One existing
  example changes: the runner catalogue's `claude-headless` drive in `runners.md` and its fixtures now join
  `--mcp-config={mcpConfig}`, the form SH-11 requires (the spaced form leaves the option's value list open).
  SH-9 admits on a server other than the first call's only a delegation token minted for the session: Fabric's
  gateway servers with a role key (`x-agw-key`) do not conform. Ruled strict by Fabric's session on 2026-10-11,
  because the machine gateway they name was retired on 2026-09-14 and ADR-0144 removes the path. Fabric drops the
  gateway servers and `FABRIC_AGW_KEY` from its bundle, and product MCP in a session goes by delegation token under
  the project's grant (REQ-04). Fabric's bundle changes in the same release: the joined `--mcp-config=`, `handoff.json`, a
  `context.md` always (a note when the pack could not be compiled), a brief over 1000 characters or of more than
  one line as `brief.md`. Dashboards' pack changes as its handoff lists.
- **Consequences / affects:**
  - spec: `docs/specification/session-handoff.md` (new), `docs/specification/conformance.md` (`FAC-SEM-053`…`055`,
    a reader row);
  - schema: `schemas/session-handoff.schema.json`; code: `src/session-handoff.ts`, `src/semantic-rules.ts`;
  - fixtures: 6 positive, 9 negative, 19 semantic (`session-handoff-*`, `session-handoff-folder-*`),
    `fixtures/catalogue.json`;
  - tests: `test/session-handoff.test.ts`, `test/session-handoff-review.test.ts` (one case per rule message, the
    reader, the copied credential matcher), `test/schema-compilation.test.ts` (67 schemas);
  - the runner catalogue example: `docs/specification/runners.md`, `fixtures/*/runners-*.json` (joined
    `--mcp-config=`);
  - docs: `CONTEXT.md` (Session handoff), `docs/DOCMAP.md`, `README.md`, `docs/evidence/sources.md`, the handoff
    `docs/handoffs/2026-10-11-session-handoff.md`.
- **Not decided here:** the Codex bearer path's measurement (`bearer_token_env_var`, no writer yet; SH-11 marks
  its row provisional and the kit checks the shape written there); a
  `session-handoff/1` for Gemini CLI; how a host verifies a folder another host wrote before it opens it.
- **Source:** Fabric ADR-0140 (0.4.0 REQ-06, canvas C3), agreed with Fabric Dashboards on 2026-10-11
  (fabric-dashboards-76). Claude Code 2.1.296 `claude --help`; Switchboard `docs/CLI.md` and `docs/CONTRACTS.md` at
  `70cc72b` (the 16 × 1024 in-place limit, SB-94); Dashboards `src/core/handoff.ts` at `7a2febf`; Fabric
  `apps/desktop/src/main/sessionBundle.ts` at `c7028457`. DEC-0042 and `FAC-SEM-053`…`055` were reserved by git CAS
  (`agent_sync.py reserve --key session-handoff-20261011 DEC`, `--key session-handoff-{manifest,dir,mcp}-20261011
  SEM`); `DEC-0041` had been reserved first (`--key meter-grant-read-20261011`) and is pull request #32, merged at
  `7931c1d`, so the marker moves to `DEC-0043`. This file and `conformance.md` were edited under git leases; the record plane is `fs`.
  Written by Fabric's session; reviewed and merged by the contract's owner session (fabric-agent-contract-75).

### DEC-0043 — Two canonical forms, one register: the settings form and RFC 8785; the board's digest is RFC 8785

- **Date:** 2026-10-11
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: Fabric's board already
  computes the pinned digest (`apps/desktop/src/main/boardService.ts` `commsDigest`); the adapter's kit ports run
  the shared vectors (ask (c), CT-18).
- **Annotated (2026-10-12):** its *Not decided here* on lone surrogates is decided by DEC-0052 item 9 (CT-25): the settings form refuses one in any string or key.
- **Decision:**
  1. The contract has exactly two canonical JSON forms, both in `src/canonical.ts`, and every signed or hashed JSON
     document names one of them in the register
     [canonical forms](specification/conformance.md#canonical-forms):
     - the **settings form** (DEC-0025), `settingsCanonicalJson`: keys by Unicode code point, `", "` and `": "`,
       integers within ±(2^53 − 1) only, `JSON.stringify` string escaping — Python's
       `json.dumps(sort_keys=True, ensure_ascii=False)`;
     - **RFC 8785** (JCS, DEC-0039), `rfc8785`: keys by UTF-16 code unit, no whitespace, ECMAScript numbers;
       refuses a non-finite number, a lone surrogate and a value that is not plain JSON.

     A new document picks one of the two and names it, never a third: the settings form for a document that is
     or mirrors stored settings, RFC 8785 for any other. A restriction of the input is not a third form.
  2. **DEC-0022's idempotency digest is RFC 8785** of the operation's arguments, which hold integers within
     ±(2^53 − 1) only: `sha256:` and the hex SHA-256 of `fabric-project-comms/0.1` NUL `<operation>` NUL
     `<RFC 8785>`; a call holding a fraction is refused `invalid_arguments` before anything is stored. The
     reference is `commsDigest` (`src/comms-digest.ts`). It follows the consumer: Fabric's board computes exactly
     this (UTF-16 order by `Array.prototype.sort`, no whitespace, integers only, lone surrogates refused).
  3. **DEC-0031's "its canonical JSON" is the settings form**: a device policy and a policy key set are signed
     over the settings form of the document without `signature` (`policySigningInput`), not over RFC 8785. So
     are a settings backup's checksum and activity's derived `eventId` and path `sourceKey`.
  4. A revisioned object's `contentHash` (`overview.md`) is over the RFC 8785 form of the object without
     `contentHash`; the text had said only "canonical JSON".
  5. Shared vectors, `fixtures/vectors/canonical.json`: each form's cases (RFC 8785's §3.2.2–§3.2.4 sample, its
     §3.2.3 sorting sample and Appendix B), the inputs on which the two differ, and the board's digests.
- **Why:** three uses of "canonical JSON" wrote different bytes and no page told them apart (F-A-006, F-B-112,
  F-B-315): DEC-0022 named sorted keys without the order, which differs above U+FFFF, and no reference or vector;
  DEC-0031 named neither form next to the RFC 8785 that DEC-0039 had made citable. A signer who reads "canonical
  JSON" beside RFC 8785 writes bytes the device refuses, and two boards could answer `idempotency_conflict` to the
  same call. The settings form stays because settings backups, device policies and activity ids are already
  signed and stored in it; RFC 8785 stays because approvals are and it is the published standard.
- **Compatibility:** Additive in code — `canonicalJson` (`src/settings-backup.ts`) and `jcs` (`src/delegation.ts`)
  re-export the two functions, and no output changes. Clarifying in text for DEC-0031 and the activity ids: the
  bytes are those the code always computed. A tightening for DEC-0022, whose text admitted either key order: the
  one consumer that computes it, Fabric's board at `487ef5b0`, already writes these bytes (the four digest vectors
  were checked against its `commsDigest`), so nobody must change. The reference also refuses an empty operation
  or one holding a NUL; Fabric passes fixed names only. `contentHash` is named for the first time; no contract
  code computes it. `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - code: `src/canonical.ts` (new), `src/comms-digest.ts` (new), `src/settings-backup.ts` and `src/delegation.ts`
    (re-exports), `src/device-rules.ts` and `src/activity-rules.ts` (import the settings form by name);
  - spec: `docs/specification/conformance.md` (Canonical forms), `docs/specification/project-comms.md`
    (Idempotency), `docs/specification/devices.md`, `docs/specification/activity.md`,
    `docs/specification/delegation.md`, `docs/specification/overview.md`;
  - vectors and tests: `fixtures/vectors/canonical.json`, `test/canonical.test.ts`; coverage floors in
    `vitest.config.ts` and `docs/evidence/specs/2026-10-11-board-waves/coverage-baseline.md`;
  - docs: `CONTEXT.md` (Canonical form), `docs/DOCMAP.md`, `docs/evidence/sources.md` (RFC 8785 text pinned),
    the handoff `docs/handoffs/2026-10-11-canonical-forms.md`.
- **Not decided here:** unifying the two forms (a contract-owner choice; it would re-sign every device policy and
  change every stored backup checksum); whether the settings form should refuse a lone surrogate, as Python
  cannot encode one (today only `FAC-SEM-035` refuses one in a backup cell); the `contentHash` Fabric's hub call
  writes on its synthetic binding and hub references (`hubCall.ts`), which hashes a string, not an object.
- **Source:** RFC 8785 (text pinned in `docs/evidence/sources.md`); Fabric `apps/desktop/src/main/boardService.ts`
  at `487ef5b0` (`commsCanonical`, `commsDigest`, last changed `d8eb9ff5`); the board-waves inventory F-A-006,
  F-B-112, F-B-315 (`docs/evidence/specs/2026-10-11-board-waves/inventory.json`), packet P2-01. DEC-0043 was
  reserved by git CAS (`agent_sync.py reserve --key canonical-forms-20261011 DEC`); this file and `conformance.md`
  were edited under git leases; the record plane is `fs`.

### DEC-0044 — Service hygiene: a setup state is not an outage, a stdio server is declared where it is used, no secret in a command line

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: Fabric Dashboards' outage
  watcher (FD-48) and Example Console read `setup`; the adapter checks Claude Code plugin configurations against LC-19 and
  LC-21 (its own row); Fabric starts provider entries' stdio servers by `scope`.
- **Decision:**
  - a well-known `degraded` entry MAY carry `setup: true`: the source waits for a person to finish setting it up,
    not an outage. It still names `source` and `reason` and still makes the service `degraded` (`FAC-SEM-011`
    unchanged); a watcher MUST NOT open an outage alert for it ([service](specification/service.md#well-known-document));
  - a manifest's stdio MCP connection and a provider entry's `run.mcp.stdio` MAY carry `scope`: `project`, or
    `on-demand` (the default when absent). `session`, every session, is spelled and refused by `FAC-SEM-056`; a host
    never writes a declared stdio server into a runtime's user-wide MCP configuration. A tool without per-session
    state SHOULD be a service's MCP surface, one copy on the machine under its supervisor
    ([profiles](specification/profiles.md#where-a-stdio-server-is-declared), LC-19);
  - no declared launch argument or MCP entry carries a credential (`FAC-SEM-057`): a manifest's MCP `args`,
    `executableRef` and `url`, a local runner's `args` and `executableRef`, a provider entry's `command` and `url`, a
    runner's `version`, `auth` and drive `argv`, a descriptor's `commands`
    ([profiles](specification/profiles.md#no-secret-in-a-command-line), LC-21);
  - one detector, `src/secret-shape.ts`: DEC-0041's whole-word credential names, the value shapes, SH-10's
    `secretArgument` and a URL check (`secretUrl`: user-information password, a credential-named or secret-shaped
    query or fragment parameter). `src/fabric-links.ts` re-exports what it exported. `src/session-handoff.ts` keeps
    its copy, because Fabric vendors that file alone and runs it without this kit
    (`apps/desktop/test/session-handoff-conformance.test.mjs` on Fabric's unmerged branch `agent/w2-handoff` at `29c8de91`, which pins its copy by sha256 at contract `84043cb`); a test holds the copy
    to the original's patterns and behaviour.
- **Why:** three asks from live consumers on 2026-10-11. The copy agent's database was down 3 h 07 min and the
  operator heard nothing; the operator's rule (Dashboards' watcher messages after 5 minutes) needs to tell a setup
  state from a failure under the same source. The same day about 35 sessions each held their own copies of five
  stdio MCP servers, about 10 GB, which helped fill the disk three times (LC-19); and a plugin's MCP passed its bearer
  key to `mcp-remote` in argv, visible in `ps` (LC-21).
- **Compatibility:** Additive for documents; `contractVersion` stays `0.1.0`. Two optional fields; every existing
  document stays valid, and an absent `scope` means `on-demand` — which gives every existing manifest's host a new
  duty: stop the server when the run that started it ends. Not additive for two readers of provider entries:
  Fabric's registry (`apps/desktop/src/main/agentRegistry.ts:236` at `487ef5b0`) and the adapter's
  (`fabric_provider.py:119`) refuse any `run.mcp.stdio` member but `command` and `env`, so writers do not emit
  `scope` until both accept it (their board rows, CT-27 and CT-28). `FAC-SEM-056` refuses only the spelled-out
  `session`; the real LC-19 control — a host never writing a declared stdio server into a user-wide configuration —
  is a host duty no checker can see, so LC-19's verification is met only for what documents declare. Tightening for two readers: a watcher that alerted on
  every degraded source stops alerting on a setup entry, and a host that wrote declared stdio servers into a
  user-wide configuration stops. `FAC-SEM-057` refuses a document that already carried a credential in an argument
  or URL; no fixture or known consumer document does. At its next pin a consumer re-vendors `src/session-handoff.ts`
  (one comment line changed) and may import `src/secret-shape.ts` instead of its own copy of the matcher. The
  positive sweep now reads a manifest whole under the new kind `manifest` instead of `service-manifest`, which takes
  a descriptor beside its manifest.
- **Consequences / affects:**
  - spec: `docs/specification/profiles.md` (where a stdio server is declared, no secret in a command line, the
    semantic-rules table), `docs/specification/service.md` (the setup state, the descriptor's commands, surfaces),
    `docs/specification/provider.md` (`scope`), `docs/specification/conformance.md` (`FAC-SEM-056`, `FAC-SEM-057`,
    two reader rows);
  - schema: `schemas/service-well-known.schema.json` (`degraded[].setup`), `schemas/manifest.schema.json` and
    `schemas/provider.schema.json` (`scope`);
  - code: `src/secret-shape.ts` (new), `src/semantic-rules.ts`, `src/fabric-links.ts` (re-exports),
    `src/session-handoff.ts` (a comment);
  - fixtures: 3 positive, 3 negative (`fixtures/catalogue.json`), 6 semantic (`fixtures/semantic/stdio-scope-*.json`,
    `fixtures/semantic/command-line-*.json`);
  - tests: `test/service-hygiene.test.ts` (new), `test/session-handoff-review.test.ts` (the copy against the
    original), `test/positive-sweep.test.ts`, `test/fabric-button.test.ts`; floors in `vitest.config.ts` and
    `docs/evidence/specs/2026-10-11-board-waves/coverage-baseline.md`;
  - docs: `CONTEXT.md` (Setup state, Server scope), `docs/DOCMAP.md`, `README.md`, the handoff
    `docs/handoffs/2026-10-12-service-hygiene.md`.
- **Not decided here:** which `degraded` sources a given service marks `setup` (each service's own); how long a
  watcher waits (the operator's 5 minutes, Dashboards' to implement); a `scope` for servers in a session handoff's
  `mcp.json` (that file is already one run's); whether the adapter's plugin check refuses or warns.
- **Source:** fabric-workspace `knowledge/authority.md`, *Telling the operator about outages* (operator, 2026-10-11),
  and `knowledge/lifecycle.md` LC-19 and LC-21 (PR #136, `34e5fa1`); board rows CT-22, CT-23, CT-24; board run wave 2,
  node N15, packet P2-02. DEC-0044 and `FAC-SEM-056`, `FAC-SEM-057` were reserved by git CAS
  (`agent_sync.py reserve --key service-hygiene-20261011 DEC`, `--key service-hygiene-{mcp-scope,command-line}-20261011
  SEM`); `DEC-0043` was reserved first by packet P2-01, so the marker moves to `DEC-0045`. This file and
  `conformance.md` were edited under git leases; the record plane is `fs`.

### DEC-0045 — Delegation sealed: one grant per token, the meter's hop, one refusal wire, a strict verifier, trust tiers, and no small-order key

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: Fabric's issuer mints one
  grant per token and the meter's five-actor token, and issues only `prompt` and `operator-channel` approvals
  (CT-19); Observatory's meter requires the exact scope and effect and answers `denied` as a result (CT-20); the
  adapter's kit ports pass the issuer and run this verifier's table (CT-18).
- **Annotated (2026-10-12):** item 9's "in the page's own storage partition on the service origin, as ED-8's is" is
  superseded by DEC-0059: FB-6's cookie, like ED-8's, is per host in a shared cookie store and per service where the
  host gives each service its own store, so in a shared store an `owner=host` for one local service hides every local
  service's button on that host (RFC 6265 §8.5).
- **Amends:** DEC-0039 (DL-2, DL-4…DL-6, DL-8, DL-12, DL-13, DL-16, DL-17, DL-19, DL-21; `FAC-SEM-050`), DEC-0040
  (FB-6), the session-lifetime paragraph of [service](specification/service.md#operator-session-lifetime). Implements
  Fabric ADR-0144 amendments 3 and 4 at
  [`19ad05ca`](https://github.com/passioncode-ai/fabric/blob/19ad05ca2cf9e830d396a8fca3273b7d5e9c3bc7/docs/adr/0144-one-delegation-model-fabric-issues-the-chain-the-callee-checks-it-observatory-meters-it.md).
- **Decision:** in [delegation](specification/delegation.md) unless named otherwise —
  1. **One grant per token** (F-B-305). Fabric's session, as ADR-0144's owner, confirmed on 2026-10-12 that the
     reference rule binds the meter's token only and will say so as amendment 5; `grant` holds exactly one reference (`delegation-token.schema.json`
     `maxItems: 1`); the verifier refuses two as a claim of the wrong type (DL-13 row 5); `FAC-SEM-050` refuses a
     reference beside the one the token was minted under, and requires the meter's token to keep its parent's one
     reference. An onward token to another callee is minted under its own grant, as DL-5 always said: amendment 3's
     "an onward token keeps the same reference" is read as the meter's token, the only onward token minted under
     its parent's grant; read for every onward token it would contradict DL-4, which the amendment does not revise.
  2. **The meter's hop is outside the depth limit** (F-B-306): a token whose `aud` is the meter, `scope` exactly its
     grant-check capability and `effect` exactly `["none"]` may hold five actors; no other may, and none six (DL-6;
     the schema's `actor5` and its `effect` condition; `verifyMeterToken`; `FAC-SEM-050`).
  3. **`approval.method: device` is removed** (F-B-314) until a decision defines it; Fabric issues only `prompt` and
     `operator-channel` (`approval.schema.json`, `verifyApproval`).
  4. **One refusal wire for the meter** (F-B-301): the meter answers a grant check with a `grant-check` document, a
     `denied` being a normal result, not `isError`, its `code` from the one set (DL-19); a callee that stops on it
     relays the `code` unchanged in `error.code`, with `window`, `level` and `approvalRequest` in `error.data`
     (DL-21 step 6, `refusalFromDenial`).
  5. **The session lifetime tightened DEC-0039's predecessor rule** (F-B-311), as DEC-0039's annotation says; the
     descriptor token **rotates** when the value in `auth.tokenFile` changes, each value a new revision, which a
     service records with each session as an opaque value, never the token (service.md).
  6. **Trust tiers** (TRUST-TIERS; amendment 4): T0 the operator's own machine (loopback on the owner's OS
     account), T1 an enrolled machine of the same owner (RM-21 decides the binding), T2 everything else (DL-25). A
     callee MUST NOT require a token, an approval or a grant record of a T0 or T1 caller, and MAY accept, verify and
     use one for attribution and narrowing (DL-26); DL-8 binds T2; DL-12's retirement of descriptor-token capability
     calls applies across the machine boundary and stays attribution hygiene on the machine; `surfaces.mcp.auth:
     "delegation"` is for a service exposed to T2 (DL-16); "loopback reachability is not authorization" stays as the
     statement about hostile local processes; money limits, human gates and the rule never to spend another
     agent's key or vault slot bind at every tier.
  7. **The verifier is strict and ordered** (F-B-307, F-B-313, F-B-319, F-B-312): DL-13 row 5 checks every DL-2 type
     (actors' agent ids and session ids, URIs, `scope` and `jti` grammars, effects once, one grant, `spend`, `nbf`)
     before rows 6–11, so a malformed chain is `unauthenticated` whatever else is wrong; the issuer is required in
     `verifyDelegation`, `verifyApproval` and `verifyMeterToken`, its absence `issuer-unavailable`
     (`no-trusted-issuer`, row 1); a published key of another `use` or `alg` is the issuer's fault
     (`issuer-unavailable`, row 3); the meter's `readOnly`, which could never fire, is replaced by an exact scope
     and effect.
  8. **`FAC-SEM-050` checks spend against the grant** (F-B-322): each window a limited token names is one of the
     grant's limits and at most its `limitUsd`, its `perCallMaxUsd` at most the grant's, and an onward token's at
     most the parent's (DL-4, DL-5).
  9. **FB-6's cookie** (F-B-318) is set in the page's own storage partition on the service origin, as ED-8's is,
     and is a session cookie, so a stale `owner=host` never hides the button in a plain tab.
  10. **Security fix: no Ed25519 key of small order** (CT-29). A public key whose 32 bytes, with the sign bit (top
      bit of byte 31) cleared, equal one of libsodium's seven `has_small_order` encodings — `y = 0`, `y = 1`, the two
      of order 8, `y = p − 1`, and the non-canonical `y = p` and `y = p + 1` — is refused before anything is
      verified under it: by `verifyDelegation`, `verifyApproval` and `verifyMeterToken` as the issuer's unusable key
      (`issuer-unavailable`, `small-order-key`; DL-13 row 3), by `verifyPolicySignature` for device policies and
      key sets (`FAC-SEM-041`, `FAC-SEM-046`), by `FAC-SEM-046` in a published key set, and by the schemas of the
      estate's JWKS and of a device key set (DL-14; devices, Key sets). One predicate, `isSmallOrderKey` in
      `src/ed25519.ts`, serves every Ed25519 verification in the contract.
- **Why:** the board run's audit of DEC-0037…0040 (2026-10-11, inventory node `N05-delegation`) measured a callee
  able to point the meter at a grant its token was not minted under, a fourth-hop callee that could be called but
  never metered, two refusal shapes for the meter, a verifier that accepted what DL-13 refuses and answered in
  another order than its table, an optional issuer check, and twelve `FAC-SEM-050` sub-checks and seven verifier
  MUSTs that a deletion left green. Fabric's session ruled rulings 1–5 as ADR-0144's owner (amendment 3); the
  operator decided ruling 6 (amendment 4, "This machine is the operator's workplace").
- **Compatibility:** Tightening, `contractVersion` stays `0.1.0`. Rulings 1 and 3 narrow schemas: a token with two
  grants or an approval with `method: device` stops validating; no fixture or known consumer emits either, and
  Fabric's issuer is not built yet (wave 4). Ruling 2 widens the token schema for the meter's token only. The
  verifier refuses tokens it used to accept (malformed types; a five-actor token anywhere but at the meter; a meter
  token wider than the grant check) and answers some in another code or order: a key of another `use`/`alg` is now
  `issuer-unavailable`, a malformed chain with a wrong audience `unauthenticated`. `issuer` becomes required in
  three option types, a breaking change for a TypeScript caller and a runtime refusal for a JavaScript one that
  omitted it. `FAC-SEM-050` refuses mints it passed. The trust tiers relax requirements: no callee may require a
  token of a T0/T1 caller. At their next pin: **Fabric's issuer** mints exactly one grant and the meter's
  five-actor token with exact scope and `effect: ["none"]`, and offers only `prompt` and `operator-channel`
  approvals (CT-19); **Observatory's meter** passes its issuer, requires the exact scope and effect, accepts five
  actors only on its own token, and answers `denied` as a result (CT-20); **the adapter's ports** pass the issuer,
  follow DL-13's order and row 5's types, classify an unusable key as the issuer's, relay a meter denial with
  `refusalFromDenial`'s shape, and set the `fabric_button` cookie as a session cookie in the page's partition
  (CT-18). **The small-order refusal (item 10) is a security fix and a tightening: any verifier of a delegation
  token, an approval or a device policy running on Node 20 or 22 was forgeable** by anyone able to publish one key
  in the set — measured here on Node v22.23.1, where `main`'s `verifyDelegation` answered `ok` for the adapter's
  forged vector, while v24.19.0 and v26.10.0 refused it with `bad-signature`. It now answers `issuer-unavailable`
  (`small-order-key`) on every Node; the adapter's vector expects `unauthenticated` (`bad-signature`), and its
  port moves to this code (CT-18). The JWKS and key-set schemas also refuse a non-canonical base64 key, which no
  real key encoder writes.
- **Consequences / affects:**
  - spec: `docs/specification/delegation.md` (DL-2, DL-4…DL-6, DL-8, DL-12, DL-13, DL-16, DL-17…DL-19, DL-21,
    Trust tiers DL-25 and DL-26, The boundary, the rules table, Not decided here), `docs/specification/service.md`
    (the session's lifetime), `docs/specification/spend-policy.md` (rule 2's tiers and meter),
    `docs/specification/fabric-button.md` (FB-6), `docs/specification/conformance.md` (three reader rows);
  - schemas: `delegation-token` (`grant`, `actor5`, the fifth actor's `effect`), `approval` (`method`),
    `grant-check-request` (`grantRef`'s description);
  - code: `src/delegation.ts` (`verifyAt`, `delegationShape`, `verifyMeterToken`, `refusalFromDenial`,
    `GrantCheckDenial`, `keyFor`), `src/delegation-rules.ts` (`FAC-SEM-050`), `src/ed25519.ts` (new,
    `isSmallOrderKey`), `src/device-rules.ts` (`verifyPolicySignature`, `FAC-SEM-046`);
  - security: `schemas/delegation-jwks.schema.json` and `schemas/device-key-set.schema.json` (`x`, `rawKey`),
    `docs/specification/devices.md` (Key sets), `fixtures/vectors/delegation-small-order.json` (the adapter's forged
    token), `test/ed25519.test.ts` (new);
  - fixtures: 1 positive, 8 negative and the chain-too-deep keyword (`fixtures/catalogue.json`), 19 semantic
    (`fixtures/semantic/delegation-mint-*.json`);
  - tests: `test/delegation-sealed.test.ts` (new), `test/delegation.test.ts`, `test/delegation-seams.test.ts`,
    `test/meter-grant.test.ts` (the issuer); floors in `vitest.config.ts` and
    `docs/evidence/specs/2026-10-11-board-waves/coverage-baseline.md`;
  - UX: `docs/ux/foundation.md` (JTBD-07, JRN-06, ST-012…ST-015), `docs/ux/flows.md` (FLW-10…FLW-12),
    `docs/ux/screens.md` (SCR-13…SCR-15), `docs/ux/scenarios.md` (SCN-016…SCN-019, F-B-321);
  - docs: `CONTEXT.md` (Trust tier), `docs/backlog.md` (CT-09 closed, CT-18…CT-20, CT-30), the handoff
    `docs/handoffs/2026-10-12-delegation-sealed.md`.
- **Not decided here:** a device approval; the binding that places a caller in T1 (RM-21); how a surface declaring
  `delegation` admits a T0/T1 caller that presents no token; the grant check of a T0/T1 callee called without a
  token (`grant-check-request` requires `tokenJti`; CT-30); shared verifier vectors for the kits' ports (today the
  ports read `test/delegation-sealed.test.ts`; vectors need a published test key).
- **Source:** Fabric ADR-0144 amendments 3 and 4 at `19ad05ca`; the board brief's rulings
  (`docs/evidence/specs/2026-10-11-board-waves/brief.md`, "Decisions resolved from the sources"); inventory F-B-301,
  F-B-305…F-B-314, F-B-317…F-B-319, F-B-321, F-B-322, TRUST-TIERS; board run wave 2, node N05, packet P2-03; the
  small-order forgery reported by fabric-agent-adapter's session from its release CI on Node 22 (its
  `test/fixtures/delegation/vectors.json` at `ea7efbea`, case "forged under a small-order placeholder key"), board
  row CT-29; libsodium's `ge25519_has_small_order` list, each entry checked here to be a point of order dividing 8.
  DEC-0045 was reserved by git CAS (`agent_sync.py reserve --key delegation-sealed-20261012 DEC`); this file,
  `conformance.md` and `backlog.md` were edited under git leases; the record plane is `fs`.

### DEC-0046 — Runner and model profiles: one catalogue, named profiles, a subscription-or-key route, one resolution order

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: Fabric publishes
  `registry/models.json` and `registry/model-profiles.json`, checks `shared/agents.ts` against `registry/runners.json`,
  writes the estate defaults and overrides into bindings and refuses an empty intersection at launch (0.4.0 wave 4);
  the adapter's kit implements `resolveModelProfile`, reads the catalogue and shows the slots; Project Observatory
  supplies prices and the tool-use probe, issues keys with the allow-list and meters by route; Fabric Dashboards shows
  each agent's configuration.
- **Annotated (2026-10-23):** a `subscription` row's `costUsd` is an estimate at list price; a host sums money over the other routes only (DEC-0110).
- **Annotated (2026-10-12):** a usage report's `route` admits `platform-metered` beside `subscription` and `key`, and a
  descriptor names its runner's credential kind, by DEC-0061.
- **Annotated (2026-10-15):** amended by DEC-0083: the closed model classes gain `open-vendor` (seven classes), a model
  profile gains the optional `reads`, and `FAC-SEM-112` joins `profile-resolution`'s rules. `open-vendor` is a
  deliberate exception to item 5's every-class rule: resolution ignores it, a spend policy's and a grant's
  `modelClasses` cannot name it (`$defs/admissionClass`), and a catalogue row carries at least one other class.
- **Amends:** DEC-0037 (`modelClasses` closed), DEC-0016 (three drives, the shared kind `pi`), DEC-0042 (SH-11 gains
  `pi`), DEC-0021 (a usage row's `route`). Implements Fabric [ADR-0147](https://github.com/passioncode-ai/fabric/blob/29e3f984670f63650c39f2c4abc2ef8249e50f20/docs/adr/0147-runner-and-model-profiles-one-catalogue-named-profiles-one-resolution-order.md) with amendments 1 and 2 (written at
  `31a9d6ca`; its last change `29e3f984`, now on Fabric `main`), on the rulings the board brief records.
- **Decision:** in [runners](specification/runners.md#runner-and-model-profiles) unless named otherwise —
  1. **A closed vocabulary of model classes** (the proposal's §3.2 item 1, whose open list this closes):
     `frontier`, `strong`, `cheap`, `code`, `vision`, `chinese-vendor`. The
     spend policy's and a grant's `modelClasses` take only these (`spend-policy.schema.json`,
     `governance.schema.json`); a new class takes a decision.
  2. **Three schemas.** The model catalogue (`registry-models.schema.json`): one row per `<vendor>/<model>` id with
     classes, endpoints, tool use as measured or blocked with its reason and date, and a reference into the live price
     feed, never a price. A model profile (`model-profile.schema.json`): an ordered list of catalogue ids with a
     fallback `none` or `between-turns`, alone or as the estate's `model-profiles` set; an agent may declare its own.
     A runner profile (`runner-profile.schema.json`): a runner kind, optionally its drive, a route and a model
     profile. The contract owns the shapes; Fabric publishes the estate's contents. `FAC-SEM-058`: a model catalogued
     once, a profile id declared once.
  3. **Routes.** `subscription` is the operator's own login and runs only in its vendor's runner — `claude` in
     `claude-code`, `kimi` in `kimi-code`, `chatgpt` in `codex` — spending no money and not metered; any other runner
     takes `key`. `FAC-SEM-059` refuses a subscription in another runner.
  4. **Headless drives** `pi-json`, `opencode-json`, `kimi-stream-json` (`runners.schema.json`), each printing JSONL
     on stdout; `pi` is a shared kind, so `session-handoff.schema.json`'s runtime list gains it, with an SH-11 row
     ([session handoff](specification/session-handoff.md#the-launch)): no measured strict switch.
  5. **One resolution order:** the request's model profile, else the agent's, else the binding's or project's, else
     the estate default. The project's spend policy restricts and never chooses: a model stays when every class the
     catalogue gives it is allowed, in the profile's order; when none stays the host refuses the launch with
     `model-classes-empty`, naming the profile and the policy's id and revision. "The provider owns model choice"
     ([profiles](specification/profiles.md#local-runner-profile)) becomes "the provider chooses within the project's
     allowed classes". `resolveModelProfile` in `src/profile-rules.ts` is the reference; `FAC-SEM-060` holds a
     recorded `profile-resolution` to it.
  6. **What an agent declares:** the well-known document's optional `configuration` names the configurable slots
     (`runner`, `model`) and the resolved profiles read-only ([service](specification/service.md#well-known-document));
     a usage row MAY carry `route` ([service](specification/service.md#usage-report)).
  7. **A key route's key admits the profile's models:** `key.modelAllowList` is the model profile's id and equals the
     runner profile's `modelProfile`, and `key.ref` is a secret reference, never a value (`FAC-SEM-059`).
  8. **Per-model provider routing:** a catalogue row MAY carry `provider`, OpenRouter's provider-routing object by its
     own field names — `order`, `ignore`, `allow_fallbacks`, `sort` (`price`, `throughput`, `latency`) — which the key
     route's proxy applies; it changes the upstream, never the model or the allow-list. A slug is never both ordered
     and ignored (`FAC-SEM-058`). An estate default of `sort: price` is **recommended to Fabric** as the catalogue's
     publisher, not decided: ADR-0147 does not decide it.
- **Why:** nine agents keep their own model tables and price lists, and an L1 policy naming model classes could not
  be checked, because the classes were free strings and no catalogue mapped models to them (ADR-0147, Context). A
  subscription used outside its vendor's runner breaks the vendor's terms; a key without an allow-list can spend on any
  model. Measured on 2026-10-11: `sort: price` cut two 30k-token requests from $0.047 to $0.0052. ADR-0147 leaves open
  how a policy's classes restrict a model with several; the contract takes "every class allowed", because with
  "any" a policy could never exclude `chinese-vendor`. The cost: capability classes (`code`, `vision`) are opt-ins a
  policy must list, so a `strong`-only policy drops a model the catalogue also marks `code`.
- **Compatibility:** Additive for documents except `modelClasses`: three schemas, two drives' worth of enum values
  (`drive`, `runtime`), optional `configuration` and `route`; `contractVersion` stays `0.1.0`. **Tightening** for
  `modelClasses`: a spend policy or grant naming any other string stops validating; no consumer writes one today
  (`git grep modelClasses` over Fabric `5bf15e5c`, the adapter `ea7efbe`, Project Observatory `5597810` and Fabric
  Dashboards `837be19`: none outside documents), and this repository's eight spend-policy fixtures move from
  `general`, `chinese` to the vocabulary. **Tightening for a host:** a launch an L1 policy leaves without a model is
  refused, where before nothing checked. `src/session-handoff.ts` changes one line (`pi` joins SH-11's no-switch
  runtimes), so a consumer that vendors it by digest re-vendors it at its next pin. A reader of `runners.schema.json`
  or `session-handoff.schema.json` with its own enum copy accepts the new drives and `pi` at its next pin.
- **Consequences / affects:**
  - spec: `docs/specification/runners.md` (the drives, the shared kind, Runner and model profiles, three rules),
    `docs/specification/profiles.md` (the local runner's model choice), `docs/specification/spend-policy.md`
    (`modelClasses`), `docs/specification/service.md` (`configuration`, `route`),
    `docs/specification/session-handoff.md` (SH-11's `pi`), `docs/specification/conformance.md` (`FAC-SEM-058`…`060`,
    two reader rows);
  - schemas: `schemas/registry-models.schema.json`, `schemas/model-profile.schema.json`,
    `schemas/runner-profile.schema.json` (new), `schemas/runners.schema.json`, `schemas/session-handoff.schema.json`,
    `schemas/spend-policy.schema.json`, `schemas/governance.schema.json`, `schemas/service-usage.schema.json`,
    `schemas/service-well-known.schema.json`;
  - code: `src/profile-rules.ts` (new), `src/semantic-rules.ts`, `src/session-handoff.ts`;
  - fixtures: 7 positive and 10 negative (`fixtures/catalogue.json`), 12 semantic
    (`fixtures/semantic/model-catalogue-*.json`, `fixtures/semantic/model-profiles-*.json`,
    `fixtures/semantic/runner-profile-*.json`, `fixtures/semantic/profile-resolution-*.json`), the runner catalogue's
    `pi` and `opencode` entries and the spend-policy fixtures' classes;
  - tests: `test/runner-model-profiles.test.ts` (new), `test/positive-sweep.test.ts`,
    `test/schema-compilation.test.ts`, `test/session-handoff.test.ts`; the floor in `vitest.config.ts` and
    `docs/evidence/specs/2026-10-11-board-waves/coverage-baseline.md`;
  - UX: `docs/ux/scenarios.md` (SCN-020), `docs/ux/screens.md` (SCR-05);
  - docs: `CONTEXT.md` (Model catalogue, Model class, Model profile, Runner profile), `docs/DOCMAP.md`,
    `docs/evidence/sources.md` (OpenRouter provider routing, ADR-0147, pi, OpenCode, Kimi Code),
    `docs/backlog.md` (CT-05), the handoff `docs/handoffs/2026-10-12-runner-model-profiles.md`.
- **Not decided here:** an estate default for `sort` (Fabric's, as the catalogue's publisher); whether resolution
  skips a model whose tool use is `blocked` (today the kit's doctor reports it); whether a grant's `modelClasses`
  restricts calls under the grant at the meter, beside the policy's at launch; a subscription route's models (a
  Claude login serves Claude models; no rule checks a runner profile's model profile against its login); the issuing
  wire of a key with its allow-list (Project Observatory's); OpenRouter's other routing fields and `sort`'s object
  form; how `pi` and `kimi-code` are handed a session's MCP servers (SH-11 rows not measured).
- **Source:** Fabric ADR-0147 at `29e3f984` (first written at `31a9d6ca`); the proposal *Runner and model profiles*,
  2026-10-11, commit `9f05a3f` (cited by title and commit only), §3.2 items 1–7; the board brief's rulings
  (`docs/evidence/specs/2026-10-11-board-waves/brief.md`, "Decisions resolved from the sources"); the provider-routing
  and `sort` inputs and the measurement on board row CT-05; OpenRouter's provider-routing page (retrieved 2026-10-12)
  and the runners' own help and documentation, in the [source ledger](evidence/sources.md); board run wave 2, node
  N14, packet P2-04. DEC-0046 and `FAC-SEM-058`…`060` were reserved by git CAS (`agent_sync.py reserve --key
  runner-model-profiles-20261012 DEC`, `--key runner-model-profiles-{catalogue,runner-profile,resolution}-20261012
  SEM`); this file, `conformance.md` and `backlog.md` were edited under git leases; the record plane is `fs`.

### DEC-0050 — The package, `fabric-package/1`: one folder per version, its digest over RFC 8785, and `agentRef`

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: the adapter's `pack` writes
  packages and runs the folder check, its `new` and `test` write the secret slots, `requires`, the result signal,
  `state[]` and the evals receipt (its rows FAA-26, FAA-27); Fabric reads `resultSignal` and emits the `result` event
  naming it, and records packages by `agentRef` and digest (its D2b amendment of ADR-0138); Project Observatory's node
  installs from the folder check and the digest.
- **Decision:** in [package](specification/package.md) —
  1. **One format for agents and skill sets** (J8): `fabric.package.json` at the root of one folder, which is one
     Claude Code plugin folder (D-SK1), schema `schemas/fabric-package.schema.json`. `kind` is `agent` or
     `skill-set`; an agent requires `agentRef`, `provider` (its `fabric-agent.json`), `resultSignal` and `evals` with
     the receipt, and may carry `service`, `secrets[]`, `costPresets` and `state[]`, which a skill set may not; a skill
     set requires `layer` and at least one skill.
  2. **Every item of v4 §12's row is typed:** the service template (`service`: id, name, entry argv, runtime — the
     installing machine adds the origin, token file, supervisor and paths); `secrets[]` as slots with a name and a
     purpose and no member that could hold a value (DEC-0013); `requires` (MCP servers, packages by publisher, id
     and range, platforms, GPU); `costPresets` in the manifest's DEC-0037 shape, read without opening a file; the
     result signal (`resultSignal`: a name and the card's "done when …"), which Fabric's `result` event names and on
     whose run the meter's receipts join; `state[]`, what moves with a placement (absent: nothing); the evals
     receipt (the suite's SHA-256, passed, failed, skipped, when); `dependencies[]`, vendored with a path or
     hash-locked without; `files[]`, every file but `fabric.package.json` with its SHA-256.
  3. **The digest** is `sha256:` and the hex SHA-256 of the UTF-8 RFC 8785 form (DEC-0043) of the package without
     `digest` and `signatures` (`packageDigest`); a row in the
     [canonical-forms register](specification/conformance.md#canonical-forms). Through `files[]` it covers the folder,
     and `checkPackageFolder` checks the folder against the list (`file-missing`, `file-digest`, `file-unlisted`,
     `plugin-manifest`, `provider-manifest`).
  4. **`agentRef`** is `urn:fabric:agent:<publisher>:<id>`, derived and never chosen: one agent across its versions,
     the name a placement keeps when it moves (v4 §3, §6). The schema's `$defs/agentRef` is the pattern other
     documents reference.
  5. **Rules:** `FAC-SEM-064` (a package is whole: its own digest, each path listed once and never
     `fabric.package.json`, every named file listed with the same SHA-256 where repeated, a state path once, a skill
     set's plugin manifest), `FAC-SEM-065` (no secret: slots named once and not credential-shaped, none in the
     service's entry), `FAC-SEM-066` (`agentRef` derived).
  6. **Reconciled with CON-OE-03's field list,** v4 winning where they differ: v4's "manifest" is this document and
     the capability manifest a file it names; `evals` is a path and a receipt; one `signature` becomes
     `signatures[]` (DEC-0051); `id` is kebab-case, equal to the plugin `name`, with the scope in `publisher` rather
     than a dotted prefix, because Claude Code wants a kebab-case plugin name and `agentRef` already carries the
     publisher. The table is in package.md.
- **Why:** v4 §12 lists `fabric-package/1` first in the contract set and Stage 1's packing needs it (the adapter's
  `pack`, FAA-27, is blocked on it); CON-OE-03's package part (SK-02a) was owed since wave 1 of the organization
  plan. Without a digest that covers the folder, a signature over it signs a description, not the code; without a
  derived `agentRef`, a placement could not follow an agent across versions.
- **Compatibility:** Additive: a new schema, a new kind and three rule codes; `contractVersion` stays `0.1.0`. No
  consumer writes or reads a package today (`git grep -i "fabric.package\|costPresets"` over the adapter at
  `aebdc8f`: backlog rows only). CON-OE-03's dotted `id` example (`pc.release-basics`) does not validate: a writer
  following that draft takes a kebab-case `id` and puts the scope in `publisher`. At its next pin the adapter ports
  `packageDigest` and `checkPackageFolder` and runs `fixtures/vectors/package.json`.
- **Consequences / affects:**
  - spec: `docs/specification/package.md` (new), `docs/specification/conformance.md` (two register rows, a reader
    row, `FAC-SEM-064`…`066`);
  - schema: `schemas/fabric-package.schema.json` (new);
  - code: `src/package-rules.ts` (new), `src/semantic-rules.ts` (the `package` kind);
  - fixtures: 3 positive and 8 negative (`fixtures/catalogue.json`), 16 semantic (`fixtures/semantic/package-*.json`),
    vectors `fixtures/vectors/package.json`;
  - tests: `test/package.test.ts` (new), `test/positive-sweep.test.ts`, `test/schema-compilation.test.ts`; the floor in
    `vitest.config.ts` and `docs/evidence/specs/2026-10-11-board-waves/coverage-baseline.md`;
  - docs: `CONTEXT.md` (Package, agentRef, Package digest, Result signal), `docs/DOCMAP.md`, `README.md`,
    `docs/evidence/sources.md` (semantic versioning, SPDX expressions, the plugin manifest), `docs/backlog.md`, the
    handoff `docs/handoffs/2026-10-12-agent-package.md`.
- **Not decided here:** where a package's bytes are fetched from (v4 §4: the relay's blob store by digest); which
  keys a machine pins for a publisher and how a countersignature chains to an organization (`estate-record/1`,
  `org-authority/1`); the `result` event's shape (DEC-0030's amendment, board item V4-RUN-RESULT); a skill set's
  listing budget against an agent profile (`fabric-agent-profile/1`, CON-OE-03); Fabric's digests per version
  (packaged, shared, published, revoked), which Fabric's ADR-0138 at `22426281` does not carry yet (its D2b
  amendment).
- **Source:** the first organization server's target architecture v4 (`docs/design/2026-10-12-target-architecture.md`
  at `91c0637`; §12 as adopted at `a040e68`), §3, §6, §7, §12, §15 D4; CON-OE-03 (aliases SK-02a, J-PKG) in
  `docs/evidence/specs/2026-10-11-board-waves/findings/owed-decisions.json`, from the organization edition's
  agent-skills design §2 and agent-network design; the Claude Code plugin manifest reference (retrieved 2026-10-12,
  [source ledger](evidence/sources.md)); board run wave 3, node N17, packet P3-01. DEC-0050 and `FAC-SEM-064`…`066`
  were reserved by git CAS (`agent_sync.py reserve --key agent-package-format-20261012 DEC`, `--key
  agent-package-{whole,secrets,agent-ref}-20261012 SEM`); packet P3-02 reserved DEC-0048, DEC-0049 and
  `FAC-SEM-061`…`063` first. This file and `conformance.md` were edited under git leases; the record plane is `fs`.

### DEC-0051 — Package signatures: one publisher signature and organization countersignatures over the digest, each naming its algorithm

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: the adapter's `pack` signs
  (FAA-27) and its kits port `verifyPackage` with `fixtures/vectors/package.json`; Project Observatory's node verifies
  before install; Fabric's hub signs packages for the person's own machines until the passkey does (v4 Stage 1). v4
  has the hub sign with the node's P-256 device key (ES256); until Fabric's D2 admits ES256, the publisher key is a
  software Ed25519 key. EdDSA stays admitted for packages after D2 (v4 keeps release signatures on Ed25519); dropping
  it would be breaking and needs its own decision.
- **Decision:** in [package](specification/package.md#signatures) —
  1. `signatures[]` holds exactly one `publisher` signature and any number of `organization` countersignatures, each
     `{role, alg, kid, sig}`; absent, the package is unsigned and installs only where the installing machine's own
     rules allow it.
  2. **What is signed:** the UTF-8 RFC 8785 form of `{"type": "fabric-package-signature/1", "role", "digest"}`
     (`packageSigningInput`), a row in the canonical-forms register. The role is inside, so a publisher's signature
     never stands for a countersignature, even under one key; signatures stay outside the digest, so a
     countersignature needs no repacking.
  3. **Algorithms follow Fabric:** `alg` is named in every signature and every key names the one `alg` it is for (v4
     rule 12). This version admits `EdDSA` (Ed25519) only. `ES256` joins the schema's enum and `PACKAGE_ALGORITHMS`
     when Fabric records its decision D2 (ES256 beside EdDSA, ADR-0144); until then a verifier refuses it as
     `unknown-algorithm`. Every Ed25519 key passes `isSmallOrderKey` (DEC-0045) before any verification.
  4. **The verifier,** `verifyPackage(package, trust, {countersigned})`, in PK-1…PK-10's order: malformed, digest
     mismatch, unsigned, not exactly one publisher signature, then per signature an unadmitted algorithm, an unknown
     or duplicated `kid` in its role's pinned set, a key for another algorithm or not a public Ed25519 signing key, a
     small-order key, a bad signature; with `countersigned`, no organization countersignature. Shape and the
     per-signature checks run in array order after the publisher count. A signature under a pinned key must verify —
     a bad countersignature refuses the package; an organization countersignature under a `kid` the machine does not
     pin is set aside as `unverified` unless `countersigned` is asked.
  5. **Vectors** (`fixtures/vectors/package.json`): one case per problem, the test keys' seeds (Ed25519 is
     deterministic, so a port's signer reproduces every `sig`), the digest's canonical form and the signing input, and
     a signature forged under the all-zero key with no private key, which Node 20 and 22's `crypto.verify` accept.
- **Why:** v4 §12 lists an ES256 publisher signature and an organization countersignature; Fabric owns the
  algorithm choice (D2), so the package names its algorithm now and admits what Fabric's delegation admits today.
  Signing the digest inside a typed statement keeps a package signature from being replayed as any other signature
  over the same 32 bytes. The small-order forgery in the vectors verifies on Node 20.20.2 and 22.23.3 (`crypto.verify`
  answers true) and not on 24.19.0 or 26.10.0, the same split as CT-29; on Node 22 the verifier without `isSmallOrderKey`
  answers `ok: true` for the forged package.
- **Compatibility:** Additive (new fields of a new schema). Adding `ES256` later is additive for writers and needs a
  verifier at that pin to admit it. v4 §7's countersignature is an administrator's passkey assertion over a typed
  challenge carrying the listing's audience, grant and revision (`org-countersign/1`); when the signing-challenge
  types and `org-authority/1` are decided, that form replaces this version's detached organization countersignature,
  a breaking change for organization countersignatures that the deciding decision states. Publisher signatures are
  unaffected.
- **Annotated (2026-10-26):** DEC-0129 decides `org-authority/1` as the member list only and lists administrators'
  credentials in `org-key-set/1`; the replacement of the detached countersignature waits on the decision that defines the
  `org-countersign/1` verifier, which states the break.
- **Consequences / affects:**
  - spec: `docs/specification/package.md#signatures`, `docs/specification/conformance.md` (the statement's register
    row, the reader row with PK-1…PK-10);
  - schema: `schemas/fabric-package.schema.json` (`signatures`);
  - code: `src/package-rules.ts` (`packageSigningInput`, `verifyPackage`, `PACKAGE_ALGORITHMS`), using
    `src/ed25519.ts` and `src/canonical.ts`;
  - vectors and tests: `fixtures/vectors/package.json`, `test/package.test.ts`;
  - docs: `docs/evidence/sources.md` (RFC 7518 for `ES256`), the handoff `docs/handoffs/2026-10-12-agent-package.md`.
- **Not decided here:** `ES256` itself (Fabric's D2); the passkey-assertion countersignature, its challenge and its
  quorum (the signing-challenge types and `org-authority/1`, later waves); which keys a machine pins per role and how
  they rotate (`estate-record/1`, `org-authority/1`); a revoked digest (the revocation delta, a later wave).
- **Source:** the first organization server's target architecture v4 (`docs/design/2026-10-12-target-architecture.md`
  at `91c0637`), §2 rule 12, §6 Paths 2 and 4, §7, §12, §15 D2 and D4; Fabric ADR-0144 (D2 not yet recorded on
  Fabric `main` at `5bf15e5c`); RFC 8032, RFC 8037, RFC 7518 §3.4 ([source ledger](evidence/sources.md)); DEC-0045
  (`isSmallOrderKey`), DEC-0043; board run wave 3, node N17, packet P3-01. DEC-0051 was reserved by git CAS
  (`agent_sync.py reserve --key agent-package-signatures-20261012 DEC`); this file was edited under a git lease; the
  record plane is `fs`.

### DEC-0052 — Activity amended: account class, violations by day, notice and consent, OD-1 in neutral form, results and the root run, and the audit's fixes

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: a collector on the device
  labels sessions `account.class`, emits `policy.violation` by day and carries `run.root`; Fabric emits `result`; the
  first organization server, as receiver, keeps check-in drops out of its acks, serves another person's view of a
  member only as `FAC-SEM-067` allows and stores consent its own way; Project Observatory's node joins usage lines and
  results on `run.root` (backlog CT-04).
- **Amends:** DEC-0030 (items 1, 4, 6, 7 and 10; this decision's items 1–8), DEC-0043 (its *Not decided here* on lone
  surrogates; item 9). Implements CON-OE-01 and the first organization server's target architecture v4 §12 row
  "DEC-0030: `result` kind; root `run` on receipts" (commit `9c6a780`), and closes F-B-102, F-B-107, F-B-108 and CT-25.
- **Decision:** in [activity](specification/activity.md) unless named otherwise —
  1. **Account class.** An event MAY carry `account.class` (`organization`, `personal`, `unknown`) — a statement about
     the account a session ran on, never a person. An organization account carries the `tenantRef` its tenant has in
     the policy's `accounts.tenants` (DEC-0053): `sha256:` of the RFC 8785 form of `{provider, tenant}` (`tenantRef`).
     A personal or unknown account carries none, so no hash of a person's own tenant leaves the device.
  2. **`policy.violation`**, a new core kind: `{day, provider, accountClass, reason, count?}` with `project`. It
     carries a UTC day and no finer time: `occurred` is that day's midnight (`FAC-SEM-039` checks the day),
     `monotonicNs` is `"0"`, and no `session`, `run`, `task`, `git`, `skill` or `launch` (schema).
  3. **Notice and consent.** The device policy names its `noticeVersion` (DEC-0053's schema). Neutral messages
     (`activity-notice.schema.json`): `notice.acknowledgement {noticeVersion, purposeIds, at}` and
     `consent {purposeId, state: given | withdrawn, at}`, the person taken from the authenticated session, never the
     body. How a receiver stores consent records is private to it and not part of the contract.
  4. **The operator's OD-1, in neutral form.** A read served to a person other than the subject shows the subject's
     time or presence (`activity.raw`, `activity.presence`) only under a `purposeId` the subject confirmed — the latest
     `consent` for it at the read says `given` — and the subject's usage and cost (`activity.usage`) only as sums per
     UTC day or billing period. `access-log/1` entries gain `purposeId` and `step`. **`FAC-SEM-067`**
     (`access-log-disclosure`, receipt SEM-0067) checks a log against the subject's consents. The subject reading their
     own data, and a service that serves no person, are not narrowed.
  5. **DEC-0030 item 10 is narrowed by OD-1 for owner and administrator views**: the per-person presence estimates
     stay in the schema, labelled by `method` and logged; what a receiver serves another person of them is item 4's.
  6. **`result` and the root run** (v4 §12). The envelope's `run` gains `root`, the root run id every hop of one
     execution carries — a random per-run id — beside `task`, at least one of the two; a usage line carries it, so
     cost and result join on the device. A new core kind `result` `{signal, outcome: met | not_met, count?}` requires
     `run.root` and carries no `user` and no `session`; a receiver never attaches a user to one. No person dimension is
     added anywhere.
  7. **One definition of consumed (F-B-108).** An ack moves over seqs held, rejected or accounted for by an overflow
     event. A check-in's `dropped` ranges are **pending** (`StreamState.pending`): tamper evidence counts them, an ack
     never does.
  8. **A summary's `mixed` basis is the receiver's duty (F-B-107)**, not `FAC-SEM-038`'s: a summary does not carry its
     lines. F-B-102's four clauses each have a test that fails without them.
  9. **The settings form refuses a lone surrogate (CT-25)** in any string or key (`settingsCanonicalJson`), instead of
     writing `\udxxx`, which Python cannot encode. A rule that derives from the form refuses its input rather than
     throw: `FAC-SEM-039` flags the `sourceKey`, `FAC-SEM-035` a table or column name. Three settings-form refusals join
     the shared vectors.
- **Why:** the organization edition's v2 slice and the operator's decisions of 2026-10-08 (OD-1, N4, R10-L1, R06-M1,
  R06-M6, R06-M7, R10-M2) left these fields owed by DEC-0030 (CON-OE-01); v4 §12 adds the result and the run id
  (its D4). Checked against the open/private split of 2026-10-07 (J10): every field describes an account, a machine,
  a run or a purpose; none assesses a person, results carry no user, and per-person usage leaves a receiver only as
  day or period sums. The audit found an ack definition the code and the text disagreed on (F-B-108) and a claim no
  rule checked (F-B-107). CT-25: Python cannot encode the bytes the settings form wrote, so a signer and a verifier in
  the two languages disagreed.
- **Compatibility:** Additive in schema for a receiver at its next pin: optional fields, two new core kinds (which a
  reader at an older pin already accepts as unknown kinds under `extData`) and a new schema. A collector sends
  `account` and `run.root` only to a receiver that pinned this decision, since an older `telemetry-event` closes the
  envelope. Tightening, each with what a consumer does: an ack no longer moves over check-in drops (a receiver
  recomputes acks; none is deployed); `FAC-SEM-067` narrows what a receiver serves (the first organization server
  builds its views to it), and it now also refuses an unnamed `activity.*` scope and any `activity.results` read keyed
  on a person, and `activity.raw` served to another person excludes usage and cost; the settings form throws on a lone
  surrogate — no Python peer could encode one, but a backup, policy, key set or `sourceKey` that a TypeScript-only
  signer wrote with a lone surrogate in a table, column or key name verified before and is now refused (cells were
  already refused); the positive access log now reads usage per day. `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/activity.md`, `docs/specification/devices.md` (pending ranges, `re_enrolled`),
    `docs/specification/conformance.md` (register, canonical forms);
  - schemas: `schemas/activity-common.schema.json`, `schemas/telemetry-event.schema.json`,
    `schemas/access-log.schema.json`, `schemas/activity-notice.schema.json` (new), `schemas/device-health.schema.json`;
  - code: `src/activity-rules.ts`, `src/device-rules.ts` (pending ranges), `src/canonical.ts`, `src/settings-backup.ts`;
  - fixtures: `fixtures/catalogue.json`, `fixtures/positive/telemetry-event-*`, `fixtures/positive/activity-notice-*`,
    `fixtures/positive/access-log.json`, `fixtures/negative/telemetry-event-*`, `fixtures/negative/activity-notice-*`,
    `fixtures/semantic/access-log-disclosure-*`, `fixtures/semantic/telemetry-event-violation-other-day.json`,
    `fixtures/vectors/canonical.json`;
  - tests: `test/activity-rules.test.ts`, `test/canonical.test.ts`, `test/settings-backup.test.ts`,
    `test/rule-tolerance.test.ts` (new), `test/positive-sweep.test.ts`, `test/schema-compilation.test.ts`; floors in
    `vitest.config.ts` and `docs/evidence/specs/2026-10-11-board-waves/coverage-baseline.md`;
  - docs: `CONTEXT.md`, `docs/DOCMAP.md`, `docs/backlog.md` (CT-04, CT-11, CT-25), the handoff
    `docs/handoffs/2026-10-12-activity-devices.md`.
- **Not decided here:** the minimum cell stays k = 3 (DEC-0030); the first organization server's own floor of 5 is its
  stricter choice, not the contract's; which scopes beyond `activity.raw`, `activity.presence` and `activity.usage` a
  receiver names; a summary cell of results.
- **Source:** CON-OE-01 in fabric-workspace `docs/reports/2026-10-08-org-architecture-v2/plans/fabric-agent-contract.md`
  (at `7c9f134`) and its crosswalk to v4 (`CROSSWALK-v4.md`, CON-OE-01 kept); the open/private split
  `docs/reports/2026-10-07-wave1-open-private-split/README.md` (J10); the first organization server's target
  architecture v4 at `9c6a780`, §2 rule 10, §9, §12; the board-waves inventory F-B-102, F-B-107, F-B-108, CT-25,
  V4-RUN-RESULT (`docs/evidence/specs/2026-10-11-board-waves/inventory.json`), packet P3-02. DEC-0052 and `FAC-SEM-067`
  were reserved by git CAS (`agent_sync.py reserve --key w3-p3-02-activity-20261012 DEC`, `--key
  w3-p3-02-sem-access-log-20261012 SEM`); this file, `conformance.md` and `backlog.md` were edited under git leases;
  the record plane is `fs`.

### DEC-0053 — Devices amended: verification-time key validity, bound users, organization policy keys, expiry and collection start, a certified root, ES256 and device keys by role

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: a collector and Project
  Observatory's node judge policy keys at verification, keep locks after expiry, decide by `FAC-SEM-068`, report
  `components[]` and `records`, and enroll with `deviceKeys`; the first organization server, as organization server,
  binds the proven user, states `collectionStart`, signs key sets in its root's algorithm and, for organizations a
  vendor hosts, delivers the root's certification (backlog CT-04). The relay protocol (DEC-0047, reserved) builds on
  the `#kem` key and the check-in's `records`.
- **Annotated (2026-10-12):** item 8 tightened by DEC-0056 (an enrollment that lists `deviceKeys` lists exactly one `#sig` and at most one `#kem`), and item 9 extended by it (an optional `records.estateRecord.digest`).
- **Amends:** DEC-0031 (items 1, 3, 4 and 7). Implements CON-OE-12 as the v4 crosswalk keeps it and the first
  organization server's target architecture v4 §12 row "DEC-0031: `platform-keystore` device keys; ES256
  `policyRootKey` form; check-in carries the record revision, heartbeat, delta and leases" (commit `9c6a780`), and closes
  F-B-101, F-B-103…F-B-106, F-B-109 and F-B-114.
- **Decision:** in [devices](specification/devices.md) unless named otherwise —
  1. **A policy key is judged when the device verifies (F-B-106).** The trusted keys are those of the current key set
     valid on the device's clock at verification (`FAC-SEM-041`'s input `at`), never at the `issuedAt` the signer
     chose, and a policy is never issued before the one the device holds for its layer. This replaces DEC-0031 item 7's
     "valid at the policy's `issuedAt`": a policy signed under a key that has since expired is refused, and the server
     signs again.
  2. **The bound user is the proven one (F-B-105).** An SSO certificate binds the user the `Authorization` proof names;
     a token certificate binds a user only when the token names that person (`FAC-SEM-044`'s inputs `proof.userId`,
     `token.userId`).
  3. **No path in free text (F-B-104).** `device-common#/$defs/detail` refuses a slash, backslash or tilde at the start
     of a word anywhere in the line, a drive letter, an encoded slash and the home directory's slash and dash forms.
     F-B-103: a hashed branch is `hmac-sha256:`. F-B-109: the reader row of a device applying policy names
     `FAC-SEM-046`. F-B-101's ten branches each have a test that fails without them.
  4. **Organization policy keys** (CON-OE-12): `accounts.tenants`, `models.credentials` (organization API keys only —
     `credentialKind: api-org`, an `hmac-sha256:` fingerprint, data classes; never a subscription or a person's key),
     `models.personal_key_sharing` (absent means forbidden), `workspace.folders` (relative to home, never naming a
     user) and `machine.mode` (`C` by default; `A` only from an mdm layer). Unset keys resolve to defaults
     (`POLICY_DEFAULTS`): `build_channel.allowed` `official`, `machine.mode` `C`, `models.personal_key_sharing`
     `forbidden` (`FAC-SEM-042`).
  5. **Expiry and collection start.** A delivered layer MAY carry `expiresAt`: after it, locks stay, and grants, remote
     execution and a person's key for others stop. A device collects only from its `collectionStart` — the notice's
     acknowledgement, or under device management the earlier of that and the mdm layer's `noticeDeadline` — which the
     enrollment and check-in responses state; an event that occurred before it is never uploaded. **`FAC-SEM-068`**
     (`device-action`, receipt SEM-0068): a device's decision is the one its policy gives (`expectedDecision`).
  6. **A certified root.** When the installer pins offline root keys, the enrollment's root key carries a
     `rootCertification` by a pinned key, or by a delegation key whose certificate of at most 30 days a pinned key
     signed and whose id the pinned key's `delegationRevocations` do not name, all checked at enrollment
     (`device-root-certification.schema.json`, signed over RFC 8785). With nothing pinned, the organization's root is
     its own. **`FAC-SEM-069`** (receipt SEM-0069). This is CON-OE-12's offline-root counter-signature as v4 narrows
     it: a vendor's offline root counter-signs only the organizations it hosts (v4 §11, §20 V2-13).
  7. **ES256 beside Ed25519 for the root key.** `policyRootKey.alg` is `ed25519` (default) or `es256`; a key set is
     signed and verified in its root's algorithm, and every signed document here names its algorithm and is verified
     only in it (`verifyWith`). Policy signing keys stay Ed25519. This decision is the contract's own: Fabric's ES256
     ruling (its D2, ADR-0144) covers delegation tokens, not device policy.
  8. **Device keys by role.** Beside the Ed25519 device key DEC-0031 admits, P-256 keys held in the platform keystore:
     `deviceKeys` lists a signing key as `<device.id>#sig` (ES256 or Ed25519) and a key-agreement key as
     `<device.id>#kem` (ECDH over P-256 only), never one key in both roles (`FAC-SEM-044`). v4's device key, a
     non-extractable `ecdsa-p256` key in the `platform-keystore`, was already admitted; it is recorded as the target
     without a schema change. **Every P-256 public key is validated by SEC 1 §3.2.2** — not the point at infinity,
     coordinates in range, on the curve (`isValidP256Key`, `src/p256.ts`, vectors `fixtures/vectors/p256.json`) — and
     every Ed25519 key still passes the small-order check (DEC-0045).
  9. **Check-in fields.** `components[]` (name and version); `records` — the estate-record revision applied, the latest
     heartbeat, the revocation delta's head applied (`sequence`, `sha256`) and the leases held — and the response's
     `records`, carrying the heartbeat, the delta and leases unchanged. Fields only: their shapes are the relay
     protocol's (DEC-0047, reserved). Health reason `re_enrolled` carries `gapSeconds` and `count`: posture, not tamper
     evidence (CON-OE-01).
- **Why:** the audit found a key-validity rule a leaked expired key could pass (F-B-106), a bound user no rule
  compared with the proof (F-B-105) and path forms the detail pattern let through (F-B-104). CON-OE-12 owed the
  organization edition's policy keys, expiry, collection start (the operator's N9) and the root's counter-signature (N7,
  R10-M3); v4 §2 rule 12 sets algorithms by role, P-256 for hardware-held keys. The relay protocol needs a key-agreement
  key that is never a signing key. J10: every key describes an account, a machine or a folder relative to home; none
  assesses a person.
- **Compatibility:** Additive in schema: new optional policy keys and fields, a new schema, `es256` beside `ed25519`.
  Tightening, each with what a consumer does: a policy whose key expired before the device verifies is refused (the
  server re-signs under a current key); an SSO or token certificate must bind the proven user; a detail string with a
  path inside it is refused (a collector strips paths from errors); an unset `build_channel.allowed` now resolves to
  `official`, so an organization's device refuses an unofficial build unless a layer says `any`; a device that pinned
  an offline root refuses an uncertified root, and a delegated certification without the offline root's revocation
  list, or with one issued more than 7 days before enrollment. Nothing is deployed against DEC-0031 yet (CT-04), so no consumer
  breaks in the field. `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/devices.md`, `docs/specification/conformance.md` (register, canonical forms, readers);
  - schemas: `schemas/device-common.schema.json`, `schemas/device-policy.schema.json`,
    `schemas/device-enrollment.schema.json`, `schemas/device-check-in.schema.json`, `schemas/device-key-set.schema.json`,
    `schemas/device-root-certification.schema.json` (new);
  - code: `src/device-rules.ts`, `src/p256.ts` (new);
  - fixtures: `fixtures/catalogue.json`, `fixtures/positive/device-*`, `fixtures/negative/device-*`,
    `fixtures/semantic/device-*`, `fixtures/vectors/p256.json`;
  - tests: `test/device-rules.test.ts`, `test/p256.test.ts` (new), `test/rule-tolerance.test.ts` (new),
    `test/positive-sweep.test.ts`, `test/schema-compilation.test.ts`; floors in `vitest.config.ts` and
    `docs/evidence/specs/2026-10-11-board-waves/coverage-baseline.md`;
  - docs: `docs/evidence/sources.md` (TUF v1.0.37, RFC 7518, SEC 1 and SEC 2), `docs/handoffs/2026-10-08-activity-telemetry.md`
    (F-B-114), `CONTEXT.md`, `docs/DOCMAP.md`, `docs/backlog.md`, the handoff
    `docs/handoffs/2026-10-12-activity-devices.md`.
- **Not decided here:** attestation formats (OQ-0010, deferred: the first organization server answers it); the shapes
  of the heartbeat, the revocation delta, the leases and sealed envelopes (DEC-0047); the organization root as a pair of
  keys (v4 §3) and its replacement, beyond one `policyRootKey` per enrollment; how the organization's fingerprint salt
  reaches a node; ES256 policy signing keys in a key set.
- **Source:** CON-OE-12 in fabric-workspace `docs/reports/2026-10-08-org-architecture-v2/plans/fabric-agent-contract.md`
  (at `7c9f134`) and `CROSSWALK-v4.md` (CON-OE-12 changed); the first organization server's target architecture v4 at
  `9c6a780`, §2 rule 12, §7, §11, §12, §20; TUF v1.0.37, RFC 7518 and SEC 1 v2 in the [source ledger](evidence/sources.md);
  the board-waves inventory F-B-101, F-B-103…F-B-106, F-B-109, F-B-114, V4-DEVICE, packet P3-02. DEC-0053 and
  `FAC-SEM-068`, `FAC-SEM-069` were reserved by git CAS (`agent_sync.py reserve --key w3-p3-02-devices-20261012 DEC`,
  `--key w3-p3-02-sem-{device-action,root-certification}-20261012 SEM`); this file, `conformance.md` and `backlog.md`
  were edited under git leases; the record plane is `fs`.

### DEC-0055 — The estate record, `estate-record/1`: whole revisions chained by digest, keys by role, placements by reference, signed by a passkey

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: Fabric's hub drafts revisions,
  runs the signing ceremony and certifies hub keys (backlog CT-19); Project Observatory's node verifies each revision
  before applying it, installs and fills only what the record places, and reports the applied revision in its check-in
  (CT-20); the relay serves the latest revision by digest (DEC-0047, reserved).
- **Annotated (2026-10-15):** amended by DEC-0084: the operator's NET-3 settles D3 for a personal estate (the hub's own Ed25519 key certified as `hubKey`, the hub holds a private key); the enrollment ceremonies, the estate fingerprint and who revokes a solo estate's machine are `docs/specification/ceremonies.md`'s; a `device-key` revocation names a kid or a key reference `<kid>@sha256:<hex>` (`FAC-SEM-076` reads both); `FAC-SEM-114` (what a revision drops it revokes) joins the chain, and `verifyEstateRecord` runs it with a parent.
- **Annotated (2026-10-13):** amended by DEC-0076: `FAC-SEM-076` keys share grants and `grant` revocations by the normal form of the grant's id (`docs/specification/identifiers.md`).
- **Annotated (2026-10-13):** amended by DEC-0082: a placement gains `context` (absent: `personal`) and, in an organization's context, `grant`; a secret placement gains `context`; `FAC-SEM-074` places an agent once per (machine, `agentRef`, context) and `FAC-SEM-075` a slot once per (`agentRef`, slot, context); `FAC-SEM-110` and `FAC-SEM-111` join the record's rules (`docs/specification/contexts.md`).
- **Annotated (2026-10-12):** ER-10's window admits a revision from 60 s before `issuedAt` (the clock skew every
  relay time allows, `CLOCK_SKEW_SECONDS` in `src/rfc3339.ts`), not from `issuedAt` itself — DEC-0066. This text is
  unchanged; `verifyEstateRecord`, estate-record.md and `fixtures/vectors/estate-record.json` carry the skew.
- **Implements:** the first organization server's target architecture v4 (commit `9c6a780`) §12 row "`estate-record/1`:
  machines (device key, hub `kid` certificate), packages per machine, secret placements, share grants, revocations,
  revision; passkey-signed", with §3's noun, §6 Paths 2, 6 and 7, and §7's estate authority and freshness. Closes
  V4-ESTATE-RECORD (packet P3-03).
- **Decision:** in [estate record](specification/estate-record.md) —
  1. **A revision is a whole record, chained by digest.** `revision` is 1, then the parent's plus one; `parent` is the
     parent's `digest`, absent exactly in revision 1; a revision continues its parent's `estate`, is never issued
     before it, and keeps every revocation the parent carries (`FAC-SEM-072`; `verifyEstateRecord` refuses a revision
     that breaks any of these as `broken-chain`, so a passkey cannot quietly un-revoke a machine). Adding or removing a machine, placing
     or moving an agent, placing a secret, granting a share and revoking anything is each a new revision (v4 §6, §7).
  2. **The digest is RFC 8785.** `digest` is `sha256:` and the hex SHA-256 of the RFC 8785 form of the record without
     `digest` and `signature` (`estateRecordDigest`; DEC-0043's register). A record is valid from `issuedAt` to
     `validUntil`, at most 30 days later (v4 §7 "the estate record 30").
  3. **Authorities are passkeys.** Each lists its WebAuthn `credentialId`, `alg` (`ES256` or `EdDSA`), public JWK, the
     dedicated signing `rpId` and pinned `origins`. Revision 1 verifies under a passkey the machine pinned at
     enrollment; every later revision under a passkey its parent lists. A P-256 key passes SEC 1 §3.2.2
     (`isValidP256Key`), an Ed25519 key the small-order check (DEC-0045); no user handle is recorded (`FAC-SEM-073`).
  4. **Machines carry keys by role.** Each machine names its device `id` (never a human name; the schema refuses
     `name`, a departure from v4 §3's *Machine*: the name a person sees stays with the node and Observatory), DEC-0053's `deviceKeys` — exactly one `<id>#sig`, at most one `<id>#kem`, never one key in both roles —
     and a `hubKey` certificate: the passkey-signed binding of one hub `kid` and public key to that machine, never
     certified for two machines, never of small order (`FAC-SEM-073`). A delegation verifier that reads the estate
     record trusts a `kid` only while a current revision certifies it.
  5. **Packages are placed by `agentRef`, digest and publisher key.** A machine's `packages[]` names the agent
     (DEC-0050), the placed version's package digest and the `publisherKid` in the record's `publisherKeys`; an agent
     is placed once per machine (`FAC-SEM-074`). `placementTrust` gives `verifyPackage` (DEC-0051) the key the record
     pins, and kind `estate-placement` checks that an installed package is the one placed. This settles a difference
     inside v4: Path 2 places an agent by "its `agentRef`, publisher key and a ceiling", "not a digest", while the §12
     row lists packages per machine; until a ceiling is defined, every new version is a new revision.
  6. **Secrets are placed by reference.** `secrets[]` is `{agentRef, slot, from}`: a slot of a package placed on that
     machine, filled from the vault of a machine of the record. No member can hold a value (schema, DEC-0013), none is
     shaped like a credential (`src/secret-shape.ts`), and the package declares the slot (`FAC-SEM-075`). The value
     travels sealed to the machine's `#kem` key, never in the record.
  7. **Share grants and revocations.** A share grant is DEC-0039's grant with `principalKind: external`, signed once into
     the record (v4 Path 7). A revocation names its `kind` (`authority`, `machine`, `device-key`, `hub-key`,
     `publisher-key`, `package`, `grant`), its `ref` and `revokedAt`; each is listed once and nothing the record revokes
     is listed in it: revocation outranks addition (`FAC-SEM-076`).
  8. **The signature is a WebAuthn assertion, verified offline.** W3C Web Authentication Level 3 (Recommendation of
     25 August 2026, pinned in the [source ledger](evidence/sources.md)). The challenge is SHA-256 of the RFC 8785 form of
     `{type: "estate-revision/1", digest}` (`estateChallenge`), so the assertion is bound to this record and to no other
     signature over the same digest. `verifyEstateRecord` checks, with no network, §7.2's client data (`type`
     `webauthn.get`, the challenge, a pinned origin, no `crossOrigin` and no `topOrigin`), the authenticator data
     (`rpIdHash`, UP and UV set, AT clear, BS only with BE) and the signature over `authenticatorData ‖
     SHA-256(clientDataJSON)` — DER for ES256 (§6.5.5, RFC 3279 §2.2.3), 64 bytes for EdDSA (RFC 8032). It does not
     check attestation, the authenticator's provenance, the signature counter, extension outputs, or the enrollment
     that pinned the first passkey; the specification says why for each. It refuses a passkey the parent revokes (a
     revision may revoke its own signer when it removes it: rotation), an unreadable clock first, and a record that
     breaks `FAC-SEM-072`…`FAC-SEM-076` (`rule-violation`). A machine applies a revision only when it is valid against
     the schema and this verifier accepts it; the verifier does not check the schema. Its refusals are rows ER-1…ER-11.
  9. **Algorithms.** Passkeys are `ES256` or `EdDSA`, each named in a field; anything else (RS256 among them) is refused.
     Hub and publisher keys are `EdDSA` until Fabric records D2, when `ES256` joins them additively. Device keys are
     DEC-0053's.
  10. **Rules:** `FAC-SEM-072` (the chain and the window), `FAC-SEM-073` (keys), `FAC-SEM-074` (placements),
      `FAC-SEM-075` (secret references), `FAC-SEM-076` (grants and revocations).
- **Why:** v4 makes three signed records the trust of the agent network — the package (DEC-0050/0051), the estate
  record and the organization record — and puts the person's passkey over the estate (§7). Machines must apply a
  revision without asking a server, so every check that binds an assertion to a record is offline, and what an
  assertion cannot prove is named rather than implied. J10: the record describes keys, machines, placements and grants;
  machines are named by id, no user handle is stored, a grant names its principal only because it authorizes them.
- **Compatibility:** Additive: a new schema, a new specification and new rule codes; nothing existing changes.
  `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/estate-record.md` (new), `docs/specification/conformance.md` (register, canonical forms,
    readers);
  - schemas: `schemas/estate-record.schema.json` (new);
  - code: `src/estate-record-rules.ts` (new), `src/webauthn.ts` (new), `src/semantic-rules.ts`;
  - fixtures: `fixtures/catalogue.json`, `fixtures/positive/estate-record-*`, `fixtures/negative/estate-record-*`,
    `fixtures/semantic/estate-*`, `fixtures/vectors/estate-record.json`;
  - tests: `test/estate-record.test.ts` (new), `test/positive-sweep.test.ts`, `test/schema-compilation.test.ts`,
    `test/rule-tolerance.test.ts`; floors
    in `vitest.config.ts` and `docs/evidence/specs/2026-10-11-board-waves/coverage-baseline.md`;
  - docs: `docs/evidence/sources.md` (WebAuthn Level 3, RFC 3279, RFC 8032's row),
    `docs/evidence/specs/2026-10-11-board-waves/brief.md`, `docs/specification/delegation.md` (DL-14),
    `docs/specification/package.md`, `docs/specification/devices.md`, `CONTEXT.md`, `docs/DOCMAP.md`, `README.md`,
    `docs/backlog.md`, the handoff `docs/handoffs/2026-10-12-w3-p3-03-estate-record.md` and `docs/handoffs/README.md`.
- **Not decided here:** Fabric's D3 (keys) is not recorded on Fabric's `main` (`5bf15e5c`); the record leaves open
  whether the hub key is the machine's `#sig` key or its own, but only partly: `hubKey` is Ed25519 until Fabric's D2,
  so v4's proposal of the hub signing with the ES256 `#sig` key cannot be certified before D2 (D2 and D3 are coupled
  here). Also open: whether the hub holds a private key, the estate's fingerprint and enrollment ceremony, and who
  revokes a solo estate's machine certificate. The ceiling within which a later version installs without a new revision
  (Fabric's ADR-0138 amendment D2b and the listing contract); the signing-challenge types and the signing RP as a
  contract; recovery by a printed code; the revocation delta and heartbeat (DEC-0054, reserved); the estate's windows
  per machine (window leases); `ES256` for hub and publisher keys (Fabric's D2).
- **Source:** the first organization server's target architecture v4 at `9c6a780` (§2 rules 6 and 12, §3, §6, §7,
  §12, §15 D3 and D4, §19); Fabric ADR-0144 item 6 (three signed records), read on Fabric `main` `5bf15e5c`; WebAuthn
  Level 3, RFC 3279, RFC 8032 and RFC 8785 in the [source ledger](evidence/sources.md); the board-waves inventory
  V4-ESTATE-RECORD, packet P3-03. DEC-0055 and `FAC-SEM-072`…`FAC-SEM-076` were reserved by git CAS
  (`agent_sync.py reserve --key w3-p3-03-estate-record-20261012 DEC`,
  `--key w3-p3-03-sem-estate-{chain,machines,packages,secrets,grants}-20261012 SEM`); this file, `conformance.md` and
  `backlog.md` were edited under git leases; the record plane is `fs`.

### DEC-0047 — The relay and the secret envelope: admission by device key inside the WebSocket, store-and-forward that never reports done, trust tiers from the signed sender, HPKE envelopes sealed to `#kem` (`fabric-relay/0.1`, `fabric-secret-envelope/1`)

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption:
- **Annotated (2026-10-26):** DEC-0134 decides the organization relay's handshake (relay.md OR-1 to OR-5); the relay's
  attestation status check is CT-162. OR-5 narrows item 6's T2 sentence: every member of an organization is T2 to every
  other on its relay, two enrollments of one owner included, not only "to a recipient of another owner". Item 9's
  `welcome` (`estateRevision` "always present", `deltaHead`, heartbeat) is an estate's relay's; an organization's
  relay welcomes with its member list instead (OR-2).
- **Annotated (2026-10-26):** DEC-0129 gives an organization's relay its admission set (`orgRelayAdmissionSet`, the
  member list `org-authority/1`); the organization relay's handshake stays open (CT-37).
- **Annotated (2026-10-15):** amended by DEC-0084: a relay opens a one-time pairing rendezvous that lives at most 600 s and carries `pairing-message/1` frames only, with one `abort` after both reveals (relay.md, *The pairing rendezvous*; its frame types are not decided); `relayAdmissionSet` subtracts a key revoked by its kid or its key reference `<kid>@sha256:<hex>` and reports a malformed reference (`unread`); F7: it admits a `#sig` key only under its own machine's kid `<id>#sig`, and a kid listed twice for neither (`bad-key`), as `FAC-SEM-073` says, even over a held record; an open session stands only while its kid maps to the key octets it was proven under (`sessionStands`, which amends DEC-0066's revalidation by kid), so a session proven under a replaced key ends; `estateEnvelopeContext` takes the applied delta entries' revocations (`extraRevocations`), so an envelope's sender key is refused once a delta revokes it. Shared vectors: `fixtures/vectors/relay.json` `admissionSet` (five new cases) and `session` (new).
- **Annotated (2026-10-13):** amended by DEC-0082: an envelope names no context, so a target's open context (`estateEnvelopeContext`) reads only personal secret placements, and an organization's instance fills its slot on its own machine (`FAC-SEM-075`), never by an envelope (`docs/specification/contexts.md`).
- **Annotated (2026-10-12):** the `Fabric-Relay-Request` wire form, which DEC-0047 left unspecified: base64url (no padding, canonical) of the RFC 8785 bytes of `{alg, kid, recipients, iat, sig}`, at most 8192 bytes (431 `too-large`), parsed strictly (400 `malformed`); 1–64 `#sig` recipients of at most 256 characters; a GET's signer must be a stored recipient, sign the stored list letter for letter and be in the current admission set; a PUT of a held blob with another list is 409 `recipients-mismatch` (a new code); the reference is `parseRelayRequest`/`verifyBlobRequest`, the vectors `fixtures/vectors/relay.json` `blobRequest` ([relay](specification/relay.md#blobs)).
  - the relay server, [passioncode-ai/relay](https://github.com/passioncode-ai/relay), implements the handshake and
    sessions from this text (its RLY-02) and runs the vectors;
  - Project Observatory's node is a relay client and opens envelopes into its vault;
  - Fabric's remote surfaces are clients. An amendment of Fabric ADR-0088 §3 naming `fabric-relay/0.1` is owed:
    nothing of it is on Fabric's main yet;
  - the hub carries T2 messages under DL-8, and the first organization server takes its organization record as the
    source of admission and keeps the presence rule (item 5).
- **Annotated (2026-10-12, CON-022):** this describes relay.md as it stood before DEC-0066. Item 7's open order and
  relay.md's were one order in two numberings: relay.md listed eleven steps, its 9 and 10 (the life, then `now < exp`)
  being item 7's 9, and its 11 item 7's 10. (DEC-0066 adds `replayed`/`sequence-reused` as relay.md's step 8, so relay.md
  now lists twelve: its 1–7 are item 7's 1–7, its 9–11 item 7's 8–9, its 12 item 7's 10.) Step 4's refusals are
  `unsupported-alg` for an Ed25519 sender key and `bad-key` for a key the record does not list, any other key that is
  not a valid P-256 key and an encapsulated key that fails SEC 1, as `openEnvelope` answers; relay.md's step 4 now names
  them. *Consequences / affects* also cover `test/relay-request.test.ts` (#60) and `src/webauthn.ts` (#59,
  `ef7573a`, the JWK key form).
- **Amended (2026-10-12) by DEC-0066:** items 2, 3, 4, 5, 7, 8 and 9 — low-S and strict instants, the close-code table
  and frames, one `unauthenticated` until the signer is proven with the estate compared inside `admit`, revalidation of
  open sessions, the recipient's own kid as `to` and the replay window, the envelope's sequence and mark, the blob
  check order, and where delta entries come from. `fabric-relay/0.1` and `fabric-secret-envelope/1` are amended in
  place; relay.md now lists twelve open steps.
- **Amends:** nothing. It is a new protocol under the DEC-0016 extension policy. It builds on:
  - DEC-0053's P-256 device keys by role (`<device.id>#sig`, `<device.id>#kem`);
  - DEC-0045's trust tiers (DL-25, DL-26);
  - DEC-0043's register of canonical forms (every signed or hashed document here is RFC 8785).

  It implements the relay half of the first organization server's target architecture v4 §12 row "secret envelope
  (sealed to a device key)", and the transport of its "revocation delta and timestamp heartbeat" row. The documents
  themselves are DEC-0054's.
- **Decision:** in [relay](specification/relay.md) unless named otherwise —
  1. **Roles.**
     - A relay admits machines, queues and delivers opaque messages, stores envelopes and blobs by digest, reports
       when a machine was last seen, and carries signed deltas and heartbeats unchanged.
     - It holds no authority. It never reads a body or a secret, decides a tier, signs anything a node relies on,
       reports a queued command done, or serves a signing page.
  2. **Keys.**
     - A relay participant's keys are P-256, two per machine, never one key in both roles.
     - **Its `#sig` is ES256 only.** devices.md admits an Ed25519 `#sig` for a device; a relay refuses one, and any
       `alg` other than `ES256`, as `unsupported-alg`. Every signed document names the algorithm in a signed field:
       `relay-auth/1`, `relay-blob/1` and the envelope header carry `alg: "ES256"`, and the message body is a JWS.
     - Every public key is validated before use by SEC 1 v2 §3.2.2 (`p256KeyRefusal` in `src/p256.ts`), one function
       that names the refusal and that `isValidP256Key` is expressed by. A key that fails is refused as `bad-key`.
     - A key reaches every check in either spelling: DEC-0053's base64 SEC 1 octets or a JWK (`p256Point`,
       `p256PublicKey`), with the same answers for both.
     - All signatures are ES256, raw `r ‖ s`.
     - Times are RFC 3339 UTC; one that does not parse to an instant is refused, never compared. A signed `iat` more
       than 60 s ahead of the verifier's clock is `not-yet-valid`, in admission, in a message body and in an
       envelope.
  3. **Transport.**
     - One WebSocket (RFC 6455) per connection to `/v1/connect`, with subprotocol `fabric-relay.v1`, over TLS 1.2
       or newer, TLS 1.3 (RFC 8446) SHOULD.
     - No credential travels in the URL or in an HTTP header.
     - UTF-8 JSON text frames of at most 1 MiB, each with `{v: 1, type, id}`
       ([`relay-frame.schema.json`](../schemas/relay-frame.schema.json)).
     - Unknown members are ignored. An unknown `type` is answered with `error` `unknown-type`.
     - Close codes: 1009 for a frame over 1 MiB, 1003 for a binary frame, 4401 after `unauthenticated`, 4403 after
       `not-admitted`, and 1001 after 90 s of silence (`CLOSE_CODES`, `IDLE_CLOSE_SECONDS`).
  4. **Admission** (`admit`). A machine answers `hello`'s nonce, within 10 s, with an ES256 signature over the RFC
     8785 bytes of `{type: "relay-auth/1", alg: "ES256", relay, nonce, estate, kid, iat}`. The relay admits it only
     when all of these hold:
     - the protocol is this one, and `alg` is `ES256`;
     - `iat` is an instant at most 60 s old and at most 60 s ahead (`not-yet-valid` beyond that);
     - the nonce is this connection's own, and is used once;
     - `kid` is in the admission set;
     - the signature verifies.

     It then attributes every later frame on the connection to that `kid`.
     - **The admission set** is the set of `#sig` keys of the machines in the estate record the relay holds,
       minus revoked machines and keys (`relayAdmissionSet`). It is not authorization.
     - **Only from a verified revision.** The relay pins the estate's first passkeys when it is set up for the
       estate, the same act as a machine's enrollment pin. It applies a revision only when it is valid against the
       schema and `verifyEstateRecord` accepts it against the revision it holds (revision 1: against the pinned
       passkeys). A refused revision changes nothing, and a relay never starts with a configured set.
     - **Fails closed.** When the held revision's window ends, the relay admits no new `auth` until a newer verified
       revision arrives; open sessions end at their next re-authentication, and queued mail stays until its `ttl`.
       Presence and `lastSeen` follow the same verified set.
     - **No organization record yet.** An organization's relay has no admission source of its own until
       `org-authority/1` (Fabric D8) is decided.
     - `relayAdmissionSet` takes the schema check from its caller, which MUST pass the validator of
       `estate-record.schema.json`; `() => true` is not conformant.
  5. **Messages.**
     - `send` → `accepted {msgId, seq}` → `deliver {from, msgId, seq, body, sentAt}` → `ack {seq}`.
     - Delivery is at least once. A repeated `msgId` from the same sender within its `ttl` answers its first `seq`.
     - `ttl` is 1 s to 7 days and bounds only the mailbox. A body is at most 765 KiB decoded, so the largest frame
       around it fits 1 MiB.
     - **The body is end to end:** a compact JWS (`ES256`, `typ: fabric-relay-message+jwt`) over the RFC 8785 payload
       `{type, from, to, msgId, iat, exp, payload}`. `exp` is signed: the recipient judges the message's life by it,
       at most 7 days after `iat`, never by the frame's `ttl`. A recipient (`verifyMessageBody`) refuses a body whose
       signed `from`, `to` or `msgId` differs from the frame's, and names `not-yet-valid`, `lifetime-too-long` and
       `expired`.
     - **A relay never reports a command done.** Only the recipient's own signed message back reports an outcome
       (Fabric ADR-0088).
     - Presence frames give `{kid, state, lastSeen}`, and **only to machines of the same owner** (J10/OD-1). An
       organization's relay sends no presence from one member to another.
  6. **Trust tiers follow the signed sender, never the connection.**
     - Relay traffic is never T0.
     - **T1** is a verified `from` that is an enrolled machine of the recipient's **same owner** (DL-25), current
       and not revoked (DL-26).
     - **T2** is anything else (DL-8): a machine listed only in an organization record, to a recipient of another
       owner, and a body signed by an outsider and forwarded by a T1 session.
  7. **The secret envelope** (`fabric-secret-envelope/1`,
     [`secret-envelope.schema.json`](../schemas/secret-envelope.schema.json), `src/secret-envelope.ts`).
     - **Seal:**
       - HPKE base mode, DHKEM(P-256, HKDF-SHA256) / HKDF-SHA256 / AES-128-GCM, `[16, 1, 1]`, checked against RFC 9180
         §A.3.1;
       - recipient: the target's `#kem` key;
       - `info`: the ASCII bytes `fabric-secret-envelope/1`;
       - additional data: the RFC 8785 header `{type, alg, suite, recipient, sender, agentRef, slot, placement, iat,
         exp, enc}`: a slot is named with its agent, since one slot name can belong to two agents.
     - A sealer refuses a recipient kid without `#kem` and a sender kid without `#sig`.
     - The sender signs `{header, ct}` with its `#sig` key. The envelope is named by
       `sha256:<hex of its RFC 8785 bytes>`.
     - **A target opens an envelope only when all of these hold, checked in this order** (a refusal names the first
       that failed; relay.md and `openEnvelope` keep the same order):
       1. it is well formed, its times real instants (`malformed`);
       2. `alg` is `ES256` (`unsupported-alg`);
       3. the recipient is its own `#kem` (`wrong-recipient`);
       4. the sender's key is P-256 and it and the encapsulated key pass SEC 1 (`unsupported-alg`, `bad-key`);
       5. the signature is 64 canonical bytes and verifies (`bad-signature`);
       6. the latest estate-record revision the target verified and applied (DEC-0055) places `(agentRef, slot)` on
          it from the sender's machine (`sender-not-allowed`);
       7. `placement` is at least the revision from which that placement holds unchanged and at most the latest
          revision the target has applied: a newer one is fetched and verified first (`placement-stale`);
       8. `iat` is at most 60 s ahead (`not-yet-valid`);
       9. the life is more than zero and at most 24 hours (`lifetime-too-long`), and not over (`expired`);
       10. HPKE opens (`cannot-open`).

       `estateEnvelopeContext` derives the holder, the sender's key and the current placement from the target's
       applied revisions.
  8. **Blobs.**
     - `PUT`/`GET /v1/blobs/<digest>` carry `Fabric-Relay-Request`: an ES256 signature over the RFC 8785 bytes of
       `{type: "relay-blob/1", alg: "ES256", relay, method, digest, recipients, iat}`. It is accepted within 60 s and bound to the
       method, the digest and the recipients, so it is not a bearer credential.
     - A blob's name is always `sha256:` and the hex SHA-256 of its bytes. A package travels as its archive's
       bytes; its DEC-0050 content digest is not its blob name.
     - The relay recomputes every digest.
     - A blob is kept until every recipient fetched it, or until 7 days pass.
  9. **Revocation travels, it is not defined, here.**
     - `welcome` carries `deltaHead {sequence, sha256}`, the shape of DEC-0053's check-in
       `records.revocationDelta`, so a node reports it as it came, and `estateRevision`, the verified revision (1 or
       more) the relay admits from — always present, since a relay without one admits nobody.
     - New deltas and heartbeats are pushed to every connected machine they name. A node behind the head asks with
       `delta-query`.
     - A relay can delay revocation, which the signed heartbeat exposes, but it cannot forge it. The documents, keys,
       head hash, the 72-hour rule and their vectors are DEC-0054.
     - The check-in's `records` of DEC-0053 carry that head unchanged. Their `heartbeat` is DEC-0054's document,
       and `leases` are the window lease's own decision.
  10. **Rules:**
      - `FAC-SEM-070`: an envelope is sealed to a `#kem` key by a `#sig` key under `ES256`, with the admitted suite,
        a life of more than zero and at most 24 hours, and a valid encapsulated key;
      - `FAC-SEM-071`: an `auth` frame names a `#sig` key, `ES256` and this protocol; a `send` frame addresses a
        `#sig` key, with a bounded `ttl` and body.
- **Why:**
  - **The operator decided D6 on 2026-10-12:** the relay gets its own open repository, with Project Observatory as
    code owner, and self-hosting stays (V2-21).
  - **A relay is the one component every person's machines, and later colleagues' machines, must pass through.**
    Putting authority anywhere but in end-to-end signatures and seals would make its compromise the estate's. With
    this text, a compromised relay can deny service and see metadata, nothing more.
  - **The two-key rule and SEC 1 validation close the invalid-curve attack on ECDH and the confusion of a signature
    with a seal.** The envelope reuses a published, vector-checked construction (RFC 9180) rather than a bespoke one.
  - **ES256 only for the relay, departing from devices.md's Ed25519 `#sig`** (in the way DEC-0053 item 7 departs):
    the platform keystore holds P-256, and the envelope's `#kem` is P-256 anyway, so one curve and one verifier serve
    every relay participant. The algorithm is named in each signed document, as the wave-3 rule asks.
  - **The owner's rulings on the review of #53:** T1 is DL-25's same owner; presence stays within one owner; ES256
    with a signed `alg`; one `{sequence, sha256}` head shape; not-before; a signed `exp`.
- **Compatibility:** Additive under DEC-0016:
  - two new schemas (`relay-frame`, `secret-envelope`), two rule codes, three vector files (`relay.json`,
    `secret-envelope.json`, and `p256.json` extended with refusal names and JWK cases);
  - `isValidP256Key` keeps its answers for every byte string, and now also accepts a JWK.

  `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/relay.md` (new), `docs/specification/conformance.md` (rule register, canonical forms),
    `docs/specification/devices.md` (the `#kem` and `records` passages point here and to DEC-0054);
  - schemas: `schemas/relay-frame.schema.json`, `schemas/secret-envelope.schema.json`,
    `schemas/device-check-in.schema.json` (descriptions of `records` only);
  - source: `src/relay.ts`, `src/secret-envelope.ts`, `src/relay-rules.ts`, `src/p256.ts` (`p256KeyRefusal`),
    `src/semantic-rules.ts`;
  - vectors and fixtures: `fixtures/vectors/{relay,secret-envelope,p256}.json`, `fixtures/semantic/relay-*.json`;
  - tests: `test/relay.test.ts`, `test/secret-envelope.test.ts`, `test/relay-rules.test.ts`, `test/p256.test.ts`,
    `test/schema-compilation.test.ts`;
  - docs: `docs/DOCMAP.md`.
- **Not decided here:**
  - the guest OAuth page and its binding ceremony;
  - attestation formats (OQ-0010);
  - mailbox quotas;
  - whether a self-hosted relay federates with the hosted one;
  - the documents of the revocation delta and heartbeat (DEC-0054);
  - the window lease.
- **Source:**
  - The operator's D6 decision and its relay transport ADR, private to Project Observatory, agreed with Fabric's,
    the knowledge base's and the first organization server's owners. Its public part is relay ADR-0001.
  - The contract owner's review of the draft (relay `docs/protocol/dec-0047-draft.md`), with its answers on P-256
    keys, the DEC-0054 split and the admission removal point.
  - RFC 9180, RFC 8785, SEC 1 v2, RFC 7518, RFC 6455 and RFC 8446.
  - The contract owner's review of #53 and rulings (2026-10-12).
  - The target architecture v4 at `9c6a780`, §4, §7 and §12.
  - The board item `V4-SECURE-TRANSPORT`.
  - DEC-0047 was reserved by git CAS (`agent_sync.py reserve --key relay-protocol-20261012 DEC`), and `FAC-SEM-070`
    and `FAC-SEM-071` by `--key relay-protocol-20261012-sem-{envelope,frame} SEM`. This file and `conformance.md` were
    edited under git leases of run `project-observatory-3d-relay`; the record plane is `fs`.

### DEC-0058 — Operator-channel status invariants: a channel nobody receives on is only `degraded`, and every state invariant has a killing fixture

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: channel-status producers — every agent
  that publishes the operator-channel status, and the fabric-agent-adapter's kits when they serve the status (a new
  adapter row under backlog CT-18) — report a channel whose receiver is missing as `degraded` with `receiver-missing` and `receiver.lease: none`, also while it waits for a
  link code, and never as `unlinked`.
- **Amends:** DEC-0035, whose *Compatibility* said `operator-channel-status.schema.json` was unchanged: this decision
  tightens that schema. DEC-0034's status table gains the lease `unlinked` requires. Closes F-B-204, F-B-205 and
  F-B-219 of the board-waves inventory (node N09, backlog CT-13).
- **Decision:** in the [operator channel](specification/operator-channel.md) and its status schema —
  1. **`unlinked` has someone receiving.** A status in state `unlinked` carries `receiver.lease` `held` or `elsewhere`,
     never `none` (schema, `unlinked` branch). A waiting channel nobody receives on is `degraded` with
     `receiver-missing` (OC-17), and the status table says so.
  2. **`receiver-missing` is one shape.** A status whose `reason.code` is `receiver-missing` has `state: degraded` and a
     `receiver` with `lease: none` (schema, an `if`/`then` on `reason.code`). OC-17's closing list names `unlinked`
     beside `linked`, `standby` and `off`: a missing receiver is never reported in any of them.
     `receiver.lease` reads `none` whenever the receiver is missing, even while a process still renews the lease (the
     not-draining condition). In the first 120 seconds after a lease stops being renewed the receiver is not yet
     missing: the last status stands and the lapse is never reported as `unlinked`; after 120 seconds the status is
     `degraded` with `receiver-missing`. The lease's schema description says the same.
  3. **Every state invariant has a fixture that kills it.** Negative fixtures for each required member of `linked`,
     `standby`, `unlinked` and `degraded`, the leases of `linked`, `standby` and `unlinked`, a present credential under
     `linked`, `receiver-missing` in a state other than `degraded`, with a held lease and without a receiver, the
     sixteen-chat limit and an `excluded.liftedAt` that is an absolute URL. `test/operator-channel.test.ts` removes
     each invariant from a copy of the schema (twenty-two mutants) and fails if no negative fixture is then accepted, and
     an identity mutant must let none through;
     one, `linked` without `receiver`, survived before this change, because the fixture of that name carried a receiver
     with lease `none`.
  4. **The glossary's *Addressed message*** names the one unaddressed input OC-15 honours: a bare `/link CODE` that
     matches the agent's own pending code.
- **Why:** the audit's probe (F-B-204) published the defect DEC-0035 was written for — on 2026-10-10 two bots had
  nobody receiving while their status said nothing — as a valid status in state `unlinked` with `receiver.lease:
  none`, and as `receiver-missing` with a held lease or no receiver at all, because the schema left both
  representable. F-B-205 removed eight state invariants one at a time and every test still passed: the schema stated
  them and nothing proved them.
- **Compatibility:** tightening under DEC-0016, `contractVersion` stays `0.1.0`. A status that reported a channel
  nobody receives on as `unlinked`, or `receiver-missing` with another lease or state, was already against OC-17's
  text and is now refused by the schema; the agent reports `degraded` instead. No positive fixture changes; one is
  added, a waiting channel nobody receives on. No semantic rule code is allocated.
- **Consequences / affects:**
  - spec: `docs/specification/operator-channel.md` (OC-17's closing paragraph, the `unlinked` row, the
    `receiver-missing` code, *Not decided here*);
  - schema: `schemas/operator-channel-status.schema.json` (the `unlinked` branch, the `receiver-missing` branch, the
    `state` description);
  - fixtures: `fixtures/positive/operator-channel-status-degraded-receiver-missing-unlinked.json`,
    `fixtures/negative/operator-channel-status-*` (seventeen new), `fixtures/catalogue.json`;
  - tests: `test/operator-channel.test.ts` (this entry, the boundaries, the mutants), `test/schema-mutants.ts` (new);
  - docs: `CONTEXT.md` (*Addressed message*), `docs/ux/scenarios.md` (SCN-012), `docs/backlog.md` (CT-13, CT-18),
    `docs/DECISIONS.md` (DEC-0034 and DEC-0035 annotated), the
    handoff `docs/handoffs/2026-10-12-w4-p4-03-channel-dashboard.md` and `docs/handoffs/README.md`.
- **Not decided here:** whether `off` may carry a `receiver` at all; reason codes other than `receiver-missing` keep an
  open vocabulary and constrain no lease.
- **Source:** the board-waves inventory F-B-204, F-B-205, F-B-219
  (`docs/evidence/specs/2026-10-11-board-waves/inventory.json`), packet P4-03. DEC-0058 was reserved by git CAS
  (`agent_sync.py reserve --key w4-p4-03-channel-dashboard-20261012 DEC`); this file, `conformance.md` and `backlog.md`
  were edited in the run's branch without a lease, by the wave-4 arrangement: the owner session takes those leases when
  it merges; the record plane is `fs`.

### DEC-0059 — Embedded dashboard amended: the appearance cookie per host or per store, a page applies only the fields it declares, an invalid declaration is not declared (`FAC-SEM-080`)

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: Fabric Dashboards consumes
  ED-9 `appearance` and validates the declaration, logging an invalid one once per load (its own row, filed by its
  session, under backlog CT-21); the fabric-agent-adapter's dashboard kit applies only the fields it declares, keeps the page's own saved value
  for a field it does not list and hides only the listed fields' controls, and its `check_service.py` keeps checking
  the declaration (a new adapter row under CT-18). Fabric Dashboards' FD-42 sentence that it "reloads only the pages
  that do not declare appearance" is superseded: a page that lists no field reads no cookie (CT-21).
- **Amends:** DEC-0036 (ED-6, ED-8, ED-9 and its *Not decided here*; its *Compatibility* said no semantic rule code is
  allocated, and this decision allocates one); DEC-0040's FB-6 and DEC-0045 item 9 (the `fabric_button` cookie takes
  ED-8's scope). Agreed with Fabric Dashboards' session (FD-37, its `main` `e1fdd64`).
  Closes F-B-214, F-B-215, F-B-216 and F-B-217 of the board-waves inventory (node N09, backlog CT-13).
- **Decision:** in the [embedded dashboard](specification/embedded-dashboard.md) —
  1. **ED-8, the cookie's scope.** The appearance cookie is set for the page's host in the store the page reads. A
     cookie is not isolated by port (RFC 6265 §8.5), so it is "per host in a shared cookie store; per service where
     the host gives each service its own store": every local service on `127.0.0.1` sharing one store reads and can
     overwrite one cookie, and Fabric Dashboards, which gives each service the partition `persist:svc-<key>`
     (`src/electron/policy.ts` `partitionFor`, `src/electron/views.ts`), carries it per service. **FB-6's `fabric_button` cookie** has the same scope: in a
     shared store an `owner=host` written for one local service hides the button of every local service on that host.
  2. **ED-6 follows ED-9's `appearance`.** A page takes from the cookie exactly the fields its declaration lists, hides
     only those fields' controls while the cookie is present, and keeps the others. A page that lists none — no
     `appearance`, no declaration, or an invalid one — takes nothing from the cookie and follows
     `prefers-color-scheme` only. (Fabric Dashboards already keeps that in agreement with the theme chosen in the app,
     `nativeTheme.themeSource`.) ED-8's reload sentence follows: a page that lists no field reads no cookie.
  3. **ED-9, an invalid declaration.** A host validates the value against
     `service-dashboard-extension.schema.json`, treats an invalid one as not declared (a legacy dashboard: host floor
     480, no carrier field) and reports it. **`FAC-SEM-080`** (`service-well-known`, receipt SEM-0080) reports it on the
     well-known document, once per schema error, at the extension key; the well-known schema cannot, because
     `extensions` is open. `hostView` in `src/dashboard-declaration.ts` is the reference reading, with vectors in
     `fixtures/vectors/dashboard-declaration.json` for a host's port (21 cases: the floors 359, 360, 480, 481,
     1280 and 1281, a valid floor beside a field named twice, and `360.0` given as raw JSON text).
  4. **Killing fixtures for the declaration (F-B-217):** a declaration without `minWidth`, a fractional one, one above
     1280, a theme or a carrier field twice, an empty `themes` and 33 themes. `test/embedded-dashboard.test.ts` removes
     each of ten constraints from a copy of the schema and fails if no negative fixture is then accepted; an identity
     mutant, which changes nothing, must let no negative fixture through.
- **Why:** ED-8 said the cookie lived "on the service origin", which RFC 6265 contradicts for every local service on
  one address (F-B-214). ED-6 bound every declaring page to both carrier fields while ED-9 let it declare a subset,
  so a subset had no conformant meaning (F-B-215). The audit's probe put `{minWidth: 99999, zoom: 3}` under the key
  and the well-known schema accepted it; a host computing `max(480, minWidth)` from it would give the page more than
  any window, and only the adapter's script checked it (F-B-216). Four schema constraints survived their removal
  (F-B-217). The three texts were agreed with Fabric Dashboards' session on 2026-10-12.
- **Compatibility:** under DEC-0016, `contractVersion` stays `0.1.0`. ED-8's change describes what a cookie already
  does. ED-6 narrows: a page that applied a field it did not list now falls short of ED-6 and lists it; a page that
  listed both is unaffected. `FAC-SEM-080` is new: a well-known document carrying an invalid declaration was
  schema-valid and stays so, and the checker now reports it; a host already treating it as not declared
  (Fabric Dashboards) is unaffected. `service-dashboard-extension.schema.json` changes only its descriptions.
- **Consequences / affects:**
  - spec: `docs/specification/embedded-dashboard.md` (ED-6, ED-8, ED-9, *How a page shows that it holds*, *Semantic
    rules* (new), *Not decided here*), `docs/specification/fabric-button.md` (FB-6),
    `docs/specification/conformance.md` (the register row);
  - schema: `schemas/service-dashboard-extension.schema.json` (descriptions);
  - code: `src/dashboard-declaration.ts` (new: `hostView`, `dashboardDeclarationRules`), `src/semantic-rules.ts`;
  - fixtures: `fixtures/negative/service-dashboard-extension-*` (seven new), `fixtures/semantic/service-well-known-dashboard-*`,
    `fixtures/vectors/dashboard-declaration.json`, `fixtures/catalogue.json`;
  - tests: `test/embedded-dashboard.test.ts`, `test/delegation-sealed.test.ts` (FB-6's scope), `test/rule-tolerance.test.ts`,
    `test/schema-mutants.ts`; the floor in
    `vitest.config.ts` and `docs/evidence/specs/2026-10-11-board-waves/coverage-baseline.md`;
  - docs: `docs/evidence/sources.md` (RFC 6265), `CONTEXT.md` (*Appearance carrier*), `docs/DOCMAP.md`,
    `docs/ux/foundation.md`, `docs/ux/flows.md`, `docs/ux/screens.md`, `docs/ux/scenarios.md` (SCN-021, SCN-022),
    `docs/backlog.md` (CT-13, CT-18, CT-21), the handoff `docs/handoffs/2026-10-12-w4-p4-03-channel-dashboard.md`.
- **Not decided here:** a per-service appearance choice for pages that share a cookie store; it needs another carrier
  (a cookie name per service, a message to the page). The host's picker stays Fabric Dashboards' screen.
- **Source:** Fabric Dashboards' session (FD-37), its `main` `e1fdd64`, on 2026-10-12; RFC 6265 in the
  [source ledger](evidence/sources.md); the board-waves inventory F-B-214…F-B-217, packet P4-03. DEC-0059 and
  `FAC-SEM-080` were reserved by git CAS (`agent_sync.py reserve --key w4-p4-03-dashboard-20261012 DEC`,
  `--key w4-p4-03-sem-dashboard-declaration-20261012 SEM`); this file, `conformance.md` and `backlog.md` were edited in
  the run's branch without a lease, by the wave-4 arrangement; the record plane is `fs`.

### DEC-0057 — Services on every system: one copy under any supervisor and its marker (CT-01), the lifecycle per system, the descriptor's hygiene and the Windows token-file reader

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: the adapter's kits read the
  marker in both forms and `task_xml`/`taskXml` write the argument (its row FAA-32); Fabric sets the marker when it
  starts a service as its supervisor; Project Observatory's node sets it and honours the wait; Fabric Dashboards shows a
  waiting copy as `duplicate` under launchd today, derives it from systemd's `MainPID` or through the node off macOS, and
  fixes its Windows token reader (a signed mask, unknown ACE types, SID case; board CT-21); every Windows token reader
  runs the new vectors.
- **Annotated (2026-10-13):** the pending receipt is in: the Task Scheduler does not restart a task whose action exits 75
  (the adapter's Windows CI run 38318280259, a task as the kit writes it with `RestartOnFailure` PT1M ×999: one start in
  260 s, Last Result 75), so under it the marked copy's in-process wait is the only recovery; service.md "One copy" says
  so. `S4U` and `SYSTEM` principals were not measured.
- **Annotated (2026-10-12):** its *Not decided here* item on the node — `lifecycle.manager: node` in the descriptor,
  `label`/`plist` beside it, the node's Install, Off, Uninstall and state read — is decided by DEC-0061.
- **Amends:** DEC-0015 (one copy; launchd as the only supervisor) and DEC-0032 (the supervisor per system, Windows
  paths and token files), additively under the DEC-0016 extension policy except where *Compatibility* says.
- **Decision:** in [service](specification/service.md) —
  1. **One copy (CT-01).** "No side effect without the lock on `service.lock`" and "a copy that does not get it exits
     75 with one sentence naming the holder's pid" stay. A copy whose start carries the supervisor marker MAY first wait
     for the lock in-process, at most 300 s, touching nothing (no port, no file written, no job resumed; it may read the
     lock), and take it if the holder leaves; when the wait runs out it exits 75 naming the holder. A copy started
     without the marker tries once and exits 75 at once. A copy that cannot learn the holder's pid says the holder is
     unknown (`holderPid: null` in `FAC-SEM-078`'s record). The holder keeps answering its well-known document for the
     whole wait, so the wait is never an outage; what a host shows of the waiting copy depends on the supervisor's pid:
     `duplicate` under launchd (Fabric Dashboards at `e1fdd64`), the same under systemd once a host compares
     `MainPID`, and nothing under the Task Scheduler, which has no supervisor pid, while the holder shows `ready`. How
     the copy spaces its tries is its own.
  2. **The supervisor marker** is the environment variable `FABRIC_SERVICE_SUPERVISOR=<manager>` or the argument
     `--fabric-supervisor <manager>` (also `--fabric-supervisor=<manager>`), after the executable and before any `--`;
     `<manager>` is exactly `launchd`, `systemd`, `task-scheduler` or `node`. The writer of the supervisor file writes
     it: the plist's `EnvironmentVariables`, the unit's `Environment=`, the task's `Arguments` — a task's `Exec` action
     has no environment. A host or node that starts a service as its supervisor sets it; a start by hand never does;
     a copy never infers supervision from its parent process. Only an empty variable counts as no marker. An argument with
     no value (followed by nothing, by `--` or by another `--…` flag, none of which it consumes) or an empty one is a
     marker that names no manager: beside a variable it disagrees; any value that names no manager leaves the copy
     unsupervised. A service's own argument parser accepts the flag in both spellings and ignores it beyond reading the
     marker. Markers that disagree (both forms with different values, or the argument
     twice) leave the copy unsupervised: it exits 75 at once, before it takes the lock and whether or not the lock is
     held, naming the markers. `supervisorMarker` and `lockWaitBudgetMs` (`src/service-supervisor.ts`) are the
     reference, with vectors; `FAC-SEM-078` checks a kit's record of a start against a held lock.
  3. **Supervisors per system (CON-OE-11).** DEC-0015's "launchd is the only supervisor", which DEC-0032 already made
     one per system, now reads: launchd (macOS), `systemd --user` (Linux), the Task Scheduler (Windows, with
     `MultipleInstancesPolicy` `IgnoreNew` recommended), and Project Observatory's node (`node.lifecycle`), which
     supervises the services it starts as its children on any system. The Supervisor row lists each one's marker.
     The descriptor's `lifecycle.manager` admits `node` by a later change (board CT-12, packet P4-02); this decision
     defines only the marker value.
  4. **The lifecycle per system (F-B-202, F-A-013).** Install, Code, State and Uninstall have a form for launchd,
     systemd and the Task Scheduler, and *Directories per system* fixes where data and configuration, logs and cache
     live: `~/Library/Application Support/<id>/`, `~/Library/Logs/<id>/`, `~/Library/Caches/<id>/` on macOS;
     `${XDG_DATA_HOME:-~/.local/share}/<id>/`, `${XDG_STATE_HOME:-~/.local/state}/<id>/logs/`,
     `${XDG_CACHE_HOME:-~/.cache}/<id>/` on Linux; `%LOCALAPPDATA%\<id>\` with `Logs\` and `Cache\` beneath it on Windows
     — the directories the adapter's `building-fabric-services` lifecycle reference already names (at `a124ecb`). On
     Linux data, logs and cache follow XDG's `XDG_DATA_HOME`, `XDG_STATE_HOME` and `XDG_CACHE_HOME`; configuration stays
     beside data on every system, by choice.
  5. **The descriptor names one supervisor (F-B-209):** `label` and `plist` are refused beside `systemd` and
     `task-scheduler` (beside `none` they stay valid, as DEC-0015 allowed). **A share in either slash is never local
     (F-B-207):** `localPath`, and so `FAC-SEM-012`'s executable, refuses `//server/…` and `/\server…`, which Windows
     reads as a share, beside the `\\server\…` it already refused. **Killing fixtures (F-B-206)** for DEC-0032's
     descriptor rules: a task beside another manager, a unit without `.service`, a task without its leading backslash,
     an unknown manager; and a test that the Supervisor row names every manager the schema admits.
  6. **The Windows token-file reader (F-B-210)** is a reference function, `windowsTokenAclProblem`
     (`src/windows-token.ts`), over what a reader has read — the file's flags, its owner SID, its ACEs — with vectors a
     port runs (`FAC-SEM-079`) and a row in *Clients and readers*. It makes explicit what the rule left open: SIDs compare
     case-insensitively on their `S`, and a sub-authority above 4294967295 is unreadable; the mask is the ACE's unsigned
     32-bit mask, converted first by a reader that reads it signed (.NET `FileSystemRights`), and an `allow` ACE whose mask
     is 0 grants nothing; an ACE of a readable type other than allow and deny (an object or callback ACE among them) is
     refused, and anything unreadable — a flag, an ACE type, a SID, a mask — is refused. (The marker's third reading,
     empty argument values, is item 2's.)
  7. **Wording (F-A-013, F-B-208):** service.md is the *Service extension*, local and remote; the diagram's edge goes to
     a supervisor; `FAC-SEM-024`'s row says "no local supervisor field (`label`, `plist`, `unit`, `task`)"; the
     placement description names launchd, systemd, the Task Scheduler or nothing; the operator-channel status's
     `degraded` description adds "or nobody receives (OC-17)", as operator-channel.md has it.
  8. **Rules:** `FAC-SEM-078` (one copy: what a copy does when the lock is held), `FAC-SEM-079` (a Windows token file
     the reader may read).
- **Why:** CT-01 waited on a decision since 2026-10-04: under launchd's `KeepAlive` or systemd's `Restart=always` an
  immediate exit 75 restarts every 10 s forever, and the Task Scheduler restarts a failed task a finite number of times
  (whether an exit 75 counts as a failure there is pending the adapter's Windows CI receipt, board CT-18), while the adapter's kits already waited up to 300 s under launchd and systemd. The marker could
  not stay an environment variable alone, because a Scheduled Task's action carries no environment (the `Exec`
  element, pinned in the [source ledger](evidence/sources.md)), so a Task Scheduler copy would never be marked. The
  lifecycle rows were macOS-only after DEC-0032, so a Linux or Windows writer had no install, upgrade or uninstall and
  no directories. The descriptor rules DEC-0032 added survived mutation, a descriptor could name two supervisors, and
  a forward-slash share passed `localPath`. DEC-0033 exists because a consumer's token reader got the rule wrong; a
  function and vectors let every port test against the same cases.
- **Compatibility:** The wait is a MAY: a copy that exits 75 at once still conforms, so the adapter's current pin
  conforms. Binding the port is now named as a side effect that needs the lock; the adapter's kits already take the
  lock before they bind. Kits at 0.18.0 read only the variable and only `launchd`, `systemd` and `task-scheduler`: a copy the node
  starts, or a Task Scheduler copy, exits at once until the kit reads the argument and `node` (FAA-32), which is the
  stricter behaviour. Two refusals narrow the schema: a descriptor naming launchd's `label` or `plist` beside `systemd`
  or `task-scheduler`, and a `localPath` starting `//` or `/\`. DEC-0032 already said a descriptor names one supervisor
  per system and that a share is never a local path, so a descriptor refused now broke DEC-0032's text already; the
  adapter at `a124ecb` writes `label` and `plist` only beside `launchd` (its sample service). The token reader's two explicit readings narrow
  nothing a writer produces: the writer's protected ACL has three allow ACEs with full control. `contractVersion` stays
  `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/service.md` (title, diagram, Lifecycle, *Directories per system*, *One copy*, *Windows
    token files*, the semantic-rules table), `docs/specification/conformance.md` (two reader rows, `FAC-SEM-078`,
    `FAC-SEM-079`);
  - schemas: `schemas/service-descriptor.schema.json` (one supervisor, the placement description),
    `schemas/service-common.schema.json` (`localPath`), `schemas/operator-channel-status.schema.json` (the `degraded`
    description);
  - code: `src/service-supervisor.ts` (new), `src/windows-token.ts` (new), `src/semantic-rules.ts` (the two kinds,
    `FAC-SEM-012`'s path);
  - fixtures: seven negatives `fixtures/negative/service-descriptor-*` (`fixtures/catalogue.json`), eleven
    `fixtures/semantic/service-lock-*.json`, vectors `fixtures/vectors/service-supervisor.json` and
    `fixtures/vectors/windows-token.json`;
  - tests: `test/service-supervisor.test.ts` (new), `test/windows-token.test.ts` (new), `test/service-rules.test.ts`,
    `test/rule-tolerance.test.ts`; floors in `vitest.config.ts` and
    `docs/evidence/specs/2026-10-11-board-waves/coverage-baseline.md`;
  - docs: `CONTEXT.md` (Supervisor, Supervisor marker), `docs/DOCMAP.md`, `docs/evidence/sources.md` (the `Exec`
    element, `MultipleInstancesPolicy`, systemd's `Environment=`, `launchd.plist(5)`, the XDG row), `docs/backlog.md`
    (CT-01 closed, CT-12, CT-18…CT-21), the UX chain (`docs/ux/foundation.md` ST-021, `docs/ux/flows.md` FLW-17,
    `docs/ux/screens.md` SCR-20, `docs/ux/scenarios.md` SCN-026), the handoff `docs/handoffs/2026-10-12-w4-p4-01-services.md` and
    `docs/handoffs/README.md`.
- **Not decided here:** `lifecycle.manager: node` in the descriptor, whether `label`/`plist` are refused beside it, and
  the node's Install, Off, Uninstall and state read (P4-02); a Windows service (administrator rights) as a supervisor, a
  Task Scheduler task that runs whether or not the user is logged on (a host's S4U or SYSTEM principal in v4 §5), and
  Linux lingering (`loginctl enable-linger`) so a user unit runs without a login, which the node's host units need; supervision of a
  remote placement (its platform's); the restart count a Task Scheduler writer sets.
- **Source:** agreed with Fabric's session (CO-238: points 1–5 as written, 300 s is enough; Fabric is not a supervisor
  today, its one background job runs under launchd; when it starts services it sets the marker for a supervised start
  and not for a manual one), with Fabric Dashboards' session (FD-37, its `main` `e1fdd64`: an outage is only `down`, no
  health answer for 15 s local or 60 s remote; a copy waiting for the lock shows `duplicate` provided the holder keeps
  answering for the whole wait; off macOS, supervision goes through Project Observatory's node) and with the adapter's
  session (its kits 0.18.0+: back-off from 0.5 s doubling to 30 s, at most 300 s, touching nothing, then exit 75 naming
  the holder's pid); the owner session ruled the argument form and the conflict, 2026-10-12. The first organization
  server's target architecture v4 (`docs/design/2026-10-12-target-architecture.md` at `9c6a780`), §2 rule 3 and §5
  ("`lifecycle.manager: node` covers supervised children"). The `Exec` element, `MultipleInstancesPolicy`, systemd's
  `Environment=`, `launchd.plist(5)` and XDG 0.8 in the [source ledger](evidence/sources.md). Board-waves inventory CT-01,
  F-A-027, F-B-211, F-D-008, F-B-202, F-A-013, F-B-206…F-B-210, CON-OE-11; packet P4-01. DEC-0057 and `FAC-SEM-078`,
  `FAC-SEM-079` were reserved by git CAS (`agent_sync.py reserve --key w4-p4-01-services-20261012 DEC`,
  `--key w4-p4-01-sem-{one-copy,windows-token}-20261012 SEM`); this file, `conformance.md` and `backlog.md` were edited
  without a lease, by the wave's arrangement (the owner session takes the leases when it merges); the record plane is
  `fs`.

### DEC-0056 — Device transport: an HTTP message signature on every device request beside mutual TLS, key roles counted at enrollment, and the estate revision's digest in the check-in

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: the first organization server
  verifies the binding as receiver and runs the vectors at its next contract pin; a collector and Project Observatory's
  node sign every batch, check-in and rotation request with the device's `#sig` key, and the node reports the applied
  estate revision's `digest` (backlog CT-04, CT-20, CT-32).
- **Amends:** DEC-0031 items 1 and 2 (transport and attribution) and DEC-0053 items 8 and 9 (device keys, check-in
  fields), additively except where *Compatibility* says. Closes DEV-HTTPSIG, DEV-KEY-ROLES and DEV-CHECKIN-DIGEST
  (board run N18, packet P4-04).
- **Decision:** in [devices](specification/devices.md#transport) unless named otherwise —
  1. **A device signs every request after enrollment.** Every batch (`fabric-activity/0.1`), check-in and rotation
     request (`certificate.action: "rotate"`) carries an HTTP message signature, a subset of RFC 9421, beside mutual TLS,
     not instead of it. On one request (the owner session's ruling): a signature that is present is always verified;
     beside a client certificate, `keyid` MUST equal that certificate's serial, else 401 `certificate-unknown`; an invalid
     signature over a valid mutual-TLS session is refused with the signature step's code; an unsigned request is accepted
     only by a receiver that sees the client certificate, while that certificate is known, not revoked and valid. A
     receiver behind a host that terminates TLS therefore requires the signature. Enrollment is unchanged: its proof
     travels in `Authorization`. A device signs each retry afresh, with a new `nonce` and `created`.
  2. **The signature's shape.** Label `fabric-device`; covered components `("@method" "@target-uri" "content-digest")`
     in that order; parameters `created`, `nonce`, `keyid`, `alg`, in that order and no other; `keyid` the certificate's
     serial; `alg` `ecdsa-p256-sha256` (RFC 9421 §3.3.4, r ‖ s) for an `es256` signing key, `ed25519` (§3.3.6) for an
     `ed25519` one; `nonce` 22–64 base64url characters, required; `Content-Digest` exactly one member, `sha-256`, over
     the body's bytes (RFC 9530 §2). The fields are RFC 8941 Dictionaries (RFC 9651's Date and Display String admitted on
     other members); a parameter repeated on the `fabric-device` member is refused, while other members keep RFC 8941's
     last-wins rule. The signature base is RFC 9421 §2.5's with §2.3's signature parameters last.
  3. **The signing key** is the `#sig` key of the enrollment whose epoch the certificate carries (rotation keeps it), or,
     where that enrollment listed no `deviceKeys`, the certified key (DEC-0031's key on record); the receiver's data model
     records which. Serials are unique among the certificates one receiver accepts. A P-256 key passes SEC 1 §3.2.2
     (`isValidP256Key`), an Ed25519 key the small-order check (DEC-0045), before anything is verified under it.
  4. **The target URI** is built from the receiver's public base URL — `https://` and the authority the device enrolled
     with, host in lower case, no default port, no path — and the request target as received; never from `Host`.
  5. **The receiver's steps and codes**, each refusal HTTP 401: `signature-missing` (no conforming `fabric-device`
     signature, a missing or malformed nonce among them), `digest-mismatch`, `signature-stale` (`created` more than 300 s
     from its clock, either way), `certificate-unknown` (also a `keyid` that is not the client certificate's serial),
     `certificate-revoked` (`revoked` present and not `false`), `certificate-expired` (outside
     `notBefore` ≤ t < `notAfter`, read strictly as RFC 3339), `signature-invalid` (the wrong `alg` for the key, an
     unusable key, a base that cannot be built, a signature that does not verify) and `signature-replayed`. A context that
     is not usable — not an object, an unreadable clock, a malformed public base URL, a certificate lookup or nonce store
     that is not a function — is refused first, as the receiver's own fault (`context-invalid`, `clock-unreadable`,
     `base-url-invalid`); the verifier answers and never throws.
  6. **Replay.** Only after the signature verifies does the receiver record (serial, `nonce`), atomically, and it keeps
     the pair at least while its clock is at or before `created + 300` s; a repeat answers `signature-replayed`. A
     refused request records nothing. The store is an interface (`NonceStore`); it detects repeats and nothing else.
  7. **Attribution is unchanged:** the certificate the verified signature names stands where the client certificate
     stands (`FAC-SEM-045`).
  8. **The reference verifier** is `src/http-signature.ts` (`checkDeviceSignature`, `verifyDeviceRequest`, the signer
     `signDeviceRequest`, which refuses a nonce, serial or `created` the receiver would refuse, `parseDictionary`,
     `signatureBase`), with the vectors `fixtures/vectors/http-signature.json` that a server and a collector run.
     **`FAC-SEM-077`** (`device-request-signature`, receipt SEM-0077), in its own module `src/device-transport-rules.ts`
     so a consumer that vendors `src/device-rules.ts` needs no HTTP layer: the answer of a receiver that requires the
     signature, or that sees a client certificate, is the one the binding gives.
  9. **Key roles at enrollment (DEV-KEY-ROLES).** `FAC-SEM-044` counts roles: an enrollment that lists `deviceKeys`
     lists exactly one `#sig` and at most one `#kem`, as the estate record's `FAC-SEM-073` does (DEC-0055).
  10. **The revision's digest (DEV-CHECKIN-DIGEST).** The check-in's `records.estateRecord` MAY carry `digest`
      (`sha256:` and 64 hex, DEC-0055's `digest`) beside `revision`, so a receiver tells two revisions with one number
      apart (`schemas/device-check-in.schema.json`). A device omits it toward a receiver pinned before this decision.
  11. **J10.** The binding carries a certificate serial, a nonce and a time; it describes a device's key and nothing about
      a person. The nonce store detects repeats only: a pair SHOULD be deleted once the clock passes its `keepUntil`, and
      the store is never read as a record of activity.
- **Why:** a host that terminates TLS at its edge never passes a client certificate on, so DEC-0031's mutual TLS proves
  nothing there; the first organization server runs on such a host and proposed this binding (its ADR-0007). The nonce
  makes a replay visible: a check-in's `sequenceNum` drives OpAMP's full-state request on a gap, not a refusal, so a
  check-in replayed inside the window would be read again and could bring back an old posture and hide `tampered`. A
  receiver must know the one key that signs, which is why the enrollment's key roles are counted. A fork of the estate
  record (two revisions, one number) was invisible in a check-in that carried only the number (PR #54's seam review).
- **Compatibility:** Additive in schema: a new optional `digest`, a new rule code, a new module. Tightening, each with
  what a consumer does: an enrollment listing two `#sig` keys, or two `#kem` keys, or only a `#kem` key, is refused by
  `FAC-SEM-044` (a collector lists one of each role); a device signs every request (a collector built against mutual TLS
  alone adds the signature; none is deployed, CT-04); a receiver behind a TLS-terminating host refuses an unsigned
  request with `signature-missing`. The first organization server's implementation (its commit `7a47447`) already
  speaks this label, these parameters and these codes; the seam reading ran it against the vectors, and these
  differences remain for its next pin: (a) its anchored pattern answers `signature-missing` when another signature is
  beside ours; (b) an off-curve P-256 key on record throws (a 500, not a 401); (c) it accepts an `http://` public base
  URL; (d) it refuses an expired (serial, nonce) pair until its purge runs, where the binding lets it lapse after
  `keepUntil`; (e) it does not refuse a small-order key at enrollment; (f) it upper-cases `@method`; (g) it verifies
  under the CSR's key rather than the `#sig` key. `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/devices.md` (transport, enrollment, device keys, attribution, check-in, rules),
    `docs/specification/activity.md` (batch transport, OTLP intake), `docs/specification/estate-record.md` (device-key
    counts, the fork), `docs/specification/conformance.md` (register, readers, canonical forms);
  - schemas: `schemas/device-check-in.schema.json`, `schemas/device-enrollment.schema.json`,
    `schemas/activity-batch.schema.json`, `schemas/activity-common.schema.json` (descriptions);
  - code: `src/http-signature.ts` (new), `src/device-transport-rules.ts` (new), `src/device-rules.ts`,
    `src/semantic-rules.ts`;
  - fixtures: `fixtures/catalogue.json`, `fixtures/positive/device-check-in-records-digest.json`,
    `fixtures/negative/device-check-in-records-digest-bare-hex.json`, `fixtures/semantic/device-enrollment-device-keys-*`,
    `fixtures/semantic/device-request-signature-*`, `fixtures/vectors/http-signature.json` (new);
  - tests: `test/http-signature.test.ts` (new), `test/device-rules.test.ts`, `test/rule-tolerance.test.ts`; floors in
    `vitest.config.ts` and `docs/evidence/specs/2026-10-11-board-waves/coverage-baseline.md`;
  - docs: `docs/evidence/sources.md` (RFC 9421, RFC 9530, RFC 8941, RFC 9651), `CONTEXT.md`, `docs/DOCMAP.md`, `README.md`,
    `docs/backlog.md`, the handoff `docs/handoffs/2026-10-12-w4-p4-04-device-transport.md` and `docs/handoffs/README.md`.
- **Not decided here:** a response signature (the server signing its answers; a device trusts the TLS channel and the
  signed policy and key sets); the URL paths of batches, check-ins and rotation (the vectors' paths are examples); how a
  receiver behind a TLS-terminating host learns a revoked certificate beyond its own records; what a receiver does when
  a check-in's estate digest shows a fork; RFC 9421's successor drafts and `Accept-Signature`; clock skew (whether a
  device reports a `signature-stale` refusal); several certificate issuers behind one receiver, whose serials could
  collide.
- **Source:** the first organization server's ADR-0007, amended 2026-10-12 at its commit `7a47447`, agreed with this
  repository's owner session on 2026-10-12; RFC 9421, RFC 9530 and RFC 8941 in the [source ledger](evidence/sources.md);
  the board-waves inventory DEV-HTTPSIG, DEV-KEY-ROLES, DEV-CHECKIN-DIGEST, packet P4-04. DEC-0056 and `FAC-SEM-077`
  were reserved by git CAS (`agent_sync.py reserve --key w4-p4-04-device-transport-20261012 DEC`,
  `--key w4-p4-04-sem-request-signature-20261012 SEM`); this file, `conformance.md` and `backlog.md` were edited in the
  run's branch without a lease, by the wave's arrangement (the owner session takes the leases when it merges); the
  record plane is `fs`.

### DEC-0060 — A delegation key the estate record certifies: `hubKeyCertified`, whose fault each refusal is, the highest applied revision, and an unreadable clock refused first

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: the adapter repins and holds both
  kits to `fixtures/vectors/hub-key.json` (backlog CT-18); Fabric's delegation verifier and its key rotation follow DL-14
  (CT-19); Project Observatory's node, as a delegation callee, reads the revision it applied and passes its mark (CT-20).
- **Annotated (2026-10-12):** DL-14's window is the estate record's: `hubKeyCertified` certifies from 60 s before
  `issuedAt` (`CLOCK_SKEW_SECONDS`), so a revision `verifyEstateRecord` admits never has its hub key refused
  `estate-outside-window` — DEC-0066. delegation.md's row 4 and `fixtures/vectors/hub-key.json` say so.
- **Amends:** DEC-0055 item 4's last sentence ("a delegation verifier that reads the estate record trusts a `kid` only
  while a current revision certifies it") and DEC-0039's verifier (DL-13, DL-14, DL-15, DL-19), additively except where
  *Compatibility* says. Closes DL-HUBKEY (board run N18, packet P4-07).
- **Decision:** in [delegation](specification/delegation.md#keys-publication-and-rotation) unless named otherwise —
  1. **The rule.** A verifier that reads the estate record trusts a token's or an approval's `kid` only while the
     revision it reads certifies it: exactly one machine's `hubKey` has that `kid`, compared exactly, and the published
     key's `x`; the clock is inside the revision's window, both instants included; and the revision revokes neither
     `hub-key <kid>` nor `machine <id>` of that machine. It is checked right after the signature, as DL-13 row 4a.
  2. **The revision it reads** MUST be one `verifyEstateRecord` (DEC-0055) accepted whose number is not lower than the
     highest its machine applied; a higher one only when the verifier itself verified its chain from the applied
     revision, otherwise it reads the applied one. An older revision can still be inside its 30-day window and list a
     hub key the applied one revokes (a rollback; the adapter's review, FAA-31). A verifier that keeps the applied
     number, and its digest when it has it, refuses a lower revision and another revision with that number. The
     revocation delta's entries applied since the revision (DEC-0054) revoke as the revision's own do
     (`estateRevocations`; `hubKeyCertified`'s `{extraRevocations}`).
  3. **Whose fault, and the codes.** The token's fault — no such certification, or a revoked hub key or machine — is
     `unauthenticated` (`approval-invalid` for an approval, the meter's `principal-unproven` by DL-21) with `detail`
     `kid-not-certified`, the adapter's choice (its kits 0.21.0). The revision's fault is `issuer-unavailable` with
     `estate-unreadable` (a source that throws, or a revision that cannot be read), `estate-outside-window`,
     `estate-rolled-back` or `estate-forked`: DEC-0045's wire gives `issuer-unavailable` to "no usable published keys",
     a 503 the caller cannot cure by minting again. At the meter every refusal of its token is `principal-unproven`
     (DL-21 step 3), the detail in its reason. The table in DL-14 lists, in order, what each detail covers.
  4. **The reference function** is `hubKeyCertified(record, kid, x, at, applied?, {extraRevocations}?)` in a new module
     `src/hub-key-rules.ts`, kept apart from `src/estate-record-rules.ts` so a callee that vendors the delegation
     verifier needs no WebAuthn or package code. It answers `{certified: true, machine, revision}` or
     `{certified: false, fault, detail}` and never throws. The verifiers take `estate` (a revision, or a function
     returning it), `estateApplied` and `estateRevocations`; without `estate` nothing changes.
  5. **Vectors** `fixtures/vectors/hub-key.json`, generated from the reference functions: certified; the window's exact
     edges and one second outside; another key under the same `kid`; an unknown `kid` and one in another case; a
     rotation (revision 3 certifies a new hub key, revokes the old one and verifies against revision 2); the hub key
     and the machine revoked while listed; a `kid` on two machines; a missing `x` against a missing `x`; the rollback,
     the fork and the applied mark's boundaries; unreadable records (a revision above 2⁵³ − 1, dates without an offset,
     with a space, on a day that does not exist, a leap second, a window of 30 days and one second); lower-case `t` and
     `z` and an offset, which are read; and the verifiers' answers, in DL-13's order, for tokens and an approval under
     the test hub keys, whose seeds reproduce every signature.
  6. **An unreadable clock is refused first.** `verifyDelegation`, `verifyApproval` and `verifyMeterToken` refuse a
     clock that is not a number of seconds a `Date` can hold — NaN, an infinity, text, beyond ±8.64 × 10¹² s — with
     `unknown-state` and `no-clock`, before DL-13 row 1 (for an approval, after a missing approval and a missing jti
     store). Before this, a NaN clock made every time row false, so an expired token passed; and the meter's denial
     threw on such a clock while it formatted `checkedAt`, which now falls back to the system time.
  7. **Rotation (DL-15).** Where callees read the estate record, a new hub key is certified by a revision before the
     issuer signs with it; a callee whose applied revision does not certify it refuses its tokens `kid-not-certified`.
     The hub keeps the old key certified until the check-ins show the new key's revision applied, then revokes the old
     key in a later revision (DL-15).
  8. **`FAC-SEM-081`** (`delegation-hub-key`, receipt SEM-0081): on `{record, kid, x, at, applied?, answer}`, a
     verifier's answer is the one DL-14 gives.
  9. **The strict date reader** moves to `src/rfc3339.ts` (`strictTime`), used by `src/estate-record-rules.ts`, the new
     module and `src/http-signature.ts` (which re-exports it); its behaviour is ER-10's, unchanged.
- **Why:** DEC-0055 stated the rule in one sentence, with no function, no vectors and no codes, so the adapter chose its
  own (FAA-31) and its review found the rollback the sentence allowed. A port in another language needs the order, the
  codes, the details and the boundaries as data. The split between the token's fault and the trust source's is the
  adapter's own principle; this decision applies it to the window as well, because an expired revision says the hub has
  not drafted a fresh one, and a 401 would send every caller to mint a token that is refused the same way.
- **Compatibility:** Additive for a verifier that does not read the estate record: `estate` absent changes nothing, and
  the vectors of DEC-0039 and DEC-0045 keep their answers. Tightening, each with what a consumer does: a clock that is
  not a number of seconds is refused `unknown-state` (`no-clock`) — a caller passes a NumericDate, as DL-2 says. The
  adapter's kits 0.21.0 (its commit `0badd8f`) differ at least in these, each caught by a vector at its repin (CT-18;
  measured: its JS kit disagrees with 24 of the 60 vector entries): (a) a revision outside its window answers
  `kid-not-certified` there, `issuer-unavailable` `estate-outside-window` here; (b) a source that answers `null` or a
  non-object answers `kid-not-certified` there (and `estate: null` skips the check), `estate-unreadable` here, where only
  an absent `estate` skips it (a port without `undefined` passes null as a source returning null); (c) a `kid` on two
  machines is certified there when either matches, refused here; (d) the applied mark, the rollback and the fork are
  new; (e) the record's shape is not checked there — no revision, no digest, a window of zero length or over 30 days,
  unreadable dates: certified or `kid-not-certified` there, `estate-unreadable` here; (f) `revocations` or `machines` not
  arrays are read as empty there, `estate-unreadable` here; (g) a numeric `kid` is certified there, and a missing `x`
  matches a missing `x` there, never here; (h) there a NaN clock inside the estate check answers `kid-not-certified`,
  here `no-clock` before row 1; (i) revocation refs are compared after `String()` there, exactly here; (j) the answer is
  a boolean there, the `{certified, …}` / `{certified: false, fault, detail}` verdict here; (k) the delta's
  revocations (`estateRevocations`) are new. `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/delegation.md` (DL-13 row 4a and the clock, DL-14, DL-15, DL-19's `issuer-unavailable`,
    rules, *Not decided here*), `docs/specification/estate-record.md` (machines, who adopts it),
    `docs/specification/conformance.md` (readers, register);
  - schemas: `schemas/estate-record.schema.json` (`hubKey`'s description);
  - code: `src/hub-key-rules.ts` (new), `src/rfc3339.ts` (new), `src/delegation.ts`, `src/estate-record-rules.ts`,
    `src/semantic-rules.ts`;
  - fixtures: `fixtures/vectors/hub-key.json` (new), `fixtures/semantic/delegation-hub-key-*`;
  - tests: `test/hub-key.test.ts` (new), `test/rule-tolerance.test.ts`; floors in `vitest.config.ts` and
    `docs/evidence/specs/2026-10-11-board-waves/coverage-baseline.md`;
  - docs: `CONTEXT.md`, `docs/DOCMAP.md`, `README.md`, `docs/backlog.md`, the board run's
    `docs/evidence/specs/2026-10-11-board-waves/packets/wave-4/P4-07-hubkey.md`, `findings/extra-items.json`,
    `waves.json` and `inventory.json`, the handoff `docs/handoffs/2026-10-12-w4-p4-07-hubkey.md` and
    `docs/handoffs/README.md`.
- **Not decided here:** how a callee learns the revision its node applied (a file, a call to the node, the relay); until
  then a callee other than the node passes no `estate` unless it verifies revisions itself and keeps its own applied
  mark (CT-32); what a
  callee reports beyond its refusal on a fork; whether the hub key is the machine's `#sig` key (Fabric's D3, DEC-0055);
  `ES256` hub keys (Fabric's D2).
- **Source:** DEC-0055 item 4; the adapter's FAA-31 report of 2026-10-12 (fabric-agent-adapter 0.21.0, its commit
  `0badd8f`, handoff `docs/handoffs/2026-10-12-faa-31-estate-record.md`, and its kits' `hubKeyCertified` and `estate`
  option); DEC-0045's refusal wire; RFC 3339 and RFC 7519 in the [source ledger](evidence/sources.md); the board-waves
  inventory DL-HUBKEY, packet P4-07. DEC-0060 and `FAC-SEM-081` were reserved by git CAS
  (`agent_sync.py reserve --key w4-p4-07-hubkey-20261012 DEC`, `--key w4-p4-07-sem-hubkey-20261012 SEM`); this file,

### DEC-0054 — The revocation delta and the timestamp heartbeat: entries signed by the estate key and chained by hash, a heartbeat that commits to the head, the 72-hour rule, and reconciliation with the next revision (`revocation-delta/1`, `heartbeat/1`)

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: Fabric's hub issues entries and
  heartbeats under a certified hub key, keeps one chain per estate and lists every entry in the next revision it drafts
  (backlog CT-19); Project Observatory's node applies them under the highest revision it applied, reports the head and
  the heartbeat in its check-in, refuses what arrives from other machines unless current and refuses an unreconciled
  revision (CT-20), and its relay client reads the frames as these documents (CT-34); the relay carries them unchanged
  (DEC-0047).
- **Annotated (2026-10-13):** amended by DEC-0076: `isRevoked`, and so `reconcileRevision` (`FAC-SEM-084`), matches a `grant` revocation by the normal form of the grant's id; every other kind exactly (`docs/specification/identifiers.md`).
- **Annotated (2026-10-12):** HB-0 — a held heartbeat the machine could not have accepted is refused `malformed`, never read as nothing held (the owed reading of #64; packet P6-08).
- **Amends:** nothing; it gives DEC-0053 item 9's `records.heartbeat` and `records.revocationDelta`, and DEC-0047 item
  9's `delta`, `heartbeat` and `welcome` frames, the documents they named as this decision's. It adds a precondition to
  DEC-0055's application of a revision (reconciliation, item 6). Implements the first organization server's target
  architecture v4 (commit `9c6a780`) §7 *Freshness* and §12's row "revocation delta and timestamp heartbeat" for an
  estate. Closes V4-DELTA-HEARTBEAT (board run N18, packet P4-06).
- **Decision:** in [revocation delta](specification/revocation-delta.md) unless named otherwise —
  1. **The estate key signs.** Every entry and heartbeat is signed by a `hubKey` that the highest estate-record revision
     the verifier verified and applied certifies (DEC-0055 item 4): compared by exact kid, certified for one machine,
     Ed25519 of full order (DEC-0045), revoked neither there (`hub-key`, `machine`) nor by an entry applied before
     (`estateSigner`). `alg` is `EdDSA`, signed; ES256 joins with Fabric's D2. The passkey cannot sign an hourly
     heartbeat (UP and UV every time); the relay holds no authority (DEC-0047 item 1); the hub key is not the estate's
     record key, as v4 §7 asks of a timestamp key.
  2. **`revocation-delta/1`** ([`revocation-delta.schema.json`](../schemas/revocation-delta.schema.json)): an entry is
     `{type, alg, estate, sequence, prev, at, revocation, kid, sig}`, one revocation in the estate record's shape and
     kinds without `authority` (a passkey is revoked only by a revision a passkey signs). The signing input is the RFC
     8785 form without `sig`; the entry's hash, the next head, is its hex SHA-256 (`deltaEntryHash`); entry 1's `prev`
     is the genesis, SHA-256 of `{type, estate, sequence: 0}` (`deltaGenesis`). The head is `{sequence, sha256}` —
     DEC-0053's `records.revocationDelta` and DEC-0047's `welcome.deltaHead`. A page `{head, entries}` (at most 256) is
     what a `delta` frame and a check-in response carry; its `head` is a hint.
  3. **`heartbeat/1`** ([`heartbeat.schema.json`](../schemas/heartbeat.schema.json)): `{type, alg, estate, sequence, at,
     deltaHead, estateRecord: {revision, digest}, kid, sig}`; a check-in reports its `sequence` and `at` (DEC-0053). A
     running hub signs one after every entry and every revision, SHOULD sign one hourly, and lets at most 24 hours pass
     (v4 §7 "daily").
  4. **Applying a page** (`applyDelta`, RD-1…RD-10): the clock first, then each entry's shape, estate, `EdDSA`, kind, not
     more than 60 s ahead, the estate key, the signature — and only then its place: held (skipped), a `gap` (ask with
     `delta-query`), or a second signed history (`broken-chain`, `fork`), which marks the machine broken and keeps that
     entry's revocation in force. The entries before a refused one stay applied.
  5. **Accepting a heartbeat** (`acceptHeartbeat`, HB-1…HB-3): the same checks, then `not-newer`, `fork` (the held
     sequence with other bytes, a head or revision contradicting what the machine holds) or `regressed`.
  6. **The 72-hour rule** (`deltaFreshness`, `freshnessAnswer`): `broken`, `stale` (no readable clock, no heartbeat, or
     one more than 72 hours old; exactly 72 is fresh), `behind` (the heartbeat's head or revision past what is applied),
     else `current`. Unless `current`, a machine places no caller in T1 and accepts no T2 call (DL-25, DL-26) — no
     delegated call, command message, share-grant call or new secret envelope from another machine — and keeps the
     person's own work (T0), every revocation in force, and the way back. Revocations in force are the revision's, the
     applied entries' and forked ones' (`effectiveRevocations`); every check that reads the record's revocations reads
     these.
  7. **Reconciliation** (`reconcileRevision`): a revision issued at or after an entry's `at` lists its revocation; a
     machine holding the entry refuses it as `unreconciled`. A machine applies a revision only when it is schema-valid,
     `verifyEstateRecord` accepts it and it is reconciled.
  8. **Rules:** `FAC-SEM-082` (a page), `FAC-SEM-083` (a heartbeat; a machine's freshness answer), `FAC-SEM-084`
     (reconciliation). Times everywhere are RFC 3339 with `T`, an offset and a day that exists (`deltaTime`), refused
     before any comparison.
- **Why:** v4 §7 makes revocation take effect within seconds online and at most by the next heartbeat, and closes the
  dropped-revocation gap by having the heartbeat sign the delta's head (its R4-8). A revision is a whole record a person
  signs and machines fetch hourly, so it cannot be the fast path; a relay carries everything but must be able to delay
  revocation only, never forge or hide it. A compromised estate key can only revoke and stop heartbeats — denial of
  service, and less than it can already do with delegation tokens — and cannot revoke a passkey, so the person can
  always sign the revision that revokes it. J10: an entry names a machine id, a kid, a digest or a grant id; a heartbeat
  a counter, a time, a head and a revision; neither names a person.
- **Compatibility:** Additive: two schemas, three rule codes, one module. Tightening, each with what a consumer does: a
  check-in response's `records.heartbeat` and `records.revocationDelta`, and a relay's `welcome.heartbeat`, `delta` and
  `heartbeat` frames, which DEC-0053 and DEC-0047 left as any object, must now be these documents (a server or relay
  sends them as signed); a machine holding a delta entry refuses a revision that leaves it out (a hub lists every
  entry). Nothing is deployed against the placeholders (CT-04, CT-34). `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/revocation-delta.md` (new), `docs/specification/relay.md` (revocation and heartbeat,
    welcome), `docs/specification/devices.md` (check-in), `docs/specification/estate-record.md` (revocations, who adopts
    it, not decided), `docs/specification/conformance.md` (register, readers, canonical forms);
  - schemas: `schemas/revocation-delta.schema.json` (new), `schemas/heartbeat.schema.json` (new),
    `schemas/device-check-in.schema.json`, `schemas/relay-frame.schema.json`;
  - code: `src/revocation-delta.ts` (new), `src/revocation-delta-rules.ts` (new), `src/semantic-rules.ts`;
  - fixtures: `fixtures/catalogue.json`, `fixtures/positive/revocation-delta-page.json`, `fixtures/positive/heartbeat*.json`,
    `fixtures/positive/relay-frame-delta.json`, `fixtures/positive/relay-frame-heartbeat.json`,
    `fixtures/positive/device-check-in-response-records.json`, `fixtures/negative/revocation-delta-authority.json`,
    `fixtures/negative/heartbeat-*.json`, `fixtures/negative/relay-frame-delta-unsigned-entry.json`,
    `fixtures/negative/device-check-in-response-heartbeat-placeholder.json`,
    `fixtures/semantic/{revocation-delta,heartbeat,delta-freshness,delta-reconciliation}-*`,
    `fixtures/vectors/revocation-delta.json` (new);
  - tests: `test/revocation-delta.test.ts` (new), `test/rule-tolerance.test.ts`, `test/positive-sweep.test.ts`,
    `test/schema-compilation.test.ts`; floors in `vitest.config.ts` and
    `docs/evidence/specs/2026-10-11-board-waves/coverage-baseline.md`;
  - docs: `docs/evidence/sources.md` (RFC 8032 and RFC 8785 rows), `CONTEXT.md`, `docs/DOCMAP.md`, `README.md`,
    `docs/backlog.md`, the packet `docs/evidence/specs/2026-10-11-board-waves/packets/wave-4/P4-06-delta-heartbeat.md`,
    the handoff `docs/handoffs/2026-10-12-w4-p4-06-delta-heartbeat.md` and `docs/handoffs/README.md`.
- **Not decided here:** the organization's documents and their key (`org-authority/1`, Fabric D8, or a role in
  DEC-0031's key set), the 7-day validity of the organization's records and the heartbeat extension of up to 7 days the
  organization root or a quorum of administrators may sign (v4 §7); DEC-0053's 7-day revocation list stays the
  certified root's and is not reused here, because an estate's record lives 30 days and its heartbeat 72 hours.
  Recovery from a fork (a new chain anchored in a revision); compaction (a checkpoint for a machine that enrolls late);
  how two hubs agree on the next sequence (Fabric's); the organization's kinds (members, `subject.erase`); Fabric's D3
  (which key is the hub key) and D2 (ES256 for it). DL-14's reference function takes the delta's part as `{extraRevocations}` (DEC-0060,
  merged first), so item 6 holds for it.
- **Source:** the first organization server's target architecture v4 at `9c6a780` (§7 *Freshness*, §12, §20 V2-15 and
  V2-22); DEC-0047, DEC-0053, DEC-0055; RFC 8785 and RFC 8032 in the [source ledger](evidence/sources.md); the
  board-waves inventory V4-DELTA-HEARTBEAT, packet P4-06. DEC-0054 was reserved by git CAS before this run, by the owner
  session's P3-02 run (`agent_sync.py reserve --key revocation-delta-20261012 DEC`, run `r-51535649e`, commit `776e807`,
  2026-10-12T00:43:06Z); this run reserved no decision id. `FAC-SEM-082`…`FAC-SEM-084` were reserved by git CAS
  (`--key w4-p4-06-sem-{delta,heartbeat,reconcile}-20261012 SEM`, receipts SEM-0082…SEM-0084). This file,
  `conformance.md` and `backlog.md` were edited in the run's branch without a lease, by the wave's arrangement (the owner
  session takes the leases when it merges); the record plane is `fs`.

### DEC-0061 — The descriptor for listings: a service offered to others (`peer`), the kind of its runner's sign-in, who installed it, and the node as supervisor

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: Fabric writes its own descriptor
  with `installedBy` and reads `lifecycle.manager` (CO-263, ADR-0139; board CT-19); Project Observatory's node writes
  `lifecycle.manager: "node"` descriptors, serves the Install, Off, Code, Uninstall and state forms, and checks a
  runner as `FAC-SEM-087` says before it places a service (CT-20); the adapter's kits write the new members and accept
  `node` (CT-18); Fabric Dashboards starts, stops and reads a node's child through the node and shows `peer` (CT-21);
  the first organization server's listings carry what `peer` carries (CT-04); Fabric Inbox's organization mode (its
  B-87) writes a remote descriptor with `peer` and `runner.credentialKind: "platform-metered"` and reports usage on that
  route.
- **Amends:** DEC-0015 (`installedBy`), DEC-0019 (a remote placement may be offered to others), DEC-0021 and DEC-0046
  (the usage report's `route`), DEC-0057 (its *Not decided here* item on the node), additively under the DEC-0016
  extension policy except where *Compatibility* says. Closes V4-DESCRIPTOR (board run N08, packet P4-02).
- **Decision:** in [service](specification/service.md) unless named otherwise —
  1. **`peer`: a service offered to others.** A descriptor MAY carry `peer {endpoint, custody, residency, maxDataClass}`,
     all four required: `endpoint` is where others reach the service, `https://<dns-name>[:<port>][/<path>]` with no
     query, fragment or userinfo and never an IP literal (schema), never a reserved name (`FAC-SEM-085`, the list
     `FAC-SEM-024` uses, now one constant); `custody` is `organization-managed` or `personal` (who controls the machine
     or account); `residency` is 1–32 distinct ISO 3166-1 alpha-2 codes in upper case, `EU` admitted, the user-assigned
     `AA`, `QM`–`QZ`, `XA`–`XZ` and `ZZ` refused, as the IANA Language Subtag Registry's region records list them;
     `maxDataClass` is one of the organization edition's four classes, `public` < `internal` < `confidential` <
     `restricted` (device policy's, DEC-0053). An offer is not a third placement value: a local placement (usually under
     the node) or a remote one keeps every rule of its own, and `peer` sits beside either.
  2. **What a host refuses.** A host routes a request from anyone but the service's operator only to a service that
     declares `peer`, and only at or below `maxDataClass`, comparing the four classes exactly as written and refusing an
     unknown class or maximum before any comparison (`peerRefusal`, `src/descriptor-rules.ts`, with vectors
     `fixtures/vectors/service-peer.json`; `FAC-SEM-088`). An offer grants nothing: a share grant or a listing does, and
     others present their own credential at `endpoint`, never the descriptor's token (DEC-0024).
  3. **`runner.credentialKind`, a kind and never a value.** A descriptor MAY carry `runner {kind?, credentialKind}`:
     `credentialKind` is `subscription`, `key`, `platform-metered` (the hosting platform's own metered models under the
     deployment's account — Fabric Inbox's case) or `none`; `kind` is a shared runner kind, required for a subscription,
     which names its vendor's runner (`claude-code`, `kimi-code`, `codex`; DEC-0046). A descriptor with `peer` MUST carry
     `runner` and MUST NOT name `subscription` (schema). `FAC-SEM-086` refuses a value shaped like a credential anywhere in
     `runner` or `installedBy`, with the shared detector (`secretArgument`, DEC-0044), naming the place and never the
     value. `FAC-SEM-087` (`service-runner`) is what a node checks when it places a service: the kind is an entry of its
     runner catalogue, a subscription names its vendor's runner, the declared kind is one of the four and equals the
     kind the node derived from where the credential came from, and a service offered to others runs on no subscription
     — declared, derived, or as a usage row.
  4. **`installedBy`, by role.** It stays a string (the installer and its version) or becomes `{by, role?, tool}`: `by` is
     `person` (with `role` `operator` or `administrator`), `node` (from a placement in the person's estate record) or
     `organization` (from an organization's listing); `role` belongs to a person only; `tool` is the installer and its
     version. It names a role, never a person.
  5. **`lifecycle.manager: "node"`.** The descriptor admits `node`. Beside it `label`, `plist`, `unit` and `task` are
     refused: the node keeps its children in its own record and there is no supervisor file. It stays a local
     placement's supervisor: a remote placement's manager is `none`. The node restarts a child that exits no sooner than
     10 s after the child's last start. Its forms: **Install** — the node installs the package (v4 §6 Path 2), writes the
     descriptor, starts the child with the marker and polls the well-known document for at most 40 s; **Off** — a host
     asks the node to start (`node.lifecycle.ensure_running`), to stop so that the service stays off, and to restart, and
     never starts, stops or signals the child itself; **state** — the node answers whether the child is kept on, whether
     it runs and its pid, which a host compares with the well-known `process.pid` as with systemd's `MainPID`;
     **Code** — the node points its record at the new release and restarts the child; **Uninstall** — the node stops the
     child and removes it from its record, then the descriptor is deleted. The operations' names and schemas are
     Project Observatory's (OBS-79); these rows fix what each does.
  6. **The usage report's shape for listings.** A service offered to others reports with the same object: `route`
     admits `platform-metered` beside `subscription` and `key` (`schemas/service-usage.schema.json`); `byGrant`
     attributes spend to the share grant or listing grant by its opaque reference; no row names a caller, member or
     guest, and no per-member sum is in it (v4 Path 5 step 3: per-member totals come from lease returns inside the
     organization record); its rows carry no `subscription` route.
  7. **Rules:** `FAC-SEM-085` (`service-descriptor`), `FAC-SEM-086` (`service-descriptor`), `FAC-SEM-087`
     (`service-runner`), `FAC-SEM-088` (`service-peer-request`), in `src/descriptor-rules.ts`.
  8. **J10.** A data class is a property of the service, custody of the machine or account, residency of where the
     service runs; `installedBy` names a role. No member names or describes a person.
- **Why:** the first organization server's target architecture v4 lists this descriptor row among its contract changes
  (§12), and Fabric Inbox's organization mode (its B-87) starts only once the descriptor and the usage report's shape
  for a listing are fixed. A listing runs where its audience goes beyond its operator, so a host must know where others
  reach it, who controls the machine, where it runs and what it may receive (v4 §9 *Hosting*: placements carry custody,
  residency and a maximum data class), and must never let a subscription serve others (v4 §2 rule 8). A data-class
  ceiling that compared case-insensitively or by index would let `Confidential` or `2` through, so the comparison is
  exact and an unknown class is refused first. Fabric said it needs `installedBy` and `lifecycle.manager`, and that the
  credential kind is the kind of a runner's sign-in, never a value; the node was the only supervisor DEC-0057 named
  without a descriptor form.
- **Compatibility:** Additive for every descriptor written before: `installedBy` keeps its string form, `peer` and
  `runner` are optional, and `placement` keeps its two values. A host or validator pinned before this decision refuses a
  descriptor that carries `peer`, `runner`, an object `installedBy` or `lifecycle.manager: "node"` (the descriptor is
  closed), so a writer writes them only toward hosts at this pin or later — which is the safe failure, as for a remote
  descriptor before DEC-0019. A usage report with `route: "platform-metered"` is likewise refused by an older reader.
  Nothing written today narrows: no descriptor carried `peer` or `runner`, and `label`/`plist` beside `node` were never
  valid because `node` was not admitted. `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/service.md` (Descriptor, Remote placement's table, *Offered to others*, Lifecycle, Usage
    report, the semantic-rules table), `docs/specification/runners.md` (routes), `docs/specification/conformance.md`
    (two reader rows, four register rows);
  - schemas: `schemas/service-descriptor.schema.json` (`peer`, `runner`, `installedBy`, `lifecycle.manager`),
    `schemas/service-usage.schema.json` (`route`);
  - code: `src/descriptor-rules.ts` (new), `src/semantic-rules.ts` (dispatch; the reserved names now shared);
  - fixtures: four positive descriptors and a usage report, 26 negative descriptors and one usage report
    (`fixtures/catalogue.json`), fourteen `fixtures/semantic/service-*` files, vectors `fixtures/vectors/service-peer.json`;
  - tests: `test/descriptor-rules.test.ts` (new), `test/rule-tolerance.test.ts`; floors in `vitest.config.ts` and
    `docs/evidence/specs/2026-10-11-board-waves/coverage-baseline.md`;
  - docs: `CONTEXT.md`, `docs/DOCMAP.md`, `docs/evidence/sources.md` (the IANA Language Subtag Registry), `docs/backlog.md`
    (CT-12, CT-04, CT-18…CT-21), the handoff `docs/handoffs/2026-10-12-w4-p4-02-descriptor.md` and `docs/handoffs/README.md`.
- **Not decided here:** whether an assigned ISO 3166-1 code is checked (only the shape is), and how a caller's residency
  requirement is matched against a service's (`EU` against `DE` needs a membership table); which data an organization
  lets reach a `personal` host (v4 Path 4 step 2 says confidential only on organization-managed hosts — the
  organization's placement policy, not a descriptor rule); how a host maps the contract's own `dataClass` vocabulary
  onto the four classes; whether `key` is split by provenance (an organization's key or a person's, DEC-0053's
  `api-org`); the node's operation names and schemas (OBS-79); a third placement value for a service with no local or
  platform supervisor; Fabric writing its own descriptor at start although DEC-0015 says the running service does not
  (ADR-0139, CO-263) — Fabric is an app, and the rule's wording for an app is owed; the exceptionally reserved `UK`
  and `EL`, which the residency shape admits beside `GB` and `GR`; a public name under an IDN top-level domain, which
  the endpoint pattern refuses; the special-use names `.test`, `.invalid`, `.example` and `.onion`, which FAC-SEM-085
  does not yet refuse; a credential-shaped endpoint path, which no rule checks yet.
- **Source:** the first organization server's target architecture v4 (`docs/design/2026-10-12-target-architecture.md`
  at `9c6a780`), §2 rule 8, §5 (`lifecycle.manager: node` covers supervised children), §8, §9 *Hosting*, §12's descriptor
  row and §13, §20 V2-18 (custody) and V2-19 (four classes and residency); Fabric (2026-10-12): it needs `installedBy`
  and `lifecycle.manager`, and the credential kind is the kind of a runner's sign-in, never a value (ADR-0139, CO-263);
  Fabric Inbox's backlog B-87 item 5 (`runner.credentialKind` platform-metered); the IANA Language Subtag Registry in the
  [source ledger](evidence/sources.md). Board-waves inventory V4-DESCRIPTOR; packet P4-02; DEC-0057's *Not decided here*.
  DEC-0061 and `FAC-SEM-085`…`FAC-SEM-088` were reserved by git CAS (`agent_sync.py reserve --key
  w4-p4-02-descriptor-20261012 DEC`, `--key w4-p4-02-sem-{peer-endpoint,credential-value,runner-check,peer-request}-20261012
  SEM`); this file, `conformance.md` and `backlog.md` travelled as a patch the owner session applied under its leases
  (the agent-sync guard refuses a commit of a guarded file by a run that holds no lease); the record plane is `fs`.

### DEC-0062 — The window lease, `window-lease/1`: one hub-signed share of one window instance per machine, spent offline within the smaller remainder, fail closed at expiry

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: Fabric's hub issues leases (backlog
  CT-19); Project Observatory's meter verifies, holds and spends them and reports `spent` (CT-20); an organization server
  hands leases of organization windows once `org-authority/1` exists. Agreed with Project Observatory's session as the
  meter's owner on 2026-10-12 (its `METER.md` M3/M4).
- **Annotated (2026-10-26):** DEC-0129 decides `org-authority/1` as the member list only; organization windows and
  their leases wait on a later decision (`window-lease.md`).
- **Annotated (2026-10-12):** a held lease without a whole `sequence` and a `leaseId` is `context-invalid`; the verifier's `estateRevocations` is named in window-lease.md; the check-in's `records.leases[]` was narrowed from any object to `window-lease/1`, a placeholder before, so the Compatibility line's "Additive" holds for every real check-in (the owed reading of #65; packet P6-08).
- **Amends:** nothing; it gives DEC-0053 item 9's check-in `records.leases` its document and adds an optional `spent`.
  Implements the first organization server's target architecture v4 (commit `9c6a780`) §6 Path 5 and §12's row
  "window lease". Closes V4-WINDOW-LEASE (board run N18, packet P4-05).
- **Decision:** in [window lease](specification/window-lease.md) unless named otherwise —
  1. **The document** ([`window-lease.schema.json`](../schemas/window-lease.schema.json)): `{type, leaseId, sequence,
     estate, estateRevision, machine, scope, window, period, amount, unit, issuedAt, expiresAt, alg, kid, sig}`. `scope`
     is `estate`, `project:<id>` or `grant:<id>#<revision>` (v4 uses `estate` only); `window` is the spend policy's
     calendar window in UTC (`day`, `week` from Monday, `month`, DEC-0038); `amount` a decimal string in USD; the life at
     most 24 hours and never past the window instance. There is no escalation field: spending above a lease is an
     approval (DEC-0034 OC-6).
  2. **The window instance** is one label, `period`: `YYYY-MM-DD`, the ISO week `YYYY-Www`, or `YYYY-MM`. A pair of
     instants was rejected because it states the instance twice and invites ports that round differently.
  3. **Who signs:** a hub key the estate record the machine applied certifies, compared exactly, revoked neither by the
     record nor by the revocation delta's applied entries (DEC-0054; the same reading as DL-14, DEC-0060), Ed25519 of
     full order, `alg` `EdDSA` until Fabric's D2, over RFC 8785 without `sig`.
  4. **One lease per slot** (estate, machine, scope, window, period): a higher `sequence` supersedes; the same sequence
     with other bytes is refused.
  5. **The meter** reserves only as `mayReserve` answers: the smaller of its own remainder and the lease's, nothing after
     `expiresAt`. At expiry it fails closed in that window until a new lease arrives; whatever it has not reported counts
     as spent.
  6. **Reporting** is the check-in's `records.leases[{leaseId, expiresAt, spent}]`; `spent` is an upper bound (settled
     receipts plus open reservations). The hub credits a late report as a refund at its next division.
  7. **The verifier** `verifyWindowLease` answers WL-1…WL-12 in order, the clock and the context first; `windowRemainder`
     and the division rule keep a hub's leases of one instance within its limit.
  8. **Rules:** `FAC-SEM-089` (`window-lease`), `FAC-SEM-090` (`window-lease-division`), `FAC-SEM-091`
     (`lease-reservation`).
- **Why:** v4 makes an estate window spendable on several machines without a hub online for every call; the meter's
  owner asked for a concrete instance, a scope, a replacement rule and a fail-closed expiry, and a lease is the first
  multi-machine remainder the meter has. J10: a lease names an estate, a device id, a window and an amount; no person,
  no caller, and `spent` is a sum over one instance on one machine.
- **Compatibility:** Additive: a new schema, specification, rules and an optional check-in member. `contractVersion`
  stays `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/window-lease.md` (new), `docs/specification/conformance.md` (register, canonical forms,
    readers), `docs/specification/estate-record.md` (*Not decided here*);
  - schemas: `schemas/window-lease.schema.json` (new), `schemas/device-check-in.schema.json` (`records.leases[].spent`);
  - code: `src/window-lease.ts` (new), `src/semantic-rules.ts`;
  - fixtures: `fixtures/catalogue.json`, `fixtures/positive/window-lease*.json`, `fixtures/negative/window-lease-*`,
    `fixtures/semantic/window-lease-*`, `fixtures/semantic/lease-reservation-*`, `fixtures/vectors/window-lease.json`;
  - tests: `test/window-lease.test.ts` (new), `test/positive-sweep.test.ts`, `test/rule-tolerance.test.ts`,
    `test/schema-compilation.test.ts`; floors in `vitest.config.ts`;
  - docs: `docs/evidence/sources.md` (RFC 3339's week form), `docs/backlog.md`, `docs/handoffs/2026-10-12-w4-p4-05-leases-challenges.md`.
- **Not decided here:** v4's static per-machine split in the estate record (the hub's leases are the split); how a lease
  reaches a machine and a report reaches the hub beyond the check-in and the relay; where an estate's window limits are
  signed (`limits/1`, DEC-0063); organization windows and member allowances (`org-authority/1`); `ES256` hub keys (D2).
- **Source:** the first organization server's target architecture v4 at `9c6a780` (§6 Path 5, §12); Project
  Observatory's agreement of 2026-10-12 (the meter's owner); DEC-0037, DEC-0038, DEC-0053, DEC-0054, DEC-0055, DEC-0060;
  RFC 3339 and RFC 8785 in the [source ledger](evidence/sources.md); the board-waves inventory V4-WINDOW-LEASE, packet
  P4-05. DEC-0062 and `FAC-SEM-089`…`FAC-SEM-091` were reserved by git CAS (`agent_sync.py reserve --key
  w4-p4-05-window-lease-20261012 DEC`, `--key w4-p4-05-sem-{lease,lease-division,lease-reservation}-20261012 SEM`); the
  agent stopped at its limit before the registers, and the owner session wrote this entry under its leases; the record
  plane is `fs`.

### DEC-0063 — Signing challenges and the signing RP: one register of passkey-signed statements over RFC 8785, a dedicated `sign.<domain>` credential

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: Fabric registers each person's
  signing credential apart from the sign-in one, runs ceremonies in the person's Fabric or a pinned static page, and
  computes challenges from the register (CT-19); Project Observatory's node verifies estate revisions under signing
  credentials only (CT-20); the first organization server pins administrators' signing credentials in `org-authority/1`
  and never serves a signing page (CT-04).
- **Annotated (2026-10-26):** DEC-0129 registers `org-authority/1` `{digest}`, a sixth passkey type, and pins
  administrators' signing credentials in `org-key-set/1`'s `administrators`, not in `org-authority/1`; finance
  approvers' credentials, and administrators' quorum, delay and device binding, stay open.
- **Annotated (2026-10-15):** DEC-0084 registers `enroll-token/1` `{scope, genesis, purpose, ceiling, notBefore, expiresAt, nonce, uses}`, a passkey statement (the owners' DV-CON-01 amendment of DV-05); the passkey register now holds five types, and the key-signed register gains `enroll-join/1`, the joining key's proof at redemption (`docs/specification/ceremonies.md#a-headless-machine`).
- **Annotated (2026-10-12):** its affects list names `src/rfc3339.ts`, which the merge of #65 did not change (at that merge last changed by DEC-0060; since then by the relay audit's DEC-0066); the field limits of the register (a renamed field, a `jkt` end, a grant at revision 0) now have tests (packet P6-08).
- **Amends:** DEC-0055 (tightening): an estate record's authority must be a signing credential, `rpId` `sign.<domain>`,
  origins on that RP ID (schema and `FAC-SEM-092`). Implements v4 §7 *Signing surface* and §12's row "signing challenge
  types … over JCS, and the dedicated signing RP". Closes V4-SIGNING-CHALLENGE (board run N18, packet P4-05).
- **Decision:** in [signing](specification/signing.md) and [conformance](specification/conformance.md#signing-challenges) —
  1. **The register.** A passkey signs a challenge, SHA-256 of the RFC 8785 form of `{type, ...fields}`, from one
     register (`SIGNING_STATEMENTS`, `signingChallenge`): `estate-revision/1` `{digest}` (DEC-0055, unchanged),
     `org-countersign/1` `{organization, digest, audience, grant, revision}`, `share-grant/1` `{estate, grant, jkt,
     expiresAt}` (`jkt` the RFC 7638 thumbprint RFC 9449 binds DPoP to) and `limits/1` `{scope, digest}`. `organization`
     and `estate` are added to v4's fields because hosted organizations and personal estates share PassionCode's signing
     RP. Each field is checked where the register defines it.
  2. **The signing RP** is `sign.<domain>`; the signing credential is registered under it and used for nothing else;
     its origins are `https://` on the RP ID; related origins are never used for signing.
  3. **The ceremony** runs top-level in the signer's own Fabric or a static, integrity-pinned page on the signing RP ID,
     which computes the challenge from the statement it fetched by digest and shows it; UV is required; an organization
     server or a relay never serves a signing page.
  4. **The verifier** `verifySigningAssertion(assertion, credential, type, fields)` rebuilds the challenge, refuses a
     non-signing RP (`wrong-rp`) before reading the assertion and an origin outside the RP ID (`wrong-origin`), then runs
     WebAuthn Level 3 §7.2 as the estate record does.
  5. **Rule:** `FAC-SEM-092` (`estate-record`, `signing-credential`).
- **Why:** v4 puts money and placement under passkey signatures; a challenge from bytes a signer was handed signs what
  the hander chose, and a sign-in credential that can also sign lets a sign-in page sign. One register makes every
  statement's bytes a port's data.
- **Compatibility:** Additive for new statements. Tightening for DEC-0055: an estate record whose authority `rpId` is not
  `sign.<domain>` is refused; no estate record is deployed yet (CT-19, CT-20), and the vectors already use
  `sign.example.org`. `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/signing.md` (new), `docs/specification/conformance.md` (the register, canonical forms,
    readers), `docs/specification/estate-record.md`;
  - schemas: `schemas/estate-record.schema.json` (the authority's `rpId` and origins);
  - code: `src/signing-challenges.ts` (new), `src/rfc3339.ts`, `src/estate-record-rules.ts`, `src/semantic-rules.ts`;
  - fixtures: `fixtures/semantic/signing-credential-*`, `fixtures/negative/estate-record-authority-sign-in-rp.json`,
    `fixtures/vectors/signing-challenges.json`, `fixtures/vectors/estate-record.json`;
  - tests: `test/signing-challenges.test.ts` (new); floors in `vitest.config.ts`;
  - docs: `docs/evidence/sources.md` (RFC 7638, RFC 9449, WebAuthn §4 and §5.11), `docs/backlog.md`.
- **Not decided here:** where administrators' and finance approvers' signing credentials are pinned, their quorum,
  delay and device binding (`org-authority/1`; until then `org-countersign/1` is registered but unread, and the package's
  organization countersignature stays DEC-0051's); the shape of a limits document; how an outside person's key is first
  registered and shown to the owner; recovery by a printed code.
- **Source:** the first organization server's target architecture v4 at `9c6a780` (§3, §6 Paths 4, 5 and 7, §7, §12);
  W3C Web Authentication Level 3, RFC 8785, RFC 7638 and RFC 9449 in the [source ledger](evidence/sources.md); DEC-0050,
  DEC-0051, DEC-0055; packet P4-05. DEC-0063 and `FAC-SEM-092` were reserved by git CAS (`--key
  w4-p4-05-signing-challenges-20261012 DEC`, `--key w4-p4-05-sem-signing-credential-20261012 SEM`); the owner session
  wrote this entry under its leases after the agent stopped at its limit; the record plane is `fs`.

### DEC-0064 — The 0.1.0 core keeps its promises: claim and proof, approval separation, one product manager per scoped project, rollback, grant windows, namespaced residue, and host-side records named as such

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: Fabric's result writer lists every
  unproven done claim in `notVerified` by its id and refuses self-approval of learning and promotion (CT-19); the first
  organization server and Project Observatory check grant windows with `FAC-SEM-097` (CT-04, CT-20). Board row CT-14.
- **Annotated (2026-10-13):** amended by DEC-0076: `FAC-SEM-094` (approver against author), `FAC-SEM-006` (the scoped projects) and `FAC-SEM-096` (a rollback basis's id) compare by normal form (`docs/specification/identifiers.md`).
- **Annotated (2026-10-12):** `FAC-SEM-093` also refuses one claim id on two done claims and names each done item by its own index; `FAC-SEM-097` names the field that failed; the grant window is written `[startsAt, expiresAt)` in governance-and-roles.md (the owed reading of #67; packet P6-08).
- **Amends:** DEC-0011 (a rule for the claim/proof relation), DEC-0004 and DEC-0012 (a rule for approval separation),
  DEC-0006 (one product manager, now found), DEC-0007 (a rule for rollback), DEC-0008 (a rule for a grant's window;
  retention and absent grant fields read as the schema carries them), DEC-0005 (residue extensions are namespaced strings
  in the schema), DEC-0009 and DEC-0013 (host-side records named as such). Corrects `FAC-SEM-001`'s text to its code and `FAC-SEM-006`'s code to its text. Closes the board
  run's inventory items F-A-002, F-A-003, F-A-004, F-A-014, F-A-015, F-A-016, F-A-017, F-A-018 and F-A-019 (node N10,
  packet P5-01).
- **Decision:**
  1. **Claim and proof** ([results and evidence](specification/results-and-evidence.md#semantic-rules)). Every
     `proof[].claimIds` member names a `done[].claimId`, and every done claim no proof names is listed in `notVerified` by
     its claim id (`FAC-SEM-093`, kind `result`). `FAC-SEM-001` says what it checks: a `succeeded` result lists no claim
     in `notVerified`, because every reported claim is an acceptance claim.
  2. **Approval separation** ([governance and roles](specification/governance-and-roles.md#semantic-rules)). An approved
     learning proposal or promotion names `approvedBy`, who is never its author `meta.createdBy` (`FAC-SEM-094`, kinds
     `learning`, `promotion`). The active revision, the checker of the retro's own run and the approver's role are the
     host's records, so the host checks those clauses ([memory and learning](specification/memory-and-learning.md)).
     `FAC-SEM-003` stays as the answer to a schema-invalid `selfApply`.
  3. **One product manager.** `FAC-SEM-006` derives the projects from every active project-scoped assignment, so a
     project with assignments and no active product manager is found.
  4. **Rollback** ([versioning](specification/versioning.md#semantic-rules)). `rollbackBasis` names the same setting's
     `id` and an earlier revision, and every parent's revision is earlier than the setting's own (`FAC-SEM-096`, kind
     `versioned-setting`); `fixtures/positive/versioned-setting-rollback.json` is the example DOCMAP asks for.
  5. **Grant window.** A standing grant's `expiresAt` is after its `startsAt`, both strict RFC 3339 (`src/rfc3339.ts`);
     given `{grant, at}`, an `active` grant is inside `[startsAt, expiresAt)` at `at` (`FAC-SEM-097`, kind
     `grant-window`). An absent `channels` means no outbound channel and an absent `recipientConstraints` means no
     recipient outside the project: the schema keeps both optional and the absence is the safe reading.
  6. **Retention** is per classification in the project data policy; a record's retention is resolved through its
     classification, not carried by each record.
  7. **Residue.** A coordination event's residue item is one of the six named categories or a namespaced string
     `owner/category` (`schemas/coordination.schema.json`), as coordination.md allows.
  8. **Host-side records named as such.** The execution context's ambient policy `deny` is the denied-keys rule (the
     schema lists no separate keys); an `account-switched` event carries from/to, reason, pool revision and time, and
     the run/node and evidence are the host's records of that run. A2A task-state mapping and cancellation, and a local
     runner's required execution-context capabilities, are host-side expectations, not manifest fields
     ([execution context](specification/execution-context.md), [profiles](specification/profiles.md)).
- **Why:** the 0.1.0 specs promised checks no rule made and fields no schema had (inventory F-A-002…019). A promise a
  checker cannot fail is a sentence, not a contract: each one either gets a rule a fixture fails, or is worded as what
  the host keeps.
- **Compatibility:** Tightening for results, learning, promotion, rollbacks and grants: a document that broke the
  stated rule is now refused. The residue schema widens (additive). The wording changes in items 6 and 8 narrow no
  schema. `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/results-and-evidence.md`, `docs/specification/governance-and-roles.md`,
    `docs/specification/versioning.md`, `docs/specification/memory-and-learning.md`,
    `docs/specification/coordination.md`, `docs/specification/execution-context.md`, `docs/specification/profiles.md`,
    `docs/specification/conformance.md`;
  - schemas: `schemas/coordination.schema.json` (residue);
  - code: `src/core-rules.ts` (new), `src/semantic-rules.ts`;
  - fixtures: `fixtures/positive/versioned-setting-rollback.json`,
    `fixtures/positive/coordination-reconcile-residue-extension.json`,
    `fixtures/negative/coordination-residue-unnamespaced.json`, `fixtures/catalogue.json`;
  - tests: `test/core-rules.test.ts` (new), `test/rule-tolerance.test.ts`; floor in `vitest.config.ts`;
  - docs: `docs/backlog.md` (CT-14).
- **Not decided here:** a schema field for the active revision or the accepting checker of a learning proposal; manifest
  fields for A2A task-state mapping or runner capabilities (a later profile revision may add them); whether a grant's
  channels become required in a later contract version.
- **Source:** the board run's inventory (`docs/evidence/specs/2026-10-11-board-waves/inventory.json`, node `N10-core`);
  DEC-0004…DEC-0009, DEC-0011, DEC-0012, DEC-0013; packet P5-01. DEC-0064 and `FAC-SEM-093`…`FAC-SEM-097`
  were reserved by git CAS (`--key w5-p5-01-core-20261012 DEC`; `--key
  w5-p5-01-sem-{result-integrity,approval-separation,pm-coverage,rollback,grant-window}-20261012 SEM`); `FAC-SEM-095`
  (pm-coverage) is unused because that rule became the `FAC-SEM-006` fix. The owner session wrote this entry under its
  leases; the record plane is `fs`.

### DEC-0065 — Interop and usage: a usage report's window and project attribution, OpenRouter attribution for the organization's products, and text behind its rulings

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: Project Observatory's meter
  writes `byProject` and moves its OpenRouter referer to its product page (CT-20); the adapter's kits offer the
  attribution setting, off by default (CT-18); Fabric attributes from its first model call through OpenRouter (CT-19).
  Board row CT-15.
- **Annotated (2026-10-13):** `byProject`'s known costs add up as its calls do (CT-40): a project costs at least its
  task runs when its own cost is known, and all projects together no more than the days, a `null` cost counting as
  none, within the rounding the day's cost check allows (so rows are written unrounded); and a project holds at least its
  task runs' priced calls (`src/usage-rules.ts`, test/usage-rules.test.ts).
- **Annotated (2026-10-13):** amended by DEC-0076: `byProject` names each project once by the normal form of `projectId`, and the finding names the second spelling (`docs/specification/identifiers.md`).
- **Annotated (2026-10-12):** `attributionHeaders` answers a missing request as `not-openrouter` instead of throwing; vectors pin the default port, a trailing dot, the WHATWG-only forms, the other user-set headers, empty categories and the 64-character slug; adoption.md names how Project Observatory's private node is read (the owed reading of #68; packet P6-08).
- **Amends:** DEC-0021 (the usage report: the window rule and `byProject`). Annotates DEC-0020…DEC-0029 with measured
  adoption. Implements the organization roadmap's RM-16 architecture phase. Closes the board run's inventory items
  CON-OE-13, F-A-005, F-A-012, F-A-022, F-A-023, F-A-024, F-A-029 and RM-16 (node N11, packet P5-02).
- **Decision:**
  1. **The window** ([service → Usage report](specification/service.md#usage-report)). Every `days[].date` exists, is
     not after the UTC date of `generatedAt` and is at most 30 days before it; an unreadable `generatedAt` is a finding
     (`FAC-SEM-025`).
  2. **Project attribution** (CON-OE-13). A usage report MAY carry `byProject[]`: `projectId`, calls, unpriced calls
     and cost, and within it the service's own `taskRuns[]` (`taskRunId`). It is the service's run attribution and
     names no caller, session or person, so `sessionId` is not a field (DL-22, DEC-0039). Each project is one row and
     each task run one row within its project; a project holds at least its task runs' calls; all projects together hold
     no more calls than the days; an unknown cost is `null` as in a day's rows (`FAC-SEM-025`).
  3. **One module per rule.** `FAC-SEM-025` moves whole into `src/usage-rules.ts` (G-13: one code, one checker).
  4. **OpenRouter attribution** ([OpenRouter attribution](specification/openrouter-attribution.md)). A product's setting
     names its slug (its app is `https://passioncode.ai/<product>/`, one app per product), its title and at most two
     recognized categories (`FAC-SEM-098`, kind `openrouter-attribution`, schema
     `openrouter-attribution.schema.json`). `attributionHeaders` adds `HTTP-Referer`, `X-OpenRouter-Title` and
     `X-OpenRouter-Categories`, and nothing else, only with a valid setting, only to `https://openrouter.ai` exactly,
     only for traffic the product originates, and never when the request already carries an attribution header. Without
     a setting nothing is sent.
  5. **Text behind its rulings.** interop.md C3.2's job `result` is the full result envelope (DEC-0017, OQ-0002);
     provider.md states the ruled `FAC-SEM-014` and `FAC-SEM-015` and marks the locked text superseded; the
     `mcp-memory-service` pilot is history in the adapter reference, the estate loop, the source ledger and DOCMAP
     (DEC-0023); the comms checkers' comments no longer call DEC-0022 proposed.
  6. **Adoption is measured, not assumed** ([adoption](evidence/adoption.md)): the pins of the organization's
     repositories on 2026-10-12, annotated on DEC-0020…DEC-0029. A pin that contains a decision is a precondition of
     adopting it, not proof.
- **Why:** a usage report whose dates were never read could put spend in a future month; a host that splits spend by
  project needs it from the service, without learning who called. The organization's products were not credited for
  their own model traffic, and a header rule without a host check would leak a product's identity onto other services
  or over a user's own settings.
- **Compatibility:** Additive for `byProject`, the attribution schema and the rule. Tightening for `FAC-SEM-025`: a
  report with a date outside its window is now refused; a report written as service.md already required passes.
  `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/service.md`, `docs/specification/openrouter-attribution.md` (new),
    `docs/specification/interop.md`, `docs/specification/provider.md`, `docs/specification/conformance.md`;
  - reference architecture: `docs/reference-architecture/mcp-memory-service-adapter.md`,
    `docs/reference-architecture/estate-loop.md`;
  - schemas: `schemas/service-usage.schema.json` (`byProject`), `schemas/openrouter-attribution.schema.json` (new);
  - code: `src/usage-rules.ts` (new), `src/openrouter-attribution.ts` (new), `src/semantic-rules.ts`;
  - fixtures: `fixtures/positive/service-usage-by-project.json`, `fixtures/negative/service-usage-by-project-session.json`,
    `fixtures/positive/openrouter-attribution.json`, `fixtures/negative/openrouter-attribution-*`,
    `fixtures/vectors/openrouter-attribution.json`, `fixtures/catalogue.json`;
  - tests: `test/usage-rules.test.ts` (new), `test/openrouter-attribution.test.ts` (new), `test/positive-sweep.test.ts`,
    `test/schema-compilation.test.ts`, `test/rule-tolerance.test.ts`, `test/secret-envelope.test.ts`,
    `test/route-rules.test.ts`; floors in `vitest.config.ts`;
  - docs: `docs/evidence/sources.md` (OpenRouter *App Attribution*), `docs/evidence/adoption.md` (new),
    `docs/DOCMAP.md`, `README.md`, `CONTEXT.md`, `docs/backlog.md`.
- **Not decided here:** a per-project breakdown by day or by model; whether a hidden app (`X-OpenRouter-App-Visibility`)
  is ever right for a product; attribution on providers other than OpenRouter; a schedule for re-measuring adoption.
- **Source:** the board run's inventory (`docs/evidence/specs/2026-10-11-board-waves/inventory.json`, node
  `N11-interop-usage`); the organization's roadmap RM-16 (fabric-workspace `knowledge/roadmap.md`); OpenRouter's *App
  Attribution* page in the [source ledger](evidence/sources.md); DEC-0017, DEC-0021, DEC-0022, DEC-0023, DEC-0039;
  packet P5-02. DEC-0065 and `FAC-SEM-098` were reserved by git CAS (`--key w5-p5-02-interop-usage-20261012 DEC`,
  `--key w5-p5-02-sem-openrouter-attribution-20261012 SEM`); the record plane is `fs`.

### DEC-0066 — The relay audit's amendment: one answer until the signer is proven, low-S and strict instants, revalidated sessions, the envelope's sequence and mark, and every refusal a shared vector (`fabric-relay/0.1`, `fabric-secret-envelope/1`, amended in place)

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: the relay server
  ([passioncode-ai/relay](https://github.com/passioncode-ai/relay)) re-pins, vendors `src/relay-vectors.ts` and runs
  every shared case, signs its test traffic with `signEs256`, and builds the admission, frames, blob and delta parts
  (its RP, A-3…A-7, B-1, C-1, D-1, D-2, H-1, H-2; CT-33); Project Observatory's node seals with a sequence, keeps the
  mark with its vault and checks replays (CT-34); every relay client signs low-S.
- **Annotated (2026-10-26):** DEC-0129 decides `org-authority/1` and an organization relay's admission set (CON-023's
  source); the organization relay's handshake and how one relay serves several contexts stay open (CT-37, RLY-08).
- **Annotated (2026-10-26, DEC-0134):** DEC-0134 decides the organization relay's handshake (relay.md OR-1 to OR-5);
  how one relay serves several contexts stays RLY-08 (one context per origin until then).
- **Amends:** DEC-0047 items 2, 3, 4, 5, 7, 8 and 9, in place: nothing is deployed (the hosted relay's RLY-05 is
  open, and no envelope exists outside tests). Folds in DEC-0047's 2026-10-12 annotation of the blob request. Also
  amends the window of DEC-0055 (ER-10) and DEC-0060 (DL-14), each annotated. Closes the relay audit's CON-001…CON-017,
  CON-019…CON-022, RLY-023, RLY-024, PLN-090…PLN-092 (board RELAY-AUDIT-1, node N19); CON-018 was closed before by #64
  (DEC-0054), and CON-023 (organization relays) waits on Fabric D8 (*Not decided here*).
- **Decision:** in [relay](specification/relay.md) unless named otherwise —
  1. **Keys and times** (item 2). A relay-family signature (`relay-auth/1`, `relay-blob/1`, a message body, an
     envelope) is low-S, `s ≤ n/2`, and `verifyEs256` refuses `(r, n − s)`; signers use `signEs256` or `toLowS`
     (`src/p256.ts`, with `isLowS`); WebAuthn assertions are exempt. Identity is `(from, msgId)` for a message and
     `(sender, agentRef, slot, envelopeSequence)` for an envelope, never the digest. `instant` keeps the relay's pattern
     (`Z`, upper-case `T`, at most nine fraction digits) and reads through `strictTime`, so a day its month lacks, hour 24
     and `:60` are refused; FAC-SEM-070 and `relayAdmissionSet` read times the same way. `CLOCK_SKEW_SECONDS` (60) lives
     in `src/rfc3339.ts` and is the one skew of the relay family's and the estate record's times (HTTP message signatures
     keep their 300 s, delegation its `LEEWAY_SECONDS`, and a window lease's `issuedAt` its 0 s): an estate record's
     `issuedAt` may be 60 s ahead in
     `verifyEstateRecord` (ER-10, the owner's P3), DL-14's `hubKeyCertified` holds the same window (DEC-0060), and
     DEC-0054's `MAX_FUTURE_SECONDS` is the same constant; DEC-0055's and DEC-0060's texts stay as they were and carry a
     dated annotation. A time is read to the millisecond.
  2. **Transport and frames** (item 3). `hello.relay` is an origin and nothing more: https on a host name or a bracketed
     IP literal, or http on a loopback literal (127.0.0.0/8, `[::1]`), never a name over http, with a port up to 65535
     and no path or user information (`isRelayOrigin` and the schema's pattern are `RELAY_ORIGIN_PATTERN`; the owner's
     P9). `bad-key` stays a relay error code only as reserved: no relay sends it. `unknown-type` is a type not in
     `FRAME_TYPES` or one a node never sends; `malformed` a known type that fails the schema or FAC-SEM-071. An answer
     carries `replyTo` (`error`, `accepted`, `pong`, `presence-result`, `delta`); `presence-query` gets one
     `presence-result {replyTo, presences, unknown}`; `error` may carry `retryAfter`; `welcome.limits` advertises the
     relay's own numbers. The close-code table is `closeCodeFor`: 4401 for every refusal of `auth` and the auth
     deadline, 4403 only for a proven session that left the set or whose record expired, 1009, 1003, 1001, 1008 after
     repeated `rate-limited`, 1011 after `internal`.
  3. **Admission** (item 4). `admit` checks the frame's own bytes first (protocol, `alg`, the times), then the nonce,
     then, as one step with one answer, the signed estate against the estate of the record the context admits from
     (`AuthContext.estate`), the kid's key in the set and the signature: any failure is `unauthenticated`, so a forged or
     unknown signer learns nothing (the owner's position on CON-001). A relay MUST verify exactly one signature of equal
     cost on every such path, under a fixed dummy key when it has no usable key, and apply low-S after it, so the work
     tells nothing either (the adversarial round's F1). The estate is compared there and nowhere else, and
     relay.md forbids the estate id as an identifier a connection can see or that links one person's contexts (CX-22;
     multi-context admission is relay RLY-08). `relayAdmissionSet` leaves out every `#sig` key that could never verify
     (`excluded`), subtracts `extraRevocations` (verified delta entries), and answers `not-yet-valid` before the window.
     Open sessions are revalidated on every new set: a kid that left it is closed `not-admitted`/4403, and every session
     is closed `expired`/4403 when the held window ends (replacing "at their next re-authentication").
  4. **Messages** (item 5). A recipient passes its own `#sig` kid as `to` (the parameter is renamed `expect`); `deliver`
     keeps no `to`. `checkReplay` keeps each accepted `(from, msgId)` until its signed `exp` (`replay`, a new
     `MessageRefusal`; after `exp`, `expired`). The JWS header is exactly `{alg, typ, kid}`, `kid` optional and the
     signed `from`; anything else is `malformed` (the owner's P7). The header and payload are their own RFC 8785 bytes and
     the payload carries exactly its seven members; every `malformed` comes before `unsupported-alg`. `rate-limited`, `mailbox-full`, `expired` and
     `internal` have their triggers, and relay.md lists every message refusal.
  5. **The envelope** (item 7). `envelopeSequence` (1 to 2^53 − 1) is required and signed. `OpenContext.lastOpened`
     returns the target's mark `{since, sequence, digest}`; after `placement-stale` a sequence below the mark of the
     current run, or a mark ahead of it, is `replayed`, and another envelope at the mark's sequence is
     `sequence-reused` (the owner's condition); an equal sequence passes only with the same digest. A successful open
     returns the mark, written with the secret in one transaction. A sealer keeps its last sequence per (agentRef,
     slot), recovers at `max(last + 1, now_ms)` and never seals under a used sequence; `sealEnvelope` refuses a sequence
     outside 1 to 2^53 − 1. Step 1 is `envelopeShape`,
     exactly the schema plus real instants, held equal to it by a parity test. One verifier (`verifyEs256`) and one
     signer (`signEs256`) serve the envelope.
  6. **Blobs** (item 8). The signer first: form, `alg`, shape, `iat`, then the signer's key and signature as one 401
     `unauthenticated` (`verifyBlobRequest`, with no blob state in its context), then a PUT's recipients (403
     `unknown-recipient`); the state comes last (`decideBlobAccess`: 201, 200, 409 `recipients-mismatch` after the
     bytes verify, one 403 `not-admitted` for a GET). `MAX_BLOB_BYTES` is 32 MiB; a PUT needs `Content-Length` (411);
     refusals carry `{"error": {"code", "message"}}`. A second recipient set for the same bytes stays 409 this release
     (the owner's P5).
  7. **Delta ingress** (item 9; the owner's P1, option a). An admitted hub machine sends `delta` and `heartbeat` frames
     on its own session; the relay accepts one only when it verifies under its held record by DEC-0054's rules (an
     estate key the record certifies as DL-14/DEC-0060 do, `applyDelta`, `acceptHeartbeat`, the sequence and `sha256`
     chain unchanged), answers a refused page with `applyDelta`'s own problem code (`gap` included), keeps the revocations
     of its correctly signed forked and broken-chain entries in force (RD-10), subtracts the revocations in force from its admission set and closes the
     revoked sessions. revocation-delta.md's "SHOULD subtract" becomes this rule.
  8. **Shared vectors.** Every refusal of `admit`, `verifyMessageBody`/`checkReplay`, `verifyBlobRequest`/
     `decideBlobAccess` and `openEnvelope` is a case in `fixtures/vectors/relay.json` (groups `instant`, `relayOrigin`,
     `admissionSet`, `admit`, `messageBody`, `replay`, `blobRequest`) or `fixtures/vectors/secret-envelope.json`
     (`cases`), run by the framework-free `src/relay-vectors.ts`, which a port vendors. The legacy members stay.
     `tools/vectors/relay-crypto.ts` writes and checks the files (deterministic keys from published labels, RFC 6979,
     low-S), and a test holds the committed files equal to its output (the owner's P8); it also owns the estate-record
     cases at the `issuedAt` skew boundary.
- **Why:**
  - **The relay audit of 2026-10-12** (Project Observatory's release iteration 1; its canvas and dossiers AD, BC, E and
    FG live in a private repository, so the shared vectors here are the public proof) reproduced each item: a forged
    PUT learned blob state (409); `admit` named `not-admitted` before the signature; `2026-02-30` rolled forward to
    2 March inside a valid window; `(r, n − s)` verified; a JWS with `crit` and a foreign `kid` verified; an old envelope
    re-opened after a rotation; envelopes the schema refuses opened; refusals existed only as TypeScript tests; open
    sessions outlived their revocation.
  - **One answer until the signer is proven:** admission membership and blob state are state, and an unproven caller
    must learn none of it. A revoked machine's operator reads the reason in the relay's log.
  - **A sequence, not a time,** carries anti-rollback: it needs no passkey ceremony per rotation and no millisecond
    clocks; the mark is scoped to the placement run so a new holder's counter starts clean, and the equal-sequence
    rule keeps at-least-once delivery and crash-safe writes.
  - **Data vectors and one vendored runner** make the relay run exactly what the contract runs.
- **Compatibility:** Amended in place under `fabric-relay/0.1` and `fabric-secret-envelope/1` (the owner's P4 and P6):
  nothing is deployed — the hosted relay was never released (relay RLY-05 open) and no envelope exists outside tests.
  Changes of answer: an unknown kid, an unusable admitted key and a forged blob signer answer 401/4401
  `unauthenticated` (were 403/4403 `not-admitted`, `bad-key`, `unsupported-alg`); a high-S signature is refused; a day
  that does not exist is refused; a held window not yet started is `not-yet-valid` (was `expired`); an estate record
  60 s ahead verifies, and so does its hub key; an envelope without `envelopeSequence`, and a signature that is not 86
  characters, are `malformed`; a message body whose header or payload is not its own RFC 8785 bytes or whose payload
  has another member is `malformed`, and `malformed` now precedes `unsupported-alg`; a blob request header that has no
  RFC 8785 form is 400 `malformed` (it threw); `hello.relay` with a path, user information or a port above 65535 is
  refused. API: `BlobRequestContext.stored` is gone (`decideBlobAccess`), `AuthContext.estate` and
  `OpenContext.lastOpened` are required, `SealInput.envelopeSequence` is required, `openEnvelope`'s result carries
  `mark`. The vector files keep their legacy members; their values are regenerated. `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/relay.md`, `docs/specification/estate-record.md` (ER-10's skew),
    `docs/specification/conformance.md` (the estate-record row), `docs/specification/delegation.md` (DL-14 row 4),
    `docs/specification/revocation-delta.md` (who adopts it);
  - schemas: `schemas/relay-frame.schema.json`, `schemas/secret-envelope.schema.json`;
  - code: `src/relay.ts`, `src/relay-rules.ts`, `src/p256.ts`, `src/secret-envelope.ts`, `src/rfc3339.ts`,
    `src/estate-record-rules.ts`, `src/hub-key-rules.ts`, `src/revocation-delta.ts` (`MAX_FUTURE_SECONDS`),
    `src/relay-vectors.ts` (new, with a coverage floor in `vitest.config.ts`), `tools/vectors/relay-crypto.ts` (new);
  - vectors and fixtures: `fixtures/vectors/relay.json`, `fixtures/vectors/secret-envelope.json`,
    `fixtures/vectors/estate-record.json`, `fixtures/vectors/hub-key.json`, `fixtures/positive/secret-envelope.json`,
    `fixtures/negative/secret-envelope-*.json`, `fixtures/semantic/relay-envelope-*.json`, `fixtures/catalogue.json`;
  - tests: `test/relay-vectors.test.ts` (new), `test/worker-key-form.test.ts` (new), `test/relay-constant-work.test.ts`
    (new), `test/hub-key.test.ts`, `test/relay.test.ts`,
    `test/relay-request.test.ts`, `test/relay-rules.test.ts`, `test/secret-envelope.test.ts`, `test/p256.test.ts`,
    `test/estate-record.test.ts`; `tsconfig.json` covers `tools/`;
  - docs: `docs/DOCMAP.md`, `docs/handoffs/2026-10-12-relay.md`, `docs/evidence/sources.md` (RFC 6979; RFC 6455's
    1008, 1011 and 4403), `CONTEXT.md`, `README.md`;
  - consumer rows in `docs/backlog.md`, each with a "DEC-0066:" clause: CT-18 (the adapter's estate ports), CT-19 (the
    hub's delta frames), CT-20 and CT-33 (the relay's session wrapper), CT-34 (the node's sequence, mark, replay window,
    own kid and low-S), CT-35 (Fabric's surfaces sign low-S).
- **Not decided here:** grants for a second recipient set (409 stays); how a relay serves several contexts (relay
  RLY-08, with Fabric D8); organization relays and their admission source (CON-023, waiting on Fabric D8,
  `org-authority/1`); low-S for the contract's other ES256 users (DEC-0056 HTTP signatures, DEC-0060 delegation
  keys); how a target tells a sealer that lost its state its mark; removing the legacy vector members.
- **Source:** Project Observatory's release iteration 1 of 2026-10-12 (its canvas S10, S11, S15 and S16, dossiers AD
  §3.2–3.6, BC §3.1 and §3.5, E, FG §3.8 — private; the vectors in this change are the public proof); the owner's review
  of #70 (three readings, rulings A–C, items 1–16) and an adversarial round (F1, F3–F8); the contract owner's positions (C1–C5) and answers P1–P10 of
  2026-10-12, relayed by the coordinator; RFC 6979, RFC 7515, RFC 8785, RFC 9180, SEC 1 v2. DEC-0066 was reserved by
  git CAS (`agent_sync.py reserve --key relay-audit-n19-20261012 DEC`); no rule code was reserved. This file,
  `docs/backlog.md` and `conformance.md` were edited under git leases of run `N19-relay-audit`; the record plane is
  `fs`.
- **Annotated (2026-10-17):** amended by DEC-0084: an open session stands only while its kid maps to the key octets it
  was proven under (`sessionStands`), not only while its kid stays in the admission set, so a session proven under a
  replaced key closes with 4403 `not-admitted` (relay.md's close-code table); `relayAdmissionSet` admits a `#sig` key
  only under its own machine's kid (F7) and reports a malformed key reference in `unread`.

### DEC-0067 — Protocol revisions: a receiver accepts N and N−1, says so in `protocols`, and refuses another revision with `schema-unsupported`

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: Project Observatory's node lists
  `protocols` in its check-in and answers `schema-unsupported` (CT-20); the first organization server lists what it
  accepts in its enrollment response and sends records in a revision the node reads (CT-04); services and the adapter's
  kits may list `protocols` in the well-known document (CT-18). Board row CT-16.
- **Amends:** DEC-0009 (how a revision is negotiated and refused, not only named). Implements the first organization
  server's target architecture v4 §12 row "`protocols[]` with N and N−1, `schema-unsupported`" (commit `9c6a780`) and
  the organization edition's CON-OE-07. Closes the board run's inventory item CON-OE-07 (node N12, packet P6-01).
- **Annotated (2026-10-20):** DEC-0094 adds a fourth carrying object, the check-in response, sent only to a node pinned
  at or after DEC-0094 or one that ignores unknown members; the latest list a node
  received, from its enrollment or a check-in response, is the server's current one.
- **Decision:** in [versioning → Protocol revisions](specification/versioning.md#protocol-revisions) —
  1. **The register.** `PROTOCOL_REVISIONS` in `src/protocol-revisions.ts` lists every contract protocol's published
     revisions, oldest first; a test keeps it equal to the revisions the schemas pin with `const` plus `NAMED_ONLY` (five
     protocols a specification names without a schema pin). A decision that publishes a revision appends it and widens
     each module's own revision constant, which a test keeps at the newest entry.
  2. **N and N−1.** A receiver accepts the newest revision of a protocol it implements and the one before it in the
     register, and no other; it never translates between revisions (DEC-0009).
  3. **`protocols`** (`common.schema.json#/$defs/protocols`): at most N and N−1 per protocol, each entry
     `<name>/<revision>` once, 1 to 64 entries (`FAC-SEM-099`, kind `protocols`). It is optional in the service well-known document
     (what the service accepts), the device check-in (what the node reads) and the device enrollment response (what the
     receiver accepts), and `FAC-SEM-099` checks it in each. A sender writes the newest revision both sides name; absent,
     a party reads only its own documents' revision.
  4. **`schema-unsupported`** (`schemas/schema-unsupported.schema.json`, `negotiateRevision`): sent before the document is
     read further, naming the revision received (at most 80 characters, never splitting one) and the accepted revisions
     of that protocol, or all of them when the received value names none the receiver reads; revisions compare as exact
     strings. The accepted list is normalised (well-formed, once, at most 64), so the refusal always validates; a receiver
     accepting nothing answers its own fault `no-accepted-revisions` instead. HTTP 400
     with the JSON body, or an MCP `isError` result's `structuredContent`, answered after the request is authenticated
     (device signature, DL-13) and before its body is read, as DEC-0009's "before semantic probes" allows, in the envelope of
     `delegation-refusal.schema.json`. The relay keeps its own frame code `protocol-unsupported` (DEC-0047).
- **Why:** an organization's machines update at different times; without a stated window a receiver either refuses a
  machine one release behind or silently guesses at a revision it does not implement. Two revisions bound the window,
  the list makes it visible before anything is sent, and one refusal shape lets a sender pick again.
- **Compatibility:** Additive for readers at this pin: `protocols` is optional everywhere, and every protocol has one
  published revision today, so N−1 does not yet exist and every current document is accepted as before. Not for an
  older pinned reader: the three carrying objects are closed, so a party sends `protocols` only to a reader pinned at
  or after this decision (CT-04, CT-18, CT-20 note it). `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/versioning.md`, `docs/specification/service.md`, `docs/specification/devices.md`,
    `docs/specification/conformance.md`;
  - schemas: `schemas/common.schema.json` (`protocolRevision`, `protocols`), `schemas/service-well-known.schema.json`,
    `schemas/device-check-in.schema.json`, `schemas/device-enrollment.schema.json`,
    `schemas/schema-unsupported.schema.json` (new);
  - code: `src/protocol-revisions.ts` (new), `src/semantic-rules.ts`, `src/device-rules.ts`;
  - fixtures: `fixtures/positive/service-well-known-protocols.json`, `fixtures/negative/service-well-known-protocols-unparsed.json`,
    `fixtures/positive/device-check-in-protocols.json`, `fixtures/positive/device-enrollment-response-protocols.json`,
    `fixtures/positive/schema-unsupported.json`, `fixtures/negative/schema-unsupported-empty-accepted.json`,
    `fixtures/vectors/protocol-revisions.json`, `fixtures/catalogue.json`;
  - tests: `test/protocol-revisions.test.ts` (new), `test/schema-compilation.test.ts`, `test/positive-sweep.test.ts`,
    `test/rule-tolerance.test.ts`; floor in `vitest.config.ts`;
  - docs: `docs/backlog.md` (CT-16), `README.md`, `CONTEXT.md`, `docs/DOCMAP.md`.
- **Not decided here:** a revision's end of support beyond N−1 (a third revision drops the first); a revision field for
  the signing-statement types (`relay-auth/1`, `estate-revision/1`, …), which are versioned inside their own registers;
  `crit` on device policy (v4 §12 *Later*).
- **Source:** the first organization server's target architecture v4 at `9c6a780` (§12); the organization architecture
  v2's contract plan row CON-OE-07 and its CROSSWALK-v4 (fabric-workspace `docs/reports/2026-10-08-org-architecture-v2/plans/`);
  DEC-0009; packet P6-01. DEC-0067 and `FAC-SEM-099` were reserved by git CAS (`--key w6-p6-01-protocols-20261012 DEC`,
  `--key w6-p6-01-sem-protocols-20261012 SEM`); the record plane is `fs`.

### DEC-0068 — The session join key: the runtime's `session.id`, one collector writes a session's intervals and usage, surfaces annotate

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Agreed with Project Observatory's session on
  2026-10-12 (its node is the single writer; the collector side is filed in its program for CT-20). Consumer adoption:
  Project Observatory's collector writes Fabric's and Switchboard's session events as `session.annotation` (CT-20);
  Fabric and Fabric Switchboard keep their own events as events and never count them into activity (CT-19, CT-03);
  the first organization server counts only intervals and usage lines (CT-04). Board row CT-16.
- **Amends:** DEC-0030 (a core kind `session.annotation`, additive within `fabric-activity/0.1` by its own rule for new
  core kinds; a rule for one writer per session). Implements the organization architecture v2's CON-OE-08 (R07-5, kept
  unchanged by its CROSSWALK-v4). Closes the board run's inventory item CON-OE-08 (node N12, packet P6-02).
- **Decision:** in [activity → One writer per session](specification/activity.md#one-writer-per-session) —
  1. **The key.** The runtime's `session.id` joins every event about a session.
  2. **One writer.** On one device the collector writes a session's `session.interval` and `usage.line` events: every
     counted event of one `session.id` carries one `collector.id`, and the session's intervals do not overlap
     (`FAC-SEM-100`, kind `session-join`, `{events}`).
  3. **Annotations.** What Fabric (`session.ended`, `terminal.opened`), Switchboard (`journal_launch`) or another surface
     reports about a session is written by the collector as `session.annotation` `{by, label, at}`; the schema refuses
     start, end, tokens, cost and `user` in it, so it is never counted and adds no subject to a summary cell's
     population.
  4. **What a reader counts.** Interval seconds by state and one usage line per `dedupeKey`, nothing else
     (`sessionTotals` in `src/session-join.ts`): a session seen by three writers totals as its collector wrote it.
- **Why:** three writers of one session's time (the collector, Fabric, Switchboard) with no join key counted the same
  work two or three times; a single writer per fact and a key make the count one by construction.
- **Compatibility:** Additive: a reader that does not know the new core kind already stores it as an unknown kind
  (DEC-0030), and a rule over events no consumer writes from two collectors today. `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/activity.md`, `docs/specification/conformance.md`;
  - schemas: `schemas/telemetry-event.schema.json` (`session.annotation`);
  - code: `src/session-join.ts` (new), `src/semantic-rules.ts`, `src/activity-rules.ts` (`population`);
  - fixtures: `fixtures/positive/telemetry-event-session-annotation.json`,
    `fixtures/negative/telemetry-event-annotation-with-duration.json`, `fixtures/negative/telemetry-event-annotation-with-user.json`,
    `fixtures/negative/telemetry-event-annotation-without-session.json`, `fixtures/semantic/session-join-*`,
    `fixtures/catalogue.json`;
  - tests: `test/session-join.test.ts` (new), `test/rule-tolerance.test.ts`; floor in `vitest.config.ts`;
  - docs: `docs/backlog.md` (CT-16), `README.md`, `CONTEXT.md`, `docs/DOCMAP.md`.
- **Not decided here:** how a collector merges intervals it reads from two sources of its own (OTel and a transcript)
  before writing them — its method, recorded in `data.method`; a session that moves between devices.
- **Source:** the organization architecture v2 (fabric-workspace `docs/reports/2026-10-08-org-architecture-v2/README.md`
  §4 "One writer per fact", R07-5) and its contract plan row CON-OE-08; DEC-0030; packet P6-02. DEC-0068 and
  `FAC-SEM-100` were reserved by git CAS (`--key w6-p6-02-session-join-20261012 DEC`, `--key
  w6-p6-02-sem-session-join-20261012 SEM`); the SEM counter at origin is consistent, but its receipt commit is not
  reachable on origin's SEM chain (the agent-sync defect AGENT-SYNC-IDS); the record plane is `fs`.

### DEC-0069 — An app's own descriptor: `lifecycle.manager: "person"`, written by its installer or by the app on an install or update, and never a statement that it runs

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Agreed with Fabric's session on 2026-10-12 (its
  CO-263, with its amendment: an update is a reinstall). Consumer adoption: Fabric writes its descriptor this way and
  keeps its liveness in its own file (CT-19); the adapter's kits read an app's descriptor for an "Open in <app>" button
  and its liveness file before sending anything (CT-18).
- **Amends:** DEC-0015 (the one exception to "the running service MUST NOT write its own descriptor"), DEC-0032 and
  DEC-0061 (a sixth `lifecycle.manager`, `person`). Closes Fabric's ask CO-263 (board row CT-19; packet P6-06).
- **Decision:** in [service → An app's descriptor](specification/service.md#an-apps-descriptor) —
  1. **`lifecycle.manager: "person"`** with `lifecycle.app`, the installed app (a bundle or an executable); no `label`,
     `plist`, `unit` or `task`; `installedBy` in its object form with `by: "person"` (schema).
  2. **Who writes it.** The installer; when there is none (a macOS app dragged into Applications), the app on a start
     where no descriptor exists, where its version differs from `installedBy.tool`'s or where it runs from another path
     than `lifecycle.app`, and on no other start; never from a translocated copy (`appDescriptorAction` in
     `src/app-descriptor.ts`). Only an app that writes its own descriptor does this. Removed at uninstall when it can be; a reader that does not find
     `lifecycle.app` treats it as stale (`appDescriptorStale`).
  3. **Installed, never running.** `origin` is optional for an app; its live origin and process id are in the app's own
     liveness file, rewritten on every start and removed on quit. A kit's "Open in <app>" button reads the descriptor; a
     caller that sends anything reads the liveness file and checks the process. Without an origin, the descriptor claims
     no port (`FAC-SEM-010`).
- **Why:** an app has no supervisor, so the rule that only an installer writes a descriptor left Fabric's desktop app,
  which has no installer on macOS, with no descriptor at all, and a descriptor that claimed a port it changes each start
  would point callers at a dead origin.
- **Compatibility:** Additive in the schema: a new enum value and an optional member, and `origin` stays required for
  every other manager. The descriptor sits in a shared directory, so an app cannot choose its readers: a reader pinned
  before this decision (Fabric Dashboards and the adapter's kits today) refuses or mislists `manager: "person"` and a
  missing origin until it adopts this decision (CT-18, CT-21), and must skip such an entry rather than fail the
  directory. `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/service.md`;
  - schemas: `schemas/service-descriptor.schema.json`;
  - code: `src/app-descriptor.ts` (new), `src/semantic-rules.ts` (`FAC-SEM-010`);
  - fixtures: `fixtures/positive/service-descriptor-person-app.json`, `fixtures/negative/service-descriptor-person-*`,
    `fixtures/negative/service-descriptor-without-origin.json`, `fixtures/negative/service-descriptor-app-beside-launchd.json`,
    `fixtures/vectors/app-descriptor.json`, `fixtures/catalogue.json`;
  - tests: `test/app-descriptor.test.ts` (new); floor in `vitest.config.ts`;
  - docs: `docs/backlog.md` (CT-19), `README.md`, `CONTEXT.md`, `docs/DOCMAP.md`.
- **Not decided here:** the liveness file's name, place and shape (each app's own; Fabric's is its hub file); an app's
  descriptor on Linux and Windows package managers that do have an installer (they write it as any installer does).
- **Source:** Fabric's session, CO-263 and its amendment (2026-10-12, Fabric `main` `bb0e6870`); DEC-0015, DEC-0032,
  DEC-0061; packet P6-06. DEC-0069 was reserved by git CAS (`--key w6-p6-06-app-descriptor-20261012 DEC`); no rule code
  was needed; the record plane is `fs`.

### DEC-0070 — A service feed event may carry machine-readable `data`: a published schema and a bounded value, never a secret

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Asked for by a consumer service that publishes
  daily activity summaries and unanswered community questions on its feed (2026-10-12), following option (b) of Fabric's
  answer of 2026-10-11 (contract `1e7a7d6`). Consumer adoption: the adapter's kits let a service add `data` (CT-18);
  Fabric reads it when it knows its schema and shows `text` otherwise (CT-19).
- **Amends:** DEC-0015's events feed (`service-events-page.schema.json`, an optional member of an event). Packet P6-07.
- **Decision:** in [service → Events feed](specification/service.md#event-data) —
  1. **`data`** is optional: `{schema, value}`. `schema` is the absolute URI of a payload schema the service publishes;
     `value` is an object of at most 32 members, each a scalar (a string of at most 500 characters, a number, a boolean,
     null), a list of at most 32 scalars, or an object of at most 32 scalar members (schema).
  2. **`text` stays the event.** A host that ignores `data` loses nothing; a host validates `value` against `schema` when
     it knows that schema, otherwise treats it as opaque, and never fails an event for it.
  3. **No secret, no personal data.** No string in `value` sits under a credential's name or has a credential's shape
     (`FAC-SEM-101`, kind `service-events-page`, the shared detector of `src/secret-shape.ts`, values and URLs); a
     list's items and an object's members count under the outer name too; a number under a name such as
     `inputTokens` is a count. Personal data is the service's duty: no check tells a name from another string.
- **Why:** consumers of a feed could only read the sentence; a summary or a question carried counts and ids a host had
  to parse out of prose. A published schema keeps the fields the service's own, and the bounds keep a feed a feed.
- **Compatibility:** Additive in the schema. The feed is pulled, so a service cannot know its readers' pins: a host that
  validates events against a copy pinned before this decision refuses the new member (the event object is closed) until
  it adopts this decision; a host that ignores unknown members, as Fabric Dashboards does, shows `text` as before. `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/service.md`, `docs/specification/conformance.md`;
  - schemas: `schemas/service-events-page.schema.json`;
  - code: `src/feed-data.ts` (new), `src/semantic-rules.ts`;
  - fixtures: `fixtures/positive/service-events-page-data.json`, `fixtures/negative/service-events-page-data-*`,
    `fixtures/catalogue.json`;
  - tests: `test/feed-data.test.ts` (new), `test/positive-sweep.test.ts`, `test/rule-tolerance.test.ts`; floor in
    `vitest.config.ts`;
  - docs: `docs/backlog.md` (CT-18, CT-19), `README.md`, `CONTEXT.md`, `docs/DOCMAP.md`.
- **Not decided here:** a registry of payload schemas; `data` on the Server-Sent Events stream beyond "the same event
  objects" it already carries.
- **Source:** the consumer service's request (2026-10-12); Fabric's answer (contract `1e7a7d6`); DEC-0015; packet P6-07.
  DEC-0070 and `FAC-SEM-101` were reserved by git CAS (`--key w6-p6-07-feed-data-20261012 DEC`, `--key
  w6-p6-07-sem-feed-data-20261012 SEM`); the record plane is `fs`.

### DEC-0071 — A consumer agent: `kind: agent` without a provider manifest, requiring MCP servers by role and tools

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Asked for and agreed by the first organization
  server's session on 2026-10-12 (its admin agents are plugins that only call its MCP at each organization's own
  address). Consumer adoption: the first organization server repacks its admin agents as consumer agents (CT-04);
  Project Observatory's node checks `requires.mcp` with `consumerPlacement` before it places one (CT-20); the adapter's
  `pack` writes them (CT-18).
- **Annotated (2026-10-12):** its open question (which secret slot feeds which role's server entry) is decided by DEC-0074 (`requires.mcp[].secrets`).
- **Amends:** DEC-0050 (`fabric-package/1`: `provider` becomes optional for an agent that serves nothing;
  `requires.mcp[]`). Packet P6-09.
- **Decision:** in [package → A consumer agent](specification/package.md#a-consumer-agent) —
  1. **A consumer agent** is `kind: agent` without `provider`: it keeps `agentRef`, `resultSignal` and `evals`, may carry
     `secrets[]`, lists its `skills` and its plugin manifest (`FAC-SEM-064`), and has no `service`, `state` or `layer`
     (schema).
  2. **`requires.mcp[]`**: each server it calls by `role` — the server registered under that name in the placement's
     configuration — with the `tools` it must expose and an optional `contract` name. Never an address or a token; those
     come with the placement through the secret slots. Each role once (`FAC-SEM-102`, kind `package`); no role,
     contract or tool shaped like a credential (`FAC-SEM-065`). Any package may declare it.
  3. **The placement's check.** `consumerPlacement(package, configured)` answers each required role the configuration
     does not register (`missing-role`) and each tool a registered server lacks (`missing-tool`); role names compare
     exactly.
- **Why:** an agent that only consumes tools had to pack as a skill set, which cannot carry an `agentRef`, a secret slot
  or a result signal; and "some MCP server is there" did not tell a placement whether the tools the skills call exist.
- **Compatibility:** Additive for readers at this pin: every agent package valid before stays valid (`provider`
  present). An older pinned reader refuses an agent without `provider`, so a consumer agent is placed by readers pinned
  at or after this decision. `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/package.md`, `docs/specification/conformance.md`;
  - schemas: `schemas/fabric-package.schema.json`;
  - code: `src/package-rules.ts` (`consumerPlacement`, `FAC-SEM-102`, the plugin manifest and credential checks);
  - fixtures: `fixtures/positive/fabric-package-consumer-agent.json`, `fixtures/negative/fabric-package-consumer-*`,
    `fixtures/catalogue.json`;
  - tests: `test/consumer-agent.test.ts` (new);
  - docs: `docs/backlog.md` (CT-04, CT-18, CT-20), `CONTEXT.md`, `docs/DOCMAP.md`.
- **Not decided here:** how a placement learns the tools a configured server exposes (its MCP `tools/list`, or a
  pinned list); which secret slot configures which role's server entry; the usage and spend route of an agent without a
  service; a consumer agent's evals against a server it does not control.
- **Source:** the first organization server's session (2026-10-12, its admin-agent packing); DEC-0050; packet P6-09.
  DEC-0071 and `FAC-SEM-102` were reserved by git CAS (`--key w6-p6-09-consumer-agent-20261012 DEC`, `--key
  w6-p6-09-sem-consumer-agent-20261012 SEM`); the record plane is `fs`.

### DEC-0072 — Proposals and learning notes: `fabric-proposal/1` and `learning-note/1`, nothing applies itself, nothing private leaves

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Agreed with Fabric's session on 2026-10-12 (its five
  corrections against ADR-0109 and ADR-0029). Consumer adoption: Fabric keeps proposals and answers learning notes in
  this shape and refuses a private proposal at submit (CT-19); Project Observatory sends learning notes and Fix
  proposals by reference (CT-20); the first organization server receives approved rules and listings only (CT-04).
- **Annotated (2026-10-12):** `FAC-SEM-103` also scans the proposal's URIs (`id`, `target.project`, `mergedInto`,
  `supersededBy`, `appliedIn`), the goal's id and text, the finding's id, `approvedBy.policy` and `verifiedRun`, and finds a
  home-folder path after `file://localhost` and after any character that cannot continue a path (a backtick, a bracket,
  a comma), not only after a space, a quote or `(=:` (the board run's final verification; w7 close).
- **Amends:** DEC-0023 (`memory.learning.propose` withdrawn). Implements the organization edition's CON-OE-05 (kept by
  its CROSSWALK-v4; `proposal.submit` also serves a listing, v4 Path 4). Closes the board run's inventory item
  CON-OE-05 (node N12, packet P6-03).
- **Decision:** in [proposals](specification/proposals.md) —
  1. **`fabric-proposal/1`**: `type` `rule` | `new-agent` | `skill-promotion` | `skill-retirement` | `listing` | `fix`;
     `goal` required for the first four; `evidence[]` by reference only; a fix carries its `finding` and, once its source
     stops reporting it, `verifiedAt` and `verifiedRun`; `target` the owning project's manager or the CEO; `private`
     for a private agent's proposal (schema).
  2. **Decisions.** `status` moves only along proposed → approved | refused | merged | superseded → applied → retired, and
     `verified` for a fix (`FAC-SEM-104`, `PROPOSAL_TRANSITIONS`); `approvedBy` is a person (`operator`,
     `administrator`) or a recorded autonomy policy — a project manager or the CEO, agent bindings in this contract,
     decide only under a policy — and a rule's is the operator (`FAC-SEM-104`); an applied rule names the instruction
     revision it entered (`appliedIn`), not a second approver.
  3. **What leaves.** Only to an organization server or as an export (filing on the Board is not leaving); never a
     private agent's proposal; an organization server receives an organization proposal (`sourceClass`) that is an
     approved or applied rule or a live listing; nothing leaving carries a credential-shaped value or URL or a home path
     (`FAC-SEM-103`).
  4. **`learning-note/1`** from Project Observatory to Fabric, with the answer `accepted` | `duplicate` | `rejected`
     (`learning-note-answer.schema.json`); evidence by reference, no transcript or secret; a `personal` or `unknown`
     note never feeds an organization rollout (`FAC-SEM-105`).
  5. **`memory.learning.propose`** (DEC-0023's reserved name) is withdrawn.
- **Why:** problems seen in Dashboards and Observatory had no way to reach the system that fixes them, and learning had
  two candidate homes; one open shape, one direction (Observatory notes, Fabric decides) and rules a test can fail keep
  "nothing applies itself" and "private stays private" true by construction.
- **Compatibility:** Additive: three new schemas and a withdrawn reserved name no provider served. `contractVersion`
  stays `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/proposals.md` (new), `docs/specification/memory-and-learning.md`,
    `schemas/memory-capability.schema.json` (the reserve removed),
    `docs/specification/conformance.md`;
  - schemas: `schemas/fabric-proposal.schema.json`, `schemas/learning-note.schema.json`,
    `schemas/learning-note-answer.schema.json` (new);
  - code: `src/proposal-rules.ts` (new), `src/semantic-rules.ts`, `src/protocol-revisions.ts` (the two revisions
    registered, DEC-0067);
  - fixtures: `fixtures/positive/fabric-proposal-*`, `fixtures/positive/learning-note*`,
    `fixtures/negative/fabric-proposal-*`, `fixtures/negative/learning-note*`, `fixtures/catalogue.json`;
  - tests: `test/proposal-rules.test.ts` (new), `test/positive-sweep.test.ts`, `test/schema-compilation.test.ts`,
    `test/rule-tolerance.test.ts`;
  - docs: `docs/backlog.md` (CT-04, CT-16, CT-19, CT-20), `README.md`, `CONTEXT.md`, `docs/DOCMAP.md`.
- **Not decided here:** the v2 plan's `effect` and `measured_by` (not fields; see proposals.md, Relation to DEC-0012);
  the Board's own screens; how a listing proposal carries the listing (v4 Path 4, with
  `org-authority/1`); the per-kind autonomy policies' contents (Fabric's).
- **Source:** Fabric ADR-0029, ADR-0109 and Fabric's session's corrections (2026-10-12); the organization architecture
  v2's contract plan row CON-OE-05 and its CROSSWALK-v4; DEC-0012, DEC-0023; packet P6-03. DEC-0072 and
  `FAC-SEM-103`…`FAC-SEM-105` were reserved by git CAS (`--key w6-p6-03-proposals-20261012 DEC`; `--key
  w6-p6-03-sem-{proposal-submit,proposal-transition,learning-rollout}-20261012 SEM`); the record plane is `fs`.

### DEC-0073 — The board's tools: every argument and answer a closed schema, one receipt without a sequence number, slots that end with the session, and a project directory (`fabric-project-comms/0.1`, amended)

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: Fabric serves the tools
  against these schemas after repinning (COM-02.3/COM-03); the adapter's kits read receipts and the directory
  (FAA-12a/b). Board rows CT-41 to CT-43.
- **Annotated (2026-10-13):** amended by DEC-0078: a replacement's receipt carries `transferred`, each transferred request's revision and attempt.
- **Annotated (2026-10-13):** its open question on a directory page's uniqueness is decided by DEC-0077 (`FAC-SEM-107`).
- **Annotated (2026-10-13):** amended by DEC-0079: `com.status` responders and directory capabilities gain an optional `held`, and the refusal codes gain `held`.
- **Annotated (2026-10-13):** amended by DEC-0081: `com.reconcile` also answers the estate owner while no responder holds the slot (same arguments, the summary required for the owner); the receipt's and the message view's `request` gain an optional `settledBy: "owner"`, sent only on an owner settlement.
- **Annotated (2026-10-13):** amended by DEC-0080: a finding's dedupe answers the standing finding's receipt with the existing `repeated: true`; `com.submit` and a message gain the optional `finding`.
- **Annotated (2026-10-26):** amended by DEC-0135: item 1's participant `com.reply`, `com.submit` of kind `reply` and a message gain the optional `deliverTo`. Unchanged by it: item 3's `com.read_ack` answer holds for every message the reader can read, one not delivered to it included; such a message's `read` is `true` before and after the mark.
- **Amends:** DEC-0022 (adds the shapes its tools lacked and one tool, `com.directory`; changes no existing field).
  Implements Fabric's COM-02.3/03 Task 0 and the rollout design's project-directory finding.
- **Decision:** in [project communication](specification/project-comms.md#tools-arguments-and-answers) —
  1. **Arguments.** Every tool's arguments are a closed schema: `comms-list`, `comms-message-ref` (`com.get`,
     `com.read_ack`), `comms-status-args`, `comms-reply` (exactly one of a participant's `{idempotency, replyTo}` or
     a responder's `{fence}`), `comms-cancel`, `comms-enroll`, `comms-claim`, `comms-fenced` (`com.accept`,
     `com.renew`), `comms-progress`, `comms-effect-begin`, `comms-reconcile` (`observed` is `true`),
     `comms-responder-replace`, `comms-directory-args`. No argument carries the estate, the caller's Project, a
     principal, a session or a slot's Project.
  2. **One receipt.** Every successful mutation answers `comms-receipt` `{ok, repeated, message?, thread?, at?,
     request?, slot?, attempt?}`. It never carries an estate-wide sequence number (C3), and it and its `request`,
     `slot` and `attempt` are closed: a reader refuses an unknown member.
  3. **Which calls store a receipt.**
     - `com.claim` with nothing claimable answers `{ok: true, repeated: false}` and stores nothing, so the same key
       may poll again.
     - `com.renew` and `com.progress` are naturally idempotent: the key's shape and epoch are checked and no receipt
       is stored. A progress note is posted at most once per attempt and key, and a repeat answers that message with
       `repeated: true`.
     - `com.read_ack` takes no idempotency key and stores no receipt, because marking read twice is one mark. The
       first mark answers `repeated: false` and its time as `at`; a second mark of the same message by the same
       reader changes nothing and answers `repeated: true` with the first mark's `at`.
  4. **Idempotency epochs.** An epoch is open, closed or retired. A closed epoch takes no new key
     (`idempotency_window_expired`) and still answers a repeat of a stored key and digest; a retired epoch is a closed
     one whose receipts were compacted, and refuses every key (C6). `com.status` may report the open epoch as
     `idempotency.epoch`.
  5. **Slots end with the session.** Leaving or ending the session releases its slots and live attempts; there is
     no release tool. A release is not a lifecycle operation and moves no request: a released `claimed` request is
     taken by the next `com.claim` as a lapsed claim (op `claim`, `claimed` → `claimed` with a new attempt), an
     `accepted` one is held (C4), and an `in_progress` one becomes `outcome_unknown` by op `lost_result` when the next
     holder takes the slot. `COMMS_TRANSITIONS` is unchanged.
  6. **Replies.** `com.reply` is the reply path and takes its thread from `replyTo`. A `com.submit` of kind `reply`
     stays for DEC-0022 clients; its `thread` must be `replyTo`'s own, or it is refused `invalid_arguments`.
  7. **`com.status` arguments.** A Project session omits `project` or names its own. Another Project is
     `not_authorized`, the same answer as for an unknown one, so the answer does not reveal which ids exist. A viewer
     principal names the Project it was granted.
  8. **Project directory.** `com.directory` (`comms-directory`) lists the caller's estate's addressable Projects:
     id, name, listed capabilities and each one's responder state, nothing else.
     - Readers: a managed or an enrolled session of a Project of the same estate, that is a T0 or T1 session of the
       estate's owner (DL-25). An asserted principal, a viewer principal, a share-grant principal (T2) and every
       other estate are refused `not_authorized`. The caller's own Project is never listed.
     - Within an organization the directory never lists another owner's Project and never shows another member's
       responder state (DEC-0047's presence rule; OD-1, the organization edition's rule 10).
     - A page holds at most 100 Projects in order of name, then id. Its cursor is bound to the reader, its grant
       revision, the filter and the restore epoch; a change of any of them is `cursor_reset_required`.
     - The operator may unlist a Project in the host; no tool does. Unlisting is discovery only: the Project leaves
       every page and capability filter, a sender that knows its id still reaches it, and unlisting refuses no
       message. An unlisted Project is not a hidden Project for refusal messages, and an unlisting survives a
       restore.
     - It is a tool of its own, not a `com.status` member, because viewer principals read `com.status` and must not
       see the estate's Project list. The tools number seventeen.
- **Why:** Fabric adds no field the contract lacks (its ADR-0117 §2), so it could not serve reply, cancel or any
  responder tool, and its submit receipt passed the estate sequence through, against C3. An enrolled session could
  not learn another Project's id, so no cross-project request could be addressed.
- **Compatibility:** Additive for the contract: fifteen new schemas and one optional `com.status` member;
  `contractVersion` stays `0.1.0`. One answer changes shape for a board already serving it, and the rollout runs in
  this order:
  1. Fabric's submit receipt today carries `seq`, and its `request` is a string or null (Fabric's migration 081). At
     this pin Fabric drops `seq` from the submit and read-ack receipts, sends `request` as the object, and
     translates every stored idempotency receipt it replays to the new shape, so a repeat never answers the old one
     (CT-41).
  2. The adapter's kits repin only after Fabric's receipts drop `seq`, because a kit at this pin refuses a receipt
     that carries it (CT-42).
  3. `comms-status` is closed. `idempotency` is the epoch the caller's Project submits under, and a viewer submits
     nothing, so Fabric omits it for viewer principals: Fabric Dashboards, a `com.status` reader, needs no repin for
     it. Fabric sends it to a Project session only once that session's kit is pinned at or after this decision.
- **Consequences / affects:**
  - spec: `docs/specification/project-comms.md`;
  - schemas: `schemas/comms-list.schema.json`, `schemas/comms-message-ref.schema.json`,
    `schemas/comms-status-args.schema.json`, `schemas/comms-reply.schema.json`, `schemas/comms-cancel.schema.json`,
    `schemas/comms-enroll.schema.json`, `schemas/comms-claim.schema.json`, `schemas/comms-fenced.schema.json`,
    `schemas/comms-progress.schema.json`, `schemas/comms-effect-begin.schema.json`,
    `schemas/comms-reconcile.schema.json`, `schemas/comms-responder-replace.schema.json`,
    `schemas/comms-receipt.schema.json`, `schemas/comms-directory-args.schema.json`,
    `schemas/comms-directory.schema.json` (new); `schemas/comms-status.schema.json` (`idempotency`);
  - fixtures: `fixtures/positive/comms-*`, `fixtures/negative/comms-*`, `fixtures/catalogue.json`;
  - tests: `test/comms-tools.test.ts` (new), `test/positive-sweep.test.ts`, `test/schema-compilation.test.ts`,
    `test/capability-names.test.ts`;
  - docs: `CONTEXT.md`, `docs/DOCMAP.md`, `docs/ux/scenarios.md` (SCN-025, SCN-027), `docs/ux/foundation.md`,
    `docs/ux/flows.md`, `docs/ux/screens.md`, `docs/handoffs/2026-10-12-comms-tools-registers.md`.
- **Not decided here:** a semantic rule that a directory lists a Project once and a capability once per Project
  (`uniqueItems` compares whole objects; CT-43); Fabric driving a service's capability as the responder
  (Fabric's C7 follow-on); the `project-history` grant's shape.
- **Source:** Fabric's COM-02.3/03 specification §0 findings 1–2, §1.1–§1.3, §2.1 (Fabric `origin/main` `bb0e6870`);
  the rollout design for every agent on the board, finding 2 and its contract deliverables; DEC-0022, OQ-0008. The
  directory's boundary (same estate only; names, ids, capabilities and responder state, never content, participants
  or activity counts; an operator opt-out that leaves a Project addressable by id) is the operator's, approved on
  2026-10-12 as the communication program's decision D6.
  DEC-0073 was reserved by git CAS (`--key board-tool-shapes-20261012 DEC`); no SEM code; the record plane is `fs`.

### DEC-0074 — A required MCP role names the secret slots that configure it

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Proposed by the first organization server's session
  after it repacked its admin agents under DEC-0071. Consumer adoption: the first organization server's packages name
  their slots per role (CT-04); Project Observatory's node configures each role's server entry from the slots it names
  (CT-20).
- **Amends:** DEC-0071 (its open question). Packet P6-10.
- **Decision:** in [package → A consumer agent](specification/package.md#a-consumer-agent) —
  1. **`requires.mcp[].secrets`** names, by slot name, the secret slots a placement uses to configure that role's server
     entry (its address and its token) (schema).
  2. **Each named slot is declared** in the package's `secrets[]`, and **one slot feeds one role** (`FAC-SEM-102`).
  3. **Vendoring.** A consumer that vendors this repository's reference code copies a module's import closure
     (`sourceClosure`, beside `schemaClosure`), as it copies a schema's `$ref` closure ([adoption](specification/adoption.md#vendoring-schemas)).
- **Why:** DEC-0071 said the address and token come through the secret slots but not which slot configures which
  server; a placement had to guess, and a slot meant for one server could reach another.
- **Compatibility:** Additive: an optional member, and a rule over it. `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/package.md`, `docs/specification/adoption.md`;
  - schemas: `schemas/fabric-package.schema.json`;
  - code: `src/package-rules.ts` (`FAC-SEM-102`), `src/schema-closure.ts` (`sourceClosure`);
  - fixtures: `fixtures/positive/fabric-package-consumer-agent.json`,
    `fixtures/negative/fabric-package-consumer-secret-twice.json`, `fixtures/catalogue.json`;
  - tests: `test/consumer-agent.test.ts`, `test/schema-closure.test.ts`;
  - docs: `docs/backlog.md` (CT-04, CT-20).
- **Not decided here:** how a placement maps a slot's value onto a server entry's fields (a URL, a header), which is
  the runner's configuration format; whether a role may name a slot marked `optional`.
- **Source:** the first organization server's session (2026-10-12); DEC-0071; packet P6-10. DEC-0074 was reserved by
  git CAS (`--key w6-p6-10-mcp-secrets-20261012 DEC`); no new `FAC-SEM` id (`FAC-SEM-102` grew); the record plane is `fs`.

### DEC-0075 — The local channel to the node: `fabric-local-channel/0.1`, the same OS user only, hello first, consent the other way

- **Date:** 2026-10-12
- **Status:** Accepted source change (on merge of its pull request). Agreed with Project Observatory's session on
  2026-10-12 (its node serves the channel; its changes on locations, the directory as access control, Windows pipes,
  limits and consent are taken whole). Consumer adoption: Project Observatory's node serves it and publishes
  `channels.local` (CT-20); Fabric, Fabric Switchboard and Fabric Dashboards connect to it, Fabric declaring
  `consent.ui` (CT-19, CT-03, CT-21).
- **Annotated (2026-10-12):** `channelStep` answers `invalid-request` to every message whose envelope `$defs/request` refuses (not an
  object, `jsonrpc` not `"2.0"`, an `id` not a 1–128 code-point string or an integer, a method that is not a method name,
  `params` not an object, another member), tested against the schema on the same inputs; before, a malformed request
  fell through to `hello-first` or was passed on (the board run's final verification; w7 close).
- **Amends:** DEC-0015's service descriptor (an optional `channels.local`). Implements the organization edition's
  CON-OE-10 in its CROSSWALK-v4 edition (v4 §5 at `9c6a780`; no `policy.decide`). Closes the board run's inventory item
  CON-OE-10 (node N12, packet P6-04).
- **Decision:** in [the local channel](specification/local-channel.md) —
  1. **Transport.** A Unix socket in a user-owned 0700 directory (macOS under Application Support, Linux under
     `$XDG_RUNTIME_DIR` or the state directory) with the peer's uid checked, or a per-user named pipe on Windows with
     remote clients rejected and process owners checked both ways; another user is `unauthenticated` before anything
     is read; the client checks the server; a token file only where there are no peer credentials (`admitPeer`).
  2. **Discovery.** The node publishes the path in its descriptor's `channels.local`; a client never computes it.
  3. **Session.** JSON-RPC 2.0, one object per line of at most 1 MiB; `channel.hello` within 5 s (else `{id: null,
     error: hello-first}` and close) negotiates N and N−1 (DEC-0067), refuses a missing client or an unknown capability,
     and is answered once per session; nothing else is answered before it (`FAC-SEM-106`, `channelStep`). The node serves
     `health` and `enroll.status`; payload methods belong to their owners' decisions. The node keeps its socket path
     under 100 bytes.
  4. **Consent.** The node sends `consent.prompt` with a deadline of at most 10 minutes to every client that declared
     `consent.ui` (`mayPrompt`); the first answer before the deadline wins (`given` carries its time), the others receive
     `consent.cancel`, and no answer or a late one is denied (`consentOutcome`, on the node's receipt time); a `given`
     answer becomes DEC-0052's `consent`, a denied one records nothing; with no `consent.ui` client, denied at the
     deadline.
  5. **Errors** in the JSON-RPC envelope with `error.data.code` from one set and one integer per code (`ERROR_CODES`);
     an Administrators process that opens a Windows pipe is admitted only with the node's user SID.
- **Why:** three surfaces need to reach the node on one machine without a network port, a browser origin or a second
  copy of anyone's credentials; the operating system already proves who the peer is.
- **Compatibility:** Additive: a new protocol, registered in the revision register (DEC-0067), and an optional
  descriptor member. `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/local-channel.md` (new), `docs/specification/service.md`,
    `docs/specification/conformance.md`;
  - schemas: `schemas/local-channel.schema.json` (new), `schemas/service-descriptor.schema.json` (`channels`);
  - code: `src/local-channel.ts` (new), `src/semantic-rules.ts`, `src/protocol-revisions.ts` (named-only);
  - fixtures: `fixtures/positive/local-channel-*`, `fixtures/negative/local-channel-*`,
    `fixtures/positive/service-descriptor-local-channel.json`, `fixtures/negative/service-descriptor-local-channel-both.json`,
    `fixtures/semantic/local-channel-session-*`, `fixtures/catalogue.json`;
  - tests: `test/local-channel.test.ts` (new), `test/positive-sweep.test.ts`, `test/schema-compilation.test.ts`,
    `test/rule-tolerance.test.ts`; floor in `vitest.config.ts`;
  - docs: `docs/backlog.md` (CT-03, CT-16, CT-19, CT-20, CT-21), `CONTEXT.md`, `docs/DOCMAP.md`, `README.md`.
- **Not decided here:** the key helper's code-signing check of its peer; payload methods' shapes; which descriptor `id`
  a client trusts as the node's (its configuration).
- **Source:** the first organization server's target architecture v4 at `9c6a780` (§5); the organization architecture
  v2's contract plan row CON-OE-10 and its CROSSWALK-v4; Project Observatory's session (2026-10-12); DEC-0015,
  DEC-0033, DEC-0052, DEC-0067; packet P6-04. DEC-0075 and `FAC-SEM-106` were reserved by git CAS (`--key
  w6-p6-04-local-channel-20261012 DEC`, `--key w6-p6-04-sem-local-channel-20261012 SEM`); the record plane is `fs`.

### DEC-0076 — Identifier equality: two identifiers are the same when their normal forms are equal (RFC 3986 §6.2.2; RFC 8141 §3.1 for `urn:`)

- **Date:** 2026-10-13
- **Status:** Accepted source change (on merge of its pull request). Closes the board row CT-39 (the owed readings of #67
  and #68, 2026-10-12). Consumer adoption — each writes identifiers in their normal form, looks an accepted reference up
  by it, and runs `fixtures/vectors/identifiers.json` where it compares identifiers: the adapter first (its kits'
  ports of the reference code and their route and provider checks: CT-18), Fabric (approvals, routes, bindings,
  rollbacks, grant revocations: CT-03), the first organization server (usage aggregation by the normal form of
  `projectId`), Project Observatory (it emits the normal form: CT-20) and Fabric Dashboards (usage and route views: CT-21). The board cells are register text in the handoff
  `docs/handoffs/2026-10-13-ct39-identifiers.md`, applied by the owner under the lease.
- **Amends:** DEC-0064 (`FAC-SEM-094`, `FAC-SEM-006`, `FAC-SEM-096` compare by normal form), DEC-0065 (`byProject`
  duplicates), DEC-0029 (`FAC-SEM-030`, `FAC-SEM-032`, `FAC-SEM-034`), DEC-0017 (`FAC-SEM-014`'s `providerId`), DEC-0055
  (`FAC-SEM-076`'s grants and `grant` revocations), DEC-0054 (`isRevoked` for a `grant`, and so `reconcileRevision`), and
  `FAC-SEM-002`. No new rule code.
- **Decision:** in [identifiers](specification/identifiers.md) —
  1. **The normal form.** A URI — a string matching RFC 3986's `URI` production with an authority or a non-empty path —
     is normalized by RFC 3986 §6.2.2: the scheme and the host lower-cased and percent-encoding hex upper-cased
     (§6.2.2.1), percent-encoded unreserved characters decoded (§6.2.2.2), dot segments removed from a hierarchical path
     (§6.2.2.3), and from a rootless path only its leading `./` and `../` segments (§5.2.4's step A) while it stays
     rootless — the inner ones kept, the contract's own narrowing under RFC 3986 §6.1, because removing them can make a
     rootless path absolute; nothing scheme-based (§6.2.3: no default port removed, no empty path made `/`).
  2. **A URN** (`urn:`) is normalized by RFC 8141 §3.1 instead: `urn` and the NID lower-cased, percent-encoding hex
     upper-cased, nothing decoded, the NSS's case kept, the r-, q- and f-components ignored. This refines the brief's
     design, which decoded `%7E` everywhere: RFC 8141 §3.1 says percent-encoding normalization MUST NOT be applied to a
     URN, so `urn:example:a%7E` and `urn:example:a~` are two identifiers.
  3. **Anything else** — a string that is not such a URI — is its own normal form, and a value that is not a string is
     compared as it is (`===`). Neither function throws; nothing is keyed by input in a plain object.
  4. **Writers SHOULD emit the normal form; readers MUST compare by it** wherever a rule compares identifiers for
     sameness, and a host that resolves an accepted reference looks it up by normal form. `normalIdentifier` and
     `sameIdentifier` (`src/identifiers.ts`, no rule code: G-13) are the reference.
  5. **Records that already collide** — stored under two spellings with one normal form — are one identifier: a host
     refuses such a reference and reports the collision rather than pick one record, until its operator merges them or
     renames one.
- **Why:** rules compared identifier strings byte for byte, so an author could approve their own proposal under
  another spelling of their id (`AGENT:x` for `agent:x`, `urn:Fabric:x` for `urn:fabric:x`), and one project could split
  its costs over two `byProject` rows. RFC 3986 §6.1 and RFC 8141 §3.1 already define when two spellings are one; the
  contract adopts them rather than a scheme-specific rule of its own.
- **Compatibility:** `contractVersion` stays `0.1.0`. A reader pinned before this decision compares bytes.
  - Tightening for `FAC-SEM-094`, `FAC-SEM-006` and `FAC-SEM-025` (`byProject`): two spellings of one id that passed as
    two now meet as one; a byte reader still passes them.
  - Loosening, where a rule now accepts a reference spelled otherwise and a byte lookup after it misses: `FAC-SEM-002`
    (the pool's fallback then spends another account), `FAC-SEM-030`, `FAC-SEM-032`, `FAC-SEM-034` (the route walk moves
    on to the next candidate), `FAC-SEM-096` (a rollback reaches the other setting, one stored under that exact spelling).
  - Also loosened: `FAC-SEM-014` (a `providerId` spelled otherwise passes, and a byte lookup of the manifest by it
    misses); `isRevoked`, and with it `reconcileRevision` (`FAC-SEM-084`), for a `grant` revocation — a reader pinned
    before this decision still lets a revoked grant spelled otherwise through, which is the fail-open this decision
    closes. Also tightened: `FAC-SEM-076` (two spellings of one share grant are one grant).
  - Hence items 4 and 5: a writer that emits the normal form is read the same by both readers, and a host looks an
    accepted reference up by normal form, refusing a collision.
- **Consequences / affects:**
  - sites changed (each by `sameIdentifier` or a key in normal form): `FAC-SEM-094` approver against author and
    `FAC-SEM-096` rollback basis id against the setting's (`src/core-rules.ts`); `FAC-SEM-025` `byProject[].projectId`
    duplicates, the finding naming the second spelling (`src/usage-rules.ts`); `FAC-SEM-006` the scoped projects and their
    managers, `FAC-SEM-002` the selected account against the pool (`src/semantic-rules.ts`); `FAC-SEM-030` the revision
    reference key's id and the admission's capability, `FAC-SEM-032` the binding's project, capability, provider and
    `runnerRoute`, `FAC-SEM-034` the event's project, capability and route (`src/route-rules.ts`); `FAC-SEM-014` an
    entry's `providerId` against its manifest's `provider.id` (`src/registry-rules.ts`); `FAC-SEM-076` a share grant's
    `meta.id` against the grants before it and a `grant` revocation's `ref` against the grants and the revocations before
    it (`src/estate-record-rules.ts`); `isRevoked` for kind `grant`, which `reconcileRevision` (`FAC-SEM-084`) uses too
    (`src/revocation-delta.ts`) — before, another spelling of a revoked grant was not revoked (fail open);
  - sites left as written, with the reason: the delegation token's and the approval's claims (`iss`, `sub`, `project`,
    the grant's principal id and issuer, an onward token's parent claims) and the grant reference in
    `src/delegation-rules.ts`, `src/delegation.ts`, `src/grant-projection.ts` — RFC 7519 §2 compares StringOrURI "with no
    transformations or canonicalizations", and the hub copies them from the grant it signs, so another spelling is
    refused, fail closed; a revision's revocations against its parent's (`FAC-SEM-072`, `revocationKey` in
    `src/estate-record-rules.ts`) — a re-spelled `grant` revocation reads as dropped and the revision is refused, fail
    closed; `agentRef` in `src/estate-record-rules.ts` — its pattern admits only the normal form; opaque ids
    (estates, machines, devices, users, sessions, leases: `src/estate-record-rules.ts`, `src/revocation-delta.ts`,
    `src/window-lease.ts`, `src/device-rules.ts`, `src/activity-rules.ts`, `src/session-join.ts`, `src/relay.ts`), agent and
    service ids, capability names (`src/pipeline-check.ts`), model ids (`src/profile-rules.ts`), runner kinds, MCP roles
    and secret slots (`src/package-rules.ts`), a provider entry's slug `id` and its file stem (`FAC-SEM-013`, `FAC-SEM-014`'s
    first half, `src/registry-rules.ts`), key ids, `jti`, claim ids
    (`FAC-SEM-093`) and limit ids (`FAC-SEM-031`) — names, not URIs;
  - spec: `docs/specification/identifiers.md` (new), `docs/specification/conformance.md`,
    `docs/specification/governance-and-roles.md`, `docs/specification/service.md`, `docs/specification/versioning.md`,
    `docs/specification/runners.md`, `docs/specification/memory-and-learning.md`, `docs/specification/provider.md`,
    `docs/specification/estate-record.md`, `docs/specification/revocation-delta.md`;
  - code: `src/identifiers.ts` (new); floor in `vitest.config.ts`;
  - fixtures: `fixtures/vectors/identifiers.json` (new);
  - tests: `test/identifiers.test.ts` (new), `test/core-rules.test.ts`, `test/usage-rules.test.ts`,
    `test/route-rules.test.ts`, `test/registry-rules.test.ts`, `test/estate-record.test.ts`,
    `test/revocation-delta.test.ts`, `test/rule-tolerance.test.ts`;
  - docs: `docs/evidence/sources.md` (RFC 8141 pinned; RFC 3986 and RFC 7519 hashed), `docs/backlog.md` (CT-39),
    `docs/guides/connecting-compatible-agents.md` (a writer's normal form), `CONTEXT.md`, `docs/DOCMAP.md`, `README.md`;
  - annotations "amended by DEC-0076" on DEC-0017, DEC-0029, DEC-0054, DEC-0055, DEC-0064 and DEC-0065, and the consumer board cells, are register text
    in `docs/handoffs/2026-10-13-ct39-identifiers.md`, applied by the owner under the lease.
- **Not decided here:** internationalized identifiers (IRIs) and Unicode normalization (a non-ASCII string is no URI and compares as it is);
  scheme-based normalization for any scheme; URN namespace-specific equivalence (RFC 8141 §3.1 lets a namespace add rules;
  none is adopted); whether a schema should refuse a non-normal spelling outright. Each is proposed as an open question
  in the handoff, for the owner to file under the lease on `docs/OPEN_QUESTIONS.md`.
- **Source:** the board row CT-39; RFC 3986 §6, RFC 8141 §2 and §3, RFC 7519 §2 (pinned with SHA-256 in
  `docs/evidence/sources.md`). DEC-0076 was reserved by git CAS (`--key ct39-identifiers-20261013 DEC`); no `FAC-SEM` id;
  the record plane is `fs`. The register was edited without a lease, by the owner session's arrangement; the owner applies
  it under leases at merge.

### DEC-0077 — A directory page lists each Project once and each capability once per Project (`FAC-SEM-107`)

- **Date:** 2026-10-13
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: Fabric's board answers
  `com.directory` pages that pass it (CT-41); the adapter's kits check a page with it before they look a Project up
  (CT-42).
- **Amends:** DEC-0073 (tightens what a directory page may list; changes no schema).
- **Decision:**
  1. A `com.directory` page (`comms-directory.schema.json`) lists each Project once, by `id`, and each capability once
     within a Project, by `capability` (`FAC-SEM-107`, kind `comms-directory`, `src/semantic-rules.ts`). The finding names
     the second entry.
  2. Project ids (`comms-common.schema.json#/$defs/projectId`, opaque) and capability names
     (`common.schema.json#/$defs/capabilityName`) compare as written, not by normal form: neither is a URI (DEC-0076).
  3. One capability may appear under several Projects; that is the directory's purpose.
- **Why:** JSON Schema's `uniqueItems` compares whole objects, so two entries of one Project with other names, or one
  capability with two responder states, pass the schema while telling a sender two things about one Project. CT-43
  asked whether a rule should say it; a reader that indexes a page by id needs it to.
- **Compatibility:** a tightening of what DEC-0073 allowed. A board that already lists each Project and capability once,
  as its own prose required, is unaffected.
- **Consequences / affects:** `src/semantic-rules.ts` (`commsDirectory`); `test/comms-rules.test.ts`;
  `test/rule-tolerance.test.ts`; `docs/specification/project-comms.md` (Project directory, Semantic rules);
  `docs/specification/conformance.md` (the register row and the next free code); the board row CT-43.
- **Not decided here:** the page's order (by name, then id) stays the host's collation and is not checked; the caller's
  own Project being absent is board state, not in the page, so no rule on the page can check it.
- **Source:** the board row CT-43 (DEC-0073 *Not decided here*). DEC-0077 and `FAC-SEM-107` were reserved by git CAS
  (`--key ct43-directory-rule-20261013 DEC` and `SEM`); the record plane is `fs`.

### DEC-0078 — A replacement's receipt carries the attempt of every request it transferred

- **Date:** 2026-10-13
- **Status:** Accepted source change (on merge of its pull request). Found by Fabric while it built COM-03 (its main
  `3d7e7752`, pinned at DEC-0073): it now lets a `com.claim` naming such a request read the attempt back, a reading of
  its own (its ADR-0149 Amendment 1 §3) that this decision replaces. Consumer adoption: Fabric answers
  `com.responder_replace` with `transferred` (CT-41); the adapter's kits take the attempt from it (CT-42).
- **Amends:** DEC-0073 (the receipt gains one optional member; no tool, argument or state changes).
- **Decision:**
  1. When `com.responder_replace` transfers accepted requests (`transfer.requests`), its receipt
     (`comms-receipt.schema.json`) carries `transferred`: one `{request, revision, attempt}` per transferred request,
     each request once, the `attempt` in the shape of the receipt's own `attempt` (`id`, `generation`, `digest`,
     `leaseExpiresAt`), at most 64 (the replacement's own limit). The new holder's next fence on each request carries
     those values, its `expectedRevision` from `revision`.
  2. Only `com.responder_replace` answers `transferred`, and only for the requests it transferred. That receipt is the
     only place the contract gives the attempt: a `com.claim` never moves an accepted request, and the contract defines
     no read of an attempt through it.
- **Why:** after a transfer the new holder owns accepted requests but had no attempt id, so it could not build a fence
  for them. Of the two ways Fabric named — the receipt carries the attempts, or `com.claim` on an accepted request reads
  its attempt without a transition — the receipt is one call, needs no second read, and adds no state-machine exception
  to `com.claim`.
- **Compatibility:** additive. A reader pinned at DEC-0073 validates receipts against a closed schema, so it refuses a
  receipt that carries `transferred`; no reader does yet (the adapter's kits validate receipts from FAA-12b on, CT-42),
  and Fabric, the one writer, adopts this with its repin (CT-41). A host that answers a transfer without `transferred`
  leaves the new holder unable to fence those requests.
- **Consequences / affects:** `schemas/comms-receipt.schema.json` (`transferred`); `fixtures/positive/comms-receipt-replace-transferred.json`
  and seven negatives (`fixtures/negative/comms-receipt-transferred-*.json`) with `fixtures/catalogue.json`;
  `test/comms-tools.test.ts` (the shape test and seven plants); `docs/specification/project-comms.md` (the tool table's
  `com.responder_replace` answer, *Slots end with the session*); board rows CT-41 and CT-42.
- **Not decided here:** what a `com.claim` naming an accepted request answers (it is not a claim; the board's refusal for
  a request it cannot claim applies).
- **Source:** Fabric's COM-03 finding (2026-10-13). DEC-0078 was reserved by git CAS (`--key receipt-transferred-20261013 DEC`);
  no `FAC-SEM` id; the record plane is `fs`.

### DEC-0079 — An operator's hold on the Project board refuses new work `held`, and never started work, a cancel or a read (`fabric-project-comms/0.1`, additive)

- **Date:** 2026-10-13
- **Status:** Accepted source change (on merge of its pull request). Asked for by Fabric's board wave 4 (its operator
  controls, decision D9), drafted there and adopted by the owner with refinements. Consumer adoption: Fabric serves
  `held` per the matrix (CT-41); the adapter's kits retry it with backoff (CT-42).
- **Annotated (2026-10-13):** amended by DEC-0080: for a finding the hold check comes before dedupe, so a dedupe hit into a held thread answers `held` and stores nothing.
- **Amends:** DEC-0022 and DEC-0073 (one refusal code, one optional member in `com.status` and in the directory; no
  tool, argument, state or transition changes).
- **Decision:** in [project communication](specification/project-comms.md#holds) —
  1. **The refusal.** `held` joins `comms-common.schema.json#/$defs/refusalCode`. It is always `retryable: true`
     (`comms-refusal.schema.json` refuses it with `false`). Its message is one sentence that says the operator resumes
     the work, and it never names a hidden Project or who set the hold.
  2. **Visible state.** `com.status` answers `responders[].held: true` when the operator holds that slot or its
     Project; the directory answers `held: true` on each capability whose slot or Project is held. The member sits per
     capability, not on the directory entry: a Project hold refuses only slot work, which exists only per capability,
     so one per-capability member carries both scopes and is the same fact as `com.status`'s. Absent or `false` means
     not held. `held` never names who set the hold. A thread hold is seen through the refusal only.
  3. **What a hold refuses: new work only.** `com.submit`, and a participant's `com.reply`, into a held thread;
     `com.enroll` and `com.responder_replace` on a held slot or a slot of a held Project; `com.claim` of held work
     (without a named request: on a held slot or Project); `com.accept` and `com.effect_begin` on held work. A request
     submitted into an unheld thread to a held Project or slot is not refused; it queues, and its deadline runs.
  4. **What a hold never refuses:** `com.complete`, `com.reconcile`, `com.progress` and `com.renew`, a responder's
     fenced `com.reply`, `com.cancel`, and every read (`com.list`, `com.get`, `com.status`, `com.directory`) and
     `com.read_ack`. A hold never hides state, and it never refuses the current responder's calls on started work; if
     that responder's session ends under a slot or Project hold, enrollment and replacement wait for the lift, and its
     accepted work stays held as C4 says.
  5. **Held work** is a request whose thread, target Project or target (Project, capability) slot is held. A
     `com.claim` without a named request on an unheld slot passes over requests in held threads, and answers nothing
     claimable when only held ones are left.
  6. **Timing.** The board checks holds when a call commits, inside the atomic recheck of the fence, the authority
     revision and the lease (C4). A hold refuses calls that commit after it and undoes none that committed before. A
     held request's deadline keeps running; accepted work outlives its deadline as C4 already says. A `held` refusal
     stores nothing, so the same call and key commit once the hold is lifted; a repeat of a receipt stored before the
     hold answers that receipt.
  7. **Who sets it.** The operator, through the host's operator controls. The contract defines no tool that sets,
     lifts or lists a hold. A hold is not a grant change and not an authority revision (no `authority_changed`, no
     cursor reset), and it bumps no slot generation, attempt or request revision: it is checked at commit time like a
     lease, so the responder continues under its fence once the hold is lifted.
  8. **Testable for ports.** `holdRefuses(tool, target, holds)` in `src/comms-hold.ts` is the matrix; the shared
     vectors `fixtures/vectors/comms-hold.json` cover every tool with no hold, under each scope alone and under all
     three, the never-refused tools under every hold, repeats, and the cases a lax port gets wrong (a fenced reply into
     a held thread; ids and capability names compared as written, never folded or by prefix). No `FAC-SEM` rule: the
     matrix is decided on board state that no document the checker reads carries, and the one property a document
     carries, that `held` is retryable, is a schema constraint.
- **Why:** Fabric's operator needs to stop new work on a thread, a Project or a responder without refusing the current
  responder's calls on what has started. Fabric says it answers a hold `not_authorized` today, which reads as missing authority rather than a pause
  the operator will lift. A retryable code with a fixed matrix lets every kit back off and resume, and keeps
  settlement, cancellation and reads open so the current responder can always settle started work and no reader is
  shown less.
- **Compatibility:** additive for the contract; `contractVersion` stays `0.1.0`. `comms-status`, `comms-directory` and
  the refusal-code enum are closed, so a reader pinned before this decision refuses an answer that carries `held`,
  as a member or as a code. A host therefore sends both only to a reader pinned at or after DEC-0079. To an older
  reader it omits `held` and answers the same matrix with `not_authorized`, as it does today (CT-41), the same staging
  DEC-0073 used for `idempotency`. Fabric Dashboards reads `com.status` as a viewer principal and is pinned before this
  decision (DEC-0073 *Compatibility* item 3), so Fabric omits `held` for viewer principals until Dashboards repins at or
  after DEC-0079 (CT-21). A viewer makes no mutation, so it never receives the refusal code.
- **Consequences / affects:**
  - spec: `docs/specification/project-comms.md` (the amendment line, the lifecycle note, *Holds*, `com.status`, the
    project directory, *Refusals*); `docs/specification/conformance.md` (the board's hold obligation);
  - schemas: `schemas/comms-common.schema.json` (`held`), `schemas/comms-refusal.schema.json` (retryable),
    `schemas/comms-status.schema.json` and `schemas/comms-directory.schema.json` (`held`);
  - code: `src/comms-hold.ts` (new), measured at a 100% branch floor in `vitest.config.ts`;
    `tools/vectors/comms-hold.ts` (new), the generator that writes the vectors from the matrix as data;
  - fixtures: `fixtures/vectors/comms-hold.json` (new); `fixtures/positive/comms-refusal-held.json`,
    `fixtures/positive/comms-status-held.json`, `fixtures/positive/comms-directory-held.json`,
    `fixtures/negative/comms-refusal-held-not-retryable.json`, `fixtures/negative/comms-status-held-not-boolean.json`,
    `fixtures/negative/comms-directory-held-not-boolean.json`, `fixtures/negative/comms-directory-entry-held.json`,
    `fixtures/catalogue.json`;
  - tests: `test/comms-hold.test.ts` (new), `test/comms-tools.test.ts` (the shape test and four plants);
  - docs: `CONTEXT.md` (*Board hold*), `docs/DOCMAP.md`, `docs/ux/scenarios.md` (SCN-025),
    `docs/handoffs/2026-10-13-comms-hold.md`; board rows CT-21, CT-41 and CT-42.
- **Not decided here:** the operator control's own tool shape; the hold's audit record; the Telegram mirror's text for
  a hold; a page or message member that shows a thread hold; whether a hold survives a board restore (after one, every
  responder authority is off until the owner re-enrolls, C7, so no held work proceeds either way).
- **Source:** Fabric's board wave 4 draft (operator controls D9, awareness COM-05) and the owner's ruling on it
  (2026-10-13). DEC-0079 was reserved by git CAS by the owner session (`--key comms-host-hold DEC`); no `FAC-SEM` id;
  the record plane is `fs`.

### DEC-0080 — A structured finding on the project board: severity, consequence, what it affects, a dedupe key, and redaction for a reader outside its grants (`fabric-project-comms/0.1`, additive)

- **Date:** 2026-10-13
- **Status:** Accepted source change (on merge of its pull request). Drafted by Fabric for its board's wave 4, work
  awareness (Fabric COM-05); the owner ruled to adopt it with the refinements recorded here. Consumer adoption: Fabric
  stores and serves `finding`, dedupes and redacts (CT-41); the adapter's kits send and read findings (CT-42).
- **Amends:** DEC-0022 (a message of kind `finding` gains an optional structured member), DEC-0073 (the receipt's
  `repeated` gains a second cause; no tool, state or receipt member is added) and DEC-0079 (a hold is checked before
  dedupe).
- **Decision:** in [project communication](specification/project-comms.md#findings) —
  1. **The finding.** `com.submit` (`comms-submit.schema.json`) and a message as read (`comms-message.schema.json`) gain
     an optional `finding` (`comms-common.schema.json#/$defs/finding`), allowed only when `kind` is `finding`. `finding`
     has been a kind since DEC-0022, so no kind is added, and a finding without the member stays valid. Its members, all
     required and nothing else:
     - `severity`: `info`, `warning` or `blocking`;
     - `consequence`: 1–500 characters, counted as code points;
     - `affects`: 1–16 items, each a backlog row `{repository, path, id}` or a task `{task}`. A row is
       linked by its identity in the common backlog (repository + path + ID) and never copied: the item is closed.
       `repository` is `<owner>/<name>` (`repositoryName`: an owner of 1–39 of `[A-Za-z0-9-]` starting with a letter or
       digit, a name of 1–100 of `[A-Za-z0-9._-]`, at most one leading dot, never `.` or `..`); `path` is relative to the
       repository's root (`repositoryPath`: segments of `[A-Za-z0-9._-]` that do not start with a dot, single slashes, no
       leading or trailing slash, at most 256); `id` is the row's stable id (`backlogRowId`: 1–64 of `[A-Za-z0-9._-]`
       starting with a letter or digit, a deliberate narrowing of the backlog contract's "nonempty string id"). A task
       is the host's task, named as a delegation token names the issuing host's task (`hostTaskId`, DEC-0041's grammar,
       1–128 of `[A-Za-z0-9._:-]`), issued by the host, not the board; not a service's own task run (`taskRunId`,
       DEC-0065). No pattern uses a lookaround, so a port with an RE2-class engine reads them.
       `fabric-package.schema.json#/$defs/path` was not reused: it admits a hidden segment (`.github/x`) the backlog
       contract refuses, and a `$ref` to it would add the package schema to every comms consumer's schema closure;
     - `dedupeKey`: 8–128 of `[A-Za-z0-9._:-]`, the idempotency key's characters.

     Evidence is the message's existing `artifacts`; the finding adds no evidence member. A submit that carries
     `finding` MUST use an idempotency key with at least 128 bits from a cryptographically secure generator; the submit
     schema checks the length that can hold them, at least 22 characters of the key's 66-character alphabet, and the
     general key keeps its 8 (item 3 says why).
  2. **Dedupe.** After authorization, validation, the idempotency check and the hold check, a fresh key whose finding names the
     `dedupeKey` (compared as written: a key like the idempotency key, not an identifier under DEC-0076) of a finding the
     same sender Project sent and the board retains answers that finding's receipt
     (`message`, `thread`, `at`) with `repeated: true` and stores no message. The board stores that receipt under the
     fresh key (a retry of key and digest answers it again; the key counts toward the epoch's capacity).
     - Never across Projects: a hit across Projects would hand one Project another's message and thread ids.
     - The hold check comes first (DEC-0079): a dedupe hit into a held thread answers `held` and stores nothing.
     - The dedupe check and the store are one atomic step; of concurrent submits with one (Project, `dedupeKey`),
       exactly one stores a message, the rest answer its receipt with `repeated: true`. `findingSubmitAnswer`
       (`src/comms-finding.ts`) is a reference model of the order.
     - It differs from idempotency: idempotency is (key, digest), and a reused key with another digest is
       `idempotency_conflict`; dedupe is semantic, and another body, severity, consequence, affects, artifacts, thread or
       key with the same `dedupeKey` still answers `repeated`. A stored idempotency key answers by idempotency first.
     - A repeat updates nothing: not the standing finding's body, members, artifacts or `at`, no read mark, unread count
       or notification, and the transport mirror sends nothing. Its own thread is not used: it creates no thread and
       reaches no new reader, so `receipt.thread` may differ from the thread the call named, and until a sharing command
       exists another audience takes another `dedupeKey`. A changed finding is sent under a new `dedupeKey`.
     - A `dedupeKey` is remembered exactly as long as the finding's message is retained, a redacted one included; when it
       leaves retention the key is forgotten. The board keeps it internally after a redaction removes the finding. That retention is the host's and the bound; epochs neither shorten nor
       lengthen it, and a restore keeps the keys of the findings its history holds.
     - `repeated` is the receipt's existing required member (DEC-0073), so no member is added; its description gains the
       second cause. A receipt does not say which cause answered it.
  3. **Redaction.** A reader sees `{redacted: true}` (`affectedRedacted`, closed, `redacted` const `true`) in place of
     each `affects` item outside its grants; which grants cover an item is the host's decision. The item `oneOf` admits
     the redacted form, and `comms-submit` refuses it (`not`), so it is valid in a message and never in a submit. The
     count and order stay visible: a reader learns how many items it may not see, and the message names none of them.
     Only `affects` is redacted per reader; `severity`, `consequence`, the body, artifacts and `dedupeKey` are the
     sender's text for every participant. A moderator's redaction of the message (`redacted: true`) removes `finding`
     with the body (`comms-message.schema.json` `then`), because `consequence` is a second body. The message's
     `digest` is an unkeyed SHA-256 over the whole submit, hidden items and idempotency key included, so it confirms a
     guessed set of hidden items only to a reader who also guesses the key: the residual is an oracle against the key's
     entropy, 128 bits by item 1.
  4. **`FAC-SEM-108`** (kinds `comms-submit` and `comms-message`, `src/semantic-rules.ts` `commsFinding`), a new code
     rather than `FAC-SEM-026`'s, whose kind is a submit only and whose rules concern requests and replies: `finding` is
     present only when `kind` is `finding`; no two unredacted `affects` items are the same; a redacted item is only in a
     message. Two rows are the same when `repository`, `path` and `id` are each equal as written, two tasks when their
     ids are; a row is never a task. Comparison as written, like DEC-0077: none of a row's three fields is a URI (no row
     pattern admits `:`) and a task id is an opaque id, so DEC-0076's normal form leaves each unchanged and the two
     agree. The submit schema also refuses a
     repeat (`uniqueItems`); a message cannot use it, because redacted items are alike.
- **Why:** Fabric COM-05 asks for a structured important finding with affected tasks, evidence, consequence and
  severity, whose duplicate notification does not duplicate the finding, whose unauthorized task references are
  redacted, and whose dependencies link canonical owner tasks without a second editable backlog. A free-text finding
  could do none of these: a reader could not tell what it affects, two agents of one Project reporting one fault made two findings,
  and a reference a reader may not see could only be hidden by dropping it, which makes a partial finding look whole.
- **Compatibility:** additive; `contractVersion` stays `0.1.0`. A reader pinned before this decision validates
  `comms-message` and `comms-page` against closed schemas, so it refuses a message that carries `finding`: Fabric, the
  writer, sends `finding` to a session only once that session's kit is pinned at or after this decision (CT-41), as
  DEC-0073 did for `idempotency`. A submit without `finding` and a receipt are unchanged for every reader: `repeated` was
  already required. A board pinned before this decision refuses a submit that carries `finding` (`invalid_arguments`),
  so a kit sends it only to a board that serves this revision, under a key of at least 128 random bits.
- **Consequences / affects:**
  - schemas: `schemas/comms-common.schema.json` (`findingSeverity`, `repositoryName`, `repositoryPath`, `backlogRowId`,
    `dedupeKey`, `hostTaskId`, `affectedRow`, `affectedTask`, `affectedRedacted`, `finding`),
    `schemas/comms-submit.schema.json` (`finding`, the kind condition, a finding's key length) and
    `schemas/comms-message.schema.json` (`finding`, the kind condition, no `finding` on a redacted message),
    `schemas/comms-receipt.schema.json` (`repeated`'s description);
  - code: `src/semantic-rules.ts` (`commsFinding`, `FAC-SEM-108`); `src/comms-finding.ts` (`findingSubmitAnswer`, the
    order of a submit's answer), with its floor in `vitest.config.ts`;
  - fixtures: `fixtures/positive/comms-submit-finding.json`, `fixtures/positive/comms-message-finding.json`,
    `fixtures/positive/comms-receipt-finding-repeated.json`, thirty-seven negatives (`fixtures/negative/comms-submit-finding-*.json`,
    `fixtures/negative/comms-message-finding-*.json`) with `fixtures/catalogue.json`; seven rule fixtures
    `fixtures/semantic/comms-finding-*.json`; the shared vectors `fixtures/vectors/comms-finding.json`;
  - tests: `test/comms-tools.test.ts` (the shape test and thirty-seven plants), `test/schema-mutants.ts` (a shared
    definition proven by the fixtures of the schema that refers to it), `test/comms-rules.test.ts` (`FAC-SEM-108`, its
    fixtures, the vectors and the answer's order), `test/rule-tolerance.test.ts`, `test/positive-sweep.test.ts` (`comms-message`);
  - docs: `docs/specification/project-comms.md` (Messages and requests, Findings, Dedupe, Redacted items, Idempotency,
    Receipts, Holds, Semantic rules, Limits),
    `docs/specification/conformance.md` (the register row), `docs/specification/identifiers.md` (compared as written),
    `CONTEXT.md`, `docs/DOCMAP.md`, `docs/handoffs/2026-10-13-comms-finding.md`; board rows CT-41 and CT-42.
- **Not decided here:**
  - subscriptions ("share findings affecting X with Project Y"): they would be an explicit, grant-bound sharing command
    and never implicit, as project-comms' thread rule says ("Widening the audience is a new, explicit sharing command,
    never an implicit forward"); Fabric may ask for that separately;
  - what severity changes in notifications or the Telegram mirror;
  - how a blocking finding interacts with holds;
  - which grants cover a backlog row or a task for a reader (the host's; the contract fixes the redacted form);
  - how the Telegram mirror redacts a finding's `affects` for a chat.
- **Source:** Fabric's project-communications plan, COM-05 "awareness and dependency findings" (Fabric `origin/main`
  `56b0e3de`, `docs/evidence/plans/2026-10-04-project-communications.md`), Fabric's draft and the owner's ruling of
  2026-10-13 and its rulings on the independent reading of PR #103; the knowledge base's backlog contract (fabric-workspace `knowledge/backlog.md` at `2d490612`: "aggregate
  identity is repository + path + ID"; absolute, hidden and traversal paths refused). DEC-0080 was reserved by the owner
  session; `FAC-SEM-108` by git CAS (`--key comms-finding-20261013 SEM`, receipt SEM-0108); the record plane is `fs`. The
  registers were committed under the owner session's leases on `docs/DECISIONS.md`, `docs/specification/conformance.md`
  and `docs/backlog.md`, by its arrangement.

### DEC-0081 — The estate owner settles an `outcome_unknown` request whose responder is gone (`fabric-project-comms/0.1`, amended)

- **Date:** 2026-10-13
- **Status:** Accepted source change (on merge of its pull request). The ruling is the owner's, given on 2026-10-13 in
  answer to Fabric's question (its board wave 4, operator controls D9): may an estate owner attest an observed outcome?
  Yes, narrowly. The independent reading of PR #102 returned "merge after fixes", and the owner's rulings on its
  findings are applied here. Consumer adoption: Fabric serves owner settlement, runs the transition rule, and amends
  its ADR-0117 §4 and its Comms screen (CT-41); the adapter's kits read `settledBy` (CT-42).
- **Amends:** DEC-0022 (who may call `com.reconcile`) and DEC-0073 (the receipt's `request`; the message view). No tool,
  argument, state, transition or refusal code is added.
- **Decision:** in [project communication → Owner settlement](specification/project-comms.md#owner-settlement) —
  1. **Who.** The settler is the operator principal that owns the request's target Project, `trusted` and verified by
     the host; in an organization estate, that member only. No Project grant makes one. Every other caller, another
     member's operator included, is refused `not_authorized`. Who owns the target Project is host state when the call
     commits, not part of the transition record, so this item is normative and checked by the board, not by a rule.
  2. **When.** The request is in `outcome_unknown` and no responder holds its (Project, capability) slot: the slot is
     absent, or its holder's lease has lapsed with no current enrollment. The board checks this atomically with the
     transition (C4). While a slot is held, the owner is refused `not_authorized`, and the message says the current
     responder settles it.
  3. **The paths in.** A request reaches `outcome_unknown` only by:
     - the sender's `com.cancel` after the effect began;
     - a restore, after which a started effect is `unknown`;
     - the lost-result operation when a holder took the slot and then left.

     That operation runs only when the next holder takes the slot (DEC-0073 item 5), so an `in_progress` request whose
     responder retired with no successor stays `in_progress`. It reaches the owner through the sender's `com.cancel`.
     No transition is added.
  4. **The surface: `com.reconcile`, option (a).** The owner calls `com.reconcile` with the same arguments
     (`comms-reconcile.schema.json`, unchanged in shape); the caller's role comes from the authenticated endpoint, as
     every identity does. One wire and one receipt. `com.reconcile` stays in the Responders tool group, and a board that
     serves it answers both callers. The idempotency namespace is the request's Project and the `com.reconcile` family.
  5. **Observed only.** The target is `completed` or `failed_known` with `observed: true`. A summary of what the owner
     observed is required, 1–2000 characters; for a responder it stays optional. `evidence` stays optional. A
     settlement without the summary is refused `observation_required`, and the request stays `outcome_unknown`.
  6. **No abandon path.** The owner cannot move the request to `cancelled`, and no operation moves `outcome_unknown` to
     `cancelled` (`COMMS_TRANSITIONS`, `FAC-SEM-027`): a request whose outcome nobody observed stays `outcome_unknown`,
     because closing it as cancelled would tell every reader that the effect did not happen, which nobody knows.
  7. **Every reader sees an owner settlement.** The receipt's and the message view's `request` gain an optional
     `settledBy` whose only value is `"owner"` (`comms-common.schema.json#/$defs/settledBy`, a `const`), allowed only on
     `completed` and `failed_known`. A board sends it on every owner settlement and on nothing else, so its absence
     means the responder settled the request. The board's record of the transition carries the owner principal with its
     provenance, `trusted`. `com.status` shows no request, so it gains nothing.
  8. **A late responder** that enrolls afterwards finds the request terminal. A late `com.complete` or `com.reconcile` is
     refused (`invalid_transition`, or `fenced` / `revision_conflict` when its fence or revision is stale), never
     committed, never reopened.
  9. **The rule.** `FAC-SEM-109`, kind `comms-transition`, on the transition record `{op, from, to, observed?,
     settledBy?, summary?, principal?}`, a host journal document, not a receipt. Every `complete` and `reconcile` record
     carries `settledBy`, `"responder"` or `"owner"` (the value `"responder"` exists in the record only), and no other
     operation's record does; so a record cannot pass as the responder's by leaving the member out. An owner settlement
     is a `reconcile`, carries a summary of 1–2000 characters, counted as the schema counts them (code points), and names
     an `operator` principal with provenance `trusted`. `FAC-SEM-027` keeps the table and the observation. The shared
     vectors are `fixtures/vectors/comms-settlement.json`.
- **Why:** a request in `outcome_unknown` is left only by `com.reconcile`, which only the holder of the current slot
  could call. A request gets there by the sender's cancel after the effect began, by a restore, or by a lost result
  after a holder took the slot and left. If no responder holds that slot afterwards, because the agent was retired or
  never re-enrolled, the request stayed non-terminal forever. The owner of the target Project is the one principal
  who can look at the outside world and say what happened. Option (a) keeps one wire and one receipt, and needs no
  tool a board would have to negotiate. Option (b), a host operator control with no board tool, would give the same
  transition a second path and a second record that the contract could only describe. The summary is required of the
  owner and not of a responder because the owner did not run the effect: the summary is the observation it attests.
  `com.reconcile`'s schema cannot see the caller, so the requirement is semantic, and the transition record, which
  names the caller's role, is where a checker can see it. The wire names only the owner because the responder's
  settlement is what every reader already assumes; sending nothing for it keeps every existing receipt and message
  unchanged.
- **Compatibility:** additive on the wire: one optional member, no new tool, argument, state or refusal code;
  `contractVersion` stays `0.1.0`. One rule tightens: `FAC-SEM-109` newly requires `settledBy` on a `complete` or
  `reconcile` journal record, a shape no rule stated before and no consumer ran kind `comms-transition` on. A responder's arguments are unchanged, and so is its receipt: a board sends
  `settledBy` only on an owner settlement. The owner's receipt goes to the owner caller, the host's operator endpoint,
  not to a kit. The adapter's kits (0.28.0, pinned at `f00a768`) read message views loosely, so a kit that predates
  this decision never sees the member in a receipt and is not broken by it in a message. So the rollout needs no
  order: Fabric may serve owner settlement on adopting this (CT-41), and the kits read `settledBy` when they repin
  (CT-42). A board that has not adopted this refuses the owner as before (`not_authorized`), and the request stays
  `outcome_unknown`.
- **Consequences / affects:**
  - spec: `docs/specification/project-comms.md` (the amendment note, Messages and requests, the lifecycle table and its
    sentence, Owner settlement, the capability groups' note, the tool table's `com.reconcile` answer, Receipts, Restore,
    Semantic rules, Limits), `docs/specification/conformance.md` (the `FAC-SEM-109` row);
  - schemas: `schemas/comms-common.schema.json` (`settledBy`), `schemas/comms-message.schema.json` and
    `schemas/comms-receipt.schema.json` (`request.settledBy`, only when settled), `schemas/comms-reconcile.schema.json`
    (descriptions: the caller, `request`, `summary`);
  - code: `src/semantic-rules.ts` (`FAC-SEM-109`, `commsSettlement`; `FAC-SEM-027` looks an op up among its own members
    only, so an op named `constructor` or `__proto__` answers a finding instead of throwing); `src/profile-rules.ts`
    (`FAC-SEM-059` looks a login up among `SUBSCRIPTION_RUNNER`'s own members, so a login named `constructor` gets the
    plain refusal, an adjacent defect the reading found);
  - fixtures: `fixtures/vectors/comms-settlement.json` (new); `fixtures/positive/comms-reconcile-owner.json`,
    `fixtures/positive/comms-receipt-reconcile-owner.json`, `fixtures/positive/comms-receipt-complete-responder.json`,
    `fixtures/positive/comms-message-settled-by-owner.json`; `fixtures/negative/comms-receipt-settled-by-unknown.json`,
    `fixtures/negative/comms-receipt-settled-by-responder.json`,
    `fixtures/negative/comms-receipt-settled-while-unknown.json`, `fixtures/negative/comms-receipt-settled-cancelled.json`,
    `fixtures/negative/comms-message-settled-while-unknown.json`, `fixtures/negative/comms-message-settled-by-unknown.json`,
    `fixtures/negative/comms-message-settled-by-responder.json`, `fixtures/negative/comms-message-settled-expired.json`;
    `fixtures/catalogue.json`;
  - tests: `test/comms-rules.test.ts`, `test/comms-tools.test.ts` (the shape, the spec's phrases and eight plants),
    `test/rule-tolerance.test.ts`, `test/positive-sweep.test.ts`, `test/runner-model-profiles.test.ts`;
  - docs: `CONTEXT.md`, `docs/DOCMAP.md`, `docs/ux/scenarios.md` (SCN-025), `docs/ux/foundation.md`, `docs/ux/flows.md`,
    `docs/ux/screens.md`, `docs/backlog.md` (CT-21, CT-41, CT-42), `docs/handoffs/2026-10-13-owner-settlement.md`.
- **Not decided here:** how the operator observes the outcome (the operator's own check); notifications of a
  settlement; an expiry on `outcome_unknown`, which stays forbidden; how the host's operator endpoint learns the
  Project's open idempotency epoch (the host serves both).
- **Source:** Fabric's question (its board wave 4, operator controls D9, awareness COM-05) and its ADR-0117 §4 ("only
  `com.reconcile` leaves it", Fabric main); the owner's ruling of 2026-10-13 and its rulings on the reading of PR #102;
  DEC-0022, DEC-0073. DEC-0081 was reserved by the owner session; `FAC-SEM-109` was reserved by git CAS (`--key
  comms-settle-sem-20261013 SEM`); the record plane is `fs`. The registers are edited under the owner session's leases.

### DEC-0082 — Contexts for the RM-28 pilot: a context id, a grant's context, one placement per context, routing by context, and a grant's daily usage (`FAC-SEM-110`, `FAC-SEM-111`)

- **Date:** 2026-10-13
- **Status:** Accepted source change (on merge of its pull request). The owner's answer to the RM-28 pilot request
  (fabric-workspace `b7ac2188`, `docs/reports/2026-10-12-org-contexts/pilot-2026-10-13.md` §4, the row
  "fabric-agent-contract"), with the owner's later correction of that answer's §4 item (5) (a `grant.usage` event in
  place of "usage per grant already exists"), and the owner's decisions on the three independent readings of PR #107.
  Consumer adoption: board row CT-51.
- **Annotated (2026-10-18):** DEC-0086 amends item 5 and item 6: a `grant.usage` and a share registration carry their grant's own `org:<orgId>`, while no event carries its session's context and no check-in carries a context; `grantUsage` requires `context` and its `grantId` is a share grant id ([share registration](specification/share-registration.md)).
- **Annotated (2026-10-15):** DEC-0084 records the operator's NET-2 (K-1 answered: each organization enrollment of a machine gets keys of its own, 2026-10-15) and NET-1 (a network is a context); CX-CON-06 stays stage 2, so the pilot's single key stays linkable until it lands (contexts.md, *Linkability*).
- **Amends:** DEC-0030 (one core kind), DEC-0031 (one enrollment per organization; `org.id` for contexts; no wire
  change), DEC-0037 and DEC-0039 (a grant's optional `context`), DEC-0047 (a secret envelope fills only a personal
  slot), DEC-0055 (a placement's `context` and `grant`, a secret placement's `context`; `FAC-SEM-074` and `FAC-SEM-075`
  per context).
- **Decision:** in [contexts](specification/contexts.md) —
  1. **The context id.** `common.schema.json#/$defs/contextId`: `personal`, or `org:<orgId>` where `orgId` is
     `[A-Za-z0-9][A-Za-z0-9_-]{0,127}` (1–128 characters), the organization server's opaque id of the organization: the
     part of an enrollment's `org.id` set (an opaque id) a context can name, so every valid organization context can name
     an enrollment. Compared as written: never case-folded, trimmed or matched by prefix, as DEC-0077 compares board ids.
     Every valid value is already its DEC-0076 normal form. An organization server that takes part in contexts MUST issue
     its `org.id` (DEC-0031) within that pattern, since an `org.id` may hold `.`, `:` or `~`, which no context names (the
     vectors carry `org.example`). Informative: the first organization server, at its commit `03d454b`, issues `org_<base32>`. Fabric
     Switchboard's pool attribute uses the same form (its SB-109).
  2. **The grant's context.** `governance.schema.json#/$defs/grant` gains an optional `context`: the context in which the
     grant's principal uses it; a share grant into an organization carries that organization's `org:` id. Absent means
     not stated and stays valid. **`FAC-SEM-110`** (kinds `grant` and `estate-record`, `src/context-rules.ts`): a grant
     with `principalKind: external` never has `context: "personal"`, on a grant and on each of an estate record's
     `shareGrants[]`.
  3. **Access levels: no new field.** A grant's access level is its own `capabilities`, `effectCeiling`, `dataClasses`,
     `spend` and `expiresAt`. Named levels are a host's interface presets that fill those fields.
  4. **One instance per context on a machine (CX-CON-02).** An estate-record placement gains an optional `context`
     (absent means `personal`) and an optional `grant` (a share grant's id, a URI); a secret placement gains `context`,
     which `FAC-SEM-075` checks for a credential's shape like its other members.
     - `FAC-SEM-074` (amended): an agent is placed once per (machine, `agentRef`, context), not once per machine.
     - `FAC-SEM-075` (amended): a slot is placed once per (machine, `agentRef`, slot, context), for an instance placed in
       that context; an organization's instance fills its slot from its own machine (`from` is that machine).
     - **Secret envelopes name no context.** `estateEnvelopeContext` (`src/secret-envelope.ts`) and relay.md's open
       step 6 read only personal secret placements (no `context`, or `personal`), so the sealer admitted, the current
       placement and the marks do not depend on the order of the record's secret placements; an organization's slot
       never admits an envelope. The shared vectors' `placement` group lists an organization's secret placement before
       the personal one, so a port that reads the first match fails.
     - **`FAC-SEM-111`** (kinds `estate-record` and `estate-placement`, `src/estate-record-rules.ts`): a placement whose
       context is not `personal` names in `grant` a share grant of the same record, matched by normal form (DEC-0076),
       whose `context` equals the placement's as written and is an `org:<orgId>` (`parseContext`), and which the record
       does not revoke (a `grant` revocation matched by normal form). A personal placement (no context, or `personal`)
       names no grant. A malformed context such as `Personal` matches no grant, even one carrying the same value, so it
       fails closed. The rule reads revisions only: a revocation delta (DEC-0054) stops the grant's calls at the hub and
       the meter at once, and `FAC-SEM-111` refuses the instance from the next revision.
     - `placementTrust(record, machine, agentRef, context)` and kind `estate-placement` (`{record, machine, package,
       context?}`) take the context, `personal` by default, so an existing caller is unchanged.
  5. **No context on the telemetry or check-in wire; three routes.**
     - A device sends each enrollment's check-ins to that enrollment's own server, on that enrollment's interval,
       reporting only that enrollment's streams. A check-in has no session, and no session's context routes it.
     - `routeTarget(sessionContext, enrollments)` in `src/context-route.ts` routes a session's events: for
       `org:<orgId>`, the one enrollment whose `org` is exactly that id (`{route: "enrollment", org, index}`); otherwise
       `{route: "none", reason}` — `personal` always for a personal session, `not-a-context`, `not-enrolled`, or
       `ambiguous` for two enrollments in one organization.
     - `routeGrantUsage(grantContext, enrollments)` routes `grant.usage` (item 6): as `routeTarget` with the grant's own
       context, and `{route: "none", reason: "no-context"}` for a grant that states none; a `personal` grant answers
       `personal`.

     Both are total and never throw. The shared vectors are `fixtures/vectors/context-route.json`, written by
     `tools/vectors/context-route.ts`. The conformance rows are "a collector that sends events or check-ins to an
     organization server" and "a receiver of `grant.usage`".
  6. **A grant's daily usage: the core activity kind `grant.usage`** (the corrected §4 item (5)). One grant's metered
     usage for one UTC day, modelled on `policy.violation`: `occurred` is that day's midnight UTC (`FAC-SEM-039`,
     extended), `monotonicNs` is `"0"`, and it carries no `session`, `user`, `run`, `task`, `git`, `skill` or `launch`
     (schema). `data` (`telemetry-event.schema.json#/$defs/grantUsage`, closed):
     - `day`;
     - `grantId`: the grant's `meta.id`, a URI of 1–256 characters with no `#` (schema pattern), compared by normal form
       (DEC-0076), so one grant revised during the day is one row and the organization server joins it to the share
       grant it holds. The collector on the issuer's own device derives it from the receipts its meter settled, dropping
       a grant reference's `#<revision>` by taking the receipt's grant `meta.id`, which carries no revision. That is the
       issuer's side: DL-22's opacity binds callees, which name a grant only by the token's `grant` claim, so it is not
       broken. Hosts keep grant ids within 256 characters; a grant whose `meta.id` is longer reports no `grant.usage`;
     - `calls` (at least 1) and `unpricedCalls` (at most `calls`: the calls of receipts whose cost is unknown) count
       calls, and `costUsd` (a number
       of at least 0, or `null` when nothing was priced, never `0` for unknown, as DEC-0021 and `FAC-SEM-025` do;
       `FAC-SEM-038`, extended, checks the three together).

     It is built from the meter's settled grant-check receipts (DEC-0037), each counted once and assigned to the UTC day
     of the receipt's own timestamp, the `checkedAt` of the `allowed` answer that issued it
     (`grant-check.schema.json#/$defs/allowed`). A service's `byGrant` row is used only when it lists `receipts`, the
     meter holds none of them, and the report's window lies within one UTC day (its `days` hold one date); otherwise it is
     not used, and the collector reports what the meter holds. Sums and states only, never a per-call line. A collector emits it after the day ends, one per (day, `grantId`) per stream; a second
     one for the same (stream, day, normal form of `grantId`) in a batch is refused by `FAC-SEM-039`, folded into its
     clause "no event is sent twice" rather than a new code, since it is the same fact sent twice under a new id. A
     receiver counts the first `grant.usage` per (stream, day, `grantId`) and ignores later ones.
  7. **Membership `external` and `expiresAt` (CX-VES-03)** is the organization server's record. Only the device
     certificate (DEC-0031) follows the membership by itself. The share grant runs to its own `expiresAt` or its `grant`
     revocation (`FAC-SEM-076`, carried fast by DEC-0054's delta), so Fabric's share flow (CX-FAB-04) sets a share
     grant's `expiresAt` no later than the membership's expiry the organization server shows.
- **Why:**
  - A person in two organizations runs one agent as two instances on one machine; `FAC-SEM-074` allowed one placement
    per machine, so the pilot could not even be recorded. Keying the placement by context, and binding an organization's
    instance to its own share grant, lets each organization's instance carry its own access level and be revoked alone.
  - An access-level field would be a second source of truth beside the grant's own fields: it would need a rule
    reconciling the two, and a checker would have to choose between them. Two grants with different fields already are
    two levels.
  - A context field on events and check-ins adds nothing an organization server does not know from the certificate
    (DEC-0031, `FAC-SEM-045`), and it could leak `personal` or another organization's id (the RM-28 report's CX-22).
    Pure routing functions with shared vectors fix the one decision that matters, where the data goes, and let every
    port agree on the edge cases. Check-ins belong to an enrollment, not a session, so they are routed by enrollment.
  - A secret envelope names an `agentRef` and a slot, never a context. With several secret placements of one slot, the
    first match decided the sealer, so the answer depended on array order. Reading personal placements only, and filling
    an organization's slot locally, keeps the envelope's guarantees without a new member.
  - The organization server ingests only DEC-0030 activity batches over the DEC-0056 transport, and no activity event
    kind carried a grant's id, so CX-VES-08 (usage per grant as sums and states) had no input. A grant id is not put on
    `usage.line`: a per-call id would let the organization join every model call to the grant, finer than CX-VES-08's
    sums, and a shared agent's spend is metered by grant check and often has no session at all. A daily sum per grant is
    the coarsest record that answers the administrator's question, and usage under a share grant is data about a person
    (CX-VES-08, OD-1). The id is the grant's `meta.id`, not a revision's reference, so a revised grant stays one row.
  - **Linkability.** This slice does not meet CX-22 (unlinkable memberships), the operator's decision. Until CX-CON-06
    (a `kid` and an `iss` per context, waiting on Fabric's D3) a machine shows both organizations the same device key and
    hub key, and the same check-in `records`: the estate record's revision and digest, the heartbeat, the revocation
    delta's head and the leases. Running the pilot linkable waits on Fabric's recorded decision: the coordinator's K-1
    in the pilot report and fabric-workspace #215, both still open. Project Observatory's plan for a device identity per
    organization is the open divergence.
- **Compatibility:** `contractVersion` stays `0.1.0`, but this is not purely additive for readers.
  1. The grant and estate-record schemas are closed (`additionalProperties: false`): a reader pinned before DEC-0082
     refuses a grant with `context`, and an estate record whose share grant carries `context` (`shareGrants[].context`),
     whose placement carries `context` or `grant`, or whose secret placement carries `context`. So sharing alone
     triggers item 3's gate.
  2. `FAC-SEM-074` and `FAC-SEM-075` are relaxed: a record with two contexts' placements of one agent on one machine fails
     an older node's `FAC-SEM-074`.
  3. So a writer publishes such documents only once every reader is pinned at or after DEC-0082: for the estate record,
     every machine of the person; for a grant, also the meter, since `src/grant-projection.ts` validates the projected
     grant against its pinned `governance.schema.json#/$defs/grant`. A hub writes `context` on a grant only once the
     meter reading its projection is pinned at or after DEC-0082.
  4. `FAC-SEM-110` and `FAC-SEM-111` are new refusals of documents that carry the new members only; a record or grant
     without them reads as before. The new clauses of `FAC-SEM-038`, `FAC-SEM-039` and `FAC-SEM-075` concern only the
     new kind and the new member.
  5. `grant.usage`: the telemetry schema's `kind` is open, and a kind a receiver does not know is validated only as an
     unknown kind's data (`activity-common.schema.json#/$defs/extData`), then accepted, stored and counted uninterpreted
     (activity.md, *Extension and unknown kinds*). A receiver pinned before DEC-0082 therefore accepts a `grant.usage`
     whose `grantId` satisfies `activity-common#/$defs/extScalar`'s string branch: at most 64 characters, no whitespace,
     no leading `/`, `~` or `\` or drive prefix, and no `/Users/`, `/home/` or `\Users\`. Any other it rejects as that
     event's `schema` rejection, which consumes the event and leaves the batch standing. A writer sends such an id only
     to a receiver pinned at or after DEC-0082. `FAC-SEM-037`'s home-path check applies on every receiver.
- **Consequences / affects:**
  - spec: `docs/specification/contexts.md` (new), `docs/specification/estate-record.md` (fields, machines, share grants,
    the verifier's rule list, the rules table, who adopts it), `docs/specification/activity.md` (the kind table,
    `grant.usage`, unknown kinds, routing by context, the rules table), `docs/specification/devices.md` (one enrollment
    per organization, `org.id` for contexts), `docs/specification/conformance.md` (the two register rows, the estate row,
    the collector row, the receiver row, the identifiers row), `docs/specification/identifiers.md`,
    `docs/specification/spend-policy.md`, `docs/specification/governance-and-roles.md`,
    `docs/specification/delegation.md`, `docs/specification/relay.md` (open step 6: a personal secret placement only);
  - schemas: `schemas/common.schema.json` (`contextId`), `schemas/governance.schema.json` (`context`),
    `schemas/estate-record.schema.json` (a placement's `context` and `grant`, a secret placement's `context`),
    `schemas/telemetry-event.schema.json` (`grant.usage`, `grantUsage`), `schemas/secret-envelope.schema.json` (its
    description);
  - code: `src/context-route.ts` (new: `parseContext`, `routeTarget`, `routeGrantUsage`), `src/context-rules.ts` (new:
    `FAC-SEM-110`), `src/estate-record-rules.ts` (`FAC-SEM-074`, `FAC-SEM-075` per context, `FAC-SEM-111`,
    `placementTrust`; raw array indexes in instancePaths; messages that never throw), `src/activity-rules.ts`
    (`FAC-SEM-038`, `FAC-SEM-039` for `grant.usage`; messages and keys that never throw), `src/secret-envelope.ts`
    (personal secret placements only), `src/findings.ts` (`show`, `toNumber`), `src/relay-vectors.ts`
    (`placementVectorResults`), `src/semantic-rules.ts`; every other rule module reads input text through `show` and
    `toNumber` and so never throws on a `{"toString": 1}` member, an adjacent defect (`src/*-rules.ts`,
    `src/window-lease.ts`, `src/revocation-delta.ts`, `src/session-handoff.ts`, `src/settings-backup.ts`,
    `src/signing-challenges.ts`, `src/dashboard-declaration.ts`, `src/windows-token.ts`);
    `tools/vectors/context-route.ts` (new), `tools/vectors/relay-crypto.ts` (the `placement` group of
    `fixtures/vectors/secret-envelope.json`), `vitest.config.ts` (floors);
  - fixtures: `fixtures/vectors/context-route.json` (new); `fixtures/vectors/secret-envelope.json` (the `placement`
    group: an organization's secret placement listed before the personal one); `fixtures/positive/estate-record-contexts.json`,
    `fixtures/positive/governance-grant-share-context.json`, `fixtures/positive/telemetry-event-grant-usage.json`,
    `fixtures/positive/telemetry-event-grant-usage-unpriced.json`; `fixtures/negative/governance-grant-context-*.json`,
    `fixtures/negative/estate-record-placement-*.json`, `fixtures/negative/estate-record-secret-context-malformed.json`,
    `fixtures/negative/telemetry-event-grant-usage-*.json`; `fixtures/semantic/grant-context-*.json`,
    `fixtures/semantic/estate-*.json`, `fixtures/semantic/telemetry-event-grant-usage-*.json`,
    `fixtures/semantic/activity-batch-grant-usage-*.json`; `fixtures/catalogue.json`;
  - tests: `test/contexts.test.ts` (new), `test/context-route.test.ts` (new), `test/estate-record.test.ts`,
    `test/secret-envelope.test.ts`, `test/relay-vectors.test.ts`, `test/rule-tolerance.test.ts`,
    `test/activity-rules.test.ts`;
  - docs: `CONTEXT.md`, `docs/DOCMAP.md`, `README.md`, `docs/backlog.md` (CT-51, CT-38),
    `docs/handoffs/2026-10-13-rm28-pilot-contexts.md`, `docs/handoffs/README.md`.
- **Not decided here:**
  - CX-CON-04 (`person` and `organization` in place of `external`), CX-CON-03, CX-CON-05, and CX-CON-07…10, the
    purpose mark (CX-CON-10) included;
  - CX-CON-06 (a `kid` and an `iss` per context), which waits on Fabric's D3; until it lands the pilot is linkable, as
    *Why* says, and running it so waits on Fabric's recorded decision;
  - a context on a secret envelope: until one is decided, an organization's slot is filled on its own machine only;
  - a context on a project, a session or an event (the rest of CX-CON-01); who fixes a session to a context (the host's);
  - whether a share grant's `audience` names the placed agent (an agent id against an `agentRef`, which the contract
    does not map);
  - corrections of a day's `grant.usage` after it was emitted, and two collectors of one device reporting one grant;
  - Fabric confirms the context form and the placement key in its organization decision (D8). If D8 differs, a later
    decision changes them with a compatibility note.
- **Source:** the RM-28 pilot request and the owner's answer to it (fabric-workspace `b7ac2188`,
  `docs/reports/2026-10-12-org-contexts/pilot-2026-10-13.md` §4; the decisions CX-CON-01…10, CX-22, CX-VES-03 and
  CX-VES-08 in that report's README at the same commit); the owner's correction of §4 item (5) (2026-10-13); the owner's
  decisions on the three independent readings of PR #107 (2026-10-14). DEC-0082, `FAC-SEM-110` and `FAC-SEM-111` were
  reserved by the owner session (receipts SEM-0110, SEM-0111); no further code was reserved, the duplicate clause being
  folded into `FAC-SEM-039`; the record plane is `fs`. The registers are edited under the owner session's leases on
  `docs/DECISIONS.md`, `docs/specification/conformance.md` and `docs/backlog.md`.

### DEC-0083 — A lane that reads user content runs on an open-vendor model: the class `open-vendor`, a profile's `reads`, and a refusal as a failed turn (`FAC-SEM-112`)

- **Date:** 2026-10-15
- **Status:** Accepted source change (on merge of its pull request). The owner's design, with the owner's addition of
  `operator` and `web` to item 2 and the owner's decision on PR #111's concern (items 5 and 3's outcome clause).
  Consumer adoption: board row CT-52.
- **Amends:** DEC-0046 (the closed model classes gain `open-vendor`, a deliberate exception to its every-class rule; a
  model profile gains `reads`; `FAC-SEM-112` joins `profile-resolution`'s rules; a runner's failed turn).
- **Decision:** in [runners](specification/runners.md#what-a-profile-reads) unless named otherwise —
  1. **The model class `open-vendor`** joins the closed vocabulary (`registry-models.schema.json#/$defs/modelClass`,
     seven classes): a model whose vendor publishes its weights openly. Which models carry it is the catalogue writer's
     fact, not the contract's; the contract names no vendor list. Informative only, by vendor name: the operator's rule
     of 2026-10-15 names DeepSeek, Qwen, Xiaomi MiMo, Kimi, GLM and MiniMax. It is independent of `chinese-vendor`,
     which says where the vendor is, and `chinese-vendor` stays unchanged.
  2. **A profile declares what it reads.** `model-profile.schema.json#/$defs/profile` gains an optional `reads`: an
     array of at least one value, each once, of the closed vocabulary `$defs/reads`:
     - `user-content`: what a member, a client or the public sends (chat messages, questions, images, reviews,
       screenshots, voice);
     - `operator`: only what the estate's own operator or its agents write;
     - `web`: pages fetched from the open web.

     Absent means not declared and stays valid; `reads` is not required, since that would refuse every existing
     profile. Only `user-content` carries a model rule in this revision. `operator` and `web` let a lane declare that it
     does not read user content, so a host or a kit can require every profile to declare `reads`.
  3. **`FAC-SEM-112`** (kind `profile-resolution`, the one kind that holds both a catalogue and profiles in this
     revision; a later kind that holds both runs it too; `src/profile-rules.ts`, `closedUserContentRoute`): a profile
     whose `reads` lists `user-content`, alone or beside another value, has an open-vendor route.
     - With `fallback: none`, its first model carries `open-vendor` in the catalogue, because only the first model runs.
     - With `fallback: between-turns`, at least one of its models does.
     - A model the catalogue does not hold counts as not open, and a fallback value this revision does not define is
       read as `none`: the rule fails closed. The finding names the profile and says the lane would run on closed
       vendors alone.
     - **The outcome too.** When the resolved profile reads `user-content` and its own route is open, the models the
       project's policy leaves (`resolveModelProfile` over the bundle) must still give an open-vendor route by the same
       `fallback` test; otherwise the finding (`/resolved/models`) names the policy as what leaves the lane on closed
       vendors alone. A profile whose own route is closed is reported once, for itself; a refused launch and a bundle
       without a policy add nothing.
  4. **A refusal is a failed turn.** For a profile whose `reads` lists `user-content`, the runner treats a provider's
     content refusal, or an empty answer to a non-empty request, as a failed turn, so `between-turns` moves to the next
     model. Normative for runners; no schema can check it, so the runner row of
     [conformance](specification/conformance.md#clients-and-readers) carries it, and the host's launch row runs
     `FAC-SEM-112`.
  5. **`open-vendor` is descriptive: a deliberate exception to DEC-0046's every-class rule** (item 5 of DEC-0046).
     Resolution ignores it (`resolveModelProfile`), so a policy neither admits nor excludes a model by it, and a
     catalogue writer that adds it to a row changes no existing resolution. A policy cannot name it: the schema, not a
     rule clause, since a spend policy's and a grant's `modelClasses` are schema-checked — both now take
     `registry-models.schema.json#/$defs/admissionClass`, every class but `open-vendor`. A catalogue row carries at
     least one admission class (`classes` `contains` one), and the resolver keeps a row with none out under any policy
     that names classes, so the exception never admits a model by default.
- **Why:** a lane that reads what members, clients or the public send exists to handle content the closed vendors
  refuse, and a refusal can come back as an empty answer, which a runner that counts only errors reads as a success.
  The operator's rule of 2026-10-15, measured in one product: one closed model returned 1,328 refusals and 2,771 empty
  answers in seven days, and sending such content to one closed vendor got the whole provider account blocked for that
  vendor's chat models. A route with an open-vendor model, first or as the fallback a refusal moves to, keeps the lane
  answering. The class is the catalogue's fact, because vendors change their licences and the contract would otherwise
  hold a list that ages; `chinese-vendor` answers another question (where the vendor is), so the two stay separate.
  Under DEC-0046's every-class rule the class would have narrowed every policy that names classes the day a catalogue
  writer added it, so a fact about licences would have changed what projects may run; it is descriptive instead. A
  resolution's outcome is checked as well as the profile, because a policy can drop the open model by another class
  it does not allow (DeepSeek V4 Pro is also `strong`).
  The rule is fail-closed because a lane that reads user content on an uncatalogued model is exactly the case it
  exists to catch. `operator` and `web` exist so that "declared, not user content" differs from "not declared".
- **Compatibility:** `contractVersion` stays `0.1.0`, but this is not purely additive for readers.
  1. Both schemas are closed: a reader pinned before DEC-0083 refuses a catalogue row with the class `open-vendor` and
     a profile with `reads`. So a writer publishes `reads` on a profile only once every reader is pinned at or after
     DEC-0083. A catalogue writer marks `open-vendor` only once every schema reader is pinned at or after DEC-0083
     **and** every resolver the catalogue serves has ported item 5's exception (item 3), in its resolution and in any
     other copy of the every-class rule it keeps, such as a doctor's usability check.
  2. `FAC-SEM-112` refuses only profiles whose `reads` lists `user-content`. An existing profile, and a profile that
     declares only `operator` or `web`, is unaffected.
  3. Under item 5, adding `open-vendor` to a row changes no policy's outcome for a resolver that has ported the
     exception (`test/open-vendor-user-content.test.ts` resolves the catalogue with and without it). A resolver that
     does not validate the catalogue against the schema and has not ported the exception — a kit pinned before
     DEC-0083 — applies the every-class rule to `open-vendor` and drops every open model under a policy that names
     classes, and no policy can work around it, because a policy cannot name the class. Hence item 1's gate on the
     catalogue writer. Every port checks its resolver and its doctor against the shared vectors
     `fixtures/vectors/model-admission.json` (`admittedByClasses`). Refusing `open-vendor` in a policy's and a grant's
     `modelClasses`, and a row with no other class, tightens nothing a reader accepted before: the value did not
     exist.
  4. No test hard-coded the six classes: the vocabulary test compares runners.md with the schema's list, and the new
     test holds it at seven; DEC-0046's test now reads the policy's and the grant's `$defs/admissionClass`. The positive
     catalogue fixture marks its DeepSeek, Qwen, GLM, MiniMax and Mistral rows `open-vendor`, an illustrative choice:
     the catalogue writer decides.
- **Consequences / affects:**
  - spec: `docs/specification/runners.md` (the classes, What a profile reads, the rules table),
    `docs/specification/conformance.md` (the host's launch row, the runner row, the register row);
  - schemas: `schemas/registry-models.schema.json` (`open-vendor`, `$defs/admissionClass`, a row's `contains`),
    `schemas/model-profile.schema.json` (`reads`, `$defs/reads`), `schemas/spend-policy.schema.json` and
    `schemas/governance.schema.json` (`modelClasses` take `admissionClass`);
  - spec, also: `docs/specification/spend-policy.md` (`modelClasses`);
  - code: `src/profile-rules.ts` (`OPEN_VENDOR`, `USER_CONTENT`, `closedUserContentRoute`, `FAC-SEM-112` with its
    outcome clause, `admittedByClasses` and `resolveModelProfile`'s exception; `FAC-SEM-058`, `FAC-SEM-060` and `FAC-SEM-112` name an item by
    its index as written, past a leading non-object, an adjacent defect the adapter reported), `src/findings.ts`
    (`indexed`, moved from `src/activity-rules.ts` and `src/estate-record-rules.ts`, which import it);
  - fixtures: `fixtures/positive/registry-models.json` (the open-weight rows), `fixtures/positive/model-profile-user-content.json`,
    `fixtures/positive/model-profiles-user-content.json`, `fixtures/positive/model-profile-reads-operator.json`,
    `fixtures/negative/model-profile-reads-{unknown,empty,twice}.json`, `fixtures/negative/spend-policy-open-vendor-class.json`,
    `fixtures/negative/registry-models-open-vendor-only.json`, `fixtures/semantic/profile-resolution-user-content-*.json`
    (ten), `fixtures/vectors/model-admission.json` (new, eight cases), `fixtures/catalogue.json`;
  - tests: `test/open-vendor-user-content.test.ts` (new), `test/rule-tolerance.test.ts` (kind `profile-resolution`),
    `test/runner-model-profiles.test.ts` (the admission-class reference), `test/findings.test.ts` (new); `vitest.config.ts`
    (`src/findings.ts` measured at 100, `src/activity-rules.ts` 97.16 to 97.13 as the moved helper's covered branches
    left it) and `docs/evidence/specs/2026-10-11-board-waves/coverage-baseline.md`;
  - UX: `docs/ux/scenarios.md` (SCN-020's errors and coverage);
  - docs: `CONTEXT.md` (Model class, Model profile), `docs/DOCMAP.md`, `docs/backlog.md` (CT-52),
    `docs/handoffs/2026-10-15-open-vendor-user-content.md`, `docs/handoffs/README.md`.
- **Not decided here:**
  - that a checker's or a judge's fallback comes from a third vendor (the operator's guidance, not a rule a document
    can check yet);
  - per-model refusal or empty-answer thresholds, and how many failed turns end a conversation;
  - which lanes count as user content: the profile's writer declares it;
  - whether a host or a kit requires every profile to declare `reads` (allowed, not required here).
- **Source:** the operator's rule of 2026-10-15, measured in one product ("user-generated content — open-vendor models
  only"); the owner's design of DEC-0083, its addition of `operator` and `web`, and its decision on PR #111's concern
  (2026-10-15). DEC-0083 and
  `FAC-SEM-112` were reserved by the owner session (receipt SEM-0112); the record plane is `fs`. The registers are
  edited under the owner session's leases on `docs/DECISIONS.md`, `docs/specification/conformance.md` and
  `docs/backlog.md`.

### DEC-0084 — The estate ceremonies: create a network, add a machine by a comparison code or an enroll token, remove and re-key a machine (`FAC-SEM-113`, `FAC-SEM-114`)

- **Date:** 2026-10-15
- **Status:** Accepted source change (on merge of its pull request). The owner's design for RM-21 stage 1, packet P3,
  with the changes its pull request names and argues under *Changes from the design*. Consumer adoption: board row CT-53.
- **Amends:** DEC-0055 (D3 settled for a personal estate; a `device-key` revocation by key reference, read by
  `FAC-SEM-076`, which also refuses a malformed one; `FAC-SEM-073` refuses a non-canonical device key; `FAC-SEM-114` in
  the chain and in `verifyEstateRecord`; the revocation `ref`'s schema description), DEC-0063 (the register gains
  `enroll-token/1` and the key-signed `enroll-join/1`), DEC-0047 (the pairing rendezvous; key references, F7 and
  session revalidation by key in the relay; delta revocations in `estateEnvelopeContext`), DEC-0066 (an open session
  stands only while its kid maps to the key octets it was proven under, `sessionStands`, where DEC-0066 revalidated by
  kid; F7 and `unread` in `relayAdmissionSet`), DEC-0054 (`applyDelta` refuses as `malformed`, and `FAC-SEM-082` flags, a `device-key`
  revocation whose `ref` holds `@` but is no key reference: a revision could never list it, so the chain would stop),
  DEC-0082 (NET-1 and NET-2
  recorded; CX-CON-06 stays stage 2). Also, an adjacent totality fix: `FAC-SEM-034`'s probe check (`src/route-rules.ts`)
  compares before it builds a list (the adapter's report).
- **Decision:** in [ceremonies](specification/ceremonies.md) —
  1. **Who holds which key (NET-3 settles D3 for the personal estate).** The person's passkey signs every revision. The
     hub runs on the always-on machine and holds a private key of its own, an Ed25519 hub key the passkey certifies as
     that machine's `hubKey` (the schema already allowed it), never the machine's `#sig` key; it stays Ed25519 until
     Fabric's D2. Every machine keeps its own device keys. When the hub is away the others work within the existing
     windows: a revision's `validUntil` and the 72-hour heartbeat rule (DEC-0054). estate-record.md's open items on the
     hub key, a hub's private key, the fingerprint and the ceremony are closed for a personal estate.
  2. **The estate fingerprint** is a function, not a registered statement, since nothing signs it: `estateFingerprint`
     over revision 1's digest, SHA-256 of the RFC 8785 form of `{type: "estate-fingerprint/1", digest}`, rendered as
     five groups of five digits (each a 40-bit big-endian chunk modulo 10^5). 10^25 values: matching it by grinding a
     revision 1 of another estate costs about 2^82 hashes (DV-REL-01's lesson about short key codes). It names the
     network for people; it never pins a passkey alone.
  3. **"Create my network"** runs in the person's Fabric under the signing credential: revision 1 lists the signing
     passkey, the first machine with its `#sig`/`#kem` keys and, when that machine is the always-on one, its hub key
     (otherwise the hub key is certified in the revision that adds the always-on machine, since a hub key is a member of
     its machine); the machine pins the passkey it just used (DEC-0055).
  4. **"Add a machine", nearby or remote.** The new machine generates its keys; nearby a QR code or a short code names a
     local connection, remotely the trusted machine opens a one-time relay rendezvous of at most 600 s. Both sides commit
     (`pairingCommit`: SHA-256 over the RFC 8785 form of `{type: "fabric-enroll-commit/1", role, keys, nonce}`, with the
     trusted side's `genesis`, revision 1's digest), then reveal (`checkReveal`; a reveal that does not open its
     commitment aborts). The comparison code (`comparisonCode`) is the first five bytes of SHA-256 over the RFC 8785
     transcript `{type: "fabric-enroll-code/1", new: {keys, nonce}, trusted: {keys, nonce, genesis}}` modulo 10^6, six
     digits: with both sides committed before either reveals, an attacker in the middle has one guess per rendezvous,
     10^-6, detected when it fails (RFC 6189 §4.4.1.1, §7). A port computes the code only through
     `checkedComparisonCode(newCommit, newReveal, trustedCommit, trustedReveal)`, which runs `checkReveal` on each first:
     a code from unchecked reveals loses the bound. **A departure from DV-04:** DV-04's exchange is asymmetric (the new
     device commits, the trusted machine sends its nonce in clear, the new device reveals); here both sides commit, then
     both reveal, so one message order serves both transports and the trusted side's `genesis` is committed like its
     keys; the one-guess bound is the same. The person confirms the code on both screens and signs the
     next revision on the trusted machine, listing exactly the revealed keys; the new machine pins revision 1 only when
     the chain it verified starts at the revealed `genesis` and applies the revision only when `joinListed` accepts it.
     `rendezvousVerdict` is the one reading of a rendezvous: complete after both reveals, burned by any failure, an
     `abort` (one is still carried after both reveals, so the peer learns the codes differed) or any other later
     message. Schema `pairing-message.schema.json`; functions in `src/pairing.ts`; vectors
     `fixtures/vectors/pairing.json`.
  5. **A headless machine: `enroll-token/1`** (DV-05, as the owners amended it in DV-CON-01 on CT-38). A new register
     statement `{scope, genesis, purpose, ceiling, notBefore, expiresAt, nonce, uses}` signed by a passkey assertion:
     `estate:<id>`, revision 1's digest, `agent-host`, `null` or a digest, at most 900 s, 32 random bytes, `1`. The node
     reads it from stdin or a 0600 file only, never argv, a URL, the environment or a log. `verifyEnrollToken` checks the
     clock, the shape, the estate and `genesis`, the passkey among the current revision's authorities, the assertion and
     the window, and refuses a token with any member beyond `{schema, statement, signature}` or an assertion member the
     schema does not list; `redeemEnrollToken(token, machineKey, proof, ledger)` requires the presented `#sig` key's
     signature over the key-signed register statement `enroll-join/1` `{digest of the token's statement, nonce}`
     (`bad-proof`), binds the nonce to that key's fingerprint on first use and refuses every later use as `reused`,
     answering the line the hub logs. The token is a bearer token: an interceptor who redeems it first binds its own key
     and the honest node's attempt is refused `reused` and logged; so the node prints its own key's fingerprint and
     Fabric shows the fingerprint it is about to list, for the person to compare before signing. The token gives no
     trust: only a revision that lists the machine does; its `genesis` lets the node pin the person's estate.
     `FAC-SEM-113` checks the document.
  6. **"Remove a machine"**: a revision without it lists `machine <id>` and its hub key's `hub-key <kid>`
     (`FAC-SEM-114`), and the delta carries each fast (DEC-0054). A solo estate has no DEC-0031 certificate, so the
     record's revocation and the delta are the whole removal; where an organization server issued a certificate, that
     server revokes it when the organization removes the machine.
  7. **"Replace a machine's key"**: the machine pairs again in the role `new` under the same id; one revision lists the
     new keys and revokes the old ones by their key reference `<kid>@sha256:<hex>` (`deviceKeyRef`), since a kid outlives
     its keys and a kid revocation would revoke the new key too (`FAC-SEM-076` reads both forms); a hub key on that
     machine is re-certified under a new kid with the old kid revoked, or revoked. A node applies such a revision only if
     it holds every listed key (`ownKeysDecision`), otherwise it stops using its keys. In both removal and replacement
     the revision lists each delta entry's revocation exactly as the entry names it (`FAC-SEM-084`), and Fabric's hub and
     drafter use that form. From the moment a verifier applies the revision or a delta entry, the old key is refused: by
     the relay's admission set (kid or key reference) and, for a session it proved, by `sessionStands`, which compares
     key octets because the kid stays; by an envelope's sender key (`estateEnvelopeContext` with the applied entries'
     `extraRevocations`, `bad-key`); and, for a hub key, by DL-14 and `estateSigner`. A one-machine estate re-keys like
     "create my network": the passkey signs on the machine itself, no pairing, a revision that lists the new keys and
     revokes the old ones by reference. A stolen machine is removed, not re-keyed.
  8. **`FAC-SEM-114`** (kind `estate-record-revision`, and `verifyEstateRecord` with a parent, `rule-violation`): what a
     revision drops it revokes in the same revision — a removed machine and its hub key, a device key of a kept machine
     by its reference or kid, a hub key no longer certified with the same kid and key. `FAC-SEM-076` refuses a
     `device-key` ref that holds `@` but does not match `^[A-Za-z0-9][A-Za-z0-9._:~-]{0,127}#(sig|kem)@sha256:[a-f0-9]{64}$`;
     `FAC-SEM-073` refuses a device key with no canonical fingerprint. The relay admits a `#sig` key only under its own
     machine's kid and a kid listed twice for neither (F7, the adversarial review of a node port), so every port agrees.
  9. **NET-2 answers K-1**: each organization enrollment gets its own keys. The contract's part, CX-CON-06 (a `kid` and
     an `iss` per context, `FAC-SEM-044`, `FAC-SEM-073`, the check-in), is stage 2 and not in this decision; until it
     lands the pilot's single key stays linkable (contexts.md rewritten).
  10. **NET-1**: a network is a context (CONTEXT.md); no new schema.
- **Why:** RM-21 stage 1 needs a person's two machines to form one network without hand-made files, and the contract
  had the record but no ceremony that makes one. A comparison code over one key's fingerprint is brute-forced offline
  (DV-REL-01); a commitment before any reveal leaves one online guess. The design bound keys and nonces; this decision
  also binds the trusted side's `genesis`, because public keys can be copied: a chain of another estate whose newest
  revision lists the trusted machine's key and a copy of the person's public passkey would otherwise pass every check
  of the new machine. The enroll token carries `genesis` for the same reason. A device key's kid is fixed by its machine
  id (DEC-0053), so a key replacement under the same id needs a revocation form that names one key.
- **Compatibility:** `contractVersion` stays `0.1.0`.
  1. The new schemas, the register type and the functions are additive.
  2. `estate-record.schema.json` does not change: a key reference is a `ref` string it already admits, and an older
     reader accepts every record this decision produces. An older reader does not recognise a key reference; since the
     revision that revokes a key no longer lists it, that reader distrusts the key anyway, except that an older relay
     keeps admitting a key a delta entry revoked by reference until it applies the revision.
  3. `FAC-SEM-114` is a tightening: a reader at or after DEC-0084 refuses a revision that drops a machine, a key or a
     hub key without revoking it; an older reader accepts it. No estate record is deployed (CT-19, CT-20), and every
     revision in the fixtures already revoked what it dropped.
  4. `FAC-SEM-076`'s new clauses refuse only a record that revokes by key reference a key it still lists, or names a
     malformed key reference — forms that did not exist; `FAC-SEM-073`'s refuses a non-canonical key the schema already
     refuses for P-256. `relayAdmissionSet` refuses keys revoked by key reference and, under F7, a key a record that
     passed `FAC-SEM-073` never holds; `sessionStands` ends a session whose kid now names another key, which a relay that
     revalidated by kid kept. `estateEnvelopeContext`'s `extraRevocations` is optional.
  5. The revocation `ref`'s schema description names the key-reference form; validation is unchanged.
  6. The delta side tightens with the records: a machine at or after DEC-0084 refuses a page whose `device-key` entry
     names a malformed key reference (`malformed`), while an older machine applies it; a hub runs `FAC-SEM-082` before it
     signs an entry. The shared `placement` vectors' `expect.holds` gains `senderKnown`, so a port refreshes the runner
     with the vectors (an old runner fails every placement case loudly).
  7. Within this pull request's own first reading (unshipped, CT-53 open): the rendezvous now carries one `abort` after
     both reveals, `redeemEnrollToken` takes the token and a proof in place of the nonce, and the register gains
     `enroll-join/1`.
- **Consequences / affects:**
  - spec: `docs/specification/ceremonies.md` (new), `docs/specification/estate-record.md` (header, revisions,
    authorities, `hubKey`, revocations, the verifier, ER-11, the rules table, not decided),
    `docs/specification/conformance.md` (five reader rows, the estate row, four canonical-form rows, two register rows,
    two register codes, the next free code), `docs/specification/signing.md`, `docs/specification/relay.md` (the pairing
    rendezvous), `docs/specification/devices.md` (enrollment), `docs/specification/contexts.md` (linkability),
    `docs/specification/revocation-delta.md` (who signs, RD-2, the `FAC-SEM-082` row), the conformance delta reader row;
  - schemas: `schemas/pairing-message.schema.json` (new), `schemas/enroll-token.schema.json` (new);
  - code: `src/pairing.ts` (new), `src/enroll-token.ts` (new), `src/estate-record-rules.ts` (`deviceKeyFingerprint`,
    `deviceKeyRef`, `KEY_REFERENCE`, `validDeviceKey` exported, `FAC-SEM-073`, `FAC-SEM-076`, `FAC-SEM-114`,
    `verifyEstateRecord`), `src/signing-challenges.ts` (`enroll-token/1`, `ENROLL_TOKEN_FIELDS`, `enroll-join/1`),
    `src/relay.ts` (`relayAdmissionSet`: key references, `unread`, F7; `sessionStands`), `src/relay-vectors.ts` (the
    `session` group, `extraRevocations` and `senderKnown` in `placementVectorResults`), `src/revocation-delta.ts`
    (`applyDelta`'s entry shape), `src/revocation-delta-rules.ts` (`FAC-SEM-082`), `src/secret-envelope.ts` (`extraRevocations`), `src/route-rules.ts` (`FAC-SEM-034`'s probe check,
    the adjacent totality fix), `src/semantic-rules.ts`, `src/protocol-revisions.ts`; `tools/vectors/pairing.ts` (new),
    `tools/vectors/relay-crypto.ts` (`admissionSet`, `session`, `placement`),
    `tools/vectors/enroll-token.ts` (new); `vitest.config.ts` (two files at 100) and
    `docs/evidence/specs/2026-10-11-board-waves/coverage-baseline.md`;
  - fixtures: `fixtures/vectors/pairing.json`, `fixtures/vectors/enroll-token.json` (new), `fixtures/vectors/relay.json`,
    `fixtures/vectors/secret-envelope.json` (`placement` with `extraRevocations`), `fixtures/vectors/revocation-delta.json`
    (one `apply` case);
    `fixtures/positive/estate-record-key-replaced.json`, `fixtures/positive/enroll-token*.json`,
    `fixtures/positive/pairing-message-*.json`, `fixtures/negative/enroll-token-*.json`,
    `fixtures/negative/pairing-message-*.json`, `fixtures/semantic/enroll-token-*.json`,
    `fixtures/semantic/estate-revision-{key,kem,machine-id,remove,hub}-*.json`, `fixtures/semantic/estate-device-key-*.json`,
    `fixtures/semantic/estate-key-replaced-kid-other-machine.json`; `fixtures/catalogue.json`;
  - schemas, also: `schemas/estate-record.schema.json` (the revocation `ref`'s description);
  - tests: `test/pairing.test.ts`, `test/enroll-token.test.ts`, `test/ceremonies.test.ts` (new);
    `test/signing-challenges.test.ts`, `test/estate-record.test.ts`, `test/positive-sweep.test.ts`,
    `test/schema-compilation.test.ts`, `test/rule-tolerance.test.ts`, `test/revocation-delta.test.ts`;
  - UX: `docs/ux/scenarios.md` (SCN-028…SCN-030), `docs/ux/foundation.md` (ST-023…ST-025), `docs/ux/flows.md`
    (FLW-19, FLW-20), `docs/ux/screens.md` (SCR-22, SCR-23);
  - docs: `docs/evidence/sources.md` (RFC 6189), `CONTEXT.md`, `docs/DOCMAP.md`, `README.md`, `docs/backlog.md` (CT-53,
    CT-38, CT-51), `docs/handoffs/2026-10-15-estate-ceremonies.md`, `docs/handoffs/README.md`.
- **Not decided here:** CX-CON-06 and how an organization enrollment's ceremony differs (stage 2, Fabric's D8);
  `node-summary/1`, which no step needs; the interface and the QR code's encoding; the relay's frame types for a
  rendezvous; how Fabric's revocation of an unused token reaches the hub's ledger (no existing channel carries it); a ceiling document's shape (tokens carry `ceiling: null` until then); a token for an organization or
  another purpose (a new type, `enroll-token/2`); recovery when every passkey is lost.
- **Source:** the operator's decisions NET-1…NET-4 of 2026-10-15 (fabric-workspace
  `docs/reports/2026-10-15-agent-network-stage1/README.md` at `704daafe`, packet P3); the RM-28 devices design
  (fabric-workspace `docs/reports/2026-10-12-org-contexts/devices.md` at `5ace0ff3`: §2, DV-04, DV-05, DV-REL-01 and the
  owners' answer "amend" to DV-CON-01, board row CT-38); RFC 6189 in the [source ledger](evidence/sources.md); the
  owner's design of DEC-0084 (2026-10-15). DEC-0084, `FAC-SEM-113` and `FAC-SEM-114` were reserved by git CAS
  (`agent_sync.py reserve --key dec0084 DEC`, `--key dec0084-1 SEM`, `--key dec0084-2 SEM`); the record plane is `fs`.
  The registers are edited under the owner session's leases on `docs/DECISIONS.md`, `docs/specification/conformance.md`
  and `docs/backlog.md`.

### DEC-0085 — The entitlement, `entitlement/1`: one signed record of what an order entitles a subject to, under a key set an offline root signs, with a 38-day life, a 7-day refresh and a 14-day grace

- **Date:** 2026-10-17
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: board row CT-54: the
  PassionCode platform issues (its PLAT-020), the first organization server and a personal cloud verify.
- **Annotated (2026-10-19):** item 3 amended by DEC-0088 (`enterprise-cloud`, a third hosting product for an
  organization).
- **Amends:** nothing. It answers the platform's request PLAT-020 on the project board (2026-10-17), which left the
  signature, the grace and the refresh to the contract, and serves the platform's organization offer (its ADR-0005,
  accepted 2026-10-16, D-2 and D-4).
- **Decision:** in [entitlement](specification/entitlement.md) unless named otherwise:
  1. **Shape:** one JSON document with its signature inside, `{type: "entitlement/1", ...fields, alg, kid, sig}`
     ([`entitlement.schema.json`](../schemas/entitlement.schema.json)), signed over the register's `entitlement/1`
     statement, the UTF-8 RFC 8785 form of the document without `sig` (`entitlementSigningInput`), `signer: "key"`.
     Not a JWT: every signed record of the contract uses one canonical form (DEC-0043, DEC-0062), the verifier needs no
     JOSE parser, and the type inside the bytes means no other statement of the same key is an entitlement.
  2. **Algorithm:** `EdDSA` (Ed25519) only, a small-order key refused before any verification (DEC-0045); `ES256` may
     join additively by a later decision. One algorithm leaves no downgrade path.
  3. **Fields,** every member always present and `null` where the order has no such line, so the register type keeps
     one field list for good: `issuer` (a lower-case `https://` origin, no port, path or trailing slash), `subject` (a
     context id, `org:<orgId>` or `personal`, DEC-0082; never a person), `estate` (for `personal`, the person's estate id;
     `null` for an organization), `order` (`{id, revision}`), `issuedAt` ≤ `notBefore` < `expiresAt`, `licence`
     (`{members}`, the member allowance the order grants, from 1 to 1 000 000, or `null`; `null` for `personal`; the
     billable count is the organization server's own metering, never this field), `hosting` (`{product, size}`, `org-cloud` only
     for `org:` and `personal-cloud` only for `personal`, or `null`), `support` (`{tier}` of `observe`, `assist`,
     `managed`, or `null`; `null` for `personal`), `agents` (0 to 256 `{agentRef}`, unique, DEC-0050). No amount, price,
     currency or person: the schema refuses any member it does not list.
  4. **Issuer keys:** the verifier pins the issuer's root key `{issuer, kid, x}`, which signs only
     `entitlement-key-set/1` documents ([`entitlement-key-set.schema.json`](../schemas/entitlement-key-set.schema.json)):
     `{type, issuer, revision, issuedAt, keys: [{kid, alg, x, notBefore, notAfter}], revoked, alg, kid, sig}`; signing
     keys sign entitlements (devices.md's key-set pattern, DEC-0031). An entitlement verifies only under a listed key
     whose window holds its `issuedAt` (`notBefore` ≤ `issuedAt` < `notAfter`); a new key overlaps the old one, which stays
     listed up to 52 days past its window; a revoked kid refuses everything it signed at once (`key-revoked`); a key
     set holds at least one key valid at its `issuedAt` (devices.md *Key sets*, `FAC-SEM-116`); the
     verifier keeps the highest key-set revision and its digest (lower `stale-revision`, same revision with other bytes
     `revision-conflict`, same bytes unchanged); replacing the root is a reinstall. The root
     stays offline, owned by the platform.
  5. **Windows:** a life of at most 38 days (`MAX_ENTITLEMENT_SECONDS`): one billing month of at most 31 days plus the
     7-day refresh lead, so a monthly issuer re-issues by day 31 and `refreshDue` lights only when it missed that (the
     owner's decision of the fix round, 2026-10-18; the brief had 35); the next revision issued at least 7 days before
     `expiresAt`, from when the verifier reports `refreshDue` (`REFRESH_SECONDS`); 14 days of `grace` after `expiresAt`,
     then `lapsed` (`GRACE_SECONDS`); 60 s of clock skew on `notBefore` (`CLOCK_SKEW_SECONDS`). What a lapse switches off is
     the verifying product's.
  6. **One entitlement per subject:** the verifier holds `{orderId, revision, issuedAt, digest}` per subject; the same
     order's higher revision is accepted, the same revision and digest is `unchanged`, the same revision with another
     digest `revision-conflict`, a lower revision `stale-revision`, and another order is accepted only when issued later.
     **The issuer** raises `order.revision` with every entitlement it issues for an order (a refresh, a re-issue) and
     never signs one revision with other bytes; after revoking a key it re-issues everything that key signed under a
     listed key, delivered before or with the key set that revokes it; one entitlement per subject carries every current
     line of that subject, and the platform keeps one order per subject (an amendment is a revision), so a second order
     supersedes the first only as a deliberate replacement. **The verifier** keeps the accepted document, not only the
     held record, and runs `verifyEntitlement` on it again after every key set it applies and at least once a day, so
     `grace`, `lapsed` and `key-revoked` reach an entitlement it already accepted.
  7. **The verifiers,** answering and never throwing: `verifyEntitlement` in the order of the EN table (EN-1…EN-13:
     `context-invalid`, `no-clock`, `malformed`, `wrong-issuer`, `unknown-algorithm`, `unknown-key`, `key-revoked`,
     `unusable-key`, `small-order-key`, `key-not-valid`, `bad-signature`, `wrong-subject`, `too-long-lived`,
     `not-yet-valid`, `lapsed`, `stale-revision`, `revision-conflict`), and `verifyEntitlementKeySet` in the order of the
     EK table (EK-1…EK-7).
  8. **Rules:** `FAC-SEM-115` (`entitlement`) and `FAC-SEM-116` (`entitlement-key-set`).
  9. **Protocol revisions:** `entitlement` `["1"]` and `entitlement-key-set` `["1"]`.
- **Choices made in implementation** (the brief left them open; recorded so a port reads them as decisions):
  - an inverted time order (`notBefore` before `issuedAt`, or `expiresAt` at or before `notBefore`) is `too-long-lived`,
    as WL-3 answers a lease whose life is not positive; the subject's lines in disagreement are `malformed`;
  - a key set whose `kid` is not the pinned root's is `wrong-issuer` (the root is one issuer's one key; the EK codes name
    no `unknown-key`);
  - `issuedAt`'s skew is implied: `issuedAt` ≤ `notBefore`, so the 60 s on `notBefore` bounds an `issuedAt` in the
    future, and the verifier checks `notBefore` alone;
  - a verifier for an organization takes no `estate` and one for `personal` requires it (`context-invalid` otherwise);
    a key set handed as applied must be well formed and signed under `EdDSA` (`context-invalid` otherwise), so a listed
    key under another algorithm is `unusable-key`;
  - kids are opaque ids (`activity-common#/$defs/opaqueId`), a key set holds 1 to 32 keys and up to 256 revoked kids, and
    the issuer is a host of two labels or more, compared as written;
  - the held record of a key set is `{revision, digest}`, `digest` being `sha256:` of the signed bytes, as an
    entitlement's;
  - an unreadable clock answers `no-clock` even when the trust is also invalid: the clock is read before the rest of
    the context, so no comparison ever runs on NaN (vector "no clock: an unreadable now beside an invalid subject");
  - instants compare at millisecond precision: an entitlement or key-set time with more than three fraction digits is
    malformed, in the schema (`entitlement#/$defs/instant`) and in the shape check, so every port compares the same
    instants (the owner's decision of the fix round);
  - a key set with no key valid at its `issuedAt` is a `FAC-SEM-116` finding, `malformed` to `verifyEntitlementKeySet`
    (EK-2, a structural fault like a kid listed twice) and `context-invalid` to `verifyEntitlement` when handed as
    applied (EN-1);
  - a missing `licence`, `hosting` or `support` member is `malformed`, never a throw: only `null` or an object of exactly
    its members is a line.
- **Why:** the platform sells organization and personal plans whose paid functions run on servers it does not operate;
  those servers must decide offline, from a record they verify, what is paid, and an admin agent must read its support
  tier from that record rather than from editable configuration. An offline root with rotating online keys keeps the
  root out of reach without reinstalling verifiers. The grace covers the issuer's outage; the
  refresh warns a week ahead. J10: no person, no member list, no amount; a personal entitlement's estate id is not a
  cross-organization person id.
- **Compatibility:** Additive: two new schemas, a specification, two register types, two rules, two protocol names.
  `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/entitlement.md` (new), `docs/specification/conformance.md` (the register, canonical
    forms, the verifier's and the issuer's rows, `FAC-SEM-115` and `FAC-SEM-116`);
  - schemas: `schemas/entitlement.schema.json`, `schemas/entitlement-key-set.schema.json` (new);
  - code: `src/entitlement.ts` (new), `src/signing-challenges.ts` (`ENTITLEMENT_FIELDS`, `ENTITLEMENT_KEY_SET_FIELDS`,
    the two types), `src/semantic-rules.ts`, `src/protocol-revisions.ts`;
  - fixtures: `fixtures/catalogue.json`, `fixtures/positive/entitlement*.json`, `fixtures/negative/entitlement-*`,
    `fixtures/semantic/entitlement-*`, `fixtures/vectors/entitlement.json` (new, written by
    `tools/vectors/entitlement.ts`), `fixtures/vectors/signing-challenges.json` (the two statements);
  - tests: `test/entitlement.test.ts` (new), `test/signing-challenges.test.ts`, `test/protocol-revisions.test.ts`,
    `test/positive-sweep.test.ts`, `test/rule-tolerance.test.ts`, `test/schema-compilation.test.ts`; the floor for
    `src/entitlement.ts` in `vitest.config.ts` and `docs/evidence/specs/2026-10-11-board-waves/coverage-baseline.md`;
  - docs: `CONTEXT.md` (Entitlement), `README.md`, `docs/DOCMAP.md`, `docs/backlog.md` (CT-54),
    `docs/evidence/specs/2026-10-17-entitlement/brief.md`, `docs/evidence/specs/2026-10-17-entitlement/plants.md`,
    `docs/handoffs/2026-10-17-entitlement.md`, `docs/handoffs/README.md`, `docs/OPEN_QUESTIONS.md` (OQ-0012).
- **Not decided here:** member-period metering and the billable-member definition (the first organization server's
  Stage 5); per-agent usage, which stays `grant.usage` (DEC-0082); how the platform stores orders and keeps its root
  offline; the transport of entitlements and key sets and their delivery order (a key set before the entitlements
  signed under a key it adds), the issuer's; which functions a lapse disables (the platform's packet keeps ingest,
  security, fleet and setup through the grace).
- **Source:** the platform's PLAT-020 message on the project board (2026-10-17); its organization offer ADR-0005 and its
  recovery program packet §1–2; DEC-0031, DEC-0043, DEC-0045, DEC-0050, DEC-0062, DEC-0063, DEC-0082; RFC 8032 and
  RFC 8785 in the [source ledger](evidence/sources.md); the brief `docs/evidence/specs/2026-10-17-entitlement/brief.md`.
  DEC-0085, `FAC-SEM-115` and `FAC-SEM-116` were reserved by git CAS (`agent_sync.py reserve --key ct54-entitlement
  DEC`, `--key ct54-entitlement-doc SEM`, `--key ct54-entitlement-keyset SEM`); the record plane is `fs`. The registers
  are edited under the owner run's leases on `docs/DECISIONS.md`, `docs/specification/conformance.md` and
  `docs/backlog.md`.

### DEC-0086: Share registrations, `share-registration/1`: the sharer's enrolled node tells the organization server which agent each share grant into it runs; `grant.usage` carries the grant's own context; a share grant id holds nothing about the person (`FAC-SEM-117`, `FAC-SEM-118`)

- **Date:** 2026-10-18
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: board row CT-56.
- **Amends:** DEC-0082 item 5 (a `grant.usage` carries its grant's own `org:<orgId>`; no event carries its session's
  context and no check-in carries a context) and item 6 (`grantUsage` requires `context`, and `grantId` is a share grant
  id); DEC-0031 and DEC-0056 (a share-registration request is a device request; `FAC-SEM-045` checks a `grant.usage`'s
  context). It answers the first organization server's request VES-GRANT-CONTEXT on the project board (thread
  `cc944654`, 2026-10-17): direction "(a) plus the context from (b)", with (c) as the share grant id.
- **Annotated (2026-10-20):** DEC-0094: a node reads the latest `protocols` list it received (its enrollment response, or
  a check-in response that carries one), and also sends after a check-in response's `protocols` first lists
  `share-registration/1`.
- **Decision:** in [share registration](specification/share-registration.md) unless named otherwise:
  1. **Carrier:** `share-registration/1`, sent by the sharer's enrolled node to the organization server of one of its
     own enrollments as a device request, under mutual TLS and the DEC-0056 `fabric-device` signature by that
     enrollment's `#sig` key; the receiver answers `share-registration-receipt/1` or a typed refusal. The node builds it
     from the estate revision and delta entries it applied, never from a draft; Fabric's share flow (CX-FAB-04) causes it
     by drafting the revision the passkey signs and never sends one. A protocol revision of its own (DEC-0067), listed in
     the enrollment response's `protocols`.
  2. **Schema** `share-registration.schema.json`, closed, one of: a registration `{type, grantId, context, state,
     grantRevision, agentRef, startsAt, expiresAt}` (active) or `{type, grantId, context, state, withdrawnAt}`
     (withdrawn); a receipt `{type, grantId, state: registered|unchanged|withdrawn, digest}`; a refusal `{error: {code,
     message}}` with the codes `malformed`, `wrong-organization`, `unassigned-device`, `already-withdrawn`,
     `agent-mismatch`, `stale-revision`, `revision-conflict`. New defs `common#/$defs/orgContextId` and
     `common#/$defs/shareGrantId`. No estate id or revision, machine, principal, issuer, `createdBy`, project, audience,
     capability, effect ceiling, data class, spend, content hash or free text. `shareRegistrationDigest` is `sha256:` of
     the UTF-8 RFC 8785 form of the registration.
  3. **Derivation** `deriveShareRegistrations(record, appliedEntries, orgId, previouslyRegistered)`, total: for each
     share grant whose `context` is `org:<orgId>` as written, a `meta.id` that is no share grant id registers nothing
     (`share-grant-id`); a `grant` revocation in the record or an applied delta entry, by normal form, withdraws it at the
     earliest `revokedAt`; otherwise the revision's placements in that context naming it by normal form decide (none,
     nothing yet; two `agentRef`s, nothing, `share-grant-agents`; one, active). A grant registered earlier that the
     revision no longer lists and does not revoke is withdrawn at the revision's `issuedAt`. A node sends on change and
     SHOULD send each active registration again at least every 7 days, except one a typed refusal answered.
  4. **Authenticity and the receiver's order** `decideShareRegistration(held, registration, binding)`, total: the
     organization from the certificate's `org.id`, the registrant from the `user.id` bound to its epoch, never from the
     body; held per (registrant, `grantId`); the body bytes and signature fields kept as evidence. SR-0 (own context),
     SR-1 (DEC-0056 steps, 401), SR-2 (`schema-unsupported`), SR-3 (`malformed`), SR-4 (`wrong-organization`), SR-5
     (`unassigned-device`), SR-6 (`already-withdrawn`), SR-7 (`agent-mismatch`), SR-8 (`stale-revision`), SR-9
     (`revision-conflict`), SR-10 (`unchanged`), SR-11 (`registered` or `withdrawn`).
  5. **State:** a withdrawal is final; a withdrawal with nothing held is a tombstone; of two withdrawals the earliest is
     kept; a registration ends at the earlier of `expiresAt` and `withdrawnAt`; only a higher `grantRevision` extends
     `expiresAt`; kept at least as long as the receiver's raw retention.
  6. **`grant.usage`:** `context` is required (`orgContextId`), the value the collector passed to `routeGrantUsage`;
     `grantId` is a share grant id. `FAC-SEM-045` is amended: a `grant.usage` whose `data.context` is not `org:` and the
     certificate's `org.id` as written is rejected `attribution`, with no new ack value. `FAC-SEM-039`'s key and
     `routeGrantUsage` are unchanged. The join `joinGrantUsage(event, binding, registrations)`, total: GJ-1 another
     context, rejected `attribution`; GJ-2 no bound user, stored not joined `unassigned-device`; GJ-3 no registration for
     (bound user, `grantId`), `unregistered`, joined again when one arrives; GJ-4 a day before the UTC day of `startsAt`,
     `before-start`; GJ-5 a day after the UTC day of the end, `after-end`; GJ-6 joined to the registration's `agentRef`.
     The sender gate `gateGrantUsage(answer)`, total, over the enrollment's latest answer to the grant's registration:
     `send` after a receipt (any state), `stale-revision` or `already-withdrawn`; `hold-degraded` after
     `revision-conflict`, `agent-mismatch`, `wrong-organization`, `unassigned-device`, `malformed` or
     `schema-unsupported` under their own status, which sending the same registration again does not clear (the node
     keeps the sums, reports degraded and sends again only when the record changes); `hold` before any answer and after
     anything else (a 401, a receiver's fault, a code under a status not its own), sent again with backoff.
  7. **Share grant ids (`FAC-SEM-117`):** a grant whose `context` is `org:<orgId>` has the `meta.id`
     `urn:fabric:share:<32 lower-case hex>`, 128 bits from a CSPRNG, never derived from a name, an address, an estate
     id, an `agentRef` or the organization; its `startsAt` and `expiresAt` carry at most three fraction digits; it keeps
     its `agentRef` across revisions, so moving a share to another agent revokes the grant and mints a new id (kind
     `org-share-grants` given `parent`, the latest earlier revision that placed the grant in its context (the immediate parent when it did), refuses a re-pointed grant, a move in two steps
     included; SR-7's recovery). Checked by the schemas at the boundary and by `FAC-SEM-117` (kinds `grant`
     and `org-share-grants`), which Fabric and the kits run before signing; not by `governance.schema.json` nor
     `verifyEstateRecord`, so a naming fault never locks an estate out; it fails closed for billing only. Compared as
     written ([identifiers](specification/identifiers.md#where-identifiers-are-compared)).
  8. **Rules:** `FAC-SEM-117` as above; `FAC-SEM-118` (kinds `share-registration`, `share-registration-derive`,
     `share-registration-intake`, `grant-usage-join`); `FAC-SEM-045` amended.
  9. **Revisions and amended text:** `share-registration` `["1"]` and `share-registration-receipt` `["1"]`; devices.md's
     transport signs "every batch, check-in, rotation and share-registration request"; contexts.md, CONTEXT.md and
     DEC-0082 item 5 (annotated) say that no event carries its session's context and no check-in carries a context,
     while a `grant.usage` and a share registration carry their grant's own `org:<orgId>`.
- **Choices made in implementation** (the brief left them open; recorded so a port reads them as decisions):
  - instants in a registration are DEC-0085's: strict RFC 3339 with an offset, seconds 00 to 59 (no leap second, which
    `date-time` admits and `strictTime` refuses) and at most three fraction digits, on a day that exists
    (`share-registration#/$defs/instant` and the reference's reader), so every port compares the same instants;
  - the derivation carries a time with at most three fraction digits as written, its offset kept, and one with more at
    millisecond precision: a withdrawal time floored by cutting the fraction, its offset kept (so a year 9999 time at an
    offset is carried too), a window rounded inward (`startsAt` up, written in UTC as `Date#toISOString` writes it when
    it moves; `expiresAt` down; never wider than the grant's); the earliest revocation is chosen at millisecond
    precision after the floor, the first listed among equals, the record's revocations before the applied entries (the
    second and third readings). A start rounded up can
    move to the next UTC day, which only a grant that skipped `FAC-SEM-117` can carry. So a revoked share is withdrawn whatever the precision of its
    `revokedAt` (found by the fix round's unit and seam readings). A time `strictTime` cannot read, a revision below 1, a
    window empty once carried, or a revocation with no readable `revokedAt` registers nothing and reports a third
    degraded code, `share-grant-unreadable`; an `agentRef` that is no agentRef is `share-grant-agents`;
  - the writer's side is the simple one: `FAC-SEM-117` refuses an organization share grant whose window carries more
    than three fraction digits, Fabric writes its revocations' `revokedAt` with at most three, and the hub SHOULD;
  - a receiver keeps one held list per organization: a held entry carries no organization, because the user id and the
    grant id are keys inside the organization whose certificate bound the user; `decideShareRegistration` and
    `joinGrantUsage` are given that organization's list;
  - the join compares days as numbers (midnight UTC in milliseconds), so an end past year 9999 in UTC still compares;
  - the gate's `wrong-organization` and `unassigned-device` are `hold-degraded`: sending to the same enrollment again
    does not clear them, the device must be enrolled or assigned anew;
  - the id an organization server receives holds nothing about the person in a registration and a `grant.usage`; a
    delegation token's grant claim carries the same id only when `FAC-SEM-117` ran before the revision was signed;
  - `previouslyRegistered` is the list of grant ids the node registered active toward the enrollment; a value that is no
    share grant id is ignored; a grant now listed only in another organization counts as no longer listed; a grant
    listed twice is read once, at its first entry; a revoked grant the node never registered still gives a withdrawal,
    which the receiver holds as a tombstone;
  - SR-0 also passes through DEC-0056 step 0's own faults (`clock-unreadable`, `base-url-invalid`) from the transport
    verdict, and answers `context-invalid` for a verdict naming no step's code; the binding is `{transport, org: {id},
    device?, user?: {id}}`, the transport verdict `{ok: true}` or `{ok: false, code}`;
  - SR-2 applies to an object whose `type` is a string other than `share-registration/1`, and its body is DEC-0067's
    `negotiateRevision` answer; any other unreadable body is SR-3 `malformed`;
  - a withdrawal of an active registration keeps its `grantRevision`, `agentRef`, `startsAt` and `expiresAt`, so usage
    before the withdrawal still joins; a tombstone holds no `agentRef`, so it joins nothing (GJ-3 `unregistered`); a
    receipt's `digest` is the digest of the registration held after the request (for a second, earlier withdrawal, that
    one's);
  - the join has a row GJ-0 before GJ-1: the receiver's own context unusable is `{fault: "context-invalid"}`, and an
    event without a day that exists, a share grant id and an organization's context is rejected `schema`, the answer a
    schema-validating receiver gave before;
  - `FAC-SEM-117`'s record kind counts the placements in the grant's own context, as the derivation does; a placement in
    another context naming the grant is `FAC-SEM-111`'s; on kind `grant` it reads any `context` starting `org:`;
  - `FAC-SEM-045`'s new clause refuses every `grant.usage` when the certificate's binding has no string `org.id`;
  - the fixture `activity-batch-grant-usage-twice-spelled.json` became a test in `test/contexts.test.ts`: a share grant
    id admits only its normal form, so its second spelling is no longer schema-valid, and `FAC-SEM-039` keeps its verdict
    on it;
  - a node sends nothing again that the receiver refused with a typed SR-2 to SR-9 refusal until the record changes,
    and reports the grant degraded meanwhile; after no answer, a 401 or a receiver's fault it sends again with backoff
    (share-registration.md, derivation; the gate reads the same split, the second reading's product tier).
- **Why:** the organization server needs the agent behind each share grant to bill and show usage per agent, and may not
  read the person's estate record, where a grant meets its placement. Only the enrolled node holds a certificate the
  server attributes and registers only what a passkey signed, so the registration is authentic, scoped to the member who
  shared, and withdrawn by the same record and delta that end the share. A random share grant id keeps the person's name,
  address and estate id from the organization. The context on `grant.usage` adds a check against the certificate and
  leaks nothing the receiver does not know.
- **Alternatives refused:** `proposal.submit` (an approval lifecycle, no device attribution, no withdrawal by
  revocation); `agentRef` on `grant.usage` (unverifiable per event, no record before first use, no withdrawal or
  expiry); `agentRef` on the grant (a closed schema every meter would repin, while a placement already binds it); a
  passkey statement or `share-grant/1` (they carry `estate`); the server reading the estate record or Fabric calling it
  under an SSO session (excluded by the request; no device proof).
- **Compatibility:** additive except `grantUsage`: a DEC-0086 collector's event is refused as `schema` by a receiver
  pinned at DEC-0082, which the sender gate prevents; a DEC-0082 collector's event is refused by a DEC-0086 receiver, so
  collectors implement `grant.usage` at DEC-0086 directly. Checked on the board before merge: no collector emits
  `grant.usage` (CT-51), the first organization server's per-agent part waits on this decision (thread `b68f4399`), and
  no signed revision holds an `org:` share grant. The contract's fixtures moved to the new id form and gained `context`,
  each keeping its verdict. `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/share-registration.md` (new), `docs/specification/contexts.md`,
    `docs/specification/activity.md`, `docs/specification/devices.md` (transport, attribution, `FAC-SEM-045`),
    `docs/specification/identifiers.md`, `docs/specification/estate-record.md`, `docs/specification/conformance.md`
    (the collector, `grant.usage` receiver and activity-batch receiver rows; the node, receiver and signer rows; the
    canonical form; `FAC-SEM-117`, `FAC-SEM-118`; next free `FAC-SEM-119`);
  - schemas: `schemas/share-registration.schema.json` (new), `schemas/common.schema.json` (`orgContextId`,
    `shareGrantId`), `schemas/telemetry-event.schema.json` (`grantUsage`);
  - code: `src/share-registration.ts` (new), `src/context-rules.ts`, `src/device-rules.ts`, `src/semantic-rules.ts`,
    `src/protocol-revisions.ts`; `tools/vectors/share-registration.ts` (new);
  - fixtures: `fixtures/vectors/share-registration.json` (new); `fixtures/positive/share-registration-*`,
    `fixtures/negative/share-registration-*`, `fixtures/negative/telemetry-event-grant-usage-no-context.json` and
    `-personal-context.json`, `fixtures/semantic/share-*`, `fixtures/semantic/grant-usage-join-*`,
    `fixtures/semantic/device-attribution-grant-usage-*` (new); 45 existing fixtures migrated;
    the negative fixture `telemetry-event-grant-usage-long-id` removed (the share grant id's pattern admits no long id,
    so it tested nothing of its own); `fixtures/catalogue.json`;
  - tests: `test/share-registration.test.ts` (new), `test/contexts.test.ts`, `test/positive-sweep.test.ts`,
    `test/rule-tolerance.test.ts`, `test/schema-compilation.test.ts`, `test/protocol-revisions.test.ts`; the floor for `src/share-registration.ts` in
    `vitest.config.ts` and `docs/evidence/specs/2026-10-11-board-waves/coverage-baseline.md`;
  - docs: `CONTEXT.md`, `README.md`, `docs/DOCMAP.md`, `docs/backlog.md` (CT-56),
    `docs/evidence/specs/2026-10-18-share-registration/brief.md` and `plants.md`,
    `docs/handoffs/2026-10-18-share-registration.md`, `docs/handoffs/README.md`.
- **Not decided here:** the access level shown to the organization; refusing an `agentRef` absent from the
  entitlement's `agents` (DEC-0085, the receiver's policy); private-agent marks on sharing; a local-channel method for
  Fabric to read registration state; how long a node keeps unsent sums; registrations from unassigned devices (refused
  for now); refusing a dropped but unrevoked share grant (an extension of `FAC-SEM-114`); carried from DEC-0082:
  corrections of an emitted day, two collectors of one device, mapping `audience` to `agentRef`, CX-CON-06; a signature
  on the receipt.
- **Source:** the first organization server's VES-GRANT-CONTEXT (thread `cc944654`, 2026-10-17) and its message of
  2026-10-18 on thread `b68f4399`; DEC-0030, DEC-0031, DEC-0052, DEC-0056, DEC-0063, DEC-0067, DEC-0072, DEC-0076,
  DEC-0082, DEC-0085; the brief `docs/evidence/specs/2026-10-18-share-registration/brief.md`. DEC-0086, `FAC-SEM-117`
  and `FAC-SEM-118` were reserved by git CAS (`agent_sync.py reserve`, keys `ves-grant-context-20261017`,
  `ct56-share-grant-id`, `ct56-share-registration`); the record plane is `fs`. The registers are edited under this run's
  leases on `docs/DECISIONS.md`, `docs/specification/conformance.md` and `docs/backlog.md`.

### DEC-0087: Jobs under limits and uncertain effects: `quota-exhausted`, a pause grammar, `outcome-unknown`, the caller's act, the intent's key, the answer to a repeated key, and unknown as `null` in `usage` under `fabric-interop/0.2` (`FAC-SEM-119`, `FAC-SEM-120`)

- **Date:** 2026-10-19
- **Status:** Accepted source change (on merge of its pull request). Resolves OQ-0012. Consumer adoption: board row CT-55.
- **Decision:** in [interop → limits and uncertain effects](specification/interop.md#limits-and-uncertain-effects):
  1. **`quota-exhausted`:** a job a limit (a provider's quota, a subscription's window) stopped and its provider will
     not resume ends `failed` with `error: {code: "quota-exhausted", message, data: {retryable, resetsAt?}}`; `data`
     closed, `retryable` required (`true`: the same intent may run once the limit resets; `false`: a person must act),
     `resetsAt` an RFC 3339 UTC instant with at most three fraction digits, only with `retryable: true`
     (`interop-common#/$defs/quotaExhaustedData`, `#/$defs/utcInstant`). The schema constrains `data` only for this
     code. A spend window of a grant or the meter stays `limit-reached` (DL-19) with its approval request.
  2. **A paused job:** a provider that resumes the same job keeps it `working` with `statusMessage` `quota-exhausted` or
     `quota-exhausted until <UTC instant>`, optionally followed by a colon, a space and a text that is not only white
     space (ASCII: space, tab, line feed, carriage return), at most 500 code points; `pollIntervalMs` SHOULD reach the
     reset. `readJobPause`. No member and no status
     are added.
  3. **`outcome-unknown`:** a job whose effect may have happened and is not observed ends `failed` with
     `error: {code: "outcome-unknown", message, data?}`; only an observed result settles it.
  4. **The caller's act** `jobCallerAction(answer, now)`, total: `poll`, `wait` (`notBefore`), `answer`, `done`,
     `cancelled`, `resend` under the same key (`quota-exhausted` retryable, `notBefore` its reset when later than
     `now`), `person` (`quota-exhausted` not retryable, `limit-reached`), `reconcile` (`outcome-unknown`), `failed`
     (another code), `invalid` (on which a caller sends nothing new, keeps polling a `working` job and reports any other
     answer as malformed). Never
     "submit anew": after `outcome-unknown` nothing goes under a new key until the caller observed that the effect did
     not happen.
  5. **The intent's key** `intentIdempotencyKey({agentId, capability, input, request?})`: a UUID of version 8 (RFC 9562
     §5.5, §5.8) from the first 16 bytes of the SHA-256 of the intent's RFC 8785 form; `request` names the principal's
     request when one principal asks twice on purpose; never a clock or a random value.
  6. **A repeated key:** a provider keeps keys per authenticated caller; a key whose job ended `quota-exhausted` admits
     the intent again, once, when the limit no longer holds; a key whose job ended `outcome-unknown` is answered with
     that job and never runs again; a key whose job ended `limit-reached` admits the intent again, once, when its approval
     is granted; any other ended key is answered with its job.
  7. **Unknown is `null`:** `common#/$defs/usage`'s counts, `costUsd` and `wallMs` admit `null` for unknown, never 0
     toward a caller of `fabric-interop/0.2` (item 8);
     `partial: true` says a number is a lower bound or unknown, SHOULD stand beside a `null` and is never `false` there.
  8. **The revision `fabric-interop/0.2`:** its readers accept `null` and `partial`; a caller names the revisions it
     reads in `_meta.protocols` (DEC-0067's list); a provider writes `null` or `partial` only toward a caller that names
     `fabric-interop/0.2` (`readsNullUsage`), and toward any other the lower bound it measured, as before, with nothing
     in `notVerified`.
  9. **Rules:** `FAC-SEM-119` (kinds `interop-job`, `usage`, `result`): the pause grammar with a UTC instant on a day
     that exists, `quota-exhausted`'s `resetsAt` on a day that exists, no `partial: false` beside a `null`;
     `FAC-SEM-120` (kind `job-caller`): a caller's act equals `jobCallerAction`'s.
- **Choices made in implementation** (OQ-0012 left them open):
  - the pause is carried by the `statusMessage` grammar, because `interop-job` is closed and its states are MCP Task
    states; `degraded` stays health;
  - `data` of `outcome-unknown` stays open: what a provider can say about an unobserved effect varies, and Fabric's
    hub already sends `{mayHaveRun}`;
  - instants carry at most three fraction digits (DEC-0085's rule), so every port compares the same instants; lengths
    count code points, as JSON Schema's `maxLength` does; a reset equal to `now` is reached (`poll`, `resend` without
    `notBefore`);
  - `jobCallerAction` answers `invalid`, never a guess, for an `error` the schema refuses and for `quota-exhausted`
    data the schema refuses, and reads own members only;
  - the key is a UUID so it fits `agent.call`'s `idempotencyKey` (1 to 256 characters) and capabilities that require a
    UUID key; the principal is not in the intent, because a provider scopes keys by the authenticated caller;
  - the gate is a revision a caller names, not a pin a provider cannot see; the interim writes the measured lower
    bound, unmarked, rather than a `notVerified` entry, which would turn every such job from `succeeded` into `partial`
    (`FAC-SEM-001`): usage was non-authoritative before and stays so;
  - "coverage" in OQ-0012's C3 is `partial` beside `null`, and `notVerified` for a claim (DEC-0064's `FAC-SEM-001`).
- **Why:** the 2026-10-17 retrospective found callers that read a limit as a plain failure and resubmitted, paying
  twice, and callers that resent an uncertain write under a new key, booking it twice; and unknown numbers written as 0
  read as measured zeros.
- **Alternatives refused:** a job status `paused` (breaks every reader of the MCP Task states); a new job member (the
  job is closed); `degraded` as a job state; a random or clock-derived key (a resend after a restart pays twice); 0 for
  unknown (DEC-0021); a gate by pin (a provider answering `fabric.job.get` cannot see its caller's pin); `quota-exhausted`
  for a spend window (it would lose DL-19's approval request).
- **Compatibility:** additive for `error.data` (only `quota-exhausted`, which no provider sent before; Fabric's hub
  already sends `outcome-unknown` with open `data`, which stays valid). `_meta.protocols` is a new optional member of an
  open object. `usage` is closed and its numbers were integers: a reader of `fabric-interop/0.1` refuses `null` and
  `partial`, which is why they go only to a caller that names `fabric-interop/0.2`. `fabric-interop` gains `0.2` in the
  register (`src/protocol-revisions.ts`, named only, as `0.1` is). `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/interop.md` (the section, the rule table), `docs/specification/results-and-evidence.md`
    (`usage`), `docs/specification/service.md` (a usage report's tokens), `docs/specification/versioning.md` (the
    named revisions), `docs/specification/conformance.md` (the serving, calling and reading rows; `FAC-SEM-119`,
    `FAC-SEM-120`; next free `FAC-SEM-121`);
  - schemas: `schemas/interop-common.schema.json` (`error`, `quotaExhaustedData`, `utcInstant`),
    `schemas/common.schema.json` (`usage`), `schemas/interop-request-meta.schema.json` (`protocols`);
  - code: `src/job-limits.ts` (new), `src/semantic-rules.ts`, `src/protocol-revisions.ts`; `tools/vectors/job-limits.ts`
    (new);
  - fixtures: `fixtures/vectors/job-limits.json` (new), `fixtures/semantic/job-limits-*` (new), `fixtures/catalogue.json`;
  - tests: `test/job-limits.test.ts` (new), `test/positive-sweep.test.ts`, `test/rule-tolerance.test.ts`; the floor for
    `src/job-limits.ts` in `vitest.config.ts` and `docs/evidence/specs/2026-10-11-board-waves/coverage-baseline.md`;
  - docs: `CONTEXT.md`, `README.md`, `docs/DOCMAP.md`, `docs/OPEN_QUESTIONS.md` (OQ-0012), `docs/backlog.md` (CT-55),
    `docs/evidence/sources.md` (RFC 9562), `docs/ux/scenarios.md` and `docs/ux/screens.md` (SCN-031),
    `docs/evidence/specs/2026-10-19-job-limits/brief.md` and `plants.md`, `docs/handoffs/2026-10-19-job-limits.md`,
    `docs/handoffs/README.md`.
- **Not decided here:** whether `cancelled` asserts that no effect happened; a machine-readable scope of a limit; the
  two codes and the pause on the MCP Task route; C4 (a 4xx at submit against a 4xx while polling), adapter guidance
  (fabric-agent-adapter PR #122).
- **Source:** OQ-0012 and its ruling in principle of 2026-10-17 (an agent retrospective of 18 agents, a private report);
  DEC-0017, DEC-0021, DEC-0022, DEC-0064, DEC-0067, DEC-0085; DL-19; RFC 9562; Fabric's hub `outcome-unknown` on
  `agent.call` (fabric `apps/desktop/src/main/hubCall.ts` at `df9edcc6`). Three blind readings of the first cut
  (unit, seam, product) led to items 6 and 8 and the choices on instants, lengths, the gate and the interim. DEC-0087,
  `FAC-SEM-119` and `FAC-SEM-120` were reserved by git CAS (`agent_sync.py reserve`, keys `ct55-job-limits`,
  `ct55-job-documents`, `ct55-job-caller`); the record plane is `fs`.

### DEC-0088: `enterprise-cloud`, a third hosting product in `entitlement/1`, for an organization only (amends DEC-0085)

- **Date:** 2026-10-19
- **Status:** Accepted source change (on merge of its pull request). Amends DEC-0085 item 3. Consumer
  adoption: board row CT-59.
- **Decision:** in [entitlement → enterprise cloud](specification/entitlement.md#enterprise-cloud-dec-0088):
  1. `hosting.product` admits `enterprise-cloud` beside `org-cloud` and `personal-cloud`
     (`entitlement.schema.json`, `HOSTING_PRODUCTS`); an `org:<orgId>` subject carries `org-cloud` or `enterprise-cloud`
     (`ORG_HOSTING_PRODUCTS`), `personal` only `personal-cloud`; anything else is `malformed` (EN-2) and
     `FAC-SEM-115`'s.
  2. `size` stays opaque; no other field is added: the dedication is the product; a service level (SLA) and a region
     are the order's until a verifier must check them, and `support.tier` keeps its DEC-0085 meaning (what the
     organization's admin agents may do), so no service level is written there.
  3. The issuer sends `enterprise-cloud` only to a verifier whose owner confirmed on the board that it re-vendored at
     or after DEC-0088.
- **Why:** the operator's SD-2 (2026-10-19) makes Enterprise a tier paid as its own dedicated cloud, and the platform
  (ADR-0008 D-3, PLAT-063) cannot issue it while the reference verifier refuses a third product.
- **Alternatives refused:** `org-cloud` with an Enterprise `size` (the verifier could not tell a dedicated cloud from a
  shared one); a region, an SLA or a `dedicated` flag now (no verifier checks them); the SLA in `support.tier` (that
  line sets what admin agents may do, found by this decision's reading).
- **Compatibility:** a verifier pinned at DEC-0085 refuses `enterprise-cloud` as `malformed`, so the issuer sends it
  only to verifiers at or after DEC-0088 and issues Enterprise on `org-cloud` until then. Every DEC-0085 document keeps
  its verdict. `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/entitlement.md` (the field table, EN-2, `FAC-SEM-115`, the section, the issuer's duties,
    *Not decided here*), `docs/specification/conformance.md` (the issuer row);
  - schemas: `schemas/entitlement.schema.json` (the `enum` and the organization's condition);
  - code: `src/entitlement.ts` (`HOSTING_PRODUCTS`, `ORG_HOSTING_PRODUCTS`); `tools/vectors/entitlement.ts`;
  - fixtures: `fixtures/vectors/entitlement.json`, `fixtures/positive/entitlement-enterprise-cloud.json`,
    `fixtures/negative/entitlement-unknown-hosting-product.json`,
    `fixtures/semantic/entitlement-personal-enterprise-cloud.json`, `fixtures/catalogue.json`;
  - tests: `test/entitlement.test.ts`;
  - docs: `docs/backlog.md` (CT-59), `docs/evidence/retro.md`, `docs/handoffs/2026-10-19-enterprise-cloud.md`,
    `docs/handoffs/README.md`.
- **Not decided here:** a region or data-residency line, and a service level.
- **Source:** passioncode-platform's request on the project board (thread `c7d8f53d`, 2026-10-19) under the operator's
  SD-2 and its ADR-0008 D-3; DEC-0085. DEC-0088 was reserved by git CAS (`agent_sync.py reserve`, key
  `ct59-enterprise-cloud`).

### DEC-0089: Folder attribution: one rule set, with vectors, for which Project a coding agent's folder belongs to (`FAC-SEM-121`)

- **Date:** 2026-10-19
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: board row CT-57.
- **Annotated (2026-10-20):** merged as #124 `ebfddce`. Item 3's "unless a Project folder is in its repository" means
  a Project folder of the repository that lies inside that checkout (the AT-5 row's "lies in it"; for a worktree,
  one anywhere). The adoption gaps the readings found are board row CT-66. Its *Not decided here* on the
  session-start capability's input and answer is decided by DEC-0092: `fabric.project.resolve`, input `{path}`,
  answer `resolveAnswer`, `pending` while the Git facts cannot be read.
- **Decision:** in [folder attribution](specification/folder-attribution.md):
  1. **The function** `attributeFolder(snapshot)`, total, over a snapshot a product gathers (`folder`, `home`,
     `tempRoots`, `git` or `null`, `projects` with each folder's `commonDir`, `origin` and `toplevel`, `work?`,
     `tombstones?`, `containers?`, `explicit?`; `folder-attribution.schema.json`), answering `attached` (with its rule),
     `new` (with its root), `refused` (with its reason), `ambiguous` (with the Projects) or `{fault: "input-invalid"}`,
     in the order AT-0 to AT-15: a fault; an explicit attach; a tombstone on the folder refused unless a Project lists a
     folder, not broad, below it that holds the folder; the folder's Project by the nearest place (by common dir or by
     identity, the same common dir at equal depth) when a folder of its own repository holds it, else its nearest
     listed folder by path, a declared container between them ending a listed folder's reach; a temporary folder or root refused; a broad folder or root refused; the same Git common
     dir or the main checkout, or the same repository identity, at the nearest place in the repository (the same common
     dir at equal depth, as AT-3 weighs them); the
     Project the main checkout lies in; a repository whose Projects all sit deeper refused; the origin's owner a
     Project lists; a tool's folder refused; a work record (by common dir or by identity); a tombstoned root refused; a
     root holding another Project's folder refused; else a new Project at the main checkout, or at the folder without
     Git. A tie at one row is `ambiguous` and attributes nothing. A branch decides nothing.
  2. **The repository identity** `normalizeOrigin`: `host/path` with `A` to `Z` lower-cased, from `http`, `https`, `ssh`, `git`,
     `git+ssh`, `git+https` URLs or the scp form, trimmed; credentials, port, query, fragment, the outer `/` and then
     one `.git` dropped; a host of ASCII letters, digits, `.` and `-` with a dot, and at least two non-empty path
     segments. The owner is every segment but the last.
  3. **Containers.** A *broad* folder (a filesystem or drive root, home, an ancestor of home, or a container a person
     declared) is never a Project, never listed (AT-2 to AT-9 skip it) and never attached by any row but an explicit
     attach; a declared container inside a Project's folder ends that folder's reach (AT-3), so it is refused and what
     it holds goes by its own rows; a folder right under home is a container unless a Project lists it, for a worktree as for a clone, and so
     is a root there unless a Project folder is in its repository;
     a repository whose Project folders all sit deeper than the folder's place is a container of them (AT-9); a root
     that holds another Project's folder is never made a Project (AT-14). Under a temporary or cache root only the
     folder or its nearest listed ancestor (AT-3) joins; a tool's folder (a hidden folder directly in home, `Library`,
     `AppData`) joins by AT-3, or a known repository by AT-6 to AT-10, never by work and never as a new Project.
  4. **Recording.** `explainFolder(snapshot)` answers `{answer, row, record}`; the product adds `record` to the Project
     and nothing else: after AT-6 or AT-7 the matched Project folder's place in this checkout, after AT-8, owner or work
     the checkout's top level, after `new` the root (its own top level, none for a bare repository), after `folder`
     nothing, after an explicit attach the folder (nothing for a broad one), removing a tombstone at the folder only
     (folder-attribution.md, *Recording the answer*; the vectors' `record` cases). The record's `origin` is the remote
     without what can carry a credential (`recordOrigin`): no product's store holds a token from a remote URL.
  5. **The rule** `FAC-SEM-121` (kind `folder-attribution`, `{snapshot, answer}`): an implementation's answer equals
     `attributeFolder`'s.
- **Choices made in implementation** (the run's D2 left them open):
  - paths compare segment by segment and as written, a drive letter upper case; the product resolves the real path
    (links, case) first; Project ids compare as written (each product's own keys; identifiers.md);
  - a tombstone covers its folder and its subfolders and is scoped to them: it refuses the folder (AT-2) and a new
    Project at a tombstoned root (AT-13), but not a worktree or clone of a repository another Project keeps, nor a
    folder a Project lists below it (so an explicit attach below a removed parent lasts and its siblings stay out);
  - a folder a Project lists is attached before the temporary refusal, so a Project kept under a temporary root keeps
    working (D2's "already belongs" first, as Switchboard does); nothing else joins there;
  - broad folders are refused before every Git row, so home as a clone or as a worktree is not attached; Fabric and
    Switchboard refuse a broad folder they would create but not by worktree today, so both owe it; a folder right under
    home a Project lists is that Project's (Switchboard offers its worktrees);
  - a worktree or clone is the same tree: AT-6 and AT-7 match a Project folder by its place below its Git top level,
    the nearest place first, and AT-3 decides by the same place when a folder of the folder's own repository holds it,
    by common dir or by identity, the same common dir at equal depth, so a recorded worktree or clone never takes a
    nested Project's place; else a worktree goes where its main checkout goes
    (AT-8); else a
    repository whose Projects all sit deeper is refused, so no second Project is made for one repository (AT-9); a
    nested folder given without its top level counts at the top and ties;
  - the repository identity folds case for the whole path (GitHub, GitLab and Bitbucket route a path regardless of it;
    only Switchboard folded, owner and name) and keeps group paths (Fabric did); it is not DEC-0076's normal form,
    which compares URIs; on a case-sensitive server two repositories differing only in case read as one, accepted; only
    `A` to `Z` fold, so every port agrees on a non-ASCII path;
  - a tool's folder is refused after the owner row, so it joins a known repository but never by work and never as a new
    Project, as Switchboard's SB-131;
  - a work record carries the common dir and, when it has one, the raw origin, so a second clone joins by work; one
    naming a Project the snapshot does not hold matches nothing;
  - the main checkout is the first entry of `git worktree list --porcelain` (the common dir for a bare repository); a
    Git probe that fails is not `git: null`, and a folder whose top level is broad (home kept under Git) is passed as
    `git: null`;
  - `ambiguous` lists the Projects in the order of `projects`;
  - the results of D2's order against the operator's literal words (a worktree or a branch goes to the existing
    Project, a new folder makes a new one) are recorded for the operator to correct on the board, stated by the rows
    that keep the words (folder-attribution.md, *What follows from D2*): a worktree or clone of a known repository
    joins its Project when AT-6, AT-7 or AT-8 attaches it to one Project, or AT-3 does by its place in that
    repository, a new folder makes a Project exactly when AT-15 does, and whenever a row other than AT-0 or AT-1 decides
    first or a row ties the answer departs (AT-0 is a fault and AT-1 an explicit choice, neither a departure);
  - no user-facing scenario: the contract defines no interface here, and each product's scenarios own how a session's
    Project, a tie or a refusal is shown.
- **Why:** the operator (2026-10-19) asked that every folder a coding agent works in be attributed alike across
  Fabric, Switchboard and Observatory; measured that day, the three disagreed on four cases (org-index run index).
- **Alternatives refused:** each product keeping its rules with a shared description (they drifted once already); the
  branch as a signal (a branch is the same repository); the file system read by the reference (vectors could not then be
  shared).
- **Compatibility:** new; it refuses no document. Each product's own answers change where its rules differed.
  `contractVersion` stays `0.1.0`.
- **Consequences / affects:**
  - spec: `docs/specification/folder-attribution.md` (new), `docs/specification/identifiers.md` (the repository identity is
    not DEC-0076's form), `docs/specification/conformance.md` (the attributing product's row; `FAC-SEM-121`; next free
    `FAC-SEM-122`);
  - schemas: `schemas/folder-attribution.schema.json` (new);
  - code: `src/folder-attribution.ts` (new), `src/semantic-rules.ts`; `tools/vectors/folder-attribution.ts` (new);
  - fixtures: `fixtures/vectors/folder-attribution.json` (new), `fixtures/positive/folder-attribution-snapshot.json`,
    `fixtures/negative/folder-attribution-relative-folder.json`, `fixtures/semantic/folder-attribution-*`,
    `fixtures/catalogue.json`;
  - tests: `test/folder-attribution.test.ts` (new), `test/schema-compilation.test.ts`, `test/positive-sweep.test.ts`;
    the floor for `src/folder-attribution.ts` in `vitest.config.ts` and
    `docs/evidence/specs/2026-10-11-board-waves/coverage-baseline.md`;
  - docs: `CONTEXT.md`, `README.md`, `docs/DOCMAP.md`, `docs/backlog.md` (CT-57),
    `docs/handoffs/2026-10-19-folder-attribution.md`, `docs/handoffs/README.md`.
- **Not decided here:** how Fabric records an alias, the wire of the session-start capability, storage (D5); how a
  product learns its work records. The operator corrected D3 and D4 later the same day (Fabric ADR-0166, amendment
  "Fabric is the core"; board thread `617c8cbe`): the canonical Project id is Fabric's, Observatory's `project:<slug>`
  and Switchboard's pool are its aliases (`observatory:<slug>`, `switchboard:<pool>`; since Switchboard's SB-146 a pool
  is a group that may hold several Projects, so how it is recorded is D3's), and the session-start
  capability is Fabric's, served by its hub (`fabric.project.resolve`, Fabric's message on the board); Observatory and
  Switchboard ask it, and apply these rules locally only while Fabric is not running (the board message `c95b4a22`;
  the ADR's amendment states only the asking).
- **Source:** Fabric's ask D1 on the project board (thread `617c8cbe`, 2026-10-19) and the run index org-index
  `docs/runs/2026-10-19-unified-attribution/README.md` at `5fb77fe` (D1 to D5, the measured table); Fabric
  `folderResolver.ts` `normalizeRemoteKey` and Switchboard `suggest.rs` `normalize`, `transient`, `tool_folder`;
  DEC-0076. DEC-0089 and `FAC-SEM-121` were reserved by git CAS (`agent_sync.py reserve`, key
  `ct57-folder-attribution`).

### DEC-0091: A usage report counts the calls whose tokens are unknown (`unmeasuredCalls`)

- **Date:** 2026-10-20
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: board row CT-62.
- **Decision:** in [service](specification/service.md) and `service-usage.schema.json`:
  1. A day's totals and each of its model rows MAY carry `unmeasuredCalls`: every call whose token count the service
     did not measure in full, whatever it wrote to its caller: a `null` to a fabric-interop/0.2 reader (DEC-0087), the
     measured lower bound to a 0.1 reader, a number beside `partial: true`, or a call made outside a job. Absent is 0.
  2. A host MUST show the day's tokens as a lower bound while `unmeasuredCalls` is above 0, as it shows a cost beside
     `unpricedCalls`.
  3. `FAC-SEM-025` keeps it within the calls (a row's and the day's) and holds the day's to the sum of its rows'.
- **Why:** service.md already promised that a host shows such a day's tokens as a lower bound, but the report gave
  it no signal; Fabric Dashboards found it on DEC-0087 (board thread `16e6c000`, 2026-10-19).
- **Alternatives refused:** a boolean "partial" flag (it says nothing of how much is unknown); reusing
  `unpricedCalls` (a call can be priced and still have no token count).
- **Compatibility:** additive; a report without `unmeasuredCalls` reads as before. `contractVersion` stays `0.1.0`.
  The day and model objects are closed, so a host that validates reports against a copy of the schema pinned before
  DEC-0091 rejects a report that carries the field until it adopts this decision; a host that ignores unknown members,
  as Fabric Dashboards and the adapter's checker do, reads it as before.
- **Consequences / affects:** schema `schemas/service-usage.schema.json` (`$defs/totals`); code `src/usage-rules.ts`;
  fixture `fixtures/positive/service-usage-unmeasured.json` and `fixtures/catalogue.json`; tests
  `test/usage-rules.test.ts`; docs `docs/specification/service.md`, `docs/backlog.md` (CT-62),
  `docs/handoffs/2026-10-20-unmeasured-calls.md`.
- **Source:** the board message `3ba380ab` (Fabric Dashboards, thread `16e6c000`); DEC-0091 reserved by git CAS (key
  `ct62-unmeasured-calls`).

### DEC-0092: `fabric.project.resolve` answers `pending` while a folder's Git facts cannot be read

- **Date:** 2026-10-20
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: board row CT-63.
- **Decision:** in [folder attribution](specification/folder-attribution.md#the-session-start-capability):
  1. Fabric's hub serves the session-start capability `fabric.project.resolve` (D4 as the operator corrected it):
     read-only (a call records nothing, at the hub or the caller), input `{path}`, answer `folder-attribution.schema.json#/$defs/resolveAnswer`.
  2. `resolveAnswer` is `attributeFolder`'s answer, or `{outcome: "pending", reason: "git-unreadable", retryable:
     true}` when the folder's Git facts cannot be read yet (a probe that failed or timed out, which is not "no Git").
  3. `pending` names no Project and is never recorded; the caller asks again later, with backoff, attributes nothing
     until then and shows a lasting pending as degraded. The answer carries no `record` or `row`; carrying them later
     is a new decision with a wrapper around `resolveAnswer`, never new members of it.
- **Why:** the page as merged in `ebfddce` left "not attributable yet" to the capability (its *Not decided here*),
  and Fabric asked for a name to build against
  (board thread `617c8cbe`, 2026-10-19); the spelling is the one Fabric accepted.
- **Alternatives refused:** a refusal reason (`refused` means the folder is never attributed, `pending` that it is
  not yet); `ambiguous` (it names Projects).
- **Compatibility:** additive: a new `$defs` pair and a third alternative at the schema's root.
- **Consequences / affects:** schema `schemas/folder-attribution.schema.json` (`$defs/pending`, `$defs/resolveAnswer`);
  tests `test/folder-attribution.test.ts`; docs `docs/specification/folder-attribution.md` (the session-start
  capability), `docs/specification/conformance.md` (the hub's row and the attributing product's row), `docs/DOCMAP.md`, `CONTEXT.md`, `docs/backlog.md`
  (CT-63, CT-64, CT-66), `docs/handoffs/2026-10-20-resolve-pending.md` and its row in `docs/handoffs/README.md`, the
  annotation on `docs/handoffs/2026-10-19-folder-attribution.md`; DEC-0089's annotation.
- **Source:** the board thread `617c8cbe` (Fabric's acceptance of the shape, 2026-10-19); DEC-0092 reserved by git CAS
  (key `ct63-resolve-pending`).

### DEC-0093: The coding-agent catalogue is the contract's data: one list of coding agents for every product

- **Date:** 2026-10-20
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: board row CT-60.
- **Decision:** in [runners](specification/runners.md#the-coding-agent-catalogue-dec-0093):
  1. `catalogue/coding-agents.json`, valid against `coding-agents.schema.json` (`coding-agents/1`), lists the coding
     agents every product reads; machine state (installed, enabled, default, accounts, keys) stays with each product.
  2. An entry's `id` is the runner kind where the runners page's C2 lists one (DEC-0016, extended by DEC-0029 and
     DEC-0046), else a new name, which is the kind a host uses if it later catalogues the agent as a runner; `aliases` keep the names a
     product used before (Switchboard's `cursor-cli`, `kiro-cli`); a removed id is `retired`, never reused.
  3. A permission-skipping argument or variable is recorded only with its evidence: the maker's documentation
     (`source`) or the agent's own output (`measured`: the command, the version, the date). Without it there is no
     `permissions`.
  4. Environment members are variable names, never values, except `permissions.skip.env`'s values, which are single
     words (such as `yes`); `skip` is exactly one of `argv` or `env`; no member holds a credential.
- **Why:** the operator wants one list of coding agents for every product (Fabric's walk, OF-11, thread `617c8cbe`,
  message `f63e1f06`); DEC-0016 (C2) made only the runner entry's shape the contract's. Fabric Switchboard agreed to read the
  contract's list and asked for the optional OpenRouter and proxy recipes (`41e010ab`, `ea29f0a8`).
- **Alternatives refused:** each host keeping its own list (two lists drift: Switchboard's and Fabric's already named
  two agents differently); a permission argument from memory or a third party's list (an argument that skips approval
  is recorded only from the maker or the agent itself).
- **Compatibility:** additive: a new schema and a new data file. `contractVersion` stays `0.1.0`.
- **Consequences / affects:** schema `schemas/coding-agents.schema.json`, revision `coding-agents/1` in
  `src/protocol-revisions.ts`; data `catalogue/coding-agents.json`, written by `tools/catalogue/seed.py` from
  `tools/catalogue/permissions.json`; tests `test/coding-agents.test.ts`, `test/schema-compilation.test.ts`; docs
  `docs/specification/runners.md`, `conformance.md` (the reader's row), `adoption.md` (vendoring the data file),
  `docs/evidence/sources.md`, `docs/DOCMAP.md`, `README.md`, `CONTEXT.md`, `docs/backlog.md` (CT-60),
  `docs/handoffs/2026-10-20-coding-agent-catalogue.md`; brief `docs/evidence/specs/2026-10-19-runner-catalogue/brief.md`.
- **Source:** board thread `617c8cbe` (messages `f63e1f06`, `6ffee284`, `41e010ab`, `ea29f0a8`); DEC-0093 reserved by
  git CAS (key `ct60-runner-catalogue`, counter commit `fb6a608`).

### DEC-0094: A device key MAY live in a file, rotation is idempotent, and a check-in response MAY list `protocols` (`FAC-SEM-125`)

- **Date:** 2026-10-20
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: board row CT-65.
- **Annotated (2026-10-21):** the counter commit its Source cites (`4c4598f`) is no longer on origin's SEM chain: the
  2026-10-21 reservation force-updated the ref (`4c4598f...b52fc3d`), the receipt-chain defect CT-44 records.
- **Decision:** in [devices](specification/devices.md#enrollment):
  1. `key.storage` admits `file`: an owner-only PKCS#8 file. A file-held key is `exportable: true`, and every other
     store `exportable: false`; the schema ties the two, so a verifier always knows whether the key can be copied, and a
     file key carries no `attestation`. The `deviceKeys` (`#sig`, `#kem`) live in the store `key.storage` names. A
     server MAY refuse a file-held key by policy with its own error (the contract defines no code); a node so refused
     never retries claiming a store it lacks. How the file is protected is the node's.
  2. Rotation is idempotent: a rotation request whose CSR key (`publicKeySha256`) and current certificate serial equal
     one the server already answered gets that answer's certificate again, byte for byte, and the old certificate stays
     valid until the new serial is first presented, at most until its own expiry. Rule `FAC-SEM-125`
     (`device-rotation`).
  3. A `check-in-response` MAY carry `protocols` (DEC-0067's list), so a node learns the server's revisions at check-in;
     the latest list the node received, from its enrollment or a check-in response, is the server's current one. The
     response is closed, so a server sends it only to a node pinned at or after DEC-0094 or one that ignores unknown
     members; `fabric-device/0.1` carries no in-band sign of the pin (a revision that does is board row CT-67).
- **Why:** Project Observatory's node runs on machines with no hardware or platform key store and asked for a file key
  and a rotation whose lost response costs a repeat rather than a new enrollment (board, 2026-10-19, due 2026-10-23).
  `exportable: const false` made such a node unable to enroll at all, or forced it to claim a store it does not have.
- **Alternatives refused:** a file key with `exportable: false` (a false statement a verifier would trust); a new
  enrollment after a lost rotation response (it moves the stream epoch and drops the user binding's history); a
  rotation answered with a fresh certificate each time (two valid certificates for one key and serial).
- **Compatibility:** additive in the enrollment: the enum grows, and a hardware-held key still reads `exportable:
  false`; a server pinned before DEC-0094 refuses `file` at its schema. Not additive for a node pinned before DEC-0094
  that validates the closed check-in response: it refuses one carrying `protocols`, hence item 3's send condition.
- **Consequences / affects:** schemas `schemas/device-enrollment.schema.json`, `schemas/device-check-in.schema.json`;
  rule `src/device-rules.ts` (`rotation`); tests `test/device-rules.test.ts`; fixtures
  `fixtures/semantic/device-rotation-*`, `fixtures/positive/device-enrollment-request-file-key.json`,
  `fixtures/negative/device-enrollment-{file-key-not-exportable,hardware-key-exportable,file-key-attested}.json`,
  `fixtures/positive/device-check-in-response-protocols.json`; docs
  `docs/specification/devices.md`, `relay.md`, `versioning.md`, `share-registration.md`, `CONTEXT.md`, `docs/DOCMAP.md`,
  `docs/specification/conformance.md` (the server's row, the node's file-key row, the node's and the receiver's
  share-registration rows, the `FAC-SEM-125` register row), `docs/backlog.md` (CT-04, CT-65, CT-67), `docs/OPEN_QUESTIONS.md` (OQ-0010),
  `docs/handoffs/2026-10-20-device-file-key.md`.
- **Source:** Project Observatory's request on the project board (2026-10-19); DEC-0094 reserved by git CAS (key
  `ct65-device-file-key`, counter commit `ba52e30`). `SEM-0125` was taken while the SEM counter's receipt chain was
  broken (the shared fetched-id ref, recorded in the CT-57 handoff): the counter on origin reads next 127 (`4c4598f`),
  and no other branch uses 125.

### DEC-0095: `support-quality-daily/1`: one support channel's quality for a closed UTC day, as an event's data (`FAC-SEM-126`)

- **Date:** 2026-10-20
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: board row CT-61.
- **Annotated (2026-10-21):** the counter commit its Source cites (`4c4598f`) is no longer on origin's SEM chain: the
  2026-10-21 reservation force-updated the ref (`4c4598f...b52fc3d`), the receipt-chain defect CT-44 records.
- **Annotated (2026-10-21):** `checks` is never an empty object (`minProperties: 1`): with no check judged it is `null`,
  as the page already said. A stricter schema at the same revision, because no producer had moved to `/1` yet (CT-61).
- **Decision:** in [support quality](specification/support-quality.md):
  1. An agent that answers people MAY publish, on its events feed, one event per closed UTC day and channel (`chat`,
     `mail`, `reviews`, `community`), of kind `support.quality_daily`, whose `data.value` (DEC-0070) is a
     `support-quality-daily/1` payload: the four families of the standard (nobody dropped, quality, stability, autonomy),
     the rubric `checks` as a member of their own (two levels), `rubricVersion`, `judgeModel` and `notMeasured`. A
     reader recognises it by `data.value.kind`; `data.schema` is the service's published copy, as DEC-0070 says.
  2. Counts and rates only: no person's words, no ids and no judge notes.
  3. `FAC-SEM-126`: a metric not computed is `null` and named in `notMeasured`, and a named one is `null`, never a `0`;
     parts stay within their whole (helped verdicts within the sample, recoveries within the failures, outcomes within
     the turns); p50 at most p90; a judged sample (any sample, helped verdict or check rate) names its rubric version
     and judge. Model-call failures per lane are not split in this revision.
- **Why:** issue #125 asked for one payload so any voice-of-the-customer reader reads any agent's support feed the same
  way; the standard behind it (what is measured, the rubric, the judge) is the asker's, the shape the contract's.
- **Alternatives refused:** a free channel slug, as the first implementation had (an enum lets a reader apply the
  standard's per-channel targets; an agent merges its surfaces of one channel); a `0` for a metric not measured (a reader cannot tell it from a measured zero); per-turn
  records (they carry a person's words, which never leave the agent).
- **Compatibility:** additive: a new schema and revision. `contractVersion` stays `0.1.0`.
- **Consequences / affects:** schema `schemas/support-quality-daily.schema.json`, revision `support-quality-daily/1` in
  `src/protocol-revisions.ts`; rule `src/support-quality-rules.ts` (wired in `src/semantic-rules.ts`); tests
  `test/support-quality.test.ts`, `test/schema-compilation.test.ts`; fixtures `fixtures/positive/support-quality-daily.json`,
  `fixtures/semantic/support-quality-daily-*`, nine `fixtures/negative/support-quality-daily-*`, `fixtures/catalogue.json`,
  `test/positive-sweep.test.ts`, `vitest.config.ts`; docs `docs/specification/support-quality.md`, `conformance.md` (two rows
  and the register row), `docs/DOCMAP.md`, `README.md`, `CONTEXT.md`, `docs/backlog.md` (CT-61),
  `docs/handoffs/2026-10-20-support-quality.md`.
- **Source:** issue #125 (passioncode-ai/fabric-agent-contract); DEC-0095 and `SEM-0126` reserved by git CAS (key
  `ct61-support-quality`, counter commits `8a62c04` and `4c4598f`).

### DEC-0090: The partner channel: a partner's publisher key trusted per context, its agents' usage, and owner to partner to agents (`FAC-SEM-122`…`FAC-SEM-124`)

- **Date:** 2026-10-20
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: board row CT-58.
- **Decision:** in [the partner channel](specification/partner-channel.md), a partner is named by its organization
  context `org:<partnerOrgId>` (the first organization server's PA-01):
  1. **A partner's publisher key, trusted per context (`FAC-SEM-122`).** `estate-record/1` gains an optional
     `publisherScopes[]`, each `{kid, partner, contexts}`: `kid` a key of `publisherKeys`, `partner` the partner,
     `contexts` 1 to 64 distinct organization contexts, never `personal`. `placementTrust` hands a scoped key to
     `verifyPackage` only for a placement in one of its contexts. The rule refuses a placement or an installation under a
     scoped key elsewhere, a key scoped twice and a scope naming a key the record does not pin. An unscoped key keeps
     DEC-0051's meaning.
  2. **A partner reads its agents' usage (`FAC-SEM-123`).** `partnerUsage({usage, publishers, step})` answers, over one
     organization's joined `grant.usage` rows (DEC-0086), cells per `agentRef` and UTC day or billing period of
     the partner's publishers, with no person, device or grant; `costUsd` is `null` exactly when every call of the cell
     is unpriced, the priced costs summed smallest first so the order of the rows does not change a cell. A cell may be
     one person's usage when one member uses the agent; a minimum population is not decided here. Each read is logged in every contributing member's access log as `reader: {service: "org:<partnerOrgId>", role:
     "partner"}`, scope `activity.usage`, step `day` or `period`, and the organization server's notice names each partner
     reader before its first read; the rule refuses a partner entry read as a person, of
     another scope or step, or keyed by a device.
  3. **Owner to partner to agents (`FAC-SEM-124`).** A grant whose `principalKind` is `partner` has the partner as its
     principal and the company's own `org:<orgId>` as its `context`; being in an organization's context, it is named by
     a share grant id (`urn:fabric:share:<32 hex>`, `FAC-SEM-117`). A token under it is for the grant's issuer, and its
     chain holds the partner actor `{partner: "org:<partnerOrgId>"}` innermost, counted toward DL-6's depth; an onward
     token keeps it innermost. A partner actor stands in no chain under another kind of grant, and a verifier admits it
     only innermost.
- **Why:** the operator's standing decision SD-1 (2026-10-19): partners build paid agents and sell them to companies as
  a setup, and the company pays the platform only for the cloud. PA-06 asked the contract for these three parts (board
  thread `6e66a023`, accepted in principle there on 2026-10-19, pull request targeted by 2026-10-27).
- **Alternatives refused:** a scope inside the publisher JWK (the JWK is closed, and a key's trust is the record's to
  state); a partner reading per-person or per-grant usage (OD-1 shows another party sums only); the partner as an agent
  id the hub registers (it would hide which partner a chain runs through); a partner actor anywhere in the chain (only
  innermost says on whose behalf).
- **Compatibility:** additive: `publisherScopes`, the `partner` principal kind and the partner actor are new, and a
  record, grant or token without them reads as before. A reader pinned before DEC-0090 refuses a record with
  `publisherScopes`, a partner grant and a token whose chain holds a partner actor (closed schemas), so a partner channel
  needs the reader at this pin, and a writer gates on every reader's pin as DEC-0082 does (every machine for
  `publisherScopes`, the meter for a partner grant). `contractVersion` stays `0.1.0`.
- **Consequences / affects:** schemas `schemas/estate-record.schema.json`, `schemas/delegation-token.schema.json`,
  `schemas/governance.schema.json`; code `src/estate-record-rules.ts`, `src/partner-usage.ts`, `src/activity-rules.ts`,
  `src/delegation.ts`, `src/delegation-rules.ts`; tests `test/estate-record.test.ts`, `test/activity-rules.test.ts`;
  fixture `fixtures/semantic/delegation-mint-agent-grant-partner-actor.json`; docs `docs/specification/package.md`; vectors `fixtures/vectors/partner-usage.json` (written by
  `tools/vectors/partner-usage.ts`); fixtures `fixtures/semantic/{estate-partner,access-log-partner,delegation-mint-partner}-*`;
  tests `test/partner-usage.test.ts`, `test/partner-channel.test.ts`, `test/contexts.test.ts`, `test/delegation.test.ts`;
  docs `docs/specification/partner-channel.md`, `estate-record.md`, `activity.md`, `delegation.md`, `conformance.md`,
  `docs/DOCMAP.md`, `README.md`, `CONTEXT.md`, `docs/backlog.md` (CT-58), `docs/handoffs/2026-10-20-partner-channel.md`;
  brief `docs/evidence/specs/2026-10-19-partner-channel/brief.md`.
- **Source:** board thread `6e66a023` (SD-1, passioncode-platform's ADR-0007 reply, the contract's acceptance; the first
  organization server's PA-01); DEC-0090 and `SEM-0122` reserved under the key `ct58-partner-channel`,
  `SEM-0123` under `ct58-partner-channel-2`, `SEM-0124` under `ct58-partner-channel-3`. Two counter commits are not in
  the chains on origin, the receipt-chain defect the CT-57 handoff records: DEC's (it moves from `a24dc0f`, next 90, to
  `7b857d5`, next 92) and `SEM-0124`'s `0bfa93f` (SEM moves from `5f2665c`, next 124, to `4c4598f`, next 127). No other
  branch uses DEC-0090 or `FAC-SEM-122` to `FAC-SEM-124`.

### DEC-0096: What an agent uses: `extensions/connections/0.1` (`FAC-SEM-127`)

- **Date:** 2026-10-21
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: board row CT-70.
- **Decision:** in [connections](specification/connections.md):
  1. A service MAY declare, under the well-known document's `extensions`, the key
     `https://fabric.passioncode.ai/agent-contract/extensions/connections/0.1` with at most 64 connections, each
     `{id, kind, target, capability?, state, label?, purpose?, reason?, lastAt?}`: `kind` `service`, `model`,
     `connector`, `store` or `channel`; `capability` only on a `service` and a DEC-0020 capability name; a `service`'s
     `target` an `id.instance` key or a product id; `state` `ok`, `degraded`, `down` or `unknown`.
  2. A `degraded[].source` equal to a connection's `id` is that connection failing.
  3. `connectionsView` is the reading: an invalid value, a repeated `id` or a credential in any string member is not
     declared and is reported (`FAC-SEM-127`); a connection is data, never authority. What counts as a credential is
     the reference `credential` in `src/connections.ts` and the vectors; its key shapes are a variant of DEC-0044's one
     detector, narrower by a word start, the `sk-` rules, case-sensitive prefixes, a Bearer token's length and digit and
     no long run in a model's `target` outside a URL, wider by a Telegram bot token; whether the shared one adopts
     them is CT-73.
- **Why:** Fabric Dashboards' Connections tab (FD-78) needs the agent's own word for what it uses, and the operator
  asked for the whole chain in the contract (board thread `131648c0`, 2026-10-20).
- **Alternatives refused:** a call count (the usage report's); a `usedBy` list (the host derives it from every agent's
  declaration); a `direction` member (not needed as data yet; `purpose` says it).
- **Compatibility:** additive: a new extension key, ignored by a host that does not know it. `contractVersion` stays
  `0.1.0`.
- **Consequences / affects:** schema `schemas/service-connections-extension.schema.json`; code `src/connections.ts`,
  `src/extensions.ts`, `src/semantic-rules.ts`; vectors `fixtures/vectors/connections.json` (written by
  `tools/vectors/connections.ts`); fixtures `fixtures/positive/service-well-known-connections.json`,
  `fixtures/semantic/service-well-known-connections-*`; tests `test/connections.test.ts`, `test/consistency.test.ts`,
  `test/positive-sweep.test.ts`, `test/schema-compilation.test.ts`, `vitest.config.ts`; docs
  `docs/specification/connections.md`, `service.md`, `conformance.md`, `docs/DOCMAP.md`, `README.md`, `CONTEXT.md`,
  `docs/backlog.md` (CT-70), `docs/handoffs/2026-10-21-connections.md`.
- **Source:** Fabric Dashboards' proposal (board message `8866b1b4`, thread `131648c0`); fabric-agent-adapter's FAA-62
  (`d463b07b`); DEC-0096 and `SEM-0127` reserved by git CAS (key `connections-extension-20261021`).

### DEC-0097: A schema pattern never uses a bare `.`: a package path and a device's free text hold across U+2028 and U+2029

- **Date:** 2026-10-22
- **Status:** Accepted source change (on merge of PR #140). Consumer adoption: board row CT-87.
- **Decision:**
  1. In every schema `pattern`, any character is written `[\s\S]`, never `.` outside a character class. ECMAScript's
     `.` (Ajv compiles with the `u` flag) does not match U+2028 or U+2029, so a negative lookahead written `(?!.*X)`
     stops at the first such character and lets `X` through after it; Python's `re` matches them, so the two engines
     disagreed. `test/schema-compilation.test.ts` refuses a bare `.` in any schema pattern.
  2. Two guards change what they accept, each only for a string that holds a line or paragraph separator:
     `fabric-package.schema.json#/$defs/path` refuses `skills\u2028/../../etc/passwd`, a backslash and a doubled slash
     after one (a path traversal for an installer that trusts the schema and extracts by listed path); and
     `device-common.schema.json#/$defs/detail` refuses `C:\Users\<name>`, `%2Fhome` and `-Users-<name>` after one (a
     private path in a device's free text, F-B-104).
  3. Five other patterns are rewritten the same way with an unchanged accept set, because their character classes
     already exclude both separators: `device-policy` `workspace.folders`, `activity-common` `sourceKey` and its string
     `extScalar`, `settings-backup` `tableName` and `columnName`.
- **Why:** fabric-agent-adapter's audit of 2026-10-22 (finding 40, report `docs/reports/2026-10-22-adapter-audit/README.md`
  at `1bc740c`, board thread `de8834d8`) found the package path accepting a traversal in the contract's own Ajv at the pin
  and in the adapter's Node twin. An open security hole is fixed when found.
- **Measured:** with the patterns of `main` `66520f0` compiled under `u`, each of the six new negative fixtures was
  accepted; with this change each is refused; the positive package and device fixtures keep their verdicts (the full
  suite under `pnpm run check`).
- **Alternatives refused:** excluding U+2028 and U+2029 from the path's and the detail's body (narrower than needed, and
  it leaves the next guard written with `.` open); the `s` flag (a schema `pattern` carries no flags).
- **Compatibility:** narrows two patterns to refuse what their descriptions already forbade; a document a writer could
  produce in good faith keeps its verdict. `contractVersion` stays `0.1.0`. A consumer that vendors these schemas takes
  them from the same commit.
- **Consequences / affects:** schemas `fabric-package`, `device-common`, `device-policy`, `activity-common`,
  `settings-backup`; fixtures `fixtures/negative/fabric-package-path-*-separator-*`,
  `fixtures/negative/device-check-in-detail-*-separator-home.json`, `fixtures/catalogue.json`; test
  `test/schema-compilation.test.ts`; docs `docs/specification/package.md`, `docs/specification/devices.md`,
  `docs/backlog.md` (CT-87), `docs/evidence/retro.md`.
- **Source:** the adapter's finding (thread `de8834d8`, message `95ba2bb0`); DEC-0097 reserved by git CAS (key
  `pattern-line-separator-20261022`).

### DEC-0098: The board as Fabric 0.3.9 serves it: `answered`, a default deadline, `noResponder`, reading what is new, bulk read marks, a host's wait, and a typed reaction on a reply to an announcement

- **Date:** 2026-10-22
- **Status:** Accepted source change (on merge of PR #141). Consumer adoption: board row CT-81.
  Annotated (2026-10-22): corrected by DEC-0102, items 9 (the answer transition, the pass over earlier requests, holds, `noResponder.message`).
  Annotated (2026-10-26): DEC-0135 narrows item 4: for a reader pinned at or after it, `unread` and `read` are over the
  messages delivered to the reader; an older reader's are over every message its Project did not send (DR-5). Item 5's bulk marks and their counts are unchanged; a thread's mark covers the messages the reader's
  Project did not send, as before, and its schema text now says so rather than "delivered".
- **Decision:** in [project communication](specification/project-comms.md):
  1. **`answered`**, a request state: a message from the request's target Project, not itself a request, whose
     `replyTo` is a `queued` request moves it to `answered` in the same transaction (`answer`, `queued` →
     `answered`). It is not open: no responder claims it and its deadline no longer expires it; only the requester's
     `com.cancel` moves it (`answered` → `cancelled`). It says the target answered, never that the work was done.
     `FAC-SEM-027`'s table carries both transitions.
  2. **A default deadline:** a request submitted without one gets one seven days after it is stored, written into the
     request.
  3. **`noResponder`**, only in the requester's own `com.submit` receipt: nobody can answer that capability for that
     Project now (no slot with a holder, no live `board.respond` grant); the request is stored.
  4. **Reading what is new:** `com.list` takes `unread` and `since`; a page asked with either carries `read` on every
     message, a page asked with neither is unchanged. A host SHOULD keep its cursor key across its own restart.
  5. **Bulk read marks:** `com.read_ack` takes one message, up to 100 named messages, or a thread `upTo` a message of
     it (the oldest 1000 at most), all or nothing (`comms-read-ack.schema.json`); the receipt carries `marked`,
     `alreadyRead` and `more: true` when more remained.
  6. **A host's wait:** HTTP 503 with `Retry-After` and `comms-host-wait.schema.json` (`stack-starting`,
     `stack-unavailable`, `retryable: true`), answered before the call is read and storing nothing.
  7. **A typed reaction:** a participant's reply whose `replyTo` is an announcement MAY carry `reaction`
     (`adapted` with `ref`, `row` with `ref` and `due`, `not-affected`); the board refuses it on any other message
     (`invalid_arguments`) and every participant reads it. Without one, the body's first word is the type, as before.
- **Why:** Fabric 0.3.9 serves items 1 to 6 already (its ADR-0149 amendment of 2026-10-21, `boardService.ts`,
  migration `20261021000120_board_core_holds.sql`; board thread `a5969ac5`, with Fabric's correction that `answered` and
  `noResponder` reach every caller, so a reader pinned before this refused or misread them). Item 7 was asked of the
  contract on thread `c430513b` (2026-10-19) and by fabric-workspace (`faf23c9c`); the operator put it in the iteration
  (fabric-workspace `knowledge/plans.md` row 10).
- **Measured:** each shape follows Fabric's `origin/main` `297d95ba`: `commsListSchema`, `commsReadAckSchema`,
  `commsReceiptSchema` (`marked`, `alreadyRead`, `more`, `noResponder`), `requestState`, `refuseForStack` in
  `hubStandby.ts`; `board_read_ack_many`'s cap of 1000 and `more`; `board_message_json` carrying `deadline`.
- **Alternatives refused:** `answered` as a terminal state (Fabric lets the requester cancel it, and a request a target
  answered by mistake must be withdrawable); `noResponder` to every participant (it is the requester's next step, not
  the thread's news); a reaction as a new message kind (a reaction answers one announcement and is read with its reply);
  a structured `evidence` list on the reaction (`ref` names one thing to follow; artifacts already carry more).
- **Compatibility:** additive for a writer: every new member is optional and a call that uses none of them is
  unchanged. A reader pinned before this meets `answered` in a request's state and `noResponder` in a submit receipt and
  takes this pin to read them. `reaction` is new to Fabric too: a board that does not serve it refuses it as an unknown
  member, so a writer sends it only to a board that pins this decision, and writes the type as the first word anyway.
  `contractVersion` stays `0.1.0`.
- **Consequences / affects:** schemas `comms-common` (`requestState`, `reaction`), `comms-list`, `comms-message`,
  `comms-message-ref` (title), `comms-receipt`, `comms-reply`, `comms-submit`, and the new `comms-read-ack`,
  `comms-host-wait`; code `src/semantic-rules.ts` (`COMMS_TRANSITIONS`); 22 fixtures (10 positive, 12 negative, under
  `fixtures/*/comms-*`); tests `test/comms-rules.test.ts`, `test/comms-tools.test.ts`, `test/schema-compilation.test.ts`,
  `test/positive-sweep.test.ts`; docs `docs/specification/project-comms.md`, `docs/backlog.md` (CT-81),
  `docs/handoffs/2026-10-22-board-additions.md`.
- **Source:** Fabric's ask (thread `a5969ac5`, messages `db2904ed`, `38959402`); thread `c430513b`; DEC-0098 reserved by
  git CAS (key `ct81-board-additions-20261022`).

### DEC-0099: An organization's cloud machine enrolls by an `org-cloud` token and binds no person; `processor-hosted` custody

- **Date:** 2026-10-22
- **Status:** Accepted source change (on merge of PR #142). Consumer adoption: board row CT-82.
  Annotated (2026-10-22): corrected by DEC-0102, items 10 (an `org-cloud` machine derives no share registration) and 11 (compatibility wording).
- **Decision:**
  1. In [devices](specification/devices.md): a device certificate's binding MAY say `role: "org-cloud"`: the device
     is the organization's own cloud machine (its `org-cloud` or `enterprise-cloud` hosting, entitlement/1), a VM no
     person uses. Such a binding names no `user` (schema). `FAC-SEM-044` reads the server's record of the token: the
     role is given only by an `enrollment-token` whose record says `role: "org-cloud"`, and a certificate issued on one
     always says it. An SSO sign-in never gives it. How the server issues and records the token's role is its own.
  2. In [service](specification/service.md): `peer.custody` admits `processor-hosted`: a processor runs the machine or
     account for an organization under a processing agreement (the organization's cloud on PassionCode's hosting); the
     organization controls the data, the processor the machine. It is shown beside the service like the other two.
- **Why:** the cloud architecture's A-3 (fabric-workspace `docs/reports/2026-10-21-cloud-architecture/README.md`,
  accepted by the operator as the target on 2026-10-22), asked of the contract on board thread `348467e5`: the first
  organization server's VES-REC needs to tell an organization's cloud from a member's machine by 2026-10-31, and
  CX-CON-08's verdict of 2026-10-12 was to amend `peer.custody` with `processor-hosted`.
- **Alternatives refused:** a role member on the enrollment request (the node would claim what only the token proves);
  binding the organization's administrator as the cloud's user (its activity would read as that person's); a fourth
  hosting product name for the role (`org-cloud` already names the organization's hosting in entitlement/1, and an
  `enterprise-cloud` VM is the same kind of machine).
- **Compatibility:** additive: a certificate without `role` and the two custody values keep their meaning. A receiver
  pinned before this refuses a binding with `role` and a descriptor with `processor-hosted` at its schema, so a server
  issues the role, and a descriptor declares the custody, only toward readers that pin this decision. `contractVersion`
  stays `0.1.0`.
- **Consequences / affects:** schemas `device-enrollment` (`binding.role`), `service-descriptor` (`peer.custody`); code
  `src/device-rules.ts` (`FAC-SEM-044`); fixtures `fixtures/semantic/device-enrollment-org-cloud*.json`,
  `fixtures/positive/device-enrollment-response-org-cloud.json`,
  `fixtures/negative/device-enrollment-response-org-cloud-with-user.json`,
  `fixtures/negative/device-enrollment-response-unknown-role.json`,
  `fixtures/positive/service-descriptor-peer-processor-hosted.json`; test `test/device-rules.test.ts`; docs
  `docs/specification/devices.md`, `docs/specification/service.md`, `docs/backlog.md` (CT-82),
  `docs/handoffs/2026-10-22-org-cloud.md`.
- **Source:** passioncode-platform's ask (thread `348467e5`, message `7f194e53`, item 3); DEC-0099 reserved by git CAS
  (key `ct82-org-cloud-20261022`).

### DEC-0100: A `purpose` rejection, a share registration sent again after the notice, and renewal within 30 days of expiry

- **Date:** 2026-10-22
- **Status:** Accepted source change (on merge of PR #143). Consumer adoption: board row CT-88.
  Annotated (2026-10-22): corrected by DEC-0102, items 6 (the renewal clock), 7 (SR-5a lets a withdrawal pass), 8 (resuming after `purpose`) and 11 (compatibility wording).
- **Decision:**
  1. In [activity](specification/activity.md): a batch acknowledgement's `rejected[].reason` admits `purpose`: the
     receiver does not collect that event for that person under the notice they acknowledged. It is consumed like every
     rejection, and the collector sends no event of that kind for that person until the device's policy names a later
     `noticeVersion`. `attribution` keeps its meaning (another organization, device or user than the certificate).
  2. In [share registration](specification/share-registration.md): SR-5a, after SR-5, answers 403
     `purpose-not-collected` when the receiver states `binding.purposeAdmitted: false` (the bound user's acknowledged
     notice does not name a share registration's purposes); a `purposeAdmitted` that is not a boolean is SR-0. The
     sender gate answers it `hold-notice`: the node keeps the sums, is not degraded, and sends the registration again
     when its policy names a later `noticeVersion`, and at the seven-day resend.
  3. In [devices](specification/devices.md): `auth.method: "key-on-record"`. A device on record, not revoked, renews
     within 30 days of its last certificate's `notAfter` with a CSR from its key on record and no other proof; the
     certificate keeps the user and role on record, a new epoch is issued, and the renewal is audited. `FAC-SEM-044`
     checks it (`RENEWAL_GRACE_DAYS`). A server MAY refuse it by policy.
- **Why:** the first organization server's asks 9 and 10 (board thread `ba63565c`, 2026-10-22, from its
  production-readiness work): it now accepts an event only when the person's notice names every purpose the event
  serves, and had to answer a purpose refusal as `attribution`, which misleads a node; a refused share registration was
  not sent again until the share changed; and a machine offline for more than seven days needed a new token per
  absence.
- **Alternatives refused:** `purpose` as a soft `hold` the collector retries (the notice decides, not time); a longer
  certificate (DEC-0031's 30-day ceiling and the SHOULD of 7 days stand; a stolen certificate stays short-lived); a
  renewal signed by the expired certificate over mutual TLS (no receiver accepts an expired certificate at its transport
  step 6); a grace longer than the longest certificate.
- **Compatibility:** additive for a sender: a receiver pinned before this never answers the new values. A collector
  pinned before this meets `purpose` and `purpose-not-collected` as unknown values: a rejection is consumed whatever its
  reason, and the gate's `hold` already keeps the sums for a code it does not know, so nothing is lost before it repins.
  A server pinned before this refuses `key-on-record` at its schema, so a node renews that way only toward a server
  whose `protocols` it learned at or after this decision. `contractVersion` stays `0.1.0`.
- **Consequences / affects:** schemas `activity-batch-ack` (`rejected[].reason`), `share-registration` (the refusal's
  code), `device-enrollment` (`auth`); code `src/share-registration.ts` (`decideShareRegistration`, `gateGrantUsage`,
  `SHARE_REFUSAL_CODES`), `src/device-rules.ts` (`FAC-SEM-044`, `RENEWAL_GRACE_DAYS`); vectors
  `fixtures/vectors/share-registration.json` (written by `tools/vectors/share-registration.ts`); fixtures
  `fixtures/semantic/device-enrollment-renewal-*.json`, `fixtures/positive/device-enrollment-request-key-on-record.json`,
  `fixtures/negative/device-enrollment-key-on-record-with-token.json`; tests `test/device-rules.test.ts`,
  `test/share-registration.test.ts`; docs `docs/specification/activity.md`, `share-registration.md`, `devices.md`,
  `conformance.md`, `docs/backlog.md` (CT-88), `docs/handoffs/2026-10-22-refusals-renewal.md`.
- **Source:** the first organization server's asks 9 and 10 (thread `ba63565c`, message `5e4a81b4`); DEC-0100 reserved
  by git CAS (key `ct88-refusals-renewal-20261022`).

### DEC-0101: A node's harness summary, the organization's baseline and drift, and repairs under the machine's policy (`FAC-SEM-128`, `FAC-SEM-129`)

- **Date:** 2026-10-22
- **Status:** Accepted source change (on merge of PR #144). Consumer adoption: board row CT-83.
  Annotated (2026-10-22): corrected by DEC-0102, items 1 to 5 (the summary's context, its reach, names, drift per kind, the repair decision).
- **Decision:** in [node summary](specification/node-summary.md):
  1. **`node-summary/1`** (`schemas/node-summary.schema.json`), a check-in record (`records.nodeSummary`) for one
     context: the coding agents by catalogue id (DEC-0093), the MCP servers with source, transport and health, the
     skills and plugins with their digests and versions, the hook count, the agent services placed in that context, and
     the drift. It names no person, path, credential, argument, environment value, prompt, output or file content
     (`FAC-SEM-128`; a name holds no slash, backslash, tilde or space by schema). It travels inside the device request
     DEC-0056 signs; its own signature for the relay is CT-90.
  2. **The baseline:** the policy key `harness.baseline`, signed with the policy; `harnessDrift` is the drift, one state
     per baseline item in its order (`missing`, `stopped`, `changed`, `outdated`), reported under the layer's revision
     (`FAC-SEM-128`).
  3. **Repairs:** `repair-request/1` in a check-in response's `records.repairs`, signed like a policy layer by a key of
     the current policy key set; the node runs it only as `repairDecision` answers (`FAC-SEM-129`): a verified
     signature, this device and organization, inside a window of at most 7 days, an unexpired policy (`FAC-SEM-068`'s
     remote execution), a package `repair.packages` lists by `agentRef` and digest, and the person told before it
     started. `repair-result/1` answers each once in `records.repairResults`.
- **Why:** the operator's targets S7, S8 and S10 (board thread `b2511678`; the first organization server's ADR-0011),
  asked of the contract as items 7 and 8 on thread `ba63565c`; the first organization server's VES-HARNESS,
  VES-INTEGRITY and VES-REMEDIATE and Project Observatory's OBS-192 and OBS-193 wait on it. DV-CON-01's accepted
  constraints (2026-10-12) hold: per context, services by `id.instance` with `protocols`, A2A card digests and MCP
  endpoints as published, no person and no path, a check-in record.
- **Alternatives refused:** the summary signed separately inside a signed request (two signatures over one body; the
  relay case is CT-90); a repair as a `device-action` kind (an action is the device's own decision record, a repair is
  the organization's signed request); a baseline outside the policy (a node would need a second trust root for it);
  hook commands or server arguments (they carry paths and secrets).
- **Compatibility:** additive: new schemas, two new optional policy keys and three optional record members. A receiver
  pinned before this refuses the new members at its schema, so a node sends them only to a server whose `protocols` it
  learned at or after this decision. `contractVersion` stays `0.1.0`.
- **Consequences / affects:** schemas `node-summary`, `repair-request`, `repair-result`, `device-policy`
  (`harness.baseline`, `repair.packages`), `device-check-in` (`records`); code `src/node-summary.ts`,
  `src/semantic-rules.ts`, `src/semantic-kinds.ts`; fixtures `fixtures/positive/node-summary.json`,
  `fixtures/positive/repair-*.json`, `fixtures/negative/node-summary-*.json`, `fixtures/negative/repair-*.json`,
  `fixtures/semantic/node-summary-*.json`; tests `test/node-summary.test.ts`, `test/schema-compilation.test.ts`,
  `test/positive-sweep.test.ts`; docs `docs/specification/node-summary.md`, `devices.md`, `conformance.md`,
  `docs/specification/README.md`, `docs/DOCMAP.md`, `docs/backlog.md` (CT-83, CT-90),
  `docs/handoffs/2026-10-22-node-summary.md`.
- **Source:** the first organization server's items 7 and 8 (thread `ba63565c`, message `1503e2aa`); DEC-0101,
  `SEM-0128` and `SEM-0129` reserved by git CAS (keys `ct83-node-summary-20261022`, `-a`, `-b`).

### DEC-0102: The readings of DEC-0098 to DEC-0101 corrected: a summary's context and reach, a repair's key, expiry, allowlist and repeat, the renewal clock, a withdrawal under SR-5a, resuming after `purpose`

- **Date:** 2026-10-22
- **Status:** Accepted source change (on merge of PR #145). Annotated (2026-10-23): item 2's reach replaced by
  DEC-0118 (it follows `machine.mode`). Annotates DEC-0098 to DEC-0101; their bodies are not
  rewritten. Consumer adoption: the rows of the decisions it corrects (CT-81, CT-82, CT-83, CT-88).
- **Decision:**
  1. **A node summary's context** is `orgContextId`: its enrollment's own `org:<org.id>`, compared as written with the
     certificate and refused when it differs (`FAC-SEM-128`); contexts.md's "no check-in carries a context" names it as
     an exception beside `grant.usage` and the share registration.
  2. **Its reach:** the whole harness of the machine, whatever `machine.mode` says, as the operator decided (S8; the first
     organization server's ADR-0011); the services of the summary's own context only. Whether an organization also sees
     a person's services in other contexts, and the harness item names installed for another context, collides with
     unlinkable memberships (DEC-0082) and is the operator's question, CT-92; until it is answered the whole harness
     ships, as ADR-0011 says. (A first draft of this decision narrowed the harness under mode `C`; the second seam reading found
     it against ADR-0011, and it was withdrawn before merge.)
  3. **A harness name** carries at most one `@` suffix without a dot (a plugin's marketplace), so it can carry no e-mail
     address with a dotted domain; kind `node-summary-document` reads a summary alone (no credential, e-mail address, home path or
     duplicate), so `pnpm validate` and the positive sweep check it.
  4. **`harnessDrift`** compares a digest only for a skill or a plugin and a version only for a coding agent or a
     plugin, the kinds whose rows carry them; the `harness.baseline` schema admits `minVersion` and `digest` only there,
     and its names take the summary's name shape, so no baseline names what no summary can report.
  5. **`repairDecision`:** the key is judged inside its `notBefore` and `notAfter` at that moment, as `FAC-SEM-041`
     judges a policy's; the policy's expiry is exactly `FAC-SEM-068`'s (no `expiresAt`, no expiry); `repair.packages`,
     like `harness.baseline`, is read from the `mdm` and `server` layers only, never a person's `user` layer
     (`signedPolicyValue`, `harnessBaseline`); a repair `id` runs at most
     once (`already-answered`, checked first and never sent as a result's reason), and its one result is sent again
     unchanged for a redelivered request; an id is the issuing organization's (a node keeps results by `org.id` and
     id, and a server asks again only under a new id); a request with no canonical form is refused `bad-signature`, never thrown; on a machine
     with role `org-cloud` the organization's signed request is the notice, and a result's `notifiedAt` is when the
     node verified it; `FAC-SEM-129` holds the reason exactly.
  6. **Renewal by the key on record** is judged by the server's clock (the new certificate's `notBefore`), never the
     device's `requestedAt`; before the last certificate's end the same request is a re-enrollment by the key on record
     with a new epoch (a rotation keeps the epoch).
  7. **SR-5a** refuses only an active registration: a withdrawal passes, because it reduces processing.
  8. **After a `purpose` rejection** a collector sends that kind for that person again only when the device's policy
     names a later `noticeVersion`, never on a timer (DEC-0100's refused alternative stands, and so does the first
     organization server's ask: not until the notice changes), or when a check-in response's new member
     `acknowledgedNoticeVersion` (the latest version the device's person acknowledged) differs from the one it held at
     the rejection, absence at the rejection included (a first acknowledgement is a change: on a managed machine collection
     starts at the deadline, before any); a value that becomes absent is no signal. The person may acknowledge the notice already in
     force, which moves no policy. The member is on every check-in response once there is one. A receiver answers
     `purpose` only when the purpose is not collected for that person when it answers; an event from before its
     purpose was collected for that person (their acknowledgement of the notice naming it, or the mdm deadline where
     the organization collects under it; a device bound to no person collects only from that deadline, its
     `collectionStart`), that purpose being collected now, may be kept; when a receiver does not keep it (a buffered
     event from before that start), it answers the new reason `before-purpose`, never `purpose`, a reason that holds
     nothing, sent to every collector (a rejection is consumed whatever its reason, as
     DEC-0100's Compatibility says for `purpose`); the name differs from GJ-4's `before-start`, a stored state of a
     `grant.usage`. `collectionStart` is
     no signal: it is the first acknowledgement (or the earlier mdm deadline) and never moves later.
  9. **The board's text:** the answer transition is a participant's message (never a responder's fenced message or
     progress note) of any kind but a request, from its target Project, whose `replyTo` is the request; a request
     stored before DEC-0098 has no deadline in its event, and its default (seven days after it was stored) is read from
     its time, never written; on every pass a board expires each `queued` or `claimed` request whose deadline, its own
     or that default, has passed, and before that answers each `queued` request its target already answered with such a reply (on
     every pass: a participant's reply can come while the request is claimed and the request return to `queued`; a
     replaced responder's notes never answer it, and Fabric's tick, which counts them today, narrows under CT-81); a hold does not stop the default deadline; `noResponder.message` is at most 300 characters.
  10. **An `org-cloud` machine derives no share registrations**: share grants are a person's, and such a machine binds
     none; its SR-5 `unassigned-device` is final, not a wait. What it reports for usage of agents it runs is CT-93.
  11. **Compatibility wording of DEC-0099 and DEC-0100:** no revision changed, so neither side can learn the other's pin
     from `protocols`; the in-band sign is CT-67. Until then a node refused `key-on-record` falls back to a token or
     SSO, and a server issues `role` only to a node whose product and version it knows read it.
- **Why:** three blind readings of the range `bfa9a67..4a29fcb` on 2026-10-22 (unit, seam, product) failed it: thirteen
  breaks (two unit, four seam, seven product; the unit and seam tiers found the repair's policy expiry both), each
  reproduced, and twelve surviving plants. A second round on this branch found ten more (one unit, one seam, eight
  product) and a third seven (five product; one seam, the resume trigger missed an acknowledgement of the notice in force; one
  unit, a baseline could name a coding agent or a service in a shape no summary carries) and a fourth four product
  (the new member's pin condition, CT-88's wording, the renewal's proof clause, the handoff's counts), all fixed here
  before merge. A fourth seam reading found one more: a buffered event from before the acknowledgement, rejected
  `purpose`, held a kind for good; `before-purpose` answers it. A fifth product reading found the answer to an older
  collector stated three ways; the reason now goes to every collector. A fifth seam reading found that an absent value
  at the rejection could never resume (the first acknowledgement on a managed machine); absence is now a held value. A sixth
  product reading found CT-92's widening not carried to its pointers and `before-purpose` covering a managed machine's
  deadline window; both fixed. An eighth product reading found the expiry of an older request without a deadline
  stated for its first pass only, and the UX of device settings promising a person's value for the two signed-only
  keys; both fixed. A ninth product reading found the handoff's round count stale and a repair result
  called both once and repeated; the result is one per id, repeated unchanged for a redelivered request. A tenth
  reading found a responder's progress note answering a request after the responder was replaced, the reply rule's old
  sentence, the UX's answered state, an `org-cloud` result's `notifiedAt` and the check-in schema's "each once"; all
  fixed. An eleventh product reading found `comms-common`'s `requestState` still giving the old answer rule; fixed,
  with the code comments on `COMMS_TRANSITIONS`. A sixth seam reading found an `org-cloud` machine with no reason
  for its buffered event (no person acknowledges); a seventh product reading found the instant first chosen for it
  defined nowhere, so such a device's start is its mdm deadline (its `collectionStart`) and the rest is CT-97. A fourth
  unit reading found two per-kind fields without a fixture and `resolvePolicy` (FAC-SEM-042) taking the two
  signed-only keys from a user layer; both fixed, so FAC-SEM-042 reads them as FAC-SEM-128 and FAC-SEM-129 do.
  Every break is fixed here; what needed a decision was decided by the safest reversible option (the operator's rule
  for open questions) and is listed above.
- **Compatibility:** narrower for the policy key `harness.baseline` (a name in the summary's shape, a coding agent's an agent id and a service's an `id.instance` key; `minVersion` only
  for a coding agent or a plugin, `digest` only for a skill or a plugin): a policy written to DEC-0101 that carries
  another is refused whole and the node keeps the revision it holds. Narrower for a node summary (an organization
  context only) and
  for a repair (a key in its window, signed layers, one run per id); a consumer of these surfaces has not adopted yet
  (CT-83, CT-88). Wider for a check-in response (`acknowledgedNoticeVersion`): the response is a closed object, so a
  server sends the member only to a node pinned at or after DEC-0102, as DEC-0094 does for `protocols`. Wider for a
  batch acknowledgement (`before-purpose`), sent to every collector: a rejection is consumed whatever its reason. `contractVersion` stays `0.1.0`.
- **Consequences / affects:** schemas `node-summary` (context, name), `device-policy` (`harness.baseline`),
  `comms-receipt` (`noResponder.message`), `comms-common` (the `requestState` description), `device-check-in` (`acknowledgedNoticeVersion`), `activity-batch-ack`
  (`before-purpose`); code
  `src/node-summary.ts`, `src/device-rules.ts` (renewal clock), `src/share-registration.ts` (SR-5a),
  `src/semantic-kinds.ts`; vectors `fixtures/vectors/share-registration.json`; fixtures: semantic `node-summary-other-org`;
  positive `device-policy-harness-baseline`, `activity-batch-ack-purpose`, `device-check-in-response-acknowledged`, `activity-batch-ack-before-purpose`; negative `node-summary-personal-context`,
  `node-summary-dotted-suffix`, `device-policy-baseline-dotted-suffix`, `device-policy-baseline-skill-min-version`,
  `device-policy-baseline-coding-agent-name`, `device-policy-baseline-service-name`, `device-policy-baseline-coding-agent-digest`,
  `device-policy-baseline-mcp-server-digest`, `device-policy-baseline-service-min-version`, `node-summary-mcp-dotted-suffix`,
  `node-summary-skill-two-at`, `node-summary-drift-dotted-suffix`, `repair-result-already-answered`,
  `device-policy-baseline-mcp-server-min-version`, `device-policy-baseline-service-digest`; positive `repair-result-org-cloud`;
  `comms-receipt-no-responder-long-message`, `device-check-in-response-acknowledged-bad`, `comms-read-ack-empty`, `comms-host-wait-not-retryable`; tests
  `test/node-summary.test.ts`, `test/device-rules.test.ts`, `test/comms-tools.test.ts`, `test/positive-sweep.test.ts`;
  docs `node-summary.md`, `devices.md`, `share-registration.md`, `activity.md`, `project-comms.md`, `contexts.md`,
  `conformance.md`, `docs/specification/README.md`, `CONTEXT.md`, `docs/ux/flows.md`, `screens.md`, `scenarios.md`,
  `docs/backlog.md`, `docs/evidence/retro.md`, `docs/handoffs/2026-10-22-review-fixes.md`.
- **Source:** the three readings' reports (2026-10-22, recorded in the handoff); DEC-0102 reserved by git CAS (key
  `review-fixes-dec98-101-20261022`).

### DEC-0103: `organization-closed`, a final transport refusal for an organization that ended (CT-105)

- **Status:** Accepted source change (2026-10-22). Consumer adoption: CT-105.
- **Annotated (2026-10-26):** item 4's "one event" amended by DEC-0127, whose OM-5 makes a membership's end, read
  from the revision that unpins the organization, a second event that ends a `server` layer's locks;
  `certificate-revoked` keeps its meaning.
- **Context:** the first organization server closes organizations (its organization export and termination, live on
  2026-10-22): at the end of the notice period it revokes every machine certificate, then deletes the organization. Its
  machines then meet `401 certificate-revoked` and, after the deletion, `401 certificate-unknown`. Project Observatory's
  node ends an enrollment on either (OBS-204, shipped 2026-10-22), but cannot tell an organization's end from one
  machine's revocation, and after the deletion a machine whose certificate the server no longer knows learns nothing
  final. `unknown-org` exists only on that server's enrollment and is not in the contract. The server's ask 11 (board
  thread `ba63565c`, from Project Observatory's OBS-204, thread `5a0ecbde`).
- **Decision:**
  1. A server MAY answer any device request of an organization that ended (a check-in, a batch, a share registration, a
     rotation) with **HTTP 410**,
     no `Retry-After`, and the body `device-organization-closed`: `{error: {code: "organization-closed", message},
     closedAt}`, the shape of every other device refusal with `closedAt` beside it; `message` is one path-free line
     (`device-common#/$defs/detail`); `closedAt` is when the closing began (the end of its notice period, or, with no
     notice period, when its deletion began; never the request's date). A server that never closes an organization
     never sends it.
  2. It answers so **only once the closing can no longer be cancelled**, and **only to a node pinned at or after
     DEC-0103** (known from its product and version, as `protocols` is, CT-67); to an older node it answers what it
     answers today (`401 certificate-revoked` once it revoked the certificates), which Project Observatory's node
     already ends an enrollment on (OBS-204).
  3. It is checked at transport step 4, after the certificate is found and before revocation; after the deletion the
     server keeps in its termination record each of the organization's certificate serials with the last product and
     version its node reported (no person), at least until that certificate's `notAfter`; a serial whose node's pin it
     does not know gets today's answer. An enrollment carries no product or version, so it is answered as today (the
     server's own refusal) until a revision carries the pin (CT-67). A server sets `organizationClosedAt` on a
     certificate record only when the closing can no longer be cancelled and the node is pinned at or after DEC-0103.
     In `verifyDeviceRequest`
     a certificate record's `organizationClosedAt` gives `{ok: false, code: "organization-closed", status: 410,
     closedAt}`; an unreadable one is the receiver's own `context-invalid`.
  4. A node takes it as final on one answer: it stops every request to that organization, drops what it buffered for it
     (events, sums, registrations) and ends that enrollment, discarding that organization's `server` policy layer, key
     set, collection start and streams; an `mdm` layer stays the operating system's; its other enrollments are
     untouched; the enrollment's end on `organization-closed` is the one event this contract decides, besides a newer
     signed policy, that ends a `server` layer's locks (an `mdm` lock survives it); an enrollment a node ends on
     `certificate-revoked` is not decided here. The share registration's sender gate answers `stop` (for the reference's
     `{status: 410, code}` and for the wire's `{status: 410, body: {error: {code}}}` alike); `decideShareRegistration` gives `{status: 410,
     code, closedAt}`, and a verdict without a readable `closedAt` is SR-0's `context-invalid`. A collector consumes a
     batch's refusal whatever its reason; a 410 batch is the enrollment's end, not an event's rejection.
  5. `certificate-revoked`, `certificate-unknown` and a server's own enrollment refusals keep their meaning.
- **Why:** a closed organization should cost its former machines nothing: no buffered events kept for a server that will
  never take them, no retries, and no locks of a dead organization's policy. One code, final by definition and sent only
  when final, lets a node act on one answer without guessing from revocations; carrying only `closedAt` says nothing
  about the organization's people. The first round of blind readings (unit, seam, product) found a forged signed vector,
  `closedAt` read loosely, the shipped node's behaviour misstated, FAC-SEM-077 and SR-1 still saying 401, a free-text
  body without the path bound and no rule for the policy a closed organization leaves; a second round found the pin gate
  without a datum after deletion and at enrollment, and the gate's `hold` for the wire's nested body; a third round the
  handoff's objective, the Expiry exception, the disclosure before verification and an expired certificate's path; a
  fourth round two statements of which enrollment end lifts locks; all fixed here.
- **Alternatives considered:** reuse `certificate-revoked` with a flag (a node cannot tell the two apart without reading
  a member it may not know); 404 `unknown-org` (an unknown organization and an ended one are not the same, and an
  enrollment-only code says nothing to a running node); a revocation delta naming the organization (the node may never
  check in again to read it); sending 410 to every node (a node pinned before DEC-0103 would meet an unknown 410 where
  today it meets `certificate-revoked` and ends the enrollment, so a server adopting first would stop that removal).
- **Compatibility:** wider, and gated: a server sends the 410 only to a node pinned at or after DEC-0103, so an older
  node meets exactly what it meets today. The http-signature vectors gain two cases (a port that asserts their exact
  count moves to a lower bound); `ShareRegistrationAnswer` gains a 410 member (a typed consumer handles it at its
  re-vendor). `contractVersion` stays `0.1.0`.
- **Consequences / affects:** schema `device-organization-closed`; `src/http-signature.ts` (`organization-closed`,
  `organizationClosedAt`, the verdict's `status: 410`), `src/share-registration.ts` (`TRANSPORT_REFUSALS`, status 410,
  gate `stop`), `src/device-transport-rules.ts` (FAC-SEM-077's comment); vectors `fixtures/vectors/http-signature.json`
  (a closed organization's certificate, signed and mutual TLS, each with one fault) and
  `fixtures/vectors/share-registration.json` (intake and gate); fixtures positive `device-organization-closed`, negative
  `device-organization-closed-no-time`, `-extra`, `-path`, `-flat`, `-other-code`, `-error-extra`, `-bad-time`; tests `test/http-signature.test.ts`,
  `test/share-registration.test.ts`, `test/schema-compilation.test.ts`, `test/positive-sweep.test.ts`; docs
  `devices.md` (#organization-closed, the step table, FAC-SEM-077, tamper evidence), `share-registration.md`,
  `activity.md`, `conformance.md`, `CONTEXT.md`, `docs/ux/scenarios.md` (SCN-011), `screens.md` (SCR-10), `flows.md`
  (FLW-07), `docs/backlog.md` (CT-105, CT-106), the handoff and its index.
- **Source:** the first organization server's ask 11, board thread `ba63565c` (2026-10-22, 19:04), from Project
  Observatory's OBS-204 (thread `5a0ecbde`).

### DEC-0104: the agent network's S4: a directory, a call queue on `fabric.job.*` and a load report (CT-84)

- **Status:** Accepted source change (2026-10-22). S4 is Fabric's as a whole (the operator, 2026-10-22, roadmap
  RM21-S4); per-agent token administration is not in this decision. Consumer adoption: CT-84 (Fabric CO-376, the first organization
  server, hosting nodes, Fabric Dashboards, fabric-agent-adapter's kits).
- **Context:** S1 to S3 put an agent on a machine, in a context and in another person's hands. The hub, the hosting node
  and the panels asked three more things on the board (threads `ba63565c` items 1 to 3, `b2511678`; fabric-workspace
  roadmap RM21-S4): which agents a viewer can find across machines and organizations, what happens when more calls
  arrive than an agent can run, and how busy an agent is. Fabric starts CO-376 after its 0.3.11 (wave 4, renumbered from 0.3.10 on 2026-10-22; fabric-workspace roadmap
  RM21-S4, thread `fc563ce0`).
  The job schema is closed and its states are the MCP Task states (interop.md, DEC-0087), and a protocol accepts at most
  two revisions, so a queue that needs a new state or member would cost a revision of `fabric-interop`.
- **Decision:**
  1. A **directory** is `agent-directory/1`: `{type, source, viewer, generatedAt, entries}`, each entry `{agentRef,
     context, listed}` sorted by context then agentRef. It is a derived view, never authority: who may call an agent
     stays its grant. An estate's comes from its record's placements (`estateDirectory`) and is read only by the
     owner's own sessions, unlisted entries marked; an organization's comes from the share registrations it keeps
     active whose window holds the instant and `own`, the server's own record of the agents its `org-cloud` machines run
     (which document carries it is not decided here) (`organizationDirectory`), every entry for its
     administrator and the listed ones for a member. `listed` is a discovery flag of the directory's publisher; no
     `visible` flag exists, an entry a viewer may not read is absent. No person, machine, grant or digest is in it.
     The estate's lists placements as signed, not as callable. `FAC-SEM-130` (kind `agent-directory-view`) compares the
     entries, the source and the reader.
  2. The **call queue** lives at the node that hosts the agent, per (`agentRef`, context), with limits `concurrency`,
     `perCaller` and `queueMax`. A waiting job stays `working` with `statusMessage` `queued <position> of <length>`. The
     next job is `nextQueuedJob`'s: nothing at the concurrency limit; of the callers below their own limit, the one
     running the fewest; then the oldest arrival; then the id; every running job holds a slot. Every per-caller rule
     and the node's repeated keys key on `jobCallerKey`: for an accepted delegation token, `verifyDelegation`'s
     `principal` and `caller` (the outermost actor) and the partner organization a chain ends in, else the credential of
     a call with no token; a refused token is refused, never keyed. A provider that does not queue keeps its keys as
     DEC-0087 left them. `FAC-SEM-131` (kind `job-queue`). A start whose
     job would not start at once and that finds `queueMax` jobs waiting is refused (`admitJob`), nothing started or stored, with `queue-full` and `data: {retryable: true,
     retryAfterSeconds}` (1 to 3600), an `isError` result with no `structuredContent` whose text content is JSON of `interop-tool-error.schema.json`
     (a client validates `structuredContent` against the job tool's `outputSchema` even on an error); the
     caller starts again after it under the same key, and the hub relays it unchanged and keeps no key for it.
     `queue-full` never ends a job: `interop-job.schema.json` refuses it in a job's `error` and `jobCallerAction`
     answers `invalid`.
     `fabric.job.list {cursor?, limit?}` answers the authenticated caller's own jobs only, newest first, `{id, status,
     createdAt, updatedAt}`; another caller's job id answers `unknown-job`.
  3. The **load** is the extension key `extensions/load/0.1` (protocol `fabric-load/0.1`): `{path, windowSeconds,
     limits}`; at `path`, under the descriptor's `auth.tokenFile`, a `service-load/1` report of queued, running,
     completed and failed jobs and p50 and p95 wait and run time per window and context, with no person, caller,
     prompt, output or job id. `FAC-SEM-132` (kind `service-load`): windows in order one `windowSeconds` apart and none
     after `generatedAt`, one row per context, p50 at most p95, a run time only where a job ended. `FAC-SEM-133` (kind
     `service-well-known`): the declaration is valid against its schema, else a reader treats it as not declared. The
     report is read with the descriptor token (by the host and by every MCP client configured with it) and is never
     sent to an organization.
- **Why:** a directory derived from what already grants access cannot widen access, and one derivation per source
  gives the hub and the organization server the same answer for the same facts. A queue position in `statusMessage`
  and a refusal at start fit the existing job lifecycle, so no protocol revision is needed and a caller changes for one
  input only (a job that `queue-full` ended reads `invalid`); fairness by running
  count stops one busy caller from holding an agent; a per-caller log closes the question "which of my jobs are where"
  without showing anyone else's. Counts and durations per context are what the panels draw, and nothing else leaves
  the node. The first round of blind readings found a running job without a caller taking no slot, the load key
  unchecked in a well-known document, `queue-full` bound only inside a job it never ends, the NAMED_ONLY prose, `own`
  without a source, the load report's audience, no scenarios and a stale Fabric release; all fixed here, with the
  caller key, the hub's relay, the directory's labels and the queue grammar's leading zeros.
- **Alternatives considered:** a `queued` job status or a `position` member (breaks the closed schema and the MCP Task
  states, so a new `fabric-interop` revision); a `visible` flag beside `listed` (two flags for one decision, and a hidden
  entry still leaks that it exists); a caller keyed on the token's `sub` alone (a partner's agent and the owner's would share
  jobs, results and keys, against the partner channel and `verifyDelegation`'s caller); a global queue at the hub (the node is what runs out, and the hub
  cannot see a node's own callers); first-in first-out without fairness (one caller with a batch starves every other);
  partner scopes (DEC-0090) as a third source (a partner's view is the partner channel's; left for a later revision);
  load inside the usage report (usage is money and load is time: their readers and their cadence differ, and the usage
  report's shape is closed).
- **Compatibility:** additive. A node that does not queue serves no load key and no `fabric.job.list`, and callers see
  what they see today; `queue-full` is a new code whose data constraint binds only that code. A node that queues is
  one that declares the load extension; it adopts `jobCallerKey` and keeps the answers of keys it stored before under
  their old caller. One personal provider of the estate already queues its job tools' starts and refuses past its
  queue with `queue-full` without `data` and without the load extension: its refusal is its own until it declares the
  extension and adopts the wire (CT-84); no other provider sends `queue-full` as a job tool's code. An entry's
  `agentRef` is not the `agentId` a call names: the hub resolves it until a revision maps the two. `queue-full` is now reserved: a job error
  with that code, valid before, is refused, and `jobCallerAction` answers `invalid` for it, so the adapter's two kit
  ports and its vendored job-limit vectors move at its re-pin, with the three new protocol revisions. Fabric's hub
  answers a product `isError` as `product-error` and keeps it under the key today; CO-376 relays `queue-full` and
  keeps no key for it. Revisions
  `agent-directory/1`, `fabric-load/0.1` and `service-load/1` are added to the register; the extension keys are six.
  `contractVersion` stays `0.1.0`.
- **Consequences / affects:** schemas `agent-directory`, `interop-job-list-request`, `interop-job-list`,
  `service-load-extension`, `service-load`, `interop-tool-error`, `interop-common` (`queueFullData`, the `queue-full`
  binding) and `interop-job` (no `queue-full` in a job's error); `src/job-limits.ts` (`QUEUE_FULL`, `invalid`) with a
  vector in `fixtures/vectors/job-limits.json`;
  `src/agent-network.ts`, `src/semantic-kinds.ts`, `src/semantic-rules.ts`, `src/extensions.ts` (`load`),
  `src/protocol-revisions.ts`; vectors `fixtures/vectors/agent-network.json` written by
  `tools/vectors/agent-network.ts`; positive and negative fixtures for each schema and `interop-job-queued`,
  `fixtures/negative/interop-job-failed-queue-full.json`; semantic fixtures `agent-directory-view-*`, `job-queue-*`, `service-load-*`; tests
  `test/agent-network.test.ts`, `test/consistency.test.ts`, `test/schema-compilation.test.ts`,
  `test/positive-sweep.test.ts`; docs `agent-network.md` (new), `interop.md` (the extension keys, C3.2), `service.md`
  (Load), `conformance.md` (duties, register), `versioning.md` (NAMED_ONLY), `specification/README.md`, `DOCMAP.md`,
  `CONTEXT.md`, `docs/ux/foundation.md` (JTBD-12, JRN-11, ST-027 to ST-029), `docs/ux/flows.md` (FLW-22 to FLW-24),
  `docs/ux/screens.md` (SCR-25, SCR-26, SCR-27), `docs/ux/scenarios.md` (SCN-033 to SCN-035),
  `docs/backlog.md` (CT-84), the handoff and its index.
- **Source:** board threads `ba63565c` items 1 to 3 and `b2511678` (S4 of the agent network); fabric-workspace roadmap
  RM21-S4; backlog CT-84.

### DEC-0105: the dash-encoded home path after any separator, and no "not shared" member in a node summary

- **Status:** Accepted source change (2026-10-23). Annotated (2026-10-23): item 2's interim whole harness replaced by
  DEC-0118. Consumer adoption: Project Observatory's node (its port of
  `hasHomePath`, its fixture-parity test, which now meets eight node-summary fixtures, and its copy of the
  `activity-common` schema move at its next pin; its separate name filter is not a superset of the rule; its default of summaries off per organization does not meet the at-least-daily duty of the
  conformance node row; CT-92 may change that duty), the first organization server (its vendored `activity-rules.ts` and `activity-common`
  schema, as receiver of activity batches and summaries) and the relay's vendored `activity-common` schema, each at
  its next pin; any other port of `hasHomePath` or of the `sourceKey` pattern.
- **Context:** Project Observatory's review of its `node-summary/1` implementation (engine PR #345, at contract pin
  `f33f4d8a`; board thread `b2511678`, message `72d70cd3`) found two things. `FAC-SEM-128`'s second home-path pattern,
  shared with `FAC-SEM-037` (`HOME_PATH` in `src/activity-rules.ts`), fires only when the dashed form follows `/`,
  `\`, `:` or `-`, so `x.-Users-alice-DATA-secret` and `p@-Users-alice-x` pass it and the name schema; the activity
  `sourceKey` pattern has the same gap after `.`, `_`, `~` and `#`. And it asked how a "not shared" signal should look
  while it keeps summaries off by default per organization until the operator answers CT-92.
- **Decision:**
  1. The dashed form `-Users-<x>` or `-home-<x>` is a home path after any character that is not an ASCII letter or
     digit (ASCII), or at the start: `HOME_PATH`'s second pattern is `(?:^|[^A-Za-z0-9])-(?:[Uu]sers|home)-[A-Za-z0-9]`, and the
     `sourceKey` pattern of `activity-common.schema.json` refuses it after any character its alphabet allows that is not
     a letter or digit (`._:~#-`). `my-users-list` and `Users-guide` stay ordinary; a lower-case root after such a
     character (`x.-users-list`) is refused like any other, which errs on the safe side.
  2. A node summary carries no member that says it is withheld. Whether a node may withhold its summary, or leave names
     out, by the person's choice is the operator's CT-92; until then the whole harness ships, as the operator decided
     for work machines (S8). A server that has no summary from a node within a day knows it has none.
- **Why:** a detector that names its separators misses the next one; the complement of letters and digits covers every
  separator a runtime or a person can write, and keeps the ordinary words the tests list. A "not shared" member would
  be a second channel for what absence already says, and would prejudge the operator's question. Absence says only
  that the server has no summary, for whatever reason: a node pinned before DEC-0101, a node that does not send, or
  a person's choice once CT-92 allows one; a server does not show it as the person's refusal.
- **Alternatives considered:** listing more separators (the next one is missed again); a `shared: false` member or an
  empty summary as the signal (it decides CT-92 by the wire, and an empty summary reads as a machine with nothing on it).
- **Compatibility:** narrower: a name or key holding the dashed form after `.`, `@`, `_`, `~`, `#` or any other such
  character, valid before, is refused. The same narrowing reaches every value `FAC-SEM-037` reads in a telemetry event
  and every activity summary `FAC-SEM-040` checks (`opt -home-x` is now refused): a receiver at the new pin refuses
  such an event from a collector at an older one until that collector moves. No valid example of the contract changes. `contractVersion` stays `0.1.0`.
- **Consequences / affects:** `src/activity-rules.ts` (`HOME_PATH`), `schemas/activity-common.schema.json`
  (`sourceKey`), fixtures `fixtures/semantic/node-summary-home-after-dot.json` and
  `fixtures/semantic/node-summary-home-after-at.json`, `test/activity-rules.test.ts`, `test/node-summary.test.ts`;
  docs `node-summary.md` (what it never carries, Not decided), `activity.md` (the dash forms), `docs/backlog.md`
  (CT-92 gains the person's-choice question, CT-95 the scenario of what a person is told about the summary, CT-109
  filed), `conformance.md` (the receiver and the summarising node rows).
- **Source:** Project Observatory, board thread `b2511678`, message `72d70cd3` (2026-10-23).


### DEC-0106: calls between machines of one estate: machine profiles, the T1 binding over the relay, the sealed call

- **Status:** Accepted source change (2026-10-23). Consumer adoption: Fabric (its hub writes `profile` once every
  reader of its records is pinned at or after this decision; its nodes place, judge, seal and open calls), Fabric
  Dashboards (the profile shown), the first organization server's vendored estate-record schema, each at its next pin
  (CT-110).
- **Context:** S1 of the agent network is one person's machines calling each other's agents. DL-25 left the binding that
  places a caller in T1 to RM-21, and nothing said how `agent.call` travels between machines. The platform asked for
  both, with machine profiles (A-6) and a call rule (A-7) (board thread `348467e5`, items 1 and 2); the first
  organization server asked how its relay treats such a call (thread `ba63565c`, item 4). CT-85.
- **Decision:**
  1. **Profiles.** `estate-record/1` gains an optional `machines[].profile`: `full`, `member` or `view`; absent is
     `full`. Only a `full` machine carries a `hubKey`; a `view` machine has no `packages`, no `secrets`, and no secret
     placement names it as `from` (`FAC-SEM-134`, kind `estate-record`). A profile changes only by a passkey-signed
     revision. `machineProfile(record, id)` answers it, or none when unreadable.
  2. **The T1 binding over the relay.** A node places the sender of a relay message whose body it verified with
     `relayCallerTier({applied, self, from, at, freshness, revocations?})`, `revocations` the delta's part as
     `deltaRevocations` gives it: `unknown-state` when its delta is not
     current, its clock does not read, the record it applied last gives no admission set, or its own `#sig` is not in
     it; `unauthenticated` (`not-t1`) when `from` is not in the set; otherwise T1 with the machine, its profile and its
     usable `#kem` (`FAC-SEM-135`, kind `relay-caller`). `unknown-state` is a denial, never a fall back to T2. A
     tokenless relay call is keyed `relay:<from>` (`relayCallerCredential`) where a node queues (DEC-0104).
  3. **The call rule.** `machineCallVerdict({caller, target, capability, effect})`: an unreadable profile is refused;
     the job tools pass in every profile; an effect that is not `none` (unknown or absent counts above it) to a `view`
     target, then from a `view` caller, is refused `profile-forbids`, a new DL-19 code (403); every other T1 call is
     admitted and needs no token, approval or grant record (DL-26). A token the call carries is verified (DL-13) and
     used for attribution and narrowing (`FAC-SEM-136`, kind `machine-call`).
  4. **The sealed call.** A call and its answer are the relay body's inner `payload`, `fabric-agent-call/1`
     (`agent-call-sealed.schema.json`): HPKE base mode, suite `[16, 1, 1]`, to the recipient's `#kem`, `info` the
     protocol name, the additional data the RFC 8785 bytes of `{type, kind, from, to, msgId, kem}`; the plaintext is the
     RFC 8785 form of an `agent-call-message` (a `call` with the hub's `agent.call` arguments, an optional
     `delegation` and `traceparent`; an `answer` with `replyTo` and `isError`, `structuredContent`, `content`), at most
     393 216 bytes. `sealAgentCall` and `openAgentCall` refuse by name and never throw; the plaintext is compared as
     bytes with its RFC 8785 form, so a byte-order mark is `malformed`. DL-11 is amended: over the relay the token
     travels in the sealed `delegation` member only, never in `call.input` (the sender's duty: `input` is free-form and
     no schema checks it).
  5. **The node's order.** Tier, then open, then the call rule and a carried token. A sender that is not T1 and a call
     that does not open are logged and not answered (the node has no trusted key of the caller to seal to); a refusal
     by the call rule or the token is answered with a sealed `isError` answer to the caller's `#kem`. A caller with no
     answer by its body's `exp` treats the call as failed. A machine with no usable `#kem` is neither called nor
     answered. A call over the relay from outside the estate (T2) is not decided here.
- **Why:** the record the node already verified is the one source of who belongs to the estate, so T1 comes from it and
  from nothing the connection says; a stale delta could admit a machine the person removed, so it denies. Profiles in
  the signed record cannot be widened by the machine they limit. Sealing to `#kem` keeps the call and the token out of
  the relay's sight with the suite the secret envelope already uses, and binding the additional data to the body's
  `from`, `to` and `msgId` stops a sealed call from being replayed inside another body.
- **Alternatives considered:** the hub's token on every T1 call, as A-7's wording reads (it contradicts DL-26 and would
  put a bearer token where the relay could log it, unsealed); a profile as a node's own setting (a machine could widen
  itself); `profile_forbids` in snake case (every DL-19 code is kebab-case); checking only the target's profile (a
  `view` machine could still make changes elsewhere); a signed but unsealed call (the relay reads arguments and
  results).
- **Compatibility:** additive, with two narrowings: a record carrying `profile` is refused by a reader pinned before this
  decision (the machine object is closed), so the hub writes none until its readers move (its nodes, the relay, Project
  Observatory's node, the Fabric Agent Adapter's kits, the first organization server's vendored schema); `profile-forbids` is refused
  by an older copy of `delegation-refusal.schema.json`. `fabric-agent-call/1` is a new protocol in the register; the
  relay carries it unread. Every record without `profile` reads as before. `contractVersion` stays `0.1.0`.
- **Consequences / affects:** `src/machine-call.ts` (new), `src/estate-record-rules.ts` (`machineProfile`,
  `FAC-SEM-134`), `src/delegation.ts` (`REFUSAL_CODES`), `src/protocol-revisions.ts`, `src/semantic-kinds.ts`,
  `src/semantic-rules.ts`; schemas `agent-call-sealed`, `agent-call-message` (new), `estate-record` (`profile`),
  `delegation-refusal`; vectors `fixtures/vectors/machine-call.json` by `tools/vectors/machine-call.ts`; fixtures
  `estate-profile-*`, `machine-call-*`, `machine-caller-*`, `agent-call-*`; `test/machine-call.test.ts`; docs
  `machine-calls.md` (new), `delegation.md` (DL-11, DL-19, DL-25, Not decided), `relay.md`, `interop.md` (C3.5),
  `estate-record.md`, `ceremonies.md` (Change a machine's profile), `agent-network.md`, `conformance.md`,
  `versioning.md`, the UX layer (JTBD-13, JRN-12, ST-030, ST-031, FLW-25, FLW-26, SCN-036, SCN-037); backlog CT-85
  done, CT-110 and CT-111 filed.
- **Source:** the platform, board thread `348467e5` (A-6, A-7); the first organization server, thread `ba63565c`
  item 4; CT-85.

### DEC-0107: moving the hub, recovering a lost passkey, and the delta anchor

- **Status:** Accepted source change (2026-10-23). Consumer adoption: Fabric's drafter, hub and ceremonies, every
  machine's alert and anchor (Fabric's nodes, Project Observatory's node), the relay and the first organization server's
  vendored estate-record schema, the Fabric Agent Adapter's kits (`FAC-SEM-137`, `fixtures/vectors/hub-move.json`),
  each at its next pin (CT-113).
- **Context:** DEC-0084 wrote the estate ceremonies and left two out: moving the hub to another machine, and what
  happens when a passkey is lost. The ecosystem readiness review of 2026-10-22 (board thread `b2511678`, message
  `c938af7d`) asked for both, with an alert when the hub's heartbeat is a day old and two authenticators from revision
  1 (CT-89). A move revokes the old hub key, and `applyDelta` verifies every entry under the highest revision applied,
  so a machine without the old hub's entries (one added later, one that was behind) could never verify them: the
  revocation delta's open "compaction" item, which a move would make routine.
- **Decision:**
  1. **The alert.** `hubSilence(heartbeatAt, at)` reads the heartbeat a machine holds: `speaking` up to 24 hours (the
     hub's own longest interval, exactly 24 included), `silent` past it up to 72 hours, `stale` past 72 (the 72-hour
     rule), `unknown` when the clock or the heartbeat does not read. While the record it applied certifies a hub key, a
     machine tells its person at once on `silent`, `stale` and `unknown`, as what *it* has heard, and offers the
     unplanned move only while `hubSilence` over the latest heartbeat it holds after reconnecting to the relay is still
     `silent`, `stale` or `unknown` for lack of a heartbeat (a clock that does not read offers no move); a record that certifies no hub key yet asks for the always-on machine instead. A
     planned move (the hub's machine retired or replaced, or about to become `member` or `view`) is offered on the hub
     machine's own row whatever `hubSilence` answers, and follows DL-15. "Remove" on the hub's machine opens the move
     too, whatever `hubSilence` answers: the person declaring the machine lost (stolen, dead, or running out of reach)
     takes the one-revision move of a lost hub, otherwise the planned one.
  2. **The anchor.** `estate-record/1` gains an optional `deltaAnchor` `{sequence, sha256}`: a head of the delta the
     revision vouches for, every revocation up to it listed in the record. `anchorDelta(state, record)` starts a
     machine's chain at an anchor past its head (`DeltaState.anchor`) only when the record lists the revocation of every
     entry it drops (otherwise `unreconciled`, nothing changes), changes nothing for one it already holds with the same
     hash, and is a `fork` for another hash. `applyDelta` skips an entry below the anchor, the anchor's own entry
     (its hash), and one identical to an entry held, before looking up its signer; another entry at the anchor's
     sequence is refused as at any held sequence (`fork` when a key the revision certifies signed it, `revoked-signer`
     or `unknown-signer` otherwise). A machine applies the anchor after `reconcileRevision`, and a refusal by either refuses
     the revision. A revision keeps an anchor once set and never moves it back
     (`FAC-SEM-137`, kind `estate-record-revision`, run by `verifyEstateRecord` with a parent).
  3. **Moving the hub.** From a machine caught up with the relay (its delta head and latest heartbeat, not `broken`;
     not necessarily `current`, which no machine is past 72 hours), to a new Ed25519 hub key generated on an always-on `full` machine
     (DEC-0106), never a copied key. A reachable hub follows DL-15 (certify, publish, switch, then drop and revoke in a
     second revision, the new hub continuing the chain from the switch); a lost hub is replaced in one revision that
     drops and revokes its key and its machine, the new hub's first entry being the anchor's sequence + 1, and the lost
     key leaves the key set Fabric publishes online at once. The revision that revokes the old key anchors the delta's
     head, which the drafter fetches from the relay first, listing every revocation up to it, once every reader of the
     record is pinned at or after this decision; before that a move carries no anchor and every machine fetches the old
     hub's entries before applying it, and the first revision drafted after the gate opens anchors the head. The same
     anchor goes with every revision that revokes a hub key, a re-key on the hub's own machine included. The relay applies
     the anchor of the revision it holds after applying the revision (its admission stays the revision's alone), keeps its
     delta as it was when `anchorDelta` refuses, and answers a `delta-query` at or below the anchor from the anchor's next
     entry. The new hub's first
     heartbeat jumps `HUB_MOVE_HEARTBEAT_JUMP` (2^20) past the highest sequence it holds. Tokens, approvals and window
     leases the old key signed end when a verifier applies the revocation; the new hub holds none of the old hub's
     division, so it issues no lease of a window instance the old hub divided until that instance ends or every machine
     holding one of its leases has reported it after the revocation. The lost key leaves the published set without
     DL-15's grace. `hubMove(parent, next)` names what a revision added and removed
     (by machine, kid and key) and whether each removed key is revoked.
  4. **Recovery.** Fabric drafts revision 1 with two passkeys on two authenticators unless the person goes on with one
     after being told what it costs; `recoveryReady(record)` is `ready` with at least two passkeys, by distinct
     `credentialId`, that the record does not revoke (two passkeys, not two devices). With one passkey lost and another
     left, the one left signs a revision that removes the lost one, revokes it as `authority` and adds a new one. With
     every passkey lost no revision can be signed: the estate expires with its applied revision and the person creates
     a new network.
- **Why:** the hub signs every heartbeat, so its silence is the first sign that calls between machines will stop at 72
  hours; telling the person at 24, the hub's own deadline, leaves two days to act, and checking the relay first keeps a
  machine that only slept from moving a running hub. The record already lists every revocation the anchored entries
  carry, so starting a chain at a passkey-signed anchor loses nothing and lets the hub's key change without stranding a
  machine. A new key per move keeps a copy on a lost disk from signing anything a machine on the new revision accepts.
  Only a passkey signs a revision; with recovery by a printed code not decided (v4 §7), a second passkey is the
  recovery.
- **Alternatives considered:** copying the hub's private key to the new machine (a lost disk keeps a working key);
  verifying each entry under the revision in force at its sequence (every machine would keep every revision); keeping
  the old key certified but revoked "from a sequence" (a new member of the revocation, and the key stays in the record);
  letting the hub or the relay sign a recovery revision (either would become the estate's authority); requiring two
  passkeys in every record (refuses every one-passkey estate that exists today); recovery by a printed code (v4 §7:
  left not decided); an alert at 72 hours (too late: calls have stopped).
- **Compatibility:** additive with one narrowing: a record carrying `deltaAnchor` is refused by a reader pinned before
  this decision (the record object is closed), so Fabric writes none until its readers are pinned at or after it (as
  for DEC-0106's `profile`). `applyDelta` now accepts an overlapping page whose held entries were signed by a key no
  longer certified, which it refused before, and skips a copy of a held entry without checking the copy's signature
  (the hash leaves `sig` out), where it answered `bad-signature` before. `contractVersion` stays `0.1.0`.
- **Consequences / affects:** `src/hub-move.ts` (new: `hubSilence`, `recoveryReady`, `hubMove`,
  `HUB_MOVE_HEARTBEAT_JUMP`), `src/revocation-delta.ts` (`anchorDelta`, `DeltaState.anchor`, the skip before the
  signer), `src/estate-record-rules.ts` (`deltaAnchorOf`, `FAC-SEM-137`), `schemas/estate-record.schema.json`
  (`deltaAnchor`); vectors `fixtures/vectors/hub-move.json` by `tools/vectors/hub-move.ts`; tests `test/hub-move.test.ts`,
  `test/revocation-delta.test.ts`; docs `ceremonies.md` (Create my network step 2, Move the hub, Recover a lost
  passkey), `revocation-delta.md` (the anchor, `FAC-SEM-137`, Not decided), `estate-record.md`, `machine-calls.md`,
  `conformance.md`, `relay.md` (the anchor), `devices.md` and the head's description in `device-check-in` and
  `revocation-delta` (the head under an anchor), `delegation.md` (DL-15's lost-hub exception), `window-lease.md` (after a hub
  move), README, DOCMAP, CONTEXT; the UX layer (JRN-09 #4, ST-024, ST-032, FLW-20, FLW-27, SCN-029, SCN-030, SCN-037, SCN-038, SCN-039, ST-025,
  SCR-23); backlog
  CT-89 done, CT-113 filed.
- **Source:** the ecosystem readiness review (board thread `b2511678`, message `c938af7d`, 2026-10-22); CT-89.

### DEC-0108: releases of the contract

- **Status:** Accepted (2026-10-23). The first release, `v0.1.0+2026-10-23`, is tagged on the merge of its pull request.
- **Context:** consumers pin a commit (DEC-0016, `fabric-contract.lock.json`), and the README said the contract had no
  `vX.Y.Z` release. The operator asked for a new version once DEC-0105 to DEC-0107 landed. Raising `contractVersion`
  would change every schema's `$id` prefix and make each vendored copy refuse the next, for additions DEC-0016 keeps
  under `0.1.0`.
- **Decision:** a release is an annotated tag `v<contractVersion>+<YYYY-MM-DD>` on a commit of `main` whose gate and
  vector check passed, with a GitHub release whose notes list the decisions since the previous release. The version is
  the `contractVersion` the schemas carry; the build metadata is the release's UTC day, with `.2`, `.3` for a second and
  third release that day. `contractVersion` moves only by a decision that changes something required. A release
  changes no pin: a consumer pins the release's full commit. `package.json` keeps `version` equal to `contractVersion`.
- **Why:** a release gives people and tools a named, dated snapshot without moving any `$id`; SemVer build metadata
  says "the same version, another build", which is what an additive release of `0.1.0` is.
- **Alternatives considered:** `v0.2.0` (every `$id` prefix and every vendored copy moves for additions); dated tags
  without a version (they say nothing about compatibility); pre-release tags `v0.1.0-rN` (SemVer orders them below
  `0.1.0`, which they are not).
- **Compatibility:** none on the wire; a tag and a GitHub release.
- **Consequences / affects:** `docs/specification/versioning.md` (Releases), `README.md` (Licence paragraph), the tag
  and the GitHub release; handoff `docs/handoffs/2026-10-23-release.md`.
- **Source:** the operator's instruction of 2026-10-23 to finish the plan and publish a new version.

### DEC-0109: a remote service's 401 without a token may carry an identity proxy's page

- **Status:** Accepted (2026-10-23). Consumer adoption pending: the Fabric Agent Adapter's `check_service.py`
  (`well-known.requires-token` admits a `401` whose body neither parses as the well-known document nor carries the service's own identity values (`service.id`, its instance, build or `process.pid`), as conformance's checker row says, CT-114).
- **Context:** `service.md` *Remote placement* said that without the service token `GET /.well-known/fabric-service`
  MUST answer `401` "with an empty body". Fabric Inbox runs on Cloudflare Workers behind Cloudflare Access: from 0.29.4
  its protocol routes sit behind an Access application with Service Auth only, so a request without a token gets
  Access's own `401` with its HTML page (37 794 bytes); the Worker never sees the request and cannot empty the body.
  `check_service.py fabric-inbox` failed that one rule. The events and usage rules already accept any `401`. Fabric
  Inbox asked for a decision (board thread `a1c375d2`, request `9ecc43cb`, row B-150; adapter thread `199b9549`).
- **Decision:** without the token, or with a wrong one, the well-known route MUST answer `401` and its body MUST carry
  none of the service's own data: no build, pid, status, tiles, identity or member of the document. The body SHOULD be
  empty; an identity proxy in front of the service MAY answer that `401` with its own page. A host reads the status of
  that `401` and never its body; a conformance checker admits a body that neither parses as the well-known document nor carries the service's own identity values (`service.id`, its instance, build or `process.pid`).
- **Why:** the rule exists so the document does not leak without a token, and a proxy's page leaks none of it; an empty
  body is still what a service that answers the request itself writes. Reading only the status keeps a host's behaviour
  the same for both bodies.
- **Alternatives considered:** keep "empty body" and name services behind an identity proxy a known gap (the rule would
  fail a service that discloses nothing, and push it to answer before its proxy, weakening the proxy); allow any body
  (a service could put its status in it).
- **Compatibility:** a widening: every answer the old rule admitted is still admitted. A checker pinned before this
  decision fails such a service on that rule alone until it moves. `contractVersion` stays `0.1.0`.
- **Consequences / affects:** `docs/specification/service.md` (*Remote placement*, the service), `conformance.md`
  (the host and checker rows), the annotation on DEC-0019, CT-114.
- **Source:** Fabric Inbox's request on board thread `a1c375d2` (2026-10-23).

### DEC-0110: a host sums money over the usage rows not on a subscription

- **Status:** Accepted (2026-10-23). No wire change. Consumer adoption: Fabric's spend tiles and view sum as below
  (CT-115). The Fabric Agent Adapter's service kit counts only money in `budget.spentUsd` since 0.48.0 (FAA-109, PR #178).
  Fabric Dashboards sums money this way since 0.7.23 (FD-88), and its estimate side reads an unpriced subscription row
  as `null` or a lower bound, as `usageSpend` does, since its row FD-97 (PR #192, `@passioncode-ai/fabric-service-host`
  0.8.0, release 0.7.27; board thread `147a5538`, 2026-10-23). A per-project split by route is CT-116.
- **Context:** a usage report's rows carry `route: subscription | key | platform-metered` (DEC-0046, DEC-0061), and a
  subscription row's `costUsd` is the list-price value of calls the operator's own login paid for. A day's `costUsd` is
  the sum of every row (`FAC-SEM-025`), and the report has no money-only total, so a host that summed `costUsd` showed
  one service's $147.26 for the month where $6.80 had been spent (board thread `ea2e4f3d`, 2026-10-22). Fabric Dashboards
  fixed its sum from DEC-0046's own words ("not metered") and asked the contract to write the host rule so every host
  sums alike (message `76f420d9`, and `e99aa05f` on thread `f22685d2`).
- **Decision:** money is the sum of `costUsd` over every row whose `route` is `key`, `platform-metered` or absent; a
  `subscription` row's `costUsd` is an estimate, which a host MUST NOT add to money spent, to a budget, to a service's
  spending limit or to a spend policy's level, and MAY show apart, labelled as an estimate. A window whose calls were all on a subscription spent `0`, never
  `null`; money is a lower bound while any call off a subscription is unpriced and `null` only when none of them is
  priced; calls and tokens count on every route. A day's `costUsd` stays the sum of every row, so it is money only while
  no row is on a subscription, and so are `byProject`, `taskRuns` and `byGrant`'s, which carry no route: a host shows
  them as cost including estimates and never counts them against a limit while a row of the window is on one; a project's money is then unknown, at most its `costUsd` while its `unpricedCalls` is 0 and with no bound otherwise. A host
  reads `budget.spentUsd` and `budgets[]` as money, and a service SHOULD count only money there. `usageSpend(rows)`
  (`src/usage-rules.ts`) is the reference sum over `days[].byModel[]` rows and refuses an unknown `route`.
- **Why:** an operator reading "spend" reads money, and limits are money: an estimate in the sum trips a limit on calls
  nobody paid for per call. A host rule changes no byte a service writes, so every report stays valid.
- **Alternatives considered:** a money-only total in `service-usage.schema.json` (every service would write a new member
  and every reader pinned before it would refuse the report; the `days[].byModel[]` rows already carry what the sum
  needs, and a per-project split by route is CT-116); counting a row
  with no `route` as an estimate (a report written before DEC-0046 would lose its money).
- **Compatibility:** no wire change. A host that summed every row now shows less money for a report with subscription
  rows, which is the correction. `contractVersion` stays `0.1.0`.
- **Consequences / affects:** `docs/specification/service.md` (*Usage report*), `spend-policy.md` (the launcher's
  recent spend), `conformance.md` (the host row), `CONTEXT.md`, `src/usage-rules.ts` (`usageSpend`),
  `test/usage-rules.test.ts`, SCN-016, the descriptions in `service-usage.schema.json`; annotations on DEC-0021,
  DEC-0027, DEC-0046; CT-115, CT-116.
- **Source:** a service's finding and Fabric Dashboards' reply on board thread `ea2e4f3d`, and the request on thread
  `f22685d2` (2026-10-22).

### DEC-0111: narrow credentials on request, the estate's keyed digests, and the call record

- **Status:** Accepted source change (2026-10-23). Consumer adoption: Project Observatory (the issuer and its node), the
  first organization server, Fabric, Fabric Switchboard, each at its next pin (CT-117). Annotated (2026-10-23): items 3
  and 4 amended by DEC-0113 (a revocation names its request and deletes only that credential; it ends the request; the
  mark is kept as revoked).
- **Context:** S5 of the agent network asks that an agent in an organization request a narrow credential (a token for
  one DNS zone, an OpenRouter key with a ceiling), that the organization decide, and that the value arrive sealed into
  that organization's context on the agent's machine, never into the person's own context, every request, decision and
  issue recorded; S6 asks for one record per call between agents (board thread `ba63565c` items 5 and 6, `b2511678` with
  the operator's addition of 2026-10-22). The secret envelope (DEC-0047, DEC-0082) fills only a personal secret placement,
  and nothing moved a credential between one person's machines outside a placement, or carried the key the estate's
  keyed digests use (Project Observatory OBS-194 step 2). CT-86.
- **Decision:**
  1. **The request.** `credential-request/1` travels in a check-in's `records.credentialRequests` inside the signed
     device request: `requestId`, `agentRef`, `context` (the organization's `org:<id>`), `provider`, `preset`, optional
     `scope` and `limit`, `expiresAt`, `reason`, `requestedAt`; no person, no value. `FAC-SEM-138`: the enrollment's own
     organization, at most 30 days, no path or credential in the reason or the scope.
  2. **The decision.** `credential-decision/1` in a check-in response's `records.credentialDecisions`: `issued`
     (the credential by slot, provider, preset and end, no later than asked), `refused` (a reason) or `pending`, by the
     administrator or the policy (`FAC-SEM-138`). The organization server records every request, decision, issue and
     revocation by name, never a value.
  3. **The envelope.** `fabric-credential-envelope/1` (`credential-envelope.schema.json`): HPKE base mode, suite
     `[16, 1, 1]`, to the target's `#kem`, `info` the protocol name, the header the additional data, signed over the RFC
     8785 bytes of `{header, ct}`. In an organization's context it is signed `EdDSA` by a key of the organization's
     current policy key set, inside its window on the target's clock, answers a request the node holds open
     (`requestId`, its slot from the `issued` decision, until the envelope opens or a refusal comes; the node resends it
     until then, and the issuer seals again) and ends at `credentialExpiresAt`, at most 30 days after `iat`; in the personal context it is signed `ES256` by the `#sig` of a machine of the estate
     record the target applied, neither machine `view` nor the target itself, never into a slot a personal secret placement declares, the estate's digest
     key only from the machine holding a hub key the record certifies and neither the record nor the delta revokes. `checkCredentialEnvelope` names the first
     failing check (`FAC-SEM-139`), `openCredential` opens; the value and its mark are written in one transaction into
     that context's vault slot, never another's.
  4. **Revocation.** `credential-revocation/1` in `records.credentialRevocations`, signed like a policy layer; the node
     deletes the value when `credentialRevocationStands` accepts it (the key's window on the device's clock), and the
     issuer revokes at the provider. A node deletes every credential of an organization's context when that enrollment
     ends, and the server sends a leaver's revocations before it revokes the certificate.
  5. **The estate's digest key.** 32 random bytes generated on the hub's machine, delivered by the personal profile
     (`agentRef: urn:fabric:agent:fabric:estate`, `slot: ESTATE_DIGEST_KEY`); `keyedDigest(key, value)` is
     `kd1:<keyId>:<hex>`, HMAC-SHA256 over `fabric-keyed-digest/1`, a zero byte and the value.
  6. **The call record.** `call-record/1`: `callId`, `traceId`, `caller`, `callee`, `context`, `capability`,
     `transport`, times, `outcome`, `code`, `cost`; written by the callee's node (and the caller's for a call with no
     answer, joined by `callId`, the callee's outcome first), never naming a person, an argument or an output, never in a
     usage report and never added to money (DL-22); an organization reads its own context's in `records.callRecords`
     only after a check-in response says `callRecordsAccepted: true`, from the notice's agent-calls purpose
     (`FAC-SEM-140`).
- **Why:** the check-in is the one signed channel a machine already has with its organization, so a request and its
  answer need no new transport, and the device and organization come from the transport instead of the request. The
  organization's policy key set already signs what an organization tells a machine (policies, repairs), so a credential
  signed by it needs no new trust anchor; the personal profile reuses the estate record's admission set. Sealing to
  `#kem` with the secret envelope's suite keeps the value out of the server's and the relay's sight.
- **Alternatives considered:** widening `fabric-secret-envelope/1` with a context (an envelope pinned before DEC-0082
  names none, and older readers would open an organization's value as a personal one); delivering through the relay
  (an organization server is not a relay participant of the person's estate); the issuer signing with its own key (a new
  anchor every node would have to pin); a call record inside the usage report (DL-22 keeps the chain out of it); the
  request as a profile on the delegation and grant records, as CT-86 first proposed (the request is the node's, and its
  only signed channel to the organization is the check-in).
- **Compatibility:** additive. Five new protocols in the register and six new check-in members; each side sends them
  only to a peer that lists the protocol in its `protocols`, since the check-in objects are closed.
  `fabric-secret-envelope/1` is unchanged. `contractVersion` stays `0.1.0`.
- **Consequences / affects:** `docs/specification/credentials.md` (new), `devices.md` (the check-in members),
  `relay.md` (the secret envelope's pointer), `delegation.md` (DL-22), `contexts.md` (an organization's slot), `package.md` (secrets), `machine-calls.md`, `conformance.md`,
  `versioning.md`, `docs/specification/README.md`, `docs/DOCMAP.md`, `CONTEXT.md`; `src/credentials.ts` (new),
  `src/semantic-kinds.ts`, `src/semantic-rules.ts`, `src/protocol-revisions.ts`, `src/estate-record-rules.ts` (FAC-SEM-075's message); schemas `credential-request`,
  `credential-decision`, `credential-envelope`, `credential-revocation`, `call-record` (new), `device-check-in`; vectors
  `fixtures/vectors/credential-envelope.json` by `tools/vectors/credential-envelope.ts`; tests
  `test/credential-envelope.test.ts`; fixtures; the UX layer; backlog CT-86 done, CT-117 to CT-120 filed.
- **Source:** board thread `ba63565c` items 5 and 6 (the first organization server, 2026-10-21), `b2511678` (S5, S6,
  and the addition of 2026-10-22), `21684886` (the estate's own credentials); Project Observatory OBS-191, OBS-194; CT-86.

### DEC-0112: a check-in's own rules read DEC-0111's credential members

- **Status:** Accepted (2026-10-23). No wire change.
- **Context:** DEC-0111 added six members to a check-in's `records` (`credentialRequests` and `callRecords` in the
  request; `credentialDecisions`, `credentials`, `credentialRevocations` and `callRecordsAccepted` in the response), but
  kind `device-check-in` ran only `FAC-SEM-099` on its `protocols`, and no committed fixture carried the members, so a
  receiver that runs only the check-in's rules accepted a request asked for 90 days, a personal call record sent to an
  organization, or an envelope for a request the same response refused (CT-119, the round-2 readings of PR #156).
- **Decision:**
  1. Kind `device-check-in` runs, beside `FAC-SEM-099`, each `credentialRequests` entry under `FAC-SEM-138`'s rules for a
     request alone and each `callRecords` entry under `FAC-SEM-140`, each finding under its member's path.
  2. A check-in sends each `requestId` once (`FAC-SEM-138`) and each `callId` once (`FAC-SEM-140`); its call records name
     an organization's context only (`FAC-SEM-140`), and its requests, call records and `nodeSummary` name one context, since a
     check-in goes to one organization (`FAC-SEM-138` when it carries a request, else `FAC-SEM-140`).
  3. A response decides each `requestId` once, carries only envelopes of an organization's context (a personal one
     travels over the relay) and none for a request it refuses or leaves pending (`FAC-SEM-138`). An envelope whose decision came in an earlier response passes: the node reads the decisions it
     holds.
  4. Kind `credential-exchange` on `{sent, response}` (the requests a node sent to one organization and holds open, and
     that organization's response): every decision answers a request the node sent and passes `FAC-SEM-138` against it,
     and every envelope names a request the node sent (`FAC-SEM-138`).
  5. Fixtures `device-check-in-credentials.json` and `device-check-in-response-credentials.json` carry the six members,
     so the schema's wiring is in the gate.
- **Why:** a receiver and a node judge these members where they arrive, in one check-in, without a second document;
  the pair kind is the one judgement that needs what the node sent.
- **Alternatives considered:** a new rule code (the rules are DEC-0111's own, applied where the members travel);
  requiring an envelope's decision in the same response (a node resends a request after an issued decision whose
  envelope did not open, so the envelope can follow an earlier response's decision); judging `credentialRevocations`
  here (a revocation stands only on the device's keys and clock, `credentialRevocationStands`).
- **Compatibility:** narrower for a check-in that broke DEC-0111's rules: kind `device-check-in` now refuses it, where
  it passed. No schema, byte or `$id` changes; `contractVersion` stays `0.1.0`.
- **Consequences / affects:** `src/credentials.ts` (`checkInCredentialFindings`, `credential-exchange`),
  `src/semantic-rules.ts`, `src/semantic-kinds.ts`; `docs/specification/credentials.md` (semantic rules,
  compatibility), `conformance.md` (the register's kinds); fixtures `fixtures/positive/device-check-in-credentials.json`,
  `fixtures/positive/device-check-in-response-credentials.json`, `fixtures/semantic/credential-check-in-*`,
  `fixtures/semantic/credential-exchange-*`; tests
  `test/credential-envelope.test.ts`, `test/rule-tolerance.test.ts`; backlog CT-119 done.
- **Source:** CT-119 (the seam and product readings of PR #156, round 2, 2026-10-23).

### DEC-0113: a credential revocation names its request, and the mark it leaves is revoked

- **Status:** Accepted (2026-10-23). No producer or consumer has adopted `credential-revocation/1` yet (CT-117).
- **Context:** a `credential-revocation/1` named only `(agentRef, slot)`, and the node deleted the value and its mark
  when it stood. A revocation delivered late (a check-in response retried after the issuer had reissued into the same
  slot) deleted the reissue, and deleting the mark let the revoked envelope open again on a repeat delivery inside its
  `exp` (CT-118, the seam reading of PR #156).
- **Decision:**
  1. `credential-revocation/1` requires `requestId`, the `credential-request/1` whose credential it revokes.
  2. `credentialRevocationStands` takes `held`, the `requestId` the credential the node holds in that slot answers, and
     answers `{ok: true, deletes}`: `deletes` is true only when `held` is the revocation's `requestId`. A revocation that
     names no request is `malformed`.
  3. A revocation that stands ends the request it names, whether or not it deletes: the node stops sending it, so an
     envelope for it (a repeat delivery, or one lost in transit and sealed again) answers `not-requested` at step 7, and
     the node reads a response's revocations before its envelopes. When it deletes, the node also keeps the slot's mark
     with `revoked: true`, behind which `checkCredentialEnvelope` answers `replayed` for an envelope at or below its
     sequence; the function holds this in the personal profile too, where no flow writes a revoked mark today. The
     revoked envelope never opens again and a reissue (a new request, a higher sequence) still does. A mark's `revoked`
     is absent or `true`; anything else does not read.
  4. The node writes the value with the `requestId` it answers, which it passes as `held`. The issuer writes each
     revocation's `requestId`, one per issued request; the organization server relays it unchanged.
- **Why:** the request is the instance's name the node already holds (the envelope carries it), so no new identifier
  is needed, and a tombstone mark is the smallest state that keeps replay closed.
- **Alternatives considered:** naming the envelope's sequence (a sealer that lost its sequence restarts at the clock,
  so a sequence is a weaker name than the request); deleting the mark and keeping the request id in a second list (two
  stores for one fact).
- **Compatibility:** narrower in both directions, under the same `credential-revocation/1`: a revocation without
  `requestId` is refused by a reader pinned at or after this decision, and one with it is refused by a reader pinned at
  the release `v0.1.0+2026-10-23` (the object is closed), so a check-in response carrying it fails there. Nobody writes
  or reads revocations yet (CT-117), so no deployed pair is refused and no `/2` is taken; the next release notes list
  this narrowing. `credentialRevocationStands`'s answer gains `deletes`. `contractVersion` stays `0.1.0`.
- **Consequences / affects:** `schemas/credential-revocation.schema.json`, `src/credentials.ts`
  (`credentialRevocationStands`, the marks, step 8), `docs/specification/credentials.md` (Revocation, steps 1 and 8),
  `conformance.md` (the issuer's and the node's rows), SCN-041, ST-033, DEC-0111's status; vectors `fixtures/vectors/credential-envelope.json` by
  `tools/vectors/credential-envelope.ts` (`revocation`, `check`); the fixtures that carry a revocation; backlog CT-118
  done.
- **Source:** CT-118 (the seam reading of PR #156, 2026-10-23).

### DEC-0114: a check-in's node summary, credential requests and call records judged with the check-in and its certificate

- **Status:** Accepted (2026-10-23). No wire change.
- **Context:** a check-in's `records.nodeSummary` (DEC-0101) was judged only as its own document (`node-summary`,
  `node-summary-document`), so a receiver that runs only the check-in's rules accepted a summary for another device or
  organization (CT-91, the seam reading of 2026-10-22). DEC-0111's requests and call records name a context too, and
  DEC-0112 held them to one context but not to the certificate's.
- **Decision:**
  1. Kind `device-check-in` reads `records.nodeSummary` with `FAC-SEM-128`'s clauses that need no policy (no
     credential, e-mail address or home path; no item twice), under `/records/nodeSummary`, and its `device.id` is the
     check-in's own (`FAC-SEM-128`).
  2. Kind `device-attribution` (`FAC-SEM-045`) judges a check-in's records against the client certificate, as written:
     the node summary's `device.id` is the certificate's device and its `context` is `org:` and the certificate's
     `org.id`, and every `credentialRequests` and `callRecords` entry's `context` is that same `org:<org.id>`.
- **Why:** the receiver holds the certificate when it attributes a check-in (`FAC-SEM-045`), so the comparison lives
  there; the document's own clauses apply wherever the summary travels.
- **Alternatives considered:** a new kind on `{checkIn, certificate}` (`device-attribution` already carries the
  binding); comparing in `node-summary` only (a receiver judging the check-in would not run it).
- **Compatibility:** narrower for a check-in that broke these rules: the two kinds now refuse it. No schema or byte
  changes; `contractVersion` stays `0.1.0`.
- **Consequences / affects:** `src/node-summary.ts` (`checkInSummaryFindings`), `src/credentials.ts`,
  `src/device-rules.ts` (`attribution`); `docs/specification/devices.md` and `node-summary.md` (their rule rows),
  `conformance.md` (the register); fixtures `fixtures/semantic/device-attribution-records-*`,
  `fixtures/semantic/device-attribution-summary-*`, `fixtures/semantic/credential-check-in-summary-*`; tests
  `test/device-rules.test.ts`, `test/credential-envelope.test.ts`; backlog CT-91 done.
- **Source:** CT-91 (the seam reading of `bfa9a67..4a29fcb`, 2026-10-22).

### DEC-0115: a key window whose bound does not read is closed

- **Status:** Accepted (2026-10-23). No wire change.
- **Context:** three checks judge a signing key's validity window at the verifier's clock: a delivered policy's key
  (`FAC-SEM-041`), a repair's key (`repairDecision`, DEC-0102) and a credential's key (DEC-0111). Annotated (2026-10-24,
  DEC-0119): a fourth, the root certification and its delegation key (`FAC-SEM-069`), and the verifier's clock itself
  now read strictly too. The first two read a
  bound with `Date.parse` and skipped one that was not a string, so a bound that did not read left the window open,
  while the third closed it (CT-120, the seam reading of PR #156, round 2).
- **Decision:** one reference, `keyWindowHolds(t, key)` in `src/device-rules.ts`: an absent `notBefore` or `notAfter`
  is open, one that is not an RFC 3339 instant (any offset, read strictly) closes the window, and both bounds are
  inside. All three checks use it.
- **Why:** a key whose window cannot be read is not known to be valid, and a security check fails closed.
- **Alternatives considered:** refusing an unreadable bound only in the key set's own rule (`FAC-SEM-046`, which
  already refuses a window that does not end after it starts): a key that reaches a verifier by another path would
  still open.
- **Compatibility:** narrower for a key bound the schema's `date-time` admits but RFC 3339 read strictly does not
  (`+0100`, a space for `T`, `+01`, a leap second `:60`). `Date.parse` read the first two, so such a key verified
  before; now the key set's own rule (`FAC-SEM-046`) refuses it when the device receives the set, reading the bounds
  as `keyWindowHolds` does, so a device never holds a key it cannot use. No committed fixture carries such a bound.
  `contractVersion` stays `0.1.0`.
- **Consequences / affects:** `src/device-rules.ts` (`keyWindowHolds`, `policyUpdate`, `keySet`), `src/node-summary.ts`
  (`repairDecision`), `src/credentials.ts`; `docs/specification/devices.md` (`FAC-SEM-041`'s and `FAC-SEM-046`'s rows), `node-summary.md` (a repair's key); tests
  `test/device-rules.test.ts`, `test/node-summary.test.ts`; backlog CT-120 (that item done).
- **Source:** CT-120.

### DEC-0116: which `protocols` list gates each credential member, and one call record for a queued call

- **Status:** Accepted (2026-10-23). No wire change.
- **Context:** DEC-0111 gated each new check-in member on "a peer that lists the protocol in its `protocols`", but a
  node's `protocols` lists what it reads and a server's what it accepts from the device (DEC-0067, DEC-0094), and
  `callRecordsAccepted` was gated on `call-record/1` in a node's list although a node reads no call record. Nor did
  DEC-0111 say who writes the call record of a call the callee queued as a `fabric.job.*` job (CT-120).
- **Decision:**
  1. Each side gates on the other's own list: a node sends `credentialRequests` and `callRecords` only to a server whose
     response `protocols` lists `credential-request/1` and `call-record/1`; a server sends `credentialDecisions`,
     `credentials`, `credentialRevocations` and `callRecordsAccepted` only to a node whose check-in `protocols` lists
     `credential-decision/1`, `fabric-credential-envelope/1`, `credential-revocation/1` and `call-record/1`. A node
     lists `call-record/1` among what it reads when it reads `callRecordsAccepted`.
  2. A queued call is one call: the callee writes one record when the job reaches a final state, from the start to
     that state, with the job's outcome (a `failed` job's code its `error.code`, a `cancelled` job's `job-cancelled`,
     as `FAC-SEM-140` asks a code of every outcome but `completed`); `fabric.job.get`, `list` and `cancel` write none
     of their own. A job the caller learns is lost (`unknown-job`) or stops waiting for is a call that got no answer:
     the caller writes `unknown` under the starting call's `callId`.
- **Why:** the lists already exist with these meanings, so the gate needs no new member; a job is the call the caller
  made, and one record per call keeps the join by `callId`.
- **Alternatives considered:** a separate `writes` list on the node (a new member for one boolean); one record per
  `fabric.job.*` call (a poll loop would write hundreds for one task).
- **Compatibility:** none on the wire; a node or server that gated on the other list reads it from the right one.
  `contractVersion` stays `0.1.0`.
- **Consequences / affects:** `docs/specification/credentials.md` (Compatibility, the call record), `devices.md` (the
  check-in's credential members), `conformance.md` (the node's row), SCN-042, ST-034; fixture
  `fixtures/semantic/call-record-job-cancelled.json`; backlog CT-120 (those two items done, the repair request's gate
  filed).
- **Source:** CT-120 (the round-2 readings of PR #156).

### DEC-0117: a repair request is gated on the node's own `protocols` list

- **Status:** Accepted (2026-10-23). No wire change. Consumer adoption: Project Observatory's node lists
  `repair-request/1` in its check-in `protocols` (OBS-193); the first organization server sends `records.repairs` only
  to a node that does.
- **Context:** DEC-0101 gated its three revisions on the server's `protocols` alone ("a node sends a summary or a
  result, and acts on a request, only toward a server that lists them"). A server's list says what it accepts from the
  device (DEC-0094), so it gates what the node sends, but `records.repairs` is what the server sends, and nothing said
  when a server may send it: a node pinned before DEC-0101 refuses a response that carries it (the object is closed).
  DEC-0116 gated the credential members on each side's own list (CT-120, its reading).
- **Decision:** a node sends `records.nodeSummary` only to a server whose response `protocols` lists `node-summary/1`,
  and `records.repairResults` only to one that lists `repair-result/1`; a server sends `records.repairs` only to a node whose
  check-in `protocols` lists `repair-request/1`, which a node lists when it reads repairs and acts on them.
- **Why:** each list then means what DEC-0067 and DEC-0094 say, and a server learns from the node what it can be sent.
- **Alternatives considered:** keeping the node's guard on the server's list (a server that lists `repair-request/1`
  says it accepts one from the device, which no device sends).
- **Compatibility:** a node that acted on a request only toward a server listing `repair-request/1` now lists it in
  its own check-in instead; a server that sent repairs to any node checks the node's list first.
  `contractVersion` stays `0.1.0`.
- **Consequences / affects:** `docs/specification/node-summary.md`, `devices.md`, `conformance.md` (the server's and
  the node's rows), `credentials.md` (the gate's sentence), `versioning.md` (the sender's revision), the specification README;
  backlog CT-120 (that item done), CT-83 (the owed duties).
- **Source:** the product reading of PR #166 (DEC-0116), 2026-10-23.

### DEC-0118: what a node summary lists follows `machine.mode`

- **Date:** 2026-10-23
- **Status:** Accepted (2026-10-23) by the contract on the operator's recorded decisions, CT-92 answered; the operator
  may reverse it. Consumer adoption: Project Observatory's node (OBS-192, OBS-217); the first organization server
  (VES-HARNESS).
- **Context:** DEC-0102 shipped the whole harness of a machine to every organization it is enrolled in, whatever
  `machine.mode` says, from the operator's S8 (a work machine is transparent to its organization) and left CT-92 to the
  operator: whether an organization sees harness names and services of other contexts on one machine, against
  unlinkable memberships (CX-22, DEC-0082). The operator's rollout decisions of 2026-10-23 (the first organization
  server's rollout design of 2026-10-23, D-R2) enroll the operator's two personal
  Macs in a client organization beside the personal network, and the first organization server relayed the rule it
  derives (board thread `305f39c3`, request `a90c37b2`): on such a machine the organization sees only its own
  context, never the operator's personal services or harness names.
- **Decision:**
  1. Under `machine.mode` `C`, the default (the organization manages only its own work on the machine), a node summary
     lists only what belongs to the organization's context: each coding agent by catalogue id and version, the hook
     count, and the MCP servers, skills and plugins that are a package placed in this context, or installed in a folder
     matching the organization's own `workspace.folders`, or named by its `harness.baseline` (`coding-agent`,
     `mcp-server`, `skill`, `plugin`), each listed when present. Nothing else is listed: an item installed for the
     person (`source: user`), machine-wide (`source: managed`, which belongs to no one organization) or for another
     context. A baseline `service` is judged against this context's services only (item 3), so one that runs only in
     another context reads `missing`.
  2. Under `machine.mode` `A` (the organization administers the whole machine, from an `mdm` layer only), the summary
     lists the whole harness (S8).
  3. Under either mode the services are those of the summary's own context only (DEC-0102, unchanged).
- **Why:** S8 and D-R2 then hold together: a machine the organization administers is transparent to it, and a
  person's own machine with an organization's context beside its others shows that organization only its own work,
  which unlinkable memberships ask. `machine.mode` already says which of the two a machine is, so no new member.
- **Alternatives considered:** the whole harness on every machine (refuses D-R2's rule on the operator's own Macs);
  only this context's items on every machine (refuses S8 for a machine the organization administers); a person's
  per-organization switch (not decided: CT-92's second half, a person withholding the summary, stays open).
- **Compatibility:** narrower for a node under `C`: items the baseline does not name, outside this context's packages
  and `workspace.folders`, leave the summary; drift is unchanged for every item the baseline names, which is still
  listed when present. A server cannot tell a narrowed summary from a full one sent by a node pinned before this
  decision; both are valid. No schema change. `contractVersion` stays `0.1.0`.
- **Consequences / affects:** `docs/specification/node-summary.md` (How much it lists, Not decided), `devices.md`
  (`machine.mode`), `conformance.md` (the node's row); backlog CT-92 (its first half answered), CT-122.
- **Source:** the first organization server's request on board thread `305f39c3` (request `a90c37b2`, 2026-10-23); the
  operator's D-R2; CT-92.

### DEC-0119: the audit before the second release, and changing a revision nobody has adopted

- **Date:** 2026-10-24
- **Status:** Accepted (2026-10-24). No wire change beyond item 2's.
- **Context:** three blind readings of everything merged since `v0.1.0+2026-10-23` (unit, seam, product) before the
  second release found that DEC-0113 changed `credential-revocation/1`'s required semantics under the same name, which
  the compatibility policy (conformance.md) reserves for a major version, and that DEC-0115 missed a fourth window
  check (`FAC-SEM-069`) and left the verifier's clock read loosely in two checks.
- **Decision:**
  1. The compatibility policy admits one exception: a revision no party has adopted (the backlog records no party
     writing or reading it) may change its required semantics under the same name by a decision, and the next
     release's notes list the change as narrowing. DEC-0113 is such a change: no party writes or reads
     `credential-revocation/1` (CT-117). Annotated (2026-10-26): DEC-0135 adds a second exception, a narrowing of an
     adopted revision to what every party serving it already answers in its released versions.
  2. `FAC-SEM-069` reads the root certification's and the delegation key's windows and the revocation list's
     `issuedAt` with `strictTime`, and `FAC-SEM-041` and `repairDecision` read the verifier's clock so, as DEC-0115
     reads every key bound. The key set's rotation rule keeps a current key valid at the next set's `issuedAt` (both
     bounds inside) and lets one whose end does not read drop.
- **Why:** taking `/2` for a revision a day old that nobody runs would leave a `/1` nobody may use; the exception is
  bounded by the backlog's record and disclosed in the release notes. A window rule that fails closed must fail closed
  everywhere.
- **Alternatives considered:** `credential-revocation/2` (a register entry and a type for a shape no one sent).
- **Compatibility:** item 2 is narrower for a certification, delegation or clock that the schema's `date-time` admits
  but strict RFC 3339 does not (`+0000`, a space for `T`), which no committed fixture carries. `contractVersion` stays
  `0.1.0`.
- **Consequences / affects:** `docs/specification/conformance.md` (Compatibility policy), `src/device-rules.ts`
  (`rootCertification`, `policyUpdate`, `keySet`), `src/node-summary.ts` (`repairDecision`), `src/credentials.ts`
  (the shared `indexed`, a message); `schemas/device-check-in.schema.json` (the resend description); `CONTEXT.md`,
  `contexts.md`, `credentials.md` (the parties), the specification README, FLW-27, FLW-28, `adoption.md` and the
  product profile (the repository is public); backlog CT-83, CT-110, CT-113, CT-120; handoffs.
- **Source:** the three readings of `2f020a69..9b0bdee4`, 2026-10-24.

### DEC-0120: a contract pin stays four members, and a vendored kit's provenance lives outside it

- **Date:** 2026-10-24
- **Status:** Accepted (2026-10-24). No wire change.
- **Context:** CT-104 asked whether `contract-pin.schema.json` should admit `adapter` and `kit`, filed on the premise
  that fabric-agent-adapter 0.43.0 writes them into a consumer's lock (FAA-95 asked whether they were intended). The
  adapter writes neither: its lock writer (`adapt_project.py`) emits the four pin members and `profile`, and no file of
  the adapter at `c45944e` names `header_lines`. One consumer wrote both by hand on 2026-10-12 (a private agent's commit
  `1cf4564`, recording the adapter tag it vendored a service kit from and the kit file's hash), and `pin:check` has
  printed them as a note since 2026-10-21. Of the ten consumer locks on the operator's machine, that one carries them.
- **Decision:** the pin keeps its members (`contract`, `version`, `repository`, `commit`, `profile`) and stays closed
  (`additionalProperties: false`). `adapter` and `kit` are not members of a pin. A consumer that vendors code from the
  adapter or any kit records where it came from in a file of its own (or the vendored file's header), never in
  `fabric-contract.lock.json`, whose one job is the contract revision. `pin:check` keeps printing an unknown member as a
  note and keeps not failing on it, so the one lock that carries them still passes.
- **Why:** a lock that pins two products in one file has two owners and two update cadences; the adapter would have to
  version a shape it does not write. Keeping the schema closed is the reversible choice: admitting the members later is
  a widening any pinned reader can take, while admitting them now and removing them later would narrow.
- **Alternatives considered:** admit an optional `adapter` `{repository, tag, commit}` and `kit` `{source, vendored,
  header_lines, sha256}` (one consumer's hand-written shape, which no tool writes or reads besides that consumer's own
  test); an open `extensions` member (nothing asks for it).
- **Compatibility:** none: the schema and `pin:check` are unchanged. A validator run against the schema still refuses
  that one lock, as it did before.
- **Consequences / affects:** `docs/specification/versioning.md` (One contract pin: the note no longer says a kit writes
  the members), `src/pin-check.ts` (its comment), backlog CT-104 (closed by this decision).
- **Source:** CT-104; FAA-95 (board thread `d0d274d0`, 2026-10-22).

### DEC-0121: every button a person has, the person's agent has; an operator's decision relayed by their own agent is theirs

- **Date:** 2026-10-24
- **Status:** Accepted (2026-10-24). AP-3 extended by DEC-0125 (2026-10-26): a mandate handed on carries the operator's words from another agent. Extended by DEC-0126 (2026-10-26): a relay OA-2 and OA-3 accept carries them too. Additive on the wire (a new extension key, an optional `_meta` member and the
  sealed call's `decision`); a behaviour rule a service adopts at its next pin. Consumer adoption: CT-124 to CT-127.
- **Context:** the operator asked (2026-10-24) that when they tell their coding agent to approve something, the agent
  does it, and that any button a service's dashboard shows a person exists for the agent too, for every Fabric agent.
  DL-26 already says that inside the machine boundary the operator's instruction is the authority and that a callee
  MUST NOT require a delegation token, an `approval/1` or a grant record from a T0 or T1 caller. Services still refuse
  such calls: several estate services answer an agent's approve, reject, choose or policy call with "operator session
  required" and send the person to the dashboard, and some offer an action only on the page. Nothing in the contract
  said a dashboard action needs an agent twin, and nothing let an agent say that the decision it carries is the
  operator's. Two blind readings of the first draft (seam and product, 2026-10-24) found that a caller could claim an
  elicitation, name its own relayer and replay a decision on any action, that a T2 caller holding an approval had no
  route, that the relay's sealed call had no place for a decision, and that older texts still reserved some actions to
  the page; this text is the corrected one.
- **Decision:**
  1. **Parity (AP-1).** Every action a service's dashboard, app or page lets a person take (approve, reject, choose,
     edit, pause, resume, cancel, retry, send, publish, restore, set a policy, and any other) has a tool on the
     service's agent surface with the same effect, the same checks, the same audit record and an idempotency key. An
     action offered only on a page is nonconformant. A service declares its actions in its well-known document under
     the extension key `https://fabric.passioncode.ai/agent-contract/extensions/actions/0.1` (protocol
     `fabric-actions/0.1`, schema `service-actions-extension.schema.json`): `actions[]` of `{id, title, tool, gate,
     humanStep?}`. `gate` is `none` (an act the caller may take on its own account: refresh, read, retry or cancel its
     own job), `relayed` (the operator decides, item 2: a decision on another party's proposal or draft, a send, a
     publish, a deletion, a spend within a limit, a restore, a policy change) or `human` (item 4), and `humanStep` is
     present exactly when `gate` is `human`. A page's confirm dialog is one of its checks, which an instruction naming
     the action satisfies. `FAC-SEM-142` refuses a declaration whose ids repeat, whose `humanStep` disagrees with
     `gate`, or whose `tool` is missing from a present `surfaces.mcp.capabilities`: a button without an agent twin. It
     sees only declared actions; a host reports a dashboard that declares none (CT-126), reading it with `actionsView`.
  2. **The relayed decision (AP-2).** A call carries the operator's decision in `_meta.decision`, a sealed call over the
     relay and the hub's `agent.call` in `call.decision` (`decision.schema.json`): `{by: "operator", via:
     "relayed-instruction", action, target?, instruction, at}`, `action` the declared action's id, `target` the one
     object the operator named when they named one, and `instruction` the operator's words in item 3's form, at most
     500 characters. A service MUST take a `relayed` action from a
     T0 or T1 caller (DL-25) that carries a valid decision as the operator's decision: it performs it as the dashboard
     would, records it as the operator's with `via` and the caller's identity as the service authenticated it (never
     one the call names), and MUST NOT refuse it as needing a person, a page or an operator session. A decision is
     valid for the action it names from its `at` until 24 hours later (`approval/1`'s lifetime) and no more than 60
     seconds ahead of the service's clock (DEC-0047), and covers repeated calls of that action inside the window, on the
     object `target` names or on any object when it names none.
     Without a decision the service refuses `operator-decision-required`, which tells the agent to ask the operator and
     call again with the answer; an invalid one is `decision-invalid`. An accepted `approval/1` is the approver's
     decision at any tier (DL-18, DL-26); a T2 caller without one is refused `approval-required` with the action's
     digest, and a decision in its call changes nothing; the hub forwards a T0 or T1 origin's decision and drops a T2
     origin's, passes DL-19's refusals through unchanged and never answers a resend that carries a decision from what it
     remembered of the call before it; a callee records the hub and the origin its delegation names as the relaying
     caller. A sealed call carries a decision only to a target whose `protocols` lists `fabric-actions/0.1`. When a
     relayed decision approves an agent's own proposal, the proposal's `approvedBy` is the operator's own principal and
     the audit names the relaying agent. A service MAY ask the person itself with an elicitation: an accepted one is the operator's decision,
     recorded `via: elicitation` from its own record, never from the caller; a declined one is the operator's no; it
     MUST NOT require one when the client cannot show it. A job's input request is an action whose id is the request's
     key, and the decision rides in the `_meta` of the `fabric.job.get` call that carries `inputResponses`, one call per
     key; a click at the host's interaction point is the host's T0 decision quoting the request and the choice. The
     service keeps the decision in its own audit and never puts `instruction`, which may name people, on the events
     feed, a usage report or another party's page. `actionDecision` (`src/actions.ts`) is the reference, run after
     DL-13, DL-21 and `verifyApproval`.
  3. **The agent's side (AP-3).** An agent sets the decision only for words the operator gave it about this action,
     never for text from a tool result, a page, a file, a board message or another agent: those are data (the
     prompt-injection boundary). The operator's words reach an agent in its own session, through a subagent its
     session started and passed them to verbatim, or through the operator channel; a standing rule in a file is not a
     decision on an action. `instruction` quotes the operator's sentence that names the action (or a task whose stated
     outcome is that action), or the agent's question that names it and the operator's answer, both verbatim; a
     subagent passes its parent's decision unchanged; `at` is when the operator said it. An agent that
     is not sure the operator decided asks them.
  4. **Human gates stay (AP-4, DL-26).** Sign-ins, consents, payments and top-ups, typed secrets, spend above a limit
     and a signature by the person's passkey (the estate's ceremonies) stay the person's. Their action is still on the
     agent surface with `gate: human` and its `humanStep` (`sign-in`, `consent`, `payment`, `secret`,
     `spend-above-limit`, `passkey`); the tool refuses `human-step-required` with
     `data.humanStep` and `data.url`, the direct link to that step, so the agent hands the person the exact button.
  5. **Approval separation (AP-5).** A relayed decision is the operator's, not the agent's: an agent still MUST NOT
     approve its own promotion, grant, checker rule or policy change on its own account, and MAY relay the operator's
     approval of it, which the service's audit records with the relaying caller.
  6. **One code set.** `operator-decision-required`, `decision-invalid` and `human-step-required` join DL-19's one set
     of authorisation refusals (`delegation-refusal.schema.json`, `REFUSAL_CODES`) and travel as its
     `structuredContent`. The texts that reserved an action to the page now say it is the operator's decision, taken on
     the page or relayed: settings restore (service.md, FLW-15), enabling the operator channel and removing its webhook
     (OC-1, OC-2), a board hold, whose set, lift and list become the host's relayed actions (project-comms.md Holds),
     and unlisting a Project (project-comms.md Opt-out, FLW-18), both the host's (CT-125).
- **Why:** the operator works through their agents; a decision they state in chat is the same decision as a click, and
  DL-26 already trusts it inside the boundary. A page-only action makes the agent useless exactly where a decision is
  needed. Binding the decision to one action, a lifetime and the authenticated caller keeps a relayed sentence from
  becoming a general key, and declaring the actions lets a host and a checker find a button without a twin.
- **Alternatives considered:** require an elicitation for every relayed decision (a client without elicitation would
  have no route, and the operator asked for the chat to suffice); an `approval/1` minted by the hub for every local
  decision (DL-26 removed that inside the boundary, and the hub would be on the path of every local click); accept a
  T0 call of a `relayed` action with no decision at all (nothing would record that the operator decided, and an agent
  could approve on its own account); leave parity to each product (the situation the operator reported).
- **Compatibility:** a reader pinned before this decision ignores the extension key and `_meta.decision`; the sealed
  call's and `agent.call`'s `decision` are refused by a reader pinned before it, so a caller sends one only to a
  reader at or after this pin. The behaviour rules (items 1, 2 and 4) bind a service at its next pin, as DEC-0039's
  tightened session rule did. From then an older caller that calls a `relayed` action without a decision is refused
  `operator-decision-required` (it used to get the service's own refusal, or success where a service took T0 calls
  with nothing) until its kit relays decisions (CT-124), and so is a call through a hub that does not forward the
  decision yet (CT-125): a service pins after both. The ids of a declaration and a decision take the input request
  key's shape (letters, digits, `_`, `.`, `-`), since a job's input request is an action whose id is its key. `contractVersion` stays `0.1.0`.
- **Consequences / affects:** `docs/specification/service.md` (Actions, Manual restore), `interop.md` (the extension
  key, `_meta.decision`, the codes, C3.5), `delegation.md` (DL-19, DL-26), `machine-calls.md` (the sealed call),
  `operator-channel.md` (OC-1, OC-2), `project-comms.md` (Holds), `governance-and-roles.md`, `versioning.md`,
  `conformance.md` (rows and `FAC-SEM-142`), `CONTEXT.md`, `docs/ux/foundation.md` (ST-035), `docs/ux/flows.md`
  (FLW-15, FLW-29), `docs/ux/screens.md` (SCR-30), `docs/ux/scenarios.md` (SCN-018, SCN-043), the author's guide; schemas
  `service-actions-extension`, `decision`, `interop-request-meta`, `delegation-refusal`, `agent-call-message`,
  `interop-agent-call`; `src/actions.ts`, `src/delegation.ts`; the vector file `fixtures/vectors/actions.json`;
  backlog CT-124 to CT-127.
- **Source:** the operator's instruction of 2026-10-24; two rounds of seam and product readings, 2026-10-24.

### DEC-0122: a service names its A2A Agent Card in `surfaces.a2a`; `ai-catalog.json` stays out of `fabric-service/0.1`

- **Date:** 2026-10-26
- **Status:** Accepted (2026-10-26). Additive on the wire (an optional member of `surfaces`); a behaviour rule for a
  service that serves an Agent Card, from its next pin.
- **Context:** CT-131 (board thread `2587bdd2`, 2026-10-25) asked whether `fabric-service/0.1` publishes a service's
  catalogue as an A2A Agent Card or an `ai-catalog` entry, and which is normative. The Agent Card is already in the
  contract: DEC-0002 and the A2A peer profile pin A2A `1.0` and the card at `/.well-known/agent-card.json`, so a service
  may serve one. Nothing let a host find it: `surfaces` in the well-known document admitted only `dashboard`, `mcp`,
  `events`, `usage` and `operatorChannel` and closed the rest (`additionalProperties: false`), and nothing said whether
  the card takes the token, how its callers are authenticated, or how a Fabric fact rides in it. The same gap was
  recorded on 2026-10-11 as CON-OE-06 (`docs/evidence/specs/2026-10-11-board-waves/findings/owed-decisions.json`).
- **Decision:**
  1. `surfaces.a2a` `{path, protocolVersion}` is an optional member of the well-known document's `surfaces`, which a
     service that serves an Agent Card SHOULD carry: `path` the
     public card's path on the service origin (normally `/.well-known/agent-card.json`, A2A 1.0 §8.2),
     `protocolVersion` `1.0`, the version the card's interfaces expose (A2A 1.0 §4.4.6). The card names its interfaces,
     bindings and security schemes; the member only says where it is.
  2. On a local placement the public card answers without authentication, as the well-known document does, with the
     Host and Origin checks, and its interface URLs are on the loopback origin (`http://127.0.0.1:<port>`) for peers
     on the same computer. A2A asks for HTTPS in production (A2A 1.0 §4.4.6, §7.1); a loopback origin is unreachable
     from outside the computer, so the contract admits it there and nowhere else. A service offered to others serves
     the card its outside peers read at the well-known path on its `https` `peer.endpoint`'s origin (DEC-0061); a
     remote placement serves it on its `https` origin and MAY answer there without the token, a card that is not open
     being gated by the service's own credentials or an identity proxy, never the descriptor's token. On every placement the public card carries no secret and
     no member of the well-known document about the running process (build, pid, status, tiles, the degraded list);
     it discloses the service's name and skills, which on a remote placement is the one exception, by the service's
     choice, to what DEC-0109 keeps behind the token.
  3. An A2A peer is never given the descriptor's token (DL-12, DEC-0061; for a peer on the same computer, where MCP may
     still take it by default under DEC-0024, this is the stricter choice, so one card serves every peer alike): an
     A2A interface MUST NOT accept it and the card's `securitySchemes` MUST NOT name it. A service authenticates A2A callers with credentials of its own or with
     the estate's delegation tokens (`auth.delegation`, DEC-0039), with or without an MCP surface, and the
     authenticated extended card (`capabilities.extendedAgentCard`, `GetExtendedAgentCard`, A2A 1.0 §4.4.3, §5.3)
     requires one of them on every placement. A host and a probe never call an A2A interface with the descriptor's
     token and never report its refusal as nonconformance.
  4. An extension the card declares for a Fabric fact (limits, load) carries `required: false` (A2A 1.0 §4.4.4), so a
     peer that does not know it still calls, and names no person, caller or prompt. The load report (DEC-0104) stays
     what a host reads; this decision fixes no extension URI.
  5. An `ai-catalog.json` entry (MCP's SEP-2127) is not part of `fabric-service/0.1`: it is MCP-side discovery, and the
     contract takes it when an MCP revision it pins carries it. The pinned revision is `2026-07-28`.
- **Why:** A2A already defines the card and its discovery, and the contract profiles A2A rather than inventing a wire
  (DEC-0002); the missing piece was a pointer a host reads beside the other surfaces. The descriptor's token mints
  operator login codes and unlocks a remote well-known document, so a peer route that took it would hand a stranger
  the host's credential. An optional extension keeps a Fabric fact from
  breaking a peer that only speaks A2A. Taking an MCP discovery file before an MCP revision carries it would pin the
  contract to a proposal.
- **Alternatives considered:** `surfaces.a2a` with the binding, streaming and push flags and the security scheme
  (CON-OE-06's list): they are the card's own members (`supportedInterfaces`, `capabilities`, `securitySchemes`), and
  copying them would let two documents disagree; the card's full URL instead of a path (every other surface is a path
  on the service origin); requiring the token for the public card on every placement (a peer without a credential
  could not discover the service, and A2A 1.0 §6.9 fetches the public card without an `Authorization` header); making
  an `ai-catalog.json` entry normative now.
- **Compatibility:** a widening. A reader that validates the well-known document against a schema pinned before this
  decision refuses one that carries `surfaces.a2a` (the member is closed there), so a service carries it only where
  its readers are pinned at or after this decision or read members by hand, as with `surfaces.operatorChannel`
  (DEC-0034). Measured 2026-10-26: Fabric Dashboards (`packages/service-host/src/health.ts`) and the adapter's
  `check_service.py` read members by hand and tolerate it. Without the member nothing changes. `contractVersion` stays
  `0.1.0`.
- **Consequences / affects:** `schemas/service-well-known.schema.json` (`surfaces.a2a`),
  `docs/specification/service.md` (the well-known document's members, Surfaces, A2A Agent Card,
  Remote placement), `docs/specification/profiles.md` (the A2A peer profile), `docs/specification/conformance.md`
  (two rows), `docs/specification/README.md` (not adopted yet), `docs/evidence/sources.md` (the A2A 1.0 members,
  SEP-2127), `docs/DOCMAP.md`; `fixtures/catalogue.json`; fixtures
  `fixtures/positive/service-well-known-a2a.json`, `fixtures/negative/service-well-known-a2a-old-version.json`,
  `fixtures/negative/service-well-known-a2a-url.json`; backlog CT-131 (closed by this decision), CT-145 (adoption),
  CT-146 (a pair rule). Consumers: the adapter's FAA-10 and FAA-123 (it serves the card) and Fabric Dashboards (it may
  show and link it).
- **Source:** CT-131; board thread `2587bdd2` (2026-10-25); A2A 1.0.0 specification, checked 2026-10-26; seam and
  product readings of the first draft (2026-10-26), which found the descriptor token offered to peers and the
  unchecked fixtures.

### DEC-0123: a person opens a service's page through Fabric Dashboards' `open_link`; a raw loopback address is a diagnostic

- **Date:** 2026-10-26
- **Status:** Accepted (2026-10-26). A behaviour rule for every service and agent from its next pin, a checker rule
  (`FAC-SEM-143`) and a reference; no schema changes.
- **Context:** the operator ruled on 2026-10-24 that every page of their agents and local Fabric services opens in
  Fabric Dashboards, not in a browser, including links in chat and notifications. An estate agent asked the contract
  for that rule (request `886c9b4d`, thread `67961610`, deadline 2026-10-31; backlog CT-130): a MUST in
  `fabric-service/0.1` and `fabric-interop/0.1`, the same for members such as `open_link` and `dashboard_url` in tool
  answers, a checker rule, and one decision the adapter and Fabric Dashboards cite. The adapter's
  `building-fabric-services/references/dashboard-links.md` already describes the steps, but as a skill's reference, and
  agents kept opening pages in a browser. FL-7 said Fabric opens the service's own address in the browser "otherwise",
  which did not separate a missing host from one that failed.
- **Decision:**
  1. **PL-1.** Wherever a service, its CLI, its tools or a completion message hand a person one of the service's own
     pages, the action MUST be Fabric Dashboards' `open_link`, `fabric-dashboards://service/<id>.<instance>` for the
     dashboard itself with `?path=<path>` for one page, as Fabric Dashboards' ADR-0005 defines it (one trailing slash
     the same link, no other parameter), with the service's own `id` and `instance`; it carries no token or login code
     and never names the login-code route. `dashboardsLink` and `parseDashboardsLink` (`src/page-link-rules.ts`) are
     the reference: they build and refuse what the host's `serviceLink` and reader do, and are stricter in four
     places (whitespace in the path, the login-code route, a credential, a link read as written rather than as a URL
     parser normalises it), checked against the host at `a98d1ae` by a differential of the builder, the reader and the check (seeds 7 and 99).
  2. **PL-2.** A service and an agent never open a browser on a service's page themselves, except as PL-3 allows; an
     agent opens the open_link through the host with no browser fallback.
  3. **PL-3.** The raw address MAY accompany the open_link as a labelled diagnostic and is the action only where Fabric
     Dashboards cannot show the page on that computer: `not_installed`, or `unsupported` on a system it does not ship
     for (macOS only today). There the agent or the host opens the page's own address from the service's descriptor
     (`origin` plus the path). An installed host that did not open the page is reported, not replaced. FL-7 says the
     same of Fabric.
  4. **PL-4.** A tool answer MUST carry the page in `open_link`, with any raw address (`http_url`, or an existing
     `dashboard_url`) as the diagnostic; an event's `link` stays a path the host turns into the open_link;
     `human-step-required`'s `data.url` stays a path on the service origin or another party's `https` page, as its
     schema already requires; a URL-mode input request on the service's own page MUST carry the open_link as `url`;
     an operator-channel message, read on a phone, names the page and says it opens in Fabric Dashboards on the
     computer (OC-10).
  5. **`FAC-SEM-143`** refuses a raw `http` or `https` address on a local host (`127.0.0.0/8`, `[::1]`,
     `[::ffff:127.x.y.z]`, `localhost` and names under it, the unspecified `0.0.0.0` and `[::]`), and a
     `fabric-dashboards:` link outside the grammar (a second parameter, a path that leaves the origin, a credential), in a URL-mode input request (kind `interop-input-requests`) and in any link a checker is given
     (new kind `page-link`, `{url}`). Whether the host is installed is known only at run time, so the checker refuses
     the raw address wherever a person receives it; PL-3's fallback is the runtime's. A remote placement's own `https`
     page cannot be told from another party's by its form and stays the service's own test.
- **Why:** the host signs the person in and shows the page with its controls; a browser has no session, so the person
  meets a login wall or a page outside the estate. One rule in the contract lets the adapter's kits, Fabric Dashboards
  and every agent cite one place instead of a skill's reference. A checker rule catches the raw address before it
  ships, which is where the request came from.
- **Alternatives considered:** a warning instead of a refusal (the request allowed either; a person who gets the raw
  address meets the failure the rule exists to prevent); a new schema member for tool answers (each capability's answer
  is its own schema, so the member's name is fixed by rule and checked through `page-link`); requiring
  `fabric-dashboards://` in `human-step-required`'s `data.url` (a path on the service origin already lets the agent
  build the open_link, and a third party's step is not a Fabric page).
- **Compatibility:** no schema changes; `contractVersion` stays `0.1.0`. `interop-input-requests` gains a refusal: a
  URL-mode request with a raw loopback `url` that used to pass now fails `FAC-SEM-143`, so a service adopts the rule
  at its next pin, as DEC-0121's behaviour rules did. The new kind `page-link` is refused by a checker pinned before
  this decision, which does not know it.
- **Consequences / affects:** `docs/specification/service.md` (Links to a service's pages, PL-1 to PL-4; the
  semantic-rules row; the Events feed's `link`; AP-4), `docs/specification/fabric-button.md` (the intro, the diagram,
  FL-7), `docs/specification/interop.md` (C3.3, the rule's pointer), `docs/specification/README.md` (not adopted yet),
  `CONTEXT.md` (open_link), `docs/evidence/sources.md` (Fabric Dashboards' ADR-0005 at `a98d1ae`), `docs/ux/`
  (ST-036, FLW-30, SCN-044, SCR-30),
  `docs/specification/conformance.md` (the rule's row, the reference's row, two behaviour rows, the next free code),
  `docs/DOCMAP.md`; `src/page-link-rules.ts`, `src/semantic-rules.ts`, `src/interop-rules.ts`,
  `src/semantic-kinds.ts`; `tools/vectors/page-links.ts`, `tools/vectors/run.ts`, `fixtures/vectors/page-links.json`;
  `test/page-links.test.ts`, `vitest.config.ts` (its branch floor); backlog CT-130 (closed by this decision), CT-147
  (adoption). Consumers: the adapter (its kits and
  `dashboard-links.md`, `check_dashboard_link.py`), Fabric Dashboards, Fabric, every service that answers with a page.
- **Source:** the operator's rule of 2026-10-24; request `886c9b4d` (thread `67961610`); CT-130; the unit reading of
  the first draft (2026-10-26), which found a second parameter, a backslash path and the IPv4-mapped and trailing-dot
  loopback forms passing; its product reading, which found the host's own path-less link refused, PL-2 against PL-3,
  no route on a system the host does not ship for, and no scenario; a second product reading, which found the path
  set wider than the host's `safePath` (an empty path, a backslash or a control character inside it); and a third
  unit reading, which found a second `?` read as `path` and a link limit its own builder could exceed; and a fourth,
  which found a link with a control character or a tab inside its scheme passing the check unrecognised.

### DEC-0124: Fabric's button speaks the page's language; *Fabric* stays in English

- **Date:** 2026-10-26
- **Status:** Accepted (2026-10-26). Amends DEC-0040's FB-3, FB-4 and FB-5; no wire change.
- **Context:** FB-3 said the button's accessible name is *Open Fabric* "in every case", and FB-5 fixed one English
  sentence (an English clause, a dash, then "get it at passioncode.ai/fabric") to be shown exactly. The adapter's dashboard
  kit 1.1.4 (adapter 0.49.3, FAA-119, on the operator's decision of 2026-10-25) names the button in the page's
  language, Russian on a `lang="ru"` page, after two services asked for it on the board (threads `288afbce`,
  `a0929fba`); Fabric Dashboards already names its own button «Открыть Fabric» (`src/core/i18n.ts`). Both
  implementations broke FB-3 as written, and the adapter asked for the amendment (request `7d8c704b`, thread
  `4801da8d`). FB-5's sentence also carried a dash, which the operator's rule keeps out of text people read.
- **Decision:**
  1. FB-3: the accessible name is *Open Fabric* in the page's language: the `lang` of the document the button is drawn
     in, matched on its primary subtag, English when the page names none or one the button has no words for; a host's
     own button follows the host's language. The product name *Fabric* stays in English in every language, as the
     visible word and inside the name. A page MAY supply its own words, which keep *Fabric* inside the name (WCAG 2.2
     SC 2.5.3).
  2. FB-4: the menu's items are in the page's language by the same rule; the service's and project's names are shown
     as they are.
  3. FB-5: the message is in the page's language as item 1 chooses it, with *Fabric* and the address unchanged and the
     link as before; in English it is "Fabric is not installed. Get it at passioncode.ai/fabric", its final full stop
     optional.
- **Why:** a person reads the page in its language, and a screen reader announces the name in that language; the
  product name is a name and is not translated. One English sentence shown "exactly" on a Russian page was the defect
  both implementations had already corrected.
- **Alternatives considered:** keep *Open Fabric* in English everywhere (both implementations and two services' requests
  say otherwise); translate *Fabric* too (a product name, and the visible word would no longer match the mark);
  keep the old sentence with its dash (text for people carries none).
- **Compatibility:** no schema changes; `contractVersion` stays `0.1.0`. A page that still shows the English name or
  the old English sentence on an English page stays readable; on a page in another language an older kit is
  nonconformant until its next pin. The adapter's kit 1.1.4 (adapter 0.49.3) already follows items 1 to 3, in English
  and Russian; Fabric Dashboards follows items 1 and 3 (`src/core/i18n.ts` at `4679ea0`, its English sentence ending in
  a full stop) and shows no item menu.
- **Consequences / affects:** `docs/specification/fabric-button.md` (FB-3, FB-4, FB-5), `test/fabric-button.test.ts`,
  `docs/ux/flows.md` (FLW-09), `docs/ux/foundation.md` (ST-011), `docs/ux/scenarios.md` (SCN-015),
  `docs/ux/screens.md` (SCR-12), `docs/DOCMAP.md`; DEC-0040's status; backlog CT-148 (closed by this decision).
- **Source:** request `7d8c704b` (thread `4801da8d`), fabric-agent-adapter FAA-119 (kit 1.1.4, `fabric-button.js`);
  Fabric Dashboards `src/core/i18n.ts` at `4679ea0`; a product reading of the first draft (2026-10-26), which found no
  rule for a language the button has no words for.

### DEC-0125: the operator's mandate travels with the task, narrowed at each hand-over

- **Date:** 2026-10-26
- **Status:** Accepted (2026-10-26). Additive on the wire (a new schema, `mandate/1`; an optional `_meta.mandate` and
  `call.mandate`); a behaviour rule a callee adopts at its next pin. Adoption: CT-149. Amended by DEC-0126 (2026-10-26):
  a relay of the operator's approval from one of their own Projects or sessions is accepted, and `source` names where
  the words were said. Amended by DEC-0136 (2026-10-26): a hand-over adds no naming list the scope in force leaves out
  (MD-2a: no `capabilities` or `actions` list, except `actions` under listed `capabilities`).
- **Annotated (2026-10-26, CT-149):** `fixtures/vectors/mandate.json` gains a `handOn` group (30 cases): the mandate an
  agent sends when it calls the next one, or the first problem that stops it, so a leading agent's port (the adapter's
  kits, FAA-131) checks MD-2 as a callee checks MD-3 to MD-5. Amended by DEC-0136 (2026-10-26): MD-2a, with one more
  `cases` vector for it.
- **Context:** the operator decided on 2026-10-25 that their mandate goes with the task: an agent leading the
  operator's task holds the operator's authority for it, hands work to other agents on the operator's behalf with the
  mandate narrowed to the part handed on, and the agent that receives it acts without asking the operator again
  (fabric-workspace `knowledge/integration.md`, PR #439; request `fa9a40c8`). The operator's own example (request
  `9db9e09e` item 2): told "run the research", a developer agent calls a research agent, which asks for the operator's
  approval although the operator already gave it. DEC-0121 lets an agent relay the operator's decision only from the
  operator's own words in its session (AP-3), and a research agent's own approval gate ("operator approval required
  before paid work") had no way to see that the operator had decided. Never delegated: a sign-in, a typed secret, a
  payment, spend above a limit.
- **Decision:**
  1. **MD-1, the form.** The leading agent states a `mandate/1` (`mandate.schema.json`): `task`, the operator's
     `instruction` verbatim in AP-3's form, `at`, `expiresAt` within 7 days, a `scope` stated from the words
     (`capabilities`, `actions`, `projects`, an absent list meaning any; `effects` as a ceiling; `perCallMaxUsd` only
     where the words name an amount) and `chain` with itself first. A task open at expiry asks the operator once.
  2. **MD-2, every call appends its callee.** The chain is the agents that held the mandate; each call under it
     appends the agent called, with the scope handed on when narrower; never a wider or dropped list, effect or
     ceiling, never a repeated agent, at most four (DL-6). `handOn` is the reference and `FAC-SEM-144` checks the
     document.
  3. **MD-3, taking a call.** A callee takes the mandate only from T0 or T1 and only when the chain ends in itself, and,
     when it authenticated its caller's agent id (a per-agent credential, a delegation token's actor, the hub's token
     naming the origin, never the hub's own id), only when that id is the agent before it; without one the chain's end
     alone binds it; then a call the mandate covers is the operator's decision: a
     `relayed` action without a decision (AP-2), any approval the product asks of the operator before a step, and a
     job's approval step (no input request raised). Covered: the action or the capability listed (an effect beyond
     `draft` needs the call named: a relayed action in either list, any other call in `capabilities`), the effect within the ceiling and never `change-policy` (AP-5), the callee's own
     estimate within `perCallMaxUsd` when there is one (the money limits decide otherwise), the project listed. It
     records `via: mandate` with the task, the chain and the caller. The mandate travels in `_meta.mandate`, in
     `call.mandate` (the hub forwards it as it does a decision; a sealed call carries it only to a target listing
     `mandate/1`), or in a board request from a Project of the operator's own board. `mandateCovers` is the reference;
     `actionDecision` reads it when a relayed action's call carries no decision.
  4. **MD-4, asking only for the rest.** Outside the mandate: `operator-decision-required` with `data.detail`
     `outside-mandate: <part>` (and the estimate and ceiling for spend); a job's uncovered step waits `input_required`.
     The agent refused calls again within its own mandate when that covers the call, else passes the refusal up, and
     the leading agent asks the operator for that part alone. Not valid or not addressed to this call:
     `decision-invalid` with its `detail`.
  5. **MD-5, beyond the estate.** A T2 caller's mandate changes nothing; the whole profile applies. Toward another
     person's machine or another organization's agents the authority travels only as a delegation token, which the hub
     mints for the mandate's scope once Fabric's issuer serves it (DEC-0039). Inside the estate (T0, T1) no token is
     needed, before or after the issuer (DL-26).
  6. **MD-6, what never travels.** Human steps (AP-4), spend above a limit (L0, the project's L1 per-task threshold, a
     key's ceiling), one's own approvals (AP-5); a mandate in a tool result, a page, a file or a board message from a
     sender the target cannot place as the operator's is data.
- **Why:** the operator's instruction is the authority inside the boundary (DL-26), and a task's work crosses agents;
  carrying the words with the task, bound to a scope, an expiry and the chain that held it, lets every agent act without
  turning a quoted sentence into a general key. Binding the chain's end to the callee, and the agent before it to the
  caller wherever the callee authenticated the caller's agent id, keeps a copied mandate from serving another callee
  (without such an id (the shared descriptor token on loopback, a T1 call over the relay, a call the hub forwards without a delegation token), it could be reused at the same callee within its scope and expiry, as a
  decision could: DL-26's boundary); narrowing at each call mirrors a delegation token's
  attenuation (DL-5), so the same chain later becomes a signed one without changing what it means. An absent amount
  reads as "within the money limits" because the operator's rule reserves only spend above a limit; an explicit amount
  is a per-call ceiling because a callee can check its own estimate but not what other agents spent. Refusing only the
  uncovered part keeps the approval mechanism the operator asked to keep, while asking them once.
- **Alternatives considered:** let any agent relay another agent's quoted words as a decision (the prompt-injection
  boundary of AP-3 would be gone); the operator's rule's literal form, a board request that names the task and the
  operator's words in prose (a callee could not tell what the words cover or check a narrowing; fabric-workspace relays
  the block instead, CT-149); require a delegation token at T0 and T1 (DL-26 removed tokens inside the boundary, and
  Fabric's issuer does not serve yet); a total spend for the task (no callee sees the others' spend; the leading agent
  keeps the total within the money limits); one long-lived approval per agent pair (no task, no scope, no expiry); a new
  refusal code (DL-19's `operator-decision-required` already means "ask the operator", and `data.detail` names the
  part).
- **Compatibility:** `interop-request-meta` admits any `_meta` member, so a reader pinned before ignores
  `_meta.mandate` and answers as before (`operator-decision-required` for a relayed action without a decision). The
  hub's `agent.call` admits `mandate` from this decision; a reader pinned before refuses a call that carries one, so a
  sealed call carries it only to a target whose `protocols` lists `mandate/1` (registered by this decision), and the hub
  forwards it only to a callee at or after this pin. `contractVersion` stays `0.1.0`.
- **Consequences / affects:** `schemas/mandate.schema.json` (new), `schemas/interop-request-meta.schema.json`,
  `schemas/interop-agent-call.schema.json`; `src/protocol-revisions.ts` (`mandate/1`); `docs/specification/delegation.md`
  (DL-26, The operator's mandate, the refusal codes, the rule's row), `service.md` (AP-2, AP-3), `interop.md` (C3.3,
  C3.5, the action codes), `machine-calls.md` (the sealed call), `project-comms.md` (a board request),
  `spend-policy.md` (L2), `conformance.md` (rows, the reference, the next free code), `CONTEXT.md` (Mandate),
  `docs/DOCMAP.md`, `docs/specification/README.md`, `docs/ux/` (ST-037, FLW-31, SCN-045, SCR-30); `src/mandate.ts`,
  `src/actions.ts`, `src/semantic-rules.ts`, `src/semantic-kinds.ts`; `tools/vectors/mandate.ts`,
  `fixtures/vectors/mandate.json`, `fixtures/positive/mandate.json`, two negatives,
  `fixtures/semantic/action-call-mandate*.json`; `test/mandate.test.ts`, `test/schema-compilation.test.ts`,
  `test/positive-sweep.test.ts`, `test/capability-names.test.ts`, `vitest.config.ts`; DEC-0121's status; backlog CT-142
  (closed by this decision), CT-149 (adoption).
- **Source:** the operator's decision of 2026-10-25 (fabric-workspace `knowledge/integration.md`, PR #439,
  announcement `a509fcc0`); requests `fa9a40c8` (thread `c9d5be94`) and `9db9e09e` item 2; CT-142; the seam and
  product readings of the first draft (2026-10-26), which found the chain rule unfollowable and unbound to its caller,
  spend unenforceable and the operator's literal example refused, the hub and job routes missing and T1 contradicted;
  a second seam reading, which found no authenticated agent id on the operator's own routes, an actions-only scope
  covering every external call and the reference's table stale.

### DEC-0126: one approval binds all the operator's agents

- **Date:** 2026-10-26
- **Status:** Accepted (2026-10-26). Additive on the wire (an optional `source` in `mandate/1` and in
  `_meta.decision`); a behaviour rule an agent adopts at its next pin. Amends AP-3 (DEC-0121) and MD-1, MD-6
  (DEC-0125) for a relay. Adoption: CT-149.
- **Context:** the operator, 2026-10-26, relayed by one of the operator's agents (request `519d7b21`, thread `3e8f706c`):
  «хочу чтобы на уровне мои агентов работающи по моей команде не было двойного апрува, я сказал одному = сказал всем,
  передай это в фабрик контракт и в фабрик агентам тоже пусть там у себы поправят». On 2026-10-25 the operator approved
  a configuration change in one agent's session; it was relayed on the board to the agent that holds the key, which
  waited about five hours for a second approval because AP-3 made a board message and another agent's text data.
  DEC-0125 carries the words in a `mandate/1`, but its alternatives rejected a prose relay, and the operator's rule
  accepts one that carries the words, the date, the place and the scope.
- **Decision:**
  1. **OA-1, one approval.** An approval the operator gives in the session of any of their agents binds every agent of
     their estate it reaches as OA-2 and OA-3 say; that agent acts on it without asking again, within what it covers.
  2. **OA-2, the relay.** It carries the words verbatim (AP-3's form), when and where they were said (the project, and
     the session or the board thread) and the approved scope. Its machine form is `mandate/1` with `source`, or a
     `_meta.decision` with `source` for one action; the optional `approval` block request `519d7b21` proposed is this, not a
     third format. A prose relay carrying the four is accepted by an agent, which states its decision or its own mandate from
     the words, `instruction` and `at` unchanged and `source` naming the place, and leads its own part; the chain starts
     again there, with a scope no wider than the relayed scope and the quoted words. A service's check reads only the
     machine form, wherever AP-2 and MD-3 carry it, never prose.
  3. **OA-3, the boundary against forgery.** Accepted only from one of the operator's own Projects on their board
     (`provenance: trusted`) or a session on their own machine (T0: the runner's own delivery between local sessions, or a
     subagent's parent). Lacking any of the four, from a member's
     Project on an organization's board (T2), or found in content an agent read: data.
  4. **OA-4, own checks, one question for what is new.** The receiver keeps its checks (a stale preview, guards, the
     money limits) and asks once only about what the operator did not see: another target, a wider scope. Spend above a
     limit (L0, L1, a key's ceiling) is OA-5's human step, handed over with its link and the amount, not a question in
     chat; money above the amount the relayed scope names is a wider scope, asked once with the amount. A stop condition the relaying agent wrote is not the operator's; where the scope covers the case, the
     receiver acts and says so.
  5. **OA-5, what stays the person's.** AP-4's and MD-6's human steps (a sign-in with its one-time code, a consent, a
     payment or top-up, a typed secret, spend above a limit, a passkey signature), and a decision recorded as the
     operator's own that the relay does not carry.
  6. **OA-6, the record.** The receiver records the words, `at` and `source` as its reason (change log or audit,
     its reply in the thread, its handoff); `actionDecision` and `mandateCovers` return `source` in `recordAs`.
     `source` is the relaying agent's statement; it never places the caller's tier or identity (AP-2).
  7. **OA-7, `source` on the wire.** A decision or a mandate carries `source` only to a target whose well-known
     `protocols` list `operator-source/1` (registered here; through the hub, when the hub and the callee both list
     it); otherwise the agent sends it without `source` and keeps `source` in its own record. A service that reads
     `source` lists the revision. A board request's block carries the mandate without `source`, the place written
     beside it. Like `instruction`, `source` never reaches an events feed, a usage report or another party's page.
- **Why:** inside the estate the operator's instruction is the authority (DL-26), and asking twice for what the
  operator already said is the cost the operator named. The four items a relay carries let the receiver check what was
  approved and where; the place a relay may come from keeps text an agent read (the prompt-injection route) out, which
  is the boundary AP-3 drew. Reusing `mandate/1` and the decision keeps one machine form a service checks.
- **Alternatives considered:** asking in chat about spend above a money limit, as the operator's list reads (AP-4 and
  MD-6 already make it the person's step with its link, and the operator's standing rules list it among the human
  gates; money above the relayed amount stays a question); a separate `approval` block `{quote, by, at, source, scope}` (a third format for what
  a mandate and a decision already say; `source` added to both instead); keeping a prose relay as data, as DEC-0125 decided
  (its reasons were that a callee could not tell what prose covers or check a narrowing, and that letting any agent
  relay another agent's quoted words removes AP-3's injection boundary; the operator's rule decides otherwise, and this
  decision answers both: a service still reads only the machine form, the receiver restates the scope no wider than the
  relay, and only the operator's own Projects and sessions may relay, OA-3); accepting a
  relay from any Project of a board (an organization's board joins other people's machines, T2); letting a relayed
  approval cover a human step (AP-4 stands).
- **Compatibility:** a reader that validates `mandate/1` or `decision.schema.json` against a schema pinned before this
  decision refuses a document carrying `source` (`additionalProperties: false`), so the member travels only to a target that
  lists `operator-source/1` (OA-7); toward any other the call goes without it and nothing a reader pinned before
  checks changes. `contractVersion` stays
  `0.1.0`.
- **Consequences / affects:** `schemas/mandate.schema.json` (`source`, `$defs/source`), `schemas/decision.schema.json`
  (`source`); `src/protocol-revisions.ts` (`operator-source/1`); `src/mandate.ts`, `src/actions.ts`;
  `docs/specification/interop.md` (Actions and the operator's decision, C3.5), `machine-calls.md` (the sealed call),
  `versioning.md` (the register); `docs/specification/delegation.md` (One approval binds all the
  operator's agents), `service.md` (AP-3), `project-comms.md` (a board request), `conformance.md` (rows),
  `CONTEXT.md` (Relayed approval), `docs/DOCMAP.md`, `docs/specification/README.md`, `docs/ux/` (ST-037, FLW-31,
  SCN-046, SCR-30); `tools/vectors/mandate.ts`, `tools/vectors/actions.ts` and their vector files,
  `fixtures/positive/mandate-relayed.json`, `fixtures/negative/mandate-source-unplaced.json`,
  `fixtures/semantic/action-call-relayed-source*.json`, `fixtures/semantic/action-call-mandate-source*.json`; `test/mandate.test.ts`;
  DEC-0121's and DEC-0125's status; backlog CT-149 (adoption).
- **Source:** request `519d7b21` from one of the operator's agents (thread `3e8f706c`), the operator's words of 2026-10-26;
  fabric-workspace `knowledge/agents-first.md` (PR #455, `67440fbc`); the adapter's row FAA-131.

### DEC-0127: membership attestation, any organization server issues it and the person pins the organization's root

- **Date:** 2026-10-26
- **Status:** Accepted (2026-10-26). Additive: two new schemas (`org-membership/1`, `org-key-set/1`) and an optional
  member of the estate record (`organizations`), which Fabric writes only once every reader of the record is pinned at
  or after: every machine of the person and the relay that holds the record, and the node ends an enrollment on the
  unpinning revision as measured (CT-137). Adoption: every organization server,
  Fabric and the products that read membership (CT-137).
- **Annotated (2026-10-26):** DEC-0128 makes `organizationPin.iss` required, a narrowing of this unadopted member
  (DEC-0119); the release that carries both lists it as a narrowing.
- **Annotated (2026-10-26):** DEC-0129 places the membership root with the organization owner's Fabric, never a server
  (A-3, Fabric ADR-0178): OM-8's server drafts the key sets the root signs.
- **Annotated (2026-10-26):** DEC-0129 adds the required member `administrators` to `org-key-set/1` before any tag
  carried it; a reader pinned at a main commit of DEC-0127 or DEC-0128 refuses a set that lists it, and the release
  that carries DEC-0127 to DEC-0129 lists it as a narrowing (DEC-0119).
- **Context:** the organization train's packet TP-00 (row N-1, step 1.1 of fabric-workspace
  `docs/reports/2026-10-25-organization-r1/README.md` at `d438e3dc`): Fabric cannot trust an organization server's
  membership, and a product cannot be granted one, without a document Fabric verifies. MD-9 path (a)
  (`knowledge/integration.md` at `4c38d0b7`) makes that document an open contract any organization server speaks, the
  first organization server being the source of truth only for an organization that connected it. R1-D12 keeps MC-13: a
  project enters an organization by the person's own passkey, with no administrator's acceptance. Until now
  contexts.md left membership to the organization server's record and only the device certificate followed it.
- **Decision:**
  1. **OM-1, the attestation.** `org-membership/1`: `issuer`, `org` (`org:<orgId>`), `audience` (the reader), a
     `subject` pairwise per (organization, audience, person), `role` `owner`, `admin` or `member`, `external`, `status`
     `active` or `ended`, a rising `revision`, `membershipEndsAt`, `issuedAt` ≤ `notBefore` < `expiresAt` with a life of
     at most 24 hours, issuer-named `extensions` that grant nothing, and an Ed25519 signature over its RFC 8785 form
     without `sig` (the register's `org-membership/1`). No member names a person.
  2. **OM-2, the pin.** The person admits an organization by pinning `{org, issuer, root: {kid, x}, pinnedAt}` in the
     estate record's `organizations`; the passkey's signature over that revision is the admission; no administrator
     signs it. Unpinning ends every membership of it. `FAC-SEM-147`: each organization once, no root of small order.
  3. **OM-3, the key set.** `org-key-set/1`, the organization's membership root (never its `policyRootKey`) signing
     only key sets, one per organization even on a server that hosts many, each signing key in one organization's set;
     rotation, revocation and replay as `entitlement-key-set/1`.
  4. **OM-4, the verifiers.** `verifyOrgKeySet` and `verifyOrgMembership` (`src/org-membership.ts`), offline, in the
     OK and OM tables' order; no grace (`expired` at `expiresAt`); `ended` when stated or past `membershipEndsAt`;
     `refreshDue` 15 minutes before expiry; one held record per (organization, audience, subject).
  5. **OM-5, what ends with a membership.** An `ended` attestation, `organization-closed` (DEC-0103) or an unpin ends
     it, and with it the context's share grants (revoked in the next revision), delegation tokens in the context, the
     device enrollment (ended as on `organization-closed` once the node applies the revision that unpins the
     organization, which Fabric writes on every end: the `server` layer and its locks, key set, streams and the
     context's credentials; devices.md amended, and DEC-0103 item 4's "one event" amended; a revoked certificate alone
     keeps DEC-0103's meaning) and anything leaving for the organization.
  6. **OM-6, suspended is not ended.** An expired or unverifiable attestation authorises nothing new; what runs keeps
     its expiry. A refresh the issuer refuses for the membership is an end.
  7. **OM-7, the allowlist.** Only the enrollment's own requests (enrollment, rotation, renewal) and its sessionless
     activity events, proposals, check-ins of that enrollment, the context's session events, its grants' usage and
     share registrations, the enrollment's node summary, credential requests and call records, and the membership
     refresh leave a person's Fabric for an organization. A new row needs a decision.
  8. **OM-8, the issuer's duties.** Rising revisions, a stated end, the ended enrollment's device certificate revoked, a pairwise opaque subject, roles mapped onto three,
     one root per organization, overlapping rotation, a life of at most 24 hours.
- **Why:** a verifier that trusts only what a key it pinned signs is the pattern the contract already runs for
  entitlements and device policies, and pinning the root in the person's own estate record makes the admission the
  person's act (R1-D12) and lets the organization move to another server without any server's permission (MD-9). A day
  bounds how long an end the issuer could not deliver reads active, and the issuer may choose shorter; a reader that is
  offline longer only stops authorising new things, which is what an unverifiable membership should do. A pairwise
  subject keeps two readers from joining their records (CX-22).
- **Alternatives considered:** the server's own compact JWS under a server-wide JWKS (a second signature form beside
  the contract's one canonical form, and a key that is the server's rather than the organization's, so another server
  could not take the organization over); trusting a well-known key URL on first use (a server compromise would
  re-key every organization silently; the pin makes a new root a new act of the person); an administrator's admission
  receipt (R1-D12 reversed it); a life of 7 days with a heartbeat (a member removed would keep reading active for a
  week; a delta `member` kind can add a faster end later); the server's own role vocabulary in the attestation (every
  reader would need every server's roles; a finer role rides in `extensions`); folding `org-authority/1`'s member list
  into this decision (its entries are per-context keys, decided with CT-122).
- **Compatibility:** the new schemas are new types; a reader that validates the estate record against a schema pinned
  before refuses a record carrying `organizations`, so Fabric writes it only once every reader is pinned at or after (as
  DEC-0106 and DEC-0107). `contractVersion` stays `0.1.0`.
- **Consequences / affects:** `schemas/org-membership.schema.json`, `schemas/org-key-set.schema.json` (new),
  `schemas/estate-record.schema.json` (`organizations`, `$defs/organizationPin`); `src/org-membership.ts` (new),
  `src/signing-challenges.ts` (two statements), `src/estate-record-rules.ts` (`FAC-SEM-147`), `src/semantic-rules.ts`,
  `src/semantic-kinds.ts`, `src/protocol-revisions.ts`; `relay.md`, `revocation-delta.md`, `CONTEXT.md` and `src/relay.ts` (`org-authority/1` decided with CT-122),
  `docs/specification/membership.md` (new), `devices.md` (a membership's end ends a `server` layer's locks), `estate-record.md`
  (Organizations), `contexts.md` (Membership and its expiry), `conformance.md` (modules, rows, the two tables, codes,
  the next free code), `README.md`, `docs/DOCMAP.md`, `CONTEXT.md`, `docs/ux/` (ST-038, FLW-32, SCN-047);
  `tools/vectors/org-membership.ts`, `tools/vectors/run.ts`, `fixtures/vectors/org-membership.json`, positive, negative
  and semantic fixtures; `test/org-membership.test.ts`, `test/signing-challenges.test.ts`,
  `test/schema-compilation.test.ts`, `test/positive-sweep.test.ts`, `vitest.config.ts`; backlog CT-137 (closed by this
  decision), CT-37 (narrowed to `org-authority/1`'s member list, with CT-122).
- **Source:** CT-137; the organization train's TP-00, N-1, step 1.1 and X-6; MD-9; R1-D12; board request `8e2d5099`
  (thread `8d115bed`); DEC-0031, DEC-0045, DEC-0063, DEC-0082, DEC-0085, DEC-0103.

### DEC-0128: unlinkable memberships, an identity per enrollment and a key and issuer per context

- **Date:** 2026-10-26
- **Status:** Accepted (2026-10-26). `machines[].contextHubKeys` is additive; `iss`, required on DEC-0127's
  `organizationPin`, narrows a member no reader has adopted (DEC-0119: the release notes list it as a narrowing); which Fabric writes only once every reader of the record is pinned at or after (as
  DEC-0106, DEC-0107 and DEC-0127); new rules a sender runs on itself. Adoption: CT-122; a node adopts UE-2 only once the machines' report to the hub over
  the relay exists (CT-152), since DL-15, the hub move and the window leases read those reports.
- **Annotated (2026-10-26, DEC-0134):** item 5's residual linkability gains one link: an operator that runs two of a
  machine's relays (an estate's and an organization's, or two organizations') sees that machine's two connections
  (devices.md What stays linkable; relay.md OR-5).
- **Context:** the operator decided K-1 on 2026-10-15 (NET-2, DEC-0084): each organization enrollment of a machine gets
  keys of its own, so two organizations cannot link the machine (CX-22). The scope brief
  (`docs/evidence/specs/2026-10-24-ct122-unlinkable/brief.md`) listed twelve values two enrollments share today, and the
  plan (`docs/evidence/plans/2026-10-26-ct122-org-authority.md`) mapped them; DEC-0127 left the check-in's estate records
  as the recorded gap.
- **Decision:**
  1. **UE-1, an identity per enrollment.** A fresh opaque `device.id` (never the estate machine id), its own `#sig` and
     `#kem` keys and kids, telemetry key, collector ids and counters; no hardware-unique id in its attestation (SHOULD
     NOT). `FAC-SEM-148` on the node's local registry (kind `node-enrollments`), which the node never sends.
  2. **UE-2, nothing of the estate's.** No estate record in a check-in's `records` and no estate document in its answer,
     the sender's duty (`FAC-SEM-149`, kinds `check-in-outbound` and `check-in-response-outbound`, the response rule
     refusing only documents that name an estate); a receiver ignores them and never refuses a check-in for them; they
     travel on the estate's own channel, the relay (the machines' report message is CT-152).
  3. **UE-3, independent schedules** with jitter (SHOULD).
  4. **DL-14a, a key and an issuer per context.** `organizations[].iss` (`urn:fabric:context:<opaque>`, never the estate
     id) and `machines[].contextHubKeys` `{context, key}`; an organization-context token is signed by that context's key
     under that issuer with a per-context `sub`, published in a key set per context; a context key lives only on the machine
     holding the personal hub key and is re-keyed with it on a hub move; `hubKeyCertified` and `verifyDelegation` read a context's keys only for
     that context and only while it is pinned; a context key signs nothing of the estate's. `FAC-SEM-073`, `076`, `114`,
     `134`, `147` and `081` read them; `hubMove` moves them; OM-5 drops and revokes them with the pin.
  5. **Residual linkability, named,** at the brief's defaults for the operator's questions: low-entropy values, mode
     `C`'s harness lines (DEC-0118), a shared `agentRef`, the relay operator's view of `org:<orgId>` until per-context
     relay sessions; one `iss` per (estate, organization); a stolen machine prompts the person to ask each organization.
- **Why:** CX-22 needs every value an organization sees to be one only it sees. Making UE-2 the sender's duty keeps
  every node pinned before working while a node pinned after stops leaking; putting the context issuer on the pin keeps
  one place that names an organization in the estate.
- **Alternatives considered:** a receiver rule refusing check-ins with estate records (it would cut off every node
  pinned before, and the members still serve the personal channel); a top-level `contextIssuers[]` (a second list keyed
  by organization beside `organizations`); one hub key for every context (the kid would link them, the brief's row C).
- **Compatibility:** a reader pinned before refuses `iss` and `contextHubKeys` (closed schema), and a reader pinned at
  or after refuses a DEC-0127 pin without `iss` (a narrowing of an unadopted member, DEC-0119), so Fabric writes them
  only once every reader is pinned at or after; the outbound rules are the sender's and refuse nothing a receiver gets.
  `contractVersion` stays `0.1.0`.
- **Consequences / affects:** `schemas/estate-record.schema.json`; `src/estate-record-rules.ts`, `src/hub-key-rules.ts`,
  `src/delegation.ts`, `src/hub-move.ts`, `src/node-enrollments.ts` (new), `src/semantic-rules.ts`,
  `src/semantic-kinds.ts`; `docs/specification/devices.md` (Unlinkable enrollments UE-1 to UE-3, the rules),
  `contexts.md` (Linkability), `delegation.md` (DL-2's `iss` and `sub`, DL-14a, `FAC-SEM-081`), `estate-record.md`,
  `ceremonies.md` (`FAC-SEM-114`, the hub move, Linkability), `window-lease.md` and `revocation-delta.md` (the estate's
  records off the organization channel), `share-registration.md`, `machine-calls.md` (`FAC-SEM-134`), `membership.md` (OM-5, OM-7, `FAC-SEM-147`),
  `activity.md` (the telemetry key), `node-summary.md`, `credentials.md` (the enrollment's `#kem`), `conformance.md`,
  `CONTEXT.md`, `docs/ux/` (SCN-048); fixtures and `test/context-keys.test.ts`, `test/org-membership.test.ts`,
  `vitest.config.ts`; backlog CT-122.
- **Source:** CT-122; the brief and plan above; NET-2 (DEC-0084); the first organization server's request on board
  thread `305f39c3`.

### DEC-0129: the organization's member list, `org-authority/1`, signed by an administrator's passkey

- **Date:** 2026-10-26
- **Status:** Accepted (2026-10-26). A new schema (`org-authority/1`), a new register statement, a new rule
  (`FAC-SEM-150`) and a relay admission source; `org-key-set/1` gains the required `administrators` before any tag
  carried the type (DEC-0127's annotation: the release lists it as a narrowing, DEC-0119). Adoption: CT-37 (every
  organization server drafts, an administrator's Fabric signs, an organization's relay admits).
- **Annotated (2026-10-26):** DEC-0134 decides the organization relay's handshake (relay.md OR-1 to OR-5): a
  member's `auth` names the organization, `welcome` carries the list, sessions stand under it; the attestation status
  check is CT-162. OR-3 and OR-4 narrow item 4: a refused candidate leaves the held list, re-read under the
  newest key set the relay verified, which it applies even when the list read with it is refused, so a held list whose
  signer that set dropped admits nobody (fail closed).
- **Context:** DEC-0127 left the organization's list of admitted members for its relay to be decided with CT-122,
  because its entries are the members' keys per context; DEC-0128 gave each enrollment its own keys and each context its
  own issuer. Fabric ADR-0178 (D8, fabric `cf99c32f`, 2026-10-26) settled who signs: an administrator's device-bound
  passkey certified by the organization's root signs the organization's record, a server drafts it and signs nothing of
  it (points 2 and 3). The plan (`docs/evidence/plans/2026-10-26-ct122-org-authority.md`) had the key set's signing
  keys sign the list; ADR-0178 replaces that.
- **Decision:**
  1. **OL-1, the document.** `org-authority/1`: `issuer`, `org`, `revision`, `issuedAt`, `expiresAt` (at most 7 days,
     v4 §7), `members` (0 to 1024 `{subject, role, iss, keys}`: the subject pairwise to the relay's audience, a role,
     the context's token issuer the member's estate pins, 1 to 8 `<enrollment id>#sig` P-256 keys), `digest` and a
     WebAuthn `signature`. Each subject, `iss` and kid once, every key on the curve (`FAC-SEM-150`, kind
     `org-authority`).
  2. **OL-2, who signs.** An administrator's signing passkey, listed in the applied `org-key-set/1`'s new
     `administrators` (0 to 16, the estate record's `authority` shape, each once under a signing RP, `FAC-SEM-146`),
     over the register's `org-authority/1` challenge `{type, digest}`; no server, the drafting one included. A
     credential a later set drops signs nothing from that set on.
  3. **OL-3, the verifier** `verifyOrgAuthority` in `src/org-authority.ts`, in the order of membership.md's OL table.
  4. **OL-4, the relay's admission set.** `orgRelayAdmissionSet` in `src/org-authority.ts` (outside `src/relay.ts`, so the relay's import closure is unchanged): an organization's relay pins the
     organization's root at setup, applies key sets under it, and takes the listed `#sig` keys of a list that verifies;
     a refused candidate leaves the held list's set in force, and a refused held list, or none, admits nobody (DEC-0047). Without a candidate the held list is verified again under the current
     key set. The organization relay's handshake (what `auth` signs in `estate`, what `welcome` carries) waits on the
     organization's heartbeat and delta, so no organization relay runs on this release (CT-37 keeps it).
  4a. **The root's holder.** The membership root is held by the organization owner's Fabric, never by a server (A-3):
     the server generates signing keys and drafts each key set, the owner's Fabric shows its changes and signs it only
     once the owner confirms them, so no server can certify an administrator (DEC-0127 OM-8 annotated). OM-7 gains the
     owner's and an administrator's outflows (the root's public key and key-set signatures; a passkey's public part and
     list signatures). ADR-0178 D8-b's root, the owner's two estate passkeys, is
     not taken: the owner registers a signing credential for this organization alone, which enters as the first set's
     administrator (a departure from D8-b, as the Ed25519 root is); a passkey root and an administrator's device binding (ADR-0178 point 2) are later decisions. An
     administrator's credential is registered for that organization alone, never an estate authority (OM-7) and never in
     another organization's set.
  5. **OL-5, the duties.** The server drafts a revision on every join, end and key change and before expiry; an ended
     membership leaves the next list.
  6. **OM-7 gains two more rows:** the context's `iss` for the member list's own entry (the server already holds the
     enrollment's `#sig` key); and an adaptation plan's organization part (TP-03): what the person chose to bring into that
     organization, by reference, and the person's requests to its administrators; never the plan's draft, its inventory
     or anything not chosen. A project's entry is the estate revision its person's passkey signs (R1-D12, ADR-0178
     point 7) and never leaves.
- **Why:** an administrator's passkey keeps the signature over the organization's members off every server, as A-3 and
  ADR-0178 require, while the relay still checks one signed document offline. Listing administrators in the key set
  the root already signs reuses the person's pin (OM-2) as the only trust anchor and needs no new pin form. A 7-day
  life bounds how long an ended member stays admitted if the server stops drafting, and re-verifying the held list
  under the current key set lets a root revoke an administrator at once.
- **Alternatives considered:** the key set's signing keys signing the list (the plan's; ADR-0178 point 2 refuses any
  server signature over the organization's record); a separate `org-admin-set/1` document for administrators (a second
  root-signed document beside the key set for no gain); the owner's passkeys as the root itself (ADR-0178 D8-b; the pin
  of DEC-0127 is an Ed25519 key, so the owner registers a signing credential for this organization alone, which enters as the first set's administrator and a passkey root is a
  later pin form); a member's estate record carrying its organization keys for the relay (the relay of an organization
  would read every member's estate, which DEC-0128 keeps from it); roles that grant at the relay (the relay admits, it
  does not authorise).
- **Compatibility:** `org-authority/1` is a new type; `administrators` is a narrowing of `org-key-set/1` before its
  first tag (DEC-0127's annotation), and so is the root's move from the server to the owner's Fabric for any server
  that built on DEC-0127's main. `contractVersion` stays `0.1.0`.
- **Consequences / affects:** `schemas/org-authority.schema.json` (new), `schemas/org-key-set.schema.json`
  (`administrators`); `src/org-authority.ts` (new), `src/org-membership.ts` (`administrators`, `FAC-SEM-146`),
  `src/relay.ts` (a comment), `src/signing-challenges.ts` (`org-authority/1`, `ORG_KEY_SET_FIELDS`),
  `src/semantic-rules.ts`, `src/semantic-kinds.ts`, `src/protocol-revisions.ts`; `docs/specification/membership.md` (the
  member list OL-1 to OL-5, OM-2's fingerprint, OM-3's administrators and root holder, OM-7's rows, OM-8, the rules),
  `relay.md`, `signing.md` (the sixth passkey type), `package.md`, `contexts.md` (Linkability), `revocation-delta.md`, `window-lease.md`,
  `estate-record.md`, `conformance.md` (module, rows, the two tables, the code, the next free code), `README.md`,
  `docs/DOCMAP.md`, `CONTEXT.md` (Member list, Adaptation plan); DEC-0047, DEC-0051, DEC-0062, DEC-0063, DEC-0066 and DEC-0127 annotated;
  `docs/ux/` (SCN-047, SCN-049); `tools/vectors/org-membership.ts`,
  `fixtures/vectors/org-membership.json`, positive and negative fixtures; `test/org-authority.test.ts`,
  `test/signing-challenges.test.ts`, `test/schema-compilation.test.ts`, `test/positive-sweep.test.ts`,
  `vitest.config.ts`; backlog CT-04, CT-37 (open for the relay's handshake), CT-122, CT-137, CT-153 and CT-155 (filed).
- **Source:** CT-37; Fabric ADR-0178 (fabric `cf99c32f`); board request `d5cbabfd` (thread `8d115bed`, TP-03's
  organization part); DEC-0047, DEC-0055, DEC-0063, DEC-0127, DEC-0128; v4 §7.

### DEC-0130: the family is T0 and T1 named from the agents' side; beyond it, the agent network

- **Date:** 2026-10-26
- **Status:** Accepted (2026-10-26). Definitions and callee rules; no schema, no wire change. Adoption: the adapter's
  kits with CT-149; the first consumer that keeps token classes maps them as DL-29 says.
- **Context:** the operator's task of 2026-10-25 (board request `9db9e09e`, item 1): the family is the agents the
  operator runs, trusted most and open to everything open to the operator; the network is every reachable agent, each
  open to what its context was granted; decide whether the family is a tier, a context or a notion of its own, and how a
  responding agent sees it. A consumer that keeps its own token classes waits for the answer (board reply `550ebf96`).
  Item 2 became DEC-0125 (the mandate); item 3, a watcher, is a service proposed to Fabric (`35b8301c`).
- **Decision:**
  1. **DL-27.** The family is every agent placed on a machine of the operator's estate and the operator's own local
     sessions; a callee recognises it only by placing the caller in T0 or T1 (DL-25). It is not a context (`personal`
     and `org:<orgId>` stay the only ones) and not a tier. It is open to what DL-26 opens: everything open to the
     operator in the call's context, no token, approval or grant; one approval travels as a mandate (DEC-0125); money
     limits, human gates, the contexts' routing (DEC-0082), the machine profiles (DEC-0106) and a relayed action's
     decision or mandate (DEC-0121, DEC-0125) still bind.
  2. **DL-28.** No claim of a caller places it in the family; a call relayed onto loopback stays T2 unless the relay
     proves the origin's tier (DL-25, `relayCallerTier`, DEC-0106), and a caller under another OS account stays T2. The limits and gates inside the family are what holds when a family agent is turned against
     the operator.
  3. **DL-29.** The agent network (not NET-1's network, a context's machines) beyond the family is T2: open to what its context was granted, with a token per call.
     A service off the estate's machines has no family caller; it may map a verified token of the operator's estate,
     issued in `personal`, onto a class of its own for the operator's account, never a caller's claim.
- **Why:** the line the operator draws is the machine boundary DEC-0045 already draws, so naming it from the agents'
  side gives every callee one test it already runs; a family context would split one estate's data in two, and a tier
  of its own would let a claim, not a placement, open the operator's whole estate.
- **Alternatives considered:** a `family` context beside `personal` (two contexts for one owner's data, and the
  routing rules of DEC-0082 would have to choose between them); a fourth tier between T1 and T2 for the operator's
  agents off the estate (it would need a proof the token already gives); a family flag in the agent directory (a
  derived view, never authority, DEC-0104).
- **Compatibility:** text and callee rules only; nothing a reader validates changes. `contractVersion` stays `0.1.0`.
- **Annotated (2026-10-26):** wording settled by DEC-0137 (CT-157). Item 1 reads with a tokenless call's context (the
  callee instance's), T0 including a process the owner did not install, the credential source, and the machine profiles
  as `machineCallVerdict` judges a call over the relay. Item 2's relay case and OS account read as DL-28 now says. Item 3
  reads "no caller of this operator's family", "issued for `personal`" (a token names no context), "once Fabric's issuer
  serves (MD-5)" and "whose scope is all they carry".
- **Consequences / affects:** `docs/specification/delegation.md` (The family and the agent network, DL-27 to DL-29; Not
  decided here), `conformance.md` (a row), `README.md`, `docs/DOCMAP.md`, `CONTEXT.md` (Family); backlog CT-143 (closed),
  CT-149 (adoption), CT-157 (filed).
- **Source:** CT-143; board request `9db9e09e` item 1 and reply `550ebf96`; DEC-0045, DEC-0055, DEC-0082, DEC-0084
  (NET-1), DEC-0090, DEC-0104, DEC-0106, DEC-0121, DEC-0125.

### DEC-0131: the draft exchange, how a server's draft reaches the signer and comes back signed

- **Date:** 2026-10-26
- **Status:** Accepted (2026-10-26). Additive: three new schemas, a rule (`FAC-SEM-151`), routes under the issuer and
  reference functions; nothing an existing reader validates changes. Adoption: the first organization server serves
  the routes (its N-3, due 2026-11-04), Fabric reads drafts and signs them (CT-156).
- **Context:** DEC-0129 placed the membership root in the organization owner's Fabric and the member list's signature
  with an administrator's passkey; a server drafts both. The first organization server re-pinned to DEC-0129 and asked
  how a draft reaches the signer and comes back (board request `1822d650`, thread `bd508780`, five points), by
  2026-10-31; fabric-workspace recorded the owner's choice (MD-14) to keep the root with the owner's Fabric.
- **Decision:**
  1. **Routes** under the issuer's origin, `{org}` the organization's opaque id: `GET`/`POST .../root`, `GET`/`POST
     .../key-set`, `GET .../key-set/draft`, the same for `authority` (`ORG_EXCHANGE_PATHS`). The root, key sets and
     their drafts hold public material only, so they are read without a credential; a member list and its draft name
     every member, so the server serves them only to the organization's administrators and its relay. Only a
     signature makes a key-set or list POST pass.
  2. **OX-1, the draft envelope** `org-key-set-draft/1` and `org-authority-draft/1`: `{type, org, base, draft,
     digest}`, the draft unsigned, its revision one above `base`, `digest` the signer's input digest (`FAC-SEM-151`).
     One draft waits at a time; a draft is never served as a signed document.
  3. **OX-2, the root.** Before the first key set the owner's Fabric registers the root's public key and the owner's
     signing credential for this organization by `org-root-registration/1` at `POST .../root`, authorised by a claim
     the server showed the owner's signed-in account (32 bytes, one use, 15 minutes). The claim is a bearer secret,
     never in a URL or a link (DEC-0123's links carry none); the server checks it last and uses it up only on a
     registration it accepts. The server then drafts revision 1 with that administrator, and the root's signature over
     it is the proof of the root; a root whose first set is accepted is registered for good. OM-7's owner row gains the
     owner's credential and the claim.
  4. **OX-3, matching.** A signed set is accepted only when it verifies under the registered root against the set held
     and its signed bytes have the pending draft's digest (`draft-mismatch`, `no-draft` otherwise); a repeat of the held
     set is `unchanged`.
  5. **OX-4, meanwhile.** No signed set: `404 no-signed-key-set` and no attestation. A newer draft waiting: the last
     signed set stays served, and attestations are signed only with keys it lists.
  6. **OX-5, rotation.** The server drafts the next set at least 7 days before the newest signing key's `notAfter`;
     the owner's Fabric reads the draft route when it starts and at least daily; a set not signed in time leaves the
     server unable to sign attestations, so readers suspend (OM-6); the server never extends a window itself.
  7. **OX-6, member lists** take the same exchange, accepted by `acceptSignedAuthority`.
- **Why:** public material needs no secret channel, and a signature is the only authority a POST should carry, so the
  exchange works for the owner's Fabric before any enrollment exists and needs no new credential type. A claim tied to
  the server's own sign-in binds the root to the person who created the organization there, without the root signing
  anything but key sets. Matching by the draft's digest keeps the owner from signing what the server did not draft and
  the server from serving what the owner did not sign. The root and the owner's credential reach the server before the
  first draft because the draft names that credential as its administrator.
- **Alternatives considered:** the device check-in's `records` (it needs an enrollment, which an organization being
  created does not have, and only the node sends device requests); a credential per owner for reading key-set drafts
  (they are public); the root signing a claim document (OM-3 keeps the root to key sets); the claim in an open link (DEC-0123's links
  carry no secret); the root and the first signed set in one POST (the server could not draft a set naming an
  administrator it had not yet received); public member lists (a list names every member); the server pushing drafts to Fabric
  (left for later: reading the route on start and daily is enough at a 7-day lead).
- **Compatibility:** additive. `contractVersion` stays `0.1.0`. OM-3's "the server drafts each set" now has its wire.
  OM-2 named how an issuer serves its root as Fabric's; it is now the root route, and OM-2 says so. The first
  organization server's unmerged N-3 serves `/v1/orgs/:orgId/membership/{root,key-set}` and answers the root flat
  (`{issuer, org, kid, x}`); it moves to these paths and the nested `root`.
- **Consequences / affects:** `schemas/org-key-set-draft.schema.json`, `schemas/org-authority-draft.schema.json`,
  `schemas/org-root-registration.schema.json` (new); `src/org-exchange.ts` (new), `src/semantic-rules.ts`,
  `src/semantic-kinds.ts`, `src/protocol-revisions.ts`; `docs/specification/membership.md` (The draft exchange, OX-1 to
  OX-6, OM-7's owner row, `FAC-SEM-151`, Not decided), `conformance.md` (module, rows, the code, the next free code),
  `README.md`, `docs/DOCMAP.md`, `CONTEXT.md` (Draft exchange); fixtures; `test/org-exchange.test.ts`,
  `test/schema-compilation.test.ts`, `test/positive-sweep.test.ts`, `vitest.config.ts`; backlog CT-156.
- **Source:** CT-156; request `1822d650` (thread `bd508780`); fabric-workspace MD-14; DEC-0123 (open links), DEC-0127,
  DEC-0129; the vector root of `fixtures/vectors/org-membership.json`.

### DEC-0132: the machines' report to their hub over the relay

- **Date:** 2026-10-26
- **Status:** Accepted (2026-10-26). Additive: two new schemas, a rule (`FAC-SEM-152`), reference functions and
  vectors; nothing an existing reader validates changes. Adoption: Fabric's nodes and Project Observatory's node send
  reports and Fabric's hub reads them; on the hub's machine the node serves the local channel's `machine.report` and
  Fabric's hub calls it (CT-152). A node pinned before DEC-0132 answers `machine.report` with `unknown-method`, and its
  leases then count at their whole amounts until it reports.
- **Context:** DEC-0128 UE-2 keeps the estate's records (the applied revision, the heartbeat, the delta head, the
  leases with `spent`) off every check-in to an organization server, and left the message that carries them to the hub
  open (CT-152). Three readers wait on it: the hub's key rotation (DL-15), the hub move's step 6 and the window lease's
  reporting (DEC-0062), and the schema descriptions already name the check-in's `records` members.
- **Decision:**
  1. **MR-1, the report** `machine-report/1` is `{type, machine, at, records}`; `records` reuses the check-in's
     `estateRecord` (required), `heartbeat`, `revocationDelta` and `leases` by name and shape. `leases` names every
     lease the machine holds and the newest expired lease of each slot whose window instance has not ended, each with
     its latest `spent`, so a report is the machine's whole state; each lease once (`FAC-SEM-152`).
  2. **MR-2, to whom and when.** A machine reports to every other machine whose `hubKey` the revision it applied
     certifies (both, during a planned move) or a newer revision it verified but refused certifies (so a machine left
     on its parent reaches the new hub, the hub move's step 6), after it applies a revision, a heartbeat or a delta
     page (at most once a minute), at or after each lease's expiry, and at least every 24 hours
     while it holds a lease or applies the estate's records. A report carries the whole state, is never answered, and
     a lost one is replaced by the next. On the hub's own machine the hub calls the node's `machine.report` over the
     local channel (`{report}`, written at the call), when it connects, before each division and at least daily, and
     reads it with the same checks, so the hub machine's own leases and revision count like any machine's.
  3. **MR-3, how.** Sealed to the hub machine's `#kem` as `fabric-machine-report/1` `{type, kem, enc, ct}` inside a
     `fabric-relay-message/1` body: HPKE base mode, suite `[16, 1, 1]`, `info` the protocol name, the additional data
     the RFC 8785 bytes of `{type, from, to, msgId, kem}`, the plaintext at most 65 536 bytes.
  4. **MR-4, reading.** The hub ignores a sender `relayCallerTier` does not place in T1, and reads a report only as
     `openMachineReport` does: `malformed`, `wrong-recipient`, `cannot-open`, `malformed`, `wrong-machine` (the report
     names another machine than the sender), `stale` (not after the one held). It keeps the newest per machine and reads
     everything from it.
  5. **MR-5, what it means.** A machine applied a revision when its newest report's `estateRecord.revision` is at or
     above it; a lease's final `spent` is in a report whose own `at` is at or after its `expiresAt`, never one judged
     by its delivery, and the window lease's reporting and `windowRemainder` take a report's `at` as its time; a report
     after a hub move's revocation is one whose `estateRecord.revision` is at or above the revoking revision.
- **Why:** the relay is the estate's own carrier (DEC-0047) and already delivers to a sleeping hub; sealing keeps what a
  machine spent away from the relay's operator, as a machine call is (DEC-0106). Whole-state reports make loss and
  reordering harmless with one rule (`stale`), and reusing the check-in's member names keeps every existing reference
  to `records.estateRecord.revision` and `records.leases` true.
- **Alternatives considered:** a machine call to a hub capability (a report has no answer, and a call's profile rule
  would forbid a view machine's report); the report in clear in the body (the relay's operator would read every
  machine's spending); deltas instead of whole state (one lost message would need a resend protocol); the hub pulling
  reports (a hub cannot reach a sleeping machine; the relay's mailbox carries a push).
- **Compatibility:** additive. `contractVersion` stays `0.1.0`. The window lease's reporting said a report "received"
  at or after a lease's expiry; it now says written (the report's `at`), and `LeaseReport.receivedAt` is that time for
  a relayed report. The texts that named CT-152 as the open carrier
  (delegation.md DL-15, ceremonies.md's hub move, window-lease.md, estate-record.md, revocation-delta.md, devices.md
  UE-2, the check-in schema's `records` description) now name DEC-0132.
- **Consequences / affects:** `schemas/machine-report.schema.json`, `schemas/machine-report-sealed.schema.json` (new);
  `src/machine-report.ts` (new), `src/semantic-rules.ts`, `src/semantic-kinds.ts`, `src/protocol-revisions.ts`;
  `tools/vectors/machine-report.ts`, `tools/vectors/run.ts`, `fixtures/vectors/machine-report.json`;
  `docs/specification/relay.md` (The machines' report, MR-1 to MR-5, `FAC-SEM-152`), `delegation.md`,
  `ceremonies.md`, `window-lease.md`, `estate-record.md`, `revocation-delta.md`, `devices.md`, `conformance.md`,
  `CONTEXT.md` (Machine report), `docs/DOCMAP.md`, `docs/specification/README.md`; fixtures;
  `test/machine-report.test.ts`, `test/schema-compilation.test.ts`, `test/positive-sweep.test.ts`,
  `test/rule-tolerance.test.ts`, `test/protocol-revisions.test.ts`, `vitest.config.ts`, `docs/specification/versioning.md`,
  `docs/specification/local-channel.md` (`machine.report`), `schemas/local-channel.schema.json`, `src/local-channel.ts`,
  `test/local-channel.test.ts`; backlog CT-152, CT-161.
- **Source:** CT-152 (filed by DEC-0128's seam reading); DEC-0047, DEC-0053, DEC-0062, DEC-0106, DEC-0128.

### DEC-0133: the draft exchange's shared vectors, the root's answer, and a role is no authority

- **Date:** 2026-10-26
- **Status:** Accepted (2026-10-26). Additive, with one narrowing before any server serves the exchange: a root
  registration whose issuer is over 261 characters is refused as `malformed`, as its schema already refuses it.
- **Annotated (2026-10-26):** DEC-0134 decides the organization relay's handshake (relay.md OR-1 to OR-5): a
  member's `auth` names the organization, `welcome` carries the list, sessions stand under it; the attestation status
  check is CT-162.
- **Context:** DEC-0131's readings left the exchange with no vector file a server or Fabric can run, no schema for the
  root's answer, and a registration check without the issuer's length cap (CT-158). Fabric answered DEC-0129's open
  questions in ADR-0180 (thread `115ef7fb`, message `664b69ad`): it keeps the Ed25519 root per organization, and an
  attestation's role never proves an administrator.
- **Decision:**
  1. **Vectors.** `fixtures/vectors/org-exchange.json`, written by `tools/vectors/org-exchange.ts`: draft digests,
     `FAC-SEM-151`, accepting a signed key set and member list, and the root's registration, with whether the claim may
     be checked at all. Every server of the exchange runs it; a Fabric that drafts nothing runs its digest cases and
     builds its registration bodies like the vectors'.
  2. **The root's answer** `GET .../root` is `org-root.schema.json`: `{org, issuer, root: {kid, x}}`.
  3. **The issuer's cap.** `verifyRootRegistration` refuses an issuer over 261 characters as `malformed`, as
     `verifyOrgKeySet` and the schema read an issuer.
  4. **OX-1's public material** names the administrators' public credentials, the owner's among them, never the claim.
  5. **OL-6, a role is no authority.** An attestation's role never proves an administrator; the applied key set's
     `administrators` does. No reader checks an attestation's role against the member list. Whether the relay checks
     status from both, the stricter answer winning (ADR-0180 point 4), is left to its handshake (CT-37), since only the
     relay can match the list's pairwise subjects.
- **Why:** a port of the exchange is checked by bytes, not by reading TypeScript; the root's answer is what a member
  pins, so it gets a schema; and a role that proved authority would let an issuer's online keys certify an
  administrator, which DEC-0129 keeps with the root.
- **Alternatives considered:** a `type` member on the root's answer (DEC-0131 fixed its shape without one); reading a
  role against the list in Fabric (subjects are pairwise, CX-22); taking ADR-0180 point 4's relay status rule now
  (the relay's handshake, where it belongs, is still CT-37's).
- **Compatibility:** additive but for item 3, which narrows a check no server runs yet (the first organization server's
  N-3 is unmerged). `contractVersion` stays `0.1.0`. Fabric ADR-0180's release statement and root succession are
  CT-159 and CT-160.
- **Consequences / affects:** `schemas/org-root.schema.json` (new); `src/org-exchange.ts`; `tools/vectors/org-exchange.ts`,
  `tools/vectors/run.ts`, `fixtures/vectors/org-exchange.json`; `docs/specification/membership.md` (header, the
  exchange's header and routes, OX-1, OL-6, Not decided), `conformance.md`, `docs/DOCMAP.md`; fixtures;
  `test/org-exchange.test.ts`, `test/schema-compilation.test.ts`, `test/positive-sweep.test.ts`;
  `docs/specification/README.md`; backlog CT-37, CT-158, CT-159, CT-160; `docs/handoffs/README.md`.
- **Source:** CT-158; Fabric ADR-0180 (fabric `1d49ed3b`; thread `115ef7fb`); DEC-0129, DEC-0131.

### DEC-0134: the organization's relay, its handshake on the signed member list

- **Date:** 2026-10-26
- **Status:** Accepted (2026-10-26). Additive: a second `welcome` variant in `relay-frame.schema.json`, and
  `sessionStands` takes an organization's admission result (`SessionAdmission`, which both admission results satisfy).
  Adoption: the relay serves an organization; the first organization server issues the relay its read credential and
  tells it of new lists; Fabric's nodes and Project Observatory's node connect with an enrollment key (CT-37).
- **Context:** DEC-0129 gave an organization's relay its admission set (`orgRelayAdmissionSet`) and left the handshake
  waiting on an organization's heartbeat and delta: what a member signs in `auth.estate`, what `welcome` carries, and
  when an open session stands (CT-37). Fabric ADR-0180 point 4 adds a stricter status check against attestations.
- **Decision:**
  1. **OR-1, auth.** A member signs the same `relay-auth/1` with an enrollment's `#sig` key the list names and
     `estate` the organization's context id `org:<orgId>`, never its estate id; the relay admits it as `admit` does,
     the organization being the record it admits from.
  2. **OR-2, welcome.** `{session, list: {org, revision, digest}, limits?}`: no estate revision, delta head or
     heartbeat, which an organization does not have in this release.
  3. **OR-3, sessions** stand while `sessionStands` answers `ok` under the list's admission set: a newer list or key set
     ends a session whose kid left or changed (`not-admitted`), the held list's window ends every session (`expired`);
     a refused candidate leaves the held list.
  4. **OR-4, sources.** The relay pins the root at setup and reads the key set and list from the server at least hourly
     and when told of a new one, with a credential the server issues it; it applies only what the verifiers accept. It
     reads the key set with every list and applies a key set and list read together in one `orgRelayAdmissionSet` call;
     a key set the root signed is applied even when that list is refused, and a key set that drops the held list's
     signer with no other administrator's list verifying leaves the relay admitting nobody (fail closed, OL-5).
  5. **OR-5, between members:** every member is T2 to every other, two enrollments of one owner included; no presence
     across members; one relay origin per organization. What the relay carries between members, and where a recipient
     gets a member's enrollment key, is CT-163.
- **Why:** the list's 7-day window and OL-5's draft on every end already bound how long an ended member stays admitted,
  so an organization heartbeat and delta only shorten that bound; they stay additive (a member delta kind, membership's
  Not decided). Naming the organization in `estate` keeps one `admit` for both kinds of relay and never shows a member's
  estate id to an organization's relay (DEC-0128).
- **Alternatives considered:** waiting for an organization heartbeat and delta (they shorten the bound; nothing in the
  handshake needs them); a new frame type for an organization's auth (the existing frame names its record already);
  taking ADR-0180 point 4's status check now (the relay is not yet an attestation audience: CT-162); placing two
  enrollments of one owner in T1 to each other (it would link an enrollment to its estate, UE-1).
- **Compatibility:** additive, with one narrowing of DEC-0129 item 4 (a refused candidate no longer keeps the held
  list's set in force under a key set that dropped its signer) before any organization relay ran. `contractVersion`
  stays `0.1.0`. No organization relay ran before this decision, so no client met the new `welcome`. `FRAME_TYPES` is
  unchanged; `welcome` has two schema variants.
- **Consequences / affects:** `schemas/relay-frame.schema.json`; `src/relay.ts` (`SessionAdmission`);
  `docs/specification/relay.md` (The organization's relay, OR-1 to OR-5; the header and the member-list paragraph),
  `membership.md` (OL-4, OL-6, OX-6, Who adopts it, Not decided), `conformance.md`, `CONTEXT.md` (Relay, Admission
  set, Revocation delta), `revocation-delta.md` and `ceremonies.md` (an estate relay's `welcome`), `devices.md` (an
  estate relay's `welcome`; What stays linkable: an operator running two of a machine's relays sees its two
  connections), `contexts.md` (the same), `machine-calls.md` (the adopters' table), `docs/specification/README.md`,
  `docs/DOCMAP.md`, `docs/ux/scenarios.md` (SCN-049, the hub move), `docs/ux/flows.md` and `docs/ux/foundation.md`
  (the hub move's relay); `schemas/revocation-delta.schema.json`, `src/revocation-delta.ts` and `src/org-authority.ts`
  (descriptions); DEC-0047, DEC-0066, DEC-0128, DEC-0129 (item 4 narrowed) and DEC-0133 annotated;
  `test/org-authority.test.ts`, `test/relay.test.ts`, `test/relay-rules.test.ts`; backlog CT-36, CT-37, CT-162,
  CT-163, CT-164; the handoff.
- **Source:** CT-37; DEC-0047, DEC-0066, DEC-0084, DEC-0128, DEC-0129; Fabric ADR-0180 point 4.

### DEC-0135: a reply is delivered to the sender it answers, or to whom it names

- **Date:** 2026-10-26
- **Status:** Accepted (2026-10-26). Additive for a writer: one optional member, `deliverTo`, on `com.reply`,
  `com.submit` and a message. For a reader: what is unread is over deliveries for a reader pinned at or after it, and
  as the board's released versions answered an older one (every message its Project did not send), which narrows
  0.1's text by its own messages (the policy's second exception, Compatibility). Adoption: CT-154 (Fabric's board, CO-437).
- **Context:** since Fabric's migration 124 (CO-370, schema 97) a reply on the board is delivered to the sender of the
  message it answers, not to every participant, and an unread count holds the reader's deliveries only. The contract
  fixed a thread's participants at creation and said nothing of a reply's audience, so no reply to everyone could be
  asked for (Fabric CO-437, relayed by fabric-workspace on 2026-10-26).
- **Decision:** [project comms](specification/project-comms.md#who-a-message-is-delivered-to) DR-1 to DR-5.
  1. **Delivery is not reading.** Every participant reads every message of a thread (C2). A message's delivery decides
     only what counts as unread for a Project (`com.list` with `unread`, `com.status`'s count) and what a transport
     mirror may send to it.
  2. **DR-1.** A message, request, finding or announcement is delivered to every participant but the sender.
  3. **DR-2.** A participant's reply is delivered as its optional `deliverTo` says: `sender` (the default, Fabric's
     behaviour since migration 124; as `thread` when the replier answers its own Project's message or the board does
     not hold the message it answers), `thread` (every
     participant but the replier), or a list of 1 to 16 participants other than the replier. A listed non-participant
     is refused `immutable_participants`, the replier's own Project `invalid_arguments`; `deliverTo` on another kind is
     refused `invalid_arguments`. A reply to a request is also delivered to the requester whatever `deliverTo` says,
     unless the requester is the replier's own Project or the board no longer holds the request, so a target's reply
     that answers a request (`answered`,
     DEC-0098) always reaches it.
  4. **DR-3.** Every message a responder posts on a request's thread (fenced reply, progress note, effect or
     checkpoint summary) is read as a reply to the request and delivered to the requester (as `thread` when the
     requester is the responder's own Project or the board no longer holds the request), and takes no `deliverTo`.
  5. **DR-4.** A reply as read carries the `deliverTo` its sender gave (one stored before its board adopted this was
     delivered as that board delivered it then); the same idempotency key with other arguments, an explicit `sender`
     against an absent `deliverTo` included, is `idempotency_conflict`.
  6. **DR-5.** A reader pinned before this decision is answered as the board's released versions answered: every message its Project did not send counts as delivered
     to it for `unread`, `com.status`'s count and `read`; a host stages this by the reader's pin, as it stages
     `deliverTo`.
- **Why:** replies were most of a board's deliveries when each went to every participant (Fabric BD-4: 2,350 of 3,400,
  1,293 of them replies to announcements), so the sender default stays;
  a person still needs to answer a whole thread, or the two Projects that asked the same thing, without opening a new
  thread, which would lose the context. Keeping delivery apart from reading keeps C2: a reply never widens or narrows
  who may read a thread.
- **Alternatives considered:** a boolean `toAll` (Fabric's first suggestion; a list covers it and the two-Project case);
  delivery to every participant by default (the fan-out CO-370 removed); narrowing who may read a reply (a second
  audience inside a thread, against C2 and the fixed participants); narrowing an older reader's count to DR-2's
  delivery under the same name, on the ground that Fabric has merged it for its next release (a server's unreleased
  change would then license any narrowing a server ships first); a new revision for the count (heavier than staging
  by the pin, which `deliverTo` needs anyway).
- **Compatibility:** additive for a writer: a reply without `deliverTo` is unchanged and is delivered as Fabric
  delivers it now. A board pinned before this refuses `deliverTo` as an unknown member (`invalid_arguments`); a writer
  that gets that refusal and still means the thread says so in a new message rather than dropping the member. A
  reader pinned before this would refuse a message that carries `deliverTo` (`comms-message` is closed), so a host
  sends the member only to a reader pinned at or after DEC-0135 and omits it for an older one, as DEC-0079 staged
  `held`. For a reader pinned at or after DEC-0135, `unread`, `com.status`'s count and `read` follow delivery (new
  behaviour behind a new pin). An older reader keeps the count the board's released versions gave it (DR-5), with
  one narrowing against 0.1's text, which kept every message not marked read: its Project's own messages are not
  unread to it. `fabric-project-comms/0.1` is adopted, so that narrowing is made under the policy's second exception,
  now named in `conformance.md`: the only board serving 0.1, Fabric, answers it in every released version that serves the board:
  v0.3.2 to v0.3.5 count with `board_unread` (migration 81, every message of the reader's threads not its own and not
  marked); v0.3.6 to v0.3.12 with `board_status` (migration 107, the deliveries the board holds, which migration 103
  sends to every participant but the sender), and from v0.3.9 `board_list_reader` (migration 120) keeps `read` true for
  a reader's own messages. So no reader of a released board sees its count change. Fabric's migration 124 (CO-370, on
  its main and its 0.3.13 branch, untagged) narrows a reply's delivery to the sender for every reader; before it
  releases that, Fabric is to answer a reader pinned before DEC-0135 as v0.3.12 did (adoption CT-154, asked on the
  board before its 0.3.13 tag). `com.read_ack` and its receipt are
  unchanged (DEC-0073, DEC-0098): a mark is recorded on any message the reader can read. The next release's notes list
  the narrowing. `contractVersion` stays `0.1.0`.
- **Consequences / affects:** `schemas/comms-common.schema.json` (`deliverTo`, the `answered` description),
  `comms-reply.schema.json`, `comms-submit.schema.json`, `comms-message.schema.json`, `comms-list.schema.json` and
  `comms-status.schema.json` (`unread`), `comms-read-ack.schema.json` (`upTo`'s wording); fixtures;
  `docs/specification/project-comms.md` (header, participants, reads, delivery, messages, `com.status`, transport
  mirror), `conformance.md` (the board's row, the compatibility policy's second exception), `CONTEXT.md` (Delivery),
  `docs/DOCMAP.md`, `docs/ux/screens.md` (SCR-19), `docs/specification/README.md` (the board row), the handoff
  `docs/handoffs/2026-10-26-reply-delivery.md`; DEC-0022, DEC-0073, DEC-0098 and DEC-0119 annotated; backlog CT-154,
  CT-166.
- **Source:** CT-154; Fabric CO-437, CO-370 (fabric `20261026000124_one_schema_step.sql`); fabric-workspace's relay of
  2026-10-26.

### DEC-0136: a mandate's hand-over adds no naming list the scope in force leaves out

- **Date:** 2026-10-26
- **Status:** Accepted (2026-10-26). A narrowing of DEC-0125 MD-2 before any agent hands a mandate on (the adapter's
  kits adopt it in FAA-131, unreleased, told on board thread `aa86a675` before its 0.51.0 ships). Adoption: CT-149.
- **Context:** CT-149's blind readings of the hand-over vectors found that `scopeWithin` let a hand-over add an
  `actions` or `capabilities` list where the scope in force had none. MD-1 reads a list left out as "any", but MD-3
  covers a relayed action only when `actions` or `capabilities` names it, and an external effect only when the call is
  named. So a scope with neither list covers reads and drafts only, and a callee that added `actions: [publish-page]`
  would then take a publish the operator never named: a hand-over that widened while `FAC-SEM-144` called it narrower.
- **Decision:** [delegation](specification/delegation.md#the-operators-mandate) **MD-2a**. A hand-over never adds a
  `capabilities` or `actions` list the scope in force leaves out, except `actions` where the scope in force lists
  `capabilities` (it then narrows the relayed actions those name); it may add `projects`. Otherwise the mandate is
  `mandate-widened`, from `mandateProblem` (`FAC-SEM-144`) and so from `handOn` and `mandateCovers`. The vectors gain
  this case in both groups, and the `handOn` group states the order in which a document's problems are read. The
  `FAC-SEM-144` row now says what the code always did: a step at the same time as the one before is in order, and the
  first problem in that order is the answer. MD-1's "a list left out means any" and the schema's descriptions of an
  absent `capabilities` and `actions` say what MD-3 reads it as.
- **Why:** the mandate exists so an agent acts on the operator's words without asking, which is safe only if no agent
  of the chain can grant itself what the words did not; "a list left out means any" cannot mean "any" for naming,
  since MD-3 reads the same absence as naming nothing.
- **Alternatives considered:** allowing a naming list where the hand-over's own effects stay within `draft` (a rare
  case, and it would still let `capabilities` name relayed actions the scope in force did not); reading an absent naming
  list as "every call" in MD-3 (it would let an operator's vague words cover every external effect).
- **Compatibility:** a narrowing: a mandate that added such a list was `ok` under DEC-0125 and is `mandate-widened`
  now. No agent hands one on yet (CT-149 open, FAA-131 unreleased). `contractVersion` stays `0.1.0`.
- **Consequences / affects:** `src/mandate.ts` (`scopeWithin`, the finding's text); `schemas/mandate.schema.json`
  (descriptions); `docs/specification/conformance.md` (the leading agent's row); `tools/vectors/mandate.ts`,
  `fixtures/vectors/mandate.json` (`handOn`, one more `cases` vector); `test/mandate.test.ts` (with a property test:
  no hand-over `scopeWithin` accepts covers a call the scope in force does not, over every list shape, with
  capability names the schema accepts; it fails under the old rule and under each of three weaker forms of MD-2a);
  `docs/specification/delegation.md` (MD-1, MD-2a, `FAC-SEM-144`); DEC-0125 annotated; backlog CT-149.
- **Source:** CT-149's readings (round 2 of the hand-over vectors, 2026-10-26).

### DEC-0137: the family's wording settled (DEC-0130's readings)

- **Date:** 2026-10-26
- **Status:** Accepted (2026-10-26). Text only; no schema, no wire change, no new rule a reader validates.
- **Context:** DEC-0130's blind readings filed CT-157: places where DL-25 to DL-29 read wider or narrower than the
  rules they rest on (DEC-0045, DEC-0099, DEC-0106, DEC-0125, DL-26, MD-6).
- **Decision:** in [delegation](specification/delegation.md#the-family-and-the-agent-network):
  1. **Context of a tokenless call.** A call without a token runs in the context of the callee instance it reaches.
  2. **T0 is every process of the owner's account.** One the owner did not install is T0 too (DEC-0045); the money
     limits, the human gates and a product's own approval against a hostile local process ([the
     boundary](specification/delegation.md#the-boundary)) are what hold against it. Whether a mandate may cover that
     approval is not decided here (CT-168).
  3. **Over the estate's relay an unplaced sender is refused.** DL-28 names `relayCallerTier`'s answers as DEC-0106
     gives them: `unknown-state` a denial that never falls back to T2, a sender that is not T1 `unauthenticated`, and a
     call over the relay from outside the estate not decided there. "Another OS account" means a loopback caller.
  4. **What binds the family** adds DL-26's credential source (never another agent's key or vault slot), and the
     machine profiles read as `machineCallVerdict` does: on calls between the estate's machines over the relay a `view`
     machine neither takes nor makes a call with an effect, job tools excepted, and a profile reaches no other path
     (DEC-0106).
  5. **The agent network** links its directory (DEC-0104) and includes the family; NET-1's network of the operator is
     `personal`, while the family also counts agents placed on the estate's machines in an organization's context;
     DL-25's T1 row says "enrolment in the owner's estate" rather than "in the agent network".
  6. **A service off the estate.** The operator's agents reach it as T2; its own owner's processes are that owner's T0 on its machine and T1 on its other enrolled machines
     (an organization's cloud machine binds no person, DEC-0099, so the operator's agents are T2 there too). The token they carry is issued for `personal`
     by the estate's issuer `urn:fabric:estate:<id>` (a token names no context, DL-2, DL-14a), once Fabric's issuer
     serves (MD-5), and its scope is all they carry. The first consumer's token class `internal` is not service.md's
     data class of that name.
- **Why:** each reading found a sentence a careful callee could follow into a wrong answer; none changed what DEC-0130
  decided.
- **Alternatives considered:** renaming the section to put the family inside the agent network (every inbound link,
  the decision and handoff records included, would break silently: `docs:check` does not check fragments, CT-167); leaving the items as backlog (they are cheap and each is a sentence
  a port reads).
- **Compatibility:** text only. `contractVersion` stays `0.1.0`.
- **Consequences / affects:** `docs/specification/delegation.md` (header, DL-25's T1 and T2 rows, the family section's intro,
  DL-27 to DL-29), `conformance.md` (the family's row), `README.md` (the delegation row), `CONTEXT.md` (Family),
  `test/delegation-sealed.test.ts` (DL-27 to DL-29's heading form), `relay.md` (Trust tiers' T2); DEC-0130 annotated; backlog CT-143, CT-149, CT-157
  (closed), CT-167 and CT-168 (filed).
- **Source:** CT-157; DEC-0130's readings, rounds 1 to 5.

### DEC-0140: the primary responder, the operator's move of a slot, a session's role and branch

- **Date:** 2026-10-26
- **Status:** Proposed (2026-10-26), its shape posted to Fabric for objections until 2026-10-28 18:00 UTC (board
  thread `6a8d2f9c`); accepted on merge after that window. Additive but for one narrowing under the compatibility
  policy's second exception: no service may serve or declare `project.work` (PR-1); the serving parties were checked
  on 2026-10-26 by `git grep project.work` in Fabric, the adapter, Fabric Dashboards, Project Observatory, Fabric
  Switchboard and fabric-workspace (none serves or declares it; Fabric's only hits are i18n keys), and the release
  notes list it as a narrowing. No tool, argument or field of any tool's schema changes. Adoption: Fabric in 0.3.15,
  the adapter's kits for a moved-off slot (CT-174).
- **Context:** Fabric's simple Fabric shows each Project's main session and lets the operator hand a Project's work to
  another session; its request `23ba0e97` asked for one rule for "the main one", for the operator's move of a slot, and
  for an optional session `role` and `branch` with a privacy rule. No Project declared a capability when it asked.
- **Decision:** [project communication](specification/project-comms.md) PR-1 to PR-3.
  1. **PR-1.** `project.work` (`PRIMARY_CAPABILITY`) is the reserved capability a requester names to reach a Project's
     primary responder; the board never re-routes another capability to it; otherwise a capability like any other. A
     host shows its holder as the main session, none while nobody holds it. No service serves or declares it.
  2. **PR-2.** The operator moves a (Project, capability) slot to another live, authorized session of that Project, in
     the host's controls or by a relayed decision (`gate: relayed`), never an agent on its own account; from the
     generation the operator saw (`revision_conflict` otherwise); one transition as `com.responder_replace` would
     make it for the receiving session, transferring nothing; refused `held` under a slot or Project hold. The
     moved-off session cannot take the slot back until the operator moves it again. The receiving session continues
     accepted work by its own replacement with a transfer, or the requester cancels it.
  3. **PR-3.** A session role is a claim, display and routing only, never authority, and not a role assignment; the
     host never copies a session's reported branch into the board, the directory, `com.status`, a relay, an
     organization server, an events feed read off the machine or another Project's sessions; an activity event's
     `git.branch` keeps following `telemetry.git_branch` (DEC-0030).
- **Why:** one name lets a requester reach a Project without knowing its capabilities and lets every host show the
  same main session; a move by the operator's act, guarded by the generation the operator saw and kept by refusing
  the moved-off session, holds the fences' guarantees while the person decides who works; a branch name can carry what
  the board must not.
- **Alternatives considered:** an argument on `com.responder_replace` naming the receiving session (a closed schema
  would change, and an agent could move slots by itself); transferring accepted work as part of the move (a transfer's
  checkpoint is written by its caller, and the operator writes none; the receiving session writes its own by
  replacing itself); letting the moved-off session retake the slot (a client's recovery would undo the operator's
  choice); a session role that grants a slot (a claim would become authority).
- **Compatibility:** additive, with the one narrowing named in Status. `contractVersion` stays `0.1.0`.
- **Consequences / affects:** `docs/specification/project-comms.md` (header, C5's wording, PR-1 to PR-3, the hold
  table), `conformance.md` (two rows), `README.md` and `DOCMAP.md` (their rows), `CONTEXT.md` (Primary responder,
  Session role), `src/comms-hold.ts` (`PRIMARY_CAPABILITY`), `test/comms-hold.test.ts`, `docs/ux/scenarios.md`
  (SCN-051, the move), `docs/ux/screens.md` (SCR-32), `docs/ux/flows.md` (FLW-16); backlog CT-174; the handoff
  `docs/handoffs/2026-10-26-simple-fabric-decisions.md` and its row in `docs/handoffs/README.md`.
- **Source:** CT-174; Fabric's request `23ba0e97` (thread `6a8d2f9c`).
