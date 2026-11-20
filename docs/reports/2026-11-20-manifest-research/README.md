---
report: 2026-11-20-manifest-research
kind: research
project: fabric-agent-contract
date: 2026-11-20
status: active
backlog: CT-353 (the manifest), CT-354 (self-healing)
sources:
  - fabric-agent-contract origin/main 4c978495894ee63429513262bec13bdcbdd7db69
  - fabric-agents-database format/template.md (R33 O1 to O19), read 2026-11-20
  - "the owner's briefs in the CEO window of Fabric, 2026-11-20 and 2026-11-21 (session 53895bdc), quoted below"
---

# The agent manifest and the project manifest: research and a draft for the strategic plan

Research only. This report proposes; it decides nothing. The owner paused every session on 2026-11-21 at 00:30 until
the strategic plan (Fabric session `2d03ce15`) is written: «Исследование манифеста доведи до записи (это вход для
стратега), без релиза контракта и раскатки». So nothing here is in the contract's registers, schemas or gate; the
drafts sit in [`draft/`](draft/), and the AI-native sweep below asked no project for anything yet.

## 1. What was ordered

The owner's words, from the briefs in the CEO window of Fabric (session `53895bdc`), each quoted in part; the whole
texts are the briefs named.

- **2026-11-20, about 23:20** (`2026-11-20-datarooms-graph-of-graphs-tasks-brain-ai-native-manifest-brief.md`, packages
  5 and 6): «Любая функция from day 0 проектируется для агентов, а не для людей. А потом допроектируются интерфейсы для
  людей, те, которые только нужны людям. Или те, которые требуют оператор» ... «Манифест агента, манифест проекта. И там
  бы сразу же какие-то базовые, фундаментальные, неизменные правила, не влияющие на то, какие технологии приходят и
  уходят, про то, что должен быть брейн, про то, что все должно быть строиться изначально, типа интерфейс агентский, а
  потом достраивается для людей» ... «универсальный темплейт, который мы сможем, опять же, выкатывать и в Agent
  Adapter, и у нас везде хранить». The CEO window's order to this session added: organization separation, secrets by
  name, forks of foreign repositories, the owner's decisions; what a machine checks and where; a final AI-native run over
  every agent and project.
- **2026-11-20, about 23:40** (`2026-11-20-reports-artifacts-sharing-brief.md`, package 5): «также для всех наших агентов
  и дашбордов тоже в протоколе самолечение нужно типа прописать ... и потом когда мы вот этот протокол агента проекта
  типа сделаем на все наши агенты проекты раскидать этот правилам и задачи».
- **2026-11-21, about 00:25** (`2026-11-21-agent-template-deployment-update-graph-brief.md`): «каждый агент, типа это MCP,
  что он может быть локальный, может быть облачный ... и может быть локальный оператор, типа какой-то агент, кодер, типа
  гермеса, кодкод» ... «мы агенты должны делиться наработками» ... «протокол обновления агентов ... обновления, должны
  быть графом, приходить, а не просто текстом» ... «агенты изначально под любой сетап, типа, смотрят, какой сетап и
  проектируют решения» ... «самолечения ... на уровне любых агентов ... и продуктовых ... на уровне наших системных
  агентов».
- **2026-11-21, 00:50** (relayed to this session; the strategist got the same): the self-healing protocol starts by
  itself when something stops working (Fabric, a dashboard getting no data from the agent, an MCP door, a service):
  detection, diagnosis, repair, a retry or a rollback, a report; a person is called only at a human gate.

## 2. What exists

