import { rfc8785 } from "./canonical.js";
import { type Finding, type JsonObject, isObject } from "./findings.js";
import { p256KeyRefusal } from "./p256.js";
import { instantKey, strictTime } from "./rfc3339.js";
import { hpkeOpenBase, hpkeSealBase } from "./secret-envelope.js";

// #region machine-report, docs: docs/specification/relay.md#the-machines-report
/**
 * The machines' report to their hub (DEC-0132, CT-152): what a machine applied of the estate (the record's revision,
 * the heartbeat, the delta head) and the window leases it holds with what it spent, sealed to the hub machine's `#kem`
 * as the inner `payload` of a relay message body, so the relay reads none of it. DEC-0128 UE-2 keeps these records off
 * every check-in to an organization server; this is where they go instead. The hub reads them for DL-15's key rotation,
 * the hub move's step 6 and the window lease's reporting.
 */

type Json = JsonObject;
const isString = (value: unknown): value is string => typeof value === "string";

/** The sealed report's `type` and its HPKE `info`. */
export const MACHINE_REPORT_TYPE = "fabric-machine-report/1";
/** The plaintext's `type`. */
export const MACHINE_REPORT_MESSAGE_TYPE = "machine-report/1";
/** The plaintext's largest RFC 8785 form: 64 leases fit in a twentieth of it. */
export const MAX_MACHINE_REPORT_BYTES = 65_536;
/** A machine reports at least this often while it holds a lease or applies the estate's records (MR-2). */
export const MACHINE_REPORT_INTERVAL_SECONDS = 86_400;
export const MACHINE_REPORT_SEAL_REFUSALS = ["malformed", "bad-key", "too-large"] as const;
export const MACHINE_REPORT_REFUSALS = ["malformed", "wrong-recipient", "cannot-open", "wrong-machine", "stale"] as const;
/** What `acceptMachineReport` refuses: the hub's reading of a report it opened or read from its own node (MR-2, MR-4). */
export const MACHINE_REPORT_ACCEPT_REFUSALS = ["malformed", "wrong-machine", "stale"] as const;
export type MachineReportAcceptRefusal = (typeof MACHINE_REPORT_ACCEPT_REFUSALS)[number];
export type MachineReportSealRefusal = (typeof MACHINE_REPORT_SEAL_REFUSALS)[number];
export type MachineReportRefusal = (typeof MACHINE_REPORT_REFUSALS)[number];
export interface SealedMachineReport { type: typeof MACHINE_REPORT_TYPE; kem: string; enc: string; ct: string }

const KEM_KID = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,127}#kem$/;
const B64URL = /^[A-Za-z0-9_-]+$/;
const INFO = Buffer.from(MACHINE_REPORT_TYPE, "ascii");
/** Standard base64 that decodes and encodes back to the same text. */
const canonicalBase64 = (value: unknown): value is string => isString(value) && value.length > 0 && Buffer.from(value, "base64").toString("base64") === value;

/** The AEAD's additional data: the RFC 8785 bytes of `{type, from, to, msgId, kem}`, the body's own `from`, `to` and `msgId`. */
export function machineReportAad(fields: { from: unknown; to: unknown; msgId: unknown; kem: unknown }): Buffer {
  return Buffer.from(rfc8785({ type: MACHINE_REPORT_TYPE, from: fields.from, to: fields.to, msgId: fields.msgId, kem: fields.kem }), "utf8");
}

/**
 * Seals a report to the hub machine's `#kem` (MR-3): HPKE base mode, suite [16, 1, 1], `info` the protocol name, the
 * additional data `machineReportAad`. `ephemeral` fixes the ephemeral scalar for vectors only. It refuses `malformed`,
 * `bad-key` (no `#kem` kid or no valid point) and `too-large`, and never throws.
 */
export function sealMachineReport(report: unknown, ctx: { from: unknown; to: unknown; msgId: unknown; recipient: { kid: unknown; publicKey: unknown }; ephemeral?: Buffer }): { ok: true; sealed: SealedMachineReport } | { ok: false; refusal: MachineReportSealRefusal } {
  if (!isObject(report) || report.type !== MACHINE_REPORT_MESSAGE_TYPE) return { ok: false, refusal: "malformed" };
  if (!isString(ctx.from) || !isString(ctx.to) || !isString(ctx.msgId)) return { ok: false, refusal: "malformed" };
  const kid = ctx.recipient?.kid;
  const key = canonicalBase64(ctx.recipient?.publicKey) ? Buffer.from(ctx.recipient.publicKey, "base64") : Buffer.alloc(0);
  if (!isString(kid) || !KEM_KID.test(kid) || key.length !== 65 || p256KeyRefusal(new Uint8Array(key)) !== null) return { ok: false, refusal: "bad-key" };
  let plaintext: Buffer;
  let aad: Buffer;
  try {
    plaintext = Buffer.from(rfc8785(report), "utf8");
    aad = machineReportAad({ from: ctx.from, to: ctx.to, msgId: ctx.msgId, kem: kid });
  } catch {
    // A string with a lone surrogate has no RFC 8785 form.
    return { ok: false, refusal: "malformed" };
  }
  if (plaintext.length > MAX_MACHINE_REPORT_BYTES) return { ok: false, refusal: "too-large" };
  try {
    const { enc, ct } = hpkeSealBase(key, INFO, aad, plaintext, ctx.ephemeral);
    return { ok: true, sealed: { type: MACHINE_REPORT_TYPE, kem: kid, enc: enc.toString("base64url"), ct: ct.toString("base64url") } };
  } catch {
    // Only a fixed ephemeral scalar that is no valid key gets here.
    return { ok: false, refusal: "malformed" };
  }
}

