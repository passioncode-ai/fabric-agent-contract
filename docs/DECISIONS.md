# Decisions

Append-only decision home for this repository. Reversals add a new decision and
annotate only the old status; decision bodies are never rewritten.

**Next free ID:** `DEC-0043`

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
- **Amends:** nothing — a new protocol, added under the DEC-0016 extension policy
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
- **Status:** Accepted source change (on merge of its pull request). Consumer adoption: Fabric (the link
  handler), Fabric Dashboards (the first host, FD-45), the fabric-agent-adapter's dashboard kit (the component).
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
  `--mcp-config={mcpConfig}`, the form SH-11 requires (the spaced form leaves the option's value list open). Fabric's bundle changes in the same release: the joined `--mcp-config=`, `handoff.json`, a
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
