# 2026-11-04: operations digests and the retro after work (CT-219, DEC-0153)

## Objective

Draft CT-219 by its own decision: the shapes `ops.digest.hourly@1` and `ops.digest.daily@1` with semantic rules, the
host obligation `retro-after-work`, fixtures, vectors, `pnpm validate` for both and the conformance rows. Names and
fields are Fabric's ADR-0188 (commit `0d0e5922`); the shape's origin is Fabric's commit `e1eecec0`
(`apps/desktop/src/shared/opsDigest.ts`, `apps/desktop/src/main/opsDigestRun.ts`). Asked on board thread `f7758225`
(message `516761e1`, item 2); Switchboard (SB-250) and Inbox (B-205) waited on the shape when CT-219 was filed.

## Done

- DEC-0153 (Proposed), [operations digests](../specification/ops-digest.md): OD-1 to OD-8 (window, operation names,
  counting, the rise, the daily fold, the files, nothing but counts, the operator told) and RW-1 to RW-4 (when the
  retro arises, how it is asked, what fulfils it, how it is counted).
- `schemas/ops-digest-hourly.schema.json`, `schemas/ops-digest-daily.schema.json` (closed; `pnpm validate` infers them
  by `schema`); `src/ops-digest.ts` (`foldHour`, `foldDay`, `isRise`, `FAC-SEM-166`, `FAC-SEM-167`) at 100 % branches;
  `tools/vectors/ops-digest.ts` and `fixtures/vectors/ops-digest.json` (10 hour and 4 day cases, expected values written
  by hand); 3 positive, 9 negative and 13 semantic fixtures (with OD-9 and rounds 1 and 2: 5 positive, 16 negative and 21
  semantic fixtures named `ops-digest-*` or `service-*ops-digest*`, as `ls fixtures/<kind> | grep -c ops-digest` measures); `test/ops-digest.test.ts`.
