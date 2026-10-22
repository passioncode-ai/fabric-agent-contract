import type { ErrorObject, ValidateFunction } from "ajv/dist/2020.js";
import { SCHEMA_PREFIX } from "./contract.js";
import { EXTENSION_KEYS } from "./extensions.js";
import { type Finding, type JsonObject, isObject, show } from "./findings.js";
import { QUEUE_FULL, utcTime } from "./job-limits.js";
import { strictTime } from "./rfc3339.js";
import { createValidatorSync } from "./validator.js";

// #region agent-network — docs: docs/specification/agent-network.md
// DEC-0104 (CT-84, S4 of the agent network): the directory a viewer discovers, the call queue at the node hosting an
// agent, and the load a service reports. The contract writes the wire and the reference functions; the hub, the node,
// the queue's storage and the panels are their products'.

type Json = JsonObject;
const list = (value: unknown): Json[] => (Array.isArray(value) ? value.filter(isObject) : []);
const isString = (value: unknown): value is string => typeof value === "string";
const PERSONAL = "personal";
/** `common.schema.json#/$defs/orgId` inside `orgContextId`: a letter or digit, then up to 127 of [A-Za-z0-9_-]. */
const ORG_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

/** One directory entry: an agent in one context, and whether its publisher lists it. */
export interface DirectoryEntry { agentRef: string; context: string; listed: boolean }
/** Who reads a directory: the estate's owner, or an organization's administrator or member. */
export type DirectoryViewer = "owner" | "admin" | "member";

const key = (entry: { agentRef: string; context: string }) => `${entry.context}\u0000${entry.agentRef}`;
const unlistedSet = (unlisted: unknown) => new Set(list(unlisted).filter((u) => isString(u.agentRef) && isString(u.context)).map((u) => key(u as unknown as DirectoryEntry)));
/** The most entries a directory carries (`agent-directory.schema.json` `entries.maxItems`); a longer one is cut here. */
export const DIRECTORY_MAX = 1024;
// Map keys are unique, so two keys never compare equal.
const sorted = (entries: Map<string, DirectoryEntry>) => [...entries.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).slice(0, DIRECTORY_MAX).map(([, entry]) => entry);
const sameEntries = (got: unknown, want: DirectoryEntry[]) =>
  Array.isArray(got) && got.length === want.length && got.every((entry, i) => isObject(entry) && Object.keys(entry).length === 3 && entry.agentRef === want[i]?.agentRef && entry.context === want[i]?.context && entry.listed === want[i]?.listed);

/**
 * An estate's directory (DEC-0104): every placement of the record's machines, once per (agentRef, context), a placement
 * without `context` in `personal`. `unlisted` is the owner's own list of (agentRef, context) it does not list; the owner
 * reads every entry, unlisted ones marked. Only the owner's sessions read it (T0, T1): no other viewer exists.
 */
export function estateDirectory(record: unknown, unlisted: unknown): DirectoryEntry[] {
  const hidden = unlistedSet(unlisted);
  const entries = new Map<string, DirectoryEntry>();
  for (const machine of list(isObject(record) ? record.machines : undefined)) {
    for (const placement of list(machine.packages)) {
      if (!isString(placement.agentRef)) continue;
      const context = isString(placement.context) ? placement.context : PERSONAL;
      const entry = { agentRef: placement.agentRef, context };
      entries.set(key(entry), { ...entry, listed: !hidden.has(key(entry)) });
    }
  }
  return sorted(entries);
}

/**
 * An organization's directory (DEC-0104): the agents its members share into `org:<orgId>` (each active share
 * registration it holds whose window holds `at`, as `decideShareRegistration` keeps them, DEC-0086), and the agents
 * its own machines run there (`own`, the `agentRef`s of its org-cloud placements, DEC-0099), once each. `unlisted` is
 * the organization's own list of `agentRef`s; an administrator reads every entry, a member only the listed ones. No
 * person, machine or grant is in an entry.
 */
