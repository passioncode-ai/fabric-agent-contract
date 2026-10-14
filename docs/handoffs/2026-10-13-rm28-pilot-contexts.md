# Handoff — DEC-0082: contexts for the RM-28 pilot (2026-10-13, fix rounds 2026-10-14)

## Objective

RM-28's pilot puts one person, their personal context and two organizations on one machine, and shares the person's
own agents into both organizations as separate instances with different access levels. The contract could not record
that: `FAC-SEM-074` allowed one placement of an agent per machine, a grant named no context, and no activity event
carried a grant's usage to the organization server. This run implements the owner's answer to the pilot request (the
§4 row "fabric-agent-contract" of fabric-workspace `b7ac2188`, `docs/reports/2026-10-12-org-contexts/pilot-2026-10-13.md`),
the owner's correction of that answer's §4 item (5) (`grant.usage`), and the owner's decisions on the three independent
readings of PR #107 and on the re-verification of its fix round, as DEC-0082 (board row CT-51).

## Done

- A home for contexts: [`docs/specification/contexts.md`](../specification/contexts.md), linked from README, DOCMAP,
  CONTEXT (*Context*) and conformance. The grant, the estate record, the collector's routing and Switchboard compare the
  context id, so it has one page rather than a section in one of them.
- The context id `common.schema.json#/$defs/contextId`: `personal` or `org:<orgId>`, `orgId` `[A-Za-z0-9][A-Za-z0-9_-]{0,127}` (1–128 characters),
  compared as written; the pattern is the part of an enrollment's `org.id` set a context can name. An organization server
  that takes part in contexts issues `org.id` within that pattern (devices.md);
  the vectors show an enrolled `org.example` cannot be routed. The first organization server's `org_<base32>` is marked
  informative, at its commit `03d454b`.
- The grant's optional `context`; `FAC-SEM-110` (kinds `grant` and `estate-record`): an external principal's grant is
  never `personal`. Access levels are the grant's own fields; no new field.
- One instance per context: `FAC-SEM-074` per (machine, `agentRef`, context); `FAC-SEM-075` per (machine, `agentRef`,
  slot, context), and an organization's slot is filled from its own machine; `FAC-SEM-111` (an organization's instance
  under a share grant of the record for that context, matched by normal form, not revoked; a malformed context fails
  closed, `parseContext`); `placementTrust` and `estate-placement` take the context, default `personal`. `FAC-SEM-111`
  reads revisions only; the revocation delta stops calls at the hub and the meter at once.
- Secret envelopes name no context: `estateEnvelopeContext` and relay.md's open step 6 read personal secret placements
  only, so the sealer, the current placement and the marks no longer depend on array order; an organization's slot never
  admits an envelope. The `placement` group of `fixtures/vectors/secret-envelope.json` (written by
  `tools/vectors/relay-crypto.ts`, run by `placementVectorResults`) lists an organization's placement first.
- Three routes, no context on the wire: check-ins per enrollment, to its own server on its interval with only its
  streams; a session's events by `routeTarget`; `grant.usage` by `routeGrantUsage` (the grant's own context). Shared
  vectors `fixtures/vectors/context-route.json` (written by `tools/vectors/context-route.ts`).
- `grant.usage`: one grant's daily usage keyed by `grantId` (the grant's `meta.id`, no `#`, normal form). `calls` and
  `unpricedCalls` count calls, from the meter's settled receipts, each counted once on the UTC day of its `allowed`
  answer's `checkedAt`; a service's `byGrant` row only when it lists `receipts` the meter holds none of and its report's
  `days` hold one date;
  `FAC-SEM-038` and `FAC-SEM-039` extended (one per stream, day and normal form of `grantId` in a batch); a receiver
  counts the first and ignores later ones (conformance row). The old-receiver condition is `extScalar`'s string branch,
  spelled out and tested.
- Membership: only the certificate follows it by itself; Fabric's share flow bounds the share grant's `expiresAt` by the
  membership's expiry.
- Linkability: the slice does not meet CX-22; every check-in `records` member and the estate digest are identical across
  the two organizations; running the pilot linkable waits on Fabric's recorded decision (the pilot report's K-1,
  fabric-workspace #215, both open); Project Observatory's per-organization device identity plan is the open divergence.
- Rule code no longer throws on a `{"toString": 1}` member, for every rule kind of the register: input text goes through
  `show` and `toNumber` (`src/findings.ts`) in every rule module, and test/rule-tolerance.test.ts's "every rule kind
  tolerates {toString: 1} members (DEC-0082)" feeds every kind its named members, and every leaf and node of every
  semantic fixture and swept positive fixture, holding it. instancePaths keep the raw array index in the estate-record
  and activity rules.
