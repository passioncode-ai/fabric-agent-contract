# Handoff — DEC-0078: a replacement's receipt carries transferred attempts (2026-10-13)

## Objective

Fabric found, building COM-03, that after `com.responder_replace` with `transfer.requests` the new holder had no
attempt id for the accepted requests it took over, so it could not fence them. It asked the contract to choose between
the receipt carrying the attempts and a `com.claim` read-back.

## Done

- DEC-0078: the receipt. `comms-receipt.schema.json` gains `transferred` (one `{request, revision, attempt}` per
  transferred request, each once, `attempt` by `$ref` to the receipt's own `attempt`, 1–64 items, closed items). Only `com.responder_replace`
  answers it; the contract defines no read of an attempt through `com.claim`.
- project-comms.md: the tool table's `com.responder_replace` answer and *Slots end with the session*.
- One positive and seven negative fixtures in the catalogue; a shape test and seven plants in `test/comms-tools.test.ts`.
- CT-41 (Fabric answers `transferred`, replacing its read-back) and CT-42 (the kits read it).

## Open

- Fabric implements `transferred` and repins (CT-41); the adapter's kits read it from FAA-12b (CT-42).
- Not decided: what a `com.claim` naming an accepted request answers beyond the board's refusal.

## Checks run

- Gate at the branch head:
  - `tsc --noEmit` exit 0;
  - vitest with coverage passed;
  - UX lint passed;
  - docs-check passed;
  - lint-md 0 errors;
  - privacy 0 findings.
- The seven plants in `test/comms-tools.test.ts` were each killed by their named negative fixture:
  - the item opened;
  - the upper bound removed;
  - the lower bound removed;
  - `attempt` made optional;
  - `request` made optional;
  - `revision` made optional;
  - `attempt` loosened to any object.
- The exact numbers are in the pull request.

## Next task

Merge, tell Fabric's builder the merge commit, and record its adoption on CT-41 when it lands.
