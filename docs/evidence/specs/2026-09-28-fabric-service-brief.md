# Brief — local service extension `fabric-service/0.1`, 2026-09-28

Module M1 of the Fabric Dashboards run. The run's full brief, source ledger and
decisions live in `passioncode-ai/fabric-dashboards`
(`docs/evidence/briefs/2026-09-28-brief.md`); this file scopes what this repository
owns.

| REQ | Requirement | Fabric Dashboards REQ | Verified by |
|---|---|---|---|
| REQ-S01 | Normative text: descriptor, well-known document, events feed, operator login, network, lifecycle, surfaces | REQ-01 | [service.md](../../specification/service.md), `pnpm docs:check` |
| REQ-S02 | Schemas for descriptor, well-known document, events page and login code, with positive and negative fixtures | REQ-02 | `test/fixtures.test.ts`; negative fixtures watched failing against a planted schema defect on 2026-09-28 |
| REQ-S03 | Cross-object rules: identity match, port and id claims, ready without degraded, command paths | REQ-02, REQ-10 | `test/service-rules.test.ts` |
| REQ-S04 | Single-instance and state rules stated as MUST | REQ-03, REQ-04 | [service.md](../../specification/service.md) → *Lifecycle* |
| REQ-S05 | Token handling: file 0600, header only, login code, never in a page | REQ-05 | [service.md](../../specification/service.md) → *Operator login*, *Authentication and network* |

Decision: DEC-0015. Coordination: the decisions register was edited under a git lease;
id reservation was `ungated` (Notion record plane unreachable).
