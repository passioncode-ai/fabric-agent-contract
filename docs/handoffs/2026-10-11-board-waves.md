# Handoff — the whole board in waves (2026-10-11)

## Objective

Close the contract's whole board in its final form, by the operator's request of 2026-10-11. The steps are an
audit of everything unfinished or wrong, a target-state canvas, and a plan cut into waves of self-contained
developer packets. After each wave come blind verification and a fix round, repeated until an independent
reading confirms the request. Entry point: [brief](../evidence/specs/2026-10-11-board-waves/brief.md).

## Done

- **Audit.** 147 open items with receipts in
  [inventory.json](../evidence/specs/2026-10-11-board-waves/inventory.json), written by
  [assign.mjs](../evidence/specs/2026-10-11-board-waves/assign.mjs) from
  [waves.json](../evidence/specs/2026-10-11-board-waves/waves.json) and
  [findings/](../evidence/specs/2026-10-11-board-waves/findings/):
  - 87 decision findings over DEC-0001…0040;
  - 29 from the knowledge base and handoffs;
  - 19 owed decisions (CON-OE-01…13, RM-*);
  - 12 incoming PRs and asks.
- **Plan.** [canvas](../evidence/specs/2026-10-11-board-waves/canvas.md) (13 modules, seams, deletions),
  [plan](../evidence/specs/2026-10-11-board-waves/plan.md) (six waves, exit criteria, one operator question
  batch), and [wave 1 packets](../evidence/specs/2026-10-11-board-waves/packets/wave-1/README.md).
- **PR #32 (DEC-0041) merged at `7931c1d`** after two independent reviews and three fix commits:
  - `0ae95fe`: the actor-chain walk;
  - `2f1dd28`: `grant:<ref>` fallback per Fabric's ruling, credential words, long runs, the RFC 3339 and
    schema check of the projection, `O_NOFOLLOW`, win32;
  - `8e6c301`: `tokenGrants` → `no-grant/not-named`, lowercase `t`/`z`, the platform option, values in
    Compatibility.

  The gate showed 730 tests green and CI green.
- **PR #31 (DEC-0042, `session-handoff/1`) merged at `213e5a3`** after the rebase (`d441f15`) and three readings
  with fixes `e4a2a37`, `dfa3336`, `3f19b4a`. The gate showed 852 tests green and CI green. SH-9 is strict by
  Fabric's ruling: another server carries only a delegation token; Fabric drops its `x-agw-key` gateway servers.
  DEC-0042 is kept (reserved for it); the markers read DEC-0043 / FAC-SEM-056.
- **Rulings from Fabric's session as ADR-0144's owner**, recorded in the brief:
  - one grant per token;
  - the meter hop exempt from the depth limit;
  - `approval.method: device` removed;
  - the meter's `denied` code relayed unchanged;
  - DEC-0039 annotated as tightening the session lifetime;
  - CT-05 (runner and model profiles) unblocked on Fabric ADR-0147, with the `provider` routing object
    input.

## Open

- **The consumer survey** (`findings/consumers.json`) did not land before the limit. Re-run it, then re-run
  `assign.mjs`.
- **Wave 1 packets P1-01…P1-06** are not started (they wait for #31), and P1-07 (knowledge base, wiki) waits
  on the wave's merges. The roadmap row: fabric-workspace's session agreed that this session updates
  `knowledge/roadmap.md:64` under fabric-workspace's lease.
- **The operator's question batch** (Q1 the org-edition P0 start, Q2 CI cadence, Q3 CO-KB-02) is in
  [plan.md](../evidence/specs/2026-10-11-board-waves/plan.md). Unanswered questions take the recommendation,
  recorded as assumed.
- **The machine's disk** fluctuates between 0 and 2 GB free. `/private/tmp/claude-501` holds 7 GB of all
  sessions' temp. Packets link the main checkout's `node_modules` instead of installing.

## Checks run

- `node docs/evidence/specs/2026-10-11-board-waves/assign.mjs` → 147 items, exit 0. Planted: an item on no
  node, an item on two nodes and an unknown id each produce a `problem:` line and exit 1.
- PR #32 at `8e6c301`: `tsc` clean, vitest 23 files / 730 tests, UX lint, docs check and markdownlint with
  0 errors; CI `contract` pass. Planted defects: 20 at `2f1dd28` and 2 at `8e6c301`, each caught.
- markdownlint over this run's documents: 0 errors. `docs-check.ts` passes.

## Next task

Wait for the operator's go on the planning gate (brief, canvas, plan and the Q1–Q3 batch in
[plan.md](../evidence/specs/2026-10-11-board-waves/plan.md)). Then merge PR #33, re-run the consumer survey into
`findings/consumers.json`, re-run `assign.mjs`, and start wave 1: P1-01, P1-02 and P1-06 in parallel worktrees.
