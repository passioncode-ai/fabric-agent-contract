import type { ValidateFunction } from "ajv/dist/2020.js";
import { type Finding, type JsonObject, indexed, isObject } from "./findings.js";
import { hasHomePath } from "./activity-rules.js";
import { SCHEMA_PREFIX } from "./contract.js";
import { secretValue } from "./secret-shape.js";
import { createValidatorSync } from "./validator.js";

// #region agent-health, docs: docs/specification/agent-health.md
/**
 * One reading of a product's or agent's health (DEC-0179): `{schema, product, version, at, state, checks}`, counts and
 * codes only (DEC-0157). `worstState` is HL-2's order, `readHealth` is what a reader counts from an answer (HL-5), and
 * `agentHealthRules` is `FAC-SEM-181` for one report (`agent-health`) and for a service's well-known answer read beside
 * it (`agent-health-service`, HL-7).
 */
export const AGENT_HEALTH = "agent-health/1";
export type HealthState = "ok" | "unknown" | "warn" | "fail";
/** HL-2: the order of the states, best first; `unknown` is worse than `ok`, so nothing unmeasured reads as healthy. */
export const STATE_ORDER: readonly HealthState[] = ["ok", "unknown", "warn", "fail"];
/** HL-3: the closed list of areas. */
export const AREAS = ["lifecycle", "sessions", "accounts", "crash", "errors", "update", "environment", "security", "connection"] as const;

const rank = (state: unknown): number => STATE_ORDER.indexOf(state as HealthState);

/** HL-2: the worst of `states` in the order ok < unknown < warn < fail; `unknown` for none, or for a value no state. */
export function worstState(states: readonly unknown[]): HealthState {
  if (states.length === 0) return "unknown";
  let worst = 0;
  for (const state of states) {
    const r = rank(state);
    if (r < 0) return "unknown";
    worst = Math.max(worst, r);
  }
  return STATE_ORDER[worst] as HealthState;
}

/** A name a finding may print: one the schema's grammars let in and no detector refuses; otherwise its place. */
const named = (value: unknown, instead: string): string =>
  typeof value === "string" && /^[A-Za-z0-9_.-]{1,128}$/.test(value) && !secretValue(value) && !hasHomePath(value) ? value : instead;

/** FAC-SEM-181 over one report already valid by `agent-health.schema.json`. */
function reportFindings(value: JsonObject, base = ""): Finding[] {
  const findings: Finding[] = [];
  const add = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-181", instancePath: `${base}${instancePath}`, message });
  const hidden = (instancePath: string, name: unknown, what: string) => {
    if (typeof name !== "string") return;
    if (secretValue(name)) add(instancePath, `${what} is shaped like a credential; a health report carries codes, never a value (DEC-0157)`);
    else if (hasHomePath(name)) add(instancePath, `${what} holds a home folder; a health report carries codes, never a path (DEC-0157)`);
  };
  hidden("/product", value.product, "the product id");
  const checks = Array.isArray(value.checks) ? value.checks : [];
  const ids = new Set<string>();
  for (const [check, index] of indexed(checks)) {
    if (typeof check.id === "string") {
      if (ids.has(check.id)) add(`/checks/${index}/id`, `${named(check.id, "this check id")} is named once in a report`);
      ids.add(check.id);
      hidden(`/checks/${index}/id`, check.id, "a check id");
    }
    if (isObject(check.fix)) {
      hidden(`/checks/${index}/fix/tool`, check.fix.tool, "a fix's tool");
      hidden(`/checks/${index}/fix/capability`, check.fix.capability, "a fix's capability");
    }
  }
  const worst = worstState(checks.map((c) => (isObject(c) ? c.state : undefined)));
  if (value.state !== worst) {
    add("/state", checks.length === 0
      ? "a report with no checks is unknown: nothing measured is not healthy (HL-2)"
      : `state is the worst of the checks in the order ok < unknown < warn < fail, here ${worst} (HL-2)`);
  }
  return findings;
}

/** HL-7: a service's well-known answer read beside its health report: a degraded source is never read as ok. */
function serviceFindings(value: JsonObject): Finding[] {
  const wellKnown = value.wellKnown;
  const health = value.health;
  if (!isObject(health)) return [];
  const findings = reportFindings(health, "/health");
  if (!isObject(wellKnown)) return findings;
  const degraded = Array.isArray(wellKnown.degraded) ? wellKnown.degraded : [];
  if ((degraded.length > 0 || wellKnown.status === "degraded") && health.state === "ok") {
    findings.push({
      code: "FAC-SEM-181",
      instancePath: "/health/state",
      message: "the well-known answer lists a degraded source, so the health report beside it is not ok: a setup entry is warn, any other at least warn (HL-7)"
    });
  }
  return findings;
}

/** FAC-SEM-181: `agent-health` (one report) and `agent-health-service` (`{wellKnown, health}`); undefined for any other kind. */
export function agentHealthRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (kind === "agent-health") return reportFindings(value);
  if (kind === "agent-health-service") return serviceFindings(value);
  return undefined;
}

let shape: ValidateFunction | undefined;

/**
 * HL-5: the state a reader counts from one answer: the report's `state` when it is valid by the schema and passes
 * FAC-SEM-181, otherwise `unknown` with the reason (`schema` or `FAC-SEM-181`). No answer at all (`undefined` or `null`: a timeout,
 * a refused call) is `unknown` with `no-answer`. A reader never counts a report it cannot trust as ok.
 */
export function readHealth(answer: unknown): { state: HealthState; reason?: "no-answer" | "schema" | "FAC-SEM-181" } {
  if (answer === undefined || answer === null) return { state: "unknown", reason: "no-answer" };
  shape ??= createValidatorSync().getSchema(`${SCHEMA_PREFIX}schemas/agent-health.schema.json`) as ValidateFunction;
  if (shape(answer) !== true) return { state: "unknown", reason: "schema" };
  if (reportFindings(answer as JsonObject).length > 0) return { state: "unknown", reason: "FAC-SEM-181" };
  return { state: (answer as JsonObject).state as HealthState };
}

/** HL-6: the key a watcher keeps one episode under: `<product>:<check id>@<UTC day of at>`. */
export function episodeKey(product: string, checkId: string, at: number): string {
  return `${product}:${checkId}@${new Date(at * 1000).toISOString().slice(0, 10)}`;
}
// #endregion agent-health
