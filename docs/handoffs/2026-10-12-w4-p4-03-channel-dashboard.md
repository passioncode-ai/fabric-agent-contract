# Handoff — operator-channel status invariants and the embedded dashboard amended (DEC-0058, DEC-0059, board run wave 4, P4-03)

## Objective

Close node N09 of the [board run](../evidence/specs/2026-10-11-board-waves/canvas.md) (backlog CT-13),
[P4-03](../evidence/specs/2026-10-11-board-waves/packets/wave-4/P4-03-channel-dashboard.md): the receipts F-B-204,
F-B-205, F-B-219 (operator channel), F-B-214…F-B-217 (embedded dashboard, agreed with Fabric Dashboards' session, its
`main` `e1fdd64`) and F-B-218, F-D-020 (UX scenarios) of the
[inventory](../evidence/specs/2026-10-11-board-waves/inventory.json).

## Done

- **Scenarios first** (their own commit, before the contract change): [scenarios](../ux/scenarios.md) SCN-021 and
  SCN-022 (a dashboard beside a widening console; the host's theme and the fields a page declares), SCN-023 (an agent
  finds a standing grant and proceeds), SCN-024 (settings restore), SCN-025 (a request on the Project board), with
  stories ST-016…ST-020, jobs JTBD-08 and JTBD-09, journeys JRN-07 and JRN-08 (and JRN-06 stage 4), flows FLW-13…FLW-16
  and screens SCR-16…SCR-19. SCN-012 names an unlinked channel whose receiver stopped; SCN-018, which already covered
  approving one delegated action and its refusal codes, now points at the refusal wire's fixtures.
- **DEC-0058** in [`docs/DECISIONS.md`](../DECISIONS.md): `unlinked` requires `receiver.lease` `held` or `elsewhere`;
  `reason.code: receiver-missing` requires `state: degraded` and `receiver.lease: none`; OC-17's list names `unlinked`;
  the glossary's *Addressed message* names OC-15's bare `/link CODE`. Seventeen negative fixtures and one positive (a
  waiting channel nobody receives on).
- **DEC-0059** with **FAC-SEM-080**: ED-8's cookie is "per host in a shared cookie store; per service where the host
  gives each service its own store" (RFC 6265 §8.5, pinned in the [source ledger](../evidence/sources.md) with its
  SHA-256); ED-6 applies only the fields ED-9's `appearance` lists, none meaning `prefers-color-scheme` only; ED-9: a
  host validates the declaration, treats an invalid one as not declared and reports it. `src/dashboard-declaration.ts`
  (`hostView`, `dashboardDeclarationRules`), semantic fixtures `fixtures/semantic/service-well-known-dashboard-*`,
  vectors `fixtures/vectors/dashboard-declaration.json` (21 cases), seven negative declaration fixtures.
- **Killing fixtures proved by test:** [`test/schema-mutants.ts`](../../test/schema-mutants.ts) removes one schema
  constraint at a time and requires a negative fixture the copy accepts: 22 mutants of the channel status, 10 of the
  declaration, and an identity mutant for each that must let nothing through. It found one constraint nothing proved: `linked` without `receiver` (the fixture of that name carried a
  receiver with lease `none`); `operator-channel-status-linked-receiver-absent` now kills it.
- Register row `FAC-SEM-080`; board rows CT-13 (in review), CT-18 (adapter: new rows asked for the channel status and the dashboard kit; FAA-15 and FAA-17 are closed) and CT-21 (Fabric
  Dashboards consumes ED-9 `appearance` and the validation; it files its own row); DOCMAP, CONTEXT; DEC-0035 and
  DEC-0036 annotated.

## Checks run

On the branch off `main` `31ed9f0`, after the review round: `tsc --noEmit` clean; `vitest run --coverage` 36 files, 1588 tests passed, every
floor met, whole set 3153 / 3312 branches (95.19 %), `dashboard-declaration.ts` 20 / 20; `python3 docs/ux/lint.py`
"20 stories, 16 flows, 19 screens, 25 scenarios"; `tsx src/docs-check.ts` passed; `tsx src/lint-md.ts` 0 errors;
`tsx src/privacy-check.ts` with `ORG_INDEX` set: 0 findings. Plants, each restored after a test failed: FAC-SEM-080
not dispatched from `semantic-rules.ts` (1 test failed); `hostView` using an invalid declaration (11); the host floor
without its 480 (3); the instance pointer unescaped (1). The schema plants run as the mutant tests on every gate. The review round (owner session's three readings; 13 items) added and planted: the mutant filter reading positives (both identity tests failed); `in` for `Object.hasOwn` under a non-enumerable inherited key (1 failed); a reader that checks only `minWidth` (the new vector `valid-floor-duplicate-field` among 11 failures); SCN-012's old wrong fixture name (the new UX fixture-name test failed). FB-6 now takes ED-8's scope (DEC-0045 and DEC-0040 annotated).

## Decisions taken here

- `receiver-missing` constrains the state as well as the lease, so a missing receiver cannot be published as `off`
  either; reason codes other than it constrain no lease.
- FAC-SEM-080 reports once per schema error at the extension key, and `hostView` is a reference function with
  vectors, so a host's port and this checker agree on what "invalid" means.
- The registers were edited in this branch without a lease, by the wave-4 arrangement. The `DEC` marker stays at
  `DEC-0056` as on `main`; the rule-code marker is `FAC-SEM-081`, because `test/consistency.test.ts` (G-13) fails while
  the marker is not above the highest allocated code. The owner session sets both at merge.

## Open

- Consumers: the adapter's kits and `check_service.py` (CT-18, new adapter rows); Fabric Dashboards' validation and
  ED-9 `appearance` (CT-21, its own row).
- A per-service appearance choice for pages sharing a cookie store (*Not decided here* in DEC-0059); whether `off`
  may carry a `receiver` (DEC-0058).

## Next task

The owner session reviews this pull request (three readings, one fix round, a confirming reading), takes the leases on
`docs/DECISIONS.md`, `docs/specification/conformance.md` and `docs/backlog.md`, sets the next-free markers, merges, and
records F-B-204, F-B-205, F-B-214…F-B-219 and F-D-020 as closed for wave 4.
