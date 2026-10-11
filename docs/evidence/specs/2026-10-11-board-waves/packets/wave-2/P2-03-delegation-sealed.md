# P2-03 — delegation and spend sealed

- **Node:** N05 · **Wave:** 2 · **After:** P2-01 (uses `src/canonical.ts`)
- **Closes:** F-B-301, F-B-305, F-B-306, F-B-307, F-B-308, F-B-309, F-B-310, F-B-311, F-B-312, F-B-313, F-B-314,
  F-B-317, F-B-318, F-B-319, F-B-321, F-B-322, TRUST-TIERS. Each has its receipt in
  [inventory.json](../../inventory.json); read each one's `evidence` and `proposed_fix` first.

## The rulings this packet writes down

Ruled by Fabric's session as Fabric ADR-0144's owner on 2026-10-11, recorded in [brief.md](../../brief.md):

1. **One grant per token** (F-B-305). `delegation-token.schema.json` `grant` gets `maxItems: 1`, and FAC-SEM-050
   requires an onward token to keep the parent's reference.
2. **The meter hop is exempt from the depth limit** (F-B-306): a token with `aud` the meter, `scope` the
   grant-check capability and `effect: none` may have depth max + 1, and no other token.
3. **`approval.method: device` is removed** (F-B-314) until a decision defines it. Fabric issues only `prompt` and
   `operator-channel`.
4. **One refusal wire for the meter** (F-B-301): the meter answers a grant-check `denied` with a code from the one
   set, and a callee relays that code unchanged in `error.code`. DL-19 describes the step.
5. **DEC-0039 tightens the session lifetime** (F-B-311). Define "the descriptor token rotates" in `service.md`,
   where the lifetime is stated. DEC-0039 already carries the annotation (wave 1).
6. **Trust tiers** (Fabric ADR-0144 amendment 4, `19ad05ca`):
   - a delegation.md section: T0 is the operator's own machine (loopback on the owner's OS account), T1 an
     enrolled machine of the same owner (RM-21 decides the binding), T2 everything else;
   - a callee MUST NOT require a delegation token from a T0/T1 caller, and MAY accept, verify and use one for
     attribution and narrowing;
   - DL-8 ("no hub, no token, refused, never a fallback") is scoped to T2;
   - DL-12's retirement of descriptor-token capability calls applies across the machine boundary;
   - `surfaces.mcp.auth: "delegation"` is for a service exposed to T2;
   - "loopback reachability is not authorization" stays as a statement about hostile local processes;
   - "don't call a capability with another service's descriptor token" stays as attribution hygiene, and "never
     spend another agent's key or vault slot" stays in force (money).

   Read amendment 4 at Fabric `19ad05ca` (`git -C /Users/sshlg/DATA/fabric show 19ad05ca --stat`, then the ADR
   file) and pin the link at that commit.

## What else to fix

From the audit, each with its own test that fails without the fix:

- the verifier refuses in DL-13's row order with the table's codes; DL-13 row 5's claim types are enforced
  (`session:42`, a non-string `jti`, a non-agent-id actor, a double-spaced scope) (F-B-307);
- every FAC-SEM-050 sub-check and every verifier security MUST killed by a test: `crit`/`x5u`/`x5c` headers, a
  published key with private `d`, the approval's wrong issuer and future `iat`, the `typ` gate, the issuer passed
  to the meter (F-B-308, F-B-309);
- `readOnly` means something, or is removed (F-B-312);
- the issuer check is mandatory (F-B-313);
- DL-13 row 3's classification of an unusable key (F-B-319);
- FAC-SEM-050 checks that a token's `spend` matches its grant and that an onward token carries no more (F-B-322);
- the schema MUSTs get negative fixtures (F-B-310);
- FB-6's cookie scope and lifetime (F-B-318);
- the link-name rule's false refusals (F-B-317): re-check after DEC-0041's CO-260 rewrite, and close with the
  receipt if it is already fixed;
- UX scenarios in `docs/ux/scenarios.md` for choosing a project's spend policy, answering a spend approval and a
  delegation approval (F-B-321) — run `python3 docs/ux/lint.py`.

## Proof

- One decision (reserve the DEC id) records rulings 1–6 and the fixes that change wire behaviour. *Compatibility*
  is honest: rulings 1 and 3 narrow schemas and the trust tiers relax requirements. Name what each consumer does at
  its next pin (Fabric's issuer, Observatory's meter, the adapter's ports — CT-18…CT-20).
- A planted defect per fixed check, watched failing; the table in the handoff.
- Raise `delegation.ts`, `delegation-rules.ts`, `fabric-links.ts` and `operator-session.ts` floors toward 100 %
  (the ratchet; record each in `coverage-baseline.md`).
- Update the shared vectors from P2-01 if the refusal table changes, so the kits' ports test the same table.

## Files you own

`docs/specification/delegation.md`, `fabric-button.md`, `spend-policy.md` (trust-tier references only; P2-04 owns
`modelClasses`), `service.md` (the session-lifetime paragraph; lease-coordinate with P2-02);
`schemas/delegation-*.schema.json`, `approval.schema.json`, `governance.schema.json`;
`src/delegation.ts`, `src/delegation-rules.ts`, `src/operator-session.ts`, `src/fabric-links.ts`;
their tests and fixtures; `docs/ux/scenarios.md` and its UX files; `docs/DECISIONS.md` and `conformance.md`
(leases); one handoff.
