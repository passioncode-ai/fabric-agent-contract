# AR-1 in the contract — record and handoff (2026-09-30)

Module AR-1 of Fabric's agent-registry plan
([plan](https://github.com/passioncode-ai/fabric/blob/062895d/docs/evidence/plans/2026-09-29-agent-registry-plan.md),
[locked contracts](https://github.com/passioncode-ai/fabric/blob/062895d/docs/evidence/specs/2026-09-29-agent-registry-contracts.md),
Fabric `062895d`). Decision: DEC-0016. Questions: OQ-0001…OQ-0007. This is a dated
record; the living documents are the four specifications it names.

## Objective

Move the locked contracts C1–C4 into this repository as normative text, schemas,
fixtures and rules, and close gaps G-07, G-08, G-11 and G-12 — so that the Fabric Agent
Adapter can pin one revision that carries them (AR-1.6).

## What landed, in four increments

The operator asked for small landings, so each group merged on its own after its gate.

| Increment | Pull request | Squash commit | Tests after |
|---|---|---|---|
| Interop `fabric-interop/0.1` (C3), G-08, G-12, DEC-0016, OQ-0001…0007 | [#8](https://github.com/passioncode-ai/fabric-agent-contract/pull/8) | `a4d10fc` | 99 |
| Provider entries `fabric-provider/0.1` (C1), G-07 | [#9](https://github.com/passioncode-ai/fabric-agent-contract/pull/9) | `3175c35` | 117 |
| Runner catalogue (C2) | [#10](https://github.com/passioncode-ai/fabric-agent-contract/pull/10) | `d7e79a4` | 125 |
| Pipelines `pipeline/0.1` (C4) and its checker, G-11 | the pull request that adds this file | — | 148 |

| Contract | Normative home | Schemas | Rules |
|---|---|---|---|
| C1 | [provider.md](../../specification/provider.md) | `provider` | FAC-SEM-013, -014, -015 |
| C2 | [runners.md](../../specification/runners.md) | `runners` | FAC-SEM-016, -021 |
| C3 | [interop.md](../../specification/interop.md) | eight `interop-*` | FAC-SEM-017, -018, -019 |
| C4 | [pipeline.md](../../specification/pipeline.md) | `pipeline` | PL-1…PL-4 (`src/pipeline-check.ts`) |
| G-07 | [service.md](../../specification/service.md#semantic-rules) | manifest service block | FAC-SEM-020 |
| G-08 | [interop.md](../../specification/interop.md#extension-key) | — | `docs:check` |
| G-11 | [versioning.md](../../specification/versioning.md#one-contract-pin) | `contract-pin` | `pnpm pin:check` |
| G-12 | [CONTEXT.md](../../../CONTEXT.md) | — | `docs:check` |

C5 (`registry.observed@1`) and C6 (Observatory inventory) are Fabric-internal and
Observatory-side; they belong to AR-2, not to this contract.

## Checks actually run

- `pnpm run check` exit 0 at every increment (tests 99 → 117 → 125 → 148; UX lint,
  documentation check and markdownlint clean). Hosted CI did not run: GitHub Actions is
  billing-blocked for the organisation, which is not a pass.
- Red first: with fixtures and tests written before any schema, 56 tests failed.
- Every new rule was watched failing on a planted defect and restored (19 plants):
  FAC-SEM-013…021, PL-1…PL-4, G-08, G-11, G-12 and three schema plants. One plant first
  stayed green — it widened only two of the four traceparent segments — and was
  re-planted across the whole pattern, which the uppercase fixture then caught.
- `pnpm pin:check` read-only against two consumers, pin `a5a2709`: the Fabric Agent
  Adapter — every mention equals it; Fabric at `062895d` (excluding dated records) — 52
  mentions of three other revisions (`1eeb5a3`, `4897370`, `5d2ccd7`), for Fabric's
  owner to resolve.

## Decisions taken here

DEC-0016: the registry contracts are versioned extensions inside contract `0.1.0`
(additive, as DEC-0015 was), extension keys have one spelling, a consumer pins one
commit. New codes FAC-SEM-020 and FAC-SEM-021.

## Open

- OQ-0001…OQ-0007 wait for the operator; each names what is enforced meanwhile.
- Fabric Dashboards' ADR-0003 and design spell the service key differently (G-08): a
  change in that repository, not here.
- Fabric names three contract revisions (G-11): Fabric adds a `fabric-contract.lock.json`
  and runs `pnpm pin:check` from a contract checkout.

## Next task

AR-1.6 in the Fabric Agent Adapter: pin this repository's commit that merged the
pipeline increment, in one `fabric-contract.lock.json`; kits emit trace context and job
handles; a `providers/` writer; the probe gains the interop rules.
