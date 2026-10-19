import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { attributeFolder, isPath, normalizeOrigin, ownerOf, under } from "../src/folder-attribution.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { VECTOR_FILE, buildFolderAttributionVectors } from "../tools/vectors/folder-attribution.js";

type Json = Record<string, any>;
const root = projectRoot();
const read = (relative: string) => JSON.parse(readFileSync(path.join(root, relative), "utf8")) as Json;
const vectors = read(VECTOR_FILE);
const ajv = await createValidator();
const valid = (pointer: string, doc: unknown) => validateDocument(ajv, `${SCHEMA_PREFIX}schemas/folder-attribution.schema.json${pointer}`, doc).valid;
const TZ = process.env.TZ;
afterAll(() => {
  if (TZ === undefined) delete process.env.TZ;
  else process.env.TZ = TZ;
});

describe("the vectors (DEC-0089)", () => {
  it("are the generator's output", () => {
    expect(buildFolderAttributionVectors()).toBe(readFileSync(path.join(root, VECTOR_FILE), "utf8"));
  });
  it.each(vectors.origin as Json[])("origin: $origin", (entry) => {
    expect(normalizeOrigin(entry.origin) ?? null).toBe(entry.expected);
  });
  it.each(vectors.attribution as Json[])("attribution: $name", (entry) => {
    expect(attributeFolder(entry.snapshot)).toEqual(entry.expected);
  });
  it("covers every AT row", () => {
    const rows = new Set((vectors.attribution as Json[]).map((entry) => /^AT-[0-9]+/.exec(entry.name)?.[0]));
    for (let row = 0; row <= 15; row += 1) expect(rows.has(`AT-${row}`), `AT-${row}`).toBe(true);
  });
  it("hold the same answers in every time zone", () => {
    for (const name of ["UTC", "America/St_Johns", "Pacific/Kiritimati"]) {
      process.env.TZ = name;
      for (const entry of vectors.attribution as Json[]) expect(attributeFolder(entry.snapshot), `${name} ${entry.name}`).toEqual(entry.expected);
    }
  });
});

describe("the schema (DEC-0089)", () => {
  it("admits every vector's snapshot that is well formed, and every answer", () => {
    for (const entry of vectors.attribution as Json[]) {
      if (!("fault" in entry.expected)) expect(valid("#/$defs/snapshot", entry.snapshot), entry.name).toBe(true);
      expect(valid("#/$defs/answer", entry.expected), entry.name).toBe(true);
    }
  });
  it("refuses every bound the reference refuses (the retro's standing instruction)", () => {
    for (const entry of (vectors.attribution as Json[]).filter((e) => /empty source|257 characters|empty project|4097 characters/.test(e.name))) {
      expect(entry.expected, entry.name).toEqual({ fault: "input-invalid" });
      expect(valid("#/$defs/snapshot", entry.snapshot), entry.name).toBe(false);
    }
    const astral = { folder: `/${"\u{1F600}".repeat(2100)}`, home: "/u/ana", tempRoots: [], git: null, projects: [] };
    expect(valid("#/$defs/snapshot", astral)).toBe(true);
    expect("fault" in attributeFolder(astral)).toBe(false);
  });
  it("refuses a snapshot the reference refuses for its shape", () => {
    for (const entry of (vectors.attribution as Json[]).filter((e) => e.name.startsWith("AT-0: a") && /relative|trailing|\.\./.test(e.name))) {
      expect(valid("#/$defs/snapshot", entry.snapshot), entry.name).toBe(false);
    }
  });
});

describe("helpers", () => {
  it("compares paths segment by segment", () => {
    expect(under("/a/b", "/a")).toBe(true);
    expect(under("/a/bc", "/a/b")).toBe(false);
    expect(under("/a", "/")).toBe(true);
    expect(under("C:/x", "C:/")).toBe(true);
    expect(isPath("/a//b")).toBe(false);
    expect(isPath("/a/./b")).toBe(false);
    expect(isPath("C:/")).toBe(true);
    expect(ownerOf("gitlab.example.com/group/sub/app")).toBe("gitlab.example.com/group/sub");
  });
});

