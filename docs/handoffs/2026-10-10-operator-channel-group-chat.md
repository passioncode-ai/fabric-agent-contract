# Operator channel in a shared group (DEC-0035)

Branch `agent/dec-operator-channel-group-chat-20261010`, cut from `origin/main` at `73c7978`.
Objective: make `fabric-operator-channel/0.1` behave correctly in a group the operator shares
with several agents' bots. Each bot answers only what is addressed to it, and a channel nobody
receives on is reported instead of silent.

## Completed source work

- [Operator channel spec](../specification/operator-channel.md), *Group chats and liveness*:
  OC-14 (silent by default in a group), OC-15 (what "addressed" means; bare commands only in a
  private chat; a bare `/link CODE` only when it matches this agent's own code), OC-16 (one short
  answer to addressed wrong input; built to receive every group message as an administrator),
  OC-17 (a supervised receiver; `degraded` / `receiver-missing` when nobody receives or pending
  updates do not drain). The `degraded` row and the known reason codes now include OC-17.
- Fixtures: `operator-channel-status-degraded-receiver-missing` (valid) and
  `operator-channel-status-linked-without-receiver` (refused by `const`), both in
  `fixtures/catalogue.json`.
- [`test/operator-channel.test.ts`](../../test/operator-channel.test.ts): OC-1…OC-17 defined once
  each. Every known reason code matches the schema's code pattern and names a schema state. Every
  reason code in a valid fixture is documented. DEC-0035 names OC-14…OC-17.
- [DEC-0035](../DECISIONS.md), `CONTEXT.md` (addressed message), `docs/DOCMAP.md`,
  [sources](../evidence/sources.md) (Telegram *Bots — features*, Privacy mode; Bot API 10.3
  re-read for `getWebhookInfo.pending_update_count` and the 24-hour retention), `docs/ux/`
  (SCN-014, SCR-11 states).

## Decisions

- The status schema is unchanged. `reason.code` is an open vocabulary, and `degraded` with
  `receiver.lease: none` was already valid, so `receiver-missing` is a documented code, not a
  schema change. `contractVersion` stays `0.1.0`.
- OC-1…OC-13 are not rewritten. OC-14 narrows the optional refusals of OC-3 and OC-7 to addressed
  input.
- The liveness check reads `getWebhookInfo` and never calls `getUpdates`, which would make it a
  second receiver (OC-2).

## Open work

1. fabric-agent-adapter: move the contract pin to the merge commit of this change (another agent
   is moving it to `73c7978` now; this change follows).
2. Providers that implement the channel adopt OC-14…OC-17. The group defects measured on
   2026-10-10 (an "unknown command" answer to every text, "code did not match" to another bot's
   code, two bots with nobody receiving) are what an adoption must fix.

**Next task:** after this merges, move the fabric-agent-adapter contract pin to the new merge
commit and run its pin check (`pnpm pin:check <adapter checkout>`).
