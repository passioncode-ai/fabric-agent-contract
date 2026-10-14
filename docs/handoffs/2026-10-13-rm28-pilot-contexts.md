# Handoff — DEC-0082: contexts for the RM-28 pilot (2026-10-13)

## Objective

RM-28's pilot puts one person, their personal context and two organizations on one machine, and shares the person's
own agents into both organizations as separate instances with different access levels. The contract could not record
that: `FAC-SEM-074` allowed one placement of an agent per machine, a grant named no context, and no activity event
carried a grant's usage to the organization server. This run implements the owner's answer to the pilot request (the
§4 row "fabric-agent-contract" of fabric-workspace `b7ac2188`, `docs/reports/2026-10-12-org-contexts/pilot-2026-10-13.md`)
and the owner's later replacement of its item 6, as DEC-0082 (board row CT-51).

## Done

- A home for contexts: [`docs/specification/contexts.md`](../specification/contexts.md), linked from README, DOCMAP,
  CONTEXT (*Context*) and conformance. The context id is used by the grant, the estate record, the collector's routing
  and Switchboard, so it has one page rather than a section in one of them.
- The context id `common.schema.json#/$defs/contextId`: `personal` or `org:<orgId>`, `orgId` 1–128 of `[A-Za-z0-9_-]`,
  compared as written.
- The grant's optional `context` (`governance.schema.json#/$defs/grant`); `FAC-SEM-110` (kinds `grant` and
  `estate-record`, `src/context-rules.ts`): an external principal's grant is never `personal`.
- Access levels: no field; the grant's own `capabilities`, `effectCeiling`, `dataClasses`, `spend`, `expiresAt`, stated
  in contexts.md, governance-and-roles.md and spend-policy.md.
- One instance per context: a placement's `context` and `grant`, a secret placement's `context` (checked for a
  credential's shape); `FAC-SEM-074` per (machine, `agentRef`, context), `FAC-SEM-075` per (`agentRef`, slot, context),
  `FAC-SEM-111` (an organization's instance under a share grant of the record for that context, matched by normal form,
  not revoked; a personal instance names none); `placementTrust` and kind `estate-placement` take the context, default
  `personal`.
- Routing: no context on the wire; `routeTarget(sessionContext, enrollments)` and `routeGrantUsage(grantContext,
  enrollments)` in `src/context-route.ts`, total, with shared vectors `fixtures/vectors/context-route.json` written by
  `tools/vectors/context-route.ts`; activity.md and devices.md each gained a routing paragraph; conformance gained the
  collector row.
- The core activity kind `grant.usage` (the owner's item 6): one grant's metered usage for one UTC day, no session or
  user, `costUsd` null when nothing was priced; `FAC-SEM-038` and `FAC-SEM-039` extended (the cost triple; the day; one
  per (day, `grantRef`) per stream in a batch, folded into `FAC-SEM-039` rather than a new code).
- DEC-0082 appended; DEC-0030, DEC-0031, DEC-0037, DEC-0039 and DEC-0055 annotated; CT-51 added and CT-38 annotated;
  identifiers.md, delegation.md and the estate record's text updated; floors: `src/context-route.ts` and
  `src/context-rules.ts` at 100 %, `src/activity-rules.ts` raised to its measured 92.45 %.

## Open

- Consumers adopt at their next pin (CT-51): Fabric (CX-FAB-04 writes the grant's `context`, placements by context,
  `FAC-SEM-110`/`111`), Project Observatory (per-organization enrollment, routing per the vectors, `grant.usage` from its
  meter, OE-05), the first organization server (reads a grant's context, ingests `grant.usage` for CX-VES-08), Fabric
  Switchboard (the context-id form, SB-109).
- Fabric's organization decision (D8) confirms the context form and the placement key; if it differs, a later decision
  changes them with a compatibility note.
- Not decided: the rest of N20 (CX-CON-03…10, CX-CON-06 waiting on Fabric's D3); a context on a project, session or event;
  whether a share grant's `audience` names the placed agent; corrections of a day's `grant.usage`; two collectors of one
  device reporting one grant. Until CX-CON-06 the pilot is linkable, acceptable only while both organizations belong to
  one person.

## Checks run

- The gate at the branch head: `tsc --noEmit`, `vitest run --coverage`, the UX lint, docs-check, lint-md and the privacy
  check; the exact numbers are in the pull request.
- Plants, each removed clause confirmed failing a named test and then restored; the list is in the pull request.

## Next task

The owner reviews and merges the pull request, then tells Fabric's, Project Observatory's and the first organization
server's builders the merge commit (CT-51), and records the contract's answer in the pilot report's §4 row.
