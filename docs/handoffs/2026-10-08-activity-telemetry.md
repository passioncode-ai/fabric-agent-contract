# Activity telemetry and devices (DEC-0030, DEC-0031)

Branch `agent/activity-contracts-20261008`, cut from `origin/main` at `0dea0e4`. Objective: the W0
open contracts for neutral activity telemetry — what a collector on a device sends, what a summary and
an access log look like — and for the devices that send it: enrollment, signed policy with locks, and
OpAMP-shaped check-in and health.

## Completed source work

- [Activity telemetry](../specification/activity.md) (`fabric-activity/0.1`, DEC-0030): the event
  (`session.interval`, `usage.line`, `buffer_overflow`, extension kinds `x-<namespace>.<kind>`), the
  derived `event_id`, streams `(node.id, node.epoch, seq)`, batches and acks, `activity-summary/1`
  and `access-log/1`. Schemas `activity-common`, `activity-event`, `activity-batch`,
  `activity-batch-ack`, `activity-summary`, `access-log`. Rules `FAC-SEM-037`…`040` in
  [`src/activity-rules.ts`](../../src/activity-rules.ts) (`activityEventId`, `contiguousAcks`,
  `forbiddenKeys`).
- [Devices](../specification/devices.md) (`fabric-device/0.1`, DEC-0031): enrollment with a
  non-exportable key and a certificate of at most 30 days, policy layers `mdm` > `server` > `user`
  with locks and Ed25519 signatures over canonical JSON, check-in and health. Schemas
  `device-common`, `device-enrollment`, `device-policy`, `device-check-in`, `device-health`. Rules
  `FAC-SEM-041`…`044` in [`src/device-rules.ts`](../../src/device-rules.ts) (`resolvePolicy`,
  `policySigningInput`, `verifyPolicySignature`, `tamperEvidence`).
- Register rows and the next free code `FAC-SEM-045` in
  [conformance](../specification/conformance.md#semantic-rule-codes); two reader rows under
  [Clients and readers](../specification/conformance.md#clients-and-readers); OQ-0009 and OQ-0010;
  `CONTEXT.md`, `docs/DOCMAP.md`, `README.md`, `docs/evidence/sources.md`.
- Fixtures: 15 positive, 12 schema negatives, 21 rule inputs under `fixtures/semantic/` (each with
  its expected codes). The signed policy fixtures were signed by a key generated for the purpose and
  not kept; the fixtures hold its public key.

## Checks run

- `pnpm install --frozen-lockfile && pnpm run check`: typecheck, 16 test files / 472 tests, UX lint,
  documentation check, markdownlint 0 errors.
- Planted mutations, each killed and restored: locks ignored in `resolvePolicy` (3 tests failed),
  `prompt` removed from the content keys (1 failed), the seq-gap check disabled in `tamperEvidence`
  (1 failed).
- Privacy gate over the changed files: `org-index/scripts/check_private.py` and the banned-word grep
  named in the pull request.

## Open work

1. Review and merge the pull request. IDs were reserved by git CAS (DEC-0030, DEC-0031,
   SEM-0037…SEM-0044); the registers were edited under the git leases of run `r-5fe268ae4`; the
   record plane is `fs`.
2. The operator answers OQ-0009 (summary minimum cell, raw-retention expiry, OTLP transport) and
   OQ-0010 (attestation formats, trusted policy keys, when a device is `inactive`).
3. A consumer-adoption row (collector and organization server repin and implement) belongs in
   `docs/backlog.md`; its lease was held by another run during this one, so the row was not added.
   Next task: add it under that lease once it is free.
