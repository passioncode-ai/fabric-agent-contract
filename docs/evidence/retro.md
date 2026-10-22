# Retrospective

## Standing instructions

- A protocol claim is not current unless its revision and retrieval date are recorded.
- A compatibility check must be observed rejecting a planted incompatible fixture before its green result counts.
- A learning is created from a failed attempt beside a verified correction, never from a successful run alone.
- A run may propose a prompt, pipeline, or policy change but may not mutate the rules governing itself.
- A conformance probe for a placement reached through a platform is accepted only after it has run against a real instance behind that platform, not only against a sample the run itself wrote.
- A reference function that answers for a schema is tested against that schema on the same inputs: every output it emits validates, and every input the schema refuses it refuses.
- A check made stricter than it was (a closed schema, a new refusal) is run first against the consumers' real files on this machine; what they carry is either accepted or recorded as an exception before the change lands.
- A rule that decides by several signals (which schema a file follows, which manifest a pair reads) is written once as an ordered table in the code's order, with a test per row, before it is changed again.
- A rule that decides what another rule already decides (an expiry, a key's window) calls that rule, never a copy of its condition; and a decision is read blind before it merges, not after a run of merges.

## Run stamps

- `2026-08-26-contract-build` — local implementation commit `5a7b4fb`;
  published by merged PR #1 at `489737051828fafec92463df04b6a6fd3280c7b7`.
- `2026-08-26-adoption` — Fabric consumer PR #1 merged at
  `5bb98740c84b006e0ef4f1509ec66018623d75cd`; navigation-only wiki cards written.
- `2026-08-27-memory-kernel` — approved architecture committed at `0d1171f`;
  publication receipt is recorded by the private repository workflow.
- `2026-08-27-provider-guide` — compatible provider guide committed at `cb638b1`;
  no new executable mechanism or failure/correction contrast was introduced.
- `2026-10-02-remote-service` — contract `2ce3922` (DEC-0019); adapter `447b558` v0.6.0 and
  `d3a4c67` v0.6.1; Fabric Dashboards `f6cde69` v0.4.0 and `75eba78` v0.4.1; acceptance in
  `docs/evidence/runs/2026-10-02-remote-service/acceptance.md`.
- `2026-10-04-capability-names` — `ccdbfc3`, `df55c8c` (DEC-0020).
- `2026-10-04-usage-report` — `c220147`, `9091d3d` (DEC-0021).
- `2026-10-05-project-comms` — `bb55fbf`, `b8453f4`, `d4c8831` (DEC-0022, accepted; DEC-0023, DEC-0024 merged in).
- `2026-10-07-runner-routes` — `6e3c3f7` (DEC-0026), `058fb78` (DEC-0029).
- `2026-10-07-spending-limits` — `94b1829` (DEC-0027).
- `2026-10-08-settings-backup` — `0dea0e4` (DEC-0025).
- `2026-10-08-activity-devices` — PR #22, `623bf61` (DEC-0030, DEC-0031).
- `2026-10-10-services-every-system` — PR #23 `3168503` (DEC-0032), PR #24 `78b2da0` (DEC-0033).
- `2026-10-10-operator-channel` — PR #25 `73c7978` (DEC-0034), PR #26 `52da526` (DEC-0035).
- `2026-10-11-embedded-dashboard` — PR #27 `a83bec6` (DEC-0036).
- `2026-10-11-spend-and-delegation` — PR #28 `934ca60` (DEC-0037), PR #29 `1e7a7d6` (DEC-0038), PR #30 `8e49fbd`
  (DEC-0039, DEC-0040).
- `2026-10-11-meter-and-handoff` — PR #32 `7931c1d` (DEC-0041), PR #31 `213e5a3` (DEC-0042).
- `2026-10-11-board-waves` — PR #33 `2afbe60` (inventory, canvas, six waves); wave 1 in PRs #34…#38 and this one.
- `2026-10-12-board-waves-close` — waves 2–6 in PRs #39…#81; the last wave closed at `d54b69a` (DEC-0043…DEC-0075, without
  DEC-0073); 193 inventory items, 151 closed, 42 open: 37 in the program and 5 wave-1 board items without a row, given rows or
  receipts by the w7 close (`2026-10-12-w7-final`).