- Registered: `src/semantic-kinds.ts` (kinds `ops-digest-hourly`, `ops-digest-daily`), `src/semantic-rules.ts`,
  `tools/vectors/run.ts`, `vitest.config.ts` (include and a 100 % branch floor for `src/ops-digest.ts`),
  `test/rule-tolerance.test.ts`, `test/positive-sweep.test.ts`, `test/schema-compilation.test.ts` (149 schemas with
  OD-9's).
- OD-9, a change made in review (board thread `f7758225`: Fabric proposed a top-level descriptor member
  `opsDigests: [{dir, source}]`; the descriptor schema is closed, so the contract answered that the lawful place is
  `extensions`): the extension key `https://fabric.passioncode.ai/agent-contract/extensions/ops-digest/0.1`
  (`EXTENSION_KEYS.opsDigest`, protocol `fabric-ops-digest/0.1` in `NAMED_ONLY`), its value 1 to 8 closed
  `{dir, source}` (`schemas/service-ops-digest-extension.schema.json`, `dir` in the package-path grammar of
  `fabric-package.schema.json#/$defs/path`, relative to `paths.data`); `FAC-SEM-168` (receipt SEM-0168, kind
  `service-descriptor`) with `digestFoldersView` and `digestFoldersRules` in `src/ops-digest.ts`; 2 positive and 7
  negative fixtures with catalogue rows, 6 semantic fixtures (`ops-digest-folders-*`), tests in
  `test/ops-digest.test.ts`, `test/rule-tolerance.test.ts` and `test/consistency.test.ts`; the spec section "Where a
  collector reads the daily digests", the descriptor bullet in `service.md`, the key in `interop.md` (eight keys) and
  the named-only list in `versioning.md`; two conformance rows (a product declaring its folders, a collector), the
  register row and next free `FAC-SEM-169`. Its first consumers are announced (board message `2ed505f2`): Fabric's
  CO-503 and Project Observatory's OBS-330.
- `conformance.md`: the reference module row, three rows (a product folding its log, a reader of digests, a host
  serving `retro-after-work`), the register rows `FAC-SEM-166` and `FAC-SEM-167`, next free `FAC-SEM-168` (the state before OD-9; `FAC-SEM-169`
  since OD-9);
  `docs/specification/README.md`, `docs/DOCMAP.md`, `CONTEXT.md` (Operations digest, Retro after work); backlog
  CT-219 marked in progress.

## Decisions taken in the draft

- `from` and `to` take the `.000` fraction Fabric writes as well as none; `day` is `YYYY-MM-DD`; `hours` 1 to 24.
- `op` grammar `^[a-z][A-Za-z0-9_]*(?:[.:/-][A-Za-z0-9_]+)*$`, at most 64: `:` because Fabric's IPC operations carry
  one (`ipc.work:home`), `_` for products that write snake case, `/` (the coordinator's decision of 2026-11-05) because
  Fabric logs MCP methods as `mcp.<method>` (`mcp.tools/list`; thread `f7758225`, message `1c191cf7`); the 175 names
  Fabric checked in a week of its log fit. `FAC-SEM-167` applies `hasHomePath` too, so `/` lets no home folder in.
- A day with no hour of its own has no daily digest (OD-5; answering `404` is announced, board message `f74763e1`);
  `foldDay` returns null for it. `hours` stays 1 to 24.
- A product's own call refused for its own missing source slot (DEC-0149, in progress: "Starting without the
  instance") counts `unknown`, never `failed` (OD-3), so it never makes a rise; a host that relays calls counts an error
  as it sees it.
- `total` is an object of three counters (as ADR-0188 and Fabric give it), each the sum over `ops`.
- The `@1` names are kept as Fabric writes them and are not entered in the protocol revision register (DEC-0067).
- Retros asked and written are counted as the operation `retro-after-work` inside the digests, not as new members.
- A daily rise is checked as at least 10 failures per hour it rose and at most the day's failures of its op; an
  hourly rise must equal the hour's failures of its op.
- Vectors were added (the backlog row asks for them; the folds are what every product reimplements).
- OD-9's `dir` reuses the package-path grammar rather than a new one; a local descriptor with the key must name
  `paths.data` (`FAC-SEM-168`), since `dir` is relative to it. Tests, not vectors, pin `FAC-SEM-168`: the reader is
  a shape check plus four list checks, and the semantic fixtures carry its cases.

## Siblings on the same registers

DEC-0149, DEC-0150 and DEC-0152 are on other branches. When DEC-0149, DEC-0150 and DEC-0153 are all on `main`:

- `test/schema-compilation.test.ts` counts 151 schemas (146 on `main`, one for DEC-0149, one for DEC-0150, three
  for DEC-0153). This branch writes 149, DEC-0149's 147 and DEC-0150's 147; whichever lands last sets 151 by hand.
- DEC-0150 (branch `agent/channel-agent-ext-v3-20261104`) adds the extension key `channel-agent/0.1` too: the second
  to land keeps both constants in `src/extensions.ts` and `test/consistency.test.ts` (and the test's title), both rows
  in `interop.md`'s key table, and writes "nine extension keys" there. Its rule codes end at `FAC-SEM-165`, so the
  register's next free stays `FAC-SEM-169`. DEC-0150 also adds a `hint/declaration-only` entry to
  `src/validate-cli.ts` (`HINT_HELP` and `readerHints`) for its bare declaration, as this branch does for
  `service-ops-digest-extension.schema.json`: the second to land keeps both `readerHints` lines and one `HINT_HELP`
  rule name with each line carrying its own schema's help link (a `Hint`'s fourth element: ops-digest.md's anchor here,
  `channel-agent.md#what-is-checked` for DEC-0150's); the check is that each bare declaration prints its own page's
  link (`test/ops-digest.test.ts` reads it from `--json`).
- `vitest.config.ts` keeps one coverage `include` line holding every branch's files, plus `src/ops-digest.ts`'s
  100 % branch floor.
- `test/positive-sweep.test.ts`'s sources list holds both `source-rules` and `ops-digest`; `test/rule-tolerance.test.ts`
  holds both branches' kinds, separated by a comma; so do the last rows of `fixtures/catalogue.json`.
- The register in `conformance.md` lists `FAC-SEM-166`, `FAC-SEM-167` and `FAC-SEM-168` after `FAC-SEM-165`, and
  next free `FAC-SEM-169`. `src/protocol-revisions.ts` and `versioning.md` hold `fabric-ops-digest/0.1` beside any
  revision another branch adds.
- Whichever of DEC-0149 and DEC-0153 lands second edits the live mirror lines: "(DEC-0153, in progress)" in
  `source.md`'s setup-answer sentence (DEC-0149's branch), "in progress" in `ops-digest.md`'s OD-3 (where it reads "DEC-0149, in progress" before
  "Starting without the instance"), and "in progress" in DEC-0153's item 4, which is edited if DEC-0153
  is still Proposed and annotated if it is already Accepted (the register is append-only). No conformance row names
  DEC-0149.
- DEC-0151's handoff resolves its overlap with this branch for the support-quality rows of `conformance.md`, the spec
  README and `docs/DOCMAP.md` under its heading "Against DEC-0153"; the second to land follows it.
- DEC-0152 shares `docs/DECISIONS.md`, `docs/DOCMAP.md`, `docs/backlog.md`, `docs/handoffs/README.md` and
  `conformance.md` (a different row).
- DEC-0151 (branch `agent/sqd-fields-20261104`) narrows `SECRET_VALUE` in `src/secret-shape.ts`. `FAC-SEM-167` and
  `FAC-SEM-168` follow the narrowed detector; after DEC-0151 no schema-valid `source` can be an `sk-` key (the source
  grammar has no upper case, which DEC-0151's `sk-` shape needs), so this branch's credential samples are Slack-shaped
  and lower case, built from pieces, and found by both detectors. Checked on a scratch merge of `main`, DEC-0151 and
  this branch (below). The sibling notes in DEC-0149's and DEC-0151's own handoffs belong to those branches and are
  not edited here.
- PR #235 (DEC-0148) overlaps in `docs/DECISIONS.md`, `docs/backlog.md`, `conformance.md`, `CONTEXT.md`,
  `docs/DOCMAP.md`, the spec README and `src/semantic-kinds.ts`, all ordered appends: the second to land keeps both.
- DEC-0149 changes `secretValue` (`JWT_SHAPE.test` becomes `hasJwt`, behaviour-equivalent); `FAC-SEM-167` and
  `FAC-SEM-168` call `secretValue` and take it unchanged.
- At the DEC-0151 landing step (DEC-0151 lands before this branch), DEC-0153 keeps five client rows in `conformance.md` (a product folding its log, a reader of digests, a product
  declaring its folders, a collector, a host serving the retro), not the three DEC-0151's handoff names:
  `grep -c "^| a .*| DEC-0153" docs/specification/conformance.md` prints 5.
- At landing, write both next-free markers from the CAS counters, never from this file: `docs/DECISIONS.md`'s next
  free ID (`DEC-0154` today) and `conformance.md`'s next free rule code (`FAC-SEM-169` today). They, and
  `interop.md`'s count of extension keys ("nine" once DEC-0150 lands too), merge silently stale, since git sees equal or
  disjoint lines; the lander writes them by hand. Backlog CT-221 asks for a docs-check that compares each marker with
  the register's highest id.

## Consumers

A dated reading, read-only with `git ls-remote` and `gh api` on 2026-11-05, and nothing else: for each product (a) the
repository and the commit or tag read, (b) the product's own rows that track adoption, quoted by their status, and (c)
how the product's own `foldHour` and `foldDay` answer `fixtures/vectors/ops-digest.json` at that commit. (c) was not
run in this session: running a product's downloaded code was refused by the session's permission rules, so each line
says "not run" and the folds are the coordinator's or the product's to run. Anything agreed on the board is written
"announced (board <message>)". No other claim about a product's behaviour is made here or anywhere in this
repository; read again before relying on a line. Vendoring the vectors from the contract's release tag is every
product's obligation.

- **Fabric**: (a) `passioncode-ai/fabric` origin/main `a6f0ffda`, latest prerelease v0.3.15. (b) Its CO rows live in
  the carry-over ledger `docs/evidence/specs/2026-08-16-software-fabric-carryover.md` at `a6f0ffda` (its
  `docs/evidence/backlog.md` points there): CO-500 "closed" (Fabric reads its own log every hour and every day); CO-502
  "open" (`retro-after-work`; its row says "the daily digest counts retros asked and written"); CO-503 "open" ("The
  daily digest goes to Observatory"; target the organization slice, 2026-11-21, P-27). CO-509 is announced
  (board messages `449b3e7e`, `fefb0266`) and is not in the ledger, whose next free id is `CO-507`. (c) Not run (the
  round-4 readers reported its daily fold differing on 2 of the 4 day vectors at this commit, against this branch's
  `fixtures/vectors/ops-digest.json`, blob `c5a0a84489ec`, unchanged since `21bb0246`).
- **Fabric Inbox**: (a) release tag v0.95.0 (`6fed640`); `passioncode-ai/fabric-inbox` origin/main `71a3edd6`, where
  its rows were read. (b) B-212 "in review (0.95.0)", shipped in the v0.95.0 tag through PR #413; B-213 "open; due
  2026-11-16"; B-210 "open; due 2026-11-16 (Fabric's side 2026-11-18)", narrowed by PR #414 to the Mac app's own
  folder (announced, board message `17613e30`). (c) Not run.
- **Fabric Dashboards**: (a) `passioncode-ai/fabric-dashboards` origin/main `9b9085bd`, latest release v0.8.23 (main
  two commits ahead). (b) FD-144 "done 2026-11-04, merged through PR #319, #323 and #324, released in 0.8.21"; FD-153 "done 2026-11-05,
  merged through PR #333, released in 0.8.23". (c) Not run.
- **Fabric Switchboard**: (a) `passioncode-ai/fabric-switchboard` origin/main `32f94cea`, latest release v0.7.11.
  (b) SB-250 "closed 2026-11-05: released in v0.7.11"; SB-255 "in review 2026-11-05, branch `sb-254-crash-restart`"
  (merged to main in PR #403); SB-257 "in review 2026-11-05, branch `sb-257-stop-hour`" (merged to main in PR #405;
  the next release after 0.7.12, announced, board message `157e65b4`); SB-251 to SB-254 and SB-256 are not about
  digests. (c) Not run.
- **Project Observatory**: (a) `passioncode-ai/project-observatory-dashboard` origin/main `4116b3ac`, latest release
  v0.33.1. (b) OBS-330 "open": "Accept Fabric's daily digest of its own operations log as a project record kind";
  OBS-331 "open": "A daily review of what every agent learned: once a day, read the lessons (`observatory_lesson`) and
  digests of every project ...". (c) No fold to run.
- **The Fabric Agent Adapter**: (a) `passioncode-ai/fabric-agent-adapter` tag v0.65.0 (`3606bf89`), read with `git show`
  on 2026-11-05, nothing run. (b) FAA-206, as its row states at that tag: "open 2026-11-04: P1. Part 1 released in 0.64.0
  on 2026-11-05 (`8eec4815`, tag `v0.64.0`) ... part 2 waits on the digest form in the contract (CT-219, a draft by
  2026-11-10), its date named the day the form lands. ..." (c) No fold yet. At its next re-pin `fabric-ops-digest/0.1`
  enters its twin registers `fabric_protocols.py` and `fabric-protocols.mjs`, which its tests hold equal to the register
  `vendor_vectors.mjs` writes into `feed-protocols-vectors.json` (the twins are kept by hand).
- **Protocol tables**: at their next re-pin, the consumers that vendor a protocol table (a deployment template's
  `src/fabric/fabric-protocols.mjs`, Fabric Dashboards' `test/fixtures/sample-service/fabric_protocols.py`, the adapter
  kit's copies in agents built on it, and any other vendored table) add `fabric-ops-digest/0.1`, as DEC-0149 asks for
  `fabric-source`.
- **At landing** (DEC-0151 lands before this branch and narrows the `sk-` shape): on the merged tree, add `FAC-SEM-167`
  pass cases for `queue.task-assigned-to-worker`, `work.desk-booking-confirmed` and `ui.disk-usage-refreshed-hourly`,
  which the `sk-` shape before DEC-0151 reads as keys, and move `queue.task-assigned-to-worker` out of the
  refused names of the test "applies OD-2 in full" in `test/ops-digest.test.ts` (it folds on the merged tree). Then
  restate the detector's shapes in OD-2, the FAC-SEM-167 row and DEC-0153 item 3 as DEC-0151's `SECRET_VALUE` reads
  them, and re-pin their examples in the test "pins the shared detector's sk- shape": `ops.risk-assessment-completed`
  (refused before DEC-0151) and `work.session-end-task-back` (passing), each as the merged detector answers. CT-222 (filed on this branch, the next free CT above every
  branch and main when written) widens `SECRET_VALUE` for underscore-form provider prefixes, `AIza` keys and `hf_`
  tokens, owned by DEC-0151's detector, with tests from split literals.
- **At landing, the fold:** on the merged tree with DEC-0149, `foldDir` calls DEC-0149's `foldPath` (one
  implementation; a `dir` has no trailing `/`), and the parity test in `test/ops-digest.test.ts` (DEC-0149's
  `FOLD_PAIRS` at `d4cc1e16` copied as written, plus the HFS+ samples its next step adds) keeps holding.
- **At landing, the hints:** on the merged tree with DEC-0150, both `readerHints` lines carry an explicit help link (the
  `Hint`'s fourth element); `test/ops-digest.test.ts` asserts `channel-agent.md#what-is-checked` for the channel-agent
  bare declaration when that schema and its positive fixture exist (DEC-0150 asserts the same); the `readerHints`
  comment "DEC-0150 adds its own entry" is reworded to describe both lines.

## Open

- The coordinator's blind readings (unit, seam, product) on this branch, then the pull request. Round 1 at
  `ada7c23d` was not clean: the seam tier found the credential sample `FAC-SEM-168`'s tests used no longer a key under
  DEC-0151, and the product tier found the home-folder detector refusing `home`, `users` and `Users` segments in
  operation names and dirs (`api.users/list`, `users/digests`), with one refused name dropping a whole line. Both are
  fixed in the round-1 batch, with the coordinator's decisions on the retro count (RW-4), the catch-up (OD-5, OD-6), the
  trigger (RW-1), the identity (OD-9) and the order (OD-3), and the unit tier's risks (`usable`, a dir named twice,
  "no C0 control character", counts past 2^53 − 1, the op-path negative's counts).
- Round 2 at `6bb6ce04` was not clean: the product tier found the detector boundary described wrongly (it refuses
  after any non-alphanumeric character, `_` and `-` included, and has a dashed and a `~` form) and the spec README's
  maturity cell crediting the products beyond what they ship. Both are fixed in the round-2 batch: the boundary stated
  exactly in all eight places with a test pinning every example, the maturity cell and the Consumers above rewritten,
  and the coordinator's decisions (the OD-3 outcome map, `hours` as hours folded, the collector's caught-up day, the
  identity and the products without a descriptor, the retro's end and hour, why there is no scenario) and the unit and
  seam risks (dir folding under NFC and Unicode case, `previous` checked, one copy of the op grammar).
- Round 3 at `be737b89` was not clean: the product tier found departures missing from the maturity cell,
  Compatibility and Consumers, and RW-4's undefined "or moved on". Both are fixed in the round-3 batch: the Consumers
  list above made complete and the authority; "moved on" deleted; the hour a product stops in and `previous` read back
  (OD-1), a `dir` holding only its own instance's digests (OD-9), the 4096 bound (OD-3), RW-4's `ok` cases made one
  list, and the unit tier's facts (the boundary's optional name, double or single quote and `F` in either case before
  and after, the `ẞ` fold, each input count checked, the hour after 9999-12-31T23).
- Round 4 at `ddf5b684` was not clean: the Consumers list, Compatibility and the maturity cell stated product states
  beyond the products' code. The branch first merged `origin/main` (`1e7be3a5`, PR #242, CT-221 reserved on main with
  a row equal to this branch's; it appears once). The Consumers list is now a dated reading of each product's code, and
  the maturity cell and Compatibility no longer list per-product state. Folded in with it: OD-1's sleep rule (an hour
  written only when observed), OD-2's operation-shaped examples, the protocol-table re-pin line, the declaration-only
  hint on a bare declaration, the canonical caseless `dir` fold (NFD first, `ı` joined with `i`), the previous digest's
  matched counts and `foldDay`'s inputs checked, "whitespace as JavaScript's `\s` reads it", and the extension
  schema's description of what is refused.
- Round 5 at `6eb61183` was not clean: the start order (a kept hour written before a day is folded, OD-1), RW-4's count
  (`ok` counts asks answered, not retros, and is no bound on them), product claims (every behavioural claim about a
  product removed from the spec, DEC-0153, the README cell, CONTEXT and conformance; the Consumers list above reduced
  to repositories, commits, rows and fold results) and `foldDay`'s rises (each checked and matched to its hour's ops
  before it is summed). Also: "canonical caseless matching (NFD, case folded, NFC)" as the dir comparison's name,
  RW-1's "since the session began or the obligation last arose, whichever is later", and the declaration-only hint's
  per-schema help link.
- Round 6 at `1ed18a61` was not clean: the day's ops bound (`foldDay` folded two 4096-operation hours into 8192, which
  the schema refuses; now a product keeps 4095 names plus one overflow name a day, and a day beyond 4096 operations has
  no daily digest), Observatory facts (RW-4 and DEC-0153 claimed what Project Observatory counts and keys; now Not
  decided here, and OBS-330 and OBS-331 quoted by their own text) and Fabric's rows (now quoted from its carry-over
  ledger). Also: the fold inputs FAC-SEM-166 refuses (an operation twice in the previous hour's ops or in one hour's
  risen) throw, the overflow message says "beyond 2^53 - 1", `foldDir` strips the code points HFS+ ignores first as
  DEC-0149's `foldSegment` does and maps Georgian Nuskhuri onto Mkhedruli after NFC as its next step does (add-on),
  RW-1's "wrote no retro" judged by what the host observes, `FAC-SEM-167`'s credential
  detector described as shared, and the dated-reading wording fixes.
