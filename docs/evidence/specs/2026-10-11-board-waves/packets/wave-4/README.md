# Wave 4 packets — services on every system, the operator channel and the embedded dashboard, the network's transport

Wave 4 of the [plan](../../plan.md): nodes N08, N09 and N18 of the [canvas](../../canvas.md). The rules are
[wave 3's](../wave-3/README.md), [wave 2's](../wave-2/README.md) and [wave 1's](../wave-1/README.md#rules-every-packet-follows).
These are added:

- **Agreements are recorded, not re-asked.** The plan made N08 depend on agreement with Fabric (CO-238) and Fabric
  Dashboards (FD-37). Both answered on 2026-10-12, and so did the adapter, whose kits implement the rule; the rulings
  are in each packet's *Agreed* section. A decision cites them as "agreed with Fabric's session (CO-238)", "with Fabric
  Dashboards' session (FD-37, its `main` `e1fdd64`)" and "with the adapter's session (its kits 0.18.0+)".
- **Every refusal a packet adds has a fixture that kills it**, and every reader rule a reference function with vectors
  a port can run (wave 3's standard: plants recorded in the pull request, floors raised in `vitest.config.ts` and
  [coverage-baseline.md](../../coverage-baseline.md)).
- **Review before merge:** three independent readings (unit, seam, product), one fix round, a confirming reading of the
  fixes, then the owner session merges. Wave 3 found a blocking defect in every pull request at the first reading.
- **Time and dates:** any timestamp a rule compares is parsed strictly (RFC 3339 with `T` and an offset; see
  `src/estate-record-rules.ts` `time`), an unreadable clock is refused before any comparison, and a test that depends
  on the time zone runs in at least two zones.
- **Peer pull requests:** #53 (DEC-0047, the relay, Project Observatory's session) is reviewed by the owner session,
  not rebuilt here. DEC-0054 (revocation delta and heartbeat) was reserved by the owner session's P3-02 run (key
  `revocation-delta-20261012`); P4-06 builds it under that reservation and reserves no new decision id.

| Packet | Node | Owns | Order |
|---|---|---|---|
| [P4-01 services on every system](P4-01-services.md) | N08 | `service.md` (One copy, Lifecycle, Supervisor, Windows token files), `service-descriptor`/`service-common` schemas, `src/windows-token.ts` (new) | first; parallel with P4-03 and P4-04 |
| [P4-02 the descriptor for listings](P4-02-descriptor.md) | N08 | the descriptor's placement peer, `installedBy`, `runner.credentialKind`, `lifecycle.manager: node` | after P4-01 (both edit the descriptor schema) |
| [P4-03 operator channel and embedded dashboard](P4-03-channel-dashboard.md) | N09 | `operator-channel.md`, `embedded-dashboard.md`, their schemas, `docs/ux/` scenarios | parallel with P4-01 |
| [P4-04 device transport and keys](P4-04-device-transport.md) | N18 | `devices.md` (transport, enrollment key roles, check-in digest), `src/device-rules.ts`, `src/http-signature.ts` (new) | parallel with P4-01 |
| [P4-05 window leases and signing challenges](P4-05-leases-challenges.md) | N18 | `window-lease/1`, the signing-challenge register | after #53 (DEC-0047) merges |
| [P4-06 revocation delta and heartbeat](P4-06-delta-heartbeat.md) | N18 | DEC-0054 (pre-reserved): `revocation-delta.md` (new), `revocation-delta`/`heartbeat` schemas (new), `src/revocation-delta.ts` (new), the DEC-0054 passages of `relay.md`, `devices.md`, `estate-record.md` | parallel; added 2026-10-12, after DEC-0047 (#53) |
| [P4-07 a delegation key the estate certifies](P4-07-hubkey.md) | N18 | DL-14's certification rule, `hubKeyCertified` in `src/estate-record-rules.ts`, the verifiers' `estate` option, `fixtures/vectors/hub-key.json` (new) | parallel; added 2026-10-12 from the adapter's FAA-31 report |
