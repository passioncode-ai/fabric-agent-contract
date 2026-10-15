import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { OPEN_VENDOR, USER_CONTENT, closedUserContentRoute, resolveModelProfile } from "../src/profile-rules.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";

// DEC-0083: the model class `open-vendor`, a profile's `reads`, FAC-SEM-112 (a lane that reads user content has an
// open-vendor route) and the runner's failed turn on a refusal or an empty answer.
const root = projectRoot();
type Json = Record<string, unknown> & { [key: string]: any };
const load = (relative: string) => JSON.parse(readFileSync(path.join(root, "fixtures", relative), "utf8")) as Json;
const validator = await createValidator();
const valid = (schema: string, value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}`, value).valid;
const codes = (kind: string, value: unknown) => [...new Set(evaluateSemanticRules(kind, value).map((finding) => finding.code))].sort();
const schema = (name: string) => JSON.parse(readFileSync(path.join(root, "schemas", name), "utf8")) as Json;
const runners = readFileSync(path.join(root, "docs/specification/runners.md"), "utf8");
const conformance = readFileSync(path.join(root, "docs/specification/conformance.md"), "utf8");

const fixture = load("semantic/profile-resolution-user-content-open-first.json");
const catalogue = fixture.input.catalogue as Json;
const profile = (fields: Json) => ({ kind: "model-profile", id: "member-chat", reads: [USER_CONTENT], ...fields });
const bundle = (profiles: Json[], over: Json = catalogue) => ({
  catalogue: over,
  profiles,
  choices: { estate: profiles[0]?.id },
  resolved: resolveModelProfile({ catalogue: over, profiles, choices: { estate: profiles[0]?.id as string } })
});

describe("the vocabulary (DEC-0083)", () => {
  it("adds open-vendor to the closed model classes and keeps chinese-vendor beside it", () => {
    const classes = schema("registry-models.schema.json").$defs.modelClass.enum as string[];
    expect(classes).toContain(OPEN_VENDOR);
    expect(classes).toContain("chinese-vendor");
    expect(classes).toHaveLength(7);
  });

  it("closes what a lane reads to user-content, operator and web, optional and at least one", () => {
    const reads = schema("model-profile.schema.json").$defs;
    expect(reads.reads.enum).toEqual([USER_CONTENT, "operator", "web"]);
    expect(reads.profile.required).not.toContain("reads");
    expect(reads.profile.properties.reads).toMatchObject({ type: "array", minItems: 1, uniqueItems: true });
    for (const value of reads.reads.enum as string[]) expect(runners, value).toContain(`\`${value}\``);
  });

  it("accepts a profile that reads user content, one that reads the operator's text, and the estate's set of them", () => {
    for (const f of ["positive/model-profile-user-content.json", "positive/model-profiles-user-content.json", "positive/model-profile-reads-operator.json"]) {
      expect(valid("model-profile.schema.json", load(f)), f).toBe(true);
      expect(codes("model-profiles", load(f)), f).toEqual([]);
    }
  });

  it("refuses an unknown value, an empty list and a value twice, by schema", () => {
    for (const f of ["negative/model-profile-reads-unknown.json", "negative/model-profile-reads-empty.json", "negative/model-profile-reads-twice.json"]) {
      expect(valid("model-profile.schema.json", load(f)), f).toBe(false);
    }
    expect(valid("registry-models.schema.json", { ...catalogue, models: [{ ...catalogue.models[0], classes: ["open-weights"] }] })).toBe(false);
  });

  it("marks the positive catalogue's open-weight rows, and the positive profiles resolve against it without a finding", () => {
    const models = load("positive/registry-models.json").models as Json[];
    expect(valid("registry-models.schema.json", load("positive/registry-models.json"))).toBe(true);
    const open = models.filter((row) => (row.classes as string[]).includes(OPEN_VENDOR)).map((row) => row.family);
    expect([...new Set(open)].sort()).toEqual(["DeepSeek", "GLM", "MiniMax", "Qwen"]);
    for (const row of models.filter((item) => ["Anthropic", "Gemini", "OpenAI", "Grok"].includes(item.family as string))) expect(row.classes).not.toContain(OPEN_VENDOR);
    const profiles = load("positive/model-profiles-user-content.json").profiles as Json[];
    expect(codes("profile-resolution", bundle(profiles, load("positive/registry-models.json")))).toEqual([]);
  });
});

