# Handoff — interop and usage (DEC-0065, board run wave 5, P5-02; CT-15)

## Objective

Close node N11 of the [board run](../evidence/specs/2026-10-11-board-waves/canvas.md),
[P5-02](../evidence/specs/2026-10-11-board-waves/packets/wave-5/P5-02-interop-usage.md): the usage report's window and
project attribution (F-A-024, CON-OE-13), OpenRouter attribution for the organization's products (RM-16), text behind
DEC-0017, DEC-0022 and DEC-0023 (F-A-005, F-A-012, F-A-022, F-A-023), and measured adoption (F-A-029).

## Done

- **DEC-0065** in [`docs/DECISIONS.md`](../DECISIONS.md), reserved by git CAS; rule code **FAC-SEM-098** (receipt
  SEM-0098). Next free `DEC-0066` and `FAC-SEM-099`.
- `src/usage-rules.ts` (new) holds all of `FAC-SEM-025`: the arithmetic moved from `src/semantic-rules.ts` (G-13: one
  code, one module), the 31-day window read from `generatedAt` with strict RFC 3339, and `byProject` (projects and task
  runs, never a caller, DL-22). Schema `service-usage.schema.json` gains `byProject`.
- [OpenRouter attribution](../specification/openrouter-attribution.md): schema `openrouter-attribution.schema.json`,
  `src/openrouter-attribution.ts` (`attributionSettingFindings`, `attributionHeaders`), vectors
  `fixtures/vectors/openrouter-attribution.json` (24 cases: lookalike host, subdomain, port, user information, upper-case
  host, CR/LF in a title, title at 100 and 101 characters). OpenRouter's page is pinned in the source ledger by SHA-256.
- Text: interop.md C3.2, provider.md, the memory pilot (adapter reference, estate loop, source ledger, DOCMAP), the comms
  comments.
- [Adoption](../evidence/adoption.md): the organization's pins on 2026-10-12 (the adapter `b291bf0`, the relay
  `51719e4`, Project Observatory's node `20a818e`), annotated on DEC-0020…DEC-0029 and linked from the adoption spec.
- Board: CT-15 done in the contract; CT-18, CT-19 and CT-20 name what each consumer adopts.

## Checks run

On the branch off `main` `252fd25`: `tsc --noEmit` exit 0; `vitest run --coverage` 51 files, 2689 tests passed, every
floor met, whole set 5147 / 5297 branches (97.16 %), `usage-rules.ts` 84 / 84, `openrouter-attribution.ts` 47 / 47;
`python3 docs/ux/lint.py` exit 0; `tsx src/docs-check.ts` passed; `tsx src/lint-md.ts` 0 errors on 139 files;
`tsx src/privacy-check.ts` with `ORG_INDEX` set to the org-index checkout: 0 findings. Plants: 10 in `usage-rules.ts`
and 13 in `openrouter-attribution.ts`, each removed once and a test failed (23 of 23 caught).

## Decisions taken here

- `sessionId` is not a field of a usage report: a session is the caller's, and DL-22 keeps callers out (the canvas's
  to-be for N11).
- A request that already carries any attribution header gets none of the product's, so a user's attribution is never
  mixed with a product's.
- Categories OpenRouter would drop silently are refused before sending; the list is the page's on 2026-10-12, and a
  later change of that page is a new source row and a revision of this rule.

## Open

- The three independent readings of this change are owed with P5-01's and those of #63–#65 (W4-READINGS-OWED, N19).
- **Next task:** close wave 5. Then N19: review Project Observatory's relay-audit pull request when it arrives (its
  question batch was answered on 2026-10-12). Then wave 6 (N12, N20).
