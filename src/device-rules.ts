import { createPublicKey, verify } from "node:crypto";
import { isSmallOrderKey } from "./ed25519.js";
import { isValidP256Key, p256Jwk } from "./p256.js";
import { type Finding, type JsonObject, isObject, jsonEqual } from "./findings.js";
import { type StreamState, asStreams, mergeStreams } from "./activity-rules.js";
import { rfc8785, settingsCanonicalJson } from "./canonical.js";
import { uncovered } from "./seq-ranges.js";
import { embeddedProtocolsFindings } from "./protocol-revisions.js";

// #region device-rules — docs: docs/specification/devices.md#semantic-rules
/**
 * Device enrollment, signed policy and check-in (`fabric-device/0.1`; DEC-0031). A schema checks one
 * document; these rules check what only a pair or a set of documents shows: a policy revision that
 * goes back or carries a signature no trusted key made, an effective setting a lower layer took from a
 * locked one, a health state that hides evidence of tampering, a certificate that is not bound to what
 * was enrolled, and a body that names another device or user than its client certificate.
 */

/** Precedence of policy layers, highest first. */
export const POLICY_PRECEDENCE = ["mdm", "server", "user"] as const;
type Source = (typeof POLICY_PRECEDENCE)[number];

/** The bytes a policy signature covers: the canonical JSON of the document without `signature`. */
export function policySigningInput(policy: JsonObject): Buffer {
  const { signature: _signature, ...signed } = policy;
  return Buffer.from(settingsCanonicalJson(signed), "utf8");
}

/** DER prefix of an Ed25519 SubjectPublicKeyInfo (RFC 8410); the raw 32-byte key follows it. */
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

/** Whether `policy.signature` verifies under the raw Ed25519 public key `publicKeyBase64`. */
export function verifyPolicySignature(policy: JsonObject, publicKeyBase64: string): boolean {
  const signature = isObject(policy.signature) ? policy.signature : {};
  if (signature.alg !== "ed25519" || typeof signature.value !== "string") return false;
  const raw = Buffer.from(publicKeyBase64, "base64");
  // CT-29 (DEC-0045): a small-order key verifies forged signatures on Node 20 and 22; never verify under one.
  if (isSmallOrderKey(raw)) return false;
  try {
    const key = createPublicKey({ key: Buffer.concat([ED25519_SPKI_PREFIX, raw]), format: "der", type: "spki" });
    return verify(null, policySigningInput(policy), key, Buffer.from(signature.value, "base64"));
  } catch {
    return false;
  }
}

export interface EffectiveSetting { value: unknown; from: Source | "default" }

/**
 * What a key resolves to when no layer sets it (DEC-0053): an organization's device runs only the official build,
 * the organization manages only its own work (`machine.mode` C), and a person's key serves nobody else.
 */
export const POLICY_DEFAULTS: Readonly<Record<string, unknown>> = {
  "build_channel.allowed": "official",
  "machine.mode": "C",
  "models.personal_key_sharing": "forbidden"
};

/**
 * The effective value of every key across policy layers (DEC-0031): a key locked by any layer takes the
 * value of the highest layer that locks it; otherwise the user's own value; otherwise the highest layer
 * that sets it. Unlocked values above the user layer are defaults; a locked one is never overridden by a
 * lower layer. A key no layer sets takes its `POLICY_DEFAULTS` value, and `machine.mode` A counts only from
 * an mdm layer — a server or user layer cannot hand the whole machine to the organization (DEC-0053).
 */
export function resolvePolicy(layers: readonly JsonObject[]): Record<string, EffectiveSetting> {
  const ordered = POLICY_PRECEDENCE.map((source) => layers.find((layer) => layer.source === source)).filter((layer): layer is JsonObject => layer !== undefined);
  const keysOf = (layer: JsonObject): JsonObject => {
    const keys = isObject(layer.keys) ? layer.keys : {};
    const mode = keys["machine.mode"];
    if (layer.source === "mdm" || !isObject(mode) || mode.value !== "A") return keys;
    const { "machine.mode": _ignored, ...rest } = keys;
    return rest;
  };
  const names = new Set(ordered.flatMap((layer) => Object.keys(keysOf(layer))));
  const effective: Record<string, EffectiveSetting> = {};
  for (const name of names) {
    const setting = (layer: JsonObject) => keysOf(layer)[name];
    const locker = ordered.find((layer) => layer.source !== "user" && isObject(setting(layer)) && (setting(layer) as JsonObject).locked === true);
    const user = ordered.find((layer) => layer.source === "user" && isObject(setting(layer)));
    const top = ordered.find((layer) => isObject(setting(layer)));
    const winner = locker ?? user ?? top;
    if (winner) effective[name] = { value: (setting(winner) as JsonObject).value, from: winner.source as Source };
  }
  for (const [name, value] of Object.entries(POLICY_DEFAULTS)) if (!(name in effective)) effective[name] = { value, from: "default" };
  return effective;
}

