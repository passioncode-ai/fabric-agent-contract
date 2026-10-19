# Handoff: DEC-0087, jobs under limits and uncertain effects (2026-10-19)

## Objective

Close OQ-0012 (board row CT-55): a job a limit stopped or paused, a job whose effect may have happened, what a caller
does with each, the key a resend carries, and unknown as `null` in `usage`. The brief,
[`brief.md`](../evidence/specs/2026-10-19-job-limits/brief.md), holds the source ledger, the decisions and the REQ
table; this run implements it on branch `agent/ct55-job-limits-20261019`.

## Done

- **Schemas (REQ-01, REQ-02):** `interop-common.schema.json`: `error` constrains `data` for `quota-exhausted`
  (`#/$defs/quotaExhaustedData`, closed; `#/$defs/utcInstant`); `common.schema.json#/$defs/usage`: `null` for each
  count, `costUsd` and `wallMs`, optional `partial`.
- **Code (REQ-03):** `src/job-limits.ts`: `quotaDataOk`, `readJobPause`, `jobCallerAction`, `intentIdempotencyKey`,
  `usageFindings`, `jobLimitRules`; every function answers and never throws.
- **Rules (REQ-04, REQ-05):** `FAC-SEM-119` (kinds `interop-job`, `usage`) and `FAC-SEM-120` (kind `job-caller`),
  dispatched from `src/semantic-rules.ts`.
- **Vectors (REQ-06):** `fixtures/vectors/job-limits.json`, written by `tools/vectors/job-limits.ts --write`, expected
  values by hand, nothing imported from the module: 20 pause, 31 caller, 12 key and 8 usage cases; the test compares the
  file with the generator and runs the caller and pause cases in UTC, America/St_Johns and Pacific/Kiritimati.
- **Schema against the reference (REQ-07):** 13 mutations of `quota-exhausted`'s data get the schema's verdict from
  `quotaDataOk` and `jobCallerAction`.
- **Fixtures:** positive `interop-job-quota-exhausted`, `-quota-exhausted-person`, `-paused`, `-outcome-unknown`,
  `-usage-unknown`; negative `interop-job-quota-exhausted-no-data`, `-reset-not-retryable`, `-reset-offset`,
  `-extra-data`, `interop-job-usage-partial-not-boolean`, `-usage-negative`; semantic `fixtures/semantic/job-limits-*`.
- **Docs (REQ-08, REQ-09):** interop.md *Limits and uncertain effects* and its rule rows; results-and-evidence.md
  (`usage`); conformance (three rows, two register rows, next free `FAC-SEM-121`); CONTEXT (quota exhausted, outcome
  unknown, intent key); DOCMAP, README; sources.md (RFC 9562); DEC-0087; OQ-0012 resolved; CT-55 with each consumer's
  duty.
- **Plants (REQ-10):** 40, each killed after two survivors were closed:
  [`plants.md`](../evidence/specs/2026-10-19-job-limits/plants.md).

## Decisions

DEC-0087 ([register](../DECISIONS.md)), with its *Choices made in implementation*.

## Checks

`pnpm run check` on the branch's code, each step exiting 0: typecheck; `vitest run --coverage` 76 files, 5719 tests,
branches 7431 / 7504 with `src/job-limits.ts` at 121 / 121; UX lint passed; documentation checks passed, lint-md 0
errors; privacy-check 0 findings.

## Open

- Each consumer adopts at its next pin (CT-55), readers of `usage` first.

## Next task

Open the pull request, run the independent readings (unit, seam, product), merge, then on the project board: a note to
Fabric (the hub as caller on `agent.call`, its host as reader of `usage`), to fabric-agent-adapter (its kits as
providers, callers and readers; C4 stays its guidance) and to Fabric Dashboards (reader of `usage`).
