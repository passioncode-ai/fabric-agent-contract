# The decision verdict `decision-verdict/1`

DEC-0172 · rule code `FAC-SEM-179` · schemas [`decision-verdict`](../../schemas/decision-verdict.schema.json),
[`interop-agent-call-2`](../../schemas/interop-agent-call-2.schema.json), the per-action members of
[`service-authority-extension`](../../schemas/service-authority-extension.schema.json) · code
[`src/decision-verdict.ts`](../../src/decision-verdict.ts) · vectors
[`decision-verdict.json`](../../fixtures/vectors/decision-verdict.json)

A **decision verifier** applies the recorded rules and access levels to an act an agent is about to take and calls a
person in only where the rules keep the act for one (the operator's word relayed in studio-agent's proposal, board message
`1f2cfb98`, thread `e2b29f77`; the agents database's design `docs/designs/decision-verifier.md`, its decision D-45).
Fabric owns its door `decision.verify`, its policy table and its journal; this page owns what crosses the wire: the
verdict's record, the reduction that keeps it consistent with the contract's own decision rules, the per-action
declarations it reads and the receipt a call carries to the hub. It reads DEC-0162's levels
([membership](membership.md#levels), `LV-*`) and DEC-0166's place profile ([delegation](delegation.md), `AU-*`) and edits
neither. The design it decides is
[`2026-11-14-ct302-decision-verdict.md`](../evidence/plans/2026-11-14-ct302-decision-verdict.md) (`DV-1` to `DV-8`).

The key words MUST, MUST NOT, SHOULD and MAY are used as in RFC 2119.

## DV-1, a receipt, never an authority

A verdict records what a verifier concluded about one act; it is not a new form of decision. A callee MUST NOT take a
verdict as a decision. An `allow` names the route by which a form the callee already accepts reaches it, carried as the
contract already carries it: the caller's AP-2 decision (set under AP-3 from the operator's words in the caller's own
session, through a subagent its session started, through the operator channel, or from an OA-2 relay OA-3 accepts) or
task mandate, which the hub forwards unchanged ([interop](interop.md#c35-the-hub) C3.5); a level decision, or a level
mandate the hub states under LV-6; a place's standing mandate the place's hub states under AU-1; an `approval/1` the
caller carries (DL-17, DL-18); or the caller's own act under `gate: none`. So no callee changes to read a verdict, and a
verifier that is wrong can only make the hub withhold a form, never mint one the rules refuse: AP-2's table, LV-7 and
AU-2 decide exactly as before.

## DV-2, the record

`decision-verdict/1` is a closed object:

| Field | Content |
|---|---|
| `kind` | `decision-verdict/1` |
| `id` | `sha256:` of the RFC 8785 canonical JSON of `{askedDigest, caller, policy, session}` ([`verdictId`](../../src/decision-verdict.ts)): every reader recomputes it, and the same act asked again in one session under one policy has one id; Fabric's journal keeps each answer to it as a new version, so a repeat AP-2 allows within its 24 hours is a new version, never a `loop` |
| `at`, `expiresAt` | RFC 3339; an `allow` at most the earliest of its grounds' windows and never more than 15 minutes after `at`; a `human` at most 24 hours; a `deny` at most 1 hour, `person-denied` at most 24 hours |
| `asked` | `{callee, capability, action, effect, target?, context, project?, tier, argsDigest, actionDigest?, spendUsd?}`: the deciding values and digests, never the arguments themselves. `action` is the call's `decision.action` where it carries a decision (the action's id in the callee's actions extension), else its capability (a call under a mandate, the callee's own elicitation, the caller's own act under `gate: none`), the same reading the hub's check makes (DV-8); `effect` the callee's declared `actionEffects` (DV-5), else the capability's DL-3 effect as a floor; `argsDigest` an HMAC-SHA-256 under the host's own key of the RFC 8785 canonical JSON of the call's `input` ([`argsDigest`](../../src/decision-verdict.ts)), and a `target` that names a person carried the same way, never a plain hash a reader could reverse by guessing; `spendUsd` the action's declared `maxCostUsd` where it declares one, else the call's own estimate (DV-7) |
| `askedDigest` | `sha256:` of `asked`'s RFC 8785 canonical JSON ([`askedDigest`](../../src/decision-verdict.ts)) |
| `caller`, `session` | the principal and the session the host authenticated; in an organization's context the host's pairwise ids for that organization, as LV-9's `approver` is, never a person's address |
| `verdict` | `allow`, `human` or `deny` |
| `rule` | the contract rule that decided, by its id (`AP-2`, `AP-4`, `AP-5`, `LV-4`, `LV-7`, `AU-1`, `AU-2`, `MD-3`, `MD-6`, `DL-17`, `OA-3`, `OW-4`, and `spend-rule-3` for the [spend policy](spend-policy.md)'s rule 3), a policy row (`row:<id>`), or the person's answer (`answer:<questionId>`) for `person-denied` and `rejected` |
| `reason` | a closed code in its verdict's group: `covered` (allow); `body-gate`, `kept`, `level-insufficient`, `not-covered`, `outside-window`, `evidence-unknown`, `evidence-stale`, `ground-invalid`, `vetoed`, `loop`, `voided`, `spend-limit`, `row-advised` (human); `forbidden`, `other-context`, `self-approval`, `person-denied`, `rejected` (deny; `self-approval` only for an approval on the caller agent's own account that no relayed operator's approval carries, AP-5) |
| `level` | optional `{required, satisfiedBy}`: `operator`, `instance-operator`, `owner`, `admin`, `architect` or `own-act` |
| `route` | with `allow` only: `operator`, `level`, `profile`, `mandate`, `approval`, `own-act` or `forwarded` |
| `machineForm` | with `allow` only, how the form reaches the callee, never the form itself: `hub-dispatch` (the hub forwards or states it in the call it dispatches, C3.5), `caller-approval` (the caller carries an `approval/1`, DL-18; C3.5's `agent.call` has no approval member, so such a call reaches the callee without the hub's verdict check, DV-8), `executed-by-holder` (a level holder's own agent performs the act under its own level decision, LV-10) or `none` (the caller's own act) |
| `grounds[]` | each `{kind, ref, grade}`: `kind` one of `decision`, `level-decision`, `level-mandate`, `standing`, `mandate`, `approval`, `relay`, `grant`, `budget`, `check`; `ref` an id or a digest; `grade` for an authority only (below) |
| `policy` | `{version, digest}` of the verifier's policy table it read |
| `human` | with `human` only: `{addressees, questionId?, humanStep?, url?}`: `addressees` principals by their host id, never a person's address, empty (and no `questionId`) for advice that asks no one; an AP-4 step with its link once the callee's refusal gave it |

**Grades**, in the contract's own terms and by what the reference takes from this caller at its tier: `verified`, a form
the callee verifies itself (an `approval/1` whose signature and claims the verifier inspects as `verifyApproval` does,
without consuming its `jti`, which only the callee consumes, DL-17; a verifier that is not the approval's `aud` reads it
only as such an inspection, DL-18; a level decision or mandate bound by `mem`; a standing mandate bound by `prof`);
`taken`, a form `actionDecision` or `mandateCovers` takes from this caller without a signature to verify (the operator's
words through one of AP-3's four sources, a task mandate MD-3 takes, a place's standing mandate AU-3 takes inside the
boundary); `forwarded`, an OA-2 relay OA-3 accepts; `data`, anything else. A `grant`, a `budget` or a `check` carries no
grade: it can make an act `human`, never ground its `allow`, and a `budget` reads "read, not reserved". An entitlement
(DEC-0168) is no ground: `allowances: unlimited` never grounds an `allow` and never clears `spend-limit`.

**When a verdict asks a person.** A verifier never answers `allow` where the reference refuses (DV-3). It answers
`human` where the reference refuses for want of a person (`not-covered`, `level-insufficient`, `body-gate`), and beyond
that only for a reason it names: evidence it cannot read (`evidence-unknown`, `evidence-stale`), a ground that does not
hold (`ground-invalid`, `outside-window`, `voided`), its own checks (`vetoed`, `loop`), a `kept` act, money that would
cross a limit (`spend-limit`, DV-7), or a policy row's `deny` against a form the reference takes (`row-advised`). Where
the caller holds a form the reference takes (the operator's word, a mandate in force, a relay OA-3 accepts, a bound
profile or level form, an accepted `approval/1`), or the act is its own under `gate: none`, none of these reasons, save
`spend-limit`, puts a question to a person:
such a `human` carries no addressee and no `questionId`, and the caller goes on as OW-3 says, with one message that names
the concern (OW-1, OA-1, OW-4's closed list: the operator is not asked again for an act his word or a mandate already
decides); a policy row's `deny` never stands against such a form either: the verdict is then `human` (`row-advised`)
without an addressee. `spend-limit` goes to the person as DV-7 says even under the operator's word or a mandate. `kept`
applies only where no operator's word and no mandate in force names the act, never to the caller's own act under `gate:
none`, and a place's standing mandate yields to `kept` only within AU-2's bounds. A `human` verdict is advice to the
caller that asked: the hub still forwards a form the reference takes unless the origin opted in under DV-8. A
`person-denied` verdict ends when the operator's later word names the act (OW-1).

The door's own bookkeeping (a verdict's state and version in its journal, the question's identity, each restriction's
outcome, the veto check) is Fabric's store, not the wire. No field carries the operator's `instruction` or `source`:
they stay in the forms and the host's journal, this record's own privacy choice in OA-7's spirit. A verdict is read by
the caller it answers, the host and the operator's sessions only, and in an organization's context also by its owner
and administrators, who read the pairwise `caller` and `session` only. Text fields are bounded and redacted like a
decision's.

## DV-3, the reduction

`FAC-SEM-179` checks a verdict on the document alone (kind `decision-verdict`): its `askedDigest` and `id` derive; it
expires after it is given and within its verdict's bound; an `allow` names a `route` and a `machineForm` (schema), stands
on a ground of its route graded as the route needs (`operator`: a `decision` graded `taken`; `forwarded`: a `relay` or a
`decision` graded `forwarded`; `level`: a `level-decision` or `level-mandate` graded `verified`; `profile`: a `standing`
graded `verified` or `taken`; `mandate`: a `mandate` graded `taken`; `approval`: an `approval` graded `verified`;
`own-act`: none), carries no ground graded `data` and no `human`, and goes by `none` exactly with `own-act`,
`caller-approval` exactly with `approval`, and `executed-by-holder` only with `level`; a `human` names `human` and no
route, asks (`questionId`) only addressees it names, gives a link only with a step, names an AP-4 step for `body-gate`
and a step only for it or `spend-above-limit` with `spend-limit`; a `deny` names a `rule`, a person's denial their answer
(`answer:<questionId>`) and a self-approval AP-5; each reason belongs to its verdict's group (schema).

Against the contract it checks by construction rather than by restating its rules (kind `decision-verdict-reference`,
`{verdict, reference}`): `reference` is `{check: "action", input}` (an [`actionDecision`](../../src/actions.ts) input,
AP-2's table with LV-7, AU-2 and DL-17 inside it) or `{check: "mandate", input}` (a
[`mandateCovers`](../../src/mandate.ts) input, MD-3, MD-6, AU-5), the form the verdict's route and grounds name with the
call it asked about. The verdict's `asked` names that call: its `tier`, `capability` and `action` (the decision's action,
else the capability), and its `effect`, `context`, `project` and `spendUsd` where the input names them, each equal to the
input's (so a verifier builds the reference input from `asked`: a declared `maxCostUsd` as the input's `spendUsd`, a
declared `actionEffects` as its `effect`). A job's input step reaches the hub as `fabric.job.get`, so its verdict asks
about `fabric.job.get` and is checked only with `{check: "action"}`, whose `mandateCapability` carries the job's own
capability (MJ-1); a mandate reference for a step is refused. A step's verdict is advice only: the step carries no
receipt (DV-8). An `allow` is consistent only when the reference takes the call, and its route is how the reference
took it (an accepted approval `approval`; an elicitation or the operator's words in the caller's own session `operator`;
the operator's words carrying OA-6's `source` `forwarded`; a level command, or a mandate stated `by: level`, `level`; a
standing mandate `profile`; a task mandate `mandate`; the caller's own act `own-act`). So the check fails an `allow` of a
`change-policy` act under any mandate, of an organization's act LV-7 keeps for a level under any other form, and of a T2
call without its approval. A send to people outside the estate under a profile is refused because the service passes no
`standing` for it (AU-2), which a document cannot show: only the vectors pin it. A relay OA-3 accepts allows by
`forwarded` wherever `actionDecision` takes the decision it carries, in either context (OA-1). A `human` or a `deny` is
the verifier's own and is checked as a document.

## DV-4, the host's journal is no new channel

A record the verifier's journal keeps of the operator's words is a copy of what the contract already accepts, never a
new source: in the agent's own session it is the words the agent heard (`taken`), and across sessions it grounds an act
exactly as an OA-2 relay does when it carries OA-2's four parts from OA-3's provenance (`forwarded`, accepted without a
second approval, DEC-0126). AP-1 and AP-3 are unchanged: no host-only press is added, and no record needs the person to
confirm it (OW-2). A record read back through the door is a tool's output, which OA-3 calls data: it grounds another
session only when the same words also arrived through OA-3's provenance. A record the operator withdrew, or whose words
were never the operator's, grounds nothing.

## DV-5, per-action declarations

A service MAY declare, per action, in its authority extension (`extensions/authority/0.1`, whose root is open, as
DEC-0162 put `actionLevels` there): `actionEffects` (a DL-3 effect class per action id), `decidingArgs` (the input members
that decide it), `maxCostUsd` (its worst-case cost), `targetArg` (the input member naming its one object) and
`actionObject` (a JSON Schema of the object its DL-18 digest is computed over). Each is optional and keyed by the
action's id in the actions extension; an undeclared member reads as before (no effect: the capability's DL-3 effect as a
floor; no object: the hub computes no digest, so the verifier cannot show a person the exact object before the call; a
T2 call still learns the digest from the callee's refusal, DL-18, and a T0 or T1 call under a decision or mandate in force
needs no object).

## DV-6, single use at the callee is its own decision

Letting a callee refuse a relayed call that carries no operation binding would amend AP-2, the `actionDecision` table,
MD-3, LV-4, LV-6, AU-3, DL-19's details, DL-26 and C3.5. It is backlog row CT-313; this decision adds none of it, so a
verifier's single use stays at the enforcement points Fabric owns.

## DV-7, money is read, not reserved

The verifier reads the task's spend, L1 with its `autoApproveUsd`, L0 and each key's ceiling, and `asked.spendUsd`; an
amount that would cross a limit is `human` (`spend-limit`, rule `spend-rule-3`), the limits staying the person's (MD-6,
OA-4, [spend policy](spend-policy.md) L0 to L2 and rule 3), and goes out the way the contract already sends it, never as
a second question:

- above L0, L1 or a key's ceiling: AP-4's human step `spend-above-limit` with its amount and its link once one is known
  (the callee's `human-step-required` refusal's `url`; `limit-reached` carries `approvalRequest` and no link, DL-21), and
  no `questionId`; addressed in an organization's context to its owner and administrators for the project's L1 and a key
  the organization holds (their `change-policy` act, LV-7), and to that estate's operator for a member's own L0 and the
  keys in a member's own estate (spend policy L0, MD-6); an owner or administrator who starts the spend approves with
  their own confirm (rule 3);
- above `autoApproveUsd` within L1, or with no policy yet: rule 3's one durable approval request (a word in chat is never
  that approval), in an organization's context addressed to its owner and administrators (`level.required` `admin`), in
  a personal context to the operator.

