# 2026-10-23: two asks from the project board (DEC-0109, DEC-0110)

## Objective

Answer the two asks addressed to the contract that had no answer: Fabric Inbox's request on `service.md`'s
no-token `401` (thread `a1c375d2`, request `9ecc43cb`) and the host's sum of a usage report's subscription rows (a
service's finding and Fabric Dashboards' reply on thread `ea2e4f3d`, the request on `f22685d2`).

## Done

- **DEC-0109**: a remote service's no-token `401` on the well-known route carries none of the service's data; the body
  SHOULD be empty and an identity proxy MAY answer with its own page; a host reads the status, never the body
  ([service](../specification/service.md#remote-placement)). CT-114 for the adapter's `check_service.py`.
- **DEC-0110**: money is summed over the usage rows not on a subscription; a subscription row's `costUsd` is an estimate
  shown apart, never in money, a budget or a limit; `usageSpend(rows)` in `src/usage-rules.ts` with tests in
  `test/usage-rules.test.ts` ([service](../specification/service.md#usage-report)). CT-115 for Fabric's spend view.
- DOCMAP's usage row; spend-policy.md, conformance (host and checker rows), CONTEXT, SCN-016, the usage schema's
  descriptions; annotations on DEC-0019, DEC-0021, DEC-0027, DEC-0046; backlog CT-114, CT-115, CT-116.

## Decisions taken here

- The `401` body SHOULD stay empty where the service answers itself; only a proxy's page is admitted beside it.
- No money-only member in `service-usage.schema.json`: a host rule changes no byte a service writes.
- A row with no `route` is money (a report written before DEC-0046 keeps its meaning).

## Open

- CT-114 (the adapter's checker), CT-115 (Fabric's spend view and the adapter's service kit), CT-116 (money per project
  by route). Fabric Dashboards already sums this way (FD-88, 0.7.23).

## Readings

Round 1: one unit break (money 0 with a lower bound beside only unpriced calls) and three product breaks (byProject and
byGrant mixing routes, the annotations on DEC-0019/0021/0027/0046, the conformance host rows), fixed. Round 2: four
product breaks (the adapter's kit writing an estimate into `budget.spentUsd`, a project's money in a window with a
subscription row, the pull request's checks, `usageSpend`'s comment on a missing `unpricedCalls`), fixed; CT-116 filed.
Round 3: five text breaks (the launcher's bound has no `proposal.inputs` member, so `recentSpendUsd` is null; the usage
schema's descriptions said spent; the checker's row split from the host's; CT-116 in the records; the next task's
reference), fixed.
Round 4: three text breaks (a project's bound holds only while its `unpricedCalls` is 0; the checker row's list of
forbidden members against the well-known schema; "spent" in the usage report's opening), fixed; risks fixed: the host
and checker sentence in service.md and the decision, one wording of where an estimate never goes, `recentSpendUsd`'s
description.
Round 5: unit pass; product one break (the SCN-016 alternative's state missing from SCR-13, FLW-10 and the scenario's
states), fixed; risks fixed (the checker matches the document or the service's identity values, DEC-0109's adoption
read as pending, Fabric Dashboards' estimate side in CT-115, the byProject description's sentence).
Round 6: product one break (the checker's test worded three ways), fixed: CT-114, DEC-0109 and service.md state the
conformance row's test. Unit passed in round 5 on the code, unchanged since; the review loop stopped here.

## Checks actually run

`pnpm run check` and `pnpm vectors:check` (output in the pull request).

## Next task

CT-86 (credentials on request and the call record, DEC-0111), then the contract's first release (DEC-0108, branch
`agent/dec0108-release-policy-20261023`, pushed to origin with the release, merged last so its tag lands on the
release's commit).
