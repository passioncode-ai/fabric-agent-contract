import { describe, expect, it } from "vitest";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

const codes = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((finding) => finding.code);
const entry = (id: string, extra: Record<string, unknown> = {}) => ({
  protocol: "fabric-provider/0.1", id, providerId: `https://agents.example/providers/${id}`, name: id, manifest: `~/.local/share/${id}/fabric-agent.json`,
  run: { mcp: { stdio: { command: [`~/.local/bin/${id}`, "mcp"], env: { EXAMPLE_API_KEY: `secret-ref:${id}/EXAMPLE_API_KEY` } } } },
  installedAt: "2026-09-30T08:00:00Z", installedBy: "test", ...extra
});
const service = (id: string, instance = "default") => ({ protocol: "fabric-service/0.1", id, instance, origin: "http://127.0.0.1:47110" });
const stdioEnv = (value: string) => entry("example-agent", { run: { mcp: { stdio: { command: ["/usr/local/bin/example-agent"], env: { TOKEN_REF: value } } } } });
const manifest = (providerId: string, extensions?: Record<string, unknown>) => ({ contractVersion: "0.1.0", provider: { id: providerId, ...(extensions ? { extensions } : {}) }, capabilities: [] });
const SERVICE_KEY = "https://fabric.passioncode.ai/agent-contract/extensions/service/0.1";

// Credential-shaped test values are assembled at run time so that no literal
// key shape sits in the source for a secret scanner to trip over.
const fake = {
  openai: ["sk", "proj", "abcdefghijklmnopqrstuvwxyz012345"].join("-"),
  github: "gh" + "p_" + "abcdefghijklmnopqrstuvwxyz0123456789",
  aws: "AK" + "IA" + "ABCDEFGHIJKLMNOP",
  jwt: ["eyJhbGciOiJIUzI1NiJ9", "eyJzdWIiOiIxIn0", "c2lnbmF0dXJl"].join(".")
};

describe("fabric-provider/0.1 semantic rules", () => {
  it("FAC-SEM-013 flags an id that is both a service and a provider", () => {
    expect(codes("provider-directory", { services: [service("example-agent", "preview")], providers: [entry("example-agent")] })).toContain("FAC-SEM-013");
  });

  it("FAC-SEM-013 flags one provider id declared twice", () => {
    expect(codes("provider-directory", { services: [], providers: [entry("example-writer"), entry("example-writer")] })).toContain("FAC-SEM-013");
  });

  it("FAC-SEM-013 accepts distinct ids", () => {
    expect(codes("provider-directory", { services: [service("example-agent")], providers: [entry("example-writer")] })).toEqual([]);
  });

  it("FAC-SEM-014 flags an entry whose manifest does not resolve", () => {
    expect(codes("provider-observation", { entry: entry("example-agent"), manifest: null })).toContain("FAC-SEM-014");
    expect(codes("provider-observation", { entry: entry("example-agent"), manifest: { contractVersion: "0.1.0" } })).toContain("FAC-SEM-014");
  });

  it("FAC-SEM-014 compares like things: the entry id with its file name, providerId with provider.id (DEC-0017)", () => {
    const ok = { entry: entry("example-agent"), file: "example-agent.json", manifest: manifest("https://agents.example/providers/example-agent") };
    expect(codes("provider-observation", ok)).toEqual([]);
    expect(codes("provider-observation", { ...ok, file: "example-writer.json" })).toContain("FAC-SEM-014");
    expect(codes("provider-observation", { ...ok, manifest: manifest("https://agents.example/providers/example-writer") })).toContain("FAC-SEM-014");
    expect(codes("provider-observation", { ...ok, manifest: manifest("example-agent") })).toContain("FAC-SEM-014");
  });

  it("FAC-SEM-014 reads the file name only when one is given", () => {
    expect(codes("provider-observation", { entry: entry("example-agent"), manifest: manifest("https://agents.example/providers/example-agent") })).toEqual([]);
  });

  it("FAC-SEM-015 flags a literal credential, bare or behind a secret reference", () => {
    for (const planted of [`secret-ref:${fake.openai}`, `secret-ref:${fake.github}`, `secret-ref:${fake.aws}`, `secret-ref:${fake.jwt}`, "plain-literal-value"]) {
      expect(codes("provider-entry", stdioEnv(planted)), planted).toContain("FAC-SEM-015");
    }
  });

  it("FAC-SEM-015 accepts references named after the secret they point to", () => {
    expect(codes("provider-entry", stdioEnv("secret-ref:example-agent/EXAMPLE_API_KEY"))).toEqual([]);
    expect(codes("provider-entry", entry("example-agent", { run: { mcp: { url: "http://127.0.0.1:47201/mcp" } } }))).toEqual([]);
  });
});

describe("runner catalogue semantic rules", () => {
  const runner = (kind: string, drive: string, drives: Record<string, unknown>) => ({ kind, name: kind, binaries: [kind], version: { argv: ["--version"], pattern: "(\\d+)", timeoutMs: 5000 }, drive, drives, mcpConfig: { file: "~/.x", format: "none" } });

  it("FAC-SEM-016 flags a default drive missing from drives", () => {
    expect(codes("runner", runner("codex", "codex-app-server", { "codex-exec": { argv: ["exec"] } }))).toContain("FAC-SEM-016");
  });

  it("FAC-SEM-016 accepts a default drive that is present", () => {
    expect(codes("runner", runner("codex", "codex-exec", { "codex-exec": { argv: ["exec"] } }))).toEqual([]);
  });

  it("FAC-SEM-021 flags two catalogue entries of one kind, and each entry's drive is still checked", () => {
    const ok = runner("goose", "acp", { acp: { argv: ["acp"] } });
    expect(codes("runner-catalogue", [ok, ok])).toContain("FAC-SEM-021");
    expect(codes("runner-catalogue", [ok, runner("kiro", "acp", {})])).toContain("FAC-SEM-016");
    expect(codes("runner-catalogue", [ok, runner("kiro", "acp", { acp: { argv: ["acp"] } })])).toEqual([]);
  });
});

describe("G-07: a descriptor and its manifest name each other (FAC-SEM-020)", () => {
  const descriptor = { ...service("example-agent"), fabricManifest: "~/.local/share/example-agent/fabric-agent.json" };

  it("flags a descriptor pointing at a manifest that names another service", () => {
    expect(codes("service-manifest", { descriptor, manifest: manifest("https://agents.example/p", { [SERVICE_KEY]: { descriptor: "example-writer.default" } }) })).toContain("FAC-SEM-020");
  });

  it("flags a descriptor pointing at a manifest that does not carry the service key", () => {
    expect(codes("service-manifest", { descriptor, manifest: manifest("https://agents.example/p") })).toContain("FAC-SEM-020");
  });

  it("flags a descriptor whose manifest does not resolve", () => {
    expect(codes("service-manifest", { descriptor, manifest: null })).toContain("FAC-SEM-020");
  });

  it("accepts a matching pair, and a descriptor that names no manifest", () => {
    expect(codes("service-manifest", { descriptor, manifest: manifest("https://agents.example/p", { [SERVICE_KEY]: { descriptor: "example-agent.default" } }) })).toEqual([]);
    expect(codes("service-manifest", { descriptor: service("example-agent"), manifest: null })).toEqual([]);
  });
});
