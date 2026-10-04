<sub>ssheleg skills — task-pipeline · agent-interop · agent-sync · evidence-docs</sub>

# Product tool underscore names — owner issue #8 / Fabric CO-193

Source packet from authorized owner `origin/main` at
`71cdd6ed461a177e17aa2db7f5ed2059a537543e`. Objective: let a strict contract
validator accept a product's own `read_message` / `list_messages` tool names
consistently, without adding a required field, changing authority or silently
rewriting a past contract revision. [Owner issue #8](https://github.com/passioncode-ai/fabric-agent-contract/issues/8)
is the execution tracker; Fabric retains its canonical CO-193 status.

## Completed source work

- [`common.schema.json`](../../schemas/common.schema.json) widens only the
  capability-name character class to admit underscore. Required fields, type,
  lowercase first character and 2–128-character bound are retained.
- [`manifest.schema.json`](../../schemas/manifest.schema.json) replaces its
  independent old pattern with the common definition. This matters: hub
  arguments alone would otherwise accept a name the manifest cannot declare,
  contradicting interop C3.1's equality of declared and served tool names.
- [DEC-0020](../DECISIONS.md#dec-0020--capability-names-admit-product-tool-underscores-through-one-shared-definition)
  and the [normative naming amendment](../specification/interop.md#capability-names)
  state compatibility and propagation. Contract/protocol versions stay as they
  were under DEC-0016; source commits and consumer pins distinguish revisions.
- Four positive conformance fixtures cover the actual four schemas; a negative
  hub fixture rejects a leading underscore. The compiled Ajv regression exercises
  old names, underscore product names, first-character/type/punctuation and
  length refusals through each complete document and its actual `$ref` chain.
  The inventory test also prevents the manifest's duplicate from returning.

## Shared-definition inventory

Computed by walking `loadSchemas()` and every `$ref` in
[`capability-names.test.ts`](../../test/capability-names.test.ts); four uses after
the fix, three common refs plus one inline duplicate on the baseline.

| Surface | Schema location | Effect of this source change |
|---|---|---|
| Hub call | `interop-agent-call.schema.json / properties.capability` | Product tool underscores accepted |
| Manifest declaration | `manifest.schema.json / properties.capabilities.items.properties.name` | Inline duplicate replaced; same names as call |
| Running service advertisement | `service-well-known.schema.json / properties.surfaces.properties.mcp.properties.capabilities.items` | Same name vocabulary |
| Pipeline stage | `pipeline.schema.json / $defs.stage.properties.capability` | Same name vocabulary |

`binding.schema.json / properties.capability` is a URI identity, not a tool name.
`governance.schema.json` does not carry a capability-name field. Neither changes.
Other patterns for role slugs, pipeline/stage IDs and provider identities are not
capability names and remain unchanged. Name acceptance does not admit a provider,
grant access or enlarge a grant. COM's future capability inventory must distinguish
these named tools from URI capability identities; this packet adds no COM runtime.

## Checks actually executed

| Command / baseline | Result | Receipt |
|---|---|---|
| `pnpm install --frozen-lockfile` | exit 0; lockfile unchanged | Installed only in isolated worktree |
| `pnpm exec vitest run test/capability-names.test.ts` before schema edits | exit 1; 17 failed, 60 passed | [Watched baseline rejection](co193-receipts/baseline-red.txt) |
| Focused capability, fixtures, schema compilation, consistency and interop suites | exit 0; 5 files, 210 passed | [Focused green](co193-receipts/focused-green.txt) |
| `pnpm run check` after source/spec/decision changes | exit 0; 10 files, 258 tests; types, UX lint, docs and Markdown pass | [Full owner gate](co193-receipts/full-check.txt) |

The 17 watched failures were 16 underscore acceptances (four cases on four
surfaces) plus the missing manifest shared reference. Existing-name and invalid
cases passed before and after. The full suite retains the original fixture
catalogue and adds five fixtures; this is not a copied-regex-only test.

Documentation-only handoff/link amendments receive a final `pnpm docs:check`
before commit; its receipt is [final-docs.txt](co193-receipts/final-docs.txt).
Git whitespace check and remote branch verification accompany delivery.
Hosted CI is separate; no workflow was manually dispatched here.

## Coordination, evidence and compatibility boundary

Read owner `AGENTS.md`, `CONTEXT.md`, `docs/DOCMAP.md`, `docs/DECISIONS.md` and
generated `docs/AGENT_SYNC.md`; relevant skills were task-pipeline, agent-interop,
agent-sync and evidence-docs. The source packet uses an isolated branch/worktree.
Run `r-codexco19320` reserved DEC-0020 by remote Git CAS and took the decision-file
lease/resource claim before editing. Git leases are exclusive across machines;
the record plane is degraded local `fs` because no `.env.agent-sync` is present.
Hooks are not enforced by this Codex run; `guard` was executed explicitly.
No credential/config copying was used to disguise that degradation.

External checks read the pinned
[JSON Schema Draft 2020-12 validation vocabulary](https://json-schema.org/draft/2020-12/json-schema-validation)
and an older [MCP 2025-06-18 tools example](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)
showing `get_weather`. These support the structural validation/tool-name context;
they do not amend this repository's pinned MCP profile or supply a new normative
wire rule. DEC-0020's acceptance decision and compiled-schema tests are the
authority for this change.

## Open work and exact next task

This is **source-only**: not merged, not an immutable release/tag, not consumer
repinning, and not live hub or COM acceptance. Old-schema consumers still reject
underscores even though their version string is also `0.1.0`; they need the
reviewed exact new commit. No historical tag or existing consumer pin is moved.
No private consumer names are added; `example-agent` is the neutral client.

Next task: review the draft owner PR and its four-surface compatibility behavior,
land according to owner policy, then propagate the exact landed contract commit
through declared consumers' `fabric-contract.lock.json` and vendored schema bytes
with their own gates. Record release/publication and consumer validation receipts
before closing Fabric CO-193. Root owns Fabric's guarded docs, ADR consequence and
COM inventory; this packet does not edit them. Workspace knowledge/backlog
publication follows committed owner status through the existing publisher.

---

**Made with [ssheleg skills](https://github.com/ssheleg/sshlg-skills)**

- [`task-pipeline`](https://github.com/ssheleg/task-pipeline) — bounded contract change delivery
- [`agent-interop`](https://github.com/ssheleg/agent-stack) — compatibility boundary review
- [`agent-sync`](https://github.com/ssheleg/agent-sync) — git decision lease and reserved DEC0020
- [`evidence-docs`](https://github.com/ssheleg/task-pipeline) — watched regression and source handoff

<sub>A star on [the bundle](https://github.com/ssheleg/sshlg-skills) helps.</sub>
