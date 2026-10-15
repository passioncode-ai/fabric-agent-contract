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
- The owner's decision on PR #111's concern: `open-vendor` is descriptive, a deliberate exception to DEC-0046's
  every-class rule. `resolveModelProfile` ignores it, so adding it to a row changes no resolution. A spend policy's and
  a grant's `modelClasses` cannot name it: the schema route (`$defs/admissionClass`), chosen over a rule clause because
  both are schema-checked. A catalogue row carries at least one other class (`contains`), and the resolver keeps a row
  with none out under a policy that names classes. DEC-0046 annotated accordingly. `admittedByClasses` is the admission
  test, and `fixtures/vectors/model-admission.json` (eight cases) its shared vectors for a port's resolver and doctor.
  A resolver that has not ported the exception drops every open model under a policy that names classes, so a catalogue
  writer marks `open-vendor` only once every resolver it serves has ported it (the publication gate).
- A profile's optional `reads` (`schemas/model-profile.schema.json`): at least one of `user-content`, `operator`,
  `web`, each once; absent stays valid. `operator` and `web` (the owner's addition) carry no rule and let a lane say it
  does not read user content.
- `FAC-SEM-112` on kind `profile-resolution` (`src/profile-rules.ts`, `closedUserContentRoute`): a profile whose
  `reads` lists `user-content`, alone or beside another value, has an open-vendor route. Under `fallback: none` the
  first model counts; under `between-turns` any model counts. An uncatalogued model, and an undefined fallback (read
  as `none`), fail closed. The rule also holds the resolution's outcome: when the resolved profile reads user content
  and its own route is open, the models the policy leaves must keep an open-vendor route, or the finding names the
  policy. The rule never throws; `profile-resolution` joined the tolerance kinds.
- A refusal or an empty answer to a non-empty request is a failed turn for such a lane: runners.md, *What a profile
  reads*; a new runner row in conformance.md; the host's launch row now runs `FAC-SEM-112`.
- Adjacent defect, reported by fabric-agent-adapter (its vector "crafted FAC-SEM-112: a non-object before the
  profile"): `FAC-SEM-058`, `FAC-SEM-060` and `FAC-SEM-112` dropped non-objects before indexing, so a path named the
  wrong item. All now use `indexed` (moved to `src/findings.ts`, shared with the activity and estate-record rules), and
  `FAC-SEM-060`'s model index skips a non-string in place; one test per rule with a leading `null`, `7` and `"x"`.
  `src/findings.ts` joins the measured set at 100 (`test/findings.test.ts`); `activity-rules.ts`'s floor moves from
  97.16 to 97.13 because the helper's two covered branches left it (the same nine stay uncovered), recorded in the
  coverage baseline.
- Docs: runners.md (the classes, the new section, Resolution, the rules table), spend-policy.md, conformance.md (two
  rows, the register row), CONTEXT, DOCMAP, SCN-020's errors and coverage, CT-52.

## Open

- Consumers adopt at their next pin (CT-52):
  - Fabric: its catalogue marks `open-vendor` only once every schema reader is pinned at or after DEC-0083 and every
    resolver it serves has ported the exception (a resolver without it drops every open model under a policy that
    names classes); its resolution ignores the class and its policy editors never offer it; its launch runs
    `FAC-SEM-112` on the profile and the outcome; its runners fail a refused or empty turn.
  - fabric-agent-adapter (FAA-45): the kits run `FAC-SEM-112`; they port the `open-vendor` exception to both copies of
    the every-class rule, the resolver (`resolveModelProfile`) and the doctor's `modelUsable` / `model_usable`, and run
    `fixtures/vectors/model-admission.json` on both; its skills ask which lanes read user content.
  - Fabric Switchboard runs `FAC-SEM-112`, and ports the exception, if it resolves model profiles.
- Not decided: a third vendor for a checker's fallback; thresholds; which lanes count as user content; whether a host
  requires `reads`.

## Checks run

- Gate at the branch head (the commit that carries this text; its code equals the run below):
  - `tsc --noEmit` exit 0;
  - `vitest run --coverage` exit 0: 70 files, 4677 tests passed; statements 99.47 % (6298/6331), branches 98.81 %
    (6280/6355); every per-file floor met, `src/profile-rules.ts` and `src/findings.ts` at 100;
  - `docs/ux/lint.py` exit 0: 22 stories, 18 flows, 21 screens, 27 scenarios;
  - `src/docs-check.ts` exit 0;
  - `src/lint-md.ts` exit 0: 168 files, 0 errors;
  - `src/privacy-check.ts` exit 0: 0 findings.
- Twenty-seven plants, each applied alone against `test/open-vendor-user-content.test.ts`,
  `test/runner-model-profiles.test.ts`, `test/fixtures.test.ts` and `test/positive-sweep.test.ts`, each failing at
  least one test (failures in brackets), then restored:
  - the route: the fallback ignored (3), `none` counting every model (8), an undefined fallback read as
    `between-turns` (1), an uncatalogued model counted as open (2), the `reads` clause removed (10), `user-content`
    beside another value not bound (2), the rule not registered (15), only the first closed profile reported (1);
  - the outcome: the clause removed (3), reported beside a closed profile (7), tested on the profile's models (3),
    taken from the first profile instead of the resolved one (1);
  - admission: the resolver checking `open-vendor` (5), a row whose only class is `open-vendor` admitted (3), any
    admission class allowed instead of every one (8);
  - raw indexes: `FAC-SEM-058` catalogue (3) and profiles (3), `FAC-SEM-060` profiles (6) and models (3),
    `FAC-SEM-112` profiles (3);
  - the schemas: `open-vendor` removed from the classes (15), `reads` `minItems` (3) and `uniqueItems` (3) removed,
    `operator` dropped (4), the enum opened to any string (3), the admission class admitting `open-vendor` (3), a
    row's `contains` removed (2).

## Next task

The owner reviews and merges, then tells Fabric's builder, the adapter's builder (FAA-45) and Fabric Switchboard the
merge commit (CT-52).
