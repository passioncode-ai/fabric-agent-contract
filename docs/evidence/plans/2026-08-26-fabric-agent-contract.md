# Fabric Agent Contract 0.1.0 — implementation plan

> **For agentic workers:** execute this plan task-by-task under the task-pipeline
> stage-5 build doctrine — isolated workspace, one implementer per task, a review
> with all three verdicts after each (spec compliance, REQ satisfied, code
> quality). Steps use `- [x]` checkboxes.

**Goal:** publish a privately merged, machine-validated architecture contract and synchronize its Fabric and wiki consumers.

**Architecture:** Markdown and Draft 2020-12 schemas are normative. A small
TypeScript validation harness compiles schemas, exercises fixtures and checks
documentation; GitHub Actions runs the same command. Adoption uses Git as record
plane, Notion/Git-ref coordination and links rather than copied contract text.

**Tech stack:** Node.js >=20, pnpm, TypeScript, Ajv 2020, Vitest, Mermaid 11, Markdown.

**Spec:** `docs/evidence/specs/2026-08-26-fabric-agent-contract-design.md`

## Global constraints

- Contract version: `0.1.0`.
- Schema dialect: `https://json-schema.org/draft/2020-12/schema`.
- Canonical schema prefix: `https://fabric.passioncode.ai/agent-contract/0.1.0/`.
- Runtime floor for repository validation: Node.js `>=20`.
- Package manager: pnpm, pinned through `packageManager`; frozen lockfile in CI.
- Implementation language for validators: TypeScript with strict type checking.
- Schema validator: Ajv's dedicated 2020-12 build plus `ajv-formats`.
- Test runner: Vitest in non-watch mode.
- Documentation: Markdown with Mermaid source only; Figma disabled.
- Repository: private, unlicensed, `private: true`, no package publication.
- Models: provider-owned and outside base contract 0.1.0.
- Secrets: opaque references only; ambient environment denied.
- External actions: draft-only without a named scoped expiring grant.
- Canonical knowledge: merged Git revisions; unmerged branches never enter the canonical KB.

## Execution order

| Group | Tasks | Runs after | Carries |
|---|---|---|---|
| A | 1 | — | — |
| B | 2, 3 | A | package scripts, schema loader and canonical IDs |
| C | 4 | 2, 3 | fixture catalogue and validator results consumed by full gate |
| D | 5 | 4 | green local contract revision and generated wiring target |
| E | 6 | 5 | coordinated, clean repository commit ready for remote CI |
| F | 7 | 6 | merged canonical contract URL and commit consumed by Fabric |
| G | 8 | 7 | both merged repository revisions consumed by wiki and acceptance |

---

### Task 1: Validation walking skeleton

**Depends:** —

**Implements:** REQ-001, REQ-017 — standalone private repository and complete CI gate.

**Files:**
- Create: `package.json`, `tsconfig.json`, `.npmrc`, `.gitignore`
- Create: `src/contract.ts`, `test/schema-compilation.test.ts`

**Interfaces:**
- Consumes: canonical schemas under `schemas/`
- Produces: `CONTRACT_VERSION: "0.1.0"`, `loadSchemas(): Promise<object[]>`, package scripts `test`, `docs:check`, `check`

**Definition of done:** strict TypeScript compiles; all 13 schemas load as JSON; the first Vitest test is green.

- [x] **Step 1:** write a test asserting 13 schemas, unique absolute `$id` values and Draft 2020-12.
- [x] **Step 2:** run `pnpm test -- schema-compilation` and observe failure because the harness is absent.
- [x] **Step 3:** implement `loadSchemas` with `node:fs/promises` and `CONTRACT_VERSION = "0.1.0" as const`.
- [x] **Step 4:** run the focused test and `pnpm typecheck`; expect pass.
- [x] **Step 5:** commit `build: add contract validation harness`.

### Task 2: Schema and fixture conformance

**Depends:** [1]

**Implements:** REQ-002, REQ-003, REQ-005, REQ-006 — common objects, profiles, typed result and work graph.

**Files:**
- Create: `fixtures/positive/*.json`, `fixtures/negative/*.json`, `fixtures/catalogue.json`
- Create: `src/validator.ts`, `test/fixtures.test.ts`

