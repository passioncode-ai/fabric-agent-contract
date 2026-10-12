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
- **Review round 1** (the owner's reading of `c5f89ee`): the compatibility of each loosened rule, the host's lookup by
  normal form and colliding records (DEC-0076 items 4, 5; identifiers.md §Compatibility); consumers named in the
  Status; CONTEXT's SHOULD/MUST; a rootless path's leading `./` and `../` removed (`agent:./x` can no longer approve
  `agent:x`'s proposal); the writer's SHOULD in the guide, `byProject` and a conformance row; `capability` as a URI
  against `capabilityName`; the unreachable `//` guard removed; `FAC-SEM-006` with a scope that is not an object tested.
- The registers (`docs/DECISIONS.md`, `docs/backlog.md`) were edited without a lease, by the owner session's
  arrangement; the "Next free" markers are left for the owner to move at merge.

## Open

The owner applies the register text below under leases at merge (the review of #87 asked for it here, not in the
entries), moves `Next free ID` to DEC-0077, and resolves the conflicts with `main`.

**Annotations on the amended decisions** (`docs/DECISIONS.md`), one line under each entry's *Status*. Under DEC-0029:

```markdown
- **Annotated (2026-10-13):** amended by DEC-0076: `FAC-SEM-030`, `FAC-SEM-032` and `FAC-SEM-034` compare a revision reference's id, a project and a capability by their normal forms (`docs/specification/identifiers.md`).
```

Under DEC-0064:

```markdown
- **Annotated (2026-10-13):** amended by DEC-0076: `FAC-SEM-094` (approver against author), `FAC-SEM-006` (the scoped projects) and `FAC-SEM-096` (a rollback basis's id) compare by normal form (`docs/specification/identifiers.md`).
```

Under DEC-0065:

```markdown
- **Annotated (2026-10-13):** amended by DEC-0076: `byProject` names each project once by the normal form of `projectId`, and the finding names the second spelling (`docs/specification/identifiers.md`).
```

**Board cells** (`docs/backlog.md`): appended to the Status cell of CT-03 (Fabric), CT-18 (the adapter), CT-20 (Project
Observatory) and CT-21 (Fabric Dashboards), in that order:

```markdown
DEC-0076 (#87): write identifiers in their normal form; compare approvals, routes, bindings and rollback bases by it; resolve an accepted reference by normal form and refuse a colliding pair; run `fixtures/vectors/identifiers.json`.
DEC-0076 (#87): the kits' ports of the reference code run `fixtures/vectors/identifiers.json` (normal, same, different, laxPorts); the kits write identifiers in their normal form.
DEC-0076 (#87): usage reports write each `byProject` `projectId` in its normal form; learning records' `createdBy` and `approvedBy` are compared by it.
DEC-0076 (#87): usage and route views group projects and match routes by normal form.
```

And a new row for the first organization server, under the next free CT id (CT-50 at `main` `a1bdde5`):

```markdown
| CT-50 | The first organization server adopts DEC-0076: the projects and agents it records are written in their normal form, compared and looked up by it, and a pair that collides is refused and reported | open: the first organization server's (DEC-0076, #87). Goal: reliable-work | `docs/specification/identifiers.md` |
```

**Open questions** (`docs/OPEN_QUESTIONS.md`, under its lease; the register declares no `OQ` id counter, so the owner
takes the id from its `Next free ID`, OQ-0011 at this branch):

```markdown
### OQ-0011 — Identifier equality: what DEC-0076 left open

- **Status:** Open
- **Raised:** 2026-10-13, CT-39 (#87, DEC-0076 *Not decided here*)
- **Owner of the answer:** this repository.
- **Question:** four choices DEC-0076 did not make:
  - **Q1** — internationalized identifiers (IRIs) and Unicode normalization: today a non-ASCII string is no URI and is
    compared as it is;
  - **Q2** — scheme-based normalization (RFC 3986 §6.2.3) for any scheme, such as a default port or an empty path;
  - **Q3** — URN namespace-specific equivalence (RFC 8141 §3.1 lets a namespace add rules), for `urn:fabric:` first;
  - **Q4** — whether a schema refuses a non-normal spelling outright, so that a writer MUST emit the normal form and the
    readers' lookup by normal form becomes a check.
```

Also open:

- Consumers adopt as the cells above say; no consumer pin is moved by this change alone.
- The seam tier of the owner's reading was cut off by a rate limit and is owed again.

## Checks run

See the pull request: `tsc`, vitest with coverage, the UX lint, docs-check, markdownlint and the privacy check with
`ORG_INDEX`, with their output, and the plants.

## Next task

Review this pull request three ways and merge it under leases (DEC-0076, CT-39); then CT-40.
