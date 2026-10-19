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
  `readsNullUsage`, `usageFindings`, `jobLimitRules`; every function answers and never throws. The revision
  `fabric-interop/0.2` in `src/protocol-revisions.ts`; `_meta.protocols` in `interop-request-meta.schema.json`.
- **Rules (REQ-04, REQ-05):** `FAC-SEM-119` (kinds `interop-job`, `usage`) and `FAC-SEM-120` (kind `job-caller`),
  dispatched from `src/semantic-rules.ts`.
- **Vectors (REQ-06):** `fixtures/vectors/job-limits.json`, written by `tools/vectors/job-limits.ts --write`, expected
  values by hand, nothing imported from the module: 28 pause, 37 caller, 13 key, 8 usage and 5 reader cases; the test compares the
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
- **Plants (REQ-10):** 40 on the first cut, each killed after two survivors were closed, and 16 after the first readings (56 in all; one equivalent, argued):
  [`plants.md`](../evidence/specs/2026-10-19-job-limits/plants.md).

## Decisions

DEC-0087 ([register](../DECISIONS.md)), with its *Choices made in implementation*.

## Checks

`pnpm run check` at the second fix round's code, each step exiting 0: typecheck; `vitest run --coverage` 76 files, 5762
tests, branches 7445 / 7518 with `src/job-limits.ts` at 133 / 133; UX lint passed (31 scenarios); documentation checks
passed, lint-md 0 errors; privacy-check 0 findings.

The first cut's vectors named a private agent as the example intent (`3be94d4`, pushed on this branch); the privacy
check caught it on the fix round's run and the vectors now use `example-media.default`. The earlier commit stays in the
branch's history; the repository's rule is not to rewrite history (CT-46).

## The first readings (2026-10-19)

Three blind readings of `3be94d4`: unit fail, seam fail, product fail. Every finding was fixed on this branch:

- unit: the 500-character cap counted UTF-16 units while the schema counts code points (an astral message read as
  malformed); instants with sub-millisecond fractions compared at millisecond precision; an `error` the schema refuses
  was acted on; inherited members were read; a blank pause text was accepted. Now: code points, at most three fraction
  digits, `invalid` for a refused `error`, own members only, a text that is not only white space;
- seam: the interim (`notVerified`) collided with `FAC-SEM-001`; `service.md` promised "the same numbers"; a result's own
  usage was not checked; the positive sweep skipped `interop-job`; Fabric's hub already answers `outcome-unknown`; the
  act on `invalid` was undefined; the gate was worded per reader. Now: the interim writes the lower bound with nothing
  in `notVerified`; service.md says token totals become a lower bound; `FAC-SEM-119` runs under kind `result`; the
  sweep and the tolerance test read `interop-job`; DEC-0087 names the hub; `invalid` keeps polling;
- product: the ruling's revision was dropped; the provider's answer to a repeated key, the principal in the key, the
  spend window (`limit-reached`) and the MCP Task route were unstated; `partial` was worded five ways; the adapter's
  guidance disagreed; no UX scenario. Now: `fabric-interop/0.2` named in `_meta.protocols` is the gate; item 6 (a
  repeated key, keys per authenticated caller); `limit-reached` stays DL-19's with the act `person`; the MCP Task route
  is in *Not decided here*; one wording of `partial`; the adapter's guidance correction in CT-55; SCN-031.

## The second reading (2026-10-19)

One blind reading of `10554d6..98be038` closed 18 of 19 claims and found two contradictions: after a `limit-reached`
approval the caller resent under the same key while the provider's rule answered that key with its ended job (now: such
a key admits the intent again once its approval is granted), and `common.schema.json`'s `usage` description still named
the pin gate (now: the revision a caller names). Its follow-ups are closed with them: the `limit-reached` vector carries
DL-19's data, the pause text's white space is ASCII (space, tab, line feed, carriage return) with no-break space and
byte-order mark vectors, "never 0" names the `fabric-interop/0.1` exception, `invalid` keeps polling only a `working`
job, the brief marks its first-cut decisions superseded, and the title, DOCMAP, README and OQ-0012 name
`fabric-interop/0.2`. Merge by squash, so the first cut's commit with a private agent's name stays out of `main`'s
history.

## Open

- Each consumer adopts at its next pin (CT-55), readers of `usage` first.

## Next task

Run one more blind reading of the fix round (`3be94d4..HEAD`), merge PR #120, then on the project board: a request to
Fabric (the hub as caller on `agent.call` and keeper of its `outcome-unknown` keys, its host as reader of `usage`), to
fabric-agent-adapter (its kits as providers, callers and readers; its guidance correction; C4 stays its guidance) and to
Fabric Dashboards (reader of `usage`), and a note to the job-capable providers on this machine.
