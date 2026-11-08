# 2026-11-08: the local and cloud form of one agent (CT-218, DEC-0159)

## Objective

Name the layout the operator asked for on 2026-11-04 (board thread `79a9f452`, request `b0c476ec`, narrowed by message
`02bfa26f`): one agent as a local instance and a cloud instance, the team reaching the cloud one with client keys while
the provider keys stay on the server, with no password sign-in; say how to declare it; give example descriptors.

## Branch

`agent/ct218-local-cloud-v2`: one squashed commit, `f7217820` (rounds 1 to 5), on `origin/main` at `0fcb5d97`, then one
commit per later fold. It replaces the branch `agent/ct218-local-cloud-20261108`, whose earlier commits carried private
repository names; those commits were public on `origin` (this repository is public) until 2026-11-08, when that branch
was deleted from `origin` and replaced by this squash. Commit-addressed references in the rounds below (`a6fde192` to
`cc78d063`) name commits of the deleted branch.

## Done

- DEC-0159 (Proposed), reserved with `agent_sync.py reserve DEC`; `Next free ID` set to `DEC-0160`.
- `docs/specification/service.md`: the section *The local and cloud form of one agent* (CF-1 to CF-7) and the header
  line.
- Fixtures: `service-descriptor-cloud-form-local.json`, `service-descriptor-cloud-form-cloud.json` and
  `service-well-known-cloud-form.json`, catalogued; each validates (`pnpm validate`, exit 0).
- `docs/specification/conformance.md`: a row for a service in the form. `CONTEXT.md`: *Local and cloud form*.
- `docs/specification/service.md`: the caller-credential lines in *Offered to others* and the *Surfaces* table name a
  client key the service issued (CF-3).
- `docs/DOCMAP.md`: a row for the form (the section, the three fixtures, this handoff). `README.md`: a row of *Build an
  agent*.
- `docs/ux/scenarios.md`: SCN-044's alt path and Coverage; SCN-041's alt path for a client key and its Coverage.
- Backlog CT-218 in progress; CT-270 filed in round 2 (a member's scenario, super-ux) and done in round 3: SCN-058
  with JTBD-16, ST-041, FLW-35 and SCR-35; CT-275 filed in round 5 (the key's path into the coding agent's header,
  the endpoint's delivery).
- Round 3: CF-3's three issuing doors (the CLI, the page, the page action's `relayed` twin), the holder label, the
  usage report's attribution (the per-key reference dropped in round 4) and the refusal answers; CF-4's step on the operator's page (`scope-not-granted`,
  `operator-step: <humanStep>`) with the matching sentence in PL-4, AP-4, the note under `actionDecision`'s table,
  `FAC-SEM-142`'s row and interop C3.3; one sentence each in agent-network (beside CT-84) and channel-agent (CA-1).
- Round 4: CF-1's manifest pair (only the local descriptor carries `fabricManifest`), CF-3's refusal order at the
  twin, its `WWW-Authenticate` per case, the member storing the key in their own vault, client-key spend out of
  `byGrant`, key management through the CLI and the page alone where `auth.delegation` is declared; CF-4's
  `notify: true`, message and `statusMessage`; SCN-044's alt paths for the operator's key management; a clause each in DL-19's
  `scope-not-granted` row, DEC-0121's caller-action table and conformance's actions and channel-agent rows.
- Round 8: DL-19's `401` header for no credential, DL-26's grant and DL-29's outside-family sentence for a client
  key, CF-4's daily repeat of an open step's event and its definition of one step, the page's answers as twins, the
  issuer-less reading for every `relayed` action, the limit window mapping, a key's optional expiry, SCR-36 and FLW-36
  for SCN-059's operator side (see *Rounds*).
- Round 9: a client-key caller's `inputResponses` answered by the job step's own gate, a decline that answers only the
  jobs waiting on its step, a revoked or expired key's jobs cancelled, the key split (issuing and rotating a member's
  key the operator's own step, revoking the agent's on the operator's word), DL-19's header change named as a wire
  change with its dependants (see *Rounds*).
- Round 10: a client key standing in for the token and the grant at any instance in the form, a declined job's end
  (`failed`, `operator-declined: <humanStep>`), a member's key action declared `human` (`secret`), rotation, the
  window bounds, the hand-over channel and expiry note, client-key spend named as the one exception to L0's hard stop
  with a question to the operator, the RFC 6750 row, and landing notes stated as the merged text (see *Rounds*).
- Round 11: DEC-0159's *Compatibility* no longer lets an organization agent issue a member's key, the twin issues
  and rotates only the calling agent's own key, a waiting job's `statusMessage` reads `operator-step <humanStep>`, a
  final `issuer-unavailable` carries `no-trusted-issuer`, one step covers every `humanStep`, and the merge notes state
  the second lander's edits (see *Rounds*).
- Round 12: a member's key never through the twin in FLW-35, L0's one exception named in the glossary's trust tier and
  the family's limits, what reaches a member restated (no link to the page, nothing the page opens for a key), an
  open step's repeat bounded to 25 to 48 hours, `no-trusted-issuer` final from any callee and still HTTP `503`, the
  page's `relayed` key action stated (it revokes), the re-keying window and the organization's usage view in
  *Compatibility*, CT-279 filed (see *Rounds*).
- Round 7: CF-4 as one rule (a client-key caller is handed no person's step and no choice), SCN-059 for the operator's
  keys and the steps members' calls raise (ST-042), OM-5's sentence on client keys, `peer`'s schema description, and
  back-pointers to CF-3 in DL-26, DL-29 and source.md's T2 premise (see *Rounds*).

## Compared with the first implementation

Read at the CMO project's default branch: its code meets CF-3's key mechanics and its specification CF-5 (config set
through stdin, the vault move recorded). It diverges in eight places, the first five sent on the board: no
`surfaces.mcp.auth: "own"` on its cloud well-known (CF-3); its cloud runs from an organization copy under another `id`,
so it is a second agent (CF-1); its onboarding hands the service token to a marketer (CF-2, CF-4); its specification's
last line names a password, and its architecture write-up and its specification's team-access section give the team
the page through the one-time code (CF-4); its cloud registration writes no `peer` and no `runner`, which only a later
milestone of its specification promises (CF-6); and, found in round 3, its key door (MCP tools that issue and rotate
client keys) opens to any client key with its key-issuing scope, declares effect `none` and reads no `_meta.decision`,
so it is not the operator's issuance until it is a `relayed` action carrying the operator's decision (CF-3, AP-2); and,
found in round 4, its refusals are not in DL-19's shape (an error sentence with no code, a bare
`WWW-Authenticate: Bearer` for every `401`, a scope miss on `/mcp` an HTTP `403` before any tool runs, and a revoked
key accepted for up to 30 seconds from a cache), and a key with its key-issuing scope was already issued, on
2026-11-07, to a colleague who is not the operator, with its key-listing tool returning every key's holder name to that
key (CF-3; restated in round 6, it was earlier read as a later specification's plan). The organization copy is a source hand-over of a personal agent unless its word is recorded (CF-7).
The estate's cloud-deploy template registers its descriptor's instance as `default` unless its configuration names
another; as the cloud half it must be set to `cloud` (CF-1), which the adapter's offer is to say (FAA-204, message
`8eb77518`); its registration script writes no `peer` and no `runner`, which FAA-204 also owes when the cloud instance
serves a team (CF-6). Round 4 adds two FAA-204 items: that script sets `fabricManifest` on every descriptor it
registers, so the cloud descriptor must go without it (CF-1, `FAC-SEM-020`); and its refusals map onto DL-19:
`unauthenticated` `401` with `WWW-Authenticate`, `scope-not-granted` `403` or as a tool result (CF-3). Round 5 adds
two adapter items (DEC-0159 *Compatibility*): its probe and the readers of CA-1 resolving the manifest for a descriptor
without `fabricManifest` through the same `id`'s `default` descriptor or the provider entry, and its kits' message and
a client-key caller input for CF-4's `operator-step` (FAA-204).

## Decisions taken here

- No schema member and no semantic rule: the shared `id` marks the pair, and the `own` declaration sits in the
  well-known document behind the token (DEC-0159 Alternatives).
- The form is a combination of DEC-0019, DEC-0024, DEC-0061 and DEC-0149's landing note, so every rule stays in its
  section; CF-1 to CF-7 say how they combine and where builders go wrong.

## Open

