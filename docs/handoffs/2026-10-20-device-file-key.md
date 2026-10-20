# 2026-10-20: a device key in a file, idempotent rotation (DEC-0094, CT-65)

## Objective

Let Project Observatory's node enroll on a machine with no hardware or platform key store, and make a lost rotation
response cost a repeat rather than a new enrollment (board request of 2026-10-19, due 2026-10-23).

## Done

- `schemas/device-enrollment.schema.json`: `storage: "file"`; `exportable` true exactly for `file`.
- `schemas/device-check-in.schema.json`: an optional `protocols` on the response.
- `src/device-rules.ts` `rotation` (`FAC-SEM-125`, kind `device-rotation`) with six semantic fixtures
  (`device-rotation-{first,replay,replay-new-certificate,other-key,other-serial,no-key}`); three negative enrollment
  fixtures (`file-key-not-exportable`, `hardware-key-exportable`, `file-key-attested`); two positive fixtures
  (`device-enrollment-request-file-key`, `device-check-in-response-protocols`).
- `docs/specification/devices.md`, `relay.md`, `versioning.md`, `share-registration.md`, `CONTEXT.md`, DOCMAP,
  `OPEN_QUESTIONS.md` (OQ-0010); in `conformance.md` the server's row, the node's file-key row, the node's and the
  receiver's share-registration rows and the register row; DEC-0094 with DEC-0031 and DEC-0067 annotated; backlog
  CT-04, CT-65, CT-67.

## Decisions

- `deviceKeys` (`#sig`, `#kem`) live in the store `key.storage` names, so `file` covers them.
- A file key carries no `attestation` (the schema refuses it).
- No refusal code for a file key refused by policy: the server answers its own error.
- `protocols` on a check-in response goes only to a node pinned at or after DEC-0094 or one that ignores unknown
  members; the latest list a node received
  counts (enrollment or check-in response), and share registration reads it.

## Open

- CT-67: an in-band sign of a node's pin (a `fabric-device` revision after 0.1).
- Whether a server shows `key.storage` and a policy key that requires a hardware key (devices.md, Not decided here).
- Readings: unit (pass), product (three rounds; each round's findings are fixed in this branch).

## Checks

`pnpm run check` before the push, each step exiting 0.

## Next task

Readings, merge, then tell Project Observatory (its node) and the first organization server (the file key and rotation) on the board,
with the merge commit.
