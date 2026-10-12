# Canvas — the contract's target state over its current logic (2026-10-11)

The committed target-state spec of the [board run](brief.md). Every inventory item lands on one node below
([waves.json](waves.json) → [inventory.json](inventory.json)). A wave's packets may deepen a section here,
never contradict it; a change is a `revisions` entry at the end of this file.

## The target, in one paragraph

A contract a host, a provider and an agent can each implement from the documents alone, and be told by one
gate exactly where they diverge. Every normative sentence resolves to a schema, a semantic rule with a test
that fails without it, a fixture, or a version-pinned source with its retrieval date. Every refusal is a
stable code with a location a person reads and an agent acts on. The gate measures only this repository.
The board and the knowledge base say what is true of it today, and every consumer's adoption is a row with
an owner. New contracts land designed against the whole, never as a shape a later decision undoes.

## Modules — as-is → to-be

### N01 incoming — land the two PRs Fabric's session wrote (wave 1) — done: `7931c1d`, `213e5a3`

- As-is: PR #32 (DEC-0041) at `2f1dd28` after one review round and its fixes; PR #31 (DEC-0042,
  `session-handoff/1`) at `84043cb`. Both edit the Next free lines.
- To-be: #32 merged first (the task window keyed `task` → first `act.session` from the outermost actor →
  `grant:<ref>`, per Fabric ADR-0144 amendment 2 at `217aff4d`), then #31 rebased, renumbered and merged.
  Fabric's session is told each merge commit. The audit findings F-B-302…304 close with #32.

### N02 gate — the gate measures this repository and checks its own classes of defect (wave 1) — done: #34, #35, #37, #38

- As-is: `vitest` and `markdownlint` sweep `.claude/worktrees/` and transient `.git` files, so a local run
  reports other sessions' failures (F-A-001). No test runs the semantic rules over positive fixtures, so a
  rule may refuse the repository's own valid example (F-B-201: FAC-SEM-012 refuses every Windows path).
  `docs:check` does not verify a decision's named paths (F-A-010), so three decisions name files that do not
  exist (F-A-009). About 40 findings are one class: a rule branch no test kills.
- To-be:
  - test and lint scope are `git ls-files`, never the working directory;
  - a sweep test runs every semantic rule over every positive fixture and expects no finding;
  - `docs:check` resolves every path a decision lists;
  - a coverage gate holds 100 % branches on `src/*-rules.ts`, `src/delegation*.ts`,
    `src/grant-projection.ts` and `src/fabric-links.ts`, run by `pnpm run check`.

  Branch coverage is the cheap half of killing. The other half is each wave's planted defects, recorded in
  its close record.
- CI cadence (F-D-011) is the operator's call: question Q2 in [plan.md](plan.md).

### N03 board — the board and the registers are true (wave 1) — repository part done (#39); knowledge base and wiki in review

- As-is: `docs/backlog.md` holds CT-01…05 (CT-05 filed today), nothing for DEC-0032…0041 adoption or the
  org-edition packets. The roadmap's contract row is four decisions behind. Pins in org-index and the wiki
  are stale. Seven decisions left no handoff, and the retro has no stamp since 2026-10-02.
- To-be:
  - one board row per canvas node (the node's id in the row), and one per consumer adoption naming the
    consumer's own row id;
  - closed rows keep receipts;
  - the roadmap row, products/plans rows and the wiki card name the merge commit;
  - the retro carries a stamp for this run;
  - the register annotates amended decisions (DEC-0015 by DEC-0032; DEC-0017 by DEC-0018; DEC-0021 by
    DEC-0027; DEC-0039 tightened by its own session lifetime);
  - the DEC-0028 gap is stated once in the register.

### N04 truthful docs — the front door is true today (wave 1) — done: #36

- As-is:
  - `README.md:18-20` says no SDK or CLI ships, while `src/` verifiers are ported by consumers and
    `pin:check` is a CLI;
  - `acceptance.md` says private, 13 schemas and 34 tests;
  - the glossary lacks the terms of DEC-0030…0041;
  - the source ledger lacks rows or revisions for OpAMP, systemd, Task Scheduler, Windows ACLs, WCAG 2.2,
    RFC 2119/2986/8032 and the A2A `/latest/` link.
- To-be:
  - the README's status says what ships (schemas, fixtures, the conformance checker, reference verifiers,
    `pin:check`) and what does not (a runtime, a published package);
  - acceptance evidence is dated history plus a current gate line produced by the gate;
  - every glossary term a decision introduces is in `CONTEXT.md`;
  - every external citation has a ledger row with revision and retrieval date.