- DEC-0082 appended; DEC-0030, DEC-0031, DEC-0037, DEC-0039, DEC-0047 and DEC-0055 annotated; CT-51 added (Fabric,
  Project Observatory, the first organization server, fabric-agent-adapter FAA-41, Fabric Dashboards FD-52, Fabric
  Switchboard) and CT-38 annotated; identifiers.md, delegation.md, spend-policy.md, governance-and-roles.md updated;
  floors: `src/context-route.ts` and `src/context-rules.ts` at 100 %, `src/activity-rules.ts` raised to its measured
  92.5 %.

## Open

- Consumers adopt at their next pin (CT-51): Fabric (CX-FAB-04 writes the grant's `context` and bounds its `expiresAt`;
  placements by context; `FAC-SEM-110`/`111`; `context` only once the meter is pinned), Project Observatory (OE-05, the
  enrollment client: per-organization enrollment only; separately, its collector routes a session's events per the
  vectors; its meter repins before a grant carries `context`; `grant.usage` needs a new Observatory row, requested
  through the pilot's §4 table or `com.submit`), the first organization server (`org.id` set, a grant's context, `grant.usage` for
  CX-VES-08), fabric-agent-adapter (FAA-41), Fabric Dashboards (FD-52), Fabric Switchboard (SB-109).
- Fabric's organization decision (D8) confirms the context form and the placement key; Fabric's decision on running the
  pilot linkable (K-1, fabric-workspace #215).
- Not decided: the rest of N20 (CX-CON-03…10, CX-CON-06 waiting on Fabric's D3); a context on a secret envelope; a
  context on a project, session or event; whether a share grant's `audience` names the placed agent; corrections of a
  day's `grant.usage`; two collectors of one device reporting one grant.

## Checks run

- Gate at the branch head (the final round), each step's exit code and count:
  - `tsc --noEmit`: exit 0;
  - `vitest run --coverage`: exit 0, 68 files, 4593 tests; statements 99.47 %, branches 98.8 %, functions 99.8 %,
    lines 99.73 %;
  - `python3 docs/ux/lint.py`: exit 0 (22 stories, 18 flows, 21 screens, 27 scenarios);
  - `tsx src/docs-check.ts`: exit 0;
  - `tsx src/lint-md.ts`: exit 0, 167 files, 0 errors;
  - `tsx src/privacy-check.ts`: exit 0, 0 findings.
- Floors raised to the measured branch coverage the exhaustive `{"toString": 1}` test reaches: `src/activity-rules.ts`
  97.16, `src/device-rules.ts` 98.87, `src/interop-rules.ts` 93.26, `src/registry-rules.ts` 98.64, `src/route-rules.ts`
  96.85, `src/semantic-rules.ts` 98.49, `src/session-handoff.ts` 93.45, `src/spend-rules.ts` 100.
- Plants, each a removed or loosened clause confirmed failing the named test file, then restored; all killed:
  - first round, at `5ddfefb` (re-run at `9b2c934`), 49: `test/contexts.test.ts` 27 rule plants (`FAC-SEM-110`,
    `FAC-SEM-074`/`075`, `FAC-SEM-111`, `estate-placement`, `placementTrust`, the `grant.usage` clauses of
    `FAC-SEM-038`/`039`); `test/context-route.test.ts` 9 routing plants; `test/fixtures.test.ts` with
    `test/contexts.test.ts` 13 schema plants;
  - first fix round, at `9b2c934`, 8: `test/secret-envelope.test.ts` 1 (envelopes read every placement);
    `test/contexts.test.ts` 4 (the local organization slot, a malformed context, the filtered index, `grantId` as
    written); `test/rule-tolerance.test.ts` 2 (`show`, `toNumber`); `test/context-route.test.ts` 1 (an inherited `org`);
  - final round, 12: `test/relay-vectors.test.ts` 1 (relay step 6 reading every placement, killed by the `placement`
    vectors); `test/context-route.test.ts` 2 (`orgId` admitting a leading `_` or `-`, or 129 characters);
    `test/rule-tolerance.test.ts` 3 (`show` and `toNumber` without their catch, the device-health baseline read by any
    key); `test/activity-rules.test.ts` 4 (the filtered event, summary cell, access-log entry and user-root indexes);
    `test/context-route.test.ts` with `test/contexts.test.ts` 1 schema plant (`contextId` admitting a leading `_` or `-`)
    and `test/fixtures.test.ts` with `test/contexts.test.ts` 1 (`grantId` admitting `#`).

## Next task

Done on 2026-10-14:

- §4 item (5) of the pilot packet is corrected to name `grant.usage` (fabric-workspace #229 `62b2dc73`);
- PR #107 is merged (`92cd1d7`), and the board and index row say so (#108 `82e1636`);
- the roadmap's contract row reads through DEC-0082;
- the merge commit was sent to the builders of Fabric, Project Observatory, the adapter, Fabric Dashboards and the first organization server.

The next task is the consumers'. Each adopts at its next pin, as CT-51 names. The contract session records each adoption on CT-51 when its receipt lands, and Observatory files a row for the `grant.usage` collector item. Fabric's D8 may still change the context form or the placement key. If it does, a later DEC changes them with a compatibility note.