/** The earliest `expiresAt` of the delivered layers, or NaN when none expires. */
export function policyExpiry(layers: readonly JsonObject[]): number {
  const times = layers.filter((layer) => layer.source !== "user" && typeof layer.expiresAt === "string").map((layer) => Date.parse(String(layer.expiresAt)));
  return times.length ? Math.min(...times) : Number.NaN;
}

/**
 * When a device starts collecting for the organization (DEC-0053, the operator's N9): the person's acknowledgement of the
 * notice, or — under device management — the earlier of that and the mdm layer's `noticeDeadline`. NaN when neither is
 * known: nothing is collected. Events that occurred before it stay on the device, even after it passes.
 */
export function collectionStart(layers: readonly JsonObject[], acknowledgedAt?: string): number {
  const mdm = layers.find((layer) => layer.source === "mdm");
  const times = [acknowledgedAt, mdm?.noticeDeadline].filter((t): t is string => typeof t === "string").map(Date.parse).filter((t) => !Number.isNaN(t));
  return times.length ? Math.min(...times) : Number.NaN;
}

/**
 * FAC-SEM-041: `{current?, next, trustedKeys, rootKeyId?, at}` — a delivered policy verifies and moves its layer forward.
 * `trustedKeys` are the keys of the device's current key set with their validity windows (FAC-SEM-046); `at` is the
 * device's clock when it verifies. A key is judged valid at `at`, never at the `issuedAt` the signer chose, and a policy
 * is issued no earlier than the one the device holds (F-B-106, DEC-0053): otherwise a leaked key past its `notAfter`, still
 * in the set, signs a backdated policy with a higher revision.
 */
function policyUpdate(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-041", instancePath, message });
  const next = isObject(value.next) ? value.next : {};
  const current = isObject(value.current) ? value.current : null;
  const keys = Array.isArray(value.trustedKeys) ? value.trustedKeys.filter(isObject) : [];
  const at = Date.parse(String(value.at ?? ""));
  if (next.source === "user") flag("/next/source", "a user layer is set on the device; it is never delivered as an update");
  const signature = isObject(next.signature) ? next.signature : null;
  if (signature) {
    const key = keys.find((k) => k.keyId === signature.keyId);
    if (signature.keyId === value.rootKeyId) flag("/next/signature/keyId", "the root key signs key sets only, never a policy");
    else if (!key || typeof key.publicKey !== "string") flag("/next/signature/keyId", `no trusted key ${String(signature.keyId)}`);
    else if (Number.isNaN(at)) flag("/at", "a key's validity is judged when the device verifies; the input names that time");
    else if ((typeof key.notBefore === "string" && at < Date.parse(key.notBefore)) || (typeof key.notAfter === "string" && at > Date.parse(key.notAfter))) flag("/next/signature/keyId", `key ${String(signature.keyId)} is outside its validity window when the device verifies`);
    else if (!verifyPolicySignature(next, key.publicKey)) flag("/next/signature/value", "the signature does not verify: the policy was changed after signing or signed by another key");
  } else if (next.source === "server") {
    flag("/next/signature", "a server policy is signed");
  }
  if (current) {
    const org = (doc: JsonObject) => (isObject(doc.org) ? doc.org.id : undefined);
    if (org(current) !== org(next)) flag("/next/org/id", "a policy update stays in its organization");
    if (current.source !== next.source) flag("/next/source", `an update replaces the ${String(current.source)} layer, not the ${String(next.source)} layer`);
    if (Date.parse(String(next.issuedAt ?? "")) < Date.parse(String(current.issuedAt ?? ""))) flag("/next/issuedAt", "a policy is issued no earlier than the one the device holds");
    if (typeof current.revision === "number" && typeof next.revision === "number" && next.revision <= current.revision) {
      flag("/next/revision", `revision ${next.revision} does not move past ${current.revision}: a device applies only a newer revision`);
    }
  }
  return findings;
}

/** FAC-SEM-042: `{layers, effective}` — the effective settings are the resolution of the layers, and nothing lower overrides a lock. */
function policyResolution(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-042", instancePath, message });
  const layers = Array.isArray(value.layers) ? value.layers.filter(isObject) : [];
  const effective = isObject(value.effective) ? value.effective : {};
  const sources = new Set<unknown>();
  layers.forEach((layer, i) => {
    if (sources.has(layer.source)) flag(`/layers/${i}/source`, `two ${String(layer.source)} layers`);
    sources.add(layer.source);
    if (layer.source === "user" && isObject(layer.keys)) {
      for (const [name, setting] of Object.entries(layer.keys)) {
        if (isObject(setting) && setting.locked === true) flag(`/layers/${i}/keys/${name}/locked`, "the user layer is the lowest; it has nothing below it to lock");
      }
    }
  });
  const resolved = resolvePolicy(layers);
  for (const [name, want] of Object.entries(resolved)) {
    const got = effective[name];
    if (!isObject(got)) { flag(`/effective/${name}`, `${name} is set by the ${want.from} layer and missing from the effective settings`); continue; }
    if (!jsonEqual(got.value, want.value) || got.from !== want.from) flag(`/effective/${name}`, `${name} resolves to the ${want.from} layer's value; ${String(got.from)} cannot override it`);
  }
  for (const name of Object.keys(effective)) if (!(name in resolved)) flag(`/effective/${name}`, `${name} is set by no layer`);
  return findings;
}

