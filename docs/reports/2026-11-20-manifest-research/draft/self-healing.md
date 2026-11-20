# Draft: self-healing, `heal-attempt/1`

**Status: a proposal, not a decision.** It would extend [agent health](../../../specification/agent-health.md)
(`agent-health/1`, DEC-0179) as a section "Self-healing (DEC-0191)"; DEC-0191 and `FAC-SEM-188` were reserved for it by
git CAS and are not yet in the registers. Schema draft: [`schemas/heal-attempt.schema.json`](schemas/heal-attempt.schema.json).

The owner's words: 2026-11-20 at 23:40 («также для всех наших агентов и дашбордов тоже в протоколе самолечение нужно
типа прописать») and 2026-11-21 at 00:25 («они это должны замечать и находить новый способ самолечения ... на уровне
любых агентов ... и продуктовых, которых мы строим ... на уровне наших системных агентов»), quoted whole in the
[report](../README.md). It is article M-3 of the [manifest](manifest.md).

## What already exists

`agent-health/1` is detection: one reading of what is wrong now, check by check, each with the `fix` that clears it (an
MCP tool of the product or a board capability of its owner, HL-4), and a watcher's episodes keyed
`<product>:<check id>@<YYYY-MM-DD>` (HL-6). What it does not say is who calls the fix, how often, what may never be
called without a person, and how the outcome is reported. That is the gap this draft closes.

## The loop

The owner's requirement of 2026-11-21 at 00:50 (relayed to this session and to the strategist's session `2d03ce15`):
the agent's self-healing protocol starts by itself when something stops working (Fabric, a dashboard that gets no data
from the agent, an MCP door, a service), and runs detection, diagnosis, repair, a retry or a rollback, and a report; a
person is called only at a human gate. The steps below are that order.

- **HEAL-0. Starts by itself.** No person and no command starts the loop: it runs on the product's own schedule and on
  every failure the product sees from inside (a call to Fabric that fails, a dashboard or watcher that stopped receiving
  its data, its own MCP door that does not answer `search` or `execute`, a service it depends on that is down). A
  watcher that sees the failure from outside (Fabric Dashboards, Observatory) asks the product's `heal.run` operation
  behind `execute`, and the product runs the same loop.
- **HEAL-1. Detect.** Every agent (product and system), dashboard and report answers `agent-health/1`. A report (a
  self-contained HTML page whose data refreshes on a schedule) answers it too, with a check such as `data_refresh`.
- **HEAL-1a. Diagnose.** Before any repair the product narrows the cause: which check failed, since when, what changed
  then (its own version, a key, a dependency's state, the machine), and whether its brain (M-2) or the shared base
  (M-10) holds a known case for that symptom. The diagnosis is recorded with the attempt (as codes, not free text).
- **HEAL-2. Repair what is safe, then retry or roll back.** On a check that reads `warn` or `fail` and names a `fix` tool
  of the product's own, the product calls it itself before any person is told: at most three attempts per episode,
  spaced (for example 1, 5 and 25 minutes), each read again with `agent-health/1` after it. When the failure began with
  a change of its own (a new version, a changed setting), the repair is a rollback to the last version that read `ok`,
  under M-8. A fix that answers `human-step-required` is never called for the person.
- **HEAL-3. Never across a floor.** A fix that would spend money, delete what cannot be recovered, publish outward, or
  act on another product (restart another app: that is the lifecycle broker's) is not called by the loop; the attempt
  is recorded as `skipped-gated` and the episode goes to HEAL-4.
- **HEAL-4. Escalate once; a person only at a human gate.** When three attempts did not clear the check, or the fix is
  gated, the episode goes to the owning project (its board capability, the `fix.capability` of HL-4), once per episode,
  never once per reading. A person (the operator channel) is called only when what remains is a human gate: a sign-in, a
  one-time code, a consent, a payment, a typed secret, spend above a limit.
- **HEAL-5. Find another way, and remember.** A repair that worked is written to the product's brain (M-2) as a case:
  the symptom, the cause with its evidence, the fix. When the known fix stops working (three `not-recovered` in a row
  across episodes), the product looks for another way in its brain and the shared base (M-10) before it escalates, and
  records the one that worked.
- **HEAL-6. A report keeps its last good data.** A report whose refresh fails keeps the last good data and shows its
  date ("data as of"), never an empty or partial page shown as current, and records the attempt.
- **HEAL-7. Report every attempt.** Each attempt is one `heal-attempt/1` record (below), kept and answered by the
  operation `heal.history` behind the product's `execute` door; a watcher (Fabric Dashboards, Observatory) shows an
  episode that healed itself as such, and one that did not as waiting for its owner.

## The record

```json
{
  "schema": "heal-attempt/1",
  "product": "switchboard",
  "check": "sessions_stuck",
  "episode": "switchboard:sessions_stuck@2026-11-20",
  "attempt": 1,
  "at": 1794830000,
  "action": {"tool": "switchboard_incident_fix"},
  "outcome": "recovered",
  "after": "ok"
}
```

Counts, kinds and codes only, as `agent-health/1` (DEC-0157): every object closed, no free text, path, account label or
session id.

## Rule (proposed): `FAC-SEM-188`

On a `heal-attempt/1` record: `episode` begins with `<product>:<check>@` of the same record; `recovered` has `after: ok`
and an `action`; `not-recovered` has an `action` and an `after` other than `ok`; `skipped-human` and `skipped-gated`
have `action: null`; `to` is present exactly when the outcome is `escalated`; no name shaped like a credential or holding
a home folder (as `FAC-SEM-181`).

## Open for the strategic plan

1. Whether the loop's limits (three attempts, the spacing) are the contract's or each product's, with the contract
   fixing only the ceiling.
2. Whether `heal.history` is an operation every product serves, or the watcher keeps the history from the records a
   product emits on its events stream.
3. HEAL-5's "another way": how far an agent may go on its own (a new fix written by a model is a change to its code,
   under M-8 and the pipeline), and where the line to a person is.
