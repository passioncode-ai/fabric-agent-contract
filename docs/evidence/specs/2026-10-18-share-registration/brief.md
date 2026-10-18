# Brief: share registrations and the grant's own context on `grant.usage` (CT-56, DEC-0086)

Owner: fabric-agent-contract. Requester: the first organization server, board row VES-GRANT-CONTEXT (thread
`cc944654`, 2026-10-17); the contract answered DEC-0086, row CT-56, direction "(a) plus the context from (b)".
Ids reserved through agent-sync: `DEC-0086` (key `ves-grant-context-20261017`), `FAC-SEM-117` (key
`ct56-share-grant-id`), `FAC-SEM-118` (key `ct56-share-registration`). The next free DEC after this is DEC-0087.

## The request

- (a) The organization server keeps each share grant issued into its organization: `meta.id`, the context
  `org:<orgId>` and the `agentRef` of the `fabric-package/1` it shares, so it can join `grant.usage` (grantId, share
  grant, agentRef) and bill per agent. The contract states where it receives them; a server never reads a person's
  estate record.
- (b) `grant.usage` carries `context`, the grant's own `org:<orgId>`; a receiver refuses one that is not its own.
- (c) The `grantId` of a share grant into an organization holds no person's name, address or estate id, as a
  workflow id cannot (`memory-capability.schema.json` pins `workflowId` to `^wf_[0-9a-f]{16}$`).

## Source ledger

| Source | What it gives |
|---|---|
| DEC-0082, contexts.md | the context id; a grant's `context`; one placement per context with its `grant` (`FAC-SEM-111`); routing; `grant.usage`, `routeGrantUsage`; "no document on the telemetry or check-in wire carries a context" (amended here) |
| `governance.schema.json#/$defs/grant` | no `agentRef`; `meta.id` any URI; `issuer`, `meta.createdBy`, `project`, `principal` are URIs a person may choose |
| estate-record schema and spec, *Machines* | `machines[].packages[]` holds `agentRef`, `context` and `grant`: the only signed place where a grant meets an `agentRef` |
| DEC-0031, DEC-0056, devices.md | one enrollment per organization; a certificate binding `org.id`, `device.id`, `user.id`; the RFC 9421 `fabric-device` signature; attribution from the certificate, never the body (`FAC-SEM-045`) |
| DEC-0030, activity.md | the ack's closed rejection reasons, `attribution` among them; a rejected event is consumed |
| DEC-0052, `FAC-SEM-067` | OD-1: another person sees a person's usage only as sums per UTC day or billing period, each read logged |
| DEC-0063 | `share-grant/1` holds `estate`, which (c) keeps from the organization |
| DEC-0067 | `<name>/<revision>`, `protocols`, `schema-unsupported` after authentication |
| DEC-0072 | `fabric-proposal/1` and its approval lifecycle |
| DEC-0076 | normal form; a pattern admitting only its own normal form is compared as written |
| DEC-0085 | the document-with-type pattern, a held record with digest, `stale-revision` and `revision-conflict` |

## Decisions

1. **Carrier: `share-registration/1`, sent by the sharer's enrolled node over the device transport.** A device
   request to the organization server of one of the node's own enrollments, under mutual TLS and the DEC-0056
   `fabric-device` signature by the enrollment's `#sig` key (`keyid` the certificate serial). The receiver answers
   `share-registration-receipt/1` or a typed refusal. The node builds it from the estate revision and delta entries
   it applied, never from a draft; Fabric's share flow (CX-FAB-04) causes it by drafting the revision the passkey
   signs. This refines the contract's first answer ("Fabric hands the grant"): only the node holds the enrolled
   device's certificate and key, it registers only what a passkey signed, and withdrawal follows the record and the
   delta with no second path. A protocol revision of its own (DEC-0067), listed in the enrollment response's
   `protocols`.
