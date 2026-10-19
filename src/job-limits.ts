import { createHash } from "node:crypto";
import { rfc8785 } from "./canonical.js";
import { type Finding, type JsonObject, isObject, jsonEqual } from "./findings.js";
import { strictTime } from "./rfc3339.js";

// #region job-limits, docs: docs/specification/interop.md#limits-and-uncertain-effects
/**
 * Jobs under limits and uncertain effects (DEC-0087, OQ-0012): a job a limit stopped ends `failed` with
 * `quota-exhausted`, a job a limit paused stays `working` with a `statusMessage` in the pause grammar, a job whose effect
 * may have happened ends `failed` with `outcome-unknown`, and a caller answers each with one act (`jobCallerAction`)
 * and resends only under the key its intent derives (`intentIdempotencyKey`). A job's `usage` writes unknown as `null`.
 * Every function here answers and never throws: malformed input is an answer.
 */
export const QUOTA_EXHAUSTED = "quota-exhausted";
export const OUTCOME_UNKNOWN = "outcome-unknown";
/** DL-19's refusal of an exhausted spend window (delegation.md), relayed unchanged with its approval request. */
export const LIMIT_REACHED = "limit-reached";
/** The `fabric-interop` revision whose readers accept `null` and `partial` in `usage` (DEC-0087). */
export const INTEROP_NULL_USAGE = "fabric-interop/0.2";
/** The MCP Task states a job takes (interop.md C3.2). */
export const JOB_STATUSES: readonly string[] = ["working", "input_required", "completed", "failed", "cancelled"];
/**
 * `interop-common#/$defs/utcInstant`: RFC 3339 in UTC, `T` and `Z` upper-case, seconds 00 to 59, at most three fraction
 * digits, so every port compares the same instants at millisecond precision (DEC-0085's rule).
 */
const UTC_INSTANT = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-5][0-9](?:\.[0-9]{1,3})?Z$/;
/**
 * The pause grammar of a `working` job's `statusMessage`: `quota-exhausted`, an optional ` until <UTC instant>`, an
 * optional colon, a space and a text that holds at least one character other than ASCII white space (space, tab, line
 * feed, carriage return), so every regular-expression engine reads it alike.
 */
const PAUSE = /^quota-exhausted(?: until ([^ \t\n\r]+?))?(?:: ([ \t\n\r]*[^ \t\n\r][\s\S]*))?$/;
const ERROR_CODE = /^[a-z][a-z0-9-]{1,63}$/;
/** `interop-job#/$defs/job/properties/statusMessage`: JSON Schema's `maxLength` counts code points, not UTF-16 units. */
const MAX_STATUS_MESSAGE = 500;
/** `interop-common#/$defs/error/properties/message`. */
const MAX_ERROR_MESSAGE = 2000;
const codePoints = (value: string) => [...value].length;
/** The counts and the cost of `common#/$defs/usage`, each a non-negative number or `null` for unknown. */
export const USAGE_NUMBERS: readonly string[] = ["inputTokens", "outputTokens", "cacheReadTokens", "cacheWriteTokens", "costUsd", "wallMs"];

const isString = (value: unknown): value is string => typeof value === "string";
const own = (value: unknown, key: string): unknown => (isObject(value) && Object.hasOwn(value, key) ? value[key] : undefined);
/** A UTC instant as milliseconds, or NaN: the pattern and a day that exists (`strictTime`). */
const utcTime = (value: unknown): number => (isString(value) && UTC_INSTANT.test(value) ? strictTime(value) : Number.NaN);

/** Whether `data` is `quota-exhausted`'s: closed, `retryable` a boolean, `resetsAt` a UTC instant and only with `retryable: true`. */
export function quotaDataOk(data: unknown): data is { retryable: boolean; resetsAt?: string } {
  const retryable = own(data, "retryable");
  if (!isObject(data) || typeof retryable !== "boolean") return false;
  if (Object.keys(data).some((name) => name !== "retryable" && name !== "resetsAt")) return false;
  if (!Object.hasOwn(data, "resetsAt")) return true;
  return retryable && Number.isFinite(utcTime(own(data, "resetsAt")));
}

/** The job inside a `fabric.job.get` or `fabric.job.cancel` answer (`{job}`), when it has an id and a known status. */
function jobOf(answer: unknown): JsonObject | undefined {
  const job = own(answer, "job");
  const id = own(job, "id");
  if (!isObject(job) || !isString(id) || id.length === 0 || !JOB_STATUSES.includes(own(job, "status") as string)) return undefined;
  return job;
}

export type JobPause = { paused: false } | { paused: true; resetsAt?: string } | { paused: false; malformed: true };

