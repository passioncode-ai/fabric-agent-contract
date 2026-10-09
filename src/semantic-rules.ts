import { type Finding, type JsonObject, isObject } from "./findings.js";
import { interopRules } from "./interop-rules.js";
import { registryRules } from "./registry-rules.js";
import { feedRequestRules } from "./service-feed.js";
import { settingsBackupRules } from "./settings-backup.js";
import { routeRules } from "./route-rules.js";
import { activityRules } from "./activity-rules.js";
import { deviceRules } from "./device-rules.js";

export type { Finding } from "./findings.js";

export function evaluateSemanticRules(kind: string, value: unknown): Finding[] {
  const registry = registryRules(kind, value);
  if (registry) return registry;
  if (!isObject(value)) return [{ code: "FAC-SEM-000", instancePath: "", message: "value must be an object" }];
  const interop = interopRules(kind, value);
  if (interop) return interop;
  const route = routeRules(kind, value);
  if (route) return route;
  const activity = activityRules(kind, value);
  if (activity) return activity;
  const device = deviceRules(kind, value);
  if (device) return device;
  const findings: Finding[] = [];

  if (kind === "result" && value.outcome === "succeeded" && Array.isArray(value.notVerified) && value.notVerified.length > 0) {
    findings.push({ code: "FAC-SEM-001", instancePath: "/notVerified", message: "succeeded result cannot retain unverified required claims" });
  }
  if (kind === "execution-bundle") {
    const pool = isObject(value.pool) && Array.isArray(value.pool.accounts) ? value.pool.accounts : [];
    const selected = isObject(value.context) ? value.context.selectedAccount : undefined;
    const refs = pool.filter(isObject).map((item) => item.accountRef);
    if (selected !== undefined && !refs.includes(selected)) findings.push({ code: "FAC-SEM-002", instancePath: "/context/selectedAccount", message: "selected account is outside the pinned project pool" });
  }
  if (kind === "learning" && value.selfApply !== false) findings.push({ code: "FAC-SEM-003", instancePath: "/selfApply", message: "learning proposal cannot apply itself" });
  if (kind === "promotion") {
    const disallowed = new Set(["personal", "credential", "regulated"]);
    if (disallowed.has(String(value.classification))) findings.push({ code: "FAC-SEM-004", instancePath: "/classification", message: "sensitive raw content cannot promote globally" });
  }
  if (kind === "roles" && Array.isArray(value.assignments)) {
    const active = value.assignments.filter(isObject).filter((item) => item.active === true);
    const ceos = active.filter((item) => item.role === "ceo");
    if (ceos.length !== 1) findings.push({ code: "FAC-SEM-005", instancePath: "/assignments", message: "estate requires exactly one active CEO" });
    const projects = new Set(active.filter((item) => item.role === "product-manager" && isObject(item.scope)).map((item) => (item.scope as JsonObject).project));
    for (const project of projects) {
      const managers = active.filter((item) => item.role === "product-manager" && isObject(item.scope) && item.scope.project === project);
      if (managers.length !== 1) findings.push({ code: "FAC-SEM-006", instancePath: "/assignments", message: `project ${String(project)} requires exactly one active product manager` });
    }
  }
  if (kind === "coordination" && value.kind === "renew" && value.claim === undefined) findings.push({ code: "FAC-SEM-007", instancePath: "/claim", message: "renew requires a claim reference" });
  if (kind === "binding-bundle" && isObject(value.admission) && value.admission.state !== "admitted") findings.push({ code: "FAC-SEM-008", instancePath: "/admission/state", message: "only an admitted provider revision can be bound" });

  if (kind === "service-observation") findings.push(...serviceIdentity(value));
  if (kind === "service-directory") findings.push(...serviceClaims(value));
  if (kind === "service-well-known" && value.status === "ready" && Array.isArray(value.degraded) && value.degraded.length > 0) {
    findings.push({ code: "FAC-SEM-011", instancePath: "/status", message: "a ready service cannot report degraded sources" });
  }
  if (kind === "service-descriptor") findings.push(...serviceCommands(value), ...remoteShape(value));
  if (kind === "service-usage") findings.push(...usageArithmetic(value), ...usageLimits(value));
  if (kind === "service-feed-request") findings.push(...feedRequestRules(value));
  if (kind === "settings-backup") findings.push(...settingsBackupRules(value));
  if (kind === "comms-submit") findings.push(...commsSubmit(value));
  if (kind === "comms-transition") findings.push(...commsTransition(value));

  return findings;
}

const serviceKey = (value: JsonObject) => `${String(value.id)}.${String(value.instance ?? "default")}`;

