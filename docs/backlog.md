# Local backlog

This is the canonical status source for the tasks below. Keep stable IDs, close with a
receipt in Source, and retain closed rows. The workspace derives its common backlog
from [backlog-sources.json](backlog-sources.json). Dated handoffs remain historical evidence.

The reviewed contract questions are resolved by DEC-0017. The possible permissive schema
exception belongs to the cross-repository licensing decision CO-KB-02; it is not duplicated here.

| ID | Item | Status | Source |
|---|---|---|---|
| CT-01 | Decide whether `service.md` "One copy" names the supervised-lock wait: under launchd (`FABRIC_SERVICE_SUPERVISOR=launchd`) the adapter kit backs off in-process for up to 300 s and exits 75 only when the wait runs out, which delays the MUST-exit-75 rule rather than replacing it | open: needs a decision record (reserve the next `DEC` id with `agent_sync.py reserve DEC`); until then the adapter keeps the current pin, which the back-off satisfies. Goal: reliable-work | [fabric-agent-adapter PR #28 "Not fixed here"](https://github.com/passioncode-ai/fabric-agent-adapter/pull/28); [service.md "One copy"](specification/service.md) |