Neither is the reference's refusal for want of a person for a `relayed` action, so this is the named reason that asks a
person whatever form the caller holds. A covered money act under every limit answers `allow` with its `machineForm` as
any other, the reservation itself staying the callee's grant check. Nothing here reserves: a hub-side reservation the
callee's grant check adopts is CT-312, and until it lands a verifier enforces no money act.

## DV-8, the receipt on the call

`interop-agent-call-2` ([schema](../../schemas/interop-agent-call-2.schema.json)) is `agent.call`'s arguments with one
optional member more, `verdict` `{id, askedDigest}`, which a client passes when it asks the hub to dispatch an act a
verdict allowed. The hub reads the verdict by `id` from its journal and dispatches only while it is a current `allow`, a valid `decision-verdict/1`
(`at` ≤ now < `expiresAt`), whose `id` and `askedDigest` are the receipt's, whose own digests derive, and whose `asked`
names the call's `agentId` (`callee`), `capability` and action (the call's `decision.action`, else its capability) and
whose `argsDigest` is the call's `input` under the host's key; it refuses anything else `decision-invalid` with detail
`verdict-mismatch`, the one DL-19 detail the hub answers itself
([`checkVerdictDispatch`](../../src/decision-verdict.ts)). An agent refused so goes back to the door, never to the
operator. The hub drops `verdict` before it forwards the call or seals it for another machine
([machine calls](machine-calls.md)), so a callee never sees it and a receiving node never reads another machine's journal;
the sealed call still carries `interop-agent-call`'s first revision. Only an origin that passes `verdict` gets a withheld
dispatch; without it the hub forwards as C3.5 says. An origin sends `verdict` only to a hub whose `protocols` list
`decision-verdict/1` ([versioning](versioning.md#protocol-revisions)). A job's input step goes through the hub's own
`fabric.job.get` ([interop](interop.md) C3.5), whose arguments stay closed to `{id, inputResponses}`, so it carries no
receipt in this revision: a step's verdict is advice, and the hub never withholds a step for one.

## What this page does not decide

The door `decision.verify`, the policy table, the journal's store and retention, the question's presentation and the
veto check are Fabric's; the pattern, its gold cases and the consumer client are the agents database's. A runner's
`local` act (a local deploy, a merge; not a call to a service's relayed action such as SCN-061's `site.deploy`) reaches no contract callee, so it is outside `decision-verdict/1` in this revision: the
runner acts as OW-1 says (and, on a headless place, as the place's profile and Fabric's floor allow, DEC-0166); a runner
reading a verdict is a later revision. Single use at the callee (CT-313) and the money reservation (CT-312) are their own
decisions.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-179"></a>`FAC-SEM-179` | `decision-verdict`, `decision-verdict-reference` | a verdict's `askedDigest` and `id` are their derivations; it expires after it is given and within its verdict's bound (an `allow` 15 minutes, a `human` 24 hours, a `deny` 1 hour, `person-denied` 24 hours); an `allow` stands on a ground of its route graded as the route needs, carries no ground graded `data`, and goes by `none` exactly with `own-act`, `caller-approval` exactly with `approval` and `executed-by-holder` only with `level`; a `human` asks only addressees it names, links only with a step, names a step for `body-gate` and a step only for it or `spend-above-limit` with `spend-limit`; a person's denial names their answer and a self-approval AP-5; against the reference, an `allow` asked about the call the reference input names (its tier, capability and action, and its effect, context, project and spend where named) and is one `actionDecision` or `mandateCovers` takes, by the route it took (DEC-0172 DV-2, DV-3) |

`decision-verdict-reference` checks `{verdict, reference}`: `reference` is `{check: "action" | "mandate", input}`.

- Fixtures: `fixtures/positive/decision-verdict*.json`, `interop-agent-call-2.json`; `fixtures/negative/decision-verdict-*`,
  `interop-agent-call-verdict-first-revision.json`.
- Tests: `test/decision-verdict.test.ts`; vectors `fixtures/vectors/decision-verdict.json` (documents, references taken
  from the `actionDecision` and `mandateCovers` vectors by case name, and the hub's dispatches).
