# Handoff 2026-11-12: a place's autonomy profile (CT-285, DEC-0166)

Entry point for the next agent on CT-285. Branch `agent/ct285-autonomy-profile-20261112`, stacked on DEC-0162's branch
`agent/ct250-levels-20261112` (it reads DEC-0162's levels and lands after it).

## Objective

Turn [the autonomy profile design](../evidence/plans/2026-11-12-ct285-autonomy-profile.md) into DEC-0166 by the
organization slice of 2026-11-21: a place's profile as a standing `mandate/1` its hub states for each assignment.

## Done

- DEC-0166 proposed in `docs/DECISIONS.md`; [delegation](../specification/delegation.md#a-places-standing-mandate-dec-0166)
  AU-1 to AU-7, MD-5 amended, the `prof` claim row, `FAC-SEM-050`, `FAC-SEM-144`, `FAC-SEM-173`.
- Schemas: `mandate.schema.json` `standing`, `delegation-token.schema.json` `prof`, `service-authority-extension.schema.json`
  `standing`. Code: `mandateCovers` and `profileDigest` (`src/mandate.ts`), `actionDecision`'s `standing` and
  `tokenProf` (`src/actions.ts`), `prof` in `src/delegation.ts` and `src/delegation-rules.ts`, `standing/1` in
  `src/protocol-revisions.ts`.
- Vectors `fixtures/vectors/profile.json` (`tools/vectors/profile.ts`), `test/profile.test.ts`, the `prof` test in
  `test/meter-grant.test.ts`; conformance rows (a service reading a standing mandate, a hub holding a profile), the
  module row and the register; `service.md`'s `actionDecision` table; interop C3.5; `versioning.md`; CONTEXT.md
  (Autonomy profile); backlog CT-285.

## Decisions

- The design's `profile-stale` and `profile-unwatched` are the hub's states, not callee refusals: a callee cannot know
  the hub's latest revision or its watcher (DEC-0166 Alternatives).
- `prof` is the digest of the mandate without its chain; it covers `standing.revision`, so no separate revision claim.
- Operator questions 4 and 5 added: an organization's headless place takes the default only once its owner or an
  administrator records it.

## Open

- Merge DEC-0162's head after each of its folds (round 9 merged at `a220c1ed`, round 10's `ac23deaf` at `10f57f16`, round 11's `618dce9a` at `98e0b6bd`, round 12's `09bed3c2` after the round-5 fold, round 13's `1d88115c` after the round-6 fold; round 14's next), never a rebase; land after DEC-0162. At that merge `schemas/mandate.schema.json`'s description keeps both clauses: `grep -c 'neither a level mandate nor a standing mandate travels over the board' schemas/mandate.schema.json` prints 1 and `grep -c 'standing mandate its token binds by prof' schemas/mandate.schema.json` prints 1; `src/levels.ts` keeps both DEC-0162's `levelContextsWellFormed` (round 10's) and this branch's `levelShortOf`.
- Question 1's round-4 clause (a send or publish outside the estate and a force-push, the 2026-11-05 gates) is to be posted on thread `8da128cf` as a reply to `bd18b1fa`; the board's MCP was disconnected at the round-4 fold.
- The operator's five questions: posted with their defaults and 2026-11-21 as board message `bd18b1fa` on thread `8da128cf` (beside DEC-0162's), 2026-11-12 21:00 UTC. Acceptance waits for no answer; an answer before 2026-11-21 changes DEC-0166, one after it is a new decision.
- The knowledge base, at landing: fabric-workspace `knowledge/authority.md` *Autonomy by place* and `north-star.md` G19 give an organization's space, VM or cloud the finish-everything default; restate them with question 4 (an organization's headless place states nothing until its owner, an admin or, for its projects, an architect records a profile), question 5 (no credential request) and AU-2's level bound, then the workspace sync. Check: `git -C fabric-workspace grep -c 'DEC-0166' origin/main -- knowledge/authority.md knowledge/north-star.md` prints at least 1 for each.
- Restatements owed by whichever lands second (the CT-285 row names them): DEC-0156 OW-3 (a profile is a standing
  mandate the hub states, not a session's own rule), DEC-0158 OS-2, OS-6 and OS-7 (a dispatched run on a headless place
  carries the place's standing mandate), DEC-0159 CF-3 and CF-4 (a client key carries no profile), and DEC-0157 UD-4
  (a profile is not a person's word for a usage switch that person turned off; the standing conformance row gains that
  bar once UD-4 lands).
- Restatement owed with DEC-0165 (`agent/ct292-task-context-20261112`), by whichever lands second: a place can hold a personal and an organization's profile (DEC-0082), and the stated mandate names only the place, so the hub states a standing mandate per (place, context) and it is a TC-2 place claim for the assignment's context; check on the merged tree: `grep -c 'DEC-0166' docs/specification/contexts.md` prints at least 1.
- The rule register lists `FAC-SEM-173` while 171 and 172 belong to DEC-0164 and DEC-0165 on their branches; the
  last lander writes the next free code from the CAS counter.
- Tell Fabric (CO-547) and the adapter (FAA-249) when DEC-0166 lands. Fabric's row gains the board-block refusal of `standing` in `boardMandate.ts`, separate from the forward schema it shares with `hubAuthority.ts`, and the forward to a callee declaring `standing` (both owed at any repin past this decision); question 4's organization default (nothing until a profile is recorded), the exclusion of `change-policy` and MD-6's list, and `standing.setLevel` with the setter's level, since CO-547 on Fabric's main still promises an organization's space or VM "all permissions". The adapter's FAA-249 row on its main names neither DEC-0166 nor `profile.json`: amend it at landing (`standing` in the authority extension, `standing` ['1'] in both `PROTOCOL_REVISIONS` twins, `profile.json` in the vendored vectors, `levelShortOf`'s bound, `actionGate` handing on the mandate for `via: "profile"` as for `"mandate"` and passing `standing` and `tokenProf` to `actionDecision`, AU-5's refusal of `autonomy.profile.set` under every mandate, a task's included, which its `mandateCovers` and the ten vendored kit copies lack, the `standing` member, its 24-hour lifetime and `estateCapabilities` in the kits' own mandate schema and `mandateProblem`, `handOn` on a standing mandate (it throws `mandate-malformed` today), `profileDigest` leaving out `source` as OA-7 strips it, and the two semantic fixtures, renamed `standing-action-call*.json` so the `action-call-*` sweep and its count of 18 stay as they are until the port reads standing). Check: `git -C fabric-agent-adapter grep -c 'DEC-0166' origin/main -- docs/backlog.md` prints at least 1.

## Checks run

- `pnpm run check` exit 0 on the first cut (11294 tests passed, 3 skipped), and after the merge of DEC-0162 round 3 with `standing` moved to the authority extension (11301 passed, 3 skipped; coverage floors met; UX lint, docs check with 0 markdownlint errors, privacy check 0 findings).
- Merged DEC-0162's round-6 head `30fe601c` (conflicts in the authority schema's title and description, `src/actions.ts`'s
  imports, `src/mandate.ts`'s `levels-invalid` fault beside `standing-not-read`, conformance's actions and mandate rows,
  the handoffs index; each resolved keeping both sides): `pnpm run check` exit 0 (11305 passed, 3 skipped), 34 vector
  files match their generators.