- The coordinator's blind readings until two consecutive clean rounds.
- A question for the operator (not reserved as an `OQ` id): client-key spend at a cloud instance in the form reaches no
  grant check, so at the call it is bound only by each provider key's own ceiling and the service's own budgets, not by
  L0's monthly total or a project's L1, and only L0's monthly total sees it, after the fact (CF-3, spend policy's
  *Levels*, DEC-0159 *Compatibility*). That relaxes L0's hard stop for this one kind of spend. Does the operator accept it, or should the
  form wait until such a service reserves its spend with the estate's meter at the call? Until answered the text states
  the relaxation plainly; the landing message to the operator asks it.
- A second question for the operator (not reserved as an `OQ` id): is a door that issues a member's key straight into
  that member's vault, by reference, never returning the value to its caller, a conformant route for an agent? CF-3
  forbids an agent to issue or rotate a member's key because the key comes back in the agent's answer and so in its
  transcript; such a door returns no value, and the organization's north star plans its administrator agent issuing
  members' keys into the vault through the doors. Until answered, CF-3's ban covers that route too, and the member's
  key is issued by the operator in their own terminal or on the page; a yes is new mechanics (a door, its record of
  the move, its scope), filed as a backlog row then.
- CT-279 (filed in round 12): a reference input marking a client-key caller, so that `FAC-SEM-142`'s client-key
  exception has a machine check; until then the conformance row's evidence for CF-4's human path is the service's
  own test alone.
- At landing, to the CMO project: the sixth to eighth divergences (its ungated key door, its refusals' shape with the
  30-second revocation, the key with its key-issuing scope already issued to a colleague who is not the operator, which
  the message asks it to revoke and to route key management through its operator's CLI or page, or through a `relayed`
  twin, and the list tool's holder names).
- At landing, to the adapter, under FAA-204: round 4's two items (`fabricManifest` off the cloud descriptor, the
  refusal mapping), round 5's two (the manifest's resolution for a descriptor without `fabricManifest`, the kits'
  `operator-step` message and client-key caller input), round 7's (the kits answering every `human` action and input
  request of a client-key caller as CF-4 says, one event per open step, and each instance's delegation gate configured
  with the audience `<id>.<instance>`), and round 10's: DL-19's `401` header change, a bare `WWW-Authenticate: Bearer`
  when no credential came and `error="invalid_token"` only for one that came, in both kits, their tests and their
  builders' reference (DEC-0159 *Compatibility*); the adapter's offer in its skills (FAA-204) follows.
- At landing, to Fabric Dashboards: its sample service (`test/fixtures/sample-service/fabric_delegation.py`) copies the
  adapter's Python kit, whose no-credential `401` changes with DL-19's header sentence; every other service that
  vendors the kits follows when it re-copies them (DEC-0159 *Compatibility*).
