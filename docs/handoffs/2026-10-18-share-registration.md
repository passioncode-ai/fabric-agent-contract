# Handoff: DEC-0086, share registrations and the grant's context on `grant.usage` (2026-10-18)

## Objective

The first organization server asked the contract (VES-GRANT-CONTEXT, project board thread `cc944654`, 2026-10-17) where
it learns which agent each share grant into its organization runs, for a `context` on `grant.usage`, and for a grant id
that holds nothing about the person. The brief, [`brief.md`](../evidence/specs/2026-10-18-share-registration/brief.md),
fixed decisions 1 to 9 and the REQ table; this run implements it on branch `agent/ct56-share-registration-20261018`.

## Done

- **Schemas (REQ-01):** `schemas/share-registration.schema.json` (registration, receipt, refusal; closed),
  `common.schema.json#/$defs/orgContextId` and `#/$defs/shareGrantId`; `telemetry-event.schema.json#/$defs/grantUsage`
  requires `context` and takes a share grant id. Protocol revisions `share-registration/1` and
  `share-registration-receipt/1` (REQ-08).
- **Code (REQ-02):** `src/share-registration.ts`: `isShareGrantId`, `isOrgContext`, `shareRegistrationDigest`,
  `registrationWellFormed`, `deriveShareRegistrations`, `decideShareRegistration` (SR-0 to SR-11),
  `joinGrantUsage` (GJ-0 to GJ-6); every function answers and never throws.
- **Rules (REQ-03 to REQ-05):** `FAC-SEM-117` (kinds `grant`, through `src/context-rules.ts`, and `org-share-grants`),
  `FAC-SEM-118` (kinds `share-registration`, `share-registration-derive`, `share-registration-intake`,
  `grant-usage-join`), and `FAC-SEM-045` amended in `src/device-rules.ts` for a `grant.usage`'s context.
- **Vectors (REQ-06):** `fixtures/vectors/share-registration.json`, written by
  `tools/vectors/share-registration.ts --write`, expected values by hand, nothing imported from the module: 21 grant id,
  36 derive, 50 intake and 24 join cases; the test compares the file with the generator and runs every case in UTC,
  America/St_Johns and Pacific/Kiritimati.
- **Outputs and refusals (REQ-07):** every derived registration validates and passes `FAC-SEM-118`; every receipt and
  refusal validates; 32 registration mutations, active and withdrawn, get the schema's verdict from the receiver.
- **Fixtures (REQ-09):** 45 existing fixtures migrated to `urn:fabric:share:` ids and the grant's `context`, digests
  recomputed, verdicts kept; the respelled-id batch fixture became a test in `test/contexts.test.ts`. New positive,
  negative and semantic fixtures, one intake fixture per SR row and one join fixture per GJ row.
- **Docs (REQ-10):** `docs/specification/share-registration.md` (new); contexts, activity, devices, identifiers, estate
  record, conformance (rows, canonical form, `FAC-SEM-117`, `FAC-SEM-118`, next free `FAC-SEM-119`); CONTEXT, README,
  DOCMAP, the coverage baseline; DEC-0086 after DEC-0085 with the DEC-0082 annotation (next free stays `DEC-0087`);
  CT-56 after CT-55 with each consumer's duty.
- **Plants (REQ-11):** 94, each killed after two survivors were closed with tests:
  [`plants.md`](../evidence/specs/2026-10-18-share-registration/plants.md).
- **Gate (REQ-12):** `pnpm run check` exits 0 (see *Checks*), with a 100 % branch floor for `src/share-registration.ts`.

## Decisions

DEC-0086 ([register](../DECISIONS.md)). Its *Choices made in implementation* list what the brief left open: millisecond
instants and the third degraded code `share-grant-unreadable`; `previouslyRegistered` as a list of grant ids; SR-0
passing through DEC-0056's step-0 faults; SR-2 only for a string `type`; a withdrawal keeping the active members and a
tombstone joining nothing; the GJ-0 row; `FAC-SEM-117` counting placements in the grant's own context.

## Checks

`pnpm run check` at the commit this handoff records as the gate's (typecheck, `vitest run --coverage`, `docs/ux/lint.py`,
docs-check, lint-md, privacy-check), each exiting 0; the gate's commit is named in the handoff index row.

## Open

- Each consumer adopts at its next pin (CT-56): Fabric, Project Observatory's node and collector, the first
  organization server, fabric-agent-adapter.
- The registers are edited under this run's leases on `docs/DECISIONS.md`, `docs/backlog.md` and
  `docs/specification/conformance.md`; the owner releases them.

## Next task

Open the pull request for `agent/ct56-share-registration-20261018`, run the independent readings (unit, seam, product),
merge, then post the merge commit on the board threads `cc944654` and `b68f4399`.