**Interfaces:**
- Consumes: `loadSchemas()` and schema canonical IDs
- Produces: `createValidator(): Promise<Ajv2020>`, `validateFixture(entry): ValidationResult`

**Definition of done:** at least one positive and one named negative fixture per schema family; MCP, A2A and local-runner manifests all pass; result missing `notVerified` fails.

- [x] **Step 1:** add catalogue entries and a failing parameterized fixture test.
- [x] **Step 2:** run `pnpm test -- fixtures`; expect missing `createValidator`.
- [x] **Step 3:** compile all schemas with Ajv 2020 and `ajv-formats`, then validate catalogue expectations and required error keywords.
- [x] **Step 4:** run focused tests; expect every positive pass and every negative fail for its named rule.
- [x] **Step 5:** commit `test: add contract conformance fixtures`.

### Task 3: Cross-object semantic guards

**Depends:** [1]

**Implements:** REQ-004, REQ-007, REQ-008, REQ-009, REQ-010, REQ-011, REQ-012, REQ-013, REQ-014 — admission, memory, learning, versioning, coordination, execution, role and governance invariants.

**Files:**
- Create: `src/semantic-rules.ts`, `test/semantic-rules.test.ts`
- Create: semantic positive/negative fixtures under `fixtures/`

**Interfaces:**
- Consumes: schema-valid typed JSON objects
- Produces: `evaluateSemanticRules(kind: string, value: unknown): Finding[]` with stable finding codes

**Definition of done:** tests reject succeeded results with required unknowns, out-of-pool account overrides, self-applying learnings, unsafe promotion, wrong base-role cardinality and malformed coordination transitions.

- [x] **Step 1:** write a failing table of rule codes `FAC-SEM-001` through `FAC-SEM-008`.
- [x] **Step 2:** run `pnpm test -- semantic-rules`; expect missing evaluator.
- [x] **Step 3:** implement pure deterministic rules returning `{code, instancePath, message}` without reading secrets or external state.
- [x] **Step 4:** run focused tests and confirm zero unexpected findings on positive sets.
- [x] **Step 5:** commit `feat: enforce cross-object contract invariants`.

### Task 4: Documentation and CI gates

**Depends:** [2, 3]

**Implements:** REQ-015, REQ-016, REQ-017 — traced author/operator scenarios, full estate reference and full CI.

**Files:**
- Create: `src/docs-check.ts`, `test/docs-check.test.ts`, `.markdownlint-cli2.jsonc`
- Create: `.github/workflows/ci.yml`
- Modify: `package.json`, `README.md`, `docs/DOCMAP.md`

**Interfaces:**
- Consumes: fixture and semantic test suites, Markdown documents and Mermaid fences
- Produces: `pnpm docs:check`, `pnpm run check`, CI job `contract`

**Definition of done:** links resolve, Mermaid parses, UX lint passes, schema and document versions agree, Markdown lints and CI invokes only `pnpm run check` after frozen install.

- [x] **Step 1:** write failing tests for a broken relative link, invalid Mermaid body and mismatched contract version.
- [x] **Step 2:** run `pnpm test -- docs-check`; expect failures.
- [x] **Step 3:** implement exported link/version/Mermaid check functions and wire package scripts plus least-privilege GitHub Actions.
- [x] **Step 4:** run `pnpm run check`; expect green.
- [x] **Step 5:** commit `ci: gate schemas fixtures and documentation`.

### Task 5: Coordination adoption

**Depends:** [4]

**Implements:** REQ-018 — initialize Notion coordination with Git-ref leases and generated wiring.

**Files:**
- Create through `agent_sync.py`: `.claude/agent-sync.json`, `docs/AGENT_SYNC.md`
- Create ignored local-only: `.env.agent-sync`
- Modify: `.gitignore`, `AGENTS.md`

**Interfaces:**
- Consumes: repository remote and operator-supplied Notion token reference
- Produces: healthy `agent_sync.py check` and generated wiring snapshot

**Definition of done:** backend is Notion, lease backend is Git refs, config points to a dedicated container, env file is ignored, `check` is green without exposing the token.

