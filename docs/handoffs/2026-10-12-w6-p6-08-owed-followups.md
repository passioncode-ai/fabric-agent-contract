# Handoff — the follow-ups of the owed readings (board run wave 6, P6-08; W4-READINGS-OWED)

## Objective

The three-tier readings owed for #63, #64, #65, #67 and #68 (merged on the owner's own review while readers were
unavailable) ran on 2026-10-12: no blocking defect in any of them, about twenty non-blocking findings. This packet
fixes the ones that are code or tests and records the rest as board rows.

## Done

- `src/core-rules.ts`: `FAC-SEM-093` refuses one claim id on two done claims and names each done item by its own
  index; `FAC-SEM-097` names the field that failed; the `startsAt` boundary is tested.
- `src/openrouter-attribution.ts`: a missing request answers `not-openrouter`; vectors for the default port, a trailing
  dot, the WHATWG-only forms, the other user-set headers, empty categories and the 64-character slug.
- `src/window-lease.ts`: a corrupt held lease is `context-invalid`; tests for a report at
  the issue instant and a malformed lease in a division; floors for `window-lease.ts` and `signing-challenges.ts`.
- `src/revocation-delta.ts`: a corrupt held heartbeat is `malformed` (HB-0); an applied sequence that is not a count
  stays behind.
- `src/signing-challenges.ts`: tests for a renamed field, a `jkt` end and a grant at revision 0.
- `src/schema-closure.ts` (new) and adoption.md's *Vendoring schemas* (from the first organization server's report).
- Smaller: the runner-kind message test, the residue namespace fixture, `versioned-setting` swept, the
  `FAC-SEM-001` message, the half-open grant window in the text, adoption.md's method, window-lease.md's verifier.
- Annotations on DEC-0054, DEC-0062, DEC-0063, DEC-0064, DEC-0065; board rows CT-39 (identifier equality, needs a
  decision) and CT-40 (the privacy check's silent skip; `byProject` costs); CT-04's vendoring note.

## Checks run

Off main `0656aa1` (merged): `tsc --noEmit` exit 0; vitest 57 files, 3125 tests, every floor met; docs-check passed;
markdownlint 0 errors; privacy 0 findings with `ORG_INDEX`. Plants: 24 across the changes, each caught except the
cosmetic `FAC-SEM-001` message.

## Open

- CT-39 (a decision on identifier equality), CT-40.
- **Next task:** close wave 6: N12's remaining packets (CON-OE-05, CON-OE-10 in its v4 edition, CON-OE-03 measured),
  N20 waits on Fabric's D8; then the program and stages 9–10.
