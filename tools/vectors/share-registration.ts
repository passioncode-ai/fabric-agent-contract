/**
 * The generator of the share-registration vectors (DEC-0086): `fixtures/vectors/share-registration.json`, shared by the
 * sharer's node (it derives and sends registrations) and every organization server (it decides them and joins
 * `grant.usage` to them).
 *
 *   tsx tools/vectors/share-registration.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/share-registration.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/share-registration.test.ts` runs the
 * check. Each expected answer is written below by hand from DEC-0086's items and share-registration.md's SR and GJ
 * tables; the only computed value is a digest, `sha256:` of the UTF-8 RFC 8785 form of a registration, which a port
 * reproduces with its own RFC 8785 and SHA-256. Nothing here imports `src/share-registration.ts`, so the gate checks
 * that the reference returns what this file expects.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { rfc8785 } from "../../src/canonical.js";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/share-registration.json";

const digest = (doc: unknown) => `sha256:${createHash("sha256").update(Buffer.from(rfc8785(doc), "utf8")).digest("hex")}`;

// ---- Names --------------------------------------------------------------------------------------------------------

const ORG = "org_7kq2m4xw";
const OTHER_ORG = "org_3fh9p1zc";
const CTX = `org:${ORG}`;
const OTHER_CTX = `org:${OTHER_ORG}`;
const HEX_A = "3f9c2a7e5b1d4c608e2f71a9d0b6c4e8";
const A = `urn:fabric:share:${HEX_A}`;
const B = "urn:fabric:share:8b1e4d7a2c9f05e3b6a17d40c2e9f851";
const C = "urn:fabric:share:5d2a9e1f7c4b80a3e6d19f2c7b0a4e36";
const AGENT = "urn:fabric:agent:example:inbox-digest";
const NOTES = "urn:fabric:agent:example:notes";
const USER = "m-4821";
const OTHER_USER = "m-7730";
const START = "2026-10-12T08:00:00Z";
const END = "2026-10-26T08:00:00Z";
const ISSUED = "2026-10-14T09:00:00Z";
const TYPE = "share-registration/1";
const RECEIPT = "share-registration-receipt/1";

// ---- The share grant id ---------------------------------------------------------------------------------------------

/** `common.schema.json#/$defs/shareGrantId`: accepted exactly when `ok`, compared as written. */
function grantIdCases(): Json[] {
  const cases: Array<[string, unknown, boolean]> = [
    ["32 lower-case hex digits", A, true],
    ["another id", B, true],
    ["all zeros but the last digit", "urn:fabric:share:00000000000000000000000000000001", true],
    ["upper-case hex", `urn:fabric:share:${HEX_A.toUpperCase()}`, false],
    ["mixed-case hex", "urn:fabric:share:3F9c2a7e5b1d4c608e2f71a9d0b6c4e8", false],
    ["URN in capitals (the same id by normal form, refused as written)", `URN:fabric:share:${HEX_A}`, false],
    ["the NID in capitals", `urn:FABRIC:share:${HEX_A}`, false],
    ["the NSS prefix in capitals", `urn:fabric:SHARE:${HEX_A}`, false],
    ["31 hex digits", `urn:fabric:share:${HEX_A.slice(1)}`, false],
    ["33 hex digits", `urn:fabric:share:${HEX_A}0`, false],
    ["all zeros", `urn:fabric:share:${"0".repeat(32)}`, false],
    ["the legacy id of DEC-0082's fixtures", "urn:grant:estate:share-inbox-digest-org-a", false],
    ["an e-mail address in the NSS", "urn:fabric:share:alice@example.org", false],
    ["an estate id in the NSS", "urn:fabric:share:estate-5d0f1a", false],
    ["a revision appended with #", `${A}#1`, false],
    ["a trailing newline", `${A}\n`, false],
    ["a leading space", ` ${A}`, false],
    ["another namespace's prefix", `urn:fabric:grant:${HEX_A}`, false],
    ["the hex alone", HEX_A, false],
    ["a number", 7, false],
    ["null", null, false]
  ];
  return cases.map(([name, value, ok]) => ({ name, value, ok }));
}

// ---- Derivation ---------------------------------------------------------------------------------------------------

