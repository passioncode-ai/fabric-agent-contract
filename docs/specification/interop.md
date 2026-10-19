# Interop extension `fabric-interop/0.1`

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

Both keys are the constants in [`src/extensions.ts`](../../src/extensions.ts). The
documentation gate (`pnpm docs:check`) refuses any other spelling of an extension key in
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
  `{"job": {"id": "<opaque>", "status": "working"}}`, and the agent serves two tools:
  `fabric.job.get {id}` → `{"job": {id, status, statusMessage?, updatedAt, pollIntervalMs?,
  inputRequests?, result?, error?}}` and `fabric.job.cancel {id}` → the same shape.
- `status` ∈ `working | input_required | completed | failed | cancelled` (the MCP Task states);
  terminal: `completed | failed | cancelled`.
- `result` is the **full result envelope** ([results and evidence](results-and-evidence.md)) with `output` (the
  `outputSchema` value) and `usage` (`{inputTokens, outputTokens, cacheReadTokens?, cacheWriteTokens?, costUsd?,
  wallMs}`) required: one shape, no subset (DEC-0017, OQ-0002; `interop-result.schema.json`).
- A job id is stable across restarts of the agent; `fabric.job.get` for an unknown id answers
  `isError: true` with `unknown-job`, never a fresh job.

| Shape | Schema |
|---|---|
| The handle a job-capable tool returns | [`interop-job-handle.schema.json`](../../schemas/interop-job-handle.schema.json) |
| `fabric.job.get` / `fabric.job.cancel` arguments | [`interop-job-request.schema.json`](../../schemas/interop-job-request.schema.json) |
| Their answer | [`interop-job.schema.json`](../../schemas/interop-job.schema.json) |
| The result envelope | [`interop-result.schema.json`](../../schemas/interop-result.schema.json) |
| A job-backed tool's `structuredContent` | [`interop-job-tool-output.schema.json`](../../schemas/interop-job-tool-output.schema.json) |
| `usage` | `common.schema.json#/$defs/usage` (also optional on the full [result](results-and-evidence.md)) |

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

DEC-0087 (OQ-0012, board row CT-55) · rule codes `FAC-SEM-119`, `FAC-SEM-120` · code
[`src/job-limits.ts`](../../src/job-limits.ts) · vectors
[`fixtures/vectors/job-limits.json`](../../fixtures/vectors/job-limits.json), written by
[`tools/vectors/job-limits.ts`](../../tools/vectors/job-limits.ts) · tests
[`test/job-limits.test.ts`](../../test/job-limits.test.ts)

A limit (a provider's quota, a subscription's window, a spending ceiling) stops or pauses a job, and an effect (a
payment, a message, an order) may happen without its provider seeing the answer. A caller that reads either as an
ordinary failure submits again and pays twice: an agent retrospective of 2026-10-17 counted it in about ten agents.
Two error codes, a pause grammar, one act per answer and a key per intent close it.

**`quota-exhausted`.** A job a limit stopped and that its provider will not resume ends `failed` with
`error: {code: "quota-exhausted", message, data: {retryable, resetsAt?}}`
([`interop-common.schema.json#/$defs/quotaExhaustedData`](../../schemas/interop-common.schema.json), closed).
`retryable` is `true` when the same intent may run again once the limit resets, `false` when a person must act (a
budget raised, a plan changed). `resetsAt` is when the limit resets, an RFC 3339 instant in UTC (`T` and `Z`
upper-case, `#/$defs/utcInstant`), and only with `retryable: true`.

**A paused job.** A provider that resumes the same job after the limit keeps it `working` and writes its
`statusMessage` as `quota-exhausted` or `quota-exhausted until <UTC instant>`, either optionally followed by a colon, a space and
text, at most 500 characters in all; `pollIntervalMs` SHOULD reach the reset, within its cap of 3 600 000.
`readJobPause(answer)` reads it. A `working` job whose message starts `quota-exhausted` and breaks the grammar is
`FAC-SEM-119`'s. The job gains no member and no status: its schema is closed and its states are MCP Task states.
`degraded` stays a service's health, never a job's state.

**`outcome-unknown`.** A job whose effect may have happened and that its provider cannot observe ends `failed` with
`error: {code: "outcome-unknown", message, data?}`. As in project comms, only an observed result settles it.

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
| `failed`, `quota-exhausted`, `retryable: false` | `person`: nothing is sent until a person acts |
| `failed`, `outcome-unknown` | `reconcile`: observe whether the effect happened; a resend reuses the key |
| `failed`, any other code | `failed` |
| `now` unreadable, no `{job}` with an id and a status, a `failed` job without `{code, message}`, `quota-exhausted` data that is not its schema's, a malformed pause | `invalid` |

It never answers "submit anew": after either code a caller sends nothing under a new key. `FAC-SEM-120` (kind
`job-caller`, `{answer, now, action}`) compares an implementation's act with it.

