# Handoff — device transport and keys (DEC-0056, board run wave 4, P4-04; DEV-HTTPSIG, DEV-KEY-ROLES, DEV-CHECKIN-DIGEST)

## Objective

Close packet [P4-04](../evidence/specs/2026-10-11-board-waves/packets/wave-4/P4-04-device-transport.md) of node N18 of
the [board run](../evidence/specs/2026-10-11-board-waves/canvas.md): an HTTP message signature on every device request
beside mutual TLS (the binding agreed with the first organization server, its ADR-0007 amended 2026-10-12 at its commit
`7a47447`), device-key roles counted at enrollment, and the estate revision's digest in the check-in.

## Done

- **DEC-0056** in [`docs/DECISIONS.md`](../DECISIONS.md), reserved by git CAS
  (`reserve --key w4-p4-04-device-transport-20261012 DEC`); rule code **FAC-SEM-077** `device-request-signature`
  (receipt SEM-0077, `--key w4-p4-04-sem-request-signature-20261012 SEM`). DEC-0031 and DEC-0053 carry an *Annotated*
  line. **The three guarded registers — `docs/DECISIONS.md`, `docs/specification/conformance.md`, `docs/backlog.md` —
  are not in this branch's commits but in [`2026-10-12-w4-p4-04-registers.patch`](2026-10-12-w4-p4-04-registers.patch)**:
  the wave's arrangement has the owner take the leases at merge, and the agent-sync guard refuses a commit of a guarded
  file by a run that holds no lease (the leases were held by another run when this branch was committed). The owner
  applies the patch under its leases (`git apply`). The decision register's *Next free ID* is left as on `main`; the
  patch sets the rule-code marker to `FAC-SEM-078`, since G-13 refuses a marker not above the highest allocated code.
