# 2026-10-23: a check-in's records judged against its certificate (DEC-0114)

## Objective

CT-91: a receiver that runs a check-in's rules refuses a node summary for another device or organization, and the
records DEC-0111 added are held to the certificate's organization too.

## Done

- **DEC-0114**: kind `device-check-in` reads `records.nodeSummary` with `FAC-SEM-128`'s clauses that need no policy and
  holds its `device.id` to the check-in's (`checkInSummaryFindings` in `src/node-summary.ts`); kind
  `device-attribution` (`FAC-SEM-045`) holds the summary's device and context, and every credential request's and call
  record's context, to the client certificate.
- Seven semantic fixtures, tests in `test/device-rules.test.ts` and `test/credential-envelope.test.ts`; rule rows in
  devices.md and node-summary.md, the register; backlog CT-91 done.

## Decisions taken here

- The certificate comparison sits in `device-attribution`, which already carries the binding; no new kind.

## Open

- CT-120's items; CT-92 (the operator's question on a summary's other contexts).

## Readings

Seam (covering the unit and the documents): one documentation break fixed (devices.md's Attribution list now names the
summary, request and call-record duties), with its risks: a request's organization read as a string in FAC-SEM-138, a
summary without a device refused, the node summary's device row, the server's rows (refuse another context as
attribution), a positive check-in fixture carrying a summary. The loop stops here.

## Checks actually run

`pnpm run check` (output in the pull request).

## After the merge: DEC-0115

CT-120's first item: `keyWindowHolds(t, key)` in `src/device-rules.ts` is the one key-window reference (an absent
bound open, an unreadable one closing it); `FAC-SEM-041`, `repairDecision` and the credential checks use it. Its seam reading found one break, fixed: two bounds the schema's
`date-time` admits (`+0100`, a space for `T`) verified before and closed after, so the key set's own rule
(`FAC-SEM-046`) now reads its bounds the same way and refuses such a set at receipt; DEC-0115's Compatibility says so.

## Next task

CT-120's remaining items by priority: `callRecordsAccepted`'s gate (`call-record/1` in a list of what a node reads),
then the call record of a queued `fabric.job.*` call.