/**
 * Whether a `fabric.job.get` answer (`{job}`) is a job a limit paused (DEC-0087 item 2): status `working`, its
 * `statusMessage` `quota-exhausted`, `quota-exhausted until <UTC instant>`, either followed by `: <text>`.
 * A `working` job whose message starts `quota-exhausted` and breaks the grammar (an instant that is not UTC or names no
 * day or carries more than three fraction digits, a blank text, more than 500 code points) is `malformed`. Any other
 * answer is not paused.
 */
export function readJobPause(answer: unknown): JobPause {
  const job = jobOf(answer);
  const message = own(job, "statusMessage");
  if (!job || own(job, "status") !== "working" || !isString(message) || !message.startsWith(QUOTA_EXHAUSTED)) return { paused: false };
  const match = PAUSE.exec(message);
  if (!match || codePoints(message) > MAX_STATUS_MESSAGE) return { paused: false, malformed: true };
  const [, until] = match;
  if (until === undefined) return { paused: true };
  return Number.isFinite(utcTime(until)) ? { paused: true, resetsAt: until } : { paused: false, malformed: true };
}

export type CallerAct = "poll" | "wait" | "answer" | "done" | "cancelled" | "resend" | "person" | "reconcile" | "failed" | "invalid";
export interface CallerAction {
  action: CallerAct;
  notBefore?: string;
}

/**
 * What a caller does with one `fabric.job.get` or `fabric.job.cancel` answer (`{job}`) at `now`, a UTC instant (DEC-0087
 * item 4). It never answers "submit anew": a resend reuses the intent's key (`intentIdempotencyKey`).
 *
 * - `working`: `wait` when a limit paused it and its reset (`notBefore`) is after `now` or not given; otherwise `poll`;
 * - `input_required`: `answer`; `completed`: `done`; `cancelled`: `cancelled`;
 * - `failed` with `quota-exhausted`: `resend` under the same key when `retryable`, with `notBefore` its `resetsAt` when
 *   that is after `now`; `person` when not retryable;
 * - `failed` with `outcome-unknown`: `reconcile`, observe whether the effect happened, never a new key;
 * - `failed` with `limit-reached` (DL-19, an exhausted spend window): `person`, its approval request reaches the operator,
 *   and after the approval a resend under the same key;
 * - `failed` with any other code: `failed`;
 * - `invalid`: `now` unreadable, an answer that is not `{job}` with an id and a status, a `failed` job whose `error` is
 *   not `{code, message, data?}` with a non-empty message, `quota-exhausted` data that is not its schema's, or a
 *   malformed pause. On `invalid` a caller sends nothing new: it keeps polling a `working` job and reports any other
 *   answer as malformed.
 *
 * It never throws.
 */
export function jobCallerAction(answer: unknown, now: unknown): CallerAction {
  const at = utcTime(now);
  const job = jobOf(answer);
  if (!Number.isFinite(at) || !job) return { action: "invalid" };
  const status = own(job, "status");
  if (status === "working") {
    const pause = readJobPause(answer);
    if ("malformed" in pause) return { action: "invalid" };
    if (!pause.paused) return { action: "poll" };
    if (pause.resetsAt === undefined) return { action: "wait" };
    return utcTime(pause.resetsAt) > at ? { action: "wait", notBefore: pause.resetsAt } : { action: "poll" };
  }
  if (status === "input_required") return { action: "answer" };
  if (status === "completed") return { action: "done" };
  if (status === "cancelled") return { action: "cancelled" };
  const error = own(job, "error");
  const code = own(error, "code");
  const message = own(error, "message");
  const codeOk = (isString(code) && ERROR_CODE.test(code)) || Number.isInteger(code);
  const shapeOk = isObject(error) && Object.keys(error).every((name) => name === "code" || name === "message" || name === "data");
  if (!shapeOk || !codeOk || !isString(message) || message.length === 0 || codePoints(message) > MAX_ERROR_MESSAGE) return { action: "invalid" };
  if (code === OUTCOME_UNKNOWN) return { action: "reconcile" };
  if (code === LIMIT_REACHED) return { action: "person" };
  if (code !== QUOTA_EXHAUSTED) return { action: "failed" };
  const data = own(error, "data");
  if (!quotaDataOk(data)) return { action: "invalid" };
  if (!data.retryable) return { action: "person" };
  return data.resetsAt !== undefined && utcTime(data.resetsAt) > at ? { action: "resend", notBefore: data.resetsAt } : { action: "resend" };
}

