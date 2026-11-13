/**
 * The generator of the authority-level vectors (DEC-0162): `fixtures/vectors/levels.json`, shared by every
 * organization server that issues `org-membership/2`, every hub that writes a delegation token's `mem`, and every
 * service that reads a level decision or a level mandate.
 *
 *   tsx tools/vectors/levels.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/levels.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/levels.test.ts` runs the check. Each
 * test key's seed is the SHA-256 of a published label and Ed25519 signatures are deterministic, so a port's signer
 * reproduces every `sig`; they are test keys, trusted by nothing. Each expected answer is written below by hand from
 * DEC-0162 (LV-1 to LV-11) with DEC-0121 AP-2, AP-4 and DEC-0125 MD-3, MD-5; nothing here imports `src/levels.ts`,
 * `src/actions.ts`, `src/mandate.ts` or `src/org-membership.ts`, so the gate checks that the reference agrees.
 */
import { createHash, createPrivateKey, sign as nodeSign } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { rfc8785 } from "../../src/canonical.js";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/levels.json";

// ---- Keys and the key set -----------------------------------------------------------------------------------------

const LABEL = "fabric-agent-contract/vectors/levels/";
const PKCS8_ED25519 = Buffer.from("302e020100300506032b657004220420", "hex");
const sha256 = (data: string | Buffer) => createHash("sha256").update(data).digest();

interface TestKey { seed: string; kid: string; x: string; sign: (bytes: Buffer) => string }
function testKey(label: string, kid: string): TestKey {
  const seed = sha256(`${LABEL}${label}`);
  const key = createPrivateKey({ key: Buffer.concat([PKCS8_ED25519, seed]), format: "der", type: "pkcs8" });
  const x = (key.export({ format: "jwk" }) as { x: string }).x;
  return { seed: seed.toString("hex"), kid, x, sign: (bytes) => nodeSign(null, bytes, key).toString("base64url") };
}

/** Organization A's membership root, which the person's estate pins; it signs key sets only. */
const ROOT = testKey("root-org-a", "root-org-a-1");
/** The signing key the key set lists. */
const KEY = testKey("signing-2026-10", "mem-2026-10");

const ISSUER = "https://orgs.example";
const ORG = "org:org-a";
/** The audience organization A's issuer names the reviews service by: the service that reads the levels. */
const SERVICE = "reviews-service-a1";
const OTHER_SERVICE = "billing-service-b2";

const statement = (doc: Json) => {
  const { sig: _sig, ...fields } = doc;
  return Buffer.from(rfc8785(fields), "utf8");
};
const digest = (doc: Json) => `sha256:${sha256(statement(doc)).toString("hex")}`;
const signed = (doc: Json, key: TestKey) => ({ ...doc, sig: key.sign(statement(doc)) });

const KEY_SET = signed({
  type: "org-key-set/1", issuer: ISSUER, org: ORG, revision: 1, issuedAt: "2026-10-15T00:00:00Z",
  keys: [{ kid: KEY.kid, alg: "EdDSA", x: KEY.x, notBefore: "2026-10-15T00:00:00Z", notAfter: "2027-01-01T00:00:00Z" }],
  revoked: [], administrators: [], alg: "EdDSA", kid: ROOT.kid
}, ROOT);

// ---- Attestations -------------------------------------------------------------------------------------------------

const ISSUED = "2026-10-25T11:00:00Z";
const EXPIRES = "2026-10-25T12:00:00Z";
const NOW = "2026-10-25T11:30:00Z";
const AT = "2026-10-25T11:20:00Z";

function membership(subject: string, role: string, projects: string[] = [], change: Json = {}): Json {
  return signed({
    type: "org-membership/2", issuer: ISSUER, org: ORG, audience: SERVICE, subject, role, projects, external: false,
    status: "active", revision: 3, membershipEndsAt: null, issuedAt: ISSUED, notBefore: ISSUED, expiresAt: EXPIRES,
    extensions: {}, alg: "EdDSA", kid: KEY.kid, ...change
  }, KEY);
}

