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
  SEM-0170; the signing register; protocol revisions `org-membership` 1 and 2; schema count 153).
- Pages: membership (`/2`, OL-6 amended, *Levels* LV-1 to LV-11, rules, adopters, not decided), service AP-2 to AP-5
  and the `actionDecision` table, delegation (`mem`, DL-18, DL-26, MD-3, MD-5, MD-6), governance's approval
  separation, source's hand-over word (design question 1's default), conformance (rows, modules, codes, register).
- The authority extension `extensions/authority/0.1` (`schemas/service-authority-extension.schema.json`, the key in
  `src/extensions.ts`, `authorityView` and `authorityExtensionRules` in `src/actions.ts`, FAC-SEM-142's authority
  clause); the protocol `levels/1` (`src/protocol-revisions.ts`, versioning); pages beyond the list above:
  spend-policy (L0, L1, L2), project-comms (Owner settlement, Opt-out, Holds, PR-2), interop (C3.5, `_meta.decision`),
  contexts (access levels), CONTEXT.md, DOCMAP, the producer checklist; UX: SCN-060 (new), SCN-016, ST-012, ST-035,
  FLW-10, FLW-29, SCR-13, SCR-30.
- Deviations from the design, recorded in DEC-0162's Alternatives: `projects` is always present (empty unless
  architect), since OM-1 and the signing register keep every member present; a level mandate names no `project` of its
  own (its scope's `projects` does); `level-role` is a `decision-invalid` detail for a level above the role.

## Open

- The operator answered all twelve questions on 2026-11-13 in this repository's session `7c9eb2c2` (asked in its chat): questions 1, 3, 5 to 8, 11 and 12 as their defaults; question 4 otherwise (every spend limit the owner's or an administrator's, never an architect's, which also settles question 2: an architect changes no policy); question 9 otherwise (an administrator decides a board hold, a slot move and a Project's listing too, a host declaring `admin`); question 10 otherwise (an administrator's command does not wait for the level route; AP-3 still keeps `by: operator` for the operator's words). Folded into DEC-0162, membership LV-6, LV-7, LV-10 and Who adopts it, spend-policy, governance, project-comms, the authority extension schema, the producer checklist, FLW-10, ST-012, SCR-13 and SCN-016. Relay the answers on thread `8da128cf` as a reply to `bd18b1fa` when the board MCP is back, for the record (no question is open).
- Landing note with DEC-0156 (`agent/ct220-operators-word-v2`), binding whichever lands second: DEC-0162 item 8
  decides it (a bound level holder's words carry a task inside the level; a host's gate taking AP-2's decision takes a
  bound level decision; every other ask stays); the second lander writes it into OW-6 ("the operator's or, in an
  organization, a level holder's within LV-2"), OW-1, OW-2, OW-5 and OA-4, and drops OW-3's "until CT-250's decision".  Checks on the merged tree (DEC-0156's own): `awk '/^- \*\*OW-6/,/^## Semantic rules/' docs/specification/governance-and-roles.md | grep -c DEC-0162`, `awk '/^- \*\*OA-4/,/^- \*\*OA-5/' docs/specification/delegation.md | grep -c DEC-0162`, and the same OW-1, OW-2 and OW-5 ranges (`awk '/^- \*\*OW-1/,/^- \*\*OW-2/'` and so on), each print at least 1 (0 on the merged tree before the edit, round 2 seam);
  `awk '/^- \*\*OW-3/,/^- \*\*OW-4/' docs/specification/governance-and-roles.md | grep -c "until CT-250's decision"` prints 0 (round 1, seam and product; one line since round 9).
  The second lander also rewrites OW-3's people.ask clause ("the operator's only where CT-266 or CT-250's decision
  says so") against DEC-0162 (a level holder's answer through `people.ask` carries no `mem`, so it is not a level
  decision; a level holder's task travels as LV-6 *The board* says), updates conformance.md's operator's-word row
  ("pending CT-250's decision"), and closes CT-266 with a receipt naming DEC-0162. Checks on the merged tree after the
  edit: `awk '/^- \*\*OW-3/,/^- \*\*OW-4/' docs/specification/governance-and-roles.md | grep -c 'CT-250'` prints 0
  (2 before); `grep -c "pending CT-250's decision" docs/specification/conformance.md` prints 0 (1 before);
  `grep '^| CT-266 ' docs/backlog.md | grep -c closed` prints 1 (0 before) (round 3, seam). Then membership.md's
  "on branch `agent/ct220-operators-word-v2` until it lands" citations become links (`git grep -c 'ct220-operators-word-v2' -- docs/specification/membership.md` prints nothing after).
  Tokens, so that this note's checks and DEC-0156's own both pass: the second lander writes "DEC-0162 (CT-250)" in OW-1,
  OW-2, OW-5, OW-6 and OA-4, and DEC-0162 alone in OW-3 (round 5, seam). The governance hunk is DEC-0162's approval-separation paragraph, which stays beside OW-1 to OW-6: `grep -c "A level holder's decision in an organization (DEC-0162)" docs/specification/governance-and-roles.md` prints 1 on the merged tree (round 6, seam). The other hunks with DEC-0162 text keep both sides too: `awk '/^### FLW-29/,/^### FLW-30/' docs/ux/flows.md | grep -c DEC-0162` prints at least 3 and the same range with `grep -c DEC-0156` at least 1; ST-035's level criterion stays (`awk '/^### ST-035/,/^### ST-036/' docs/ux/foundation.md | grep -c 'level-insufficient'` at least 1); the CT-250 backlog row keeps both edits (`grep '^| CT-250 ' docs/backlog.md | grep -c "DEC-0156's landing note"` prints 1 and `grep '^| CT-250 ' docs/backlog.md | grep -c DEC-0162` prints 1) (round 7, seam). SCR-30's Elements, States, Coverage and Scenarios keep both sides: `awk '/^### SCR-30/,/^### SCR-31/' docs/ux/screens.md | grep -c DEC-0162` at least 2 and the same range with `DEC-0156` at least 3 (round 8, seam).
- Landing note with DEC-0159 (`agent/ct218-local-cloud-v2`): DEC-0162 item 8 decides it (no level for a client-key
  caller; keys stay the operator's; CF-4's twins take a bound level decision); the second lander restates CF-3 and
  CF-4 so: CF-3's key twins are declared `operator` in the authority extension's `actionLevels`, the client key carries no `mem`, CF-4's twins take a bound level decision, and the pending "CT-250's `mem` claim" citation goes. Check on the merged tree: `awk '/^- \*\*CF-3/,/^- \*\*CF-5/' docs/specification/service.md | grep -c 'DEC-0162'` prints at least 1 (0 before the edit) and the same range with `grep -c "CT-250's"` prints 0 (1 before the edit) (round 2 seam replaced round 1's check, which this decision's own item 8 already satisfied). The merge has 13 conflict hunks (12 without the handoffs index), 12 of them holding DEC-0162 text on this side (10 outside DECISIONS.md and the index): every hunk keeps both sides' rule text; service.md keeps one FAC-SEM-142 row carrying both the authority-key clause and CF-4's exception, and AP-4 both sentences. Checks on the merged tree: `grep 'id="fac-sem-142"' docs/specification/service.md | grep -c authorityExtensionRules` and the same with `grep -c CF-4` each print 1; for `CONTEXT.md`, `docs/specification/conformance.md`, `delegation.md`, `interop.md`, `service.md`, `source.md`, `spend-policy.md` and `docs/ux/foundation.md`, `git grep -c DEC-0162` is at least this branch's count; and for the same files `git grep -c DEC-0159` is at least ct218's own count (its CF-4 sentence in AP-4 among them); membership.md's `agent/ct218-local-cloud-v2` citations become links (`git grep -c 'ct218-local-cloud-v2' -- docs/specification/membership.md` prints nothing after) (round 6, seam).
- Landing note with DEC-0158 (`agent/ct215-on-demand-20261108`): a level holder's task travels over the board as words a dispatched run reads, never as a service mandate (LV-6, *The board*); the second lander says so beside OS-7. Check: `awk '/^- \*\*OS-7/,/^## /' docs/specification/project-comms.md | grep -c 'DEC-0162'` on the merged tree prints at least 1 (0 before, 24 lines; round 4 fixed the pattern for OS-7's list item), and membership.md's `agent/ct215-on-demand-20261108` citation becomes a link (`git grep -c 'ct215-on-demand-20261108' -- docs/specification/membership.md` prints nothing after, round 6). The second lander also states beside OS-7 that a dispatched run reads a level mandate in a board request's body as absent (no rule refuses one there): `awk '/^- \*\*OS-7/,/^## /' docs/specification/project-comms.md | grep -c 'level mandate'` prints at least 1 (round 8, seam).
- Landing note with DEC-0165 (`agent/ct292-task-context-20261112`): whichever lands second says in contexts.md TC-2
  and TC-3 whether a level holder's words are a claim of a task's context (for its own organization only) and whether
  TC-4's question may go to that holder; default: a bound level holder's words are a claim within its organization, and
  the question stays the operator's. Check: `awk '/^- \*\*TC-2/,/^- \*\*TC-5/' docs/specification/contexts.md | grep -c 'DEC-0162'` on
  the merged tree prints at least 1 (0 before; round 4 scoped it), the question's route being TC-4's (round 3 and 4, seam). The merge also conflicts in `src/semantic-rules.ts` (keep both early returns: `grep -c 'levelRules(kind, value)' src/semantic-rules.ts` and `grep -c 'taskContextRules(kind, value)' src/semantic-rules.ts` each print 1) and in four conformance.md hunks (both sides' rule rows and module rows, this branch's `src/actions.ts` and `src/mandate.ts` rows keeping their level text; the next free code is the highest used plus one); the gate decides (round 7, seam). Module rows check: `grep '^| \[`src/actions.ts`\]' docs/specification/conformance.md | grep -c DEC-0162` prints 1 (round 8, seam).
- Landing note with CT-290's decision (setup steps, its design on main): LV-7 refers to every `humanStep` AP-4 lists,
  so a gate CT-290 adds (one-time code, attest, publish) binds levels without an edit; whichever lands second says
  whether a `publish` human gate covers a source hand-over a level decides (round 3, product).
- Landing note with DEC-0167 (`agent/ct252-estate-manager-20261112`), binding whichever lands second: MG-5 says the hub
  declares `admin` in its authority extension's `actionLevels` for the `ceo` slot's assignment action (an action left out
  would be an architect's), the `product-manager` slot keeping the architect default, and that LV-7's move of a
  responder slot is the board's, not a role slot. Check on the merged tree: `awk '/^- \*\*MG-5/,/^- \*\*MG-6/' docs/specification/governance-and-roles.md | grep -c 'actionLevels'` prints at least 1 (0 before), and the schema count
  is the sum of both branches' new schemas (round 5, seam). MG-5 drops "or mandate" (assigning a slot is `change-policy`, which no mandate covers, MD-3): `awk '/^- \*\*MG-5/,/^- \*\*MG-6/' docs/specification/governance-and-roles.md | grep -c 'or mandate'` prints 0 (round 6, seam). The merge also conflicts in three conformance.md hunks (this branch's `src/levels.ts` module row and the `src/org-membership.ts` row with FAC-SEM-169 stay: `grep -c '^| \[`src/levels.ts`\]' docs/specification/conformance.md` prints 1 and `grep '^| \[`src/org-membership.ts`\]' docs/specification/conformance.md | grep -c FAC-SEM-169` prints 1) and in `test/positive-sweep.test.ts` (both the levels and the role-slot sources) and `test/schema-compilation.test.ts` (the schema count 154) (round 8, seam).
- Landing note with DEC-0166 (`agent/ct285-autonomy-profile-20261112`): its lander turns DEC-0162 Alternatives' "on branch
  `agent/ct285-autonomy-profile-20261112` until it lands" into a link (`awk '/^### DEC-0162/,/^### DEC-0163/' docs/DECISIONS.md | grep -c 'ct285-autonomy-profile'` prints 0 after; round 6, seam). At the merge into DEC-0166's branch, `schemas/mandate.schema.json`'s description keeps both clauses: `grep -c 'level mandate never travels over the board\|neither a level mandate nor a standing mandate travels over the board' schemas/mandate.schema.json` prints 1 (DEC-0166 rewords the clause to cover both mandates; round 10, seam) and `grep -c 'standing' schemas/mandate.schema.json` at least 1 (round 8, seam).
- Landing step, the knowledge base: fabric-workspace `knowledge/authority.md`'s "Not built yet" cites DEC-0162,
  names what remains (the hub route CO-523, the adopters), and states the interim reading as membership.md does (an administrator's command taken at once, across products, through each product's own approval surface; on the wire `by: operator` only for the operator's own words, AP-3); `knowledge/agents-first.md` replaces "decided by the contract's CT-250" with DEC-0162 and source.md's level rule; `north-star.md` G26 and `system/engineer.md` E4 name DEC-0162 where they wait on "the roles DEC (CT-250)"; `system/prompt-onboarding.md` ("after the contract's DEC on CT-250", "DECs on CT-250 (first)", "The contract's DEC on CT-250 holds" the organization product's row) names DEC-0162 as landed and the adopters as what still holds those rows; `north-star.md:147` ("has no project architect") and `:544` (levels "wait for the contract's DEC") and `authority.md:117,124` ("the levels CT-250 defines") state that the contract has the architect level (DEC-0162) and that adopters are open; and `knowledge/north-star.md` G2's status cell reads
  "contract DEC-0162 landed; adopters open"; then the workspace sync. Check: `git -C fabric-workspace grep -c 'DEC-0162' origin/main -- knowledge/authority.md knowledge/north-star.md knowledge/agents-first.md knowledge/system/engineer.md` prints at least 1 for each, and `git -C fabric-workspace grep -c "decided by the contract's CT-250" origin/main -- knowledge/agents-first.md` prints 0, and `git -C fabric-workspace grep -c "has no project architect\|wait for the contract's DEC" origin/main -- knowledge/north-star.md` prints nothing (rounds 1 to 3). A messaging gateway's owner is asked on the board for its row (the adopter line names none yet). Phrase checks, not line numbers (round 4): `git -C fabric-workspace grep -c "levels CT-250 defines\|contract's levels (CT-250)\|the roles DEC (CT-250)\|has no project architect\|wait for the contract's DEC" origin/main -- knowledge/authority.md knowledge/north-star.md` prints nothing after the sync, and `git -C fabric-workspace grep -c 'DECs\? on CT-250' origin/main -- knowledge/system/prompt-onboarding.md` prints nothing (round 5). The step also covers `knowledge/system/modules.md` SU-3 ("after the DEC on CT-250"), and the final check reads the whole folder: `git -C fabric-workspace grep -c "DECs\? on CT-250\|contract roles (CT-250)\|contract CT-250 (open PR #246)" origin/main -- knowledge` prints nothing after the sync (round 6, seam).
- Landing note with DEC-0160 (`agent/ct228-port-claim-20261108`): its scenario is also numbered SCN-060 ("On Windows, my service waits for an administrator to create the port claims folder"); whichever lands second renumbers its scenario and every trace of it (the index row, SCR-30's Scenarios list for this branch's). The merge also conflicts in `vitest.config.ts` (keep both `src/levels.ts` and `src/port-claim.ts` in the coverage list) and in `test/schema-compilation.test.ts` (151 plus each landed branch's new schemas). Check on the merged tree: `grep -c '^### SCN-060' docs/ux/scenarios.md` prints 1, `pnpm ux:lint` exits 0, `grep -o '"src/levels.ts"' vitest.config.ts | wc -l` and the same for `src/port-claim.ts` each print 2, and `pnpm vitest run test/schema-compilation.test.ts` passes (rounds 12 and 13).
- Uniqueness checks on every merged tree (round 10, seam): a keep-both resolution passes every presence check above, ux:lint and docs-check, so each lander also runs these, and each prints 1 (2 on a union resolution): `grep -c '^| CT-250 ' docs/backlog.md`; `awk '/^### FLW-29/,/^### FLW-30/' docs/ux/flows.md | grep -c '^- \*\*Goal:'`; `awk '/^### SCR-30/,/^### SCR-31/' docs/ux/screens.md | grep -c '^- \*\*Elements:'`; `grep -c 'id="fac-sem-142"' docs/specification/service.md`; and in `docs/specification/conformance.md` `grep -c '^| \[`src/actions.ts`\]'`, the same for `src/mandate.ts` and `src/org-membership.ts`.
- The operator's questions: posted as board message `b719b08e` on thread `8da128cf` (round 1, product); question 4's widened text and question 8 went in `9faffa1d` after round 2's fold; question 9 and question 8's clarification went in `25f3ca27` after round 3's. Question 10 (round 5), question 9's listing and settlement clauses (round 6) and question 8 widened to the architect (round 8) went in `bd18b1fa` on 2026-11-12 at 21:00 UTC, once the board answered again (it answered HTTP 503 through the day), with DEC-0166's questions 1 to 5. Questions 11 and 12 and question 8's round-12 clause were never posted (the board's MCP disconnected after `bd18b1fa`); the operator answered all twelve in this repository's chat on 2026-11-13 (see the first Open item).
- With DEC-0157 (`agent/ct216-usage-data-v2`, its round 30 seam): UD-4 admits only the operator's own decision for a
  declined usage switch; LV-7 says a level decision is not that word unless the holder is that person's operator.
  Whichever lands second makes UD-4 say so and cite DEC-0162, and LV-7 cite UD-4 by its landed link. Checks on the
  merged tree: `awk '/\*\*UD-4/,/\*\*UD-5/' docs/specification/usage-data.md | grep -c 'level'` and `awk '/^- \*\*LV-7/,/^- \*\*LV-8/' docs/specification/membership.md | grep -c 'usage-data.md#'` each print at least 1 (0 before; round 3 scoped the
  second to LV-7), and `git grep -c 'ct216-usage-data-v2' -- docs/specification/membership.md` prints nothing after.
- Adopters owe the reading (DEC-0162 Compatibility): the organization product, Fabric CO-523, the adapter FAA-249,
  Observatory OBS-377, Switchboard SB-291, Fabric Inbox B-232, Fabric Dashboards FD-164, the launcher PC-162, the copy
  service AUTH-01, the platform PLAT-141 and PLAT-146. A port pinned past DEC-0162 adds `levels` ['1'] and
  `org-membership` ['1', '2'] to both of the adapter kits' hand-kept `PROTOCOL_REVISIONS`, whether or not it adopts the
  level form (round 6, seam).

- Landing note with DEC-0164 (`agent/ct259-activity-unit-20261112`): the merge conflicts in `src/protocol-revisions.ts`
  (`NAMED_ONLY`), versioning.md's named-only list and conformance.md (the rule rows and the next free code). Keep both
  sides: on the merged tree `grep -c '"levels/1"' src/protocol-revisions.ts` and `grep -c '"activity-unit/1"' src/protocol-revisions.ts` each print 1, `grep -c 'levels/1' docs/specification/versioning.md` and `grep -c 'activity-unit/1' docs/specification/versioning.md` each at least 1, and `grep -c '^| \`FAC-SEM-1\(69\|70\|71\)\` |' docs/specification/conformance.md` prints 3; the next free code from the CAS counter (round 9, seam).
- At the merge into DEC-0166's branch, conformance.md's two implementor rows: keep this branch's adopter row (the rule proposal's approval and `admin` for any other type) and DEC-0166's standing clause: `grep -c "rule proposal's approval (type \`rule\`" docs/specification/conformance.md` prints at least 1 and `grep -c 'standing mandate its token binds by' docs/specification/conformance.md` prints at least 1. At the DEC-0165 merge the three level rows stay: `grep -c '^| a hub that binds a level\|^| an agent relaying a level holder\|^| a service that reads authority levels' docs/specification/conformance.md` prints 3 (round 9, seam).

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
- `pnpm run check` exit 0 on the round-1 head (11250 tests passed, 3 skipped), on the round-1 fold (11259 passed, 3 skipped) on the round-2 fold (11269 passed, 3 skipped) on the round-3 fold (11276 passed, 3 skipped) on the round-4 fold (11279 passed, 3 skipped), on the round-5 fold (11280 passed, 3 skipped), on the round-6 fold (11280 passed, 3 skipped), on the round-7 fold (11281 passed, 3 skipped), on the round-8 fold (11281 passed, 3 skipped) and on the round-9 fold (11282 passed, 3 skipped; coverage floors met; UX lint, docs
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
  hand-over default bounded to T0 or T1 in Compatibility; client keys as question 8; a messaging gateway's row asked
  at landing and the organization product's VES-AUTHORITY-LEVELS row; the re-carried mandate keeps `instruction`,
  `at`, `expiresAt` and scope. Declined: none.

- Round 3 (on `0bed5576`): unit clean (four risks folded: a level decision at a service reading no levels hides no
  mandate; FAC-SEM-170 asks an architect attestation alone to name its projects; `levels` that is not a map is the
  `levels-invalid` fault; the held record is the service's own). Seam, break folded: `levels` and an action's `level`
  sat in the closed actions extension, which every deployed reader refuses member by member, so a service adopting
  levels would lose its declared actions in hosts not yet updated; they move to a new key beside it,
  `extensions/authority/0.1` (`service-authority-extension.schema.json`: `levels`, `actionLevels` by action id;
  `authorityView`; FAC-SEM-142 flags it), and `actionDecision` reads `actionLevel`. Seam risks folded: the DEC-0156
  note covers OW-3's people.ask clause, the conformance row and CT-266; the DEC-0157 and DEC-0158 checks are scoped to
  LV-7 and OS-7; each note sweeps its "until it lands" citation; the knowledge-base step names north-star 147 and 544
  and authority 117 and 124; a DEC-0165 note; LV-7 refers to AP-4's `humanStep` list. Product, breaks folded:
  SCN-060's index row; the refusal tables of delegation DL-19 and interop C3.5 name the level details; CONTEXT's
  Relayed decision and Source hand-over and source.md's hand-over sentence admit the level decision; a board hold and
  a slot move are `operator` in the authority extension (project-comms Holds and PR-2); a level holder's task over the
  board stays inside the holder's own estate, the cross-member route not decided (product approval surface meanwhile);
  an organization project's L1 in SCN-016, ST-012, SCR-13 and the spend policy; DOCMAP. Product risks folded:
  question 8 names its departure from the operator's record, question 9 (holds and slots); L0 and L2 rows; the DEC's
  status cites `b719b08e` and `9faffa1d` and says a later answer is a new decision; a messaging gateway named
  neutrally; Level told apart from spend and access levels; FLW-29's entry point, exits and failing-level branch;
  SCR-30's approver; a CT-290 note. Declined: none.

- Round 4 (on `cf0acb1c`): unit clean (risks folded: an action level that is not one of the four is the
  `action-level-invalid` fault; `mandateCovers` answers `levels-invalid` for level contexts that are not a map;
  `src/levels.ts` under a 100 % branch floor). Seam, breaks folded: LV-5's protocol sentence named the actions
  extension; the authority findings and fixtures sat under the actions prefix the ports glob (now
  `authorityExtensionRules` and `service-well-known-authority-*`, `-levels-ok` kept under the actions prefix); the OS-7
  check matched nothing. Seam risks folded: the authority root is open to later members (DEC-0166's `standing`); the
  DEC-0165 check scoped to TC-2 to TC-4; knowledge-base phrase checks; the DEC-0159 note names `actionLevels`; the
  ports' repin cost in Compatibility. Product, breaks folded: interop's count of keys; Consequences; OM-8 for `/2`;
  ST-012's split line; FLW-10's waiting branch. Product risks folded: FLW-29's level paths; owner settlement and "the
  operator" in an organization's context (LV-7, question 9); question 9's message `25f3ca27`; the Status names what it
  amends; L0 for an organization not yet specified; the authority key in service.md's extensions list; the producer
  checklist; OL-1 lists an architect as `member`; the stray clause, a lowercase sentence, CT-250's status. Declined:
  none.

- Round 5 (on `3e747720`): unit clean (risks folded: from T2 a bound level mandate beside an operator decision is read;
  a declared level that is not one of the four is the strictest in `levelStanding`). Seam, break folded: the ports'
  recipe names `mandate-level` and the counts that move. Seam risks folded: the DEC-0156 tokens; a DEC-0167 note; the
  FAC-SEM-142 row covers the authority key; prompt-onboarding.md in the knowledge-base step; the schema count. Product,
  breaks folded: FLW-29's duplicate node; one list of the acts no level decides (a hold, a slot move, an owner's
  settlement, client keys) in LV-6, LV-7, item 8, the checklist and the schema; FAC-SEM-142's text; CONTEXT's Membership
  attestation. Product risks folded: question 10 (the interim reading); the threshold approver in Not decided; FLW-29's
  ended branch and SCN-060's; ST-035's operator remedy; the Status and Consequences; DEC-0166 cited as on its branch; a
  key from the credential queue in LV-7's billing list; LV-7's self-reference. Declined: none.
- Round 6 (on `488ccdc7`): unit clean (risks folded: the elicitation-first rule cited as LV-4; `byLevel`'s
  `level-insufficient` details). Seam, break folded: the ports' recipe names the hand-kept `PROTOCOL_REVISIONS`. Seam
  risks folded: the counts with the two fixtures left out and once read; the DEC-0159 and DEC-0156 notes keep both
  sides' text with checks; sweeps for the ct215, ct218 and ct285 citations (the schema's dropped); modules.md and the
  whole-folder phrase check; MG-5's "or mandate". Product, breaks folded: an owner's settlement is no relayed action, so
  nothing declares it; a Project's listing and unlisting joins the acts no level decides (Opt-out, question 9); LV-7's
  credential-queue clause reverted (credentials.md's administrator or policy decides); the Status names questions 1 to 9
  as posted and 10 as pending. Product risks folded: a proposal's approval takes no level (`approvedBy`, FAC-SEM-104);
  SCN-016 says the owner's route is not decided and the run waits; a level grants no governance role, the act takes its
  declared level; L0 stays each estate's operator's, an organization-wide total being the owner's once specified;
  interop's `_meta.decision` and DOCMAP's row name the level form and the authority key; FLW-29's other level-membership
  problems go to O and VC to C; Consequences name CONTEXT.md once. Declined: none.
- Round 7 (on `30fe601c`): unit clean, seam clean. Product, breaks folded: LV-7's tripled credential sentence (a fold
  script's rerun) kept once; LV-6's and item 8's gate lists name a Project's listing, an owner's settlement being no
  gate; a proposal's approval follows `approvedBy` (a checker rule's the operator's, FAC-SEM-104; another's an `admin`
  level decision recorded as `{role: administrator}`). Product risks folded: interop's "as an operator's decision is";
  Holds names the owning member; governance says a level grants no role; FLW-10's edge and ST-012 wait on PC-162's
  route; the mandate schema says a level mandate never travels over the board; question 9's settlement clause. Seam
  risks folded: the DEC-0156 note checks FLW-29, ST-035 and the CT-250 row; the DEC-0165 note names the
  semantic-rules and conformance hunks; `DECs\? on CT-250`; the DEC-0159 counts and its own side's count; a port's
  `mem` case in Compatibility; `decidedBy` for an owner's choice stated as not decided. Unit risk folded: a vector for
  an unbound level decision beside an operator's mandate. Declined: the T2 `digest-missing` fault before the level read
  (intended: DL-18's route needs the digest on every T2 refusal); a dedicated detail for an organization the service
  reads no levels in (`level-membership: context-invalid` is what `verifyOrgMembership` answers for a reader without
  that context, and LV-10 lists it).

- Round 8 (on `7645e0b5`): unit clean, seam clean. Product, breaks folded: a proposal's approval is declared `admin`
  (an owner or an admin, recorded `{role: administrator}`; never an architect; a checker rule's `operator`) in LV-7,
  governance, the checklist, the schema and the conformance row; LV-6 states the source hand-over rule source.md cites;
  item 6 says "listing and unlisting"; the Status counts clean tiers and the pending posts name the settlement clause;
  Done names the authority extension, `levels/1`, the UX and the other pages; the decision schema's description names
  the level holder's words. Product risks folded: a credential request's limit is decided with the request within the
  owner's L1; `change-policy` saves a billing act; the Holds sentence restructured; LV-6 points to LV-7 for client
  keys; SCN-016's waiting state and a Not decided bullet for the owner's spend route; question 8 widened to the
  architect. Seam risks folded: checks for SCR-30 and both halves of the CT-250 row; the DEC-0167 note's module rows,
  sources list and schema count; the DEC-0165 note's module rows; the DEC-0166 note's mandate description; the DEC-0158
  note's level mandate in a board body. Declined: none.

- Round 9 (on `1956431e`): unit clean, seam clean. Product, break folded: the operator-only proposal is a rule proposal
  (type `rule`, any agent binding's rule, `FAC-SEM-104`), not a checker's, in LV-7, governance, the checklist, the
  schema (its parenthesis closed), the conformance row and item 6. Product risks folded: a credential request's
  decision offered as a relayed action is declared `admin`; the Open bullet names all three pending posts; Who adopts
  it says DEC-0162 bounds the interim reading on the wire; the proposal record's role is coarser than the level
  record. Seam risks folded: a DEC-0164 landing note; the DEC-0166 and DEC-0165 conformance rows; checks on one line,
  OW-3's pattern and "prints 0"; conformance reads the authority key in the service's well-known document (CT-296's
  path). Unit risks folded: a malformed entry of the service's own level contexts is its fault `levels-invalid`
  (`levelContextsWellFormed`), tested; a vector for a level decision beside an operator's mandate where no levels are
  read. Declined: a level mandate's listed projects binding a call in no project (MD-3's rule for every mandate,
  unchanged by this decision; a level decision names its project because AP-2's form does).

- Round 10 (on `a220c1ed`): unit failed on two risks, seam failed, product failed. Product, break folded: LV-6's and
  item 8's gate parentheses name every act LV-7 keeps for the operator (client keys, a rule proposal's approval, a
  board hold, a slot move, a listing). Product risks folded: item 6 names the credential request's route; question 11
  (rule proposals and the architect) asked; the duplicate elicitation row in service.md's table dropped. Seam breaks
  folded: the DEC-0166 note's mandate-description check reads both wordings; the six checks split across lines joined.
  Seam risk folded: uniqueness checks for a keep-both resolution. Unit risks folded: `levelContextsWellFormed` reads
  the map's keys as `org:` ids, each key set well formed and of that organization, and `held` by subject, each record
  under its own subject (`levels-invalid` otherwise, tested); the levels test's held record is keyed by subject; the
  vector of an organization the service reads no levels in carries a key set of that organization. Questions 10, 9's
  clauses and 8 widened posted as `bd18b1fa`. Declined: none.

- Round 11 (on `ac23deaf`): unit passed with one risk, seam passed with the same risk, product failed. Product,
  breaks folded: item 6's "the operator" parenthesis moved to the sentence about acts declared `operator`, so it no
  longer reads as who decides a credential request; the CT-250 row counts twelve questions and round 12 next. Product
  risks folded: the Status counts rounds 1 to 10 and names questions 11 and 12 as waiting; question 9 names its
  departure from the administrator's "every ... setting"; question 12 (an architect and its project's credential
  requests). Unit and seam risk folded: `levelContextOk` in `src/org-membership.ts` applies `verifyOrgMembership`'s own
  trust clauses (an opaque audience, an EdDSA key set of that organization) and the held map, and
  `levelContextsWellFormed` reads every entry with it (four tests). `pnpm run check` exit 0 on the round-10 fold (11282 passed, 3 skipped, `ct250-r10.log`) and on this fold (11282 passed, 3 skipped).
  Declined: none.

- Round 12 (on `618dce9a`): unit passed with two risks, seam passed with four risks, product failed. Product, breaks
  folded: FLW-10's diamond and ST-012 send an organization's project to the owner's wait only when someone other
  than the owner starts it (SCN-016's alt path); spend-policy's rule 3 names the owner for an organization's project
  with no policy and the open question above the threshold. Product risks folded: "the operator" of an act declared
  `operator` is the instance's operator, who holds its descriptor (CF-2), so an `org-cloud` instance has one, and
  question 8 asks it; FLW-29's T2 edge names the bound level decision; a landing note for DEC-0160's SCN-060; the
  Status counts rounds 1 to 11 and question 7 is the readings', not the design's; a policy recorded before this
  decision stands until the owner changes it (spend-policy, SCN-016). Unit and seam risks folded: `trustClausesOk` is
  the one predicate `usableTrust` and `levelContextOk` share; `levelContextOk` also refuses a listed key of another
  algorithm and sits inside the documented region; `levels.json` carries the service's own faults (`levels-invalid`
  three ways, `action-level-invalid`) and a level mandate where no levels are read; `.task-pipeline/run.md` dropped
  from the branch. Declined: a `mem` case in a vector file the ports vendor (corrected in round 13: `hub-key.json` carries
  14 signed delegation tokens, but they are committed outside any generator that signs, so a case needs the hub key's
  signing seed; the ports' `mem` typing stays in Compatibility, and the adapter's FAA-249 amendment names it).

- Landing notice to the adopters on the board (thread `8da128cf`), naming LV-9's record (`{by: "level", via:
  "level-command"}` for a decision, `via: "mandate"` for a level mandate) on `org-membership/2`: one adopter's plan records
  `via: level` on `/1`; record the message id here.
- Round 13 (on `09bed3c2`): unit passed with one risk, seam passed with five risks, product failed. Product, breaks
  folded: the Status counts rounds 1 to 13 and the clean tiers through round 13; question 8's round-12 clause waits
  for the board with 11 and 12, each half of question 8 followed by its own default. Product risks folded: one
  cut-off for a policy recorded before levels are read (spend-policy, SCN-016, the repeated owner clause dropped);
  SCN-060's owner who holds the descriptor. Unit and seam risks folded: a `levels.json` case for a key of another
  algorithm; service.md's fault paragraph and LV-10 name `levels-invalid` and `action-level-invalid`, read before an
  accepted approval; the DEC-0160 note covers `vitest.config.ts` and the schema count; the `mem` decline's reason
  corrected; an adopter notice for LV-9's record. Declined: none beyond the `mem` case above.

## Next task

Relay the operator's answers of 2026-11-13 on thread `8da128cf` (a reply to `bd18b1fa`) when the board MCP is back; round 14 of the blind readings (unit, seam, product) of branch `agent/ct250-levels-20261112` (DEC-0162), then merge the
new head into DEC-0166's branch (`agent/ct285-autonomy-profile-20261112`, which already carries `standing` in the
authority extension).
