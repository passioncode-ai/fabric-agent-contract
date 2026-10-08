import { createPublicKey, verify } from "node:crypto";
import { type Finding, type JsonObject, isObject, jsonEqual } from "./findings.js";
import { canonicalJson } from "./settings-backup.js";

// #region device-rules — docs: docs/specification/devices.md#semantic-rules
/**
 * Device enrollment, signed policy and check-in (`fabric-device/0.1`; DEC-0031). A schema checks one
 * document; these rules check what only a pair or a set of documents shows: a policy revision that
 * goes back or carries a signature no trusted key made, an effective setting a lower layer took from a
 * locked one, a health state that hides evidence of tampering, and a certificate that is not bound to
 * what was enrolled.
 */

/** Precedence of policy layers, highest first. */
export const POLICY_PRECEDENCE = ["mdm", "server", "user"] as const;
type Source = (typeof POLICY_PRECEDENCE)[number];

/** The bytes a policy signature covers: the canonical JSON of the document without `signature`. */
export function policySigningInput(policy: JsonObject): Buffer {
  const { signature: _signature, ...signed } = policy;
  return Buffer.from(canonicalJson(signed), "utf8");
}

/** DER prefix of an Ed25519 SubjectPublicKeyInfo (RFC 8410); the raw 32-byte key follows it. */
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

/** Whether `policy.signature` verifies under the raw Ed25519 public key `publicKeyBase64`. */
export function verifyPolicySignature(policy: JsonObject, publicKeyBase64: string): boolean {
  const signature = isObject(policy.signature) ? policy.signature : {};
  if (signature.alg !== "ed25519" || typeof signature.value !== "string") return false;
  const raw = Buffer.from(publicKeyBase64, "base64");
  if (raw.length !== 32) return false;
  try {
    const key = createPublicKey({ key: Buffer.concat([ED25519_SPKI_PREFIX, raw]), format: "der", type: "spki" });
    return verify(null, policySigningInput(policy), key, Buffer.from(signature.value, "base64"));
  } catch {
    return false;
  }
}

export interface EffectiveSetting { value: unknown; from: Source }

/**
 * The effective value of every key across policy layers (DEC-0031): a key locked by any layer takes the
 * value of the highest layer that locks it; otherwise the user's own value; otherwise the highest layer
 * that sets it. Unlocked values above the user layer are defaults; a locked one is never overridden by a
 * lower layer.
 */
export function resolvePolicy(layers: readonly JsonObject[]): Record<string, EffectiveSetting> {
  const ordered = POLICY_PRECEDENCE.map((source) => layers.find((layer) => layer.source === source)).filter((layer): layer is JsonObject => layer !== undefined);
  const keysOf = (layer: JsonObject) => (isObject(layer.keys) ? layer.keys : {});
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
  return effective;
}

