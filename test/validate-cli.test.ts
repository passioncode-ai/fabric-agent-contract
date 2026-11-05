import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, truncateSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { loadSchemasSync, projectRoot } from "../src/contract.js";
import { blindProtocols, gitExecutable, gitLimits, gitNames, gitlinkNames, inferSchema, jsonErrorAt, main, nearestKey, shownPath, shownPointer } from "../src/validate-cli.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { includeIndex, longRunAt } from "../src/source-rules.js";

// REQ-01 (contract review 2026-10-21): `pnpm validate` is an author's first check. It infers the schema, runs the
// schema and the semantic rules that read the document, prints one line per problem (path, rule, message, help)
// and exits 0 clean, 1 on a problem, 2 on a usage error.
const root = projectRoot();
interface Entry { name: string; schema: string; path: string; valid: boolean; keyword?: string }
const catalogue = JSON.parse(readFileSync(path.join(root, "fixtures/catalogue.json"), "utf8")) as Entry[];
const fixture = (relative: string) => path.join(root, "fixtures", relative);
const json = (relative: string) => JSON.parse(readFileSync(fixture(relative), "utf8")) as Record<string, any>;
const scratch = mkdtempSync(path.join(tmpdir(), "fac-validate-"));
afterAll(() => rmSync(scratch, { recursive: true, force: true }));
let counter = 0;
/** A folder of its own with these files (name to JSON value, or raw text). */
function folder(files: Record<string, unknown>): string {
  const dir = path.join(scratch, `case-${counter++}`);
  mkdirSync(dir, { recursive: true });
  for (const [name, value] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    writeFileSync(path.join(dir, name), typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`);
  }
  return dir;
}
const one = (name: string, value: unknown) => path.join(folder({ [name]: value }), name);
const run = (...args: string[]) => main(args);
/** This process's processor time in ms, and one call's: repeated until a trial lasts 20 ms, the best of three trials. */
const cpuMs = (): number => { const used = process.cpuUsage(); return (used.user + used.system) / 1000; };
const cpuOf = (call: () => unknown): number => {
  call();
  return Math.min(...[0, 1, 2].map(() => {
    const started = cpuMs();
    let calls = 0;
    do { call(); calls += 1; } while (cpuMs() - started < 20);
    return (cpuMs() - started) / calls;
  }));
};

describe("every positive fixture passes", () => {
  it.each(catalogue.filter((entry) => entry.valid))("$name", (entry) => {
    const result = run(fixture(entry.path), "--schema", entry.schema);
    // A positive fixture may draw a hint (a member a named reader does not accept yet), never a problem.
    expect(result.out.split("\n").filter((line) => line !== "" && !/  hint\//.test(line)), result.out).toEqual([]);
    expect(result.code).toBe(0);
  });

  it("a provider entry with run.mcp.stdio.scope gets the reader-pending hint and still passes (CT-27)", () => {
    const result = run(fixture("positive/provider-entry-stdio-on-demand.json"), "--schema", "provider.schema.json");
    expect(result.code).toBe(0);
    expect(result.out).toContain("hint/reader-pending");
  });
});

/** The schemas a schema is built on, through its top-level allOf, oneOf and anyOf references, transitively. */
function builtOn(schema: string, seen = new Set<string>()): string[] {
  const declared = JSON.parse(readFileSync(path.join(root, "schemas", schema), "utf8")) as Record<string, unknown>;
  for (const key of ["allOf", "oneOf", "anyOf"]) {
    for (const branch of Array.isArray(declared[key]) ? (declared[key] as Array<{ $ref?: string }>) : []) {
      if (typeof branch.$ref === "string" && !branch.$ref.includes("#") && !seen.has(branch.$ref)) { seen.add(branch.$ref); builtOn(branch.$ref, seen); }
    }
  }
  return [...seen];
}

describe("schema inference", () => {
  it("never infers another schema than the catalogue's, and infers the author's documents", () => {
    const inferred = new Map<string, string>();
    for (const entry of catalogue) {
      const schema = inferSchema(json(entry.path), entry.path);
      if (schema === undefined) continue;
      // A stricter profile of a document (interop-result over result) is built on the document's own schema, which
      // is the right first answer: its top-level allOf, oneOf or anyOf names it.
      if (schema !== entry.schema) expect(builtOn(entry.schema), entry.name).toContain(schema);
      else expect(schema).toBe(entry.schema);
      if (entry.valid) inferred.set(entry.schema, entry.name);
    }
    for (const schema of ["manifest.schema.json", "provider.schema.json", "service-descriptor.schema.json", "service-well-known.schema.json", "service-usage.schema.json", "result.schema.json", "conformance-report.schema.json", "estate-record.schema.json", "entitlement.schema.json", "session-handoff.schema.json"]) {
      expect(inferred.has(schema), schema).toBe(true);
    }
  });

  it("the command, protocol signal included, never checks a catalogue entry against another schema", () => {
    for (const entry of catalogue) {
      const report = JSON.parse(run(fixture(entry.path), "--json").out) as { files: Array<{ schema: string | null }> };
      const schema = report.files[0]?.schema ?? undefined;
      if (schema === undefined || schema === entry.schema) continue;
      expect(builtOn(entry.schema), entry.name).toContain(schema);
    }
  }, 120_000);

  it("checks the manifest, a provider entry, a descriptor and a well-known document with no --schema", () => {
    for (const file of ["positive/manifest-mcp.json", "positive/provider-entry-stdio.json", "positive/service-descriptor.json", "positive/service-well-known.json"]) {
      expect(run(fixture(file)), file).toEqual({ code: 0, out: "" });
    }
  });

  it("falls back to the file name: fabric-agent.json, providers/<id>.json and <id>.<instance>.json", () => {
    expect(inferSchema({}, "x/fabric-agent.json")).toBe("manifest.schema.json");
    expect(inferSchema({ providerId: "x" }, "x/providers/agent.json")).toBe("provider.schema.json");
    expect(inferSchema({ origin: "x" }, "x/example-agent.default.json")).toBe("service-descriptor.schema.json");
    // The name alone is not enough for the two weaker rules: a config or a fixture named a.b.json is no descriptor.
    expect(inferSchema({}, "x/providers/agent.json")).toBeUndefined();
    expect(inferSchema({ compilerOptions: {} }, "x/tsconfig.build.json")).toBeUndefined();
    expect(inferSchema({ $id: "urn:x:a", properties: {}, origin: "x" }, "x/example-agent.default.json")).toBeUndefined();
    expect(inferSchema({ $id: "urn:x:a", origin: "x" }, "x/example-agent.default.json")).toBe("service-descriptor.schema.json");
    expect(inferSchema({}, "x/notes.json")).toBeUndefined();
    expect(inferSchema([], "x/notes.json")).toBeUndefined();
  });

  it("decides between schemas that share a discriminator by their required members", () => {
    expect(inferSchema({ protocol: "fabric-service/0.1", service: {}, days: [], currency: "USD", generatedAt: "x" }, "a.json")).toBe("service-usage.schema.json");
    expect(inferSchema({ protocol: "fabric-service/0.1", service: {}, process: {}, status: "ready", degraded: [], surfaces: {} }, "a.json")).toBe("service-well-known.schema.json");
    expect(inferSchema({ protocol: "fabric-service/0.1" }, "a.json")).toBeUndefined();
    // A document missing a required member is told by its file name or not at all, never by a near match.
    expect(inferSchema({ contractVersion: "0.1.0", outcome: "succeeded" }, "a.json")).toBeUndefined();
    expect(inferSchema({ contractVersion: "0.1.0", provider: {} }, "fabric-agent.json")).toBe("manifest.schema.json");
  });
});

describe("negative fixtures fail with their keyword", () => {
  const negatives = catalogue.filter((entry) => !entry.valid);
  it.each(negatives)("$name", (entry) => {
    const result = run(fixture(entry.path), "--schema", entry.schema);
    expect(result.code, result.out).toBe(1);
    if (entry.keyword && !["anyOf", "oneOf", "if"].includes(entry.keyword)) expect(result.out).toContain(`schema/${entry.keyword}`);
  });
});

describe("semantic fixtures report their expected codes", () => {
  const fixtures = readdirSync(fixture("semantic"))
    .map((name) => ({ name, value: json(`semantic/${name}`) }))
    .filter(({ value }) => typeof value.kind === "string" && "input" in value);
  it.each(fixtures)("$name", ({ name, value }) => {
    const file = one(name, value.input);
    const result = main([file, "--kind", value.kind as string, "--json"]);
    const report = JSON.parse(result.out) as { problems: Array<{ rule: string; help?: string }> };
    const codes = report.problems.map((problem) => problem.rule).filter((rule) => rule.startsWith("FAC-SEM-"));
    expect([...new Set(codes)].sort()).toEqual([...new Set(value.expect as string[])].sort());
    expect(result.code).toBe((value.expect as string[]).length > 0 ? 1 : 0);
    for (const problem of report.problems) if (problem.rule.startsWith("FAC-SEM-")) expect(problem.help).toMatch(/^docs\/specification\/[a-z-]+\.md#fac-sem-\d{3}$/);
  });
});

describe("one line per planted mistake", () => {
  const lines = (out: string) => out.trimEnd().split("\n");

  it("a wrong mcp protocolRevision is one line naming the value it must be", () => {
    const manifest = json("positive/manifest-mcp.json");
    manifest.capabilities[0].profile.protocolRevision = "2025-06-18";
    const file = one("fabric-agent.json", manifest);
    const result = run(file);
    expect(result.code).toBe(1);
    expect(lines(result.out)).toEqual([`${file}  /capabilities/0/profile/protocolRevision  schema/const  must be "2026-07-28"  schemas/manifest.schema.json`]);
  });

  it("a profile version member on the wrong profile gets a hint beside the schema error", () => {
    const manifest = json("positive/manifest-mcp.json");
    manifest.capabilities[0].profile.protocolVersion = "1.0";
    const result = run(one("fabric-agent.json", manifest));
    expect(result.code).toBe(1);
    expect(result.out).toContain("schema/additionalProperties");
    expect(result.out).toContain("hint/profile-version  protocolVersion is the a2a profile's version member; the mcp profile's is protocolRevision");
  });

  it("a misspelt extension key passes the schema and is caught as a near miss, a hint that does not fail the run", () => {
    const manifest = json("positive/manifest-mcp.json");
    manifest.provider.extensions = { "https://fabric.passioncode.ai/agent-contract/extension/service/0.1": { descriptor: "example-agent.default" } };
    const result = run(one("fabric-agent.json", manifest));
    expect(result.code).toBe(0);
    expect(lines(result.out)).toEqual([expect.stringContaining("/provider/extensions  hint/extension-key  https://fabric.passioncode.ai/agent-contract/extension/service/0.1 is not an extension key the contract defines; did you mean https://fabric.passioncode.ai/agent-contract/extensions/service/0.1?")]);
    const host = json("positive/manifest-mcp.json");
    host.capabilities[0].extensions = { "https://passioncode.ai/agent-contract/extensions/interop/0.1": {} };
    expect(run(one("fabric-agent.json", host)).out).toContain("did you mean https://fabric.passioncode.ai/agent-contract/extensions/interop/0.1?");
    const version = json("positive/manifest-mcp.json");
    version.extensions = { "https://fabric.passioncode.ai/agent-contract/extensions/memory/0.2": {} };
    expect(run(one("fabric-agent.json", version)).out).toContain("did you mean https://fabric.passioncode.ai/agent-contract/extensions/memory/0.1?");
    const typo = json("positive/manifest-mcp.json");
    typo.extensions = { "https://fabric.passioncode.ai/agent-contract/extensions/servce/0.1": {} };
    expect(run(one("fabric-agent.json", typo)).out).toContain("did you mean https://fabric.passioncode.ai/agent-contract/extensions/service/0.1?  docs/specification/interop.md#extension-key");
    const unknown = json("positive/manifest-mcp.json");
    unknown.extensions = { "https://fabric.passioncode.ai/agent-contract/extensions/billing/0.1": {} };
    expect(run(one("fabric-agent.json", unknown)).out).toContain("is not an extension key the contract defines; the contract's keys are listed in src/extensions.ts and docs/specification/interop.md#extension-key");
    const vendor = json("positive/manifest-mcp.json");
    vendor.extensions = { "https://vendor.example/ext/colour/1": { colour: "blue" } };
    expect(run(one("fabric-agent.json", vendor))).toEqual({ code: 0, out: "" });
  });

  it("a member the schema does not define where extensions exist says where vendor data goes", () => {
    const manifest = json("positive/manifest-mcp.json");
    manifest.colour = "blue";
    expect(run(one("fabric-agent.json", manifest)).out).toContain('has the member "colour", which the schema does not define; vendor data goes under "extensions", keyed by an absolute URI');
  });

  it("a credential in a launch argument is FAC-SEM-057 with how to fix it and its help link", () => {
    const entry = json("positive/provider-entry-stdio.json");
    entry.run.mcp.stdio.command = ["/usr/local/bin/agent", "--token", ["gh", "p_", "abcdefghijklmnopqrstuvwxyz0123456789"].join("")];
    const result = run(one("agent.json", entry));
    expect(result.code).toBe(1);
    expect(lines(result.out)).toEqual([expect.stringMatching(/  \/run\/mcp\/stdio\/command\/2  FAC-SEM-057  .*env entry with a secret reference.*  docs\/specification\/profiles\.md#fac-sem-057$/)]);
  });

  it("a literal env value is a schema pattern error and FAC-SEM-015", () => {
    const entry = json("positive/provider-entry-stdio.json");
    entry.run.mcp.stdio.env = { API_KEY: "plain" };
    const out = run(one("agent.json", entry)).out;
    expect(out).toContain("schema/pattern");
    expect(out).toContain("FAC-SEM-015  env API_KEY must be a secret reference, not a secret value: write it as a secret reference, secret-ref:NAME");
  });

  it("hints read past a capability or profile that is not an object, and a profile kind the contract lacks", () => {
    const manifest = json("positive/manifest-mcp.json");
    manifest.capabilities.push(7, { profile: "mcp" }, { profile: { kind: "grpc", protocolVersion: "1.0" } });
    const out = run(one("fabric-agent.json", manifest)).out;
    expect(out).toContain("schema/");
    expect(out).not.toContain("hint/profile-version");
  });

  it("a semantic finding on the whole document is reported at /", () => {
    const result = run(one("result.json", [1]), "--kind", "result");
    expect(result.code).toBe(1);
    expect(result.out).toMatch(/  \/  FAC-SEM-000  value must be an object  docs\/specification\/conformance\.md#fac-sem-000\n$/);
  });

  it("a file that is not JSON is a problem, not a usage error", () => {
    const result = run(one("broken.json", "{ not json"));
    expect(result.code).toBe(1);
    expect(result.out).toMatch(/  \/  json  the file is not JSON: /);
  });

  it("--json prints the same problems as one document", () => {
    const manifest = json("positive/manifest-mcp.json");
    manifest.capabilities[0].profile.protocolRevision = "2025-06-18";
    const file = one("fabric-agent.json", manifest);
    const report = JSON.parse(run(file, "--json").out) as unknown;
    expect(report).toEqual({ files: [{ file, schema: "manifest.schema.json", kinds: ["manifest"] }], problems: [{ file, path: "/capabilities/0/profile/protocolRevision", rule: "schema/const", message: 'must be "2026-07-28"', help: "schemas/manifest.schema.json" }], notes: [], usage: [] });
  });

  it("an accepted classification is a note, not a problem", () => {
    const value = json("semantic/delegation-hub-key-ok.json");
    expect(value.expect).toEqual([]);
    const trace = { result: { id: "r", outcome: "succeeded" }, meta: { traceparent: "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01" } };
    const result = main([one("trace.json", trace), "--kind", "interop-result-trace", "--json"]);
    const report = JSON.parse(result.out) as { problems: unknown[]; notes: Array<{ rule: string }> };
    expect(report.notes.map((note) => note.rule)).toContain("FAC-SEM-019");
    expect(report.problems).toEqual([]);
    expect(result.code).toBe(0);
    expect(main([one("trace.json", trace), "--kind", "interop-result-trace"]).out).toContain("  FAC-SEM-019 (accepted)  ");
  });
});

describe("a folder is checked file by file and as pairs", () => {
  const descriptor = () => json("positive/service-descriptor.json");
  const wellKnown = () => json("positive/service-well-known.json");
  const key = (doc: Record<string, any>) => `${doc.id as string}.${(doc.instance as string | undefined) ?? "default"}`;

  it("a descriptor and its well-known document that agree pass", () => {
    const d = descriptor();
    const w = wellKnown();
    w.service.id = d.id;
    w.service.instance = d.instance ?? "default";
    const dir = folder({ [`${key(d)}.json`]: d, [`${key(d)}.well-known.json`]: w });
    expect(run(dir)).toEqual({ code: 0, out: "" });
  });

  it("a well-known document that answers as another service is FAC-SEM-009", () => {
    const d = descriptor();
    const w = wellKnown();
    w.service.id = "someone-else";
    const dir = folder({ [`${key(d)}.json`]: d, [`${key(d)}.well-known.json`]: w });
    const result = run(dir);
    expect(result.code).toBe(1);
    expect(result.out).toMatch(/\/wellKnown\/service  FAC-SEM-009  .*answers as someone-else/);
  });

  it("a well-known document with no descriptor of its file name pairs by the service it names", () => {
    const d = descriptor();
    const w = wellKnown();
    w.service.id = d.id;
    w.service.instance = d.instance ?? "default";
    expect(run(folder({ [`${key(d)}.json`]: d, "health.json": w }))).toEqual({ code: 0, out: "" });
    const alone = wellKnown();
    expect(run(folder({ "health.json": alone })).out).toBe("");
  });

  it("a well-known document whose service has no instance pairs with the default instance; one whose service is not an object pairs by name only", () => {
    const d = descriptor();
    const w = wellKnown();
    w.service.id = d.id;
    delete w.service.instance;
    expect(run(folder({ [`${key(d)}.json`]: d, "health.json": w })).out).not.toContain("FAC-SEM-009");
    const odd = wellKnown();
    odd.service = "example-agent";
    const result = run(folder({ [`${key(d)}.json`]: d, "health.json": odd }));
    expect(result.code).toBe(1);
    expect(result.out).toContain("schema/type");
  });

  it("the folder's only descriptor and only well-known document are a pair whatever their names (FAC-SEM-009)", () => {
    const d = descriptor();
    const w = wellKnown();
    w.service.id = d.id;
    w.service.instance = "preview";
    const result = run(folder({ [`${key(d)}.json`]: d, "well-known.json": w }));
    expect(result.code).toBe(1);
    expect(result.out).toContain("FAC-SEM-009");
  });

  it("a well-known document no descriptor answers for is a note, not a silent pass", () => {
    const d = descriptor();
    const other = descriptor();
    other.id = "other-agent";
    const w = wellKnown();
    w.service.id = "third-agent";
    const result = run(folder({ [`${key(d)}.json`]: d, [`${key(other)}.json`]: other, "well-known.json": w }));
    expect(result.out).toContain("note/pair");
  });

  it("two descriptors on one port are FAC-SEM-010", () => {
    const a = descriptor();
    const b = { ...descriptor(), id: "other-agent" };
    const result = run(folder({ [`${key(a)}.json`]: a, [`${key(b)}.json`]: b }));
    expect(result.code).toBe(1);
    expect(result.out).toContain("FAC-SEM-010");
  });

  it("a provider entry is paired with the manifest it names, and the file name with its id", () => {
    const manifest = json("positive/manifest-mcp.json");
    const entry = json("positive/provider-entry-stdio.json");
    const dir = folder({});
    mkdirSync(path.join(dir, "providers"), { recursive: true });
    const manifestPath = path.join(dir, entry.id as string, "fabric-agent.json");
    mkdirSync(path.dirname(manifestPath), { recursive: true });
    writeFileSync(manifestPath, JSON.stringify({ ...manifest, provider: { ...manifest.provider, id: entry.providerId } }));
    writeFileSync(path.join(dir, "providers", `${entry.id as string}.json`), JSON.stringify({ ...entry, manifest: manifestPath }));
    expect(run(dir)).toEqual({ code: 0, out: "" });
    writeFileSync(path.join(dir, "providers", "renamed.json"), JSON.stringify({ ...entry, manifest: manifestPath }));
    const renamed = run(dir);
    expect(renamed.code).toBe(1);
    expect(renamed.out).toMatch(/providers[\\/]renamed\.json  \/entry\/id  FAC-SEM-014  .*the file is named <id>\.json/);
    expect(renamed.out).toContain("FAC-SEM-013");
  });

  it("a provider entry whose manifest names another provider is FAC-SEM-014; a missing manifest falls back to the folder's", () => {
    const manifest = json("positive/manifest-mcp.json");
    const entry = json("positive/provider-entry-stdio.json");
    const dir = folder({ [`providers/${entry.id as string}.json`]: { ...entry, manifest: "~/no-such-folder/fabric-agent.json" }, "fabric-agent.json": manifest });
    const result = run(dir);
    expect(result.code).toBe(1);
    expect(result.out).toMatch(/\/entry\/providerId  FAC-SEM-014  /);
    const lonely = folder({ [`providers/${entry.id as string}.json`]: { ...entry, manifest: "~/no-such-folder/fabric-agent.json" } });
    const report = JSON.parse(run(lonely, "--json").out) as { notes: Array<{ rule: string; message: string }> };
    expect(report.notes).toEqual([expect.objectContaining({ rule: "note/pair", message: expect.stringContaining("not found, so the entry is not checked against it") })]);
  });

  it("a descriptor that names its manifest is checked against it (FAC-SEM-020)", () => {
    const d = descriptor();
    const dir = folder({});
    const manifestPath = path.join(dir, "fabric-agent.json");
    writeFileSync(manifestPath, JSON.stringify(json("positive/manifest-mcp.json")));
    writeFileSync(path.join(dir, `${key(d)}.json`), JSON.stringify({ ...d, fabricManifest: manifestPath }));
    expect(run(dir).out).toContain("FAC-SEM-020");
  });

  it("a descriptor that names a manifest which is not there is FAC-SEM-020", () => {
    const d = descriptor();
    const dir = folder({ [`${key(d)}.json`]: { ...d, fabricManifest: "~/no-such-folder/fabric-agent.json" } });
    expect(run(dir).out).toMatch(/\/descriptor\/fabricManifest  FAC-SEM-020  .*does not resolve/);
  });

  it("a provider entry whose manifest member is not a path is a schema error and a note", () => {
    const entry = json("positive/provider-entry-stdio.json");
    const report = JSON.parse(run(folder({ [`providers/${entry.id as string}.json`]: { ...entry, manifest: 7 } }), "--json").out) as { problems: Array<{ rule: string }>; notes: Array<{ rule: string }> };
    expect(report.problems.map((problem) => problem.rule)).toContain("schema/type");
    // Nothing to pair: the schema error is the whole answer.
    expect(report.notes).toEqual([]);
  });

  it("a folder file whose schema cannot be told is a usage error, and so is an empty folder", () => {
    const result = run(folder({ "notes.json": { hello: "world" } }));
    expect(result.code).toBe(2);
    expect(result.out).toContain("cannot tell which schema");
    expect(run(folder({ "readme.txt": "x" }))).toEqual({ code: 2, out: expect.stringContaining("no readable .json file") });
  });
});

describe("usage errors exit 2", () => {
  it.each([
    [[], "usage: pnpm validate"],
    [["--help"], "usage: pnpm validate"],
    [["a.json", "--colour"], "unknown option --colour"],
    [["a.json", "--schema"], "--schema needs a value"],
    [[fixture("positive/manifest-mcp.json"), "--schema", "no-such"], "unknown schema no-such"],
    [[fixture("positive/manifest-mcp.json"), "--kind", "no-such-kind"], "unknown kind no-such-kind"],
    [[path.join(scratch, "missing.json")], "cannot read"],
    [[fixture("positive/comms-cancel.json")], "cannot tell which schema"]
  ])("%j", (args, text) => {
    const result = main(args);
    expect(result.code).toBe(2);
    expect(result.out).toContain(text);
  });

  it("accepts a schema by its short name", () => {
    expect(run(fixture("positive/comms-cancel.json"), "--schema", "comms-cancel")).toEqual({ code: 0, out: "" });
  });

  it("an unreadable file is a usage error", () => {
    const file = one("locked.json", {});
    chmodSync(file, 0o000);
    const result = run(file);
    chmodSync(file, 0o600);
    // Root reads any file, and Windows ignores the mode; the case is then not observable here.
    if (process.getuid?.() !== 0 && process.platform !== "win32") expect(result).toEqual({ code: 2, out: expect.stringContaining("cannot read") });
  });

  it("--kind on a wrapper kind checks the semantic rule alone", () => {
    expect(run(one("link.json", { url: "fabric://chat?service=example-agent.default" }), "--kind", "deep-link")).toEqual({ code: 0, out: "" });
  });
});

describe("pnpm validate runs as a command", () => {
  it("exits 1 with the problem line, and 0 on the repository's own manifest example", () => {
    const manifest = json("positive/manifest-mcp.json");
    manifest.capabilities[0].profile.protocolRevision = "2025-06-18";
    // tsx's own entry point under this Node: `node_modules/.bin/tsx` is a shell script, which Windows does not run.
    const tsx = path.join(root, "node_modules/tsx/dist/cli.mjs");
    const bad = spawnSync(process.execPath, [tsx, path.join(root, "src/validate-cli.ts"), one("fabric-agent.json", manifest)], { encoding: "utf8" });
    expect(bad.status).toBe(1);
    expect(bad.stdout).toContain("schema/const");
    const good = spawnSync(process.execPath, [tsx, path.join(root, "src/validate-cli.ts"), fixture("positive/manifest-mcp.json")], { encoding: "utf8" });
    expect(good.status).toBe(0);
    // Two cold tsx processes, under a second of CPU each; on a loaded machine one took 22 s of wall time (2026-10-21).
  }, 120_000);
});

describe("the first unit and product readings' cases (contract review 2026-10-21)", () => {
  it("an unreadable folder is a usage error, never a throw", () => {
    // Root lists any folder, and Windows ignores the mode.
    if (process.getuid?.() === 0 || process.platform === "win32") return;
    const dir = folder({ "fabric-agent.json": json("positive/manifest-mcp.json") });
    const locked = path.join(dir, "locked");
    mkdirSync(locked);
    chmodSync(locked, 0o000);
    try {
      const result = run(dir);
      expect(result.code).toBe(2);
      expect(result.out).toContain("cannot read");
    } finally {
      chmodSync(locked, 0o755);
    }
  });

  it("vendor data nested 5,000 deep is walked, not overflowed", () => {
    const manifest = json("positive/manifest-mcp.json");
    manifest.provider.extensions = { "https://vendor.example/x": "DEEP" };
    // Written as text: JSON.stringify of a value 5,000 deep overflows the stack on Node 22 and 24 (the nightly run of
    // 2026-10-23), before the validator is reached.
    const deep = `${'{"a":'.repeat(5000)}{}${"}".repeat(5000)}`;
    const text = `${JSON.stringify(manifest, null, 2).replace('"DEEP"', deep)}\n`;
    expect(run(one("fabric-agent.json", text))).toEqual({ code: 0, out: "" });
    // The walk takes about 0.4 s alone; under coverage instrumentation and the gate's load, past vitest's 5 s default.
  }, 30_000);

  it("a document missing a required member names the schemas it may follow and asks for --schema", () => {
    const manifest = json("positive/manifest-mcp.json");
    delete manifest.capabilities;
    const result = run(one("notes.json", manifest));
    expect(result.code).toBe(2);
    expect(result.out).toContain("its members match manifest.schema.json (missing capabilities)");
    expect(result.out).not.toContain("result.schema.json");
    expect(run(one("notes.json", manifest), "--schema", "manifest").out).toContain("capabilities");
  });

  it("a document that is not an object is a usage error naming no candidate", () => {
    const result = run(one("notes.json", [1, 2]));
    expect(result.code).toBe(2);
    expect(result.out).toContain("cannot tell which schema");
    expect(result.out).not.toContain("its members match");
  });

  it("without INIT_CWD a path resolves from the process's directory", () => {
    const before = process.env.INIT_CWD;
    delete process.env.INIT_CWD;
    try {
      expect(run(fixture("positive/manifest-mcp.json")).code).toBe(0);
    } finally {
      if (before !== undefined) process.env.INIT_CWD = before;
    }
  });

  it("an unknown contractVersion names the member and the values this checkout reads", () => {
    const manifest = json("positive/manifest-mcp.json");
    manifest.contractVersion = "0.2.0";
    const result = run(one("vendor.json", manifest));
    expect(result.code).toBe(1);
    expect(result.out).toContain('/contractVersion  schema/const  contractVersion "0.2.0" is not one this checkout reads; it reads "0.1.0"');
  });

  it("a relative path is the author's, from where pnpm was run (INIT_CWD), only when `validate` is the script", () => {
    const dir = folder({ "fabric-agent.json": json("positive/manifest-mcp.json") });
    const before = { cwd: process.env.INIT_CWD, event: process.env.npm_lifecycle_event };
    process.env.INIT_CWD = dir;
    try {
      process.env.npm_lifecycle_event = "validate";
      expect(run("./fabric-agent.json").code).toBe(0);
      // Another script that pnpm started: the path is the process's, where no fabric-agent.json is.
      process.env.npm_lifecycle_event = "other";
      expect(run("./fabric-agent.json").code).toBe(2);
    } finally {
      for (const [name, value] of [["INIT_CWD", before.cwd], ["npm_lifecycle_event", before.event]] as const) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
    }
  });

  it("a usage error with --json is JSON", () => {
    const result = run("--json", "--schema", "nope");
    expect(result.code).toBe(2);
    expect(JSON.parse(result.out).usage[0]).toContain("unknown schema nope");
  });

  it("a profile kind that is an Object property draws no hint", () => {
    const manifest = json("positive/manifest-mcp.json");
    manifest.capabilities[0].profile.kind = "constructor";
    expect(run(one("fabric-agent.json", manifest)).out).not.toContain("hint/profile-version");
  });

  it("a descriptor's manifest not yet at its install path is read from the folder, with a note", () => {
    const d = json("positive/service-descriptor.json");
    d.fabricManifest = "~/no/such/place/fabric-agent.json";
    const result = run(folder({ [`${d.id as string}.${(d.instance as string | undefined) ?? "default"}.json`]: d, "fabric-agent.json": json("positive/manifest-mcp.json") }));
    expect(result.out).toContain("note/pair");
    expect(result.out).not.toContain("does not resolve");
  });

  it("a message that quotes a newline stays on one line", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "fac-validate-"));
    const file = path.join(dir, "fabric-agent.json");
    writeFileSync(file, "{\n  \"a\": 1,\n");
    const result = run(file);
    expect(result.out.trim().split("\n")).toHaveLength(1);
  });
});

describe("the second unit and product readings' cases (contract review 2026-10-21)", () => {
  const evil = { toString: 1 };

  it("a member that is an object with a toString member is data, never a throw", () => {
    const manifest = json("positive/manifest-mcp.json");
    manifest.capabilities[0].profile.kind = evil;
    expect(() => run(one("fabric-agent.json", manifest))).not.toThrow();
    expect(run(one("fabric-agent.json", manifest)).code).toBe(1);
    const known = json("positive/service-well-known.json");
    known.service.id = evil;
    const dir = folder({ "example-agent.default.json": json("positive/service-descriptor.json"), "x.well-known.json": known, "y.well-known.json": json("positive/service-well-known.json") });
    expect(() => JSON.parse(run(dir, "--json").out)).not.toThrow();
    const entry = json("positive/provider-entry-stdio.json");
    const pairs = folder({ "providers/agent.json": { ...entry, id: evil, manifest: "~/no-such-folder/fabric-agent.json" }, "a/fabric-agent.json": json("positive/manifest-mcp.json"), "b/fabric-agent.json": json("positive/manifest-mcp.json") });
    expect(() => run(pairs)).not.toThrow();
  });

  it("a provider id that ends another's is not paired with the other's manifest", () => {
    const manifest = json("positive/manifest-mcp.json");
    const entry = json("positive/provider-entry-stdio.json");
    const files: Record<string, unknown> = {};
    for (const id of ["notes", "my-notes"]) {
      const providerId = `https://agents.example/providers/${id}`;
      files[`${id}/fabric-agent.json`] = { ...manifest, provider: { ...manifest.provider, id: providerId } };
      files[`providers/${id}.json`] = { ...entry, id, providerId, manifest: `~/no-such-folder/${id}/fabric-agent.json` };
    }
    const result = run(folder(files));
    expect(result.out).not.toMatch(/  FAC-SEM-014  /);
    expect(result.code).toBe(0);
    expect(result.out).toContain("note/pair");
  });

  it("a bad member name is one line at the member, naming it", () => {
    const entry = json("positive/provider-entry-stdio.json");
    entry.run.mcp.stdio.env = { "bad name": "secret-ref:API_KEY" };
    const out = run(one("agent.json", entry)).out.trimEnd().split("\n");
    expect(out.filter((line: string) => line.includes("/run/mcp/stdio/env"))).toEqual([expect.stringContaining('/run/mcp/stdio/env/bad name  schema/pattern  the member name "bad name" must match pattern')]);
    expect(out.join("\n")).not.toContain("propertyNames");
  });

  it("a hint carries its own help link", () => {
    const manifest = json("positive/manifest-mcp.json");
    manifest.capabilities[0].profile.protocolVersion = "1.0";
    const report = JSON.parse(run(one("fabric-agent.json", manifest), "--json").out) as { notes: Array<{ rule: string; help: string }> };
    expect(report.notes.find((note) => note.rule === "hint/profile-version")?.help).toBe("docs/specification/profiles.md");
  });

  it("a file that is not JSON and an unknown contractVersion carry a help link", () => {
    const dir = folder({});
    writeFileSync(path.join(dir, "broken.json"), "{ nope");
    const broken = JSON.parse(run(path.join(dir, "broken.json"), "--json").out) as { problems: Array<{ help?: string }> };
    expect(broken.problems.every((problem) => problem.help !== undefined)).toBe(true);
    const manifest = json("positive/manifest-mcp.json");
    manifest.contractVersion = "0.2.0";
    const version = JSON.parse(run(one("vendor.json", manifest), "--json").out) as { problems: Array<{ help?: string }> };
    expect(version.problems).toEqual([expect.objectContaining({ help: "docs/specification/versioning.md" })]);
  });

  it("an empty folder after a target that failed still says it holds no readable .json file", () => {
    const empty = folder({});
    const result = run(path.join(empty, "missing.json"), empty);
    expect(result.code).toBe(2);
    expect(result.out).toContain("holds no readable .json file");
  });
});

