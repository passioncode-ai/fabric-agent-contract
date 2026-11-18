import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { COMPACT_MAX_TOOLS, compactSurfaceRules } from "../src/actions.js";
import { projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

// DEC-0180: a compact MCP surface (CM-1 to CM-6) and FAC-SEM-182.
const caps = ["records.list", "records.get", "records.update", "records.delete", "records.export", "records.import"];
const mcp = (extra: Record<string, unknown>) => ({ path: "/mcp", transport: "streamable-http", ...extra });
const codes = (value: Record<string, unknown>) => compactSurfaceRules(value).map((finding) => `${finding.code} ${finding.instancePath}`);

describe("compact MCP surface (DEC-0180)", () => {
  it("lists at most five tools: three direct, search and execute (CM-1)", () => {
    expect(COMPACT_MAX_TOOLS).toBe(5);
  });

  it("says nothing of a surface that is not compact", () => {
    expect(codes(mcp({ capabilities: caps }))).toEqual([]);
    expect(codes(mcp({}))).toEqual([]);
  });

  it("passes a compact surface whose capabilities name every direct one (CM-2)", () => {
    expect(codes(mcp({ capabilities: caps, compact: { search: "records.search", execute: "records.execute", direct: caps.slice(0, 3) } }))).toEqual([]);
    expect(codes(mcp({ capabilities: caps, compact: { search: "records.search", execute: "records.execute" } }))).toEqual([]);
  });

  it("refuses a compact surface without capabilities (CM-2)", () => {
    expect(codes(mcp({ compact: { search: "records.search", execute: "records.execute", direct: ["records.list"] } }))).toEqual(["FAC-SEM-182 /surfaces/mcp"]);
  });

  it("refuses one name for search and execute, and either among the capabilities (CM-2)", () => {
    expect(codes(mcp({ capabilities: caps, compact: { search: "records.tool", execute: "records.tool" } }))).toEqual(["FAC-SEM-182 /surfaces/mcp/compact/execute"]);
    expect(codes(mcp({ capabilities: [...caps, "records.execute"], compact: { search: "records.search", execute: "records.execute" } }))).toEqual(["FAC-SEM-182 /surfaces/mcp/compact/execute"]);
  });

  it("refuses a direct tool the capabilities do not name, or that is search or execute (CM-2)", () => {
    expect(codes(mcp({ capabilities: caps, compact: { search: "records.search", execute: "records.execute", direct: ["records.list", "records.purge"] } }))).toEqual(["FAC-SEM-182 /surfaces/mcp/compact/direct/1"]);
    expect(codes(mcp({ capabilities: caps, compact: { search: "records.search", execute: "records.execute", direct: ["records.search"] } }))).toEqual(["FAC-SEM-182 /surfaces/mcp/compact/direct/0"]);
  });

  it("runs on a well-known document through the semantic rules, beside FAC-SEM-176 and FAC-SEM-142", () => {
    const read = (name: string) => JSON.parse(readFileSync(path.join(projectRoot(), "fixtures", "semantic", name), "utf8")) as { input: unknown; expect: string[] };
    for (const name of ["ok", "no-capabilities", "direct-unlisted", "search-is-capability", "one-tool"]) {
      const fixture = read(`service-well-known-compact-mcp-${name}.json`);
      expect(evaluateSemanticRules("service-well-known", fixture.input).map((finding) => finding.code)).toEqual(fixture.expect);
    }
  });
});
