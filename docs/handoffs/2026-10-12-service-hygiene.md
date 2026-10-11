# Handoff — service hygiene (DEC-0044, board run wave 2, P2-02)

## Objective

Three asks from live consumers on 2026-10-11, board rows CT-22, CT-23 and CT-24 (node N15 of the
[board run](../evidence/specs/2026-10-11-board-waves/canvas.md), packet
[P2-02](../evidence/specs/2026-10-11-board-waves/packets/wave-2/P2-02-service-hygiene.md)): a setup state in the
service well-known that a watcher does not alert on; a stdio MCP server declared where it is used (LC-19); no secret
in a declared command line (LC-21).

## Done

- DEC-0044 in [`docs/DECISIONS.md`](../DECISIONS.md); rule codes `FAC-SEM-056` (a stdio server's `scope` is never
  `session`) and `FAC-SEM-057` (no credential in a launch argument or MCP entry), defined in
  [profiles](../specification/profiles.md#semantic-rules) and allocated in the
  [register](../specification/conformance.md#semantic-rule-codes) with two reader rows.
- `schemas/service-well-known.schema.json` `degraded[].setup`; [service](../specification/service.md#well-known-document)
  says what it means and that the entry still makes the service `degraded`.
- `scope` (`project`, `on-demand` — the default — or `session`, refused) on the manifest's stdio connection and the
  provider entry's `run.mcp.stdio`; [profiles](../specification/profiles.md#where-a-stdio-server-is-declared) says
  how a host starts each and that a stateless tool is a service's MCP surface.
- `src/secret-shape.ts`, the one credential detector (names, values, arguments, URLs); `src/fabric-links.ts`
  re-exports what it exported. `src/session-handoff.ts` keeps its copy: Fabric vendors that file alone
  (`apps/desktop/test/fixtures/fabric-agent-contract/current/src/session-handoff.ts` on Fabric's `agent/w2-handoff`).
  `test/session-handoff-review.test.ts` holds the copy to the original's patterns and behaviour.
- Fixtures: 3 positive, 3 negative, 6 semantic; `test/service-hygiene.test.ts`; floors raised for
  `src/fabric-links.ts`, `src/semantic-rules.ts` and the new `src/secret-shape.ts`
  ([coverage baseline](../evidence/specs/2026-10-11-board-waves/coverage-baseline.md)).

## Open

- Receipts for CT-22…CT-24 on the board and in `findings/closed.json` once the pull request merges (the owner
  session records them with the merge commit, as in wave 1).
- Consumers: Fabric Dashboards' watcher (FD-48) skips `setup: true`; Copylot marks its `execution` source `setup`;
  Fabric starts a provider entry's stdio server by `scope`; the adapter checks Claude Code plugin configurations
  against LC-19 and LC-21 (its own row) and may import `src/secret-shape.ts`.
- `runners.md` (P2-04's this wave) may point at `FAC-SEM-057` beside its own rules.

## Next task

The owner session rebased this branch on `4fdbd79` (P2-01, DEC-0043) and re-ran the gate, then merges it and
records CT-22, CT-23 and CT-24 as done with the merge commit. Consumer rows filed on the contract's board: CT-27
(Fabric's `agentRegistry.ts:236` accepts `run.mcp.stdio.scope`) and CT-28 (the adapter's `fabric_provider.py:119`
does too, and checks Claude Code plugin configs for session-wide stdio servers), beside FD-48 (Dashboards' watcher
honours `setup`) and Copylot's well-known emitting `setup` for its configuration state.
