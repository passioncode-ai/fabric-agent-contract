import { rfc8785 } from "./canonical.js";
import { MACHINE_PROFILES, deviceKeyRef, machineProfile, type MachineProfile } from "./estate-record-rules.js";
import { type Finding, type JsonObject, isObject, jsonEqual, show } from "./findings.js";
import { p256KeyRefusal } from "./p256.js";
import { relayAdmissionSet } from "./relay.js";
import { strictTime } from "./rfc3339.js";
import { hpkeOpenBase, hpkeSealBase } from "./secret-envelope.js";

// #region machine-call — docs: docs/specification/machine-calls.md
// DEC-0106 (CT-85, S1 of the agent network): a call between machines of one estate over the relay. The node that
// receives it places the sender in T1 by the estate record it applied (`relayCallerTier`), opens the sealed call
// (`openAgentCall`) and judges the two machines' profiles (`machineCallVerdict`) before it reads any token.

type Json = JsonObject;
const isString = (value: unknown): value is string => typeof value === "string";
const list = (value: unknown): Json[] => (Array.isArray(value) ? value.filter(isObject) : []);

/** The protocol of a sealed call or answer, and its HPKE `info` (DEC-0106). */
export const AGENT_CALL_TYPE = "fabric-agent-call/1";
/** The largest plaintext a sealed call carries: base64 twice and the JWS still fit a relay body (783 360 bytes). */
export const MAX_AGENT_CALL_BYTES = 393_216;
/** DL-19's code for a call outside the caller's or the target's machine profile (DEC-0106). */
export const PROFILE_FORBIDS = "profile-forbids";
/** The job tools: each acts only on the caller's own jobs, so every profile admits them. */
export const JOB_TOOLS: readonly string[] = ["fabric.job.get", "fabric.job.cancel", "fabric.job.list"];
export const AGENT_CALL_REFUSALS = ["malformed", "wrong-recipient", "cannot-open"] as const;
export const SEAL_REFUSALS = ["malformed", "bad-key", "too-large"] as const;
export type AgentCallRefusal = (typeof AGENT_CALL_REFUSALS)[number];
export type SealRefusal = (typeof SEAL_REFUSALS)[number];

/** Standard base64 that decodes and encodes back to the same text: no foreign character Node would drop. */
const canonicalBase64 = (value: unknown): value is string => isString(value) && value.length > 0 && Buffer.from(value, "base64").toString("base64") === value;

const isProfile = (value: unknown): value is MachineProfile => isString(value) && (MACHINE_PROFILES as readonly string[]).includes(value);

// --- The T1 binding over the relay ---

export type RelayCaller =
  | { ok: true; tier: "T1"; machine: string; profile: MachineProfile | null; kem?: string }
  | { ok: false; code: "unknown-state"; detail: "not-current" | "no-clock" | "no-estate" | "self-not-admitted" }
  | { ok: false; code: "unauthenticated"; detail: "not-t1" };

/**
 * Where a node places the sender of a relay message whose body `verifyMessageBody` accepted and `checkReplay` passed
 * (DEC-0106): T1 only when its delta is `current`, its clock reads, the estate revision it applied last gives an
 * admission set (`relayAdmissionSet`, with the revocations in force) that holds the node's own `<machine>#sig` and holds
 * `from`. It names the sender's machine, its profile (`null` when unreadable) and its `#kem` when that key is listed,
 * is a P-256 key and is revoked neither by kid nor by key reference. It never throws on JSON values.
 */
export function relayCallerTier(input: { applied: unknown; self: unknown; from: unknown; at: unknown; freshness: unknown; revocations?: unknown }): RelayCaller {
  if (input.freshness !== "current") return { ok: false, code: "unknown-state", detail: "not-current" };
  const t = isString(input.at) ? strictTime(input.at) : Number.NaN;
  if (!Number.isFinite(t)) return { ok: false, code: "unknown-state", detail: "no-clock" };
  const extra = list(input.revocations);
  const admission = relayAdmissionSet({ ...(isObject(input.applied) ? { held: input.applied } : {}), pinned: [], at: new Date(t), schemaValid: () => false, extraRevocations: extra });
  if (!admission.ok) return { ok: false, code: "unknown-state", detail: "no-estate" };
  if (!isString(input.self) || !admission.set.has(`${input.self}#sig`)) return { ok: false, code: "unknown-state", detail: "self-not-admitted" };
  if (!isString(input.from) || !admission.set.has(input.from)) return { ok: false, code: "unauthenticated", detail: "not-t1" };
  const machine = input.from.slice(0, -"#sig".length);
  const record = admission.held;
  const revoked = new Set([...list(record.revocations), ...extra].filter((entry) => entry.kind === "device-key").map((entry) => entry.ref));
  // A kid listed twice anywhere in the record names no key a sealer could resolve again unambiguously, so it names none,
  // and the one entry must sit under the sender's own machine (both, as the #sig path, F7, relay.ts; CT-112).
  const kemKeys = list(record.machines).flatMap((entry) => list(entry.deviceKeys).filter((key) => key.kid === `${machine}#kem`).map((key) => ({ owner: entry.id, key })));
  const kemKey = kemKeys.length === 1 && kemKeys[0]?.owner === machine && kemKeys[0].key.use === "kem" ? kemKeys[0].key : undefined;
  let kem: string | undefined;
  if (kemKey && canonicalBase64(kemKey.publicKey)) {
    const octets = new Uint8Array(Buffer.from(kemKey.publicKey as string, "base64"));
    // A valid point has a fingerprint, so its key reference is defined here.
    const usable = octets.length === 65 && p256KeyRefusal(octets) === null;
    if (usable && !revoked.has(kemKey.kid) && !revoked.has(String(deviceKeyRef(kemKey)))) kem = kemKey.kid as string;
  }
  return { ok: true, tier: "T1", machine, profile: machineProfile(record, machine) ?? null, ...(kem ? { kem } : {}) };
}

