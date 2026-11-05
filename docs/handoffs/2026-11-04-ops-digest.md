# 2026-11-04: operations digests and the retro after work (CT-219, DEC-0153)

## Objective

Draft CT-219 by its own decision: the shapes `ops.digest.hourly@1` and `ops.digest.daily@1` with semantic rules, the
host obligation `retro-after-work`, fixtures, vectors, `pnpm validate` for both and the conformance rows. Names and
fields are Fabric's ADR-0188 (commit `0d0e5922`); the reference implementation is Fabric's commit `e1eecec0`
(`apps/desktop/src/shared/opsDigest.ts`, `apps/desktop/src/main/opsDigestRun.ts`). Asked on board thread `f7758225`
(message `516761e1`, item 2); Switchboard (SB-250) and Inbox (B-205) wait on the shape.

## Done

- DEC-0153 (Proposed), [operations digests](../specification/ops-digest.md): OD-1 to OD-8 (window, operation names,
  counting, the rise, the daily fold, the files, nothing but counts, the operator told) and RW-1 to RW-4 (when the
  retro arises, how it is asked, what fulfils it, how it is counted).
- `schemas/ops-digest-hourly.schema.json`, `schemas/ops-digest-daily.schema.json` (closed; `pnpm validate` infers them
  by `schema`); `src/ops-digest.ts` (`foldHour`, `foldDay`, `isRise`, `FAC-SEM-166`, `FAC-SEM-167`) at 100 % branches;
  `tools/vectors/ops-digest.ts` and `fixtures/vectors/ops-digest.json` (10 hour and 4 day cases, expected values written
  by hand); 3 positive, 9 negative and 13 semantic fixtures; `test/ops-digest.test.ts`.
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
  register row and next free `FAC-SEM-169`. Fabric (CO-503) and Project Observatory (OBS-330) are its first consumers.
- `conformance.md`: the reference module row, three rows (a product folding its log, a reader of digests, a host
  serving `retro-after-work`), the register rows `FAC-SEM-166` and `FAC-SEM-167`, next free `FAC-SEM-168`;
  `docs/specification/README.md`, `docs/DOCMAP.md`, `CONTEXT.md` (Operations digest, Retro after work); backlog
  CT-219 marked in progress.

## Decisions taken in the draft

- `from` and `to` take the `.000` fraction Fabric writes as well as none; `day` is `YYYY-MM-DD`; `hours` 1 to 24.
- `op` grammar `^[a-z][A-Za-z0-9_]*(?:[.:/-][A-Za-z0-9_]+)*$`, at most 64: `:` because Fabric's IPC operations carry
  one (`ipc.work:home`), `_` for products that write snake case, `/` (the coordinator's decision of 2026-11-05) because
  Fabric logs MCP methods as `mcp.<method>` (`mcp.tools/list`; thread `f7758225`, message `1c191cf7`); the 175 names
  Fabric checked in a week of its log fit. `FAC-SEM-167` applies `hasHomePath` too, so `/` lets no home folder in.
- A day with no hour of its own has no daily digest (OD-5; Fabric Inbox answers `404`, message `f74763e1`);
  `foldDay` returns null for it. `hours` stays 1 to 24.
- A call refused because a source slot is missing (DEC-0149's setup state, in progress) counts `unknown`, never
  `failed` (OD-3), so it never makes a rise.
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
  register's next free stays `FAC-SEM-169`.
- `vitest.config.ts` keeps one coverage `include` line holding every branch's files, plus `src/ops-digest.ts`'s
  100 % branch floor.
- `test/positive-sweep.test.ts`'s sources list holds both `source-rules` and `ops-digest`; `test/rule-tolerance.test.ts`
  holds both branches' kinds, separated by a comma; so do the last rows of `fixtures/catalogue.json`.
- The register in `conformance.md` lists `FAC-SEM-166`, `FAC-SEM-167` and `FAC-SEM-168` after `FAC-SEM-165`, and
  next free `FAC-SEM-169`. `src/protocol-revisions.ts` and `versioning.md` hold `fabric-ops-digest/0.1` beside any
  revision another branch adds.
- Whichever of DEC-0149 and DEC-0153 lands second drops "(DEC-0153, in progress)" from `source.md`'s setup-answer
  sentence, and "in progress" from `ops-digest.md`'s OD-3 and from the DEC-0153 conformance row where it names
  DEC-0149. DEC-0153's own decision text ("DEC-0149's setup state, in progress") is edited if DEC-0153 is still
  Proposed, and annotated if it is already Accepted (the register is append-only).
- DEC-0152 shares `docs/DECISIONS.md`, `docs/DOCMAP.md`, `docs/backlog.md`, `docs/handoffs/README.md` and
  `conformance.md` (a different row).
- DEC-0151 (branch `agent/sqd-fields-20261104`) narrows `SECRET_VALUE` in `src/secret-shape.ts`. `FAC-SEM-167` and
  `FAC-SEM-168` follow the narrowed detector; after DEC-0151 no schema-valid `source` can be an `sk-` key (the source
  grammar has no upper case, which DEC-0151's `sk-` shape needs), so this branch's credential samples are Slack-shaped
  and lower case, built from pieces, and found by both detectors. Checked on a scratch merge of `main`, DEC-0151 and
  this branch (below). The sibling notes in DEC-0149's and DEC-0151's own handoffs belong to those branches and are
  not edited here.
- At landing, write both next-free markers from the CAS counters, never from this file: `docs/DECISIONS.md`'s next
  free ID (`DEC-0154` today) and `conformance.md`'s next free rule code (`FAC-SEM-169` today).

## Consumers

- Fabric (CO-503) collects the daily lines from the folders a descriptor names (OD-9) and sends them with `source` and
  the descriptor's `id` and `instance`; Project Observatory (OBS-330) records them.
- The Fabric Agent Adapter, at its next re-pin: `fabric-ops-digest/0.1` enters its twin protocol registers
  `fabric_protocols.py` and `fabric-protocols.mjs`, which its `test/fixtures/contract/vendor_vectors.mjs` writes from
  `PROTOCOL_REVISIONS` (the `register` of `feed-protocols-vectors.json`); and its retro counting follows RW-4 (`ok`
  only for a retro written through a call it carries).
- Fabric Switchboard (SB-250) and Fabric Inbox (B-205) write the digests; each with a local descriptor may declare
  its folders (OD-9) and renames any operation `FAC-SEM-167` refuses (OD-2's examples) before writing.

## Open

- The coordinator's blind readings (unit, seam, product) on this branch, then the pull request. Round 1 at
  `ada7c23d` was not clean: the seam tier found the credential sample `FAC-SEM-168`'s tests used no longer a key under
  DEC-0151, and the product tier found the home-folder detector refusing `home`, `users` and `Users` segments in
  operation names and dirs (`api.users/list`, `users/digests`), with one refused name dropping a whole line. Both are
  fixed in the round-1 batch, with the coordinator's decisions on the retro count (RW-4), the catch-up (OD-5, OD-6), the
  trigger (RW-1), the identity (OD-9) and the order (OD-3), and the unit tier's risks (`usable`, a dir named twice,
  "no C0 control character", counts past 2^53 − 1, the op-path negative's counts). Round 2 is next.
- The grammar of an `insight/1` line; the session and request counts ADR-0188 §1 also names (a gauge has no `@1`
  home); how the daily digest travels to Project Observatory; `pnpm validate` reading a `.jsonl` file whole. All are
  named under "Not decided here" on the spec page.

## Checks actually run

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
then the pull request, the merge and the answer on thread `f7758225`.
