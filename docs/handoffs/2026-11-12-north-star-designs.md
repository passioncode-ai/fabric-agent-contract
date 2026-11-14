# 2026-11-12: four North Star designs and Observatory's answer (CT-250, CT-285, CT-252, CT-259)

## Objective

Land on main the four designs fabric-workspace's unified plan asked of the contract by 2026-11-13 18:00 UTC (board
requests `4a1bf8d6` and `e9d30889`, thread `8da128cf`), confirm CT-259's event shape with Project Observatory, and
close the board requests.

## Done

- The designs, merged in #270 (`a054fdc6`):
  [CT-250 authority levels](../evidence/plans/2026-11-12-ct250-authority-levels.md) (LV-1 to LV-11),
  [CT-285 autonomy profile per place](../evidence/plans/2026-11-12-ct285-autonomy-profile.md) (AU-1 to AU-7),
  [CT-252 estate manager](../evidence/plans/2026-11-12-ct252-estate-manager.md) (MG-1 to MG-6),
  [CT-259 activity unit](../evidence/plans/2026-11-12-ct259-activity-unit.md) (AE-1 to AE-5). Gate `pnpm run check`
  exit 0 on `c705afd0`. Board request `4a1bf8d6` completed.
- This change: Observatory's answers folded into CT-259 (`taskClassMap`, `run.root` in every event id, the
  capability `activity.unit.record`); CT-250's question 6 (an organization product's own signed delegation stays
  inside it; `mandate/1` is what travels); backlog CT-259 and CT-289 statuses, CT-290 filed (PLAT-148's
  `setup-step/1` and gate vocabulary).
- CT-289: night one green, scheduled run `43138522402` (2026-11-12 02:01 UTC), ubuntu Node 22 and 24, macOS and
  Windows all `success`.

## Open

- CT-289 closed 2026-11-13: night two green, scheduled run `43345669320` (2026-11-13 01:32 UTC), all four jobs `success`.
- The DECs for CT-250, CT-285, CT-252 and CT-259 by the organization slice of 2026-11-21, CT-250 first (the
  organization product and PLAT-146 wait on it). Reserve the DEC and FAC-SEM ids with `agent_sync.py reserve` when
  drafting. Each design's operator questions take their defaults unless answered before 2026-11-21.
- CT-290: the design by 2026-11-19.
- Tell Observatory (thread `52aa2f93`) when the CT-259 DEC lands and that `taskClassMap` is in.
- The first branch of this work (`agent/ct250-levels-design-20261112`, commit `4707e6da`) carried a private name and
  was deleted unmerged; the commit may stay fetchable by SHA until GitHub collects it. No secret was in it.

- The six proposed DECs on branches (CT-287): DEC-0156, DEC-0157, DEC-0158 and DEC-0159 had main merged in on
  2026-11-12 and are read again (status in CT-287's row); DEC-0158 waits for a re-cut of OS-6 and OS-7 (its handoff);
  DEC-0160 and DEC-0161 (CT-228, CT-284) untouched. The CT-285, CT-250, CT-252 and CT-259 rows name the branch rules
  their DECs restate (#273).

- The operator's word of 2026-11-12 (this session): an agent that can reach several organizations asks which one a
  task is for when the project's context does not settle it, done in the protocol and the skills, not as one agent's
  rule. [The task context design](../evidence/plans/2026-11-12-ct292-task-context.md) (CT-292, TC-1 to TC-6, #277); the
  adapter asked for the skills (board request `bfc0e14e`, due 2026-11-19), the agents database for the templates
  (`2290a5cd`, due 2026-11-21), fabric-workspace for the knowledge base (`fc55c15a`). From the same review of which of
  the operator's standing rules belong in the protocol: CT-293 (an order carries the access it needs, #278). The review
  itself is private to the operator and kept outside this public repository.

## Decisions

- `taskClassMap` is `{id, revision}` with an integer revision, chosen over a `sha256:` digest of the map: a reader
  joining months needs the order of revisions, which a digest does not give.
- PLAT-148's two formats are taken by the contract (CT-290), so the requester drafts no DEC.

## Checks run

- `pnpm run check` on the merged head of #270: exit 0. This change: see its PR.
- `gh run view 43138522402 --json jobs`: four jobs, all `success`.

## Next task

Fold the blind readings already returned (DEC-0156 round 27, DEC-0157 round 24, DEC-0159 round 17; their
findings are in this session's record and each branch's handoff names the round next), then the next round of each;
then the CT-250 DEC, and the CT-292 DEC with `resolveTaskContext` and its vectors. Earlier plan, kept: Fold the running blind readings of DEC-0156 (round 26) and DEC-0157 (round 23) and land each after two clean
rounds; read DEC-0159 (round 16). Then draft the CT-250 DEC on a branch `agent/ct250-dec-<date>`: reserve a DEC id, `org-membership/2`, the level form in
`decision.schema.json`, the `mem` claim in `delegation-token.schema.json`, the OL-6 amendment, FAC-SEM codes and
vectors, as the design's "What the DEC owes" lists.
