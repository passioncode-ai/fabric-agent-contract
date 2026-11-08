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
  `tools/vectors/port-claim.ts` (registered in `tools/vectors/run.ts`): 3 file-name, 24 read, 34 choose and 11 rebuild
  cases, 72 in all; `test/port-claim.test.ts` runs them and the generator's check.
- [service](../specification/service.md#ha-1) HA-1: the schema in the Content row, an example the guide test validates,
  a bullet naming the reference and the holder order, the squatted path reading, and the Windows folder line (the
  `degraded` entry `port-claims-folder`, `setup: true`, or one log line).
- [Conformance](../specification/conformance.md): a reference row for `src/port-claim.ts`; the installer row points
  at the test, the reference, the vectors and the schema. DOCMAP and CONTEXT rows; `passioncode-port-claim/1` in
  `PROTOCOL_REVISIONS`; the schema count 152; the schema on `NOT_SWEPT` (no rule kind); the guide test counts three
  examples in service.md. Backlog CT-228: open, blind readings next.

## Open

- The coordinator's blind readings (unit, seam, product) until two consecutive rounds are clean; then merge, a release
  tag, an Annotated line on DEC-0154, and the board threads `d5abc880` and `1fe66e6e` told.
- After merge, the consumers adopt at their next pin and run the vectors: Fabric CO-513, Switchboard SB-278, Fabric
  Dashboards FD-159.
- Not decided here: `rebuildClaim` gives more than 64 ports for a service with more than 64 instances in one account,
  which the schema refuses; no product records that many today. A reader of round 1 may name it.

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

## Next task

Round 1 of the blind readings of DEC-0160 (unit, seam, product) at the branch's head, then fold what they find.