interface GrantSpec { id?: unknown; revision?: unknown; context?: unknown; startsAt?: unknown; expiresAt?: unknown }
const grant = (spec: GrantSpec): Json => {
  const doc: Json = {
    kind: "standing-grant",
    meta: { id: spec.id ?? A, revision: spec.revision ?? 3 },
    startsAt: spec.startsAt ?? START,
    expiresAt: spec.expiresAt ?? END,
    principalKind: "external"
  };
  if (spec.context !== null) doc.context = spec.context ?? CTX;
  return doc;
};
const placement = (grantRef: unknown, context: unknown = CTX, agentRef: unknown = AGENT): Json => ({ agentRef, context, grant: grantRef });
const record = (shareGrants: Json[], placements: Json[][], revocations: Json[] = [], issuedAt: unknown = ISSUED): Json => ({
  schema: "estate-record/1",
  estate: "estate-5d0f1a",
  revision: 7,
  issuedAt,
  machines: placements.map((packages, index) => ({ id: `m-${index + 1}`, packages })),
  shareGrants,
  revocations
});
const revocation = (ref: unknown, revokedAt: unknown, kind = "grant") => ({ kind, ref, revokedAt });
const entry = (ref: unknown, revokedAt: unknown, kind = "grant") => ({ sequence: 1, revocation: revocation(ref, revokedAt, kind) });
const active = (id = A, change: Json = {}): Json => ({ type: TYPE, grantId: id, context: CTX, state: "active", grantRevision: 3, agentRef: AGENT, startsAt: START, expiresAt: END, ...change });
const withdrawn = (id: string, withdrawnAt: string, context = CTX): Json => ({ type: TYPE, grantId: id, context, state: "withdrawn", withdrawnAt });
const derived = (registrations: Json[], degraded: Json[] = []) => ({ registrations, degraded });

