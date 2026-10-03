# Retrospective

## Standing instructions

- A protocol claim is not current unless its revision and retrieval date are recorded.
- A compatibility check must be observed rejecting a planted incompatible fixture before its green result counts.
- A learning is created from a failed attempt beside a verified correction, never from a successful run alone.
- A run may propose a prompt, pipeline, or policy change but may not mutate the rules governing itself.
- A conformance probe for a placement reached through a platform is accepted only after it has run against a real instance behind that platform, not only against a sample the run itself wrote.

## Run stamps

- `2026-08-26-contract-build` — local implementation commit `5a7b4fb`;
  published by merged PR #1 at `489737051828fafec92463df04b6a6fd3280c7b7`.
- `2026-08-26-adoption` — Fabric consumer PR #1 merged at
  `5bb98740c84b006e0ef4f1509ec66018623d75cd`; navigation-only wiki cards written.
- `2026-08-27-memory-kernel` — approved architecture committed at `0d1171f`;
  publication receipt is recorded by the private repository workflow.
- `2026-08-27-provider-guide` — compatible provider guide committed at `cb638b1`;
  no new executable mechanism or failure/correction contrast was introduced.
- `2026-10-02-remote-service` — contract `2ce3922` (DEC-0019); adapter `447b558` v0.6.0 and
  `d3a4c67` v0.6.1; Fabric Dashboards `f6cde69` v0.4.0 and `75eba78` v0.4.1; acceptance in
  `docs/evidence/runs/2026-10-02-remote-service/acceptance.md`.

## Recent log

### 2026-08-26 — Contract validation build

- **Goal:** make architecture claims machine-checkable without building a runtime.
- **Failed attempt:** Draft 2020-12 conditional `required` clauses and composed
  work-object schemas failed Ajv strict compilation; the initial Mermaid Node
  check also reached browser-only DOMPurify after parsing non-flowchart syntax.
- **Verified correction:** conditional branches now declare the properties they
  require, composed objects apply `unevaluatedProperties` at their object root,
  and Mermaid distinguishes parser errors from the documented Node sanitizer
  limitation. `CI=true pnpm run check` passed with 34 tests and 0 Markdown errors.
- **Planted failure:** fixture `result-missing-not-verified` was deliberately
  marked valid. Focused Vitest exited `1` and reported the missing required
  property `notVerified`; the catalogue was restored before the final gate.
- **Learning:** schema dialect support is not the same as strict-validator
  compatibility. New schema patterns must first compile under the exact Ajv mode
  used by CI, then prove one positive and one negative instance.
- **Proposed future revision:** none. The correction is part of contract 0.1.0
  before publication and does not alter an active released rule.

### 2026-08-26 — Publication and adoption closeout

- **Goal:** prove that the standalone contract can be published privately and
  adopted without copying its normative text into Fabric or the wiki.
- **Failed attempt:** package script `check` was initially invoked as `pnpm check`;
  pnpm 11 treated `check` as its own command, so the expected repository gate did
  not run.
- **Verified correction:** every local, documented and CI invocation now uses
  `pnpm run check`. The full gate passed with 34 tests; GitHub's `contract` job
  completed successfully before PR #1 merged.
- **Learning:** command-name collisions are part of the executable contract. A
  gate receipt must name the exact command and prove the intended package script
  ran, not merely record a zero exit code.
- **Loop correction:** Fabric owns its adoption ADR and consumer links; the wiki
  owns navigation only. Future contract changes update those pointers after merge
  and never paste a second editable specification.

### 2026-08-27 — Memory Kernel architecture

- **Goal:** select a concrete memory pilot without making its storage engine the
  platform's authority for identity, truth, promotion or deletion.
- **Failed attempt:** the shortest candidate path was to expose
  `mcp-memory-service` directly as Fabric's MCP memory provider. Source inspection
  showed that its pinned implementation tests an older MCP revision than the
  contract's `2026-07-28` profile, and direct binding would also give backend
  operations an authority the project/global policy model does not allow.
- **Verified correction:** DEC-0014 places a Fabric Memory Kernel in front of a
  replaceable internal adapter. Exact revisions live in the ledger; the backend
  stores rebuildable search/graph projections. The full repository gate passed
  with 4 test files, 34 tests and 0 Markdown errors.
- **Learning:** protocol availability is not semantic admission. A packaged MCP
  endpoint may accelerate a backend pilot, but it cannot bypass a host-owned
  control plane or an exact-revision conformance probe.
- **Loop correction:** backend consolidation and graph inference create proposals
  only. Memory-quality audits compare false/stale recall and task outcomes, and
  approved learnings target future revisions rather than the active run.

### 2026-09-30 — Agent-registry contracts (AR-1)

- **Goal:** land Fabric's locked C1–C4 with fixtures and rules, and close G-07, G-08,
  G-11 and G-12.
- **Failed attempt:** the first pin check counted every line holding the word
  "contract", and on Fabric it reported 114 drifting mentions, half of them other
  contracts' commits. A planted-defect run also left one schema plant green, because the
  plant widened only part of the traceparent pattern.
- **Verified correction:** a line counts only when it names this contract or its pin, or
  sits under a heading that does (two tests added red first); Fabric's report fell to 52
  real mentions of three revisions. The traceparent plant was redone over all four
  segments and the uppercase fixture caught it.
- **Learning:** a drift check is only as useful as its false-positive rate on the
  largest consumer; and a plant proves a test only when it restores the whole defect.
- **Loop correction:** the record of this run is
  [2026-09-30-ar1-contract.md](plans/2026-09-30-ar1-contract.md).

### 2026-10-03 — Remote service placement (DEC-0019)

- **Goal:** let an online agent or dashboard become a `fabric-service/0.1` service and appear in
  the host beside the local ones.
- **Failed attempt 1 (stage 8, surfaced; owned by stage 5 of the adapter):** the probe passed the
  shipped TLS sample but failed the first real service: `network.host-check` got `404` because a
  platform router answers a foreign `Host` before the process does. The sample terminates its own
  TLS, so no test ever met a router.
- **Failed attempt 2 (stage 8; owned by stage 3 of the host):** MCP `link` without a path pointed
  at the origin root, where a panel served under a path answers `404`. The spec named the
  dashboard surface but not the path-less default.
- **Failed attempt 3 (stage 7; owned by the operator's own command discipline):** a public push
  chained the name gate with `;` instead of `&&`. One private path reached a public branch and was
  squashed out before merge.
- **Failed attempt 4 (stage 9; owned by stage 1):** ADR-0011 cited Fabric ADR-0083 as saying
  «loopback only» from memory. It does not.
- **Verified corrections:** adapter 0.6.1 `guard_verdict` (4 tests, 4 mutations killed;
  production 0 FAIL); host 0.4.1 `http_url` follows the dashboard surface (a test plus a
  mutation); `public-name-gate && git push` on every public push (it blocked one more leak during
  0.4.1); ADR-0011 corrected after reading ADR-0083.
- **Learning:** a sample written by the same run shares its blind spots. The platform in front of
  a remote service is part of the protocol's reality, so the gate is the real instance — now a
  standing instruction above.
