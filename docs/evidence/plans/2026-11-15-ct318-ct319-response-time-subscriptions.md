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
  ([activity](../../specification/activity.md#kinds), *Extension and unknown kinds*); `unit` (DEC-0164) is held by the
  collector until the receiver's `protocols` list names `activity-unit/1`, and `grant.usage` (DEC-0082) behind the
  share registration's answer, so a receiver pinned before them never meets them.
- `account.class` (DEC-0052) labels the account a session ran on (`organization`, `personal`, `unknown`) with an
  organization's `tenantRef` from the policy's `accounts.tenants` ([devices](../../specification/devices.md#policy));
  `grant.usage` is a day-grained kind with no session, user, run or task (schema).
- A summary has no person dimension and publishes a cell only at `minPopulation` of at least 3
  ([activity](../../specification/activity.md#minimum-cell), the operator's decision of 2026-10-08); a receiver may raise
  it. The organization's decision of five or more is that receiver's `minPopulation`, not a contract change.
- Another person reads a person's time only under a purpose that person confirmed, and usage and cost only as sums per
  UTC day or period ([activity](../../specification/activity.md#notice), DEC-0052).

## The design

Every key below was run through the contract's own filters (`forbiddenKeys` in `src/activity-rules.ts`, FAC-SEM-037 and
FAC-SEM-040): none is a content or person word. `response` is a content word there, so the fields say `turn`.

### RT, response time (CT-318)

- **RT-1, the kind `turn`.** One agent turn of one session: from the input that started the agent's work (a message, a
  tool result handed back, a launched agent's task) to the point the session awaited input again or ended. It requires
  `session`, `project` and `runtime`. `data`:
  - `day` (the UTC day the turn ended) and `turnMs`: the turn's duration from monotonic readings of one boot, never a
    wall-clock difference; a turn whose span held a sleep the collector saw is not sent (the monotonic clock counts
    sleep, activity's *Clocks*);
  - `modelCalls` and `modelMs`, `toolCalls` and `toolMs`: the calls the turn made and the time spent waiting on them,
    summed (parallel calls overlap, so they are not parts of `turnMs`; `modelCalls` is the runtime's count, not
    `usage.line`'s deduplicated one);
  - optional `toolKinds`, a list of `{kind, calls, ms}` with `kind` from a closed list (`shell`, `file`, `mcp`, `web`,
    `agent`, `other`): never a tool's name, input or output;
  - `method` (closed: `otel`, `hook`, `transcript`, `rollout`) and optional `outcome` (`answered`, `failed`, `unknown`).
  One writer per session: a collector that reads a session from two methods sends its turns from one (as FAC-SEM-100
  keeps one writer for intervals and usage lines).
- **RT-2, a day and no finer time.** A `turn` carries a day and no finer time: `occurred` is that day's midnight UTC,
  `monotonicNs` is `"0"`, its `eventId` is derived (`sourceKey` `sha256:` over the stream, the session and the turn's
  ordinal in it, as `unit`'s form, never a time), and the collector emits a day's turns after the day ends, as
  `policy.violation` does, so neither its fields nor its place in the stream show when a turn ran or the gap between two
  turns, within the turn event itself (a receiver that joins a turn to its session's intervals by `session.id` can place
  it roughly; RT-3's restraint covers that). It carries no `user` (schema, as `result` and `unit`).
- **RT-3, personal data all the same.** A turn from a device bound to a person is personal data, as
  [activity](../../specification/activity.md#personal-data-and-purpose) says of every event from such a device: kept for
  the notice's purposes, deleted at `retention.raw_days`, every raw read in that person's access log (under
  `activity.raw`). Its `session.id` joins it to the session's other events, which carry `user.id`, so keeping it from
  being read per person is the receiver's restraint, as for `result`. `activity.raw` read by another person never
  includes a `turn` or an `account.inventory` event, under any purpose, as it already never includes `usage.line` and
  cost (activity's *Access log*, FAC-SEM-067): the operator ruled out timing a person, so no consent opens it.
- **RT-4, who reads it, and how a cell counts people.** A receiver serves turns to another person only as cells of
  `activity-summary/2`, which adds `turnCells` beside `/1`'s cells (which keep their fields): one cell per agent
  (`runtime.name`), skill (the workflow, where the runtime reports one; no other fallback), project and day, with no
  outcome dimension, carrying `turns`, `turnBuckets` (the turns' count per fixed bucket of `turnMs`: `<1s`, `<5s`,
  `<15s`, `<60s`, `<300s`, `≥300s`, mergeable across cells and days, so a reader derives a median or a 95th percentile)
  and the sums of `modelMs` and `toolMs`. A turn cell's population counts people: a turn's subject is the person the
  receiver binds to its stream's epoch ([devices](../../specification/devices.md#attribution), FAC-SEM-045), else its
  session's `user.id`, and only on a device bound to no person its `session.id`; one person's sessions are one subject.
  A turn cell is published at the summary's `minPopulation` (the organization's five or more is its receiver's setting,
  at least the contract's 3), the rest folded into one other turn cell. A Fabric service's own wait and run time stays
  `service-load/1`'s (p50 and p95 per service, [service](../../specification/service.md#load)); `turn` answers for
  coding-agent runtimes.
- **RT-5, the gate.** A collector holds `turn` events outside its stream until the receiver's latest `protocols` list
  names `activity-turn/1`, and drops what it holds as `unit`'s held transitions are dropped: past the shorter of the
  server layer's and the device's `retention.raw_days` (30 days where the server layer sets none), on 410
  `organization-closed`, and on a binding to a different person or from a person to none.
- **RT-6, the personal context.** A turn of a session on a `personal` account, or of a personal or unattributed
  project, never leaves the machine (the plan's isolation point 1), even inside an organization's folder where that
  session's usage lines and its `policy.violation` are sent; the receiver's response-time report names that gap.

### SI, the subscription inventory (CT-319)

- **SI-0.** `account.inventory` carries no `project` or `runtime` (schema): it is a machine's holdings, not a session's.
- **SI-1, the kind `account.inventory`.** The organization accounts one machine holds with one holder, for one **UTC
  day**. `data`: `day`, `provider` (open vocabulary, as `policy.violation`'s), `tenantRef` (the organization's tenant,
  from the policy's `accounts.tenants`), `billing` (`subscription` or `api`), optional `plan` (the provider's product
  tier from a closed list per provider that the DEC names, never a workspace, seat or account name), `holder` (where the
  accounts are held: `switchboard`, `runtime` for a coding agent's own sign-in, `vault` for an API key held by name) and
  `accounts` (at least 1). It carries a day and no finer time (`occurred` midnight UTC, `monotonicNs` `"0"`, emitted
  after the day ends) and no `session`, `user`, `run`, `task`, `git`, `skill`, `launch` or envelope `account` (schema).
- **SI-2, organization only.** A `tenantRef` is required and only an organization tenant has one, so a personal or
  unknown account produces no `account.inventory`, ever.
- **SI-3, the source and the route.** `source` is `switchboard` for Switchboard's records and `process` for what the
  collector reads by name (`runtime`, `vault`); never a key's value or an account's address. On a device enrolled with
  two organizations, an event goes only to the enrollment whose policy's `accounts.tenants` names its `tenantRef`; where
  two enrollments name it, it goes to neither (a route function of its own with vectors, by analogy with `routeTarget`'s
  `ambiguous`), so one organization never learns another's seats.
- **SI-4, idempotence.** At most one event per (stream, `day`, `provider`, `tenantRef`, `billing`, `plan`, `holder`),
  its `eventId` derived (`sourceKey` `sha256:` over that key, as `unit`'s form); a receiver keeps the first and refuses
  a second in one batch, as for `grant.usage`.
- **SI-5, who reads it.** An inventory event from a device bound to a person is personal data (RT-3's terms). A
  receiver serves no per-machine inventory to another person; `activity-summary/2` adds `inventoryCells` per provider,
  plan, billing and day, carrying `accounts` and `machines`, published at `minPopulation` counted in people (each
  machine's bound person, a machine bound to no person counting as one), the rest folded into one other row. What the
  organization pays for on the platform stays the platform's licences.
- **SI-6, the gate.** As RT-5, under `activity-inventory/1`.
- **SI-7, not usage data.** Both kinds are activity telemetry under the organization's notice, never a product's
  anonymous usage data (DEC-0157 UD-6, on its branch until it lands; whichever lands second restates UD-6's description
  of activity telemetry to name both kinds): Switchboard's own usage-data switch does not govern them, and neither
  travels in the other's channel.

### Notice purposes

The contract names no purpose ids (they are the organization's notice). A turn's duration is a time measure, so a
receiver serves it to another person only as RT-4's cells, never per person, and the inventory only as SI-5's cells: for
these two kinds that is narrower than the per-person daily usage sums activity allows for usage and cost. Whether the
requesting organization's published notice covers them without a new `noticeVersion` is that organization's and its
counsel's question (asked in the board reply).

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

1. The bucket boundaries (RT-4): chosen for interactive work; a later revision can add buckets as `/3`.
2. Whether `turn` should also carry a turn's `cost` (it would sum the session's `usage.line`s, joined by `session.id`): left out, so a
   cost is never counted twice.
3. Seats an organization pays for that no machine holds: the platform's licences, not telemetry.

## Next

The DEC with `schemas/telemetry-event.schema.json` (`$defs.turn`, `$defs.accountInventory`), `activity-summary/2`, the
protocols `activity-turn/1` and `activity-inventory/1`, a rule code for the turn's monotonic duration and the
inventory's day-only envelope, vectors, and the restatements (activity *Kinds*, *Summary*, conformance's collector and
receiver rows, CONTEXT, versioning's register with `activity-summary` `/1` and `/2`, the OpenTelemetry mapping of
`toolKinds`), activity's *Notice* and *Access log* with the FAC-SEM-067 row and SCN-010's expected result (no `turn` or
`account.inventory` in another person's `activity.raw`), the population code for turn and inventory cells (by the
stream's bound person, not `population()`'s `session.id` fallback) with FAC-SEM-040's cell checks for their shapes, a
day-only rule code covering `turn` beside FAC-SEM-039's, the closed turn `method` (a collector reading only by process
sampling sends no turns), the source of RT-6's routing of personal-account sessions in an organization's folder
(`contexts.md`), scenarios for an administrator's response-time and inventory reports, and a vector of one person
across five sessions; read under the finish-line rule; then the board reply on thread `1efdc2e1` and tells to
Observatory (collector) and Switchboard (inventory record).