2. **Schema** `schemas/share-registration.schema.json`, closed, `oneOf` of:
   - `registration` `{type: "share-registration/1", grantId, context, state: active|withdrawn, grantRevision,
     agentRef, startsAt, expiresAt, withdrawnAt}`: active requires `grantRevision`, `agentRef`, `startsAt`,
     `expiresAt` and forbids `withdrawnAt`; withdrawn requires `withdrawnAt` and forbids the other four;
   - `receipt` `{type: "share-registration-receipt/1", grantId, state: registered|unchanged|withdrawn, digest}`;
   - `refusal` `{error: {code, message ≤ 200}}`, codes `malformed`, `wrong-organization`, `unassigned-device`,
     `already-withdrawn`, `agent-mismatch`, `stale-revision`, `revision-conflict`.
   New `common.schema.json` defs: `orgContextId` `^org:[A-Za-z0-9][A-Za-z0-9_-]{0,127}$` (contextId without
   `personal`); `shareGrantId` `format: uri`, `^urn:fabric:share:(?!0{32}$)[0-9a-f]{32}$`. Not in a registration:
   estate id or revision, machine ids, principal, issuer, createdBy, project, audience, capabilities, effect ceiling,
   data classes, spend, content hash, any free text. `shareRegistrationDigest` = `sha256:` of UTF-8 RFC 8785 of the
   registration.
3. **Derivation** `deriveShareRegistrations(record, appliedEntries, orgId, previouslyRegistered)` in
   `src/share-registration.ts`, total. For each share grant of the applied revision whose `context` is
   `org:<orgId>` as written: a `meta.id` that is no `shareGrantId` registers nothing (degraded `share-grant-id`);
   revoked by the record or an applied delta entry (`grant` revocation, normal form) gives a withdrawal at the
   earliest `revokedAt`; otherwise the placements of the revision in that context naming the grant by normal form:
   none, nothing yet; two `agentRef`s, nothing (degraded `share-grant-agents`); one, an active registration. A grant
   registered earlier that the revision no longer lists and does not revoke is withdrawn at the revision's
   `issuedAt`. A node sends on change (after a revision, a delta entry, an enrollment) and SHOULD re-send each active
   registration at least every 7 days. Personal, context-less and other organizations' grants never register.
4. **Authenticity.** Signer: the enrolled device's `#sig` key. The receiver takes the organization from the
   certificate's `org.id` and the registrant from the `user.id` bound to its epoch, never from the body, and keys
   registrations by (registrant `user.id`, `grantId`), so one member cannot overwrite, squat or attach usage to
   another member's grant. It keeps the body bytes and `Signature-Input`/`Signature` as evidence.
   Receiver order `decideShareRegistration(held, registration, binding)`, total: SR-0 own context unusable
   (`context-invalid`, its own fault); SR-1 DEC-0056 steps 0 to 8 (their 401 codes); SR-2 unknown revision, 400
   `schema-unsupported`; SR-3 schema or `FAC-SEM-118` document clauses (strict instants, `startsAt` < `expiresAt`),
   400 `malformed`; SR-4 `context` not `org:` plus the certificate's `org.id` as written, 403 `wrong-organization`;
   SR-5 no bound `user.id`, 403 `unassigned-device`; SR-6 active while held withdrawn, 409 `already-withdrawn`; SR-7
   other `agentRef` than held, 409 `agent-mismatch`; SR-8 lower `grantRevision`, 409 `stale-revision`; SR-9 same
   revision other digest, 409 `revision-conflict`; SR-10 same digest or a second withdrawal, 200 `unchanged`; SR-11
   otherwise 200 `registered` or `withdrawn`.
5. **State.** Held per (user, grantId): `{state, grantRevision?, agentRef?, startsAt?, expiresAt?, withdrawnAt?,
   digest}`. Withdrawal is final; a withdrawal with nothing held is a tombstone; of two withdrawals the earliest
   `withdrawnAt` is kept. A registration ends at the earlier of `expiresAt` and `withdrawnAt`; only a higher
   `grantRevision` extends `expiresAt`. Kept at least as long as the receiver's raw retention.
