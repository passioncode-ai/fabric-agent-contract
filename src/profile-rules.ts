// #region profile-rules — docs: docs/specification/runners.md#runner-and-model-profiles
import { type Finding, type JsonObject, isObject, jsonEqual, show, toNumber } from "./findings.js";
import { secretValue } from "./secret-shape.js";

/**
 * DEC-0046 (Fabric ADR-0147): one model catalogue, named model profiles, runner profiles with a route, and one
 * resolution order in which the project's model classes restrict and never choose.
 */
const list = (value: unknown): JsonObject[] => (Array.isArray(value) ? value.filter(isObject) : []);
const strings = (value: unknown): string[] => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);

/** The vendor login each subscription is, and the one runner kind it runs in (DEC-0046, ADR-0147 decision 2). */
export const SUBSCRIPTION_RUNNER: Readonly<Record<string, string>> = { claude: "claude-code", kimi: "kimi-code", chatgpt: "codex" };

/** The model class of a model whose vendor publishes its weights openly (DEC-0083). Descriptive: a policy admits and excludes
 * nothing by it. */
export const OPEN_VENDOR = "open-vendor";
/** What a lane reads when it reads what a member, a client or the public sends (DEC-0083). */
export const USER_CONTENT = "user-content";

/** The levels a profile is chosen at, most specific first. */
export const RESOLUTION_ORDER = ["request", "agent", "binding", "estate"] as const;
export type ResolutionLevel = (typeof RESOLUTION_ORDER)[number];

export interface ResolutionInput {
  /** A `model-catalogue` document. */
  catalogue: unknown;
  /** The model profiles that can be named: the estate's and the agent's own. */
  profiles: unknown;
  /** The profile id chosen at each level; `estate` is the estate default. */
  choices: Partial<Record<ResolutionLevel, string>>;
  /** The project's spend policy (L1), whose `modelClasses` restrict the resolved set. */
  policy?: unknown;
}

export type Resolution =
  | { from: ResolutionLevel; profile: string; models: string[] }
  | { refused: "no-profile" }
  | { refused: "unknown-profile"; profile: string }
  | { refused: "model-classes-empty"; profile: string; policy: { id: string; revision: number } };

/**
 * The reference resolution (DEC-0046, FAC-SEM-060), which the kit ports: the request's profile, else the agent's,
 * else the binding's or project's, else the estate default. When the project's policy names `modelClasses`, a model
 * stays only if every class the catalogue gives it is allowed — a model the catalogue does not hold has no classes to
 * check and does not stay. The descriptive class `open-vendor` is not checked (DEC-0083, a deliberate exception to the
 * every-class rule), and a model with no other class does not stay. An empty result refuses the launch, naming the
 * policy.
 */
export function resolveModelProfile(input: ResolutionInput): Resolution {
  const level = RESOLUTION_ORDER.find((name) => typeof input.choices[name] === "string");
  if (level === undefined) return { refused: "no-profile" };
  const id = input.choices[level] as string;
  const profile = list(input.profiles).find((item) => item.id === id);
  if (!profile) return { refused: "unknown-profile", profile: id };
  const models = strings(profile.models);
  const policy = isObject(input.policy) ? input.policy : undefined;
  if (!policy || !Array.isArray(policy.modelClasses)) return { from: level, profile: id, models };
  const allowed = new Set(strings(policy.modelClasses));
  const rows = new Map(list(isObject(input.catalogue) ? input.catalogue.models : undefined).map((row) => [row.id, row] as const));
  const within = models.filter((model) => {
    const row = rows.get(model);
    const admission = row === undefined ? [] : strings(row.classes).filter((name) => name !== OPEN_VENDOR);
    return admission.length > 0 && admission.every((name) => allowed.has(name));
  });
  if (within.length) return { from: level, profile: id, models: within };
  const meta = isObject(policy.meta) ? policy.meta : {};
  return { refused: "model-classes-empty", profile: id, policy: { id: show(meta.id), revision: toNumber(meta.revision) } };
}

