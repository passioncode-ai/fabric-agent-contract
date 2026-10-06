// #region route-rules — docs: docs/specification/runners.md#runner-routes
import { type Finding, type JsonObject, isObject } from "./findings.js";

const candidates = (value: JsonObject) => (Array.isArray(value.candidates) ? value.candidates.filter(isObject) : []);

/**
 * FAC-SEM-028 (DEC-0026): one candidate per runner kind. A route is an ordered
 * preference list; the same kind twice is either a duplicate or a reordering the
 * schema cannot see — JSON Schema cannot express uniqueness by a property.
 *
 * FAC-SEM-029 (DEC-0026): a candidate whose session policy is attach "never" and
 * spawn "never" can never serve, so the route silently never reaches it.
 */
function runnerRoute(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const kinds = new Set<string>();
  candidates(value).forEach((candidate, index) => {
    const kind = String(candidate.runnerKind);
    if (kinds.has(kind)) findings.push({ code: "FAC-SEM-028", instancePath: `/candidates/${index}/runnerKind`, message: `runner kind ${kind} appears in the route more than once` });
    kinds.add(kind);
    const session = isObject(candidate.session) ? candidate.session : {};
    if (session.attach === "never" && session.spawn === "never") {
      findings.push({ code: "FAC-SEM-029", instancePath: `/candidates/${index}/session`, message: `candidate ${kind} can never run: attach and spawn are both "never"` });
    }
  });
  return findings;
}

/**
 * FAC-SEM-030 (DEC-0026, DEC-0010): every candidate names an admitted provider
 * revision. A route grants nothing on its own; admission and binding stay separate
 * lifecycles, as for accounts (FAC-SEM-008 is the binding-bundle half).
 */
function routeBundle(value: JsonObject): Finding[] {
  const route = isObject(value.route) ? value.route : {};
  const admissions = Array.isArray(value.admissions) ? value.admissions.filter(isObject) : [];
  const admitted = new Set(
    admissions
      .filter((admission) => admission.state === "admitted")
      .map((admission) => (isObject(admission.provider) ? `${String(admission.provider.id)}@${String(admission.provider.revision)}` : ""))
  );
  const findings: Finding[] = [];
  candidates(route).forEach((candidate, index) => {
    const provider = isObject(candidate.provider) ? candidate.provider : {};
    const key = `${String(provider.id)}@${String(provider.revision)}`;
    if (!admitted.has(key)) findings.push({ code: "FAC-SEM-030", instancePath: `/route/candidates/${index}/provider`, message: `candidate ${String(candidate.runnerKind)} names provider ${key}, which is not an admitted revision` });
  });
  return findings;
}

export function routeRules(kind: string, value: unknown): Finding[] | undefined {
  if (!isObject(value)) return undefined;
  if (kind === "runner-route") return runnerRoute(value);
  if (kind === "route-bundle") return routeBundle(value);
  return undefined;
}
// #endregion route-rules