- Round 1 (on `9e56bbd2`): none clean. Unit and seam, breaks folded: `profileDigest` is RFC 8785 (a fractional ceiling
  threw in the settings form), a lone surrogate answered `mandate-malformed`; from T2 every standing mandate needs
  `prof`, a level holder's included; the hub forwards a standing mandate from any origin with the origin's token (C3.5
  and both interop schemas). Product, breaks folded: CONTEXT's Mandate, the conformance callee row and the mandate
  schema name the standing exception at T2; AU-3 and C3.5 gate an origin by `standing/1`; AP-3 names the hub-stated
  profile and AP-2 its inputs; an organization's profile is stated `by: "operator"` (the schema refuses `by: "level"`
  with `standing`), the setter's level checked at the set; question 4's default in AU-4 and the hub row; the backlog,
  this handoff and the generator header; ST-043, SCN-061 and FLW-31's T2 branch. Risks folded: AU-5 for every mandate,
  with a task-mandate vector; a bound profile beside an operator decision from T2 is read; FAC-SEM-173 on a widened
  mandate; `standing` and `tokenProf` in the action-call kind with a fixture pair; the kits' `standing/1`; question 5
  (credential requests); the window after a narrowing; the default's instruction the operator's recorded words; CONTEXT
  tells the autonomy profile from the other profiles; the restatement pairs and the register gap in Open. Declined: an
  architect's `autonomy.profile.set` outside its projects as a profile vector (the rule is DEC-0162's for any relayed
  action, pinned by `levels.json` "an architect outside its projects"). `pnpm run check` exit 0 on the fold (11315 passed, 3 skipped).

