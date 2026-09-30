# Compatible agent provider guide — delivery plan

> **For agentic workers:** execute this plan as one documentation task under the
> repository pipeline and active coordination lease.

**Goal:** publish a practical, evidence-linked guide for creating and connecting
Fabric-compatible providers.

**Architecture:** one non-normative guide links the existing normative profiles,
schemas and fixtures. README and DOCMAP provide navigation; acceptance records
exact check receipts.

**Tech stack:** Markdown, Mermaid, JSON Schema references, repository doc gate.

**Spec:** `docs/evidence/specs/2026-08-27-agent-provider-guide-design.md`

## Global constraints

- Keep contract version `0.1.0` and exact profile revisions unchanged.
- Do not present a proposed command as installed or executable.
- Do not copy a complete schema-valid manifest into a second documentation home;
  link the existing positive fixtures.
- Use provider-neutral language; model choice remains internal to the provider.
- Make the guide discoverable from README and DOCMAP in the same change.

## Execution order

| Group | Tasks | Runs after | Carries |
|---|---|---|---|
| A | 1 | — | — |

## Task 1 — author, link and verify the guide

**Depends:** —

**Implements:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005

**Files:**

- Create: `docs/guides/connecting-compatible-agents.md`
- Create: `docs/evidence/specs/2026-08-27-agent-provider-guide-acceptance.md`
- Modify: `README.md`
- Modify: `docs/DOCMAP.md`
- Test: existing repository documentation and full gates

**Interfaces:**

- Consumes: existing profile, registry, result, versioning, schema and fixture paths.
- Produces: one author/operator entry point and one acceptance receipt.

**Definition of done:** all five guide requirements have file receipts; README and
DOCMAP resolve the guide; documentation and full gates pass; private CI passes.

- [ ] Author the guide from the approved design without changing normative rules.
- [ ] Add README and DOCMAP navigation.
- [ ] Run `pnpm docs:check`, `pnpm run check` and `git diff --check`.
- [ ] Record acceptance, commit, publish through private PR and merge after CI.

## Self-review

- REQ coverage: 5 in brief, 5 covered, difference ∅
- Named checks: 3 named, 3 resolve, 0 marked `review`
- Decisions: translated only; none added
- Cost: 4 surfaces/0 guards/5 REQ now, 4/0/5 in spec — proportionate
- Hygiene: 3 checks, 0 findings, 0 open
- Edges: 0 declared, 0 carry data, 0 removed
- Placeholders: 0 · Ambiguity: 0 found, 0 unresolved
