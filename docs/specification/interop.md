# Interop extension `fabric-interop/0.1` and `/0.2`

`covers:` Fabric agent-registry REQ-04, REQ-05, REQ-11 — DEC-0016, rulings DEC-0017, DEC-0018 · locked in Fabric's
[agent-registry contracts](https://github.com/passioncode-ai/fabric/blob/03311c856b7771e5e4cfff967b138e89e292c67f/docs/evidence/specs/2026-09-29-agent-registry-contracts.md)
§C3 (2026-09-29)

How agents are called: every capability is an MCP tool, long work is a job, a question
for a person is an elicitation, every call carries one trace, and one agent reaches
another under a delegation token only the host's hub issues (C3.5, amended by DEC-0039).
There is no new wire (DEC-0002): this extension profiles MCP `2026-07-28` and its official Tasks extension ([sources](../evidence/sources.md)).

The key words MUST, MUST NOT, SHOULD and MAY are used as in RFC 2119. The text of each
numbered section below is the locked contract, moved here verbatim; what this document
adds is the schema map, the rule table, the constraints it derives (each marked as
derived) and the operator's rulings of DEC-0017 (each marked as ruled).

## Extension key

`https://fabric.passioncode.ai/agent-contract/extensions/interop/0.1` (the same host and
path shape as the contract's `service/0.1` key; the Dashboards docs' other spelling is
fixed in AR-1).

The contract defines seven extension keys, the constants in [`src/extensions.ts`](../../src/extensions.ts):

| Key | Page |
|---|---|
| `https://fabric.passioncode.ai/agent-contract/extensions/service/0.1` | [service](service.md) |
| `https://fabric.passioncode.ai/agent-contract/extensions/interop/0.1` | this page |
| `https://fabric.passioncode.ai/agent-contract/extensions/memory/0.1` | [memory and learning](memory-and-learning.md#wire-memory01) (DEC-0023) |
| `https://fabric.passioncode.ai/agent-contract/extensions/dashboard/0.1` | [embedded dashboard](embedded-dashboard.md) |
| `https://fabric.passioncode.ai/agent-contract/extensions/connections/0.1` | [connections](connections.md) |
| `https://fabric.passioncode.ai/agent-contract/extensions/load/0.1` | [agent network](agent-network.md#load) (DEC-0104) |
| `https://fabric.passioncode.ai/agent-contract/extensions/actions/0.1` | [service](service.md#actions) (DEC-0121) |

The documentation gate (`pnpm docs:check`) refuses any other spelling of an extension key in
this repository's documents, schemas and fixtures (G-08). The spelling Fabric Dashboards'
ADR-0003 and design used — host `passioncode.ai`, path `/fabric/extensions/…` — is not a
key of this contract; consumers use the constants above.

In a manifest, the interop block sits under a capability's `extensions`, keyed by the
interop key, and is validated by
[`interop-capability.schema.json`](../../schemas/interop-capability.schema.json):

```json
{ "https://fabric.passioncode.ai/agent-contract/extensions/interop/0.1": { "job": true } }
```

## C3.1 Capabilities

Each `capabilities[]` entry of the manifest whose profile is `mcp` is
served as an MCP tool whose `name` equals the capability `name`, whose `inputSchema` and
`outputSchema` are the capability's schemas (JSON Schema 2020-12). Annotations derive from the
declared effect: `effect: none` → `readOnlyHint: true`; `effect` ∈ `delete | merge | deploy |
change-policy` → `destructiveHint: true`; `idempotency: required` → `idempotentHint: true`.
**FAC-SEM-017** a served tool's schemas equal the manifest's (a probe compares them).

The reference rule compares the served tool with the manifest capability after the
manifest's schema URIs are resolved: same name, structurally equal schemas (key order
does not matter), and the derived annotations present.

**Ruled (DEC-0017, OQ-0006; amended by DEC-0018).** A job-backed tool declares its
`outputSchema` as `{"type": "object", "oneOf": [result envelope, job handle]}`, so its
`structuredContent` always conforms, as MCP requires; the capability in the manifest keeps
the pure output schema. The union is self-contained — no `$ref`, because an MCP client does
not fetch one — and has exactly the shape `jobToolOutputSchema(output)` in
[`src/interop-rules.ts`](../../src/interop-rules.ts) builds:

```json
{ "type": "object", "oneOf": [
  { "type": "object",
    "required": ["id", "contractVersion", "outcome", "done", "proof", "scope", "notVerified",
                 "artifacts", "createdAt", "producer", "output", "usage"],
    "properties": { "output": "<the capability's outputSchema>" } },
  { "type": "object", "required": ["job"], "additionalProperties": false,
    "properties": { "job": { "type": "object", "required": ["id", "status"], "additionalProperties": false,
      "properties": { "id": { "type": "string", "minLength": 1, "maxLength": 128, "pattern": "^[A-Za-z0-9._:-]+$" },
                      "status": { "const": "working" } } } } }
] }
```

**Every tool's `outputSchema` has root `"type": "object"` (DEC-0018, FAC-SEM-023).** MCP
requires an object root, and a real client enforces it for the whole list: Claude Code
2.1.285 refuses an entire `tools/list` ("tools fetch failed — Handler returned an invalid
result") when any tool's `outputSchema` is a bare `oneOf` root, while the Python MCP SDK
accepts it — so SDK-only tests cannot catch it. A capability whose output is not an object
cannot be served with an `outputSchema`.

The contract's own form of the union, by reference, is
[`interop-job-tool-output.schema.json`](../../schemas/interop-job-tool-output.schema.json);
its fixtures show a handle conforming and a malformed handle not. An annotation mismatch is
reported under FAC-SEM-017 as well, because it is part of serving the capability as
declared. `expectedAnnotations` in [`src/interop-rules.ts`](../../src/interop-rules.ts)
is the derivation.

## Capability names

**Amendment (DEC-0020).** A capability name MUST conform to
[`common.schema.json#/$defs/capabilityName`](../../schemas/common.schema.json):
`^[a-z][a-z0-9._-]{1,127}$`. It starts with a lowercase ASCII letter, contains
2–128 characters, and permits lowercase letters, digits, dot, underscore and
hyphen after that first letter. `read_message` and `list_messages` are valid
product tool names; `_read_message`, `Read_message`, `read/message` and a
129-character name are not.

The manifest capability `name`, hub `agent.call.capability`, service
`surfaces.mcp.capabilities[]` and pipeline stage `capability` use that one shared
definition. C3.1's equality between the manifest capability name and served MCP
tool name still applies; this amendment does not rename a product's tool or add
an alternative `toolName` field. Binding capability identity remains a URI, and
an allowed name still grants no admission, binding or access authority.

This is an additive acceptance change under DEC-0016: `contractVersion` remains
`0.1.0`, with the source revision selected by the consumer's
[contract pin](versioning.md#one-contract-pin). All formerly valid names remain
valid. A consumer pinned before DEC-0020 still rejects underscore names and MUST
review and repin before relying on them; an unmerged source branch is not a
published or adopted revision. The shared-ref and compiled-document regressions
are [`capability-names.test.ts`](../../test/capability-names.test.ts); positive
and negative conformance fixtures are in the [catalogue](../../fixtures/catalogue.json).

## C3.2 Jobs

A capability whose work may outlive one request declares `"job": true` in its
interop extension block. Then:

- if the request negotiated `io.modelcontextprotocol/tasks`, the server MAY return an MCP Task;
- otherwise the tool returns, in `structuredContent`,
  `{"job": {"id": "<opaque>", "status": "working"}}`, and the agent serves two tools (a node that queues, a third,
  `fabric.job.list`, DEC-0104):
  `fabric.job.get {id}` → `{"job": {id, status, statusMessage?, updatedAt, pollIntervalMs?,
  inputRequests?, result?, error?}}` and `fabric.job.cancel {id}` → the same shape.
- `status` ∈ `working | input_required | completed | failed | cancelled` (the MCP Task states);
  terminal: `completed | failed | cancelled`.
- `result` is the **full result envelope** ([results and evidence](results-and-evidence.md)) with `output` (the
  `outputSchema` value) and `usage` (`{inputTokens, outputTokens, cacheReadTokens?, cacheWriteTokens?, costUsd?,
  wallMs}`) required: one shape, no subset (DEC-0017, OQ-0002; `interop-result.schema.json`).
- A job id is stable across restarts of the agent; `fabric.job.get` for an unknown id answers
  `isError: true` with `unknown-job`, never a fresh job.
- A node that queues calls (DEC-0104) writes a waiting job's `statusMessage` as `queued <position> of <length>`,
  refuses a start that would wait past its queue (`admitJob`) with `queue-full` and `retryAfterSeconds` (an `isError` result with no
  `structuredContent`, whose text content is JSON of [`interop-tool-error.schema.json`](../../schemas/interop-tool-error.schema.json), as is its
  `unknown-job`), and serves
  `fabric.job.list` with the caller's own jobs; another caller's job id answers `unknown-job` ([agent network](agent-network.md#call-queue)).

| Shape | Schema |
|---|---|
| The handle a job-capable tool returns | [`interop-job-handle.schema.json`](../../schemas/interop-job-handle.schema.json) |
| `fabric.job.get` / `fabric.job.cancel` arguments | [`interop-job-request.schema.json`](../../schemas/interop-job-request.schema.json) |
| Their answer | [`interop-job.schema.json`](../../schemas/interop-job.schema.json) |
| The result envelope | [`interop-result.schema.json`](../../schemas/interop-result.schema.json) |
| A job-backed tool's `structuredContent` | [`interop-job-tool-output.schema.json`](../../schemas/interop-job-tool-output.schema.json) |
| `usage` | `common.schema.json#/$defs/usage` (also optional on the full [result](results-and-evidence.md)) |
| `fabric.job.list` arguments and answer (DEC-0104) | [`interop-job-list-request.schema.json`](../../schemas/interop-job-list-request.schema.json), [`interop-job-list.schema.json`](../../schemas/interop-job-list.schema.json) |
| At a node that queues, the text content's JSON of a `queue-full` refusal at start and of `unknown-job` (DEC-0104) | [`interop-tool-error.schema.json`](../../schemas/interop-tool-error.schema.json) |

Derived constraints, from the MCP Tasks lifecycle rather than from new policy:

- `result` is present exactly when `status` is `completed`, `error` exactly when it is
  `failed`, and `inputRequests` exactly when it is `input_required`.
- `error` mirrors a JSON-RPC error: `{code, message, data?}`; `code` is an integer or a
  lowercase-hyphenated name.
- The unknown-id answer is a tool result with `isError: true` whose text or
  `structuredContent.error.code` carries `unknown-job`.
- **Ruled (DEC-0017, OQ-0002).** A job's `result` is the full result envelope — exactly
  what a synchronous call of the same capability returns: the
  [result](results-and-evidence.md) with `output` and `usage` required. One shape, no
  subset.

## Limits and uncertain effects

DEC-0087 (OQ-0012, board row CT-55) · rule codes `FAC-SEM-119`, `FAC-SEM-120` · revision `fabric-interop/0.2` · code
[`src/job-limits.ts`](../../src/job-limits.ts) · vectors
[`fixtures/vectors/job-limits.json`](../../fixtures/vectors/job-limits.json), written by
[`tools/vectors/job-limits.ts`](../../tools/vectors/job-limits.ts) · tests
[`test/job-limits.test.ts`](../../test/job-limits.test.ts)

A limit (a provider's quota, a subscription's window) stops or pauses a job, and an effect (a payment, a message, an
order) may happen without its provider seeing the answer. A caller that reads either as an ordinary failure submits
again and pays twice: an agent retrospective of 2026-10-17 counted it in about ten agents. Two error codes, a pause
grammar, one act per answer, a key per intent and the provider's answer to a repeated key close it. A spend window of a
grant or the meter is not such a limit: it stays `limit-reached` with its approval request (DL-19,
[delegation](delegation.md)), relayed unchanged.

**`quota-exhausted`.** A job a limit stopped and that its provider will not resume ends `failed` with
`error: {code: "quota-exhausted", message, data: {retryable, resetsAt?}}`
([`interop-common.schema.json#/$defs/quotaExhaustedData`](../../schemas/interop-common.schema.json), closed).
`retryable` is `true` when the same intent may run again once the limit resets, `false` when a person must act (a plan
changed, a provider budget raised). `resetsAt` is when the limit resets, an RFC 3339 instant in UTC with `T` and `Z`
upper-case and at most three fraction digits (`#/$defs/utcInstant`), and only with `retryable: true`.

**A paused job.** A provider that resumes the same job after the limit keeps it `working` and writes its
`statusMessage` as `quota-exhausted` or `quota-exhausted until <UTC instant>`, either optionally followed by a colon, a
space and a text that is not only ASCII white space (space, tab, line feed, carriage return), at most 500 characters (code points, as JSON Schema counts) in all;
`pollIntervalMs` SHOULD reach the reset, within its cap of 3 600 000. `readJobPause(answer)` reads it. A `working` job
whose message starts `quota-exhausted` and breaks the grammar is `FAC-SEM-119`'s. The job gains no member and no
status: its schema is closed and its states are MCP Task states. `degraded` stays a service's health, never a job's
state.

**`outcome-unknown`.** A job whose effect may have happened and that its provider cannot observe ends `failed` with
`error: {code: "outcome-unknown", message, data?}`. As in project comms, only an observed result settles it. Fabric's
hub already answers `agent.call` so when a call reached the product and its answer was lost (`data.mayHaveRun`), and
keeps refusing that key; DEC-0087 gives the code its meaning for every job.

**The caller's act.** A caller answers each `fabric.job.get` or `fabric.job.cancel` answer as `jobCallerAction(answer,
now)` does, `now` a UTC instant:

| Answer | Act |
|---|---|
| `working`, a limit paused it, its reset after `now` or not given | `wait` (`notBefore` the reset, when given) |
| `working` otherwise (a reset reached) | `poll` |
| `input_required` | `answer` |
| `completed` | `done` |
| `cancelled` | `cancelled` |
| `failed`, `quota-exhausted`, `retryable: true` | `resend` under the same key (`notBefore` its `resetsAt`, when after `now`) |
| `failed`, `quota-exhausted`, `retryable: false` | `person`: nothing is sent until a person acts; then a resend under the same key |
| `failed`, `limit-reached` | `person`: its approval request reaches the operator (SCN-017); after the approval a resend under the same key |
| `failed`, `outcome-unknown` | `reconcile`: observe whether the effect happened |
| `failed`, any other code | `failed` |
| `now` unreadable, no `{job}` with an id and a status, a `failed` job whose `error` is not `{code, message, data?}` with a non-empty message, `quota-exhausted` data that is not its schema's, a job that `queue-full` ended (a refusal at start, DEC-0104), a malformed pause | `invalid`: the caller sends nothing new; it keeps polling a `working` job and reports any other answer as malformed |

It never answers "submit anew". After `outcome-unknown` a caller sends nothing under a new key until it has observed that
the effect did not happen; a new attempt is then a new intent (a new `request`, below). `FAC-SEM-120` (kind
`job-caller`, `{answer, now, action}`) compares an implementation's act with it. A checker of a job answer runs kind
`interop-job` beside `interop-job-trace`.

**The intent's key.** A resend reuses the idempotency key its intent derives, never a clock or a random value, so a
resend after a restart or on another machine is the same request. `intentIdempotencyKey({agentId, capability, input,
request?})` is a UUID of version 8 (RFC 9562 §5.5, §5.8): the first 16 bytes of the SHA-256 of the RFC 8785 form of
that object, `ver` set to `0b1000` and `var` to `0b10`, in lower-case hex 8-4-4-4-12. `request` names the principal's
request (a task id, a message id) when one principal asks twice for the same input on purpose. A UUID fits `agent.call`'s
`idempotencyKey` ([C3.5](#c35-the-hub)) and capabilities whose input requires a UUID key. It answers no key for an input
with no RFC 8785 form.

**The provider's answer to a repeated key.** A provider keeps a key per authenticated caller, so two callers that send
the same input never share a job (a node that queues keys its callers with `jobCallerKey`, [agent
network](agent-network.md#call-queue)). A key whose job ended `quota-exhausted` admits the same intent again once the limit no
longer holds (the reset passed, or the person acted), and so does a key whose job ended `limit-reached` once its
approval is granted: the provider runs it, once. A key whose job ended `outcome-unknown` is answered with that job
again and never runs a second time. Any other key whose job ended is answered with that job.

**Unknown is `null`.** In a job's or a result's `usage` ([`common.schema.json#/$defs/usage`](../../schemas/common.schema.json)),
`inputTokens`, `outputTokens`, `cacheReadTokens`, `cacheWriteTokens`, `costUsd` and `wallMs` are `null` when nobody
measured them, never 0, toward a reader of `fabric-interop/0.2`; 0 is a measured zero (DEC-0021's rule for cost,
extended). Toward a reader of `fabric-interop/0.1` the gate below applies. `partial` is `true` when a number is
a lower bound or unknown; a writer SHOULD set it beside a `null` and never sets it `false` there (`FAC-SEM-119`, kinds
`usage`, `interop-job` and `result`).

**The gate.** `usage` is closed and its numbers were integers, so a reader of `fabric-interop/0.1` refuses `null` and
`partial`. DEC-0087 publishes `fabric-interop/0.2`, whose readers accept them. A caller names the revisions it reads in
its request's `_meta.protocols` (DEC-0067's list, [`interop-request-meta.schema.json`](../../schemas/interop-request-meta.schema.json)),
and a provider writes `null` or `partial` only toward a caller that names `fabric-interop/0.2` (`readsNullUsage`).
Toward any other caller it writes the lower bound it measured, as before; nothing goes to `notVerified`, so the result's
`outcome` is the work's (`FAC-SEM-001`). Usage stays non-authoritative until reconciled, as it always was
([results and evidence](results-and-evidence.md)). The `data` constraint binds `quota-exhausted`, which no provider sent
before, and since DEC-0104 `queue-full` (`queueFullData`), a code no job ends and that a node that queues answers at
start ([agent network](agent-network.md#call-queue)). `contractVersion` stays `0.1.0`.

Not decided here: whether `cancelled` asserts that no effect happened; a machine-readable scope for a limit; how the
two codes and the pause travel on the MCP Task route (C3.2), so a provider that limits a job serves it through the job
handle and `fabric.job.get`; C4 (a 4xx at submit against a 4xx while polling), which stays adapter guidance.

## C3.3 Awaiting a choice

A job or call that needs a person returns `input_required` with MCP
elicitation `inputRequests` in **form mode**; a choice is a single-select enum with titles
(`oneOf: [{const, title}]`). Fabric maps it to an interaction point (ADR-0017) and answers with
`tasks/update` (Task) or `fabric.job.get` + `inputResponses` (job handle). **FAC-SEM-018** form
mode never requests a secret (MCP rule); secrets use URL mode. A URL-mode request on the service's own page MUST carry
its open_link as `url`, never a raw local address (**FAC-SEM-143**, [service](service.md#page-links) PL-4,
DEC-0123), and a tool answer that names a page for a person MUST carry it in `open_link`.

`inputRequests` is the MCP map of request key to `elicitation/create` request;
`inputResponses` maps the same keys to `{action: accept | decline | cancel, content?}`.
Derived constraint: in `fabric-interop/0.1` an input request is an elicitation (form or
URL mode) and nothing else, and a form's `requestedSchema` is a flat object of
primitive fields, as MCP restricts it. FAC-SEM-018 reads each form field's name, title,
description and format for the vocabulary of credentials (password, secret, API key,
access token, private key, credential) and refuses the request.

An input request is a `relayed` action whose id is its request key ([service](service.md#actions) AP-2, DEC-0121), so
the `fabric.job.get` call that carries `inputResponses` carries the operator's decision in `_meta.decision`, one call
per key decided. When their agent answers, the decision quotes the operator's words (AP-3). When the operator clicks a
choice at Fabric's interaction point, the host is a T0 caller and its decision quotes the request and the choice the
person pressed (`instruction`: the request's `message`, then `Choice:` and the chosen `title`), `at` being the press
(DEC-0121). A declined or cancelled answer is the person's no and carries no decision.

## Actions and the operator's decision

<a id="action-codes"></a>

DEC-0121 (`fabric-actions/0.1`) · rule code `FAC-SEM-142` · [service](service.md#actions)

A request's `_meta` MAY carry `decision`, the operator's decision on an action the service declares `relayed`
([`decision.schema.json`](../../schemas/decision.schema.json), a member of
[`interop-request-meta.schema.json`](../../schemas/interop-request-meta.schema.json)): `{by: "operator", via:
"relayed-instruction", action, target?, instruction, at}` (DEC-0121 AP-2). A reader pinned before DEC-0121 ignores it, as any
unknown `_meta` member. An agent sets it only for words the operator gave it about the action, in AP-3's form; a job's
input request is answered as [C3.3](#c33-awaiting-a-choice) says. A request's `_meta` MAY carry `mandate` too, the
operator's mandate for the task the call serves ([`mandate.schema.json`](../../schemas/mandate.schema.json),
[delegation](delegation.md#the-operators-mandate), DEC-0125), and the hub's `agent.call` carries it as `call.mandate`,
forwarded from a T0 or T1 origin and dropped from a T2 one, as a decision is.

DEC-0121 adds three codes to DL-19's one set of authorisation refusals ([delegation](delegation.md#refusal-codes)),
each in the `structuredContent` of an `isError` tool result:

| Code | Meaning | Who answers | What the caller does |
|---|---|---|---|
| `operator-decision-required` | a `relayed` action from a T0 or T1 caller came without a decision | the service | asks the operator and calls again with their answer in `_meta.decision` |
| `decision-invalid` | the decision is not valid against its schema, names another action or another object, its `at` is not read strictly, is more than 60 s after the service's clock or more than 24 h before it | the service | corrects the decision it relays; an agent not sure the operator decided asks them (AP-3) |
| `human-step-required` | the action is a step only the person takes (`gate: human`): sign-in, consent, payment, secret, spend above a limit, a passkey signature | the service, with `error.data.humanStep` and `error.data.url`, the direct link to the step | hands the person that link |

A `relayed` action from a T2 caller keeps [delegation](delegation.md#refusal-codes)'s `approval-required` (DL-17); its
`_meta.decision` changes nothing. `actionDecision` in [`src/actions.ts`](../../src/actions.ts) is the reference, with
the vectors [`actions.json`](../../fixtures/vectors/actions.json) (DEC-0121).

## C3.4 Trace

Every request carries `_meta.traceparent` (W3C, lowercase hex) and MAY carry
`tracestate`. An agent MUST: (a) start its work as a child span of that parent; (b) put the same
trace id, as a new child span, on every outgoing call; (c) add `traceId` and `spanId` to every
event it publishes on its `fabric-service` events feed. **FAC-SEM-019** a job result without a
trace id is accepted but its span is recorded `incomplete`.

- `_meta` of a request: [`interop-request-meta.schema.json`](../../schemas/interop-request-meta.schema.json)
  (W3C Trace Context Level 1: version other than `ff`, 32-hex trace id and 16-hex parent
  id, neither all zeros, lowercase).
- Events: `traceId` and `spanId` are optional fields of a
  [`fabric-service` event](service.md#events-feed) and come as a pair.
- **Ruled (DEC-0017, OQ-0007).** Only an event about traced work carries trace context;
  an event about untraced work (the service started, a schedule fired) MUST NOT invent
  one.
- A FAC-SEM-019 finding has `severity: accepted`: the result is kept and its span is marked
  `incomplete` (`spanCompleteness`).
- **Ruled (DEC-0017, OQ-0003).** The envelope carries its trace — `trace: {traceparent,
  tracestate?}` — and it is authoritative for a stored result, because a job outlives
  the response that started it. FAC-SEM-019 therefore reads `result.trace`, not the
  response. Where the answer's `_meta.traceparent` and the envelope's trace both exist,
  they MUST agree — same trace id and span id — or **FAC-SEM-022** refuses the answer.

## C3.5 The hub

Fabric's MCP is the only route between agents: an agent reaches another agent
by calling Fabric's `agent.call {agentId, capability, input, idempotencyKey?, decision?}` (and
`fabric.job.get/cancel` for the job it returns). Fabric enforces the caller's MCP access binding
(ADR-0026), mints the callee's credential itself, and journals one span per hop. Credentials
travel over HTTP only in headers (`Authorization: Bearer <token>`), and over the relay only in a sealed call's
`delegation` member (DL-11, DEC-0106); never in a URL, argv, or log.

Arguments: [`interop-agent-call.schema.json`](../../schemas/interop-agent-call.schema.json). Between two machines of
one estate the same arguments travel over the relay inside a sealed `fabric-agent-call/1`
([machine calls](machine-calls.md#the-sealed-call), DEC-0106).
`agentId` is a registry id — a provider id, or a service `id` optionally followed by
`.instance`. The schema admits no field beyond these and `decision`, so a credential cannot ride in
the arguments. `decision` is the operator's decision on a `relayed` action ([service](service.md#actions) AP-2): the hub
forwards a T0 or T1 origin's to the callee as the hop's `_meta.decision`, unchanged, and drops a T2 origin's, which
would change nothing there; it passes the callee's DL-19 refusals (`operator-decision-required`, `decision-invalid`,
`human-step-required` with their `data`) back unchanged, never as a product error, and never answers a resend that
carries a decision from what it remembered of the same call without one; the callee records the hub and the origin its
delegation token names as the relaying caller (DEC-0121). The hub's own `fabric.job.get` forwards a T0 or T1 origin's
`_meta.decision` to the callee the same way (DEC-0121).

**Amendment (DEC-0039).** The hub is the only **issuer** between agents, not the only
**route**. It signs a [delegation token](delegation.md) naming the person the work is for,
the chain of agents acting and the one callee, and a call carrying that token goes direct
from caller to callee in `Authorization: Bearer` (DL-9). Where the hub forwards a call
because it holds the callee's credential itself, it keeps forwarding and attaches the token
as `Fabric-Delegation` (DL-10), so the callee sees the chain either way. Every mint and every
forward is journalled by the hub, one span per hop as before. "Fabric's MCP is the only route"
above now reads as "Fabric is the only issuer"; `agent.call` stays a valid route and its
arguments are unchanged. This is additive under DEC-0016: a caller using `agent.call` is
unaffected, and a direct call without a delegation token is the callee's to refuse.

## C3.6 Discovery surface

A service's well-known document MAY add
`surfaces.mcp.capabilities: [<capability names>]` so a host can list capabilities without the
token; the manifest remains the authority.

The field is in [`service-well-known.schema.json`](../../schemas/service-well-known.schema.json).

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-017"></a>`FAC-SEM-017` | `interop-tool` | the served tool has the capability's name, schemas (a job tool: the DEC-0017 union) and derived annotations |
| <a id="fac-sem-023"></a>`FAC-SEM-023` | `interop-tool-list`, `interop-tool` | every served tool's `outputSchema`, when present, has root `type: "object"` |
| <a id="fac-sem-018"></a>`FAC-SEM-018` | `interop-input-requests` | a form-mode request asks for no secret |
| <a id="fac-sem-019"></a>`FAC-SEM-019` | `interop-job-trace`, `interop-result-trace` | a result whose envelope carries no trace is accepted; its span is `incomplete` |
| <a id="fac-sem-022"></a>`FAC-SEM-022` | `interop-job-trace`, `interop-result-trace` | the answer's `_meta.traceparent`, where present, agrees with the envelope's trace |
| <a id="fac-sem-119"></a>`FAC-SEM-119` | `interop-job`, `usage`, `result` | a `working` job's `statusMessage` that starts `quota-exhausted` follows the pause grammar, its instant UTC on a day that exists; `quota-exhausted`'s `resetsAt` names a day that exists; a `usage` (its own, a job result's, a result's) with a `null` number is not `partial: false` |
| <a id="fac-sem-120"></a>`FAC-SEM-120` | `job-caller` | a caller's act on a job answer at `now` equals `jobCallerAction`'s |

Kind `interop-input-requests` is also read by `FAC-SEM-143` (a URL-mode request's `url`), which
[service](service.md#fac-sem-143) defines and [`test/page-links.test.ts`](../../test/page-links.test.ts) tests (DEC-0123).

Fixtures: every `interop-*` entry of [`fixtures/catalogue.json`](../../fixtures/catalogue.json),
`fixtures/semantic/job-limits-*` and the vectors [`fixtures/vectors/job-limits.json`](../../fixtures/vectors/job-limits.json);
rule tests: [`test/interop-rules.test.ts`](../../test/interop-rules.test.ts).
