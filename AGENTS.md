# Working in fabric-agent-contract

## Read first

1. The organization's
   [roadmap](https://github.com/passioncode-ai/fabric-workspace/blob/main/knowledge/roadmap.md) —
   every major feature and release across PassionCode.ai as `RM-*` tracks with owner, phase and
   state. It is the entry point: a task here that serves a track names it, and the track's status
   is edited only in the roadmap.
2. The PassionCode.ai knowledge base — `fabric-workspace/knowledge/` in your clone (org-index
   `scripts/clone_all.sh` makes it) or https://wiki.passioncode.ai/knowledge — at least its
   [README](https://github.com/passioncode-ai/fabric-workspace/blob/main/knowledge/README.md),
   vision, principles and how-to-work.
3. This file, then the organization's
   [CONTRIBUTING.md](https://github.com/passioncode-ai/.github/blob/main/CONTRIBUTING.md).

## What this repository is

Fabric Agent Contract: what makes any agent Fabric-compatible — schemas, profiles and the
conformance checker every provider is admitted by. It stands on its own; any host can implement it.

## Commands

| What | Command |
|---|---|
| Install | `pnpm install --frozen-lockfile` |
| Test (the gate) | `pnpm run check` |
| Consumer pin | `pnpm pin:check <consumer checkout>` |
| MCP (register + proving call) | none — the contract serves no MCP tools; README "Quick start → MCP" |

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
exception is the operator's open question CO-KB-02 in the knowledge base, not a decision here.

## Organisation

This repository is one of the `passioncode-ai` repositories. The organization's rules —
branches, commits, CI, leases, secrets, handoffs — live in the knowledge base,
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
that owns it — a contract revision that moves a consumer's pin is also a row in its
`products.md`/`plans.md`; land both; publish (`node scripts/workspace.mjs sync` from a Fabric
checkout) or leave it to the scheduled sync. Leave a handoff with the exact next task.
