# 2026-10-23: a credential revocation names its request (DEC-0113)

## Objective

CT-118: a revocation delivered late never deletes a credential reissued into the same slot, and a revoked envelope
never opens again.

## Done

- **DEC-0113**: `credential-revocation/1` requires `requestId`; `credentialRevocationStands({..., held})` answers
  `{ok: true, deletes}`, true only when the held credential answers that request; the node keeps the mark with
  `revoked: true`, and `checkCredentialEnvelope` answers `replayed` at or below a revoked mark's sequence.
- Schema, code (`src/credentials.ts`), vectors (`revocation`: deletes, a late one that deletes nothing, a slot holding
  nothing, no request; `check`: a revoked mark refuses the same envelope, admits a later one, a `revoked` that does not
  read), the fixtures carrying a revocation, docs (credentials.md, conformance's node row, SCN-041, ST-033), backlog
  CT-118 done.

## Decisions taken here

- The instance is named by the request, not the envelope's sequence: a sealer that lost its sequence restarts at the
  clock, while the request id is fixed when the node asks.

## Open

- The issuer (Project Observatory) and the first organization server write `requestId` on each revocation: CT-117.

## Checks actually run

`pnpm run check` and `pnpm vectors:check` (output in the pull request).

## Next task

CT-120's items by priority, or CT-91 (a check-in's node summary judged with the certificate).