### N05 delegation — DEC-0037…0041 sealed (wave 2) — done: DEC-0045, #45 `2eb91c0`

- As-is:
  - the meter refuses in two wire shapes (F-B-301);
  - a token's `grant` array admits references it was not minted under (F-B-305);
  - a callee at depth 4 can never be metered (F-B-306);
  - `verifyDelegation` accepts what DL-13 refuses and refuses in another order (F-B-307);
  - twelve FAC-SEM-050 branches and the verifier's header, key and approval checks die untested
    (F-B-308/309);
  - `readOnly` is a no-op (F-B-312), the issuer check is optional (F-B-313), `approval.method: device` is
    undefined (F-B-314);
  - the session lifetime tightens a service MUST while DEC-0039 says additive (F-B-311).
- To-be, ruled by Fabric's session as ADR-0144's owner on 2026-10-11 (to be its amendment 3):
  - one grant per token;
  - the meter hop exempt from the depth limit, for `aud` = meter, `scope` = grant-check and `effect: none`
    only;
  - `device` removed from the approval methods until a decision defines it;
  - the meter answers `denied` with a code from the one set, and a callee relays it unchanged in
    `error.code`;
  - the verifier refuses in DL-13's row order with the table's codes;
  - shared test vectors (RFC 8785 examples, the refusal table) published for the kits' ports (ask (c));
  - DEC-0039 annotated as tightening the session lifetime, with "the descriptor token rotates" defined in
    `service.md`.

  One DEC records these rulings, with the next free id reserved at writing.

### N14 runner and model profiles — CT-05 on Fabric ADR-0147 (wave 2) — done: DEC-0046, #46 `f41d8e6`

- As-is: DEC-0037's `modelClasses` are free strings. There are no model or runner profiles, routes are not
  typed, and the headless drives lack `pi-json`, `opencode-json` and `kimi-stream-json`. `profiles.md:60`
  and L1 disagree on who chooses the model.
- To-be (Fabric ADR-0147 and its rulings, in [brief.md](brief.md)):
  - a `modelClasses` vocabulary and a catalogue mapping model ids to classes (Fabric publishes
    `registry/models.json`, `registry/model-profiles.json`);
  - `model-profile` and `runner-profile` schemas with fixtures;
  - route `subscription | key`, with a rule that a subscription runs only in its vendor's runner;
  - the headless drives;
  - precedence request > agent > binding/L1 > estate default, the provider choosing within the project's
    allowed classes, and an empty intersection refusing the launch with the policy's name;
  - declared config slots and the resolved profile read-only on the well-known document;
  - usage carries the route;
  - issued keys carry the profile's model allow-list (the profile id on key routes).
- Designed with N05, because DEC-0037's spend policy is the shared page. Built after N05 in the same wave.

### N15 service hygiene — asked by live consumers (wave 2) — done: DEC-0044, #43 `c6c5af1`

- `degraded[].setup: true` (CT-22): an optional flag on a well-known's degraded entry for a state that needs a person
  to finish setup; a watcher (Dashboards FD-48) does not alert on it; the entry still names `source` and `reason`.
- Tools declared where they are used (LC-19, CT-23): a declared stdio MCP server carries its scope (project, or
  enabled where used); a semantic rule refuses a session-wide stdio server in a descriptor, manifest or agent
  profile; a stateless tool is a shared local service under the lifecycle broker with a health check.
- No secret in a command line (LC-21, CT-24): session-handoff's `secretArgument` becomes one shared detector in
  `src/`, applied by a rule to launch arguments, runner drives and MCP entries (args, URL query).
- Touches the service well-known schema, manifest/descriptor schemas and `semantic-rules.ts`; built after N05 and
  N14 in wave 2, sharing no file with them except `conformance.md`'s register (lease).

### N06 canonical JSON — one register of byte forms (wave 2) — done: DEC-0043, #42 `4fdbd79`

- As-is: three "canonical JSON" uses — the settings-backup form (DEC-0025, device policies, activity ids),
  RFC 8785 (delegation approvals), and DEC-0022's under-specified digest — produce different bytes, and no
  page tells them apart.
