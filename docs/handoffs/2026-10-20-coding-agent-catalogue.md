# 2026-10-20: the coding-agent catalogue (DEC-0093, CT-60)

## Objective

One list of coding agents for every product (Fabric's OF-11 on thread `617c8cbe`), as the contract's data.
Brief: `docs/evidence/specs/2026-10-19-runner-catalogue/brief.md`.

## Done

- `schemas/coding-agents.schema.json` (`coding-agents/1`, in the revision register) and `catalogue/coding-agents.json`:
  30 agents from Fabric Switchboard's list of 2026-10-19 (names, makers, urls, installs, launches, MCP flags,
  OpenRouter model arguments; not its machine state, key variables, headless or MCP commands), written by `tools/catalogue/seed.py`.
- Permission arguments for five agents, each with its evidence (`tools/catalogue/permissions.json`): Claude Code from
  its documentation; Codex, Gemini CLI, Cline and Cursor measured from the installed agent's `--help`.
- Ids are the runner kinds C2 lists (DEC-0016, DEC-0029, DEC-0046: `cursor-agent`, `kiro`), else new names;
  Switchboard's names kept as `aliases`.
- `test/coding-agents.test.ts`; the runners page section; DEC-0093; DOCMAP, README, CONTEXT; backlog CT-60.

## Decisions

- An argument that skips approval is recorded only from the maker's documentation or the agent's own output.
- No OpenRouter or proxy variable names are recorded yet: Switchboard's request names the fields, and each entry gets
  them when its maker's documentation is read.

## Open

- More measured permission arguments, OpenRouter recipes (`keyEnv`) and proxy recipes, one agent at a time with
  evidence.
- After the merge: org-index `repositories.json`, the contract's row, owns `catalogue/coding-agents.json`.
- `runner` entries (C2) inside the catalogue, where a host measured one.

## Readings

Unit and product, three rounds; each round's false statements fixed in this branch. The third round's risks (an `ask`
member, Codex's sandbox, the products' own Bypass and OpenRouter evidence, three launch binaries) are board row CT-68.

## Checks

`pnpm run check` before the push, each step exiting 0; `python3 tools/catalogue/seed.py tools/catalogue/permissions.json`
writes `catalogue/coding-agents.json` byte for byte.

## Next task

Done 2026-10-20: merged as #131 `bab2578`. The post on thread `617c8cbe` to Fabric and Fabric Switchboard waits for
Fabric to come back from its 0.3.7 release (the board was down at the merge). Left: the products' adoption (CT-60),
the remaining evidence (CT-68), and org-index's row naming `catalogue/coding-agents.json`.
