# Wave 6 packets — the open organization-edition contracts, contexts, wave 4's follow-ups

Wave 6 of the [plan](../../plan.md): nodes N12, N20 and N19 of the [canvas](../../canvas.md). The rules are
[wave 5's](../wave-5/README.md) and those it links. Added:

- **v4 first.** The organization architecture v2's contract plan is copied only in the edition its CROSSWALK-v4 gives
  (fabric-workspace `docs/reports/2026-10-08-org-architecture-v2/plans/CROSSWALK-v4.md`): CON-OE-05, -07 and -08 are
  kept; CON-OE-10 is a local channel to the node with peer credentials or per-account token files (DEC-0033), without
  `policy.decide`; CON-OE-06's `surfaces.a2a` is *Later* in v4 §12; CON-OE-03 is mostly the package, the estate record
  and listings already decided (DEC-0050, DEC-0051, DEC-0055, DEC-0061), measured before anything new is written.
- **Readings are back.** Subagent readers are available again; each packet gets its three readings before merge.

| Packet | Node | Owns | Order |
|---|---|---|---|
| P6-01 protocol revisions | N12 | CON-OE-07: `src/protocol-revisions.ts`, `protocols`, `schema-unsupported` (DEC-0067) | first; merges after #70 (the relay audit) |
| P6-02 the session join key | N12 | CON-OE-08 | next |
| P6-03 proposals and learning notes | N12 | CON-OE-05 | after P6-02 |
| P6-04 the local channel to the node | N12 | CON-OE-10 (v4 edition) | after P6-03 |
| P6-05 CON-OE-03 measured | N12 | close what DEC-0050/0051/0055/0061 decided; park the rest with rows | any time |
