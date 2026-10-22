import { type Finding, type JsonObject, isObject, show } from "./findings.js";
import { policyExpiry, policySigningInput, resolvePolicy, verifyWith } from "./device-rules.js";
import { hasHomePath } from "./activity-rules.js";
import { secretValue } from "./secret-shape.js";

// #region node-summary, docs: docs/specification/node-summary.md
/**
 * A node's summary of its harness and an organization's repairs (DEC-0101). `node-summary/1` tells an organization
 * server what an enrolled machine runs for that organization's context, and how it differs from the organization's
 * baseline (`harnessDrift`); `repair-request/1` asks the node to run one allowlisted package, which it does only as
 * `repairDecision` answers. Every function here answers and never throws: malformed input is an answer.
 */
export const NODE_SUMMARY_TYPE = "node-summary/1";
export const REPAIR_REQUEST_TYPE = "repair-request/1";
/** The longest a repair request lives (FAC-SEM-129). */
export const MAX_REPAIR_DAYS = 7;
const DAY_MS = 86_400_000;

export type DriftKind = "coding-agent" | "mcp-server" | "skill" | "plugin" | "service";
export type DriftState = "missing" | "stopped" | "changed" | "outdated";
export interface DriftItem { kind: DriftKind; name: string; state: DriftState }

const list = (value: unknown): JsonObject[] => (Array.isArray(value) ? value.filter(isObject) : []);
const str = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined);

/** Dotted numbers compared number by number; a missing part is 0, and a version that is not dotted numbers is outdated. */
export function versionBelow(version: string | undefined, minimum: string): boolean {
  if (version === undefined || !/^[0-9]+(?:\.[0-9]+)*$/.test(version)) return true;
  const have = version.split(".").map(Number), want = minimum.split(".").map(Number);
  for (let i = 0; i < Math.max(have.length, want.length); i += 1) {
    const a = have[i] ?? 0, b = want[i] ?? 0;
    if (a !== b) return a < b;
  }
  return false;
}

/** What the harness holds of one kind, by name: `{version?, digest?, state?}`. */
function installed(summary: JsonObject, kind: DriftKind): Map<string, JsonObject> {
  const harness = isObject(summary.harness) ? summary.harness : {};
  const rows: Array<[string, JsonObject]> = [];
  if (kind === "coding-agent") for (const row of list(harness.codingAgents)) rows.push([show(row.id), row]);
  if (kind === "mcp-server") for (const row of list(harness.mcpServers)) rows.push([show(row.name), row]);
  if (kind === "skill") for (const row of list(harness.skills)) rows.push([show(row.name), row]);
  if (kind === "plugin") for (const row of list(harness.plugins)) rows.push([show(row.name), row]);
  if (kind === "service") for (const row of list(summary.services)) rows.push([show(row.key), row]);
  return new Map(rows);
}

/**
 * The drift of a summary's harness from a baseline (the policy key `harness.baseline`'s `value.items`), in the
 * baseline's order: `missing` when the item is not there; for a service, `stopped` when its state is not `ok` or
 * `degraded`; `changed` when the baseline names a digest and the item carries another (or none); `outdated` when the
 * baseline names a `minVersion` and the item's version is below it or not dotted numbers. One state per item, the first
 * that holds in that order. An MCP server that is `down` is `stopped`.
 */
export function harnessDrift(baselineItems: unknown, summary: unknown): DriftItem[] {
  const doc = isObject(summary) ? summary : {};
  const drift: DriftItem[] = [];
  for (const item of list(baselineItems)) {
    const kind = item.kind as DriftKind, name = str(item.name);
    if (name === undefined || !["coding-agent", "mcp-server", "skill", "plugin", "service"].includes(show(kind))) continue;
    const have = installed(doc, kind).get(name);
    const state: DriftState | undefined = have === undefined ? "missing"
      : kind === "service" && !["ok", "degraded"].includes(show(have.state)) ? "stopped"
      : kind === "mcp-server" && have.health === "down" ? "stopped"
      : typeof item.digest === "string" && have.digest !== item.digest ? "changed"
      : typeof item.minVersion === "string" && versionBelow(str(have.version), item.minVersion) ? "outdated"
      : undefined;
    if (state !== undefined) drift.push({ kind, name, state });
  }
  return drift;
}

/** Every string inside `value`, with its JSON pointer. */
function strings(value: unknown, at: string, out: Array<[string, string]>): Array<[string, string]> {
  if (typeof value === "string") out.push([at, value]);
  else if (Array.isArray(value)) value.forEach((item, i) => strings(item, `${at}/${i}`, out));
  else if (isObject(value)) for (const [key, item] of Object.entries(value)) strings(item, `${at}/${key.replace(/~/g, "~0").replace(/\//g, "~1")}`, out);
  return out;
}

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/;

/**
 * FAC-SEM-128 on `{summary, baseline?}`: a node summary names no person, path or credential; names no item twice in a
 * list; and, when the policy it compared against carries a baseline, reports exactly `harnessDrift`'s drift under that
 * policy's revision. `baseline` is `{revision, items}`, the layer's revision and its `harness.baseline` value's items.
 */
