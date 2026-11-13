# Design 2026-11-12: an autonomy profile per place (CT-285)

**Status:** the design CT-285 owes by 2026-11-13; the decision (one DEC, designed with CT-250's) follows by the
organization slice of 2026-11-21. Rules are proposals numbered `AU-*`. It reads the levels of
[the authority levels design](2026-11-12-ct250-authority-levels.md) (`LV-*`).

**Asked by:** fabric-workspace's board request `4a1bf8d6` (thread `8da128cf`, 2026-11-11), which bundles CT-250, CT-252
and CT-285; the row itself came from board request `921edc61` (thread `a3a97cef`, 2026-11-09).

**The operator's decision it implements** (2026-11-09, fabric-workspace session `a616cbcb`, recorded verbatim in
fabric-workspace `knowledge/authority.md`, section *Autonomy by place*, at `73171ed0`): which acts an agent finishes end
to end without a person is a setting per place. A headless place (the always-on machine, an organization's space or
VM, its cloud) finishes everything by default, watched by agents and by each process's own checks; a person's own
computer follows the scenario the person or their administrator chooses. The owner, an organization administrator or
a project architect sets it within their level; the only gates left everywhere are the body's. North Star gap G19.

Line numbers in this design cite the repository at `a054fdc6` (main on 2026-11-12, when it was written); a
later change may move them, so read each citation by its rule id or section first.

## What the contract says today

| Where | What it says | Why it blocks a profile |
| --- | --- | --- |
| [service](../../specification/service.md) AP-2 and AP-3, lines 1271 and 1311 (DEC-0121) | a `relayed` action needs the operator's decision for that action; a standing rule in a file is not a decision | an assignment on a headless place has no one to ask |
| [delegation](../../specification/delegation.md) MD-1 to MD-6, lines 564 to 635 (DEC-0125) | the operator's mandate covers one task, narrows at each hand-over, never covers a human step, a source hand-over or `change-policy` | the right shape, but only per task and only the operator's words |
| [runners](../../specification/runners.md) | a runner descriptor says how a runner is driven, not what it may finish alone | no place knows its own autonomy |
| Fabric ADR-0168 (fabric `docs/adr/0168-...md`) | the machine's permission choice `fewer-prompts` starts runners without their prompts; Fabric's floor still refuses a floored effect (money, deletion, publication) in a `none` containment mode | the floor asks a person even where the operator said nobody watches |

## The design

**AU-1, the profile is a standing mandate of a place.** A place's autonomy is a `mandate/1` that is not tied to one
task: a new member `standing: {place, placeKind}`, `place` naming the machine, OS space, VM or cloud the profile
applies to and `placeKind` `headless` or `person`, with `task` naming the place's profile rather than one task, and the
usual `scope` (`effects`, `capabilities`, `actions`, `projects`, `perCallMaxUsd`). `kind` stays the type's constant
`mandate/1`, so a reader at an older pin refuses the unknown member rather than reading a standing mandate as a task's. Reusing the mandate keeps one way to say "these acts need no further word": its coverage
rule (MD-3), its narrowing chain (MD-2), its refusals (MD-4) and what never travels (MD-6) apply unchanged. AP-3's
"a standing rule in a file is not a decision" stays true: a profile is not a file an agent reads, it is a signed or
recorded decision the place's hub holds and hands on (AU-3).

**AU-2, who sets it.** Setting or changing a profile is an action of the place's hub, `autonomy.profile.set`, gated
`relayed` and of effect class `change-policy`:

- in the personal context, by the operator's decision (AP-2);
- in an organization's context, by a level decision (LV-3): `owner` or `admin` for any place of the organization, an
  `architect` only for a profile limited to its projects (`scope.projects` within its attestation's `projects`).

The record names the setter's level and approver (LV-9). A profile never widens its setter's own level: an
architect's profile covers only its projects, and nobody's covers what LV-7 and MD-6 keep for the person.

**AU-3, how it travels.** The place's hub holds the profile at a rising `revision`. When the dispatcher starts an
assignment at that place (Fabric CO-547, fabric `fbd00b82`: the board dispatcher and headless assignments), it hands
the assigned agent the profile as its mandate, the chain starting at that agent; every later hand-over narrows it as
MD-2 says. A call inside the boundary carries it in `_meta.mandate` as today (MD-3). A call to a T2 callee is bound by
the delegation token the hub mints for the assignment, whose new claim `prof` is the profile's digest and revision, as
LV-5 binds a level; the callee takes it as LV-6 takes a level mandate. A profile the hub replaced takes effect at the
next token the hub mints (tokens are short-lived, DL-13) and at the next assignment; a narrower revision is never
outrun by an older token for longer than that token's life.

**AU-4, the defaults.** A place with no profile recorded behaves by its kind:

- `headless`: every effect class, including deploy, merge, publish, send, delete and spend within the limits, and key
  issuance through the vault's doors; and Fabric's floor treats the profile's effects as decided, so a floored effect
  does not wait for a person;
- `person`: nothing beyond what the session's own person decides (today's behaviour), until the person or, in an
  organization's context on that computer, its administrator records a profile.

A profile on a person's computer is chosen from presets the hub offers (none, drafts only, finish everything) or set
in full.

**AU-5, the bounds.** No profile covers what MD-6 lists: a sign-in, a consent, a payment or top-up, a secret typed in
or handed out, spend above a limit, a passkey signature, a comparison of codes, a source hand-over, approving one's own
promotion, grant, checker rule or policy change (AP-5). A profile never covers `autonomy.profile.set` itself, so no
assignment raises its own place's autonomy. The money limits bind as everywhere (L0, L1, each key's ceiling).

**AU-6, watching.** A headless profile is valid only with its watcher declared: the place's record names the agent
that monitors its assignments (the North Star's monitoring agent), and each action an assignment finishes under the
profile is recorded `via: profile` with the profile's revision, the assignment and the caller the service
authenticated. A place whose watcher is not running answers as a `person` place until it is (the safest reversible
reading of «нет человека, который наблюдает»: an unwatched headless place is not what the operator described).

**AU-7, refusals.** As MD-4: `operator-decision-required` with `data.detail` `outside-mandate: <part>` for an act the
profile does not cover; `decision-invalid` with `profile-stale`, `profile-unbound` or `profile-unwatched`.

## What the DEC owes

- **Schemas:** `mandate.schema.json` gains the optional `standing` member `{place, placeKind}`; `delegation-token.schema.json`
  the optional `prof` claim; an `autonomy.profile.set` action in the hub's declared actions.
- **Code:** `mandateCovers` reads a standing mandate (its `expiresAt`, which the schema requires, is the hub's
  re-issue horizon, at most 24 hours, the hub stating it again from the profile) and refuses the profile's own action; the hub's dispatcher hands it on.
- **Vectors:** a headless default covering a deploy; a person place with no profile (today's refusal); an architect's
  profile outside its projects (refused at `set`); a profile raising its own autonomy (refused); a body gate under a
  headless profile (`human-step-required`); a narrowed revision against an older token; an unwatched headless place.
- **Rule codes:** one `FAC-SEM` code for the standing mandate's shape and its setter's level, reserved with the DEC.

## Who adopts it

Fabric (CO-547: the dispatcher and headless assignments read the profile; its floor treats covered effects as
decided; ADR-0168's machine permission choice stays the runner's prompt mode), the organization product (its levels row: who may
change a profile, shown per place), the PM agent (approves on administrators' commands within the levels), the host's
admin agent (records a place's kind when it builds the space or VM), every service with `relayed` actions (reads a
standing mandate like a task mandate).

## Questions for the operator, with the default the DEC takes

1. **Does the headless default cover a production deploy of a surface with outside users?** The decision of
   2026-11-09 says everything finishes; the operator's standing rule of 2026-11-05 keeps a production deploy that real
   users use as a gate. Default: the headless profile covers it, and a project that wants the gate narrows its own
   profile (`scope.projects` or `effects`).
2. **May an organization administrator set the profile of a member's own computer?** Default: only inside the
   organization's context on that computer (its space), never the person's personal context.
3. **What counts as watched** (AU-6)? Default: a monitoring agent declared in the place's record and answering its
   probe; the North Star's monitoring role defines it further.

## Not decided here

- The monitoring agent's own contract (the North Star's security and monitoring roles, G27).
- Rollback at the process level: each product's checks and receipts, not the profile's.