function serviceIdentity(value: JsonObject): Finding[] {
  const descriptor = isObject(value.descriptor) ? value.descriptor : {};
  const answered = isObject(value.wellKnown) && isObject(value.wellKnown.service) ? value.wellKnown.service : {};
  if (serviceKey(descriptor) === serviceKey(answered)) return [];
  return [{ code: "FAC-SEM-009", instancePath: "/wellKnown/service", message: `${String(descriptor.origin)} answers as ${serviceKey(answered)}, not ${serviceKey(descriptor)}` }];
}

function serviceClaims(value: JsonObject): Finding[] {
  const descriptors = Array.isArray(value.descriptors) ? value.descriptors.filter(isObject) : [];
  const findings: Finding[] = [];
  const byPort = new Map<string, string>();
  const byKey = new Set<string>();
  descriptors.forEach((descriptor, index) => {
    const key = serviceKey(descriptor);
    // DEC-0019: a port is a claim on THIS computer, so only local placements claim one. A remote
    // origin's port belongs to another host and collides with nothing here.
    if (descriptor.placement !== "remote") {
      const port = /:(\d+)$/.exec(String(descriptor.origin))?.[1] ?? "";
      const holder = byPort.get(port);
      if (holder !== undefined && holder !== key) findings.push({ code: "FAC-SEM-010", instancePath: `/descriptors/${index}/origin`, message: `port ${port} is claimed by both ${holder} and ${key}` });
      else byPort.set(port, key);
    }
    if (byKey.has(key)) findings.push({ code: "FAC-SEM-010", instancePath: `/descriptors/${index}`, message: `${key} is declared more than once` });
    byKey.add(key);
  });
  return findings;
}

function serviceCommands(value: JsonObject): Finding[] {
  const commands = isObject(value.commands) ? value.commands : {};
  return Object.entries(commands)
    .filter(([, argv]) => Array.isArray(argv) && !/^(~\/|\/)/.test(String(argv[0])))
    .map(([name]) => ({ code: "FAC-SEM-012", instancePath: `/commands/${name}/0`, message: `command ${name} must start with an absolute or home-relative executable path` }));
}

// DEC-0019: names that never reach the open internet. A remote origin on one of them is a local
// service wearing the remote placement — it would skip the loopback guard it actually needs.
const RESERVED_HOST = /(^|\.)(localhost|local|internal|home\.arpa|lan|localdomain)$/;

/** FAC-SEM-024: a remote placement is an https origin on a public name, with nothing of a local supervisor (launchd, systemd, Task Scheduler — DEC-0032). */
function remoteShape(value: JsonObject): Finding[] {
  if (value.placement !== "remote") return [];
  const findings: Finding[] = [];
  let host = "";
  try { host = new URL(String(value.origin)).hostname; } catch { /* the schema reports the shape */ }
  if (host && RESERVED_HOST.test(host)) findings.push({ code: "FAC-SEM-024", instancePath: "/origin", message: `a remote service cannot live on the reserved name ${host}` });
  const lifecycle = isObject(value.lifecycle) ? value.lifecycle : {};
  for (const field of ["label", "plist"]) {
    if (lifecycle[field] !== undefined) findings.push({ code: "FAC-SEM-024", instancePath: `/lifecycle/${field}`, message: `a remote service has no launchd ${field}` });
  }
  // DEC-0032: nor a systemd unit or a Scheduled Task — its platform supervises it.
  for (const [field, of] of [["unit", "systemd"], ["task", "Task Scheduler"]] as const) {
    if (lifecycle[field] !== undefined) findings.push({ code: "FAC-SEM-024", instancePath: `/lifecycle/${field}`, message: `a remote service has no ${of} ${field}` });
  }
  return findings;
}

// #region usage-arithmetic — docs: docs/specification/service.md#usage-report
/** FAC-SEM-025 (DEC-0021): a usage report adds up, an unknown cost is null rather than 0, and the
 *  days run forward without a repeat — so a host may sum days without double-counting. */
