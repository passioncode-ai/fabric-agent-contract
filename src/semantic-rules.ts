import { type Finding, type JsonObject, isObject, show } from "./findings.js";
import { coreRules } from "./core-rules.js";
import { normalIdentifier, sameIdentifier } from "./identifiers.js";
import { usageRules } from "./usage-rules.js";
import { supportQualityRules } from "./support-quality-rules.js";
import { interopRules } from "./interop-rules.js";
import { registryRules } from "./registry-rules.js";
import { relayRules } from "./relay-rules.js";
import { revocationDeltaRules } from "./revocation-delta-rules.js";
import { feedRequestRules } from "./service-feed.js";
import { lockOutcomeRules } from "./service-supervisor.js";
import { windowsTokenRules } from "./windows-token.js";
import { settingsBackupRules } from "./settings-backup.js";
import { grantSpendRules, spendPolicyRules } from "./spend-rules.js";
import { routeRules } from "./route-rules.js";
import { activityRules } from "./activity-rules.js";
import { deviceRules } from "./device-rules.js";
import { deviceTransportRules } from "./device-transport-rules.js";
import { delegationRules } from "./delegation-rules.js";
import { deepLinkRules } from "./fabric-links.js";
import { sessionHandoffRules } from "./session-handoff.js";
import { profileRules } from "./profile-rules.js";
import { packageRules } from "./package-rules.js";
import { estateRecordRules } from "./estate-record-rules.js";
import { enrollTokenRules } from "./enroll-token.js";
import { contextRules } from "./context-rules.js";
import { hubKeyRules } from "./hub-key-rules.js";
import { signingRules } from "./signing-challenges.js";
import { attributionRules } from "./openrouter-attribution.js";
import { localChannelRules } from "./local-channel.js";
import { proposalRules } from "./proposal-rules.js";
import { embeddedProtocolsFindings, protocolRules } from "./protocol-revisions.js";
import { sessionJoinRules } from "./session-join.js";
import { feedDataRules } from "./feed-data.js";
import { windowLeaseRules } from "./window-lease.js";
import { entitlementRules } from "./entitlement.js";
import { shareRegistrationRules } from "./share-registration.js";
import { nodeSummaryRules } from "./node-summary.js";
import { agentNetworkRules, loadExtensionRules } from "./agent-network.js";
import { machineCallRules } from "./machine-call.js";
import { checkInCredentialFindings, credentialRules } from "./credentials.js";
import { jobLimitRules, usageFindings } from "./job-limits.js";
import { folderAttributionRules } from "./folder-attribution.js";
import { connectionsRules } from "./connections.js";
import { dashboardDeclarationRules } from "./dashboard-declaration.js";
import { RESERVED_HOST, descriptorBundleRules, descriptorPeerRules } from "./descriptor-rules.js";
import { credentialName, secretArgument, secretUrl } from "./secret-shape.js";

export type { Finding } from "./findings.js";

