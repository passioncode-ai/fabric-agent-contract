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
- **RT-2, no person and no pace.** A `turn` carries a day and no finer time: `occurred` is that day's midnight UTC and
  `monotonicNs` is `"0"`, as `grant.usage` and `policy.violation` do, so no gap between two turns (a person's time to
  answer) can be read from them; it carries no `user` (schema, as `result` and `unit`), so a summary counts its
  population by `session.id`. It is not personal data on its own; it is joined to nobody.
- **RT-3, who reads it.** A receiver serves turns to another person only as summary cells: per agent (`runtime.name`),
  skill (the workflow, where the runtime reports one, else `run.task`'s host node), project and day, at the summary's
  `minPopulation` (the organization's five or more is its receiver's setting, at least the contract's 3). A cell gains
  `turns` (a count) and `turnBuckets`, the turns' count per fixed bucket of `turnMs` (`<1s`, `<5s`, `<15s`, `<60s`,
  `<300s`, `≥300s`), mergeable across cells and days, so a reader derives a median or a 95th percentile; the outcome key
  of a turn's cell is the turn's own `outcome`; the *other* cell carries `turns` and `turnBuckets` too. This is
  `activity-summary/2`, beside `/1`, which keeps its fields (a reader on `/1` shows no turns). A Fabric service's own
  wait and run time stays `service-load/1`'s (p50 and p95 per service, [service](../../specification/service.md#load));
  `turn` answers for coding-agent runtimes.
- **RT-4, the gate.** A collector holds `turn` events outside its stream until the receiver's latest `protocols` list
  names `activity-turn/1`, as `unit` waits for `activity-unit/1`, and drops what it held past the raw retention.
- **RT-5, the personal context.** A turn of a session on a `personal` account, or of a personal or unattributed
  project, never leaves the machine (the plan's isolation point 1), so a cell's `turns` may count fewer sessions than
  its `usageLines` where personal usage lines are sent today: intended.

### SI, the subscription inventory (CT-319)

- **SI-1, the kind `account.inventory`.** The organization accounts one machine holds with one holder, for one **UTC
  day**. `data`: `day`, `provider` (open vocabulary, as `policy.violation`'s), `tenantRef` (the organization's tenant,
  from the policy's `accounts.tenants`), `billing` (`subscription` or `api`), optional `plan` (the provider's product
  tier from a closed list per provider that the DEC names, never a workspace, seat or account name), `holder` (where the
  accounts are held: `switchboard`, `runtime` for a coding agent's own sign-in, `vault` for an API key held by name) and
  `accounts` (at least 1). It carries a day and no finer time (`occurred` midnight UTC, `monotonicNs` `"0"`) and no
  `session`, `user`, `run`, `task`, `git`, `skill`, `launch` or envelope `account` (schema).
- **SI-2, organization only.** A `tenantRef` is required and only an organization tenant has one, so a personal or
  unknown account produces no `account.inventory`, ever.
- **SI-3, the source and the route.** `source` is `switchboard` for Switchboard's records and `process` for what the
  collector reads by name (`runtime`, `vault`); never a key's value or an account's address. On a device enrolled with
  two organizations, an event goes only to the enrollment whose policy's `accounts.tenants` names its `tenantRef`
  (activity's routing by context), so one organization never learns another's seats.
- **SI-4, idempotence.** At most one event per (stream, `day`, `provider`, `tenantRef`, `billing`, `plan`, `holder`),
  with a derived `eventId` over that key; a receiver keeps the first and refuses a second in one batch, as for
  `grant.usage`.
- **SI-5, who reads it.** A receiver serves no per-machine inventory to another person; it serves sums per provider,
  plan, billing and day at the summary's `minPopulation` of machines, the rest folded into one other row. What the
  organization pays for on the platform stays the platform's licences.
- **SI-6, the gate.** As RT-4, under `activity-inventory/1`.
- **SI-7, not usage data.** Both kinds are activity telemetry under the organization's notice, never a product's
  anonymous usage data (DEC-0157 UD-6, on its branch until it lands): Switchboard's own usage-data switch does not
  govern them, and neither travels in the other's channel.

### Notice purposes

The contract names no purpose ids (they are the organization's notice). Both kinds fit the organization's existing
`usage-and-cost` purpose; neither reaches another person per person or per machine (RT-3, SI-5), which is the upper
limit the contract sets and the requesting server's plan (its C1) asks for.

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
