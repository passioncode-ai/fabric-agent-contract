# 2026-10-20: the coding-agent catalogue (DEC-0093, CT-60)

## Objective

One list of coding agents for every product (Fabric's OF-11 on thread `617c8cbe`), as the contract's data.
Brief: `docs/evidence/specs/2026-10-19-runner-catalogue/brief.md`.

## Done

- `schemas/coding-agents.schema.json` (`coding-agents/1`, in the revision register) and `catalogue/coding-agents.json`:
  30 agents, Fabric Switchboard's list of 2026-10-19 without machine state, written by `tools/catalogue/seed.py`.
- Permission arguments for five agents, each with its evidence (`tools/catalogue/permissions.json`): Claude Code from
  its documentation; Codex, Gemini CLI, Cline and Cursor measured from the installed agent's `--help`.
- Ids are DEC-0046's runner kinds (`cursor-agent`, `kiro`), Switchboard's names kept as `aliases`.
- `test/coding-agents.test.ts`; the runners page section; DEC-0093; DOCMAP, README, CONTEXT; backlog CT-60.

## Decisions

- An argument that skips approval is recorded only from the maker's documentation or the agent's own output.
- No OpenRouter or proxy variable names are recorded yet: Switchboard's request names the fields, and each entry gets
  them when its maker's documentation is read.

## Open

- More measured permission arguments and OpenRouter recipes, one agent at a time with evidence.
- `runner` entries (C2) inside the catalogue, where a host measured one.

## Checks

`pnpm run check` before the push, each step exiting 0; `python3 tools/catalogue/seed.py tools/catalogue/permissions.json`
writes `catalogue/coding-agents.json` byte for byte.

## Next task

Readings, merge, then post the merge commit on thread `617c8cbe` to Fabric and Fabric Switchboard.
