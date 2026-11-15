# Handoff 2026-11-15 (part 6): DEC-0172, the decision verdict

**Objective.** Give Fabric's door `decision.verify` (CT-302) a wire: a receipt a decision verifier writes about an
agent's call, which the hub checks before it dispatches the call, so an agent can act on its own decision where the
rules let it and a person is called in only where the rules keep the act for one.

**Done.**
- DEC-0172 accepted and merged: the record `decision-verdict/1` ([schema](../../schemas/decision-verdict.schema.json),
  [specification](../specification/decision-verdict.md)), DV-1 to DV-8: the asked call and its `askedDigest`, the id,
  the arguments' HMAC under the host key, the routes and their grades, the lifetimes, the addressees of a `human`
  verdict, and the hub's check at dispatch (`checkVerdictDispatch`, refusal `decision-invalid` with `verdict-mismatch`).
- `interop-agent-call-2` carries `verdict`; the authority extension carries DV-5's per-action members; the rule
  `FAC-SEM-179` (kinds `decision-verdict` and `decision-verdict-reference`); vectors
  [`decision-verdict.json`](../../fixtures/vectors/decision-verdict.json).
- Blind readings: rounds 1, 2 and 4 folded (round 4: a job step carries no receipt; rule 3's addressees by context),
  rounds 5 and 6 clean on all three tiers; round 3 clean.
- Filed: CT-323 (DEC-0172's risks from its readings).

**Checks run.** `pnpm run check` exit 0 on the landing commit (see the PR).

**Open.**
- The fixes wave on `agent/fixes-wave-20261115`: CT-317 (5) to (9) and CT-322's reader scenario and tenant vector done;
  CT-323's small items next.
- CT-321's design on `agent/ct321-design-20261115` (the extension `instance-facts/0.1`); its DEC next.
- CT-317 (2), the root pin rule: DEC after DEC-0172, due 2026-11-29.
- DEC-0158's OS-6 and OS-7 re-cut.

**Owed elsewhere.** Fabric's door `decision.verify`, its journal and the hub's check (their spec due 2026-11-17); the
agents database's client (D-45); the adapter kits' `PROTOCOL_REVISIONS` (`decision-verdict/1`) at their next repin.

**Next task.** Land the fixes wave and CT-321's design, then CT-321's DEC (answer due 2026-11-22), then CT-323's items by priority.