function nodeSummaryRule(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-128", instancePath, message });
  const summary = isObject(value.summary) ? value.summary : {};
  for (const [at, text] of strings(summary, "/summary", [])) {
    if (secretValue(text)) flag(at, "a node summary carries no credential");
    else if (EMAIL.test(text)) flag(at, "a node summary names no person: no e-mail address");
    else if (hasHomePath(text)) flag(at, "a node summary carries no path");
  }
  const harness = isObject(summary.harness) ? summary.harness : {};
  const unique = (rows: JsonObject[], member: string, at: string) => {
    const seen = new Set<string>();
    rows.forEach((row, i) => {
      const name = show(row[member]);
      if (seen.has(name)) flag(`${at}/${i}/${member}`, `${name} is listed twice`);
      seen.add(name);
    });
  };
  unique(list(harness.codingAgents), "id", "/summary/harness/codingAgents");
  unique(list(harness.mcpServers), "name", "/summary/harness/mcpServers");
  unique(list(harness.skills), "name", "/summary/harness/skills");
  unique(list(harness.plugins), "name", "/summary/harness/plugins");
  unique(list(summary.services), "key", "/summary/services");
  const baseline = isObject(value.baseline) ? value.baseline : undefined;
  const drift = isObject(summary.drift) ? summary.drift : undefined;
  if (baseline === undefined) {
    if (drift !== undefined) flag("/summary/drift", "a summary reports drift only against a baseline its policy carries");
  } else if (drift === undefined) flag("/summary/drift", "the policy carries a baseline, so the summary reports its drift (an empty list when none)");
  else {
    if (drift.policyRevision !== baseline.revision) flag("/summary/drift/policyRevision", `the drift names policy revision ${show(drift.policyRevision)}, the baseline is revision ${show(baseline.revision)}`);
    const want = harnessDrift(baseline.items, summary);
    const have = list(drift.items).map((row) => ({ kind: row.kind, name: row.name, state: row.state }));
    if (JSON.stringify(have) !== JSON.stringify(want)) flag("/summary/drift/items", `the drift is ${JSON.stringify(want)}, as harnessDrift computes it`);
  }
  return findings;
}

export type RepairReason = "bad-signature" | "wrong-device" | "expired" | "policy-expired" | "not-allowlisted" | "person-declined";

/**
 * Whether a node runs a repair, in this order: the signature verifies under a key of its current policy key set
 * (`keys`, `{keyId, alg?, publicKey}`) over `policySigningInput`; the request names this device and organization; it
 * is inside `issuedAt` ≤ `at` < `expiresAt`, at most `MAX_REPAIR_DAYS` long; the policy is not expired (remote execution
 * stops with it, FAC-SEM-068); the policy's `repair.packages` lists the package's `agentRef` and `digest`; and the
 * person was told before it started (`notifiedAt` ≤ `at`) and did not decline. Otherwise the reason it is refused.
 */
export function repairDecision(input: unknown): { decision: "run" | "refuse"; reason?: RepairReason } {
  const value = isObject(input) ? input : {};
  const request = isObject(value.request) ? value.request : {};
  const refuse = (reason: RepairReason) => ({ decision: "refuse" as const, reason });
  const signature = isObject(request.signature) ? request.signature : {};
  const key = list(value.keys).find((candidate) => candidate.keyId === signature.keyId && (candidate.alg ?? "ed25519") === signature.alg);
  if (key === undefined || !verifyWith(key, policySigningInput(request), signature.value)) return refuse("bad-signature");
  const device = isObject(value.device) ? value.device : {};
  if (show(isObject(request.device) ? request.device.id : undefined) !== show(device.id) || show(isObject(request.org) ? request.org.id : undefined) !== show(device.org)) return refuse("wrong-device");
  const at = Date.parse(show(value.at ?? "")), from = Date.parse(show(request.issuedAt ?? "")), to = Date.parse(show(request.expiresAt ?? ""));
  if (!(from <= at && at < to && to - from <= MAX_REPAIR_DAYS * DAY_MS)) return refuse("expired");
  const layers = list(value.layers);
  if (!(at <= policyExpiry(layers))) return refuse("policy-expired");
  const allowed = resolvePolicy(layers)["repair.packages"]?.value;
  const pkg = isObject(request.package) ? request.package : {};
  if (!Array.isArray(allowed) || !allowed.filter(isObject).some((entry) => entry.agentRef === pkg.agentRef && entry.digest === pkg.digest)) return refuse("not-allowlisted");
  const notified = Date.parse(show(value.notifiedAt ?? ""));
  if (value.declined === true || !(notified <= at)) return refuse("person-declined");
  return { decision: "run" };
}

/** FAC-SEM-129 on `{request, keys, device: {id, org}, layers, at, notifiedAt?, declined?, decision, reason?}`: the node's decision is `repairDecision`'s. */
function repairRule(value: JsonObject): Finding[] {
  const want = repairDecision(value);
  if (value.decision === want.decision && (want.reason === undefined || value.reason === want.reason)) return [];
  return [{ code: "FAC-SEM-129", instancePath: "/decision", message: want.decision === "run" ? "nothing refuses this repair" : `the node must refuse this repair: ${show(want.reason)}` }];
}

export function nodeSummaryRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (kind === "node-summary") return nodeSummaryRule(value);
  if (kind === "repair-run") return repairRule(value);
  return undefined;
}
// #endregion node-summary
