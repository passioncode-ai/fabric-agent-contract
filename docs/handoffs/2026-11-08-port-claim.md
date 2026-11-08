# 2026-11-08: the port claim's schema and the port-choice reference (CT-228, DEC-0160)

## Objective

Deliver what DEC-0154's HA-1 left owed in CT-228: a schema for the claim file `passioncode-port-claim/1`, a reference
for the port choice with vectors, and the wording and place of the line a service writes when the Windows claims folder
is missing or has another ACL. Fabric (CO-513, the hub port per account), Switchboard (SB-278) and Fabric Dashboards
(FD-159) wait on it (board threads `d5abc880` and `1fe66e6e`).

## Done

- [DEC-0160](../DECISIONS.md) (Proposed 2026-11-08) on branch `agent/ct228-port-claim-20261108`.
- [`schemas/port-claim.schema.json`](../../schemas/port-claim.schema.json): the closed claim, `service` the
  descriptor's `serviceId` or a reverse-DNS bundle identifier (with `.<part>`), `account` a uid or a SID, `ports` 1 to 64
  unique ports, `updatedAt` interop-common's `utcInstant`. Fixtures: three positive, ten negative
  (`fixtures/positive/port-claim-*.json`, `fixtures/negative/port-claim-*.json`) in the catalogue.
- [`src/port-claim.ts`](../../src/port-claim.ts): `readClaims`, `choosePort`, `rebuildClaim`, `claimFileName`,
  `isPortClaim`; branch coverage floor 100 in `vitest.config.ts`.
- [`fixtures/vectors/port-claim.json`](../../fixtures/vectors/port-claim.json) written by
  `tools/vectors/port-claim.ts` (registered in `tools/vectors/run.ts`): at round 1, 3 file-name, 24 read, 34 choose and
  11 rebuild cases, 72 in all (86 after its fold); `test/port-claim.test.ts` runs them and the generator's check.
- [service](../specification/service.md#ha-1) HA-1: the schema in the Content row, an example the guide test validates,
  a bullet naming the reference and the holder order, the squatted path reading, and the Windows folder line (the
  `degraded` entry `port-claims-folder`, `setup: true`, or one log line).
- [Conformance](../specification/conformance.md): a reference row for `src/port-claim.ts`; the installer row points
  at the test, the reference, the vectors and the schema. DOCMAP and CONTEXT rows; `passioncode-port-claim/1` in
  `PROTOCOL_REVISIONS`; the schema count 152; the schema on `NOT_SWEPT` (no rule kind); the guide test counts three
  examples in service.md. Backlog CT-228: open, blind readings next.

## Round 1 of the blind readings (2026-11-08), folded

Unit pass (6 risks), seam fail (1 break, 6 risks), product fail (2 breaks, 4 risks), at `2c045332`. Each finding and
what was done:

- Break (seam, product): HA-1 called the Windows folder line "never as interface text" yet made it a setup entry, which
  a host shows to a person by rule (DEC-0044). Folded as option (a): the entry stays (`setup: true`) and is
  person-facing; the words were struck in HA-1, DEC-0160 item 4 and the CT-228 row; a host shows it as a setup wait.
- Break (product): the reason did not say who acts. It is now "An administrator of this computer runs the Fabric setup
  step, which creates %ProgramData%\PassionCode\port-claims with its access list. Until then this service records its
  port without a claim." (193 characters), the same in HA-1 and DEC-0160 item 4; a deterministic text-rule check (no
  model, en-US, interface register) gave report `59db5f2c-21c2-441b-b1b4-00eba28d29b4`, no finding, no patch.
- The folder entry's JSON block: the guide-examples marker takes a whole schema file only, so `test/port-claim.test.ts`
  validates the block against `service-well-known.schema.json#/properties/degraded/items` and checks that DEC-0160
  carries the same reason.
