# 2026-10-26: three decisions for the simple Fabric (CT-174, DEC-0140)

## Objective

Answer Fabric's request `23ba0e97` (thread `6a8d2f9c`, due 2026-11-05 for its 0.3.15) by 2026-10-30, with three
decisions:

1. a reserved default capability for a Project's primary responder;
2. whether the operator may move a responder slot to another session;
3. an optional `role` at enrollment and `branch` on `fabric_session_observe`, with a privacy rule for branch names.

## The shape (draft, posted to the thread for objections)

- **PR-1, the primary responder.** `project.work` is the reserved capability of a Project's primary responder: the slot
  that answers a request naming no narrower capability. A requester that knows no capability of the target addresses
  it. It is a capability like any other: one slot, fenced, listed in the directory, held by the operator like any slot.
  No service serves `project.work` as a tool of its own. Nothing else is reserved.
- **PR-2, the operator moves a slot.** The operator may move a (Project, capability) slot to another live session of
  that Project in the host's operator controls, or through their agent, which relays the decision (`gate: relayed`,
  service.md AP-2). An agent never does it on its own account. The host applies it atomically, as
  `com.responder_replace` would for the receiving session:
  - the generation goes up by one;
  - `claimed` goes to `queued`;
  - `in_progress` goes to `outcome_unknown`;
  - `accepted` is held and is not transferred, since a transfer needs the leaving responder's checkpoint;
  - it is refused `held` when the slot or its Project is held;
  - the receiving session must already be authorized to respond for that capability.

  The record names the operator as the actor. `com.responder_replace` itself still takes the slot for its caller only.
- **PR-3, a session's role and branch.** These are Fabric's own session surface, not the board's.
  - `role` (coder, observer, monitor, responder) is the session's own claim: display and routing only, never
    authority. A `responder` role takes no slot; `com.enroll` and its grant still do.
  - `branch` is repository text that can name a person, a client or a plan. It stays in its Project: the operator and
    that Project's sessions may see it. It is never written to:
    - the board (a message, the directory, `com.status`);
    - an events feed read outside the machine;
    - an organization server;
    - a relay.

    A host may drop it without reporting itself degraded.

## Next task

Write PR-1 to PR-3 into `docs/specification/project-comms.md`, with a conformance row for a host serving the board and
`PRIMARY_CAPABILITY` with a test. Run blind readings. Merge and release by 2026-10-30. Answer on thread `6a8d2f9c`.
