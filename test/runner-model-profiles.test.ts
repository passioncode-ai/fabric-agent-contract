import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { RESOLUTION_ORDER, SUBSCRIPTION_RUNNER, resolveModelProfile } from "../src/profile-rules.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";

// DEC-0046 (Fabric ADR-0147): one model catalogue, named model profiles, runner profiles with a subscription-or-key
// route, one resolution order in which the project's model classes restrict and never choose.
const root = projectRoot();
type Json = Record<string, unknown> & { [key: string]: any };
const load = (relative: string) => JSON.parse(readFileSync(path.join(root, "fixtures", relative), "utf8")) as Json;
const validator = await createValidator();
const valid = (schema: string, value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}`, value).valid;
const codes = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((finding) => finding.code);
const runners = readFileSync(path.join(root, "docs/specification/runners.md"), "utf8");
const schema = (name: string) => JSON.parse(readFileSync(path.join(root, "schemas", name), "utf8")) as Json;

describe("the model catalogue and its vocabulary (DEC-0046, FAC-SEM-058)", () => {
  const catalogue = load("positive/registry-models.json");

  it("holds the models measured on 2026-10-11 as a positive fixture, each with classes, endpoints, tool use and a price reference", () => {
    expect(valid("registry-models.schema.json", catalogue)).toBe(true);
    const ids = catalogue.models.map((row: Json) => row.id);
    for (const id of ["deepseek/deepseek-v4-pro", "qwen/qwen3.8-max-0902", "z-ai/glm-5.3-prime", "minimax/minimax-m3", "mistralai/devstral-2512", "google/gemini-3.8-flash", "x-ai/grok-build-0.1", "anthropic/claude-haiku-5.5", "anthropic/claude-sonnet-5.5"]) expect(ids).toContain(id);
    expect(catalogue.models.find((row: Json) => row.id === "openai/gpt-6.1-sol").toolUse.status).toBe("blocked");
  });

  it("closes the vocabulary: runners.md lists exactly the schema's classes, and the spend policy and the grant read the same list", () => {
    const listed = /\*\*Model classes\.\*\*([^\n]+(?:\n[^\n]+)*?)\n\n/.exec(runners)?.[1] ?? "";
    const named = [...listed.matchAll(/`([a-z-]+)`/g)].map((match) => match[1]).sort();
    expect(named).toEqual([...schema("registry-models.schema.json").$defs.modelClass.enum].sort());
    // DEC-0083: a policy and a grant name the admission classes, every class but the descriptive open-vendor.
    expect(schema("spend-policy.schema.json").properties.modelClasses.items.$ref).toBe("registry-models.schema.json#/$defs/admissionClass");
    expect(schema("governance.schema.json").$defs.grant.properties.spend.properties.modelClasses.items.$ref).toBe("registry-models.schema.json#/$defs/admissionClass");
    expect(schema("registry-models.schema.json").$defs.admissionClass.allOf[0].$ref).toBe("#/$defs/modelClass");
    expect(valid("spend-policy.schema.json", load("negative/spend-policy-unknown-class.json"))).toBe(false);
    const grant = load("positive/governance-grant-spend.json");
    grant.spend.modelClasses = ["general"];
    expect(valid("governance.schema.json", grant)).toBe(false);
    grant.spend.modelClasses = ["cheap"];
    expect(valid("governance.schema.json", grant)).toBe(true);
  });

  it("takes OpenRouter's provider-routing object by its own field names, and refuses a sort it does not define", () => {
    const routing = schema("registry-models.schema.json").$defs.providerRouting;
    expect(Object.keys(routing.properties).sort()).toEqual(["allow_fallbacks", "ignore", "order", "sort"]);
    expect(routing.properties.sort.enum).toEqual(["price", "throughput", "latency"]);
    expect(valid("registry-models.schema.json", load("negative/registry-models-bad-sort.json"))).toBe(false);
  });

  it("refuses a model catalogued twice and a provider both ordered and ignored, and a profile id declared twice", () => {
    expect(codes("model-catalogue", catalogue)).toEqual([]);
    for (const f of ["semantic/model-catalogue-model-twice.json", "semantic/model-catalogue-order-and-ignore.json"]) {
      expect(valid("registry-models.schema.json", load(f)), f).toBe(true);
      expect(codes("model-catalogue", load(f)), f).toEqual(["FAC-SEM-058"]);
    }
    expect(valid("model-profile.schema.json", load("semantic/model-profiles-profile-twice.json"))).toBe(true);
    expect(codes("model-profiles", load("semantic/model-profiles-profile-twice.json"))).toEqual(["FAC-SEM-058"]);
    expect(codes("model-profiles", load("positive/model-profiles.json"))).toEqual([]);
    expect(codes("model-profiles", load("positive/model-profile-agent.json"))).toEqual([]);
  });

  it("does not throw on a catalogue or a set of profiles of the wrong shape", () => {
    expect(codes("model-catalogue", { models: [null, { id: "a/b", provider: { order: "x", ignore: 3 } }] })).toEqual([]);
    expect(codes("model-catalogue", {})).toEqual([]);
    expect(codes("model-profiles", { profiles: "default" })).toEqual([]);
  });
});

describe("runner profiles: the route and its rule (DEC-0046, FAC-SEM-059)", () => {
  it("accepts a subscription in its vendor's runner and a key whose allow-list is the profile's model profile", () => {
    for (const f of ["positive/runner-profile-subscription.json", "positive/runner-profile-key.json"]) {
      expect(valid("runner-profile.schema.json", load(f)), f).toBe(true);
      expect(codes("runner-profile", load(f)), f).toEqual([]);
    }
  });

  it("runs each login only in its vendor's runner, and any other runner takes the key route", () => {
    expect(SUBSCRIPTION_RUNNER).toEqual({ claude: "claude-code", kimi: "kimi-code", chatgpt: "codex" });
    expect(schema("runner-profile.schema.json").properties.subscription.properties.login.enum.sort()).toEqual(Object.keys(SUBSCRIPTION_RUNNER).sort());
    const base = load("positive/runner-profile-subscription.json");
    for (const [login, runner] of Object.entries(SUBSCRIPTION_RUNNER)) {
      for (const kind of ["claude-code", "kimi-code", "codex", "pi", "opencode", "hermes"]) {
        const value = { ...base, runnerKind: kind, subscription: { login } };
        expect(codes("runner-profile", value), `${login} in ${kind}`).toEqual(kind === runner ? [] : ["FAC-SEM-059"]);
      }
    }
    const outside = load("semantic/runner-profile-subscription-outside-vendor.json");
    expect(valid("runner-profile.schema.json", outside)).toBe(true);
    expect(evaluateSemanticRules("runner-profile", outside)[0]?.message).toMatch(/runs only in claude-code, not in pi/);
    expect(evaluateSemanticRules("runner-profile", { ...base, subscription: { login: "gemini" } })[0]?.message).toMatch(/its vendor's runner/);
  });

  it("answers a login named after an Object.prototype member with the plain refusal, never a prototype's text", () => {
    const base = load("positive/runner-profile-subscription.json");
    for (const login of ["constructor", "__proto__", "toString", "hasOwnProperty"]) {
      const findings = evaluateSemanticRules("runner-profile", { ...base, subscription: { login } });
      expect(findings.map((f) => f.code), login).toEqual(["FAC-SEM-059"]);
      expect(findings[0]?.message, login).toBe(`a ${login} subscription runs only in its vendor's runner, not in ${String(base.runnerKind)}; another runner takes the key route`);
    }
  });

  it("refuses a key that admits another profile's models, and a key written as its value", () => {
    for (const f of ["semantic/runner-profile-key-other-allow-list.json", "semantic/runner-profile-key-value.json"]) {
      expect(valid("runner-profile.schema.json", load(f)), f).toBe(true);
      expect(codes("runner-profile", load(f)), f).toEqual(["FAC-SEM-059"]);
    }
  });

  it("requires the route's own block and refuses the other's, by schema", () => {
    expect(valid("runner-profile.schema.json", load("negative/runner-profile-subscription-with-key.json"))).toBe(false);
    expect(valid("runner-profile.schema.json", load("negative/runner-profile-key-without-key.json"))).toBe(false);
    expect(codes("runner-profile", { route: "key", modelProfile: "default" })).toEqual([]);
    expect(codes("runner-profile", { route: "subscription" })).toEqual([]);
    expect(codes("runner-profile", { route: "key", modelProfile: "default", key: { modelAllowList: "default", ref: 7 } })).toEqual([]);
  });
});

