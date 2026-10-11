# Handoff — session handoff (`session-handoff/1`, DEC-0042)

## Objective

One format for the folder a host hands a coding-agent session before its first turn, shared by Fabric
(per-session bundle), Fabric Dashboards (console pack per agent key) and Switchboard (which carries the
arguments in place). Fabric 0.4.0 REQ-06, Fabric ADR-0140, plan canvas C3; agreed with Dashboards
(fabric-dashboards-76) on 2026-10-11.

## Done

- DEC-0042 in `docs/DECISIONS.md`; the profile `docs/specification/session-handoff.md` (SH-1…SH-13): the folder
  in user data and never in a repository, 0700/0600, `handoff.json` + `context.md` + `mcp.json` + the declared
  `brief.md`/`task.md` and nothing else; a bearer only per session; the preamble naming one first tool
  (`fabric_whoami` / `service_context`) and no rule; the brief inline (≤ 1000 characters, one line) or as a
  file; `mcp.auth` `bearer`/`none`; `mcp.strict`; the launch's limits (16 × 1024, no control character, no
  credential); the per-runtime table (`claude-code` joined `--mcp-config=`, `codex`, `kilo`, `hermes`,
  `kimi-code`, `cline`); `execution-packet/1` underneath (`integrity`); a secret only in `mcp.json`.
- `schemas/session-handoff.schema.json`; `src/session-handoff.ts` (`validateSessionHandoff(dir)`,
  `readSessionHandoff`, `checkSessionHandoff`, `sessionHandoffManifestFindings`), dependency-free so a consumer
  copies it; `FAC-SEM-053`…`055` wired into `evaluateSemanticRules` (kinds `session-handoff`,
  `session-handoff-folder`).
- Fixtures: 6 positive, 8 negative (catalogue), 19 semantic; `test/session-handoff.test.ts`.
- `CONTEXT.md` (Session handoff), `docs/DOCMAP.md`, `README.md`, `docs/evidence/sources.md` (Claude Code
  2.1.296, Switchboard launch in place), the conformance register and a reader row.

## Checks run

- `pnpm run check` → exit 0 (see the pull request for the test count).
- 20 planted defects, each watched turning the suite red, listed in the pull request; two first survived (a
  fixture caught by a second rule, a negative refused for the wrong reason) and their tests were tightened.

## Open

- Fabric: the reference writer conforms on its branch `agent/w2-handoff` (vendors this schema and
  `src/session-handoff.ts`, runs the checker on a folder per adapter); it repins to this change's merge commit.
- Fabric Dashboards: its pack conforms after this merges (the list of changes is relayed to fabric-dashboards-76).
- Codex over a bearer (`bearer_token_env_var`) has no writer; the first writer measures it.

## Next task

Merge this pull request (owner session fabric-agent-contract-75), then repin Fabric's vendored contract
fixtures to the merge commit.
