// #region route-rules — docs: docs/specification/runners.md#runner-routes
import { type Finding, type JsonObject, isObject } from "./findings.js";

const candidates = (value: JsonObject) => (Array.isArray(value.candidates) ? value.candidates.filter(isObject) : []);
const objectAt = (value: JsonObject, key: string): JsonObject => {
  const found = value[key];
  return isObject(found) ? found : {};
};
/** A revision reference compared whole: id, revision and content hash. Two revisions that share an id and a number but not a hash are two different objects. */
const refKey = (ref: unknown) => (isObject(ref) ? `${String(ref.id)}@${String(ref.revision)}#${String(ref.contentHash)}` : "");
const sameRef = (a: unknown, b: unknown) => refKey(a) !== "" && refKey(a) === refKey(b);

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
    const session = objectAt(candidate, "session");
    if (session.attach === "never" && session.spawn === "never") {
      findings.push({ code: "FAC-SEM-029", instancePath: `/candidates/${index}/session`, message: `candidate ${kind} can never run: attach and spawn are both "never"` });
    }
  });
  return findings;
}

/**
 * The checks a host runs when it pins a route: `{route, admissions, binding?, catalogue?}`.
 *
 * FAC-SEM-030 (DEC-0026, DEC-0029): every candidate names a provider revision admitted for the
 * route's capability — the whole reference (id, revision, content hash), never the id alone. A
 * route grants nothing; admission and binding stay separate lifecycles (FAC-SEM-008 is the
 * binding-bundle half).
 *
 * FAC-SEM-032 (DEC-0029): the binding that pins the route agrees with it — same project and
 * capability, the local-runner profile, its own provider is one of the candidates (so a reader
 * that ignores routes still binds an admitted candidate), and its `runnerRoute` names this route.
 *
 * FAC-SEM-033 (DEC-0029): every candidate's kind has an entry in the host's runner catalogue, and
 * a candidate that names a drive names one its entry offers. A host runs nothing the catalogue does
 * not name, so an uncatalogued candidate is one the walk can never start.
 */
function routeBundle(value: JsonObject): Finding[] {
  const route = objectAt(value, "route");
  const admissions = Array.isArray(value.admissions) ? value.admissions.filter(isObject) : [];
  const admitted = new Set(
    admissions
      .filter((admission) => admission.state === "admitted" && admission.capability === route.capability)
      .map((admission) => refKey(admission.provider))
  );
  const findings: Finding[] = [];
  candidates(route).forEach((candidate, index) => {
    const key = refKey(candidate.provider);
    if (!admitted.has(key)) findings.push({ code: "FAC-SEM-030", instancePath: `/route/candidates/${index}/provider`, message: `candidate ${String(candidate.runnerKind)} names provider ${key}, which is not a revision admitted for ${String(route.capability)}` });
  });
  if (isObject(value.binding)) findings.push(...bindingAgreement(value.binding, route));
  if (Array.isArray(value.catalogue)) findings.push(...catalogueAgreement(value.catalogue.filter(isObject), route));
  return findings;
}

function bindingAgreement(binding: JsonObject, route: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const disagree = (path: string, message: string) => findings.push({ code: "FAC-SEM-032", instancePath: `/binding/${path}`, message });
  if (binding.project !== route.project) disagree("project", `the binding is for ${String(binding.project)}, the route for ${String(route.project)}`);
  if (binding.capability !== route.capability) disagree("capability", `the binding binds ${String(binding.capability)}, the route orders ${String(route.capability)}`);
  if (binding.profileKind !== "local-runner") disagree("profileKind", `a runner route serves the local-runner profile, not ${String(binding.profileKind)}`);
  if (!candidates(route).some((candidate) => sameRef(candidate.provider, binding.provider))) disagree("provider", `the binding's provider ${refKey(binding.provider)} is not a candidate of the route`);
  if (binding.runnerRoute !== undefined && !sameRef(binding.runnerRoute, route.meta)) disagree("runnerRoute", `the binding pins ${refKey(binding.runnerRoute)}, not this route ${refKey(route.meta)}`);
  return findings;
}

function catalogueAgreement(catalogue: JsonObject[], route: JsonObject): Finding[] {
  const byKind = new Map(catalogue.map((entry) => [String(entry.kind), entry]));
  const findings: Finding[] = [];
  candidates(route).forEach((candidate, index) => {
    const kind = String(candidate.runnerKind);
    const entry = byKind.get(kind);
    if (!entry) {
      findings.push({ code: "FAC-SEM-033", instancePath: `/route/candidates/${index}/runnerKind`, message: `runner kind ${kind} has no entry in the host's catalogue` });
      return;
    }
    if (candidate.drive !== undefined && !Object.hasOwn(objectAt(entry, "drives"), String(candidate.drive))) {
      findings.push({ code: "FAC-SEM-033", instancePath: `/route/candidates/${index}/drive`, message: `the catalogue entry for ${kind} offers no drive ${String(candidate.drive)}` });
    }
  });
  return findings;
}