/** The credential a node that queues keys a tokenless relay call by (`jobCallerKey`, DEC-0104): `relay:<from>`. */
export function relayCallerCredential(from: unknown): string | undefined {
  return isString(from) && from.endsWith("#sig") && from.length > 4 ? `relay:${from}` : undefined;
}

// --- The call rule ---

export type MachineCallVerdict = { ok: true } | { ok: false; code: typeof PROFILE_FORBIDS; detail: "profile-unreadable" | "target-view" | "caller-view" };

/**
 * A call's verdict between two machines of one estate (DEC-0106): an unreadable profile is refused; the job tools pass
 * in every profile; a call whose effect is not `none` (an unknown or missing effect counts as above it) to a `view`
 * machine, then from one, is refused `profile-forbids`; every other call is admitted, a T1 call that needs no token.
 * It never throws.
 */
export function machineCallVerdict(input: { caller: unknown; target: unknown; capability: unknown; effect: unknown }): MachineCallVerdict {
  if (!isProfile(input.caller) || !isProfile(input.target)) return { ok: false, code: PROFILE_FORBIDS, detail: "profile-unreadable" };
  if (isString(input.capability) && JOB_TOOLS.includes(input.capability)) return { ok: true };
  const reads = input.effect === "none";
  if (input.target === "view" && !reads) return { ok: false, code: PROFILE_FORBIDS, detail: "target-view" };
  if (input.caller === "view" && !reads) return { ok: false, code: PROFILE_FORBIDS, detail: "caller-view" };
  return { ok: true };
}

// --- The sealed message ---

export interface SealedAgentCall { type: typeof AGENT_CALL_TYPE; kind: "call" | "answer"; kem: string; enc: string; ct: string }
interface Fields { kind: unknown; from: unknown; to: unknown; msgId: unknown; kem: unknown }

/** The AEAD's additional data: the RFC 8785 bytes of `{type, kind, from, to, msgId, kem}` (DEC-0106). */
export function agentCallAad(fields: Fields): Buffer {
  return Buffer.from(rfc8785({ type: AGENT_CALL_TYPE, kind: fields.kind, from: fields.from, to: fields.to, msgId: fields.msgId, kem: fields.kem }), "utf8");
}

const KINDS = ["call", "answer"];
const KEM_KID = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,127}#kem$/;
const B64URL = /^[A-Za-z0-9_-]+$/;
const INFO = Buffer.from(AGENT_CALL_TYPE, "ascii");

/**
 * Seals a call or an answer to the recipient's `#kem` (DEC-0106): HPKE base mode, suite [16, 1, 1], `info` the protocol
 * name, the additional data `agentCallAad`. `ephemeral` fixes the ephemeral scalar for vectors only. It never throws.
 */
export function sealAgentCall(message: unknown, ctx: { from: unknown; to: unknown; msgId: unknown; recipient: { kid: unknown; publicKey: unknown }; ephemeral?: Buffer }): { ok: true; sealed: SealedAgentCall } | { ok: false; refusal: SealRefusal } {
  if (!isObject(message) || message.type !== AGENT_CALL_TYPE || !KINDS.includes(message.kind as string)) return { ok: false, refusal: "malformed" };
  if (!isString(ctx.from) || !isString(ctx.to) || !isString(ctx.msgId)) return { ok: false, refusal: "malformed" };
  const kid = ctx.recipient?.kid;
  const key = canonicalBase64(ctx.recipient?.publicKey) ? Buffer.from(ctx.recipient.publicKey as string, "base64") : Buffer.alloc(0);
  if (!isString(kid) || !KEM_KID.test(kid) || key.length !== 65 || p256KeyRefusal(new Uint8Array(key)) !== null) return { ok: false, refusal: "bad-key" };
  let plaintext: Buffer;
  try {
    plaintext = Buffer.from(rfc8785(message), "utf8");
  } catch {
    return { ok: false, refusal: "malformed" };
  }
  if (plaintext.length > MAX_AGENT_CALL_BYTES) return { ok: false, refusal: "too-large" };
  const kind = message.kind as "call" | "answer";
  let aad: Buffer;
  try {
    aad = agentCallAad({ kind, from: ctx.from, to: ctx.to, msgId: ctx.msgId, kem: kid });
  } catch {
    // A string with a lone surrogate has no RFC 8785 form.
    return { ok: false, refusal: "malformed" };
  }
  try {
    const { enc, ct } = hpkeSealBase(key, INFO, aad, plaintext, ctx.ephemeral);
    return { ok: true, sealed: { type: AGENT_CALL_TYPE, kind, kem: kid, enc: enc.toString("base64url"), ct: ct.toString("base64url") } };
  } catch {
    return { ok: false, refusal: "bad-key" };
  }
}