const OWNER = membership("m-owner-01", "owner");
const ADMIN = membership("m-admin-02", "admin");
const ARCHITECT = membership("m-arch-03", "architect", ["alpha", "beta"]);
const MEMBER = membership("m-member-04", "member");
const ENDED = membership("m-admin-05", "admin", [], { status: "ended", revision: 4 });
const ELSEWHERE = membership("m-admin-06", "admin", [], { audience: OTHER_SERVICE });
const EXPIRED = membership("m-admin-07", "admin", [], { issuedAt: "2026-10-25T10:00:00Z", notBefore: "2026-10-25T10:00:00Z", expiresAt: "2026-10-25T11:25:00Z" });
/** The issuer's `/1` for a `/1` reader: an architect reads as `member` there (LV-1). */
const V1_MEMBER = signed({
  type: "org-membership/1", issuer: ISSUER, org: ORG, audience: SERVICE, subject: "m-arch-03", role: "member", external: false,
  status: "active", revision: 3, membershipEndsAt: null, issuedAt: ISSUED, notBefore: ISSUED, expiresAt: EXPIRES,
  extensions: {}, alg: "EdDSA", kid: KEY.kid
}, KEY);

const MEMBERSHIPS: Record<string, Json> = { owner: OWNER, admin: ADMIN, architect: ARCHITECT, member: MEMBER, ended: ENDED, elsewhere: ELSEWHERE, expired: EXPIRED, v1Member: V1_MEMBER };

// ---- Action calls -------------------------------------------------------------------------------------------------

const relayed = { id: "approve-reply", title: "Approve the reply", tool: "reviews.approve", gate: "relayed" };
/** A billing act: the organization's plan, declared as the owner's (LV-7). */
const billing = { id: "change-plan", title: "Change the plan", tool: "billing.plan", gate: "relayed" };
/** A policy change (effect change-policy), left out of the service's action levels: an owner's or an admin's (LV-7). */
const policy = { id: "set-policy", title: "Change the project's policy", tool: "policy.set", gate: "relayed" };
const clientKey = { id: "issue-key", title: "Issue a client key", tool: "keys.issue", gate: "relayed" };
const human = { id: "connect-store", title: "Do it yourself", tool: "accounts.connect", gate: "human", humanStep: "payment" };
const CALLER = "agent:claude-code";
const DIGEST = `sha256:${"ab".repeat(32)}`;
const URL = "https://store.example/connect";
const LEVELS = { [ORG]: { audience: SERVICE, keySet: KEY_SET } };

const decided = (level: string, held: Json, extra: Json = {}): Json => ({
  by: "level", via: "level-command", level, org: ORG, action: "approve-reply",
  instruction: "approve the reply to the review from Anna", at: AT, membership: held, ...extra
});
const call = (tier: string, decision: unknown, extra: Json = {}) => ({ action: relayed, tier, caller: CALLER, decision, now: NOW, actionDigest: DIGEST, levels: LEVELS, ...extra });
const level = (name: string, held: Json, project?: string) => ({
  ok: true,
  recordAs: { by: "level", via: "level-command", level: name, org: ORG, ...(project ? { project } : {}), approver: held.subject, membershipDigest: digest(held), revision: held.revision, caller: CALLER }
});
const invalid = (detail?: string) => (detail ? { ok: false, code: "decision-invalid", data: { detail } } : { ok: false, code: "decision-invalid" });
const insufficient = { ok: false, code: "operator-decision-required", data: { detail: "level-insufficient: admin" } };

