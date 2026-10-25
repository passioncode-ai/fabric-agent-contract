# The audit of 2026-10-25 and the plan to the first organization (draft, before the operator's answers)

Survey, inventory and proposed order for the contract's next release iteration (task-pipeline `iteration`,
steps 1 to 4). Status lives in [the backlog](../../backlog.md); this page holds the classification, the order and
the reasons. The operator's questions are in [the question queue](../specs/2026-10-25-first-organization-questions.md);
this page is redrafted once they are answered, and nothing here is built before that.

## Where the contract stands (measured 2026-10-25)

- `main` `283c960a`; the newest tag `v0.1.0+2026-10-25` (`git tag --sort=-creatordate`); the last decision DEC-0121.
- The gate on `main`: `pnpm check` exit 0, 99 test files, 8 837 tests, UX lint (35 stories, 29 flows, 30 screens,
  43 scenarios), documentation checks and the privacy check passed. The nightly CI on `main` passed on 2026-10-24
  22:45 and 23:50 (`gh run list`).
- Measured pins (`fabric-contract.lock.json` on the default branch): fabric-agent-adapter `2f020a69`
  (DEC-0111, 71 commits behind `main`), the relay `bf3fd6b2` (DEC-0082, 351 behind). Fabric, Project Observatory,
  Fabric Switchboard and Fabric Dashboards pin elsewhere; their re-pins are recorded in
  [the audit handoff](../../handoffs/2026-10-24-audit-and-release.md) (Switchboard and Dashboards at `4e5440cf`,
  Fabric 0.3.13 by 2026-10-31, Observatory OBS-226 by 2026-11-07).

## Cleanup done in this audit

| What | Evidence |
|---|---|
| Worktrees `_worktrees/fabric-agent-contract-{058fb78,2ce3922-clean,pin}` removed | each detached, clean, its `HEAD` an ancestor of `origin/main` |
| The stray clone `_worktrees/fabric-agent-contract-2ce3922` (2026-10-03) removed | its branches absorbed: ancestors of `main`, or squash-merged (`ccdbfc3a`; `schemas/settings-backup.schema.json` on `main`); untracked `node_modules` only |
| 8 local branches deleted | 4 merged; `agent/debts-{docs,tests,vectors}-20261024` absorbed by #180 (`git merge-tree` against `main` leaves only conflict markers); `agent/ct63-resolve-pending-20261019` replaced by #128 |
| 131 remote branches deleted; `origin` keeps only `main` | each an ancestor of `origin/main`, or the head of a merged PR (#124, #126) or replaced by one (#128) |
| The tips not reachable from `main` kept | 13 local refs under `refs/archive/2026-10-25/` on the operator's checkout |
| Fabric tasks in review given their evidence | the residue task and the `extraRevocations` vector task (notes on both) |

Left as found: 17 expired agent-sync leases on origin. They block nothing (agent-sync treats an expired lease as
free), and clearing another run's lease by age is the operator's (`agent_sync.py reap --long-expired`); CT-136.

## Inventory

87 open rows: the 79 the backlog held and CT-129 to CT-136, which this audit filed from the board (323 unread
messages read, 8 items unrecorded until now) and its own measurements. Two open questions (OQ-0010, OQ-0011).

| Class | Rows | Who acts |
|---|---|---|
| A. Live defect | CT-129 | the contract |
| B. Asks with a date addressed to the contract | CT-130, CT-131 (both 2026-10-31) | the contract |
| C. The first organization's gate | CT-122 (due 2026-11-06), CT-92 (second half), CT-93, CT-94, CT-97, CT-98, CT-37, OQ-0010 | the contract, the operator for CT-92 and OQ-0010, Fabric D8 for CT-37 |
| D. Closing DEC-0121 | CT-128 (after 2026-10-30), CT-127 (16 answers recorded today; the rest owed) | the contract |
| E. Board answers and questions owed | CT-132, CT-133, CT-134, CT-135 | the contract |
| F. The contract's own quality debt | CT-30, CT-44, CT-64, CT-67, CT-68, CT-69, CT-71, CT-73, CT-75, CT-76, CT-77, CT-78, CT-79, CT-80, CT-90, CT-99, CT-102, CT-103, CT-107, CT-108, CT-116, CT-120, CT-123, CT-136, OQ-0011 | the contract (CT-44 is agent-sync's tool) |
| G. Consumer adoption, owed by another product | CT-03, CT-04, CT-18, CT-19, CT-20, CT-21, CT-26, CT-33, CT-34, CT-35, CT-41, CT-42, CT-50, CT-51, CT-52, CT-53, CT-55, CT-57, CT-58, CT-60, CT-61, CT-62, CT-63, CT-65, CT-66, CT-70, CT-81, CT-82, CT-83, CT-84, CT-87, CT-88, CT-105, CT-106, CT-110, CT-113, CT-115, CT-117, CT-124, CT-125, CT-126 | each product; the contract records |
| H. Programs waiting on Fabric's decisions | CT-17, CT-27, CT-36, CT-38, CT-45, CT-121 | Fabric (D2, D8, the registry), then the contract |
| I. Outside this repository | CT-48 (the projects wiki card) | the wiki |

