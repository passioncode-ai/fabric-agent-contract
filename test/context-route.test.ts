import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { ORG_CONTEXT_PREFIX, PERSONAL_CONTEXT, parseContext, routeGrantUsage, routeTarget } from "../src/context-route.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { VECTOR_FILE, buildContextRouteVectors } from "../tools/vectors/context-route.js";

// DEC-0082: routing by context — no context on the telemetry or check-in wire; a collector sends an event or a check-in
// of a session only to the enrollment of exactly that session's organization, and never a personal one, run from the
// shared vectors a port runs (fixtures/vectors/context-route.json).
type Json = Record<string, any>;
const root = projectRoot();
const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");
const vectors = JSON.parse(read(VECTOR_FILE)) as { contexts: Json[]; cases: Json[]; grantUsage: Json[] };
const validator = await createValidator();
const CONTEXT_ID = `${SCHEMA_PREFIX}schemas/common.schema.json#/$defs/contextId`;
const schemaSays = (value: unknown) => validateDocument(validator, CONTEXT_ID, value).valid;
const spec = read("docs/specification/contexts.md");

describe("the vectors (fixtures/vectors/context-route.json)", () => {
  it.each(vectors.cases.map((entry) => [entry.name, entry] as const))("%s", (_name, entry) => {
    expect(routeTarget(entry.session, entry.enrollments)).toEqual(entry.answer);
  });

  it("are exactly what the generator writes (tools/vectors/context-route.ts)", () => {
    expect(buildContextRouteVectors()).toBe(read(VECTOR_FILE));
  });

  it.each(vectors.contexts.map((entry) => [entry.name, entry] as const))("context: %s", (_name, entry) => {
    expect(schemaSays(entry.value), "common.schema.json#/$defs/contextId").toBe(entry.valid);
    expect(parseContext(entry.value) !== undefined, "parseContext").toBe(entry.valid);
  });

  it("agree with the schema on every session a case names: a context exactly when the schema accepts it", () => {
    for (const entry of vectors.cases) {
      const isContext = entry.answer.reason !== "not-a-context";
      expect(schemaSays(entry.session), entry.name).toBe(isContext);
      expect(parseContext(entry.session) !== undefined, entry.name).toBe(isContext);
    }
  });

  it("hold the boundaries of an organization's id: 1 and 128 characters routed, 0 and 129 not a context", () => {
    const answer = (id: string) => routeTarget(`${ORG_CONTEXT_PREFIX}${id}`, [{ org: id }]);
    expect(answer("a")).toEqual({ route: "enrollment", org: "a", index: 0 });
    expect(answer("o".repeat(128))).toEqual({ route: "enrollment", org: "o".repeat(128), index: 0 });
    expect(answer("")).toEqual({ route: "none", reason: "not-a-context" });
    expect(answer("o".repeat(129))).toEqual({ route: "none", reason: "not-a-context" });
    for (const length of [0, 1, 128, 129]) expect(schemaSays(`org:${"o".repeat(length)}`), String(length)).toBe(length >= 1 && length <= 128);
  });

  it("carry every reason, and the cases a lax port gets wrong", () => {
    const reasons = new Set(vectors.cases.map((entry) => entry.answer.reason ?? entry.answer.route));
    expect([...reasons].sort()).toEqual(["ambiguous", "enrollment", "not-a-context", "not-enrolled", "personal"]);
    expect(vectors.grantUsage.map((entry) => entry.answer.reason ?? entry.answer.route).sort()).toEqual(["ambiguous", "enrollment", "no-context", "not-a-context", "not-a-context", "not-a-context", "not-enrolled", "not-enrolled", "personal"]);
    const names = vectors.cases.map((entry) => entry.name as string).join("\n");
    for (const phrase of ["compare as written", "never by prefix", "an empty id", "129-character", "Personal", "non-string", "trailing newline", "__proto__"]) {
      expect(names, phrase).toContain(phrase);
    }
  });
});

describe("grant.usage routing (routeGrantUsage, DEC-0082)", () => {
  it.each(vectors.grantUsage.map((entry) => [entry.name, entry] as const))("%s", (_name, entry) => {
    expect(routeGrantUsage(entry.grantContext, entry.enrollments)).toEqual(entry.answer);
  });

  it("routes only by the grant's own context, and never a grant that states none or is personal", () => {
    expect(vectors.grantUsage.some((entry) => !Object.hasOwn(entry, "grantContext") && entry.answer.reason === "no-context")).toBe(true);
    for (const enrollments of [[{ org: "personal" }], [{ org: "org_a" }]]) {
      expect(routeGrantUsage(undefined, enrollments)).toEqual({ route: "none", reason: "no-context" });
      expect(routeGrantUsage("personal", enrollments)).toEqual({ route: "none", reason: "personal" });
    }
    expect(routeGrantUsage("org:org_a", [{ org: "org_a" }])).toEqual({ route: "enrollment", org: "org_a", index: 0 });
    for (const shape of [null, 7, [], {}]) expect(() => routeGrantUsage(shape, shape)).not.toThrow();
    expect(spec).toContain("routeGrantUsage");
    expect(spec).toContain("`no-context`");
  });
});

describe("routeTarget (DEC-0082 item 5)", () => {
  it("never routes a personal session, whatever the device is enrolled in", () => {
    expect(PERSONAL_CONTEXT).toBe("personal");
    for (const enrollments of [[], [{ org: "personal" }], [{ org: "org_a" }], null]) {
      expect(routeTarget("personal", enrollments)).toEqual({ route: "none", reason: "personal" });
    }
  });

  it("answers malformed input without throwing, and never routes on it", () => {
    const shapes: unknown[] = [undefined, null, 7, "x", true, [], ["org:a"], { constructor: 1 }, { org: "a" },
      JSON.parse('{"__proto__": {"org": "a"}, "constructor": {"org": "a"}}'), [undefined, null, { org: undefined }]];
    for (const shape of shapes) {
      expect(() => routeTarget(shape, shape)).not.toThrow();
      expect(routeTarget(shape, [{ org: "a" }]).route, String(shape)).toBe("none");
      expect(routeTarget("org:a", shape).route, String(shape)).toBe("none");
    }
    expect(routeTarget("org:constructor", [])).toEqual({ route: "none", reason: "not-enrolled" });
    // An enrollment whose org is only inherited from its prototype is not the entry's own.
    expect(routeTarget("org:a", [Object.create({ org: "a" })])).toEqual({ route: "none", reason: "not-enrolled" });
    expect(routeTarget("org:a", [Object.create({ org: "a" }), { org: "a" }])).toEqual({ route: "enrollment", org: "a", index: 1 });
    expect(routeTarget("org:__proto__", [{}])).toEqual({ route: "none", reason: "not-enrolled" });
  });

  it("is named in the specification with its vectors", () => {
    expect(spec).toContain("routeTarget");
    expect(spec).toContain("fixtures/vectors/context-route.json");
    for (const reason of ["personal", "not-a-context", "not-enrolled", "ambiguous"]) expect(spec, reason).toContain(`\`${reason}\``);
  });
});
