// #region credentials — docs: docs/specification/credentials.md
/**
 * DEC-0111 (CT-86, S5 and S6 of the agent network): a narrow credential an agent asks its organization for, the
 * organization's decision, the sealed envelope that delivers it into that organization's context on one machine (or,
 * between one person's own machines, into the personal context), its revocation, the estate key keyed digests use, and
 * one record per call between agents.
 *
 * The envelope reuses the secret envelope's sealing (HPKE base mode, suite [16, 1, 1], to the recipient's `#kem`) under
 * its own `info`, `fabric-credential-envelope/1`. In an organization's context it is signed by a key of that
 * organization's current policy key set (Ed25519, as a policy layer and a repair request are); in the personal context
 * by the sending machine's `#sig` (ES256), a machine of the estate record the target applied. Every function here
 * answers malformed input with a verdict and never throws on a JSON value.
 */
import { createECDH, createHash, createHmac, sign as nodeSign, type KeyObject } from "node:crypto";
import { hasHomePath } from "./activity-rules.js";
import { rfc8785 } from "./canonical.js";
import { ORG_CONTEXT_PREFIX, PERSONAL_CONTEXT } from "./context-route.js";
import { policySigningInput, verifyWith } from "./device-rules.js";
import { machineProfile } from "./estate-record-rules.js";
import { type Finding, type JsonObject, isObject, show } from "./findings.js";
import { p256KeyRefusal, p256Point, signEs256, type P256Key } from "./p256.js";
import { looksLikeCredential } from "./registry-rules.js";
import { CLOCK_SKEW_SECONDS, instant, relayAdmissionSet, verifyEs256 } from "./relay.js";
import { strictTime } from "./rfc3339.js";
import { ENVELOPE_SUITE, MAX_ENVELOPE_LIFETIME_SECONDS, hpkeOpenBase, hpkeSealBase } from "./secret-envelope.js";

export const CREDENTIAL_ENVELOPE_TYPE = "fabric-credential-envelope/1";
export const CREDENTIAL_REQUEST_TYPE = "credential-request/1";
export const CREDENTIAL_DECISION_TYPE = "credential-decision/1";
export const CREDENTIAL_REVOCATION_TYPE = "credential-revocation/1";
export const CALL_RECORD_TYPE = "call-record/1";
/** The longest a requested or issued credential lives in an organization's context, from its request (DEC-0111). */
export const MAX_CREDENTIAL_DAYS = 30;
/** The reserved holder and slot of the estate's digest key, delivered between one person's machines (DEC-0111). */
export const ESTATE_AGENT_REF = "urn:fabric:agent:fabric:estate";
export const ESTATE_DIGEST_SLOT = "ESTATE_DIGEST_KEY";
export const CREDENTIAL_REFUSALS = [
  "malformed", "unsupported-alg", "wrong-recipient", "wrong-context", "bad-key", "bad-signature", "sender-not-allowed",
  "not-requested", "replayed", "sequence-reused", "not-yet-valid", "lifetime-too-long", "expired", "credential-expired",
  "cannot-open"
] as const;
export type CredentialRefusal = (typeof CREDENTIAL_REFUSALS)[number];

const DAY_MS = 86_400_000;
const INFO = Buffer.from(CREDENTIAL_ENVELOPE_TYPE, "ascii");
const ORG_ALG = "EdDSA";
const PERSONAL_ALG = "ES256";
const AGENT_REF = /^urn:fabric:agent:[a-z][a-z0-9]*(?:-[a-z0-9]+)*:[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const SLOT = /^[A-Z][A-Z0-9_]{0,63}$/;
const PROVIDER = /^[a-z][a-z0-9-]{1,62}$/; // common.schema.json#/$defs/slug
const ORG_CONTEXT = /^org:[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const KEM_KID = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,127}#kem$/;
const SIG_KID = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,127}#sig$/;
const KEY_ID = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,127}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const B64URL = /^[A-Za-z0-9_-]+$/;
const SIG = /^[A-Za-z0-9_-]{86}$/;

