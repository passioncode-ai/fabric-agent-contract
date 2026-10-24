import { type Finding, type JsonObject, isObject, show } from "./findings.js";
import { expectedDecision, keyWindowHolds, policySigningInput, resolvePolicy, verifyWith } from "./device-rules.js";
import { hasHomePath } from "./activity-rules.js";
import { secretValue } from "./secret-shape.js";
import { strictTime } from "./rfc3339.js";

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
 * that holds in that order. An MCP server that is `down` is `stopped`. DEC-0102: a digest is compared only for a skill or
 * a plugin and a version only for a coding agent or a plugin, the kinds whose summary rows carry them.
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
      : typeof item.digest === "string" && (kind === "skill" || kind === "plugin") && have.digest !== item.digest ? "changed"
      : typeof item.minVersion === "string" && (kind === "coding-agent" || kind === "plugin") && versionBelow(str(have.version), item.minVersion) ? "outdated"
      : undefined;
    if (state !== undefined) drift.push({ kind, name, state });
  }
  return drift;
}

/** Every string inside `value`, with its JSON pointer, walked with an explicit stack so depth never throws (DEC-0102). */
function strings(value: unknown, at: string, out: Array<[string, string]>): Array<[string, string]> {
  const stack: Array<[unknown, string]> = [[value, at]];
  while (stack.length > 0) {
    const [node, where] = stack.pop() as [unknown, string];
    if (typeof node === "string") out.push([where, node]);
    else if (Array.isArray(node)) for (let i = node.length - 1; i >= 0; i -= 1) stack.push([node[i], `${where}/${i}`]);
    else if (isObject(node)) for (const key of Object.keys(node).reverse()) stack.push([node[key], `${where}/${key.replace(/~/g, "~0").replace(/\//g, "~1")}`]);
  }
  return out;
}

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/;

/**
 * FAC-SEM-128 on `{summary, baseline?, org?}`: a node summary names no person, path or credential; names no item
 * twice in a list; when the policy it compared against carries a baseline, reports exactly `harnessDrift`'s drift under
 * that policy's revision. `baseline` is `{revision, items}`, the layer's revision and its `harness.baseline` value's
 * items. DEC-0102: its `context` is `org:` and the certificate's `org.id` (`org`) as written.
 */
