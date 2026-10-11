import { closeSync, constants, fstatSync, openSync, readFileSync, statSync, type Stats } from "node:fs";
import path from "node:path";
import type { ValidateFunction } from "ajv/dist/2020.js";
import { SCHEMA_PREFIX } from "./contract.js";
import { isObject, type JsonObject } from "./findings.js";
import { createValidatorSync } from "./validator.js";

// #region grant-projection — docs: docs/specification/delegation.md#the-hubs-grant-projection
/**
 * The meter's read of a grant (DEC-0041, Fabric ADR-0144 amendment 1): the hub projects every grant it holds,
 * in the standing-grant shape at its latest revision with its state, to `<grantsDir>/<meta.id>.json` (0600 in a
 * 0700 directory, written atomically). The meter looks up the grant its verified onward token names and answers
 * `ok` or one refusal. The file authorises nothing alone: it is read only after `verifyMeterToken` accepted.
 */

/** The refusals a projected grant can answer (a subset of the contract's one code set, DL-19). */
export type ProjectionRefusalCode = "no-grant" | "grant-revoked" | "grant-expired" | "unknown-state";
export interface ProjectionRefusal { ok: false; code: ProjectionRefusalCode; detail: string }
export interface ProjectedGrant { ok: true; grant: JsonObject; ref: string; file: string }

/** A grant id the hub projects: it is the file's name, so no separator, no leading dot, at most 200 characters. */
export const PROJECTED_GRANT_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
/** A projected grant file is small; anything larger is not one. */
export const MAX_PROJECTED_GRANT_BYTES = 1_048_576;

const refuse = (code: ProjectionRefusalCode, detail: string): ProjectionRefusal => ({ ok: false, code, detail });

