# Brief — `entitlement/1` (CT-54, DEC-0085)

Owner: fabric-agent-contract. Requester: passioncode-platform PLAT-020 (RM-14/CE-14), board thread
`b68f4399-81c9-4cfe-a7a3-a62d9f30b92d` (message `7a2ddee7…`, 2026-10-17). Verifier: the first organization server
(its Stage 5) and a personal cloud. The offer it serves: passioncode-platform ADR-0005 (accepted 2026-10-16), D-2, D-4.
Ids reserved through agent-sync: `DEC-0085`, `FAC-SEM-115`, `FAC-SEM-116` (keys `ct54-entitlement*`).

## Source ledger

| Source | What it gives |
|---|---|
| PLAT-020 board message 2026-10-17 | the claims to discuss; signature, grace and refresh are the contract's to decide; the vector matrix |
| passioncode-platform `docs/evidence/recovery-20261013/packets/program.md` §1–2 | contract owner owns claims, canonical bytes, algorithm, key id/rotation, expiry/replay, error vocabulary, vectors; no cross-organization person id |
| passioncode-platform `docs/adr/0005-organization-offer.md` | entitlement derived from `licence`, `hosting`, `agent` lines; `agent` names `agentRef` of its `fabric-package/1`; `hosting` is `org-cloud` or `personal-cloud`; a personal-cloud order has no `licence` and no members; amounts never in code or specs |
| DEC-0082, `common.schema.json#/$defs/contextId` | the subject's form `personal` / `org:<orgId>` |
| DEC-0050, `fabric-package.schema.json#/$defs/agentRef` | the agent reference |
| DEC-0062 `window-lease/1`, DEC-0063 signing register | the document-with-signature pattern: RFC 8785 of the document without `sig`, a `key`-signed register type |
| DEC-0045, `src/ed25519.ts` | small-order Ed25519 keys refused before any verification |
| DEC-0031 devices.md *Key sets* | the root-signs-key-sets pattern with monotonic revisions |
| `src/rfc3339.ts` | strict instants; `CLOCK_SKEW_SECONDS = 60` |

## Decisions (made by the contract; recorded in DEC-0085 with these reasons)

1. **Shape: one JSON document with its signature inside,** `{type: "entitlement/1", ...fields, alg, kid, sig}`;
   the signed bytes are the register's `entitlement/1` statement — UTF-8 RFC 8785 of the document without `sig`
   (`signingStatement`), registered `signer: "key"`. Reason: every signed record of the contract uses one canonical
   form (DEC-0043, DEC-0062); the verifier needs no JOSE parser, and the type inside the bytes means no other
   statement of the same key is an entitlement. Not a JWT.
2. **Algorithm: `EdDSA` (Ed25519)** only, small-order keys refused (DEC-0045); `ES256` may join additively by a later
   decision, as for leases and hub keys. Reason: the verifiers already carry Ed25519 and its small-order check; one
   algorithm means no downgrade path.
3. **Fields** (every member always present; `null` where the order has no such line, as DEC-0084 does for `ceiling`,
   so the register type keeps one field list for good):
   - `issuer`: the issuer's `https://` origin, no path, port or trailing slash (the platform's).
   - `subject`: a context id (`contextId`): `org:<orgId>` or `personal`. Never a person's id.
   - `estate`: for `personal`, the person's estate id (`opaqueId`), which binds a personal entitlement to one
     person's network without a cross-organization person id; `null` for `org:<orgId>`.
   - `order`: `{id, revision}` — the signed order's opaque id and its revision (a positive safe integer).
   - `issuedAt`, `notBefore`, `expiresAt`: strict RFC 3339 instants, `issuedAt ≤ notBefore < expiresAt`.
   - `licence`: `{members}` (an integer 1…1 000 000, the member allowance) or `null`; `null` for `personal`.
   - `hosting`: `{product: "org-cloud" | "personal-cloud", size}` (`size` an opaque id) or `null`;
     `org-cloud` only for `org:`, `personal-cloud` only for `personal`.
   - `support`: `{tier: "observe" | "assist" | "managed"}` or `null`; `null` for `personal`. Reason: ADR-0005 D-1's
     tier decides what admin agents may do, and they must read it from a verified record, not editable config.
   - `agents`: an array (0…256) of `{agentRef}`, unique by `agentRef` — one entry per paid agent (ADR-0005 D-2).
   - No amount, price, currency or person anywhere: the schema refuses any member it does not list.
4. **Issuer keys: a pinned root and a signed key set.** The verifier is installed with the issuer's **root key**
   `{issuer, kid, x}` (Ed25519), which signs only `entitlement-key-set/1` documents:
   `{type, issuer, revision, issuedAt, keys: [{kid, alg, x, notBefore, notAfter}], revoked: [kid], alg, kid, sig}`.
   Signing keys sign entitlements. Reason: the root can live offline or in an HSM (PLAT-022) while online keys rotate
   and are revoked without reinstalling any verifier; this is the devices.md key-set pattern the organization server
   already implements for policies.
   - **Rotation**: a new key is added with a window that overlaps the old one; the old key stays listed after its
     `notAfter` until every entitlement it signed is past `expiresAt` + grace (at most 35 + 14 = 49 days), then may
     be dropped. An entitlement verifies only under a listed key whose window holds its `issuedAt`.
   - **Revocation**: a key's kid in `revoked` (and absent from `keys`) refuses every entitlement it signed
     (`key-revoked`), at once, whatever its window.
   - **Key set replay**: the verifier keeps the highest key-set revision it applied; a lower one is
     `stale-revision`, the same revision with other bytes `revision-conflict`, the same bytes are accepted unchanged.
   - Root replacement is a reinstall (out of band), as a device's root key is a re-enrollment.
