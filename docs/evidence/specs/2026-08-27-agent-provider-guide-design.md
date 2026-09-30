# Compatible agent provider guide — design

`covers: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005`

Status: approved by the operator in the preceding architecture discussion. This
is an explanatory layer over contract `0.1.0`, not a new protocol or runtime.

## Purpose and boundary

`covers: REQ-001, REQ-005`

Add one canonical author/operator guide that answers two questions: how an
existing agent maps to MCP, A2A or local runner, and what a newly authored
provider must publish to be eligible for Fabric admission. The guide MUST keep
the current repository state separate from proposed CLI/SDK automation.

No schema, profile, protocol revision, decision, UX behavior or runtime changes.

## Information architecture

`covers: REQ-001, REQ-002, REQ-003, REQ-004`

The guide owns the onboarding workflow. Normative details remain in their
existing homes:

- profile semantics in `docs/specification/profiles.md`;
- admission and binding in `docs/specification/registry.md`;
- result semantics in `docs/specification/results-and-evidence.md`;
- machine shapes in `schemas/`;
- executable examples in `fixtures/positive/`.

The guide links rather than duplicates complete manifests. It includes a profile
decision tree, existing-system adapter matrix, recommended provider repository
layout, manifest responsibility table, admission/binding sequence, version and
rollback flow, current-state inventory and proposed future command surface.

## Lifecycle

`covers: REQ-003`

The workflow is discovery → declaration validation → identity verification →
protocol negotiation → safe semantic probes → capability-scoped admission →
project binding → pinned run. Discovery grants no project access. Replacement
creates new provider/admission/binding revisions; active runs stay pinned.

## Existing agent mapping

`covers: REQ-001, REQ-004`

- autonomous remote agent with its own task lifecycle → A2A `1.0`;
- host-shaped remote or stdio functions/resources → MCP `2026-07-28`;
- installed terminal process → `fabric-local-runner/0.1`;
- ordinary HTTP API → an MCP capability adapter or A2A peer adapter depending on
  who owns the task lifecycle;
- web UI without a stable programmatic interface → not directly compatible.

## Evidence and verification

`covers: REQ-002, REQ-003, REQ-005`

Documentation links resolve through `pnpm docs:check`. The full gate compiles the
schemas and validates positive/negative fixtures through `pnpm run check`. These
checks prove the contract repository, not a third-party provider implementation;
that implementation still needs protocol negotiation and semantic admission
probes.

## Global constraints

- Keep contract version `0.1.0` and exact profile revisions unchanged.
- Do not present a proposed command as installed or executable.
- Do not copy a complete schema-valid manifest into a second documentation home;
  link the existing positive fixtures.
- Use provider-neutral language; model choice remains internal to the provider.
- Make the guide discoverable from README and DOCMAP in the same change.

## Self-review

- REQ coverage: 5 in brief, 5 covered, difference ∅
- Named checks: 2 named, 2 resolve, 0 marked `review`
- Decisions: checked against the brief and DEC-0002/0009/0010/0011/0013 — no contradiction
- Cost: 4 surfaces/0 guards/5 REQ now, 4/0/5 at approval — proportionate
- Hygiene: 2 checks, 0 findings, 0 open
- Placeholders: 0 · Ambiguity: 1 found, 1 resolved inline by separating current and proposed tooling
