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

`pnpm run check` at `45cd007` (typecheck, `vitest run --coverage`, `docs/ux/lint.py`,
docs-check, lint-md, privacy-check), each exiting 0: 75 files, 5545 tests, coverage 7267 / 7340 branches, docs-check passed, lint-md 0 errors, privacy-check 0 findings.

After the fix round, `pnpm run check` at `f628f0d`, each step exiting 0: typecheck; 75 files, 5585 tests, coverage
7308 / 7381 branches with `src/share-registration.ts` at 271 / 271; UX lint passed; documentation checks passed,
lint-md 0 errors; privacy-check 0 findings. The commits after it record this only.

## The fix round (2026-10-18 to 2026-10-19)

Three blind readings of `cbcd03c`: unit fail, seam pass, product fail. Every finding was fixed on this branch:

- a `revokedAt` or a dropping revision's `issuedAt` with more than three fraction digits gave no withdrawal, so a
  revoked share stayed active at the receiver (unit and seam): times are now carried at millisecond precision, a
  withdrawal floored, a window rounded inward, and `FAC-SEM-117` refuses a share grant window with more than three
  fraction digits at the writer;
- `identifiers.md` and `estate-record.md` were claimed but untouched; conformance, CONTEXT and two code comments listed
  signed requests without share registrations (product): written;
- a re-pointed grant held its usage forever (product): a grant keeps its `agentRef`, `FAC-SEM-117` with `parent`
  refuses a re-pointed one, and SR-7's recovery is to revoke and mint a new id;
- the sender gate was prose only (seam): `gateGrantUsage`, with vectors;
- days past year 9999, the held list's organization, the leap second, the privacy sentence's scope, the compatibility
  of a long `context` at a pre-DEC-0082 receiver, the protocol-revision test, and a negative fixture that tested nothing
  (unit, product, seam): fixed, each recorded in DEC-0086's *Choices made in implementation*.

The builder of the first fix round stopped on a provider error (502) after the code commit; the next session finished
the vectors, docs, plants and gate from its worktree.

## Open

- Each consumer adopts at its next pin (CT-56): Fabric, Project Observatory's node and collector, the first
  organization server, fabric-agent-adapter.
- The registers are edited under this run's leases on `docs/DECISIONS.md`, `docs/backlog.md` and
  `docs/specification/conformance.md`; the owner releases them.

## Next task

Open the pull request for `agent/ct56-share-registration-20261018`, run one more blind reading of the fix round's diff
(`cbcd03c..HEAD`), merge, then on the project board:

- post the merge commit on threads `cc944654` and `b68f4399` (the first organization server);
- `com.submit` to Project Observatory: OBS-101 implements `grant.usage` at DEC-0086 directly, with
  `deriveShareRegistrations`, the registration client and `gateGrantUsage`;
- `com.submit` to Fabric: CX-FAB-04 mints `urn:fabric:share:` ids from a CSPRNG, runs `FAC-SEM-117` with the parent
  revision, writes windows and `revokedAt` with at most three fraction digits, and never re-points a grant;
- a note to fabric-agent-adapter: vendor the schema and the two common defs, run `FAC-SEM-117` (with `parent`),
  `FAC-SEM-118` and the amended `FAC-SEM-045`;
- the knowledge base: the contract's rows in fabric-workspace `products.md` and `plans.md`, then
  `node scripts/workspace.mjs sync`.
