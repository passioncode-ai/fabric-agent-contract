# Handoff — activity and devices amended (DEC-0052, DEC-0053, board run wave 3, P3-02; CT-11, CT-25)

## Objective

Close node N07 of the [board run](../evidence/specs/2026-10-11-board-waves/canvas.md), packet
[P3-02](../evidence/specs/2026-10-11-board-waves/packets/wave-3/P3-02-activity-devices.md): harden DEC-0030 and
DEC-0031 with the audit's F-B-101…F-B-114, and amend them with CON-OE-01, CON-OE-12, the first organization server's
target architecture v4 §12 rows for DEC-0030 and DEC-0031 (commit `9c6a780`; V4-RUN-RESULT, V4-DEVICE) and CT-25.
Added mid-run at the lead's request: P-256 device keys by role for the relay protocol (DEC-0047, reserved).

## Done

- Decisions in [`docs/DECISIONS.md`](../DECISIONS.md), reserved by git CAS: **DEC-0052** (activity) and **DEC-0053**
  (devices); DEC-0030, DEC-0031 and DEC-0043 annotated (item 10 narrowed by OD-1 for owner and administrator views;
  item 7 replaced; lone surrogates decided). Rule codes **FAC-SEM-067** (`access-log-disclosure`), **FAC-SEM-068**
  (`device-action`), **FAC-SEM-069** (`device-root-certification`), receipts SEM-0067…SEM-0069; next free
  `FAC-SEM-072` (FAC-SEM-070/071 are reserved for the relay protocol, DEC-0047).
- [Activity](../specification/activity.md): `account.class`/`tenantRef`, `policy.violation` by UTC day, notice and
  consent messages (new schema `activity-notice`), OD-1 in neutral form over the access log (`purposeId`, `step`),
  `result` and `run.root`, pending check-in drops never moving an ack, the `mixed` basis a receiver duty.
- [Devices](../specification/devices.md): key validity at verification time, the proven user bound, path-free
  detail, the hashed branch's `hmac-sha256:`, organization policy keys with defaults, `expiresAt`, collection start,
  root certification (new schema `device-root-certification`), ES256 root keys, device keys by role
  (`<device.id>#sig`, `<device.id>#kem`) with SEC 1 §3.2.2 validation in new `src/p256.ts`, check-in `components[]`
  and `records`, health reason `re_enrolled`.
- [Conformance](../specification/conformance.md): the register rows, canonical forms (settings form refuses a lone
  surrogate; `tenantRef` and the root certification documents are RFC 8785), reader rows for a device applying policy
  (with `FAC-SEM-046`, F-B-109) and a device deciding under its policy.
- Code: `src/activity-rules.ts`, `src/device-rules.ts`, `src/canonical.ts`, `src/settings-backup.ts`, `src/p256.ts`
  (new). Tests: `test/device-rules.test.ts`, `test/activity-rules.test.ts`, `test/canonical.test.ts`,
  `test/settings-backup.test.ts`, `test/p256.test.ts` (new), `test/rule-tolerance.test.ts` (new). Vectors:
  `fixtures/vectors/canonical.json` (three settings-form refusals), `fixtures/vectors/p256.json` (new).
- Floors: `device-rules.ts` 97.08 %, `activity-rules.ts` 91.54 %, `p256.ts` 100 %
  ([coverage baseline](../evidence/specs/2026-10-11-board-waves/coverage-baseline.md)). Source ledger: TUF v1.0.37,
  RFC 7518, SEC 1 and SEC 2. The 2026-10-08 handoff's Completed list corrected (F-B-114).
- Board: CT-11 and CT-25 done; CT-04 names what the collector, the organization server and Project Observatory's
  node adopt at the next pin.

## Checks run

Gate parts on the branch after merging `main` at `0cacd08`: `tsc --noEmit` clean; `vitest run --coverage` 34 files,
1282 tests passed before the merge of P3-01 (1354 in 35 files after it; 1356 after the review fixes), every floor met; `python3 docs/ux/lint.py` exit 0; `tsx src/docs-check.ts` "Documentation checks
passed"; `tsx src/lint-md.ts` 0 errors; `tsx src/privacy-check.ts` with `ORG_INDEX` set to the org-index checkout:
0 findings. Every check added or fixed was planted back and failed at least one test; the table is in the pull
request. One plant survives by design: removing `isValidP256Key` from `verifyWith` leaves the suite green, because
Node's key import refuses an invalid point first; the check stays as defence in depth, and the function itself is tested over the vectors in `p256.test.ts`.

## Decisions taken here

- One decision per protocol (activity, devices) rather than one: clearer *Compatibility* for each consumer.
- Policy key names stay `snake_case`, so CON-OE-12's `models.personalKeySharing` is `models.personal_key_sharing`.
- CON-OE-12's offline-root counter-signature applies only when the installer pins an offline root (v4 §11 and §20
  V2-13 narrowed it); `models.credentials` keeps a fingerprint, while v4 derives a key's kind from the slot's origin.
- `policy.violation` keeps the event envelope with `occurred` at midnight and `monotonicNs` `"0"` instead of a new
  envelope; `result` carries no `user` or `session`.
- The whole-set coverage floor stays at 86.85 %, because P3-01's new files land beside these.

## Open

- OQ-0010 (attestation formats) stays deferred: the first organization server answers it.
- The relay protocol (DEC-0047) defines the heartbeat, the revocation delta, the leases and sealed envelopes the
  check-in's `records` carry, and seals to the `#kem` key; `isValidP256Key` is ready for it.
- The organization root as a pair of keys (v4 §3), ES256 policy signing keys, and how the fingerprint salt reaches a
  node are not decided (DEC-0053 *Not decided here*).
- Knowledge base: fabric-workspace `knowledge/` rows for DEC-0052/0053 and the consumers' plans are the owner
  session's at the wave close, with `node scripts/workspace.mjs sync`.
- `test/schema-compilation.test.ts` counts 73 schemas after the merge with P3-01.

## Next task

The owner session merges the P3-02 pull request (P3-01 merged in, review fixes applied), then starts P3-03 (estate
record), which references device keys by role
(`#sig`, `#kem`) and the check-in's `records.estateRecord.revision` from DEC-0053.
