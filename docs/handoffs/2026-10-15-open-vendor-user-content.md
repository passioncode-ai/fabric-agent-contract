# Handoff — DEC-0083: a lane that reads user content runs on an open-vendor model (2026-10-15)

## Objective

Some lanes read what members, clients or the public send. The closed vendors refuse exactly that content, sometimes
as an empty answer, and one closed vendor blocked a provider account for it (the operator's rule of 2026-10-15,
measured in one product). This run writes the owner's design into the contract: a class for open-weight models, a
profile's declaration of what its lane reads, a rule that such a lane has an open-vendor route, and a runner's failed
turn on a refusal or an empty answer.

## Done

- DEC-0083 appended; DEC-0046 annotated (2026-10-15). Next free `DEC-0084` and `FAC-SEM-113`.
- The model class `open-vendor` (`schemas/registry-models.schema.json`, seven classes), independent of
  `chinese-vendor`. The catalogue writer decides which rows carry it; the contract cites the operator's vendor list as
  informative only, by name. The positive catalogue marks its DeepSeek, Qwen, GLM and MiniMax rows.
- A profile's optional `reads` (`schemas/model-profile.schema.json`): at least one of `user-content`, `operator`,
  `web`, each once; absent stays valid. `operator` and `web` (the owner's addition) carry no rule and let a lane say it
  does not read user content.
- `FAC-SEM-112` on kind `profile-resolution` (`src/profile-rules.ts`, `closedUserContentRoute`): a profile whose
  `reads` lists `user-content`, alone or beside another value, has an open-vendor route. Under `fallback: none` the
  first model counts; under `between-turns` any model counts. An uncatalogued model, and an undefined fallback (read
  as `none`), fail closed. The rule never throws; `profile-resolution` joined the tolerance kinds.
- A refusal or an empty answer to a non-empty request is a failed turn for such a lane: runners.md, *What a profile
  reads*; a new runner row in conformance.md; the host's launch row now runs `FAC-SEM-112`.
- Docs: runners.md (the classes, the new section, the rules table), conformance.md (two rows, the register row),
  CONTEXT, DOCMAP, SCN-020's errors and coverage, CT-52.

## Open

- Consumers adopt at their next pin (CT-52): Fabric's catalogue marks `open-vendor`, and its class-naming policies
  list it first; its launch runs `FAC-SEM-112`; its runners fail a refused or empty turn. fabric-agent-adapter
  (FAA-45): the kits run `FAC-SEM-112`, and its skills ask which lanes read user content. Fabric Switchboard runs it
  too if it resolves model profiles.
- Not decided: a third vendor for a checker's fallback; thresholds; which lanes count as user content; whether the rule
  also holds the resolved set after a policy's class restriction drops the open model; whether a host requires `reads`.

## Checks run

- Gate at the branch head:
  - `tsc --noEmit` exit 0;
  - `vitest run --coverage` exit 0: 69 files, 4637 tests passed, the coverage floors met;
  - `docs/ux/lint.py` exit 0: 22 stories, 18 flows, 21 screens, 27 scenarios;
  - `src/docs-check.ts` exit 0;
  - `src/lint-md.ts` exit 0: 168 files, 0 errors;
  - `src/privacy-check.ts` exit 0: 0 findings.
- Twelve plants, each applied alone, confirmed failing named tests, then restored:
  - seven in `src/profile-rules.ts`: the fallback ignored, `none` counting every model, an undefined fallback read
    as `between-turns`, an uncatalogued model counted as open, the `reads` clause removed, `user-content` beside
    another value not bound, the rule not registered;
  - five in the schemas: `open-vendor` removed from the classes, `minItems` and `uniqueItems` removed from `reads`,
    `operator` dropped, the enum opened to any string.
- The exact numbers are in the pull request.

## Next task

The owner reviews and merges, then tells Fabric's builder, the adapter's builder (FAA-45) and Fabric Switchboard the
merge commit (CT-52).
