# Questions for the first-organization release (2026-10-25)

The question queue of [the plan](../plans/2026-10-25-first-organization.md). Each row: what it blocks, the sources
tried, the recommended answer and what each answer leads to. Asked of the operator as one batch on 2026-10-25;
an answer is recorded here with its date, and an unanswered internal question proceeds on its recommendation,
marked assumed.

| Id | Question | Blocks | Sources tried | Recommendation | Consequences |
|---|---|---|---|---|---|
| Q-01 | Which organization is "the first organization": our own organization on the first organization server, or the first customer organization (RM-34's pilot)? | wave 2's scope and date | fabric-workspace `knowledge/roadmap.md` (RM-26, RM-28, RM-34), `docs/reports/2026-10-22-passioncode-status/README.md` (our organization not yet activated), CT-122's brief | our own organization first, then the customer | own: CT-122 can follow the person's own enrollment and K-1 stays off; customer: CT-122 is a hard gate before enrollment |
| Q-02 | What makes the release "finished": a dated tag after waves 0 to 2, or a `contractVersion` move (0.1.0 to 0.2.0) with stated criteria? | the release step | DEC-0108 (`contractVersion` moves only by a decision that changes something required), `docs/specification/versioning.md` (no 1.0 criteria stated anywhere) | a dated tag now; move to 0.2.0 with the D5 protocol revision | a 0.2.0 now makes every consumer re-pin for an additive release |
| Q-03 | Class G (41 rows of other products' adoption): keep them as open rows here, or close them on the contract's side once each names its consumer row, and track adoption on one re-measured page? | D7, the backlog's size | `docs/evidence/adoption.md` (last measured 2026-10-12), fabric-workspace `knowledge/backlog.md` (one editable home per task) | close here, track on the adoption page | open rows: the contract keeps looking unfinished; closed: adoption is read on one page and each product's own board |
| Q-04 | CT-92's second half: on a work machine (`machine.mode` C), may an organization see agent services and harness items a person installed for other contexts? | wave 2, CT-122's order | DEC-0118 (answered the first half), CT-92's row | no: an organization sees only its own context's items | yes would make CT-122's unlinkability moot on that machine |
| Q-05 | CT-122's seven questions: take the brief's defaults? | CT-122 | `docs/evidence/specs/2026-10-24-ct122-unlinkable/brief.md` (seven questions, each with a default) | yes, the defaults | otherwise each needs its own answer before 2026-11-06 |
| Q-06 | CT-128: wait for the limit to reset on 2026-10-30, or read DEC-0121 now on another account or a different model? | wave 3 | the action-parity handoff (the limit stopped round 3) | wait; nothing is broken at head and the gate passed | reading now on a different model is a weaker reading than the rounds before it |
| Q-07 | D5 (one grammar per concept, CT-76; identifier equality, OQ-0011): after the first organization runs, as one protocol revision? | wave 5 | the contract review of 2026-10-21 (findings C2 to C23), DEC-0076 | after, together | before: every consumer re-pins during the rollout |
| Q-08 | 17 expired agent-sync leases on origin from earlier runs: clear them (`reap --long-expired --apply`)? | nothing | `agent_sync.py residue`: every one `[foreign]`, expired 15 h to 2 days | yes | they block nothing either way; clearing keeps `fabric_work_list` readable |
| Q-09 | The record plane: `AGENT_SYNC_NOTION_TOKEN` is empty, so runs are journaled on this machine only. Fix it or accept `fs`? | nothing in this release | `agent_sync.py status`, AGENTS.md | accept `fs` while one machine works here | a second machine sees leases (git) but not the journal |

## Answers

Relayed on the project board by fabric-workspace (request `8e2d5099`, thread `8d115bed`) and recorded as the operator's
decisions in fabric-workspace `docs/reports/2026-10-25-organization-r1/README.md` at `d438e3dc` (R1-D1, R1-D12, R1-D13,
R1-D17):

| Id | Answer (2026-10-25) | What it changes here |
|---|---|---|
| Q-01 | The first organization is RM-28's pilot: our own organization first, as a rehearsal, then an outside organization; it runs on members' Macs and existing servers, no cloud VM on the critical path (R1-D1, R1-D2) | the operator's Mac is in both organizations, so CT-122 is a hard gate before the second one joins; CT-93 (`org-cloud`) leaves the path |
| Q-04 | In mode C a person cannot hide the summary of the organization's own context from it; their personal context is not visible to it anyway (R1-D17). Isolation for this release: mode C plus CT-122's unlinkable memberships; level 3 moves to the next release (R1-D13) | CT-92's second half is answered; its decision record remains |

Five rows came with the answers: CT-137 to CT-141.

On 2026-10-26 fabric-workspace, which takes these questions for the operator under the mandate of 2026-10-25
(announcement `a509fcc0`), closed the rest (message `418da12a` on thread `c9d5be94`; its record MD-6 in
fabric-workspace `knowledge/integration.md` at `4c38d0b7`). It answered by the recommendations above:

| Id | Answer (2026-10-26) | What it changes here |
|---|---|---|
| Q-02 | a dated tag now; `0.2.0` with the D5 protocol revision | releases stay `v0.1.0+<date>` (DEC-0108) |
| Q-03 | assumed: close class G here once each row names its consumer row, and track adoption on one page. MD-6 queues a "Q-03" for the operator, but that is Fabric Dashboards' Q-03 (a passkey sign-in), not this one | a later cut of the backlog closes class G rows with their consumer ids |
| Q-05 | CT-122's seven defaults | CT-122's decision text by 2026-11-06 takes the brief's defaults |
| Q-06 | wait for the limit to reset | CT-128 reads DEC-0121 after 2026-10-30 |
| Q-07 | D5 after the first organization, as one protocol revision | wave 5 unchanged |
| Q-08 | clear the long-expired foreign leases | on 2026-10-26 `agent_sync.py reap --long-expired` found none expired 7 days or more (`residue`: 17 refs, the oldest expired 32 h before); they are cleared once they pass that age |
| Q-09 | accept the `fs` record plane while one machine works here | unchanged |

