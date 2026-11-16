# Agent health

DEC-0179 · rule code `FAC-SEM-181` · schema [`agent-health.schema.json`](../../schemas/agent-health.schema.json) · code
[`src/agent-health.ts`](../../src/agent-health.ts) · vectors [`agent-health.json`](../../fixtures/vectors/agent-health.json)
(written by [`tools/vectors/agent-health.ts`](../../tools/vectors/agent-health.ts)) · tests
[`test/agent-health.test.ts`](../../test/agent-health.test.ts) · fixtures `fixtures/positive/agent-health*`,
`fixtures/negative/agent-health-*`, `fixtures/semantic/agent-health-*`

`agent-health/1` is one reading of what is wrong with a product or agent now. Every product and agent of the estate
answers it the same way, so one watcher on a machine can read them all and keep episodes over them. It was asked for by
fabric-switchboard (SB-393, the board request `3173118b` of 2026-11-16, proposal
[`docs/research/2026-11-16-agent-health-estate.md` at `c634e9e`](https://github.com/passioncode-ai/fabric-switchboard/blob/c634e9e55b98038c77891bed7b14b4359946af87/docs/research/2026-11-16-agent-health-estate.md),
AH-1); the request says Switchboard 0.7.102 answers its draft (`switchboard health`, `crates/switchboard-runtime/src/health.rs`); no reading of it was validated here.

## The reading

```json
{
  "schema": "agent-health/1",
  "product": "switchboard",
  "version": "0.7.102",
  "at": 1794830000,
  "state": "fail",
  "checks": [
    {"id": "owner", "area": "lifecycle", "state": "ok", "count": 0, "fix": null},
    {"id": "sign_in", "area": "accounts", "state": "warn", "count": 1, "fix": {"tool": "switchboard_login"}},
    {"id": "sessions_stuck", "area": "sessions", "state": "fail", "count": 2, "fix": {"capability": "incident.fix"}},
    {"id": "update_available", "area": "update", "state": "unknown", "count": 0}
  ]
}
```

- **HL-1. Shape.** `schema` is `agent-health/1`; `product` the product id (DEC-0016's slug); `version` the product's
  semantic version; `at` whole Unix seconds; `state` and `checks` as below. Every object is closed: a field the schema
  does not name fails it.
- **HL-2. States.** `ok` (measured and well), `warn` (works, needs attention), `fail` (broken now), `unknown` (not
  measured). The order is `ok < unknown < warn < fail`: the report's `state` is the worst of its checks in that order,
  and `unknown` when it has none. `unknown` never reads as `ok`: nothing measured is not healthy.
- **HL-3. Areas.** A check's `area` is one of `lifecycle`, `sessions`, `accounts`, `crash`, `errors`, `update`,
  `environment`, `security`, `connection`. The list is closed; a new area is a new revision of the schema
  ([versioning](versioning.md)).
- **HL-4. Fix.** A check's `fix` is absent or `null` for none, or exactly one of `tool` (an MCP tool of the product
  that clears it) and `capability` (a board capability of the owning project to ask). A step only a person can take (a
  sign-in, a payment) is named by a tool that answers `human-step-required`, so a watcher shows it as waiting for a
  person and never calls it for them.
- **Privacy.** Counts, kinds and codes only ([usage data](usage-data.md), DEC-0157): no account label, path, session
  id, host name or free text. The closed objects and the name grammars keep text out; `FAC-SEM-181` refuses a name
  shaped like a credential or holding a home folder.

## Where it is answered

A product answers it as the MCP tool `<product>_health` (no arguments) and as the CLI `<product> health --json`, the
same document either way. A `fabric-service/0.1` service may also serve it under its descriptor's `auth.tokenFile`, at
a path it declares in its well-known document as `load` is (DEC-0104); that declaration is CT-337 and not decided here.

It is a surface of its own, not a member of the well-known answer:

- The well-known `status` and `degraded` ([service](service.md#well-known-document)) say whether the service serves and
  which sources do not work. A host reads them every few seconds and derives `down` when nothing answers.
- `agent-health/1` says what is wrong now, check by check, with what clears it. Its checks may be costly (a disk scan, a
  key inventory), so a watcher reads it on its own interval.
- The [operations digests](ops-digest.md) (DEC-0153) say what happened in an hour. A digest's rise may become a check
  (`errors`), but a digest is never read as a health reading.

- **HL-7. One truth for a service that answers both.** When the well-known answer lists a degraded source, or says
  `degraded`, the health report beside it is not `ok` (`FAC-SEM-181` checks this). A `setup: true` entry (a source
  waiting for a person, `FAC-SEM-011`, DEC-0044) is a `warn` check whose `fix` names the tool that answers
  `human-step-required` (DEC-0121), never a `fail`, so a watcher opens no outage episode for it. That is the
  product's duty and is not checked: a reading carries no link from a well-known source to a check, so a `fail`
  beside a setup entry may be another check's. A well-known answer that is `ready` with no degraded source puts
  no bound on the health report: an update or a leaked key is a `warn` while the service serves. `FAC-SEM-181` checks
  the pair as the kind `agent-health-service` (`{wellKnown, health}`).

## Reading it

- **HL-5. What a reader counts.** A reader counts the report's `state` only when it is valid against the schema and
  passes `FAC-SEM-181`. No answer (a timeout, a refused call), another revision, a report that fails the schema, or one
  that fails `FAC-SEM-181` counts as `unknown` for that product, never `ok`. `readHealth` in
  [`src/agent-health.ts`](../../src/agent-health.ts) is the reference; the vectors' `read` cases hold it.
- **HL-6. Episodes are the watcher's.** The contract states what one reading means. Opening an episode after two bad
  readings, closing it after two good ones and sending one message per episode is the watcher's rule (fabric-dashboards
  AH-2, the agents base's `alert-episodes` pattern). A watcher that keys episodes the estate's way uses
  `<product>:<check id>@<YYYY-MM-DD>`, the UTC day of the reading that opened the episode (`episodeKey`), so a check's
  `id` never changes between readings or versions. Which states count as bad (whether `unknown` or `warn` opens an
  episode) is the watcher's rule too; a watcher that also derives `down` from the well-known answer, and gets no
  health answer from a service that is down (`unknown`, HL-5), sends one message for that outage, not one for each.
  `episodeKey` takes `at` from a valid report (at most 9999-12-31T23:59:59Z).

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-181"></a>`FAC-SEM-181` | `agent-health`, `agent-health-service` | a report's `state` is the worst of its checks' states in the order `ok < unknown < warn < fail`, and `unknown` when `checks` is empty (HL-2); each check `id` once; no `product`, check `id`, fix `tool` or fix `capability` shaped like a credential (`secretValue` of [`src/secret-shape.ts`](../../src/secret-shape.ts)) or holding a home folder (`hasHomePath` of [`src/activity-rules.ts`](../../src/activity-rules.ts)), and a finding names such a value only by its place; for `agent-health-service`, the same over `health`, and when `wellKnown` lists a degraded source or says `degraded`, `health.state` is not `ok` (HL-7) (DEC-0179) |