export function evaluateSemanticRules(kind: string, value: unknown): Finding[] {
  const registry = registryRules(kind, value);
  if (registry) return [...registry, ...declaredServers(kind, value), ...commandLines(kind, value)];
  if (!isObject(value)) return [{ code: "FAC-SEM-000", instancePath: "", message: "value must be an object" }];
  const interop = interopRules(kind, value);
  if (interop) return interop;
  const route = routeRules(kind, value);
  if (route) return route;
  const activity = activityRules(kind, value);
  if (activity) return activity;
  const device = deviceRules(kind, value);
  if (device) return device;
  const transport = deviceTransportRules(kind, value);
  if (transport) return transport;
  const delegation = delegationRules(kind, value);
  if (delegation) return delegation;
  const relay = relayRules(kind, value);
  if (relay) return relay;
  const delta = revocationDeltaRules(kind, value);
  if (delta) return delta;
  if (kind === "deep-link") return deepLinkRules(value);
  if (kind === "service-lock-outcome") return lockOutcomeRules(value);
  if (kind === "windows-token-file") return windowsTokenRules(value);
  const profiles = profileRules(kind, value);
  if (profiles) return profiles;
  const packaged = packageRules(kind, value);
  if (packaged) return packaged;
  const estate = estateRecordRules(kind, value);
  if (estate) return estate;
  const enroll = enrollTokenRules(kind, value);
  if (enroll) return enroll;
  const context = contextRules(kind, value);
  if (context) return context;
  const hubKey = hubKeyRules(kind, value);
  if (hubKey) return hubKey;
  const lease = windowLeaseRules(kind, value);
  if (lease) return lease;
  const entitlement = entitlementRules(kind, value);
  if (entitlement) return entitlement;
  const folderAttribution = folderAttributionRules(kind, value);
  if (folderAttribution) return folderAttribution;
  const jobLimits = jobLimitRules(kind, value);
  if (jobLimits) return jobLimits;
  const share = shareRegistrationRules(kind, value);
  if (share) return share;
  const summary = nodeSummaryRules(kind, value);
  if (summary) return summary;
  const network = agentNetworkRules(kind, value);
  if (network) return network;
  const machineCall = machineCallRules(kind, value);
  if (machineCall) return machineCall;
  // DEC-0112: a check-in's credential members beside its protocols (FAC-SEM-099).
  if (kind === "device-check-in") return [...checkInCredentialFindings(value), ...(protocolRules(kind, value) as Finding[])];
  const credential = credentialRules(kind, value);
  if (credential) return credential;
  const signing = signingRules(kind, value);
  if (signing) return signing;
  const attribution = attributionRules(kind, value);
  if (attribution) return attribution;
  const channel = localChannelRules(kind, value);
  if (channel) return channel;
  const proposal = proposalRules(kind, value);
  if (proposal) return proposal;
  const protocols = protocolRules(kind, value);
  if (protocols) return protocols;
  const joined = sessionJoinRules(kind, value);
  if (joined) return joined;
  const feed = feedDataRules(kind, value);
  if (feed) return feed;
  const handoff = sessionHandoffRules(kind, value);
  if (handoff) return handoff;
  const descriptorBundle = descriptorBundleRules(kind, value);
  if (descriptorBundle) return descriptorBundle;
  const findings: Finding[] = [];

  if (kind === "result" && value.outcome === "succeeded" && Array.isArray(value.notVerified) && value.notVerified.length > 0) {
    findings.push({ code: "FAC-SEM-001", instancePath: "/notVerified", message: "a succeeded result lists no claim in notVerified" });
  }
  // DEC-0087: a result's own usage, as kind usage reads it.
  if (kind === "result") findings.push(...usageFindings(value.usage, "/usage"));
  if (kind === "execution-bundle") {
    const pool = isObject(value.pool) && Array.isArray(value.pool.accounts) ? value.pool.accounts : [];
    const selected = isObject(value.context) ? value.context.selectedAccount : undefined;
    const refs = pool.filter(isObject).map((item) => item.accountRef);
    // Account references compare by normal form (DEC-0076).
    if (selected !== undefined && !refs.some((ref) => sameIdentifier(ref, selected))) findings.push({ code: "FAC-SEM-002", instancePath: "/context/selectedAccount", message: "selected account is outside the pinned project pool" });
  }
  if (kind === "learning" && value.selfApply !== false) findings.push({ code: "FAC-SEM-003", instancePath: "/selfApply", message: "learning proposal cannot apply itself" });
  if (kind === "promotion") {
    const disallowed = new Set(["personal", "credential", "regulated"]);
    if (disallowed.has(show(value.classification))) findings.push({ code: "FAC-SEM-004", instancePath: "/classification", message: "sensitive raw content cannot promote globally" });
  }
  if (kind === "roles" && Array.isArray(value.assignments)) {
    const active = value.assignments.filter(isObject).filter((item) => item.active === true);
    const ceos = active.filter((item) => item.role === "ceo");
    if (ceos.length !== 1) findings.push({ code: "FAC-SEM-005", instancePath: "/assignments", message: "estate requires exactly one active CEO" });
    // Every project any active assignment scopes needs its one product manager (F-A-004, DEC-0064): a project with
    // developers and no manager is found, not skipped. Two spellings of one project id are one project (DEC-0076).
    // A project that is not a string (schema-invalid) is still a project, keyed by itself as before.
    const scoped = (item: JsonObject): unknown => {
      const project = isObject(item.scope) ? item.scope.project : undefined;
      return typeof project === "string" ? normalIdentifier(project) : project;
    };
    const projects = new Map<unknown, unknown>();
    for (const item of active) {
      const project = scoped(item);
      if (project !== undefined && !projects.has(project)) projects.set(project, (item.scope as JsonObject).project);
    }
    for (const [project, spelling] of projects) {
      const managers = active.filter((item) => item.role === "product-manager" && scoped(item) === project);
      if (managers.length !== 1) findings.push({ code: "FAC-SEM-006", instancePath: "/assignments", message: `project ${show(spelling)} requires exactly one active product manager` });
    }
  }
  if (kind === "coordination" && value.kind === "renew" && value.claim === undefined) findings.push({ code: "FAC-SEM-007", instancePath: "/claim", message: "renew requires a claim reference" });
  if (kind === "binding-bundle" && isObject(value.admission) && value.admission.state !== "admitted") findings.push({ code: "FAC-SEM-008", instancePath: "/admission/state", message: "only an admitted provider revision can be bound" });
  findings.push(...(coreRules(kind, value) ?? []));

  if (kind === "service-observation") findings.push(...serviceIdentity(value));
  if (kind === "service-directory") findings.push(...serviceClaims(value));
  if (kind === "service-well-known" && value.status === "ready" && Array.isArray(value.degraded) && value.degraded.length > 0) {
    findings.push({ code: "FAC-SEM-011", instancePath: "/status", message: "a ready service cannot report degraded sources" });
  }
  if (kind === "service-well-known") findings.push(...dashboardDeclarationRules(value));
  if (kind === "service-well-known") findings.push(...connectionsRules(value));
  if (kind === "service-well-known") findings.push(...loadExtensionRules(value));
  if (kind === "service-well-known") findings.push(...embeddedProtocolsFindings(value.protocols, "/protocols"));
  if (kind === "service-descriptor") findings.push(...serviceCommands(value), ...remoteShape(value), ...commandLines(kind, value), ...descriptorPeerRules(value));
  if (kind === "manifest") findings.push(...declaredServers(kind, value), ...commandLines(kind, value));
  if (kind === "service-usage") findings.push(...usageRules(value), ...usageLimits(value));
  if (kind === "support-quality-daily") findings.push(...supportQualityRules(value));
  if (kind === "service-feed-request") findings.push(...feedRequestRules(value));
  if (kind === "settings-backup") findings.push(...settingsBackupRules(value));
  if (kind === "spend-policy") findings.push(...spendPolicyRules(value));
  if (kind === "grant-spend") findings.push(...grantSpendRules(value));
  if (kind === "comms-submit") findings.push(...commsSubmit(value));
  if (kind === "comms-transition") findings.push(...commsTransition(value), ...commsSettlement(value));
  if (kind === "comms-directory") findings.push(...commsDirectory(value));
  if (kind === "comms-submit" || kind === "comms-message") findings.push(...commsFinding(value, kind === "comms-submit"));

  return findings;
}

