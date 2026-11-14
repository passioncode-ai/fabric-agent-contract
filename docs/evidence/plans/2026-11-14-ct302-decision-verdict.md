# Design 2026-11-14: the decision verdict (CT-302)

**Status:** proposed design, the contract's part of the decision verifier; the decision (one DEC) follows from it.
Rules are proposals numbered `DV-*`. It reads DEC-0162's levels (`LV-*`, [membership](../../specification/membership.md#levels))
and DEC-0166's place profile (`AU-*`, [delegation](../../specification/delegation.md)), both on `main` since 2026-11-14
(#305, #306), and edits neither.

**Asked by:** studio-agent's proposal (board message `1f2cfb98`, thread `e2b29f77`, 2026-11-13; `passioncode-ai/studio-agent`
`docs/proposals/2026-11-13-decision-verifier.md` at `8c5e3d9`), relaying the operator's word: an automatic verifier of
decisions that applies the recorded rules and access levels and calls a person in only at a level the rules keep for
one. The agents database designed the verifier itself (`fabric-agents-database` `docs/designs/decision-verifier.md`,
accepted, `1055b55`, board message `45e934f6`); its open questions OQ-1, OQ-3, OQ-6, OQ-8 and OQ-9 are the contract's.
Fabric owns the door `decision.verify` and its journal (spec by 2026-11-17); this design owns the wire.

Line numbers cite the repository at `980f9013` (main on 2026-11-14); read each citation by its rule id first.

## What the contract says today

| Where | What it says | What the verifier needs |
| --- | --- | --- |
| [service](../../specification/service.md) AP-1 to AP-5 (DEC-0121) | a `relayed` action is decided by the operator's decision, an elicitation, an `approval/1`, a mandate, a level form or a place's profile; a body gate is a human step (AP-4); `actionDecision` is the reference | a record of what a verifier concluded about one act, and why, that every party reads the same way |
| service AP-3 | the operator's words reach an agent in its own session, through a subagent, the operator channel or an OA-2 relay; a standing rule in a file is no decision | to know whether the verifier's journal of those words is a new source (DV-4: it is not) |
| [delegation](../../specification/delegation.md) DL-26 | a callee must not require more than the operator's decision from a T0 or T1 caller | a callee that must not run a non-idempotent act twice needs to ask for the operation it belongs to |
| [spend policy](../../specification/spend-policy.md) grant check | the callee reserves against its own grant at a T2 call | a T0 or T1 call holds no grant record, so nothing reserves before a money act |
| the actions extension (AP-1) | an action declares its id, title, tool and gate, no effect | a verifier classifies an act by its effect, deciding arguments and worst-case cost |

## The design

**DV-1, a verdict is a receipt, never an authority.** `decision-verdict/1` records what a verifier concluded about one
act; it is not a new form of decision. A callee never takes a verdict as a decision: an `allow` names the route that
carries the act, and the act still reaches the callee only in a form the callee already accepts, carried as the
contract already carries it: the caller's AP-2 decision (set under AP-3 from the operator's words in the caller's own
session or an OA-2 relay OA-3 accepts) or task mandate, which the hub forwards unchanged ([interop](../../specification/interop.md)
C3.5); a level decision, or a level mandate the hub states under LV-6; a place's standing mandate the place's hub states
under AU-1; an `approval/1` the caller carries (DL-17, DL-18); or the caller's own act under `gate: none`. So no callee
changes to read a verdict, and a verifier that is wrong can only make the hub withhold a form, never mint one the rules
refuse: AP-2's table, LV-7 and AU-2 decide exactly as today.

**DV-2, the record.** A closed JSON object (`schemas/decision-verdict.schema.json`, new):

