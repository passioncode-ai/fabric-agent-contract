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

Status: contract `0.1.0` architecture, schemas, fixtures and validation gates are
implemented. No SDK, runtime, CLI, provider implementation, model router or public
package ships in this version.

## Start here

- [Contract overview](docs/specification/overview.md)
- [Create or connect a compatible agent](docs/guides/connecting-compatible-agents.md)
- [MCP, A2A and local-runner profiles](docs/specification/profiles.md)
- [Registry, admission and binding](docs/specification/registry.md)
- [Coordination and Git integration](docs/specification/coordination.md)
- [Execution contexts and account pools](docs/specification/execution-context.md)
- [Memory, retrospectives and learning](docs/specification/memory-and-learning.md)
- [`mcp-memory-service` reference adapter](docs/reference-architecture/mcp-memory-service-adapter.md)
- [Governance and roles](docs/specification/governance-and-roles.md)
- [Services and their dashboards — local and online (`fabric-service/0.1`)](docs/specification/service.md)
- [Project communication — agents exchange information and requests (`fabric-project-comms/0.1`)](docs/specification/project-comms.md)
- [Calling agents: capabilities, jobs, trace, the hub (`fabric-interop/0.1`)](docs/specification/interop.md)
- [Capability names and product tool underscores (DEC-0020)](docs/specification/interop.md#capability-names)
- [Activity telemetry — sessions, usage, summaries and access logs (`fabric-activity/0.1`)](docs/specification/activity.md)
- [Devices — enrollment, signed policy, check-in and health (`fabric-device/0.1`)](docs/specification/devices.md)
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