/** `<meta.id>#<meta.revision>` (DL-4), or `undefined` when the reference names no grant this profile can project. */
export function parseGrantRef(ref: string): { id: string; revision: number } | undefined {
  const match = /^([^#]+)#(0|[1-9][0-9]{0,15})$/.exec(ref);
  if (!match || !PROJECTED_GRANT_ID.test(match[1] as string)) return undefined;
  const revision = Number(match[2]);
  return Number.isSafeInteger(revision) ? { id: match[1] as string, revision } : undefined;
}

/** The file the hub writes a grant to. */
export const projectedGrantFile = (grantsDir: string, id: string): string => path.join(grantsDir, `${id}.json`);

const errno = (error: unknown): string | undefined => (isObject(error) && typeof error.code === "string" ? error.code : undefined);

/** Only its owner may read or write the directory and the file: 0700 and 0600, no group or other bit, owned by this user. */
function looseOrForeign(stats: Stats): string | undefined {
  if ((stats.mode & 0o077) !== 0) return "loose-permissions";
  const uid = process.getuid?.();
  if (uid !== undefined && stats.uid !== uid) return "foreign-owner";
  return undefined;
}

/** An RFC 3339 date-time with `Z` or a numeric offset; a local time or any other date string is not one. */
const RFC3339 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
const timeOf = (value: unknown): number | undefined => {
  if (typeof value !== "string" || !RFC3339.test(value)) return undefined;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms / 1000 : undefined;
};

let standingGrant: ValidateFunction | undefined;
/** The contract's standing-grant schema (`governance.schema.json#/$defs/grant`), compiled on the first read. */
function standingGrantShape(): ValidateFunction {
  standingGrant ??= createValidatorSync().getSchema(`${SCHEMA_PREFIX}schemas/governance.schema.json#/$defs/grant`) as ValidateFunction;
  return standingGrant;
}

/**
 * Read the hub's projection of the grant a token names. The order is fixed:
 *
 * 1. a reference that names no projectable grant is `no-grant`, and nothing is read; on Windows the answer is
 *    `unknown-state` (`unsupported-platform`): the profile is POSIX-only in 0.1;
 * 2. no directory, or one that is not the owner's alone, is `unknown-state`;
 * 3. no file is `no-grant` (the hub holds no such grant); an unreadable, oversized or loosely permitted file, a
 *    link or anything but a regular file, a file outside the standing-grant shape, or a file for another grant,
 *    is `unknown-state`;
 * 4. a projection at an earlier revision than the token's is `unknown-state` (the hub has not written it yet);
 * 5. `revoked` is `grant-revoked`, `expired` is `grant-expired`, any other state but `active` `unknown-state`;
 * 6. a later revision than the token's is `no-grant`: the grant the token was minted under is no longer the live one;
 * 7. an active grant past its `expiresAt` is `grant-expired`, one before its `startsAt` `no-grant`.
 *
 * `now` is in seconds since the epoch, like a JWT NumericDate.
 */
export function readProjectedGrant(grantsDir: string, ref: string, options: { now?: number; platform?: NodeJS.Platform } = {}): ProjectedGrant | ProjectionRefusal {
  const now = options.now ?? Math.floor(Date.now() / 1000);
  const named = parseGrantRef(ref);
  if (!named) return refuse("no-grant", "malformed-reference");
  // Windows has no owner-only mode bits to check and no O_NOFOLLOW; where its files live is not decided (DL-23).
  if ((options.platform ?? process.platform) === "win32") return refuse("unknown-state", "unsupported-platform");
  const dir = path.resolve(grantsDir);
  // The id grammar admits no separator and no leading dot, so the file is always directly inside the directory.
  const file = projectedGrantFile(dir, named.id);

  let dirStats: Stats;
  try {
    dirStats = statSync(dir);
  } catch (error) {
    return refuse("unknown-state", errno(error) === "ENOENT" ? "no-projection" : "unreadable");
  }
  if (!dirStats.isDirectory()) return refuse("unknown-state", "no-projection");
  const dirProblem = looseOrForeign(dirStats);
  if (dirProblem) return refuse("unknown-state", dirProblem);

  // One open, then every check on what was opened: no window to swap the path for a link or a FIFO between a
  // check and the read. O_NOFOLLOW refuses a link (ELOOP); O_NONBLOCK keeps a FIFO from hanging the meter.
  let fd: number;
  try {
    fd = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  } catch (error) {
    const code = errno(error);
    return code === "ENOENT" ? refuse("no-grant", "not-projected") : refuse("unknown-state", code === "ELOOP" ? "not-a-file" : "unreadable");
  }
  let text: string;
  try {
    const fileStats = fstatSync(fd);
    // The hub renames a regular file into place; a link or anything else is not its projection.
    if (!fileStats.isFile()) return refuse("unknown-state", "not-a-file");
    const fileProblem = looseOrForeign(fileStats);
    if (fileProblem) return refuse("unknown-state", fileProblem);
    if (fileStats.size > MAX_PROJECTED_GRANT_BYTES) return refuse("unknown-state", "malformed-file");
    text = readFileSync(fd, "utf8");
  } catch {
    return refuse("unknown-state", "unreadable");
  } finally {
    closeSync(fd);
  }

  let grant: unknown;
  try {
    grant = JSON.parse(text);
  } catch {
    return refuse("unknown-state", "malformed-file");
  }
  // The standing-grant shape (DL-23), with the state left to its own rows below: a state this contract does not
  // name is `unknown-grant-state`, not a malformed file.
  if (!isObject(grant) || typeof grant.state !== "string" || !standingGrantShape()({ ...grant, state: "active" })) return refuse("unknown-state", "malformed-file");
  const { id, revision } = grant.meta as JsonObject;
  if (typeof id !== "string" || typeof revision !== "number" || !Number.isSafeInteger(revision) || revision < 0) return refuse("unknown-state", "malformed-file");
  const startsAt = timeOf(grant.startsAt);
  const expiresAt = timeOf(grant.expiresAt);
  if (startsAt === undefined || expiresAt === undefined) return refuse("unknown-state", "malformed-file");
  if (id !== named.id) return refuse("unknown-state", "another-grant");
  if (revision < named.revision) return refuse("unknown-state", "projection-behind");

  if (grant.state === "revoked") return refuse("grant-revoked", "revoked");
  if (grant.state === "expired") return refuse("grant-expired", "expired");
  if (grant.state !== "active") return refuse("unknown-state", "unknown-grant-state");
  if (revision > named.revision) return refuse("no-grant", "revised");
  if (now >= expiresAt) return refuse("grant-expired", "expired");
  if (now < startsAt) return refuse("no-grant", "not-started");
  return { ok: true, grant, ref, file };
}

/** A projection refusal as the meter's answer (`grant-check.schema.json#/$defs/denied`): no level was reached. */
export function projectionDenial(refusal: ProjectionRefusal, now: number): { decision: "denied"; level: null; code: ProjectionRefusalCode; reason: string; checkedAt: string } {
  return { decision: "denied", level: null, code: refusal.code, reason: `the hub's projection of the grant: ${refusal.detail}`, checkedAt: new Date(now * 1000).toISOString() };
}
// #endregion grant-projection
