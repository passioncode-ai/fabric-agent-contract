# Brief: the contract review of 2026-10-21

The operator asked for a review of the whole contract: what to cut, add or clarify, so that fewer errors happen
when people build agents against it, how agents work through it, what to optimise, and the improvements landed
in the contract's final form. This brief records what the project already knew, the decisions taken, the review's
findings and the requirements this run delivers.

## Source ledger

| Source | Read | What it gave |
|---|---|---|
| `docs/evidence/retro.md` standing instructions | in full | 6 instructions; two bind this run: a check counts only after it is seen rejecting a planted defect, and a reference function is tested against its schema on the same inputs |
| `docs/backlog.md` | in full | 74 rows, 38 open, about 30 of them consumer adoption |
| `docs/evidence/verification.md` | none found | the repository keeps no verification ledger |
| `README.md`, `AGENTS.md`, `CONTEXT.md`, `docs/DOCMAP.md` | read | the entry path an author meets |
| `docs/specification/versioning.md`, DEC-0016 | read | consumers pin a commit; additive changes under `0.1.0`; no stability promise beyond the pin |
| projects wiki, `projects/fabric-agent-contract/` | read | state on 2026-10-21 |
| code graph (`graphify-out/`) | none found | no graph in this repository |
| five blind reviews (below) | their reports | the findings this brief is built from |

## The review

Five read-only reviews ran in parallel on `main` `63bb296`, one axis each. Their full reports name private
repositories of the operator's estate, so they are kept outside this public repository, on the operator's machine;
this brief and `carry-over.md` carry their findings without those names.

| Axis | Findings | Headline |
|---|---|---|
| A: the author's path | 23 | no command checks an author's own document; the guide covers only the manifest; a wrong profile value prints about 20 errors; a misspelt extension key passes |
| B: cut and merge | 22 | no dead code or orphan file; the cost is prose repeated in DOCMAP, README and conformance, and superseded text still read as current |
| C: schemas | 23 | one concept in several grammars (project id 6, agent reference 5, instant 6, USD 4); 74 % of members undescribed; casing differs between protocols |
| D: tooling | 22 | `session-handoff.ts` does not load standalone although it says so; four credential detectors; `pin:check` noisy and crashing; repeated schema compilation |
| E: consumers | per surface | `fabric-service/0.1`, `fabric-interop/0.1` and the crypto core carry the estate; several recent surfaces have no consumer yet; three emitters each ship their own `support-quality-daily` schema |

## Decisions

The operator's standing rules settle the open questions; each decision and its reason is written here.

- **D1. "Final version" keeps the commit pin.** DEC-0016 stays: consumers pin a commit, and this run makes no
  stability promise beyond it and pushes no tag. A 1.0 with its own promise would bind every consumer at once and
  is not reversible; the run makes the contract ready for one instead (an entry path, a checker, a maturity table).
- **D2. Nothing pinned breaks.** A schema change in this run accepts and refuses exactly what it did before on
  every fixture, unless it tightens a value that a semantic rule or a reader already refuses (recorded per row).
  Wider detection, renamed members and new normative rules that consumers' documents could fail go to the board.
- **D3. Other repositories are not edited.** What the reviews found in a consumer goes to that consumer on the
  board, or to a backlog row here.
- **D4. Records stay where they are.** Decisions, handoffs and evidence are linked by path from the append-only
  register; they are indexed, never moved or rewritten.
- **D5. An author's first check is a command, not a reading.** The checker this run adds is the contract's own
  answer to "is my document right", and the guide and the scenarios lead to it.

## Requirements

Frozen: adding is free, removing needs the operator. Each row names how it is verified.

