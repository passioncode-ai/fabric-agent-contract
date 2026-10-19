# Brief: jobs under limits and uncertain effects (CT-55, DEC-0087)

Run `2026-10-19-job-limits`, branch `agent/ct55-job-limits-20261019`, based on `main` `3bbd521`. Ids reserved by git CAS
(`agent_sync.py reserve`): DEC-0087 (key `ct55-job-limits`), `FAC-SEM-119` (`ct55-job-documents`), `FAC-SEM-120`
(`ct55-job-caller`).

## The request

OQ-0012 (ruled in principle on 2026-10-17, board row CT-55) asks for one additive `fabric-interop` revision, a decision
with schema, rule and vectors, for three candidates of an agent retrospective of 18 agents:

- **C1:** a job a provider or subscription limit stopped ended `failed` and callers resubmitted and paid twice: a job
  error code `quota-exhausted` with `retryable` and an optional `resetsAt`, and a `working` status message for a job a
  limit paused (the provider resumes the same job);
- **C2:** `outcome_unknown` exists only for project comms, and agents resent an uncertain write under a new idempotency
  key: a job error code `outcome-unknown`, and the caller rules: no resubmit after either code, a resend reuses the key
  derived from the intent, never a clock or a random value;
- **C3:** unknown as `null` beyond `costUsd`: a job's `usage` totals, counts and coverage.

C4 (a 4xx at submit against a 4xx while polling) stays adapter guidance (fabric-agent-adapter PR #122), not contract text.

## Source ledger

| Source | What it says for this task |
|---|---|
| `docs/OPEN_QUESTIONS.md` OQ-0012 | the ruling in principle: codes lowercase-hyphenated as C3.2 requires; `degraded` stays health, never a job state |
| `docs/specification/interop.md` C3.2, C3.5 | job states are the MCP Task states; `error` is `{code, message, data?}`, `code` an integer or `^[a-z][a-z0-9-]{1,63}$`; `agent.call` carries `idempotencyKey` (1 to 256 characters) |
| `schemas/interop-common.schema.json` `error` | `data: true`: open, so a code's `data` can be constrained without a new member |
| `schemas/interop-job.schema.json` | closed (`additionalProperties: false`): a new member would make every pinned reader refuse the answer; `statusMessage` is a free string of at most 500 |
| `schemas/common.schema.json#/$defs/usage` | closed; `inputTokens`, `outputTokens`, `wallMs` required integers, `costUsd` optional number: no `null` anywhere |
| `schemas/result.schema.json` | `notVerified[]` `{claim, reason}`; `outcome` enum; `FAC-SEM-001` refuses `succeeded` while a claim is in `notVerified` (DEC-0064) |
| DEC-0021, `schemas/service-usage.schema.json` | an unknown cost is `null`, never 0 |
| DEC-0022 and project comms | `outcome_unknown`: the work may have happened; only an observed result settles it |
| DEC-0082, DEC-0086 compatibility sections | a closed schema widened is gated: the writer emits the new form only to readers pinned at or after the decision |
| RFC 9562, retrieved 2026-10-19 from rfc-editor.org | §5.8: version 8 sets `ver` (bits 48 to 51) to `0b1000` and `var` (bits 64, 65) to `0b10` (§4.1), the other 122 bits the implementation's; §5.5: a name-based UUID over SHA-256 MUST NOT be version 5 and MUST be in the version 8 space |
| `src/canonical.ts` `rfc8785` | the canonical form for a digest (DEC-0043) |
| `docs/evidence/retro.md` standing instructions | a reference function that answers for a schema is tested against it on the same inputs; a compatibility check is observed rejecting a planted fixture |
| the code graph | none built in this repository (`graphify-out/` absent) |
| the knowledge wiki | `~/.obsidian-wiki/config` present; nothing on job limits beyond the knowledge base's roadmap row |

## Decisions

*Decisions 2, 4, 5 and 7 and the section "Who adopts what" below are the first cut; the section "After the first
readings" and DEC-0087 supersede them (the gate is the revision a caller names, the interim writes nothing in
`notVerified`, instants carry at most three fraction digits, `limit-reached` is a `person` act and its key runs again
once approved).*

