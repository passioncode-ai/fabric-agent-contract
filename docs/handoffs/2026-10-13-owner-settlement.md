# Handoff — DEC-0081: the estate owner settles an `outcome_unknown` request whose responder is gone (2026-10-13)

## Objective

A request in `outcome_unknown` is left only by `com.reconcile`, which only the holder of the current slot could call.
If that slot stays empty (the agent retired, or never re-enrolled), the request never ends. Fabric asked whether an
estate owner may attest an observed outcome; the owner ruled yes, narrowly, without weakening "observed only". This run
writes that ruling into the contract, then applies the owner's rulings on the independent reading of PR #102.

## Done

- DEC-0081, surface (a): `com.reconcile` answers the estate owner, the `trusted` operator principal that owns the
  request's target Project (in an organization estate, that member only; every other operator `not_authorized`),
  while no responder holds the request's slot (absent, or lapsed with no current enrollment). The arguments are
  unchanged; the caller's role comes from the endpoint. While a slot is held the owner is refused `not_authorized`.
- The paths into `outcome_unknown` are named: the sender's `com.cancel` after the effect began, a restore, and the
  lost-result operation when a holder took the slot and left. An `in_progress` request whose responder retired with no
  successor reaches the owner through the sender's `com.cancel`. No transition is added.
- Observed only: `completed` or `failed_known`, `observed: true`, a summary required of the owner (1–2000 characters,
  `observation_required` without it), evidence optional. No path to `cancelled`, stated with its reason. A late
  responder is refused (`invalid_transition`, or `fenced` / `revision_conflict`), never committed, never reopened.
- The wire: `settledBy: "owner"` (`comms-common.schema.json#/$defs/settledBy`, a `const`) on the receipt's and the
  message view's `request`, only on `completed` and `failed_known`, sent on every owner settlement and nothing else, so
  its absence means the responder settled it. A responder's arguments and receipt are unchanged, and the rollout needs
  no order. `com.status` shows no request and gains nothing.
- `FAC-SEM-109` (kind `comms-transition`, a host journal record): every `complete` and `reconcile` record carries
  `settledBy`, `responder` or `owner` (the value `responder` exists in the record only), and no other record does; an
  owner settlement is a `reconcile` with the summary (code points, checked against the schema on the same inputs) and a
  `trusted` `operator` principal. Shared vectors: `fixtures/vectors/comms-settlement.json` (31 cases).
- Adjacent defects fixed: `FAC-SEM-027` looked an op up in a plain object, so an op named `constructor` or `__proto__`
  threw; `FAC-SEM-059` read `SUBSCRIPTION_RUNNER[login]`, so a login named `constructor` put a function's text in the
  message. Both now read own members only, each with a test.
- project-comms.md (the amendment note, Messages and requests, the lifecycle row and sentence, *Owner settlement*, the
  groups' note, the tool table, Receipts, Restore, Semantic rules, Limits); conformance.md (the row); DEC-0022 and
  DEC-0073 annotated; CONTEXT, DOCMAP, the UX docs (SCN-025, ST-020, FLW-16, SCR-19 with the conditional primary
  action, JRN-08); CT-21, CT-41 and CT-42 clauses.
- Rebased onto main `d194dd9` (DEC-0079); DEC-0081 sits after DEC-0079, with DEC-0080 (PR #103) still open.

## Open

- Fabric serves owner settlement, runs kind `comms-transition` or the vectors, amends its ADR-0117 §4 sentence and its
  Comms screen (CT-41); the kits read `settledBy` when they repin (CT-42).
- Not decided: how the operator observes the outcome; notifications; an expiry on `outcome_unknown` (still forbidden);
  how the host's operator endpoint learns the Project's open epoch.

## Checks run

- Gate at the branch head:
  - `tsc --noEmit` exit 0;
  - vitest with coverage passed;
  - UX lint passed;
  - docs-check passed;
  - lint-md 0 errors;
  - privacy 0 findings.
- Plants, each confirmed failing a named test and then restored:
  - eight schema mutants in `test/comms-tools.test.ts`, each killed by its negative fixture;
  - nine rule plants in `src/semantic-rules.ts`, each failing `test/comms-rules.test.ts`;
  - one plant in `src/profile-rules.ts`, failing `test/runner-model-profiles.test.ts`.
- The exact numbers are in the pull request.

## Next task

Merge (after DEC-0080's order is settled by the owner), tell Fabric's builder the merge commit (CT-41) and the
adapter's builder (CT-42).