function nodeSummaryRule(value: JsonObject): Finding[] {
  const findings: Finding[] = contentFindings(isObject(value.summary) ? value.summary : {}, "/summary");
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-128", instancePath, message });
  const summary = isObject(value.summary) ? value.summary : {};
  const baseline = isObject(value.baseline) ? value.baseline : undefined;
  if (typeof value.org === "string" && summary.context !== `org:${value.org}`) flag("/summary/context", "a node summary names its enrollment's own organization, org: and the certificate's org.id as written");
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

/** FAC-SEM-128's clauses that read the summary alone: no credential, e-mail address or home path; no item twice. */
function contentFindings(summary: JsonObject, prefix: string): Finding[] {
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-128", instancePath, message });
  for (const [at, text] of strings(summary, prefix, [])) {
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
  unique(list(harness.codingAgents), "id", `${prefix}/harness/codingAgents`);
  unique(list(harness.mcpServers), "name", `${prefix}/harness/mcpServers`);
  unique(list(harness.skills), "name", `${prefix}/harness/skills`);
  unique(list(harness.plugins), "name", `${prefix}/harness/plugins`);
  unique(list(summary.services), "key", `${prefix}/services`);
  return findings;
}

/** The value of a policy key resolved over the signed layers only (`mdm`, `server`): a person's own `user` layer never sets it (DEC-0102). */
export function signedPolicyValue(layers: unknown, key: string): unknown {
  return resolvePolicy(list(layers).filter((layer) => layer.source !== "user"))[key]?.value;
}

/**
 * The baseline a node compares against (DEC-0101, DEC-0102): `harness.baseline` from the signed layers, with the revision
 * of the layer that sets it, or `undefined` when no signed layer does. FAC-SEM-128's `baseline` input is this.
 */
export function harnessBaseline(layers: unknown): { revision: unknown; items: unknown } | undefined {
  const signed = list(layers).filter((layer) => layer.source !== "user");
  const setting = resolvePolicy(signed)["harness.baseline"];
  if (setting === undefined || setting.from === "default") return undefined;
  const layer = signed.find((candidate) => candidate.source === setting.from);
  return { revision: layer?.revision, items: isObject(setting.value) ? setting.value.items : undefined };
}

export type RepairReason = "bad-signature" | "wrong-device" | "expired" | "policy-expired" | "not-allowlisted" | "person-declined" | "already-answered";

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
  // DEC-0102: a repair id runs at most once; a redelivered request is answered with the stored result, not run again.
  if (value.answered === true) return refuse("already-answered");
  const signature = isObject(request.signature) ? request.signature : {};
  const at = strictTime(value.at); // DEC-0115: the clock read as the key bounds are
  const key = list(value.keys).find((candidate) => candidate.keyId === signature.keyId && (candidate.alg ?? "ed25519") === signature.alg);
  // DEC-0102: the key's validity window is judged at `at`, as FAC-SEM-041 judges a policy's (F-B-106).
  const inWindow = (k: JsonObject) => keyWindowHolds(at, k);
  // A request with no canonical form (a lone surrogate, a fraction) is refused, never thrown (DEC-0102).
  let signed: Buffer | undefined;
  try {
    signed = policySigningInput(request);
  } catch {
    signed = undefined;
  }
  if (key === undefined || signed === undefined || !inWindow(key) || !verifyWith(key, signed, signature.value)) return refuse("bad-signature");
  const device = isObject(value.device) ? value.device : {};
  if (show(isObject(request.device) ? request.device.id : undefined) !== show(device.id) || show(isObject(request.org) ? request.org.id : undefined) !== show(device.org)) return refuse("wrong-device");
  const from = Date.parse(show(request.issuedAt ?? "")), to = Date.parse(show(request.expiresAt ?? ""));
  if (!(from <= at && at < to && to - from <= MAX_REPAIR_DAYS * DAY_MS)) return refuse("expired");
  const layers = list(value.layers);
  // DEC-0102: the same answer as FAC-SEM-068's remote execution, so the two rules never disagree on one policy.
  if (expectedDecision(layers, show(value.at), { kind: "remote-execution" }).decision === "refuse") return refuse("policy-expired");
  // DEC-0102: the allowlist is read from signed layers only; a person's own user layer never widens or empties it.
  const allowed = signedPolicyValue(layers, "repair.packages");
  const pkg = isObject(request.package) ? request.package : {};
  if (!Array.isArray(allowed) || !allowed.filter(isObject).some((entry) => entry.agentRef === pkg.agentRef && entry.digest === pkg.digest)) return refuse("not-allowlisted");
  // DEC-0102: a machine with role org-cloud binds no person; the organization's own signed request is its notice.
  const notified = Date.parse(show(value.notifiedAt ?? ""));
  if (device.role !== "org-cloud" && (value.declined === true || !(notified <= at))) return refuse("person-declined");
  return { decision: "run" };
}

/** FAC-SEM-129 on `{request, keys, device: {id, org, role?}, layers, at, notifiedAt?, declined?, answered?, decision, reason?}`: the node's decision is `repairDecision`'s. */
function repairRule(value: JsonObject): Finding[] {
  const want = repairDecision(value);
  if (value.decision === want.decision && value.reason === want.reason) return [];
  return [{ code: "FAC-SEM-129", instancePath: "/decision", message: want.decision === "run" ? "nothing refuses this repair" : `the node must refuse this repair: ${show(want.reason)}` }];
}

/**
 * DEC-0114: a check-in's `records.nodeSummary` read with the check-in (kind `device-check-in`): FAC-SEM-128's clauses
 * that need no policy, under the member's path, and the summary's `device.id` the checking-in device's.
 */
export function checkInSummaryFindings(checkIn: JsonObject): Finding[] {
  const records = isObject(checkIn.records) ? checkIn.records : {};
  if (!isObject(records.nodeSummary)) return [];
  const summary = records.nodeSummary;
  const findings = contentFindings(summary, "/records/nodeSummary");
  const own = isObject(checkIn.device) ? checkIn.device.id : undefined;
  const named = isObject(summary.device) ? summary.device.id : undefined;
  if (typeof named !== "string" || named !== own) findings.push({ code: "FAC-SEM-128", instancePath: "/records/nodeSummary/device/id", message: "a check-in's node summary is the checking-in device's" });
  return findings;
}

export function nodeSummaryRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (kind === "node-summary") return nodeSummaryRule(value);
  // DEC-0102: the summary read whole, as `pnpm validate` and the positive sweep read it: the clauses that need no policy.
  if (kind === "node-summary-document") return contentFindings(value, "");
  if (kind === "repair-run") return repairRule(value);
  return undefined;
}
// #endregion node-summary