- Round 7 at `69b06d3f` was not clean: the producer row's bound ("beyond 4096", now OD-3's 4095 names a day plus one
  overflow name) and `FAC-SEM-167`'s description (now the shared detector's shapes as it applies them, with the `sk-`
  shape matching inside `ask-`, `task-`, `desk-` and `disk-` until DEC-0151 lands). Also: OD-1's comparison of a kept
  hour ("the hour just before when that is the last hour written, else none"), the Why's "a retro the host saw written
  is not asked for twice", RW-3 and CONTEXT's distinction from the Memory Kernel's retrospective, CO-503 quoted
  verbatim, the hourly schema's "observed itself running in", a parity test of `foldDir` against DEC-0149's fold
  pairs, the channel-agent hint link asserted when its schema exists, and the landing items.
- Round 7's unit and seam readings passed with risks, folded: `foldHour` applies OD-3 as `foldDay` does (no hourly
  digest for more than 4096 operations or a name `OP_NAME` refuses), its docstring names the adjoining previous hour,
  no finding of FAC-SEM-166 or FAC-SEM-168 and no fold error copies a value shaped like a credential or holding a home
  folder (it names the place, as `src/descriptor-rules.ts` does), DEC-0153 says "lower, upper and lower case" for the
  fold, and CT-222 is filed.
