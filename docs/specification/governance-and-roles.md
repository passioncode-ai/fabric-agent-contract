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

### The estate's manager

DEC-0167 puts the estate's manager on the wire (Fabric's review M194, its ADR-0046; North Star gap G10). Rules MG-1
to MG-6; the code is `src/role-slot.ts`, the vectors `fixtures/vectors/role-slot.json`.

- **MG-1, no new role.** The roles stay `ceo` (the estate) and `product-manager` (one project). The estate's manager is
  whoever holds the estate's `ceo` slot; a manager session (Fabric's) is a holder, not a role.
- **MG-2, the scope on the wire.** A binding (`binding.schema.json`) and an execution context
  (`execution-context.schema.json`) carry `scope`, the same choice as a role assignment's: `{estate}` or `{project}`.
  With a project scope `project` is required and equals it (`FAC-SEM-174`, compared by normal form); an estate-scoped
  binding or context carries no `project`; without `scope` a record is scoped to the project it names, as before. A
  reader pinned before DEC-0167 refuses an estate-scoped record (its schema requires `project`), so it refuses rather
  than misreads, and a host writes one only once every reader of its bindings is at DEC-0167's pin.
- **MG-3, the role slot.** `role-slot/1` (`role-slot.schema.json`) records one slot `(estate, role, scope)`: the
  binding revision that holds it (`holder`), the epoch the estate's hub issued for that holder and since when. The
  epoch rises with every new holder and stays with the same one; a holder never chooses its own. Only the holder at the
  current epoch writes for the slot: a write at an older epoch is refused `slot-epoch-stale` even on a live transport,
  one at an epoch the hub never issued `slot-epoch-unknown`, and the current epoch from another binding revision
  `slot-not-holder` (`slotWrite`), the fencing the project board uses for a responder's generation
  ([project communication](project-comms.md)). `FAC-SEM-174` checks a slot's role against its scope (`ceo` the estate
  it names, `product-manager` one project) and a slot's next revision against the one before.
- **MG-4, one holder per slot.** An estate has exactly one active `ceo` (`FAC-SEM-005`) and so one `ceo` slot, per
  context in an organization's estate (DEC-0082); a slot's epoch never repeats. Two spellings of one estate id are one
  estate ([identifiers](identifiers.md)).
- **MG-5, who assigns a slot.** Assigning a slot is a `relayed` action of the estate's hub, effect `change-policy`: in
  the personal context by the operator's decision (AP-2) or mandate; in an organization's context by an authority level
  (DEC-0162, on branch `agent/ct250-levels-20261112` until it lands): `owner` or `admin` for the organization's `ceo`
  slot, an `architect` for the `product-manager` slot of one of its projects.
- **MG-6, a slot grants no approval.** Holding the `ceo` slot lets the manager route goals and assign product managers
  (it writes the registry under its epoch); it is never the operator's decision on anything. The manager acts on the
  operator's mandate or a level holder's, and approval separation holds: it never approves its own promotion or
  assignment.

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
An expired or revoked grant is never extended implicitly. A source hand-over (the agent's source reaching a place or
a person it was not at, as [source](source.md#handing-over) lists the cases) is a `publish` act of a person each time, which no standing grant authorises; a grant covering `publish` only
lets the call reach the action ([source](source.md#handing-over), DEC-0149).

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

An operator's decision an agent relays in `_meta.decision` is the operator's, not the agent's: an agent still MUST NOT
approve its own promotion, grant, checker rule or policy change on its own account, and MAY relay the operator's
approval of it: the proposal's `approvedBy` is then the operator's own principal, never the agent's, and the service's
audit records the relaying caller ([service](service.md#actions) AP-5, DEC-0121).

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-094"></a>`FAC-SEM-094` | `learning`, `promotion` | an approved learning proposal or promotion names its approver, who is not its author, compared by normal form (DEC-0004, DEC-0012, DEC-0064, DEC-0076) |
| <a id="fac-sem-097"></a>`FAC-SEM-097` | `grant-window` | a standing grant's `expiresAt` is after its `startsAt`, both strict RFC 3339; given `{grant, at}`, an `active` grant is inside its window at `at` (DEC-0064) |
| <a id="fac-sem-174"></a>`FAC-SEM-174` | `binding`, `execution-context`, `role-slot`, `role-slot-succession`, `role-slot-write` | a binding's or an execution context's project `scope` names its own `project`, compared by normal form; a `ceo` slot is scoped to the estate it names and a `product-manager` slot to one project; a slot's next revision keeps its estate, role and scope, a new holder at a higher epoch and the same holder at the same epoch; a registry's answer to a write is `slotWrite`'s (DEC-0167 MG-2 to MG-4) |
