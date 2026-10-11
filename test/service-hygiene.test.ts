import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { credentialName, rawValues, secretArgument, secretUrl, secretValue } from "../src/secret-shape.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";

// DEC-0044, asked by live consumers on 2026-10-11: a setup state in the well-known is not an outage (CT-22), a stdio
// MCP server is declared where it is used (LC-19, CT-23), and no declared command line carries a secret (LC-21, CT-24).
const root = projectRoot();
const validator = await createValidator();
const read = (relative: string) => JSON.parse(readFileSync(path.join(root, relative), "utf8")) as any;
const valid = (schema: string, value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}`, value);
const codes = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((finding) => finding.code);

// Credential-shaped test values are assembled at run time so that no literal key shape sits in the source.
const fake = {
  bearer: ["Authorization: Bearer", "example0123456789abcdef"].join(" "),
  jwt: ["eyJhbGciOiJFZERTQSJ9", "eyJzdWIiOiJleGFtcGxlIn0", "c2lnbmF0dXJl"].join("."),
  github: "gh" + "p_" + "abcdefghijklmnopqrstuvwxyz0123456789",
  long: ["Ex4mpleN0tARealKey", "ButShapedLikeOne", "AbCdEf012345"].join("")
};

interface Case { description: string; schema: string; kind: string; document: unknown; findings: Array<{ code: string; instancePath: string }> }
const cases = readdirSync(path.join(root, "fixtures/semantic"))
  .filter((name) => /^(stdio-scope|command-line)-/.test(name))
  .sort()
  .map((name) => [name, read(`fixtures/semantic/${name}`) as Case] as const);

describe("semantic fixtures of DEC-0044", () => {
  it("covers each refusal the packet names", () => {
    expect(cases.map(([name]) => name)).toEqual([
      "command-line-bearer-in-provider-entry.json",
      "command-line-key-in-manifest-url.json",
      "command-line-key-in-runner-argv.json",
      "command-line-secret-in-descriptor-command.json",
      "stdio-scope-session-in-manifest.json",
      "stdio-scope-session-in-provider-entry.json"
    ]);
  });

  it.each(cases)("%s is a valid document that its rule refuses, at the named place", (_, fixture) => {
    const schema = valid(fixture.schema, fixture.document);
    expect(schema.valid, JSON.stringify(schema.errors)).toBe(true);
    const found = evaluateSemanticRules(fixture.kind, fixture.document);
    expect(found.map(({ code, instancePath }) => ({ code, instancePath }))).toEqual(fixture.findings);
  });

  it("never repeats the credential it found", () => {
    for (const [, fixture] of cases.filter(([name]) => name.startsWith("command-line-"))) {
      for (const finding of evaluateSemanticRules(fixture.kind, fixture.document)) {
        expect(finding.message).not.toMatch(/example0123456789abcdef|example-not-a-key|Ex4mple|eyJ/);
      }
    }
  });
});

describe("degraded[].setup (CT-22)", () => {
  it("is an optional boolean beside source and reason", () => {
    const wellKnown = read("fixtures/positive/service-well-known-setup.json");
    expect(valid("service-well-known.schema.json", wellKnown).valid).toBe(true);
    expect(wellKnown.degraded.map((entry: { setup?: boolean }) => entry.setup)).toEqual([true, false]);
    expect(valid("service-well-known.schema.json", read("fixtures/negative/service-well-known-setup-not-boolean.json")).valid).toBe(false);
    expect(valid("service-well-known.schema.json", read("fixtures/negative/service-well-known-setup-without-reason.json")).valid).toBe(false);
  });

  it("is still a degraded source: a ready service carries none (FAC-SEM-011)", () => {
    const wellKnown = read("fixtures/positive/service-well-known-setup.json");
    expect(codes("service-well-known", wellKnown)).toEqual([]);
    expect(codes("service-well-known", { ...wellKnown, status: "ready", degraded: [wellKnown.degraded[0]] })).toEqual(["FAC-SEM-011"]);
  });
});

describe("FAC-SEM-056: a stdio MCP server is declared for a project or on demand (LC-19)", () => {
  const manifest = read("fixtures/positive/manifest-mcp-stdio-scope.json");
  const entry = read("fixtures/positive/provider-entry-stdio-on-demand.json");
  const withScope = (scope: string | undefined) => {
    const copy = structuredClone(manifest);
    if (scope === undefined) delete copy.capabilities[0].profile.connection.scope;
    else copy.capabilities[0].profile.connection.scope = scope;
    return copy;
  };

  it("accepts project, on-demand and an absent scope (on-demand)", () => {
    for (const scope of ["project", "on-demand", undefined]) {
      expect(valid("manifest.schema.json", withScope(scope)).valid, String(scope)).toBe(true);
      expect(codes("manifest", withScope(scope)), String(scope)).toEqual([]);
    }
    expect(codes("provider-entry", entry)).toEqual([]);
  });

  it("names the capability whose server is declared for every session", () => {
    const two = withScope("session");
    two.capabilities.unshift(structuredClone(read("fixtures/positive/manifest-mcp.json").capabilities[0]));
    expect(evaluateSemanticRules("manifest", two).map((finding) => finding.instancePath)).toEqual(["/capabilities/1/profile/connection/scope"]);
  });

  it("spells the scope the same way in the manifest and the provider entry", () => {
    const manifestSchema = read("schemas/manifest.schema.json");
    const stdio = manifestSchema.$defs.profile.oneOf[0].properties.connection.oneOf[1].properties.scope;
    const providerSchema = read("schemas/provider.schema.json");
    expect(providerSchema.properties.run.properties.mcp.oneOf[0].properties.stdio.properties.scope).toEqual(stdio);
    expect(stdio.enum).toEqual(["project", "on-demand", "session"]);
  });

  it("reads a streamable-http server and a malformed manifest without a finding", () => {
    expect(codes("manifest", read("fixtures/positive/manifest-mcp.json"))).toEqual([]);
    expect(codes("manifest", { capabilities: [null, { profile: { kind: "mcp", connection: "stdio" } }, { profile: { kind: "a2a" } }] })).toEqual([]);
    expect(codes("provider-entry", { run: { mcp: { url: "http://127.0.0.1:47110/mcp" } } })).toEqual([]);
  });
});

describe("FAC-SEM-057: no declared command line carries a credential (LC-21)", () => {
  const manifest = read("fixtures/positive/manifest-mcp-stdio-scope.json");
  const local = read("fixtures/positive/manifest-local.json");
  const runner = read("fixtures/positive/runners-catalogue.json")[0];
  const descriptor = read("fixtures/positive/service-descriptor.json");

  it("passes every positive fixture it reads", () => {
    expect(codes("manifest", manifest)).toEqual([]);
    expect(codes("manifest", local)).toEqual([]);
    expect(codes("runner", runner)).toEqual([]);
    expect(codes("service-descriptor", descriptor)).toEqual([]);
  });

  it("reads a manifest's stdio arguments and executable, and a local runner's", () => {
    const stdio = structuredClone(manifest);
    stdio.capabilities[0].profile.connection.args.push(`--token=${fake.github}`);
    stdio.capabilities[0].profile.connection.executableRef = `file:///opt/bin/agent?key=${fake.long}`;
    expect(evaluateSemanticRules("manifest", stdio).map((finding) => finding.instancePath)).toEqual([
      "/capabilities/0/profile/connection/executableRef",
      "/capabilities/0/profile/connection/args/2"
    ]);
    const runnerProfile = structuredClone(local);
    runnerProfile.capabilities[0].profile.args.push(fake.jwt);
    runnerProfile.capabilities[0].profile.executableRef = `https://user:${"pa" + "ss"}@runners.example/bin`;
    const paths = evaluateSemanticRules("manifest", runnerProfile).map((finding) => finding.instancePath);
    expect(paths).toContain("/capabilities/0/profile/executableRef");
    expect(paths).toContain(`/capabilities/0/profile/args/${runnerProfile.capabilities[0].profile.args.length - 1}`);
  });

  it("reads a runner's version, auth and drive arguments", () => {
    const copy = structuredClone(runner);
    copy.version.argv.push(fake.bearer);
    copy.auth.argv.push(fake.long);
    copy.drives.tui.argv.push(`--key=${fake.github}`);
    expect(evaluateSemanticRules("runner", copy).filter((f) => f.code === "FAC-SEM-057").map((f) => f.instancePath)).toEqual([
      "/version/argv/1",
      "/auth/argv/3",
      "/drives/tui/argv/1"
    ]);
    // A runner keeps its other rule beside this one.
    expect(codes("runner", { ...copy, drive: "acp" })).toContain("FAC-SEM-016");
  });

  it("reads a provider entry's loopback URL", () => {
    expect(codes("provider-entry", { run: { mcp: { url: `http://127.0.0.1:47110/mcp?token=${fake.long}` } } })).toEqual(["FAC-SEM-057"]);
  });

  it("reads a partial or malformed document without a finding or an error", () => {
    expect(codes("manifest", { capabilities: "x" })).toEqual([]);
    expect(codes("manifest", { capabilities: [{}, { profile: { kind: "local-runner" } }, { profile: { kind: "mcp" } }] })).toEqual([]);
    expect(codes("runner", { kind: "x", drive: "tui", drives: { tui: null } })).toEqual([]);
    expect(codes("runner-catalogue", [{ kind: "x", drive: "tui", drives: { tui: { argv: [1, fake.long] } } }])).toEqual(["FAC-SEM-057"]);
    expect(codes("runner", { kind: "x", drive: "tui" })).toEqual(["FAC-SEM-016"]);
    expect(codes("provider-entry", { run: null })).toEqual([]);
    expect(codes("service-descriptor", { commands: null })).toEqual([]);
  });

  it("keeps FAC-SEM-012 and FAC-SEM-024 on a descriptor beside it", () => {
    const copy = structuredClone(descriptor);
    copy.commands.doctor = ["publisher", fake.jwt];
    expect(codes("service-descriptor", copy).sort()).toEqual(["FAC-SEM-012", "FAC-SEM-057"]);
  });
});

