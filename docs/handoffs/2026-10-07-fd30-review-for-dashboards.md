# FD-30 estate updater — read-only review, origin/main d8c6d67 (2026-10-07)

Reviewer: session fabric-agent-contract-3f (Claude), reviewing the Kimi Code run of 2026-10-07.

1. BLOCKER — npm/npx not found in the packaged app: estate-updater.ts:81 spawns bare git/npm/npx via runOwned with commandEnv() (children.ts:15-19,60); the running app has PATH=/usr/bin:/bin:/usr/sbin:/sbin. main.log: `estate_check failed npm view sshlg-skills version failed: spawn npm ENOENT` 02:35:36, 03:20:36, 08:34:06. npm also needs node on PATH; `sshlg-skills update` calls `claude` too. The console already resolves the login-shell PATH (console.ts:169-170, runtimes.ts:89-96). Fix: login-shell PATH for every estate run + a test that PATH reaches the runner. (= FD-33)
2. MAJOR security — update runs whatever npx resolves: estate-updater.ts:237 `npx --yes sshlg-skills update` (no version; a bare name accepts any installed copy), :240 records `installed: latest`. Fix: run `sshlg-skills@<checked version>` and record that version.
3. MAJOR security — publisher check weaker than prior art and mis-parses multiple maintainers: estate-update.ts:101-115 only "contains ssheleg", ignores _npmUser, accepts prereleases; `npm view x maintainers` prints a JS-ish array for several maintainers. Fix: `npm view sshlg-skills@<v> version maintainers _npmUser --json`, every maintainer + publisher on an allowlist, plain x.y.z only.
4. MAJOR — short-hash pins always "behind": pinState exact compare (estate-update.ts:85-88); SOURCE.txt pins `main @94b1829` = tip. Fix: prefix compare ≥7 chars + test from the real file text.
5. MAJOR — failed skills check shows as harmless "unknown" (estate-updater.ts:216; Settings.tsx). SCN-051 promises "could not be checked". Fix: `error` state.
6. MAJOR — default setup never reports: record only written by the app's own update (:219, :240). Fix: read the installed version from the real install (plugin versions / launcher state).
7. MAJOR UX — clone-path field drops `~/…` (settings.ts:127-131) while the placeholder suggests it; ClonePath useState never resyncs; no check after change. Fix: expand ~ in main, show a validation error, resync, check on change.
8. MAJOR docs/security — SECURITY.md "What the app touches" lacks registry.npmjs.org, GitHub ssh, running git/npm and npx-downloaded code; AGENTS.md lacks estate (LC-09 inventory, idle budget, estate-skills.json); ADR-0018:65 "at most two child processes per 6 h" — actual up to 7.
9. MAJOR (operator decision) — estate.enabled defaults to true (types.ts:102) in a public product; every install queries npm for sshlg-skills every 6 h. Options: default off / on only when the family is detected; disclose in SECURITY.md.
10. MINOR — failed update logged as a clean check (applySkills failure :248 not in failures; no LC-16 retry); "? installed".
11. MINOR — stop() only clears timers (:96-99); a running check can spawn after killOwned; armRetry checks the settings switch, not a stopped flag (:160); logout kills npx with 300 ms grace (main.ts:605-608). Fix: `stopped` flag.
12. MINOR — any remote URL containing `fabric-agent-contract` counts (estate-update.ts:49). Fix: normalize and compare to passioncode-ai/fabric-agent-contract (https and ssh).
13. MINOR — git unattended without GIT_TERMINAL_PROMPT=0 / ssh BatchMode; clone hooks run; /usr/bin/git shim dialog without CLT; `rev-parse main` ambiguous → `--verify refs/heads/main`.
14. MINOR semantics — fetch never moves local main, so "behind" stays forever; ahead/diverged labelled behind (estate-update.ts:69-74). Compare refs/remotes/origin/main after fetch.
15. MINOR coverage — only three hard-coded consumers; ~10 repos carry fabric-contract.lock.json; pins read from the checked-out branch. Fix: discover */fabric-contract.lock.json; read origin/main via git show.
16. MINOR UI — missing folder reported as "not a clone"; fetch result never shown; ↑ glyph untranslated.
17. DOC — backlog FD-30 says 21 and 23 tests, branch named as unmerged, no "released in 0.6.4"; HANDOFF FD-30 "Next task: review and merge"; ADR-0018/SCN-051/CHANGELOG say events reach the activity log (LC-12) — they go only to main.log; SCN-051 "nothing runs without a clone" — npm view still runs; no estate e2e test exists.

Verified correct: whenReady start / will-quit stop; cadence 90 s → retry 45 min → 6 h (field log); unref'd timers, no double arm, `checking` guard; argv without shell, own process group, 30 s / 10 min timeouts, ELECTRON_RUN_AS_NODE/NODE_OPTIONS stripped; clone path cannot be read as an option; pin readers match the real files; parseLsRemote; PR #39 bootstrap writes the record only on exit 0 (atomic, 0600); 22 estate i18n keys EN/RU.
Checks: export of d8c6d67, `FD_SKIP_LAUNCHD=1 npm run check` — 314 tests, 313 pass, 1 skip; estate tests 23/23.
