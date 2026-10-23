# Calls between machines of one estate (`fabric-agent-call/1`)

DEC-0106 (CT-85, S1 of the agent network) · rule codes `FAC-SEM-134` to `FAC-SEM-136` · schemas
[`agent-call-sealed.schema.json`](../../schemas/agent-call-sealed.schema.json),
[`agent-call-message.schema.json`](../../schemas/agent-call-message.schema.json), a machine's `profile` in
[`estate-record.schema.json`](../../schemas/estate-record.schema.json), `profile-forbids` in
[`delegation-refusal.schema.json`](../../schemas/delegation-refusal.schema.json) · code
[`src/machine-call.ts`](../../src/machine-call.ts), `machineProfile` in
[`src/estate-record-rules.ts`](../../src/estate-record-rules.ts) · vectors
[`fixtures/vectors/machine-call.json`](../../fixtures/vectors/machine-call.json), written by
[`tools/vectors/machine-call.ts`](../../tools/vectors/machine-call.ts) · tests
[`test/machine-call.test.ts`](../../test/machine-call.test.ts)

S1 of the agent network is one person's machines calling each other's agents. The [relay](relay.md) already carries a
signed message between two machines of an estate, and the [delegation profile](delegation.md#trust-tiers) already says
that a call from an enrolled machine of the same owner (T1) needs no token. Two things were left open: the binding that
places a caller in T1 (DL-25 left it to RM-21), and how a call and its answer travel. The platform asked for both on the
board (thread `348467e5`), with machine profiles that say what each machine may do; the first organization server asked
how its relay should treat such a call (thread `ba63565c`). This page answers both.

## Machine profiles

A machine of an [estate record](estate-record.md) carries an optional `profile`:

| Profile | Runs agents | Holds secrets | Holds the hub key | Calls with an effect | Is called with an effect |
|---|---|---|---|---|---|
| `full` | yes | yes | yes | yes | yes |
| `member` | yes | yes | no | yes | yes |
| `view` | no | no | no | no | no |

- A machine with no `profile` is `full`, so every record written before DEC-0106 reads as it did.
- `machineProfile(record, machineId)` answers the profile, or none when the record does not list the machine exactly once
  or the value is not one of the three. A reader treats none as unreadable, never as `full`.
- `FAC-SEM-134` (kind `estate-record`): a `profile`, when present, is one of the three; only a `full` machine carries a
  `hubKey`; a `view` machine has no `packages` and no `secrets`; no secret placement names a `view` machine as its
  `from`. The schema refuses an unknown value too.
- A profile is part of the passkey-signed record, so changing it is a new revision
  ([ceremonies](ceremonies.md#change-a-machines-profile)), never a node's own setting.
- **What enforces it.** The record's rules (`FAC-SEM-134`: placements, secrets, the hub key) and the call rule below,
  on calls between machines over the relay. A profile does not reach a path this decision does not define: the hub's
  `agent.call` over HTTP ([interop C3.5](interop.md#c35-the-hub)), T1 other than over the relay, an organization's
  repair (`node-summary.md`), or what a person starts by hand on the machine itself. "Runs agents: no" means no agent is
  placed there by the record.

## The T1 binding over the relay

A node that took a relay message whose body `verifyMessageBody` accepted and `checkReplay` passed
([relay](relay.md#messages)) places its sender with `relayCallerTier({applied, self, from, at, freshness,
revocations?})`, in this order:

1. **The delta is current.** Its revocation delta's freshness is not `current` → `unknown-state` (`not-current`).
2. **The clock reads.** `at` is no instant → `unknown-state` (`no-clock`).
3. **The record admits.** The estate record the node applied last, with the revocations in force, gives an admission
   set (`relayAdmissionSet`) → otherwise `unknown-state` (`no-estate`). `revocations` is the delta's part,
   `deltaRevocations(state)`, each `{kind, ref}` as the record writes a revocation
   ([revocation delta](revocation-delta.md#the-72-hour-rule)); the record's own come with `applied`. A port that passes
   the delta's entries themselves, whose revocation sits under `revocation`, revokes nothing.
4. **The node is in it.** Its own `<machine>#sig` is in the set → otherwise `unknown-state` (`self-not-admitted`).
5. **The sender is in it.** The body's verified `from` is a `#sig` kid in the set → otherwise `unauthenticated`
   (`not-t1`).
6. **T1.** The answer names the sender's machine, its profile (`null` when unreadable) and its `#kem` when the record
   lists one, it is a valid P-256 point, and neither its kid nor its key reference is revoked.

`unknown-state` is a denial (DL-19): the node refuses the call and does not fall back to T2. A sender that is not T1 is
refused `unauthenticated`: this decision defines calls between machines of one estate, and a call from outside it over
the relay (T2) is not decided here. The tier is the body's, never the connection's (relay, *Trust tiers*).

A node that queues ([agent network](agent-network.md#call-queue)) keys a call that carries no token by
`relayCallerCredential(from)`, which is `relay:<from>` (DEC-0104's `jobCallerKey` takes it as the credential), and a
call with a token by its delegation, as for any delegated call. The two are different callers to the queue: the job
tools are called the way the job was started, and per-caller fairness counts them apart.

## The call rule

`machineCallVerdict({caller, target, capability, effect})` judges a T1 call between two profiles, in this order:

1. Either profile is unreadable → refused `profile-forbids` (`profile-unreadable`).
2. The capability is a job tool (`fabric.job.get`, `fabric.job.cancel`, `fabric.job.list`) → admitted: each acts only
   on the caller's own jobs.
3. The target is `view` and the capability's effect is not `none` → refused `profile-forbids` (`target-view`).
4. The caller is `view` and the effect is not `none` → refused `profile-forbids` (`caller-view`).
5. Otherwise admitted.

The effect is the one the capability declares in its manifest ([external effects](governance-and-roles.md#external-effects)). A capability that declares none, or a value
other than the manifest's, counts as above `none`. An admitted T1 call needs no token, no approval and no grant record
(DL-26); a token the call carries is verified as DL-13 says and used for attribution and narrowing. `profile-forbids` is
a DL-19 code (403).

## The sealed call

A call and its answer are the inner `payload` of a relay message body (`fabric-relay-message/1`), sealed so the relay
reads neither ([`agent-call-sealed.schema.json`](../../schemas/agent-call-sealed.schema.json)):

```json
{"type": "fabric-agent-call/1", "kind": "call", "kem": "<recipient>#kem", "enc": "<87 base64url>", "ct": "<base64url>"}
```

- **HPKE.** Base mode, suite `[16, 1, 1]` (DHKEM P-256 with HKDF-SHA256, HKDF-SHA256, AES-128-GCM), the same suite as
  the [secret envelope](relay.md#the-secret-envelope); the recipient's public key is its `#kem` in the record;
  `info` is the ASCII `fabric-agent-call/1`.
- **Additional data.** The RFC 8785 UTF-8 bytes of `{type, kind, from, to, msgId, kem}`, `from`, `to` and `msgId` the
  relay message body's own. A sealed call copied into another body does not open.
- **Plaintext.** The RFC 8785 form of an
  [`agent-call-message`](../../schemas/agent-call-message.schema.json): a `call` carries `call` (the hub's `agent.call`
  arguments, [interop C3.5](interop.md#c35-the-hub)) and optionally `delegation` (the hub's token, its one
  place on the relay, DL-11) and `traceparent`; an `answer` carries `replyTo` (the call's `msgId`) and `answer`
  (`isError`, `structuredContent`, `content`). At most `MAX_AGENT_CALL_BYTES` (393 216 bytes), so the sealed call,
  base64url twice and signed, still fits a relay body.
- **Sealing.** `sealAgentCall(message, {from, to, msgId, recipient})` refuses `malformed`, `bad-key` (no `#kem` kid or
  no valid point) and `too-large`, and never throws.
- **Opening.** `openAgentCall(sealed, {from, to, msgId, own, schemaValid})` refuses, in this order: `malformed` (the
  sealed object is not the schema's, an `enc` that is no point, a `ct` that is not canonical base64url or out of
  bounds); `wrong-recipient` (another `kem`); `cannot-open` (HPKE fails, another body's `from`, `to` or `msgId`
  included); `malformed` (a plaintext that is not UTF-8 JSON in its own RFC 8785 form, whose `type` or `kind` is not the
  sealed one's, or that the message schema refuses). It never throws.

**The node's order.** After the relay body is verified and is not a replay:

1. `relayCallerTier`. A sender that is not T1 (`unknown-state`, `unauthenticated`) is refused and **not answered**: the
   node has no key of the caller it trusts to seal to.
2. `openAgentCall`. A call that does not open is refused and **not answered**.
3. `machineCallVerdict`, then the token when the call carries one (DL-13). A refusal here is **answered**: a sealed
   `answer` whose `isError` is `true` and whose `structuredContent` is the [refusal](delegation.md#refusal-codes), to
   the caller's `#kem` as `relayCallerTier` named it.
4. Otherwise the call runs, and its answer is sealed the same way.

This order is the node's duty: the four functions are the reference for each step, and no reference function composes
them. A refusal that is not answered is logged with its code and `msgId`, and the delivery is acknowledged so the relay stops
redelivering. A caller that has no answer by its body's signed `exp` treats the call as failed: it never learns which
of these happened, and an unanswered call is retried under the same idempotency key, as any call whose outcome is
unknown. A call whose capability has an effect therefore carries `idempotencyKey` (optional in `agent.call`): one
retried without it may run twice. A machine with no usable `#kem` is neither called nor answered: a caller seals only to a usable `#kem` and
calls only from a machine that has one.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-134"></a>`FAC-SEM-134` | `estate-record` | a machine's `profile`, when present, is `full`, `member` or `view`; only a `full` machine carries a `hubKey`; a `view` machine has no placement and no secret placement, and no secret placement names it as `from` (DEC-0106) |
| <a id="fac-sem-135"></a>`FAC-SEM-135` | `relay-caller` | a node places the sender of a relay message as `relayCallerTier(applied, self, from, at, freshness, revocations)` answers (DEC-0106) |
| <a id="fac-sem-136"></a>`FAC-SEM-136` | `machine-call` | a T1 call's verdict is `machineCallVerdict(caller, target, capability, effect)`'s (DEC-0106) |

## Compatibility

Additive, with two narrowings:

- A record with a `profile` is refused by a reader pinned before DEC-0106, whose machine schema is closed. Fabric writes
  `profile` only once every reader of its records is pinned at or after DEC-0106: its own nodes, the relay, Project
  Observatory's node, the Fabric Agent Adapter's kits and the first organization server's vendored schema
  ([estate record](estate-record.md#who-adopts-it)); until then a record carries none and every machine reads as `full`.
- `profile-forbids` is a new DL-19 code. A reader that checks refusals against an older
  `delegation-refusal.schema.json` refuses it.
- `fabric-agent-call/1` is a new protocol. The relay carries the payload unread, so it needs no change.

`contractVersion` stays `0.1.0`.

## Who adopts it

Each party moves at its next pin (CT-110).

| Party | Does | At |
|---|---|---|
| Fabric (the hub and the operator's ceremonies) | writes `profile` in a record revision once its readers are pinned; seals and opens `fabric-agent-call/1` on its nodes; places relay senders with `relayCallerTier` and judges calls with `machineCallVerdict` | its next pin |
| A node that takes relay calls | the same four functions; keys a tokenless call by `relay:<from>` when it queues | its next pin |
| The first organization server's relay, and the relay | nothing on the wire: the payload is opaque to a relay; a vendored estate-record schema moves at its next pin | its next pin |
| Project Observatory's node, the Fabric Agent Adapter's kits | read a record that carries `profile`; a node that takes relay calls also does what the row above says | their next pin |
| Fabric Dashboards | shows a machine's profile where it shows the machine | its next pin |

## Not decided here

- Which capabilities a `member` machine may call beyond the effect rule; per-agent token administration stays CT-84's.
- An answer larger than the limit (a blob reference) and a streamed answer.
- Calls between estates (DL, *Not decided here*), the hub moving to another machine and passkey recovery (CT-89),
  credentials on request and the call record (CT-86).
- What a machine shows its person about calls it received (CT-95).
- Calls over the relay from outside the estate (T2), and how their answers are sealed.
