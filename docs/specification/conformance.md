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
12. the pipeline reference checker's rules PL-1…PL-4.

CI runs the same frozen command on pull requests and `main`. A green check never
substitutes for semantic review of prose. Before release, at least one planted
negative fixture is temporarily inverted and observed failing; the restored green
run is recorded in the retrospective.

## Clients and readers

Conformance binds the side that reads as well as the side that serves. These rules are checked
on what a client sends or a reader accepts, not on a provider's own documents:

| Rule | Who | Requirement | Checked by |
|---|---|---|---|
| `FAC-SEM-029` | a client of a service's token-protected routes, the events feed first | sends the token only in the header the descriptor's `auth.header` names, in the form `auth.scheme` names (`none`: the raw token; `Bearer`: `Bearer <token>`), and never assumes `Authorization: Bearer` | `test/service-feed.test.ts`, fixtures `fixtures/semantic/service-feed-request-*.json` ([service](service.md#feed-client), DEC-0025) |
| `FAC-SEM-028` | a reader of a settings backup | refuses a file whose checksum, counts or row widths do not match its tables | `test/settings-backup.test.ts`, fixtures `settings-backup*` ([service](service.md#settings-backup), DEC-0025) |

A client that fails `FAC-SEM-029` breaks without an error: the service refuses every poll, and
the client shows an empty feed and drops every `notify: true` event.

## Compatibility policy

Contract `0.x` minor versions may add optional fields, new schemas and new
profiles; consumers MUST ignore preserved extensions but need not accept unknown
normative profile versions. Removing or changing required semantics requires a
new major version. Provider revisions declare a supported contract-version range,
and a binding pins one exact negotiated version.
