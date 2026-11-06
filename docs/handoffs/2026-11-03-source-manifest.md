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
  without state passing); the source export as one new commit by `Fabric source export <source-export@fabric.invalid>`
  whose only parent, if any, is the earlier export commit the recipient holds, no commit from the home, no gitlink and
  no test run as a condition; the hand-over as `publish` (P3), a `relayed` action
  taken on the operator's word for that act, never by a mandate, as
  [source](../specification/source.md#handing-over) specifies; import by
  source paths; starting without the instance, every missing slot a setup state, a capability answering with its
  tool's own error.
- `schemas/fabric-source.schema.json`, `src/source-rules.ts` (100 % of its branches), the kinds `source-manifest`,
  `source-tree`, `source-package`, `fabric-source/1` in the protocol register; `pnpm --silent validate <dir> --kind
  source-tree` (Git mode with Git's location variables removed and no read through a link, a walk otherwise with a note
  saying why, folder-relative output that never repeats a found value) and the pair in `pnpm validate <dir>`;
  `fixtures/vectors/source-tree.json` (90 tree cases, 32 patch cases and a `constants` block written from the module's
  exports) from `tools/vectors/source-tree.ts`;
  2 positive and 19 negative schema fixtures, 27 semantic fixtures.
- [source](../specification/source.md) (new), the register (`FAC-SEM-156` to `FAC-SEM-160`; next free `FAC-SEM-162` on this branch when this line was written, the landed marker set at the acceptance edit;
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
  in Git mode solely by a trailing `/`, a gitlink in the index or its own `.git`; a name that is not UTF-8 a usage error
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
  without a scan; a dangling-link folder never "holds none"); round 31's seam notes (a test that fails on a coverage floor no include reaches; the task lease CT-194 for the register commits; the CAS values and schema count as written) answered as decided; round 32 (a folder named through a
  link to a real folder holds none again, decided by `stat` with links followed, while an absent folder or a dangling
  link reads `cannot read .: ENOENT`; the usage error is a JSON object with neither member, a JSON value that is no
  object staying `FAC-SEM-000`, exit 1) answered as decided; round 32's seam note (step 2 closes with the next-free
  markers checked against the counters; the backlog tail re-measured to CT-220) answered as decided; round 32's product reading (DEC-0151 and DEC-0153 marked
  in progress with a merge note; the setup answer scoped to the agent's own count, its missing machine marker left
  open; the estate boundary of a source hand-over in the line paragraph and `CONTEXT.md`; SCN-054's refused tree
  document; CT-211's amendment scoped to a source hand-over; no format check; the `.: ENOENT` sentence scoped to a
  named manifest's folder) answered as decided; round 33 (a folder run with another source kind prints the folder
  resolved to an absolute path; item 12 names the estate boundary and keeps the standing permission; an
  organization's repository is another owner's, so a push into it is a hand-over; an identifier read as a key is
  renamed or listed under `unchecked`, the alias rule being DEC-0151's open question; a file's named manifest reads
  ENOTDIR; CT-211's greps cover the estate boundary; PR #628 at `c3daf91c` carrying the knowledge base's main, where
  the rule's home is agents-first item 9, checked by `git show c3daf91c:knowledge/<page>.md`: 4, 3 and 2 lines of
  `source hand-over`, 1 of `own estate` on each page) answered as decided; round 33's seam reading (the knowledge-base
  item named by number and title, with a grep of its title on the PR head; DEC-0153's wording annotated or edited by its
  state; the task lease taken per register commit and released after the push) answered as decided; round 34 (PR #628
  at `d04df3ff` with the knowledge base's main merged in again, re-measured at step 6; a registry alias renamed only by
  the registry's owner, the source not exported until then, and `unchecked` no remedy; the estate boundary read as the
  places no one outside the operator can read, with access given to another person a hand-over; the conformance row
  pointing to the hand-over's home; the organization sentence citing agents-first item 9; a relative folder printed
  absolute under `--kind source-package`, tested; the folder-run sentence split; `--kind source-manifest` running only
  `FAC-SEM-156` and `FAC-SEM-157`) answered as decided; round 35 (not clean: the product tier found SCN-054 teaching
  `unchecked` as a fix for a finding, and this handoff saying a purpose that `FAC-SEM-156` lets through is refused by the
  adapter's pack) answered as decided: SCN-054's step 3 limits `unchecked` to synthetic test vectors and a licence's
  holder line, never to pass a credential finding, and an alternate path keeps a registry alias blocking until the
  registry's owner renames it or the entry leaves the source (left out, or kept in the instance); the `FAC-SEM-156`
  sentence restated (both detectors, so no purpose it passes is refused by a pack vendoring this branch's detector;
  the re-vendoring owed by CT-207); the hand-over's lists name a public repository or one another owner holds (here in
  `source.md` and `CONTEXT.md`, and in PR #628's agents-first item 9, principles section 7 and rules section 9);
  DEC-0149 item 12 and principles section 7 carry the organization sentence, item 9 the standing permission;
  the CT-218 note carries the three conditions and the organization clause in the backlog's link form, with its
  grep; the registry-alias paragraph gives the second remedy (the identifier kept out of the source); a source-kind
  folder run's unreadable or empty folder named by its absolute path (tested); `--kind source-manifest`'s scope
  pinned by a test and its `FAC-SEM-000`; the adapter kit's protocol tables at its next re-vendor; and, from DEC-0151's
  round-16 seam reading, the `it.each` "reads %s in time linear in its lists" given its siblings' 180 000 ms timeout,
  its assertion unchanged; round 36 (not clean: the product tier found no home-repository carve-out, so every
  ordinary push and release of an agent whose home is an organization's or a public repository read as a per-act
  hand-over; its seam reading ended on an API error, and round 37's seam reading covers the seam) answered as the
  coordinator decided: a hand-over is the source reaching a place or a person it was not at, the repository where the
  agent's owner keeps and develops its source is its home and the owner's commits, branches and releases there are
  none, and a personal agent's source moving into an organization's or a public repository stays one (`source.md`'s
  line paragraph, `CONTEXT.md`, DEC-0149 item 12, and PR #628's agents-first item 9 with principles section 7 and rules
  section 9 saying the rule reaches every agent with that carve-out); item 9's list is the contract's (a transfer added,
  the bare "another owner" dropped); the CT-218 note says serving the running agent to a team gives no one the tree,
  while a placement whose tree another person or the team can read is a hand-over; a CT row for `unchecked` covering a
  credential finding is filed at landing; the source-manifest scope test also runs `[]` in a folder and `7` as a named
  file (each `FAC-SEM-000`, exit 1); the absolute-path test also runs a top folder it cannot read under both kinds and
  an empty folder under `source-package`; `source.md`'s "(or no document it can tell)" is dropped (that line needs no
  `--kind`); round 37 (not clean: the product tier found `governance-and-roles.md` glossing a source hand-over as an
  exported source handed to anyone, and the unit tier a security hole: `.git` and `exclude` matched case-sensitively,
  so on a case-insensitive file system `patchPathsAllowed` let `.GIT/hooks/post-checkout` and `app/PRIVATE/x` past an
  excluded `app/private/`, and `src/.GIT/config`, `src/.git /config`, `src/.git./config` and `src/GIT~1/config` read as
  source) answered as decided: `isDotGitSegment` reads `.git` as Git's `is_hfs_dotgit` and `is_ntfs_dotgit` do (ASCII
  case folding, the HFS+ ignorable code points removed, trailing dots and spaces dropped, `GIT~1`), so `FAC-SEM-157`
  reports such an include and a walk never enters such a folder; `patchPathsAllowed` also refuses a path an `exclude`
  entry names under ASCII case folding; paths compare in Unicode NFC on both sides (Git's NFC list and a walk's names
  as stored), reads and messages keeping the stored name; `excludedFolderTest` leaves an include entry outside the
  grammar out before listing its folders; four patch vectors and two tree vectors; direct tests of `jwtSpans` and
  `hasJwt` in a new `test/secret-shape.test.ts`; the governance gloss, `source.md`, `CONTEXT.md`, `package.md` and
  DEC-0149 items 4, 12 and 13 carry the coordinator's round-37 decisions (below); the CT-218 note restated to them;
  a landing step files the `unchecked` row; the chain figures re-measured for DEC-0153's OD-9; round 38 (not clean:
  the unit tier proved with `git apply` on APFS that `patchPathsAllowed` folded ASCII before NFC, so the Kelvin sign in
  `app/Keys/k` passed an excluded `app/keys/`, and that the ASCII fold let a long s, a sharp s, a final sigma, `É` and
  the Angstrom sign reach an excluded folder; the product tier passed with risks) answered as decided: one fold per
  segment (`foldSegment`: the HFS+ ignorable code points removed, NFC, upper then lower case, NFC, trailing dots and
  spaces dropped) on both sides, for patches and for `exclude` at export (fails closed), an 8.3 short-name segment
  refused in a patch when any `exclude` entry exists, a patch checked against the receiver's current manifest and a
  patch to `fabric.source.json` held for the owner's word, the warning `unused-exclude` (FAC-SEM-159) with the
  checker's `lstat` of each entry, a walk test over a `src/.git` folder with a trailing space and `src/GIT~1`, four patch vectors and two tree
  vectors, then a third from the seam reading (71 and 10 in all), and the product decisions below; from the seam reading, a file an `exclude` entry names only once folded is not
  source in the source test, the walk and Git mode and gets the warning `excluded-by-fold` naming the entry (a tree
  vector with `src/GENERATED/x.ts` under `src/generated/`, and a test over a committed repository holding
  `src/Private/notes.md` under `src/private/`), the merge note for `test/secret-shape.test.ts`, the conformance row's
  pointer to `source.md#import`, CT-207's clause and the PR #235 refresh before landing step 2; `git~N` beyond `git~1` is not read as `.git`, as Git's
  own `is_ntfs_dotgit` reads only `git~1`, and a patch refuses any short-name segment once an exclude exists; round 39 (not clean: the
  unit tier proved with `git apply` on APFS that the capital sharp s `ẞ` slipped past an excluded `app/passwords/`,
  because upper case first leaves it whole, and that short names with an extension (`PRIVAT~1.MD`) passed;
  `unused-exclude` was said of an entry naming a link it keeps out and of an entry that leaves files out only under
  the fold; the product tier found the opt-in sentence freeing an agent without a manifest from the hand-over rule,
  two answers for the owner's own patch to the manifest, and SCN-054 missing the two new warnings) answered as the
  coordinator decided: `foldSegment` is NFC, lower, upper and lower case, NFC (idempotent over every code point and
  keeping every case-mapping pair together, tested; Node's ICU at Unicode 17.0, `FOLD_UNICODE`, with the case pairs in
  the vectors' `FOLD_PAIRS` for CT-207's port), any segment with `~` followed by a digit refused in a patch once an
  exclude exists, the checker matching each exclude segment under the fold against the names its folder holds (a last
  segment that is a link counts, an intermediate link never) and never calling unused an entry an `excluded-by-fold`
  line names, the opt-in scope (the hand-over rule binds every agent's source), the manifest patch held whoever sends
  it, SCN-054's two warnings, and the product decisions below; and, from round 39's seam reading: a read file's
  `files[<index>]` the same in Git mode and in a walk (a path left out only under the fold, listed by Git mode, indexed after
  every read file and always named `files[<index>]`, tested with a home path committed and walked), `unused-exclude`
  verified on a case-sensitive APFS disk image (created, tested in Git mode and in a walk, detached and deleted in
  scratch: `exclude` `src/Secrets/` over `src/secrets/k.ts` gives `excluded-by-fold` only) and its test held to exact
  lines, the manifest hold named in CT-207 and source.md's conformance row, `FAC-SEM-157` and `folderInSource` reading
  `exclude` folded (tests for `SRC/gen/` and for an include under `src/Cache/`), the fold described as coded (it joins
  the dotless `ı` with `i` and `I`), `listed` in the input signature, `SEMANTIC_KINDS` and the vectors' about, and PR #628
  merged with the knowledge base's main again; vectors 74 tree and 13 patch cases; round 40 (not clean: the unit tier
  found `ᾼ͂` and `ᾷ`, one inode on APFS, folding apart, since case mappings over NFC text split a letter that carries
  U+0345 and another mark, so a patch to `app/ᾼ͂/token.txt` passed an excluded `app/ᾷ/` and the export read
  `app/ᾼ͂/notes.md`) answered as the coordinator decided: canonical caseless matching, NFD before the case mappings,
  with a property test over marked sequences against an NFD and case-mapping oracle (the round-39 fold split 3 groups of
  it), the measured pairs pinned, multi-code-point `FOLD_PAIRS` and patch and tree vectors; the comments, source.md and
  SCN-054 saying which fold-only paths each mode lists (a walk a fold-only file, Git mode also the paths under a
  fold-excluded folder), with a test; a folder entry whose last segment is a file is unused, tested; and the product
  decisions below; vectors 75 tree and 15 patch cases; round 41 (not clean, product tier: a push carries history,
  the history gate was named after tools that cannot run it, `conformance.md` still described the fold as Unicode's,
  and rules section 9 contradicted item 9 on what is already public) answered as the coordinator decided: a hand-over
  by push or by file carries a source export, never a home commit, and any other commit pushed outside the home or any
  act on the whole repository first passes the history gate, then defined in source.md and owed by CT-207 and CT-208
  (withdrawn in round 42: such an act on a personal agent is not done); the fold described as coded, in the code's order, with a `FOLD_INPUTS` entry and a patch
  case where an ignorable code point sits between a letter and its mark; the knowledge base's item 5, item 9,
  principles section 7 and rules section 9 aligned; the decisions below; the seam's notes (a comment in
  `validate-cli.ts`, the vectors' comment moved); and from round 41's seam reading: an exclude entry without `/` counts
  as present only over a file, a link or a nested repository, never a plain folder whose files it leaves in (tested in
  Git mode and in a walk, `listed` worded alike in source.md and the vectors' about, and a vector), the
  installation-valued row confirmed rather than filed here, the backlog tail at CT-221, the glossary's already-public
  condition and "the owner's own act" everywhere, DEC-0153's `src/validate-cli.ts` hint in the sibling list, and
  landing step 6 pairing PR #628 only with a contract head of the same round; vectors 76 tree and 16 patch cases, 26
  `FOLD_PAIRS`; round 42 (not clean: the history gate's scope and the knowledge base's item 5; from round 41's unit
  reading, HFS+ joining Georgian Asomtavruli with Mkhedruli, which the fold split, and a folder entry over a link
  counted as present) answered as the coordinator decided: the history gate is withdrawn, a hand-over by push or by file
  carries a source export, never another commit, and an act on the whole repository of a personal agent is not done
  (an organization's acts on its own are its own, except making a private agent's source public); the already-public
  carve-out reaches any public place and access to a public home is none; a source file served verbatim or an
  unminified bundle is the source tree served; the permission reads "rewriting" only; item 5 no longer lists a source
  hand-over among the human gates; the fold maps Nuskhuri onto Mkhedruli after NFC (a test over U+10A0 to U+10C5,
  `FOLD_PAIRS` and two patch vectors); a folder entry over a link is `unused-exclude`, its message saying to write it
  without `/` (tested); and from round 42's unit and seam readings: an exclude entry without `/` leaves out everything
  beneath that name (export and patch, a test and a vector), a gitlink the index records counts as present for
  `unused-exclude` with or without its folder (Git mode, tested both ways, and `nested-repository` without the entry),
  candidates ordered by their paths' NFC forms so a name stored in NFD keeps one `files[<index>]` in both modes
  (tested), the grammar read on the NFC form (`FAC-SEM-157`'s own message, such a path no source, tested), the
  `unused-exclude` message worded for an entry without `/` over a plain folder (tested), and DEC-0149 item 13 naming
  the ignorable code points removed first; `presentWithoutLink` still reads per entry (round 42's optional index not
  taken); with everything beneath an entry without `/` left out, such an entry over a plain folder is used (its
  folder's files are left out and never read, tested in Git mode and in a walk), which replaces round 41's seam
  reading and the round-42 seam wording of its message (the message now says an entry without `/` names a file, a link
  or a folder and everything beneath that name); vectors 76 tree and 19 patch cases, 30 `FOLD_PAIRS`; round 43 (not
  clean: source.md still gave a word for whole-repository acts round 42 made not done, and the glossary's team-serving
  clause) answered as the coordinator decided: the target names the repository only for an organization agent's
  private home made public or given new readers outside the organization, and any other person's access to a personal
  agent's private home is an act on its whole repository, not done; the glossary's serving and team clauses aligned;
  the route list open ("among others"), with copied content and repositories readable by another person; a later export
  taking the earlier export commit as its parent; an organization's first public release and new outside readers
  taking the word; serving named per commit and audience; a patch beneath a symbolic link refused at apply time; the
  stated word outside a service's action (knowledge base item 9); OA-5's clause led by "not a human step"; export dates
  with their time zone; round 45 (not clean: a nested repository read without NFC, stale wording in DEC-0149, the
  backlog and SCN-054, the elicitation's target, and an organization's later public release) answered as decided: `nestedTest`
  and the CLI's gitlink and `listed` reads apply the grammar in NFC (tests: a nested folder NFC lengthens past the
  grammar is no nested repository in either mode, with the same lines); `FAC-SEM-157` says an include beneath an
  exclude entry once, on the include; the schema's path description names the bare exclude entry; and the round's
  decisions below, with every withdrawn phrase grepped (counts in the checks); round 46 (not clean: the grammar's readers, where `foldOnlyExcludeTest` skipped NFC and printed
  `excluded-by-fold` in Git mode only, and an organization's later public release stated for one route only) answered as
  decided: one `inGrammar` helper in every reader (a table test over an NFC-long path, an NFC-short one and a control,
  and a Git-mode and walk CLI test), an entry outside the grammar left to the schema in `FAC-SEM-157` and never called
  unused, the index sentence scoped to Git mode and its no-include-file fallback walk, the release rule and its two
  exceptions stated once, a package's target, the receipt's recipient, the home-path wording, and the merge note for
  DEC-0153's `foldDir`; round 47 (not clean: paths stored in NFD, the `binaries` and `missing` loops, an organization's later public release, a private mirror) answered as decided: `inGrammar` holds as written, in NFC and in NFD, with no segment made only of dots, spaces and code points HFS+ ignores (a table test, a CLI test over three segments of 80 `é` stored in NFD in Git mode, without git and in a folder Git refuses, alone and as a nested repository, and a patch test), the `binaries` and `missing` loops skip an entry outside the grammar, `FAC-SEM-157` names the cause, vectors pin an exclude entry outside the grammar as never unused, `HFS_IGNORABLE` exported for DEC-0153, and the round's decisions below; round 48 (not clean: the lead's readers, the
  grammar's `FAC-SEM-157` statement, CT-194's visibility sentence; exclude fails closed; the CT-109 register is
  DEC-0149's landing step) answered as decided: an exclude entry outside the grammar removes its widest reading
  (`foldedList` with `widest`, tests over `isSourcePath`, `patchPathsAllowed`, the walk's folder tests and a vector),
  `FAC-SEM-157` said in a tree document too (the folder run keeps saying it once, on `fabric.source.json`), the global
  `HFS_IGNORABLE` private again with `HFS_IGNORABLE_CHAR` and `stripHfsIgnorable` exported, the fourth home-path
  boundary named in `src/activity-rules.ts`, activity.md and CT-109's row, the DEC-0150 second-lander steps written
  out, and the round's decisions below; round 49 (not clean: the lead's routes still said "another person";
  vendored files and binaries; boundary copies at DEC-0149's landing; widest reading made literal) answered as decided:
  `widestReading` gives the union of the readings and `FAC-SEM-157`'s cause and effect from the same segment, an
  include equal to or under what it removes said once (tests, two patch vectors), every route reads "anyone who could
  not already read the home", the manifest and package rules scoped to a hand-over or a public release, every
  boundary copy counts four (devices.md, proposals.md, `src/proposal-rules.ts`, the device-common `$comment`), and the
  stale facts re-measured; round 50 (not clean: the widest reading stopped at the first segment; devices.md's
  strictest claim; the chain still named #235 as open) answered as decided: `widestReading` walks every segment to the
  folder the shallowest reading reaches (tests and four patch vectors), the effect message says one folder, the
  PATH-shim git tests carry a 60-second timeout, devices.md names the `%5CUsers%5C<name>` form with a probe, the chain
  and step 2 rewritten against main, the access, copied-content, README and CT-109 wording, the count-free `$comment`
  equal to DEC-0153's, and the gloss note; round 51 (not clean: devices.md still ranked the boundaries; the Done
  vector count) answered as decided: devices.md says the four boundaries read different forms, the lead's filter bound
  to its place condition in source.md, `CONTEXT.md` and the knowledge base's item 9, the Done count (80 tree and 27
  patch cases), the CT range, the re-gated chain and DEC-0153's head re-measured, CT-109's row and DEC-0149's
  additivity worded exactly, and the walk's test comment; round 52 (not clean: item 12's "handing it to anyone";
  pre-DEC-0149 readers outside the home; credential file names read folded; the manifest under unchecked) answered as
  decided: `credentialFileName` folds a name before the three patterns (two tree vectors, a test), `FAC-SEM-157`
  refuses an `unchecked` entry naming the manifest and the tree check reads the manifest whatever `unchecked` says (a
  test), item 12's operative rule leads it, the earlier readers scoped to the home, the manifest requirement scoped to
  its carriers, the export's "no hosted or remote repository", a personal agent's later public releases, the
  knowledge base's RM-36 row and integration pointer, and the seam notes; round 53 (not clean: the tree check's own
  unchecked list skipped the manifest; an organization's own repositories; a personal agent's visibility change; a
  package to earlier readers) answered as decided: `sourceTreeProblems` reads unchecked through `uncheckedTest` and the
  manifest never as binary (two tree vectors, a test and a CLI test where the manifest unchecks itself),
  `patchPathsAllowed` refuses a credential file by its name (a patch vector, a test), the `.env.example` exceptions read
  as written (the `.ENV.EXAMPLE` vector now blocks), and the organization, visibility, package, receipt and release
  sentences scoped; round 54 (not clean: CREDENTIAL_FILE missed U+2028/U+2029 names; the lead's old opening clause;
  public release unqualified) answered as decided: `CREDENTIAL_FILE`'s name runs read any character but a line feed (two
  tree vectors, a patch vector), a nested repository at the manifest's path is always reached (a tree vector and a CLI
  test with a gitlink at the manifest's path, the Git-mode walk trigger ignoring the manifest's own name unless it is a
  gitlink), a refused non-string patch path named by its index, the vectors' about text, the lead's opening, "from a
  private home" in the scoping and package sentences, the personal visibility-change sentence, SCN-054 step 3, the
  import and `FAC-SEM-157` rows, and the relays; round 55 (not clean: a gitlink at the manifest's path under exclude; earlier collaborators
  outside the home; a personal private home's visibility change) answered as decided: `nestedTest` returns true at the
  manifest's path before `exclude` (two tree vectors), the message there names the remedy, a CLI test for the Git-mode
  arm a gitlink at the manifest keeps, `patchPathsAllowed` refuses a non-list as `paths` (two patch vectors), the lead
  states the earlier collaborators once, the visibility sentence the same in five places, the closed pack-step list,
  package.md quoting source.md's two tests, the receipt and target wording, and the landing note on CT ids; round 56
  (not clean: the manifest's path read two ways; flat wordings beside round 55's sentence) answered as decided:
  `atManifestPath` read by `nestedTest` and the message (a test and a tree vector with a trailing slash), the gitlink
  exception in `excludesGitlink`, a patch's full-fold credential reading (two patch vectors), `Array.from` over a
  sparse list, the flat wordings qualified, SCN-054 and item 8 on the manifest's path, the inventory and CT-207 rows,
  and DEC-0153's landed steps written as steps of this landing's merge; round 57 (not clean: flat access wordings;
  the patch's full fold missing from the requirement rows) answered as decided: every access, visibility and transfer
  wording qualified ("on its own", with the operator's permission his own act), the three requirement rows extended,
  an org context instance on the owner's machine (source.md, contexts.md, the knowledge base's item 9), the vectors'
  credential clause, a Git-mode CLI test of the gitlink exception (failing with round 55's `src/validate-cli.ts`),
  SCN-002's skipped-file line and the merge notes; round 58 (not clean: a flat wording in conformance.md's hand-over
  row) answered as decided: that row qualified and the living pages swept again, the enrolled-machine clause in
  source.md, contexts.md, `CONTEXT.md` and the knowledge base's item 9, a unit test of a sparse list's hole, the
  manifest-as-text sentence qualified, a tree vector of an unused folder exclude over the manifest's path, and the
  ops-digest landing step; round 44 (not clean: target forms, word forms, export parent, existing readers, public home)
  answered as the coordinator decided (below), with the Paths section stating the include and exclude entry rule once
  (and the schema's description, the `SOURCE_PATH` and `folderInSource` comments and the walk's folder wording to
  match) and the vectors' patch sentence naming the Georgian step; and from round 43's unit reading (round 42's bare entry leaving out what lies beneath its
  name): `FAC-SEM-157` reads a bare entry naming an include folder as an include path, `folderInSource` keeps an
  `unchecked` folder beneath a bare entry out of the source, and an entry that excludes a gitlink as `nestedTest`
  reads it (bare over it or a folder holding it, ending in `/` over a folder holding it or itself) is used, each
  tested; source.md says the index is read whenever Git answers; round 1's `humanStep: "setup"` widening was reversed in round 2 and every file it touched
  is back to `main`.

- Also in this change: the AP-2 note and the actions-table note in `service.md`, and `connections.md`'s id grammar
  guarantee.

## Open

- The row that makes the check refuse an `unchecked` entry covering a credential finding, and the inventory row, are
  filed at landing; the enforcing row's id goes into SCN-054 step 3, and both ids are written here, in the landing
  change (CT ids pending).
- A structured marker for a refusal that is a setup answer (a missing slot) is left open: by DEC-0149's choice the tool
  error carries none, so a caller or host that sees only the error cannot tell a setup answer from a failure. It is for
  CT-208 (Fabric) and CT-219 (not on this branch; on main or its own branch at landing) to take up.
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
- The checker does not refuse an `unchecked` entry that covers a credential finding: a probe in round 35 (a manifest
  listing its own key-holding file under `unchecked`) exits 0. source.md and SCN-054 say `unchecked` is no remedy for a
  credential finding; enforcing it in the checker is a follow-up row filed at landing (see **Next task**), not done
  here.
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
- The merge: the next round of readings, then the status line rewritten as DEC-0147's is, CT-194 to `done`. Done (round 50):
  PR #235 (DEC-0148) merged into main as `08e24572` and moved both next-free markers there. `AGENTS.md`'s Commands table was also edited by
  `agent/template-parity-20261103` (PR #236), which is merged: this branch resolves it at its merge of main.
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
- The source's home is not a recipient (round 36, decided by the coordinator under the operator's recorded rules): the
  rule guards source leaving the operator's estate or reaching new readers, personal agents stay private, and an
  organization's agents are developed in its repositories by its standing practice (the knowledge base's rules §2 on
  branches and landing, §11 on releases), so without the carve-out every ordinary push and release of such an agent,
  of a public skill set, and of every agent CT-207's templates give a manifest would need a word per act. The carve-out
  never lets a personal agent's source move into an organization's or a public repository.
- Round 37, decided by the coordinator under the operator's recorded rules (the rule guards source leaving the owner's
  estate or reaching new readers; personal agents stay private):
  - the home carve-out includes the owner's own placements: a deploy to a placement its owner holds (an organization's
    agent on that organization's placement included) is no hand-over, since the source reaches no new reader, while a
    personal agent's source on an organization's or a team's placement, or on one other people can read, is one;
    serving the running agent to a team gives no one the tree;
  - each push of a commit not already in a repository that is not the home and is public or another owner's is its
    own hand-over, since each brings new source to new readers ("pushed to a repository it was not in" read as one act
    for the first push only);
  - a package handed to another person carries the source and is a hand-over; "releases there" covers a release that
    stays where the home's readers are; a personal agent's package or release on a public registry stays a hand-over;
  - the 2026-10-12 standing permission is cited in the operator's recorded wording (the knowledge base's roadmap D5
    row), and "file by file through the product's own change" is presented as this contract's reading, since the
    wording itself says less;
  - `.git` in every form a case-insensitive or Windows file system resolves to it is never source, and a patch path an
    `exclude` entry names under ASCII case folding is refused, since on such a file system the two spellings are one
    file and the rule is otherwise bypassed.