/** FAC-SEM-041: `{current?, next, trusted_keys}` — a delivered policy verifies and moves its layer forward. */
function policyUpdate(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-041", instancePath, message });
  const next = isObject(value.next) ? value.next : {};
  const current = isObject(value.current) ? value.current : null;
  const keys = Array.isArray(value.trusted_keys) ? value.trusted_keys.filter(isObject) : [];
  if (next.source === "user") flag("/next/source", "a user layer is set on the device; it is never delivered as an update");
  const signature = isObject(next.signature) ? next.signature : null;
  if (signature) {
    const key = keys.find((k) => k.key_id === signature.key_id);
    if (!key || typeof key.public_key !== "string") flag("/next/signature/key_id", `no trusted key ${String(signature.key_id)}`);
    else if (!verifyPolicySignature(next, key.public_key)) flag("/next/signature/value", "the signature does not verify: the policy was changed after signing or signed by another key");
  } else if (next.source === "server") {
    flag("/next/signature", "a server policy is signed");
  }
  if (current) {
    const org = (doc: JsonObject) => (isObject(doc.org) ? doc.org.id : undefined);
    if (org(current) !== org(next)) flag("/next/org/id", "a policy update stays in its organization");
    if (current.source !== next.source) flag("/next/source", `an update replaces the ${String(current.source)} layer, not the ${String(next.source)} layer`);
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

/**
 * Evidence that a device's telemetry or state was tampered with, from the receiver's known positions:
 * a seq gap inside one epoch that no `buffer_overflow` accounts for, an epoch or a collector counter that
 * went back, and a policy revision acknowledged lower than before. A new, higher epoch is not evidence.
 */
export function tamperEvidence(known: JsonObject, batch: JsonObject | null, checkIn: JsonObject | null): Evidence[] {
  const evidence: Evidence[] = [];
  const streams = Array.isArray(known.streams) ? known.streams.filter(isObject) : [];
  const knownSeq = new Map<string, number>();
  const maxEpoch = new Map<string, number>();
  for (const s of streams) {
    const node = isObject(s.node) ? s.node : {};
    knownSeq.set(`${String(node.id)}#${String(node.epoch)}`, num(s.seq));
    maxEpoch.set(String(node.id), Math.max(maxEpoch.get(String(node.id)) ?? 0, num(node.epoch)));
  }
  const list = batch && Array.isArray(batch.events) ? batch.events.filter(isObject) : [];
  const covered = new Map<string, Array<[number, number]>>();
  const byStream = new Map<string, Array<{ seq: number; index: number }>>();
  list.forEach((event, index) => {
    const node = isObject(event.node) ? event.node : {};
    const key = `${String(node.id)}#${String(node.epoch)}`;
    if (num(node.epoch) < (maxEpoch.get(String(node.id)) ?? 0)) evidence.push({ instancePath: `/batch/events/${index}/node/epoch`, message: `epoch ${num(node.epoch)} of ${String(node.id)} is older than the epoch already received` });
    byStream.set(key, [...(byStream.get(key) ?? []), { seq: num(event.seq), index }]);
    const d = isObject(event.data) ? event.data : {};
    if (event.kind === "buffer_overflow" && isObject(d.dropped)) covered.set(key, [...(covered.get(key) ?? []), [num(d.dropped.from_seq), num(d.dropped.to_seq)]]);
  });
  for (const [key, entries] of byStream) {
    let expected = knownSeq.get(key) ?? 0;
    const ranges = covered.get(key) ?? [];
    const isCovered = (from: number, to: number) => {
      for (let s = from; s <= to; s += 1) if (!ranges.some(([a, b]) => s >= a && s <= b)) return false;
      return true;
    };
    for (const { seq, index } of [...entries].sort((a, b) => a.seq - b.seq)) {
      if (seq > expected + 1 && !isCovered(expected + 1, seq - 1)) evidence.push({ instancePath: `/batch/events/${index}/seq`, message: `seqs ${expected + 1}…${seq - 1} of ${key} are missing and no buffer_overflow accounts for them` });
      expected = Math.max(expected, seq);
    }
  }
  if (checkIn) {
    const collectors = Array.isArray(checkIn.collectors) ? checkIn.collectors.filter(isObject) : [];
    collectors.forEach((c, i) => {
      const node = isObject(c.node) ? c.node : {};
      const id = String(node.id), epoch = num(node.epoch);
      if (epoch < (maxEpoch.get(id) ?? 0)) evidence.push({ instancePath: `/check_in/collectors/${i}/node/epoch`, message: `collector ${id} reports an older epoch than the receiver holds` });
      const held = knownSeq.get(`${id}#${epoch}`);
      if (held !== undefined && num(c.last_seq) < held) evidence.push({ instancePath: `/check_in/collectors/${i}/last_seq`, message: `collector ${id} reports seq ${num(c.last_seq)} below ${held}, which was already received` });
    });
    const policy = isObject(checkIn.policy) ? checkIn.policy : {};
    if (typeof known.policy_revision === "number" && num(policy.revision) < known.policy_revision) {
      evidence.push({ instancePath: "/check_in/policy/revision", message: `policy revision ${num(policy.revision)} is below ${known.policy_revision}, which the device already acknowledged` });
    }
  }
  return evidence;
}

/** FAC-SEM-043: `{known, batch?, check_in?, effective?, health}` — health does not hide tampering or disabled required logging. */
function healthObservation(value: JsonObject): Finding[] {
  const known = isObject(value.known) ? value.known : {};
  const health = isObject(value.health) ? value.health : {};
  const checkIn = isObject(value.check_in) ? value.check_in : null;
  const findings: Finding[] = [];
  if (health.state !== "tampered") {
    for (const e of tamperEvidence(known, isObject(value.batch) ? value.batch : null, checkIn)) {
      findings.push({ code: "FAC-SEM-043", instancePath: "/health/state", message: `${e.message} (${e.instancePath}): the state is tampered` });
    }
  }
  const effective = isObject(value.effective) ? value.effective : {};
  const required = isObject(effective["logging.required"]) ? (effective["logging.required"] as JsonObject).value === true : effective["logging.required"] === true;
  const logging = checkIn && isObject(checkIn.logging) ? checkIn.logging : {};
  if (required && logging.enabled === false && !["logging_disabled", "tampered"].includes(String(health.state))) {
    findings.push({ code: "FAC-SEM-043", instancePath: "/health/state", message: "logging is required and the device reports it disabled: the state is logging_disabled" });
  }
  return findings;
}

const DAY_MS = 86_400_000;
/** The longest a device certificate may live (DEC-0031). */
export const MAX_CERTIFICATE_DAYS = 30;

/** FAC-SEM-044: `{request, response}` — the certificate is short-lived and bound to the organization, device and user that enrolled. */
function enrollment(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-044", instancePath, message });
  const request = isObject(value.request) ? value.request : {};
  const response = isObject(value.response) ? value.response : {};
  const certificate = isObject(response.certificate) ? response.certificate : {};
  const binding = isObject(certificate.binding) ? certificate.binding : {};
  const id = (x: unknown) => (isObject(x) ? x.id : undefined);
  if (id(binding.org) !== id(request.org)) flag("/response/certificate/binding/org/id", "the certificate names another organization than the request");
  if (id(binding.device) !== id(request.device)) flag("/response/certificate/binding/device/id", "the certificate names another device than the request");
  const auth = isObject(request.auth) ? request.auth : {};
  if (auth.method === "sso" && !isObject(binding.user)) flag("/response/certificate/binding/user", "an SSO enrollment binds the signed-in user");
  const from = Date.parse(String(certificate.not_before ?? "")), to = Date.parse(String(certificate.not_after ?? ""));
  if (!(to > from)) flag("/response/certificate/not_after", "a certificate ends after it starts");
  else if (to - from > MAX_CERTIFICATE_DAYS * DAY_MS) flag("/response/certificate/not_after", `a device certificate lives at most ${MAX_CERTIFICATE_DAYS} days`);
  return findings;
}

export function deviceRules(kind: string, value: unknown): Finding[] | undefined {
  if (!isObject(value)) return undefined;
  if (kind === "device-policy-update") return policyUpdate(value);
  if (kind === "device-policy-resolution") return policyResolution(value);
  if (kind === "device-health-observation") return healthObservation(value);
  if (kind === "device-enrollment") return enrollment(value);
  return undefined;
}
// #endregion device-rules
