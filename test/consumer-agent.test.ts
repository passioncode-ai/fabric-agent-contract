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