- "Once, not at every start" now binds the log line only (remembered in the service's own state); the health entry is
  kept at every start while the state lasts.
- The lasting `degraded` state on a Windows computer without the setup step, and a kit-only install (no Fabric node,
  no step), are named in HA-1 and in DEC-0160's Consequences; a Fabric node's first installation is the only install
  that runs the step today.
- A contract scenario for the setup wait: SCN-060 (next free on `origin/main` and every `origin/agent/*` branch, whose
  highest is SCN-059), traced to ST-021 and FLW-17, mapped to SCR-20; `docs/ux/lint.py` passes with 57 scenarios.
- The author's guide: one sentence in HA-1's paragraph of `docs/guides/connecting-compatible-agents.md`.
- Unit risk 1, the "wildcard bind" vector: renamed for what it tests (two listeners of another account), the smaller
  change; a listener has no address member, and the caller lists a wildcard bind among the listeners (DEC-0160 item 2).
- Unit risk 2: `rebuildClaim` answers `{fault: "claim-invalid"}` instead of an invalid claim; vectors for 65 ports,
  port 0, a login-name account and a `now` with an offset; the 64-port bound is stated in HA-1's Content row. This also
  settles the item this file left open before round 1 (more than 64 ports).
- Unit risk 3: HA-1's Content row says `updatedAt` is `utcInstant`: `Z`, at most three fraction digits.
- Unit risk 5: HA-1's "A reader ignores" bullet names all four reasons, the first two as DEC-0160's readings.
- Unit risk 6: the `recorded` doc comment says that under a squatted path the claim is not a source; DEC-0160's Status
  names the squatted sentence among its readings and counts three added rules.
- Seam: `SERVICE_ID` and `UTC_INSTANT` are pinned to `service-common`'s `serviceId` and `interop-common`'s
  `utcInstant` patterns in the test.
- Seam: the file name bound, rule (c): `service` at most 130 characters, `account` at most 100, so the file name stays at
  or under 255 bytes; vectors for the longest pair (a 255-byte name, the claim kept) and one character more on each side
  (`claim-invalid`), and a test that the bounds add up to 255.
- Seam: the adoption note in DEC-0160's Compatibility names the `utcInstant` form and points Python writers at the
  adapter's `fabric_time` helper.
- Seam: the squatted reading stays literal; the alternative is in Open below.
- Switchboard (SB-278, thread `50a7ece3`): an HA-1 example sentence in the File row (one part per data folder, a stable
  hash of the canonical folder path, `ai.passioncode.fabric-switchboard.proxy-<8 hex digits>`), with vectors: two parts
  in one account avoid each other's ports, and rebuilding one part never touches the other's claim.

## Round 2 of the blind readings (2026-11-08), unit only, folded

The unit reading of `cd265ab2` failed with two breaks; seam and product were not run on that head, since both breaks
were plain contradictions in the text.

- Break: the installer row in `docs/specification/conformance.md` applied "once" to the health entry. It now keeps the
  `port-claims-folder` entry at every start while the state lasts, and "once ... remembered in its own state" binds the
  log line only, as HA-1 and DEC-0160 item 4 say.
- Break: the index row in `docs/handoffs/README.md` said round 1 was next. It now says round 1 is folded and round 2
  next; this fold moves it to round 3.

- Risk folded: the installer row names all four ignore reasons (`readClaims`), as the reference row and HA-1 do.
- Risk folded: the guide sentence says the setup step creates the folder "with its access list".
- Risk folded: SCN-060's recovery no longer says the setup step resets an existing folder's access list; an
  administrator restores the access list the step sets (HA-1).
- To Open: what a caller does with the claim file on disk when `rebuildClaim` answers `claim-invalid`; the file-name
  vectors share `claimFileName`'s template, so only the 255-byte length adds information.

## Open

- Round 2 of the coordinator's blind readings (unit, seam, product) at the new head, until two consecutive rounds are
  clean; then merge, a release tag, an Annotated line on DEC-0154, and the board threads told.
- Board line for thread `1fe66e6e` (the hosts, Fabric Dashboards FD-159 and Fabric), to send with the acceptance: the
  `port-claims-folder` setup entry is person-facing and needs an administrator of that computer, not the coding-agent
  setup path ("Set up with coding agent" runs as an ordinary account and cannot create the folder or set its ACL); a
  host offers the administrator's step instead, and shows the service's English reason as the service wrote it.
- Board line for thread `50a7ece3` (Switchboard): the parts-per-data-folder example and its vectors are in DEC-0160.
- The squatted reading's alternative (seam, round 1): under a squatted path, keep reading other accounts'
  owner-checked claims, which a squatter cannot forge, and ignore only this account's own; SB-278's plan reads that way.
  DEC-0160 keeps the literal reading of HA-1 ("by the listener and descriptor tests alone"); changing it is a decision
  for a later round or a later DEC.
- A host that shows the reason inside a localized interface shows it in English; translating a service's reason is the
  host's matter, not settled here.
- After merge, the consumers adopt at their next pin and run the vectors: Fabric CO-513, Switchboard SB-278, Fabric
  Dashboards FD-159.

## Decisions

The brief left the readings of HA-1 below open; DEC-0160 records each as a reading, not a new rule:

- A squatted claim path: no claim is read at all, this account's or any other; the answer carries `claim-path-squatted`
  (HA-1: "by the listener and descriptor tests alone").
- With the instance's own listener holding the recorded port, only another `id.instance`'s descriptor moves it; without
  it, any listener on the port, of any account and a wildcard bind included, holds it.
- This service's own claim in this account names no holder; another instance of the same service is held by its
  descriptor. A candidate named only by this service's own claim is free.
- The descriptors a choice reads carry their service id, so another `id.instance` can be told.
- An invalid content and a file name that is not the content's are ignored with a note, like an owner mismatch; the
  notes' order (invalid, name, owner, absent) is the reference's.
- The folder line is a setup entry (`setup: true`): it waits for the administrator, not an outage; `source` carries the
  code `port-claims-folder`, since the degraded entry has no `code` member.
- A `no-free-port` fault keeps the squatted note. No semantic rule (ports sorted is not HA-1's), so no FAC-SEM id was
  reserved.

## Checks actually run

At the branch's commit, each once (the machine was loaded):

- `pnpm typecheck`: exit 0.
- `pnpm vitest run test/port-claim.test.ts` with coverage of `src/port-claim.ts`: 78 passed, branches 100% (70/70)
  after one refactor (the first run measured 98.64%, one branch of the descriptor test, folded into `declared`).
- `pnpm vitest run` over `test/port-claim`, `schema-compilation`, `positive-sweep`, `fixtures`, `protocol-revisions`,
  `consistency`, `vectors-runner`, `guide-examples`, `docs-check`, `schema-closure`, `semantic-kinds`, `validate-cli`:
  3536 passed, 2 failed: `guide-examples` (it counted two examples in service.md; now three, rerun 36 passed) and one
  `validate-cli` source-walk test timed out at 5000 ms under load (`git init` in a temporary folder; not touched here,
  not rerun).
- `pnpm vectors:check`: "33 vector files match their generators".
- `pnpm --silent validate` on the 13 fixtures: the three positive exit 0; the ten negative exit 1 with the catalogued
  keyword, two of them (`no-updated-at`, `other-revision`) with `--schema port-claim`, since without a matching
  discriminator the schema cannot be inferred (exit 2, a usage error, as designed).
- `pnpm run docs:check`: "Documentation checks passed", markdownlint over 271 tracked Markdown files "0 error(s)",
  exit 0.
- `python3 docs/ux/lint.py`: "UX lint passed: 40 stories, 34 flows, 34 screens, 56 scenarios".
- `pnpm run privacy:check`: "0 finding(s)".
- The em-dash count of the added lines against `origin/main`: 0.
- `git merge-tree --write-tree HEAD origin/main` at the commit: exit 0, no conflict (`origin/main` at `0fcb5d97`).

## Checks actually run after the round 1 fold

At the fold's working tree, each once unless said:

- `pnpm typecheck`: exit 0.
- `pnpm vitest run --coverage test/port-claim.test.ts`: 93 passed; no floor error for `src/port-claim.ts` (100%
  branches held); the other files' floor errors are the single-file run's (run twice: the first run's output was not
  kept).
- `pnpm vitest run test/port-claim.test.ts test/guide-examples.test.ts test/schema-compilation.test.ts
  test/consistency.test.ts`: 4 files, 160 passed.
- `pnpm vectors:check`: "33 vector files match their generators"; the port-claim file holds 6 file-name, 27 read,
  36 choose and 17 rebuild cases, 86 in all.
- `pnpm --silent validate`: the three positive fixtures exit 0; the ten negative, with `--schema port-claim`, exit 1
  with their catalogued keyword (`service-path` reports the pattern under its `anyOf`).
- `python3 docs/ux/lint.py`: "UX lint passed: 40 stories, 34 flows, 34 screens, 57 scenarios".
- `pnpm run privacy:check`: first 3 findings (the text-rule service's product name in DECISIONS and backlog, a private
  name), reworded, then "0 finding(s)".
- `pnpm run docs:check`, the em-dash count of the added lines and `git merge-tree --write-tree HEAD origin/main`: in
  the commit's record below the round 1 entry's commit.

## Next task

Round 3 of the blind readings of DEC-0160 (unit, seam, product) at the branch's head, then fold what they find.