export interface Evidence { instancePath: string; message: string }

const num = (x: unknown) => (typeof x === "number" ? x : 0);

export type { StreamState } from "./activity-rules.js";

/** What a receiver knows about one device before a batch or a check-in. The epochs and the policy baseline are reset by each enrollment. */
export interface DeviceState { deviceId: string; epochs: number[]; policyBaseline: Partial<Record<"mdm" | "server", number>>; streams: StreamState[] }

const keyOf = (collector: JsonObject) => `${String(collector.id)}#${String(collector.epoch)}`;

/** The device state after `batch` and `checkIn` — the same stream state the batch ack is computed from (`mergeStreams`). */
export function mergeDeviceState(known: DeviceState, batch: JsonObject | null, checkIn: JsonObject | null): DeviceState {
  return { ...known, streams: mergeStreams(known.streams, batch, checkIn) };
}

/**
 * Evidence that a device's telemetry or state was tampered with (DEC-0031). A batch is a contiguous
 * slice of each stream, so a hole inside a batch is evidence at once. A gap between batches is pending —
 * its overflow may still be in the device's buffer — until a check-in reports `bufferedFrom` above it:
 * every seq below `bufferedFrom` was sent or dropped, so a seq there that is neither held, nor accounted
 * for by an overflow, nor pending in a check-in's `dropped` ranges is evidence. So are an epoch the server never
 * issued to the device, a collector counter below a seq already held, and a policy revision below the
 * baseline of the current enrollment, and a `bufferedFrom` below one the device reported before (a
 * buffer floor only rises). A reinstall re-enrolls, takes a new epoch and starts at seq 1, which is
 * none of these.
 */
export function tamperEvidence(known: DeviceState, batch: JsonObject | null, checkIn: JsonObject | null): Evidence[] {
  const evidence: Evidence[] = [];
  const issued = new Set(known.epochs);
  const list = batch && Array.isArray(batch.events) ? batch.events.filter(isObject) : [];
  const last = new Map<string, number>();
  list.forEach((event, index) => {
    const collector = isObject(event.collector) ? event.collector : {};
    if (!issued.has(num(collector.epoch))) evidence.push({ instancePath: `/batch/events/${index}/collector/epoch`, message: `epoch ${num(collector.epoch)} was never issued to this device` });
    const key = keyOf(collector);
    const before = last.get(key);
    if (before !== undefined && num(event.seq) > before + 1) evidence.push({ instancePath: `/batch/events/${index}/seq`, message: `seqs ${before + 1}…${num(event.seq) - 1} of ${key} are missing inside one batch` });
    last.set(key, num(event.seq));
  });
  const before = new Map(known.streams.map((s) => [keyOf(s.collector as unknown as JsonObject), s.bufferedFrom]));
  const state = mergeDeviceState(known, batch, checkIn);
  const byKey = new Map(state.streams.map((s) => [keyOf(s.collector as unknown as JsonObject), s]));
  const collectors = checkIn && Array.isArray(checkIn.collectors) ? checkIn.collectors.filter(isObject) : [];
  collectors.forEach((c, i) => {
    const collector = isObject(c.collector) ? c.collector : {};
    const key = keyOf(collector);
    if (!issued.has(num(collector.epoch))) evidence.push({ instancePath: `/checkIn/collectors/${i}/collector/epoch`, message: `epoch ${num(collector.epoch)} was never issued to this device` });
    const s = byKey.get(key);
    const highest = s && s.held.length ? s.held[s.held.length - 1]![1] : 0;
    if (num(c.lastSeq) < highest) evidence.push({ instancePath: `/checkIn/collectors/${i}/lastSeq`, message: `${key} reports seq ${num(c.lastSeq)}, below ${highest}, which was already received` });
    const floorBefore = before.get(key);
    if (typeof floorBefore === "number" && num(c.bufferedFrom) < floorBefore) evidence.push({ instancePath: `/checkIn/collectors/${i}/bufferedFrom`, message: `${key} reports its buffer from ${num(c.bufferedFrom)}, below ${floorBefore} it reported before: a buffer floor only rises` });
    if (num(c.bufferedFrom) > num(c.lastSeq) + 1) evidence.push({ instancePath: `/checkIn/collectors/${i}/bufferedFrom`, message: `${key} reports a buffer that starts after its last seq` });
    const floor = Math.min(num(c.bufferedFrom), num(c.lastSeq) + 1) - 1;
    for (const [from, to] of uncovered([...(s?.held ?? []), ...(s?.accounted ?? []), ...(s?.pending ?? [])], 1, floor)) {
      evidence.push({ instancePath: `/checkIn/collectors/${i}/bufferedFrom`, message: `seqs ${from}…${to} of ${key} were sent or dropped, yet none is held and no overflow accounts for them` });
    }
  });
  const layers = checkIn && isObject(checkIn.policy) && Array.isArray(checkIn.policy.layers) ? checkIn.policy.layers.filter(isObject) : [];
  layers.forEach((layer, i) => {
    const baseline = known.policyBaseline[layer.source as "mdm" | "server"];
    if (typeof baseline === "number" && num(layer.revision) < baseline) {
      evidence.push({ instancePath: `/checkIn/policy/layers/${i}/revision`, message: `${String(layer.source)} policy revision ${num(layer.revision)} is below ${baseline}, which the device acknowledged since it enrolled` });
    }
  });
  return evidence;
}

