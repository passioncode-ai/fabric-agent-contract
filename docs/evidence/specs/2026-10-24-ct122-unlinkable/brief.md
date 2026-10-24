# CT-122: unlinkable memberships (CX-CON-06), scope of 2026-10-24

Row CT-122 asks that two organizations one machine is enrolled in cannot link it. The operator decided K-1 on
2026-10-15 (NET-2, DEC-0084): each organization enrollment of a machine gets keys of its own. This brief is the scope
the decision will follow; the decision itself is due by 2026-11-06.

## What is true today

- Project Observatory's node already gives each organization enrollment its own random `device.id` and keys, kept
  apart from the machine's estate keys, sends no estate record in a check-in, and keeps its counters per organization
  (its engine, `node/org.py`, `node/device_keys.py`).
- The first organization server stores no check-in document.
- The contract still says or allows linkage: [contexts](../../../specification/contexts.md#linkability),
  [devices](../../../specification/devices.md) (the check-in's estate records), [ceremonies](../../../specification/ceremonies.md).

## What two enrollments of one machine share, and the change that unlinks it

| # | Shared today | Where | Change | Stays linkable |
|---|---|---|---|---|
| A | `device.id`, equal across enrollments and to the estate machine id | devices.md enrollment and attribution; `estate-record.schema.json` machine `id` ("the device id it enrolled with") | a fresh opaque `device.id` per enrollment, never the estate machine id; the estate schema's description reworded | inside one organization across rotation and renewal; the node's local registry maps machine to enrollments and never sends it |
| B | device keys `#sig` and `#kem` | devices.md device keys; FAC-SEM-044, FAC-SEM-073 | keys per enrollment (the kid follows the new id); FAC-SEM-044's "device on record" scoped per organization | the estate record keeps only personal `deviceKeys` |
| C | the hub key and `iss` (one hub kid per machine, `iss` the estate) | delegation.md DL-14, DL-16; `delegation-token.schema.json` | an `iss` and a hub `kid` per organization context: `contextIssuers[]` and `machines[].contextHubKeys[]` in the estate record; org-context tokens signed with that context's key | the personal `hubKey` stays the estate's only signer for heartbeats, delta entries and leases |
| D | check-in `records`: estate revision and digest, heartbeat, delta head, leases | devices.md check-in; revocation-delta.md; window-lease.md | the estate's records never go to an organization server (a node's duty, new rule); the members stay in the schema for an organization's own records later | the hub reads them on the personal channel only (a follow-up row for the hub's report channel) |
| E | a node summary's `device.id`, coding-agent versions, hook count | node-summary.md (DEC-0118) | `device.id` follows A; the rest is operator question 1 | the whole harness under `machine.mode` `A` |
| F | the telemetry key, per device: a hashed `git.branch` (`main`) is the same value at both organizations | activity.md | a telemetry key per enrollment | idempotency within an enrollment |
| G | `collector.id` if machine-unique | check-in, events | per enrollment or a product constant | the stream within one organization |
| H | an attestation carrying a hardware identifier | devices.md enrollment (OQ-0010) | an enrollment's attestation covers only that enrollment's key | |
| I | counters (`sequenceNum`, the summary's `sequence`) | devices.md, node-summary.md | per enrollment | |
| J | low-entropy values (`agent.version`, `components`, `platform`, `protocols`, check-in timing) | device-check-in schema | residual: each enrollment's check-ins scheduled independently with jitter (SHOULD) | |
| K, L | a shared agent's `agentRef` or token `project`; the relay reading `org:<orgId>` in the estate record | delegation.md, share-registration.md, relay.md | operator questions 3 and 4 | |

## What changes in the contract

- One decision; two new rule codes: kind `node-enrollments` (no two enrollments share a device id, key, kid,
  telemetry key or machine-unique collector id, and none matches the estate machine) and a check-in clause (no estate
  record to an organization server). Amendments to `FAC-SEM-073` (context issuers and context hub keys), `FAC-SEM-081`
  (a context input), `FAC-SEM-114` (a dropped context hub key revoked), `FAC-SEM-134` (context keys only on a `full`
  machine).
- Schemas: `estate-record` gains `contextIssuers` and `machines[].contextHubKeys` (gated as DEC-0082 and DEC-0106 are:
  Fabric writes them only once every reader is pinned at or after); descriptions in `delegation-token`,
  `device-check-in`, `device-enrollment`.
- Code: `hubKeyCertified` and `estateRefusal` take a context; FAC-SEM-073 and FAC-SEM-114; a module for the two new
  rules. Vectors: a new `enrollments.json`; cases in `hub-key.json`, `estate-record.json`, `revocation-delta.json`,
  `window-lease.json` (a context key signs nothing of the estate's).
- Pages: contexts.md (Linkability flips to "meets CX-22" only once adopted), devices.md, estate-record.md,
  delegation.md, activity.md, node-summary.md, credentials.md, revocation-delta.md, window-lease.md, ceremonies.md,
  relay.md, conformance rows.

## Who adopts, in order

1. The contract's decision (by 2026-11-06).
2. Project Observatory's node: the enrollment rule at enrollment and before each check-in, a telemetry key per
   enrollment, no estate record to an organization (already true); later, tokens checked against context keys.
3. The first organization server: device and key lookups scoped per organization across tenants; no estate member
   stored or required. No wire change.
4. The relay and the adapter's kits pin the estate schema before Fabric writes the new members.
5. Fabric's hub: context issuers and hub keys, org-context tokens and per-context JWKS, the keys moved with the hub,
   machine reports read on the personal channel.
6. contexts.md says the contract meets CX-22; until then, enrolling in an organization the person does not own stays
   off (the K-1 condition).

## The operator's questions, with the contract's default until answered

| # | Question | Default the decision takes |
|---|---|---|
| 1 | Under `machine.mode` `C`, keep coding-agent versions and the hook count in the summary? | keep them (DEC-0118), named as residual linkability; a later decision may coarsen them |
| 2 | Accept `agent.version`, `components`, `platform`, `protocols` and check-in timing as residual? | yes, with independent schedules and jitter (SHOULD) |
| 3 | May the relay operator see memberships (`org:<orgId>` in the estate record)? | yes until per-context relay sessions (CX-REL-01, after `org-authority/1`); stated as residual |
| 4 | A self-published agent shared into two organizations shows the same `agentRef`: acceptable? | yes, the person's own choice to share; stated |
| 5 | Forbid attestations carrying a hardware-unique identifier in an organization enrollment? | yes (SHOULD NOT carry one; OQ-0010 decides formats) |
| 6 | `iss` granularity? | one per (estate, organization), stable across key rotation and hub moves |
| 7 | A stolen machine: prompt the person to ask each organization to revoke? | yes, Fabric or the node offers it from the local registry (no automatic message) |
