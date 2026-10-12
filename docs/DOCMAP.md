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
| Memory wire (`memory/0.1`, DEC-0023) and the superseded backend mapping | `docs/specification/memory-and-learning.md#wire-memory01`; history: `docs/reference-architecture/mcp-memory-service-adapter.md` |
| Service extension (`fabric-service/0.1`), local and remote placement | `docs/specification/service.md` |
| Settings backups (`fabric-settings-backup/1`) and the feed client's token header | `docs/specification/service.md#settings-backup`, `#feed-client`, `schemas/settings-backup.schema.json` (DEC-0025) |
| Spend policy and grants with amounts (DEC-0037), grant limit windows (DEC-0038), the meter's `call` window and grant projection (DEC-0041) | `docs/specification/spend-policy.md`, `docs/specification/delegation.md#the-hubs-grant-projection`, `schemas/spend-policy.schema.json`, `schemas/grant-check*.schema.json` |
| Services on Windows and Linux: the services folder, a supervisor per system, Windows paths and token files (DEC-0032, DEC-0033) | `docs/specification/service.md` (lifecycle, token files), `schemas/service-descriptor.schema.json`, `schemas/service-common.schema.json` |
| One copy under every supervisor (the supervisor marker, the 300 s wait), lifecycle and directories per system, the Windows token-file reader; `FAC-SEM-078`, `FAC-SEM-079` (DEC-0057) | `docs/specification/service.md#one-copy`, `#directories-per-system`, `#windows-token-files`, `src/service-supervisor.ts`, `src/windows-token.ts`, `fixtures/vectors/service-supervisor.json`, `fixtures/vectors/windows-token.json` |
| The descriptor for listings: a service offered to others (`peer`), the runner's credential kind, `installedBy` by role, `lifecycle.manager: node` and its forms, the usage report's `platform-metered` route; `FAC-SEM-085`…`FAC-SEM-088` (DEC-0061) | `docs/specification/service.md#offered-to-others`, `#lifecycle`, `#usage-report`, `schemas/service-descriptor.schema.json`, `src/descriptor-rules.ts`, `fixtures/vectors/service-peer.json` |
| Client and reader conformance | `docs/specification/conformance.md#clients-and-readers` |
| Canonical forms — the settings form and RFC 8785 — the register of every signed or hashed document, the board's idempotency digest, and the shared vectors a kit port runs (DEC-0043) | `docs/specification/conformance.md#canonical-forms`, `src/canonical.ts`, `src/comms-digest.ts`, `fixtures/vectors/canonical.json`, `test/canonical.test.ts`; handoff `docs/handoffs/2026-10-11-canonical-forms.md` |
| Calling agents (`fabric-interop/0.1`) | `docs/specification/interop.md` |
| Project communication (`fabric-project-comms/0.1`) | `docs/specification/project-comms.md`, `schemas/comms-*.schema.json` (DEC-0022, OQ-0008) |
| Operator channel (`fabric-operator-channel/0.1`), OC-1…OC-17 and its status | `docs/specification/operator-channel.md`, `schemas/operator-channel-status.schema.json` (DEC-0034; group chats and liveness OC-14…OC-17, DEC-0035; status invariants, DEC-0058); `test/schema-mutants.ts` (each invariant's killing fixture) |
| Embedded dashboard (`fabric-dashboard/0.1`), ED-1…ED-10: width floor, navigation, scrolling, the appearance carrier and its declaration | `docs/specification/embedded-dashboard.md`, `schemas/service-dashboard-extension.schema.json` (DEC-0036; the cookie's scope, the fields a page applies and an invalid declaration, DEC-0059); `src/dashboard-declaration.ts` (`hostView`, `FAC-SEM-080`), `fixtures/vectors/dashboard-declaration.json`; handoffs `docs/handoffs/2026-10-11-embedded-dashboard.md`, `docs/handoffs/2026-10-12-w4-p4-03-channel-dashboard.md` |
| Delegation (`fabric-delegation/0.1`), DL-1…DL-26: the delegation token, minting and attenuation, how it travels, the verifier, keys and rotation, `auth.delegation`, `approval/1`, the one refusal-code set and the meter's relay, delegation grants, the hub's grant projection and the meter's read of it, the `task` claim and the `call` window, trust tiers T0/T1/T2 | `docs/specification/delegation.md`, `schemas/delegation-token.schema.json`, `schemas/delegation-jwks.schema.json`, `schemas/approval.schema.json`, `schemas/delegation-refusal.schema.json`, `src/delegation.ts`, `src/delegation-rules.ts`, `src/grant-projection.ts` (DEC-0039, DEC-0041, DEC-0045); handoffs `docs/handoffs/2026-10-11-delegation-and-fabric-button.md`, `docs/handoffs/2026-10-11-meter-grant-read.md`, `docs/handoffs/2026-10-12-delegation-sealed.md` |
| Keys the estate record certifies: a delegation verifier that reads the record trusts a `kid` only while the revision it reads — verified, the highest applied — certifies it; the refusals and their details, the rollback, an unreadable clock refused before row 1; `FAC-SEM-081` | `docs/specification/delegation.md#keys-publication-and-rotation`, `src/hub-key-rules.ts` (`hubKeyCertified`), `src/rfc3339.ts`, `fixtures/vectors/hub-key.json`, `test/hub-key.test.ts` (DEC-0060); handoff `docs/handoffs/2026-10-12-w4-p4-07-hubkey.md` |
| Ed25519 keys refused before verifying: small-order keys (CT-29) in delegation tokens, approvals, device policies and key sets | `src/ed25519.ts`, `test/ed25519.test.ts`, `fixtures/vectors/delegation-small-order.json`, `docs/specification/delegation.md#the-verifier`, `docs/specification/devices.md#key-sets` (DEC-0045) |
| P-256 keys refused before verifying or sealing: SEC 1 §3.2.2 validation of every hardware-held key (device `#sig` and `#kem` keys, passkeys, organization roots) | `src/p256.ts`, `test/p256.test.ts`, `fixtures/vectors/p256.json`, `docs/specification/devices.md#device-keys`, `docs/specification/relay.md#keys` (DEC-0053, DEC-0047) |
| The operator's dashboard session lifetime | `docs/specification/service.md#operator-session-lifetime`, `src/operator-session.ts` (DEC-0039) |
| Session handoff (`session-handoff/1`), SH-1…SH-13: the folder, its modes and files, lifetime, the first call and the preamble, the brief, `mcp.json`, the per-runtime launch table, integrity, secrets | `docs/specification/session-handoff.md`, `schemas/session-handoff.schema.json`, `src/session-handoff.ts` (DEC-0042); handoff `docs/handoffs/2026-10-11-session-handoff.md` |
| Fabric's button and `fabric://` links, FB-1…FB-8, FL-1…FL-7 | `docs/specification/fabric-button.md`, `schemas/fabric-link.schema.json`, `src/fabric-links.ts` (DEC-0040) |
| Operator channel handoffs | `docs/handoffs/2026-10-10-operator-channel.md`, `docs/handoffs/2026-10-10-operator-channel-group-chat.md` |
| Shared capability-name acceptance and underscore compatibility | `docs/specification/interop.md#capability-names`, `schemas/common.schema.json` (DEC-0020) |
| Provider entries (`fabric-provider/0.1`) | `docs/specification/provider.md` |
| Runner catalogue shape, runner routes and route events | `docs/specification/runners.md`, `schemas/runner-route.schema.json`, `schemas/runner-route-event.schema.json` (DEC-0026, DEC-0029) |
| Runner and model profiles: the model catalogue and its closed class vocabulary, model and runner profiles, the subscription-or-key route, per-model provider routing, the resolution order, the headless drives, the declared slots and the usage route | `docs/specification/runners.md#runner-and-model-profiles`, `schemas/registry-models.schema.json`, `schemas/model-profile.schema.json`, `schemas/runner-profile.schema.json`, `src/profile-rules.ts` (DEC-0046); handoff `docs/handoffs/2026-10-12-runner-model-profiles.md` |
| Packages (`fabric-package/1`): the folder and its files, the service template, secret slots, requires, cost presets, the result signal, state, the evals receipt, dependencies, the digest and the folder check, `agentRef`, the publisher signature and organization countersignature, PK-1…PK-10; `FAC-SEM-064`…`066` | `docs/specification/package.md`, `schemas/fabric-package.schema.json`, `src/package-rules.ts`, `fixtures/vectors/package.json` (DEC-0050, DEC-0051); handoff `docs/handoffs/2026-10-12-agent-package.md` |
| The estate record (`estate-record/1`): whole revisions chained by digest, a 30-day window, passkey authorities, machines with device keys by role and a hub-key certificate, placements by `agentRef`, digest and publisher key, secret placements by reference, share grants, revocations, the WebAuthn Level 3 assertion verified offline, ER-1…ER-10; `FAC-SEM-072`…`076` | `docs/specification/estate-record.md`, `schemas/estate-record.schema.json`, `src/estate-record-rules.ts`, `src/webauthn.ts`, `fixtures/vectors/estate-record.json` (DEC-0055); handoff `docs/handoffs/2026-10-12-w3-p3-03-estate-record.md` |
| Activity telemetry (`fabric-activity/0.1`), `activity-summary/1`, `access-log/1` | `docs/specification/activity.md`, `schemas/telemetry-event.schema.json`, `schemas/activity-*.schema.json`, `schemas/access-log.schema.json`, `src/activity-rules.ts`, `src/seq-ranges.ts` (DEC-0030, OQ-0009) |
| Device enrollment, signed policy, check-in and health (`fabric-device/0.1`) | `docs/specification/devices.md`, `schemas/device-*.schema.json`, `src/device-rules.ts`, `FAC-SEM-045` attribution (DEC-0031, OQ-0010) |
| The relay (`fabric-relay/0.1`) and the secret envelope (`fabric-secret-envelope/1`): admission by device key inside the WebSocket, store-and-forward messages that a relay never reports done, trust tiers from the signed sender, HPKE envelopes sealed to `#kem`, blobs by digest, how revocation deltas travel | `docs/specification/relay.md`, `schemas/relay-frame.schema.json`, `schemas/secret-envelope.schema.json`, `src/relay.ts`, `src/secret-envelope.ts`, `src/relay-rules.ts` (`FAC-SEM-070`, `FAC-SEM-071`), `fixtures/vectors/relay.json`, `fixtures/vectors/secret-envelope.json` (DEC-0047) |
| The revocation delta (`revocation-delta/1`) and the timestamp heartbeat (`heartbeat/1`): entries signed by the estate key and chained by RFC 8785 hash, the genesis and the head the check-in reports, the heartbeat's commitment, the 72-hour rule, reconciliation with the next revision, RD-1…RD-10, HB-1…HB-3; `FAC-SEM-082`…`084` | `docs/specification/revocation-delta.md`, `schemas/revocation-delta.schema.json`, `schemas/heartbeat.schema.json`, `src/revocation-delta.ts`, `src/revocation-delta-rules.ts`, `fixtures/vectors/revocation-delta.json` (DEC-0054); handoff `docs/handoffs/2026-10-12-w4-p4-06-delta-heartbeat.md` |
| Window leases (`window-lease/1`): one hub-signed share of one window instance per machine, the period label, one lease per slot, the meter's smaller remainder and fail-closed expiry, reporting `spent`, WL-1…WL-12; `FAC-SEM-089`…`091` | `docs/specification/window-lease.md`, `schemas/window-lease.schema.json`, `src/window-lease.ts`, `fixtures/vectors/window-lease.json` (DEC-0062); handoff `docs/handoffs/2026-10-12-w4-p4-05-leases-challenges.md` |
| OpenRouter attribution: the setting, the three headers and when none are sent; `FAC-SEM-098` | `docs/specification/openrouter-attribution.md`, `schemas/openrouter-attribution.schema.json`, `src/openrouter-attribution.ts`, `fixtures/vectors/openrouter-attribution.json` (DEC-0065) |
| Signing: the dedicated signing RP `sign.<domain>`, the ceremony, the register of passkey-signed statements (`estate-revision/1`, `org-countersign/1`, `share-grant/1`, `limits/1`) and `verifySigningAssertion`; `FAC-SEM-092` | `docs/specification/signing.md`, `docs/specification/conformance.md#signing-challenges`, `src/signing-challenges.ts`, `fixtures/vectors/signing-challenges.json` (DEC-0063) |
| Activity telemetry and devices handoff | `docs/handoffs/2026-10-08-activity-telemetry.md` |
| Activity telemetry (`fabric-activity/0.1`), `activity-summary/1`, `access-log/1` | `docs/specification/activity.md`, `schemas/telemetry-event.schema.json`, `schemas/activity-*.schema.json` (with `activity-notice`), `schemas/access-log.schema.json`, `src/activity-rules.ts`, `src/seq-ranges.ts` (DEC-0030, DEC-0052, OQ-0009) |
| Device enrollment, signed policy, check-in and health (`fabric-device/0.1`) | `docs/specification/devices.md`, `schemas/device-*.schema.json`, `src/device-rules.ts`, `src/p256.ts`, `FAC-SEM-045` attribution (DEC-0031, DEC-0053, OQ-0010) |
| The device transport binding: HTTP message signatures (RFC 9421 subset, label `fabric-device`) and `Content-Digest` (RFC 9530) beside mutual TLS, the receiver's steps and codes, the nonce store; key roles counted at enrollment; the check-in's estate digest; `FAC-SEM-077` | `docs/specification/devices.md#transport`, `src/http-signature.ts`, `src/device-transport-rules.ts`, `fixtures/vectors/http-signature.json`, `test/http-signature.test.ts` (DEC-0056); handoff `docs/handoffs/2026-10-12-w4-p4-04-device-transport.md` |
| Activity telemetry and devices handoff | `docs/handoffs/2026-10-08-activity-telemetry.md`; the amendment `docs/handoffs/2026-10-12-activity-devices.md` (DEC-0052, DEC-0053) |
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
