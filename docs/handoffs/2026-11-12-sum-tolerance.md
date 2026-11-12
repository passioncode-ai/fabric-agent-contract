# Handoff 2026-11-12: a usage report's cost sums within each row's rounding (CT-295, DEC-0163)

Branch `agent/ct295-sum-tolerance-20261112`, from main `d69dc363`. Entry point: [DEC-0163](../DECISIONS.md).

## Done

- `src/usage-rules.ts`: `exceeds(a, b, rows)` with `ROW_ROUNDING_USD` (0.0000005 per row summed on either side), used
  by the day check, the project against its task runs, and the projects against the days.
- `docs/specification/service.md`: the usage report's rounding sentence and `FAC-SEM-025`'s row.
- `test/usage-rules.test.ts`: ten rows rounded up pass; an excess beyond rounding still fails.

## Open

- Tell the adapter (board thread `14937b75`) when DEC-0163 lands, so FAA-310 closes.

## Checks run

- `pnpm run check` exit 0 (11177 tests passed, 3 skipped; coverage floors, UX lint, docs check, privacy check).

## Next task

Round 1 of the blind readings (unit, seam, product) of branch `agent/ct295-sum-tolerance-20261112` (DEC-0163).