const serviceKey = (value: JsonObject) => `${show(value.id)}.${show(value.instance ?? "default")}`;

function serviceIdentity(value: JsonObject): Finding[] {
  const descriptor = isObject(value.descriptor) ? value.descriptor : {};
  const answered = isObject(value.wellKnown) && isObject(value.wellKnown.service) ? value.wellKnown.service : {};
  if (serviceKey(descriptor) === serviceKey(answered)) return [];
  return [{ code: "FAC-SEM-009", instancePath: "/wellKnown/service", message: `${descriptor.origin === undefined ? serviceKey(descriptor) : show(descriptor.origin)} answers as ${serviceKey(answered)}, not ${serviceKey(descriptor)}` }];
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
    // DEC-0069: an app's descriptor may carry no origin (its live origin is in its liveness file), so it claims no port.
    if (descriptor.placement !== "remote" && descriptor.origin !== undefined) {
      const port = /:(\d+)$/.exec(show(descriptor.origin))?.[1] ?? "";
      const holder = byPort.get(port);
      if (holder !== undefined && holder !== key) findings.push({ code: "FAC-SEM-010", instancePath: `/descriptors/${index}/origin`, message: `port ${port} is claimed by both ${holder} and ${key}` });
      else byPort.set(port, key);
    }
    if (byKey.has(key)) findings.push({ code: "FAC-SEM-010", instancePath: `/descriptors/${index}`, message: `${key} is declared more than once` });
    byKey.add(key);
  });
  return findings;
}