function actionCases(): Json[] {
  const list: Array<[string, Json, Json]> = [
    // LV-6: a bound level decision stands as the operator's for a relayed action, at every tier.
    ["the owner decides a relayed action from T2", call("T2", decided("owner", OWNER), { tokenMem: digest(OWNER) }), level("owner", OWNER)],
    ["an administrator decides from T0", call("T0", decided("admin", ADMIN), { tokenMem: digest(ADMIN) }), level("admin", ADMIN)],
    ["an architect decides in its project from T1", call("T1", decided("architect", ARCHITECT, { project: "alpha" }), { tokenMem: digest(ARCHITECT), project: "alpha" }), level("architect", ARCHITECT, "alpha")],
    ["the owner decides at the administrator's level", call("T2", decided("admin", OWNER), { tokenMem: digest(OWNER) }), level("admin", OWNER)],
    ["an administrator decides in a project the decision names", call("T2", decided("admin", ADMIN, { project: "gamma" }), { tokenMem: digest(ADMIN), project: "gamma" }), level("admin", ADMIN, "gamma")],
    // LV-4, LV-10: the level the call needs.
    ["an architect outside its projects", call("T2", decided("architect", ARCHITECT, { project: "gamma" }), { tokenMem: digest(ARCHITECT), project: "gamma" }), insufficient],
    ["an architect's decision naming a project on a call in no project", call("T2", decided("architect", ARCHITECT, { project: "alpha" }), { tokenMem: digest(ARCHITECT) }), invalid()],
    ["an administrator decides at the architect level in a project", call("T2", decided("architect", ADMIN, { project: "gamma" }), { tokenMem: digest(ADMIN), project: "gamma" }), level("architect", ADMIN, "gamma")],
    ["the owner decides at the architect level in a project", call("T1", decided("architect", OWNER, { project: "alpha" }), { tokenMem: digest(OWNER), project: "alpha" }), level("architect", OWNER, "alpha")],
    // LV-7: a billing act is the owner's.
    ["the owner decides a billing act", call("T2", { ...decided("owner", OWNER), action: "change-plan" }, { action: billing, actionLevel: "owner", tokenMem: digest(OWNER) }), level("owner", OWNER)],
    ["an administrator on a billing act", call("T2", { ...decided("admin", ADMIN), action: "change-plan" }, { action: billing, actionLevel: "owner", tokenMem: digest(ADMIN) }), { ok: false, code: "operator-decision-required", data: { detail: "level-insufficient: owner" } }],
    // LV-7: a policy change is an owner's or an admin's, never an architect's, whatever the service declares (question 4).
    ["an architect's policy change in its project, left undeclared", call("T1", { ...decided("architect", ARCHITECT, { project: "alpha" }), action: "set-policy" }, { action: policy, effect: "change-policy", tokenMem: digest(ARCHITECT), project: "alpha" }), insufficient],
    ["an architect's policy change in its project, declared architect", call("T1", { ...decided("architect", ARCHITECT, { project: "alpha" }), action: "set-policy" }, { action: policy, effect: "change-policy", actionLevel: "architect", tokenMem: digest(ARCHITECT), project: "alpha" }), insufficient],
    ["an administrator's policy change in a project", call("T2", { ...decided("admin", ADMIN, { project: "alpha" }), action: "set-policy" }, { action: policy, effect: "change-policy", tokenMem: digest(ADMIN), project: "alpha" }), level("admin", ADMIN, "alpha")],
    // LV-7: an act declared admin (a spend limit, a board hold, a slot move, a listing) is an owner's or an admin's.
    ["an architect in its project on an act declared admin", call("T1", decided("architect", ARCHITECT, { project: "alpha" }), { actionLevel: "admin", tokenMem: digest(ARCHITECT), project: "alpha" }), insufficient],
    ["an administrator on an act declared admin", call("T2", decided("admin", ADMIN), { actionLevel: "admin", tokenMem: digest(ADMIN) }), level("admin", ADMIN)],
    // LV-7: an act the service keeps for the operator alone (a client key, DEC-0159 CF-3) is decided by no level.
    ["the owner on an act no level decides", call("T1", { ...decided("owner", OWNER), action: "issue-key" }, { action: clientKey, actionLevel: "operator", tokenMem: digest(OWNER) }), { ok: false, code: "operator-decision-required", data: { detail: "level-insufficient: operator" } }],
    ["the operator's own decision on an act no level decides, from T0", call("T0", { by: "operator", via: "relayed-instruction", action: "issue-key", instruction: "Issue the key for the support bot", at: "2026-10-25T11:29:00Z" }, { action: clientKey, actionLevel: "operator" }), { ok: true, recordAs: { by: "operator", via: "relayed-instruction", caller: CALLER } }],
    // LV-4: the service's own accepted elicitation is the operator's word, read before a level form.
    ["an accepted elicitation beside an unbound level decision, from T0", call("T0", decided("admin", ADMIN), { elicited: true }), { ok: true, recordAs: { by: "operator", via: "elicitation", caller: CALLER } }],
    // OM-4, LV-11: an older active revision after the issuer stated the end at a higher one.
    ["an older revision after an ended one", call("T2", decided("admin", ADMIN), { tokenMem: digest(ADMIN), levels: { [ORG]: { audience: SERVICE, keySet: KEY_SET, held: { [ADMIN.subject]: { subject: ADMIN.subject, revision: 9, digest: `sha256:${"cd".repeat(32)}` } } } } }), invalid("level-membership: stale-revision")],
    ["an architect's decision for another project than the call's", call("T2", decided("architect", ARCHITECT, { project: "alpha" }), { tokenMem: digest(ARCHITECT), project: "beta" }), invalid()],
    // LV-5: the token binds the attestation to the caller.
    ["a copied attestation: the call presented no token", call("T0", decided("admin", ADMIN)), invalid("level-unbound")],
    ["a token bound to another attestation", call("T2", decided("admin", ADMIN), { tokenMem: digest(OWNER) }), invalid("level-unbound")],
    // LV-4, LV-10, LV-11: the attestation.
    ["an attestation for another service", call("T2", decided("admin", ELSEWHERE), { tokenMem: digest(ELSEWHERE) }), invalid("level-audience")],
    ["an ended membership inside the decision's window", call("T2", decided("admin", ENDED), { tokenMem: digest(ENDED) }), invalid("level-membership: ended")],
    ["an attestation expired before the service reads it", call("T2", decided("admin", EXPIRED, { at: "2026-10-25T11:10:00Z" }), { tokenMem: digest(EXPIRED) }), invalid("level-expired")],
    ["a level above the attestation's role", call("T2", decided("admin", ARCHITECT), { tokenMem: digest(ARCHITECT) }), invalid("level-role")],
    ["a member's request carries no level", call("T2", decided("architect", MEMBER, { project: "alpha" }), { tokenMem: digest(MEMBER), project: "alpha" }), invalid("level-role")],
    ["a forged signature", call("T2", decided("admin", { ...ADMIN, role: "owner" }), { tokenMem: digest({ ...ADMIN, role: "owner" }) }), invalid("level-membership: bad-signature")],
    ["an organization the service reads no levels in", call("T2", decided("admin", ADMIN), { tokenMem: digest(ADMIN), levels: { "org:org-b": { audience: SERVICE, keySet: { ...KEY_SET, org: "org:org-b" } } } }), invalid("level-membership: context-invalid")],
    // LV-1: a /1 attestation is not a level decision's.
    ["a /1 attestation in a level decision", call("T2", decided("admin", V1_MEMBER), { tokenMem: digest(V1_MEMBER) }), invalid("level-membership: malformed")],
    // AP-2's checks on the decision itself.
    ["a level decision for another action", call("T2", decided("admin", ADMIN, { action: "delete-reply" }), { tokenMem: digest(ADMIN) }), invalid()],
    ["a level decision 24 h and 1 s old", call("T2", decided("admin", ADMIN, { at: "2026-10-24T11:29:59Z" }), { tokenMem: digest(ADMIN) }), invalid()],
    ["an architect's level decision without its project", call("T2", (({ project: _p, ...rest }) => rest)(decided("architect", ARCHITECT)), { tokenMem: digest(ARCHITECT), project: "alpha" }), invalid()],
    ["a level decision in a personal context", call("T2", decided("admin", ADMIN, { org: "personal" }), { tokenMem: digest(ADMIN) }), invalid()],
    // LV-7, AP-4: a level never covers the person's body.
    ["a level decision against a human step", { action: human, tier: "T0", caller: CALLER, decision: decided("owner", OWNER), tokenMem: digest(OWNER), now: NOW, humanStepUrl: URL, levels: LEVELS }, { ok: false, code: "human-step-required", data: { humanStep: "payment", url: URL } }],
    // LV-10: a service that reads no levels answers as if the call carried no decision.
    ["a service reading no levels, from T0", (({ levels: _l, ...rest }) => rest)(call("T0", decided("admin", ADMIN), { tokenMem: digest(ADMIN) })), { ok: false, code: "operator-decision-required" }],
    ["a service reading no levels, from T2", (({ levels: _l, ...rest }) => rest)(call("T2", decided("admin", ADMIN), { tokenMem: digest(ADMIN) })), { ok: false, code: "approval-required", data: { actionDigest: DIGEST } }],
    // LV-10: a malformed entry of the service's own level contexts, or a mistyped action level, is the service's fault
    // (levels-invalid, action-level-invalid), never the caller's level-membership: context-invalid.
    ["a level context whose audience is not an opaque id", call("T2", decided("admin", ADMIN), { tokenMem: digest(ADMIN), levels: { [ORG]: { audience: "reviews service", keySet: KEY_SET } } }), { fault: "levels-invalid" }],
    ["a level context whose key set names another organization", call("T2", decided("admin", ADMIN), { tokenMem: digest(ADMIN), levels: { [ORG]: { audience: SERVICE, keySet: { ...KEY_SET, org: "org:org-b" } } } }), { fault: "levels-invalid" }],
    ["a held attestation filed under another subject", call("T2", decided("admin", ADMIN), { tokenMem: digest(ADMIN), levels: { [ORG]: { audience: SERVICE, keySet: KEY_SET, held: { "m-other-01": { subject: ADMIN.subject, revision: ADMIN.revision, digest: digest(ADMIN) } } } } }), { fault: "levels-invalid" }],
    ["a level context listing a key of another algorithm", call("T2", decided("admin", ADMIN), { tokenMem: digest(ADMIN), levels: { [ORG]: { audience: SERVICE, keySet: { ...KEY_SET, keys: ((KEY_SET as Json).keys as Json[]).map((k) => ({ ...k, alg: "ES256" })) } } } }), { fault: "levels-invalid" }],
    ["an action whose declared level is mistyped", call("T2", decided("admin", ADMIN), { tokenMem: digest(ADMIN), actionLevel: "Owner" }), { fault: "action-level-invalid" }]
  ];
  return list.map(([name, input, expected]) => ({ name, input, expected: withDigest(input, expected) }));
}

