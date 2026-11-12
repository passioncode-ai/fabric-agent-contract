# Handoff 2026-11-12: a usage report's cost sums within each row's rounding (CT-295, DEC-0163)

Branch `agent/ct295-sum-tolerance-20261112`, from main `d69dc363`. Entry point: [DEC-0163](../DECISIONS.md).

## Done

- `src/usage-rules.ts`: `exceeds(a, b, rows)` with `ROW_ROUNDING_USD` (0.0000005 per row summed on either side), used
  by the day check, the project against its task runs, and the projects against the days.
- `docs/specification/service.md`: the usage report's rounding sentence and `FAC-SEM-025`'s row.
- `test/usage-rules.test.ts`: ten rows rounded up pass; an excess beyond rounding still fails.

## Open

- Tell the adapter (board thread `14937b75`) when DEC-0163 lands: its kit's Python and Node copies of the rule and its
  probe owe the per-row allowance and a test of ten rows rounded up (FAA-310 part 2); Fabric Dashboards' sample-service
  fixture and other vendored kit copies follow at their next kit refresh.

## Checks run

- `pnpm run check` exit 0 (11177 tests passed, 3 skipped), and on the round-1 fold (11178 passed, 3 skipped; coverage floors, UX lint, docs check, privacy check).
- Round 1 (on `65c5b76b`): unit clean (risks folded: null-cost rows no longer widen the allowance; the day's
  comparison is a distance again, so NaN is never close; the test comment matches its cases; the page states the
  relative 1e-9). Product, breaks folded: Compatibility names the copies of the rule that keep the old tolerance and
  the window until they change; DEC-0163 amends DEC-0065 and DEC-0021, both annotated; the page's numbers match the
  code. Product risks folded: "each row" counts known costs everywhere; the tests stand for a vector (stated);
  DOCMAP; the reader pin in the page's sentence. Declined: none.

## Next task

Round 2 of the blind readings (unit, seam, product) of branch `agent/ct295-sum-tolerance-20261112` (DEC-0163).