describe("one resolution order; the project's classes restrict (DEC-0046, FAC-SEM-060)", () => {
  it("accepts a recorded resolution that follows the order, and a refusal that names the policy", () => {
    for (const f of ["semantic/profile-resolution-ok.json", "semantic/profile-resolution-estate-default.json", "semantic/profile-resolution-refused.json"]) {
      expect(codes("profile-resolution", load(f)), f).toEqual([]);
    }
    const refused = load("semantic/profile-resolution-refused.json").resolved;
    expect(refused).toEqual({ refused: "model-classes-empty", profile: "default", policy: { id: "urn:spend-policy:project-a", revision: 1 } });
  });

  it("refuses a launch the empty intersection should have refused, a level skipped, and a profile naming an uncatalogued model", () => {
    for (const f of ["semantic/profile-resolution-empty-not-refused.json", "semantic/profile-resolution-skips-request.json", "semantic/profile-resolution-uncatalogued-model.json"]) {
      expect(codes("profile-resolution", load(f)), f).toEqual(["FAC-SEM-060"]);
    }
  });

  it("resolves request, then agent, then binding, then the estate default", () => {
    const bundle = load("semantic/profile-resolution-estate-default.json");
    expect(RESOLUTION_ORDER).toEqual(["request", "agent", "binding", "estate"]);
    const resolve = (choices: Json) => resolveModelProfile({ catalogue: bundle.catalogue, profiles: bundle.profiles, choices });
    expect(resolve({ estate: "default" })).toMatchObject({ from: "estate", profile: "default" });
    expect(resolve({ binding: "cheap", estate: "default" })).toMatchObject({ from: "binding", profile: "cheap" });
    expect(resolve({ agent: "default", binding: "cheap", estate: "cheap" })).toMatchObject({ from: "agent", profile: "default" });
    expect(resolve({ request: "cheap", agent: "default", binding: "default", estate: "default" })).toMatchObject({ from: "request", profile: "cheap" });
    expect(resolve({})).toEqual({ refused: "no-profile" });
    expect(resolve({ request: "nowhere", estate: "default" })).toEqual({ refused: "unknown-profile", profile: "nowhere" });
  });

  it("keeps a model only when every class it has is allowed, never adds one, and keeps the profile's order", () => {
    const bundle = load("semantic/profile-resolution-ok.json");
    const resolve = (classes: string[] | undefined) =>
      resolveModelProfile({ catalogue: bundle.catalogue, profiles: bundle.profiles, choices: { estate: "default" }, policy: { ...bundle.policy, modelClasses: classes } });
    // DeepSeek is strong, cheap and chinese-vendor; Sonnet strong, code and vision.
    expect(resolve(["strong"])).toMatchObject({ refused: "model-classes-empty" });
    expect(resolve(["strong", "code", "vision"])).toMatchObject({ models: ["anthropic/claude-sonnet-5.5"] });
    expect(resolve(["strong", "cheap", "chinese-vendor", "code", "vision"])).toMatchObject({ models: ["deepseek/deepseek-v4-pro", "anthropic/claude-sonnet-5.5"] });
    const unrestricted = { ...bundle.policy };
    delete unrestricted.modelClasses;
    expect(resolveModelProfile({ catalogue: bundle.catalogue, profiles: bundle.profiles, choices: { estate: "default" }, policy: unrestricted })).toMatchObject({ models: ["deepseek/deepseek-v4-pro", "anthropic/claude-sonnet-5.5"] });
    // A model the catalogue does not hold has no classes to check, so a policy never admits it.
    for (const catalogue of [{}, null]) expect(resolveModelProfile({ catalogue, profiles: bundle.profiles, choices: { estate: "default" }, policy: bundle.policy })).toMatchObject({ refused: "model-classes-empty" });
    expect(resolveModelProfile({ catalogue: bundle.catalogue, profiles: [{ id: "default" }], choices: { estate: "default" }, policy: { modelClasses: ["cheap"] } })).toEqual({ refused: "model-classes-empty", profile: "default", policy: { id: "undefined", revision: Number.NaN } });
  });

  it("does not throw on a bundle of the wrong shape", () => {
    expect(codes("profile-resolution", { profiles: [{ id: "x", models: "a/b" }], choices: "estate", resolved: { refused: "no-profile" } })).toEqual([]);
  });
});

