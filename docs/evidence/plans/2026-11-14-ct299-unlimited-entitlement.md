# Design 2026-11-14: an organization with no limits on its entitlement (CT-299)

**Status:** proposed design; the decision (one DEC) follows from it. Rules are proposals numbered `EU-*`. It reads
[entitlements](../../specification/entitlement.md) (DEC-0085, DEC-0088), the [spend policy](../../specification/spend-policy.md)
and the levels of DEC-0162, and edits none of them in place.

**Asked by:** passioncode-platform (board message `caab9b65`, thread `16093ded`, relayed by fabric-workspace), after the
operator asked the platform for an "unlimited" tier («Всё без лимитов», platform session `fbc88a8a`, 2026-11-13); the
platform built it in 0.17.0 (`customers.tier`, scope `customers:tier`, owner level only, PLAT-154). A verifier (the
first organization server) cannot tell today that an organization has no limits: the record
it checks has no such line.

Sections cite the repository at `980f9013` (main on 2026-11-14).

## What the contract says today

| Where | What it says | Why it blocks "unlimited" |
| --- | --- | --- |
| [entitlement](../../specification/entitlement.md) *Fields* | every member is always present, a missing line is `null`, and "the schema refuses any member it does not list" (DEC-0063: a changed list is a new type) | no member can say "no limits", and adding one to `entitlement/1` breaks every verifier pinned to it |
| entitlement *Fields*, `licence` | `{members}` from 1 to 1 000 000, the member allowance; "the billable count is the organization server's own metering, never this field" | an allowance with no ceiling has no number to carry |
| [spend policy](../../specification/spend-policy.md) *Levels* | L0 (the estate's total and each key's own ceiling, the hard stop) and a project's L1 bind whatever the order; `mode: no-project-limit` is a project's recorded choice, never a missing value; spend above a limit is the person's ([delegation](../../specification/delegation.md) AP-4, MD-6) | "no limits" must not reach these: they protect the operator's money, not the order's allowances |
| DEC-0162 LV-7 | finances and access in an organization are the owner's and the administrators' | who may grant "unlimited" is a billing act |

## The design

**EU-1, a new type, `entitlement/2`.** Following DEC-0063, the field list changes, so the type does: `entitlement/2`
has every member of `entitlement/1`, with the same rules, plus one member `allowances`, always present:
`"limited"` (the order's lines are its limits, exactly as `/1` reads them) or `"unlimited"` (the order sets no ceiling on
the lines EU-2 names). `personal` carries `"limited"` (an estate has no order allowances to lift; its own limits are L0).
`entitlement/1` stays as it is, verified as today; `/2` gets its own schema
(`schemas/entitlement-2.schema.json`), its own `FAC-SEM` rule and vectors, and the same signature, windows, `held`
record and key sets (`entitlement-key-set/1` serves both types). A verifier pinned before EU-1 refuses `/2` as
`malformed` (another `type`), so the issuer never sends it one (EU-4).

**EU-2, what "unlimited" lifts.** Only the order's own allowances, which the verifying product enforces:

- the member allowance: `licence` stays present (`{members}` the count the order was priced on, or `null`), and the
  verifier does not refuse a member past it; metering stays the server's own (entitlement *Fields*);
- the number of paid agents: `agents` lists the agents the order names, and the verifier switches on any agent the
  organization adds without refusing it as unpaid;
- the hosting size: `hosting.size` stays the size provisioned, and the product may grow it without a new order.

**EU-3, what it never lifts.** No line of an entitlement, `/1` or `/2`, reaches the money and authority rules other
documents own: the estate's L0 (its total and each key's own ceiling), a project's L1 (an "unlimited" order never records
`mode: no-project-limit` for it; that stays the project's own choice, spend policy *The spend policy*), a grant's
`perCallMaxUsd` and `autoApproveUsd`, delegation's MD-6, a product's own emergency stops, DEC-0162's levels (a member is still decided by an owner or an
administrator where LV-7 says), DEC-0166's profiles, and AP-4's human steps (a payment or top-up stays the person's).
"Unlimited" is a commercial statement about the order, never an authority over spending or acts.

**EU-4, the issuer's rule.** The platform signs `/2` with `allowances: "unlimited"` only for an order its owner-level
scope (`customers:tier`, PLAT-154) marked so; the contract states the rule, the scope is the platform's. It issues `/2`
only to a verifier re-vendored at or after the DEC, as that verifier's owner confirms on the project board (the rule
DEC-0088 set for `enterprise-cloud`), and `/1` to every other verifier; one subject gets one type at a time, and a
change of type is a new revision of the same order (entitlement *One entitlement per subject*). Turning "unlimited" off
is a new revision with `"limited"`; the verifier keeps the newer revision as today.

**EU-5, the verifier's answer.** `verifyEntitlement` reads both types. For `/2` its verdict carries `type` and
`allowances` beside the lines; a `/1` verdict keeps its shape (the precedent of `org-membership/2`, DEC-0162), and a
product reads an absent `allowances` as `limited`.

## What it does not decide

How a product shows "unlimited" to an administrator, what it bills, and which functions a lapse switches off stay the
verifying product's (entitlement *Not decided here*). Whether an organization's own spend limits default differently
under "unlimited" is a spend policy question the operator has not asked; EU-3 keeps them as they are.

## Open points for the decision

1. A type rather than a member, because DEC-0063 says a changed field list is a new type, and `entitlement/1`'s
   schema is closed; the price is a second schema and a re-vendor per verifier, which EU-4 gates as DEC-0088 did.
2. `allowances` is a word, not a boolean, so a later order kind (a trial, a capped plan) gets a value of its own
   without a third type.
3. The rule code is the next free one at landing, reserved by the CAS counter.

## Next

The DEC with `schemas/entitlement-2.schema.json`, the reference reading in `src/entitlement.ts`, its rule and vectors,
and the restatements (entitlement's fields, its verifier, *Who adopts it*); read under the finish-line rule. The
platform (PLAT-154) issues `/2` only to verifiers that confirm on the board; The first organization server re-vendors and
confirms.
