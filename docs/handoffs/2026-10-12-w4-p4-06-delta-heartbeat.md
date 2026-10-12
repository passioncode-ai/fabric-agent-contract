# Handoff — the revocation delta and the timestamp heartbeat (DEC-0054, board run wave 4, P4-06; V4-DELTA-HEARTBEAT)

## Objective

Close V4-DELTA-HEARTBEAT, node N18 of the [board run](../evidence/specs/2026-10-11-board-waves/canvas.md), as packet
[P4-06](../evidence/specs/2026-10-11-board-waves/packets/wave-4/P4-06-delta-heartbeat.md): the documents, keys, head
hash, 72-hour rule and vectors of the first organization server's target architecture v4 §7 *Freshness* and §12's row
"revocation delta and timestamp heartbeat" (commit `9c6a780`), which DEC-0047 (the relay) and DEC-0053 (the check-in's
`records`) left to DEC-0054.

## Done

- **DEC-0054** in [`docs/DECISIONS.md`](../DECISIONS.md), under the id the owner session's P3-02 run reserved before this run (key
  `revocation-delta-20261012`, git CAS commit `776e807`, run `r-51535649e`); this run reserved no decision id. Rule codes
  **FAC-SEM-082**…**FAC-SEM-084** (receipts SEM-0082…SEM-0084; FAC-SEM-081 is P4-07's).
- [Revocation delta](../specification/revocation-delta.md) (new): entries signed by the estate key (a hub key the highest
  applied revision certifies), chained by RFC 8785 hash from a per-estate genesis; the head `{sequence, sha256}` the
  check-in reports; pages of at most 256; the heartbeat `{sequence, at, deltaHead, estateRecord}`; RD-1…RD-10 and
  HB-1…HB-3; the 72-hour rule (`current`, `behind`, `stale`, `broken`; only `current` accepts calls from other machines);
  revocations in force; reconciliation with the next revision; what stays open for the organization.
- Schemas `schemas/revocation-delta.schema.json` and `schemas/heartbeat.schema.json` (new); the check-in response's
  `records` and the relay's `welcome`, `delta` and `heartbeat` frames now reference them.
- Code `src/revocation-delta.ts` (`applyDelta`, `acceptHeartbeat`, `deltaFreshness`, `freshnessAnswer`,
  `reconcileRevision`, `effectiveRevocations`, `estateSigner`, `deltaGenesis`, `deltaEntryHash`, `signingInput`) and
  `src/revocation-delta-rules.ts` (kinds `revocation-delta`, `heartbeat`, `delta-freshness`, `delta-reconciliation`).
- Vectors `fixtures/vectors/revocation-delta.json`: two hub keys' seeds (Ed25519 signatures reproduce byte for byte),
  the genesis and three entries with their signing inputs and hashes, 29 page cases, 21 heartbeat cases, 9 freshness
  cases, 5 reconciliation cases — exact boundaries (60 s and 61 s ahead, 72 hours and 72 hours plus a second, an entry at
  a revision's `issuedAt` and one second after), a `+09:00` offset, and what a lax port gets wrong (a string sequence,
  2^53, a time without an offset, 30 February, upper-case hex, a kid in another case, a non-canonical base64url key).
- Neighbours: `relay.md` (revocation and heartbeat, `welcome`), `devices.md` (check-in), `estate-record.md`
  (revocations, adoption, not decided), `conformance.md` (register, a reader row, the estate-record reader's
  reconciliation, canonical forms), `CONTEXT.md` (*Revocation delta*, *Heartbeat*, the *Estate key*), `docs/DOCMAP.md`,
  `README.md`, `docs/evidence/sources.md` (RFC 8032 and RFC 8785 rows), the board (CT-19, CT-20, CT-32, CT-34), the
  inventory's V4-DELTA-HEARTBEAT note, the wave-4 packet table.

## Checks run

On the branch merged with `main` `51719e4`: `tsc --noEmit` clean; `vitest run --coverage` 44 files, 2173 tests passed,
every floor met, whole set 4407 / 4567 branches (96.49 %), `revocation-delta.ts` 262 / 262 and
`revocation-delta-rules.ts` 73 / 73; `python3 docs/ux/lint.py` exit 0; `tsx src/docs-check.ts` "Documentation checks
passed"; `tsx src/lint-md.ts` 0 errors; `tsx src/privacy-check.ts` with `ORG_INDEX` set: 0 findings. Fifty planted
defects — each refusal, each boundary (`>` to `>=`), the exact kid comparison, the canonical key spelling, each rule's
sub-check — were applied one at a time and each failed a test; the list is in the pull request.

## Decisions taken here

- **The estate key signs**, not the passkey (it needs a person present for every signature) and not the relay (it holds
  no authority). Fabric's D3 stays open: whichever key the record certifies as `hubKey` signs.
- **No `authority` revocation in the delta**, so a compromised estate key can never lock the person out of signing the
  revision that revokes it.
- **Signatures before the chain**, so only a validly signed conflicting entry marks a machine broken; a relay cannot.
- **The 72-hour rule applies to an estate's machines**, though v4 §7 states it for an organization's calls: without it a
  relay could withhold an entry forever. It is phrased through the trust tiers: a machine that is not current places no
  caller in T1 and accepts no T2 call.
- **The heartbeat's revision carries its digest** (`estateRecord {revision, digest}`, the check-in's shape), so a forked
  record is caught; the relay's `welcome.estateRevision` stays an integer.
- **DEC-0053's 7-day revocation list is not reused**: it belongs to a certified root at enrollment; the 7-day figures of
  v4 §7 are the organization's, not decided here.

## Open

- The organization's documents and key (`org-authority/1`, Fabric D8), its 7-day records and the heartbeat extension;
  recovery from a fork; compaction; how two hubs agree on the next sequence (Fabric's); the organization's kinds.
- P4-07 (`hubKeyCertified`, DL-14) reads the estate record's revocations; DEC-0054 item 6 asks every such check to read
  the applied delta entries' too (`effectiveRevocations`). The owner session reconciles the two when both land.
- Consumers: Fabric's hub issues entries and heartbeats (CT-19); Project Observatory's node applies them and refuses
  calls from other machines unless current (CT-20, CT-34); the relay carries them (DEC-0047).
- The registers (`docs/DECISIONS.md`, `conformance.md`, `backlog.md`) were edited in the branch without a lease, by the
  wave's arrangement. The **Next free rule code** marker reads `FAC-SEM-085` in this branch, because G-13
  (`test/consistency.test.ts`) fails the gate while the marker is not above the highest allocated code; the owner sets
  it at merge.

## Next task

The owner session reviews the pull request (unit, seam, product readings), takes the leases on `docs/DECISIONS.md`,
`docs/specification/conformance.md` and `docs/backlog.md`, sets the markers, merges, and reconciles DL-14's function
(P4-07) with `effectiveRevocations`.
