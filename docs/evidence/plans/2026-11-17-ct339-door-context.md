# Design: the organization a key-issuing door proves (CT-339)

**Status:** draft, 2026-11-17 (DC-7 added the same day for board request `6a1c4b6f`), no blind reading yet; to be read on three tiers until two consecutive rounds are clean,
then proposed as a DEC (the DEC is normative where the two differ). Row [CT-339](../../backlog.md); the request:
fabric-agents-database's board message `80429475` (thread `92e6c78a`, answer due 2026-11-24), relaying the operator's
rule from board request `c612a3e2` (thread `4a5879bd`, session `a1c9849b`, 2026-11-17).

## What is asked

The operator's rule: an organization's PM agent issues access only to its own organization's agents, a machine that
hosts several organizations never mixes them, and the hard gate sits at the contract level. The agents database's
pattern `org-key-doors` 1.0.0 (its D-57) drops at start every door of another organization or of the personal side and
refuses to issue through a door it did not admit (`key.door_dropped`). It reads the door's name and the organization its
configuration row declares, so a door that names the right organization is admitted whoever runs it. Its hook
`prove(door) -> organization or none` reads `proven` only when it verifies a claim, and there is no claim to verify.

Asked of the contract:

1. an organization claim a door carries and a caller verifies, naming the organization's context, issued or signed by a
   party the caller trusts, never asserted by the door itself;
2. a rule for the caller: a door whose claim is absent, unverifiable or names another context is not used for issuing
   in that context, with a typed refusal, and the personal context never issues for an organization;
3. vectors: the same context, another context, the personal context, no claim, a forged claim.

