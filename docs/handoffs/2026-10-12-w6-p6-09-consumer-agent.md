# Handoff — a consumer agent (DEC-0071, board run wave 6, P6-09)

## Objective

Let an agent that serves nothing and only calls MCP servers — the first organization server's admin agents, Claude
Code plugins that use its tools at each organization's own address — pack as an agent, with an `agentRef`, secret slots
and a result signal, instead of as a skill set.

## Done

- **DEC-0071**, reserved by git CAS; rule code **FAC-SEM-102** (receipt SEM-0102). Agreed with the first organization
  server's session (its condition: a role is the server's name in the placement's configuration; no address or token
  in the package).
- Schema `fabric-package.schema.json`: `provider` optional for an agent; without it, `skills` and `requires.mcp` are
  required and `service` is refused; `requires.mcp[]` `{role, tools, contract?}`.
- `src/package-rules.ts`: `FAC-SEM-102` (each role once) and `consumerPlacement` (missing roles and tools).
- Spec: [package → A consumer agent](../specification/package.md#a-consumer-agent); CT-04, CT-18, CT-20.

## Checks run

Off main `0656aa1`: `tsc --noEmit` exit 0; vitest 57 files, 3113 tests, every floor met (`package-rules.ts` at 100 %);
docs-check passed; markdownlint 0 errors; privacy 0 findings with `ORG_INDEX`. Plants: 6, five caught; the sixth
(lower-casing the required role) is equivalent, since the schema's role pattern is lower case.

## Open

- Merges after #73 and #74; registers rebased then. Send the first organization server's session the merge commit.
- **Next task:** P6-03, CON-OE-05 (`fabric-proposal/1`, `learning-note/1`), with Fabric's five corrections.