/** At T2 a refused level keeps DL-18's route: the refusal carries the action's digest (LV-10). */
function withDigest(input: Json, expected: Json): Json {
  const refusedLevel = expected.ok === false && (expected.code === "operator-decision-required" || expected.code === "decision-invalid") && input.tier === "T2" && input.levels !== undefined && input.actionDigest !== undefined;
  return refusedLevel ? { ...expected, data: { ...expected.data, actionDigest: input.actionDigest } } : expected;
}

// ---- Level mandates -----------------------------------------------------------------------------------------------

const levelMandate = (held: Json, lvl: string, scope: Json) => ({
  kind: "mandate/1", by: "level", level: lvl, org: ORG, membership: held, task: "answer the reviews of the week",
  instruction: "answer this week's reviews in project alpha", at: AT, expiresAt: "2026-10-26T11:20:00Z",
  scope, chain: [{ agent: "example-developer", at: AT }, { agent: "example-reviewer", at: "2026-10-25T11:25:00Z" }]
});
const ALPHA = { capabilities: ["reviews.approve"], effects: ["reply"], projects: ["alpha"] };
const mandateCall = (tier: string, mandate: Json, extra: Json = {}) => ({
  action: relayed, tier, caller: CALLER, now: NOW, actionDigest: DIGEST, self: "example-reviewer", callerAgent: "example-developer",
  effect: "reply", project: "alpha", mandate, levels: LEVELS, ...extra
});
const byLevelMandate = (held: Json, lvl: string) => ({
  ok: true,
  recordAs: { by: "level", level: lvl, org: ORG, project: "alpha", approver: held.subject, membershipDigest: digest(held), revision: held.revision, via: "mandate", task: "answer the reviews of the week", chain: ["example-developer", "example-reviewer"], caller: CALLER }
});

