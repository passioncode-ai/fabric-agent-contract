import { isObject } from "./findings.js";
import { strictTime } from "./rfc3339.js";

// #region port-claim, docs: docs/specification/service.md#ha-1
/**
 * The port claim and the port choice (DEC-0154 HA-1, DEC-0160): the reference an installer and a local service port.
 * It reads no file, binds no socket and never throws: the caller reads the shared folder, its services directory and
 * the socket table (HA-2's sources) and hands them over.
 *
 * - `readClaims` keeps the claims a reader may use and names each one it ignores: content that is not a
 *   `passioncode-port-claim/1` document, a file name that is not the content's, a file owner that is not the account it
 *   names, an account no longer on the computer.
 * - `choosePort` keeps the port the instance records when its own listener holds it and no other `id.instance`'s
 *   descriptor declares it, or when nothing holds it; otherwise it takes the first free candidate. A squatted claim path
 *   (this account's own claim file owned by another account) means no claim is read at all (DEC-0160's reading of HA-1).
 * - `rebuildClaim` writes the claim from this service's descriptors in the account and, for an app without a descriptor
 *   origin or an app's part, the ports in its own state; never from the old claim, which it takes no parameter for. When
 *   the result would not be a valid claim (more than 64 ports, a port outside 1 to 65535, an account that is not a uid
 *   or a SID, a `now` that is not a UTC instant) it answers `{fault: "claim-invalid"}`, never a claim every reader
 *   would ignore.
 */

/** The claim's schema revision, the value of its `schema` member. */
export const PORT_CLAIM_SCHEMA = "passioncode-port-claim/1";
/** A descriptor's id (service-common.schema.json `serviceId`). */
export const SERVICE_ID = /^[a-z][a-z0-9-]{1,62}$/;
/** A reverse-DNS bundle identifier, optionally followed by `.<part>` (the schema's `$defs/bundleId`), at most 130 characters. */
export const BUNDLE_ID = /^[A-Za-z][A-Za-z0-9-]*(?:\.[A-Za-z0-9][A-Za-z0-9-]*)+$/;
/** A numeric uid in decimal with no leading zero (macOS, Linux) or a SID (Windows), at most 100 characters; never a login name. */
export const ACCOUNT = /^(?:0|[1-9][0-9]{0,9}|S-1-[0-9]+(?:-[0-9]+){1,14})$/;
/** An RFC 3339 instant in UTC (interop-common.schema.json `utcInstant`): `Z`, at most three fraction digits. */
export const UTC_INSTANT = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-5][0-9](\.[0-9]{1,3})?Z$/;
const MEMBERS = ["schema", "service", "account", "ports", "updatedAt"];
const MAX_PORTS = 64;
/** The longest service and account, so the file name stays at or under 255 bytes: 25 + 130 + 100. */
const MAX_SERVICE = 130;
const MAX_ACCOUNT = 100;

export interface PortClaim { schema: string; service: string; account: string; ports: number[]; updatedAt: string }
/** A claim file as a reader finds it: its name in the shared folder, its owner's uid (SID on Windows), its parsed content. */
export interface ClaimFile { name: string; owner: string; json: unknown }
export type ClaimNoteCode = "claim-invalid" | "claim-name-mismatch" | "claim-owner-mismatch" | "claim-account-absent";
export interface ClaimNote { code: ClaimNoteCode; file: string }
/** A descriptor in this account's services directory, any service. */
export interface DescriptorPort { service: string; instance: string; port: number }
/** A listener accepting on `127.0.0.1:<port>`, a wildcard bind (`0.0.0.0`, `[::]`) included, and its owner. */
export interface Listener { port: number; account: string }

export interface ChooseInput {
  account: string;
  service: string;
  instance: string;
  /**
   * The port this `id.instance` records (descriptor, own state or claim), or null. Under `squatted` the claim is not a
   * source: the caller takes it from the descriptor or its own state only.
   */
  recorded: number | null;
  /** Whether this instance's own listener holds the recorded port (HA-2's check). */
  ownListener: boolean;
  descriptors: DescriptorPort[];
  /** The usable claims, as `readClaims` answers them. */
  claims: PortClaim[];
  listeners: Listener[];
  /** The ports to try for a new one, in order. */
  candidates: number[];
  /** This account's own claim path exists and another account owns it. */
  squatted: boolean;
}

export type ChooseReason =
  | "kept-own-listener" | "kept-free" | "new-none-recorded"
  | "new-held-by-descriptor" | "new-held-by-claim-other-account" | "new-held-by-claim-other-service" | "new-held-by-listener";
export type ChooseResult =
  | { port: number; kept: boolean; reason: ChooseReason; notes: string[] }
  | { fault: "no-free-port"; notes: string[] };

/** The claim's file name: `.passioncode-ports.<service>.<account>.json`. */
export function claimFileName(service: string, account: string): string {
  return `.passioncode-ports.${service}.${account}.json`;
}