function deriveCases(): Json[] {
  const one = [[placement(A)]];
  const cases: Array<[string, unknown, unknown, unknown, unknown, Json]> = [
    ["active: one placement in the context runs the grant", record([grant({})], one), [], ORG, [], derived([active()])],
    ["active: two machines run one agentRef under the grant", record([grant({})], [[placement(A)], [placement(A)]]), [], ORG, [], derived([active()])],
    ["active: a placement names the grant by another spelling of one normal form", record([grant({})], [[placement(`URN:FABRIC:share:${HEX_A}`)]]), [], ORG, [], derived([active()])],
    ["active: the grant listed twice registers once", record([grant({}), grant({ revision: 4 })], one), [], ORG, [], derived([active()])],
    ["nothing: a personal grant never registers", record([grant({ context: "personal" })], [[placement(A, "personal")]]), [], ORG, [], derived([])],
    ["nothing: a grant that states no context never registers", record([grant({ context: null })], [[placement(A)]]), [], ORG, [], derived([])],
    ["nothing: another organization's grant never registers", record([grant({ context: OTHER_CTX })], [[placement(A, OTHER_CTX)]]), [], ORG, [], derived([])],
    ["nothing: a grant whose context differs only in case is another organization's", record([grant({ context: "org:ORG_7KQ2M4XW" })], [[placement(A, "org:ORG_7KQ2M4XW")]]), [], ORG, [], derived([])],
    ["nothing yet: no placement runs the grant", record([grant({})], [[]]), [], ORG, [], derived([])],
    ["nothing yet: the only placement naming the grant is in another context", record([grant({})], [[placement(A, OTHER_CTX)]]), [], ORG, [], derived([])],
    ["degraded: a legacy meta.id registers nothing", record([grant({ id: "urn:grant:estate:share-inbox-digest-org-a" })], [[placement("urn:grant:estate:share-inbox-digest-org-a")]]), [], ORG, [], derived([], [{ grantId: "urn:grant:estate:share-inbox-digest-org-a", code: "share-grant-id" }])],
    ["degraded: an upper-case hex meta.id registers nothing", record([grant({ id: `urn:fabric:share:${HEX_A.toUpperCase()}` })], one), [], ORG, [], derived([], [{ grantId: `urn:fabric:share:${HEX_A.toUpperCase()}`, code: "share-grant-id" }])],
    ["degraded: two agentRefs under one grant register nothing", record([grant({})], [[placement(A)], [placement(A, CTX, NOTES)]]), [], ORG, [], derived([], [{ grantId: A, code: "share-grant-agents" }])],
    ["degraded: an agentRef that is no agentRef registers nothing", record([grant({})], [[placement(A, CTX, "urn:fabric:agent:Example:inbox")]]), [], ORG, [], derived([], [{ grantId: A, code: "share-grant-agents" }])],
    ["active: a microsecond window is rounded inward, the start up and the expiry down", record([grant({ startsAt: "2026-10-12T08:00:00.0001Z", expiresAt: "2026-10-26T08:00:00.9999Z" })], one), [], ORG, [], derived([active(A, { startsAt: "2026-10-12T08:00:00.001Z", expiresAt: "2026-10-26T08:00:00.999Z" })])],
    ["active: a start whose cut digits are all zero is not moved up", record([grant({ startsAt: "2026-10-12T08:00:00.1230000Z" })], one), [], ORG, [], derived([active(A, { startsAt: "2026-10-12T08:00:00.123Z" })])],
    ["active: a start at an offset whose cut digits are all zero is not moved and keeps its offset", record([grant({ startsAt: "2026-10-12T10:00:00.0000+02:00" })], one), [], ORG, [], derived([active(A, { startsAt: "2026-10-12T10:00:00.000+02:00" })])],
    ["active: a microsecond start at an offset is written in UTC, rounded up", record([grant({ startsAt: "2026-10-12T10:00:00.0005+02:00" })], one), [], ORG, [], derived([active(A, { startsAt: "2026-10-12T08:00:00.001Z" })])],
    ["active: a window of three fraction digits or fewer is carried as written, its offset kept", record([grant({ startsAt: "2026-10-12T10:00:00.5+02:00" })], one), [], ORG, [], derived([active(A, { startsAt: "2026-10-12T10:00:00.5+02:00" })])],
    ["active: an expiry whose UTC instant is past year 9999 is carried as written", record([grant({ expiresAt: "9999-12-31T23:00:00-05:00" })], one), [], ORG, [], derived([active(A, { expiresAt: "9999-12-31T23:00:00-05:00" })])],
    ["degraded: a microsecond window empty once rounded inward cannot be carried", record([grant({ startsAt: "2026-10-12T08:00:00.0001Z", expiresAt: "2026-10-12T08:00:00.0009Z" })], one), [], ORG, [], derived([], [{ grantId: A, code: "share-grant-unreadable" }])],
    ["degraded: a start on 31 November cannot be read", record([grant({ startsAt: "2026-11-31T08:00:00Z" })], one), [], ORG, [], derived([], [{ grantId: A, code: "share-grant-unreadable" }])],
    ["degraded: a window that ends where it starts cannot be carried", record([grant({ expiresAt: START })], one), [], ORG, [], derived([], [{ grantId: A, code: "share-grant-unreadable" }])],
    ["degraded: revision 0 cannot be carried", record([grant({ revision: 0 })], one), [], ORG, [], derived([], [{ grantId: A, code: "share-grant-unreadable" }])],
    ["withdrawn: the record revokes the grant", record([grant({})], one, [revocation(A, "2026-10-13T10:00:00Z")]), [], ORG, [], derived([withdrawn(A, "2026-10-13T10:00:00Z")])],
    ["withdrawn: a delta entry ahead of the revision revokes the grant", record([grant({})], one), [entry(A, "2026-10-15T07:30:00Z")], ORG, [], derived([withdrawn(A, "2026-10-15T07:30:00Z")])],
    ["withdrawn: of the record's and a delta entry's revocations, the earliest revokedAt", record([grant({})], one, [revocation(A, "2026-10-15T00:00:00Z")]), [entry(A, "2026-10-14T23:59:59.999Z")], ORG, [], derived([withdrawn(A, "2026-10-14T23:59:59.999Z")])],
    ["withdrawn: two revocations at other offsets, the earlier listed first, keep the first", record([grant({})], one, [revocation(A, "2026-10-13T10:00:00+02:00"), revocation(A, "2026-10-13T09:00:00Z")]), [entry(A, "2026-10-13T08:00:00.001Z")], ORG, [], derived([withdrawn(A, "2026-10-13T10:00:00+02:00")])],
    ["withdrawn: a microsecond revokedAt in the record is floored to milliseconds", record([grant({})], one, [revocation(A, "2026-10-13T10:00:00.123456Z")]), [], ORG, [], derived([withdrawn(A, "2026-10-13T10:00:00.123Z")])],
    ["withdrawn: a microsecond revokedAt in a delta entry is floored, its offset kept", record([grant({})], one), [entry(A, "2026-10-15T07:30:00.9999995+02:00")], ORG, [], derived([withdrawn(A, "2026-10-15T07:30:00.999+02:00")])],
    ["withdrawn: a record revocation and a delta entry equal at the millisecond keep the record's", record([grant({})], one, [revocation(A, "2026-10-13T12:00:00.001+02:00")]), [entry(A, "2026-10-13T10:00:00.0019Z")], ORG, [], derived([withdrawn(A, "2026-10-13T12:00:00.001+02:00")])],
    ["withdrawn: two revocations equal at the millisecond once floored keep the first listed", record([grant({})], one, [revocation(A, "2026-10-13T10:00:00.0019Z"), revocation(A, "2026-10-13T12:00:00.001+02:00")]), [], ORG, [], derived([withdrawn(A, "2026-10-13T10:00:00.001Z")])],
    ["withdrawn: a microsecond revokedAt whose UTC instant is past year 9999 is floored, its offset kept", record([grant({})], one, [revocation(A, "9999-12-31T23:30:00.0001-05:00")]), [], ORG, [], derived([withdrawn(A, "9999-12-31T23:30:00.000-05:00")])],
    ["active: a microsecond expiry whose UTC instant is past year 9999 is floored, its offset kept", record([grant({ expiresAt: "9999-12-31T23:00:00.0001-05:00" })], one), [], ORG, [], derived([active(A, { expiresAt: "9999-12-31T23:00:00.000-05:00" })])],
    ["withdrawn: the earliest by instant, a microsecond earlier in a delta entry than in the record", record([grant({})], one, [revocation(A, "2026-10-13T10:00:00.0019Z")]), [entry(A, "2026-10-13T10:00:00.0005Z")], ORG, [], derived([withdrawn(A, "2026-10-13T10:00:00.000Z")])],
    ["withdrawn: dropped at a microsecond issuedAt, floored", record([], [[]], [], "2026-10-14T09:00:00.0000001Z"), [], ORG, [A], derived([withdrawn(A, "2026-10-14T09:00:00.000Z")])],
    ["withdrawn: a revocation ref spelled otherwise names the grant by normal form", record([grant({})], one, [revocation(`URN:fabric:share:${HEX_A}`, "2026-10-13T10:00:00Z")]), [], ORG, [], derived([withdrawn(A, "2026-10-13T10:00:00Z")])],
    ["withdrawn: a revoked grant registered never before still withdraws (a tombstone at the receiver)", record([grant({ id: B })], [[placement(B)]], [revocation(B, "2026-10-13T10:00:00Z")]), [], ORG, [], derived([withdrawn(B, "2026-10-13T10:00:00Z")])],
    ["active: a revocation of another kind naming the grant's id does not withdraw it", record([grant({})], one, [revocation(A, "2026-10-13T10:00:00Z", "package")]), [], ORG, [], derived([active()])],
    ["degraded: a revocation with no readable revokedAt cannot be carried", record([grant({})], one, [revocation(A, "2026-10-13")]), [], ORG, [], derived([], [{ grantId: A, code: "share-grant-unreadable" }])],
    ["withdrawn: registered before, no longer listed and not revoked, at the revision's issuedAt", record([], [[]]), [], ORG, [A], derived([withdrawn(A, ISSUED)])],
    ["withdrawn: registered before, no longer listed, revoked by a delta entry, at its revokedAt", record([], [[]]), [entry(A, "2026-10-13T12:00:00+02:00")], ORG, [A], derived([withdrawn(A, "2026-10-13T12:00:00+02:00")])],
    ["withdrawn: registered before, now listed only in another organization", record([grant({ context: OTHER_CTX })], [[placement(A, OTHER_CTX)]]), [], ORG, [A], derived([withdrawn(A, ISSUED)])],
    ["active only: registered before and still listed", record([grant({})], one), [], ORG, [A], derived([active()])],
    ["listed order then dropped grants: one active, one withdrawn", record([grant({ id: B })], [[placement(B)]]), [], ORG, [A, A], derived([active(B), withdrawn(A, ISSUED)])],
    ["degraded: dropped while the revision's issuedAt is unreadable", record([], [[]], [], "yesterday"), [], ORG, [A], derived([], [{ grantId: A, code: "share-grant-unreadable" }])],
    ["ignored: a previously registered value that is no share grant id", record([], [[]]), [], ORG, ["urn:grant:estate:share-inbox-digest-org-a", 7, null], derived([])],
    ["ignored: delta entries that carry no revocation object", record([grant({})], one), [{ sequence: 1 }, { revocation: "grant" }, 7], ORG, [], derived([active()])],
    ["malformed: no record", null, [], ORG, [A], derived([])],
    ["malformed: an orgId no context names (a dot)", record([grant({ context: "org:org.example" })], [[placement(A, "org:org.example")]]), [], "org.example", [], derived([])],
    ["malformed: an orgId that is no string", record([grant({})], one), [], 7, [], derived([])]
  ];
  return cases.map(([name, rec, entries, orgId, previouslyRegistered, expected]) => ({ name, record: rec, entries, orgId, previouslyRegistered, expected }));
}

