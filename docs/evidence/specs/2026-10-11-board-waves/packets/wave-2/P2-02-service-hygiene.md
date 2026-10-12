# P2-02 — service hygiene asked by live consumers

- **Node:** N15 · **Wave:** 2 · **Closes:** CT-22, CT-23, CT-24 (receipts in [inventory.json](../../inventory.json)
  and on the [board](../../../../../backlog.md)).

## Why

- **CT-22.** Dashboards' shared watcher (FD-48) messages the operator when a service stays down or degraded
  for more than 5 minutes. A well-known's `degraded[]` entry carries only `source` and `reason`, so the watcher
  cannot tell a setup state ("generation not configured") from a failure under the same source ("pinned model
  unavailable"). Source: the operator's decision in fabric-workspace `knowledge/authority.md`, *Telling the
  operator about outages* (2026-10-11). First consumers: Example Console and Dashboards.
- **CT-23 (LC-19).** On 2026-10-11 about 35 sessions each held their own copies of five stdio MCP servers, about
  10 GB RSS, which helped fill the disk three times. Source: fabric-workspace `knowledge/lifecycle.md` LC-19
  (PR #136, `34e5fa1`).
- **CT-24 (LC-21).** The same day, a plugin's MCP passed its bearer key in `mcp-remote` argv, visible in `ps`.
  Source: LC-21. The contract already has the detector this needs: `secretArgument` in `src/session-handoff.ts`
  (SH-10). It matches DEC-0041's whole-word credential names and finds long secret-shaped runs between path
  separators.

## What to build (one decision; reserve a DEC id and the rule codes you add)

1. **`degraded[].setup`.** An optional boolean on each `degraded` entry of `schemas/service-well-known.schema.json`,
   documented in `service.md` where `degraded` is defined. `setup: true` means a person must finish setup, not an
   outage, and a watcher MUST NOT alert on it. The entry still names `source` and `reason`. Add a positive and a
   negative fixture (e.g. `setup: "yes"`), and update the outage section if `service.md` has one.
2. **MCP scope (LC-19).** Find where the contract's documents declare MCP servers: the provider manifest's `mcp`
   profile, a service descriptor or well-known, the execution context, the runner catalogue. Read
   `schemas/manifest.schema.json`, `execution-context.schema.json`, `runners.schema.json` and
   `service-well-known.schema.json`.
   - Add a `scope` to a declared stdio server: `project` or `on-demand`, with `session` refused.
   - Add a rule (`FAC-SEM-…`) that refuses a stdio server declared for every session.
   - State in `service.md` or `profiles.md` that a stateless tool is a shared local service under the lifecycle
     broker with a health check (point at LC-19).

   Claude Code plugin configs are not contract documents. The adapter checks those, and the handoff names that
   as its work.
3. **No secret in a command line (LC-21).**
   - Move `secretArgument`, with `credentialName`, `secretValue` and their tables, into `src/secret-shape.ts`, the
     one shared detector. `src/fabric-links.ts` keeps re-exporting what it exports today, and
     `src/session-handoff.ts` imports from the new module. If you keep the copy, the agreement test stays; the
     module is meant to stay copyable, so prefer importing and drop the "dependency-free" claim only if nothing
     depends on it. Check who copies `session-handoff.ts` (Fabric vendors it — read
     `git -C <workspace>/fabric grep -n session-handoff origin/agent/w2-handoff -- '*.mjs' '*.ts'`). If a
     consumer copies the file byte for byte, keep the copy and keep the agreement test.
   - Add a rule (`FAC-SEM-…`) that applies the detector to every launch argument and MCP entry the contract
     declares: runner drives' `argv`, manifest MCP `args` and `url` query, descriptor `commands`.

## Proof

- A fixture per refusal: a setup entry without `reason`, a session-wide stdio server, a bearer in an `argv`, a
  key in a URL query. Plant each rule removed and watch a fixture fail.
- The positive-fixture sweep (`test/positive-sweep.test.ts`) still passes. Add any newly swept schema to its map.
- Raise the floors of touched files.

## Files you own

`schemas/service-well-known.schema.json` (degraded), the schema(s) that declare MCP servers (scope only),
`src/secret-shape.ts`, `src/semantic-rules.ts` (your new rules; P2-03 does not touch this file),
`src/session-handoff.ts` and `src/fabric-links.ts` (imports only), `docs/specification/service.md` (degraded and
MCP-scope paragraphs; P2-03 owns the session-lifetime paragraph — coordinate by lease if you both need the file),
`docs/specification/conformance.md` (rule rows; lease), `docs/DECISIONS.md` (lease), fixtures, tests, one handoff.