- Round 58, decided by the coordinator under the operator's recorded rules:
  - every flat wording on the living pages about a personal home's access, visibility or transfer is qualified;
  - a machine the operator holds stays his when it is enrolled in an organization; an OS account or machine the
    organization owns whole is the organization's.
- Round 57, decided by the coordinator under the operator's recorded rules:
  - an agent never gives new access, changes a personal private home's visibility or transfers a personal home on its
    own; with the operator's explicit permission for that act it is his own act, no act of this contract;
  - an `org:<orgId>` context instance on a machine the operator holds is the owner's placement serving the
    organization, no hand-over; a placement the organization holds is one.
- Round 56, decided by the coordinator under the operator's recorded rules:
  - the manifest's path is read one way (one trailing `/` dropped, NFC) wherever a nested repository is judged;
  - a patch refuses a credential file's name under the full fold too; the tree check keeps its ASCII reading;
  - a personal agent's private home is not made public by an agent, and an agent does neither of the organization's
    two acts on it on its own (with the operator's explicit permission it is his own act, no act of this contract);
  - DEC-0153 landed first, so its "Left to the landers" steps are steps of this landing's merge.
- Round 55, decided by the coordinator under the operator's recorded rules:
  - a nested repository at the manifest's path is always in the source, before `exclude`; the remedy is to remove it;
  - collaborators given access before DEC-0149 count as the home's readers only inside the home itself (round 52's
    answer, stated once in the lead);
  - a personal agent's private home changing visibility or gaining outside readers: not done by an agent on its own;
    with the operator's explicit permission for that act it is the operator's own act under his own rule, and no act
    of this contract; the contract's tools do not perform it.