describe("FAC-SEM-112: a lane that reads user content has an open-vendor route", () => {
  const files = readdirSync(path.join(root, "fixtures/semantic")).filter((name) => name.startsWith("profile-resolution-user-content-"));

  it("has the ten semantic fixtures", () => expect(files).toHaveLength(10));

  it.each(files)("%s", (name) => {
    const { input, expect: expected } = load(`semantic/${name}`);
    expect(valid("registry-models.schema.json", input.catalogue), name).toBe(true);
    for (const item of input.profiles as Json[]) expect(valid("model-profile.schema.json", item), `${name} ${String(item.id)}`).toBe(true);
    if (input.policy !== undefined) expect(valid("spend-policy.schema.json", input.policy), `${name} policy`).toBe(true);
    expect(codes("profile-resolution", input)).toEqual([...(expected as string[])].sort());
  });

  it("with fallback none, only the first model counts; with between-turns, any one does", () => {
    const first = ["qwen/qwen3.8-flash", "anthropic/claude-haiku-5.5"];
    const second = ["anthropic/claude-haiku-5.5", "qwen/qwen3.8-flash"];
    expect(closedUserContentRoute(profile({ models: first, fallback: "none" }), catalogue)).toBeUndefined();
    expect(closedUserContentRoute(profile({ models: second, fallback: "none" }), catalogue)).toEqual(["anthropic/claude-haiku-5.5"]);
    expect(closedUserContentRoute(profile({ models: second, fallback: "between-turns" }), catalogue)).toBeUndefined();
    expect(closedUserContentRoute(profile({ models: ["anthropic/claude-haiku-5.5", "google/gemini-3.8-flash"], fallback: "between-turns" }), catalogue)).toEqual(["anthropic/claude-haiku-5.5", "google/gemini-3.8-flash"]);
    // A fallback this revision does not define fails closed: only the first model runs.
    expect(closedUserContentRoute(profile({ models: second, fallback: "within-turn" }), catalogue)).toEqual(["anthropic/claude-haiku-5.5"]);
  });

  it("binds user-content alone or beside another value, and nothing else", () => {
    const closed = { models: ["anthropic/claude-haiku-5.5"], fallback: "none" };
    expect(closedUserContentRoute(profile({ ...closed, reads: ["operator", USER_CONTENT] }), catalogue)).toEqual(["anthropic/claude-haiku-5.5"]);
    for (const reads of [["operator"], ["web"], ["operator", "web"], undefined]) expect(closedUserContentRoute(profile({ ...closed, reads }), catalogue), String(reads)).toBeUndefined();
  });

  it("counts a model the catalogue does not hold, or holds without open-vendor, as closed", () => {
    const route = profile({ models: ["moonshotai/kimi-k3"], fallback: "none" });
    expect(closedUserContentRoute(route, catalogue)).toEqual(["moonshotai/kimi-k3"]);
    expect(closedUserContentRoute(route, { models: [{ id: "moonshotai/kimi-k3", classes: ["cheap", OPEN_VENDOR] }] })).toBeUndefined();
    expect(closedUserContentRoute(route, { models: [{ id: "moonshotai/kimi-k3", classes: ["cheap", "chinese-vendor"] }] })).toEqual(["moonshotai/kimi-k3"]);
    for (const over of [undefined, null, {}, { models: "x" }, { models: [null, { id: 7, classes: [OPEN_VENDOR] }] }]) expect(closedUserContentRoute(route, over)).toEqual(["moonshotai/kimi-k3"]);
  });

  it("names the profile and says the lane would run on closed vendors alone", () => {
    const none = evaluateSemanticRules("profile-resolution", load("semantic/profile-resolution-user-content-open-second-no-fallback.json").input);
    expect(none).toEqual([{ code: "FAC-SEM-112", instancePath: "/profiles/0/models", message: "profile member-chat reads user content, but its first model, google/gemini-3.8-flash, is not open-vendor in the catalogue: the lane would run on closed vendors alone" }]);
    const turns = evaluateSemanticRules("profile-resolution", load("semantic/profile-resolution-user-content-closed-only.json").input);
    expect(turns.map((finding) => finding.message)).toEqual(["profile member-chat reads user content, but none of its models is open-vendor in the catalogue: the lane would run on closed vendors alone"]);
  });

  it("finds every profile of the bundle that lacks the route, at its own index", () => {
    const closed = profile({ id: "triage", models: ["google/gemini-3.8-flash"], fallback: "none" });
    const findings = evaluateSemanticRules("profile-resolution", bundle([profile({ models: ["qwen/qwen3.8-flash"], fallback: "none" }), closed]));
    expect(findings.map((finding) => `${finding.code} ${finding.instancePath}`)).toEqual(["FAC-SEM-112 /profiles/1/models"]);
  });

  it("does not throw on a profile or a bundle of the wrong shape", () => {
    for (const value of [null, 7, "x", [], { reads: "user-content" }, { reads: [USER_CONTENT] }, { reads: [USER_CONTENT], models: [null, 3], fallback: "none" }]) {
      expect(() => closedUserContentRoute(value, catalogue)).not.toThrow();
    }
    expect(closedUserContentRoute({ reads: [USER_CONTENT], models: [null, "qwen/qwen3.8-flash"], fallback: "none" }, catalogue)).toEqual(["null"]);
    expect(closedUserContentRoute({ reads: [USER_CONTENT] }, catalogue)).toEqual([]);
    expect(codes("profile-resolution", { catalogue: 1, profiles: [{ id: { toString: 1 }, reads: [USER_CONTENT], models: [{ toString: 1 }] }], resolved: null })).toContain("FAC-SEM-112");
  });

  it("admits an open model by its other classes: open-vendor is descriptive, and a policy that does not list it keeps the model", () => {
    const profiles = [profile({ models: ["qwen/qwen3.8-flash", "anthropic/claude-haiku-5.5"], fallback: "between-turns" })];
    const resolve = (modelClasses: string[], over: Json = catalogue) => resolveModelProfile({ catalogue: over, profiles, choices: { estate: "member-chat" }, policy: { modelClasses } });
    expect(resolve(["cheap", "chinese-vendor"])).toMatchObject({ models: ["qwen/qwen3.8-flash", "anthropic/claude-haiku-5.5"] });
    // Adding the class to a row changes no resolution: the same row without it resolves the same.
    const without = { ...catalogue, models: (catalogue.models as Json[]).map((row) => ({ ...row, classes: (row.classes as string[]).filter((name) => name !== OPEN_VENDOR) })) };
    for (const classes of [["cheap"], ["cheap", "chinese-vendor"], ["strong"]]) expect(resolve(classes), String(classes)).toEqual(resolve(classes, without));
    // A row whose only class is the descriptive one gives a policy nothing to admit it by, and never stays.
    expect(resolve(["cheap"], { models: [{ id: "qwen/qwen3.8-flash", classes: [OPEN_VENDOR] }] })).toMatchObject({ refused: "model-classes-empty" });
  });

  it("refuses open-vendor in a spend policy's and a grant's model classes, and a catalogue row that has no other class, by schema", () => {
    expect(valid("spend-policy.schema.json", load("negative/spend-policy-open-vendor-class.json"))).toBe(false);
    expect(valid("spend-policy.schema.json", { ...load("negative/spend-policy-open-vendor-class.json"), modelClasses: ["cheap"] })).toBe(true);
    const grant = load("positive/governance-grant-spend.json");
    grant.spend.modelClasses = [OPEN_VENDOR];
    expect(valid("governance.schema.json", grant)).toBe(false);
    expect(valid("registry-models.schema.json", load("negative/registry-models-open-vendor-only.json"))).toBe(false);
    for (const ref of [schema("spend-policy.schema.json").properties.modelClasses.items.$ref, schema("governance.schema.json").$defs.grant.properties.spend.properties.modelClasses.items.$ref]) {
      expect(ref).toBe("registry-models.schema.json#/$defs/admissionClass");
    }
  });

  it("holds the resolution's outcome to the route: a policy that drops the open model by another class is named", () => {
    const drops = load("semantic/profile-resolution-user-content-policy-drops-open.json").input;
    expect(evaluateSemanticRules("profile-resolution", drops)).toEqual([{ code: "FAC-SEM-112", instancePath: "/resolved/models", message: "the policy urn:spend-policy:project-a leaves profile member-chat's lane on closed vendors alone: of the models it admits, none of its models is open-vendor in the catalogue" }]);
    // Under fallback none, a policy that drops the open first model leaves a closed first model.
    const none = { ...drops, profiles: [{ ...drops.profiles[0], fallback: "none" }] };
    expect(evaluateSemanticRules("profile-resolution", none).map((finding) => finding.message)).toEqual(["the policy urn:spend-policy:project-a leaves profile member-chat's lane on closed vendors alone: of the models it admits, its first model, anthropic/claude-haiku-5.5, is not open-vendor in the catalogue"]);
    // A policy that keeps the open model, a refused launch, and no policy at all give no outcome finding.
    expect(codes("profile-resolution", { ...drops, policy: { ...drops.policy, modelClasses: ["strong", "cheap", "chinese-vendor"] }, resolved: { from: "estate", profile: "member-chat", models: drops.profiles[0].models } })).toEqual([]);
    expect(codes("profile-resolution", { ...drops, policy: { ...drops.policy, modelClasses: ["vision"] }, resolved: { refused: "model-classes-empty", profile: "member-chat", policy: { id: "urn:spend-policy:project-a", revision: 1 } } })).toEqual([]);
    const free = { ...drops, resolved: { from: "estate", profile: "member-chat", models: drops.profiles[0].models } };
    delete (free as Json).policy;
    expect(codes("profile-resolution", free)).toEqual([]);
    // A policy of the wrong shape, without its meta, is still read: the finding stands and names no id.
    const bare = evaluateSemanticRules("profile-resolution", { ...drops, policy: { modelClasses: ["cheap"] } });
    expect(bare.map((finding) => finding.message)).toContain("the policy undefined leaves profile member-chat's lane on closed vendors alone: of the models it admits, none of its models is open-vendor in the catalogue");
    // A profile that does not read user content is not held to it.
    expect(codes("profile-resolution", { ...drops, profiles: [{ ...drops.profiles[0], reads: ["operator"] }] })).toEqual([]);
  });

  it("names one cause once: a profile whose own route is closed is not reported again for its outcome", () => {
    const drops = load("semantic/profile-resolution-user-content-policy-drops-open.json").input;
    const closed = { ...drops, profiles: [{ ...drops.profiles[0], models: ["anthropic/claude-haiku-5.5"] }] };
    expect(evaluateSemanticRules("profile-resolution", closed).map((finding) => finding.instancePath)).toEqual(["/profiles/0/models"]);
  });
});