export function organizationDirectory(orgId: unknown, held: unknown, own: unknown, unlisted: unknown, viewer: DirectoryViewer, at: unknown): DirectoryEntry[] {
  if (!isString(orgId) || !ORG_ID.test(orgId) || (viewer !== "admin" && viewer !== "member")) return [];
  const now = isString(at) ? strictTime(at) : Number.NaN;
  if (Number.isNaN(now)) return [];
  const context = `org:${orgId}`;
  const hidden = new Set(Array.isArray(unlisted) ? unlisted.filter(isString) : []);
  const entries = new Map<string, DirectoryEntry>();
  const add = (agentRef: string) => {
    const listed = !hidden.has(agentRef);
    if (viewer === "member" && !listed) return;
    entries.set(key({ agentRef, context }), { agentRef, context, listed });
  };
  for (const entry of list(held)) {
    if (entry.state !== "active" || !isString(entry.agentRef)) continue;
    const from = isString(entry.startsAt) ? strictTime(entry.startsAt) : Number.NaN;
    const to = isString(entry.expiresAt) ? strictTime(entry.expiresAt) : Number.NaN;
    if (from <= now && now < to) add(entry.agentRef);
  }
  for (const agentRef of Array.isArray(own) ? own.filter(isString) : []) add(agentRef);
  return sorted(entries);
}

/** FAC-SEM-130 on `{source: "estate", record, unlisted?, directory}` or `{source: "organization", orgId, held, own?, unlisted?, viewer, at, directory}`. */
function directoryRule(value: Json): Finding[] {
  const want = value.source === "estate" ? estateDirectory(value.record, value.unlisted) : value.source === "organization" ? organizationDirectory(value.orgId, value.held, value.own, value.unlisted, value.viewer as DirectoryViewer, value.at) : undefined;
  if (want === undefined) return [{ code: "FAC-SEM-130", instancePath: "/source", message: `the source is ${show(value.source)}, not estate or organization` }];
  const directory = isObject(value.directory) ? value.directory : {};
  const findings: Finding[] = [];
  if (directory.source !== value.source) findings.push({ code: "FAC-SEM-130", instancePath: "/directory/source", message: `the directory says source ${show(directory.source)}, derived from ${show(value.source)}` });
  const viewer = value.source === "estate" ? "owner" : value.viewer === "admin" || value.viewer === "member" ? value.viewer : undefined;
  if (viewer === undefined || directory.viewer !== viewer) findings.push({ code: "FAC-SEM-130", instancePath: "/directory/viewer", message: `the directory says viewer ${show(directory.viewer)}, its reader is ${show(viewer)}` });
  if (!sameEntries(directory.entries, want)) findings.push({ code: "FAC-SEM-130", instancePath: "/directory/entries", message: `the directory's entries are not the ones its ${value.source} derives: ${want.length} expected` });
  return findings;
}

// --- The call queue (fabric-interop, DEC-0104) ---

/**
 * The key of a job's caller (DEC-0104), the same caller DEC-0087's repeated-key rule keys on: for a call whose delegation
 * token the node accepted, the pair `verifyDelegation` names (`principal`, the token's `sub`, and `caller`, the outermost
 * actor); otherwise the authenticated credential the node knows the caller by (a T0 or T1 call with no token, DL-26).
 * So an owner's agent and a partner's agent under the same `sub` are two callers, and so are two people the hub forwards
 * under one credential once it attaches their tokens (DL-10). `undefined` when neither is readable. It never throws.
 */
export function jobCallerKey(accepted: unknown, credential: unknown): string | undefined {
  if (isObject(accepted) && accepted.ok === true && isString(accepted.principal) && accepted.principal !== "" && isString(accepted.caller) && accepted.caller !== "") return JSON.stringify(["delegated", accepted.principal, accepted.caller]);
  return isString(credential) && credential !== "" ? JSON.stringify(["credential", credential]) : undefined;
}

/** A job waiting at the hosting node: its id, its caller's key (`jobCallerKey`) and when it arrived. */
export interface QueuedJob { id: string; caller: string; at: string }
/** A job running: its id and caller. */
export interface RunningJob { id: string; caller: string }
/** The queue's limits per (agentRef, context), as the load extension declares them. */
export interface QueueLimits { concurrency: number; perCaller: number; queueMax: number }

