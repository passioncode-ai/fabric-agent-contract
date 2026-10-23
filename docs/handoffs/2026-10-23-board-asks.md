# 2026-10-23: two asks from the project board (DEC-0109, DEC-0110)

## Objective

Answer the two asks addressed to the contract that had no answer: Fabric Inbox's request on `service.md`'s
no-token `401` (thread `a1c375d2`, request `9ecc43cb`) and the host's sum of a usage report's subscription rows (Frame
Agent's finding and Fabric Dashboards' reply on thread `ea2e4f3d`, the request on `f22685d2`).

## Done

- **DEC-0109**: a remote service's no-token `401` on the well-known route carries none of the service's data; the body
  SHOULD be empty and an identity proxy MAY answer with its own page; a host reads the status, never the body
  ([service](../specification/service.md#remote-placement)). CT-114 for the adapter's `check_service.py`.
- **DEC-0110**: money is summed over the usage rows not on a subscription; a subscription row's `costUsd` is an estimate
  shown apart, never in money, a budget or a limit; `usageSpend(rows)` in `src/usage-rules.ts` with tests in
  `test/usage-rules.test.ts` ([service](../specification/service.md#usage-report)). CT-115 for Fabric's spend view.
- DOCMAP's usage row; backlog CT-114, CT-115.

## Decisions taken here

- The `401` body SHOULD stay empty where the service answers itself; only a proxy's page is admitted beside it.
- No money-only member in `service-usage.schema.json`: a host rule changes no byte a service writes.
- A row with no `route` is money (a report written before DEC-0046 keeps its meaning).

## Open

- CT-114 (the adapter), CT-115 (Fabric). Fabric Dashboards already sums this way (FD-88, 0.7.23).

## Checks actually run

`pnpm run check` and `pnpm vectors:check` (output in the pull request).

## Next task

CT-86 (credentials on request and the call record), then the release DEC-0108 names.
