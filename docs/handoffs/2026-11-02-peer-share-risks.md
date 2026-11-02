# 2026-11-02: a peer share's risks from its readings settled (CT-189, DEC-0147)

## Objective

Settle the risks CT-178's last clean readings (rounds 12 and 13) left on DEC-0142 and DEC-0143 (CT-189), without
moving what Project Observatory's released engine `v0.30.0` already sends.

## Done

- DEC-0147: a usage report restates its `iat` day and the 35 UTC days before it, every export beside its day and slot
  entry (`peerReportBody` refuses one without, `bad-body`); the sender replaces uses per day and slot and keeps exports
  (by slot and parsed instant) and labels as sets, so its export count never falls. A secret is "typed in or handed
  out" in AP-4, DL-26, MD-6, OA-5 and ST-037. The agent twin of the secret prompt's "Decline" declines an open request
  only; a withdrawal or a decline before the prompt is answered by the node with no prompt. The agent twin of "Open a
  share" hands the link to the node and answers success with the person's Accept as the next step; the pin comes only
  from a link quoted in the operator's decision, and the audit record replaces the link's fragment with the share id.
  The four local-channel readers answer input that does not read. Vectors: one envelope, one report `enc`, three
  bodies, four outcomes; no earlier vector's answer changes.
- Readings: rounds 1 to 4 failed and were answered in turn (the twin claiming before Accept, the Decline twin missing
  from SCR-34, FLW-34 and SCN-053, `v0.30.0` as a deployed implementation, the pre-prompt decline and withdrawal, the
  export "reported before" it leaves, the share store); rounds 5 (`4f584d53`) and 6 (`1aefbaf8`) passed on unit, seam
  and product.

## Open

- CT-186: Project Observatory's engine adopts DEC-0147 in the order its row gives, before any node ships the export
  button.
- CT-201: what the round-2 to round-6 readings left, none blocking, two of them the operator's call (a sender still on
  the delta reading paired with an export button; exports since the last report around a take-back).

## Checks actually run

The gate from the worktree on each head through round 6 and on the merge head: `pnpm typecheck`; vitest with coverage
outside the worktree (9748 passed, 1 skipped); `pnpm ux:lint` (40 stories, 34 flows, 34 screens, 53 scenarios);
`pnpm docs:check` (0 errors); `pnpm privacy:check` (0 findings); `pnpm vectors:check` (28 files match); no U+2014 in
the added lines.

## Next task

Post the release tag to Project Observatory on thread `faa32585` with CT-186's ordered duties; then CT-200's decision
(a repeated renewal by the key on record, due 2026-11-11).
