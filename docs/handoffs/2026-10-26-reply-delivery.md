# Handoff: a reply's delivery on the project board (2026-10-26)

## Objective

Decide a reply's audience on the project board (CT-154): since Fabric's migration 124 a reply reaches the sender of
the message it answers, and the contract had no field to ask for the whole thread (Fabric CO-437).

## Done

- DEC-0135, [project comms](../specification/project-comms.md#who-a-message-is-delivered-to) DR-1 to DR-4. Delivery
  decides what counts as unread (`com.list` with `unread`, `com.status`'s count, `read` on a filtered page) and what a
  transport mirror sends, never who reads: every participant reads every message of its thread (C2).
  - DR-1: a message, request, finding or announcement goes to every participant but the sender.
  - DR-2: a participant's reply goes as its optional `deliverTo` says: `sender` (the default, Fabric's behaviour),
    `thread`, or a list of participants; a reply to a request also reaches the requester; a message from the replier's own
    Project, or one the board no longer holds, falls back to `thread`.
  - DR-3: every message a responder posts on a request's thread is a reply to the request and reaches the requester.
  - DR-4: a reply as read carries its `deliverTo`; a host sends it only to readers pinned at or after DEC-0135.
- Schemas: `$defs/deliverTo` in `comms-common`; `deliverTo` on `comms-reply`, `comms-submit` and `comms-message`;
  `unread` and `read` described over deliveries; `com.read_ack` and its receipt unchanged. Fixtures and eight mutant plants.
- DEC-0022, DEC-0073 and DEC-0098 annotated; the narrowing of `unread` recorded as an exception to the compatibility
  policy (Fabric's released board counts unread over its deliveries, migration 107); conformance, CONTEXT (Delivery), DOCMAP, SCR-19.

## Checks actually run

- `pnpm run check` after each round's fixes: exit 0 (106 files, 9 356 tests at the last round, UX lint, docs, markdownlint 0
  errors, privacy 0); `pnpm vectors:check`: 25 files match.
- Blind readings: round 1 fail (the `unread` description; a list could answer a request without reaching its
  requester); round 2 fail (the message view's history; a responder's messages' kind); round 3 fail (the own-Project
  exception in two descriptions; the read-mark receipt; SCR-19's wording); round 4 fail (the read-mark receipt changed
  an adopted answer: reverted to DEC-0073, and the narrowing of `unread` recorded as an exception). Fixed after each. Non-blocking findings:
  CT-166.

## Open

- Adoption (CT-154): Fabric's board stores and honours `deliverTo`, stages it by the reader's pin, keeps unread over
  deliveries (CO-437); the adapter's kits and agents send `deliverTo: "thread"`
  when they mean the whole thread.

## Next task

Finish the readings (two clean rounds), merge, release, tell Fabric (CO-437) and the adapter; then CT-157 and CT-161.
