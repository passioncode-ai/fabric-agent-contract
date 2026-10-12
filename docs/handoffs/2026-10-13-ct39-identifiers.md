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
  `FAC-SEM-032`, `FAC-SEM-034` (`src/route-rules.ts`); `FAC-SEM-014` (`src/registry-rules.ts`); `FAC-SEM-076`
  (`src/estate-record-rules.ts`) and `isRevoked` for a `grant` (`src/revocation-delta.ts`). Sites left as written, each with its reason, are in DEC-0076's
  *Consequences* and [identifiers](../specification/identifiers.md#where-identifiers-are-compared) (the delegation
  token's JWT claims by RFC 7519 §2, `agentRef`, opaque ids and names).
- **Vectors** `fixtures/vectors/identifiers.json` for ports: normal forms with the schema's verdict, same and different
  pairs, and six lax-port mistakes (decoding `%2F`, lower-casing a URN's NSS, decoding in a URN, removing a default port,
  lower-casing a path or user information).
- **Tests:** `test/identifiers.test.ts` (vectors, the schema `common.schema.json#/$defs/uri` on the same inputs,
  non-strings, `__proto__`/`constructor`, a long input, §5.2.4's dot segments); rule tests in `test/core-rules.test.ts`,
  `test/usage-rules.test.ts`, `test/route-rules.test.ts`, `test/registry-rules.test.ts`, `test/estate-record.test.ts`,
  `test/revocation-delta.test.ts`; the changed kinds in `test/rule-tolerance.test.ts`. Every plant killed (listed on the
  pull request).
- **Docs:** `docs/specification/identifiers.md` (new), the restating pages (conformance, governance and roles, service,
  versioning, runners, memory and learning), a clients-and-readers row, CONTEXT's *Identifier*, DOCMAP, README; RFC 8141
  pinned and RFC 3986 and RFC 7519 hashed in [sources](../evidence/sources.md).
- **Review round 1** (the owner's reading of `c5f89ee`): the compatibility of each loosened rule, the host's lookup by
  normal form and colliding records (DEC-0076 items 4, 5; identifiers.md §Compatibility); consumers named in the
  Status; CONTEXT's SHOULD/MUST; a rootless path's leading `./` and `../` removed (`agent:./x` can no longer approve
  `agent:x`'s proposal); the writer's SHOULD in the guide, `byProject` and a conformance row; `capability` as a URI
  against `capabilityName`; the unreachable `//` guard removed; `FAC-SEM-006` with a scope that is not an object tested.
- **Review round 1, seam** (the owner's seam reading of `c5f89ee`): `FAC-SEM-014`'s `providerId` and `FAC-SEM-076`'s
  grants and `grant` revocations compare by normal form, and `isRevoked` no longer fails open on another spelling of a
  revoked grant; the changed kinds in the tolerance test; DEC-0076's lists and identifiers.md's table match.
- The registers (`docs/DECISIONS.md`, `docs/backlog.md`) were edited without a lease, by the owner session's
  arrangement; the "Next free" markers are left for the owner to move at merge.

## Open

The owner applies the register text below under leases at merge (the review of #87 asked for it here, not in the
entries), moves `Next free ID` to DEC-0077, and resolves the conflicts with `main`.

**Annotations on the amended decisions** (`docs/DECISIONS.md`), one line under each entry's *Status*. Under DEC-0029:

```markdown
- **Annotated (2026-10-13):** amended by DEC-0076: `FAC-SEM-030`, `FAC-SEM-032` and `FAC-SEM-034` compare a revision reference's id, a project and a capability by their normal forms (`docs/specification/identifiers.md`).
```

Under DEC-0017:

```markdown
- **Annotated (2026-10-13):** amended by DEC-0076: `FAC-SEM-014` compares the entry's `providerId` with the manifest's `provider.id` by normal form; the slug and the file stem compare as written (`docs/specification/identifiers.md`).
```

Under DEC-0054:

```markdown
- **Annotated (2026-10-13):** amended by DEC-0076: `isRevoked`, and so `reconcileRevision` (`FAC-SEM-084`), matches a `grant` revocation by the normal form of the grant's id; every other kind exactly (`docs/specification/identifiers.md`).
```

Under DEC-0055:

```markdown
- **Annotated (2026-10-13):** amended by DEC-0076: `FAC-SEM-076` keys share grants and `grant` revocations by the normal form of the grant's id (`docs/specification/identifiers.md`).
```

Under DEC-0064:

```markdown
- **Annotated (2026-10-13):** amended by DEC-0076: `FAC-SEM-094` (approver against author), `FAC-SEM-006` (the scoped projects) and `FAC-SEM-096` (a rollback basis's id) compare by normal form (`docs/specification/identifiers.md`).
```

Under DEC-0065:

```markdown
- **Annotated (2026-10-13):** amended by DEC-0076: `byProject` names each project once by the normal form of `projectId`, and the finding names the second spelling (`docs/specification/identifiers.md`).
```

**Board cells** (`docs/backlog.md`), the adapter first. Appended to CT-18's Status cell (the adapter):

```markdown
DEC-0076 (#87), first: port `sameIdentifier` into both kits and run `fixtures/vectors/identifiers.json` (normal, same, different, laxPorts); apply it in `FAC-SEM-030`/`032`/`034` (`fabric-profiles.mjs` lines 232, 241–242, 266–267 and the Python twin) and in `FAC-SEM-014` (`fabric_provider.py` line 153); add respelled-id cases to the route vectors, which are generated from normal-form fixtures and so stay green while the kits disagree; the kits write identifiers in their normal form.
```

Appended to CT-03's Status cell (Fabric):

```markdown
DEC-0076 (#87): emit identifiers in their normal form; every rule Fabric hosts that compares identifiers (approvals, grant revocation, route pinning, bindings, rollback bases) compares by it; an accepted reference is resolved by normal form, and a pair that collides is refused and reported.
```

Appended to CT-20's Status cell (Project Observatory):

```markdown
DEC-0076 (#87): emit identifiers in their normal form (usage reports' `byProject` `projectId`, learning records' `createdBy` and `approvedBy`).
```

Appended to CT-21's Status cell (Fabric Dashboards):

```markdown
DEC-0076 (#87): usage and route views group projects and match routes by normal form.
```

A new row for the first organization server, under the next free CT id (CT-50 at `main` `a1bdde5`):

```markdown
| CT-50 | The first organization server adopts DEC-0076: usage aggregation keyed by `normalIdentifier(projectId)`, the projects and agents it records written in their normal form and looked up by it, and a pair that collides refused and reported | open: the first organization server's (DEC-0076, #87). Goal: reliable-work | `docs/specification/identifiers.md` |
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
- The seam reading was rerun on `c5f89ee`; a confirming reading of `faf20ab` accepted every item. The owner applied the register text above at merge, with Compatibility completed for `FAC-SEM-014`, `isRevoked`/`FAC-SEM-084` and `FAC-SEM-076`, and OQ-0011 given a *Meanwhile* line.

## Checks run

See the pull request: `tsc`, vitest with coverage, the UX lint, docs-check, markdownlint and the privacy check with
`ORG_INDEX`, with their output, and the plants.

## Next task

Review this pull request again (unit, seam, product) and merge it under leases, applying the register text above
(DEC-0076, CT-39). Then CT-40: its edit of `usageProjects` (summing `byProject` costs against the days) keeps the
normal-form key (`normalIdentifier(project.projectId)`) and adds a cost test with two spellings of one project, so the
two rows are one project in the sum as well as in the duplicate check.
