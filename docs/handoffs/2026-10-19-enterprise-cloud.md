# Handoff: DEC-0088, `enterprise-cloud` in `entitlement/1` (2026-10-19)

## Objective

passioncode-platform asked (board thread `c7d8f53d`, 2026-10-19) for a third hosting product, `enterprise-cloud`,
under the operator's SD-2 (Enterprise is a tier paid as its own dedicated cloud) and its ADR-0008 D-3 (PLAT-063). The
reference verifier refused any product but `org-cloud` and `personal-cloud`. Row CT-59, branch
`agent/ct59-enterprise-cloud-20261019`.

## Done

- `schemas/entitlement.schema.json`: `hosting.product` admits `enterprise-cloud`; the organization's condition admits
  `org-cloud` or `enterprise-cloud`.
- `src/entitlement.ts`: `HOSTING_PRODUCTS` gains it; `ORG_HOSTING_PRODUCTS` is what an `org:` subject may carry;
  `verifyEntitlement`'s subject check and `FAC-SEM-115` read it.
- Vectors (`tools/vectors/entitlement.ts --write`): a valid organization's `enterprise-cloud`; `malformed` for a
  personal `enterprise-cloud` and for an unknown product. Fixtures: positive `entitlement-enterprise-cloud`, negative
  `entitlement-unknown-hosting-product`, semantic `entitlement-personal-enterprise-cloud`; the existing
  `entitlement-org-personal-cloud` now fails on `enum`.
- Spec: `docs/specification/entitlement.md` (the field table, EN-2, `FAC-SEM-115`, *Enterprise cloud*, the issuer's
  duties, *Not decided here*), `docs/specification/conformance.md` (the issuer row); DEC-0088; CT-59.

## Decisions

DEC-0088: `size` stays opaque and nothing else is added. The dedication is the product; a service level (SLA) and a
region are the order's until a verifier must check them; `support.tier` keeps its DEC-0085 meaning (what the
organization's admin agents may do), so no service level is written there. The issuer sends `enterprise-cloud` only to a
verifier whose owner confirmed its re-vendor on thread `c7d8f53d`.

## Plants

Each clause was removed once and the focused tests (`test/entitlement.test.ts`, `test/fixtures.test.ts`) were run; 6
plants, each killed: an organization's `enterprise-cloud` refused by the verifier (E-01); a personal one admitted by the
verifier (E-02) or the rule (E-06); the rule not checking an organization's product (E-03); the schema's `enum` without
it (E-04); the schema's organization condition admitting any product (E-05); after the reading, the schema's personal
condition admitting it (E-07, killed by a new case in the personal-lines test).

## The reading (2026-10-19)

One blind reading found one blocker: the first text said the service level is `support.tier`, which DEC-0085 defines as
what the organization's admin agents may do. Now the SLA is the order's, `support.tier` keeps its meaning, and both
are in *Not decided here* beside the region. Also closed: the positive fixture is signed as the vectors are (a test
verifies it), DEC-0085 carries the amendment note and DEC-0088 names item 3, the issuer's duty is in *The issuer's
duties* and the conformance issuer row (the verifier's owner confirms its re-vendor on thread `c7d8f53d`), and the
retro counts readings in one unit.

## Checks

`pnpm run check`, each step exiting 0: typecheck; 76 files, 5773 tests; UX lint passed; documentation checks passed,
lint-md 0 errors; privacy-check 0 findings, run after the commit as well (the retro's learning of 2026-10-19).

## Next task

Done on 2026-10-19: PR #122 merged at `0752e03`; the merge was posted on thread `c7d8f53d` (message `7079cf78`), asking
the first organization server to post its re-vendor commit there. Next: CT-57 (folder attribution), due 2026-10-22.
