# 2026-11-03: an agent's source and its instance (CT-194, DEC-0149)

## Objective

Decide CT-194 after the research report [agent portability](../reports/2026-10-27-agent-portability/README.md) stood
for objections until 2026-11-03 18:00 UTC (threads `21ac4057`, `0a8776f2`) with none: where an agent declares its
source, what never travels with it, the check before a source export, and how a hand-over is gated.

## Done

- DEC-0149 (status Proposed, accepted at merge after two clean rounds of readings): option B, `fabric.source.json`
  (`fabric-source/1`) for every kind of agent, opt-in; `include` default deny with `exclude` holes, `.git` never,
  the manifest always, `unchecked` paths travelling unread; slots `secret`, `config`, `store` (with `path`),
  `endpoint`, no value; the operator's list of installation strings outside the tree as plain text; the tree check
  (`FAC-SEM-158` blocking, `FAC-SEM-159` accepted) with the adapter's home and credential forms, synthetic words and
  nested repositories; the manifest's rules (`FAC-SEM-156`, `FAC-SEM-157`); the package pair (`FAC-SEM-160`, a copy
  without state passing); the source export as one commit by `Fabric source export <source-export@fabric.invalid>`
  with no history, no gitlink and no test run as a condition; the hand-over as `publish` (P3), a `relayed` action
  taken on the operator's word for that act, never by a mandate, as
  [source](../specification/source.md#handing-over) specifies; import by
  source paths; starting without the instance, every missing slot a setup state, a capability answering with its
  tool's own error.
- `schemas/fabric-source.schema.json`, `src/source-rules.ts` (100 % of its branches), the kinds `source-manifest`,
  `source-tree`, `source-package`, `fabric-source/1` in the protocol register; `pnpm --silent validate <dir> --kind
  source-tree` (Git mode with Git's location variables removed and no read through a link, a walk otherwise with a note
  saying why, folder-relative output that never repeats a found value) and the pair in `pnpm validate <dir>`;
  `fixtures/vectors/source-tree.json` (61 tree cases, 3 patch cases and a `constants` block written from the module's
  exports) from `tools/vectors/source-tree.ts`;
  2 positive and 19 negative schema fixtures, 27 semantic fixtures.
- [source](../specification/source.md) (new), the register (`FAC-SEM-156` to `FAC-SEM-160`; next free `FAC-SEM-162`;
  `FAC-SEM-161` reserved and unused), the reference module and readers' rows, `package.md`, `proposals.md`,
  `delegation.md` (MD-5, MD-6, DL-18's order of checks, OA-5), `governance-and-roles.md`, `service.md` (the setup state), the index, `README.md`,
  `DOCMAP.md`, `CONTEXT.md` (Source slot, Source export), `AGENTS.md`, the RFC 2606 ledger row, ST-037, SCN-054 on SCR-03; backlog CT-194 (DEC-0149 proposed, done at merge), CT-207 and CT-208
  filed, CT-181 widened to the hand-over's target requirement and MD-6 entry.
- The readings are cited by round number: their heads were on the review branch, which is not kept at landing (the
  heads named under **Checks actually run** and in the merge notes are on it too).
- Round 1 (17 items), round 2 (product 1 to 7, unit 8 to 15, seam 16 and 17) and round
  3's product reading (the ignore file's mapping, the slot exception, the walk note, the hand-over's
  target, the order `files[<index>]` counts in) and round 3's unit and seam readings (an untracked repository, `git`
  from absolute PATH folders only, Git-mode read errors, ASCII-only key case, Python's white space, U+FFFD, the e-mail
  rule after JSON unescaping, the adapter's Git location list, masked manifest errors, the hand-over's exceptions and
  CT-181, CT-207's protocol tables and constants) answered as the coordinator decided; round 4 (a
  manifest message or usage error naming no found value, the parse error by position, a byte-order mark kept as a
  character, token-file names with a line separator, a nested repository outside the source taking no index, each
  relayed route's binding, every `instancePath` named, the vectors' `constants` block, provider keys found by
  bisection in linear time, Git's names split as bytes, the `Source slot` term, the setup entries past 64 and a failing
  endpoint's `source`, the hand-over's `target` by the package's `id` with a digest past 200 characters, the pair in
  conformance.md, the walk root as `.`, the store path by `slots[<index>]`, CT-181's row) answered as decided; round 5 (a credential across a space masked in manifest messages and slot names, an include naming a nested
  repository without its slash, folder usage errors naming `.` and telling an unreadable folder from a missing
  manifest, one hand-over rule on every relayed route with the operator as the only approver and one word per
  hand-over, a package never carrying `fabric.source.json`, the overflow entry's id reserved from connections, a path
  shown no further than a finding's first segment, Git reaching no path outside the source and waiting at most 60 s,
  the folder rewritten only as a path prefix, the next-free `DEC-0150`, CT-207's walk and signature differences,
  CT-208's cold-start scenario) answered as decided; round 6 (no member name holding a finding in a
  problem's path and no extension hint on the closed manifest; round 5's "a package never carries
  `fabric.source.json`" reversed: a package may carry it as a listed file, since every known packer packs in place; the
  overflow entry renamed `fabric.source.json#slots` and the reserved connection id dropped, with the order of the entries
  that stay; no address in a path; a manifest named on its own checking its folder; `GIT_CEILING_DIRECTORIES` kept;
  AP-2's exception in service.md, the owed tense, CONTEXT, README, SCN-054 and CT-181, CT-207 wording) answered as
  decided; round 7 (a source check prints no instance data in a schema or parse message by construction:
  messages from the keyword and the schema's values, a parse position found by reading the text again, no hints;
  masked() reads escaped quotes; Git mode kept for a nested repository under the include paths and an ignored include
  path `missing`; the conformance rows' hand-over exceptions; the refusal codes; store slots created at a first start;
  every failure before every setup entry in the cap; the agents-first item 7 reading; the guide's inference row and
  pair) answered as decided; round 8 (one predicate for a source check: a `source-` kind, the source
  schema named or inferred, or the file's name; a value that is not a string named by its place; a missing endpoint
  always a setup entry by the slot's name, only a filled failing one under a connection; refusal codes by route, a
  reused approval `approval-reused`, the idempotency lookup first; the RFC 2606 row limited to the exempted names; a
  bounded, linear link scan; a Git spawn error told by its code; `src/validator.ts` under its coverage floor; owed tense
  in DEC-0149, CT-208, SCN-054 and README) answered as decided; round 9 (every source check made
  instance-free in `checkFile` whatever schema or rule speaks, the target named by its basename on every such route;
  the URL trim, the query parse and the word strip in one pass; a long or whitespace-folded name by its place; the
  idempotency order, the consumed-word store, approval precedence and DL-19's hand-over details; a store that cannot be
  created a failure; the 5-minute message ignoring setup entries; the connection id grammar's guarantee; the CLI help;
  the research report's header) answered as decided; round 10 (a one-pass JWT scan with the regex's
  exact matches; a file whose path holds an address labelled by its index in a folder and as a document alike, and tree
  messages masked in a folder run; the hand-over's approval case deferred to CT-181; a named detail for an unbound
  target; the idempotency key kept as long as the consumed words and a new
  key per authorised hand-over; a store path's form; the CLI help on installation strings; the assignment and link
  lookups in one pass; time budgets of 3 s for the linearity tests) answered as decided; round 11 (the
  hand-over's routes stated alike everywhere; an e-mail address in a path never printed on any route; an approval
  beside a valid decision settled; the rules indexed against long lists; the adapter's rows in owed tense) answered as
  decided; round 12 (the hand-over rule's details kept only in
  [source](../specification/source.md#handing-over), MD-6, OA-5, DL-19, the AP-2 note, the actions-table note,
  conformance, CONTEXT, governance, ST-037, SCN-045, SCN-046, FLW-31, DEC-0149 item 12, CT-181, CT-207 and CT-208
  pointing there; long entries indexed only within the path grammar; one predicate per manifest for unchecked and
  source paths; an asset name read with the line's address rule; a note when `--kind source-package` finds no pair; the
  CLI help on Git mode; the ratio test's bound) answered as decided; round 13 (the path length guards in
  UTF-16 units for 256 code points; the masks reading an address as the tree check does; an address before a `:` in a
  path placed; an entry outside the grammar naming, reaching and removing nothing, with a tree vector; the timing tests
  at a 16 times step (32 for a folder run) with a bound of 64, each shown to fail a planted quadratic scan in
  `pathFindings`, `sourceTreeProblems` and `checkSourceFolder`; the elicitation and post-CT-181 cases in source.md; the
  pointers in conformance's service row, OA-5 and interop; AP-2's watcher rule; the CLI help's exit 0) answered as
  decided; round 14 (the hand-over's departures listed without a count and one order of checks for both
  periods; every T2 refusal naming a step; path-valued arguments read with the path rule; the include index gated on
  the grammar; a note for a file outside the grammar; a pointer member read as a word; timing tests whose planted cheap
  scans fail) answered as decided; round 15 (round 14's outside-grammar note removed: a file whose path
  is outside the grammar is simply not source, dropped in Git mode before any look at the file system and never entered
  in a walk; the elicitation case after CT-181; departures for a key conflict, an elicitation and a spent non-operator
  approval; pointers in DL-18 and interop; the `note/walk` text naming no cause; a pointer member read with the path
  rule; the JSDoc order; the tree timing test failing a planted scan on its ratio) answered as decided; round 16 read clean in all three readings, and its risk batch (the `target` form required and the only thing
  checked, an invalid decision refused before any approval, a refused non-operator approval spent for every tier, MD-3
  among the departures, a missing target named by its basename, the source kinds listed, the tree timing test at a 16
  times step) was answered as decided; round 17 (a file whose path holds a finding labelled `files[<index>]`
  in the file column too; a missing target named by its basename only in a source check, and a document whose closest
  schema is the source manifest's named by its basename; a credential in the manifest's `description` under
  `FAC-SEM-156`; a T2 caller's decision no decision in both periods, beside an `approval/1` that is then verified and
  taken; `handover-needs-estate-route` for a T2 caller before CT-181; `--kind source-package` checking a folder's pair;
  CT-207, CT-208 and the merge notes) answered as decided; round 18 (every decision bullet of the hand-over
  naming its tier; a T0 or T1 caller's mandate answered as no word; a grant covering `publish` required to reach the
  action and never its authority; `approval-reused` and `approval-invalid` naming their step; the folder note under
  `--kind source-package`; one target per run under the source kinds; a manifest that is not a regular file refused; a
  long run read per segment of a path; `urlSecret` on the tree check's own key shapes, with a vector; MD-5 and DL-18
  named; the `src/secret-shape.ts` merge note) answered as decided; round 19 (a FIFO never opened on any
  route; the tree check's own provider-key shapes, `KEY_SHAPE_SOURCES` and `URL_SECRET_VALUE`, in the vectors'
  `constants` block and apart from the shared detector; a decision AP-2 finds invalid refused before any approval; an
  outcome-unknown hand-over's word kept consumed; `FAC-SEM-142`'s exception; the grant wording; one folder per
  `--kind source-package` run; "a path that may hold a finding"; the document form's lead; the 512-unit cap; the
  CT-205, CT-207 and CT-211 notes) answered as decided; round 20 (the hand-over rule simplified to the
  one period before CT-181: a T0 or T1 caller's valid decision or accepted elicitation, everything else refused, one
  detail per invalid decision in a fixed order, a word consumed when the effect begins, an elicitation by its record
  id, a key storing only a performed result or an outcome-unknown, the approval route moved to CT-181's row; the
  `regularFile` guard on source checks only, a folder run's note for a FIFO, socket or device; one lead helper; the Git
  60-second bound; `KEY_SHAPES` derived from its sources with boundary vectors; a path's key read in the tree check's
  own shapes; the merge notes) answered as decided; round 21 (a line of millions of characters read by
  hand, never by a backtracking regex, and a source check that throws ending in one usage error; an invalid decision
  outside "everything else" and "no word"; the grant scoped to a caller presenting a delegation token, per DL-26; a
  declined elicitation; a failure after the effect began stored under its key; atomic consumption; a caller in no tier;
  `FAC-SEM-156` on the tree check's own reads; a FIFO installed manifest; a FIFO under a source path; the merge notes)
  answered as decided; round 22 (an unchecked path stated before it is counted; a folder on disk nested
  in Git mode only by a trailing `/`, a gitlink in the index or its own `.git`; a name that is not UTF-8 a usage error
  only under a folder an include reaches; the landing from one new commit; `--kind action-call` not run on a
  hand-over's calls until CT-181; a repeated key in flight; CT-214) answered as decided; round 23 (the landing as the next task, never a PR from this branch; `unknown-state`
  (`handover-in-flight`) for a repeated key in flight; one T2 code; the hand-over's arguments carrying the target's
  parts; the watcher sentence restated from FD-76, closing CT-214; the pair's pointers; a manifest's prose read without
  the whole-value bearer branch; gitlinks from a separate `--stage` call, a deleted gitlink still nested; a name that is
  not UTF-8 judged by its folder in the source as a whole; the binary probe reading only its bytes) answered as decided; round 24 (a hand-over one synchronous call, never a job; DL-26's exception; the landing's
  parent at the merge base and the gate re-run on the merge; the acceptance edit in the PR; a manifest failing its
  schema reported alone; a slot's purpose read as a package secret's and the description as prose; the second Git call
  failing as the first; a gitlink nested whatever sits there; the manifest read in Git mode whatever `.gitignore` says;
  the fault catch by the settled schema; the merge notes) answered as decided; round 25 (the landing's first step done by the coordinator and the remaining steps
  rewritten, with the operator's GitHub Support step and CT-211 as a merge condition; the in-call elicitation form; a
  gitlink decided by the index whatever sits at it or above it; the description's keys read as the tree check reads
  them; an excluded folder never walked; the timing tests as ratios to the same text at a sixteenth; the glossary's
  Source hand-over) answered as decided; round 26 (CT-211's second check on `knowledge/principles.md`; CT-215's pointer in the merge
  notes; a client that cannot show an elicitation to a person (round 27: cancels it, never declines); the in-call elicitation scoped to the source
  hand-over; `handover-declined` for the person's no; one T2 code for the word; DL-26 naming the mandate; unreadable
  names said only once Git mode is kept; the pair's fault caught; the folder pair whatever the schema answer; no-hang
  bounds widened and absolute CPU bounds dropped) answered as decided; round 27 (a client that cannot show an elicitation cancels it, never declines; interop C3.3
  leaves AP-2's elicitation for other relayed actions unchanged; a backlog row at the DEC-0150 step for a channel
  declaration's installation values; PR #628 landing back to back with this merge; a package the folder run did not
  read noted; a symlinked manifest refused; walked names read as bytes; a pair's fault named by its path; the walk's
  exclude test indexed) answered as decided; round 28 (the landing order: leases first, the acceptance edit and the merge gate on the head
  that merges, then PR #628 and the contract PR back to back; a package entry beside the manifest tested by `lstat` in
  both folder runs; a source kind never reading a package or a manifest through a link, a plain run skipping a linked
  manifest; a dangling manifest link not a file; a link at a listed path never followed; CT-215's note; agents-first
  item 8 as the rule's home) answered as decided; round 29 (three knowledge-base greps, `rules.md` section 9 included; the step 6 fallback; the
  standing permission for mechanics kept in CONTEXT.md; a source document in a folder run named by its path in the
  folder; a symbolic link read with link-outside's rule and never a licence; the exit code per package entry; the
  elicitation capability negotiated per session; the hand-over target compared as written; `FAC-SEM-156` reading with
  both detectors; a link at a listed path caught before `.git` is asked; a named manifest under `--kind source-tree`
  routed as its folder) answered as decided; round 30 (a link's `link-outside` said on line 1 in table order, once per line; link targets
  resolved literally; `FAC-SEM-156` reading the serialized form too; an unchecked link never a licence; a named
  manifest routed by `lstat`; an absent folder as `.`; a dangling link on every source route not a file; the
  `keyShaped` merge note) answered as decided; round 30's product and seam readings (the `link?` member documented; one `link-outside`
  message; the line between moving mechanics and handing over source; the three greps closing CT-211; the
  DEC-0150-first merge steps; `decision-consumed` as an effect that may have begun; a source manifest passed as a tree
  document refused; a dangling link named on every route not a file; the register leases renewed each round; C3.3's
  cancel scoped to the hand-over) answered as decided; round 31 (the act, not the artefact, needs the word, a local export none; a file with neither
  `manifest` nor `files` refused under `--kind source-tree` by the discriminator; a missing slot's refusal counted
  `unknown`; the chain through DEC-0153; link targets with `?` and `%2e` read literally; one `link-outside` on line 1
  without a scan; a dangling-link folder never "holds none") answered as decided; round 1's `humanStep: "setup"` widening was reversed in round 2 and every file it touched
  is back to `main`.

- Also in this change: the AP-2 note and the actions-table note in `service.md`, and `connections.md`'s id grammar
  guarantee.

## Open

- CT-205 (from PR #236, merged) gets the hand-over exclusion when main is merged in: see the CT-205 row edit and its
  grep in the merge notes below.
- Two changes outside source checks. First, a plain folder run (`pnpm validate <dir>`) skips a `.json` entry that
  is a FIFO, a socket or a device with a note naming it, `not a file` (before, a FIFO hung the run). Second, the help
  text: the USAGE block gains the source kinds (`--kind source-tree`, `--kind source-package`) and its exit line is
  reworded (`exit 0: no blocking problem (accepted lines may print)`). Everything else
  outside source checks is as on `origin/main`: a named target that is not a regular file is read (a piped
  `/dev/stdin` is read, `/dev/null` is "not JSON"), and a folder entry that links to a folder is an `EISDIR` usage
  error. A source check never opens a file that is not a regular file.
- CT-211: the fabric-workspace amendment owed in the merge session (see **Next task**).
- The landing's first step is done: the reviewed tree is one commit on the merge base `d1b905ee`, on
  `agent/ct194-source-manifest-v2-20261104`, and the review branch's remote ref is deleted. GitHub may still keep
  unreachable commits and cached views of the review branch; asking GitHub to remove them is the operator's step
  (GitHub Support), a human gate. The remaining steps are under **Next task**.
- CT-214 is done in round 23: `service.md`'s watcher sentence restated from Fabric Dashboards' FD-76 (15 minutes,
  unavailability only, setup entries left out).
- CT-212: `src/session-handoff.ts` and `src/connections.ts` keep the quadratic `JWT_SHAPE` regex on inputs that are
  bounded; a later caller with a long input takes `jwtSpans` and `hasJwt`.
- Outside a source check, a named file that exists but cannot be read is still named by its full path (`cannot read
  <path>: EACCES`), unchanged from `origin/main`; only a source check names it by its basename.
- The merge: the next round of readings, then the status line rewritten as DEC-0147's is, CT-194 to `done`. PR #235
  (DEC-0148) also moves both next-free markers; see the merge order under **Next task**. `AGENTS.md`'s Commands table is also edited by
  `agent/template-parity-20261103` (PR #236): whichever of the two lands second resolves it.
- CT-207 (the adapter: the manifest in its templates, `pack`, the check on the manifest and the vectors with every
  kind, `.fabric-source-ignore` retired (plain source to `unchecked` with its reason, a credential file by its name to
  `exclude` or the instance, a glob to explicit paths or a folder entry, a nested repository to `exclude` and checked in
  its own tree under its own manifest), `export`, `import`, its hand-over action
  refusing a mandate, LC-09's `config` slot, the start without the instance; the `straße` casefold difference) and
  CT-208 (Fabric's "give as source", its `relayed` gate and mandate refusal, and its user scenario).

## Decisions made in this run

- The manifest is always source, so it travels with the source export whatever `include` says.
- The tree check keeps its own unbounded provider-key shapes (`KEY_SHAPE_SOURCES`, from which `KEY_SHAPES` is derived)
  and URL pattern (`URL_SECRET_VALUE`), apart from the shared detector, for parity with the adapter's source check; it
  reads a path's, a message word's and the manifest description's keys with them too. A slot's name and purpose are
  read as `FAC-SEM-065` reads a package secret's (the shared `secretValue`), so `pack` copies a purpose unchanged and it
  packs cleanly.
- The hand-over rule specifies one period, until a service pins a revision carrying CT-181; the approval route is
  CT-181's.
- A path with a `.git` segment anywhere is never source, and listing one is `FAC-SEM-157`.
- `home-path` and `credential` read the forms of the adapter's `v0.58.0` check (`HOME_PATHS`, `NEUTRAL_HOMES`,
  `_secret_in`, `_provider_keys`, `_credential`, `SYNTHETIC`), kept equal; every credential and home line and path of
  the vectors in a file the check reads was run against the adapter's own functions at that tag and agrees.
  Credential files are `pack`'s list plus `*.token` and `*.credential`.
- Lines are split at LF with a trailing CR dropped, as the adapter does; instance strings match under Unicode simple
  case folding, where the adapter's full `casefold` is a superset (`straße` and `STRASSE`), recorded in CT-207.
- A file under `unchecked` is still read by its path (home folder, installation string, credential), never by its
  content; it counts for `missing` and `no-license`. A nested repository is passed to the pure check as a file
  marked `nestedRepository: true`.
- Links are followed in Markdown files only. A warning fixture lists `FAC-SEM-159` under `accepted`, beside `expect`.
- A hand-over `target` past 200 characters is `sha256:` and the hex SHA-256 of `<agent>@<commit>-><recipient>`,
  which still binds all three, rather than a target that drops the recipient.
- More missing required slots than `degraded[]`'s 64 entries end in one `setup: true` entry with `source`
  `fabric.source.json#slots`, outside both the slot and the connection id grammar; the failures of filled endpoints
  stay first, then the missing slots in the manifest's order, up to 63 entries in all.
- A finding-holding name in a manifest message or a problem's path is masked, a credential across a space included;
  an e-mail address in a path is no finding, and its file is labelled `files[<index>]`.
- E-mail addresses are read from each `@` outward (local part at most 64), and the URL and assignment rules run only on
  lines holding `://`, `:` or `=`, so a 1 MB one-line file checks in well under a second.

## Checks actually run

Round 30's fixes were gated on head `9f5e73db` of `agent/ct194-source-manifest-v2-20261104` (the commit before this
note), each exit code read on its own, under the session's lock for heavy runs (the 15-minute load was under 45 when
the wait ended and 58.93 when the lock came free): `tsc --noEmit -p .` (exit 0); `pnpm vitest run --coverage` (exit 0:
113 files, 10151 passed, 3 skipped, the whole suite; branches 98.93 % over the set, every per-file floor met); `python3
docs/ux/lint.py` (exit 0); `pnpm run docs:check` (exit 0, 0 errors); `ORG_INDEX=... pnpm privacy:check` (exit 0, 0
findings); `pnpm exec tsx tools/vectors/run.ts` (exit 0, 29 files match); no U+2014 in the added lines. A run on
`458c930d` failed only the `src/source-rules.ts` floor (99.83 %); `9f5e73db` adds a link vector with `.` and empty
segments and lowers no floor.

## Next task

The landing continues on `agent/ct194-source-manifest-v2-20261104` (step 1 is done: one commit with the reviewed tree
on the merge base `d1b905ee`, the review branch's remote ref deleted; never push the review branch again). The
remaining steps, in order:

1. Take fresh agent-sync leases for these files before anything else: `docs/DECISIONS.md`,
   `docs/specification/conformance.md` and `docs/backlog.md` (re-measure at landing whether origin holds any). Renew
   them at each reading round and immediately before steps 5 and 6, re-acquiring any that lapsed; before the step 5
   commit, `git ls-remote origin 'refs/agent-sync/leases/*'` must list this run's leases on the three files.
2. Merge the current `origin/main` (with #236, CT-215 and CT-216; re-measure its head at landing) into the fresh branch
   as the merge notes below say, refreshing the sibling heads.
3. Re-run the full gate on that merge and cite its commit in this handoff. Open the PR from the fresh branch and
   dispatch the CI workflow once on it (`gh workflow run ci.yml --ref agent/ct194-source-manifest-v2-20261104`); read
   every matrix job (ubuntu-latest on Node 22 and 24, windows-latest and macos-latest on Node 24, macos since #238):
   the Linux-only non-UTF-8 test and the Windows-only `git.exe` test have never run, and the ubuntu job's coverage line
   for `src/validate-cli.ts` (99.44 % against its 99.4 floor on macOS) must be read too.
4. Run the next rounds of the readings (unit, seam, product) on that merge until two clean rounds; the chain with
   DEC-0150 and DEC-0151 is re-gated after they refresh (DEC-0151 now reads their `sk-` test keys).
5. Make the acceptance edit on the PR branch, as DEC-0147 did (DEC-0149's status line, CT-194 done, this handoff's
   status and the `docs/handoffs/README.md` row); then run the merge gate (`pnpm run check`, each part's exit code
   read) on that head, with its output in the PR. That head is the one that merges; nothing merges before this step.
6. Merge the knowledge base's PR #628 (CT-211's amendment), fetch the knowledge base checkout (`git fetch origin`), and
   run its three greps on the knowledge base's main (`git show origin/main:knowledge/agents-first.md | grep -n 'source
   hand-over'`, the same for `knowledge/principles.md` and `knowledge/rules.md`; at PR #628's head they print 4, 3 and
   2 lines), then merge the contract PR straight after, in the same
   landing session (PR #628's links point at `source.md#handing-over` on main). If main moved after step 5, merge it and
   re-run the merge gate before merging PR #628. If the contract PR cannot merge in that session, do not merge PR #628
   (or revert it at once) and record the wait.
7. A human gate: asking GitHub to remove the review branch's unreachable commits and their cached views is the
   operator's (GitHub Support).

Right after the merge: close CT-211 with the three greps' outputs; update fabric-workspace's RM-36 row (rewriting its "Waiting on" line, which still names the
deleted review branch) and its knowledge page for the agent source (`knowledge/`),
publish with `node scripts/workspace.mjs sync` from a Fabric checkout, post DEC-0149 to threads `21ac4057` and
`0a8776f2` with CT-207 and CT-208, and file the Fabric Dashboards request on its attention and degraded counts of agents
whose entries are all setup states as a tracked row on their side, recording its id in CT-208.

At their next re-pin, the consumers that vendor a protocol table (a
private product's `src/contract/vendor/protocol-revisions.ts`, a deployment template's
`src/fabric/fabric-protocols.mjs`, another server's `src/fabric/fabric-protocols.mjs`) add `fabric-source`; Fabric
Dashboards' sample service (`fabric_protocols.py`) is updated at its re-sync, or recorded as not held equal to the
register.

PR #236 is merged (main has moved since; its Test row in `AGENTS.md` now says Linux, Windows and macOS). The chain of
the open branches that touch the same registers is PR #235 (DEC-0148), DEC-0149 (this branch), then
`origin/agent/channel-agent-ext-v3-20261104` (DEC-0150; earlier names without `-v3` are gone) and
`origin/agent/sqd-fields-20261104` (DEC-0151), then DEC-0152 (head `d760f756` when written: `docs/DECISIONS.md`,
`docs/specification/conformance.md`, `docs/DOCMAP.md`, `docs/backlog.md`, the handoffs index) and DEC-0153 (head
`a0e7b53d` when written: `FAC-SEM-166` and `FAC-SEM-167`, two schemas, `src/semantic-kinds.ts`, the rule-tolerance and
positive-sweep tests, the `vitest.config.ts` include and floor, the vectors runner). Every head here is re-measured at
landing. DEC-0150 and DEC-0151 reserved DEC-0150, DEC-0151 and FAC-SEM-162 to FAC-SEM-165.
The channel-agent branch adds `schemas/service-channel-agent-extension.schema.json` and edits `src/semantic-rules.ts`,
`src/protocol-revisions.ts`, `vitest.config.ts`, `fixtures/catalogue.json` and `src/secret-shape.ts` (`rawValues` only);
the sqd-fields branch edits `schemas/support-quality-daily.schema.json` but adds no schema, and edits
`fixtures/catalogue.json`, `src/secret-shape.ts` and `src/session-handoff.ts`. What a textual merge gets wrong, or gets wrong silently:

- The schema count in `test/schema-compilation.test.ts`: each side writes its own count (148 on more than one branch),
  so a merge reads wrong silently; whichever lands last sets it by hand to the full count, 150 with DEC-0149, DEC-0150
  and DEC-0153 each adding schemas (re-count the files under `schemas/` then).
- Where DEC-0150 and DEC-0151 meet each other, `docs/DOCMAP.md` and `docs/specification/support-quality.md` conflict:
  follow DEC-0151's meeting list. Keep DEC-0151's thresholds line and drop the "Not decided here" bullet; in DOCMAP,
  DEC-0151's support-quality row first, then DEC-0150's channel-agent row. Check: `grep -c 'DEC-0151 (in progress)
  lands' docs/specification/support-quality.md` prints 0 on the merged tree. The file lists in these notes are
  refreshed at landing against the siblings' heads then.
- `docs/backlog.md` (against all four siblings) and `docs/handoffs/README.md` (against DEC-0150 and DEC-0151)
  conflict as appends at the tail: keep both sides; the merged backlog tail is kept in id order, whatever main holds at the merge
  (re-measure at landing; CT-200 to CT-218 on main's head when this was written, #235 bringing CT-202 and CT-203); the handoffs index is newest first, so at each merge the later-landing branch's row goes above.
  DEC-0151's edited files also include `src/connections.ts` (a comment) and `docs/specification/conformance.md` (the
  secret-shape reference row). DEC-0150's small edits to `src/validate-cli.ts`
  and `test/validate-cli.test.ts` merge cleanly beside this branch's.
- `vitest.config.ts`: `include` takes the union of both lists, and `thresholds` keeps `src/validator.ts`,
  `src/source-rules.ts` and `src/channel-agent.ts` at 100 (a threshold key that matches no included file passes
  silently).
- `fixtures/catalogue.json`: all three branches add entries; add the comma where they meet.
- `docs/specification/conformance.md`: keep this branch's actions row and append the channel row after it. In the
  reserved-codes paragraph keep this branch's `FAC-SEM-161` sentence, add DEC-0150's sentence on `FAC-SEM-162` to
  `FAC-SEM-165` (receipts SEM-0162 to SEM-0165), and drop the sentence saying codes are reserved by open branches;
  check: `grep -n 'reserved by open branches' docs/specification/conformance.md` prints nothing.
- `docs/DECISIONS.md`: DEC-0148 through DEC-0153 in id order, a blank line before each heading (markdownlint MD022).
  The rule register: `FAC-SEM-155`, then `FAC-SEM-156` to `FAC-SEM-160`, then the `FAC-SEM-161` note, then
  `FAC-SEM-162` to `FAC-SEM-167` (docs-check G-13).
- The next-free markers (`docs/DECISIONS.md`, the register in `conformance.md`) are written by whichever lands later
  from the CAS refs at merge time, never from a fixed value: `git ls-remote origin 'refs/agent-sync/ids/*'`, then
  `git cat-file -p <sha>` for each.
- `AGENTS.md` against main (PR #236 merged): keep this branch's Check row and #236's MCP row, which removes an em dash.
  #236 landed first, so this branch adds to CT-205's row, when main is merged in, that a source hand-over is never
  covered by a task-wide mandate (written in the backlog row as `[source](specification/source.md#handing-over)`, the
  backlog's own link form); check with `grep '^| CT-205 '
  docs/backlog.md | grep -c 'source hand-over'`, which prints 1 after that edit. CT-211 carries the same line for the
  knowledge base. CT-215 (on main) gets the same pointer in its part (c): a source hand-over is never covered by a
  relayed mandate and needs the operator's word per act (linked as `specification/source.md#handing-over` in the row).
  A client with no person at it cancels a hand-over elicitation (or did not declare the elicitation capability for its
  session, which MCP negotiates at `initialize`) and never
  accepts or declines it, so a launched session takes the hand-over only as a decision with the exact target; it leaves
  a job's input request unanswered (C3.3 reads a cancel there as the person's no). What a cancelled in-call elicitation
  under AP-2 means for an ordinary relayed action is left open in CT-215's own decision; AP-2 is not changed here.
  Under (b), carry as an open item what a headless launched session does with any job's `input_required`. A relaunched
  session carries the request's idempotency key under the same caller identity.
  Check with `grep '^| CT-215 ' docs/backlog.md | grep -c 'source hand-over'`, which prints 1 after the merge.
- If DEC-0150 lands before this branch, whichever of the two lands second switches `src/channel-agent.ts` `keyShaped`
  from `JWT_SHAPE.test` to `hasJwt` (this branch brings `hasJwt`); CT-212 stays unchanged. If DEC-0150 is on main at
  step 2, do what its handoff gives the second lander: `keyShaped` to `hasJwt`, rewrite DEC-0150's "in progress"
  sentence about DEC-0149's `sk-` sentence, and keep SCN-054 and SCN-055 with its grep.
- At landing, add to CT-218's row: deploying an agent's tree to the operator's own placement (the local or the cloud
  form) is not a source hand-over, since there is no recipient outside the estate.
- `AGENTS.md`: the Check row's exit wording follows the README ("exit 0 when there is no blocking problem (accepted
  lines may print)"); keep it when main's rows are merged in.
- At the DEC-0150 step, `docs/ux/screens.md` SCR-03 keeps "SCN-001, SCN-002, SCN-054, SCN-055", and `CONTEXT.md` and
  `docs/ux/scenarios.md` change on both sides: keep both.
- At the DEC-0150 step, file a backlog row (the next free CT id in the backlog at that merge) on how a channel
  declaration's installation-valued members (`tickets.token_slot`'s vault project and env, `evals.spend_record`, the
  per-project entries) relate to source slots: the token slot's name is a `secret` slot; the vault project, the env and
  the spend record are `config` slots or live in the descriptor or the well-known answer; or the declaration is
  instance data kept out of the source.
- The adapter re-vendors the shared detector before or with its `pack` writing `secrets[]` from slots (CT-207); until
  then a slot purpose `FAC-SEM-156` accepts, such as `sk-learn-experiments-2026`, is refused by its pack, which fails
  safe.
- `src/secret-shape.ts` conflicts textually with DEC-0151 (`origin/agent/sqd-fields-20261104`). The resolution: this
  branch's JWT helpers (`jwtSpans`, `hasJwt`), then DEC-0151's doc comment and `SECRET_VALUE` line as pushed (being
  rewritten as a portable consuming-group boundary plus a strength rule for `sk-`). Its copy in `src/session-handoff.ts`
  follows DEC-0151. Nothing else changes in this branch's tests at that merge: the tree check keeps its own unbounded
  provider-key shapes (`KEY_SHAPE_SOURCES`, written out in `src/source-rules.ts`) and its URL rule's pattern
  (`URL_SECRET_VALUE`, built from them), both in the `constants` block of `fixtures/vectors/source-tree.json` and held
  equal to it by test; no test here reads `SECRET_VALUE.source`, and the `FAC-SEM-156` fixture's purpose
  (`sk-example-Not-a-key-0000-xyz`) is a credential under both detectors. Since round 29 `FAC-SEM-156` reads a slot's
  name and purpose with the shared `secretValue` and the tree check's own reading, so it refuses a purpose like
  `sk-learn-experiments-2026` before and after DEC-0151; DEC-0151 moves only `FAC-SEM-065`, `FAC-SEM-156` stays a
  superset, and the parity test is an implication that holds either way. DEC-0151's instruction to bound the tree check's key shapes is
  withdrawn; the coordinator tells that branch.
- The chain #235, DEC-0149, DEC-0150, DEC-0151 (with #236, now merged) was gated green at review-branch heads in
  rounds 19 and 21, and the round 26 seam reading merged it again green; re-check it at the merged heads before
  landing, re-measured then.
