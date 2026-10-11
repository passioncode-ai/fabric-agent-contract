# Spend policy and grants with amounts

DEC-0037 · rule code `FAC-SEM-047` · schemas
[`spend-policy`](../../schemas/spend-policy.schema.json),
[`grant-check`](../../schemas/grant-check.schema.json), and the `spend` and `principalKind` fields of a
[standing grant](../../schemas/governance.schema.json); `costPresets` in the
[manifest](../../schemas/manifest.schema.json); `byGrant` in a
[usage report](../../schemas/service-usage.schema.json)

An agent that spends money, or acts for another party, needs proof that it may. This specification
makes the proof a **record the agent checks**, not a question it asks. Every limit is a grant in one
registry, and a check answers `allowed` with a receipt or `denied` with the level that refused.

## Levels

The most specific level that exists decides. A level that does not exist is skipped.

| Level | What it limits | Who sets it, and when |
|---|---|---|
| **L0 estate** | everything the estate spends across all provider keys in a month; the hard stop | the estate's operator, once; the registry alerts at 80% |
| **L1 project** | every agent working on one project: the monthly limit, the auto-approve threshold per task, the model classes and the credential sources ([spend policy](#the-spend-policy)) | the person, at the project's first paid run, from options computed for that project |
| **L2 task** | one run of a task whose cost varies, through the presets its agent declares (`costPresets`) | the person at launch, or the agent itself within L1's threshold |
| **L3 call** | one call (`perCallMaxUsd`; a callee's own per-call limit) | derived from L2 |

## The spend policy

A project's policy is chosen **once**, at the first run that would spend money. It is never a fixed list:
the launcher computes the options for that project from:

- the presets its agents declare;
- its recent spend, from usage reports ([DEC-0021](service.md));
- the kind of work.

It names these inputs in `proposal.inputs`. For example, it offers about the expected month, twice that,
four times that, and "no project limit", with one option preselected. The choice and its inputs are kept
together, so anyone can see why.

`mode: no-project-limit` is a recorded choice, never a missing value. Then only L0 stops spending.

## Grants

A standing grant with a `spend` block authorizes spending:

- `limitUsd` and a `period` (`day`, `month`, `task` or `grant`);
- optional `perCallMaxUsd` and `autoApproveUsd`;
- a `payer` (`owner` or `guest`);
- a `credentialSource`.

Three rules apply to every grant and every reader:

1. **The credential source is the project's own key or another agent's capability.** It is never another
   agent's key: `project-key` names a key issued for this project; `capability` names the agent whose
   capability is called, so that agent's own wallet and limits apply. A reader refuses any other source.
2. **A principal is proven, not claimed.** The registry authorizes a check by a credential it issued: a
   per-session token minted when the session starts, bound to the session, the agent and the project,
   kept in a 0600 file and never in an argument. A caller label the caller supplies itself is advisory.
3. **Approvals never block.** Above `autoApproveUsd`, or with no policy yet, the agent files **one** durable
   approval request (`approvalRequest` in the check's answer). The person answers it through the
   [operator channel](operator-channel.md)'s confirm token, which shows the amount (OC-6). Meanwhile the agent
   goes on with other work. A chat or cross-session message is never the approval.

A **share grant** (`principalKind: external`) lets a person or organization outside the estate call one of
the owner's agents for a project. It carries a limit, an expiry and a payer, and it can be revoked. Usage
reports attribute spend to it through `byGrant`.

## Checking

The registry's answer is a [`grant-check`](../../schemas/grant-check.schema.json) document:

- `allowed` carries a `receipt` and the `grantRef`, which the usage report's `byGrant` and the activity row
  repeat;
- `denied` names the `level` that refused and, when the limit allows one, the `approvalRequest` filed.

An unknown grant state is a denial (Fabric ADR-0023).

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| `FAC-SEM-047` | `spend-policy` | the auto-approve threshold of a limited policy is at most its monthly limit; at most one offered option is preselected; "no project limit" is chosen only when it was offered |