describe("totality: every function answers and never throws", () => {
  const HOSTILE: unknown[] = [undefined, null, 0, Number.NaN, "", "x", [], {}, Object.create(null), { toString: 1 }, { folder: "/a", home: "/h", tempRoots: [], git: null, projects: [{ id: "p", folders: [{ path: 1 }] }] }];
  it("attributes anything", () => {
    for (const a of HOSTILE) {
      expect(() => attributeFolder(a)).not.toThrow();
      expect(() => normalizeOrigin(a)).not.toThrow();
      expect(() => attributeFolder({ folder: "/a/b", home: "/h", tempRoots: [], git: a, projects: [] })).not.toThrow();
    }
  });
  it("answers a snapshot with very many matching folders without overflowing the stack", () => {
    const projects = Array.from({ length: 14 }, (_, n) => ({ id: `p:${n}`, folders: Array(10000).fill({ path: "/u/ana/work/s", commonDir: null }), sources: [] }));
    expect(attributeFolder({ folder: "/u/ana/work/s/x", home: "/u/ana", tempRoots: [], git: null, projects })).toEqual({ outcome: "ambiguous", rule: "folder", projects: projects.map((p) => p.id) });
  });
  it("trims slashes in linear time: 10000 sources and 2000 origins of 4096 characters answer within a second", () => {
    const slashes = `a${"/".repeat(4094)}b`;
    const started = Date.now();
    attributeFolder({ folder: "/u/ana/work/x", home: "/u/ana", tempRoots: [], git: null, projects: [{ id: "p:s", folders: [], sources: Array(10000).fill(slashes) }] });
    attributeFolder({ folder: "/u/ana/work/x", home: "/u/ana", tempRoots: [], git: null, projects: [{ id: "p:o", folders: Array(2000).fill({ path: "/u/ana/work/o", origin: `https://github.com/${slashes}` }), sources: [] }] });
    expect(Date.now() - started).toBeLessThan(1000);
  });
  it("reads work records in linear time: 10000 Projects and 10000 records with ids of 256 astral characters answer within a second", () => {
    const id = (n: number) => `${"\u{1F600}".repeat(250)}${String(n).padStart(6, "0")}`;
    const projects = Array.from({ length: 10000 }, (_, n) => ({ id: id(n), folders: [], sources: [] }));
    const work = Array.from({ length: 10000 }, (_, n) => ({ project: id(n), commonDir: `/u/ana/work/r${n}/.git` }));
    const git = { toplevel: "/u/ana/work/lib", commonDir: "/u/ana/work/lib/.git", mainCheckout: "/u/ana/work/lib", origin: null };
    const started = Date.now();
    expect(attributeFolder({ folder: "/u/ana/work/lib", home: "/u/ana", tempRoots: [], git, projects, work })).toEqual({ outcome: "new", root: "/u/ana/work/lib" });
    expect(Date.now() - started).toBeLessThan(1000);
  });
  it("never throws when any one node of any vector's snapshot is replaced by a hostile value", () => {
    const hostile: unknown[] = [null, undefined, 7, "", [], {}, "/"];
    const paths = (value: unknown, at: Array<string | number> = []): Array<Array<string | number>> => {
      if (value === null || typeof value !== "object") return [at];
      const keys = Array.isArray(value) ? value.map((_, index) => index) : Object.keys(value as object);
      return [at, ...keys.flatMap((key) => paths((value as Record<string | number, unknown>)[key], [...at, key]))];
    };
    let runs = 0;
    for (const entry of vectors.attribution as Json[]) {
      for (const at of paths(entry.snapshot).filter((p) => p.length > 0)) {
        for (const bad of hostile) {
          const copy = structuredClone(entry.snapshot) as Record<string | number, unknown>;
          let node = copy;
          for (const key of at.slice(0, -1)) node = node[key] as Record<string | number, unknown>;
          node[at[at.length - 1] as string | number] = bad;
          expect(() => attributeFolder(copy)).not.toThrow();
          runs += 1;
        }
      }
    }
    expect(runs).toBeGreaterThan(10000);
  });
  it("reads no inherited member", () => {
    const inherited = Object.create({ folder: "/a/b", home: "/h", tempRoots: [], git: null, projects: [] }) as Json;
    expect(attributeFolder(inherited)).toEqual({ fault: "input-invalid" });
  });
});

describe("folder-attribution semantic fixtures (FAC-SEM-121)", () => {
  const files = readdirSync(path.join(root, "fixtures/semantic")).filter((name) => name.startsWith("folder-attribution-"));
  it("has fixtures", () => {
    expect(files.length).toBeGreaterThanOrEqual(2);
  });
  it.each(files)("%s", (file) => {
    const fixture = read(`fixtures/semantic/${file}`);
    const codes = [...new Set(evaluateSemanticRules(fixture.kind, fixture.input).map((finding) => finding.code))];
    expect(codes).toEqual(fixture.expect);
  });
});