- [Devices, transport](../specification/devices.md#transport): label `fabric-device`, covered components `@method`,
  `@target-uri`, `content-digest`, parameters `created;nonce;keyid;alg`, `keyid` the certificate serial, `alg` from the
  `#sig` key, ±300 s, nonce 22–64 base64url and required, the target URI from the public base URL, the receiver's steps
  and its 401 codes, the nonce store kept until `created + 300` s and written only after the signature verifies.
  Enrollment, device keys, attribution, check-in and the rule tables updated; [activity](../specification/activity.md)
  (batches, OTLP intake) and [estate record](../specification/estate-record.md) (key counts, the fork) follow.
- `src/http-signature.ts` (new): an RFC 8941 Dictionary parser, RFC 9421 §2.3 and §2.5 (`serializeSignatureParams`,
  `signatureBase`), RFC 9530's `contentDigest`, `deviceTargetUri`, the signer `signDeviceRequest`, the receiver
  `checkDeviceSignature` and `verifyDeviceRequest`, the `NonceStore` interface and a memory store.
  `src/device-rules.ts`: FAC-SEM-044 counts roles (exactly one `#sig`, at most one `#kem`). `src/device-transport-rules.ts`
  (new): FAC-SEM-077, kept out of `device-rules.ts` so a consumer that vendors the device rules needs no HTTP layer.
- **Review round (owner session's three readings):** mutual TLS beside the signature (a present signature is always
  verified, `keyid` equals the client certificate's serial or `certificate-unknown`, an unsigned request only on a valid
  client certificate, `binding: "mutual-tls"`); CT-20 unconditional; DEC-0056's open items under *Not decided here*;
  RFC 8941's last-wins kept on other members and refused on ours, RFC 9651 Date and Display String parsed (pinned);
  `revoked` refused whenever present and not `false`; a public verifier that answers `context-invalid` instead of
  throwing; a signer that refuses what the receiver would; a lower-case method vector and a small-order forgery vector;
  every difference of the first organization server named; forward compatibility of the check-in digest; J10; retries,
  the signing key by epoch, serial uniqueness; the relay wording.
- Vectors `fixtures/vectors/http-signature.json`: 54 binding cases with one fault each (44, then ten added in review:
  mutual TLS ×6, a lower-case method ×2, another party's members, a repeated parameter on ours) (good with each key, a rotation,
  a query, the window's edges, altered body and target, Host ignored, another authority, missing signature, missing and
  malformed nonce, parameter order and set, covered components, keyid form, foreign algorithm, labels, a repeated nonce,
  foreign keys, the wrong `alg` for the key, a short signature, unknown, revoked and expired certificates, a small-order
  and an off-curve key), plus RFC 9421 Appendix B.2.6 and RFC 9530 Appendix D. Only public keys are in the file.
- Schema: optional `records.estateRecord.digest` in `device-check-in.schema.json` (positive and negative fixture);
  descriptions in the enrollment, check-in and activity schemas. Semantic fixtures:
  `device-enrollment-device-keys-{sig-only,no-sig,two-sig,two-kem}`, `device-request-signature-*`.
- [Conformance](../specification/conformance.md): register row, two reader rows (the receiver, the device), the
  canonical-forms note. Source ledger: RFC 9421, RFC 9530, RFC 8941, each with line count and SHA-256 of the text
  fetched on 2026-10-12. Board: CT-04, CT-20 and CT-32 name what each consumer adopts. README, CONTEXT, DOCMAP.

## Checks run

On the branch off `main` `31ed9f0`: `tsc --noEmit` clean; `vitest run --coverage` 37 files, 1670 tests passed, every
floor met, whole set 3448 / 3608 branches (95.56 %), `http-signature.ts` 280 / 280, `device-rules.ts` 547 / 561
(floor raised to 97.5 %); `python3 docs/ux/lint.py`, `tsx src/docs-check.ts`, `tsx src/lint-md.ts` and
`tsx src/privacy-check.ts` (with `ORG_INDEX`) as the pull request records — all measured with the register patch applied
in the working tree. Without it the branch fails G-13 (`FAC-SEM-077` named by `src/` but not allocated) and every
check that reads DEC-0056 from the register. The test file also passes under `TZ=UTC` and
`TZ=Asia/Tokyo`. Plants: each refusal removed or weakened once, a test failed each time, restored (the list is in the
pull request).

## Decisions taken here

- The signing key is the `#sig` key of the enrollment that issued the certificate, or the certified key when that
  enrollment listed no `deviceKeys`.
- The code set is the first organization server's (its implementation at its commit `7a47447`):
  `signature-missing` covers any signature not of the binding's exact shape, as its parser does.
- `Content-Digest` is exactly one `sha-256` member, compared as a string; RFC 9530 allows more, the binding does not.
- An unreadable clock or a malformed public base URL refuses everything as the receiver's own fault, not a 401.
- The rule-kind form (`device-request-signature`) is the vectors' own shape plus `answer`, so a port runs one file.

## Merge-time step

Once #53 (DEC-0047, the relay) has merged, add one line to `devices.md#transport`: the relay's request signing
(`relay-auth/1`, `relay-blob/1`) and this binding are two bindings on the same `#sig` key, over inputs that cannot be
confused, with different windows and replay models.

## Open

- The first organization server, at its next pin, closes the differences DEC-0056 *Compatibility* names (a)…(g) — another
  signature beside ours, a throw on an off-curve key, an `http://` base URL, expired pairs refused until purge, no
  small-order check at enrollment, `@method` upper-cased, the CSR's key instead of `#sig` — and runs the vectors.
- Not decided here (DEC-0056, also in `devices.md`): a response signature, the URL paths, revocation reach for a receiver
  behind a TLS-terminating host, what a receiver does on seeing an estate fork, RFC 9421's successors and
  `Accept-Signature`, clock skew, several issuers behind one receiver.
- The three-tier review (unit, seam, product), one fix round and a confirming reading, then the owner's merge.

## Next task

The owner session reviews this branch's pull request, takes the leases on `docs/DECISIONS.md`,
`docs/specification/conformance.md` and `docs/backlog.md`, applies `docs/handoffs/2026-10-12-w4-p4-04-registers.patch`
and deletes it in the same commit, runs the gate, and merges; the owner sets *Next free ID* (`DEC-0060`) and the rule-code
marker (`FAC-SEM-081`) at the end of the wave's merges, and marking DEV-HTTPSIG, DEV-KEY-ROLES and DEV-CHECKIN-DIGEST done at the
wave-4 close.
