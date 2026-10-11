# Conformance and compatibility

`covers: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-007, REQ-008, REQ-009, REQ-010, REQ-012, REQ-013, REQ-014, REQ-017`

## Check layers

| Layer | Proves | Does not prove |
|---|---|---|
| schema | document structure and local invariants | provider semantics or authorization |
| reference integrity | canonical IDs, `$ref`, versions and links resolve | remote service behavior |
| protocol | declared MCP/A2A/local negotiation behavior | advertised business capability |
| semantic probe | bounded capability assertions | future availability or all production inputs |
| policy | binding, scope, grant, role and data constraints | work quality |
| checker | result acceptance for a specific node | unrelated claims or product outcomes |

## Conformance report

A report pins contract version, subject, subject revision, check catalogue
revision, start/end time and tool revision. Each check has `passed`, `failed`,
`skipped` or `blocked`, evidence references and a safe diagnostic. Overall status
is failed when any required check fails or is blocked.

Diagnostics MUST NOT include secret values. JSON instance paths, schema keyword,
expected class and supported versions are safe diagnostics.

## Required repository gates

`pnpm run check` runs:

1. TypeScript typecheck;
2. compilation of every Draft 2020-12 schema;
3. positive fixtures expected to pass;
4. negative fixtures expected to fail for their named rule;
5. cross-object policy tests;
6. Markdown lint;
7. relative-link resolution;
8. Mermaid syntax parse;
9. version and canonical-ID consistency;
10. UX trace lint;
11. one spelling of every extension key (G-08) and glossary profile names equal to the
    manifest schema's (G-12), in the documentation check;
12. the pipeline reference checker's rules PL-1…PL-4;
13. one allocation and one definition of every semantic rule code (G-13).

The merging session runs the same frozen command on the candidate and records its output in the pull request;
hosted CI runs it nightly on `main` and on a manual dispatch (`gh workflow run ci.yml --ref <branch>`). A green check never
substitutes for semantic review of prose. Before release, at least one planted
negative fixture is temporarily inverted and observed failing; the restored green
run is recorded in the retrospective.

## Clients and readers

Conformance binds the side that reads as well as the side that serves. These rules are checked
on what a client sends or a reader accepts, not on a provider's own documents:

