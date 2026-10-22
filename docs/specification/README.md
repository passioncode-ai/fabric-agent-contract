# Specification index

Every page of the specification, by topic. Each row says what the page defines and how mature it is:

- **adopted by** names the public products that read or write the surface at their own pin; it does not say they
  have adopted every decision on the page, which each one's backlog row tracks ([backlog](../backlog.md));
- **specified, no consumer yet** means no product reads or writes it today;
- **not measured** means the consumer review did not look at it.

The maturity column is the consumer review of 2026-10-21, which read the consumers on `main` `63bb296`
([brief](../evidence/specs/2026-10-21-contract-review/brief.md), axis E). A product that adopts a surface later
updates its row in the same change as its board row. A page is normative whatever its maturity: "no consumer yet"
says nobody has implemented it, not that it is optional.

Start with the [overview](overview.md) and the [author guide](../guides/connecting-compatible-agents.md). Words are
defined in [CONTEXT.md](../../CONTEXT.md).

## Building an agent

| Page | Defines | Maturity |
|---|---|---|
| [overview](overview.md) | the contract's subjects, identity and references, the extension rule | not a wire surface |
| [profiles](profiles.md) | the `mcp`, `a2a` and `local-runner` profiles of a manifest, where a stdio server is declared, no secret in a command line | adopted by provider agents of the estate, the relay, the first organization server, Fabric and the Fabric Agent Adapter |
| [provider entries](provider.md) | `fabric-provider/0.1`: an agent that is not a service | adopted by provider agents of the estate, the relay, the first organization server, Fabric and the Fabric Agent Adapter |
| [registry, admission and binding](registry.md) | discovery, admission and the project binding | not measured |
| [conformance](conformance.md) | check layers, the gate, readers' obligations, canonical forms, the semantic rule register, the reference modules | not a wire surface; its canonical forms are adopted by the relay, the Project Observatory node, the first organization server, the Fabric Agent Adapter and the PassionCode platform |
| [versioning](versioning.md) | immutable revisions, one contract pin, protocol revisions | not a wire surface |
| [adoption](adoption.md) | how consumers follow the contract | not a wire surface |
| [identifiers](identifiers.md) | when two identifiers are the same (normal form) | adopted by the relay, the Project Observatory node, the first organization server and the Fabric Agent Adapter |

## Services and dashboards

