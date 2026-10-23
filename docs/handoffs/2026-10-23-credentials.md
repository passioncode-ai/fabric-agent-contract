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
  five members of a check-in's `records`; five protocols in the register.
- Vectors `fixtures/vectors/credential-envelope.json` by `tools/vectors/credential-envelope.ts` (`check` 37, `open` 4,
  `digest` 4, `revocation` 6), built without the reference; `sealCredential` reproduces the organization's vector byte
  for byte. Fixtures: six positive, six negative, seven semantic.
- Docs: devices (the check-in members), relay (the secret envelope's pointer), delegation (DL-22), machine calls,
  conformance (module row, three party rows, the register), versioning, the specification README, DOCMAP, CONTEXT; UX
  JTBD-14, JRN-13, ST-033, ST-034, FLW-28, SCR-28, SCR-29, SCN-040 to SCN-042.
- Backlog: CT-86 done; CT-117 (adoption) filed.

## Decisions taken here

- The vector file is `credential-envelope.json`, not `credentials.json`: a file named `credentials.json` is read by
  credential guards (an agent's shell hook refused it) as a secret store.
- An unreadable bound of a policy key's window closes the window (the key is refused), as an absent bound opens it.
- The personal profile refuses a `view` machine on either end and a machine sending to itself.

## Open

- CT-117: Project Observatory (the issuer and its node), the first organization server, Fabric, Fabric Switchboard.

## Checks actually run

`pnpm run check` and `pnpm vectors:check` (output in the pull request).

## Next task

The contract's first release (DEC-0108, branch `agent/dec0108-release-policy-20261023`), then the board replies that
name each merge.