const asState = (value: unknown): DeviceState => {
  const k = isObject(value) ? value : {};
  return {
    deviceId: String(k.deviceId ?? ""),
    epochs: Array.isArray(k.epochs) ? k.epochs.filter((e): e is number => typeof e === "number") : [],
    policyBaseline: isObject(k.policyBaseline) ? k.policyBaseline as DeviceState["policyBaseline"] : {},
    streams: asStreams(k.streams)
  };
};

/** FAC-SEM-043: `{known, batch?, checkIn?, effective?, health}` — health does not hide tampering or disabled required logging. */
function healthObservation(value: JsonObject): Finding[] {
  const health = isObject(value.health) ? value.health : {};
  const checkIn = isObject(value.checkIn) ? value.checkIn : null;
  const findings: Finding[] = [];
  if (health.state !== "tampered") {
    for (const e of tamperEvidence(asState(value.known), isObject(value.batch) ? value.batch : null, checkIn)) {
      findings.push({ code: "FAC-SEM-043", instancePath: "/health/state", message: `${e.message} (${e.instancePath}): the state is tampered` });
    }
  }
  const effective = isObject(value.effective) ? value.effective : {};
  const required = isObject(effective["logging.required"]) && (effective["logging.required"] as JsonObject).value === true;
  const logging = checkIn && isObject(checkIn.logging) ? checkIn.logging : {};
  if (required && logging.enabled === false && !["logging_disabled", "tampered"].includes(String(health.state))) {
    findings.push({ code: "FAC-SEM-043", instancePath: "/health/state", message: "logging is required and the device reports it disabled: the state is logging_disabled" });
  }
  return findings;
}

const DAY_MS = 86_400_000;
/** The longest a device certificate may live (DEC-0031). */
export const MAX_CERTIFICATE_DAYS = 30;

/**
 * FAC-SEM-044: `{request, response, issuedEpochs?, enrolled?, token?, proof?}` — the certificate is short-lived and bound to
 * what enrolled, and the epoch is new. `enrolled` is the record the server holds for the request's `device.id`
 * (`{keySha256}`), absent for a first enrollment; `token` is the server's record of the enrollment token the request names
 * (`{tokenId, deviceId?, userId?}`); `proof` is what the `Authorization` proof names (`{userId?}`, the signed-in user for
 * SSO). An SSO certificate binds the user the proof names, and a token certificate binds a user only when the token names
 * that person (F-B-105). Re-enrolling a device that is already enrolled needs proof that it is that device: a CSR
 * from the key on record, or a device-management token issued for that device. Otherwise any member could enroll as
 * another person's device and make it look tampered.
 */
