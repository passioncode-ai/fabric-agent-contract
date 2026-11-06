# 2026-11-04: operations digests and the retro after work (CT-219, DEC-0153)

## Objective

Deliver CT-219 by its own decision: the shapes `ops.digest.hourly@1` and `ops.digest.daily@1` with semantic rules, the
host obligation `retro-after-work`, fixtures, vectors, `pnpm validate` for both and the conformance rows. Names and
fields are Fabric's ADR-0188 (commit `0d0e5922`); the shape's origin is Fabric's commit `e1eecec0`
(`apps/desktop/src/shared/opsDigest.ts`, `apps/desktop/src/main/opsDigestRun.ts`). Asked on board thread `f7758225`
(message `516761e1`, item 2); Switchboard (SB-250) and Inbox (B-205) waited on the shape when CT-219 was filed.

## Done

- DEC-0153 (Accepted 2026-11-06, after clean rounds 22 and 23 at `f5302e3f`), [operations
  digests](../specification/ops-digest.md): OD-1 to OD-8 (window, operation names, counting, the rise, the daily fold,
  the files, nothing but counts, the operator told) and RW-1 to RW-4 (when the retro arises, how it is asked, what
  fulfils it, how it is counted).
- `schemas/ops-digest-hourly.schema.json`, `schemas/ops-digest-daily.schema.json` (closed; `pnpm validate` infers them
  by `schema`); `src/ops-digest.ts` (`foldHour`, `foldDay`, `isRise`, `FAC-SEM-166`, `FAC-SEM-167`) at 100 % branches;
  `tools/vectors/ops-digest.ts` and `fixtures/vectors/ops-digest.json` (11 hour and 4 day cases since round 23, expected values written
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
  negative fixtures with catalogue rows, 7 semantic fixtures (`ops-digest-folders-*`), tests in
  `test/ops-digest.test.ts`, `test/rule-tolerance.test.ts` and `test/consistency.test.ts`; the spec section "Where a
  collector reads the daily digests", the descriptor bullet in `service.md`, the key in `interop.md` (eight keys) and
  the named-only list in `versioning.md`; two conformance rows (a product declaring its folders, a collector), the
  register row and next free `FAC-SEM-169`. Its first consumers are announced (board message `2ed505f2`): Fabric's
  CO-503 and Project Observatory's OBS-330.
- `conformance.md`: the reference module row, three rows (a product folding its log, a reader of digests, a host
  serving `retro-after-work`), the register rows `FAC-SEM-166` and `FAC-SEM-167`, next free `FAC-SEM-168` (the state
  before OD-9; `FAC-SEM-169` since OD-9); `docs/specification/README.md`, `docs/DOCMAP.md`, `CONTEXT.md` (Operations
  digest, Retro after work); backlog CT-219 marked done at the acceptance (2026-11-06), with CT-222 and CT-226 filed.

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
  `paths.data` (`FAC-SEM-168`), since `dir` is relative to it. Tests, not vectors, pin `FAC-SEM-168`. The reader is a
  shape check (the extension schema), the placement and `paths.data` check, and per-entry checks: a `source` named
  twice, a `dir` named twice, a `dir` segment empty once its default-ignorable code points and trailing dots and
  spaces are dropped, a `dir` holding a lone surrogate, a `dir` holding a home folder, and a credential's shape in a
  `source` or in any of a `dir`'s four readings. The semantic fixtures (`fixtures/semantic/ops-digest-folders-*.json`)
  carry the remote placement, the invalid value, a `source` twice, a `dir` twice, a home folder in a `dir` and a
  credential-shaped `source`, beside the lawful one; `test/ops-digest.test.ts` carries the rest.

## Siblings on the same registers

DEC-0148 and DEC-0150 are on `main` (`1016f0ec`, read 2026-11-05); DEC-0149, DEC-0151 and DEC-0152 are on other
branches. Landing this branch directly on `main` as it stands:

- `test/schema-compilation.test.ts` counts 150 schemas (147 on `main` at `1016f0ec`, three for DEC-0153), and 151 once
  DEC-0149 lands too (one more); whichever lands last sets the count by hand.
- DEC-0150's extension key `channel-agent/0.1` is on `main`: the merge keeps both constants in `src/extensions.ts` and
  `test/consistency.test.ts` (and the test's title), both rows in `interop.md`'s key table, and writes "nine extension
  keys" there (`main` says eight). Its rule codes end at `FAC-SEM-165`, so the register's next free stays `FAC-SEM-169`.
- DEC-0150's `hint/declaration-only` entry is on `main` too, and `main`'s `Hint` is already the 4-tuple. The merge
  keeps both `readerHints` lines, each with its explicit help link as the fourth element (this branch's is the
  constant `OPS_DIGEST_HELP`, the anchor written once in `src/validate-cli.ts`; DEC-0150's is
  `channel-agent.md#what-is-checked`), and one `HINT_HELP` rule name whose shared value may be either side's: each
  line names its own page, so the value the merge keeps is never what a bare declaration prints. The check is that
  each bare declaration prints its own page's link (`test/ops-digest.test.ts` reads it from `--json`, and asserts the
  channel-agent link when that schema exists), and `grep -c 'ops-digest.md#where-a-collector-reads-the-daily-digests'
  src/validate-cli.ts` prints 1.
- `vitest.config.ts` keeps one coverage `include` line holding every branch's files, plus `src/ops-digest.ts`'s
  100 % branch floor.
- `test/positive-sweep.test.ts`'s sources list holds both `source-rules` and `ops-digest`; `test/rule-tolerance.test.ts`
  holds both branches' kinds, separated by a comma; so do the last rows of `fixtures/catalogue.json`.
- The register in `conformance.md` lists `FAC-SEM-166`, `FAC-SEM-167` and `FAC-SEM-168` after `FAC-SEM-165`, and
  next free `FAC-SEM-169`. `src/protocol-revisions.ts` and `versioning.md` hold `fabric-ops-digest/0.1` beside any
  revision another branch adds.
- Whichever of DEC-0149 and DEC-0153 lands second edits the live mirror lines: "(DEC-0153, in progress)" in
  `source.md`'s setup-answer sentence (DEC-0149's branch); every "(DEC-0149, in progress)" marker on this branch, in
  `ops-digest.md` (OD-3's two citations, the duplicate fold in OD-9, the `inGrammar` case under "Not decided here"),
  in the comments of `src/ops-digest.ts` (the fold's three doc comments and the segment check's comment) and in the
  parity comment of `test/ops-digest.test.ts`; and "in progress" in DEC-0153's item 4, which stays as written, since
  DEC-0153 is Accepted, and gets an Annotated line (the register is append-only). No conformance row names DEC-0149.
  Checks after both land: `git grep -n -E 'DEC-0153, in progress|DEC-0149, in progress' -- docs/specification src
  test` prints nothing; and DEC-0153's section in `docs/DECISIONS.md` carries an Annotated line that names "Starting
  without the instance" as landed (an Annotated line on another subject does not count).
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

A dated reading, read-only with `git ls-remote` and `gh api` on 2026-11-05 and again on 2026-11-06 before the pull
request, and nothing else: for each product (a) the repository and the commit or tag read, (b) the product's own rows
that track adoption, quoted by their status, and (c) how the product's own `foldHour` and `foldDay` answer
`fixtures/vectors/ops-digest.json` at that commit. (c) was not run in this session: running a product's downloaded
code was refused by the session's permission rules, so each line says "not run" and the folds are the coordinator's or
the product's to run. Anything agreed on the board is written "announced (board <message>)". No other claim about a
product's behaviour is made here or anywhere in this repository; read again before relying on a line. Vendoring the
vectors from the contract's release tag is every product's obligation.

- **Fabric**: (a) `passioncode-ai/fabric` origin/main `a6f0ffda`, latest prerelease v0.3.15. (b) Its CO rows live in
  the carry-over ledger `docs/evidence/specs/2026-08-16-software-fabric-carryover.md` at `a6f0ffda` (its
  `docs/evidence/backlog.md` points there): CO-500 "closed" (Fabric reads its own log every hour and every day);
  CO-502 "open" (`retro-after-work`; its row says "the daily digest counts retros asked and written"); CO-503 "open"
  ("The daily digest goes to Observatory"; target the organization slice, 2026-11-21, P-27). CO-509 is announced
  (board messages `449b3e7e`, `fefb0266`) and is not in the ledger, whose next free id is `CO-507`. Read again on
  2026-11-05 at origin/main `b8c0a38c`: the ledger now holds CO-509, "The digest's edges", whose first clause says
  that after a gap longer than a day the earlier day's daily digest is never written. That is Fabric's OD-5 departure:
  OD-5's catch-up writes a daily line for each closed UTC day that has hourly lines. (c) Not run (the round-4 readers
  reported its daily fold differing on 2 of the 4 day vectors at this commit, against this branch's
  `fixtures/vectors/ops-digest.json`, blob `c5a0a84489ec`, unchanged since `21bb0246`). Re-read 2026-11-06 (read only,
  nothing run): the latest prerelease is v0.3.16 (tag commit `bcead0ef`), and origin/main is `7fcbd647`. At the
  v0.3.16 tag CO-509 reads "narrowed 2026-11-05": a closed day with hourly lines and no daily line is folded once at
  the next start (DEC-0153 OD-5), the stop hour, `previous` at start, the 4096 bound, `OP_NAME` and the hours the Mac
  slept still open there. At `7fcbd647` it is narrowed again: the stop hour kept, `previous` from the last hourly
  line, 4095 names a day plus `ops.overflow`, OD-2's grammar held locally, the hours the Mac slept not written; still
  open there: the journal's counts, and `OP_NAME` and `OP_NAME_MAX` imported from the contract's tag once it carries
  DEC-0153. The vector file gained one hour case in round 23 (blob `bd05f2abcfb0`), so Fabric's vendored copy is one
  case behind until it re-vendors from the tag.