- Round 54, decided by the coordinator under the operator's recorded rules:
  - a credential file's name is matched with any character but a line feed in its runs (U+2028 and U+2029 included);
  - a nested repository at the manifest's path is always in the source, so it blocks;
  - the lead: a route is a hand-over when the source reaches someone who could not already read the home, or a place
    another owner holds;
  - the manifest and package rules bind a public release or a public registry from a private home only;
  - a personal agent's visibility change, like a transfer, needs a permission outside this contract.
- Round 53, decided by the coordinator under the operator's recorded rules:
  - the manifest is always read, as text: never unchecked by the tree check, never binary;
  - an import never writes a credential file; the `.env.example` exceptions fail closed (as written, lower case);
  - for a personal agent an organization's repository is another owner's; an organization's own repositories are its
    own agent's owner's places; an organization's visibility change or new outside readers take the word and accept
    the history, and for a personal agent's private home an agent does neither on its own (with the operator's explicit permission for that act it is his own act, no act of this contract);
  - a package sent to a place outside the owner's is a hand-over; whoever hands a local export over records its
    receipt, one record per recipient.
- Round 52, decided by the coordinator under the operator's recorded rules:
  - a credential file's name is read folded as a `.git` segment is; no `unchecked` entry names the manifest;
  - item 12 leads with its operative rule; a commit reaching pre-DEC-0149 readers is no hand-over in that home only;
  - a hand-over by push or by file, a package handed over, or published to a public registry from a private home, or a public release from a private home needs the manifest (each carries a source export or
    a package); an organization's visibility change of its private agent, or new readers outside the organization, take the word and accept the history as it stands; for a personal agent's private home an agent does neither on its own (with the operator's explicit permission for that act it is his own act, no act of this contract);
  - every later public release of a personal agent from a private home is its own hand-over; a source export creates
    no hosted or remote repository and never pushes.
- Round 51, decided by the coordinator under the operator's recorded rules:
  - the lead's filter is bound to its place condition: a route that stays in a place the home's owner holds and
    reaches only those who could already read the home is no hand-over; a place another owner holds stays a hand-over
    even when only earlier readers can read it (a personal agent's export pushed to a collaborator's own private
    repository is one);
  - devices.md names the `detail` pattern as one of four boundaries that read different forms, ranking none.
- Round 50, decided by the coordinator under the operator's recorded rules:
  - the widest reading walks every segment from the first that folds to nothing and removes the folder the shallowest
    reading reaches (everything but `fabric.source.json` at depth 0), without a trailing `/` also as a file of its name;
  - devices.md keeps the `detail` pattern and names the one form it accepts that `SOURCE_HOME_PATHS` reads;
  - "any access newly given to another person (beyond the access given before DEC-0149 was accepted)", the same in
    source.md and the knowledge base's item 9; the copied-content route says readable by anyone who could not already
    read the home;
  - the device-common `$comment` is DEC-0153's line byte for byte; step 6 pairs PR #628 by RM-36's "Restated" line.
- Round 49, decided by the coordinator under the operator's recorded rules:
  - the round-48 lead filters every route; each route says "anyone who could not already read the home", so an
    organization's export pushed to its own private repository, readable only by its members, is no hand-over;
  - an exclude entry's widest reading is the union of the readings; `FAC-SEM-157`'s cause and effect come from the same
    segment index, the segment before a length cause; an include equal to or under what it removes is said once;
  - the manifest is required only to hand an agent over or release it publicly from a private home; a package rule
    binds a package handed over, or published to a public registry from a private home; a vendored file travels only as a committed source
    path, a binary one also listed in `binaries`;
  - a local export records the recipient and the export commit when handed over by push or by file;
  - DEC-0149's landing rewrites every copy that counts the home-path boundaries (four, `SOURCE_HOME_PATHS` the fourth).
- Round 48, decided by the coordinator under the operator's recorded rules:
  - the route list's lead: a copy is no hand-over only when it stays in a place the home's owner holds and only the
    home's readers can read it (the owning organization's members for its own agent, and, for a personal agent's
    private home, the collaborators given access before DEC-0149 was accepted); a repository or placement another owner
    holds stays a hand-over (round 47's lead narrowed);
  - an exclude entry outside the grammar fails closed and removes its widest reading; an include entry so read names
    nothing; `FAC-SEM-157` says it once by its cause, in a tree document too;
  - an agent without `fabric.source.json` is handed over or released publicly from a private home only once it has one;
  - a package handed over, or published to a public registry from a private home, holds only committed source paths besides `fabric.package.json`, a vendored
    file travelling only as a committed source path (a binary one also listed in `binaries`);
  - a hand-over by push or by file of a local export records the recipient and the export commit in that export's receipt;
  - the CT-109 register's fourth boundary lands with DEC-0149 itself.
- Round 47, decided by the coordinator under the operator's recorded rules:
  - `inGrammar` holds as written, in NFC and in NFD, one rule for a path read from disk and a manifest entry alike, and
    a path with a segment made only of dots, spaces and code points HFS+ ignores is outside it (it folds to nothing,
    and a tool that trims or folds names as the fold does may read it as empty, `.` or `..`; a scratch HFS+ volume
    creates `.` U+200C `.` as its own folder, so no file system mechanism is claimed): no source, refused in a patch,
    never written by an import;
  - the `missing` and `binaries` loops skip an entry outside the grammar; `FAC-SEM-157` names it once, by its cause;
  - the not-done clause covers an act on the whole repository of a personal agent's private home or of any copy of it
    within the operator's estate that carries its history (a private mirror);
  - the route list's lead: a route is a hand-over only when the source reaches someone who could not already read the
    home (round 48 narrowed who), and a release is a source export or a package (serving and copied content are never
    a release);
  - a package holds only source paths that passed that commit's tree check, besides the files the pack step writes
    (`fabric.package.json`); built files travel only as committed source paths;
  - a local export with no recipient records none and is parentless; an export keeps file modes and symbolic links as
    committed; RM-36's dated restatement and its "Waiting on" line are in PR #628 itself.
- Round 46, decided by the coordinator under the operator's recorded rules (one rule stated once):
  - an organization agent's private home: its first public release, by any route, takes the word naming its source
    commit; every later public release from it, by any route, is the organization's own act; every release carries only
    the source export or a package packed from that source commit holding only source paths that passed the tree check;
  - the two exceptions (an organization's later public release from its private home and material already public) stand once, in the lead of the
    route list, covering every route;
  - a package handed over, or published to a public registry from a private home, names as its target the source commit it was packed from;
  - every reader takes a path in the grammar as written and in NFC through one helper, `inGrammar` (round 47: and in
    NFD, with no segment made only of dots, spaces and code points HFS+ ignores).
- Round 45, decided by the coordinator under the operator's recorded rules (stale second statements removed):
  - an organization's later public release from its private home by push takes no word and still carries a source
    export whose parent is the earlier export commit, so the home's history stays back (round 46: an organization's later public
    release from its private home, by any route, and a package from that source commit is the other carrier);
  - the export's receipt records the recipient and the export commit; the next export reads its parent from it,
    fetched from the recipient's repository; any export that cannot land as a fast-forward goes as a new branch or pull
    request;
  - access given before DEC-0149 was accepted (its merge date, written at landing) stands as the operator's own act;
  - a transfer of a personal agent's home, public or private, is not done (the operator's permission for one is outside
    this contract); making a public personal home private is none;
  - material already public needs no word by any route.
- Round 44, decided by the coordinator under the operator's recorded rules (fewer rules):
  - the target names the repository only for an organization agent's private home made public or given new readers
    outside the organization; every other hand-over names its source commit;
  - three word forms and no other: the decision with its exact target and the in-call elicitation on a service's
    action, and the stated word outside one (the operator's reply accepting the agent's statement, consumed once,
    relayed only under OA-5);
  - a source export is one new commit whose only parent, if any, is the earlier export commit the recipient holds; a
    later export lands as a fast-forward or, when the recipient's branch has moved, as a new branch or pull request;
    never a force-push;
  - access the operator gave to a personal agent's private home before the rule stands as the operator's own act;
    nothing is retroactive, and an agent never gives new access;
  - the whole-repository rule covers a personal agent's private home only; serving is a hand-over to anyone who cannot
    read the home.
- Round 43, decided by the coordinator under the operator's recorded rules (new readers are what the rule guards):
  - routes "among others": a push to a repository that is public, another owner's or readable by another person, and
    source files' content copied into a message, an issue, a gist or a thread outside the owner's;
  - a later export to the same recipient takes the export commit it holds as its parent: a fast-forward, never a
    force-push;
  - any other person's access to a personal agent's private home is a whole-repository act, not done (round 44
    settles readers it already has: they stand as the operator's own act);
  - an organization agent's first public release from a private home takes the word, later ones are its own; giving
    its private source new readers outside the organization takes the word naming the repository, accepting the history;
  - serving source takes the word per deployed commit and audience; serving what is already public is none;
  - a patch path beneath a symbolic link in the receiver's tree is refused whole at apply time;
  - outside a service's action, the operator's reply accepting the agent's statement of agent, commit and recipient is
    the word.
- Round 42, decided by the coordinator under the operator's recorded rules:
  - the history gate is withdrawn: a host keeps and serves more than any local clone sees (`refs/pull/*`, dangling and
    force-pushed commits by id, fork networks), so no local gate can stand behind "never moves in its history"; a
    hand-over by push or by file carries a source export, never another commit, and an act on the whole repository of
    a personal agent is not done; a gate that would let one carry the history is not decided here;
  - an organization's acts on its own agent's whole repository are its own, under its release rules, except that making
    a private organization agent's source public takes the word;
  - what is already public may go to any public place, another owner's included, when an earlier act on the word or the
    owner's own act made it public; access to a public home is none, to a private one it is a hand-over;
  - a source file served verbatim, or a bundle built without minification, is the source tree served;
  - the 2026-10-12 permission is read as rewriting mechanics file by file, not copying them;
  - the fold maps Georgian Nuskhuri onto Mkhedruli after NFC, as HFS+ joins Asomtavruli and Mkhedruli; a folder entry
    over a link is unused, since it excludes only what is under a folder.
- Round 41, decided by the coordinator under the operator's recorded rules (its history gate withdrawn in round 42):
  - a hand-over by push or by file carries a source export, never a home commit, and any other commit pushed outside
    the home runs the history gate over its ancestry, so private data never moves in the tree or the history by any
    route;
  - the history gate is the tree check with the operator's list over every path and blob reachable from every ref,
    counts and indexes only; the engine's release check and the privacy check are not it; until CT-207 or CT-208
    implements it, a whole-repository act on a personal agent is not done;
  - a processor is no recipient while what it holds stays readable by no one but the owner and the processors acting
    for it;
  - what takes the word when a source becomes public is a personal agent's source made public for the first time and
    an organization agent's private source made public; an organization creating its own agent's home public is its
    own act;
  - a deploy to the owner's placement is none, a bundle a public page serves is output, and serving the source tree,
    source maps or unbuilt files publicly is a hand-over; the prompts or resources a running agent serves are output;
  - the knowledge base's item 5 moves the source hand-over out of the human-gate list, as a `relayed` act on the
    operator's word with its exact target.
- Round 40, decided by the coordinator under the operator's recorded rules (one principle: making a source public for
  the first time always takes the word):
  - a processor is no recipient only while what it holds stays readable by no one outside the owner; output it makes
    public or readable by others (a public server, a Pages site) is a hand-over;
  - a personal agent's home created public is the visibility change and takes the word; the already-public carve-out
    covers only a source an earlier act on the word, or the owner's own act, made public;
  - a personal agent's package or release on a public registry is a hand-over unless its home is already public; the
    files the pack step derives from the public source count as public, nothing else does;
  - an act on the whole repository hands over the history, which no tree check reads, so the history privacy gate
    (the knowledge base's rules section 9, `--history`) runs before it;
  - an organization's release of its agent to a public registry is its own act only when the agent's home is already
    public; a private organization agent's first public release takes the word.
- Round 39, decided by the coordinator under the operator's recorded rules:
  - the fold lower-cases first, so the capital sharp s meets `ss` (the readers' sweep found no class disagreeing with
    Unicode's caseless matching with lower, upper, lower), and any `~` followed by a digit is a possible short name;
  - the manifest, the tree check, the export and the import bind a repository with `fabric.source.json`, while the
    hand-over rule binds every agent's source, so the absence of a file never decides what the operator's word does;
  - an import never applies a change to `fabric.source.json`, whoever sends it: the patch is held, kept unapplied,
    until the owner decides, and the owner changes the manifest by a commit at the source, so there is one answer;
  - a file is a hand-over when sent to another person or a place outside the owner's; a processor acting for the
    owner under the owner's account or host is no recipient, since the rule targets disclosure;
  - a push or release of what is already public, from a public home to another public place of the same owner, is no
    hand-over (the visibility change was), matching the operator's practice of agents releasing public skill sets;
  - mechanics are adapted file by file when the result does not run as the agent, carries none of its manifest,
    identity, data, keys or private names, and each file is changed into the product's own interfaces in the product's
    own change; in doubt it is a hand-over.
- Round 38, decided by the coordinator under the operator's recorded rules:
  - the 2026-10-12 permission covers mechanics adapted into a product's source file by file; the agent's source as
    such (its tree, or a whole copy under any name) moving into an organization's or a public repository stays a
    hand-over, since the permission's text names mechanics;
  - access the owning organization gives its own members to its own agent's home is no hand-over (they are the home's
    readers); access given to anyone outside the owner is one, and for a personal agent any other person's access;
    for an act on the whole repository (transfer, visibility change, access given) the word names the repository, not
    one commit, since the act hands over every commit;
  - an organization's agent released by the organization to a public registry is its own release, not a hand-over;
  - the knowledge base's principles section 7 and rules section 9 point to agents-first item 9's list instead of
    repeating it, and rules section 9's "never publish" gains the hand-over exception, so one list is kept;
  - a patch is checked against the receiver's current manifest and a patch to `fabric.source.json` is held for the
    owner's word, since one patch could drop an `exclude` for a later one; `exclude` is folded on both sides, since
    APFS matches names under Unicode case folding;
  - the next free rule code at landing is the higher of the register's marker and the CAS counter.
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

Round 58's fixes were checked on the working tree over head `068f47ad` (this note's commit holds the same tree, plus
this paragraph): the branch gate, `ORG_INDEX=... pnpm run check` (exit 0: typecheck, 114 test files with 10256 passed
and 3 skipped under the coverage floors, `ux:lint`, `docs:check` passed with 0 markdownlint errors, `privacy:check` with
0 findings), run under the shared lock with the 15-minute load at 30.4 and 13 GB free, and `pnpm exec tsx
tools/vectors/run.ts` (exit 0, 29 files match; `source-tree.json` 90 tree and 32 patch cases); before it `pnpm
typecheck` (exit 0), `pnpm vectors:write` then `pnpm vectors:check` (exit 0) and the targeted coverage run over
`source-rules`, `validate-cli`, `secret-shape`, `schema-compilation`, `consistency`, `validate-cli-faults`,
`rule-tolerance` and `positive-sweep` (exit 0: 3259 passed, 2 skipped; `src/source-rules.ts` at 100 % of its branches,
`src/validate-cli.ts` at 99.48 %). The sparse-list unit test fails with `Array.from` replaced by a plain `flatMap` for
one run (an empty answer where one index is expected) and passes on this tree. No U+2014 in the added lines. The
knowledge base's PR is at `20b00209` (round 58 merged the knowledge base's main `f9ed924f`, item 8 as main has it):
`source hand-over` in 4, 3 and 3 lines of agents-first, principles and rules, `own estate` once on each, item 9 once
and item 8 once; the knowledge base's `npm test` (exit 0, 172 passed) and `npm run verify:content` (exit 0, backlog 0
errors).

