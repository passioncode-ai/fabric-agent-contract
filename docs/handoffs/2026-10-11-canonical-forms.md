# Handoff — DEC-0043: two canonical forms, one register; the board's digest is RFC 8785

## Objective

Board run wave 2, packet P2-01 (node N06,
[packet](../evidence/specs/2026-10-11-board-waves/packets/wave-2/P2-01-canonical-forms.md)): one register of the
contract's canonical JSON forms, so two implementations of the same document cannot disagree on a digest or a
signature. Closes F-A-006, F-B-112 and F-B-315 of the
[inventory](../evidence/specs/2026-10-11-board-waves/inventory.json). Branch `agent/w2-p2-01-canonical-20261011`;
the owner session reviews and merges.

## Done

- `src/canonical.ts` (new): `settingsCanonicalJson` (moved from `src/settings-backup.ts`) and `rfc8785` (moved from
  `src/delegation.ts`), each with a comment stating key order, separators, numbers, strings and what it refuses.
  `canonicalJson` and `jcs` stay as re-exports; `src/device-rules.ts` and `src/activity-rules.ts` import the
  settings form by its new name. No output changes.
- `src/comms-digest.ts` (new): `commsDigest(operation, args)`, DEC-0022's idempotency digest, pinned to RFC 8785
  over integer-only arguments. It follows Fabric's board (`apps/desktop/src/main/boardService.ts` at `487ef5b0`),
  which already computes exactly this; the four digest vectors were checked against Fabric's function.
- `docs/specification/conformance.md` §Canonical forms: the two forms' table, the register of every signed or
  hashed document (settings backups, device policies and key sets, activity `eventId` and `sourceKey` → settings
  form; approvals, the board's digest, a revision's `contentHash` → RFC 8785), and the rule: a new document picks
  one of the two, never a third.
- One-sentence pointers to the register where a page said only "canonical JSON": `project-comms.md`
  (Idempotency), `devices.md` (Policy), `activity.md` (Event id), `delegation.md` (DL-18), `overview.md`
  (`contentHash`). `CONTEXT.md` gains *Canonical form*; `docs/DOCMAP.md` a row; `docs/evidence/sources.md` pins
  the RFC 8785 text by its SHA-256.
- `fixtures/vectors/canonical.json` (new): the shared vectors — the settings form's cases, RFC 8785's §3.2.2–§3.2.4
  sample, its §3.2.3 sorting sample and the 26 rows of Appendix B, two inputs on which the forms differ, and the
  board's digests with their refusals. `test/canonical.test.ts` (new) runs both functions over them, checks that
  each document in the register uses its form, and that the register names only the two.
- Coverage floors: `src/canonical.ts` 100 %, `src/comms-digest.ts` 100 %, `src/delegation.ts` 93.85 % (the move
  took 20 covered branches out; see
  [coverage-baseline.md](../evidence/specs/2026-10-11-board-waves/coverage-baseline.md#floors-changed-by-wave-2)).

## For the adapter's kits (ask (c), CT-18)

`fixtures/vectors/canonical.json` is the file the kits' ports test against: each port runs its own settings form,
RFC 8785 and board digest over the same vectors (`inputJson` is parsed; `ieee754` is a big-endian double). A port
that passes them writes the bytes this repository does.

## Open

- Whether the settings form should refuse a lone surrogate. `JSON.stringify` writes it as `\udxxx`; Python's
  `json.dumps` writes the raw code unit and its UTF-8 encoding fails. Only the settings-backup rule refuses one,
  in a cell. DEC-0043 *Not decided here*.
- Fabric's hub call writes a `contentHash` on its synthetic binding and hub references that hashes a joined
  string, not the RFC 8785 form of an object (`apps/desktop/src/main/hubCall.ts:311`, `:323` at `487ef5b0`).
  Fabric's to decide whether those references need a hash at all.
- Unifying the two forms is a contract-owner choice; it would re-sign every device policy and change every stored
  backup checksum.

## Checks run

The gate's parts with the main checkout's `node_modules` linked: `tsc --noEmit`, `vitest run --coverage`,
`python3 docs/ux/lint.py`, `tsx src/docs-check.ts`, `tsx src/lint-md.ts`. Counts and plants are in the commit
message and the pull request.

## Next task

P2-03 (delegation sealed) builds on `src/canonical.ts`: it imports `rfc8785` from there, and updates the shared
vectors if its refusal table changes.
