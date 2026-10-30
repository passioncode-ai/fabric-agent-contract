---
report: 2026-10-27-agent-portability
kind: research
project: fabric-agent-contract
date: 2026-10-27
status: draft
backlog: CT-194 (docs/backlog.md:201), roadmap track RM-36
sources:
  - fabric-agent-contract origin/main 2b3a00a4f51f32a6d0ec486cc283c04b10a42128
  - fabric-agent-adapter origin/main 1708e99df0775dc359b4ffcc55dae70c3ed59890
  - fabric origin/main 296076947f26ec67caaf4533dc472b718b352a92
  - "Fabric's relay of the operator's words (board, 2026-10-27; as summarised in CT-194)"
  - "a personal agent's request (board, 2026-10-27; as summarised in CT-194)"
---

# Agents portable from the start: an agent's source kept apart from its instance

Phase 1 of CT-194: research only. This report proposes options for a decision; it decides nothing.

**Citation convention.** A bare path is in the contract at the commit above. `adapter:` is the Fabric Agent Adapter at
its commit, and `skills/` there stands for `plugins/fabric-agent-adapter/skills/`. `fabric:` is Fabric at its commit.
The two board requests could not be read directly; this report uses their summaries in CT-194
(`docs/backlog.md:201`) and in the task that ordered it.

## 1. The question and its two sources

**The question.** How does an agent stay transferable from its first commit? Its **source** (code, skills, prompts,
schemas, tests, shared docs) must stay apart from its **instance** (one owner's records, logs, keys, names of people and
clients, private paths, configuration). Transfer happens only as source and only when the owner decides that act.

**Fabric's relay of the operator's words** (2026-10-27) asks for:

- agents built portable from the first day; transfer only when wanted; an agent can be handed over as source code;
- a split of the work: the contract defines the source/instance boundary, a source manifest that declares the
  instance's slots (key names, data stores, config keys, identity), export and import as an explicit act, and
  conformance checks;
- the adapter's templates (`creating-fabric-agents`, `adapting-projects-to-fabric`) lay agents out that way, ship a
  check that fails when instance data leaks into the source, and an export command that packs locally and publishes
  nothing;
- Fabric adds a "give as source" button later.

**A personal agent's request** asks for six things:

1. two layers, engine and installation, with a machine-readable manifest of `include`/`exclude` engine paths;
2. a list of installation strings (accounts, people, owner, private projects) that never travels;
3. transfer only as source and only by the owner's decision for each transfer: the committed tree, manifest paths
   only, one new commit by a neutral author, no history; the tool never creates the recipient's repository and never
   pushes, because that is a human act of class publication;
4. a blocking pre-transfer check: an installation string, a secret shape or a home path blocks; an e-mail outside an
   allow-list and a link to a non-portable file warn; the check never repeats the value it found;
5. cleanup only at the source; patches come back only by manifest paths;
6. the owner's infrastructure is pluggable: without it the agent starts and answers `degraded`, and keys come from the
   environment.

It proposes a `portability` field in the descriptor or a manifest. Its first scan of one agent reports 956 engine files
and 885 blocking findings in 172 files. Values were hardcoded in code (a launchd label, a repository URL, a wiki path,
an owner label) and fixtures held personal ids. These numbers are the request's; this report did not rerun the scan.

## 2. What the contract already has

The contract already separates source from instance in several places. It does so per surface, never as one named
boundary.

