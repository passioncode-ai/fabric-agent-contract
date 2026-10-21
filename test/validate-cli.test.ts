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
    // Two cold tsx processes, under a second of CPU each; on a loaded machine one took 22 s of wall time (2026-10-21).
  }, 120_000);
});

describe("the first unit and product readings' cases (contract review 2026-10-21)", () => {
  it("an unreadable folder is a usage error, never a throw", () => {
    if (process.getuid?.() === 0) return;
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
    let deep: Record<string, unknown> = {};
    const top = deep;
    for (let n = 0; n < 5000; n += 1) { const next = {}; deep.a = next; deep = next; }
    manifest.provider.extensions = { "https://vendor.example/x": top };
    expect(run(one("fabric-agent.json", manifest))).toEqual({ code: 0, out: "" });
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

  it("an empty folder after a target that failed still says it holds no .json file", () => {
    const empty = folder({});
    const result = run(path.join(empty, "missing.json"), empty);
    expect(result.code).toBe(2);
    expect(result.out).toContain("holds no .json file");
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