const isString = (value: unknown): value is string => typeof value === "string";
const list = (value: unknown): JsonObject[] => (Array.isArray(value) ? value.filter(isObject) : []);
const counter = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 1;
const second = (date: Date) => date.toISOString().replace(/\.\d{3}Z$/, "Z");
/** An RFC 3339 date-time with any offset, as `common.schema.json#/$defs/timestamp` admits, or undefined. */
const when = (value: unknown): number | undefined => {
  const t = strictTime(value);
  return Number.isFinite(t) ? t : undefined;
};
/** Whether instant `t` lies in a key's window; an absent bound is open, an unreadable one closes the window (FAC-SEM-041). */
const inKeyWindow = (t: number, key: JsonObject): boolean => {
  const from = key.notBefore === undefined ? -Infinity : when(key.notBefore), to = key.notAfter === undefined ? Infinity : when(key.notAfter);
  return from !== undefined && to !== undefined && t >= from && t <= to;
};
const sameMembers = (value: JsonObject, required: readonly string[], optional: readonly string[] = []) => {
  const keys = Object.keys(value);
  return required.every((key) => keys.includes(key)) && keys.every((key) => required.includes(key) || optional.includes(key));
};

// ---- The envelope ----------------------------------------------------------------------------------------------

export interface CredentialHeader {
  type: typeof CREDENTIAL_ENVELOPE_TYPE;
  alg: string;
  suite: number[];
  recipient: string;
  signer: string; // the organization's policy keyId, or the sending machine's `#sig` kid
  context: string;
  agentRef: string;
  slot: string;
  provider: string;
  requestId?: string; // required in an organization's context: the request this answers
  credentialExpiresAt?: string; // required in an organization's context
  sequence: number;
  iat: string;
  exp: string;
  enc: string;
}
export interface CredentialEnvelope { header: CredentialHeader; ct: string; sig: string }

const HEADER_REQUIRED = ["type", "alg", "suite", "recipient", "signer", "context", "agentRef", "slot", "provider", "sequence", "iat", "exp", "enc"];
const HEADER_OPTIONAL = ["requestId", "credentialExpiresAt"];