6. **`grant.usage`.** `context` becomes required (`orgContextId`), the value the collector passed to
   `routeGrantUsage`; `grantId` tightens to `shareGrantId`. `FAC-SEM-045` is amended: a `grant.usage` whose
   `data.context` is not `org:` plus the certificate's `org.id` is rejected with the existing reason `attribution`
   (no new ack value). `FAC-SEM-039`'s key is unchanged. Join `joinGrantUsage(event, binding, registrations)`,
   total: GJ-1 other context, rejected `attribution`; GJ-2 no bound user, stored not joined `unassigned-device`; GJ-3
   no registration for (bound user, grantId), stored not joined `unregistered` (recomputed when one arrives); GJ-4
   day before the UTC day of `startsAt`, `before-start`; GJ-5 after the UTC day of the end, `after-end`; GJ-6 joined
   to the registration's `agentRef`. Sender gate: a collector emits `grant.usage` for grant G toward enrollment E
   only after E answered G's registration with a receipt, `stale-revision` or `already-withdrawn`; until then it
   keeps the sums; on `revision-conflict` or `agent-mismatch` it holds back and reports degraded.
   `routeGrantUsage` is unchanged.
7. **Share grant ids (`FAC-SEM-117`).** A grant whose `context` is `org:<orgId>` has `meta.id`
   `urn:fabric:share:<32 lower-case hex>`, from 128 bits of a CSPRNG, never derived from a name, address, estate
   id, agentRef or organization. Checked by schema at the boundary (registration, `grant.usage`) and by
   `FAC-SEM-117` (kinds `grant`, and `org-share-grants` `{record}`: each org share grant's id form, and every
   placement naming it names one `agentRef`), which Fabric and the adapter's kits run before signing. Not in
   `governance.schema.json` nor `verifyEstateRecord`: a naming fault must not lock an estate out; it fails closed
   for billing only. identifiers.md lists it under *Compared as written*.
8. **Rules.** `FAC-SEM-117` as above; `FAC-SEM-118` (kinds `share-registration`, `share-registration-derive`,
   `share-registration-intake`, `grant-usage-join`): document clauses, derivation, SR and GJ rows; `FAC-SEM-045`
   amended for `grant.usage` context.
9. **Revisions and amended text.** `PROTOCOL_REVISIONS` gains `share-registration` and `share-registration-receipt`
   `["1"]`. devices.md transport: "every batch, check-in, rotation and share-registration request". contexts.md and
   DEC-0082 item 5: no event carries its session's context and no check-in carries a context; a `grant.usage` and a
   share registration carry their grant's own `org:<orgId>`. CONTEXT.md likewise; DEC-0082 annotated.

## Alternatives refused

- `proposal.submit`: an approval lifecycle for rules and listings, Fabric's Board transport, no device attribution,
  no withdrawal tied to revocation.
- `agentRef` on `grant.usage`: unverifiable per event, no record before first use, no withdrawal or expiry.
- `agentRef` on the grant: a closed schema every meter would repin; a placement already binds it.
- A passkey statement or `share-grant/1`: carries `estate`, checkable only with the estate's credentials.
- The server reads the estate record, or Fabric calls it under an SSO session: excluded by the request; no device proof.

## Privacy

The server sees a random grant id, the grant revision, its own context, the `agentRef`, the window and a withdrawal
time, plus its member's `user.id`, device id and certificate serial: the fact the share creates. It never sees the
estate id, other machines or placements, personal grants, grants into other organizations, principals, issuers,
projects, capabilities or spend. Fabric shows the `agentRef` and the window before the passkey signs. Joined usage
is per person and reaches others only as sums with each read logged (`FAC-SEM-067`).

## Compatibility