describe("the second seam reading's cases: a consumer's own folder (contract review 2026-10-21)", () => {
  const lock = { contract: "fabric-agent-contract", version: "0.1.0", repository: "https://github.com/passioncode-ai/fabric-agent-contract", commit: "63bb2965cce23b585353caba7d0fdbff0c561ff0" };

  it("a lock file is a contract pin, its kit-written members are notes", () => {
    expect(inferSchema(lock, "x/fabric-contract.lock.json")).toBe("contract-pin.schema.json");
    const result = run(one("fabric-contract.lock.json", { ...lock, adapter: { repository: "https://github.com/passioncode-ai/fabric-agent-adapter", tag: "v0.39.1" }, kit: { source: "node" } }));
    expect(result.code).toBe(0);
    expect(result.out).not.toContain("service-descriptor");
    expect(result.out).toContain("note/lock-member");
  });

  it("a JSON Schema named like a service key is not a service descriptor", () => {
    expect(inferSchema({ $schema: "https://json-schema.org/draft/2020-12/schema" }, "x/capability-input.schema.json")).toBeUndefined();
    expect(inferSchema({ $schema: "https://json-schema.org/draft/2020-12/schema" }, "x/report.input.json")).toBeUndefined();
  });

  it("a folder with files that are no contract document checks the rest and notes them", () => {
    const dir = folder({ "fabric-agent.json": json("positive/manifest-mcp.json"), "fabric-contract.lock.json": lock, "schemas/capability-input.schema.json": { $schema: "https://json-schema.org/draft/2020-12/schema", type: "object" }, "fixtures/case.json": { input: 1 } });
    const result = run(dir);
    expect(result.code).toBe(0);
    expect(result.out).not.toContain("FAC-SEM-010");
    expect(result.out).toContain("note/skipped");
    expect(run(path.join(dir, "fixtures/case.json")).code).toBe(2);
  });
});

describe("the third unit reading's cases (contract review 2026-10-21)", () => {
  it("a contract document that carries a contract $schema is still checked", () => {
    const entry = json("positive/provider-entry-stdio.json");
    delete entry.protocol;
    entry.$schema = "https://fabric.passioncode.ai/agent-contract/0.1.0/schemas/provider.schema.json";
    const result = run(folder({ "fabric-agent.json": json("positive/manifest-mcp.json"), [`providers/${entry.id as string}.json`]: entry }));
    expect(result.code).toBe(1);
    expect(result.out).toContain('is missing the required member "protocol"');
    expect(inferSchema({ $schema: "https://fabric.passioncode.ai/agent-contract/0.1.0/schemas/service-descriptor.schema.json", origin: "http://127.0.0.1:47195" }, "x/example-agent.default.json")).toBe("service-descriptor.schema.json");
  });

  it("a folder with nothing to check is exit 2 whatever came before it", () => {
    const broken = folder({});
    writeFileSync(path.join(broken, "broken.json"), "{");
    const skipped = folder({ "case.json": { input: 1 } });
    for (const order of [[path.join(broken, "broken.json"), skipped], [skipped, path.join(broken, "broken.json")]]) {
      const result = run(...order);
      expect(result.code).toBe(2);
      expect(result.out).toContain("holds no document this checkout can tell");
    }
  });

  it("two keys equally near name neither", () => {
    expect(nearestKey("https://k.example/abcd", ["https://k.example/abcx", "https://k.example/abcy"])).toBeUndefined();
    expect(nearestKey("https://k.example/abcd", ["https://k.example/abcx", "https://k.example/zzzzzz"])).toBe("https://k.example/abcx");
  });

  it("an entry without a manifest member says so, not 'undefined'", () => {
    const entry = json("positive/provider-entry-stdio.json");
    delete entry.manifest;
    const out = run(folder({ [`providers/${entry.id as string}.json`]: entry, "fabric-agent.json": json("positive/manifest-mcp.json") })).out;
    expect(out).not.toContain("undefined");
    expect(out).toContain("the entry names no manifest");
  });
});

describe("the third product reading's cases (contract review 2026-10-21)", () => {
  it("the extension-key hint's help lists every key the contract defines", async () => {
    const { EXTENSION_KEYS } = await import("../src/extensions.js");
    const page = readFileSync(path.join(root, "docs/specification/interop.md"), "utf8");
    const section = page.slice(page.indexOf("## Extension key"), page.indexOf("\n## ", page.indexOf("## Extension key") + 3));
    for (const key of Object.values(EXTENSION_KEYS)) expect(section).toContain(key);
  });
});

describe("the third seam reading's cases: files in a consumer's folder (contract review 2026-10-21)", () => {
  it("fixtures named like a service key, schemas with $id, a tsconfig and a probe receipt are noted, not misread", () => {
    const lock = { contract: "fabric-agent-contract", version: "0.1.0", repository: "https://github.com/passioncode-ai/fabric-agent-contract", commit: "63bb2965cce23b585353caba7d0fdbff0c561ff0" };
    const dir = folder({
      "fabric-agent.json": json("positive/manifest-mcp.json"),
      "fabric-contract.lock.json": lock,
      "fixtures/reports.query.json": { text: "x", locale: "en-US", idempotencyKey: "k" },
      "fixtures/x.status.json": {},
      "schemas/ask.input.json": { $id: "urn:x:ask", type: "object", properties: {} },
      "tsconfig.build.json": { compilerOptions: {} },
      "probe-receipts.json": { protocol: { name: "mcp", version: "2025-06-18" }, contractVersion: "0.1.0", capabilities: [] }
    });
    const result = run(dir);
    expect(result.out).not.toContain("service-descriptor");
    expect(result.out).not.toContain("FAC-SEM-010");
    expect(result.out).not.toContain("schema/const");
    expect(result.code).toBe(0);
    expect(result.out.match(/note\/skipped/g)?.length).toBe(5);
  });
});

describe("the fourth unit reading's cases (contract review 2026-10-21)", () => {
  it("a well-known document missing a member is checked, in a folder and alone, and still paired", () => {
    const known = json("positive/service-well-known.json");
    delete known.surfaces;
    const dir = folder({ "example-agent.default.json": json("positive/service-descriptor.json"), "example-agent.default.well-known.json": known });
    const result = run(dir);
    expect(result.code).toBe(1);
    expect(result.out).toContain('is missing the required member "surfaces"');
    expect(result.out).not.toContain("note/skipped");
    expect(run(path.join(dir, "example-agent.default.well-known.json")).code).toBe(1);
  });

  it("a discriminator of the wrong type is a problem; only an object under protocol is another document's", () => {
    const known = json("positive/service-well-known.json");
    known.protocol = ["fabric-service/0.1"];
    const result = run(folder({ "example-agent.default.json": json("positive/service-descriptor.json"), "x.well-known.json": known }));
    expect(result.code).toBe(1);
    expect(result.out).toContain("schema/const");
    const manifest = json("positive/manifest-mcp.json");
    manifest.contractVersion = 0.1;
    expect(run(folder({ "fabric-agent.json": json("positive/manifest-mcp.json"), "other.json": manifest })).code).toBe(1);
  });

  it("a server config with a protocol member is no descriptor; a descriptor with lifecycle alone still is", () => {
    expect(inferSchema({ protocol: "https", port: 8080 }, "x/server.config.json")).toBeUndefined();
    expect(inferSchema({ lifecycle: {} }, "x/example-agent.default.json")).toBe("service-descriptor.schema.json");
    expect(inferSchema({ protocol: "fabric-service/0.2" }, "x/example-agent.default.json")).toBe("service-descriptor.schema.json");
  });

  it("an entry with no manifest member and none in the folder says so", () => {
    const entry = json("positive/provider-entry-stdio.json");
    delete entry.manifest;
    const out = run(folder({ [`providers/${entry.id as string}.json`]: entry })).out;
    expect(out).toContain("the entry names no manifest, so the entry is not checked against it");
    expect(out).not.toContain("(none)");
  });

  it("a key three characters longer and three edits away is named; four edits is not", () => {
    expect(nearestKey("https://k.example/abcdefgh", ["https://k.example/abcde"])).toBe("https://k.example/abcde");
    expect(nearestKey("https://k.example/abcdefgh", ["https://k.example/abcdz"])).toBeUndefined();
  });
});

