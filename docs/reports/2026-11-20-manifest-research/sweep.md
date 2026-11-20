# The AI-native sweep of 2026-11-20 (passioncode-ai repositories)

A read-only static scan, run by a subagent of this session on 2026-11-20 over the Git repositories with a commit in the
last 90 days in the operator's workspace. Rules checked: A1 an agent surface (MCP or at least an API) for every function a
person reaches, and the inventory `docs/agent-surface.md`; A2 two doors, `search` and `execute`; A3 human surfaces
present; A4 `agent-health/1`; A5 a brain (`kb.*`, `memory/0.1`, a knowledge graph, a cited search). Nothing was run
and no server was called; tool counts come from declared capabilities and can include operations behind the doors.
About 25 repositories were read by hand to correct the scanner.

This page lists only the repositories of the `passioncode-ai` organization. The whole scan also covered the
operator's personal repositories and those of other organizations; its full list is kept in the operator's private
repository, not here (the rule that a personal project and another organization are never named in this one's
documents).

## Counts

| Verdict | All scanned | passioncode-ai |
|---|---|---|
| missing | 22 | 3 |
| partial | 104 | 25 |
| ai-native | 1 | 0 |
| n/a | 71 | 9 |
| total | 198 | 37 |

`missing`: human surfaces with neither MCP nor an API. `partial`: some of A1, A2, A4, A5 missing. `n/a`: a
library, a set of documents or data with no function a person reaches.

## passioncode-ai repositories

