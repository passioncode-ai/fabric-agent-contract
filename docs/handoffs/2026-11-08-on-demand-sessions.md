# 2026-11-08: on-demand sessions (CT-215, DEC-0158)

## Objective

Give the contract's part of on-demand sessions: a board request no responder takes is answered by a session the host
starts for it, which takes the request, does it, reports, settles it and ends (the operator's word of 2026-11-04,
relayed by the Fabric project on thread `b2e5df1f`, announcement `42a41db8`). Backlog CT-215 lists what is owed: (a) the
package the run is handed, (b) its lifecycle and a dead run's request, (c) how it fits CT-175 and CT-205.

## Done

- DEC-0158 (Proposed) in `docs/DECISIONS.md`, reserved with `agent_sync.py reserve DEC` (origin counter next 159);
  `Next free ID` set to `DEC-0159`.
- `docs/specification/project-comms.md`: the amendment line and the section *On-demand sessions*, OS-1 to OS-7.
- DEC-0022 annotated: C5 amended for the host alone.
- `docs/specification/conformance.md`: rows for the host that starts runs and for the dispatched run.
- `CONTEXT.md`: *On-demand session*.
- `docs/ux/scenarios.md`: SCN-025's alt paths (a started run that completes, a run that dies, a human step) and its
  Coverage.
- Backlog CT-215 in progress.

## Decisions taken here

- The request's states are not extended: a dead run's request keeps the state the extension gives it, and the next run
  or the owner settles it through existing operations (DEC-0158 Alternatives (a)).
- A run settles `failed_known` at a human step, another job's `input_required`, or a source hand-over without an exact
  decision, rather than waiting: there is no person in the run, and the thread names the step.
- A begun effect's idempotency key is carried in the workflow's checkpoint and reused by the next run, so a relaunch
  never begins the same effect twice (CT-215's open point under (b)).
- How the host decides (grace, caps, time limit, agent and account) stays the host's; the contract binds what the run is
  handed, what done means and what a dead run leaves.

## Open

- The coordinator's blind readings (unit, seam, product) until two consecutive clean rounds.
- Consumer debts, named in DEC-0158's Compatibility: Fabric's CO-409 items; the adapter's FAA-201 on OS-6; Observatory's
  checkpoint carrying a begun effect's key.

## Checks run

- `pnpm run docs:check`, `python3 docs/ux/lint.py`, an em-dash scan of the added lines (results in the commit).

## Next task

Round 1 of the blind readings of branch `agent/ct215-on-demand-20261108` (DEC-0158): verifier-unit, verifier-seam and
verifier-product against `origin/main`; fold every tier's findings at once, then the next round. At landing: DEC-0158
Accepted with its rounds, the amendment line and DEC-0022's annotation without "proposed", CT-215 done, the North Star
plan's wave 0 row, and a board post of the consumer debts to Fabric, Switchboard, the adapter and Observatory.
