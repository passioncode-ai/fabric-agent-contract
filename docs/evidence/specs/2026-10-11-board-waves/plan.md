# Wave plan — the board in six waves (2026-10-11)

The plan of the [board run](brief.md) over the [canvas](canvas.md). Node membership is
[waves.json](waves.json); `node assign.mjs` re-derives [inventory.json](inventory.json) and prints the counts
per wave. Each wave's exit criteria are written here before the wave starts; a re-cut is a `revisions`
entry below and a re-run of the script.

## How a wave runs

1. **Packets.** Each node of the wave is cut into packets under `packets/wave-N/`. A packet is
   self-contained for a developer agent:
   - the goal and the REQ it serves;
   - the inventory items it closes, with their receipts;
   - the sources it must read, as `file:line`;
   - the decisions already made;
   - the files it may touch, owned by no other packet in the wave;
   - the tests it writes red first;
   - the planted defects it must show caught;
   - the one command that closes it.
2. **Build.** Packets touching disjoint files run in parallel, in their own worktrees. Packets that share a
   file run in sequence. Registers (`DECISIONS.md`, `conformance.md`, `backlog.md`, `OPEN_QUESTIONS.md`)
   are edited under an agent-sync lease, with ids reserved by `agent_sync.py reserve`.
3. **Close pass**, inside the wave:
   - three blind readings per node: unit (the diff and its check), seam (everything that reaches it),
     product (documents, scenarios, neighbouring features), plus a design reading of each new decision;
   - one fix round;
   - the documents in the same change;
   - mark the canvas, re-read the brief, re-measure the inventory, re-cut the remaining waves.
4. **Land.** One PR per wave, or per node where a node is large. `pnpm run check` green locally and in CI.
   Merged by this repository's owner session. Consumers and the knowledge base are told the merge commit.

## Waves

### Wave 1 — integrate and make the gate trustworthy (N01, N02, N03, N04; 61 items)

Exit criteria:

- PR #32 and PR #31 merged; Fabric's session told both merge commits; F-B-302…304 closed with #32's receipt.
- `pnpm run check` run from a checkout holding a foreign `.claude/worktrees/` copy reports only this
  repository's files. Planted: a failing test inside `.claude/worktrees/` does not fail the gate.
- The positive-fixture sweep test exists and FAC-SEM-012 accepts the Windows fixture. Planted: reverting
  the FAC-SEM-012 fix fails the sweep.
- `docs:check` refuses a decision naming a missing path. Planted: one such path fails the check. DEC-0004,
  DEC-0006 and DEC-0008 name real files.
- The branch-coverage gate runs in `pnpm run check` at 100 % for the listed files. Uncovered branches are
  covered by a test or deleted as dead code, each with a planted defect.
- The board:
  - a row per canvas node and per consumer adoption;
  - CT-02's citation corrected;
  - the roadmap row, org-index pins and the wiki card current (under fabric-workspace's lease on
    `knowledge/roadmap.md`);
  - the retro stamped;
  - amended decisions annotated.
- README status, acceptance evidence, glossary and source ledger true (F-D-012…015, F-A-020/021/025/030/031,
  F-B-110/111/113/203/213/316/320).

### Wave 2 — delegation, spend, the operator session, runner and model profiles, service hygiene (N05, N06, N14, N15; 24 items)

