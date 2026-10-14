# Handoff — DEC-0082: contexts for the RM-28 pilot (2026-10-13, fix round 2026-10-14)

## Objective

RM-28's pilot puts one person, their personal context and two organizations on one machine, and shares the person's
own agents into both organizations as separate instances with different access levels. The contract could not record
that: `FAC-SEM-074` allowed one placement of an agent per machine, a grant named no context, and no activity event
carried a grant's usage to the organization server. This run implements the owner's answer to the pilot request (the
§4 row "fabric-agent-contract" of fabric-workspace `b7ac2188`, `docs/reports/2026-10-12-org-contexts/pilot-2026-10-13.md`),
the owner's correction of that answer's §4 item (5) (`grant.usage`), and the owner's decisions on the three independent
readings of PR #107, as DEC-0082 (board row CT-51).

## Done

- A home for contexts: [`docs/specification/contexts.md`](../specification/contexts.md), linked from README, DOCMAP,
  CONTEXT (*Context*) and conformance. The grant, the estate record, the collector's routing and Switchboard compare the
  context id, so it has one page rather than a section in one of them.
- The context id `common.schema.json#/$defs/contextId`: `personal` or `org:<orgId>`, `orgId` `[A-Za-z0-9][A-Za-z0-9_-]{0,127}` (1–128 characters),
  compared as written. An organization server that takes part in contexts issues `org.id` within that set (devices.md);
  the vectors show an enrolled `org.example` cannot be routed. The first organization server's `org_<base32>` is marked
  informative, at its commit `03d454b`.
- The grant's optional `context`; `FAC-SEM-110` (kinds `grant` and `estate-record`): an external principal's grant is
  never `personal`. Access levels are the grant's own fields; no new field.
- One instance per context: `FAC-SEM-074` per (machine, `agentRef`, context); `FAC-SEM-075` per (machine, `agentRef`,
  slot, context), and an organization's slot is filled from its own machine; `FAC-SEM-111` (an organization's instance
  under a share grant of the record for that context, matched by normal form, not revoked; a malformed context fails
  closed, `parseContext`); `placementTrust` and `estate-placement` take the context, default `personal`. `FAC-SEM-111`
  reads revisions only; the revocation delta stops calls at the hub and the meter at once.
- Secret envelopes name no context: `estateEnvelopeContext` reads personal secret placements only, so the sealer, the
  current placement and the marks no longer depend on array order; an organization's slot never admits an envelope.
- Three routes, no context on the wire: check-ins per enrollment, to its own server on its interval with only its
  streams; a session's events by `routeTarget`; `grant.usage` by `routeGrantUsage` (the grant's own context). Shared
  vectors `fixtures/vectors/context-route.json` (written by `tools/vectors/context-route.ts`).
- `grant.usage`: one grant's daily usage keyed by `grantId` (the grant's `meta.id` without its revision, normal form),
  built from the meter's settled receipts each counted once plus `byGrant` receipts the meter does not hold;
  `FAC-SEM-038` and `FAC-SEM-039` extended (one per stream, day and normal form of `grantId` in a batch); a receiver
  counts the first and ignores later ones (conformance row). The old-receiver condition is `extScalar`'s string branch,
  spelled out and tested.
- Membership: only the certificate follows it by itself; Fabric's share flow bounds the share grant's `expiresAt` by the
  membership's expiry.
- Linkability: the slice does not meet CX-22; every check-in `records` member and the estate digest are identical across
  the two organizations; running the pilot linkable waits on Fabric's recorded decision (the pilot report's K-1,
  fabric-workspace #215, both open); Project Observatory's per-organization device identity plan is the open divergence.
- Rule code no longer throws on a `{"toString": 1}` member (`show`, `toNumber` in `src/findings.ts` and
  `src/estate-record-rules.ts`; `src/activity-rules.ts` throughout), and instancePaths keep the raw array index.
- DEC-0082 appended; DEC-0030, DEC-0031, DEC-0037, DEC-0039, DEC-0047 and DEC-0055 annotated; CT-51 added (Fabric,
  Project Observatory, the first organization server, fabric-agent-adapter FAA-41, Fabric Dashboards FD-52, Fabric
  Switchboard) and CT-38 annotated; identifiers.md, delegation.md, spend-policy.md, governance-and-roles.md updated;
  floors: `src/context-route.ts` and `src/context-rules.ts` at 100 %, `src/activity-rules.ts` raised to its measured
  92.5 %.

## Open

- Consumers adopt at their next pin (CT-51): Fabric (CX-FAB-04 writes the grant's `context` and bounds its `expiresAt`;
  placements by context; `FAC-SEM-110`/`111`; `context` only once the meter is pinned), Project Observatory (OE-05:
  per-organization enrollment; routing per the vectors; `grant.usage` needs a new Observatory row, requested through the
  pilot's §4 table or `com.submit`), the first organization server (`org.id` set, a grant's context, `grant.usage` for
  CX-VES-08), fabric-agent-adapter (FAA-41), Fabric Dashboards (FD-52), Fabric Switchboard (SB-109).
- Fabric's organization decision (D8) confirms the context form and the placement key; Fabric's decision on running the
  pilot linkable (K-1, fabric-workspace #215).
- Not decided: the rest of N20 (CX-CON-03…10, CX-CON-06 waiting on Fabric's D3); a context on a secret envelope; a
  context on a project, session or event; whether a share grant's `audience` names the placed agent; corrections of a
  day's `grant.usage`; two collectors of one device reporting one grant.

## Checks run

- Gate at the branch head, each step's exit code and count:
  - `tsc --noEmit`: exit 0;
  - `vitest run --coverage`: exit 0, 68 files, 4078 tests; statements 99.37 %, branches 97.85 %, functions 99.8 %,
    lines 99.7 %;
  - `python3 docs/ux/lint.py`: exit 0 (22 stories, 18 flows, 21 screens, 27 scenarios);
  - `tsx src/docs-check.ts`: exit 0;
  - `tsx src/lint-md.ts`: exit 0, 167 files, 0 errors;
  - `tsx src/privacy-check.ts`: exit 0, 0 findings.
- Plants: 57, each a removed or loosened clause confirmed failing the named test file, then restored. All killed.
  - `test/contexts.test.ts`: 27 rule plants on `FAC-SEM-110`, `FAC-SEM-074`/`075`, `FAC-SEM-111`, `estate-placement`,
    `placementTrust` and the `grant.usage` clauses of `FAC-SEM-038`/`039` (many also fail `test/estate-record.test.ts` or
    `test/activity-rules.test.ts`); the fix round's `FAC-SEM-075` local slot, `FAC-SEM-111` malformed context, filtered
    index and `grantId` written-as plants.
  - `test/context-route.test.ts`: 9 routing plants (personal, 0/129 characters, a multiline `$`, case-folding, prefix,
    `Personal`, ambiguous, no context) and the inherited-`org` plant.
  - `test/secret-envelope.test.ts`: the envelope reading every secret placement.
  - `test/rule-tolerance.test.ts`: `show()` and `toNumber()` falling back to `String()` and `Number()`.
  - `test/fixtures.test.ts` (with `test/contexts.test.ts`, `test/context-route.test.ts`): 13 schema plants (the context
    id's bound, the new members' types, and each `grant.usage` constraint, `grantId`'s length and URI form included).
- The exact plant list is in the pull request.

## Next task

The owner session corrects §4 item (5) in fabric-workspace to name `grant.usage` (the answer itself already landed in
fabric-workspace #207), then reviews and merges PR #107 and tells Fabric's, Project Observatory's, the adapter's,
Fabric Dashboards' and the first organization server's builders the merge commit (CT-51).