/**
 * An executable's path as `localPath` admits it (schemas/service-common.schema.json, DEC-0032): POSIX `/…` or
 * `~/…`, Windows drive-absolute `C:\…`/`C:/…` or `~\…` — and never a network share: not `\\server\…`, and not
 * `//server/…` or `/\server\…`, which Windows also reads as a share (DEC-0057). The prefix is `localPath`'s pattern;
 * `test/service-rules.test.ts` holds the two to the same paths.
 */
const EXECUTABLE_PATH = /^(~[\\/]|\/(?![\\/])|[A-Za-z]:[\\/])/;

function serviceCommands(value: JsonObject): Finding[] {
  const commands = isObject(value.commands) ? value.commands : {};
  return Object.entries(commands)
    .filter(([, argv]) => Array.isArray(argv) && !EXECUTABLE_PATH.test(show(argv[0])))
    .map(([name]) => ({ code: "FAC-SEM-012", instancePath: `/commands/${name}/0`, message: `command ${name} must start with an absolute or home-relative executable path (/…, ~/…, C:\\…, ~\\…), never a network share` }));
}

// DEC-0019: a remote origin on a reserved name (RESERVED_HOST, src/descriptor-rules.ts, shared with a peer's
// endpoint) is a local service wearing the remote placement — it would skip the loopback guard it actually needs.

/** FAC-SEM-024: a remote placement is an https origin on a public name, with nothing of a local supervisor (launchd, systemd, Task Scheduler — DEC-0032). */
function remoteShape(value: JsonObject): Finding[] {
  if (value.placement !== "remote") return [];
  const findings: Finding[] = [];
  let host = "";
  try { host = new URL(show(value.origin)).hostname; } catch { /* the schema reports the shape */ }
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
    const id = show(limit.id ?? "");
    if (seen.has(id)) flag(`${at}/id`, `limit id ${id} appears twice`);
    seen.add(id);

    const named = limit.scope === "project" || limit.scope === "pool";
    if (named && limit.subject === undefined) flag(`${at}/subject`, `a ${show(limit.scope)} limit names its ${show(limit.scope)} in subject`);
    if (!named && limit.subject !== undefined) flag(`${at}/subject`, `a ${show(limit.scope)} limit has no subject`);

    const windows = (["period", "windowSeconds", "since"] as const).filter((f) => limit[f] !== undefined);
    if (windows.length > 1) flag(`${at}/${windows[1]}`, `a limit has one window, not ${windows.join(" and ")}`);
    const kind = show(limit.kind ?? "");
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
    if (!twin) flag("/budget", `budget repeats one enforced machine ${kind} limit with period ${show(b.period)} in budgets[], so old and new readers agree`);
  }
  return findings;
}
// #endregion usage-limits