- `2026-10-18-share-registration`: PR #117 `b89cb94` (DEC-0086) after seven readings in four rounds and three fix rounds; #118, #119.
- `2026-10-19-job-limits`: PR #120 `027a01c` (DEC-0087, squash) after five readings in three rounds; #121.
- `2026-10-19-enterprise-cloud`: DEC-0088 (this run's pull request).
- `2026-10-20-final-pass`: DEC-0089 to DEC-0095 merged as #124, #127, #128, #129, #130, #131, #132 (main `3d8cb17`).
- `2026-10-21-contract-review`: PR #137 (REQ-01 to REQ-18, no decision); readings until two clean rounds.

## Recent log

### 2026-10-22: Four decisions in one afternoon, then their readings (DEC-0098 to DEC-0102)

- **Goal:** CT-81, CT-82, CT-88 and CT-83 merged ahead of their dates.
- **Failed attempt:** each was merged after its gate and its own plants, without the blind readings the plan promised.
  The three readings of the range found thirteen breaks: two rules that decide one thing disagreed (a repair's policy
  expiry and `FAC-SEM-068`; a repair's key and `FAC-SEM-041`), a grace judged by the requester's own clock, SR-5a
  holding back a withdrawal, a context the routing rule forbids, and seven documents left false. Twelve of thirty
  plants survived, and `repairDecision` threw on a schema-valid request. A second round found ten more (one unit: the
  baseline's old name shape; one seam: a narrowing against the operator's recorded ADR-0011; eight product), a
  third seven (five product, one seam, one unit), a fourth five (four product, one seam), a fifth two (one product, one seam),
  a sixth three (two product, one seam), a fourth unit reading one, a seventh product three, an eighth product two, a
  ninth product two, a tenth five (four product, one seam) and an eleventh product one, all fixed before the merge.
- **Verified corrections:** DEC-0102 with a test for each break and each surviving plant; the three readings' reports
  in the handoff.
- **Learning:** a rule that restates another rule's condition calls that rule rather than copying it; and the readings
  run before the merge, not after a run of merges, so a defect does not reach a consumer's pin.

### 2026-10-22: The iteration's plan (CT-81 to CT-89) and a bare `.` in two guards (DEC-0097)

- **Goal:** read what the earlier sessions left, put every open ask in one plan with dates, carry it into
  fabric-workspace, and fix what was found broken.
- **What was missed:** four asks addressed to the contract, the roll call and the status of 2026-10-22 sat unanswered
  for one to three days while two products reported themselves blocked on the contract; the runs had answered their
  own threads but no run read the whole board for asks. And a guard written `(?!.*\.\.)` had passed every review:
  each fixture was ASCII, and ECMAScript's `.` stops at U+2028 and U+2029 where Python's does not.
- **Verified corrections:** the plan page and rows CT-81 to CT-86 (#139), CT-87 to CT-89 here; DEC-0097 with six
  negative fixtures each accepted by `main` `66520f0` and refused after, and a test refusing a bare `.` in any schema
  pattern.
- **Learning:** a guard proves itself only against characters a reader's engine treats differently, so a pattern is
  checked by what it is written with, not only by fixtures; and the board's asks are read in full at a run's start,
  not only the threads a run opened.

### 2026-10-21: The contract review (REQ-01 to REQ-18)

- **Goal:** fewer author errors against the contract: a checker, one error per mistake, the author's path rewritten,
  schemas without a behaviour change, consumers told what moved.
- **Failed attempts:** (1) a unit reader run in the shared run worktree ran a mutation that reset files and destroyed
  uncommitted edits; (2) inferring a schema from its discriminator alone broke two existing inference tests, because
  several schemas share a constant (`contractVersion` `0.1.0` is in the manifest, the result and the conformance
  report); (3) `pin:check` started validating the lock with a closed schema, and a seam reading found that kit-written
  locks carry `adapter` and `kit`, so the stricter check would have refused consumers that passed before;
  (4) the rule for a file the checker cannot tell in a folder changed in three consecutive rounds (usage error, note
  when near nothing, note always), each fix answering the last reading's one case and breaking another's.
- **Verified corrections:** each mutation reader gets its own detached worktree; the usage error names the schemas
  whose constants match, narrowed to the ones the document misses fewest members of, instead of guessing; an unknown
  lock member is a note and the exit code is unchanged, with a test; the folder rule is stated by the signal each file gives (a `protocol` the contract pins checks it, a shared
  `contractVersion` only names the near schemas, anything else is noted), with a test for each signal.
- **Learning:** a check made stricter in a review is a contract change for every consumer: read the consumers' real
  files before closing a schema the contract never enforced. A rule fixed twice for the same reason is restated by its
  signals, not patched a third time: the root cause of rounds 2 to 5 was that the inference and pairing rules lived in
  code branches and in three paragraphs of prose, so each fix was judged against the prose it remembered; the guide now
  holds them as one table in the code's order.

### 2026-10-20: The final pass (DEC-0089 to DEC-0095)

- **Goal:** land every decision the products asked for before the ecosystem is used in its final form.
- **Failed attempts:** (1) the "Next free" markers listed which IDs open branches held, so every merge made the line false
  again; three fix rounds patched the list; (2) rebases resolved by a script that kept one side of a conflicting table
  row lost later edits of the same row and kept stale copies of conformance rows (two reached `main` with the CT-61
  merge); (3) a reading found a reader duty that would have made Fabric and Switchboard withdraw shipped features
  (CT-60), because the duty was written from the catalogue's side only.
- **Verified corrections:** the markers state only the CAS counter's next value, a claim no merge order makes false;
  after each rebase the rows a branch changed were restored from its tip and the tables checked for a repeated first
  cell (the stale copies were removed in #130); the reader keeps what it ships on its own evidence until the catalogue
  records it.
- **Learning:** a register line that describes other branches is false at the first merge; describe only what one
  commit can know. After a scripted conflict resolution, compare each changed row with the branch tip before the gate.

### 2026-10-19: Jobs under limits and uncertain effects (DEC-0087), and the share registrations' close (DEC-0086)

- **Goal:** land DEC-0086 after its interrupted fix round, then give OQ-0012's ruling its wire shape.
- **Failed attempts:** (1) DEC-0086's fix round stopped on a provider error (502) after its code commit, and the
  worktree held the rest uncommitted for five hours; (2) DEC-0087's first cut failed all three readings: it replaced
  the ruling's revision with a pin gate no provider can see, its interim (an unknown count in `notVerified`) collided
  with `FAC-SEM-001`, and it left the provider's answer to a repeated key unstated; (3) the first cut's vectors named a
  private agent and were pushed: the privacy check had run before `git add`, and `check_private.py` lists tracked files
  only, so the new file was never read.
- **Verified corrections:** the next session found the builder's transcript, finished the round from the worktree and
  merged after four readings; DEC-0087 follows the ruling (`fabric-interop/0.2` named in `_meta.protocols`), the interim
  writes the measured lower bound with nothing in `notVerified`, and item 6 answers a repeated key by its job's code; the
  vectors use a neutral name, the PR merged by squash so `main` never carried it (`git log origin/main` has no
  `3be94d4`), and org-index has the finding (thread `acca9379`).
- **Learning:** a decision that departs from a recorded ruling says so as a departure, or follows it; and the privacy
  check runs on the tree being pushed, after the commit, because it reads tracked files only.

### 2026-10-12 — The board run, waves 2–6

- **Goal:** close the board in its final form, wave by wave, with three independent readings before every merge.
- **Failed attempts:** (1) the first reading found a blocking defect in nearly every PR, most often a reference
  function or a refusal that its own schema would refuse, or a schema rule no test pinned; (2) a pushed branch commit
  named a private agent in a handoff; (3) a register-merge script ordered a modified shared line after an appended
  block and left a fragment at the end of DECISIONS.md; (4) a subagent wrote its plant script over the owner's in the
  shared scratchpad, so later plants ran nothing; (5) a test derived its expected graph from the code it tested, so a
  planted edge survived.
- **Verified corrections:** each reading's findings were fixed in a round and confirmed by a second reading; the name
  was replaced and the PR merged as a squash, so main's history never carried it (checked over every main commit); the
  resolver keeps an edit before an appended block and the file was repaired; owner scripts live under `owner/` and
  subagents write elsewhere; expected values are written out in the test, never computed from the code.
- **Learning:** a schema and the reference code that answers for it drift unless one test runs both on the same
  inputs; and the privacy check runs before every push, not only before the merge.


### 2026-10-11 — The board run: reviews of two incoming decisions, and wave 1

- **Goal:** land DEC-0041 and DEC-0042 written by another product's session, then make the gate trustworthy.
- **Failed attempts:** (1) a plant of the single-use check survived because the reuse test replayed at the same
  instant (delegation handoff); (2) in DEC-0042 two plants were masked — one fixture caught by a second rule,
  one negative refused for the wrong reason; (3) the gate failed on other sessions' worktrees under
  `.claude/worktrees/` and, under machine load, on three wall-clock bounds (a 2 s child limit, 100 ms and
  200 ms), none a defect; (4) a commit claimed a green gate whose run had one such failure.
- **Verified corrections:** the reuse test replays an hour later; the masked plants' tests were tightened; the
  gate reads tracked files only (P1-01); the bounds are 15 s and 2 s, still proving their properties (P1-01,
  P1-03); the claim was corrected in the next commit.
- **Learning:** a wall-clock bound in a test is a claim about the machine, not the code: bound it far above any
  loaded machine and far below the defect it guards. And a gate's verdict must be read from its last line before
  it is written into a commit.

### 2026-08-26 — Contract validation build

- **Goal:** make architecture claims machine-checkable without building a runtime.
- **Failed attempt:** Draft 2020-12 conditional `required` clauses and composed
  work-object schemas failed Ajv strict compilation; the initial Mermaid Node
  check also reached browser-only DOMPurify after parsing non-flowchart syntax.
- **Verified correction:** conditional branches now declare the properties they
  require, composed objects apply `unevaluatedProperties` at their object root,
  and Mermaid distinguishes parser errors from the documented Node sanitizer
  limitation. `CI=true pnpm run check` passed with 34 tests and 0 Markdown errors.
- **Planted failure:** fixture `result-missing-not-verified` was deliberately
  marked valid. Focused Vitest exited `1` and reported the missing required
  property `notVerified`; the catalogue was restored before the final gate.
- **Learning:** schema dialect support is not the same as strict-validator
  compatibility. New schema patterns must first compile under the exact Ajv mode
  used by CI, then prove one positive and one negative instance.
- **Proposed future revision:** none. The correction is part of contract 0.1.0
  before publication and does not alter an active released rule.

### 2026-08-26 — Publication and adoption closeout

- **Goal:** prove that the standalone contract can be published privately and
  adopted without copying its normative text into Fabric or the wiki.
- **Failed attempt:** package script `check` was initially invoked as `pnpm check`;
  pnpm 11 treated `check` as its own command, so the expected repository gate did
  not run.
- **Verified correction:** every local, documented and CI invocation now uses
  `pnpm run check`. The full gate passed with 34 tests; GitHub's `contract` job
  completed successfully before PR #1 merged.
- **Learning:** command-name collisions are part of the executable contract. A
  gate receipt must name the exact command and prove the intended package script
  ran, not merely record a zero exit code.
- **Loop correction:** Fabric owns its adoption ADR and consumer links; the wiki
  owns navigation only. Future contract changes update those pointers after merge
  and never paste a second editable specification.

### 2026-08-27 — Memory Kernel architecture

- **Goal:** select a concrete memory pilot without making its storage engine the
  platform's authority for identity, truth, promotion or deletion.
- **Failed attempt:** the shortest candidate path was to expose
  `mcp-memory-service` directly as Fabric's MCP memory provider. Source inspection
  showed that its pinned implementation tests an older MCP revision than the
  contract's `2026-07-28` profile, and direct binding would also give backend
  operations an authority the project/global policy model does not allow.
- **Verified correction:** DEC-0014 places a Fabric Memory Kernel in front of a
  replaceable internal adapter. Exact revisions live in the ledger; the backend
  stores rebuildable search/graph projections. The full repository gate passed
  with 4 test files, 34 tests and 0 Markdown errors.
- **Learning:** protocol availability is not semantic admission. A packaged MCP
  endpoint may accelerate a backend pilot, but it cannot bypass a host-owned
  control plane or an exact-revision conformance probe.
- **Loop correction:** backend consolidation and graph inference create proposals
  only. Memory-quality audits compare false/stale recall and task outcomes, and
  approved learnings target future revisions rather than the active run.

### 2026-09-30 — Agent-registry contracts (AR-1)

- **Goal:** land Fabric's locked C1–C4 with fixtures and rules, and close G-07, G-08,
  G-11 and G-12.
- **Failed attempt:** the first pin check counted every line holding the word
  "contract", and on Fabric it reported 114 drifting mentions, half of them other
  contracts' commits. A planted-defect run also left one schema plant green, because the
  plant widened only part of the traceparent pattern.
- **Verified correction:** a line counts only when it names this contract or its pin, or
  sits under a heading that does (two tests added red first); Fabric's report fell to 52
  real mentions of three revisions. The traceparent plant was redone over all four
  segments and the uppercase fixture caught it.
- **Learning:** a drift check is only as useful as its false-positive rate on the
  largest consumer; and a plant proves a test only when it restores the whole defect.
- **Loop correction:** the record of this run is
  [2026-09-30-ar1-contract.md](plans/2026-09-30-ar1-contract.md).

### 2026-10-03 — Remote service placement (DEC-0019)

- **Goal:** let an online agent or dashboard become a `fabric-service/0.1` service and appear in
  the host beside the local ones.
- **Failed attempt 1 (stage 8, surfaced; owned by stage 5 of the adapter):** the probe passed the
  shipped TLS sample but failed the first real service: `network.host-check` got `404` because a
  platform router answers a foreign `Host` before the process does. The sample terminates its own
  TLS, so no test ever met a router.
- **Failed attempt 2 (stage 8; owned by stage 3 of the host):** MCP `link` without a path pointed
  at the origin root, where a panel served under a path answers `404`. The spec named the
  dashboard surface but not the path-less default.
- **Failed attempt 3 (stage 7; owned by the operator's own command discipline):** a public push
  chained the name gate with `;` instead of `&&`. One private path reached a public branch and was
  squashed out before merge.
- **Failed attempt 4 (stage 9; owned by stage 1):** ADR-0011 cited Fabric ADR-0083 as saying
  «loopback only» from memory. It does not.
- **Verified corrections:** adapter 0.6.1 `guard_verdict` (4 tests, 4 mutations killed;
  production 0 FAIL); host 0.4.1 `http_url` follows the dashboard surface (a test plus a
  mutation); `public-name-gate && git push` on every public push (it blocked one more leak during
  0.4.1); ADR-0011 corrected after reading ADR-0083.
- **Learning:** a sample written by the same run shares its blind spots. The platform in front of
  a remote service is part of the protocol's reality, so the gate is the real instance — now a
  standing instruction above.
