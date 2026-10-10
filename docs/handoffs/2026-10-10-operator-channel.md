# Operator channel `fabric-operator-channel/0.1` (DEC-0034)

Branch `agent/dec-operator-channel-20261010`, cut from `origin/main` at `3168503`. Objective: give
an agent a contract for its own messenger channel to its operator — notifications from its
events feed and decisions answered with buttons — beside, never instead of, the Project board and
its Telegram mirror (DEC-0022, C8).

## Completed source work

- [Operator channel spec](../specification/operator-channel.md): OC-1…OC-13, the relation to the
  board mirror, the status states and the known reason codes.
- [`operator-channel-status.schema.json`](../../schemas/operator-channel-status.schema.json): the
  status document. It names the credential and never holds it, and it carries counts instead of
  chat or user ids. Conditionals tie each state to what it requires.
- [`service-well-known.schema.json`](../../schemas/service-well-known.schema.json): optional
  `surfaces.operatorChannel.path`; [service spec](../specification/service.md#well-known-document)
  says so, and [project-comms](../specification/project-comms.md#transport-mirror) points here.
- Fixtures: five valid states, eleven refusals, and two well-known documents, all in
  `fixtures/catalogue.json`. [`test/operator-channel.test.ts`](../../test/operator-channel.test.ts)
  keeps the spec's rule list and state table equal to the schema, and keeps token-shaped strings
  and id fields out of the published shapes.
- [DEC-0034](../DECISIONS.md), `CONTEXT.md` (operator channel, link code), `docs/DOCMAP.md`,
  `README.md`, [sources](../evidence/sources.md) (Telegram Bot API 10.3), `docs/ux/` (JTBD-05,
  JRN-04, ST-009, ST-010, FLW-08, SCR-11, SCN-012, SCN-013).

## Decisions

- No semantic rule code is allocated: the rules are prose under DEC-0034, and the status is
  checked by its schema. A send ledger or callback log with rules is listed as not decided.
- The channel's state never changes the service's `status` or `degraded` list (OC-9), so
  `FAC-SEM-011` is untouched; a host shows it through the summary tile and the status document.
- No extension key: a manifest declares nothing for the profile (G-08 unchanged).

## Checks run

- `pnpm run check`: typecheck, 17 test files / 573 tests, UX lint (10 stories, 8 flows,
  11 screens, 13 scenarios), documentation checks, markdownlint 0 errors.
- Planted mutations, each killed and then restored: a sixth state added to the schema (the
  spec-table test and `operator-channel-status-bad-state` failed); the `linked` ban on `reason`
  removed (`operator-channel-status-linked-with-reason` failed).

## Open work

1. Review and merge the PR. DEC-0033 is held by the open branch
   `agent/dec-windows-token-owner-20261010`; whichever merges second resolves the
   `**Next free ID:**` line to `DEC-0035` and keeps both entries in number order.
2. fabric-agent-adapter: the proposal step (OC-11) in `creating-fabric-agents` and
   `adapting-projects-to-fabric` — branch `agent/operator-channel-proposal-20261010`.
3. Consumers adopt after the merge: an agent that implements the channel serves the status at
   `surfaces.operatorChannel.path` and checks it against the positive fixtures; Fabric Dashboards
   reads it beside the usage report.

**Next task:** review this PR against OC-1…OC-13 and the C8 mirror rules, then merge it before the
adapter PR, whose skill text links this spec.