function enrollment(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-044", instancePath, message });
  const request = isObject(value.request) ? value.request : {};
  const response = isObject(value.response) ? value.response : {};
  const certificate = isObject(response.certificate) ? response.certificate : {};
  findings.push(...embeddedProtocolsFindings(response.protocols, "/response/protocols"));
  const binding = isObject(certificate.binding) ? certificate.binding : {};
  const id = (x: unknown) => (isObject(x) ? x.id : undefined);
  if (id(binding.org) !== id(request.org)) flag("/response/certificate/binding/org/id", "the certificate names another organization than the request");
  if (id(binding.device) !== id(request.device)) flag("/response/certificate/binding/device/id", "the certificate names another device than the request");
  const auth = isObject(request.auth) ? request.auth : {};
  const token = isObject(value.token) && typeof auth.tokenId === "string" && value.token.tokenId === auth.tokenId ? value.token : {};
  const bound = isObject(binding.user) ? binding.user.id : undefined;
  if (auth.method === "sso") {
    const proven = isObject(value.proof) ? value.proof.userId : undefined;
    if (bound === undefined) flag("/response/certificate/binding/user", "an SSO enrollment binds the signed-in user");
    else if (bound !== proven) flag("/response/certificate/binding/user/id", "an SSO enrollment binds the user its sign-in proves, never another");
  } else if (auth.method === "enrollment-token" && bound !== undefined && bound !== token.userId) {
    flag("/response/certificate/binding/user/id", "a token enrollment binds a user only when the token names that person");
  }
  const from = Date.parse(String(certificate.notBefore ?? "")), to = Date.parse(String(certificate.notAfter ?? ""));
  if (!(to > from)) flag("/response/certificate/notAfter", "a certificate ends after it starts");
  else if (to - from > MAX_CERTIFICATE_DAYS * DAY_MS) flag("/response/certificate/notAfter", `a device certificate lives at most ${MAX_CERTIFICATE_DAYS} days`);
  if (isObject(value.enrolled)) {
    const key = isObject(request.key) ? request.key.publicKeySha256 : undefined;
    const sameKey = typeof key === "string" && key === value.enrolled.keySha256;
    const deviceToken = auth.method === "enrollment-token" && token.deviceId !== undefined && token.deviceId === id(request.device);
    if (!sameKey && !deviceToken) flag("/request/device/id", "this device is already enrolled: re-enrollment needs a CSR from the key on record or a device-management token issued for this device");
  }
  // DEC-0053: the device's keys by role — `<device.id>#sig` signs, `<device.id>#kem` agrees keys, never one key for both.
  const roles = new Map<unknown, number>();
  (Array.isArray(request.deviceKeys) ? request.deviceKeys.filter(isObject) : []).forEach((key, i) => {
    const at = `/request/deviceKeys/${i}`;
    if (key.kid !== `${String(id(request.device))}#${String(key.use)}`) flag(`${at}/kid`, "a device key is listed as <device.id>#sig or <device.id>#kem, by its role");
    if (key.use === "kem" ? key.alg !== "ecdh-p256" : key.alg !== "es256" && key.alg !== "ed25519") flag(`${at}/alg`, "a sig key signs with ES256 or Ed25519; a kem key agrees keys over P-256 only");
    const raw = Buffer.from(String(key.publicKey ?? ""), "base64");
    if (key.alg === "ed25519" ? raw.length !== 32 || isSmallOrderKey(raw) : !isValidP256Key(raw)) flag(`${at}/publicKey`, "an Ed25519 key is never of small order (DEC-0045) and a P-256 key is a valid point (SEC 1 §3.2.2)");
    const seen = roles.get(key.publicKey);
    if (seen !== undefined) flag(`${at}/publicKey`, `the same key is already listed at /request/deviceKeys/${seen}: one key is never used for the other role`);
    else roles.set(key.publicKey, i);
  });
  // DEV-KEY-ROLES (DEC-0056): an enrollment that lists device keys lists exactly one signing key and at most one
  // key-agreement key, as the estate record's FAC-SEM-073 counts a machine's — so there is the one key that signs a
  // device's requests (devices.md, transport), and the one key a sender seals to.
  if (Array.isArray(request.deviceKeys)) {
    const listed = request.deviceKeys.filter(isObject);
    const count = (use: string) => listed.filter((key) => key.use === use).length;
    if (count("sig") !== 1) flag("/request/deviceKeys", `an enrollment that lists device keys lists exactly one signing key, <device.id>#sig; this one lists ${count("sig")}`);
    if (count("kem") > 1) flag("/request/deviceKeys", `an enrollment lists at most one key-agreement key, <device.id>#kem; this one lists ${count("kem")}`);
  }
  const issued = Array.isArray(value.issuedEpochs) ? value.issuedEpochs.filter((e): e is number => typeof e === "number") : [];
  if (issued.length && num(response.streamEpoch) <= Math.max(...issued)) flag("/response/streamEpoch", `an enrollment issues an epoch above every epoch issued to the device before (${Math.max(...issued)})`);
  return findings;
}

/**
 * FAC-SEM-045: `{binding, epochs, batch?, checkIn?}` — a receiver attributes what a device sends by its client
 * certificate and by the binding recorded for each epoch. `binding` is the certificate's (`{org, device, user?}`);
 * `epochs` lists `{epoch, binding}` for every epoch issued to the device. The body's device is the certificate's
 * device. An event's user is the user bound when its epoch was issued — so events of an earlier epoch, still in the
 * buffer after the device was re-enrolled to another person, stay with the person they belong to, and events of an
 * unassigned epoch carry no user.
 */
