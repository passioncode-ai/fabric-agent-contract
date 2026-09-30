# Task brief — compatible agent provider guide

- **Date:** 2026-08-27
- **Task:** Record the agreed practical path for connecting an existing agent or
  authoring a new Fabric-compatible provider, then publish it to the private
  contract repository.
- **Operator confirmation:** after reviewing the proposed MCP/A2A/local-runner
  workflow, the operator asked to record the current design and push it.
- **UI verdict:** no — documentation only; no CLI, SDK, registry service or runtime
  is implemented in this run.
- **Model:** inherit the current top-tier model used by the active architecture
  thread.

## Source ledger

| Source | Current fact used | Owed by this run |
|---|---|---|
| `CONTEXT.md` | Provider, Agent, Capability, Binding and Profile already have canonical meanings | link; no vocabulary change |
| `docs/specification/profiles.md` | MCP `2026-07-28`, A2A `1.0` and `fabric-local-runner/0.1` are the three accepted profiles | explain selection without changing the contract |
| `docs/specification/registry.md` | discovery, admission and project binding are separate lifecycles | turn the lifecycle into an author/operator checklist |
| `schemas/manifest.schema.json` | manifest fields and profile-specific declarations are machine-readable | link as the authority and reuse positive fixtures |
| `schemas/result.schema.json` | all invocation paths converge on one evidence-bearing result envelope | explain required result semantics |
| `schemas/binding.schema.json` | project binding pins provider, admission, execution context, account pool and policies | explain isolation and versioning |
| `fixtures/positive/manifest-*.json` | passing examples exist for MCP, A2A and local runner | link as executable examples rather than duplicate them |
| `docs/DOCMAP.md` | a new guide must be discoverable and pass `pnpm docs:check` | add guide ownership and propagation |
| `docs/evidence/retro.md` | protocol claims require exact revisions and compatibility must be probed | keep revisions explicit; add no new learning without a real contrast |

**Contradictions:** none. The guide explains the already accepted contract and
does not add a fourth profile or make discovery equivalent to authorization.

## Frozen requirements

| ID | Requirement | Verification |
|---|---|---|
| REQ-001 | Give an unambiguous MCP/A2A/local-runner selection rule | decision tree and profile table |
| REQ-002 | Define the minimum provider project and manifest responsibilities | project layout, checklist and links to schema-valid examples |
| REQ-003 | Explain discovery, identity, admission, binding, invocation, replacement and rollback | lifecycle diagram and ordered workflow |
| REQ-004 | Explain how existing API, CLI, MCP and A2A agents are wrapped | integration matrix with honest unsupported case |
| REQ-005 | Separate the current contract from the proposed future authoring CLI/SDK | explicit current-state and not-implemented sections |

## Autonomy and delivery

- Work on `codex/agent-provider-authoring-guide` under the
  `AGENT-PROVIDER-GUIDE` Git lease.
- No new DEC is required because the guide introduces no architectural choice.
- Run `pnpm docs:check`, `pnpm run check` and `git diff --check`.
- Publish through a private pull request and merge after CI succeeds.
- The known coordination baseline/Notion-token degradation is recorded rather
  than repaired or silently treated as healthy.
