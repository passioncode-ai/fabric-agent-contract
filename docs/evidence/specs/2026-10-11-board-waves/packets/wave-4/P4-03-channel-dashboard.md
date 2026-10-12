# P4-03 — the operator channel and the embedded dashboard

- **Node:** N09 · **Wave:** 4 · **Closes:** F-B-204, F-B-205, F-B-219, F-B-214, F-B-215, F-B-216, F-B-217, F-B-218,
  F-D-020. Read each receipt in [inventory.json](../../inventory.json).

## Agreed with Fabric Dashboards (2026-10-12, its `main` `e1fdd64`)

- **F-B-214, ED-8's wording:** the appearance cookie is "per host in a shared cookie store; per service where the host
  gives each service its own store" — Fabric Dashboards does: partition `persist:svc-<key>`
  (`src/electron/policy.ts` `partitionFor`, `src/electron/views.ts:54`). A per-service carrier for shared stores goes
  under *Not decided here*.
- **F-B-215:** ED-9's `appearance` governs ED-6: a page applies only the fields it declared; with none, it follows
  `prefers-color-scheme` only. (In Fabric Dashboards that already follows the app's chosen theme,
  `nativeTheme.themeSource`.)
- **F-B-216:** a host validates the declaration against the schema, treats an invalid one as not declared and reports it
  (Dashboards: logs once per load). Dashboards files its own row to consume ED-9 `appearance` once this lands.

## What to build (one or two decisions)

1. **Operator-channel status (F-B-204, F-B-205):** `unlinked` without a receiver lease and `receiver-missing` with a held
   lease become unrepresentable (if/then on `reason.code`); a negative fixture per state invariant the receipt lists;
   F-B-219's glossary sentence.
2. **Embedded dashboard (F-B-214…F-B-217):** the three agreed texts; a contract-side check for an invalid declaration
   (a semantic kind or a helper, with a negative semantic fixture); the declaration's killing fixtures.
3. **UX scenarios (F-B-218, F-D-020)** through the repository's UX chain (`docs/ux/`, `python3 docs/ux/lint.py`):
   scenarios first for the embedded dashboard (navigation stays reachable, the page keeps its minimum width), approving
   one delegated action and seeing a refusal code, an agent finding a standing grant and proceeding, restoring settings,
   and the Project board — each with coverage pointing at the rules and tests.

## Proof

A fixture per refusal; `ux:lint` green with the new scenarios; consumer rows (Fabric Dashboards: ED-9 `appearance`,
validation of the declaration; channel servers: the status invariants).
