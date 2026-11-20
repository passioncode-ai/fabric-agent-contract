# Draft: the agent and project manifest, `fabric-manifest/1`

**Status: a proposal, not a decision.** Written for the strategic plan of 2026-11-21 (the owner's pause, see the
[report](../README.md)). Nothing here binds until a decision of this contract accepts it; the ids it names (DEC-0190,
`FAC-SEM-187`) were reserved for it by git CAS and are not yet in the registers. Draft files beside it: the schema
[`schemas/fabric-manifest.schema.json`](schemas/fabric-manifest.schema.json), the rule
[`src/manifest-rules.ts`](src/manifest-rules.ts) and the texts [`templates/`](templates/).

The manifest is the short list of rules every agent and every project of the estate keeps from its first commit,
whatever technology it is built with. Technologies come and go (a protocol revision, a model, a hosting); the articles
do not. Each article has two layers:

- **the article**: the rule itself, written without naming a technology; it changes only by a new revision of the
  manifest (`fabric-manifest/2` beside `/1`, [versioning](../../../specification/versioning.md)), never in place;
- **the binding**: how the article is met today (MCP with two doors, `agent-health/1`, `kb.*`, the vault by slot name).
  A binding changes by a decision of the contract, and the article it serves stays as written.

An agent or project carries two files at the root of its repository:

- `MANIFEST.md`, the articles as text, rendered from the contract's templates by the Fabric Agent Adapter, so every agent
  and its people read the same words;
- `fabric.manifest.json`, the declaration: for each article, whether it is met, owed by a backlog row with a date, or
  does not apply with a reason, and the evidence a machine checks.

## The articles

Twelve articles. M-1 to M-9 answer the order of 2026-11-20 (packages 5 and 6, and the addendum of 23:40 on
self-healing); M-10 to M-12 and the placement and operator of M-1 answer the addendum of 2026-11-21 00:25. The text in
[`templates/`](templates/) is the wording a repository carries; this table is its index with the binding of today and
the machine check.

