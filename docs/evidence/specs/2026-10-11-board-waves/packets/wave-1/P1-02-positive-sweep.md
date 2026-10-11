# P1-02 — every positive fixture passes the semantic rules

- **Node:** N02 gate · **REQ:** REQ-07 · **Wave:** 1
- **Closes:** F-B-201. Its receipt is in [inventory.json](../../inventory.json).

## Why

No test runs the semantic rules over the positive fixtures. A rule can refuse the repository's own valid
example and the suite stays green. FAC-SEM-012 (`src/semantic-rules.ts:106-111`, regex `/^(~\/|\/)/`) refuses
`fixtures/positive/service-descriptor-task-scheduler.json` `commands.doctor[0]`
(`C:\Users\example\…\example-agent.exe`), which DEC-0032 made valid.

## What to build

1. `test/positive-sweep.test.ts` (new). For every entry of `fixtures/catalogue.json` that is positive (read
   the catalogue's shape and the existing `test/fixtures.test.ts` to find how positive entries and their
   document kinds are named), run `evaluateSemanticRules(kind, document)`, or the repository's equivalent
   entry point, and expect no finding. A fixture that is schema-valid but meant to fail a semantic rule
   belongs under `fixtures/semantic/`, not `positive/`. If one turns up, report it rather than exempting it.
2. FAC-SEM-012 accepts the executable forms DEC-0032 admits:
   - POSIX absolute `/…` and home-relative `~/…`;
   - Windows drive-absolute `[A-Za-z]:[\\/]…` and `~\…`;
   - the same grammar as `localPath` in `schemas/service-common.schema.json`: read it and reuse the pattern,
     do not invent a second one.

   It keeps refusing bare names, relative paths and UNC (`\\server\share`, `//server/share`).
3. `docs/specification/service.md`: the command-path sentence (around line 70) and the FAC-SEM-012 row (around
   line 527) name the Windows forms. Read `docs/specification/conformance.md`'s rule-code register: if it
   restates FAC-SEM-012's grammar, align it. That file is guarded, so take the lease.
4. Negative cases in `test/service-rules.test.ts`: a Windows bare name `example-agent.exe`, a relative
   `.\bin\x.exe` and UNC `\\srv\share\x.exe` are refused; `C:\…` and `~\…` are accepted.

## Proof

- Before the fix the sweep fails on `service-descriptor-task-scheduler` with FAC-SEM-012. Record that output.
- Plant: restore the old regex, and both the sweep and the new accepted-forms case fail.
- If the sweep turns up other positive fixtures that a rule refuses, list each with its finding in your
  report and fix the rule only when the fixture is unambiguously valid under a decision (cite it). Otherwise
  stop and report: the owner session decides.

## Files you own

`test/positive-sweep.test.ts`, `src/semantic-rules.ts` (FAC-SEM-012 only), `test/service-rules.test.ts`,
`docs/specification/service.md` (the two FAC-SEM-012 places), `docs/specification/conformance.md` (only if it
restates the grammar; lease).
