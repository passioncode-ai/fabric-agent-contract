# Design 2026-11-12: an estate-scoped manager on the wire (CT-252)

**Status:** the design CT-252 owes by 2026-11-13; its own DEC follows by the organization slice of 2026-11-21. Rules
are proposals numbered `MG-*`. It reads the levels of [the authority levels design](2026-11-12-ct250-authority-levels.md)
(`LV-*`) and keeps them apart: CT-250 is a person's authority in an organization, this page the estate's role slot and
the scope a binding and an execution context carry.

**Asked by:** fabric-workspace's board request `4a1bf8d6` (thread `8da128cf`, 2026-11-11). The row came from Fabric's
board message `123d3dba` (thread `77d88a2e`, 2026-11-06): Fabric's review M194 (D-MGR-01, D-MGR-02, fabric `1f4c30d6`,
`docs/evidence/specs/2026-11-06-fabric-manager-agent.md`) and its proposed ADR-0046. Fabric builds no slot and no field
version of its own until the DEC lands. North Star gap G10 (Fabric as the main agent; its manager session is wave D of
Fabric's CO-522).

Line numbers in this design cite the repository at `a054fdc6` (main on 2026-11-12, when it was written); a
later change may move them, so read each citation by its rule id or section first.

## What the contract says today

| Where | What it says | Why it blocks the manager |
| --- | --- | --- |
| `schemas/binding.schema.json`, `required` | `project` is required | a binding of the estate's manager would have to invent a project |
| `schemas/execution-context.schema.json`, `$defs/context.required` | `project` is required | the same for the manager's working context |
| `schemas/roles.schema.json`, `assignments[].scope` | `oneOf` `{estate}` or `{project}`; roles `ceo`, `product-manager`, `developer` or a namespaced role | the role model already has an estate scope, the wire does not |
| [governance and roles](../../specification/governance-and-roles.md) line 75 (`FAC-SEM-006`) | every project an active assignment scopes has exactly one active product manager | there is no matching rule for the estate's one manager, and no epoch |

## The design

**MG-1, no new role.** As Fabric's ADR-0046 proposes: the roles stay `ceo` (estate) and `product-manager` (project).
The estate's manager is whoever holds the estate's `ceo` slot; Fabric's manager session is a holder, not a role.

**MG-2, the scope on the wire.** A binding and an execution context gain `scope`, the same `oneOf` as `roles`
assignments: `{estate}` or `{project}`. `project` stays and is required exactly when `scope` names a project, equal to
it; an estate-scoped binding or context carries no `project`. A reader at an older pin refuses an estate-scoped binding
(its schema requires `project`), so it refuses rather than misreads; Fabric writes one only once every reader of its
bindings is at the DEC's pin.

**MG-3, the role slot.** `role-slot/1` records one slot `(estate, role, scope)`: `{type, estate, role, scope, epoch,
holder, since}`, `holder` being the binding's `revisionRef` and `epoch` a positive integer that rises with every new
holder. Only the holder at the current epoch writes for the slot; a write that carries an older epoch is refused
`slot-epoch-stale`, even on a transport that is still live (the fencing the project board already uses for a
responder's generation, [project communication](../../specification/project-comms.md)). The hub that keeps the estate's
registry issues the epoch; a holder never chooses its own.

**MG-4, one holder per slot.** `FAC-SEM-006` (one active product manager per project) gains its estate twin: exactly
one active `ceo` slot holder per estate (per organization context in an organization's estate), and the slot's epoch
never repeats. Two spellings of one estate id are one estate ([identifiers](../../specification/identifiers.md)).

**MG-5, who assigns a slot.** In the personal context, the operator (AP-2's decision, or the operator's mandate). In an
organization's context, a CT-250 level: `owner` or `admin` assigns the organization's `ceo` slot, an `architect` the
`product-manager` slot of one of its projects (LV-3, LV-4). Assigning a slot is a `relayed` action of the hub of effect
class `change-policy`.

**MG-6, a slot grants no approval.** Holding the `ceo` slot lets the manager route goals and assign project managers
(writes the registry under its epoch); it is not the operator's decision on anything. The manager acts on the
operator's mandate or a level holder's (LV-6), and AP-5 holds: it never approves its own promotion or assignment.

## What the DEC owes

- **Schemas:** `scope` in `binding.schema.json` and in `execution-context.schema.json`'s context, `project` required
  exactly with a project scope; a new `role-slot.schema.json`.
- **Code and rules:** `FAC-SEM-006`'s estate twin (one holder, a rising epoch); the epoch check a registry writer runs
  (`slot-epoch-stale`); one new `FAC-SEM` code for `role-slot/1`, reserved with the DEC.
- **Vectors:** an estate-scoped binding without `project`; a project-scoped one whose `project` differs from its scope
  (refused); two active `ceo` holders (refused); a write at an older epoch on a live transport (refused); a holder
  that names its own epoch (refused).

## Who adopts it

Fabric (CO-522 wave D step 3, its ADR-0046: the manager session's binding, context and slot), and every reader of
bindings and execution contexts (Fabric's own registry readers, the adapter's kits where they read a binding).

## Questions for the operator, with the default the DEC takes

1. **Where does the slot live?** Default: in the estate's registry as `role-slot/1` documents beside the bindings, the
   estate record unchanged.
2. **Is there one manager per organization context as well as the personal one?** Default: yes, one `ceo` slot per
   context, since a context's records never cross into another (DEC-0082).

## Not decided here

- What the manager may decide beyond routing and assignment: the operator's mandate and the levels (CT-250, CT-285).
- The hub's handover of a slot between machines (the hub move's own rules).
