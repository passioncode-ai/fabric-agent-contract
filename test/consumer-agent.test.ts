import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { consumerPlacement } from "../src/package-rules.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

// DEC-0071: a consumer agent — kind agent without a provider manifest, requiring MCP servers by role (FAC-SEM-102).
const pkg = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/positive/fabric-package-consumer-agent.json"), "utf8"));
const configured = (entries: Array<[string, string[]]>) => new Map(entries);

describe("consumerPlacement", () => {
  it("finds nothing missing when every role is registered with every tool", () => {
    expect(consumerPlacement(pkg, configured([["org-server", ["activation_status", "members_list", "extra"]]]))).toEqual([]);
  });
  it("names a role the configuration does not register, and each tool a registered server lacks", () => {
    expect(consumerPlacement(pkg, configured([]))).toEqual([{ problem: "missing-role", role: "org-server" }]);
    expect(consumerPlacement(pkg, configured([["org-server", ["activation_status"]]]))).toEqual([{ problem: "missing-tool", role: "org-server", tool: "members_list" }]);
  });
  it("compares role names exactly, so another server's key does not stand in", () => {
    expect(consumerPlacement(pkg, configured([["Org-Server", ["activation_status", "members_list"]]]))).toEqual([{ problem: "missing-role", role: "org-server" }]);
  });
  it("reads a configuration that is not a map as registering nothing, and a server's tools that are not a list as none", () => {
    expect(consumerPlacement(pkg, null as unknown as Map<string, string[]>)).toEqual([{ problem: "missing-role", role: "org-server" }]);
    expect(consumerPlacement(pkg, new Map([["org-server", null as unknown as string[]]]))).toEqual([
      { problem: "missing-tool", role: "org-server", tool: "activation_status" },
      { problem: "missing-tool", role: "org-server", tool: "members_list" }
    ]);
  });
  it("reads a package without requirements, and malformed ones, as needing nothing, never by throwing", () => {
    expect(consumerPlacement(null, configured([]))).toEqual([]);
    expect(consumerPlacement({ requires: { mcp: "x" } }, configured([]))).toEqual([]);
    expect(consumerPlacement({ requires: { mcp: [null, { role: 7 }, { role: "a", tools: "x" }] } }, configured([["a", []]]))).toEqual([]);
  });
});

describe("FAC-SEM-102: one role, one server", () => {
  const codes = (value: unknown) => evaluateSemanticRules("package", value).map((finding) => `${finding.code} ${finding.instancePath}`).filter((f) => f.startsWith("FAC-SEM-102"));
  it("passes the fixture and refuses a role required twice", () => {
    expect(codes(pkg)).toEqual([]);
    const twice = { ...pkg, requires: { ...pkg.requires, mcp: [...pkg.requires.mcp, { role: "org-server", tools: ["other"] }] } };
    expect(codes(twice)).toEqual(["FAC-SEM-102 /requires/mcp/1/role"]);
    expect(codes({ ...pkg, requires: { mcp: [{ role: 7, tools: ["a"] }, { role: 7, tools: ["b"] }] } })).toEqual([]);
  });
});

describe("a consumer agent is a plugin, and names servers without credentials", () => {
  const all = (value: unknown) => evaluateSemanticRules("package", value).map((finding) => `${finding.code} ${finding.instancePath}`);
  it("lists the plugin manifest", () => {
    const files = pkg.files.filter((file: { path: string }) => file.path !== ".claude-plugin/plugin.json");
    expect(all({ ...pkg, files })).toContain("FAC-SEM-064 /files");
  });
  it("refuses a credential-shaped role, contract or tool", () => {
    const token = "ghp_" + "a".repeat(36);
    const withTool = { ...pkg, requires: { ...pkg.requires, mcp: [{ role: "org-server", contract: token, tools: ["activation_status", token] }] } };
    expect(all(withTool).filter((f) => f.startsWith("FAC-SEM-065"))).toEqual(["FAC-SEM-065 /requires/mcp/0/contract", "FAC-SEM-065 /requires/mcp/0/tools/1"]);
    expect(all({ ...pkg, requires: { mcp: [null, { role: token, tools: "x" }] } }).filter((f) => f.startsWith("FAC-SEM-065"))).toEqual(["FAC-SEM-065 /requires/mcp/1/role"]);
  });
});

describe("FAC-SEM-102: the slots a role names (DEC-0074)", () => {
  const codes = (value: unknown) => evaluateSemanticRules("package", value).map((finding) => `${finding.code} ${finding.instancePath}`).filter((f) => f.startsWith("FAC-SEM-102"));
  const mcp = (entries: unknown[]) => ({ ...pkg, requires: { ...pkg.requires, mcp: entries } });
  it("passes slots declared in secrets[], each feeding one role", () => expect(codes(pkg)).toEqual([]));
  it("refuses a slot not declared in secrets[]", () => {
    expect(codes(mcp([{ role: "org-server", tools: ["a"], secrets: ["ORG_URL", "MISSING_SLOT"] }]))).toEqual(["FAC-SEM-102 /requires/mcp/0/secrets/1"]);
  });
  it("refuses one slot feeding two roles", () => {
    expect(codes(mcp([{ role: "org-server", tools: ["a"], secrets: ["ORG_URL"] }, { role: "other", tools: ["b"], secrets: ["ORG_URL"] }]))).toEqual(["FAC-SEM-102 /requires/mcp/1/secrets/0"]);
  });
  it("reads malformed slots as nothing", () => {
    expect(codes(mcp([{ role: "org-server", tools: ["a"], secrets: [7, null] }, { role: "x", tools: ["b"], secrets: "ORG_URL" }]))).toEqual([]);
  });
});