| Repository | Kind | Verdict | Gaps |
|---|---|---|---|
| fabric-vr | product/app | missing | A1 no MCP server and no API; human surface app/src/main/AndroidManifest.xml; A1 no docs/agent-surface.md (agent-surface/1) inventory; A4 no agent-health/1 |
| okolos-extension | product/app | missing | A1 no MCP server and no API; human surface apps/extension/src/first-run/index.html:1; A1 no docs/agent-surface.md (agent-surface/1) inventory; A4 no agent-health/1; A5 no memory/knowledge layer found |
| passioncode-ai.github.io | product/app | missing | A1 no MCP server and no API; human surface 404.html:1; A1 no docs/agent-surface.md (agent-surface/1) inventory; A4 no agent-health/1; A5 no memory/knowledge layer found |
| content-factory-accounts | agent/service | partial | A2 MCP without search/execute doors (0 tools/operations, vendor/cfstation/service.py:28); A1 no docs/agent-surface.md (agent-surface/1) inventory; A4 no agent-health/1; A5 no memory/knowledge layer found |
| content-factory-agent | agent/service | partial | A1 no docs/agent-surface.md (agent-surface/1) inventory; A4 no agent-health/1; A5 no memory/knowledge layer found |
| content-factory-analyst | agent/service | partial | A2 MCP without search/execute doors (0 tools/operations, vendor/cfstation/service.py:28); A1 no docs/agent-surface.md (agent-surface/1) inventory; A4 no agent-health/1; A5 no memory/knowledge layer found |
| content-factory-contract | agent/service | partial | A2 MCP without search/execute doors (2 tools/operations, cfstation/kit/fabric_interop.py:900); A1 no docs/agent-surface.md (agent-surface/1) inventory; A4 no agent-health/1; A5 no memory/knowledge layer found |
| content-factory-direct | agent/service | partial | A2 MCP without search/execute doors (0 tools/operations, vendor/cfstation/service.py:28); A1 no docs/agent-surface.md (agent-surface/1) inventory; A4 no agent-health/1; A5 no memory/knowledge layer found |
| content-factory-leads | agent/service | partial | A2 MCP without search/execute doors (0 tools/operations, vendor/cfstation/service.py:28); A1 no docs/agent-surface.md (agent-surface/1) inventory; A4 no agent-health/1; A5 no memory/knowledge layer found |
| content-factory-marketing | agent/service | partial | A2 MCP without search/execute doors (0 tools/operations, vendor/cfstation/service.py:28); A1 no docs/agent-surface.md (agent-surface/1) inventory; A4 no agent-health/1; A5 no memory/knowledge layer found |
| content-factory-producer | agent/service | partial | A2 MCP without search/execute doors (0 tools/operations, vendor/cfstation/service.py:28); A1 no docs/agent-surface.md (agent-surface/1) inventory; A4 no agent-health/1; A5 no memory/knowledge layer found |
| content-factory-publisher | agent/service | partial | A2 MCP without search/execute doors (0 tools/operations, vendor/cfstation/service.py:28); A1 no docs/agent-surface.md (agent-surface/1) inventory; A4 no agent-health/1; A5 no memory/knowledge layer found |
| content-factory-scout | agent/service | partial | A2 MCP without search/execute doors (0 tools/operations, vendor/cfstation/service.py:28); A1 no docs/agent-surface.md (agent-surface/1) inventory; A4 no agent-health/1; A5 no memory/knowledge layer found |
| content-factory-warmup | agent/service | partial | A2 MCP without search/execute doors (0 tools/operations, vendor/cfstation/service.py:28); A1 no docs/agent-surface.md (agent-surface/1) inventory; A4 no agent-health/1; A5 no memory/knowledge layer found |
| fabric | agent/service | partial | A2 MCP without search/execute doors (61 tools/operations, apps/desktop/src/main/agentSurface.ts:57); A1 no docs/agent-surface.md (agent-surface/1) inventory; A4 no agent-health/1 |
| fabric-agents-database | agent/service | partial | A1 no docs/agent-surface.md for its own service (agent-surface/1 appears only in reports about templates, e.g. docs/reports/2026-11-14-agent-surface/README.md); A4 no agent-health/1 answered by service/ (the string appea |
| fabric-dashboards | agent/service | partial | A1 no docs/agent-surface.md (agent-surface/1) inventory; A5 no memory/knowledge layer found |
| fabric-inbox | agent/service | partial | A2 MCP without search/execute doors (175 tools/operations, workers/mcp/protocol.ts:345); A1 no docs/agent-surface.md (agent-surface/1) inventory; A4 no agent-health/1 |
| fabric-switchboard | agent/service | partial | A2 MCP without search/execute doors (95 tools/operations, crates/switchboard-cli/src/mcp.rs:2057); A1 no docs/agent-surface.md (agent-surface/1) inventory; A5 no memory/knowledge layer found in code (named only in docs) |
| fabric-workspace | agent/service | partial | A4 no agent-health/1 in code (named only in docs) |
| go-to-market-strategy | agent/service | partial | A1 no docs/agent-surface.md (agent-surface/1) inventory; A4 no agent-health/1 |
| knowledge-graph | agent/service | partial | A1 no docs/agent-surface.md (agent-surface/1) inventory; A4 no agent-health/1 in code (named only in docs) |
| passioncode-platform | agent/service | partial | A2 MCP without search/execute doors (2 tools/operations, src/mcp/server.ts:8); A1 no docs/agent-surface.md (agent-surface/1) inventory; A4 no agent-health/1 in code (named only in docs); A5 no memory/knowledge layer foun |
| passioncode-pm-agent | agent/service | partial | A1 no docs/agent-surface.md (agent-surface/1) inventory |
| passionview | agent/service | partial | A2 MCP without search/execute doors (0 tools/operations, src/core/door.ts:3); A1 no docs/agent-surface.md (agent-surface/1) inventory; A4 no agent-health/1 in code (named only in docs); A5 no memory/knowledge layer found |
| project-observatory-open-source | agent/service | partial | A2 MCP without search/execute doors (9 tools/operations, observatory/engine/mcp/capability_tools.py:33); A1 no docs/agent-surface.md (agent-surface/1) inventory; A4 no agent-health/1 |
| studio-agent | agent/service | partial | A2 MCP without search/execute doors (21 tools/operations); A1 no docs/agent-surface.md (agent-surface/1) inventory; A4 no agent-health/1 |
| fabric-agent-adapter | library/contract/skills | n/a |  |
| fabric-agent-contract | library/contract/skills | n/a |  |
| fabric-agents-org-release | docs/data-only | n/a |  |
| fabric-contract-consumer-review-access | docs/data-only | n/a |  |
| org-index | other | n/a |  |
| passioncode | library/contract/skills | n/a |  |
| passioncode-org-profile | docs/data-only | n/a |  |
| project-observatory-contract | docs/data-only | n/a |  |
| relay | agent/service | n/a |  |

One partial repository on the operator's private-name list is counted above and not named here.

## Limits

- Static only. Whether a served `tools/list` keeps at most three tools beside the doors was confirmed only for the
  servers live in this session.
- Repositories with an MCP kit vendored under `vendor/`, `skills/` or `.claude/` were not scanned there, so their MCP
  can be missed (fabric-agent-adapter reads as `n/a` for this reason).
- Whether a consumer app or a static site should carry A1 is a decision for the strategic plan; the scan counts them.
- Per the owner's pause, no board request was sent; the plan decides the order.
