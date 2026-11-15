# Handoff 2026-11-15 (part 4): DEC-0168, DEC-0169, DEC-0170 and the CT-302 design landed

**Objective:** the resume order of part 3: merge DEC-0168, DEC-0169 and DEC-0170 in order, each read under the
finish-line rule (`~/DATA/_worktrees/_rounds/common.md`: blind unit, seam and product readings, two consecutive clean
rounds), then CT-302's design, and answer every board request they serve.

## Done

| What | PR | Main | Readings | Board |
|---|---|---|---|---|
| DEC-0168 (CT-299): `entitlement/2`, `allowances` `limited` or `unlimited`, `FAC-SEM-175` | #311 | `c15d92da` | rounds 4 and 5 clean | platform, thread `16093ded` (`9d56b6a1`) |
| CT-302 design: `decision-verdict/1`, DV-1 to DV-8; rows CT-312 to CT-315 | #312 | `e1da09c0` | rounds 11 and 12 clean (seam, product) | Fabric, agents database, studio-agent, thread `f9cc38ee` (`c1c6603f`) |
| DEC-0169 (CT-311): read parity RP-1, the design order RP-2, `FAC-SEM-176` | #313 | `6adeecf3` | rounds 6 and 7 clean | adapter, request `6f1f3ec9`, thread `b2eef40c` (`94e73f67`) |
| DEC-0170 (CT-314): `org-instance/1`, `verifyOrgInstance`, `FAC-SEM-177`, 39 vectors | #314 | `f3e4a337` | rounds 3 and 4 clean | first organization server and platform, thread `fb41cd09` (`9b42e171`) |

Blocking findings folded on the way: DEC-0169 RP-1 against RP-2 (a view's agent route is a tool or the documented
API) and its restatements in CONTEXT and DEC-0121's annotation; DEC-0170 IS-3's window (no grace after `expiresAt`),
key retention for 7-day statements (rotation, OX-4, IS-4, the issuer row, the key-set schema) and the origin's form
(no port, with a vector). Each landed branch was archived under `refs/archive/2026-11-15/` and deleted.

## Open

- CT-316 and CT-317: what the readings of DEC-0169 and DEC-0170 left open, none blocking (rows in
  [`docs/backlog.md`](../backlog.md)).
- The CT-302 DEC (schema, rule code, reference check, vectors) with the risks listed in the design's last section;
  Fabric's `decision.verify` spec is due 2026-11-17 and cites the design's field names.
- The paused DECs of part 2's Open list (DEC-0157 to DEC-0161, DEC-0165, DEC-0167): each merged with main earlier,
  readings not started.
- A board message to fabric-workspace on North Star §5 and §6 for DEC-0168 to DEC-0170 (AGENTS.md 1b), sent with this
  handoff.

## Checks run

- `pnpm run check` exit 0 on each merged tree before its PR: DEC-0168 `c15d92da`'s branch, CT-302 `5624e9c7`, DEC-0169
  after `dc732690` and the main merge, DEC-0170 `c6f00be7` (11563 passed, 3 skipped).
- Blind readings: 3 tiers a round for each DEC, 2 for the design; every verdict, risk and command is in the agents'
  reports of this session.

## Next task

Read the paused DECs, oldest first: DEC-0157 (`agent/ct216-usage-data-v2`), under the finish-line rule; merge
main first (`FAC-SEM-178` is the next free rule code, DEC-0171 the next DEC).