Class G is 41 of 87 rows: half the backlog is other products' work tracked here. That is the main reason the backlog
reads as unfinished while the contract's own decisions are merged.

## Dossiers (clusters of the inventory)

| # | Dossier | Items | What it decides |
|---|---|---|---|
| D1 | Fixes that ship first | CT-129, CT-123, CT-136 | the digit in `notMeasured` (a schema change that only widens), a growth test that reaches the origin code, the retro migration and the stale release lists |
| D2 | The first organization | CT-122, CT-137, CT-92, CT-93, CT-94, CT-97, CT-98, OQ-0010, CT-37, CT-138, CT-139, CT-140, CT-141 | a `kid` and an `iss` per context (unlinkable memberships, the K-1 condition), what an organization sees on a work machine, `org-cloud` usage, the pre-`collectionStart` refusal, `resumeAfterPurpose` vectors; since 2026-10-25 also the organization train's rows: membership attestation (CT-137), a service bound to a context (CT-138), the context profile's format (CT-139), the organization's credential store (CT-140), a project in several organizations (CT-141) |
| D3 | Services and their hosts | CT-130, CT-131, CT-132, CT-133 | dashboard links as `open_link`, an A2A card or an `ai-catalog` entry, a container image in a package, a support agent's template |
| D4 | Closing DEC-0121 | CT-128, CT-127, CT-134 | the blind readings DEC-0121 owes, and the partner job collision found in DEC-0090's port |
| D5 | One grammar and the checker | CT-73, CT-75, CT-76, CT-77, CT-78, CT-79, CT-80, CT-99, CT-102, CT-107, CT-108, CT-120, OQ-0011 | the contract review's findings left on 2026-10-21; CT-76 and OQ-0011 change what a pinned reader accepts, so they belong to a protocol revision |
| D6 | Usage, money and sessions | CT-30, CT-64, CT-71, CT-90, CT-103, CT-116, CT-67, CT-68, CT-69 | a grant check without a token, sessions without a Project, per-project money by route, a summary over the relay |
| D7 | Adoption as a measured matrix | class G | proposal: one adoption page re-measured each release (who pins what, who implements what, each consumer's own row id), and class G rows closed on the contract's side once their decision is merged and their consumer row is named there |
| D8 | Waiting on Fabric | class H | nothing to build; one watcher on Fabric's D2 and D8 |

## Proposed order (Q-01 and Q-04 answered 2026-10-25; the rest still proposed)

The next release is "the contract a first organization can run on". Its waves:

| Wave | Content | Done by | Why here |
|---|---|---|---|
| 0 | D1 (CT-129 first) | 2026-10-27 | a published schema refuses what its own rule requires; producers work around it today |
| 1 | CT-130 and CT-131 decided and answered on the board | 2026-10-31 | two requests with that deadline |
| 2 | D2: CT-122 and CT-137 (membership attestation), CT-92's decision record, CT-97, CT-98; then CT-138 (2026-11-14), CT-140 (2026-11-21), CT-141 with CT-122's design; CT-93 and CT-94 leave the path (no cloud machine in this release, Q-01) | 2026-11-06 for CT-122 and CT-137 | the operator's Mac is in both organizations of the pilot (Q-01), so the second cannot join until CT-122 lands |
| 3 | D4: CT-128's readings, CT-134 | after 2026-10-30 | the API limit resets that day |
| 4 | D3 rest (CT-132, CT-133), D6 | 2026-11-14 | asked, no date; RM-33 for CT-132's FP-05 |
| 5 | D5, as one protocol revision | after the first organization runs | changing grammars moves every pinned reader at once; better done once, with every consumer re-pinning together |
| side | D7 | with the release | the adoption page re-measured, class G rows collapsed |

The release closes with a tag on a gate-passed `main`, the re-pins announced on the board, and the
post-release check (task-pipeline `iteration` steps 10 and 11).

## What the contract does not take

Activating our own organization on the first organization server (a person's step), Fabric's hub issuer,
ceremonies and the relay's deployment, Observatory's OE-01 and OE-06, the cloud image and Switchboard's rows: those
products' work, tracked in class G and in fabric-workspace `knowledge/plans.md`.