function mandateCases(): Json[] {
  const list: Array<[string, Json, Json]> = [
    // LV-6, MD-5 amended: a bound level mandate is taken from a T2 caller.
    ["an architect's level mandate from T2, covered", mandateCall("T2", levelMandate(ARCHITECT, "architect", ALPHA), { tokenMem: digest(ARCHITECT) }), byLevelMandate(ARCHITECT, "architect")],
    ["an administrator's level mandate from T1, covered", mandateCall("T1", levelMandate(ADMIN, "admin", ALPHA), { tokenMem: digest(ADMIN) }), byLevelMandate(ADMIN, "admin")],
    // DL-17: from T2 an operator decision counts for nothing, so a bound level mandate beside one is read.
    ["a bound level mandate beside an operator decision, from T2", mandateCall("T2", levelMandate(ADMIN, "admin", ALPHA), { tokenMem: digest(ADMIN), decision: { by: "operator", via: "relayed-instruction", action: "approve-reply", instruction: "approve it", at: "2026-10-25T11:29:00Z" } }), byLevelMandate(ADMIN, "admin")],
    ["an architect's level mandate from T2 on a project outside its own", mandateCall("T2", levelMandate(ARCHITECT, "architect", { ...ALPHA, projects: ["alpha", "gamma"] }), { tokenMem: digest(ARCHITECT), project: "gamma" }), insufficient],
    // LV-10: a level mandate where no levels are read is as if absent (mandateCovers answers it ignored, levels-not-read).
    ["a level mandate where no levels are read, from T1", (({ levels: _l, ...rest }) => rest)(mandateCall("T1", levelMandate(ADMIN, "admin", ALPHA), { tokenMem: digest(ADMIN) })), { ok: false, code: "operator-decision-required" }],
    ["a level mandate outside its scope's projects", mandateCall("T2", levelMandate(ADMIN, "admin", ALPHA), { tokenMem: digest(ADMIN), project: "beta" }), { ok: false, code: "operator-decision-required", data: { detail: "outside-mandate: project" } }],
    ["a level mandate without the token's mem", mandateCall("T2", levelMandate(ADMIN, "admin", ALPHA)), { ok: false, code: "decision-invalid", data: { detail: "level-unbound" } }],
    ["a level mandate of an ended membership", mandateCall("T2", levelMandate(ENDED, "admin", ALPHA), { tokenMem: digest(ENDED) }), { ok: false, code: "decision-invalid", data: { detail: "level-membership: ended" } }],
    ["a level mandate at a service reading no levels, from T2", (({ levels: _l, ...rest }) => rest)(mandateCall("T2", levelMandate(ADMIN, "admin", ALPHA), { tokenMem: digest(ADMIN) })), { ok: false, code: "approval-required", data: { actionDigest: DIGEST } }],
    ["a level mandate at a service reading no levels, from T0", (({ levels: _l, ...rest }) => rest)(mandateCall("T0", levelMandate(ADMIN, "admin", ALPHA), { tokenMem: digest(ADMIN) })), { ok: false, code: "operator-decision-required" }],
    ["an architect's level mandate on a call in no project", (({ project: _p, ...rest }) => rest)(mandateCall("T2", levelMandate(ARCHITECT, "architect", ALPHA), { tokenMem: digest(ARCHITECT) })), insufficient],
    // LV-6: a level mandate stands only at the service its attestation is for; handed on to another, it does not.
    ["a level mandate handed on to a service its attestation is not for", mandateCall("T2", levelMandate(ADMIN, "admin", ALPHA), { tokenMem: digest(ADMIN), levels: { [ORG]: { audience: "crawler-service-c3", keySet: KEY_SET } } }), { ok: false, code: "decision-invalid", data: { detail: "level-audience" } }],
    ["an administrator's level mandate on a billing act", mandateCall("T2", levelMandate(ADMIN, "admin", { capabilities: ["billing.plan"], effects: ["reply"], projects: ["alpha"] }), { action: billing, actionLevel: "owner", tokenMem: digest(ADMIN) }), { ok: false, code: "operator-decision-required", data: { detail: "level-insufficient: owner" } }],
    ["the owner's level mandate on an act no level decides", mandateCall("T2", levelMandate(OWNER, "owner", { capabilities: ["keys.issue"], effects: ["reply"], projects: ["alpha"] }), { action: clientKey, actionLevel: "operator", tokenMem: digest(OWNER) }), { ok: false, code: "operator-decision-required", data: { detail: "level-insufficient: operator" } }],
    // A level decision outranks a mandate, as an operator decision does: one that fails is refused, the mandate unread.
    ["an unbound level decision beside an operator's mandate, from T0", mandateCall("T0", { ...(({ level: _a, org: _b, membership: _c, ...rest }) => rest)(levelMandate(ADMIN, "admin", ALPHA)), by: "operator" }, { decision: decided("admin", ADMIN, { project: "alpha" }) }), { ok: false, code: "decision-invalid", data: { detail: "level-unbound" } }],
    // LV-10: where no levels are read, a level decision is as if absent, so the operator's mandate beside it decides.
    ["a level decision beside an operator's mandate at a service reading no levels, from T0", (({ levels: _l, ...rest }) => rest)(mandateCall("T0", { ...(({ level: _a, org: _b, membership: _c, ...rest }) => rest)(levelMandate(ADMIN, "admin", ALPHA)), by: "operator" }, { decision: decided("admin", ADMIN, { project: "alpha" }) })), { ok: true, recordAs: { by: "operator", via: "mandate", task: "answer the reviews of the week", chain: ["example-developer", "example-reviewer"], caller: CALLER } }],
    ["an operator's mandate from T2 still changes nothing (MD-5)", mandateCall("T2", { ...(({ level: _a, org: _b, membership: _c, ...rest }) => rest)(levelMandate(ADMIN, "admin", ALPHA)), by: "operator" }, { tokenMem: digest(ADMIN) }), { ok: false, code: "approval-required", data: { actionDigest: DIGEST } }]
  ];
  return list.map(([name, input, expected]) => ({ name, input, expected: withDigest(input, expected) }));
}

