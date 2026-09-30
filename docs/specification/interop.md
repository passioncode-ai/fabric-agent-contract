# Interop extension `fabric-interop/0.1`

`covers:` Fabric agent-registry REQ-04, REQ-05, REQ-11 — DEC-0016, rulings DEC-0017, DEC-0018 · locked in Fabric's
[agent-registry contracts](https://github.com/passioncode-ai/fabric/blob/062895d/docs/evidence/specs/2026-09-29-agent-registry-contracts.md)
§C3 (2026-09-29)

How agents are called: every capability is an MCP tool, long work is a job, a question
for a person is an elicitation, every call carries one trace, and one agent reaches
another only through the host's hub. There is no new wire (DEC-0002): this extension
profiles MCP `2026-07-28` and its official Tasks extension ([sources](../evidence/sources.md)).

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
- `result` is the **result envelope**: `{done: [...], proof: [...], scope: {...}, notVerified:
  [...], output: <outputSchema value>, usage: {inputTokens, outputTokens, cacheReadTokens?,
  cacheWriteTokens?, costUsd?, wallMs}}` (DEC-0011 collections plus usage).
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

Fixtures: every `interop-*` entry of [`fixtures/catalogue.json`](../../fixtures/catalogue.json);
rule tests: [`test/interop-rules.test.ts`](../../test/interop-rules.test.ts).
