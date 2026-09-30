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
- allowed channels and recipient constraints;
- data classifications allowed;
- start and expiry;
- rate and amount limits where applicable;
- idempotency policy;
- issuer and revocation status.

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

Each record carries retention policy: purpose, maximum duration or durable basis,
deletion mode and owner. Shorter upstream obligations win. Deletion of evidence
content may leave a tombstone URI and hash when policy permits.

## Provenance

Claims carry producer, source URI, capture time, content hash when available,
transformation lineage and classification. A generated summary cites its inputs.
An external claim without a resolvable receipt stays `notVerified`.

## Approval separation

An agent MUST NOT approve its own global promotion, privileged grant, checker
rule change or policy change. Independent checker identity must differ from the
producing binding revision. Product manager approval is sufficient for ordinary
project settings; CEO approval is required for estate scope.
