# 2026-11-06: several OS accounts on one host (CT-228, DEC-0154, proposed)

## Objective

Answer the operator's request of 2026-11-05, relayed on board thread `1fe66e6e`: read the organization's plan for a
shared host on which several OS accounts work, compare it with the contract, write a spec per gap, file the rows and
close them in waves. This run drafts the first wave's decision (G1 to G3 and the host label the board agreed) as a
Proposed DEC on its own branch, and files the rest.

## Done

- [DEC-0154](../DECISIONS.md), Status Proposed: counted OS accounts (who counts, read at every start); HA-1 (a port
  recorded per counted account, chosen free on the host, with a claim `.passioncode-ports.<service-id>.<account>.json`
  naming the account by uid or SID, written at the next start when missing, removed at uninstall, granting nothing);
  HA-2 (the listener's owner checked before any credential and before "healthy", the host state `foreign-user` ordered
  before `foreign`, who checks when the client cannot, a server's refusal of another account's peer, rotation, the
  PKCE loopback redirect, the browser-cookie residue); HA-3 (no token-free loopback door on a host with several counted
  accounts; forwarders are relays; the single-account gap accepted, CT-238); HA-4 (each counted account and each
  virtual machine is its own device; `device.hostLabel`, its secret kept out of backups, its read rule failing closed,
  sent only once a policy member turns it on, CT-239).
- [service.md](../specification/service.md#several-os-accounts-on-one-host): the new section, the port claim's
  pointer, `FAC-SEM-009`'s neighbour, the threat model and the cookie residue, the trust anchor, the Install and
  Uninstall rows. [delegation.md](../specification/delegation.md#trust-tiers): the header, DL-25's T0 row, the relay
  paragraph and the accepted gap. [devices.md](../specification/devices.md#the-host-label): the device definition, the
  host label, UE's linkable list. [contexts.md](../specification/contexts.md): `org.id` with 128 random bits where the
  label is on. [node-summary.md](../specification/node-summary.md): a `foreign` or `foreign-user` service reported
  `down`. [conformance.md](../specification/conformance.md): the reference module's row and eight rows (installer,
  client, host-state reader, receiving surface, host handing a credential, token-free door, node, setup step).
- The host label's reference `src/host-label.ts` (`hostLabel`: link, owner per platform, mode, size), its generator
  `tools/vectors/host-label.ts` (Node's own HMAC, not importing the reference), vectors
  `fixtures/vectors/host-label.json` (33 cases), `test/host-label.test.ts` (which also holds `ORG_ID` equal to the
  schema's `opaqueId`), a coverage floor of 100 in `vitest.config.ts`; the optional schema member `device.hostLabel` in
  `schemas/device-enrollment.schema.json` with a positive and a negative fixture; `service.id`'s description in
  `schemas/service-well-known.schema.json`.
- `CONTEXT.md`: Device redefined; Counted OS account, Port claim, `foreign-user` and Host label added; Trust tier
  narrowed. UX: SCN-056 in `docs/ux/scenarios.md`, SCR-20's `foreign-user` state in `docs/ux/screens.md`, FLW-17's
  screens in `docs/ux/flows.md`. RFC 8252's row in `docs/evidence/sources.md`, and RFC 6265's existing row read again (its section 8.5 was already pinned for DEC-0059).
- The gap list as a tracked spec: [2026-11-06-studio-spaces-gaps.md](../evidence/specs/2026-11-06-studio-spaces-gaps.md),
  the shared host's accounts by role only.
- Backlog CT-228 (the DEC) and CT-229 to CT-241 (the state-order vector file, G4 to G11, the single-account forwarder
  gap, the policy member, the fixture catalogue, the organization's display).
- Ids: DEC-0154 reserved by compare-and-swap on origin (key `studio-ports-owner-20261106`); no rule code reserved.
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
  DEC-0153's.
- DEC-0149 (`agent/ct194-source-manifest-v2-20261104`): the DECISIONS tail in id order; the next-free markers re-read
  from `refs/agent-sync/ids` at landing; the backlog tail in id order; the handoffs README newest first;
  `vitest.config.ts`'s coverage `include` is the union (`src/host-label.ts` and `src/validator.ts` both); the watcher
  sentence in `service.md`: DEC-0149 rewrites it to "only when an agent has been unavailable (down, not merely
  degraded) for more than 15 minutes", and whichever of DEC-0149 and DEC-0154 lands second makes it read "unavailable
  (down or foreign-user, not merely degraded)"; CT-232 cites DEC-0149's `source.md` sentence on an OS account an
  organization owns whole.
- DEC-0151 and DEC-0152: the same register rules (DECISIONS tail in id order, markers from the counters, backlog in id
  order, handoffs newest first).

## Acceptance step

At acceptance: set the Status, rewrite this handoff's row in the README, and in `docs/specification/README.md` name
the owed adopters on the devices row (Project Observatory's node and setup step, the first organization server) and
the services row (Fabric, Fabric Dashboards, Switchboard, Fabric Inbox, the adapter's kits, the PassionCode launcher,
Project Observatory); tell thread `1fe66e6e` the same day (Fabric Dashboards' FD-159 and Fabric's server build on it).

## Open

- The coordinator's next blind readings of DEC-0154.
- CT-228's owed parts: the claim file's schema and a port-choice reference with vectors.
- CT-229 to CT-241, each with its evidence and acceptance in the backlog; G10 is a decision of the second wave.

## Checks actually run

On this branch's head before the push: `pnpm typecheck`, `pnpm vectors:check`, the touched tests, `pnpm run
docs:check`, `python3 docs/ux/lint.py`, `pnpm privacy:check`, the em dash check on the added lines and the full gate
`pnpm run check`, each with exit 0. The gate after round 1's batch: 111 test files, 10512 tests passed and 1 skipped,
branches 98.92% (12567 of 12703), 31 vector files matching their generators, the UX lint passed (40 stories, 34
flows, 34 screens, 55 scenarios), documentation checks passed, markdownlint 0 errors, privacy 0 findings; no em dash on
an added line.

## Next task

The coordinator's next blind readings of DEC-0154 at this branch's head.
