# Design 2026-11-12: authority levels, approve by level (CT-250)

**Status:** the design CT-250 owes by 2026-11-13; the decision (one DEC, its number reserved when it is drafted)
follows by the organization slice of 2026-11-21. Nothing here binds a product until that DEC lands: the rules below are
proposals, numbered `LV-*` so the DEC can keep or renumber them. The autonomy profile per place (CT-285) and the
estate-scoped manager (CT-252) are designed beside it and read the levels this page defines.

**Asked by:** fabric-workspace's board request `4a1bf8d6` (thread `8da128cf`, 2026-11-11, line 1.2 of its unified plan:
CT-250 first, because the organization product and the platform's PLAT-146 need it for the RM-35 slice of 2026-11-21), under the operator's
instruction of 2026-11-11 (fabric-workspace session `fd5dfcf0`, quoted in the thread's first message `0b53db06`).

**The operator's decision it implements** (2026-11-06, fabric-workspace session `74a9440a`, relayed on board threads
`eefa7959`, message `23746581`, and `8bd78e76`; recorded verbatim in fabric-workspace `knowledge/authority.md`, section
*Access levels: who approves*, at `73171ed0`): four levels, the organization's owner (billing, and everything an
administrator manages), the organization administrator (the whole organization), the project architect (one project)
and the user (what they were granted). A command from the owner, an administrator, or an architect in their project,
and from the agents acting for them, is approved at once and recorded with the approver; a user's request goes through
the approvals the product provides; only the person's physical steps stay. North Star gap G2
(fabric-workspace `knowledge/north-star.md` at `73171ed0`, section 14).

Line numbers in this design cite the repository at `a054fdc6` (main on 2026-11-12, when it was written); a
later change may move them, so read each citation by its rule id or section first.

## What the contract says today

| Where | What it says | Why it blocks the levels |
| --- | --- | --- |
| [membership](../../specification/membership.md) line 53, `schemas/org-membership.schema.json` lines 46 to 50 | `role` is `owner`, `admin` or `member`; a finer role travels in `extensions` and grants nothing | no architect, and no project a role covers |
| [membership](../../specification/membership.md) OL-6, line 342 (DEC-0133) | a reader reads an attestation's `owner` or `admin` for display and routing, never as authority | a level cannot stand as a decision |
| [membership](../../specification/membership.md) OM-1, line 44 (DEC-0063) | every member of the attestation is always present; a changed list is a new type | a `projects` member needs `org-membership/2` |
| [service](../../specification/service.md) AP-2, line 1271 (DEC-0121); `schemas/decision.schema.json` | a `relayed` action takes `{by: "operator", via: "relayed-instruction", ...}` from a T0 or T1 caller; without it `operator-decision-required` | the only approver a decision can name is the operator |
| [delegation](../../specification/delegation.md) DL-26, line 482; DL-17 and DL-18, lines 292 and 306 | inside the boundary the operator's instruction is the authority; a T2 caller needs an `approval/1` per effect | an administrator's agent on the administrator's own machine is T2 to the organization's services, so each effect waits on an approval |
| [delegation](../../specification/delegation.md) MD-3 and MD-5, lines 589 and 629 (DEC-0125) | a mandate is taken only from T0 or T1; a T2 caller's mandate changes nothing | a level holder's task cannot travel to the organization's services |
| `schemas/delegation-token.schema.json` | claims `iss, sub, act, aud, scope, effect, grant, spend, project, task, iat, exp, jti` | nothing binds a membership attestation to the caller |
| [governance and roles](../../specification/governance-and-roles.md) *Approval separation*, line 67 | an agent never approves its own promotion, grant, checker rule or policy change | stays; the levels must not weaken it |

## The design

**LV-1, the architect and its projects.** `org-membership/2` is `org-membership/1` with two changes, and nothing else
(OM-1 makes it a new type):

- `role` is `owner`, `admin`, `architect` or `member`;
- `projects`, present exactly when `role` is `architect`: 1 to 64 project references, each once, in the form a binding
  names its `project` ([identifiers](../../specification/identifiers.md)), the projects this architect administers in
  the organization.

An issuer maps its own roles onto these four, as OM-1 says for three. It issues `/2` only to an audience it registered
as a `/2` reader; to a `/1` reader it issues `/1`, where an architect reads as `member` (it grants less, never more).
The verifier `verifyOrgMembership` (`src/org-membership.ts` line 305) gains the `/2` shape, with one new semantic rule:
`projects` present exactly for an architect, each reference once.

