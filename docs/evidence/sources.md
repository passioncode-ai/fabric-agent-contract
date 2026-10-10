# External source ledger

Retrieved 2026-08-26 unless a row says otherwise. Normative contract text may depend only on the pinned
revisions below. A newer upstream revision is an input to a future contract
revision, not an implicit change to `0.1.0`.

| Source | Pinned revision | Receipt | Constraint carried into this contract |
|---|---|---|---|
| Model Context Protocol | `2026-07-28` | <https://modelcontextprotocol.io/specification/2026-07-28> | MCP supplies negotiated host/server capabilities. A Fabric MCP profile names required tools or resources but does not redefine MCP framing. |
| Agent2Agent Protocol | `1.0` | <https://a2a-protocol.org/latest/specification/> | A2A supplies Agent Cards, task lifecycle, messages and artifacts for opaque peer agents. Fabric admission augments, rather than replaces, an Agent Card. |
| HTTP cookies — `Set-Cookie` (MDN) | page last modified 2026-09-01, retrieved 2026-10-02 | <https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie> | A `__Host-` cookie needs `Secure`, `Path=/` and no `Domain`; `SameSite=Strict` is not sent on cross-site requests. A remote placement's session cookie uses all four (DEC-0019). |
| PaaS TLS termination — Heroku *HTTP Routing* | page last updated 2026-08-24, retrieved 2026-10-02 | <https://devcenter.heroku.com/articles/http-routing> | TLS can end at the platform's load balancer; `Host` is preserved and the scheme arrives in a forwarded header. A remote service checks both (DEC-0019). |
| A2A discovery | `1.0` | <https://a2a-protocol.org/latest/topics/agent-discovery/> | Well-known discovery starts at `/.well-known/agent-card.json`; private registries and direct configuration remain valid discovery paths. |
| A2A and MCP | `1.0` | <https://a2a-protocol.org/latest/topics/a2a-and-mcp/> | MCP is used for tools and resources; A2A is used for independent agents with their own execution loop. |
| JSON Schema | Draft `2020-12` | <https://json-schema.org/draft/2020-12> | Every machine-readable Fabric shape uses the 2020-12 dialect and an absolute canonical `$id`. |
| Ajv | current docs retrieved 2026-08-26 | <https://ajv.js.org/json-schema.html#draft-2020-12> | Validation uses the dedicated 2020-12 Ajv build; older dialects are not mixed into the same validator instance. |
| Mermaid | current docs retrieved 2026-08-26 | <https://mermaid.js.org/config/usage.html> | CI parses fenced Mermaid bodies with `mermaid.parse`; rendering is not required for conformance. |
| Vitest | `4.x` guide retrieved 2026-08-26 | <https://vitest.dev/guide/> | Test scripts use non-watch `vitest run` and Node.js 20 or newer. |
| pnpm CI | current docs retrieved 2026-08-26 | <https://pnpm.io/continuous-integration> | CI installs the package-manager version declared by the repository and uses the frozen lockfile. |
| GitHub Actions workflow syntax | current docs retrieved 2026-08-26 | <https://docs.github.com/actions/writing-workflows/workflow-syntax-for-github-actions> | CI lives under `.github/workflows`, receives least-privilege permissions, and runs on pull requests and `main`. |
| MCP Tasks extension | `io.modelcontextprotocol/tasks`, stable at MCP `2026-07-28` (retrieved 2026-09-30) | <https://modelcontextprotocol.io/extensions/tasks/overview> | `tasks/get`, `tasks/update` with `inputResponses`, `tasks/cancel`; states `working`, `input_required`, `completed`, `failed`, `cancelled`, the last three terminal. The job handle of `fabric-interop/0.1` mirrors these states for clients without Tasks. |
| MCP elicitation | `2026-07-28` (retrieved 2026-09-30) | <https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation> | Form mode MUST NOT request passwords, API keys, access tokens or payment credentials; URL mode is used for them. Form schemas are flat objects of primitives; a titled single-select is `oneOf: [{const, title}]`. |
| MCP `_meta` trace keys | `2026-07-28`, basic protocol (retrieved 2026-09-30) | <https://modelcontextprotocol.io/specification/2026-07-28/basic> | `traceparent`, `tracestate` and `baggage` are reserved `_meta` keys whose values follow W3C Trace Context and W3C Baggage. |
| MCP tools | `2026-07-28` (retrieved 2026-09-30) | <https://modelcontextprotocol.io/specification/2026-07-28/server/tools> | Tool names may contain dots; `outputSchema` binds `structuredContent`; tool execution errors are results with `isError: true`. |
| W3C Trace Context | Level 1, Recommendation 2021-11-23 (retrieved 2026-09-30) | <https://www.w3.org/TR/trace-context/> | `traceparent` is `version-traceid-parentid-flags` in lowercase hex; version `ff`, an all-zero trace id and an all-zero parent id are invalid. |
| OpenTelemetry OpAMP | specification status Beta, retrieved 2026-10-08 | <https://opentelemetry.io/docs/specs/opamp/> | `AgentToServer.sequence_num` increases by one per message, and on a gap the server sets `ReportFullState`; remote configuration is acknowledged by status; client certificates are offered through a CSR in `ConnectionSettingsRequest`. `fabric-device/0.1` check-in follows these shapes (DEC-0031). |
| OpenTelemetry log data model | stable, retrieved 2026-10-08 | <https://opentelemetry.io/docs/specs/otel/logs/data-model/> | A LogRecord has `Timestamp`, `ObservedTimestamp`, `EventName`, `Attributes` and `Resource` among its fields. Activity telemetry maps onto them through the table in `activity.md`; it is a mapping, not an identity (DEC-0030). |
| Claude Code monitoring | docs retrieved 2026-10-08 (newest feature note v2.1.287) | <https://code.claude.com/docs/en/monitoring-usage> | `claude_code.api_request` carries `model`, `cost_usd`, `input_tokens`, `output_tokens`, `cache_read_tokens`, `cache_creation_tokens` and `request_id`; standard attributes include `session.id` and, when available, `user.email`; prompt text, tool details and raw API bodies are exported only when enabled. A collector maps the first set and drops the rest (DEC-0030). |
| OpenTelemetry GenAI attributes | registry page retrieved 2026-10-08 (marked moved to the GenAI semantic-conventions repository) | <https://opentelemetry.io/docs/specs/semconv/registry/attributes/gen-ai/> | `gen_ai.request.model`, `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens`, `gen_ai.usage.cache_read.input_tokens`, `gen_ai.usage.cache_creation.input_tokens` name what a `usage.line` maps to (DEC-0030). |
| OpenTelemetry VCS attributes | registry page retrieved 2026-10-08 | <https://opentelemetry.io/docs/specs/semconv/registry/attributes/vcs/> | `vcs.ref.head.name` is the name of a branch or tag; `git.branch` maps to it (DEC-0030). |
| ULID | specification, retrieved 2026-10-08 | <https://github.com/ulid/spec> | 26 Crockford base32 characters, lexicographically sortable by time. Collector-originated `eventId`s are ULIDs (DEC-0030). |
| Telegram Bot API | `10.3` (changelog entry 2026-08-24), retrieved 2026-10-10 | <https://core.telegram.org/bots/api> | `callback_data` is 1–64 bytes; multipart uploads are at most 10 MB for photos and 50 MB for other files; `sendMediaGroup` takes 2–10 items and has no `reply_markup`; `getUpdates` does not work while an outgoing webhook is set; `ResponseParameters` carries `retry_after` and `migrate_to_chat_id`; a client shows progress until `answerCallbackQuery` is called; `ForceReply` opens a reply interface; bots may enable bot-to-bot communication. The operator channel's OC-2, OC-5, OC-7, OC-9, OC-10, OC-12 and OC-13 rest on these (DEC-0034). |
| `mcp-memory-service` | commit `f3c20d00201a4eac112a5d29772327fc973606f0` | <https://github.com/doobidoo/mcp-memory-service/tree/f3c20d00201a4eac112a5d29772327fc973606f0> | Recommended pilot retrieval backend only. Its REST/MCP, hybrid search, graph and consolidation features are wrapped by the Memory Kernel; its tested MCP revision is not assumed compatible with Fabric MCP `2026-07-28`. |
| Graphiti | commit `683a8539c8925de69071a1305dc8bf0e52e17c65` | <https://github.com/getzep/graphiti/tree/683a8539c8925de69071a1305dc8bf0e52e17c65> | Candidate temporal graph adapter. Episode provenance and validity windows inform the conceptual model but do not make Graphiti canonical storage. |
| Mem0 | commit `39bc02330563764e7d4465f1ecff5f002d94da1a` | <https://github.com/mem0ai/mem0/tree/39bc02330563764e7d4465f1ecff5f002d94da1a> | Candidate memory adapter. Managed-platform claims and OSS capabilities require separate admission evidence. |
| Long-term memory survey | arXiv `2512.13564v2` | <https://arxiv.org/abs/2512.13564v2> | Formation, evolution, retrieval and use are separate lifecycle concerns; Fabric makes each concern observable and policy-bound. |
| Agent memory survey | arXiv `2603.10062v2` | <https://arxiv.org/abs/2603.10062v2> | Memory is classified by function and scope; Fabric adds authority, evidence and consistency boundaries needed by a multi-project platform. |

## Compatibility rule

A provider declares the exact protocol revision it implements. The host rejects
an unsupported major or incompatible date before semantic probing. A host may
support multiple revisions through separate adapters, but it must never silently
reinterpret one revision as another.

## Evidence boundary

JSON Schema proves document shape. Protocol negotiation proves wire-level
compatibility. Fabric admission probes prove the declared capability can perform
its advertised semantics. None of these three proofs substitutes for another.
