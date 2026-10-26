import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import {
  MAX_ITEMS,
  MAX_REQUESTS,
  ORG_ADAPTATION_PATH,
  ORG_ADAPTATION_REFUSALS,
  adaptationDigest,
  adaptationFindings,
  adaptationReceipt,
  decideAdaptation,
  orgAdaptationRules,
  requestDigest
} from "../src/org-adaptation.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { VECTOR_FILE, buildOrgAdaptationVectors } from "../tools/vectors/org-adaptation.js";

// DEC-0138: the organization part of an adaptation plan, sent whole by the person's node and kept by revision.
const root = projectRoot();
type Json = Record<string, any>;
const read = (relative: string) => JSON.parse(readFileSync(path.join(root, relative), "utf8")) as Json;
const validator = await createValidator();
const valid = (value: unknown, schema: string) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}.schema.json`, value).valid;
const vectors = read(VECTOR_FILE);
const plan = read("fixtures/positive/org-adaptation.json");

describe("org-adaptation/1 (DEC-0138)", () => {
  it("keeps the vector file equal to its generator", () => {
    expect(readFileSync(path.join(root, VECTOR_FILE), "utf8")).toBe(buildOrgAdaptationVectors());
  });

  it("answers every digest vector", () => {
    for (const vector of vectors.digests) {
      const answer = vector.name.startsWith("request") ? requestDigest(vector.value) : adaptationDigest(vector.value);
      expect(answer, vector.name).toBe(vector.digest);
    }
    expect(adaptationDigest("a plan")).toBeUndefined();
    expect(requestDigest(null)).toBeUndefined();
    expect(adaptationDigest({ n: Number.NaN })).toBeUndefined();
  });

  it("decides every PUT as the vectors say", () => {
    for (const vector of vectors.decide) expect(decideAdaptation(vector.plan, vector.context), vector.name).toEqual(vector.expected);
    expect(decideAdaptation("x", { valid: true, org: plan.org })).toEqual({ outcome: "refused", refusal: "malformed" });
    expect(decideAdaptation({ ...plan, revision: 1.5 }, { valid: true, org: plan.org })).toEqual({ outcome: "refused", refusal: "malformed" });
    expect(decideAdaptation({ ...plan, extra: Number.POSITIVE_INFINITY }, { valid: true, org: plan.org })).toEqual({ outcome: "refused", refusal: "malformed" });
    expect([...new Set(vectors.decide.filter((v: Json) => v.expected.refusal).map((v: Json) => v.expected.refusal))].sort()).toEqual([...ORG_ADAPTATION_REFUSALS].sort());
  });

  it("binds each decision to its request's digest", () => {
    for (const vector of vectors.receipts) {
      const receipt = adaptationReceipt(vector.plan, vector.decisions);
      expect(receipt, vector.name).toEqual(vector.expected);
      expect(valid(receipt, "org-adaptation-receipt"), vector.name).toBe(true);
    }
    expect(adaptationReceipt({ ...plan, org: 7 }, [])).toBeUndefined();
    expect(adaptationReceipt({ ...plan, revision: "2" }, [])).toBeUndefined();
    expect(adaptationReceipt({ ...plan, requests: [{ kind: "role", role: "admin" }] }, [])).toBeUndefined();
    expect(adaptationReceipt({ ...plan, requests: "none" }, [])?.requests).toEqual([]);
    expect(adaptationReceipt({ ...plan, requests: [5] }, [])).toBeUndefined();
    expect(adaptationReceipt({ ...plan, x: Number.NaN }, [])).toBeUndefined();
  });

  it("holds FAC-SEM-153 through the public entry", () => {
    expect(adaptationFindings(plan)).toEqual([]);
    expect(orgAdaptationRules("org-key-set", plan)).toBeUndefined();
    const twice = { ...plan, items: [...plan.items, { ref: plan.items[0].ref, kind: "history" }], requests: [...plan.requests, plan.requests[2], 5] };
    expect(evaluateSemanticRules("org-adaptation", twice).map((f) => f.instancePath)).toEqual(["/items/2/ref", "/requests/3/id"]);
    expect(adaptationFindings({ ...plan, items: [7], requests: [{ id: "r-unknown-1", kind: "access", resource: "x", itemRef: "Zz9Yy8Xx7Ww6Vv5U" }] }).map((f) => f.instancePath)).toEqual(["/requests/0/itemRef"]);
    expect(adaptationFindings({ type: "org-adaptation/1" })).toEqual([]);
  });

  it("states its limits and route as the schema and the spec do", () => {
    const schema = read("schemas/org-adaptation.schema.json");
    expect(schema.properties.items.maxItems).toBe(MAX_ITEMS);
    expect(schema.properties.requests.maxItems).toBe(MAX_REQUESTS);
    expect(read("schemas/org-adaptation-receipt.schema.json").properties.requests.maxItems).toBe(MAX_REQUESTS);
    expect(readFileSync(path.join(root, "docs/specification/membership.md"), "utf8")).toContain(ORG_ADAPTATION_PATH);
    expect(schema.$defs.request.properties.role.const).toBe("admin");
  });
});
