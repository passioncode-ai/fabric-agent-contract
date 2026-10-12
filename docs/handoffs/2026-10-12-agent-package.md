# Handoff — the agent package (DEC-0050, DEC-0051, board run wave 3, P3-01; V4-PACKAGE, V4-AGENTREF)

## Objective

Close the package half of node N17 of the [board run](../evidence/specs/2026-10-11-board-waves/canvas.md), packet
[P3-01](../evidence/specs/2026-10-11-board-waves/packets/wave-3/P3-01-agent-package.md): `fabric-package/1` from the
first organization server's target architecture v4 (`docs/design/2026-10-12-target-architecture.md` at `91c0637`;
§12 as adopted at `a040e68`), reconciled with CON-OE-03's package part (SK-02a), in two decisions — format and digest,
then signatures — with the `agentRef` rule.

## Done

DEC-0050 (format and digest), DEC-0051 (signatures); rule codes `FAC-SEM-064`, `FAC-SEM-065`, `FAC-SEM-066`.

| Inventory item | Receipt |
|---|---|
| V4-PACKAGE — the manifest, service template, `secrets[]`, `requires`, `costPresets`, result signal, `state[]`, evals receipt, vendored dependencies, digest | `schemas/fabric-package.schema.json`; `docs/specification/package.md` (Fields, the reconciliation table, one section per item); `src/package-rules.ts` `packageDigest`, `checkPackageFolder`, `FAC-SEM-064`/`065`; fixtures `positive/fabric-package-{agent,skill-set,unsigned-person}.json`, eight negatives, sixteen `semantic/package-*.json`; the canonical-forms register row; `test/package.test.ts` "the format", "FAC-SEM-064", "FAC-SEM-065", "the digest", "the folder check" |
| V4-PACKAGE — publisher signature and organization countersignature | `signatures[]` in the schema; package.md *Signatures* (the statement, algorithms, the PK-1…PK-10 verifier); `verifyPackage`, `packageSigningInput`; `fixtures/vectors/package.json` (16 cases, one per problem, seeds, digest, signing input, folder); the statement's register row; tests "signatures and the verifier" |
| V4-AGENTREF | `agentRefOf`, `FAC-SEM-066`, the schema's `$defs/agentRef`; package.md *agentRef*; fixture `semantic/package-agent-ref-mismatch.json`; tests "FAC-SEM-066" |
| CON-OE-03's package part (SK-02a) | package.md *What each source listed, and where it went*; CT-16 notes it moved to N17 |

Each refusal the packet names has a fixture: a secret value (`negative/fabric-package-secret-value.json`, and
`semantic/package-secret-{shaped-name,in-purpose,in-entry,slot-twice}.json`), a digest mismatch
(`semantic/package-digest-mismatch.json`, vector "the package changed after signing"), a bad signature (three vector
cases), a small-order publisher key (vector, a signature forged under the all-zero key), an unknown algorithm
(`negative/fabric-package-unknown-algorithm.json`, vector "ES256 before Fabric's D2").

