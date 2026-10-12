# P1-05 — the board and the registers are true

- **Node:** N03 board · **REQ:** REQ-01, REQ-07 · **Wave:** 1 · **After:** P1-03 (shares `docs/DECISIONS.md`)
- **Closes:** F-D-005, F-D-006, F-D-007, F-B-220, F-A-026, F-A-007, F-A-008, F-A-011, F-B-212, F-D-016,
  F-D-017, F-D-024, F-D-025, F-D-027, F-D-029, CT-03, CT-04, CON-OE-04, ASK-FABRIC-a…f. The receipts are in
  [inventory.json](../../inventory.json).

## What to build

1. **`docs/backlog.md`** (lease). Keep CT-01…CT-05 and add rows with stable ids from CT-06 upward, in this order:
   - one row per open canvas node, N02…N14, each naming its node, wave, goal (`interoperability` unless the
     node's goal says otherwise) and the inventory ids it closes;
   - one row per consumer adoption: DEC-0032…0036 (F-B-220), DEC-0037…0041 for Fabric, Observatory, the
     adapter and Dashboards; asks (a)–(f) from [findings/extra-items.json](../../findings/extra-items.json),
     each naming the consumer's own row id where one exists (read the consumer's board read-only:
     `git -C <workspace>/<repo> show origin/main:<board path>`);
   - CT-03 and CT-04 re-measured against `findings/consumers.json` once it exists; if it does not exist yet,
     leave their status unchanged and say so in your report;
   - CT-04 enriched with the open consumers and their packets (CON-OE-04);
   - CT-02's citation corrected from DEC-0029 §8 to §9 (F-A-026).

   Every status names what it waits for. A row closes only with a receipt.
2. **`docs/DECISIONS.md`** (lease; append-only, so status annotations only, never a rewrite):
   - DEC-0015 *amended by DEC-0032*;
   - DEC-0016 *extended by DEC-0018…0041 profiles*, if the register's practice supports it (read how
     DEC-0014 and DEC-0026 are annotated and copy that form);
   - DEC-0017 *amended by DEC-0018*;
   - DEC-0021 *amended by DEC-0027*;
   - DEC-0032/0033/0035 per F-B-212;
   - DEC-0039 *tightens the service's operator-session lifetime (F-B-311; ruled by Fabric's session
     2026-10-11)*.

   One line under the register's header states the DEC-0028 gap: two runs reserved under one key, and the
   second id was returned unwritten (F-A-007, from `DECISIONS.md:616-618`). One erratum line states that the
   SEM-0035/0036 receipts cited for DEC-0025 have no CAS record on origin; the first record is SEM-0037
   (F-A-008).
3. **`docs/evidence/retro.md`**: a run stamp for each merged run since 2026-10-02 that lacks one (list them
   from `git log --merges --since=2026-10-02 origin/main`), plus a stamp for this board run. Prune the
   standing instructions against their retirement triggers (the retro's own header and
   `references/retrospective.md` of task-pipeline): keep at most ten and log every deletion.
4. **`docs/handoffs/README.md`** (new): an index of the handoffs. It names the seven decisions that left
   none (DEC-0021, 0023, 0024, 0027, 0032, 0037, 0038; F-D-017) with the PR and merge commit of each, read
   from `git log`. It also marks the two handoffs that are other repositories' documents (F-D-025) as copies
   kept for history, with the owner of each.
5. **`docs/evidence/plans/*`**: stale open markers (F-D-024) get a closing line naming the commit that closed
   each, or `superseded by <doc>`.

## Proof

- The workspace's backlog contract accepts the board. Run org-index `check_backlog.py` over this repository
  read-only (find the script in `<workspace>/org-index`) and record its output.
- `docs:check` green. Every new row's ids exist in `inventory.json`; verify with a one-line script and
  record it.

## Files you own

`docs/backlog.md`, `docs/DECISIONS.md` (annotations and the two header lines), `docs/evidence/retro.md`,
`docs/handoffs/README.md`, `docs/evidence/plans/*.md` (closing lines).
