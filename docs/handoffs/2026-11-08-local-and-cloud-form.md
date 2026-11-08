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
- At landing: answer thread `79a9f452` with the tag and the section's link, and send the CMO project the sixth to
  eighth divergences (its ungated key door, its refusals' shape with the 30-second revocation, the key with its
  key-issuing scope already issued to a colleague who is not the operator, which the message asks it to revoke and to
  route key management through its operator's CLI or page, or through a `relayed` twin, and the list tool's holder
  names); send the adapter FAA-204's two round-4 items (`fabricManifest` off the
  cloud descriptor, the refusal mapping) and round 5's two (the manifest's resolution for a descriptor without
  `fabricManifest`, the kits' `operator-step` message and client-key caller input); the adapter's offer in its skills (FAA-204) and fabric-workspace's knowledge
  page follow.

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

## Next task

Round 7 of the blind readings of branch `agent/ct218-local-cloud-v2` (DEC-0159), all three tiers.