// #region comms-rules — docs: docs/specification/project-comms.md#semantic-rules
/** FAC-SEM-026 (DEC-0022): a submit is coherent — a request's target can read the new
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

/** The request lifecycle (DEC-0022). Request state and effect state are separate facts:
 *  an effect that began and was not observed is `unknown`, and only reconciliation leaves
 *  `outcome_unknown` — by the current responder, or by the estate owner when no responder holds the
 *  slot (DEC-0081). No operation moves `outcome_unknown` to `cancelled`: there is no abandon path.
 *  Accepted work is held on expiry and on responder replacement. The target's participant reply answers a queued
 *  request, never a responder's fenced reply or progress note (DEC-0098, DEC-0102):
 *  `answered` is left only by the requester's cancel. */
export const COMMS_TRANSITIONS: Readonly<Record<string, readonly [string, string][]>> = {
  claim: [["queued", "claimed"], ["claimed", "claimed"]],
  accept: [["claimed", "accepted"]],
  effect_begin: [["accepted", "in_progress"]],
  complete: [["accepted", "completed"], ["accepted", "failed_known"], ["in_progress", "completed"], ["in_progress", "failed_known"]],
  cancel: [["queued", "cancelled"], ["claimed", "cancelled"], ["accepted", "cancelled"], ["answered", "cancelled"], ["in_progress", "outcome_unknown"]],
  expire: [["queued", "expired"], ["claimed", "expired"]],
  replace: [["claimed", "queued"], ["accepted", "accepted"]],
  lost_result: [["in_progress", "outcome_unknown"]],
  reconcile: [["outcome_unknown", "completed"], ["outcome_unknown", "failed_known"]],
  // DEC-0098, DEC-0102: a participant's message from the target Project, not a request and never a responder's fenced
  // reply or progress note, whose replyTo is a queued request (at once, or on the board's pass).
  answer: [["queued", "answered"]],
};

/** FAC-SEM-027: a transition `{from, op, to}` is in the table; `complete` after an effect began needs `observed`. */
function commsTransition(value: JsonObject): Finding[] {
  const op = show(value.op ?? "");
  const pair = [show(value.from ?? ""), show(value.to ?? "")];
  // Own members only: an op named `constructor` or `__proto__` must not reach Object.prototype (DEC-0081's tolerance fix).
  const allowed = Object.hasOwn(COMMS_TRANSITIONS, op) ? COMMS_TRANSITIONS[op] ?? [] : [];
  if (!allowed.some(([from, to]) => from === pair[0] && to === pair[1])) {
    return [{ code: "FAC-SEM-027", instancePath: "/to", message: `${op || "(no op)"} cannot move a request from ${pair[0]} to ${pair[1]}` }];
  }
  if ((op === "complete" && pair[0] === "in_progress" || op === "reconcile") && value.observed !== true) {
    return [{ code: "FAC-SEM-027", instancePath: "/observed", message: "an effect that began is settled only by an observed result" }];
  }
  return [];
}

/** The operations after which a request is settled and its record says who settled it (DEC-0081). */
const SETTLING_OPS = new Set(["complete", "reconcile"]);
/** The owner's summary bound, in characters as JSON Schema counts them: code points, not UTF-16 units. */
const OWNER_SUMMARY_MAX = 2000;

/**
 * FAC-SEM-109 (DEC-0081): who settled a request, on its transition record `{op, from, to, observed?, settledBy?,
 * summary?, principal?}`, a host journal document, not a receipt. Every `complete` and `reconcile` record names who
 * settled the request, `responder` or `owner`, and no other operation's record does: a record cannot pass as the
 * responder's by leaving the member out. The estate owner settles only by `reconcile` (FAC-SEM-027 checks that it leaves
 * `outcome_unknown`, observed), with a summary of what it observed (1–2000 characters, required: the schema of
 * `com.reconcile` cannot see the caller) and as an `operator` principal the host verified (`trusted`). Whether a responder
 * held the slot, and whether that operator owns the target Project, are the host's state at that moment, not in the
 * record, so no rule on the record can check them.
 */