describe("the fourth seam and product readings' cases: a consumer's folder as authors lay it out (contract review 2026-10-21)", () => {
  const descriptor = () => ({ ...json("positive/service-descriptor.json"), fabricManifest: "~/no-such-folder/example-agent/fabric-agent.json" });
  const manifest = () => {
    const value = json("positive/manifest-mcp.json");
    value.provider.extensions = { "https://fabric.passioncode.ai/agent-contract/extensions/service/0.1": { descriptor: "example-agent.default" } };
    return value;
  };

  it("a service and a provider entry share one folder: each finds its own manifest", () => {
    const id = "example-reports";
    const entry = { ...json("positive/provider-entry-stdio.json"), id, providerId: `https://agents.example/providers/${id}` };
    const other = json("positive/manifest-mcp.json");
    other.provider.id = entry.providerId;
    const result = run(folder({ "example-agent.default.json": descriptor(), "fabric-agent.json": manifest(), [`${id}.json`]: { ...entry, manifest: `~/no-such-folder/${id}/fabric-agent.json` }, [`${id}/fabric-agent.json`]: other }));
    expect(result.out).not.toMatch(/  FAC-SEM-0(14|20)  /);
    expect(result.code).toBe(0);
    expect(result.out.match(/note\/pair/g)?.length).toBe(2);
  });

  it("an installed manifest at the named path is read, and the note names it", () => {
    const installed = folder({ "fabric-agent.json": { ...manifest(), provider: { ...manifest().provider, extensions: { "https://fabric.passioncode.ai/agent-contract/extensions/service/0.1": { descriptor: "example-agent.old" } } } } });
    const at = path.join(installed, "fabric-agent.json");
    const result = run(folder({ "example-agent.default.json": { ...descriptor(), fabricManifest: at }, "fabric-agent.json": manifest() }));
    expect(result.code).toBe(1);
    expect(result.out).toContain(`the installed ${at} is read as the manifest, not the folder's fabric-agent.json`);
    expect(result.out).toContain("FAC-SEM-020");
  });

  it.skipIf(process.platform === "win32")("an installed manifest that is a FIFO is never read: a note says so, without waiting on it", () => {
    const installed = folder({ "x.txt": "x" });
    const at = path.join(installed, "fabric-agent.json");
    expect(spawnSync("mkfifo", [at]).status).toBe(0);
    const dir = folder({ "example-agent.default.json": { ...descriptor(), fabricManifest: at }, "fabric-agent.json": manifest() });
    // In a child process bounded by the parent's timeout: a read of the FIFO would block this test process too.
    const script = path.join(folder({ "x.txt": "x" }), "pair.ts");
    writeFileSync(script, [
      `import { main } from ${JSON.stringify(pathToFileURL(path.join(root, "src/validate-cli.ts")).href)};`,
      "const start = performance.now();",
      `const result = main([${JSON.stringify(dir)}]);`,
      "process.stdout.write(JSON.stringify({ ...result, ms: performance.now() - start }));"
    ].join("\n"));
    const child = spawnSync(process.execPath, [path.join(root, "node_modules/tsx/dist/cli.mjs"), script], { encoding: "utf8", timeout: 60_000 });
    expect(child.error).toBeUndefined();
    const result = JSON.parse(child.stdout) as { code: number; out: string; ms: number };
    // A read of the FIFO would wait forever; the bound only proves the run did not, so it is wide for a loaded machine.
    expect(result.ms).toBeLessThan(20_000);
    expect(result.out).toContain(`${at} is not a file, so no manifest was read`);
  }, 120_000);

  it("a manifest the descriptor names under another file name is the folder's only manifest", () => {
    const result = run(folder({ "example-agent.default.json": { ...descriptor(), fabricManifest: "~/no-such-folder/custom-name.json" }, "fabric-agent.json": manifest() }));
    expect(result.code).toBe(0);
    expect(result.out).toContain("~/no-such-folder/custom-name.json is not installed yet, so the folder's fabric-agent.json is read as the manifest it names");
  });

  it("a provider entry is told by its members wherever it is saved, so a lost protocol is a problem", () => {
    const entry = json("positive/provider-entry-stdio.json");
    delete entry.protocol;
    expect(inferSchema(entry, "x/agent.json")).toBe("provider.schema.json");
    const result = run(folder({ "agent.json": entry, "fabric-agent.json": json("positive/manifest-mcp.json") }));
    expect(result.code).toBe(1);
    expect(result.out).toContain('is missing the required member "protocol"');
  });

  it("a providers/ folder named as the target still reads its entries as entries", () => {
    const entry = json("positive/provider-entry-stdio.json");
    const home = folder({ [`providers/${entry.id as string}.json`]: { ...entry, protocol: undefined, providerId: undefined, run: undefined, manifest: undefined, name: "x" } });
    expect(inferSchema({ name: "x" }, path.join(home, "providers", "a.json"))).toBeUndefined();
    expect(inferSchema({ manifest: "x" }, path.join(home, "providers", "a.json"))).toBe("provider.schema.json");
    const target = run(path.join(home, "providers"));
    expect(target.code).toBe(2);
  });

  it("a test fixture with an MCP date revision under protocol is noted, a contract-shaped unknown revision is a problem", () => {
    const fixture = { version: "0.3.0", protocol: "2026-07-28", tools: [] };
    const skipped = run(folder({ "fabric-agent.json": json("positive/manifest-mcp.json"), "contract.json": fixture }));
    expect(skipped.code).toBe(0);
    expect(skipped.out).not.toContain("schema/const");
    const known = json("positive/service-well-known.json");
    known.protocol = "fabric-service/0.9";
    expect(run(one("x.json", known)).out).toContain('protocol "fabric-service/0.9" is not one this checkout reads');
  });

  it("in a folder, a file that does not parse is a problem, whatever its name", () => {
    const dir = folder({ "fabric-agent.json": json("positive/manifest-mcp.json") });
    writeFileSync(path.join(dir, "example-agent.default.json"), "{");
    expect(run(dir).code).toBe(1);
  });

  it("another tool's lock under the lock's name is no contract pin", () => {
    expect(inferSchema({ profile: "observatory-local-mcp", version: "1.2.0", schemas: [] }, "x/fabric-contract.lock.json")).toBeUndefined();
  });

  it("a document two schemas of one protocol fit equally is a problem in a folder", () => {
    // comms-directory misses projects, comms-status misses responders: one member each.
    const board = { protocol: "fabric-project-comms/0.1", snapshot: {}, cursor: null, board: {} };
    const result = run(folder({ "fabric-agent.json": json("positive/manifest-mcp.json"), "board.json": board }));
    expect(result.code).toBe(1);
    expect(result.out).toContain("pass --schema to say which");
  });
});

describe("the fifth unit reading's cases: pairing in a shared folder (contract review 2026-10-21)", () => {
  const service = (id: string, fabricManifest: string) => ({ ...json("positive/service-descriptor.json"), id, fabricManifest });
  const manifestFor = (descriptorKey: string) => {
    const value = json("positive/manifest-mcp.json");
    value.provider.extensions = { "https://fabric.passioncode.ai/agent-contract/extensions/service/0.1": { descriptor: descriptorKey } };
    return value;
  };

  it("a manifest in another owner's folder never stands in, and an installed one is read", () => {
    const installed = folder({ "beta/fabric-agent.json": manifestFor("beta.default") });
    const result = run(folder({
      "alpha.default.json": service("alpha", "~/no-such-folder/alpha/fabric-agent.json"),
      "alpha/fabric-agent.json": manifestFor("alpha.default"),
      "beta.default.json": { ...service("beta", path.join(installed, "beta", "fabric-agent.json")), origin: "http://127.0.0.1:47196" }
    }));
    expect(result.out).not.toMatch(/  FAC-SEM-020  /);
    expect(result.code).toBe(0);
  });

  it("an entry whose installed manifest does not parse is FAC-SEM-014, not a pass", () => {
    const broken = folder({});
    writeFileSync(path.join(broken, "fabric-agent.json"), "{not json");
    const entry = json("positive/provider-entry-stdio.json");
    const result = run(folder({ [`providers/${entry.id as string}.json`]: { ...entry, manifest: path.join(broken, "fabric-agent.json") } }));
    expect(result.code).toBe(1);
    expect(result.out).toMatch(/  FAC-SEM-014  /);
    expect(result.out).toContain("does not parse as JSON");
    expect(result.out).not.toContain("was not found");
  });

  it("a providers/ folder named as the target reads an entry that carries run alone", () => {
    const home = folder({ "providers/agent.json": { run: { mcp: {} } } });
    expect(run(path.join(home, "providers")).code).toBe(1);
  });

  it("a manifest at the named path inside the folder is read before another owner's top-level one, without a note", () => {
    const dir = folder({ "fabric-agent.json": manifestFor("other.default"), "sub/fabric-agent.json": manifestFor("alpha.default") });
    writeFileSync(path.join(dir, "alpha.default.json"), JSON.stringify(service("alpha", path.join(dir, "sub", "fabric-agent.json"))));
    const result = run(dir);
    expect(result.out).not.toMatch(/  FAC-SEM-020  /);
    expect(result.out).not.toContain("alpha.default.json  /fabricManifest  note/pair");
  });

  it("an <id>.<instance>/ folder is the owner's, before the top level", () => {
    const result = run(folder({ "fabric-agent.json": manifestFor("other.default"), "alpha.default/fabric-agent.json": manifestFor("alpha.default"), "alpha.default.json": service("alpha", "~/no-such-folder/x/fabric-agent.json") }));
    expect(result.out).not.toMatch(/  FAC-SEM-020  /);
  });

  it("a descriptor without instance owns the <id>.default/ folder, as its service key says", () => {
    const lone = service("alpha", "~/no-such-folder/x/fabric-agent.json");
    delete (lone as Record<string, unknown>).instance;
    const result = run(folder({ "fabric-agent.json": manifestFor("other.default"), "alpha.default/fabric-agent.json": manifestFor("alpha.default"), "alpha.default.json": lone }));
    expect(result.out).toContain("the folder's alpha.default/fabric-agent.json is read");
  });

  it("an entry with no manifest member pairs with the manifest in its own folder before the folder's others", () => {
    const entry = json("positive/provider-entry-stdio.json");
    const id = entry.id as string;
    delete entry.manifest;
    const own = json("positive/manifest-mcp.json");
    own.provider.id = entry.providerId;
    const result = run(folder({ [`providers/${id}.json`]: entry, [`${id}/fabric-agent.json`]: own, "fabric-agent.json": json("positive/manifest-mcp.json") }));
    expect(result.out).not.toMatch(/  FAC-SEM-014  /);
    expect(result.out).toContain(`the folder's ${id}/fabric-agent.json is read as the manifest it names`);
  });

  it("an http/1.1 protocol is some other document's, and a JSON Schema with entry members is still a schema", () => {
    expect(run(folder({ "fabric-agent.json": json("positive/manifest-mcp.json"), "server.json": { protocol: "http/1.1", port: 80 } })).code).toBe(0);
    expect(inferSchema({ $schema: "https://json-schema.org/draft/2020-12/schema", providerId: "x", run: {} }, "x/a.json")).toBeUndefined();
    expect(inferSchema({ providerId: "x", manifest: { a: 1 } }, "x/report.json")).toBeUndefined();
  });

  it("a Windows home path is expanded and its file name read", () => {
    const result = run(folder({ "example-agent.default.json": service("example-agent", "~\\no-such-folder\\fabric-agent.json"), "fabric-agent.json": manifestFor("example-agent.default") }));
    expect(result.code).toBe(0);
    expect(result.out).toContain("is not installed yet, so the folder's fabric-agent.json is read");
  });
});

describe("the fifth seam reading's cases (contract review 2026-10-21)", () => {
  it("a document of a protocol a oneOf schema shares is not given to a sibling by the protocol alone", () => {
    // Settled by validation: the oneOf schema that accepts it, never device-health.
    const result = run(fixture("positive/device-check-in.json"), "--json");
    expect(result.code).toBe(0);
    expect((JSON.parse(result.out) as { files: Array<{ schema: string }> }).files[0]?.schema).toBe("device-check-in.schema.json");
  });

  it("the positive fixtures as one folder report no schema problem on a valid file", () => {
    const report = JSON.parse(run(path.join(root, "fixtures/positive"), "--json").out) as { problems: Array<{ file: string; rule: string }> };
    expect(report.problems.filter((problem) => problem.rule.startsWith("schema/") && problem.file.endsWith(".json"))).toEqual([]);
  }, 120_000);

  it("an installed manifest at the named path, with no manifest in the folder, needs no note while its pair holds", () => {
    const paired = json("positive/manifest-mcp.json");
    paired.provider.extensions = { "https://fabric.passioncode.ai/agent-contract/extensions/service/0.1": { descriptor: "example-agent.default" } };
    const installed = folder({ "fabric-agent.json": paired });
    const descriptor = { ...json("positive/service-descriptor.json"), fabricManifest: path.join(installed, "fabric-agent.json") };
    expect(run(folder({ "example-agent.default.json": descriptor })).out).not.toContain("note/pair");
  });

  it("a damaged pin under the lock's name is still a pin, another tool's lock is not", () => {
    expect(inferSchema({ version: "0.1.0", repository: "x" }, "x/fabric-contract.lock.json")).toBe("contract-pin.schema.json");
    expect(inferSchema({ profile: "observatory-local-mcp", version: "1.2.0", schemas: [] }, "x/fabric-contract.lock.json")).toBeUndefined();
  });
});

describe("the fifth product reading's cases (contract review 2026-10-21)", () => {
  it("a half-written well-known document is checked as a well-known document, not as a usage report", () => {
    const half = { protocol: "fabric-service/0.1", service: json("positive/service-well-known.json").service };
    const out = run(folder({ "example-agent.default.json": json("positive/service-descriptor.json"), "example-agent.default.well-known.json": half })).out;
    expect(out).toContain("schemas/service-well-known.schema.json");
    expect(out).not.toContain("service-usage");
  });
});

describe("the sixth readings' cases (contract review 2026-10-21)", () => {
  const service = (id: string, fabricManifest: string, port: number) => ({ ...json("positive/service-descriptor.json"), id, fabricManifest, origin: `http://127.0.0.1:${port}` });
  const manifestFor = (descriptorKey: string) => {
    const value = json("positive/manifest-mcp.json");
    value.provider.extensions = { "https://fabric.passioncode.ai/agent-contract/extensions/service/0.1": { descriptor: descriptorKey } };
    return value;
  };

  it("a broken document of a protocol a oneOf schema shares is a problem in a folder, not a skipped note", () => {
    const health = json("positive/device-health-re-enrolled.json");
    delete health.reasons;
    const result = run(folder({ "fabric-agent.json": json("positive/manifest-mcp.json"), "health.json": health }));
    expect(result.code).toBe(1);
    expect(result.out).toContain("reasons");
  });

  it("blindProtocols names the protocols whose oneOf schemas the checker cannot see, and their schemas", () => {
    const blind = blindProtocols(loadSchemasSync());
    expect([...blind.keys()].sort()).toEqual(["fabric-activity/0.1", "fabric-agent-call/1", "fabric-device/0.1", "fabric-relay/0.1"]);
    expect(blind.get("fabric-device/0.1")).toContain("device-check-in.schema.json");
  });

  it("settles a protocol carried in type by validation: a sealed call, a call and an answer (DEC-0106)", () => {
    for (const [name, schema] of [["agent-call-sealed", "agent-call-sealed.schema.json"], ["agent-call-message-call", "agent-call-message.schema.json"], ["agent-call-message-answer", "agent-call-message.schema.json"]]) {
      const result = main([fixture(`positive/${name}.json`), "--json"]);
      expect(result.code, name).toBe(0);
      expect((JSON.parse(result.out) as { files: Array<{ schema: string }> }).files[0]?.schema, name).toBe(schema);
    }
  });

  it("a manifest in another owner's folder never stands in", () => {
    const result = run(folder({ "alpha.default.json": service("alpha", "~/no-such-folder/alpha/fabric-agent.json", 47195), "beta.default.json": service("beta", "~/no-such-folder/beta/fabric-agent.json", 47196), "beta/fabric-agent.json": manifestFor("beta.default") }));
    expect(result.out).not.toContain("alpha.default.json  /fabricManifest  note/pair");
    expect(result.out).toMatch(/alpha\.default\.json  \/descriptor\/fabricManifest  FAC-SEM-020  .*does not resolve/);
    const entry = json("positive/provider-entry-stdio.json");
    delete entry.manifest;
    const shared = run(folder({ "beta.default.json": service("beta", "~/no-such-folder/beta/fabric-agent.json", 47196), "beta/fabric-agent.json": manifestFor("beta.default"), [`providers/${entry.id as string}.json`]: entry }));
    expect(shared.out).toContain("the entry names no manifest, so the entry is not checked against it");
  });

  it("a stale installed manifest with no folder copy is named when its pair fails", () => {
    const stale = folder({ "fabric-agent.json": manifestFor("example-agent.old") });
    const at = path.join(stale, "fabric-agent.json");
    const result = run(folder({ "example-agent.default.json": { ...service("example-agent", at, 47195) } }));
    expect(result.code).toBe(1);
    expect(result.out).toContain(`the manifest read is the installed ${at}; if it is stale, reinstall it`);
  });

  it("a folder at the named manifest path is said to be a folder", () => {
    const dir = folder({});
    expect(run(folder({ "example-agent.default.json": service("example-agent", dir, 47195) })).out).toContain("is a folder, not a manifest file");
  });

  it("the lock rule: another tool's lock carries no pin member and one of schemas, releases, schemaRelease", () => {
    for (const member of ["schemas", "releases", "schemaRelease"]) expect(inferSchema({ version: "1.2.0", [member]: [] }, "x/fabric-contract.lock.json")).toBeUndefined();
    expect(inferSchema({ contract: "fabric-agent-contract", commit: "x", schemas: [] }, "x/fabric-contract.lock.json")).toBe("contract-pin.schema.json");
  });

  it("an entry is told by a string providerId and a run object or a manifest string only", () => {
    expect(inferSchema({ providerId: 7, run: {} }, "x/a.json")).toBeUndefined();
    expect(inferSchema({ providerId: "x", run: "npx x" }, "x/a.json")).toBeUndefined();
  });

  it("a Windows home path is the home folder, and its file name is read with either separator", () => {
    const home = folder({ "fabric-agent.json": manifestFor("example-agent.default") });
    // `os.homedir()` reads HOME on POSIX and USERPROFILE on Windows.
    const before = process.env.HOME;
    const beforeProfile = process.env.USERPROFILE;
    process.env.HOME = home;
    process.env.USERPROFILE = home;
    try {
      const result = run(folder({ "example-agent.default.json": service("example-agent", "~\\fabric-agent.json", 47195), "fabric-agent.json": manifestFor("other.default"), "other/fabric-agent.json": manifestFor("other.default") }));
      expect(result.out).not.toMatch(/  FAC-SEM-020  /);
    } finally {
      if (before === undefined) delete process.env.HOME;
      else process.env.HOME = before;
      if (beforeProfile === undefined) delete process.env.USERPROFILE;
      else process.env.USERPROFILE = beforeProfile;
    }
    const top = run(folder({ "example-agent.default.json": service("example-agent", "~\\no-such-folder\\fabric-agent.json", 47195), "fabric-agent.json": manifestFor("example-agent.default"), "other/fabric-agent.json": manifestFor("other.default") }));
    expect(top.out).toContain("so the folder's fabric-agent.json is read");
  });
});

