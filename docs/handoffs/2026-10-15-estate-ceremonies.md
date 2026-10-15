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

## Open

- Consumers adopt at their next pin (CT-53): Fabric (the ceremonies' interface and signing, issuing tokens, the hub on
  the always-on machine), Project Observatory (the node's join, pairing, the remote rendezvous, applying revisions,
  consuming tokens), the relay (the rendezvous and its frame types), the adapter's kits (the two vector files).
- Not decided: CX-CON-06 and an organization's ceremony (stage 2, D8); `node-summary/1`; the interface and the QR
  code's encoding; the rendezvous frame types; a ceiling document; a token for an organization (a new type); recovery
  when every passkey is lost.

## Checks run

- Gate at the branch head (off main `d8146cf`), each exit 0:
  - `node_modules/.bin/tsc --noEmit`: 0 errors;
  - `node_modules/.bin/vitest run --coverage`: 73 files, 4945 tests passed, every floor met, whole set 6652 / 6727
    branches (98.88 %); `src/pairing.ts` 199 / 199, `src/enroll-token.ts` 106 / 106, `src/estate-record-rules.ts`
    274 / 274, `src/relay.ts` 208 / 208, `src/signing-challenges.ts` 65 / 65;
  - `python3 docs/ux/lint.py`: passed (23 stories, 19 flows, 22 screens, 28 scenarios);
  - `node_modules/.bin/tsx src/docs-check.ts`: passed;
  - `node_modules/.bin/tsx src/lint-md.ts`: 0 errors;
  - `ORG_INDEX=… node_modules/.bin/tsx src/privacy-check.ts`: 0 findings.
- Plants, 77, each a refusal clause removed or loosened once, each confirmed failing at least one test and then restored:
  - `src/pairing.ts`: 42, failing `test/pairing.test.ts`;
  - `src/enroll-token.ts`: 21, and `src/signing-challenges.ts` (the register's `enroll-token/1` values): 4, failing
    `test/enroll-token.test.ts`;
  - `src/estate-record-rules.ts` (`FAC-SEM-114`, the key reference in `FAC-SEM-076`, the canonical fingerprint): 9, and
    `src/relay.ts` (the key-reference subtraction): 1, failing `test/ceremonies.test.ts`.
- One plant first survived: `machineKey.use !== "sig"` in `redeemEnrollToken` was redundant (a single `#kem` key is
  never a machine's key list); the clause was removed and the whole check planted instead.
- Exact boundaries tested: a token of 900 s accepted and 901 s refused; a clock 60 s before `notBefore` accepted, 60.001 s
  refused; a rendezvous at 600 s complete, 600.001 s expired; codes of exactly six digits with a leading zero kept.

## Next task

The owner reviews and merges the pull request, then tells Fabric's and Project Observatory's builders the merge commit
(CT-53) and moves this handoff's row in `docs/handoffs/README.md` to "merged".