// ---- Intake -------------------------------------------------------------------------------------------------------

const binding = (change: Json = {}): Json => ({ transport: { ok: true }, org: { id: ORG }, device: { id: "dev-01j9a" }, user: { id: USER }, ...change });
const unassigned = (): Json => {
  const { user: _user, ...rest } = binding();
  return rest;
};
const heldActive = (reg: Json, user = USER): Json => ({ user, grantId: reg.grantId, state: "active", grantRevision: reg.grantRevision, agentRef: reg.agentRef, startsAt: reg.startsAt, expiresAt: reg.expiresAt, digest: digest(reg) });
const heldWithdrawn = (base: Json | undefined, reg: Json, user = USER): Json => ({ ...(base ?? { user, grantId: reg.grantId }), state: "withdrawn", withdrawnAt: reg.withdrawnAt, digest: digest(reg) });
const ok = (held: Json, state: string) => ({ status: 200, receipt: { type: RECEIPT, grantId: held.grantId, state, digest: held.digest }, held });
const MESSAGES: Record<string, string> = {
  malformed: "the registration does not have share-registration/1's shape, or its window does not end after it starts",
  "wrong-organization": "the registration's context is not this certificate's organization",
  "unassigned-device": "no user is bound to this device's epoch, so no registrant",
  "already-withdrawn": "this grant is already withdrawn for this user; a withdrawal is final",
  "agent-mismatch": "this grant is held for another agentRef",
  "stale-revision": "a higher revision of this grant is held",
  "revision-conflict": "this revision of the grant is held with other bytes"
};
const refused = (status: number, code: string) => ({ status, body: { error: { code, message: MESSAGES[code] } } });
const unsupported = (protocol: string) => ({ status: 400, body: { error: { code: "schema-unsupported", message: "this receiver does not read that protocol revision", data: { protocol, accepted: [TYPE] } } } });