// ---- Verifying /2 -------------------------------------------------------------------------------------------------

function verifyCases(): Json[] {
  const trust = (levels?: boolean) => ({ now: NOW, org: ORG, audience: SERVICE, keySet: "keySet", ...(levels === undefined ? {} : { levels }) });
  const verdict2 = (held: Json) => ({
    ok: true, status: held.status === "ended" ? "ended" : "active", role: held.role, type: "org-membership/2", projects: held.projects, expiresAt: held.expiresAt,
    refreshDue: false, unchanged: false, digest: digest(held), held: { subject: held.subject, revision: held.revision, digest: digest(held) }
  });
  return [
    { name: "a /2 reader verifies an architect", membership: "architect", trust: trust(true), expected: verdict2(ARCHITECT) },
    { name: "a /2 reader verifies an owner", membership: "owner", trust: trust(true), expected: verdict2(OWNER) },
    { name: "a /1 reader given an architect's /2 refuses it: it does not know the type", membership: "architect", trust: trust(), expected: { ok: false, problem: "malformed" } },
    { name: "a /1 reader reads the issuer's /1 for it: the architect as member", membership: "v1Member", trust: trust(), expected: { ok: true, status: "active", role: "member", refreshDue: false, unchanged: false, digest: digest(V1_MEMBER), held: { subject: "m-arch-03", revision: 3, digest: digest(V1_MEMBER) } } },
    { name: "an architect without projects is malformed", membership: { ...ARCHITECT, projects: [] }, trust: trust(true), expected: { ok: false, problem: "malformed" } },
    { name: "an administrator with projects is malformed", membership: { ...ADMIN, projects: ["alpha"] }, trust: trust(true), expected: { ok: false, problem: "malformed" } }
  ];
}

