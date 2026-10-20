# Brief: CT-58, the partner channel (PA-06)

Owner: fabric-agent-contract. Requester: fabric-workspace, the operator's standing decision SD-1 (2026-10-19), board
thread `6e66a023`, proposal PA-06; accepted in principle on that thread on 2026-10-19 with a pull request targeted by
2026-10-27. Track: fabric-workspace `knowledge/roadmap.md` RM-31.

## Source ledger

| Source | What it gives |
|---|---|
| Board thread `6e66a023` (SD-1, the platform's ADR-0007 reply, the contract's acceptance) | the three parts; the partner organization as `org:<partnerOrgId>` until the first organization server's PA-01 lands; a partner-channel order holds only `hosting` |
| DEC-0050, DEC-0051, `package.md` | `agentRef` is `urn:fabric:agent:<publisher>:<id>`; `verifyPackage(package, trust)` with keys pinned per role |
| `estate-record.md`, `src/estate-record-rules.ts` `placementTrust` | `publisherKeys[]`, a placement's `publisherKid` and `context`, `FAC-SEM-074`, `FAC-SEM-111` |
| DEC-0082, DEC-0086, `contexts.md`, `share-registration.md` | a grant's `context`, `grant.usage` joined to an `agentRef` (`joinGrantUsage`), OD-1 sums |
| `activity.md` access log, `FAC-SEM-067` | another person reads usage only as sums per UTC day or billing period, each read logged |
| `delegation.md` DL-2, DL-4, DL-5, DL-6 | the `act` chain, four deep (five for the meter), the grant's `principalKind` |
| `docs/evidence/retro.md` standing instructions | bounds checked against the schema, the privacy check on the committed tree, the push gated on its exit |

## Decisions to settle (one DEC: DEC-0090, codes FAC-SEM-122 to FAC-SEM-124, reserved by git CAS, key `ct58-partner-channel`)

1. **A partner's publisher key, trusted per context (FAC-SEM-122).** The publisher JWK is closed
   (`delegation-jwks` keys have `additionalProperties: false`), so the scope is a new optional estate-record member
   `publisherScopes[]`: `{kid, partner, contexts}`, `kid` a key of `publisherKeys`, `partner` the partner organization
   (`org:<partnerOrgId>`, an organization context id until the first organization server's PA-01 names its form), `contexts` 1 to 64 distinct
   organization context ids (never `personal`). A key named there is trusted only for a placement in one of its
   contexts: `placementTrust` hands no key for another, and `FAC-SEM-122` refuses a placement under it elsewhere, a kid
   scoped twice, and a scope naming a kid the record does not pin. An unscoped key keeps today's meaning.
2. **A partner reads its agents' usage (FAC-SEM-123).** The organization server holds which publishers each partner
   publishes under (its catalog namespaces, the first organization server's PA-03): `partnerUsage(joined, publishers, partner, step)` answers
   sums per `agentRef` and UTC day or billing period of the joined `grant.usage` whose `agentRef` publisher is the
   partner's, with no person, device or grant dimension. Each such read is logged in every contributing member's access
   log as `reader: {service: <partner org id>, role: "partner"}`, scope `activity.usage`, `step` day or period;
   `FAC-SEM-123` refuses a partner entry with any other scope or step, or with a device.
3. **Owner to partner to agents (FAC-SEM-124).** A grant whose `principalKind` is `partner` names the partner
   organization as its principal and the company's own `org:<orgId>` as its `context`; a token under it carries the
   partner as its innermost actor (`act` gains a partner actor `{org: "org:<partnerOrgId>"}`, only innermost), which
   counts toward DL-6's depth. A verifier admits a partner actor only under such a grant and refuses one anywhere else.

Open for the design stage: the partner's principal URI form (a revisionRef today), and whether the partner actor is a
new `act` shape or an agent id the hub registers for the partner.

## REQ table

| REQ | Requirement | Verified by |
|---|---|---|
| REQ-1 | scoped publisher keys in the schema, `placementTrust` and `FAC-SEM-074` | vectors and semantic fixtures |
| REQ-2 | the partner usage read: function, schema, access-log rule | vectors, `FAC-SEM` fixtures |
| REQ-3 | the partner grant and the partner actor in delegation | delegation vectors, schema fixtures |
| REQ-4 | spec pages, DEC, conformance rows, registers, backlog CT-58, handoff | docs checks, readings |
| REQ-5 | the board answer on `6e66a023` and the KB roadmap row | the posted message, the merged KB change |

Outcome: [the partner channel](../../../specification/partner-channel.md) and DEC-0090 supersede the design-stage forms
above (the partner actor is `{partner}`, `partnerUsage({usage, publishers, step})`, the rule codes 122 to 124, PA-01
decided). Item 3's "a verifier admits a partner actor only under such
a grant" is superseded too: the hub alone sees the grant (FAC-SEM-124 at mint); a verifier admits it only innermost.
