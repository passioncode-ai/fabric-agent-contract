# 2026-11-06: several OS accounts on one computer (CT-228, DEC-0154, proposed)

## Objective

Answer the operator's request of 2026-11-05, relayed on board thread `1fe66e6e`: read the organization's plan for a
shared computer on which several OS accounts work, compare it with the contract, write a spec per gap, file the rows and
close them in waves. This run drafts the first wave's decision (G1 to G3 and the host label the board agreed) as a
Proposed DEC on its own branch, and files the rest.

## Done

- [DEC-0154](../DECISIONS.md), Status Proposed: counted OS accounts (who counts, read at every start); HA-1 (a port
  recorded per counted account: kept when this instance's listener holds it or nothing does, chosen anew, free on the
  computer, only when none is recorded or another holder has it; a one-account computer keeps its historical default;
  a claim `.passioncode-ports.<service-id>.<account>.json` naming the account by uid or SID, rewritten at every start,
  not only when it is missing; the port recorded anyway when the claim's path is squatted; at uninstall it rebuilds the claim from what remains,
  granting nothing);
  HA-2 (the listener's owner checked before any credential and before "healthy", the host state `foreign-user` ordered
  before `foreign`, who checks when the client cannot, a server's refusal of another account's peer, rotation, the
  PKCE loopback redirect, the browser-cookie residue); HA-3 (no token-free loopback door on a computer with several counted
  accounts; forwarders are relays; the single-account gap accepted, CT-238); HA-4 (each counted account and each
  virtual machine is its own device; `device.hostLabel`, its secret kept out of backups, its read rule failing closed,
  sent only once a policy member turns it on, CT-239).
