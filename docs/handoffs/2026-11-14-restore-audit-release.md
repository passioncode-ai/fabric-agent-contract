# Handoff 2026-11-14: restore, audit, land and release (CT-287)

## Objective

The operator's word of 2026-11-14 in this repository's session: restore the last run's work, audit the repository and
its branches, collect defects and gaps, and carry the work autonomously to a release, checked against the board and the
North Star.

## Done

- Restored: DEC-0166's round-16 fold, left uncommitted in the `ct285` worktree, committed after its gate
  (`94c85c9e`, `pnpm run check` exit 0, 119 files, 11357 tests; vectors exit 0).
- Board: the operator's answers of 2026-11-13 relayed on thread `8da128cf` (message `63fc6314`); CT-302 to CT-304 filed
  (#299) from the host agent's decision verifier proposal and an organization's X-01 and X-03, answered on their
  threads; the coordinator's request `3f82608e` answered (CT-302's design by 2026-11-18).
- Audit of main: CT-295's status began `in progress` after DEC-0163 merged; the handoff index linked a deleted branch and
  named none of the five North Star DEC branches (#300); the #301 merge put DEC-0164 before DEC-0163 in the register
  (#302, the sorted lines equal before and after).
- The finish-line rule for blind readings, written for every round of this run (the reading prompt kept outside the
  repository): a tier fails only on a blocking finding (a normative contradiction, code or vectors against the text, a
  false citation, a security or privacy defect, an operator's answer contradicted); everything else is a risk filed as
  a row. The earlier loops (up to 33 rounds) counted any inconsistency as a failure.
- Landed: DEC-0164 (CT-259, #301, rounds 18 and 19 clean; risks CT-305) and DEC-0156 (CT-220, #303, rounds 36 and 37
  clean; risks CT-306).
- Released `v0.1.0+2026-11-14` on `91c031c4` (DEC-0156, DEC-0163, DEC-0164): gate exit 0 (118 files, 11241 tests,
  privacy 0 findings), vectors exit 0; announced on the board (thread `a38a60f9`, message `ff1d5e15`).
- DEC-0162 (CT-250), rounds 23 to 27 folded, 24 clean. The blocking findings were real: a level of one organization was
  taken in another or in a personal context; in an organization's context the descriptor holder's operator decision,
  elicitation or `approval/1` decided acts declared `owner` or `admin`; the board host's slot move; DL-18 against LV-10;
  OW-1 to OW-6 not restated after DEC-0156 landed. CT-307 filed (the Project owner's agent twin for holds and listing).
- DEC-0166 (CT-285), rounds 17 and 18 folded: "outside the estate" includes an organization's members; a standing
  mandate names its context (`standing.context`) and stands only for a call in it.

## Open

- DEC-0162 round 28 at `35f11bca`; two clean rounds in a row land it, then annotate DEC-0121, DEC-0125, DEC-0127,
  DEC-0133, DEC-0140 and DEC-0149 (its handoff's Next task).
- DEC-0166 round 19 after merging DEC-0162's head into `agent/ct285-autonomy-profile-20261112` (head `b5b538b7`).
- DEC-0157 (CT-216) round 31 at `813c6345`, DEC-0159 (CT-218) round 23 at `b18bd13e`, DEC-0161 (CT-284) round 2 at
  `49414c5d`: main merged in, not read since.
- DEC-0158 (CT-215): OS-6 and OS-7 re-cut against DEC-0166 first. DEC-0160 (CT-228): main not merged (60 behind).
  DEC-0165 (CT-292) and DEC-0167 (CT-252): first readings after DEC-0166 and DEC-0162.
- A release `v0.1.0+2026-11-14.2` once DEC-0162 and DEC-0166 land.

## Decisions

- The finish-line rule above, from the operator's standing rule (a unit ends when two consecutive rounds find nothing
  that blocks its objective; the rest becomes rows).
- "Outside the estate" (DEC-0166 AU-2) reads as the contract's estate, one person's: a colleague is outside it, so a
  profile covers no send to them. Chosen as the safest reversible reading of the operator's «Да, человек».
- In an organization's context the owning member decides a hold and a listing in the host's own controls; their
  agent's twin is CT-307 (DEC-0162 round 26).

## Checks run

- `pnpm run check` on main `22adc3dc` (start) and `91c031c4` (release): exit 0 both.
- Per landing: the branch gate on the read head, `pnpm run docs:check` and `privacy:check` on the landing commit.

## Next task

Fold DEC-0162 round 28's findings or, if clean, run round 29; land DEC-0162, then DEC-0166 (round 19 onward), then
release `v0.1.0+2026-11-14.2`. After them: DEC-0159 round 23, DEC-0157 round 31, DEC-0161 round 2.
