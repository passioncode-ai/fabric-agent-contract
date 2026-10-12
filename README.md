<p align="center">
  <a href="https://passioncode.ai/">
    <img src="assets/passioncode-icon-256.png" width="104" height="104" alt="PassionCode.ai passion fruit mark">
  </a>
</p>

# Fabric Agent Contract

**Fabric Agent Contract** says what makes any agent Fabric-compatible: the schemas, profiles
(MCP, A2A, local runner) and conformance rules every provider is admitted by. Fabric is
PassionCode.ai's product, the CEO AI agent: it chooses, binds and runs the agents that do the
work, and this contract is the boundary they cross — work, evidence, capabilities, admission and
authority pass through explicit interfaces instead of one vendor's session format. The contract
is storage-agnostic and stands on its own: any host or agent can implement it, and the
[Fabric Agent Adapter](https://github.com/passioncode-ai/fabric-agent-adapter) is the kit that
does it for an agent.

Status: contract `0.1.0`. What ships: the JSON Schemas, the fixtures, the conformance checker
(`pnpm run check`: schemas, semantic rules, documents), the `pin:check` CLI that reports a consumer's
contract pin, and reference verifiers that consumers copy or port and test against this repository's
vectors — `src/delegation.ts`, `src/grant-projection.ts`, `src/fabric-links.ts`, `src/operator-session.ts`,
`src/session-handoff.ts`, `src/secret-shape.ts` (the one credential detector), `src/package-rules.ts` (the package digest, folder check and signature verifier), `src/estate-record-rules.ts` with
`src/webauthn.ts` (the estate record's digest, chain and offline passkey-assertion verifier), `src/relay.ts` (relay
admission, blob requests and message bodies), `src/secret-envelope.ts` (the HPKE secret envelope), `src/relay-vectors.ts`
(the framework-free runner of the relay's shared vectors, DEC-0066), `src/p256.ts` `signEs256`/`toLowS` (the low-S
ES256 rule, DEC-0066) and
`src/http-signature.ts` (the device request signature's signer and receiver, DEC-0056), `src/hub-key-rules.ts` (whether the
estate record certifies a delegation key, DEC-0060) `src/revocation-delta.ts` (the revocation delta, the heartbeat
and the 72-hour rule, DEC-0054), `src/window-lease.ts` (window leases, DEC-0062), `src/signing-challenges.ts` (the
signing register and its verifier, DEC-0063) `src/openrouter-attribution.ts` (OpenRouter attribution headers, DEC-0065) `src/protocol-revisions.ts` (protocol revisions, N and N−1, DEC-0067) `src/session-join.ts` (one writer per session, DEC-0068) `src/app-descriptor.ts` (an app's own descriptor, DEC-0069) and `src/feed-data.ts` (no secret in a feed event's data, DEC-0070). What does not ship: a runtime, a provider implementation, a model router,
a published package, or an SDK with a stability promise beyond the pinned commit (DEC-0016).

## Start here

- [Contract overview](docs/specification/overview.md)
- [Create or connect a compatible agent](docs/guides/connecting-compatible-agents.md)
- [MCP, A2A and local-runner profiles — where a stdio server is declared, and no secret in a command line (DEC-0044)](docs/specification/profiles.md)
- [Registry, admission and binding](docs/specification/registry.md)
- [Coordination and Git integration](docs/specification/coordination.md)
- [Execution contexts and account pools](docs/specification/execution-context.md)
- [Memory, retrospectives and learning](docs/specification/memory-and-learning.md)
- [`mcp-memory-service` reference adapter](docs/reference-architecture/mcp-memory-service-adapter.md)
- [Governance and roles](docs/specification/governance-and-roles.md)
- [Services and their dashboards — local and online, on macOS, Linux and Windows (`fabric-service/0.1`, DEC-0057 for one copy under every supervisor)](docs/specification/service.md)
- [Embedded dashboard — width, navigation, scrolling and themes inside a host (`fabric-dashboard/0.1`)](docs/specification/embedded-dashboard.md)
- [Project communication — agents exchange information and requests (`fabric-project-comms/0.1`)](docs/specification/project-comms.md)
- [Operator channel — an agent's notifications and decisions in a messenger (`fabric-operator-channel/0.1`)](docs/specification/operator-channel.md)
- [Calling agents: capabilities, jobs, trace, the hub (`fabric-interop/0.1`)](docs/specification/interop.md)
- [Spend policy and grants with amounts — agents check a record instead of asking (DEC-0037, DEC-0038)](docs/specification/spend-policy.md)
- [Conformance — profiles, the semantic-rule register and who checks what](docs/specification/conformance.md)
- [Identifiers — when two identifiers are the same: the normal form writers emit and readers compare (DEC-0076)](docs/specification/identifiers.md)
- [Results and evidence — claims, proof and what was not verified](docs/specification/results-and-evidence.md)
- [Delegation — who acts for whom: the hub's signed token, the callee's offline check, `approval/1` and one set of refusal codes (`fabric-delegation/0.1`)](docs/specification/delegation.md)
- [Fabric's button in a product and `fabric://` links (DEC-0040)](docs/specification/fabric-button.md)
- [Session handoff — the folder a host hands a coding-agent session (`session-handoff/1`, DEC-0042)](docs/specification/session-handoff.md)
- [Capability names and product tool underscores (DEC-0020)](docs/specification/interop.md#capability-names)
- [Activity telemetry — sessions, usage, summaries and access logs (`fabric-activity/0.1`)](docs/specification/activity.md)
- [Devices — enrollment, signed policy, check-in, health and the request signature beside mutual TLS (`fabric-device/0.1`)](docs/specification/devices.md)
- [Relay — admission by device key, store-and-forward messages, trust tiers from the signed sender and the HPKE secret envelope (`fabric-relay/0.1`, `fabric-secret-envelope/1`, DEC-0047)](docs/specification/relay.md)
- [The revocation delta and the heartbeat — revocations within seconds, a signed commitment to them, and the 72-hour rule (`revocation-delta/1`, `heartbeat/1`, DEC-0054)](docs/specification/revocation-delta.md)
- [Window leases — a hub-signed share of an estate window per machine, spent offline and closed at expiry (`window-lease/1`, DEC-0062)](docs/specification/window-lease.md)
- [Signing — the dedicated signing RP, the ceremony and the register of passkey-signed statements (DEC-0063)](docs/specification/signing.md)
- [The local channel to the node — `fabric-local-channel/0.1` (DEC-0075)](docs/specification/local-channel.md)
- [Proposals and learning notes — `fabric-proposal/1`, `learning-note/1` (DEC-0072)](docs/specification/proposals.md)
- [OpenRouter attribution — the organization's products as apps on OpenRouter (DEC-0065)](docs/specification/openrouter-attribution.md)
- [Packages — one version of an agent or a skill set: its digest, its publisher's signature, an organization's countersignature and `agentRef` (`fabric-package/1`, DEC-0050, DEC-0051)](docs/specification/package.md)
- [The estate record — one person's machines, keys, placed agents, secret placements and share grants, revision by revision, signed by their passkey (`estate-record/1`, DEC-0055)](docs/specification/estate-record.md)
- [Agents that are not services (`fabric-provider/0.1`)](docs/specification/provider.md)
- [The runner catalogue of installed coding agents](docs/specification/runners.md)
- [Pipelines and their compatibility rules (`pipeline/0.1`)](docs/specification/pipeline.md)
- [Full estate reference scenario](docs/reference-architecture/estate-loop.md)
- [JSON Schemas](schemas/)
- [Author and operator UX scenarios](docs/ux/scenarios.md)
- [Multi-agent repository wiring](docs/AGENT_SYNC.md)
- [Acceptance evidence](docs/evidence/acceptance.md)

The [initial contract brief](docs/evidence/specs/2026-08-26-fabric-agent-contract-brief.md)
and [Memory Kernel brief](docs/evidence/specs/2026-08-26-memory-kernel-brief.md)
own their run scope, [DECISIONS.md](docs/DECISIONS.md) owns accepted choices, and
[DOCMAP.md](docs/DOCMAP.md) owns propagation rules.

## Quick start for a new teammate

### Install

The repository is public; clone it, or get it with every other repository through org-index
`scripts/clone_all.sh`. Node.js 20+ and pnpm
(the version in `package.json` → `packageManager`):

```bash
gh repo clone passioncode-ai/fabric-agent-contract
cd fabric-agent-contract
pnpm install --frozen-lockfile
```

### Configure

Nothing: no account, no key, no environment variable. The contract is documents, JSON Schemas,
fixtures and the checker that validates them.

### MCP

None, and none is planned: the contract serves no MCP tools. It is the specification an MCP
surface is checked against — the MCP profile in
[profiles](docs/specification/profiles.md) and the tool rules of
[`fabric-interop/0.1`](docs/specification/interop.md). To drive a real MCP surface built on it,
use the [Fabric Agent Adapter](https://github.com/passioncode-ai/fabric-agent-adapter) quick
start: its sample service is called from a real client, and its `check_service.py` probe checks
a live service against these rules.

### Develop

```bash
pnpm run check
```

The gate typechecks the harness, compiles all Draft 2020-12 schemas, runs every
positive/negative fixture case in [`fixtures/catalogue.json`](fixtures/catalogue.json)
plus the semantic rules and the pipeline checker, validates UX traces, resolves
relative links, parses Mermaid source, checks contract-version consistency, extension
key spelling and glossary profile names, and lints Markdown. Start in
[AGENTS.md](AGENTS.md); the decisions are in [DECISIONS.md](docs/DECISIONS.md).

A consuming repository checks that it names one contract revision with
`pnpm pin:check <its checkout>` ([one contract pin](docs/specification/versioning.md#one-contract-pin)).

Shape conformance is not admission. A host must also negotiate the declared
protocol revision, run safe semantic probes and issue a separate immutable
admission decision before a project binding can grant access.

## License

Open source under the [GNU AGPL-3.0](LICENSE). A [commercial license](COMMERCIAL-LICENSE.md) is
available for use that does not meet the AGPL's terms — [passioncode.ai/business](https://passioncode.ai/business/).
Earlier commits carried no licence: the repository was private and unlicensed
([design](docs/evidence/specs/2026-08-26-fabric-agent-contract-design.md)), and the contract has
no `vX.Y.Z` release.
Whether the schemas should carry a permissive exception so any host can implement them is open
for the operator as CO-KB-02 in the knowledge base's
[licensing](https://github.com/passioncode-ai/fabric-workspace/blob/main/knowledge/licensing.md#open-for-the-operator).
Contributions are accepted under [CLA.md](CLA.md).

