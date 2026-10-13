# Handoff — DEC-0081: the estate owner settles an `outcome_unknown` request whose responder is gone (2026-10-13)

## Objective

A request in `outcome_unknown` is left only by `com.reconcile`, which only the holder of the current slot could call.
If that slot stays empty (the agent retired, or never re-enrolled after a restore), the request never ends. Fabric asked
whether an estate owner may attest an observed outcome; the owner ruled yes, narrowly, without weakening "observed
only". This run writes that ruling into the contract.

## Done

- DEC-0081, surface (a): `com.reconcile` answers the estate owner (a `trusted` operator principal; no Project grant
  makes one) while no responder holds the request's slot (absent, or lapsed with no current enrollment). The arguments
  are unchanged; the caller's role comes from the endpoint. While a slot is held the owner is refused `not_authorized`.
- Observed only: `completed` or `failed_known`, `observed: true`, a summary required of the owner (1–2000 characters,
  `observation_required` without it), evidence optional. No path to `cancelled`, stated with its reason. A late
  responder's `com.complete` or `com.reconcile` is refused `invalid_transition`.
- `settledBy: "responder" | "owner"` (`comms-common.schema.json#/$defs/settledBy`) on the receipt's and the message
  view's `request`, allowed only on `completed` and `failed_known`. `com.status` shows no request and gains nothing.
- `FAC-SEM-109` (kind `comms-transition`): `settledBy` only on `complete` or `reconcile`; an owner settlement is a
  `reconcile` with the summary (code points, checked against the schema on the same inputs) and a `trusted` `operator`
  principal. Shared vectors: `fixtures/vectors/comms-settlement.json` (28 cases, including 2000 and 2001 astral
  characters, a null `settledBy`, and capitalised `Owner` and `Trusted`).
- An adjacent defect fixed: `FAC-SEM-027` looked an op up in a plain object, so an op named `constructor` or
  `__proto__` threw; it now reads own members only, with a test.
- project-comms.md (the amendment note, Messages and requests, the lifecycle row and sentence, a new *Owner
  settlement* section, the groups' note, the tool table, Receipts, Restore, Semantic rules, Limits); conformance.md
  (the row); DEC-0022 and DEC-0073 annotated; CONTEXT, DOCMAP, the UX docs (SCN-025, ST-020, FLW-16, SCR-19, JRN-08);
  CT-41 and CT-42 clauses.

## Open

- The rollout runs in order: the adapter's kits repin to read `settledBy` first (CT-42), because a kit at `f00a768`
  refuses the member. Fabric then serves owner settlement with `settledBy`, amends its ADR-0117 §4 sentence and its
  Comms screen (CT-41).
- The next free rule-code marker reads `FAC-SEM-110` on this branch, because the gate's G-13 check fails while the
  marker is not above the highest code (`FAC-SEM-109`). The owner sets it at merge, as arranged; `FAC-SEM-108` belongs
  to a parallel packet.
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
  - six schema mutants in `test/comms-tools.test.ts`, each killed by its negative fixture;
  - eight rule plants in `src/semantic-rules.ts`, each failing `test/comms-rules.test.ts`.
- The exact numbers are in the pull request.

## Next task

Merge (the owner sets the next free code), tell the adapter's builder the merge commit for the kits' repin (CT-42),
then Fabric's builder (CT-41).
