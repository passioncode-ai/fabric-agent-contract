# Design 2026-11-14: a signed statement that an instance was issued to an organization (CT-314)

**Status:** proposed design; the decision (one DEC with its schema, reference verifier and vectors) follows from it.
Rules are proposals numbered `IS-*`. It reads [membership](../../specification/membership.md) (DEC-0127, DEC-0129,
DEC-0162) and [entitlement](../../specification/entitlement.md) (DEC-0085) and edits neither in place.

**Asked by:** the first organization server's project (board message `270b130b`, thread `fb41cd09`, 2026-11-14), for the
"CT-250 document type" its own row and the platform's PLAT-146 cite; DEC-0162 gave `org-membership/2`, the level
decision and the level mandate, and no issuance statement. Its proposal (board `983f0303`) and the platform's reading
(board `f126b49d`, PLAT-146, accepted `3bb1d765`) shape it. Needed by 2026-11-28; this design by 2026-11-21.

Sections cite the repository at `980f9013` (main on 2026-11-14).

## What it is for

An owner or an administrator adds an instance to the organization in the organization server (`org.instance_added`).
Two readers need to know that later without trusting the server's word: the platform, when the instance's record is
put for `org:<id>` (`instance_put`, PLAT-146), and the instance's own product, when it starts serving the
organization. Today nothing signed says "this instance belongs to this organization": `org-membership/2` says who is a
member, `entitlement/1` what an order buys, neither which instance runs for the organization.

## The design

**IS-1, a new type, `org-instance/1`.** One JSON document with its signature inside, signed like `org-membership/1`
(the register's `org-instance/1` statement, the UTF-8 RFC 8785 form without `sig`, DEC-0063), by a signing key of the
organization's `org-key-set/1` (`/fabric/membership/v1/{org}/key-set`, OM-3). Every member is always present:

| Field | Rule |
|---|---|
| `type` | `org-instance/1` |
| `issuer` | the organization server's `https://` origin, as `org-membership/1` states it |
| `org` | the organization's context id `org:<orgId>` |
| `instanceId` | the instance's opaque id, as the platform's record and the instance's product name it |
| `product` | the product the instance runs: an opaque product id (the platform's product key) |
| `origin` | the instance's `https://` origin in lower case, compared as written |
| `placement` | `org-cloud` (the organization's cloud), `machine` (a member's or the organization's machine) or `service` (a PassionCode service) |
| `status` | `active`, or `retired`: the issuer states a retirement (`org.instance_retired`) with a higher revision rather than going silent |
| `revision` | a positive integer that rises with every statement for this (organization, instance) |
| `issuedAt`, `notBefore`, `expiresAt` | strict RFC 3339 instants with at most three fraction digits, `issuedAt` ≤ `notBefore` < `expiresAt`, and `expiresAt` at most 7 days after `issuedAt` |
| `alg`, `kid`, `sig` | `EdDSA`, the signing key's `kid` in the organization's key set (the platform's request), and the signature |

No member names a person or a network address beyond the instance's own origin.

**IS-2, the verifier.** `verifyOrgInstance(statement, {now, org, instanceId, keySet, held})` checks with no network and
answers `{ok: true, status, refreshDue, unchanged, digest, held}` or one problem, in `verifyOrgMembership`'s order:
`no-clock` and `context-invalid`; `malformed`; `wrong-issuer`; `unknown-algorithm`; `unknown-key` and `key-revoked`;
`unusable-key` and `small-order-key`; `key-not-valid`; `bad-signature`; `wrong-org` (the statement's `org` is not the
reader's) and `wrong-instance` (its `instanceId` is not the one the reader asks about, the platform's path); `too-long-lived`;
`not-yet-valid` (60 s of skew, the contract's); `expired` (no grace); `stale-revision` and `revision-conflict` against
the held `{revision, digest}` for that instance. A `retired` statement verifies and reads `status: "retired"`: the
reader stops serving or accepting the instance; a statement is never re-used after a retirement because its revision
is lower. `refreshDue` from 24 hours before `expiresAt`.

**IS-3, the platform's four checks** (PLAT-146 on `instance_put` for `org:<id>`) are IS-2 with its context: the
signature by the organization's applied key set; `instanceId` equal to the path and `org` equal to the record's
`subject`; the expiry within the clock skew; a `revision` not below the one accepted (`stale-revision`). The platform
stores the `digest` and `revision` the verdict returns.

**IS-4, the issuer's duties.** The organization server issues a statement only on a record an owner or an administrator
made (`org.instance_added`; a level decision where the server reads levels, DEC-0162 LV-7), re-issues each active one
at least a day before `expiresAt`, issues `status: "retired"` at a higher revision on `org.instance_retired` and none
after it, and never signs one revision with other bytes.

**IS-5, rules.** One rule code (kind `org-instance`, `FAC-SEM-177`): the times strict and in order and the 7-day life;
the origin's form and the lists of `status` and `placement` are the schema's.

**IS-6, vectors.** `fixtures/vectors/org-instance.json`, written by `tools/vectors/org-instance.ts` with deterministic
test keys (each seed the SHA-256 of a published label), so a port reproduces every `sig` (the platform's request, as
for `entitlement/1` and `org-membership`).

## What it does not decide

The public readers list `GET /fabric/membership/v1/{org}/readers` the server's project proposes for the hub's check of a
service's declared `levels` audience: membership's *Not decided here* item, waiting for Fabric's word, and a separate
row. How an instance is created and billed: the platform's and the product's.

## Open points for the decision

1. The 7-day life: an instance changes far less often than a membership (24 hours), and the platform reads it at
   `instance_put`, not on every call; the daily re-issue keeps a retirement effective within a day.
2. `placement` as three words rather than the hosting products of `entitlement/1`: a member's machine and a PassionCode
   service host instances no hosting product names.
3. `product` stays opaque: the contract has no product register.

## Next

The DEC with `schemas/org-instance.schema.json`, `src/org-instance.ts` (`verifyOrgInstance`, the rule), the register
row, the vectors and their generator, membership's restatement (a section *Instances*) and the conformance rows for the
organization server (issuer) and the platform and products (verifiers); read under the finish-line rule; then the
board reply on thread `fb41cd09`.