function usageArithmetic(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const days = Array.isArray(value.days) ? value.days.filter(isObject) : [];
  const money = (x: unknown) => (typeof x === "number" ? x : null);
  const close = (a: number, b: number) => Math.abs(a - b) <= 0.000001 + 1e-9 * Math.max(Math.abs(a), Math.abs(b));
  const priced = (row: JsonObject, at: string) => {
    const calls = Number(row.calls ?? 0), unpriced = Number(row.unpricedCalls ?? 0);
    if (unpriced > calls) findings.push({ code: "FAC-SEM-025", instancePath: `${at}/unpricedCalls`, message: "more unpriced calls than calls" });
    if (calls > 0 && unpriced === calls && row.costUsd !== null) findings.push({ code: "FAC-SEM-025", instancePath: `${at}/costUsd`, message: "every call is unpriced, so the cost is unknown (null), not a number" });
    if (unpriced < calls && row.costUsd === null) findings.push({ code: "FAC-SEM-025", instancePath: `${at}/costUsd`, message: "priced calls carry a cost; null is only for a row with no priced call" });
  };
  let previous = "";
  days.forEach((day, i) => {
    const at = `/days/${i}`;
    const date = String(day.date ?? "");
    if (date <= previous) findings.push({ code: "FAC-SEM-025", instancePath: `${at}/date`, message: `days must run forward without a repeat (${date} after ${previous})` });
    previous = date;
    priced(day, at);
    const models = Array.isArray(day.byModel) ? day.byModel.filter(isObject) : [];
    models.forEach((m, j) => priced(m, `${at}/byModel/${j}`));
    if (!models.length) {
      // No rows means nothing to sum: such a day can only be empty.
      const spent = ["calls", "inputTokens", "outputTokens", "cacheReadTokens", "cacheWriteTokens"].some((f) => Number(day[f] ?? 0) > 0) || Number(day.costUsd ?? 0) > 0;
      if (spent) findings.push({ code: "FAC-SEM-025", instancePath: `${at}/byModel`, message: "a day with calls, tokens or cost names the models they belong to" });
      return;
    }
    for (const field of ["calls", "unpricedCalls", "inputTokens", "outputTokens", "cacheReadTokens", "cacheWriteTokens"]) {
      const sum = models.reduce((n, m) => n + Number(m[field] ?? 0), 0);
      if (Number(day[field] ?? 0) !== sum) findings.push({ code: "FAC-SEM-025", instancePath: `${at}/${field}`, message: `the day's ${field} is not the sum of its models (${String(day[field] ?? 0)} ≠ ${sum})` });
    }
    const known = models.map((m) => money(m.costUsd)).filter((x): x is number => x !== null);
    const dayCost = money(day.costUsd);
    if (dayCost !== null && !close(dayCost, known.reduce((n, x) => n + x, 0))) findings.push({ code: "FAC-SEM-025", instancePath: `${at}/costUsd`, message: "the day's cost is not the sum of its models' known costs" });
  });
  return findings;
}
// #endregion usage-arithmetic

// #region usage-limits — docs: docs/specification/service.md#limits
/** FAC-SEM-031 (DEC-0027): every limit in `budgets[]` is readable on its own — a unique id, a subject
 *  exactly when the scope names one, one window that agrees with its kind, no spend against a
 *  per-order limit, and a legacy `budget` that repeats one enforced machine limit, so a reader of
 *  `budget` and a reader of `budgets[]` never disagree. A breach is not a finding: a report may
 *  truthfully show one, and a host shows it first. */
const PER_ORDER_KINDS = new Set(["per_job", "approval"]);
const MONTH_SECONDS = [28 * 86400, 31 * 86400] as const;

