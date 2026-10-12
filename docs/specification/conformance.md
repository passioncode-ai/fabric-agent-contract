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
| a copy of a service, reading how it was started (the kits' `supervised()`) | reads the supervisor marker from `FABRIC_SERVICE_SUPERVISOR` or `--fabric-supervisor`; while another copy holds `service.lock` it touches nothing, waits only when marked, at most 300 s, and exits 75 naming the holder's pid (or saying the holder is unknown); its argument parser accepts the marker; on markers that disagree it exits 75 at once, naming them | `FAC-SEM-078` | `test/service-supervisor.test.ts`, `src/service-supervisor.ts` `supervisorMarker`, vectors `fixtures/vectors/service-supervisor.json`, fixtures `fixtures/semantic/service-lock-*` ([service](service.md#one-copy), DEC-0057) |
| a Windows reader of a service's token file (a host, Fabric, Fabric Dashboards) | refuses a reparse point, a file that is not regular or lies outside the profile, an owner other than the user, SYSTEM or Administrators, and an allow ACE granting any right to another SID; ignores deny ACEs; refuses what it cannot read; names the SID, never the contents | `FAC-SEM-079` | `test/windows-token.test.ts`, `src/windows-token.ts` `windowsTokenAclProblem`, vectors `fixtures/vectors/windows-token.json` ([service](service.md#windows-token-files), DEC-0032, DEC-0033, DEC-0057) |
| a host routing a request from anyone but the operator to a service (Fabric, Fabric Dashboards, a node) | sends it only to a service whose descriptor declares `peer`, and only when the request's data class — one of `public`, `internal`, `confidential`, `restricted`, exactly as written — ranks at or below `peer.maxDataClass`; an unknown class or maximum is refused before any comparison; never hands others the descriptor's token | `FAC-SEM-088` | `test/descriptor-rules.test.ts`, `src/descriptor-rules.ts` `peerRefusal`, vectors `fixtures/vectors/service-peer.json`, fixtures `fixtures/semantic/service-peer-request-*` ([service](service.md#offered-to-others), DEC-0061) |
| a node placing a service (Project Observatory's node) | checks the descriptor's `runner` against its runner catalogue: a named kind is an entry, a subscription names its vendor's runner, the declared credential kind equals the one it derived from where the credential came from; refuses a service offered to others on a subscription, declared, derived or in its usage report | `FAC-SEM-087` | `test/descriptor-rules.test.ts`, fixtures `fixtures/semantic/service-runner-*` ([service](service.md#offered-to-others), DEC-0061) |
| a receiver of activity batches | attributes a batch to its client certificate's device and user (or the certificate a verified request signature names, DEC-0056), refuses an event that carries a content or person key instead of stripping it, and acknowledges the highest consumed seq of each stream | `FAC-SEM-037`, `FAC-SEM-039`, `FAC-SEM-045` | `test/activity-rules.test.ts`, fixtures `fixtures/semantic/activity-*`, `device-attribution-*` ([activity](activity.md#batch-and-acknowledgement), DEC-0030) |
| a callee of a delegation token or an approval | names the issuer it trusts and refuses `iss` from any other; checks the signature against the estate's published keys, the claims' DL-2 types, the times with a 60 s leeway, its own agent id in `aud`, the chain's depth, the called capability and its effect, and an approval's action digest and single use, in DL-13's order, answering one of the contract's refusal codes; refuses a clock that is not a number of seconds first (`unknown-state`, `no-clock`); requires no token, approval or grant record of a T0 or T1 caller | DL-13, DL-18, DL-26 | `test/delegation.test.ts`, `test/delegation-sealed.test.ts`, `src/delegation.ts` `verifyDelegation`, `verifyApproval` ([delegation](delegation.md#the-verifier), DEC-0039, DEC-0045, DEC-0060) |
| a callee of a delegation token or an approval that reads the estate record (Fabric's verifier, Project Observatory's node, the adapter's kits) | after the signature, trusts the token's `kid` only while the revision it reads — one `verifyEstateRecord` accepted, not lower than the highest its machine applied (a higher one only if it verified its chain itself) — certifies that `kid` with the published key for exactly one machine, inside the revision's window, revoking (with the revocation delta's applied entries, DEC-0054) neither the hub key nor the machine; refuses otherwise `unauthenticated` (`approval-invalid` for an approval) with `kid-not-certified`, and a revision it cannot read, outside its window, lower than the applied one or forked from it `issuer-unavailable` with `estate-unreadable`, `estate-outside-window`, `estate-rolled-back` or `estate-forked` (the meter: `principal-unproven` with the detail in its reason) | `FAC-SEM-081` | `test/hub-key.test.ts`, `src/hub-key-rules.ts` `hubKeyCertified`, vectors `fixtures/vectors/hub-key.json`, fixtures `fixtures/semantic/delegation-hub-key-*` ([delegation](delegation.md#keys-publication-and-rotation), DEC-0055, DEC-0060) |
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
| a machine applying an estate record | applies a revision only when it is valid against `schemas/estate-record.schema.json` and verifies offline (`verifyEstateRecord`): its own digest, the parent's next number and digest (revision 1 under the passkey it pinned at enrollment), a passkey its parent lists and does not revoke, the WebAuthn Level 3 §7.2 checks — type, challenge over the digest, a pinned origin, top-level, `rpIdHash`, UP and UV — the signature, a validity window of at most 30 days around a readable clock (`issuedAt` up to 60 s ahead of it, DEC-0066), and the record's own rules; refuses a revision issued at or after an applied revocation-delta entry that does not list its revocation (`reconcileRevision`, `FAC-SEM-084`, DEC-0054); installs only a package the record places on it, under the publisher key the record pins (`placementTrust`), and fills only placed slots | `FAC-SEM-072`…`FAC-SEM-076` | `test/estate-record.test.ts`, fixtures `fixtures/semantic/estate-*`, vectors `fixtures/vectors/estate-record.json` ([estate record](estate-record.md#what-is-verified-offline), DEC-0055) |
| a machine applying the revocation delta and heartbeats | applies a page's entries in order only under an estate key the highest revision it applied certifies and nothing revokes, `EdDSA`, an admitted kind, at most 60 s ahead, a signature that verifies, then the next sequence and `prev` its head; skips an entry it holds; asks with `delta-query` on a gap; marks itself broken on a second signed history and keeps its revocation; accepts a newer heartbeat that moves nothing back and contradicts nothing it holds; refuses what arrives from other machines unless its heartbeat is at most 72 hours old and the delta and the revision are applied up to it; reports the head and the heartbeat in its check-in | `FAC-SEM-082`…`FAC-SEM-084` | `test/revocation-delta.test.ts`, fixtures `fixtures/semantic/{revocation-delta,heartbeat,delta}-*`, vectors `fixtures/vectors/revocation-delta.json`, `src/revocation-delta.ts` `applyDelta`, `acceptHeartbeat`, `deltaFreshness` ([revocation delta](revocation-delta.md#what-a-machine-does), DEC-0054) |
| a meter spending under a window lease (Project Observatory's meter) | verifies each lease before spending against it (`verifyWindowLease`): a readable clock first, the shape, a life of at most 24 hours inside its window instance, `EdDSA`, the estate it applies at a revision it has applied, a hub `kid` exactly one machine of that record certifies and neither revokes, a key of full order, the signature over the lease without `sig`, its own machine, `issuedAt` ≤ t < `expiresAt` in the current period, not superseded by the lease it holds for the slot, an amount within what the record allows; reserves only as `mayReserve` answers — the smaller of its own remainder and the lease's, nothing at or after expiry; reports `records.leases[]` with `spent` | WL-1…WL-12, `FAC-SEM-091` | `test/window-lease.test.ts`, `src/window-lease.ts` `verifyWindowLease`, `mayReserve`, vectors `fixtures/vectors/window-lease.json`, fixtures `fixtures/semantic/lease-reservation-*` ([window lease](window-lease.md#the-verifier), DEC-0062) |
| the estate's hub, dividing a window among machines (Fabric) | signs one lease per machine, scope, window and period with a hub key the current estate record certifies, sequences rising per slot, each amount at most `windowRemainder`'s answer — the limit less what every other machine holds, an expired lease counted at its amount until a report received after its expiry lowers it to `spent` | `FAC-SEM-089`, `FAC-SEM-090` | `test/window-lease.test.ts`, `src/window-lease.ts` `windowRemainder`, fixtures `fixtures/semantic/window-lease-*` ([window lease](window-lease.md#reporting), DEC-0062) |
| a verifier of a passkey signature over a registered statement (a machine applying an estate record; later a host reading a countersignature) | rebuilds the challenge from the register's type and the fields it checks (`signingChallenge`), never from bytes it was handed; refuses a credential whose RP ID is not `sign.<domain>` as `wrong-rp` before reading the assertion, and a ceremony in an origin outside that RP ID as `wrong-origin` | `FAC-SEM-092` | `test/signing-challenges.test.ts`, `src/signing-challenges.ts` `verifySigningAssertion`, vectors `fixtures/vectors/signing-challenges.json` and `fixtures/vectors/estate-record.json` ([signing](signing.md#what-a-verifier-checks), DEC-0063) |
| a signer running a passkey ceremony (Fabric) | uses the dedicated signing credential under `sign.<domain>`, never the sign-in credential, top-level in the signer's own Fabric or a static, integrity-pinned page on that RP ID, and computes the challenge from the statement it shows, rebuilt from bytes fetched by digest | `FAC-SEM-092` (the credential) | `test/signing-challenges.test.ts` (the register's statements and the assertion vectors) ([signing](signing.md#the-ceremony), DEC-0063) |
| a receiver of device requests that requires the signature, or that sees a client certificate — batches, check-ins, rotation requests | verifies every `fabric-device` HTTP message signature that is present (RFC 9421 subset): `Content-Digest` exactly `sha-256` of the body, `created` within 300 s of a readable clock, `keyid` the client certificate's serial when there is one, a certificate by `keyid` that is not revoked and valid now, `alg` the signing key's, a usable key, the base over a target URI built from its public base URL, a signature that verifies; then records (serial, `nonce`) until `created + 300` s and answers a repeat `signature-replayed`; accepts an unsigned request only on a valid client certificate; each refusal a 401 with its code. Its data model records, with each certificate, whether the signing key is the enrollment's `#sig` key or the certified key | `FAC-SEM-077` | `test/http-signature.test.ts`, fixtures `fixtures/semantic/device-request-signature-*`, vectors `fixtures/vectors/http-signature.json`, `src/http-signature.ts` `verifyDeviceRequest` ([devices](devices.md#transport), DEC-0056) |
| a device sending requests | signs every batch, check-in and rotation request with its `#sig` key under the `fabric-device` label, a fresh nonce each time, `keyid` its certificate's serial, the target URI from the base URL it enrolled with | `FAC-SEM-077` (the receiver's side) | `test/http-signature.test.ts` (the reference signer `signDeviceRequest`, verified by the receiver) ([devices](devices.md#transport), DEC-0056) |
| a device deciding under its policy | keeps every lock after its policy expires, stops grants, remote execution and a person's key for others then, lets a person's key serve others only where sharing is `allowed`, uploads nothing that occurred before its collection start, and accepts a root key only certified by the offline root its installer pinned | `FAC-SEM-068`, `FAC-SEM-069` | `test/device-rules.test.ts`, fixtures `fixtures/semantic/device-action-*` and `fixtures/semantic/device-root-certification-*` ([devices](devices.md#policy), [root certification](devices.md#root-certification), DEC-0053) |
| any reader whose rule compares identifiers for sameness (an approver and an author, a row and the rows before it, a binding and its route) | compares the normal forms of the two identifiers — RFC 3986 §6.2.2 for a URI, RFC 8141 §3.1 for a URN, any other string as it is — never their bytes; a writer SHOULD emit the normal form | `FAC-SEM-002`, `FAC-SEM-006`, `FAC-SEM-025`, `FAC-SEM-030`, `FAC-SEM-032`, `FAC-SEM-034`, `FAC-SEM-094`, `FAC-SEM-096` | `test/identifiers.test.ts`, `src/identifiers.ts` `normalIdentifier`, `sameIdentifier`, vectors `fixtures/vectors/identifiers.json` ([identifiers](identifiers.md), DEC-0076) |

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
| a passkey's challenge over a registered statement, SHA-256 over `{type, ...fields}` (`org-countersign/1`, `share-grant/1`, `limits/1`, and `estate-revision/1` above) | RFC 8785 | `signingChallenge` (`signingStatement` for the bytes) in [`src/signing-challenges.ts`](../../src/signing-challenges.ts) | [signing challenges](#signing-challenges), DEC-0063 |
| a window lease's signature, over the lease without `sig` (`window-lease/1`) | RFC 8785 | `windowLeaseSigningInput` in [`src/window-lease.ts`](../../src/window-lease.ts) | [window lease](window-lease.md#who-signs), DEC-0062 |
| a revisioned object's `contentHash`, over the object without `contentHash` | RFC 8785 | `rfc8785`; no contract code computes it | [overview](overview.md#common-identity-and-references) |
| a relay machine's proof of its device key, `relay-auth/1` `{type, alg, relay, nonce, estate, kid, iat}` | RFC 8785 | `relayAuthSigningInput` in [`src/relay.ts`](../../src/relay.ts) | [relay](relay.md#admission), DEC-0047 |
| a relay blob request, `relay-blob/1` `{type, alg, relay, method, digest, recipients, iat}` | RFC 8785 | `relayBlobSigningInput` | [relay](relay.md#blobs), DEC-0047 |
| a blob request's `Fabric-Relay-Request` header: `{alg, kid, recipients, iat, sig}`, then base64url without padding | RFC 8785 | `relayRequestHeader`, `parseRelayRequest` in [`src/relay.ts`](../../src/relay.ts) | [relay](relay.md#blobs), DEC-0047 (annotated 2026-10-12) |
| a relay message body's JWS payload, `{type, from, to, msgId, iat, exp, payload}` (`exp` signed) | RFC 8785 | the sender; checked by `verifyMessageBody` | [relay](relay.md#messages), DEC-0047 |
| a secret envelope's header, as the HPKE additional data; its signature over `{header, ct}`; its digest over the whole envelope | RFC 8785 | `sealEnvelope`, `openEnvelope`, `envelopeDigest` in [`src/secret-envelope.ts`](../../src/secret-envelope.ts) | [relay](relay.md#the-secret-envelope), DEC-0047 |
| a revocation-delta entry's signature and its hash (the next head), over the entry without `sig`; the genesis, over `{type: "revocation-delta/1", estate, sequence: 0}` | RFC 8785 | `signingInput`, `deltaEntryHash`, `deltaGenesis` in [`src/revocation-delta.ts`](../../src/revocation-delta.ts) | [revocation delta](revocation-delta.md#the-delta), DEC-0054 |
| a heartbeat's signature, over the heartbeat without `sig` | RFC 8785 | `signingInput` | [revocation delta](revocation-delta.md#the-heartbeat), DEC-0054 |

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

## Signing challenges

Every statement a passkey or a key signs is the UTF-8 RFC 8785 form of `{type, ...fields}`: `type` one of the names
below and the other members exactly that type's fields (`signingStatement`, DEC-0063). A passkey signs the SHA-256 of
those bytes as its WebAuthn challenge (`signingChallenge`), under the dedicated signing RP ([signing](signing.md)); a key
signs the bytes themselves. The type inside keeps one signature from standing for another over the same digest. A type
names one field list for good: a changed list is a new type (`/2`), registered here first, never a new reading of an
old one. The register is `SIGNING_STATEMENTS` in [`src/signing-challenges.ts`](../../src/signing-challenges.ts), and
`test/signing-challenges.test.ts` holds this table to it.

| Type | Fields beside `type` | Signed by | What is signed | Computed by | Decision |
|---|---|---|---|---|---|
| `estate-revision/1` | `digest` (the revision's, `sha256:`) | a passkey of the estate: its authority | the challenge | `estateChallenge`, `signingChallenge` | DEC-0055, [estate record](estate-record.md#the-signature) |
| `org-countersign/1` | `organization`, `digest` (the package's), `audience`, `grant` (`<id>#<revision>`), `revision` (the organization record's) | a passkey: an administrator's signing credential | the challenge | `signingChallenge` | DEC-0063, [signing](signing.md#the-types) |
| `share-grant/1` | `estate`, `grant` (`<id>#<revision>`), `jkt` (RFC 7638 thumbprint, RFC 9449 §6.1), `expiresAt` | a passkey of the estate: the owner's | the challenge | `signingChallenge` | DEC-0063, [signing](signing.md#the-types) |
| `limits/1` | `scope` (`estate:<id>` or `organization:<id>`), `digest` (the limits document's) | a passkey: the estate's, or a finance approver's | the challenge | `signingChallenge` | DEC-0063, [signing](signing.md#the-types) |
| `fabric-package-signature/1` | `role` (publisher or organization), `digest` (the package's) | a key: the publisher's or an organization's | the bytes | `packageSigningInput` | DEC-0051, [package](package.md#what-is-signed) |
| `window-lease/1` | every member of the lease but `type` and `sig` | a key: a hub key the estate record certifies | the bytes | `windowLeaseSigningInput` | DEC-0062, [window lease](window-lease.md#who-signs) |
| `relay-auth/1` | `alg`, `relay`, `nonce`, `estate`, `kid`, `iat` | a key: the machine's `#sig` device key | the bytes | `relayAuthSigningInput` | DEC-0047, [relay](relay.md#admission) |
| `relay-blob/1` | `alg`, `relay`, `method`, `digest`, `recipients`, `iat` | a key: a sender's `#sig` device key | the bytes | `relayBlobSigningInput` | DEC-0047, [relay](relay.md#blobs) |

The register checks the values of the passkey types and the package statement (`signingStatement` has no bytes for a
digest in upper-case hex, a revision of 0, a padded `jkt` or an expiry without an offset); the lease's and the relay's
values are checked by their own verifiers. The vectors, [`fixtures/vectors/signing-challenges.json`](../../fixtures/vectors/signing-challenges.json),
hold each type's statement and challenge, the inputs that have none, the signing RP's cases and assertions a port runs.

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
register and carry no receipt. `FAC-SEM-095` was reserved (receipt SEM-0095, DEC-0064) and is not used: the rule it was
for became a fix of `FAC-SEM-006`.

**Next free rule code:** `FAC-SEM-107`

| Code | Kind | Defined in | Receipt |
|---|---|---|---|
| `FAC-SEM-000` | any | here: the value checked is a JSON object | — |
| `FAC-SEM-001` | `result` | here: a `succeeded` result lists no claim in `notVerified` (every reported claim is an acceptance claim, DEC-0064) | — |
| `FAC-SEM-002` | `execution-bundle` | here: the selected account is in the pinned project pool, account references compared by normal form ([identifiers](identifiers.md), DEC-0076) | — |
| `FAC-SEM-003` | `learning` | here: a learning proposal cannot apply itself (the schema's `selfApply: false` is the guarantee; the rule answers a schema-invalid input; approval separation is `FAC-SEM-094`, DEC-0064) | — |
| `FAC-SEM-004` | `promotion` | here: personal, credential or regulated content never promotes globally | — |
| `FAC-SEM-005` | `roles` | here: the estate has exactly one active CEO | — |
| `FAC-SEM-006` | `roles` | here: each project any active assignment scopes has exactly one active product manager; two spellings of one project id are one project ([identifiers](identifiers.md), DEC-0064, DEC-0076) | — |
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
| `FAC-SEM-070` | `secret-envelope` | [relay](relay.md#semantic-rules) | SEM-0070 |
| `FAC-SEM-071` | `relay-frame` | [relay](relay.md#semantic-rules) | SEM-0071 |
| `FAC-SEM-072` | `estate-record`, `estate-record-revision` | [estate record](estate-record.md#semantic-rules) | SEM-0072 |
| `FAC-SEM-073` | `estate-record` | [estate record](estate-record.md#semantic-rules) | SEM-0073 |
| `FAC-SEM-074` | `estate-record`, `estate-placement` | [estate record](estate-record.md#semantic-rules) | SEM-0074 |
| `FAC-SEM-075` | `estate-record`, `estate-placement` | [estate record](estate-record.md#semantic-rules) | SEM-0075 |
| `FAC-SEM-076` | `estate-record` | [estate record](estate-record.md#semantic-rules) | SEM-0076 |
| `FAC-SEM-077` | `device-request-signature` | [devices](devices.md#semantic-rules) | SEM-0077 |
| `FAC-SEM-078` | `service-lock-outcome` | [service](service.md#semantic-rules) | SEM-0078 |
| `FAC-SEM-079` | `windows-token-file` | [service](service.md#semantic-rules) | SEM-0079 |
| `FAC-SEM-080` | `service-well-known` | [embedded dashboard](embedded-dashboard.md#semantic-rules) | SEM-0080 |
| `FAC-SEM-081` | `delegation-hub-key` | [delegation](delegation.md#semantic-rules) | SEM-0081 |
| `FAC-SEM-082` | `revocation-delta` | [revocation delta](revocation-delta.md#semantic-rules) | SEM-0082 |
| `FAC-SEM-083` | `heartbeat`, `delta-freshness` | [revocation delta](revocation-delta.md#semantic-rules) | SEM-0083 |
| `FAC-SEM-084` | `delta-reconciliation` | [revocation delta](revocation-delta.md#semantic-rules) | SEM-0084 |
| `FAC-SEM-085` | `service-descriptor` | [service](service.md#semantic-rules) | SEM-0085 |
| `FAC-SEM-086` | `service-descriptor` | [service](service.md#semantic-rules) | SEM-0086 |
| `FAC-SEM-087` | `service-runner` | [service](service.md#semantic-rules) | SEM-0087 |
| `FAC-SEM-088` | `service-peer-request` | [service](service.md#semantic-rules) | SEM-0088 |
| `FAC-SEM-089` | `window-lease` | [window lease](window-lease.md#semantic-rules) | SEM-0089 |
| `FAC-SEM-090` | `window-lease-division` | [window lease](window-lease.md#semantic-rules) | SEM-0090 |
| `FAC-SEM-091` | `lease-reservation` | [window lease](window-lease.md#semantic-rules) | SEM-0091 |
| `FAC-SEM-092` | `estate-record`, `signing-credential` | [signing](signing.md#semantic-rules) | SEM-0092 |
| `FAC-SEM-093` | `result` | [results and evidence](results-and-evidence.md#semantic-rules) | SEM-0093 |
| `FAC-SEM-094` | `learning`, `promotion` | [governance and roles](governance-and-roles.md#semantic-rules) | SEM-0094 |
| `FAC-SEM-096` | `versioned-setting` | [versioning](versioning.md#semantic-rules) | SEM-0096 |
| `FAC-SEM-097` | `grant-window` | [governance and roles](governance-and-roles.md#semantic-rules) | SEM-0097 |
| `FAC-SEM-098` | `openrouter-attribution` | [OpenRouter attribution](openrouter-attribution.md#semantic-rules) | SEM-0098 |
| `FAC-SEM-099` | `protocols`, `service-well-known`, `device-check-in`, `device-enrollment` | [versioning](versioning.md#semantic-rules) | SEM-0099 |
| `FAC-SEM-100` | `session-join` | [activity](activity.md#semantic-rules) | SEM-0100 |
| `FAC-SEM-101` | `service-events-page` | [service](service.md#semantic-rules) | SEM-0101 |
| `FAC-SEM-102` | `package` | [package](package.md#semantic-rules) | SEM-0102 |
| `FAC-SEM-103` | `proposal-submit` | [proposals](proposals.md#semantic-rules) | SEM-0103 |
| `FAC-SEM-104` | `proposal`, `proposal-transition` | [proposals](proposals.md#semantic-rules) | SEM-0104 |
| `FAC-SEM-105` | `learning-rollout` | [proposals](proposals.md#semantic-rules) | SEM-0105 |
| `FAC-SEM-106` | `local-channel-session` | [local channel](local-channel.md#semantic-rules) | SEM-0106 |

## Compatibility policy

Contract `0.x` minor versions may add optional fields, new schemas and new
profiles; consumers MUST ignore preserved extensions but need not accept unknown
normative profile versions. Removing or changing required semantics requires a
new major version. Provider revisions declare a supported contract-version range,
and a binding pins one exact negotiated version.