describe("the drives, the shared kind pi, usage's route and the declared slots (DEC-0046)", () => {
  it("adds the headless drives pi-json, opencode-json and kimi-stream-json, and documents each in runners.md", () => {
    const drives = schema("runners.schema.json").$defs.drive.enum;
    for (const drive of ["pi-json", "opencode-json", "kimi-stream-json"]) {
      expect(drives).toContain(drive);
      expect(runners).toContain(`\`${drive}\``);
    }
    const catalogue = load("positive/runners-catalogue.json");
    expect(catalogue.map((entry: Json) => entry.drive)).toEqual(expect.arrayContaining(["pi-json", "opencode-json"]));
    expect(codes("runner-catalogue", catalogue)).toEqual([]);
  });

  it("names pi a shared kind, which a session handoff may launch; pi offers no measured strict switch", () => {
    const handoff = load("positive/session-handoff-fabric-hermes.json");
    expect(schema("session-handoff.schema.json").properties.launch.properties.runtime.enum).toContain("pi");
    handoff.launch.runtime = "pi";
    handoff.launch.env = {};
    handoff.mcp.strict = false;
    expect(valid("session-handoff.schema.json", handoff)).toBe(true);
    expect(evaluateSemanticRules("session-handoff", handoff).filter((finding) => finding.instancePath === "/mcp/strict")).toEqual([]);
    handoff.mcp.strict = true;
    expect(evaluateSemanticRules("session-handoff", handoff).map((finding) => finding.message)).toContain("pi offers no measured switch that loads only the handoff's servers; mcp.strict is false");
  });

  it("carries the route beside the model in a usage report, and refuses another", () => {
    const report = load("positive/service-usage-route.json");
    expect(valid("service-usage.schema.json", report)).toBe(true);
    expect(codes("service-usage", report)).toEqual([]);
    expect(valid("service-usage.schema.json", load("negative/service-usage-unknown-route.json"))).toBe(false);
  });

  it("declares the configurable slots and the resolved profile on the well-known document", () => {
    expect(valid("service-well-known.schema.json", load("positive/service-well-known-configuration.json"))).toBe(true);
    expect(valid("service-well-known.schema.json", load("negative/service-well-known-configuration-unknown-slot.json"))).toBe(false);
    expect(schema("service-well-known.schema.json").properties.configuration.properties.resolved.properties.from.enum).toEqual([...RESOLUTION_ORDER]);
  });
});