/** FAC-SEM-058: the catalogue holds a model once, and its routing object never orders a provider it ignores. */
function modelCatalogue(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const seen = new Set<unknown>();
  list(value.models).forEach((row, index) => {
    if (seen.has(row.id)) findings.push({ code: "FAC-SEM-058", instancePath: `/models/${index}/id`, message: `model ${show(row.id)} is catalogued more than once` });
    seen.add(row.id);
    const routing = isObject(row.provider) ? row.provider : {};
    const ignored = new Set(strings(routing.ignore));
    for (const slug of strings(routing.order)) {
      // A base slug covers its variants (`deepinfra` covers `deepinfra/turbo`), so an ordered variant of an ignored
      // provider is ordered and ignored at once.
      if (ignored.has(slug) || ignored.has(slug.split("/")[0] as string)) findings.push({ code: "FAC-SEM-058", instancePath: `/models/${index}/provider`, message: `model ${show(row.id)} both orders and ignores provider ${slug}` });
    }
  });
  return findings;
}

/** FAC-SEM-058: the estate's set of model profiles holds a profile id once. */
function modelProfiles(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const seen = new Set<unknown>();
  list(value.profiles).forEach((profile, index) => {
    if (seen.has(profile.id)) findings.push({ code: "FAC-SEM-058", instancePath: `/profiles/${index}/id`, message: `model profile ${show(profile.id)} is declared more than once` });
    seen.add(profile.id);
  });
  return findings;
}

/**
 * FAC-SEM-059: a subscription runs only in its vendor's runner (a Claude login only in Claude Code, a Kimi login only
 * in Kimi Code, a ChatGPT login only in Codex); a key route's model allow-list is the profile's own model profile, and
 * its key is a reference, never a key.
 */
function runnerProfile(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  if (value.route === "subscription" && isObject(value.subscription)) {
    const login = show(value.subscription.login);
    // Own members only: a login named `constructor` or `__proto__` must not read Object.prototype into the message.
    const runner = Object.hasOwn(SUBSCRIPTION_RUNNER, login) ? SUBSCRIPTION_RUNNER[login] : undefined;
    if (runner !== value.runnerKind) findings.push({ code: "FAC-SEM-059", instancePath: "/runnerKind", message: `a ${login} subscription runs only in ${runner ?? "its vendor's runner"}, not in ${show(value.runnerKind)}; another runner takes the key route` });
  }
  if (value.route === "key" && isObject(value.key)) {
    if (value.key.modelAllowList !== value.modelProfile) findings.push({ code: "FAC-SEM-059", instancePath: "/key/modelAllowList", message: `the key admits the models of ${show(value.key.modelAllowList)}, but the profile runs ${show(value.modelProfile)}` });
    if (typeof value.key.ref === "string" && secretValue(value.key.ref)) findings.push({ code: "FAC-SEM-059", instancePath: "/key/ref", message: "the key is named by its secret reference, never by its value" });
  }
  return findings;
}

/**
 * FAC-SEM-060: a recorded resolution is the one the order gives — every model a profile names is catalogued, and
 * `resolved` equals `resolveModelProfile` over the same inputs, an empty class intersection refused with the policy
 * named.
 */
function profileResolution(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const catalogued = new Set(list(isObject(value.catalogue) ? value.catalogue.models : undefined).map((row) => row.id));
  const ids = new Set<unknown>();
  list(value.profiles).forEach((profile, i) => {
    // An agent's profile and an estate profile never share an id: the resolver would take whichever came first.
    if (ids.has(profile.id)) findings.push({ code: "FAC-SEM-060", instancePath: `/profiles/${i}/id`, message: `profile id ${show(profile.id)} is offered more than once to one resolution` });
    ids.add(profile.id);
    strings(profile.models).forEach((model, j) => {
      if (!catalogued.has(model)) findings.push({ code: "FAC-SEM-060", instancePath: `/profiles/${i}/models/${j}`, message: `profile ${show(profile.id)} names ${model}, which the catalogue does not hold` });
    });
  });
  const choices = isObject(value.choices) ? (value.choices as ResolutionInput["choices"]) : {};
  const expected = resolveModelProfile({ catalogue: value.catalogue, profiles: value.profiles, choices, policy: value.policy });
  if (!jsonEqual(value.resolved, expected)) findings.push({ code: "FAC-SEM-060", instancePath: "/resolved", message: `the resolution is ${JSON.stringify(expected)}` });
  return findings;
}

