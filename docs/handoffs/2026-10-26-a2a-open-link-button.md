# 2026-10-26: the A2A Agent Card, links to a service's pages, Fabric's button in the page's language

## Objective

Answer the three asks the project board made of the contract with a date (CT-131 and CT-130 by 2026-10-31, CT-148 by
2026-11-01), close the contract's board debts (CT-135) and the flaky test (CT-144), then release the result.

## Done

- **CT-131, DEC-0122** (PR #187, merge `7044eb0a`). `surfaces.a2a` `{path, protocolVersion}` names a service's A2A Agent
  Card ([service](../specification/service.md#a2a-agent-card)).
  - The public card answers without the token on a local placement.
  - An A2A interface never accepts the descriptor's token; peers use the service's own credentials or delegation tokens.
  - A Fabric extension in the card carries `required: false`.
  - `ai-catalog.json` (SEP-2127) stays out of `fabric-service/0.1`.
  - Two rounds of blind readings; the first found the descriptor token offered to peers, uncatalogued fixtures and the
    loopback card without a reason.
  - Board answer `28fd7552` (thread `2587bdd2`); RM-17 updated in fabric-workspace (#450, `4c38d0b7`).
- **CT-130, DEC-0123** (PR #188, merge `9efcc222`). A person opens a service's page through Fabric Dashboards'
  `open_link` ([PL-1 to PL-4](../specification/service.md#page-links)).
  - The raw address is a diagnostic, or the action only where the host is `not_installed` or `unsupported`.
  - `FAC-SEM-143` covers kind `page-link` and URL-mode input requests.
  - The reference is `src/page-link-rules.ts`; `dashboardsLink` matches the host's `serviceLink` byte for byte.
  - The vectors are `fixtures/vectors/page-links.json`; the scenario is SCN-044.
  - Four rounds of blind readings, the last two by a differential against Fabric Dashboards at `a98d1ae`.
  - Board answer `7cf82189` on the request `886c9b4d`.
- **CT-148, DEC-0124** (this pull request). FB-3's name, FB-4's items and FB-5's sentence follow the page's language.
  - *Fabric* stays in English.
  - FB-5's sentence lost its dash.
  - A page's own words keep *Fabric* inside the name (WCAG 2.2 SC 2.5.3).
  - Two product readings.
- **CT-135:** the roll call `05a8d09b` was answered (`6e70dee0`). The adoption ask `03af18c0` was routed to the
  plan's owner, Fabric (`911a2c08`, `6ad918ab`).
- **CT-144:** the CT-109 property test carries an explicit 30 s limit.
- **The adapter's `_meta.decision` question** (`2b0a31ff`) was answered (`e414b210`). The contract names no
  argument form, and a coding agent relays through `agent.call` (CT-125), an elicitation, or the page's `open_link`.
- **Q-02, Q-05 to Q-09:** closed by fabric-workspace under the mandate (MD-6). Q-03 is assumed
  ([questions](../evidence/specs/2026-10-25-first-organization-questions.md)).

## Filed

- CT-145: adoption of DEC-0122.
- CT-146: a pair rule for a card named twice, and the loopback card no manifest can name.
- CT-147: adoption of DEC-0123.

## Checks run

`pnpm run check` before each merge:
- `bf4f8162`: 8845 tests;
- `57a642d3`: 8915 tests;
- this branch: 8915 tests.

Every run had typecheck clean, UX lint passed, docs:check `0 error(s)`, privacy `0 finding(s)`, and exit 0.

## Open, with owners and dates

| What | Owner | When |
|---|---|---|
| CT-142, the operator's mandate along the chain (a DEC over DEC-0121) | the contract | 2026-11-01 |
| CT-122, unlinkable memberships, and CT-137, membership attestation | the contract | 2026-11-06 |
| CT-143, the family | the contract | 2026-11-07 |
| CT-128, the blind readings of DEC-0121 | the contract, after the limit resets | after 2026-10-30 |
| CT-42, the live Claude to Codex board smoke | fabric-agent-adapter (thread `c06f2991`) | its answer |
| CT-124 and CT-125 (DEC-0121 relays) | the adapter (0.50.0) and Fabric's hub | 2026-10-30 and later |
| CT-145, CT-147, DEC-0124 adoption | the adapter, Fabric Dashboards, Fabric | their next pins |

## Next task

Release `v0.1.0+2026-10-26` on the merge of this pull request (DEC-0108): an annotated tag and a GitHub release
listing DEC-0122 to DEC-0124. Then CT-142's decision, due 2026-11-01.
