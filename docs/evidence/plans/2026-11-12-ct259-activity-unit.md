# Design 2026-11-12: the activity event of a unit of work (CT-259)

**Status:** the design CT-259 owes by 2026-11-13, drafted for Project Observatory to confirm the shape against its
OBS-378 (the activity journal's event schema); the decision follows once Observatory confirms. Rules are proposals
numbered `AE-*`.

**Asked by:** fabric-workspace's board request `e9d30889` (thread `8da128cf`, 2026-11-11, line 1.1 of its unified
plan): done when the design is on the contract's main and Observatory has confirmed the event's shape. A consumer
already writes a draft shape (`activity-event/0-draft`) and moves to this one the day after it lands.

**The need** (fabric-workspace `knowledge/system/measure.md` at `73171ed0`, section *The activity event*; North Star
gap G1-a): the North Star metric counts accepted units of work per task class, so one record per unit, written by the
agent that did the work through its kit and read by Observatory, must carry the organization, project and agent, the
task class (`unclassified` until the assessment's map names it), a stable unit id, the evidence, who or what accepted
it and when, and the agent's spend on it, `null` when unknown and never 0. It is never a person's score.

## What the contract has today

| Where | What it has | What is missing |
| --- | --- | --- |
| [activity](../../specification/activity.md) *Envelope*, line 99 (DEC-0030) | `project.id`, `task.ref.system` and `task.ref.key`, `run.root`, `session.id`, `runtime`, `skill`; an unknown cost is `null` | no agent id, no unit, no acceptance |
| [activity](../../specification/activity.md) *Kinds*, `result` (DEC-0052) | a run met or did not meet its declared signal; carries no `user` and no `session`; served only as cells of at least 3 (`FAC-SEM-067`) | it says whether a run met a signal, not which unit was delivered and accepted |
| [activity](../../specification/activity.md) *Kinds*, the closing paragraph | a kind a later revision adds is read as unknown by an older reader, never refused | room for a new core kind without a new protocol |
| [ops digest](../../specification/ops-digest.md) (DEC-0153) | a product's counts reach Observatory through its own capability `ops.digest.record` | the pattern a kit can use when it has no device collector |

## The design

**AE-1, one new core kind, `unit`.** A `telemetry-event` of kind `unit` records one transition of one unit of work.
It requires `run.root` and `project.id`, and like `result` carries **no `user` and no `session`** (schema): a unit is
the agent's, never a person's. `data`:

| Field | Rule |
| --- | --- |
| `agent` | the agent that did the work, as its descriptor names it (`id.instance`), never a person |
| `unit` | `{system, key}`: the tracker or surface that owns the unit (`github`, `jira`, `store`, `mail`, `board`, an open vocabulary) and its stable key there (a PR, an issue, a release, a message id); the same rules as `task.ref` |
| `transition` | `started`, `ended`, `handed-over` or `accepted` |
| `taskClass` | the assessment's class id, or `unclassified` |
| `outcome` | on `ended` only: `completed`, `failed` or `abandoned` |
| `evidence` | 0 to 8 references, each a URI (a receipt, a test run, a review mark) or a `sha256:` digest; never content |
| `acceptedBy` | on `accepted` only: `{kind, ref}`, `kind` being `rule` (an automatic acceptance rule, `ref` its id), `agent` (`ref` an agent's id) or `person` (`ref` the person's pairwise membership subject for this reader, [membership](../../specification/membership.md) OM-1; never a name or an address) |
| `acceptedAt` | on `accepted` only: when it was accepted |
| `cost` | the agent's spend on the unit as the envelope states a cost: `{usd, basis}`, or `null` when unknown, never 0 |

**AE-2, identity and idempotency.** The event id is derived (activity's *Event id*) from `agent`, `unit.system`,
`unit.key`, `transition` and, for `ended` and `handed-over`, the attempt's `run.root`, so a kit that writes the same
transition twice writes one event. One unit has at most one `accepted` event; a unit accepted, reopened and accepted
again writes a second `started`, and the reader counts the last acceptance in a month once.

**AE-3, the person rule.** The receiver never attaches a user to a `unit` event (as `result`, `FAC-SEM-067`), never
puts a unit into a summary cell by person, and serves units only per agent, project or task class. `acceptedBy` of
kind `person` stays in the organization's own journal for the trust guardrail (members see what agents did on their
work) and never reaches a summary, a usage report or another organization.

**AE-4, two ways in.** A device collector sends `unit` events in its activity batches like any kind. A kit that has
no collector records them through Observatory's own capability for the journal, as a product records its operations
digest (`ops.digest.record`, DEC-0153): the capability's name and its binding are Observatory's (OBS-378); the
event's shape is this one either way.

**AE-5, what a reader does with unknowns.** A reader at an older pin reads `unit` as an unknown kind (activity's
*Extension and unknown kinds*), stores it and counts nothing, so emitting it early breaks no receiver.

## What the DEC owes

- **Schemas:** `telemetry-event.schema.json` gains `$defs/unit` and the kind; `activity-common` the `acceptedBy` shape.
- **Rules:** one `FAC-SEM` code (reserved with the DEC): `outcome` only on `ended`, `acceptedBy` and `acceptedAt`
  only on `accepted`, at most one `accepted` per unit and stream.
- **Vectors:** each transition; a `person` acceptance kept out of a summary; a repeated write deduplicated; a
  reopened unit accepted twice; an unknown cost as `null`; a `unit` with a `user` (refused).

## Questions for Project Observatory (to confirm before the DEC)

1. Is `unit` inside `fabric-activity/0.1` right for the journal, or does OBS-378 need a separate document type?
   Proposed: inside, so one transport, one attribution and one person rule.
2. Does the journal need `org` in the event? Proposed: no, the stream's attribution names the organization, as for
   every activity event.
3. The capability a kit calls (AE-4): its name and binding.
4. Is `taskClass` enough, or does the join need the class's map revision too?

## Not decided here

- `verified(c, month)` and the quality reading: the assessment agent's (G1-c).
- The join of events, classes, spend and roster into the metric: Observatory's (G1-d).
- The adapter kit's writer: the adapter's (G1-b).
