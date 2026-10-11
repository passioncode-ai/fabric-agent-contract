# Handoff — runner and model profiles (DEC-0046, board run wave 2, P2-04; CT-05)

## Objective

Close node N14 of the [board run](../evidence/specs/2026-10-11-board-waves/canvas.md), packet
[P2-04](../evidence/specs/2026-10-11-board-waves/packets/wave-2/P2-04-runner-model-profiles.md): write the contract's
decision on Fabric ADR-0147 (written at `31a9d6ca`; its last change, amendments 1 and 2, at `29e3f984`, now on Fabric
`main`) and the proposal *Runner and model profiles* (2026-10-11, commit `9f05a3f`, cited by title and commit only),
with the rulings the [brief](../evidence/specs/2026-10-11-board-waves/brief.md) records, and close board row CT-05.

## Done

DEC-0046, rule codes `FAC-SEM-058`, `FAC-SEM-059`, `FAC-SEM-060`. The packet's eight items, each with its receipt:

| Item | Receipt |
|---|---|
| 1. `modelClasses` vocabulary | `schemas/registry-models.schema.json` `$defs/modelClass` (`frontier`, `strong`, `cheap`, `code`, `vision`, `chinese-vendor`), referenced by `spend-policy.schema.json` and `governance.schema.json`; `runners.md` *Model classes*; tests "closes the vocabulary…" in `test/runner-model-profiles.test.ts` (the doc list equals the enum); fixture `negative/spend-policy-unknown-class.json` |
| 2. Schemas with fixtures | `registry-models`, `model-profile`, `runner-profile`; positive fixtures `registry-models.json` (twelve models, the nine ADR-0147's Context measured among them, one of OpenAI's blocked), `model-profiles.json` (`default`, `max-qwen`, `max-glm`, `cheap`, `code`, `frontier-claude`), `model-profile-agent.json`, `runner-profile-{subscription,key}.json`; all in the positive sweep (`test/positive-sweep.test.ts`) |
| 3. Route and the subscription rule | `runner-profile.schema.json` `route`, the `if`/`then` blocks; `FAC-SEM-059` in `src/profile-rules.ts` with `SUBSCRIPTION_RUNNER`; fixture `semantic/runner-profile-subscription-outside-vendor.json`; every login against six runner kinds in the test |
| 4. Headless drives and `pi` | `runners.schema.json` drive enum; `runners.md` drive table and shared kinds; `session-handoff.schema.json` runtime enum (tied to `runners.md` by `test/session-handoff-review.test.ts`); SH-11's `pi` row and `src/session-handoff.ts`; the runner catalogue fixture's `pi` and `opencode` entries and Kimi Code's `kimi-stream-json` |
| 5. Precedence | `profiles.md` (Local runner profile), `runners.md` *Resolution*; `resolveModelProfile` and `FAC-SEM-060`; fixtures `semantic/profile-resolution-*.json` (an empty intersection refused naming the policy, a refusal missing, a level skipped, an uncatalogued model); UX scenario SCN-020 |
| 6. Declared slots, usage route | `service-well-known.schema.json` `configuration`, `service-usage.schema.json` `$defs/model/route`; `service.md`; fixtures `positive/service-well-known-configuration.json`, `positive/service-usage-route.json` and their negatives |
| 7. The key's allow-list | `runner-profile.schema.json` `key.modelAllowList`; `FAC-SEM-059` (equals `modelProfile`; `key.ref` never a value); fixtures `semantic/runner-profile-key-{other-allow-list,value}.json`; conformance reader row "an issuer of a key route's key" |
| 8. Provider routing | `registry-models.schema.json` `$defs/providerRouting` (`order`, `ignore`, `allow_fallbacks`, `sort`), field names pinned to OpenRouter's page (source ledger, retrieved 2026-10-12); `FAC-SEM-058`'s order-and-ignore check; fixtures `negative/registry-models-bad-sort.json`, `semantic/model-catalogue-order-and-ignore.json`; `sort: price` written as a recommendation to Fabric |

