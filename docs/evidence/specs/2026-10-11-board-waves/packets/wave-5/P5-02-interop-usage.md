# P5-02 — interop and usage

- **Node:** N11 · **Wave:** 5 · **After:** P5-01 · **Closes:** CON-OE-13, F-A-005, F-A-012, F-A-022, F-A-023, F-A-024,
  F-A-029, RM-16.

## Sources

The inventory items above in [inventory.json](../../inventory.json); DEC-0017, DEC-0021, DEC-0022, DEC-0023; the
organization roadmap's RM-16 (OpenRouter app attribution, fabric-workspace `knowledge/roadmap.md`).

## What to build

1. **Usage receipts (CON-OE-13):** optional `projectId`, `sessionId`, `taskRunId` on a usage receipt and an optional
   per-project breakdown, as an amendment of DEC-0021, with fixtures.
2. **`FAC-SEM-025`'s window (F-A-024):** the usage report's period is at most 31 days and not in the future, parsed
   strictly; boundary tests at 31 days and 31 days + 1 s.
3. **Text behind its rulings:** interop.md C3.2's job `result` is the full envelope (F-A-005); provider.md restates the
   DEC-0017 rules, not the replaced ones (F-A-012); the `mcp-memory-service` pilot is historical in the adapter
   reference, the estate loop and the source ledger (F-A-022); the comms checkers' comments call DEC-0022 accepted
   (F-A-023).
4. **Adoption statuses (F-A-029):** each "consumer adoption pending" status of DEC-0020…0029 is measured against the
   consumer's pinned commit and written as what was read, with the date.
5. **OpenRouter attribution (RM-16):** the three headers and three rules for traffic a product originates, as a
   decision with a rule or vectors, pinned to OpenRouter's documentation in the source ledger.

## Proof

Fixtures and tests for 1, 2 and 5; plants recorded; consumer rows (Project Observatory's meter, Fabric) on the board;
a handoff.