function intakeCases(): Json[] {
  const base = active();
  const held = heldActive(base);
  const higher = active(A, { grantRevision: 4, expiresAt: "2026-11-09T08:00:00Z" });
  const withdrawal = withdrawn(A, "2026-10-20T12:00:00Z");
  const earlierWithdrawal = withdrawn(A, "2026-10-18T06:00:00Z");
  const laterWithdrawal = withdrawn(A, "2026-10-22T00:00:00Z");
  const heldAfterWithdrawal = heldWithdrawn(held, withdrawal);
  const tombstone = heldWithdrawn(undefined, withdrawal);
  const { agentRef: _agentRef, ...noAgent } = base;
  const cases: Array<[string, unknown, unknown, unknown, Json]> = [
    // SR-0
    ["SR-0: the held list is not a list", { user: USER }, base, binding(), { fault: "context-invalid" }],
    ["SR-0: a held entry with a malformed digest", [{ ...held, digest: "sha256:00" }], base, binding(), { fault: "context-invalid" }],
    ["SR-0: two held entries for one (user, grantId)", [held, { ...held }], base, binding(), { fault: "context-invalid" }],
    ["SR-0: a held tombstone that keeps half an active registration", [{ ...tombstone, agentRef: AGENT }], base, binding(), { fault: "context-invalid" }],
    ["SR-0: a binding with no organization", [], base, { transport: { ok: true }, user: { id: USER } }, { fault: "context-invalid" }],
    ["SR-0: a binding whose user is no {id}", [], base, binding({ user: { id: 5 } }), { fault: "context-invalid" }],
    ["SR-0: a binding whose user is the empty string", [], base, binding({ user: { id: "" } }), { fault: "context-invalid" }],
    ["SR-0: no transport verdict", [], base, { org: { id: ORG }, user: { id: USER } }, { fault: "context-invalid" }],
    ["SR-0: a transport verdict with a code no step answers", [], base, binding({ transport: { ok: false, code: "teapot" } }), { fault: "context-invalid" }],
    ["SR-0: the transport's own step-0 fault, an unreadable clock", [], base, binding({ transport: { ok: false, code: "clock-unreadable" } }), { fault: "clock-unreadable" }],
    ["SR-0: the transport's own step-0 fault, a public base URL that is not https", [], base, binding({ transport: { ok: false, code: "base-url-invalid" } }), { fault: "base-url-invalid" }],
    // SR-1
    ["SR-1: the signature does not verify", [], base, binding({ transport: { ok: false, code: "signature-invalid" } }), { status: 401, code: "signature-invalid" }],
    ["SR-1: a replayed nonce", [held], base, binding({ transport: { ok: false, code: "signature-replayed" } }), { status: 401, code: "signature-replayed" }],
    ["SR-1: an expired certificate, before the body is read", [], { type: "share-registration/2" }, binding({ transport: { ok: false, code: "certificate-expired" } }), { status: 401, code: "certificate-expired" }],
    // SR-2
    ["SR-2: a revision this receiver does not read", [], { ...base, type: "share-registration/2" }, binding(), unsupported("share-registration/2")],
    ["SR-2: a receipt sent as a registration", [], { ...base, type: RECEIPT }, binding(), unsupported(RECEIPT)],
    // SR-3
    ["SR-3: no body", [], null, binding(), refused(400, "malformed")],
    ["SR-3: no type", [], { ...base, type: undefined }, binding(), refused(400, "malformed")],
    ["SR-3: an active registration without its agentRef", [], noAgent, binding(), refused(400, "malformed")],
    ["SR-3: an active registration with withdrawnAt", [], { ...base, withdrawnAt: "2026-10-20T12:00:00Z" }, binding(), refused(400, "malformed")],
    ["SR-3: a withdrawal carrying the agentRef", [], { ...withdrawal, agentRef: AGENT }, binding(), refused(400, "malformed")],
    ["SR-3: an estate id beside the members", [], { ...base, estate: "estate-5d0f1a" }, binding(), refused(400, "malformed")],
    ["SR-3: a legacy grant id", [], active("urn:grant:estate:share-inbox-digest-org-a"), binding(), refused(400, "malformed")],
    ["SR-3: a window that ends where it starts", [], active(A, { expiresAt: START }), binding(), refused(400, "malformed")],
    ["SR-3: an expiry on 31 November", [], active(A, { expiresAt: "2026-11-31T08:00:00Z" }), binding(), refused(400, "malformed")],
    ["SR-3: a start with four fraction digits", [], active(A, { startsAt: "2026-10-12T08:00:00.0001Z" }), binding(), refused(400, "malformed")],
    ["SR-3: revision 0", [], active(A, { grantRevision: 0 }), binding(), refused(400, "malformed")],
    ["SR-3: an unknown state", [], { ...withdrawal, state: "paused" }, binding(), refused(400, "malformed")],
    ["SR-3: the personal context", [], active(A, { context: "personal" }), binding(), refused(400, "malformed")],
    // SR-4
    ["SR-4: another organization's context", [], active(A, { context: OTHER_CTX }), binding(), refused(403, "wrong-organization")],
    ["SR-4: a certificate org.id that differs only in case", [], base, binding({ org: { id: "Org_7kq2m4xw" } }), refused(403, "wrong-organization")],
    ["SR-4: a certificate org.id that is a prefix of the context's", [], base, binding({ org: { id: "org_7kq2m4" } }), refused(403, "wrong-organization")],
    ["SR-4: before the bound user is read", [], active(A, { context: OTHER_CTX }), unassigned(), refused(403, "wrong-organization")],
    // SR-5
    ["SR-5: no user bound to the epoch", [], base, unassigned(), refused(403, "unassigned-device")],
    // SR-6
    ["SR-6: an active registration over a withdrawal", [heldAfterWithdrawal], higher, binding(), refused(409, "already-withdrawn")],
    ["SR-6: tombstone then active: the withdrawal that arrived first stays final", [tombstone], base, binding(), refused(409, "already-withdrawn")],
    // SR-7
    ["SR-7: another agentRef than held, even at a higher revision", [held], active(A, { grantRevision: 4, agentRef: NOTES }), binding(), refused(409, "agent-mismatch")],
    // SR-8
    ["SR-8: a lower grantRevision", [heldActive(higher)], base, binding(), refused(409, "stale-revision")],
    // SR-9
    ["SR-9: the held revision with another window", [held], active(A, { expiresAt: "2026-10-27T08:00:00Z" }), binding(), refused(409, "revision-conflict")],
    // SR-10
    ["SR-10: redelivery of the same bytes", [held], base, binding(), ok(held, "unchanged")],
    ["SR-10: a second, later withdrawal keeps the first", [heldAfterWithdrawal], laterWithdrawal, binding(), ok(heldAfterWithdrawal, "unchanged")],
    ["SR-10: a second, earlier withdrawal is kept in its place", [heldAfterWithdrawal], earlierWithdrawal, binding(), ok({ ...heldAfterWithdrawal, withdrawnAt: earlierWithdrawal.withdrawnAt, digest: digest(earlierWithdrawal) }, "unchanged")],
    ["SR-10: a withdrawal redelivered over its tombstone", [tombstone], withdrawal, binding(), ok(tombstone, "unchanged")],
    // SR-11
    ["SR-11: the first registration", [], base, binding(), ok(held, "registered")],
    ["SR-11: a higher revision extends expiresAt", [held], higher, binding(), ok(heldActive(higher), "registered")],
    ["SR-11: a withdrawal of what is held keeps its agent and window", [held], withdrawal, binding(), ok(heldAfterWithdrawal, "withdrawn")],
    ["SR-11: a withdrawal with nothing held is a tombstone", [], withdrawal, binding(), ok(tombstone, "withdrawn")],
    ["SR-11: two registrants with one grant id are two keys", [held], base, binding({ user: { id: OTHER_USER } }), ok(heldActive(base, OTHER_USER), "registered")],
    ["SR-11: another member cannot overwrite: another agent under the same id is that member's own", [held], active(A, { agentRef: NOTES }), binding({ user: { id: OTHER_USER } }), ok(heldActive(active(A, { agentRef: NOTES }), OTHER_USER), "registered")],
    ["SR-11: another member cannot withdraw a grant held for someone else", [held], withdrawal, binding({ user: { id: OTHER_USER } }), ok(heldWithdrawn(undefined, withdrawal, OTHER_USER), "withdrawn")]
  ];
  return cases.map(([name, heldList, registration, bound, expected]) => ({ name, held: heldList, registration, binding: bound, expected }));
}