| Field | Content |
| --- | --- |
| `kind` | `decision-verdict/1` |
| `id` | sha256 of the RFC 8785 canonical JSON of `{caller, session, askedDigest, policy}`: every reader recomputes it, and the same act asked again in the same session under the same policy gets the same id; Fabric's journal keeps each answer to it as a new version, so a repeat AP-2 allows within its 24 hours is a new version, never a `loop` |
| `at`, `expiresAt` | RFC 3339; `allow` at most the earliest of its grounds' windows and never more than 15 minutes; `human` until answered, at most 24 hours; `deny` 1 hour; `person-denied` 24 hours |
| `asked` | `{callee, action, effect, target?, context, project?, tier, argsDigest, actionDigest?, spendUsd?}`: the deciding values and digests, never the arguments themselves; `argsDigest` is an HMAC-SHA-256 under the host's own key of the RFC 8785 canonical JSON of the call's `input`, and a `target` that names a person is carried the same way, never a plain hash a reader could reverse by guessing |
| `askedDigest` | sha256 of `asked`'s canonical JSON |
| `caller`, `session` | the principal and session the host authenticated |
| `verdict` | `allow`, `human` or `deny` |
| `rule` | the contract rule that decided, by its id (`AP-2`, `AP-4`, `AP-5`, `LV-4`, `LV-7`, `AU-1`, `AU-2`, `MD-3`, `MD-6`, `DL-17`, `OA-3`), a policy row (`row:<id>`), or the person's answer (`answer:<questionId>`) for `person-denied` and `rejected` |
| `reason` | a closed code: `covered` (allow); `body-gate`, `kept`, `level-insufficient`, `not-covered`, `outside-window`, `evidence-unknown`, `evidence-stale`, `ground-invalid`, `vetoed`, `loop`, `voided` (human); `forbidden`, `other-context`, `self-approval`, `person-denied`, `rejected` (deny) |
| `level` | `{required, satisfiedBy}`: `operator`, `instance-operator`, `owner`, `admin`, `architect` or `own-act` |
| `route` | `operator`, `level`, `profile`, `mandate`, `approval`, `own-act` or `forwarded`, with `allow` only |
| `machineForm` | with `allow` only, how the form reaches the callee: `hub-dispatch` (the hub forwards or states it in the call it dispatches, C3.5), `caller-approval` (the caller carries an `approval/1`, DL-18), `executed-by-holder` (a level holder's own agent performs the act under its own level decision, LV-10) or `none` (the caller's own act); never the form itself. A `local` act a runner performs itself (a deploy, a merge) reaches no contract callee, so it is outside `decision-verdict/1` in this revision: the contract records no verdict for it, and the runner acts as OW-1 says (and, on a headless place, as the place's profile and Fabric's floor that reads it allow, DEC-0166) (a runner reading a verdict is Fabric's OQ-4 and a later revision) |
| `grounds[]` | each `{kind, ref, grade}`: `kind` one of `decision`, `level-decision`, `level-mandate`, `standing`, `mandate`, `approval`, `relay`, `grant`, `budget`, `check`; `ref` an id or a digest |
| `policy` | `{version, digest}` of the table the verifier read |
| `human` | with `human` only: `{addressees, questionId?}` (`addressees` empty, and no `questionId`, for advice that asks no one), or `{addressees, humanStep, url?}` for an AP-4 step (a link only with a human step, and only once the callee's refusal gave it) |

Grades, in the contract's own terms and by what the reference takes from this caller at its tier: `verified`, a
form the callee verifies itself (an `approval/1` `verifyApproval` accepts, a level decision or mandate bound by `mem`, a
standing mandate bound by `prof`); `taken`, a form `actionDecision` or `mandateCovers` takes from this caller without a
signature to verify: the operator's words in the caller's own session, through a subagent its session started or the
operator channel (AP-3), a task mandate MD-3 takes (its chain ending at the callee, MD-2), a place's standing mandate
AU-3 takes inside the boundary; `forwarded`, an OA-2 relay OA-3 accepts; `data`, anything else. The requirements a
verifier reads beside authority (`grant`, `budget`, `check`) carry no grade, the one exception to a ground's required
grade: they can make an act `human`, never ground its `allow`, and a `budget` ground reads "read, not reserved". A verifier never answers `allow` where the reference refuses (DV-3). It answers `human` where the reference
refuses for want of a person, and beyond that only for a reason it names: evidence it cannot read (`evidence-unknown`,
`evidence-stale`), its own checks (`vetoed`, `loop`), or a `kept` act. Where the caller holds a form the reference takes (the operator's word, a mandate in force, a relay
OA-3 accepts, a bound profile or level form), none of these reasons puts a question to a person: such a `human` carries no
addressee and no `questionId`, and the caller goes on as OW-3 says, with one message that names the concern (OW-1, OA-1,
OW-4's closed list: the operator is not asked again for an act his word or a mandate already decides); `kept` applies
at all only where no operator's word and no mandate in force names the act. A `human` verdict is advice to the caller
that asked: the hub still forwards a form the reference takes unless the origin opted in under DV-8. A `person-denied`
verdict ends when the operator's later word names the act (OW-1). The door's
own bookkeeping (a verdict's state and version in its journal, the question's identity, each restriction's outcome,
the veto check) is Fabric's store, not the wire. No field carries the operator's `instruction` or `source`; they stay
in the forms and the host's journal (OA-7). A verdict is read by the caller it answers, the host and the operator's
sessions only (in an organization's context also its owner and administrators); `human.addressees` names principals by their host id, never a person's
address. Text fields are bounded and redacted like a decision's.

**DV-3, the reduction (`FAC-SEM-175`).** On the document alone: `allow` names a `route`, a `machineForm` and a
ground for its route (none for `own-act`), and no `human`; `human` names `human` and no `route`; `deny` names a `rule`;
the reason belongs to the verdict's group in DV-2's list; a ground of grade `data`, or an unknown, never stands beside
`allow`; `reason: body-gate` carries a `humanStep`; `expiresAt` within DV-2's bounds. Against the contract, by
construction rather than by restating its rules: an `allow` is consistent only when the reference check, given the
verdict's `asked` and the form its route and grounds name, takes the call. That is `actionDecision` (AP-2's table,
with LV-7, AU-2 and DL-17 inside it) and `mandateCovers` (MD-3, MD-6, AU-5). The vectors
(`fixtures/vectors/decision-verdict.json`) pair each verdict with that input, and the check fails a verdict that allows
what the reference refuses: a `change-policy` act under any mandate, an organization's act LV-7 keeps for a level
under any other form, a T2 call without its approval. A send to people outside the estate under a profile is refused
because the service passes no `standing` for it (AU-2), which a document cannot show: only the vectors pin that case. A relay OA-3 accepts
allows by `route: forwarded` wherever `actionDecision` takes the decision it carries, in either context (OA-1: the
person is not asked again).

**DV-4, the host's journal is no new channel (the verifier's OQ-3 a and b).** A record the verifier's journal keeps of
the operator's words is a copy of what the contract already accepts, never a new source: in the agent's own session it
is the words the agent heard (`taken`), and across sessions it grounds an act exactly as an OA-2 relay does when it
carries OA-2's four parts from OA-3's provenance (`forwarded`, accepted without a second approval, DEC-0126,
«я сказал одному = сказал всем»). AP-1 and AP-3 are unchanged: no host-only press is added, and no record needs the
person to confirm it (the operator's rule of 2026-11-07 that they press nothing, OW-2). A record read back through the door is a tool's output, which OA-3 calls data: it grounds another session only when the
same words also arrived through OA-3's provenance. A record the operator withdrew, or whose words were never the
operator's, grounds nothing; agents list and read records once CT-311 lands, and revoke them through their twin (AP-1).

**DV-5, per-action declarations (the verifier's OQ-6).** A service declares, per action, in its authority extension
(`extensions/authority/0.1`, whose root is open, as DEC-0162 put `actionLevels` there rather than in the closed actions
extension): `actionEffects` (a DL-3 effect class per action id), `decidingArgs`, `maxCostUsd`, `targetArg` and
`actionObject` (a JSON Schema of the object the action's digest is computed over, DL-18). Each is optional and
additive; an undeclared member reads as today (no effect: the capability's DL-3 effect as a floor; no object: the hub
computes no digest, so the verifier cannot show a person the exact object before the call; a T2 call still learns the digest from the
callee's refusal (DL-18), and a T0 or T1 call under a decision or mandate in force needs no object).

**DV-6, single use at the callee is its own decision (the verifier's OQ-9).** Letting a callee refuse a relayed call
that carries no operation binding would amend AP-2, the `actionDecision` table, MD-3, LV-4 and LV-6, AU-3, DL-19's
refusal details, DL-26 (no local call waits on the hub) and C3.5 (whose hub forwards a decision unchanged and binds it to no operation), and would have to say how an
operation relates to C3.5's `idempotencyKey`. It is filed as its own row, CT-313; this decision adds none of it, so a
verifier's single use stays at the enforcement points Fabric owns.

**DV-7, money stays read-only until a reservation lands (the verifier's OQ-8).** The verifier reads the task's spend,
L1 with its `autoApproveUsd`, L0 and each key's ceiling, and the call's own estimate (the one `mandateCovers` checks
against `perCallMaxUsd`); an estimate that would cross a limit is `human`, the limits staying the person's (MD-6,
OA-4, [spend policy](../../specification/spend-policy.md) L0 to L2 and its step 3). A covered money act under every limit
answers `allow` with `machineForm` as any other, the reservation itself staying the callee's grant check. Nothing in this decision reserves. A hub-side
reservation the callee's grant check adopts is CT-312; until it lands a verifier enforces no money act.

**DV-8, the receipt on the call (the verifier's OQ-1).** A new revision of `interop-agent-call.schema.json` beside the
old one gains an optional `verdict` member `{id, askedDigest}` a client passes when it asks the hub to dispatch an act
a verdict allowed; the hub reads the verdict by `id` from its journal, dispatches only while it is a current `allow`, checks the call's
`agentId`, `capability` and action against `asked` and its `input` against `argsDigest`, and refuses a mismatch or a verdict that is not a current `allow` with
`decision-invalid` detail `verdict-mismatch` (a new DL-19 detail, the one the hub answers itself, so DL-19 names the
hub beside the callee for it, and the DEC gives FLW-29 the branch that sends the agent back to the door, never to the
operator). This amends C3.5's "the schema admits no field
beyond these" for that revision, and the sealed call (`agent-call-message.schema.json`, [machine calls](../../specification/machine-calls.md)),
which carries the same arguments: the sending machine's hub checks the verdict and drops `verdict` before it seals the
call, so the receiving node never reads another machine's journal. Only an origin that passes `verdict` gets a withheld dispatch; without it the hub
forwards as C3.5 says. A callee never sees it (DV-1); an origin sends it only to a hub whose `protocols` list
`decision-verdict/1`, a name the DEC adds to [versioning](../../specification/versioning.md)'s protocol list.

## What it does not decide

The door `decision.verify`, the policy table, the journal's store and retention, the question's presentation and the
veto check are Fabric's; the pattern, the gold cases and the consumer client are the agents database's. The
verifier's OQ-4 (a runner's hook reading an `allow` receipt) is Fabric's with each runner's owner; OQ-5 (kept acts
beyond the contract) is the operator's; OQ-7 (a recommended option) is the agents database's.

## Open points for the decision

1. The decision is additive: a new record, its rule, the authority extension's new optional members and a new revision
   of `interop-agent-call` gated by `decision-verdict/1`; it amends only C3.5's closed list of `agent.call` fields for
   that revision. Single use at the callee (CT-313) and the money reservation (CT-312) are their own decisions.
2. The rule code is the next free one at landing (`FAC-SEM-175` by the SEM counter on 2026-11-14), reserved by the
   CAS counter.

## Next

The DEC with the schema, `FAC-SEM-175`, the reference check, `fixtures/vectors/decision-verdict.json` (with a level
form and a bound standing mandate taken at T2) and the restatements: the authority extension, C3.5, `interop-agent-call`,
the sealed call and machine calls, DL-19's details, versioning's protocol list, FLW-29 and SCN-043 and SCN-057 (a
`verdict-mismatch` goes back to the door), and a CONTEXT term for the decision verdict; read under the finish-line rule.
The sibling rows CT-312 (the money reservation) and CT-313 (single use at the callee). A board message to the agents
database and Fabric listing where this design departs from the source's accepted text (no confirmation press; grades
`verified`, `taken`, `forwarded`; `forwarded` in either context where `actionDecision` takes it; `caller-approval` for
`hub-approval`, no `runner-receipt`; the source's `options[]`, `restrictions[]`, `veto`, `state`, `version` and
`commandId` in Fabric's store, not on the wire; the `id` without the operation; `kept` bounded by OW-1; local acts
outside this revision) and telling studio-agent that the receipt carries no operator's words (OA-7) and that this
revision serves neither local acts nor another session's journal as a ground. Fabric's spec of 2026-11-17 cites this
design's field names.