const limitsOk = (limits: unknown): limits is QueueLimits => isObject(limits) && [limits.concurrency, limits.perCaller].every((n) => Number.isSafeInteger(n) && (n as number) >= 1) && Number.isSafeInteger(limits.queueMax) && (limits.queueMax as number) >= 0;

/**
 * The job the hosting node starts next for one (agentRef, context), or `undefined` (DEC-0104). Nothing starts while
 * `concurrency` jobs run. Of the waiting jobs whose caller runs fewer than `perCaller`, the one whose caller runs the
 * fewest wins (fairness: a caller with many jobs never starves one with few); between those callers, the one whose
 * oldest waiting job arrived first; within a caller, its oldest. Arrival ties break by id. It never throws.
 */
export function nextQueuedJob(queue: unknown, running: unknown, limits: unknown): string | undefined {
  if (!limitsOk(limits)) return undefined;
  // Every running job holds a slot, whether or not its caller is readable; only the per-caller counts need one.
  if ((Array.isArray(running) ? running.length : 0) >= limits.concurrency) return undefined;
  const runningOf = new Map<string, number>();
  for (const job of list(running).filter((job) => isString(job.caller))) runningOf.set(job.caller as string, (runningOf.get(job.caller as string) ?? 0) + 1);
  const waiting = list(queue)
    .filter((job): job is Json & QueuedJob => isString(job.id) && isString(job.caller) && Number.isFinite(utcTime(job.at)))
    .filter((job) => (runningOf.get(job.caller) ?? 0) < limits.perCaller)
    .sort((a, b) => utcTime(a.at) - utcTime(b.at) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  let best: (Json & QueuedJob) | undefined;
  for (const job of waiting) {
    if (best === undefined || (runningOf.get(job.caller) ?? 0) < (runningOf.get(best.caller) ?? 0)) best = job;
  }
  return best?.id;
}

/**
 * Whether a start is admitted (DEC-0104): it is when the job would start at once (`nextQueuedJob` over the queue with it
 * added answers its id), or when fewer than `queueMax` jobs wait; otherwise the start answers `queue-full` with this
 * `retryAfterSeconds` (1 to 3600, else 60). Unreadable limits or job refuse. It never throws.
 */
export function admitJob(queue: unknown, running: unknown, job: unknown, limits: unknown, retryAfterSeconds: unknown): { admit: true } | { admit: false; error: { code: typeof QUEUE_FULL; message: string; data: { retryable: true; retryAfterSeconds: number } } } {
  const waiting = list(queue);
  const readable = isObject(job) && isString(job.id) && isString(job.caller) && Number.isFinite(utcTime(job.at));
  if (limitsOk(limits) && readable && (nextQueuedJob([...waiting, job], running, limits) === job.id || waiting.length < limits.queueMax)) return { admit: true };
  const after = Number.isSafeInteger(retryAfterSeconds) && (retryAfterSeconds as number) >= 1 && (retryAfterSeconds as number) <= 3600 ? (retryAfterSeconds as number) : 60;
  return { admit: false, error: { code: QUEUE_FULL, message: "the agent's queue for this context is full: start again later", data: { retryable: true, retryAfterSeconds: after } } };
}

const QUEUED = /^queued ([1-9]\d{0,5}) of ([1-9]\d{0,5})$/;
/** The `statusMessage` of a waiting job (DEC-0104): `queued <position> of <length>`, position 1 next, 1 ≤ position ≤ length ≤ 999999, no leading zero. */
export const queueStatusMessage = (position: number, length: number): string | undefined =>
  Number.isSafeInteger(position) && Number.isSafeInteger(length) && position >= 1 && position <= length && length <= 999999 ? `queued ${position} of ${length}` : undefined;
/** A waiting job's place, read from its `statusMessage`, or `undefined` when it is not the queue's grammar. */
export function readQueuePosition(statusMessage: unknown): { position: number; length: number } | undefined {
  const match = isString(statusMessage) ? QUEUED.exec(statusMessage) : null;
  if (!match) return undefined;
  const position = Number(match[1]), length = Number(match[2]);
  return position >= 1 && position <= length ? { position, length } : undefined;
}

/** FAC-SEM-131 on `{queue, running, limits, started}` (`started`: the id the node started, or null): it is `nextQueuedJob`'s. */
function queueRule(value: Json): Finding[] {
  const want = nextQueuedJob(value.queue, value.running, value.limits) ?? null;
  if ((value.started ?? null) === want) return [];
  return [{ code: "FAC-SEM-131", instancePath: "/started", message: want === null ? "nothing may start now" : `the job to start is ${show(want)}` }];
}

// --- The load report (DEC-0104) ---

/** FAC-SEM-132 on a `service-load/1` report: windows in order one `windowSeconds` apart, none after `generatedAt`, one row per context, p50 at most p95. */
function loadRule(value: Json): Finding[] {
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-132", instancePath, message });
  const step = Number.isSafeInteger(value.windowSeconds) ? (value.windowSeconds as number) * 1000 : Number.NaN;
  const generated = isString(value.generatedAt) ? strictTime(value.generatedAt) : Number.NaN;
  let previous: number | undefined;
  list(value.windows).forEach((window, index) => {
    const start = isString(window.start) ? strictTime(window.start) : Number.NaN;
    if (start > generated) flag(`/windows/${index}/start`, "a window starts after the report was generated");
    if (previous !== undefined && start - previous !== step) flag(`/windows/${index}/start`, "windows are not in order one windowSeconds apart");
    previous = start;
    const seen = new Set<string>();
    list(window.byContext).forEach((row, at) => {
      const path = `/windows/${index}/byContext/${at}`;
      if (isString(row.context) && seen.has(row.context)) flag(`${path}/context`, `context ${show(row.context)} appears twice in one window`);
      if (isString(row.context)) seen.add(row.context);
      for (const name of ["waitMs", "runMs"] as const) {
        const pct = row[name];
        if (isObject(pct) && typeof pct.p50 === "number" && typeof pct.p95 === "number" && pct.p50 > pct.p95) flag(`${path}/${name}`, "p50 is above p95");
      }
      if (isObject(row.runMs) && row.completed === 0 && row.failed === 0) flag(`${path}/runMs`, "a run time with no job ended in the window");
    });
  });
  return findings;
}

let loadShape: ValidateFunction | undefined;
const pointerToken = (token: string) => token.replace(/~/g, "~0").replace(/\//g, "~1");

/**
 * FAC-SEM-133 on a well-known document: a value under the load extension key is valid against
 * `service-load-extension.schema.json`. A reader treats an invalid value as not declared and reports it (DEC-0104).
 */
export function loadExtensionRules(value: Json): Finding[] {
  const extensions = isObject(value.extensions) ? value.extensions : undefined;
  if (extensions === undefined || !Object.hasOwn(extensions, EXTENSION_KEYS.load)) return [];
  loadShape ??= createValidatorSync().getSchema(`${SCHEMA_PREFIX}schemas/service-load-extension.schema.json`) as ValidateFunction;
  if (loadShape(extensions[EXTENSION_KEYS.load]) === true) return [];
  const why = (loadShape.errors as ErrorObject[]).map((error) => `${error.instancePath || "/"} ${error.keyword}`).join("; ");
  return [{ code: "FAC-SEM-133", instancePath: `/extensions/${pointerToken(EXTENSION_KEYS.load)}`, message: `the load declaration is invalid (${why}); a reader treats it as not declared and reports it (DEC-0104)` }];
}

export function agentNetworkRules(kind: string, value: Json): Finding[] | undefined {
  if (kind === "agent-directory-view") return directoryRule(value);
  if (kind === "job-queue") return queueRule(value);
  if (kind === "service-load") return loadRule(value);
  return undefined;
}
// #endregion agent-network
