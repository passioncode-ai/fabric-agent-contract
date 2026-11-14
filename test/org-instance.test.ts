import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import {
  INSTANCE_STATUSES,
  MAX_INSTANCE_SECONDS,
  ORG_INSTANCE_TYPE,
  PLACEMENTS,
  orgInstanceSigningInput,
  orgInstanceWellFormed,
  verifyOrgInstance
} from "../src/org-instance.js";
import { strictTime } from "../src/rfc3339.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { ORG_INSTANCE_FIELDS } from "../src/signing-challenges.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { VECTOR_FILE, buildOrgInstanceVectors } from "../tools/vectors/org-instance.js";

// DEC-0170: org-instance/1, the organization server's signed statement that an instance runs for an organization.
type Json = Record<string, any>;
const root = projectRoot();
const read = (relative: string) => JSON.parse(readFileSync(path.join(root, relative), "utf8")) as Json;
const vectors = read(VECTOR_FILE);
const schema = read("schemas/org-instance.schema.json");
const validator = await createValidator();
const valid = (value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/org-instance.schema.json`, value).valid;
const codes = (value: unknown) => [...new Set(evaluateSemanticRules("org-instance", value).map((finding) => finding.code))];
const trustOf = (trust: Json | null) => (trust === null ? null : { ...trust, now: new Date(strictTime(trust.now)), keySet: vectors.keySets[trust.keySet] });
const BASE = vectors.signingInput.document as Json;

describe("the statement (DEC-0170 IS-1)", () => {
  it("is the committed vector file, written by its generator", () => {
    expect(readFileSync(path.join(root, VECTOR_FILE), "utf8")).toBe(buildOrgInstanceVectors());
  });
  it("lists every member always, closed, with the register's field list and the module's constants", () => {
    expect([...ORG_INSTANCE_FIELDS, "type", "sig"].sort()).toEqual([...schema.required].sort());
    expect(schema.additionalProperties).toBe(false);
    expect(schema.properties.type.const).toBe(ORG_INSTANCE_TYPE);
    expect(schema.properties.placement.enum).toEqual([...PLACEMENTS]);
    expect(schema.properties.status.enum).toEqual([...INSTANCE_STATUSES]);
    expect(MAX_INSTANCE_SECONDS).toBe(7 * 24 * 60 * 60);
  });
  it("signs the RFC 8785 form without sig, and has no input for another type or member list", () => {
    expect(orgInstanceSigningInput(BASE)?.toString("utf8")).toBe(vectors.signingInput.input);
    expect(orgInstanceSigningInput({ ...BASE, type: "org-membership/1" })).toBeUndefined();
    expect(orgInstanceSigningInput({ ...BASE, owner: "x" })).toBeUndefined();
    expect(orgInstanceSigningInput("x")).toBeUndefined();
  });
  it("accepts the positive fixture and every accepted vector document with the schema, the shape check and the rule", () => {
    expect(read("fixtures/positive/org-instance.json")).toEqual(BASE);
    for (const entry of (vectors.verify as Json[]).filter((c) => c.expected.ok)) {
      expect(valid(entry.instance), entry.name).toBe(true);
      expect(orgInstanceWellFormed(entry.instance), entry.name).toBe(true);
      expect(codes(entry.instance), entry.name).toEqual([]);
    }
  });
});

describe("verifyOrgInstance (DEC-0170 IS-2)", () => {
  it.each(vectors.verify as Json[])("$name", (entry) => {
    expect(verifyOrgInstance(entry.instance, trustOf(entry.trust) as never)).toEqual(entry.expected);
  });
  it("answers context-invalid for a context that is not an object, and never throws", () => {
    expect(verifyOrgInstance(BASE, undefined as never)).toEqual({ ok: false, problem: "context-invalid" });
    expect(verifyOrgInstance(BASE, { now: "x" } as never)).toEqual({ ok: false, problem: "no-clock" });
  });
});

describe("FAC-SEM-177 (DEC-0170 IS-5)", () => {
  const files = readdirSync(path.join(root, "fixtures/semantic")).filter((name) => name.startsWith("org-instance-"));
  it("has a passing and a failing fixture", () => {
    const all = files.map((name) => read(`fixtures/semantic/${name}`));
    expect(all.some((f) => f.expect.length === 0)).toBe(true);
    expect(all.some((f) => f.expect.includes("FAC-SEM-177"))).toBe(true);
  });
  it.each(files)("%s yields exactly its expected codes", (name) => {
    const fixture = read(`fixtures/semantic/${name}`);
    expect(codes(fixture.input)).toEqual(fixture.expect);
  });
  it("flags each problem where it is", () => {
    const at = (change: Json) => evaluateSemanticRules("org-instance", { ...BASE, ...change }).map((f) => `${f.instancePath} ${f.message}`);
    expect(at({ issuedAt: "x", expiresAt: 3 })).toEqual([
      "/issuedAt a time is an RFC 3339 date-time with an offset, on a day that exists, with at most three fraction digits",
      "/expiresAt a time is an RFC 3339 date-time with an offset, on a day that exists, with at most three fraction digits"
    ]);
    expect(at({ notBefore: "2026-10-19T00:00:00Z" })).toEqual(["/notBefore notBefore is at or after issuedAt"]);
    expect(at({ notBefore: "2026-10-27T00:00:00Z" })).toEqual(["/expiresAt expiresAt is after notBefore"]);
    expect(at({ expiresAt: "2026-10-27T00:00:00.001Z" })).toEqual(["/expiresAt a statement expires at most 7 days after it is issued"]);
    expect(evaluateSemanticRules("not-a-kind-of-mine", BASE).filter((f) => f.code === "FAC-SEM-177")).toEqual([]);
  });
});