A **door** here is what an issuing agent issues a key through: a provider account's management credential held in a
vault slot on a machine (Observatory's issuing tools are of this kind), or a remote service of an organization that
issues client keys to callers (an organization's cloud instance).

## What the contract says today

- **Context ids.** A context is `personal` or `org:<orgId>` (DEC-0082, [contexts](../../specification/contexts.md));
  DEC-0172's `asked.context` carries the same value. The claim names one of these, nothing else.
- **A remote door: `org-instance/1`** (DEC-0170, [membership](../../specification/membership.md#instances-dec-0170),
  IS-1 to IS-4). The organization server's statement that one instance (`instanceId`, `product`, `origin`, `placement`,
  `status`, `revision`) runs for `org:<orgId>`, signed by a signing key of the organization's `org-key-set/1`, whose root
  the person pins in the estate record (OM-2, OM-3). `verifyOrgInstance(statement, {now, org, instanceId, keySet, held})`
  (`src/org-instance.ts`) checks it offline and answers `wrong-org`, `bad-signature`, `unknown-key`, `key-revoked`,
  `expired`, `not-yet-valid`, `stale-revision` or `status: "retired"`. The door cannot assert it: only the
  organization's keys sign it. How a statement reaches a reader, and how an instance with no `https://` name of its own
  is stated, are open (membership.md *Not decided here*).
- **A local door: the estate record's secret placement** (DEC-0082, [estate record](../../specification/estate-record.md),
  `FAC-SEM-075`). `machines[].secrets[]` is `{agentRef, slot, from, context?}`, absent `context` meaning `personal`; a
  slot is placed once per (machine, `agentRef`, slot, context), for an instance placed in that context.
  `verifyEstateRecord(record, {parent | authorities, at})` (`src/estate-record-rules.ts`) checks the record under the
  person's pinned authorities.
- **No caller rule.** Nothing says an issuer reads a door's context from either source, nor refuses a door whose context
  is not the one it issues in.

## The design

**DC-1, the reading.** `doorContext(door, trust)` answers `{ok: true, context, source}` (`source` `org-instance` or
`estate-record`) or `{ok: false, refusal, detail?}`. It reads a context only from:

- a remote door: an `org-instance/1` statement that `verifyOrgInstance` accepts with `status: "active"` under the key
  set the caller applied for that organization (`verifyOrgKeySet` under the root its estate record pins), whose `origin`
  equals the origin the caller calls as written, and whose `org` is the context asked about;
- a local door: a secret placement of the verified estate record for (this machine, the door's `agentRef`, its slot),
  whose context is the one asked about.

Never from a door's name, a configuration row, a descriptor's own member or Observatory's map: those stay hints a caller
may show, never a ground to issue.

**DC-2, the rule.** An issuer issuing in context C uses a door only when `doorContext` answers C. Hence `personal` never
issues for an organization, an organization never issues for `personal`, and one organization never issues for another.
A caller that issues in several contexts on one machine runs the reading per issue, never once per door at start.

**DC-3, the refusals.** One closed list, in this order of checks:

| Refusal | When |
|---|---|
| `door-claim-absent` | no statement for a remote door, or no secret placement for a local one (a door reachable only at a port, or at `http://127.0.0.1` on a member's machine, is here until membership.md's open point is decided) |
| `door-claim-invalid` | the statement or the record fails its verifier (`detail` the verifier's problem: `bad-signature`, `unknown-key`, `expired` and the rest), the statement reads `retired`, or its `origin` is not the origin called |
| `door-organization-mismatch` | the claim verifies and names another context than C (the personal context included) |

**DC-4, the route of a statement.** A remote door hands its current `org-instance/1` statement under a new extension key
`extensions/org-instance/0.1` in its well-known document, the statement as signed, so a caller reads it where it reads
instance facts (DEC-0173 IF-1) and verifies it itself; a host preserves and ignores the key when it does not know it.
The statement's signature, not the document's transport, is the proof. This settles one part of membership.md's open
route (to a caller); the route to the platform stays the platform's.

**DC-5, the vectors** (`fixtures/vectors/door-context.json`, written by `tools/vectors/door-context.ts`): a remote door
of the same organization; of another organization; a personal-context local door asked for an organization; an
organization's local door asked for `personal`; a door with no statement and no placement; a statement with a forged
signature; signed by a revoked key; expired; retired; with another origin than the one called; and a local door placed
in two contexts read for each.

**DC-6, the revision.** Additive: a new module (`src/door-context.ts`), a new extension schema
(`service-org-instance-extension.schema.json`), a semantic rule for the extension's value (a well-formed
`org-instance/1`), the vectors; no existing schema, rule or verifier changes. `org-instance/1` and the estate record are
read as they stand.

**DC-7, the door's own side.** Asked by an organization's PM agent (board request `6a1c4b6f`, thread `a4f07b9c`,
2026-11-17, the same operator rule from session `a1c9849b`): the door itself refuses an issue call from another
organization, so a misplaced key fails at the door and not only at a careful caller. An organization's door that offers
`*.keys.issue` issues the key carrying scope `issue` only on a level decision of its own organization (`owner` or
`admin`, under the `org-membership/2` attestation and key set its authority extension declares, LV-7 and CF-3), binds
that key to its own context at issue, and on every `*.keys.issue` call compares the calling key's bound context with its
own verified context (the one its `org-instance/1` statement names): a key bound to another context, the personal one
included, is refused `issuer-organization-mismatch` before any provider call. A key with no bound context (issued before
the rule) is refused the same way until it is reissued. Vectors add: an issue key of the same organization (accepted),
of another organization, of the personal context, and unbound. A semantic rule on the door's authority extension reads
that `*.keys.issue` declares `admin` at least in an organization's context. Open for the reading: whether CF-3's
member-key door (membership.md *Not decided here*) and this issue key are one door or two.

## Limits

- **A local door is the person's own word.** The estate record is signed by the person's passkeys, not by the
  organization: on the operator's machine the operator's record decides which slot serves which context. That is the
  trust the contract already gives a placement (DEC-0082); an organization that needs its own word on a local door
  signs an `org-instance/1` for it once such an instance can be stated (membership.md's open point).
- **Issuing is not checked here.** The contract states which door may serve a context; the issuing agent applies it
  (`org-key-doors`' `prove`), and the provider's own account split stays the provider's.

## Alternatives considered

- A new hub-signed `door-claim/1` under the context's hub key (DL-14a): refused for a remote door, since
  `org-instance/1` is already signed by the organization's own keys, a stronger party than the person's hub; kept as the
  candidate for a local door if a reading shows the estate record is not enough.
- A member on the descriptor or the well-known document asserting the organization: refused, it is the door's own word
  (the request's own condition).

## Owed after the DEC

an organization's PM agent is told the DEC number on thread `a4f07b9c` (request `6a1c4b6f`, completed 2026-11-17 with this
date). Fabric Dashboards and Observatory read DC-4's extension where they show a door; fabric-agents-database plugs
`doorContext` into `org-key-doors` as `prove` and raises the pattern; the organizations' PM agents get it through the
`org-administrator` template; a board message to each.
