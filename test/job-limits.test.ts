import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { USAGE_NUMBERS, intentIdempotencyKey, jobCallerAction, quotaDataOk, readJobPause, usageFindings } from "../src/job-limits.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { VECTOR_FILE, buildJobLimitVectors } from "../tools/vectors/job-limits.js";

type Json = Record<string, any>;
const root = projectRoot();
const read = (relative: string) => JSON.parse(readFileSync(path.join(root, relative), "utf8")) as Json;
const vectors = read(VECTOR_FILE);
const ajv = await createValidator();
const valid = (schema: string, doc: unknown) => validateDocument(ajv, `${SCHEMA_PREFIX}schemas/${schema}`, doc).valid;
const paths = (kind: string, value: unknown) => evaluateSemanticRules(kind, value as Json).map((finding) => `${finding.code} ${finding.instancePath}`);
const TZ = process.env.TZ;
afterAll(() => {
  if (TZ === undefined) delete process.env.TZ;
  else process.env.TZ = TZ;
});

describe("the schemas (DEC-0087)", () => {
  const job = (error: unknown) => ({ job: { id: "job_1", status: "failed", updatedAt: "2026-10-19T10:00:00Z", error } });
  it("constrains the data of quota-exhausted only", () => {
    expect(valid("interop-job.schema.json", job({ code: "quota-exhausted", message: "m", data: { retryable: true, resetsAt: "2026-10-19T12:00:00Z" } }))).toBe(true);
    expect(valid("interop-job.schema.json", job({ code: "quota-exhausted", message: "m", data: { retryable: false } }))).toBe(true);
    expect(valid("interop-job.schema.json", job({ code: "quota-exhausted", message: "m" }))).toBe(false);
    expect(valid("interop-job.schema.json", job({ code: "quota-exhausted", message: "m", data: { retryable: false, resetsAt: "2026-10-19T12:00:00Z" } }))).toBe(false);
    expect(valid("interop-job.schema.json", job({ code: "quota-exhausted", message: "m", data: { retryable: true, resetsAt: "2026-10-19T14:00:00+02:00" } }))).toBe(false);
    expect(valid("interop-job.schema.json", job({ code: "quota-exhausted", message: "m", data: { retryable: true, scope: "model" } }))).toBe(false);
    expect(valid("interop-job.schema.json", job({ code: "outcome-unknown", message: "m" }))).toBe(true);
    expect(valid("interop-job.schema.json", job({ code: "outcome-unknown", message: "m", data: { anything: 1 } }))).toBe(true);
    expect(valid("interop-job.schema.json", job({ code: "other", message: "m", data: { retryable: "x" } }))).toBe(true);
  });
  it("admits null for every number of a usage and an optional partial", () => {
    const schema = read("schemas/common.schema.json").$defs.usage;
    for (const name of USAGE_NUMBERS) expect(schema.properties[name].type, name).toContain("null");
    expect(schema.properties.partial.type).toBe("boolean");
    expect(schema.additionalProperties).toBe(false);
  });
});