- [x] **Step 1:** run `agent_sync.py adopt` and record no incompatible coordination state.
- [x] **Step 2:** run `agent_sync.py init --backend notion` with Git-ref leases and dedicated container.
- [x] **Step 3:** place the token only through the ignored env path or stop with that exact credential blocker.
- [x] **Step 4:** run `agent_sync.py setup` then `agent_sync.py check`; expect pass.
- [x] **Step 5:** commit generated configuration and snapshot, never the secret.

### Task 6: Private contract publication

**Depends:** [5]

**Implements:** REQ-001, REQ-017, REQ-021 — private GitHub repository, green PR/merge and clean reconciled state.

**Files:** remote state only; no new normative files.

**Interfaces:**
- Consumes: green local commit on `codex/agent-contract-v0.1`
- Produces: private `passioncode-ai/fabric-agent-contract`, merged PR, CI receipt and main commit URL

**Definition of done:** GitHub reports `PRIVATE`; PR checks green and auto-merged; local main equals origin/main and is clean.

- [x] **Step 1:** verify `gh auth status`, stopping only for interactive login if invalid.
- [x] **Step 2:** create private repository and push main plus feature branch.
- [x] **Step 3:** open PR, enable auto-merge and wait for checks.
- [x] **Step 4:** verify visibility, merged state and remote commit.
- [x] **Step 5:** reconcile coordination and record publication receipt.

### Task 7: Fabric consumer synchronization

**Depends:** [6]

**Implements:** REQ-019 — Fabric points to the canonical external contract and adopts confirmed terminology.

**Files:**
- Modify under Fabric lease: `CONTEXT.md`, `docs/architecture/agent-composition.md`, carry-over/backlog registers
- Create under reserved ID: `docs/adr/0012-*.md` or live next ID

**Interfaces:**
- Consumes: merged private contract URL and commit
- Produces: Fabric ADR partially superseding ADR-0010, canonical architecture link and merged Fabric PR

**Definition of done:** shared-file lease held for all edits; live ID reserved; Fabric checks green; private PR merged; lease released and reconciliation green.

- [x] **Step 1:** read live `docs/AGENT_SYNC.md`, acquire one claim and reserve next ADR ID.
- [x] **Step 2:** write ADR and propagate `product-manager`, external contract ownership and optional-role semantics.
- [x] **Step 3:** run Fabric gates and evidence checks.
- [x] **Step 4:** push private PR, wait for green and merge.
- [x] **Step 5:** record as-built, reconcile and release on every path.

### Task 8: Wiki, planted failure and acceptance

**Depends:** [7]

**Implements:** REQ-020, REQ-021 — navigation-only wiki synchronization and evidence-backed final closeout.

**Files:**
- Modify: `docs/evidence/retro.md`, requirement statuses and module-map statuses
- Wiki: navigation note only, through the installed wiki workflow

**Interfaces:**
- Consumes: merged contract and Fabric commit URLs
- Produces: resolving wiki links, planted-failure receipt, final green command output and clean-state audit

**Definition of done:** a deliberately inverted negative fixture was observed red then restored green; wiki duplicates no normative spec; all 21 REQs have receipts or an explicit blocker; repos are clean and reconciled.

- [x] **Step 1:** invert one negative-fixture expectation, run the focused test and record the expected failure; restore it immediately.
- [x] **Step 2:** run `pnpm install --frozen-lockfile && pnpm run check` from a clean checkout and record output.
- [x] **Step 3:** use the wiki update workflow to add links and verify they resolve.
- [x] **Step 4:** update module/REQ statuses and retrospective with evidence, then merge the documentation closeout if remote state changed.
- [x] **Step 5:** audit `git status`, PRs, CI, coordination residue and open questions; hand the acceptance table to the operator.

## Self-review

- REQ coverage: 21 in brief, 21 covered, difference ∅
- Named checks: 14 named, 14 created by their owning tasks or available before use, 0 marked `review`
- Decisions: checked against DEC-0001..DEC-0013 and the four rejected stage-2 options — translated without new decision
- Cost: 8 tasks/10 guards/21 REQs now, 8 modules/10 guards/21 REQs at stage 2 — proportionate
- Hygiene: 4 checks, 0 findings, 0 open
- Edges: 7 declared, 7 carry data, 3 fake sequencing edges removed
- Placeholders: 0 · Ambiguity: 2 found, 2 resolved inline (coordination credential stop and live ADR ID)
