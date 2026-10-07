# Local backlog

This is the canonical status source for the tasks below. Keep stable IDs, close with a
receipt in Source, and retain closed rows. The workspace derives its common backlog
from [backlog-sources.json](backlog-sources.json). Dated handoffs remain historical evidence.

The reviewed contract questions are resolved by DEC-0017. The possible permissive schema
exception belongs to the cross-repository licensing decision CO-KB-02; it is not duplicated here.

| ID | Item | Status | Source |
|---|---|---|---|
| CT-01 | Decide whether `service.md` "One copy" names the supervised-lock wait: under launchd (`FABRIC_SERVICE_SUPERVISOR=launchd`) the adapter kit backs off in-process for up to 300 s and exits 75 only when the wait runs out, which delays the MUST-exit-75 rule rather than replacing it | open: needs a decision record (reserve the next `DEC` id with `agent_sync.py reserve DEC`); until then the adapter keeps the current pin, which the back-off satisfies. Goal: reliable-work | [fabric-agent-adapter PR #28 "Not fixed here"](https://github.com/passioncode-ai/fabric-agent-adapter/pull/28); [service.md "One copy"](specification/service.md) |
| CT-02 | Renumber DEC-0025's rules (branch `agent/settings-backup-standard`, PR #16): its `FAC-SEM-028` (settings-backup checksum) and `FAC-SEM-029` (feed-client token header) collide with main's runner-route rules; take two codes with `agent_sync.py reserve SEM` when the branch is rebased | done 2026-10-08 — main merged into `agent/settings-backup-standard` and the rules renumbered `FAC-SEM-035` (settings-backup integrity) and `FAC-SEM-036` (feed-client token header) with `agent_sync.py reserve SEM` (receipts SEM-0035, SEM-0036); G-13 green; lands with PR #16. Goal: interoperability | [DEC-0029](DECISIONS.md) §8; [conformance.md](specification/conformance.md#semantic-rule-codes) |
| CT-03 | Consumers adopt DEC-0026 and DEC-0029: Fabric resolves routes at the launch seam and journals `runner-route-event`s (CO-223, ADR-0125); Fabric Dashboards shows route events; the adapter reports the closed probe results | open: each consumer repins by its own release (DEC-0016). 2026-10-07: Fabric shipped the host-order step (fabric PR #19, `277add0`, ADR-0125 — fallback order, contract probe results, attach boundary); still open there: the pinned contract route and its journal events. Rows filed: Switchboard SB-82, adapter FAA-11 (renumbered from FAA-10 on 2026-10-08; FAA-10 is the adapter's A2A plan), Inbox B-61. Goal: interoperability | [DEC-0029](DECISIONS.md); [runners.md](specification/runners.md#runner-routes) |
