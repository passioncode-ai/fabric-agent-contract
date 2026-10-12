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
| `approvedBy` | a person's role (`operator`, `product-manager`, `ceo`, `administrator`) or a recorded per-kind autonomy policy `{policy}` (ADR-0029 §3); never an agent |
| `appliedIn` | for a rule: the instruction revision it entered — an approved rule enters the binding's next revision, so applying is not a second act |
| `verifiedAt`, `verifiedRun` | for a fix: when, and in which of the source's runs, the finding stopped being reported |
| `private` | about an agent the operator marks private (ADR-0109 §7) |

The schema holds the shapes. The rules:

- **A rule is approved by a person** on the Board (ADR-0109 §4): `approvedBy` of a `rule` is a role, never a policy
  (`FAC-SEM-104`, kind `proposal`).
- **A proposal moves along its decisions** and nowhere else: from `proposed` to `approved`, `refused`, `merged` or
  `superseded`; from `approved` to `applied` or `superseded`; from `applied` to `retired`, `superseded`, or `verified`
  for a fix; the other statuses are final (`FAC-SEM-104`, kind `proposal-transition`, `{type, from, to}`;
  `PROPOSAL_TRANSITIONS`).
- **What leaves the estate.** A proposal about a private agent is never exported or submitted, by construction; an
  organization server receives only an approved or applied rule, or a listing (`proposal.submit`; `FAC-SEM-103`, kind
  `proposal-submit`, `{proposal, to}`).

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
| `FAC-SEM-103` | `proposal-submit` | a proposal about a private agent is never exported or submitted; an organization server receives only an approved or applied rule, or a listing (DEC-0072) |
| `FAC-SEM-104` | `proposal`, `proposal-transition` | a rule's `approvedBy` is a person's role, never a policy; a proposal moves only along `PROPOSAL_TRANSITIONS`, and only a fix is verified (DEC-0072) |
| `FAC-SEM-105` | `learning-rollout` | a `personal` or `unknown` learning note never feeds an organization rollout (DEC-0072) |
