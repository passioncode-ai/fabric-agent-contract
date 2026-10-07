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

CI runs the same frozen command on pull requests and `main`. A green check never
substitutes for semantic review of prose. Before release, at least one planted
negative fixture is temporarily inverted and observed failing; the restored green
run is recorded in the retrospective.

## Semantic rule codes

Every semantic rule has one `FAC-SEM-NNN` code, and this table is where a code is allocated.
A code is never reused or renumbered. A new code is reserved race-free with
`agent_sync.py reserve SEM` (DEC-0029), which reads the marker below as its floor: on 2026-10-07
main (DEC-0026) and an open branch (DEC-0025) each defined their own `FAC-SEM-028` and
`FAC-SEM-029`, numbered by hand. A rule is defined in one place: the codes `FAC-SEM-000`…`FAC-SEM-008` here, every
other code in the semantic-rules table of the specification this table names.
`test/consistency.test.ts` (G-13) fails when a code is allocated twice, defined in two tables,
emitted by `src/` without a row here, or listed here without being checked.

**Next free rule code:** `FAC-SEM-035`

| Code | Kind | Defined in |
|---|---|---|
| `FAC-SEM-000` | any | here: the value checked is a JSON object |
| `FAC-SEM-001` | `result` | here: a `succeeded` result keeps no unverified required claim |
| `FAC-SEM-002` | `execution-bundle` | here: the selected account is in the pinned project pool |
| `FAC-SEM-003` | `learning` | here: a learning proposal cannot apply itself |
| `FAC-SEM-004` | `promotion` | here: personal, credential or regulated content never promotes globally |
| `FAC-SEM-005` | `roles` | here: the estate has exactly one active CEO |
| `FAC-SEM-006` | `roles` | here: each project has exactly one active product manager |
| `FAC-SEM-007` | `coordination` | here: a renew names the claim it renews |
| `FAC-SEM-008` | `binding-bundle` | here: only an admitted provider revision is bound |
| `FAC-SEM-009` | `service-observation` | [service](service.md#semantic-rules) |
| `FAC-SEM-010` | `service-directory` | [service](service.md#semantic-rules) |
| `FAC-SEM-011` | `service-well-known` | [service](service.md#semantic-rules) |
| `FAC-SEM-012` | `service-descriptor` | [service](service.md#semantic-rules) |
| `FAC-SEM-013` | `provider-directory` | [provider](provider.md#semantic-rules) |
| `FAC-SEM-014` | `provider-observation` | [provider](provider.md#semantic-rules) |
| `FAC-SEM-015` | `provider-entry` | [provider](provider.md#semantic-rules) |
| `FAC-SEM-016` | `runner`, `runner-catalogue` | [runners](runners.md#semantic-rules) |
| `FAC-SEM-017` | `interop-tool` | [interop](interop.md#semantic-rules) |
| `FAC-SEM-018` | `interop-input-requests` | [interop](interop.md#semantic-rules) |
| `FAC-SEM-019` | `interop-job-trace`, `interop-result-trace` | [interop](interop.md#semantic-rules) |
| `FAC-SEM-020` | `service-manifest` | [service](service.md#semantic-rules) |
| `FAC-SEM-021` | `runner-catalogue` | [runners](runners.md#semantic-rules) |
| `FAC-SEM-022` | `interop-job-trace`, `interop-result-trace` | [interop](interop.md#semantic-rules) |
| `FAC-SEM-023` | `interop-tool-list`, `interop-tool` | [interop](interop.md#semantic-rules) |
| `FAC-SEM-024` | `service-descriptor` | [service](service.md#semantic-rules) |
| `FAC-SEM-025` | `service-usage` | [service](service.md#semantic-rules) |
| `FAC-SEM-026` | `comms-submit` | [project-comms](project-comms.md#semantic-rules) |
| `FAC-SEM-027` | `comms-transition` | [project-comms](project-comms.md#semantic-rules) |
| `FAC-SEM-028` | `runner-route` | [runners](runners.md#semantic-rules) |
| `FAC-SEM-029` | `runner-route` | [runners](runners.md#semantic-rules) |
| `FAC-SEM-030` | `route-bundle` | [runners](runners.md#semantic-rules) |
| `FAC-SEM-031` | `service-usage` | [service](service.md#semantic-rules) |
| `FAC-SEM-032` | `route-bundle` | [runners](runners.md#semantic-rules) |
| `FAC-SEM-033` | `route-bundle` | [runners](runners.md#semantic-rules) |
| `FAC-SEM-034` | `route-event` | [runners](runners.md#semantic-rules) |

## Compatibility policy

Contract `0.x` minor versions may add optional fields, new schemas and new
profiles; consumers MUST ignore preserved extensions but need not accept unknown
normative profile versions. Removing or changing required semantics requires a
new major version. Provider revisions declare a supported contract-version range,
and a binding pins one exact negotiated version.
