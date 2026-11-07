# What is left in the contract until the North Star (2026-11-07)

**Status:** a cut for the operator's review, 2026-11-07. It changes no row's state: a row's state lives in
[the backlog](../../backlog.md), and the next cut replaces this one. Parent: the knowledge base's
[North Star](https://github.com/passioncode-ai/fabric-workspace/blob/f0645de1/knowledge/north-star.md) (sections 0 to
14, gaps G1 to G28) and the estate's cut of the same day,
[what is left until the North Star](https://github.com/passioncode-ai/fabric-workspace/blob/f0645de1/docs/plans/2026-11-07-remaining-to-north-star/README.md),
which this page narrows to the contract.

**The operator's request (2026-11-07, this repository's session):** «давай составим план что осталось сделать на базе
логов но смержи с виженом из north star документа в fabric workspace».

**How it was read.** The logs: `git log --since=2026-11-04 origin/main` (main `bb8eaa05`), the open branches
`origin/agent/*` with commits not on main, the handoff index ([handoffs](../../handoffs/README.md)), the open pull
requests (`gh pr list --state open`), the backlog at `bb8eaa05`, and the project board since 2026-11-06 12:00 UTC (the
first page of `com.list`, 100 messages, read to 2026-11-06 14:36 UTC). The vision: fabric-workspace `f0645de1`,
`knowledge/north-star.md` and the estate cut above. A row counts as open when its Status cell does not begin with done,
closed, superseded, withdrawn, dropped or merged.

## Where the contract stands

- **Main** `bb8eaa05` (2026-11-07 15:53 +0100); the newest tag `v0.1.0+2026-11-07.2` (DEC-0149), before it
  `v0.1.0+2026-11-07.1` (DEC-0154) (`git tag --sort=-creatordate`). The nightly CI on main passed on 2026-11-07 at
  00:27 and 01:22 UTC and failed on 2026-11-06 at 01:51 UTC (`gh run list --branch main`).
- **The register:** 252 rows after this cut, 174 open (172 before CT-259 and CT-260). A keyword split of the 172:
  about 31 are a consumer's adoption the contract only closes on a re-pin, about 18 are blind readings' non-blocking
  findings, and about 123 carry the contract's own next step, many of them already decided in the contract and waiting
  on one product's part.
- **Decided this week and not on main:** DEC-0151 (`agent/sqd-fields-20261104`, 39 commits ahead, last 2026-11-05,
  CT-210) and DEC-0152 (`agent/ct217-board-same-turn-20261104`, one commit, 2026-11-04, CT-217). Fabric already cites
  DEC-0152 (SA-2, SA-3) in the rules `fabric_whoami` hands every session, so a rule the estate reads has no merged
  decision behind it.
- **Open pull request:** #250 (CT-254, HA-2's Linux source rule; mergeable, updated 2026-11-07 09:00 UTC).
- **Stale branches:** `agent/ct194-source-manifest-20261103` (78 commits, not an ancestor of main) was replaced by the
  v2 branch merged in #251; `agent/template-parity-20261103` (3 commits) carries CT-206's README part.
- **The pause:** ended for every project on 2026-11-07 («снимай пайзу для всего», relayed on `eefa7959`, message
  `d9d8d929`). Before that, the operator paused new work on 2026-11-06 (board thread `eefa7959`) and resumed this repository's
  sessions on 2026-11-07 («делай автономно до конца»,
  [handoff](../../handoffs/2026-11-06-shared-host-ports.md), «Resumed 2026-11-07»). CT-250 and CT-252 still say
  «the operator's pause»; their design date 2026-11-13 is unchanged.

## The contract against the North Star

The North Star names the contract as owner in G2, G10 (with Fabric), G12 and G22, and as Observatory's partner in G1-a.
It also builds on the contract where it names no owner: every product speaks one contract (§4, «One system»), an agent
is built from templates with the contract built in (§5), the board's rules (§6), isolation (§11) and rebuild (§10).