Round 57's fixes were checked on the working tree over head `4c96b4b2` (this note's commit holds the same tree, plus
this paragraph): the branch gate, `ORG_INDEX=... pnpm run check` (exit 0: typecheck, 114 test files with 10254 passed
and 3 skipped under the coverage floors, `ux:lint`, `docs:check` passed with 0 markdownlint errors, `privacy:check` with
0 findings), run under the shared lock with the 15-minute load at 34.8 and 12 GB free, and `pnpm exec tsx
tools/vectors/run.ts` (exit 0, 29 files match; `source-tree.json` 89 tree and 32 patch cases); before it `pnpm
typecheck` (exit 0), `pnpm vectors:write` then `pnpm vectors:check` (exit 0) and the targeted coverage run over
`source-rules`, `validate-cli`, `secret-shape`, `schema-compilation`, `consistency`, `validate-cli-faults`,
`rule-tolerance` and `positive-sweep` (exit 0: 3257 passed, 2 skipped; `src/source-rules.ts` at 100 % of its branches,
`src/validate-cli.ts` at 99.48 %). The new Git-mode test of the gitlink exception fails with `028acfe7`'s
`src/validate-cli.ts` put back for one run (no unused-exclude line where one is expected) and passes on this tree. No
U+2014 in the added lines. The knowledge base's PR is at `26eec366` (round 57 merged the knowledge base's main
`83af1b98`, which holds `c4ccd33c`, item 8 as main has it): `source hand-over` in 4, 3 and 3 lines of agents-first,
principles and rules, `own estate` once on each, item 9 once and item 8 once; the knowledge base's `npm test` (exit
0, 172 passed) and `npm run verify:content` (exit 0, backlog 0 errors).

Round 56's fixes were checked on the working tree over head `028acfe7` (this note's commit holds the same tree, plus
this paragraph): the branch gate, `ORG_INDEX=... pnpm run check` (exit 0: typecheck, 114 test files with 10253 passed
and 3 skipped under the coverage floors, `ux:lint`, `docs:check` passed with 0 markdownlint errors, `privacy:check` with
0 findings), run under the shared lock with the 15-minute load at 44.7 and 14 GB free, and `pnpm exec tsx
tools/vectors/run.ts` (exit 0, 29 files match; `source-tree.json` 89 tree and 32 patch cases, measured with `python3`
and equal to the Done line); before it `pnpm typecheck` (exit 0), `pnpm vectors:write` then `pnpm vectors:check`
(exit 0) and the targeted coverage run over `source-rules`, `validate-cli`, `secret-shape`, `schema-compilation`,
`consistency`, `validate-cli-faults`, `rule-tolerance` and `positive-sweep` (exit 0: 3256 passed, 2 skipped;
`src/source-rules.ts` at 100 % of its branches, `src/validate-cli.ts` at 99.48 %). No U+2014 in the added lines.
PR #628 is at `f11ab60e` (round 56 merged the knowledge base's main `8128b6b4`, item 8 as main has it): `source hand-over`
in 4, 3 and 3 lines of agents-first, principles and rules, `own estate` once on each, item 9 once and item 8 once; the
knowledge base's `npm test` (exit 0, 172 passed) and `npm run verify:content` (exit 0, backlog 0 errors).

Round 55's fixes were checked on the working tree over head `82b23481` (this note's commit holds the same tree, plus
this paragraph): `pnpm typecheck` (exit 0); `pnpm vectors:write` then `pnpm vectors:check` (exit 0, 29 files match;
`source-tree.json` 88 tree and 31 patch cases, measured with `python3` and equal to the Done line); the targeted
coverage run over `source-rules`, `validate-cli`, `validate-cli-faults`, `rule-tolerance`, `positive-sweep`,
`schema-compilation` and `consistency` (exit 0; `src/source-rules.ts` at 100 % of its branches, `src/validate-cli.ts`
at 99.48 % against its 99.4 floor); `test/secret-shape.test.ts` passes in a run beside `source-rules` and
`validate-cli` (3222 passed, 2 skipped; that run's file set does not reach the `validate-cli.ts` floor, which the
file set above does); `pnpm run docs:check` (exit 0, 0 errors); `python3 docs/ux/lint.py` (exit 0); `ORG_INDEX=...
pnpm run privacy:check` (exit 0, 0 findings); no U+2014 in the added lines. The branch gate is owed: the disk held 6
GB free, under the 8 GB the heavy lock asks for. PR #628 at `01cb91b9` (round 55 merged the knowledge base's main
`12125977`, item 8 as main has it): `source hand-over` in 4, 3 and 3 lines of agents-first, principles and rules, `own
estate` once on each, item 9 once and item 8 once; the knowledge base's `npm test` (exit 0, 172 passed) and `npm run
verify:content` (exit 0, backlog 0 errors).

Round 54's fixes were checked on the working tree over head `527acd18` (this note's commit holds the same tree, plus
this paragraph): the branch gate, `ORG_INDEX=... pnpm run check` (exit 0: typecheck, 114 test files with 10245 passed
and 3 skipped under the coverage floors, `ux:lint`, `docs:check` passed with 0 markdownlint errors, `privacy:check` with
0 findings), run under the shared lock with the 15-minute load at 39.1 and 14 GB free, and `pnpm exec tsx
tools/vectors/run.ts` (exit 0, 29 files match; `source-tree.json` 86 tree and 29 patch cases, measured with `python3`
and equal to the Done line); before it, the targeted coverage run over `source-rules`, `validate-cli`,
`validate-cli-faults`, `rule-tolerance`, `positive-sweep`, `schema-compilation` and `consistency` (exit 0: 3245 passed,
2 skipped; `src/source-rules.ts` at 100 % of its branches, `src/validate-cli.ts` at 99.48 %). The lead's old opening
clause counts 0 in source.md, `CONTEXT.md` and the knowledge base's agents-first. No U+2014 in the added lines.
PR #628 at `43bab0f2` (round 54 merged the knowledge base's main `6cb6cbb6`, item 8 as main has it): `source hand-over`
in 4, 3 and 3 lines of agents-first, principles and rules, `own estate` once on each, item 9 once and item 8 once;
the knowledge base's `npm test` (exit 0, 172 passed) and `npm run verify:content` (exit 0, backlog 0 errors).

Round 53's fixes were checked on the working tree over head `b2fdbf92` (this note's commit holds the same tree, plus
this paragraph): the branch gate, `ORG_INDEX=... pnpm run check` (exit 0: typecheck, 114 test files with 10241 passed
and 3 skipped under the coverage floors, `ux:lint`, `docs:check` passed with 0 markdownlint errors, `privacy:check` with
0 findings), run under the shared lock with the 15-minute load at 41.1 and 17 GB free, and `pnpm exec tsx
tools/vectors/run.ts` (exit 0, 29 files match; `source-tree.json` 84 tree and 28 patch cases, measured with `python3`
and equal to the Done line); before it, the targeted coverage run over `source-rules`, `validate-cli`,
`validate-cli-faults`, `rule-tolerance`, `positive-sweep`, `schema-compilation` and `consistency` (exit 0: 3241 passed,
2 skipped; `src/source-rules.ts` at 100 % of its branches, `src/validate-cli.ts` at 99.48 %). A first privacy run
found a private name in this note and a home path with a further segment in two new vectors; both were reworded before
the gate. No U+2014 in the added lines. PR #628 at `252c1d11` (round 53 merged the knowledge base's main `3d224ace`,
item 8 kept as main has it): `source hand-over` in 4, 3 and 3 lines of agents-first, principles and rules, `own
estate` once on each, item 9 once and item 8 once; the knowledge base's `npm test` (exit 0, 172 passed) and `npm run
verify:content` (exit 0, backlog 0 errors).

Round 52's fixes were checked on the working tree over head `4f89df17` (this note's commit holds the same tree, plus
this paragraph): the branch gate, `ORG_INDEX=... pnpm run check` (exit 0: typecheck, 114 test files with 10234 passed
and 3 skipped under the coverage floors, `ux:lint`, `docs:check` passed with 0 markdownlint errors, `privacy:check` with
0 findings), run under the shared lock with the 15-minute load at 39.2 and 17 GB free, and `pnpm exec tsx
tools/vectors/run.ts` (exit 0, 29 files match; `source-tree.json` 82 tree and 27 patch cases, measured with `python3`
and equal to the Done line); before it, the targeted coverage run over `source-rules`, `validate-cli`,
`validate-cli-faults`, `rule-tolerance`, `positive-sweep`, `schema-compilation` and `consistency` (exit 0: 3234 passed,
2 skipped; `src/source-rules.ts` at 100 % of its branches, `src/validate-cli.ts` at 99.48 %). `grep -c 'Handing it to
anyone' docs/DECISIONS.md` prints 0, and the unqualified earlier-readers sentence prints 0 in source.md and the
knowledge base's agents-first. No U+2014 in the added lines. PR #628 at `bafe94b4` (main `5f7df6a7` unmoved):
`source hand-over` in 4, 3 and 3 lines of agents-first, principles and rules, `own estate` once on each, item 9 once
and item 8 once; the knowledge base's `npm test` (exit 0, 172 passed) and `npm run verify:content` (exit 0, backlog 0
errors).