- At landing, fabric-workspace's knowledge: the owed page (message `56ccc6d2`) states the boundary of a CF-3 client key
  against the north star's (no grant, not metered by Observatory's meter, issued only by the service's operator) and
  says that issuing a member's key through the north star's administrator agent puts the key in that agent's transcript
  (CF-3); `knowledge/agents-first.md` line 291's "(`peer`, client keys, the one-time code)" becomes "(`peer`, client
  keys, the operator's one-time code for the page)", as source.md reads; `knowledge/authority.md` line 148's T2 row
  gains the clause "at a cloud instance in the local and cloud form, a caller presenting a client key that instance's
  operator issued it takes the token's place and the grant's (DL-26, CF-3)"; and `knowledge/north-star.md` lines 204
  (every service agent's issue door for client keys), 138 (*Joining*: the administrator agent's onboarding checklist
  issues client keys through each service's issue door), 142 (*Leaving*: one command reverses every grant on that
  list), 224 (the PM agent's row: the issue doors and client keys for members and agents), 233 (its administrator agent "issues client keys"), 261 (the
  administrator agent's key doors and client-key issue doors at onboarding and offboarding) and 536 (members' agents
  get client keys through the PM agent on the owner's or an administrator's word), with `knowledge/system/base-set.md`
  line 31 (Administration's client-key doors at onboarding and offboarding), are restated so that an agent issues only its own key, as its operator's
  `relayed` twin, and a member's key is issued by the service's operator in their own terminal or on the page (CF-3),
  pending the vault-delivery question above. Until these land the knowledge base contradicts CF-3; they land in the
  same landing run as the merge, and the knowledge commit is recorded in this handoff.
- At landing, beside DEC-0156 (branch `agent/ct220-operators-word-v2`), DEC-0157 (branch `agent/ct216-usage-data-v2`)
  and DEC-0158 (branch `agent/ct215-on-demand-20261108`), the second lander resolves each conflict in
  `docs/DECISIONS.md`, `docs/backlog.md` and `docs/handoffs/README.md` as the adjacent appends they are: both sides
  kept, in id order. On the merged tree: `grep -n '^### DEC-015[6-9]' docs/DECISIONS.md` prints four lines in
  ascending order, `grep -c '^### DEC-0159' docs/DECISIONS.md` prints 1, and `grep -rn '^<<<<<<<\|^>>>>>>>' docs`
  prints nothing.
- The merged text with DEC-0156. SCN-044's *Alt paths* and *Coverage* keep both sides: DEC-0156's update alt path and
  its `DEC-0156 OW-1 to OW-4` coverage, and this branch's one sentence for the cloud instance's page and its
  `DEC-0159 CF-1, CF-2, CF-4` coverage, that sentence taking SCN-059's key split (issuing and rotating a client key
  are the operator's, in their own terminal or on the page; revoking is the agent's, on the operator's word, through
  the agent's CLI on the operator's computer), so that
  `awk '/^### SCN-044/,/^### SCN-058/' docs/ux/scenarios.md | grep -c 'operator manages client keys'` prints 0, with the whole of SCN-058 and SCN-059 after it. SCN-059 states the key split:
  issuing and rotating a member's key are OW-4's secret step, taken from the operator's own terminal or on the page
  (the page's action for a member's key is `gate: "human"`, `humanStep` `secret`, CF-3); revoking is the agent's step
  on the operator's word, through the `relayed` twin where the instance checks `approval/1`, else by running the
  agent's CLI on the operator's computer. Whichever of the two lands second writes `OW-4` into SCN-059 (in step 2,
  where the operator issues a member's key, or in its *Coverage*), since neither branch alone can name it. OW-4's
  merged text also names the hand-over of a secret step that has no AP-4 link (a member's key on a computer with no
  page): the exact command of the agent's CLI the operator runs in their own terminal, which the agent names and never
  runs. That clause goes into OW-4 and into CONTEXT's entry *Operator's word, carried out the first time*; CF-4's
  *Where the operator is* may carry it as well, never instead. This requirement binds whichever of DEC-0156 and
  DEC-0159 lands second. On the merged tree:
  `awk '/\*\*OW-4/,/\*\*OW-5/' docs/specification/governance-and-roles.md | grep -c 'own terminal'` and the same range
  piped through `grep -c 'CF-3'` each print at least 1, and
  `awk "/^\*\*Operator's word, carried out the first time\*\*/,/^\$/" CONTEXT.md | grep -c 'own terminal'` prints at
  least 1.
  `docs/ux/foundation.md` conflicts too, at ST-035: keep this branch's human-step line (CF-4, no link) and then
  DEC-0156's new ST-035 line, both, in that order, so that ST-035's exact-step list is read together with CF-4's
  no-link case; on the merged tree `awk '/^### ST-035/,/^### ST-036/' docs/ux/foundation.md | grep -c 'DEC-0159 CF-4'`
  prints 1, and the line it prints comes before every line of that range naming `OW-` (a judgement on order). SCR-30's *Scenarios* line does not list SCN-059, which is SCR-36's alone. On
  the merged tree: `python3 docs/ux/lint.py` passes; `grep -c '^### SCN-05[789]' docs/ux/scenarios.md` prints 3;
  `awk '/^### SCN-059/,/^### SCN-045/' docs/ux/scenarios.md | grep -c 'OW-4'` prints at least 1; each sentence that
  `awk '/^### SCN-059/,/^### SCN-045/' docs/ux/scenarios.md | grep -o "[^.;]*own terminal[^.;]*"` prints puts issuing
  or rotating a key, never revoking, in the operator's terminal (a judgement over the five sentences it prints here); `awk '/^### SCR-30/,/^### SCR-31/' docs/ux/screens.md | grep -c
  'SCN-059'` prints 0; `grep -rn -A3 'secret step' docs/specification | grep -c 'own terminal'` prints at least 1 (a judgement that the printed line names the command the operator runs and
  the agent never runs).
- The merged text with DEC-0157. Whichever of the two lands second makes three edits, since neither branch alone
  carries them: it writes into UD-4's ask-first sentence, into DEC-0157's item 4 and into its conformance row for the
  agent that a client-key caller of a cloud instance in the local and cloud form reads `scope-not-granted` with
  `operator-step: consent` and that the person is told the operator was asked (CF-4); UD-4's "no product-side refusal"
  allows CF-4's refusal of a member's key; and it adds to UD-4's elicitation clause "(never sent to a client-key caller
  of a cloud instance in the local and cloud form, CF-4)". Then, on the merged tree: `awk '/\*\*UD-4/,/\*\*UD-5/'
  docs/specification/usage-data.md | grep -c 'operator-step: consent'` prints at least 1, the same range piped through
  `grep -n 'elicitation' | grep -c 'CF-4'` prints at least 1, and `awk '/^### DEC-0157/,/^### DEC-0158/'
  docs/DECISIONS.md | grep -c 'operator-step: consent'` prints at least 1, and the conformance row DEC-0157 adds for
  the agent carries it too: `grep -n 'DEC-0157' docs/specification/conformance.md | grep -c 'operator-step: consent'`
  prints at least 1.
- The merged text with DEC-0158: the register appends above, and one edit by whichever lands second. A run DEC-0158
  dispatches is an estate session that may hold a client key at a cloud instance declaring no `auth.delegation`
  (CF-3), so OS-6's list of a dispatched run's stops counts, as a human-step stop, a `scope-not-granted` whose
  `data.detail` starts `operator-step:` and a job whose `statusMessage` starts `operator-step` (CF-4); OS-6's
  conformance row for a dispatched run says the same. On the merged tree:
  `awk '/^- \*\*OS-6/,/^- \*\*OS-7/' docs/specification/project-comms.md | grep -c 'operator-step'` prints at least 1,
  and `grep -n 'DEC-0158' docs/specification/conformance.md | grep 'dispatched run' | grep -c 'operator-step'` prints
  at least 1. This requirement binds whichever of DEC-0158 and DEC-0159 lands second; the note is written on this
  branch only, so the coordinator relays it to DEC-0158's branch (round 13), and a lander of DEC-0158 that lands
  second makes the edit from this note.

## Rounds

- Round 1 (on `a6fde192`), not clean on any tier: CF-2 and CF-4 put the descriptor's token on every team member's
  computer, against "others never receive it" (now the descriptor, its token and the page are the operator's, the team
  works through client keys); CF-1 cited `FAC-SEM-009` for uniqueness (now `FAC-SEM-010`); CF-4 forbade the page's own
  requests (now the session covers them); SCN-033 described a directory that does not build cloud instances (the alt
  path moved to SCN-044); the Compatibility said the CMO project's implementation meets CF-1 to CF-6 (now its four divergences are named and
  sent).
  Risks folded: "the HTTP API" defined; the header named; DL-12's delegation tokens for estate agents; CF-6's delegation
  token needs `auth.delegation`; client keys named in *Offered to others* and the *Surfaces* table; CF-7's exception for
  a source file served; the fixture's runner `key`; DOCMAP row; Consequences complete.
- On the round-2 head: `pnpm run docs:check`, `python3 docs/ux/lint.py`, `pnpm --silent validate` on the three fixtures,
  `pnpm vitest run test/fixtures.test.ts` (results in the next round's record).
- Round 2 (on `f81b15cd`, merged with `origin/main` at `62977d42` first; `Next free ID` stays `DEC-0160`), not clean.
  Breaks folded: CF-3, the conformance row and DEC-0159 item 3 allowed `surfaces.mcp.auth: "delegation"`, which takes
  delegation tokens only and would refuse client keys (now `"own"`, with `auth.delegation` beside it when agents of the
  estate call; without it an estate agent holds a client key the operator issued or nothing; the well-known fixture
  declares `auth.delegation`); CT-218's status said the CMO project's implementation meets CF-1 to CF-6 and its description let people
  reach the cloud page (now restated to DEC-0159 *Compatibility*, and the operator alone, CF-4); this handoff's Done
  named SCN-033 (now SCN-044, with the DOCMAP row and the two caller-credential lines); the Compatibility credited that
  implementation's code with CF-6's `peer` (now a fifth divergence: its cloud registration writes no `peer` and no
  `runner`). Risks folded: the
  client key shown once in the issuing answer as the one exception, and "command" the agent's own CLI, not a descriptor
  `commands` entry; the HTTP API and the page's routes partitioned, the descriptor token's routes named by surface; the
  member's path (`peer.endpoint`, the key's channel) and CT-270 for the member's scenario; a departing member's keys
  revoked by the operator, with SCN-041's alt path; no `open_link` to a client-key caller; the channel agent's question
  answered in DEC-0159 (the manifest's declaration, CA-1); the README row; Fabric Dashboards shows the cloud instance
  to the operator only; the DOCMAP row names the well-known fixture; the delegated organization agent's issuance and the
  CMO write-up's page divergence in *Compatibility*, CF-5 attributed to the specification; the cloud-deploy template's
  instance set to `cloud`.
- Checks run on the round-2 fold before its commit: `pnpm run docs:check` ("Documentation checks passed", markdownlint
  0 errors over 271 files); `python3 docs/ux/lint.py` (passed: 40 stories, 34 flows, 34 screens, 56 scenarios);
  `pnpm run privacy:check` (0 findings); `pnpm --silent validate` on the three fixtures (exit 0 each);
  `pnpm vitest run test/fixtures.test.ts` (1140 passed); em dashes in the branch's added lines against `origin/main`: 0.
  The full `pnpm run check` was not run here.

- Round 3 (on `9458c887`), not clean. Breaks folded: CF-4 forbade a page link to a client-key caller while AP-4,
  PL-4 and interop C3.3 require one for a step on the service's page (now the step is raised to the operator, on its
  operator channel or in its events feed, and the call refused `scope-not-granted` with `data.detail`
  `operator-step: <humanStep>`, DL-19's code a product maps its own refusal onto; `human-step-required` does not fit
  because its `data.url` is required; a job's such request is not put in that caller's `inputRequests` and the job
  reads `working`; the exception sits in CF-4, PL-4, AP-4, the note under `actionDecision`'s table, `FAC-SEM-142`'s
  row, C3.3 and SCN-044, with no schema or `src` change); source.md and CT-218 named "the one-time code" among how the
  running agent is served to a team (now "the operator's one-time code for the page"); a member's path had no scenario
  and CF-3 no refusal answers (now SCN-058 under P-03 with JTBD-16, ST-041, FLW-35 and SCR-35, and CF-3 states
  `unauthenticated` `401` for no, an unknown or a revoked key, `scope-not-granted` `403` for a missing scope, and the
  page answering a key as no session; CT-270 done); the Compatibility counted the CMO project's key door as the
  operator's issuance (now CF-3 admits a third door only as a `relayed` twin carrying the operator's decision, and that
  door is a sixth divergence); "the adapter's offer says so" (now "is to say so", FAA-204, message `8eb77518`). Risks
  folded: CF-3's CLI "from their own computer (on it, or as a one-off process of the platform it starts)"; the
  cloud-deploy template's registration writing no `peer` or `runner` under FAA-204; the CMO specification's
  team-access section in the fourth divergence; a direct caller of the cloud origin is T2 unless the platform proves its tier (DL-25), so an
  estate agent's delegation token there is DL-8's; agent-network's CT-84 sentence; issuing, rotating and revoking
  operator-only with no member's key carrying a key-management scope and the twin's tier stated; a holder label the
  operator alone sees and the departure the operator's duty, in CF-3 and SCN-041; the usage report's client-key spend
  unattributed or under an opaque per-key reference; SCN-044's alt path for an operator without Fabric Dashboards;
  the endpoint stated by the operator until a listing contract carries it, and no descriptor on a member's machine;
  channel-agent CA-1's manifest sentence; CF-4's reason independent of "cannot open the page" (a client key is never
  the operator's presence); DEC-0159's Consequences list every file this fold changes and SCN-041's Coverage.
- Checks run on the round-3 fold before its commit: `pnpm run docs:check` ("Documentation checks passed", markdownlint
  0 errors over 271 files); `python3 docs/ux/lint.py` (passed: 41 stories, 35 flows, 35 screens, 57 scenarios);
  `pnpm run privacy:check` (0 findings); `pnpm --silent validate` on the three fixtures (exit 0 each);
  `pnpm vitest run test/fixtures.test.ts test/consistency.test.ts` (1163 passed); em dashes in the branch's added
  lines against `origin/main`: 0. The full `pnpm run check` was not run here.

- Round 4 (on `922d8cb6`), not clean. Breaks folded: a manifest names one descriptor (`FAC-SEM-020`), so two
  descriptors could not both name it (now only the local descriptor carries `fabricManifest`; a reader of the cloud
  instance reaches the manifest through the local descriptor or the registry's provider entry; CF-1, CA-1's sentence,
  DEC-0159 item 1 and its CA-1 paragraph; both fixtures already carry none and validate, alone and as a pair in one
  folder); CF-3's opaque per-key reference in `byGrant` contradicted DL-22 and the usage report (now client-key spend
  is in days and rows and never in `byGrant`); SCN-058, FLW-35, ST-041 and SCR-35 had the operator put the key into the
  member's vault slot, which no feature does (now the operator hands it over through a channel out of chat and logs and
  the member stores it in their own vault, SCN-053's window for example; reading the slot into the coding agent's
  header is CT-187's open question, named in SCN-058's Preconditions and Coverage); the operator's own key path had no
  scenario (now SCN-044's alt paths: issuing, rotating and revoking through the CLI, the page and the twin, the key
  shown once with its holder label, the twin answering the operator's agent `approval-required` at T2 and the agent
  then bringing an `approval/1` or running the CLI, the twin refusing a key-management scope); the twin's refusal order
  (now `scope-not-granted` first for a key without its scope, `approval-required` for a key with it and no approval);
  conformance's actions row lacked CF-4's exception (now beside the source hand-over); the CMO project's refusal shape
  and key-management holder (now the seventh and eighth divergences, the count eight). Risks folded: the template's
  refusal mapping as a third FAA-204 item and `fabricManifest` off its cloud descriptor; DL-19's `scope-not-granted`
  row and DEC-0121's caller-action table name `operator-step:` and the caller's act; CF-4's event carries `notify: true`
  and the refusal's message (or the job's `statusMessage`) says the operator was asked and to repeat later; SCN-058 and
  SCR-35's `401` alt paths (the coding agent's own connection failure, the hand-over note naming whom to ask, unobserved
  until tried with a named coding agent); `WWW-Authenticate` bare for no key and `error="invalid_token"` for an unknown
  or a revoked one (RFC 6750 section 3.1), in CF-3 only; `FAC-SEM-142`'s client-key exception in its own clause with no
  CT-181 bound; key management through the CLI and the page alone where `auth.delegation` is declared; a channel agent
  in the form has a manifest (CA-1, conformance's channel-agent row); this README row and CT-218's status.
- Checks run on the round-4 fold before its commit: `pnpm run docs:check` ("Documentation checks passed", markdownlint
  0 errors over 271 files); `python3 docs/ux/lint.py` (passed: 41 stories, 35 flows, 35 screens, 57 scenarios);
  `pnpm run privacy:check` (0 findings); `pnpm vectors:check` (32 vector files match their generators);
  `pnpm --silent validate` on the three fixtures (exit 0 each) and on a scratch folder holding both descriptors
  (exit 0); `pnpm vitest run test/fixtures.test.ts test/consistency.test.ts test/actions.test.ts
  test/page-links.test.ts` (1341 passed); em dashes in the branch's added lines against `origin/main`: 0. The full
  `pnpm run check` was not run here.

- Round 5 (on `cc78d063`), not clean. Breaks folded: CF-3 said key management goes through the CLI and the page
  alone where `auth.delegation` is declared, while the twin stays open to a delegation-token caller with the operator's
  decision or an accepted `approval/1` (DL-16) (now: the operator issues no key-management client key there, the twin
  stays open to such a caller, and a twin taking `approval/1` holds the estate's issuer and key set, DL-18, or its
  callers are answered `approval-required` and keys go through the CLI and the page; in CF-3, the conformance row,
  DEC-0159 item 3 and SCN-044's alt path); SCN-058, FLW-35 and SCR-35 cited CT-187, a shared value's case, for the key's
  path from the member's vault into the coding agent's header (now CT-275, filed with the endpoint's delivery until a
  listing contract carries it, which CF-3 points at); *Offered to others* said only a share grant or a listing grants
  access (now a client key the service's operator issued does too). Risks folded: an agent caller of an issuing door
  receives the key in its transcript, the hand-over channel holds for the CLI in the operator's own terminal and the
  page, SCN-053's secret window the member-side store; client-key spend reaches no `grant.usage` event and no grant
  limit, the service's budgets (DEC-0027) the team's ceiling; `byGrant` names only the grant a delegation token carried;
  CT-270's row restated to "as the operator states it"; CF-1 and the README row say the fixture pair shows an agent
  without a manifest; *Compatibility* names an older caller kit reading CF-4's operator step as a missing scope and the
  adapter's kits' owed message and client-key input (FAA-204), and the probe and CA-1 readers' owed manifest
  resolution; DL-19's *Refused by* names the service for CF-4's `operator-step`; CF-4's event carries a `kind` or
  `level` the host reads as an ask (Fabric Dashboards' ask pattern or `level` `warning`); a step on the operator's page
  waits for another computer of the operator's that shows the page; a member's key carries no scope that reaches a
  `relayed` action; a client key issued to an estate agent without `auth.delegation` is that agent's own credential
  (DL-29); the adapter's probe "reads a refusal under `own` as conformance". Privacy: every private repository name,
  file path, line, commit, tool, scope and internal id of the CMO project and the estate's cloud-deploy template was
  removed from DEC-0159, this handoff and the backlog; the substance stays in plain words.
- Checks run on the round-5 fold before its commit: `pnpm run docs:check` ("Documentation checks passed", markdownlint
  0 errors over 271 files); `python3 docs/ux/lint.py` (passed: 41 stories, 35 flows, 35 screens, 57 scenarios);
  `pnpm run privacy:check` (0 findings); `pnpm vectors:check` (32 vector files match their generators);
  `pnpm --silent validate` on the three fixtures (exit 0 each); `pnpm vitest run test/fixtures.test.ts
  test/consistency.test.ts test/actions.test.ts` (1272 passed); the private-name grep over the branch's diff against
  `origin/main`: nothing; em dashes in the branch's added lines against `origin/main`: 0. The full `pnpm run check` was
  not run here.

- Round 6 (on `f7217820`, the squash on `agent/ct218-local-cloud-v2`), not clean. Breaks folded: CF-3 had a twin
  without the estate's issuer and key set answer every caller `approval-required`, which sends a caller for an approval
  that twin can never accept, while DL-13 row 1 and DL-18 refuse a presented approval `issuer-unavailable`
  (`src/delegation.ts` lines 461 to 465) (now such a twin takes no `approval/1`: a T2 caller with no approval is refused
  `approval-required`, `verifyApproval`'s first refusal, a caller carrying one `issuer-unavailable`, and keys are then
  managed only through the CLI and the page; in CF-3, the conformance row, DEC-0159 item 3 and SCN-044's alt path); a
  member's job or call that needs a choice had no path, since a form-mode input request answered by the member is a
  `relayed` action a member's key does not reach, and an elicitation the member accepted would be recorded as the
  operator's decision under AP-2 (now every input request and elicitation of a client-key caller's job or call is
  handled as CF-4's step on the operator's page: never put in that caller's `inputRequests`, never elicited to it,
  raised to the operator, the job reading `working`, a call that cannot go on refused `scope-not-granted` with
  `operator-step: choice`; one sentence each in AP-2's elicitation clause and interop C3.3, and in DL-19's row; an alt
  path in SCN-058, the decision node and task analysis of FLW-35, an acceptance criterion of ST-041 and SCR-35's states;
  DEC-0159 item 4 and the conformance row). Risks folded: CF-4's event is one path, an events-feed event with
  `notify: true`, a `kind` the host reads as an ask and `level` `notice` or higher (Fabric Dashboards' default banner
  minimum, its `notify.ts` line 41), which the operator channel, where there is one, sends (OC-4), with `level`
  `warning` no longer an equivalent (CF-4, the conformance row, DEC-0159 item 4 and *Compatibility*, SCN-044, SCN-058);
  CF-1 has each instance verify a token's and an approval's `aud` against `<id>.<instance>` (DL-2, DL-13 step 8, DL-18,
  the `agentId` grammar); CF-3 cites DL-8 and DL-26 for a client key as an estate agent's own credential, DL-29's token
  where `auth.delegation` is declared and the client key in place of DL-26's token per call otherwise; the eighth
  divergence restated as a key with the key-issuing scope already issued on 2026-11-07 to a colleague who is not the
  operator, the landing message asking the project to revoke it and route key management through its operator's CLI or
  page, or a `relayed` twin; per-key spend and caps the service's own, on the operator's CLI and page only (CF-3, the
  conformance row, DEC-0159 item 3, SCN-044); CF-6's `peer.maxDataClass` on the client-key path the operator's statement
  and the service's own refusal, no host applying `FAC-SEM-088`; the well-known fixture leaving the actions declaration
  out, said in CF-3, DEC-0159 item 3 and the README row (no fixture changed). The branch moved to
  `agent/ct218-local-cloud-v2` (see *Branch*), named in this handoff, its README row and backlog CT-218, CT-270 and
  CT-275.
- Checks run on the round-6 fold before its commit: `pnpm run docs:check` ("Documentation checks passed", markdownlint
  0 errors over 271 files); `python3 docs/ux/lint.py` (passed: 41 stories, 35 flows, 35 screens, 57 scenarios);
  `pnpm run privacy:check` (0 findings); `pnpm vectors:check` (32 vector files match their generators);
  `pnpm --silent validate` on the three fixtures (exit 0 each); `pnpm vitest run test/fixtures.test.ts
  test/consistency.test.ts test/actions.test.ts` (1272 passed); the private-name grep over the branch's diff against
  `origin/main`: nothing; em dashes in the branch's added lines against `origin/main`: 0. The full `pnpm run check` was
  not run here.

- Round 7 (on `1da49807`), not clean: the unit tier passed with five risks, the seam and product tiers failed. The
  coordinator asked to prefer a simpler rule where one removes a class of findings; CF-4 is now one rule, and with it
  `operator-step: choice` is left only for a tool that is not job-backed. Breaks folded: (1) CF-4 handed a client-key
  caller a step on another party's page as AP-4 says, so a member could take the sign-in, consent, payment or top-up
  of the service's own account, against SCN-058 and ST-041 (now a client-key caller is handed no person's step and no
  choice: every `human` action, on the operator's page or another party's, and every input request of its job is the
  operator's, since the service acts with its own provider keys, CF-5; in CF-4, PL-4, AP-2, AP-4, the note under
  `actionDecision`'s table, `FAC-SEM-142`, interop C3.3 and its caller-action row, DL-19's row, the conformance rows,
  SCN-058, ST-041, FLW-35, SCR-35 and DEC-0159 item 4); (2) membership OM-5 promised that everything the membership
  carried ends with it, which a client key a service issued itself does not (now one sentence in OM-5; membership.md
  in DEC-0159's *Consequences*); (3) `peer`'s description in `schemas/service-descriptor.schema.json` still listed only
  a share grant and an organization listing (now it names the client key, DEC-0159 CF-3; description only, its em
  dashes replaced by parentheses since the line is rewritten; DEC-0159's Status says "no schema member, validation,
  field or rule code changes" and names the description); (4) fabric-workspace `knowledge/agents-first.md` line 291
  keeps "(`peer`, client keys, the one-time code)" (named in DEC-0159 *Compatibility* and in *Open*: the knowledge edit
  lands at merge, as the cross-repository rule in `AGENTS.md` asks of the landing run). Risks folded: the raised event
  names its step by an opaque `subject` (type `operator-step`), never the holder label, one event per open step and
  none for a call that meets a step still open, since Fabric Dashboards keys an ask by its subject and holds an ask for
  24 hours (CF-4, DEC-0159 item 4 and *Compatibility*); the page lists each open step and choice with the holder label
  of the key whose call raised it and records the operator's answer as theirs (CF-4, SCN-059, ST-042); the member's
  end state: a call to a job-backed tool answers with its job, whose state the member reads, including the operator's
  no; a call to another tool cannot become a job, because its declared output admits no job handle (interop C3.1), so
  it stays a refusal whose message says the operator was asked or declined, a declined step raising no new event
  (CF-4, SCN-058's taken and declined alt paths, SCR-35's ended state); a budget or a per-key cap stopping a
  client-key call is `limit-reached` with its window, the service the refuser, no approval request, a per-key cap no
  `budgets` entry (CF-3, SCN-058's alt path, ST-041, FLW-35's limit node, SCR-35); the twin without the estate's issuer
  answers `issuer-unavailable` itself or through `verifyApproval` with a jti store (without one DL-18's order answers
  `unknown-state` first, the unit tier's probe), and that answer is final for the caller (CF-3, the conformance row,
  DEC-0159 item 3, SCN-059); CF-4's choice rule is bounded: a `relayed` action keeps its own gate after the key's
  scopes, so AP-2's and DL-17's answers stand and `FAC-SEM-142`'s carve-out covers only `human` actions; a client-key
  caller of a source hand-over gets source.md's T2 answer, `handover-needs-estate-route`, with source.md's premise
  naming the client key; DL-26 and DL-29 point to CF-3; CF-1 states CA-1's manifest obligation; FAA-204's items in
  *Compatibility* add the audience `<id>.<instance>` for each instance's gate; the operator's key management moved
  from SCN-044 into SCN-059 (P-02, ST-042, SCR-30), SCN-044 keeping one sentence, and *Open* records the rebase of
  SCN-044 with DEC-0156; the owed knowledge page states the CF-3 client key's boundary against the north star's
  (DEC-0159 *Compatibility*, *Open*); SCN-058's persona note says a member needs neither an enrolled device nor the
  operator's estate; the browser-login claim now reads "no host on the operator's computer signs the operator in"
  (Fabric Dashboards cannot show the page, PL-3, and no other host, Fabric for one, mints a login code for a browser
  there, HA-2), so it no longer depends on which host mints the code. Declined: none. Not changed: P-03's own
  definition, which other scenarios use; SCN-058 notes the wider reading instead.
- Checks run on the round-7 fold before its commit: `pnpm run docs:check` ("Documentation checks passed", markdownlint
  0 errors over 271 files); `python3 docs/ux/lint.py` (passed: 42 stories, 35 flows, 35 screens, 58 scenarios);
  `pnpm run privacy:check` (0 findings); `pnpm vectors:check` (32 vector files match their generators);
  `pnpm --silent validate` on the three fixtures (exit 0 each); `pnpm vitest run test/fixtures.test.ts
  test/consistency.test.ts test/actions.test.ts test/positive-sweep.test.ts` (1469 passed), and, for the schema
  description, `test/descriptor-rules.test.ts`, `test/guide-examples.test.ts`, `test/spec-required-members.test.ts`,
  `test/validate-cli.test.ts` and `test/service-rules.test.ts` (2120 passed, 2 skipped); em dashes in the branch's
  added lines against `origin/main`: 0; `git merge-tree --write-tree HEAD origin/main`: exit 0. The full
  `pnpm run check` was not run here.

- Round 8 (on `02606f7e`), not clean: all three tiers failed. The coordinator again asked to prefer a simpler rule
  where one removes a class of findings. Breaks folded: (1) DL-19's closing sentence put `error="invalid_token"` on
  every `401`, against CF-3's bare challenge for no key (now DL-19 says it for a credential that came, and a bare
  `WWW-Authenticate: Bearer` for none, RFC 6750 section 3.1; no test or vector of this repository asserts the old
  wording, `git grep invalid_token` finds only prose; the adapter's kits send `invalid_token` on a no-token `401`,
  named under FAA-204 in DEC-0159 *Compatibility*); (2) DL-26 gave a T2 caller a grant with limits, an expiry and a
  payer while a client key carries no grant (now the client key takes the token's place and the grant's: the
  service's own budgets its limits, the key's revocation or expiry its end, the service's operator its payer, in DL-26,
  CF-3 and DEC-0159 item 3); (3) a step raised while the operator's Fabric Dashboards was not running never became an
  ask, since it reads its first poll as history (`src/core/monitor.ts` line 582 at `d43c94e`) (now CF-4 raises an
  open step's event again under the same `subject` once a day until it is taken or declined, which the host's 24-hour
  ask cooldown and its operator-channel relay, one ask per episode in 24 hours, `src/core/outage-alerts.ts` lines 66
  and 182, keep to one ask a day; in CF-4, the conformance row, DEC-0159 item 4 and *Compatibility*, SCN-059 step 3,
  ST-042 and FLW-36); (4) SCN-059's operator side had no screen (now SCR-36, the operator's cloud agent: the CLI's
  key list with per-key spend and cap, the host's ask, the page's open steps and choices with take, choose and
  decline, and the operator's agent's twin answers, `scope-not-granted`, `approval-required` with the digest, a final
  `issuer-unavailable` and a key shown once; FLW-36 is SCN-059's flow; SCR-30 maps SCN-059 no longer, which also
  removes the `screens.md` conflict with DEC-0156's branch).
  Risks folded: `operator-step: choice` now tells the caller the tool cannot wait for the operator's choice and is not
  repeated (DL-19's row, interop's caller-action row, CF-4, SCN-058, SCR-35, the conformance row, DEC-0159 item 4);
  `limit-reached`'s window mapped per budget (the `period`, `task` for `per_job`, the smallest covering `day`, `week`
  or `month` for a rolling window, else `total`; a per-key cap the same way); the issuer-less reading stated once for
  every `relayed` action of an instance in CF-4, CF-3's twin pointing to it (the simpler rule: one place, every
  action); DL-29's issuer condition on the token route only, and its outside-family sentence naming the client key;
  `actionDecision`'s doc comment and `fixtures/semantic/action-call-human.json`'s description name CF-4's exception
  (no behaviour change, vectors unchanged); Fabric's agent registry refusing `peer`, `runner` and the object
  `installedBy` (Fabric CO-278, DEC-0061) in *Compatibility*, with the direct call (DL-9) as the route until it
  re-pins; *Open*'s rebase note now names both `scenarios.md` hunks with DEC-0156 (SCN-058 and SCN-059 inside the
  second) and homes DEC-0156's key-issuance question in SCN-059 with a proposed resolution; the north star's
  administrator-run offboarding and the PM agent's issuance named in *Compatibility* against CF-3, and a clause in the
  usage report (client-key spend has no per-member total outside the service's CLI and page); a key MAY carry an expiry
  the operator sets, past which it is treated as revoked (CF-3, SCN-058, SCN-059, ST-042), as the simpler answer to a
  departed member's key than naming an outside signal; one step defined in CF-4 (one account step, one order's spend
  above a limit, one job's input request), the page listing every key waiting on it and a decline answering every
  caller of it (CF-4, SCN-058, SCN-059); the page's choose and decline as `relayed` actions with agent twins under
  AP-1, taking a step being the operator's `human` step itself (CF-4, SCN-059, SCR-36); CF-1's audience: a grant
  naming an instance in the form names `<id>.<instance>`, the bare `id` being no audience there. Declined: the
  `knowledge/agents-first.md` line 291 edit stays at landing, as *Open* already says, because the knowledge page states
  what the contract says and DEC-0159 is not landed; the conformance row's "(CF-1 to CF-6)" stays, since CF-7 restates
  source.md's *Handing over* and asks of the service no conduct the row's test would check. Also folded from the unit
  tier's not-examined list: an `inputResponses` a client-key caller sends anyway is never taken as the answer (CF-4).

- Checks run on the round-8 fold before its commit: `pnpm run docs:check` ("Documentation checks passed", markdownlint
  0 errors over 271 files); `python3 docs/ux/lint.py` (passed: 42 stories, 36 flows, 36 screens, 58 scenarios);
  `pnpm run privacy:check` (0 findings); `pnpm vectors:check` (32 vector files match their generators);
  `pnpm --silent validate` on the three fixtures (exit 0 each); `pnpm typecheck` (exit 0, for the doc comment);
  `pnpm vitest run test/fixtures.test.ts test/consistency.test.ts test/actions.test.ts test/positive-sweep.test.ts
  test/delegation.test.ts` (1499 passed); the private-name grep over the round's diff: nothing; em dashes in the
  branch's added lines against `origin/main`: 0; `git merge-tree --write-tree HEAD origin/main`: exit 0. The full
  `pnpm run check` was not run here.

- Round 9 (on `05dc64ec`), not clean: all three tiers failed. Folded by simplifying where a rule could go.
  Breaks folded: (1) unit: round 8's "an `inputResponses` that caller sends is never taken as the answer" contradicted
  CF-4's own *A `relayed` action keeps its gate*, the departure note under `actionDecision`'s table and
  `FAC-SEM-142`, since AP-2 makes a job's input request a `relayed` action and `actionDecision` takes an accepted
  `approval/1` on it (now the sentence is gone: such an `inputResponses` is the step's `relayed` action under its own
  gate, refused `approval-required` with the step's digest without an accepted `approval/1` and taken as the
  approver's decision with one where the instance takes `approval/1`, DL-18; no departure is added; a member's key
  reaches `fabric.job.get` to read its job, so its `inputResponses` is refused `approval-required`; in CF-4, interop
  C3.3, the conformance row, DEC-0159 item 4, SCN-058 and SCN-059); (2) product: a declined step had no way back, the
  page listing open steps only (now a decline answers only the jobs waiting on the step and closes it; a later call
  that reaches the same need opens a new step and asks again, and a need the operator met outside the page, a top-up
  or a consent at the provider, is found met by the next call; the "declined" refusal message is gone; CF-4, ST-041,
  ST-042, SCR-35, SCR-36, FLW-36 with an edge from the decline back to a member's call, SCN-058, SCN-059, DEC-0159
  item 4, the conformance row); (3) product: a revoked or expired key's work in flight was undefined (now revoking a
  key, or its expiry, cancels that key's running jobs and its jobs waiting on an operator step, which end `cancelled`,
  interop C3.2; the page drops it from every step's waiting list and a step no remaining call or job waits on closes;
  CF-3, CF-4's repeat, SCN-041's alt path, SCN-058, SCN-059, ST-042, SCR-35, SCR-36, DEC-0159 item 3, the conformance
  row); (4) product: SCN-059's index row now reads "ST-042, FLW-36"; (5) seam: *Compatibility* said nothing on the
  wire changes, but DL-19's header sentence changes every service's no-credential `401` (now it says so and names its
  dependants (restated in round 10): the adapter's `fabric_delegation.py` line 915 and `fabric-delegation.mjs` line 548, its tests
  `test/fabric-delegation.test.mjs` line 140 and `test/test_fabric_delegation.py` line 386, its reference
  `references/delegation.md` line 106, and Fabric Dashboards' sample copy of the kit; FAA-204 carries the change for
  the adapter although it is not specific to the form, rather than a second adapter row this repository cannot file,
  and *Open* tells Fabric Dashboards that its sample copies the kit); (6) seam: the DEC-0156 rebase note was out of
  step with that branch's own note (now *Open* says DEC-0156's note already homes the question in SCN-059, SCR-30 keeps
  "SCN-043, SCN-044, SCN-045, SCN-046, SCN-057", and states the one key split: issuing and
  rotating a member's key the operator's own step in their terminal or on the page, revoking the agent's step on the
  operator's word through the twin where the instance checks `approval/1`, else with the agent's CLI on the operator's
  computer; CF-3, SCN-059's entry point, alt paths and *Errors & recovery*, ST-042, SCR-36, FLW-36's rejected shape
  and task analysis, the conformance row and DEC-0159 item 3 now carry it, and no SCN-059 line hands the operator a
  revoke command).
  Risks folded: the repeat of an open step's event is now no sooner than 25 hours after the previous raise (the
  host's 24-hour ask hold, measured at the poll that read the event, plus its 60-second remote poll) and a new event
  with a new `id` and the same `subject`, `kind` and `link` (CF-4, the conformance row, DEC-0159 item 4 and
  *Compatibility*, SCN-059 step 3, SCR-36, FLW-36); one ask per raise from each host and each channel, the simpler of
  the two offered (no marking mechanism), and the operator channel's OC-5 buttons named as a no-page route for choose
  and decline (CF-4, SCN-059, ST-042, SCR-36, FLW-36, DEC-0159 item 4); L0 and client-key spend: the estate's meter
  reserves none of it, L0 binds it at the call only through each provider key's own ceiling and the estate's month
  sees it after the fact (CF-3, DL-26, DEC-0159 item 3); DL-26's clause scoped to a cloud instance in the form; landing
  lines for the register conflicts with DEC-0157 and DEC-0158, and DEC-0157's lander told that AP-2 and DL-26 moved;
  fabric-workspace `knowledge/authority.md` line 148's T2 row added to the landing's knowledge edits; `CONTEXT.md`
  lines on the operator's decision, the mandate and the family now point to CF-3 or CF-4; CF-1's migration note (an
  agent adopting the form re-keys its local gate to `<id>.default` and has grants naming the bare `id` re-issued;
  CF-1, DEC-0159 item 1); the owed knowledge page says issuing a member's key through the north star's administrator
  agent puts it in that agent's transcript (*Compatibility*, *Open*). None declined.

- Checks run on the round-9 fold before its commit: `pnpm run docs:check` ("Documentation checks passed", markdownlint
  0 errors over 271 files); `python3 docs/ux/lint.py` (passed: 42 stories, 36 flows, 36 screens, 58 scenarios);
  `pnpm run privacy:check` (0 findings); `pnpm vectors:check` (32 vector files match their generators);
  `pnpm typecheck` (exit 0); `pnpm --silent validate` on the three fixtures (exit 0 each); `pnpm vitest run
  test/fixtures.test.ts test/consistency.test.ts test/actions.test.ts test/positive-sweep.test.ts
  test/delegation.test.ts` (1499 passed); the private-name grep over the round's added lines: nothing; em dashes in the
  branch's added lines against `origin/main`: 0; `git merge-tree --write-tree HEAD origin/main`: exit 0. The full
  `pnpm run check` was not run here.

- Round 10 (on `d81c75ec`), not clean: the unit tier passed with three risks, the seam and product tiers failed.
  Folded by simplifying where a rule could go, and the landing notes now say what the merged text must say, with a
  check on the merged tree, instead of what a sibling branch says today. Breaks folded: (1) seam: DL-26 and CF-3 made a
  client key stand in for the token and the grant only at an instance that declares no `auth.delegation`, so a member
  at an instance that declares it (the well-known fixture) owed a token per call it cannot hold (now the clause
  depends on the caller's credential: a caller presenting a client key that instance's operator issued it takes the
  token's place and the grant's at any instance in the form, DL-12 keeping a service's own credentials for people and
  callers outside the estate; `auth.delegation` decides only which credential an agent of the estate holds; in DL-26,
  CF-3, DEC-0159 item 3, `CONTEXT.md`'s mandate entry and the `knowledge/authority.md` landing text); (2) seam: the
  evidence register's RFC 6750 row still put `invalid_token` on every refusal (now section 3's `invalid_token` for a
  credential that came, section 3.1's bare challenge for none, DEC-0039, DEC-0159); (3) seam: DL-19's header change
  had "five dependants", "FAA-204 carries" it, and *Open*'s message to the adapter left it out (now its dependants are
  the adapter's kits, their tests and reference, and every service that vendors the kits, Fabric Dashboards' sample
  among them, each following when it re-copies the kit; "FAA-204 is to carry"; *Open*'s adapter message names it);
  (4) seam: the DEC-0157 landing note described the sibling's note (now *Open* says what merged UD-4, DEC-0157's item
  4 and its agent row must say, the elicitation clause qualified "(never sent to a client-key caller of a cloud
  instance in the local and cloud form, CF-4)", with `awk` checks on the merged tree); (5) product: a member could not
  tell a decline (now a declined job ends `failed` with `error.data.detail` `operator-declined: <humanStep>`,
  `operator-declined: choice` for a choice, its `error.code` the service's own, as interop C3.2's `failed` requires an
  `error`; a caller of a tool that is not job-backed gets no word of a decline and its repeat asks the operator again,
  so an operator whose no is meant to last removes the tool from that key's scopes or tells the member; CF-4, the
  conformance row, DEC-0159 item 4, SCN-058, SCN-059, ST-041, SCR-35, FLW-35, FLW-36); (6) product: SCR-35 showed a
  revoked key's cancelled job, which the member cannot read (now the state is `unauthenticated`, the key's jobs
  cancelled, learned only from the operator; SCN-058 says the same); (7) product: spend policy's L0 and DL-26's "at
  every tier the money limits bind" were false for client-key spend (now L0's row and DL-26 name the one exception,
  pointing to CF-3: at the call such spend is bound only by each provider key's ceiling and the service's own budgets,
  not by L0's monthly total or a project's L1; DEC-0159 *Compatibility* states it as a relaxation of L0's hard stop the
  operator must know, and *Open* asks the operator). Risks folded: the issuer-less "only through the CLI and the page"
  now reads "unless the platform proves a caller's tier T0 or T1 (DL-25)" (CF-3, DEC-0159 item 3); a rolling window's
  bounds: `day` up to 86400 seconds, `week` up to 604800, `month` up to 2678400 (31 days, so every monthly window of
  *Limits* maps to `month`); a member's key issuance declared as the prose says: the page's action for a member's key
  is its own action, `gate: "human"` with `humanStep` `secret` (AP-4 already counts a secret handed out), with no
  `relayed` twin, the twin issuing and rotating only an agent's own key, and the agent conformance row saying an agent
  never calls the member's door, the simpler of the two fixes offered (a door that delivers a key without returning it
  would be new mechanics); the hand-over channel named (a password manager's item share, a one-time secret link, or
  reading it out to the member, who types it into their own secret window), and the hand-over note states the key's
  expiry (CF-3, DEC-0159 item 3, SCN-058 step 1, SCN-059 step 2); rotation defined: it revokes the old key, its jobs
  ending `cancelled`, and issues a new one under the same holder label, scopes and per-key cap (CF-3, the conformance
  row, SCN-058's and SCN-059's alt paths, SCR-36); `operator-step: choice` on a tool that is not job-backed: SCN-059's
  alt path (the operator runs the tool or removes it from members' scopes) and CF-4's "a member's key should not carry
  such a tool"; the knowledge landing texts quoted in full ("(`peer`, client keys, the operator's one-time code for
  the page)"); OM-5 reads "revokes it or an expiry they set passes"; the DEC-0156 note now states the merged SCN-059
  and SCR-30 with checks, not what that branch writes. Declined: opening the fabric-workspace branch now (product,
  last risk), because a knowledge page states what the contract says and DEC-0159 is not accepted; the edits stay at
  landing, now quoted in full in *Open*, as round 8 declined the same.

- Checks run on the round-10 fold before its commit: `pnpm run docs:check` ("Documentation checks passed", markdownlint
  0 errors over 271 files); `python3 docs/ux/lint.py` (passed: 42 stories, 36 flows, 36 screens, 58 scenarios);
  `pnpm run privacy:check` (0 findings); `pnpm vectors:check` (32 vector files match their generators);
  `pnpm typecheck` (exit 0); `pnpm --silent validate` on the three fixtures (exit 0 each); `pnpm vitest run
  test/fixtures.test.ts test/consistency.test.ts test/actions.test.ts test/positive-sweep.test.ts
  test/delegation.test.ts` (1499 passed); em dashes in the branch's added lines against `origin/main`: 0;
  `git merge-tree --write-tree HEAD origin/main`: exit 0. The full `pnpm run check` was not run here.

- Round 11 (on `59429367`), not clean: the unit and seam tiers passed with seven and four risks, the product tier
  failed on one break. Break folded: DEC-0159's *Compatibility* told the owed knowledge page that an organization agent
  issues a member's client key as the operator's `relayed` twin, against CF-3 (now it issues only its own key, only as
  that operator's `relayed` twin with a recorded decision, and never issues or rotates a member's key; a grep of the
  branch found no other sentence letting an agent issue a member's key). Risks folded: the twin issues and rotates a
  key only for the agent that calls it, returned to that agent alone, so no secret is handed to another party and it
  is not AP-4's secret handed out, any other agent's key being the operator's in their own terminal or on the page, and
  none where `auth.delegation` is declared (CF-3, DEC-0159 item 3, the conformance row, FLW-36); a waiting job's
  `statusMessage` starts `operator-step <humanStep>` (`operator-step choice` for a choice), in the style of
  `FAC-SEM-119`'s pause grammar, with no rule code yet (CF-4, DEC-0159 item 4, the conformance row); a final
  `issuer-unavailable` carries `data.detail` `no-trusted-issuer`, the detail the adapter's JS kit already gives, with a
  CF-4 clause in DL-19's row and an FAA-204 item in *Compatibility*, and CF-4 no longer calls DL-19's `503` "passing"
  (it is the `503` DL-14 tells a caller to retry); one step now covers every `humanStep` (`passkey`, `comparison`, a
  secret no provider account holds: one action with its arguments); "waits on" now means a job only, and a key is
  "listed on" a step, which stays open until taken, declined or no listed key remains (CF-3, CF-4, DEC-0159 items 3
  and 4, the conformance row, SCN-059, ST-042, FLW-36, SCR-36); a rolling budget's window names its
  length class, not a calendar reset; rotation keeps the old key's expiry unless the operator sets another (CF-3,
  DEC-0159 item 3, the conformance row, SCN-058, SCN-059, SCR-36); spend policy's rule 2 and a sentence closing DL-21 point to
  the one exception L0's row names; *Open* now states each merge-note edit as the second lander's (`OW-4` in SCN-059,
  the UD-4 sentence, the elicitation clause and DEC-0157 item 4's clause), adds OW-4's hand-over of a secret step with
  no link (the CLI command the operator runs in their own terminal, which the agent names and never runs; this was not
  yet in *Open*, only the key split was), adds DEC-0158's OS-6 counting `operator-step` as a human-step stop with an
  `awk` check, asks the operator whether a door delivering a member's key into their vault without returning it is a
  conformant route, and adds `knowledge/north-star.md` lines 233 and 536 to the landing's knowledge edits. Already in
  *Open* and left: the L0 relaxation question. Not changed: no rule code, schema or vector.

- Checks run on the round-11 fold before its commit: `pnpm run docs:check` ("Documentation checks passed", markdownlint
  0 errors over 271 files); `python3 docs/ux/lint.py` (passed: 42 stories, 36 flows, 36 screens, 58 scenarios);
  `pnpm run privacy:check` (0 findings); `pnpm vectors:check` (32 vector files match their generators);
  `pnpm typecheck` (exit 0); `pnpm --silent validate` on the three fixtures (exit 0 each); `pnpm vitest run
  test/fixtures.test.ts test/consistency.test.ts test/actions.test.ts test/positive-sweep.test.ts
  test/delegation.test.ts` (1499 passed); em dashes in the branch's added lines against `origin/main`: 0;
  `git merge-tree --write-tree HEAD origin/main`: exit 0. The full `pnpm run check` was not run here.

- Round 12 (on `5f99cf7e`), not clean: the unit tier passed with five risks, the seam tier failed on one break and the
  product tier on three. Breaks folded: FLW-35 let the operator issue a member's key through the gated twin (now with
  the agent's CLI in their own terminal or on the page, never through the twin, CF-3; `grep 'gated twin' docs/ux`
  prints nothing); `CONTEXT.md`'s *Trust tier* said money limits bind at every tier with no exception (now with the
  one exception spend policy's L0 row names, CF-3, and human gates at every tier); JTBD-16's success metric and
  SCN-058's *Expected result* promised that no page address reaches the member, whose `peer.endpoint` shares the
  page's origin (now: no provider key or descriptor token reaches the member, no link to the operator's page is
  handed to them, and the page opens nothing for their key, CF-4; FLW-35's goal and SCN-059's *Expected result* the
  same). Risks folded: DL-27's family sentence and the family's conformance row name L0's one exception (chosen over
  a CF-3 sentence that a T0 or T1 caller uses no client key, which would contradict CF-3's estate agent holding one
  where no `auth.delegation` is declared); ST-035's human-step criterion gives CF-4's answer for a client-key caller
  at a cloud instance; the DEC-0157 and DEC-0158 merge notes gain a merged-tree check on each one's conformance row;
  *Compatibility* names the adapter's vendored actions vector, which takes `action-call-human.json`'s description at
  its next re-pin under FAA-204, the re-keying window (an estate caller refused `wrong-audience` until its grant is
  re-issued, with an alt path in SCN-059), and the organization server's usage view, which does not see client-key
  spend (also in CF-3); DL-19's `issuer-unavailable` row makes `no-trusted-issuer` final from any callee, a
  configuration fault, still HTTP `503` but not retried as DL-14's is, and CF-4 and DEC-0159 item 4 say "still HTTP
  `503`, but final"; CF-4's sentence on a member's key now carries `fabric.job.get`'s exception itself; an open step's
  repeat is bounded to no sooner than 25 hours and no later than 48 hours after the previous raise (CF-4, DEC-0159
  item 4 and *Compatibility*, the conformance row, SCN-059, FLW-36, SCR-36); the knowledge landing list adds
  `north-star.md` lines 204 and 261 and `system/base-set.md` line 31, pending the vault-delivery question; CT-279 is
  filed for a reference input marking a client-key caller, so that `FAC-SEM-142`'s exception gets a machine check.
  CF-3 now says what the page's own `relayed` key action does (it revokes a key; issuing or rotating any key on the
  page is the `human` action), so the twin revokes with the same effect (AP-1) and its issuing of its caller's own key
  is an agent-surface act no page action offers, narrowing none. Already in *Open* and left:
  the L0 relaxation question. Not changed: no rule code, schema or vector.

- Checks run on the round-12 fold before its commit: `pnpm run docs:check` ("Documentation checks passed", markdownlint
  0 errors over 271 files); `python3 docs/ux/lint.py` (passed: 42 stories, 36 flows, 36 screens, 58 scenarios);
  `pnpm run privacy:check` (0 findings); `pnpm vectors:check` (32 vector files match their generators);
  `pnpm typecheck` (exit 0); `pnpm --silent validate` on the three fixtures (exit 0 each); `pnpm vitest run
  test/fixtures.test.ts test/consistency.test.ts test/actions.test.ts test/positive-sweep.test.ts
  test/delegation.test.ts` (1499 passed); `grep -rn 'gated twin' docs/ux` (nothing); em dashes in the branch's added
  lines against `origin/main`: 0; `git merge-tree --write-tree HEAD origin/main`: exit 0. The full `pnpm run check`
  was not run here.

- Round 13 (on `4653ab82`), not clean: the unit tier passed with three risks, the seam tier passed with five, and the
  product tier failed on one break with three risks. Break folded: the conformance row, SCN-058's alt path and
  DEC-0159 item 4 said a member's key reaches no `relayed` action's tool with no exception, so a service built to the
  row would refuse a member's `fabric.job.get`; each now reads "other than `fabric.job.get`, which it reaches to read
  its own job", as CF-4 does. Risks folded: SCN-044's cloud-instance sentence, CF-4's *Where the operator is*, SCN-059's
  no-page alt path and DEC-0159's restatement take SCN-059's key split (issuing and rotating in the operator's own
  terminal or on the page, revoking by the operator's agent on the operator's word with the agent's CLI on the
  operator's computer), and *Open*'s SCN-044 note says so with DEC-0156's check (`grep -c 'operator manages client
  keys'` over SCN-044 prints 0); CF-4, DEC-0159 item 4 and the conformance row make the choose and decline twins tools
  of their own addressing a step by its opaque id, never `fabric.job.get` on the member's job (a queuing instance
  answers another caller's job `unknown-job`, agent network); CF-3, DEC-0159, SCN-059 and the conformance row have the
  twin refuse to rotate, as to issue, a key that can manage keys, `scope-not-granted`, such a key issued and rotated
  only through the CLI or the page; spend policy's L0 row and *Compatibility* say only L0's monthly total sees
  client-key spend after the fact, as CF-3 and DL-26 do; *Compatibility* names that callers of any service now read
  `issuer-unavailable` with `no-trusted-issuer` as final, which FAA-204's kit work covers generally; `CONTEXT.md`'s
  *Family* carries *Trust tier*'s L0 parenthesis; contexts.md's *Usage per grant* says client-key spend at a cloud
  instance in the form is not in that view (CF-3). In *Open*: the DEC-0156 note puts the operator's-own-terminal
  clause into OW-4 and CONTEXT's *Operator's word, carried out the first time* (CF-4 may carry it too, never instead),
  binding whichever of DEC-0156 and DEC-0159 lands second, with its merged-tree checks; `docs/ux/foundation.md` joins
  that note (ST-035: this branch's human-step line, then DEC-0156's line, both, in that order); the knowledge landing
  list adds `north-star.md` lines 138, 142 and 224, and the knowledge commit is to be recorded here at landing; the
  DEC-0158 note binds whichever of the two lands second, and the coordinator relays it to DEC-0158's branch, which
  carries no reciprocal note. Left in *Open*: the L0 relaxation question and the vault-delivery question. Not changed:
  no rule code, schema or vector.

- Checks run on the round-13 fold before its commit: `pnpm run docs:check` ("Documentation checks passed", markdownlint
  0 errors over 271 files); `python3 docs/ux/lint.py` (passed: 42 stories, 36 flows, 36 screens, 58 scenarios);
  `pnpm run privacy:check` (0 findings); `pnpm vectors:check` (32 vector files match their generators);
  `pnpm typecheck` (exit 0); `pnpm --silent validate` on the three fixtures (exit 0 each); `pnpm vitest run
  test/fixtures.test.ts test/consistency.test.ts test/actions.test.ts test/positive-sweep.test.ts
  test/delegation.test.ts` (1499 passed); em dashes in the branch's added lines against `origin/main`: 0;
  `git merge-tree --write-tree HEAD origin/main`: exit 0. The full `pnpm run check` was not run here.

## Next task

Round 14 of the blind readings of branch `agent/ct218-local-cloud-v2` (DEC-0159), all three tiers.