| North Star | What the contract owes | Rows | State |
| --- | --- | --- | --- |
| G2, §1 principle 2: levels, approve by level | one DEC: a project architect in `org-membership/1`, a level read from a verified attestation stands as the decision for AP-2, the mandate and `approval/1` | CT-250 | design due 2026-11-13, DEC by 2026-11-21 |
| G10, §6: Fabric as the main agent | one DEC: an estate-scoped role slot, binding and execution context (today both require `project`) | CT-252 | design due 2026-11-13 with CT-250; Fabric's manager step 3 waits on it |
| G12, §1 principle 8: calls only within an organization | one DEC with provider-account isolation; it contradicts DEC-0082, DEC-0086, DL-27, DL-29, `peer` and PS-3 on main | CT-251 | waits on the operator's (a) or (b), board message `4076f54f` |
| G22, §2: an organization's own machine | `machine.mode` for an OS account an organization owns whole | CT-232 | open; DEC-0154 accepted, so unblocked |
| G1-a, §0: the activity event (the missing join) | the shared event schema Observatory's journal (OBS-378) and the products emit; DEC-0030 and DEC-0031 already carry telemetry | CT-259 (filed by this cut), CT-04, CT-116 | design due 2026-11-13 with OBS-378 |
| G27, §11: no agent runs outside the template and the contract | an admission profile of the conformance checker an organization runs before a member's agent starts | CT-260 (filed by this cut) | proposed |
| G21, G23, §5: templates and one command for a new agent | DEC-0149 adoption, one agent with a local and a cloud instance, the template parts | CT-207, CT-208, CT-218, CT-224, CT-132, CT-133, CT-255, CT-256 | CT-218 draft due 2026-11-11; the rest adoption or follow-ups |
| §6: the board, waits, mandates | answer in the same turn, the operator's word carried out the first time, on-demand sessions, waits and tasks that outlive a session or a mandate, the agent twin's decision gate | CT-217, CT-220, CT-215, CT-150, CT-205, CT-181, CT-174 to CT-183 | CT-217 drafted, not merged; CT-220 due 2026-11-08; CT-215 due 2026-11-09 |
| §1 principle 10: analytics, never surveillance | anonymous usage and error data by default, within DEC-0031's person rule | CT-216 | draft due 2026-11-09 |
| §11: isolation on a shared computer | DEC-0154's tail: the claim file's schema and port choice with vectors, the state order's vectors, directory ownership, the gate on a shared computer, guests, the host label | CT-228, CT-229, CT-230, CT-237, CT-238, CT-239, CT-241, CT-242, CT-243, CT-253; CT-254 (PR #250) | CT-228's schema blocks Fabric CO-513, Observatory OBS-354, Switchboard SB-278 |
| §10, G14: rebuildable, one place per singleton | what a device is on a shared computer, a restore never carries an identity, services of an account with no session, containers, the placement record | CT-231, CT-233, CT-234, CT-235, CT-236 | open, filed 2026-11-06 |
| G15, §10: a rehearsed «machine lost» | an organization root's succession and recovery; a hub re-key without its lease division; reopening a lost hub's windows | CT-160, CT-199, CT-195 | CT-195 is the operator's decision |
| G5, §6: the hub, the relay, boards between machines | the relay's adoption, its handshake, what it carries, the machines' report, a project's release from an organization | CT-33, CT-37, CT-152, CT-159, CT-162, CT-163, CT-164 | CT-163 waits on the operator, Fabric or the first organization server |
| G16, §2: the organization's cloud | the cloud machine's usage, the encrypted server store, a service bound to a context | CT-93, CT-94, CT-140, CT-138 | CT-138 due 2026-11-14; CT-140 targets 2026-11-21 |
| G13: a project in several organizations | the decision after CT-122's design | CT-141 | waits on the operator's G13 answer |
| §9: assessment and support quality | `support-quality-daily/1`'s product, calibration and the producers' own schemas | CT-61, CT-103, CT-129, CT-188, CT-210 (DEC-0151, unmerged) | DEC-0151 waits to land |

## Decisions only the operator can make (the contract's part)

| # | Decision | Where it was asked | Unblocks |
| --- | --- | --- | --- |
| 1 | Calls only within an organization: share grants go (a) or stay as an exception in the organization's context (b) | board message `4076f54f`, question 1 | CT-251, G12, CT-255's moves |
| 2 | Whether the person may reopen the spending windows a lost hub divided | CT-195 | G15's runbook |
| 3 | Which traffic an organization's relay carries between members | CT-163 | G5's relay design |
| 4 | Whether the operator's mandate covers a product's own `approval/1` against a hostile local process | CT-168 | the levels' bounds in CT-250 |
| 5 | The inventory of the personal agents' homes, for review | CT-255 | G23's template extraction |

