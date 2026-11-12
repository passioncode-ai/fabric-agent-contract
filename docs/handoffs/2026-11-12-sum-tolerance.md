# Handoff 2026-11-12: a usage report's cost sums within each row's rounding (CT-295, DEC-0163)

Branch `agent/ct295-sum-tolerance-20261112`, from main `d69dc363`. Entry point: [DEC-0163](../DECISIONS.md).

## Done

- `src/usage-rules.ts`: `allowance(a, b, rows)` with `ROW_ROUNDING_USD` (0.0000005 per known-cost row summed on
  either side); the day check's `close` (a distance within it), and `exceeds` (one-sided; a sum that overflows exceeds a finite one) for the
  project against its task runs and the projects against the days.
- `docs/specification/service.md`: the usage report's rounding sentence and `FAC-SEM-025`'s row.
- `test/usage-rules.test.ts`: ten rows rounded up pass; an excess beyond rounding still fails; each count pinned at its
  boundary (mutation-checked); `fixtures/positive/service-usage-rounded-rows.json` (catalogued).
- DEC-0021 and DEC-0065 annotated; DOCMAP's usage row; backlog CT-295; the handoffs index row.

## Open

- Tell the adapter (board thread `14937b75`) when DEC-0163 lands: its kit's Python and Node copies of the rule and its
  probe owe the per-row allowance and a test of ten rows rounded up (FAA-310 part 2). The 45 copies outside it counted
  on 2026-11-12 (DEC-0163 Compatibility, with the search): the 34 current-name kits follow at their next kit refresh;
  the 5 old-name kits, 3 vendored probes, 2 probe ports and 1 vendored `usage-rules.ts` owe the change from their
  owners. Until the kit's copies carry it, the kit (which already rounds) is refused by those readers: track it on
  the same thread. At its repin the adapter's usage parity tests also move their count pin from [208, 8] to [209, 8]
  (the new positive fixture), by hand.
- After merge, one board request to each project owning one of the 11 copies that owe the change from their owners
  (the old-name kits, the vendored probes, the probe ports and the vendored `usage-rules.ts`), naming its file.
- After merge, the knowledge base's mirror of service.md still says "unrounded" until `node scripts/workspace.mjs sync`
  runs from a Fabric checkout (or the scheduled sync); check the mirrored sentence.

## Checks run

- `pnpm run check` exit 0 (11177 tests passed, 3 skipped), on the round-1 fold (11178 passed, 3 skipped), on the round-2 fold (11184 passed, 3 skipped; coverage floors, UX lint, docs check, privacy check), on the round-3 fold (11184 passed, 3 skipped) on the round-4 fold (11185 passed, 3 skipped) and on the round-5 fold (11185 passed, 3 skipped).
- Round 1 (on `65c5b76b`): unit clean (risks folded: null-cost rows no longer widen the allowance; the day's
  comparison is a distance again, so NaN is never close; the test comment matches its cases; the page states the
  relative 1e-9). Product, breaks folded: Compatibility names the copies of the rule that keep the old tolerance and
  the window until they change; DEC-0163 amends DEC-0065 and DEC-0021, both annotated; the page's numbers match the
  code. Product risks folded: "each row" counts known costs everywhere; the tests stand for a vector (stated);
  DOCMAP; the reader pin in the page's sentence. Declined: none.
- Round 2 (on `0dd922eb`): unit clean (risks folded: each count pinned at its boundary and mutation-checked; the day's
  count is the known costs; Infinity is never close; `allowance` and `exceeds` documented apart). Product, breaks
  folded: the condition is a reader that applies DEC-0163, not a pin, and the rounded-rows fixture makes a copy's parity
  test fail at repin until it changes; Compatibility counts the copies (34). Product risks folded: the day bullet; the
  backlog row and this handoff; the knowledge base's mirror after merge. Declined: none.

- Round 3 (on `26e19217`): unit clean (risk folded: twenty null-cost models do not widen a day's allowance, tested).
  Product, break folded: Compatibility counts 45 copies with the search that finds them, by form, and names who owes
  each change. Product risks folded: only the day check is a distance, the project checks stay one-sided; the
  DEC-0021 and DEC-0065 annotations hold once readers apply DEC-0163; the page names unrounded first; this handoff's
  Done; the kit already rounds, so the window is the kit's change plus each copy. Declined: none.

- Round 4 (on `8a50b86c`): unit clean, seam clean (no break; the adapter's 216 stored FAC-SEM-025 answers unchanged
  under the new rule). Risks folded: `exceeds` refuses a sum that overflows against a finite one, as `close` already
  did, and Compatibility says so; `allowance` and `exceeds` tested directly; the Decision says "not a finite number".
  Product, breaks folded: the handoffs index and the backlog row named round 3 next. Product risks folded: the search
  names its root and leaves out worktrees and both repositories in the command; Fabric Dashboards' copy is a
  current-name kit; the Why states the whole allowance. Declined: none.

- Round 5 (on `4275ffff`): clean on all three tiers (unit, seam, product: no break). Risks folded: two sums that both
  overflow are named in Compatibility; a finite cost too large to scale reads as itself in the message; the usage host
  row in conformance.md names DEC-0163's reader and writer duty; CT-295's goal and the course check; the adapter's count
  pin and a notice to each owner of the 11 copies in Open; this list's commas. Declined: none.

## Next task

Round 6 of the blind readings (unit, seam, product) of branch `agent/ct295-sum-tolerance-20261112` (DEC-0163); a
second clean round accepts it, then land it (merge to main with the gate output) and send the Open notices.