// ---- Join ---------------------------------------------------------------------------------------------------------

const usage = (day: string, change: Json = {}): Json => ({
  protocol: "fabric-activity/0.1",
  eventId: "01K7GV0A1B2C3D4E5F6G7H8J9K",
  kind: "grant.usage",
  source: "meter",
  collector: { id: "observatory-node", epoch: 3 },
  seq: 41,
  occurred: `${day}T00:00:00Z`,
  bootId: "boot-7c41e2",
  monotonicNs: "0",
  data: { day, grantId: A, context: CTX, calls: 12, unpricedCalls: 2, costUsd: 0.84, ...change }
});
const epochBinding = (change: Json = {}): Json => ({ org: { id: ORG }, device: { id: "dev-01j9a" }, user: { id: USER }, ...change });
const stored = (reason: string) => ({ outcome: "stored", joined: false, reason });
const joined = (agentRef = AGENT) => ({ outcome: "stored", joined: true, agentRef });

function joinCases(): Json[] {
  const held = heldActive(active());
  const withdrawnHeld = heldWithdrawn(held, withdrawn(A, "2026-10-20T12:00:00Z"));
  const tombstone = heldWithdrawn(undefined, withdrawn(A, "2026-10-20T12:00:00Z"));
  /** Starts at 22:00 on 12 October at UTC−05:00, which is 03:00 on 13 October UTC. */
  const lateStart = heldActive(active(A, { startsAt: "2026-10-12T22:00:00-05:00" }));
  const { user: _user, ...unbound } = epochBinding();
  const { context: _context, ...withoutContext } = usage("2026-10-15").data;
  const cases: Array<[string, unknown, unknown, unknown, Json]> = [
    // GJ-0
    ["GJ-0: the held registrations are not a list", usage("2026-10-15"), epochBinding(), "none", { fault: "context-invalid" }],
    ["GJ-0: a binding with no organization", usage("2026-10-15"), { user: { id: USER } }, [held], { fault: "context-invalid" }],
    ["GJ-0: a binding whose user is no {id}", usage("2026-10-15"), epochBinding({ user: USER }), [held], { fault: "context-invalid" }],
    ["GJ-0: another kind", { ...usage("2026-10-15"), kind: "usage.line" }, epochBinding(), [held], { outcome: "rejected", reason: "schema" }],
    ["GJ-0: a DEC-0082 event without context", { ...usage("2026-10-15"), data: withoutContext }, epochBinding(), [held], { outcome: "rejected", reason: "schema" }],
    ["GJ-0: a legacy grant id", usage("2026-10-15", { grantId: "urn:grant:estate:share-inbox-digest-org-a" }), epochBinding(), [held], { outcome: "rejected", reason: "schema" }],
    ["GJ-0: a day that does not exist", usage("2026-02-30"), epochBinding(), [held], { outcome: "rejected", reason: "schema" }],
    // GJ-1
    ["GJ-1: another organization's context", usage("2026-10-15", { context: OTHER_CTX }), epochBinding(), [held], { outcome: "rejected", reason: "attribution" }],
    ["GJ-1: a context that differs only in case", usage("2026-10-15", { context: "org:Org_7kq2m4xw" }), epochBinding(), [held], { outcome: "rejected", reason: "attribution" }],
    ["GJ-1: before the bound user is read", usage("2026-10-15", { context: OTHER_CTX }), unbound, [held], { outcome: "rejected", reason: "attribution" }],
    // GJ-2
    ["GJ-2: no user bound to the epoch", usage("2026-10-15"), unbound, [held], stored("unassigned-device")],
    // GJ-3
    ["GJ-3: no registration held", usage("2026-10-15"), epochBinding(), [], stored("unregistered")],
    ["GJ-3: another member's device: the grant is registered for someone else", usage("2026-10-15"), epochBinding({ user: { id: OTHER_USER } }), [held], stored("unregistered")],
    ["GJ-3: a tombstone holds no agent", usage("2026-10-15"), epochBinding(), [tombstone], stored("unregistered")],
    ["GJ-3: another grant is registered", usage("2026-10-15", { grantId: C }), epochBinding(), [held], stored("unregistered")],
    // GJ-4
    ["GJ-4: a day before the start's UTC day", usage("2026-10-11"), epochBinding(), [held], stored("before-start")],
    ["GJ-4: a negative-offset start whose UTC day is the next day, on its local day", usage("2026-10-12"), epochBinding(), [lateStart], stored("before-start")],
    ["GJ-6: a negative-offset start, on its UTC day", usage("2026-10-13"), epochBinding(), [lateStart], joined()],
    // GJ-5
    ["GJ-5: a day after the expiry's UTC day", usage("2026-10-27"), epochBinding(), [held], stored("after-end")],
    ["GJ-6: the expiry's UTC day itself", usage("2026-10-26"), epochBinding(), [held], joined()],
    ["GJ-5: a day after the withdrawal's UTC day", usage("2026-10-21"), epochBinding(), [withdrawnHeld], stored("after-end")],
    ["GJ-6: the withdrawal's UTC day itself", usage("2026-10-20"), epochBinding(), [withdrawnHeld], joined()],
    // GJ-6
    ["GJ-6: expiresAt 9999-12-31T23:00:00-05:00, past year 9999 in UTC, joins day 2026-10-15", usage("2026-10-15"), epochBinding(), [heldActive(active(A, { expiresAt: "9999-12-31T23:00:00-05:00" }))], joined()],
    ["GJ-6: the start's UTC day", usage("2026-10-12"), epochBinding(), [held], joined()],
    ["GJ-6: a day inside the window, among two members' registrations", usage("2026-10-15"), epochBinding({ user: { id: OTHER_USER } }), [held, heldActive(active(A, { agentRef: NOTES }), OTHER_USER)], joined(NOTES)]
  ];
  return cases.map(([name, event, bound, registrations, expected]) => ({ name, event, binding: bound, registrations, expected }));
}