Round 51's fixes (documentation and a test comment; no code behaviour changed) were checked on the working tree over
head `899b4710` (this note's commit holds the same tree, plus this paragraph): the branch gate, `ORG_INDEX=... pnpm run
check` (exit 0: typecheck, 114 test files with 10230 passed and 3 skipped under the coverage floors, `ux:lint`,
`docs:check` passed with 0 markdownlint errors, `privacy:check` with 0 findings), run under the shared lock with the
15-minute load at 28.5 and 19 GB free, and `pnpm exec tsx tools/vectors/run.ts` (exit 0, 29 files match;
`source-tree.json` holds 80 tree and 27 patch cases, measured with `python3` over the file and equal to the Done
line); before it `pnpm typecheck` (exit 0) and the `source-rules` and `validate-cli` tests (exit 0, 2052 passed, 2
skipped). `grep -n 'strictest' docs/specification/devices.md` prints nothing. No U+2014 in the added lines. PR #628 at
`a9de0bdb` (main `5f7df6a7` unmoved): `source hand-over` in 4, 3 and 3 lines of agents-first, principles and rules,
`own estate` once on each, item 9 once and item 8 once; the knowledge base's `npm test` (exit 0, 172 passed) and `npm
run verify:content` (exit 0, backlog 0 errors).

Round 50's fixes were checked on the working tree over head `5a8e1770` (this note's commit holds the same tree, plus
this paragraph): the branch gate, `ORG_INDEX=... pnpm run check` (exit 0: typecheck, 114 test files with 10230 passed
and 3 skipped under the coverage floors, `ux:lint`, `docs:check` passed with 0 markdownlint errors, `privacy:check` with
0 findings), run under the shared lock with the 15-minute load at 30.9 and 19 GB free, and `pnpm exec tsx
tools/vectors/run.ts` (exit 0, 29 files match; `source-tree.json` 80 tree and 27 patch cases); before it, the targeted
coverage run over `source-rules`, `validate-cli`, `validate-cli-faults`, `rule-tolerance`, `positive-sweep`,
`schema-compilation`, `activity-rules`, `proposal-rules` and `consistency` (exit 0: 3325 passed, 2 skipped;
`src/source-rules.ts` at 100 % of its branches, `src/validate-cli.ts` at 99.48 %). A node probe of the `detail` pattern
answers true on `path %5CUsers%5Cbob` (accepted) and false on `path /Users/bob`, and `SOURCE_HOME_PATHS` matches the
first. `grep -rn -E 'three home-path|any of the three' src docs/specification schemas` prints nothing; the device-common
`$comment` equals DEC-0153's line at `cc1fc853` byte for byte. `grep -n '#235'` in this note shows only historical round
mentions, the done Open line and the gated-chain record. No U+2014 in the added lines. PR #628 at `8c547420` (main
`5f7df6a7` unmoved since round 49's merge): `source hand-over` in 4, 3 and 3 lines of agents-first, principles and
rules, `own estate` once on each, item 9 once and item 8 once, the access sentence identical to source.md's; the
knowledge base's `npm test` (exit 0, 172 passed) and `npm run verify:content` (exit 0, backlog 0 errors).

Round 49's fixes were checked on the working tree over head `47d392a4` (this note's commit holds the same tree, plus
this paragraph): the branch gate, `ORG_INDEX=... pnpm run check` (exit 0: typecheck, 114 test files with 10226 passed
and 3 skipped under the coverage floors, `ux:lint`, `docs:check` passed with 0 markdownlint errors, `privacy:check` with
0 findings), run under the shared lock with the 15-minute load at 27.8 and 16 GB free, and `pnpm exec tsx
tools/vectors/run.ts` (exit 0, 29 files match; `source-tree.json` 80 tree and 23 patch cases); before it, the targeted
coverage run over `source-rules`, `validate-cli`, `validate-cli-faults`, `rule-tolerance`, `positive-sweep`,
`schema-compilation`, `activity-rules`, `proposal-rules` and `consistency` (exit 0: 3321 passed, 2 skipped;
`src/source-rules.ts` at 100 % of its branches, `src/validate-cli.ts` at 99.48 %). `grep -rn -E 'three home-path|any
of the three' src docs/specification schemas` prints nothing. The unqualified route wording ("another person" in a
hand-over route) is gone from source.md, package.md, `CONTEXT.md` and the knowledge base's item 9; in
`docs/DECISIONS.md` it stays only in DEC-0149's earlier round records, item 12's opening sentence annotated with round
49's reading. The old vendored-file wording gives 0, and no unscoped release or package sentence is left. No U+2014 in
the added lines. PR #628 at `481ee158` (round 49 merged the knowledge base's main `5f7df6a7`, item 8 as main has it):
`source hand-over` in 4, 3 and 3 lines of agents-first, principles and rules, `own estate` once on each, item 9 once
and item 8 once, the unqualified route wording 0 times; the knowledge base's `npm test` (exit 0, 172 passed) and `npm
run verify:content` (exit 0, backlog 0 errors).

Round 48's fixes were checked on the working tree over head `3d86e462` (this note's commit holds the same tree, plus
this paragraph): the branch gate, `ORG_INDEX=... pnpm run check` (exit 0: typecheck, 114 test files with 10224 passed
and 3 skipped under the coverage floors, `ux:lint`, `docs:check` passed with 0 markdownlint errors, `privacy:check` with
0 findings), run under the shared lock with the 15-minute load at 27.6 and 17 GB free, and `pnpm exec tsx
tools/vectors/run.ts` (exit 0, 29 files match); before it, the targeted coverage run over `source-rules`,
`validate-cli`, `validate-cli-faults`, `rule-tolerance`, `positive-sweep`, `schema-compilation` and `activity-rules`
(exit 0: 3287 passed, 2 skipped; `src/source-rules.ts` at 100 % of its branches, `src/validate-cli.ts` at 99.48 %). A
first `docs:check` caught the folder run naming `FAC-SEM-157` in `src/validate-cli.ts` (G-13, one code one checker); the
filter now calls `isManifestGrammarFinding` from `src/source-rules.ts`. `grep -c SOURCE_HOME_PATHS
src/activity-rules.ts docs/specification/activity.md` prints 1 and 1, and the old "three" sentence prints nothing in
`src/activity-rules.ts`. No U+2014 in the added lines. Narrowed phrases, counted with `grep -c` over the files round 47
counted plus activity.md and `src/activity-rules.ts`: the old lead's list of readers, the old CT-194 visibility
sentence, the old schema-only grammar sentence, the old exclude message, the old CT-109 landing note and the DEC-0150
"tell its lander" bullet give 0; the earlier rounds' records stand as round 47 counted them. PR #628 at `78e080d2`
(round 48 merged the knowledge base's main `567b37b8`, its item 8 kept as main has it): `source hand-over` in 4, 3
and 3 lines of agents-first, principles and rules, `own estate` once on each, item 9 once and item 8 once, the old
lead's readers 0 times; the knowledge base's `npm test` (exit 0, 172 passed) and `npm run verify:content` (exit 0,
backlog 0 errors).

Round 47's fixes were checked on the working tree over head `941643a7` (this note's commit holds the same tree, plus
this paragraph): the branch gate, `ORG_INDEX=... pnpm run check` (exit 0: typecheck, 114 test files with 10219 passed
and 3 skipped under the coverage floors, `ux:lint`, `docs:check` with 0 errors, `privacy:check` with 0 findings), run
under the shared lock with the 15-minute load at 39.0 and 17 GB free, and `pnpm exec tsx tools/vectors/run.ts` (exit
0, 29 files match); before it, `pnpm vitest run --testTimeout=60000 --coverage` over `source-rules`, `validate-cli`,
`validate-cli-faults`, `rule-tolerance`, `positive-sweep` and `schema-compilation` (exit 0: 3196 passed, 2 skipped;
`src/source-rules.ts` at 100 % of its branches, `src/validate-cli.ts` at 99.48 % against its 99.4 floor). The NFD CLI
test fails with the NFD half of `inGrammar` removed (checked by reverting it on a copy, then restored). No U+2014 in
the added lines. Narrowed phrases, counted with `grep -c` over source.md, `conformance.md`, `package.md`,
`CONTEXT.md`, `docs/DECISIONS.md`, `docs/backlog.md`, this note, `docs/ux/scenarios.md`, the code, tests and vectors
of the tree check, and the knowledge base's agents-first, principles, rules and roadmap: an organization's release
phrase without "public", the old not-done clause without the private mirror, the old package line in package.md, the old walk sentence
in SCN-054, the deleted review branch in RM-36 and the withdrawn file-system mechanism for a dotted segment give 0;
the earlier rounds' phrases stay where round 46 counted them, each a record of its round, and the old grammar reading
stays only in round 46's records, each annotated with round 47's. PR #628 at `d31747a8` (round 47 merged the knowledge
base's main `c219a724`): `source hand-over` in 4, 3 and 3 lines of agents-first, principles and rules, `own estate`
once on each, item 9 once and item 8 once, RM-36's restatement once and its old branch name 0 times; the knowledge
base's `npm test` (exit 0, 172 passed) and `npm run verify:content` (exit 0, backlog 0 errors).

Round 46's fixes were checked on the working tree over head `bd88cf3f` (this note's commit holds the same tree):
`pnpm typecheck` (exit 0); `pnpm vitest run --testTimeout=60000 --coverage --coverage.include=src/source-rules.ts
--coverage.include=src/validate-cli.ts` over `source-rules`, `validate-cli`, `validate-cli-faults`, `rule-tolerance`,
`positive-sweep` and `schema-compilation` (exit 0: 3190 passed, 2 skipped; `src/source-rules.ts` at 100 % of its
branches; `src/validate-cli.ts` at 99.48 % against its 99.4 floor); `pnpm exec tsx tools/vectors/run.ts` (exit 0, 29
files match); `pnpm run docs:check` (exit 0, 0 errors); `python3 docs/ux/lint.py` (exit 0); `ORG_INDEX=... pnpm run
privacy:check` (exit 0, 0 findings); no U+2014 in the added lines. Withdrawn and narrowed phrases, counted with
`grep -c` over the same ten files as round 45: the three spellings of the old export definition, the force-push
promise, the later-commit clause, the undated rule start, the commit-only word target, the two-form word, the withdrawn
gate's anchor, the round-45 line paragraph's route clause and the old fold's name give 0 in every file; the
push-only later public release stays once, in this note's round-45 decisions, annotated with round 46's reading; the quoted
"or copying" stays once in DEC-0149 item 12, where it records its withdrawal; the defect round 46 fixed is named once
in DEC-0149 and once in this note's status. PR #628 at `59d7b260` (round 46 merged the knowledge base's main
`216bed30` in as `482a6fae`): `source hand-over` in 4, 3 and 3 lines of agents-first, principles and rules, `own
estate` once on each, item 9 once and item 8 once; the knowledge base's `npm test` (exit 0, 172 passed) and `npm run
verify:content` (exit 0, backlog 0 errors). The branch gate is owed: the 15-minute load stood at 51.8, above 45.

Round 45's fixes were checked on the working tree over head `6a80a302` (this note's commit holds the same tree):
`pnpm typecheck` (exit 0); `pnpm vitest run --testTimeout=60000 --coverage --coverage.include=src/source-rules.ts
--coverage.include=src/validate-cli.ts` over `source-rules`, `validate-cli`, `validate-cli-faults`, `rule-tolerance`,
`positive-sweep` and `schema-compilation` (exit 0: 3188 passed, 2 skipped; `src/source-rules.ts` at 100 % of its
branches; `src/validate-cli.ts` at 99.48 % against its 99.4 floor); `pnpm exec tsx tools/vectors/run.ts` (exit 0, 29
files match); `pnpm run docs:check` (exit 0, 0 errors); `python3 docs/ux/lint.py` (exit 0); `ORG_INDEX=... pnpm run
privacy:check` (exit 0, 0 findings); no U+2014 in the added lines. Withdrawn phrases, counted with `grep -c` over
source.md, `conformance.md`, `CONTEXT.md`, `docs/DECISIONS.md`, `docs/backlog.md`, this note, `docs/ux/scenarios.md`
and the knowledge base's agents-first, principles and rules: the three spellings of the old export definition, the
force-push promise, the later-commit clause, the undated rule start, the commit-only word target and the two-form word
give 0 in every file; the withdrawn gate's anchor
gives 0; the quoted "or copying" stays once in DEC-0149 item 12, where it records its withdrawal. PR #628 at
`f42b40f2`: `source hand-over` in 4, 3 and 3 lines of agents-first, principles and rules, `own estate` once on each,
item 9 once and item 8 once; the knowledge base's `npm test` (exit 0, 172 passed) and `npm run verify:content` (exit
0, backlog 0 errors). The branch gate is owed: the 15-minute load stayed above 45.

Round 44's fixes were checked on the working tree over head `421355d2` (this note's commit holds the same tree; code
changed in comments and the schema's `exclude` description): `pnpm typecheck` (exit 0); `pnpm vitest run
--testTimeout=60000 --coverage --coverage.include=src/source-rules.ts --coverage.include=src/validate-cli.ts` over
`source-rules`, `validate-cli`, `validate-cli-faults`, `rule-tolerance`, `positive-sweep` and `schema-compilation`
(exit 0: 3186 passed, 2 skipped; `src/source-rules.ts` at 100 % of its branches; `src/validate-cli.ts` at 99.48 %
against its 99.4 floor); `pnpm exec tsx tools/vectors/run.ts` (exit 0, 29 files match); `pnpm run docs:check` (exit 0,
0 errors); `python3 docs/ux/lint.py` (exit 0); `ORG_INDEX=... pnpm run privacy:check` (exit 0, 0 findings); no U+2014
in the added lines. Greps for the round's withdrawn phrases print nothing in source.md, `conformance.md` and
`CONTEXT.md`; round 45 found the old export wording still in DEC-0149 item 11, the backlog and this note, and fixed
it. PR #628 at `a4ee9a71` (the knowledge base's main merged in, its item 8 conflict resolved by keeping
main's line and the PR's item 9): `source hand-over` in 4, 3 and 3 lines of agents-first, principles and rules, `own
estate` once on each, item 9 once and item 8 once; the knowledge base's `npm test` (exit 0, 172 passed) and `npm run
verify:content` (exit 0, backlog 0 errors). The branch gate is owed: the 15-minute load stayed above 45.

Round 43's fixes were checked on the working tree over head `e6511b89` (this note's commit holds the same tree; code
with round 43's unit items, which change `src/source-rules.ts` and `src/validate-cli.ts`, in a second commit): `pnpm
typecheck` (exit 0); `pnpm vitest run --testTimeout=60000 --coverage
--coverage.include=src/source-rules.ts --coverage.include=src/validate-cli.ts` over `source-rules`, `validate-cli`,
`validate-cli-faults`, `rule-tolerance` and `positive-sweep` (exit 0: 3178 passed, 2 skipped with the unit items;
`src/source-rules.ts` at 100 % of its branches; `src/validate-cli.ts` at 99.48 % against its 99.4 floor); `pnpm exec tsx tools/vectors/run.ts`
(exit 0, 29 files match); `pnpm run docs:check` (exit 0, 0 errors); `python3 docs/ux/lint.py` (exit 0); `ORG_INDEX=...
pnpm run privacy:check` (exit 0, 0 findings); no U+2014 in the added lines. PR #628 at `f699400a` (the knowledge
base's main merged in first, cleanly): `source hand-over` in 4, 3 and 3 lines of agents-first, principles and rules,
`own estate` once on each, item 9 once and item 8 once; the knowledge base's `npm test` (exit 0, 172 passed) and `npm
run verify:content` (exit 0, backlog 0 errors). The branch gate is owed: the 15-minute load stayed above 45.

Round 42's fixes (with round 41's unit items and round 42's unit and seam items) were checked on the working tree over head `d4cc1e16` (this note's commit
holds the same tree): `pnpm typecheck` (exit 0); `pnpm vitest run --testTimeout=60000 --coverage
--coverage.include=src/source-rules.ts --coverage.include=src/validate-cli.ts` over `source-rules`, `validate-cli`,
`validate-cli-faults`, `rule-tolerance` and `positive-sweep` (exit 0: 3177 passed, 2 skipped, with round 42's unit and
seam items; `src/source-rules.ts` at
100 % of its branches; `src/validate-cli.ts` at 99.47 % over these files against its 99.4 floor); `secret-shape`,
`consistency` and `semantic-kinds` (exit 0, 34 passed); `pnpm exec tsx tools/vectors/run.ts` (exit 0, 29 files match; 76 tree and 19 patch cases, 30
`FOLD_PAIRS`); `pnpm run docs:check` (exit 0, 0 errors); `python3 docs/ux/lint.py` (exit 0); `ORG_INDEX=... pnpm run
privacy:check` (exit 0, 0 findings); no U+2014 in the added lines; a grep for the withdrawn gate's anchor over `docs`, `CONTEXT.md`
and `src` prints nothing. PR #628 at `d3b279f9` (the knowledge base's main merged in first, cleanly): `source hand-over` in 4, 3 and 3 lines of
agents-first, principles and rules, `own estate` once on each, item 9 once and item 8 once; the knowledge base's `npm
test` (exit 0, 172 passed) and `npm run verify:content` (exit 0, backlog 0 errors). The branch gate is owed: the
15-minute load stayed above 45 (62 to 76 this round).

Round 41's seam items were checked on the working tree over head `dfeccbd4` (this note's commit holds the same tree):
`pnpm typecheck` (exit 0); `pnpm vitest run --testTimeout=60000 --coverage --coverage.include=src/source-rules.ts
--coverage.include=src/validate-cli.ts` over `source-rules`, `validate-cli`, `validate-cli-faults`, `rule-tolerance` and
`positive-sweep` (exit 0: 3169 passed, 2 skipped; `src/source-rules.ts` at 100 % of its branches; `src/validate-cli.ts`
at 99.47 % over these files against its 99.4 floor); `secret-shape`, `consistency` and `semantic-kinds` (exit 0, 34
passed); `pnpm exec tsx tools/vectors/run.ts` (exit 0, 29 files match; 76 tree and 16 patch cases); `pnpm run
docs:check` (exit 0, 0 errors); `python3 docs/ux/lint.py` (exit 0); `ORG_INDEX=... pnpm run privacy:check` (exit 0, 0
findings); no U+2014 in the added lines. The branch gate is owed (the 15-minute load near 72). PR #628 stays at `c6f64c50`: the knowledge base needed no change for these items (item 9
already reads "the owner's own act" and gives the condition), and its main had not moved.

Round 41's fixes were checked on the working tree over head `9e5de563` (this note's commit holds the same tree), each
exit code read on its own: `pnpm typecheck` (exit 0); `pnpm vitest run --testTimeout=60000 --coverage
--coverage.include=src/source-rules.ts --coverage.include=src/validate-cli.ts` over `source-rules`, `validate-cli`,
`validate-cli-faults`, `rule-tolerance` and `positive-sweep` (exit 0: 3167 passed, 2 skipped; `src/source-rules.ts` at
100 % of its branches, its floor; `src/validate-cli.ts` at 99.47 % over these files against its 99.4 floor);
`secret-shape`, `consistency` and `semantic-kinds` (exit 0, 34 passed); `pnpm exec tsx tools/vectors/run.ts` (exit 0, 29
files match; `source-tree.json` 75 tree and 16 patch cases, 26 `FOLD_PAIRS`); `pnpm run docs:check` (exit 0, 0
errors); `python3 docs/ux/lint.py` (exit 0); `ORG_INDEX=... pnpm run privacy:check` (exit 0, 0 findings); no U+2014 in
the added lines; the coordinator's two greps over `docs`, `tools`, `CONTEXT.md` and `src` (for the old name of the fold
and for the old mode wording of `excluded-by-fold`) print nothing. The branch gate is owed: the 15-minute load stayed above 45 (60 to 78 this round; `/` held 18 to
20 GB). PR #628 at `c6f64c50` (the knowledge base's main merged in after the round's commit, cleanly): `source
hand-over` in 4, 3 and 3 lines of agents-first, principles and rules, `own estate` once on each, `^9\. \*\*A source
hand-over` once and `^8\. \*\*No person in the chat` once; the knowledge base's `npm test` (exit 0, 172 passed) and
`npm run verify:content` (exit 0, backlog 0 errors).

Round 40's fixes were checked on the working tree over head `fed1e080` (this note's commit holds the same tree), each
exit code read on its own: `pnpm typecheck` (exit 0); `pnpm vitest run --testTimeout=60000 --coverage
--coverage.include=src/source-rules.ts --coverage.include=src/validate-cli.ts` over `source-rules`, `validate-cli`,
`validate-cli-faults`, `rule-tolerance` and `positive-sweep` (exit 0: 3166 passed, 2 skipped; `src/source-rules.ts` at
100 % of its branches, its floor; `src/validate-cli.ts` at 99.47 % over these files against its 99.4 floor);
`secret-shape`, `consistency` and `semantic-kinds` (exit 0, 34 passed); the property test over marked sequences finds
no split (the round-39 fold, NFC before the case mappings, splits 3 groups of the Greek block's sequences alone);
`pnpm exec tsx tools/vectors/run.ts` (exit 0, 29 files match; `source-tree.json` 75 tree and 15 patch cases, 25
`FOLD_PAIRS`); `pnpm run docs:check` (exit 0, 0 errors); `python3 docs/ux/lint.py` (exit 0); `ORG_INDEX=... pnpm run
privacy:check` (exit 0, 0 findings); no U+2014 in the added lines. The branch gate is owed: the 15-minute load stayed
above 45 (60 to 71 during this round; `/` held 18 to 22 GB). PR #628 at `833c16a6` (the knowledge base's main merged in first,
cleanly): `source hand-over` in 4, 3 and 3 lines of agents-first, principles and rules, `own estate` once on each,
`^9\. \*\*A source hand-over` once and `^8\. \*\*No person in the chat` once; the knowledge base's `npm test` (exit
0, 172 passed) and `npm run verify:content` (exit 0, backlog 0 errors).

Round 39's fixes, with its seam add-on, were checked on the working tree over head `3f9481fb` (this note's commit holds
the same tree), each exit code read on its own: `pnpm typecheck` (exit 0); `pnpm vitest run --testTimeout=60000
--coverage --coverage.include=src/source-rules.ts --coverage.include=src/validate-cli.ts` over `source-rules`,
`validate-cli`, `validate-cli-faults`, `rule-tolerance` and `positive-sweep` (exit 0: 3160 passed, 2 skipped;
`src/source-rules.ts` at 100 % of its branches, its floor; `src/validate-cli.ts` at 99.47 % over these files against its
99.4 floor); `secret-shape`, `consistency` and `semantic-kinds` (exit 0, 34 passed); the fold test runs every code point
(idempotent, every case-mapping pair folded together); `pnpm exec tsx tools/vectors/run.ts` (exit 0, 29 files match;
`source-tree.json` 74 tree and 13 patch cases, `FOLD_UNICODE` 17.0 and 18 `FOLD_PAIRS`); `pnpm run docs:check` (exit 0,
0 errors); `python3 docs/ux/lint.py` (exit 0); `ORG_INDEX=... pnpm run privacy:check` (exit 0, 0 findings, after a
product name in a landing note was replaced); no U+2014 in the added lines. A case-sensitive APFS disk image (created
with `hdiutil`, mounted in scratch, detached and deleted): `exclude` `src/Secrets/` over `src/secrets/k.ts` gives no
line in a walk and only `excluded-by-fold` for `files[3]` in Git mode, never `unused-exclude`. The branch gate is owed:
at the start the 15-minute load was 83, later 55 to 63, above 45 (`/` held 18 to 20 GB). PR #628 at `6d0a304d` (the
knowledge base's main merged in twice this round, the item 8 conflict resolved by keeping main's line and the PR's item
9; GitHub reads it MERGEABLE, CLEAN): `source hand-over` in 4, 3 and 3 lines of agents-first, principles and rules,
`own estate` once on each, `^9\. \*\*A source hand-over` once and `^8\. \*\*No person in the chat` once; the knowledge
base's `npm test` (exit 0, 172 passed) and `npm run verify:content` (exit 0, backlog 0 errors).

Round 38's fixes were checked on the working tree over head `a443fcb2` (this note's commit holds the same tree), each
exit code read on its own: `pnpm typecheck` (exit 0); `pnpm vitest run --coverage --coverage.include=src/source-rules.ts
--coverage.include=src/validate-cli.ts` over `source-rules`, `secret-shape`, `validate-cli`, `validate-cli-faults`,
`rule-tolerance`, `positive-sweep` and `consistency` (a first run exited 1: `src/source-rules.ts` at 99.84 % of its
branches, the non-object manifest of `foldOnlyExcludeTest` untested; with its test added, the same files without
`secret-shape` and `consistency` exit 0 at 100 %, its floor, and `secret-shape` with `consistency` exit 0, 26 passed;
`src/validate-cli.ts` at 99.47 % over these files against its 99.4 floor, `presentWithoutLink` and the fold-only path
fully covered); `pnpm exec tsx tools/vectors/run.ts` (exit 0, 29 files match; `source-tree.json` 71 tree and 10 patch
cases); the seam reading's check, a committed Git repository on this Mac holding `src/Private/notes.md` with a
key-shaped line under `exclude` `src/private/`: `pnpm --silent validate <dir> --kind source-tree` exits 0 with no
`FAC-SEM-158` and prints the `excluded-by-fold` line naming the file and `exclude[0]` (now a test, in Git mode and in a
walk); `pnpm run docs:check` (exit 0, 0 errors); `python3 docs/ux/lint.py` (exit 0);
`ORG_INDEX=... pnpm run privacy:check` (exit 0, 0 findings); no U+2014 in the added lines. The coordinator's cases:
with `exclude` `app/secrets/`, `app/keys/`, `app/strasse/`, `app/σx/`, `app/café/`, `app/å/` and `app/private/`,
`patchPathsAllowed` refuses `app/ſecrets/x`, the Kelvin-sign `app/Keys/k`, `app/straße/x`, `app/Σx/f`, `app/ςx/f`,
`app/CAFÉ/x`, the Angstrom-sign `app/Å/x`, `app/private/x` with a zero-width non-joiner, `app/private./x`, `app/private`
followed by a space, and `app/PRIVAT~1/x`, and allows `app/main.ts`; with `exclude` `app/Kit/` (Kelvin sign) it
refuses `app/kit/x` (a test and a vector each). The branch gate is owed: at the start the 15-minute load was about 44
and `/` held 3 to 4 GB free, under the 8 GB the gate needs. PR #628 at `e023f8fc` (the knowledge base's main merged in
first): `git show e023f8fc:knowledge/<page>.md` gives `source hand-over` in 4, 3 and 3 lines of agents-first,
principles and rules (rules section 9's "never publish" now names the hand-over exception), `own estate` once on each,
`^9\. \*\*A source hand-over` once and `^8\. \*\*No person in the chat` once in agents-first; the knowledge base's
`npm test` (exit 0, 172 passed) and `npm run verify:content` on the commit (exit 0, backlog 0 errors).

Round 37's fixes were checked on the working tree over head `033af3f9` (this note's commit holds the same tree), each
exit code read on its own: `pnpm typecheck` (exit 0); `pnpm vitest run test/source-rules.test.ts
test/secret-shape.test.ts test/validate-cli.test.ts test/consistency.test.ts` without coverage (exit 0: 2016 passed,
2 skipped); `pnpm vitest run --coverage --coverage.include=src/source-rules.ts` over `source-rules`, `validate-cli`,
`validate-cli-faults`, `rule-tolerance` and `positive-sweep` (`src/source-rules.ts` at 100 % of its branches, its floor;
a first reading at 99.5 % found two length guards written as `if` branches and the non-object manifest of
`patchPathsAllowed` untested, both fixed before this commit); `pnpm exec tsx tools/vectors/run.ts` (exit 0, 29 files
match; `source-tree.json` now 68 tree and 6 patch cases); `pnpm run docs:check` (exit 0, 0 errors); `python3
docs/ux/lint.py` (exit 0); `ORG_INDEX=... pnpm run privacy:check` (exit 0, 0 findings, after a new vector's home-path
text was replaced by binary files); no U+2014 in the added lines. The coordinator's check:
`patchPathsAllowed({format:'fabric-source/1',include:['app/','.GIT/'],exclude:['app/private/']},
['.GIT/hooks/post-checkout','app/PRIVATE/x'])` returns both paths and `--kind source-manifest` on the same manifest
reports `FAC-SEM-157` at `/include/1` (both now in `test/source-rules.test.ts`). The branch gate is owed: checked every
2 minutes from 12:16 to 12:36 UTC, eleven times, the 15-minute load stayed between 53 and 64 and `/` held 6 to 7 GB
free. PR #628 at `24cc7a34` (the knowledge base's main `8fe39d34` merged in, its item 8 conflict resolved by keeping
main's item 8 and the PR's item 9, with round 37's item 9, principles section 7 and rules section 9): `git show
24cc7a34:knowledge/<page>.md` gives `source hand-over` in 4, 3 and 2 lines of agents-first, principles and rules, `own
estate` once on each, `^9\. \*\*A source hand-over` once and `^8\. \*\*No person in the chat` once in agents-first;
the knowledge base's `npm run verify:content` (exit 0, backlog 0 errors) and `npm test` (exit 0, 172 passed).

Round 36's fixes were checked on the working tree over head `69a0ce8b` (this note's commit holds the same tree), each
exit code read on its own: `pnpm typecheck` (exit 0); `pnpm vitest run test/validate-cli.test.ts
test/source-rules.test.ts test/consistency.test.ts` without coverage (exit 1: 2002 passed, 2 skipped, two timed out at
vitest's 5 seconds under a 15-minute load near 85, the semantic fixture `access-log-disclosure-hourly-usage` and "counts
files[<index>] from 0 ...", neither touched here; run again alone with `-t`, both pass, exit 0); the two extended tests
pass; `pnpm exec tsx tools/vectors/run.ts` (exit 0, 29 files match); `pnpm run docs:check` (exit 0, 0 errors); `python3
docs/ux/lint.py` (exit 0); `ORG_INDEX=... pnpm run privacy:check` (exit 0, 0 findings); no U+2014 in the added lines.
The branch gate is owed again: checked every 2 minutes from 10:51 to 11:11 UTC, eleven times, the 15-minute load stayed
between 86 and 126 and `/` held 2 to 7 GB free. PR #628 at `7ac0b217` (the knowledge base's main merged in at
`a0560056`, then item 9's definition and home carve-out, principles section 7 and rules section 9): `git show
7ac0b217:knowledge/<page>.md` gives `source hand-over` in 4, 3 and 2 lines of agents-first, principles and rules, `own
estate` once on each, `^9\. \*\*A source hand-over` once and `^8\. \*\*No person in the chat` once in agents-first;
the knowledge base's `npm run verify:content` (exit 0, backlog 0 errors) and `npm test` (exit 0, 172 passed).

Round 35's fixes were checked on the working tree over head `47d66a15` of `agent/ct194-source-manifest-v2-20261104`
(this note's commit holds the same tree), each exit code read on its own: `pnpm typecheck` (exit 0); `pnpm vitest run
test/validate-cli.test.ts test/source-rules.test.ts test/consistency.test.ts` without coverage (exit 1: 2003 passed, 2
skipped, one failed, `source-rules`' "reads source-manifest in time linear in its lists", which timed out at vitest's
default 5 seconds under a 15-minute load near 120); that `it.each` now sets the explicit 180 000 ms timeout its siblings
set, its linearity assertion unchanged (DEC-0151's round-16 seam reading, relayed by the coordinator), and then `pnpm
vitest run test/source-rules.test.ts -t 'in time linear in its lists'` (exit 0, 2 passed) and the whole file (exit 0,
168 passed) pass, with `pnpm typecheck` again exit 0; `pnpm exec tsx tools/vectors/run.ts` (exit 0, 29 files match); `pnpm run
docs:check` (exit 0, 0 errors); `python3 docs/ux/lint.py` (exit 0); `ORG_INDEX=... pnpm run privacy:check` (exit 0, 0
findings); no U+2014 in the added lines. The two new tests (an unreadable subfolder and an empty folder under a source
kind named by their absolute paths; `--kind source-manifest`'s scope over an extra member) pass. The branch gate (`tsc`, `vitest --coverage`, UX, docs, privacy, vectors) is owed: checked every 2 minutes
from 02:32 to 02:52 UTC, eleven times, the 15-minute load stayed between 116 and 156 and `/` held 4 to 7 GB free, never
under 45 and at least 8 GB; the coverage floor of `src/validate-cli.ts` is therefore not re-measured on this tree. Probe: a
manifest that lists its own key-holding file under `unchecked` exits 0 under `--kind source-tree` (exit 1 without the
entry). PR #628 at `27549ae7` (the knowledge base's main merged in at `e1ec78e0`, then the lists and the organization
sentence): `git show 27549ae7:knowledge/<page>.md` gives `source hand-over` in 4, 3 and 2 lines of agents-first,
principles and rules, `own estate` once on each, `^9\. \*\*A source hand-over` once and `^8\. \*\*No person in the
chat` once in agents-first; the knowledge base's `npm run verify:content` (exit 0, backlog 0 errors) and `npm test`
(exit 0, 172 passed).

Round 34's fixes were gated on the working tree over head `69f6b067` of `agent/ct194-source-manifest-v2-20261104`
(this note's commit holds the same tree), each exit code read on its own, under the session's lock for heavy runs,
after waiting for the limits (the 15-minute load under 45 and at least 8 GB free on `/`, checked again once the lock
was held: 44.61, 8 GB; seven earlier checks two minutes apart found 0 to 6 GB free or a load above 45): `tsc --noEmit
-p .` (exit 0); `pnpm vitest run --coverage` (exit 0: 113 files, 10154 passed, 3 skipped, the whole suite; branches
98.93 % over the set, every per-file floor met); `python3 docs/ux/lint.py` (exit 0); `pnpm run docs:check` (exit 0, 0
errors); `ORG_INDEX=... pnpm privacy:check` (exit 0, 0 findings); `pnpm exec tsx tools/vectors/run.ts` (exit 0, 29
files match); no U+2014 in the added lines. On PR #628's head `d04df3ff` (`git show d04df3ff:knowledge/<page>.md`):
`source hand-over` in 4, 3 and 2 lines of agents-first, principles and rules, `own estate` once on each,
`^9\. \*\*A source hand-over` once and `^8\. \*\*No person in the chat` once in agents-first. Probes:
`--kind source-manifest` on a manifest with an extra member exits 0 (only `FAC-SEM-156` and `FAC-SEM-157`), while
`--kind source-tree`, a plain run and `--kind source-manifest --schema fabric-source` report the member (exit 1); a
relative folder under `--kind source-package` prints the absolute path of its `fabric.source.json` in each
`FAC-SEM-160` line (now a test). The folder routes under `--kind source-tree` read as round 32's probes found, and a
file's named manifest reads `cannot read .: ENOTDIR` without the folder's path.

## Next task

The landing continues on `agent/ct194-source-manifest-v2-20261104` (step 1 is done: one commit with the reviewed tree
on the merge base `d1b905ee`, the review branch's remote ref deleted; never push the review branch again). The
remaining steps, in order:

1. Acquire the task lease CT-194 before each register commit (and before steps 5 and 6) and release it after the push;
   the register commits go under it, which the guard accepts. A released lease leaves no ref, so its absence between
   rounds is expected. This run's path leases on `docs/DECISIONS.md`,
   `docs/specification/conformance.md` and `docs/backlog.md` expired and cannot be reaped by this session; re-take
   them only if agent-sync accepts them, and then `git ls-remote origin 'refs/agent-sync/leases/*'` lists them before
   the step 5 commit.
2. Before this step, bring PR #628 up to the knowledge base's main (the coordinator's round-39 note asks for it rebased:
   its item 8's last line differed and GitHub read its mergeability as UNKNOWN; this run merged main in again, last at round 58 into `20b00209` (the PR's head), which carries main's `f9ed924f`,
   and a rebase of that shared branch would take a force-push, which the rules forbid, so re-measure and merge main
   in again if it moved). PR #235 (DEC-0148) and DEC-0150 are already on main (`1016f0ec` when re-measured in round
   50), so nothing is refreshed for them. Merge the current `origin/main` (re-measure its head at landing) into the fresh branch
   as the merge notes below say, refreshing the sibling heads. Close it with the merge notes' greps and with
   `grep -n '^\*\*Next free' docs/DECISIONS.md docs/specification/conformance.md`, whose DEC and `FAC-SEM` markers
   must equal the next free ids the CAS counters hold (`refs/agent-sync/ids/` on `origin`): a merge keeps a stale
   marker without a conflict (re-measured in round 49: main's markers at `1016f0ec` read `DEC-0154` and `FAC-SEM-169`,
   equal to the counters, whose next values were 154 and 169; read both again before landing, since a branch that
   reserves an id moves the counter and not main's marker).
3. Re-run the full gate on that merge and cite its commit in this handoff. Open the PR from the fresh branch and
   dispatch the CI workflow once on it (`gh workflow run ci.yml --ref agent/ct194-source-manifest-v2-20261104`); read
   every matrix job (ubuntu-latest on Node 22 and 24, windows-latest and macos-latest on Node 24, macos since #238):
   the Linux-only non-UTF-8 test and the Windows-only `git.exe` test have never run, and the ubuntu job's coverage line
   for `src/validate-cli.ts` (99.44 % against its 99.4 floor on macOS) must be read too.
4. Run the next rounds of the readings (unit, seam, product) on that merge until two clean rounds; the chain with
   DEC-0151 is re-gated after it refreshes (DEC-0151 now reads the `sk-` test keys; DEC-0150 is on main). That
   re-gate expects the two `test/channel-agent.test.ts` tests that fail on main until DEC-0151 lands (the round-52
   seam reading's finding; DEC-0151's lander restates them), and nothing else red.
5. Make the acceptance edit on the PR branch, as DEC-0147 did (DEC-0149's status line, CT-194 done, this handoff's
   status and the `docs/handoffs/README.md` row); then run the merge gate (`pnpm run check`, each part's exit code
   read) on that head, with its output in the PR. That head is the one that merges; nothing merges before this step.
6. Pair PR #628 only with a contract head that carries the same round of the readings (the round named in DEC-0149's
   status line and in RM-36's "Restated 2026-11-05" line in the PR's `knowledge/roadmap.md`, not its last commit,
   which may be a merge of main), and re-read the pair on the round-40 and round-41 points before landing.
   First re-measure the knowledge base's PR #628 (CT-211's amendment) against the knowledge base's main (`f9ed924f` at
   round 58, merged into the PR as `20b00209`): if it is behind, merge main into it (never a rebase or a force-push),
   keeping main's item 8 as main has it and the PR's item 9, and set the round named in RM-36's "Restated 2026-11-05"
   line to the landing round. Then merge PR #628, fetch the knowledge base
   checkout (`git fetch origin`), and run its three greps on the knowledge base's main (`git show
   origin/main:knowledge/agents-first.md | grep -n 'source hand-over'`, the same for `knowledge/principles.md` and
   `knowledge/rules.md`; at PR #628's head `20b00209`, which carries the knowledge base's main, they print 4, 3 and 3
   lines, rules section 9's "never publish" sentence having gained the hand-over exception in round 38), and `grep -c 'own estate'` on the same three pages
   (1 each), and `grep -c '^9\. \*\*A source hand-over'` on agents-first (1 line). There the rule's home is
   agents-first item 9, "A source hand-over takes the operator's word on that act" (main's own item 8 is "No person in
   the chat: no production step"): items 5 and 7 point to item 9, and principles section 7 and rules section 9 cite
   item 9. Then merge the
   contract PR straight after, in the same
   landing session (PR #628's links point at `source.md#handing-over` on main). If main moved after step 5, merge it and
   re-run the merge gate before merging PR #628. If the contract PR cannot merge in that session, do not merge PR #628
   (or revert it at once) and record the wait.