describe("the vectors (DEC-0087)", () => {
  it("are the generator's output", () => {
    expect(buildJobLimitVectors()).toBe(readFileSync(path.join(root, VECTOR_FILE), "utf8"));
  });
  it.each(vectors.pause as Json[])("pause: $name", (entry) => {
    expect(readJobPause(entry.answer)).toEqual(entry.expected);
  });
  it.each(vectors.caller as Json[])("caller: $name", (entry) => {
    expect(jobCallerAction(entry.answer, entry.now)).toEqual(entry.expected);
  });
  it.each(vectors.key as Json[])("key: $name", (entry) => {
    expect(intentIdempotencyKey(entry.intent) ?? null).toBe(entry.expected);
  });
  it.each(vectors.usage as Json[])("usage: $name", (entry) => {
    expect(paths("usage", entry.usage)).toEqual(entry.findings);
  });
  it("hold the same answers in UTC, in America/St_Johns and in Pacific/Kiritimati", () => {
    for (const name of ["UTC", "America/St_Johns", "Pacific/Kiritimati"]) {
      process.env.TZ = name;
      for (const entry of vectors.caller as Json[]) expect(jobCallerAction(entry.answer, entry.now), `${name} ${entry.name}`).toEqual(entry.expected);
      for (const entry of vectors.pause as Json[]) expect(readJobPause(entry.answer), `${name} ${entry.name}`).toEqual(entry.expected);
    }
  });
  it("write a key of version 8 and variant 10, the same for the same intent", () => {
    const keys = (vectors.key as Json[]).map((entry) => entry.expected).filter((key): key is string => key !== null);
    for (const key of keys) expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(keys[0]).toBe(keys[1]);
    expect(new Set(keys).size).toBe(keys.length - 1);
  });
});

describe("the reference reads what the schema reads (the retro's standing instruction)", () => {
  const base = { job: { id: "job_1", status: "failed", updatedAt: "2026-10-19T10:00:00Z", error: { code: "quota-exhausted", message: "m", data: { retryable: true, resetsAt: "2026-10-19T12:00:00Z" } } } };
  const mutations: Array<[string, unknown]> = [
    ["no data", undefined],
    ["retryable missing", { resetsAt: "2026-10-19T12:00:00Z" }],
    ["retryable a string", { retryable: "true" }],
    ["retryable null", { retryable: null }],
    ["a reset with retryable false", { retryable: false, resetsAt: "2026-10-19T12:00:00Z" }],
    ["a reset at an offset", { retryable: true, resetsAt: "2026-10-19T14:00:00+02:00" }],
    ["a reset in lower case", { retryable: true, resetsAt: "2026-10-19t12:00:00z" }],
    ["a reset without seconds", { retryable: true, resetsAt: "2026-10-19T12:00Z" }],
    ["a leap second", { retryable: true, resetsAt: "2026-12-31T23:59:60Z" }],
    ["a numeric reset", { retryable: true, resetsAt: 1 }],
    ["another member", { retryable: true, scope: "model" }],
    ["an array", [true]],
    ["a string", "retryable"]
  ];
  it.each(mutations)("%s: the schema refuses it and so does the reference", (_name, data) => {
    const doc = structuredClone(base) as Json;
    if (data === undefined) delete doc.job.error.data;
    else doc.job.error.data = data;
    expect(valid("interop-job.schema.json", doc)).toBe(false);
    expect(quotaDataOk(doc.job.error.data)).toBe(false);
    expect(jobCallerAction(doc, "2026-10-19T10:00:00Z")).toEqual({ action: "invalid" });
  });
  it("accepts what the schema accepts", () => {
    for (const data of [{ retryable: true }, { retryable: false }, { retryable: true, resetsAt: "2026-10-19T12:00:00.5Z" }]) {
      const doc = structuredClone(base) as Json;
      doc.job.error.data = data;
      expect(valid("interop-job.schema.json", doc)).toBe(true);
      expect(quotaDataOk(data)).toBe(true);
    }
  });
});