Also: `CONTEXT.md` (four terms and a relationship), `docs/DOCMAP.md`, `docs/evidence/sources.md` (five rows),
`conformance.md` (register, two reader rows), `docs/backlog.md` (CT-05 in review; DEC-0046's next-pin work on CT-18…CT-21),
the coverage floor of `src/profile-rules.ts` at 100 %, and DEC-0037 annotated. The handoffs index records P2-03's
merge (PR #45, `2eb91c0`).

## Checks run

On this branch after merging `main` at `2eb91c0`, `node_modules` linked from the main checkout, Node v26.10.0:
`tsc --noEmit` clean; `vitest run --coverage` 32 files, 1130 tests passed, branches 91.2 % (2353 / 2580), every floor
held, `src/profile-rules.ts` 64 / 64; `python3 docs/ux/lint.py` 15 stories, 12 flows, 15 screens, 20 scenarios;
`tsx src/docs-check.ts` passed; `tsx src/lint-md.ts` 0 errors.

### Planted defects

Each planted alone, the whole suite run, the file restored (`failed / total`):

| Plant | Failed |
|---|---|
| P1 a subscription runs in any runner (`FAC-SEM-059`) | 1 / 1130 |
| P2 a key admits another profile's models (`FAC-SEM-059`) | 1 / 1130 |
| P3 a key written as its value (`FAC-SEM-059`) | 1 / 1130 |
| P4 a model catalogued twice (`FAC-SEM-058`) | 1 / 1130 |
| P5 a provider both ordered and ignored (`FAC-SEM-058`) | 1 / 1130 |
| P6 a profile id declared twice (`FAC-SEM-058`) | 1 / 1130 |
| P7 the policy does not restrict | 2 / 1130 |
| P8 a model admitted by any of its classes, not every one | 2 / 1130 |
| P9 an empty intersection not refused | 2 / 1130 |
| P10 the estate default before the binding | 2 / 1130 |
| P11 an uncatalogued model passes (`FAC-SEM-060`) | 1 / 1130 |
| P12 any recorded outcome passes (`FAC-SEM-060`) | 1 / 1130 |
| P13 any `sort` string (schema) | 2 / 1130 |
| P14 any class string (schema) | 3 / 1130 |
| P15 `pi`'s strict switch unchecked (SH-11) | 1 / 1130 |
| P16 a subscription with a key block (schema) | 2 / 1130 |
| P17 no `pi-json` drive (schema) | 6 / 1130 |
| P18 `pi` not a shared kind in `runners.md` | 1 / 1130 |
| P19 any usage route (schema) | 2 / 1130 |

## Decisions and readings

- ADR-0147 reached Fabric `main` with amendments 1 and 2; the decision pins its last change, `29e3f984`.
- Restriction is by subset: a model stays when **every** class it has is allowed, so a policy can exclude
  `chinese-vendor` while allowing `strong`. With "any" a policy could never exclude a vendor class.
- The empty-intersection refusal, `model-classes-empty`, is the host's refusal of its own launch, not a DL-19 code:
  no callee answers it.
- `sort`'s object form and OpenRouter's other routing fields are refused for now; an estate `sort: price` default is a
  recommendation, since ADR-0147 does not decide it.
- The drives' argv is what precedes the request; how the request is passed is each drive's (the `runners.md` table).

## Open

- Consumers, at their next pin: Fabric (CT-19: the two registries, overrides in bindings, the launch refusal, the
  `sort` default), the adapter (CT-18: the kit's resolver and widget), Project Observatory (CT-20: prices, the probe,
  keys with the allow-list, metering by route), Fabric Dashboards (CT-21: the configuration panel).
- DEC-0046 *Not decided here*: blocked models in resolution, a grant's classes at the meter, a subscription's models,
  the key-issuing wire, `pi`'s and `kimi-code`'s session MCP hand-off.
- The knowledge base (`fabric-workspace/knowledge/` products and plans) and the workspace sync are the owner session's
  close-of-wave step.

## Next task

The owner session reviews and merges the pull request, marks CT-05 done with its merge commit, and records DEC-0046 in
the knowledge base's products and plans pages; then Fabric's wave 4 builds `registry/models.json` from
`fixtures/positive/registry-models.json`'s shape.