Depends on: wave 1 (#32 merged at `7931c1d`). Fabric's rulings on the four delegation questions are recorded in
[brief.md](brief.md).

Exit criteria:

- One decision records the delegation rulings. Schemas, rules, code and the DL table agree, each sentence
  with a killing test.
- The canonical-forms register exists, with reference functions and shared vectors.
- CT-05: one decision on Fabric ADR-0147 with its schemas, rule and fixtures. The private proposal is cited
  by title and commit only.
- F-B-301, 305…314, 317…319, 321, 322 and F-A-006, F-B-112, F-B-315 closed with receipts.
- Planted defects: one per new or fixed check, each watched failing.

### Wave 3 — activity and devices (N07; 15 items)

Depends on: wave 2's canonical-forms register; Q1 for the CON-OE-01 and CON-OE-12 halves.

Exit criteria:

- F-B-101…114 closed. If Q1 is yes, CON-OE-01 and CON-OE-12 land as one or two decisions amending
  DEC-0030/0031, with fixtures for every refusal the packets name (per-day violation, absent
  `personalKeySharing`, expired policy keeps locks).
- No private schema lands (J10).

### Wave 4 — services, operator channel, embedded dashboard, the network's transport (N08, N09, N18; 29 items)

Depends on: wave 1's sweep test; agreement with Fabric (CO-238) and Fabric Dashboards (FD-37) on the
lifecycle decision.

Exit criteria:

- CT-01 decided and closed.
- Lifecycle rows for macOS, Linux and Windows.
- Status-state invariants in the schema and tested.
- ED-6/ED-9 reconciled.
- UX scenarios for the five uncovered surfaces.
- N18: DEC-0047 merged; DEC-0054, the window lease, the signing challenges and the device message-signature binding
  each a decision with fixtures and vectors; the first organization server runs the binding's vectors.

Packets: [wave-4/](packets/wave-4/README.md) — P4-01 services, P4-02 the descriptor, P4-03 channel and dashboard, P4-04
device transport, P4-05 leases and challenges. Agreements recorded 2026-10-12: Fabric (CO-238), Fabric Dashboards
(FD-37) and the adapter on CT-01; Dashboards on ED-8/ED-9; the first organization server on the device binding.

### Wave 5 — the 0.1.0 core, interop and usage, wave 4's follow-ups (N10, N11, N19; 20 items)

Exit criteria:

- F-A-002…005, 012, 014…019, 022…024 closed or narrowed by a decision.
- CON-OE-13 and RM-16 land. RM-16's OpenRouter source is re-read and pinned at writing.
- Project Observatory's `memory/0.1` pin gap (F-A-029) is a board row on Observatory.

### Wave 6 — the open organization-edition contracts (N12; 6 items, about 8 decisions)

Depends on: Q1; wave 3 (CON-OE-01).

Exit criteria:

- CON-OE-05, -06 (well-known part), -07, -08 and -10 merged, each with its fixtures.
- CON-OE-03 split into its decisions. The part needing Fabric ADR FAB-OE-19 is parked with a row until
  that ADR exists.

### Program (N13; 7 items, including the private-schema exclusion)

CON-OE-02, CON-OE-09, RM-01, the RM-03 residue, CO-KB-02 and the adapter's DEC-0039 follow-ups.
Each has a board row naming what it waits for.

### Wave 1 — close record (2026-10-11)

- **Merged:** PR #32 `7931c1d`, #31 `213e5a3`, #34 `39fcafe`, #37 `06cef17`, #38 `69e7795`, #39 `1dc352f`, #35
  `181613f`, #36 `3443c5e`. Each was read by an independent verifier (unit, seam, product), fixed in one round
  and gated locally before merge.
- **Gate on `main` `3443c5e`:** `pnpm run check` — 27 test files, 919 tests, branch-coverage floors met, UX lint,
  docs check, lint:md 0 errors.
- **Inventory:** 46 items done with receipts (`findings/closed.json`); the consumer-owned items moved to N16 and
  are tracked on the board (CT-03, CT-04, CT-18…CT-21).
- **Still open from wave 1 (P1-07):** fabric-workspace #138 (LC-14 pointer, roadmap) and org-index #56 (X-4) in
  review; the projects-wiki card committed locally (`73bc3fd`), blocked on that vault's diverged history
  (27 local commits of other sessions, 37 on origin); the workspace's published snapshot is left to its
  scheduled sync (F-D-019).
- **Found during the wave and fixed in it:** three wall-clock test bounds that failed under machine load; the
  gate reading other sessions' worktrees; `lint:md` able to lint nothing.
- **New work, re-cut into wave 2:** CT-22…CT-24 (node N15); CT-05 gains the provider-routing `sort`.

### Wave 2 — close record (2026-10-12)

- **Merged:** #42 `4fdbd79` (DEC-0043), #43 `c6c5af1` (DEC-0044), #45 `2eb91c0` (DEC-0045), #46 `f41d8e6` (DEC-0046),
  #47 `0b1cc4f` (CT-31), #44 (CT-29's row). Each was read by an independent verifier and fixed in one round; Fabric's
  session reviewed #45 as ADR-0144's owner.
- **Gate on `main`:** `pnpm run check` — 32 test files, 1133 tests, branch-coverage floors met, UX lint 20 scenarios;
  hosted CI runs Node 20, 22 and 24.
- **Found during the wave and fixed in it:** a forgery under small-order Ed25519 keys on Node 20/22 (CT-29, reported by
  the adapter), a thrown verifier on a token without `act` (CT-31), a shadowed profile id, a credential passed by name
  in an argument.
- **New work:** the first organization server's v4 contract set (§12): N17 in wave 3 (package first, estate record
  last), its device and run/result fields with N07, its descriptor with N08; its delegation amendment waits on Fabric's
  D2 and its secure transport on the relay protocol (DEC-0047 reserved for Project Observatory's draft).
- **Still open from wave 1:** fabric-workspace #138 (rebasing); the wiki card (blocked on that vault's history).
  org-index #56 merged.

### Wave 3 — close record (2026-10-12)

- **Merged:** #50 `9d29d71` (DEC-0050, DEC-0051, the package), #52 `92de756` (DEC-0052, DEC-0053, activity and devices),
  #54 (DEC-0055, the estate record). Each was read by three independent verifiers (unit, seam, product) and fixed in
  one round.
- **Gate:** `pnpm run check` on #54's head after its review round — 36 test files, 1493 tests, floors met, whole set
  95.16 % of branches.
- **Found during the wave and fixed in it:** in P3-03, a verifier that accepted a revision dropping a revocation or
  signed by a passkey its parent revoked, an unreadable clock that accepted any record, and a revocation kind that made
  a rule throw (the owner's review and the three tiers); a scope that sidestepped OD-1 and a stale revocation list for a delegated root (P3-02's review).
- **Peer work reviewed:** #53 (DEC-0047, the relay, Project Observatory's session) failed its first reading on all
  three tiers (a NaN date passing every time check, octet keys that crash, a check-in shape it misstated); the review
  and the owner's rulings are on the pull request, and it lands after #54.
- **New work:** N18 in wave 4 (the network's transport, split from V4-SECURE-TRANSPORT) with the device
  message-signature binding the first organization server asked for; OQ-0010 and F-D-028 move to N13.
- **Inventory:** 174 items, 93 closed (`assign.mjs`).

### Wave 4 — close record (2026-10-12)

- **Merged:** #57 `8c6211e` (DEC-0057, services on every system, CT-01), #56 `32c01ea` (DEC-0058/0059, channel status
  and embedded dashboard), #58 `204f189` (DEC-0056, device transport), #62 `557f30d` (DEC-0060, `hubKeyCertified`),
  #64 `5967bb1` (DEC-0054, delta and heartbeat), #63 `335e736` (DEC-0061, the descriptor for listings), #65 `7b238c7`
  (DEC-0062 window leases, DEC-0063 signing challenges); Project Observatory's #53 `8060254` (DEC-0047, the relay), #59,
  #60, #61.
- **Readings:** #56, #57, #58 and #62 had three readings, one fix round and a confirming reading (the last two cut short
  by rate limits and finished by the owner). #63, #64 and #65 were merged on the owner's own review, plants recorded,
  when subagent readers hit their weekly limit; their readings are owed (N19, W4-READINGS-OWED).
