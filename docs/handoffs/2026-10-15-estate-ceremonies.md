# Handoff — DEC-0084: the estate ceremonies (RM-21 stage 1, packet P3) (2026-10-15)

## Objective

The estate record (DEC-0055) said what a signed revision holds but not how a person gets one. The operator's decisions
NET-1…NET-4 of 2026-10-15 (fabric-workspace `docs/reports/2026-10-15-agent-network-stage1/README.md` at `704daafe`)
unblocked RM-21's stage 1: two of a person's own machines as one network. This run writes the contract's packet P3:
the ceremonies that create a network, add a machine (nearby, remotely, headless), remove one and replace a machine's key,
and records NET-1…NET-3.

## Done

- `docs/specification/ceremonies.md` (new), the spec home: a network is a context (NET-1); who holds which key (NET-3:
  the passkey signs every revision, the hub's own Ed25519 key on the always-on machine, certified as `hubKey`); the
  estate fingerprint; the four ceremonies, each step with its failure; the rendezvous; the headless token; what refuses
  a replaced key; linkability (NET-2); the rules, adopters, compatibility and what is not decided.
- The pairing (`src/pairing.ts`, `schemas/pairing-message.schema.json`): `pairingCommit`, `checkReveal`,
  `comparisonCode` (six digits from SHA-256 over the RFC 8785 transcript), `estateFingerprint` (five groups of five
  digits), `rendezvousVerdict` (one exchange, at most 600 s, burned by any failure), `joinListed`, `ownKeysDecision`.
  Vectors `fixtures/vectors/pairing.json`, written by `tools/vectors/pairing.ts`, which imports none of `src/pairing.ts`.
- `enroll-token/1` (`src/enroll-token.ts`, `schemas/enroll-token.schema.json`, the register's new passkey type):
  `verifyEnrollToken`, `redeemEnrollToken`, `FAC-SEM-113`. Vectors `fixtures/vectors/enroll-token.json`, signed by the
  EdDSA test passkey, written by `tools/vectors/enroll-token.ts`.
- `src/estate-record-rules.ts`: `deviceKeyFingerprint` and `deviceKeyRef` (`<kid>@sha256:<hex>`); `FAC-SEM-076` reads a
  key reference; `FAC-SEM-114` (what a revision drops it revokes), also run by `verifyEstateRecord` with a parent.
  `src/relay.ts`: `relayAdmissionSet` subtracts a key revoked by its reference.
- Changes from the owner's design, each argued in DEC-0084 and the pull request:
  - the trusted side's commitment, reveal and the code's transcript carry `genesis` (revision 1's digest), and
    `joinListed` checks it: public keys can be copied, so without it a chain of another estate listing the trusted
    machine's key and a copy of the person's public passkey passes every check of the new machine;
  - `enroll-token/1` carries `genesis` for the same reason, and `ceiling` is always present, `null` for none, because a
    register type names one field list for good;
  - a key replacement revokes the old key by a key reference, since a kid (`<id>#sig`) outlives its keys and a kid
    revocation would revoke the new key too;
  - revision 1 certifies the hub key only when the network is created on the always-on machine; otherwise the revision
    that adds that machine does, since a hub key is a member of its machine.
- Registers (under the owner session's leases): DEC-0084 appended; DEC-0055, DEC-0063, DEC-0047 and DEC-0082 annotated;
  conformance.md (five reader rows, the estate row, three canonical-form rows, the register row, `FAC-SEM-113`,
  `FAC-SEM-114`, next free `FAC-SEM-115`); backlog CT-53 (new), CT-38 and CT-51.
- Neighbours: estate-record.md, signing.md, relay.md (*The pairing rendezvous*), devices.md, contexts.md
  (*Linkability* rewritten), revocation-delta.md, CONTEXT.md (Network, Estate ceremony, Comparison code, Estate
  fingerprint, Enroll token, Key reference), DOCMAP, README, the source ledger (RFC 6189), the UX layer (JTBD-10,
  JRN-09, ST-023, FLW-19, SCR-22, SCN-028).

- **Fix round** (two blind verifiers on `c68de2f`, an adversarial port review's F7, the adapter's report), with the
  owner's decisions:
  - relay sessions are revalidated by key, not kid (`sessionStands`): a session proven under a replaced key ends;
    shared vectors `fixtures/vectors/relay.json` `session` (new) and five `admissionSet` cases (key references in a
    delta, a malformed one reported in `unread`, and F7: a `#sig` key only under its own machine's kid, a kid listed
    twice for neither);
  - `estateEnvelopeContext` takes the applied delta entries' revocations (`extraRevocations`), by kid or key reference;
  - one `abort` is carried after both reveals; `checkedComparisonCode` is the only way a port computes the code;
  - `verifyEnrollToken` refuses any member beyond the schema's; `redeemEnrollToken` requires the joining key's proof
    over the key-signed register type `enroll-join/1` (`bad-proof`); the token is a bearer token, so the node prints
    its key fingerprint and Fabric shows the one it is about to list;
  - `FAC-SEM-076` refuses a malformed key reference, `FAC-SEM-073` a non-canonical device key; the revocation `ref`'s
    schema description names the key-reference form (description only);
  - ceremonies.md: delta entries and revisions in one form (`FAC-SEM-084`), a one-machine estate re-keys without
    pairing, token revocation's channel added to *Not decided*; UX ST-024, ST-025, FLW-20, SCR-23, SCN-029, SCN-030;
  - the symmetric commit (both commit, then both reveal) is recorded as a departure from DV-04's asymmetric exchange: one
    message order on both transports and the trusted side's `genesis` committed like its keys; the bound is unchanged;
  - adjacent: `FAC-SEM-034`'s probe check (`src/route-rules.ts`) compared after building `Array.from({length: count})`,
    so a `selected.index` of 2**32 threw `RangeError`; it now compares first and lists at most 64 candidates.

## Open

- Consumers adopt at their next pin (CT-53): Fabric (the ceremonies' interface and signing, issuing tokens, the hub on
  the always-on machine), Project Observatory (the node's join, pairing, the remote rendezvous, applying revisions,
  consuming tokens), the relay (the rendezvous and its frame types), the adapter's kits (the two vector files).
- Not decided: CX-CON-06 and an organization's ceremony (stage 2, D8); `node-summary/1`; the interface and the QR
  code's encoding; the rendezvous frame types; a ceiling document; a token for an organization (a new type); recovery
  when every passkey is lost.

## Checks run

- Gate at the final head of the fix round (off main `d8146cf`), each exit 0:
  - `node_modules/.bin/tsc --noEmit`: 0 errors;
  - `node_modules/.bin/vitest run --coverage`: 73 files, 4986 tests passed, every floor met, whole set 6724 / 6797
    branches (98.92 %); `src/pairing.ts` 203 / 203, `src/enroll-token.ts` 123 / 123, `src/estate-record-rules.ts`
    280 / 280, `src/relay.ts` 235 / 235, `src/relay-vectors.ts` 57 / 57, `src/secret-envelope.ts` 134 / 134,
    `src/signing-challenges.ts` 67 / 67, `src/route-rules.ts` 127 / 129 (floor raised from 96.85 to 98.44);
  - `python3 docs/ux/lint.py`: passed (25 stories, 20 flows, 23 screens, 30 scenarios);
  - `node_modules/.bin/tsx src/docs-check.ts`: passed;
  - `node_modules/.bin/tsx src/lint-md.ts`: 0 errors;
  - `ORG_INDEX=… node_modules/.bin/tsx src/privacy-check.ts`: 0 findings.
- Plants, 99, each a refusal clause removed or loosened once, confirmed failing at least one test, then restored:
  - the first reading's 77, rerun on the final code, all still killed: `src/pairing.ts` 42 (`test/pairing.test.ts`);
    `src/enroll-token.ts` 21 and `src/signing-challenges.ts` 4 (`test/enroll-token.test.ts`);
    `src/estate-record-rules.ts` 9 and `src/relay.ts` 1 (`test/ceremonies.test.ts`);
  - the fix round's 22: `src/relay.ts` 6 (F7's two clauses, `unread` and its pattern, `sessionStands`' octet compare
    and its `expired` answer; `test/relay-vectors.test.ts`); `src/secret-envelope.ts` 2 (`test/secret-envelope.test.ts`);
    `src/estate-record-rules.ts` 2 (the malformed key reference, the canonical fingerprint; `test/ceremonies.test.ts`,
    `test/estate-record.test.ts`); `src/pairing.ts` 3 (the abort after both reveals, each `checkReveal` in
    `checkedComparisonCode`); `src/enroll-token.ts` 6 (the token's and the assertion's members, the proof, its ES256
    branch, the join digest, the proof's canonical form) and `src/signing-challenges.ts` 1 (`enroll-join/1`'s values;
    `test/enroll-token.test.ts`); `src/route-rules.ts` 2 (compare first, the 64-candidate cap; `test/route-rules.test.ts`,
    `test/rule-tolerance.test.ts`).
- Two plants first survived in the fix round and were closed by tests: the proof's format check (an inserted character
  a lax base64url decoder skips; the pattern now admits only the canonical 64-byte form) and `enroll-join/1`'s register
  values.
- Exact boundaries: a token of 900 s accepted, 901 s refused; 60 s of skew accepted, 60.001 s refused; a rendezvous at
  600 s complete, 600.001 s expired; six digits with a leading zero; a route event's selected index of 2**32 and
  `Number.MAX_SAFE_INTEGER` answered `FAC-SEM-034` in under 500 ms.

## Next task

The owner reviews and merges the pull request, tells Fabric's, Project Observatory's, the relay's and the adapter's
builders the merge commit (CT-53), moves this handoff's row in `docs/handoffs/README.md` to "merged", and updates
fabric-workspace after the merge: the roadmap's contract row and RM-21 packet P3's state.
