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
  typeof value === "string" ? [value] : Array.isArray(value) ? value.flatMap(strings) : value && typeof value === "object" ? Object.values(value).flatMap(strings) : [];

describe("the coding-agent catalogue (DEC-0093)", () => {
  it("is a valid coding-agents/1 document with one entry per id and no retired id listed", () => {
    expect(valid(catalogue)).toBe(true);
    const ids = (catalogue.agents as Json[]).map((agent) => agent.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of (catalogue.retired ?? []) as string[]) expect(ids).not.toContain(id);
  });
  it("names each runner kind DEC-0046 catalogues by that kind, and no alias twice or as another entry's id", () => {
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
