# Governance, roles and data policy

`covers: REQ-013, REQ-014, REQ-016`

## Role registry

Core role names are `ceo`, `product-manager` and `developer`. Optional roles use
lowercase namespaced identifiers, for example `fabric.example/seo-analyst`.

The CEO owns estate-wide policies, global insight promotion and cross-project
priority. The product manager owns one project's backlog, work graph and approval
of project learning revisions. Developers implement claimed work. Optional roles
produce observations, proposals, artifacts or scoped external actions and do not
become a second decomposition authority.

## External effects

Publish, send, reply, charge, delete, merge, deploy and change-policy are effect
classes. Default authorization is `draft-only`. A standing grant MUST name:

- grant ID and immutable revision;
- principal/provider and project;
- exact effect classes and resource patterns;
- allowed channels and recipient constraints — absent `channels` allows no outbound channel and absent
  `recipientConstraints` no recipient outside the project (the schema keeps both optional; the safe default is the
  meaning of their absence, DEC-0064);
- data classifications allowed;
- start and expiry, `expiresAt` after `startsAt`; an `active` grant is inside its window `[startsAt, expiresAt)` when evaluated (`FAC-SEM-097`);
- rate and amount limits where applicable (amounts: the grant's `spend` block, [spend policy](spend-policy.md), DEC-0037);
- for a grant that lets an agent call another agent: the callee (`audience`), its capabilities and the effect
  ceiling (`effectCeiling`) — a delegation grant ([delegation](delegation.md), DEC-0039). A delegation grant
  MAY omit the effect classes: it then authorises reads and drafts only;
- idempotency policy;
- issuer and revocation status;
- optionally the context in which the principal uses it (`context`: `personal` or `org:<orgId>`), never `personal` for
  an external principal (`FAC-SEM-110`, [contexts](contexts.md), DEC-0082). The grant's access level is these fields
  themselves; a named level is a host's preset that fills them.

An effect outside the grant is denied and returned as a draft or approval request.
An expired or revoked grant is never extended implicitly.

## Data classification

Every artifact, observation, evidence record and memory record uses one class:

| Class | Typical content | Global promotion |
|---|---|---|
| `public` | already public documentation or published post | allowed with provenance |
| `project-internal` | backlog, non-public design | anonymized insight only |
| `confidential` | source, strategy, private metrics | anonymized insight after policy review |
| `personal` | email, support message, user identifier | raw promotion forbidden |
| `credential` | token, key, session | storage in contract forbidden; reference only |
| `regulated` | legally controlled records | raw promotion forbidden; jurisdiction policy required |

A record's retention is resolved from the project data-policy rule for its classification: purpose, maximum duration
or durable basis, deletion mode and owner (DEC-0064; records do not each carry a policy). Shorter upstream obligations win. Deletion of evidence
content may leave a tombstone URI and hash when policy permits.

## Provenance

Claims carry producer, source URI, capture time, content hash when available,
transformation lineage and classification. A generated summary cites its inputs.
An external claim without a resolvable receipt stays `notVerified`.

## Approval separation

An agent MUST NOT approve its own global promotion, privileged grant, checker
rule change or policy change. Independent checker identity must differ from the
producing binding revision. Product manager approval is sufficient for ordinary
project settings; CEO approval is required for estate scope. An approved learning proposal or promotion names its
approver in `approvedBy`, who is never its author (`meta.createdBy`, `FAC-SEM-094`): the two ids compare by their normal
forms, so another spelling of the author's own id (`AGENT:x` for `agent:x`, `urn:Fabric:…` for `urn:fabric:…`) is still
the author ([identifiers](identifiers.md), DEC-0076). Every project an active assignment scopes has exactly one active
product manager (`FAC-SEM-006`), two spellings of one project id being one project.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| `FAC-SEM-094` | `learning`, `promotion` | an approved learning proposal or promotion names its approver, who is not its author, compared by normal form (DEC-0004, DEC-0012, DEC-0064, DEC-0076) |
| `FAC-SEM-097` | `grant-window` | a standing grant's `expiresAt` is after its `startsAt`, both strict RFC 3339; given `{grant, at}`, an `active` grant is inside its window at `at` (DEC-0064) |