function usageLimits(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const limits = Array.isArray(value.budgets) ? value.budgets.filter(isObject) : [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-031", instancePath, message });
  const seen = new Set<string>();
  limits.forEach((limit, i) => {
    const at = `/budgets/${i}`;
    const id = String(limit.id ?? "");
    if (seen.has(id)) flag(`${at}/id`, `limit id ${id} appears twice`);
    seen.add(id);

    const named = limit.scope === "project" || limit.scope === "pool";
    if (named && limit.subject === undefined) flag(`${at}/subject`, `a ${String(limit.scope)} limit names its ${String(limit.scope)} in subject`);
    if (!named && limit.subject !== undefined) flag(`${at}/subject`, `a ${String(limit.scope)} limit has no subject`);

    const windows = (["period", "windowSeconds", "since"] as const).filter((f) => limit[f] !== undefined);
    if (windows.length > 1) flag(`${at}/${windows[1]}`, `a limit has one window, not ${windows.join(" and ")}`);
    const kind = String(limit.kind ?? "");
    const seconds = typeof limit.windowSeconds === "number" ? limit.windowSeconds : null;
    if (PER_ORDER_KINDS.has(kind)) {
      if (windows.length) flag(`${at}/${windows[0]}`, `${kind} bounds one order and has no window`);
      if (limit.spentUsd !== null) flag(`${at}/spentUsd`, `${kind} bounds one order, so nothing is spent against it (null)`);
    } else if (kind === "daily") {
      if (!(limit.period === "day" || seconds === 86400)) flag(`${at}/period`, "a daily limit counts the UTC day (period day) or the last 24 hours (windowSeconds 86400)");
    } else if (kind === "monthly") {
      if (!(limit.period === "month" || (seconds !== null && seconds >= MONTH_SECONDS[0] && seconds <= MONTH_SECONDS[1]))) {
        flag(`${at}/period`, "a monthly limit counts the UTC month (period month) or a rolling 28–31 days (windowSeconds)");
      }
    } else if (kind === "velocity") {
      if (seconds === null) flag(`${at}/windowSeconds`, "a velocity limit counts a rolling window (windowSeconds)");
    } else if (kind === "pool" || kind === "emergency") {
      if (!windows.length) flag(`${at}/period`, `a ${kind} limit names the window it counts (period, windowSeconds or since)`);
    }
    const known = PER_ORDER_KINDS.has(kind) || ["daily", "monthly", "pool", "emergency"].includes(kind);
    if (known && limit.limitUsd === null) flag(`${at}/limitUsd`, `a ${kind} limit is a dollar amount; only a relative limit (velocity) may leave it null`);
    if (limit.tripped === true && limit.enforced !== true) flag(`${at}/tripped`, "a limit that is not enforced cannot have stopped work");
  });

  if (isObject(value.budget) && limits.length) {
    const b = value.budget;
    const kind = b.period === "day" ? "daily" : "monthly";
    const same = (x: unknown, y: unknown) => (x === null || y === null ? x === y : typeof x === "number" && typeof y === "number" && Math.abs(x - y) <= 0.000001);
    const twin = limits.some((l) => l.scope === "machine" && l.enforced === true && l.kind === kind && l.period === b.period && same(l.limitUsd, b.limitUsd) && same(l.spentUsd, b.spentUsd));
    if (!twin) flag("/budget", `budget repeats one enforced machine ${kind} limit with period ${String(b.period)} in budgets[], so old and new readers agree`);
  }
  return findings;
}
// #endregion usage-limits

// #region comms-rules — docs: docs/specification/project-comms.md#semantic-rules
/** FAC-SEM-026 (DEC-0022, proposed): a submit is coherent — a request's target can read the new
 *  thread, participants name no Project twice, and a reply answers a message. Identity is never in
 *  the payload: the schema already refuses estate, sender, principal and session fields. */
function commsSubmit(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const thread = isObject(value.thread) ? value.thread : {};
  const fresh = isObject(thread.new) ? thread.new : null;
  const request = isObject(value.request) ? value.request : null;
  if (fresh && request && Array.isArray(fresh.participants) && !fresh.participants.includes(request.target)) {
    findings.push({ code: "FAC-SEM-026", instancePath: "/request/target", message: "a request's target Project must be a participant of the new thread" });
  }
  if (value.kind === "reply" && value.replyTo === undefined) findings.push({ code: "FAC-SEM-026", instancePath: "/replyTo", message: "a reply names the message it answers" });
  if (value.kind !== "request" && request) findings.push({ code: "FAC-SEM-026", instancePath: "/request", message: "only a request carries request details" });
  return findings;
}

/** The request lifecycle (DEC-0022, proposed). Request state and effect state are separate facts:
 *  an effect that began and was not observed is `unknown`, and only reconciliation leaves
 *  `outcome_unknown`. Accepted work is held on expiry and on responder replacement. */
export const COMMS_TRANSITIONS: Readonly<Record<string, readonly [string, string][]>> = {
  claim: [["queued", "claimed"], ["claimed", "claimed"]],
  accept: [["claimed", "accepted"]],
  effect_begin: [["accepted", "in_progress"]],
  complete: [["accepted", "completed"], ["accepted", "failed_known"], ["in_progress", "completed"], ["in_progress", "failed_known"]],
  cancel: [["queued", "cancelled"], ["claimed", "cancelled"], ["accepted", "cancelled"], ["in_progress", "outcome_unknown"]],
  expire: [["queued", "expired"], ["claimed", "expired"]],
  replace: [["claimed", "queued"], ["accepted", "accepted"]],
  lost_result: [["in_progress", "outcome_unknown"]],
  reconcile: [["outcome_unknown", "completed"], ["outcome_unknown", "failed_known"]],
};

/** FAC-SEM-027: a transition `{from, op, to}` is in the table; `complete` after an effect began needs `observed`. */
function commsTransition(value: JsonObject): Finding[] {
  const op = String(value.op ?? "");
  const pair = [String(value.from ?? ""), String(value.to ?? "")];
  const allowed = COMMS_TRANSITIONS[op] ?? [];
  if (!allowed.some(([from, to]) => from === pair[0] && to === pair[1])) {
    return [{ code: "FAC-SEM-027", instancePath: "/to", message: `${op || "(no op)"} cannot move a request from ${pair[0]} to ${pair[1]}` }];
  }
  if ((op === "complete" && pair[0] === "in_progress" || op === "reconcile") && value.observed !== true) {
    return [{ code: "FAC-SEM-027", instancePath: "/observed", message: "an effect that began is settled only by an observed result" }];
  }
  return [];
}
// #endregion comms-rules