function attribution(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-045", instancePath, message });
  const binding = isObject(value.binding) ? value.binding : {};
  const device = isObject(binding.device) ? binding.device.id : undefined;
  for (const doc of ["batch", "checkIn"] as const) {
    const body = isObject(value[doc]) ? value[doc] as JsonObject : null;
    if (!body) continue;
    if (!isObject(body.device) || body.device.id !== device) flag(`/${doc}/device/id`, "the device is the client certificate's device, never the body's word");
  }
  const epochs = new Map<number, JsonObject>();
  for (const entry of Array.isArray(value.epochs) ? value.epochs.filter(isObject) : []) {
    const bound = isObject(entry.binding) ? entry.binding : {};
    if (isObject(bound.device) && bound.device.id === device) epochs.set(num(entry.epoch), bound);
  }
  const batch = isObject(value.batch) ? value.batch : {};
  (Array.isArray(batch.events) ? batch.events.filter(isObject) : []).forEach((event, i) => {
    const epoch = isObject(event.collector) ? num(event.collector.epoch) : 0;
    const bound = epochs.get(epoch);
    if (!bound) { flag(`/batch/events/${i}/collector/epoch`, `no binding is recorded for epoch ${epoch} of this device`); return; }
    if (!isObject(event.user)) return;
    const user = isObject(bound.user) ? bound.user.id : undefined;
    if (user === undefined) flag(`/batch/events/${i}/user`, `epoch ${epoch} was issued with no user bound, so its events name none`);
    else if (event.user.id !== user) flag(`/batch/events/${i}/user/id`, `an event's user is the user bound when epoch ${epoch} was issued`);
  });
  return findings;
}

/**
 * FAC-SEM-046: `{root: {keyId, alg?, publicKey}, current?, next}` — a policy key set is signed by the root key from enrollment
 * in that key's algorithm, Ed25519 or ES256 (DEC-0053),
 * moves its revision forward in its organization, names each key once with a window that ends after it starts and none
 * of small order (DEC-0045, CT-29), keeps
 * a key valid at `issuedAt`, and rotates with overlap: a key of the current set still valid at the next set's
 * `issuedAt` stays until its `notAfter` unless it is revoked by name.
 */
function keySet(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-046", instancePath, message });
  const root = isObject(value.root) ? value.root : {};
  const next = isObject(value.next) ? value.next : {};
  const current = isObject(value.current) ? value.current : null;
  const signature = isObject(next.signature) ? next.signature : {};
  if (signature.keyId !== root.keyId) flag("/next/signature/keyId", "a key set is signed by the root key from enrollment");
  else if (signature.alg !== (root.alg ?? "ed25519") || !verifyWith(root, policySigningInput(next), signature.value)) flag("/next/signature/value", "the key set's signature does not verify under the root key, in the root key's algorithm");
  const at = Date.parse(String(next.issuedAt ?? ""));
  const keys = Array.isArray(next.keys) ? next.keys.filter(isObject) : [];
  const ids = new Set<unknown>();
  let validNow = false;
  keys.forEach((key, i) => {
    if (ids.has(key.keyId)) flag(`/next/keys/${i}/keyId`, `key ${String(key.keyId)} is named twice`);
    ids.add(key.keyId);
    if (key.keyId === root.keyId) flag(`/next/keys/${i}/keyId`, "the root key is never a policy signing key");
    if (typeof key.publicKey === "string" && isSmallOrderKey(Buffer.from(key.publicKey, "base64"))) flag(`/next/keys/${i}/publicKey`, "a key of small order verifies forged signatures and is never published (DEC-0045)");
    const from = Date.parse(String(key.notBefore ?? "")), to = Date.parse(String(key.notAfter ?? ""));
    if (!(to > from)) flag(`/next/keys/${i}/notAfter`, "a key's window ends after it starts");
    if (at >= from && at <= to) validNow = true;
  });
  if (!validNow) flag("/next/keys", "a key set holds a key valid at its issuedAt, so a device is never left without one");
  if (current) {
    const org = (doc: JsonObject) => (isObject(doc.org) ? doc.org.id : undefined);
    if (org(current) !== org(next)) flag("/next/org/id", "a key set stays in its organization");
    if (num(next.revision) <= num(current.revision)) flag("/next/revision", `revision ${num(next.revision)} does not move past ${num(current.revision)}`);
    const revoked = new Set(Array.isArray(next.revoked) ? next.revoked : []);
    const kept = new Map(keys.map((key) => [key.keyId, key]));
    (Array.isArray(current.keys) ? current.keys.filter(isObject) : []).forEach((key) => {
      if (revoked.has(key.keyId) || Date.parse(String(key.notAfter ?? "")) <= at) return;
      const same = kept.get(key.keyId);
      if (!same || same.publicKey !== key.publicKey) flag("/next/keys", `key ${String(key.keyId)} is still valid until ${String(key.notAfter)}; a rotation keeps it until then or revokes it by name`);
    });
  }
  return findings;
}

/** Actions a device decides under its policy (FAC-SEM-068). */
export type DeviceActionKind = "grant" | "remote-execution" | "personal-key-call" | "local-change" | "upload";

/**
 * What a device must decide for `action` at `at` under `layers` (DEC-0053), with the reason when it must refuse:
 * - after the earliest `expiresAt`, grants, remote execution and a person's key serving others stop;
 * - a local change to a locked key is refused, expired or not: locks stay in force;
 * - a person's key serves someone else's call only when `models.personal_key_sharing` resolves to `allowed`, and absent
 *   means forbidden;
 * - an event is uploaded only when it occurred at or after the device's collection start.
 */