**The intent's key.** A resend reuses the idempotency key its intent derives, never a clock or a random value, so a
resend after a restart or on another machine is the same request. `intentIdempotencyKey({agentId, capability, input,
request?})` is a UUID of version 8 (RFC 9562 §5.5, §5.8): the first 16 bytes of the SHA-256 of the RFC 8785 form of
that object, `ver` set to `0b1000` and `var` to `0b10`, in lower-case hex 8-4-4-4-12. `request` names the principal's
request (a task id, a message id) when one principal asks twice for the same input on purpose. A UUID fits `agent.call`'s
`idempotencyKey` ([C3.5](#c35-the-hub)) and capabilities whose input requires a UUID key. It answers no key for an input
with no RFC 8785 form.

**Unknown is `null`.** In a job's or a result's `usage` ([`common.schema.json#/$defs/usage`](../../schemas/common.schema.json)),
`inputTokens`, `outputTokens`, `cacheReadTokens`, `cacheWriteTokens`, `costUsd` and `wallMs` are `null` when nobody
measured them, never 0; 0 is a measured zero (DEC-0021's rule for cost, extended). `partial: true` says a number is a
lower bound or unknown; `FAC-SEM-119` refuses `partial: false` beside a `null`. A claim nobody verified stays in
`notVerified`, and `succeeded` is refused while one is there (`FAC-SEM-001`, [results and evidence](results-and-evidence.md)).

**Compatibility.** `usage` is closed and its counts were integers, so a reader pinned before DEC-0087 refuses `null`
and `partial`. Readers (Fabric's host and hub, Fabric Dashboards, the adapter's kits) adopt first; a provider writes
`null` or `partial` only toward readers pinned at or after DEC-0087. Until then a provider that does not know a
required count writes the lower bound it measured and names that count in `notVerified`, and omits an optional count
or cost it does not know. The `data` constraint binds only `quota-exhausted`, which no provider sent before. No
`fabric-interop` revision is added: the protocol has no negotiation, so a revision nobody negotiates would add nothing,
and the pin gate does the work, as DEC-0082 and DEC-0086 did. `contractVersion` stays `0.1.0`.

Not decided here: whether `cancelled` asserts that no effect happened; a machine-readable scope for a limit; C4 (a 4xx
at submit against a 4xx while polling), which stays adapter guidance.

## C3.3 Awaiting a choice

A job or call that needs a person returns `input_required` with MCP
elicitation `inputRequests` in **form mode**; a choice is a single-select enum with titles
(`oneOf: [{const, title}]`). Fabric maps it to an interaction point (ADR-0017) and answers with
`tasks/update` (Task) or `fabric.job.get` + `inputResponses` (job handle). **FAC-SEM-018** form
mode never requests a secret (MCP rule); secrets use URL mode.

`inputRequests` is the MCP map of request key to `elicitation/create` request;
`inputResponses` maps the same keys to `{action: accept | decline | cancel, content?}`.
Derived constraint: in `fabric-interop/0.1` an input request is an elicitation (form or
URL mode) and nothing else, and a form's `requestedSchema` is a flat object of
primitive fields, as MCP restricts it. FAC-SEM-018 reads each form field's name, title,
description and format for the vocabulary of credentials (password, secret, API key,
access token, private key, credential) and refuses the request.

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
by calling Fabric's `agent.call {agentId, capability, input, idempotencyKey?}` (and
`fabric.job.get/cancel` for the job it returns). Fabric enforces the caller's MCP access binding
(ADR-0026), mints the callee's credential itself, and journals one span per hop. Credentials
travel only in headers (`Authorization: Bearer <token>`); never in a URL, argv, or log.

Arguments: [`interop-agent-call.schema.json`](../../schemas/interop-agent-call.schema.json).
`agentId` is a registry id — a provider id, or a service `id` optionally followed by
`.instance`. The schema admits no field beyond the four, so a credential cannot ride in
the arguments.

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
| `FAC-SEM-017` | `interop-tool` | the served tool has the capability's name, schemas (a job tool: the DEC-0017 union) and derived annotations |
| `FAC-SEM-023` | `interop-tool-list`, `interop-tool` | every served tool's `outputSchema`, when present, has root `type: "object"` |
| `FAC-SEM-018` | `interop-input-requests` | a form-mode request asks for no secret |
| `FAC-SEM-019` | `interop-job-trace`, `interop-result-trace` | a result whose envelope carries no trace is accepted; its span is `incomplete` |
| `FAC-SEM-022` | `interop-job-trace`, `interop-result-trace` | the answer's `_meta.traceparent`, where present, agrees with the envelope's trace |
| `FAC-SEM-119` | `interop-job`, `usage` | a `working` job's `statusMessage` that starts `quota-exhausted` follows the pause grammar, its instant UTC on a day that exists; `quota-exhausted`'s `resetsAt` names a day that exists; a `usage` (its own, or a job result's) with a `null` number is not `partial: false` |
| `FAC-SEM-120` | `job-caller` | a caller's act on a job answer at `now` equals `jobCallerAction`'s |

Fixtures: every `interop-*` entry of [`fixtures/catalogue.json`](../../fixtures/catalogue.json),
`fixtures/semantic/job-limits-*` and the vectors [`fixtures/vectors/job-limits.json`](../../fixtures/vectors/job-limits.json);
rule tests: [`test/interop-rules.test.ts`](../../test/interop-rules.test.ts).