describe("totality: every function answers and never throws", () => {
  const HOSTILE: unknown[] = [undefined, null, 0, Number.NaN, "", "x", [], {}, { job: null }, { job: [] }, { job: { id: 1, status: "working" } }, Object.create(null), { toString: 1 }];
  it("reads anything", () => {
    for (const a of HOSTILE) {
      expect(() => readJobPause(a)).not.toThrow();
      expect(() => jobCallerAction(a, a)).not.toThrow();
      expect(() => jobCallerAction({ job: { id: "j", status: "failed", error: a } }, "2026-10-19T10:00:00Z")).not.toThrow();
      expect(() => intentIdempotencyKey(a)).not.toThrow();
      expect(() => intentIdempotencyKey({ agentId: "a", capability: "c", input: { a } })).not.toThrow();
      expect(() => usageFindings(a, "")).not.toThrow();
      expect(() => quotaDataOk(a)).not.toThrow();
    }
  });
  it("gives no key to an input with no RFC 8785 form", () => {
    expect(intentIdempotencyKey({ agentId: "a", capability: "c", input: { n: Number.POSITIVE_INFINITY } })).toBeUndefined();
    expect(intentIdempotencyKey({ agentId: "a", capability: "c", input: { s: "\ud800" } })).toBeUndefined();
  });
  it("reads no inherited member", () => {
    const inherited = Object.create({ job: { id: "j", status: "working" } }) as Json;
    expect(jobCallerAction(inherited, "2026-10-19T10:00:00Z")).toEqual({ action: "invalid" });
    expect(readJobPause(inherited)).toEqual({ paused: false });
  });
});

describe("the rules (FAC-SEM-119, FAC-SEM-120)", () => {
  const working = (statusMessage: string) => ({ job: { id: "j", status: "working", updatedAt: "2026-10-19T10:00:00Z", statusMessage } });
  it("FAC-SEM-119 on a job: the pause grammar, a reset on a day that exists, the result's usage", () => {
    expect(paths("interop-job", working("quota-exhausted until 2026-10-19T12:00:00Z"))).toEqual([]);
    expect(paths("interop-job", working("quota-exhausted, later"))).toEqual(["FAC-SEM-119 /job/statusMessage"]);
    const day = { job: { id: "j", status: "failed", updatedAt: "2026-10-19T10:00:00Z", error: { code: "quota-exhausted", message: "m", data: { retryable: true, resetsAt: "2026-02-30T12:00:00Z" } } } };
    expect(paths("interop-job", day)).toEqual(["FAC-SEM-119 /job/error/data/resetsAt"]);
    day.job.error.data.resetsAt = "2026-02-28T12:00:00Z";
    expect(paths("interop-job", day)).toEqual([]);
    const other = { job: { id: "j", status: "failed", updatedAt: "2026-10-19T10:00:00Z", error: { code: "other", message: "m", data: { resetsAt: "2026-02-30T12:00:00Z" } } } };
    expect(paths("interop-job", other)).toEqual([]);
    const done = { job: { id: "j", status: "completed", updatedAt: "2026-10-19T10:00:00Z", result: { usage: { inputTokens: null, outputTokens: 1, wallMs: 1, partial: false } } } };
    expect(paths("interop-job", done)).toEqual(["FAC-SEM-119 /job/result/usage/partial"]);
    expect(paths("interop-job", {})).toEqual([]);
  });
  it("FAC-SEM-120: a caller's act against jobCallerAction's", () => {
    const answer = working("quota-exhausted until 2026-10-19T12:00:00Z");
    expect(paths("job-caller", { answer, now: "2026-10-19T10:00:00Z", action: { action: "wait", notBefore: "2026-10-19T12:00:00Z" } })).toEqual([]);
    expect(paths("job-caller", { answer, now: "2026-10-19T10:00:00Z", action: { action: "poll" } })).toEqual(["FAC-SEM-120 /action"]);
    expect(paths("job-caller", { answer: {}, now: "x", action: { action: "invalid" } })).toEqual([]);
  });
});

describe("job-limits semantic fixtures (FAC-SEM-119, FAC-SEM-120)", () => {
  const files = readdirSync(path.join(root, "fixtures/semantic")).filter((name) => name.startsWith("job-limits-"));
  it("has fixtures for both rules", () => {
    expect(files.length).toBeGreaterThanOrEqual(6);
  });
  it.each(files)("%s", (file) => {
    const fixture = read(`fixtures/semantic/${file}`);
    const codes = [...new Set(evaluateSemanticRules(fixture.kind, fixture.input).map((finding) => finding.code))];
    expect(codes).toEqual(fixture.expect);
  });
});
