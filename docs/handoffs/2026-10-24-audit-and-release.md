# 2026-10-24: DEC-0118, the audit before the second release, and `v0.1.0+2026-10-24`

## Objective

Record DEC-0118 (merged without a handoff), check everything merged since the first release for bugs and stale
documents, fix what the checks found, and release the result as `v0.1.0+2026-10-24` (DEC-0108).

## Done

- **DEC-0118** (#170 `bf6bd918`, CT-92's first half): what `node-summary/1` lists follows `machine.mode`; under `C`
  the organization's context only (coding agents, the hook count, its packages' and `workspace.folders`' items and the
  baseline's items present), under `A` the whole harness (S8). The first organization server's request on board thread
  `305f39c3` was answered `adapted`; CX-CON-06 is CT-122 (text by 2026-11-06).
- **The audit:** three blind readings of `2f020a69..9b0bdee4` (unit, seam, product). Unit passed; seam and product
  found breaks, all fixed in DEC-0119's pull request: the compatibility policy's exception for an unadopted revision
  (DEC-0113), `FAC-SEM-069` and the verifier's clock read strictly (DEC-0115's reach), the rotation rule at the window's
  edge, the check-in schema's resend description, the context of a check-in's requests and call records in CONTEXT.md
  and contexts.md, the parties table in credentials.md, FLW-27's branches and FLW-28's revocation, the specification
  index's adoption rows, the repository named public, stale handoff entries, CT-83, CT-110, CT-113 and CT-120's status.
- **The second release** `v0.1.0+2026-10-24`: annotated tag on `4e5440cf` (the tree the gate passed on in #173,
  8 606 tests, 18 vector files), [GitHub release](https://github.com/passioncode-ai/fabric-agent-contract/releases/tag/v0.1.0%2B2026-10-24)
  listing DEC-0112 to DEC-0119 and what narrows; announced on board thread `147a5538`.

## Decisions taken here

- A revision nobody has adopted may change its required semantics under the same name, disclosed as narrowing in the
  next release notes (DEC-0119); DEC-0113 used it.
- Consumers re-pin at the second release's commit, which carries DEC-0118 (the re-pin floor `68abd0f6` named on the
  board for OBS-217 predates it).

## Open

- Adoption: CT-110, CT-113, CT-115, CT-116, CT-117 (Fabric 0.3.13 and CO-412, Project Observatory OBS-217, the first
  organization server VES-CREDS-EXCHANGE, the relay).
- Contract: CT-122 (CX-CON-06, by 2026-11-06); CT-92's second half and CT-120's remaining items need a design or the
  operator; CT-95 (UX scenarios for the node summary and repairs).

## Checks actually run

`pnpm run check` and `pnpm vectors:check` on the audit pull request (output in the pull request).

## Next task

CT-122: the contract's text for a `kid` and an `iss` per context (CX-CON-06), due 2026-11-06.
