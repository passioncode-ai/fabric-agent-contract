# Conformance and compatibility

`covers: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-007, REQ-008, REQ-009, REQ-010, REQ-012, REQ-013, REQ-014, REQ-017`

## Check layers

| Layer | Proves | Does not prove |
|---|---|---|
| schema | document structure and local invariants | provider semantics or authorization |
| reference integrity | canonical IDs, `$ref`, versions and links resolve | remote service behavior |
| protocol | declared MCP/A2A/local negotiation behavior | advertised business capability |
| semantic probe | bounded capability assertions | future availability or all production inputs |
| policy | binding, scope, grant, role and data constraints | work quality |
| checker | result acceptance for a specific node | unrelated claims or product outcomes |

## Conformance report

A report pins contract version, subject, subject revision, check catalogue
revision, start/end time and tool revision. Each check has `passed`, `failed`,
`skipped` or `blocked`, evidence references and a safe diagnostic. Overall status
is failed when any required check fails or is blocked.

Diagnostics MUST NOT include secret values. JSON instance paths, schema keyword,
expected class and supported versions are safe diagnostics.

## Required repository gates

`pnpm run check` runs:

1. TypeScript typecheck;
2. compilation of every Draft 2020-12 schema;
3. positive fixtures expected to pass;
4. negative fixtures expected to fail for their named rule;
5. cross-object policy tests;
6. Markdown lint;
7. relative-link resolution;
8. Mermaid syntax parse;
9. version and canonical-ID consistency;
10. UX trace lint;
11. one spelling of every extension key (G-08) and glossary profile names equal to the
    manifest schema's (G-12), in the documentation check;
12. the pipeline reference checker's rules PL-1…PL-4;
13. one allocation and one definition of every semantic rule code (G-13).

The merging session runs the same frozen command on the candidate and records its output in the pull request;
hosted CI runs it nightly on `main` and on a manual dispatch (`gh workflow run ci.yml --ref <branch>`). A green check never
substitutes for semantic review of prose. Before release, at least one planted
negative fixture is temporarily inverted and observed failing; the restored green
run is recorded in the retrospective.

## Clients and readers

Conformance binds the side that reads as well as the side that serves. These rules are checked
on what a client sends or a reader accepts, not on a provider's own documents:

| Who | Requirement | Rule | Checked by |
|---|---|---|---|
| a client of a service's token-protected routes, the events feed first | sends the token only in the header the descriptor's `auth.header` names, in the form `auth.scheme` names (`none`: the raw token; `Bearer`: `Bearer <token>`), and never assumes `Authorization: Bearer` | `FAC-SEM-036` | `test/service-feed.test.ts`, fixtures `fixtures/semantic/service-feed-request-*.json` ([service](service.md#feed-client), DEC-0025) |
| a reader of a settings backup | refuses a file whose checksum, counts or row widths do not match its tables | `FAC-SEM-035` | `test/settings-backup.test.ts`, fixtures `settings-backup*` ([service](service.md#settings-backup), DEC-0025) |
| a receiver of activity batches | attributes a batch to its client certificate's device and user (or the certificate a verified request signature names, DEC-0056), refuses an event that carries a content or person key instead of stripping it, and acknowledges the highest consumed seq of each stream | `FAC-SEM-037`, `FAC-SEM-039`, `FAC-SEM-045` | `test/activity-rules.test.ts`, fixtures `fixtures/semantic/activity-*`, `device-attribution-*` ([activity](activity.md#batch-and-acknowledgement), DEC-0030) |
| a callee of a delegation token or an approval | names the issuer it trusts and refuses `iss` from any other; checks the signature against the estate's published keys, the claims' DL-2 types, the times with a 60 s leeway, its own agent id in `aud`, the chain's depth, the called capability and its effect, and an approval's action digest and single use, in DL-13's order, answering one of the contract's refusal codes; requires no token, approval or grant record of a T0 or T1 caller | DL-13, DL-18, DL-26 | `test/delegation.test.ts`, `test/delegation-sealed.test.ts`, `src/delegation.ts` `verifyDelegation`, `verifyApproval` ([delegation](delegation.md#the-verifier), DEC-0039, DEC-0045) |
| the meter, answering a grant check | verifies the callee's onward token (the issuer it trusts, audience itself, at most five actors, scope exactly its grant-check capability, effect exactly `none`) and answers any refusal of it as `principal-unproven`; reads the amount and the callee's `jti` from the request, never a token from it; answers a `denied` as a normal result, not `isError` | DL-6, DL-19, DL-21 | `test/delegation-seams.test.ts`, `test/delegation-sealed.test.ts`, `src/delegation.ts` `verifyMeterToken`, `schemas/grant-check-request.schema.json` ([delegation](delegation.md#spend-and-usage), DEC-0039, DEC-0045) |
| a callee refused by the meter | relays the denial to its caller with the meter's `code` unchanged in `error.code`, and its `window`, `level` and `approvalRequest` in `error.data` | DL-21 step 6 | `test/delegation-sealed.test.ts`, `src/delegation.ts` `refusalFromDenial` ([delegation](delegation.md#spend-and-usage), DEC-0045) |
| the meter, reading a grant beside the hub | after the onward token is verified, reads the grant it names from the hub's projection (`grantsDir`, `<meta.id>.json`, 0600 in 0700) and denies `no-grant`, `grant-revoked`, `grant-expired` or `unknown-state` when the file is missing, unreadable, at another revision or not active; keys the `task` window on the token's `task`, else on the first `session` met walking the token's actor chain from its outermost actor, else on the grant itself (`grant:<ref>`), never on a `jti`; on Windows answers `unknown-state` before reading | DL-23, DL-24 | `test/meter-grant.test.ts`, `src/grant-projection.ts` `readProjectedGrant`, `src/delegation.ts` `taskWindowKey` ([delegation](delegation.md#the-hubs-grant-projection), DEC-0041) |
| Fabric, reading a `fabric://` link | ignores unknown parameters, validates the known ones and refuses a link that could carry a credential, matching credential words as whole words of a name (DEC-0041) | `FAC-SEM-052` | `test/fabric-button.test.ts`, `test/meter-grant.test.ts`, `src/fabric-links.ts` `parseFabricLink` ([Fabric's button](fabric-button.md#deep-links), DEC-0040) |
| a host handing a coding-agent session its folder | writes `handoff.json`, `context.md`, `mcp.json` and the declared `brief.md`/`task.md` in its user data, 0700/0600, the preamble naming one first tool, Claude Code's joined `--mcp-config=`, a bearer only per session and a secret only in `mcp.json` | `FAC-SEM-053`, `FAC-SEM-054`, `FAC-SEM-055` | `test/session-handoff.test.ts`, `src/session-handoff.ts` `validateSessionHandoff` ([session handoff](session-handoff.md#the-kits-checker), DEC-0042) |
| a watcher of services' well-known documents (Fabric Dashboards' outage watcher, FD-48) | alerts on a `degraded` source held past its threshold only when the entry does not say `setup: true`; shows a setup entry as waiting for a person | service.md, DEC-0044 | the watcher's own test; the contract checks the field's shape (`fixtures/positive/service-well-known-setup.json`, `test/service-hygiene.test.ts`) ([service](service.md#well-known-document)) |
| a host starting a declared stdio MCP server | starts it for a project or for one run as its `scope` says (absent: one run), and never writes it into a runtime's user-wide MCP configuration | `FAC-SEM-056` (the declaration) | the host's own test; `test/service-hygiene.test.ts` checks declarations ([profiles](profiles.md#where-a-stdio-server-is-declared), DEC-0044) |
| a host launching an agent on a model profile | resolves the profile in the order request, agent, binding or project, estate default; keeps only the models every class of which the project's spend policy allows; refuses the launch with `model-classes-empty`, naming the policy, when none stays; uses a subscription only in its vendor's runner | `FAC-SEM-059`, `FAC-SEM-060` | `test/runner-model-profiles.test.ts`, `src/profile-rules.ts` `resolveModelProfile` ([runners](runners.md#resolution), DEC-0046) |
| an issuer of a key route's key | admits exactly the models of the runner profile's model profile (`key.modelAllowList`), and a proxy applies a catalogue row's `provider` routing without changing the model | `FAC-SEM-059`, `FAC-SEM-058` (the declaration) | the issuer's own test; the contract checks the declarations ([runners](runners.md#routes), DEC-0046) |
| a machine installing a package | checks the folder against `files[]` (`checkPackageFolder`), recomputes the digest, then verifies exactly one publisher signature and every organization countersignature under the keys it pinned for each role, refusing an algorithm it does not admit, a key for another algorithm and a small-order key before verifying, in PK-1…PK-10's order; installs an unsigned package only where its own rules allow it | PK-1…PK-10, `FAC-SEM-064` | `test/package.test.ts`, `src/package-rules.ts` `verifyPackage`, `checkPackageFolder`, vectors `fixtures/vectors/package.json` ([package](package.md#the-verifier), DEC-0050, DEC-0051) |
| a device applying policy | applies a delivered policy only when it verifies under a key valid when it verifies and moves its revision forward, applies a key set only when it verifies under the root key, stays in its organization and moves its revision forward, and never lets a lower layer override a locked key | `FAC-SEM-041`, `FAC-SEM-042`, `FAC-SEM-046` | `test/device-rules.test.ts`, fixtures `fixtures/semantic/device-policy-*` and `fixtures/semantic/device-key-set-*` ([devices](devices.md#policy), [key sets](devices.md#key-sets), DEC-0031, DEC-0053) |
| a machine applying an estate record | applies a revision only when it is valid against `schemas/estate-record.schema.json` and verifies offline (`verifyEstateRecord`): its own digest, the parent's next number and digest (revision 1 under the passkey it pinned at enrollment), a passkey its parent lists and does not revoke, the WebAuthn Level 3 §7.2 checks — type, challenge over the digest, a pinned origin, top-level, `rpIdHash`, UP and UV — the signature, a validity window of at most 30 days around a readable clock, and the record's own rules; installs only a package the record places on it, under the publisher key the record pins (`placementTrust`), and fills only placed slots | `FAC-SEM-072`…`FAC-SEM-076` | `test/estate-record.test.ts`, fixtures `fixtures/semantic/estate-*`, vectors `fixtures/vectors/estate-record.json` ([estate record](estate-record.md#what-is-verified-offline), DEC-0055) |
| a receiver of device requests that requires the signature, or that sees a client certificate — batches, check-ins, rotation requests | verifies every `fabric-device` HTTP message signature that is present (RFC 9421 subset): `Content-Digest` exactly `sha-256` of the body, `created` within 300 s of a readable clock, `keyid` the client certificate's serial when there is one, a certificate by `keyid` that is not revoked and valid now, `alg` the signing key's, a usable key, the base over a target URI built from its public base URL, a signature that verifies; then records (serial, `nonce`) until `created + 300` s and answers a repeat `signature-replayed`; accepts an unsigned request only on a valid client certificate; each refusal a 401 with its code. Its data model records, with each certificate, whether the signing key is the enrollment's `#sig` key or the certified key | `FAC-SEM-077` | `test/http-signature.test.ts`, fixtures `fixtures/semantic/device-request-signature-*`, vectors `fixtures/vectors/http-signature.json`, `src/http-signature.ts` `verifyDeviceRequest` ([devices](devices.md#transport), DEC-0056) |
| a device sending requests | signs every batch, check-in and rotation request with its `#sig` key under the `fabric-device` label, a fresh nonce each time, `keyid` its certificate's serial, the target URI from the base URL it enrolled with | `FAC-SEM-077` (the receiver's side) | `test/http-signature.test.ts` (the reference signer `signDeviceRequest`, verified by the receiver) ([devices](devices.md#transport), DEC-0056) |
| a device deciding under its policy | keeps every lock after its policy expires, stops grants, remote execution and a person's key for others then, lets a person's key serve others only where sharing is `allowed`, uploads nothing that occurred before its collection start, and accepts a root key only certified by the offline root its installer pinned | `FAC-SEM-068`, `FAC-SEM-069` | `test/device-rules.test.ts`, fixtures `fixtures/semantic/device-action-*` and `fixtures/semantic/device-root-certification-*` ([devices](devices.md#policy), [root certification](devices.md#root-certification), DEC-0053) |

A client that fails `FAC-SEM-036` breaks without an error: the service refuses every poll, and
the client shows an empty feed and drops every `notify: true` event.

## Canonical forms

A signature or a digest over JSON covers bytes, so the signer and the verifier must write the same bytes. The
contract has two canonical forms, both in [`src/canonical.ts`](../../src/canonical.ts), and every signed or hashed
JSON document names one of them (DEC-0043). They give different bytes for the same value — separators, key order
above U+FFFF, fractions — so a document never says only "canonical JSON".

| Form | Function | Key order | Separators | Numbers | Strings | Refuses |
|---|---|---|---|---|---|---|
| the settings form (DEC-0025) | `settingsCanonicalJson` | by Unicode code point, at every level | `", "` between members and elements, `": "` after a key | integers within ±(2^53 − 1), in decimal | `"`, `\` and the control characters escaped as `JSON.stringify` escapes them; every other character as itself | a fraction, an unsafe or non-finite number, `undefined`, a function, a bigint, and a lone surrogate in any string or key, which Python cannot encode (CT-25, DEC-0052; a rule that derives from the form refuses its input rather than throw). It does not check prototypes |
| RFC 8785, JCS (DEC-0039) | `rfc8785` | by UTF-16 code unit, at every level | none | ECMAScript form: `1e+30`, `0.002`, `-0` as `0` | as `JSON.stringify` escapes them | a non-finite number, a lone surrogate, a value that is not plain JSON: a date, a map, a class instance, an `undefined` member |

The settings form equals Python's `json.dumps(value, sort_keys=True, ensure_ascii=False)`; RFC 8785 is pinned in
the [source ledger](../evidence/sources.md). The old names `canonicalJson` (`src/settings-backup.ts`) and `jcs`
(`src/delegation.ts`) re-export these two.

| Document | Form | Computed by | Specified in |
|---|---|---|---|
| a settings backup's `sha256`, over `tables` | settings form | `settingsBackupDigest` | [service](service.md#settings-backup), DEC-0025 |
| a device policy's Ed25519 signature, over the policy without `signature` — DEC-0031's "its canonical JSON" | settings form | `policySigningInput` | [devices](devices.md#policy), DEC-0031 |
| a policy key set's signature under the root key | settings form | `policySigningInput`, as a policy | [devices](devices.md#key-sets), DEC-0031 |
| a root certification, a delegation key's certificate and a delegation revocation list, each without `signature` | RFC 8785 | `certificationSigningInput` | [devices](devices.md#root-certification), DEC-0053 |
| an activity event's derived `eventId`, over `{key, source}` | settings form | `activityEventId` | [activity](activity.md#event-id), DEC-0030 |
| an organization tenant's `tenantRef`, over `{provider, tenant}` | RFC 8785 | `tenantRef` | [activity](activity.md#envelope), DEC-0052 |
| a path-derived `sourceKey`, the HMAC over `{offset, path}` | settings form | `pathSourceKey` | [activity](activity.md#event-id), DEC-0030 |
| an approval's `actionDigest`, over the action | RFC 8785 | `actionDigest` | [delegation](delegation.md#approval-approval1), DEC-0039 |
| the board's idempotency digest, over the operation's arguments after `fabric-project-comms/0.1` NUL `<operation>` NUL | RFC 8785, the arguments holding integers within ±(2^53 − 1) only | `commsDigest` in [`src/comms-digest.ts`](../../src/comms-digest.ts) | [project comms](project-comms.md#idempotency), DEC-0022 |
| a package's `digest`, over the package without `digest` and `signatures` | RFC 8785 | `packageDigest` | [package](package.md#the-digest), DEC-0050 |
| a package signature's statement `{type, role, digest}` | RFC 8785 | `packageSigningInput` | [package](package.md#what-is-signed), DEC-0051 |
| an estate record's `digest`, over the record without `digest` and `signature` | RFC 8785 | `estateRecordDigest` | [estate record](estate-record.md#the-digest), DEC-0055 |
| an estate revision's passkey challenge, SHA-256 over `{type: "estate-revision/1", digest}` | RFC 8785 | `estateChallenge` (`estateChallengeInput` for the bytes) | [estate record](estate-record.md#the-signature), DEC-0055 |
| a revisioned object's `contentHash`, over the object without `contentHash` | RFC 8785 | `rfc8785`; no contract code computes it | [overview](overview.md#common-identity-and-references) |

A JWS — the delegation token, the approval document — signs its own base64url segments as sent and needs no
canonical form; a device's HTTP message signature signs RFC 9421's signature base and its `Content-Digest` hashes the
body's bytes, neither a JSON form ([devices](devices.md#transport), DEC-0056); a session handoff's `integrity` digests file bytes, and so does an artifact's or an evidence item's
`contentHash` (`common.schema.json`, `work.schema.json`, `comms-common.schema.json`): it digests the artifact's
bytes, not a JSON form, despite sharing the revision hash's name. A learning proposal's `proposedPayloadHash`
(`memory.schema.json`) names no form yet: it is open, and the decision that first computes it picks one of the two.

A new signed or hashed document picks one of these two forms and names it, never a third: a document that is or
mirrors stored settings takes the settings form; any other takes RFC 8785. A restriction of the input, as the
board's integers, is not a third form, since the bytes stay those of the named form. The shared vectors,
[`fixtures/vectors/canonical.json`](../../fixtures/vectors/canonical.json), hold each form's cases (RFC 8785's own
samples and its Appendix B among them), the inputs on which the two differ, and the board's digests; a kit port
runs its functions over them, and `test/canonical.test.ts` runs this repository's.

## Semantic rule codes

Every semantic rule has one `FAC-SEM-NNN` code, and this table is where a code is allocated.
A code is never reused or renumbered. A new code is reserved race-free with
`agent_sync.py reserve SEM` (DEC-0029), which reads the marker below as its floor and prints its
receipt as `SEM-0NNN` — the number of `FAC-SEM-NNN`. The row keeps that receipt in its last column,
which is also what agent-sync looks for when it reports reserved ids that never reached git: on 2026-10-07
main (DEC-0026) and an open branch (DEC-0025) each defined their own `FAC-SEM-028` and
`FAC-SEM-029`, numbered by hand. A rule is defined in one place: the codes `FAC-SEM-000`…`FAC-SEM-008` here, every
other code in the semantic-rules table of the specification this table names.
`test/consistency.test.ts` (G-13) fails when a code is allocated twice, defined in two rows anywhere
in the specifications, given other kinds there than here, named by `src/` without a row here, named by
two modules, or listed here without a checker. Codes up to `FAC-SEM-034` were allocated before the
register and carry no receipt.

**Next free rule code:** `FAC-SEM-078`

| Code | Kind | Defined in | Receipt |
|---|---|---|---|
| `FAC-SEM-000` | any | here: the value checked is a JSON object | — |
| `FAC-SEM-001` | `result` | here: a `succeeded` result keeps no unverified required claim | — |
| `FAC-SEM-002` | `execution-bundle` | here: the selected account is in the pinned project pool | — |
| `FAC-SEM-003` | `learning` | here: a learning proposal cannot apply itself | — |
| `FAC-SEM-004` | `promotion` | here: personal, credential or regulated content never promotes globally | — |
| `FAC-SEM-005` | `roles` | here: the estate has exactly one active CEO | — |
| `FAC-SEM-006` | `roles` | here: each project has exactly one active product manager | — |
| `FAC-SEM-007` | `coordination` | here: a renew names the claim it renews | — |
| `FAC-SEM-008` | `binding-bundle` | here: only an admitted provider revision is bound | — |
| `FAC-SEM-009` | `service-observation` | [service](service.md#semantic-rules) | — |
| `FAC-SEM-010` | `service-directory` | [service](service.md#semantic-rules) | — |
| `FAC-SEM-011` | `service-well-known` | [service](service.md#semantic-rules) | — |
| `FAC-SEM-012` | `service-descriptor` | [service](service.md#semantic-rules) | — |
| `FAC-SEM-013` | `provider-directory` | [provider](provider.md#semantic-rules) | — |
| `FAC-SEM-014` | `provider-observation` | [provider](provider.md#semantic-rules) | — |
| `FAC-SEM-015` | `provider-entry` | [provider](provider.md#semantic-rules) | — |
| `FAC-SEM-016` | `runner`, `runner-catalogue` | [runners](runners.md#semantic-rules) | — |
| `FAC-SEM-017` | `interop-tool` | [interop](interop.md#semantic-rules) | — |
| `FAC-SEM-018` | `interop-input-requests` | [interop](interop.md#semantic-rules) | — |
| `FAC-SEM-019` | `interop-job-trace`, `interop-result-trace` | [interop](interop.md#semantic-rules) | — |
| `FAC-SEM-020` | `service-manifest` | [service](service.md#semantic-rules) | — |
| `FAC-SEM-021` | `runner-catalogue` | [runners](runners.md#semantic-rules) | — |
| `FAC-SEM-022` | `interop-job-trace`, `interop-result-trace` | [interop](interop.md#semantic-rules) | — |
| `FAC-SEM-023` | `interop-tool-list`, `interop-tool` | [interop](interop.md#semantic-rules) | — |
| `FAC-SEM-024` | `service-descriptor` | [service](service.md#semantic-rules) | — |
| `FAC-SEM-025` | `service-usage` | [service](service.md#semantic-rules) | — |
| `FAC-SEM-026` | `comms-submit` | [project-comms](project-comms.md#semantic-rules) | — |
| `FAC-SEM-027` | `comms-transition` | [project-comms](project-comms.md#semantic-rules) | — |
| `FAC-SEM-028` | `runner-route` | [runners](runners.md#semantic-rules) | — |
| `FAC-SEM-029` | `runner-route` | [runners](runners.md#semantic-rules) | — |
| `FAC-SEM-030` | `route-bundle` | [runners](runners.md#semantic-rules) | — |
| `FAC-SEM-031` | `service-usage` | [service](service.md#semantic-rules) | — |
| `FAC-SEM-032` | `route-bundle` | [runners](runners.md#semantic-rules) | — |
| `FAC-SEM-033` | `route-bundle` | [runners](runners.md#semantic-rules) | — |
| `FAC-SEM-034` | `route-event` | [runners](runners.md#semantic-rules) | — |
| `FAC-SEM-035` | `settings-backup` | [service](service.md#semantic-rules) | SEM-0035 |
| `FAC-SEM-036` | `service-feed-request` | [service](service.md#semantic-rules) | SEM-0036 |
| `FAC-SEM-037` | `activity-batch`, `telemetry-event` | [activity](activity.md#semantic-rules) | SEM-0037 |
| `FAC-SEM-038` | `activity-batch`, `activity-summary`, `telemetry-event` | [activity](activity.md#semantic-rules) | SEM-0038 |
| `FAC-SEM-039` | `activity-ack`, `activity-batch`, `telemetry-event` | [activity](activity.md#semantic-rules) | SEM-0039 |
| `FAC-SEM-040` | `activity-summary` | [activity](activity.md#semantic-rules) | SEM-0040 |
| `FAC-SEM-041` | `device-policy-update` | [devices](devices.md#semantic-rules) | SEM-0041 |
| `FAC-SEM-042` | `device-policy-resolution` | [devices](devices.md#semantic-rules) | SEM-0042 |
| `FAC-SEM-043` | `device-health-observation` | [devices](devices.md#semantic-rules) | SEM-0043 |
| `FAC-SEM-044` | `device-enrollment` | [devices](devices.md#semantic-rules) | SEM-0044 |
| `FAC-SEM-045` | `device-attribution` | [devices](devices.md#semantic-rules) | SEM-0045 |
| `FAC-SEM-046` | `device-key-set` | [devices](devices.md#semantic-rules) | SEM-0046 |
| `FAC-SEM-047` | `spend-policy` | [spend policy](spend-policy.md#semantic-rules) | SEM-0047 |
| `FAC-SEM-048` | `grant-spend` | [spend policy](spend-policy.md#semantic-rules) | SEM-0048 |
| `FAC-SEM-049` | `delegation-claims` | [delegation](delegation.md#semantic-rules) | SEM-0049 |
| `FAC-SEM-050` | `delegation-mint` | [delegation](delegation.md#semantic-rules) | SEM-0050 |
| `FAC-SEM-051` | `approval-claims` | [delegation](delegation.md#semantic-rules) | SEM-0051 |
| `FAC-SEM-052` | `deep-link` | [fabric-button](fabric-button.md#semantic-rules) | SEM-0052 |
| `FAC-SEM-053` | `session-handoff`, `session-handoff-folder` | [session-handoff](session-handoff.md#semantic-rules) | SEM-0053 |
| `FAC-SEM-054` | `session-handoff-folder` | [session-handoff](session-handoff.md#semantic-rules) | SEM-0054 |
| `FAC-SEM-055` | `session-handoff-folder` | [session-handoff](session-handoff.md#semantic-rules) | SEM-0055 |
| `FAC-SEM-056` | `manifest`, `provider-entry` | [profiles](profiles.md#semantic-rules) | SEM-0056 |
| `FAC-SEM-057` | `manifest`, `provider-entry`, `runner`, `runner-catalogue`, `service-descriptor` | [profiles](profiles.md#semantic-rules) | SEM-0057 |
| `FAC-SEM-058` | `model-catalogue`, `model-profiles` | [runners](runners.md#semantic-rules) | SEM-0058 |
| `FAC-SEM-059` | `runner-profile` | [runners](runners.md#semantic-rules) | SEM-0059 |
| `FAC-SEM-060` | `profile-resolution` | [runners](runners.md#semantic-rules) | SEM-0060 |
| `FAC-SEM-064` | `package` | [package](package.md#semantic-rules) | SEM-0064 |
| `FAC-SEM-065` | `package` | [package](package.md#semantic-rules) | SEM-0065 |
| `FAC-SEM-066` | `package` | [package](package.md#semantic-rules) | SEM-0066 |
| `FAC-SEM-067` | `access-log-disclosure` | [activity](activity.md#semantic-rules) | SEM-0067 |
| `FAC-SEM-068` | `device-action` | [devices](devices.md#semantic-rules) | SEM-0068 |
| `FAC-SEM-069` | `device-root-certification` | [devices](devices.md#semantic-rules) | SEM-0069 |
| `FAC-SEM-072` | `estate-record`, `estate-record-revision` | [estate record](estate-record.md#semantic-rules) | SEM-0072 |
| `FAC-SEM-073` | `estate-record` | [estate record](estate-record.md#semantic-rules) | SEM-0073 |
| `FAC-SEM-074` | `estate-record`, `estate-placement` | [estate record](estate-record.md#semantic-rules) | SEM-0074 |
| `FAC-SEM-075` | `estate-record`, `estate-placement` | [estate record](estate-record.md#semantic-rules) | SEM-0075 |
| `FAC-SEM-076` | `estate-record` | [estate record](estate-record.md#semantic-rules) | SEM-0076 |
| `FAC-SEM-077` | `device-request-signature` | [devices](devices.md#semantic-rules) | SEM-0077 |

## Compatibility policy

Contract `0.x` minor versions may add optional fields, new schemas and new
profiles; consumers MUST ignore preserved extensions but need not accept unknown
normative profile versions. Removing or changing required semantics requires a
new major version. Provider revisions declare a supported contract-version range,
and a binding pins one exact negotiated version.