- To-be: one section in `conformance.md` names each signed or hashed document and the form that covers it.
  Each form has a reference function in `src/` and shared vectors in `fixtures/`. DEC-0022's digest is
  pinned to one named form by a decision. A new document picks from the register, never a fourth form.

### N17 organization edition, first contracts (wave 3, first) — from the first organization server's v4 §12 (D4) — done: DEC-0050, DEC-0051, #50 `9d29d71`; DEC-0055, #54

- `fabric-package/1` (CON-OE-03's package part, moved forward because Stage 1 packing needs it): manifest, service
  template, `secrets[]`, `requires`, `costPresets`, result signal, `state[]`, evals receipt, vendored dependencies,
  digest — one decision; publisher signature and organization countersignature — a second. The signatures' algorithm
  follows Fabric's D2 (ES256 beside EdDSA); until D2 the package names the algorithm field and admits EdDSA.
- `agentRef` as a rule beside the package.
- `estate-record/1` (passkey-signed) last in wave 3, needed from Stage 3.

### N07 activity and devices — DEC-0030/0031 hardened and amended together (wave 3) — done: DEC-0052, DEC-0053, #52 `92de756`

- As-is:
  - ten device and four activity branches die untested (F-B-101/102);
  - `devices.md` says `sha256:` where the schema requires keyed `hmac-sha256:` (F-B-103);
  - check-in details admit encoded home paths (F-B-104);
  - FAC-SEM-044 checks that some user is bound, not the signed-in one (F-B-105);
  - a leaked expired key can backdate a policy (F-B-106).

  CON-OE-01 and CON-OE-12 are owed amendments to the same two decisions.
- To-be, designed as one seam:
  - fixes F-B-101…114;
  - policy-key validity judged at verification time against the current key set, not at the signer's
    `issuedAt`;
  - CON-OE-01:
    - `account.class` and `account.tenantRef`;
    - `policy.violation` by UTC day;
    - neutral notice and consent messages;
    - `purposeId` on access-log entries;
    - posture `re_enrolled`;
    - OD-1 in neutral form;
  - CON-OE-12:
    - tenants;
    - organization API-key credentials only;
    - `personalKeySharing` (absent = forbidden);
    - `collectionStart` and `expiresAt`;
    - a key set counter-signed by the offline root, with TUF pinned.

  Nothing about assessing people lands here (J10). OQ-0010 stays deferred.

### N08 services — every system, CT-01 decided (wave 4) — done: DEC-0057 #57 `8c6211e`, DEC-0061 #63 `335e736`

- As-is:
  - CT-01 is undecided and DEC-0032 widened it to every supervisor;
  - `service.md`'s lifecycle rows Install, Code, State and Uninstall are macOS-only (F-B-202);
  - FAC-SEM-012 refuses Windows paths (fixed in N02's sweep);
  - superseded wording remains (F-A-013, F-B-208).
- To-be, by one decision agreed with Fabric (CO-238) and Fabric Dashboards (FD-37):
  - "no side effect without the lock" and "exit 75 naming the holder" stay;
  - a supervisor-started copy may wait at most 300 s for the lock and touch nothing, signalled by
    `FABRIC_SERVICE_SUPERVISOR=<lifecycle.manager>`;
  - a hand-started copy exits at once;
  - lifecycle rows per system with data, log and cache locations;
  - Windows token-file readers checked by a reference function;
  - the title and rows cover local and remote placements.

### N09 operator channel and embedded dashboard (wave 4) — done: DEC-0058, DEC-0059, #56 `32c01ea`

- As-is:
  - the status schema accepts `unlinked` without a receiver lease, and `receiver-missing` with a held lease
    (F-B-204);
  - most status invariants die untested (F-B-205);
  - the appearance cookie is per host, not per origin, on `127.0.0.1` (F-B-214);
  - ED-6 and ED-9 disagree (F-B-215);
  - an invalid declaration's handling is unspecified (F-B-216);
  - there is no UX scenario (F-B-218).
- To-be:
  - each status state's invariants are in the schema and killed by a test;
  - the cookie is scoped by port-qualified origin or named per service;
  - ED-9's subset rule governs ED-6;
  - a host ignores an invalid declaration and reports it;
  - scenarios exist for the embedded dashboard, delegation approval, spend checks, settings restore and
    the Project board.

### N18 the agent network's transport (wave 4) — re-cut 2026-10-12 from V4-SECURE-TRANSPORT and the device transport ask — done: DEC-0047 #53, DEC-0056 #58, DEC-0060 #62, DEC-0054 #64, DEC-0062/0063 #65

- As-is: the check-in carries `records` (DEC-0053) whose shapes no decision owns yet; the relay and the secret envelope
  are in review (#53, DEC-0047); a TLS-terminating host cannot see a device's client certificate, so mutual TLS is the
  only device transport the contract names.
- To-be:
  - the relay and the secret envelope land (DEC-0047, V4-RELAY), with one `{sequence, sha256}` head shared with the
    check-in;
  - the revocation delta and the heartbeat (DEC-0054, V4-DELTA-HEARTBEAT);
  - window leases (V4-WINDOW-LEASE);
  - signing challenges over RFC 8785 (V4-SIGNING-CHALLENGE), adopting or replacing DEC-0055's `estate-revision/1`;
  - HTTP message signatures beside mutual TLS for devices (DEV-HTTPSIG; label `fabric-device`, a nonce refused when
    repeated), agreed with the first organization server;
  - device-key role counts at enrollment (DEV-KEY-ROLES) and the estate revision's digest in the check-in
    (DEV-CHECKIN-DIGEST), from #54's review.

### N19 wave 4's follow-ups (wave 5)

- The three-tier readings owed for DEC-0054, DEC-0062 and DEC-0063 (W4-READINGS-OWED): merged after the owner's own
  review while subagent readers were at their weekly limit.
- Project Observatory's audit of DEC-0047 (RELAY-AUDIT-1, CON-001…023), as one consolidated revision under #53's rules.
- agent-sync's id registers (AGENT-SYNC-IDS): a tool defect, reported to its owner.

### N10 core — the 0.1.0 rules keep their promises (wave 5)

- As-is:
  - claim and proof are unchecked (F-A-002);
  - a learning may be approved by its author (F-A-003);
  - FAC-SEM-006 cannot see a missing product manager (F-A-004);
  - residue, retention, standing-grant channels, context switch records, A2A task states and rollback
    are promised and not modelled (F-A-014…019).
- To-be:
  - each promise becomes a rule with a killing test, or the sentence is narrowed by a decision.
  - Making standing-grant `channels` required is breaking for 0.1.0 grants, so the decision is a rule that
    refuses a grant authorising an external effect without them (F-A-016). Consumers pin, per DEC-0016.

### N11 interop and usage (wave 5)

- As-is:
  - `interop.md:122-124` still states the pre-DEC-0017 job result (F-A-005);
  - `provider.md` restates superseded rules (F-A-012);
  - the memory pilot is still recommended (F-A-022);
  - the usage report's window is unchecked (F-A-024).

  CON-OE-13 and RM-16 are owed.
- To-be:
  - each superseded sentence is replaced by a link to its ruling;
  - FAC-SEM-025 checks the 31-day window;
  - CON-OE-13 adds `projectId` and `taskRunId` as the service's own run attribution, and drops
    `sessionId` (DL-22: no caller identity enters a usage report);
  - RM-16 adds three OpenRouter attribution headers and three rules, with the source pinned at writing.

### N12 org edition — the open packets (wave 6)

- CON-OE-05 `fabric-proposal/1` (open part) and the learning note; drop the `memory.learning.propose`
  reserve (RM-12).
- CON-OE-06 `surfaces.a2a` well-known part, against A2A 1.0.0 (PascalCase JSON-RPC methods,
  `A2A-Version`). The manifest fields follow with CON-OE-03.
- CON-OE-07 N and N−1, `schema_unsupported`.
- CON-OE-08 the session join key; one writer of intervals.
- CON-OE-10 the local channel to `observatory-net`.
- CON-OE-03 in three or four decisions: node manifest and commands, `fabric-package/1`,
  `fabric-agent-profile/1`, TUF roles. It waits on Fabric ADR FAB-OE-19 for the estate-spans-nodes part.
- Starting this module is question Q1 in [plan.md](plan.md): the org plan says H0 has not started, by the
  operator's instruction.

### N13 program — carried, never dropped

- CON-OE-02 waits on Fabric ADR FAB-OE-14; CON-OE-09 on CON-OE-02, -10 and -12.
- RM-01 waits on a research report.
- The RM-03 residue (hub mint and introspection tools, caller proof, cross-estate delegation, proof of
  possession) waits on Fabric's issuer design, 0.4.0 wave 4.
- CO-KB-02 (schema licence) is the operator's.
- Consumer adoption is each consumer's own release.

## Integration seams

| Seam | This side | Other side | What crosses |
|---|---|---|---|
| Delegation issuer ↔ verifier | DL-1…DL-24, the verifier, vectors | Fabric hub (ADR-0144) | tokens, JWKS, approvals, the grant projection |
| Meter | grant-check request/answer, `taskWindowKey`, `readProjectedGrant` | Project Observatory (OBS-55) | the onward token, window keys, denials |
| Kits | reference verifiers, vectors | fabric-agent-adapter (Python, Node) | ports; asks (a)–(d) |
| Hosts | well-known documents, dashboard, button, session handoff | Fabric Dashboards, Fabric | declarations, `fabric://` links, `session-handoff/1` |
| Org edition | CON-OE schemas and rules | Fabric FAB-OE ADRs, Observatory, Vesta, Switchboard | events, policies, manifests, proposals |
| Board | `docs/backlog.md` via `backlog-sources.json` | fabric-workspace sync | rows and statuses |

## REQ → module → wave

| REQ | Modules | Waves |
|---|---|---|
| REQ-01 | inventory (all) | planning |
| REQ-02 | this canvas | planning |
| REQ-03 | [plan.md](plan.md) | planning |
| REQ-04 | packets per wave | 1–6 |
| REQ-05 | N01…N12 | 1–6 |
| REQ-06 | close pass of each wave | 1–6 |
| REQ-07 | N02, N03, N04 and each wave's docs | 1–6 |
| REQ-08 | the final independent reading | close |

## Deleted or superseded

| What | Removed by | Wave |
|---|---|---|
| `tokenJti` as a task-window key | PR #32 (`grant:<ref>`) | 1 |
| The pre-DEC-0017 job result in `interop.md` C3.2; pre-ruling FAC-SEM-014/015 text in `provider.md` | N11 | 5 |
| `mcp-memory-service` as the recommended pilot (adapter reference, estate loop, ledger) | N11 | 5 |
| `memory.learning.propose` reserve (DEC-0023) | N12 CON-OE-05 | 6 |
| `approval.method: device` (if Fabric agrees) | N05 | 2 |
| Launchd-only lifecycle wording, "Local" title in `service.md` | N08 | 4 |
| `devices.md`'s `sha256:` branch form | N07 | 3 |
| Stale counts in `acceptance.md`, README's status line | N04 | 1 |

## Revisions

- 2026-10-11 — first cut.
- 2026-10-11 — N05's questions ruled by Fabric; N14 added to wave 2 (CT-05 unblocked by Fabric ADR-0147); PR #32 merged at `7931c1d`.
- 2026-10-12 — wave 4 closed: N08, N09 and N18 done (DEC-0047, DEC-0054, DEC-0056…DEC-0063); N19 added to wave 5 with
  the owed readings, the relay audit and the agent-sync defect.
- 2026-10-12 — wave 3 closed: N07 and N17 done (DEC-0050…0053, DEC-0055); OQ-0010 and F-D-028 move to N13 (the first
  organization server answers them); V4-SECURE-TRANSPORT split into N18 (wave 4) with the device message-signature
  binding.
- 2026-10-12 — wave 2 closed: N05, N06, N14, N15 done (DEC-0043…0046) and CT-29, CT-31 fixed; wave 3 re-cut with N17
  (v4 D4: package first, estate record last), N07 gains run/result, v4 device fields and CT-25, N08 the v4 descriptor;
  the v4 delegation amendment waits on Fabric D2 and the secure transport on the relay draft (DEC-0047 reserved).
- 2026-10-11 — wave 1 closed: N01, N02, N04 done, N03's repository part done; N15 (CT-22…CT-24) added to wave 2;
  consumer-owned items moved to N16 (program); ORG-LAYER joins N13.
- 2026-10-11 — N01 closed: PR #31 (DEC-0042) merged at `213e5a3` after three readings; SH-9 strict by Fabric's
  ruling (another server carries only a delegation token; Fabric drops its `x-agw-key` gateway servers).
