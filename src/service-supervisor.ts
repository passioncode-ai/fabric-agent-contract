import { type Finding, type JsonObject, isObject } from "./findings.js";

// #region supervisor-marker — docs: docs/specification/service.md#one-copy
/**
 * One copy under a supervisor (DEC-0057, CT-01). A copy that cannot take `service.lock` exits 75 naming the holder;
 * a copy its supervisor started, and that says so with the supervisor marker, may first wait for the lock, touching
 * nothing, for at most 300 s. The marker is the environment variable or the argument below — never the parent
 * process — because a Scheduled Task's action carries no environment (its `Exec` element has `Command`, `Arguments`
 * and `WorkingDirectory` only).
 */
export const SUPERVISOR_ENV = "FABRIC_SERVICE_SUPERVISOR";
export const SUPERVISOR_ARG = "--fabric-supervisor";
/** The managers a marker may name: the three systems' supervisors and Project Observatory's node. */
export const SUPERVISORS: readonly string[] = ["launchd", "systemd", "task-scheduler", "node"];
/** The longest a marked copy may wait for the lock before it exits 75. */
export const LOCK_WAIT_MAX_MS = 300_000;
/** The exit status of a copy that does not run because another holds the lock (sysexits `EX_TEMPFAIL`). */
export const EXIT_ALREADY_RUNNING = 75;

export type MarkerForm = "environment" | "argument";
export type SupervisorMarker =
  | { kind: "supervised"; manager: string; forms: MarkerForm[] }
  | { kind: "manual"; unreadable?: string; forms: MarkerForm[] }
  | { kind: "conflict"; values: string[]; forms: MarkerForm[] };

/** The marker values an argument vector carries: `--fabric-supervisor <m>` or `--fabric-supervisor=<m>`, after the executable and before `--`. */
function argumentValues(argv: unknown): string[] {
  if (!Array.isArray(argv)) return [];
  const values: string[] = [];
  for (let index = 1; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--") break;
    if (item === SUPERVISOR_ARG) {
      const next = argv[index + 1];
      values.push(typeof next === "string" ? next : "");
      index += 1;
    } else if (typeof item === "string" && item.startsWith(`${SUPERVISOR_ARG}=`)) {
      values.push(item.slice(SUPERVISOR_ARG.length + 1));
    }
  }
  return values;
}

/**
 * How a copy was started, read from its environment and argument vector (DEC-0057):
 *
 * - `supervised`: every marker present names the same manager, one of `SUPERVISORS`;
 * - `conflict`: the markers present name different values — the copy is unsupervised and exits 75 at once, naming
 *   the conflict, before it takes the lock;
 * - `manual`: no marker (an empty environment value counts as none), or one that names no manager (`unreadable`).
 */
export function supervisorMarker(start: unknown): SupervisorMarker {
  const declared = isObject(start) ? start : {};
  const env = isObject(declared.env) ? declared.env : {};
  const fromEnv = Object.hasOwn(env, SUPERVISOR_ENV) && typeof env[SUPERVISOR_ENV] === "string" && env[SUPERVISOR_ENV] !== "" ? [env[SUPERVISOR_ENV] as string] : [];
  const fromArgs = argumentValues(declared.argv);
  const forms: MarkerForm[] = [...(fromEnv.length > 0 ? ["environment" as const] : []), ...(fromArgs.length > 0 ? ["argument" as const] : [])];
  const values = [...new Set([...fromEnv, ...fromArgs])];
  if (values.length > 1) return { kind: "conflict", values, forms };
  const [value] = values;
  if (value === undefined) return { kind: "manual", forms };
  return SUPERVISORS.includes(value) ? { kind: "supervised", manager: value, forms } : { kind: "manual", unreadable: value, forms };
}

/** How long a copy started so may wait for the lock: 300 s when supervised, else not at all. */
export function lockWaitBudgetMs(marker: SupervisorMarker): number {
  return marker.kind === "supervised" ? LOCK_WAIT_MAX_MS : 0;
}

const count = (value: unknown, integer: boolean) => typeof value === "number" && Number.isFinite(value) && value >= 0 && (!integer || Number.isInteger(value));
const namesPid = (message: string, pid: number) => new RegExp(`(?<!\\d)${pid}(?!\\d)`).test(message);

