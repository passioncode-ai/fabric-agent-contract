# 2026-10-23: key windows, protocol gates and a queued call's record (DEC-0115 to DEC-0117)

## Objective

CT-120's items that change what a party does: a key window that cannot be read, which side's `protocols` list gates
each check-in member, and the call record of a queued call.

## Done

- **DEC-0115** (#165 `e999853f`): one key-window reference, `keyWindowHolds` in `src/device-rules.ts` (an absent bound
  open, an unreadable one closing it), used by `FAC-SEM-041`, `repairDecision` and the credential checks; the key
  set's own rule (`FAC-SEM-046`) reads its bounds the same way and refuses at receipt a bound the schema's `date-time`
  admits but strict RFC 3339 does not.
- **DEC-0116** (#166 `cd9f49e1`): each side gates DEC-0111's members on the other's own list (a node's request members
  on the server's response list, a server's response members on the node's check-in list); a queued call has one
  record at the job's final state (`job-cancelled` for a cancelled job), and a lost job is `unknown` from the caller.
- **DEC-0117**: `records.repairs` is sent only to a node whose check-in lists `repair-request/1`; a node sends a summary
  only to a server whose response lists `node-summary/1`, and a result only to one that lists `repair-result/1`. Its
  product reading passed; its risks were fixed (the pair split, versioning.md's sender rule, CT-83's owed duties).

## Decisions taken here

- Gates read the lists DEC-0067 and DEC-0094 already define; no new member.

## Open

- CT-120's remaining items (a personal slot frozen by a top sequence, a device with no `#kem`, per-call cost and
  activity.md, the digest key across a lost hub, `hubKeyCertified` in the credential check, a `view` machine and an
  organization's credentials, semantic fixtures held to their schema).
- Tell Project Observatory (OBS-193) and the first organization server about DEC-0117 on the board.

## Checks actually run

`pnpm run check` on each pull request (output in the pull request).

## Next task

Announce DEC-0115 to DEC-0117 on board thread `b2511678` to Project Observatory and the first organization server; then
CT-120's next item.
