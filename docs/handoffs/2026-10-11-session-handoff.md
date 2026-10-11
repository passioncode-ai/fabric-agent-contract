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
- Fixtures: 6 positive, 9 negative (catalogue), 19 semantic; `test/session-handoff.test.ts`, and
  `test/session-handoff-review.test.ts` (one case per rule message, the reader, the copied matcher).
- `CONTEXT.md` (Session handoff), `docs/DOCMAP.md`, `README.md`, `docs/evidence/sources.md` (Claude Code
  2.1.296, Switchboard launch in place), the conformance register and a reader row.

## Checks run

- `pnpm run check` → exit 0 (see the pull request for the test count).
- 20 planted defects, each watched turning the suite red, listed in the pull request; two first survived (a
  fixture caught by a second rule, a negative refused for the wrong reason) and their tests were tightened.
- Review fixes (owner session, after the rebase on `7931c1d`): gate green — 25 test files, 847 tests, UX lint,
  docs check, markdownlint 0 errors. Planted, each watched failing then restored:

  | Plant | Failed |
  |---|---|
  | entries a plain object (`__proto__`) | 1 of 101 |
  | the bearer pattern unanchored | 1 |
  | the tool name unescaped | 1 |
  | the folder's digest from the UTF-8 text | 1 of 102 |
  | every header counted as a secret | 1 |
  | no real path for the repository check | 2 |
  | no rule for another server's standing key | 2 |
  | no agent-key check on the first call | 2 |
  | no `Bearer …` inside an argument | 3 |
  | no size cap | 1 |
  | the lstat guard and `O_NONBLOCK` both gone (either alone keeps a FIFO unread) | 1 of 102 |
  | `launch.runtime` a free pattern again | 1 of 319 (fixtures) |

  The message test fails for any rule message no case produces.
- Second review (of `e4a2a37`), fixed in the next commit: another server's every non-plain header is a credential
  (Fabric's `x-agw-key`), a delegation token is checked for its shape and `typ`, the first server carries no other
  credential, `Bearer <token>` needs a digit, only a path or URL is split at its separators, the runtime enum equals
  runners.md's list, and the message test counts every call. Planted, each failed then restored:
  other-server headers not all counted (1 of 107); `typ` unchecked (1); the first server's extra credential allowed
  (2); `Bearer` prose without a digit (1); every piece split at `/` (1); nothing split (3).

## Open

- Fabric: its writer on `agent/w2-handoff` vendors this schema and `src/session-handoff.ts` and runs the checker
  on a folder per adapter. It does **not** conform yet: it puts gateway servers with `x-agw-key` role keys in
  `mcp.json`, which SH-9 refuses. Fabric drops them and the `FABRIC_AGW_KEY` path; its conformance test
  `apps/desktop/test/session-handoff-conformance.test.mjs:127-131` moves from `todo` to required. Then it repins
  to this change's merge commit.
- Fabric Dashboards: its pack conforms after this merges (the list of changes is relayed to fabric-dashboards-76).
- Codex over a bearer (`bearer_token_env_var`) has no writer; the first writer measures it.

## Next task

Fabric repins its vendored schema and `src/session-handoff.ts` to this change's merge commit on
`agent/w2-handoff`. Its writer puts the session bearer in `mcp.json` and, on other servers, only delegation tokens
minted for the session. Fabric Dashboards conforms its pack.