- **Agreements:** CT-01 with Fabric, Fabric Dashboards and the adapter (the `--fabric-supervisor` argument); ED-8 with
  Dashboards; the device binding with the first organization server, which adopted DEC-0056 at 54/54 vectors; the window
  lease with Project Observatory as the meter's owner; `Fabric-Relay-Request` (#60) and its follow-ups (#61).
- **Found and fixed:** a verifier trusting a revoked passkey (wave 3, carried); a NaN clock accepting expired tokens in
  the delegation verifiers; a credential echoed in a finding; refusals without fixtures; Workers rejecting KeyObjects.
- **Gate on `main` `7b238c7`:** 48 test files, 2618 tests, floors met, ux lint, docs-check, markdownlint, privacy 0.
- **Inventory:** 178 items, 123 closed (`assign.mjs`).

## Questions for the operator — one batch

Every other question was closed from the sources: [brief.md](brief.md) → *Decisions resolved from the
sources*.

| # | Question | Recommended | If yes | If no |
|---|---|---|---|---|
| Q1 | The org plan says H0 "has not started, by the operator's instruction" (`fabric-workspace` `docs/reports/2026-10-08-org-architecture-v2/plans/MASTER.md:15-16`). May the contract's open P0 packets (CON-OE-01, -12, -13, -05…-08, -10, -03) start now? Their only H0 dependency, CON-H01, is merged (`623bf61`). | Yes, for the contract's open packets only | waves 3, 5 and 6 carry them | waves 3 and 5 do the hardening only; N12 and the CON-OE halves move to the program |
| Q2 | Hosted CI runs on every push and PR (`.github/workflows/ci.yml`), while the org rule is a nightly batch (`knowledge/rules.md` §3). Exempt this repository, or convert? | Convert to nightly plus manual dispatch; the merge gate stays `pnpm run check` run by the merging session, with its output in the PR | wave 1 converts it | wave 1 records the exemption in org-index `CI-BATCHING.md` |
| Q3 | CO-KB-02, the schema licence exception, is still open; consumers now port `src/` code, not only schemas. | Leave open; no wave depends on it | — | — |

A go that leaves a question unanswered takes the recommendation, recorded as **assumed**. Each wave that
depends on it names it.

**The gate, closed (2026-10-11).** The operator answered "делай все по рекомендации — го" (do everything as
recommended — go). That go closes the manual gates of stages 0 (brief), 2 (canvas) and 3 (target-state spec), and
the wave plan, and it answers the batch with the recommendations:

- Q1 — yes: the contract's open org-edition packets start; waves 3, 5 and 6 carry them.
- Q2 — convert: the hosted check runs nightly at 23:00 Europe/Warsaw with manual dispatch, per org-index
  `docs/CI-BATCHING.md`; the merge gate is `pnpm run check` run by the merging session (P1-01).
- Q3 — CO-KB-02 stays open.

Outward acts (a tag, a publication, a deployment) are still asked one by one.

## Revisions

- 2026-10-12 — wave 2 closed (record above); wave 3 re-cut with N17 and the v4 set.
- 2026-10-11 — wave 1 closed (record above); wave 2 re-cut with N15.
- 2026-10-11 — gate closed by the operator's go; TRUST-TIERS (operator decision, ADR-0144 amendment 4) joins N05.
- 2026-10-11 — first cut, from the inventory of 147 items (consumer survey pending; its items join at the
  first re-measure).