/**
 * The hub's reading of a report (MR-4), after the relay body verified, was not a replay and `relayCallerTier` placed
 * its sender in T1 as `sender` (the machine it named). In order: `malformed` for a sealed shape that is not the
 * schema's; `wrong-recipient` for another `kem`; `cannot-open` when HPKE fails (another body's `from`, `to` or `msgId`
 * among them); `malformed` for a plaintext that is not UTF-8 JSON in its own RFC 8785 form, not of the report's type, or
 * that `schemaValid` refuses, whose `at` is not a relay time (`instantKey`: `Z`, an upper-case `T`, at most nine fraction
 * digits, a day that exists; DEC-0139, DEC-0146), or whose `at` is after `notAfter`, the body's signed `iat` (DEC-0146);
 * `wrong-machine` when the report names another machine than the sender; `stale` when its `at` is not after the report
 * the hub holds for that machine, to the nanosecond. The hub then reads the report as `acceptMachineReport` does
 * (`readMachineReport` does both). It never throws.
 */
export function openMachineReport(sealed: unknown, ctx: { from: unknown; to: unknown; msgId: unknown; own: { kid: unknown; privateKey: unknown }; sender: unknown; held?: { at: unknown }; notAfter?: unknown; schemaValid: (report: unknown) => boolean }): { ok: true; report: Json } | { ok: false; refusal: MachineReportRefusal } {
  if (!isObject(sealed)) return { ok: false, refusal: "malformed" };
  if (Object.keys(sealed).sort().join(",") !== "ct,enc,kem,type" || sealed.type !== MACHINE_REPORT_TYPE || !isString(sealed.kem) || !KEM_KID.test(sealed.kem)) return { ok: false, refusal: "malformed" };
  if (!isString(sealed.enc) || !isString(sealed.ct) || !B64URL.test(sealed.enc) || !B64URL.test(sealed.ct)) return { ok: false, refusal: "malformed" };
  const enc = Buffer.from(sealed.enc, "base64url");
  const ct = Buffer.from(sealed.ct, "base64url");
  if (enc.toString("base64url") !== sealed.enc || ct.toString("base64url") !== sealed.ct) return { ok: false, refusal: "malformed" };
  if (enc.length !== 65 || p256KeyRefusal(new Uint8Array(enc)) !== null || ct.length < 16 || ct.length > MAX_MACHINE_REPORT_BYTES + 16) return { ok: false, refusal: "malformed" };
  if (sealed.kem !== ctx.own?.kid) return { ok: false, refusal: "wrong-recipient" };
  let plaintext: Buffer;
  try {
    const sk = canonicalBase64(ctx.own.privateKey) ? Buffer.from(ctx.own.privateKey, "base64") : Buffer.alloc(0);
    plaintext = hpkeOpenBase(sk, enc, INFO, machineReportAad({ from: ctx.from, to: ctx.to, msgId: ctx.msgId, kem: sealed.kem }), ct);
  } catch {
    return { ok: false, refusal: "cannot-open" };
  }
  let report: unknown;
  try {
    // The bytes are compared, not the decoded text: a decoder drops a leading byte-order mark by default.
    report = JSON.parse(new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(plaintext));
    if (!Buffer.from(rfc8785(report), "utf8").equals(plaintext)) return { ok: false, refusal: "malformed" };
  } catch {
    return { ok: false, refusal: "malformed" };
  }
  if (!isObject(report) || report.type !== MACHINE_REPORT_MESSAGE_TYPE) return { ok: false, refusal: "malformed" };
  let valid = false;
  try {
    valid = ctx.schemaValid(report) === true;
  } catch {
    valid = false;
  }
  if (!valid) return { ok: false, refusal: "malformed" };
  const order = orderReport(report, ctx.sender, ctx.held, ctx.notAfter);
  return order === undefined ? { ok: true, report } : { ok: false, refusal: order };
}

/**
 * The checks the hub's two readings share, after the schema: an `at` that is no relay time (a leap second, a space, an
 * offset, a lower-case `t`, ten fraction digits) cannot be ordered against the report held, so it is `malformed` held
 * or not, and so is an `at` after `notAfter` when the caller gives one (the body's `iat`, or the hub's clock when its
 * own node answered; an unreadable `notAfter` refuses rather than lets through); then `wrong-machine`; then `stale`,
 * compared to the nanosecond (DEC-0146). A held time is read as a relay time, or, for a report the hub accepted
 * before DEC-0146 (an offset, a lower-case `t`, more fraction digits), to the millisecond as `strictTime` reads it, so
 * an upgrade never stops it guarding against an older report; a held time neither reads keeps nothing back.
 */
