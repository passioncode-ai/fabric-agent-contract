# 2026-11-04: operations digests and the retro after work (CT-219, DEC-0153)

## Objective

Draft CT-219 by its own decision: the shapes `ops.digest.hourly@1` and `ops.digest.daily@1` with semantic rules, the
host obligation `retro-after-work`, fixtures, vectors, `pnpm validate` for both and the conformance rows. Names and
fields are Fabric's ADR-0188 (commit `0d0e5922`); the reference implementation is Fabric's commit `e1eecec0`
(`apps/desktop/src/shared/opsDigest.ts`, `apps/desktop/src/main/opsDigestRun.ts`). Asked on board thread `f7758225`
(message `516761e1`, item 2); Switchboard (SB-250) and Inbox (B-205) wait on the shape.

## Done

- DEC-0153 (Proposed), [operations digests](../specification/ops-digest.md): OD-1 to OD-8 (window, operation names,
  counting, the rise, the daily fold, the files, nothing but counts, the operator told) and RW-1 to RW-4 (when the
  retro arises, how it is asked, what fulfils it, how it is counted).
- `schemas/ops-digest-hourly.schema.json`, `schemas/ops-digest-daily.schema.json` (closed; `pnpm validate` infers them
  by `schema`); `src/ops-digest.ts` (`foldHour`, `foldDay`, `isRise`, `FAC-SEM-166`, `FAC-SEM-167`) at 100 % branches;
  `tools/vectors/ops-digest.ts` and `fixtures/vectors/ops-digest.json` (10 hour and 4 day cases, expected values written
  by hand); 3 positive, 9 negative and 13 semantic fixtures; `test/ops-digest.test.ts`.
- Registered: `src/semantic-kinds.ts` (kinds `ops-digest-hourly`, `ops-digest-daily`), `src/semantic-rules.ts`,
  `tools/vectors/run.ts`, `vitest.config.ts` (include and a 100 % branch floor for `src/ops-digest.ts`),
  `test/rule-tolerance.test.ts`, `test/positive-sweep.test.ts`, `test/schema-compilation.test.ts` (148 schemas).
- `conformance.md`: the reference module row, three rows (a product folding its log, a reader of digests, a host
  serving `retro-after-work`), the register rows `FAC-SEM-166` and `FAC-SEM-167`, next free `FAC-SEM-168`;
  `docs/specification/README.md`, `docs/DOCMAP.md`, `CONTEXT.md` (Operations digest, Retro after work); backlog
  CT-219 marked in progress.

## Decisions taken in the draft

- `from` and `to` take the `.000` fraction Fabric writes as well as none; `day` is `YYYY-MM-DD`; `hours` 1 to 24.
- `op` grammar `^[a-z][A-Za-z0-9_]*(?:[.:/-][A-Za-z0-9_]+)*$`, at most 64: `:` because Fabric's IPC operations carry
  one (`ipc.work:home`), `_` for products that write snake case, `/` (the coordinator's decision of 2026-11-05) because
  Fabric logs MCP methods as `mcp.<method>` (`mcp.tools/list`; thread `f7758225`, message `1c191cf7`); the 175 names
  Fabric checked in a week of its log fit. `FAC-SEM-167` applies `hasHomePath` too, so `/` lets no home folder in.
- A day with no hour of its own has no daily digest (OD-5; Fabric Inbox answers `404`, message `f74763e1`);
  `foldDay` returns null for it. `hours` stays 1 to 24.
- A call refused because a source slot is missing (DEC-0149's setup state, in progress) counts `unknown`, never
  `failed` (OD-3), so it never makes a rise.
- `total` is an object of three counters (as ADR-0188 and Fabric give it), each the sum over `ops`.
- The `@1` names are kept as Fabric writes them and are not entered in the protocol revision register (DEC-0067).
- Retros asked and written are counted as the operation `retro-after-work` inside the digests, not as new members.
- A daily rise is checked as at least 10 failures per hour it rose and at most the day's failures of its op; an
  hourly rise must equal the hour's failures of its op.
- Vectors were added (the backlog row asks for them; the folds are what every product reimplements).

## Siblings on the same registers

DEC-0149, DEC-0150 and DEC-0152 are on other branches. When DEC-0149, DEC-0150 and DEC-0153 are all on `main`:

- `test/schema-compilation.test.ts` counts 150 schemas. Each branch writes 148 and git merges the equal lines
  silently; whichever lands last sets 150 by hand.
- `vitest.config.ts` keeps one coverage `include` line holding every branch's files, plus `src/ops-digest.ts`'s
  100 % branch floor.
- `test/positive-sweep.test.ts`'s sources list holds both `source-rules` and `ops-digest`; `test/rule-tolerance.test.ts`
  holds both branches' kinds, separated by a comma; so do the last rows of `fixtures/catalogue.json`.
- The register in `conformance.md` lists `FAC-SEM-166` and `FAC-SEM-167` after `FAC-SEM-165`.
- Whichever of DEC-0149 and DEC-0153 lands second drops "(DEC-0153, in progress)" from `source.md`'s setup-answer
  sentence, and "in progress" from `ops-digest.md`'s OD-3 and from the DEC-0153 conformance row where it names
  DEC-0149. DEC-0153's own decision text ("DEC-0149's setup state, in progress") is edited if DEC-0153 is still
  Proposed, and annotated if it is already Accepted (the register is append-only).
- DEC-0152 shares `docs/DECISIONS.md`, `docs/DOCMAP.md`, `docs/backlog.md`, `docs/handoffs/README.md` and
  `conformance.md` (a different row).

## Open

- The coordinator's blind readings (unit, seam, product) on this branch, then the pull request.
- The grammar of an `insight/1` line; the session and request counts ADR-0188 §1 also names (a gauge has no `@1`
  home); how the daily digest travels to Project Observatory; `pnpm validate` reading a `.jsonl` file whole. All are
  named under "Not decided here" on the spec page.

## Checks actually run

On this branch's tree after the coordinator's changes, 2026-11-05: `pnpm typecheck`, `pnpm run docs:check`,
`pnpm ux:lint`, `pnpm run privacy:check` (0 findings), `pnpm vectors:check` (29 files) and `pnpm test` with coverage
and its per-file floors (109 files, 9846 tests passed, 1 skipped), each exit 0. No U+2014 in the added lines.

## Next task

The coordinator's blind readings of DEC-0153 on branch `agent/ct219-ops-digest-20261104`, until two clean rounds;
then the pull request, the merge and the answer on thread `f7758225`.