function commsSettlement(value: JsonObject): Finding[] {
  const op = typeof value.op === "string" ? value.op : "";
  if (value.settledBy === undefined) {
    return SETTLING_OPS.has(op) ? [{ code: "FAC-SEM-109", instancePath: "/settledBy", message: `a ${op} record names who settled the request: responder or owner` }] : [];
  }
  if (value.settledBy !== "responder" && value.settledBy !== "owner") {
    return [{ code: "FAC-SEM-109", instancePath: "/settledBy", message: "settledBy is responder or owner" }];
  }
  if (!SETTLING_OPS.has(op)) {
    return [{ code: "FAC-SEM-109", instancePath: "/settledBy", message: `only a settlement names who settled it, and ${op || "(no op)"} settles nothing` }];
  }
  if (value.settledBy === "responder") return [];
  const findings: Finding[] = [];
  if (op !== "reconcile") findings.push({ code: "FAC-SEM-109", instancePath: "/op", message: "the estate owner settles only by reconciling an outcome_unknown request" });
  const length = typeof value.summary === "string" ? [...value.summary].length : 0;
  if (length < 1 || length > OWNER_SUMMARY_MAX) {
    findings.push({ code: "FAC-SEM-109", instancePath: "/summary", message: "the estate owner's settlement carries a summary of what it observed, 1–2000 characters" });
  }
  const principal = isObject(value.principal) ? value.principal : {};
  if (principal.kind !== "operator" || principal.provenance !== "trusted") {
    findings.push({ code: "FAC-SEM-109", instancePath: "/principal", message: "the estate owner is an operator principal the host verified (trusted)" });
  }
  return findings;
}
/**
 * FAC-SEM-107 (DEC-0077): a `com.directory` page lists each Project once and each capability once per Project. JSON
 * Schema cannot say it: `uniqueItems` compares whole objects, so two entries of one Project with other names, or one
 * capability with two responder states, pass it. Project ids are opaque and capability names are names, so both compare
 * as written (DEC-0076). The page's order (by name, then id) is the host's collation and is not checked here.
 */
function commsDirectory(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const projects = new Set<string>();
  (Array.isArray(value.projects) ? value.projects : []).forEach((project: unknown, p: number) => {
    if (!isObject(project)) return;
    if (typeof project.id === "string") {
      if (projects.has(project.id)) findings.push({ code: "FAC-SEM-107", instancePath: `/projects/${p}/id`, message: `a directory page lists each Project once: ${project.id} is listed again` });
      projects.add(project.id);
    }
    const capabilities = new Set<string>();
    (Array.isArray(project.capabilities) ? project.capabilities : []).forEach((entry: unknown, c: number) => {
      if (!isObject(entry) || typeof entry.capability !== "string") return;
      if (capabilities.has(entry.capability)) findings.push({ code: "FAC-SEM-107", instancePath: `/projects/${p}/capabilities/${c}/capability`, message: `a Project lists each capability once: ${entry.capability} is listed again` });
      capabilities.add(entry.capability);
    });
  });
  return findings;
}
/**
 * FAC-SEM-108 (DEC-0080): a structured finding is coherent. Only a message of kind `finding` carries `finding`; no two
 * `affects` items name the same thing; a `{redacted: true}` item is only in a message as read, never in a submit. Two
 * backlog rows are the same when repository, path and id are each equal as written, two tasks when their ids are: none of
 * these is a URI (each pattern refuses `:`), so DEC-0076's normal form leaves them as they are. A backlog row and a task
 * are never the same, and redacted items, alike by construction, are not compared. The schema refuses a duplicate or a
 * redacted item in a submit too (`uniqueItems`, the item `oneOf`); this rule says it for a message, where the schema
 * cannot, and for a submit read without the schema.
 */
