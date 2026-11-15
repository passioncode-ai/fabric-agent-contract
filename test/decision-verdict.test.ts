import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { argsDigest, askedDigest, checkVerdictDispatch, verdictId } from "../src/decision-verdict.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { buildDecisionVerdictVectors, VECTOR_FILE } from "../tools/vectors/decision-verdict.js";

// DEC-0172: the decision verdict, decision-verdict/1, its reduction against the reference and the hub's dispatch check.
type Json = Record<string, any>;
const committed = readFileSync(path.join(projectRoot(), VECTOR_FILE), "utf8");
const vectors = JSON.parse(committed) as { hostKey: string; documents: Json[]; references: Json[]; dispatches: Json[] };
const hostKey = Buffer.from(vectors.hostKey, "hex");
const validator = await createValidator();
const valid = (schema: string, value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}.schema.json`, value).valid;
const codes = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((f) => `${f.code} ${f.instancePath}`);

describe("decision verdicts (DEC-0172)", () => {
  it("is the file the generator writes", () => expect(committed).toBe(buildDecisionVerdictVectors()));
  it.each(vectors.documents.map((c) => [c.name, c] as const))("document: %s", (_name, c) => {
    expect(valid("decision-verdict", c.verdict)).toBe(c.schemaValid);
    if (c.schemaValid) expect(codes("decision-verdict", c.verdict)).toEqual(c.findings);
  });
  it("derives every valid verdict's digests as the reference does", () => {
    for (const c of vectors.documents.filter((d) => d.schemaValid && d.findings.length === 0)) {
      const v = c.verdict;
      expect(v.askedDigest).toBe(askedDigest(v.asked));
      expect(v.id).toBe(verdictId({ askedDigest: v.askedDigest, caller: v.caller, policy: v.policy, session: v.session }));
      expect(v.asked.argsDigest).toBe(argsDigest(hostKey, { reviewId: "r-412", reply: "draft-7" }));
    }
  });
  it.each(vectors.references.map((c) => [c.name, c] as const))("reference: %s", (_name, c) => {
    expect(valid("decision-verdict", c.verdict)).toBe(true);
    expect(codes("decision-verdict-reference", { verdict: c.verdict, reference: c.reference })).toEqual(c.findings);
  });
  it.each(vectors.dispatches.map((c) => [c.name, c] as const))("dispatch: %s", (_name, c) => {
    if (c.call.verdict !== undefined) expect(valid("interop-agent-call-2", c.call)).toBe(true);
    expect(checkVerdictDispatch({ call: c.call, journal: c.journal ?? undefined, now: c.now, hostKey })).toEqual(c.answer);
  });
  it("keeps the first revision of agent.call closed: a verdict rides only in /2", () => {
    const call = (vectors.dispatches[0] as Json).call;
    expect(valid("interop-agent-call", call)).toBe(false);
    const { verdict: _v, ...plain } = call;
    expect(valid("interop-agent-call", plain)).toBe(true);
    expect(valid("interop-agent-call-2", plain)).toBe(true);
  });
  it("reads an incomplete verdict or reference without throwing", () => {
    const allow = (vectors.documents[0] as Json).verdict;
    expect(codes("decision-verdict", { verdict: "allow" })).toEqual([]);
    expect(codes("decision-verdict", { ...allow, asked: { bad: 1n === 1n ? "\uD800" : "" } })).toContain("FAC-SEM-179 /asked");
    expect(codes("decision-verdict-reference", { verdict: allow, reference: { check: "other" } })).toEqual(["FAC-SEM-179 /verdict/verdict"]);
    expect(codes("decision-verdict-reference", { verdict: allow, reference: "none" })).toEqual(["FAC-SEM-179 /verdict/verdict"]);
    expect(codes("decision-verdict-reference", { verdict: "none" })).toEqual([]);
    for (const route of ["toString", "constructor", "__proto__"]) expect(() => codes("decision-verdict", { ...allow, route })).not.toThrow();
    expect(checkVerdictDispatch({ call: { verdict: "x" }, journal: allow, now: "2026-11-15T10:05:00Z", hostKey })).toEqual({ ok: false, code: "decision-invalid", data: { detail: "verdict-mismatch" } });
    expect(checkVerdictDispatch({ call: { ...(vectors.dispatches[0] as Json).call }, journal: { ...allow, asked: "none" }, now: "2026-11-15T10:05:00Z", hostKey })).toEqual({ ok: false, code: "decision-invalid", data: { detail: "verdict-mismatch" } });
  });
});
