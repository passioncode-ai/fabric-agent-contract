# Wave 2 packets — delegation, spend, canonical forms, runner and model profiles, service hygiene

Wave 2 of the [plan](../../plan.md). Nodes N05, N06, N14 and N15 of the [canvas](../../canvas.md). The rules are
[wave 1's](../wave-1/README.md#rules-every-packet-follows), with these additions:

- **A decision per packet.** Each packet that changes a normative rule writes one decision. Before the first edit,
  reserve its id with `agent_sync.py reserve DEC` (and rule codes with `reserve SEM`). The decision states
  *Compatibility* honestly: additive, tightening or breaking, and what a consumer must do at its next pin.
- **The gate includes coverage.** `pnpm run check` runs `vitest --coverage` with per-file branch floors
  (`vitest.config.ts`). A packet that closes a file's findings raises that file's floor to its new measured
  percentage, recorded in [coverage-baseline.md](../../coverage-baseline.md). Run the gate with a real install in
  the packet's worktree (`CI=true pnpm install --frozen-lockfile`, about 250 MB; check `df -h` first) or by
  linking the main checkout's `node_modules`, which has the coverage provider since wave 1.
- **Read the gate's last lines before writing them into a commit.** Wave 1 had two commits whose claims were
  written before the run was read.
- **Clean up only your own paths.** Remove a worktree only by its exact path, never by a pattern.

| Packet | Node | Owns | Order |
|---|---|---|---|
| [P2-01 canonical forms](P2-01-canonical-forms.md) | N06 | `src/canonical.ts` (new), `conformance.md` (a new section; lease), `fixtures/vectors/` (new), the DEC-0022 digest's code | parallel with P2-02 |
| [P2-02 service hygiene](P2-02-service-hygiene.md) | N15 | `schemas/service-well-known.schema.json` (degraded), manifest and descriptor MCP scope, `src/secret-shape.ts` (new), `semantic-rules.ts` (new rules), `session-handoff.ts` (imports the detector) | parallel with P2-01 |
| [P2-03 delegation sealed](P2-03-delegation-sealed.md) | N05 | `delegation.md`, delegation schemas, `src/delegation*.ts`, `governance.schema.json`, `service.md` (session lifetime), `spend-policy.md` (trust tiers only) | after P2-01 (uses `src/canonical.ts`) |
| [P2-04 runner and model profiles](P2-04-runner-model-profiles.md) | N14 | `runners.md`, new profile schemas, `spend-policy.md` (`modelClasses`), the usage report's route | after P2-03 (shares `spend-policy.md`) |