function commsFinding(value: JsonObject, submit: boolean): Finding[] {
  if (value.finding === undefined) return [];
  const findings: Finding[] = [];
  if (value.kind !== "finding") findings.push({ code: "FAC-SEM-108", instancePath: "/finding", message: "only a message of kind finding carries finding details" });
  const affects = isObject(value.finding) && Array.isArray(value.finding.affects) ? value.finding.affects : [];
  const seen = new Map<string, number>();
  affects.forEach((item: unknown, i: number) => {
    if (!isObject(item)) return;
    if (item.redacted !== undefined) {
      if (submit) findings.push({ code: "FAC-SEM-108", instancePath: `/finding/affects/${i}`, message: "a submit names what its finding affects: only a reader's copy is redacted" });
      return;
    }
    const key = typeof item.task === "string" ? JSON.stringify(["task", item.task])
      : typeof item.repository === "string" && typeof item.path === "string" && typeof item.id === "string" ? JSON.stringify(["row", item.repository, item.path, item.id])
      : undefined;
    if (key === undefined) return;
    const first = seen.get(key);
    if (first !== undefined) findings.push({ code: "FAC-SEM-108", instancePath: `/finding/affects/${i}`, message: `a finding names each thing it affects once: item ${i} repeats item ${first}` });
    else seen.set(key, i);
  });
  return findings;
}
// #endregion comms-rules


// #region declared-commands — docs: docs/specification/profiles.md#semantic-rules
const listOf = (value: unknown): JsonObject[] => (Array.isArray(value) ? value.filter(isObject) : []);
const stringsOf = (value: unknown): string[] => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);

/** Every stdio MCP server a document declares, with where its `scope` sits: a manifest's capability profiles, a provider entry's `run`. */
function stdioServers(kind: string, value: unknown): Array<{ at: string; server: JsonObject }> {
  if (kind === "manifest" && isObject(value)) {
    return listOf(value.capabilities).flatMap((capability, index) => {
      const connection = isObject(capability.profile) && capability.profile.kind === "mcp" && isObject(capability.profile.connection) ? capability.profile.connection : undefined;
      return connection?.mode === "stdio" ? [{ at: `/capabilities/${index}/profile/connection`, server: connection }] : [];
    });
  }
  if (kind === "provider-entry" && isObject(value) && isObject(value.run) && isObject(value.run.mcp) && isObject(value.run.mcp.stdio)) {
    return [{ at: "/run/mcp/stdio", server: value.run.mcp.stdio }];
  }
  return [];
}

/**
 * FAC-SEM-056 (DEC-0044, LC-19): a stdio MCP server is declared where it is used — for a project or on demand —
 * never for every session. Thirty-five sessions each holding five stdio servers held about 10 GB on 2026-10-11.
 */
function declaredServers(kind: string, value: unknown): Finding[] {
  return stdioServers(kind, value)
    .filter(({ server }) => server.scope === "session")
    .map(({ at }) => ({ code: "FAC-SEM-056", instancePath: `${at}/scope`, message: "a stdio MCP server is declared for a project or on demand, never for every session (LC-19)" }));
}