| REQ | What | Verified by |
|---|---|---|
| REQ-01 | `pnpm validate <file or folder>`: infers the schema from the document (or `--schema`), runs the schema and the semantic rules, prints one line per problem with its path, its rule and a link, exits 1 on a problem and 2 on a usage error; a folder of service descriptors and well-known documents, or of provider entries, is checked as pairs | `test/validate-cli.test.ts` over positive, negative and semantic fixtures and a planted mistake per message class |
| REQ-02 | The semantic-rule kinds are a registry: `SEMANTIC_KINDS` is exported, a kind no rule owns is refused by the checker, and every kind a fixture names is registered | a test over `fixtures/semantic` and a planted unknown kind |
| REQ-03 | One mistake in a capability profile or a provider's `run.mcp` reports that branch's errors only, not every branch's | schema change from an undiscriminated `oneOf` to branches keyed on `kind`; every fixture keeps its verdict; a test bounds the error count |
| REQ-04 | Readable messages: schema errors collapse `anyOf`/`oneOf` wrappers, name allowed values inline, and say where vendor data goes; FAC-SEM-057 and FAC-SEM-015 say how to fix | tests on the formatter and the two rules' messages |
| REQ-05 | Each finding can carry a `help` link to its rule's row; the register's rows have anchors | a test that every code a rule emits resolves to an anchor |
| REQ-06 | The copy-pasted author fixtures obey interop C3.1 (an MCP capability's name is its tool's name) | fixtures changed; a test that every positive MCP manifest with the interop extension names its tool |
| REQ-07 | `pin:check`: a missing lock is a clear message and exit 2; the lock is validated against its schema; a malformed commit is its own state; dated records (changelogs, handoffs, evidence) are excluded by default, as versioning.md says; success prints the history result | tests on each case |
| REQ-08 | `src/session-handoff.ts` loads on its own, as its header promises | a test that copies it alone and imports it |
| REQ-09 | README leads with "Build an agent" (three kinds, each with its pages, schema, fixture and command); a grouped specification index with each surface's maturity (adopted by whom, or no consumer yet); the module list lives once, in conformance.md | docs check; the index's maturity column cites the consumer review |
| REQ-10 | The author guide is rewritten by agent kind with minimal examples that are fixtures the suite validates, the profile version member per profile, the terms box and a pointer to the Fabric Agent Adapter; stale "until the host exists" text goes | a test that every example in the guide validates |
| REQ-11 | Spec pages an author reads are corrected: provider.md (`providerId`, the `scope` warning in its row, Windows path, "fabric home"), service.md (minimal descriptor and well-known with their required members), profiles.md (shared runner kinds), overview.md (a `$id` is a name, not a location; `format` must be asserted) | a test that the required-member tables equal the schemas' `required` |
| REQ-12 | Stale or duplicated prose: the gate described once with the privacy check; MERGES.md marked frozen; the handoffs index points at the board; DOCMAP's brief glob; memory's superseded adapter and conceptual API labelled; CONTEXT's model line; adoption.md's coordination plane | docs check; each edit cited in the handoff |
| REQ-13 | Schemas, without a behaviour change: shared patterns referenced from common (slug, service-instance key, sha256 hex, Ed25519 keys, capability URI), descriptions on the common definitions and on the author documents' members, `[0-9]` for `\d`, the connections extension named `fabric-connections/0.1` | every fixture keeps its verdict; a test that no schema uses `\d` |
| REQ-14 | Fixtures: the 22 negatives that name no keyword name it; each schema without a negative fixture gets one | the catalogue test |
| REQ-15 | Tooling: the gate's checkers under the coverage ratchet at their measured floors; the mutant helper loads schemas once; `pnpm vectors:check` and `vectors:write`; the scripts table in AGENTS.md; markdownlint's file list kept out of the log; the dead CLI block in `tracked-files.ts` removed; Windows skips counted | the gate itself; timings before and after |
| REQ-16 | SCN-001 and SCN-002 describe the checker that exists and are covered by its test | UX lint; the scenario's Coverage line names the test |
| REQ-17 | Consumer findings reach their owners: the three `support-quality-daily` forks, stale pins, and the backlog rows the consumer review found done get their receipts | board messages and backlog rows with evidence |
| REQ-18 | What this run does not do is a backlog row with its evidence: the credential detectors' union (CT-73), a manifest content hash definition, the local-runner placeholders, the launch declaration's single home, the extension point on wire documents, a decisions index, DOCMAP and backlog compaction | rows exist at the close |

## Exceptions to D2, and what was dropped

Each change below accepts or refuses something it did not before; each is recorded here, as D2 requires.

| Change | What a pinned reader now does differently | Why it stands |
|---|---|---|
| `fabric-connections` enters `PROTOCOL_REVISIONS` with `0.1` (REQ-13) | FAC-SEM-099 refuses a `protocols` list naming `fabric-connections/<revision>` other than `0.1`, or two of its revisions that are not consecutive; before, an unregistered name passed | the protocol was published as `0.1` by DEC-0096 on 2026-10-21; no other revision exists to be declared, and every registered protocol is checked the same way |
| `[0-9]` for `\d` in every schema pattern (REQ-13) | none for an ECMA-262 reader such as Ajv, where `\d` is `[0-9]`; a Python reader using `re`, whose `\d` matches any Unicode digit, now refuses digits outside `0-9` | JSON Schema reads patterns as ECMA-262 regular expressions (2020-12 Validation, section 6.3.3); the narrowing brings those readers to what the schema always meant |
| `connection` keyed on `mode` (REQ-03, first unit reading) | the same accept set on every fixture; a wrong `mode` reports one error instead of every branch's | none needed: no verdict changes |

Dropped from REQ-13: a shared `serviceInstanceKey` definition in common. The copies are two different constraints
(`service-common` requires the `.<instance>` part, `manifest` makes it optional), so one definition would change one
of them; they stay inline.

## Carry-over

Every finding that is not a REQ above is listed with its review id in `carry-over.md` and leaves with a board row.
