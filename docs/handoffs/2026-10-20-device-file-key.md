# 2026-10-20: a device key in a file, idempotent rotation (DEC-0094, CT-65)

## Objective

Let Project Observatory's node enroll on a machine with no hardware or platform key store, and make a lost rotation
response cost a repeat rather than a new enrollment (board request of 2026-10-19, due 2026-10-23).

## Done

- `schemas/device-enrollment.schema.json`: `storage: "file"`; `exportable` true exactly for `file`.
- `schemas/device-check-in.schema.json`: an optional `protocols` on the response.
- `src/device-rules.ts` `rotation` (`FAC-SEM-125`, kind `device-rotation`) with three semantic fixtures; two negative
  and one positive enrollment fixtures.
- `docs/specification/devices.md`, the server's row and the register row in `conformance.md`, DEC-0094, backlog CT-65.

## Checks

`pnpm run check` before the push, each step exiting 0.

## Next task

Readings, merge, then tell Project Observatory (its node) and the first organization server (rotation) on the board,
with the merge commit.
