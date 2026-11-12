# Handoff 2026-11-12: authority levels (CT-250, DEC-0162)

Branch `agent/ct250-levels-20261112`, from main `e9bb7ac7`. Entry point: [DEC-0162](../DECISIONS.md) and
[membership, Levels](../specification/membership.md#levels).

## Objective

Turn the authority levels design ([2026-11-12-ct250-authority-levels.md](../evidence/plans/2026-11-12-ct250-authority-levels.md))
into one decision with its schemas, reference code, vectors and pages, by the organization slice of 2026-11-21
(fabric-workspace board request `4a1bf8d6`, thread `8da128cf`).

## Done

- `schemas/org-membership-2.schema.json` (new); `decision.schema.json` takes the level form (`oneOf` operator or level);
  `mandate.schema.json` takes `by: "level"` with `level`, `org`, `membership`; `delegation-token.schema.json` takes `mem`.
- `src/org-membership.ts` reads `/2` for a reader with `levels: true` (a `/1` verdict keeps its shape);
  `src/signing-challenges.ts` registers `org-membership/2`; `src/levels.ts` (new): `levelStanding` and `FAC-SEM-170`;
  `src/actions.ts` and `src/mandate.ts` read level decisions and level mandates at every tier when bound;
  `src/delegation.ts` and `src/delegation-rules.ts` parse `mem` and keep it onward (`FAC-SEM-050`).
- `fixtures/vectors/levels.json` from `tools/vectors/levels.ts` (expected answers by hand), `test/levels.test.ts`;
  positive, negative and semantic fixtures; registers (rule codes `FAC-SEM-169`, `FAC-SEM-170`, receipts SEM-0169 and
  SEM-0170; the signing register; protocol revisions `org-membership` 1 and 2; schema count 152).
- Pages: membership (`/2`, OL-6 amended, *Levels* LV-1 to LV-11, rules, adopters, not decided), service AP-2 to AP-5
  and the `actionDecision` table, delegation (`mem`, DL-18, DL-26, MD-3, MD-5, MD-6), governance's approval
  separation, source's hand-over word (design question 1's default), conformance (rows, modules, codes, register).
