import { type Finding, isObject } from "./findings.js";

// #region protocol-revisions — docs: docs/specification/versioning.md#protocol-revisions
/**
 * Protocol revisions and the N and N−1 rule (DEC-0067, CON-OE-07; DEC-0009). Every document of the contract names its
 * protocol revision as `<name>/<revision>`; this register lists each name's published revisions, oldest first. A
 * receiver accepts the newest revision it implements (N) and the one before it in this register (N−1), refuses any
 * other before reading further with `schema-unsupported`, and never translates one revision into another.
 */

/** Each contract protocol's published revisions, oldest first. A new revision is appended here by its decision. */
export const PROTOCOL_REVISIONS: ReadonlyMap<string, readonly string[]> = new Map([
  ["access-log", ["1"]],
  ["activity-summary", ["1"]],
  ["estate-record", ["1"]],
  ["execution-packet", ["1"]],
  ["fabric-activity", ["0.1"]],
  ["fabric-device", ["0.1"]],
  ["fabric-local-runner", ["0.1"]],
  ["fabric-operator-channel", ["0.1"]],
  ["fabric-package", ["1"]],
  ["fabric-project-comms", ["0.1"]],
  ["fabric-provider", ["0.1"]],
  ["fabric-relay", ["0.1"]],
  ["fabric-secret-envelope", ["1"]],
  ["fabric-service", ["0.1"]],
  ["fabric-settings-backup", ["1"]],
  ["heartbeat", ["1"]],
  ["memory", ["0.1"]],
  ["revocation-delta", ["1"]],
  ["session-handoff", ["1"]],
  ["window-lease", ["1"]],
]);

/** At most this many revisions of one protocol are accepted at once: N and N−1. */
export const MAX_REVISIONS_PER_PROTOCOL = 2;

const REVISION = /^([a-z][a-z0-9.-]{0,63})\/([0-9]{1,4}(?:\.[0-9]{1,4}){0,2})$/;

export type ParsedRevision = { name: string; revision: string };

/** `<name>/<revision>` split, or undefined for anything else. */
export function parseRevision(value: unknown): ParsedRevision | undefined {
  const match = typeof value === "string" ? REVISION.exec(value) : null;
  return match ? { name: match[1] as string, revision: match[2] as string } : undefined;
}

/** The revisions a receiver implementing `name` up to `newest` accepts: N and, when the register has one, N−1. */
export function acceptedRevisions(name: string, newest?: string): string[] {
  const known = PROTOCOL_REVISIONS.get(name);
  if (!known?.length) return [];
  const top = newest === undefined ? known.length - 1 : known.indexOf(newest);
  if (top < 0) return [];
  return known.slice(Math.max(0, top - 1), top + 1).reverse().map((revision) => `${name}/${revision}`);
}

export type SchemaUnsupported = { error: { code: "schema-unsupported"; message: string; data: { protocol: string; accepted: string[] } } };

/**
 * A receiver's answer to a document naming `received`, given the revisions it accepts: accepted, or the
 * `schema-unsupported` refusal naming what was received and the accepted revisions of that protocol (all of them when
 * the received value names no protocol a receiver can read).
 */
export function negotiateRevision(received: unknown, accepted: readonly string[]): { ok: true } | SchemaUnsupported {
  if (typeof received === "string" && accepted.includes(received)) return { ok: true };
  const parsed = parseRevision(received);
  const sameName = parsed ? accepted.filter((entry) => parseRevision(entry)?.name === parsed.name) : [];
  return {
    error: {
      code: "schema-unsupported",
      message: "this receiver does not read that protocol revision",
      data: { protocol: typeof received === "string" ? received.slice(0, 80) : "", accepted: sameName.length ? sameName : [...accepted] },
    },
  };
}

/**
 * FAC-SEM-099 (kind `protocols`, a list or `{protocols}`): every entry is `<name>/<revision>`, once; at most two
 * revisions of one protocol; a contract protocol's revisions are in the register, and two of them are N and N−1, the
 * register's consecutive pair.
 */
export function protocolsFindings(value: unknown): Finding[] {
  const list = Array.isArray(value) ? value : isObject(value) && Array.isArray(value.protocols) ? value.protocols : undefined;
  const prefix = Array.isArray(value) ? "" : "/protocols";
  if (!list) return [{ code: "FAC-SEM-099", instancePath: prefix, message: "protocols is a list of protocol revisions" }];
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-099", instancePath, message });
  const byName = new Map<string, number[]>();
  const seen = new Set<string>();
  list.forEach((entry: unknown, i: number) => {
    const at = `${prefix}/${i}`;
    const parsed = parseRevision(entry);
    if (!parsed) return flag(at, "a protocol revision is <name>/<revision>, such as fabric-service/0.1");
    if (seen.has(entry as string)) return flag(at, "each protocol revision once");
    seen.add(entry as string);
    const known = PROTOCOL_REVISIONS.get(parsed.name);
    if (known && !known.includes(parsed.revision)) return flag(at, `${parsed.name} has no published revision ${parsed.revision}`);
    const indices = byName.get(parsed.name) ?? [];
    indices.push(known ? known.indexOf(parsed.revision) : -1);
    byName.set(parsed.name, indices);
    if (indices.length > MAX_REVISIONS_PER_PROTOCOL) flag(at, `at most ${MAX_REVISIONS_PER_PROTOCOL} revisions of one protocol: N and N−1`);
    else if (known && indices.length === 2 && Math.abs((indices[0] as number) - (indices[1] as number)) !== 1) flag(at, "two revisions of one protocol are N and N−1, consecutive in the register");
  });
  return findings;
}

export function protocolRules(kind: string, value: unknown): Finding[] | undefined {
  return kind === "protocols" ? protocolsFindings(value) : undefined;
}
// #endregion protocol-revisions