- **Fabric Inbox**: (a) release tag v0.95.0 (`6fed640`); `passioncode-ai/fabric-inbox` origin/main `71a3edd6`, where
  its rows were read. (b) B-212 "in review (0.95.0)", shipped in the v0.95.0 tag through PR #413; B-213 "open; due
  2026-11-16"; B-210 "open; due 2026-11-16 (Fabric's side 2026-11-18)", narrowed by PR #414 to the Mac app's own
  folder (announced, board message `17613e30`). (c) Not run. Re-read 2026-11-05 18:37Z (read only, nothing run): the
  latest release is v0.96.0 (16:17Z); PR #417, "the Mac app's digests keep the stop hour, and its descriptor names
  their folder (B-213, B-210, 0.98.0)", is open, so OD-1 and OD-3 (B-213) and OD-9 (B-210) for 0.98.0 are the board's
  claim (reply `132e7e91` on `f7758225`) until that release exists. Re-read 2026-11-06 (read only, nothing run):
  release v0.98.0 (`eb672c82`) carries `desktop/fabric-descriptor.cjs`, whose `buildDescriptor` writes a `local`
  descriptor with `paths.data` and the ops-digest key with one folder, `{dir: "digests", source: "mac-app"}`. That
  object, rebuilt by hand from `buildDescriptor`'s literal with neutral paths (its code not run), passes `pnpm
  validate --schema service-descriptor.schema.json` with no finding (exit 0, no `FAC-SEM-168`); the fallback route,
  the same declaration placed into this repository's `fixtures/positive/service-descriptor-ops-digest.json` in place
  of its folders, also exits 0. Latest release v0.99.0.
- **Fabric Dashboards**: (a) `passioncode-ai/fabric-dashboards` origin/main `9b9085bd`, latest release v0.8.23 (main
  two commits ahead). (b) FD-144 "done 2026-11-04, merged through PR #319, #323 and #324, released in 0.8.21"; FD-153 "done 2026-11-05,
  merged through PR #333, released in 0.8.23". (c) Not run.
- **Fabric Switchboard**: (a) `passioncode-ai/fabric-switchboard` origin/main `32f94cea`, latest release v0.7.11. (b)
  SB-250 "closed 2026-11-05: released in v0.7.11"; SB-255 "in review 2026-11-05, branch `sb-254-crash-restart`"
  (merged to main in PR #403); SB-257 "in review 2026-11-05, branch `sb-257-stop-hour`" (merged to main in PR #405;
  the next release after 0.7.12, announced, board message `157e65b4`); SB-251 to SB-254 and SB-256 are not about
  digests. (c) Not run. Re-read 2026-11-05 18:37Z (read only, nothing run): v0.7.12 (published 16:19Z, `e6da46ff`) is
  an ancestor of `32f94cea` and contains `ba0f6cb` (PR #403); v0.7.13 (published 18:09Z, `1ac3ccd3`) contains
  `32f94ce` (PR #405, SB-257's OD-1 work), as the board reply `36e22447` on `f7758225` says. Re-read 2026-11-06 (read
  only): origin/main `2f77e903`, latest release v0.7.16; SB-257 reads "closed 2026-11-05: released in v0.7.13" (PR
  #405, PR #408, release PR #410).
- **Project Observatory**: (a) `passioncode-ai/project-observatory-dashboard` origin/main `4116b3ac`, latest release
  v0.33.1. (b) OBS-330 "open": "Accept Fabric's daily digest of its own operations log as a project record kind";
  OBS-331 "open": "A daily review of what every agent learned: once a day, read the lessons (`observatory_lesson`) and
  digests of every project ...". (c) No fold to run.
- **The Fabric Agent Adapter**: (a) `passioncode-ai/fabric-agent-adapter` tag v0.65.0 (`3606bf89`), read with `git
  show` on 2026-11-05, nothing run. (b) FAA-206, as its row states at that tag: "open 2026-11-04: P1. Part 1 released
  in 0.64.0 on 2026-11-05 (`8eec4815`, tag `v0.64.0`) ... part 2 waits on the digest form in the contract (CT-219, a
  draft by 2026-11-10), its date named the day the form lands. ..." (c) No fold yet. At its next re-pin
  `fabric-ops-digest/0.1` enters its twin registers `fabric_protocols.py` and `fabric-protocols.mjs`, which its tests
  hold equal to the register `vendor_vectors.mjs` writes into `feed-protocols-vectors.json` (the twins are kept by
  hand). Re-read 2026-11-06 (read only): tag v0.67.0 (`f810583f`), FAA-206 still "open 2026-11-04: P1", part 2 waiting
  on the digest form at the contract's tag.
- **Protocol tables**: at their next re-pin, the consumers that vendor a protocol table (a deployment template's
  `src/fabric/fabric-protocols.mjs`, Fabric Dashboards' `test/fixtures/sample-service/fabric_protocols.py`, the adapter
  kit's copies in agents built on it, and any other vendored table) add `fabric-ops-digest/0.1`, as DEC-0149 asks for
  `fabric-source`.
- **At landing, DEC-0151's narrowed detector** (order-proof: whichever of DEC-0151 and DEC-0153 lands second does it):
  on the tree that holds both, add `FAC-SEM-167` pass cases for `queue.task-assigned-to-worker`,
  `work.desk-booking-confirmed` and `ui.disk-usage-refreshed-hourly`, which the `sk-` shape before DEC-0151 reads as
  keys, and move `queue.task-assigned-to-worker` out of the refused names of the test "applies OD-2 in full" in
  `test/ops-digest.test.ts` (it folds on the merged tree). Rename the test whose title ends "(until DEC-0151), the
  JWT, akia" for the narrowed detector and re-pin each row as the merged detector answers:
  `ops.risk-assessment-completed` (refused before DEC-0151) and `work.session-end-task-back` (passing), the lower-case
  `akia` row as passing (DEC-0151 reads the provider prefixes in canonical case), and an upper-case `AKIA` sample
  built from pieces as the refused case. Then, under the register's append-only rule (as the mirror line for item 4):
  OD-2 and the `FAC-SEM-167` row on the spec page are rewritten as DEC-0151's `SECRET_VALUE` reads the shapes,
  dropping "in either case" and "anywhere in the name" for the provider-prefix shapes (DEC-0151 reads them in
  canonical case at a boundary); DEC-0153 is Accepted, so its item 3 stays as written and an "Annotated (<date>)" line
  under DEC-0153 restates the detector's shapes as DEC-0151 reads them (naming `hasJwt` if DEC-0149 has landed). The
  Source's history (round 7's sentence on DEC-0151) is never rewritten. CT-222 (filed on this branch, the next free CT
  above every branch and main when written) widens `SECRET_VALUE` for underscore-form provider prefixes, `AIza` keys
  and `hf_` tokens, owned by DEC-0151's detector, with tests from split literals. The same rewrite reaches every place
  the page states the pre-DEC-0151 shapes: "in either case and anywhere in the name", the `sk-` shape inside any word
  "ending in sk" (with its `task-`, `risk-`, `mask-` examples), the `AKIA` shape followed by 16 letters or digits
  (DEC-0151 reads it after a boundary and in upper case only), and "until DEC-0151". Check after both land: `grep -n
  -E 'until DEC-0151|in either case and anywhere in the name|ending in sk|AKIA` followed by 16'
  docs/specification/ops-digest.md` prints nothing; DEC-0153's section carries that Annotated line; and the landing
  diff removes no line inside DEC-0153's Decision items.
- **At landing, the fold:** whichever of DEC-0149 and DEC-0153 lands second does it, against DEC-0149 at `899b4710` or
  its head at landing (re-read that head and run the fold checks below against it; at `899b4710` DEC-0149 exports
  `HFS_IGNORABLE_CHAR` with no global flag and `stripHfsIgnorable` from `src/source-rules.ts` and keeps its global
  `HFS_IGNORABLE` private, so the lander exports nothing from `src/source-rules.ts`): make `foldDir = (dir) =>
  foldPath(dir)`; delete `NUSKHURI`, `toMkhedruli` and the local `HFS_IGNORABLE` from `src/ops-digest.ts` (today only
  `foldDir` uses it: `dirReadings` removes every default-ignorable code point, a wider class, and keeps doing so); any
  test of the HFS+ class takes `HFS_IGNORABLE_CHAR.test` from `./source-rules.js`, importing only what is used.
  Checks: `pnpm typecheck` exits 0, `grep -c 'u200c-\\u200f' src/ops-digest.ts` prints 0, and the parity test in
  `test/ops-digest.test.ts` (DEC-0149's `FOLD_PAIRS` at `d4cc1e16` copied as written, plus the HFS+ samples) keeps
  holding. The same commit rewords the parity comment in `test/ops-digest.test.ts` (it says the parity holds "until
  the merged tree makes foldDir call its foldPath"; on that tree it is one implementation, so the comment says the
  pairs pin DEC-0149's fold as `foldDir` calls it). The segment check stays local: DEC-0149's `inGrammar` is not
  swapped in, and the NFC/NFD length case it would add is recorded as undecided (spec page "Not decided here", Open).
- **At landing, the JWT test:** `hasJwt` is exported from `src/secret-shape.ts` only on DEC-0149's branch (at
  `b2fdbf92`), not on `main`. Whichever of DEC-0149 and DEC-0153 lands second switches the long-run check in
  `digestFoldersRules` (`src/ops-digest.ts`, `JWT_SHAPE.test(reading)`) to `hasJwt(reading)` and drops the `JWT_SHAPE`
  import there if unused; it adds nothing to CT-212 (whose list names other files). The same lander rewords the spec
  sentence that names the definition, in OD-2 and in the `FAC-SEM-167` row of `ops-digest.md` ("`JWT_SHAPE`,
  `SECRET_VALUE` and `longSecret` (together `secretValue`) ... are the definition"), to name `hasJwt` in place of
  `JWT_SHAPE`, and DEC-0153 item 3 gets the same through its Annotated line. Checks after both land: `grep -c
  'JWT_SHAPE' src/ops-digest.ts docs/specification/ops-digest.md` prints 0 for each.
- **At landing, the home-path boundaries:** DEC-0149 at `899b4710` (or its head at landing) rewrites the copies that
  count the home-path boundaries (`devices.md`, `proposals.md`, `src/proposal-rules.ts`, `activity.md` "Its scope" and
  the scope comment in `src/activity-rules.ts`) for four boundaries, `SOURCE_HOME_PATHS` among them; the device-common
  `detail` `$comment` is count-free on this branch ("Changing any of them is a decision."), as are the
  `src/proposal-rules.ts` and `src/activity-rules.ts` comments. In the textual conflicts of those two scope comments
  keep DEC-0149's side (its `SOURCE_HOME_PATHS` clause). Fallback: whichever of DEC-0149 and DEC-0153 lands second
  rewrites any copy that DEC-0149's landed tree misses. The three places that gloss `hasHomePath` as the scanner for
  values that hold no path at all (`source.md`'s sentence, its twin in the `SOURCE_HOME_PATHS` docstring in
  `src/source-rules.ts`, and the comment above the `hasHomePath` assertions in `test/source-rules.test.ts`), all false
  once FAC-SEM-168 applies `hasHomePath` to a relative `dir`, fall to whichever of DEC-0149 and DEC-0153 lands second.
  The order-proof checks after both land: `grep -rn -E 'three home-path|any of the three' src docs/specification
  schemas` prints nothing; `git grep -n -E 'values that (must )?hold no path at all' -- src docs/specification test`
  prints nothing; and `grep -c SOURCE_HOME_PATHS src/activity-rules.ts src/proposal-rules.ts
  docs/specification/activity.md` prints at least 1 for each.
- **At landing, the sweep and the headings:** `NOT_SWEPT` in `test/positive-sweep.test.ts` keeps both
  `service-ops-digest-extension` and `service-channel-agent-extension`; `docs/DECISIONS.md` keeps a blank line before
  `### DEC-0153` (MD022), and `pnpm run docs:check` exits 0 on the merged tree.
- **At landing, the scenarios:** `docs/ux/scenarios.md` conflicts in SCN-002. Keep `main`'s channel-agent clause and this
  branch's ops-digest clause in Errors & recovery, and list `test/validate-cli.test.ts`, `test/channel-agent.test.ts`
  and `test/ops-digest.test.ts` in its Coverage; `python3 docs/ux/lint.py` exits 0.
- **At landing, the backlog:** `docs/backlog.md` keeps this branch's CT-219 and CT-222, main's CT-220 with DEC-0150's
  clause ("keeps DEC-0150 CA-8's bound ..."), CT-221 once and main's CT-223 to CT-225, in id order. Checks:
  `grep -c "keeps DEC-0150 CA-8's bound" docs/backlog.md` prints 1, and `grep -oE '^\| CT-[0-9]+ ' docs/backlog.md |
  sort | uniq -d` prints nothing.
- **At landing, the hints:** on the merged tree with DEC-0150, both `readerHints` lines carry an explicit help link
  (the `Hint`'s fourth element: `OPS_DIGEST_HELP` here, `channel-agent.md#what-is-checked` for DEC-0150), so
  `HINT_HELP`'s shared `hint/declaration-only` value may keep either side; `test/ops-digest.test.ts` asserts
  `channel-agent.md#what-is-checked` for the channel-agent bare declaration when that schema and its positive fixture
  exist (DEC-0150 asserts the same); the `readerHints` comment is the one written here (each bare declaration's line
  carries its own page); of `main`'s comments, the `Hint` docstring ending "(DEC-0153's form)" is dropped for this
  branch's ("its own help link when it differs per schema"), and the comment above the channel-agent push ("DEC-0150:
  a bare channel-agent declaration ...") is kept: `grep -c 'DEC-0150: a bare channel-agent declaration'
  src/validate-cli.ts` prints 1 on the merged tree.
- **At landing, the registers by hand:** the DEC-0153 row in `docs/handoffs/README.md` goes above the rows already on
  `main` (newest first); `interop.md`'s "The contract defines eight extension keys" becomes "nine" by hand (git merges
  it silently), and `grep -c 'defines nine extension keys' docs/specification/interop.md` prints 1; DEC-0153's client
  rows in `conformance.md` are five (DEC-0151's handoff says three; follow five), and `grep -c "^| a .*| DEC-0153"
  docs/specification/conformance.md` prints 5.

## Left to the landers of DEC-0149 and DEC-0151

DEC-0153 lands first (order a), so these steps of the "At landing" lines above fall to the sibling that lands after
it, each on the tree that holds both, with its checks. Every check runs after that landing.

**DEC-0149's lander** (branch `agent/ct194-source-manifest-v2-20261104`, read at `899b4710` and `b2fdbf92`):

1. The fold: `foldDir = (dir) => foldPath(dir)` in `src/ops-digest.ts`; delete `NUSKHURI`, `toMkhedruli` and the
   local `HFS_IGNORABLE` there; a test of the HFS+ class takes `HFS_IGNORABLE_CHAR.test` from `./source-rules.js`;
   reword the parity comment in `test/ops-digest.test.ts` (the pairs now pin DEC-0149's fold as `foldDir` calls
   it). Checks: `pnpm typecheck` exits 0; `grep -c 'u200c-\\u200f' src/ops-digest.ts` prints 0; the parity test
   keeps holding.
2. The JWT test: in `digestFoldersRules` (`src/ops-digest.ts`), `JWT_SHAPE.test(reading)` becomes
   `hasJwt(reading)`, the unused import dropped; the definition sentence in OD-2 and in the `FAC-SEM-167` row of
   `ops-digest.md` names `hasJwt` in place of `JWT_SHAPE`. Check: `grep -c 'JWT_SHAPE' src/ops-digest.ts
   docs/specification/ops-digest.md` prints 0 for each.
3. The mirror lines: drop the in-progress marker after every DEC-0149 citation on this branch (`ops-digest.md`
   OD-3 twice, OD-9's duplicate fold, the `inGrammar` case under "Not decided here"; the comments of
   `src/ops-digest.ts`; the parity comment of `test/ops-digest.test.ts`) and the DEC-0153 marker in `source.md`'s
   setup-answer sentence; DEC-0153 is Accepted, so its item 4 stays as written and an "Annotated (<date>)" line under
   DEC-0153 says that DEC-0149's "Starting without the instance" has landed. Checks: the mirror grep of the
   "Siblings" section prints nothing for `docs/specification`, `src` and `test`; DEC-0153's section carries that
   Annotated line.
4. The home-path glosses: `source.md`'s sentence, its twin in the `SOURCE_HOME_PATHS` docstring and the comment
   above the `hasHomePath` assertions in `test/source-rules.test.ts` stop calling `hasHomePath` the scanner for
   values that hold no path at all; in the scope comments of `src/activity-rules.ts` and `src/proposal-rules.ts`
   keep DEC-0149's side. Checks: the three greps of "At landing, the home-path boundaries".
5. The schema count in `test/schema-compilation.test.ts`: 151 with both (150 on DEC-0153's landed tree).

**DEC-0151's lander** (branch `agent/sqd-fields-20261104`, read at `69db2177`):

1. The re-pins in `test/ops-digest.test.ts`: `FAC-SEM-167` pass cases for `queue.task-assigned-to-worker`,
   `work.desk-booking-confirmed` and `ui.disk-usage-refreshed-hourly`; `queue.task-assigned-to-worker` moved out of
   the refused names of "applies OD-2 in full"; the test whose title ends "(until DEC-0151), the JWT, akia" renamed,
   its rows re-pinned (`ops.risk-assessment-completed` refused only before DEC-0151, `work.session-end-task-back`
   passing, lower-case `akia` passing, an upper-case `AKIA` sample from pieces refused). Check: `pnpm vitest run
   test/ops-digest.test.ts` exits 0.
2. The page: OD-2 and the `FAC-SEM-167` row of `ops-digest.md` restated as DEC-0151's `SECRET_VALUE` reads the
   shapes (canonical case, at a boundary). Check: the grep of "At landing, DEC-0151's narrowed detector" on
   `docs/specification/ops-digest.md` prints nothing.
3. The register: DEC-0153 is Accepted, so its item 3 stays as written and an "Annotated (<date>)" line under DEC-0153
   restates the shapes as DEC-0151 reads them (naming `hasJwt` if DEC-0149 has landed). Checks: DEC-0153's section
   carries that line; the landing diff removes no line inside DEC-0153's Decision items.
4. `conformance.md` keeps DEC-0153's five client rows. Check: `grep -c "^| a .*| DEC-0153"
   docs/specification/conformance.md` prints 5.

## Open

- The coordinator's blind readings (unit, seam, product) on this branch, rounds 1 to 23. Round 1 at `ada7c23d` was not
  clean: the seam tier found the credential sample `FAC-SEM-168`'s tests used no longer a key under DEC-0151, and the
  product tier found the home-folder detector refusing `home`, `users` and `Users` segments in operation names and
  dirs (`api.users/list`, `users/digests`), with one refused name dropping a whole line. Both are fixed in the round-1
  batch, with the coordinator's decisions on the retro count (RW-4), the catch-up (OD-5, OD-6), the trigger (RW-1),
  the identity (OD-9) and the order (OD-3), and the unit tier's risks (`usable`, a dir named twice, "no C0 control
  character", counts past 2^53 − 1, the op-path negative's counts).
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
  OD-1's writers split by how they keep records (reverted in round 10), the start rebuild from the hourly lines and the hour kept, an hour written as no digest
  being a gap, DEC-0153 items 2 and 4 carrying the start rebuild and the published overflow name, and the detector's
  shapes stated in words with `SECRET_VALUE` as the definition.
- Round 10 at `281619f7` was not clean: round 9's two kinds of writer were half-applied, so OD-1 now has one kind (a
  product writes one hourly line for each hour it observed itself running in, an empty one included, and folds each
  day's lines; one that keeps its records elsewhere and answers on request still writes those hourly lines, folding its
  records hour by hour), in OD-1, DEC-0153 item 2, the producer row, the page intro, CONTEXT and the daily schema's
  title; and the JWT shape is stated as `JWT_SHAPE` reads it (pinned: `a.eyJa.bb.c` and `a.eyJab.b.c` pass,
  `a.eyJab.bb.c` is refused, a lower-case `akia` tail is refused). The Alternatives' "which OD-1 makes impossible"
  (a daily digest of zero hours) is true again under one kind and is kept. Also: `dir` read also with the code points
  HFS+ ignores removed (findings and class hiding), `foldHour`'s docstring, FAC-SEM-167 and FAC-SEM-168 in
  `HOME_PATH`'s scope register, and OD-9's "the key in any document other than a service descriptor is unread and unreported; on a remote service descriptor it is a `FAC-SEM-168` finding" (reworded in round 11).
- Round 11 at `fcb1c55f` was not clean: OD-9's sentence on a remote descriptor (now "The key in any document other
  than a service descriptor is unread and unreported; on a remote service descriptor it is a `FAC-SEM-168` finding").
  Also: the Why restated for one writer (`hours` counts hourly lines folded, never uptime), a product that keeps its
  records elsewhere writing each hourly line when that hour closes (an empty one for an observed hour with no record)
  and answering a closed day with the lines already written, "each hour it observed itself running in" in the module
  docstring, the producer row, DOCMAP and the spec README, the `bearer` shape stated as the detector reads it (pinned
  as a dir), and the Consumers re-read for Switchboard v0.7.12 and v0.7.13 and Inbox PR #417.
- Round 12 at `4e00da84` was not clean: a daily line was promised for every UTC day, though a day with no hourly line has
  no daily digest (OD-5); now "each closed UTC day that has hourly lines" in DOCMAP, the spec README, the page intro,
  OD-1, DEC-0153 item 2, the producer row, CONTEXT and the module docstring ("every UTC day" counts 0 there). Also: the
  producer row's duties stated once, the `bearer` gloss "other than a line break (as
  JavaScript's `.` reads it)", pinned (`bearer` with two spaces is refused, `bearer`, a space and a line break is not;
  the round-12 note's `'bearer ' + ' '` is refused on this tree, so the line break is the passing sample), and
  `HOME_PATH`'s boundary in `activity.md` and its docstring stated as the operations digests page states it. The seam
  reading's add-on (its own commit): a `dir` segment that folds to nothing is refused (FAC-SEM-168, OD-9, the rule row,
  the schema), and the landing notes for DEC-0151's detector and DEC-0149's fold are corrected.
- Round 13 at `db110586` was not clean: the segment rule's stated mechanism (a reader measured on a scratch HFS+ volume
  that `.`, U+200C, `.` is created as its own folder and never resolves to `..`; the refusal stays, the safe direction,
  now worded: a segment made only of dots, spaces and code points HFS+ ignores folds to nothing, and a tool that trims
  or folds names as the fold does may read it as empty, `.` or `..`, outside `paths.data`) and its four lists (the rule
  now named in the page's FAC-SEM-168 bullet, the declaring product's conformance row, the schema's root description and
  the declaration-only hint). Also: a duplicate dir holding a code point HFS+ ignores is printed as "this dir",
  `HOME_PATH`'s docstring names the `%2F` boundary, and the siblings and landing notes now that DEC-0148 and DEC-0150
  are on `main`.
- Round 14 at `95823e35` was not clean: CT-220's DEC-0150 clause at landing (now a backlog landing line with its two
  checks), the acceptance edit missing (now the first item of the Next task), copies of `HOME_PATH`'s users (FAC-SEM-167
  and FAC-SEM-168 now in `src/proposal-rules.ts`'s scope comment; the device-common `$comment` points to the scope
  list, no vector or hash pins that file's bytes; the landing line names every copy) and control characters in the
  duplicate message (it now names a dir only when it is printable ASCII). Also: the segment message's "another folder
  than the one declared (outside paths.data when it leads)", the hint test's full list, the declaring product's row's
  credential duty, FAC-SEM-166's "x rose in 2 hours; the day folds 1", SCN-002's error path and coverage, and the fold
  and `inGrammar` landing notes.
- Round 15 at `f1321b27` was not clean: the acceptance edit named a merge commit that does not exist at its commit (now
  the pull request number and the merge date, and the handoffs README row's cell), FAC-SEM-166's messages echoed an
  operation's name raw (now "this operation" for a name OD-2's grammar refuses or that is not printable ASCII), and the
  home-folder check missed a dir whose segment ends in dots or spaces (now read also with each segment's trailing dots
  and spaces dropped). Also: a named duplicate dir quoted, "outside `paths.data`" qualified everywhere as the message
  says, SCN-002's clause and landing line, OD-9's bare-declaration sentence, the Why and Consequences, the device-common
  re-pin line, and the fold and home-path landing lines read against DEC-0149 at `47d392a4`. Amended after DEC-0149's
  round-49 seam reading: DEC-0149's landing rewrites every boundary copy, so this branch keeps only `source.md`'s
  sentence, its docstring twin and the order-proof check, and the fold line exports nothing (`stripHfsIgnorable` for
  the `.replace` uses, `HFS_IGNORABLE_CHAR` for any `.test`).
- Round 16 at `6c54c1da` was not clean: the `inGrammar` recommendation without its docs (dropped; the NFC/NFD length
  case is now recorded: a `dir` of 256 precomposed `ä` (U+00E4) passes FAC-SEM-168 though DEC-0149's `inGrammar`
  refuses it, pinned by the test "passes a dir of 256 precomposed code points that NFD doubles" and listed under the
  spec page's "Not decided here" and DEC-0153's; no CT id), the module's readings (a `dir` is now read four ways for
  the detectors: as written, with every default-ignorable code point removed, and each of those with each segment's
  trailing dots and spaces dropped, plus `foldDir` for hiding a class) and the boundary owner (the home-path landing
  line names DEC-0149 at `5a8e1770` with a fallback). Also: "another folder than the one declared, possibly outside
  `paths.data`" everywhere, the 40-character run across `/` refused on purpose stated, OD-3's echo rule naming values
  that are not printable ASCII, the device-common `$comment` count-free, the Next task's order, the sweep and heading
  landing line, and Consequences naming the five rows.
- Round 17 at `cc1fc853` was clean. Round 18 at the same head was not (product): the long-run alphabet (stated as the
  detector reads it now, letters, digits, `+`, `/`, `=`, `_` or `-`, with `Application+Support/MyProduct/Digests2026x`
  refused and pinned by a test), the acceptance edit left this handoff as it was (the acceptance edit in the Next task now rewrites it) and the knowledge base's plans row (the knowledge base rows in the Next task now write its Due cell and the products and roadmap Contract rows).
  Also folded from both rounds: a `dir` segment empty once every default-ignorable code point and its trailing dots
  and spaces are dropped is refused (`..` + U+2060), the folds name a non-string `from` and a null item with a worded
  error, FAC-SEM-168's message for a dir that only the long run makes a key says why and how to fix it, the
  declaration-only help link written once (`OPS_DIGEST_HELP`), `foldDay`'s docstring naming what it checks and what it
  leaves to the caller, DEC-0153 item 1's echo sentence and Compatibility's renamed names, the home-path landing line
  against DEC-0149 at `899b4710` with the third gloss place and its `git grep` check, the registers-by-hand landing
  line, and the Consumers re-read before the pull request.
- Round 19 at `dc6d0afc` was not clean (product; unit and seam passed, the seam tier's gates on both landing orders
  exiting 0): the Why still promised a daily line for a day the product was down and claimed no change for the first
  producer (now: a closed day gets its daily line at the next run when it has hourly lines, none without; the first
  producer's lines need no new member or format, and OD-1, OD-3 and OD-5's writing rules are each product's to adopt).
  Also: the intro's operator and retro wording, the steps named by subject, the landing merge before the gate with its
  `--is-ancestor` check, the DEC-0151 line order-proof with its check, the products row's commit and unlanded list,
  the receipt commits' route on `main`, the README index row, the long run's remedy (a space or a dot inside a
  segment, not at its end), the folds' "is not an array" and an undefined `previous`, a `dir` holding a lone surrogate
  refused, the hints landing line naming the dropped and kept comments, and the mirror lines' check.
- Round 20 at `5b2fc3ed` was not clean (product; unit and seam passed, the seam tier's gates on both landing orders
  exiting 0): the lone surrogate was missing from three lists of what FAC-SEM-168 checks (the declaring product's
  conformance row, the extension schema's root description and the bare-declaration hint, now all naming it), and the
  receipt fast-forward named a weaker gate (now `pnpm run check`, the repository's local gate). Also: the board answer
  states the SB-257 bound in our words, the Consumers re-read covers the rows the answer quotes, the acceptance edit's
  receipt keeps only the pull request number, the version list dropped from the re-read step, a stale "Round 11"
  sentence removed, `objects()` reading a sparse array's holes, the DEC-0151 line naming the lines to annotate and the
  test title to rename, the JWT landing line (`hasJwt` is only on DEC-0149's branch) and the fold line re-read against
  DEC-0149's head at landing.
- Round 21 at `7e8a9429` was not clean (unit passed; product and seam each found one break, the seam tier's gates on
  both landing orders green): the handoff counted FAC-SEM-168's checks wrongly (now named one by one, with which the
  semantic fixtures carry), and the DEC-0151 landing line would have rewritten an Accepted decision's body (now under
  the register's append-only rule: the spec page rewritten, DEC-0153 item 3 never rewritten once accepted, an
  Annotated line instead). Also: the Consumers re-read runs `pnpm validate` on each OD-9 declarer's shipped
  descriptor, Fabric's CO-509 named as its OD-5 departure, the fold landing line opening with its second lander,
  conformance's declaring row naming `paths.data`, the hourly and daily schema descriptions naming each op once in ops
  and at most once in risen, and the folds' worded errors for an odd `previous` and a `day` that is no real UTC day.
- Rounds 22 and 23 at `f5302e3f` were clean (round 23: unit, product and seam each passed). What they held (vectors,
  wording, comments and tests, no rule changed) is the landing commit: the hour vector "10 failures after 6: no rise"
  and the 9-after-5 case renamed, FAC-SEM-166's total message for a sum beyond 2^53 - 1, a test pinning OD-9's dir to
  the package path's grammar, the in-progress markers on every DEC-0149 citation, the duplicate fold's DEC-0149 parity
  noted, the reference's error inputs named its choice, RW-2's channel, CONTEXT's OD-8, the Consumers re-read of
  2026-11-06, the landing lines' checks, the block left to DEC-0149's and DEC-0151's landers, and CT-226 filed.
  DEC-0153 was accepted on 2026-11-06.
- The grammar of an `insight/1` line; the session and request counts ADR-0188 §1 also names (a gauge has no `@1`
  home); how the daily digest travels to Project Observatory; `pnpm validate` reading a `.jsonl` file whole. All are
  named under "Not decided here" on the spec page.

## Checks actually run

Round-21 batch, 2026-11-05, each exit 0: `pnpm typecheck`; `pnpm vitest run --testTimeout=60000` on the six files of
round 16 with coverage on `src/ops-digest.ts` (2044 tests; 298 of 298 statements, 238 of 238 branches); `pnpm exec tsx
tools/vectors/run.ts`; `pnpm run docs:check`; `python3 docs/ux/lint.py`; `pnpm run privacy:check` (0 findings).
Fabric's ledger was read with `gh api` at origin/main `b8c0a38c` for CO-509; nothing of another repository was run.
The branch gate on this tree before its commit (15-minute load 33.3, 16 GB free, under the heavy lock): `pnpm run
check` (109 files, 9960 tests passed, 1 skipped, coverage floors held; `ux:lint`, `docs:check`, `privacy:check` 0
findings) exit 0, and `pnpm run vectors:check` exit 0. This paragraph is the only change after it.

Round-20 batch, 2026-11-05, each exit 0: `pnpm typecheck`; `pnpm vitest run --testTimeout=60000` on the six files of
round 16 with coverage on `src/ops-digest.ts` (2044 tests; 293 of 293 statements, 227 of 227 branches); `pnpm exec tsx
tools/vectors/run.ts`; `pnpm run docs:check`; `python3 docs/ux/lint.py`; `pnpm run privacy:check` (0 findings).
Case-insensitive counts of the lone-surrogate word: `conformance.md` 3 (two rows of other decisions and the declaring
product's row), the extension schema 2 (its root and its `dir`), `src/validate-cli.ts` 1 (the bare-declaration hint).
The branch gate on this tree before its commit (15-minute load 40.4, 17 GB free, under the heavy lock): `pnpm run
check` (109 files, 9960 tests passed, 1 skipped, coverage floors held; `ux:lint`, `docs:check`, `privacy:check` 0
findings) exit 0, and `pnpm run vectors:check` exit 0. This paragraph is the only change after it.

Round-19 batch, 2026-11-05, each exit 0: `pnpm typecheck`; `pnpm vitest run --testTimeout=60000` on the six files of
round 16 with coverage on `src/ops-digest.ts` (2044 tests; 292 of 292 statements, 227 of 227 branches); `pnpm exec tsx
tools/vectors/run.ts`; `pnpm run docs:check`; `python3 docs/ux/lint.py`; `pnpm run privacy:check` (0 findings). Greps:
the two Why phrases the coordinator named in `docs/DECISIONS.md`, 0 each; the numbered step references the coordinator
named, in this handoff, 0 (a follow-up commit words this paragraph so that it quotes none of them). The branch gate on
this tree before its commit (15-minute load 34.9, 18 GB free, under the heavy lock): `pnpm run check` (109 files, 9960
tests passed, 1 skipped, coverage floors held; `ux:lint`, `docs:check`, `privacy:check` 0 findings) exit 0, and `pnpm
run vectors:check` exit 0. This paragraph is the only change after it.

Rounds 17 and 18 batch, 2026-11-05, each exit 0: `pnpm typecheck`; `pnpm vitest run --testTimeout=60000` on the six
files of round 16 with coverage on `src/ops-digest.ts` (2043 tests; 287 of 287 statements, 222 of 222 branches); `pnpm
exec tsx tools/vectors/run.ts`; `pnpm run docs:check`; `python3 docs/ux/lint.py`; `pnpm run privacy:check` (0
findings). Greps: the alphabet as written before this round (with no `+` or `=`, in its Markdown and its schema form)
in `src`, `docs` and `schemas`, 0 (this paragraph rewords it in a follow-up commit, so that grep finds nothing here
either); `grep -c 'ops-digest.md#where-a-collector-reads-the-daily-digests' src/validate-cli.ts`, 1. The branch gate
on this tree before its commit (15-minute load 25.1, 19 GB free, under the heavy lock): `pnpm run check` (109 files,
9959 tests passed, 1 skipped, coverage floors held; `ux:lint`, `docs:check`, `privacy:check` 0 findings) exit 0, and
`pnpm run vectors:check` exit 0. This paragraph is the only change after it.

Round-16 batch, 2026-11-05, each exit 0: `pnpm typecheck`; `pnpm vitest run --testTimeout=60000` on
`test/ops-digest.test.ts`, `test/proposal-rules.test.ts`, `test/consistency.test.ts`, `test/validate-cli.test.ts`,
`test/schema-compilation.test.ts` and `test/positive-sweep.test.ts` with coverage on `src/ops-digest.ts` (2040 tests;
275 of 275 statements, 214 of 214 branches); `pnpm exec tsx tools/vectors/run.ts`; `pnpm run docs:check`; `python3
docs/ux/lint.py`; `pnpm run privacy:check` (0 findings). Greps: `grep -rn "when it leads" src docs/specification
docs/DECISIONS.md schemas | wc -l` prints 0; the same for "possibly outside" prints 7; "Recommended: use DEC-0149" in
this handoff, 0; `grep -rn -E 'any of the three' src schemas`, 0. The branch gate on this tree before its commit
(15-minute load 31.4, 18 GB free, under the heavy lock): `pnpm run check` (109 files, 9956 tests passed, 1 skipped,
coverage floors held; `ux:lint`, `docs:check`, `privacy:check` 0 findings) exit 0, and `pnpm run vectors:check` exit
0. This paragraph is the only change after it.

Round-15 batch, 2026-11-05, each exit 0: `pnpm typecheck`; `pnpm vitest run --testTimeout=60000` on the 12 files of
round 14 with coverage on `src/ops-digest.ts` (4228 tests; 270 of 270 statements, 212 of 212 branches);
`pnpm exec tsx tools/vectors/run.ts` (29 files); `pnpm run docs:check`; `python3 docs/ux/lint.py`;
`pnpm run privacy:check` (0 findings). Greps: `declaration-only` in `ops-digest.md` once; "outside `paths.data`"
without "when it leads" in the page, DEC-0153, the module and the extension schema, 0. The branch gate on this tree
before its commit (15-minute load 31.0, 18 GB free, under the heavy lock): `pnpm run check` (109 files, 9953 tests
passed, 1 skipped, coverage floors held; `ux:lint`, `docs:check`, `privacy:check` 0 findings) exit 0, and
`pnpm run vectors:check` exit 0. This paragraph is the only change after it.

Round-14 batch, 2026-11-05, each exit 0: `pnpm typecheck`; `pnpm vitest run --testTimeout=60000` on the 11 files of
round 2 plus `test/proposal-rules.test.ts` with coverage on `src/ops-digest.ts` (4226 tests; 264 of 264 statements,
212 of 212 branches); `pnpm exec tsx tools/vectors/run.ts` (29 files); `pnpm run docs:check`; `python3 docs/ux/lint.py`;
`pnpm run privacy:check` (0 findings). Greps on the branch: "keeps DEC-0150 CA-8's bound" counts 0 (main's clause
arrives at landing), duplicate CT ids none, the HFS+ class in `src/ops-digest.ts` once (the landing removes it), and
the boundary-copy grep lists `src/proposal-rules.ts`, `src/activity-rules.ts`, `devices.md`, `proposals.md` and the
device-common `$comment`. The branch gate on this tree before its commit (15-minute load 28.5, 19 GB free, under the
heavy lock): `pnpm run check` (109 files, 9951 tests passed, 1 skipped, coverage floors held; `ux:lint`, `docs:check`,
`privacy:check` 0 findings) exit 0, and `pnpm run vectors:check` exit 0. This paragraph is the only change after it.

Round-13 batch, 2026-11-05, each exit 0: `pnpm typecheck`; `pnpm vitest run --testTimeout=60000` on the 11 files of
round 2 with coverage on `src/ops-digest.ts` (4216 tests; 264 of 264 statements, 212 of 212 branches);
`pnpm exec tsx tools/vectors/run.ts` (29 files); `pnpm run docs:check`; `python3 docs/ux/lint.py`;
`pnpm run privacy:check` (0 findings). The branch gate on this tree before its commit (15-minute load 40.5, 19 GB free,
under the heavy lock): `pnpm run check` (109 files, 9950 tests passed, 1 skipped, coverage floors held; `ux:lint`,
`docs:check`, `privacy:check` 0 findings) exit 0, and `pnpm run vectors:check` exit 0. This paragraph is the only
change after the gate.

The branch gate at `74f293f5`, 2026-11-05 (15-minute load 37.9, 20 GB free, under the heavy lock):
`ORG_INDEX=<org-index checkout> pnpm run check` (typecheck, `pnpm test` with coverage and its per-file floors: 109 files,
9949 tests passed, 1 skipped; `ux:lint`; `docs:check`; `privacy:check`, 0 findings) exit 0, and `pnpm run vectors:check`
exit 0. The later commit that records this changes only this file.

Round-12 batch, 2026-11-05, each exit 0: `pnpm typecheck`; `pnpm vitest run --testTimeout=60000` on the 11 files of
round 2 with coverage on `src/ops-digest.ts` (4214 tests; 260 of 260 statements, 208 of 208 branches);
`pnpm exec tsx tools/vectors/run.ts` (29 files); `pnpm run docs:check`; `python3 docs/ux/lint.py`;
`pnpm run privacy:check` (0 findings).
The seam add-on, the same checks, each exit 0 (4215 tests; 263 of 263 statements, 210 of 210 branches).

Round-11 batch, 2026-11-05, each exit 0: `pnpm typecheck`; `pnpm vitest run --testTimeout=60000` on the 11 files of
round 2 with coverage on `src/ops-digest.ts` (4214 tests; 260 of 260 statements, 208 of 208 branches);
`pnpm exec tsx tools/vectors/run.ts` (29 files); `pnpm run docs:check`; `python3 docs/ux/lint.py`;
`pnpm run privacy:check` (0 findings). "folds from stored records" counts 0 in DEC-0153; "ran through" and "folded every
hour" count 0 in the module, the producer row, DOCMAP, the spec README, the spec page and CONTEXT. The branch gate is
owed: the 15-minute load was 51.6.

Round-10 batch, 2026-11-05, each exit 0: `pnpm typecheck`; `pnpm vitest run --testTimeout=60000` on the 11 files of
round 2 with coverage on `src/ops-digest.ts` (4214 tests; 260 of 260 statements, 208 of 208 branches);
`pnpm exec tsx tools/vectors/run.ts` (29 files); `pnpm run docs:check`; `python3 docs/ux/lint.py`;
`pnpm run privacy:check` (0 findings). "two kinds", "writes no hourly" and "never both" count 0 in DEC-0153, the spec
page, conformance, CONTEXT and the daily schema. The branch gate is owed: the 15-minute load was 70.5.

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

DEC-0153 is accepted on its branch and the pull request is open. After it, in this order:

1. The merge: once the pull request's checks read green on its head (the landing merge of `origin/main` is in it, and
   the gate ran on that merged head), merge it as the history does. Never force-push.
2. Compare `gh pr view <N> --json mergedAt` with 2026-11-06, the date the acceptance wrote; if the UTC day differs,
   correct it in DEC-0153's Status, CT-219's receipt and the handoffs README row. Then CT-219's receipt and the README
   row read "accepted <date>, #N; merged <date>". The commit lands on `main` as a fast-forward after `pnpm run check`
   exits 0 (the repository's local gate: the knowledge base's `knowledge/rules.md`, line 29; `AGENTS.md`), or through
   a receipt pull request.
3. The release, tagged as the history does; watch its run to success, then write the tag into CT-219's receipt and the
   handoffs README row as "merged <date>, #N; released <tag>", landed on `main` the same way.
4. The answer on board thread `f7758225`. It says in one sentence what RW-4's `ok` means (asks answered by a retro the
   host saw written, never a count of retros) and names Fabric's CO-502 wording ("the daily digest counts retros asked
   and written"), so no view shows `ok` as retros written (CT-219's own row item (b) already says so since round 6);
   states, in our words, OD-3's bound against Switchboard's SB-257 (SB-257 reads a per-line bound of 4096 operations,
   with the rest counted under one fixed name; OD-3 bounds 4095 named operations per UTC day plus one overflow name);
   and names the release tag, so the products vendor the vectors from it (the hour vectors grew by one case in round
   23). Re-read the rows it quotes on the day it is sent.
5. The knowledge base rows in `fabric-workspace`: in `knowledge/plans.md`, the contract's row at line 80 replaces PR
   #240 with this decision's pull request, adds OD-9 and `FAC-SEM-168`, and its Due cell becomes "merged <date>, #N;
   released <tag>" (no "draft by"); the Contract row of `knowledge/products.md` (line 21) gets the new tag, the `main`
   commit the tag points at, and "through DEC-0153" with whatever is still unlanded named (today "DEC-0149, DEC-0151
   and DEC-0152 still on branches"); the Contract row of `knowledge/roadmap.md` (line 70) gets the new tag and the
   same "through DEC-0153" with the same unlanded qualifier; confirm CT-221's row reserved on main (PR #242) stays
   once. Then publish (`node scripts/workspace.mjs sync` from a Fabric checkout) or leave it to the scheduled sync.
6. Relay the section "Left to the landers of DEC-0149 and DEC-0151" to those branches' owners (the coordinator carries
   it), so the sibling that lands next runs its steps and checks.