- Deviations from the design, recorded in DEC-0162's Alternatives: `projects` is always present (empty unless
  architect), since OM-1 and the signing register keep every member present; a level mandate names no `project` of its
  own (its scope's `projects` does); `level-role` is a `decision-invalid` detail for a level above the role.

## Open

- The operator's questions take the design's defaults; an answer otherwise before 2026-11-21 changes DEC-0162.
- Landing note with DEC-0156 (`agent/ct220-operators-word-v2`), binding whichever lands second: DEC-0162 item 8
  decides it (a bound level holder's words carry a task inside the level; a host's gate taking AP-2's decision takes a
  bound level decision; every other ask stays); the second lander writes it into OW-6 ("the operator's or, in an
  organization, a level holder's within LV-2"), OW-1, OW-2, OW-5 and OA-4, and drops OW-3's "until CT-250's decision".  Checks on the merged tree (DEC-0156's own): `awk '/^- \*\*OW-6/,/^## Semantic rules/'
  docs/specification/governance-and-roles.md | grep -c DEC-0162`, `awk '/^- \*\*OA-4/,/^- \*\*OA-5/'
  docs/specification/delegation.md | grep -c DEC-0162`, and the same OW-1, OW-2 and OW-5 ranges (`awk '/^- \*\*OW-1/,/^- \*\*OW-2/'` and so on), each print at least 1 (0 on the merged tree before the edit, round 2 seam);
  `awk '/^- \*\*OW-3/,/^- \*\*OW-4/' docs/specification/governance-and-roles.md | grep -c "until CT-250's decision and
  Fabric"` prints 0 (round 1, seam and product).
- Landing note with DEC-0159 (`agent/ct218-local-cloud-v2`): DEC-0162 item 8 decides it (no level for a client-key
  caller; keys stay the operator's; CF-4's twins take a bound level decision); the second lander restates CF-3 and
  CF-4 so: CF-3's key twins declare `level: operator`, the client key carries no `mem`, CF-4's twins take a bound level decision, and the pending "CT-250's `mem` claim" citation goes. Check on the merged tree: `awk '/^- \*\*CF-3/,/^- \*\*CF-5/' docs/specification/service.md | grep -c 'DEC-0162'` prints at least 1 (0 before the edit) and the same range with `grep -c "CT-250's"` prints 0 (1 before the edit) (round 2 seam replaced round 1's check, which this decision's own item 8 already satisfied).
- Landing note with DEC-0158 (`agent/ct215-on-demand-20261108`): a level holder's task travels over the board as words a dispatched run reads, never as a service mandate (LV-6, *The board*); the second lander says so beside OS-7. Check: `grep -c 'DEC-0162' docs/specification/project-comms.md` on the merged tree prints at least 1 (round 2 seam).
- Landing step, the knowledge base: fabric-workspace `knowledge/authority.md`'s "Not built yet" cites DEC-0162,
  names what remains (the hub route CO-523, the adopters), and bounds the interim reading as membership.md does (inside one product only; on the wire `by: operator` only for the operator's own words, AP-3); `knowledge/agents-first.md` replaces "decided by the contract's CT-250" with DEC-0162 and source.md's level rule; `north-star.md` G26 and `system/engineer.md` E4 name DEC-0162 where they wait on "the roles DEC (CT-250)"; and `knowledge/north-star.md` G2's status cell reads
  "contract DEC-0162 landed; adopters open"; then the workspace sync. Check: `git -C fabric-workspace grep -c
  'DEC-0162' origin/main -- knowledge/authority.md knowledge/north-star.md knowledge/agents-first.md knowledge/system/engineer.md` prints at least 1 for each, and `git -C fabric-workspace grep -c "decided by the contract's CT-250" origin/main -- knowledge/agents-first.md` prints 0 (rounds 1 and 2). The Telegram gateway's owner is asked on the board for its row (the adopter line names none yet).
- The operator's questions: posted as board message `b719b08e` on thread `8da128cf` (round 1, product); question 4's widened text (who sets and who changes L1) and question 8 (client keys of an instance the organization deploys) follow in a reply after round 2's fold.
- With DEC-0157 (`agent/ct216-usage-data-v2`, its round 30 seam): UD-4 admits only the operator's own decision for a
  declined usage switch; LV-7 says a level decision is not that word unless the holder is that person's operator.
  Whichever lands second makes UD-4 say so and cite DEC-0162, and LV-7 cite UD-4 by its landed link. Checks on the
  merged tree: `awk '/\*\*UD-4/,/\*\*UD-5/' docs/specification/usage-data.md | grep -c 'level'` and `git grep -n 'UD-4'
  -- docs/specification/membership.md docs/DECISIONS.md | grep -c 'DEC-0162\|LV-'` each print at least 1.
- Adopters owe the reading (DEC-0162 Compatibility): the organization product, Fabric CO-523, the adapter FAA-249,
  Observatory OBS-377, Switchboard SB-291, Fabric Inbox B-232, Fabric Dashboards FD-164, the launcher PC-162, the copy
  service AUTH-01, the platform PLAT-141 and PLAT-146.

## Checks run

- Round 1 (on `ea07a8a9`): none clean. Breaks folded: an architect on a call in no project, and an owner or admin
  deciding at the architect level (unit); the hub dropped a T2 origin's level forms (interop C3.5); a level mandate
  handed on reached a callee its attestation is not for; the DEC-0156 and DEC-0159 reconciliations owed by this DEC
  (item 8); the schemas' `$ref` closure grew for vendoring consumers (now inline); dependent rows on a T2 mandate
  (seam); no route for an attestation to a service (`levels` in the actions extension, OM-7's row); billing given to
  administrators against the operator's record (now the owner's, `level-insufficient: owner`); the refusal's remedy
  had no route (one request to a holder of that level); source hand-over at T2 and its detail (e); no scenario
  (SCN-060) (product). Risks folded: null contexts; the service's elicitation read first; `held` per subject;
  the levelStanding comment; the decision schema's description; the mandate record's project; `context-invalid`
  named; T2 refusals carry the digest; UD-4 for an organization's deployed component; the agent-side conformance
  row; OL-6 and source wording; the record's approver resolved by the issuer (question 7); the interim reading;
  the knowledge-base landing step. Declined: none.
- `pnpm run check` exit 0 on the round-1 head (11250 tests passed, 3 skipped), on the round-1 fold (11259 passed, 3 skipped) and on the round-2 fold (11269 passed, 3 skipped; coverage floors met; UX lint, docs
  check with 0 markdownlint errors, privacy check).

- Round 2 (on `001d55f7`): none clean. Unit: T2 refusals on the level branch without `data.actionDigest`, a T2 call
  without a digest not a fault, the `actionDecision` docstring; folded. Seam, breaks folded: readers pinned before
  DEC-0162 refuse a level form rather than ignore it (the protocol name `levels/1` gates it; LV-5, LV-10, interop
  C3.5, Compatibility); client keys were open to an administrator's level decision (an action's `level: operator`,
  refused `level-insufficient: operator`; CF-3's key twins declare it); the DEC-0159 landing check was already green
  on this branch (now a check on CF-3 to CF-5's text); the knowledge-base step missed `agents-first.md`, G26 and E4.
  Seam risks folded: `actionsView` returns `levels`, FAC-SEM-142 flags a `level` on a non-relayed action and an
  organization named twice (fixtures); the DEC-0156 checks grep DEC-0162 and cover OW-1; a level holder's task over
  the board (LV-6, a landing note with DEC-0158). Product, breaks folded: the hub's check of a declared audience is
  stated as open (Not decided, Consequences); SCN-060 on P-02, ST-035's level criterion, FLW-29's level branches,
  SCR-30's level state and audit fields; the interim reading bounded by AP-3 in membership.md and the landing step.
  Product risks folded: a board hold and a slot move stay the operator's (LV-7); L1 set and changed by the owner in an
  organization (spend-policy's L1 row, question 4 widened, the schema's billing list exactly LV-7's); the source
  hand-over default bounded to T0 or T1 in Compatibility; client keys as question 8; the Telegram gateway's row asked
  at landing and the organization product's VES-AUTHORITY-LEVELS row; the re-carried mandate keeps `instruction`,
  `at`, `expiresAt` and scope. Declined: none.

## Next task

Round 3 of the blind readings (unit, seam, product) of branch `agent/ct250-levels-20261112` (DEC-0162), then the reply
on thread `8da128cf` with question 4's widened text and question 8.
