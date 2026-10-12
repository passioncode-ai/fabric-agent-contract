# Brief — the whole board in waves (2026-10-11)

Run: `task-pipeline waves` over the whole board of fabric-agent-contract, by the operator's request of
2026-10-11. Contract main at the start: `8e49fbd` (PR #30, DEC-0040). This brief owns the request and its
REQ table; [canvas.md](canvas.md) owns the target state, [plan.md](plan.md) the waves, and
[inventory.json](inventory.json), written by [assign.mjs](assign.mjs) from [waves.json](waves.json) and
[findings/](findings/), owns every open item.

## The request

The operator, translated from Russian: go through what is unfinished, or done with errors. Check the
documents and the board, bring the plan up to date, research and look at the links with other agents, and
go deeper where needed. Collect all the information, understand what must be built and the best shape of
the system, solve the problems in front of us, and write a step-by-step plan from the current system to the
state where they are solved. Work out each step, decompose it into tasks for developer agents carrying all
the context and research they need so they do not err, and close all tasks in one pass. Then run a
verification wave over every task — documentation, business logic, implementation, links, the technical
decision — and put what it finds into a fix plan; prioritise, research, decompose and close that in the
next wave. Repeat until the whole system is finished with maximum quality: logs added, documentation
updated, no bugs, usable by a person and by an agent. At the end an independent verifier checks the work
against the original goal, and the waves continue until it matches.

## REQ table

Frozen at planning: adding is free, removing needs the operator.

| REQ | Requirement | Verified by |
|---|---|---|
| REQ-01 | Every unfinished or wrong item is found, with a receipt (`file:line`, a command and its output, or a test) | `inventory.json`: every item has `source`; `node assign.mjs` exits 0 (no item lands on no node) |
| REQ-02 | The target state is designed against the current system before any wave is cut | `canvas.md`: as-is → to-be per module, seams, REQ → module → wave, deleted or superseded |
| REQ-03 | A step-by-step plan moves the current system to the target | `plan.md`: waves with exit criteria written before each wave starts |
| REQ-04 | Each step is decomposed into self-contained developer packets with all context and research | `packets/` per wave: each packet names its inputs, sources, files it touches, the check that closes it |
| REQ-05 | A wave's tasks close in one pass | each wave's close record: every packet `done` with evidence, or parked with a board row and reason |
| REQ-06 | A verification wave follows each wave: documentation, business logic, implementation, seams, technical decision; findings become the next fix plan | three blind tier reports per wave (unit, seam, product) plus a design reading; findings join the inventory with ids |
| REQ-07 | The system ends finished: documentation true, no known defect left unrecorded, every refusal a code a person and an agent can act on, usable by both | the last close pass: inventory has no open item outside `release: program`; `pnpm run check` green; the board's open rows each name an owner outside this repo or a dated blocker |
| REQ-08 | An independent verifier confirms the result against this request; waves continue until it does | the final product-tier reading against this brief, recorded in `acceptance.md` of this run |

## Source ledger

| Source | What it gave | Receipt |
|---|---|---|
| The board, `docs/backlog.md` | CT-01…CT-04: CT-01 and CT-03/04 open, CT-02 done | [findings/kb-handoffs.json](findings/kb-handoffs.json) F-D-005, F-D-008 |
| `docs/OPEN_QUESTIONS.md` | OQ-0010 open (deferred by the operator); all others resolved | extra item OQ-0010 |
| `docs/DECISIONS.md` DEC-0001…0040 | 87 audit findings (6+14+20+22 major/minor split in each file) | [findings/audit-dec-0001-0029.json](findings/audit-dec-0001-0029.json), [audit-part-A.json](findings/audit-part-A.json) (DEC-0030/0031), [audit-part-B.json](findings/audit-part-B.json) (DEC-0032…0036), [audit-part-C.json](findings/audit-part-C.json) (DEC-0037…0040) |
| `docs/handoffs/*.md`, carry-over ledgers, retro, acceptance | open handoff items, stale evidence, missing run stamps | [findings/kb-handoffs.json](findings/kb-handoffs.json) |
| The knowledge base (`fabric-workspace/knowledge/`), org-index, the projects wiki | RM-* tracks, the org-edition packets, stale pins and pointers | [findings/kb-handoffs.json](findings/kb-handoffs.json), [findings/owed-decisions.json](findings/owed-decisions.json) |
| The organization-edition plan (`fabric-workspace` `docs/reports/2026-10-08-org-architecture-v2/plans/`) | CON-OE-01…13 owed by this repository, their recorded answers | [findings/owed-decisions.json](findings/owed-decisions.json) |
| Other products' sessions (Fabric, the workspace, a private agent) | PR #31, PR #32, asks (a)–(f), T2 runner and model profiles | [findings/extra-items.json](findings/extra-items.json) |
| Consumers' code (Fabric, the adapter, Dashboards, Observatory, Switchboard, Inbox) | pins and adoption, measured | `findings/consumers.json` (survey running at this commit) |
| `pnpm run check` | main tree green: 22 files, 698 tests; the gate is not hermetic (F-A-001) | F-A-001 |
| Code graph | none: no `graphify-out/` in this repository | — |
| W3C Web Authentication Level 3, Recommendation of 25 August 2026 (pinned for P3-03) | the passkey assertion of `estate-record/1`: §7.2, §6.1, §6.5.5 verified offline; attestation, provenance and the counter not | [`docs/evidence/sources.md`](../../sources.md) row "Web Authentication Level 3", DEC-0055 |

## Decisions resolved from the sources, not asked

| Question | Answer | Source |
|---|---|---|
| The task window's last fallback | `grant:<ref>`, never the unsigned `tokenJti` | Fabric's session, 2026-10-11, as ADR-0144's owner; amendment 2 at `217aff4d` |
| The task window's session | the first `act.session` walking from the outermost actor | Fabric ADR-0144 amendment 2; Project Observatory's meter run notes |
| Which list of owed contracts counts | CON-OE-01…13 (v2, 2026-10-08), which maps the older seven W0 decisions | [findings/owed-decisions.json](findings/owed-decisions.json) |
| Are operator answers missing for any open packet | no: D-OE1…8, OD-1…6, V2-1…26, J1–J9 and the 49 track decisions are recorded | [findings/owed-decisions.json](findings/owed-decisions.json) |
| Private assessment schemas | never in this public repository | J10 (2026-10-07) |
| Grants per delegation token (F-B-305) | exactly one in 0.1: `maxItems: 1`, an onward token keeps the same reference | Fabric's session, 2026-10-11, as ADR-0144's owner (to be amendment 3) |
| The meter hop and the depth limit (F-B-306) | exempt: a token with `aud` the meter, `scope` grant-check and `effect: none` may have depth max + 1, no other | same |
| `approval.method: device` (F-B-314) | removed from the enum until a decision defines it; Fabric issues only `prompt` and `operator-channel` | same |
| The meter's refusal wire (F-B-301) | the meter answers `denied` with a code from the one set; a callee relays it unchanged in `error.code`; DL-19 states the step | same |
| DEC-0039 and the session lifetime (F-B-311) | annotated as a tightening; "the descriptor token rotates" defined in `service.md` | same |
| Runner and model profiles (CT-05) | the contract's decision on Fabric ADR-0147 (`31a9d6ca`, branch `agent/release-040-wave2`) and the private proposal (by title and commit `9f05a3f` only); Fabric keeps `registry/runners.json`, publishes `registry/models.json` and `registry/model-profiles.json`; `subscription` routes only in the vendor's runner; an empty intersection with L1's classes refuses the launch naming the policy; on key routes the model allow-list is the profile id | same |