/** Whether a value has exactly `credential-envelope.schema.json`'s shape, its instants real, its context's own members present. */
export function credentialEnvelopeShape(value: unknown): value is CredentialEnvelope {
  if (!isObject(value) || !sameMembers(value, ["header", "ct", "sig"]) || !isObject(value.header)) return false;
  const h = value.header;
  if (!sameMembers(h, HEADER_REQUIRED, HEADER_OPTIONAL)) return false;
  const org = isString(h.context) && ORG_CONTEXT.test(h.context);
  const personal = h.context === PERSONAL_CONTEXT;
  if (!org && !personal) return false;
  // An organization's credential answers a request and ends; the personal profile names neither.
  if (org !== (h.requestId !== undefined) || org !== (h.credentialExpiresAt !== undefined)) return false;
  return h.type === CREDENTIAL_ENVELOPE_TYPE && isString(h.alg) && [...h.alg].length <= 16 && JSON.stringify(h.suite) === JSON.stringify(ENVELOPE_SUITE)
    && isString(h.recipient) && KEM_KID.test(h.recipient) && isString(h.signer) && KEY_ID.test(h.signer.replace(/#sig$/, ""))
    && isString(h.agentRef) && h.agentRef.length <= 146 && AGENT_REF.test(h.agentRef) && isString(h.slot) && SLOT.test(h.slot)
    && isString(h.provider) && PROVIDER.test(h.provider) && (h.requestId === undefined || (isString(h.requestId) && UUID.test(h.requestId)))
    && (h.credentialExpiresAt === undefined || instant(h.credentialExpiresAt) !== undefined) && counter(h.sequence)
    && instant(h.iat) !== undefined && instant(h.exp) !== undefined && isString(h.enc) && B64URL.test(h.enc)
    && isString(value.ct) && B64URL.test(value.ct) && isString(value.sig) && SIG.test(value.sig);
}

const signingInput = (envelope: { header: unknown; ct: unknown }) => rfc8785({ header: envelope.header, ct: envelope.ct });

/** `sha256:` and the hex SHA-256 of the envelope's RFC 8785 bytes: the mark's digest. */
export function credentialEnvelopeDigest(envelope: unknown): string {
  return `sha256:${createHash("sha256").update(rfc8785(envelope), "utf8").digest("hex")}`;
}

export interface CredentialSealInput {
  recipientKid: string;
  recipientKey: P256Key;
  signer: { keyId: string; privateKey: KeyObject } | { kid: string; privateKey: KeyObject }; // org: Ed25519; personal: ES256
  context: string;
  agentRef: string;
  slot: string;
  provider: string;
  requestId?: string;
  credentialExpiresAt?: Date;
  sequence: number; // the sealer's next for (context, agentRef, slot); never one it used
  iat: Date;
  exp: Date;
  secret: Buffer;
  ephemeralPrivateKey?: Buffer; // vectors only
}

/** Seals a credential (DEC-0111). Throws on an input no target would open, so no sequence is spent on it. */
export function sealCredential(input: CredentialSealInput): CredentialEnvelope {
  const org = "keyId" in input.signer;
  // An organization signs with Ed25519, a machine with ES256 (P-256): the other key signs nothing a target opens.
  const key = input.signer.privateKey;
  if (key.type !== "private" || key.asymmetricKeyType !== (org ? "ed25519" : "ec") || (!org && key.asymmetricKeyDetails?.namedCurve !== "prime256v1")) throw new Error("bad-key: the signer's key is not of its profile");
  if (p256KeyRefusal(input.recipientKey) !== null) throw new Error("bad-key: the recipient key is not a valid P-256 key");
  const ephemeral = createECDH("prime256v1");
  if (input.ephemeralPrivateKey) ephemeral.setPrivateKey(input.ephemeralPrivateKey);
  else ephemeral.generateKeys();
  const header: CredentialHeader = {
    type: CREDENTIAL_ENVELOPE_TYPE, alg: org ? ORG_ALG : PERSONAL_ALG, suite: [...ENVELOPE_SUITE], recipient: input.recipientKid,
    signer: "keyId" in input.signer ? input.signer.keyId : input.signer.kid, context: input.context, agentRef: input.agentRef, slot: input.slot,
    provider: input.provider, ...(input.requestId !== undefined ? { requestId: input.requestId } : {}),
    ...(input.credentialExpiresAt !== undefined ? { credentialExpiresAt: second(input.credentialExpiresAt) } : {}),
    sequence: input.sequence, iat: second(input.iat), exp: second(input.exp), enc: ephemeral.getPublicKey(null, "uncompressed").toString("base64url")
  };
  if (!credentialEnvelopeShape({ header, ct: "AA", sig: "A".repeat(86) })) throw new Error("malformed: the envelope would not have the schema's shape");
  if (org !== (header.context !== PERSONAL_CONTEXT)) throw new Error("wrong-context: an organization's key signs into its context, a machine's into the personal one");
  // The signer names its kind: a policy keyId in an organization's context, a machine's #sig in the personal one.
  if (org ? header.signer.endsWith("#sig") : !SIG_KID.test(header.signer)) throw new Error("bad-key: the signer is no key of its profile");
  const life = (instant(header.exp) as number) - (instant(header.iat) as number);
  if (life <= 0 || life > MAX_ENVELOPE_LIFETIME_SECONDS * 1000) throw new Error("lifetime-too-long: an envelope lives more than zero and at most 24 hours");
  if (header.credentialExpiresAt !== undefined) {
    const iat = instant(header.iat) as number, until = instant(header.credentialExpiresAt) as number;
    if (until <= iat || until - iat > MAX_CREDENTIAL_DAYS * DAY_MS) throw new Error("credential-expired: a credential ends after iat and at most 30 days after it");
  }
  const { ct } = hpkeSealBase(p256Point(input.recipientKey), INFO, Buffer.from(rfc8785(header), "utf8"), input.secret, ephemeral.getPrivateKey());
  const unsigned = { header, ct: ct.toString("base64url") };
  const bytes = Buffer.from(signingInput(unsigned), "utf8");
  const sig = org ? nodeSign(null, bytes, input.signer.privateKey).toString("base64url") : signEs256(input.signer.privateKey, bytes);
  return { ...unsigned, sig };
}

/** Marks read when absent, or an array of objects each with a string context, agentRef, slot and digest and a sequence, one per triple. */
function marksRead(marks: unknown): boolean {
  if (marks === undefined) return true;
  if (!Array.isArray(marks)) return false;
  const seen = new Set<string>();
  for (const m of marks) {
    if (!isObject(m) || !isString(m.context) || !isString(m.agentRef) || !isString(m.slot) || !isString(m.digest) || !counter(m.sequence)) return false;
    const key = JSON.stringify([m.context, m.agentRef, m.slot]);
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
}

/** What a target knows when it checks a credential envelope; plain JSON, so a semantic fixture can carry it. */
export interface CredentialCheckContext {
  ownKemKid: string;
  at: string; // the target's clock, RFC 3339
  // An organization the machine is enrolled in: its id, its current verified policy key set's keys, and the requests
  // this machine holds open ({requestId, agentRef, slot, expiresAt}: the slot and the decision's `credential.expiresAt`, never the end the request asked for).
  org?: { id: string; keys: readonly JsonObject[]; requested: readonly JsonObject[] };
  // The personal context: the estate record the machine applied last, its own machine id and the delta's revocations.
  personal?: { applied: JsonObject; self: string; revocations?: readonly JsonObject[] };
  // The target's marks, one per (context, agentRef, slot): the sequence and digest of the last envelope it opened.
  marks?: readonly JsonObject[];
}

export interface CredentialMark { context: string; agentRef: string; slot: string; sequence: number; digest: string }
export type CredentialCheck = { ok: true; mark: CredentialMark } | { ok: false; refusal: CredentialRefusal };

/**
 * Every check of DEC-0111 short of opening the HPKE ciphertext, in order; the first that fails names the refusal. A
 * semantic fixture can carry its context, since no private key is read (FAC-SEM-139).
 */
export function checkCredentialEnvelope(value: unknown, ctx: CredentialCheckContext): CredentialCheck {
  const no = (refusal: CredentialRefusal): CredentialCheck => ({ ok: false, refusal });
  if (!credentialEnvelopeShape(value) || !isObject(ctx)) return no("malformed");
  const h = value.header;
  const org = h.context !== PERSONAL_CONTEXT;
  const at = when(ctx.at);
  // Marks that do not read fail closed: a target that cannot read its marks opens nothing.
  if (at === undefined || !marksRead(ctx.marks)) return no("malformed");
  if (h.alg !== (org ? ORG_ALG : PERSONAL_ALG)) return no("unsupported-alg");
  if (h.recipient !== ctx.ownKemKid) return no("wrong-recipient");
  if (org ? !isObject(ctx.org) || !isString(ctx.org.id) || h.context !== `${ORG_CONTEXT_PREFIX}${ctx.org.id}` : !isObject(ctx.personal) || !isObject(ctx.personal.applied)) return no("wrong-context");
  const enc = Buffer.from(h.enc, "base64url");
  if (p256KeyRefusal(enc) !== null) return no("bad-key");
  const bytes = signingInput(value);
  if (org) {
    const o = ctx.org as NonNullable<CredentialCheckContext["org"]>;
    // A key of the organization's current policy key set, inside its window on the target's own clock, never at the
    // `iat` the signer chose (as a policy and a repair are judged, devices.md F-B-106).
    const key = list(o.keys).find((candidate) => candidate.keyId === h.signer);
    if (key === undefined || (key.alg ?? "ed25519") !== "ed25519" || !inKeyWindow(at, key)) return no("bad-key");
    if (!verifyWith(key, Buffer.from(bytes, "utf8"), Buffer.from(value.sig, "base64url").toString("base64"))) return no("bad-signature");
    if (!list(o.requested).some((r) => r.requestId === h.requestId && r.agentRef === h.agentRef && r.slot === h.slot)) return no("not-requested");
  } else {
    const p = ctx.personal as NonNullable<CredentialCheckContext["personal"]>;
    // The sender is a machine of the estate record the target applied (an object, checked at wrong-context), not revoked
    // by it or by the delta (F7).
    const admission = relayAdmissionSet({ held: p.applied as JsonObject, pinned: [], at: new Date(at), schemaValid: () => false, extraRevocations: list(p.revocations) });
    const key = admission.ok && SIG_KID.test(h.signer) ? admission.set.get(h.signer) : undefined;
    if (key === undefined || !admission.ok) return no("bad-key");
    if (verifyEs256(key, bytes, value.sig) !== true) return no("bad-signature");
    // A `view` machine holds no secret and sends none (DEC-0106); a machine never sends to itself.
    const sender = h.signer.slice(0, -"#sig".length);
    const record = admission.held;
    if (sender === p.self || machineProfile(record, sender) !== "full" && machineProfile(record, sender) !== "member" || machineProfile(record, p.self) === "view" || machineProfile(record, p.self) === undefined) return no("sender-not-allowed");
    const machines = list(record.machines);
    // The estate's digest key comes only from a machine whose hub key the record certifies and neither the record nor the
    // delta revokes (`hub-key`), so one estate holds one key.
    if (h.agentRef === ESTATE_AGENT_REF && h.slot === ESTATE_DIGEST_SLOT) {
      const hub = machines.find((m) => m.id === sender)?.hubKey;
      const revoked = [...list(record.revocations), ...list(p.revocations)].some((r) => r.kind === "hub-key" && isObject(hub) && r.ref === hub.kid);
      if (!isObject(hub) || revoked) return no("sender-not-allowed");
    }
    // A slot a placed package declares in a personal secret placement on this machine is filled by the secret envelope
    // only (DEC-0047), never by this one; an organization's placement is its instance's, in another context.
    const self = machines.find((m) => m.id === p.self);
    if (list(self?.secrets).some((secret) => (secret.context === undefined || secret.context === PERSONAL_CONTEXT) && secret.agentRef === h.agentRef && secret.slot === h.slot)) return no("sender-not-allowed");
  }
  const digest = credentialEnvelopeDigest(value);
  const mark = list(ctx.marks).find((m) => m.context === h.context && m.agentRef === h.agentRef && m.slot === h.slot);
  if (mark !== undefined) {
    if (h.sequence < (mark.sequence as number)) return no("replayed");
    if (h.sequence === mark.sequence && mark.digest !== digest) return no("sequence-reused");
  }
  const iat = instant(h.iat) as number, exp = instant(h.exp) as number;
  if (iat - at > CLOCK_SKEW_SECONDS * 1000) return no("not-yet-valid");
  if (exp <= iat || exp - iat > MAX_ENVELOPE_LIFETIME_SECONDS * 1000) return no("lifetime-too-long");
  if (at >= exp) return no("expired");
  if (h.credentialExpiresAt !== undefined) {
    const until = instant(h.credentialExpiresAt) as number;
    // Never past the end the issued decision named: the request held open carries it (`expiresAt`).
    // An organization's envelope reached here only through a request held open (step 7), so `held` is that request.
    const held = list(ctx.org?.requested).find((r) => r.requestId === h.requestId && r.agentRef === h.agentRef && r.slot === h.slot) as JsonObject;
    // An end that is absent or does not read admits none.
    const issued = when(held.expiresAt) ?? -Infinity;
    if (until <= at || until - iat > MAX_CREDENTIAL_DAYS * DAY_MS || until > issued) return no("credential-expired");
  }
  return { ok: true, mark: { context: h.context, agentRef: h.agentRef, slot: h.slot, sequence: h.sequence, digest } };
}

/** Checks, then opens. The target writes the value and the mark in one transaction; nothing is stored after a refusal. */
export function openCredential(value: unknown, ctx: CredentialCheckContext, ownKemPrivateKey: Buffer): { ok: true; secret: Buffer; mark: CredentialMark } | { ok: false; refusal: CredentialRefusal } {
  const check = checkCredentialEnvelope(value, ctx);
  if (!check.ok) return check;
  const envelope = value as CredentialEnvelope;
  try {
    const secret = hpkeOpenBase(ownKemPrivateKey, Buffer.from(envelope.header.enc, "base64url"), INFO, Buffer.from(rfc8785(envelope.header), "utf8"), Buffer.from(envelope.ct, "base64url"));
    return { ok: true, secret, mark: check.mark };
  } catch {
    return { ok: false, refusal: "cannot-open" };
  }
}

// ---- Revocation --------------------------------------------------------------------------------------------------

/**
 * Whether a `credential-revocation/1` an organization sent this machine stands (`{revocation, keys, device, at}`): signed
 * like a policy layer by a key of the organization's current policy key set, inside the key's window on the device's
 * clock `at`, for this device and a context of this organization. A revocation that stands deletes the value and its mark; it never needs the value.
 */
export function credentialRevocationStands(input: unknown): { ok: true } | { ok: false; reason: "malformed" | "bad-signature" | "wrong-device" } {
  const value = isObject(input) ? input : {};
  const revocation = isObject(value.revocation) ? value.revocation : undefined;
  if (!revocation || revocation.type !== CREDENTIAL_REVOCATION_TYPE || !isObject(revocation.signature)) return { ok: false, reason: "malformed" };
  const signature = revocation.signature;
  // The key's window is judged on the device's own clock (`at`), never at the `revokedAt` the signer chose.
  const at = when(value.at);
  const key = list(value.keys).find((candidate) => candidate.keyId === signature.keyId && (candidate.alg ?? "ed25519") === signature.alg);
  let signed: Buffer | undefined;
  try {
    signed = policySigningInput(revocation);
  } catch {
    signed = undefined;
  }
  if (key === undefined || signed === undefined || at === undefined || !inKeyWindow(at, key) || !verifyWith(key, signed, signature.value)) return { ok: false, reason: "bad-signature" };
  const device = isObject(value.device) ? value.device : {};
  const ownDevice = isObject(revocation.device) && revocation.device.id === device.id;
  const ownOrg = isObject(revocation.org) && revocation.org.id === device.org && revocation.context === `${ORG_CONTEXT_PREFIX}${show(device.org)}`;
  if (!ownDevice || !ownOrg) return { ok: false, reason: "wrong-device" };
  return { ok: true };
}

// ---- The estate's digest key --------------------------------------------------------------------------------------

const DIGEST_LABEL = Buffer.concat([Buffer.from("fabric-keyed-digest/1", "ascii"), Buffer.from([0])]);

/** The id of an estate digest key: `ekd-` and the first 16 hex of its SHA-256; it names the key, never reveals it. */
export function estateDigestKeyId(key: Buffer): string {
  return `ekd-${createHash("sha256").update(key).digest("hex").slice(0, 16)}`;
}

/**
 * A keyed digest of a value under the estate's digest key (DEC-0111): `kd1:<keyId>:<hex HMAC-SHA256>` over the label
 * `fabric-keyed-digest/1`, a zero byte and the value. Two machines that hold the key compare two values (a credential
 * shared by two slots) without either value leaving its vault; digests under two keys never compare equal. The key is
 * 32 random bytes; anything shorter is refused.
 */
export function keyedDigest(key: Buffer, value: string | Buffer): string | undefined {
  if (!Buffer.isBuffer(key) || key.length !== 32) return undefined;
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(String(value), "utf8");
  return `kd1:${estateDigestKeyId(key)}:${createHmac("sha256", key).update(DIGEST_LABEL).update(bytes).digest("hex")}`;
}

// ---- Rules: FAC-SEM-138 (request and decision), FAC-SEM-139 (envelope), FAC-SEM-140 (call record) ---------------

const flag = (code: string, instancePath: string, message: string): Finding => ({ code, instancePath, message });
// A path anywhere, or a word shaped like a credential (the shapes are anchored, so each word is tried).
const leaks = (value: string) => hasHomePath(value) || value.split(/\s+/).some((word) => word.length > 0 && looksLikeCredential(word));

/** FAC-SEM-138 on a request alone: its window, and a reason and scope that carry no path and no credential. */
function requestFindings(request: JsonObject, prefix: string): Finding[] {
  const findings: Finding[] = [];
  const from = when(request.requestedAt), to = when(request.expiresAt);
  if (from === undefined || to === undefined || !(from < to && to - from <= MAX_CREDENTIAL_DAYS * DAY_MS)) {
    findings.push(flag("FAC-SEM-138", `${prefix}/expiresAt`, `a credential is asked for after its request and for at most ${MAX_CREDENTIAL_DAYS} days`));
  }
  if (isString(request.reason) && leaks(request.reason)) findings.push(flag("FAC-SEM-138", `${prefix}/reason`, "a request's reason carries no path and no credential"));
  const scope = isObject(request.scope) ? request.scope : {};
  for (const [name, entry] of Object.entries(scope)) {
    if (isString(entry) && leaks(entry)) findings.push(flag("FAC-SEM-138", `${prefix}/scope/${name}`, "a request's scope carries no path and no credential"));
  }
  return findings;
}

/** FAC-SEM-138 on `{request, org}`: the request's context is the enrollment's own organization, and its own rules. */
function requestRule(value: JsonObject): Finding[] {
  const request = isObject(value.request) ? value.request : {};
  const findings = requestFindings(request, "/request");
  if (request.context !== `${ORG_CONTEXT_PREFIX}${show(value.org)}`) findings.push(flag("FAC-SEM-138", "/request/context", "a request names its own enrollment's organization context, org:<org.id>"));
  return findings;
}

/**
 * FAC-SEM-138 on `{request, decision}`: the decision answers that request; `issued` names the credential it issued (its
 * slot, provider and an end no later than the request asked) and no reason; `refused` names a reason and no
 * credential; `pending` names neither.
 */
function decisionRule(value: JsonObject): Finding[] {
  const request = isObject(value.request) ? value.request : {};
  const decision = isObject(value.decision) ? value.decision : {};
  const findings: Finding[] = [];
  if (decision.requestId !== request.requestId) findings.push(flag("FAC-SEM-138", "/decision/requestId", "a decision answers the request it names"));
  const credential = isObject(decision.credential) ? decision.credential : undefined;
  if (decision.outcome === "issued") {
    if (!credential || decision.reason !== undefined) findings.push(flag("FAC-SEM-138", "/decision", "an issued decision names its credential and no reason"));
    else {
      const until = when(credential.expiresAt), asked = when(request.expiresAt);
      if (until === undefined || asked === undefined || until > asked) findings.push(flag("FAC-SEM-138", "/decision/credential/expiresAt", "an issued credential ends no later than the request asked"));
      if (credential.provider !== request.provider) findings.push(flag("FAC-SEM-138", "/decision/credential/provider", "an issued credential is the provider's the request named"));
    }
  } else if (decision.outcome === "refused") {
    if (credential || decision.reason === undefined) findings.push(flag("FAC-SEM-138", "/decision", "a refusal names its reason and no credential"));
  } else if (credential || decision.reason !== undefined) findings.push(flag("FAC-SEM-138", "/decision", "a pending decision names neither a credential nor a reason"));
  return findings;
}

/** FAC-SEM-139 on `{envelope, context, answer}`: the target's answer is `checkCredentialEnvelope`'s. */
function envelopeRule(value: JsonObject): Finding[] {
  const want = checkCredentialEnvelope(value.envelope, (isObject(value.context) ? value.context : {}) as unknown as CredentialCheckContext);
  const answer = isObject(value.answer) ? value.answer : {};
  const same = want.ok ? answer.ok === true : answer.ok === false && answer.refusal === want.refusal;
  return same ? [] : [flag("FAC-SEM-139", "/answer", want.ok ? "every check passes: the target opens this envelope" : `the target refuses this envelope: ${want.refusal}`)];
}

const TRACE_ID = /^[0-9a-f]{32}$/;

/**
 * FAC-SEM-140 on a `call-record/1`: it ends no earlier than it starts; a call that completed names no code and every
 * other outcome names one; its trace id is not all zeros (W3C Trace Context); caller and callee differ; and no member
 * carries a path or a credential (DL-22: the record names agents, never a person, an argument or an output).
 */
export function callRecordFindings(record: unknown, prefix = ""): Finding[] {
  if (!isObject(record)) return [];
  const findings: Finding[] = [];
  const start = when(record.startedAt), end = when(record.endedAt);
  if (start === undefined || end === undefined || end < start) findings.push(flag("FAC-SEM-140", `${prefix}/endedAt`, "a call ends no earlier than it starts"));
  if ((record.outcome === "completed") !== (record.code === undefined)) findings.push(flag("FAC-SEM-140", `${prefix}/code`, "a completed call names no code; every other outcome names one"));
  if (!isString(record.traceId) || !TRACE_ID.test(record.traceId) || /^0+$/.test(record.traceId)) findings.push(flag("FAC-SEM-140", `${prefix}/traceId`, "a trace id is 32 lower-case hex digits, not all zero"));
  if (record.caller === record.callee) findings.push(flag("FAC-SEM-140", `${prefix}/callee`, "a call record is between two agents"));
  for (const field of ["capability", "code"]) {
    const text = record[field];
    if (isString(text) && leaks(text)) findings.push(flag("FAC-SEM-140", `${prefix}/${field}`, "a call record carries no path and no credential"));
  }
  return findings;
}

/**
 * DEC-0112 on a bare check-in or check-in response (kind `device-check-in`, beside FAC-SEM-099): a check-in's
 * `credentialRequests` each pass FAC-SEM-138's own rules, name one `requestId` once and one organization's context, the
 * one its `callRecords` name; its `callRecords` each pass FAC-SEM-140 and name one `callId` once. A response's
 * `credentialDecisions` name one `requestId` once, and an envelope in its `credentials` never names a request that the
 * same response refuses or leaves pending. Never throws on a JSON value.
 */
export function checkInCredentialFindings(value: JsonObject): Finding[] {
  const records = isObject(value.records) ? value.records : {};
  const findings: Finding[] = [];
  const contexts = new Set<string>();
  const once = (entries: JsonObject[], key: string, code: string, at: string, message: string) => {
    const seen = new Set<string>();
    entries.forEach((entry, index) => {
      const id = entry[key];
      if (!isString(id)) return;
      if (seen.has(id)) findings.push(flag(code, `${at}/${index}/${key}`, message));
      seen.add(id);
    });
  };
  const requests = indexed(records.credentialRequests);
  requests.forEach(([request, index]) => {
    findings.push(...requestFindings(request, `/records/credentialRequests/${index}`));
    if (isString(request.context)) contexts.add(request.context);
  });
  once(requests.map(([r]) => r), "requestId", "FAC-SEM-138", "/records/credentialRequests", "a check-in sends each request once");
  const calls = indexed(records.callRecords);
  calls.forEach(([record, index]) => {
    findings.push(...callRecordFindings(record, `/records/callRecords/${index}`));
    // A call record goes to an organization only for that organization's own context (DL-22, never a personal call).
    if (!isString(record.context) || !record.context.startsWith(ORG_CONTEXT_PREFIX)) findings.push(flag("FAC-SEM-140", `/records/callRecords/${index}/context`, "a check-in carries call records of an organization's context only"));
    else contexts.add(record.context);
  });
  once(calls.map(([r]) => r), "callId", "FAC-SEM-140", "/records/callRecords", "a check-in sends each call record once");
  if (contexts.size > 1) findings.push(flag(requests.length > 0 ? "FAC-SEM-138" : "FAC-SEM-140", "/records", "a check-in goes to one organization: its requests and call records name one context"));
  const decisions = indexed(records.credentialDecisions);
  once(decisions.map(([d]) => d), "requestId", "FAC-SEM-138", "/records/credentialDecisions", "a response decides each request once");
  const unissued = new Set(decisions.filter(([d]) => d.outcome !== "issued").map(([d]) => d.requestId));
  indexed(records.credentials).forEach(([envelope, index]) => {
    const header = isObject(envelope.header) ? envelope.header : {};
    if (isString(header.requestId) && unissued.has(header.requestId)) findings.push(flag("FAC-SEM-138", `/records/credentials/${index}/header/requestId`, "an envelope answers an issued decision, never one its response refuses or leaves pending"));
  });
  return findings;
}

/**
 * DEC-0112, kind `credential-exchange` on `{sent, response}`: `sent` the requests a node sent to one organization and
 * holds open, `response` that organization's check-in response. Every decision answers a request the node sent and
 * passes FAC-SEM-138 against it; every envelope names a request the node sent.
 */
function exchangeRule(value: JsonObject): Finding[] {
  const sent = indexed(value.sent).map(([request]) => request);
  const byId = new Map<string, JsonObject>();
  for (const request of sent) if (isString(request.requestId) && !byId.has(request.requestId)) byId.set(request.requestId, request);
  const response = isObject(value.response) ? value.response : {};
  const records = isObject(response.records) ? response.records : {};
  const findings: Finding[] = [];
  indexed(records.credentialDecisions).forEach(([decision, index]) => {
    const at = `/response/records/credentialDecisions/${index}`;
    const request = isString(decision.requestId) ? byId.get(decision.requestId) : undefined;
    if (request === undefined) { findings.push(flag("FAC-SEM-138", `${at}/requestId`, "a decision answers a request the node sent")); return; }
    for (const finding of decisionRule({ request, decision })) findings.push({ ...finding, instancePath: finding.instancePath.replace(/^\/decision/, at) });
  });
  indexed(records.credentials).forEach(([envelope, index]) => {
    const header = isObject(envelope.header) ? envelope.header : {};
    if (!isString(header.requestId) || !byId.has(header.requestId)) findings.push(flag("FAC-SEM-138", `/response/records/credentials/${index}/header/requestId`, "an envelope names a request the node sent"));
  });
  return findings;
}

/** The object entries of an array member with their indices; anything else is none. */
const indexed = (value: unknown): Array<[JsonObject, number]> =>
  Array.isArray(value) ? value.flatMap((entry, index): Array<[JsonObject, number]> => (isObject(entry) ? [[entry, index]] : [])) : [];

export function credentialRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (kind === "credential-exchange") return exchangeRule(value);
  if (kind === "credential-request") return requestRule(value);
  if (kind === "credential-request-document") return requestFindings(value, "");
  if (kind === "credential-decision") return decisionRule(value);
  if (kind === "credential-envelope-check") return envelopeRule(value);
  if (kind === "call-record") return callRecordFindings(value);
  return undefined;
}

// #endregion credentials
