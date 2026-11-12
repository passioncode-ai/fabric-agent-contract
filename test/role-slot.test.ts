import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { roleSlotRules, slotWrite } from "../src/role-slot.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { buildRoleSlotVectors, VECTOR_FILE } from "../tools/vectors/role-slot.js";

// DEC-0167: the estate's manager on the wire. The vectors are written by tools/vectors/role-slot.ts with hand-written
// expectations; the reference (slotWrite, the role-slot-succession rule) must give exactly those answers.
type Json = Record<string, any>;
const committed = readFileSync(path.join(projectRoot(), VECTOR_FILE), "utf8");
const vectors = JSON.parse(committed) as Json;
const codes = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((f) => `${f.code} ${f.instancePath}`);

describe("role-slot vectors (DEC-0167)", () => {
  it("is the file the generator writes", () => expect(committed).toBe(buildRoleSlotVectors()));
  it.each((vectors.writes as Json[]).map((c) => [c.name, c] as const))("write: %s", (_name, c) => {
    expect(slotWrite(c.input.slot, c.input.write)).toEqual(c.answer);
    expect(codes("role-slot-write", { ...c.input, answer: c.answer })).toEqual([]);
  });
  it.each((vectors.successions as Json[]).map((c) => [c.name, c] as const))("succession: %s", (_name, c) => {
    expect(codes("role-slot-succession", c.input)).toEqual(c.findings);
  });
});

describe("FAC-SEM-174 on the documents and wrappers (DEC-0167 MG-1 to MG-3)", () => {
  const write = vectors.writes[0].input as Json;
  it("flags a registry answer that is not slotWrite's, and a wrapper without its members", () => {
    expect(codes("role-slot-write", { ...write, answer: { ok: false, refused: "slot-epoch-stale" } })).toEqual(["FAC-SEM-174 /answer"]);
    expect(codes("role-slot-write", { slot: write.slot })).toEqual(["FAC-SEM-174 "]);
    expect(codes("role-slot-succession", { previous: write.slot })).toEqual(["FAC-SEM-174 "]);
  });
  it("reads a binding's and a context's project scope, and passes a pool", () => {
    expect(codes("binding", { project: "urn:project:a", scope: { project: "URN:project:a" } })).toEqual([]);
    expect(codes("binding", { project: "urn:project:a" })).toEqual([]);
    expect(codes("binding", { scope: { estate: "urn:estate:one" } })).toEqual([]);
    expect(codes("execution-context", { kind: "project-account-pool", project: "urn:project:a", scope: { project: "urn:project:b" } })).toEqual([]);
  });
  it("reads a slot's role against its scope", () => {
    expect(codes("role-slot", { ...write.slot, role: "product-manager", scope: { estate: "urn:estate:one" } })).toEqual(["FAC-SEM-174 /scope"]);
    expect(codes("role-slot", { ...write.slot, scope: {} })).toEqual(["FAC-SEM-174 /scope"]);
    expect(codes("role-slot", { ...write.slot, estate: 7 })).toEqual(["FAC-SEM-174 /scope/estate"]);
  });
  it("answers nothing for another kind", () => expect(roleSlotRules("roles", {})).toBeUndefined());
});