/**
 * FAC-SEM-034 (DEC-0029): a route event `{route, event}` tells the truth about the route it names.
 * The event pins this route revision, project and capability; every candidate it names sits at
 * that index of the route; a selection walks from the first candidate, so the probes name each
 * candidate above the selected one exactly once, in order; an exhausted event probes them all; an
 * attach or spawn happens only where the candidate's session policy allows it; "held" answers
 * only a route that declares `exhausted: hold`; a switch moves to another candidate, and moves
 * back up for "preferred-available" only under `recovery: reprobe`.
 */
function routeEvent(value: JsonObject): Finding[] {
  const route = objectAt(value, "route");
  const event = objectAt(value, "event");
  const list = candidates(route);
  const findings: Finding[] = [];
  const wrong = (path: string, message: string) => findings.push({ code: "FAC-SEM-034", instancePath: `/event${path}`, message });

  if (!sameRef(event.route, route.meta)) wrong("/route", `the event names route ${refKey(event.route)}, not ${refKey(route.meta)}`);
  if (event.project !== route.project) wrong("/project", `the event is for ${String(event.project)}, the route for ${String(route.project)}`);
  if (event.capability !== route.capability) wrong("/capability", `the event names ${String(event.capability)}, the route orders ${String(route.capability)}`);

  const indexOf = (ref: JsonObject) => (typeof ref.index === "number" && Number.isInteger(ref.index) ? ref.index : -1);
  const candidateAt = (ref: JsonObject, path: string): JsonObject | undefined => {
    const index = indexOf(ref);
    const candidate = index >= 0 ? list[index] : undefined;
    if (!candidate || candidate.runnerKind !== ref.runnerKind || (ref.provider !== undefined && !sameRef(candidate.provider, ref.provider))) {
      wrong(path, `candidate ${String(ref.index)} (${String(ref.runnerKind)}) is not that position of the route`);
      return undefined;
    }
    return candidate;
  };

  const probes = Array.isArray(event.probes) ? event.probes.filter(isObject) : [];
  probes.forEach((probe, position) => {
    const candidate = candidateAt(probe, `/probes/${position}`);
    if (candidate && probe.result === "no-held-session" && objectAt(candidate, "session").spawn !== "never") {
      wrong(`/probes/${position}/result`, `${String(probe.runnerKind)} may spawn, so finding no held session does not pass it over`);
    }
    if (candidate && probe.result === "spawn-failed" && objectAt(candidate, "session").spawn !== "allowed") {
      wrong(`/probes/${position}/result`, `${String(probe.runnerKind)} has spawn: never, so it cannot have failed to spawn`);
    }
  });
  const expectProbes = (count: number) => {
    const indexes = probes.map(indexOf);
    const expected = Array.from({ length: count }, (_, index) => index);
    if (indexes.length !== expected.length || indexes.some((index, position) => index !== expected[position])) {
      wrong("/probes", `the walk must record candidates ${expected.join(", ") || "none"} in order; it records ${indexes.join(", ") || "none"}`);
    }
  };

  if (event.kind === "runner-exhausted") {
    expectProbes(list.length);
    if (event.answer === "held" && route.exhausted !== "hold") wrong("/answer", `the route does not declare exhausted: hold, so an exhausted walk answers capability-unavailable`);
    return findings;
  }

  const selected = objectAt(event, "selected");
  const chosen = candidateAt(selected, "/selected");
  if (chosen) {
    const session = objectAt(chosen, "session");
    if (selected.session === "attached" && session.attach !== "preferred") wrong("/selected/session", `${String(selected.runnerKind)} has attach: never, so the host cannot attach it`);
    if (selected.session === "spawned" && session.spawn !== "allowed") wrong("/selected/session", `${String(selected.runnerKind)} has spawn: never, so the host cannot spawn it`);
    if (chosen.drive !== undefined && selected.drive !== undefined && selected.drive !== chosen.drive) wrong("/selected/drive", `the route runs ${String(selected.runnerKind)} through ${String(chosen.drive)}, not ${String(selected.drive)}`);
    if (event.sticky === true) {
      // A sticky relaunch keeps the conversation's runner and walks nothing above it.
      if (route.recovery === "reprobe") wrong("/sticky", "a route with recovery: reprobe walks from the top at every launch");
      if (event.conversation === undefined) wrong("/sticky", "only a conversation can keep its runner");
      expectProbes(0);
    } else expectProbes(indexOf(selected));
  }

  if (event.kind === "runner-switched") {
    const from = objectAt(event, "from");
    candidateAt(from, "/from");
    if (indexOf(from) === indexOf(selected)) wrong("/from", "a switch moves to another candidate");
    if (event.reason === "preferred-available") {
      if (route.recovery !== "reprobe") wrong("/reason", "only a route with recovery: reprobe moves a conversation back to a preferred runner");
      if (!(indexOf(selected) < indexOf(from))) wrong("/reason", "preferred-available moves to a higher-preference candidate");
    }
  }
  return findings;
}

export function routeRules(kind: string, value: unknown): Finding[] | undefined {
  if (!isObject(value)) return undefined;
  if (kind === "runner-route") return runnerRoute(value);
  if (kind === "route-bundle") return routeBundle(value);
  if (kind === "route-event") return routeEvent(value);
  return undefined;
}
// #endregion route-rules
