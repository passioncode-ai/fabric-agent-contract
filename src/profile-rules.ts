// #region profile-rules — docs: docs/specification/runners.md#runner-and-model-profiles
import { type Finding, type JsonObject, isObject, jsonEqual } from "./findings.js";
import { secretValue } from "./secret-shape.js";

/**
 * DEC-0046 (Fabric ADR-0147): one model catalogue, named model profiles, runner profiles with a route, and one
 * resolution order in which the project's model classes restrict and never choose.
 */
const list = (value: unknown): JsonObject[] => (Array.isArray(value) ? value.filter(isObject) : []);
const strings = (value: unknown): string[] => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);

/** The vendor login each subscription is, and the one runner kind it runs in (DEC-0046, ADR-0147 decision 2). */
export const SUBSCRIPTION_RUNNER: Readonly<Record<string, string>> = { claude: "claude-code", kimi: "kimi-code", chatgpt: "codex" };

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
 * check and does not stay. An empty result refuses the launch, naming the policy.
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
    return row !== undefined && strings(row.classes).every((name) => allowed.has(name));
  });
  if (within.length) return { from: level, profile: id, models: within };
  const meta = isObject(policy.meta) ? policy.meta : {};
  return { refused: "model-classes-empty", profile: id, policy: { id: String(meta.id), revision: Number(meta.revision) } };
}

/** FAC-SEM-058: the catalogue holds a model once, and its routing object never orders a provider it ignores. */
function modelCatalogue(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const seen = new Set<unknown>();
  list(value.models).forEach((row, index) => {
    if (seen.has(row.id)) findings.push({ code: "FAC-SEM-058", instancePath: `/models/${index}/id`, message: `model ${String(row.id)} is catalogued more than once` });
    seen.add(row.id);
    const routing = isObject(row.provider) ? row.provider : {};
    const ignored = new Set(strings(routing.ignore));
    for (const slug of strings(routing.order)) {
      if (ignored.has(slug)) findings.push({ code: "FAC-SEM-058", instancePath: `/models/${index}/provider`, message: `model ${String(row.id)} both orders and ignores provider ${slug}` });
    }
  });
  return findings;
}

/** FAC-SEM-058: the estate's set of model profiles holds a profile id once. */
function modelProfiles(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const seen = new Set<unknown>();
  list(value.profiles).forEach((profile, index) => {
    if (seen.has(profile.id)) findings.push({ code: "FAC-SEM-058", instancePath: `/profiles/${index}/id`, message: `model profile ${String(profile.id)} is declared more than once` });
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
    const login = String(value.subscription.login);
    const runner = SUBSCRIPTION_RUNNER[login];
    if (runner !== value.runnerKind) findings.push({ code: "FAC-SEM-059", instancePath: "/runnerKind", message: `a ${login} subscription runs only in ${runner ?? "its vendor's runner"}, not in ${String(value.runnerKind)}; another runner takes the key route` });
  }
  if (value.route === "key" && isObject(value.key)) {
    if (value.key.modelAllowList !== value.modelProfile) findings.push({ code: "FAC-SEM-059", instancePath: "/key/modelAllowList", message: `the key admits the models of ${String(value.key.modelAllowList)}, but the profile runs ${String(value.modelProfile)}` });
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
  list(value.profiles).forEach((profile, i) => {
    strings(profile.models).forEach((model, j) => {
      if (!catalogued.has(model)) findings.push({ code: "FAC-SEM-060", instancePath: `/profiles/${i}/models/${j}`, message: `profile ${String(profile.id)} names ${model}, which the catalogue does not hold` });
    });
  });
  const choices = isObject(value.choices) ? (value.choices as ResolutionInput["choices"]) : {};
  const expected = resolveModelProfile({ catalogue: value.catalogue, profiles: value.profiles, choices, policy: value.policy });
  if (!jsonEqual(value.resolved, expected)) findings.push({ code: "FAC-SEM-060", instancePath: "/resolved", message: `the resolution is ${JSON.stringify(expected)}` });
  return findings;
}

export function profileRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (kind === "model-catalogue") return modelCatalogue(value);
  if (kind === "model-profiles") return modelProfiles(value);
  if (kind === "runner-profile") return runnerProfile(value);
  if (kind === "profile-resolution") return profileResolution(value);
  return undefined;
}
// #endregion profile-rules