/**
 * FAC-SEM-078 (DEC-0057): what a copy did when it started and the lock was held, as a kit's test records it —
 * `{ start: {env, argv}, holderPid, attempts, waitedMs, sideEffects, outcome: {acquired: true} | {exitStatus, message} }`.
 * `attempts` counts tries at the lock, `waitedMs` the time spent waiting for it, `sideEffects` what the copy did before
 * it held the lock. A copy touches nothing without the lock; an unmarked one tries once and does not wait; a marked one
 * waits at most 300 s; a conflicting marker never reaches the lock; a copy that does not get the lock exits 75 with a
 * sentence naming the holder's pid (or, for a conflict, the marker forms present).
 */
export function lockOutcomeRules(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const push = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-078", instancePath, message });
  const marker = supervisorMarker(value.start);

  if (value.sideEffects !== undefined && !Array.isArray(value.sideEffects)) push("/sideEffects", "the side effects before the lock are unreadable");
  (Array.isArray(value.sideEffects) ? value.sideEffects : []).forEach((effect, index) => {
    push(`/sideEffects/${index}`, `a copy touches nothing before it holds the lock; it did: ${typeof effect === "string" ? effect : "an unnamed effect"}`);
  });

  const attemptsReadable = count(value.attempts, true);
  const waitedReadable = count(value.waitedMs, false);
  if (!attemptsReadable) push("/attempts", "the number of tries at the lock is unreadable");
  if (!waitedReadable) push("/waitedMs", "the time waited for the lock is unreadable");
  const attempts = attemptsReadable ? (value.attempts as number) : Number.NaN;
  const waited = waitedReadable ? (value.waitedMs as number) : Number.NaN;

  if (marker.kind === "conflict") {
    if (attemptsReadable && attempts !== 0) push("/attempts", `markers that disagree (${marker.values.join(", ")}) never reach the lock`);
    if (waitedReadable && waited !== 0) push("/waitedMs", "a copy whose markers disagree exits at once");
  } else if (marker.kind === "manual") {
    if (attemptsReadable && attempts !== 1) push("/attempts", "a copy started without the supervisor marker tries the lock once");
    if (waitedReadable && waited !== 0) push("/waitedMs", "a copy started without the supervisor marker exits at once; only a supervised copy waits");
  } else {
    if (attemptsReadable && attempts < 1) push("/attempts", "a supervised copy tries the lock at least once");
    if (waitedReadable && waited > LOCK_WAIT_MAX_MS) push("/waitedMs", `a supervised copy waits at most ${LOCK_WAIT_MAX_MS / 1000} s, not ${waited / 1000} s`);
  }

  const outcome = isObject(value.outcome) ? value.outcome : undefined;
  if (outcome === undefined) {
    push("/outcome", "the outcome is unreadable");
    return findings;
  }
  if (outcome.acquired === true) {
    if (marker.kind === "conflict") push("/outcome/acquired", "a copy whose markers disagree never takes the lock");
    return findings;
  }
  if (outcome.exitStatus !== EXIT_ALREADY_RUNNING) push("/outcome/exitStatus", `a copy that does not hold the lock exits ${EXIT_ALREADY_RUNNING}`);
  const message = typeof outcome.message === "string" ? outcome.message : "";
  if (marker.kind === "conflict") {
    const named = marker.forms.every((form) => message.includes(form === "environment" ? SUPERVISOR_ENV : SUPERVISOR_ARG));
    if (!named) push("/outcome/message", `the sentence names the conflicting markers (${marker.forms.map((form) => (form === "environment" ? SUPERVISOR_ENV : SUPERVISOR_ARG)).join(" and ")})`);
  } else if (!count(value.holderPid, true) || (value.holderPid as number) < 1) {
    push("/holderPid", "the holder's pid is unreadable");
  } else if (!namesPid(message, value.holderPid as number)) {
    push("/outcome/message", `the sentence names the holder's pid ${value.holderPid as number}`);
  }
  return findings;
}
// #endregion supervisor-marker