// ---- The sender gate ---------------------------------------------------------------------------------------------

function gateCases(): Json[] {
  const receipt = (state: string) => ({ status: 200, receipt: { type: RECEIPT, grantId: A, state, digest: `sha256:${"a".repeat(64)}` }, held: {} });
  const cases: Array<[string, unknown, string]> = [
    ["no answer yet", undefined, "hold"],
    ["a receipt, registered", receipt("registered"), "send"],
    ["a receipt, unchanged", receipt("unchanged"), "send"],
    ["a receipt, withdrawn: usage before the withdrawal still joins", receipt("withdrawn"), "send"],
    ["stale-revision: a higher revision is held", refused(409, "stale-revision"), "send"],
    ["already-withdrawn: the withdrawal is held", refused(409, "already-withdrawn"), "send"],
    ["revision-conflict", refused(409, "revision-conflict"), "hold-degraded"],
    ["agent-mismatch: the grant was re-pointed; revoke it and mint a new id", refused(409, "agent-mismatch"), "hold-degraded"],
    ["wrong-organization: the node sent to another organization", refused(403, "wrong-organization"), "hold-degraded"],
    ["unassigned-device: no user bound until the device is assigned and enrolled again", refused(403, "unassigned-device"), "hold-degraded"],
    ["malformed: the same bytes again do not clear it", refused(400, "malformed"), "hold-degraded"],
    ["schema-unsupported: the receiver does not read this revision", unsupported("share-registration/2"), "hold-degraded"],
    ["stale-revision under a status that is not its own", refused(401, "stale-revision"), "hold"],
    ["agent-mismatch under status 200", { status: 200, body: { error: { code: "agent-mismatch" } } }, "hold"],
    ["wrong-organization under status 409", refused(409, "wrong-organization"), "hold"],
    ["a transport refusal", { status: 401, code: "signature-replayed" }, "hold"],
    ["the receiver's own fault", { fault: "context-invalid" }, "hold"],
    ["a status 200 without a receipt", { status: 200 }, "hold"],
    ["a status 200 whose receipt is a registration", { status: 200, receipt: { type: TYPE } }, "hold"],
    ["a receipt with another status", { status: 201, receipt: receipt("registered").receipt }, "hold"],
    ["an unknown refusal code", { status: 409, body: { error: { code: "teapot" } } }, "hold"],
    ["null", null, "hold"],
    ["a string", "send", "hold"]
  ];
  return cases.map(([name, answer, expected]) => (answer === undefined ? { name, expected } : { name, answer, expected }));
}