Additive except `grantUsage`: a DEC-0086 collector to a DEC-0082 receiver would be refused `schema`, which the sender
gate prevents; a DEC-0082 collector to a DEC-0086 receiver is refused, so collectors implement `grant.usage` at
DEC-0086 directly. Checked before merge from the board (2026-10-17/18): no collector emits `grant.usage` (CT-51:
Observatory's row was only requested); the first organization server's per-agent part waits on this decision
(thread `b68f4399`, message of 2026-10-18 11:08); no signed revision holds an `org:` share grant (the RM-28 pilot is
not linkable yet, K-1). Existing fixtures with an `org:` share grant or a `grant.usage` migrate to the new id form
and gain `context`.

## Who adopts what

- **Fabric** (CX-FAB-04): mints `urn:fabric:share:<32 hex>` from a CSPRNG; runs `FAC-SEM-117` before the passkey
  signs; one `agentRef` per org grant; shows the `agentRef` and window on the share card; never sends a registration.
- **Project Observatory's node and collector:** derives and sends registrations per enrollment (DEC-0056 signed),
  keeps receipts, withdraws on revocation or drop, re-sends after enrollment and weekly; emits `grant.usage` with
  `context` only behind the gate; runs `fixtures/vectors/share-registration.json`.
- **The first organization server:** a device route for `share-registration/1` after DEC-0056 and DEC-0067; SR and
  GJ rows; keyed by (bound user, grantId); keeps held records, body bytes, signature fields and tombstones; refuses a
  mismatched context as `attribution`; per-agent usage only as sums, reads logged; lists the protocol; runs vectors.
- **fabric-agent-adapter:** vendors the schema and defs; kits run `FAC-SEM-117`, `FAC-SEM-118`, amended `FAC-SEM-045`.

## Vectors and fixtures

`fixtures/vectors/share-registration.json`, generated by `tools/vectors/share-registration.ts --write`, expected
values written by hand, never imported from `src/share-registration.ts`; a test compares the file with the generator
and runs every case in three time zones. Groups: `grantId` (accepted; upper-case hex, case-varied URN, 31 and 33
hex, all zeros, legacy id, an e-mail or estate id in the NSS, a `#1`, a trailing newline: refused); `derive` (every
clause of decision 3, including a delta revocation ahead of the revision, a re-spelled revocation ref, two machines
with one agentRef, two agentRefs); `intake` (every SR row, a case-folded or prefix `org.id`, two registrants with
one grant id, tombstone then active, earlier second withdrawal kept, redelivery, extension); `join` (every GJ row,
another member's device, the end day itself, a negative-offset `startsAt` whose UTC day differs). Positive, negative
and semantic fixtures for each schema branch and rule clause; existing fixtures migrated keeping their verdicts.

## REQ table

| REQ | Requirement | Verified by |
|---|---|---|
| REQ-01 | the closed schema, `shareGrantId`, `orgContextId`, `grantUsage` with required `context` and `shareGrantId` | fixtures, positive sweep, schema closure and compilation |
| REQ-02 | `src/share-registration.ts`: `isShareGrantId`, `shareRegistrationDigest`, `deriveShareRegistrations`, `decideShareRegistration`, `joinGrantUsage`; total, never throws | `test/share-registration.test.ts`, rule-tolerance |
| REQ-03 | `FAC-SEM-117` for `grant` and `org-share-grants` | semantic fixtures, each clause ok and violating |
| REQ-04 | `FAC-SEM-118` for its four kinds | semantic fixtures for every SR and GJ row |
| REQ-05 | `FAC-SEM-045` amended for `grant.usage` context | fixtures and its existing test |
| REQ-06 | vectors deterministic, expected values by hand, three time zones | the generator comparison test |
| REQ-07 | every reference output validates; every schema-refused input refused | `test/share-registration.test.ts` |
| REQ-08 | the two protocol revisions | `test/protocol-revisions.test.ts` |
| REQ-09 | existing fixtures migrated, verdicts kept | positive sweep, semantic runner, existing tests |
| REQ-10 | docs: `docs/specification/share-registration.md`, contexts, activity, devices, estate-record, identifiers, conformance rows, CONTEXT, DOCMAP, README, DEC-0086 and the DEC-0082 annotation, backlog CT-56, handoff | docs-check, lint-md, privacy-check |
| REQ-11 | plants: each refusal clause and join row removed once fails a test; recorded | plant log |
| REQ-12 | `pnpm run check` green, a coverage floor for the new module | the gate output |

## Not decided here

The access level shown to the organization; refusing an `agentRef` absent from the entitlement's `agents`
(DEC-0085, the receiver's policy); private-agent marks on sharing; a local-channel method for Fabric to read
registration state; how long a node keeps unsent sums; registrations from unassigned devices (refused for now);
refusing a dropped-but-unrevoked share grant (`FAC-SEM-114` extension); carried from DEC-0082: corrections of an
emitted day, two collectors of one device, `audience` to `agentRef`, CX-CON-06; a signature on the receipt.