const isPort = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 65535;

/** Whether a value is a `passioncode-port-claim/1` document, exactly as `schemas/port-claim.schema.json` reads it. */
export function isPortClaim(value: unknown): value is PortClaim {
  if (!isObject(value)) return false;
  const keys = Object.keys(value);
  if (keys.length !== MEMBERS.length || !MEMBERS.every((member) => keys.includes(member))) return false;
  const { schema, service, account, ports, updatedAt } = value as Record<string, unknown>;
  if (schema !== PORT_CLAIM_SCHEMA) return false;
  if (typeof service !== "string" || !(SERVICE_ID.test(service) || (service.length <= MAX_SERVICE && BUNDLE_ID.test(service)))) return false;
  if (typeof account !== "string" || account.length > MAX_ACCOUNT || !ACCOUNT.test(account)) return false;
  if (!Array.isArray(ports) || ports.length < 1 || ports.length > MAX_PORTS || !ports.every(isPort) || new Set(ports).size !== ports.length) return false;
  return typeof updatedAt === "string" && UTC_INSTANT.test(updatedAt) && !Number.isNaN(strictTime(updatedAt));
}

/**
 * The claims a reader may use, in the order read, and a note for each file it ignores, naming the first that applies:
 * invalid content, a name that is not the content's, an owner that is not its account, an absent account.
 */
export function readClaims(files: readonly ClaimFile[], presentAccounts: readonly string[]): { claims: PortClaim[]; notes: ClaimNote[] } {
  const claims: PortClaim[] = [];
  const notes: ClaimNote[] = [];
  for (const file of files) {
    const json = file.json;
    let code: ClaimNoteCode | undefined;
    if (!isPortClaim(json)) code = "claim-invalid";
    else if (file.name !== claimFileName(json.service, json.account)) code = "claim-name-mismatch";
    else if (file.owner !== json.account) code = "claim-owner-mismatch";
    else if (!presentAccounts.includes(json.account)) code = "claim-account-absent";
    if (code) notes.push({ code, file: file.name });
    else claims.push(json as PortClaim);
  }
  return { claims, notes };
}

/** Whether another `id.instance`'s descriptor declares the port. */
function declared(input: ChooseInput, port: number): boolean {
  return input.descriptors.some((entry) => entry.port === port && !(entry.service === input.service && entry.instance === input.instance));
}

/** What holds a port for this instance, in the order a reason names it (DEC-0160): the first holder, or undefined. */
function holder(input: ChooseInput, port: number, claims: readonly PortClaim[]): ChooseReason | undefined {
  if (declared(input, port)) return "new-held-by-descriptor";
  const naming = claims.filter((claim) => claim.ports.includes(port));
  if (naming.some((claim) => claim.account !== input.account)) return "new-held-by-claim-other-account";
  if (naming.some((claim) => claim.service !== input.service)) return "new-held-by-claim-other-service";
  if (input.listeners.some((listener) => listener.port === port)) return "new-held-by-listener";
  return undefined;
}

/** The port an installer keeps or chooses (HA-1). */
export function choosePort(input: ChooseInput): ChooseResult {
  const notes = input.squatted ? ["claim-path-squatted"] : [];
  const claims = input.squatted ? [] : input.claims;
  let reason: ChooseReason = "new-none-recorded";
  if (input.recorded !== null) {
    const recorded = input.recorded;
    if (input.ownListener) {
      if (!declared(input, recorded)) return { port: recorded, kept: true, reason: "kept-own-listener", notes };
      reason = "new-held-by-descriptor";
    } else {
      const held = holder(input, recorded, claims);
      if (!held) return { port: recorded, kept: true, reason: "kept-free", notes };
      reason = held;
    }
  }
  const port = input.candidates.find((candidate) => !holder(input, candidate, claims));
  return port === undefined ? { fault: "no-free-port", notes } : { port, kept: false, reason, notes };
}

/**
 * The claim this account writes for a service, rebuilt from this service's descriptors in the account (every instance)
 * and its own state; the ports once each, ascending; `{delete: true}` when none remains; `{fault: "claim-invalid"}`
 * when the result would not be a valid claim, so nothing is written that every reader ignores.
 */
export function rebuildClaim(input: { account: string; service: string; descriptors: readonly DescriptorPort[]; ownState: readonly number[]; now: string }): PortClaim | { delete: true } | { fault: "claim-invalid" } {
  const ports = [...new Set([...input.descriptors.filter((entry) => entry.service === input.service).map((entry) => entry.port), ...input.ownState])].sort((a, b) => a - b);
  if (ports.length === 0) return { delete: true };
  const claim = { schema: PORT_CLAIM_SCHEMA, service: input.service, account: input.account, ports, updatedAt: input.now };
  return isPortClaim(claim) ? claim : { fault: "claim-invalid" };
}
// #endregion port-claim