| Article | The rule | Binding today | Checked by |
|---|---|---|---|
| **M-1. Agents first** | Every function is designed for agents from its first day: anything a person can see or do, an agent can call with the same data, effect, checks and record. Every agent is itself reachable by other agents, wherever it runs (on the person's computer, in the cloud, or both), and a local agent may be driven by a coding agent as its operator (Claude Code, Hermes or any other). An interface for people is built afterwards, only where a person needs it or the owner asks for it, and each of its functions names the operation it serves. Only a human step (a sign-in, a one-time code, a consent, a payment, a typed secret, spend above a limit) stays a person's, and it is answered as one. | MCP with two doors, `search` and `execute` ([compact surface](../../../specification/service.md#compact-mcp-surface-dec-0180), DEC-0180, DEC-0182); read parity and the design order ([service](../../../specification/service.md#read-parity-and-the-design-order-dec-0169), DEC-0169); the inventory `docs/agent-surface.md` (the adapter's `agent-surface/1`, the base's R33 O8, O15); `placement` local, cloud or both; the runners of [runners](../../../specification/runners.md) as operators | `FAC-SEM-187` (doors, placement, inventory present); the adapter's probe on the served `tools/list` |
| **M-2. A brain from day one** | The agent or project keeps what it knows as linked data from its first commit: facts with the time they held, their sources, links between them, and a search that answers with citations. A regular "sleep" pass consolidates it: merges duplicates, links what belongs together, retires what stopped being true and records what it learned. Its logs are structured, free of secrets and kept, so the brain learns from them. | the knowledge layer `kb.*` ([memory and learning](../../../specification/memory-and-learning.md#knowledge-layer-dec-0188), DEC-0188), `memory/0.1` (DEC-0023), the base's R33 O17 | `FAC-SEM-187` (evidence named and present) |
| **M-3. Heals itself** | Every agent (product and system alike), dashboard and report notices its own failure and starts healing by itself, with no person or command (Fabric unreachable, a dashboard getting no data from the agent, an MCP door down, a service down): it detects, diagnoses, repairs what it can repair safely, retries or rolls back, and reports what happened: what broke, what it did, whether it worked. A person is called only at a human gate. When the known repair stops working it looks for another way and records it. What it cannot repair, or may not (money, deletion, publication, a human step), goes to the owning project or the person, once per episode. A repair it learned is written to its brain. | `agent-health/1` (DEC-0179) for detection; `heal-attempt/1` for the repair and its report ([self-healing draft](self-healing.md)) | `FAC-SEM-187` (health surface named); `FAC-SEM-188` on each `heal-attempt/1` |
| **M-4. Organizations and projects stay apart** | Every piece of data belongs to one organization and one project. Data crosses that boundary only by an explicit migration someone decided, never because a model asked for it; what has no owner is closed. | the scope label `org/project` and the single send gate (the base's R33 O14, `patterns/scope-gate`); per-account ports (DEC-0154); the task's organization (CT-292) | `FAC-SEM-187` (`organization` declared) |
| **M-5. Secrets by name** | A secret is named, never written: not in code, history, a command line, a link, a log, a prompt or memory. The repository and its manifest name the slots it needs; the values come from the vault at run time. | [credentials](../../../specification/credentials.md); slots of `fabric.source.json` ([source](../../../specification/source.md#slots), DEC-0149); Observatory's vault by slot name | `FAC-SEM-187` (no value shaped like a secret, no home folder, anywhere in the manifest) |
| **M-6. Foreign code through a fork** | Code from someone else's repository is used through our own fork or a copy pinned to an exact commit, with its origin, licence and our changes recorded beside it. It is never edited in place in a dependency folder or in a clone of someone else's main line; a change for its authors goes to them as a proposal. | the `forks` list of the manifest; forks under the organization's account | `FAC-SEM-187` (each fork's upstream, commit, licence and change record; the change record present) |
| **M-7. The owner's decisions bind** | The owner's decisions are written down with their words, the date, where they were said and their scope, in a register that is only added to. An agent decides every other open question itself, by the recorded decisions, then the project's goal, then the safest reversible option, and writes its decision and reason where the work lives. Only a human step waits for a person. | the decision register (`docs/DECISIONS.md` or the project's own); a relayed approval (DEC-0126) | `FAC-SEM-187` (the register named and present) |
| **M-8. Nothing that works is broken** | A change is added beside what exists: a new version next to the old, which keeps working; a regression is rolled back first and fixed second. | [versioning](../../../specification/versioning.md); the base's R28 | `FAC-SEM-187` (evidence named and present) |
| **M-9. Every claim carries its proof** | What the agent or project states as true carries its evidence: a file and line, a command with its output, a test. What could not be read is said to be unread, never shown as zero or as healthy. | `degraded` in every answer ([service](../../../specification/service.md)); `unknown` never read as `ok` (DEC-0179 HL-2) | `FAC-SEM-187` (evidence named and present) |
| **M-10. Shares what it learns** | What an agent learns that others can use (a fix, a technique, a pattern, a better way) goes back to the shared base it was built from, so our agents, our clients' agents and everyone who installs Fabric build on it. What is shared never carries another organization's data or a person's: it is made anonymous on the device before it leaves. The shared base is itself a brain (M-2): recorded, linked, updated and reused. | the agents base's `recording-insights` and contributions; the platform's `insight/1` and `insights.share` (asked of this contract on the board, request `4e931220`); M-4's migration for anything specific | `FAC-SEM-187` (evidence named and present) |
| **M-11. Updates arrive as a graph** | An agent learns of updates as linked knowledge, not as loose text: what changed, what it touches, what depends on it, what was switched off. Each machine's own coordinating agent reads that graph, sends verifiers to check which of its local projects need the change, and applies it through the harness's own updaters, under M-8. An agent can be updated, paused or switched off, and says which version and which links it runs. | the agents base's rollout ledger and update policy (fabric-agents-database), `template-receipt.json`; a graph form of the update to be designed (an open question of the report) | `FAC-SEM-187` (evidence named and present) |
| **M-12. Fits any setup** | An agent reads the setup it finds (the coding agents, the subscriptions and the keys of this computer, the person's own or ours) and builds its solution for that setup, adapting when it changes. It never assumes one harness, one model or one way of paying. | the runners register ([runners](../../../specification/runners.md)); how an agent pays for each model's work, a subscription or tokens (DEC-0186); the execution mode asked on the board (request `7041380c`) | `FAC-SEM-187` (evidence named and present) |

**Agent or project.** An *agent* is a program that acts for someone (it serves a surface, runs work, holds a model
budget). A *project* is anything else of the estate kept in a repository: an app, a site, a library, a contract, a
knowledge base. Every article applies to both. What differs is what may be declared `not-applicable`:

| Article | `agent` | `project` |
|---|---|---|
| M-1, M-2, M-4, M-5, M-7, M-8, M-9, M-10, M-11 | never | never |
| M-3, M-12 | never | with a reason (a project with nothing running: a library, a contract, a set of documents) |
| M-6 | only with an empty `forks` list | only with an empty `forks` list |

A project that serves nothing still meets M-1 through its knowledge (the base's R33 O17: other agents ask it through
`search` and `execute`, never by reading its repository) and M-2 through its knowledge layer.

## The declaration: `fabric.manifest.json`

[`schemas/fabric-manifest.schema.json`](schemas/fabric-manifest.schema.json), closed at every level.

```json
{
  "format": "fabric-manifest/1",
  "kind": "agent",
  "name": "example-agent",
  "organization": {"org": "passioncode", "project": "example-agent"},
  "contract": "v0.1.0+2026-11-20.1",
  "rendered": "MANIFEST.md",
  "placement": ["local", "cloud"],
  "operator": {"local": "any"},
  "articles": {
    "M-1": {"status": "met", "evidence": ["docs/agent-surface.md", "src/mcp/server.ts"]},
    "M-2": {"status": "owed", "evidence": [], "owed": {"row": "EX-12", "by": "2026-12-15"}},
    "M-3": {"status": "met", "evidence": ["src/health.ts"]},
    "M-4": {"status": "met", "evidence": ["src/scope_gate.py"]},
    "M-5": {"status": "met", "evidence": ["fabric.source.json"]},
    "M-6": {"status": "not-applicable", "evidence": [], "reason": "no foreign code"},
    "M-7": {"status": "met", "evidence": ["docs/DECISIONS.md"]},
    "M-8": {"status": "met", "evidence": ["CHANGELOG.md"]},
    "M-9": {"status": "met", "evidence": ["test/"]},
    "M-10": {"status": "owed", "evidence": [], "owed": {"row": "EX-13", "by": "2026-12-15"}},
    "M-11": {"status": "met", "evidence": ["template-receipt.json"]},
    "M-12": {"status": "met", "evidence": ["docs/setup.md"]}
  },
  "surface": {"mcp": {"doors": ["example.search", "example.execute"], "direct": []}, "inventory": "docs/agent-surface.md"},
  "health": {"tool": "example_health"},
  "secrets": ["example-agent/prod/OPENROUTER_API_KEY"],
  "forks": [],
  "decisions": "docs/DECISIONS.md"
}
```

- **MF-1. Shape.** `format` is `fabric-manifest/1`; `kind` is `agent` or `project`; `name` the repository's slug;
  `organization` the scope label `{org, project}` (M-4); `contract` the tag of the contract the articles were rendered
  from; `rendered` the path of `MANIFEST.md`; `articles` holds all twelve, `M-1` to `M-12`, each exactly once.
- **MF-2. Status.** Each article is `met` with at least one evidence path, `owed` with the backlog row and the date by
  which it is met (`owed: {row, by}`), or `not-applicable` with a `reason`, only where the table above allows it.
  `owed` is the honest state of an article not met yet: it is never hidden as `met`, and never left without a row.
- **MF-3. Paths.** Every path (evidence, `rendered`, `surface.inventory`, `decisions`, a fork's `path` and `changes`) is
  relative to the repository root, with forward slashes, no `.` or `..` segment and no leading `/` or `~`; a path that
  ends in `/` names a folder.
- **MF-4. The agent surface (M-1).** `surface.mcp` is `null` (no MCP server) or `{doors, direct}`: `doors` exactly two
  tool names of one domain, one ending in `search` and one in `execute` (`room.search` and `room.execute`, or
  `room_search` and `room_execute`); `direct` at most three tools served beside them, each `{name, reason}` (the
  measured case of DEC-0180, or a name the contract defines). An `agent` has `surface.mcp` whatever the status of M-1
  (every agent is MCP). `surface.inventory` names the inventory of human functions and their operations, or is `null`
  when nothing is reached by a person.
- **MF-5. Placement and operator (M-1).** `placement` lists where the agent runs, `local`, `cloud` or both; a `project`
  that runs nothing gives an empty list. `operator.local` names the coding agent that may drive a local placement: a
  runner kind of the runners register (`claude-code`, `hermes`, ...) or `any`; absent when no coding agent drives it.
- **MF-6. Health (M-3).** `health` names the surface that answers `agent-health/1`: `tool` and/or `cli`. An agent that
  declares M-3 `met` names at least one.
- **MF-7. Secrets (M-5).** `secrets` lists slot names only (`<project>/<env>/<NAME>` or `<NAME>`), at most 64. No string
  anywhere in the manifest is shaped like a credential (`secretValue` of
  [`src/secret-shape.ts`](../../../../src/secret-shape.ts)) or holds a home folder; such a value is named by its place,
  never repeated.
- **MF-8. Forks (M-6).** Each fork is `{path, upstream, commit, licence, changes}`: where it lives in the repository (or
  `.` for a repository that is itself a fork), its upstream as an `https` URL, the exact 40-character commit it is
  pinned to, its SPDX licence, and the file that records our changes. M-6 is `not-applicable` only when `forks` is empty.
- **MF-9. Decisions (M-7).** `decisions` names the decision register.

## The folder check

`pnpm validate --kind fabric-manifest <folder>` (proposed) reads `<folder>/fabric.manifest.json` and checks, in order:

1. the schema and `FAC-SEM-187` on the document (the rules MF-1 to MF-9 a document alone can show);
2. every path it names exists in the folder (an evidence path, `rendered`, `surface.inventory`, `decisions`, a fork's
   `path` and `changes`), read with `lstat` and never followed outside the folder;
3. the rendered `MANIFEST.md` names `fabric-manifest/1` and holds a heading for each article, so an article cut from the
   text is found.

A finding names a path inside the folder, never the folder itself. Exit 0 means no problem, 1 a problem, 2 a usage
error (no manifest in the folder).

What the check does not do: it does not read the code to prove an article (that an MCP server really answers two doors
is the adapter's probe on the served `tools/list`; that a scope gate really refuses is the agent's own tests). It holds
the declaration honest and present; the probes hold the behaviour.

## Where it lives and where it is checked

| Where | What it does | Owner |
|---|---|---|
| this contract | the articles, the templates, the schema, `FAC-SEM-187`, the folder check; its own `fabric.manifest.json` | fabric-agent-contract (CT-353) |
| the Fabric Agent Adapter | renders `MANIFEST.md` and a `fabric.manifest.json` skeleton into every agent it creates or adapts, each article `owed` until shown; its probe runs the folder check and the two-door check on the served `tools/list` | fabric-agent-adapter |
| the agents base | every template carries the manifest and passes the folder check (`tools/check.py`); R33 points at the articles instead of repeating them; the update policy and rollout ledger serve M-11 | fabric-agents-database |
| Fabric | creating an agent or a project writes the manifest from the adapter's templates and runs the folder check before the first commit; a project's page shows its articles' status | Fabric |
| every agent and project | carries both files; an article it does not meet is `owed` with its row and date | each project |

## Semantic rules (proposed)

| Code | Kind | Rule |
|---|---|---|
| `FAC-SEM-187` | `fabric-manifest`, `fabric-manifest-tree` | each article `met` names evidence, `owed` names its row and date, `not-applicable` names a reason and is allowed by the table of agent or project (MF-2); `surface.mcp.doors` are two tools of one domain ending in `search` and `execute`, and an `agent` has `surface.mcp` (MF-4); a `project` with M-3 or M-12 `not-applicable` may give an empty `placement`, an `agent` never (MF-5); an `agent` with M-3 `met` names a health surface (MF-6); M-6 `not-applicable` only with no fork (MF-8); no string shaped like a credential or holding a home folder (MF-7); for `fabric-manifest-tree` (`{manifest, present, rendered}`), every path the manifest names is among `present`, and `rendered` names `fabric-manifest/1` and a heading for each article |
