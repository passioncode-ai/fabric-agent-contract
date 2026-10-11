# Handoff — delegation (`fabric-delegation/0.1`, DEC-0039) and Fabric's button (DEC-0040)

## Objective

Step 1 of Fabric's delegation plan (Fabric ADR-0144, CO-258, release 0.4.0 REQ-37): the contract decides the
wire — the delegation token, `approval/1`, one refusal-code set, the grant's audience, well-known
`auth.delegation`, the L0 wording, interop C3.5's issuer/route wording, the operator session's lifetime — with
schemas, fixtures and a verifier in the kit. With it, Fabric 0.4.0 REQ-42: Fabric's button in every product and
the `fabric://` links it opens. Written by Fabric's session; the contract has no live owner session.

## Done

- DEC-0039 and DEC-0040 in `docs/DECISIONS.md`; the profiles `docs/specification/delegation.md` (DL-1…DL-22)
  and `docs/specification/fabric-button.md` (FB-1…FB-8, FL-1…FL-7).
- Schemas: `delegation-token`, `delegation-jwks`, `approval`, `delegation-refusal`, `fabric-link` (new);
  `governance` (`audience`, `capabilities`, `effectCeiling`, `dependentRequired`), `service-well-known`
  (`auth.delegation`, `surfaces.mcp.auth: "delegation"`).
- Code: `src/delegation.ts` (`verifyDelegation`, `verifyApproval`, `actionDigest`, `jcs`, `readDelegationToken`,
  `createMemoryJtiStore`, `effectWithin`), `src/delegation-rules.ts` (`FAC-SEM-049`…`051`),
  `src/fabric-links.ts` (`parseFabricLink`, `buildFabricLink`, `FAC-SEM-052`), `src/operator-session.ts`.
- Amendments: `interop.md` C3.5, `service.md`, `spend-policy.md` (L0), `governance-and-roles.md`,
  `conformance.md` (rule codes, two reader rows); glossary, DOCMAP, README, source ledger, UX chain
  (JTBD-06 … SCN-015).
- Tests: `test/delegation.test.ts`, `test/fabric-button.test.ts`; fixtures in `fixtures/catalogue.json`.

## Checks run

- `pnpm run check` → exit 0: 21 test files, 672 tests (611 before), UX lint 11 stories / 9 flows / 12 screens /
  15 scenarios, docs check 0 errors.
- 29 planted defects, one per check of DL-13 and DL-18, `FAC-SEM-049`…`052`: each valid code that compiles and
  behaves like the missing check, each watched failing (1–3 of 28 delegation tests, 1–2 of 8 button tests) and
  restored. The first plant of the single-use check (a store keyed by `jti` and time) survived, because the
  reuse test replayed at the same instant; the test now replays an hour later and both jti plants fail.

## Open

- Fabric (step 2): the issuer — the estate key, the JWKS, mint/introspect/approval tools, `access_grants` in the
  grant's shape, `Fabric-Delegation` on forwarded calls, the `fabric://` handler honouring FB-8 and FL-3…FL-5.
- Project Observatory (step 3): `grant-check` verifying the token; the vault slot under a grant.
- fabric-agent-adapter: port `verifyDelegation`/`verifyApproval` to the Python and Node kits, ship Fabric's
  button component in the dashboard kit (FB-7), the operator session lifetime in the kit, then repin to this
  change's merge commit.
- Fabric Dashboards (FD-45): draw the button and set `fabric_button`.
- fabric-agent-adapter conformance probe: `plugins/fabric-agent-adapter/skills/building-fabric-services/scripts/check_service.py:451`
  must treat `surfaces.mcp.auth: "delegation"` like `own` — send no descriptor token to the MCP surface and do not
  report its refusal as nonconformance (DL-16).
- fabric-agent-adapter kits: their operator session cookie lives 30 days; the contract's maximum is now 12 hours
  after last use and 7 days after sign-in (`service.md` §The session's lifetime). Shorten the kits' cookie.
- The meter (Project Observatory) serves the grant-check capability behind `verifyMeterToken`'s rule and the
  `grant-check-request` schema (DL-21); the hub mints the meter's onward token without a grant of its own.

## Next task

Repin fabric-agent-adapter to the merge commit of this change and port the verifier with this repository's
test vectors (the RFC 8785 example and the refusal table of DL-13).