function orderReport(report: Json, machine: unknown, held: unknown, notAfter: unknown): "malformed" | "wrong-machine" | "stale" | undefined {
  const at = instantKey(report.at);
  if (at === undefined) return "malformed";
  if (notAfter !== undefined) {
    const bound = instantKey(notAfter);
    if (bound === undefined || at > bound) return "malformed";
  }
  if (report.machine !== machine) return "wrong-machine";
  if (isObject(held)) {
    const heldAt = heldKey(held.at);
    if (heldAt !== undefined && !(at > heldAt)) return "stale";
  }
  return undefined;
}

/** A held report's time as `instantKey`'s key, through `strictTime` to the millisecond when it is no relay time. */
function heldKey(value: unknown): string | undefined {
  const key = instantKey(value);
  if (key !== undefined) return key;
  const ms = strictTime(value);
  return Number.isFinite(ms) ? instantKey(new Date(ms).toISOString()) : undefined;
}

/**
 * The hub's reading of a report it holds as a machine's newest (MR-2, MR-4): one `openMachineReport` opened, or the
 * `report` its own node's `machine.report` answered over the local channel. In order: `malformed` (not an object, the
 * schema refuses it, a `FAC-SEM-152` or `FAC-SEM-154` finding, or an `at` after `notAfter`), `wrong-machine` (another
 * machine than `machine`, the sender `relayCallerTier` named or the hub's own machine id) and `stale` (an `at` not after
 * the report held for that machine). The caller handles a `null` answer before it calls: that is no report (the node
 * applies no estate records, and the hub holds nothing for it), while `acceptMachineReport(null)` is `malformed`, as is
 * anything else that is no report. Never throws.
 */
export function acceptMachineReport(report: unknown, ctx: { machine: unknown; held?: { at: unknown }; notAfter?: unknown; schemaValid: (report: unknown) => boolean }): { ok: true; report: Json } | { ok: false; refusal: MachineReportAcceptRefusal } {
  if (!isObject(report) || report.type !== MACHINE_REPORT_MESSAGE_TYPE) return { ok: false, refusal: "malformed" };
  let valid = false;
  try {
    valid = ctx.schemaValid(report) === true;
  } catch {
    valid = false;
  }
  if (!valid || reportFindings(report).length > 0) return { ok: false, refusal: "malformed" };
  const order = orderReport(report, ctx.machine, ctx.held, ctx.notAfter);
  return order === undefined ? { ok: true, report } : { ok: false, refusal: order };
}

/**
 * The hub's whole reading of a relayed report (MR-4): `openMachineReport`, then `acceptMachineReport` on what it opened
 * with the same context, the sender `relayCallerTier` named as the machine. Its refusals are `openMachineReport`'s; a
 * report it opens and `acceptMachineReport` refuses keeps the first refusal in that order (DEC-0146). Never throws.
 */
export function readMachineReport(sealed: unknown, ctx: Parameters<typeof openMachineReport>[1]): { ok: true; report: Json } | { ok: false; refusal: MachineReportRefusal } {
  const opened = openMachineReport(sealed, ctx);
  if (!opened.ok) return opened;
  return acceptMachineReport(opened.report, { machine: ctx.sender, ...(ctx.held === undefined ? {} : { held: ctx.held }), ...(ctx.notAfter === undefined ? {} : { notAfter: ctx.notAfter }), schemaValid: ctx.schemaValid });
}

/** FAC-SEM-152 and FAC-SEM-154 on `machine-report`: each lease once, by its `leaseId`, and an `at` that is a relay time. */
export function machineReportRules(kind: string, value: Json): Finding[] | undefined {
  return kind === "machine-report" ? reportFindings(value) : undefined;
}

function reportFindings(value: Json): Finding[] {
  const findings = leaseFindings(value);
  if (typeof value.at === "string" && instantKey(value.at) === undefined) {
    findings.push({ code: "FAC-SEM-154", instancePath: "/at", message: "a report's at is a relay time: Z, an upper-case T, at most nine fraction digits, a day that exists" });
  }
  return findings;
}

function leaseFindings(value: Json): Finding[] {
  const records = isObject(value.records) ? value.records : {};
  const leases = Array.isArray(records.leases) ? records.leases : [];
  const seen = new Set<unknown>();
  const findings: Finding[] = [];
  leases.forEach((lease, index) => {
    const id = isObject(lease) ? lease.leaseId : undefined;
    if (id === undefined) return;
    if (seen.has(id)) findings.push({ code: "FAC-SEM-152", instancePath: `/records/leases/${index}/leaseId`, message: "a report names each lease once" });
    seen.add(id);
  });
  return findings;
}
// #endregion machine-report