// DEC-0149: an agent's source. `--kind source-tree` on a folder reads its fabric.source.json and checks the source
// files under it; a folder holding fabric.source.json beside fabric.package.json is checked as a pair (FAC-SEM-160).
describe("an agent's source (DEC-0149)", () => {
  const sourceManifest = (extra: Record<string, unknown> = {}) => ({ format: "fabric-source/1", include: ["src/", "docs/", "README.md", "LICENSE"], ...extra });
  // Assembled here, so no line of this file is shaped like a credential.
  const key = ["sk", "-", "A1".repeat(12)].join("");
  const lines = (out: string) => out.split("\n").filter((line) => line !== "");
  /** The lines that are not the note saying the folder was walked. */
  const found = (out: string) => lines(out).filter((line) => !line.includes("  note/walk  "));
  const cells = (out: string, count = 3) => found(out).map((line) => line.split("  ").slice(0, count));
  const gitIn = (dir: string, ...args: string[]) =>
    spawnSync("git", ["-c", "user.name=Example", "-c", "user.email=agent@example.invalid", "-c", "commit.gpgsign=false", "-c", "protocol.file.allow=always", ...args], { cwd: dir, encoding: "utf8" });

  it("checks the source files of a folder, naming each by its path in the folder, and leaves the rest unread", () => {
    const dir = folder({
      "fabric.source.json": sourceManifest({ binaries: ["docs/icon.png"], unchecked: [{ path: "src/vectors/", reason: "synthetic test vectors" }] }),
      LICENSE: "terms",
      "README.md": "# Agent\n\nAsk someone@mail.org.",
      "src/main.ts": "export const name = \"agent\";",
      "src/keys.ts": `const key = "${key}";`,
      "src/vectors/keys.json": `{"key": "${key}"}`,
      "docs/guide.md": "# Guide",
      "docs/diagram.bin": "\u0000\u0001",
      "node_modules/x/index.js": `const key = "${key}";`,
      "tests/run.ts": `const key = "${key}";`,
      ".git/config": `const key = "${key}";`
    });
    writeFileSync(path.join(dir, "docs/icon.png"), Buffer.from([0x89, 0x50, 0x00, 0x01]));
    const result = run(dir, "--kind", "source-tree");
    expect(result.code).toBe(1);
    expect(cells(result.out)).toEqual([
      ["docs/diagram.bin", "/files/2", "FAC-SEM-158"],
      ["src/keys.ts", "/files/6", "FAC-SEM-158"],
      ["README.md", "/files/1", "FAC-SEM-159 (accepted)"]
    ]);
    const out = found(result.out);
    expect(out[1]).toContain("src/keys.ts line 1, column 14: credential: ");
    expect(out[2]).toContain("README.md line 3, column 5: email: ");
    // Outside a Git work tree the checker says it walked the folder, and why, without naming it.
    expect(lines(result.out).filter((line) => line.includes("note/walk"))).toEqual([".  /  note/walk  git ls-files refused the folder (exit 128), so the folder's files were walked"]);
    expect(result.out).not.toContain(key);
    expect(result.out).not.toContain(dir);
    for (const unread of ["node_modules", "tests/run.ts", "vectors/keys.json"]) expect(result.out).not.toContain(unread);
    const parsed = JSON.parse(run(dir, "--kind", "source-tree", "--json").out) as { files: Array<{ file: string; kinds: string[] }> };
    expect(parsed.files).toEqual([{ file: "fabric.source.json", schema: "fabric-source.schema.json", kinds: ["source-manifest"] }, { file: ".", schema: null, kinds: ["source-tree"] }]);
  });

  it.skipIf(process.platform === "win32")("reads a symbolic link as the path it names, and skips what is no file (a FIFO)", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/main.ts": "x" });
    symlinkSync("/Users/jdoe", path.join(dir, "src/data"));
    expect(spawnSync("mkfifo", [path.join(dir, "src/pipe")]).status).toBe(0);
    const result = run(dir, "--kind", "source-tree");
    // The link's target is read as text (a home path) and with link-outside's rule (an absolute target).
    expect(cells(result.out)).toEqual([["src/data", "/files/2", "FAC-SEM-158"], ["src/data", "/files/2", "FAC-SEM-159 (accepted)"]]);
    expect(result.out).toContain("src/data line 1, column 1: link-outside: a link to a path outside the source: a source export does not carry its target");
    expect(result.out).toContain("src/data line 1, column 8: home-path: ");
  });

  it("never prints the folder or a value found in a path: a file whose path holds a finding is files[<index>]", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["docs/", "LICENSE"] }), LICENSE: "x", "docs/C--Users-jdoe-notes.md": "Notes by /home/jdoe.", [`docs/${key}.md`]: "notes" });
    const result = run(dir, "--kind", "source-tree");
    expect(result.code).toBe(1);
    expect(cells(result.out)).toEqual([["files[1]", "/files/1/path", "FAC-SEM-158"], ["files[1]", "/files/1", "FAC-SEM-158"], ["files[2]", "/files/2/path", "FAC-SEM-158"]]);
    expect(found(result.out)[2]).toContain("files[2], its path: credential: the file's path holds a value shaped like a credential");
    const json = run(dir, "--kind", "source-tree", "--json").out;
    for (const out of [result.out, json]) {
      expect(out.split(key).length - 1).toBe(0);
      expect(out).not.toContain("jdoe");
      expect(out).not.toContain(dir);
    }
  });

  it("reads what Git would commit in a work tree: an ignored file under include is not read, an untracked one is", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", ".gitignore": "src/.env\n", "src/.env": "MAILBOX=inbox", "src/new.ts": `"${key}"`, "src/.cache/x.ts": `"${key}"` });
    expect(gitIn(dir, "init", "-q").status).toBe(0);
    const result = run(dir, "--kind", "source-tree");
    expect(lines(result.out).map((line) => line.split("  ").slice(0, 3))).toEqual([["src/.cache/x.ts", "/files/2", "FAC-SEM-158"], ["src/new.ts", "/files/3", "FAC-SEM-158"]]);
    // A tracked file deleted from the work tree is not in the tree as it is.
    expect(gitIn(dir, "add", "src/new.ts").status).toBe(0);
    rmSync(path.join(dir, "src/new.ts"));
    expect(lines(run(dir, "--kind", "source-tree").out).map((line) => line.split("  ")[0])).toEqual(["src/.cache/x.ts"]);
    writeFileSync(path.join(dir, "src/new.ts"), `"${key}"`);
    // Outside Git the same folder is walked: the credential file by its name is read, and so is a dot-folder an include folder covers.
    rmSync(path.join(dir, ".git"), { recursive: true, force: true });
    expect(found(run(dir, "--kind", "source-tree").out).map((line) => line.split("  ")[0])).toEqual(["src/.cache/x.ts", "files[3]", "src/new.ts"]);
  });

  it("labels a file whose path holds a finding files[<index>] in the file column too, walked or in Git, text or JSON", () => {
    // A 44-character mixed-case run and an e-mail address, assembled here.
    const longRun = Array.from({ length: 11 }, (_, index) => `Qm${index % 10}z`).join("");
    expect(longRun).toHaveLength(44);
    const address = ["someone", "mail.org"].join("@");
    for (const git of [false, true]) {
      const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", [`src/${longRun}.js`]: `// ${address}` });
      if (git) expect(gitIn(dir, "init", "-q").status).toBe(0);
      for (const out of [run(dir, "--kind", "source-tree").out, run(dir, "--kind", "source-tree", "--json").out]) {
        expect(out).not.toContain(longRun);
        expect(out).toContain("files[");
        expect(out).not.toContain(dir);
      }
    }
  });

  it("counts files[<index>] from 0 in the code-unit order of the paths read, the same in a walk and in Git mode", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["a/", "a-b/", "LICENSE"] }), LICENSE: "x", "a/k.ts": `"${key}"`, "a-b/k.ts": `"${key}"`, "a/-Users-jdoe-x.md": "x" });
    const walkedOut = run(dir, "--kind", "source-tree").out;
    // LICENSE (0), a-b/k.ts (1), a/-Users-jdoe-x.md (2), a/k.ts (3), fabric.source.json (4): '-' sorts before '/'.
    expect(cells(walkedOut)).toEqual([["a-b/k.ts", "/files/1", "FAC-SEM-158"], ["files[2]", "/files/2/path", "FAC-SEM-158"], ["a/k.ts", "/files/3", "FAC-SEM-158"]]);
    expect(gitIn(dir, "init", "-q").status).toBe(0);
    expect(cells(run(dir, "--kind", "source-tree").out)).toEqual(cells(walkedOut));
  });

  it("walks a folder Git ignores, saying why, so its files are read and no include path reads as missing", () => {
    const parent = folder({ ".gitignore": "agent/\n", "agent/fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), "agent/LICENSE": "x", "agent/src/a.ts": "const data = \"/home/jdoe\";" });
    expect(gitIn(parent, "init", "-q").status).toBe(0);
    const result = run(path.join(parent, "agent"), "--kind", "source-tree");
    expect(lines(result.out).map((line) => line.split("  ").slice(0, 3))).toEqual([["src/a.ts", "/files/2", "FAC-SEM-158"], [".", "/", "note/walk"]]);
    expect(result.out).toContain("Git ignores this folder, so the folder's files were walked");
    expect(result.out).not.toContain("missing");
    // A Git work tree that lists nothing under an include path is walked too.
    const empty = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), ".gitignore": "src/\nLICENSE\n", LICENSE: "x", "src/a.ts": "x" });
    expect(gitIn(empty, "init", "-q").status).toBe(0);
    expect(run(empty, "--kind", "source-tree").out).toContain("Git lists no file under an include path here, so the folder's files were walked");
  });

  it("reports a nested repository in the source, a submodule in Git mode and a folder holding .git in a walk, unless excluded", () => {
    const inner = folder({ "lib.ts": "export {};" });
    expect(gitIn(inner, "init", "-q").status).toBe(0);
    expect(gitIn(inner, "add", ".").status).toBe(0);
    expect(gitIn(inner, "commit", "-qm", "lib").status).toBe(0);
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/main.ts": "x" });
    expect(gitIn(dir, "init", "-q").status).toBe(0);
    expect(gitIn(dir, "submodule", "add", "-q", inner, "src/lib").status).toBe(0);
    const result = run(dir, "--kind", "source-tree");
    expect(cells(result.out)).toEqual([["src/lib", "/files/2", "FAC-SEM-158"]]);
    expect(result.out).toContain("src/lib: nested-repository: ");
    writeFileSync(path.join(dir, "fabric.source.json"), JSON.stringify(sourceManifest({ include: ["src/", "LICENSE"], exclude: ["src/lib/"] })));
    expect(run(dir, "--kind", "source-tree")).toEqual({ code: 0, out: "" });
    const walked = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/main.ts": "x", "src/vendor/.git/HEAD": "ref: refs/heads/main", "src/vendor/a.ts": `"${key}"` });
    expect(cells(run(walked, "--kind", "source-tree").out)).toEqual([["src/vendor", "/files/3", "FAC-SEM-158"]]);
  });

  it.skipIf(process.platform === "win32")("never reads through a symbolic link in Git mode: a tracked folder replaced by a link to an outside folder", () => {
    const outside = folder({ "a.ts": `"${key}"` });
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/lib/a.ts": "x" });
    expect(gitIn(dir, "init", "-q").status).toBe(0);
    expect(gitIn(dir, "add", ".").status).toBe(0);
    rmSync(path.join(dir, "src/lib"), { recursive: true, force: true });
    symlinkSync(outside, path.join(dir, "src/lib"));
    const result = run(dir, "--kind", "source-tree");
    expect(result.out).not.toContain("credential");
    expect(result.out).not.toContain("src/lib/a.ts");
  });

  it("walks the folder without a note when no git can be found", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/a.ts": `"${key}"` });
    const saved = process.env.PATH;
    process.env.PATH = "";
    try {
      const result = run(dir, "--kind", "source-tree");
      expect(lines(result.out).map((line) => line.split("  ").slice(0, 3))).toEqual([["src/a.ts", "/files/2", "FAC-SEM-158"]]);
    } finally {
      process.env.PATH = saved;
    }
  });

  it("reports an untracked repository inside the source in Git mode, listed by Git with a trailing slash", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/main.ts": "x", "src/inner/lib.ts": "export {};" });
    expect(gitIn(dir, "init", "-q").status).toBe(0);
    const inner = path.join(dir, "src/inner");
    expect(gitIn(inner, "init", "-q").status).toBe(0);
    expect(gitIn(inner, "add", ".").status).toBe(0);
    expect(gitIn(inner, "commit", "-qm", "inner").status).toBe(0);
    const result = run(dir, "--kind", "source-tree");
    expect(result.code).toBe(1);
    expect(cells(result.out)).toEqual([["src/inner", "/files/2", "FAC-SEM-158"]]);
    expect(result.out).toContain("nested-repository");
  });

  it("stays in Git mode when Git lists only a nested repository under the include paths", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["sub/"] }), "sub/lib.ts": "export {};" });
    expect(gitIn(dir, "init", "-q").status).toBe(0);
    const inner = path.join(dir, "sub");
    expect(gitIn(inner, "init", "-q").status).toBe(0);
    expect(gitIn(inner, "add", ".").status).toBe(0);
    expect(gitIn(inner, "commit", "-qm", "inner").status).toBe(0);
    const result = run(dir, "--kind", "source-tree");
    expect(result.out).not.toContain("note/walk");
    expect(cells(result.out)).toEqual([["sub", "/files/1", "FAC-SEM-158"], ["fabric.source.json", "/manifest/include/0", "FAC-SEM-158"], ["fabric.source.json", "/files", "FAC-SEM-159 (accepted)"]]);
  });

  it("reports a nested repository an include path names without its trailing slash, in a walk and in Git mode alike", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE", "vendor/lib"] }), LICENSE: "x", "src/a.ts": "x", "vendor/lib/lib.ts": "export {};" });
    const inner = path.join(dir, "vendor/lib");
    expect(gitIn(inner, "init", "-q").status).toBe(0);
    expect(gitIn(inner, "add", ".").status).toBe(0);
    expect(gitIn(inner, "commit", "-qm", "inner").status).toBe(0);
    const walked = run(dir, "--kind", "source-tree");
    expect(walked.code).toBe(1);
    // The repository is no file of the tree, so the include path naming it is also missing.
    expect(found(walked.out)).toEqual([
      expect.stringMatching(/^vendor\/lib {2}\/files\/3 {2}FAC-SEM-158 {2}vendor\/lib: nested-repository: /),
      expect.stringMatching(/^fabric\.source\.json {2}\/manifest\/include\/2 {2}FAC-SEM-158 {2}missing: /)
    ]);
    expect(gitIn(dir, "init", "-q").status).toBe(0);
    const tracked = run(dir, "--kind", "source-tree");
    expect(tracked.out).not.toContain("note/walk");
    expect(found(tracked.out)).toEqual(found(walked.out));
  });

  it.skipIf(process.platform === "win32")("never runs a git from the checked folder: PATH's empty element is not the folder", () => {
    const real = gitExecutable() as string;
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", ".gitignore": "src/ignored.ts\n", "src/ignored.ts": `"${key}"`, "src/a.ts": "x", git: "#!/bin/sh\necho ran > \"$PWD/marker\"\nexit 1\n" });
    chmodSync(path.join(dir, "git"), 0o755);
    expect(gitIn(dir, "init", "-q").status).toBe(0);
    const saved = process.env.PATH;
    process.env.PATH = `:${path.dirname(real)}`;
    try {
      const result = run(dir, "--kind", "source-tree");
      expect(existsSync(path.join(dir, "marker"))).toBe(false);
      // Git mode: the ignored file is not read and no walk note is printed.
      expect(result.out).toBe("");
    } finally {
      process.env.PATH = saved;
    }
  });

  it.skipIf(process.platform !== "win32")("never runs a git.exe from the checked folder on Windows", () => {
    const real = gitExecutable() as string;
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", ".gitignore": "src/ignored.ts\n", "src/ignored.ts": `"${key}"`, "src/a.ts": "x", "git.exe": "not a program" });
    expect(gitIn(dir, "init", "-q").status).toBe(0);
    const saved = process.env.PATH;
    process.env.PATH = `;${path.dirname(real)}`;
    try {
      expect(run(dir, "--kind", "source-tree").out).toBe("");
    } finally {
      process.env.PATH = saved;
    }
  });

  it("finds git only in PATH's absolute folders, the POSIX defaults when PATH is unset, none on Windows then", () => {
    expect(gitExecutable({ PATH: "relative/bin::./bin" }, "linux")).toBeUndefined();
    expect(gitExecutable({}, "win32")).toBeUndefined();
    expect(gitExecutable({ PATH: path.join(scratch, "no-such-folder") }, "linux")).toBeUndefined();
    const fake = folder({ "git.exe": "x", "sub/git": "x" });
    expect(gitExecutable({ Path: `relative;${fake}` }, "win32")).toBe(path.join(fake, "git.exe"));
    // A git that is a folder, or not executable, is passed over.
    mkdirSync(path.join(fake, "dir/git"), { recursive: true });
    expect(gitExecutable({ PATH: `${path.join(fake, "dir")}:${path.join(fake, "sub")}` }, "linux")).toBeUndefined();
    const defaults = gitExecutable({}, "linux");
    expect(defaults === undefined || ["/bin/git", "/usr/bin/git"].includes(defaults)).toBe(true);
  });

  it.skipIf(process.platform === "win32" || process.getuid?.() === 0)("reports a tracked file it cannot reach in Git mode as a usage error, by its path in the folder", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/locked/b.ts": "x" });
    expect(gitIn(dir, "init", "-q").status).toBe(0);
    expect(gitIn(dir, "add", ".").status).toBe(0);
    chmodSync(path.join(dir, "src/locked"), 0o000);
    try {
      const result = run(dir, "--kind", "source-tree");
      expect(result.code).toBe(2);
      expect(result.out).toContain("usage error: cannot read src/locked/b.ts: EACCES");
      expect(result.out).not.toContain(dir);
    } finally {
      chmodSync(path.join(dir, "src/locked"), 0o755);
    }
  });

  it.skipIf(process.platform === "win32" || process.getuid?.() === 0)("never reaches a tracked path outside the source in Git mode, so a locked one is no usage error", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/a.ts": "x", "private/notes.md": "x" });
    expect(gitIn(dir, "init", "-q").status).toBe(0);
    expect(gitIn(dir, "add", ".").status).toBe(0);
    chmodSync(path.join(dir, "private"), 0o000);
    try {
      const result = run(dir, "--kind", "source-tree");
      expect([0, 1]).toContain(result.code);
      expect(result.out).not.toContain("usage error");
      expect(result.out).not.toContain("note/walk");
    } finally {
      chmodSync(path.join(dir, "private"), 0o755);
    }
  });

  it.skipIf(process.platform === "win32")("tells a git that could not run from one that refused the folder, by its error code only", () => {
    const stub = folder({ git: "#!/bin/sh\nprintf '%0100d' 0\n" });
    chmodSync(path.join(stub, "git"), 0o755);
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/a.ts": "x" });
    const saved = { path: process.env.PATH, maxBuffer: gitLimits.maxBuffer };
    process.env.PATH = stub;
    gitLimits.maxBuffer = 10;
    try {
      expect(run(dir, "--kind", "source-tree").out).toContain("git ls-files could not run (ENOBUFS), so the folder's files were walked");
    } finally {
      process.env.PATH = saved.path;
      gitLimits.maxBuffer = saved.maxBuffer;
    }
  });

  it("labels a file whose path holds an address by its index in a folder and as a document alike, printing no address", () => {
    const address = ["someone", "@", "mail.org"].join("");
    const files: Record<string, string> = { LICENSE: "x", [`src/${address}.md`]: "See /home/jdoe.", "src/a.ts": "x" };
    const manifest = sourceManifest({ include: ["src/", "LICENSE"] });
    const dir = folder({ "fabric.source.json": manifest, ...files });
    const all = { "fabric.source.json": JSON.stringify(manifest), ...files } as Record<string, string>;
    const doc = folder({ "tree.json": { manifest, files: Object.keys(all).sort().map((name) => ({ path: name, text: all[name] })) } });
    const labels = (out: string) => (JSON.parse(out) as { problems: Array<{ path: string; rule: string; message: string }> }).problems.map((problem) => [problem.path, problem.rule, problem.message]);
    const folderOut = run(dir, "--kind", "source-tree", "--json").out;
    const documentOut = run(path.join(doc, "tree.json"), "--kind", "source-tree", "--json").out;
    expect(labels(documentOut)).toEqual(labels(folderOut));
    expect(labels(folderOut)[0]?.[2]).toMatch(/^files\[\d+\] line 1, column 11: home-path: /);
    for (const out of [folderOut, documentOut, run(dir, "--kind", "source-tree").out]) expect(out).not.toContain(address);
  });

  it("labels a tree the same way as a folder and as a document, and names a document by its basename's place", () => {
    const files: Record<string, string> = { LICENSE: "x", "docs/someone@mail.org.md": "notes", "src/a.ts": "const data = \"/home/jdoe\";", "src/-Users-jdoe-x.md": "x" };
    const manifest = sourceManifest({ include: ["src/", "docs/", "LICENSE"] });
    const dir = folder({ "fabric.source.json": manifest, ...files });
    const all = { "fabric.source.json": JSON.stringify(manifest), ...files } as Record<string, string>;
    const tree = { manifest, files: Object.keys(all).sort().map((name) => ({ path: name, text: all[name] })) };
    const messages = (out: string) => found(out).map((line) => line.split("  ").slice(1, 4));
    const doc = folder({ "tree.json": tree });
    expect(messages(run(path.join(doc, "tree.json"), "--kind", "source-tree").out)).toEqual(messages(run(dir, "--kind", "source-tree").out));
    const keyed = folder({ [`${key}.json`]: tree });
    const out = run(path.join(keyed, `${key}.json`), "--kind", "source-tree").out;
    expect(out.split(key).length - 1).toBe(0);
    expect(out).toContain("<a path that may hold a finding, under .>");
  });

  it.skipIf(process.platform === "win32")("walks the folder, saying why, when git does not answer in time", () => {
    // A git that would answer only after a minute: the run must not wait for it (a bound wide enough for a loaded machine).
    const stub = folder({ git: "#!/bin/sh\nexec /bin/sleep 60\n" });
    chmodSync(path.join(stub, "git"), 0o755);
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/a.ts": "const data = \"/home/jdoe\";" });
    const saved = { path: process.env.PATH, timeout: gitLimits.timeoutMs };
    process.env.PATH = stub;
    gitLimits.timeoutMs = 300;
    try {
      const started = performance.now();
      const result = run(dir, "--kind", "source-tree");
      expect(performance.now() - started).toBeLessThan(20_000);
      expect(lines(result.out).map((line) => line.split("  ").slice(0, 3))).toEqual([["src/a.ts", "/files/2", "FAC-SEM-158"], [".", "/", "note/walk"]]);
      expect(result.out).toContain("git did not answer within 0.3 s, so the folder's files were walked");
      // A git that lists at once and does not answer whether the folder is ignored is walked past too.
      writeFileSync(path.join(stub, "git"), "#!/bin/sh\ncase \"$3\" in ls-files) printf 'src/a.ts\\0'; exit 0;; esac\nexec /bin/sleep 5\n");
      // Long enough for the quick listing under load, so it is the second command that times out.
      gitLimits.timeoutMs = 2000;
      const second = run(dir, "--kind", "source-tree");
      expect(second.out).toContain("git did not answer within 2 s, so the folder's files were walked");
    } finally {
      process.env.PATH = saved.path;
      gitLimits.timeoutMs = saved.timeout;
    }
  }, 120_000);

  it.skipIf(process.platform === "win32")("runs Git with the folder's own file-system monitor off", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/a.ts": "x" });
    expect(gitIn(dir, "init", "-q").status).toBe(0);
    const hook = path.join(scratch, `fsmonitor-${counter}.sh`);
    const marker = `${hook}.ran`;
    writeFileSync(hook, `#!/bin/sh\necho ran > "${marker}"\nexit 1\n`);
    chmodSync(hook, 0o755);
    expect(gitIn(dir, "config", "core.fsmonitor", hook).status).toBe(0);
    expect(run(dir, "--kind", "source-tree").code).toBe(0);
    expect(existsSync(marker)).toBe(false);
  });

  it("names a credential-shaped member of the manifest by its place in a schema error", () => {
    const dir = folder({ "fabric.source.json": { ...sourceManifest({ include: ["src/", "LICENSE"] }), [key]: true }, LICENSE: "x", "src/a.ts": "x" });
    for (const out of [run(dir, "--kind", "source-tree").out, run(dir, "--kind", "source-tree", "--json").out]) {
      expect(out).toContain("schema/additionalProperties");
      expect(out.split(key).length - 1).toBe(0);
    }
  });

  it("runs Git on the folder's own repository whatever Git location the environment names", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/a.ts": `"${key}"` });
    expect(gitIn(dir, "init", "-q").status).toBe(0);
    const other = folder({ "x.txt": "x" });
    expect(gitIn(other, "init", "-q").status).toBe(0);
    const saved = { dir: process.env.GIT_DIR, config: process.env.GIT_CONFIG_GLOBAL, common: process.env.GIT_COMMON_DIR };
    process.env.GIT_DIR = path.join(other, ".git");
    process.env.GIT_CONFIG_GLOBAL = path.join(other, "no-such-config");
    process.env.GIT_COMMON_DIR = path.join(other, ".git");
    try {
      expect(cells(run(dir, "--kind", "source-tree").out)).toEqual([["src/a.ts", "/files/2", "FAC-SEM-158"]]);
      expect(run(dir, "--kind", "source-tree").out).not.toContain("note/walk");
    } finally {
      if (saved.dir === undefined) delete process.env.GIT_DIR; else process.env.GIT_DIR = saved.dir;
      if (saved.config === undefined) delete process.env.GIT_CONFIG_GLOBAL; else process.env.GIT_CONFIG_GLOBAL = saved.config;
      if (saved.common === undefined) delete process.env.GIT_COMMON_DIR; else process.env.GIT_COMMON_DIR = saved.common;
    }
  });

  it("names the manifest for a finding about it, and a clean folder prints only the walk note", () => {
    const clean = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "terms", "src/main.ts": "x" });
    const result = run(clean, "--kind", "source-tree");
    expect(result.code).toBe(0);
    expect(found(result.out)).toEqual([]);
    const missing = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE", "docs/"] }), LICENSE: "terms", "src/main.ts": "x" });
    const missed = run(missing, "--kind", "source-tree");
    expect(missed.code).toBe(1);
    expect(found(missed.out)).toEqual([expect.stringMatching(/^fabric\.source\.json {2}\/manifest\/include\/2 {2}FAC-SEM-158 {2}missing: /)]);
  });

  it("refuses a folder without fabric.source.json, and reports a manifest that is not JSON or not a manifest, by its name", () => {
    const none = run(folder({ "README.md": "x" }), "--kind", "source-tree");
    expect(none.code).toBe(2);
    expect(none.out).toContain("usage error: --kind source-tree reads a folder's fabric.source.json; the folder holds none");
    const brokenDir = folder({ "fabric.source.json": "{", LICENSE: "x" });
    const broken = run(brokenDir, "--kind", "source-tree");
    expect(broken.code).toBe(1);
    expect(broken.out).toMatch(/^fabric\.source\.json {2}\/ {2}json {2}the file is not JSON/);
    expect(broken.out).not.toContain(brokenDir);
    for (const value of [JSON.stringify("x"), { format: "fabric-source/1", include: "src/" }, { format: "fabric-source/1", include: [3, "src/"] }]) {
      const result = run(folder({ "fabric.source.json": value, LICENSE: "x", "src/a.ts": "x" }), "--kind", "source-tree");
      expect(result.code, JSON.stringify(value)).toBe(1);
      expect(result.out, JSON.stringify(value)).toContain("fabric.source.json  ");
      expect(result.out, JSON.stringify(value)).toContain("schema/");
    }
  });

  it.skipIf(process.platform === "win32" || process.getuid?.() === 0)("reports a file or a folder of the source it cannot read as a usage error, by its path in the folder", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/a.ts": "x", "src/locked/b.ts": "x" });
    chmodSync(path.join(dir, "src/a.ts"), 0o000);
    chmodSync(path.join(dir, "src/locked"), 0o000);
    try {
      const result = run(dir, "--kind", "source-tree");
      expect(result.code).toBe(2);
      expect(result.out).toContain("usage error: cannot read src/a.ts: EACCES");
      expect(result.out).toContain("usage error: cannot read src/locked/: EACCES");
      expect(result.out).not.toContain(dir);
    } finally {
      chmodSync(path.join(dir, "src/a.ts"), 0o644);
      chmodSync(path.join(dir, "src/locked"), 0o755);
    }
    // A file or folder whose own name holds a finding, or an e-mail address (no finding in a path, never printed), is
    // named by its place, never by the name.
    const named = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/-Users-jdoe-notes.md": "x", "src/ok/.env/b.ts": "x", "src/to/someone@mail.org/b.ts": "x" });
    const locked = ["src/-Users-jdoe-notes.md", "src/ok/.env", "src/to/someone@mail.org"];
    for (const name of locked) chmodSync(path.join(named, name), 0o000);
    try {
      for (const git of [false, true]) {
        if (git) expect(gitIn(named, "init", "-q").status).toBe(0);
        const result = run(named, "--kind", "source-tree");
        expect(result.code).toBe(2);
        expect(result.out).toContain("usage error: cannot read <a path that may hold a finding, under src/>: EACCES");
        if (!git) {
          expect(result.out).toContain("usage error: cannot read <a path that may hold a finding, under src/ok/>: EACCES");
          expect(result.out).toContain("usage error: cannot read <a path whose name holds an e-mail address, under src/to/>: EACCES");
        }
        for (const value of ["jdoe", ".env", "mail.org", named]) expect(result.out).not.toContain(value);
      }
    } finally {
      chmodSync(path.join(named, "src/-Users-jdoe-notes.md"), 0o644);
      for (const name of locked.slice(1)) chmodSync(path.join(named, name), 0o755);
    }
  });

  it.skipIf(process.platform === "win32" || process.getuid?.() === 0)("prints no e-mail address held in a path, in a usage error or a document's name", () => {
    const address = ["jane.doe", "@", "acme.io"].join("");
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", [`src/${address}.md`]: "x" });
    chmodSync(path.join(dir, `src/${address}.md`), 0o000);
    try {
      const result = run(dir, "--kind", "source-tree");
      expect(result.code).toBe(2);
      expect(result.out).toContain("usage error: cannot read <a path whose name holds an e-mail address, under src/>: EACCES");
      expect(result.out).not.toContain("acme.io");
    } finally {
      chmodSync(path.join(dir, `src/${address}.md`), 0o644);
    }
    const doc = folder({ [`${address}.json`]: { manifest: { include: ["a.txt"] }, files: [{ path: "a.txt", text: "/home/jdoe" }] } });
    for (const out of [run(path.join(doc, `${address}.json`), "--kind", "source-tree").out, run(path.join(doc, `${address}.json`), "--kind", "source-tree", "--json").out]) {
      expect(out).toContain("<a path whose name holds an e-mail address, under .>");
      expect(out).not.toContain("acme.io");
    }
  });

  it("walks into a path of 129 to 256 code points outside the BMP and reads it", () => {
    const face = String.fromCodePoint(0x1f600);
    const name = `docs/${face.repeat(60)}/${face.repeat(60)}/${face.repeat(20)}.md`;
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["docs/", "LICENSE"] }), LICENSE: "x", [name]: "/home/jdoe" });
    const result = run(dir, "--kind", "source-tree");
    expect(result.code).toBe(1);
    expect(result.out).toContain("FAC-SEM-158");
    expect(result.out).toContain("home-path");
  });

  it.skipIf(process.platform === "win32" || process.getuid?.() === 0)("places a path whose segment holds an address followed by a colon, and never enters a folder outside the grammar", () => {
    const address = ["jane.doe", "@", "acme.io"].join("");
    expect(shownPath(`docs/${address}:x/a.md`)).toBe("<a path whose name holds an e-mail address, under docs/>");
    // A folder outside the path grammar (a ":") is not entered, so an unreadable one is no usage error.
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["docs/", "LICENSE"] }), LICENSE: "x", "docs/a.md": "x", [`docs/${address}:x/a.md`]: "x" });
    chmodSync(path.join(dir, `docs/${address}:x`), 0o000);
    try {
      const result = run(dir, "--kind", "source-tree");
      expect(result.code).toBe(0);
      expect(result.out).not.toContain("usage error");
      expect(result.out).not.toContain("acme.io");
    } finally {
      chmodSync(path.join(dir, `docs/${address}:x`), 0o755);
    }
  });

  it("prints the message of a file whose path holds an asset name or an RFC 2606 address as the tree check reads it", () => {
    const names = [["src/user", "@2x.png"].join(""), ["src/info", "@example.com"].join(""), ["src/ops", "@corp.example/f.ts"].join("")];
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", ...Object.fromEntries(names.map((name) => [name, "see /home/jdoe"])) });
    const messages = found(run(dir, "--kind", "source-tree").out).map((line) => line.split("  ").slice(0, 4));
    expect(messages.map((cells) => cells[0])).toEqual([...names].sort());
    for (const [file, , , message] of messages) expect(message).toMatch(new RegExp(`^${(file as string).replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")} line 1, column 11: home-path: `));
  });

  it("names a path-valued argument by its place when it holds an address before a colon, in each rule that prints one", () => {
    const address = ["jane.doe", "@", "acme.io"].join("");
    const store = `data/${address}:x`;
    const twice = sourceManifest({ include: ["src/", "LICENSE"], slots: [{ name: "A", kind: "store", purpose: "a", path: store }, { name: "B", kind: "store", purpose: "b", path: store }] });
    const dir = folder({ "fabric.source.json": twice, LICENSE: "x", "src/a.ts": "x" });
    const lone = folder({ "m.json": twice });
    // In a folder the manifest fails its schema (the path grammar has no `:`) and is reported alone; the rule runs on
    // the document named with its kind.
    const folderOut = run(dir, "--kind", "source-tree").out;
    expect(folderOut).toContain("schema/");
    expect(folderOut).not.toContain("declared twice");
    for (const out of [folderOut, run(path.join(lone, "m.json"), "--kind", "source-manifest").out]) expect(out).not.toContain("acme.io");
    expect(run(path.join(lone, "m.json"), "--kind", "source-manifest").out).toContain("store path slots[1].path is declared twice");
    const pair = folder({ "pair.json": { source: sourceManifest({ slots: [{ name: "D", kind: "store", purpose: "d", path: `db/${address}:y` }] }), package: { ...json("positive/fabric-package-agent.json"), secrets: [], state: [{ path: `st/${address}:z`, purpose: "s" }] } } });
    const out = run(path.join(pair, "pair.json"), "--kind", "source-package").out;
    expect(out).toContain("slots[0].path is not in the package's state[]");
    expect(out).toContain("state state[0] is no store slot of the source");
    expect(out).not.toContain("acme.io");
  });

  it("neither covers nor enters a path outside the grammar, and keeps an in-grammar path outside the BMP as source", () => {
    const index = includeIndex(["src/"]);
    expect(index.covers(`src/${"x".repeat(300)}`)).toBe(false);
    expect(index.reaches(`src/${"x".repeat(300)}/`)).toBe(false);
    const face = String.fromCodePoint(0x1f600);
    const astral = `src/${face.repeat(98)}/${face.repeat(98)}`;
    expect([...astral].length).toBe(201);
    expect(index.covers(astral)).toBe(true);
    expect(index.reaches(`src/${face.repeat(98)}/`)).toBe(true);
  });

  it.skipIf(process.platform === "win32" || process.getuid?.() === 0)("is no usage error for an unreadable folder whose path runs past the grammar", () => {
    const long = `src/${"d".repeat(200)}/${"e".repeat(100)}`;
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/a.ts": "x", [`${long}/f.ts`]: "x" });
    chmodSync(path.join(dir, long), 0o000);
    try {
      const result = run(dir, "--kind", "source-tree");
      expect(result.code).toBe(0);
      expect(result.out).not.toContain("usage error");
    } finally {
      chmodSync(path.join(dir, long), 0o755);
    }
  });

  it("reads a file whose own path is outside the grammar as no source, the same in a walk and in Git mode", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/a.ts": "x", "src/a:b": "/home/jdoe" });
    const walked = run(dir, "--kind", "source-tree");
    expect(gitIn(dir, "init", "-q").status).toBe(0);
    const tracked = run(dir, "--kind", "source-tree");
    expect(walked.code).toBe(0);
    expect(tracked.out).toBe(walked.out.split("\n").filter((line) => !line.includes("note/walk")).join("\n"));
    expect(tracked.out).toBe("");
  });

  it.skipIf(process.platform === "win32" || process.getuid?.() === 0)("is no usage error in Git mode for an unreadable folder outside the grammar", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/a.ts": "x", "src/x:y/f.ts": "x" });
    expect(gitIn(dir, "init", "-q").status).toBe(0);
    expect(gitIn(dir, "add", ".").status).toBe(0);
    chmodSync(path.join(dir, "src/x:y"), 0o000);
    try {
      const result = run(dir, "--kind", "source-tree");
      expect(result.code).toBe(0);
      expect(result.out).not.toContain("usage error");
    } finally {
      chmodSync(path.join(dir, "src/x:y"), 0o755);
    }
  });

  it("reads a pointer's member as a message's word, its trailing punctuation stripped", () => {
    const member = ["carol", "@", "corp.io:"].join("");
    const dir = folder({ "fabric.source.json": { [member]: {} } });
    for (const out of [run(path.join(dir, "fabric.source.json"), "--schema", "device-policy").out, run(path.join(dir, "fabric.source.json"), "--schema", "device-policy", "--json").out]) {
      expect(out).not.toContain("corp.io");
    }
    expect(shownPointer(`/${member}/x`)).toBe("/<a member whose name holds a finding>");
    // A member holding an address before a colon and more text is read with the path rule, as a path value is.
    const scoped = `${["carol", "@", "corp.io"].join("")}:x`;
    const other = folder({ "fabric.source.json": { scope: { [scoped]: {} }, [scoped]: 1 } });
    for (const out of [run(path.join(other, "fabric.source.json"), "--schema", "credential-request").out, run(path.join(other, "fabric.source.json"), "--schema", "credential-request", "--json").out]) {
      expect(out).not.toContain("corp.io");
    }
    expect(shownPointer(`/scope/${scoped}`)).toBe("/scope/<a member whose name holds a finding>");
  });

  it("puts no member name that holds a finding in a problem's path, and gives the closed source manifest no extension hint", () => {
    const home = ["/Users/", "jdoe", "/x"].join("");
    const nearMiss = "https://fabric.passioncode.ai/agent-contract/extension/service/0.1";
    const dir = folder({ "fabric.source.json": { ...sourceManifest({ include: ["src/", "LICENSE"] }), [key]: { extensions: { [nearMiss]: 1 } }, [home]: { extensions: { [nearMiss]: 1 } } }, LICENSE: "x", "src/a.ts": "x" });
    for (const out of [run(dir, "--kind", "source-tree").out, run(dir, "--kind", "source-tree", "--json").out]) {
      expect(out).not.toContain("hint/extension-key");
      expect(out).not.toContain("jdoe");
      for (let start = 0; start + 8 <= key.length; start += 1) expect(out).not.toContain(key.slice(start, start + 8));
    }
    expect(shownPointer("/slots/0/name")).toBe("/slots/0/name");
    expect(shownPointer(`/a/${key}/extensions`)).toBe("/a/<a member whose name holds a finding>");
    expect(shownPointer(`/${home.replace(/\//g, "~1")}/extensions`)).toBe("/<a member whose name holds a finding>");
    expect(shownPointer(`/cfg/API_KEY=${"Ab1".repeat(5)}/${"Cd2".repeat(9)}`)).toBe("/cfg/<a member whose name holds a finding>");
  });

  it("finds where strict JSON stops reading as JSON.parse refuses it, without its message", () => {
    const cases = ['{"a": /home/samx}', "{", "", "[1,]", '{"a" 1}', '"\\x"', '"\\u12G4"', "01", "-", "1.", "1e", "tru", "nul", "[1 2]", '{"a":1,}', '{"a":1} x', '"a\u0001"', '"a', "[", '{"a":[1,{"b":null}]}', " true ", "-0.5e+3", '"\\u00e9\\n"', "\ufeff{}", "{,}", "{}", " [ ] ", "false", "fals", '{"a":[]}'];
    for (const text of cases) {
      let valid = true;
      try { JSON.parse(text); } catch { valid = false; }
      const at = jsonErrorAt(text);
      expect(at === undefined, text).toBe(valid);
    }
    expect(jsonErrorAt('{"a": /home/samx}')).toBe(6);
    expect(jsonErrorAt("{")).toBe(1);
    expect(jsonErrorAt('{"a":1} x')).toBe(8);
    expect(jsonErrorAt("[".repeat(200_000))).toBeUndefined();
    expect(jsonErrorAt('"\\u12')).toBe(5);
  });

  it("prints no instance data in a schema or parse message of a source check, in either form", () => {
    const letters = "abcdefghijklmnopqrstuvwxyz".repeat(2).slice(0, 43);
    const runs = (text: string) => Array.from({ length: text.length - 7 }, (_, start) => text.slice(start, start + 8));
    const memberDir = folder({ "fabric.source.json": { ...sourceManifest({ include: ["src/", "LICENSE"] }), [`"d": "${letters}"`]: true }, LICENSE: "x", "src/a.ts": "x" });
    for (const out of [run(memberDir, "--kind", "source-tree").out, run(memberDir, "--kind", "source-tree", "--json").out]) {
      expect(out).toContain("has a member the schema does not define");
      for (const part of runs(letters)) expect(out).not.toContain(part);
    }
    const docDir = folder({ "doc.json": '{"a": /home/samx}' });
    for (const out of [run(path.join(docDir, "doc.json"), "--kind", "source-tree").out, run(path.join(docDir, "doc.json"), "--kind", "source-tree", "--json").out]) {
      expect(out).not.toContain("samx");
      expect(out).toContain("it stops reading at line 1, column");
    }
  });

  it("prints none of the credential, home-folder or address values a manifest holds, whatever member carries them", () => {
    const home = ["/Users/", "samx", "/notes"].join("");
    const address = ["someone", "@", "mail.org"].join("");
    const values = [key, home, address, `Bearer ${["abcdef", "1234567890xyz"].join("")}`];
    const manifests = values.flatMap((value) => [
      { ...sourceManifest({ include: ["src/", "LICENSE"] }), [value]: { extensions: { "https://fabric.passioncode.ai/agent-contract/extension/service/0.1": 1 } } },
      { ...sourceManifest({ include: ["src/", "LICENSE", value] }), description: value },
      { ...sourceManifest({ include: ["src/", "LICENSE"] }), unchecked: [{ path: value, reason: value }], publicAddresses: [value] },
      { ...sourceManifest({ include: ["src/", "LICENSE"] }), slots: [{ name: value, kind: "store", purpose: value, path: value }, { name: value, kind: "store", purpose: value, path: value }] },
      { ...sourceManifest({ include: ["src/", "LICENSE"] }), exclude: [value], binaries: [value], slots: [{ name: "A", kind: value, purpose: "p" }] }
    ]);
    const secretParts = (value: string) => (value === home ? ["samx"] : value === address ? [address, "someone@"] : Array.from({ length: value.length - 7 }, (_, start) => value.slice(start, start + 8)).filter((part) => /[0-9]/.test(part)));
    for (const manifest of manifests) {
      const dir = folder({ "fabric.source.json": manifest, LICENSE: "x", "src/a.ts": "x" });
      for (const out of [run(dir, "--kind", "source-tree").out, run(dir, "--kind", "source-tree", "--json").out]) {
        for (const value of values) for (const part of secretParts(value)) expect(out, `${JSON.stringify(manifest).slice(0, 80)} ${part}`).not.toContain(part);
      }
    }
  });

  it("checks the folder of a fabric.source.json named on its own, and names any other file by its basename", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/a.ts": `"${key}"` });
    const manifestRun = run(path.join(dir, "fabric.source.json"), "--kind", "source-tree");
    expect(manifestRun.code).toBe(1);
    expect(cells(manifestRun.out)).toEqual([["src/a.ts", "/files/2", "FAC-SEM-158"]]);
    expect(manifestRun.out).not.toContain(dir);
    const documentDir = folder({ "tree.json": { manifest: { include: ["a.txt"] }, files: [{ path: "a.txt", text: "/home/jdoe" }] }, "broken.json": "{" });
    const documentRun = run(path.join(documentDir, "tree.json"), "--kind", "source-tree");
    expect(documentRun.code).toBe(1);
    expect(documentRun.out).toMatch(/^tree\.json {2}\/files\/0 {2}FAC-SEM-158 {2}/);
    expect(documentRun.out).not.toContain(documentDir);
    const brokenRun = run(path.join(documentDir, "broken.json"), "--kind", "source-tree", "--json");
    expect(brokenRun.out).toContain("broken.json");
    expect(brokenRun.out).not.toContain(documentDir);
    const lockedDir = folder({ "locked.json": "{}" });
    if (process.platform !== "win32" && process.getuid?.() !== 0) {
      chmodSync(path.join(lockedDir, "locked.json"), 0o000);
      try {
        const lockedRun = run(path.join(lockedDir, "locked.json"), "--kind", "source-tree");
        expect(lockedRun.code).toBe(2);
        expect(lockedRun.out).toContain("usage error: cannot read locked.json: EACCES");
        expect(lockedRun.out).not.toContain(lockedDir);
      } finally {
        chmodSync(path.join(lockedDir, "locked.json"), 0o644);
      }
    }
  });

  it("keeps the caller's GIT_CEILING_DIRECTORIES: a plain folder inside a parent repository under that fence is walked", () => {
    const parent = folder({ "agent/fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), "agent/LICENSE": "x", "agent/src/a.ts": "const data = \"/home/jdoe\";" });
    expect(gitIn(parent, "init", "-q").status).toBe(0);
    const saved = process.env.GIT_CEILING_DIRECTORIES;
    process.env.GIT_CEILING_DIRECTORIES = realpathSync(parent);
    try {
      const result = run(path.join(parent, "agent"), "--kind", "source-tree");
      expect(lines(result.out).map((line) => line.split("  ").slice(0, 3))).toEqual([["src/a.ts", "/files/2", "FAC-SEM-158"], [".", "/", "note/walk"]]);
      expect(result.out).toContain("git ls-files refused the folder (exit 128)");
    } finally {
      if (saved === undefined) delete process.env.GIT_CEILING_DIRECTORIES; else process.env.GIT_CEILING_DIRECTORIES = saved;
    }
    // Without the fence the same folder is in the parent's work tree: Git mode, no note.
    expect(run(path.join(parent, "agent"), "--kind", "source-tree").out).not.toContain("note/walk");
  });

  it.skipIf(process.platform === "win32" || process.getuid?.() === 0)("names the folder itself as . when its walk cannot list it", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/a.ts": "x" });
    chmodSync(dir, 0o311);
    try {
      const result = run(dir, "--kind", "source-tree");
      expect(result.code).toBe(2);
      expect(result.out).toContain("usage error: cannot read .: EACCES");
      expect(result.out).not.toContain(dir);
    } finally {
      chmodSync(dir, 0o755);
    }
  }, 30_000);

  it.skipIf(process.platform === "win32")("names fabric.source.json, not the folder, when only the manifest cannot be reached", () => {
    const dir = folder({ LICENSE: "x", "src/a.ts": "x" });
    symlinkSync("fabric.source.json", path.join(dir, "fabric.source.json"));
    const result = run(dir, "--kind", "source-tree");
    expect(result.code).toBe(2);
    // An entry that lstat finds but that is no regular file (a link looping on itself) is "not a file".
    expect(result.out).toContain("usage error: cannot read fabric.source.json: not a file");
    expect(result.out).not.toContain("holds none");
    expect(result.out).not.toContain(dir);
  });

  it("names a source check's target that is not there by its basename, and any other by its path as before", () => {
    const parent = folder({ "x.txt": "x" });
    for (const [target, args, name] of [
      [path.join(parent, "no-such-agent"), ["--kind", "source-tree"], "no-such-agent"],
      [path.join(parent, "gone.json"), ["--kind", "source-manifest"], "gone.json"],
      [path.join(parent, "gone.json"), ["--kind", "source-package"], "gone.json"],
      [path.join(parent, "gone.json"), ["--schema", "fabric-source"], "gone.json"],
      [path.join(parent, "fabric.source.json"), [], "fabric.source.json"]
    ] as const) {
      const result = run(target, ...args);
      expect(result.code).toBe(2);
      expect(result.out).toContain(`usage error: cannot read ${name}: ENOENT`);
      expect(result.out).not.toContain(parent);
    }
    // A manifest named under --kind source-tree checks its folder, as the folder route does.
    const named = run(path.join(parent, "fabric.source.json"), "--kind", "source-tree");
    expect(named.code).toBe(2);
    expect(named.out).toContain("the folder holds none");
    expect(named.out).not.toContain(parent);
    // Outside a source check the full path, byte for byte as before DEC-0149.
    const gone = path.join(parent, "gone.json");
    expect(run(gone)).toEqual({ code: 2, out: `usage error: cannot read ${gone}: ENOENT\n` });
    expect(JSON.parse(run(gone, "--json").out).usage).toEqual([`cannot read ${gone}: ENOENT`]);
    expect(run(gone, "--schema", "service-descriptor").out).toContain(`cannot read ${gone}: ENOENT`);
  });

  it("names a document whose closest schema is the source manifest's by its basename when it cannot tell", () => {
    const target = one("thing.json", { format: "fabric-source/1" });
    for (const out of [run(target).out, run(target, "--json").out]) {
      expect(out).toContain("cannot tell which schema thing.json follows: its members match fabric-source.schema.json (missing include)");
      expect(out).not.toContain(path.dirname(target));
    }
    expect(run(target).code).toBe(2);
  });

  it("checks the pair in a folder under --kind source-package too, and drops the note that it holds none", () => {
    const manifest = JSON.parse(readFileSync(fixture("positive/fabric-source-agent.json"), "utf8").replace('"MAIL_OAUTH"', '"OTHER_KEY"')) as unknown;
    const dir = folder({ "fabric.source.json": manifest, "fabric.package.json": json("positive/fabric-package-agent.json") });
    const result = run(dir, "--kind", "source-package");
    expect(result.code).toBe(1);
    expect(result.out).toContain("the source's secret slot OTHER_KEY is not in the package's secrets[]");
    expect(result.out).not.toContain("note/pair");
    // A folder holding the manifest alone says so of the folder, and exits 0: no pair passed, none was checked.
    const alone = folder({ "fabric.source.json": manifest });
    const lone = run(alone, "--kind", "source-package");
    expect(lone.code).toBe(0);
    expect(lone.out).toContain("the folder holds no fabric.package.json beside fabric.source.json, so no pair was checked (FAC-SEM-160)");
    expect(lone.out).not.toContain("the document holds no");
  });

  it("notes a package beside the manifest that the folder run skipped, so no pair is read as passed", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["LICENSE"] }), "fabric.package.json": { not: "a package" } });
    const result = run(dir);
    expect(result.out).toContain("note/skipped");
    expect(result.out).toContain("the fabric.package.json beside fabric.source.json was not read as a package, so no pair was checked (FAC-SEM-160)");
  });

  it.skipIf(process.platform === "win32")("notes a package entry beside the manifest that was not read, by lstat, in both folder runs", () => {
    const manifest = sourceManifest({ include: ["LICENSE"] });
    const notRead = "the fabric.package.json beside fabric.source.json was not read as a package, so no pair was checked (FAC-SEM-160)";
    // A dangling link, in a plain run.
    const dangling = folder({ "fabric.source.json": manifest });
    symlinkSync(path.join(dangling, "gone.json"), path.join(dangling, "fabric.package.json"));
    expect(run(dangling).out).toContain(notRead);
    // A link to a real package, under --kind source-package: never read through it.
    const target = folder({ "p.json": json("positive/fabric-package-agent.json") });
    const linked = folder({ "fabric.source.json": manifest });
    symlinkSync(path.join(target, "p.json"), path.join(linked, "fabric.package.json"));
    const linkedRun = run(linked, "--kind", "source-package");
    const linkedOut = linkedRun.out;
    expect(linkedRun.code).toBe(2);
    expect(linkedOut).toContain(notRead);
    expect(linkedOut).not.toContain("holds no");
    // A FIFO and an unparseable file, under --kind source-package.
    const fifo = folder({ "fabric.source.json": manifest });
    expect(spawnSync("mkfifo", [path.join(fifo, "fabric.package.json")]).status).toBe(0);
    const unparseable = folder({ "fabric.source.json": manifest, "fabric.package.json": "{ not json" });
    for (const [dir, code] of [[fifo, 0], [unparseable, 1]] as const) {
      const result = run(dir, "--kind", "source-package");
      const out = result.out;
      expect(result.code, dir).toBe(code);
      expect(out, dir).toContain(notRead);
      expect(out, dir).not.toContain("holds no");
    }
  });

  it.skipIf(process.platform === "win32" || process.getuid?.() === 0)("names an unreadable source document in a folder run by its path in the folder", () => {
    const parent = folder({ "-Users-jdoe-x/fabric.source.json": sourceManifest({ include: ["LICENSE"] }), "-Users-jdoe-x/fabric.package.json": json("positive/fabric-package-agent.json") });
    const dir = path.join(parent, "-Users-jdoe-x");
    chmodSync(path.join(dir, "fabric.package.json"), 0o000);
    try {
      const out = run(dir, "--kind", "source-package").out;
      expect(out).toContain("cannot read fabric.package.json: EACCES");
      expect(out).toContain("the fabric.package.json beside fabric.source.json was not read as a package");
      // The usage line names the file by its path in the folder; a folder run with another source kind prints the
      // folder resolved to an absolute path in its file column, as the ordinary validator does.
      const usage = out.split("\n").filter((line) => line.startsWith("usage error:"));
      expect(usage).toEqual(["usage error: cannot read fabric.package.json: EACCES"]);
      expect(out).not.toContain("<a value the tree check reads");
    } finally {
      chmodSync(path.join(dir, "fabric.package.json"), 0o644);
    }
  });

  it("a folder named relatively under --kind source-package is printed resolved to an absolute path in its problem lines", () => {
    const parent = folder({ "agent/fabric.source.json": sourceManifest({ include: ["LICENSE"] }), "agent/LICENSE": "x", "agent/fabric.package.json": json("positive/fabric-package-agent.json") });
    const before = { cwd: process.env.INIT_CWD, event: process.env.npm_lifecycle_event };
    process.env.INIT_CWD = parent;
    process.env.npm_lifecycle_event = "validate";
    try {
      const result = run("./agent", "--kind", "source-package");
      expect(result.code).toBe(1);
      const problems = result.out.split("\n").filter((line) => line.includes("FAC-SEM-160"));
      expect(problems.length).toBeGreaterThan(0);
      for (const line of problems) expect(line.startsWith(path.join(parent, "agent", "fabric.source.json") + "  ")).toBe(true);
    } finally {
      for (const [name, value] of [["INIT_CWD", before.cwd], ["npm_lifecycle_event", before.event]] as const) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
    }
  });

  it.skipIf(process.platform === "win32" || process.getuid?.() === 0)("routes a named manifest under --kind source-tree as its folder: a dangling link, a loop, an unenterable folder", () => {
    const dangling = folder({ LICENSE: "x" });
    symlinkSync(path.join(dangling, "gone.json"), path.join(dangling, "fabric.source.json"));
    const loop = folder({ LICENSE: "x" });
    symlinkSync("fabric.source.json", path.join(loop, "fabric.source.json"));
    for (const dir of [dangling, loop]) {
      const result = run(path.join(dir, "fabric.source.json"), "--kind", "source-tree");
      expect(result.code).toBe(2);
      expect(result.out).toContain("cannot read fabric.source.json: not a file");
      expect(result.out).not.toContain(dir);
    }
    const locked = folder({ "fabric.source.json": sourceManifest({ include: ["LICENSE"] }), LICENSE: "x" });
    chmodSync(locked, 0o000);
    try {
      const result = run(path.join(locked, "fabric.source.json"), "--kind", "source-tree");
      expect(result.code).toBe(2);
      expect(result.out).toContain("cannot read .: EACCES");
      expect(result.out).not.toContain(locked);
    } finally {
      chmodSync(locked, 0o755);
    }
  });

  it.skipIf(process.platform === "win32")("never counts an unchecked LICENSE that is a link as a licence, walked or in Git", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"], unchecked: [{ path: "LICENSE", reason: "the terms live elsewhere" }] }), "src/a.ts": "x", "terms.txt": "terms" });
    symlinkSync("terms.txt", path.join(dir, "LICENSE"));
    for (const git of [false, true]) {
      if (git) expect(gitIn(dir, "init", "-q").status).toBe(0);
      expect(cells(run(dir, "--kind", "source-tree").out), String(git)).toEqual([["fabric.source.json", "/files", "FAC-SEM-159 (accepted)"]]);
    }
  });

  it.skipIf(process.platform === "win32")("routes a named manifest by lstat: a link to a folder is not a file; an absent folder is .", () => {
    const target = folder({ "x.txt": "x" });
    const dir = folder({ LICENSE: "x" });
    symlinkSync(target, path.join(dir, "fabric.source.json"));
    const linked = run(path.join(dir, "fabric.source.json"), "--kind", "source-tree");
    expect(linked.code).toBe(2);
    expect(linked.out).toContain("cannot read fabric.source.json: not a file");
    const absent = run(path.join(dir, "no-such-folder", "fabric.source.json"), "--kind", "source-tree");
    expect(absent.code).toBe(2);
    expect(absent.out).toContain("cannot read .: ENOENT");
    expect(absent.out).not.toContain(dir);
    // A folder that is a dangling link (`ln -s nowhere d`) is never a folder holding no manifest.
    symlinkSync("nowhere", path.join(dir, "d"));
    const dangling = run(path.join(dir, "d", "fabric.source.json"), "--kind", "source-tree");
    expect(dangling.code).toBe(2);
    expect(dangling.out).toContain("cannot read .: ENOENT");
    expect(dangling.out).not.toContain("holds none");
    // A file's "folder" is no folder: its named manifest reads ENOTDIR, never "holds none".
    writeFileSync(path.join(dir, "f"), "x");
    const notDir = run(path.join(dir, "f", "fabric.source.json"), "--kind", "source-tree");
    expect(notDir.code).toBe(2);
    expect(notDir.out).toContain("cannot read .: ENOTDIR");
    expect(notDir.out).not.toContain("holds none");
    expect(notDir.out).not.toContain(dir);
    // A link to a real folder with no manifest holds none, named as a folder or by the manifest's name in it.
    mkdirSync(path.join(dir, "empty"));
    symlinkSync("empty", path.join(dir, "link"));
    for (const target of [path.join(dir, "link"), path.join(dir, "link", "fabric.source.json")]) {
      const result = run(target, "--kind", "source-tree");
      expect(result.code, target).toBe(2);
      expect(result.out, target).toContain("the folder holds none");
    }
  });

  it("refuses, by the discriminator, a JSON object with neither manifest nor files passed as a tree document", () => {
    const message = "as a tree: it holds neither manifest nor files; a source manifest is named fabric.source.json, or pass its folder";
    // A valid manifest, an invalid one (no include) and any other such object, each under another name.
    for (const [name, value] of [["agent.json", sourceManifest({ include: ["LICENSE"] })], ["broken.json", { format: "fabric-source/1" }], ["other.json", { hello: "world" }]] as const) {
      const target = one(name, value);
      const result = run(target, "--kind", "source-tree");
      expect(result.code, name).toBe(2);
      expect(result.out, name).toContain(`cannot check ${name} ${message}`);
      expect(result.out, name).not.toContain(path.dirname(target));
    }
  });

  it.skipIf(process.platform === "win32")("reads a dangling link named on a source route as not a file, never as absent", () => {
    const dir = folder({ LICENSE: "x" });
    symlinkSync(path.join(dir, "gone.json"), path.join(dir, "fabric.source.json"));
    for (const args of [["--kind", "source-manifest"], ["--kind", "source-package"], [], ["--schema", "fabric-source"], ["--kind", "source-tree"]]) {
      const result = run(path.join(dir, "fabric.source.json"), ...args);
      expect(result.code, args.join(" ")).toBe(2);
      expect(result.out, args.join(" ")).toContain("cannot read fabric.source.json: not a file");
    }
  });

  it.skipIf(process.platform === "win32")("reads a dangling manifest link under --kind source-tree as not a file, never as none", () => {
    const dir = folder({ LICENSE: "x" });
    symlinkSync(path.join(dir, "gone.json"), path.join(dir, "fabric.source.json"));
    const result = run(dir, "--kind", "source-tree");
    expect(result.code).toBe(2);
    expect(result.out).toContain("cannot read fabric.source.json: not a file");
    expect(result.out).not.toContain("holds none");
  });

  it.skipIf(process.platform === "win32")("never follows a link at a listed path that is no source path, in Git mode", () => {
    const outside = folder({ ".git/HEAD": "ref: refs/heads/main", "x.ts": "x" });
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE", "vendor/lib/"] }), LICENSE: "x", "src/a.ts": "x", "vendor/x.txt": "x" });
    symlinkSync(outside, path.join(dir, "vendor/lib"));
    expect(gitIn(dir, "init", "-q").status).toBe(0);
    const result = run(dir, "--kind", "source-tree");
    expect(result.out).not.toContain("nested-repository");
  });

  it("refuses a second target under --kind source-tree, and under --kind source-package when a target is a folder", () => {
    const one = folder({ "fabric.source.json": sourceManifest({ include: ["LICENSE"] }), LICENSE: "x" });
    const two = folder({ "fabric.source.json": sourceManifest({ include: ["LICENSE"] }), LICENSE: "x" });
    for (const [kind, text] of [["source-tree", "--kind source-tree takes one target; run it once for each"], ["source-package", "--kind source-package takes one target when a target is a folder; run it once for each"]] as const) {
      const result = run(one, two, "--kind", kind);
      expect(result.code).toBe(2);
      expect(result.out).toContain(`usage error: ${text}`);
      expect(result.out).not.toContain(one);
    }
    // Documents named under --kind source-package are each a pair of their own, as before.
    const a = path.join(one, "fabric.source.json");
    const b = path.join(two, "fabric.source.json");
    expect(run(a, b, "--kind", "source-package").code).toBe(0);
  });

  it.skipIf(process.platform === "win32")("refuses a manifest that is not a regular file, never opening it", () => {
    const dir = folder({ LICENSE: "x" });
    expect(spawnSync("mkfifo", [path.join(dir, "fabric.source.json")]).status).toBe(0);
    const result = run(dir, "--kind", "source-tree");
    expect(result.code).toBe(2);
    expect(result.out).toContain("usage error: cannot read fabric.source.json: not a file");
    expect(result.out).not.toContain(dir);
  });

  it.skipIf(process.platform === "win32")("reads a named file outside a source check as before, and skips only a FIFO or a device in a folder run", () => {
    // A piped standard input is read, as on main.
    const tsx = path.join(root, "node_modules/tsx/dist/cli.mjs");
    const piped = spawnSync(process.execPath, [tsx, path.join(root, "src/validate-cli.ts"), "/dev/stdin"], { encoding: "utf8", input: readFileSync(fixture("positive/manifest-mcp.json"), "utf8"), timeout: 60_000 });
    expect(piped.status).toBe(0);
    // A device named is read: it holds no JSON.
    const empty = run("/dev/null");
    expect(empty.code).toBe(1);
    expect(empty.out).toContain("json  the file is not JSON");
    // In a folder run a link to a folder is read and its error reported; a link to a device and a FIFO are skipped with a note.
    const dir = folder({ "ok.json": json("positive/manifest-mcp.json"), "inner/x.txt": "x" });
    symlinkSync(path.join(dir, "inner"), path.join(dir, "dir.json"));
    symlinkSync("/dev/null", path.join(dir, "device.json"));
    expect(spawnSync("mkfifo", [path.join(dir, "pipe.json")]).status).toBe(0);
    const result = run(dir);
    expect(result.code).toBe(2);
    expect(result.out).toContain(`cannot read ${path.join(dir, "dir.json")}: EISDIR`);
    for (const name of ["device.json", "pipe.json"]) expect(result.out).toContain(`${path.join(dir, name)}  /  note/skipped  not a file: a FIFO, a socket or a device is never read`);
  }, 120_000);

  it.skipIf(process.platform === "win32")("never opens a device named on a source route, and reads an installed manifest that is one as none", () => {
    const dir = folder({ "x.txt": "x" });
    symlinkSync("/dev/null", path.join(dir, "device.json"));
    const named = run(path.join(dir, "device.json"), "--kind", "source-tree");
    expect(named.code).toBe(2);
    expect(named.out).toContain("cannot read device.json: not a file");
    const descriptor = { ...json("positive/service-descriptor.json"), fabricManifest: "/dev/null" };
    const pair = run(folder({ "example-agent.default.json": descriptor, "fabric-agent.json": json("positive/manifest-mcp.json") }));
    expect(pair.out).toContain("/dev/null is not a file, so no manifest was read");
  });

  it.skipIf(process.platform === "win32")("refuses a manifest that is a symbolic link on every source route, never reading through it", () => {
    const real = folder({ "real.json": sourceManifest({ include: ["LICENSE"] }) });
    const dir = folder({ LICENSE: "x" });
    symlinkSync(path.join(real, "real.json"), path.join(dir, "fabric.source.json"));
    const manifest = path.join(dir, "fabric.source.json");
    for (const args of [[dir, "--kind", "source-tree"], [manifest, "--kind", "source-tree"], [manifest], [manifest, "--kind", "source-manifest"], [dir, "--kind", "source-package"], [dir, "--kind", "source-manifest"]]) {
      const result = run(...args);
      expect(result.code, args.join(" ")).toBe(2);
      expect(result.out, args.join(" ")).toMatch(/cannot read (\S*\/)?fabric\.source\.json: not a file/);
    }
    // A plain folder run walks many agents (a monorepo): it skips the linked manifest with a note and checks the rest.
    const monorepo = folder({ "linked/LICENSE": "x", "real/fabric.source.json": sourceManifest({ include: ["LICENSE"] }) });
    symlinkSync(path.join(real, "real.json"), path.join(monorepo, "linked/fabric.source.json"));
    const plain = run(monorepo);
    expect(plain.code).toBe(0);
    expect(plain.out).toContain("note/skipped  not a file: a source manifest that is a symbolic link");
    expect(gitIn(dir, "init", "-q").status).toBe(0);
    expect(run(dir, "--kind", "source-tree").out).toContain("cannot read fabric.source.json: not a file");
  });

  it.skipIf(process.platform === "win32")("reads a FIFO under a source path as no source file, in a walk and in Git mode", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/pipe.txt", "LICENSE"] }), LICENSE: "x", "src/x.md": "x" });
    expect(spawnSync("mkfifo", [path.join(dir, "src/pipe.txt")]).status).toBe(0);
    for (const git of [false, true]) {
      if (git) expect(gitIn(dir, "init", "-q").status).toBe(0);
      expect(cells(run(dir, "--kind", "source-tree").out)).toEqual([["fabric.source.json", "/manifest/include/0", "FAC-SEM-158"]]);
    }
  });

  it.skipIf(process.platform === "win32")("never opens a FIFO on any route: no run waits on it", () => {
    // Every run goes in one child process, bounded by the parent's timeout: a FIFO that is read waits for a writer
    // forever, and a run blocked in a read would stop this test process too. The child times each run itself.
    const dir = folder({ LICENSE: "x", "other.json": { format: "fabric-source/1", include: ["LICENSE"] } });
    expect(spawnSync("mkfifo", [path.join(dir, "fabric.source.json")]).status).toBe(0);
    const named = folder({ "x.txt": "x" });
    expect(spawnSync("mkfifo", [path.join(named, "piped.json")]).status).toBe(0);
    const routes: string[][] = [
      [dir, "--kind", "source-package"],
      [dir, "--kind", "source-manifest"],
      [dir],
      [path.join(named, "piped.json"), "--kind", "source-tree"],
      [path.join(dir, "fabric.source.json")]
    ];
    const script = path.join(folder({ "x.txt": "x" }), "routes.ts");
    writeFileSync(script, [
      `import { main } from ${JSON.stringify(pathToFileURL(path.join(root, "src/validate-cli.ts")).href)};`,
      `const routes = ${JSON.stringify(routes)};`,
      "const results = routes.map((args) => { const start = performance.now(); const result = main(args); return { ...result, ms: performance.now() - start }; });",
      "process.stdout.write(JSON.stringify(results));"
    ].join("\n"));
    const child = spawnSync(process.execPath, [path.join(root, "node_modules/tsx/dist/cli.mjs"), script], { encoding: "utf8", timeout: 60_000 });
    expect(child.error).toBeUndefined();
    const results = JSON.parse(child.stdout) as Array<{ code: number; out: string; ms: number }>;
    expect(results).toHaveLength(routes.length);
    for (const [index, result] of results.entries()) expect(result.ms, routes[index]?.join(" ")).toBeLessThan(20_000);
    // A source kind's folder run refuses a FIFO manifest (exit 2); a plain folder run skips it with a note; a FIFO
    // named on a source route is a usage error.
    for (const index of [0, 1]) {
      expect(results[index]).toMatchObject({ code: 2 });
      expect(results[index]?.out).toContain("cannot read fabric.source.json: not a file");
    }
    expect(results[2]?.out).toContain("fabric.source.json  /  note/skipped  not a file");
    expect(results[2]?.code).toBe(0);
    expect(results[3]).toMatchObject({ code: 2 });
    expect(results[3]?.out).toContain("cannot read piped.json: not a file");
    expect(results[4]).toMatchObject({ code: 2 });
    expect(results[4]?.out).toContain("cannot read fabric.source.json: not a file");
    // A named source document is named by its basename (a folder run with another source kind echoes its folder).
    expect(results[3]?.out).not.toContain(named);
    expect(results[4]?.out).not.toContain(dir);
  }, 120_000);

  it.skipIf(process.platform === "win32" || process.getuid?.() === 0)("tells a folder or a manifest it cannot read from a missing manifest, naming neither by its path", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/a.ts": "x" });
    chmodSync(dir, 0o000);
    try {
      const locked = run(dir, "--kind", "source-tree");
      expect(locked.code).toBe(2);
      expect(locked.out).toContain("usage error: cannot read .: EACCES");
      expect(locked.out).not.toContain("holds none");
      expect(locked.out).not.toContain(dir);
    } finally {
      chmodSync(dir, 0o755);
    }
    chmodSync(path.join(dir, "fabric.source.json"), 0o000);
    try {
      const unread = run(dir, "--kind", "source-tree");
      expect(unread.code).toBe(2);
      expect(unread.out).toContain("usage error: cannot read fabric.source.json: EACCES");
      expect(unread.out).not.toContain("holds none");
      expect(unread.out).not.toContain(dir);
    } finally {
      chmodSync(path.join(dir, "fabric.source.json"), 0o644);
    }
  }, 30_000);

  it("names a path by the folder it is under when its name holds a finding, and the folder itself as .", () => {
    expect(shownPath("")).toBe(".");
    expect(shownPath("src/a.ts")).toBe("src/a.ts");
    expect(shownPath("-Users-jdoe-x.md")).toBe("<a path that may hold a finding, under .>");
    expect(shownPath("src/ok/-home-jdoe/b.ts")).toBe("<a path that may hold a finding, under src/ok/>");
    expect(shownPath("src/.env")).toBe("<a path that may hold a finding, under src/>");
    expect(shownPath(`docs/${["a", "@", "mail.org"].join("")}/x.md`)).toBe("<a path whose name holds an e-mail address, under docs/>");
    // A path reads an address as a line does: an asset's name, an example address and an SSH remote are none.
    const asset = ["assets/icon", "@2x.png"].join("");
    for (const name of [asset, "docs/someone@example.com/notes.md", "git@host:owner/repo"]) expect(shownPath(name)).toBe(name);
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["assets/", "LICENSE"] }), LICENSE: "x", [asset]: "/home/jdoe" });
    const out = run(dir, "--kind", "source-tree").out;
    expect(cells(out)).toEqual([[asset, "/files/1", "FAC-SEM-158"]]);
    expect(found(out)[0]).toContain(`${asset} line 1, column 7: home-path: `);
    // A credential that runs across a "/" shows no part of itself: the clean prefix stops before its first segment.
    const across = shownPath(`cfg/API_KEY=${"Ab1".repeat(5)}/${"Cd2".repeat(9)}/x.txt`);
    expect(across).toBe("<a path that may hold a finding, under cfg/>");
    expect(across).not.toContain("Ab1");
  });

  it("reads a long run per segment in a file's path, and never shows a part of a run across segments in a name", () => {
    // A path of ordinary names is no run, though the whole of it, `/` included, is 46 characters mixing cases and digits.
    const plain = "packages/CoreLib2/src/Components/Button3/Index.tsx";
    const home = ["/Us", "ers/jdoe/notes"].join("");
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["packages/", "LICENSE"] }), LICENSE: "x", [plain]: `see ${home}` });
    const out = run(dir, "--kind", "source-tree").out;
    expect(cells(out)).toEqual([[plain, "/files/2", "FAC-SEM-158"]]);
    expect(found(out)[0]).toContain(`${plain} line 1, column 12: home-path: `);
    // The document form names it by its path too: the lead is not masked again.
    const document = one("tree.json", { manifest: { format: "fabric-source/1", include: ["packages/", "LICENSE"] }, files: [{ path: "LICENSE", text: "x" }, { path: plain, text: `see ${home}` }] });
    const documentOut = run(document, "--kind", "source-tree").out;
    expect(documentOut).toContain(`${plain} line 1, column 12: home-path: `);
    expect(documentOut).not.toContain(path.dirname(document));
    // Five segments of 12 characters mixing cases and digits, assembled here: a name shows none of them.
    const segments = Array.from({ length: 5 }, (_, index) => `Ab${index}Cd${index}Ef${index}Gh${index}`);
    const split = shownPath(`src/${segments.join("/")}.ts`);
    expect(split).toBe("<a path that may hold a finding, under src/>");
    for (const segment of segments) expect(split).not.toContain(segment);
    // A provider key split at a "/" shows no part of itself either.
    const key = ["sk", "-", "Ab12Cd34Ef56"].join("");
    const rest = "Gh78Ij90Kl12Mn34Op56Qr78";
    const keyed = shownPath(`docs/${key}/${rest}.md`);
    expect(keyed).toBe("<a path that may hold a finding, under docs/>");
    for (const part of [key, rest, "sk-"]) expect(keyed).not.toContain(part);
  });

  it("reads at most 512 UTF-16 units of a name, so naming grows linearly with its length", () => {
    // Many segments of a run that crosses them: each prefix and each segment would be read again without the cap.
    const name = (count: number) => `src/${Array.from({ length: count }, (_, index) => `Ab${index % 10}Cd`).join("/")}.ts`;
    expect(name(103).length).toBeGreaterThan(512);
    expect(shownPath(name(103))).toBe("<a path that may hold a finding, under .>");
    expect(longRunAt(`${"a".repeat(600)}${"Ab1".repeat(20)}`)).toBe(-1);
    const cpu = () => { const used = process.cpuUsage(); return (used.user + used.system) / 1000; };
    const timed = (text: string): number => Math.min(...[0, 1, 2].map(() => {
      const started = cpu();
      let calls = 0;
      do { shownPath(text); longRunAt(text); calls += 1; } while (cpu() - started < 100);
      return (cpu() - started) / calls;
    }));
    const small = timed(name(4_000));
    const large = timed(name(64_000));
    // Sixteen times the input: linear work grows about sixteen times, quadratic work about 256 times.
    expect(large / Math.max(small, 0.001)).toBeLessThan(64);
  }, 120_000);

  it("prints a clean path leading a binary or nested-repository finding whole, in a folder and in a document", () => {
    const image = "packages/CoreLib2/src/Components/Button3/Image.png";
    const manifest = sourceManifest({ include: ["packages/", "LICENSE"] });
    const binary = folder({ "fabric.source.json": manifest, LICENSE: "x", [image]: "\u0000png" });
    const nested = folder({ "fabric.source.json": manifest, LICENSE: "x", [`${image}/.git/HEAD`]: "ref: refs/heads/main", [`${image}/a.ts`]: "x" });
    const documentOf = (entry: Record<string, unknown>) => one("tree.json", { manifest, files: [{ path: "LICENSE", text: "x" }, { path: image, ...entry }] });
    for (const [out, kind] of [
      [run(binary, "--kind", "source-tree").out, "binary"],
      [run(nested, "--kind", "source-tree").out, "nested-repository"],
      [run(documentOf({ binary: true }), "--kind", "source-tree").out, "binary"],
      [run(documentOf({ nestedRepository: true }), "--kind", "source-tree").out, "nested-repository"]
    ] as const) {
      expect(found(out).some((line) => line.includes(`${image}: ${kind}: `)), `${kind}: ${out}`).toBe(true);
      expect(out).not.toContain("<a value the tree check reads");
    }
  });

  it("reads a line holding a run of millions of characters without throwing, and always prints one JSON document", () => {
    const base64 = "QUJDRGVmZ2gxMjM0".repeat(375_000);
    const mixed = "Ab1Cd2Ef3Gh4".repeat(500_000);
    expect(base64.length).toBe(6_000_000);
    const wasm = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/wasm.ts": `export const wasm = "${base64}";` });
    const quiet = run(wasm, "--kind", "source-tree", "--json");
    expect(quiet.code).toBe(0);
    expect((JSON.parse(quiet.out) as { problems: unknown[] }).problems).toEqual([]);
    const token = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/token.ts": `token = "${mixed}"` });
    const loud = run(token, "--kind", "source-tree", "--json");
    expect(loud.code).toBe(1);
    const problems = (JSON.parse(loud.out) as { problems: Array<{ rule: string; message: string }> }).problems;
    expect(problems.map((problem) => problem.rule)).toEqual(["FAC-SEM-158"]);
    expect(problems[0]?.message).toContain("line 1, column 10: credential");
    expect(loud.out).not.toContain(mixed.slice(0, 40));
  }, 180_000);

  it("reports a source check that throws as a usage error naming the error only, in one JSON document", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/a.ts": "x" });
    expect(gitIn(dir, "init", "-q").status).toBe(0);
    const saved = gitLimits.maxBuffer;
    gitLimits.maxBuffer = -1;
    try {
      const result = run(dir, "--kind", "source-tree", "--json");
      expect(result.code).toBe(2);
      expect(JSON.parse(result.out)).toEqual({ files: [], problems: [], notes: [], usage: ["cannot check .: RangeError"] });
    } finally {
      gitLimits.maxBuffer = saved;
    }
  });

  it("splits what Git lists on NUL, and counts a name that is not UTF-8 by its position, never decoding it", () => {
    const listed = Buffer.concat([Buffer.from("LICENSE\0src/a.ts\0"), Buffer.from([0x73, 0x72, 0x63, 0x2f, 0xff, 0x2e, 0x74, 0x73, 0]), Buffer.from("src/inner/\0src/b.ts")]);
    expect(gitNames(listed)).toEqual({ names: ["LICENSE", "src/a.ts", "src/inner/", "src/b.ts"], unreadable: [2], folders: ["src"] });
    expect(gitNames(Buffer.alloc(0))).toEqual({ names: [], unreadable: [], folders: [] });
    expect(gitNames(Buffer.from("a\0\0b\0"))).toEqual({ names: ["a", "b"], unreadable: [], folders: [] });
    // A folder that does not decode stops the leading folders.
    expect(gitNames(Buffer.concat([Buffer.from([0x61, 0x2f, 0xff, 0x2f, 0x62, 0]), Buffer.from([0xff, 0])]))).toEqual({ names: [], unreadable: [0, 1], folders: ["a", ""] });
    // `--stage` records: only mode 160000 is a gitlink; a name that is not UTF-8 is skipped.
    const object = "0".repeat(40);
    const staged = Buffer.concat([Buffer.from(`100644 ${object} 0\tsrc/a.ts\u0000160000 ${object} 0\tsrc/lib\u0000\u0000no-tab\u0000160000 ${object} 0\t`), Buffer.from([0xff, 0]), Buffer.from(`160000 ${object} 0\tlast`)]);
    expect(gitlinkNames(staged)).toEqual(["src/lib", "last"]);
  });

  it.skipIf(process.platform === "win32")("reports a name Git lists that is not UTF-8 only where its folder lies in the source as a whole", () => {
    // A git that lists what the test sets, a name that is not UTF-8 among it: a real file system may refuse such a name.
    const bin = folder({ git: "#!/bin/sh\nfor a in \"$@\"; do case \"$a\" in ls-files) printf \"$FAKE_LIST\"; exit 0;; check-ignore) exit 1;; esac; done\nexit 1\n" });
    chmodSync(path.join(bin, "git"), 0o755);
    const saved = { path: process.env.PATH, list: process.env.FAKE_LIST };
    process.env.PATH = bin;
    const probe = (manifest: Record<string, unknown>, files: Record<string, string>, list: string[]) => {
      process.env.FAKE_LIST = list.map((name) => `${name}\\000`).join("");
      return run(folder({ "fabric.source.json": manifest, LICENSE: "x", ...files }), "--kind", "source-tree");
    };
    try {
      for (const [manifest, files, list] of [
        [sourceManifest({ include: ["src/", "LICENSE"] }), { "src/a.ts": "x" }, ["LICENSE", "src/a.ts", "outside/\\377.txt"]],
        [sourceManifest({ include: ["src/a/", "LICENSE"] }), { "src/a/k.ts": "x" }, ["LICENSE", "src/a/k.ts", "src/\\377/x.ts"]],
        [sourceManifest({ include: ["src/a.ts", "LICENSE"] }), { "src/a.ts": "x" }, ["LICENSE", "src/a.ts", "src/\\377.txt"]],
        [sourceManifest({ include: ["src/", "LICENSE"], exclude: ["src/vendor/"] }), { "src/a.ts": "x" }, ["LICENSE", "src/a.ts", "src/vendor/\\377.txt"]]
      ] as const) {
        expect(probe(manifest, files, [...list]), list[2]).toEqual({ code: 0, out: "" });
      }
      const inside = probe(sourceManifest({ include: ["src/", "LICENSE"] }), { "src/a.ts": "x" }, ["LICENSE", "src/a.ts", "src/\\377.txt"]);
      expect(inside.code).toBe(2);
      expect(inside.out).toContain("usage error: cannot read the name Git listed at position 2: it is not UTF-8");
    } finally {
      process.env.PATH = saved.path;
      if (saved.list === undefined) delete process.env.FAKE_LIST;
      else process.env.FAKE_LIST = saved.list;
    }
  });

  it.skipIf(process.platform === "win32")("never reads an untracked name shaped like an index entry as a gitlink", () => {
    const crafted = `160000 ${"0".repeat(40)} 0\tsrc`;
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/a/k.ts": "x", [`${crafted}/a`]: "x" });
    expect(gitIn(dir, "init", "-q").status).toBe(0);
    const result = run(dir, "--kind", "source-tree");
    expect(result).toEqual({ code: 0, out: "" });
  });

  it.skipIf(process.platform === "win32")("walks with a note when only the gitlink listing fails, never reading no gitlinks", () => {
    const bin = folder({ git: "#!/bin/sh\nfor a in \"$@\"; do case \"$a\" in --stage) exit 3;; esac; done\nfor a in \"$@\"; do case \"$a\" in ls-files) printf 'LICENSE\\000src/a.ts\\000'; exit 0;; check-ignore) exit 1;; esac; done\nexit 1\n" });
    chmodSync(path.join(bin, "git"), 0o755);
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/a.ts": "x" });
    const saved = process.env.PATH;
    process.env.PATH = bin;
    try {
      const result = run(dir, "--kind", "source-tree");
      expect(result.code).toBe(0);
      expect(result.out).toContain("note/walk  git ls-files --stage refused the folder (exit 3), so the folder's files were walked");
    } finally {
      process.env.PATH = saved;
    }
  });

  it.skipIf(process.platform === "win32")("says nothing of a name Git listed that is not UTF-8 when the run walks after all", () => {
    const bin = folder({ git: "#!/bin/sh\nfor a in \"$@\"; do case \"$a\" in --stage) exit 3;; esac; done\nfor a in \"$@\"; do case \"$a\" in ls-files) printf 'LICENSE\\000src/a.ts\\000src/\\377.txt\\000'; exit 0;; check-ignore) exit 1;; esac; done\nexit 1\n" });
    chmodSync(path.join(bin, "git"), 0o755);
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/a.ts": "x" });
    const saved = process.env.PATH;
    process.env.PATH = bin;
    try {
      const result = run(dir, "--kind", "source-tree");
      expect(result.code).toBe(0);
      expect(result.out).toContain("note/walk");
      expect(result.out).not.toContain("position");
    } finally {
      process.env.PATH = saved;
    }
  });

  it.skipIf(process.platform === "win32")("walks with a note when the gitlink listing times out or cannot run", () => {
    // A git that answers the first listing at once and the gitlink listing late, or with more than the buffer takes.
    const bin = folder({ git: "#!/bin/sh\nfor a in \"$@\"; do case \"$a\" in --stage) if [ \"$FAKE_STAGE\" = slow ]; then /bin/sleep 3; fi; /usr/bin/head -c 8192 /dev/zero; exit 0;; esac; done\nfor a in \"$@\"; do case \"$a\" in ls-files) printf 'LICENSE\\000src/a.ts\\000'; exit 0;; check-ignore) exit 1;; esac; done\nexit 1\n" });
    chmodSync(path.join(bin, "git"), 0o755);
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/a.ts": "x" });
    const saved = { path: process.env.PATH, stage: process.env.FAKE_STAGE, limits: { ...gitLimits } };
    process.env.PATH = bin;
    try {
      process.env.FAKE_STAGE = "slow";
      gitLimits.timeoutMs = 1000;
      expect(run(dir, "--kind", "source-tree").out).toContain("note/walk  git did not answer within 1 s");
      process.env.FAKE_STAGE = "big";
      gitLimits.timeoutMs = saved.limits.timeoutMs;
      gitLimits.maxBuffer = 1024;
      expect(run(dir, "--kind", "source-tree").out).toContain("note/walk  git ls-files --stage could not run (ENOBUFS)");
    } finally {
      process.env.PATH = saved.path;
      if (saved.stage === undefined) delete process.env.FAKE_STAGE;
      else process.env.FAKE_STAGE = saved.stage;
      Object.assign(gitLimits, saved.limits);
    }
  }, 60_000);

  it("states a listed path that is no source path only when it may be nested, and finds a gitlink under a folder that is gone", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE", "vendor/lib/", "gone/sub/"] }), LICENSE: "x", "src/a.ts": "x", "vendor/lib": "a file Git tracks where a folder is named" });
    expect(gitIn(dir, "init", "-q").status).toBe(0);
    expect(gitIn(dir, "add", "LICENSE", "vendor/lib").status).toBe(0);
    expect(gitIn(dir, "commit", "-qm", "a").status).toBe(0);
    const head = gitIn(dir, "rev-parse", "HEAD").stdout.trim();
    expect(gitIn(dir, "update-index", "--add", "--cacheinfo", `160000,${head},gone/sub`).status).toBe(0);
    const result = run(dir, "--kind", "source-tree");
    // `vendor/lib` is a file where an include names a folder: not nested, not source, never stated; `gone/sub` is a
    // gitlink whose folder is gone, and is still a nested repository.
    // An include naming only a nested repository reads as missing too.
    expect(cells(result.out)).toEqual([["gone/sub", "/files/2", "FAC-SEM-158"], ["fabric.source.json", "/manifest/include/2", "FAC-SEM-158"], ["fabric.source.json", "/manifest/include/3", "FAC-SEM-158"]]);
    expect(result.out).toContain("nested-repository");
  });

  it.skipIf(process.platform === "win32")("reads a gitlink as nested whatever sits above it: a file or a symbolic link", () => {
    for (const above of ["file", "link"] as const) {
      const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/k.ts": "x", "other/x.ts": "x" });
      expect(gitIn(dir, "init", "-q").status).toBe(0);
      expect(gitIn(dir, "add", "LICENSE").status).toBe(0);
      expect(gitIn(dir, "commit", "-qm", "a").status).toBe(0);
      const head = gitIn(dir, "rev-parse", "HEAD").stdout.trim();
      expect(gitIn(dir, "update-index", "--add", "--cacheinfo", `160000,${head},src/a/b/c`).status).toBe(0);
      if (above === "file") writeFileSync(path.join(dir, "src/a"), "a file above the gitlink");
      else symlinkSync(path.join(dir, "other"), path.join(dir, "src/a"));
      const result = run(dir, "--kind", "source-tree");
      expect(result.code, above).toBe(1);
      expect(found(result.out).filter((line) => line.includes("nested-repository")).map((line) => line.split("  ")[0]), above).toEqual(["src/a/b/c"]);
    }
  });

  it.skipIf(process.platform === "win32" || process.getuid?.() === 0)("never enters a folder an exclude folder names, so an unreadable one is no usage error", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"], exclude: ["src/cache/"] }), LICENSE: "x", "src/a.ts": "x", "src/cache/x.bin": "x" });
    chmodSync(path.join(dir, "src/cache"), 0o000);
    try {
      const result = run(dir, "--kind", "source-tree");
      expect(result.code).toBe(0);
      expect(found(result.out)).toEqual([]);
    } finally {
      chmodSync(path.join(dir, "src/cache"), 0o755);
    }
  });

  it("reads a path the index records as a gitlink as a nested repository, even when a file sits there now", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/a.ts": "x" });
    expect(gitIn(dir, "init", "-q").status).toBe(0);
    expect(gitIn(dir, "add", "LICENSE").status).toBe(0);
    expect(gitIn(dir, "commit", "-qm", "a").status).toBe(0);
    const head = gitIn(dir, "rev-parse", "HEAD").stdout.trim();
    expect(gitIn(dir, "update-index", "--add", "--cacheinfo", `160000,${head},src/lib`).status).toBe(0);
    writeFileSync(path.join(dir, "src/lib"), "a file now");
    const result = run(dir, "--kind", "source-tree");
    expect(result.code).toBe(1);
    expect(cells(result.out)).toEqual([["src/lib", "/files/3", "FAC-SEM-158"]]);
    expect(result.out).toContain("nested-repository");
  });

  it("reports a manifest that fails its schema alone: its rules and the tree run once it validates", () => {
    const dir = folder({ "fabric.source.json": { ...sourceManifest({ include: ["src/", "LICENSE"] }), extra: true, slots: [{ name: "A", kind: "config", purpose: "a" }, { name: "A", kind: "config", purpose: "b" }] }, LICENSE: "x", "src/a.ts": `"${key}"` });
    const result = run(dir, "--kind", "source-tree");
    expect(result.code).toBe(1);
    expect(found(result.out).map((line) => line.split("  ")[2])).toEqual(["schema/additionalProperties"]);
  });

  it("reads the manifest in Git mode even when .gitignore lists it", () => {
    const dir = folder({
      "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"], unchecked: [{ path: "src/x.ts", reason: `uses ${key}` }] }),
      ".gitignore": "fabric.source.json\n",
      LICENSE: "x",
      "src/a.ts": "x",
      "src/x.ts": "x"
    });
    expect(gitIn(dir, "init", "-q").status).toBe(0);
    const result = run(dir, "--kind", "source-tree");
    expect(result.code).toBe(1);
    expect(cells(result.out)).toEqual([["fabric.source.json", "/files/1", "FAC-SEM-158"]]);
    expect(result.out).not.toContain(key);
  });

  it("reports a gitlink whose folder is gone as a nested repository", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/a.ts": "x" });
    expect(gitIn(dir, "init", "-q").status).toBe(0);
    expect(gitIn(dir, "add", "LICENSE").status).toBe(0);
    expect(gitIn(dir, "commit", "-qm", "a").status).toBe(0);
    const head = gitIn(dir, "rev-parse", "HEAD").stdout.trim();
    expect(gitIn(dir, "update-index", "--add", "--cacheinfo", `160000,${head},src/gone`).status).toBe(0);
    const result = run(dir, "--kind", "source-tree");
    expect(result.code).toBe(1);
    expect(cells(result.out)).toEqual([["src/gone", "/files/3", "FAC-SEM-158"]]);
    expect(result.out).toContain("nested-repository");
  });

  it.skipIf(process.platform === "win32")("reads only the probe of a large binary file listed in binaries", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"], binaries: ["src/disk.img"] }), LICENSE: "x", "src/a.ts": "x" });
    // A sparse file of 3 GiB, all NUL: larger than one read can hold, and taking no space on disk.
    const image = path.join(dir, "src/disk.img");
    writeFileSync(image, "");
    truncateSync(image, 3 * 1024 ** 3);
    const result = run(dir, "--kind", "source-tree");
    expect(result.code).toBe(0);
    expect(found(result.out)).toEqual([]);
    rmSync(image);
  });

  it("reads a tracked file replaced by a folder as no nested repository, and the files under it", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/sub": "x", "src/a.ts": "x" });
    expect(gitIn(dir, "init", "-q").status).toBe(0);
    expect(gitIn(dir, "add", "src/sub").status).toBe(0);
    expect(gitIn(dir, "commit", "-qm", "a").status).toBe(0);
    rmSync(path.join(dir, "src/sub"));
    mkdirSync(path.join(dir, "src/sub"));
    writeFileSync(path.join(dir, "src/sub/b.ts"), `"${key}"`);
    const result = run(dir, "--kind", "source-tree");
    expect(result.out).not.toContain("nested-repository");
    expect(cells(result.out)).toEqual([["src/sub/b.ts", "/files/3", "FAC-SEM-158"]]);
  });

  it.skipIf(process.platform === "win32")("reads a FIFO at an unchecked path as no source file, in a walk and in Git mode", () => {
    const dir = folder({
      "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE", "src/data.json"], unchecked: [{ path: "LICENSE", reason: "a licence" }, { path: "src/data.json", reason: "synthetic data" }] }),
      "src/a.ts": "x"
    });
    for (const name of ["LICENSE", "src/data.json"]) expect(spawnSync("mkfifo", [path.join(dir, name)]).status).toBe(0);
    for (const git of [false, true]) {
      if (git) expect(gitIn(dir, "init", "-q").status).toBe(0);
      const result = run(dir, "--kind", "source-tree");
      expect(result.code).toBe(1);
      expect(cells(result.out)).toEqual([["fabric.source.json", "/manifest/include/1", "FAC-SEM-158"], ["fabric.source.json", "/manifest/include/2", "FAC-SEM-158"], ["fabric.source.json", "/files", "FAC-SEM-159 (accepted)"]]);
    }
  });

  it.runIf(process.platform === "linux")("reports a file whose name is not UTF-8 in Git mode as a usage error, by its position in Git's list", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "src/a.ts": "x" });
    writeFileSync(Buffer.concat([Buffer.from(path.join(dir, "src/")), Buffer.from([0xff, 0x2e, 0x74, 0x73])]), "x");
    expect(gitIn(dir, "init", "-q").status).toBe(0);
    const result = run(dir, "--kind", "source-tree");
    expect(result.code).toBe(2);
    expect(result.out).toMatch(/usage error: cannot read the name Git listed at position \d+: it is not UTF-8/);
  });

  it("quotes no value a manifest error would carry: a schema error masks it, a parse error gives its position only", () => {
    const at = ["someone", "@", "mail.org"].join("");
    const home = ["/Users/", "jdoe"].join("");
    const homeDir = folder({ "fabric.source.json": { ...sourceManifest({ include: ["src/", "LICENSE"] }), [home]: true }, LICENSE: "x", "src/a.ts": "x" });
    const mailDir = folder({ "fabric.source.json": { ...sourceManifest({ include: ["src/", "LICENSE"] }), [at]: 1 }, LICENSE: "x", "src/a.ts": "x" });
    const brokenDir = folder({ "fabric.source.json": `{"format": "fabric-source/1", "description": "${key} ${home}" x`, LICENSE: "x", "src/a.ts": "x" });
    for (const dir of [homeDir, mailDir, brokenDir]) {
      for (const out of [run(dir, "--kind", "source-tree").out, run(dir, "--kind", "source-tree", "--json").out]) {
        expect(out).toContain("fabric.source.json");
        for (const value of ["jdoe", "someone", "mail.org", dir]) expect(out).not.toContain(value);
        for (let start = 0; start + 8 <= key.length; start += 1) expect(out).not.toContain(key.slice(start, start + 8));
      }
    }
    expect(run(brokenDir, "--kind", "source-tree").out).toMatch(/fabric\.source\.json {2}\/ {2}json {2}the file is not JSON: it stops reading at line 1, column \d+/);
    // An empty file stops at its start; one nested too deep to read again says only that it is not JSON.
    const empty = run(folder({ "fabric.source.json": "", LICENSE: "x" }), "--kind", "source-tree");
    expect(empty.code).toBe(1);
    expect(empty.out).toContain("the file is not JSON: it stops reading at line 1, column 1");
    const deep = run(folder({ "fabric.source.json": "[".repeat(200_000), LICENSE: "x" }), "--kind", "source-tree");
    expect(deep.code).toBe(1);
    expect(deep.out).toMatch(/fabric\.source\.json {2}\/ {2}json {2}the file is not JSON(?!:)/);
  });

  it("quotes no credential that runs across a space in a manifest member or a slot's name", () => {
    const member = ["abcdef", "1234567890xyz"].join("");
    const slot = ["abcdef", "1234567890qq"].join("");
    const name = `x Bearer ${slot}`;
    const dir = folder({
      "fabric.source.json": { ...sourceManifest({ include: ["src/", "LICENSE"] }), [`Authorization: Bearer ${member}`]: true, slots: [{ name, kind: "config", purpose: "a" }, { name, kind: "config", purpose: "b" }] },
      LICENSE: "x",
      "src/a.ts": "x"
    });
    // The manifest fails its schema, so the folder run reports that alone; the rule's message is read on the document.
    for (const out of [run(dir, "--kind", "source-tree").out, run(dir, "--kind", "source-tree", "--json").out]) {
      expect(out).toContain("schema/additionalProperties");
      expect(out).not.toContain("declared twice");
      expect(out).not.toContain(member);
      expect(out).not.toContain(slot);
    }
    const ruled = run(path.join(dir, "fabric.source.json"), "--kind", "source-manifest").out;
    expect(ruled).toContain("slot slots[1] is declared twice");
    expect(ruled).not.toContain(member);
    expect(ruled).not.toContain(slot);
  });

  it("counts a repository nested outside the source in neither mode, so files[<index>] stays the same", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"] }), LICENSE: "x", "aaa/lib.ts": "x", "src/-Users-jdoe-x.md": "x" });
    expect(gitIn(path.join(dir, "aaa"), "init", "-q").status).toBe(0);
    const walkedOut = run(dir, "--kind", "source-tree").out;
    // LICENSE (0), fabric.source.json (1), src/-Users-jdoe-x.md (2): aaa/ is no source, so it takes no index.
    expect(cells(walkedOut)).toEqual([["files[2]", "/files/2/path", "FAC-SEM-158"]]);
    expect(gitIn(dir, "init", "-q").status).toBe(0);
    const gitOut = run(dir, "--kind", "source-tree").out;
    expect(gitOut).not.toContain("note/walk");
    expect(cells(gitOut)).toEqual(cells(walkedOut));
  });

  it("walks a folder only when an include path reaches into it or covers it", () => {
    const dir = folder({ "fabric.source.json": sourceManifest({ include: ["LICENSE", "skills/digest/SKILL.md", ".claude-plugin/plugin.json"] }), LICENSE: "x", "skills/digest/SKILL.md": "x", ".claude-plugin/plugin.json": "{}", "skills/other/SKILL.md": `"${key}"`, "src/a.ts": `"${key}"`, ".cache/a.ts": `"${key}"` });
    const result = run(dir, "--kind", "source-tree");
    expect(result.code).toBe(0);
    expect(found(result.out)).toEqual([]);
  });

  it("prints no member of a package's state[] path that is not a string, in the pair check", () => {
    const pkg = json("positive/fabric-package-agent.json");
    const synthetic = ["sk", "-", "Q7r".repeat(8)].join("");
    const withArray = { ...pkg, state: [{ path: ["x", synthetic], purpose: "p" }] };
    const findings = evaluateSemanticRules("source-package", { source: sourceManifest(), package: withArray });
    expect(findings.some((finding) => finding.message.includes("state[0] (a value that is not a string)"))).toBe(true);
    expect(JSON.stringify(findings)).not.toContain(synthetic);
    for (const out of [run(folder({ "fabric.source.json": sourceManifest(), "fabric.package.json": withArray })).out, run(folder({ "fabric.source.json": sourceManifest(), "fabric.package.json": withArray }), "--json").out]) {
      expect(out).not.toContain(synthetic);
    }
  });

  it("checks a manifest whose one include entry runs far past the path grammar, through both routes, in linear time", () => {
    const dirOf = (count: number) => folder({ "fabric.source.json": sourceManifest({ include: ["a/".repeat(count), "LICENSE"] }), LICENSE: "x" });
    const small = dirOf(4000);
    const large = dirOf(64_000);
    for (const route of [(dir: string) => [path.join(dir, "fabric.source.json")], (dir: string) => [dir, "--kind", "source-tree"]]) {
      // Sixteen times the entry, measured against the same route at a sixteenth: linear about 16, quadratic about 256.
      expect(cpuOf(() => run(...route(large))) / Math.max(cpuOf(() => run(...route(small))), 0.01), route(large).join(" ")).toBeLessThan(64);
      expect(run(...route(large)).code, route(large).join(" ")).toBe(1);
    }
  }, 180_000);

  it("checks a folder's source files in time linear in their number", () => {
    // The files sit under an unchecked folder and carry no text, so a run reads their paths only and the per-file
    // linear part is small: at 250 to 8000 files the real tree read about 24, a `files.some` scan planted per file
    // about 170.
    const folderOf = (count: number) => {
      const files: Record<string, unknown> = { "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"], unchecked: [{ path: "src/vectors/", reason: "synthetic" }] }), LICENSE: "x" };
      for (let index = 0; index < count; index += 1) files[`src/vectors/d${index % 31}/f${index}.ts`] = "";
      return folder(files);
    };
    // One run's processor time (this process's user and system time, which a loaded machine's other work does not
    // inflate as it does the wall clock): repeated until a trial lasts 200 ms, the best of three trials, less an empty
    // folder's (the fixed cost of a run).
    const cpu = () => { const used = process.cpuUsage(); return (used.user + used.system) / 1000; };
    const timed = (dir: string): number => {
      run(dir, "--kind", "source-tree");
      return Math.min(...[0, 1, 2].map(() => {
        const started = cpu();
        let calls = 0;
        do { run(dir, "--kind", "source-tree"); calls += 1; } while (cpu() - started < 200);
        return (cpu() - started) / calls;
      }));
    };
    const empty = timed(folderOf(0));
    const small = timed(folderOf(250)) - empty;
    const large = timed(folderOf(8000)) - empty;
    expect(large / Math.max(small, 0.5)).toBeLessThan(64);
  }, 120_000);

  it("checks a manifest whose slot names are a 1 MB run of brackets in linear time", () => {
    const fileOf = (count: number) => {
      const long = `${")".repeat(count)}a`;
      return path.join(folder({ "fabric.source.json": sourceManifest({ include: ["src/", "LICENSE"], slots: [{ name: long, kind: "config", purpose: "a" }, { name: long, kind: "config", purpose: "b" }] }), LICENSE: "x", "src/a.ts": "x" }), "fabric.source.json");
    };
    const small = fileOf(62_500);
    const large = fileOf(1_000_000);
    // The names fail the schema, so the rule is run on the document named with its kind.
    expect(cpuOf(() => run(large, "--kind", "source-manifest")) / Math.max(cpuOf(() => run(small, "--kind", "source-manifest")), 0.01)).toBeLessThan(64);
    const result = run(large, "--kind", "source-manifest");
    expect(result.out).toContain("slot slots[1] is declared twice");
  }, 180_000);

  it("keeps a source check instance-free under a foreign schema, in its paths, messages and the target's name", () => {
    const home = ["/Users/", "jdoe", "/notes"].join("");
    const doc = { counts: { [key]: "x", [home]: "y" }, tables: { [key]: 5 } };
    const parent = folder({ "-Users-jdoe-x/doc.json": doc, "-Users-jdoe-x/fabric.source.json": doc });
    const dir = path.join(parent, "-Users-jdoe-x");
    const routes = [
      [path.join(dir, "doc.json"), "--kind", "source-manifest", "--schema", "settings-backup"],
      [path.join(dir, "doc.json"), "--kind", "source-package", "--schema", "settings-backup"],
      [path.join(dir, "fabric.source.json"), "--schema", "settings-backup"],
      [path.join(dir, "missing.json"), "--kind", "source-manifest"]
    ];
    for (const route of routes) {
      for (const out of [run(...route).out, run(...route, "--json").out]) {
        expect(out, route.join(" ")).not.toContain("jdoe");
        for (let start = 0; start + 8 <= key.length; start += 1) expect(out, route.join(" ")).not.toContain(key.slice(start, start + 8));
      }
    }
  });

  it("reads any source check instance-free: a source- kind, the source schema named or inferred, or the file's name", () => {
    const other = folder({ "other.json": `{"include":[${["/Users/", "jdoe", "/x"].join("")}]}` });
    const parse = run(path.join(other, "other.json"), "--schema", "fabric-source");
    expect(parse.out).toContain("it stops reading at line 1, column");
    expect(parse.out).not.toContain("jdo");
    const home = ["/Users/", "jdoe", "/x"].join("");
    const nearMiss = "https://fabric.passioncode.ai/agent-contract/extension/service/0.1";
    const named = folder({ "fabric.source.json": { ...sourceManifest({ include: ["src/"] }), [home]: { extensions: { [nearMiss]: 1 } } } });
    for (const args of [["--kind", "source-manifest"], ["--schema", "manifest"], []]) {
      const out = run(path.join(named, "fabric.source.json"), ...args).out;
      expect(out, args.join(" ")).not.toContain("jdoe");
      expect(out, args.join(" ")).not.toContain("hint/");
    }
  });

  it("says no pair was checked when --kind source-package reads a document or a folder without {source, package}", () => {
    const dir = folder({ "doc.json": { a: 1 }, "fabric.source.json": sourceManifest() });
    for (const target of [path.join(dir, "doc.json"), dir]) {
      const result = run(target, "--kind", "source-package");
      expect(result.code).toBe(0);
      expect(result.out).toContain("note/pair  the document holds no {source, package} pair, so no pair was checked (FAC-SEM-160)");
    }
    const pair = folder({ "pair.json": { source: sourceManifest(), package: json("positive/fabric-package-agent.json") } });
    expect(run(path.join(pair, "pair.json"), "--kind", "source-package").out).not.toContain("no pair was checked");
  });

  it("checks a source manifest beside its package as a pair, by their file names", () => {
    const pkg = json("positive/fabric-package-agent.json");
    const matching = sourceManifest({ slots: [{ name: "MAIL_OAUTH", kind: "secret", purpose: "reads the mailbox" }, { name: "DIGESTS", kind: "store", purpose: "the digests written", path: "digests" }] });
    expect(run(folder({ "fabric.source.json": matching, "fabric.package.json": pkg })).code).toBe(0);
    const result = run(folder({ "fabric.source.json": sourceManifest(), "fabric.package.json": pkg }));
    expect(result.code).toBe(1);
    expect(lines(result.out).map((line) => line.split("  ").slice(1, 3))).toEqual([["/package/secrets/0/name", "FAC-SEM-160"], ["/package/state/0/path", "FAC-SEM-160"]]);
    expect(run(folder({ "a/fabric.source.json": sourceManifest(), "b/fabric.package.json": pkg })).code).toBe(0);
    expect(run(folder({ "fabric-source.json": sourceManifest(), "fabric.package.json": pkg })).code).toBe(0);
  });

  it("knows fabric.source.json by its name when its content does not tell", () => {
    expect(inferSchema({ include: [] }, "/x/fabric.source.json")).toBe("fabric-source.schema.json");
    expect(inferSchema(sourceManifest(), "/x/anything.json")).toBe("fabric-source.schema.json");
  });
});