| Document | What it says | What it does not say |
|---|---|---|
| A2A Agent Card (A2A `1.0.0`, pinned in [sources](../../evidence/sources.md)) | who an agent is, where it answers, its skills and security schemes, for a peer that discovers it | how the agent was built, or any rule it keeps |
| MCP server card (SEP-2127, a proposal, in [sources](../../evidence/sources.md)) and the MCP registry entry | where an MCP server answers and how to start it | which functions of a product an agent cannot reach |
| `AGENTS.md` ([agents.md](https://agents.md), read 2026-11-20: "a simple, open format for guiding coding agents ... a README for agents") | free Markdown for a coding agent in the repository: commands, style | no schema, no required section, nothing a machine holds a repository to |
| this contract's `fabric-agent.json`, the service descriptor and well-known document ([service](../../specification/service.md)) | an agent's surfaces, capabilities, health and spend, as served | the rules behind them; a project that is not a service has none |
| `fabric.source.json` ([source](../../specification/source.md), DEC-0149) | which files are source and which slots an installation fills | anything about behaviour |
| the contract's decisions the articles stand on | read parity and the design order (DEC-0169), the compact MCP surface (DEC-0180, DEC-0182), agent health (DEC-0179), the knowledge layer (DEC-0188), a relayed approval (DEC-0126), per-account ports (DEC-0154), how an agent pays for models (DEC-0186) | they are per surface; nothing collects them into the few rules every repository keeps |
| the agents base's template format, operator rules R33 O1 to O19 (`format/template.md`) | the rules every template carries (O8 built for agents first, O14 data never crosses a boundary, O15 two doors, O17 a cited search), checked by `tools/check.py` per template | a project outside the base (an app, a site, a contract); the rules are written per template and grow one at a time |

**Finding.** Each existing document is a card or a configuration of one surface as served. None states the few rules
that hold for every agent and every project at once, which a creation step, a template and a reviewer can all check the
same way. The base's R33 is closest, but it lives inside the agents base, binds templates rather than repositories, and
mixes fundamental rules (O8, O14, O15) with operational ones (O9 the Telegram channels, O19 the PM agent's knowledge).

## 3. The proposal

**Two layers.** An **article** is the rule without a technology and changes only by a new revision of the manifest; a
**binding** says how it is met today (MCP two doors, `agent-health/1`, `kb.*`, the vault by slot) and changes by a
contract decision while the article stays. That is how "фундаментальные, неизменные правила, не влияющие на то, какие
технологии приходят и уходят" becomes checkable.

**Two files per repository.** `MANIFEST.md`, the articles as text rendered by the adapter from the contract's templates
([agent](draft/templates/MANIFEST.agent.md), [project](draft/templates/MANIFEST.project.md)); and `fabric.manifest.json`,
the declaration: each article `met` with evidence, `owed` with a backlog row and a date, or `not-applicable` with a
reason where allowed ([draft spec](draft/manifest.md), [schema](draft/schemas/fabric-manifest.schema.json)).

**Twelve articles** ([draft spec](draft/manifest.md#the-articles)):

| Article | From |
|---|---|
| M-1 Agents first (every agent is MCP; local, cloud or both; a coding agent may operate it locally) | 2026-11-20 package 5; 2026-11-21 00:25 |
| M-2 A brain from day one (a memory graph, the sleep pass, logs) | 2026-11-20 package 6 |
| M-3 Heals itself (starts by itself; detect, diagnose, repair, retry or roll back, report; a person only at a human gate) | 2026-11-20 23:40; 2026-11-21 00:25 and 00:50 |
| M-4 Organizations and projects stay apart | the CEO window's order |
| M-5 Secrets by name | the CEO window's order |
| M-6 Foreign code through a fork | the CEO window's order |
| M-7 The owner's decisions bind | the CEO window's order |
| M-8 Nothing that works is broken | the base's R28, the contract's versioning |
| M-9 Every claim carries its proof | the contract's `degraded`, HL-2 |
| M-10 Shares what it learns | 2026-11-21 00:25 |
| M-11 Updates arrive as a graph | 2026-11-21 00:25 |
| M-12 Fits any setup | 2026-11-21 00:25 |

**Self-healing as protocol** ([draft](draft/self-healing.md)): `agent-health/1` already detects; the draft adds the loop
(HEAL-0 starts by itself, HEAL-1a diagnose, HEAL-2 repair or roll back with at most three attempts, HEAL-3 never across
the money, deletion or publication floor, HEAL-4 escalate once and call a person only at a human gate, HEAL-5 find
another way and remember, HEAL-6 a report keeps its last good data, HEAL-7 report every attempt) and one record,
`heal-attempt/1` ([schema](draft/schemas/heal-attempt.schema.json)).

**What a machine checks, and where.**

| Where | Check | Owner |
|---|---|---|
| the contract | `pnpm validate --kind fabric-manifest <folder>` (proposed): schema, `FAC-SEM-187` (statuses honest, two doors of one domain, every agent MCP with a placement, a health surface where M-3 is met, no secret value or home folder, forks pinned), every named path present, the rendered text holding all twelve headings; `FAC-SEM-188` on `heal-attempt/1` | fabric-agent-contract |
| the Fabric Agent Adapter (session `6a78ed83`) | renders both files into every agent it creates or adapts, each article `owed` until shown; its probe runs the folder check and the two-door check on the served `tools/list` | fabric-agent-adapter |
| the agents base (session `4deaa22b`) | every template carries the manifest and passes the folder check in `tools/check.py`; R33 points at the articles; its update policy and rollout ledger serve M-11 | fabric-agents-database |
| Fabric | creating an agent or a project writes the files and runs the folder check before the first commit; a project's page shows its articles | Fabric |

The draft rule [`draft/src/manifest-rules.ts`](draft/src/manifest-rules.ts) was run once on the draft spec's example
(valid, no finding) and on a broken copy (four findings: M-1 not-applicable for an agent, doors of two domains, an empty
placement, a value shaped like a key), and the folder form on the agent template (all twelve headings found). That run
is a smoke test from this session, not a test in the gate.

## 4. How it meets the requests already on this contract's board

| Request | Relation |
|---|---|
| `4e931220` (passioncode-platform: `insight/1`, `insights.share`) | the binding of M-10 |
| `7041380c` (agents base: `execution` mode, `harness.funding`, session class) | part of the binding of M-12 |
| `b5162cd8` (adapter: `work-milestone/1`; DEC-0180/0182 and Fabric's own 51-tool MCP) | M-1's two doors apply to Fabric's MCP too, or Fabric records an exception: a decision the plan should take |
| `41d6e251` (Fabric: the contract as one package) | how the templates and the folder check reach every repository (render from a package, not a copy) |

## 5. Open questions for the strategic plan

1. **Where the articles live.** In the contract (proposed: the contract is the one thing every agent of any host speaks)
   or in the agents base (where R33 is). The proposal: articles and the check in the contract; the base's R33 keeps the
   operational rules and points at the articles.
2. **Twelve articles or fewer.** M-8 and M-9 are practices more than architecture; they could stay in the base's rules.
   M-10 to M-12 come from the latest addendum and have no binding the contract has decided yet (M-10 waits on
   `4e931220`, M-11 on an update graph not designed, M-12 on `7041380c`).
3. **The update graph (M-11).** A new protocol (an update as nodes and links: what changed, what depends on it, what is
   switched off), served from PassionCode's server to every client, read by each machine's coordinating agent, which
   sends verifiers. The agents base holds the update policy for our own and clients' projects; the contract would hold
   the wire form. Not drafted here.
4. **The self-healing limits.** Whether three attempts and their spacing are the contract's or each product's, and how
   far HEAL-5's "another way" may go before it is a change to code under M-8.
5. **Language of the rendered text.** The templates are English (the contract's language); the owner reads Russian.
   A Russian rendering beside the English one, or Russian only for the owner's own projects.
6. **`owed` dates.** Whether every existing repository starts with every unmet article `owed` at one date chosen by the
   plan's priorities, so the first manifest of each repository is honest on day one.

## 6. The AI-native sweep

See [`sweep.md`](sweep.md): a read-only scan of the Git repositories under the operator's workspace for the rules of
M-1 (an agent surface, two doors, an inventory), M-3 (`agent-health/1`) and M-2 (a brain). Per the pause, no board
request was sent to any project; the plan decides the order.

## 7. Reserved ids

Reserved by git CAS on `origin` for this work and not yet written in the registers: DEC-0190 (the manifest, key
`ceo-20261120-manifest`), DEC-0191 (self-healing, key `ceo-20261120-self-heal`), `FAC-SEM-187` and `FAC-SEM-188`
(keys with the suffix `-sem`). A later run reserving with the same keys gets the same ids.
