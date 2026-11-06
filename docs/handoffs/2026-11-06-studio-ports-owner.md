# 2026-11-06: several OS accounts on one host (CT-228, DEC-0154, proposed)

## Objective

Answer the operator's request of 2026-11-05, relayed on board thread `1fe66e6e`: read the organization's plan for a
shared host on which several OS accounts work, compare it with the contract, write a spec per gap, file the rows and
close them in waves. This run drafts the first wave's decision (G1 to G3 and the host label the board agreed) as a
Proposed DEC on its own branch, and files the rest.

## Done

- [DEC-0154](../DECISIONS.md), Status Proposed: HA-1 (a port recorded per OS account, chosen free on the host, with a
  claim `.passioncode-ports.<service-id>.<account>.json` in the host's shared sticky folder that grants nothing), HA-2
  (the listener's owner checked before any credential and before "healthy", the host state `foreign-user` ordered
  before `foreign`, a server's refusal of another account's peer, rotation, the PKCE loopback redirect), HA-3 (no
  token-free loopback door on a host with several accounts; forwarders are relays) and HA-4 (each OS account and each
  virtual machine is its own device; `device.hostLabel`).
- [service.md](../specification/service.md#several-os-accounts-on-one-host): the new section, the port claim's
  pointer, `FAC-SEM-009`'s neighbour, the threat model and the trust anchor.
  [delegation.md](../specification/delegation.md#trust-tiers): DL-25's T0 row and the relay paragraph.
  [devices.md](../specification/devices.md#the-host-label): the device sentence, the host label, UE's linkable list.
  [conformance.md](../specification/conformance.md): the reference module's row and five client and reader rows.
- The host label's reference `src/host-label.ts` (`hostLabel`), its generator `tools/vectors/host-label.ts` (Node's own
  HMAC, not importing the reference), vectors `fixtures/vectors/host-label.json` (21 cases), `test/host-label.test.ts`,
  a coverage floor of 100 in `vitest.config.ts`; the optional schema member `device.hostLabel` in
  `schemas/device-enrollment.schema.json` with a positive and a negative fixture.
- The gap list as a tracked spec: [2026-11-06-studio-spaces-gaps.md](../evidence/specs/2026-11-06-studio-spaces-gaps.md).
- Backlog CT-228 (the DEC) and CT-229 to CT-237 (the state-order vector file, G4, G5, G6, G7, G8, G9, G10, G11).
- Ids: DEC-0154 reserved by compare-and-swap on origin (key `studio-ports-owner-20261106`); no rule code reserved.
  `DECISIONS.md`'s marker reads `DEC-0155`, `conformance.md`'s stays `FAC-SEM-169`, equal to the counters.

## Decisions made in the draft

- No rule code: every new duty is a run-time check of the operating system (who owns a socket) or a product's own
  test; the host label has a reference and vectors, and its shape is the schema's pattern.
- The state order is written in `service.md` because the contract had none: `down`, `foreign-user`, `foreign`, then
  the well-known `status`; a reader treats a state it does not know as not ready. Fabric Dashboards' three cases are
  described there; the contract's own vector file is CT-229, since the repository had no state vector file.
- The claim file's shape is stated in prose with an example; its schema, and a reference for the port choice, are
  owed under CT-228.
- `device.hostLabel` sits in the request's closed `device` object, so a server pinned before refuses it at its schema
  (as DEC-0094's `file`); a node sends it only to an organization that turned it on.
- Fabric Inbox's row is the coordinator's corrected wording of 2026-11-06 (its PR #421).
- The claim's `<account>` is the numeric uid on macOS and Linux and the SID on Windows, never the login name, and
  the ignore rule compares the file's owner uid (owner SID) with it (the coordinator's correction of 2026-11-06).

## Open

- The coordinator's blind readings of DEC-0154 (unit, seam, product); acceptance, then the thread `1fe66e6e` told the
  same day (Fabric Dashboards' FD-159 and Fabric's server build on it).
- CT-228's owed parts: the claim file's schema and a port-choice reference with vectors.
- CT-229 to CT-237, each with its evidence and acceptance in the backlog; G10 is a decision of the second wave.

## Checks actually run

On this branch's head before the push: `pnpm typecheck`, `pnpm vectors:check`, `pnpm vitest run` over the touched
tests, `pnpm run docs:check`, `python3 docs/ux/lint.py`, `pnpm privacy:check`, the em dash check on the added lines and
the full gate `pnpm run check`, each with exit 0. The gate on 2026-11-06: 111 test files, 10499 tests passed and 1
skipped, branches 98.92% (12552 of 12688), 31 vector files matching their generators, the UX lint passed (40 stories,
34 flows, 34 screens, 54 scenarios), documentation checks passed, markdownlint 0 errors, privacy 0 findings; no em dash
on an added line. A first gate run failed one test (`test/sources-ledger.test.ts`: RFC 8252 had no ledger row), fixed
by its row in `docs/evidence/sources.md`.

## Next task

The coordinator's blind readings of DEC-0154 at this branch's head.