| Surface | What it already keeps apart | Evidence |
|---|---|---|
| Provider manifest `fabric-agent.json` | Describes the provider and its capabilities only: identity, revision, capabilities, cost presets. No path, key or data member. The top level is closed, so a new member needs a schema change | `schemas/manifest.schema.json:6` (required), `:268` (`additionalProperties: false`) |
| Provider manifest, author and identity | `provider.createdBy` is "a URI naming who or what wrote this revision", inside the source; `provider.identity.subject` is a URI | `schemas/manifest.schema.json:47-50`, `:62-88` |
| Provider manifest, service extension | The manifest names the descriptor it belongs to by `<id>.<instance>`, an instance key inside a source file | `schemas/manifest.schema.json:108-121` |
| Provider entry `fabric-provider/0.1` | Written by the installer, outside the repository, with `installedAt` and `installedBy`; `env` values are `secret-ref:` references, never values | `docs/specification/provider.md:21-22`, `:34`, `:36-37`, `:51-54` |
| Service descriptor | "the descriptor describes an installation, not a run"; the installer writes it, one per instance; `id` is "the same on every machine", `instance` says which copy | `docs/specification/service.md:83-84`, `:97-99` |
| Service lifecycle, state | Data, configuration, logs and cache live in the service's own directories, "never inside the service's own code checkout"; `source.repository` tells code apart from a store that versions data | `docs/specification/service.md:687`, `schemas/service-descriptor.schema.json:491-497` |
| Service directories | Data, logs and cache are derived per system from the service `id` | `docs/specification/service.md:701-703` |
| Settings backup | Kept outside the data directory; holds no secret value, a secret only by its slot name | `docs/specification/service.md:755-757`, `:772`, `:820-822` |
| Well-known `degraded` | Always present; an entry with `setup: true` is "a key not entered, a model not chosen", not an outage | `docs/specification/service.md:198`, `:216-223` |
| Well-known `configuration` | Names what the operator can configure, but only the `runner` and `model` slots | `docs/specification/service.md:246-248`, `docs/specification/runners.md:380-385` |
| Connections | Declares what an agent uses (`service`, `model`, `connector`, `store`, `channel`); a `degraded[].source` equal to a connection's `id` is that connection failing | `docs/specification/connections.md:27-28` |
| Package `fabric-package/1` | One version of an agent as one folder. The service template carries `id`, `name`, entry and runtime; "the installing machine adds" origin, port, token file, supervisor, paths and install facts | `docs/specification/package.md:8-11`, `:112-115` |
| Package, secrets | `secrets[]` names slots (name, purpose, optional) and holds no value; FAC-SEM-065 refuses a credential-shaped name or purpose | `docs/specification/package.md:119-123`, `:239` |
| Package, required servers | A consumer agent names MCP servers by role; "The address and the token are never in the package; they come with the placement" | `docs/specification/package.md:91-96` |
| Package, state | `state[]` lists what moves with a placement; "A copy for a colleague is packed without state" | `docs/specification/package.md:140-143` |
| Package, folder check | `checkPackageFolder`: a file present and not listed is `file-unlisted` | `docs/specification/package.md:165-176`, `src/package-rules.ts:164` |
| Package, privacy | The package has no field that names, identifies or measures a person | `docs/specification/package.md:243-247` |
| Credentials | Requests, decisions and the ledger name a credential by `slot`, `provider` and `preset`, "never its value" | `docs/specification/credentials.md:52-56`, `:68-71` |
| Estate record | Secret placements are "by reference only" (`{agentRef, slot, from, context?}`) | `docs/specification/estate-record.md:116-118` |
| Contexts | One instance per (machine, `agentRef`, context), each with its own slots | `docs/specification/contexts.md:68-79` |
| Execution context | DEC-0013: contexts carry allowlisted environment keys and secret references, never secrets | `docs/DECISIONS.md:114-120`, `docs/specification/execution-context.md:9-12` |
| Session handoff | The handoff folder is the host's material, "never in a repository"; a secret lives in `mcp.json` only | `docs/specification/session-handoff.md:33-36`, `:183-185` |
| Data classes | `personal` (e-mail, user id) and `credential` (reference only) are classes | `docs/specification/governance-and-roles.md:44-52` |
| Effects | `publish` is an effect class; default authorization is `draft-only` | `schemas/common.schema.json:95-107`, `docs/specification/governance-and-roles.md:18-19` |
| Private agents | A proposal carries `private` "about an agent the operator marks private: never exported or submitted"; FAC-SEM-103 holds it | `schemas/fabric-proposal.schema.json:176-178`, `docs/specification/proposals.md:38-41`, `:79` |
| Shared detectors | Credential shapes (`looksLikeCredential`, the kit's one detector); home paths including the dash form (DEC-0105); an e-mail pattern | `src/registry-rules.ts:61`, `src/secret-shape.ts:1-7`, `src/activity-rules.ts:62-68`, `src/node-summary.ts:88` |
| Finding without the value | The home-path walker records `{path, kind, key}`, not the string it matched | `src/activity-rules.ts:90` |
| This repository's own privacy gate | A private denylist that exists only on the operator's machine; the gate skips without it and fails when it exists and no script is found | `src/privacy-plan.ts:5-11`, `src/privacy-check.ts:17-23` |

**In short.** The instance side (descriptor, provider entry, data directories, vault slots, estate placements, handoff
folders) is already well specified and kept outside repositories. The source side is described only at pack time
(`fabric-package/1`), and only as "every file of the folder". Nothing says which files of a repository are source,
nothing scans their content for instance values, and nothing defines transfer.

## 3. What the adapter's templates do today

| Where | Mixed or separated | Evidence |
|---|---|---|
| New agent grill: "where does it run, for whom" | Separated: one instance per context, its secrets, spend and journal never crossing; record what capabilities answer when the person's machine is off | `adapter: skills/creating-fabric-agents/SKILL.md:59` |
| New agent, credentials | Separated: every credential read by name; the README lists key names; no `.env`, no key file beside data, no value in argv, code, configuration or a commit | `adapter: skills/creating-fabric-agents/SKILL.md:115-123` |
| Adapting an existing agent | Separated for secrets only: "Never request or copy secret values into the bundle" | `adapter: skills/adapting-projects-to-fabric/SKILL.md:51` |
| Contexts reference | Separated: personal and organization instances have two state folders, two journals, two sets of secrets; contexts never linked | `adapter: skills/creating-fabric-agents/references/where-agents-run.md:41-51` |
| Selling | Separated: what is sold is one signed `fabric-package/1` per version with no secret in it | `adapter: skills/creating-fabric-agents/references/where-agents-run.md:103-104` |
| Path kit | Separated: data, logs and cache are computed at run time from the service id and the OS | `adapter: skills/building-fabric-services/scripts/fabric-paths.mjs:21-39` |
| Degraded setup state | Separated: the kits pass `setup: true` entries through unchanged | `adapter: skills/building-fabric-services/references/protocol.md:93-95` |
| Operator channel | Separated: the bot token goes into the secret store under the name the agent reads, "never into a chat, a file or the bundle" | `adapter: skills/creating-fabric-agents/references/operator-channel-and-repository.md:15-18` |
| `pack` | Partly separated: it refuses `.git`, caches and files that are credentials by name (`.env`, `*.pem`, `*.key`, ...). It lists every other file; it does not read file contents for instance strings, home paths or e-mails | `adapter: skills/building-fabric-services/references/package.md:45-47`, `:53-57` |
| `publish --to org` | Not built; publishing to an organization is "the person's own act" (FAA-28) | `adapter: skills/building-fabric-services/references/package.md:129-130` |
| Lifecycle rule LC-09 | **Mixed:** the service's `AGENTS.md`, a source file, "names every resident process, its supervisor label, unit or task and its port" | `adapter: skills/building-fabric-services/references/lifecycle.md:63` |
| launchd label | **Mixed by default:** the label is "reverse-DNS, stable", with a fixed example; nothing says it is derived at install from an owner slot | `adapter: skills/building-fabric-services/references/lifecycle.md:75` |
| Scaffolder | **Mixed:** writes `provider.createdBy` (the author's URI) and `identity.subject` into the source manifest | `adapter: skills/adapting-projects-to-fabric/scripts/adapt_project.py:281-287`, `:309-319` |

Not found in the adapter at its commit: a source manifest, an `include`/`exclude` list, a list of installation
strings, a content scan before pack, an export or import command, a neutral-author rule. Searched with
`git grep -i -E "portab|scrub|denylist|neutral|instance data|as source|colleague" origin/main -- plugins/` (six files:
the dashboard-link "portable output gate", a layout checker's `scrub` of login codes, a theme file and the host-hook
tests' "neutral fixtures"; none is about source and instance).

Prior art in Fabric: its estate archive lists what never travels beside the restore, because "Authority does not travel"
(`fabric: apps/desktop/src/shared/archive.ts:17-22`, the `EXCLUDED` table at `:103`). Not found in Fabric: a "give as
source" feature (searched `git grep -i -E "give as source|as source code|fabric-package/1" origin/main`).

## 4. Gaps

1. **No declared boundary.** No document says which paths of a repository are source. A package lists every file of
   its folder (`docs/specification/package.md:60`), so the folder's author decides by hand what is in it.
2. **No content check.** FAC-SEM-065 reads slot names, purposes and the entry only (`docs/specification/package.md:239`).
   No rule scans the files of a package or a tree for installation strings, home paths, credential shapes or e-mails,
   although the detectors exist (`src/activity-rules.ts:62-68`, `src/registry-rules.ts:61`, `src/node-summary.ts:88`).
3. **No list of installation strings and no place for it.** The only comparable list in the estate is this repository's
   own privacy denylist, which is the operator's, not an agent's (`src/privacy-plan.ts:5-11`).
4. **Slots cover keys, not the rest of an instance.** Secrets are slots (`package.md:119`); stores are `state[]`
   relative to the data folder (`package.md:142`); configurable values are only `runner` and `model`
   (`service.md:246`). There is no slot kind for a config key, an owner identity, a repository or wiki of the owner, or
   the owner's infrastructure endpoint other than an MCP role (`package.md:91-96`).
5. **No export or import act.** Nothing defines export (which tree, which commit, which author, history or not, output
   form), its gate, its receipt, or how patches come back.
6. **Author identity travels.** `provider.createdBy` and `identity.subject` sit in the source manifest
   (`schemas/manifest.schema.json:47-50`, `:62-88`); the manifest also names an `<id>.<instance>` key (`:108-121`).
7. **Private agents cannot be transferred at all under today's only rule.** `private` exists on proposals only, and
   FAC-SEM-103 forbids its export outright (`docs/specification/proposals.md:41`). There is no mark on the agent itself
   and no per-act exception for the owner.
8. **Starting without the instance is not a rule.** A setup state exists (`service.md:218-223`), but nothing requires
   a source to start with an empty data directory and no owner infrastructure, and no vector tests it.
9. **The adapter writes instance values into source** (LC-09 in `AGENTS.md`, a fixed launchd label, `createdBy`), as
   listed in section 3.
10. **Fixtures.** No rule keeps personal ids out of an agent's test fixtures; the request found them there.
11. **Conformance does not cover a tree.** `pnpm validate` reads documents and folders by schema and semantic kind
    (`src/validate-cli.ts:1-11`); no kind reads a source tree.

## 5. A proposed shape for a decision (options, not a decision)

### 5.1 Where the boundary is declared

| Option | For | Against |
|---|---|---|
| **A. A new member of `fabric-agent.json`** (`portability`) | One file every serving agent has; readers already load it | The top level is closed (`manifest.schema.json:268`), so every reader re-pins; a consumer agent has no provider manifest (DEC-0071, `package.md:88-91`); the manifest describes capabilities, not files; its `contentHash` would change with every path edit |
| **A'. The same under the manifest's `extensions`** (a URI key) | Additive: readers preserve and ignore unknown extensions; no re-pin | Still absent for consumer agents and skill sets; extensions are checked less strictly |
| **B. A separate source manifest** (for example `fabric.source.json` at the repository root) | Works for every kind (serving agent, consumer agent, skill set); read before `pack`; reuses the package's `$defs/path` grammar (`package.md:65-68`); one owner per file | One more file to keep in step with `fabric.package.json` (`secrets[]`, `requires`, `state[]`) |
| **C. Members of `fabric-package/1`** | The package already has `secrets[]`, `requires`, `state[]` | The package is written per version by `pack` at the end; `include`/`exclude` must be known before `files[]` is listed; a repository that is never packed has no package |
| **D. The descriptor** | Hosts already read it | Wrong side: it "describes an installation" and is written by the installer (`service.md:97-99`); it never travels, so it cannot carry the source's boundary |

A possible combination: B is the author's file; `pack` derives the package's `secrets[]` and `state[]` from it and
refuses a difference. D is excluded by the contract's own text.

### 5.2 Slot kinds

Each slot has a `name` (the package's slot grammar, `package.md:119`), a plain-words `purpose`, `optional`, and what
the agent answers when it is empty (the `degraded` source id, 5.8). No slot holds a value.

| Kind | What it names | Reuses |
|---|---|---|
| `secret` | a key read by name from the environment or the vault | `fabric-package/1` `secrets[]`, DEC-0013 |
| `store` | a data store relative to the data directory (database, journal, a Git repository that versions data) | `state[]`; `service.md:687` (a store is not code) |
| `config` | a non-secret setting (a repository URL, a wiki folder, a launchd label, a schedule) | new; today only `runner` and `model` (`service.md:246`) |
| `identity` | the owner label, operator channel binding, the publisher and author names | new; `createdBy` and `identity.subject` today sit in the source |
| `endpoint` | the owner's infrastructure by role (a knowledge base, an analytics service, a board) | `requires.mcp[]` roles (`package.md:91-96`) and `connections` kinds (`connections.md:28`) |

Trade-off: five kinds are explicit and checkable, but each is one more rule. A smaller start is `secret`, `config` and
`endpoint`, with `store` folded into `state[]` and `identity` as `config` slots with a flag.

### 5.3 `include` and `exclude`

- **Default deny** (only `include` paths are source; `exclude` carves holes) makes a forgotten file stay home. A new
  file the author forgot to include is missing from the export, which a test in the exported tree catches.
- **Default allow** (everything but `exclude`) is easier to adopt but lets a new file leak.
- Paths follow the package grammar: relative, forward slashes, no `.` or `..` (`package.md:65-68`). Globs need one
  pinned grammar and vectors; literal prefixes are simpler and enough for directories.
- Always excluded whatever the list says: `.git`, the files `pack` already refuses (`adapter: .../package.md:45-47`).

### 5.4 The list of installation strings

- **What:** the owner's own strings (accounts, people, the owner's label, private projects, hosts, chat ids). The
  values of `config` and `identity` slots are installation strings by construction.
- **Where it can live:** (a) in the instance's own configuration directory beside its data; (b) in the owner's vault
  under a slot of the agent; (c) derived at check time from the instance's slot values plus an owner-kept extra list.
  It never lives in the source, for the same reason the contract's privacy denylist lives only on the operator's
  machine (`src/privacy-plan.ts:5-11`): a list of private strings is itself private.
- **Why it never travels:** carrying it would publish exactly what the check exists to keep home.
- **Option: keyed digests** instead of plain strings, as the estate compares credentials without moving them
  (`docs/specification/credentials.md:168-174`). For: the list could be stored anywhere. Against: substring and
  encoded-form matching needs tokenization rules and vectors; plain strings on the owner's machine are simpler.

### 5.5 Export and import as acts

- **Export input:** a committed tree at a named commit, never the working copy; only `include` paths.
- **Export output options:** (a) a directory with a fresh Git repository holding one commit by a neutral author and no
  history; (b) a `fabric-package/1` folder, unsigned, for the recipient to sign as its own publisher; (c) both.
  `agentRef` changes with the publisher (`package.md:104-107`), so a recipient's copy is another agent, which is the
  intended effect.
- **The neutral author** also needs a neutral `provider.createdBy` and possibly a new `provider.id`; rewriting them
  changes the manifest's `contentHash`. Which fields export rewrites is a decision.
- **Gate:** export packs locally and publishes nothing. Handing the result to anyone (creating a repository, pushing,
  sending a file) is effect class `publish` (`schemas/common.schema.json:99`), `draft-only` by default
  (`governance-and-roles.md:18-19`), and stays a person's act, like `publish --to org` (`adapter: .../package.md:129-130`).
  Fabric's later button is that act's twin under DEC-0121.
- **Receipt:** the export records, in the instance, the source commit, the manifest's hash, the check's result
  counts and the output's digest. It never records the findings' values.
- **Import (patches back):** a patch applies only to `include` paths and only to the source; a patch touching another
  path is refused whole. Cleanup happens at the source and is then re-exported, never in the exported copy.

### 5.6 The checks

| Check | Result | Notes |
|---|---|---|
| an installation string, also case-folded, URL-encoded and dash-encoded (the forms DEC-0105 lists for home paths) | blocks | needs the private list (5.4), so it runs on the owner's machine |
| a credential shape | blocks | the shared detector (`src/secret-shape.ts:1-7`, `src/registry-rules.ts:61`) |
| a home path | blocks | `hasHomePath` (`src/activity-rules.ts:62-68`) |
| a file outside `include`, or a credential file by name | blocks | `pack`'s list today (`adapter: .../package.md:45-47`) |
| an e-mail address outside an allow-list | warns | the pattern of `src/node-summary.ts:88`; allow-list in the source manifest (public addresses such as a support address) |
| a relative link to a file outside `include` | warns | Markdown and code imports |
| a binary file | warns or blocks | content cannot be scanned reliably; a decision |

Every finding names the file, line, column, kind and, for a list match, the slot or list entry's index, never the
matched text, as the home-path walker already does (`src/activity-rules.ts:90`). The same check runs as a pre-commit
hook in the source, so leaks are caught when written, not at export.

### 5.7 What conformance and `pnpm validate` would check

- **Schema:** the source manifest (or member): closed shape, slot names in the package grammar, paths in `$defs/path`.
- **Semantic rules (new FAC-SEM codes, numbers reserved with the DEC):** each slot named once; no slot name or purpose
  shaped like a credential (as FAC-SEM-065); `include` and `exclude` well formed and not identical; the package's
  `secrets[]` and `state[]` equal to the source's `secret` and `store` slots; no `config` or `identity` slot value in
  the source manifest.
- **A tree kind** for `pnpm validate <dir> --kind source-tree`: no file outside `include`, no credential shape, no home
  path, e-mail warnings. Public conformance cannot run the installation-string check, because the list is private; the
  contract ships the reference function with the list as an input, and vectors built from neutral fake strings.
- **A start vector:** a service started on an empty data directory with no slots filled answers its well-known
  document with `status: degraded` and one `setup: true` entry per missing required slot, never a crash.

### 5.8 `degraded` when the owner's infrastructure is absent

The pieces exist: a setup state (`service.md:218-223`), connections whose id is a `degraded[].source`
(`connections.md:27`), keys read from the environment (DEC-0013; `adapter: skills/creating-fabric-agents/SKILL.md:115-123`).
The proposal would bind them: each slot names the `degraded` source it raises; a missing `secret`, `config` or
`identity` slot is a setup state (`setup: true`); a missing `endpoint` is a connection in state `down` or `unknown`;
the capabilities that need it answer a typed refusal, and the rest keep working. A non-service agent (a provider entry)
has no well-known document, so for it the same facts would go in its first answer or a doctor command.

### 5.9 The privacy rule for personal agents

CT-194 records that personal agents stay private: "no transfer, visibility change or publication without that word"
(`docs/backlog.md:201`). The contract's only private mark is on proposals, and FAC-SEM-103 forbids their export outright
(`docs/specification/proposals.md:41`, `:79`).

| Option | For | Against |
|---|---|---|
| **P1. A private agent is never exported** | Simplest; matches FAC-SEM-103 | Contradicts the operator's ask that an agent can be handed over as source |
| **P2. Private by default; export allowed only on the owner's word for that one act**, naming the agent, the source commit and the export's purpose; the receipt cites the words | Matches both requests | The contract must define what counts as that word; DEC-0126 makes one approval bind all the operator's agents, so the approval's scope must be this act, not a standing grant |
| **P3. Export always allowed locally; only the handing over is gated** | Export publishes nothing, so it is safe | A local export of a private agent still copies its mechanics somewhere the owner did not choose |

In every option the export's check and gate are the same; the options differ only in whether a private agent may be
exported at all and on whose word.

## 6. Open questions for the owner

1. Where is the boundary declared: A (manifest member), A' (manifest extension), B (separate source manifest) or C
   (package)?
2. Is `include` default deny, as the personal agent's request implies, or default allow?
3. Where does the list of installation strings live, and may it be stored as keyed digests?
4. What does export produce: a one-commit repository, a package folder, or both?
5. Which identity fields does export rewrite (`createdBy`, `provider.id`, publisher), and who is the neutral author?
6. Does the recipient's copy keep any link to the original (a provenance note), or none?
7. Which licence does an exported personal agent carry, when it has none of the organization's?
8. For a personal agent: P1, P2 or P3? If P2, what must the owner's word name?
9. Must the exported tree pass its own tests before the export is accepted, which forces fixtures to be neutral?
10. Is portability required of every agent at its next contract re-pin, or opt-in through a `portability` field first?
11. Do skill sets and consumer agents fall under the same rule as serving agents?
12. How are binary files treated: excluded, listed with a warning, or blocked?

## 7. Next steps

**After this report:** post the options to both threads for objections, then reserve a DEC (the row's plan,
`docs/backlog.md:201`).

**In the contract, once decided:**

- schema: `schemas/fabric-source.schema.json` (option B) or a manifest member or extension;
- spec: a new page `docs/specification/source.md` with the boundary, slots, lists, checks, export and import; rows in
  `docs/specification/README.md` and `docs/DOCMAP.md`; terms in `CONTEXT.md` (source, instance, slot, installation
  string, export);
- `package.md`: tie `secrets[]` and `state[]` to the source's slots; `service.md`: a slot's `degraded` source;
  `proposals.md`: the private mark and the per-act exception, if P2;
- rule codes: new FAC-SEM codes after `FAC-SEM-154`, reserved with the DEC, in `src/rule-codes.ts`;
- reference module `src/source-rules.ts` reusing `hasHomePath`, `looksLikeCredential` and the e-mail pattern, never
  returning a matched value;
- fixtures: positive and negative source manifests; vectors `fixtures/vectors/source-tree.json` with neutral fake
  installation strings and every encoded form; a start-without-instance vector;
- `pnpm validate --kind source-tree`; reader rows in `docs/specification/conformance.md`.

**In the adapter:**

- `creating-fabric-agents`: a grill row (what is instance, which slots), a layout that keeps instance paths out of the
  repository from the first commit;
- `adapting-projects-to-fabric`: a retrofit step that scans, lists findings by kind, moves values into slots;
- `building-fabric-services`: change LC-09 so `AGENTS.md` names labels by slot or derivation, not by value; derive the
  launchd label at install from a slot;
- kit commands (Python and Node twins): `portability check`, `export` (local, publishes nothing, writes a receipt),
  `import` (patches by `include` paths only); `pack` reads the source manifest; tests with neutral fixtures.

**In Fabric:** a "give as source" action whose agent twin is the adapter's `export` (DEC-0121), gated as a `publish`
act for the handing over, and the per-act owner's word for a private agent; it never creates the recipient's
repository and never pushes.
