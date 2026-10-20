# The partner channel: a partner's keys, its agents' usage and its delegation

DEC-0090 · rule codes `FAC-SEM-122`, `FAC-SEM-123`, `FAC-SEM-124` · code
[`src/estate-record-rules.ts`](../../src/estate-record-rules.ts) (`placementTrust`, `partnerScopes`),
[`src/partner-usage.ts`](../../src/partner-usage.ts) (`partnerUsage`), [`src/activity-rules.ts`](../../src/activity-rules.ts)
(`partnerRead`), [`src/delegation.ts`](../../src/delegation.ts) (`isPartnerActor`) and
[`src/delegation-rules.ts`](../../src/delegation-rules.ts) (`partnerGrantRules`) · vectors
[`fixtures/vectors/partner-usage.json`](../../fixtures/vectors/partner-usage.json), written by
[`tools/vectors/partner-usage.ts`](../../tools/vectors/partner-usage.ts) · tests
[`test/partner-usage.test.ts`](../../test/partner-usage.test.ts), [`test/partner-channel.test.ts`](../../test/partner-channel.test.ts),
[`test/contexts.test.ts`](../../test/contexts.test.ts)

The operator's standing decision SD-1 (2026-10-19): partners (integrators, agencies, agent studios) build paid agents
on the platform and sell them to companies as a setup; a company that comes through a partner pays PassionCode only for
the cloud its agents run on. The contract's part is PA-06 (board thread `6e66a023`, fabric-workspace `knowledge/roadmap.md`
RM-31): what a partner's signed package may be trusted for, what a partner may read of its agents' usage, and how a
company's owner lets a partner act on the company's agents. The first organization server's PA-01 (board, 2026-10-19) decided the
partner organization's id: an ordinary organization id, so a partner is named by its organization context,
`org:<partnerOrgId>`, as passioncode-platform's ADR-0007 does.

## A partner's publisher key, trusted per context (FAC-SEM-122)

A publisher key is a closed JWK (`delegation-jwks.schema.json`), so a partner's scope is a member of the estate record
beside it: `publisherScopes[]`, each `{kid, partner, contexts}`.

| Member | What |
|---|---|
| `kid` | a key of `publisherKeys` |
| `partner` | the partner organization that holds the key, `org:<partnerOrgId>` |
| `contexts` | 1 to 64 distinct organization contexts (`orgContextId`) a placement under the key may be in; never `personal` |

A key named there is a partner's: `placementTrust(record, machine, agentRef, context)` hands it to `verifyPackage` only
for a placement in one of its contexts, and answers no key (`{publisher: []}`) for one elsewhere, so the package is
refused `unknown-key` (PK-6). `FAC-SEM-122` refuses, on `estate-record`, a placement under a scoped key outside its
contexts, a key scoped twice and a scope naming a key the record does not pin; on `estate-placement`, an installation
under a scoped key outside its contexts. A key taken from a listing rather than the estate record is not narrowed by a scope, so a partner's key is trusted only
from the record. A key no scope names keeps DEC-0051's meaning, so a record without
`publisherScopes` reads as before.

## A partner reads its agents' usage (FAC-SEM-123)

The organization server already joins each `grant.usage` to the agent a share registration names (DEC-0086's join,
GJ-6). It holds, from its catalog, the publisher names each partner publishes under (the first organization server's
PA-03). `partnerUsage({usage, publishers, step})` is what it shows the partner:

- `usage`: one organization's joined rows `{agentRef, day, calls, unpricedCalls, costUsd}` (a partner that serves
  several companies is answered per company); a row not joined to an agent is never
  shown to a partner;
- `publishers`: the partner's publisher names; `step`: `day` or `period`;
- the answer: `{cells}`, one per `agentRef` and UTC day (or one per `agentRef` for the period), ordered by `agentRef`
  then day, each `{agentRef, day, calls, unpricedCalls, costUsd}`; `costUsd` is `null` exactly when every call in the
  cell is unpriced (`FAC-SEM-038`'s rule), else the sum of the priced costs, smallest first, so the order of the rows
  does not change a cell; a row of another publisher adds nothing; a
  malformed input is `{fault: "input-invalid"}`.

A cell carries no person, device or grant: a partner sees what its agents did, never who used them. A cell may still be
one person's usage, when only one member uses an agent; a minimum population per cell is not decided here. Each read is
logged in every contributing member's access log (OD-1) as `reader: {service: "org:<partnerOrgId>", role: "partner"}`,
scope `activity.usage`, `step` `day` or `period`. `FAC-SEM-123` (kind `access-log-disclosure`) refuses a partner entry
read as a person (`reader.user`) or with no `service`, of any other scope, at any other step, or keyed by a device.

## Owner to partner to agents (FAC-SEM-124)

A company's owner lets a partner act on the company's agents with a standing grant whose `principalKind` is `partner`:

- its `principal.id` is the partner, `org:<partnerOrgId>`; its `context` is the company's own `org:<orgId>`, never
  `personal` and never the partner's; being in an organization's context, its `meta.id` is a share grant id
  (`urn:fabric:share:<32 hex>`, `FAC-SEM-117`, [share registration](share-registration.md));
- a token minted under it is for the owner who issued the grant (`sub` is the grant's `issuer`), and its chain ends in
  the partner: the partner's agent outermost, and inside it the partner actor `{partner: "org:<partnerOrgId>"}`
  (`delegation-token.schema.json#/$defs/partnerActor`), which carries no `act` and counts toward DL-6's depth;
- an onward token keeps the parent's chain (DL-5, `FAC-SEM-050`), so the partner stays innermost and the chain grows by
  one agent outside;
- a partner actor stands in no chain under another kind of grant.

`FAC-SEM-124` (kind `delegation-mint`) refuses each break at the hub, which alone sees the grant. A verifier
(`verifyDelegation`, DL-13 step 5) admits a partner actor only innermost and never outermost; it returns it in `chain`, so a callee sees on whose behalf, through which partner, the
call runs.

## Compatibility

Additive. `publisherScopes` is a new optional member of `estate-record/1`; `partner` a new `principalKind`; the partner
actor a new shape inside `act`. A record, grant or token without them reads as before. A reader pinned before DEC-0090
refuses a record that carries `publisherScopes`, a grant whose kind is `partner` and a token whose chain holds a partner
actor (closed schemas), so a partner channel needs the reader at this pin. `contractVersion` stays `0.1.0`.

## Who adopts it

- **The first organization server** shows a partner `partnerUsage`'s cells, logs each read as above, and holds each
  partner's publisher names (its PA-03).
- **Fabric** (the hub) mints partner-grant tokens as above and verifies the partner actor.
- **Every verifier of delegation tokens** (Project Observatory's node, fabric-agent-adapter's kits) re-vendors
  `verifyDelegation` at this pin, or refuses every partner-grant token at DL-13 step 5.
- **Project Observatory's node** verifies a partner's package under the record's scope before it installs it in a
  company's context (its PA-10).
- **fabric-agent-adapter** signs a partner's packages with the partner's key (its PA-07).

The board row is CT-58.

## Not decided here

- The partner console.
- A minimum population per cell, so a cell is never one person's usage (activity's summaries keep `minPopulation`).
- Where the owner and the company see the spend made under a partner grant: a collector sends `grant.usage` only for
  a share grant a share registration names, and share registrations derive from the record's `shareGrants`.
- How an owner revokes or hands over a partner (RM-10, the first organization server's PA-02 with Fabric).
- Billing: a partner-channel order holds only `hosting` (passioncode-platform ADR-0007).
