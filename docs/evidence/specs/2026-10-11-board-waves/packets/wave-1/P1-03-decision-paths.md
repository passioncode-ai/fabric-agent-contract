# P1-03 — a decision's named paths resolve

- **Node:** N02 gate · **REQ:** REQ-07 · **Wave:** 1 · **After:** P1-01 (shares `src/docs-check.ts`)
- **Closes:** F-A-010, F-A-009. The receipts are in [inventory.json](../../inventory.json).

## Why

`docs/DOCMAP.md:73` says `pnpm docs:check` checks every path in a decision's *Consequences / affects*. It
does not (`src/docs-check.ts` resolves only Markdown links, Mermaid, extension keys, profile names, rule codes
and versions). As a result, DEC-0004, DEC-0006 and DEC-0008 (`docs/DECISIONS.md:37`, `:53`, `:69`) name
`docs/specification/memory.md`, `roles.md` and `governance.md`, which do not exist. The real files are
`memory-and-learning.md` and `governance-and-roles.md`.

## What to build

1. In `src/docs-check.ts`, a `decisionPathFindings(text)` that reads each `### DEC-####` section of
   `docs/DECISIONS.md` and collects every backticked repository path in its affects/consequences/code lines:
   a backticked token that starts with `docs/`, `schemas/`, `src/`, `test/` or `fixtures/` and holds no space. It also takes globs ending `/*` or `*.md`;
   resolve those as globs. It reports any path that resolves to nothing, as
   `docs/DECISIONS.md:<line>: DEC-####: missing path <p>`. It skips paths that name another repository (any
   token with `:` or `github.com`).
2. Run it inside `runDocsCheck`. Add unit cases to `test/docs-check.test.ts`: a section naming a missing path
   is reported, an existing path or glob is not, and an external reference is skipped.
3. Fix the three decisions without rewriting them (the register is append-only). Under each decision's status
   line, add one bullet: **Erratum (2026-10-11):** the affected path is `docs/specification/<real>.md`; the name
   above predates the file's title. If the check then reports other missing paths, fix each the same way and list
   them in your report.
4. `docs/DOCMAP.md:73` stays as written. It is now true; cite the new check's test name in your report.

## Proof

- Before step 3, the check reports exactly the three paths, plus any others it finds. Record that output.
- Plant: make `decisionPathFindings` return `[]`, and the unit case fails.

## Files you own

`src/docs-check.ts` (the new function and its call), `test/docs-check.test.ts`, `docs/DECISIONS.md` (erratum
lines only; lease).
