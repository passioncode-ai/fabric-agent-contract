# 2026-10-21: the contract review (no decision; REQ-01 to REQ-18)

## Objective

The operator asked for a review of the whole contract: what to cut, add or clarify so that fewer errors happen when
people build agents against it, how agents work through it, what to optimise, and the improvements landed in the
contract's final form. The brief, its decisions (D1 to D5), the REQ table and the exceptions to D2 are in
[`docs/evidence/specs/2026-10-21-contract-review/brief.md`](../evidence/specs/2026-10-21-contract-review/brief.md);
every finding outside the REQs is in [`carry-over.md`](../evidence/specs/2026-10-21-contract-review/carry-over.md).

## Done

- **An author's first check is a command (REQ-01, REQ-02, REQ-04, REQ-05).** `pnpm validate <file or folder>`
  (`src/validate-cli.ts`) infers the schema, runs the schema and the semantic rules, prints one line per problem with
  its path, rule and link, exits 1 on a problem and 2 on a usage error, pairs a folder's service descriptor with its
  well-known document, and gives hints (a misspelt extension key, the profile version member, a member a named reader
  does not accept yet) that never fail the exit code. `SEMANTIC_KINDS` is a registry; schema errors collapse
  `anyOf`/`oneOf` wrappers; every rule code resolves to an anchored row of the register.
- **One mistake, one error (REQ-03).** A capability profile, a provider's `run.mcp` and the MCP `connection` are keyed
  on `kind` or `mode` (`allOf` of `if`/`then`), with the same accept set on every fixture.
- **Fixtures and tools (REQ-06, REQ-07, REQ-08, REQ-14, REQ-15).** The author fixtures follow interop C3.1;
  `pin:check` validates the lock, names a missing or malformed one, excludes dated records, notes a member the pin
  schema does not define instead of refusing it, and looks the pin up in history; `src/session-handoff.ts` loads alone;
  every negative fixture names its keyword and every schema has one; the gate's checkers are under the coverage
  ratchet; `pnpm vectors:check`.
- **Schemas without a behaviour change (REQ-13).** Shared definitions in `common.schema.json`, `[0-9]` for `\d`,
  `fabric-connections/0.1`, descriptions on the author documents. Every fixture against every schema keeps its
  verdict (148 240 pairs measured); the two exceptions are recorded in the brief.
- **Documentation (REQ-09 to REQ-12, REQ-16).** README leads with "Build an agent"; a grouped specification index with
  each surface's maturity; the author guide by agent kind with examples the suite validates; provider.md, service.md,
  profiles.md, overview.md and versioning.md corrected; SCN-001 and SCN-002 describe the checker.
- **Consumers (REQ-17, REQ-18).** Backlog receipts for CT-28, CT-54, CT-56, CT-59 and CT-61; CT-42 open (code done, the
  repin waits on CT-41); new rows CT-75 to CT-79 and evidence on CT-73.

## Board messages

| Thread | To | What |
|---|---|---|
| `d0d274d0` | fabric-agent-adapter | the protocol register's `fabric-connections`, the pin check's differences, the `common.schema.json` closure and the mode-keyed `connection` |
| `c95a946a` | org-index | `check_private.py` scans every file twice and covers tracked files only (carry-over D11, D19) |
| `f3ef6b51` | the three `support-quality-daily` emitters | their forked schemas (CT-61) |

## Open

- Consumers move their pins in their own repositories. **A re-pin past this run copies `common.schema.json` from the
  same commit with any vendored schema**, because several schemas now reference its new definitions.
- CT-73, CT-75 to CT-79 hold everything the review found and this run did not do, each with its evidence.

## Checks actually run

`pnpm run check` on the run's head: typecheck, 7 673 tests with coverage, UX lint, docs check, markdownlint, privacy
check (0 findings), exit 0. Three blind readings per round (unit in its own worktree, seam and product by `git show`).

## Next task

Take CT-75 (the author documents' open definitions): it is the row nearest to an author's errors.
