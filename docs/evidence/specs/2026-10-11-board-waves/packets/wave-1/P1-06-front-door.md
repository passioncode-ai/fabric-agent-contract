# P1-06 — the front door is true today

- **Node:** N04 truthful docs · **REQ:** REQ-07 · **Wave:** 1
- **Closes:** F-D-012, F-D-013, F-A-025, F-A-031, F-D-014, F-D-015, F-A-030, F-B-320, F-A-020, F-A-021,
  F-B-110, F-B-111, F-B-203, F-B-213, F-B-316, F-B-113. The receipts are in
  [inventory.json](../../inventory.json).

## What to build

1. **`README.md`.** Rewrite the status line (`README.md:18-20`) to say what ships today:
   - the schemas, the fixtures and the conformance checker;
   - the reference verifiers consumers port (`src/delegation.ts`, `src/fabric-links.ts`,
     `src/grant-projection.ts`, `src/operator-session.ts`, and `src/session-handoff.ts` once #31 merges);
   - the `pin:check` CLI.

   It also says what does not ship: a runtime, a published package, an SDK with a stability promise. Link
   `conformance.md`, `results-and-evidence.md` and `spend-policy.md` from *Start here* (F-A-031, F-D-014).
2. **`docs/evidence/acceptance.md`.** Keep the 2026-08-26 record as dated history, under a heading that says
   so. Replace "Expected measured result" with a current line read from today's gate: test files, tests, UX
   lint counts, schema count from `ls schemas | wc -l`. Correct "PRIVATE" to the repository's current
   visibility (`gh repo view passioncode-ai/fabric-agent-contract --json visibility`).
3. **`docs/DOCMAP.md`.** Add rows for `spend-policy.md` (DEC-0037/0038) and for Windows and Linux services
   (DEC-0032/0033), and refresh the delegation row (F-B-320).
4. **`CONTEXT.md`.** Add a glossary entry for every term a decision introduced and the glossary lacks:
   - usage report, spending limit, Project board, memory/0.1 (F-A-030);
   - key set, policy root key, stream epoch (F-B-113);
   - services folder, supervisor, token file, spend policy, limit window, operator session, estate key
     (F-D-015).

   Bring "Standing grant" up to DEC-0037/0038. Each entry cites its decision.
5. **`docs/evidence/sources.md`.** Every external citation gets a row with its revision and retrieval date,
   re-fetched today where you can reach it:
   - OpAMP, the OTel log data model, the GenAI and VCS attribute pages, ULID (F-B-110);
   - RFC 2986, RFC 8032, the OTLP JSON encoding (F-B-111);
   - systemd directives, Task Scheduler restart behaviour, Windows SIDs and ACLs, `LOCALAPPDATA`, XDG,
     `GetAccessControl` (F-B-203);
   - WCAG 2.2, `prefers-color-scheme`, the Cookie Store change, CSSOM (F-B-213);
   - RFC 2119, and the seven RFC rows marked "not re-fetched" (F-B-316).

   Replace the A2A `/latest/` link with the 1.0.0 versioned URL (F-A-020). Pin Fabric's agent-registry
   contracts at the commit DEC-0016 names (F-A-021). Where a source cannot be re-fetched, write
   `not re-fetched; cited from <where>` rather than inventing a revision.

## Proof

- `docs:check` green; markdownlint over tracked files 0 errors.
- A test in `test/consistency.test.ts`, or the existing docs test: every external `http` link in
  `docs/specification/*.md` appears in `docs/evidence/sources.md`. Plant: remove one ledger row and the test
  fails. If the existing tests already enforce this, cite them instead of adding one.

## Files you own

`README.md`, `docs/evidence/acceptance.md`, `docs/DOCMAP.md`, `CONTEXT.md`, `docs/evidence/sources.md`, and
one test file if you add the ledger test (`test/sources-ledger.test.ts`).