/** The vectors as an object. */
export function shareRegistrationVectors(): Json {
  return {
    about:
      "Vectors for share-registration/1 (DEC-0086), written by tools/vectors/share-registration.ts, never by hand. grantId: common.schema.json#/$defs/shareGrantId, ok exactly when a share grant id, compared as written. derive: deriveShareRegistrations(record, entries, orgId, previouslyRegistered); a record carries only the members the derivation reads, so a port's derivation must not validate the whole estate record first. intake: decideShareRegistration(held, registration, binding); held is the receiver's list of what it holds per (user, grantId); binding.transport is the verdict of devices.md's transport steps 0 to 8. join: joinGrantUsage(event, binding, registrations); binding is the one recorded for the event's epoch; a receiver keeps one held list per organization. gate: gateGrantUsage(answer), the collector's sender gate over the enrollment's latest answer to the grant's registration; a case without answer is no answer yet. A time with more than three fraction digits is carried at millisecond precision: a withdrawal floored and a window's end rounded down by cutting the fraction, the offset kept; a window's start rounded up, written as Date#toISOString does when it moves. Of several revocations the earliest after the floor wins, the first listed among equals: the record's revocations in order, then the applied entries in order. expected is exactly what the reference returns; a digest is sha256: of the UTF-8 RFC 8785 form of the registration kept. Every case holds in every time zone.",
    grantId: grantIdCases(),
    derive: deriveCases(),
    intake: intakeCases(),
    join: joinCases(),
    gate: gateCases()
  };
}

/** What `--write` writes: the vector file's exact text. */
export function buildShareRegistrationVectors(): string {
  return `${JSON.stringify(shareRegistrationVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildShareRegistrationVectors();
  if (process.argv.includes("--write")) {
    writeFileSync(target, built);
    console.log(`wrote ${VECTOR_FILE}`);
  } else if (readFileSync(target, "utf8") !== built) {
    console.error(`stale vector file (run with --write): ${VECTOR_FILE}`);
    process.exitCode = 1;
  } else {
    console.log("vector file matches the generator");
  }
}