describe("the runner's failed turn and where it is carried (DEC-0083)", () => {
  it("states in runners.md that a refusal or an empty answer is a failed turn for a lane that reads user content", () => {
    expect(runners).toMatch(/content refusal[^.]*empty answer[^.]*failed turn/s);
    expect(runners).toContain("`FAC-SEM-112`");
  });

  it("carries it in a runner row of conformance.md, and the host's launch row runs FAC-SEM-112", () => {
    const rows = conformance.split("\n").filter((line) => line.startsWith("| a runner") || line.startsWith("| a host launching an agent on a model profile"));
    expect(rows.some((line) => line.includes("failed turn") && line.includes("DEC-0083"))).toBe(true);
    expect(rows.some((line) => line.includes("`FAC-SEM-112`"))).toBe(true);
  });
});

describe("instancePaths name the item as written, past a leading non-object (DEC-0083 review)", () => {
  const LEADS: unknown[] = [null, 7, "x"];
  const open = load("semantic/profile-resolution-user-content-open-fallback.json").input;
  const choose = (input: Json, id: string) => ({ ...input, choices: { estate: id }, resolved: resolveModelProfile({ catalogue: input.catalogue, profiles: input.profiles, choices: { estate: id } }) });
  const paths = (kind: string, value: unknown, code: string) => evaluateSemanticRules(kind, value).filter((finding) => finding.code === code).map((finding) => finding.instancePath);

  it.each(LEADS)("FAC-SEM-112: a non-object before the profile (%s)", (lead) => {
    // The adapter's vector "crafted FAC-SEM-112: a non-object before the profile": the open-fallback profile under fallback none.
    const profile = { ...open.profiles[0], fallback: "none" };
    expect(paths("profile-resolution", choose({ ...open, profiles: [lead, profile] }, profile.id), "FAC-SEM-112")).toEqual(["/profiles/1/models"]);
  });

  it.each(LEADS)("FAC-SEM-060: a non-object before a profile offered twice (%s)", (lead) => {
    const profile = open.profiles[0];
    expect(paths("profile-resolution", choose({ ...open, profiles: [lead, profile, profile] }, profile.id), "FAC-SEM-060")).toEqual(["/profiles/2/id"]);
  });

  it.each([null, 7, {}])("FAC-SEM-060: a non-string model before an uncatalogued one (%s)", (lead) => {
    const profile = { ...open.profiles[0], models: [lead, "moonshotai/kimi-k3"] };
    expect(paths("profile-resolution", choose({ ...open, profiles: [7, profile] }, profile.id), "FAC-SEM-060")).toEqual(["/profiles/1/models/1"]);
  });

  it.each(LEADS)("FAC-SEM-058: a non-object before a model catalogued twice (%s)", (lead) => {
    const row = catalogue.models[0];
    expect(paths("model-catalogue", { ...catalogue, models: [lead, row, row] }, "FAC-SEM-058")).toEqual(["/models/2/id"]);
    const routed = { ...row, provider: { order: ["deepinfra"], ignore: ["deepinfra"] } };
    expect(paths("model-catalogue", { ...catalogue, models: [lead, routed] }, "FAC-SEM-058")).toEqual(["/models/1/provider"]);
  });

  it.each(LEADS)("FAC-SEM-058: a non-object before a profile declared twice (%s)", (lead) => {
    const profile = open.profiles[0];
    expect(paths("model-profiles", { kind: "model-profiles", profiles: [lead, profile, profile] }, "FAC-SEM-058")).toEqual(["/profiles/2/id"]);
  });
});