/**
 * The idempotency key of an intent (DEC-0087 item 5): `{agentId, capability, input, request?}`, each of `agentId` and
 * `capability` a non-empty string, `input` an object, `request` (the principal's request, when one principal asks twice
 * for the same input on purpose) a string of 1 to 256 characters, nothing else. The key is a UUID of version 8 (RFC 9562
 * §5.5, §5.8): the first 16 bytes of the SHA-256 of the intent's RFC 8785 form, `ver` set to 8 and `var` to `0b10`,
 * written in lower-case hex 8-4-4-4-12. So the same intent gives the same key on every resend, on every machine and
 * after a restart; never a clock or a random value. Undefined for an intent of another shape or an input with no
 * RFC 8785 form (a non-finite number, a lone surrogate, a value that is not JSON).
 */
export function intentIdempotencyKey(intent: unknown): string | undefined {
  if (!isObject(intent) || Object.keys(intent).some((name) => !["agentId", "capability", "input", "request"].includes(name))) return undefined;
  const [agentId, capability, input, request] = ["agentId", "capability", "input", "request"].map((name) => own(intent, name));
  if (!isString(agentId) || agentId.length === 0 || !isString(capability) || capability.length === 0 || !isObject(input)) return undefined;
  if (Object.hasOwn(intent, "request") && (!isString(request) || request.length === 0 || codePoints(request) > 256)) return undefined;
  let form: string;
  try {
    form = rfc8785(Object.hasOwn(intent, "request") ? { agentId, capability, input, request } : { agentId, capability, input });
  } catch {
    return undefined;
  }
  const bytes = createHash("sha256").update(form, "utf8").digest().subarray(0, 16);
  bytes.writeUInt8((bytes.readUInt8(6) & 0x0f) | 0x80, 6);
  bytes.writeUInt8((bytes.readUInt8(8) & 0x3f) | 0x80, 8);
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Whether a provider may write `null` and `partial` in a job's `usage` toward this caller (DEC-0087, the gate): only when
 * the request's `_meta.protocols` (DEC-0067) names `fabric-interop/0.2`. A caller that names no revision reads
 * `fabric-interop/0.1`, whose `usage` holds numbers only; toward it a provider writes the lower bound it measured, as
 * before. It never throws.
 */
export function readsNullUsage(requestMeta: unknown): boolean {
  const protocols = own(requestMeta, "protocols");
  return Array.isArray(protocols) && protocols.includes(INTEROP_NULL_USAGE);
}

// ---- Rules -------------------------------------------------------------------------------------------------------

/** FAC-SEM-119 on a `usage`: `partial: false` asserts every number known, so it stands beside no `null`. */
export function usageFindings(usage: unknown, at: string): Finding[] {
  if (!isObject(usage) || usage.partial !== false) return [];
  const unknown = USAGE_NUMBERS.filter((name) => Object.hasOwn(usage, name) && usage[name] === null);
  if (unknown.length === 0) return [];
  return [{ code: "FAC-SEM-119", instancePath: `${at}/partial`, message: `partial is false while ${unknown.join(", ")} is null: an unknown number makes the usage partial` }];
}

/** FAC-SEM-119 on a job answer (`{job}`): the pause grammar, `quota-exhausted`'s instant on a day that exists, the result's usage. */
function jobFindings(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  if ("malformed" in readJobPause(value)) {
    findings.push({ code: "FAC-SEM-119", instancePath: "/job/statusMessage", message: "a working job's message that starts quota-exhausted reads `quota-exhausted`, `quota-exhausted until <UTC instant>`, then optionally `: <text>`, at most 500 characters" });
  }
  const error = own(own(value, "job"), "error");
  const data = own(error, "data");
  if (own(error, "code") === QUOTA_EXHAUSTED && isString(own(data, "resetsAt")) && !Number.isFinite(utcTime(own(data, "resetsAt")))) {
    findings.push({ code: "FAC-SEM-119", instancePath: "/job/error/data/resetsAt", message: "resetsAt is a UTC instant on a day that exists" });
  }
  findings.push(...usageFindings(own(own(own(value, "job"), "result"), "usage"), "/job/result/usage"));
  return findings;
}

/**
 * The rules of DEC-0087: `FAC-SEM-119` (kinds `interop-job`, a `fabric.job.get` answer, and `usage`, one usage object),
 * `FAC-SEM-120` (kind `job-caller`, `{answer, now, action}`: an implementation's act equals `jobCallerAction`'s).
 */
export function jobLimitRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (kind === "interop-job") return jobFindings(value);
  if (kind === "usage") return usageFindings(value, "");
  if (kind === "job-caller") {
    const expected = jobCallerAction(value.answer, value.now);
    if (jsonEqual(value.action, expected)) return [];
    return [{ code: "FAC-SEM-120", instancePath: "/action", message: `the caller answers ${JSON.stringify(expected)} as jobCallerAction does` }];
  }
  return undefined;
}
// #endregion job-limits
