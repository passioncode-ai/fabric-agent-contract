import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { inferSchema, main } from "../src/validate-cli.js";

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

describe("every positive fixture passes", () => {
  it.each(catalogue.filter((entry) => entry.valid))("$name", (entry) => {
    const result = run(fixture(entry.path), "--schema", entry.schema);
    expect(result.out, result.out).toBe("");
    expect(result.code).toBe(0);
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

  it("checks the manifest, a provider entry, a descriptor and a well-known document with no --schema", () => {
    for (const file of ["positive/manifest-mcp.json", "positive/provider-entry-stdio.json", "positive/service-descriptor.json", "positive/service-well-known.json"]) {
      expect(run(fixture(file)), file).toEqual({ code: 0, out: "" });
    }
  });

  it("falls back to the file name: fabric-agent.json, providers/<id>.json and <id>.<instance>.json", () => {
    expect(inferSchema({}, "x/fabric-agent.json")).toBe("manifest.schema.json");
    expect(inferSchema({}, "x/providers/agent.json")).toBe("provider.schema.json");
    expect(inferSchema({}, "x/example-agent.default.json")).toBe("service-descriptor.schema.json");
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

  it("a misspelt extension key passes the schema and is caught as a near miss", () => {
    const manifest = json("positive/manifest-mcp.json");
    manifest.provider.extensions = { "https://fabric.passioncode.ai/agent-contract/extension/service/0.1": { descriptor: "example-agent.default" } };
    const result = run(one("fabric-agent.json", manifest));
    expect(result.code).toBe(1);
    expect(lines(result.out)).toEqual([expect.stringContaining("/provider/extensions  hint/extension-key  https://fabric.passioncode.ai/agent-contract/extension/service/0.1 is not an extension key the contract defines; did you mean https://fabric.passioncode.ai/agent-contract/extensions/service/0.1?")]);
    const host = json("positive/manifest-mcp.json");
    host.capabilities[0].extensions = { "https://passioncode.ai/agent-contract/extensions/interop/0.1": {} };
    expect(run(one("fabric-agent.json", host)).out).toContain("did you mean https://fabric.passioncode.ai/agent-contract/extensions/interop/0.1?");
    const version = json("positive/manifest-mcp.json");
    version.extensions = { "https://fabric.passioncode.ai/agent-contract/extensions/memory/0.2": {} };
    expect(run(one("fabric-agent.json", version)).out).toContain("is not an extension key the contract defines; the contract's keys are listed in src/extensions.ts");
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
    entry.run.mcp.stdio.command = ["/usr/local/bin/agent", "--token", "ghp_abcdefghijklmnopqrstuvwxyz0123456789"];
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
    expect(result.out).not.toContain("FAC-SEM-009");
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
    expect(renamed.out).toMatch(/providers\/renamed\.json  \/entry\/id  FAC-SEM-014  .*the file is named <id>\.json/);
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
    expect(report.notes.map((note) => note.rule)).toEqual(["note/pair"]);
  });

  it("a folder file whose schema cannot be told is a usage error, and so is an empty folder", () => {
    const result = run(folder({ "notes.json": { hello: "world" } }));
    expect(result.code).toBe(2);
    expect(result.out).toContain("cannot tell which schema");
    expect(run(folder({ "readme.txt": "x" }))).toEqual({ code: 2, out: expect.stringContaining("no .json file") });
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
    // Root reads any file; the case is then not observable here.
    if (process.getuid?.() !== 0) expect(result).toEqual({ code: 2, out: expect.stringContaining("cannot read") });
  });

  it("--kind on a wrapper kind checks the semantic rule alone", () => {
    expect(run(one("link.json", { url: "fabric://chat?service=example-agent.default" }), "--kind", "deep-link")).toEqual({ code: 0, out: "" });
  });
});

describe("pnpm validate runs as a command", () => {
  it("exits 1 with the problem line, and 0 on the repository's own manifest example", () => {
    const manifest = json("positive/manifest-mcp.json");
    manifest.capabilities[0].profile.protocolRevision = "2025-06-18";
    const tsx = path.join(root, "node_modules/.bin/tsx");
    const bad = spawnSync(tsx, [path.join(root, "src/validate-cli.ts"), one("fabric-agent.json", manifest)], { encoding: "utf8" });
    expect(bad.status).toBe(1);
    expect(bad.stdout).toContain("schema/const");
    const good = spawnSync(tsx, [path.join(root, "src/validate-cli.ts"), fixture("positive/manifest-mcp.json")], { encoding: "utf8" });
    expect(good.status).toBe(0);
  });
});
