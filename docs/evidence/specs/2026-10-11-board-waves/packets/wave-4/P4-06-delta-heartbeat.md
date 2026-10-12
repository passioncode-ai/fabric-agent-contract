# P4-06 — the revocation delta and the timestamp heartbeat: the documents, their keys, the head hash and the 72-hour rule

- **Node:** N18 · **Wave:** 4 · **Closes:** V4-DELTA-HEARTBEAT · **Decision:** DEC-0054, already reserved (git CAS
  commit `776e807`, run `r-51535649e`, key `revocation-delta-20261012`); this packet reserves no new decision id, only
  its rule codes · **Order:** parallel with P4-02, P4-05 and P4-07; after DEC-0047 (merged as #53).

## Sources

- The first organization server's target architecture v4 (commit `9c6a780`), §7 *Freshness*: records valid 7 days
  (the estate record 30); a dedicated timestamp key, not the record key, signs a heartbeat; the fast revocation delta
  rides the relay and the check-in and reaches machines within seconds; the heartbeat signs the delta's head sequence
  and hash, and a host that has not applied up to that head refuses the scope's tokens; without a heartbeat for
  72 hours calls from other machines fail closed while the person's own work continues. §12's row "revocation delta
  and timestamp heartbeat".
- DEC-0047 ([relay](../../../../../specification/relay.md#revocation-and-heartbeat)): the relay carries `delta` and
  `heartbeat` frames unchanged, `welcome.deltaHead {sequence, sha256}`, `delta-query {fromSeq}`; "a relay can delay
  revocation, which the signed heartbeat exposes, but cannot forge it".
- DEC-0053 ([devices](../../../../../specification/devices.md#check-in)): the check-in's `records.heartbeat
  {sequence, at}` and `records.revocationDelta {sequence, sha256}`; the response carries a heartbeat and a delta
  unchanged; the 7-day revocation list of a delegated root certification.
- DEC-0055 ([estate record](../../../../../specification/estate-record.md#revocations)): the record keeps every
  revocation and is the durable state; its revocation kinds; each machine's `hubKey` certificate.

## What to build (one decision, DEC-0054)

1. **`revocation-delta/1`:** an append-only chain of signed entries, one revocation each, in the estate record's
   revocation kinds; entry *n* names the hash of the head before it (RFC 8785), so the head is `{sequence, sha256}`,
   the shape of the check-in and the relay's `welcome`. Decide and justify who signs (the passkey, the hub key, a
   dedicated key) without prejudging Fabric's D3 beyond what the decision needs, and name what stays open.
2. **`heartbeat/1`:** a signed timestamp document `{sequence, at, deltaHead, …}` by the timestamp key, at a stated
   interval, whose `sequence` and `at` are what the check-in reports.
3. **The rules:** a gap in sequence, a broken chain, a fork, a heartbeat older than 72 hours — and what the machine
   then refuses and keeps.
4. **Reconciliation:** an entry appears in the estate record by the next revision.
5. **A reference verifier** in `src/` with vectors a port runs, `FAC-SEM` rules with fixtures, and the passages of
   `relay.md`, `devices.md`, `estate-record.md` and the check-in schema that say "DEC-0054 (reserved)".

## Proof

Vectors generated from the reference functions (Ed25519 signatures reproduce byte for byte); a fixture or test per
refusal that fails without it, the plants listed in the pull request; exact boundaries (72 hours and 72 hours plus a
second, 60 s ahead and 61 s); `test/rule-tolerance.test.ts` for the new kinds; floors in `vitest.config.ts` and the
coverage baseline. Consumer rows: CT-19 (Fabric's hub issues entries and heartbeats), CT-20 (Project Observatory's
node applies them and reports the head), CT-32 (N18), CT-34 (the node's relay client).
