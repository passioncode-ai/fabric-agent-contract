# Packages — `fabric-package/1`

DEC-0050 (format and digest), DEC-0051 (signatures), DEC-0071 (a consumer agent) · rule codes `FAC-SEM-064`…`FAC-SEM-066`,
`FAC-SEM-102` · schema
[`fabric-package`](../../schemas/fabric-package.schema.json) · code [`src/package-rules.ts`](../../src/package-rules.ts) ·
vectors [`fixtures/vectors/package.json`](../../fixtures/vectors/package.json)

A **package** is one version of an agent or of a skill set, as one folder. The file `fabric.package.json` at the
folder's root describes it; every other file of the folder is listed in it with its SHA-256. A machine installs a
package only from these bytes: its digest names it, its publisher signs the digest, and an organization countersigns
it before the package runs for people other than its publisher.

Sources: the first organization server's target architecture v4 (`docs/design/2026-10-12-target-architecture.md` at
`91c0637`; §12's contract set as adopted at `a040e68`), §3 (the nouns *Agent* and *Agent package*), §6 (Paths 1–4
and 6) and §7; the organization edition's agent-network and agent-skills designs (`fabric.package.json`, the J8 single
package format), as owed decision CON-OE-03 records them in the
[board run's findings](../evidence/specs/2026-10-11-board-waves/findings/owed-decisions.json). Each module's part of
v4 is a proposal to its owner; this repository's owner accepted §12's contract set into the board run's wave 3.

## The folder

```text
inbox-digest/
  fabric.package.json            # this document; never listed in files[]
  .claude-plugin/plugin.json     # name = id, version = version (a skill set always has one)
  fabric-agent.json              # an agent's provider manifest (manifest.schema.json)
  bin/serve.mjs                  # the service's entry
  skills/<skill>/SKILL.md
  evals/suite.json
  vendor/…                       # vendored dependencies
```

One package is one Claude Code plugin folder (D-SK1): when the folder has `.claude-plugin/plugin.json`, its `name` is the
package's `id` and its `version` the package's `version`. Claude Code wants a plugin name in kebab-case
(`claude plugin validate --strict` fails otherwise; [source ledger](../evidence/sources.md)), so `id` is kebab-case
and its scope is `publisher`, not a dotted prefix.

## Fields

| Field | Rule | Kind |
|---|---|---|
| `schema` | `fabric-package/1` | both |
| `kind` | `agent` or `skill-set`: one format for both (J8) | both |
| `id` | a kebab-case name, unique for its publisher; the plugin name | both |
| `version` | semantic version 2.0.0 (`common.schema.json` `semver`) | both |
| `publisher` | a kebab-case name: whose package it is. A name, never a key: the key that signs is pinned by the installing machine | both |
| `agentRef` | `urn:fabric:agent:<publisher>:<id>` ([agentRef](#agentref)) | agent, required; never in a skill set |
| `licence` | an SPDX license expression | both |
| `layer` | `base`, `org`, `team`, `workplace` or `person`: the narrowest audience a skill set is published for | skill set, required |
| `runners`, `skills`, `allowedToolsCeiling`, `listingChars` | the runner kinds it is written for; its Agent Skills by name; the union of their `allowed-tools`; the size of its skill listing, measured at packing | optional; a skill set and a consumer agent name at least one skill |
| `provider` | the path of the agent's provider manifest, `fabric-agent.json` ([profiles](profiles.md)) | agent that serves capabilities; absent for a [consumer agent](#a-consumer-agent) |
| `service` | the [service template](#service-template) | agent, optional; never on a consumer agent |
| `secrets[]` | the [secret slots](#secrets), by name | agent, optional |
| `requires` | what the agent needs of a machine: MCP `servers` by service id, MCP servers by role (`mcp[]`: `role`, `tools`, an optional `contract`), `packages` (`publisher`, `id`, `range`), `platforms` (`darwin`, `linux`, `windows`), `gpu` | optional; `mcp` required for a consumer agent |
| `costPresets` | the [cost presets](#cost-presets) | agent, optional |
| `resultSignal` | the [result signal](#the-result-signal) | agent, required |
| `state[]` | what [moves with a placement](#state) | agent, optional |
| `evals` | the suite's path and, for an agent, the publisher's [receipt](#the-evals-receipt) | agent, required with its receipt; skill set, optional |
| `dependencies[]` | [vendored or hash-locked](#dependencies) dependencies | optional |
| `files[]` | every file of the folder but `fabric.package.json`, with its bytes' SHA-256 | both, at least one |
| `digest` | the [digest](#the-digest) | both |
| `signatures[]` | the publisher's signature and organization countersignatures ([signatures](#signatures)) | optional: absent, the package is unsigned |
| `extensions` | namespaced extensions, inside the digest | optional |

A path in the package (`files[]`, `provider`, the service's entry, `evals.suite`, a dependency's `path`, a `state[]`
path) is relative, with forward slashes, and has no `.` or `..` segment, no drive and no control character
(`$defs/path`). The rule holds across a line or paragraph separator (U+2028, U+2029): `a\u2028/../x` has a `..`
segment and is refused (DEC-0097).

### What each source listed, and where it went

v4 §12's row and CON-OE-03's field list are reconciled here; where they differ, v4, the later text, wins.

| Source item | Here |
|---|---|
| v4 "manifest"; CON-OE-03 `fabric.package.json` | this document. The capability manifest of an agent that serves is a file of the folder, named by `provider`; a consumer agent has none |
| v4 "service template" | `service` |
| v4 `secrets[]`, `requires`, `costPresets`, "result signal", `state[]` | the fields of the same names (`resultSignal`); CON-OE-03's `requires {servers, packages}` gains `platforms` and `gpu`, which v4 §6 routes by |
| v4 "evals receipt"; CON-OE-03 `evals` (a path) | `evals.suite` and `evals.receipt` |
| v4 "vendored dependencies" | `dependencies[]` |
| v4 "digest"; CON-OE-03 `digest` ("the folder's content without the signature") | `digest`, over this document without `digest` and `signatures`, the folder covered through `files[]` |
| v4 "ES256 publisher signature", "organization countersignature (a passkey assertion)"; CON-OE-03 `signature` (one) | `signatures[]`, each naming its algorithm — EdDSA until Fabric records D2 ([algorithms](#algorithms)) |
| CON-OE-03 `id` "a scoped reverse name equal to the plugin name" | a kebab-case `id` equal to the plugin name, scoped by `publisher` and named across versions by `agentRef` (v4 §3) |
| CON-OE-03 `schema`, `kind`, `version`, `layer`, `publisher`, `licence`, `runners`, `skills`, `allowedToolsCeiling`, `listingChars` | the fields of the same names |

## A consumer agent

An agent that serves nothing and only calls MCP servers — a Claude Code plugin whose skills use an organization
server's tools — is `kind: agent` **without** `provider` (DEC-0071). It keeps `agentRef`, `resultSignal`, `evals` and
may carry `secrets[]`; it lists its `skills` and its plugin manifest (`FAC-SEM-064`), and has no `service`, `state` or
`layer` (schema). It names the servers it calls in
`requires.mcp[]` by **role**: the server registered under that role name in the placement's configuration (in Claude
Code's `.mcp.json`, the server key) and the `tools` it must expose, with an optional `contract` name for people. The
address and the token are never in the package; they come with the placement, through the secret slots: a role
names the slots that configure its server entry in `secrets` (DEC-0074), each declared in `secrets[]`, one slot feeding
one role (`FAC-SEM-102`). A package
names each role once (`FAC-SEM-102`), and no role, contract or tool is shaped like a credential (`FAC-SEM-065`). Any
package may declare `requires.mcp`; a placement checks it the same way for each. A placement checks the roles before it installs:
[`consumerPlacement`](../../src/package-rules.ts) answers each role the configuration does not register and each tool
a registered server lacks.

## agentRef

`agentRef` names one agent across its versions: `urn:fabric:agent:<publisher>:<id>`, derived from the two fields and
never chosen (`FAC-SEM-066`, `agentRefOf`). A new version keeps it; a placement names the agent by it and keeps it when
it moves (v4 §6, "Move: … same `agentRef`"); another publisher or another id is another agent. The schema's
`$defs/agentRef` is the pattern every document that names an agent uses. A skill set has no `agentRef`: an agent
profile names it by `publisher`, `id` and a range.

## Service template

What a service descriptor ([service](service.md#descriptor)) takes from the package: `id`, `name`, `summary`, the
`entry` argv, whose first element is a path in the folder, and the `runtime` (`node`, `python` or `binary`, with a
version range). The installing machine adds what depends on it: the origin and its port, the token file, the
supervisor, the paths, `installedAt` and `installedBy`. The entry passes no credential (`FAC-SEM-065`).

## Secrets

`secrets[]` names the slots the agent needs: `name` (`^[A-Z][A-Z0-9_]{0,63}$`), a plain-words `purpose`, and
`optional`. A slot holds no value and the schema admits no other member (DEC-0013). The installing machine fills a
slot from the vault, where the estate record places it (v4 §6 Path 2: a placed package's secrets go only where it
declares them; a credential an agent asks for, and one moved between one person's machines outside a placement, arrive in
a [credential envelope](credentials.md#the-envelope), DEC-0111). `FAC-SEM-065` refuses a slot named twice and a name or purpose shaped like a credential.

## Cost presets

`costPresets` has the manifest's shape (DEC-0037, `manifest.schema.json` `costPresets`): an `id`, the `capability`,
a `label`, `maxUsd`, optional `paidTools`, `depth` and `default`. The launcher computes a project's L1 options from the
presets of the agents it runs ([spend policy](spend-policy.md#the-spend-policy)) and reads them from the package
without opening its files. When the provider manifest in the folder also carries `costPresets`, they are equal (the
[folder check](#the-folder-check)).

## The result signal

`resultSignal` is what counts as done for the agent: a `name` and the card's words, `says` ("done when the digest is
written"). Fabric emits a `result` event when a run's signal is met, naming the signal; the event and the meter's
receipts carry the root `run` id and join on it on the person's machines (v4 §6 Path 5). The `result` kind and the
receipts' `run` are DEC-0030's amendment (board item V4-RUN-RESULT); the signal's `name` is what that event names.

## State

`state[]` lists what moves when a placement moves, as paths relative to the service's data folder, each with its
purpose. Absent or empty, nothing moves (v4 §6, Move). A copy for a colleague is packed without state (v4 §6 Path 3).

## The evals receipt

`evals.suite` is the suite's path. An agent's package carries the publisher's run of it, as packed: `ranAt`, the
suite's SHA-256 (`suite`, equal to its `files[]` entry, `FAC-SEM-064`), `passed`, `failed` and `skipped`. It is the
publisher's report; an organization re-runs the suite before it countersigns (v4 §6 Path 4).

## Dependencies

Each dependency names its `ecosystem` (`npm`, `pypi`, `cargo`, `go`, `other`), `name`, `version` and the SHA-256 of its
artifact. With `path` it is vendored: the file is in the folder and listed in `files[]` with the same SHA-256
(`FAC-SEM-064`). Without, it is hash-locked: the installing machine fetches nothing whose bytes do not match. Nothing
else is fetched at install (v4 §6 Path 2).

## The digest

`digest` is `sha256:` and the hex SHA-256 of the UTF-8 bytes of the RFC 8785 form
([canonical forms](conformance.md#canonical-forms), DEC-0043) of the package without `digest` and `signatures`
(`packageDigest`). Signatures stay outside it, so an organization countersigns a package without repacking it. Since
`files[]` is inside it, the digest covers every file of the folder. `FAC-SEM-064` recomputes it.

### The folder check

A digest covers the folder only when the folder is what `files[]` says. `checkPackageFolder` checks, before install
and after unpacking:

| Problem | When |
|---|---|
| `file-missing` | a listed file is absent |
| `file-digest` | a listed file's bytes have another SHA-256 |
| `file-unlisted` | a file other than `fabric.package.json` is present and not listed |
| `plugin-manifest` | `.claude-plugin/plugin.json` is not JSON, or its `name` or `version` is not the package's |
| `provider-manifest` | the provider manifest is not JSON, or carries other `costPresets` than the package |

## Signatures

`signatures[]` holds exactly one publisher signature (`role: publisher`) and any number of organization
countersignatures (`role: organization`); absent, the package is unsigned. Each names `alg`, the `kid` of its key and
`sig`, the base64url signature. Unsigned packages install only where the installing machine allows it — v4 §5 sends one
through a person's gate, and CON-OE-03 admits only a person's own on their own machine — which the machine decides,
not this document.

### What is signed

Every signature covers the UTF-8 bytes of the RFC 8785 form of
`{"type": "fabric-package-signature/1", "role": <role>, "digest": <digest>}` (`packageSigningInput`). The role is
inside, so a publisher's signature replayed as a countersignature fails, even under the same key. The organization
countersignature that v4 §7 defines, an administrator's passkey assertion over a typed challenge with the listing's
audience, grant and revision (`org-countersign/1`), waits on the decision that defines its verifier: DEC-0129 decided
`org-authority/1` as the member list only. This version's countersignature is a detached signature over the statement
above.

### Algorithms

`alg` names the algorithm, and a key names the one it is for. Today it is `EdDSA` (Ed25519, RFC 8032; JOSE name, RFC
8037), and a verifier admits only it. Fabric's decision D2 (ES256 beside EdDSA, ADR-0144) adds `ES256` (RFC 7518 §3.4):
when Fabric records it, `ES256` joins the schema's enum and `PACKAGE_ALGORITHMS`, an additive change; until then a
verifier of this version refuses it as `unknown-algorithm`. Every Ed25519 key passes the small-order check
(`isSmallOrderKey`, DEC-0045) before any verification.

### The verifier

`verifyPackage(package, trust, {countersigned})` is the reference. `trust` holds the keys the installing machine pinned,
per role, as JWKs (`kty`, `crv`, `x`, `kid`, `alg`): the publisher's key from the estate record or the listing (a partner's key that `publisherScopes` names, from the
record only, [the partner channel](partner-channel.md)), the
organization's keys from its record. It answers `{ok: true, digest, signers, unverified?}` or the first problem, in this order — PK-1's package checks,
PK-2…PK-4, then each signature in array order: its shape (PK-1's entry part) and PK-5…PK-9:

| Row | Problem | When |
|---|---|---|
| PK-1 | `malformed` | the package is not an object, its `digest` is not a string, it has no RFC 8785 form, or a signature entry lacks a role, `alg`, `kid` or a base64url `sig` |
| PK-2 | `digest-mismatch` | the recomputed digest is not `digest` |
| PK-3 | `unsigned` | there is no signature |
| PK-4 | `no-publisher-signature` | there is not exactly one publisher signature |
| PK-5 | `unknown-algorithm` | a signature's `alg` is not admitted |
| PK-6 | `unknown-key`, `duplicate-kid` | its role's key set holds no key, or two keys, under its `kid` |
| PK-7 | `key-algorithm-mismatch`, `unusable-key` | the key is for another `alg`, or is not a public Ed25519 key for signing (another type or curve, a private part, `use` other than `sig`, not 32 bytes) |
| PK-8 | `small-order-key` | the key is of small order (DEC-0045) |
| PK-9 | `bad-signature` | the signature is not 64 bytes or does not verify over the statement |
| PK-10 | `no-countersignature` | `countersigned` is asked and no organization countersignature verified |

A signature under a pinned key must verify: a bad countersignature refuses the package, it is never skipped. An
organization countersignature whose `kid` the machine does not pin at all is set aside and listed in `unverified`,
unless `countersigned` is asked — then it is `unknown-key`. So the publisher's own machines, which pin no organization
key, keep installing a package after an organization countersigns it; a pinned organization key that cannot be used
still refuses it. The vectors hold
one case per problem, the test keys' seeds (Ed25519 is deterministic, so a port's signer reproduces every `sig`), the
digest's canonical form and the signing input. The small-order case is a signature forged under the all-zero key with
no private key: `crypto.verify` accepts it on Node 20 and 22 and refuses it on 24 and 26.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-064"></a>`FAC-SEM-064` | `package` | the package is whole: its `digest` is its own; each path is listed once and `fabric.package.json` never; the provider manifest, the service's entry, the evals suite and a vendored dependency are listed, the receipt's and the dependency's SHA-256 equal to the listed file's; a state path is declared once; a skill set lists its plugin manifest |
| <a id="fac-sem-065"></a>`FAC-SEM-065` | `package` | a package carries no secret: a slot is named once, and its name and purpose are not shaped like a credential; the service's entry carries none |
| <a id="fac-sem-066"></a>`FAC-SEM-066` | `package` | an agent's `agentRef` is `urn:fabric:agent:<publisher>:<id>` |
| <a id="fac-sem-102"></a>`FAC-SEM-102` | `package` | a package names each MCP role in `requires.mcp[]` once: one role, one server; each slot a role names in `secrets` is declared in `secrets[]`, and one slot feeds one role (DEC-0071, DEC-0074) |

## Privacy

The package describes an agent, its files and its needs. It has no field that names, identifies or measures a
person: `publisher` names who publishes, `layer` a publication scope, the receipt counts an agent's test cases. A
package records no use and no user (the organization edition's open/private split, J10).

## Not decided here

- `ES256`: when Fabric records D2; the passkey-assertion countersignature, whose challenge type
  `org-countersign/1` DEC-0063 registered, waits on the decision that defines its verifier (v4 §12, later waves).
- How a countersignature chains to an organization's root: an administrator's credential is listed by the root in
  `org-key-set/1`'s `administrators` (DEC-0129); the `org-countersign/1` verifier that reads it is not decided. Which keys a machine pins for a
  publisher is decided by the [estate record](estate-record.md#machines) (DEC-0055: `publisherKeys` and
  `placementTrust`).
- Where a package's bytes are fetched from (v4 §4: the relay's blob store, by digest), and how a machine reports a
  refused package.
- A skill-set listing's budget check against an agent profile (`fabric-agent-profile/1`, CON-OE-03).