7. A human gate: asking GitHub to remove the review branch's unreachable commits and their cached views is the
   operator's (GitHub Support).

At landing, write DEC-0149's merge date into source.md's line paragraph where it says "on its merge date, written here
at landing" (and in DEC-0149 item 12's round-45 sentence). At landing, file a backlog row (the next free CT id above
every open branch and main) to inventory the personal agent
homes, and any copy of them within the operator's estate (private mirrors, second private repositories), that people
outside the operator can read, for the operator to review: information, not a gate, since access
the operator gave before the rule stands as the operator's own act (DEC-0149 item 12, round 44). At landing, also file a backlog row under the next free CT id then: "`unchecked` covering a credential finding exits 0
(probe)", its evidence the round-35 probe (a manifest listing its own key-holding file under `unchecked` exits 0 under
`--kind source-tree`, exit 1 without that entry), asking the checker to refuse such an entry. The lander writes the enforcing row's CT id
into SCN-054 step 3, where it says the enforcing row is filed at landing, and both rows' ids (this row and the
inventory row) into this note's Open line, in the landing change. The release notes of the landing carry one more
item: a plain `pnpm validate <dir>` skips a `.json` file that is a FIFO, a socket or a device with a `note/skipped`
line saying it is not a file (SCN-002's errors line).

Right after the merge: close CT-211 with the three greps' outputs; add the contract's row in the knowledge base's
`knowledge/products.md` for the release that carries DEC-0149, with the release decision (the version tag, as DEC-0150's
`v0.1.0+2026-11-05.2` was); check fabric-workspace's RM-36 entry on its main (PR #628 carries, since round 47, the dated line under "Decided
2026-11-03" restating the export: one new commit whose only parent, if any, is the earlier export commit the recipient
holds, and no commit from the home; and a "Waiting on" line naming no branch), rewrite that "Waiting on" line to the
adapter's FAA-188 part 2 (the contract's CT-207) and Fabric's "give as source" action (CT-208) alone, DEC-0149 having
landed, update its summary row's state and its
knowledge base's `knowledge/integration.md` paragraph on portable agents (which records RM-36),
publish with `node scripts/workspace.mjs sync` from a Fabric checkout, post DEC-0149 to threads `21ac4057` and
`0a8776f2` with CT-207 and CT-208, and file the Fabric Dashboards request on its attention and degraded counts of agents
whose entries are all setup states as a tracked row on their side, recording its id in CT-208.

