# Working in fabric-agent-contract

## Read first

1. The organization's
   [roadmap](https://github.com/passioncode-ai/fabric-workspace/blob/main/knowledge/roadmap.md):
   every major feature and release across PassionCode.ai as `RM-*` tracks with owner, phase and
   state. It is the entry point: a task here that serves a track names it, and the track's status
   is edited only in the roadmap.
1a. **The course check, before every change** ([rules §0](https://github.com/passioncode-ai/fabric-workspace/blob/main/knowledge/rules.md#0-the-course-check-the-plan-and-the-north-star-before-every-change)):
   the [North Star](https://github.com/passioncode-ai/fabric-workspace/blob/main/knowledge/north-star.md) metric and
   gaps, and the [one plan in waves](https://github.com/passioncode-ai/fabric-workspace/blob/main/docs/plans/2026-11-11-unified/README.md).
   Name the track, plan row or gap the change serves; work that serves none goes to the board first.
1b. **The North Star sections this repository serves** ([merged with the North Star](https://github.com/passioncode-ai/fabric-workspace/blob/main/knowledge/north-star.md#merged-with-the-north-star-validated-by-the-architect-operator-2026-11-13),
   G31): §3 (roles and access: the levels), §5 (agents: the one contract every agent speaks), §6 (how agents exchange
   work: `fabric-service/0.1`, the board protocol, the estate's `ceo` slot), §11 (security and isolation: per-account
   ports, DEC-0154), and in §14 the gaps G1 (CT-259), G2 (CT-250), G10 (CT-252), G12 (CT-251), G19 (CT-285, the
   autonomy profile per place), G22 (CT-232) and G27 (CT-260). When a DEC, a release or a backlog row changes this
   repository's state against one of them, write fabric-workspace a board message naming the section and the evidence
   in the same run. This repository is a contract, not an agent: the architect's per-release audit (G30) reads agents
   and uses this repository's conformance checker, so it has no audit of its own.
2. The PassionCode.ai knowledge base, `fabric-workspace/knowledge/` in your clone (org-index
   `scripts/clone_all.sh` makes it) or https://wiki.passioncode.ai/knowledge: at least its
   [README](https://github.com/passioncode-ai/fabric-workspace/blob/main/knowledge/README.md),
   vision, principles and how-to-work.
3. This file, then the organization's
   [CONTRIBUTING.md](https://github.com/passioncode-ai/.github/blob/main/CONTRIBUTING.md).

## What this repository is

Fabric Agent Contract: what makes any agent Fabric-compatible (schemas, profiles and the
conformance checker every provider is admitted by). It stands on its own; any host can implement it.

## Commands

| What | Command |
|---|---|
| Install | `pnpm install --frozen-lockfile` |
| Test (the gate) | `pnpm run check`: the merge gate, run by the merging session with its output in the PR; hosted CI is the nightly batch on Linux, Windows and macOS (org-index `docs/CI-BATCHING.md`, DEC-0145), or `gh workflow run ci.yml --ref <branch>` once for an urgent branch |
| Privacy check | `pnpm privacy:check` (part of the gate): runs org-index's `check_private.py` where the operator's denylist exists: from `ORG_INDEX`, this checkout's sibling, or, from a linked worktree, the main checkout's sibling; with the denylist present and no script found it fails rather than skips (`src/privacy-plan.ts`, CT-40); without `python3` on PATH it fails and says so (CT-191) |
| Consumer pin | `pnpm pin:check <consumer checkout>` |
| Check one document or folder | `pnpm validate <file or folder> [--schema <name>] [--kind <kind>] [--json]`: schema and semantic rules, one line per problem; exit 0 when there is no blocking problem (accepted lines may print), 1 a problem, 2 a usage error (`src/validate-cli.ts`); `pnpm --silent validate <folder> --kind source-tree` checks an agent's source under its `fabric.source.json`, without the operator's list of installation strings (DEC-0149); `--silent` keeps pnpm from echoing the command line, the folder included |
| MCP (register + proving call) | none: the contract serves no MCP tools; README "Quick start → MCP" |

Every script in `package.json`, with what it needs beyond Node 22.13+ and the installed dependencies:

| Script | What it does | Needs |
|---|---|---|
| `pnpm typecheck` | `tsc --noEmit` over `src/`, `test/` and `tools/` | |
| `pnpm test` | every test with branch coverage and its per-file floors (`vitest.config.ts`) | `git` (the gate's file list) |
| `pnpm test:fast` | the same tests without coverage | `git` |
| `pnpm ux:lint` | the UX contract's integrity check (`docs/ux/lint.py`) | `python3` |
| `pnpm docs:check` | links, Mermaid, decision paths, rule codes, then `pnpm lint:md` | |
| `pnpm lint:md` | markdownlint over the tracked Markdown; the log carries the count, the errors and the summary | |
| `pnpm pin:check <checkout>` | a consumer's pin of this contract | `git` |
| `pnpm vectors:check` | every generator in `tools/vectors/` against its committed vector file (`tools/vectors/run.ts`) | |
| `pnpm vectors:write` | writes every vector file from its generator; one generator alone: `tsx tools/vectors/<name>.ts --write` | |
| `pnpm privacy:check` | the operator's private-name denylist, where it exists | `python3` |
| `pnpm validate` | checks an author's own document or folder: the schema, the semantic rules and the pairs, one line per problem; `--kind source-tree` on a folder checks an agent's source | |
| `pnpm check` | the gate: typecheck, test, ux:lint, docs:check, privacy:check | `python3`, `git` |

The fast loop while editing: `pnpm test:fast`, or one file with `pnpm vitest run test/<file>.test.ts`; then the gate.

## Local rules

Then read `CONTEXT.md`, `docs/DOCMAP.md`, `docs/DECISIONS.md`, and the generated
[`docs/AGENT_SYNC.md`](docs/AGENT_SYNC.md) snapshot before changing the
contract. The contract repository owns the normative agent/provider semantics;
consumer repositories describe their integration and link here.

Decisions and open questions are append-only registers. Multi-agent work uses a
branch per run, a live coordination lease, and reserved IDs before shared
registers are edited. Coordination is configured in `.claude/agent-sync.json`:
leases and `DEC` reservations are refs on `origin` (`leaseBackend: "git"`), so
they exclude across machines. The configured record plane is Notion, but the
token line is empty even on the operator's machine (`agent_sync.py check`, 2026-09-28:
"AGENT_SYNC_NOTION_TOKEN is empty — runs will degrade to `fs`"), so runs are
recorded locally and the generated snapshot says `record plane: fs`. Run
`agent_sync.py status` before a session and report the guarantee it prints,
never a stronger one. `DEC` ids are allocated by compare-and-swap on
`refs/agent-sync/ids/` at `origin` whatever the record plane; `check` says so since
agent-sync 1.21.1 (1.21.0 reported "backend 'fs' cannot reserve ids" here, wrongly).

Every normative claim must resolve to a schema, a test, a decision ID, or a
version-pinned external specification. Protocol revisions are recorded explicitly.

The licence is the organization's (Fabric ADR-0092): `AGPL-3.0-only OR
LicenseRef-PassionCode-Commercial` in `package.json`; `LICENSE`, `COMMERCIAL-LICENSE.md` and
`CLA.md` byte for byte the knowledge base templates. Whether the schemas need a permissive
exception was the operator's question CO-KB-02 in the knowledge base; it closed on 2026-10-19 and the
schemas stay under this repository's licence.

### Questions and access levels

The operator's standing rule of 2026-11-13 ([`knowledge/authority.md`](https://github.com/passioncode-ai/fabric-workspace/blob/main/knowledge/authority.md),
«Agents close questions themselves, by access level») applies here: an agent decides an open question itself by the
recorded decisions (`docs/DECISIONS.md`), this repository's goal and then the safest reversible option, writes the
decision and its reason where the work lives (the backlog row, the design, the DEC), and continues. Trust comes from
the gate (`pnpm run check`), the review rounds a DEC records and the conformance vectors, not from a person. Levels:

- this repository, its backlog, decisions, vectors and releases (PassionCode): the operator and the partner equally; an
  agent acts for them, a release by its checks (`release-signing/products.json`);
- a consumer's code: its own project's agent, asked on the board (`com.submit`), never edited from here;
- a level not written: the narrowest access that lets the act happen, recorded as an open point on the row.

A request on this project's board is answered by this project (`com.reply`) without waiting for a responder. The only
questions left for a person are the human gates: a sign-in, a one-time code, a consent screen, a typed secret, a
payment, spend above the limit, a send to people outside the estate, or access wider than the act needs.

## Organisation

This repository is one of the `passioncode-ai` repositories. The organization's rules
(branches, commits, CI, leases, secrets, handoffs) live in the knowledge base,
[`knowledge/rules.md`](https://github.com/passioncode-ai/fabric-workspace/blob/main/knowledge/rules.md)
(Fabric ADR-0093); the repository map and onboarding are in
[passioncode-ai/org-index](https://github.com/passioncode-ai/org-index) (both private; readable
by every org member):

- [repositories](https://github.com/passioncode-ai/org-index#repositories): which repository owns what, and how they connect
- [ONBOARDING.md](https://github.com/passioncode-ai/org-index/blob/main/ONBOARDING.md): setting up a new contributor's machine

Where this file is stricter than the organization's rules, this file wins. A change to this repository's
role, dependencies or test command updates its row in `org-index/repositories.json` in the same change.

### Coordination from a second machine

The lease and the record plane need different things, so a contributor without
the Notion token still has the part that prevents overwrites:

| Part | Needs | Without the Notion token |
|---|---|---|
| Lease (`acquire` / `renew` / `release`) | push access to `origin` | **Works.** A lease is the ref `refs/agent-sync/leases/<key>` on `origin`; the remote's non-fast-forward rejection decides it, so a lease taken on one machine blocks the other. |
| Id reservation (`reserve DEC`) | push access to `origin` | **Works.** Counters are refs under `refs/agent-sync/ids/`. |
| Record plane (`record`, `reconcile`, board, mirror) | the Notion token in the gitignored `.env.agent-sync` | **Degraded, today on the operator's machine too.** The tool falls back to the local `fs` plane (`whoami` prints `backend fs`): runs are recorded only on that machine, so the two machines do not see each other's journal or board. The lease guarantee is unchanged. |

The token is never copied between machines. Awareness of the other person's work
then comes from `git ls-remote origin 'refs/agent-sync/leases/*'`, the branch and
the PR, not from Notion. Install the tool with `npx @ssheleg/agent-sync install`.

## Shared backlog

[docs/backlog-sources.json](docs/backlog-sources.json) declares this repository's canonical
local task sources and their vision goals. The [common backlog contract](https://github.com/passioncode-ai/fabric-workspace/blob/main/knowledge/backlog.md)
owns aggregation; [the workspace backlog](https://wiki.passioncode.ai/backlog) is a derived view.
Edit a task only in its canonical source under an agent-sync lease, retain stable IDs and
closure receipts, and declare any new source in the manifest. Do not edit generated task
status in the workspace or copy another repository's task into a second editable row.
Land the source change, then run `node scripts/workspace.mjs sync` from a Fabric checkout
(or use the scheduled sync); check the published source commit before calling it current.

## After work

In the same run: update this repository's docs with the change; if a cross-repository fact changed
(a product, a version, a plan row, a principle), update the page in `fabric-workspace/knowledge/`
that owns it; a contract revision that moves a consumer's pin is also a row in its
`products.md`/`plans.md`; land both; publish (`node scripts/workspace.mjs sync` from a Fabric
checkout) or leave it to the scheduled sync. Leave a handoff with the exact next task.