/**
 * Opens a sealed call or answer addressed to this node (DEC-0106), in order: `malformed` for a shape that is not the
 * schema's, an `enc` that is no valid uncompressed point or a `ct` that is not canonical base64url within the limit;
 * `wrong-recipient` for another `kem`; `cannot-open` when HPKE fails (another body's `from`, `to` or `msgId` among
 * them); `malformed` for a plaintext that is not UTF-8 JSON in its own RFC 8785 form, whose `type` or `kind` differs
 * from the sealed one's, or that `schemaValid` refuses. It never throws.
 */
export function openAgentCall(sealed: unknown, ctx: { from: unknown; to: unknown; msgId: unknown; own: { kid: unknown; privateKey: unknown }; schemaValid: (message: unknown) => boolean }): { ok: true; message: Json } | { ok: false; refusal: AgentCallRefusal } {
  if (!isObject(sealed)) return { ok: false, refusal: "malformed" };
  const members = Object.keys(sealed).sort().join(",");
  if (members !== "ct,enc,kem,kind,type" || sealed.type !== AGENT_CALL_TYPE || !KINDS.includes(sealed.kind as string) || !isString(sealed.kem) || !KEM_KID.test(sealed.kem)) return { ok: false, refusal: "malformed" };
  if (!isString(sealed.enc) || !isString(sealed.ct) || !B64URL.test(sealed.enc) || !B64URL.test(sealed.ct)) return { ok: false, refusal: "malformed" };
  const enc = Buffer.from(sealed.enc, "base64url");
  const ct = Buffer.from(sealed.ct, "base64url");
  if (enc.toString("base64url") !== sealed.enc || ct.toString("base64url") !== sealed.ct) return { ok: false, refusal: "malformed" };
  if (enc.length !== 65 || p256KeyRefusal(new Uint8Array(enc)) !== null || ct.length < 16 || ct.length > MAX_AGENT_CALL_BYTES + 16) return { ok: false, refusal: "malformed" };
  if (sealed.kem !== ctx.own?.kid) return { ok: false, refusal: "wrong-recipient" };
  let plaintext: Buffer;
  try {
    const sk = canonicalBase64(ctx.own.privateKey) ? Buffer.from(ctx.own.privateKey, "base64") : Buffer.alloc(0);
    plaintext = hpkeOpenBase(sk, enc, INFO, agentCallAad({ kind: sealed.kind, from: ctx.from, to: ctx.to, msgId: ctx.msgId, kem: sealed.kem }), ct);
  } catch {
    return { ok: false, refusal: "cannot-open" };
  }
  let message: unknown;
  try {
    // The bytes are compared, not the decoded text: a decoder drops a leading byte-order mark by default.
    message = JSON.parse(new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(plaintext));
    if (!Buffer.from(rfc8785(message), "utf8").equals(plaintext)) return { ok: false, refusal: "malformed" };
  } catch {
    return { ok: false, refusal: "malformed" };
  }
  if (!isObject(message) || message.type !== AGENT_CALL_TYPE || message.kind !== sealed.kind) return { ok: false, refusal: "malformed" };
  let valid = false;
  try {
    valid = ctx.schemaValid(message) === true;
  } catch {
    valid = false;
  }
  return valid ? { ok: true, message } : { ok: false, refusal: "malformed" };
}

// --- Semantic rules ---

/** FAC-SEM-135 on `{applied, self, from, at, freshness, revocations?, answer}`; FAC-SEM-136 on `{caller, target, capability, effect, answer}`. */
export function machineCallRules(kind: string, value: Json): Finding[] | undefined {
  if (kind === "relay-caller") {
    const want = relayCallerTier({ applied: value.applied, self: value.self, from: value.from, at: value.at, freshness: value.freshness, revocations: value.revocations });
    return jsonEqual(value.answer, want) ? [] : [{ code: "FAC-SEM-135", instancePath: "/answer", message: `the node places the sender as ${JSON.stringify(want)}, as relayCallerTier does` }];
  }
  if (kind === "machine-call") {
    const want = machineCallVerdict({ caller: value.caller, target: value.target, capability: value.capability, effect: value.effect });
    return jsonEqual(value.answer, want) ? [] : [{ code: "FAC-SEM-136", instancePath: "/answer", message: `the call's verdict is ${JSON.stringify(want)}, as machineCallVerdict gives it (${show(value.caller)} to ${show(value.target)})` }];
  }
  return undefined;
}
// #endregion machine-call
