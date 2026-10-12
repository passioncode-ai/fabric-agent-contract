# Handoff — the estate record (DEC-0055, board run wave 3, P3-03; V4-ESTATE-RECORD)

## Objective

Close the last packet of node N17 of the [board run](../evidence/specs/2026-10-11-board-waves/canvas.md),
[P3-03](../evidence/specs/2026-10-11-board-waves/packets/wave-3/P3-03-estate-record.md): `estate-record/1`, the
passkey-signed state of one person's estate that the first organization server's target architecture v4 lists in §12
(commit `9c6a780`), after P3-01 (packages, DEC-0050/0051) and P3-02 (device keys by role, DEC-0053).

## Done

- **DEC-0055** in [`docs/DECISIONS.md`](../DECISIONS.md), reserved by git CAS; rule codes **FAC-SEM-072**…**FAC-SEM-076**
  (receipts SEM-0072…SEM-0076); next free `DEC-0056` and `FAC-SEM-077`. DEC-0054 is reserved by the revocation-delta
  run and DEC-0047 (the relay, FAC-SEM-070/071) is in review as pull request #53; it lands after this one.
- [Estate record](../specification/estate-record.md): whole revisions chained by digest (RFC 8785), a window of at
  most 30 days, passkey authorities, machines with DEC-0053's device keys and a hub-key certificate, packages placed
  by `agentRef`, digest and publisher key, secret placements by reference, share grants (`principalKind: external`),
  revocations; the WebAuthn Level 3 assertion verified offline, with what is not verified named; ER-1…ER-10.
- Schema `schemas/estate-record.schema.json`; code `src/estate-record-rules.ts` (`estateRecordDigest`,
  `estateChallenge`, `verifyEstateRecord`, `placementTrust`, the rule kinds `estate-record`, `estate-record-revision`,
  `estate-placement`) and `src/webauthn.ts` (`verifyAssertion`); fixtures `fixtures/positive/estate-record-*`,
  `fixtures/negative/estate-record-*`, `fixtures/semantic/estate-*`; vectors `fixtures/vectors/estate-record.json`
  (one case or more per problem, the EdDSA passkey's seed, a forgery under a small-order key).
- [Conformance](../specification/conformance.md): register rows, canonical forms (the digest and the challenge, both
  RFC 8785) and the reader row for a machine applying an estate record. Source ledger: WebAuthn Level 3 (dated
  Recommendation, hashed) and RFC 3279; the board run's brief pins WebAuthn too.
- Board: CT-19 (Fabric: drafts, the ceremony, hub-key certificates) and CT-20 (Project Observatory's node: verify,
  install and fill only what is placed, report the revision) name what they adopt. README, CONTEXT and DOCMAP list it.

## Checks run

On the branch off `main` `92de756`, after the review round: `tsc --noEmit` clean; `vitest run --coverage` 36 files,
1493 tests passed, every floor met, whole set 3131 / 3290 branches (95.16 %), `estate-record-rules.ts` 190 / 190 and
`webauthn.ts` 78 / 78;
`python3 docs/ux/lint.py` exit 0; `tsx src/docs-check.ts` "Documentation checks passed"; `tsx src/lint-md.ts` 0 errors;
`tsx src/privacy-check.ts` with `ORG_INDEX` set: 0 findings. The owner session's review added two chain checks to the
verifier (a revision issued before its parent, a dropped revocation), each removed once and a test failed, with two
vector cases for ports. The three-tier review then found: an unreadable clock that accepted any record (now
`no-clock`, checked first); a revocation kind such as `constructor` that made FAC-SEM-076 throw (now a `Map`); lax dates
(now strict RFC 3339 in the code, as in the schema); an unadmitted authority algorithm and one hub key under two kids
(both FAC-SEM-073); untested window edges; and a verifier that trusted a passkey its parent revoked and ran none of
FAC-SEM-073…076 (now `rule-violation`, ER-11). Each has tests and vectors.

## Decisions taken here

- v4 differs inside itself: Path 2 places an agent by `agentRef`, publisher key and a ceiling, "not a digest"; the §12
  row lists packages per machine. A placement names all three of `agentRef`, digest and `publisherKid`; until a ceiling
  is defined, every new version is a new revision.
- Fabric's D3 is not recorded (Fabric `main` `5bf15e5c`): the hub key is certified by its own `hubKey` entry. It is
  Ed25519 until Fabric's D2, so v4's proposal (the hub signing with the ES256 `#sig` key) cannot be certified before D2:
  D2 and D3 are coupled here.
- Machines carry no human name, a departure from v4 §3: the name a person sees stays with the node and Observatory.
- `verifyEstateRecord` enforces FAC-SEM-072's chain too, so a machine that only verifies cannot apply a revision that
  un-revokes a machine.

## Open

- Fabric's D3 (keys) and D2 (ES256 for hub and publisher keys); the placement ceiling (Fabric's D2b); the signing
  challenge types and the signing RP as a contract; recovery by a printed code; DEC-0054 (revocation delta, heartbeat);
  window leases.
- Consumers: Fabric drafts revisions and runs the ceremony (CT-19); Project Observatory's node verifies and reports
  `records.estateRecord.revision` in its check-in (CT-20, DEC-0053); the relay serves revisions (DEC-0047, PR #53).

## Next task

The owner session merges #54, which carries P3-03 and the wave-3 close (closed.json, the board, the canvas, the plan's
close record and the wave-4 re-cut with N18), releases the leases on `docs/DECISIONS.md`,
`docs/specification/conformance.md` and `docs/backlog.md`, and tells Project Observatory to rebase #53 (DEC-0047);
then starts wave 4 (N08, N09, N18).