At their next re-pin, the consumers that vendor a protocol table (a
private product's `src/contract/vendor/protocol-revisions.ts`, a deployment template's
`src/fabric/fabric-protocols.mjs`, another server's `src/fabric/fabric-protocols.mjs`) add `fabric-source`; Fabric
Dashboards' sample service (`fabric_protocols.py`) is updated at its re-sync, or recorded as not held equal to the
register. The adapter kit's copies of the table (`fabric_protocols.py` and `fabric-protocols.mjs` in agents built on
the kit) take `fabric-source` at the kit's next re-vendor (CT-207). `fabric-source/1` is a file format that no service
declares, so a stale table has no wire effect.

PR #236 is merged (main has moved since; its Test row in `AGENTS.md` now says Linux, Windows and macOS). PR #235
(DEC-0148) and DEC-0150 (`origin/agent/channel-agent-ext-v3-20261104`) are merged into main, which was `1016f0ec` when
re-measured in round 50. DEC-0153 has landed too: PR #244 merged 2026-11-06 into main `eac1a594`, released as
`v0.1.0+2026-11-06.1`. The chain of the open branches that touch the same registers is DEC-0149 (this branch), then
`origin/agent/sqd-fields-20261104` (DEC-0151), then DEC-0152 (head `d760f756` when written: `docs/DECISIONS.md`,
`docs/specification/conformance.md`, `docs/DOCMAP.md`, `docs/backlog.md`, the handoffs index). Every head here is
re-measured at landing.

### DEC-0153 is on main: the steps of this landing's merge

DEC-0149 lands after DEC-0153, so the steps below are no longer conditional: they are steps of DEC-0149's landing merge
with `origin/main`, read from the section "Left to the landers of DEC-0149 and DEC-0151" of DEC-0153's handoff on main
(`docs/handoffs/2026-11-04-ops-digest.md` at `eac1a594`), which gives each with its check:

1. The fold: `foldDir = (dir) => foldPath(dir)` in `src/ops-digest.ts`, deleting `NUSKHURI`, `toMkhedruli` and the
   local copy of the code points HFS+ ignores there; the parity comment in `test/ops-digest.test.ts` reworded. The
   merge post then says that `src/ops-digest.ts` imports `./source-rules.js`, so a consumer copying `ops-digest.ts`
   needs `source-rules.ts` beside it. After the fold step, `ops-digest.md` says the fold is `source-rules`' `foldPath`
   (`src/ops-digest.ts` imports `./source-rules.js`).
2. The JWT test: `digestFoldersRules` calls `hasJwt` in place of `JWT_SHAPE.test`, the import dropped, and the OD-2
   and `FAC-SEM-167` sentences of `ops-digest.md` name `hasJwt`.
3. The mirror lines: every in-progress marker after a DEC-0149 citation on main dropped (ops-digest.md, the comments
   of `src/ops-digest.ts`, the parity comment of `test/ops-digest.test.ts`), the DEC-0153 marker in source.md's
   setup-answer sentence dropped, and an "Annotated (<date>)" line under DEC-0153 saying DEC-0149's "Starting without
   the instance" has landed (DEC-0153 is Accepted, so its items stay as written).
4. The home-path glosses: source.md's sentence, its twin in the `SOURCE_HOME_PATHS` docstring and the comment above
   the `hasHomePath` assertions in `test/source-rules.test.ts` take DEC-0153's reading of `hasHomePath`; the scope
   comments of `src/activity-rules.ts` and `src/proposal-rules.ts` keep DEC-0149's side.
5. The schema count in `test/schema-compilation.test.ts`: 151 (150 on main with DEC-0153, one for DEC-0149).

The bullets below that still say "whichever lands second" for DEC-0153 are these steps; this branch does not merge
main before its landing merge, so they are done there. DEC-0150 and DEC-0151 reserved DEC-0150, DEC-0151 and FAC-SEM-162 to FAC-SEM-165.
The channel-agent branch adds `schemas/service-channel-agent-extension.schema.json` and edits `src/semantic-rules.ts`,
`src/protocol-revisions.ts`, `vitest.config.ts`, `fixtures/catalogue.json` and `src/secret-shape.ts` (`rawValues` only);
the sqd-fields branch edits `schemas/support-quality-daily.schema.json` but adds no schema, and edits
`fixtures/catalogue.json`, `src/secret-shape.ts` and `src/session-handoff.ts`. What a textual merge gets wrong, or gets wrong silently:

- The schema count in `test/schema-compilation.test.ts`: each side writes its own count, so a merge reads wrong
  silently; whichever lands last sets it by hand to the full count: 151 once DEC-0149, DEC-0150 and DEC-0153 are all
  on `main` (150 on `main` at `eac1a594` with DEC-0150 and DEC-0153, one for DEC-0149; earlier: 147 with DEC-0150, three for DEC-0153 with its OD-9 schema, on
  `agent/ct219-ops-digest-20261104` at `cc1fc853`, or its head at landing); re-count the files under `schemas/` then.
- `src/extensions.ts` and `test/consistency.test.ts` ("G-08: one spelling of every extension key"): DEC-0150 adds the
  key `channel-agent/0.1` and DEC-0153 a ninth key with OD-9; the second to land keeps both constants, both test
  entries and both rows of `interop.md`'s key table, and writes "nine extension keys" there.
- Where DEC-0150 and DEC-0151 meet each other, `docs/DOCMAP.md` and `docs/specification/support-quality.md` conflict:
  follow DEC-0151's meeting list. Keep DEC-0151's thresholds line and drop the "Not decided here" bullet; in DOCMAP,
  DEC-0151's support-quality row first, then DEC-0150's channel-agent row. Check: `grep -c 'DEC-0151 (in progress)
  lands' docs/specification/support-quality.md` prints 0 on the merged tree. The file lists in these notes are
  refreshed at landing against the siblings' heads then.