1. **`quota-exhausted`.** A job a provider, subscription or spending limit stopped and that the provider will not resume
   ends `failed` with `error: {code: "quota-exhausted", message, data: {retryable, resetsAt?}}`. `retryable` is
   required: `true` when the same intent may run again once the limit resets, `false` when a person must act (a budget
   raised, a plan changed). `resetsAt` is an RFC 3339 instant in UTC (`Z`), present only with `retryable: true`.
   `data` is closed. The schema constrains `data` only when `code` is `quota-exhausted`.
2. **A paused job.** A provider that resumes the same job after the limit keeps it `working`, its `statusMessage`
   `quota-exhausted` or `quota-exhausted until <UTC instant>`, optionally followed by a colon, a space and text, 500 characters in
   all; `pollIntervalMs` SHOULD reach the reset, within its 3 600 000 cap. `readJobPause(job)` reads it. A
   `statusMessage` that starts `quota-exhausted` and does not follow the grammar is `FAC-SEM-119`'s. No new member: the
   job schema is closed.
3. **`outcome-unknown`.** A job whose effect may have happened and that the provider cannot observe ends `failed` with
   `error: {code: "outcome-unknown", message, data?}`. Only an observed result settles it, as in project comms.
4. **The caller's next act.** `jobCallerAction(job, now)`, total, answers what a caller does with one `fabric.job.get`
   or `fabric.job.cancel` answer: `poll`, `wait` (a pause, `notBefore` its reset), `answer` (`input_required`), `done`,
   `cancelled`, `resend` with the same key (`quota-exhausted` retryable, `notBefore` its `resetsAt` when given),
   `person` (`quota-exhausted` not retryable), `reconcile` (`outcome-unknown`: observe the effect; never a new key),
   `failed` (any other error), or `invalid`. It never answers "submit anew". `FAC-SEM-120` (kind `job-caller`) compares
   an implementation's answer with it.
5. **The intent's key.** `intentIdempotencyKey({agentId, capability, input, request?})` is a UUID of version 8 (RFC
   9562 §5.5, §5.8) from the first 16 bytes of the SHA-256 of the RFC 8785 form of that object, version and variant bits set:
   the same intent gives the same key on every resend, on every machine, after a restart. `request` names the
   principal's request (a task id, a message id) when one principal asks twice for the same input on purpose; it is never
   a clock or a random value. A UUID fits `agent.call`'s `idempotencyKey` and capabilities that require a UUID key.
   Answers `undefined` for an input that has no RFC 8785 form.
6. **Unknown is `null`.** In `common#/$defs/usage`, `inputTokens`, `outputTokens`, `cacheReadTokens`,
   `cacheWriteTokens`, `wallMs` and `costUsd` admit `null` for unknown; 0 is a measured zero. A new optional `partial`:
   `true` when a number is a lower bound or unknown. `FAC-SEM-119` refuses `partial: false` beside a `null`. This is the
   coverage: a number nobody measured is `null`, as a claim nobody verified stays in `notVerified` (DEC-0064).
7. **The gate.** `usage` is closed and its counts were integers, so a reader pinned before DEC-0087 refuses `null` and
   `partial`. Readers (Fabric's host and hub, the adapter's kits) adopt first; a provider writes `null` or `partial` only
   toward readers pinned at or after DEC-0087. Until then a provider that does not know a required count writes the
   lower bound it measured and names the count in `notVerified`; it omits an optional count or cost it does not know.
   The `error.data` constraint binds only the two new codes, which no provider sends yet. No new protocol revision:
   `fabric-interop` has no negotiation, so a revision string nobody negotiates would add nothing; the pin gate does the
   work, as DEC-0082 and DEC-0086 did. `contractVersion` stays `0.1.0`.

## After the first readings

