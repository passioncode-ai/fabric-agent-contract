# 2026-10-23: a check-in's own rules read DEC-0111's credential members (DEC-0112)

## Objective

CT-119: a receiver that runs only a check-in's rules judges DEC-0111's six members, and a committed fixture carries
them.

## Done

- **DEC-0112**: kind `device-check-in` runs `FAC-SEM-138` on each `credentialRequests` entry and `FAC-SEM-140` on each
  `callRecords` entry under its member's path; one `requestId` and one `callId` each; call records of an organization's
  context only, the one the requests name; a response decides each request once and seals no refused or pending one.
  Kind `credential-exchange` on `{sent, response}` matches decisions and envelopes against the requests a node sent.
- Code `src/credentials.ts` (`checkInCredentialFindings`, `exchangeRule`), `src/semantic-rules.ts`,
  `src/semantic-kinds.ts`; tests in `test/credential-envelope.test.ts`; fixtures (two positive, seven semantic).
- Docs: credentials.md (semantic rules, compatibility), conformance.md (the register's kinds); backlog CT-119 done.

## Decisions taken here

- No new rule code: the rules are DEC-0111's, applied where the members travel.
- An envelope may follow an earlier response's issued decision (the node resends the request until its envelope
  opens), so only a refusal or a pending decision in the same response refuses it.

## Open

- CT-91 (a check-in's `records.nodeSummary` judged with the certificate's device and organization) stays open: it needs
  the certificate as input, which a bare check-in does not carry.

## Readings

Unit: pass, one risk fixed (a duplicate's path named its index among object entries, not its own). Seam with the
documents: one break fixed (conformance's collector row said a check-in carries no context but the node summary's),
with its risks: the node summary joins the one-organization rule, a response carries no personal envelope, the
FAC-SEM-140 row and the organization server's row name DEC-0112's duties; a semantic fixture's schema not held by the
gate is filed in CT-120. What remains is wording, so the loop stops here.

## Checks actually run

`pnpm run check` (output in the pull request).

## Next task

CT-118: a credential revocation names its instance (the envelope's sequence or `requestId`) so a late one never deletes
a reissue.
