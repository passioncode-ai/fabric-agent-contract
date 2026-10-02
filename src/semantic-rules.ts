import { type Finding, type JsonObject, isObject } from "./findings.js";
import { interopRules } from "./interop-rules.js";
import { registryRules } from "./registry-rules.js";

export type { Finding } from "./findings.js";

export function evaluateSemanticRules(kind: string, value: unknown): Finding[] {
  const registry = registryRules(kind, value);
  if (registry) return registry;
  if (!isObject(value)) return [{ code: "FAC-SEM-000", instancePath: "", message: "value must be an object" }];
  const interop = interopRules(kind, value);
  if (interop) return interop;
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

/** FAC-SEM-024: a remote placement is an https origin on a public name, with nothing of launchd. */
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
  return findings;
}