Also: the positive sweep maps `fabric-package.schema.json` to the `package` kind; `CONTEXT.md` (Package, agentRef,
Package digest, Result signal); `docs/DOCMAP.md`; `README.md`; `docs/evidence/sources.md` (RFC 7518, semantic
versioning, SPDX expressions, the Claude Code plugin manifest); `conformance.md` (two register rows, a reader row,
three rule rows); `docs/backlog.md` (CT-16, and DEC-0050/0051's next-pin work on CT-18, CT-19, CT-20); the floor of
`src/package-rules.ts` at 100 %.

## Checks run

After the review fixes (on main `0cacd08` merged in): `privacy-check` 0 findings; vitest 1203+ tests green; an
organization countersignature under an unpinned `kid` is set aside unless required (two vector cases). Earlier, on
this branch at `bcada4a`, `node_modules` linked from the main checkout, Node v26.10.0, read after the run:
`tsc --noEmit` exit 0; `vitest run --coverage` 33 files, 1203 tests passed, branches 91.71 % (2513 / 2740), every
floor held, `src/package-rules.ts` 152 / 152; `python3 docs/ux/lint.py` 15 stories, 12 flows, 15 screens, 20
scenarios; `tsx src/docs-check.ts` passed; `tsx src/lint-md.ts` 0 errors. The whole suite also passes on Node 22.23.3 (1203 / 1203) and `test/package.test.ts` on Node 20.20.2 (56 / 56). The small-order forgery checked against raw
`crypto.verify`: true on Node 20.20.2, 22.23.3 and 22.23.1, false on 24.19.0 and 26.10.0.

### Planted defects

Each planted alone, the whole suite run, the file restored (`failed / total`):

| Plant | Failed |
|---|---|
| P1 the digest over another form than RFC 8785 | 42 / 1203 |
| P2 the digest covers the signatures | 39 / 1203 |
| P3 the role not signed | 9 / 1203 |
| P4 the verifier skips the digest | 1 / 1203 |
| P5 any algorithm admitted | 1 / 1203 |
| P6 a key's `alg` not checked | 1 / 1203 |
| P7 no small-order check in the verifier | 2 / 1203 on Node 26 (the forgery then answers `bad-signature`); 2 / 1203 on Node 22.23.3, where the verifier without the check answers `ok: true` for the forged package |
| P8 a bad countersignature skipped | 2 / 1203 |
| P9 `countersigned` ignored | 1 / 1203 |
| P10 the publisher count unchecked | 2 / 1203 |
| P11 a duplicate `kid` unchecked | 1 / 1203 |
| P12 a key's private part admitted | 1 / 1203 |
| P13 the signature length unchecked | 0 / 1203 — an equivalent mutant on Node, whose `verify` answers false for any other length (as P2-03's M25); kept for ports |
| P14 `FAC-SEM-064` digest unchecked | 3 / 1203 |
| P15 `FAC-SEM-064` named files unchecked | 5 / 1203 |
| P16 `FAC-SEM-064` receipt's suite unchecked | 1 / 1203 |
| P17 `FAC-SEM-064` vendored SHA-256 unchecked | 1 / 1203 |
| P18 `FAC-SEM-064` a path listed twice | 1 / 1203 |
| P19 `FAC-SEM-064` `fabric.package.json` listed | 1 / 1203 |
| P20 `FAC-SEM-064` a state path twice | 1 / 1203 |
| P21 `FAC-SEM-064` a skill set without its plugin manifest | 1 / 1203 |
| P22 `FAC-SEM-065` a credential-shaped slot | 2 / 1203 |
| P23 `FAC-SEM-065` a credential in the entry | 1 / 1203 |
| P24 `FAC-SEM-065` a slot named twice | 1 / 1203 |
| P25 `FAC-SEM-066` removed | 1 / 1203 |
| P26 folder: bytes unchecked | 1 / 1203 |
| P27 folder: an unlisted file passes | 1 / 1203 |
| P28 folder: the plugin's version unchecked | 1 / 1203 |
| P29 folder: the provider's cost presets unchecked | 1 / 1203 |
| P30 schema: a secret slot may hold a value | 4 / 1203 |
| P31 schema: any `alg` | 2 / 1203 |
| P32 schema: two publisher signatures | 2 / 1203 |
| P33 schema: any path | 2 / 1203 |
| P34 schema: an agent without a result signal | 2 / 1203 |
| P35 schema: a dotted `id` | 2 / 1203 |
| P36 `semantic-rules.ts` does not dispatch `package` | 18 / 1203 |

## Decisions and readings

- v4's "manifest" is the package document itself (`fabric.package.json`, J8); the agent's capability manifest is a
  file of the folder, named by `provider`, and its `costPresets`, when present, equal the package's (the folder check).
- `id` is kebab-case and equals the plugin name: Claude Code wants a kebab-case plugin name, and `agentRef` already
  carries the publisher. CON-OE-03's dotted example does not validate; DEC-0050 says so.
- The digest covers the document without `digest` and `signatures`; `files[]` carries the folder into it, so the
  folder check is part of the format, not an extra.
- A signature covers `{type: "fabric-package-signature/1", role, digest}` in RFC 8785, so a publisher's signature is
  never a countersignature, even under one key.
- Only `EdDSA` until Fabric records D2 (the wave-3 rule); every signature present must verify.
- v4 §7's passkey-assertion countersignature (`org-countersign/1` with audience, grant, revision) is the
  signing-challenge decision's with `org-authority/1`; DEC-0051 says that replacing the detached countersignature then
  is breaking for countersignatures.
- J10: no field names, identifies or measures a person; `layer` is a publication scope, `publisher` who publishes.
- No UX scenario: the contract has no surface here; the card a package renders is Fabric's.

## Open

- Consumers, at their next pin: the adapter (CT-18: `pack` writes and signs, the kits port the digest, folder check and
  verifier against the vectors; FAA-26, FAA-27), Fabric (CT-19: packages by `agentRef` and digest in its ADR-0138
  amendment D2b, the `result` event naming `resultSignal`, D2 for `ES256`), Project Observatory (CT-20: install after
  the folder check, digest and verifier; slots from the vault; only declared state moves).
- Fabric's ADR-0138 on `main` (`22426281`) does not yet carry digests per version (packaged, shared, published,
  revoked); that is its D2b amendment, which will cite DEC-0050's digest.
- DEC-0050/0051 *Not decided here*: the blob store, the pinned keys per role and their chain, the `result` event's
  shape (P3-02's DEC-0030 amendment), `ES256`, the passkey countersignature, revoked digests.
- Merging beside P3-02: both branches add rows to `conformance.md`'s rule register (P3-02 `FAC-SEM-061`…`063`, this
  one `064`…`066`) and decisions (DEC-0048/0049 and DEC-0050/0051); the second to merge keeps both and the higher
  markers (`FAC-SEM-067`, `DEC-0052`).
- Found on `main` and resolved there by `0cacd08` (privacy scrub, PR #51): the wave-3 packets' README named the
  organization server's repository.
- The knowledge base (`fabric-workspace/knowledge/` products and plans) and the workspace sync are the owner session's
  close-of-wave step.

## Next task

The owner session reviews and merges the pull request, records V4-PACKAGE and V4-AGENTREF's receipts in the
inventory, and starts P3-03 (`estate-record/1`), whose packages per machine reference `fabric-package.schema.json`'s
`$defs/agentRef` and a package digest.