5. **Windows** (numbers, not defaults left to the caller):
   - lifetime `expiresAt − issuedAt` at most **35 days** — one billing month (≤ 31 days) plus 4 days of overlap
     for the next revision to arrive before the month turns;
   - the issuer issues the next revision at least **7 days** before `expiresAt` (`REFRESH_SECONDS`); the verifier
     reports `refreshDue: true` from then on, so an administrator sees a stalled issuer a week ahead;
   - after `expiresAt` the entitlement is in **grace** for **14 days** (`GRACE_SECONDS`): it verifies with
     `state: "grace"`; after that it is refused `lapsed`. Reason: two weeks cover a platform outage or a late
     payment reconciliation without an organization losing its paid functions over our failure;
   - clock skew **60 s** (`CLOCK_SKEW_SECONDS`) on `notBefore` and on `issuedAt` in the future.
   - What a lapse switches off is the verifying product's (ADR-0005; the program packet keeps ingest and security
     through grace); the contract states only the states.
6. **Replay and order: one entitlement held per subject.** The verifier holds, per subject, the last accepted
   `{orderId, revision, issuedAt, digest}` (`digest` = `sha256:` of the signed bytes). A new one:
   same order, higher revision → accepted; same order and revision, same digest → accepted, `unchanged: true`;
   same order and revision, other digest → `revision-conflict`; same order, lower revision → `stale-revision`;
   another order → accepted only if its `issuedAt` is later than the held one's, else `stale-revision` (a renewal
   supersedes; an old order's entitlement cannot be replayed over a newer one).
7. **Verifier order** (`verifyEntitlement(doc, trust)`, never throws), refusal codes in this order:
   `context-invalid`, `no-clock`, `malformed`, `wrong-issuer`, `unknown-algorithm`, `unknown-key`, `key-revoked`,
   `unusable-key`, `small-order-key`, `key-not-valid`, `bad-signature`, `wrong-subject` (subject, or `estate` for
   `personal`), `too-long-lived`, `not-yet-valid`, `lapsed`, `stale-revision`, `revision-conflict`.
   Success: `{ok: true, state: "active" | "grace", refreshDue, unchanged, digest, held}` where `held` is the new held
   record to store. `trust = {now: Date, subject, estate?, keySet (verified), held?}`.
   `verifyEntitlementKeySet(set, {root, held?})` codes: `context-invalid`, `malformed`, `wrong-issuer`,
   `unknown-algorithm`, `unusable-key`, `small-order-key`, `bad-signature`, `stale-revision`, `revision-conflict`.
8. **Rules**: `FAC-SEM-115` (kind `entitlement`): subject/estate/licence/hosting/support consistency; time order;
   lifetime ≤ 35 days; agents unique by `agentRef`. `FAC-SEM-116` (kind `entitlement-key-set`): each kid once, the
   root's kid not among `keys`, every window `notBefore < notAfter`, no revoked kid among `keys`, no small-order key.
9. **Protocol revisions**: `entitlement` `["1"]`, `entitlement-key-set` `["1"]` in `src/protocol-revisions.ts`.

## REQ table (frozen)

| REQ | Requirement | Verified by |
|---|---|---|
| REQ-01 | `schemas/entitlement.schema.json` and `schemas/entitlement-key-set.schema.json`, closed (`additionalProperties: false`), reusing `contextId`, `opaqueId`, `agentRef` | positive/negative fixtures; positive-sweep; schema-closure |
| REQ-02 | `src/entitlement.ts`: `verifyEntitlementKeySet`, `verifyEntitlement`, signing inputs, constants; answers and never throws | `test/entitlement.test.ts`, rule-tolerance |
| REQ-03 | register types `entitlement/1`, `entitlement-key-set/1` (`signer: "key"`, DEC-0085) | `test/signing-challenges.test.ts` |
| REQ-04 | `FAC-SEM-115`, `FAC-SEM-116` wired into `src/semantic-rules.ts`, semantic fixtures ok/violating each clause | semantic fixture runner; rule-tolerance |
| REQ-05 | `fixtures/vectors/entitlement.json`, generated deterministically by `tools/vectors/entitlement.ts` (fixed seeds, `--write`), shared by both ends: valid; wrong subject (org A vs B; personal with another estate); wrong key; unknown kid; expired in grace; lapsed; not yet valid; too long; replayed lower revision; same revision other bytes; redelivery unchanged; older order replayed; newer order supersedes; rotated key (old key, issuedAt in window → ok; after its window → key-not-valid); revoked key; small-order key; key-set stale and conflicting revisions; one person in two organizations (two entitlements, each verifies only at its own org) | `test/entitlement.test.ts` runs every case; a test compares the file with the generator's output |
| REQ-06 | every reference function output validates against the schema, every schema-refused input is refused (standing instruction) | `test/entitlement.test.ts` |
| REQ-07 | `docs/specification/entitlement.md`; conformance.md register rows and rule table rows; DOCMAP; DEC-0085 in DECISIONS.md; CT-54 in backlog.md; handoff `docs/handoffs/2026-10-17-entitlement.md`; sources.md if a new external spec is cited | docs-check, lint-md, privacy-check |
| REQ-08 | plants: each refusal clause removed once fails a test; count recorded in the PR | plant log |
| REQ-09 | `pnpm run check` green (coverage floors met; add a floor for `src/entitlement.ts`) | gate output in the PR |

## Not decided here

Member-period metering and the billable-member definition (the first organization server's Stage 5); per-agent usage stays `grant.usage`
(DEC-0082), joined by the organization server through the share grant; how the platform stores orders; the HSM
ceremony; which functions a lapse disables.
