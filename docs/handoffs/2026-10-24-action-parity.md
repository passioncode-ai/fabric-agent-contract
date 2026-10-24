# 2026-10-24: DEC-0121, every button has an agent twin, and the operator's relayed decision

## Objective

The operator asked (2026-10-24): when they tell their agent to approve something, the agent does it; any button a
service's dashboard shows a person exists for the agent too; for every Fabric agent. Record the contract's rule, its
reference, vectors and checker rule, ask every estate service with a dashboard to adopt it, and release it.

## Done

- **DEC-0121** ([service](../specification/service.md#actions) AP-1 to AP-5): a service declares every page action
  under `extensions/actions/0.1` with its tool and gate; a `relayed` action from a T0 or T1 caller carrying the
  operator's decision (`_meta.decision`, or a sealed call's `decision`: the action's id, the operator's quoted sentence,
  valid 24 h) is the operator's act, recorded with the caller the service authenticated; without one
  `operator-decision-required`; human gates answer `human-step-required` with the link; T2 keeps `approval/1`.
- Reference `actionDecision` and `actionsView` (`src/actions.ts`, 100 % branches), `FAC-SEM-142`, vectors
  `fixtures/vectors/actions.json`, fixtures, the three codes in DL-19's set, scenario SCN-043.
- Three rounds of blind readings. Round 1 (seam, product) failed the first draft; round 2 (seam, product) and round 3
  (product) failed the corrections; every blocking finding of all three was fixed: the decision bound to one action,
  an optional object, 24 hours and the authenticated caller; elicitation only as the service's own record; approval/1
  at any tier and the digest for T2; the decision's one place in the sealed call and the hub's forwarding; a `passkey`
  human step; job input requests and the host's clicked choice; the confirmation form (`Agent: ... Operator: yes`); no
  standing-file source; restore, OC-1, OC-2, holds and unlisting no longer reserved to the page; ST-035, FLW-29,
  SCR-30. Round 3's seam reading stopped on the API's weekly limit before it reported, so no blind reading has passed
  the final text: CT-128 asks for that reading when the limit resets (2026-10-30). Before merging, the lead ran a
  mechanical sweep (no text still reserves an action to the page, every human-step list names `passkey`, no
  `relayedBy` or slug-only action ids left).
- CT-124 to CT-127 filed (adapter kits and the working-with-fabric skill, Fabric, Fabric Dashboards, every estate
  service).

## Decisions taken here

- A T0 call of a `relayed` action without a decision is refused rather than accepted: without the decision nothing
  records that the operator decided, and an agent could approve on its own account.
- `FAC-SEM-141` reserved and unused (the counter's race-free order); the rule is `FAC-SEM-142`.

## Open

- Adoption: CT-124 (the kits, so every kit-built agent relays and declares by default), CT-125 (Fabric's own effect
  requests and choices), CT-126 (Dashboards' audit), CT-127 (each service, asked on the board).
- Outside the contract: Fabric ADR-0113 says an agent never approves a GitHub release run; the operator's own rules
  make releases the agent's. That ruling is Fabric's (CT-125).

## Checks actually run

`pnpm run check` (8 837 tests, UX lint 35 stories, 29 flows, 30 screens, 43 scenarios, markdownlint 0 errors,
privacy 0 findings) and `pnpm vectors:check` (20 files) on the merged tree.

## Next task

CT-128: the blind seam and product readings of DEC-0121's final text once the weekly limit resets (2026-10-30); then
record the services' answers to the CT-127 board requests; then CT-122 (CX-CON-06, due 2026-11-06).