| Page | Defines | Maturity |
|---|---|---|
| [services](service.md) | `fabric-service/0.1`: the descriptor, the well-known document, events, the usage report, login, lifecycle | adopted by Fabric Dashboards, the Fabric Agent Adapter kits, Project Observatory, Fabric Inbox, the first organization server, Fabric and about a dozen provider agents of the estate |
| [embedded dashboard](embedded-dashboard.md) | `fabric-dashboard/0.1`: a dashboard inside a host, and its declaration | read by Fabric Dashboards and the Fabric Agent Adapter; Fabric's writer is open (CT-19, CT-21) |
| [connections](connections.md) | `fabric-connections/0.1`: what an agent uses (DEC-0096) | read by Fabric Dashboards with its own reader, not yet re-pinned to the vectors (CT-70); no emitter yet |
| [node summary](node-summary.md) | `node-summary/1`, the organization's harness baseline and drift, `repair-request/1` and `repair-result/1` (DEC-0101) | decided; no consumer yet (CT-83) |
| [Fabric's button and links](fabric-button.md) | Fabric's button in a product and `fabric://` links | adopted by Fabric Dashboards, Fabric and the Fabric Agent Adapter |
| [session handoff](session-handoff.md) | `session-handoff/1`: the folder a host hands a coding-agent session | adopted by Fabric Dashboards, Fabric and the Fabric Agent Adapter |
| [folder attribution](folder-attribution.md) | which Project a coding agent's folder belongs to | adopted by Fabric and Project Observatory |

## Calling agents and jobs

| Page | Defines | Maturity |
|---|---|---|
| [interop](interop.md) | `fabric-interop/0.1`: capabilities as tools, the result, the job handle; `/0.2` for jobs under limits | `/0.1` adopted by Project Observatory, Fabric, the Fabric Agent Adapter and provider agents of the estate; `/0.2` adopted by the Fabric Agent Adapter only |
| [pipelines](pipeline.md) | `pipeline/0.1` and its compatibility rules | adopted by provider agents of the estate, the relay, the first organization server, Fabric and the Fabric Agent Adapter |
| [results and evidence](results-and-evidence.md) | the result envelope: claims, proof, what was not verified | not measured |
| [delegation](delegation.md) | `fabric-delegation/0.1`: who acts for whom, `approval/1`, refusal codes | the token adopted by Project Observatory and the Fabric Agent Adapter; approval and the refusal set have partial implementations only |
| [spend policy](spend-policy.md) | spend policy and grants with amounts (DEC-0037, DEC-0038) | partial implementations only |
| [memory and learning](memory-and-learning.md) | the memory control plane and `memory/0.1` | not measured |
| [proposals and learning notes](proposals.md) | `fabric-proposal/1`, `learning-note/1` (DEC-0072) | specified, no consumer yet |

## Identity, keys and the estate

| Page | Defines | Maturity |
|---|---|---|
| [estate record](estate-record.md) | `estate-record/1`: machines, keys, placements and grants, signed by a passkey | adopted by the relay, the Project Observatory node, the first organization server and the Fabric Agent Adapter |
| [devices](devices.md) | `fabric-device/0.1`: enrollment, policy, check-in, the request signature | adopted by the relay, the Project Observatory node, the first organization server and the Fabric Agent Adapter |
| [estate ceremonies](ceremonies.md) | creating a network, adding a machine, the enroll token, pairing | adopted by the Fabric Agent Adapter and the Project Observatory node |
| [relay](relay.md) | `fabric-relay/0.1` and the secret envelope | adopted by the relay and the Project Observatory node |
| [revocation delta](revocation-delta.md) | `revocation-delta/1`, `heartbeat/1` | not measured |
| [window leases](window-lease.md) | `window-lease/1` (DEC-0062) | specified, no consumer yet |
| [signing](signing.md) | the signing RP, the ceremony, the passkey-signed statements | not measured |

## The board and channels

| Page | Defines | Maturity |
|---|---|---|
| [project communication](project-comms.md) | `fabric-project-comms/0.1`: the Project board | adopted by Fabric (server) and the Fabric Agent Adapter (client) |
| [operator channel](operator-channel.md) | `fabric-operator-channel/0.1` and its status document | the status document (DEC-0058): specified, no consumer yet; the channel itself not measured |
| [local channel](local-channel.md) | `fabric-local-channel/0.1`: the local channel to the node | adopted by Fabric Dashboards, Fabric and the Fabric Agent Adapter |
| [coordination](coordination.md) | multi-agent coordination and Git integration | not measured |

## Telemetry and usage

| Page | Defines | Maturity |
|---|---|---|
| [activity](activity.md) | `fabric-activity/0.1`: sessions, usage, summaries, access logs | not measured |
| [support quality](support-quality.md) | `support-quality-daily/1` (DEC-0095) | the review found three emitters, each shipping its own copy of the schema instead of this one |
| [OpenRouter attribution](openrouter-attribution.md) | the headers that name a product on OpenRouter | not measured |

The usage report of a service is part of [services](service.md#usage-report).

## Runners and models

| Page | Defines | Maturity |
|---|---|---|
| [runners](runners.md) | the runner catalogue, runner routes, runner and model profiles, the coding-agent catalogue | the coding-agent catalogue (DEC-0093): specified, no reader yet; runner profiles and runner routes have partial implementations only |
| [execution contexts](execution-context.md) | execution contexts and account pools | not measured |

## Packages and organisations

| Page | Defines | Maturity |
|---|---|---|
| [packages](package.md) | `fabric-package/1`: one signed version of an agent or a skill set | not measured |
| [contexts](contexts.md) | `personal` and `org:<orgId>` | not measured |
| [entitlements](entitlement.md) | `entitlement/1`, `entitlement-key-set/1` | adopted by the PassionCode platform and the first organization server |
| [share registrations](share-registration.md) | `share-registration/1` | adopted by the first organization server, the Project Observatory node and the Fabric Agent Adapter |
| [partner channel](partner-channel.md) | a partner's keys, its agents' usage and its delegation | partner usage (DEC-0090): specified, no consumer yet |
| [governance and roles](governance-and-roles.md) | roles, grants and data policy | not measured |
