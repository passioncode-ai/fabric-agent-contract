# Spend policy and grants with amounts

DEC-0037, DEC-0038, DEC-0039 · rule codes `FAC-SEM-047`, `FAC-SEM-048` · schemas
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
| **L0 estate** | the limits no grant can raise: everything the estate spends across all provider keys in a month, **and** each provider key's own ceiling (DEC-0039); the hard stop | the estate's operator, once, and each key's ceiling where the key is issued; the registry alerts at 80% |
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

A standing grant with a `spend` block authorizes spending (DEC-0038):

- `mode: unlimited`, or `mode: limited` with one or more `limits`. Each limit names a `window` and a
  `limitUsd`; several windows apply together, and the first one reached stops the spend:
  - `total`: the grant's whole life;
  - `task`: one task;
  - `project`: everything spent on the grant's project;
  - `day`, `week`, `month`: calendar windows in UTC.
- optional `perCallMaxUsd` and `autoApproveUsd`, at most the smallest window;
- `payer: owner`: the agent's owner pays, also for a share grant;
- a `credentialSource`.

An unlimited grant is still stopped by the estate total (L0).

Three rules apply to every grant and every reader:

1. **The credential source is the project's own key or another agent's capability.** It is never another
   agent's key: `project-key` names a key issued for this project; `capability` names the agent whose
   capability is called, so that agent's own wallet and limits apply. A reader refuses any other source.
2. **A principal is proven, not claimed.** The registry authorizes a check by a credential it issued: a
   per-session token minted when the session starts and bound to the session, the agent and the project.
   Since DEC-0039 that credential is the estate hub's [delegation token](delegation.md): the meter verifies
   it and holds no caller identity of its own.
   - It is kept owner-only and never in an argument: mode 0600 on POSIX, and on Windows the protected ACL
     of [service.md's Windows token files](service.md) (DEC-0032, DEC-0033).
   - It is revoked when the session ends and has a maximum age. A missing or stale token is
     `principal-unproven`.
   - A label the caller supplies about itself is advisory.

   The boundary, stated plainly: any process of the same OS account can read an owner-only file. The token
   stops accidental and confused borrowing, not a hostile process of the same user, which is the same claim
   the vault makes.
3. **Approvals never block.** Above `autoApproveUsd`, or with no policy yet, the agent files **one** durable
   approval request (`approvalRequest` in the check's answer). The person answers it through the
   [operator channel](operator-channel.md)'s confirm token, which shows the amount (OC-6). Meanwhile the agent
   goes on with other work. A chat or cross-session message is never the approval.

A **share grant** (`principalKind: external`) lets a person or organization outside the estate call one of
the owner's agents for a project. It carries a limit, an expiry and a payer, and it can be revoked. Usage
reports attribute spend to it through `byGrant`.

## Checking

The registry's answer is a [`grant-check`](../../schemas/grant-check.schema.json) document:

- `allowed` carries a `receipt` and the `grantRef`, which the activity row repeats. It also **reserves**
  `reservedUsd` against the grant and every level above it until `expiresAt`, so two concurrent checks
  cannot together overrun a limit. Spend is settled against the receipt: the usage report's `byGrant` lists
  the receipts it settles. An unsettled reservation lapses at `expiresAt`.
- `denied` names **why** in `code` (`limit-reached`, `no-grant`, `grant-expired`, `grant-revoked`,
  `principal-unproven`, `credential-source-refused`, `unknown-state`) and **where** in `level`. `level` is
  `null` when the check stopped before any level (no grant, an unproven principal, an unknown state), and
  is always set for `limit-reached`. When the limit allows one, `denied` also carries the `approvalRequest`
  filed.

An unknown grant state is a denial (Fabric ADR-0023). These codes are a subset of the contract's one refusal
code set ([delegation](delegation.md#refusal-codes), DEC-0039) and keep their meaning there.

A grant that names an `audience` is a **delegation grant**: it also carries `capabilities` and an
`effectCeiling`, and the hub mints delegation tokens only under one ([delegation](delegation.md#grants-for-delegation),
DL-20).

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| `FAC-SEM-047` | `spend-policy` | the auto-approve threshold of a limited policy is at most its monthly limit; at most one offered option is preselected; "no project limit" is chosen only when it was offered |
| `FAC-SEM-048` | `grant-spend` | a limited grant names each window once, and neither its per-call maximum nor its auto-approve threshold exceeds its smallest window |