| Who | Requirement | Rule | Checked by |
|---|---|---|---|
| a client of a service's token-protected routes, the events feed first | sends the token only in the header the descriptor's `auth.header` names, in the form `auth.scheme` names (`none`: the raw token; `Bearer`: `Bearer <token>`), and never assumes `Authorization: Bearer` | `FAC-SEM-036` | `test/service-feed.test.ts`, fixtures `fixtures/semantic/service-feed-request-*.json` ([service](service.md#feed-client), DEC-0025) |
| a reader of a settings backup | refuses a file whose checksum, counts or row widths do not match its tables | `FAC-SEM-035` | `test/settings-backup.test.ts`, fixtures `settings-backup*` ([service](service.md#settings-backup), DEC-0025) |
| a receiver of activity batches | attributes a batch to its client certificate's device and user, refuses an event that carries a content or person key instead of stripping it, and acknowledges the highest consumed seq of each stream | `FAC-SEM-037`, `FAC-SEM-039`, `FAC-SEM-045` | `test/activity-rules.test.ts`, fixtures `fixtures/semantic/activity-*`, `device-attribution-*` ([activity](activity.md#batch-and-acknowledgement), DEC-0030) |
| a callee of a delegation token or an approval | checks the signature against the estate's published keys, the times with a 60 s leeway, its own agent id in `aud`, the chain's depth, the called capability and its effect, and an approval's action digest and single use, in DL-13's order, answering one of the contract's refusal codes | DL-13, DL-18 | `test/delegation.test.ts`, `src/delegation.ts` `verifyDelegation`, `verifyApproval` ([delegation](delegation.md#the-verifier), DEC-0039) |
| the meter, answering a grant check | verifies the callee's onward token (audience itself, its grant-check capability, effect `none`) and answers any refusal of it as `principal-unproven`; reads the amount and the callee's `jti` from the request, never a token from it | DL-21 | `test/delegation-seams.test.ts`, `src/delegation.ts` `verifyMeterToken`, `schemas/grant-check-request.schema.json` ([delegation](delegation.md#spend-and-usage), DEC-0039) |
| the meter, reading a grant beside the hub | after the onward token is verified, reads the grant it names from the hub's projection (`grantsDir`, `<meta.id>.json`, 0600 in 0700) and denies `no-grant`, `grant-revoked`, `grant-expired` or `unknown-state` when the file is missing, unreadable, at another revision or not active; keys the `task` window on the token's `task`, else on the first `session` met walking the token's actor chain from its outermost actor, else on the grant itself (`grant:<ref>`), never on a `jti`; on Windows answers `unknown-state` before reading | DL-23, DL-24 | `test/meter-grant.test.ts`, `src/grant-projection.ts` `readProjectedGrant`, `src/delegation.ts` `taskWindowKey` ([delegation](delegation.md#the-hubs-grant-projection), DEC-0041) |
| Fabric, reading a `fabric://` link | ignores unknown parameters, validates the known ones and refuses a link that could carry a credential, matching credential words as whole words of a name (DEC-0041) | `FAC-SEM-052` | `test/fabric-button.test.ts`, `test/meter-grant.test.ts`, `src/fabric-links.ts` `parseFabricLink` ([Fabric's button](fabric-button.md#deep-links), DEC-0040) |
| a host handing a coding-agent session its folder | writes `handoff.json`, `context.md`, `mcp.json` and the declared `brief.md`/`task.md` in its user data, 0700/0600, the preamble naming one first tool, Claude Code's joined `--mcp-config=`, a bearer only per session and a secret only in `mcp.json` | `FAC-SEM-053`, `FAC-SEM-054`, `FAC-SEM-055` | `test/session-handoff.test.ts`, `src/session-handoff.ts` `validateSessionHandoff` ([session handoff](session-handoff.md#the-kits-checker), DEC-0042) |
| a device applying policy | applies a delivered policy only when it verifies and moves its revision forward, and never lets a lower layer override a locked key | `FAC-SEM-041`, `FAC-SEM-042` | `test/device-rules.test.ts`, fixtures `fixtures/semantic/device-policy-*` ([devices](devices.md#policy), DEC-0031) |

A client that fails `FAC-SEM-036` breaks without an error: the service refuses every poll, and
the client shows an empty feed and drops every `notify: true` event.

## Semantic rule codes

Every semantic rule has one `FAC-SEM-NNN` code, and this table is where a code is allocated.
A code is never reused or renumbered. A new code is reserved race-free with
`agent_sync.py reserve SEM` (DEC-0029), which reads the marker below as its floor and prints its
receipt as `SEM-0NNN` — the number of `FAC-SEM-NNN`. The row keeps that receipt in its last column,
which is also what agent-sync looks for when it reports reserved ids that never reached git: on 2026-10-07
main (DEC-0026) and an open branch (DEC-0025) each defined their own `FAC-SEM-028` and
`FAC-SEM-029`, numbered by hand. A rule is defined in one place: the codes `FAC-SEM-000`…`FAC-SEM-008` here, every
other code in the semantic-rules table of the specification this table names.
`test/consistency.test.ts` (G-13) fails when a code is allocated twice, defined in two rows anywhere
in the specifications, given other kinds there than here, named by `src/` without a row here, named by
two modules, or listed here without a checker. Codes up to `FAC-SEM-034` were allocated before the
register and carry no receipt.

**Next free rule code:** `FAC-SEM-056`

| Code | Kind | Defined in | Receipt |
|---|---|---|---|
| `FAC-SEM-000` | any | here: the value checked is a JSON object | — |
| `FAC-SEM-001` | `result` | here: a `succeeded` result keeps no unverified required claim | — |
| `FAC-SEM-002` | `execution-bundle` | here: the selected account is in the pinned project pool | — |
| `FAC-SEM-003` | `learning` | here: a learning proposal cannot apply itself | — |
| `FAC-SEM-004` | `promotion` | here: personal, credential or regulated content never promotes globally | — |
| `FAC-SEM-005` | `roles` | here: the estate has exactly one active CEO | — |
| `FAC-SEM-006` | `roles` | here: each project has exactly one active product manager | — |
| `FAC-SEM-007` | `coordination` | here: a renew names the claim it renews | — |
| `FAC-SEM-008` | `binding-bundle` | here: only an admitted provider revision is bound | — |
| `FAC-SEM-009` | `service-observation` | [service](service.md#semantic-rules) | — |
| `FAC-SEM-010` | `service-directory` | [service](service.md#semantic-rules) | — |
| `FAC-SEM-011` | `service-well-known` | [service](service.md#semantic-rules) | — |
| `FAC-SEM-012` | `service-descriptor` | [service](service.md#semantic-rules) | — |
| `FAC-SEM-013` | `provider-directory` | [provider](provider.md#semantic-rules) | — |
| `FAC-SEM-014` | `provider-observation` | [provider](provider.md#semantic-rules) | — |
| `FAC-SEM-015` | `provider-entry` | [provider](provider.md#semantic-rules) | — |
| `FAC-SEM-016` | `runner`, `runner-catalogue` | [runners](runners.md#semantic-rules) | — |
| `FAC-SEM-017` | `interop-tool` | [interop](interop.md#semantic-rules) | — |
| `FAC-SEM-018` | `interop-input-requests` | [interop](interop.md#semantic-rules) | — |
| `FAC-SEM-019` | `interop-job-trace`, `interop-result-trace` | [interop](interop.md#semantic-rules) | — |
| `FAC-SEM-020` | `service-manifest` | [service](service.md#semantic-rules) | — |
| `FAC-SEM-021` | `runner-catalogue` | [runners](runners.md#semantic-rules) | — |
| `FAC-SEM-022` | `interop-job-trace`, `interop-result-trace` | [interop](interop.md#semantic-rules) | — |
| `FAC-SEM-023` | `interop-tool-list`, `interop-tool` | [interop](interop.md#semantic-rules) | — |
| `FAC-SEM-024` | `service-descriptor` | [service](service.md#semantic-rules) | — |
| `FAC-SEM-025` | `service-usage` | [service](service.md#semantic-rules) | — |
| `FAC-SEM-026` | `comms-submit` | [project-comms](project-comms.md#semantic-rules) | — |
| `FAC-SEM-027` | `comms-transition` | [project-comms](project-comms.md#semantic-rules) | — |
| `FAC-SEM-028` | `runner-route` | [runners](runners.md#semantic-rules) | — |
| `FAC-SEM-029` | `runner-route` | [runners](runners.md#semantic-rules) | — |
| `FAC-SEM-030` | `route-bundle` | [runners](runners.md#semantic-rules) | — |
| `FAC-SEM-031` | `service-usage` | [service](service.md#semantic-rules) | — |
| `FAC-SEM-032` | `route-bundle` | [runners](runners.md#semantic-rules) | — |
| `FAC-SEM-033` | `route-bundle` | [runners](runners.md#semantic-rules) | — |
| `FAC-SEM-034` | `route-event` | [runners](runners.md#semantic-rules) | — |
| `FAC-SEM-035` | `settings-backup` | [service](service.md#semantic-rules) | SEM-0035 |
| `FAC-SEM-036` | `service-feed-request` | [service](service.md#semantic-rules) | SEM-0036 |
| `FAC-SEM-037` | `activity-batch`, `telemetry-event` | [activity](activity.md#semantic-rules) | SEM-0037 |
| `FAC-SEM-038` | `activity-batch`, `activity-summary`, `telemetry-event` | [activity](activity.md#semantic-rules) | SEM-0038 |
| `FAC-SEM-039` | `activity-ack`, `activity-batch`, `telemetry-event` | [activity](activity.md#semantic-rules) | SEM-0039 |
| `FAC-SEM-040` | `activity-summary` | [activity](activity.md#semantic-rules) | SEM-0040 |
| `FAC-SEM-041` | `device-policy-update` | [devices](devices.md#semantic-rules) | SEM-0041 |
| `FAC-SEM-042` | `device-policy-resolution` | [devices](devices.md#semantic-rules) | SEM-0042 |
| `FAC-SEM-043` | `device-health-observation` | [devices](devices.md#semantic-rules) | SEM-0043 |
| `FAC-SEM-044` | `device-enrollment` | [devices](devices.md#semantic-rules) | SEM-0044 |
| `FAC-SEM-045` | `device-attribution` | [devices](devices.md#semantic-rules) | SEM-0045 |
| `FAC-SEM-046` | `device-key-set` | [devices](devices.md#semantic-rules) | SEM-0046 |
| `FAC-SEM-047` | `spend-policy` | [spend policy](spend-policy.md#semantic-rules) | SEM-0047 |
| `FAC-SEM-048` | `grant-spend` | [spend policy](spend-policy.md#semantic-rules) | SEM-0048 |
| `FAC-SEM-049` | `delegation-claims` | [delegation](delegation.md#semantic-rules) | SEM-0049 |
| `FAC-SEM-050` | `delegation-mint` | [delegation](delegation.md#semantic-rules) | SEM-0050 |
| `FAC-SEM-051` | `approval-claims` | [delegation](delegation.md#semantic-rules) | SEM-0051 |
| `FAC-SEM-052` | `deep-link` | [fabric-button](fabric-button.md#semantic-rules) | SEM-0052 |
| `FAC-SEM-053` | `session-handoff`, `session-handoff-folder` | [session-handoff](session-handoff.md#semantic-rules) | SEM-0053 |
| `FAC-SEM-054` | `session-handoff-folder` | [session-handoff](session-handoff.md#semantic-rules) | SEM-0054 |
| `FAC-SEM-055` | `session-handoff-folder` | [session-handoff](session-handoff.md#semantic-rules) | SEM-0055 |

## Compatibility policy

Contract `0.x` minor versions may add optional fields, new schemas and new
profiles; consumers MUST ignore preserved extensions but need not accept unknown
normative profile versions. Removing or changing required semantics requires a
new major version. Provider revisions declare a supported contract-version range,
and a binding pins one exact negotiated version.
