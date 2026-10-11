# P1-04 — a branch-coverage ratchet on the rule code

- **Node:** N02 gate · **REQ:** REQ-07 · **Wave:** 1 · **After:** P1-01 (shares `vitest.config.ts`)
- **Closes:** the gate half of the "rule branch no test kills" class. About 40 findings are in it: F-B-101,
  F-B-102, F-B-205, F-B-206, F-B-217, F-B-308, F-B-309, F-A-004 and others. Each finding is closed by its own
  node's wave. This packet makes the class measurable and stops it growing.

## Why

The audits planted about 40 deletions in `src/*-rules.ts` and `src/delegation*.ts`, and every one left the
suite green. Branch coverage does not prove a test kills a branch, but an uncovered branch is certainly not
killed, and it is cheap to gate.

## What to build

1. Add `@vitest/coverage-v8`, at the version matching the installed `vitest` (read
   `node_modules/vitest/package.json`), as a devDependency. Run `pnpm add -D @vitest/coverage-v8@<exact>`
   from the main checkout's dependency set.
   - If the disk refuses, stop and report: the owner session installs it.
   - Commit `package.json` and `pnpm-lock.yaml`.
2. Add a `coverage` block to `vitest.config.ts`:
   - `provider: "v8"`;
   - `include` lists `src/*-rules.ts`, `src/delegation*.ts`, `src/grant-projection.ts`,
     `src/fabric-links.ts`, `src/session-handoff.ts` (if merged), `src/semantic-rules.ts`,
     `src/operator-session.ts`;
   - `thresholds` per file, at today's measured branch percentage rounded down (the ratchet);
   - `reporter: ["text-summary", "json-summary"]`;
   - reports go to `coverage/`, which is ignored.
3. Add a `test:coverage` script, and make `check` run `vitest run --coverage` instead of `vitest run`. CI runs
   `pnpm run check`, so the ratchet holds there too.
4. Write `docs/evidence/specs/2026-10-11-board-waves/coverage-baseline.md`: a table of each file's branch
   percentage today and the wave whose node raises it to 100 %:
   - wave 2: delegation, grant-projection, fabric-links, operator-session;
   - wave 3: device-rules, activity-rules;
   - wave 4: the service, channel and dashboard rules in `semantic-rules.ts`;
   - wave 5: core rules.

   Those waves' packets raise their thresholds. The ratchet's end state is 100 % on every listed file, and
   the last wave that touches a file removes its per-file entry in favour of a global 100 %.

## Proof

- Plant: add an untested branch (`if (x === "never") return [];`) to one rule file, and the coverage
  threshold fails the gate. Restore it.
- Gate: all parts green with coverage on. Record the per-file percentages.

## Files you own

`package.json` (devDependency and scripts), `pnpm-lock.yaml`, `vitest.config.ts` (the coverage block),
`.gitignore` (`coverage/`), `docs/evidence/specs/2026-10-11-board-waves/coverage-baseline.md`.