- Merged DEC-0162's round-9 head `a220c1ed` (conflicts in conformance's rows, the mandate description, the actions
  imports, `mandateCovers`' faults and the handoffs index; both sides kept).
- Round 2 (on `2c12a3e6`): unit clean. Seam, breaks folded: interop's `_meta.mandate` paragraph names the standing
  exception; DL-19's `decision-invalid` row lists `profile-unbound`. Product, breaks folded: AU-4's headless default
  lists the assignment grant's capabilities (MD-3's named call), with a vector; both interop schemas split the level
  and standing sentences; the agent row in conformance hands a standing mandate only to a callee declaring `standing`
  and a hub listing `standing/1`; FLW-31 has the hub's entry point, the T2 branch through the checks and `via:
  profile`; SCR-30's elements, state and coverage; AP-3 names a level decision; "questions 4 and 5". Risks folded:
  AU-5 reads the action id too (code and vector); a narrowing at T2 refuses `profile-unbound` and the hub restates,
  in AU-3 and SCN-061; an architect's profile ends the organization's wait for its projects; the schema's "at least
  once every 24 hours"; a board request carries no standing mandate; from T2 the token binds the profile, not the
  chain (AU-3, two vectors); a lone surrogate is `mandate-malformed` on the document too (`mandateProblem`); the
  generator's independence stated as the hashing step; the consumers' parity rows in Compatibility; a DOCMAP row.
  Declined: the register's order (cosmetic; no test reads it). `pnpm run check` exit 0 (11323 passed, 3 skipped).

- Round 3 (on `a16a9863`): unit clean with two risks, seam failed, product failed. Product, breaks folded: AU-4's
  headless default lists every capability of the services registered in the place's estate, which the hub names
  (no grant needed inside the estate, DL-26); an organization's profile carries its setter's level
  (`standing.setLevel`, inside the digest) and a callee declaring `actionLevels` refuses an action above it
  `level-insufficient` (`levelShortOf`, six vectors; an architect's profile names its projects, `FAC-SEM-173`, a
  document vector); AU-4's source is the expressible session record; MD-3 names the standing mandate and `via:
  profile`. Product risks folded: the architect case in item 4, question 4 and the hub row; the actionDecision table's
  row for a standing mandate at a service not declaring `standing`; the knowledge base restatement in Open; at a
  standing mandate's expiry the agent asks its hub (AU-1); "the compatibility profile" in MD-5 and FLW-31; no faster
  stop named (AU-3); a level standing mandate where no levels are read relabelled and its precedence in AU-7. Seam,
  break folded: interop's T2 paragraph and `decision-invalid` row name the standing mandate and `profile-unbound`.
  Seam risks folded: Fabric's board reader and forward path owed in Compatibility; the adapter row in Open; a vector
  for a caller placed in no tier; the standing row reads an operator decision from T2 as none. Unit risks folded: a
  non-object `standing` is gated by `isObject`, so it is `mandate-malformed` everywhere (a vector); the T2 chain
  stripping stays AU-3's stated reading (the token's own scope binds, DL-5). Declined: none.

- Round 4 (on `10f57f16`): unit passed with four risks, seam passed with six risks, product failed. Product, breaks
  folded: every callee reading standing refuses a call in no project under a profile set below admin, and one in a
  project under an architect's profile naming no projects, whatever its `actionLevels`; a service declaring `standing`
  declares in `actionLevels` every billing act and every act LV-7 keeps for the operator that it offers (AU-2,
  conformance, a guide checklist line); the FAC-SEM-173 row names the architect clause; the status lines (backlog,
  handoffs index, this handoff). Product risks folded: the audit record carries `setLevel` and SCR-30 shows it, the
  approver read from the hub's record (AU-6); question 1 widened to the 2026-11-05 gates and the Context says the
  default is narrower than "only the body's gates"; AU-4's key issuance through the estate's own doors; G19's harness
  part in Not decided; the Fabric item; SCN-062 and three ST-043 criteria for setting a profile, an organization's
  waiting place and a person's presets; the design's status names DEC-0166, membership's Not decided points to it.
  Unit and seam risks folded: `mandateCovers` refuses a call in a project under an architect's profile naming no
  projects (a vector); `levelShortOf` reads a mistyped level as `operator` (a test; `actionDecision` answers its own
  fault, a vector); `standing.place` admits the estate's `~`; the next free rule code `FAC-SEM-175`; the generator's
  AU-4 comment. Declined: a prof-typing case in a vector file the kits vendor (the delegation vectors are DEC-0162's
  and earlier decisions'; FAA-249's amendment at landing names it).

- Round 5 (on `98e0b6bd`): unit failed, seam failed, product failed. Unit, break folded: the refusal of a call in a
  project under an architect's projectless profile reads the stated profile's scope, never a hand-over's (two
  vectors, T1 and T2). Seam, breaks folded: the two semantic fixtures renamed `standing-action-call*.json`, out of the
  ports' `action-call-*` glob; the guide line says a profile set below an act's level never covers it, an owner's
  covering a billing act. Product, breaks folded: the Context states how the rules behave in each context; the
  credential issuer declares no `standing` (AU-4, conformance, guide); question 1's clause is to be posted, the Status
  names its widening. Risks folded: `ProfileRecord` declares `setLevel`; the mistyped-level vector renamed to what it
  shows; the FAA-249 amendment names `actionGate`, AU-5 and the fixtures; a DEC-0165 restatement pair; SCN-061 and
  AU-7 say a stated mandate stands until its `expiresAt`; AU-4 names the personal default's operator acts. Declined:
  `levelStanding` calling `levelShortOf` (DEC-0162's code on its own branch; folded when DEC-0166 lands on it, as one
  change); the task-mandate AU-5 case in `mandate.json` (the kits vendor it and would fail before they port AU-5; the
  FAA-249 amendment names it); keeping the 2026-11-05 gates out of the headless default (the operator's newer record
  of 2026-11-09 says a headless place finishes everything; question 1 asks).

- Landing check for membership.md's Not decided line: after landing, `grep -c 'ct285-autonomy-profile-20261112' docs/specification/membership.md` prints 0 (the lander turns the branch name into DEC-0166's delegation.md anchor).
- Round 6 (on `02eeed99`): unit passed with three risks, seam failed, product failed. Seam, breaks folded:
  `profileDigest` leaves out `source`, which OA-7 strips on the wire (a vector delivers a profile without it under the
  stated `prof`); the headless default names the estate's capabilities by `standing.estateCapabilities` instead of a
  list the scope's 64 cannot hold, naming a call only from T0 or T1 (schema, `mandateCovers`, three vectors). Product,
  breaks folded: a rule proposal's approval is reached by no profile, the board's gate declaring no `standing`
  (AU-4, Context, conformance, guide); `admin` for any other proposal type's approval in AU-2, conformance and the
  guide; FLW-31 has the hub's entry, the `level-insufficient` route to a holder and the `profile-unbound` route to the
  hub. Risks folded: an architect's profile names at most 16 projects (AU-2); a standing mandate stands only within
  the stating estate's own context (AU-1); project-comms refuses a standing or level mandate in a board block;
  credentials.md and spend-policy's L2 row name the profile; the screens say "autonomy profile"; a service declaring
  `standing` passes `effect`, `self` and `mandateCapability` at every tier (conformance); this repo's action-call
  sweep reads the renamed fixtures; the doc comments of `actionDecision`, `mandateCovers` and the ignored answers;
  the FAA-249 amendment names the kits' schema, lifetime, `handOn` and the digest; a landing check for membership's
  branch line. Declined: question 1's clause still waits for the board (its MCP is disconnected); acceptance waits on
  that post.

## Next task

Post question 1's round-4 clause on thread `8da128cf`, then round 7 of the blind readings (unit, seam, product) of
branch `agent/ct285-autonomy-profile-20261112` (DEC-0166).
