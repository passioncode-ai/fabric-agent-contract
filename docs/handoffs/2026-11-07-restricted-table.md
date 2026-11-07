# 2026-11-07: a restricted socket table (CT-261, DEC-0155)

## Objective

Say in HA-2 what a macOS socket table restricted to the reader's own sockets means (macOS 27.2, ad hoc signed
processes; the Fabric Agent Adapter's measurement on board thread `eefa7959`, message `31c317ab`), and how an honest
client may still prove its own listener.

## Done

- [DEC-0155](../DECISIONS.md) (Proposed): RT-1 to RT-4 in
  [service](../specification/service.md#a-restricted-socket-table); HA-2's list of owners that cannot be told and its
  macOS row name the restriction and `pcblist_n`.
- [Conformance](../specification/conformance.md#clients-and-readers): the client row reads a restricted table.
- Backlog: CT-261 in progress; CT-229's owed vectors gain the restricted-table cases. [DOCMAP](../DOCMAP.md) row.

## Open

- Blind readings (unit, seam, product) until two consecutive rounds are clean; then merge and a release tag.
- After merge, owed by consumers: sshlg-fabric-server renames `owner_unknown` to `table-restricted`
  (SFS-HA2-RESTRICTED); Fabric Dashboards reads an empty table, and a table without the connection's row, as an owner
  that cannot be told (FD-159, FD-168); the adapter's FAA-272 (the hub client's reason, an RT-2 path).

## Decisions

- Written from what the products already ship, read on 2026-11-07 before the draft: Project Observatory's `peer_owner`
  1.3.0 (PR #466, `8013f6e1`, RT-2 by libproc, RT-4), the adapter's `rel-0.76.0` (`4ef7b936`, RT-3), the launcher's
  doctor (`eca6974`, a warning), Fabric's `listenerOwner.ts` (`2438c90a`, RT-2 by `lsof`).
- RT-2 proves this account with or without a restricted table, since Fabric's client uses it always; RT-3 and RT-4 only
  under a restricted table.
- No schema enum: no schema carries a host state or an owner reason; `table-restricted` is a reason text.

## Checks actually run

To be recorded with the readings.

## Next task

Round 1 of the blind readings (unit, seam, product) of branch `agent/ct261-restricted-table-20261107` against CT-261 and
DEC-0155.
