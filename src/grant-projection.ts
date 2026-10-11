import { lstatSync, readFileSync, statSync, type Stats } from "node:fs";
import path from "node:path";
import { isObject, type JsonObject } from "./findings.js";

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
const posix = process.platform !== "win32";

/** Only its owner may read or write the directory and the file: 0700 and 0600, no group or other bit, owned by this user. */
function looseOrForeign(stats: Stats): string | undefined {
  if (!posix) return undefined;
  if ((stats.mode & 0o077) !== 0) return "loose-permissions";
  const uid = process.getuid?.();
  if (uid !== undefined && stats.uid !== uid) return "foreign-owner";
  return undefined;
}

const timeOf = (value: unknown): number | undefined => {
  if (typeof value !== "string") return undefined;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms / 1000 : undefined;
};

/**
 * Read the hub's projection of the grant a token names. The order is fixed:
 *
 * 1. a reference that names no projectable grant is `no-grant`, and nothing is read;
 * 2. no directory, or one that is not the owner's alone, is `unknown-state`;
 * 3. no file is `no-grant` (the hub holds no such grant); an unreadable, oversized, malformed or loosely
 *    permitted file, or a file for another grant, is `unknown-state`;
 * 4. a projection at an earlier revision than the token's is `unknown-state` (the hub has not written it yet);
 * 5. `revoked` is `grant-revoked`, `expired` is `grant-expired`, any other state but `active` `unknown-state`;
 * 6. a later revision than the token's is `no-grant`: the grant the token was minted under is no longer the live one;
 * 7. an active grant past its `expiresAt` is `grant-expired`, one before its `startsAt` `no-grant`.
 *
 * `now` is in seconds since the epoch, like a JWT NumericDate.
 */
export function readProjectedGrant(grantsDir: string, ref: string, options: { now?: number } = {}): ProjectedGrant | ProjectionRefusal {
  const now = options.now ?? Math.floor(Date.now() / 1000);
  const named = parseGrantRef(ref);
  if (!named) return refuse("no-grant", "malformed-reference");
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

  let fileStats: Stats;
  try {
    fileStats = lstatSync(file);
  } catch (error) {
    return errno(error) === "ENOENT" ? refuse("no-grant", "not-projected") : refuse("unknown-state", "unreadable");
  }
  // The hub renames a regular file into place; a link or anything else is not its projection.
  if (!fileStats.isFile()) return refuse("unknown-state", "not-a-file");
  const fileProblem = looseOrForeign(fileStats);
  if (fileProblem) return refuse("unknown-state", fileProblem);
  if (fileStats.size > MAX_PROJECTED_GRANT_BYTES) return refuse("unknown-state", "malformed-file");

  let grant: unknown;
  try {
    grant = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    return refuse("unknown-state", error instanceof SyntaxError ? "malformed-file" : "unreadable");
  }
  if (!isObject(grant) || grant.kind !== "standing-grant" || !isObject(grant.meta) || typeof grant.state !== "string") return refuse("unknown-state", "malformed-file");
  const { id, revision } = grant.meta;
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