- Round 8 at `b96e73d4` was not clean: the reference folds against FAC-SEM-167 (they wrote a line every reader skips
  for a name FAC-SEM-167 refuses; now `foldHour` and `foldDay` refuse it too, for ops and risen, naming only the place),
  the `from` echo (now hidden like any credential-shaped or home-folder value) and the daily `hours` ("hours folded,
  never uptime: OD-1"). Also: OD-1's restart rebuilds the day's named operations, OD-3's overflow name is published with
  the outcome map, "at most once in `risen`", the on-request case in the producer row, the next free DEC marker written
  from CAS (`DEC-0154`), Compatibility on ADR-0188 §5's "retros written", the adapter line read at v0.65.0, and the
  duplicate-dir message hidden when either dir is.
- Round 9 at `4b46cd05` was not clean: the collision class leak (a duplicate of a class holding a hidden dir could name
  a visible member equal to it but for case; now a first pass hides the whole class, tested over every order of two
  three-member classes), `foldDay`'s grammar (now OD-2 in full, its grammar and `OP_NAME_MAX` too, for ops and risen)
  and Compatibility's present tense about Fabric (now what a view built on CO-502 reads, pinned at `a6f0ffda`). Also:
  OD-1's two kinds of writer, the start rebuild from the hourly lines and the hour kept, an hour written as no digest
  being a gap, DEC-0153 items 2 and 4 carrying the start rebuild and the published overflow name, and the detector's
  shapes stated in words with `SECRET_VALUE` as the definition. Round 10 is next.
- The grammar of an `insight/1` line; the session and request counts ADR-0188 §1 also names (a gauge has no `@1`
  home); how the daily digest travels to Project Observatory; `pnpm validate` reading a `.jsonl` file whole. All are
  named under "Not decided here" on the spec page.

## Checks actually run

Round-9 batch, 2026-11-05, each exit 0: `pnpm typecheck`; `pnpm vitest run --testTimeout=60000` on the 11 files of
round 2 with coverage on `src/ops-digest.ts` (4213 tests; 257 of 257 statements, 202 of 202 branches);
`pnpm exec tsx tools/vectors/run.ts` (29 files); `pnpm run docs:check`; `python3 docs/ux/lint.py`;
`pnpm run privacy:check` (0 findings). The branch gate is owed: the 15-minute load was 72.7.

Round-8 batch, 2026-11-05, each exit 0: `pnpm typecheck`; `pnpm vitest run --testTimeout=60000` on the 11 files of
round 2 with coverage on `src/ops-digest.ts` (4210 tests; 253 of 253 statements, 204 of 204 branches);
`pnpm exec tsx tools/vectors/run.ts` (29 files); `pnpm run docs:check`; `python3 docs/ux/lint.py`;
`pnpm run privacy:check` (0 findings). The DEC counter read on origin (`refs/agent-sync/ids/DEC`) is next 154. The
branch gate is owed: the 15-minute load was 85.9.

Round-7 risks, 2026-11-05, each exit 0: `pnpm typecheck`; `pnpm vitest run --testTimeout=60000` on the 11 files of round
2 (ops-digest, consistency and validate-cli among them) with coverage on `src/ops-digest.ts` (4208 tests; 241 of 241
statements, 192 of 192 branches); `pnpm exec tsx tools/vectors/run.ts` (29 files); `pnpm run docs:check`;
`python3 docs/ux/lint.py`; `pnpm run privacy:check` (0 findings); `grep -c "^| a .*| DEC-0153"
docs/specification/conformance.md` prints 5. The branch gate is owed: the 15-minute load was 74.5.

Round-7 batch, 2026-11-05, each exit 0: `pnpm typecheck`; `pnpm vitest run --testTimeout=60000` on the 11 files of
round 2 with coverage on `src/ops-digest.ts` (4206 tests; 235 of 235 statements, 181 of 181 branches);
`pnpm exec tsx tools/vectors/run.ts` (29 files); `pnpm run docs:check` (after a code span with a trailing space was
reworded); `python3 docs/ux/lint.py`; `pnpm run privacy:check` (0 findings). No other repository's code was run; the
parity pairs were read from this repository's DEC-0149 branch. The branch gate is owed: the 15-minute load was 75.6.

Round-6 batch, 2026-11-05, each exit 0: `pnpm typecheck`; `pnpm vitest run --testTimeout=60000` on the 11 files of
round 2 with coverage on `src/ops-digest.ts` (4175 tests; 232 of 232 statements, 181 of 181 branches);
`pnpm exec tsx tools/vectors/run.ts` (29 files); `pnpm run docs:check`; `python3 docs/ux/lint.py`;
`pnpm run privacy:check` (0 findings). No other repository's code was downloaded or run. The Nuskhuri add-on: the same
checks again, each exit 0 (4175 tests; 235 of 235 statements, 181 of 181 branches). The branch gate is owed: the
15-minute load was 59.8, then 64.4.

Round-5 batch, 2026-11-05, each exit 0: `pnpm typecheck`; `pnpm vitest run --testTimeout=60000` on the 11 files of
round 2 with coverage on `src/ops-digest.ts` (4173 tests; 220 of 220 statements, 177 of 177 branches);
`pnpm exec tsx tools/vectors/run.ts` (29 files); `pnpm run docs:check`; `python3 docs/ux/lint.py`;
`pnpm run privacy:check` (0 findings). The products' own folds against the vectors were not run (the session's
permission rules refused running downloaded product code). The branch gate is owed: the 15-minute load was 65.9.

