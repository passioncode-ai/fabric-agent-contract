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

- CT-289 closes after night two (the scheduled run of 2026-11-13).
- The DECs for CT-250, CT-285, CT-252 and CT-259 by the organization slice of 2026-11-21, CT-250 first (the
  organization product and PLAT-146 wait on it). Reserve the DEC and FAC-SEM ids with `agent_sync.py reserve` when
  drafting. Each design's operator questions take their defaults unless answered before 2026-11-21.
- CT-290: the design by 2026-11-19.
- Tell Observatory (thread `52aa2f93`) when the CT-259 DEC lands and that `taskClassMap` is in.
- The first branch of this work (`agent/ct250-levels-design-20261112`, commit `4707e6da`) carried a private name and
  was deleted unmerged; the commit may stay fetchable by SHA until GitHub collects it. No secret was in it.

## Decisions

- `taskClassMap` is `{id, revision}` with an integer revision, chosen over a `sha256:` digest of the map: a reader
  joining months needs the order of revisions, which a digest does not give.
- PLAT-148's two formats are taken by the contract (CT-290), so the requester drafts no DEC.

## Checks run

- `pnpm run check` on the merged head of #270: exit 0. This change: see its PR.
- `gh run view 43138522402 --json jobs`: four jobs, all `success`.

## Next task

Draft the CT-250 DEC on a branch `agent/ct250-dec-<date>`: reserve a DEC id, `org-membership/2`, the level form in
`decision.schema.json`, the `mem` claim in `delegation-token.schema.json`, the OL-6 amendment, FAC-SEM codes and
vectors, as the design's "What the DEC owes" lists.