export function expectedDecision(layers: readonly JsonObject[], at: string, action: JsonObject, acknowledgedAt?: string): { decision: "allow" | "refuse"; reason: string } {
  const now = Date.parse(at);
  const expired = now > policyExpiry(layers);
  const effective = resolvePolicy(layers);
  const allow = { decision: "allow" as const, reason: "" };
  const refuse = (reason: string) => ({ decision: "refuse" as const, reason });
  switch (action.kind) {
    case "grant":
    case "remote-execution":
      return expired ? refuse(`the policy expired, so ${String(action.kind)} stops until a newer policy arrives`) : allow;
    case "personal-key-call":
      if (expired) return refuse("the policy expired, so a person's key serves nobody else");
      return effective["models.personal_key_sharing"]?.value === "allowed" ? allow : refuse("a person's key serves someone else only where the policy says allowed; absent means forbidden");
    case "local-change": {
      const locked = layers.some((layer) => layer.source !== "user" && isObject(layer.keys) && isObject(layer.keys[String(action.key)]) && (layer.keys[String(action.key)] as JsonObject).locked === true);
      return locked ? refuse(`${String(action.key)} is locked, and locks stay in force after the policy expires`) : allow;
    }
    case "upload": {
      const start = collectionStart(layers, acknowledgedAt);
      if (Number.isNaN(start)) return refuse("collection has not started: the notice is not acknowledged and no deadline applies");
      return Date.parse(String(action.occurred ?? "")) >= start ? allow : refuse("the event occurred before collection started; it stays on the device");
    }
    default:
      return allow;
  }
}

/** FAC-SEM-068: `{layers, at, acknowledgedAt?, action, decision}` — the device's decision is the one its policy gives. */
function deviceAction(value: JsonObject): Finding[] {
  const layers = Array.isArray(value.layers) ? value.layers.filter(isObject) : [];
  const action = isObject(value.action) ? value.action : {};
  const want = expectedDecision(layers, String(value.at ?? ""), action, typeof value.acknowledgedAt === "string" ? value.acknowledgedAt : undefined);
  if (value.decision === want.decision) return [];
  return [{ code: "FAC-SEM-068", instancePath: "/decision", message: want.decision === "refuse" ? `the device must refuse: ${want.reason}` : `nothing in the policy refuses this ${String(action.kind)}` }];
}

/**
 * A raw uncompressed P-256 point (0x04 ‖ X ‖ Y) as a public JWK. A P-256 key goes to `verify` as `{key: jwk, format: "jwk",
 * dsaEncoding}`: workerd (Cloudflare Workers) throws a TypeError on a KeyObject beside `dsaEncoding`, and Node accepts both.
 * Local until `p256Jwk` (src/p256.ts, #59) lands.
 */

/**
 * Whether `signature` (base64) over `bytes` verifies under `key` (`{alg, publicKey}`): `ed25519` with a raw 32-byte key
 * (never one of small order, DEC-0045), or `es256` with a raw 65-byte uncompressed P-256 point valid by SEC 1 §3.2.2
 * (`isValidP256Key`) and a 64-byte r‖s signature (DEC-0053). A verifier accepts only the algorithm the key names.
 */
export function verifyWith(key: JsonObject, bytes: Buffer, signature: unknown): boolean {
  if (typeof key.publicKey !== "string" || typeof signature !== "string") return false;
  const raw = Buffer.from(key.publicKey, "base64");
  const value = Buffer.from(signature, "base64");
  try {
    if ((key.alg ?? "ed25519") === "ed25519") {
      if (raw.length !== 32 || isSmallOrderKey(raw)) return false;
      return verify(null, bytes, createPublicKey({ key: Buffer.concat([ED25519_SPKI_PREFIX, raw]), format: "der", type: "spki" }), value);
    }
    if (key.alg === "es256") {
      if (!isValidP256Key(raw)) return false;
      return verify("sha256", bytes, { key: p256Jwk(raw), format: "jwk", dsaEncoding: "ieee-p1363" }, value);
    }
  } catch {
    return false;
  }
  return false;
}

/** The bytes a root certification, a delegation certificate or a revocation list is signed over: RFC 8785 without `signature`. */
export function certificationSigningInput(document: JsonObject): Buffer {
  const { signature: _signature, ...signed } = document;
  return Buffer.from(rfc8785(signed), "utf8");
}

/** The longest a delegation key's certificate may live (DEC-0053, the operator's R10-M3). */
export const MAX_DELEGATION_DAYS = 30;
/** The oldest offline-root revocation list a delegated certification may carry (TUF: metadata expires). */
export const MAX_REVOCATION_LIST_AGE_DAYS = 7;