Round-4 batch, 2026-11-05, after merging `origin/main` (`1e7be3a5`), each exit 0: `pnpm typecheck`;
`pnpm vitest run --testTimeout=60000` on the 11 files of round 2 with coverage on `src/ops-digest.ts` (4172 tests;
215 of 215 statements, 173 of 173 branches); `pnpm exec tsx tools/vectors/run.ts` (29 files); `pnpm run docs:check`;
`python3 docs/ux/lint.py`; `pnpm run privacy:check` (0 findings). The branch gate is owed: the 15-minute load was 61.8.

Round-3 batch, 2026-11-05, each exit 0: `pnpm typecheck`; `pnpm vitest run --testTimeout=60000` on the 11 files of
round 2 (4170 tests); `test/ops-digest.test.ts` with coverage on `src/ops-digest.ts` (63 tests, 169 of 169 branches);
`pnpm exec tsx tools/vectors/run.ts` (29 files); `pnpm run docs:check`; `python3 docs/ux/lint.py`;
`pnpm run privacy:check` (0 findings); `pnpm validate` on the positive descriptor and hourly fixtures. The branch gate
at `be737b89` is the coordinator's (it holds the heavy lock); this batch's gate is owed.

Round-2 batch, 2026-11-05, each exit 0: `pnpm typecheck`; `pnpm vitest run` on the 10 files of OD-9 plus
`test/activity-rules.test.ts` (11 files, 4168 tests); `test/ops-digest.test.ts` with coverage on `src/ops-digest.ts`
(61 tests, 163 of 163 branches); `pnpm exec tsx tools/vectors/run.ts` (29 files); `pnpm run docs:check`;
`python3 docs/ux/lint.py`; `pnpm run privacy:check` (0 findings); `pnpm validate` on every `ops-digest` positive and
semantic fixture (each its expected codes). The full gate is owed: free disk was 5 GB (the 15-minute load was 43.9).