**LV-2, a role becomes a level, for decisions only.** OL-6 is amended: the role of an accepted `org-membership/2`
attestation is the holder's **level** in that organization, and a level stands as a decision as LV-4 says. It still
proves no administrator for signing: the organization's member list, key sets and releases are signed only by the
credentials OM-3 lists, and nothing on this page changes who signs them. The levels order as `owner` ⊇ `admin` ⊇
`architect` (in its `projects`) ⊇ `member`; `member` decides nothing by its level.

**LV-3, the level decision.** `decision.schema.json` takes a second form beside the operator's, `{by: "level", via:
"level-command", level, org, project?, action, target?, instruction, at, membership}`:

- `level` is `owner`, `admin` or `architect`, at most the attestation's role;
- `org` is the attestation's `org`; `project` is the project the action acts in, required when `level` is `architect`;
- `action`, `target`, `instruction` and `at` are AP-2's and AP-3's, the instruction being the level holder's words
  about this action (an agent sets it only for words its own holder gave it, AP-3's sources and boundary unchanged);
- `membership` is the holder's `org-membership/2` attestation whose `audience` is the service that reads it.

**LV-4, what makes it valid.** A service takes a level decision only when all of these hold, and then as AP-2 takes the
operator's: the attestation verifies (`verifyOrgMembership` under the key set the service applied for that
organization's pinned root), its `status` is `active`, its `audience` is this service, its `org` is the decision's, its
role covers `level`, and for an architect the action's project is among `projects`; the decision is within AP-2's
window and also before the attestation's `expiresAt`; and the call binds the attestation to its caller (LV-5). An action
in no project is decided only by `owner` or `admin`.

**LV-5, binding the attestation to the caller.** The attestation names a person's pairwise subject, not the caller, so
a copy of it decides nothing by itself. A level decision is taken only from a call that presents a delegation token
(DL-13) whose new claim `mem` is the attestation's `digest`: the hub that mints the token checks that the attestation is
its own principal's in that organization's context (it verified it for its person, OM-2) before it writes `mem`. That
holds at every tier: at T2 the token is required anyway (DL-8), and a T0 or T1 caller presents one when it carries a
level decision (DL-26 already lets it present one). A T0 or T1 call without a token keeps today's path: the operator's
decision or mandate (AP-2, MD-3), never a level.

**LV-6, what a level stands as.** Inside its scope (its organization, and for an architect its projects):

- the operator's decision of AP-2 for a `relayed` action, at every tier;
- the `approval/1` of DL-17 and DL-18 for a T2 caller's effect, so a T2 caller with a bound level decision is not
  refused `approval-required`;
- the operator's word in a mandate: `mandate/1` gains `by: "level"` with the same `level`, `org`, `project` and
  `membership`, travels as MD-2 says, and is taken from a T2 caller too when a token binds it (an amendment of MD-5),
  covered calls being recorded `via: mandate` with the level;
- any approval a product asks before a step (a paid run, a send), as MD-3 says for a mandate.

**LV-7, the bounds.** A level never covers what AP-4 and MD-6 keep for the person's body: a sign-in, a consent, a
payment or top-up, a secret typed in or handed out, a passkey signature, a comparison of codes, spend above a limit.
The money limits bind at every level (L0, the project's L1, each key's own ceiling). AP-5 and governance's approval
separation hold: a holder's agent never approves its own promotion, grant, checker rule or policy change on its own
account. `change-policy` is decided by `owner` or `admin`, and by an `architect` only for a policy of one of its
projects. A personal context has no levels: there the operator is the only approver and AP-2 is unchanged. A level of
one organization decides nothing in another organization or in a personal context.

**LV-8, the user.** A `member`'s request carries no level decision. It goes through what the product provides:
an `approval/1` from a level holder, the service's own elicitation, or the operator's decision where the product is
the operator's. A product never turns a member's request into a level decision.

**LV-9, the record.** The service records `{by: "level", level, org, project?, approver, membershipDigest, revision,
action, target?, at, caller}`, `approver` being the attestation's pairwise `subject` and `caller` the identity the
service authenticated, never one the call names. As for AP-2, `instruction` stays in the service's own audit record
and never reaches the events feed, a usage report or a page another party reads.

**LV-10, refusals.** No new error code. A level below what the action needs, or an architect outside its projects, is
`operator-decision-required` with `data.detail` `level-insufficient: <owner|admin|architect>` (the agent asks a holder
of that level, as MD-4 asks for the rest). A level decision that fails LV-4 or LV-5 is `decision-invalid` with
`data.detail` `level-membership: <problem>` (the verifier's problem name), `level-unbound`, `level-audience` or
`level-expired`. A service that does not read level decisions yet answers as today, `operator-decision-required`, which
is safe: the agent falls back to the operator's decision.

**LV-11, ending.** A membership that ends or is suspended (OM-5, OM-6) ends its level at once: a decision or mandate
that carries an attestation the service no longer accepts is `decision-invalid`, even inside AP-2's window.

## What the DEC owes

- **Schemas:** `org-membership.schema.json` gains `/2` (LV-1); `decision.schema.json` a `oneOf` with the level form
  (LV-3); `mandate.schema.json` `by: "level"` and its members (LV-6); `delegation-token.schema.json` the optional `mem`
  claim (LV-5); the actions extension's audit shape, if the DEC makes LV-9 a schema rather than a rule.
- **Code:** `verifyOrgMembership` for `/2`; `actionDecision` (`src/actions.ts` line 117) reads a level decision with
  the verified membership and the token's `mem`; `mandateCovers` (`src/mandate.ts`) for a level mandate; the DL-18
  check accepts a bound level decision for a T2 effect.
- **Vectors:** an owner, an admin and an architect deciding a `relayed` action; an architect outside its projects
  (`level-insufficient`); a copied attestation without `mem` (`level-unbound`); an attestation for another audience;
  an ended membership inside the decision's window; a level decision against a human step (refused `human-step-required`);
  a level mandate from a T2 caller, covered and not covered; a `/1` reader given an architect.
- **Rule codes:** two `FAC-SEM` codes reserved with the DEC: the `/2` shape (architect if and only if `projects`) and
  the level decision's validity (LV-4, LV-5).
- **Pages:** membership (OM-1's table, OL-6, *Who adopts it*), service AP-2 and AP-4, delegation DL-17, DL-18, DL-26,
  MD-3, MD-5 and MD-6, governance's approval separation, conformance's rows and register.

## Who adopts it

From North Star G2's row (fabric-workspace `knowledge/north-star.md`, gap G2): the organization product (its levels row; the roles'
source of truth, which issues `/2`), the platform (PLAT-141, PLAT-146), Fabric (CO-523: its hub writes `mem`, its
Agent access and board gates read levels), Project Observatory (OBS-377), Switchboard (SB-291), Fabric Inbox (B-232),
Fabric Dashboards (FD-164), the adapter (FAA-249, its kits' `actionDecision`), the launcher (PC-162), the copy service
(AUTH-01) and every agent with `relayed` actions. Until a product adopts it, its agents keep treating an
administrator's relayed command as the operator's («one approval for all agents», `knowledge/authority.md`), which the
DEC does not change.

## Questions for the operator, with the default the DEC takes

The DEC takes each default unless the operator answers otherwise before 2026-11-21.

1. **Does a level stand as the operator's word for a source hand-over** ([source](../../specification/source.md#handing-over),
   DEC-0149)? Default: yes for an organization's own agents, `owner` and `admin` for any of them and an `architect` for
   its projects', always with the exact target the hand-over names; never for a personal agent.
2. **May an architect change a policy of its own project** (`change-policy`)? Default: yes, within its projects only.
3. **How many projects may one architect attestation name?** Default: 64; more is a second attestation.
4. **Does the owner's billing need a level of its own beyond `admin`?** Default: no; a payment or top-up stays a human
   step (AP-4), and the owner's level decides everything an administrator's does.
5. **A level decision without a delegation token at T0 or T1** (LV-5)? Default: not taken; the call keeps the
   operator's path. This also leaves CT-168's question (a hostile local process) where it is.
6. **Does an organization product's own signed delegation travel to other products?** The organization product
   (its levels row) designed one (asked on the board 2026-11-11, thread `eefa7959`, message `6cb2a333`): an owner or
   an administrator signs once, with a passkey, a delegation to one agent token for named kinds of act and up to 90
   days, and the agent then acts inside it with each act journaled. Default: it stays inside that product, as its own
   record in its own namespace. What travels between products is the level decision (LV-3) and, where an act needs
   standing permission, a `mandate/1` the hub issues on that decision (DEC-0125); a product that later needs to honour
   such a delegation asks for it here and it is mapped onto `mandate/1`, never added as a second traveling form.

## Not decided here

- The autonomy profile per place, which a level holder changes (CT-285), and the estate-scoped manager's role slot
  (CT-252): their own designs, reading LV-2's levels.
- Calls only within an organization (CT-251), which bounds where a level can be presented at all.
- How the hub learns which audience a service is, to fetch the attestation it presents (beside OM's *Not decided here*,
  attestation delivery).
- A faster end than an attestation's day (an organization revocation delta), additive when a reader needs it.
