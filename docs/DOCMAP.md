# Documentation map

## Regime

`governed` — established 2026-08-26 by run `2026-08-26-fabric-agent-contract`
and recorded as DEC-0001.

## Registers

| Register | File | ID scheme | Append-only | Guarded |
|---|---|---|---|---|
| Decisions | `docs/DECISIONS.md` | `DEC-####` | yes | lease before write when coordination is healthy |
| Open questions | `docs/OPEN_QUESTIONS.md` | `OQ-####` | yes | same |
| Requirements | `docs/evidence/specs/*-brief.md` | `REQ-###` | frozen per run | same |

## Single sources

| Fact | Canonical home |
|---|---|
| Settled architectural decision | `docs/DECISIONS.md` |
| Contract vocabulary | `CONTEXT.md` |
| Pinned external protocol facts | `docs/evidence/sources.md` |
| Normative profile behavior | `docs/specification/` |
| Provider author and operator onboarding | `docs/guides/connecting-compatible-agents.md` |
| Memory control-plane semantics | `docs/specification/memory-and-learning.md` |
| Concrete memory backend mapping | `docs/reference-architecture/mcp-memory-service-adapter.md` |
| Service extension (`fabric-service/0.1`), local and remote placement | `docs/specification/service.md` |
| Settings backups (`fabric-settings-backup/1`) and the feed client's token header | `docs/specification/service.md#settings-backup`, `#feed-client`, `schemas/settings-backup.schema.json` (DEC-0025) |
| Spend policy and grants with amounts (DEC-0037), grant limit windows (DEC-0038), the meter's `call` window and grant projection (DEC-0041) | `docs/specification/spend-policy.md`, `docs/specification/delegation.md#the-hubs-grant-projection`, `schemas/spend-policy.schema.json`, `schemas/grant-check*.schema.json` |
| Services on Windows and Linux: the services folder, a supervisor per system, Windows paths and token files (DEC-0032, DEC-0033) | `docs/specification/service.md` (lifecycle, token files), `schemas/service-descriptor.schema.json`, `schemas/service-common.schema.json` |
| Client and reader conformance | `docs/specification/conformance.md#clients-and-readers` |
| Canonical forms — the settings form and RFC 8785 — the register of every signed or hashed document, the board's idempotency digest, and the shared vectors a kit port runs (DEC-0043) | `docs/specification/conformance.md#canonical-forms`, `src/canonical.ts`, `src/comms-digest.ts`, `fixtures/vectors/canonical.json`, `test/canonical.test.ts`; handoff `docs/handoffs/2026-10-11-canonical-forms.md` |
| Calling agents (`fabric-interop/0.1`) | `docs/specification/interop.md` |
| Project communication (`fabric-project-comms/0.1`) | `docs/specification/project-comms.md`, `schemas/comms-*.schema.json` (DEC-0022, OQ-0008) |
| Operator channel (`fabric-operator-channel/0.1`), OC-1…OC-17 and its status | `docs/specification/operator-channel.md`, `schemas/operator-channel-status.schema.json` (DEC-0034; group chats and liveness OC-14…OC-17, DEC-0035) |
| Embedded dashboard (`fabric-dashboard/0.1`), ED-1…ED-10: width floor, navigation, scrolling, the appearance carrier and its declaration | `docs/specification/embedded-dashboard.md`, `schemas/service-dashboard-extension.schema.json` (DEC-0036); handoff `docs/handoffs/2026-10-11-embedded-dashboard.md` |
| Delegation (`fabric-delegation/0.1`), DL-1…DL-24: the delegation token, minting and attenuation, how it travels, the verifier, keys and rotation, `auth.delegation`, `approval/1`, the one refusal-code set, delegation grants, the hub's grant projection and the meter's read of it, the `task` claim and the `call` window | `docs/specification/delegation.md`, `schemas/delegation-token.schema.json`, `schemas/delegation-jwks.schema.json`, `schemas/approval.schema.json`, `schemas/delegation-refusal.schema.json`, `src/delegation.ts`, `src/delegation-rules.ts`, `src/grant-projection.ts` (DEC-0039, DEC-0041); handoffs `docs/handoffs/2026-10-11-delegation-and-fabric-button.md`, `docs/handoffs/2026-10-11-meter-grant-read.md` |
| The operator's dashboard session lifetime | `docs/specification/service.md#operator-session-lifetime`, `src/operator-session.ts` (DEC-0039) |
| Session handoff (`session-handoff/1`), SH-1…SH-13: the folder, its modes and files, lifetime, the first call and the preamble, the brief, `mcp.json`, the per-runtime launch table, integrity, secrets | `docs/specification/session-handoff.md`, `schemas/session-handoff.schema.json`, `src/session-handoff.ts` (DEC-0042); handoff `docs/handoffs/2026-10-11-session-handoff.md` |
| Fabric's button and `fabric://` links, FB-1…FB-8, FL-1…FL-7 | `docs/specification/fabric-button.md`, `schemas/fabric-link.schema.json`, `src/fabric-links.ts` (DEC-0040) |
| Operator channel handoffs | `docs/handoffs/2026-10-10-operator-channel.md`, `docs/handoffs/2026-10-10-operator-channel-group-chat.md` |
| Shared capability-name acceptance and underscore compatibility | `docs/specification/interop.md#capability-names`, `schemas/common.schema.json` (DEC-0020) |
| Provider entries (`fabric-provider/0.1`) | `docs/specification/provider.md` |
| Runner catalogue shape, runner routes and route events | `docs/specification/runners.md`, `schemas/runner-route.schema.json`, `schemas/runner-route-event.schema.json` (DEC-0026, DEC-0029) |
| Activity telemetry (`fabric-activity/0.1`), `activity-summary/1`, `access-log/1` | `docs/specification/activity.md`, `schemas/telemetry-event.schema.json`, `schemas/activity-*.schema.json`, `schemas/access-log.schema.json`, `src/activity-rules.ts`, `src/seq-ranges.ts` (DEC-0030, OQ-0009) |
| Device enrollment, signed policy, check-in and health (`fabric-device/0.1`) | `docs/specification/devices.md`, `schemas/device-*.schema.json`, `src/device-rules.ts`, `FAC-SEM-045` attribution (DEC-0031, OQ-0010) |
| Activity telemetry and devices handoff | `docs/handoffs/2026-10-08-activity-telemetry.md` |
| A stdio MCP server's `scope` (LC-19), no secret in a command line (LC-21), the one credential detector; `FAC-SEM-056`, `FAC-SEM-057` | `docs/specification/profiles.md#where-a-stdio-server-is-declared`, `#no-secret-in-a-command-line`, `src/secret-shape.ts`, `src/semantic-rules.ts` (DEC-0044); handoff `docs/handoffs/2026-10-12-service-hygiene.md` |
| A setup state in the service well-known (`degraded[].setup`) | `docs/specification/service.md#well-known-document`, `schemas/service-well-known.schema.json` (DEC-0044) |
| Semantic rule codes: allocation and the next free code | `docs/specification/conformance.md#semantic-rule-codes`, `src/rule-codes.ts` (DEC-0029) |
| Pipelines and PL-1…PL-4 (`pipeline/0.1`) | `docs/specification/pipeline.md` |
| Extension key spellings | `src/extensions.ts` |
| A consumer's contract pin | `docs/specification/versioning.md#one-contract-pin` |
| Agent-registry run (AR-1) record and handoff | `docs/evidence/plans/2026-09-30-ar1-contract.md` |
| Licence and repository-standard handoff | `docs/handoffs/2026-09-30-repository-standard.md` |
| Settings backup and feed-client handoff (DEC-0025) | `docs/handoffs/2026-10-05-settings-backup.md` |
| Licence text, commercial terms, contributor agreement | `LICENSE`, `COMMERCIAL-LICENSE.md`, `CLA.md` (knowledge base templates) |
| Machine-readable shapes | `schemas/` |
| User and integration behavior | `docs/ux/` |
| Reference estate scenario | `docs/reference-architecture/` |
| Work accepted for this run | `docs/evidence/specs/2026-08-26-fabric-agent-contract-brief.md` |
| Memory architecture run scope | `docs/evidence/specs/2026-08-26-memory-kernel-brief.md` |
| Acceptance receipts | `docs/evidence/acceptance.md` |
| Local service extension run scope | `docs/evidence/specs/2026-09-28-fabric-service-brief.md` |
| Remote placement run scope and design | `docs/evidence/specs/2026-10-02-remote-service-brief.md`, `docs/evidence/specs/2026-10-02-remote-service-design.md` |
| Memory architecture acceptance | `docs/evidence/specs/2026-08-27-memory-kernel-acceptance.md` |
| Provider guide acceptance | `docs/evidence/specs/2026-08-27-agent-provider-guide-acceptance.md` |
| Deferred or dropped work | adjacent carry-over ledger |
| What a run actually built | coordination as-built log, linked to a commit |