The unit, seam and product readings of `3be94d4` changed decisions 2, 5 and 7 (DEC-0087 records the final text):
instants carry at most three fraction digits and lengths count code points; a provider keeps keys per authenticated
caller and answers a repeated key by the job's code; the gate is the revision `fabric-interop/0.2` a caller names in
`_meta.protocols`, as the ruling asked, not a pin a provider cannot see; the interim writes the measured lower bound
and nothing in `notVerified`; a spend window stays `limit-reached` (DL-19), whose caller act is `person`.

## Alternatives refused

- A new job status `paused`: the states are MCP Task states, and a sixth state breaks every reader.
- A new member on the job (`pause`, `resetsAt`): the job schema is closed; the `statusMessage` grammar carries the same.
- `degraded` as a job state: health, never a state (OQ-0012).
- A random or clock-derived idempotency key: a resend after a restart would mint a new one and pay twice.
- 0 for unknown: indistinguishable from a measured zero (DEC-0021).

## Who adopts what

- **Providers** (every job-capable agent; the adapter's kits for theirs): `quota-exhausted` and `outcome-unknown` as
  above; the pause grammar; `null` and `partial` only toward readers at DEC-0087.
- **Callers** (Fabric's hub on `agent.call`, the kits, agents that call jobs): `jobCallerAction`'s answers; the intent's
  key on every resend.
- **Readers of a job's `usage`** (Fabric's host, Fabric Dashboards, the kits): accept `null` and `partial`; show unknown
  as unknown, never as 0.

## Vectors and fixtures

`fixtures/vectors/job-limits.json`, written by `tools/vectors/job-limits.ts --write`, expected values by hand: pause
messages, caller actions, intent keys (with the RFC 9562 version and variant), usage cases. Positive and negative
schema fixtures for both codes, the pause message and `usage` with `null`; semantic fixtures for `FAC-SEM-119` and
`FAC-SEM-120`.

## REQ table

| REQ | What | Verified by |
|---|---|---|
| REQ-01 | `interop-common#/$defs/error`: `data` constrained for `quota-exhausted` (closed, `retryable` required, `resetsAt` UTC and only with `retryable: true`) | positive and negative fixtures; schema compilation and closure tests |
| REQ-02 | `common#/$defs/usage`: `null` for every count and `costUsd`, optional `partial` | fixtures; positive sweep |
| REQ-03 | `src/job-limits.ts`: `readJobPause`, `jobCallerAction`, `intentIdempotencyKey`, `usageFindings`; total, never throws | `test/job-limits.test.ts`, rule tolerance |
| REQ-04 | `FAC-SEM-119` (kinds `interop-job`, `usage`): the pause grammar, `quota-exhausted` data, `partial: false` beside `null` | semantic fixtures, each clause ok and violating |
| REQ-05 | `FAC-SEM-120` (kind `job-caller`): an implementation's answer equals `jobCallerAction`'s | semantic fixtures, vectors |
| REQ-06 | vectors written by the generator, compared by the test, run in three time zones | `test/job-limits.test.ts` |
| REQ-07 | every output validates and every input the schema refuses the reference refuses (the retro's standing instruction) | `test/job-limits.test.ts` |
| REQ-08 | spec: interop.md C3.2 *Limits and uncertain effects*, results-and-evidence.md on `usage`, conformance rows (provider, caller, usage reader) and the rule table, CONTEXT glossary, DOCMAP, README | `pnpm docs:check` |
| REQ-09 | registers: DEC-0087, OQ-0012 resolved, CT-55 with each consumer's duty, the handoff and its index row | `pnpm docs:check` (decision paths) |
| REQ-10 | plants: each refusal clause and each caller branch removed once, each killed | `plants.md` |
| REQ-11 | the gate: `pnpm run check` exits 0, a 100 % branch floor for `src/job-limits.ts` | the gate's output in the handoff |

## Not decided here

- Whether `cancelled` asserts that no effect happened (a cancelled job whose effect began).
- A machine-readable limit scope (which limit: model, subscription, budget).
- C4, adapter guidance.
