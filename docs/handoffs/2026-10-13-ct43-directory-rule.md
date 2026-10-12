# Handoff — CT-43: a directory page lists each Project once (2026-10-13)

## Objective

DEC-0073 left open whether a semantic rule should check a `com.directory` page, because JSON Schema's `uniqueItems`
compares whole objects and lets one Project or one capability appear twice under other names or states (CT-43).

## Done

- DEC-0077: yes. `FAC-SEM-107` (kind `comms-directory`, `src/semantic-rules.ts` `commsDirectory`) refuses a Project
  listed twice on a page and a capability listed twice within a Project, naming the second entry. Ids and capability
  names compare as written (DEC-0076: neither is a URI). One capability under several Projects is allowed.
- project-comms.md (Project directory, Semantic rules) and the conformance register (row `FAC-SEM-107`, receipt
  SEM-0107, next free `FAC-SEM-108`); DEC-0073 annotated; CT-43 done.
- Tests in `test/comms-rules.test.ts` (accept, refuse each, compare as written, malformed input); the kind in
  `test/rule-tolerance.test.ts`.

## Open

- Not decided: the page's order (by name, then id) stays the host's collation; the caller's own Project being absent is
  board state, not in the page.
- Consumers: Fabric answers pages that pass it (CT-41); the adapter's kits check pages with it (CT-42).

## Checks run

See the pull request: the full gate and the plants.

## Next task

The board's open rows are now consumer adoption (CT-03, CT-18, CT-20, CT-21, CT-41, CT-42, CT-50), the operator's
decisions (CT-46, CT-49) and the program (N13, N16, N20), each waiting on its owner or an outside event. Take the next
row an owner hands back, or a program item whose blocker clears.