describe("review of DEC-0046 (F1, F2, F4)", () => {
  it("FAC-SEM-060: an agent's profile and an estate profile never share an id in one resolution", () => {
    const ok = load("semantic/profile-resolution-ok.json");
    expect(codes("profile-resolution", ok)).toEqual([]);
    const profiles = ok.profiles as Json[];
    const twice = { ...ok, profiles: [...profiles, { ...profiles[0], models: [...(profiles[0]!.models as string[])].reverse() }] };
    expect(codes("profile-resolution", twice)).toContain("FAC-SEM-060");
  });

  it("FAC-SEM-058: ordering a variant of an ignored base slug is ordering and ignoring at once", () => {
    const catalogue = load("positive/registry-models.json");
    const rows = catalogue.models as Json[];
    const variant = { ...catalogue, models: [{ ...rows[0], provider: { order: ["deepinfra/turbo"], ignore: ["deepinfra"] } }, ...rows.slice(1)] };
    expect(codes("model-catalogue", variant)).toEqual(["FAC-SEM-058"]);
    const other = { ...catalogue, models: [{ ...rows[0], provider: { order: ["deepinfra/turbo"], ignore: ["openai"] } }, ...rows.slice(1)] };
    expect(codes("model-catalogue", other)).toEqual([]);
  });

  it("a policy that names model classes names at least one", () => {
    const policy = load("positive/spend-policy-limited.json");
    expect(valid("spend-policy.schema.json", { ...policy, modelClasses: ["strong"] })).toBe(true);
    expect(valid("spend-policy.schema.json", { ...policy, modelClasses: [] })).toBe(false);
  });
});
