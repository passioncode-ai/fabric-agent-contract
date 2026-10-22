<p align="center">
  <a href="https://passioncode.ai/">
    <img src="assets/passioncode-icon-256.png" width="104" height="104" alt="PassionCode.ai passion fruit mark">
  </a>
</p>

# Fabric Agent Contract

**Fabric Agent Contract** says what makes any agent Fabric-compatible: the schemas, profiles
(MCP, A2A, local runner) and conformance rules every provider is admitted by. Fabric is
PassionCode.ai's product, the CEO AI agent: it chooses, binds and runs the agents that do the
work, and this contract is the boundary they cross: work, evidence, capabilities, admission and
authority pass through explicit interfaces instead of one vendor's session format. The contract
is storage-agnostic and stands on its own: any host or agent can implement it, and the
[Fabric Agent Adapter](https://github.com/passioncode-ai/fabric-agent-adapter) is the kit that
does it for an agent.

Status: contract `0.1.0`. What ships: the JSON Schemas, the fixtures, the conformance checker
(`pnpm run check`: schemas, semantic rules, documents), the author's checker `pnpm validate` for one document or a
folder, the `pin:check` CLI that reports a consumer's contract pin, and reference modules that consumers copy or port
and test against this repository's vectors; the
[reference modules and vectors](docs/specification/conformance.md#reference-modules-and-vectors) table lists each one.
`src/secret-shape.ts` is the shared credential detector; connections use a variant of it, and whether the two become
one is open as CT-73. What does not ship: a runtime, a provider implementation, a model router, a published package,
or an SDK with a stability promise beyond the pinned commit (DEC-0016).

## Build an agent

Pick the row that describes your agent. Each names what to read, what to write, where to start and how to check it.

| You are building | Read | Write | Start from | Check |
|---|---|---|---|---|
| A local MCP service: a long-running process on the operator's machine with an MCP surface and usually a dashboard | [service](docs/specification/service.md), [profiles](docs/specification/profiles.md) | a [service descriptor](schemas/service-descriptor.schema.json) and the [well-known document](schemas/service-well-known.schema.json) it serves; a [manifest](schemas/manifest.schema.json) only when it offers capabilities | the [guide's service example](docs/guides/connecting-compatible-agents.md#a-local-mcp-service): a descriptor that names its manifest, its well-known document and the manifest, checked together; reference fixtures [`service-descriptor.json`](fixtures/positive/service-descriptor.json), [`service-well-known.json`](fixtures/positive/service-well-known.json) | `pnpm validate <folder>` |
| An agent that is not a service: a CLI or a stdio MCP server a host starts | [provider entries](docs/specification/provider.md), [profiles](docs/specification/profiles.md) | a [provider entry](schemas/provider.schema.json) and its [manifest](schemas/manifest.schema.json) | the [guide's stdio pair](docs/guides/connecting-compatible-agents.md#an-agent-that-is-not-a-service): an entry saved as `<id>.json` and the manifest it names, checked together by the suite | `pnpm validate <folder>` |
| An A2A agent: a peer other agents call over A2A | [profiles](docs/specification/profiles.md#a2a-peer-profile) | a [manifest](schemas/manifest.schema.json) whose capability uses the `a2a` profile | [`manifest-a2a.json`](fixtures/positive/manifest-a2a.json) | `pnpm validate <file>` |
| A coding agent run as a local runner (Claude Code, Codex, Cursor and others) | [the local-runner profile](docs/specification/profiles.md#local-runner-profile), [runners](docs/specification/runners.md) | a [manifest](schemas/manifest.schema.json) whose capability uses the `local-runner` profile | [`manifest-local.json`](fixtures/positive/manifest-local.json), [`catalogue/coding-agents.json`](catalogue/coding-agents.json) | `pnpm validate <file>` |

`pnpm validate <file|dir> [--schema <name>] [--kind <kind>] [--json]` exits 0 when the document is clean, 1 when it
has a problem and 2 on a usage error. The [guide](docs/guides/connecting-compatible-agents.md) walks the service, stdio and
local-runner rows with minimal examples; for an A2A peer, its profile and the fixture above are the example, and the [Fabric Agent Adapter](https://github.com/passioncode-ai/fabric-agent-adapter) scaffolds
and probes each kind.

## Start here

- [Contract overview](docs/specification/overview.md)
- [Specification index](docs/specification/README.md): every page by topic, with who uses it
- [Create or connect a compatible agent](docs/guides/connecting-compatible-agents.md)
- [Conformance](docs/specification/conformance.md): the check layers, the gate, the semantic rule register
- [Versioning](docs/specification/versioning.md): one contract pin per consumer
- [Decisions](docs/DECISIONS.md)
- [Terms](CONTEXT.md)
- [Backlog](docs/backlog.md)

## Quick start for a new teammate

### Install

The repository is public; clone it, or get it with every other repository through org-index
`scripts/clone_all.sh`. Node.js 22.13+ (the declared pnpm 11 needs it) and pnpm
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
surface is checked against: the MCP profile in
[profiles](docs/specification/profiles.md) and the tool rules of
[`fabric-interop/0.1`](docs/specification/interop.md). To drive a real MCP surface built on it,
use the [Fabric Agent Adapter](https://github.com/passioncode-ai/fabric-agent-adapter) quick
start: its sample service is called from a real client, and its `check_service.py` probe checks
a live service against these rules.

### Develop

```bash
pnpm run check
```

That is the merge gate. What it runs, the privacy check included, is described once, in
[conformance](docs/specification/conformance.md#required-repository-gates). Start in [AGENTS.md](AGENTS.md); the
propagation rules are in [DOCMAP.md](docs/DOCMAP.md).

A consuming repository checks that it names one contract revision with
`pnpm pin:check <its checkout>` ([one contract pin](docs/specification/versioning.md#one-contract-pin)).

Shape conformance is not admission. A host must also negotiate the declared
protocol revision, run safe semantic probes and issue a separate immutable
admission decision before a project binding can grant access.

## License

Open source under the [GNU AGPL-3.0](LICENSE). A [commercial license](COMMERCIAL-LICENSE.md) is
available for use that does not meet the AGPL's terms: [passioncode.ai/business](https://passioncode.ai/business/).
Earlier commits carried no licence: the repository was private and unlicensed
([design](docs/evidence/specs/2026-08-26-fabric-agent-contract-design.md)), and the contract has
no `vX.Y.Z` release.
Whether the schemas should carry a permissive exception so any host can implement them is open
for the operator as CO-KB-02 in the knowledge base's
[licensing](https://github.com/passioncode-ai/fabric-workspace/blob/main/knowledge/licensing.md#open-for-the-operator).
Contributions are accepted under [CLA.md](CLA.md).