describe("the shared detector (src/secret-shape.ts)", () => {
  it("finds a credential in a URL by its user information, its query or its fragment", () => {
    expect(secretUrl(`https://user:${"pa" + "ss"}@agents.example/mcp`)).toBe(true);
    expect(secretUrl("https://agents.example/mcp?api_key=x")).toBe(true);
    expect(secretUrl("https://agents.example/mcp#access_token=x")).toBe(true);
    expect(secretUrl(`https://agents.example/mcp?state=${fake.long}`)).toBe(true);
    expect(secretUrl(`https://agents.example/mcp?q=${encodeURIComponent(fake.jwt)}`)).toBe(true);
  });

  it("passes a URL that names a credential without carrying one", () => {
    for (const url of [
      "https://agents.example/mcp",
      "https://agents.example/mcp?key=",
      "https://agents.example/mcp?sort=key&tokenizer=bpe",
      "https://user@agents.example/mcp",
      "https://agents.example/mcp#tokens",
      "not a url at all",
      "file:///opt/example/bin/agent"
    ]) expect(secretUrl(url), url).toBe(false);
  });

  it("keeps a raw + in a query value, so a base64 run is not split", () => {
    expect(rawValues("a=b+c&a=&d")).toEqual(new Map([["a", ["b+c", ""]], ["d", [""]]]));
    expect(rawValues("bad=%E0%A4%A")).toEqual(new Map([["bad", ["%E0%A4%A"]]]));
    expect(rawValues("=x")).toEqual(new Map([["", ["x"]]]));
  });

  it("is the detector fabric:// links use", async () => {
    const links = await import("../src/fabric-links.js");
    expect(links.credentialName).toBe(credentialName);
    expect(links.secretValue).toBe(secretValue);
    expect(secretArgument(fake.bearer)).toBe(true);
  });
});
