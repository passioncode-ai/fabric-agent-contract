# 2026-10-20: `pending` for `fabric.project.resolve` (DEC-0092, CT-63)

## Objective

Name the session-start capability's answer when a folder's Git facts cannot be read yet, so Fabric builds F9 against
a contract name (board thread `617c8cbe`; Fabric accepted `{outcome: pending, reason: git-unreadable, retryable: true}`).

## Done

- `schemas/folder-attribution.schema.json`: `$defs/pending` and `$defs/resolveAnswer` (the answer, or pending).
- `docs/specification/folder-attribution.md`: the section on the session-start capability.
- Tests in `test/folder-attribution.test.ts`: every answer and pending, at `resolveAnswer` and at the root, each
  required key, no extra member (the mutants that drop the root alternative or a required key fail them).
- DEC-0092; DEC-0089 annotated; the hub's conformance row and pending in the attributing product's row; DOCMAP and
  CONTEXT; backlog CT-63, and pending in CT-64 and CT-66.
- Readings: unit (pass), product (four rounds; each round's findings are fixed in this branch).

## Checks

`pnpm run check` before the push, each step exiting 0.

## Next task

Readings, merge, then post the merge commit on thread `617c8cbe` for Fabric's F9. The reply carrying `record` and
`row` is CT-66's.