- [service.md](../specification/service.md#several-os-accounts-on-one-computer): the new section, the port claim's
  pointer, `FAC-SEM-009`'s neighbour, the threat model and the cookie residue, the trust anchor, the Install and
  Uninstall rows. [delegation.md](../specification/delegation.md#trust-tiers): the header, DL-25's T0 row, the relay
  paragraph and the accepted gap. [devices.md](../specification/devices.md#the-host-label): the device definition, the
  host label, UE's linkable list. [contexts.md](../specification/contexts.md): `org.id` with 128 random bits where the
  label is on. [node-summary.md](../specification/node-summary.md): a `foreign` or `foreign-user` service reported
  `down`. [conformance.md](../specification/conformance.md): the reference module's row and eight rows (installer,
  client, host-state reader, receiving surface, host handing a credential, token-free door, node, setup step).
- The host label's reference `src/host-label.ts` (`hostLabel`: link, owner per platform, mode, size), its generator
  `tools/vectors/host-label.ts` (Node's own HMAC, not importing the reference), vectors
  `fixtures/vectors/host-label.json` (47 cases), `test/host-label.test.ts` (which also holds `ORG_ID` equal to the
  schema's `opaqueId`), a coverage floor of 100 in `vitest.config.ts`; the optional schema member `device.hostLabel` in
  `schemas/device-enrollment.schema.json` with a positive and a negative fixture; `service.id`'s description in
  `schemas/service-well-known.schema.json`.
- `CONTEXT.md`: Device redefined; Counted OS account, Port claim, `foreign-user` and Host label added; Trust tier
  narrowed. UX: SCN-056 in `docs/ux/scenarios.md`, SCR-20's `foreign-user` state in `docs/ux/screens.md`, FLW-17's
  screens in `docs/ux/flows.md`. RFC 8252's row in `docs/evidence/sources.md`, and RFC 6265's existing row read again (its section 8.5 was already pinned for DEC-0059).
- The gap list as a tracked spec: [2026-11-06-shared-host-gaps.md](../evidence/specs/2026-11-06-shared-host-gaps.md),
  the shared computer's accounts by role only.
- Backlog CT-228 (the DEC) and CT-229 to CT-241 (the state-order vector file, G4 to G11, the single-account forwarder
  gap, the policy member, the fixture catalogue, the organization's display).
- Ids: DEC-0154 reserved by compare-and-swap on origin (under this run's own reservation key); no rule code reserved.
  `DECISIONS.md`'s marker reads `DEC-0155`, `conformance.md`'s stays `FAC-SEM-169`, equal to the counters.

## Readings

- Round 1 at `25ba36f7`: not clean. Unit passed (its notes: the read rule fails closed, `ORG_ID` held equal to the
  schema, the docblock's order of reading; a catalogue gap filed as CT-240). Product failed on seven breaks (an
  undefined account count, the clients the contract does not reach, the host label's unlinkability, the secret in
  backups, the UX scenario, the glossary, three rows without acceptance) with risks (system-account listeners,
  single-account forwarders, the claim catch-up, the sending signal, product facts stated as facts, the installer row
  naming Fabric Dashboards, the plan's private details in the spec). Seam failed on one break (the Install and
  Uninstall rows) with risks (`org.id`'s randomness, the watcher, the organization's display, filed as CT-241). The
  coordinator's decisions on all of them are folded in at the next head.
- Round 2 at `cbc425d7`: not clean. Unit passed with one risk (the bytes validated before the metadata: the reference
  now decides by link, owner and mode first, a file up to 1024 bytes is answered by size, above that a fault). Product
  failed on four breaks: "host" in two senses (the new text now says "computer" for the machine, the section is
  renamed "Several OS accounts on one computer", and "host label" is defined once as the computer's label), one UI line
  for two causes (two lines now), the free-port test moving existing ports (an installer now keeps its instance's
  recorded port), and the A2A sentence on loopback reach (rewritten, with `profiles.md`). Seam passed, with follow-ups
  R1 to R7 folded in. The branch merged GitHub main `1c141418` (PR #245) first. The spec and this handoff were renamed
  to `2026-11-06-shared-host-gaps.md` and `2026-11-06-shared-host-ports.md`.
- Round 3 at `feef4e4d`: not clean. Product failed on five breaks: "host" still meaning the computer in `CONTEXT.md`,
  two conformance rows, the backlog rows, this spec and this handoff (now "computer", file names and "host label"
  kept); the display's wording ("these devices share a computer"); HA-1 restated as decided in the spec's G1 and this
  handoff; SCN-056's expected result against the cookie residue (and an open browser tab as an alt path); and the
  account count failing toward fewer (an account that runs Fabric or an agent service, or has a services directory,
  now always counts). Risks folded: the unproven `org_<base32>` parenthesis removed, `foreign` reported `down` on any
  computer, the Linux folder's limits (claims rewritten at every start), the Windows claims folder created by the setup
  step; SCR-20 and FLW-17 retitled; the appearance cookies' write named. Unit passed (39 vectors and 2816 generated
  inputs against an independent model, 27 of 27 mutants killed), with two notes folded: the negative fixture differs
  from the positive only in its padding bits (`...wR`), and the fixture's `org.id` is described as "at least 128
  random bits" with no encoding named. Seam passed with no break; its risks became S1 to S8, folded in.
- Round 4 at `66e44c3d`: not clean. Product failed on V1 (the claim's rewrite at every start stated as "only when
  missing" in the spec, this handoff and a conformance row) and V2 ("host" for the computer in the reference, the
  generator and the vectors; two cases renamed "the same computer in another organization" and "another computer in
  the same organization"); seam failed on V1. Unit passed (38 of 40 mutants killed, one equivalent; the other, the
  hex check moved before the mode check, is now killed by two vectors, V14: "writable by another account, no bytes
  read" (renamed in round 6: "writable by anyone but the platform's administrator, no bytes read") and "a folder not the administrator's, an oversized file"). V3 to V13, the coordinator's decisions, are folded
  in.
- Round 5 at `190ee95e`: not clean. Product failed on three breaks: FLW-17's goal ("never an outage") and ST-021's
  story did not cover another account's listener (ST-021 widened, FLW-17's goal, entry points, success exit, task
  analysis and traces now cover it), SCR-20's elements and resources (the listener's owner decides first, HA-2 named),
  and the guide's note scoped HA-1 and HA-2 to a computer with several accounts (they hold on every computer; HA-3 on
  a shared one). W4 to W8 folded: the positive landing check, a claim rewritten with every instance's ports, the
  Windows folder's report (once for a missing folder or another ACL, in the health report or log), SCN-056's recovery
  for a root or system listener, and "same computer" in the RFC 6265 row. Unit passed (156 mutants, 4 survivors, the
  shape checks moved after the link or the mode; W10 adds four vectors in which a fault outranks every reason for no
  label, and each such move now fails `test/host-label.test.ts`; W11 defines `writableByOthers` as anyone but the
  platform's administrator in the reference, the vectors' about, `devices.md` and DEC item 4). Seam passed (0 breaks,
  the full suite of 10520 tests green; risks closed by W3, W4, W12: the claim's rewrite at start rebuilt from the
  account's descriptors, atomic and after `service.lock`, in HA-1, the Lifecycle table and CT-228; and W13: SHOULD in
  the conformance row). W14, from DEC-0149's seam reading: `foreign` is unavailable too (a watcher counts `foreign`
  and `foreign-user` as unavailable, as node summaries and connections already report both as `down`), in HA-2, DEC
  item 2, the owed Fabric Dashboards row and the landing target.
- Round 6 at `d47295d5`: not clean. Unit passed (65 of 67 mutants killed; the rest closed by W15, two vectors in which
  a flag that is not a boolean is a fault before the link and the owner). Product failed on W16 (PL-3's owner check
  unknown to ST-036, FLW-30, SCN-044 and FL-7) and W17 (the claim's rebuild had no source for an app without a
  descriptor origin or an app's part). Seam failed on the same break as W17 (no `service.lock` for such an app: its
  own single-copy guard instead); the full suite of 10524 tests was green at `d47295d5`. W18 to W26 folded: the landing
  phrase on one line and its two-sentence target with a negative check, "missing or with another ACL" in G1, who
  moves a port in the rotation trigger, only the service itself rewrites the claim (never what starts it), the
  uninstall rebuilds the claim from what remains, `writableByOthers` and `folderOk` as writable by anyone but the
  platform's administrator, the fault's scope, and the relay and conformance check dropped.
- Round 7 at `8a9373a1`: not clean. Product failed on W27 (the negative landing check could never fail: inside
  double quotes the shell ran `down` and `foreign` as commands; both checks are now in a fenced block, the negative
  one with `grep -cF` and escaped backticks, and both were run on trial files) and W28 (the uninstall still read as
  removing an instance's ports in `conformance.md`, the spec's G1, this handoff and `service.md`; it now rebuilds the
  claim from what remains). W29 to W33 folded: DEC-0149's sentence kept whole at landing, the installer's order
  (descriptor, then the claim rebuilt from all descriptors, the short window accepted), the Fabric Dashboards ask for
  its card's line, FLW-30's traces, the account count read by the service, an installer and a door only.
- Round 7's seam reading: failed on the same break as W27, closed at `c77e67f5`. W34 to W37 folded: an app rebuilds
  its claim after writing its new liveness file, and the guard and the source share the wording "an app without a
  descriptor origin, or an app's part"; SCR-30 shows the `foreign-user` line when no card exists (FLW-30 points to it);
  a round-4 vector's later name; DEC-0154 may land first.
- The two UI lines of `foreign-user` ("Another account on this computer is using this service's port; nothing was
  sent to it." and "This computer would not say who is using this service's port; nothing was sent to it.") passed
  the operator's copy check (en-US, register ui), report `967586eb-8376-458f-a086-744c9c21b576`, 0 findings.

## Decisions made in the draft

- No rule code: every new duty is a run-time check of the operating system (who owns a socket, who owns a file) or a
  product's own test; the host label has a reference and vectors, and its shape is the schema's pattern.
- The state order is written in `service.md` because the contract had none; Fabric Dashboards' three cases are cited
  as it reported them, and the contract's own vector file is CT-229.
- The claim file's shape is stated in prose with an example; its schema, and a reference for the port choice, are
  owed under CT-228. The claim's `<account>` is the numeric uid (macOS, Linux) or the SID (Windows), never the login
  name, and the ignore rule compares the file's owner uid (owner SID) with it.
- `device.hostLabel` sits in the request's closed `device` object, so a server pinned before refuses it at its schema
  (as DEC-0094's `file`); a node sends it only once the policy member of CT-239 turns it on.
- Fabric Inbox's row is the coordinator's corrected wording of 2026-11-06 (its PR #421).

## Merge notes, per sibling branch

- CT-227 (`agent/ct219-receipt-20261106`), which lands first so this branch's hosted run is not red for its reason:
  the backlog tail reads CT-227 then CT-228 to CT-241; the handoffs README stays newest first, DEC-0154's row above
  DEC-0153's. Done: main `1c141418` (PR #245) is merged into this branch.
- DEC-0149 (`agent/ct194-source-manifest-v2-20261104`): its landing backlog rows take ids above the highest on
  main and on open branches (DEC-0149 already holds CT-244), re-measured at landing; the DECISIONS tail in id order; the next-free markers re-read
  from `refs/agent-sync/ids` at landing; the backlog tail in id order; the handoffs README newest first;
  `vitest.config.ts`'s coverage `include` is the union (`src/host-label.ts` and `src/validator.ts` both); the watcher
  sentence in `service.md`: DEC-0149 rewrites it (its `service.md` line 222), and whichever of DEC-0149 and DEC-0154
  lands second makes it read as follows. Only the subject and the list of states in DEC-0149's first sentence change;
  every other part of DEC-0149's sentence stays where it is ("once per case, and says it is back after 15 minutes
  well; a `degraded` answer opens no message, so setup entries are left out (FD-76, ADR-0010 ...); a watcher MUST NOT
  message the operator for an entry with `setup: true`"), and a second sentence follows them: "A watcher messages the
  operator only when an agent has been unavailable (`down`, `foreign` or `foreign-user`, not merely `degraded`) for
  more than 15 minutes, ... . Fabric Dashboards' watcher does so for `down` since FD-76 (0.7.15, `ebffd16`); counting
  `foreign` and `foreign-user` is owed (DEC-0154)." The target phrase stands on one line, without a line break, or
  the check counts 0. After both land, the first command prints 1 and the second prints 0 (the released watcher
  reports only `down`):

  ```sh
  grep -c 'unavailable (`down`, `foreign` or `foreign-user`, not merely `degraded`)' docs/specification/service.md
  grep -cF "Fabric Dashboards' watcher messages the operator only when an agent has been unavailable (\`down\`, \`foreign\`" docs/specification/service.md
  ```

  Both were run on trial files before they were written here: the first prints 1 on a file holding the target phrase
  on one line; the second prints 1 on a file holding the forbidden sentence and 0 on one holding the target. DEC-0149 points `relay.md` and `conformance.md` to
  `service.md`'s definition of "unavailable", so one edit in `service.md` suffices; when DEC-0149 lands, CT-232 cites its sentence on an OS account an
  organization owns whole (on DEC-0149's branch, `source.md` and `contexts.md`; not cited before it lands). This is a
  landing edit made by whichever of DEC-0149 and DEC-0154 lands second; after both, `grep '^| CT-232 ' docs/backlog.md |
  grep -c source.md` prints 1.
- DEC-0154 may land first. Then, until DEC-0149 lands, main keeps the old watcher sentence (`degraded`, 5 minutes)
  beside HA-2. That sentence was false before DEC-0154 and is closed by DEC-0149's landing; the first lander makes no
  separate edit for it.
- DEC-0151 and DEC-0152: the same register rules (DECISIONS tail in id order, markers from the counters, backlog in id
  order, handoffs newest first).

## Acceptance step

At acceptance: set the Status, rewrite this handoff's row in the README, and in `docs/specification/README.md` name
the owed adopters on the devices row (Project Observatory's node and setup step, the first organization server) and
the services row (Fabric, Fabric Dashboards, Switchboard, Fabric Inbox, the adapter's kits, the PassionCode launcher,
Project Observatory); tell thread `1fe66e6e` the same day (Fabric Dashboards' FD-159 and Fabric's server build on it),
and in that message ask Fabric Dashboards for a row that its watcher (FD-76's successor) counts `foreign` and
`foreign-user` as unavailable: FD-76 opens an episode only for `down`, and FD-158 added the state to the card only.
Ask in the same message that its card's own `foreign-user` line (its `i18n.ts:128`, its own wording today) use this
decision's two lines or be checked against them, and that a line for an owner that cannot be told be added (part of
FD-159).

## Open

- The coordinator's next blind readings of DEC-0154.
- CT-228's owed parts: the claim file's schema and a port-choice reference with vectors.
- CT-229 to CT-241, each with its evidence and acceptance in the backlog; G10 is a decision of the second wave.

## Checks actually run

The full gate `pnpm run check` after round 6's batch (W15 to W26), at this branch's head, under the heavy lock
(free disk 8 GB, 15-minute load 38.1): exit 0, 111 test files, 10526 tests passed and 1 skipped, branches 98.92% (12567 of
12703), 31 vector files matching their generators, the UX lint passed (40 stories, 34 flows, 34 screens, 55
scenarios), documentation checks passed, markdownlint 0 errors, privacy 0 findings; no em dash on an added line. After
rounds 4 and 5's first batch the gate did not run (7 GB free); targeted checks ran then. W10's mutants (each of the
platform, owner-name and `org.id` checks moved after the link check or after the mode check, six moves) each fail
`test/host-label.test.ts` and were reverted; W15's mutants (the flags' type check moved after the link check or
after the owner check) each fail it too; V14's mutant (the hex check before the mode check) fails it too.

After round 7's batch the full gate did not run (4 GB free, a 15-minute load of 48); `pnpm typecheck`,
`pnpm vectors:check`, `pnpm run docs:check`, `python3 docs/ux/lint.py`, `pnpm privacy:check` (0 findings), the em dash
check (0) and the targeted vitest set (1242 tests) ran with exit 0.
After the seam batch of round 7 (W34 to W37), on the coordinator's instruction no full gate ran (low disk);
`pnpm typecheck`, `pnpm vectors:check`, `pnpm run docs:check`, `python3 docs/ux/lint.py`, `pnpm privacy:check` (0
findings), the em dash check (0) and `pnpm vitest run` over `test/docs-check.test.ts`, `test/consistency.test.ts`,
`test/host-label.test.ts` and `test/fixtures.test.ts` (1198 tests) ran with exit 0.

## Next task

The coordinator's next blind readings of DEC-0154 at this branch's head.
