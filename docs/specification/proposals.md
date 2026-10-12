# Proposals and learning notes — `fabric-proposal/1`, `learning-note/1`

DEC-0072 · rule codes `FAC-SEM-103`…`FAC-SEM-105` · schemas
[`fabric-proposal`](../../schemas/fabric-proposal.schema.json),
[`learning-note`](../../schemas/learning-note.schema.json),
[`learning-note-answer`](../../schemas/learning-note-answer.schema.json) · code
[`src/proposal-rules.ts`](../../src/proposal-rules.ts)

A problem anywhere becomes a proposal, and an agent's learning lives in Fabric (Fabric ADR-0109); a proposal terminates
at the target project's manager (Fabric ADR-0029). This page is the open shape of both, as the organization edition's
CON-OE-05 asks, with Fabric's corrections of 2026-10-12. The store, the Board and the approval stay Fabric's.

## A proposal

| Field | Rule |
|---|---|
| `type` | `rule` (for an agent binding), `new-agent`, `skill-promotion`, `skill-retirement`, `listing` (v4 Path 4: publishing a listing) or `fix` (a finding from Fabric Dashboards or Project Observatory, ADR-0109 §6) |
| `goal` | the agent binding's goal it serves; required for `rule`, `new-agent`, `skill-promotion` and `skill-retirement` (ADR-0109 §3: an off-goal proposal cannot be approved) |
| `change` | one sentence |
| `evidence[]` | references only — `{kind, ref, window?}`, an episode, a finding, a run, a journal interval — never a copy of content |
| `finding` | for a `fix`: the finding's id, its source and its text, never a secret |
| `target` | `{kind: project, project}` — the owning project's manager — or `{kind: ceo}` when there is no project (ADR-0029) |
| `status` | `proposed` → `approved` \| `refused` \| `merged` (`mergedInto`) \| `superseded` (`supersededBy`) → `applied` → `retired`, and `verified` for a fix; a status Fabric keeps inside, such as an evaluation, is not in the contract |
| `approvedBy` | a person — `operator` or an organization's `administrator` — or a recorded per-kind autonomy policy `{policy}` (ADR-0029 §3). A project manager or the CEO is an agent binding in this contract (`roles.schema.json`), so an agent decides only under a recorded policy, never by its role; the approver is a person or a policy, never the authoring agent, so DEC-0012's author ≠ approver holds by construction |
| `appliedIn` | for a rule: the instruction revision it entered — an approved rule enters the binding's next revision, so applying is not a second act |
| `verifiedAt`, `verifiedRun` | for a fix: when, and in which of the source's runs, the finding stopped being reported |
| `private` | about an agent the operator marks private (ADR-0109 §7) |
| `sourceClass` | `organization`, `personal` or `unknown`: whose work the proposal comes from |
| `payload` | type-specific fields Fabric defines (a listing's reference); never a copy of content or a secret |

The schema holds the shapes. The rules:

- **A rule is approved by the operator** on the Board (ADR-0109 §4): `approvedBy` of a `rule` is `{role: operator}`,
  never a policy or another role (`FAC-SEM-104`, kind `proposal`).
- **A proposal moves along its decisions** and nowhere else: from `proposed` to `approved`, `refused`, `merged` or
  `superseded`; from `approved` to `applied` or `superseded`; from `applied` to `retired`, `superseded`, or `verified`
  for a fix; the other statuses are final (`FAC-SEM-104`, kind `proposal-transition`, `{type, from, to}`;
  `PROPOSAL_TRANSITIONS`).
- **What leaves the estate** (`FAC-SEM-103`, kind `proposal-submit`, `{proposal, to}`). A proposal leaves only `to` an
  organization server or an `export`; filing a proposal to its own project's manager on the Board is not leaving. A
  proposal about a private agent never leaves, by construction. An organization server receives a proposal whose
  `sourceClass` is `organization` and that is an approved or applied rule, or a live listing (proposed, approved or
  applied). Nothing leaving carries a credential-shaped value or URL (the shared detector) or a home-folder path, in its
  URIs (`id`, `target.project`, `mergedInto`, `supersededBy`, `appliedIn`), its goal's id and text, its change, its
  finding's id and text, its evidence references, its `approvedBy.policy`, its `verifiedRun` or its payload. A home-folder
  path is one that starts the string, follows `file://` (with or without `localhost`), or follows any character that
  cannot continue a path (a space, a quote, a backtick, a bracket, a comma); `docs/Users/guide.md` is not one, nor is a
  folder in any script before `/home/`.

## Relation to DEC-0012

`memory.schema.json`'s `learningProposal` and `promotion` stay the Memory Kernel's records of a retrospective's
proposal and a global promotion (DEC-0012, `FAC-SEM-003`, `FAC-SEM-094`). A `fabric-proposal/1` is what reaches a
manager on the Board: Fabric files one for a rule a learning proposal recommends, citing it in `evidence[]`. The v2
plan's `effect` and `measured_by` are not fields here: a proposal's expected effect is in `change` and `payload`, and
what measured it is its evidence.

## A learning note

What Project Observatory hands Fabric when it learns something about an agent's work: `noteId` (stable, the
idempotency key), `projectId`, the agent binding when known, `goal`, one-sentence `observation` and `proposedChange`,
`evidence[]` by reference, `confidence`, `engineRevision` and `sourceClass` (`organization`, `personal`, `unknown`).
No transcript content and no secret. Fabric answers `accepted` or `duplicate` with the proposal it filed, or `rejected`
with a reason ([`learning-note-answer`](../../schemas/learning-note-answer.schema.json)); the sender keeps only the
answer and reads the proposal's status back. A `personal` or `unknown` note never feeds an organization rollout
(`FAC-SEM-105`, kind `learning-rollout`, `{note, rollout}`).

`memory/0.1`'s reserved name `memory.learning.propose` is withdrawn: learning is Fabric's (ADR-0109), and a note is
this document, not a memory capability.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| `FAC-SEM-103` | `proposal-submit` | a proposal leaves only to an organization server or as an export; never one about a private agent; an organization server receives an organization proposal (`sourceClass`) that is an approved or applied rule or a live listing; nothing leaving carries a credential-shaped value or URL or a home-folder path in its URIs, goal, change, finding id or text, evidence references, approving policy, `verifiedRun` or payload (DEC-0072) |
| `FAC-SEM-104` | `proposal`, `proposal-transition` | a rule's `approvedBy` is `{role: operator}`, never a policy or another role; a proposal moves only along `PROPOSAL_TRANSITIONS`, and only a fix is verified (DEC-0072) |
| `FAC-SEM-105` | `learning-rollout` | a `personal` or `unknown` learning note never feeds an organization rollout (DEC-0072) |
