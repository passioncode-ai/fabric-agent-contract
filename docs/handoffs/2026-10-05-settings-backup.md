# Settings backup standard and feed-client token header (DEC-0025)

Branch `agent/settings-backup-standard`, cut from `origin/main` at `b300f24`. Objective: make
settings backups (`fabric-settings-backup/1`) a shared, checkable format, and make the feed
client's token header a conformance rule.

## Completed source work

- [`settings-backup.schema.json`](../../schemas/settings-backup.schema.json): the file shape.
  Values are JSON scalars, with integers bounded and fractions refused. It also refuses table
  and column names that can only hold a credential value.
- [`src/settings-backup.ts`](../../src/settings-backup.ts): `canonicalJson`,
  `settingsBackupDigest` and `FAC-SEM-035` (checksum, counts, row widths, canonical values).
- [`src/service-feed.ts`](../../src/service-feed.ts): `tokenHeader` and `FAC-SEM-036`.
- [Service spec](../specification/service.md#settings-backup) (Settings backup, the
  [feed client](../specification/service.md#feed-client), Lifecycle rows, Semantic rules);
  [conformance](../specification/conformance.md#clients-and-readers);
  [DEC-0025](../DECISIONS.md); `CONTEXT.md`; `docs/DOCMAP.md`.
- Fixtures: one positive, five schema negatives, one damaged-checksum file, and two feed
  requests (custom header honoured, `Authorization: Bearer` assumed). The positive fixture's
  checksum was computed with Python's `json.dumps(sort_keys=True, ensure_ascii=False)` and is
  asserted equal to the TypeScript digest. That gives one cross-language vector.

## Checks run

- `pnpm run check`: typecheck, 13 test files / 326 tests, UX lint, docs check, markdownlint
  0 errors.
- Planted mutations, both killed and then restored: a compact separator in `canonicalJson`
  (3 tests failed) and `Bearer` forced for scheme `none` (4 tests failed).

## Open work

1. Review and merge the PR. Coordination: DEC-0025 was reserved by git CAS. The decision file
   was edited under the git lease, and the record plane is `fs`.
2. The organisation lifecycle pointer LC-16 in fabric-workspace links here. That is the owner's
   change, not this repository's.
3. Consumers repin and adopt: a service that keeps backups checks its writer against the
   positive fixture. Feed clients (the service host) check their requests against
   `fixtures/semantic/service-feed-request-*.json`.

**Next task:** after merge, add the LC-16 pointer in fabric-workspace to
`docs/specification/service.md#settings-backup` at the merge commit.