Git owns normative intent. Knowledge systems index committed documents and link
back to their exact revisions; they do not become a second editable source.

## Propagation matrix

| Change type | Update these | Checked by |
|---|---|---|
| New document or rule | `README.md`, this map, `AGENTS.md` when agents must discover it | `pnpm docs:check` |
| Decision | decision register plus every path in `Consequences / affects` | `pnpm docs:check` |
| Resolved question | open-question register plus owning topic document | `pnpm docs:check` |
| Contract object or field | owning specification, schema, fixtures, glossary if it is a domain term | `pnpm test` |
| Protocol profile | profile specification, manifest schema, compatibility fixtures | `pnpm test` |
| Provider onboarding workflow | provider guide, README and owning normative links | `pnpm docs:check` |
| User-facing integration behavior | `docs/ux/` scenario and flow documents | `pnpm docs:check` plus UX linter when present |
| Reference architecture | scenario document and every affected Mermaid diagram | review — semantic completeness is a judgment |
| Memory backend decision | memory specification, adapter reference, source ledger, glossary and estate path | `pnpm docs:check` plus adapter-boundary review |
| Versioned policy | versioning specification, schema, rollback example | `pnpm test` |

## Gates

| Gate | Command | Scope |
|---|---|---|
| Full | `pnpm run check` | types, schemas, fixtures, Markdown, links, Mermaid syntax |
| Documentation | `pnpm docs:check` | Markdown shape, links, versions, Mermaid parseability, extension-key spelling, glossary profile names; not semantic correctness |
| Consumer pin | `pnpm pin:check <repository>` | every contract revision a consumer names equals its `fabric-contract.lock.json` |
| Contract | `pnpm test` | schema compilation and positive/negative fixtures; not provider quality |

## Navigation

Indexes link to canonical definitions and never restate normative rules. References
to external protocols always include a pinned revision.
