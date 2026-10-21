<!-- agent-sync:merge-log -->
**Frozen since 2026-10-11.** Nothing is added here any more: read `git log --merges origin/main` for what landed, and the [handoffs index](handoffs/README.md) for why.


# Merge log

Written by `agent_sync.py merge`. Entries newer than 7 days keep their detail; older ones are compacted to one line each on the next write. Read it before starting work: it is the shortest answer to *what landed while I was on my branch*. Not written
since 2026-10-11: merges since then are in `git log --merges origin/main` and the handoffs index.

### 2026-10-11T17:32:37Z · `board-waves-20261011` · agent/board-waves-20261011 → main · `2afbe60`
- run: r-d556b8420 (fabric-agent-contract-75), merged through PR #33
- files: docs/evidence/specs/2026-10-11-board-waves/**, docs/handoffs/2026-10-11-board-waves.md
- conflicts: none
- summary: the whole-board inventory (148 items), canvas, six-wave plan and wave-1 packets; the planning gate closed by the operator's go

### 2026-10-11T16:10:16Z · `session-handoff-20261011` · agent/dec-session-handoff-20261011 → main · `213e5a3`
- run: Fabric's session, then r-d556b8420 (owner session), merged through PR #31
- files: DEC-0042 session-handoff/1 — schema, spec, src/session-handoff.ts, tests, fixtures, runners.md example
- conflicts: Next free lines (resolved by rebase on 7931c1d; markers DEC-0043, FAC-SEM-056)
- summary: session-handoff/1 with strict SH-9 (another server carries only a delegation token)

### 2026-10-11T15:21:54Z · `meter-grant-read-20261011` · agent/dec-0041-meter-20261011 → main · `7931c1d`
- run: Fabric's session, then r-d556b8420 (owner session), merged through PR #32
- files: DEC-0041 — delegation.md, spend-policy.md, fabric-button.md, src/grant-projection.ts, src/delegation.ts, src/fabric-links.ts
- conflicts: none
- summary: the meter reads the hub's grant projection; the call window; the task claim; CO-260 credential names

## Compacted

_nothing older than the window yet_
