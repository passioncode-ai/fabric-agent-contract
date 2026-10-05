# Decisions

Append-only decision home for this repository. Reversals add a new decision and
annotate only the old status; decision bodies are never rewritten.

**Next free ID:** `DEC-0025`

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