/**
 * FAC-SEM-112 (DEC-0083) for one profile: the models that run when the lane reads user content and none of them is an
 * open-vendor model, or `undefined` when the profile does not read user content or its route has one. Under
 * `between-turns` every model may run; under `none` — and under any other value, failing closed — only the first one.
 * A model the catalogue does not hold, or whose row is not `open-vendor`, counts as closed. Never throws.
 */
export function closedUserContentRoute(profile: unknown, catalogue: unknown): string[] | undefined {
  if (!isObject(profile) || !strings(profile.reads).includes(USER_CONTENT)) return undefined;
  const models: unknown[] = Array.isArray(profile.models) ? profile.models : [];
  const route = profile.fallback === "between-turns" ? models : models.slice(0, 1);
  const open = new Set<string>();
  for (const row of list(isObject(catalogue) ? catalogue.models : undefined)) {
    if (typeof row.id === "string" && strings(row.classes).includes(OPEN_VENDOR)) open.add(row.id);
  }
  if (route.some((model) => typeof model === "string" && open.has(model))) return undefined;
  return route.map((model) => show(model));
}

/** How a closed route is named in a finding: under `between-turns` all of it, otherwise its first model. */
const closedRoute = (fallback: unknown, closed: string[]): string =>
  fallback === "between-turns" ? "none of its models is" : `its first model, ${closed[0] ?? "none"}, is not`;

/**
 * FAC-SEM-112 (DEC-0083): a profile that reads user content has an open-vendor route — with `fallback: none` its first
 * model is `open-vendor` in the catalogue, with `between-turns` at least one of its models is — so the lane never runs
 * on closed vendors alone, which refuse the content it exists to handle. The resolution's outcome is held to the same
 * test: when the resolved profile reads user content and its own route is open, the models the policy leaves must
 * still give one, or the policy is named as what leaves the lane closed (one cause, one finding).
 */
function openVendorRoutes(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const profiles = list(value.profiles);
  profiles.forEach((profile, i) => {
    const closed = closedUserContentRoute(profile, value.catalogue);
    if (closed === undefined) return;
    findings.push({ code: "FAC-SEM-112", instancePath: `/profiles/${i}/models`, message: `profile ${show(profile.id)} reads user content, but ${closedRoute(profile.fallback, closed)} open-vendor in the catalogue: the lane would run on closed vendors alone` });
  });
  const choices = isObject(value.choices) ? (value.choices as ResolutionInput["choices"]) : {};
  const outcome = resolveModelProfile({ catalogue: value.catalogue, profiles: value.profiles, choices, policy: value.policy });
  if (!("models" in outcome)) return findings;
  const profile = profiles.find((item) => item.id === outcome.profile);
  if (!profile || closedUserContentRoute(profile, value.catalogue) !== undefined) return findings;
  const closed = closedUserContentRoute({ ...profile, models: outcome.models }, value.catalogue);
  if (closed === undefined) return findings;
  const meta = isObject(value.policy) && isObject(value.policy.meta) ? value.policy.meta : {};
  findings.push({ code: "FAC-SEM-112", instancePath: "/resolved/models", message: `the policy ${show(meta.id)} leaves profile ${show(profile.id)}'s lane on closed vendors alone: of the models it admits, ${closedRoute(profile.fallback, closed)} open-vendor in the catalogue` });
  return findings;
}

export function profileRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (kind === "model-catalogue") return modelCatalogue(value);
  if (kind === "model-profiles") return modelProfiles(value);
  if (kind === "runner-profile") return runnerProfile(value);
  if (kind === "profile-resolution") return [...profileResolution(value), ...openVendorRoutes(value)];
  return undefined;
}
// #endregion profile-rules
