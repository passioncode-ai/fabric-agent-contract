# Identifiers — when two identifiers are the same

DEC-0076 · code [`src/identifiers.ts`](../../src/identifiers.ts) (`normalIdentifier`, `sameIdentifier`) · vectors
[`fixtures/vectors/identifiers.json`](../../fixtures/vectors/identifiers.json) · tests
[`test/identifiers.test.ts`](../../test/identifiers.test.ts)

Agents, projects, proposals, settings and accounts are named by URIs (`common.schema.json#/$defs/uri`, `format: uri`).
One URI can be written several ways: `AGENT:x` and `agent:x`, `urn:Fabric:agent:x` and `urn:fabric:agent:x`,
`https://example.com/%7Ex` and `https://example.com/~x`. A rule that compares the strings byte for byte reads those as two
agents or two projects, so an author could approve their own proposal under another spelling of their id, and one
project could split its costs over two rows. This page fixes when two identifiers are the same.

Sources: [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) §6.2.2 (syntax-based normalization) and
[RFC 8141](https://www.rfc-editor.org/rfc/rfc8141) §3.1 (URN-equivalence), both pinned with their SHA-256 in the
[source ledger](../evidence/sources.md).

## The normal form

**Two identifiers are the same when their normal forms are equal** (DEC-0076). The normal form is:

1. **A URI** — a string that matches RFC 3986's `URI` production and has an authority or a non-empty path — normalized
   by RFC 3986 §6.2.2, and by nothing scheme-based (§6.2.3):
   - the scheme and the host lower-cased, and percent-encoding hex upper-cased (§6.2.2.1); the user information, the
     path, the query and the fragment keep their case;
   - a percent-encoded unreserved character (`A`–`Z`, `a`–`z`, `0`–`9`, `-`, `.`, `_`, `~`) decoded (§6.2.2.2); a reserved
     one, such as `%2F`, stays encoded, because decoding it changes the URI;
   - dot segments removed from a hierarchical path — one after an authority or beginning with `/` — by §5.2.4's
     `remove_dot_segments` (§6.2.2.3); a path that would then begin with `//` without an authority keeps its dot
     segments, so it is never read as an authority;
   - a rootless path (`agent:./x`) loses its leading `./` and `../` segments (§5.2.4's step A) while what is left stays
     rootless — not empty and not beginning with `/`; dot segments further in (`agent:a/../b`) are kept, because
     `remove_dot_segments` there can turn a rootless path into an absolute one (`a/../b` → `/b`). Keeping them is the
     contract's own narrowing of §6.2.2.3, under RFC 3986 §6.1's aim of no false positives: `agent:a/../b` and `agent:b`
     are two identifiers;
   - no default port removed, and no empty path made `/`.
2. **A URN** (a URI whose scheme is `urn`) normalized by RFC 8141 §3.1 instead: `urn` and the NID lower-cased (an NID
   is case-insensitive, §2.1), percent-encoding hex upper-cased, and **nothing decoded** (§3.1: percent-encoding
   normalization MUST NOT be applied); the NSS keeps its case; the r-, q- and f-components (`?+…`, `?=…`, `#…`) are
   ignored. A `?` not followed by `+` or `=` is no URN component and is kept.
3. **Any other string** — no scheme, a character outside the URI grammar, a malformed percent triplet, a port that is
   not digits, an empty path with no authority (`x:`) — is its own normal form: it is compared as it is. A value that is
   not a string has no normal form and is compared as it is (`===`).

| Spelling | Normal form | Why |
|---|---|---|
| `AGENT:x` | `agent:x` | a scheme is case-insensitive |
| `agent:X` | `agent:X` | a path keeps its case |
| `URN:Fabric:agent:x` | `urn:fabric:agent:x` | the NID is case-insensitive |
| `urn:fabric:agent:X` | `urn:fabric:agent:X` | the NSS keeps its case |
| `urn:example:a%7e` | `urn:example:a%7E` | a URN decodes nothing |
| `https://EXAMPLE.com/%7ex` | `https://example.com/~x` | the host lower-cased, an unreserved octet decoded |
| `https://example.com/a%2fb` | `https://example.com/a%2Fb` | a reserved octet stays encoded |
| `https://example.com/a/./b/../c` | `https://example.com/a/c` | dot segments removed |
| `agent:./x` | `agent:x` | a rootless path's leading dot segments removed |
| `agent:a/../b` | `agent:a/../b` | a rootless path's inner dot segments kept |
| `https://example.com:443` | `https://example.com:443` | no scheme-based normalization |

The only strings normalized are ones the schema's `format: uri` admits, and each normal form is admitted too
(`test/identifiers.test.ts`, on the same inputs). The schema's validator also admits a few strings RFC 3986 refuses (a
port that is not digits, read as an empty authority before a path); those are compared as they are, so the difference can
only miss a sameness, never invent one — RFC 3986 §6.1's aim: avoid false positives.

## Writers and readers

- **A writer SHOULD emit the normal form** of every identifier it writes, so a reader pinned before DEC-0076, which
  compares bytes, reads the same identifiers as one that compares normal forms.
- **A reader MUST compare by normal form** wherever a rule compares identifiers for sameness: an approver against an
  author, a row against the rows before it, a binding against the route it pins. `sameIdentifier(a, b)` is the reference;
  a port runs the [vectors](../../fixtures/vectors/identifiers.json), which include the mistakes a lax port makes
  (decoding `%2F`, lower-casing a URN's NSS, decoding inside a URN, removing a default port).
- **A host that resolves an accepted reference looks it up by normal form**: the account a context selects, the provider
  revision and the route a binding or an event names, the setting a rollback returns to. A rule that accepts
  `URN:account:a` for the pool's `urn:account:a` is only half the change; the lookup that follows it must find the same
  record.
- Neither function throws, and neither keys anything by input in a plain object, so `__proto__` and `constructor` are
  strings like any other.

## Compatibility

DEC-0076 tightens some rules and loosens others. A reader pinned before it compares bytes.

- **Tightened** — `FAC-SEM-094`, `FAC-SEM-006`, `FAC-SEM-025` (`byProject`), `FAC-SEM-076` (share grants): two spellings of one id that passed as two
  now meet as one. A byte-comparing reader keeps letting `AGENT:x` approve `agent:x`'s proposal and keeps splitting one
  project over two rows; only a reader at this pin refuses them.
- **Loosened** — a rule now accepts a reference spelled otherwise, and a reader that compares bytes then fails at the
  lookup that follows:
  - `FAC-SEM-002`: a selected account spelled otherwise passes, but a byte lookup finds no pool account and the pool's
    fallback spends **another account**;
  - `FAC-SEM-030`, `FAC-SEM-032`, `FAC-SEM-034`: a candidate, a binding or an event spelled otherwise agrees with the
    route, but a byte lookup misses the admitted revision and **the route walk moves on** to the next candidate;
  - `FAC-SEM-096`: a rollback basis spelled otherwise passes, but a byte lookup that finds a record under that exact
    spelling **reaches the other setting**.
  - `FAC-SEM-014`: a `providerId` spelled otherwise passes, but a byte lookup of the manifest by it **misses**;
  - `isRevoked`, and with it `reconcileRevision` (`FAC-SEM-084`), for a `grant` revocation: a reader at this pin
    matches a revoked grant spelled otherwise, but a reader pinned before it **still lets that grant through** — the
    fail-open this decision closes.

  So a writer emits the normal form (then both readers agree), and a host that accepts a spelling looks the record up by
  normal form (the previous section).
- **Records that already collide.** Records stored before this decision under two spellings of one id (two settings,
  two projects, two accounts whose ids have one normal form) are one identifier from this decision on. A host that finds
  such a pair does not pick one of them silently: it refuses the reference and reports the collision until its operator
  merges the records or renames one to an id with another normal form.

## Where identifiers are compared

The rules that compare identifier-typed fields compare their normal forms (DEC-0076 lists each site and the ones left):

| Rule | Comparison |
|---|---|
| `FAC-SEM-094` ([governance and roles](governance-and-roles.md#semantic-rules)) | the approver against the author `meta.createdBy` |
| `FAC-SEM-025` ([service](service.md#usage-report)) | each `byProject[].projectId` against the rows before it; the finding names the second spelling |
| `FAC-SEM-006` ([conformance](conformance.md#semantic-rule-codes)) | the projects active assignments scope, and the product managers of each |
| `FAC-SEM-002` ([conformance](conformance.md#semantic-rule-codes)) | the selected account against the pool's account references |
| `FAC-SEM-096` ([versioning](versioning.md#semantic-rules)) | a rollback basis's `id` against the setting's own |
| `FAC-SEM-014` ([provider](provider.md#semantic-rules)) | an entry's `providerId` against its manifest's `provider.id` (the slug against the file stem stays as written) |
| `FAC-SEM-076` ([estate record](estate-record.md#semantic-rules)) | a share grant's `meta.id` against the grants before it, and a `grant` revocation's `ref` against the grants and the revocations before it |
| `FAC-SEM-111` ([estate record](estate-record.md#semantic-rules), DEC-0082) | a placement's `grant` against the share grants' `meta.id` and the `grant` revocations' `ref` |
| `FAC-SEM-039` ([activity](activity.md#semantic-rules), DEC-0082) | a `grant.usage`'s `grantId` against the `grant.usage` events before it in the same stream and day |
| `isRevoked` (`src/revocation-delta.ts`; [revocation delta](revocation-delta.md), and through it `reconcileRevision`, `FAC-SEM-084`) | a `grant` revocation's `ref` against the grant asked about; every other kind exactly |
| `FAC-SEM-030`, `FAC-SEM-032`, `FAC-SEM-034` ([runners](runners.md#semantic-rules)) | a revision reference's `id`, and the project and the `capability` of an admission, a binding or an event against the route's — there `capability` is a capability's URI (`common.schema.json#/$defs/uri` in `runner-route`, `runner-route-event`, `binding` and `admission`) |

**Compared as written** — fields that are not URIs, or whose comparison another specification fixes:

- a repository identity (`normalizeOrigin`, [folder attribution](attribution.md#the-repository-identity), DEC-0089):
  `host/path` in lower case from a remote URL, compared as written once built; it folds the path's case, so it is not
  the normal form above, which compares URIs;

- board Project ids (`comms-common.schema.json#/$defs/projectId`, opaque) and capability names on a directory page
  (`FAC-SEM-107`, DEC-0077): neither is a URI;
- context ids (`common.schema.json#/$defs/contextId`: `personal`, `org:<orgId>`; [contexts](contexts.md), DEC-0082) — a
  grant's `context` against a placement's (`FAC-SEM-111`), a session's or a grant's against an enrollment's `org.id`
  (`routeTarget`, `routeGrantUsage`): never case-folded or by prefix; the pattern admits no upper-case prefix and no `%`,
  so every valid value is already its normal form and the two comparisons agree;
- share grant ids (`common.schema.json#/$defs/shareGrantId`: `urn:fabric:share:` and 32 lower-case hex digits;
  [share registration](share-registration.md#the-share-grant-id), DEC-0086), a registration's `grantId` against what a
  receiver holds and a `grant.usage`'s against a registration's: the pattern admits only its own normal form (`urn` and
  the NID lower-case, the NSS lower-case hex), so a share grant id is its own normal form and comparing it as written
  agrees with `FAC-SEM-039`'s and `FAC-SEM-111`'s comparison by normal form;
- a board finding's `affects` items (`FAC-SEM-108`, DEC-0080): a backlog row's `repository`, `path` and `id`, whose
  patterns admit no `:`, so none is a URI; a task's id, an opaque id of the host's task (DEC-0041's grammar); and its
  `dedupeKey`, a key like the idempotency key, not an identifier;

- a delegation token's and an approval's claims (`iss`, `sub`, `project`, a grant's principal and issuer, an onward
  token's parent claims): JWT claims, which [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519) §2 compares "as
  case-sensitive strings with no transformations or canonicalizations applied"; the hub copies them from the grant it
  signs, so a different spelling is refused, fail closed ([delegation](delegation.md));
- a revision's revocations against its parent's (`FAC-SEM-072`, `revocationKey` in `src/estate-record-rules.ts`): a
  `grant` revocation re-spelled in the next revision reads as dropped, and the revision is refused — fail closed, so a
  writer keeps each revocation exactly as it was first written;
- `agentRef` (`urn:fabric:agent:<publisher>:<id>`): its schema pattern admits only lower case and no `%`, so every valid
  value is already its normal form;
- opaque ids (`activity-common.schema.json#/$defs/opaqueId`: estates, machines, devices, users, sessions, leases),
  agent ids and service ids (patterns of lower-case names; a provider entry's slug `id` and its file stem,
  `FAC-SEM-013`, `FAC-SEM-014`), capability names (`common.schema.json#/$defs/capabilityName`,
  a lower-case dotted name: the manifest, pipelines, `fabric-interop/0.1` and the project board — not the URI-typed
  `capability` of a route, a binding or an admission above), model ids, runner kinds, MCP roles, secret slots, key ids,
  `jti`, claim ids and enum values: names, not URIs.
