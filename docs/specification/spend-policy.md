# Spend policy and grants with amounts

DEC-0037, DEC-0038, DEC-0039, DEC-0041, DEC-0045, DEC-0046 · rule codes `FAC-SEM-047`, `FAC-SEM-048` · schemas
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
| **L3 call** | one call (`perCallMaxUsd`; a callee's own per-call limit); exceeding it is `limit-reached` with window `call` | derived from L2 |

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

`modelClasses` names the classes the project allows, from the closed vocabulary of the
[model catalogue](runners.md#runner-and-model-profiles) (DEC-0046); a grant's `spend.modelClasses` uses the same
vocabulary. The policy restricts the model profile a launch resolves to and never chooses one: a model stays when
every class it has is allowed, and when none stays the launch is refused with the policy named. Absent, it
restricts nothing. The descriptive class `open-vendor` is neither named nor checked: the schema refuses it here and in
a grant, and resolution ignores it (DEC-0083).

## Grants

A standing grant with a `spend` block authorizes spending (DEC-0038):

- `mode: unlimited`, or `mode: limited` with one or more `limits`. Each limit names a `window` and a
  `limitUsd`; several windows apply together, and the first one reached stops the spend:
  - `total`: the grant's whole life;
  - `task`: one task. The meter's `task` window is keyed on the token's `task` claim; else on the first
    `session` met walking the onward token's actor chain from its outermost actor (the callee's own session,
    else its caller's, and so on); else on the grant itself (`grant:<ref>`), one window for all the grant's
    spend — never on a `jti`, which the callee could change with every check (DEC-0041,
    [delegation](delegation.md#the-hubs-grant-projection) DL-24);
  - `project`: everything spent on the grant's project;
  - `day`, `week`, `month`: calendar windows in UTC.
- optional `perCallMaxUsd` and `autoApproveUsd`, at most the smallest window. A call above `perCallMaxUsd` is
  denied `limit-reached` with window `call` at level L3 (DEC-0041). The window `call` is a refusal window, not a grant limit window:
  a grant's `limits` name only the six windows above;
- `payer: owner`: the agent's owner pays, also for a share grant;
- a `credentialSource`.

An unlimited grant is still stopped by the estate total (L0).

Three rules apply to every grant and every reader:

1. **The credential source is the project's own key or another agent's capability.** It is never another
   agent's key: `project-key` names a key issued for this project; `capability` names the agent whose
   capability is called, so that agent's own wallet and limits apply. A reader refuses any other source.
2. **A principal is proven, not claimed** (DEC-0039, [delegation](delegation.md) DL-21). The meter issues
   no identity and holds none: it is proven to by the estate hub's delegation token. That proof is owed
   across the machine boundary (tier T2, [delegation](delegation.md#trust-tiers) DL-25); a caller inside it
   (T0, T1) needs no token and no grant record, and the money limits — L0, L1 and each key's ceiling — still
   bind it (DL-26, DEC-0045).
   - The callee exchanges the token it was called with for an **onward token** for the meter: `aud` the
     meter, the callee added as outermost actor, `scope` the meter's grant-check capability, `effect:
     ["none"]`, the same one grant, principal and project, expiring no later than the callee's token.
   - It presents that token in `Authorization: Bearer` on a direct call to the meter, never in an argument.
     The request ([`grant-check-request`](../../schemas/grant-check-request.schema.json)) carries the amount
     and the `jti` of the callee's own token, for attribution.
   - The meter verifies the onward token offline (audience itself, scope exactly its grant-check capability,
     effect exactly `none`) and answers any refusal of it — expired, another audience, unsigned — as
     `principal-unproven`. A callee that stops on a denial relays its `code` unchanged (DL-21 step 6).
   - A label the caller supplies about itself is advisory.

   The boundary, stated plainly: any process of the same OS account can read what the caller holds. The
   token stops accidental and confused borrowing, gives every hop a name and lets a limit hold per caller;
   it does not stop a hostile process of the same user, which is the same claim the vault makes.
3. **Approvals never block.** Above `autoApproveUsd`, or with no policy yet, the agent files **one** durable
   approval request (`approvalRequest` in the check's answer). The person answers it through the
   [operator channel](operator-channel.md)'s confirm token, which shows the amount (OC-6). Meanwhile the agent
   goes on with other work. A chat or cross-session message is never the approval.

A **share grant** (`principalKind: external`) lets a person or organization outside the estate call one of
the owner's agents for a project. It carries a limit, an expiry and a payer, and it can be revoked. Usage
reports attribute spend to it through `byGrant`. A share grant into an organization carries that organization's
`context`, `org:<orgId>`, never `personal` (`FAC-SEM-110`); its access level is its own fields, and the organization
sees its usage as one `grant.usage` activity event per day ([contexts](contexts.md), DEC-0082).

## Checking

The registry's answer is a [`grant-check`](../../schemas/grant-check.schema.json) document:

- `allowed` carries a `receipt` and the `grantRef`, which the activity row repeats. It also **reserves**
  `reservedUsd` against the grant and every level above it until `expiresAt`, so two concurrent checks
  cannot together overrun a limit. Spend is settled against the receipt: the usage report's `byGrant` lists
  the receipts it settles. An unsettled reservation lapses at `expiresAt`.
- `denied` names **why** in `code` (`limit-reached`, `no-grant`, `grant-expired`, `grant-revoked`,
  `principal-unproven`, `credential-source-refused`, `unknown-state`) and **where** in `level`; a
  `limit-reached` names its `window` too, one of the grant's six or `call` (always with `level: L3`). `level` is
  `null` when the check stopped before any level (no grant, an unproven principal, an unknown state), and
  is always set for `limit-reached`. When the limit allows one, `denied` also carries the `approvalRequest`
  filed.

An unknown grant state is a denial (Fabric ADR-0023). A meter beside the hub reads the grant from the hub's
projection of it ([delegation](delegation.md#the-hubs-grant-projection) DL-23, DL-24, DEC-0041): a missing,
unreadable, stale or inactive projection is a denial, and the file authorises nothing without the verified onward
token. These codes are a subset of the contract's one refusal
code set ([delegation](delegation.md#refusal-codes), DEC-0039) and keep their meaning there.

A grant that names an `audience` is a **delegation grant**: it also carries `capabilities` and an
`effectCeiling`, and the hub mints delegation tokens only under one ([delegation](delegation.md#grants-for-delegation),
DL-20).

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-047"></a>`FAC-SEM-047` | `spend-policy` | the auto-approve threshold of a limited policy is at most its monthly limit; at most one offered option is preselected; "no project limit" is chosen only when it was offered |
| <a id="fac-sem-048"></a>`FAC-SEM-048` | `grant-spend` | a limited grant names each window once, and neither its per-call maximum nor its auto-approve threshold exceeds its smallest window |
