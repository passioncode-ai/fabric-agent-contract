# Plan 2026-10-26: unlinkable memberships (CT-122) and `org-authority/1` (CT-37)

The scope brief is [`2026-10-24-ct122-unlinkable/brief.md`](../specs/2026-10-24-ct122-unlinkable/brief.md). DEC-0127
([membership](../../specification/membership.md)) deferred `org-authority/1` here. This plan maps the change against
`main` at `dae13a37` and splits it into two decisions, both due 2026-11-06.

## DEC-0128: unlinkable memberships (CT-122)

- **Context issuer.** An `iss` per (estate, organization) on the estate record's `organizationPin` (DEC-0127's member,
  not yet written by any reader, so no extra gate). It is opaque and never contains the estate id: DL-2's personal
  `iss` is `urn:fabric:estate:<estate id>` (`delegation.md:60`).
- **Context hub keys.** `machines[].contextHubKeys[]` `{context, kid, x, alg}`. The member is gated as DEC-0106,
  DEC-0107 and DEC-0127 were.
  - `FAC-SEM-073` (`keys()`, `src/estate-record-rules.ts:279-321`): context kids and `x` unique across every hub key,
    no small order, and the context a pinned `organizations[].org`.
  - `FAC-SEM-076`: the hub-key set includes context kids.
  - `FAC-SEM-114` (`droppedFindings`): a dropped context hub key is revoked.
  - `FAC-SEM-134` (`machineProfiles`): context keys only on a `full` machine.
- **Delegation.**
  - `hubKeyCertified` (`src/hub-key-rules.ts:66-97`) and `estateRefusal` (`src/delegation.ts:276-289`) take a
    context. An organization-context token is signed by that context's key under its `iss`; a context key never signs
    a personal token, and the reverse.
  - `FAC-SEM-081` gains the context input.
  - The personal-only readers (`revocation-delta.ts:147`, `window-lease.ts:163`, `credentials.ts:248`,
    `hub-move.ts:75`) keep reading `machine.hubKey` only: a context key signs nothing of the estate's. Vectors pin
    this.
  - `hubMove` reports context keys moved.
  - Not in the brief: a token's `sub` (`delegation.md:61`) must be per context too.
- **Device side.**
  - A fresh opaque `device.id` per enrollment, never the estate machine id; keys and kids per enrollment.
  - A telemetry key per enrollment; `collector.id` per enrollment.
  - Counters per enrollment; jitter on check-in schedules (SHOULD).
  - Pages: `devices.md:55-57`, `:170-186`; `activity.md:320-325`; `node-summary.md:25`.
- **New rule `FAC-SEM-148`, kind `node-enrollments`** (a local registry, no schema). No two enrollments share a
  `device.id`, a key, a kid, a telemetry key or a machine-unique `collector.id`, and none matches the estate machine id.
- **New rule `FAC-SEM-149`, a check-in clause, both directions.**
  - A check-in to an organization server carries no estate records: `records.estateRecord`, `heartbeat`,
    `revocationDelta`, `leases` (`device-check-in.schema.json:245-326`).
  - Its answer carries no estate documents (`devices.md:439-455`): `heartbeat/1`, `revocation-delta/1`,
    `window-lease/1`, each naming `estate`.
  - The hub reads those on the personal channel only.
- **Credentials.** The organization envelope is sealed to the enrollment's `#kem`, not the machine's
  (`credentials.md:83-97`).
- **Operator questions, with the defaults the decision takes** (brief, questions 1 to 7):
  1. Keep mode `C`'s versions and hook count.
  2. Accept residual low-entropy values, with jitter.
  3. The relay operator sees memberships until per-context relay sessions.
  4. The same `agentRef` in two organizations is acceptable.
  5. An attestation SHOULD NOT carry a hardware id.
  6. One `iss` per (estate, organization).
  7. A stolen machine: Fabric offers the person to ask each organization to revoke.
- **Linkability pages to update:**
  - contexts.md `:200-213`, `:103`, `:287`;
  - ceremonies.md `:416-421`, `:525`;
  - relay.md `:180-187`;
  - window-lease.md `:182`, `:200`;
  - revocation-delta.md `:204-210`;
  - estate-record.md `:86-100`;
  - share-registration.md `:264`, `:322`;
  - membership.md (the CT-122 gap in OM-7 closes).
- **Size and vectors.** About 30 files. New: `src/node-enrollments.ts` and `fixtures/vectors/enrollments.json` with
  its generator. Extended: `hub-key.json`, `estate-record.json`, `revocation-delta.json` and `window-lease.json`, all
  hand-committed and signed, so they need the signing harness (CT-151 overlaps).

## Progress and design notes (2026-10-26)

- **Done on the branch.** Context issuers on `organizationPin`; `machines[].contextHubKeys`. `FAC-SEM-073`, `076`, `114`,
  `134` and `147` read them. `hubKeyCertified` and `verifyDelegation` take a context (`estateContext`).
  `FAC-SEM-081` gains `context`, tested in `test/context-keys.test.ts`. OM-5 now also drops and revokes the context's
  hub keys.
- **`FAC-SEM-149` is the sender's duty, not a receiver's refusal.**
  - Today `records` (`devices.md:556-567`) and the response's heartbeat, delta page and leases are part of the check-in
    contract: the delta-freshness rules and the relay route depend on them.
  - A receiver rule on `device-check-in` would refuse every node pinned before.
  - So the rule runs on a new kind, `check-in-outbound` (what a node is about to send an organization), and
    `check-in-response-outbound` (what an organization server is about to answer).
  - Receivers ignore the members and never refuse them. The personal channel (the hub) carries them.
  - The positive fixtures `device-check-in-records*.json` stay valid against the schema.
- **Next steps.**
  - `src/node-enrollments.ts`: `FAC-SEM-148` on kind `node-enrollments`, and `FAC-SEM-149` on the two outbound kinds.
  - `hub-move.ts` reports context keys.
  - The docs listed above, then DEC-0128, then the gate and readings.

## DEC-0129: `org-authority/1`, the member list only (CT-37)

- **The document.** One new schema, `org-authority/1`: an organization's signed list of admitted members. Each entry is
  a `subject` (DEC-0127's pairwise id for the relay's audience), the context `iss` and the context `#sig` keys, under a
  revision and an expiry.
- **Signing.** OM-3 widens so the membership key set's signing keys also sign it; the register gains
  `ORG_AUTHORITY_FIELDS`.
- **Verifier.** `verifyOrgAuthority` in `src/org-authority.ts`, under the applied `org-key-set/1`.
- **The relay.** `relayAdmissionSet` (`src/relay.ts:326-389`) gains an organization admission source that fails closed
  (DEC-0047).
- **Out of scope**, each a later decision: administrators' signing credentials and quorum, the `org-countersign/1`
  verifier, the organization's heartbeat and delta, and organization windows (`signing.md:107-111`,
  `revocation-delta.md:204-210`, `window-lease.md:182`).
- **Size.** About 16 files.

## Order

1. DEC-0128, then DEC-0129.
2. Tag both with DEC-0127 (DEC-0108).
3. Answer the board: thread `305f39c3` for CT-122, thread `8d115bed` for TP-00.
