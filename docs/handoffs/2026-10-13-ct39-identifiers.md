# Handoff — CT-39: identifier equality (2026-10-13)

## Objective

Decide when two URIs name one agent or project, and make the rules that compare identifiers use it: `FAC-SEM-094` let
an author approve their own proposal under another spelling of their id, and `byProject` (`FAC-SEM-025`) let one project
split its costs over two rows ([backlog](../backlog.md) CT-39).

## Done

- **DEC-0076** ([decisions](../DECISIONS.md)):
  two identifiers are the same when their normal forms are equal — RFC 3986 §6.2.2 for a URI, RFC 8141 §3.1 for a URN
  (nothing decoded there, the NSS's case kept, r/q/f-components ignored), any other string as it is. Writers SHOULD
  emit it; readers MUST compare by it. The brief's design decoded `%7E` everywhere; RFC 8141 §3.1 forbids that in a URN,
  so the decision follows the RFC.
- **Reference code** `src/identifiers.ts` (`normalIdentifier`, `sameIdentifier`), pure, never throwing, linear on a long
  input, no rule code (G-13); branch floor 100 in `vitest.config.ts`.
- **Rules changed:** `FAC-SEM-094`, `FAC-SEM-096` (`src/core-rules.ts`); `FAC-SEM-025` `byProject` (`src/usage-rules.ts`,
  the finding names the second spelling); `FAC-SEM-006`, `FAC-SEM-002` (`src/semantic-rules.ts`); `FAC-SEM-030`,
  `FAC-SEM-032`, `FAC-SEM-034` (`src/route-rules.ts`). Sites left as written, each with its reason, are in DEC-0076's
  *Consequences* and [identifiers](../specification/identifiers.md#where-identifiers-are-compared) (the delegation
  token's JWT claims by RFC 7519 §2, `agentRef`, opaque ids and names).
- **Vectors** `fixtures/vectors/identifiers.json` for ports: normal forms with the schema's verdict, same and different
  pairs, and six lax-port mistakes (decoding `%2F`, lower-casing a URN's NSS, decoding in a URN, removing a default port,
  lower-casing a path or user information).
- **Tests:** `test/identifiers.test.ts` (vectors, the schema `common.schema.json#/$defs/uri` on the same inputs,
  non-strings, `__proto__`/`constructor`, a long input, §5.2.4's dot segments); rule tests in `test/core-rules.test.ts`,
  `test/usage-rules.test.ts`, `test/route-rules.test.ts`. 23 plants, each killed (listed in the pull request).
- **Docs:** `docs/specification/identifiers.md` (new), the restating pages (conformance, governance and roles, service,
  versioning, runners, memory and learning), a clients-and-readers row, CONTEXT's *Identifier*, DOCMAP, README; RFC 8141
  pinned and RFC 3986 and RFC 7519 hashed in [sources](../evidence/sources.md).
- The registers (`docs/DECISIONS.md`, `docs/backlog.md`) were edited without a lease, by the owner session's
  arrangement; the "Next free" markers are left for the owner to move at merge.

## Open

- The owner applies DEC-0076 and the CT-39 cell under leases at merge, and moves `Next free ID` past DEC-0076.
- Consumers: a kit port (the adapter's) runs the vectors; writers emit the normal form. No consumer pin is moved by this
  change alone.
- Not decided (DEC-0076): IRIs and Unicode normalization, scheme-based normalization, URN namespace rules.

## Checks run

See the pull request: `tsc`, vitest with coverage, the UX lint, docs-check, markdownlint and the privacy check with
`ORG_INDEX`, with their output, and the plants.

## Next task

Review this pull request three ways and merge it under leases (DEC-0076, CT-39); then CT-40.