/** Every launch argument and MCP entry a document declares, as `[instancePath, value, isUrl]`. */
function declaredCommandLines(kind: string, value: unknown): Array<[string, string, boolean]> {
  const argv = (at: string, list: unknown): Array<[string, string, boolean]> => stringsOf(list).map((arg, index) => [`${at}/${index}`, arg, false]);
  const url = (at: string, raw: unknown): Array<[string, string, boolean]> => (typeof raw === "string" ? [[at, raw, true]] : []);
  const runner = (entry: JsonObject, at: string) => [
    ...argv(`${at}/version/argv`, isObject(entry.version) ? entry.version.argv : undefined),
    ...argv(`${at}/auth/argv`, isObject(entry.auth) ? entry.auth.argv : undefined),
    ...Object.entries(isObject(entry.drives) ? entry.drives : {}).flatMap(([drive, spec]) => argv(`${at}/drives/${drive}/argv`, isObject(spec) ? spec.argv : undefined))
  ];
  if (kind === "runner-catalogue") return listOf(value).flatMap((entry, index) => runner(entry, `/${index}`));
  // Every other kind is one document; a value that is not an object declares nothing.
  return listOf([value]).flatMap((doc): Array<[string, string, boolean]> => {
    if (kind === "runner") return runner(doc, "");
    if (kind === "service-descriptor") return Object.entries(isObject(doc.commands) ? doc.commands : {}).flatMap(([name, list]) => argv(`/commands/${name}`, list));
    if (kind === "provider-entry") {
      const mcp = isObject(doc.run) && isObject(doc.run.mcp) ? doc.run.mcp : {};
      return [...argv("/run/mcp/stdio/command", isObject(mcp.stdio) ? mcp.stdio.command : undefined), ...url("/run/mcp/url", mcp.url)];
    }
    if (kind === "manifest") {
      return listOf(doc.capabilities).flatMap((capability, index) => {
        const profile = isObject(capability.profile) ? capability.profile : {};
        const at = `/capabilities/${index}/profile`;
        const connection = profile.kind === "mcp" && isObject(profile.connection) ? profile.connection : {};
        return [
          ...url(`${at}/connection/url`, connection.url),
          ...url(`${at}/connection/executableRef`, connection.executableRef),
          ...argv(`${at}/connection/args`, connection.args),
          ...(profile.kind === "local-runner" ? [...url(`${at}/executableRef`, profile.executableRef), ...argv(`${at}/args`, profile.args)] : [])
        ];
      });
    }
    return [];
  });
}

/**
 * FAC-SEM-057 (DEC-0044, LC-21): no declared launch argument or MCP entry carries a credential — a process listing
 * shows every argument to the whole user, and a URL lands in logs and configuration files. Keys reach a process
 * through its environment (a secret reference), a 0600 file or the vault. The message never repeats the value.
 */
/**
 * An argument that carries a credential by its name rather than its shape: `--token=x`, `API_KEY=x`, or a
 * credential-named flag followed by its value (`--api-key x`). Checked here, beside the shape detector, so the
 * detector session-handoff copies stays byte-identical (LC-21).
 */
function namedCredentialArguments(lines: Array<[string, string, boolean]>): Set<string> {
  const flagged = new Set<string>();
  const byList = new Map<string, Array<[string, string]>>();
  for (const [at, text, isUrl] of lines) {
    if (isUrl) continue;
    const parent = at.replace(/\/\d+$/, "");
    byList.set(parent, [...(byList.get(parent) ?? []), [at, text]]);
  }
  for (const list of byList.values()) {
    list.forEach(([at, text], index) => {
      const assigned = /^(?:--?)?([A-Za-z][\w.-]*)=(.+)$/.exec(text);
      if (assigned && credentialName(assigned[1] as string)) flagged.add(at);
      const flag = /^--?([A-Za-z][\w.-]*)$/.exec(text);
      const next = list[index + 1];
      if (flag && credentialName(flag[1] as string) && next && !next[1].startsWith("-")) flagged.add(next[0]);
    });
  }
  return flagged;
}

function commandLines(kind: string, value: unknown): Finding[] {
  const lines = declaredCommandLines(kind, value);
  const named = namedCredentialArguments(lines);
  return lines
    .filter(([at, text, isUrl]) => (isUrl ? secretUrl(text) : secretArgument(text) || named.has(at)))
    .map(([instancePath, , isUrl]) => ({
      code: "FAC-SEM-057",
      instancePath,
      message: isUrl
        ? "a declared URL never carries a credential: pass it in a header from a secret reference (LC-21)"
        : kind === "provider-entry"
          ? "a launch argument never carries a credential: a process listing shows it; move the value to an env entry with a secret reference (secret-ref:NAME), or to a file the program reads (LC-21)"
          : kind === "manifest"
            ? "a launch argument never carries a credential: a process listing shows it; have the program read it from a file, or declare the server in a provider entry whose env holds a secret reference (secret-ref:NAME) (LC-21)"
            : "a command argument never carries a credential: a process listing shows it; have the program read it from a file it is pointed at (LC-21)"
    }));
}
// #endregion declared-commands