- `docs/backlog.md` (against all four siblings) and `docs/handoffs/README.md` (against DEC-0150 and DEC-0151)
  conflict as appends at the tail: keep both sides; the merged backlog tail is kept in id order, whatever main holds at the merge
  (re-measure at landing; CT-200 to CT-225 on main's head `1016f0ec`, re-measured in round 51); the handoffs index is newest first, so at each merge the later-landing branch's row goes above.
  DEC-0151's edited files also include `src/connections.ts` (a comment) and `docs/specification/conformance.md` (the
  secret-shape reference row). DEC-0150's small edits to `src/validate-cli.ts`
  and `test/validate-cli.test.ts` merge cleanly beside this branch's.
- `vitest.config.ts`: `include` takes the union of every branch's list, and `thresholds` keeps `src/validator.ts`,
  `src/source-rules.ts` and `src/channel-agent.ts` at 100; DEC-0153's lander keeps the union include line plus
  `src/ops-digest.ts`'s floor (DEC-0153's own handoff carries its sibling notes, at `cc1fc853` or its head at landing). A
  threshold key that matches no included file used to pass silently; `test/consistency.test.ts` ("the coverage
  floors") now fails on one.
- `fixtures/catalogue.json`: all three branches add entries; add the comma where they meet.
- Whichever of DEC-0149 and DEC-0153 lands second makes `foldDir` in `src/ops-digest.ts` read `(dir) => foldPath(dir)`
  (this branch's fold, NFD first and the Georgian step included) and removes the constants it then leaves unused; if
  `hiddenDir` still needs the code points HFS+ ignores, it imports `stripHfsIgnorable` or the non-global
  `HFS_IGNORABLE_CHAR` from `src/source-rules.ts` (round 48: the global `HFS_IGNORABLE` stays private there, since a
  shared global pattern keeps `lastIndex` between `test` calls); `pnpm typecheck` must exit 0.
- Textual conflicts with DEC-0153's landed tree are expected in the scope comments of `src/activity-rules.ts` and
  `src/proposal-rules.ts` (both end "Changing any of them is a decision." on both branches, and this branch names
  `SOURCE_HOME_PATHS` as the fourth boundary before it): take DEC-0149's side; and in `test/rule-tolerance.test.ts` and
  `test/positive-sweep.test.ts`, where both sides add cases: keep both. In `test/rule-tolerance.test.ts` DEC-0149's
  `"source-package"` entry takes a trailing comma before main's ops-digest entries; in `test/positive-sweep.test.ts`
  the one-line sources array becomes one list, main's list plus `"source-rules"`.
- The adapter's `SECRET_FILE` and `TOKEN_FILE` (CT-207) are to read a file's name folded as the contract's credential
  files are since round 52 (the code points HFS+ ignores removed, ASCII case folded, any trailing run of dots and spaces
  dropped), so `KEY.PEM` or `.env.` blocks there too, while `SECRET_FILE_OK` matches only the name as written, in lower
  case (round 53), so `.ENV.EXAMPLE` blocks too; parity in both directions is CT-207's.
- The CT-109 register lands with DEC-0149 itself, not with whichever lands second: `SOURCE_HOME_PATHS`
  (`src/source-rules.ts`) is the fourth home-path boundary as soon as DEC-0149 is on main, and DEC-0153 adds none
  (`FAC-SEM-167` and `FAC-SEM-168` reuse `hasHomePath`). This branch already rewrites every copy that counts the
  boundaries: the scope comment in `src/activity-rules.ts`, activity.md's "Its scope (CT-109)", `devices.md`'s check-in
  paragraph, `proposals.md`'s boundary paragraph, `src/proposal-rules.ts`'s scope comment, the
  `schemas/device-common.schema.json` `$defs.detail.$comment`, and the backlog's CT-109 row (which names the five places that count the boundaries and the `$comment`'s
  pointer). The `$comment` is count-free and byte for byte DEC-0153's line at `cc1fc853` (pointing to the scope list in
  `src/activity-rules.ts`, ending "Changing any of them is a decision."), so both branches carry the same line and the
  second landing has no conflict there; the scope comments in `src/activity-rules.ts` and `src/proposal-rules.ts` end
  with the same sentence on both branches, this one naming `SOURCE_HOME_PATHS` as the fourth boundary before it. Checks on the landed tree: `grep -c SOURCE_HOME_PATHS src/activity-rules.ts docs/specification/activity.md`
  prints at least 1 for each, and `grep -rn -E 'three home-path|any of the three' src docs/specification schemas`
  prints nothing. The owner split: this landing owns those copies; DEC-0153's lander keeps only its own source.md
  sentence on `hasHomePath`. The `hasHomePath` gloss matching `values that (must )?hold no path at all` stands in three
  places on this branch (source.md's home-folders paragraph, the `SOURCE_HOME_PATHS` docstring in
  `src/source-rules.ts`, and a comment in `test/source-rules.test.ts`); whichever of DEC-0149 and DEC-0153 lands second
  rewrites all three to DEC-0153's reading of `hasHomePath` (DEC-0153's handoff says the same). Check after both land:
  `git grep -n -E 'values that (must )?hold no path at all' -- src docs/specification test` prints nothing.
- `docs/specification/conformance.md`: keep this branch's actions row and append DEC-0150's two conformance rows (the
  declaration and CA-8) after it (check: `grep -c '^| an agent that answers people on a channel'
  docs/specification/conformance.md` prints 2). In the
  reserved-codes paragraph keep this branch's `FAC-SEM-161` sentence, add DEC-0150's sentence on `FAC-SEM-162` to
  `FAC-SEM-165` (receipts SEM-0162 to SEM-0165), and drop the sentence saying codes are reserved by open branches;
  check: `grep -n 'reserved by open branches' docs/specification/conformance.md` prints nothing.
- `docs/DECISIONS.md`: DEC-0148 through DEC-0153 in id order, a blank line before each heading (markdownlint MD022).
  The rule register: `FAC-SEM-155`, then `FAC-SEM-156` to `FAC-SEM-160`, then the `FAC-SEM-161` note, then
  `FAC-SEM-162` to `FAC-SEM-168` (docs-check G-13).
- The next-free markers (`docs/DECISIONS.md`, the register in `conformance.md`) are written by whichever lands later
  from the CAS refs at merge time, never from a fixed value: `git ls-remote origin 'refs/agent-sync/ids/*'`, then
  `git cat-file -p <sha>` for each (at the time of writing, DEC next 154 and SEM next 169, DEC-0153's OD-9 having taken
  `FAC-SEM-168`; read the CAS refs at merge). Where the register's marker and the counter differ, the lander keeps the
  higher of the two (the coordinator's round-38 decision): a lower marker would hand out a code already reserved.
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
- DEC-0150 is on main (PR #243, `1016f0ec`), so this branch lands second and does every step DEC-0150's handoff
  (`docs/handoffs/2026-11-04-channel-agent.md`, "Merging beside the branch of CT-194") gives the second lander, each
  with its check:
  - With DEC-0153 (DEC-0153's round-21 relay): whichever of DEC-0149 and DEC-0153 lands second switches `JWT_SHAPE.test`
    to `hasJwt` in DEC-0153's `src/ops-digest.ts` `digestFoldersRules` and drops the import. Check after both land:
    `grep -c JWT_SHAPE src/ops-digest.ts` prints 0.
  - `src/channel-agent.ts` `keyShaped` from `JWT_SHAPE.test` to `hasJwt`, and `JWT_SHAPE` dropped from its import of
    `./secret-shape.js` (`noUnusedLocals`); CT-212 unchanged. Check: `grep -c 'JWT_SHAPE' src/channel-agent.ts`
    prints 0 and `pnpm typecheck` exits 0.
  - The in-progress sentence (`channel-agent.md` at its lines 308 and 309 on main) states DEC-0149's tree check as
    current: "any `sk-` at a word start followed by 16 or more name characters, in any case" (`FAC-SEM-158`), with no
    "in progress" for DEC-0149. Check: `grep -c 'DEC-0149 in progress\|DEC-0149.s source tree check, in progress'
    docs/specification/channel-agent.md` prints 0.
  - The bare `--schema service-channel-agent-extension.schema.json` path runs instance-free: the switch ORs that
    schema into `formatSchemaErrors`' `instanceFree` option only, never into `sourceCheck`; the second sentence of
    `hint/declaration-only` reads "A bare declaration's lines may name a map key as written (a language tag shaped like
    a credential included) and print one line per item, since widths are not checked first here."; and its five
    dependents change in the same step: `readerHints`' text and its comment in `src/validate-cli.ts`, the 'may name its
    members as written' assertion in `test/validate-cli.test.ts`, `channel-agent.md` "Where it is declared", SCN-002's
    errors line in `docs/ux/scenarios.md`, and CT-209's "Owed as a follow-up" text in `docs/backlog.md`, marked done
    in the landing change. Check: a declaration with `texts.final["sk-Latn-150-u-ca-gregory"] = 5` prints a hint
    naming map keys, and `grep -n 'as written'` on the page and in the scenarios matches the landed output.
  - The collapse assertion in `test/validate-cli.test.ts`: a bare declaration with an undeclared member whose name is
    an `sk-` key built at run time, at the top and under a channel, prints "has a member the schema does not define"
    at its object, exits 1 and never contains the name.
  - `src/validator.ts` at its line 96: its comment names the bare channel-agent path among the instance-free ones.
  - The schema count in `test/schema-compilation.test.ts`, in its three places (the title, `toHaveLength` and the
    Set size): 151, since DEC-0153 is on main too (150 there), set by hand at the landing merge.
  - SCN-054 and SCN-055 both kept: `grep -c '^### SCN-05[45]' docs/ux/scenarios.md` prints 2, and SCR-03 lists
    "SCN-001, SCN-002, SCN-054, SCN-055".
  - DEC-0150's two conformance rows appended after this branch's actions row (the declaration and CA-8): `grep -c '^|
    an agent that answers people on a channel' docs/specification/conformance.md` prints 2.
  - DEC-0150's own landing greps kept: `grep '^| CT-220' docs/backlog.md | grep -c CA-8` prints 1, and `grep -c
    'include: \["src/' vitest.config.ts` prints 1.
- Whoever lands second of DEC-0149 and DEC-0151 keeps DEC-0151's "cannot export its source" and `channel-agent.md`'s
  "would still block a source export" as written: they agree with `source.md`'s registry-alias paragraph.
- `source.md` says "(DEC-0151, in progress)" and "(DEC-0153, in progress)". Whichever of DEC-0149 and DEC-0153 lands
  second drops "in progress" from both pages (`source.md`, and `ops-digest.md` OD-3); in the
  register, which is append-only, it annotates DEC-0153's decision text if DEC-0153 is already accepted and edits it if
  it is still Proposed. The same for DEC-0149 and DEC-0151.
- At landing, add to CT-218's row: a deploy of an agent to a placement its owner holds (the local or the cloud form)
  is no source hand-over, an organization's agent on that organization's placement included; a personal agent's source
  on an organization's or a team's placement, or on one other people can read, stays a hand-over; serving the running
  agent to a team (`peer`, client keys, the one-time code) gives no one the tree and is no hand-over. These are the
  coordinator's round-37 decisions, written in [handing over](../specification/source.md#handing-over)'s line
  paragraph and in the knowledge base's agents-first item 9, "A source hand-over takes the operator's word on that
  act" (linked in the row in the backlog's own form, `specification/source.md#handing-over`). Check with
  `grep '^| CT-218 ' docs/backlog.md | grep -c 'specification/source.md#handing-over'`, which prints 1 on the landed
  tree.
- `AGENTS.md`: the Check row's exit wording follows the README ("exit 0 when there is no blocking problem (accepted
  lines may print)"); keep it when main's rows are merged in.
- At the DEC-0150 step, `docs/ux/screens.md` SCR-03 keeps "SCN-001, SCN-002, SCN-054, SCN-055", and `CONTEXT.md` and
  `docs/ux/scenarios.md` change on both sides: keep both.
- Landing edit (DEC-0150 is on main, so there is no lander to tell): CT-224's row in `docs/backlog.md` gains the two
  remedies, an exportable channel agent keeping its declaration in the served well-known document (the instance), or
  taking `token_slot` and the per-project entries from slots, since both are installation strings in
  [source](../specification/source.md#installation-strings)'s sense and would otherwise block a source export, linked
  in the row's own form (`specification/source.md#installation-strings`). Check: `grep '^| CT-224 ' docs/backlog.md |
  grep -c 'source.md#installation-strings'` prints 1.
- At landing, carry two corrections of DEC-0150's landing post: its FAA-197 item quotes two phrases that are not on
  the landed `channel-agent.md` ("acts only inside that chat as section 4.10 says" and "no AP-3 or OA-2 source", each
  `grep -c` 0 on main at `1016f0ec`), so the post quotes CA-8 as the page stands; and its merge post's "together with
  `fabric-source`" becomes true only when DEC-0149 lands, which this landing makes true (say so in DEC-0149's post).
- At landing, file a row in the knowledge base for its owner: `knowledge/authority.md` still says an outage is told
  after more than 5 minutes of a service being unavailable or degraded, while `service.md` cites Fabric Dashboards'
  FD-76 (15 minutes, unavailability only).
- At the DEC-0150 step, confirm DEC-0150's lander filed the backlog row (`grep -c 'installation-valued'
  docs/backlog.md` prints 1 on the merged tree) on how a channel
  declaration's installation-valued members (`tickets.token_slot`'s vault project and env, `evals.spend_record`, the
  per-project entries) relate to source slots: the token slot's name is a `secret` slot; the vault project, the env and
  the spend record are `config` slots or live in the descriptor or the well-known answer; or the declaration is
  instance data kept out of the source.
- The adapter re-vendors the shared detector before or with its `pack` writing `secrets[]` from slots (CT-207).
  `FAC-SEM-156` reads a slot's name and purpose with both detectors (the shared `secretValue` and the tree check's own
  reading), so no purpose it passes is refused by a pack that vendors the shared detector at this branch's version; the
  re-vendoring is still owed (CT-207) so that the adapter's pack keeps parity with the shared detector after DEC-0151.
- `test/secret-shape.test.ts` is an add/add conflict with DEC-0151 (`agent/sqd-fields-20261104`), and a plain keep-both
  drops a `});` (TS1005). Keep both `describe` blocks in one file, each closed, under one import of `{ JWT_SHAPE,
  SECRET_VALUE, hasJwt, jwtSpans, secretArgument, secretUrl, secretValue }` from `../src/secret-shape.js` plus
  `evaluateSemanticRules`. Check on the merged tree: `grep -c '^describe(' test/secret-shape.test.ts` prints 2, and
  `pnpm typecheck` exits 0.
- `src/secret-shape.ts` conflicts textually with DEC-0151 (`origin/agent/sqd-fields-20261104`). The resolution: this
  branch's JWT helpers (`jwtSpans`, `hasJwt`), then DEC-0151's doc comment and `SECRET_VALUE` line as pushed (being
  rewritten as a portable consuming-group boundary plus a strength rule for `sk-`). Its copy in `src/session-handoff.ts`
  follows DEC-0151. The tree check keeps its own unbounded
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
