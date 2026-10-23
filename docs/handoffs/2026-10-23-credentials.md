# 2026-10-23: narrow credentials on request, keyed digests and the call record (DEC-0111)

## Objective

CT-86, S5 and S6 of the agent network: an agent in an organization asks for a narrow credential, the organization
decides, and the value arrives sealed into that organization's context on the agent's machine; the same envelope moves a
credential between one person's own machines and carries the estate's digest key (Project Observatory OBS-194 step 2);
one record per call between agents. Board threads `ba63565c` items 5 and 6, `b2511678`.

## Done

- **DEC-0111** and [credentials](../specification/credentials.md): `credential-request/1` (in a check-in),
  `credential-decision/1`, `fabric-credential-envelope/1` (an organization's context under a key of its policy key set,
  `EdDSA`; the personal context between one person's machines, `ES256`), `credential-revocation/1`, `keyedDigest` and
  the estate's digest key, `call-record/1`; `FAC-SEM-138` to `FAC-SEM-140`.
- Code `src/credentials.ts` (100% branches): `checkCredentialEnvelope`, `openCredential`, `sealCredential`,
  `credentialRevocationStands`, `keyedDigest`, `estateDigestKeyId`, `callRecordFindings`, `credentialRules`.
- Schemas `credential-request`, `credential-decision`, `credential-envelope`, `credential-revocation`, `call-record`;
  six members of a check-in's `records`; five protocols in the register.
- Vectors `fixtures/vectors/credential-envelope.json` by `tools/vectors/credential-envelope.ts` (`check` 49, `open` 4,
  `digest` 4, `revocation` 7), built without the reference; `sealCredential` reproduces the organization's vector byte
  for byte. Fixtures: six positive, six negative, seven semantic.
- Docs: devices (the check-in members), relay (the secret envelope's pointer), contexts, package, delegation (DL-22), machine calls,
  conformance (module row, three party rows, the register), versioning, the specification README, DOCMAP, CONTEXT; UX
  JTBD-14, JRN-13, ST-033, ST-034, FLW-28, SCR-28, SCR-29, SCN-040 to SCN-042.
- Backlog: CT-86 done; CT-117 (adoption), CT-118 (a revocation names no instance), CT-119 (check-in rules and a
  fixture of the new members) and CT-120 (what the round-2 readings left) filed.

## Decisions taken here

- Fabric alone generates the estate's digest key, once, on the hub's machine, and sends it: it runs the hub (ceremonies.md, Create my network),
  and two generators would make two keys. Project Observatory holds the key it receives and computes `keyedDigest`.
- A node answered `certificate-revoked` by an organization deletes that context's credentials at once, whatever it decides
  about the rest of the enrollment, so a leaver's machine that was offline loses them at its first contact.
- Marks read only as an array of complete marks, one per `(context, agentRef, slot)`; anything else opens nothing.
- The vector file is `credential-envelope.json`, not `credentials.json`: a file named `credentials.json` is read by
  credential guards (an agent's shell hook refused it) as a secret store.
- An unreadable bound of a policy key's window closes the window (the key is refused), as an absent bound opens it.
- The personal profile refuses a `view` machine on either end and a machine sending to itself.

## Open

- CT-117: Project Observatory (the issuer and its node), the first organization server, Fabric, Fabric Switchboard.
- CT-118 (a revocation names no instance), CT-119 (check-in rules and a fixture of the new members), CT-120 (what
  the round-2 readings left).

## Readings

Round 1: unit two breaks (the shape check's `signer` against the schema at 128 characters; the sealer sealing what no
target opens), fixed with their risks (offset times read, an org id compared as written, marks that do not read fail
closed, a personal context without a record is `wrong-context`); seam and product breaks, fixed: the request held open
until its envelope opens (its slot and end from the issued decision; the node resends it and the issuer seals again),
the personal profile never filling a slot a placed package declares and the digest key only from the hub's machine
(never to a `view` machine), the policy key's window on the target's clock (and a revocation's on the device's),
`callRecordsAccepted` in the check-in response, a credential deleted with its enrollment and a leaver's revocations
before the certificate's, `contexts.md`, the protocol that gates each member, the sealer's restart rule, the constant
test, the tolerance kinds, Fabric's nodes in CT-117; CT-118 filed (a revocation names no instance).

Round 2: unit one break (marks that do not read were refused after step 7, not at step 1), fixed with its risks (`alg`
counted in characters as the schema does, a held request with no end admits none, a sealer refusing a signing key of
the other profile); seam and product breaks, fixed: the check-in schema's resend wording, "six" members, the
personal profile's carrier (a relay message, relay.md's two lists), package.md's and relay.md's secrets rule narrowed
to the secret envelope (and FAC-SEM-075's message), a node deleting an organization's credentials on
`certificate-revoked` (SCN-041, devices.md), the digest key refused from a revoked hub key and the same key resent
across a hub move, the placed-slot check reading personal placements only, Switchboard's slot bound to the
organization's context, the handoff's counts. What blocks nothing is CT-119 and CT-120.

Round 3: unit one break (an array of marks with an unreadable or duplicate entry slipped past step 1), fixed (every
mark read at step 1, one per triple), with a sealer refusing a key off P-256; seam and product breaks, all wording,
fixed: the personal carrier is the inner `payload` of a relay message body (the signer must be the body's `from`),
one generator of the digest key (Fabric), the member profile's description in the estate-record schema, SCN-040's
Switchboard path bound to the organization, the PR body's counts; with the risks: a credential envelope's mark per
triple in relay.md, deletion on `certificate-revoked` only under the current certificate, a machine made `view`
deleting what envelopes gave it, `expiresAt` read as the decision's end, FLW-28. The rest is in CT-120.

## Checks actually run

`pnpm run check` and `pnpm vectors:check` (output in the pull request).

## Next task

The contract's first release (DEC-0108, branch `agent/dec0108-release-policy-20261023`), then the board replies that
name each merge.