Round-1 batch, 2026-11-05, each exit 0: `pnpm typecheck`; `pnpm vitest run` on the same 10 files as OD-9 (4079
tests); on a scratch merge of `main`, DEC-0151 (`69db2177`) and this branch, `vitest run test/ops-digest.test.ts
test/validate-cli.test.ts test/fixtures.test.ts test/rule-tolerance.test.ts test/positive-sweep.test.ts` with
coverage on `src/ops-digest.ts` (4023 tests, 161 of 161 branches); `pnpm exec tsx tools/vectors/run.ts` (29 files);
`pnpm run docs:check`; `python3 docs/ux/lint.py`; `pnpm run privacy:check` (0 findings); `pnpm validate` on each new
or changed fixture (each semantic fixture its expected code, the op-path negative `schema/pattern` only, with sums
that match its total). The full gate is owed: the 15-minute load was 57.7 and free disk 6 GB.

OD-9, 2026-11-05, each exit 0: `pnpm typecheck`; `pnpm vitest run` on `test/ops-digest.test.ts`,
`test/consistency.test.ts`, `test/schema-compilation.test.ts`, `test/positive-sweep.test.ts`,
`test/rule-tolerance.test.ts`, `test/protocol-revisions.test.ts`, `test/fixtures.test.ts`,
`test/semantic-kinds.test.ts`, `test/validate-cli.test.ts` and `test/docs-check.test.ts` (10 files, 4070 tests), and
`src/ops-digest.ts` at 100 % branches over its own tests; `pnpm exec tsx tools/vectors/run.ts` (29 files);
`pnpm run docs:check`; `python3 docs/ux/lint.py`; `pnpm run privacy:check` (0 findings); `pnpm validate` on each new
fixture (positive exit 0, each negative exit 1 with its keyword, each semantic fixture its expected `FAC-SEM-168`).
The full gate (`pnpm check` with coverage) is owed: the machine's 15-minute load was above 45 and its free disk below
8 GB when OD-9 was committed.

Before OD-9:

On this branch's tree after the coordinator's changes, 2026-11-05: `pnpm typecheck`, `pnpm run docs:check`,
`pnpm ux:lint`, `pnpm run privacy:check` (0 findings), `pnpm vectors:check` (29 files) and `pnpm test` with coverage
and its per-file floors (109 files, 9846 tests passed, 1 skipped), each exit 0. No U+2014 in the added lines.

## Next task

The coordinator's blind readings of DEC-0153 on branch `agent/ct219-ops-digest-20261104`, until two clean rounds;
then the pull request, the merge and the answer on thread `f7758225`. That answer says in one sentence what RW-4's
`ok` means (asks answered by a retro the host saw written, never a count of retros) and names Fabric's CO-502 wording
("the daily digest counts retros asked and written"), so no view shows `ok` as retros written, and names OD-3's bound of
4095 named operations per UTC day plus one overflow name (Switchboard's SB-257 reads "past 4096") (CT-219's own row item (b) already says so
since round 6). At landing, also: update the knowledge base's
plans row for the contract (`fabric-workspace` `knowledge/plans.md`, its row at line 80 names neither OD-9 nor
`FAC-SEM-168`), and confirm CT-221's row reserved on main (PR #242) stays once.