/**
 * FAC-SEM-069: `{pinned?, root, certification?, revocations?, at}` — when the device's installer pinned offline root keys
 * (`pinned`), the organization's root key from enrollment (`root`, `policyRootKey`) is certified by one of them, checked at
 * enrollment time `at`: directly, or by a delegation key whose certificate a pinned key signed, that lives at most 30 days,
 * is valid at `at` and is not on the revocation list a pinned key signed. With nothing pinned the organization's root is its
 * own (a self-hosted organization) and nothing is required (DEC-0053).
 */
function rootCertification(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-069", instancePath, message });
  const pinned = Array.isArray(value.pinned) ? value.pinned.filter(isObject) : [];
  if (!pinned.length) return findings;
  const certification = isObject(value.certification) ? value.certification : null;
  if (!certification) { flag("/certification", "the installer pinned an offline root, so the organization's root key carries its counter-signature"); return findings; }
  const root = isObject(value.root) ? value.root : {};
  const subject = isObject(certification.subject) ? certification.subject : {};
  const algOf = (key: JsonObject) => key.alg ?? "ed25519";
  if (subject.keyId !== root.keyId || subject.publicKey !== root.publicKey || algOf(subject) !== algOf(root)) flag("/certification/subject", "the certification names another key than the organization's root key from enrollment");
  const at = Date.parse(String(value.at ?? ""));
  if (!(at <= Date.parse(String(certification.notAfter ?? "")) && at >= Date.parse(String(certification.issuedAt ?? "")))) flag("/certification/notAfter", "the certification is not valid at enrollment time");
  const signature = isObject(certification.signature) ? certification.signature : {};
  const pinnedKey = (keyId: unknown) => pinned.find((key) => key.keyId === keyId);
  const delegation = isObject(certification.delegation) ? certification.delegation : null;
  let signer: JsonObject | undefined;
  if (!delegation) {
    signer = pinnedKey(signature.keyId);
    if (!signer) flag("/certification/signature/keyId", "a key outside the pinned chain signed the certification");
  } else {
    const issuer = isObject(delegation.signature) ? delegation.signature : {};
    const offline = pinnedKey(issuer.keyId);
    if (!offline || algOf(offline) !== issuer.alg || !verifyWith(offline, certificationSigningInput(delegation), issuer.value)) flag("/certification/delegation/signature", "the delegation key's certificate is not signed by a pinned offline root key");
    const from = Date.parse(String(delegation.notBefore ?? "")), to = Date.parse(String(delegation.notAfter ?? ""));
    if (!(to > from) || to - from > MAX_DELEGATION_DAYS * DAY_MS) flag("/certification/delegation/notAfter", `a delegation key's certificate lives at most ${MAX_DELEGATION_DAYS} days`);
    else if (!(at >= from && at <= to)) flag("/certification/delegation/notAfter", "the delegation key's certificate is not valid at enrollment time");
    const revocations = isObject(value.revocations) ? value.revocations : null;
    // A delegated certification carries the offline root's current revocation list (devices.md, key sets): without it, or
    // with a stale one, a compromised delegation key could certify until its own certificate expires.
    if (!revocations) flag("/revocations", "a delegated certification carries the offline root's current revocation list");
    else {
      const issued = Date.parse(String(revocations.issuedAt ?? ""));
      if (!(issued <= at) || at - issued > MAX_REVOCATION_LIST_AGE_DAYS * DAY_MS) flag("/revocations/issuedAt", `the revocation list was issued at most ${MAX_REVOCATION_LIST_AGE_DAYS} days before enrollment`);
    }
    if (revocations) {
      const listSignature = isObject(revocations.signature) ? revocations.signature : {};
      const listSigner = pinnedKey(listSignature.keyId);
      if (!listSigner || algOf(listSigner) !== listSignature.alg || !verifyWith(listSigner, certificationSigningInput(revocations), listSignature.value)) flag("/revocations/signature", "the revocation list is not signed by a pinned offline root key");
      else if (Array.isArray(revocations.revoked) && revocations.revoked.includes(delegation.keyId)) flag("/certification/delegation/keyId", "the delegation key is revoked by the offline root's list");
    }
    signer = signature.keyId === delegation.keyId ? delegation : undefined;
    if (!signer) flag("/certification/signature/keyId", "a delegated certification is signed by the delegation key it carries");
  }
  if (signer && (algOf(signer) !== signature.alg || !verifyWith(signer, certificationSigningInput(certification), signature.value))) flag("/certification/signature/value", "the certification's signature does not verify");
  return findings;
}

export function deviceRules(kind: string, value: unknown): Finding[] | undefined {
  if (!isObject(value)) return undefined;
  if (kind === "device-policy-update") return policyUpdate(value);
  if (kind === "device-policy-resolution") return policyResolution(value);
  if (kind === "device-health-observation") return healthObservation(value);
  if (kind === "device-enrollment") return enrollment(value);
  if (kind === "device-attribution") return attribution(value);
  if (kind === "device-key-set") return keySet(value);
  if (kind === "device-action") return deviceAction(value);
  if (kind === "device-root-certification") return rootCertification(value);
  return undefined;
}
// #endregion device-rules
