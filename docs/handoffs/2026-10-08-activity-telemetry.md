# Activity telemetry and devices (DEC-0030, DEC-0031)

Branch `agent/activity-contracts-20261008`, cut from `origin/main` at `0dea0e4`, PR #22. Objective:
the W0 open contracts for neutral activity telemetry — what a collector on a device sends, what a
receiver-built summary and an access log look like — and for the devices that send it. The devices
part covers enrollment, a server-issued stream epoch, signed policy with locks, OpAMP-shaped
check-in, health, and attribution by client certificate.

## Completed source work

- [Activity telemetry](../specification/activity.md) (`fabric-activity/0.1`, DEC-0030).
  - Content: the purpose clause; the telemetry event (`session.interval`, `usage.line`,
    `buffer.overflow`, extension and unknown kinds with bounded data); clocks (`bootId`,
    `monotonicNs`); the derived `eventId`; streams keyed by device; batches as contiguous slices;
    acks that count rejected events as consumed; the receiver-built `activity-summary/1`;
    `access-log/1` including device-keyed reads; and the OpenTelemetry mapping table.
  - Schemas: `activity-common`, `telemetry-event`, `activity-batch`, `activity-batch-ack`,
    `activity-summary`, `access-log`.
  - Rules `FAC-SEM-037`…`040` live in [`src/activity-rules.ts`](../../src/activity-rules.ts). Range
    arithmetic lives in [`src/seq-ranges.ts`](../../src/seq-ranges.ts).
- [Devices](../specification/devices.md) (`fabric-device/0.1`, DEC-0031).
  - Content: enrollment, `streamEpoch`, re-enrollment resetting the policy baseline, attribution,
    policy layers, check-in with `bufferedFrom` and `dropped`, health, and tamper evidence kept
    across batches.
  - Schemas: `device-common`, `device-enrollment`, `device-policy`, `device-check-in`,
    `device-health`.
  - Rules `FAC-SEM-041`…`045` live in [`src/device-rules.ts`](../../src/device-rules.ts).
- Registers:
  - [conformance](../specification/conformance.md#semantic-rule-codes): the register rows, and next
    free code `FAC-SEM-046`;
  - OQ-0009 and OQ-0010, narrowed by the review;
  - UX: persona P-03, JTBD-04, JRN-03, ST-007/008, FLW-06/07, SCR-09/10, SCN-010/011;
  - `CONTEXT.md` ("Telemetry event", "Collector node"), `docs/DOCMAP.md`, `README.md`,
    `docs/evidence/sources.md`.
- Fixtures: 46 catalogued (positive and schema-negative) plus 40 rule inputs under
  `fixtures/semantic/`, each with its expected codes. The signed policy fixtures were signed by a key
  generated for the purpose and not kept.

## Review of PR #22 (head `0994981`) — what changed

The contract owner requested changes. Every finding is answered in the PR comment, finding by
finding. In short:

- Overflows are judged across batches.
- A reinstall re-enrolls under a new epoch.
- The key filter splits every spelling and refuses home paths, and extension data is bounded by the
  schema.
- Summaries are receiver-only.
- Attribution comes from the certificate (`FAC-SEM-045`).
- Fields are camelCase, and `activity-event` was renamed `telemetry-event`.
- The operator's purpose clause replaces any rule about persons.

## Re-review of `19e2b58` — what changed

The contract owner verified the first round and found four more problems, all fixed before merge:

- **N1:** a device id on record is re-enrolled only with a CSR from its key on record
  (`publicKeySha256`) or a device-management token issued for that id (`FAC-SEM-044`).
- **N2:** acks are computed from the same cross-batch stream state as tamper evidence
  (`mergeStreams`), and name `held` ranges above the ack; the spec says what the device keeps and
  where the next batch starts.
- **N3:** a path-derived `sourceKey` is `hmac-sha256:` under the device's telemetry key
  (`pathSourceKey`), and encoded home directories (`-Users-<name>-`, `C--Users-`, `-home-`) are
  refused by the schema and by `FAC-SEM-037`.
- **N4:** events are attributed by the binding recorded per (device, epoch) (`FAC-SEM-045`).

The nits are fixed as well:

- key-filter gaps and false positives;
- the server layer is always reported in a check-in;
- a buffer floor that goes back is evidence;
- the branch hash is keyed;
- the presence wording is aligned;
- the rule modules are in the DOCMAP;
- the 1001-event fixture is now generated in a test;
- `sources.md` says `eventId`.

## Checks run

- The gate's four steps passed at the final commit: typecheck, 16 test files with 525 tests, UX lint
  (8 stories, 7 flows, 10 screens, 11 scenarios), and the documentation check with markdownlint at 0
  errors.
- The disk was full (144 MiB free), and the pnpm wrapper failed to link its binary. So the steps of
  `pnpm run check` were run directly from `node_modules/.bin`. CI runs `pnpm run check` itself.
- Re-review mutations, each killed and then restored: acks ignoring earlier batches (5 tests
  failed), the re-enrollment proof disabled (2 failed), attribution by the certificate instead of
  the epoch (4 failed).
- Planted mutations, each killed and then restored:
  - the gap check below `bufferedFrom` disabled (2 tests failed);
  - the camelCase split removed (3 failed);
  - overflow ranges ignored in acks (3 failed).
- The privacy gate `org-index/scripts/check_private.py` reports no finding in the changed files, and
  the banned-word grep over them is empty.

## Open work

1. Review and merge the PR. Ids were reserved by git CAS: DEC-0030, DEC-0031 and
   SEM-0037…SEM-0045. The registers were edited under git leases of run `r-5fe268ae4`, and the
   record plane is `fs`.
2. The operator answers OQ-0009 (minimum summary cell, raw-retention expiry, OTLP transport) and
   OQ-0010 (attestation formats, trusted policy keys, the `inactive` period).
3. Add a consumer-adoption row to `docs/backlog.md` (collector and organization server repin and
   implement), under that file's lease. Next task: take the lease and add the row.