// ---- Output -------------------------------------------------------------------------------------------------------

export function levelsVectors(): Json {
  return {
    about: "Vectors for authority levels (DEC-0162), written by tools/vectors/levels.ts, never by hand. keys: Ed25519 test keys, each seed the SHA-256 of a published label (anyone can derive them; nothing trusts them). keySet: organization A's org-key-set/1, signed by root. memberships: org-membership/2 attestations (and the issuer's /1 for a /1 reader) signed by the listed key; digests: sha256 of each one's signed bytes, the value a hub writes as a delegation token's mem. actions: actionDecision(input) with input.levels naming a key set by value. mandates: actionDecision(input) for a call that carries a level mandate. verify: verifyOrgMembership(memberships[name] or the document, trust), trust.now an RFC 3339 string a port parses strictly, trust.keySet the name keySet. expected is exactly what the reference returns.",
    keys: { root: { seed: ROOT.seed, kid: ROOT.kid, x: ROOT.x }, signing: { seed: KEY.seed, kid: KEY.kid, x: KEY.x } },
    keySet: KEY_SET,
    memberships: MEMBERSHIPS,
    digests: Object.fromEntries(Object.entries(MEMBERSHIPS).map(([name, doc]) => [name, digest(doc)])),
    actions: actionCases(),
    mandates: mandateCases(),
    verify: verifyCases()
  };
}

export function buildLevelsVectors(): string {
  return `${JSON.stringify(levelsVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildLevelsVectors();
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
