# Handoff — an app's own descriptor (DEC-0069, board run wave 6, P6-06; Fabric CO-263)

## Objective

Give an app a person installs and starts (Fabric's desktop app, which has no installer on macOS) a descriptor that says
it is installed, without a supervisor and without a fixed origin ([packets](../evidence/specs/2026-10-11-board-waves/packets/wave-6/README.md)).

## Done

- **DEC-0069**, reserved by git CAS; no rule code. Agreed with Fabric's session (CO-263 and its amendment: an update
  is a reinstall).
- Schema `service-descriptor.schema.json`: `lifecycle.manager: "person"` with `lifecycle.app`; no supervisor fields;
  `installedBy` object form with `by: "person"`; `origin` optional only for an app.
- `src/app-descriptor.ts`: `appDescriptorAction` (write on none or a different version, keep otherwise) and
  `appDescriptorStale`; vectors `fixtures/vectors/app-descriptor.json`. `FAC-SEM-010`: an app without an origin claims
  no port.
- Spec: [service → An app's descriptor](../specification/service.md#an-apps-descriptor), the Supervisor row.

## Checks run

Stacked on P6-02: `tsc --noEmit` exit 0; vitest 54 files, 2790 tests, `app-descriptor.ts` 11 / 11 branches; docs-check
passed; markdownlint 0 errors; privacy 0 findings with `ORG_INDEX`. Plants: 6, each caught (one equivalent at first,
killed by a null `installedBy` vector).

## Open

- Merges after #70, #71 and #72; registers rebased then, under this run's leases. Tell Fabric's session the DEC and
  the merge commit to pin (CO-263 stays open until then).
- **Next task:** P6-07, an optional `data` object on service feed events (nicegramappbot's request).
