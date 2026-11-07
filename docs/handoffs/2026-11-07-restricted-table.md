# 2026-11-07: a restricted socket table (CT-261, DEC-0155)

## Objective

Say in HA-2 what a macOS socket table restricted to the reader's own sockets means (macOS 27.2, ad hoc signed
processes; the Fabric Agent Adapter's measurement on board thread `eefa7959`, message `31c317ab`), and how an honest
client may still prove its own listener.

## Done

- [DEC-0155](../DECISIONS.md) (Proposed): RT-1 to RT-5 in
  [service](../specification/service.md#a-restricted-socket-table); HA-2's list of owners that cannot be told and its
  macOS row name the restriction and `pcblist_n`.
- [Conformance](../specification/conformance.md#clients-and-readers): the client row, the local-surface row and the
  token-free door's row read a restricted table; SCN-056 and SCR-20 carry its recovery; DEC-0154 annotated.
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
- RT-2 proves this account with or without a restricted table, since Fabric's client uses it always; where it finds
  nothing, a readable table decides. RT-3 and RT-4 only under a restricted table; RT-3 counts only an exact IPv4
  `127.0.0.1` listen, as RT-4 does. RT-5 is the server side. Linux and Windows are out of scope.
- No schema enum: no schema carries a host state or an owner reason; `table-restricted` is a reason text.

## Checks actually run

- Round 1 at `bccee010`: all three tiers failed (RT-3 against RT-4 on a wildcard and `-iTCP`; Compatibility
  understating the adapter's and sshlg-fabric-server's debts; no server side; Linux caught by the detection; no UX; no
  Annotated line on DEC-0154), folded in `9f6dcb4a`. Round 2 at `9f6dcb4a`: unit and seam passed, product failed
  (RT-5 not in conformance's server rows; DOCMAP and the handoff named RT-1 to RT-4), folded in the next commit with
  the readers' risks. `pnpm run check`: one hook timeout under load (CT-204),
  `pnpm docs:check` exit 0.

## Next task

Round 3 of the blind readings (unit, seam, product) on the head after round 2's fixes; two consecutive clean rounds,
then merge and a release tag.