Decision 1 is also the estate cut's decision 2; the estate's decision 1 (lift the pause) is already taken for this
repository.

## Waves

### Wave 0: now (2026-11-07 and 2026-11-08)

1. Done 2026-11-07: PR #250 (CT-254) merged (`1705d0f3`) after three readings and the gate, released
   `v0.1.0+2026-11-07.3`; Dashboards FD-168 and Fabric CO-528 build on it.
2. Land DEC-0152 (CT-217): its draft date was 2026-11-07, and Fabric already hands its rule to every session. Rebase on
   main, blind readings, gate, merge, tag.
3. Land DEC-0151 (CT-210, the ticket counts in `support-quality-daily/1`) the same way, or record why it waits.
4. Draft CT-220 (due 2026-11-08).
5. Done 2026-11-07: both stale branches archived under `refs/archive/2026-11-07/` and deleted (`template-parity` was
   squash-merged in #236); 34 merged branches deleted on `origin`, which keeps `main`,
   `agent/ct217-board-same-turn-20261104` and `agent/sqd-fields-20261104`; the merged and abandoned worktrees and
   standalone copies of this repository under `_worktrees` removed (each clean with its head on `main`, or a copy
   derived from a commit), the locked `fabric-agent-contract-00e050b` kept; 48 local scratch refs (`refs/tmp`,
   `refs/scratch-t3`, remote-tracking refs of no remote) deleted; `git gc`, `.git` from 47 MB to 18 MB.

### Wave 1: designs, to 2026-11-13

1. CT-250 and CT-252 designs, one branch, the same levels read the same way; the DECs by 2026-11-21.
2. CT-228: the claim file's schema and the port-choice reference with vectors (Fabric CO-513 waits).
3. CT-259 with Observatory's OBS-378: the activity event schema (G1-a).
4. CT-215 and CT-216 drafts (due 2026-11-09), CT-218 (due 2026-11-11), CT-232 (G22).
5. CT-138's proposal (due 2026-11-14).

### Wave 2: the organization slice, 2026-11-21

1. CT-250, CT-252 and, after the operator's answer, CT-251 merged and tagged; every product's level row (CO-523,
   OBS-377, SB-291, B-232, FD-164, FAA-249, PC-162, PLAT-141) re-pins.
2. CT-140, the encrypted server store (target 2026-11-21).
3. CT-229, CT-230, CT-237 to CT-239, CT-241 to CT-243, CT-253: DEC-0154's tail, so the pilot's shared machines run on
   a finished rule.
4. CT-231, CT-233, CT-234, CT-236: what the pilot's rebuild and singletons need (G14).

### Wave 3: after the slice

1. CT-260, the admission profile (G27), with Observatory and the adapter.
2. G15: CT-160, CT-199, then CT-195 by the operator's decision.
3. G5: CT-162 to CT-164 once CT-163 is decided; CT-33 and CT-37 with the relay's RLY-05.
4. A debts release: the non-blocking findings (CT-151, CT-153, CT-155, CT-158, CT-164 to CT-166, CT-171, CT-176,
   CT-179, CT-180, CT-182, CT-183, CT-187, CT-197, CT-198, CT-201, CT-204, CT-212, CT-221 to CT-223, CT-225, CT-226,
   CT-240, CT-257) in one branch, as DEC-0120 did on 2026-10-24.
5. The adoption rows close on each consumer's re-pin; the contract checks each pin with `pnpm pin:check`.

## Drift between the vision and the records

| # | The record says | The fact | Fix |
| --- | --- | --- | --- |
| 1 | Fabric's session rules cite DEC-0152, SA-2 and SA-3 | DEC-0152 is on `agent/ct217-board-same-turn-20261104` only | Wave 0, item 2 |
| 2 | CT-250 and CT-252: «the operator's pause» | the contract's sessions resumed 2026-11-07 | update both status cells when the designs start |
| 3 | North Star G2 and G12: CT-250 and CT-251 «open PR #246» | #246 merged; the rows are on main | the estate cut lists it (its drift row 4); fabric-workspace owns the page |
| 4 | North Star G1-a names Observatory and the contract; the contract had no row | CT-259 filed by this cut | tell Observatory on the board when its design starts |

## Exact next task

Wave 0, item 1: rebase PR #250 on main `bb8eaa05` if needed, run `pnpm run check`, merge, tag, and post the tag on the
board for Fabric (CO-528) and Dashboards (FD-168).
