import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { secretArgument } from "../src/secret-shape.js";
import { createValidator, validateDocument } from "../src/validator.js";

type Json = Record<string, any>;
const read = (file: string) => JSON.parse(readFileSync(path.join(projectRoot(), file), "utf8")) as Json;
const catalogue = read("catalogue/coding-agents.json");
const permissions = read("tools/catalogue/permissions.json");
const ajv = await createValidator();
const valid = (doc: unknown) => validateDocument(ajv, `${SCHEMA_PREFIX}schemas/coding-agents.schema.json`, doc).valid;
const strings = (value: unknown): string[] =>
  typeof value === "string" ? [value] : Array.isArray(value) ? value.flatMap(strings) : value && typeof value === "object" ? Object.entries(value).flatMap(([key, member]) => [key, ...strings(member)]) : [];

describe("the coding-agent catalogue (DEC-0093)", () => {
  it("is a valid coding-agents/1 document with one entry per id and no retired id listed", () => {
    expect(valid(catalogue)).toBe(true);
    const ids = (catalogue.agents as Json[]).map((agent) => agent.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of (catalogue.retired ?? []) as string[]) expect(ids).not.toContain(id);
  });
  it("names each runner kind C2 lists (DEC-0016, DEC-0029, DEC-0046) by that kind, and no alias twice or as another entry's id", () => {
    const ids = (catalogue.agents as Json[]).map((agent) => agent.id);
    for (const kind of ["claude-code", "codex", "cursor-agent", "gemini-cli", "goose", "hermes", "kilo", "kimi-code", "kiro", "opencode", "cline", "pi"]) expect(ids, kind).toContain(kind);
    const aliases = (catalogue.agents as Json[]).flatMap((agent) => (agent.aliases ?? []) as string[]);
    expect(new Set(aliases).size).toBe(aliases.length);
    for (const alias of aliases) expect(ids, alias).not.toContain(alias);
  });
  it("records a permission-skipping argument only with its evidence, the one tools/catalogue/permissions.json holds", () => {
    for (const agent of catalogue.agents as Json[]) {
      expect(agent.permissions, agent.id).toEqual(permissions[agent.id]);
      if (agent.permissions?.source) expect(agent.sources, agent.id).toContain(agent.permissions.source);
      expect(agent.sources, agent.id).toContain(agent.url);
    }
    for (const id of Object.keys(permissions)) expect((catalogue.agents as Json[]).some((agent) => agent.id === id), id).toBe(true);
  });
  it("holds no credential in any member", () => {
    for (const agent of catalogue.agents as Json[]) for (const value of strings(agent)) expect(secretArgument(value), `${agent.id}: a credential-shaped value`).toBe(false);
  });
  it("is the seed's output byte for byte (tools/catalogue/seed.py over permissions.json)", () => {
    const root = projectRoot();
    const out = execFileSync("python3", ["-I", path.join(root, "tools/catalogue/seed.py"), path.join(root, "tools/catalogue/permissions.json")], { encoding: "utf8" });
    expect(out).toBe(readFileSync(path.join(root, "catalogue/coding-agents.json"), "utf8"));
  });
  it("raises revision whenever the file changes from the committed main's", () => {
    let committed: string;
    try {
      committed = execFileSync("git", ["-C", projectRoot(), "show", "origin/main:catalogue/coding-agents.json"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    } catch {
      return; // main has no catalogue yet, or no origin: nothing to compare
    }
    const current = readFileSync(path.join(projectRoot(), "catalogue/coding-agents.json"), "utf8");
    if (committed !== current) expect(catalogue.revision).toBeGreaterThan((JSON.parse(committed) as Json).revision);
  });
  it("refuses an install whose via and package or script do not pair, and an unknown via", () => {
    const agent = (catalogue.agents as Json[]).find((entry) => entry.id === "claude-code") as Json;
    const install = (entry: Json) => ({ ...catalogue, agents: [{ ...agent, install: [entry] }] });
    expect(valid(install({ via: "npm", package: "x" }))).toBe(true);
    expect(valid(install({ via: "script", script: "https://example.com/install.sh" }))).toBe(true);
    for (const bad of [{ via: "script", package: "x" }, { via: "npm" }, { via: "brew", script: "https://example.com/i.sh" }, { via: "pip", package: "x" }, { via: "npm", package: "x", script: "https://example.com/i.sh" }]) expect(valid(install(bad)), JSON.stringify(bad)).toBe(false);
  });
  it("refuses each constraint the schema states", () => {
    const agent = (catalogue.agents as Json[]).find((entry) => entry.id === "claude-code") as Json;
    const one = (over: Json) => ({ ...catalogue, agents: [{ ...agent, ...over }] });
    const measured = { argv: ["claude", "--help"], version: "1", date: "2026-10-19" };
    for (const bad of [
      { id: "Claude-Code" },
      { permissions: { skip: agent.permissions.skip, measured: { argv: measured.argv, date: measured.date } } },
      { permissions: { ...agent.permissions, note: "x" } },
      { permissions: { skip: { env: { lowercase_name: "1" } }, source: agent.permissions.source } },
      { permissions: { skip: { env: { YOLO: "$(curl x)" } }, source: agent.permissions.source } },
      { permissions: { skip: { argv: ["--yes"], env: { YOLO: "1" } }, source: agent.permissions.source } },
      { proxy: { keyCommand: ["print-key"] } },
      { runner: { kind: 1 } }
    ]) expect(valid(one(bad)), JSON.stringify(bad)).toBe(false);
  });
  it("refuses a permission with no evidence, with both kinds, a variable named in lower case and a plain-http url", () => {
    const agent = (catalogue.agents as Json[]).find((entry) => entry.id === "claude-code") as Json;
    const one = (over: Json) => ({ ...catalogue, agents: [{ ...agent, ...over }] });
    expect(valid(one({}))).toBe(true);
    expect(valid(one({ permissions: { skip: agent.permissions.skip } }))).toBe(false);
    expect(valid(one({ permissions: { ...agent.permissions, measured: { argv: ["claude", "--help"], version: "1", date: "2026-10-19" } } }))).toBe(false);
    expect(valid(one({ openrouter: { keyEnv: "openrouter_api_key" } }))).toBe(false);
    expect(valid(one({ url: "http://example.com" }))).toBe(false);
    expect(valid({ ...catalogue, agents: [] })).toBe(false);
  });
});
