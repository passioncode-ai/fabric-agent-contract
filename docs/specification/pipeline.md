# Pipelines `pipeline/0.1`

`covers:` Fabric agent-registry REQ-08 — DEC-0016, rulings DEC-0017 · locked in Fabric's
[agent-registry contracts](https://github.com/passioncode-ai/fabric/blob/main/docs/evidence/specs/2026-09-29-agent-registry-contracts.md)
§C4 (2026-09-29)

A pipeline is a versioned graph of stages. A stage binds a **capability**, never an
agent: the provider that serves it is resolved when a run starts, so replacing an agent
never breaks a pipeline. Pipelines are immutable revisioned objects
([versioning](versioning.md)).

Schema: [`pipeline.schema.json`](../../schemas/pipeline.schema.json). Reference checker:
[`src/pipeline-check.ts`](../../src/pipeline-check.ts) (`checkPipeline`).

## C4. Pipeline — `pipeline/0.1`

A versioned record (ADR-0009), stored in Fabric and exportable as JSON:

```json
{
  "id": "article-publish", "version": 3, "scope": "estate",
  "reason": "checker before publish",
  "stages": [
    {"id": "research", "capability": "research.topics", "preferred": "claude-code", "produces": "ranked-topics"},
    {"id": "draft", "capability": "copy.write", "needs": ["research"], "produces": "draft"},
    {"id": "check", "checker": true, "needs": ["draft"], "produces": "verdict"},
    {"id": "publish", "capability": "site.publish", "needs": ["check"], "effect": "publish"}
  ]
}
```

## Rules

Rules (checked before save and before run):

- **PL-1 compatibility** — for each edge `a → b`, every property `b`'s `inputSchema` requires
  exists in `a`'s `outputSchema` with a compatible JSON type (string ⊆ string, integer ⊆ number,
  object recursion on required properties, array on `items`); an unresolvable `$ref` fails.
  *Ruled (DEC-0017, OQ-0005):* a checker stage without a capability is identity-typed —
  its output type equals its input type; for a join, each incoming edge must be
  compatible with the joined input, checked per edge.
- **PL-2 checker** — every stage whose capability effect is not `none`/`draft` has a checker
  stage on every path from the start.
- **PL-3 acyclic** — `needs` forms a DAG.
- **PL-4 resolvable** — at run start every capability resolves to one admitted binding in the
  project; `preferred` is a hint, not a binding.
- A running pipeline pins its version; editing creates version n+1 with a `reason`.

## How the reference checker reads them

`checkPipeline({pipeline, capabilities, schemas?, bindings?, phase})` returns findings
`{code: "PL-1" … "PL-4", stage, message}`; an empty list passes. `capabilities` maps a
capability name to its `effect`, `inputSchema` and `outputSchema` (inline, or an
absolute URI found in `schemas`). The checker fetches nothing.

- **PL-1.** A type is compatible when it is the same type, or `integer` where `number`
  is required — never the reverse. A producer that declares no type cannot satisfy a
  consumer that requires one. A consumer without a type accepts anything. Local
  (`#/…`) and document (`<uri>#/…`) `$ref`s are resolved; one that does not resolve
  fails, and so does a stage whose capability is not declared, because its schemas
  cannot be read.
- **A checker stage without a capability is identity-typed** (DEC-0017): for PL-1 the
  edges out of it are checked against the stages that feed it. A checker stage that
  binds a capability is checked like any other stage.
- **Joins** (DEC-0017): PL-1 is applied per edge — each producer of a stage with several
  `needs` must provide every required property of the joined input.
- **PL-2.** The effect comes from the capability; the stage's own `effect` is used only
  when the capability does not say. "On every path from the start" is checked by
  refusing an effectful stage that some start stage reaches without passing a checker.
- **PL-3** also refuses a `needs` entry that names no stage.
- **PL-4** runs only when `phase` is `run`, and wants exactly one admitted binding per
  capability; `preferred` is never consulted.
- The last rule is carried by the schema: a record with `version` 2 or more requires a
  `reason`. The rest of it — the running pipeline's pin — is the host's run record.

Fixtures: the `pipeline*` entries of [`fixtures/catalogue.json`](../../fixtures/catalogue.json);
checker tests: [`test/pipeline-check.test.ts`](../../test/pipeline-check.test.ts), each
rule watched failing on a planted defect.
