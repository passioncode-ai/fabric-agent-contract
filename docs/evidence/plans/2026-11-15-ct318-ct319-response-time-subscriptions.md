# Design: agent response time and an organization's subscription inventory (CT-318, CT-319)

**Status:** design, 2026-11-15. Not normative until its DEC lands. Rows
[CT-318 and CT-319](../../backlog.md); the request: the first organization server's board message `356b6aae` (thread
`1efdc2e1`), answer due 2026-11-22, its plan G1 and G2 (fabric-workspace `docs/plans/2026-11-15-work-machines/README.md`
at `8144e7ec`).

## What is asked

The operator's words (2026-11-15, relayed in the plan): connect every work computer to the organization's server «для
того, чтобы отслеживание типа подписок, ... логирование, ... активности, времени ответа, оптимизации процессов», with
personal and organization contexts isolated in every product. The operator's decisions the same day, quoted there:
activity, response time and process optimization are measured **per agent, workflow and project**, people appear only
in groups of five or more under the organization's employee notice, no ranking or timing of a person; the scope is
**the agent stack only**.

- **G1, response time.** The time from a request to its answer per agent and workflow (a model call, a tool's turn),
  measured on the machine, collected by Project Observatory, with no person's identifier beyond what `usage.line`
  carries.
- **G2, the subscription inventory.** Provider, plan, class (subscription or API) and where on the machine, only in an
  organization's context, recorded by Switchboard and sent by Observatory.

## What the contract says today

- Activity telemetry (`fabric-activity/0.1`, [activity](../../specification/activity.md)) carries `session.interval`
  (working, awaiting input, idle stretches, estimates by `method`) and `usage.line` (one model call: model, tokens,
  cost). Neither carries a duration of a request: an interval measures a session's state, and `usage.line`'s `data` is
  closed (`schemas/telemetry-event.schema.json`, `$defs.usageLine`, `additionalProperties: false`), so a new field on it
  is refused by every receiver pinned today.
- A new kind is the additive route: a receiver reads an unknown kind as extension data and never rejects a batch for it
  ([activity](../../specification/activity.md#kinds), *Extension and unknown kinds*); `grant.usage` (DEC-0082) and
  `unit` (DEC-0164) are each held by the collector until the receiver's `protocols` list names their protocol, so a
  receiver pinned before them never meets them.
- `account.class` (DEC-0052) labels the account a session ran on (`organization`, `personal`, `unknown`) with an
  organization's `tenantRef` from the policy's `accounts.tenants` ([devices](../../specification/devices.md#policy));
  `policy.violation` and `grant.usage` are day-grained kinds with no session, user, run or task (schema).
- A summary has no person dimension and publishes a cell only at `minPopulation` of at least 3
  ([activity](../../specification/activity.md#minimum-cell), the operator's decision of 2026-10-08); a receiver may raise
  it. The organization's decision of five or more is that receiver's `minPopulation`, not a contract change.
- Another person reads a person's time only under a purpose that person confirmed, and usage and cost only as sums per
  UTC day or period ([activity](../../specification/activity.md#notice), DEC-0052).

## The design

### RT, response time (CT-318)

- **RT-1, the kind `turn`.** One agent turn of one session: from the input that started the agent's work (a person's
  message, a tool result handed back, a launched agent's task) to the point the session awaited input again or ended.
  It requires `session`, `project` and `runtime` (as `session.interval`). `data`:
  - `start`, `end` (`end` ≥ `start`), and `responseMs`: the turn's duration from monotonic readings of one boot, never a
    wall-clock difference (activity's clocks);
  - `modelCalls` and `modelMs`: the model calls the turn made and the time spent waiting on them, summed;
  - `toolCalls` and `toolMs`: the tool calls and the time spent in them, summed, with an optional `toolKinds` list of
    `{kind, calls, ms}`, `kind` from a closed list (`shell`, `file`, `mcp`, `web`, `agent`, `other`): never a tool's
    name, its input or its output (FAC-SEM-037 still applies);
  - `method`: what produced the estimate (`otel`, `hook`, `transcript`, `rollout`), as for an interval;
  - optional `outcome`: `answered`, `interrupted`, `failed` or `unknown`.
  A turn's `responseMs` is an estimate under its `method`, as an interval's state is, and is labelled so wherever it is
  shown. Model time and tool time may overlap (parallel calls), so they are not parts of `responseMs`.
- **RT-2, no new identifier.** A `turn` carries the envelope `usage.line` carries (session, project, runtime, run, and
  `user.id` only as the receiver sets it from the epoch's binding); it carries no person key, no content and no prompt
  timing that would show a person's own pace (the time a session awaited input is `session.interval`'s, never a
  turn's).
- **RT-3, who reads it.** A `turn` from a device bound to a person is personal data, as an interval is: another person
  reads raw turns only under a purpose that person confirmed, each read in the person's access log. A summary carries
  turns only per agent, skill, project and day: a cell gains `turns` (a count) and `responseBuckets`, the turns' count
  per fixed bucket of `responseMs` (`<1s`, `<5s`, `<15s`, `<60s`, `<300s`, `≥300s`), mergeable across cells and days, so
  a reader derives a median or a 95th percentile without the summary carrying a person or a raw duration. This is
  `activity-summary/2`, beside `/1`, which keeps its fields.
- **RT-4, the gate.** A collector holds `turn` events outside its stream until the receiver's latest `protocols` list
  names `activity-turn/1`, as it holds `grant.usage` and `unit`, and drops what it held past the raw retention.
- **RT-5, the personal context.** A turn of a session whose `account.class` is `personal`, or of a personal or
  unattributed project, never leaves the machine (the plan's isolation model, point 1; activity's attribution).

### SI, the subscription inventory (CT-319)

- **SI-1, the kind `account.inventory`.** One organization account held on one machine, for one **UTC day**. `data`:
  `day`, `provider` (open vocabulary, as `policy.violation`'s), `tenantRef` (the organization's tenant, from the policy's
  `accounts.tenants`), `billing` (`subscription` or `api`), optional `plan` (the provider's plan name as the provider
  states it, open vocabulary, at most 64 characters, never a price), `holder` (where on the machine the account is held:
  `switchboard`, `runtime` for a coding agent's own sign-in, `vault` for an API key held by name) and `accounts` (at
  least 1, the number of such accounts with that holder). Like `grant.usage` it carries a day and no finer time
  (`occurred` that day's midnight UTC, `monotonicNs` `"0"`) and no `session`, `user`, `run`, `task`, `git`, `skill` or
  `launch` (schema).
- **SI-2, organization only.** The schema admits only an organization account: no `accountClass` field, because a
  `tenantRef` is required and only an organization tenant has one. A personal or unknown account produces no
  `account.inventory`, ever.
- **SI-3, the source.** `source` `switchboard` for what Switchboard records; `vault` and `runtime` holders are what the
  collector reads by name (never a key's value or an account's address: an account is named by provider, tenant and
  plan only).
- **SI-4, who reads it.** An inventory event from a device bound to a person is personal data (it says that person's
  machine holds an organization seat); another person reads it per machine only under a purpose the person confirmed,
  and otherwise only as an organization's sums per provider, plan, billing and day. The organization's own billing
  record beside it (the platform's licences) stays the platform's.
- **SI-5, the gate.** As RT-4, under `activity-inventory/1`.

### Notice purposes

The contract names no purpose ids (they are the organization's notice). Both kinds fit the organization's existing
`usage-and-cost` purpose for sums; a receiver that serves raw turns or per-machine inventory to another person needs the
person's confirmed purpose for it, as for time today. Nothing in this design widens what reaches another person.

## Alternatives refused

- New fields on `usage.line` (`durationMs`, `firstTokenMs`): its `data` is closed, so every receiver pinned today would
  refuse the batch's event; a new kind is additive.
- Response time per person, or a person's own pace: the operator's decision rules out timing a person.
- Percentiles in the summary: they do not merge across cells or days; fixed buckets do.
- The inventory as a device-policy or check-in field: the check-in is not a reporting channel, and a daily kind keeps
  the stream's retention and access-log rules.
- A tool's name in a turn: a tool name can name a person's project or content (an MCP server's name, a script); the
  closed `kind` list carries what optimization needs.

## Open points for the decision

1. The bucket boundaries (RT-3): chosen for interactive work; a later revision can add buckets as `/3`.
2. Whether `turn` should also carry a turn's `cost` (it sums `usage.line`s already joined by `run.root`): left out, so a
   cost is never counted twice.
3. Seats an organization pays for that no machine holds: the platform's licences, not telemetry.

## Next

The DEC with `schemas/telemetry-event.schema.json` (`$defs.turn`, `$defs.accountInventory`), `activity-summary/2`, the
protocols `activity-turn/1` and `activity-inventory/1`, a rule code for the turn's monotonic duration and the
inventory's day-only envelope, vectors, and the restatements (activity *Kinds*, *Summary*, conformance's collector and
receiver rows, CONTEXT); read under the finish-line rule; then the board reply on thread `1efdc2e1` and tells to
Observatory (collector) and Switchboard (inventory record).
