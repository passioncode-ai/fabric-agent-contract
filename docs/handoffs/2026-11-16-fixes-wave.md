# Handoff 2026-11-16: the fixes wave after DEC-0171 and DEC-0172, and the CT-321 design

**Objective.** After DEC-0172 landed: fix the bugs its and DEC-0170's and DEC-0171's readings left (CT-317, CT-322,
CT-323), refactor what they named, fix the UI scenarios they owed, and bring the docs up to date; design CT-321.

**Done.**
- DEC-0172 merged (#321) and released with DEC-0157 and DEC-0171 as `v0.1.0+2026-11-15.2`; the first organization
  server pins it after its 0.9.10.
- The fixes wave merged: a defect, `FAC-SEM-179` threw on a member that cannot be printed (now `show`, DEC-0082, both
  verdict kinds in the tolerance sweep); `src/org-instance.ts` and `src/decision-verdict.ts` in the coverage set with
  floors; edge vectors for `org-instance/1` (key window, skew, retirement alone) and for `routeInventory`; a relayed
  mandate graded `taken` and a relay `forwarded`, with vectors; the protocol register sorted and its order tested;
  scenarios ST-044, FLW-35, SCR-35, SCN-063 (an organization reads turn and account cells) and SCN-064 (an instance
  added and retired); IS-1 names two origins.
- The CT-321 design merged (#322): the instance facts as the extension `instance-facts/0.1`; rows CT-324 and CT-325.
- Blind readings: the fixes wave's rounds 5 and 6 clean on all three tiers; the design's rounds 5 and 6 clean.
- Filed: CT-326 (the wave's risks).

**Checks run.** `pnpm run check` exit 0 on the landing commit (see the PR).

**Open.**
- DEC-0173 (CT-321) on `agent/ct321-instance-facts-dec-20261116`: the schema, `instanceFacts`, `FAC-SEM-180` and the
  vectors are written; the spec section, conformance rows, CONTEXT, the details-panel scenario and the readings next.
  Answer to Fabric Dashboards due 2026-11-22.
- CT-325 (the adapter's FAA-190, six secret shapes) on `agent/ct325-secret-shapes-20261116`: waiting for the adapter's
  exact forms or branch (asked on the board, `b63a1c30`); due 2026-11-22.
- CT-317 (1) to (4), CT-322's normative items, CT-323's remaining items, CT-324, CT-326.

**Next task.** Finish DEC-0173 and read it to two clean rounds.
